# VYVE Perf Audit — 08 May 2026

> **Scope.** End-to-end audit post-PM-9. Goal: identify perceived-load-speed bottlenecks at 32 members today and at 1K / 10K / 100K members projected. Tier each finding ship-now / pre-launch / at-scale / not-worth-it.
>
> **Method.** Static audit — no telemetry shim shipped this session because the static evidence pile was already overwhelming and unambiguous. Three independent angles: (1) DB row counts + index-vs-seqscan ratios + EXPLAIN ANALYZE on hot-path queries, (2) `pg_stat_statements` ranked by total time, (3) read of every relevant EF source + portal-page JS that feeds those queries. RLS-wrap audit confirms PM-8 is intact across all 72 policies. Telemetry shim deferred to a follow-up because the audit conclusion didn't require it — there's a clear list of fixes worth shipping before measurement, and measurement should validate-after-fix not before.
>
> **Audit-only constraint held.** No code shipped. Two findings cross the ship-now bar (P0-1 and P0-2 below). They're flagged, not actioned.

---

## TL;DR

The portal is *not* perceptibly slow today for the average member. Post-PM-8, the canonical hot-path queries plan in 1–10ms and execute in 1–5ms. The cache-paint perf project (PM-3 through PM-9) genuinely closed the perceived-load problem at current scale. Lewis's 10s exercise tab on 8 May was real but was the RLS-bare-auth bug, not architecture.

What the static audit *did* find:

1. **`get_charity_total()` is the #1 query in pg_stat_statements by total time** (577 seconds, 190ms mean, 3037 calls). 6-table UNION ALL scan with GROUP BY. Linear in total platform activity. **At ~5K members this becomes the dominant page-load cost; at 100K it's 5–30s per call.** Already on the home dashboard hot path. **P0-1, ship-now.**
2. **`recompute_all_member_stats()` 5-table LEFT JOIN cartesian explosion.** EXPLAIN ANALYZE at 15 active members produced **4,890,146 intermediate rows** and took **2.27 seconds** for a query that returns 15 rows. The query plan is multiplicative — each LEFT JOIN multiplies the working set. **At 1K members this is ~minutes; at 10K members it's unworkable; at 100K it's a non-starter.** Same anti-pattern lives in `daily-report` cron and `re-engagement-scheduler`. **P0-2, pre-launch.**
3. **`member-dashboard` v59 fires ~22 outer + ~24 inner sequential PostgREST queries per home load.** The 06 May PM-2 staging — 5 `*_this_week` columns on `member_home_state` populated by triggers — is live but *the EF still queries the source tables in parallel instead of reading state*. Closing this drops ~10 round-trips. The achievements payload's 24 sequential `count(*)` calls inside the inflight calculation is another ~24 round-trips, all serial. **P1, pre-launch.**
4. **`theme.js` fires a Supabase fetch on every page load** (5247 calls in pg_stat_statements). Cross-device sync should run once per session, not per page. **P2, ship-now (cheap, isolated).**
5. **`leaderboard` EF reads ALL members + ALL home_state + ALL employer_members on every call, no pagination.** At 100K members that's a 50MB+ JSON response per leaderboard load, sorted in-memory in the EF. **At 10K it's already 30MB+. P1, pre-launch.**
6. **`refresh_member_home_state()` is 207ms per call and fires on every write to 10 source tables synchronously via trigger.** Means tap-to-log latency is dominated by this. Index-driven so it scales, but linear in member's own activity history (~2-3KB shared buffers per call now, ~50KB at 100K activities). **P2, at-scale.**
7. **`work_mem = 2.1MB` on Pro plan.** Any query needing sort/hash above that spills to disk. The 6-table UNION/GROUP at scale will exceed it. **P3, at-scale config.**
8. **`max_connections = 60`.** Pro plan default. PostgREST + pgbouncer handles this for normal traffic but at 100K members under peak (e.g. cron + concurrent dashboard hits) we'd see queue depth issues. **P3, at-scale.**

What the audit **didn't** find:
- No drift on the PM-8 RLS wrap (all 72 policies still wrapped).
- No missing indexes on member-scoped hot-path tables that hurt now or at 10K. Index coverage on the heavy tables is genuinely good.
- No HTTP/2 / compression / CORS / SW pathologies. SW HTML SWR matches PM-7 spec, cache key is current.
- No connection-reuse problem visible in EF source — every EF uses one `createClient(SR)` and the inner `q()` helper reuses fetch which is auto-pooled by Deno.
- No realistic risk of cron jobs overlapping their schedule windows today; at 100K several would. Tracked at-scale.

The conclusion is that **the perceived-speed problem is genuinely solved at current scale** and the audit's main contribution is the at-scale projection. Ship-now items are narrow.

---

## Findings, ranked

### P0-1 — `get_charity_total()` is the #1 query by total time (~10 minutes/day) and scales linearly in total platform activity

**Evidence.**
- `pg_stat_statements`: 577s total exec time, 3037 calls, 190ms mean, 1.0 rows returned per call.
- EXPLAIN ANALYZE at 32 members: 127.5ms execution, 1382 shared buffer hits (~11MB scanned).
- Source: 6-table UNION ALL with `GROUP BY member_email, activity_date` aggregating capped per-member-per-day counts across `daily_habits + workouts + cardio + session_views + replay_views + wellbeing_checkins`.
- Caller: `member-dashboard` v59 hot path (item 9 in the Promise.all). Also called from `certificate-checker` cron and elsewhere. Returns the platform-wide charity total banner on `index.html`.

**Scaling shape.**
- Today: ~1.7K total activity rows. 127ms.
- 1K members @ 30% activity: ~3M rows. Projected ~1-2 seconds.
- 10K members: ~30M rows. ~10-15 seconds.
- 100K members: ~300M rows + GROUP BY working set. Spills `work_mem` (2MB), hits disk. **30s+, possibly times out at the 120s `statement_timeout` floor.**

**The shape is fundamentally wrong.** The query computes a value that changes by *at most* one increment per member-day, but recomputes the whole platform's history on every call. There's a `charity_total_running` aggregate that should be maintained incrementally — every capped activity write increments it, every UPDATE does too, and the read is `SELECT current_value FROM charity_running_total`.

**Fix shape (concrete).**
1. Add `platform_counters` table: `(counter_key text PK, counter_value bigint, updated_at timestamptz)`. Seed with current `get_charity_total()` value.
2. Triggers on the 6 source tables: AFTER INSERT, evaluate the cap rule for that member-day (or member-week for checkins), and IF the row crosses the cap threshold for the first time, `UPDATE platform_counters SET counter_value = counter_value + 1`. AFTER DELETE: decrement if it would un-cross.
3. Replace `get_charity_total()` body with `SELECT counter_value FROM platform_counters WHERE counter_key = 'charity_total'`.
4. Migration script reseeds counter_value from a one-off `SELECT public.get_charity_total()` at deploy time so we don't lose the existing total.

Edge-case handling: same-day inserts are idempotent re cap (only first one increments); deletes need to evaluate "would removing this row drop the day below cap" — handle in trigger.

**Tier.** Ship-now.
**Time.** 3-4h Claude-assisted (table + 6 triggers + replacement function body + migration + verification on Stu's account). Reversible — old function can stay, just rename.
**Sign-off.** Dean only. No member-facing copy, no clinical content. The numbers stay byte-identical to today's output.
**Risk.** Trigger logic must match the cap rules in `set_activity_time_fields()` and the existing capped-counter logic in `get_charity_total()`. Verification step: run new + old in parallel for 24h, alert on drift.

---

### P0-2 — `recompute_all_member_stats()` 5-table LEFT JOIN cartesian explosion

**Evidence.**
- EXPLAIN ANALYZE at 15 active members: 2,278ms execution, 4,890,146 rows in the intermediate hash join, planning 393ms. The plan is `Hash Right Join` × 4 stacked, with each successive join multiplying the working set: 19 × 30 × 69 × 102 × 282 ≈ 10M but observed 5M (some rows have nulls). At 15 members today, the math is bearable.
- Same anti-pattern in `daily-report` cron source (1.2s, 1 call) and `re-engagement-scheduler` (924ms, 1 call): "MAX(dh.logged_at) AS last_habit … LEFT JOIN daily_habits dh ON dh.member_email = m.email" against 4 source tables.
- Cron schedule: every 15 minutes (jobid `vyve_recompute_member_stats`).

**Scaling shape.**
- 1K members @ avg 10× activity each: 10K daily_habits × 5K workouts × 3K sessions × 1K checkins → joined working set of ~10^14, grossly impossible. PG would fall back to nested loops, probably ~5-30 minutes per cron run.
- 10K members: query plan irrecoverable.
- 100K: cron would never finish.

**Fix shape (concrete).**
The query should never use `LEFT JOIN ... GROUP BY` for "last activity per type per member" against high-cardinality tables. Two options:

**Option A (recommended).** Per-member subqueries via lateral:
```sql
SELECT m.email,
  (SELECT MAX(logged_at) FROM daily_habits WHERE member_email = m.email) AS last_habit,
  (SELECT MAX(logged_at) FROM workouts WHERE member_email = m.email) AS last_workout,
  ...
FROM members m WHERE m.subscription_status = 'active';
```
Each subquery uses the member-email index, returns 1 row. At 100K members → 100K × 4 index lookups = ~400K index seeks. Postgres handles this in seconds, not minutes.

**Option B.** Read from `member_home_state.last_activity_at` (already maintained by the trigger pipeline). For per-type last-activity, add columns `last_habit_at / last_workout_at / last_session_at / last_checkin_at` to `member_home_state` and have `refresh_member_home_state()` populate them.

Option B is strictly better at runtime cost (one indexed PK lookup per member instead of 4 subqueries) but requires the schema migration + refresh function update + 4 column backfill. Option A is a one-line query rewrite per call site.

Suggest **Option A first** (1h, surgical), then **Option B as a follow-up** when consolidating the trigger pipeline.

**Tier.** Pre-launch. Today's 15-member 2.3s is annoying but not user-facing; at 1K members it tips into "cron job overruns its schedule" territory which is a real outage.
**Time.** Option A: 1h Claude-assisted (rewrite `recompute_all_member_stats()` body, plus same shape in `daily-report` and `re-engagement-scheduler` source). Option B: +3h.
**Sign-off.** Dean only.
**Risk.** Returns identical values, just via a different plan. Add an EXPLAIN-time regression check.

---

### P1-1 — `member-dashboard` v59 still issues ~22 + ~24 sequential queries; the staged compression hasn't shipped

**Evidence.**
- Source read: 22-entry `Promise.all` in the outer call. `getMemberAchievementsPayload` then iterates `Object.entries(INLINE)` — 23 metric definitions, each sequential `count(*)` on a different table.
- Live `member_home_state` schema confirmed to already have: `habits_this_week, workouts_this_week, cardio_this_week, sessions_this_week, checkins_this_week, recent_habits_30d, recent_workouts_30d, recent_cardio_30d, recent_sessions_30d, recent_checkins_30d, habits_this_month, workouts_this_month, cardio_this_month, sessions_this_month, checkins_this_month` — every aggregate the EF currently parallel-queries.
- 06 May PM-2 changelog: "5 *_this_week columns added 06 May 2026 PM-2 are populated and live but not yet read by member-dashboard (see §19 / backlog Layer A-tail)."

**The outer Promise.all has 5 queries that are pure dupes of state columns:**
- `habitsThisWeek` → `state.habits_this_week`
- `workoutsThisWeek` → `state.workouts_this_week`
- `cardioThisWeek` → `state.cardio_this_week`
- `sessionsThisWeek` → `state.sessions_this_week`
- `checkinsThisWeek` → `state.checkins_this_week`

Plus `habitsRecent / workoutsRecent / cardioRecent / sessionsRecent / replaysRecent` (the 30-day feed) — these do return per-row activity_date for the activity-log frieze, can't trivially compress without changing the activity-log shape. Defer those.

**The achievements inflight calculation iterates 23 INLINE metrics sequentially:**
Each runs `count(*)` on a different table for the caller's email. The pattern:
```js
for (const [slug, fn] of Object.entries(INLINE)) {
  let value = await fn(supabase, email);  // serial, no Promise.all
  ...
}
```
This is 23 round-trips serialized. PostgREST doesn't pipeline within a single createClient instance.

**Two compressions, both ship-pre-launch.**

**A.** Drop 5 queries from the Promise.all by reading state columns. The habits-distinct-day count needs special handling — read both `state.habits_this_week` (row count) AND `daily_habits` activity dates this week (kept) — but EF can drop the simple count for goal progress and use `state.habits_this_week` while keeping the activity-date select for the distinct-day calculation. **Net: -4 round trips.** 1h.

**B.** Parallelise the inflight calculation. Wrap `Object.entries(INLINE).map(...)` in a `Promise.all` so all 23 counts fire concurrently. Caveat: this drives PostgREST connection count up momentarily — pgbouncer handles it fine but worth measuring. **Net: 23 → 1 round-trip equivalent.** 30 min.

**C (bonus).** Many of those INLINE counts are also already on `member_home_state`. `habits_logged → state.habits_total`. `workouts_logged → state.workouts_total`. Etc. **At least 15 of the 23 INLINE counts can read state instead of `count(*)`.** That's a strict improvement (counts are O(rows) on the table; state read is O(1)). Requires editing `_shared/achievements.ts` to add a "use state column" path for inline metrics that have an obvious state-column equivalent. ~2h.

Combined: drop ~20 round-trips from member-dashboard hot path + replace ~15 `count(*)` calls with a single state read.

**Tier.** Pre-launch (perceived perf win, no user-facing risk).
**Time.** 3-4h combined.
**Sign-off.** Dean only.
**Risk.** Numerical drift between source-table count and state-column value if triggers ever miss a write. Mitigate with a daily reconciliation cron that checks `member_home_state.habits_total = (SELECT COUNT(*) FROM daily_habits WHERE member_email = X)` for a sample and alerts on drift.

---

### P1-2 — `leaderboard` EF reads all members + all home_state + all employer_members on every call

**Evidence.**
- Source read: `Promise.all([q('member_home_state', 'select=…'), q('members', 'select=…'), q('employer_members', 'select=…')])` — all unbounded, no `limit`, no scope filter at the DB level.
- Sort + slice happens in EF memory.
- At 32 members the response is small. At 100K it's 100K × ~250 bytes home_state + 100K × ~150 bytes member + ~100K × ~80 bytes employer = ~50MB JSON per call.

**Scaling shape.**
- 1K members: ~500KB per call. Tolerable.
- 10K: ~5MB. EF starts feeling slow, network impact on real cellular significant.
- 100K: ~50MB per call. EF memory limit is 256MB on Supabase, so it works, but JSON parse + sort + serialize is ~5+ seconds and the network transfer is ~10+ seconds on a typical mobile connection.

The EF was designed for a small cohort and didn't anticipate the all-time / company-scope / range options would force full scans every time.

**Fix shape (concrete).**
The leaderboard is fundamentally aggregateable server-side. Approach:

1. Pre-compute `leaderboard_snapshot` table per (scope, range, metric) — keyed `(scope_key, range, metric, member_email)` with `rank, count, last_activity_at`. Refresh every 5-15 min via cron.
2. EF query becomes: `SELECT * FROM leaderboard_snapshot WHERE scope_key = 'all' AND range = 'this_month' AND metric = 'all' ORDER BY rank LIMIT 100`. One indexed read per scope/range/metric combination.
3. The caller's own row + the rows around it (your_rank ± 5) come from a single targeted query against the snapshot.

For 100K members across 4 metrics × 3 ranges × 3 scopes (all/company/team) = 36 leaderboard variants × 100K members = 3.6M snapshot rows total. At ~80 bytes each that's ~300MB on disk. Manageable. Refreshing all 36 in one cron pass with proper indexing takes seconds.

**Tier.** Pre-launch — but only because there's headroom now. At 1K members, status quo is still under 1MB per call.
**Time.** 4-6h Claude-assisted (table + index + refresh function + cron + EF rewrite).
**Sign-off.** Dean only. No copy/clinical changes.
**Risk.** Stale leaderboard between cron runs. Mitigation: refresh cron every 5 min for active scopes; member's own row read live from `member_home_state` and stitched into the cached top-100.

---

### P2-1 — `theme.js` fires a Supabase fetch on every page load to read `theme_preference`

**Evidence.**
- Source: `theme.js` head-script polls for `vyveCurrentUser` then runs `fetch(SUPA_URL + '/rest/v1/members?email=eq.' + email + '&select=theme_preference&limit=1')` regardless of whether localStorage already has the value.
- pg_stat_statements: 5247 calls, 22.2s total, 4.23ms mean. ~$~400/year if PostgREST scales linearly with queries (small but pure waste).
- Hard-coded anon JWT in plain JS (also visible in the homepage prefetch IIFE — it's the anon key, not service role, so leak risk is bounded but still bad hygiene).

**Why this matters perceptibly.** Theme.js runs synchronously in `<head>` (correctly — see PM-7 §23 hard rule). The fetch is async-fired but it ties up a connection on every page load. On real cellular, a 4ms server-side query becomes a 200-500ms round trip, every navigation. Not blocking the paint but burning member device + network for no functional reason.

**Fix shape (concrete).**
1. Skip the fetch entirely if localStorage already has a non-default value (`vyve_theme` is set and ≠ `'system'`). The current logic only fetches to *override* localStorage if the DB value is different — but the localStorage value was authored by `vyveSetTheme()` which writes to BOTH localStorage and Supabase. If they ever diverge it's because the member used a different device. Treat the cross-device sync as a once-per-session event, not per-page.
2. Add a `vyve_theme_synced_at` localStorage timestamp; only re-fetch if older than 1 hour.
3. Bonus: rotate the embedded anon JWT to a separate fingerprinted one so it's auditable. Not urgent.

**Tier.** Ship-now (cheap, isolated, eliminates ~5K queries/week).
**Time.** 30 min Claude-assisted. Single file commit, SW cache key bump.
**Sign-off.** Dean only.
**Risk.** Cross-device sync delay. Acceptable — themes don't change often.

---

### P2-2 — `refresh_member_home_state()` 207ms per write, fires synchronously on triggers across 10 source tables

**Evidence.**
- EXPLAIN ANALYZE at 32 members: 207ms, 2627 shared buffers hit (~21MB). Function body is 20K chars, computes streaks + this_week + this_month + recent_30d + engagement_components for one member.
- Trigger setup: AFTER INSERT/UPDATE/DELETE on `daily_habits, workouts, cardio, session_views, replay_views, wellbeing_checkins, weekly_scores, weight_logs, members, monthly_checkins`.
- This means: every habit tick → 200ms server time before the row write returns. Member experiences this as 200ms tap latency on top of network round trip.

**Scaling shape.**
- The function is keyed on a single member's data (not platform-wide), so it scales with **per-member activity history depth**, not platform size. At 100K members the function still runs against one member's rows — but if that member has 1K activities, it's ~10× slower.
- 100K members × avg 1K activities each = ~50ms per refresh × 10K writes/min platform-wide = 500 sec/min server time = **8.3 cores burned on this trigger alone at peak.** Pro plan has 4 cores.

**Fix shape (concrete).**
- Simplest: convert the trigger from synchronous to async. Trigger fires `pg_notify('refresh_home_state', email)`; a single background worker (LISTEN) drains the queue and calls `refresh_member_home_state()` per email, debounced to one call per email per 5 seconds. The member's tap-to-log returns in <50ms; their dashboard sees the update on next load (or live via the existing dashboard cache invalidation).
- Alternative: maintain home_state via incremental column updates from the trigger directly (`UPDATE member_home_state SET habits_today = habits_today + 1 WHERE member_email = X`) instead of recomputing from scratch. Faster but uglier — drift potential.

**Tier.** At-scale. Today's 207ms is annoying but not blocking. Becomes critical at 10K+.
**Time.** Async-trigger version: 4-6h. Incremental version: 8-12h with full reconciliation cron.
**Sign-off.** Dean only. Risk: `member_home_state` becomes eventually-consistent — need to guarantee the reader sees their just-written change. Tractable with read-after-write inside the same EF call (refresh on read if stale).

---

### P2-3 — Achievements `loadCatalog` cache is per-isolate, not cross-isolate

**Evidence.** Source: `loadCatalog` has `let CACHE: { at: number; data: Catalog } | null = null` at module scope, TTL 60s. Each Edge Function isolate (Deno isolate) gets its own. Supabase EFs cold-start per region per traffic burst — at low concurrency, multiple isolates each spawn fresh and re-fetch the catalog.

`pg_stat_statements`: `achievement_tiers select all 327 rows` runs 1145 times for 57.7s total. `achievement_metrics select all 32 rows` runs 1145 times for 14s. Combined ~70s/period across both, which is small but pure waste because the catalog doesn't change between deploys.

**Fix shape.** Either: (a) cache in Supabase Edge KV (when GA), or (b) embed the catalog as a JSON file checked into the EF source — re-deploy the EF on catalog change (rare event). Option (b) is simpler.

**Tier.** Not-worth-it today. Becomes P2 if catalog grows or EF cold-start frequency increases.

---

### P3-1 — `work_mem = 2.1MB`, `max_connections = 60` (Pro plan defaults)

`work_mem` cap means the 6-table UNION/GROUP queries spill to disk at scale. After fixing P0-1 + P0-2, this matters less. `max_connections = 60` means at peak burst (e.g. cron + 50 concurrent dashboard hits) the pool can saturate. Both can be raised via Supabase support ticket once we have evidence of saturation. **At-scale.**

---

### P3-2 — `member_health_samples` partitioning

**Evidence.** Already 6.8K rows at 4 active HK members. Per Apple Health inspector test (brain): 954 samples per member per detailed pull. Long-format raw samples are the table that grows fastest.

**Scaling shape.**
- 100K members × 30% iPhone × ~500 samples/day each = ~15M rows/day → ~5.5B rows/year.
- Range queries (last 7 days, last_night_window) need indexes on `(member_email, sample_type, start_at DESC)` — already exist.
- Partitioning by `start_at` month would let cron-driven rollups drop old partitions cheaply.

**Tier.** At-scale. 100K-member problem. Not on the radar at <10K.

---

## Tiered action list

### Ship-now (≤1 day, this week)
- **P0-1** — `get_charity_total()` → `platform_counters` increment-on-write. 3-4h.
- **P2-1** — `theme.js` skip fetch if localStorage fresh. 30 min.

### Pre-launch (before public-launch comms in mid-May)
- **P0-2** — Rewrite `recompute_all_member_stats()` + `daily-report` + `re-engagement-scheduler` to use per-member subqueries. Option A first. 1h.
- **P1-1** — `member-dashboard` reads state columns instead of duplicate parallel queries. + parallelise achievements inflight loop. + state-column path for INLINE counts. Combined 3-4h.
- **P1-2** — `leaderboard` snapshot table + cron. 4-6h.

### At-scale (post-1K members)
- **P2-2** — `refresh_member_home_state()` async via pg_notify or incremental column updates. 4-12h.
- **P3-1** — Lift `work_mem` and `max_connections` via Supabase support.
- **P3-2** — `member_health_samples` partition by `start_at` month + rollup retention.
- **leaderboard** Option B (state-column-derived achievements counts).
- Telemetry shim: deferred. Build when post-fix measurement matters; until then the static evidence is sufficient.

### Not-worth-it
- **P2-3** — Achievements catalog cross-isolate cache. Wait for Edge KV GA.
- The 5 `ON DELETE NO ACTION` → CASCADE FKs from memory: tracked in backlog separately, no perf impact at any scale, hygiene only.
- Cache-key bump CI gate from PM-7 backlog: nice-to-have, not perf.

---

## Brain-vs-live drift caught during the audit

- §8 portal pages SW cache key claims `vyve-cache-v2026-04-29h-fullsync-btn`; live is `vyve-cache-v2026-05-08-prefetch-exercise-7`. Brain master needs §8 update.
- §6 schema description doesn't mention the 5 `*_this_week` columns on `member_home_state` are dormant. PM-2 06 May had it, but the master block didn't fold it forward. Update §6 entry for `member_home_state` to flag dormant-but-live columns explicitly.
- §7 EF inventory lists `member-dashboard` with no version pin — live is v59 (platform 65). Acceptable — the brain doesn't track version numbers per the 04 May PM-2 cleanup decision.

---

## What was deliberately NOT included

- **Telemetry shim.** Deferred. The static evidence pile was sufficient to write a fix list with concrete row numbers and EXPLAIN ANALYZE backing every claim. The shim is the right next step *after* P0/P1 are shipped, to validate the projected wins land on real iPhones.
- **iOS Capacitor WKWebView SW edge cases.** SW source read clean, no obvious issue. If post-fix telemetry shows iOS-specific anomalies, revisit.
- **Storage/CDN behaviour for exercise videos.** Out of scope for page-load perf; relevant for movement.html specifically. Tracked separately.
- **Push delivery latency.** Not page-load perf, deliberately out of scope per intro.
- **Composio MCP write-path latency on brain commits.** Toolchain perf, not platform.

---

*End of audit. Authored 08 May 2026 PM-10 by Claude. No code shipped this session — recommendations only.*
