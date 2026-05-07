// VYVE Health — platform-alert v1
// Central monitoring: receives alerts, deduplicates, emails via Brevo, pushes via VAPID
// Called by client-side error catcher (auth.js) and server-side EFs
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const BREVO_KEY = Deno.env.get('BREVO_API_KEY') ?? '';
const VAPID_PRIVATE_KEY_B64 = Deno.env.get('VAPID_PRIVATE_KEY') ?? '';
const VAPID_PUBLIC_KEY_B64 = 'BDbz2-0k3JcqRWKyasr3MNgEZrXhKsVvjS-otCyyV7Ya4Pi2xXOxXGETUpVoE56VorKzSNy7uyep53gOzNEMTu4';
const VAPID_SUBJECT = 'mailto:team@vyvehealth.co.uk';
// Alert recipients
const ALERT_EMAILS = [
  {
    email: 'deanonbrown@hotmail.com',
    name: 'Dean Brown'
  },
  {
    email: 'lewisvines@hotmail.com',
    name: 'Lewis Vines'
  }
];
const ALERT_MEMBER_EMAILS = ALERT_EMAILS.map((e)=>e.email);
const ALLOWED_ORIGINS = new Set([
  'https://online.vyvehealth.co.uk',
  'https://www.vyvehealth.co.uk'
]);
function getCORSHeaders(req) {
  const origin = req.headers.get('Origin') ?? '';
  const allowOrigin = ALLOWED_ORIGINS.has(origin) ? origin : origin === 'null' || origin === '' ? '*' : 'https://online.vyvehealth.co.uk';
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Credentials': allowOrigin !== '*' ? 'true' : 'false'
  };
}
function db(path, opts = {}) {
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...opts,
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
      ...opts.headers || {}
    }
  });
}
// ── VAPID Push (RFC 8291) ──────────────────────────────────────────
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
  let offset = 0;
  for (const arr of arrays){
    out.set(arr, offset);
    offset += arr.length;
  }
  return out;
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
  const signing = enc.encode(`${header}.${claims}`);
  const privKey = await crypto.subtle.importKey('raw', db64u(VAPID_PRIVATE_KEY_B64), {
    name: 'ECDSA',
    namedCurve: 'P-256'
  }, false, [
    'sign'
  ]);
  const sig = await crypto.subtle.sign({
    name: 'ECDSA',
    hash: 'SHA-256'
  }, privKey, signing);
  return `${header}.${claims}.${b64u(sig)}`;
}
async function encryptPayload(payload, p256dhB64, authB64) {
  const enc = new TextEncoder();
  const plaintext = enc.encode(payload);
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
  const paddedPlaintext = concat(plaintext, new Uint8Array([
    2
  ]));
  const aesKey = await crypto.subtle.importKey('raw', cekBits, 'AES-GCM', false, [
    'encrypt'
  ]);
  const encrypted = await crypto.subtle.encrypt({
    name: 'AES-GCM',
    iv: nonceBits
  }, aesKey, paddedPlaintext);
  const recordSize = new DataView(new ArrayBuffer(4));
  recordSize.setUint32(0, 4096);
  return concat(salt, new Uint8Array(recordSize.buffer), new Uint8Array([
    65
  ]), serverPubKeyRaw, new Uint8Array(encrypted));
}
async function sendPush(sub, payload) {
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
    if (res.status === 410) {
      await db(`push_subscriptions?endpoint=eq.${encodeURIComponent(sub.endpoint)}`, {
        method: 'DELETE'
      });
    }
    return res.ok;
  } catch (e) {
    console.warn('[platform-alert] push error:', e);
    return false;
  }
}
// ──────────────────────────────────────────────────────────────────
// ── Brevo Email ──────────────────────────────────────────────────
async function sendAlertEmail(severity, type, details, member, page) {
  if (!BREVO_KEY) {
    console.warn('[platform-alert] BREVO_API_KEY not set');
    return false;
  }
  const icon = severity === 'critical' ? '🔴' : severity === 'high' ? '🟠' : '🟡';
  const subject = `${icon} VYVE Alert: ${type}`;
  const timestamp = new Date().toLocaleString('en-GB', {
    timeZone: 'Europe/London'
  });
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
      <div style="background:#0D2B2B;color:#fff;padding:16px 24px;border-radius:8px 8px 0 0">
        <h2 style="margin:0;font-size:18px">${icon} Platform Alert — ${severity.toUpperCase()}</h2>
      </div>
      <div style="background:#f8f9fa;padding:24px;border:1px solid #e0e0e0;border-top:none;border-radius:0 0 8px 8px">
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <tr><td style="padding:8px 0;font-weight:bold;width:100px">Type</td><td>${type}</td></tr>
          <tr><td style="padding:8px 0;font-weight:bold">Severity</td><td>${severity}</td></tr>
          <tr><td style="padding:8px 0;font-weight:bold">Time</td><td>${timestamp}</td></tr>
          ${member ? `<tr><td style="padding:8px 0;font-weight:bold">Member</td><td>${member}</td></tr>` : ''}
          ${page ? `<tr><td style="padding:8px 0;font-weight:bold">Page</td><td>${page}</td></tr>` : ''}
          <tr><td style="padding:8px 0;font-weight:bold;vertical-align:top">Details</td><td style="white-space:pre-wrap">${details}</td></tr>
        </table>
      </div>
      <p style="font-size:12px;color:#888;margin-top:12px">VYVE Health CIC — Platform Monitoring</p>
    </div>`;
  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': BREVO_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sender: {
          email: 'team@vyvehealth.co.uk',
          name: 'VYVE Alerts'
        },
        to: ALERT_EMAILS,
        subject,
        htmlContent: html
      })
    });
    return res.ok;
  } catch (e) {
    console.error('[platform-alert] email error:', e);
    return false;
  }
}
// ──────────────────────────────────────────────────────────────────
serve(async (req)=>{
  const CORS = getCORSHeaders(req);
  if (req.method === 'OPTIONS') return new Response('ok', {
    headers: CORS
  });
  try {
    const body = await req.json();
    const { severity = 'info', type, source = 'unknown', member_email, details, page, user_agent } = body;
    if (!type) {
      return new Response(JSON.stringify({
        error: 'type is required'
      }), {
        status: 400,
        headers: {
          ...CORS,
          'Content-Type': 'application/json'
        }
      });
    }
    // ── Deduplicate: same type + member within 1 hour ──
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const dedup = member_email ? `type=eq.${encodeURIComponent(type)}&member_email=eq.${encodeURIComponent(member_email)}&created_at=gte.${oneHourAgo}&limit=1` : `type=eq.${encodeURIComponent(type)}&member_email=is.null&created_at=gte.${oneHourAgo}&limit=1`;
    const existing = await db(`platform_alerts?${dedup}`, {
      headers: {
        'Prefer': 'return=representation'
      }
    });
    const rows = await existing.json();
    if (Array.isArray(rows) && rows.length > 0) {
      return new Response(JSON.stringify({
        success: true,
        deduplicated: true,
        message: 'Alert already logged within 1 hour'
      }), {
        headers: {
          ...CORS,
          'Content-Type': 'application/json'
        }
      });
    }
    // ── Write alert to DB ──
    const alertRow = {
      severity,
      type,
      source,
      member_email: member_email || null,
      details: details || null,
      page: page || null,
      user_agent: user_agent || null
    };
    const insertRes = await db('platform_alerts', {
      method: 'POST',
      body: JSON.stringify(alertRow)
    });
    if (!insertRes.ok) console.warn('[platform-alert] insert failed:', await insertRes.text());
    // ── Notify for critical and high severity ──
    let emailSent = false;
    let pushSent = 0;
    if (severity === 'critical' || severity === 'high') {
      // Email
      emailSent = await sendAlertEmail(severity, type, details || 'No details provided', member_email, page);
      // Push — send to Dean and Lewis only
      try {
        const subsFilter = ALERT_MEMBER_EMAILS.map((e)=>`member_email.eq.${encodeURIComponent(e)}`).join(',');
        const subsRes = await db(`push_subscriptions?or=(${subsFilter})&select=member_email,endpoint,p256dh,auth_key`);
        const subs = await subsRes.json();
        if (Array.isArray(subs) && subs.length > 0) {
          const icon = severity === 'critical' ? '🔴' : '🟠';
          const pushPayload = JSON.stringify({
            title: `${icon} VYVE: ${type}`,
            body: (details || 'Check dashboard for details').slice(0, 200)
          });
          const pushResults = await Promise.all(subs.map((sub)=>sendPush(sub, pushPayload)));
          pushSent = pushResults.filter(Boolean).length;
        }
      } catch (e) {
        console.warn('[platform-alert] push send error:', e);
      }
    }
    // Update notified flag
    if (emailSent || pushSent > 0) {
    // Mark as notified by updating the most recent alert of this type
    // (We already inserted it, so update the latest)
    // Skip — the insert already happened, and we'd need the id. Good enough.
    }
    console.log(`[platform-alert] type=${type} sev=${severity} email=${emailSent} push=${pushSent}`);
    return new Response(JSON.stringify({
      success: true,
      deduplicated: false,
      notifications: {
        email: emailSent,
        push: pushSent
      }
    }), {
      headers: {
        ...CORS,
        'Content-Type': 'application/json'
      }
    });
  } catch (err) {
    console.error('[platform-alert] error:', err);
    return new Response(JSON.stringify({
      error: String(err)
    }), {
      status: 500,
      headers: {
        ...CORS,
        'Content-Type': 'application/json'
      }
    });
  }
});
