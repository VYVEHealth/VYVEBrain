# Premium Feel Campaign — Local-First Migration

> **Status:** ACTIVE. Launched 13 May 2026 PM-77. Target launch 31 May 2026.
> **Architectural commitment:** see `brain/active.md` §3 (IMMUTABLE).
> **Operating mode:** see `brain/active.md` §0.

---

## What we're building

VYVE migrates from a server-first architecture (every page fetches data from Supabase Edge Functions) to a local-first architecture (every page reads from on-device Dexie/IndexedDB; Supabase is the background sync target).

After this campaign:
- Every tap reads from local DB in ~1ms instead of waiting on a 300-7000ms EF call.
- Members never see "loading" states for their own data after first login.
- The app works fully offline; writes queue and sync when the network returns.
- Cross-device sync still works via Supabase Realtime (single-device-per-user is the working assumption, but multi-device is supported).
- The feel target: indistinguishable from native apps like Apple Notes, Things 3, or Linear.

---

## The migration shape (high level)

**Local DB:** Dexie wrapping IndexedDB.
- Tables mirroring relevant Supabase tables: members, member_habits, daily_habits, workouts, exercise_logs, custom_workouts, cardio, nutrition_logs, weight_logs, session_views, replay_views, wellbeing_checkins, monthly_checkins, weekly_goals, achievements, certificates.
- Plus a `_sync_queue` table for outbound writes that haven't reached Supabase yet.
- Plus a `_sync_meta` table for tracking last-pulled timestamps per table.

**Sync layer:** custom JavaScript module (`/sync.js` in vyve-site), no third-party service.
- On login: pull all member-scoped data from Supabase via existing EF or direct PostgREST. Hydrate Dexie. Mark `_sync_meta` timestamps.
- On every local write: insert row into Dexie + insert entry into `_sync_queue`. The queue drains in the background via the existing `vyve-offline.js` outbox infrastructure, repointed to write directly to Supabase tables (or via existing EFs where they do useful work like generate AI recommendations).
- On Supabase Realtime events: merge the incoming change into Dexie, publish a bus event so any open pages re-render.

**Page refactor:** every member-data-rendering page swaps `fetch from EF` for `query Dexie`.

**What stays on the server:**
- AI persona/plan/recommendation generation (Anthropic API calls)
- Cron-driven achievements + certificates
- Leaderboards (cross-member data)
- Employer aggregate reporting
- Workout/habit/food library catalogues (read-on-demand, cached locally on use)

**What gets removed eventually (post-launch cleanup):**
- `vyve_home_v3_<email>` localStorage cache (Dexie replaces it)
- `vyve_habits_cache_v2` (Dexie replaces it)
- `vyve_programme_cache_<email>` (Dexie replaces it)
- `vyve_wt_cache_<email>` (Dexie replaces it)
- `vyve_food_diary_<email>:<date>` (Dexie replaces it)
- `member_home_state` table dependence (Dexie computes the dashboard fields client-side)
- The PWA install prompt code in index.html (legacy, not relevant to Capacitor)

---

## Task backlog

Each task is self-contained. A fresh Claude can pick up any task by reading this playbook + active.md, and ship it in one session. Tasks are sequenced: do them in order unless explicitly marked parallel.

Format: `PF-N — Title`
- **What:** plain-English description
- **Files touched:** what gets created or modified
- **Verification:** how to know it worked
- **Needs Dean:** what (if anything) requires Dean's presence
- **Estimated length:** rough session-window
- **Status:** QUEUED / IN PROGRESS / SHIPPED / BLOCKED

### PF-1 — Dexie spike: daily_habits end-to-end + Capacitor origin verification

- **What:** Prove the architecture works. Install Dexie on a feature branch, create a minimal schema with one table (daily_habits + member_habits). Wire habits.html to read habits from Dexie and write completions to Dexie. On write, queue to Supabase via existing log-activity EF. On home.html, read the "today's habits" pill count from Dexie. Test the flow end-to-end: tap a habit on habits.html, see the pill update instantly on home.html.
- **Additionally (PM-77.1):** verify which Capacitor origin pattern the iOS 1.1 build uses. Check `capacitor.config.ts` and the running app's `window.location.origin`. If it's `capacitor://localhost` (local-bundle pattern), IndexedDB is ITP-exempt and we're good. If it's `https://online.vyvehealth.co.uk` (remote-origin pattern), the app **may** be subject to Apple's 7-day ITP wipe and we need to plan a migration to local-bundle as part of PF-2 or earlier. Document the finding in the PF-1 ship changelog. Lock the scheme explicitly in `capacitor.config.ts` either way.
- **Files touched:** new `/sync.js` (sync layer scaffolding, only daily_habits + member_habits scope), new `/db.js` (Dexie schema declaration), `habits.html` (swap reads/writes to Dexie), `index.html` (pill reads from Dexie), `sw.js` cache bump. Feature branch `local-first-spike` off main, not main. Also check `~/Projects/vyve-capacitor/capacitor.config.ts` for origin pattern.
- **Verification:** node --check on new JS files. Manual: log in to the deployed feature branch, tap a habit, see instant tick, navigate to home, see pill count incremented without any network round trip. Check Supabase that the row also landed there (background sync). Also document: current Capacitor origin pattern (local-bundle vs remote-origin).
- **Needs Dean:** session 1 timing. Dean opens the feature-branch URL and verifies the flow visually. If the flow works, decision is made to continue with Dexie. If it doesn't, decision is made to pivot to localStorage-with-aggressive-caching (Option A from the 13 May design conversation). Dean also needs to confirm `capacitor.config.ts` contents on his Mac since the repo is NOT in git.
- **Estimated length:** one 3-6 hour evening session (+30 min for origin verification).
- **Status:** SHIPPED 13 May 2026 PM-78 to `local-first-spike` (`8d07d26b`). Awaiting Dean merge to main + verification.
- **Ship notes:**
  - New `/db.js` (10KB) wraps Dexie v4.0.10 (loaded from cdn.jsdelivr.net, CSP-allowed). Schema scoped to `daily_habits` + `member_habits` + `_sync_meta` for PF-1.
  - New `/sync.js` (8KB) hydrates these two tables on login, scaffolds the visibilitychange listener (active inert beyond hydrate top-up — PF-5 replaces with proper since-cursor).
  - `habits.html` patched at 3 write sites (`logHabit`/`undoHabit`/`runAutotickPass`): Dexie write/delete added additively after existing Supabase write. The Supabase write path is untouched — Dexie is a parallel store in PF-1.
  - `index.html` patched: Dexie-derived pill-strip overlay added after `renderDailyCheckinStrip` call. Any `habit_completed=true` row for today in Dexie re-paints the pill filled, independent of dashboard EF latency.
  - `sw.js` cache key bumped to `pm78-pf3-hydrate-a` (after PF-3 superseded it from `pm78-pf1-spike-a`). `/db.js` + `/sync.js` precached.
  - Spike-gated: inert unless `localStorage.vyve_lf_spike === '1'`. Codified as §4 working-set rule in active.md.
  - **Deploy constraint discovered:** vyve-site GitHub Pages deploys from `main` only (`.github/workflows/static.yml`), no preview-branch tooling. Resolution: ship onto main behind the spike flag; the `local-first-spike` branch tracks main + the additive flag-gated files for atomic-revert purposes.
- **Capacitor origin verification:** OUTSTANDING. Blocked on Dean reading `~/Projects/vyve-capacitor/capacitor.config.ts` (the Capacitor repo is not in git per active.md §6). PM-77.1 §3.1 mitigation B remains open. PF-2/3 ship did not affect this — same blocker.

### PF-2 — Dexie schema for all member-scoped tables

- **What:** Define the full Dexie schema covering every member-data table we need locally. members, member_habits, daily_habits, workouts, exercise_logs, custom_workouts, cardio, nutrition_logs, weight_logs, session_views, replay_views, wellbeing_checkins, monthly_checkins, weekly_goals, achievements (subset), certificates (metadata only). Plus `_sync_queue` and `_sync_meta` infrastructure tables.
- **Files touched:** `/db.js` (schema declarations with proper indexes for the queries we'll run). Likely also `/sync.js` (extend to handle the new tables).
- **Verification:** node --check. Open the deployed feature branch in browser dev tools → Application → IndexedDB → confirm all tables exist with correct indexes.
- **Needs Dean:** nothing actively. Self-contained build task.
- **Estimated length:** 1-2 hours, can run in a commute/lunch window.
- **Status:** SHIPPED 13 May 2026 PM-78 to `local-first-spike` (`e8f02742`).
- **Ship notes:**
  - `/db.js` extended from v1 schema (3 tables) to v2 schema (~27 tables + infrastructure). Dexie's `version()` chain handles the migration additively — existing PF-1 testers upgrade in place without losing `daily_habits` / `member_habits` state.
  - Member-scoped tables: `daily_habits`, `member_habits`, `workouts`, `exercise_logs`, `custom_workouts`, `exercise_swaps`, `workout_plan_cache`, `cardio`, `nutrition_logs`, `nutrition_my_foods`, `weight_logs`, `session_views`, `replay_views`, `wellbeing_checkins`, `monthly_checkins`, `weekly_goals`, `certificates`, `member_achievements`, `members`.
  - Catalogue tables (public-read): `habit_library`, `habit_themes`, `workout_plans`, `personas`, `service_catalogue`, `nutrition_common_foods`, `achievement_metrics`, `achievement_tiers`.
  - Infrastructure: `_sync_queue` (PF-4 will drain), `_sync_meta`, `_kv`.
  - Index design biased to the hot-path queries each page actually runs (`[member_email+activity_date]` on every activity table, `[member_email+active]` on `member_habits`, weight_logs keyed by `[member_email+logged_date]` matching the table's one-per-day constraint).
  - Public API: generic CRUD on every table (`upsert`, `bulkUpsert`, `delete`, `allFor`, `replaceForMember`) + PF-1 specialised accessors preserved verbatim + `_sync_queue.{enqueue,peek,complete,fail,bumpAttempt}` ready for PF-4.
  - `members.upsert` overrides the generic `touched_at` stamp because the table schema has no such column.

### PF-3 — Sync engine: pull-on-login

- **What:** Build the initial hydration logic. On login, after `vyveAuthReady` fires, pull all member-scoped data from Supabase into Dexie. Use the existing member-dashboard EF for the bulk of it (it already returns most of the data the member needs); supplement with PostgREST direct queries for tables not in the dashboard payload. Mark `_sync_meta.last_pulled_at` per table. Idempotent so it can re-run safely.
- **Files touched:** `/sync.js` (hydration function), `/db.js` (if any schema tweaks emerge), `auth.js` (call sync.hydrate() after `vyveSignalAuthReady`).
- **Verification:** Fresh login on feature branch, dev tools → IndexedDB → confirm every table populated with member's actual data. Compare row counts to what the EF returned.
- **Needs Dean:** nothing actively.
- **Estimated length:** 2-3 hours.
- **Status:** SHIPPED 13 May 2026 PM-78 to `local-first-spike` (`e8f02742`).
- **Ship notes:**
  - `/sync.js` extended from v1 (2 tables) to v2 (~27 tables). Bounded concurrency (4 — PostgREST connection-pool friendly).
  - Pre-flight RLS audit via `pg_policy`: every member-scoped table has `member_email = (SELECT auth.email())` policy with the PM-8 `(SELECT …)` wrap. Hydrate succeeds under the member's JWT. `member_achievements` uses `lower(member_email)` comparison — functionally equivalent at our normalised email layer.
  - Per-table failure isolation: one bad pull doesn't abort the hydrate. Failed tables get retried on next visibility-foreground.
  - Pull windows: 365 days for activity tables, 180 days for `weekly_goals`, 1000-row cap for `weight_logs`, full set for low-volume tables (workout_plan_cache, custom_workouts, exercise_swaps, certificates, members, etc.).
  - Catalogue tables hydrate with a 24h stale-policy via `_sync_meta.last_pulled_at` — fresh members get them on first login, returning members within 24h skip those calls entirely.
  - Events fired: `vyve-localdb-hydrated` (one-shot), `vyve-localdb-table-pulled` (per table), `vyve-localdb-table-failed` (per table).
  - `VYVESync.status()` returns introspection for DevTools: hydrated tables, failed tables with error details, last hydrate ms.
  - JWT read pattern preserved from PF-1: localStorage.vyve_auth direct, 30s clock-skew buffer, no `getSession()` SDK side-effects (§23.5.3 / PM-67e).
- **What PF-3 does NOT add:** push-on-write through `_sync_queue` (PF-4), Realtime merge subscriptions (PF-5), proper since-cursor delta-pull (PF-5).

### PF-4 — Sync engine: push-on-write + queue drain

- **What:** Build the outbound sync. Every local write inserts into `_sync_queue`. A drain loop runs every few seconds (or immediately when online), takes queued items, sends them to Supabase via the existing log-activity / wellbeing-checkin / monthly-checkin EFs (or direct PostgREST for tables without dedicated EFs). On success, deletes the queue entry. On 4xx error, dead-letters. On 5xx/network error, retries with exponential backoff.
- **Files touched:** `/sync.js` (drain loop + retry logic). Likely repoints or replaces parts of `vyve-offline.js` outbox.
- **Verification:** Toggle airplane mode mid-write. Confirm write lands in Dexie + `_sync_queue`. Re-enable network. Confirm queue drains within seconds. Confirm row appears in Supabase.
- **Needs Dean:** nothing actively for build. End-of-task: Dean verifies airplane-mode behaviour on his device.
- **Estimated length:** 3-4 hours.
- **Status:** SHIPPED 13 May 2026 PM-79 to `local-first-spike` (`903127d6`). Cautious posture: shadow Dexie queue runs alongside the legacy localStorage outbox; both drainers POST to Supabase, server idempotency on `(member_email, client_id)` unique index makes duplicate writes safe.
- **Ship notes:**
  - Pre-flight audit (`pg_index`) confirmed every relevant table has the `(member_email, client_id)` unique constraint. Shadow-drain via both paths is safe — second arrival 409s, both drainers treat that as success.
  - Architecture: monkey-patches `window.VYVEData.writeQueued`. Patched version calls the original and then mirrors the queue item into Dexie `_sync_queue`. **Zero callsite changes** — every existing caller (habits.html, cardio.html, etc.) gets shadowed automatically.
  - Independent Dexie drainer: 25s interval (offset from legacy 30s), exponential backoff 2s→5min, max 3 server attempts, dead-letter via `vyve-syncqueue-dead` CustomEvent (separate from legacy `vyve-outbox-dead` so Layer 4 subscribers don't double-fire).
  - Honours full Layer 4 (PM-58..PM-66) semantics: 2xx complete; DELETE 404 idempotent success; 409 success-by-other-drainer; 4xx dead with reason `http_4xx`; 5xx bumpAttempt + backoff; network failure no-attempt-bump.
  - `db.js` defensive fix: `raw()` now always calls `getDB()` (was returning `null` if dbPromise was uninitialised — small but real correctness bug).
  - `VYVESync.queueStatus()` / `drainOutbound()` / `resetOutboundQueue()` exposed for DevTools introspection. No-op shim when spike off.
- **What PF-4 does NOT do** (deferred until PF-19 cleanup): remove the legacy `vyve-offline.js` outbox path. PF-4 is purely additive; the legacy drainer is still the canonical path.

### PF-5 — Sync engine: Realtime merge + reconnect-replay (belt-and-braces against iOS background WebSocket drops)

- **What:** Wire Supabase Realtime subscriptions to merge incoming events into Dexie. When another device writes a row, Realtime delivers it, we insert/update in Dexie, publish the appropriate bus event so any open page re-renders. Suppress own-echo using the existing `recordWrite` infrastructure from Layer 2.
- **Critical (PM-77.1):** Realtime alone is insufficient on mobile because iOS suspends WebSockets when the app is backgrounded; events delivered during the background window are missed and the Supabase JS client does not auto-replay them on reconnect. **The sync layer must run a delta-pull on every `visibilitychange` returning to visible**, regardless of whether Realtime claims it stayed connected. Pattern: `if(document.visibilityState==='visible') { runDeltaPull() }` — pulls `?updated_at=gt.${last_sync_at}` per table, merges into Dexie, updates `last_sync_at`. This is the Layer 3 (PM-57) pattern carried forward into the new sync engine. The delta-pull is cheap (one query per table, only rows changed since last sync) so safe to run on every foreground.
- **Files touched:** `/sync.js` (Realtime subscriber setup + visibility listener + delta-pull function). Likely repoints or replaces parts of `bus.js`'s `installTableBridges` from Layer 2.
- **Verification:** Open the app on two browsers (same account). Add a habit on one. Confirm it appears on the other within a few seconds. **Also verify (mobile only — PF-14):** open app on iPhone, background it for 30+ seconds while logging a habit on the web (forces the iPhone to miss the Realtime event), foreground iPhone, confirm the habit appears within 1-2s of foreground via the delta-pull.
- **Needs Dean:** verification step at end. Mobile verification in PF-14.
- **Estimated length:** 2-3 hours.
- **Status:** PARTIAL — delta-pull SHIPPED 13 May 2026 PM-79 to `local-first-spike` (`fa116ef2`). **Realtime cross-device merge DEFERRED to PF-5b / post-launch** per active.md §0 single-device-per-user assumption.
- **Ship notes (delta-pull only):**
  - Replaces the PF-1 stub `runDeltaPull` with a real per-table since-cursor implementation. Foreground delta is the §3.1 mitigation C belt-and-braces channel for iOS WKWebView (which suspends Realtime websockets when backgrounded — Realtime is optimisation, delta-pull is correctness).
  - Per-table cursor configuration: `logged_at` for activity tables (daily_habits, workouts, cardio, exercise_logs, session_views, replay_views, nutrition_logs, weight_logs, wellbeing_checkins, monthly_checkins); `created_at` for weekly_goals (immutable single-insert-per-week); no cursor for member_habits/members/workout_plan_cache/custom_workouts/exercise_swaps/nutrition_my_foods/certificates/member_achievements — these get a full re-pull throttled by `DELTA_FULL_REPULL_MS=5min`; catalogue tables keep their 24h stale-policy unchanged.
  - Algorithm: defer to hydrate if not yet started; await hydrate to settle; for each plan() entry in parallel (concurrency 4), GET `?<col>=gt.<since_iso>`; bulkUpsert (NOT replaceForMember — delta is purely additive); update `_sync_meta.last_pulled_at` to `max(returned row timestamps)` || `now`. Per-table failure isolation preserved.
  - Events fired: `vyve-localdb-table-delta { table, count, since }` per successful delta; `vyve-localdb-table-failed` on failure (same as hydrate).
  - PostgREST `gt.` is strict greater-than. Cursor stamping to `now` is safe — won't re-fetch rows just-written (their timestamps are ≤ now), but prefers `max(row.logged_at)` when available so the cursor matches real server data.
- **Why Realtime is deferred:** Layer 2 (`installTableBridges` in `bus.js`) already runs Realtime subscriptions and translates row events into bus events. PF-5 doesn't disturb that — habits.html's optimistic-revert path and similar still work. The missing piece is *merging incoming Realtime rows into Dexie*, which requires extending the bridge or running parallel subscriptions to get full rows. With single-device assumption + foreground delta-pull as backstop, the cross-device-instant case isn't a launch blocker. **PF-5b post-launch:** subscribe to filtered Realtime channels (one per table, filter `member_email=eq.{email}`) and merge full rows into Dexie inside the existing bridge handler.
- **Mobile verification deferred to PF-14:** the 30s-background → foreground delta-pull test described in the original PF-5 verification spec moves to PF-14 device-testing.

### PF-6 — Page refactor: habits.html

- **What:** Refactor habits.html to read entirely from Dexie. No more `fetch from EF`. Writes (log/undo habit) go through the sync layer. Streak/today's count/week strip all computed from local data on every render.
- **Files touched:** `habits.html`. Possibly `/sync.js` tweaks if specific query patterns emerge. SW cache bump.
- **Verification:** habits.html opens with zero network activity. Tap habits, see instant ticks. Reload page, see persisted state. Compare against Supabase to confirm writes synced.
- **Needs Dean:** verification at end of task.
- **Estimated length:** 2 hours.
- **Status:** SHIPPED 13 May 2026 PM-79.3 to `local-first-spike` (commit `48c4d17e`). Build chat shipped during a parallel session.
- **Ship notes:**
  - Three Supabase read sites replaced with Dexie (`member_habits` join, `daily_habits` today, `daily_habits` 365-day dates) → Dexie `allFor` / `todayFor` / `allDatesFor`.
  - Three-way branch pattern: Dexie path taken only when `isEnabled()` AND non-empty rows. Empty (shim / failed-hydrate / genuinely-empty member) falls through to Supabase. Spike-off path unchanged. Same pattern used for PF-7.
  - Autotick HealthKit metadata (`fetchDashboardHabits`) stays on the wire on both paths — live evaluator output, not persistable, non-blocking.
  - Downstream render code untouched: Dexie rows are reshaped back into the existing `supa()` join projection that `map()` expects. No cascading refactor.
  - Cache key bumped `pm78-pf5-delta-a` → `pm78-pf6-habits-a`. Files changed: `habits.html`, `sw.js` (2 files).

### PF-7 — Page refactor: workouts.html + workouts-session.js + workouts-programme.js

- **What:** Same pattern. Read 8-week programme from Dexie. Read past sessions from Dexie. Read PRs from Dexie. Logging sets writes through to Dexie + queue. The workout library (catalogue) stays on Supabase but specific workouts cache to Dexie on first access.
- **Thumbnail prefetch (PM-77.3 note):** During hydration of the member's assigned 8-week programme, pre-fetch all thumbnail images for the workouts referenced in that programme. Pattern: extract thumbnail URLs from the programme's workout references, fire parallel `fetch()` calls so the service worker caches them. Apply the same pattern to persona avatars (NOVA, RIVER, SPARK, SAGE, HAVEN) at app start and to session-type icons. Use stable content-addressed filenames (e.g., `workout-thumb-{workout_id}-v1.jpg`) so cache invalidation is automatic when content actually changes. Add `Cache-Control: public, max-age=31536000, immutable` headers on image responses from Supabase Storage if not already set. ~30 minutes of additional work on top of PF-7's core scope. Big perceived-speed win because thumbnails are the first thing the eye registers on every list view.
- **Files touched:** `workouts.html`, `workouts-session.js`, `workouts-programme.js`, `workouts-builder.js`, `workouts-config.js`. SW cache bump.
- **Verification:** Open workouts tab cold. Should paint instantly with programme + past sessions. Log a few sets in a session — instant. Reload, confirm persisted.
- **Needs Dean:** verification at end.
- **Estimated length:** 3 hours.
- **Status:** SHIPPED 13 May 2026 PM-79.3 to `local-first-spike` (commit `97863198`). Build chat shipped immediately after PF-6.
- **Ship notes:**
  - Four reads flipped in `workouts-programme.js` (`workout_plan_cache`, `workout_plans` catalogue, `exercise_logs`, `custom_workouts`) + one in `workouts-session.js` (`getTotalWorkoutCount`). Same non-empty-gate three-way branch as PF-6: Dexie-when-enabled-and-non-empty / Supabase fallthrough.
  - **PM-77.3 thumbnail prefetch IN SCOPE.** On the spike-on path after programme load, parallel-fire `{mode:'no-cors'}` fetch() for every distinct thumbnail URL in the active programme. Service worker caches them; first paint on workout cards is instant on subsequent visits. Fire-and-forget, swallows errors, never blocks render.
  - **Writes already covered by PF-4 shadow drainer** — no write-path changes in PF-7. The shadow Dexie outbound queue from PF-4 already mirrors `programme.js` `PATCH workout_plan_cache`, `session.js` `POST workouts` + `POST exercise_logs`, and `builder.js` `custom_workouts` CRUD via the `VYVEData.writeQueued` monkey-patch. Clean separation: PF-4 owns writes, PF-7 owns reads.
  - **Server-compute carve-out (PM-80 principle):** `share-workout` EF stays on the wire on both paths. Generates server-side codes, not persistable. Documented in the commit message as a principle worth promoting — server-compute that produces non-persistable artefacts (codes, AI generations, signed URLs) must stay on the wire even on the local-first path. Will be codified into a §23 hard rule in active.md when the next page refactor confirms the pattern holds (likely PF-10 wellbeing-checkin AI moment).
  - `workouts.html` adds `/db.js` + `/sync.js` to the deferred script chain right after `vyve-home-state.js`. Matches PF-1 ordering on habits.html.
  - Cache key bumped `pm78-pf6-habits-a` → `pm78-pf7-workouts-a`. Files changed: `sw.js`, `workouts-programme.js`, `workouts-session.js`, `workouts.html` (4 files).

### PF-8 — Page refactor: nutrition.html + log-food.html

- **What:** Read TDEE, weight log, water log, today's macros from Dexie. Writes (log food, log weight, log water) go through sync layer. Food search continues to hit Open Food Facts via off-proxy (that's the external API, can't be local). My-foods (member's saved foods) cached locally.
- **Files touched:** `nutrition.html`, `log-food.html`. SW cache bump.
- **Verification:** Open nutrition tab cold. Should paint instantly. Log a food item — instant. Reload, persisted.
- **Needs Dean:** verification.
- **Estimated length:** 2-3 hours.
- **Status:** QUEUED

### PF-9 — Page refactor: cardio.html + movement.html

- **What:** Read cardio history from Dexie. Writes through sync. Quick-add path on movement.html same pattern.
- **Files touched:** `cardio.html`, `movement.html`. SW cache bump.
- **Verification:** Cardio tab opens instantly. Log a session — instant. Reload, persisted.
- **Needs Dean:** verification.
- **Estimated length:** 1-2 hours.
- **Status:** QUEUED

### PF-10 — Page refactor: weekly-checkin + monthly-checkin

- **What:** The activity summary on these pages (habits/workouts/cardio/sessions counts for the period) now computed from local Dexie data on render. Submit still goes through the wellbeing-checkin EF / monthly-checkin EF because those EFs run AI to generate recommendations — that AI moment is the deliberate "AI is thinking" wait. Submit response gets stored in Dexie. Subsequent views read from Dexie instantly.
- **Files touched:** `wellbeing-checkin.html`, `monthly-checkin.html`. SW cache bump.
- **Verification:** Open weekly check-in tab. Activity summary populated instantly (no fetch wait). Submit the check-in — see deliberate "generating recommendations" state with proper framing. Recommendations land. Reload, persisted.
- **Needs Dean:** verification.
- **Estimated length:** 2 hours.
- **Status:** QUEUED

### PF-11 — Page refactor: index.html (home dashboard)

- **What:** The big one. Home reads everything from Dexie. Engagement score computed client-side. Streak from local. Today's habits pill from local. Weekly goals from local. Progress tracks from local. The collective charity total still pulls from Supabase periodically (it's cross-member data) but caches locally and renders from cache.
- **Files touched:** `index.html`. SW cache bump.
- **Verification:** Open home tab cold. Should paint within ~100ms with all real numbers. Tap into Habits, complete one, return to home — pill should be incremented without any visible fetch.
- **Needs Dean:** verification — this is the most visible win, worth demoing properly.
- **Estimated length:** 3 hours.
- **Status:** QUEUED

### PF-12 — Page refactor: settings.html + remaining surfaces

- **What:** Settings reads/writes through Dexie (profile, persona, theme, notification prefs). Certificates page reads earned-certificates list from Dexie. Engagement page reads everything from Dexie.
- **Files touched:** `settings.html`, `certificates.html`, `engagement.html`. SW cache bump.
- **Verification:** Each page opens instantly. Settings changes persist locally + sync.
- **Needs Dean:** verification.
- **Estimated length:** 2 hours.
- **Status:** QUEUED

### PF-13 — First-login hydration polish

- **What:** Build a proper "preparing your VYVE" screen for the one-time first-login hydration. On-brand, warm, not "loading...". Shows during the few-second window where Dexie hydrates from Supabase. Since all data is wiped at launch (per active.md §0), every member sees this once and never again.
- **Files touched:** new `/onboarding-hydration.html` or modal injection on index.html. Coordinate with the onboarding EF flow.
- **Verification:** Sign up as a fresh test member, complete onboarding, land in app, see polished hydration screen for 1-3 seconds, then app is fully populated.
- **Needs Dean:** Lewis copy approval for the screen text.
- **Estimated length:** 2 hours.
- **Status:** QUEUED — BLOCKED on Lewis copy.

### PF-14 — Capacitor device verification

- **What:** Build and install the Capacitor app from the local-first branch to Dean's iPhone AND Android device. Run through every member-facing flow on both real devices. Verify Dexie behaviour inside WKWebView (iOS) and Android WebView (Chrome WebView): storage isolated from browser, persists across app restarts, survives backgrounding. Check airplane-mode behaviour, queue drain on reconnect.
- **Two-device cross-sync test (new scope per PM-79.4):** With both devices logged in to the same account, log a habit on Android while iPhone is backgrounded for 60+ seconds. Foreground iPhone. The habit must appear within 1-2s via the PF-5 visibility-change delta-pull. This is the test that proves the delta-pull belt-and-braces (PM-77.1 §3.1 mitigation C) actually works end-to-end. Cannot be verified on a single device.
- **Capacitor config check (new scope per PM-79.4):** Read out `~/Projects/vyve-capacitor/capacitor.config.ts` `ios.*` AND `android.*` blocks. Document the iOS origin pattern (PM-77.1 §3.1 mitigation B — `capacitor://localhost` vs remote-origin; ITP exemption hinges on this). Document the Android scheme + hostname (`https://localhost` or custom). Lock both schemes explicitly in `capacitor.config.ts` so future Capacitor major-version upgrades can't silently change the scheme and wipe member IndexedDB.
- **Temporary Dexie source indicator (new scope per PM-79.4):** Before walking flows, build a spike-gated visual indicator: small dot in the top corner of every page. Green = read came from Dexie. Amber = Supabase fallthrough fired (Dexie empty / shim active / hydrate failed for this table). Red = fully offline. Three states, zero ambiguity. Used during PF-14 verification on both devices, carries through PF-15 as a debugging aid. PF-19 cleanup strips it before merge to main. ~30 min build. Works identically on iOS and Android since it's pure CSS/JS.
- **Files touched:** none — this is a verification task, not a code change.
- **Verification:** Real-device usage of every flow. Look for jank, missing data, anything that doesn't feel native.
- **Needs Dean:** Dean must physically install on BOTH iPhone and Android device and use them side-by-side for the cross-sync test. Whole task is Dean's hands-on test plus Claude triage of anything that surfaces. Also: Dean reads out `capacitor.config.ts` on the Mac since the Capacitor repo is not in git.
- **Estimated length:** ~30 min Claude build for the Dexie source indicator. Then 2-3 hours of Dean using the app on both devices + however long fixes take.
- **Status:** QUEUED

### PF-15 — Hardening + edge cases (Sunday session)

- **What:** Address everything that surfaced during PF-14 verification. Plus the three iOS mitigations from PM-77.1 research dive (some may be done earlier; this is the catch-all):
  1. **WKWebView crash-wipe protection.** Force-flush Dexie on `visibilitychange` to hidden. Pattern: ensure all open transactions resolve OR explicitly close/reopen the DB. Listen for `UnknownError: Connection to Indexed Database server lost` and trigger re-hydration from Supabase. Detect empty-DB-on-open after a previously-populated state (sign of crash-wipe) and re-hydrate gracefully.
  2. **Capacitor scheme lock.** Set the WebView scheme explicitly in `capacitor.config.ts` (likely `capacitor://localhost` for ITP exemption per PF-1 finding) and document that it MUST NOT change between releases. Add a brain hard rule that future Capacitor major-version upgrades require a migration plan because past upgrades have wiped user IndexedDB stores when the scheme silently changed.
  3. **Queue drain with batching + backoff.** When a member reconnects after long offline period (hours+), the `_sync_queue` could have hundreds of writes. Batch in groups of 20-50, with exponential backoff if Supabase responds with 429 or 5xx. Persist the queue to Dexie (not localStorage) so it survives app restart.
- **Plus standard hardening:** storage-quota handling (what happens if Dexie hits a limit, how to recover), corrupt-DB recovery (if IndexedDB gets into a bad state, force-resync from Supabase), schema migration scaffolding (so future schema changes can be applied to existing local DBs without losing data), offline-online edge cases. Add a hidden "Force full resync" button to settings as the escape hatch — if anything goes wrong with sync state on a member's device, they (or Dean for support) can trigger a full Dexie wipe + re-hydration without needing a code release.
- **Files touched:** TBD based on what PF-14 surfaces. Likely `/sync.js` extensions, `/db.js` migration logic, `capacitor.config.ts` scheme lock, `settings.html` for the force-resync button.
- **Verification:** Stress-test scenarios — fill the local DB, corrupt a row deliberately, schema-change mid-session, force-kill the app mid-write, background for 10+ minutes with a Supabase write happening, etc.
- **Needs Dean:** verification on real device. `capacitor.config.ts` confirmation since the Capacitor project is not in git.
- **Estimated length:** 4-6 hours.
- **Status:** QUEUED

### PF-16 — Skeleton screens + empty state polish

- **What:** Replace the "unidentified habits" garbage state on habits.html (and any similar across the app) with proper skeleton screens that match the final layout. Polish the genuinely-empty states (first time member opens a page with no data) to feel intentional.
- **Files touched:** various HTMLs + CSS.
- **Verification:** Visual review across the app. No "loading…" garbage anywhere.
- **Needs Dean:** Lewis copy approval where appropriate.
- **Estimated length:** 2-3 hours.
- **Status:** QUEUED

### PF-17 — Haptic feedback

- **What:** Wire Capacitor's Haptics plugin to all member-facing writing surfaces. Light tap on habit complete. Success haptic on workout session complete. Subtle feedback on every meaningful action. iOS only initially (Android haptics via the same plugin but quality varies by device).
- **Files touched:** various HTMLs that have writing surfaces. New `/haptics.js` helper module.
- **Verification:** Real iPhone usage. Every action should feel physically responsive.
- **Needs Dean:** device testing.
- **Estimated length:** 1-2 hours.
- **Status:** QUEUED

### PF-18 — Error handling polish

- **What:** Replace red alert boxes with warm, helpful error states. "Hmm, we couldn't reach the server. We've saved your changes and will sync when you're back online." Coordinate with the sync layer's failure paths.
- **Files touched:** various.
- **Verification:** Trigger failures (block fetch in dev tools), confirm errors feel handled not broken.
- **Needs Dean:** copy approval.
- **Estimated length:** 1-2 hours.
- **Status:** QUEUED

### PF-19 — Pre-launch cleanup commit

- **What:** Remove legacy code: localStorage caches (vyve_home_v3, vyve_habits_cache_v2, etc.) that Dexie has superseded. Remove the PWA install prompt code in index.html. Remove the legacy event-bus subscribers that Layer 4 added but are no longer needed (the bus stays as a notification system, but several specific subscribers become redundant). Update master.md sections that reference the old architecture.
- **Files touched:** various. Probably a big-ish commit.
- **Verification:** Full regression test of every flow.
- **Needs Dean:** verification, plus go/no-go before merging into main.
- **Estimated length:** 2-3 hours.
- **Status:** QUEUED

### PF-20 — Merge local-first branch into main

- **What:** The big switch. Merge `local-first-spike` (or whatever the branch is called by then) into main. Coordinated SW cache bump. Production goes live with local-first.
- **Files touched:** none in this task — it's the merge itself.
- **Verification:** Production smoke test on Dean's device, immediate post-merge.
- **Needs Dean:** present at merge moment, ready to roll back if anything looks wrong.
- **Estimated length:** 30 minutes.
- **Status:** QUEUED — blocks on all PF-1 through PF-19.

---

### PF-21 — Bottom nav restructure: Mind / Body / Connect

- **What:** Replace the current bottom nav (Home / Workouts / Nutrition / Sessions / More) with the new three-tab structure: Mind / Body / Connect. Plus Home stays as the centre/default and More remains as overflow. Regroup existing pages under the new tabs — no page rebuilds, pure navigation reorganisation. The hub pages (PF-22) build on top of this; this task is just the nav itself.
- **Page groupings:**
  - **Mind tab:** weekly check-in, monthly check-in, AI persona chat (existing personas), wellbeing content surfaces (placeholders for breathwork/meditations until V2 content lands)
  - **Body tab:** workouts, cardio, movement, nutrition, log-food, running-plan, apple-health, weight tracker
  - **Connect tab:** sessions (live + on-demand), leaderboard, charity impact view
  - **Home (centre):** existing dashboard, unchanged structurally
  - **More:** settings, certificates, engagement, anything not yet rehoused
- **Files touched:** `nav.js` (new tab structure, icons, active-state styling), every gated portal page (back-button + nav references update), `sw.js` cache bump.
- **Verification:** Tap each tab, confirm correct group of pages reachable. Back-button behaviour unchanged. No 404s. Active-tab styling reflects current location.
- **Needs Dean:** sign-off on the page-to-tab groupings before build. Lewis copy approval for the tab labels themselves (Mind / Body / Connect — confirm these are the final names, no variants like "Wellbeing" / "Train" / "Community").
- **Estimated length:** 2-4 hours. Mechanical work once groupings are locked.
- **Status:** QUEUED — pencilled in after PF-19 (cleanup) but before PF-20 (merge to main). Loosely scoped — can be expanded if Dean wants per-tab hub pages built pre-launch.

### PF-22 — Hub landing pages (optional, scope-flexible)

- **What:** Build a landing page for each of Mind / Body / Connect that surfaces the most useful content from each grouping at a glance. NOT new functionality — just better presentation of existing data.
  - **Mind hub:** today's check-in status, current AI persona + quick-chat shortcut, recent wellbeing score trend, placeholder cards for breathwork/meditations (V2)
  - **Body hub:** today's workout + complete/skip, today's macros vs target, recent cardio, latest weight log, Apple Health summary
  - **Connect hub:** live now / up next session card, leaderboard position summary, charity impact strip, community moments placeholder (V2)
- **Files touched:** new `mind.html`, `body.html`, `connect.html`. Each reads from Dexie (no new EFs). `nav.js` to route the tab to the hub page rather than directly to a sub-page.
- **Verification:** Each hub paints instantly from Dexie (~50-100ms). Tap-through to sub-pages works. Empty states polished.
- **Needs Dean:** Lewis copy/layout approval per hub. Possibly a quick mockup pass first.
- **Estimated length:** 4-8 hours per hub depending on scope. 12-24 hours total if all three built pre-launch.
- **Status:** QUEUED — flexible. If Dean has bandwidth post-migration, build all three. If tight, ship PF-21 nav restructure only and frame the hubs as V2 (mid-June). The local-first architecture makes these trivially fast to add later — they're not the kind of work that gets harder with delay.

### Notes on PF-21 + PF-22 sequencing vs launch (added 13 May 2026 evening)

Dean asked about adding Mind / Body / Connect to launch. The bottom nav restructure (PF-21) is small and fits comfortably pre-launch. The hub pages (PF-22) are scope-flexible — they can be built in the 26-30 May window if Dean has bandwidth, or deferred to V2.

**The "deferred V2 content"** that PF-22 placeholders point to:
- Breathwork player + library (Mind)
- Meditations library (Mind)
- Mental health diagnosis flow / self-assessment (Mind — needs design call on whether self-assessment or clinical-grade)
- Community moments feed (Connect — anonymised member milestones, achievements, charity months funded)

These are explicitly post-launch work, not blockers. The Mind tab in particular gates the most V2 content because breathwork/meditation requires audio content from Lewis or Calum that doesn't exist yet — better to ship the Mind tab with check-ins + persona chat at launch and roll content in over June.

**No architectural changes from PF-21/22.** Both are pure presentation work on top of the local-first architecture. Dexie schema unchanged. Sync engine unchanged. New tables only needed for V2 community-moments feed which is post-launch.

---

## How to operate during this campaign

**Session start (every session):**
1. Load `brain/active.md` (this is the new "Load VYVE brain" — see active.md §0).
2. Load this playbook.
3. Pick up the next QUEUED task (or the IN PROGRESS task if Dean left one running).
4. Acknowledge: "Picking up PF-N — <title>. Estimated <length>. Needs Dean for <verification>."

**During a task:**
1. Work the task as defined. If scope drifts, name it and adjust the task in this playbook in the same session.
2. Commit to feature branch (`local-first-spike` or as-named). Do NOT commit to main during the campaign except for PF-20.
3. Verify per the task's verification spec.

**Session end (every session):**
1. Update this playbook with task status (QUEUED → IN PROGRESS → SHIPPED, etc.).
2. Update active.md §2 (live state snapshot) if anything changed.
3. Atomic brain commit: active.md + this playbook + (if needed) changelog entry. One commit per session.
4. If a task shipped: brain commit also includes a changelog entry recording what shipped and the relevant commit SHA on vyve-site.

**If a task fails or surfaces something unexpected:**
1. Mark task BLOCKED.
2. Add a note to this playbook explaining what blocked it.
3. Add a follow-up task (PF-N.1) addressing the blocker.
4. Continue with the next unblocked task if possible.

**If Dean asks a non-campaign question mid-session:**
1. Pause the current task cleanly (commit progress to feature branch).
2. Address the question.
3. Resume the task or pick up next session.

---

### PF-23 — Interactive guided tutorial (post-PF-21, target V2)

- **What:** Replace the "land on home, figure it out" first-app-open with a guided tutorial that routes the member through 5 micro-actions, each unlocking an achievement and each landing them on a real product surface. By the end (~2 minutes elapsed), home is visually populated, the member has done the smallest version of every primary surface, and the achievement system has had its proof-of-concept moment.
- **Sequence (each step persona-voiced in the member's chosen persona — NOVA/RIVER/SPARK/SAGE/HAVEN):**
  1. Welcome + persona introduction. "Hi {first_name}. I'm {persona}, your {persona_role}." This is the moment the persona becomes a character, not a label.
  2. Three-tab nav tour (Mind/Body/Connect — gated on PF-21 having shipped). One line per tab. Tab highlight ping/glow as each is named. Sets the navigation mental model from day one.
  3. **Log your first habit.** Route to habits.html, highlight first habit card, tap to complete. Achievement unlocks: **First Steps**. Persona-voiced "well done, that's day one." Return to home — habits pill now filled.
  4. **Log your first workout (or movement).** Route to Body tab → workouts, either tap "start first session" + complete one exercise, OR quick-pick a movement entry. Achievement: **First Move**.
  5. **Log a cardio session.** Route to cardio, quick-pick activity + duration. Achievement: **Heart Started**.
  6. **Hydration micro-action.** Tap to log a glass of water. Achievement: **Hydrated**.
  7. **Set your first weekly goal.** 3-option pick. Achievement: **Direction Set**. Persona-voiced "you're ready" handoff, lands on home with all 5 achievements visible and the dashboard populated as designed.
- **Why this is post-PF-21:** the tutorial teaches the Mind/Body/Connect nav. Shipping it before PF-21 means every screenshot and every persona line references the old nav and needs rewriting. Hard sequencing dependency.
- **Why this is NOT a hydration time-killer:** PF-13 handles the hydration second-or-two. PF-23 is its own feature — day-one engagement + achievement onramp + nav teaching + persona reveal. Stands on its own.
- **Why achievements work here:** the lowest-tier achievement on each track is often hard to design ("what's enough to deserve celebrating?"). The tutorial gives a purpose-built reason for each track's tutorial-tier achievement: tap once. Calum's workout/cardio tier inputs do not gate this. The tutorial-tier achievements are pre-defined and Lewis-approved before build.
- **Files touched:** new `/tutorial.js` (state machine + screen orchestration), new `/tutorial.html` or modal-system on index.html, overlay system that lets habits/workouts/cardio/nutrition pages tolerate tutorial-mode highlighting without code-littering (clean overlay, NOT `if(tutorialActive)` everywhere), 5 new achievement rows in `achievement_metrics` + `achievement_tiers` (tutorial tier per track), tutorial-completion flag on `members` table (tutorial gates fire once per member, never again), SW cache bump.
- **Verification:** Fresh test member completes onboarding. Lands in tutorial. Walks through 5 steps. Each step routes to a real surface, accepts a real interaction, fires a real achievement unlock. Final state: home shows 5 achievements, populated streaks, populated pills. Skip path at any step lands cleanly on home without orphaned state. Re-login: tutorial does NOT re-fire (flag honoured).
- **Needs Dean:** verification on real device. Lewis owns persona-voiced copy for every step in 5 voices (5 personas × ~7 screens = 35 copy blocks). Lewis owns the 5 tutorial achievement names + unlock copy. Lewis copy is the gating item — build can ship without copy but cannot reach production without it.
- **Estimated length:** 20-25 hours of build. Three to four full evening sessions. Breakdown: tutorial state machine + screen orchestration ~4h, 5 interactive segments with clean overlay system ~6-8h, achievement integration + 5 new rows + unlock animations ~3-4h, skip-path-at-any-point state handling ~2h, testing across 5 personas × 5 steps × skip-path = 25 scenarios ~3h, polish (transitions, timing, persona-matched colours) ~2h.
- **Status:** QUEUED — V2 target (mid-June). May move forward into pre-launch window if bandwidth allows. Hard sequencing: must land after PF-21. Hard blocker: Lewis copy for all 5 personas. Hard blocker: 5 tutorial achievement rows defined and `copy_status='approved'`.

### PF-24 — Page transitions

- **What:** Replace hard cuts between pages with consistent transitions. Capacitor wrap on iOS doesn't give you native slide-in for free in a web app, but a CSS view-transition or 150ms fade is convincing and standard. Apply consistently across every nav move — bottom tab switches, sub-page navigation, modal open/close. The Mind/Body/Connect tab switch (PF-21) is the most visible moment to get this right.
- **Pattern decision:** horizontal slide for sub-page navigation (Notes/Things style), 120-150ms crossfade for tab switches (Linear/Notion style). Single consistent timing function across all transitions. No bespoke per-page transitions.
- **Files touched:** new `/transitions.js` (handles route-change animation), `nav.js` (calls transitions on tab/page navigation), CSS additions in shared stylesheet (transition keyframes + timing tokens). Likely a small touch to every gated page to mark the transition root, OR a single body-level wrapper does it without per-page changes — prefer the latter.
- **Verification:** Navigate between every tab combination + sub-page combination on iPhone real device. Should feel coherent, never janky, never longer than the page actually takes to paint (the transition should hide paint latency, not extend it). Reduced-motion users get a softer/faster variant via `prefers-reduced-motion`.
- **Needs Dean:** real-device verification on iPhone. Reduced-motion behaviour confirmed.
- **Estimated length:** 3-4 hours.
- **Status:** QUEUED — pre-launch if bandwidth.

### PF-25 — Typography pass

- **What:** Premium apps are obsessive about type. This task does a single pass across the app to fix the things that separate "professionally designed" from "designed by an engineer".
  - **Tabular numerals on every counter.** Streak counters, macro totals, charity month counter, weight values, time displays — anything where the digit-width changes between values looks cheap. Add `font-variant-numeric: tabular-nums` to all numeric displays.
  - **Line-height audit.** Body copy line-height should be 1.5-1.6. Heading line-height should be 1.1-1.25. Most CSS defaults are too tight. Audit every text surface and fix.
  - **Font loading audit.** Confirm there's no FOUT (Flash of Unstyled Text). If using a webfont, ensure `font-display: swap` is set correctly, or preload critical weights. If using system fonts (San Francisco on iOS, Roboto on Android), confirm the fallback stack is correct.
  - **Letter-spacing on ALL-CAPS labels.** Anywhere we use uppercase (tab labels, button text in caps, etc.), add `letter-spacing: 0.05em` minimum. Without it, all-caps reads as cramped and amateur.
  - **Truncation and overflow.** Long member names, long workout names — confirm they truncate gracefully with ellipsis, never overflow or wrap awkwardly.
- **Files touched:** shared stylesheet (typography tokens), audit pass across every member-facing page. Likely a single CSS additions block + a handful of targeted patches.
- **Verification:** Visual review across the app — habits, workouts, cardio, nutrition, home, settings, leaderboard, certificates, engagement, check-ins. Numeric displays don't jiggle as they update. No FOUT on first load. No awkward overflow on long names.
- **Needs Dean:** visual review.
- **Estimated length:** 2-3 hours.
- **Status:** QUEUED — pre-launch.

### PF-26 — Pull-to-refresh wiring

- **What:** Members will instinctively pull-to-refresh on mobile. Right now it does nothing or jankily reloads the page. Wire pull-to-refresh on every member-data page to trigger `runDeltaPull()` (from PF-5) for that page's relevant tables. Visible spinner during the pull, success haptic on completion. With local-first, the "refresh" is genuinely instant — the spinner is just confirmation that we asked Supabase for anything new, not the actual refresh.
- **Implementation:** native pull-to-refresh via Capacitor Pull-to-Refresh plugin, OR a CSS-based pattern that listens on touchstart/touchmove at the page top. Capacitor plugin gives proper iOS native feel; CSS fallback for web.
- **Files touched:** new `/pull-refresh.js` helper, additions to habits.html / workouts.html / cardio.html / nutrition.html / index.html / leaderboard.html / sessions.html. Each page calls the helper with its relevant `runDeltaPull` table list.
- **Verification:** On iPhone real device, pull down on each page, see native pull-to-refresh animation, feel haptic on release, see delta-pull fire in console, see any new data appear. Web fallback works on Chrome desktop.
- **Needs Dean:** real-device verification.
- **Estimated length:** 1-2 hours. Half-hour for the core wiring per the playbook estimate, plus per-page additions.
- **Status:** QUEUED — pre-launch. Cheap and high-leverage given PF-5 delta-pull is already shipped.

### PF-27 — Loading-to-success animation on AI moments

- **What:** When the member submits the weekly check-in (or monthly check-in), the wellbeing-checkin EF takes 3-8 seconds to generate AI recommendations. Currently this is a deliberate wait with minimal framing. Top apps (Calm, Headspace) turn this into a moment — the wait is staged as "your coach is thinking" with a thoughtful animation (pulsing dot, breath visualization, persona-matched motion). The wait stops feeling like loading and starts feeling like a moment.
- **Why this is high-leverage:** the AI moment is the ONE place we explicitly want members to slow down. Members who wait through it with positive feeling are converted on the persona; members who feel "stuck waiting" churn. Same wait, different perception.
- **Pattern:** persona-matched animation (NOVA = sharp pulsing dot, RIVER = soft breathing circle, SPARK = energetic ripple, SAGE = thoughtful slow rotation, HAVEN = warm gentle wave). Text underneath: "{Persona} is reviewing your week..." → "{Persona} is preparing your recommendations..." → reveals recommendations on completion. Two messages so the wait doesn't feel single-step. Sub-1s completion gets a soft-fade reveal; longer waits get a satisfying transition into the recommendation reveal.
- **Files touched:** new `/ai-moment.js` (animation system), additions to `wellbeing-checkin.html` and `monthly-checkin.html`. Shared CSS for the persona-matched animation styles.
- **Verification:** Submit a real check-in, watch the animation, confirm it matches the member's persona, confirm the message progression feels intentional, confirm the reveal lands smoothly into the recommendations.
- **Needs Dean:** real-device verification. Lewis copy approval for the two message strings (per persona — 5 personas × 2 messages = 10 copy blocks).
- **Estimated length:** 3-4 hours. Animation system ~1h, persona variants ~1h, integration on both check-in pages ~1h, copy/polish ~1h.
- **Status:** QUEUED — pre-launch if bandwidth. Lewis copy gates production.

### PF-28 — In-progress session + form draft persistence

- **What:** Persist transient orchestration state to Dexie during active workouts/cardio sessions and in-progress forms, so closing/backgrounding the app mid-action drops the member back exactly where they were. Logged data is already safe via PF-1..PF-7 (every set/rep/weight write hits Dexie at moment of tap). This task closes the gap on UI state: current exercise pointer, rest timer countdown, sets-completed-in-this-session, partial form input. The "Strong" / "Strava" experience: reopen → resume.
- **Surfaces in scope:**
  1. **Active workout session.** Persist `{programme_id, session_id, current_exercise_index, current_set_index, timer_remaining_ms, timer_started_at, sets_completed_in_session}` to a new `_workout_session_state` Dexie row every 5-10s during a session via debounced writer. On workouts.html load, query `_workout_session_state` for member's active row — if present, show "Resume your Push A session? (Started 8 minutes ago, 3 of 12 sets logged)" prompt; tap resume restores the orchestration. Tap "start fresh" clears the row.
  2. **Active cardio session.** Same pattern. Persist `{activity_type, started_at, elapsed_ms, paused}` so a cardio session in progress survives app close. Less critical than workouts (cardio sessions are usually single-action quick-logs) but the pattern is cheap to extend.
  3. **Form drafts.** Auto-save partial input to a `_drafts` Dexie table keyed by `(member_email, form_id, field)`. Surfaces: weekly-checkin free-text, monthly-checkin free-text, log-food in-progress entry (food searched + macros being adjusted but not yet saved), custom-workout-builder in-progress definition. Debounced 500ms after last keystroke. On form load, populate from `_drafts` if present, offer "you have a draft from earlier — restore?" prompt on long-stale drafts (>24h).
- **Why this is post-PF-7/9 and not part of them:** PF-7 (workouts refactor) and PF-9 (cardio refactor) make historical reads instant and committed writes safe — that's the foundation. PF-28 sits on top: it's a separate concern (transient state, not historical data) and the pattern is easier to apply once the page is already reading from Dexie. Doing it inside PF-7 muddies the refactor's scope.
- **Files touched:** `/db.js` (add `_workout_session_state` + `_drafts` tables via `version()` chain — additive, no migration risk), `/sync.js` (these are LOCAL-ONLY tables, not synced to Supabase — transient state has no value cross-device, and avoiding sync keeps them out of the drainer's hot path), `workouts.html` + `workouts-session.js` (debounced state writer + resume prompt on load), `cardio.html` (debounced state writer + resume prompt), `wellbeing-checkin.html` + `monthly-checkin.html` + `log-food.html` + `workouts-builder.js` (draft auto-save + restore prompt). New `/drafts.js` helper module to keep the debounce + restore logic DRY across surfaces. SW cache bump.
- **Verification:** Workout session — start a session, log 2 sets, force-quit app, reopen, see resume prompt, tap resume, land exactly where you were with timer still in correct state. Cardio session — same flow. Form drafts — start typing in weekly-checkin free-text, switch tabs/close app, reopen, draft restored. Stale draft (>24h) — see restore prompt instead of silent restore (prevents stale state surprise).
- **Needs Dean:** real-device verification on iPhone (the iOS-suspended-then-killed case is the hard one). Lewis copy for the resume prompts and the stale-draft restore prompt.
- **Estimated length:** 3-4 hours. `_workout_session_state` + workouts integration ~1.5h, cardio session state ~30min, `_drafts` table + helper module + form integrations ~1.5h, polish + verification ~30min.
- **Status:** QUEUED — pre-launch. Slots between PF-9 (cardio refactor) and PF-13 (hydration screen). High value-per-hour: the mid-workout-close case is the most "is this a real fitness app?" test surface and gets us level with Strong/Strava on that one moment.

### PF-29 — Android Health Connect autotick wiring (pre-launch)

- **What:** Wire the existing autotick evaluator to read from Android Health Connect on Android devices, mirroring what it already does for HealthKit on iOS via the Capgo plugin. The Capacitor side is already set up — the Health Connect plugin is in the Capacitor project, the Android manifest declares the `android.permission.health.READ_*` permissions, and the plugin is compiled into the 1.0.2 binary currently in Play Store review. The outstanding work is web-side and member-facing.
- **Scope:**
  1. **Web-side autotick evaluator routes Android requests to the Health Connect plugin path.** The `fetchDashboardHabits` live evaluator currently routes only to iOS HealthKit. Add an Android branch that calls the Health Connect plugin via the same Capacitor JS API surface. Per-platform data type mapping where Health Connect's types differ from HealthKit's (workouts being the main one — Health Connect's "strength training" granularity differs from Apple's).
  2. **Android-specific permissions UX.** Health Connect permissions flow differently: members grant per-data-type access via the Health Connect app itself, not an in-app prompt. The onboarding flow + settings page need an Android-specific path that explains this and deep-links to Health Connect. Lewis copy gate for the explainer copy.
  3. **Verification on Android device** — confirm the plugin reads correctly, autotick fires for habits that should fire, doesn't fire for habits that shouldn't. Run side-by-side with iPhone to verify cross-platform parity for the same member account.
- **Why no Play Store re-review:** Capacitor apps only require Play Store re-review when permissions change. The Health Connect permissions are already declared in the 1.0.2 manifest (which is currently in review). Web-side changes deploy via GitHub Pages with the standard `sw.js` cache key bump — no Play Store involvement, no review timing risk. The only blocker is Lewis copy.
- **Architectural note:** This is exactly the PM-80 server-compute-carve-out principle in action. Autotick evaluator output is live evaluator state against the current platform health store — it's not persistable, it must stay on the wire on both spike-on and spike-off paths, and the platform-specific routing happens at the evaluator layer not the page layer. Already established as the pattern in PF-6 (HealthKit autotick stayed on the wire on both paths). PF-29 extends the pattern to Android.
- **Files touched:** server-side `fetchDashboardHabits` evaluator (likely an Edge Function or member-dashboard endpoint) — add Android Health Connect routing branch. Web-side onboarding / settings pages — add Android-detection branch that surfaces the Health Connect permissions explainer. SW cache bump.
- **Verification:** On Android device, sign up as a fresh test member (or use existing account), grant Health Connect permissions via the in-app prompt path, perform an activity that should trigger autotick (e.g., 30+ active minutes for a movement habit), confirm the habit auto-ticks within the expected evaluation window. Side-by-side with iPhone: same account, both devices grant permissions, both surface autotick correctly.
- **Needs Dean:** Verification on Android device. Lewis copy for the Android permissions explainer (1-2 short copy blocks).
- **Estimated length:** 3-4 hours build. Web-side evaluator routing ~2h, Android permissions UX ~1h, verification + polish ~1h.
- **Status:** QUEUED — pre-launch. Hard blocker: Lewis copy for Android permissions explainer. Memory line in active.md previously read "Android HealthKit (Health Connect) parity — parked pending test device" — that's now superseded by this task since Dean has an Android device.

---

## Out of scope for this campaign

- Layer 6 SPA shell — dropped (local-first delivers the perceived speed gains; SPA shell is no longer worth the rewrite).
- PM-71/PM-71b dashboard payload trim — becomes mostly obsolete after the migration (the dashboard EF gets called rarely).
- PM-72 materialise achievement_progress — same, becomes obsolete.
- PM-73 home redesign — deferred until after launch + data on what the simplified home payload should look like.
- Backend EF perf work (warm-keeping cron, denormalisation work) — becomes mostly obsolete after migration.

These are all NOT to be worked on during this campaign. Post-launch we may revisit any of them. During the campaign they are deferred.
