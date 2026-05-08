## Added 08 May 2026 PM-22 (`leaderboard` v17 · SQL-side ranking via `get_leaderboard()` RPC)

- ✅ **CLOSED — Reframing decision: snapshot table → SQL-side ranking.** Pre-flight against the live `leaderboard` source showed v11/v16 was already reading from `member_home_state` (not aggregating activity tables — that work was done when the aggregate was built). The actual cliff is the JS sort + 50MB+ wire payload at 100K members, not live aggregation. Snapshot table would add 24h staleness for no underlying win — the cron still has to sort over all members, and the leaderboard is a feature where real-time position matters. Right fix: push sort + top-100 slice into Postgres window functions, return ~6KB regardless of scale.

- ✅ **CLOSED — Migration `pm22_create_get_leaderboard_rpc` applied.** `public.get_leaderboard(p_email text, p_scope text, p_range text) RETURNS jsonb`. `STABLE`, `SECURITY DEFINER`, `SET search_path = public`. Single CTE chain over `member_home_state` ⋈ `members` ⋈ `employer_members`. Four parallel `ROW_NUMBER()` window orderings (one per metric). Server-side `display_name` resolution from `display_name_preference`. Returns full v11-shape response via `jsonb_build_object`. ~9KB SQL, ~330 lines. `GRANT EXECUTE` to `authenticated, service_role`.

- ✅ **CLOSED — `leaderboard` EF v17 deployed.** Platform v17, ezbr `ee55c3fe3a1e060f0eabb20e895ddab619229a769306287a4d0234a6d0d181c2`. ~110 lines TS — parses params, JWT-validates (with `?email=` back-compat), calls RPC, returns. `verify_jwt:false` at gateway with internal validation per §23 custom-auth pattern. CORS unchanged from v11. Already in `warm-ping` keep-warm list (added 25 April per warm-ping v4) — cold-start exposure mitigated.

- ✅ **CLOSED — Functional parity verified live.** Full v11 contract shape diff: top-level keys, per-metric keys, ranked-entry keys, above-entry keys all match — no missing fields, no extras. Edge cases live-tested: caller in zero bucket (rank against full sorted list, `caller_in_ranked:false`, `gap:0`); caller at #1 (`above:[]`); `scope=company` with no employer (falls back to caller-only); `range=all_time` uses `overall_streak_best`. Portal pages did not need to change.

- ✅ **CLOSED — Timing measured.** 9ms warm over 5 iterations at 15 members. Cold compile 58ms (one-shot plan compilation). At-scale projection: window functions are `O(n)` for top-N over indexed scan vs the v11 JS path's `O(n log n)` × 4 sorts; wire payload bounded by response shape (~6KB) not by table size.

- 📋 **NEW (low priority) — Index on `member_home_state(member_email)` if not already present.** The RPC's `is_caller` lookups inside each `pm_*` CTE materialise via subquery on `email = v_email`. Should be a hash-table probe on the existing pool, not an index seek, but worth checking the EXPLAIN plan once we have a meaningful member count to see whether Postgres picks a different plan at 100K rows.

- 📋 **NEW (low priority) — Consider materialised view if RPC-per-load is the bottleneck at >1M members.** RPC on every load is fine up to ~1M members on the back of `member_home_state`'s incremental aggregate maintenance. Beyond that, a materialised view refreshed every N minutes (still real-time-ish) is the next escalation step before going full snapshot-table. Not now — speculative.

## Added 08 May 2026 PM-21 (perf telemetry pipeline · `perf_telemetry` + `log-perf` v1 + `perf.js`)

- ✅ **CLOSED — `perf_telemetry` table created.** Migration `pm21_create_perf_telemetry`. Bigserial PK, member_email / page / metric_name / metric_value(double) / nav_type / ua_brief / ts. RLS service-role-only with `(SELECT auth.role())` wrap per §23. Two indexes: `idx_perf_telemetry_page_metric_ts` on `(page, metric_name, ts DESC)`, `idx_perf_telemetry_ts` on `(ts DESC)`.

- ✅ **CLOSED — `log-perf` v1 deployed.** Platform v1, ezbr `9df3ce50315f7c7ad6592ab4f8c350a0c749667bb7d758c7d46700992be9afcb`. `verify_jwt:false` at gateway with internal `getAuthEmail()` JWT validation per §23 custom-auth pattern. 100KB payload cap, 50 metrics/request max, CORS default-origin, returns 204 on success. Curl with no auth → HTTP 401 confirmed live. Email derived from JWT, never read from body.

- ✅ **CLOSED (partial) — `perf.js` client shim shipped on `index.html`.** vyve-site HEAD `df41d7cb`. Default-off in production, opt-in via `?perf=1` URL once (persists in `localStorage.vyve_perf_enabled='1'`). Captures TTFB / DOM done / load / FP / FCP / LCP / INP plus VYVE-custom `auth_rdy` (vyveAuthReady vs fetchStart) and `paint_done` ('vyvePaintDone' event vs fetchStart). `fetch + keepalive` on pagehide (sendBeacon can't carry Authorization). 12s fallback flush. Script tag added after auth.js with defer. SW cache `monthly-defer-e` → `perf-shim-f`.

- 📋 **OPEN — PM-21 follow-up: extend `<script src="/perf.js" defer>` across the rest of the portal.** Trigger after a few days of index.html data confirm the shim is overhead-neutral (specifically: paint metrics on instrumented sessions match paint metrics on uninstrumented sessions within noise). Pages to wire: `habits.html`, `workouts.html`, `exercise.html`, `nutrition.html`, `sessions.html`, `engagement.html`, `leaderboard.html`. Trivial — script tag injection per page + SW cache bump in the same commit. ~30 min for the lot.

- 📋 **OPEN — Read query for daily percentile rollup.** Not a build item, just the canonical query to keep next to the table:
  ```sql
  SELECT page, metric_name,
    percentile_cont(0.5)  WITHIN GROUP (ORDER BY metric_value) AS p50,
    percentile_cont(0.95) WITHIN GROUP (ORDER BY metric_value) AS p95,
    COUNT(*) AS n
  FROM perf_telemetry
  WHERE ts > now() - interval '1 day'
  GROUP BY 1, 2 ORDER BY 1, 2;
  ```
  Wrap into a `\set` or a saved view if it gets used daily.

## Added 08 May 2026 PM-20 (`monthly-checkin.html` · nav.js + offline-manager.js → defer)

- ✅ **CLOSED — Defer lift on monthly-checkin.html.** vyve-site `2bfc4478`. `nav.js` and `offline-manager.js` lifted to `defer`; `theme.js` stayed sync per §23 PM-7 (FOUC). SW cache `eager-prefetch-d` → `monthly-defer-e`. Verified via GitHub Contents API on the new HEAD.

- 📋 **OPEN (P2) — `vyve-offline.js` defer-safe rewrite across 8 portal pages.** Audit during PM-20 surfaced 8 pages with `<script src="/vyve-offline.js">` un-deferred in head, consumed by inline blocks on the host pages via `window.VYVEData` references. Lifting to defer requires the inline consumers to be rewritten to await a ready signal — defer reorders execution past inline parse-time references. Affected: `events-live.html` (3 refs), `index.html` (4 refs), `log-food.html` (25 refs — biggest lift), `running-plan.html` (3 refs). Same anti-pattern with `/supabase.min.js` on `hk-diagnostic.html`, `login.html`, `set-password.html`. Real refactor not a sweep. Tag P2.

- 📋 **OPEN — `theme.js` defer drift on `index.html` — INVESTIGATE before assuming it's a bug.** §23 PM-7 hard rule says theme.js must NEVER carry `defer` (FOUC prevention). index.html main HEAD `df41d7cb` has `<script src="/theme.js" defer>` shipped. Two possibilities: (a) the rule is overly strict and theme.js's apply-from-localStorage IIFE is effectively-sync-enough under defer for the FOUC case to not visually trigger — codify the exception; (b) bona-fide drift that snuck in during PM-18 — revert and bump SW cache. Don't paper over either way. Read theme.js source, test in fresh incognito with throttled CPU, decide. ~30 min.

## Added 08 May 2026 PM-19 (`log-activity` v29 · write-response `home_state` payload + optimistic delta)

- ✅ **CLOSED — `log-activity` v29 deployed.** Source v29 / platform v34, ezbr `68d62d9c0c94dd75b2221f1cd91cc739083faf50cf224f31907a9e937cbf6762`. Write paths return post-write `member_home_state` row + optimistic delta for the just-logged type. `evaluate_only:true` short-circuit and cap-skip path also return `home_state` (delta null on cap-skip). One response shape across all write paths.

- 📋 **OPEN — Portal-side opportunistic update consumer.** The follow-up that earns the win: after a habit / workout / cardio log, paint the next dashboard nav from the `home_state` returned by `log-activity` rather than round-tripping `member-dashboard`. Touches every trigger page (habits / workouts / cardio / sessions). Scope after a few days of `perf_telemetry` data show where the round-trip cost actually surfaces. Don't speculate — measure first.

## Added 08 May 2026 PM-18 hotfix (home cache key alignment)

- ✅ **CLOSED — Cache-key writer renamed `vyve_home_cache_<email>` → `vyve_home_v3_<email>`.** vyve-site `81908633`. PM-18 fan-out was writing to a key the home-page reader didn't read; rename aligned them. Verified end-to-end: sign-in → fan-out write → next nav paints from cache zero-RTT.

## Added 08 May 2026 PM-18 (eager prefetch fan-out + universal touchstart-nav prefetch)

- ✅ **CLOSED — Eager prefetch fan-out in `auth.js`.** Post-getSession microtask prefetches `member-dashboard` payload + the major secondary caches (`vyve_workouts_v1`, `vyve_exercise_v1`, etc.) so first internal nav after sign-in paints from cache zero-RTT.

- ✅ **CLOSED — Universal touchstart-nav prefetch.** Delegated `touchstart` listener watches in-app nav anchors and kicks off destination prefetch immediately — typical 150-300ms tap-to-click window absorbs most prefetch latency. Pairs with cache-paint-then-revalidate on the destination for the cases where prefetch doesn't beat the nav.

- 🔧 **Hotfix follow-up captured separately above.** First-evening post-ship caught a cache-key drift between the writer (PM-18) and the reader (cache-paint-before-auth migration); fixed in PM-18 hotfix.

## Still pending (not started)

- 📋 **PM-22 — leaderboard snapshot table + cron + EF rewrite.** ~4-6h. The current leaderboard EF computes ranks live on every load against full activity tables; at 100K members this is the next scaling cliff after the PM-16 re-engagement fix. Snapshot pattern: nightly cron writes a denormalised `leaderboard_snapshot` row per member with `(rank, score, period, computed_at)`, EF reads from snapshot only and serves stale-by-up-to-24h. Same pattern as `member_home_state`. Spec the migration + cron + EF rewrite together; ship the table first then flip the EF.

## Added 08 May 2026 PM-17 (member-dashboard v61 · drop 4 this-week queries · cache 3 INLINE counts)

- ✅ **CLOSED — `member-dashboard` v61 deployed.** Platform v67, ezbr `72ce2bbe…`. Three files: `index.ts` 19004 chars, `_shared/achievements.ts` 13580, `_shared/taxonomy.ts` 4303 (byte-identical). Promise.all gateway shrunk from 22 to 18 entries; 4 this-week PostgREST queries dropped (now read from `state.workouts_this_week` / `cardio_this_week` / `sessions_this_week` / `checkins_this_week`). Three INLINE evaluators (`workouts_logged` / `cardio_logged` / `checkins_completed`) routed through cached `homeStateRow` via extended `HOME_STATE_STREAK_FIELDS`. `habitsThisWeek` query stays — goal-progress meter needs `COUNT(DISTINCT activity_date)` and the column is `COUNT(*)`. Same staleness contract as the totals already served from `member_home_state`. Deno typecheck clean. 401-handler verified live via curl.

- 📋 **NEW (low priority) — Daily `member_home_state` reconciliation alert.** Carry-forward from the now-closed P1-1. Detect drift between `member_home_state.{workouts_total, cardio_total, checkins_total, *_this_week, *_streak_*}` and source-table-derived recomputation. Cron at 03:00 UTC running `recompute_all_member_stats()` against a single canary member, comparing post-write row to a fresh aggregate query, alerting on any mismatch > 0. Cheap insurance now that the dashboard reads from these cols on every load and the achievement evaluators inherit the same staleness. ~1h.

- 📋 **NEW (low priority) — Eager `homeStateRow` fetch from auth.js.** v61 still has the achievements module fetching `member_home_state` independently from the dashboard's own SELECT. Could fan out from `auth.js` post-getSession, prime a sessionStorage cache the EF reads via a header. Marginal gain (one round trip) — measure first.

## Added 08 May 2026 PM-16 (re-engagement-scheduler v11 · scaling fix on dormancy lookup)

- ✅ **CLOSED — `re-engagement-scheduler` v11 deployed and verified.** Platform v31, ezbr `0b58be0d…`. Replaces 4 `.in()` queries against activity tables with single `.in()` against `member_home_state` for the 5 new `last_*_at` cols. At 100K members the old shape pulled millions of rows; new shape pulls one row per active member. Verified live PM-17 via curl: HTTP 200, version: 11, processed 15 / 0 errors, A/B classification working against new shape. The "network proxy blocked test invocation at deploy time" caveat is now closed.

- ✅ **CLOSED — Migrations `pm16_add_last_at_columns_to_member_home_state` + `pm16_extend_refresh_member_home_state_with_last_at`.** Five new nullable timestamptz cols (`last_habit_at` / `last_workout_at` / `last_cardio_at` / `last_session_at` / `last_checkin_at`) + index on `last_activity_at`. Backfilled all 30+ existing rows. `refresh_member_home_state(p_email)` extended to populate the 5 cols on every refresh. Dean's row verified.

- ✅ **CLOSED — New §23 hard rule: perf rewrites of dormant cron functions verify against live source.** PM-16 audit named `recompute_all_member_stats()` and `daily-report` v8 as the cliffs but both were already in their PM-11 incremental shape — audit's diagnosis had been overtaken. Lesson codified in master.md §23.

## Added 08 May 2026 PM-15 (paint-timing audit · 10 candidate pages · 1 fix)

- ✅ **CLOSED — Paint-timing audit completed across 10 candidate pages.** vyve-site `7e5ab3f1`. Pages audited: exercise.html / certificates.html / settings.html / nutrition.html / sessions.html / leaderboard.html / log-food.html / wellbeing-checkin.html / running-plan.html / workouts.html. Eight already correct (paintCacheEarly IIFE pattern, or AI/network-honest by design). One fix: `workouts-programme.js` got a synchronous `paintProgrammeFromCache()` IIFE at the top that reads `vyve_auth` → email, reads `vyve_programme_cache_<email>`, sets module-scope vars, calls `renderProgramme()`. Boot path's `loadProgramme()` still runs on auth for network refresh. SW cache `microtask-workouts-b` → `paint-programme-c`.

## Added 08 May 2026 PM-14 (index.html prefetch fan-out · workouts/exercise lifted to microtask)

- ✅ **CLOSED — Workouts/exercise prefetch in `index.html` lifted from idle to microtask.** vyve-site `3719e305`. Block #2 of `_vyvePrefetchNextTabs` was still wrapped in `_idle(...)` post-PM-13. Lifted to `Promise.resolve().then(...)`. Block #1 (nutrition) stays idle-gated — heavier, less critical. Block #3 (habits) was already on microtask from PM-13. SW cache `precache-engagement-workouts-a` → `microtask-workouts-b`.

## Added 08 May 2026 PM-13 (SW precache + habits prefetch out of idle)

- ✅ **CLOSED — engagement.html + workouts.html added to SW precache list.** vyve-site `186b432944`. PM-12 left these two pages un-precached so first-navigation HTML arrival was network-bound even with PM-7 SWR. Now both join habits/nutrition/exercise/sessions/movement/cardio/certificates in `urlsToCache`. Trade-off: ~140KB extra at install for first-tap-no-wait afterwards.

- ✅ **CLOSED — Habits prefetch lifted out of `requestIdleCallback`.** vyve-site `186b432944`. Was `_idle(...)` (~1.5s on Safari via setTimeout fallback). Now microtask via `Promise.resolve().then(...)` — runs after current frame, fires before user can tap habits. Members + programme prefetches stay idle-gated.

- 📋 **NEW (low priority) — Cold-cache-first-visit case for engagement.** Member with no cache who taps engagement before index has run hits full network round trip. Possible fixes: (a) eager prefetch on login (move out of `loadDashboard` into `auth.js` post-getSession), (b) more aggressive SW pre-population. Don't ship until we have evidence it's a real symptom — most users hit home first.

- 📋 **NEW (low priority) — Workouts cold-tap parity.** Workouts.html now in SW precache but the `vyve_programme_cache_<email>` prefetch is still idle-gated. If members report workouts feels slow after engagement is faster, lift it to microtask too. Heavier than habits so left idle-gated for now.

## Added 08 May 2026 PM-12 (engagement + habits paint-timing fix shipped)

- ✅ **CLOSED — engagement.html + habits.html cache-paint-before-auth.** vyve-site `3fcd9169`. Both pages now discover email from cache synchronously, paint without waiting for auth.js to load, then await auth internally for the network refresh. _vyveWaitAuth() helper added to both. Index prefetch wave extended to warm vyve_habits_cache_v2. SW cache `theme-throttle-8` → `paint-engagement-habits-9`. New §23 hard rule codified.

- ✅ **CLOSED — Paint-timing audit completed (PM-15).** All 10 candidate pages audited. Eight already correct. One fix: `workouts-programme.js` got the synchronous paint IIFE pattern. vyve-site `7e5ab3f1`. Cache `paint-programme-c`.

- 📋 **PROMOTED — Telemetry shim from PM-10 audit P2.** Re-tiered up. PM-12 was a paint-timing miss in the static audit; only browser-level timing instrumentation would have caught it. Build the `?perf=1` gated `perf.js` + `perf_telemetry` table + `log-perf` EF when bandwidth allows — it's the only way to catch the next paint-timing drift before users do.

## Added 08 May 2026 PM-11 (P0-1 + P2-1 shipped)

- ✅ **CLOSED P0-1 — `get_charity_total()` → `platform_counters` increment-on-write.** Migration `p0_1_charity_total_incremental_counter`. New table + 6 trigger fns + bump helper + reconcile-and-heal cron (jobid 23, `vyve_charity_reconcile_daily` 02:30 UTC). Backfilled to 444 byte-matching legacy. EXPLAIN ANALYZE 127.5ms → 0.93ms (137× faster, scale-flat). Stress test verified cap=1 and cap=2 paths both correct. New §23 hard rule codified for the incremental-aggregate pattern.

- ✅ **CLOSED P2-1 — `theme.js` skip Supabase fetch if localStorage is fresh.** vyve-site `7ff486f4`. 1h TTL via `vyve_theme_synced_at` stamp; `vyveSetTheme()` refreshes the stamp on write-through. SW cache `prefetch-exercise-7` → `theme-throttle-8`. node --check clean both files. Post-commit Contents-API verification: 5427 + 6164 bytes both match. New §23 hard rule for member-pref throttled-sync pattern.

- 📋 **NEW (low priority) — Generalise the `bump_*_counter` helper.** Currently `bump_charity_total(p_delta)` is hardcoded to `counter_key = 'charity_total'`. When the next platform-wide aggregate ships, refactor into a generic `bump_platform_counter(p_key, p_delta)` so we don't fan out the same SECURITY DEFINER pattern. Not urgent — current shape is fine for one counter.

- 📋 **NEW (low priority) — Sibling-trigger family alignment.** `charity_count_*` family and `increment_*_counter` family share cap math but write to different surfaces. Future cap-rule changes must update BOTH or we get drift between `platform_counters.charity_total` and `members.cert_*_count`. Worth a comment in `set_activity_time_fields` and the cap functions pointing at the two trigger families. ~15 min cleanup.

- 📋 **NEW (low priority) — `replay_views` per-member cert tracking gap.** PM-11 added charity_total tracking for replays, but the per-member `cert_*_count` family still doesn't track replays separately — they fold into `cert_sessions_count` via `replay_views_cert_count_trigger`. Probably correct for current product framing (replays + live sessions = one cert track) but flag for future product reviews.

## Added 08 May 2026 PM-10 (Perf audit playbook · ship-now and pre-launch items)

Full audit at `/playbooks/perf-audit-2026-05-08.md` — read first before actioning any item below. Each entry below is a one-line pointer; the playbook has EXPLAIN ANALYZE evidence, fix shapes, time + risk + sign-off per item.

### Ship-now (≤1 day)

- 🚀 **P0-1 — `get_charity_total()` → `platform_counters` increment-on-write.** #1 query in pg_stat_statements (577s total, 190ms mean). 6-table UNION ALL that scales linearly in total platform activity. At 100K members this hits work_mem ceiling and statement_timeout. Already on member-dashboard hot path. Fix: `platform_counters` table, AFTER INSERT/DELETE triggers on the 6 source tables, function body becomes O(1) read. Concrete shape in playbook §P0-1. ~3-4h Claude-assisted, Dean sign-off only, reversible. **Highest-priority perf fix on the platform right now.**

- 🚀 **P2-1 — `theme.js` skip Supabase fetch if localStorage is fresh.** 5247 calls in pg_stat_statements, fires on every page load. Cross-device sync should run once per session via `vyve_theme_synced_at` localStorage timestamp. ~30 min, Dean sign-off only.

### Pre-launch (before public-launch comms)

- ✅ **CLOSED P0-2 — `re-engagement-scheduler` LEFT JOIN cartesian fixed.** `recompute_all_member_stats()` and `daily-report` v8 were already in their PM-11 incremental shape (audit was partially stale). The actual cliff was `re-engagement-scheduler` v10 doing 4 parallel `.in()` queries against `daily_habits` / `workouts` / `session_views` / `wellbeing_checkins` and computing `MAX(activity_date)` in JS — millions of rows at 100K members. PM-16 chose Option B (cleaner): added 5 `last_*_at` cols to `member_home_state` + index, extended `refresh_member_home_state` to populate, rewrote v11 to read from `member_home_state` via single `.in()` (one row per active member regardless of activity volume). Migrations `pm16_add_last_at_columns_to_member_home_state` + `pm16_extend_refresh_member_home_state_with_last_at`. EF v11 platform v31, ezbr `0b58be0d…`. Verified live PM-17: HTTP 200, version: 11, processed 15 / 0 errors.

- ✅ **CLOSED P1-1 — `member-dashboard` v60 + v61 staged compression complete.** PM-13 (v60) parallelised both achievements `INLINE` evaluator passes via `Promise.all` (was 23 serial PostgREST round trips) and pre-fetched the 6 streak fields from `member_home_state` in a single shot. PM-17 (v61) dropped 4 of 5 this-week PostgREST queries (workouts/cardio/sessions/checkins → `state.*_this_week`) and routed 3 INLINE evaluators (`workouts_logged` / `cardio_logged` / `checkins_completed`) through the cached `homeStateRow`. Net: gateway 22 → 18 queries; achievements pass 23 → 20 round trips. v61 platform v67, ezbr `72ce2bbe…`. Daily reconciliation cron for `member_home_state` vs source-table count drift retained as backlog item below.

- 📋 **P1-2 — `leaderboard` snapshot table + refresh cron.** EF reads all members + home_state + employer rows unbounded. ~50MB JSON at 100K members. Fix: pre-computed `leaderboard_snapshot` keyed (scope, range, metric, member), refresh cron every 5 min. ~4-6h.

### At-scale (post-1K members)

- 📋 **P2-2 — `refresh_member_home_state()` async pipeline.** 207ms synchronous trigger × 10 source tables × write-burst peaks → 8+ cores burned at 100K members; Pro plan has 4. Convert to pg_notify + LISTEN background drain, debounced 5s per email. Or incremental column updates from triggers.

- 📋 **P3-1 — Lift Pro plan defaults: `work_mem` (2.1MB → 8MB+), `max_connections` (60 → 200+).** Via Supabase support ticket once we have evidence of saturation.

- 📋 **P3-2 — `member_health_samples` partitioning by `start_at` month.** Already 6.8K rows at 4 active HK members; ~5.5B rows/year projected at 100K members. Partition + rollup retention.

- 📋 **Telemetry shim** — `perf.js` + `perf_telemetry` table + `log-perf` EF. Deferred from the audit session because static evidence was sufficient. Build when post-fix measurement matters; gate on `?perf=1` query string for prod deployment.

### Not-worth-it / hygiene only

- ❌ Achievements catalog cross-isolate cache (P2-3 in playbook). Wait for Edge KV GA.
- ❌ The 5 `ON DELETE NO ACTION` → CASCADE FK standardisations from memory. No perf impact at any scale, hygiene only — keep on the existing pre-launch hygiene list.

---

## Added 08 May 2026 PM-9 (Index prefetch extended to exercise cache)

- ✅ **CLOSED — Prefetch exercise cache from index.html.** vyve-site `a2c99e46`. `_vyvePrefetchNextTabs` now writes both `vyve_programme_cache_<email>` and `vyve_exercise_cache_v2` from the single `workout_plan_cache` fetch. Zero extra network, both pages paint from warm cache after any home visit.

- 📋 **NEW (medium priority) — Universal touchstart nav-button prefetch.** Currently prefetch fires only from index.html's `_vyvePrefetchNextTabs`. If a member taps Exercise from Nutrition (or any non-home page), the cache might be cold. Right pattern: in `nav.js`, attach `touchstart` listeners to bottom-nav anchors. When a finger lands, fire the prefetch for the destination page; by the time the tap (~80-120ms later) navigates the page, cache is partially or fully warm. Per-destination: home → none, exercise → vyve_exercise_cache_v2 + vyve_programme_cache, nutrition → vyve_members_cache, sessions → no fetch (static). Network gate as PM-5 (`navigator.connection`). Estimated 1h. Universal coverage from any page → any nav target.

## Added 08 May 2026 PM-8 (RLS auth-function wrap shipped · the actual perf bottleneck)

- ✅ **CLOSED — RLS auth-function wrap migration.** Migration `wrap_auth_functions_in_rls_policies` rewrote 72 policies across ~50 tables to use `(SELECT auth.X())` instead of bare `auth.X()`. Plus 2 redundant `members` policies dropped. EXPLAIN ANALYZE on `workout_plan_cache` primary query: Planning 327.9ms → 11.6ms (28× faster), Execution 19ms → 1.1ms (17× faster). REST endpoint round-trip from remote workbench: ~30000ms cold / 1500-3200ms warm → 307-888ms avg 543ms. Real-device should be 50-200ms.

- 📋 **NEW (high priority) — Add a perf-focused RLS lint to CI / pre-deploy.** The Supabase security audit (commits 1-4) didn't surface the auth-wrap pattern because it was scoped at correctness, not perf. Add a check to a future deploy gate: `SELECT COUNT(*) FROM pg_policies WHERE schemaname='public' AND ((qual ~ 'auth\.(email|uid|jwt|role)\s*\(\s*\)' AND qual !~ 'SELECT\s+auth\.(email|uid|jwt|role)') OR (with_check ~ 'auth\.(email|uid|jwt|role)\s*\(\s*\)' AND with_check !~ 'SELECT\s+auth\.(email|uid|jwt|role)'))` — should always be 0. Fail the deploy if it isn't. Lightweight, mechanical. Backlog for whoever sets up CI gates next.

- 📋 **NEW (medium priority) — Remote-workbench REST RTT is still 543ms avg post-fix.** Even with planning + execution dropped to ~13ms combined, the workbench-to-Supabase round trip is ~500ms. That's network + TLS + Supabase gateway + PostgREST overhead. Some of this is unavoidable for cross-region requests, but worth checking from a real UK iPhone whether Lewis's experience is now in the 50-200ms target range. If real-device perf is still slow, next likely culprit is the `member-dashboard` EF (which wraps multiple PostgREST queries) or PostgREST gateway latency itself. Won't action until Lewis re-tests.

- 📋 **NEW (low priority) — `auth.email()` returns email AND requires JWT decode every call.** Even with the wrap, every authenticated query pays for JWT verification + claim extraction. For ultra-high-frequency surfaces (e.g. real-time leaderboard polling), consider alternative scoping via service_role + an EF-level email param. Not urgent — current page perf is fine post-PM-8.

## Added 08 May 2026 PM-7 (SW HTML SWR shipped · perf project actually closed · script-tag deferring sweep opened)

- ✅ **CLOSED — Real perf project closure: SW HTML stale-while-revalidate.** vyve-site `3a20fcda` + cleanup `e72f672b`. The whole cache-paint perf project (PM-3 through PM-6) had been silently bottlenecked by the SW's `network-first` HTML strategy, which waited a full network round trip on the HTML doc itself on every navigation before any downstream optimisation could engage. Caught when Dean reported a 3-second exercise tab load post-PM-6. SWR fixes the cold path: cached HTML returns instantly, background fetch refreshes the cache for next navigation. Cache key `vyve-cache-v2026-05-08-auth-defer-5` → `vyve-cache-v2026-05-08-swr-html-6`. New §23 hard rule for SW HTML caching strategy + theme.js non-defer requirement.

- 📋 **NEW (medium priority) — Script-tag deferring sweep: 29 pages with non-deferred consumer scripts.** Diagnostic walk during PM-7 surfaced an inconsistency: `nav.js`, `offline-manager.js`, `vyve-offline.js`, `tracking.js` are non-deferred on 29 pages where most other pages defer them. theme.js is correctly excluded (FOUC prevention, see §23). Pages affected (by script):
    - **theme.js (must stay non-deferred — exclude from sweep):** all 29 pages
    - **nav.js:** certificate, checkin-live, checkin-rp, education-live, education-rp, exercise, how-to-pdfs, how-to-videos, mindfulness-live, mindfulness-rp, monthly-checkin, nutrition-setup (with non-rooted src `nav.js`), podcast-live, podcast-rp, therapy-live, therapy-rp, workouts-live, workouts-rp, yoga-live, yoga-rp
    - **offline-manager.js:** certificate, exercise, monthly-checkin
    - **vyve-offline.js:** checkin-live, education-live, events-live, index, log-food, mindfulness-live, podcast-live, running-plan, therapy-live, wellbeing-checkin, workouts-live, yoga-live
    - **tracking.js:** all -live and -rp pages (16 of them)
    - **healthbridge.js:** consent-gate
    Estimated 1-2h. Mechanical defer-attribute additions, single atomic commit covering 29 pages. node --check on each file's inline scripts. Same pattern as PM-6's auth.js sweep but with consumer scripts. May not yield a visible perf win on its own (HTML SWR is the main driver) but cleans up an inconsistency that confuses future audits and shaves head-blocking overhead from cold-cache first-paint.

- 📋 **NEW (low priority) — Cache-key bump enforcement under SWR.** Now that we're SWR for HTML, a missed cache-bump on a portal code change could leave members on stale HTML indefinitely (SWR doesn't force-refresh on schedule). Pre-commit check or CI gate that requires a sw.js cache key bump in any commit that touches portal HTML/JS files. Not urgent — the convention is well-established and PM-3 through PM-7 all bumped correctly. Worth automating before the team grows.

## Added 08 May 2026 PM-6 (Session 5 shipped · cache-paint perf project closed)

- ✅ **CLOSED — Session 5: auth.js promise refactor.** vyve-site `b089eba3`. Pre-flight audit walked back the PM-5 reframe entirely. Of 23 in-scope HTML pages, every consumer was already defer-safe (two-path if/else, vyveAuthReady listeners, function-body refs). Of 18 consumer JS modules, only `workouts-config.js` had a top-level ref and its comment anticipated this exact change. Zero per-page migration was needed. Single atomic commit: auth.js (+970 chars Promise + signal helper, full back-compat with existing event), sw.js cache bump to `vyve-cache-v2026-05-08-auth-defer-5`, 35 HTML pages get `defer` on auth.js script tag (4 already had it). New §23 hard rule for defer-safety walker pattern. Win estimated ~150-300ms first paint via unblocked head preload chain.

- ✅ **PERF PROJECT CLOSED.** Five sessions in five days:
    - 08 May PM-3 (`29ada8f8`): cache paint before auth on 4 pages.
    - 08 May PM-4a (`b4adf8ef`): same migration on 5 more pages.
    - 08 May PM-4b (`2d658e0e`): workouts gap-fills (loadExerciseNotes/Library/PausedPlans).
    - 08 May PM-5 (`f42f059d`): index.html prefetches engagement/certs/members/programme caches.
    - 08 May PM-6 (`b089eba3`): auth.js defer + VYVE_AUTH_READY Promise.

  Net effect: warm-cache portal pages now paint in <50ms via synchronous IIFE → localStorage → DOM, fully ahead of any auth/SDK round-trip. First-tap-of-session cold cache is mitigated by index.html fan-out + prefetch. Cold first-page-of-session paint is improved by ~150-300ms via auth.js defer unblocking the head preload chain.

- 📋 **NEW (low priority) — `paintCacheFirst` helper still drafted, not shipped.** ~110 lines locally at /tmp/_new_helpers.txt covering generic `pageCacheGet/Set/Invalidate` + wrapper. Every page audited had bespoke cache infra worth preserving or used existing `VYVEData.fetchCached`/`cacheGet`/`cacheSet`. Drop the draft unless a future page genuinely needs the pattern.

- 📋 **NEW (cosmetic) — `index.html` loads `vyve-offline.js` non-deferred** while every other page defers it. Inconsistency caught during PM-6 audit. Aligning to `defer` is one-character change but every other script in index.html runs after auth.js so the position relative to auth.js matters. Not blocking; clean up next time index.html is touched.

## Added 08 May 2026 PM-5 (Index prefetch shipped · Session 5 reframed)

- ✅ **CLOSED — Session 4: prefetch top nav targets from index.html.** vyve-site `f42f059d`. Two-layer approach: (a) free fan-out — index's member-dashboard response now writes into `vyve_engagement_cache` and `vyve_certs_cache` too (shape-compatible, zero extra network); (b) explicit background prefetches via `_vyvePrefetchNextTabs(email, jwt)` — fires `requestIdleCallback`-wrapped, network-gated fetches into `vyve_members_cache_<email>` (nutrition) and `vyve_programme_cache_<email>` (workouts). sw.js bumped to v2026-05-08-prefetch-4.

- 📋 **REFRAMED — Session 5: auth.js promise refactor (P1, ~half-day, full portal touch).** Originally scoped as 1-2h. On closer reading of auth.js + the consuming pages: every inline body script across all 14 portal pages references `window.vyveSupabase`, `window.vyveCurrentUser`, or `getJWT()` synchronously. Add `defer` to auth.js and those refs are `undefined` because they execute before auth.js parses → all 14 pages break. To make auth.js deferrable safely, every page (including the workouts JS modules and the cache-paint IIFEs from PM-3/PM-4) needs to migrate to `await window.VYVE_AUTH_READY` (or equivalent). Plus thorough verification that fast-path → SDK init → vyveAuthReady → consent gate ordering is preserved. Win is still the same (~150-300ms first-paint), but it's a focused half-day with smoke tests on every page, not a 1-2h job. Open this in its own chat with a pre-flight load of the brain.

### Cumulative perf project state — what's shipped this week

- 08 May PM-3 (`29ada8f8`): cache paint before auth on settings/exercise/movement/certificates + certificates cache-write bug fix.
- 08 May PM-4a (`b4adf8ef`): same migration on nutrition/log-food/leaderboard/engagement/running-plan.
- 08 May PM-4b (`2d658e0e`): workouts gap-fills (loadExerciseNotes/Library/PausedPlans).
- 08 May PM-5 (`f42f059d`): index.html prefetches top nav targets.

Sessions 1-4 of the perf project = closed. Session 5 (auth.js promise refactor) = reframed and re-queued as half-day work.

## Added 08 May 2026 PM-4 (Cache-paint-before-auth migration · 5 more pages + workouts gap-fills shipped)

- ✅ **CLOSED — Session 2: cache paint runs before auth on 5 more pages.** vyve-site `b4adf8ef`. nutrition.html, log-food.html, leaderboard.html, engagement.html, running-plan.html. Three pages skipped as low-value (sessions/monthly-checkin/wellbeing-checkin — see §changelog PM-4 for rationale).

- ✅ **CLOSED — Session 3: workouts gap-fills.** vyve-site `2d658e0e`. loadExerciseNotes (workouts-notes-prs.js), loadLibrary + loadPausedPlans (workouts-library.js) all wrapped with VYVEData cache-first helpers. Workouts page now has cache-first paint on all 7 boot loaders.

- 📋 **Session 4: prefetch top nav targets from index.html.** Fire background fetches for the top 3 nav buttons after first paint completes. Plus `touchstart` prefetch on nav buttons. Wifi-only gate via `navigator.connection.effectiveType`. Closes the first-tap-of-the-session gap that cache-first can't fix on its own. Estimated 2–3h.

- 📋 **Session 5: auth.js promise refactor (top of backlog as P1).** `auth.js` is non-deferred across 14 portal pages because its globals must exist before inline body scripts execute. Refactor into a `window.VYVE_AUTH_READY` Promise that resolves once SDK + client + getSession() have settled. Then auth.js can go back to `defer`, regaining the ~150–300ms preconnect/preload perf hint win. Independent of cache work. Estimated 1–2h once design is locked.

- 🗑️ **DROPPED — Ship `paintCacheFirst` helper to vyve-offline.js.** Drafted PM-3 but never needed. Every page audited had either bespoke cache infra worth preserving or could use existing VYVEData.fetchCached/cacheGet/cacheSet helpers. Drafted code lives in /mnt/files/_new_helpers.txt locally if any future page genuinely needs the pattern. Don't ship dead infra.

## Added 08 May 2026 PM-3 (Cache-paint-before-auth shipped on 4 pages · perf project ongoing)

- ✅ **CLOSED — Cache paint runs synchronously before auth on settings/exercise/movement/certificates.** Plus `data.error → !data.error` cache-write bug fix on certificates.html. vyve-site `29ada8f8`. SW key `v2026-05-08-cache-paint-early`.

- 📋 **NEW — Session 2: migrate the remaining 8 pages to the cache-paint-before-auth pattern.** Pages: `nutrition.html`, `log-food.html`, `leaderboard.html`, `sessions.html`, `engagement.html`, `monthly-checkin.html`, `wellbeing-checkin.html`, `running-plan.html`. For each: audit current cache state (does the page have one? where is the paint gated?). For pages with no cache at all, ship with the drafted `paintCacheFirst` helper from `vyve-offline.js` (currently NOT shipped — kept locally). For pages with bespoke caches gated on auth, migrate to the synchronous IIFE pattern from §23 hard rule. Estimated ~30 min per page, ~4–5h total session.

- 📋 **NEW — Session 3: workouts targeted gap-fills.** `loadExerciseNotes` (in `workouts-notes-prs.js`), `loadLibrary` and `loadPausedPlans` (in `workouts-library.js`) are uncached. Library tab tap = cold fetch every time. Wrap with cache-first using either the existing bespoke pattern or `paintCacheFirst`. Estimated 1–2h.

- 📋 **NEW — Session 4: prefetch top nav targets.** From `index.html`, fire background fetches for the most likely next-tab destinations after first paint (top 3 nav buttons). Plus `touchstart` prefetch on nav buttons. Wifi-only gate via `navigator.connection.effectiveType`. Closes the "first-tap of the session" gap that even cache-first leaves open. Estimated 2–3h.

- 📋 **NEW — Ship `paintCacheFirst` helper to `vyve-offline.js` once Session 2 has a real consumer.** Drafted 08 May PM-3 (~110 lines: `pageCacheGet/Set/Invalidate` + wrapper). NOT shipped this commit because all 4 target pages already had bespoke working caches. Will land in the same atomic commit as the first uncached-page migration in Session 2 (so it's not dead infra).

## Added 08 May 2026 PM-2 (Exercise name canonicalisation shipped · library expansion deferred)

- ✅ **CLOSED — Cross-day exercise history fixed for Stu Watts.** 28 April-10 orphan rows on `exercise_logs` rewritten to canonical via the new normaliser. His next Push B will cross-link to his April Push A data. Permanent normaliser system live on `exercise_logs`, `exercise_notes`, `exercise_swaps` (×2 cols), `custom_workouts.exercises`, `shared_workouts.session_data`, `shared_workouts.full_programme_json`, `workout_plan_cache.programme_json`, `workout_plans.exercise_name`.

- 📋 **NEW — Exercise library expansion** (deferred, content decision needed). 22 distinct names surfaced in `exercise_name_misses` after JSONB backfills:
  - **Alan Bird (18 names, 41 rows)** — AI-generated bodyweight exercises for his beginner programme that aren't in `workout_plans`. Examples: Wall Sit, Box Squats, Wall Push-ups, Standing Marching, Modified Plank (Knees Down), Standing Knee Raises, Bodyweight Squats variants, Mountain Climbers (Slow), Standing Side Steps, Single Leg Stands, Standing Calf Raises, Seated Leg Extensions, Gentle Stretching Flow, Incline Push-ups, Standard Push-ups (Modified as needed), Bodyweight Squats (Partial Range), Assisted Bodyweight Squats, Full Plank.
  - **Callum Budzinski (4 names, 19 rows)** — library-variant choices: Hammer Curl – Dumbbell (genuinely different from Bicep Curl), Seated Row – Cable (vs library's V-Grip Cable variant — different muscle bias), Lat Pulldown – Close Grip (vs library's Cable), T-Bar Row – Machine (no library entry).
  - Right action: review with Calum/Lewis, decide which to add to `workout_plans` library (so the AI generator has them in scope) and which to add as aliases to `exercise_canonical_names` (e.g. "Lat Pulldown – Close Grip" → "Lat Pulldown – Cable" if no close-grip variant is desired). NOT urgent — the trigger system protects all writes, these names just don't have library video/thumbnail/muscle_group metadata.

- 📋 **NEW — `exercise_name_misses` review cadence.** Should appear on the daily report so future drift surfaces don't sit hidden. Right now the table is service-role-only RLS with no surfacing in any cron. Cheap to add — extend `daily-report` v8 to include `SELECT COUNT(*) FROM exercise_name_misses WHERE resolved=false AND observed_at > now() - interval '24 hours'` plus a per-name top-10 list when count > 0. ~30 min.

- 📋 **NEW — `loadAllExercises` cache key** in `workouts-programme.js` is `vyve_exercise_library_v2` with 24h TTL — when we eventually expand `workout_plans` (Alan's bodyweight names etc.), members on stale caches won't see the new exercises until 24h later. Either bump cache key on library writes via SW push, or accept the 24h drift. Document.

## Added 08 May 2026 PM-1 (Brain hygiene + cleanup pass · all PM-5 cleanup tickets closed)

- ✅ **CLOSED — Scratch EFs deleted.** `vyve-ef-source-backup` v3 + `vyve-mgmt-api-probe` v2 deleted via Supabase dashboard. EF count 95 → 93.
- ✅ **CLOSED — Cron drift fixed.** Duplicate jobid 19 (`process-scheduled-pushes-every-5min`) unscheduled. §7 cron table refreshed to 19 active jobs (was carrying 17). All 19 jobids accounted for, GDPR commit 4 daily cron documented.
- ✅ **CLOSED — GDPR commit 4 §19 entry written.** PM-3 paragraph updated with retroactive same-evening shipped postscript.
- ✅ **CLOSED — §21 capacitor git-init backlog bullet removed** (resolved 07 May PM-4).
- 📋 **NEW — §22 entry: GDPR cron static-PSK exposure.** Logged as backlog rotation. Two fix paths documented (move PSK to `current_setting('app.gdpr_cron_psk')` or drop bearer entirely). Not blocking Sage diligence unless explicitly raised on security review.

## Added 07 May 2026 PM-5 (Backup & DR session 1 continuation — Item 3 shipped, drift caught) — superseded by 08 May PM-1 cleanup pass above

- ~~Cleanup: delete two scratch EFs~~ — done 08 May PM-1.
- ~~Brain drift items caught PM-5~~ — all addressed 08 May PM-1.
- **Item 4-6 still parked** (DR session 2): storage rclone backup (B2 recommended, scope updated 08 May to 5 buckets / 267 objects — `gdpr-exports` bucket is new since PM-4), credentials vault checklist (1Password recommended, 25+ secrets to log), DR playbook sections 2-5 (Capacitor SSD, Supabase deletion, APNs rotation, storage bucket loss). Section 1 (EF rollback) shipped 07 May PM-5.

## Added 07 May 2026 PM-4 (Backup & DR session 1)

- **Item 3 — EF source backup — SHIPPED 07 May 2026 PM-5 via GitHub Actions** (NOT the Supabase EF originally spec'd — three architecture walls forced the pivot, see PM-5 changelog entry for full diagnosis). Workflow `VYVEHealth/VYVEBrain/.github/workflows/backup-edge-functions.yml`, schedule `0 2 * * 0` Sundays 02:00 UTC + manual `workflow_dispatch`. Script `scripts/backup-edge-functions.sh`. Uses `supabase functions download` CLI which handles ESZIP decoding internally. KEEP list (62 EFs) embedded in the script as a bash array — update there when cohort drifts. Failure detection via GitHub Actions native failure email (no `vyve_job_runs`/email-watchdog dependency). Manifest at `staging/edge-functions/MANIFEST.json` with per-EF metadata + per-file sha256.
- **Item 3b — EF rollback runbook — SHIPPED 07 May 2026 PM-5** as section 1 of `playbooks/disaster-recovery.md`. Other DR scenarios (Capacitor SSD loss, Supabase project deletion, APNs key rotation, storage bucket loss) are stubbed in the same doc, deferred to backup session 2.

- **Item 3b — Once `vyve-ef-source-backup` is live, add EF rollback runbook to `playbooks/disaster-recovery.md`.** Procedure: identify the version to roll back to from staging changelog; `Supabase:get_edge_function` against the project for current state to capture as a "before" snapshot; deploy the staged version via `Supabase:deploy_edge_function` with the `files: [{name, content}, ...]` array reconstituted from the staging dir; verify with a real invocation. Don't write the runbook before staging is populated — the path-shapes-and-quirks captured in the staging structure are what makes the runbook accurate.

- **Item 4 — Storage rclone weekly backup — DEFERRED to backup session 2.** 266 objects across 4 Supabase Storage buckets (certificates, exercise-videos, exercise-thumbnails, cc-documents). Exercise-videos is the irreplaceable one (custom workout footage shot for the library). Recommendation: Backblaze B2 (10GB free, $0.006/GB beyond, S3-compatible auth, no SSD-failure single-point-of-failure that local would have). Implementation pattern: weekly cron-driven EF (`vyve-storage-backup-weekly`, Sundays 03:00 UTC after EF backup completes) enumerates objects via Supabase service-role keys, generates signed URLs, pipes into rclone (or direct B2 SDK call) for sync. Dean to set up B2 account + bucket + app key as the prerequisite.

- **Item 5 — Secrets vault checklist + DNS / registrar documentation — DEFERRED to backup session 2.** Checklist file at `VYVEBrain/playbooks/credentials-vault-checklist.md` with all 25 Supabase secrets, current last-rotated timestamps, where to find each for vault entry, rotation note. Recommendation: 1Password (better audit log than Bitwarden, sharable vault for future team members). DNS / registrar (GoDaddy): registrar name, 2FA status, recovery email, expiry date, auto-renew status — all to be filled in by Dean from his GoDaddy account. Estimated 30-45 min mine + 30 min Dean.

- **Item 6 — `playbooks/disaster-recovery.md` synthesis playbook — DEFERRED to backup session 2.** Five scenarios: (a) Capacitor SSD loss → clone `VYVEHealth/vyve-capacitor`, npm install, no pod install needed (SPM), re-link signing certs from Apple Developer; (b) Supabase project deletion → support ticket for snapshot, replay post-snapshot migrations from `VYVEBrain/migrations/` after confirming the snapshot date; (c) EF deploy corruption (per existing §23 rule about `SUPABASE_UPDATE_A_FUNCTION` corrupting bundles) → read prior version from `VYVEBrain/staging/edge-functions/{slug}/`, redeploy via `Supabase:deploy_edge_function` with the multi-file `files[]` array; (d) APNs key rotation runbook → step-by-step including the 2-keys-per-team cap workaround (revoke first to make room); (e) Storage bucket loss → rclone pull from B2 backup. Single document, reachable from any of these scenarios.

- **GitHub PAT calendar rotation entries** — two new rotation deadlines to add to whatever calendar / reminder system Dean uses for rotations. (1) `vyve-capacitor` PAT expires 7 May 2027. (2) `SUPABASE_MGMT_PAT` expires 6 Jun 2026 (a month — short by design as a credential created during a session that needed rotation discipline applied).

- **Brain §24 staleness audit (one-off, ~15 min, low priority).** §24 carried "vyve-capacitor NOT a git repo" for at least 2 weeks after the 18 April Android-only stub was created. The pattern of "brain captures a state, state changes, brain doesn't update" applies elsewhere too — sample audit of a half-dozen §24 entries against live truth (Supabase project status, Stripe payment link, HubSpot Sage deal stage, Make scenario 4950386 status, social publisher last-success-at) would catch other drift. Not blocking; bundle with a future low-traffic session.

## Added 07 May 2026 PM (security commit 1B done)

- **Security commit 1B — DONE 07 May 2026 PM.** CORS default-origin fallback rolled to `wellbeing-checkin` v28 + `log-activity` v28. `ai_interactions` audit logging added to `wellbeing-checkin` v28 (`weekly_checkin`), `anthropic-proxy` v16 (`running_plan`), `re-engagement-scheduler` v10 (`re_engagement`). 100KB payload caps inline (no `_shared/security.ts` produced — single helper per EF was simpler than introducing a shared module across EFs that don't all currently use `_shared/`). Constraint expanded with `re_engagement`. See changelog 07 May PM entry.

- **Roll 100KB payload cap to remaining EFs handling JSON POSTs.** `monthly-checkin`, `onboarding`, `register-push-token`, `share-workout`, `edit-habit`, all admin EFs (`admin-member-edit`, `admin-member-habits`, `admin-member-programme`, `admin-member-weekly-goals`, `admin-programme-library`). Same pattern as `log-activity` v28 / `wellbeing-checkin` v28: `MAX_BODY_BYTES=102400` const + `payloadTooLarge(req)` helper + 413 short-circuit before the auth path. Defensive; no live exposure since none of these accept anything close to 100KB legitimately. Bundle into next round of EF touches rather than a dedicated security commit.

- **Roll CORS default-origin fallback to remaining public-facing EFs.** Same pattern as `member-dashboard` v59 / `log-activity` v28 / `wellbeing-checkin` v28: drop the `*` empty/null Origin branch, fall through to `https://online.vyvehealth.co.uk`. Roll across: `monthly-checkin`, `onboarding`, `notifications`, `register-push-token`, `schedule-push`, `share-workout`, `edit-habit`, `workout-library`, `member-achievements`, `achievements-mark-seen`, `leaderboard`, every admin EF. Bundle into next round of EF touches.

- **Re-engagement scheduler CORS posture review.** Currently still wildcard `*`. Cron-only invocation so not a real exposure surface, but it does mean a misconfigured Make webhook or local script could reach it. Either keep `*` and document the cron-only fact in §16, or roll the default-origin pattern uniformly. Lewis call if procurement raises during Sage diligence.

## Added 07 May 2026 (security commit 1 spillover)

- **Security commit 2 — DONE 07 May 2026 PM-2.** CSP meta tag in 45 portal HTML files (vyve-site `cdd04999` v1, then `d336db0b` v2 fix-1 in same session after incognito test surfaced PostHog dynamic-load, `wss://` realtime, `frame-ancestors`-via-meta gaps). Render-time XSS sanitiser via `escapeHTML` + `safeURL` helpers shipped on `shared-workout.html` (cross-member XSS surfaces in `${ex.exercise_name}` and `${ex.thumbnail_url}` from custom_workouts.exercises jsonb), `index.html` and `wellbeing-checkin.html` (self-XSS via `${firstName}`). SW cache `vyve-cache-v2026-05-07b-csp-fix1`. Hygiene rolled in: 5 cosmetic `{public}` INSERT policies re-roled to `{authenticated}` via migration. Three new §23 hard rules added. See changelog 07 May PM-2 entry.

- **CSP `'unsafe-inline'` removal — externalise inline script blocks and event handlers.** Current pragmatic CSP carries `'unsafe-inline'` on script-src and style-src because the portal has 83 inline `<script>` blocks across 44 files (engagement.html alone 48KB across 4 blocks; index.html 36KB across 7 blocks; running-plan.html 42KB across 3 blocks) plus 24 files with inline event handlers (`onclick=`, `oninput=`, `onchange=`) and 27/45 files with inline `style=""` attributes. Externalising all of that to `.js`/`.css` files lets us drop both `'unsafe-inline'` markers and tighten the CSP to a real strict policy. Real surgery — pick one big file at a time (engagement.html, index.html, running-plan.html, wellbeing-checkin.html in that order of inline JS volume), externalise its scripts, replace its inline handlers with `addEventListener`, test in incognito, ship. Each file is its own SW-cache-bumping ship.

- **`frame-ancestors` as HTTP response header.** CSP `frame-ancestors 'none'` only works as a real response header, not in `<meta>`. Removed from the meta tag in commit 2 fix-1 to silence browser warnings, but losing actual clickjacking protection. Set it as a Cloudflare worker rule (vyvehealth.co.uk is on Cloudflare; portal is online.vyvehealth.co.uk → GitHub Pages CNAME) or a `_headers` file at `vyve-site` root if GitHub Pages supports it (it doesn't natively — Cloudflare worker is the path). Procurement-grade hardening, not blocking for any current contract. Group with X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy as a single header-set commit.

- **Externalise Supabase JS SDK to local `/supabase.min.js` for `login.html` and `set-password.html`.** Currently those two pages load the SDK from `https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js`. Every other portal page loads from a local `/supabase.min.js` (preload tag observed on nutrition.html etc). Migrating those two pages to the local copy would let us drop `https://cdn.jsdelivr.net` from `script-src` entirely. ~20 min change, two files plus SW cache bump. Cosmetic security hygiene; not procurement-blocking.

- **Security commit 3 — `gdpr-export` EFs. **SHIPPED 07 May 2026 PM-3** (vyve-site `952c4275`, Supabase migrations + 2 EFs + cron registration). Async-with-email GDPR Article 15 export pipeline live end-to-end. Schema: `gdpr_export_requests` table + `gdpr_export_pick_due()` function + `gdpr-exports` Storage bucket. EFs: `gdpr-export-request` v1 (member-facing, queues, 1/30d rate limit, 409 on pending) + `gdpr-export-execute` v1 (cron-driven, walks 45 tables, sanitised auth.users, 7d signed URL, Brevo email, audit log, 3-attempt retry). Cron `vyve-gdpr-export-tick` jobid 21 schedule `*/15 * * * *`. Settings UI: new "Privacy & Data" section, modal flow, "Delete my account" placeholder. SW cache `vyve-cache-v2026-05-07c-gdpr-export`. End-to-end test passed (4MB JSON, 45 tables, 27s latency, real Brevo email, audit row written). **Outstanding:** Lewis copy approval on Brevo email template (single EF redeploy when iterated); HTML companion export file deferred (raw JSON is GDPR-compliant and matches Strava/Notion).** Original spec: Procurement blocker. Mockup-first per Dean's rule. Single signed-URL JSON download via Supabase Storage `gdpr-exports/{email}/{timestamp}.json`, 7-day expiry. Walks ~28 tables: 16 member-scoped sources (`members`, `daily_habits`, `workouts`, `cardio`, `session_views`, `replay_views`, `wellbeing_checkins`, `weekly_scores`, `weekly_goals`, `monthly_checkins`, `nutrition_logs`, `nutrition_my_foods`, `weight_logs`, `exercise_logs`, `exercise_notes`, `custom_workouts`) + derived (`member_home_state`, `member_stats`, `certificates`, `member_achievements`, `member_health_connections`, `member_health_daily`, `member_health_samples`, `running_plan_cache` member-relevant rows, `member_running_plans`, `persona_switches`, `engagement_emails`, `notifications`, `member_notifications`). `verify_jwt:true`. Member can only export own data; admin endpoint same EF behind admin-role guard for procurement "export this member's data" use case. Receipt to `admin_audit_log` action `gdpr_export`. Audit estimated 6h, realistic.

- **Security commit 4 — `gdpr-erase-request` + `gdpr-erase-execute` EFs. MOCKUP SIGNED OFF 07 May 2026 PM-3 (mockup at `brain/gdpr_erasure_flow.md`, latest VYVEBrain commit; v2.1 with typed-email destructive-action confirmation gate matching GitHub repo deletion / Stripe / AWS S3 patterns). All 6 confirmed decisions in the mockup's 'Confirmed decisions' block. Build ready, ~6h estimate, two EFs (gdpr-erase-request + gdpr-erase-execute) + new gdpr_erasure_requests table + 3 Brevo templates (Lewis copy approval pending) + settings.html UI + standalone gdpr-erasure-cancel.html + SW cache bump. Includes Brevo + PostHog third-party purge in execute path.** Original spec: Procurement blocker. Mockup-first. Two-phase to allow accidental-request recovery and match industry practice. `gdpr-erase-request` writes a row to a new `gdpr_erasure_requests` table with 30-day grace + receipt. `gdpr-erase-execute` cron-triggered after grace expiry: deletes from same ~28 tables in dependency order (kill `tg_refresh_member_home_state` triggers on `member_home_state` first, then walk children, then parent `members` and `auth.users`). Receipt to `admin_audit_log` at both phases. Audit estimated 4h, probably 5 with the request/execute split.

- **Re-role 5 cosmetic `public`-role policies to `authenticated`. DONE 07 May 2026 PM-2 (security commit 2 hygiene roll-in).** Migration `security_commit_2_reroll_5_cosmetic_public_policies_to_authenticated` re-roled all 5: `monthly_checkins_member_insert`, `scheduled_pushes_self_insert`, `members can insert chat`, `Members can insert own shares`, `members_insert_own_custom_habits`. Verified post-migration via `pg_policies` direct query (per §23 hard rule). Originally found while verifying audit findings: `monthly_checkins_member_insert`, `scheduled_pushes_self_insert`, `members can insert chat`, `Members can insert own shares`, `members_insert_own_custom_habits`. All have proper `WITH CHECK (auth.email() = member_email)` (or `created_by`/`shared_by` equivalent) so `auth.email()` returning null on anon requests already blocks them. Re-roling is cosmetic for procurement reviewers who flag the `public` label; documented in `security_questionnaire.md`. Bundle with commit 1B.

## Added 06 May 2026 PM-2

- **Home dashboard performance Layer A-tail — NEW.** The `*_this_week` columns (`workouts_this_week`, `cardio_this_week`, `sessions_this_week`, `checkins_this_week`) on `member_home_state` are populated and live but `member-dashboard` is still issuing 4 source-table queries against `workouts`/`cardio`/`session_views`/`wellbeing_checkins` filtered by `activity_date >= currentWeekStart`. Future EF rev should swap these 4 queries for `Number(state.workouts_this_week)` etc. — drops 4 queries from the hot-path `Promise.all`. Same-write-fresh via the trigger writer, so no UX regression. ~30-min change in a future session, plus full verification cohort. **Habits is excluded from this swap** because the v58 fix changed habits goal semantic to distinct-day count, but `habits_this_week` is currently row count — see next item.

- **`habits_distinct_days_this_week` column on `member_home_state` — NEW.** Sibling column to add when picking up Layer A-tail. New plpgsql block in `refresh_member_home_state(p_email)` populates it via `SELECT COUNT(DISTINCT activity_date) FROM daily_habits WHERE member_email=p_email AND activity_date >= v_week_start AND activity_date <= v_today`. Once live, EF can drop the `habitsThisWeek` query entirely and read `state.habits_distinct_days_this_week` instead. The current `habits_this_week` row-count column stays as-is (it's still the right shape if any future surface wants raw tick count rather than goal-progress count) — non-blocking parallel.

- **Layer B — `achievements_inflight` jsonb on `member_home_state` — NEW (deferred from 06 May PM-2).** Move the inflight achievements computation (top 3 closest-to-earn metrics with progress, currently in `getMemberAchievementsPayload(...).inflight`) out of the EF hot path. Pattern: new tiny EF that wraps the existing `getMemberAchievementsPayload` inflight calc and writes via surgical `UPDATE member_home_state SET achievements_inflight = $1, achievements_inflight_updated_at = $2 WHERE member_email = $3` — won't fight the trigger refresh path because that path's `INSERT … ON CONFLICT … DO UPDATE` is explicit and only touches columns it lists. Drive from a 15-min cron (or fold into existing `vyve_recompute_member_stats`). EF reads `state.achievements_inflight` on hot path, keeps the cheap `unseen` query (single email + `seen_at IS NULL` filter). 15-min staleness acceptable — inflight is "closest 3 to earn", not transactional. Drops the in-EF `getMemberAchievementsPayload` call from `Promise.all` (the second-heaviest entry after the 5 source-table this-week queries).

- **Layer C — `activity_log` from `member_activity_daily` — NEW (deferred from 06 May PM-2).** Currently `member-dashboard` issues 5 parallel `*_recent` queries (`daily_habits`/`workouts`/`cardio`/`session_views`/`replay_views` filtered by `activity_date >= recent30Start`) purely to build the 30-day `activity_log` shape. `member_activity_daily` is already aggregated per-member-per-day, refreshed every 30 min via `vyve_rebuild_mad_incremental`. One read replaces five. 30-min staleness invisible because PM-13b breadcrumb overlay covers same-day. Net: 5 → 1 query.

- **Audit `member_home_state` cohort coverage — NEW.** 15 of 31 members have `member_home_state` rows (cross-check during 06 May PM-2 backfill). Could be a join-date cutoff, could be a backfill gap from when the table was added. Quick query against `members` left-joined to `member_home_state` to identify the gap members; if they're active, force a `refresh_member_home_state(email)` call per row. ~10 minutes.

## Added 06 May 2026 PM

- **Recurring weekly goals on home dashboard — DONE 06 May PM.** Member-facing strip on `index.html` now repopulates every Monday via the existing `seed-weekly-goals` EF + `vyve-seed-weekly-goals` cron (`1 0 * * 1`). 4-row template: 3 habits / 3 exercise sessions / 2 live sessions / 1 weekly check-in. Exercise = workouts + cardio combined. Backend was already shipped in a prior session but was undocumented in the brain — this commit closes the front-end half. vyve-site `9152599a`. SW `v2026-05-06b-weekly-goals-recurring`.

- **Coming Up This Week block removed from home — DONE 06 May PM.** Static placeholder showing hardcoded March dates, never wired up dynamically. Removed entirely from `index.html`. Orphan CSS (`.upcoming-list`, `.upcoming-card`, etc.) left in stylesheet — flagged as hygiene-pass item below.

- **Audit `schema-snapshot-refresh` cron health — NEW.** This session uncovered that `weekly_goals.exercise_target` and `weekly_goals.movement_target` columns had been added to the schema but were never surfaced in `brain/master.md` §6 and `brain/schema-snapshot.md`. Either the snapshot cron didn't run on the right Sunday, or it ran but the diff/commit step silently failed. Investigate: check `vyve_job_runs` for `schema-snapshot-refresh` invocations over the last month; spot-check whether the master snapshot file in VYVEBrain reflects the live `information_schema.columns` for at least 3 sentinel tables (members, weekly_goals, achievement_metrics); add a watchdog if the cron is silently failing. ~30 min audit.

- **Orphan `.upcoming-*` CSS in index.html — NEW (hygiene).** Block at byte ~18466 covering 9 selectors. No markup uses them post-Coming-Up-removal. Single contiguous strip-out, ~30 lines. Trivial; do on next index.html touch.

- **`members.movement_target` and `weekly_goals.movement_target` columns — NEW (decide).** Both default to 0 and aren't surfaced in any current template. Either drop in a future migration (after one-week soak to confirm no stragglers reference it), or reuse if a movement-stream-specific row is ever added back. Currently dead weight.

- **Lewis copy review on weekly goals labels — NEW (low priority).** Four labels live now: "Log 3 daily habits", "Complete 3 exercise sessions", "Watch 2 live sessions", "Complete your weekly check-in". All transparent expansions of previously-approved copy; not blocking. Heads-up at next sync.

## Added 06 May 2026

- **Workout session resume fix — DONE 06 May.** Member WhatsApp feedback exposed `workouts-config.js`'s orphan `init()` — declared but never invoked, so `restoreSessionState()` (which is fully built and correct in `workouts-session.js`) never ran. Members tabbing away mid-workout (rest period, lock screen, app switch) lost the session view on return and had to redo it from scratch. Replaced with `vyveBootWorkouts(user)` + two-path wiring (already-fired auth race + cold-login listener) + idempotent boot guard. vyve-site `46006af1`. SW `v2026-05-06a-workout-resume`. New §23 hard rule codified.

- **Audit other portal pages for orphan-init pattern.** Single grep across vyve-site repo for `^async function init` and `^function init` — confirm every match has a matching invocation site (or is replaced with the `vyveBootX` + two-path wiring pattern). Pages to check: `engagement.html`, `leaderboard.html`, `nutrition.html`, `log-food.html`, `cardio.html`, `movement.html`, `exercise.html`, `wellbeing-checkin.html`, `monthly-checkin.html`. Lower urgency than workouts since none have a comparable resume-on-reload feature, but the same wiring bug could be silently breaking other init steps (e.g. avatar bind, logout binding). 30-min audit + however many fixes.

- **Add lightweight e2e smoke test for workout resume.** No automated test caught the regression. Add a Cypress/Playwright smoke that: log in → start a workout → log one set → reload page → assert session view is open and tick is preserved. Same pattern for: complete habit + reload (assert overlay), submit weekly check-in + reload (assert success state). Lewis's call on test infra investment timing — currently zero browser-level tests.

## Added 04 May 2026 PM-15

- **Movement page distance + walks routed to cardio + PM-13b wiring — DONE 04 May PM-15.** Quick-log now captures distance for walks and writes them to cardio (matches cardio.html's `walking` type exactly). Stretch/yoga/mobility/pilates/other still go to workouts. Both `markDone` and `logMovement` now invalidate home cache and record breadcrumbs (PM-13b wiring closed). vyve-offline.js script tag added (was missing — VYVEData was undefined on this page). SW v2026-05-04l-movement-distance. vyve-site commit `91eff384`. No EF changes, no migrations.

- **PM-13b carry-over partially closed.** PM-13b's audit missed movement.html. The remaining surfaces flagged at the end of PM-13b — `workouts.html` direct POST audit, `monthly-checkin.html`, `events-live.html`, `workouts-builder.js` — are still open. None are on the critical "tick → home dot" path; revisit when next adjacent change comes up.

## Added 04 May 2026 PM-14

- **Monthly check-in EF column drift fix — DONE 04 May PM-14.** `monthly-checkin` v18 deployed. Replaced `nutrition_logs.log_date`/`calories` with `activity_date`/`calories_kcal` (PM-12 renamed them; EF never updated). Postgres 42703 was killing every POST with a 500 — zero successful monthly check-ins ever in DB until this fix. Tested live with realistic payload; test row deleted to keep Lewis's April slot open. Members can complete the feature for the first time.

- **EF hygiene backlog opened by PM-14:**
  - **Column rename → EF source grep step.** Add to migration playbook: before applying a column rename to a member-facing table, grep all Edge Function source for the old column name. If found, list the EFs that need updating and ship the EF updates as part of the same change set. Currently relying on memory.
  - **Low-frequency EF smoke tests.** Monthly check-ins, certificate generation, weekly/monthly reports — these can sit broken for weeks because they're not exercised on every page load. Build a tiny `ef-smoke` cron that hits each low-frequency EF once a day with a `dry_run=true` payload and alerts on non-2xx. Owner: Dean. Sized: ~half a session per EF, total maybe a session.
  - **Surface real EF errors to dev.** Page-level `"Something went wrong"` alerts hide server-side bugs from the dev surface. Add `console.error(res.status, await res.text())` to every EF call's failure path so DevTools shows the real error. Member-facing copy can stay generic; the dev surface needs the truth. Touches every page that calls an EF — ~10 surfaces.

## Added 04 May 2026 PM-13c

- **Profile pictures (member avatars) — NOT STARTED.** Members currently see initials only (e.g. "LV") on settings.html, index.html nav avatar, and leaderboard.html rank rows. Add upload + display flow.

  **Architecture (settled in PM-13c discussion):** Supabase Storage public bucket `member-avatars`, one image per member at path `<member_email>/avatar.jpg`, always overwrite. New `avatar_url TEXT` nullable column on `members`. Public bucket chosen over signed URLs because (a) avatars are not sensitive, (b) public URL means no signed-URL refresh churn, (c) cache layer (`vyve_home_v3_<email>`) doesn't have to deal with URL expiry. Cache-bust via `?v=<timestamp>` on the URL stored in `members.avatar_url`.

  **Client pipeline:** `<input type="file" accept="image/*">` → load to canvas → square crop (centre-crop MVP, drag-pan UI later) → resize to 256×256 → re-encode JPEG q0.85 → upload via Supabase Storage SDK or new `avatar-upload` EF (verify_jwt:true, validates <100KB, writes to bucket, updates `members.avatar_url`). End size ~20-30KB. Single source of truth — every surface reads the same image.

  **iOS/Capacitor:** web file input works in WKWebView, surfaces native iOS photo picker, no extra plugin needed for MVP. Camera capture (take new photo right now) is a Phase 2 upgrade — either `accept="image/*" capture="user"` one-liner or `@capacitor/camera` plugin.

  **Surfaces to wire (read side):**
  - settings.html — write surface; new "Profile picture" card above existing profile card; click avatar → picker → upload → success toast → invalidate home cache.
  - index.html — nav-avatar: render `<img src=avatar_url>` if set, initials block fallback if null.
  - leaderboard.html — small circular img next to rank rows (gated on privacy toggle, see open question below).
  - member-dashboard EF — add `avatar_url` to member object in response.
  - employer-dashboard EF — leave initials-only (aggregate-only philosophy holds).
  - leaderboard EF — add `avatar_url` to rank row response (gated on opt-in).
  - auth.js — pull `avatar_url` at login, stash on `window.vyveCurrentUser` so any portal page can read.
  - Cache write site (settings.html upload) calls `VYVEData.invalidateHomeCache()` after success — covered by the §23 hard rule about activity writes; treat avatar update as a "write that affects home rendering".

  **Backend changes:** migration adds `avatar_url TEXT` to `members`. Storage bucket `member-avatars` with public read RLS; write RLS scoped to `auth.email()` matching the file path's first segment. New EF `avatar-upload` (verify_jwt:true). Optional but cleaner: also extend `member-dashboard` EF to return the URL (one column added to existing SELECT — trivial).

  **Open design questions (Lewis's call, not technical):**
  1. **Leaderboard visibility default.** Today the leaderboard is anonymous-by-default ("you only see people above you, never below" + no names). Adding avatars partially undoes that. Recommendation: settings toggle "Show my photo on the leaderboard" defaulting OFF. Avatar always visible to the member themselves on home/settings. Visible on leaderboard only if opt-in. Lewis to confirm before EF response shape is built.
  2. **Default state messaging.** Initials block (current) vs coloured placeholder. Recommendation: keep initials — cheaper, more accessible, looks fine.

  **Explicitly skipped for MVP:** automated content moderation. Small known member base, zero anonymous accounts, employer-onboarded users — problems get reported, don't slip through. Phase 2 if/when needed.

  **Sized:** ~6-7 surgical edits across site files + 1 EF + 1 migration + 1 bucket. Single Claude-assisted session if uninterrupted. Do AFTER the workouts.html / monthly-checkin.html / events-live.html POST audit (PM-13b carry-over) so we don't duplicate the cache-invalidate wiring across overlapping changes.

## Added 04 May 2026 PM-13b

- **Home dashboard tick lag fix — breadcrumb wiring follow-up — DONE 04 May PM-13b.** PM-13's overlay was a no-op because it walked outbox-only and every wired write site uses direct fetch. Added `vyve_recent_activity_v1` breadcrumb store (2-min TTL) populated by every direct-fetch activity write; overlay now merges outbox + breadcrumbs (deduped by habitId for habits). Wiring: habits.html (yes-tick + autotick + undo strip), cardio.html (added invalidate AND record — was missing both), workouts-session.js completeWorkout, tracking.js onVisitStart. SW v2026-05-04k-home-optimistic. vyve-site commit `1549c84e`.

- **INCIDENT — brain markdown leaked to vyve-site Pages for ~3 minutes — RESOLVED 04 May PM-13b.** First commit attempt this session returned a commit (`e31af6e2`) that wrote brain markdown to vyve-site root instead of the 6 site files I sent. vyve-site is private as a repo but is GitHub Pages source for `online.vyvehealth.co.uk`, so all three URLs were briefly publicly fetchable (HTTP 200 confirmed during window). Closure commit `431bfc0c` removed them; Pages 404'd within 15s. New §23 hard rule added: brain content NEVER goes into vyve-site, and every commit_multiple_files call must verify the post-commit changed_paths match the upserts sent.

## Added 04 May 2026 PM-13

- **Home dashboard tick lag fix — DONE 04 May PM-13.** Two-part fix for the "tick → 1-10s blank → fills" UX bug. Cache invalidation on every activity write (habits, workouts, weight, food, check-in, session entry — but NOT heartbeats or plan counters). Optimistic outbox overlay in `renderDashboardData` reads pending writes from `vyve_outbox` and bumps pill strip + counts + activity_log so the dot fills instantly even before the EF round-trip returns. Race-safe: only bumps counts if EF response doesn't already reflect today's activity for that type. SW v2026-05-04j-home-optimistic. vyve-site commit `aa978349`.

## Added 04 May 2026 PM-12

- **log-food.html offline rework — DONE 04 May PM-12.** Closes session 2b. Row identity moved client-side via client_id partial unique index (added PM-8, in place from then). Both inserts queue via VYVEData.writeQueued with ignore-duplicates Prefer. deleteLog handles three cases (outbox cancel for in-flight inserts, queued DELETE by client_id for flushed rows, both for the race). loadDiary now paint-cache-first via vyve_food_diary cache. Legacy rows without client_id get fabricated UUID + fire-and-forget PATCH backfill. SW v2026-05-04i-logfood-clientid. vyve-site commit `6fb46b72`.

- **Offline-tolerance doctrine COMPLETE through PM-12.** No outstanding offline-tolerance items remain. Every member-facing write surface that has any business being offline-tolerant is — workouts, habits, weight log, nutrition log queue transparently with client_id idempotency. Reads paint cache. Live streams + AI generation refuse cleanly. Wellbeing check-in queues + defers AI response via notifications. Future surfaces inherit the pattern: client_id partial unique index on member-authored writes, paint-cache-first reads, VYVEData.requireOnline for genuinely-online-only flows.

## Added 04 May 2026 PM-11

- **Wellbeing check-in offline queue + deferred AI response — DONE 04 May PM-11.** Closes session 2c. EF v25 → v26 (Supabase v39 internal): X-VYVE-Deferred header support + route param on notifications. wellbeing-checkin.html: flushCheckinOutbox drains vyve_checkin_outbox queue on `online` event + 1.5s page-load retry, re-fires EF with deferred header. Notification deep-links to /wellbeing-checkin.html where renderAlreadyDone() paints recs. Natural-key dedup handles idempotency. SW v2026-05-04h-checkin-deferred. vyve-site commit `81aafc58`.

- **Offline-tolerance doctrine COMPLETE through PM-11.** Tolerant where we can: workouts/habits/weight log (PM-7, PM-8). Reads paint cache (PM-9). Honest where we can't: live sessions + running plan generation (PM-10). Bridged: check-in queues + defers (PM-11). Only remaining item is **session 2b — log-food.html client_id rework** (~1.5 sessions). The schema column was added PM-8 and is unused on this table; the work is the UI rework around row-identity for DELETEs.

## Added 04 May 2026 PM-10

- **Offline gates for AI / live pages — DONE 04 May PM-10.** `VYVEData.requireOnline()` helper added to vyve-offline.js. Wired into all 8 live session pages (7 via session-live.js, events-live.html via inline gate), running-plan.html (gate inside generatePlan only), wellbeing-checkin.html (gate inside submitCheckin only). SW `v2026-05-04g-offline-gates`. vyve-site commit `3e46a2f5`. New §23 hard rule codifies the offline-honest pattern.

- **Session 2c shrunk by ~half.** PM-10 ships the user-facing half of the wellbeing-checkin offline UX (graceful refusal at submit time). Remaining work: queue the submission for `member_notifications` fan-out when online returns, with Lewis copy approval on the wording of the deferred-response notification. ~0.5–1 session, blocked on Lewis copy review only.

## Added 04 May 2026 PM-9

- **Offline data layer session 3 — DONE 04 May PM-9.** Audit-driven scope reduction. Two surgical fixes shipped: engagement.html `loadAchievements` flipped from cache-on-failure to paint-cache-first; habits.html offline cache horizon extended (any age, not <24h). Most pages already had bespoke paint-cache-first patterns (`vyve_engagement_cache`, `vyve_lb_cache_*`, `vyve_habits_cache_v2`, home dashboard cache) that didn't need touching. SW cache `v2026-05-04f-cache-paint-first`. vyve-site commit `09b51953`.

- **Cache key hygiene pass (low priority, future).** The bespoke localStorage caches across vyve-site evolved organically: `vyve_engagement_cache`, `vyve_lb_cache_<email>_<range>_<scope>`, `vyve_habits_cache_v2`, the home dashboard cache (no explicit prefix), `vyve_ach_grid`. Each uses slightly different key shapes, freshness windows (24h vs none vs custom), and email-scoping rules. They all work — user-visible result is paint-cache-first across all of them — but a future hygiene pass could unify them under `VYVEData.cacheGet`/`cacheSet` (already exists from session 1, currently used only by workouts modules). Not blocking anything; defer until there's an actual paper-cut from the divergence (e.g., a member sees one page hydrated from cache and the next page showing a skeleton because their localStorage key shape changed mid-version).

## Added 04 May 2026 PM-8

- **Offline data layer session 2a — DONE 04 May PM-8.** `habits.html` + `nutrition.html` weight tracker wired through `VYVEData.writeQueued`. Schema: `client_id` + partial unique indexes added to `weight_logs`, `nutrition_logs`, `wellbeing_checkins` (last two pre-staged for 2b/2c). SW cache `v2026-05-04e-offline-habits-weight`. vyve-site commit `9a9e7cec`. Combined with session 1, the four highest-frequency member-authored writes are now offline-tolerant.

- **Offline data layer session 2b — log-food.html rework around `client_id` row identity.** Currently the two `nutrition_logs` POSTs at log-food.html L900/L927 use `Prefer: return=representation` because the inserted row's server `id` is needed to render the meal slot and back the subsequent `DELETE ?id=eq.<id>` when a member removes an item. Naively queueing the insert would leave the page rendering against a non-existent id. Plan: (1) change `addFoodToLog()` to generate the `client_id` upfront and pass it as the row's local identity; (2) the meal-slot DOM stores `data-client-id` instead of `data-id`; (3) `removeFoodFromLog()` does `DELETE ?client_id=eq.<>&member_email=eq.<>`; (4) the existing read at L576 already returns `client_id` since the column was added 04 May PM-8 — no new column work; (5) wrap insert + delete in `VYVEData.writeQueued`. Note that nutrition writes don't use natural-key idempotency (member can log "chicken breast 200g" three times for breakfast), so `client_id` is the *only* dedupe key — partial unique index on `(member_email, client_id)` already in place from PM-8. ~1.5 sessions.

- **Offline data layer session 2c — wellbeing-checkin.html offline UX.** The submit POST goes to `/functions/v1/wellbeing-checkin`, which returns an AI-generated recommendation that the page renders inline. Queueing the write but not the response means the member taps submit and sees nothing useful. Plan: (1) detect `!navigator.onLine` at submit time; (2) show a Lewis-approved "Your check-in is saved — your recommendations will appear when you reconnect" message instead of the AI loading spinner; (3) queue the EF call via `VYVEData.writeQueued` (the offline outbox accepts EF URLs the same as REST URLs); (4) on the `vyve-back-online` event, re-fire the EF call from the queue, parse the response, and either render it inline if the user is still on the page OR push it as an in-app notification (writing to `member_notifications` with route `/wellbeing-checkin.html` + a "your check-in recommendations are ready" body) so the next time they open the bell they see it. (5) The natural-key idempotency on `(member_email, iso_year, iso_week)` already prevents double-writes; the `client_id` column added PM-8 backs up that guarantee. Lewis copy approval needed on the offline-message wording. ~1 session.

- **Offline data layer session 3 — read-only caching for the remaining surfaces.** engagement.html, leaderboard.html, sessions.html (list view), achievements payload, plus the four parallel data fetches in habits.html (member_habits, daily_habits, week dates, dashboard payload) and the seven reads in wellbeing-checkin.html. All read-only views — no schema changes, no writes to worry about. Wrap each fetch with `VYVEData.fetchCached` and a sensible cacheKey, render via `onPaint` from cache first, swap silently on background refresh. ~2-3 sessions when batched (one session per page family). Closes the loop on Dean's wider feel-of-app-slowness complaint.

## Added 04 May 2026 PM-7

- **Offline data layer session 1 — DONE 04 May PM-7.** `vyve-offline.js` shipped with cache-then-network reads + outbox-queued writes; wired workouts.html end-to-end (loadExerciseHistory, loadCustomWorkouts, saveExerciseLog, completeWorkout INSERT, workout_plan_cache PATCH). `client_id` + partial unique indexes added to `exercise_logs`, `workouts`, `cardio`, `daily_habits`. SW cache `v2026-05-04d-offline-data`. vyve-site commit `d988c963`. Address the original gym-dropout complaint: programme + history + custom workouts paint instantly from cache offline; logged sets and completed workouts queue and drain idempotently when network returns.

- **Offline data layer session 2 — extend to habits, weight, nutrition, wellbeing.** Same module, four more pages. Habits is one wiring change on `daily_habits` (column already added 04 May PM-7); weight needs a `client_id` column + partial unique index on `weight_logs`; food log on `nutrition_logs`; wellbeing check-ins on `wellbeing_checkins`. Each page wires `VYVEData.fetchCached` for the read and `VYVEData.writeQueued` for the write(s), Prefer: resolution=ignore-duplicates header on every queued POST. ~3 hours, mechanical work. Pre-requisite: confirm there are no places where habit/weight/nutrition/wellbeing inserts go through a JWT-required EF path (then we still queue but route to the EF, not direct PostgREST). For wellbeing-checkin specifically, the EF call would queue via writeQueued the same way — only difference is the URL.

- **Offline data layer session 3 — read-only caching for the remaining surfaces.** engagement.html, leaderboard.html, sessions.html (list view), achievements payload. All read-only views of server-aggregated state — no schema changes, no writes to worry about. Wrap each member-dashboard / member-achievements / leaderboard fetch with `VYVEData.fetchCached` and a sensible cacheKey, render onPaint with the cached value first, swap on background refresh. ~2 hours. Closes the loop on Dean's wider feel-of-app-slowness complaint — every page becomes instant from cache on return visits.

- **Stand up a `vyve_offline_outbox_dead` admin surface (low priority).** When a queued write 4xx/5xxs three times, vyve-offline.js dead-letters it to `localStorage.vyve_outbox_dead` and fires a `vyve-outbox-dead` event. Currently nothing listens. For a small cohort it doesn't matter, but as we grow we want a "couldn't save your set — tap to review" toast on the page that owns the write, plus an admin-side count of dead-lettered rows aggregated across members (would require an EF that accepts diagnostic POSTs). Defer until session 3 lands or until we hit our first dead-letter in the wild.

## Added 04 May 2026 PM-3

- **Wire Android FCM in `push-send-native`.** Tokens are already landing — `register-push-token` accepts and stores Android Capacitor tokens in `push_subscriptions_native` (2 tokens, 2 members as of 04 May). What's missing is the send path: `push-send-native` v5 has an explicit branch that skips every Android sub with `reason: "android FCM not implemented (backlog #6)"`. Build: FCM HTTP v1 endpoint (`https://fcm.googleapis.com/v1/projects/{project_id}/messages:send`), service-account JWT signer using Web Crypto (mirror the APNs ES256 pattern), branch on `platform === 'android'` after the iOS path. Until this ships, Android members get the in-app `member_notifications` row + correct routing on tap, but no system banner — the bell icon parity story isn't quite honest. Pre-requisite: Firebase project + service-account JSON key → store as Supabase secret `FCM_SERVICE_ACCOUNT_JSON`. ~1 session.
- **Deprecate VAPID web push stack.** `push_subscriptions` table (10 rows, last sub created 15 April 2026, none since iOS 1.2 ship) is functionally retired — every active member is on a Capacitor binary now. Plan: (1) one-week soak with logging on `send-push` v12 web fan-out leg confirming zero successful pushes; (2) remove the web fan-out branch from `send-push`; (3) drop `vapid.js` from `vyve-site` and the registration call from wherever it's still wired; (4) `DROP TABLE push_subscriptions` after a final 30-day soak. Low risk, just code hygiene. Defer until Android FCM is shipped — don't churn the push stack twice.
- **In-app notifications routing — DONE 04 May PM-3.** vyve-site commit `2fb5a49a`. Notifications sheet on `index.html` (the bell icon) renders each row as a tappable `<button data-id data-route>`; delegated click handler marks-read for that id only and navigates via `location.href = route`. Bulk mark-read on sheet open removed — pink dot now correctly means "not yet tapped". Clear all button retained for explicit bulk. SW cache `v2026-05-04b-habits-remind` → `v2026-05-04c-notif-routing`. No EF or schema changes — `member_notifications.route` column has been populated end-to-end since 29 April PM-2; the renderer just wasn't using it.
- **Brain language overhaul — DONE 04 May PM-3.** Stripped misleading "PWA" framing from master.md where it implied the iOS or Android *member* experience is a PWA. Added two new §23 hard rules: (1) "VYVE is not a PWA — it's two Capacitor binaries"; (2) "Push delivery state — three channels, one working" (APNs live, FCM stubbed, VAPID retired). Renamed §8 header. Reframed §5, §18, §24. Locked the model: vyve-site is the web shell bundled into iOS + Android Capacitor binaries; `online.vyvehealth.co.uk` is a browser-accessible account-management fallback only.

## Added 04 May 2026 PM-2

- **Standardise EF source-header semantic versioning.** Audit (this session) found the `vN` annotations across Edge Function source files inconsistent — some have `// VYVE Health — <name> v<N>` style, some have `// <name> v<N>`, some don't have a version comment at all, and a few of the §7 brain values had drifted away from source. With §7 now stripped of the version column and source declared canonical, source headers are the truth. Sweep all ~32 active EFs once, normalise to a single pattern: `// <ef-name> v<N> — <one-line summary>` followed by a `// Changes from v<N-1>:` block when relevant. Where source has no version comment, add one matching whatever the brain previously claimed (close enough, since the alternative is recovering history nobody has). ~30 mins, one-shot, no functional changes. Output: every active EF self-identifies its semantic version in the first line of source. **PM-3 04 May 2026: `onboarding` v82 done — header/log/`onboarding_version` all v-aligned. ~31 EFs still need the sweep.**

- **Drop `members.kahunas_qa_complete` column.** Dead code post re-engagement-scheduler v8 (04 May PM-2). One-week soak (verify no marketing automation, admin script, or report reads it via Supabase logs `query_log` if available, or audit table grep across all EFs/proxies), then `ALTER TABLE members DROP COLUMN kahunas_qa_complete;`. Low risk — column is boolean, not foreign-key referenced, no triggers attached. Do this around 11 May 2026.

## Added 04 May 2026 PM-1

- **Email pipeline silent-failure recovery (DONE).** Daily/weekly/monthly reports stopped reaching `team@vyvehealth.co.uk` on 28 April due to Brevo recipient-MX cache lag. Diagnosed and resolved 04 May PM-1. Backfilled 12 reports. Watchdog now in place. See changelog.
- **Email watchdog (LIVE).** `email-watchdog` v1 EF + jobid 16 cron (`*/30 * * * *`) covers 5 failure modes with multi-recipient alerts and 6h per-code suppression. New §23 hard rule codified.
- **Investigate elevated platform_alerts rate.** 38 alerts in the 28 Apr – 4 May window: `network_error_member-dashboard` (8), `network_error_register-push-token` (8), `network_error_notifications` (8), `network_error_members` (6), `network_error_sync-health-data` (2), `skeleton_timeout_index` (12), `skeleton_timeout_nutrition` (2), `skeleton_timeout_habits` (2), `js_error` (8). All delivered to Dean+Lewis Hotmail, no missing data, but the rate is elevated and several point at known networking surfaces (push-token registration, dashboard fetch, member fetch). Worth a session: pull the `client_diagnostics` payloads, group by member + alert type, and decide whether any indicate real production issues vs flaky network. ~30 mins exploration.
- **Migrate `team@vyvehealth.co.uk` from personal Microsoft Exchange via GoDaddy to enterprise tenant.** Currently a personal mailbox provisioned via the GoDaddy reseller path with a single `vyvehealth-co-uk.mail.protection.outlook.com` MX. Should move to a proper Microsoft 365 enterprise tenant (or equivalent) post-first-enterprise-contract. Reduces blast radius if anything happens to the personal account. Brain §16 corrected — this is NOT Google Workspace despite earlier userMemories cache stating so.

## Added 29 April 2026 PM-4

- **Surface `auth_blocked` state in member UI.** v9 EF returns `auth_blocked: true` when the all-probes-unauthorized pattern is detected. Currently the v0.6 client auto-recovery silently re-prompts. Better UX would be to show a dismissible banner ("Tap to reconnect Apple Health — required after app updates") when `last_sync_status === 'auth_blocked'`. Avoids the silent permission sheet appearing without context. ~30 mins.
- **Tuck "Force full backfill" button into Settings sub-page.** Currently lives next to "Sync now" on `apple-health.html`. With v9 in place, members shouldn't need it under normal conditions. Either: (a) move to a Settings → Apple Health → Advanced sub-section, (b) remove entirely and rely on `?fullsync=1` URL trigger for support cases. Decide during the apple-health redesign. Lewis copy approval needed.
- **Apple Health page redesign (queued).** Scope: replace `apple-health.html` entirely with an Apple Health-inspired hierarchy — Today's rings → Workouts feed → Steps trend → HR trend → Sleep nightly → Active energy → Weight sparkline. Counts demoted from headline cards to small footer ("Last sync · 2 mins ago · 30 days of data"). Mockup-first workflow per session prompt rule. Lewis copy + framing approval gate. ~2 sessions.
- **Cooldown frequency at scale.** v0.4 dropped `SYNC_MIN_INTERVAL_MS` from 60min to 2min for foreground responsiveness. With 15 members not a concern. At scale (100+ active iPhone members, multiple opens/day) worth checking EF call volume + Capgo battery impact. Monitor as cohort grows; consider lifecycle-only force-sync + 30-min cooldown for visibility events if needed.
- **Investigate increasing `MAX_SAMPLE_AGE_DAYS` cap from 365.** Current 365-day cap on backfill (set in `sync-health-data` v8) means a member connecting HK 18 months after joining gets 12 months. Acceptable for now; surfaceable if/when a real member complains. Trade-off vs runaway batch sizes during first-connect; v9 doesn't change this.

# VYVE Health — Task Backlog

> Updated: 04 May 2026 PM-1 (email pipeline silent failure resolved + `email-watchdog` v1 live every 30 min — multi-recipient alerts, 6h per-code suppression. Brain §16 corrected: `team@vyvehealth.co.uk` is Microsoft Exchange via GoDaddy, not Google Workspace.)

> Previous update: 29 April 2026 PM-3 (Phase 3 Achievements UI redesigned — trophy-cabinet pattern, one trophy per metric, full ladder in modal. 300+ tiles → ~28 trophies. Backlog gained tier-threshold rework as a parked future-vision item.) Headline news: **Achievements UI redesign live on engagement.html — Recently earned + Up next + Trophy cabinet sections, EF unchanged.** `member-achievements` v2 EF (JWT-required) backs the cabinet unchanged. SW cache `v2026-04-29c-trophy-cabinet`. vyve-site commit `30ef4ddba`.

---

## MVP Requirements (Critical for Enterprise Launch)

### 🔥 **Critical Missing Pieces**
1. **Native Push Notifications — Foundation + Session 1 + Session 2 item 1 SHIPPED. SW patch complete.** APNs (iOS) infra fully live end-to-end. AppDelegate.swift bridge methods (27 April PM), `register-push-token` v1 + `push-send-native` v5 ACTIVE. **iOS 1.2 APPROVED 28 April — Ready for Distribution** (bundles HealthKit + native push permission flow + reliability fixes). Session 1 of trigger work: `send-push` v11 unified fan-out EF (web VAPID + native APNs in one call, per-member same-day dedupe via `member_notifications`). `habit-reminder` v14 + `streak-reminder` v14 refactored to delegate. Session 2 item 1 (`achievement-earned-push` v1 + `log-activity` v23 + `achievements-sweep` v2) shipped — end-to-end verified on Vicki's real `member_days` tier 2 cross. **SW `push` + `notificationclick` handlers shipped (`vyve-site@124ecb53`)** — fixed silent web push breakage that had been live since initial rollout. Two new §23 hard rules codified (SW push listener requirement, notificationclick `data.url` routing).

   **Remaining trigger build (Session 2 — 5 EFs, 1/5 shipped 28 April PM):**
   - ~~`achievement-earned-push`~~ **SHIPPED 28 April PM.** v1 deployed; `log-activity` v23 (inline) + `achievements-sweep` v2 (sweep) wired to it. End-to-end smoke verified on Dean (synthetic) + Vicki (real `member_days` t2 cross during sweep). Lewis-approved copy intact. Push fan-out latency 0ms on log-activity (parallel waitUntil).
   - `session-start-nudge` — cron 15 min before scheduled live session start. Optional opt-in (use `members.notifications_milestones` or new column).
   - `weekly-checkin-nudge` — cron Monday 09:00 London. **Cohort split discovered 28 April PM:** of 15 members opted in via `notifications_weekly_summary=true`, 12 are overdue, but **11 of those 12 have never completed a wellbeing check-in at all**. A "your weekly check-in is overdue" push reads wrong to a first-timer. Bifurcated copy needed — first-time activation framing for the 11, continuity framing for prior check-iners. Mental-health-adjacent — Phil should weigh in. **Gated on Lewis + Phil conversation before scaffolding the EF.**
   - `monthly-checkin-nudge` — cron 1st of month 09:00 London.
   - `re-engagement-push` — companion to existing Brevo stream A; cron daily, push to 7-day inactive cohort.

   **Polish (Session 3):**
   - `notification_preferences` — extend `members.notifications_milestones` + `notifications_weekly_summary` to per-trigger booleans (or a new `notification_preferences` table); settings.html UI; max-pushes-per-day cap (3? Lewis decision); Lewis copy approval doc for all 5 trigger types.
   - Foreground-suppression on iOS — Capacitor `pushNotificationReceived` listener should consume the payload as in-app toast input rather than letting APNs banner display, when app is foregrounded.
   - Service worker `notificationclick` handler — read `data.url` from VAPID payload and route. Verify or build.

   **Android (FCM) — parked** until Dean has a Pixel/Galaxy device for testing. Architecture is extension-ready; `push_subscriptions_native.platform` already accommodates.

2. ~~**Habits Editing Bug** — Cannot un-skip or change habit answers once submitted.~~ **SHIPPED pre-session-3 (live on entry 25 April 2026).** Upsert-on-conflict in `logHabit`, Undo button with DELETE in `undoHabit`, unique constraint `daily_habits_member_habit_date_unique (member_email, activity_date, habit_id)` all confirmed live. Re-tapping a habit re-writes the row; Undo clears it and restores the three-button state. RLS `cmd=ALL` covers the UPDATE path cleanly.
3. **HealthKit Integration (iOS-first) + Health Connect (deferred)** — Full plan at `plans/healthkit-health-connect.md`. v1 scope locked: reads 7 data types, writes weight only (workouts write-back not supported by Capgo 8.4.7 on iOS — codified session 4, dead path removed session 5d).
   - ~~Session 1 (DB + EF foundation) shipped 23 April~~: 3 tables, `queue_health_write_back` trigger, `sync-health-data` EF v1 ACTIVE. Shadow-read guard verified.
   - ~~Session 2 pre-device work shipped 23 April~~: `@capgo/capacitor-health@8.4.7` installed, `npx cap sync ios` wired SPM manifest, Info.plist upgraded to Apple-defensible copy, entitlement confirmed.
   - ~~Session 3 (client orchestrator + Settings UI) shipped 23 April~~: `healthbridge.js` + `member-dashboard` v50 (adds health_connections + health_feature_allowed) + settings.html rewrite. Feature-flagged via `localStorage.vyve_healthkit_dev='1'` with server allowlist staged but not yet wired.
   - ~~Session 4 (iOS device validation + UX overhaul) shipped 23 April~~ (commit [612459b](https://github.com/VYVEHealth/vyve-site/commit/612459b)): Xcode 26.4.1 + signing setup, iPhone 15 Pro Max dev-build working, four plugin debugging iterations codifying Capgo 8.4.7 iOS taxonomy (`Health` plugin name, `calories` dataType, `workouts` read-only, no `saveWorkout`). UX pivoted to Apple-native patterns: consent-gate 4th card (iOS only), connect-only Settings toggle with "open iPhone Settings to disconnect" note, 7-day re-prompt banner on index.html. Initial 30-day pull logged as "complete" but unverified.
   - ~~Session 5 (validation, bug hunt, server-authoritative flag) shipped 24 April~~: spot-check of the 30-day pull surfaced two silent bugs. `sync-health-data` v2 (workout-type normalisation fixes unpromoted workouts), SQL backfill of 7 existing samples, then vyve-site commits 5a/5b/5c/5d: readSamples method-name fix + platformId in native_uuid, persistent `has_connected` flag fixing banner regression, server-authoritative hydration via member-dashboard v50 on every page load (flag is off localStorage now — real gate is `HEALTH_FEATURE_ALLOWLIST` in the EF), dead writeWorkout branch removed. SW cache: `v2026-04-24d-write-path-cleanup`.
   - ~~**Session 6 — pipeline rebuild shipped 24 April** (vyve-site `37ad068`)~~: `HKStatisticsCollectionQuery` (Capgo `queryAggregated`) adopted for steps/distance/active_energy; new `member_health_daily` long-format table receives deduped Watch-vs-iPhone aggregates; `sync-health-data` v3→v4→v5 deployed (weight native_uuid anti-echo, client diagnostics persistence, `push_daily` handler); BST bucket-anchor bug squashed (client builds daily anchors from local y/m/d, not ISO-parsed-as-UTC); sleep_state metadata verified landing end-to-end (169 sleep segments over 30 days for Dean with full `{light, rem, deep, asleep, awake, inBed}` state coverage); scale-to-app weight round-trip validated (88.55 kg Bluetooth → HealthKit → `member_health_samples` → `weight_logs` via promotion path). `apple-health.html` inspector built but parked (payload weight with 954 samples, needs paging/scoped-pull). `activity.html` personal feed built then unlinked from `exercise.html` (GPS route maps out of scope without Capgo plugin fork; concept likely reappears in a future community surface rather than per-member self-view).
   - ~~**Session 7a — workout cap now source-aware, shipped 24 April**~~: `workouts.source` + `cardio.source` columns (default `'manual'`); `cap_workouts` + `cap_cardio` triggers only cap manual rows; `session_number` check constraints dropped (were tied to the old 2/day cap); `queue_health_write_back()` nested-conditional fix (was crashing on any workouts INSERT for HK-connected members, masked by Dean being the only HK-connected member who'd not manually logged workouts since 5d shipped); `sync-health-data` v6 ACTIVE (stamps `source: 'healthkit'` on promoted workout/cardio rows). Charity totals + cert counters stay naturally capped at 2/day via `get_charity_total()` + `increment_*_counter()` read-path caps — lifting the trigger cap inflates nothing downstream.
   - ~~**Autotick session 7b — schema + Lewis-approved seeds, shipped 24 April**~~: `habit_library.health_rule jsonb` column (nullable, null = manual-only); 2 existing habits retrofitted (`10-minute walk` → daily distance ≥ 1km; `Sleep 7+ hours` → sleep-state sum ≥ 420 min last_night); 4 new Lewis-approved seeds inserted (`Walk 10,000 steps`, `Walk 8,000 steps`, `Complete a workout`, `30 minutes of cardio`, all movement pot). Paired with session 2 shipped same day. Plan updated at `plans/habits-healthkit-autotick.md`.
    - ~~**Autotick session 2 — server evaluator + `_shared/taxonomy.ts`, shipped 24 April**~~: `member-dashboard` v51 adds `habits` block to response — each active habit returns `health_auto_satisfied` (bool or null) and `health_progress` (`{value, target, unit}` or null). Evaluator routes per source: daily-table for steps/distance/active_energy, sleep-samples last-night window for `sleep_asleep_minutes`, direct workouts+cardio reads for `workout_any`/`cardio_duration_minutes`. Null-not-false semantics when no HK connection or no data in window. `sync-health-data` v7 is a pure refactor — extracts workout taxonomy into shared file, `promoteMapping` body byte-identical. SQL-validated against Dean's live data across all 6 seeded rule shapes. Session 3 (client UI + editing bug fix) is the last piece.
   - **Still open for v1 HealthKit launch:**
     - Consent-gate + re-prompt banner fresh-account flow test (needs clean signup — never done)
     - Rollout decisions: Alan first, then cohort of ~5. Rollback = `member-dashboard` v52 with reduced `HEALTH_FEATURE_ALLOWLIST`
     - Privacy.html HealthKit section + Lewis sign-off + App Store Connect questionnaire + Build 3 submit
     - Submission-scope decision: submit all 7 reads, or phase to 4 (workouts + weight + steps + active_energy) with v1.1 for HR/sleep/distance
   - **Post-launch HealthKit workstreams (all drafted 24 April):**
     - ~~`plans/habits-healthkit-autotick.md` — auto-tick habits from HK data (steps 8k/10k, sleep 7h+, workouts, cardio duration)~~ **SHIPPED 25 April 2026.** All three sessions live: schema + Lewis-approved seeds (session 1/7b), server evaluator + `_shared/taxonomy.ts` (session 2), client UI wired to `member-dashboard` v51 with pre-tick on auto-satisfied rows, `.hk-progress` hints on unsatisfied rows, `.hk-badge` scaffolded hidden pending Lewis design (session 3). Editing-bug fix turned out to already be in place (upsert + undo + unique constraint all live pre-entry). Feature fully flagged via `HEALTH_FEATURE_ALLOWLIST` — Dean only today. Rollout opens alongside the broader HK v1 launch.
     - `plans/healthkit-views.md` — Apple Health data inspector (`apple-health.html`) + personal activity feed on `exercise.html`. Transparency + engagement. ~2 sessions.
     - - `plans/healthkit-background-sync.md` — iOS HealthKit background delivery via `HKObserverQuery` + `BGAppRefreshTask`. **PARKED 25 April 2026** as future vision. Investigation done: Capgo 8.4.7 exposes zero background primitives (verified against the plugin source); architectural path is a companion Swift Capacitor plugin (~400 lines) alongside Capgo. Scope ≈4–5 build sessions + 1 week device soak + App Store review cycle. Unpark signals: Capacitor wrap on stores; member feedback naming background sync specifically; enterprise pilot requirement.
     - Nutrition/MFP reads via HK — parked. Capgo 8.4.7 exposes no dietary types. Would need plugin fork/PR. Separate plan at `plans/nutrition-healthkit.md` when sequenced. Unblocks water habit auto-tick and MFP-native nutrition totals.

### ⭐ **High-Value Additions**
4. **Enhanced Content Quality** — Update wellbeing check-in slider questions to match onboarding questionnaire. Add health disclaimer for App Store compliance.
5. **Advanced Analytics** — Enhanced employer insights with absenteeism correlation, burnout prediction, productivity metrics for enterprise ROI conversations.
6. **HealthKit Rollout — Open to All iPhone Users (~1 session) — SHIPPED 26 April 2026** — Drop the hard-coded `HEALTH_FEATURE_ALLOWLIST` in `member-dashboard` v51 (currently Dean only) and replace with `member_health_connections` row presence as the truthsource. Settings page gets an "Apple Health" toggle, rendered only on iOS Capacitor builds (Android Capacitor + PWA hide it via runtime guard). Existing consent gate flow handles the actual permission + data-sharing wording. **Android Health Connect parked** until Dean has a Pixel/Galaxy device for end-to-end testing — schema and EF logic are extension-ready, no blocker beyond device. Ships **before** the Achievements System (item 7) so the four HK-derived metrics (lifetime steps, distance, active energy, sleep nights) aren't a Dean-only feature on launch day. Effort: ~1 session.

7. **Achievements System — Cumulative-Forever, Push on Earn — PHASE 1 COMPLETE 27 April 2026** — Both Phase 1 layers shipped: data layer (AM session) + Lewis copy approval (PM, two sessions). **Live state:** 32 metrics × 327 tier rows, all `copy_status='approved'`, all 32 `display_name` values finalised. The `copy_status` gate ensures future re-seeds preserve Lewis-approved copy via `CASE WHEN copy_status='approved' THEN public.achievement_tiers.title ELSE EXCLUDED.title END`.

   **Catalog adjustments locked-in alongside copy approval:**
   - Dropped `running_plans_generated` (dead-wired, source table empty), `cardio_distance_total` (only 1/50 historical rows had distance), `session_minutes_total` (dead-wired, view-time data not meaningful yet).
   - Added `volume_lifted_total` in new `volume` category. Required `achievement_metrics_category_check` constraint expansion. Ladder: 100 kg → 50 megatons over 10 tiers. **Not yet wired in evaluator** — see Phase 2 below.
   - Fixed `streak_checkin_weeks` threshold ladder (was day values, corrected to weeks-scaled `3, 6, 10, 16, 26, 39, 52, 78, 104, 156, 208, 260, 312, 520`).

   **Final metric inventory (32):**
   - **Counts (12):** `habits_logged`, `workouts_logged`, `cardio_logged`, `sessions_watched`, `replays_watched`, `checkins_completed`, `monthly_checkins_completed`, `meals_logged`, `weights_logged`, `exercises_logged`, `custom_workouts_created`, `workouts_shared`
   - **Volume (1):** `volume_lifted_total`
   - **Time totals (2):** `workout_minutes_total`, `cardio_minutes_total`
   - **HK-derived (4, hidden_without_hk):** `lifetime_steps`, `lifetime_distance_hk`, `lifetime_active_energy`, `nights_slept_7h`
   - **Streaks (6):** `streak_overall`, `streak_habits`, `streak_workouts`, `streak_cardio`, `streak_sessions`, `streak_checkin_weeks`
   - **Variety (1, recurring):** `full_five_weeks`
   - **Collective (2):** `charity_tips` (recurring), `personal_charity_contribution`
   - **Tenure (1):** `member_days`
   - **One-shots (3):** `tour_complete`, `healthkit_connected`, `persona_switched`

   **Phase 2 — sweep extensions (next to schedule):**
   - `volume_lifted_total` evaluator wiring in `log-activity` INLINE map. **Mandatory sanity caps:** reject any `exercise_logs` row where `reps_completed > 100` or `weight_kg > 500` before counting toward the metric. Two corrupt rows on Dean's account (Back Squat, 2026-04-18, `reps_completed = 87616`) need zeroing first — would fire tier 10 immediately if left unfixed.
   - Sweep extensions for HK lifetime metrics, `full_five_weeks`, `charity_tips`, `personal_charity_contribution`, `tour_complete`, `healthkit_connected`, `persona_switched`. Currently `achievements-sweep` only handles `member_days`.
   - Clean orphan `running_plans_generated` entry from evaluator INLINE map next time we touch `log-activity`.

   **Phase 3 — UI (grid shipped 29 April PM):**
   - **DONE:** `/achievements.js` v1 client lib — toast queue, debounced evaluator, mark-seen, replay-unseen. Loaded on every portal page.
   - **DONE:** log-activity v24 `evaluate_only:true` short-circuit. Trigger pages fire `VYVEAchievements.evaluate()` post-write to activate the evaluator without restructuring the write path.
   - **DONE:** All 9 trigger pages wired (habits, cardio, wellbeing-checkin, monthly-checkin, log-food, movement, nutrition, workouts-session.js, workouts-builder.js, workouts-programme.js).
   - **DONE:** All 8 passive pages load `/achievements.js` for replay-unseen on load (index, engagement, sessions, exercise, settings, running-plan, certificates, leaderboard, workouts).
   - **DONE:** End-to-end smoke verified on Dean's account — toast rendered for `habits_logged` t7 cross.
   - **DONE:** **Notification routing infrastructure** (29 April PM-2, vyve-site `30e8398b`). `member_notifications.route` column + send-push v13 + log-activity v27 (platform v30) + achievement-earned-push v2 + `/achievements.js` + `engagement.html` parseHashRoute + SW postMessage bridge. Hard rule codified master §23. **Every notification anywhere routes to the right place.**
   - **DONE:** **Achievements grid live on `engagement.html`** (29 April PM, commit `997979b5`) — trophy-shelf UI, tier-tinted SVG shapes, modal on tile click, hash deep-link `#achievements` from toast clicks. Backed by `member-achievements` v2 EF (NEW, JWT-required, `getMemberGrid()` in `_shared/achievements.ts`). Tab strip: Progress (default) | Achievements. localStorage cache fallback for offline.
   - **DONE:** Phase 2 `volume_lifted_total` wired into INLINE evaluator with sanity caps. log-activity v25 → v26 (platform v29). 12 cohort tiers backfilled.
   - **TODO:** Index.html dashboard slot showing latest unseen / closest inflight (Phase 3 sub-task, not started).
   - **DONE:** Per-tile deep-link in toast click (`#achievements&slug=X&tier=N`) — modal opens directly on the earned tile (29 April PM-2).
   - **TODO:** Bespoke illustrated badge artwork upgrade — current SVG generator covers 4 shapes × 4 tints. Future upgrade via AI image gen (Gemini + Claude art direction with VYVE brand grade), drop-in replacement of `svgTrophy()` calls. Data layer doesn't change. Captured 29 April PM as the canonical upgrade path; not weeks of illustrator work as previously assumed.
   - **TODO:** Index.html dashboard slot showing latest unseen / closest inflight tier — Phase 3 sub-task, scoped during the morning ship and confirmed unstarted in PM-3. ~1 session of work, low risk (reads existing `getMemberAchievementsPayload()` output).
   - Native push hook on tier earn already wired (achievement-earned-push v2 with deep-link) and fires from real cohort actions.

7a. **Achievements tier-threshold rework — FUTURE VISION (parked 29 April 2026 PM-3)** — Several ladders feel sparse at the upper end (e.g. habits jumping 100 → 250 → 500 → 1000 doesn't keep next-tile reachable). Not blocking anything; trophy cabinet redesign already smooths the perceived density. **Approach when picked up:** surgical add-tiers-between-existing-thresholds (lower-blast-radius play that preserves existing earned `member_achievements` rows, preserves Lewis-approved tier copy via `copy_status='approved'` gate, only requires Lewis approval of new in-between titles — NOT a re-spacing of the whole ladder, NOT a rebackfill). Workflow: (1) audit pass on all 327 tiers identifying worst-spaced ladders, (2) draft new in-between tier copy in VYVE voice, (3) bulk-approval doc to Lewis (same pattern as original 327-row sign-off), (4) SQL migration adding rows with `CASE WHEN copy_status='approved'` protection. Estimated 2 sessions when prioritised. **Trigger to revisit:** real cohort feedback that next-tier-too-far is hurting engagement, or as part of a broader Achievements polish pass. Not before.
   - **TODO:** In-app notifications list UI (bell icon dropdown reading `member_notifications` rows for the authenticated member, marking `read=true` on tap, navigating via `route` column). Schema is ready (`route` populated). Likely lives in nav bar across all member-facing pages. Backlog item; not urgent until cohort grows past current testers.
   - **TODO:** Promote `route` to a first-class input on send-push (currently inferred from `data.url`). No behaviour change, just clarity. Defer until a real reason — current single-source-of-truth via data.url works fine.

   **Voice rules locked-in for future ladder extensions:** no emojis, titles 3-6 words, bodies 10-20 words, VYVE voice (proactive wellbeing, evidence over assumption, no fitness-influencer tone), tier 11+ on long ladders short and reverent (no next-tier nudge), recurring-metric copy evergreen, all titles globally unique. Streaks emphasise consecutive cadence; counts emphasise cumulative volume — distinct body voices.

   **Open verification items:**
   - Confirm `full_five_weeks` source-query maps to the five web pillars (mental/physical/nutrition/education/purpose) — Batch 6 copy enumerates these by name. If wired against five platform activity types instead, body needs a tweak.
   - `tour_complete` assumes the in-app tour is built (backlog item, post iOS approval). Metric currently not wired to anything.
   - `persona_switched` is intentionally one-shot (fires on first switch only, not subsequent).
   - **Copy review queue (Lewis re-approval, surfaced 29 April smoke):** (a) `cardio_logged` tier "50 cardio hit" → should read "50 cardio sessions"; (b) `exercises_logged` ladder gap 100 → 250 too steep, smooth to every-50 progression. Both flagged from real toast-render observation.

8. **In-App Tour / First-Run Walkthrough (~1–2 sessions)** — Full design spec landed 26 April. **Builds on top of the Achievements System** — every tour step earns the relevant first-tier achievement, so day one ends with banked progress on the 30-activity certificates instead of the brutal 0% cold start. **Tour activities count as real activities**, not throwaway tutorial ticks. Modal step-through (option a) confirmed for v1. Walks members through: home dashboard (score ring + streak), first habit log, first workout log, first cardio log (with HealthKit consent prompt at this step on iOS), first session watched, first weekly check-in. Each step ends with the member tapping the actual log button — earning `first_habit` / `first_workout` / `first_cardio` / `first_session` / `first_checkin` (tier 1 of each respective ladder) — and the achievement toast/push fires inline at each step. Tour completion itself earns the `tour_complete` achievement. Persistence via `members.tour_completed_at`, with "Restart tour" in Settings. Skip path required. **Dependencies:** Achievements System (item 7) shipped, Lewis copy + screenshot approval. **Ships after** achievements so the celebration moments at each step actually land. Effort: ~1–2 sessions, mostly UI.

---


9. ~~**Lewis copy approval — Achievements ~400 rows (BLOCKING UI)**~~ **DONE 27 April 2026 across two PM sessions.** All 327 tier rows approved (catalog trimmed from 349 to 327 via metric drops/adds during approval) and all 32 display names finalised. UI is now UNBLOCKED — Phase 3 ready to schedule. Voice rules captured in item 7 for future ladder extensions.

## Active Priorities (This Week)

1. **Android icon fix** — resubmitted 15 April, awaiting Google review (Play Store still pending)
2. ~~**iOS icon fix**~~ — **DONE.** Icon corrected in 1.1(3), then rolled into 1.2(1), now live in approved 1.2 binary on App Store.
3. **Exercise restructure** — Option A (Exercise Hub). Plan at `VYVEBrain/plans/exercise-restructure.md`. **Rounds 1–5 shipped 19 April; movement.html restored 20 April after mock-drift incident.**
   - ~~Round 1: `members.exercise_stream` DB column (workouts/movement/cardio, default workouts, 18 members backfilled) — 19 April~~
   - ~~Round 2: "Workouts" ⮕ "Exercise" label rename across nav.js, index, engagement, certificates, leaderboard — 19 April (`5fe6929`)~~
   - ~~Round 3: `exercise.html` hub page with hero card + 3 stream cards — 19 April (`c5216ca`)~~
   - ~~Round 4: `movement.html` with workout_plan_cache read, activity list, video modal, Mark as Done — 19 April (`b7e19ba1`), restored 20 April (`93092de`) after drift~~
   - ~~Round 5: `welcome.html` stream picker + onboarding EF v77 (stream-aware weekly goals, prog overview, recs, welcome email; workout plan gen wrapped in `if stream==='workouts'`) — 19 April (`0c6de36`)~~
   - ~~Sub-page headers & back buttons (`nav.js`, `workouts.html`, `movement.html`, `cardio.html`) — 20 April (`d4b7171`)~~
   - ~~`cardio.html` data-wired (weekly progress + quick-log + recent history) — 20 April (`93092de`)~~
   - ~~Server-side running plan storage: `member_running_plans` table + `running-plan.html` write-through + `cardio.html` Supabase-first read + localStorage backfill — 20 April (`ce3f1af`)~~
   - **Still open:** Movement plan **content** in `programme_library` (no rows with `category='movement'` yet — all Movement members see no-plan state)
   - **Still open:** `programme_library.category` column to distinguish movement vs gym plans
   - **Still open:** Backfill decision for existing 18 members (all currently default 'workouts')
   - **Still open:** Classes stream on the hub (plan says cross-cutting, not yet built)
   - **Still open:** Hub progress across all streams vs just the primary (open plan-doc question)
   - **Still open:** `mrpSetCompletion` in running-plan.html uses GET-then-PATCH (race-unsafe in multi-tab edit scenarios). Future fix: Supabase RPC wrapping `array_append`/`array_remove` atomics. Acceptable for MVP.
   - **Still open:** Brain hygiene — base64-encoded historical blob in `brain/changelog.md` (~152K decoded chars) needs dedicated cleanup session
4. **Admin Console Shell 3** — spec at `plans/admin-console-shell3-spec.md`, migrations log at `plans/admin-console-shell3-migrations.sql`. Sub-scope priority: A ⮕ B ⮕ C ⮕ E (D deferred).
   - ~~**Sub-scope A EFs complete (23 April).** All three backend endpoints shipped ACTIVE with verify_jwt:true and passing DB-layer smoke tests (10 sim audit rows across habits + programme + weekly_goals). Migration: `extend_member_habits_assigned_by_admin` applied.~~
   - ~~**Sub-scope A UI complete (23 April).** `admin-console.html` extended +23.7KB in one surgical ship (`vyve-command-centre@f3d3f4f`). Three new accordion sections (Programme controls / Habits / Weekly goals) share a generic reason modal; all CSS reused from Shell 2 styles. Latent Shell 2 bug also fixed (toggleSection had no audit-log dispatch). `node --check` + 21 structural checks green.~~
   - **Next:** browser-side JWT smoketest (Dean or Lewis loads admin console, exercises each new panel against own member record). Once closed, Sub-scope B (`admin-bulk-ops` EF + multi-select on member list). Spec for B is ready at `plans/admin-console-shell3-spec.md` §5.
   - Shell 2 E2E smoketest still pending (see `plans/admin-console-shell2-smoketest.md`; 10 sim audit rows now exist from Sub-scope A smoketests but no real pencil-click edits yet). Shell 1 + Shell 2 + Shell 3 Sub-scope A UI live at `admin.vyvehealth.co.uk/admin-console.html`.
5. **Polish and bug-fix pass** — test all flows, fix on-the-fly issues
   - ~~Light-mode readability sweep (semantic token layer + 242-edit HTML pass across 12 pages) — 21 April (`2560dd3`, `b4fbfc8`)~~
   - ~~Nav chrome locked dark on light theme (desktop nav, mobile header, bottom nav, more-menu, avatar panel) — 21 April (`5010fda`)~~
   - ~~exercise.html + movement.html header upgrade (page-header container, eyebrow + italic-accent title + subtitle) — 21 April (`5010fda`)~~
   - ~~sw.js network-first for HTML + skipWaiting + clients.claim — 21 April (`d323d11`). **Implication:** HTML changes reach users on next reload without cache bumps.~~
   - ~~wellbeing-checkin.html + monthly-checkin.html: removed bespoke nav markup, added nav.js, back button + bottom nav now work — 21 April (`f78a7ba`)~~
   - ~~nav.js injects at `document.body.prepend()` — fixes mobile-page-header disappearing on pages with `#skeleton` wrapper — 21 April (`c4b90fe`)~~
   - ~~Leaderboard refactor (Phases 1–4): `members.display_name_preference` + `member_home_state` monthly buckets + `last_activity_at`; `refresh_member_home_state` fixed dedup on `recent_*_30d` + monthly columns + monotonic `*_streak_best`; `leaderboard` EF v9⮕v10 now reads aggregation-layer only (cap-aware counts, display-name resolver, streak tiebreak by `last_activity_at`, optional `scope` param); leaderboard.html + settings.html wired with Privacy section for name preference, tie-aware gap copy, escapeHTML on member-controlled strings — 21 April (`a096c10`)~~
   - ~~Leaderboard UI upgrade (classic 1⮕N board top-100 cap, range selector This month/Last 30 days/All-time, scope tabs hidden unless `scope_available`, dismissible Anonymous banner linking to `/settings.html#privacy`, title-case name rendering for ALL-CAPS/all-lower names, zero-activity footer collapse, all-time 7-day tenure filter): `member_home_state.recent_checkins_30d` column + refresh_member_home_state rewrite; `leaderboard` EF v10⮕v11 (additive: ranked[], overflow_count, zero_count, new_members_count, scope_available, ?range=); leaderboard.html full rewrite + settings.html `id="privacy"` anchor — 21 April (`d49ef95`)~~
6. **Target: self-ready by May 2026**

---

## This Week

- **[P1] SW push handler verification on a real browser** (Mac Safari / iPhone Safari). Tonight's `vyve-site@124ecb53` patch is verified at static-analysis level only; needs a manual `send-push` smoke against Dean's web subs to confirm a banner renders. Member-side rollout happens organically as cohort members reload portal over the next 24h.
- **[P1] `vyve-capacitor` git initialisation** — flagged backlog risk, two-line fix. Becomes painful once native source edits start (Swift plugins, custom Capacitor plugins).
- **[P1] auth.js ready-promise refactor so it can be deferred safely.** Current arrangement: `auth.js` is non-deferred across 14 portal pages because its globals (`window.vyveSupabase`, `window.vyveCurrentUser`, `supa()` pattern assumptions) must exist before inline body scripts execute. This blocks the first-paint perf win we tried to ship in `14a3540`. Proper fix: have `auth.js` export a single `window.VYVE_AUTH_READY` Promise that resolves once the SDK is loaded, client is created, and `getSession()` has settled; every page that currently does `waitForAuth()` awaits that promise instead of listening for a custom event. Then `auth.js` can go back to `defer` and the preconnect/preload hints regain their value. Post-sell; not blocking the May deadline but clears the path for further perf work. See 2026-04-23 changelog entries for full context on the two bugs this prevents.
- **Tech debt: `#skeleton` + `#app` dual-main DOM pattern on exercise.html and movement.html.** These pages wrap loading UI in `<div id="skeleton"><main>...</main></div>` above `<div id="app"><main>...</main></div>`. The 21 April nav.js fix (body-prepend) means nav chrome no longer cares, but the dual-`<main>` structure is fragile for future scripts doing broad selectors. Migrate to single `#app` with internal skeleton state. Pair with Design System Phase E work when that lands.
- **HealthKit / Health Connect integration** — Capacitor plugin; habits linked to activity; weight from smart scales. Needs scoping session.
- **Calendar integration** — connect Google/Apple calendar, show VYVE sessions and workout schedule
- **Calendar page in portal** — dedicated schedule view

---

## Security Quick Wins (from 16 April audit — status after 18 April)

### Done
- ~~Add indexes on `workouts(member_email)`, `cardio(member_email)`, `certificates(member_email)`, `ai_interactions(member_email)`~~ **DONE 18 April**
- ~~Add `logged_at DESC` indexes across activity tables~~ **DONE 18 April**

### Open
- Fix XSS: escape `firstName` in `index.html` before `innerHTML` rendering
- Fix `running_plan_cache` RLS: change `public_update` policy to `member_email = auth.email()`
- Fix INSERT policies on `session_chat`, `shared_workouts`, `monthly_checkins`
- Remove 3 redundant RLS policies on `members` table
- Add explicit service-role-only policies to the 7 aggregation/admin tables (document intent)
- Add `<meta name="mobile-web-app-capable" content="yes"/>` to remaining 12 portal pages (was 13; `wellbeing-checkin.html` added 18 April)
- **Clean up one-shot migration EFs** — recount 28 April: ~32 still-ACTIVE candidates (the original 89-deletion list from the 9 April security audit was only partially actioned). Candidates: `seed-library-1`, `seed-library-2`, `seed-b1`, `create-ai-decisions-table`, `setup-ai-decisions`, `setup-member-units`, `trigger-owen-workout`, `trigger-callum-workout`, `thumbnail-audit`, `thumbnail-upload`, `thumbnail-batch-upload`, `generate-stuart-plan`, `send-stuart-reset`, `monthly-checkin-test`, `run-monthly-checkins-migration`, `run-migration-monthly-checkins`, `resend-welcome`, `delete-housekeeping`, `send-test-welcome`, `send-test-push`, `inspect-members-schema`, `create-test-member`, `create-ai-decisions-table`, `add-exercise-stream`, `force-cache-refresh`, `update-brain-changelog`, `debug-cert-content`, `debug-show-file`, `test-html-render`, `smoketest-ach-push` (28 April inert 410 stub). Keep `ban-user-anthony` if ban workflow still in use. Composio doesn't expose a delete-EF tool — needs Supabase CLI/dashboard.

---

## Brain Hygiene (from 18 April reconciliation)

### Done 24 April session
- ~~`brain/master.md` full rewrite — 55k chars, live-state-sourced from Supabase `list_tables` (70) + `list_edge_functions` (75). Previous file was base64-corrupted and schema had drifted badly (claimed 35 tables / 15 EFs / 31 members). Committed via workbench `run_composio_tool` path, post-commit-verified.~~

### Done this session
- ~~master.md §4: correct the "No triggers" / "No foreign keys" claims~~ **DONE 18 April — actual counts: 119 triggers, 25 FKs (not 14/24 as the previous note said)**
- ~~master.md §4: document the aggregation layer~~ **DONE 18 April — 7 tables + 11 functions + 4 cron jobs documented, Rule 33 added**
- ~~master.md §10: add Rule 33 — aggregation tables are EF-service-role only~~ **DONE 18 April** (+ Rule 34 DB-level caps, Rule 35 email auto-lowercasing)
- ~~Brain reconciliation: update EF inventory~~ **DONE 18 April — all 58 active EFs documented with live versions, missing ones added (admin-dashboard, cc-data, send-password-reset, warm-ping, leaderboard)**
- ~~Automate or delete `brain/schema-snapshot.md`~~ **DONE 18 April — automated via `schema-snapshot-refresh` EF v2 + `vyve_schema_snapshot` cron (Sunday 03:00 UTC). GitHub writes via new fine-grained `GITHUB_PAT_BRAIN` secret (VYVEBrain contents:write only). First auto-commit: [36384af](https://github.com/VYVEHealth/VYVEBrain/commit/36384afa58c9b8381a4d37d6e6554f571dea7229).**
- ~~Resolve `generate-workout-plan` EF ambiguity~~ **DONE 18 April — un-retired. Kept as canonical standalone plan generator. Onboarding v74 duplicates logic inline; refactor task added below.**

### Open
- **Full rewrite of `brain/master.md`** — session 6's pipeline changes (`member_health_daily` table, queryAggregated routing, BST gotcha, v5 push_daily handler) and session 7a's cap fix together constitute enough schema + EF churn that patching master incrementally would drift. Scope: audit all live EF versions (`sync-health-data` v6, `member-dashboard` v50, `certificate-checker` v9, etc.), table inventory including `member_health_daily`, trigger inventory including source-aware caps and fixed `queue_health_write_back`, updated Hard Rules (plpgsql NEW dereference trap + source discrimination for activity caps + queryAggregated-vs-samples routing + BST local-construction rule + nested-condition pattern for record field access). Own session.
- ~~**Audit portal pages for bare `<nav>` tags**~~ **DONE 21 April** — `wellbeing-checkin.html` + `monthly-checkin.html` refactored in `f78a7ba7` to remove bespoke `<nav>` markup entirely and use nav.js instead. Codified as Hard Rule 42: new sub-pages must use the standard 4 head scripts and no bespoke `<nav>`. No remaining portal pages have a bare `<nav>` tag.
- **Add `monthly-checkin` integration smoke test** — the column drift that caused the 500 would have been caught by a single POST test against the live schema. Consider a Deno test that runs against a throwaway test member before each deploy. Surfaced by 18 April fix session.
- **Delete `staging/onboarding_v67.ts`** — stale by 7 versions (live is v74). Misleads future AI sessions.
- ~~**Resolve `auth.js` version disagreement**~~ **DONE 21 April** — master.md §3 now also says v2.4 (confirmed during this session's audit). Both §3 and §12 now agree.
- **Archive pre-April changelog entries** into `changelog-archive/2026-Q1.md` — current changelog is 114KB / 1,658 lines and growing unboundedly
- **Document user-ban workflow** — `ban-user-anthony` v8 exists; anthony.clickit@gmail.com is in `auth.users` with no `public.members` row (orphan). Decide on a reusable pattern if bans will happen again.
- **Migrate `exercise.html` + `movement.html` off `#skeleton` + `#app` dual-main pattern.** Both pages have a `<div id="skeleton"><main>...</main></div>` wrapper that sits before `<div id="app"><main>...</main></div>`. This caused the 21 April nav.js bug (see Rule 40). nav.js is now hardened via `document.body.prepend` so this dual-main pattern no longer breaks the nav, but the pattern itself is fragile — any future utility that queries `document.querySelector('main')` will pick the skeleton one. Candidate refactor: single `#app` root with internal `data-state="skeleton|ready|error"` attribute, single `<main>` whose contents swap based on state. Pair with Design System Phase D (component primitives) — a shared `.page-skeleton` component would remove this pattern from other pages too.

---

## Offline Mode — SHIPPED 17 April 2026 ✅

Auth fast-path (`vyve_auth` cached session) + localStorage data caches on all EF-calling pages + `offline-manager.js` banner + write-action disabling. Full coverage: index, habits, engagement, certificates, leaderboard (full cache), workouts, nutrition, sessions, wellbeing-checkin.

## Admin Console — Shell 2 SHIPPED 22 April 2026 ✅

Hosted at `admin.vyvehealth.co.uk` (repo `vyve-command-centre`). Three HTML files coexist:
- `index.html` — Lewis's Command Centre (OKRs/CRM/content/intelligence)
- `Dashboard.html` — legacy admin dashboard (v9 EF consumer)
- `admin-console.html` — Kahunas-style console (Shell 1 read-only + Shell 2 edit)

**Shell 1** (read-only, shipped 21 April) — member list, detail, timeline, raw tables via `admin-dashboard` EF v9.

**Shell 2** (edit layer, shipped 22 April) — `admin-member-edit` EF v4 + edit UI in `admin-console.html`:
- 14 SAFE fields (inline pencil)
- 7 SCARY fields (modal + reason, logged to `admin_audit_log`)
- Audit Log accordion section in member detail
- Field list verified against real `public.members` schema

**Spec:** `plans/admin-console-spec.md` (written 22 April, post-hoc).
**Earlier `admin-dashboard` plan:** `plans/admin-dashboard.md` (historical, describes Dashboard.html).

### Shell 2 testing still open
- End-to-end SAFE field edit (e.g. `company`)
- End-to-end SCARY field edit (e.g. `persona`) + reason validation
- Audit log display after edit
- Modal dismissal (backdrop click, Escape key)
- Role gating for a `coach_exercise` user (create one and verify persona edit 403s)

### Shell 3 (future)
- Cross-table edits: habits (`member_habits`), programme (`workout_plan_cache`), weekly goals (`weekly_goals`)
- Bulk operations (multi-select, batch persona/stream change)
- Content library CRUD: `habit_library`, `programme_library`, `knowledge_base`
- Member impersonation (support flow)
- Advanced audit filter / search

### Anon-key rotation
`admin-console.html` embeds the project anon key in source (same pattern as portal). Consider rotation if file has been publicly readable for an extended period. Low priority: RLS + `admin_users` allowlist do the real gating.

## Design System — Phase Roadmap

- ~~**Phase A: Token foundation**~~ ✅ Done 17 April 2026
- ~~**Phase B: Semantic colour migration**~~ ✅ Done 17 April 2026
- ~~**Phase C: Session-page template consolidation**~~ ✅ Done 17 April 2026 — 14 stubs + 4 shared files
- **Phase D: Component primitives** (~2 days) — Shared `.btn`, `.card`, `.input`, `.modal-sheet` classes. Removes 72 unique button class names, 90 unique card class names.
- **Phase E: Typography + spacing scale migration** (~1 day) — Replace 118 unique font-size values and 264 unique padding values with `--text-*`, `--space-*` tokens.
- **Future: `VYVE_Health_Hub.html` redesign + PWA linking** — Out of scope for Phases A-E. Planned for later.

---

## Workout Engine v2 — PARKED 27 April 2026 (awaiting Calum's filled inputs pack)

Calum (Physical Health Lead) has delivered the spec, scoring data, and QA framework. We've drafted the inputs pack to give him the remaining must-do inputs (slot templates, contraindications matrix, time→count bounds, progression sign-off, gap-list xlsx for 67 unscored exercises). When he returns the filled pack, the build resumes.

**Architecture decided:** deterministic engine (filter → score with context weights → rank → fill slots) replaces AI exercise selection. AI used only for programme name/rationale (Sonnet 4) + Layer 2 reviewer (Haiku 4.5). Drops cost ~30× (~£0.30 → ~£0.01 per onboarding) AND raises quality by encoding Calum's expertise as data.

**Stages on restart:**
1. Import 203 + 67 = 270 scored exercises into Supabase `exercise_scoring` table; build name normalisation layer (Calum: "Barbell Bench Press" ↔ ours: "Bench Press – Barbell")
2. Build deterministic selection engine in TS inside `generate-workout-plan` v12, behind feature flag
3. Persist new onboarding fields — add columns to `members` for `priority_muscle` + `session_length_workouts`, update onboarding EF v78 → v79 to save them (currently captured by form, dropped by EF)
4. Code Calum's 20 QA scenarios as automated regression tests
5. Shadow mode for ~50 onboardings (run old AI + new engine in parallel, log both, ship old)
6. Cutover after Calum sign-off on shadow comparisons
7. Movement & Wellbeing engine — Dean's call: separate path from workout engine, generates its own movement plan; not yet built (post-Stage 6)

**Calum maintenance surface:** hybrid — Google Sheet sync into Supabase for v1, upgrade to admin page in strategy dashboard later. Sheet → Supabase nightly sync EF needed at Stage 1.

**Inputs pack outputs (drafted, not yet sent to Calum):**
- `VYVE_Inputs_Pack_for_Calum.docx` — 13-page structured questions doc (slot templates, contraindications, time/count, progression, confirmation checklist)
- `VYVE_Exercise_Scoring_Gap.xlsx` — 67-exercise gap list in Calum's format, formulas auto-calc fit-scores + tier from his 8 base scores

**Onboarding alignment shipped today (`Test-Site-Finalv3` `c34c347`):** Section A email/mobile/confirm-email reorder + Section C equipment, environment, session length, priority muscle questions added/rebuilt to match Calum's spec inputs.

---

## Soon

- **Refactor onboarding v74 to call `generate-workout-plan` EF** — remove ~120 lines of inline duplicated logic. EF has a richer implementation (dedicated programme-overview step, better prompts, cleaner video enrichment) than onboarding's inline copy. ~2 hrs, zero-risk if deployed atomically. Surfaced by 18 April reconciliation.
- **In-app onboarding fallback** — simplified questionnaire inside portal for members with no workout plan (~3-4 hrs)
- **Onboarding resilience: save-answers-first** — progressive answer saving + error screen (~2-3 hrs)
- **Load `vapid.js` on other portal pages** — currently only `index.html` has push subscription
- **`certificate-checker` push notification** — send push when cert earned
- **HAVEN clinical sign-off** — formally decide: approve as-is or gate pending professional review. HAVEN is actively being assigned (Conor Warren, 15 April 2026).
- ~~**Dashboard data date-range filter** — `member-dashboard` EF fetches ALL historical data, needs 90-day limit~~ **DONE differently 20 April 2026** — member-dashboard v44 now reads from `member_home_state` aggregate (1 row) + only 30-day slices for the engagement calendar. Fanout is fundamentally solved; no blanket limit needed.
- **Hash emails before sending to PostHog**

---

## Later

- **Accessibility — large text + WCAG pass** (flagged by Alan 21 April — struggles to read portal at his large-text iOS setting). Four-option plan at `plans/accessibility-large-text.md`. Option 1 (restore pinch-zoom) is 10 min; Option 2 (in-app text-size toggle in Settings) is ~half a day. Full WCAG 2.1 AA pass needed before public sector / Sage procurement.
- Social activity feed (spec at VYVEBrain, pending Lewis sign-off on 7 product decisions)
- Dashboard widget customisation
- Persona context modifier system
- AI weekly goals Phase 2 (behavioural goals from check-in data)
- Weekly progress summary email (blocked on Lewis copy)
- PostHog / Supabase Auth identity wiring
- Milestone message system
- Today's Progress dot strip (blocked on Lewis copy)
- Re-engagement copy review — Lewis to bulk-approve subjects + body copy across the new A/B ladder (A_48h/96h/7d/14d, B_3d/7d/14d/30d). Current copy carried forward from v7 staticBodies + AI persona overlay; structurally correct but not yet copy-passed by Lewis post-rewrite.
- Live viewer count on sessions (only display when 20+ viewers)
- **BIMI — logo in inbox sender avatar** — shows VYVE logo next to sender name in Gmail, Apple Mail, Yahoo. Requires: (1) DMARC at `p=quarantine` or `p=reject` (currently unknown — audit first), (2) SVG Tiny P/S logo hosted on `vyvehealth.co.uk`, square, solid bg, <32KB, (3) UKIPO trademark registration for VYVE logo (~£170–340, 4–6 months), (4) VMC from DigiCert/Entrust (~$1.3K/year — Gmail requires this; CMC is cheaper but only works on Apple Mail). Staged plan: audit SPF/DKIM/DMARC now (free, 30 min) ⮕ file UKIPO trademark pre-Sage contract (≈£200, protects brand anyway) ⮕ buy VMC + deploy BIMI DNS post first enterprise contract. Interim: set Gravatar on `team@vyvehealth.co.uk` — works in some clients with zero cost. Not priority until post-revenue.

---

## Grants & Partnerships

- National Lottery Awards for All application
- The Fore grant — register June/July 2026
- WHISPA research partnership — monitor May 2026 launch

---

## Lewis Actions (Business)

- Facebook Make connection — **EXPIRES 22 MAY 2026 (CRITICAL)**
- Make social publisher fix — 133 posts stuck since 23 March
- B2B volume discount tiers — define before first contract
- Brevo logo removal (~$12/month)
- Annual pricing discount % decision
- 5 disabled Make tasks — keep or remove

---

## Completed (Recent)

- **Certificate parse-bug + viewer polish + password UX + reset-email rebrand + share-workout fix session** (22 April 2026) — fixed 3-day `certificates.html` parse error via debug overlay (two missing `</script>` tags); reverted `member-dashboard` v48 `verify_jwt` to false (Rule 21 restatement); rebuilt `certificate.html` viewer (theme-aware chrome + always-light cert panel + iOS-PWA Web Share API PDF download + zoom lock + nav chrome); password show/hide toggle on `login.html` + `set-password.html`; Supabase Auth recovery email rebranded via Management API (Playfair+Inter, brand teal, logo image, dark-mode @media, MSO fallback); `share-workout` v10 fixes "Could not import" via upsert on `onConflict: 'member_email'` (previous UPDATE-then-INSERT violated full-column UNIQUE). Codified Hard Rules 43 (script-tag balance), 44 (workout_plan_cache unique), 45 (iOS PWA blob URL).
- **Certificate parse-bug fix + viewer polish + password UX + reset email + share-workout import fix** (22 April 2026) — (1) `member-dashboard` v49 revert `verify_jwt` to false (Rule 21 trap, second April occurrence); (2) 3-day-old `certificates.html` hang RCA'd via visible debug overlay — two missing `</script>` close tags from 17 April commits, 14 prior fix attempts all theoretically correct but landed in a script block the browser rejected at parse time; (3) `certificate.html` viewer: iOS-PWA-aware download via Web Share API (blob-URL downloads silently fail on iOS PWAs), rotate overlay suppress, theme-aware chrome with always-light cert panel, nav/header/sw register; (4) password show/hide toggle on `login.html` + `set-password.html` (eye icon, cursor-preserving, autocomplete-safe); (5) Supabase Auth recovery email rebrand via Management API — Playfair + Inter, brand teal, light-first with dark-mode @media enhancement, MSO VML fallback, logo image + text wordmark; (6) `share-workout` v10 — `add_programme` now upserts on `workout_plan_cache.member_email` (UNIQUE constraint defeats the UPDATE-then-INSERT pattern). Codified as Hard Rules 43–45.
- **Light-mode readability + nav chrome unification session** (21 April 2026) — theme.css semantic token layer (`--label-*`, `--fill-*`, `--line-*`), 242-replacement sweep across 12 HTML pages, nav chrome locked dark on light theme, exercise/movement/weekly-checkin/monthly-checkin brought in line with standard sub-page pattern, sw.js overhauled to network-first HTML + `skipWaiting()`/`clients.claim()`, nav.js nav-chrome injection moved to `document.body.prepend` (fixes skeleton/app dual-main flash-and-disappear bug). 7 portal commits, 6 brain commits. Codified as Hard Rules 39–42.
- **Three-issue fix session** (18 April 2026) — `monthly-checkin` EF v16 (column drift fix), `wellbeing-checkin.html` nav scoping + viewport zoom fix, `index.html` notif-topbar safe-area + bottom nav style match, sw cache bump to 18a
- **Brain full system reconciliation** (18 April 2026) — master.md rewritten, triggers/FKs/aggregation documented, EF inventory rebuilt
- Admin dashboard + aggregation layer shipped (18 April 2026)
- Desktop nav More dropdown + avatar profile panel (17 April 2026)
- `engagement.html`, `certificates.html`, `index.html` script injection corruption fix (17 April 2026)
- `sw.js` cache migration removed from activate handler (17 April 2026)
- Previous brain reconciliation (16 April 2026)
- Android resubmitted with correct icon (15 April)
- iOS submitted to App Store (13 April)
- `engagement.html` critical fix — double async syntax error (15 April)
- Exercise search overlay CSS fix (15 April)
- `nav.js` bottom bar height reduction (15 April)
- Skeleton timeout monitors on 10 pages (15 April)
- Onboarding v67 — inline workout plan generation (13 April)
- Monthly wellbeing check-in shipped (13 April)
- Workout library Phase 2 — 30 programmes (12 April)
- Workout sharing Phase 1 — `shared-workout.html` (12 April)
- Pause/resume programme switching (12 April)
- Custom habits in settings (12 April)
- In-app notifications + web push (10-11 April)
- Platform monitoring system (11 April)
- Security audit + remediation (11 April)
- Nutrition setup page (11 April)
- Onboarding field audit — 7 new columns (11 April)
- VAPID web push (11 April)
- Brevo email logo update (13 April)