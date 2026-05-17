// VYVE Health — platform-alert v9 (INCIDENT NO-OP — PM-149)
// Deployed 16 May 2026 during a site-wide login outage.
// v8 had no rate limit and broken dedup; a client-side error storm produced 40+
// concurrent 90-150s invocations that drained the shared Edge Function / Postgres
// connection pool on the nano-tier DB, starving GoTrue of connections and breaking
// login site-wide. This v9 is a deliberate no-op: it accepts every request,
// touches NOTHING (no DB, no Brevo, no VAPID push), and returns 200 instantly,
// so alert POSTs stop holding connections and the pool can recover.
// Restore the real platform-alert (with a working dedup key + rate limit + the
// dead-table push removed) as part of the PM-145 fix. Do NOT leave this in place
// long-term: platform monitoring is off while this is deployed.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
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
serve((req)=>{
  const CORS = getCORSHeaders(req);
  if (req.method === 'OPTIONS') return new Response('ok', {
    headers: CORS
  });
  // No-op: acknowledge and return immediately. Nothing is read, written, or sent.
  return new Response(JSON.stringify({
    success: true,
    deduplicated: true,
    noop: true
  }), {
    status: 200,
    headers: {
      ...CORS,
      'Content-Type': 'application/json'
    }
  });
});
