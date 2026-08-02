// warm-ping v4 — expanded coverage
// Keeps high-traffic Edge Functions warm by hitting them every 5 minutes via cron.
// Each is hit with a no-auth OPTIONS preflight — zero DB queries, zero side effects.
//
// v4 changes (25 April 2026):
//   - Expanded from 3 → 10 EFs to cover every member-facing hot path.
//   - Added: leaderboard, anthropic-proxy, notifications, monthly-checkin,
//     off-proxy, workout-library, employer-dashboard.
//   - Cost: ~10 OPTIONS preflights × 288 cron firings/day = 2,880 invocations/day.
//     Well within Supabase Pro free-tier headroom.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const FUNCTIONS_TO_WARM = [
  // Original 3 (v1)
  'member-dashboard',
  'wellbeing-checkin',
  'log-activity',
  // Added in v4
  'leaderboard',
  'anthropic-proxy',
  'notifications',
  'monthly-checkin',
  'off-proxy',
  'workout-library',
  'employer-dashboard'
];
async function pingFunction(name) {
  const url = `${SUPABASE_URL}/functions/v1/${name}`;
  const start = Date.now();
  try {
    const res = await fetch(url, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://online.vyvehealth.co.uk',
        'Access-Control-Request-Method': 'GET'
      }
    });
    return {
      name,
      status: res.status,
      ms: Date.now() - start
    };
  } catch (_err) {
    return {
      name,
      status: 0,
      ms: Date.now() - start
    };
  }
}
serve(async (_req)=>{
  const results = await Promise.all(FUNCTIONS_TO_WARM.map(pingFunction));
  const summary = results.map((r)=>`${r.name}: ${r.status >= 200 && r.status < 400 ? '✓' : '✗'} ${r.status} (${r.ms}ms)`).join(', ');
  console.log(`warm-ping v4: ${summary}`);
  return new Response(JSON.stringify({
    ok: true,
    version: 4,
    count: results.length,
    pinged: results,
    ts: new Date().toISOString()
  }), {
    headers: {
      'Content-Type': 'application/json'
    }
  });
});
