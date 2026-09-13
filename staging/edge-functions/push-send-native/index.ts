// VYVE Health — push-send-native v7
// v7 (PM-1181): ANDROID FCM LEG. Android subs are delivered via FCM HTTP v1 using a
// Firebase service account in secret FCM_SERVICE_ACCOUNT (JSON). iOS/APNs path
// unchanged. If the secret is missing, Android subs are skipped with a reason
// (never fails the iOS send). UNREGISTERED / bad-token responses revoke, mirroring APNs.
// v6: cross-environment retry + self-heal. On 400 BadDeviceToken, retry the
// same token against the OTHER APNs host (prod<->sandbox). On success, persist
// the corrected `environment` so future sends route directly. Only revoke when
// BOTH environments reject the token. Fixes dev/sandbox tokens mis-stamped as
// production (and vice versa). All other behaviour byte-identical to v5.
//
// verify_jwt: false — invoked by service role (EFs, cron, manual smoke tests).
// AUTH: literal compare against runtime SUPABASE_SERVICE_ROLE_KEY.
//
// Allowlist (fail-closed by default):
//   unset/empty -> nobody; "disabled" -> no allowlist; "a@x,b@x" -> those only.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const APNS_AUTH_KEY = Deno.env.get('APNS_AUTH_KEY') ?? '';
const APNS_KEY_ID = Deno.env.get('APNS_KEY_ID') ?? '';
const APNS_TEAM_ID = Deno.env.get('APNS_TEAM_ID') ?? '';
const APNS_BUNDLE_ID = Deno.env.get('APNS_BUNDLE_ID') ?? '';
const ALLOWLIST_RAW = Deno.env.get('NATIVE_PUSH_ALLOWLIST') ?? '';
const ALLOWLIST_DISABLED = ALLOWLIST_RAW.trim().toLowerCase() === 'disabled';
const NATIVE_PUSH_ALLOWLIST = ALLOWLIST_DISABLED ? null : ALLOWLIST_RAW.split(',').map((s)=>s.trim().toLowerCase()).filter(Boolean);
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};
function db(path, opts = {}) {
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...opts,
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      ...opts.headers || {}
    }
  });
}
function b64u(buf) {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = '';
  bytes.forEach((x)=>s += String.fromCharCode(x));
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}
function pemToPkcs8(pem) {
  const stripped = pem.replace(/-----BEGIN PRIVATE KEY-----/g, '').replace(/-----END PRIVATE KEY-----/g, '').replace(/\s/g, '');
  if (!stripped) throw new Error('APNS_AUTH_KEY appears empty after stripping PEM headers');
  const raw = atob(stripped);
  return Uint8Array.from(raw, (c)=>c.charCodeAt(0));
}
let cachedJwt = null;
async function makeApnsJwt() {
  const now = Math.floor(Date.now() / 1000);
  if (cachedJwt && cachedJwt.exp > now + 600) return cachedJwt.token;
  if (!APNS_AUTH_KEY || !APNS_KEY_ID || !APNS_TEAM_ID || !APNS_BUNDLE_ID) {
    throw new Error('APNs secrets missing: need APNS_AUTH_KEY, APNS_KEY_ID, APNS_TEAM_ID, APNS_BUNDLE_ID');
  }
  const enc = new TextEncoder();
  const header = b64u(enc.encode(JSON.stringify({
    alg: 'ES256',
    kid: APNS_KEY_ID,
    typ: 'JWT'
  })));
  const claims = b64u(enc.encode(JSON.stringify({
    iss: APNS_TEAM_ID,
    iat: now
  })));
  const signingInput = `${header}.${claims}`;
  const pkcs8 = pemToPkcs8(APNS_AUTH_KEY);
  const privKey = await crypto.subtle.importKey('pkcs8', pkcs8.buffer.slice(pkcs8.byteOffset, pkcs8.byteOffset + pkcs8.byteLength), {
    name: 'ECDSA',
    namedCurve: 'P-256'
  }, false, [
    'sign'
  ]);
  const sig = await crypto.subtle.sign({
    name: 'ECDSA',
    hash: 'SHA-256'
  }, privKey, enc.encode(signingInput));
  const jwt = `${signingInput}.${b64u(sig)}`;
  cachedJwt = {
    token: jwt,
    exp: now + 3600
  };
  return jwt;
}
// ─── FCM HTTP v1 (Android) ───────────────────────────────────────────────────
const FCM_SA_RAW = Deno.env.get('FCM_SERVICE_ACCOUNT') ?? '';
let fcmSa = null;
try {
  if (FCM_SA_RAW) fcmSa = JSON.parse(FCM_SA_RAW);
} catch  {
  fcmSa = null;
}
let cachedFcmToken = null;
async function makeFcmAccessToken() {
  const now = Math.floor(Date.now() / 1000);
  if (cachedFcmToken && cachedFcmToken.exp > now + 300) return cachedFcmToken.token;
  if (!fcmSa || !fcmSa.client_email || !fcmSa.private_key || !fcmSa.project_id) {
    throw new Error('FCM_SERVICE_ACCOUNT missing or malformed (needs client_email, private_key, project_id)');
  }
  const enc = new TextEncoder();
  const header = b64u(enc.encode(JSON.stringify({
    alg: 'RS256',
    typ: 'JWT'
  })));
  const claims = b64u(enc.encode(JSON.stringify({
    iss: fcmSa.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600
  })));
  const signingInput = `${header}.${claims}`;
  const pkcs8 = pemToPkcs8(fcmSa.private_key);
  const key = await crypto.subtle.importKey('pkcs8', pkcs8.buffer.slice(pkcs8.byteOffset, pkcs8.byteOffset + pkcs8.byteLength), {
    name: 'RSASSA-PKCS1-v1_5',
    hash: 'SHA-256'
  }, false, [
    'sign'
  ]);
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, enc.encode(signingInput));
  const assertion = `${signingInput}.${b64u(sig)}`;
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded'
    },
    body: `grant_type=${encodeURIComponent('urn:ietf:params:oauth:grant-type:jwt-bearer')}&assertion=${encodeURIComponent(assertion)}`
  });
  const j = await res.json().catch(()=>({}));
  if (!res.ok || !j.access_token) throw new Error(`FCM oauth failed ${res.status}: ${JSON.stringify(j).slice(0, 300)}`);
  cachedFcmToken = {
    token: j.access_token,
    exp: now + Math.min(3600, Number(j.expires_in || 3600))
  };
  return cachedFcmToken.token;
}
async function sendFcmPush(token, accessToken, title, text, customData) {
  const data = {};
  for (const [k, v] of Object.entries(customData))data[k] = typeof v === 'string' ? v : JSON.stringify(v);
  const url = `https://fcm.googleapis.com/v1/projects/${fcmSa.project_id}/messages:send`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'authorization': `Bearer ${accessToken}`,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        message: {
          token,
          notification: {
            title,
            body: text
          },
          data,
          android: {
            priority: 'high',
            notification: {
              sound: 'default'
            }
          }
        }
      })
    });
    if (res.ok) return {
      status: res.status,
      ok: true
    };
    let reason = '';
    try {
      const err = await res.json();
      const details = err?.error?.details || [];
      const fcmErr = details.find((d)=>d && d.errorCode);
      reason = fcmErr && fcmErr.errorCode || err?.error?.status || err?.error?.message || '';
    } catch  {}
    return {
      status: res.status,
      ok: false,
      reason
    };
  } catch (e) {
    console.error('[push-send-native] fcm fetch error:', token.slice(0, 12), e);
    return {
      status: 0,
      ok: false,
      reason: String(e)
    };
  }
}
function hostFor(env) {
  return env === 'development' ? 'api.development.push.apple.com' : 'api.push.apple.com';
}
async function sendApnsPush(token, environment, jwt, payload) {
  const url = `https://${hostFor(environment)}/3/device/${token}`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'authorization': `bearer ${jwt}`,
        'apns-topic': APNS_BUNDLE_ID,
        'apns-push-type': 'alert',
        'apns-priority': '10',
        'apns-expiration': '0',
        'content-type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    if (res.ok) return {
      status: res.status,
      ok: true
    };
    let reason = '';
    try {
      const errBody = await res.json();
      reason = errBody?.reason || '';
    } catch  {}
    return {
      status: res.status,
      ok: false,
      reason
    };
  } catch (e) {
    console.error('[push-send-native] fetch error:', token.slice(0, 12), e);
    return {
      status: 0,
      ok: false,
      reason: String(e)
    };
  }
}
// Try stored environment; on BadDeviceToken, try the opposite environment.
// Returns the winning result plus the environment that actually worked (if it
// differs from the stored one, the caller persists the correction).
async function deliverWithRetry(sub, jwt, payload) {
  const primaryEnv = sub.environment === 'development' ? 'development' : 'production';
  const first = await sendApnsPush(sub.token, primaryEnv, jwt, payload);
  if (first.ok) return {
    result: first,
    healedEnv: null
  };
  if (first.status === 400 && first.reason === 'BadDeviceToken') {
    const altEnv = primaryEnv === 'development' ? 'production' : 'development';
    const second = await sendApnsPush(sub.token, altEnv, jwt, payload);
    if (second.ok) return {
      result: second,
      healedEnv: altEnv
    };
    // Both environments rejected -> return whichever is the more definitive dead signal
    return {
      result: second.status === 400 ? second : first,
      healedEnv: null
    };
  }
  return {
    result: first,
    healedEnv: null
  };
}
serve(async (req)=>{
  if (req.method === 'OPTIONS') return new Response('ok', {
    headers: CORS
  });
  const authHeader = req.headers.get('Authorization') ?? '';
  if (!SUPABASE_KEY || authHeader !== `Bearer ${SUPABASE_KEY}`) {
    return new Response(JSON.stringify({
      error: 'service role required'
    }), {
      status: 403,
      headers: {
        ...CORS,
        'Content-Type': 'application/json'
      }
    });
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({
      error: 'method not allowed'
    }), {
      status: 405,
      headers: {
        ...CORS,
        'Content-Type': 'application/json'
      }
    });
  }
  let body;
  try {
    body = await req.json();
  } catch  {
    return new Response(JSON.stringify({
      error: 'invalid json'
    }), {
      status: 400,
      headers: {
        ...CORS,
        'Content-Type': 'application/json'
      }
    });
  }
  const title = String(body.title || '').trim();
  const text = String(body.body || '').trim();
  if (!title || !text) {
    return new Response(JSON.stringify({
      error: 'title and body required'
    }), {
      status: 400,
      headers: {
        ...CORS,
        'Content-Type': 'application/json'
      }
    });
  }
  const customData = body.data && typeof body.data === 'object' ? body.data : {};
  const memberEmails = Array.isArray(body.member_emails) ? body.member_emails.map((e)=>String(e).toLowerCase()) : [];
  const explicitTokens = Array.isArray(body.tokens) ? body.tokens.map((t)=>String(t)) : [];
  if (memberEmails.length === 0 && explicitTokens.length === 0) {
    return new Response(JSON.stringify({
      error: 'member_emails or tokens required'
    }), {
      status: 400,
      headers: {
        ...CORS,
        'Content-Type': 'application/json'
      }
    });
  }
  const subsById = new Map();
  if (memberEmails.length > 0) {
    const filter = memberEmails.map((e)=>`"${e.replace(/"/g, '%22')}"`).join(',');
    const r = await db(`push_subscriptions_native?member_email=in.(${filter})&revoked_at=is.null&select=id,member_email,token,platform,environment`);
    if (r.ok) for (const row of (await r.json()))subsById.set(row.id, row);
  }
  if (explicitTokens.length > 0) {
    const filter = explicitTokens.map((t)=>`"${t.replace(/"/g, '%22')}"`).join(',');
    const r = await db(`push_subscriptions_native?token=in.(${filter})&revoked_at=is.null&select=id,member_email,token,platform,environment`);
    if (r.ok) for (const row of (await r.json()))subsById.set(row.id, row);
  }
  let subs = Array.from(subsById.values());
  if (subs.length === 0) {
    console.log('[push-send-native v7] no active subscriptions match');
    return new Response(JSON.stringify({
      ok: true,
      sent: 0,
      revoked: 0,
      healed: 0,
      skipped: 0,
      results: []
    }), {
      headers: {
        ...CORS,
        'Content-Type': 'application/json'
      }
    });
  }
  const skipped = [];
  if (NATIVE_PUSH_ALLOWLIST !== null) {
    const filtered = [];
    for (const s of subs){
      if (NATIVE_PUSH_ALLOWLIST.length > 0 && NATIVE_PUSH_ALLOWLIST.includes(s.member_email)) {
        filtered.push(s);
      } else {
        skipped.push({
          member_email: s.member_email,
          token_prefix: s.token.slice(0, 12) + '\u2026',
          reason: NATIVE_PUSH_ALLOWLIST.length === 0 ? 'NATIVE_PUSH_ALLOWLIST unset or empty (fail-closed)' : 'not on NATIVE_PUSH_ALLOWLIST'
        });
      }
    }
    subs = filtered;
  }
  const iosSubs = [];
  const androidSubs = [];
  for (const s of subs){
    if (s.platform === 'ios') iosSubs.push(s);
    else if (s.platform === 'android') {
      if (fcmSa) androidSubs.push(s);
      else skipped.push({
        member_email: s.member_email,
        token_prefix: s.token.slice(0, 12) + '\u2026',
        reason: 'FCM_SERVICE_ACCOUNT secret not set'
      });
    }
  }
  if (iosSubs.length === 0 && androidSubs.length === 0) {
    console.log(`[push-send-native v7] all ${skipped.length} subs filtered out`);
    return new Response(JSON.stringify({
      ok: true,
      sent: 0,
      revoked: 0,
      healed: 0,
      skipped: skipped.length,
      results: [],
      skipped_detail: skipped
    }), {
      headers: {
        ...CORS,
        'Content-Type': 'application/json'
      }
    });
  }
  const apnsPayload = {
    aps: {
      alert: {
        title,
        body: text
      },
      sound: 'default'
    },
    ...customData
  };
  let jwt = '';
  if (iosSubs.length > 0) {
    try {
      jwt = await makeApnsJwt();
    } catch (e) {
      console.error('[push-send-native] JWT generation failed:', e);
      return new Response(JSON.stringify({
        error: 'apns jwt error',
        detail: String(e)
      }), {
        status: 500,
        headers: {
          ...CORS,
          'Content-Type': 'application/json'
        }
      });
    }
  }
  // Android leg (v7). An FCM auth failure skips Android with a reason; it never blocks iOS.
  let fcmAccess = '';
  const androidResults = [];
  if (androidSubs.length > 0) {
    try {
      fcmAccess = await makeFcmAccessToken();
      const rs = await Promise.all(androidSubs.map((s)=>sendFcmPush(s.token, fcmAccess, title, text, customData)));
      rs.forEach((r, i)=>androidResults.push({
          sub: androidSubs[i],
          result: r
        }));
    } catch (e) {
      console.error('[push-send-native] FCM auth failed:', e);
      for (const s of androidSubs)skipped.push({
        member_email: s.member_email,
        token_prefix: s.token.slice(0, 12) + '\u2026',
        reason: 'fcm auth error: ' + String(e).slice(0, 200)
      });
    }
  }
  const delivered = await Promise.all(iosSubs.map((s)=>deliverWithRetry(s, jwt, apnsPayload)));
  const nowIso = new Date().toISOString();
  let sent = 0, revoked = 0, healed = 0;
  const dbWrites = [];
  const results = [];
  for(let i = 0; i < delivered.length; i++){
    const { result: r, healedEnv } = delivered[i];
    const sub = iosSubs[i];
    const token_prefix = sub.token.slice(0, 12) + '\u2026';
    results.push({
      member_email: sub.member_email,
      token_prefix,
      status: r.status,
      ok: r.ok,
      reason: r.reason,
      healed_env: healedEnv
    });
    if (r.ok) {
      sent++;
      const patch = {
        last_used_at: nowIso
      };
      if (healedEnv) {
        patch.environment = healedEnv;
        healed++;
      }
      dbWrites.push(db(`push_subscriptions_native?id=eq.${sub.id}`, {
        method: 'PATCH',
        headers: {
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(patch)
      }));
      if (healedEnv) console.log(`[push-send-native] healed ${token_prefix} member=${sub.member_email} -> ${healedEnv}`);
      continue;
    }
    const deadToken = r.status === 410 || r.status === 400 && (r.reason === 'BadDeviceToken' || r.reason === 'DeviceTokenNotForTopic');
    if (deadToken) {
      revoked++;
      dbWrites.push(db(`push_subscriptions_native?id=eq.${sub.id}`, {
        method: 'PATCH',
        headers: {
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          revoked_at: nowIso
        })
      }));
      console.warn(`[push-send-native] revoked ${token_prefix} member=${sub.member_email} reason=${r.reason} (both environments rejected)`);
    } else if (r.status === 403 && r.reason === 'InvalidProviderToken') {
      console.error(`[push-send-native] InvalidProviderToken — APNs auth key/kid/iss wrong. Check APNS_AUTH_KEY, APNS_KEY_ID, APNS_TEAM_ID.`);
    } else {
      console.warn(`[push-send-native] failed status=${r.status} reason=${r.reason} token=${token_prefix}`);
    }
  }
  for (const { sub, result: r } of androidResults){
    const token_prefix = sub.token.slice(0, 12) + '\u2026';
    results.push({
      member_email: sub.member_email,
      token_prefix,
      platform: 'android',
      status: r.status,
      ok: r.ok,
      reason: r.reason
    });
    if (r.ok) {
      sent++;
      dbWrites.push(db(`push_subscriptions_native?id=eq.${sub.id}`, {
        method: 'PATCH',
        headers: {
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          last_used_at: nowIso
        })
      }));
      continue;
    }
    const dead = r.status === 404 || r.reason === 'UNREGISTERED' || r.reason === 'INVALID_ARGUMENT' || r.reason === 'SENDER_ID_MISMATCH';
    if (dead) {
      revoked++;
      dbWrites.push(db(`push_subscriptions_native?id=eq.${sub.id}`, {
        method: 'PATCH',
        headers: {
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          revoked_at: nowIso
        })
      }));
      console.warn(`[push-send-native] revoked android ${token_prefix} member=${sub.member_email} reason=${r.reason}`);
    } else {
      console.warn(`[push-send-native] fcm failed status=${r.status} reason=${r.reason} token=${token_prefix}`);
    }
  }
  await Promise.all(dbWrites);
  const totalTargets = iosSubs.length + androidSubs.length + skipped.length;
  console.log(`[push-send-native v7] sent=${sent} healed=${healed} revoked=${revoked} skipped=${skipped.length} of ${totalTargets} targets (ios=${iosSubs.length} android=${androidSubs.length})`);
  return new Response(JSON.stringify({
    ok: true,
    sent,
    revoked,
    healed,
    skipped: skipped.length,
    total_targets: totalTargets,
    results,
    skipped_detail: skipped,
    allowlist_active: NATIVE_PUSH_ALLOWLIST !== null
  }), {
    headers: {
      ...CORS,
      'Content-Type': 'application/json'
    }
  });
});
