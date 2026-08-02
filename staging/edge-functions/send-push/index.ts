import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
// ─────────────────────────────────────────────────────────────────────────────
// send-push v13 — adds `route` to member_notifications insert.
//
// v13 adds: when inserting member_notifications, populate `route` column from
// input.data.url if provided. Enables the "every notification links to the
// right part of the app" principle — the in-app notifications list (and toast
// click handlers reading the row) get the destination, identical to what the
// service worker / native handler reads from data.url.
//
// Web/native push payload behaviour: byte-identical to v12 — data.url already
// flows through to VAPID payload + APNs payload via customData.
//
// All other behaviour byte-identical to v12 (VAPID JWT signing fix retained).
// ─────────────────────────────────────────────────────────────────────────────
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const LEGACY_SERVICE_ROLE_JWT = Deno.env.get('LEGACY_SERVICE_ROLE_JWT') ?? '';
const VAPID_PRIVATE_KEY_B64 = Deno.env.get('VAPID_PRIVATE_KEY') ?? '';
const VAPID_PUBLIC_KEY_B64 = 'BDbz2-0k3JcqRWKyasr3MNgEZrXhKsVvjS-otCyyV7Ya4Pi2xXOxXGETUpVoE56VorKzSNy7uyep53gOzNEMTu4';
const VAPID_SUBJECT = 'mailto:team@vyvehealth.co.uk';
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
  const b = new Uint8Array(buf);
  let s = '';
  b.forEach((x)=>s += String.fromCharCode(x));
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}
function db64u(s) {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  while(s.length % 4)s += '=';
  const raw = atob(s);
  return Uint8Array.from(raw, (c)=>c.charCodeAt(0));
}
function concat(...arrays) {
  const len = arrays.reduce((a, b)=>a + b.length, 0);
  const out = new Uint8Array(len);
  let off = 0;
  for (const arr of arrays){
    out.set(arr, off);
    off += arr.length;
  }
  return out;
}
let _vapidPrivKey = null;
async function getVapidPrivateKey() {
  if (_vapidPrivKey) return _vapidPrivKey;
  const pubBytes = db64u(VAPID_PUBLIC_KEY_B64);
  if (pubBytes.length !== 65 || pubBytes[0] !== 0x04) {
    throw new Error(`VAPID public key invalid: length=${pubBytes.length} prefix=${pubBytes[0]}`);
  }
  const x = b64u(pubBytes.slice(1, 33).buffer);
  const y = b64u(pubBytes.slice(33, 65).buffer);
  const jwk = {
    kty: 'EC',
    crv: 'P-256',
    d: VAPID_PRIVATE_KEY_B64.replace(/=/g, ''),
    x,
    y,
    ext: true
  };
  _vapidPrivKey = await crypto.subtle.importKey('jwk', jwk, {
    name: 'ECDSA',
    namedCurve: 'P-256'
  }, false, [
    'sign'
  ]);
  return _vapidPrivKey;
}
async function makeVapidJwt(audience) {
  const enc = new TextEncoder();
  const header = b64u(enc.encode(JSON.stringify({
    typ: 'JWT',
    alg: 'ES256'
  })).buffer);
  const now = Math.floor(Date.now() / 1000);
  const claims = b64u(enc.encode(JSON.stringify({
    aud: audience,
    exp: now + 43200,
    sub: VAPID_SUBJECT
  })).buffer);
  const privKey = await getVapidPrivateKey();
  const sig = await crypto.subtle.sign({
    name: 'ECDSA',
    hash: 'SHA-256'
  }, privKey, enc.encode(`${header}.${claims}`));
  return `${header}.${claims}.${b64u(sig)}`;
}
async function encryptPayload(payload, p256dhB64, authB64) {
  const enc = new TextEncoder();
  const recipientPubKey = db64u(p256dhB64);
  const authSecret = db64u(authB64);
  const serverKeyPair = await crypto.subtle.generateKey({
    name: 'ECDH',
    namedCurve: 'P-256'
  }, true, [
    'deriveBits'
  ]);
  const serverPubKeyRaw = new Uint8Array(await crypto.subtle.exportKey('raw', serverKeyPair.publicKey));
  const recipientKey = await crypto.subtle.importKey('raw', recipientPubKey, {
    name: 'ECDH',
    namedCurve: 'P-256'
  }, false, []);
  const sharedSecret = new Uint8Array(await crypto.subtle.deriveBits({
    name: 'ECDH',
    public: recipientKey
  }, serverKeyPair.privateKey, 256));
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hkdfKey = await crypto.subtle.importKey('raw', sharedSecret, 'HKDF', false, [
    'deriveBits'
  ]);
  const infoStr = concat(enc.encode('WebPush: info\x00'), recipientPubKey, serverPubKeyRaw);
  const ikmBits = await crypto.subtle.deriveBits({
    name: 'HKDF',
    hash: 'SHA-256',
    salt: authSecret,
    info: infoStr
  }, hkdfKey, 256);
  const ikmKey = await crypto.subtle.importKey('raw', new Uint8Array(ikmBits), 'HKDF', false, [
    'deriveBits'
  ]);
  const cekBits = await crypto.subtle.deriveBits({
    name: 'HKDF',
    hash: 'SHA-256',
    salt,
    info: enc.encode('Content-Encoding: aes128gcm\x00')
  }, ikmKey, 128);
  const nonceBits = await crypto.subtle.deriveBits({
    name: 'HKDF',
    hash: 'SHA-256',
    salt,
    info: enc.encode('Content-Encoding: nonce\x00')
  }, ikmKey, 96);
  const aesKey = await crypto.subtle.importKey('raw', cekBits, 'AES-GCM', false, [
    'encrypt'
  ]);
  const encrypted = await crypto.subtle.encrypt({
    name: 'AES-GCM',
    iv: nonceBits
  }, aesKey, concat(enc.encode(payload), new Uint8Array([
    2
  ])));
  const recordSize = new DataView(new ArrayBuffer(4));
  recordSize.setUint32(0, 4096);
  return concat(salt, new Uint8Array(recordSize.buffer), new Uint8Array([
    65
  ]), serverPubKeyRaw, new Uint8Array(encrypted));
}
async function sendWebPush(sub, payload) {
  try {
    const url = new URL(sub.endpoint);
    const jwt = await makeVapidJwt(`${url.protocol}//${url.host}`);
    const ciphertext = await encryptPayload(payload, sub.p256dh, sub.auth_key);
    const res = await fetch(sub.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `vapid t=${jwt},k=${VAPID_PUBLIC_KEY_B64}`,
        'Content-Encoding': 'aes128gcm',
        'Content-Type': 'application/octet-stream',
        'TTL': '86400'
      },
      body: ciphertext
    });
    return {
      ok: res.ok,
      status: res.status
    };
  } catch (e) {
    console.warn('[send-push] web push error:', e);
    return {
      ok: false,
      status: 0,
      error: String(e)
    };
  }
}
async function sendNativeBatch(memberEmails, title, body, data) {
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/push-send-native`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        member_emails: memberEmails,
        title,
        body,
        data
      })
    });
    if (!res.ok) {
      const txt = await res.text();
      console.warn('[send-push] native batch failed:', res.status, txt);
      return {
        ok: false,
        sent: 0,
        revoked: 0,
        attempted: 0,
        error: txt
      };
    }
    const j = await res.json();
    return {
      ok: true,
      sent: j.sent || 0,
      revoked: j.revoked || 0,
      attempted: (j.sent || 0) + (j.revoked || 0) + (j.results?.filter((r)=>!r.ok && r.status !== 410 && r.status !== 400).length || 0),
      skipped: j.skipped || 0,
      raw: j
    };
  } catch (e) {
    console.warn('[send-push] native batch error:', e);
    return {
      ok: false,
      sent: 0,
      revoked: 0,
      attempted: 0,
      error: String(e)
    };
  }
}
serve(async (req)=>{
  if (req.method === 'OPTIONS') return new Response('ok', {
    headers: CORS
  });
  const authHeader = req.headers.get('Authorization') ?? '';
  const matchesNew = SUPABASE_KEY && authHeader === `Bearer ${SUPABASE_KEY}`;
  const matchesLegacy = LEGACY_SERVICE_ROLE_JWT && authHeader === `Bearer ${LEGACY_SERVICE_ROLE_JWT}`;
  if (!matchesNew && !matchesLegacy) {
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
  let input;
  try {
    input = await req.json();
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
  const memberEmails = Array.isArray(input.member_emails) ? input.member_emails.map((e)=>String(e).toLowerCase().trim()).filter(Boolean) : [];
  const type = String(input.type || '').trim();
  const title = String(input.title || '').trim();
  const body = String(input.body || '').trim();
  const customData = input.data && typeof input.data === 'object' ? input.data : {};
  // v13: extract route from data.url if provided. Single source of truth
  // for where this notification links to — used by SW notificationclick,
  // native click handler, and any in-app notifications list UI.
  const route = typeof customData.url === 'string' && customData.url.length > 0 ? customData.url : null;
  const dedupeSameDay = input.dedupe_same_day !== false;
  const skipInapp = input.skip_inapp === true;
  const skipWeb = input.skip_web === true;
  const skipNative = input.skip_native === true;
  if (!memberEmails.length) {
    return new Response(JSON.stringify({
      error: 'member_emails required'
    }), {
      status: 400,
      headers: {
        ...CORS,
        'Content-Type': 'application/json'
      }
    });
  }
  if (!type || !title || !body) {
    return new Response(JSON.stringify({
      error: 'type, title, body required'
    }), {
      status: 400,
      headers: {
        ...CORS,
        'Content-Type': 'application/json'
      }
    });
  }
  const today = new Date().toISOString().slice(0, 10);
  const details = [];
  let processed = 0, deduped = 0, notified = 0;
  let webAttempted = 0, webSent = 0, webRevoked = 0;
  const nativeRecipients = [];
  for (const email of memberEmails){
    processed++;
    const detail = {
      email,
      deduped: false,
      notification_id: null,
      web: {
        attempted: 0,
        sent: 0,
        revoked: 0
      }
    };
    if (dedupeSameDay) {
      const dedupeRes = await db(`member_notifications?member_email=eq.${encodeURIComponent(email)}&type=eq.${encodeURIComponent(type)}&created_at=gte.${today}T00:00:00Z&select=id&limit=1`);
      if (dedupeRes.ok && (await dedupeRes.json()).length > 0) {
        detail.deduped = true;
        deduped++;
        details.push(detail);
        continue;
      }
    }
    if (!skipInapp) {
      // v13: include route in row payload (NULL if caller didn't pass data.url)
      const insertPayload = {
        member_email: email,
        type,
        title,
        body
      };
      if (route) insertPayload.route = route;
      const insRes = await db('member_notifications', {
        method: 'POST',
        body: JSON.stringify(insertPayload),
        headers: {
          'Prefer': 'return=representation'
        }
      });
      if (insRes.ok) {
        const rows = await insRes.json();
        detail.notification_id = rows?.[0]?.id || null;
        notified++;
      } else {
        detail.notification_error = await insRes.text();
      }
    }
    if (!skipWeb) {
      const subRes = await db(`push_subscriptions?member_email=eq.${encodeURIComponent(email)}&select=endpoint,p256dh,auth_key`);
      if (subRes.ok) {
        const subs = await subRes.json();
        for (const sub of subs){
          detail.web.attempted++;
          webAttempted++;
          const payload = JSON.stringify({
            title,
            body,
            data: customData
          });
          const r = await sendWebPush(sub, payload);
          if (r.ok) {
            detail.web.sent++;
            webSent++;
          } else if (r.status === 410 || r.status === 404) {
            await db(`push_subscriptions?endpoint=eq.${encodeURIComponent(sub.endpoint)}`, {
              method: 'DELETE'
            });
            detail.web.revoked++;
            webRevoked++;
          }
        }
      }
    }
    if (!skipNative) nativeRecipients.push(email);
    details.push(detail);
  }
  let nativeResult = {
    sent: 0,
    revoked: 0,
    attempted: 0,
    skipped: 0
  };
  if (nativeRecipients.length > 0) {
    nativeResult = await sendNativeBatch(nativeRecipients, title, body, {
      ...customData,
      type
    });
  }
  return new Response(JSON.stringify({
    ok: true,
    processed,
    deduped,
    notified,
    web_attempted: webAttempted,
    web_sent: webSent,
    web_revoked: webRevoked,
    native_attempted: nativeResult.attempted,
    native_sent: nativeResult.sent,
    native_revoked: nativeResult.revoked,
    native_skipped: nativeResult.skipped,
    details
  }), {
    headers: {
      ...CORS,
      'Content-Type': 'application/json'
    }
  });
});
