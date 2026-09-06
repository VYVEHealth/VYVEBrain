import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
// ─────────────────────────────────────────────────────────────────────────────
// platform-alert v11 — PM-1015 (4 Sep 2026)
//
// v10 (PM-404) implemented brain PM-403.b decision 2: network_error_* on a
// WRITE-PATH slug stays critical, everywhere else it downgrades to info. That
// exemption has NEVER MATCHED, because it tested the wrong field.
//
// The client posts { type: 'network_error_<table>', page: '/x.html', details: '<string>' }
// and sends no `endpoint`/`url`. v10's rawEndpoint therefore fell through to
// `page`, normalised to 'onboarding.html', which is not in WRITE_PATH_SLUGS —
// so every network_error_* since 26 May has been stored as info, including
// genuine write failures on members / daily_habits / workouts. The table name
// was in the TYPE the whole time, never in the endpoint.
//
// v11 changes, and nothing else:
//   1. Severity now keys off the slug carried in the type suffix
//      (network_error_<slug> / api_500_<slug> / auth_401_<slug>), falling back
//      to endpoint/url/page for types that carry no slug. Fingerprints are
//      UNCHANGED so existing rows keep grouping.
//   2. A string `details` is stored as { message } instead of being buried
//      under { raw: <entire payload> }, which is what made the list unreadable.
//   3. The hourly increment path is generalised from skeleton_timeout_* to
//      network_error_* too, so a client retrying the same table collapses into
//      one row with a count instead of N rows.
//   4. The increment lookup now requires resolved=false. Without this, clearing
//      the queue and then hitting the same fault again would silently bump the
//      RESOLVED row's counter and never resurface — a real hole once bulk
//      resolve exists (PM-1013).
//
// Unchanged: CORS, verify_jwt:false, the circuit breaker, single-write happy
// path, no fan-out, never throws, always 200s to the client.
// ─────────────────────────────────────────────────────────────────────────────
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
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
// ─── Write-path endpoint slugs (brain PM-403.b decision 2) ───────────────
// network_error_* on these slugs stays critical; elsewhere downgrades to info.
const WRITE_PATH_SLUGS = new Set([
  'daily_habits',
  'workouts',
  'cardio',
  'log-activity',
  'weekly_goals',
  'custom_workouts',
  'exercise_logs',
  'exercise_swaps',
  'weight_logs',
  'nutrition_logs',
  'member_habits',
  'wellbeing_checkins',
  'monthly_checkins',
  'members'
]);
// ─── Endpoint normalisation ────────────────────────────────────
function normaliseEndpoint(raw) {
  if (typeof raw !== 'string') return 'unknown';
  let s = raw.trim();
  if (!s) return 'unknown';
  try {
    if (s.startsWith('http://') || s.startsWith('https://')) {
      const u = new URL(s);
      s = u.pathname;
    }
  } catch  {
  // fall through with raw s
  }
  const qi = s.indexOf('?');
  if (qi >= 0) s = s.slice(0, qi);
  if (s.endsWith('/') && s.length > 1) s = s.slice(0, -1);
  const parts = s.split('/').filter(Boolean);
  const tail = parts.length ? parts[parts.length - 1] : s;
  return tail.toLowerCase();
}
// ─── PM-1015: the slug the severity rules actually care about ────────────
// For the prefixed families the table/endpoint is carried in the TYPE, which is
// the only place the client ever puts it. Fall back to the normalised endpoint
// for types that carry no slug (js_error, promise_rejection, ...).
const SLUG_PREFIXES = [
  'network_error_',
  'api_500_',
  'auth_401_'
];
function severitySlug(type, normEndpoint) {
  const t = type.toLowerCase();
  for (const p of SLUG_PREFIXES){
    if (t.startsWith(p) && t.length > p.length) return t.slice(p.length);
  }
  return normEndpoint;
}
// ─── Severity recalibration (brain PM-403.b decision 2) ──────────────────
function decideSeverity(type, slug) {
  const t = type.toLowerCase();
  const isWritePath = WRITE_PATH_SLUGS.has(slug);
  if (t.startsWith('network_error_') || t === 'network_error') {
    return isWritePath ? 'critical' : 'info';
  }
  if (t.startsWith('auth_401') || t === 'auth_401') {
    return 'critical';
  }
  if (t.startsWith('api_500') || t === 'api_500') {
    return 'critical';
  }
  if (t === 'js_error' || t === 'promise_rejection') {
    return 'high';
  }
  if (t.startsWith('skeleton_timeout')) {
    return 'high';
  }
  return 'info';
}
// ─── Circuit breaker ────────────────────────────────────────────
const BREAKER_WINDOW_MS = 60_000;
const BREAKER_THRESHOLD = 20;
const BREAKER_COOLDOWN_MS = 5 * 60_000;
const invocationTimestamps = [];
let breakerTrippedUntil = 0;
function checkBreaker(now) {
  if (now < breakerTrippedUntil) {
    return {
      tripped: true,
      reason: 'cooldown'
    };
  }
  const cutoff = now - BREAKER_WINDOW_MS;
  while(invocationTimestamps.length && invocationTimestamps[0] < cutoff){
    invocationTimestamps.shift();
  }
  invocationTimestamps.push(now);
  if (invocationTimestamps.length > BREAKER_THRESHOLD) {
    breakerTrippedUntil = now + BREAKER_COOLDOWN_MS;
    return {
      tripped: true,
      reason: 'threshold'
    };
  }
  return {
    tripped: false
  };
}
// ─── Hourly repeat collapsing ────────────────────────────────────────
// PM-1015: was skeleton_timeout only, now also network_error_*. Only ever
// touches an UNRESOLVED row — bumping a resolved one would hide a fresh
// occurrence behind a cleared alert.
const COLLAPSE_PREFIXES = [
  'skeleton_timeout',
  'network_error'
];
function isCollapsible(type) {
  const t = type.toLowerCase();
  return COLLAPSE_PREFIXES.some((p)=>t.startsWith(p));
}
async function tryIncrementHourly(fingerprint, details) {
  const lookupUrl = `${SUPABASE_URL}/rest/v1/platform_alerts` + `?fingerprint=eq.${encodeURIComponent(fingerprint)}` + `&resolved=is.false` + `&created_at=gte.${encodeURIComponent(new Date(Date.now() - 60 * 60_000).toISOString())}` + `&select=id,details` + `&order=created_at.desc` + `&limit=1`;
  const lookupRes = await fetch(lookupUrl, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`
    }
  });
  if (!lookupRes.ok) return false;
  const existing = await lookupRes.json();
  if (!Array.isArray(existing) || existing.length === 0) return false;
  const row = existing[0];
  let prevDetails = {};
  if (typeof row.details === 'string') {
    try {
      prevDetails = JSON.parse(row.details);
      if (typeof prevDetails !== 'object' || prevDetails === null) prevDetails = {};
    } catch  {
      prevDetails = {
        _prev: row.details
      };
    }
  } else if (typeof row.details === 'object' && row.details !== null) {
    prevDetails = row.details;
  }
  const prevCount = typeof prevDetails.count === 'number' ? prevDetails.count : 1;
  const merged = {
    ...prevDetails,
    ...details,
    count: prevCount + 1,
    last_at: new Date().toISOString()
  };
  const patchUrl = `${SUPABASE_URL}/rest/v1/platform_alerts?id=eq.${encodeURIComponent(row.id)}`;
  const patchRes = await fetch(patchUrl, {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({
      details: JSON.stringify(merged)
    })
  });
  return patchRes.ok;
}
// ─── Direct INSERT path ─────────────────────────────────────────
async function insertAlert(row) {
  const insRes = await fetch(`${SUPABASE_URL}/rest/v1/platform_alerts`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify(row)
  });
  return insRes.ok;
}
// ─── Main handler ──────────────────────────────────────────────
serve(async (req)=>{
  const CORS = getCORSHeaders(req);
  if (req.method === 'OPTIONS') return new Response('ok', {
    headers: CORS
  });
  const now = Date.now();
  const breaker = checkBreaker(now);
  if (breaker.tripped) {
    return new Response(JSON.stringify({
      ok: false,
      error: 'rate_limited',
      reason: breaker.reason
    }), {
      status: 429,
      headers: {
        ...CORS,
        'Content-Type': 'application/json'
      }
    });
  }
  let payload = {};
  try {
    if (req.method === 'POST') payload = await req.json();
  } catch  {
  // Fall through with empty payload; we'll record what we can
  }
  const type = String(payload.type ?? 'unknown').slice(0, 200);
  const memberEmail = typeof payload.member_email === 'string' ? payload.member_email.toLowerCase().trim().slice(0, 320) : null;
  const rawEndpoint = payload.endpoint ?? payload.url ?? payload.page ?? '';
  const normEndpoint = normaliseEndpoint(rawEndpoint);
  // Fingerprint deliberately unchanged from v10 so existing rows keep grouping.
  const fingerprint = `${type}::${normEndpoint}::${memberEmail ?? 'anon'}`;
  const slug = severitySlug(type, normEndpoint);
  const severity = decideSeverity(type, slug);
  // `details` is a text column; serialise whatever we were given. PM-1015: a
  // plain-string details is the common client shape and becomes { message },
  // rather than the whole payload disappearing under { raw }.
  let detailsSrc;
  if (typeof payload.details === 'object' && payload.details !== null) {
    detailsSrc = payload.details;
  } else if (typeof payload.details === 'string' && payload.details.trim()) {
    detailsSrc = {
      message: payload.details.slice(0, 1000)
    };
  } else {
    detailsSrc = {
      raw: payload
    };
  }
  const row = {
    severity,
    type,
    source: typeof payload.source === 'string' ? payload.source.slice(0, 100) : 'client',
    member_email: memberEmail,
    details: JSON.stringify(detailsSrc),
    page: typeof payload.page === 'string' ? payload.page.slice(0, 500) : null,
    user_agent: req.headers.get('User-Agent')?.slice(0, 500) ?? null,
    fingerprint
  };
  let wrote = false;
  if (isCollapsible(type)) {
    try {
      wrote = await tryIncrementHourly(fingerprint, detailsSrc);
    } catch  {
      wrote = false;
    }
  }
  if (!wrote) {
    try {
      wrote = await insertAlert(row);
    } catch (err) {
      console.warn('[platform-alert v11] insert failed', String(err));
    }
  }
  return new Response(JSON.stringify({
    ok: true,
    severity,
    fingerprint,
    recorded: wrote
  }), {
    status: 200,
    headers: {
      ...CORS,
      'Content-Type': 'application/json'
    }
  });
});
