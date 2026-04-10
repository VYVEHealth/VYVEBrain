## 2026-04-10 (workouts modularisation)

### refactor: workouts.html — split inline JS into 6 modules

**Commit:** b28c2b79b6754b58bf1dda79873f94b903bae851

workouts.html was 2,117 lines / 131KB with a single 1,575-line inline `<script>` block. Every future edit had the large-file deployment problem (>10KB Composio inline limit). Split into named `<script src="...">` files — no bundler, no `type="module"`, no behaviour changes.

| File | Lines | Responsibility |
|------|-------|----------------|
| `workouts-config.js` | 81 | Consts, 26 globals, `getJWT`, utility functions |
| `workouts-programme.js` | 237 | Programme load/render, exercise library cache, custom workouts |
| `workouts-session.js` | 598 | Session open/close, set logging, timers, completion flow |
| `workouts-exercise-menu.js` | 269 | Exercise menus, reorder, swap/add, history view |
| `workouts-builder.js` | 153 | Custom workout builder, rest settings |
| `workouts-notes-prs.js` | 235 | Notes, PRs, sessions history, MutationObserver boot |

`workouts.html` reduced from 2,117 → 548 lines (CSS + HTML shell + 6 `<script src>` tags).

**Verification:** 89/89 functions present across modules. Zero missing, zero extra.

**Load order:** config → programme → session → exercise-menu → builder → notes-prs → nav.js

`sw.js` cache bumped: `vyve-cache-v2026-04-10l` → `vyve-cache-v2026-04-10m`

## 2026-04-10 (settings page — persona selector, habit manager, goals, units, ai_decisions)

### New features deployed

**settings.html** — major update with 4 new sections:

1. **AI Coach section** — shows current persona name + description. Displays why the coach was chosen, pulled from new `ai_decisions` table (falls back to `members.persona_reason`). "Change coach" bottom sheet shows all 5 personas with descriptions. HAVEN shown as coming soon. Change takes effect immediately, writes to `persona_switches` + `ai_decisions` with `triggered_by: 'self'`.

2. **Daily Habits section** — shows current habits as tags. "Manage habits" bottom sheet shows all 30 habits from `habit_library` grouped by pot (Sleep, Movement, Nutrition, Mindfulness, Social). Max 10 selectable. Saves to `member_habits` with `assigned_by: 'self'`. Logs to `ai_decisions`.

3. **Your Goals section** — 8-button grid (Lose weight, Build muscle, Improve fitness, Reduce stress, Better sleep, Build consistency, More energy, General health). Saves immediately to `members.specific_goal`. Logs to `ai_decisions`.

4. **Units section** — weight (kg/lbs/stone) and height (cm/ft) toggles. Saves to new `members.weight_unit` and `members.height_unit` columns.

### New infrastructure

- **`ai_decisions` table** — created with RLS. Columns: `id`, `member_email`, `decision_type` (persona_assigned/habit_assigned/goal_updated/persona_changed), `decision_value`, `reasoning`, `triggered_by`, `created_at`. Members can read their own rows. Service role inserts.

- **`members.weight_unit` + `members.height_unit`** — new columns, default 'kg' and 'cm'.

### onboarding v48 (EF version 51)

- `selectPersona()` now calls Claude to generate a specific, member-facing reasoning paragraph for every assignment — hard-rule or AI path. Format: "Based on your onboarding responses: [specific signals]. [Coach] is [reason]."
- `selectHabits()` now returns both `ids` and `reasoning` — Claude explains which profile signals drove the habit selection.
- New `writeAiDecisions()` function writes two rows to `ai_decisions` at onboarding: one for persona, one for habits.
- Response now includes `ai_reasoning` and `habit_reasoning` fields.

### sw.js
Cache bumped: `vyve-cache-v2026-04-10k` → `vyve-cache-v2026-04-10l`

## 2026-04-10 (onboarding — major bug fixes & persona logic corrections)

### Root causes fixed
Three separate bugs were silently preventing habit assignment for every new member since v44:
1. **FK race condition** — `writeHabits` fired in parallel with `writeMember`. When `writeHabits` beat the DB, the FK on `member_email` failed. Fixed in v44: two-stage Promise.all, `writeMember` commits first.
2. **`assigned_by: 'onboarding_ai'`** — check constraint on `member_habits` only allows `'onboarding'`, `'ai'`, `'theme_update'`, `'self'`. Fixed in v46: changed to `'onboarding'`.
3. **Stress scale inverted** — onboarding questionnaire labels stress 1=very stressed, 10=very calm. All code treated high stress as negative. Fixed in v45: flipped all hard rules, added scale reminders to all AI prompts.

### onboarding v47 (deployed as EF version 50) — cumulative fixes
- **v44**: Two-stage Promise.all — `writeMember` then FK-safe writes
- **v45**: Corrected stress scale throughout — RIVER hard rule: `stress <= 3` (not `>= 7`), NOVA: `stress >= 7` (not `<= 4`)
- **v46**: `assigned_by: 'onboarding'` (was `'onboarding_ai'` — check constraint violation)
- **v47**: NOVA hard rule now requires 1-2 goals max where performance is dominant. Members with 3+ mixed goals go to AI path.

### welcome.html — fix: silent failure with fake results
- Previously: any EF failure (timeout, error) showed fake hardcoded RIVER results. Member thought they'd onboarded. Nothing wrote to DB.
- Now: 90s `AbortController` timeout. At 30s loading text updates. On failure: error screen with retry button. Stored form data allows retry without re-filling questionnaire. Up to 3 retries.
- Commit: `9fb62ad5890b` in Test-Site-Finalv3

### Persona corrections (inverted stress scale)
| Member | Old (wrong) | New (correct) | Reason |
|--------|-------------|---------------|--------|
| Stuart Watts | RIVER | NOVA | stress 7=calm, wellbeing 8, energy 8, gym 4x, holiday goal |
| Alan Bird | RIVER | SPARK | stress 10=very calm but energy 5, mixed lifestyle goals |
| Dean Brown | NOVA | SPARK | stress 8=calm but 5 mixed goals, 1-2 days/week, demanding work context |

### Alan Bird — habits corrected
Previous habits were based on wrong assumption he was stressed. Replaced stress-relief set with goal-aligned set:
- Removed: Consistent bedtime, Pre-sleep wind-down routine, Daily breathing exercise
- Added: Drink 2 litres of water, Eat breakfast, Move every hour

### Members backfilled (had no habits due to bugs)
- Alan Bird, Stuart Watts, Owen Barrett: habits manually inserted
- Owen Barrett: workout plan triggered (had no plan)
- Callum Budzinski: workout plan triggered
- Kelly Bestford, Lewis Vines, Callum Budzinski: habits manually inserted

### daily_habits table fixes
- Unique constraint added: `(member_email, activity_date, habit_id)` — one row per habit per day
- Cap trigger raised from 1/day to 10/day — allows all 5 habits to log
- On conflict key in portal updated to `member_email,activity_date,habit_id`

### habits.html fixes
- Bottom bar: removed `position:fixed` — now flows inline below habits list (was overlapping)
- Auth: upgraded from polling `waitForAuth` to event-driven `vyveAuthReady`
- sw.js bumped to `vyve-cache-v2026-04-10k`


---

## 2026-04-10 (performance — caching & loading)

### sw.js — perf: cache-first portal HTML + Supabase thumbnail caching
- Added `PORTAL_PAGES` array — all portal HTML pages now served cache-first with background revalidation (previously network-first, required round-trip on every visit)
- Added stale-while-revalidate handler for Supabase storage URLs (`/storage/`) — thumbnails cached in `RUNTIME_CACHE` after first load
- Cache version bumped: `vyve-cache-v2026-04-10h` → `vyve-cache-v2026-04-10i`

### auth.js — perf: dispatch vyveAuthReady event
- Added `window.dispatchEvent(new CustomEvent('vyveAuthReady'))` immediately after `vyveRevealApp()` is called
- Pages listening for this event now proceed instantly when auth resolves rather than waiting for a polling tick

### index.html — perf: replace waitForAuth polling with event-driven pattern
- `waitForAuth(attempts)` polling loop (100ms interval, 20 retries max) replaced with `waitForAuth()` event listener
- Listens for `vyveAuthReady` custom event — fires immediately when auth.js resolves the session
- Falls back to `setTimeout(3000)` hard fallback if event never fires
- Eliminates up to 100ms artificial lag per poll cycle on cold loads

### workouts.html — perf: exercise library localStorage cache + lazy thumbnails
- `loadAllExercises()` now checks `localStorage` key `vyve_exercise_library_v1` before hitting Supabase
- Cache TTL: 24 hours. Cache hit = zero network request, instant exercise search
- On cache miss/expiry: fetches from Supabase and writes to cache for next visit
- Thumbnail `<img>` tags in exercise search list now use `data-src` + `class="es-lazy-thumb"` instead of eager `src`
- `renderExerciseList()` now attaches an `IntersectionObserver` after rendering — images only load when scrolled into view (`rootMargin: 100px` pre-load buffer)
- Fallback for browsers without IntersectionObserver: all images load immediately (same as before)

# VYVE Brain Changelog

## 2026-04-10 (onboarding QA — welcome.html)

### welcome.html — fix: text contrast across full questionnaire (light mode)
- `--text-2` bumped from `#3A5A5A` to `#1E3C3C` in light theme block
- `--text-3` bumped from `#7A9A9A` to `#4A7272` in light theme block
- Affects all question labels, hints, slider end labels, and sub-text. welcome.html has its own inline CSS block so change is isolated to onboarding only.

### welcome.html — feat: city/town searchable dropdown for location field
- Replaced plain text input with type-ahead dropdown backed by static JS array of ~100 UK cities and towns
- Filters on 2+ characters, shows max 8 results, click/tap to select, closes on blur
- Hint updated: "Start typing your city or town — if it doesn't appear, just type it in and continue"
- No external API dependency — fully self-contained

### welcome.html — fix: email sender address in results screen
- "What happens next" paragraph now explicitly names `team@vyvehealth.co.uk` as the sender
- Copy: "Keep an eye out for a welcome email from team@vyvehealth.co.uk"

### welcome.html — feat: persona card — coach explanation line
- Static line added below AI-generated persona reason on results screen
- Copy: "Your coach shapes every recommendation, check-in, and message you receive. You can change them anytime in your settings."

### welcome.html — feat: "What's inside VYVE" feature showcase on results screen
- New section below "What happens next" card
- 7 features: 8-week programme, AI coaching, daily habits, live sessions, nutrition, weekly check-ins, certificates/leaderboards/charity
- Each item has bold title + 1-sentence description emphasising personalisation and ability to update anytime
- No emojis (Lewis preference — applied globally to welcome.html)

### results-preview.html — added to Test-Site-Finalv3
- Standalone QA preview page at www.vyvehealth.co.uk/results-preview.html
- Shows mocked results screen with realistic data for review
- Temporary file — delete once QA sign-off complete

## 2026-04-10 (evening — bug fixes session)

### workouts.html — fix: reorder wipes in-progress sets
- `saveReorder()` now snapshots kg/reps/ticked/bw/notes per exercise name before calling `renderSessionBody()`, then restores after. Mid-session reorder no longer wipes workout progress.
- commit b93fd175

### theme.css + auth.js — feat: portrait orientation lock
- CSS `#vyve-rotate-overlay` shown via `@media (orientation: landscape) and (max-height: 430px)` — phone-only, not tablets.
- `vyvePortraitLock()` IIFE in auth.js: calls `screen.orientation.lock('portrait')` (Android) and injects the overlay div into every portal page automatically — no per-page changes needed.
- iOS Safari ignores the API; CSS overlay handles iOS.
- Decision: overlay kept post-Capacitor as safety net for browser access. Suppress during active workout session is a known backlog item.
- sw.js bumped to vyve-cache-v2026-04-10f

### workouts.html — fix: PR/history scroll lock + content hidden under nav
- `openPrsView()` / `openSessionsHistory()` now clear `body.overflow` so fixed overlay scrolls on iOS (body:hidden was blocking touch events).
- `closePrsView()` / `closeSessionsHistory()` re-apply body lock if session still active.
- Both views reset `scrollTop = 0` on open.
- `.prs-body` and `.sh-body` bottom padding now `calc(80px + env(safe-area-inset-bottom,0px))` — last items no longer hidden under nav.
- Both fixed views get `-webkit-overflow-scrolling:touch` + `overscroll-behavior:contain`.
- sw.js bumped to vyve-cache-v2026-04-10g

### workouts.html — feat: persist active session across navigation
- Navigating away (e.g. Sessions tab) and back no longer resets a workout.
- `saveSessionState()` serialises currentSessionData, sessionExercises, sessionLog, completedSetsCount, all DOM state (kg/reps/ticked/bw/notes), and timer to `localStorage` key `vyve_active_session`.
- Called on session start and every set tick.
- `restoreSessionState()` called at end of `init()` — reopens session view with all progress and timer intact if saved state exists and is under 4 hours old.
- Cleared on `closeSessionView()` (explicit exit) and `completeWorkout()` (done).
- sw.js bumped to vyve-cache-v2026-04-10h


## 2026-04-10 (evening — portrait lock)

### theme.css + auth.js — feat: portrait orientation lock
- **Problem:** Portal pages rotated freely to landscape on phone rotation. VYVE is portrait-only — landscape is always accidental on a phone.
- **CSS (theme.css):** Added `#vyve-rotate-overlay` — a fixed full-screen overlay with a rotating phone icon and message. Shown via `@media (orientation: landscape) and (max-height: 430px)` so it only triggers on phone-sized landscape, not tablets. Overlay sits above `#app` but does not unmount it — no state loss.
- **JS (auth.js):** `vyvePortraitLock()` IIFE injected at bottom of auth.js. Calls `screen.orientation.lock('portrait')` (Android Chrome). Also injects the `#vyve-rotate-overlay` div into the DOM on every portal page at load — no per-page changes needed.
- iOS Safari ignores the API lock; CSS overlay handles iOS.
- sw.js bumped vyve-cache-v2026-04-10e → vyve-cache-v2026-04-10f


## 2026-04-10 (evening)

### workouts.html — fix: reorder wipes in-progress sets
- **Bug:** Opening the reorder modal mid-session and saving the new order called `renderSessionBody()`, which rebuilt the entire DOM from scratch. All ticked sets, kg/reps values, and bodyweight toggles were lost.
- **Fix:** `saveReorder()` now captures a snapshot of all per-exercise DOM state (kg, reps, ticked, bodyweight, notes) keyed by exercise name before reordering. After `renderSessionBody()` re-renders, the snapshot is replayed back into the new DOM positions.
- Exercise name is the stable key — this works correctly because reorder doesn't change the exercises, only their positions.
- commit b93fd175

### sw.js — cache bump vyve-cache-v2026-04-10d → vyve-cache-v2026-04-10e


## 2026-04-10 (late evening session)

### settings.html — 3 fixes
- `<!--email_off-->` tags stripped from `mailto:team@vyvehealth.co.uk` href — Cloudflare was injecting them literally, breaking iOS Mail — commit 737fadd
- Privacy Policy link corrected from `/privacy` (404) to `/privacy.html` — commit c8d7d40
- Both fixes atomic, settings.html is clean

### how-to-videos.html + how-to-pdfs.html — replaced with placeholders
- Both pages had custom nav markup, no theme.js, no nav.js, no auth gate, no SW registration
- Replaced entirely with clean placeholder pages (coming soon)
- Each now has: theme.js, nav.js, auth gate IIFE, SW registration, proper `data-theme="dark"` default
- Back button and standard VYVE nav now work on both pages — commit 32461c3
- sw.js cache bumped vyve-cache-v2026-04-10c → vyve-cache-v2026-04-10d

### running-plan.html — max_tokens fix
- `max_tokens` was hard-coded to `4096` when Haiku was switched in on 6 April (commit 758b572)
- Original code had `getMaxTokens(goal)` — marathon was 10,000, half was 7,000
- 20-week marathon plan (Stuart Watts) was being truncated mid-JSON every time
- Fixed: `max_tokens` raised to `16000` — covers all plan combinations with headroom
- Bonus: stripped `<!--email_off-->` Cloudflare tags from monthly limit mailto link — commit cb729bb

## 2026-04-10 (late evening session)

### generate-workout-plan — Full Restoration + Video Fix
- Discovered v4 had two unintentional regressions vs original onboarding v42:
  1. `programme_name` was hardcoded template instead of AI-generated
  2. `programme_rationale` was hardcoded template instead of AI-generated
- Root cause of Stuart's missing videos/thumbnails identified:
  - AI-generated plans invent exercise names (e.g. "Barbell Bench Press")
  - `workout_plans` library uses different format (e.g. "Bench Press – Barbell")
  - `workouts.html` uses strict equality match (`===`) — no fuzzy matching
  - This was always the case for AI plans; videos only worked when Stuart was on the static fallback library
- Deployed `generate-workout-plan` v5 with full restoration:
  - Step 1: `generateProgrammeOverview()` restored — AI generates personalised programme name and rationale (matches original onboarding v42 behaviour)
  - Step 2: Exercise library fetched from `workout_plans` table at runtime and injected into prompt — AI MUST use only approved exercise names
  - Step 3: After plan generation, each exercise enriched with `video_url` + `thumbnail_url` via direct lookup against library
  - Plan generation still uses two parallel calls (weeks 1-4, weeks 5-8) to avoid 16k token limit
- Stuart's plan regenerated with v5: "PPL Holiday Shred" — 8 weeks, 32 sessions, 212/212 exercises matched to videos
- `generate-workout-plan` is now the canonical plan generation path — onboarding v43 calls it as fire-and-forget

### Known Architecture Note
- `workouts.html` `getVideoUrl()` / `getThumbnailUrl()` use strict name equality — this is fine now that the EF constrains AI to library names
- If any future plan has unmatched exercises (v5 logs warnings), the issue will be in the prompt constraint, not the frontend


## 2026-04-10 (evening session)

### Password Reset Flow — Full Fix
- Root cause: `login.html` had `redirectTo` pointing to `login.html` instead of `set-password.html`
- Fixed `redirectTo` in `login.html` to `https://online.vyvehealth.co.uk/set-password.html`
- Fixed `set-password.html` to call `signOut(scope: global)` after password update, then redirect to `login.html?reset=success`
- Added success banner on `login.html` when `?reset=success` param present
- Added "Link already used" card to `set-password.html` with inline resend form — user can request new link without navigating away
- Increased invalid link timeout from 3s to 5s for slow mobile connections
- Supabase SMTP configured to send via Brevo (`smtp-relay.brevo.com:587`) — emails now send from VYVE Health <team@vyvehealth.co.uk> not Supabase Auth
- Brevo domain `vyvehealth.co.uk` verified (DKIM + DMARC green) via GoDaddy DNS
- Reset email template updated to table-based HTML button (renders correctly in all email clients)
- cache bumped: `vyve-cache-v2026-04-10a` → `b` → `c`

### Workouts.html — Nav Overlap Fixes
- Rest timer sheet and reorder exercises sheet were rendering behind the bottom nav bar
- Fixed `ex-menu-sheet` padding-bottom: `calc(72px + env(safe-area-inset-bottom))`
- Fixed `reorder-sheet` padding-bottom: `calc(84px + env(safe-area-inset-bottom))` and max-height: `calc(80vh - 65px)`
- Fixed `reorder-save-btn` bottom margin
- cache bumped: `vyve-cache-v2026-04-10c`

### Workout Plan Generation — Architecture Fix
- Root cause: `waitUntil` in onboarding EF has a hard timeout; advanced PPL plans (~14k tokens output) were silently failing
- Stuart Watts (`stuwatts09@gmail.com`) had no plan in `workout_plan_cache` — was seeing static fallback library
- Deployed new `generate-workout-plan` Edge Function (v4) as standalone dedicated EF
  - Generates weeks 1-4 and weeks 5-8 in two parallel API calls, stitches together
  - `max_tokens: 16000` per call — handles largest possible plans
  - `stop_reason` guard: fails loudly if output truncated, never writes corrupt data
- Updated `onboarding` EF to v43: replaces inline `waitUntil(generateWorkoutPlan)` with fire-and-forget fetch to `generate-workout-plan` EF
- Stuart's plan generated manually and written to `workout_plan_cache`: 8 weeks, 32 sessions, 36,521 chars
- Plan join verified — week 4→5 transition seamless (same exercises, correct progressive overload step)

### Stuart Watts — Account Notes
- Two accounts exist: `swatts@geoffreyrobinson.co.uk` (Feb 2026, old/legacy) and `stuwatts09@gmail.com` (10 Apr 2026, active)
- Active account is `stuwatts09@gmail.com` — RIVER persona, 4-day PPL, Advanced, Gym
- Old account has 12 workout logs with null plan/name (logged via legacy flow)
- All workout data safe — nothing deleted


## 2026-04-10

### External Brain System Created
- brain/master.md — complete business + technical context
- brain/how-to-use.md — human operator guide
- brain/schema-snapshot.md — all 36 tables from live Supabase
- brain/startup-prompt.md — trigger prompt for any AI session
- brain/changelog.md — this file

### Playbooks Created
- playbooks/brain-sync.md — session/daily/recovery sync system
- playbooks/debug.md — diagnose and fix issues
- playbooks/build.md — implement new features
- playbooks/research.md — deep understanding before action
- playbooks/review.md — code quality review
- playbooks/optimise.md — performance and readability
- playbooks/refactor.md — structural improvements
- playbooks/repo-audit.md — comprehensive system audit
- playbooks/execution.md — execute predefined plans
- playbooks/architect.md — system architecture design
- playbooks/github-operator.md — repo read/write operations
- playbooks/feature-build.md — end-to-end feature delivery
- playbooks/bug-fix.md — bug diagnosis and fix

### Tasks
- tasks/backlog.md — prioritised work queue
- tasks/task-template.md — reusable task card

### Infrastructure
- README.md — quick start guide
- prompts/cold-start.md — paste into any AI to begin

### Data Source
All verified against live Supabase project ixjfklpckgxrwjlfsaaz on 10 April 2026.

## 2026-04-10 (evening)

### Repo Hygiene
- `VYVEHealth/VYVEBrain` set to private — contains Supabase IDs, API keys references, commercial pipeline
- Removed duplicate `brain-sync.md` from repo root (canonical copy is `playbooks/brain-sync.md`)

### vyve-site Actions Cleanup
- Deleted dead `.github/workflows/inject-key.yml` — legacy workflow from before `anthropic-proxy` EF existed
- Verified `running-plan.html` already uses `anthropic-proxy` EF v5 (no placeholder, no key in HTML)
- `static.yml` (GitHub Pages deploy) retained — only workflow now running on vyve-site
- Commit: f557dae

## 2026-04-10 (morning/afternoon session)

### Daily Report Fixed
- `BREVO_API_KEY` secret was missing/wrong in Supabase — renamed to correct value
- `daily-report` v16 deployed — added full activity detail table (member name, type, specific activity, time)
- Report manually triggered and confirmed sending to team@vyvehealth.co.uk

### Password Reset Flow Fixed
- Supabase Site URL updated to `https://online.vyvehealth.co.uk/set-password.html`
- `set-password.html` confirmed correctly handles `PASSWORD_RECOVERY` token event
- Supabase email template updated: new VYVE-branded HTML body, subject now "Reset your VYVE password"

### Welcome Emails Resent
- Alan Bird and Owen Barrett identified as missing welcome emails (onboarded while Brevo key was absent)
- `resend-welcome` one-shot EF deployed — resent branded welcome with fresh set-password links
- BCC to team@vyvehealth.co.uk confirmed working on all future onboarding emails

### Backlog Updated
- Added: password reset email template (desktop task)
- Added: Exercise page redesign (product idea — gym / cardio / walking plan umbrella)

### Product Thinking
- Discussed replacing "Workouts" nav item with "Exercise" umbrella page
- Members choose path at onboarding: gym programme, running plan, walking/activity plan, or mix
- Each path generates an 8-week personalised plan (Sandra use case — non-gym corporate members)
- Key open question: do non-gym plans use same `workout_plan_cache` structure or simpler format?
- Decision deferred — parked in backlog under Later
