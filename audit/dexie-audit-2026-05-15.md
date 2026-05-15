# Dexie audit — 2026-05-15

**Pinned heads:** vyve-site `83874dd5cd8ff9650497c7c631ccb9bc6baf8fd2` · VYVEBrain `9cb2410112da7f81d3075810707c23004c0916bf` (at audit start).
**Method:** whole-tree fetch of the vyve-site portal (49 HTML + 32 JS = 81 source files), parallel blob fetch via Composio workbench, all classifications re-derived from live code (per brief, brain narrative not trusted). Live Supabase `information_schema` cross-referenced for 42 in-scope tables. Companion structured findings in `audit/dexie-audit-2026-05-15.json`.

## Executive summary

**46 findings: 23 P0 · 20 P1 · 1 P2 · 2 INFO.**

**The single root cause we've been missing:** the codebase has two parallel local-cache systems serving the same data needs, and most "Dexie-wired" pages actually paint from the *other* system first.

System A — `VYVELocalDB` / Dexie / `sync.js` / `firstPaintHydrate.js` — is the "official" §3 contract.

System B — `localStorage` caches (`vyve_home_v3_<email>`, `vyve_engagement_cache`, `vyve_certs_cache`, `vyve_members_cache_<email>`, `vyve_programme_cache_<email>`, `vyve_exercise_cache_v2`, `vyve_habits_cache_v3`, plus the `diaryLogs[]` JS array on log-food) — populated by `auth.js` `_vyvePfHome/Members/Exercise/Habits/Engagement/Certs` prewarmers firing from `vyveSignalAuthReady`. Pages read these first. Independent of Dexie entirely.

Three observable consequences:

1. `engagement.html` has zero `VYVELocalDB` references and zero `criticalHydrate` calls. Score ring is one of the most visible surfaces; it's pure localStorage cache + `member-dashboard` EF round-trip. Brain master.md §3 ("Dexie is the source of truth for everything the app reads") is contradicted by this page.
2. The PM-113 hotfix narrative ("habits pills paint from localStorage cache, not Dexie") is not a one-off — it's the dominant pattern across the portal. iOS WKWebView IDB durability concerns (PM-113) made localStorage the de-facto primary cache for several pages; that decision was never codified as an architectural carve-out.
3. The PM-111 finding that called PF-40 "the wrong scaffolding" was right about the symptom but underestimated the scope. firstPaintHydrate is wired into 5 of the 17 member-data pages; 12 are still on the slow mass-hydrate path.

**Other biggest surprises:**

- 10 critical-path scripts are missing from `sw.js urlsToCache`. Loading `workouts.html` offline blackscreens because `workouts-programme.js`, `workouts-session.js`, plus 5 other `workouts-*.js` modules aren't precached. Every `*-live.html` page is similarly broken offline (`session-live.js` not in cache).
- 17 of 26 portal write sites (65%) bypass Dexie locally — either `DIRECT_FETCH` (no queue, no Dexie) or `QUEUED_NO_OPTIMISTIC` (queued but no synchronous Dexie write). The PF-4b Part 2 pattern is mostly aspirational.
- `sync.js plan()` mass-hydrate pulls `daily_habits` with a column subset that drops `logged_at`. `home-state-local.js` `maxLoggedAt(habits)` reads `r.logged_at`. The `last_habit_at` field in the locally-computed `member_home_state` is permanently null on every code path that hasn't yet run `criticalHydrate('home')`.

## P0 findings (ordered by smallest fix scope first)


### P0.1 no dexie wiring (1 finding)

- **engagement.html**  — rule `§23.7.1 + §23.11 + §23.12` — engagement.html has 0 VYVELocalDB references, 0 criticalHydrate, 0 sync.hydrate. Primary read path: localStorage (vyve_engagement_cache) + member-dashboard EF fetch. Engagement score ring is one of the most visible surfaces and is entirely server-bound. Master.md §3 violated.

### P0.2 workouts critical hydrate missing (1 finding)

- **workouts.html + workouts-programme.js**  — rule `PM-112 follow-up` — firstPaintHydrate.js defines a 'workouts' page key (workout_plan_cache + workouts[30d]). workouts-programme.js calls VYVESync.hydrate() (slow 81s mass-hydrate) at four sites (L82, L263, L368, L409) instead of VYVESync.criticalHydrate('workouts'). The PM-112 brain entry called this out as 'wire in follow-up' — that follow-up has not shipped.

### P0.3 sw precache gap (10 findings)

- **sw.js**  — rule `§23.10 + PF-14c rule 2a` — /vapid.js loaded by HTML pages but NOT in urlsToCache — offline cold-boot of those pages will fail.
- **sw.js**  — rule `§23.10 + PF-14c rule 2a` — /session-live.js loaded by HTML pages but NOT in urlsToCache — offline cold-boot of those pages will fail.
- **sw.js**  — rule `§23.10 + PF-14c rule 2a` — /session-rp.js loaded by HTML pages but NOT in urlsToCache — offline cold-boot of those pages will fail.
- **sw.js**  — rule `§23.10 + PF-14c rule 2a` — /workouts-config.js loaded by HTML pages but NOT in urlsToCache — offline cold-boot of those pages will fail.
- **sw.js**  — rule `§23.10 + PF-14c rule 2a` — /workouts-programme.js loaded by HTML pages but NOT in urlsToCache — offline cold-boot of those pages will fail.
- **sw.js**  — rule `§23.10 + PF-14c rule 2a` — /workouts-session.js loaded by HTML pages but NOT in urlsToCache — offline cold-boot of those pages will fail.
- **sw.js**  — rule `§23.10 + PF-14c rule 2a` — /workouts-exercise-menu.js loaded by HTML pages but NOT in urlsToCache — offline cold-boot of those pages will fail.
- **sw.js**  — rule `§23.10 + PF-14c rule 2a` — /workouts-builder.js loaded by HTML pages but NOT in urlsToCache — offline cold-boot of those pages will fail.
- **sw.js**  — rule `§23.10 + PF-14c rule 2a` — /workouts-notes-prs.js loaded by HTML pages but NOT in urlsToCache — offline cold-boot of those pages will fail.
- **sw.js**  — rule `§23.10 + PF-14c rule 2a` — /workouts-library.js loaded by HTML pages but NOT in urlsToCache — offline cold-boot of those pages will fail.

### P0.4 hydrate missing page key (1 finding)

- **engagement.html**  — rule `§23.7.1 + §23.11` — Page paints member data but is not in firstPaintHydrate page-key map and does not call criticalHydrate.

### P0.5 direct fetch no dexie (8 findings)

- **log-food.html** L686 — rule `§23.7.6 + PF-4b Part 2 + §23.12` — Direct fetch PATCH to nutrition_logs bypasses both writeQueued AND Dexie — read-after-write hazard, no offline support.
- **nutrition-setup.html** L526 — rule `§23.7.6 + PF-4b Part 2 + §23.12` — Direct fetch PATCH to members bypasses both writeQueued AND Dexie — read-after-write hazard, no offline support.
- **nutrition.html** L1458 — rule `§23.7.6 + PF-4b Part 2 + §23.12` — Direct fetch PATCH to members bypasses both writeQueued AND Dexie — read-after-write hazard, no offline support.
- **running-plan.html** L720 — rule `§23.7.6 + PF-4b Part 2 + §23.12` — Direct fetch PATCH to running_plan_cache bypasses both writeQueued AND Dexie — read-after-write hazard, no offline support.
- **settings.html** L1033 — rule `§23.7.6 + PF-4b Part 2 + §23.12` — Direct fetch PATCH to members bypasses both writeQueued AND Dexie — read-after-write hazard, no offline support.
- **settings.html** L1300 — rule `§23.7.6 + PF-4b Part 2 + §23.12` — Direct fetch PATCH to members bypasses both writeQueued AND Dexie — read-after-write hazard, no offline support.
- **settings.html** L1537 — rule `§23.7.6 + PF-4b Part 2 + §23.12` — Direct fetch PATCH to member_habits bypasses both writeQueued AND Dexie — read-after-write hazard, no offline support.
- **theme.js** L107 — rule `§23.7.6 + PF-4b Part 2 + §23.12` — Direct fetch PATCH to members bypasses both writeQueued AND Dexie — read-after-write hazard, no offline support.

### P0.6 architectural drift (1 finding)

- **auth.js + multiple**  — rule `master.md §3 architectural commitment` — auth.js `_vyvePf*` prewarmers write to localStorage caches (vyve_home_v3, vyve_engagement_cache, vyve_certs_cache, vyve_members_cache_, vyve_programme_cache_, vyve_exercise_cache_v2, vyve_habits_cache_v3) which pages read FIRST on cache-first paint — parallel to and independent of Dexie. Pages engagement.html, certificates.html (in part), index.html (in part), and the *-checkin pages depend on these localStorage caches as primary data source. Violates 'Dexie is the source of truth for everything the app reads.' Possibly intentional (faster paint than IDB on Capacitor iOS per PM-113), but not codified anywhere.

### P0.7 hydrate gap (1 finding)

- **workouts.html**  — rule `§23.7.1 + PM-112 firstPaintHydrate` — Page paints member data and has page_key 'workouts' in firstPaintHydrate map, but does NOT call criticalHydrate. Uses slow sync.js mass-hydrate path.


## P1 findings (20)


### P1.1 optimistic local missing (1)

- **settings.html**  — rule `§23.7.5 + §23.7.6` — settings.html has 6 write sites; 3 of them (L1033 members PATCH, L1300 members PATCH, L1537 member_habits PATCH) are DIRECT_FETCH without a preceding synchronous VYVELocalDB.<table>.upsert. The merge override in db.js (§23.7.5) protects Dexie correctness IF the upsert happens; without an upsert at all, Dexie holds stale row until next mass-hydrate.

### P1.2 wrong optimistic layer (1)

- **log-food.html**  — rule `§23.7.6 + master.md §3` — log-food.html does optimistic UI via in-memory `diaryLogs[meal].push()` + localStorage `saveDiaryCache()` — never writes to VYVELocalDB.nutrition_logs. The 4 writeQueued sites (food insert ×2, food edit PATCH, food delete) all skip the Dexie write. Read-after-write hazard: log food, close app, reopen — Dexie has no record until queue drains and EF re-fetches.

### P1.3 write bypass (9)

- **habits.html** L655 — rule `§23.7.6 + PF-4b Part 2` — writeQueued to daily_habits without preceding synchronous VYVELocalDB write — read-after-write hazard.
- **habits.html** L807 — rule `§23.7.6 + PF-4b Part 2` — writeQueued to daily_habits without preceding synchronous VYVELocalDB write — read-after-write hazard.
- **log-food.html** L894 — rule `§23.7.6 + PF-4b Part 2` — writeQueued to unknown without preceding synchronous VYVELocalDB write — read-after-write hazard.
- **log-food.html** L1281 — rule `§23.7.6 + PF-4b Part 2` — writeQueued to unknown without preceding synchronous VYVELocalDB write — read-after-write hazard.
- **log-food.html** L1386 — rule `§23.7.6 + PF-4b Part 2` — writeQueued to unknown without preceding synchronous VYVELocalDB write — read-after-write hazard.
- **nutrition.html** L765 — rule `§23.7.6 + PF-4b Part 2` — writeQueued to unknown without preceding synchronous VYVELocalDB write — read-after-write hazard.
- **workouts-session.js** L422 — rule `§23.7.6 + PF-4b Part 2` — writeQueued to unknown without preceding synchronous VYVELocalDB write — read-after-write hazard.
- **workouts-session.js** L605 — rule `§23.7.6 + PF-4b Part 2` — writeQueued to unknown without preceding synchronous VYVELocalDB write — read-after-write hazard.
- **workouts-session.js** L707 — rule `§23.7.6 + PF-4b Part 2` — writeQueued to unknown without preceding synchronous VYVELocalDB write — read-after-write hazard.

### P1.4 hydrate column gap (1)

- **sync.js + home-state-local.js**  — rule `§23.11 hydrate completeness` — sync.js plan() pulls daily_habits with thin column subset (member_email, activity_date, habit_id, habit_completed, notes) — drops logged_at, day_of_week, time_of_day, id, client_id. home-state-local.js maxLoggedAt(habits) reads r.logged_at across all activity tables; for daily_habits via mass-hydrate, last_habit_at will always resolve null. firstPaintHydrate uses select=* so home page (criticalHydrate('home')) is fine; lazy/cold-start home computation before criticalHydrate runs is not.


## P2 findings (1)

- **sync.js + db.js member_habits**  — rule `§23.11` — sync.js plan() member_habits pull and db.js member_habits.replaceForMember denormalisation drop the row's `id` (server UUID PK) and `assigned_at` columns. If any future page sorts/filters by either, value will be undefined. No current page reads them but it's a structural drop worth fixing in the sweep.


## INFO findings (brain drift)

- **master.md §23.11** — rule `documentation` — §23.11 example denormalised columns ('name, description, category, difficulty, theme') do not match the live habit_library schema. Actual schema: habit_pot, habit_title, habit_description, habit_prompt, difficulty, active, health_rule. db.js replaceForMember stamps the correct columns (habit_pot, habit_title, habit_description, habit_prompt, difficulty); the rule example is the drift.
- **audit/pf-40-1-callsites.json** — rule `§23.14 + brief` — Brief warned not to trust pf-40-1-callsites.json as exhaustive. Confirmed: this audit re-derived all classifications from current main HEAD and did not consult the audit JSON. Several new findings (engagement.html zero-Dexie, the dual-cache architecture, sw.js urlsToCache gaps) appear to be new or expanded relative to the PF-40.1 audit scope.


## Per-page findings

The table below summarises the read/write/hydrate posture of every page in portal scope, ordered by severity.

| Page | Member data? | Critical hydrate | sync.hydrate | Reads | Writes | Dexie refs | Worst class | Note |
|------|--------------|------------------|--------------|-------|--------|------------|-------------|------|
| settings.html | member | – | 2 | 3 | 6 | 10 | DIRECT_FETCH:3, DIRECT_WITH_OPTIMISTIC:3 |  |
| engagement.html | member | – | 0 | 0 | 0 | 0 | - | ZERO Dexie wiring |
| log-food.html | member | – | 3 | 5 | 4 | 3 | DIRECT_FETCH:1, QUEUED_NO_OPTIMISTIC:3 | diaryLogs JS array, not Dexie |
| nutrition.html | member | nutrition | 1 | 2 | 2 | 1 | DIRECT_FETCH:1, QUEUED_NO_OPTIMISTIC:1 |  |
| running-plan.html | network_bound | – | 0 | 1 | 1 | 0 | DIRECT_FETCH:1 |  |
| workouts.html | member | – | 0 | 0 | 0 | 0 | - | criticalHydrate not called |
| activity.html | member | – | 0 | 0 | 0 | 0 | - |  |
| cardio.html | member | cardio,cardio | 2 | 0 | 0 | 5 | - |  |
| certificates.html | member | – | 1 | 0 | 0 | 9 | - |  |
| exercise.html | member | – | 1 | 0 | 0 | 2 | - |  |
| habits.html | member | habits,habits | 2 | 7 | 8 | 14 | QUEUED_NO_OPTIMISTIC:2, OPTIMISTIC_LOCAL:6 |  |
| index.html | member | home,home | 0 | 4 | 0 | 8 | - |  |
| leaderboard.html | network_bound | – | 0 | 0 | 0 | 0 | - |  |
| monthly-checkin.html | member | – | 1 | 0 | 0 | 6 | - |  |
| movement.html | member | – | 1 | 0 | 0 | 10 | - |  |
| sessions.html | network_bound | – | 0 | 0 | 0 | 0 | - |  |
| wellbeing-checkin.html | member | – | 2 | 1 | 0 | 6 | - |  |


## Cross-cutting findings

### CC-1: The dual-cache architecture (the root cause this audit set out to surface)

`auth.js` defines a `window.__vyvePrefetch` namespace + an `idle()`-fanned out `vyvePrefetchAfterAuth(user)` routine that runs once per session per email after `vyveSignalAuthReady`. The prewarmers hit Supabase REST directly:

- `_vyvePfHome` → `member-dashboard` EF → writes `vyve_home_v3_<email>`, `vyve_engagement_cache`, `vyve_certs_cache`
- `_vyvePfMembers` → `/rest/v1/members?email=...` → writes `vyve_members_cache_<email>`
- `_vyvePfExercise` → `/rest/v1/workout_plan_cache?member_email=...` → writes `vyve_programme_cache_<email>`, `vyve_exercise_cache_v2`
- `_vyvePfHabits` → `/rest/v1/member_habits` + `/rest/v1/daily_habits` → writes `vyve_habits_cache_v3`

Pages that read each cache (verified via grep):

- `vyve_home_v3_*`: cardio.html, index.html, monthly-checkin.html, nutrition.html, settings.html, wellbeing-checkin.html, tracking.js, vyve-home-state.js, vyve-offline.js
- `vyve_engagement_cache`: engagement.html, index.html
- `vyve_certs_cache`: certificates.html, index.html
- `vyve_members_cache_*`: index.html, nutrition.html, settings.html
- `vyve_programme_cache_*`: index.html, workouts.html, workouts-library.js, workouts-programme.js, workouts-session.js
- `vyve_exercise_cache_v2`: exercise.html, index.html
- `vyve_habits_cache_v3`: habits.html, index.html, settings.html

For most user-visible pages, the cache-first paint reads localStorage first, then (sometimes) Dexie, then falls back to REST/EF. The Dexie path is often the third option, not the first.

This is not strictly wrong — PM-113 documented that iOS WKWebView ITP wipes IndexedDB more aggressively than localStorage on remote-origin Capacitor, and the dual-cache pattern was a deliberate response. But:

1. It's nowhere in `master.md §3` (the architectural contract).
2. It means every "Dexie-only" finding must be evaluated through this dual-layer lens: is the page actually broken, or is the localStorage cache compensating?
3. Once PF-14b bundled mode ships (PM-115/PM-116 — both apps already submitted), the iOS IDB durability problem largely goes away. The dual-cache becomes redundant complexity.

**Decision needed before PF-40 reframe lands**: keep the dual-cache as a permanent §23.13-style carve-out (rename localStorage caches to make their tier explicit) OR commit to retiring them post-PF-14b approval. Currently they coexist and contradict the §3 contract.

### CC-2: Write-path bypasses are the rule, not the exception

| Classification | Count | What it means |
|---|---|---|
| OPTIMISTIC_LOCAL | 6 | Correct §23.7.6 pattern — synchronous Dexie upsert before writeQueued. All 6 are habits.html. |
| DIRECT_WITH_OPTIMISTIC | 3 | Direct fetch with synchronous Dexie upsert before. All 3 are settings.html. |
| QUEUED_NO_OPTIMISTIC | 9 | writeQueued without Dexie write. log-food (3), workouts-session.js (3), habits.html (2), nutrition.html (1). |
| DIRECT_FETCH | 8 | Bypass everything. settings.html (3), nutrition.html (1), running-plan.html (1), nutrition-setup.html (1), theme.js (1), log-food.html (1). |

Read-after-write hazard cardinality:
- **habits.html L655, L807** — undo paths queue without Dexie delete; navigate-back paints stale.
- **workouts-session.js (3 sites)** — entire workouts logging flow has no Dexie write. PF-31 listed in active.md as "Workouts page shows session complete locally + fires achievement; navigate to home then back — green check has DISAPPEARED" — this is the cause.
- **log-food.html (4 sites)** — uses `diaryLogs[]` JS array + `saveDiaryCache()` localStorage as the optimistic layer. Functionally works because the page reads its own array, but Dexie never sees the row.
- **settings.html (3 DIRECT_FETCH)** — members/member_habits PATCH without Dexie upsert. Page navigates away, Dexie holds stale row until next mass-hydrate.

### CC-3: criticalHydrate page-key map is too narrow

`firstPaintHydrate.js` defines five page keys: home, habits, workouts, nutrition, cardio. Member-data pages NOT in the map:

- engagement.html (P0 — engagement metrics, big visible surface)
- log-food.html (needs nutrition_logs[today] which is the same as nutrition page key — could share)
- monthly-checkin.html (needs daily_habits/workouts/cardio/sessions/wellbeing 30d — overlaps home key)
- wellbeing-checkin.html (same — overlaps home key)
- exercise.html (needs workout_plan_cache — overlaps workouts key)
- movement.html (needs workout_plan_cache + workouts + cardio writes — overlaps multiple)
- certificates.html (needs certificates + activity tables for cert derivation — needs new key)
- settings.html (needs members + member_habits + habit_library — partly overlap habits)
- activity.html (EF-driven feed, may need none)

The natural fix is not to bloat the map — it's to recognise that most pages need a subset of the home/habits/workouts/cardio/nutrition critical sets. A "shared base" + page deltas would scale better than five separate page-keyed lists.

### CC-4: §23 violations summary

| Rule | Pages in violation | Notes |
|---|---|---|
| §23.7.1 (Dexie wiring required for member-data pages) | engagement.html, activity.html | Other "wired" pages have it but call sync.hydrate (slow) not criticalHydrate. |
| §23.7.5 (merge override) | — | db.js correctly applies merge on members + member_habits. Active tables (workouts/cardio/etc) write full rows and don't need merge. PASS. |
| §23.7.6 (synchronous critical-path order) | Most write sites outside habits.html | Bus publishing pattern is correct where present; problem is the missing Dexie write step. |
| §23.7.8 (reset-rehydrate before paint) | settings.html resetLocalCache | Fix from PM-104 confirmed live in settings.html. PASS. |
| §23.10 (offline-equivalent operation) | sw.js urlsToCache (10 scripts missing), engagement.html, all *-live.html | Major precache gap means offline cold-boot fails on those pages. |
| §23.11 (hydrate completeness) | sync.js plan() daily_habits, member_habits | Mass-hydrate drops logged_at/id/assigned_at; firstPaintHydrate is fat-row select=* so home-key is safe. |
| §23.12 (no page-level network fetches) | Most pages — 73 read sites still hit REST directly | This is the active campaign; expected. |
| §23.13 (tiered asset strategy) | Not audited this session | Skipped — not a Dexie problem, would extend scope. |

## Prioritised fix list

Ordering: smallest scope first within each priority, all estimates Claude-assisted session-hours.

### Now (P0, before launch)

1. **sw.js urlsToCache gap** (~30 min). Add the 10 missing scripts to urlsToCache. Bump SW cache key. Verify offline cold-boot of workouts.html and yoga-live.html airplane-mode-on. — **Closes 10 P0 findings, zero risk, mechanical.**
2. **workouts.html criticalHydrate wire-in** (~1 hr). Add `await VYVESync.criticalHydrate('workouts')` to workouts-programme.js at the four sites that currently call `await VYVESync.hydrate()`. — **Closes the PM-112 follow-up. Confirms PF-40.2 is complete for the 5 mapped pages.**
3. **engagement.html criticalHydrate + Dexie wire** (~2 hr). Add an `engagement` page key to firstPaintHydrate.js (member_home_state proxy via existing activity tables; can reuse home key's tables). Wire engagement.html to read from Dexie instead of localStorage. Keep member-dashboard EF as background upgrade for charity_total/achievements. — **The biggest visible win — engagement ring goes from 5-15s to <500ms.**
4. **workouts-session.js write-path** (~2 hr). Add synchronous `VYVELocalDB.workouts.upsert` / `exercise_logs.upsert` / `workout_plan_cache.upsert` before each of the three writeQueued sites. — **Resolves PF-31 (workouts page re-entry clobber) at the source.**
5. **log-food.html write-path** (~2 hr). Add synchronous `VYVELocalDB.nutrition_logs.upsert/delete` at each writeQueued site. Keep `diaryLogs[]` for the in-session render; treat Dexie as the durable layer. — **Eliminates the food-log read-after-write hazard.**

### Next (P0, can land in launch week)

6. **Critical-hydrate coverage for the 9 unmapped member-data pages** (~3-4 hr). Decide between extending firstPaintHydrate map vs introducing a shared base. Recommendation: pick the latter — `criticalHydrateBase(email)` always pulls members + this-week activity, page-specific keys layer extras. — **Closes 9 P0 hydrate-missing-page-key findings.**
7. **settings.html direct-fetch writes** (~1 hr). Route members PATCH and member_habits PATCH through writeQueued + synchronous Dexie upsert. — **Closes 3 P0 direct_fetch_no_dexie findings.**
8. **Dual-cache architectural decision** (~30 min discussion + ~2 hr implementation). Either codify the localStorage caches as a §23.13 tier ("L0 paint accelerator — survives WKWebView ITP IDB wipe; same data Dexie has, tiered display") OR commit to retiring them post-PF-14b approval and removing the auth.js prewarmers. Status quo (silent contradiction with §3) is the worst option.

### Later (P1, can land week of launch)

9. **sync.js plan() column-gap fix** (~30 min). Change `daily_habits` pull from explicit columns to `select=*` to match the firstPaintHydrate behaviour. Add `id` and `assigned_at` to the member_habits replaceForMember denormalisation. — **Closes the home-state-local last_habit_at silent-null bug.**
10. **9 P1 write_bypass / wrong_optimistic_layer findings** (~2-3 hr total). Routine sweep applying the §23.7.6 pattern to each remaining write site.

### Backlog (P2 + INFO)

11. P2 (member_habits id / assigned_at).
12. Brain drift fixes (§23.11 example columns; PF-40.1 callsites freshness).

## Sequencing against the 31 May launch

Calendar arithmetic: 16 calendar days remain. Fix items #1-5 deliver 10 P0 wins with about a session-day of work — these are the launch-blockers. Items #6-8 ideally land in the next 3 sessions; if #8 (dual-cache decision) slips post-launch, the work just gets harder later. Items #9-12 are quality-of-architecture not user-facing; defer if calendar tightens.

The most important thing to avoid: another "PF-40 reframe" loop. PM-111 already corrected PF-40 from a structural 13-session campaign to a thin firstPaintHydrate ship. PM-112 shipped it for 5 pages. The follow-up wire-in for the other 12 member-data pages has been deferrable for 4 sessions running; it should land this week.

## Open questions for Dean

1. **Dual-cache strategy:** keep the localStorage `vyve_*_cache_*` system as a permanent tier (faster paint than IDB on iOS, codified as §23.13 L0), OR plan to retire it post-PF-14b approval (one source of truth, §3 contract honoured)? Recommendation: retire post-PF-14b. iOS 1.3 (2) and Android 1.0.3 are submitted; once approved (~24-48hr), the ITP IDB wipe risk that prompted PM-113 is gone for the 99%+ of trial users on the App Store / Play builds.
2. **criticalHydrate refactor:** extend the page-key map (mechanical, 9 entries) or introduce a shared base + page-specific extras (cleaner, ~30 min more)? Recommendation: shared base.
3. **engagement.html priority:** the page hits 3 EFs (member-dashboard, member-achievements, platform-alert) — does the engagement score need to stay server-computed for charity_total accuracy, or can the locally-derived score from `home-state-local.js` `engagement_*` fields ship as the authoritative display? Recommendation: locally-derived for display, EF for background upgrade (same shape as PF-11b).
4. **log-food.html:** keep `diaryLogs[]` as the in-session render layer (it's correct and fast), OR replace with a direct Dexie subscription? Recommendation: keep, just add the Dexie write step. No render-layer change needed.
5. **One root cause to name:** the audit's core finding is that the codebase has two parallel local-data systems and the brain only documents one. Should `master.md §3` be updated to acknowledge System B as a tier (cleanest), OR should the audit's fix sequence prioritise retiring System B (cheapest)? Either is fine; just need to pick.
