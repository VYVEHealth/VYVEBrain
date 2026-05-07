import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
// schedule-push v1 — enqueues a one-shot delayed push for the authenticated member.
//
// Members tap things like the habits "Remind me in 2h" button → client POSTs here →
// row inserted into scheduled_pushes → process-scheduled-pushes EF (cron */5)
// fans out via send-push when fire_at <= now().
//
// Idempotency: dedupe_key is unique per member (composite UNIQUE constraint).
// If a member taps the same button twice in the same day, the second call updates
// fire_at on the existing row instead of inserting a duplicate.
//
// Auth: verify_jwt:true. We use the JWT-supplied email rather than trusting the
// client to specify member_email — this is the same pattern as wellbeing-checkin.
//
// Inputs: { type, title, body, fire_in_seconds, data?, dedupe_key? }
// - fire_in_seconds: clamped 60..86400 (1 minute to 24 hours)
// - dedupe_key: defaults to `${type}_${YYYY-MM-DD}` when omitted
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};
const MIN_FIRE_SECONDS = 60;
const MAX_FIRE_SECONDS = 86400;
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
// Decode JWT to get member email — Supabase Auth puts it in `email` claim.
// JWT is already validated upstream (verify_jwt:true), so we trust the payload.
function getEmailFromJwt(authHeader) {
  try {
    const m = authHeader.match(/^Bearer\s+(.+)$/i);
    if (!m) return null;
    const parts = m[1].split('.');
    if (parts.length !== 3) return null;
    let b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    while(b64.length % 4)b64 += '=';
    const json = JSON.parse(atob(b64));
    return typeof json.email === 'string' ? json.email.toLowerCase().trim() : null;
  } catch (_) {
    return null;
  }
}
serve(async (req)=>{
  if (req.method === 'OPTIONS') return new Response('ok', {
    headers: CORS
  });
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
  const email = getEmailFromJwt(req.headers.get('Authorization') ?? '');
  if (!email) {
    return new Response(JSON.stringify({
      error: 'missing or invalid auth'
    }), {
      status: 401,
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
  const type = String(input.type || '').trim();
  const title = String(input.title || '').trim();
  const body = String(input.body || '').trim();
  const fireInSecondsRaw = Number(input.fire_in_seconds);
  const data = input.data && typeof input.data === 'object' ? input.data : {};
  const today = new Date().toISOString().slice(0, 10);
  const dedupeKey = String(input.dedupe_key || `${type}_${today}`).trim();
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
  if (!Number.isFinite(fireInSecondsRaw)) {
    return new Response(JSON.stringify({
      error: 'fire_in_seconds must be a number'
    }), {
      status: 400,
      headers: {
        ...CORS,
        'Content-Type': 'application/json'
      }
    });
  }
  const fireInSeconds = Math.max(MIN_FIRE_SECONDS, Math.min(MAX_FIRE_SECONDS, Math.floor(fireInSecondsRaw)));
  const fireAt = new Date(Date.now() + fireInSeconds * 1000).toISOString();
  // Upsert: insert, on dedupe_key conflict update fire_at + reset fired_at/cancelled_at/last_error.
  // resolution=merge-duplicates with on_conflict targets the unique constraint.
  const upsertRow = {
    member_email: email,
    fire_at: fireAt,
    type,
    title,
    body,
    data,
    dedupe_key: dedupeKey,
    // Explicit nulls so a re-scheduled row clears any prior state
    fired_at: null,
    cancelled_at: null,
    last_error: null
  };
  const res = await db('scheduled_pushes?on_conflict=member_email,dedupe_key', {
    method: 'POST',
    body: JSON.stringify(upsertRow),
    headers: {
      'Prefer': 'resolution=merge-duplicates,return=representation'
    }
  });
  if (!res.ok) {
    const txt = await res.text();
    console.warn('[schedule-push] upsert failed:', res.status, txt);
    return new Response(JSON.stringify({
      error: 'db error',
      status: res.status,
      detail: txt.slice(0, 500)
    }), {
      status: 500,
      headers: {
        ...CORS,
        'Content-Type': 'application/json'
      }
    });
  }
  const rows = await res.json();
  const row = Array.isArray(rows) ? rows[0] : rows;
  return new Response(JSON.stringify({
    ok: true,
    id: row?.id ?? null,
    fire_at: fireAt,
    fire_in_seconds: fireInSeconds,
    dedupe_key: dedupeKey
  }), {
    headers: {
      ...CORS,
      'Content-Type': 'application/json'
    }
  });
});
