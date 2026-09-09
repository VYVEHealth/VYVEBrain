/*
 * VYVE Health — load and concurrency test (scorecard B7)
 * Written 9 September 2026 (PM-1143). Run this from your Mac; the Claude sandbox
 * cannot reach supabase.co, which is why this is a script rather than a result.
 *
 * WHAT THIS ANSWERS
 *   "Have you load tested?" is a standard enterprise question and "never" is the
 *   worst possible answer. This produces a number you can put in a questionnaire.
 *
 * INSTALL (once)
 *   brew install k6
 *
 * RUN — pilot load first (Bellway is ~30 people)
 *   export VYVE_URL="https://ixjfklpckgxrwjlfsaaz.supabase.co"
 *   export VYVE_ANON_KEY="<the anon key from the Supabase dashboard>"
 *   export VYVE_JWT="<a real member access_token — see NOTE below>"
 *   k6 run vyve-load-test.js
 *
 *   Then full-rollout load:
 *   k6 run -e PROFILE=rollout vyve-load-test.js
 *
 * NOTE ON THE TOKEN
 *   Use a TEST member, never a real one. Grab an access_token by signing in as that
 *   member and reading the session from the app, or mint one from the dashboard.
 *   Tokens expire in an hour, so re-grab if a long run starts 401-ing.
 *
 * WHAT IT DOES NOT DO
 *   No writes. Read-only by design so it can be pointed at production safely.
 *   If you want write-path load, do it against a branch, not prod.
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';

const URL  = __ENV.VYVE_URL;
const ANON = __ENV.VYVE_ANON_KEY;
const JWT  = __ENV.VYVE_JWT;
const PROFILE = __ENV.PROFILE || 'pilot';

if (!URL || !ANON || !JWT) {
  throw new Error('Set VYVE_URL, VYVE_ANON_KEY and VYVE_JWT before running.');
}

// Two profiles. Pilot models a Bellway-sized trial where everyone opens the app
// in the same morning window; rollout models the projected full deployment.
const PROFILES = {
  pilot:   [ { duration: '30s', target: 10 },
             { duration: '1m',  target: 30 },   // all 30 active at once
             { duration: '2m',  target: 30 },
             { duration: '30s', target: 0  } ],
  rollout: [ { duration: '1m',  target: 50 },
             { duration: '2m',  target: 200 },  // projected full rollout
             { duration: '3m',  target: 200 },
             { duration: '1m',  target: 0  } ],
};

const dashboard = new Trend('vyve_dashboard_ms', true);
const rpc       = new Trend('vyve_rpc_ms', true);
const table     = new Trend('vyve_table_read_ms', true);
const errors    = new Rate('vyve_errors');

export const options = {
  stages: PROFILES[PROFILE],
  thresholds: {
    // These are the numbers that become the questionnaire answer.
    'http_req_duration': ['p(95)<2000', 'p(99)<5000'],
    'vyve_errors':       ['rate<0.01'],
    'http_req_failed':   ['rate<0.01'],
  },
};

const authed = {
  headers: {
    'apikey': ANON,
    'Authorization': `Bearer ${JWT}`,
    'Content-Type': 'application/json',
  },
  tags: {},
};

export default function () {
  // 1. Cold app open — the heaviest single call a member makes.
  let r = http.post(`${URL}/functions/v1/member-dashboard`, '{}', authed);
  dashboard.add(r.timings.duration);
  errors.add(r.status !== 200);
  check(r, { 'dashboard 200': (x) => x.status === 200 });

  sleep(1);

  // 2. A representative authenticated RPC.
  r = http.post(`${URL}/rest/v1/rpc/my_challenges`, '{}', authed);
  rpc.add(r.timings.duration);
  errors.add(r.status >= 400);
  check(r, { 'rpc ok': (x) => x.status < 400 });

  sleep(1);

  // 3. A direct RLS-filtered table read — this is the path that exercises
  //    row-level security under concurrency, which is the interesting bit.
  r = http.get(`${URL}/rest/v1/daily_habits?select=*&order=created_at.desc&limit=20`, authed);
  table.add(r.timings.duration);
  errors.add(r.status >= 400);
  check(r, { 'table read ok': (x) => x.status < 400 });

  sleep(2);
}

export function handleSummary(data) {
  const p = (m, s) => {
    try { return Math.round(data.metrics[m].values[s]); } catch (e) { return 'n/a'; }
  };
  const out = `
VYVE load test — profile: ${PROFILE}
Run at: ${new Date().toISOString()}

  Requests:            ${p('http_reqs', 'count')}
  Failed:              ${(data.metrics.http_req_failed?.values?.rate * 100 || 0).toFixed(2)}%

  Overall p95:         ${p('http_req_duration', 'p(95)')} ms
  Overall p99:         ${p('http_req_duration', 'p(99)')} ms

  member-dashboard p95:${p('vyve_dashboard_ms', 'p(95)')} ms
  RPC p95:             ${p('vyve_rpc_ms', 'p(95)')} ms
  Table read p95:      ${p('vyve_table_read_ms', 'p(95)')} ms

Record these figures in brain/security_questionnaire.md §13 and in
policies/uptime-sla.md — they are the evidence behind any performance claim.
`;
  return { stdout: out, 'load-test-result.txt': out };
}
