// vyve-capacity-test.js — PM-1152 capacity measurement (open model)
//
// WHY THIS EXISTS, and why it is not vyve-load-test.js:
// vyve-load-test.js is a CLOSED-loop test. Each VU waits for a response before sending its
// next request, so when the platform slows down the test automatically stops pushing. That
// makes it useless for measuring capacity: run 3 (PM-1151) reported HIGHER throughput than
// run 2 partly because more requests got through, not because we sent more.
// Real users arrive whether or not we are ready. Both scenarios below use an ARRIVAL-RATE
// executor, which holds a target requests-per-second regardless of latency. One iteration =
// one member home load, so the target rate IS "home loads per second" — the number we want
// to be able to state.
//
// USAGE (fresh token each run — they expire hourly):
//   export VYVE_URL="https://ixjfklpckgxrwjlfsaaz.supabase.co"
//   export VYVE_ANON_KEY="<anon key>"
//   export VYVE_JWT="<member access_token>"
//   k6 run --env SCENARIO=knee      vyve-capacity-test.js     # ~13 min, finds the ceiling
//   k6 run --env SCENARIO=push      vyve-capacity-test.js     # ~8 min, simulates 5k/10k/20k push
//
// Token, from the browser console on online.vyvehealth.co.uk while logged in:
//   JSON.parse(localStorage.getItem(Object.keys(localStorage).find(k=>k.includes('auth-token')))).access_token
//
// READING THE RESULT:
//   The knee is the target rate at which p95 first crosses 1s, or the first non-2xx appears.
//   Both scenarios abort early if p95 passes 5s, so a failing run ends in seconds, not minutes.
//   The dropped_iterations metric matters: it means k6 could not launch requests fast enough
//   to hold the target rate, i.e. the platform is already saturated. Report it alongside p95.

import http from 'k6/http';
import { check } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';

const URL  = __ENV.VYVE_URL;
const ANON = __ENV.VYVE_ANON_KEY;
const JWT  = __ENV.VYVE_JWT;
const WHICH = (__ENV.SCENARIO || 'knee').toLowerCase();

const homeLatency = new Trend('home_load_duration', true);
const homeFailed  = new Rate('home_load_failed');
const homeOk      = new Counter('home_load_ok');

// Ramp 2 -> 45 home loads/sec over ~11 minutes, holding each step long enough to be real.
// 12/s is roughly the band proven clean at 50 closed-loop VUs; 45/s is roughly the old 200-VU run.
const kneeStages = [
  { target: 2,  duration: '1m' },
  { target: 5,  duration: '2m' },
  { target: 10, duration: '2m' },
  { target: 15, duration: '2m' },
  { target: 22, duration: '2m' },
  { target: 32, duration: '2m' },
  { target: 45, duration: '2m' },
  { target: 0,  duration: '30s' },
];

// Push-notification herd. Each step is what a simultaneous send produces at that member count,
// assuming ~20% of recipients open within two minutes (see brain 23.295).
//   8/s  ~= 5,000 members     17/s ~= 10,000 members     33/s ~= 20,000 members
const pushStages = [
  { target: 8,  duration: '2m' },
  { target: 17, duration: '2m' },
  { target: 33, duration: '2m' },
  { target: 0,  duration: '30s' },
];

const common = {
  executor: 'ramping-arrival-rate',
  startRate: 1,
  timeUnit: '1s',
  preAllocatedVUs: 120,
  maxVUs: 700,          // headroom so k6 itself is never the bottleneck
  gracefulStop: '30s',
};

export const options = {
  discardResponseBodies: false,
  scenarios: WHICH === 'push'
    ? { push_herd: { ...common, stages: pushStages } }
    : { knee:      { ...common, stages: kneeStages } },
  thresholds: {
    // abortOnFail stops a doomed run early instead of sitting in 60s timeouts
    'home_load_duration': [{ threshold: 'p(95)<5000', abortOnFail: true, delayAbortEval: '30s' }],
    'home_load_failed':   ['rate<0.01'],
  },
};

const params = {
  headers: {
    apikey: ANON,
    Authorization: 'Bearer ' + JWT,
    'Content-Type': 'application/json',
    Origin: 'https://online.vyvehealth.co.uk',
  },
  timeout: '20s',        // fail fast; a 20s home load is already a total failure
  tags: { endpoint: 'member-dashboard' },
};

export function setup() {
  if (!URL || !ANON || !JWT) {
    throw new Error('Set VYVE_URL, VYVE_ANON_KEY and VYVE_JWT before running.');
  }
  const probe = http.get(URL + '/functions/v1/member-dashboard', params);
  if (probe.status !== 200) {
    throw new Error('Pre-flight failed with status ' + probe.status +
      ' — token is probably expired. Grab a fresh one and re-run.');
  }
  console.log('Pre-flight OK, scenario: ' + WHICH);
}

// One iteration = one member opening the app. No sleep: the arrival rate controls pacing.
export default function () {
  const r = http.get(URL + '/functions/v1/member-dashboard', params);
  homeLatency.add(r.timings.duration);
  const ok = r.status === 200;
  homeFailed.add(!ok);
  if (ok) homeOk.add(1);
  check(r, { 'home load 200': () => ok });
}
