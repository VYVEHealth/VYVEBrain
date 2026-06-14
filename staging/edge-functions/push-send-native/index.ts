// VYVE Health — push-send-native v6
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

const APNS_AUTH_KEY  = Deno.env.get('APNS_AUTH_KEY')  ?? '';
const APNS_KEY_ID    = Deno.env.get('APNS_KEY_ID')    ?? '';
const APNS_TEAM_ID   = Deno.env.get('APNS_TEAM_ID')   ?? '';
const APNS_BUNDLE_ID = Deno.env.get('APNS_BUNDLE_ID') ?? '';

const ALLOWLIST_RAW = Deno.env.get('NATIVE_PUSH_ALLOWLIST') ?? '';
const ALLOWLIST_DISABLED = ALLOWLIST_RAW.trim().toLowerCase() === 'disabled';
const NATIVE_PUSH_ALLOWLIST: string[] | null = ALLOWLIST_DISABLED
  ? null
  : ALLOWLIST_RAW.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function db(path: string, opts: RequestInit = {}) {
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...opts,
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      ...(opts.headers as Record<string, string> || {}),
    },
  });
}

function b64u(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = ''; bytes.forEach(x => s += String.fromCharCode(x));
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function pemToPkcs8(pem: string): Uint8Array {
  const stripped = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s/g, '');
  if (!stripped) throw new Error('APNS_AUTH_KEY appears empty after stripping PEM headers');
  const raw = atob(stripped);
  return Uint8Array.from(raw, c => c.charCodeAt(0));
}

let cachedJwt: { token: string; exp: number } | null = null;

async function makeApnsJwt(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedJwt && cachedJwt.exp > now + 600) return cachedJwt.token;

  if (!APNS_AUTH_KEY || !APNS_KEY_ID || !APNS_TEAM_ID || !APNS_BUNDLE_ID) {
    throw new Error('APNs secrets missing: need APNS_AUTH_KEY, APNS_KEY_ID, APNS_TEAM_ID, APNS_BUNDLE_ID');
  }

  const enc = new TextEncoder();
  const header = b64u(enc.encode(JSON.stringify({ alg: 'ES256', kid: APNS_KEY_ID, typ: 'JWT' })));
  const claims = b64u(enc.encode(JSON.stringify({ iss: APNS_TEAM_ID, iat: now })));
  const signingInput = `${header}.${claims}`;

  const pkcs8 = pemToPkcs8(APNS_AUTH_KEY);
  const privKey = await crypto.subtle.importKey(
    'pkcs8',
    pkcs8.buffer.slice(pkcs8.byteOffset, pkcs8.byteOffset + pkcs8.byteLength),
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    privKey,
    enc.encode(signingInput),
  );

  const jwt = `${signingInput}.${b64u(sig)}`;
  cachedJwt = { token: jwt, exp: now + 3600 };
  return jwt;
}

interface NativeSub {
  id: string;
  member_email: string;
  token: string;
  platform: 'ios' | 'android';
  environment: 'development' | 'production';
}

interface SendResult {
  status: number;
  ok: boolean;
  reason?: string;
}

function hostFor(env: string): string {
  return env === 'development' ? 'api.development.push.apple.com' : 'api.push.apple.com';
}

async function sendApnsPush(
  token: string,
  environment: string,
  jwt: string,
  payload: Record<string, unknown>,
): Promise<SendResult> {
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
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (res.ok) return { status: res.status, ok: true };
    let reason = '';
    try { const errBody = await res.json(); reason = errBody?.reason || ''; } catch { /* non-JSON */ }
    return { status: res.status, ok: false, reason };
  } catch (e) {
    console.error('[push-send-native] fetch error:', token.slice(0, 12), e);
    return { status: 0, ok: false, reason: String(e) };
  }
}

// Try stored environment; on BadDeviceToken, try the opposite environment.
// Returns the winning result plus the environment that actually worked (if it
// differs from the stored one, the caller persists the correction).
async function deliverWithRetry(
  sub: NativeSub,
  jwt: string,
  payload: Record<string, unknown>,
): Promise<{ result: SendResult; healedEnv: string | null }> {
  const primaryEnv = sub.environment === 'development' ? 'development' : 'production';
  const first = await sendApnsPush(sub.token, primaryEnv, jwt, payload);
  if (first.ok) return { result: first, healedEnv: null };
  if (first.status === 400 && first.reason === 'BadDeviceToken') {
    const altEnv = primaryEnv === 'development' ? 'production' : 'development';
    const second = await sendApnsPush(sub.token, altEnv, jwt, payload);
    if (second.ok) return { result: second, healedEnv: altEnv };
    // Both environments rejected -> return whichever is the more definitive dead signal
    return { result: second.status === 400 ? second : first, healedEnv: null };
  }
  return { result: first, healedEnv: null };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  const authHeader = req.headers.get('Authorization') ?? '';
  if (!SUPABASE_KEY || authHeader !== `Bearer ${SUPABASE_KEY}`) {
    return new Response(JSON.stringify({ error: 'service role required' }), {
      status: 403, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method not allowed' }), {
      status: 405, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  let body: any;
  try { body = await req.json(); }
  catch {
    return new Response(JSON.stringify({ error: 'invalid json' }), {
      status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  const title = String(body.title || '').trim();
  const text = String(body.body || '').trim();
  if (!title || !text) {
    return new Response(JSON.stringify({ error: 'title and body required' }), {
      status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
  const customData = (body.data && typeof body.data === 'object') ? body.data : {};
  const memberEmails: string[] = Array.isArray(body.member_emails)
    ? body.member_emails.map((e: unknown) => String(e).toLowerCase())
    : [];
  const explicitTokens: string[] = Array.isArray(body.tokens)
    ? body.tokens.map((t: unknown) => String(t))
    : [];

  if (memberEmails.length === 0 && explicitTokens.length === 0) {
    return new Response(JSON.stringify({ error: 'member_emails or tokens required' }), {
      status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  const subsById = new Map<string, NativeSub>();
  if (memberEmails.length > 0) {
    const filter = memberEmails.map(e => `"${e.replace(/"/g, '%22')}"`).join(',');
    const r = await db(`push_subscriptions_native?member_email=in.(${filter})&revoked_at=is.null&select=id,member_email,token,platform,environment`);
    if (r.ok) for (const row of (await r.json()) as NativeSub[]) subsById.set(row.id, row);
  }
  if (explicitTokens.length > 0) {
    const filter = explicitTokens.map(t => `"${t.replace(/"/g, '%22')}"`).join(',');
    const r = await db(`push_subscriptions_native?token=in.(${filter})&revoked_at=is.null&select=id,member_email,token,platform,environment`);
    if (r.ok) for (const row of (await r.json()) as NativeSub[]) subsById.set(row.id, row);
  }
  let subs: NativeSub[] = Array.from(subsById.values());

  if (subs.length === 0) {
    console.log('[push-send-native v6] no active subscriptions match');
    return new Response(JSON.stringify({ ok: true, sent: 0, revoked: 0, healed: 0, skipped: 0, results: [] }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  const skipped: { member_email: string; token_prefix: string; reason: string }[] = [];
  if (NATIVE_PUSH_ALLOWLIST !== null) {
    const filtered: NativeSub[] = [];
    for (const s of subs) {
      if (NATIVE_PUSH_ALLOWLIST.length > 0 && NATIVE_PUSH_ALLOWLIST.includes(s.member_email)) {
        filtered.push(s);
      } else {
        skipped.push({
          member_email: s.member_email,
          token_prefix: s.token.slice(0, 12) + '\u2026',
          reason: NATIVE_PUSH_ALLOWLIST.length === 0
            ? 'NATIVE_PUSH_ALLOWLIST unset or empty (fail-closed)'
            : 'not on NATIVE_PUSH_ALLOWLIST',
        });
      }
    }
    subs = filtered;
  }

  const iosSubs: NativeSub[] = [];
  for (const s of subs) {
    if (s.platform === 'ios') iosSubs.push(s);
    else skipped.push({
      member_email: s.member_email,
      token_prefix: s.token.slice(0, 12) + '\u2026',
      reason: 'android FCM not implemented (backlog #6)',
    });
  }

  if (iosSubs.length === 0) {
    console.log(`[push-send-native v6] all ${skipped.length} subs filtered out`);
    return new Response(JSON.stringify({
      ok: true, sent: 0, revoked: 0, healed: 0, skipped: skipped.length, results: [], skipped_detail: skipped,
    }), { headers: { ...CORS, 'Content-Type': 'application/json' } });
  }

  const apnsPayload: Record<string, unknown> = {
    aps: { alert: { title, body: text }, sound: 'default' },
    ...customData,
  };

  let jwt: string;
  try {
    jwt = await makeApnsJwt();
  } catch (e) {
    console.error('[push-send-native] JWT generation failed:', e);
    return new Response(JSON.stringify({ error: 'apns jwt error', detail: String(e) }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  const delivered = await Promise.all(iosSubs.map(s => deliverWithRetry(s, jwt, apnsPayload)));

  const nowIso = new Date().toISOString();
  let sent = 0, revoked = 0, healed = 0;
  const dbWrites: Promise<unknown>[] = [];
  const results: any[] = [];

  for (let i = 0; i < delivered.length; i++) {
    const { result: r, healedEnv } = delivered[i];
    const sub = iosSubs[i];
    const token_prefix = sub.token.slice(0, 12) + '\u2026';
    results.push({ member_email: sub.member_email, token_prefix, status: r.status, ok: r.ok, reason: r.reason, healed_env: healedEnv });

    if (r.ok) {
      sent++;
      const patch: Record<string, unknown> = { last_used_at: nowIso };
      if (healedEnv) { patch.environment = healedEnv; healed++; }
      dbWrites.push(db(`push_subscriptions_native?id=eq.${sub.id}`, {
        method: 'PATCH',
        headers: { 'Prefer': 'return=minimal' },
        body: JSON.stringify(patch),
      }));
      if (healedEnv) console.log(`[push-send-native] healed ${token_prefix} member=${sub.member_email} -> ${healedEnv}`);
      continue;
    }

    const deadToken =
      r.status === 410 ||
      (r.status === 400 && (r.reason === 'BadDeviceToken' || r.reason === 'DeviceTokenNotForTopic'));

    if (deadToken) {
      revoked++;
      dbWrites.push(db(`push_subscriptions_native?id=eq.${sub.id}`, {
        method: 'PATCH',
        headers: { 'Prefer': 'return=minimal' },
        body: JSON.stringify({ revoked_at: nowIso }),
      }));
      console.warn(`[push-send-native] revoked ${token_prefix} member=${sub.member_email} reason=${r.reason} (both environments rejected)`);
    } else if (r.status === 403 && r.reason === 'InvalidProviderToken') {
      console.error(`[push-send-native] InvalidProviderToken — APNs auth key/kid/iss wrong. Check APNS_AUTH_KEY, APNS_KEY_ID, APNS_TEAM_ID.`);
    } else {
      console.warn(`[push-send-native] failed status=${r.status} reason=${r.reason} token=${token_prefix}`);
    }
  }

  await Promise.all(dbWrites);

  console.log(`[push-send-native v6] sent=${sent} healed=${healed} revoked=${revoked} skipped=${skipped.length} of ${iosSubs.length + skipped.length} targets`);

  return new Response(JSON.stringify({
    ok: true,
    sent,
    revoked,
    healed,
    skipped: skipped.length,
    total_targets: iosSubs.length + skipped.length,
    results,
    skipped_detail: skipped,
    allowlist_active: NATIVE_PUSH_ALLOWLIST !== null,
  }), {
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
});
