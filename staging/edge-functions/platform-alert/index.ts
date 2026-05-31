import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
// ─────────────────────────────────────────────────────────────────────────────
// platform-alert v10 — PM-404 (26 May 2026)
//
// Real replacement for the PM-149 no-op (deployed as v10 source-labelled v9).
// Restores platform error monitoring before bundle tonight widens the cohort
// from ~15-20 trial seats to all members on approval.
//
// Design lock (brain PM-403.b):
//   • Fingerprint:  (type, normalised_endpoint, member_email)
//   • Severity recalibration on intake — see SEVERITY_RULES below
//   • Circuit breaker: 20 calls / 60s sliding → 429 for 5 min (module-scoped)
//   • Writes only to platform_alerts. No Brevo, no Anthropic, no push fan-out,
//     no push_subscriptions write. <50ms 200-return on happy path.
//   • CORS preserved from v9. verify_jwt: false preserved.
//
// Storm-class line of defence is the circuit breaker. PM-149 was 40+ concurrent
// 90-150s holders draining the connection pool. v10 is single-write, no awaited
// fan-out, breaker caps anything pathological.
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
// Strip protocol + host + query, keep the path, return just the last path
// segment for fingerprinting. So:
//   https://...supabase.co/rest/v1/daily_habits?member_email=eq.X → 'daily_habits'
//   https://...supabase.co/functions/v1/log-activity              → 'log-activity'
//   /habits.html                                                  → 'habits.html'
//   (anything else)                                               → the raw input lowercased, trimmed
function normaliseEndpoint(raw) {
  if (typeof raw !== 'string') return 'unknown';
  let s = raw.trim();
  if (!s) return 'unknown';
  // Strip protocol + host if present
  try {
    if (s.startsWith('http://') || s.startsWith('https://')) {
      const u = new URL(s);
      s = u.pathname;
    }
  } catch  {
  // fall through with raw s
  }
  // Strip query string
  const qi = s.indexOf('?');
  if (qi >= 0) s = s.slice(0, qi);
  // Strip trailing slash
  if (s.endsWith('/') && s.length > 1) s = s.slice(0, -1);
  // Take last path segment
  const parts = s.split('/').filter(Boolean);
  const tail = parts.length ? parts[parts.length - 1] : s;
  return tail.toLowerCase();
}
// ─── Severity recalibration (brain PM-403.b decision 2) ──────────────────
// type pattern → severity decision rule. Returns the final severity to store.
function decideSeverity(type, normEndpoint) {
  const t = type.toLowerCase();
  const isWritePath = WRITE_PATH_SLUGS.has(normEndpoint);
  // network_error_* — write-path critical, elsewhere info (the noise downgrade)
  if (t.startsWith('network_error_') || t === 'network_error') {
    return isWritePath ? 'critical' : 'info';
  }
  // auth_401_* — always critical
  if (t.startsWith('auth_401') || t === 'auth_401') {
    return 'critical';
  }
  // api_500_* — always critical
  if (t.startsWith('api_500') || t === 'api_500') {
    return 'critical';
  }
  // js_error + promise_rejection — high
  if (t === 'js_error' || t === 'promise_rejection') {
    return 'high';
  }
  // skeleton_timeout_* — high (counter-in-details handles per-hour collapsing)
  if (t.startsWith('skeleton_timeout')) {
    return 'high';
  }
  // Default for anything else — info (don't surface unknown types loudly)
  return 'info';
}
// ─── Circuit breaker ────────────────────────────────────────────
// Module-scoped sliding-window counter. Cold-start reset to zero is intentional
// — a fresh isolate isn't being stormed yet. Brain PM-403.b decision 3.
const BREAKER_WINDOW_MS = 60_000; // 60s sliding window
const BREAKER_THRESHOLD = 20; // > 20 in window → trip
const BREAKER_COOLDOWN_MS = 5 * 60_000; // 5 min 429
const invocationTimestamps = [];
let breakerTrippedUntil = 0;
function checkBreaker(now) {
  // Honour active trip
  if (now < breakerTrippedUntil) {
    return {
      tripped: true,
      reason: 'cooldown'
    };
  }
  // Prune window
  const cutoff = now - BREAKER_WINDOW_MS;
  while(invocationTimestamps.length && invocationTimestamps[0] < cutoff){
    invocationTimestamps.shift();
  }
  // Count this invocation
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
// ─── Skeleton timeout hourly counter ─────────────────────────────────
// SELECT-then-UPSERT path. Looks for an existing row with same fingerprint
// within the last hour; if found, increments details.count and updates created_at.
// If not found, falls through to a normal INSERT.
//
// Trade-off banked: this is two round-trips, but skeleton_timeout repeats are
// the rarest path AND every other write goes through the single-INSERT happy path.
async function tryIncrementSkeletonHourly(fingerprint, details) {
  // Look for existing skeleton_timeout row with this fingerprint in last hour
  const lookupUrl = `${SUPABASE_URL}/rest/v1/platform_alerts` + `?fingerprint=eq.${encodeURIComponent(fingerprint)}` + `&type=like.skeleton_timeout_*` + `&created_at=gte.${encodeURIComponent(new Date(Date.now() - 60 * 60_000).toISOString())}` + `&select=id,details` + `&order=created_at.desc` + `&limit=1`;
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
  // Breaker first — single shared mutable state check
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
  // Parse payload (defensive — never throw out of this handler)
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
  const fingerprint = `${type}::${normEndpoint}::${memberEmail ?? 'anon'}`;
  const severity = decideSeverity(type, normEndpoint);
  // Build the row. `details` is a text column in the live schema; we serialise
  // the incoming details (or the whole payload) to JSON text.
  const detailsSrc = typeof payload.details === 'object' && payload.details !== null ? payload.details : {
    raw: payload
  };
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
  // Skeleton timeout path: try to increment an existing row's counter first.
  // Falls through to INSERT on miss.
  let wrote = false;
  if (type.startsWith('skeleton_timeout')) {
    try {
      wrote = await tryIncrementSkeletonHourly(fingerprint, detailsSrc);
    } catch  {
      wrote = false;
    }
  }
  if (!wrote) {
    try {
      wrote = await insertAlert(row);
    } catch (err) {
      // Never throw — even on DB failure, we 200 to the client so the storm
      // shape (client retries the alert post on failure) is suppressed.
      console.warn('[platform-alert v10] insert failed', String(err));
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
