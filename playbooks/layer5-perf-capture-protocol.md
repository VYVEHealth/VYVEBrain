# Layer 5 perf capture protocol

**Drafted:** 12 May 2026, PM-66 staging session.
**Author:** Claude / Dean.
**Source refs:** `perf.js` (PM-21, 08 May 2026) and `log-perf` EF v1 verified live at vyve-site HEAD `6225d504`. PM-56 (11 May) wired perf.js across 20 gated pages. PM-21 backlog and PM-56 backlog reviewed. `perf_telemetry` table verified empty as of 08:00 UTC 12 May 2026.
**Purpose:** Operator capture sheet for the in-flight Layer 5 perf telemetry campaign. PM-56 closed the rollout with `📡 ACTIVE (Layer 5) — Perf telemetry collection running. From PM-56 close through ~18 May 2026. Target: enough warm-cache TTFP / FCP / LCP / INP / auth_rdy samples across the 21 gated pages to make an evidence-based [Layer 6 SPA shell] decision.` The campaign clock has been running for 24 hours with zero rows in `perf_telemetry` because no one has flipped the flag. This document is what to do next.

---

## TL;DR

1. **Infrastructure is shipped.** `perf.js` is wired on every inner page (verified at HEAD `6225d504` against 14 pages). `log-perf` EF v1 is live. `perf_telemetry` table is ready.
2. **Zero data captured.** Flag (`?perf=1` or `localStorage.vyve_perf_enabled='1'`) is default-off in production by design, and has not been flipped on any account in the test cohort.
3. **The Layer 6 SPA shell go/no-go decision (target 18 May per PM-56 backlog) currently has no evidence to decide against.** Capturing baseline data is the gating action.
4. **`vyvePaintDone` is dispatched by ZERO pages.** Capture falls back to FCP. For the four hand-rolled-cache surfaces this means "paint" = skeleton paint, not "real data shown" paint — a gap worth closing as a Layer 5 follow-up.

---

## Why this isn't a new playbook

The 8 May full-platform perf audit (`/playbooks/perf-audit-2026-05-08.md`) identified P0–P3 bottlenecks via static evidence alone, deliberately deferred telemetry, and shipped fixes for almost all P0/P1 items the same week (charity_total incremental, member-dashboard v61 compression, leaderboard v17 SQL ranking, theme.js throttle, refresh_member_home_state). The telemetry shim then shipped at PM-21 (also 8 May) and was rolled out cohort-wide at PM-56 (11 May). Layer 5 is the validate-after-fix step the audit explicitly designed for.

This playbook adds nothing architectural. It's the **operator capture sheet** that turns "flag is shippable" into "flag is flipped and producing rows."

---

## Capture protocol (5 minutes phone, 25 minutes app use)

**One-time setup.**

1. On the iPhone, navigate to `online.vyvehealth.co.uk` and log in.
2. Visit `online.vyvehealth.co.uk?perf=1` once. This sets `vyve_perf_enabled='1'` in localStorage; the flag persists across navigations.
3. *(Open question)* Confirm Capacitor iOS wrap (build 3) shares the same localStorage as the web shell. If not, the flag must be flipped inside the wrap separately. Recommendation: capture web-shell-only for v1 since most of the test cohort uses the web shell; address wrap parity as a follow-up.

**Cold capture — 5 minutes, the 9 high-value surfaces.**

Cold = first paint with no caches. For each surface:

1. Force-clear caches: Safari → AA menu → Website Settings → Clear cache. In the Capacitor wrap, sign out + sign in clears localStorage on the way back.
2. Visit the page from the top nav (real user navigation, not a hard URL load).
3. Wait 12 seconds (the `perf.js` setTimeout fallback flushes at 12s, ensuring metrics post even if the user doesn't navigate away).
4. Move to next page.

Surfaces in order of cache complexity (lightest to heaviest):

1. `sessions.html`
2. `leaderboard.html`
3. `certificates.html`
4. `monthly-checkin.html`
5. `wellbeing-checkin.html`
6. `engagement.html`
7. `habits.html`
8. `workouts.html`
9. `nutrition.html`

**Warm capture — 20 minutes, normal use.**

Just use the app normally for ~20 minutes, navigating between surfaces. Every page navigation fires one `perf.js` flush via `pagehide`. After 20 minutes there should be ~30–60 warm rows per surface.

**Confirmation.** Open `https://online.vyvehealth.co.uk?perf=1` once more to confirm the flag is still set. The Q1 query below will also tell us.

---

## Analysis SQL — paste into Supabase SQL Editor

### Q1. Coverage sanity — did we get data from every page?

```sql
SELECT
  page,
  count(*) AS total_rows,
  count(DISTINCT metric_name) AS distinct_metrics,
  min(ts) AS first_seen,
  max(ts) AS last_seen
FROM perf_telemetry
WHERE member_email = '<your-email>'
  AND ts > now() - interval '2 hours'
GROUP BY page
ORDER BY total_rows DESC;
```

**Pass criterion:** every PM-56 target surface returns ≥2 rows (1 cold + 1 warm). If a page is missing, `perf.js` failed to flush on it — investigate before continuing.

### Q2. The headline numbers — cold/warm p50/p95 per surface, per metric

`perf.js` doesn't tag rows as cold or warm directly. We infer: the **first** row per page within the session window is the cold capture, all later rows are warm.

```sql
WITH session_rows AS (
  SELECT
    page,
    metric_name,
    metric_value,
    ts,
    row_number() OVER (
      PARTITION BY page, metric_name
      ORDER BY ts
    ) AS visit_n
  FROM perf_telemetry
  WHERE member_email = '<your-email>'
    AND ts > now() - interval '2 hours'
),
tagged AS (
  SELECT
    page,
    metric_name,
    metric_value,
    CASE WHEN visit_n = 1 THEN 'cold' ELSE 'warm' END AS cohort
  FROM session_rows
)
SELECT
  page,
  metric_name,
  cohort,
  count(*) AS n,
  round(percentile_cont(0.5)  WITHIN GROUP (ORDER BY metric_value)::numeric, 1) AS p50_ms,
  round(percentile_cont(0.95) WITHIN GROUP (ORDER BY metric_value)::numeric, 1) AS p95_ms,
  round(min(metric_value)::numeric, 1) AS min_ms,
  round(max(metric_value)::numeric, 1) AS max_ms
FROM tagged
WHERE metric_name IN ('ttfb', 'fcp', 'lcp', 'auth_rdy', 'paint_done', 'inp')
GROUP BY page, metric_name, cohort
ORDER BY page, metric_name, cohort;
```

### Q3. The single number that matters most — warm FCP per surface

Premium-feel headline. Sub-200ms on warm cache = premium. 200–500ms = good. 500ms+ = visibly slow.

```sql
WITH session_rows AS (
  SELECT
    page,
    metric_value,
    row_number() OVER (PARTITION BY page ORDER BY ts) AS visit_n
  FROM perf_telemetry
  WHERE member_email = '<your-email>'
    AND ts > now() - interval '2 hours'
    AND metric_name = 'fcp'
)
SELECT
  page,
  count(*) FILTER (WHERE visit_n > 1) AS warm_visits,
  round(percentile_cont(0.5)  WITHIN GROUP (ORDER BY metric_value) FILTER (WHERE visit_n > 1)::numeric, 1) AS warm_fcp_p50,
  round(percentile_cont(0.95) WITHIN GROUP (ORDER BY metric_value) FILTER (WHERE visit_n > 1)::numeric, 1) AS warm_fcp_p95,
  CASE
    WHEN percentile_cont(0.5) WITHIN GROUP (ORDER BY metric_value) FILTER (WHERE visit_n > 1) < 200 THEN 'premium'
    WHEN percentile_cont(0.5) WITHIN GROUP (ORDER BY metric_value) FILTER (WHERE visit_n > 1) < 500 THEN 'good'
    ELSE 'slow'
  END AS verdict
FROM session_rows
GROUP BY page
ORDER BY warm_fcp_p50 NULLS LAST;
```

This is the board the Layer 6 SPA-shell go/no-go decision will be judged against, and the same board any future surface-level perf work (cache migrations, prefetch fan-out tweaks, EF compression) needs to clear before claiming a win.

---

## `vyvePaintDone` — Layer 5 follow-up

`perf.js` listens for a `CustomEvent('vyvePaintDone')` and records the first fire as `paint_done` metric. Without it, "paint" = FCP. With it, "paint" = "VYVE showed real cached or fresh data, not skeleton."

For the four hand-rolled-cache surfaces (`certificates.html`, `engagement.html`, `leaderboard.html`, `habits.html`), FCP fires when the skeleton paints — which is exactly what we *don't* want to measure as "paint."

One-line wiring inside each page's existing paint callback:

```javascript
// In each cache-painting page's onPaint / renderXxx function
try {
  window.dispatchEvent(new CustomEvent('vyvePaintDone', {
    detail: { source: fromCache ? 'cache' : 'fresh' }
  }));
} catch (_) {}
```

`perf.js` records on FIRST fire only, so dispatching from both the cache path and the fresh path is safe — earliest wins, typically cache-paint on warm and fresh-paint on cold.

Worth a 4-page atomic commit before the capture window closes ~18 May, so the Layer 6 decision has paint_done data not just FCP fallback. Estimate: half a session, Claude-assisted.

---

## Rollout sequence

| Step | What | Who | When | Output |
|---|---|---|---|---|
| 0a | Confirm Capacitor wrap localStorage parity with web shell | Dean | Before capture | Open question resolved |
| 0b | (Optional) Add `vyvePaintDone` to certificates/engagement/leaderboard/habits | Claude | Pre-capture if time, else post-capture | 4-file atomic commit |
| 1 | Flip `vyve_perf_enabled='1'` on iPhone, use app normally for 25 min | Dean | Any session before 18 May | ~50–100 rows in `perf_telemetry` |
| 2 | Run Q1, Q2, Q3, paste results into `/playbooks/layer5-perf-results.md` | Claude (with Dean's data) | Same session as Step 1 | Baseline numbers committed to brain |
| 3 | Layer 6 SPA-shell decision — go / no-go | Dean + Claude | ~18 May per PM-56 deadline | Either Layer 6 playbook drafted or Layer 6 dropped |

---

## Open questions for Dean

1. **Capacitor wrap localStorage shared with Safari?** Determines whether Layer 5 baseline includes wrap users in v1 or only web shell.
2. **Leave `vyve_perf_enabled='1'` on permanently for the test cohort post-baseline?** Recommendation: selftest + Dean only until sampling logic ships. Cohort-wide later if useful.
3. **Wire `vyvePaintDone` before or after capture?** Recommendation: after — capture FCP baseline first, then `vyvePaintDone` becomes the delta-improvement check.

---

## What this is NOT

- Not a Lighthouse run.
- Not a continuous monitor — no alerting, no SLO definitions.
- Not Capacitor-side timing (cold app launch, push arrival latency) — those need a separate native capture, out of Layer 5 scope.
- Not a new PM. PM-56 closed Layer 5 rollout; this is the operator sheet for the data-collection window PM-56 opened.

---

*End of Layer 5 perf capture protocol. Land alongside PM-67 design artefacts in the atomic brain commit when PM-66 ships.*
