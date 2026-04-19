## 19 April 2026 — member-dashboard EF v43: counts from source tables, per-type streaks, full 30-day activity_log

### Issue
User reported three bugs: (1) index.html totals tallied wrong, (2) engagement.html per-type streaks not loading, (3) engagement.html 30-day activity calendar not loading.

### Root causes
1. **Totals drift.** member-dashboard v42 pulled counts from `members.cert_*_count` (trigger-maintained counters). These drift: the counter trigger exists on `session_views` but NOT on `replay_views`, so replay views never increment `cert_sessions_count`. Confirmed on Dean's row — stored 30 vs actual 45 (15 replay views missing). Same class of bug as the aggregation-trigger SECURITY DEFINER issue fixed earlier on 19 April, just a different mechanism.
2. **Calendar empty.** Earlier 19 April fix changed the calendar filter side from `r.types` → `r.activities` (4 places in `renderLogFromPrecomputed`), but missed the translation layer at `loadPage()` line 664 which still renamed `activities` → `types`. Flow: EF returns `{date,activities}` → translation rewrites to `{date,types}` → render reads `r.activities` → never matches → calendar empty.
3. **Only 14 days returned.** EF v42 used `activity_log: activityLog.slice(-14)`. Calendar expected 30.

### What shipped

**member-dashboard v43** (deployed, verify_jwt: false, internal JWT validation unchanged)
- Lifetime counts computed from source tables, not `cert_*_count`:
  - `habits` = distinct `activity_date` from `daily_habits` (Rule 20)
  - `workouts`, `cardio` = row count on respective tables
  - `sessions` = `session_views` + `replay_views` row count combined
  - `checkins` = `kahunas_checkins` row count
- Returns full 30-day `activity_log` (removed `.slice(-14)`)
- Returns new `engagement.streak_by_type` with `{current,best}` for habits/workouts/cardio/sessions (daily streaks) and `checkins` (weekly streak, computed from `iso_year`+`iso_week`)
- `progress.*.best_streak` now populated (was hardcoded 0)

**index.html**
- Translation layer wires per-type streaks from `engagement.streak_by_type`, maps `best` → `longest` for legacy client shape
- Charity normalised to `{total,months,progress}` object (was raw number — latent render bug: `ch.total.toLocaleString()` called on number)
- Fixed workout key mismatch: `applyStreak('workout', streaks.workout...)` → `streaks.workouts` (prefix 'workout' stays for DOM ids)

**engagement.html**
- Translation layer passes `data.activity_log` through unchanged (keeps `activities` key; drops the `activities` → `types` rename)
- Per-type streaks wired from `engagement.streak_by_type` via same `mapS` helper

**sw.js** — cache bumped: `vyve-cache-v2026-04-19l` → `vyve-cache-v2026-04-19m`

### Commit
vyve-site main: [d3dc138](https://github.com/VYVEHealth/vyve-site/commit/d3dc13826b2ba15d8977121d232a9aaf989c485d)

### Architecture note (proposed Rule addition)
`cert_*_count` counters on `members` are redundant with source-table queries. The `increment_*_counter` triggers are drift-prone (missed replay_views case above). Recommend deprecating these columns in a future pass; any read-path should compute from source tables. Not blocking; leaving counters in place for now.

### Deferred
- Backfilling `cert_*_count` to match source tables (cosmetic only now that the EF reads source tables; no user-facing impact)
- Auditing whether any other EF/report reads `cert_*_count` directly (daily-report, weekly-report, monthly-report, certificate-checker all candidates — a grep pass is cheap but out of scope for this commit)

---

## 19 April 2026 — Exercise restructure Round 4: movement.html

### New file: movement.html
Commit: [b7e19ba](https://github.com/VYVEHealth/vyve-site/commit/b7e19ba12726a25a5a94aef8641043494fb7da94)

**Features:**
- Programme header card: name, week X of Y, progress bar from workout_plan_cache
- Activity list: name, duration, tip, optional `video_url` per activity
- Video modal: YouTube auto-embed, direct video file fallback, open-link fallback. Closes on Escape or overlay tap. Clears video on close (stops playback).
- "Mark as Done" button: writes to `workouts` table (BST date, day_of_week, time_of_day, plan_name, session_name, duration_mins). Then PATCH to `workout_plan_cache` to advance current_session/current_week.
- Clears `vyve_movement_cache` after completion so next load shows the new session.
- No-plan state: shown when no active plan with `category = 'movement'` exists. Clean message + back to Exercise link.
- 10-second skeleton watchdog, 30-minute localStorage cache (`vyve_movement_cache`, email-keyed).
- No emojis, XSS-escaped activity content, bstToday() date helpers.

**Data contract (expected programme_json structure for movement plans):**
```json
{
  "programme_name": "4-Week Gentle Movement",
  "category": "movement",
  "plan_duration_weeks": 4,
  "sessions_per_week": 3,
  "weeks": [{
    "sessions": [{
      "session_name": "Walk & Stretch — Day 1",
      "activities": [{
        "name": "Brisk walk",
        "duration": "20 mins",
        "tip": "Aim for a conversational pace",
        "video_url": null
      }]
    }]
  }]
}
```

**sw.js** — cache bumped: `vyve-cache-v2026-04-19i` → `vyve-cache-v2026-04-19j`

**Current state:** All members see no-plan state (correct — no movement plans in programme_library yet). Page is ready for content.

### Still to build
- Round 5: welcome.html onboarding question + onboarding EF routing for exercise_stream
- programme_library: movement plan content (walking plans, yoga, stretching programmes)
- programme_library: add `category` column to distinguish movement vs gym plans

---

## 19 April 2026 — Exercise restructure Round 3: exercise.html hub page

### New file: exercise.html
Commit: [c5216ca](https://github.com/VYVEHealth/vyve-site/commit/c5216caf774b2a3aeef8d10e569fc093b0e93b19)

**Layout decisions (confirmed):**
- Hero card: detailed (programme name, week X of Y, progress bar, "Up next" session pill, "View Programme" CTA)
- CTA: links to workouts.html — 2 taps (hub → programme view → active session). No deep-link.
- Stream cards: all 3 always visible regardless of exercise_stream (Option A). No Classes card.
- 3 streams: Movement (movement.html), Workouts (workouts.html), Cardio (running-plan.html)

**Data source:**
- Direct REST to `workout_plan_cache` (member_email, is_active=true)
- Fields used: `programme_json.programme_name`, `current_week`, `plan_duration_weeks`, `current_session`, `programme_json.weeks[n].sessions[n].session_name`
- 1-hour localStorage cache keyed by email: `vyve_exercise_cache`

**Patterns:**
- Auth: `if (window.vyveCurrentUser) onAuthReady()` + `vyveAuthReady` listener
- Skeleton watchdog: 10 seconds
- NULL plan fallback: "Your programme is on its way" state — no crash
- offline-manager.js wired

**sw.js** — cache bumped: `vyve-cache-v2026-04-19h` → `vyve-cache-v2026-04-19i`

### Still to build
- movement.html (Round 4) — Movement plan display + completion logging
- welcome.html onboarding question update (Round 5)
- onboarding EF routing for exercise_stream (Round 5)

---

## 19 April 2026 — Exercise restructure Round 1 & 2

### Round 1 — DB: exercise_stream column
- Added `exercise_stream VARCHAR(20)` to `public.members` with CHECK constraint ('workouts', 'movement', 'cardio'), DEFAULT 'workouts'
- Backfilled all 18 existing members to 'workouts'
- Migration applied via Supabase MCP apply_migration

### Round 2 — Label changes: Workouts → Exercise (portal UI)
Commit: [5fe6929](https://github.com/VYVEHealth/vyve-site/commit/5fe69294e0d9965c4e56938986fe8f0212a53a13)

**nav.js**
- Active page detection: `workouts` → `exercise` tab key; both `/workouts.html` and `/exercise.html` paths resolve to 'exercise' tab (keeps Exercise tab highlighted on workouts sub-page)
- Bottom nav: href `/workouts.html` → `/exercise.html`, label 'Workouts' → 'Exercise', tab key updated
- Desktop nav More dropdown: same href/label/tab update

**index.html**
- Mobile track name label: 'Workouts' → 'Exercise'
- Progress track label: 'Workouts' → 'Exercise'
- Weekly goal copy: 'Complete X workout/s' → 'Complete X exercise session/s'
- Notification nav link: href + aria-label + span text updated

**engagement.html**
- Activity card label: 'Workouts' → 'Exercise'
- Calendar legend label: 'Workouts' → 'Exercise' (key: 'workouts' unchanged — DB key)
- Variety description copy updated

**certificates.html**
- Workouts track label: 'Workouts' → 'Exercise' (subtitle 'The Warrior' pending decision)
- Empty state copy updated

**leaderboard.html**
- Metric tab display text: 'Workouts' → 'Exercise' (data-metric="workouts" unchanged — EF key)

**sw.js** — cache bumped: `vyve-cache-v2026-04-19g` → `vyve-cache-v2026-04-19h`

### What did NOT change
- DB tables: `workouts`, `workout_plans`, `workout_plan_cache` — unchanged
- EF response keys: `prog.workouts`, `counts.workouts` — unchanged
- Internal JS variables in workout JS modules — unchanged
- workouts.html — still exists as sub-page, accessed from hub

### Still to build (Round 3+)
- exercise.html hub page
- movement.html sub-page
- welcome.html onboarding question update
- onboarding EF routing for exercise_stream

---

## 19 April 2026 — BST date consistency audit: bstToday() across portal + wellbeing-checkin EF

### Audit scope
Full audit of all portal pages calling Edge Functions: EF response shape contracts and BST date handling.

### EF response shape mismatches
None found. All pages correctly consume their EF responses:
- `wellbeing-checkin.html` reads `data.ack`, `data.recs` — correct
- `monthly-checkin.html` reads `data.aiReport`, `status.alreadyDone`, `status.newMemberLocked`, `activity.*` — correct
- `running-plan.html` reads `data.content?.[0]?.text` from anthropic-proxy — correct
- `certificates.html` uses iframe following 302 redirect from certificate-serve — correct

### BST date bugs fixed

**`workouts-session.js`** (commit 22aa348)
- Exercise_logs insert was using `new Date().toISOString().slice(0,10)` (UTC) — fixed to `bstToday()`
- Workout completion `today` variable was UTC — fixed to `bstToday()`
- Added `isDST()` + `bstToday()` helpers at top of file (same pattern as habits.html)

**`wellbeing-checkin.html`** (commit 22aa348)
- Client-side `activity_date` was UTC — fixed to `bstToday()` (hygiene; EF was ignoring client date anyway)
- Added `isDST()` + `bstToday()` helpers

**`wellbeing-checkin` EF** (deployed as Supabase v35, code v25)
- Server-side `activity_date = today.toISOString().slice(0, 10)` was UTC — this was the real bug: check-ins stored on the wrong date after midnight BST
- Added `ukToday()` helper (Deno-compatible BST detection using UTC date math, not `getTimezoneOffset()`)
- Also fixed `writeNotification` dedup check to use `ukToday()` for the `created_at` cutoff

**`monthly-checkin.html`** (commit 22aa348)
- Calendar `todayStr` was UTC — cosmetic fix, now uses `bstToday()` so "today" cell highlights correctly after midnight BST
- Added `isDST()` + `bstToday()` helpers

**`sw.js`** (commit 22aa348)
- Cache bumped: `vyve-cache-v2026-04-19d` → `vyve-cache-v2026-04-19e`

### Confirmed unaffected
- `habits.html` — already uses `bstToday()` (was the reference implementation)
- `sessions.html` — no log-activity calls (session logging happens on live session pages)
- `log-activity` EF — trusts client-sent `activity_date`; cap check + DB write use whatever date the client sends

### Commit
vyve-site main: [22aa348](https://github.com/VYVEHealth/vyve-site/commit/22aa348577aafdcf34dd756ad0403f81cef340ea)

---

## 19 April 2026 — engagement.html component bars crashing (renderScoreHero shape mismatch)

### Issue
Score ring rendered (97) but component bars showed "--/12.5" with JS error: `TypeError: Cannot read properties of undefined (reading 'pts')` at renderScoreHero:370.

### Root cause
`renderScoreHero(score)` expected each component as `{ pts: number }` (v35 shape) and referenced `c.activity` specifically. The v40 EF returns components as flat numbers (`recency`, `consistency`, `variety`, `wellbeing`). Two mismatches: (1) flat number vs object, (2) `recency` vs `activity` key name.

### Fix
Made `renderScoreHero` self-normalising — accepts both shapes via `toPts()` helper and maps `recency → activity`. Covers fresh fetch, offline cache, and any future stale localStorage data.

### Data was NOT lost
All 30 days of activity data is intact in the raw tables. The 97 score was correct. Only 1 day (April 18) had a partial gap from the trigger bug. The 24 active days in the last 30 days are all present.

### What shipped
- `engagement.html` — renderScoreHero normalises component shape
- `sw.js` — bumped to `vyve-cache-v2026-04-19d`
- Commit: 0926e456fae7d3f5fc48b4a1992ace26b1ea7914

## 19 April 2026 — member-dashboard EF 500 error (wrong column names)

### Root cause
member-dashboard v40 queried two tables with wrong column names — PostgREST returned 400 on both, the `q()` helper threw, Promise.all rejected, catch block returned 500. This was the actual reason engagement score showed "--" — the EF was crashing before returning any data.

Wrong columns:
- `wellbeing_checkins`: queried `checkin_week` (→ `iso_week`) and `wellbeing_score` (→ `score_wellbeing`)
- `weekly_scores`: ordered by `week_start` (→ `iso_week`)
- Response: `wbCheckins.checkin_week` (→ `wbCheckins.iso_week`)

### Fix
Deployed member-dashboard **v41** with correct column names. No other logic changed.

### Correct column names (for future reference)
- `wellbeing_checkins`: `iso_week`, `score_wellbeing`, `score_energy`, `score_stress`, `composite_score`
- `weekly_scores`: `iso_week`, `iso_year`, `wellbeing_score`, `engagement_score`, `logged_at`

## 19 April 2026 — index.html habit strip not showing today as complete

### Issue
Sunday not checked off on the 7-day habit pill strip on the dashboard, even after logging all 5 habits. Streaks, counts, and score were also silently broken on index.html.

### Root cause
Same v35 → v40 response shape mismatch as engagement.html (fixed same session). `renderDashboardData()` destructures `data.habitStrip`, `data.habitDatesThisWeek`, `data.counts`, `data.streaks`, `data.score`, `data.wbScore`, `data.daysInactive` — none of which exist in the member-dashboard v40 response. All rendered as undefined/blank.

### Fix
Injected a v40→v35 translation block at the top of `renderDashboardData()`, inside the guard `if(data.engagement && !data.score)`. Derives:
- `habitStrip` — Mon–Sun dates of current week computed from local time
- `habitDatesThisWeek` — filtered from `data.activity_log` where `activities` includes `'habits'` and date is in this week
- `counts`, `streaks`, `score`, `wbScore`, `daysInactive`, `charity`, `goals` — mapped from v40 nested structure

Translation runs for both fresh fetch and cache read paths since it lives inside `renderDashboardData`.

### What shipped
- `index.html` — v40 translation in renderDashboardData
- `sw.js` — bumped to `vyve-cache-v2026-04-19b`
- Commit: 7bfbff28bd7419c42f247369a91b1a48d36eef9c

## 19 April 2026 — Platform-wide activity logging broken + engagement score broken

### Root cause 1: SECURITY INVOKER triggers blocking all activity writes
New triggers (`zz_sync_activity_log`, `increment_habit_counter`) were added to all 6 activity tables (daily_habits, workouts, cardio, session_views, replay_views, wellbeing_checkins). These are SECURITY INVOKER — they run as the authenticated user. They write to 3 new tables (`member_activity_log`, `member_activity_daily`, `member_notifications`) which had RLS enabled with zero policies (default deny). Every activity INSERT was rolling back silently. No data landed from ~18 April onwards.

### Fix: SECURITY DEFINER on trigger functions (Supabase migration)
Rebuilt `vyve_sync_activity_log`, `increment_habit_counter`, and `vyve_refresh_daily` as SECURITY DEFINER so they run as the table owner and bypass RLS on the internal bookkeeping tables. Verified with authenticated INSERT test — all triggers fire correctly.

### Root cause 2: engagement.html expecting old member-dashboard v35 response shape
engagement.html was destructuring `data.score`, `data.counts`, `data.streaks`, `data.activityLog` (v35 shape). member-dashboard is now v40 which returns `data.engagement.score`, `data.progress.x.count`, `data.engagement.streak`, `data.activity_log` with `activities[]` not `types[]`. All render functions received undefined, score showed as NaN/blank.

### Fix: translation layer in loadPage() (engagement.html)
Added a mapping block after the fetch that translates the v40 response into the v35 shape expected by renderScoreHero, renderActivityGridFromPrecomputed, renderLogFromPrecomputed, renderStreaksFromPrecomputed. No render functions changed — only the data mapping.

### What shipped
- Supabase migration: `fix_trigger_security_definer`
- `engagement.html` — v40 response mapping
- `sw.js` — bumped to `vyve-cache-v2026-04-19a`
- Commit: 131bf2a14bfbacc150e6f0186aac56949e1fbc2c

### New tables discovered (not in brain)
- `member_activity_log` — audit log of all activity events (source_table, source_id, member_email, activity_type, activity_date, logged_at, metadata)
- `member_activity_daily` — aggregated daily activity counts per member
- `member_notifications` — streak milestone notifications

## 18 April 2026 — Certificates page stuck on loading spinner (auth polling pattern removed from certificates.html + settings.html)

### Issue reported by Dean

Certificates page hung on the loading spinner in both Chrome and Safari. Dean had one legitimate certificate in the DB (sessions track, 30 milestone, global cert No. 0001, earned 18 Apr 20:35 UTC) but could not see it anywhere. Initial hypothesis was a `member-dashboard` EF outage; diagnosis proved otherwise.

### Root cause

Two portal pages still used the legacy `waitForAuth(n)` polling pattern — explicitly flagged as a bug in master.md Rule 22 ("Any page still using the polling pattern is a bug"). Pattern:

```js
function waitForAuth(n) {
  if (window.vyveCurrentUser) { loadPage(); return; }
  if (n > 50) { loadPage(); return; }      // gives up after 5s
  setTimeout(() => waitForAuth(n + 1), 100);
}
async function loadPage() {
  const user = window.vyveCurrentUser;
  if (!user?.email) return;                 // ← silent return, spinner hangs forever
  ...
}
```

When `auth.js` took longer than 5 seconds to set `window.vyveCurrentUser` — which became more likely after the 11 Apr security audit tightened JWT handling and CORS on the JWT-gated EFs — polling timed out, `loadPage()` was called anyway, returned silently on the no-user branch, and left the skeleton spinner up with no console error, no failed fetch, no unhandled rejection. This matches the "silent failures" pattern called out in master.md: the platform monitor has no signal because nothing fails loudly.

`settings.html` had the same pattern. Its n>50 branch showed an empty `#app` div instead of the spinner, which is why it hadn't yet surfaced as a user-visible bug, but it would have on a cold load.

Portal-wide scan confirmed only these two pages carried the bug. `index.html`, `habits.html`, `engagement.html` already use the correct event-driven pattern. `workouts.html` uses MutationObserver per Rule 12. Everything else either doesn't call member-dashboard or uses a different init path.

### What shipped

**`vyve-site` portal** — single atomic commit

- `certificates.html`
  - Replaced `waitForAuth(n)` polling with event-driven pattern (listens on `vyveAuthReady`, immediate-fire if `window.vyveCurrentUser` already set, hard 8s fallback that redirects to `/login.html`)
  - `loadPage()` no-user branch: silent `return` → `window.location.href = '/login.html'` so auth failure is visible, not silent
- `settings.html`
  - Same auth pattern swap, preserving the cache-first fast path (populateFromCache → loadProfile in background)
  - n>50 silent "show empty app" branch also replaced with login redirect
- `sw.js` cache: `vyve-cache-v2026-04-18d` → `vyve-cache-v2026-04-18e`

### Why the fix makes the certificate visible

Dean's one certificate row is intact in `public.certificates` (id `2391eb97-82c6-4952-addd-0ae6c80b6210`, activity_type `sessions`, milestone_count 30, global_cert_number 1, certificate_url populated, charity_moment_triggered true). `member-dashboard` v25 returns `data.certificates[]`, and `certificates.html`'s `render()` reads those columns directly into a cert card. The only thing blocking render was the auth-timeout silent hang. With the event-driven pattern, `loadPage()` runs as soon as auth.js dispatches `vyveAuthReady`, the fetch completes, and the "Live Sessions / The Explorer / 30 completed / No. 0001 / 18 Apr 2026" card renders.

### Follow-ups

- That sessions certificate was issued earlier today — worth a sanity check on whether Dean's actual `session_views` count is ≥ 30 or whether certificate-checker fired on a test insert. Not a blocker.
- Rule 22 candidate upgrade: consider a CI grep for `function waitForAuth(n)` to fail builds if the polling pattern ever reappears.
- Outstanding items from 11 Apr audit (A4 service-role refactor, A5 XSS audit on innerHTML, C2 onboarding race ordering, C3 dashboard over-fetching, C4 PostHog email hashing, B1 one-shot EF deletions) remain open.

### Source of truth used

- `VYVEHealth/vyve-site` main: `certificates.html` (SHA 310d1d1), `settings.html` (SHA 194dcfb), `auth.js` (SHA dda1103), `index.html` (SHA 29348cf for reference pattern), `sw.js` (SHA 00d957c)
- Live Supabase project `ixjfklpckgxrwjlfsaaz`: `public.certificates` row for deanonbrown@hotmail.com, `public.members`, activity count queries
- Portal-wide scan across 12 pages to confirm only certificates.html and settings.html carried the polling pattern

---

## 18 April 2026 — Three-issue fix session (monthly-checkin 500, weekly check-in zoom, notifications safe-area)

### Issues reported by Dean

1. Monthly check-in threw 500 critical alert (`api_500_monthly-checkin`, /monthly-checkin.html, 02:42 BST)
2. Weekly check-in page rendered visibly zoomed inside the iOS app — content cropped on both sides
3. Notifications page back button overlapped the iOS status bar; bottom nav looked inconsistent with the rest of the portal

### Root causes

**Issue 1 — `monthly-checkin` EF schema drift.** Live table `public.wellbeing_checkins` has `score_wellbeing` (not `wellbeing_score`) and does **not** have `band` or `answer` columns at all. EF v15 queried all three. The error was surfaced via function_logs: `42703 column wellbeing_checkins.wellbeing_score does not exist` (thrown from `q()` inside `Promise.all`). GET worked for Dean because GET doesn't touch this table; POST fails immediately on submit.

**Issue 2 — `wellbeing-checkin.html` nav scoping + viewport.** The file declared a bare `nav { position:fixed; ... }` CSS selector instead of the `nav.desktop-nav { ... }` pattern used by the rest of the portal. Result: the inline desktop nav was **not** hidden on mobile (nav.js's `@media(max-width:768px){nav.desktop-nav{display:none!important}}` rule only targets `.desktop-nav`). On mobile we rendered both the page's own `<nav>` and nav.js's injected `.mobile-page-header` simultaneously, pushing the layout beyond 100vw. The viewport meta also lacked `user-scalable=no, maximum-scale=1.0` (other portal pages have it), so any accidental pinch-zoom persisted across reloads.

**Issue 3 — `.notif-topbar` missing safe-area-inset-top.** Inline notifications overlay in `index.html` uses `position:fixed; inset:0; z-index:10002` and a top bar with `padding:14px 16px 14px` — no allowance for the iOS status bar / notch. Back button renders directly under the clock. Bottom `.notif-nav` also used different paddings, height, icon size, and font weight than the sitewide `.vyve-bottom-nav`, producing the visible inconsistency Dean flagged.

### What shipped

**`monthly-checkin` EF v16** (ixjfklpckgxrwjlfsaaz)
- `wellbeing_checkins` SELECT: `wellbeing_score,band,answer,activity_date` → `score_wellbeing,activity_date`
- `wbSummary` now reads `c.score_wellbeing` and derives band inline via new `scoreBand(score)` helper (1-3 struggling, 4-5 getting by, 6-7 solid, 8-10 strong)
- `avgWellbeing` now reads `r.score_wellbeing`
- `verify_jwt: false` preserved (Rule 21 — internal JWT validation pattern)

**`vyve-site` portal** — single atomic commit [dec290d](https://github.com/VYVEHealth/vyve-site/commit/dec290d31c552e4e164d17cd902b4e382585153e)
- `wellbeing-checkin.html`
  - Viewport meta now matches `index.html`: `width=device-width, initial-scale=1.0, interactive-widget=resizes-content, user-scalable=no, maximum-scale=1.0`
  - Added `<meta name="mobile-web-app-capable" content="yes"/>` (was in the 13-page backlog list)
  - Bare `nav { ... }` CSS selector → `nav.desktop-nav { ... }`
  - `<nav>` tag → `<nav class="desktop-nav">`
  - Added `@media (max-width:768px) { main { padding-top:0 !important } }` so the 64px top pad is desktop-only
- `index.html`
  - `.notif-topbar` padding: `14px 16px 14px` → `calc(14px + env(safe-area-inset-top,0px)) 16px 14px`
  - `.notif-nav` + `.notif-nav-item`: restyled to match `.vyve-bottom-nav` metrics (padding `4px 4px 0` + safe-area bottom, no fixed height, `min-height:42px` on items, `font-family:'DM Sans'`, `font-size:10px; font-weight:600`, svg 24px, `flex:1` items)
- `sw.js` cache: `vyve-cache-v2026-04-17v` → `vyve-cache-v2026-04-18a`

### Drift discovered

- **`monthly-checkin` EF version** — master.md said v13, live was v15 (now v16). Noted for next brain reconciliation.
- **`sw.js` cache version** — master.md said `vyve-cache-v2026-04-17u`, live was `-17v` at session start (now `-18a`).
- **onboarding EF** — not touched this session but worth re-checking on next full reconciliation given the pattern of undocumented version bumps.

### Lessons + rule implications

- **Rule candidate:** Any portal page with a page-level `<nav>` must use `class="desktop-nav"` so nav.js's mobile-hide rule applies. Bare `nav { }` selectors are a hidden-overlap trap. Adding as Rule 36 candidate — pending audit of other portal pages for the same pattern before codifying.
- Schema drift in EFs is caught by the real system at POST time, not at deploy time. The monthly-checkin EF hadn't been exercised end-to-end on the live schema since the `wellbeing_checkins` refactor. Consider adding a lightweight integration smoke test before onboarding Sage.
- Backlog item closed: notif-topbar safe-area was not previously tracked — add it to the "mobile polish" class of issues.

### Source of truth used

- Live Supabase project `ixjfklpckgxrwjlfsaaz`: `function_edge_logs`, `function_logs`, `information_schema.columns` for `wellbeing_checkins` / `weekly_scores` / `monthly_checkins` / `platform_alerts`
- `VYVEHealth/vyve-site` main: `wellbeing-checkin.html` (SHA 6be48c8), `index.html` (via s3url — 82KB), `nav.js` (SHA ba26124), `sw.js` (SHA 9cdcc9e)
- `platform_alerts` row `8b8f15d2-81e3-4c87-8884-ec65df9e311a`

---

## 18 April 2026 — Full System Reconciliation (Brain vs Live)

### Why

Per Rule: "VYVEBrain drift happens incrementally — root cause of past audit failures was patching master.md rather than periodically rewriting it." This session was a scheduled full rewrite: every claim in `brain/master.md` was checked against the live Supabase project (`ixjfklpckgxrwjlfsaaz`) and the live Edge Function inventory. Four material drifts were found.

### Drift fixed in this session

**1. Database triggers — 119 live, Brain said 0.**

The Brain has been telling every session that activity caps are "application-level only (log-activity EF)". This is materially untrue. The DB enforces caps, derives time fields, lowercases emails, and fans out to the activity log via triggers. Full inventory now documented in master §4:

| Family | Tables | Purpose |
|---|---|---|
| `zz_lc_email` BEFORE INS/UPD (via `vyve_lc_email()`) | 42 tables | Email canonicalisation |
| `enforce_cap_*` BEFORE INS | workouts, cardio, daily_habits, kahunas_checkins, session_views | Cap enforcement → over-cap → `activity_dedupe` |
| `counter_*` AFTER INS | same 5 | Increment per-member counters on `members` |
| `auto_time_fields_*` BEFORE INS | 6 activity tables | Derive `day_of_week`, `time_of_day` |
| `auto_iso_week_*` BEFORE INS | kahunas_checkins, wellbeing_checkins | Derive `iso_week`, `iso_year` |
| `zz_sync_activity_log` AFTER INS/UPD/DEL | 7 activity tables | Fan-out to `member_activity_log` |
| `*_updated_at` BEFORE UPD | 11 cc_* tables + push_subscriptions_native | Maintain `updated_at` |

**2. Foreign keys — 25 live, Brain said 0.**

All 25 FKs target `public.members.email` (plus 2 on `habit_library.id`). Every member-scoped table has referential integrity. Inventory now in master §4.

**3. Aggregation / admin layer — 7 tables + 11 functions + 4 cron jobs undocumented in master.**

Added 18 April (earlier session today), but not yet merged into `master.md §4`. Now fully documented, including:

- Tables: `member_stats` (17), `member_activity_daily` (99), `member_activity_log` (243), `company_summary` (3), `platform_metrics_daily` (92), `admin_users` (3), `vyve_job_runs` (1) — all **RLS-enabled with zero policies → service-role only via EFs** (now codified as Rule 33)
- Functions: `compute_engagement_score`, `compute_engagement_components`, `recompute_member_stats`, `recompute_all_member_stats`, `recompute_company_summary`, `recompute_platform_metrics`, `rebuild_member_activity_daily`, `rebuild_member_activity_daily_incremental`, `backfill_platform_metrics`, `bump_member_activity`, `vyve_refresh_daily`
- Cron jobs: `vyve_recompute_member_stats` (*/15m), `vyve_rebuild_mad_incremental` (*/30m), `vyve_recompute_company_summary` (02:00 UTC), `vyve_platform_metrics` (02:15 UTC)
- Plus `warm-ping-every-5min` keep-warm cron (previously undocumented)

**4. Edge Function inventory — 58 active, Brain master listed ~22 with stale versions.**

Version drift updated for every production EF. Missing EFs added to master §5: `admin-dashboard` v6, `cc-data` v2, `send-password-reset` v2, `warm-ping` v1, `leaderboard` v7 (plus corrected versions for `notifications` v7, `share-workout` v6, `workout-library` v4, `onboarding` v74, `wellbeing-checkin` v32, `monthly-checkin` v13, `off-proxy` v16, `certificate-serve` v15, `github-proxy` v19, `habit-reminder` v8, `streak-reminder` v8, `send-test-push` v7, `daily-report` v21, `weekly-report` v14, `monthly-report` v14, `employer-dashboard` v29, `log-activity` v19).

### New rules added to master §10

- **Rule 33:** Aggregation tables are service-role only. `member_stats`, `member_activity_daily`, `member_activity_log`, `company_summary`, `platform_metrics_daily`, `admin_users`, `vyve_job_runs` have RLS enabled with NO policies — readable only from Edge Functions running as service role. Any client-side direct access will silently return zero rows.
- **Rule 34:** Activity caps are DB-level. `enforce_cap_*` triggers block over-cap inserts and route them to `activity_dedupe`. Do not duplicate cap logic in `log-activity` EF.
- **Rule 35:** Email lowercasing is automatic. `zz_lc_email` triggers on 42 tables lowercase `member_email` on every write. Application code does not need to `.toLowerCase()` before inserting.

### Section numbering fixed

Master had three `## 12.` sections (Security, Design System, Offline). Renumbered 12/13/14, with Section 15 "On the Horizon" and Section 16 "Key URLs" shifted accordingly.

### Other corrections

- Member count: 16 → 17 (one new member since last snapshot)
- Table count: "Supabase — 61 Tables" → **68 tables**
- Function count: schema-snapshot's "15" → **31 functions in public**
- Cron count: "4 jobs" → **12 jobs**
- `generate-workout-plan` EF: Brain said "RETIRED v5" but live is v9, active — flagged for decision (delete or un-retire)
- `staging/onboarding_v67.ts` flagged as stale (live is v74) — deletion pending Dean sign-off
- `brain/schema-snapshot.md` flagged as 8 days stale (lists 36 tables) — automate or delete pending Dean sign-off
- `auth.js` version disagreement inside master.md (§3 v2.3, §12 v2.4) — flagged for reconciliation

### Items closed in `tasks/backlog.md`

- "master.md §4: correct the 'No triggers' / 'No FKs' claims (14 triggers + 24 FKs live)" — closed (actual counts 119/25, now documented)
- "master.md §4: document the aggregation layer" — closed
- "master.md §10: add Rule 33" — closed (plus Rules 34, 35)
- "Add Dean + Lewis to admin_users" — closed (3 rows present, no action needed)

### Items added to `tasks/backlog.md`

- Resolve `generate-workout-plan` EF ambiguity
- Delete `staging/onboarding_v67.ts` (or refresh)
- Refresh/automate/delete `schema-snapshot.md`
- Reconcile `auth.js` version inside master.md
- Document user-ban workflow (anthony.clickit@gmail.com orphan in auth.users)
- Archive pre-April changelog into `changelog-archive/2026-Q1.md`
- Clarified "89 dead EFs" → now ~9 one-shot migrations remaining (most were deleted in earlier cleanups)

### Artefacts

- `audits/Reconciliation report` — full drift report, action plan, and true-system-state summary
- `brain/master.md` — rewritten
- `tasks/backlog.md` — rewritten

### Source of truth used

- Live Supabase project `ixjfklpckgxrwjlfsaaz`: `list_tables`, `list_edge_functions`, `execute_sql` against `information_schema`, `pg_catalog`, `pg_policies`, `pg_indexes`, `cron.job`, `auth.users`
- `VYVEHealth/VYVEBrain` main: `brain/master.md`, `brain/changelog.md`, `brain/schema-snapshot.md`, `brain/audit_updates.md`, `tasks/backlog.md`, tree listing

---

## 18 April 2026 — Admin Dashboard + Aggregation Layer Reconciliation

### What shipped

**Admin dashboard** — Single-file HTML (`apps/admin-dashboard/admin.html`, ~1000 lines)
delivered. Supabase Auth login, six views (Overview, Trends, Activity Feed, Alerts,
Members, Companies) plus a five-tab member deep-dive modal (Overview / Timeline /
Programme / Emails / Raw). Chart.js for 30d and 60d trends. Dark+light theme. All
data access goes through a new `admin-dashboard` Edge Function (verify_jwt=false,
internal JWT validation, `admin_users` allowlist). No service key on the client.

**Aggregation layer — schema extension.** The prior session's skeleton tables
(`member_stats`, `member_activity_daily`, `company_summary`, `platform_metrics_daily`)
extended with missing columns:

- `member_stats`: added `activity_score`, `consistency_score`, `variety_score`,
  `wellbeing_score_component`, `latest_stress_score`, `latest_energy_score`,
  `programme_active`, `programme_paused_at`
- `member_activity_daily`: added `replays_count` (previously merged with sessions)
- `company_summary`: added `company_slug`, `activities_30d`
- `platform_metrics_daily`: added `total_members`, `active_users_7d`,
  `active_users_30d`, `habits_count`, `workouts_count`, `cardio_count`,
  `sessions_count`, `checkins_count`, `unresolved_alerts`
- `admin_users`: added `active` flag + `notes`; seeded Dean + Lewis.

**Aggregation functions — upgraded** (same names, backward-compatible):

- New `compute_engagement_components()` returns the 4 component sub-scores as jsonb
- `recompute_member_stats(email)` — populates all new columns; `needs_support` now
  also flags `stress <= 3` (inverted scale: 3 = very stressed)
- `recompute_company_summary()` — adds slug + 30d activities
- `recompute_platform_metrics(date)` — adds totals + per-type breakdown + alerts
- `rebuild_member_activity_daily()` — splits sessions from replays

**Source-table indexes** (16 April audit quick-wins, now done): `workouts(member_email)`,
`cardio(member_email)`, `certificates(member_email)`, `ai_interactions(member_email)`,
plus `logged_at DESC` on every activity table and `member_activity_log`.

**Backfill run:** 17 member_stats rows, 99 member_activity_daily rows,
3 company_summary rows, 91 days of platform_metrics_daily.

### Why

The admin dashboard needs sub-ms list views at 5,000+ members, which is impossible
if we scan raw tables for every query. The aggregation layer shifts list views to
pre-computed tables and reserves raw scans for the 30-day hot window on member
deep-dive only.

### Brain corrections (master.md out of date)

1. **Aggregation layer already existed** before today. A prior Claude session had
   built `member_stats`, `member_activity_daily`, `company_summary`,
   `platform_metrics_daily`, `member_activity_log` (view), six `recompute_*`
   functions, and four pg_cron schedules. None of this was in master.md, the
   changelog, or the brain at all. Today's work extended rather than recreated.
2. **"Zero triggers" rule is wrong.** master.md §4 says "activity caps enforced by
   application code only (log-activity EF)" — in reality, five `enforce_cap_*` DB
   triggers and five `counter_*` DB triggers have been running for months, along
   with `auto_time_fields_*`, `auto_iso_week_*`, and ten `cc_*_updated_at` triggers.
   14 triggers on public-schema tables, not zero. Needs a master.md pass.
3. **Foreign keys exist.** master.md §4 says "No foreign keys" — there are 24.
4. `admin_users` table already existed — we extended it with `active` + `notes`.

### Rule addition

**Rule 33: Aggregation layer is app-wide.** `member_stats`, `member_activity_daily`,
`company_summary`, `platform_metrics_daily`, `admin_users` are EF-service-role only.
RLS enabled with no policies — locked out via direct-client access. Any page or
script that needs them must go through the `admin-dashboard` EF or another
service-role EF.

---

## 17 April 2026 — Desktop Nav Parity, Script Injection Fixes, SW Cache Fix

### What shipped

**nav.js — Desktop More dropdown + avatar profile panel**
- Desktop nav (>768px) now has a "More ▾" dropdown button in the nav links bar. Reveals all secondary features grouped into: Check-Ins (Weekly, Monthly), Progress (Certificates, Leaderboard, Activity Score), Tools (Running Plan, Guides & PDFs, How-to Videos, Catch-Up).
- Avatar (top right) is now a clickable profile panel showing member name, email, Settings link, and Sign Out. Replaced the bare "Sign out" button.
- New globals: `vyveToggleNavMore(e)`, `vyveToggleAvatarMenu(e)`, `vyveCloseAllDesktop()`. Desktop overlay (#navDesktopOverlay, z-index:99) closes both panels on outside click. Escape key closes both.
- Mobile completely unchanged — still bottom nav + More bottom sheet.
- CSS rule: `@media(max-width:768px)` hides all new desktop dropdown CSS from mobile.

**Script injection corruption fixed — engagement.html, certificates.html, index.html**
- Root cause: An old `patch-*` series Edge Function (now deleted) used naive text injection to add `<script src="/offline-manager.js"></script>` to portal pages. It landed inside `<script>` blocks rather than in the `<head>`. The browser's HTML parser terminates a script block at `</script>`, silently breaking all JS after that point.
- `engagement.html`: injection was at `const [injected]avatarEl` — the auth trigger (loadPage call, 1299 bytes later) never executed. Data never loaded. Appeared as a blank/loading state.
- `certificates.html`: injection was inside the `/login.html` string — the fetch chain broke entirely. Page showed eternal loading state.
- `index.html`: injection was inside `'Content-Type'` header string in the platform-alert section — inside try/catch, so dashboard functioned normally.
- Fix: removed all three bad injections, restored correct JS, added `<script src="/offline-manager.js"></script>` in correct position before `</body>`.
- `mobile-web-app-capable` meta tag added to all three pages (was previously only `apple-mobile-web-app-capable`).

**sw.js — Cache migration removed from activate handler**
- Root cause of "loads after hard reset" bug: the sw.js activate handler was copying portal pages from old caches into the new cache during version bumps. This migrated stale/broken files forward — a hard reset bypassed the service worker entirely and fetched fresh from the network.
- Fix: activate handler now simply deletes old caches. Portal pages that are not yet in the new cache fetch from network on first visit, then are cached normally. No more stale file carryover.
- Cache version: bumped to `vyve-cache-v2026-04-17u`.

**Certificate status check (deanonbrown@hotmail.com)**
- cert_sessions_count: 27/30. cert_habits_count: 27/30. cert_workouts_count: 20/30. cert_checkins_count: 7/30. cert_cardio_count: 9/30.
- No certificates in DB yet for this account. certificates table confirmed empty. certificate-checker reads the pre-computed `cert_*_count` columns on the members table (not live session_views count).
- 3 more live session views needed to trigger The Explorer certificate.

---

## 17 April 2026 â Offline Mode: Auth Fast-Path + Data Caches

### What shipped
- **auth.js v2.4** â offline fast-path before `getSession()`: checks `navigator.onLine`, reads cached Supabase session from localStorage key `vyve_auth`, builds user object, fires `vyveAuthReady` immediately without any network call. Fixes blank screen when opening the app in airplane mode. If no cached session exists offline, redirects to login as normal.
- **offline-manager.js** â new shared file on all portal pages. Exports `window.VYVEOffline`: `showBanner(ts)`, `hideBanner()`, `disableWriteActions()`, `enableWriteActions()`. Auto-inits on load. Banner: fixed, z-index 10002, `#1B7878`, top:0 desktop / top:56px mobile. Dispatches `vyve-back-online` CustomEvent on reconnect.
- **index.html** â wired to show offline banner with last-updated time from existing `vyve_home_v2_*` cache. Hides on fresh fetch.
- **habits.html** â full `vyve_habits_cache` pattern + `data-write-action` on submit button.
- **engagement.html** â full `vyve_engagement_cache` pattern.
- **certificates.html** â full `vyve_certs_cache` pattern.
- **leaderboard.html** â full `vyve_leaderboard_cache` pattern.
- **workouts.html** â `offline-manager.js` loaded + `data-write-action` on completion-done button.
- **nutrition.html** â `offline-manager.js` loaded + `data-write-action` on 5 write buttons.
- **sessions.html** â `offline-manager.js` loaded (static data, already works offline).
- **wellbeing-checkin.html** â `offline-manager.js` loaded + both submit buttons get `data-write-action` + offline state: "Submit when back online", re-enables on `vyve-back-online`.
- **sw.js** â `offline-manager.js` added to `PRECACHE_ASSETS`, version bumped `p â q`.

### Cache key pattern
`vyve_[page]_cache` â `{ data, ts: Date.now(), email }`. TTL 24h. Always verify `cached.email === memberEmail`.

### Commit
`6b988b930d07ccdd1a7fbf414e56112c3cef0e67` â VYVEHealth/vyve-site

---

## 17 April 2026 â Phase C: Session Page Consolidation

### What shipped
- 14 session pages (7 live + 7 replay) consolidated from ~22KB each to ~1.2KB stubs
- 4 new shared files: `session-live.css`, `session-rp.css`, `session-live.js`, `session-rp.js`
- Each stub sets `window.VYVE_SESSION` config object; shared JS builds full DOM into `#session-app`
- Auth gate: `window.addEventListener('vyveAuthReady', ...)` â correct pattern from auth.js
- All VYVE brand hex replaced with CSS var tokens in both CSS files
- `podcast-live.html`: correct live stub with empty `videoId` â renders "Not streaming live" placeholder
- `sw.js`: PRECACHE_ASSETS and PORTAL_PAGES updated; session shared JS/CSS removed from PRECACHE (network-fetch always); skipWaiting made unconditional to prevent SW update stalls
- Cache bumped `l` â `p` across multiple fix commits

### Bugs fixed during rollout
| Bug | Root cause | Fix |
|-----|-----------|-----|
| Blank session pages | `vyveAuthReady` dispatched on `window` (not `document`) in auth.js | Changed to `window.addEventListener` |
| Fix not propagating on normal refresh | `skipWaiting()` chained to `cache.addAll()` â any precache failure blocked SW activation indefinitely | `skipWaiting()` now fires unconditionally |
| Fix not propagating on normal refresh (2) | session-live.js in PRECACHE_ASSETS (cache-first, no revalidation) | Removed from PRECACHE â always network-fetch |

### Key learnings
- `vyveAuthReady` is dispatched on `window`, not `document`. All pages that listen for it must use `window.addEventListener`.
- `skipWaiting()` must never be chained to precache success â a single 404 in PRECACHE_ASSETS silently blocks all future SW updates.
- Shared JS files that are actively developed should NOT be in PRECACHE_ASSETS. Use network-fetch or stale-while-revalidate instead.

### Commits (vyve-site)
- `d1aa68c` â Phase C: 14 stubs + 4 shared files
- `339f560` â Fix: window.addEventListener for vyveAuthReady
- `b5a8bdb` â Fix: remove session files from PRECACHE_ASSETS
- `74e80f7` â Fix: unconditional skipWaiting

## 17 April 2026 â Offline Root Cause Confirmed

Investigated the blank screen reported when opening the app with no signal.

**Root cause:** Auth works correctly offline (Supabase reads JWT from localStorage, no network call needed). The blank screen is caused by the `member-dashboard` Edge Function POST call failing silently with no network, with zero localStorage fallback. The HTML loads from SW cache, auth resolves, then the EF call fails and the page renders nothing.

**Not the cause:** Auth redirect. The user was NOT sent to the login page â they stayed on the dashboard page but saw no data.

**Fix scope:** Data layer only â add localStorage cache fallback to all pages that call Edge Functions. Auth offline fix is precautionary, lower priority.

**Playbook updated:** `playbooks/phase-c-offline-build.md` corrected with accurate root cause analysis and reprioritised Layer 1 (data cache) as the primary fix.

## 17 April 2026 â Phase B Semantic Colour Migration

### Changes
- **index.html**: `--track-color2:#7AC8C8` â `var(--teal-xl)` (inline style on tracks grid card)
- **nutrition.html**: 3x `linear-gradient(135deg,#1B7878,...)` â `var(--teal)` in `.save-btn`, `.empty-cta`, `.log-save-btn`
- **sw.js**: cache version bumped `k` â `l`

### Audit findings (no changes needed)
- habits.html POT_CONFIG already has correct new pot colours from a prior session â no change needed
- settings.html light-mode token overrides are intentional per-page values (not redundant) â left as-is
- workouts.html â no actionable CSS hex values found
- JS setAttribute contexts (nutrition chart SVG dots) left as hex â CSS vars cannot be used in JS attribute values

### Commit
- vyve-site: `e136376fbc7440b1f94e5fa801557bc9cbd7dca6`

## 17 April 2026 â Phase B Semantic Colour Migration

### Changes
- **index.html:** Track colours (habits/workouts/cardio/sessions) â `var(--track-*)` tokens across all inline styles, SVG stroke/fill, and CSS variable assignments. Score label `#4DAAAA` â `var(--teal-lt)`.
- **settings.html:** Removed duplicate `:root` brand token block (teal/amber/coral/fonts â already in theme.css). Difficulty colours â semantic tokens: easy `#2D9E4A` â `var(--success)`, medium `#E09B3D` â `var(--warning)`, hard + delete `#E06060` â `var(--danger)`.
- **nutrition.html:** Macro nutrient colours â brand tokens: protein `#4DAAAA` â `var(--teal-lt)`, fat `#E09B3D` â `var(--amber)`, carbs `#2D9E4A` â `var(--green)`. Applied across macro bars, legend dots, gradients, SVG chart lines.
- **habits.html:** POT_CONFIG updated with correct pot colours: mindfulness `#E09B3D` â `#5BA8D9` (`--pot-mindfulness`), social `#E06060` â `#E879A3` (`--pot-social`), sleep `#9B7AE0` â `#6366B8` (`--pot-sleep`).
- **workouts.html:** No changes (no track colour hits).
- `sw.js` cache version: k â l

### Commit
- vyve-site: `c998db430ac5232c0b09abc28444ebadea0f0905`

### Next: Phase C â Session-page template consolidation
14 `-live.html` and `-rp.html` pages â 3 shared component files.

## 17 April 2026 â Phase A Design System Token Foundation

### Context
Full UI/UX consistency audit revealed 163 unique hex colours, 118 unique font sizes, 72 unique button class names across 39 HTML pages. Phase A establishes the token foundation in `theme.css` (additive only â no page migrations).

### Changes
- Added semantic colour aliases: `--success/warning/danger` (+ soft/strong variants), `--gold/gold-soft`, `--teal-dark`
- Added 5-way activity track tokens: `--track-habits/workouts/cardio/sessions/nutrition`
- Added 5-way habit pot tokens: `--pot-movement/nutrition/mindfulness/social/sleep` â 3 new colours for mindfulness (#5BA8D9), social (#E879A3), sleep (#6366B8)
- Added spacing scale: `--space-0` through `--space-16`
- Added typography scale: `--text-2xs` through `--text-4xl`, `--leading-*`, `--weight-*`
- Added radius tokens: `--radius-sm/radius/radius-lg/radius-xl/radius-pill/radius-circle` â fixes dangling `var(--radius)` in running-plan.html + internal-dashboard/index.html
- Added shadow scale: `--shadow-sm/md/lg/glow-teal`
- Aliased `--muted: var(--text-muted)` in both dark + light theme blocks â fixes 18 dangling references across all session/replay pages
- Added `--on-accent: var(--white)` alias in both theme blocks
- Bumped `sw.js` cache version: `vyve-cache-v2026-04-15j` â `vyve-cache-v2026-04-15k`
- No page migrations performed â tokens are additive only

### Dangling refs resolved
- `var(--radius)`: running-plan.html, internal-dashboard/index.html â was 0 (sharp corners), now 10px
- `var(--radius-lg)`: running-plan.html â was 0, now 14px
- `var(--muted)`: 18 session/replay pages â was inheriting parent colour, now `--text-muted` (intended muted styling)

### Commit
- vyve-site: `e5be4f594b2ea7cb7a46cb96f92ddf8fb9013885`

### Next: Phase B â Semantic Colour Migration
Migrate index.html, settings.html, workouts.html, nutrition.html, habits.html from hardcoded hex values to design tokens. Includes `habits.html` POT_CONFIG swap to `--pot-*` tokens.

## 16 April 2026 â Full Brain Reconciliation (Deep Audit)

### Context
Full deep audit performed: all project chats reviewed, live Supabase DB inspected (61 tables, RLS policies, indexes, constraints), live repo tree analysed, key Edge Functions source-read, auth.js + sw.js + index.html analysed for security patterns. Brain was found materially outdated â master.md had drifted significantly from reality.

### master.md â Complete Rewrite
- Rewrote from scratch against live system state
- Table count corrected: 36 -> 61 (23 undocumented tables found including programme_library, shared_workouts, ai_decisions, member_notifications, push_subscriptions_native, 18 cc_* command centre tables)
- All Edge Function versions updated to match live deployed versions
- Documented all features built since last accurate sync: workout library, session sharing, in-app notifications, web push, platform monitoring, monthly check-in, nutrition setup, custom habits, skeleton timeout monitors
- Added 30 hard rules (was ~19)
- Added App Store status section
- Added nav.js injection heights reference
- Added complete file inventory for vyve-site repo
- Documented HAVEN being assigned live (Conor Warren, 15 April)
- Documented all known security issues from deep audit
- VYVE_Health_Hub.html identified as standalone demo page (182KB, no auth, not part of portal)

### Key Findings from Audit
- 0 foreign keys across all 61 tables
- 0 database triggers (activity caps are application-level only in log-activity EF)
- 5 tables missing index on member_email (workouts, cardio, certificates, shared_workouts, running_plan_cache)
- running_plan_cache has public UPDATE RLS policy (security hole)
- XSS risk in index.html via innerHTML + firstName
- platform_alerts table has RLS enabled but no policies (locked out)
- PostHog sends raw email PII
- 89 dead Edge Functions still not deleted

### Process Issue Identified
Brain drift caused by: (1) master.md getting patched incrementally, never fully rewritten; (2) some sessions updating changelog but not master; (3) new tables/features built without documentation in master; (4) emergency sessions (onboarding v67 across 4 chats) producing partial updates.

## 15 April 2026 â Android Resubmitted with Correct VYVE Icon

### Fix: Android icon rejection resolved
- **Issue:** Google Play rejected app â icon on device didn't match store listing (placeholder Capacitor X icon)
- **Fix:** Generated correct icons using `npx capacitor-assets generate --android` from `resources/icon.png` (1024x1024 VYVE logo)
- **Java:** Installed Microsoft OpenJDK 21 on Windows machine (was missing)
- **Build:** `gradlew bundleRelease` succeeded, AAB signed with `vyve-release-key.jks`
- **Submitted:** Resubmitted via Google Play Console Publishing Overview â 9 changes sent for review
- **Status:** Awaiting Google Play review (1-3 days)

## 15 April 2026 (cont.) -- Exercise search overlay layout fix

### Problem
Exercise search/picker overlay on workouts.html had three layout issues in Capacitor-wrapped PWA on iOS:
1. Header ("Back" button) and mode label ("SELECT EXERCISES") overlapping at top of screen
2. "Add X exercises" bar (.es-add-bar) hidden behind the bottom navigation bar
3. Content scrolling behind both header and footer

### Root cause
1. `.es-header` had `position:relative` with `top:56px` from a media query -- visually shifted the header down but didn't move it in the flex flow, causing overlap with `.es-body`
2. `.es-add-bar` was `position:fixed` inside `#exercise-search-view` (z-index:1000). The bottom nav (z-index:9999) sat above the overlay's stacking context, hiding the add bar
3. `.es-body` had 200px bottom padding as a workaround for the fixed add bar

### Fixes (workouts.html CSS)
- `#exercise-search-view` z-index: 1000 -> 10000 (above bottom nav at 9999)
- `#history-view` z-index: 700 -> 10000
- `.es-add-bar`: removed `position:fixed`, now a flex child with `flex-shrink:0` and safe-area bottom padding
- `.es-body` bottom padding: 200px -> 20px (add-bar now in flex flow)
- Media query: removed `.es-header` and `.hist-header` from the `top:56px` rule

### New hard rule (#35)
Full-screen overlays with their own back button must use z-index:10000+ to sit above nav.js bottom bar. Their headers do NOT need the top:56px offset.

### sw.js bumped to `vyve-cache-v2026-04-15i`
### Commit: 049c2441a315d23aa789f201e8cd1a28b6863c20

## 15 April 2026 (cont.) Ã¢ÂÂ Capacitor safe area + back button fix

### Problem
After wrapping the PWA in Capacitor for iOS/Android, three issues surfaced:
1. Mobile header (back button, logo, page label) sat behind the iOS status bar / notch Ã¢ÂÂ couldn't tap back
2. Back button showed on primary nav pages (Workouts, Nutrition, Sessions) where it shouldn't
3. Exercise search overlay and history view header were also behind the status bar

### Root cause
No page had `viewport-fit=cover` in the viewport meta, so `env(safe-area-inset-top)` returned 0. The Capacitor web view extends behind the status bar by default.

### Fixes (nav.js)
- Inject `viewport-fit=cover` into the viewport meta tag at runtime Ã¢ÂÂ covers all 39+ portal pages without touching each file
- Added `padding-top: env(safe-area-inset-top, 0px)` to `.mobile-page-header` CSS
- Changed `isHome` to `isNavPage` Ã¢ÂÂ primary nav pages (Home, Workouts, Nutrition, Sessions) now show the VYVE logo; all sub-pages show the back button

### Fixes (workouts.html)
- `.es-header` (exercise search overlay): added `padding-top: calc(14px + env(safe-area-inset-top, 0px))`
- `.hist-header` (exercise history overlay): same fix

### New rule for brain/master.md
- **Capacitor safe area:** Any new full-screen overlay (`position:fixed;inset:0`) must add `padding-top: calc(original + env(safe-area-inset-top, 0px))` to its sticky header. nav.js handles the main page header globally.

### sw.js bumped to `vyve-cache-v2026-04-15g`

### Commit: 65d8ffeab0c7c91e68b8196ad1f8d168d96688a1


## 15 April 2026 (cont.) Ã¢ÂÂ 401 redirect handling added to 6 portal pages

### Defense-in-depth: 401 redirect on auth failure
auth.js already gates pages on load (no session = redirect to login). These patches add a second safety net for the edge case where a JWT expires between auth.js checking and the page's EF fetch firing.

| Page | Patch |
|------|-------|
| certificates.html | JWT empty check + 401 redirect on member-dashboard fetch |
| index.html | 401 redirect on member-dashboard fetch (JWT check already existed) |
| leaderboard.html | JWT empty check + 401 redirect on leaderboard EF fetch |
| monthly-checkin.html | JWT empty check + 401 redirect on both POST and GET EF calls |
| running-plan.html | 401 redirect on anthropic-proxy fetch |
| wellbeing-checkin.html | 401 redirect on wellbeing-checkin EF submit |

### sw.js bumped to `vyve-cache-v2026-04-15f`

### Commit: 37784bbb5f8ead4d5b462b3f015eec53246c52bb

### Audit note
Full portal audit confirmed NO other pages have the `async async` syntax error or any other script-killing bugs. The engagement.html fix from earlier today was the only critical issue. workouts.html was a false positive Ã¢ÂÂ its only inline EF call is platform-alert (skeleton monitor); all data loading lives in external JS modules.


## 15 April 2026 Ã¢ÂÂ engagement.html critical fix + cleanup

### Bug: `async async function loadPage()` syntax error
- **Root cause:** Double `async` keyword on the `loadPage()` function declaration killed the entire `<script>` block at parse time. Every function in the block was undefined Ã¢ÂÂ page showed infinite skeleton loading.
- **Impact:** engagement.html completely broken for all members. Skeleton timeout monitor fired platform_alert but user saw no content.
- **Fix:** Removed duplicate `async` keyword.

### Cleanup: 5 dead client-side calc functions removed
- `calcStreaks`, `calcWeekStreaks`, `calcDayStats`, `calcVariety7d`, `computeEngagementScore` were copied from old client-side approach but never called Ã¢ÂÂ EF v37 computes everything server-side.
- Removed ~4,100 chars of dead code.

### Fix: 401 redirect added
- engagement.html had no auth failure handling Ã¢ÂÂ if JWT expired, page showed empty content with no guidance.
- Added JWT presence check (redirect to login if missing) and 401 status check on fetch response.

### sw.js bumped to `vyve-cache-v2026-04-15e`

### Commit: cce5d358eca4c3166b8e156ea81738ccbaef861e


## 14 April 2026 (evening) Ã¢ÂÂ App Store rejection fixes

### Apple App Store Review Response
- **Guideline 2.3.8 (Accurate Metadata):** Capacitor placeholder icon submitted by mistake. Generated full iOS icon set (15 sizes, 1024ÃÂ1024 source) from VYVE logo. Zip provided to Dean for Xcode replacement.
- **Guideline 2.5.1 (HealthKit UI disclosure):** Added "Apple Health" section to settings.html between Notifications and About sections.
  - Toggle to sync with Apple Health (reads: workouts, steps, heart rate/HRV, sleep; writes: workout completions, mindful minutes)
  - Expandable detail panel shows what data VYVE reads and writes
  - Privacy notice: "Your health data stays on your device and is never shared with your employer"
  - Wired to `window.VYVENative.requestHealthKit()` for when capacitor-plugins.js lands
  - `handleAppleHealthToggle()` JS function added
- sw.js cache bumped: `vyve-cache-v2026-04-13f` Ã¢ÂÂ `vyve-cache-v2026-04-14a`
- Commit: `9fad685` on vyve-site main

## 14 April 2026 - Operational Report Suite (11 reports)

### Reports committed to VYVEBrain/reports/
- Complete platform audit: 11 standalone reports covering Security, Backup & DR, System Health, Performance, GDPR, Onboarding Pipeline, Engagement & Retention, Financial, Enterprise Readiness, Code Quality, and Master Action Plan
- All findings grounded in live Supabase queries (61 tables, 68 RLS policies, 30 triggers, 8 crons), Edge Function code review (20 core EFs), platform_alerts (31 error records), and GitHub repo tree (67 files)
- Interactive React artifact versions created in Claude conversation for browsable UI
- Markdown versions committed to VYVEBrain/reports/ for permanent reference

### Key findings discovered during audit
- **ACTIVE INCIDENT:** Push notification crons (habit-reminder + streak-reminder) failing since 11 April - app.service_role_key JSON error
- **ACTIVE INCIDENT:** 4 JS bugs live (workouts-library.js syntax, switchTab, getTimeGreeting, showToast)
- **DISCOVERY:** platform_alerts table exists with 31 error records but has ZERO RLS policies - data invisible
- **DISCOVERY:** check-cron EF overwritten with Stuart lookup query - not checking crons
- 10 tables missing member_email indexes (workouts: 3,654 seq scans)
- Calum Denham has no workout plan (background generation failed silently)
- 19/20 core EFs have no external backup
- 4 data categories are GDPR Article 9 special category
- Both Sage members (Lewis, Kelly) are 10-11 days inactive
- 34 prioritised actions across 5 phases, 82-114 hrs total effort

## 13 April 2026 Ã¢ÂÂ Onboarding v67 + portal fixes

### onboarding v67 (Supabase Edge Function)
- Workout plan generation moved inline (was `EdgeRuntime.waitUntil` Ã¢ÂÂ external `generate-workout-plan` EF)
- Two parallel Anthropic calls for weeks 1-4 and 5-8 (16K tokens each via `callAnthropicFull`)
- `callAnthropicFull` added Ã¢ÂÂ returns `{text, stopReason}` for max_tokens detection
- Exercise library fetched from `workout_plans` table in Batch 1 alongside persona/overview
- `generateWorkoutPlan` + `writeWorkoutPlan` added inline
- Anti-hallucination instructions added to `generateProgrammeOverview` and `generateRecommendations`
- `workout_plan` stats in response JSON: `{programme_name, weeks_generated, videos_matched, videos_unmatched}`
- Decision log version tag updated to v67

### welcome.html (Test-Site-Finalv3)
- AbortController timeout: 90s Ã¢ÂÂ 150s in both `submitQuestionnaire` and `retrySubmit`
- Slow timer: 30s Ã¢ÂÂ 45s in both locations
- Slow timer text: "up to a minute" Ã¢ÂÂ "up to two minutes"

### nutrition.html (vyve-site)
- Empty state title: "Your nutrition plan is not set up yet" Ã¢ÂÂ "Your nutrition targets aren't set up yet"
- Empty state text: "Complete your onboarding..." Ã¢ÂÂ "Add your height, weight, and activity level..."

### sw.js (vyve-site)
- Cache version bumped: `vyve-cache-v2026-04-13e` Ã¢ÂÂ `vyve-cache-v2026-04-13f`

## 2026-04-13 (evening session)

### CRITICAL - Onboarding EF Recovery
- Composio workbench overwrote onboarding EF with `CONTENT_FROM_WORKBENCH` placeholder - wiped all code
- Recovered from `VYVEBrain/staging/onboarding_v67.ts` backup
- **5 fixes applied during recovery:**
  1. Missing `}` in `sendWelcomeEmail` - fetch options object wasn't closed (`]}));` -> `]})});`)
  2. `workout_plan_cache` schema mismatch - `plan_data` column renamed to `programme_json`, added `plan_duration_weeks`, `current_week`, `current_session`, `is_active`, `source`
  3. Two-phase flow restored - workout plan generation moved back to `EdgeRuntime.waitUntil()` background task (v67 had inlined it synchronously, causing slow onboarding)
  4. `workoutPlanResult` reference error - removed from success response JSON (no longer exists after waitUntil change)
  5. UTF-8 em-dash encoding - replaced all `Ã¢ÂÂ` (em-dash) characters with `-` to prevent `aÃ¢ÂÂ¬Ã¢ÂÂ` garbled text in persona reason strings
- Onboarding EF now at v71 (Supabase version counter)
- `staging/onboarding_v67.ts` confirmed to have the missing brace bug - was never a clean backup

### Lesson Learned
- **Never trust Composio workbench for EF deploys** - it can overwrite with placeholder content
- **Always keep a verified backup** of critical EFs in VYVEBrain staging
- `workout_plan_cache` table was restructured (columns renamed) after v67 was written - staging backups can go stale

### Data Changes
- Wiped TDEE data for deanonbrown@hotmail.com (testing nutrition-skipped flow)
- Deleted deanonbrown2@gmail.com test account (all tables + auth.users)

### Backlog Addition
- **Onboarding resilience: save-answers-first pattern** - save questionnaire answers to `onboarding_answers` table per section via lightweight `save-answers` EF, so if main onboarding fails the answers are preserved and can be re-run manually. Friendly error: "Your answers have been saved, your bespoke setup will be with you soon."


## 13 April 2026 Ã¢ÂÂ Light mode contrast audit + full fix across portal

### Fix: 84 hardcoded dark-theme colors converted to CSS vars across 13 pages + nav.js

**Root cause:** Pages used hardcoded `rgba(255,255,255,...)`, `#fff`, `rgba(10,31,31,...)`, and `#0A1F1F` colors instead of CSS variables from `theme.css`. These were designed for dark backgrounds and became invisible/unreadable when the light theme was active.

**Architecture finding:** `theme.css` correctly defines both light and dark variable sets. The problem was individual pages bypassing the system with inline hardcoded values.

### Files updated (15 total):
| File | Issues Fixed | Key Changes |
|------|-------------|-------------|
| `nav.js` | 15 | Entire nav component Ã¢ÂÂ desktop nav, mobile header, bottom nav, More menu. Affects ALL pages. |
| `log-food.html` | 18 | Borders, meal icons, search tabs, sheet UI, barcode scanner hints |
| `shared-workout.html` | 10 + infra | Added `theme.css` + `theme.js` links (was completely unthemed) |
| `nutrition.html` | 9 | Weight chart labels (SVG), progress bars, sheet UI, history rows, sliders |
| `index.html` | 8 | Score ring, day strips, goal checkboxes, PWA banner, track streaks |
| `habits.html` | 8 | Hero gradient, habit prompt text, buttons, spinner, submit button |
| `engagement.html` | 8 | Borders, bold text, activity log dividers |
| `settings.html` | 6 | Spinner, modal close button |
| `running-plan.html` | 6 | Spinner, info box background |
| `sessions.html` | 5 | Desktop nav bg, offline badge border |
| `nutrition-setup.html` | 3 + infra | Added `theme.css` link, toast background |
| `monthly-checkin.html` | 1 + infra | Added `theme.css` link, nav background |
| `wellbeing-checkin.html` | 1 | Nav background |
| `workouts.html` | 1 | Rest timer dismiss border |
| `sw.js` | Ã¢ÂÂ | Cache bumped to `vyve-cache-v2026-04-13d` |

### Design decisions:
- `#fff` on `var(--teal)` backgrounds (buttons, avatars) left as-is Ã¢ÂÂ white on teal has good contrast in both themes
- Barcode scanner overlay kept dark with white text Ã¢ÂÂ it's a camera UI, not page content
- Skeleton shimmer animations converted to `var(--surface)` / `var(--surface-hover)`
- SVG chart label `setAttribute('fill',...)` calls in nutrition.html converted to CSS vars

### Rule added:
**Never use hardcoded `#fff`, `rgba(255,255,255,...)`, `#0A1F1F`, or `rgba(10,31,31,...)` in portal CSS.** Always use CSS variables from `theme.css`: `var(--text)`, `var(--text-muted)`, `var(--text-faint)`, `var(--border)`, `var(--surface)`, `var(--nav-bg)`, etc. Exception: `#fff` is acceptable for text on fixed-colour backgrounds like `var(--teal)` buttons or camera overlays.

## 13 April 2026 Ã¢ÂÂ Careers page added to marketing site

### Feat: careers.html live at www.vyvehealth.co.uk/careers.html
- **Page:** 11 active roles across Advisory, Podcast, Marketing, Community, Clinical departments
- **Jobs managed via JS array** Ã¢ÂÂ Lewis can add/remove/hide roles by editing the `JOBS` array in the `<script>` block. `active: false` hides a role without deleting it.
- **Apply flow:** "Apply Now" opens candidate's email client with pre-filled subject line Ã¢ÂÂ all applications land in `team@vyvehealth.co.uk`
- **Repo:** `VYVEHealth/Test-Site-Finalv3` Ã¢ÂÂ `careers.html` committed to main
- **Note:** Original uploaded file was truncated (missing IntersectionObserver init + closing HTML tags). Reconstructed tail appended before push.

### Feat: Careers link added to footer across 8 marketing pages
- Pages updated: `index.html`, `individual.html`, `individual-platform.html`, `give-back.html`, `give-back-employers.html`, `corporate.html`, `platform.html`, `about-individual.html`
- Link added under Company column after "Terms of Service"
- 7 other pages (employers, contact, about, etc.) have different footer structures Ã¢ÂÂ Careers link not added (would need separate pass)

## 13 April 2026 Ã¢ÂÂ running_plan_cache RLS fix (401 on PATCH/POST)

### Fix: Added INSERT + UPDATE RLS policies to `running_plan_cache`
- **Root cause:** Table had only a public SELECT policy. The page (`running-plan.html`) uses the anon key (`SUPA_HDR`) for all cache operations. Reads worked, but PATCH (use_count bump) and POST (save new plan) returned 401.
- **Alert:** `auth_401_running_plan_cache` Ã¢ÂÂ Calum Denham, 14:55, running-plan.html
- **Fix:** Migration `running_plan_cache_insert_update_policies` Ã¢ÂÂ added `running_plan_cache_public_insert` (INSERT) and `running_plan_cache_public_update` (UPDATE) policies, both `TO public WITH CHECK (true)`. Appropriate because this is a shared cache (not user-specific data).
- **No portal code change needed** Ã¢ÂÂ the page already sends the correct requests, they were just being rejected by RLS.

### Triage: 4 alerts dismissed (Dean, 13:33, transient network blip)
- `network_error_member-dashboard` (CRITICAL) Ã¢ÂÂ "Failed to fetch" on dashboard `/`
- `network_error_notifications` (CRITICAL) Ã¢ÂÂ "Failed to fetch" on dashboard `/`
- `js_error` (HIGH) ÃÂ 2 Ã¢ÂÂ "Script error. at :0" on `/` and `/workouts.html`
- All 4 fired within 14 seconds for the same user (Dean). Classic connectivity blip Ã¢ÂÂ downstream JS errors are cross-origin error masking from the failed fetches. No code bug.

## 13 April 2026 Ã¢ÂÂ Command Centre: Full Supabase Wiring

### Feat: Command Centre data now persists in Supabase
Lewis's Command Centre (`admin.vyvehealth.co.uk`) was previously localStorage-only Ã¢ÂÂ clearing the browser lost all data, and Lewis and Dean couldn't share data. Now fully wired to Supabase.

### Database Ã¢ÂÂ 18 new `cc_` tables created
All tables: RLS enabled, locked to `team@vyvehealth.co.uk`, `created_by` column, `updated_at` triggers.

| Table | Module |
|-------|--------|
| `cc_clients` | Clients kanban |
| `cc_leads` | Sales Pipeline CRM |
| `cc_investors` | Investor Relations |
| `cc_partners` | Partner Network |
| `cc_tasks` | Tasks kanban |
| `cc_decisions` | Strategy Room Ã¢ÂÂ Decisions log |
| `cc_okrs` | Team OKRs |
| `cc_finance` | Finance & Funding metrics |
| `cc_revenue` | Revenue entries |
| `cc_grants` | Grants pipeline |
| `cc_posts` | Content planner |
| `cc_invoices` | Invoicing |
| `cc_sessions` | Sessions / Delivery |
| `cc_intel` | Intelligence (Agent Sync output) |
| `cc_knowledge` | Knowledge Base (SOPs, playbooks, templates) |
| `cc_documents` | Document metadata (files in Storage) |
| `cc_swot` | SWOT analysis items |
| `cc_episodes` | Podcast episodes |

### Storage Ã¢ÂÂ `cc-documents` bucket created
- Private bucket, 50MB file limit
- Allowed types: PDF, DOCX, XLSX, PPTX, TXT, CSV, images
- RLS: team@vyvehealth.co.uk only (SELECT, INSERT, DELETE)
- Files stored with UUID filename, metadata in `cc_documents` table

### Edge Function Ã¢ÂÂ `cc-data` v1 deployed
Single function handles all Command Centre data operations:
- `GET /cc-data/{table}` Ã¢ÂÂ list with optional filters (?type, ?stage, ?status, ?owner, ?quadrant)
- `POST /cc-data/{table}` Ã¢ÂÂ create record
- `PATCH /cc-data/{table}/{id}` Ã¢ÂÂ update record  
- `DELETE /cc-data/{table}/{id}` Ã¢ÂÂ delete (also removes Storage file for documents)
- `POST /cc-data/upload` Ã¢ÂÂ multipart upload Ã¢ÂÂ Storage Ã¢ÂÂ cc_documents metadata
- `GET /cc-data/signed-url/{id}` Ã¢ÂÂ 1-hour signed URL for secure file viewing
- Auth: JWT required, `team@vyvehealth.co.uk` only

### index.html Ã¢ÂÂ fully rewired (commit `eb2dc09`)
- Added `CC_API` helper functions: `ccFetch`, `ccList`, `ccCreate`, `ccUpdate`, `ccDelete`, `ccUploadFile`, `ccSignedUrl`
- Added `ccLoadAll()` Ã¢ÂÂ fetches all 18 tables in parallel on login, populates every data array
- `initApp()` converted to async Ã¢ÂÂ calls `ccLoadAll()` after auth, re-renders current page
- 20 save/delete functions converted to async Supabase calls: `saveClient`, `saveLead`, `saveInvestor`, `saveDecision`, `saveCompanyOkr`, `saveGrant`, `savePost`, `saveKbItem`, `saveFinance`, `saveRevenue`, `updateOkrPct`, `addSwot`, `removeSwot`, `removeIntelItem`, `doImportModal`, `processDocFile`, `deleteDoc`, `clearAgentData`, `removeKbItem`, `openTaskModal`
- `processDocFile()` Ã¢ÂÂ files now upload to Supabase Storage via `ccUploadFile()`, no longer stored in localStorage
- `viewDoc()` Ã¢ÂÂ now async, generates signed URL for secure file viewing/download
- `persist()` / `load()` Ã¢ÂÂ retained for UI preferences only (dark mode, Claude API key, per-member todos)
- Zero business data `persist()` calls remaining

### Result
- Lewis and Dean now share the same data Ã¢ÂÂ any record entered by either is instantly visible to the other
- Clearing browser cache no longer loses any business data
- Files uploaded to the Documents section go to Supabase Storage automatically
- Lewis can now populate clients, pipeline, OKRs, decisions etc. with confidence data won't be lost

## 13 April 2026 Ã¢ÂÂ anthropic-proxy auth fix (running-plan.html JS error)

### Fix: anthropic-proxy v14 Ã¢ÂÂ verify_jwt: false + internal JWT validation
- **Root cause:** `anthropic-proxy` had `verify_jwt: true` (Supabase gateway-level). Running-plan.html uses the old `waitForAuth` pattern Ã¢ÂÂ if auth session hadn't initialised before the user hit Generate, the fetch fell back to the anon key, which was rejected by the gateway. Browser showed `Script error. at :0` (cross-origin error masking).
- **Fix:** Switched to `verify_jwt: false` with internal JWT validation via `supabase.auth.getUser()` Ã¢ÂÂ matches the pattern used by all other VYVE Edge Functions.
- **Also added:** CORS restriction to `online.vyvehealth.co.uk` and `www.vyvehealth.co.uk` (was `*`).
- **running-plan.html:** No change needed Ã¢ÂÂ the page already tries to get a JWT from `window.vyveSupabase.auth.getSession()` and sends it. The EF now validates internally instead of at the gateway.

## 13 April 2026 Ã¢ÂÂ Brevo Email Logo + Backlog Cleanup

### Feat: VYVE logo added to all Brevo email templates
- **send-email** v20 Ã¢ÂÂ `wrap()` header updated: text "VYVE" replaced with `<img>` tag loading `https://online.vyvehealth.co.uk/logo.png` (height 36px)
- **re-engagement-scheduler** v20 Ã¢ÂÂ same `wrap()` logo update
- **certificate-checker** v18 Ã¢ÂÂ same `wrap()` logo update (notification emails only; certificate HTML documents unchanged)
- All three EFs now show the VYVE logo image in the dark header bar of every outbound email

### Backlog: Items dropped
- **Dashboard skeleton loading screen** Ã¢ÂÂ dropped (not needed now)
- **Weekly check-in slider questions** Ã¢ÂÂ dropped (monthly check-in covers this instead)
- **Brevo logo in emails** Ã¢ÂÂ completed Ã¢ÂÂ

## 13 April 2026 Ã¢ÂÂ Monthly Check-In Wiring + Habit Count Fix

### Feat: Monthly Check-In wired into portal nav
- **nav.js** Ã¢ÂÂ Monthly Check-In added to More menu (below Weekly Check-In), calendar icon
- **monthly-checkin.html** Ã¢ÂÂ new `#new-member-banner` div + `newMemberLocked` handler in init()
- **monthly-checkin EF v13** Ã¢ÂÂ `isNewMember()` function: checks `members.created_at`, blocks if member joined < 1 full calendar month ago. Returns `newMemberLocked: true` + `availableFrom: "1st May 2026"` on GET. Also guards POST submit.
- **New-member message:** "Your monthly check-in will be available from 1st [Month Year]. Complete your first full month with VYVE and we'll have your personalised report ready."
- **Model fix:** `claude-haiku-4-5-20251001` (invalid) Ã¢ÂÂ `claude-haiku-4-5` in monthly-checkin EF

### Fix: Weekly check-in habit count
- **wellbeing-checkin.html** Ã¢ÂÂ `habitsThisWeek` was counting every raw `daily_habits` row (e.g. 5 habits logged Monday = counted as 5). Fixed to count distinct `activity_date` values capped at 7 Ã¢ÂÂ max 1 per day, max 7 per week.
- Query updated: `select=id` Ã¢ÂÂ `select=activity_date`
- Count: `habits?.length` Ã¢ÂÂ `Math.min([...new Set(habits.map(h=>h.activity_date))].length, 7)`

### sw.js cache
- Bumped: `vyve-cache-v2026-04-13a` Ã¢ÂÂ `vyve-cache-v2026-04-13b`

## 13 April 2026 Ã¢ÂÂ VYVE Command Centre: Setup, Auth & Fixes

### New: Command Centre live at admin.vyvehealth.co.uk
- **What:** Lewis's internal ops dashboard (`vyve-command-centre` repo) identified, deep-dived, and brought to production-ready state
- **URL:** `admin.vyvehealth.co.uk` Ã¢ÂÂ custom domain via GoDaddy CNAME Ã¢ÂÂ GitHub Pages
- **Auth:** Replaced hard-coded login (`admin@vyve.co.uk` / `vyve2026`) with real Supabase Auth. `team@vyvehealth.co.uk` auth account activated, password set via SQL.
- **Repo:** `VYVEHealth/vyve-command-centre` (public). CNAME file committed for custom domain.

### Fixes applied to Command Centre index.html
| Fix | Detail |
|-----|--------|
| SyntaxError: doLogin undefined | HTML modal markup injected inside TEAM JS array Ã¢ÂÂ removed |
| Binary garbage blob (~750 chars) | Corrupted OKR renderer Ã¢ÂÂ removed and reconstructed |
| Missing `</script>` tag | Data script block unclosed Ã¢ÂÂ fixed |
| 8 duplicate modal blocks | All modals appeared twice Ã¢ÂÂ deduplicated |
| `ÃÂ¾(` ÃÂ 3 | Corrupted `v()` helper calls Ã¢ÂÂ fixed |
| `justify-conte"` | Truncated CSS Ã¢ÂÂ fixed to `justify-content:space-between` |
| OKR slider `oninput` | Control char + `his.value` Ã¢ÂÂ fixed to `this.value` |
| Missing amber ternary ÃÂ 3 | OKR progress bar colour Ã¢ÂÂ fixed |
| Stray `2 ` before `el2.innerHTML` | SyntaxError on line 1566 Ã¢ÂÂ removed |
| Duplicate h1 headings on all pages | Page title showed in topbar AND as h1 Ã¢ÂÂ all h1s removed from page-headers |
| Tasks page corrupt | Contained stray THREATS/SWOT/Decisions/Learnings content Ã¢ÂÂ replaced with correct kanban layout |

### Architecture notes (Command Centre)
- Single `index.html` ~120KB, vanilla JS + Chart.js, GitHub Pages
- Data in `localStorage` Ã¢ÂÂ Supabase connection planned (same DB `ixjfklpckgxrwjlfsaaz`, tables prefixed `cc_`)
- Lewis's 24 AI skills run in Claude.ai Projects (subscription) Ã¢ÂÂ Agent Sync JSON paste is the intended workflow
- Claude API key field in Settings is a placeholder Ã¢ÂÂ no API calls wired yet
- `send-password-reset` Edge Function deployed and neutered after use

## 13 April 2026 Ã¢ÂÂ iOS App Store: Build 2 Submitted (Correct VYVE Icon)

### Fix: Replaced placeholder Capacitor icon with correct VYVE logo
- **What:** Generated correct app icon from `logo512.png` using `@capacitor/assets generate --ios`
- **Icon source:** `resources/icon.png` (1024x1024px, VYVE teal V logo)
- **Build 2** archived and uploaded to App Store Connect
- **Status:** App is "Waiting for Review" with Build 1 (placeholder icon). Build 2 is uploaded and ready.
- **Next:** If Apple approves Build 1, submit 1.0.1 update immediately with Build 2 icon. If rejected, resubmit with Build 2.
- **Note:** Cannot swap builds once "Waiting for Review" Ã¢ÂÂ Apple has locked the submission.

## 13 April 2026 Ã¢ÂÂ iOS App Submitted to App Store

### Feat: VYVE Health iOS app built and submitted
- **What:** Full Capacitor iOS build completed and submitted to Apple App Store for review
- **Bundle ID:** `co.uk.vyvehealth.app`
- **Team:** VYVE Health CIC (VPW62W696B)
- **Signing:** Manual signing with Apple Distribution certificate + VYVE Health App Store provisioning profile
- **Project location:** `~/Projects/vyve-capacitor/` on Dean's MacBook Pro
- **Xcode version:** 16 on macOS Sequoia 15.7.4
- **Capabilities:** Push Notifications + HealthKit
- **Info.plist permissions added:** Camera, Photo Library, Health Share, Health Update, User Notifications
- **App Store listing:** Full description, 5 iPhone screenshots (1242x2688), 1 iPad screenshot (2064x2752), keywords, pricing (free), privacy labels, age rating, content rights, MRDP, medical device declaration all complete
- **Status:** Submitted for review Ã¢ÂÂ Apple will email on approval (typically 24-48 hours)
- **Architecture:** Remote URL loading (`https://online.vyvehealth.co.uk`) Ã¢ÂÂ portal updates live instantly, no resubmission needed

### App Store listing content
- **Subtitle:** Proactive Wellbeing Platform
- **Primary Category:** Health & Fitness
- **Secondary Category:** Lifestyle
- **Price:** Free
- **Countries:** All regions
- **Apple ID:** 6762100652

### Both platforms now submitted
- Android: `app-release.aab` submitted to Google Play (12 Apr) Ã¢ÂÂ
- iOS: Submitted to App Store (13 Apr) Ã¢ÂÂ

## 12 April 2026 Ã¢ÂÂ Android App Submitted to Google Play

### Feat: VYVE Health Android app built and submitted
- **What:** Full Capacitor Android build completed and submitted to Google Play Store for review
- **Package ID:** `co.uk.vyvehealth.app`
- **Build:** `app-release.aab` (5.77MB, 3s download time)
- **Keystore:** `vyve-release-key.jks` saved to Dean's Desktop (OneDrive). Password stored securely.
- **Key alias:** `vyve-key`
- **google-services.json:** Placed in `android/app/` Ã¢ÂÂ
- **Project location:** `C:\Users\DeanO\vyve-capacitor\`
- **Plugins (15):** app, browser, camera, filesystem, haptics, keyboard, local-notifications, network, preferences, push-notifications, screen-orientation, share, splash-screen, status-bar, capacitor-native-biometric
- **Countries targeted:** United Kingdom
- **Google Play listing:** Full description written, 4 screenshots processed, feature graphic generated (1024x500), 512px icon uploaded
- **Status:** Submitted for review Ã¢ÂÂ Google will email on approval (typically 1-3 days)
- **Architecture:** Remote URL loading (`https://online.vyvehealth.co.uk`) Ã¢ÂÂ portal updates live instantly, no resubmission needed

### Google Play Store listing content
- **Short description:** Proactive workplace wellbeing Ã¢ÂÂ Physical, Mental & Social health
- **App category:** Health & Fitness
- **Content rating:** All other app types Ã¢ÂÂ PEGI Everyone
- **Health features ticked:** Activity & fitness, Nutrition & weight management, Period tracking, Sleep management, Stress management/relaxation/mental acuity
- **Target audience:** 18+
- **Countries:** United Kingdom

### iOS Ã¢ÂÂ Pending Mac
- All pre-requisites complete. When Mac arrives: install Xcode, run `npx cap add ios && npx cap sync ios`, open in Xcode, configure signing + capabilities, build + submit.
- Estimated time once Mac available: ~2.5 hours

### Notes
- Old Kahunas app (`com.kahunas.io.VYVE`) still live on Play Store with 1 install Ã¢ÂÂ leave alone, deprecate after new app approved
- `capacitor-plugins.js` not yet added to portal Ã¢ÂÂ do this next session ("add plugins to portal")
- Health disclaimer checkbox on welcome.html Ã¢ÂÂ pending Lewis sign-off

## 12 April 2026 Ã¢ÂÂ Capacitor App Store Wrap: Pre-Mac Setup Complete

### Planning: Full Capacitor wrap mapped and config files generated
- **What:** Complete Capacitor wrap plan created for iOS App Store + Android Play Store submission
- **Plugins selected (all added now):** Push Notifications, Status Bar, Splash Screen, App, Keyboard, Haptics, Network, Browser, Share, App Launcher, Local Notifications, Preferences, HealthKit/Google Fit, Camera, Filesystem, Biometrics, Screen Orientation. RevenueCat deferred (keep payments on Stripe web).
- **Files generated:** `capacitor.config.ts`, `package.json`, `capacitor-plugins.js` (full native bridge exposing `window.VYVENative`), `ios-info-plist-additions.xml`, `android-manifest-additions.xml`, `supabase-migration-push-native.sql`, `SETUP-GUIDE.md`
- **Architecture decision:** Remote URL loading (`server.url: https://online.vyvehealth.co.uk`) Ã¢ÂÂ portal updates go live instantly without App Store resubmission

### Infrastructure: Pre-Mac setup completed
- **Supabase:** `push_subscriptions_native` table created with RLS, unique index on `(member_email, platform)`, updated_at trigger
- **Firebase:** Project "VYVE Health" created. Android app registered (`co.uk.vyvehealth.app`). `google-services.json` downloaded. iOS app registered. `GoogleService-Info.plist` downloaded.
- **Apple Developer Portal:** APNs key created ("VYVE Push Key"). Key ID: `4WSJ4XSZ58`. Team ID: `VPW62W696B`. `.p8` file downloaded. App ID `co.uk.vyvehealth.co.uk.vyvehealth.app` registered with HealthKit, Push Notifications, Associated Domains capabilities.
- **Health disclaimer:** Confirmed Section 6 of terms.html covers App Store requirements. No new page needed. Onboarding checkbox to be added (pending Lewis sign-off on wording).

### Pending: Mac required for build steps
- Install Xcode + Node.js
- `npx cap add ios && npx cap add android && npx cap sync`
- Add `capacitor-plugins.js` to vyve-site portal (Claude to commit)
- iOS build in Xcode + App Store Connect submission
- Android build in Android Studio + Google Play submission
- Estimated time once Mac arrives: ~4 hours, both platforms submitted same day

## 12 April 2026 Ã¢ÂÂ Browse Library: Your Programmes + Resume

### Feat: Paused plans section in Browse Library
- **What:** Added "Your Programmes" section at the top of the Browse Library tab showing all paused plans with a Resume button.
- **UI:** Deduplicated by programme name (shows most recently paused). Shows week progress ("Week 2 of 8") and source label ("Your bespoke plan" / "From library" / "Shared"). Confirmation modal before resuming.
- **Backend:** `workout-library` EF v3 Ã¢ÂÂ added `action: resume` POST handler. Pauses current active plan, reactivates the selected paused plan preserving `current_week` and `current_session` progress.
- **Frontend:** `workouts-library.js` Ã¢ÂÂ new `loadPausedPlans()`, `confirmResume()`, `resumeProgramme()` functions. Paused plans fetched via REST API from `workout_plan_cache` with `is_active=false`.
- **sw.js:** Bumped to `vyve-cache-v2026-04-12ab`
- **Commit:** `3fd4b23727c3fa822b84c69454d0b1b8af15f966`

### Data: PPL Power & Size Builder Ã¢ÂÂ Push B Ã¢ÂÂ Upper
- **What:** Updated `cbudzski3@gmail.com`'s active programme in `workout_plan_cache`
- **Push A** renamed to **Push** (dropped the "A") across all 8 weeks
- **Push B** replaced with **Upper Ã¢ÂÂ Chest, Back, Shoulders & Arms** across all 8 weeks
- Upper sessions designed as proper balanced upper body: chest pressing + back pulling + shoulders + biceps (hammer curls) + triceps. Exercises vary across periodisation phases. Avoids duplicating Pull day movements.

## 12 April 2026 Ã¢ÂÂ Browse Library visibility fix

### Fix: workouts.html #tab-library outside .wrap
- **Root cause:** `#tab-library` div was positioned outside `<main>` and `.wrap` in the HTML (line 545), after all the fixed-position overlays. Content rendered into DOM but was invisible Ã¢ÂÂ it sat below the fold with no scroll context, especially when `body.style.overflow` was stuck as `'hidden'` from a previous workout session.
- **Fix 1 (HTML):** Moved `#tab-library` inside `.wrap`, directly after `#tab-custom` where it belongs. Library content now inherits `.wrap` padding and participates in normal body scroll.
- **Fix 2 (JS):** Added `document.body.style.overflow = ''` at start of `init()` in `workouts-config.js`. Belt-and-braces: clears stuck overflow even when no saved session state exists to restore.
- **sw.js:** Bumped to `vyve-cache-v2026-04-12aa`
- **Commit:** `4474936db1f9ac4a5f80101390a41177e6fc4f9b`

## 12 April 2026 Ã¢ÂÂ member-dashboard v31: Server-Side Aggregation

### Change: member-dashboard EF v31 + index.html frontend update
- **What:** All streak, score, count, and goal-progress calculations moved server-side into the Edge Function
- **Why:** Response payload was growing linearly with activity history (~5KB for current members, unbounded at scale). Now fixed ~2KB regardless of history size.
- **EF changes (v31):** Ported `calcStreaks`, `calcWeekStreaks`, `calcDayStats`, `calcVariety7d`, `computeEngagementScore` from frontend JS into TypeScript. Same 11 parallel DB queries unchanged. New response shape includes `counts`, `streaks`, `checkinStreak`, `score`, `habitStrip`, `habitDatesThisWeek`, `goals`, `charity`, `daysInactive`, `daysActive30`.
- **Frontend changes (index.html):** Removed client-side calc functions. `renderDashboardData` now maps pre-computed values directly to DOM. `renderDailyCheckinStrip` updated to accept `habitStrip` + `habitDatesThisWeek` + `habitStreakCurrent`. `renderGoals` updated to accept pre-computed `goals` object.
- **Cache key bumped:** `vyve_home_cache_` Ã¢ÂÂ `vyve_home_v2_` to force invalidation of old-shape cache on all devices.
- **sw.js:** Bumped to `vyve-cache-v2026-04-12a`
- **Commit:** 8ef469cde210e65cff6eb9bc49b33c3b04cadb3c

## 11 April 2026 Ã¢ÂÂ Food Log, Settings, Weight Unit, Running Plan (Evening Session)

### Fix 5: log-food.html Ã¢ÂÂ JWT auth error + LOG FOOD button behind nav
- **Issue:** "Error logging Ã¢ÂÂ try again" on all food log entries + LOG FOOD button hidden behind bottom nav
- **Root cause 1:** `supa()` helper used `SUPA_ANON` as Bearer token Ã¢ÂÂ `nutrition_logs` RLS rejected with 401
- **Root cause 2:** `.sheet` CSS had `padding-bottom:env(safe-area-inset-bottom,0px)` Ã¢ÂÂ only accounts for iPhone notch, not the 80px nav bar
- **Fix:** `supa()` now uses `vyveSupabase.auth.getSession()` for real JWT; `.sheet` padding-bottom changed to `calc(80px + env(safe-area-inset-bottom,0px))`
- **Commit:** `e138f2e`

### Fix 6: running-plan.html Ã¢ÂÂ wrong Haiku model string
- **Issue:** Running plan generation silently failing Ã¢ÂÂ showing "Plan was too large" for all plans including small ones
- **Root cause:** Model string `claude-haiku-4-5-20251001` is invalid. Correct string is `claude-haiku-4-5` (no date suffix). Anthropic returns error object Ã¢ÂÂ no `data.error` check Ã¢ÂÂ falls through as blank Ã¢ÂÂ TRUNCATED error message fires
- **Additional:** No `response.ok` check Ã¢ÂÂ HTTP errors from proxy were silently swallowed
- **Fix:** Model corrected to `claude-haiku-4-5`; added `response.ok` check and `data.error` check so real errors surface
- **Commit:** `1b86b43`
- **Brain update:** Correct Anthropic model strings table added to master.md (section 9)

### Fix 7: settings.html Ã¢ÂÂ remove height/weight unit toggles + fix privacy link
- **Removed:** Entire "Units" section (Weight kg/lbs/stone + Height cm/ft toggles), `setUnits()` JS function, both `data-units-weight`/`data-units-height` init blocks, `.units-group` + `.units-btn` CSS Ã¢ÂÂ 3,929 chars total
- **Why:** Unit toggles were saving to `members.weight_unit`/`members.height_unit` but nothing was reading those values. Unit preference is now managed within `nutrition.html` TDEE recalculator only.
- **Privacy link fixed:** `privacy.html` Ã¢ÂÂ `privacy-policy.html`
- **Commit:** `73dc197`

### Feat: nutrition.html Ã¢ÂÂ weight log unit follows member onboarding preference
- **Issue:** Weight log sheet hardcoded to 'kg' regardless of member's unit preference. TDEE recalculator unit choice not persisted between sessions.
- **Fix (6 changes):**
  1. `weight_unit` added to members SELECT query
  2. `saveTargets()` PATCH now includes `weight_unit: rcState.wtUnit`
  3. `memberData` in-memory object updated with `weight_unit` after save
  4. `openSheet()` inits `sheetWtUnit` from `memberData.weight_unit` Ã¢ÂÂ localStorage fallback Ã¢ÂÂ 'kg'
  5. `localStorage.setItem('vyve_weight_unit')` written on TDEE save
  6. `prefillRecalc()` calls `setWtUnit(savedWtUnit)` so recalculator opens in saved unit
- **Commit:** `7cfbe91`

### sw.js cache progression today
`r` Ã¢ÂÂ `s` Ã¢ÂÂ `t` Ã¢ÂÂ `u` Ã¢ÂÂ `v` Ã¢ÂÂ `w` Ã¢ÂÂ `x` (final: `vyve-cache-v2026-04-11x`)

### Hard rules added (31Ã¢ÂÂ34)
See master.md section 8 for full rules.

---

## 11 April 2026 Ã¢ÂÂ Platform Alert Fixes + Full Portal Auth Audit

### Context
Platform monitoring (deployed yesterday) began firing alerts. Three distinct issues identified from live alerts plus one discovered during the subsequent full 38-page portal audit.

### Fix 1: index.html Ã¢ÂÂ PostHog SyntaxError (CRITICAL)
- **Alert:** `js_error` Ã¢ÂÂ `SyntaxError: Unexpected token ','` at `index.html:305`
- **Root cause:** PostHog init on line 305 had literal `+ POSTHOG_KEY +` placeholder instead of the real key Ã¢ÂÂ invalid JS syntax
- **Impact:** Entire dashboard JavaScript blocked for all members on every page load
- **Fix:** Replaced `posthog.init( + POSTHOG_KEY + ,{...})` with real key `phc_8gekeZglc1HBDu3d9kMuqOuRWn6HIChhnaiQi6uvonl`
- **Commit:** `0d66099`

### Fix 2: tracking.js Ã¢ÂÂ Session views using anon key as Bearer (CRITICAL)
- **Alert:** `auth_401_session_views` on `/yoga-live.html` for `stuwatts09@gmail.com`
- **Root cause:** `tracking.js` built headers with `Authorization: Bearer SUPABASE_ANON` (anon key). RLS on `session_views` and `replay_views` requires authenticated JWT Ã¢ÂÂ anon key rejected with 401
- **Impact:** All 13 live and replay pages (yoga-live, mindfulness-live, workouts-live, checkin-live, therapy-live, education-live, events-live, podcast-live + all -rp equivalents) failing to log session views
- **Fix:** Replaced static headers constant with `async getHeaders()` function that fetches real user JWT via `window.vyveSupabase.auth.getSession()`, falls back to anon only if session unavailable
- **Commit:** `5adf652`

### Fix 3: nutrition-setup.html Ã¢ÂÂ Auth race condition (CRITICAL)
- **Alert:** `auth_401_members` on `/nutrition-setup.html` for Dean and Stuart
- **Root cause:** `window.addEventListener('load', () => { if (window.vyveCurrentUser) init(); })` fired before `vyveSupabase` was confirmed set Ã¢ÂÂ `supa()` helper fell back to anon key, which has no RLS permission to read/write `members`
- **Fix:** Removed the racing `window.load` fallback. `init()` now fires exclusively via `document.addEventListener('vyveAuthReady', ...)` which fires only after session confirmed
- **Commit:** `43319306`

### Fix 4: running-plan.html Ã¢ÂÂ anthropic-proxy rejecting anon key (HIGH Ã¢ÂÂ discovered in audit)
- **No alert fired** (EF silently rejected, no DB write to trigger alert)
- **Root cause:** `running-plan.html` called `anthropic-proxy` with `Authorization: Bearer SUPA_KEY` (anon key). `anthropic-proxy` has `verify_jwt: true` Ã¢ÂÂ rejects anon key
- **Impact:** Running plan generation broken for all members since `verify_jwt: true` was added to anthropic-proxy during security audit
- **Fix:** PROXY_URL fetch now uses async IIFE to get real JWT from `window.vyveSupabase.auth.getSession()` before sending request
- **Commit:** `a09a5a5`

### sw.js cache bumps
- `vyve-cache-v2026-04-11s` Ã¢ÂÂ after first three fixes
- `vyve-cache-v2026-04-11t` Ã¢ÂÂ after running-plan fix

### Full 38-page portal audit results
- **38 files audited** (36 HTML pages + auth.js + sw.js)
- **0 remaining issues** after today's fixes
- **32 pages clean** Ã¢ÂÂ correct auth patterns confirmed
- **6 informational** Ã¢ÂÂ public/infrastructure files (login, set-password, consent-gate, offline, auth.js, sw.js)
- Leaderboard warning was false positive Ã¢ÂÂ `getJWT()` correctly used in `loadLeaderboard()`
- nutrition-setup.html still shows minor flag (window.load present alongside vyveAuthReady) Ã¢ÂÂ resolved by Fix 3

### Hard rules added (28, 29, 30)
See master.md section 8 for full rules.

---

## 11 April 2026 Ã¢ÂÂ Nutrition Setup Flow + Full Onboarding Data Completeness

### New: nutrition-setup.html
- Created standalone portal page for members who selected "Maybe later" on nutrition during onboarding
- Empty state on `nutrition.html` now links to `/nutrition-setup.html` instead of dead `/onboarding_v8.html`
- Page matches onboarding nutrition section exactly: diet satisfaction slider, activity life-cards, nutrition goal, height/weight with unit toggles, full TDEE preview (maintenance + target + optional harder deficit slider + final target box), nutrition guidance level
- Auth-gated, respects dark/light theme via `theme.js`
- On submit: PATCHes `members` table with `tdee_maintenance`, `tdee_target`, `deficit_percentage`, `height_cm`, `weight_kg`, `activity_level`, `goal_focus`, `baseline_diet`, `age`, `dob`
- DOB input pre-filled from `members.dob` on load; age computed live from DOB for TDEE accuracy
- "Skip for now" link returns to `nutrition.html`

### Fixed: Supabase anon key rotation
- `nutrition-setup.html` was using old expired anon key (iat: 1740580304) causing "Invalid API key" save error
- Updated to current valid key (iat: 1775066495)

### Fix: `baseline_diet` check constraint
- `baseline_diet` column has `>= 1 AND <= 10` constraint; slider min was 0 (to achieve 50% position) causing saves to fail
- Fixed: only write `baseline_diet` if value >= 1

### Fix: Diet satisfaction slider centering
- Changed `min="1"` to `min="0"` so value=5 sits at exactly 50% of the track

### Fix: Nav overlap on mobile
- Added `@media(max-width:768px)` padding override to clear the 56px top header and 80px bottom nav injected by `nav.js`

### New: DOB stored, age computed dynamically
- Added `dob date` column to `members` table
- Created `member_age(dob date)` SQL function Ã¢ÂÂ computes current age from DOB in any query
- Onboarding EF v57 now stores `dob` from form submission; removed static `age` write
- Age in TDEE calculation is now always accurate and updates automatically on birthdays without cron jobs
- Backfilled `age` integer for all 11 existing members manually
- Set Dean's DOB: 1991-02-06

### New: All onboarding questionnaire fields now persisted (onboarding EF v56 Ã¢ÂÂ v57)
DB migration added 7 new columns to `members`:
- `training_goals` text Ã¢ÂÂ comma-separated training goals array
- `barriers` text Ã¢ÂÂ barriers to exercise
- `sleep_hours_range` text Ã¢ÂÂ sleep duration choice (e.g. "7-8 hours")
- `sleep_help` text Ã¢ÂÂ sleep help preferences
- `social_help` text Ã¢ÂÂ social help preferences
- `nutrition_guidance` text Ã¢ÂÂ guidance level preference
- `location` text Ã¢ÂÂ member city/area

welcome.html payload updated to include 3 previously missing fields:
- `sleepHours`, `bedtime`, `heightUnit`

Onboarding EF now writes all previously missing fields:
- `training_goals`, `barriers`, `sleep_hours_range`, `sleep_bedtime`, `sleep_help`, `social_help`, `nutrition_guidance`, `location`, `weight_unit`, `height_unit`

Previously fixed in v55/v56: `age`, `goal_focus`, `tdee_maintenance`, `deficit_percentage`, `support_areas`, `support_style`, `motivation_help`

### Onboarding EF version history (11 April 2026)
- v55: Added age, goal_focus, tdee_maintenance, deficit_percentage, support_areas, support_style, motivation_help
- v56: Added all remaining questionnaire fields (training_goals, barriers, sleep_hours_range, sleep_bedtime, sleep_help, social_help, nutrition_guidance, location, weight_unit, height_unit)
- v57: Replaced static age write with dob date storage; computeAge() function added to EF

### SW cache
- Bumped through `j` Ã¢ÂÂ `r` during this session. Current: `vyve-cache-v2026-04-11r`

---

## 2026-04-11 (Leaderboard Auth Fix)

### Summary
`leaderboard.html` had `getJWT()` referencing `window._supabase` which doesn't exist. Auth.js exposes the Supabase client as `window.vyveSupabase`. The JWT call silently failed (caught by try/catch returning null), so the leaderboard edge function received no valid authentication and couldn't identify the caller for ranking.

### Fix
- `leaderboard.html` Ã¢ÂÂ changed `window._supabase` to `window.vyveSupabase` in `getJWT()`
- `sw.js` Ã¢ÂÂ cache bumped to `vyve-cache-v2026-04-11i`

### Rule Added
- All portal pages must use `window.vyveSupabase` for auth Ã¢ÂÂ never `_supabase`, `_sb`, or other aliases. grep for non-standard Supabase client references after any auth refactor.

---

## 11 April 2026 Ã¢ÂÂ Platform Monitoring System

### Built
- **`platform_alerts` table** Ã¢ÂÂ central alert storage (severity, type, source, member, dedup indexes, RLS service-role only)
- **`platform-alert` Edge Function v1** Ã¢ÂÂ receives alerts, deduplicates (same type + member within 1hr), sends Brevo email to Dean + Lewis, sends VAPID push to subscribed devices
- **Client-side Platform Monitor** (added to `auth.js`) Ã¢ÂÂ catches:
  - JS runtime errors (`window.onerror`)
  - Unhandled promise rejections
  - API 401s and 500s (fetch interceptor on all Supabase calls)
  - Network failures on API calls
  - Page load timeouts (app container not visible after 15s)
  - PWA not installed after 7 days of use
  - Exposes `window.vyveAlert(type, severity, details)` for manual reporting from page code
- **sw.js cache bumped** `v2026-04-11i` Ã¢ÂÂ `v2026-04-11j`

### Commits
- `vyve-site` 16eeb3e Ã¢ÂÂ auth.js monitor + sw.js cache bump

### Architecture decisions
- Monitor added to `auth.js` (not a separate file) since it's already loaded on every portal page
- `fetch()` interceptor pattern Ã¢ÂÂ wraps native fetch to monitor all Supabase API calls without modifying individual pages
- Deduplication both client-side (per session) and server-side (per type+member per hour) to prevent alert fatigue
- `platform-alert` EF is `verify_jwt: false` with CORS restriction Ã¢ÂÂ client-side can't send API keys, CORS is sufficient protection

### Outstanding monitoring items
- Health check cron EF (proactive service monitoring every 30 min) Ã¢ÂÂ not yet built
- Server-side error reporting in critical EFs (member-dashboard, wellbeing-checkin, log-activity, onboarding) Ã¢ÂÂ not yet wired
- Alert dashboard page (alerts.html or section on strategy.html) Ã¢ÂÂ not yet built


## 2026-04-11 (Audit Collateral Ã¢ÂÂ Certificates + Engagement Pages Fixed)

### Summary
Two more portal pages were broken by the security audit's removal of the `?email=` fallback from `member-dashboard`. Both `certificates.html` and `engagement.html` were calling the edge function with NO auth header at all Ã¢ÂÂ no `getJWT()` function existed on either page. After the audit enforced JWT-only auth on `member-dashboard`, both pages returned 401 on every load.

### Root Cause
When `member-dashboard` v29 removed the `?email=` fallback (Fix 2 in the audit), `index.html` was updated to use JWT auth. But `certificates.html` and `engagement.html` also call the same edge function and were NOT updated. They had no `getJWT()` helper and no `vyveSupabase` reference.

### Fixes Applied
- `certificates.html` Ã¢ÂÂ added `getJWT()` helper, replaced unauthenticated fetch with JWT-authenticated fetch
- `engagement.html` Ã¢ÂÂ same fix
- `sw.js` Ã¢ÂÂ cache bumped to `vyve-cache-v2026-04-11h`

### Pages Verified Safe
- `monthly-checkin.html` Ã¢ÂÂ already sends JWT Ã¢ÂÂ
- `nutrition.html`, `settings.html`, `log-food.html` Ã¢ÂÂ use `?email=` as REST API filter (PostgREST WHERE clause), not as EF auth. JWT sent correctly Ã¢ÂÂ
- `running-plan.html` Ã¢ÂÂ uses ANON key but `running_plan_cache` has `public_read` RLS policy Ã¢ÂÂ

### Rule Added
- When changing auth on an Edge Function, **grep all portal pages** for calls to that function. Every caller must be updated, not just the main dashboard.

---

## 2026-04-11 (Critical Bug Fix Ã¢ÂÂ Dashboard Stats Not Rendering)

### Summary
Fixed a JavaScript scoping bug in `index.html` that prevented dashboard stats from rendering for all users. Caused by the security audit refactor on the same day.

### Root Cause
The security audit refactor changed `email` from a script-level variable to `const email` inside `onAuthReady()`. The `loadDashboard()` function (defined at script scope) still referenced `email` on the `writeHomeCache(email, data)` call. Since `const` is block-scoped, `email` was undefined in `loadDashboard()`, causing a `ReferenceError`. The try/catch caught it and displayed "Could not connect. Please refresh." instead of rendering the dashboard data.

The edge function (`member-dashboard` v34) was returning 200 with correct data Ã¢ÂÂ the bug was purely frontend.

### Fix Applied
- `index.html` Ã¢ÂÂ changed `writeHomeCache(email,data)` to `writeHomeCache((window.vyveCurrentUser&&window.vyveCurrentUser.email)||'',data)` (commit 3b5dedf5)
- `sw.js` Ã¢ÂÂ cache bumped to `vyve-cache-v2026-04-11g` to force PWA refresh

### Files Changed
| File | Change |
|------|--------|
| `index.html` | Fixed email variable scope in `loadDashboard()` |
| `sw.js` | Cache bumped `v2026-04-11f` Ã¢ÂÂ `v2026-04-11g` |

### Rule Added
- When refactoring variable scope (var/let/const), always check all functions that reference the variable Ã¢ÂÂ not just the function where it's declared. `const` and `let` are block-scoped; `var` is function-scoped.

---

## 2026-04-11 (Security Remediation Ã¢ÂÂ Complete)

### Summary
Full security remediation executed across all 8 fixes identified in the 2026-04-11 audit. All critical and high-priority vulnerabilities resolved. Platform is now production-secure.

### Edge Functions Updated

| Function | Version | Change |
|----------|---------|--------|
| `github-proxy` | v15 | Added `x-proxy-key` header auth (GITHUB_PROXY_SECRET), CORS restricted to `online.vyvehealth.co.uk` |
| `member-dashboard` | v29 | Removed `?email=` query param fallback entirely, JWT-only auth enforced |
| `onboarding` | v57 | CORS restricted to `https://www.vyvehealth.co.uk`, ONBOARDING_SECRET check removed (Option A Ã¢ÂÂ static site can't safely hold secrets) |
| `send-email` | v16 | CORS restricted, service-role-key auth on HTTP handler, model fixed from `claude-sonnet-4-5` Ã¢ÂÂ `claude-sonnet-4-20250514` |
| `employer-dashboard` | v26 | Unauthenticated fallback code path removed, hard fail if EMPLOYER_DASHBOARD_API_KEY not configured |

### Portal Files Updated (vyve-site)
- `index.html` Ã¢ÂÂ removed `?email=` param and hardcoded fallback email `deanonbrown@hotmail.com` from member-dashboard fetch call
- `sw.js` Ã¢ÂÂ cache bumped to `vyve-cache-v2026-04-11a`

### Marketing Site Updated (Test-Site-Finalv3)
- `welcome.html` Ã¢ÂÂ removed `ONBOARDING_KEY` declaration and `x-onboarding-key` header from onboarding fetch call (Option A Ã¢ÂÂ placeholder was non-functional in static context)

### Database Changes
- **Fix 6** Ã¢ÂÂ `session_chat` INSERT policy `with_check` confirmed correct, no change needed
- **Fix 7** Ã¢ÂÂ Dropped 20 redundant per-operation RLS policies across 7 tables (`cardio`, `daily_habits`, `workouts`, `session_views`, `replay_views`, `weekly_scores`, `wellbeing_checkins`). Each now has exactly 1 `ALL` policy.
- **Fix 8** Ã¢ÂÂ Dropped 2 duplicate indexes on `exercise_notes` (`exercise_notes_member_idx`, `idx_exercise_notes_member`). `weekly_scores_member_week_unique` retained Ã¢ÂÂ it's a real unique constraint.

### Secrets Set in Supabase Dashboard
- `GITHUB_PROXY_SECRET` Ã¢ÂÂ protects github-proxy write access
- `ONBOARDING_SECRET` Ã¢ÂÂ set but unused (Option A decision)
- `EMPLOYER_DASHBOARD_API_KEY` Ã¢ÂÂ required for employer dashboard access

### Architecture Decision Ã¢ÂÂ Option A (Onboarding Secret)
The `ONBOARDING_SECRET` pattern was abandoned because `welcome.html` is a static GitHub Pages file Ã¢ÂÂ any secret embedded in it is publicly readable. CORS restriction to `https://www.vyvehealth.co.uk` is the correct and sufficient protection for a public-facing onboarding form at current scale.


---

## 2026-04-11 (Full System Audit)

### Summary
Full system audit completed across all layers: architecture, Supabase, Edge Functions, frontend, security, performance. 5 critical vulnerabilities identified, remediation plan created, backlog updated.

### Critical Findings
- **github-proxy** Ã¢ÂÂ zero authentication, allows unauthenticated read/write to private repo (FIX 1)
- **member-dashboard** Ã¢ÂÂ `?email=` fallback exposes member data without JWT (FIX 2)
- **onboarding** Ã¢ÂÂ CORS `*`, no payment verification, creates auth users from public internet (FIX 3)
- **send-email** Ã¢ÂÂ open email relay from `team@vyvehealth.co.uk` (FIX 4)
- **employer-dashboard** Ã¢ÂÂ API key secret not set, unauthenticated fallback active (FIX 5)

### Additional Findings
- `send-email` has invalid model name (`claude-sonnet-4-5`) Ã¢ÂÂ will cause re-engagement failures
- `session_chat` INSERT policy allows impersonation (`with_check: true` instead of `auth.email() = member_email`)
- 6 tables have duplicate RLS policies (ALL + per-operation) from previous security audit debugging
- Duplicate indexes on `weekly_scores` and `exercise_notes`
- `ai_decisions` INSERT policy overly permissive

### What's Good (Confirmed)
- All 39 tables have RLS enabled Ã¢ÂÂ
- Brain repo accurate against live state Ã¢ÂÂ
- Onboarding v48 well-built (stress scale, FK race, decision logging) Ã¢ÂÂ
- Auth.js consent gate working correctly Ã¢ÂÂ
- Database indexes well-placed for current query patterns Ã¢ÂÂ

### Outputs
- `VYVE_Full_System_Audit_2026-04-11.md` Ã¢ÂÂ complete audit report
- `VYVE_Remediation_Plan_2026-04-11.md` Ã¢ÂÂ step-by-step implementation for 11 fixes
- `tasks/backlog.md` Ã¢ÂÂ updated with security section at top

### Brain Updates
- `tasks/backlog.md` updated with Ã°ÂÂÂ´ Security section

### Rules Added
- github-proxy requires `GITHUB_PROXY_SECRET` header (after fix deployed)
- member-dashboard: JWT-only auth, no `?email=` fallback (after fix deployed)
- onboarding: CORS restricted to `www.vyvehealth.co.uk` + `ONBOARDING_SECRET` header (after fix deployed)

## 2026-04-11 (Daily Sync)

### Summary
Full session: Layer 2 Web Push (VAPID) implemented end-to-end and confirmed working on iOS. Notifications redesigned from slide-up sheet to full-screen themed page.

### Completed
- **VAPID Web Push (Layer 2)** Ã¢ÂÂ P-256 key pair generated, `vapid.js` created (triggers on bell tap for iOS gesture compliance), `sw.js` push + notificationclick handlers added, `habit-reminder` v4 + `streak-reminder` v4 updated with RFC 8291 AES-GCM encryption using Deno Web Crypto only. `send-test-push` v4 confirmed working on iOS.
- **`VAPID_PRIVATE_KEY` secret** set in Supabase by Dean.
- **Notifications full-screen page** Ã¢ÂÂ replaced slide-up sheet with solid full-screen page: back arrow top left, clear-all bell top right, bottom nav bar, `var(--bg)` background (theme-aware), unread items highlighted.
- **Daily report** run manually for Friday 10 April: 5 activities, 2 new members.
- **sw.js cache** bumped to `vyve-cache-v2026-04-10aa`.

### Key Architecture Decisions
- iOS push permission must be triggered from a user gesture (bell tap) Ã¢ÂÂ not page load
- `esm.sh` library imports fail in Supabase Edge Functions Ã¢ÂÂ use Deno built-in Web Crypto only for RFC 8291 encryption
- `vapid.js` loaded on `index.html` only for now; expand to other pages when Capacitor wrap is underway

### Secrets
- `VAPID_PRIVATE_KEY` Ã¢ÂÂ set Ã¢ÂÂ
- VAPID public key: `BDbz2-0k3JcqRWKyasr3MNgEZrXhKsVvjS-otCyyV7Ya4Pi2xXOxXGETUpVoE56VorKzSNy7uyep53gOzNEMTu4`

## 2026-04-11 (Web Push encryption fix)

### fix: RFC 8291 full AES-GCM encryption Ã¢ÂÂ habit-reminder v4, streak-reminder v4, send-test-push v4

Apple's push service requires fully encrypted payloads (RFC 8291). Previous versions sent unencrypted JSON which Apple rejected with status 0. Rewrote `sendPush()` and `encryptPayload()` using Deno built-in Web Crypto only (no external libraries). Confirmed working on iOS PWA.

| Function | Version |
|----------|---------|
| `send-test-push` | v4 (confirmed working) |
| `habit-reminder` | v4 |
| `streak-reminder` | v4 |

## 2026-04-11 (Notifications Ã¢ÂÂ Layer 2 Web Push / VAPID)

### feat: VAPID Web Push Ã¢ÂÂ push handler in sw.js, vapid.js subscriber, EFs updated

**Commit:** d5937b957c63f3770bc4faa3ddbc24bb369cb904 (vyve-site)
**sw.js cache bumped:** `vyve-cache-v2026-04-10y` Ã¢ÂÂ `vyve-cache-v2026-04-10z`

#### Portal changes
- `vapid.js` (new) Ã¢ÂÂ requests push permission on auth, subscribes via `pushManager.subscribe()`, saves `{endpoint, p256dh, auth_key}` to `push_subscriptions` table. Loaded on `index.html` only.
- `sw.js` Ã¢ÂÂ added `push` event listener (shows native OS notification with icon/badge) and `notificationclick` listener (focuses or opens portal). Cache bumped to `vyve-cache-v2026-04-10z`.
- `index.html` Ã¢ÂÂ `<script src="/vapid.js"></script>` added before `nav.js`.

#### Edge Functions updated
| Function | Version | Change |
|----------|---------|--------|
| `habit-reminder` | v2 | After in-app write, fetches `push_subscriptions` for member Ã¢ÂÂ fires VAPID push if present. VAPID JWT signed with P-256 + VAPID_PRIVATE_KEY secret. |
| `streak-reminder` | v2 | Same VAPID dispatch pattern added. |

#### VAPID keys
- **Public key** (embedded in `vapid.js` and EFs): `BDbz2-0k3JcqRWKyasr3MNgEZrXhKsVvjS-otCyyV7Ya4Pi2xXOxXGETUpVoE56VorKzSNy7uyep53gOzNEMTu4`
- **Private key** Ã¢ÂÂ must be set as Supabase secret: `VAPID_PRIVATE_KEY` = `nlaC3bzFXVUOGj1lq46Uu94LzDZGJh6MA0ObeaPIU74` Ã¢ÂÂ Ã¯Â¸Â **Dean: set this secret before push will work**

#### iOS note
Web Push requires PWA installed to home screen on iOS (Safari 16.4+). Android Chrome works with no install required.

## 2026-04-11 (Notifications system Ã¢ÂÂ Layer 1)

### feat: in-app notifications Ã¢ÂÂ bell badge, slide-up sheet, 5 Edge Functions

**Commit:** f0f252f1c6421626a86135c77755cf42045aed9f
**sw.js cache bumped:** `vyve-cache-v2026-04-10x` Ã¢ÂÂ `vyve-cache-v2026-04-10y`

#### Supabase
- New table: `member_notifications` (id, member_email, type, title, body, read, created_at) + RLS (auth.email() = member_email) + lookup index
- New table: `push_subscriptions` (id, member_email, endpoint, p256dh, auth_key) + RLS Ã¢ÂÂ Layer 2 scaffold, no logic yet

#### Edge Functions deployed
| Function | Version | Change |
|----------|---------|--------|
| `notifications` | v1 (new) | GET Ã¢ÂÂ unread count + list (last 50). POST mark_read (one or all). JWT-verified. |
| `log-activity` | v12 | Writes streak milestone notifications (7/14/30/60/100 days) after successful insert via waitUntil(). Per-milestone dedup (fires once ever per milestone value). |
| `wellbeing-checkin` | v26 | Writes check-in confirmation notification after submission via waitUntil(). Deduped per day. |
| `habit-reminder` | v1 (new) | Cron 20:00 UTC daily. Finds members with no habit logged today Ã¢ÂÂ writes in-app notification. Layer 2 push extension point. |
| `streak-reminder` | v1 (new) | Cron 18:00 UTC daily. Finds members with streak Ã¢ÂÂ¥ 7 and no activity today Ã¢ÂÂ writes in-app notification. Layer 2 push extension point. |

#### Cron schedules registered
- `habit-reminder-daily` Ã¢ÂÂ `0 20 * * *` (8pm UTC)
- `streak-reminder-daily` Ã¢ÂÂ `0 18 * * *` (6pm UTC)

#### Portal Ã¢ÂÂ index.html
- Bell button (`#mob-bell-btn`): added `position:relative` to CSS, replaced `href='#notifications'` with `onclick="openNotifSheet()"`
- Badge span (`#notif-badge`): absolutely positioned on bell, `var(--accent,#e84393)` background, hidden when count = 0
- Notification sheet: slide-up overlay, `var(--card-bg)` background, `var(--text)`/`var(--text-muted)` text Ã¢ÂÂ fully theme-aware light/dark
- Unread dot per item: `var(--accent)` colour, fades out on read
- Mark-all-read fires on sheet open (non-blocking fetch)
- Count polls on `vyveAuthReady` event + every 5 minutes

#### Layer 2 readiness
- `push_subscriptions` table created (empty)
- Both cron EFs have a clearly marked Layer 2 extension point for VAPID push dispatch
- `sw.js` push handler will be a ~10 line addition when Capacitor push permission is wired

---

## 2026-04-11 (nav overlap fixes + settings overhaul)

### fix: content hidden under nav on 3 portal pages

**Files:** `workouts.html`, `log-food.html`, `sessions.html`, `sw.js`
`sw.js` cache bumped: `vyve-cache-v2026-04-10n` Ã¢ÂÂ `vyve-cache-v2026-04-10o`

Full audit of all 15 portal pages against nav.js injection (56px mobile header, 80px bottom nav, z-index 9999).

**workouts.html** Ã¢ÂÂ sticky sub-view headers (`.es-header`, `.sh-header`, `.prs-header`, `.hist-header`) had `top:0`, sitting under the 56px mobile nav on scroll. Added:
```css
@media(max-width:768px){ .es-header,.sh-header,.prs-header,.hist-header{top:56px} }
```

**log-food.html** Ã¢ÂÂ internal `.top-bar` (`position:sticky;top:0`) clipped under mobile nav. Added:
```css
@media(max-width:768px){ .top-bar{top:56px} }
```

**sessions.html** Ã¢ÂÂ duplicate `.mob-page-header` CSS block (`position:sticky;top:0`) was dead code; nav.js injects the real element. Removed the block entirely.

**Clean pages (no changes needed):** `index`, `habits`, `nutrition`, `settings`, `wellbeing-checkin`, `certificates`, `engagement`, `leaderboard`, `running-plan`, `login`, `set-password`.

---

### fix(settings): habits modal Ã¢ÂÂ save button buried under bottom nav + no close button

**Files:** `settings.html`, `sw.js`
`sw.js` cache bumped: `vyve-cache-v2026-04-10o` Ã¢ÂÂ `vyve-cache-v2026-04-10p`

**Root cause:** `.modal-overlay` had `z-index:1000`; bottom nav is `z-index:9999`. Modal rendered *under* the nav.

- `.modal-overlay` z-index: `1000 Ã¢ÂÂ 10001` (above nav) Ã¢ÂÂ applied to both habits and persona modals
- `.modal-sheet` converted to `display:flex; flex-direction:column` Ã¢ÂÂ enables sticky footer
- `.modal-cta` (Cancel / Save buttons) now `position:sticky; bottom:0` Ã¢ÂÂ always visible regardless of list length
- Habits list wrapped in `.modal-body` (`flex:1; overflow-y:auto`) Ã¢ÂÂ scrollable content area
- Added Ã¢ÂÂ close button to header of both habits modal and persona modal
- Sheet padding moved from shorthand to `padding:20px 20px 0` with CTA handling its own bottom safe-area

---

### fix(settings): persona modal closes before save + AI reasoning Ã¢ÂÂ clean bestFor snippets + cache-first load

**Files:** `settings.html`, `sw.js`
`sw.js` cache bumped: `vyve-cache-v2026-04-10p` Ã¢ÂÂ `vyve-cache-v2026-04-10q`

**Bug 1 Ã¢ÂÂ modal closes on tap inside sheet:**
Added `onclick="event.stopPropagation()"` to `.modal-sheet` on both modals. Touch events no longer bubble up to the overlay, so only tapping the dark backdrop closes the modal.

**Bug 2 Ã¢ÂÂ verbose AI reasoning replaced with clean "Best for" snippet:**
- Removed `ai_decisions` Supabase fetch from page load (one fewer round trip)
- "Why this coach was chosen" label Ã¢ÂÂ "Best for"
- Box is now always visible (was `display:none` until DB returned)
- Each persona now has a `bestFor` field in the JS `PERSONAS` object:
  - **NOVA** Ã¢ÂÂ People driven by targets who want every session to count
  - **RIVER** Ã¢ÂÂ Anyone managing stress, burnout, or poor sleep
  - **SPARK** Ã¢ÂÂ People who struggle with consistency and need an energetic nudge
  - **SAGE** Ã¢ÂÂ Members who want to understand the science behind their choices
  - **HAVEN** Ã¢ÂÂ Anyone needing a safe, non-judgmental space for mental health

**Feature Ã¢ÂÂ settings cache-first load:**
- `populateFromCache(cache)` function fills UI instantly from `localStorage` (`vyve_settings_cache`)
- Cache TTL: 10 minutes; keyed to user email
- `waitForAuth` reads cache first Ã¢ÂÂ shows full UI immediately Ã¢ÂÂ Supabase refreshes in background
- Cache written at end of `loadProfile`; updated on persona save

---

## 2026-04-10 (leaderboard Ã¢ÂÂ live data)

### feat: leaderboard wired to live Supabase data

**Commits:** leaderboard EF v1 deployed to Supabase; vyve-site 7691280542f8

**leaderboard Edge Function v1** (new EF, verify_jwt: false, JWT-preferred auth)
- Queries `daily_habits`, `workouts`, `cardio`, `session_views` for current calendar month across all members
- Includes all members table entries (zero-activity members appear at bottom)
- Per-member counts: all activities, habits only, workouts only, streak
- **Streak:** consecutive days back from today where any activity of any type was logged
- Returns: `first_name`, plus per-metric objects (`all`, `habits`, `workouts`, `streak`) each containing `your_rank`, `total_members`, `your_count`, `above` (anonymous), `below_count`, `gap`
- All members above caller returned as anonymous Ã¢ÂÂ no names, no emails exposed

**leaderboard.html** Ã¢ÂÂ full rewrite
- Removed Sage and My team scope tabs Ã¢ÂÂ All members only
- All 4 metric tabs (All / Habits / Workouts / Streak) now live Ã¢ÂÂ switch client-side from single EF response
- Your position card, above board, gap nudge all rendered from live data
- Zero hardcoded mock data remaining
- Dynamic month label in pill (JS, not hardcoded)
- Streak tab gap nudge uses "days" unit not "activities"
- Loading state shown while EF responds; error state if EF fails

`sw.js` cache bumped: `vyve-cache-v2026-04-10m` Ã¢ÂÂ `vyve-cache-v2026-04-10n`

## 2026-04-10 (workouts modularisation)

### refactor: workouts.html Ã¢ÂÂ split inline JS into 6 modules

**Commit:** b28c2b79b6754b58bf1dda79873f94b903bae851

workouts.html was 2,117 lines / 131KB with a single 1,575-line inline `<script>` block. Every future edit had the large-file deployment problem (>10KB Composio inline limit). Split into named `<script src="...">` files Ã¢ÂÂ no bundler, no `type="module"`, no behaviour changes.

| File | Lines | Responsibility |
|------|-------|----------------|
| `workouts-config.js` | 81 | Consts, 26 globals, `getJWT`, utility functions |
| `workouts-programme.js` | 237 | Programme load/render, exercise library cache, custom workouts |
| `workouts-session.js` | 598 | Session open/close, set logging, timers, completion flow |
| `workouts-exercise-menu.js` | 269 | Exercise menus, reorder, swap/add, history view |
| `workouts-builder.js` | 153 | Custom workout builder, rest settings |
| `workouts-notes-prs.js` | 235 | Notes, PRs, sessions history, MutationObserver boot |

`workouts.html` reduced from 2,117 Ã¢ÂÂ 548 lines (CSS + HTML shell + 6 `<script src>` tags).

**Verification:** 89/89 functions present across modules. Zero missing, zero extra.

**Load order:** config Ã¢ÂÂ programme Ã¢ÂÂ session Ã¢ÂÂ exercise-menu Ã¢ÂÂ builder Ã¢ÂÂ notes-prs Ã¢ÂÂ nav.js

`sw.js` cache bumped: `vyve-cache-v2026-04-10l` Ã¢ÂÂ `vyve-cache-v2026-04-10m`

## 2026-04-10 (settings page Ã¢ÂÂ persona selector, habit manager, goals, units, ai_decisions)

### New features deployed

**settings.html** Ã¢ÂÂ major update with 4 new sections:

1. **AI Coach section** Ã¢ÂÂ shows current persona name + description. Displays why the coach was chosen, pulled from new `ai_decisions` table (falls back to `members.persona_reason`). "Change coach" bottom sheet shows all 5 personas with descriptions. HAVEN shown as coming soon. Change takes effect immediately, writes to `persona_switches` + `ai_decisions` with `triggered_by: 'self'`.

2. **Daily Habits section** Ã¢ÂÂ shows current habits as tags. "Manage habits" bottom sheet shows all 30 habits from `habit_library` grouped by pot (Sleep, Movement, Nutrition, Mindfulness, Social). Max 10 selectable. Saves to `member_habits` with `assigned_by: 'self'`. Logs to `ai_decisions`.

3. **Your Goals section** Ã¢ÂÂ 8-button grid (Lose weight, Build muscle, Improve fitness, Reduce stress, Better sleep, Build consistency, More energy, General health). Saves immediately to `members.specific_goal`. Logs to `ai_decisions`.

4. **Units section** Ã¢ÂÂ weight (kg/lbs/stone) and height (cm/ft) toggles. Saves to new `members.weight_unit` and `members.height_unit` columns.

### New infrastructure

- **`ai_decisions` table** Ã¢ÂÂ created with RLS. Columns: `id`, `member_email`, `decision_type` (persona_assigned/habit_assigned/goal_updated/persona_changed), `decision_value`, `reasoning`, `triggered_by`, `created_at`. Members can read their own rows. Service role inserts.

- **`members.weight_unit` + `members.height_unit`** Ã¢ÂÂ new columns, default 'kg' and 'cm'.

### onboarding v48 (EF version 51)

- `selectPersona()` now calls Claude to generate a specific, member-facing reasoning paragraph for every assignment Ã¢ÂÂ hard-rule or AI path. Format: "Based on your onboarding responses: [specific signals]. [Coach] is [reason]."
- `selectHabits()` now returns both `ids` and `reasoning` Ã¢ÂÂ Claude explains which profile signals drove the habit selection.
- New `writeAiDecisions()` function writes two rows to `ai_decisions` at onboarding: one for persona, one for habits.
- Response now includes `ai_reasoning` and `habit_reasoning` fields.

### sw.js
Cache bumped: `vyve-cache-v2026-04-10k` Ã¢ÂÂ `vyve-cache-v2026-04-10l`

## 2026-04-10 (onboarding Ã¢ÂÂ major bug fixes & persona logic corrections)

### Root causes fixed
Three separate bugs were silently preventing habit assignment for every new member since v44:
1. **FK race condition** Ã¢ÂÂ `writeHabits` fired in parallel with `writeMember`. When `writeHabits` beat the DB, the FK on `member_email` failed. Fixed in v44: two-stage Promise.all, `writeMember` commits first.
2. **`assigned_by: 'onboarding_ai'`** Ã¢ÂÂ check constraint on `member_habits` only allows `'onboarding'`, `'ai'`, `'theme_update'`, `'self'`. Fixed in v46: changed to `'onboarding'`.
3. **Stress scale inverted** Ã¢ÂÂ onboarding questionnaire labels stress 1=very stressed, 10=very calm. All code treated high stress as negative. Fixed in v45: flipped all hard rules, added scale reminders to all AI prompts.

### onboarding v47 (deployed as EF version 50) Ã¢ÂÂ cumulative fixes
- **v44**: Two-stage Promise.all Ã¢ÂÂ `writeMember` then FK-safe writes
- **v45**: Corrected stress scale throughout Ã¢ÂÂ RIVER hard rule: `stress <= 3` (not `>= 7`), NOVA: `stress >= 7` (not `<= 4`)
- **v46**: `assigned_by: 'onboarding'` (was `'onboarding_ai'` Ã¢ÂÂ check constraint violation)
- **v47**: NOVA hard rule now requires 1-2 goals max where performance is dominant. Members with 3+ mixed goals go to AI path.

### welcome.html Ã¢ÂÂ fix: silent failure with fake results
- Previously: any EF failure (timeout, error) showed fake hardcoded RIVER results. Member thought they'd onboarded. Nothing wrote to DB.
- Now: 90s `AbortController` timeout. At 30s loading text updates. On failure: error screen with retry button. Stored form data allows retry without re-filling questionnaire. Up to 3 retries.
- Commit: `9fb62ad5890b` in Test-Site-Finalv3

### Persona corrections (inverted stress scale)
| Member | Old (wrong) | New (correct) | Reason |
|--------|-------------|---------------|--------|
| Stuart Watts | RIVER | NOVA | stress 7=calm, wellbeing 8, energy 8, gym 4x, holiday goal |
| Alan Bird | RIVER | SPARK | stress 10=very calm but energy 5, mixed lifestyle goals |
| Dean Brown | NOVA | SPARK | stress 8=calm but 5 mixed goals, 1-2 days/week, demanding work context |

### Alan Bird Ã¢ÂÂ habits corrected
Previous habits were based on wrong assumption he was stressed. Replaced stress-relief set with goal-aligned set:
- Removed: Consistent bedtime, Pre-sleep wind-down routine, Daily breathing exercise
- Added: Drink 2 litres of water, Eat breakfast, Move every hour

### Members backfilled (had no habits due to bugs)
- Alan Bird, Stuart Watts, Owen Barrett: habits manually inserted
- Owen Barrett: workout plan triggered (had no plan)
- Callum Budzinski: workout plan triggered
- Kelly Bestford, Lewis Vines, Callum Budzinski: habits manually inserted

### daily_habits table fixes
- Unique constraint added: `(member_email, activity_date, habit_id)` Ã¢ÂÂ one row per habit per day
- Cap trigger raised from 1/day to 10/day Ã¢ÂÂ allows all 5 habits to log
- On conflict key in portal updated to `member_email,activity_date,habit_id`

### habits.html fixes
- Bottom bar: removed `position:fixed` Ã¢ÂÂ now flows inline below habits list (was overlapping)
- Auth: upgraded from polling `waitForAuth` to event-driven `vyveAuthReady`
- sw.js bumped to `vyve-cache-v2026-04-10k`


---

## 2026-04-10 (performance Ã¢ÂÂ caching & loading)

### sw.js Ã¢ÂÂ perf: cache-first portal HTML + Supabase thumbnail caching
- Added `PORTAL_PAGES` array Ã¢ÂÂ all portal HTML pages now served cache-first with background revalidation (previously network-first, required round-trip on every visit)
- Added stale-while-revalidate handler for Supabase storage URLs (`/storage/`) Ã¢ÂÂ thumbnails cached in `RUNTIME_CACHE` after first load
- Cache version bumped: `vyve-cache-v2026-04-10h` Ã¢ÂÂ `vyve-cache-v2026-04-10i`

### auth.js Ã¢ÂÂ perf: dispatch vyveAuthReady event
- Added `window.dispatchEvent(new CustomEvent('vyveAuthReady'))` immediately after `vyveRevealApp()` is called
- Pages listening for this event now proceed instantly when auth resolves rather than waiting for a polling tick

### index.html Ã¢ÂÂ perf: replace waitForAuth polling with event-driven pattern
- `waitForAuth(attempts)` polling loop (100ms interval, 20 retries max) replaced with `waitForAuth()` event listener
- Listens for `vyveAuthReady` custom event Ã¢ÂÂ fires immediately when auth.js resolves the session
- Falls back to `setTimeout(3000)` hard fallback if event never fires
- Eliminates up to 100ms artificial lag per poll cycle on cold loads

### workouts.html Ã¢ÂÂ perf: exercise library localStorage cache + lazy thumbnails
- `loadAllExercises()` now checks `localStorage` key `vyve_exercise_library_v1` before hitting Supabase
- Cache TTL: 24 hours. Cache hit = zero network request, instant exercise search
- On cache miss/expiry: fetches from Supabase and writes to cache for next visit
- Thumbnail `<img>` tags in exercise search list now use `data-src` + `class="es-lazy-thumb"` instead of eager `src`
- `renderExerciseList()` now attaches an `IntersectionObserver` after rendering Ã¢ÂÂ images only load when scrolled into view (`rootMargin: 100px` pre-load buffer)
- Fallback for browsers without IntersectionObserver: all images load immediately (same as before)

# VYVE Brain Changelog

## 2026-04-10 (onboarding QA Ã¢ÂÂ welcome.html)

### welcome.html Ã¢ÂÂ fix: text contrast across full questionnaire (light mode)
- `--text-2` bumped from `#3A5A5A` to `#1E3C3C` in light theme block
- `--text-3` bumped from `#7A9A9A` to `#4A7272` in light theme block
- Affects all question labels, hints, slider end labels, and sub-text. welcome.html has its own inline CSS block so change is isolated to onboarding only.

### welcome.html Ã¢ÂÂ feat: city/town searchable dropdown for location field
- Replaced plain text input with type-ahead dropdown backed by static JS array of ~100 UK cities and towns
- Filters on 2+ characters, shows max 8 results, click/tap to select, closes on blur
- Hint updated: "Start typing your city or town Ã¢ÂÂ if it doesn't appear, just type it in and continue"
- No external API dependency Ã¢ÂÂ fully self-contained

### welcome.html Ã¢ÂÂ fix: email sender address in results screen
- "What happens next" paragraph now explicitly names `team@vyvehealth.co.uk` as the sender
- Copy: "Keep an eye out for a welcome email from team@vyvehealth.co.uk"

### welcome.html Ã¢ÂÂ feat: persona card Ã¢ÂÂ coach explanation line
- Static line added below AI-generated persona reason on results screen
- Copy: "Your coach shapes every recommendation, check-in, and message you receive. You can change them anytime in your settings."

### welcome.html Ã¢ÂÂ feat: "What's inside VYVE" feature showcase on results screen
- New section below "What happens next" card
- 7 features: 8-week programme, AI coaching, daily habits, live sessions, nutrition, weekly check-ins, certificates/leaderboards/charity
- Each item has bold title + 1-sentence description emphasising personalisation and ability to update anytime
- No emojis (Lewis preference Ã¢ÂÂ applied globally to welcome.html)

### results-preview.html Ã¢ÂÂ added to Test-Site-Finalv3
- Standalone QA preview page at www.vyvehealth.co.uk/results-preview.html
- Shows mocked results screen with realistic data for review
- Temporary file Ã¢ÂÂ delete once QA sign-off complete

## 2026-04-10 (evening Ã¢ÂÂ bug fixes session)

### workouts.html Ã¢ÂÂ fix: reorder wipes in-progress sets
- `saveReorder()` now snapshots kg/reps/ticked/bw/notes per exercise name before calling `renderSessionBody()`, then restores after. Mid-session reorder no longer wipes workout progress.
- commit b93fd175

### theme.css + auth.js Ã¢ÂÂ feat: portrait orientation lock
- CSS `#vyve-rotate-overlay` shown via `@media (orientation: landscape) and (max-height: 430px)` Ã¢ÂÂ phone-only, not tablets.
- `vyvePortraitLock()` IIFE in auth.js: calls `screen.orientation.lock('portrait')` (Android) and injects the overlay div into every portal page automatically Ã¢ÂÂ no per-page changes needed.
- iOS Safari ignores the API; CSS overlay handles iOS.
- Decision: overlay kept post-Capacitor as safety net for browser access. Suppress during active workout session is a known backlog item.
- sw.js bumped to vyve-cache-v2026-04-10f

### workouts.html Ã¢ÂÂ fix: PR/history scroll lock + content hidden under nav
- `openPrsView()` / `openSessionsHistory()` now clear `body.overflow` so fixed overlay scrolls on iOS (body:hidden was blocking touch events).
- `closePrsView()` / `closeSessionsHistory()` re-apply body lock if session still active.
- Both views reset `scrollTop = 0` on open.
- `.prs-body` and `.sh-body` bottom padding now `calc(80px + env(safe-area-inset-bottom,0px))` Ã¢ÂÂ last items no longer hidden under nav.
- Both fixed views get `-webkit-overflow-scrolling:touch` + `overscroll-behavior:contain`.
- sw.js bumped to vyve-cache-v2026-04-10g

### workouts.html Ã¢ÂÂ feat: persist active session across navigation
- Navigating away (e.g. Sessions tab) and back no longer resets a workout.
- `saveSessionState()` serialises currentSessionData, sessionExercises, sessionLog, completedSetsCount, all DOM state (kg/reps/ticked/bw/notes), and timer to `localStorage` key `vyve_active_session`.
- Called on session start and every set tick.
- `restoreSessionState()` called at end of `init()` Ã¢ÂÂ reopens session view with all progress and timer intact if saved state exists and is under 4 hours old.
- Cleared on `closeSessionView()` (explicit exit) and `completeWorkout()` (done).
- sw.js bumped to vyve-cache-v2026-04-10h


## 2026-04-10 (evening Ã¢ÂÂ portrait lock)

### theme.css + auth.js Ã¢ÂÂ feat: portrait orientation lock
- **Problem:** Portal pages rotated freely to landscape on phone rotation. VYVE is portrait-only Ã¢ÂÂ landscape is always accidental on a phone.
- **CSS (theme.css):** Added `#vyve-rotate-overlay` Ã¢ÂÂ a fixed full-screen overlay with a rotating phone icon and message. Shown via `@media (orientation: landscape) and (max-height: 430px)` so it only triggers on phone-sized landscape, not tablets. Overlay sits above `#app` but does not unmount it Ã¢ÂÂ no state loss.
- **JS (auth.js):** `vyvePortraitLock()` IIFE injected at bottom of auth.js. Calls `screen.orientation.lock('portrait')` (Android Chrome). Also injects the `#vyve-rotate-overlay` div into the DOM on every portal page at load Ã¢ÂÂ no per-page changes needed.
- iOS Safari ignores the API lock; CSS overlay handles iOS.
- sw.js bumped vyve-cache-v2026-04-10e Ã¢ÂÂ vyve-cache-v2026-04-10f


## 2026-04-10 (evening)

### workouts.html Ã¢ÂÂ fix: reorder wipes in-progress sets
- **Bug:** Opening the reorder modal mid-session and saving the new order called `renderSessionBody()`, which rebuilt the entire DOM from scratch. All ticked sets, kg/reps values, and bodyweight toggles were lost.
- **Fix:** `saveReorder()` now captures a snapshot of all per-exercise DOM state (kg, reps, ticked, bodyweight, notes) keyed by exercise name before reordering. After `renderSessionBody()` re-renders, the snapshot is replayed back into the new DOM positions.
- Exercise name is the stable key Ã¢ÂÂ this works correctly because reorder doesn't change the exercises, only their positions.
- commit b93fd175

### sw.js Ã¢ÂÂ cache bump vyve-cache-v2026-04-10d Ã¢ÂÂ vyve-cache-v2026-04-10e


## 2026-04-10 (late evening session)

### settings.html Ã¢ÂÂ 3 fixes
- `<!--email_off-->` tags stripped from `mailto:team@vyvehealth.co.uk` href Ã¢ÂÂ Cloudflare was injecting them literally, breaking iOS Mail Ã¢ÂÂ commit 737fadd
- Privacy Policy link corrected from `/privacy` (404) to `/privacy.html` Ã¢ÂÂ commit c8d7d40
- Both fixes atomic, settings.html is clean

### how-to-videos.html + how-to-pdfs.html Ã¢ÂÂ replaced with placeholders
- Both pages had custom nav markup, no theme.js, no nav.js, no auth gate, no SW registration
- Replaced entirely with clean placeholder pages (coming soon)
- Each now has: theme.js, nav.js, auth gate IIFE, SW registration, proper `data-theme="dark"` default
- Back button and standard VYVE nav now work on both pages Ã¢ÂÂ commit 32461c3
- sw.js cache bumped vyve-cache-v2026-04-10c Ã¢ÂÂ vyve-cache-v2026-04-10d

### running-plan.html Ã¢ÂÂ max_tokens fix
- `max_tokens` was hard-coded to `4096` when Haiku was switched in on 6 April (commit 758b572)
- Original code had `getMaxTokens(goal)` Ã¢ÂÂ marathon was 10,000, half was 7,000
- 20-week marathon plan (Stuart Watts) was being truncated mid-JSON every time
- Fixed: `max_tokens` raised to `16000` Ã¢ÂÂ covers all plan combinations with headroom
- Bonus: stripped `<!--email_off-->` Cloudflare tags from monthly limit mailto link Ã¢ÂÂ commit cb729bb

## 2026-04-10 (late evening session)

### generate-workout-plan Ã¢ÂÂ Full Restoration + Video Fix
- Discovered v4 had two unintentional regressions vs original onboarding v42:
  1. `programme_name` was hardcoded template instead of AI-generated
  2. `programme_rationale` was hardcoded template instead of AI-generated
- Root cause of Stuart's missing videos/thumbnails identified:
  - AI-generated plans invent exercise names (e.g. "Barbell Bench Press")
  - `workout_plans` library uses different format (e.g. "Bench Press Ã¢ÂÂ Barbell")
  - `workouts.html` uses strict equality match (`===`) Ã¢ÂÂ no fuzzy matching
  - This was always the case for AI plans; videos only worked when Stuart was on the static fallback library
- Deployed `generate-workout-plan` v5 with full restoration:
  - Step 1: `generateProgrammeOverview()` restored Ã¢ÂÂ AI generates personalised programme name and rationale (matches original onboarding v42 behaviour)
  - Step 2: Exercise library fetched from `workout_plans` table at runtime and injected into prompt Ã¢ÂÂ AI MUST use only approved exercise names
  - Step 3: After plan generation, each exercise enriched with `video_url` + `thumbnail_url` via direct lookup against library
  - Plan generation still uses two parallel calls (weeks 1-4, weeks 5-8) to avoid 16k token limit
- Stuart's plan regenerated with v5: "PPL Holiday Shred" Ã¢ÂÂ 8 weeks, 32 sessions, 212/212 exercises matched to videos
- `generate-workout-plan` is now the canonical plan generation path Ã¢ÂÂ onboarding v43 calls it as fire-and-forget

### Known Architecture Note
- `workouts.html` `getVideoUrl()` / `getThumbnailUrl()` use strict name equality Ã¢ÂÂ this is fine now that the EF constrains AI to library names
- If any future plan has unmatched exercises (v5 logs warnings), the issue will be in the prompt constraint, not the frontend


## 2026-04-10 (evening session)

### Password Reset Flow Ã¢ÂÂ Full Fix
- Root cause: `login.html` had `redirectTo` pointing to `login.html` instead of `set-password.html`
- Fixed `redirectTo` in `login.html` to `https://online.vyvehealth.co.uk/set-password.html`
- Fixed `set-password.html` to call `signOut(scope: global)` after password update, then redirect to `login.html?reset=success`
- Added success banner on `login.html` when `?reset=success` param present
- Added "Link already used" card to `set-password.html` with inline resend form Ã¢ÂÂ user can request new link without navigating away
- Increased invalid link timeout from 3s to 5s for slow mobile connections
- Supabase SMTP configured to send via Brevo (`smtp-relay.brevo.com:587`) Ã¢ÂÂ emails now send from VYVE Health <team@vyvehealth.co.uk> not Supabase Auth
- Brevo domain `vyvehealth.co.uk` verified (DKIM + DMARC green) via GoDaddy DNS
- Reset email template updated to table-based HTML button (renders correctly in all email clients)
- cache bumped: `vyve-cache-v2026-04-10a` Ã¢ÂÂ `b` Ã¢ÂÂ `c`

### Workouts.html Ã¢ÂÂ Nav Overlap Fixes
- Rest timer sheet and reorder exercises sheet were rendering behind the bottom nav bar
- Fixed `ex-menu-sheet` padding-bottom: `calc(72px + env(safe-area-inset-bottom))`
- Fixed `reorder-sheet` padding-bottom: `calc(84px + env(safe-area-inset-bottom))` and max-height: `calc(80vh - 65px)`
- Fixed `reorder-save-btn` bottom margin
- cache bumped: `vyve-cache-v2026-04-10c`

### Workout Plan Generation Ã¢ÂÂ Architecture Fix
- Root cause: `waitUntil` in onboarding EF has a hard timeout; advanced PPL plans (~14k tokens output) were silently failing
- Stuart Watts (`stuwatts09@gmail.com`) had no plan in `workout_plan_cache` Ã¢ÂÂ was seeing static fallback library
- Deployed new `generate-workout-plan` Edge Function (v4) as standalone dedicated EF
  - Generates weeks 1-4 and weeks 5-8 in two parallel API calls, stitches together
  - `max_tokens: 16000` per call Ã¢ÂÂ handles largest possible plans
  - `stop_reason` guard: fails loudly if output truncated, never writes corrupt data
- Updated `onboarding` EF to v43: replaces inline `waitUntil(generateWorkoutPlan)` with fire-and-forget fetch to `generate-workout-plan` EF
- Stuart's plan generated manually and written to `workout_plan_cache`: 8 weeks, 32 sessions, 36,521 chars
- Plan join verified Ã¢ÂÂ week 4Ã¢ÂÂ5 transition seamless (same exercises, correct progressive overload step)

### Stuart Watts Ã¢ÂÂ Account Notes
- Two accounts exist: `swatts@geoffreyrobinson.co.uk` (Feb 2026, old/legacy) and `stuwatts09@gmail.com` (10 Apr 2026, active)
- Active account is `stuwatts09@gmail.com` Ã¢ÂÂ RIVER persona, 4-day PPL, Advanced, Gym
- Old account has 12 workout logs with null plan/name (logged via legacy flow)
- All workout data safe Ã¢ÂÂ nothing deleted


## 2026-04-10

### External Brain System Created
- brain/master.md Ã¢ÂÂ complete business + technical context
- brain/how-to-use.md Ã¢ÂÂ human operator guide
- brain/schema-snapshot.md Ã¢ÂÂ all 36 tables from live Supabase
- brain/startup-prompt.md Ã¢ÂÂ trigger prompt for any AI session
- brain/changelog.md Ã¢ÂÂ this file

### Playbooks Created
- playbooks/brain-sync.md Ã¢ÂÂ session/daily/recovery sync system
- playbooks/debug.md Ã¢ÂÂ diagnose and fix issues
- playbooks/build.md Ã¢ÂÂ implement new features
- playbooks/research.md Ã¢ÂÂ deep understanding before action
- playbooks/review.md Ã¢ÂÂ code quality review
- playbooks/optimise.md Ã¢ÂÂ performance and readability
- playbooks/refactor.md Ã¢ÂÂ structural improvements
- playbooks/repo-audit.md Ã¢ÂÂ comprehensive system audit
- playbooks/execution.md Ã¢ÂÂ execute predefined plans
- playbooks/architect.md Ã¢ÂÂ system architecture design
- playbooks/github-operator.md Ã¢ÂÂ repo read/write operations
- playbooks/feature-build.md Ã¢ÂÂ end-to-end feature delivery
- playbooks/bug-fix.md Ã¢ÂÂ bug diagnosis and fix

### Tasks
- tasks/backlog.md Ã¢ÂÂ prioritised work queue
- tasks/task-template.md Ã¢ÂÂ reusable task card

### Infrastructure
- README.md Ã¢ÂÂ quick start guide
- prompts/cold-start.md Ã¢ÂÂ paste into any AI to begin

### Data Source
All verified against live Supabase project ixjfklpckgxrwjlfsaaz on 10 April 2026.

## 2026-04-10 (evening)

### Repo Hygiene
- `VYVEHealth/VYVEBrain` set to private Ã¢ÂÂ contains Supabase IDs, API keys references, commercial pipeline
- Removed duplicate `brain-sync.md` from repo root (canonical copy is `playbooks/brain-sync.md`)

### vyve-site Actions Cleanup
- Deleted dead `.github/workflows/inject-key.yml` Ã¢ÂÂ legacy workflow from before `anthropic-proxy` EF existed
- Verified `running-plan.html` already uses `anthropic-proxy` EF v5 (no placeholder, no key in HTML)
- `static.yml` (GitHub Pages deploy) retained Ã¢ÂÂ only workflow now running on vyve-site
- Commit: f557dae

## 2026-04-10 (morning/afternoon session)

### Daily Report Fixed
- `BREVO_API_KEY` secret was missing/wrong in Supabase Ã¢ÂÂ renamed to correct value
- `daily-report` v16 deployed Ã¢ÂÂ added full activity detail table (member name, type, specific activity, time)
- Report manually triggered and confirmed sending to team@vyvehealth.co.uk

### Password Reset Flow Fixed
- Supabase Site URL updated to `https://online.vyvehealth.co.uk/set-password.html`
- `set-password.html` confirmed correctly handles `PASSWORD_RECOVERY` token event
- Supabase email template updated: new VYVE-branded HTML body, subject now "Reset your VYVE password"

### Welcome Emails Resent
- Alan Bird and Owen Barrett identified as missing welcome emails (onboarded while Brevo key was absent)
- `resend-welcome` one-shot EF deployed Ã¢ÂÂ resent branded welcome with fresh set-password links
- BCC to team@vyvehealth.co.uk confirmed working on all future onboarding emails

### Backlog Updated
- Added: password reset email template (desktop task)
- Added: Exercise page redesign (product idea Ã¢ÂÂ gym / cardio / walking plan umbrella)

### Product Thinking
- Discussed replacing "Workouts" nav item with "Exercise" umbrella page
- Members choose path at onboarding: gym programme, running plan, walking/activity plan, or mix
- Each path generates an 8-week personalised plan (Sandra use case Ã¢ÂÂ non-gym corporate members)
- Key open question: do non-gym plans use same `workout_plan_cache` structure or simpler format?
- Decision deferred Ã¢ÂÂ parked in backlog under Later
