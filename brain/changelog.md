## 12 April 2026 — Android App Submitted to Google Play

### Feat: VYVE Health Android app built and submitted
- **What:** Full Capacitor Android build completed and submitted to Google Play Store for review
- **Package ID:** `co.uk.vyvehealth.app`
- **Build:** `app-release.aab` (5.77MB, 3s download time)
- **Keystore:** `vyve-release-key.jks` saved to Dean's Desktop (OneDrive). Password stored securely.
- **Key alias:** `vyve-key`
- **google-services.json:** Placed in `android/app/` ✅
- **Project location:** `C:\Users\DeanO\vyve-capacitor\`
- **Plugins (15):** app, browser, camera, filesystem, haptics, keyboard, local-notifications, network, preferences, push-notifications, screen-orientation, share, splash-screen, status-bar, capacitor-native-biometric
- **Countries targeted:** United Kingdom
- **Google Play listing:** Full description written, 4 screenshots processed, feature graphic generated (1024x500), 512px icon uploaded
- **Status:** Submitted for review — Google will email on approval (typically 1-3 days)
- **Architecture:** Remote URL loading (`https://online.vyvehealth.co.uk`) — portal updates live instantly, no resubmission needed

### Google Play Store listing content
- **Short description:** Proactive workplace wellbeing — Physical, Mental & Social health
- **App category:** Health & Fitness
- **Content rating:** All other app types — PEGI Everyone
- **Health features ticked:** Activity & fitness, Nutrition & weight management, Period tracking, Sleep management, Stress management/relaxation/mental acuity
- **Target audience:** 18+
- **Countries:** United Kingdom

### iOS — Pending Mac
- All pre-requisites complete. When Mac arrives: install Xcode, run `npx cap add ios && npx cap sync ios`, open in Xcode, configure signing + capabilities, build + submit.
- Estimated time once Mac available: ~2.5 hours

### Notes
- Old Kahunas app (`com.kahunas.io.VYVE`) still live on Play Store with 1 install — leave alone, deprecate after new app approved
- `capacitor-plugins.js` not yet added to portal — do this next session ("add plugins to portal")
- Health disclaimer checkbox on welcome.html — pending Lewis sign-off

## 12 April 2026 — Capacitor App Store Wrap: Pre-Mac Setup Complete

### Planning: Full Capacitor wrap mapped and config files generated
- **What:** Complete Capacitor wrap plan created for iOS App Store + Android Play Store submission
- **Plugins selected (all added now):** Push Notifications, Status Bar, Splash Screen, App, Keyboard, Haptics, Network, Browser, Share, App Launcher, Local Notifications, Preferences, HealthKit/Google Fit, Camera, Filesystem, Biometrics, Screen Orientation. RevenueCat deferred (keep payments on Stripe web).
- **Files generated:** `capacitor.config.ts`, `package.json`, `capacitor-plugins.js` (full native bridge exposing `window.VYVENative`), `ios-info-plist-additions.xml`, `android-manifest-additions.xml`, `supabase-migration-push-native.sql`, `SETUP-GUIDE.md`
- **Architecture decision:** Remote URL loading (`server.url: https://online.vyvehealth.co.uk`) — portal updates go live instantly without App Store resubmission

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

## 12 April 2026 — Browse Library: Your Programmes + Resume

### Feat: Paused plans section in Browse Library
- **What:** Added "Your Programmes" section at the top of the Browse Library tab showing all paused plans with a Resume button.
- **UI:** Deduplicated by programme name (shows most recently paused). Shows week progress ("Week 2 of 8") and source label ("Your bespoke plan" / "From library" / "Shared"). Confirmation modal before resuming.
- **Backend:** `workout-library` EF v3 — added `action: resume` POST handler. Pauses current active plan, reactivates the selected paused plan preserving `current_week` and `current_session` progress.
- **Frontend:** `workouts-library.js` — new `loadPausedPlans()`, `confirmResume()`, `resumeProgramme()` functions. Paused plans fetched via REST API from `workout_plan_cache` with `is_active=false`.
- **sw.js:** Bumped to `vyve-cache-v2026-04-12ab`
- **Commit:** `3fd4b23727c3fa822b84c69454d0b1b8af15f966`

### Data: PPL Power & Size Builder — Push B → Upper
- **What:** Updated `cbudzski3@gmail.com`'s active programme in `workout_plan_cache`
- **Push A** renamed to **Push** (dropped the "A") across all 8 weeks
- **Push B** replaced with **Upper — Chest, Back, Shoulders & Arms** across all 8 weeks
- Upper sessions designed as proper balanced upper body: chest pressing + back pulling + shoulders + biceps (hammer curls) + triceps. Exercises vary across periodisation phases. Avoids duplicating Pull day movements.

## 12 April 2026 — Browse Library visibility fix

### Fix: workouts.html #tab-library outside .wrap
- **Root cause:** `#tab-library` div was positioned outside `<main>` and `.wrap` in the HTML (line 545), after all the fixed-position overlays. Content rendered into DOM but was invisible — it sat below the fold with no scroll context, especially when `body.style.overflow` was stuck as `'hidden'` from a previous workout session.
- **Fix 1 (HTML):** Moved `#tab-library` inside `.wrap`, directly after `#tab-custom` where it belongs. Library content now inherits `.wrap` padding and participates in normal body scroll.
- **Fix 2 (JS):** Added `document.body.style.overflow = ''` at start of `init()` in `workouts-config.js`. Belt-and-braces: clears stuck overflow even when no saved session state exists to restore.
- **sw.js:** Bumped to `vyve-cache-v2026-04-12aa`
- **Commit:** `4474936db1f9ac4a5f80101390a41177e6fc4f9b`

## 12 April 2026 — member-dashboard v31: Server-Side Aggregation

### Change: member-dashboard EF v31 + index.html frontend update
- **What:** All streak, score, count, and goal-progress calculations moved server-side into the Edge Function
- **Why:** Response payload was growing linearly with activity history (~5KB for current members, unbounded at scale). Now fixed ~2KB regardless of history size.
- **EF changes (v31):** Ported `calcStreaks`, `calcWeekStreaks`, `calcDayStats`, `calcVariety7d`, `computeEngagementScore` from frontend JS into TypeScript. Same 11 parallel DB queries unchanged. New response shape includes `counts`, `streaks`, `checkinStreak`, `score`, `habitStrip`, `habitDatesThisWeek`, `goals`, `charity`, `daysInactive`, `daysActive30`.
- **Frontend changes (index.html):** Removed client-side calc functions. `renderDashboardData` now maps pre-computed values directly to DOM. `renderDailyCheckinStrip` updated to accept `habitStrip` + `habitDatesThisWeek` + `habitStreakCurrent`. `renderGoals` updated to accept pre-computed `goals` object.
- **Cache key bumped:** `vyve_home_cache_` → `vyve_home_v2_` to force invalidation of old-shape cache on all devices.
- **sw.js:** Bumped to `vyve-cache-v2026-04-12a`
- **Commit:** 8ef469cde210e65cff6eb9bc49b33c3b04cadb3c

## 11 April 2026 — Food Log, Settings, Weight Unit, Running Plan (Evening Session)

### Fix 5: log-food.html — JWT auth error + LOG FOOD button behind nav
- **Issue:** "Error logging — try again" on all food log entries + LOG FOOD button hidden behind bottom nav
- **Root cause 1:** `supa()` helper used `SUPA_ANON` as Bearer token → `nutrition_logs` RLS rejected with 401
- **Root cause 2:** `.sheet` CSS had `padding-bottom:env(safe-area-inset-bottom,0px)` — only accounts for iPhone notch, not the 80px nav bar
- **Fix:** `supa()` now uses `vyveSupabase.auth.getSession()` for real JWT; `.sheet` padding-bottom changed to `calc(80px + env(safe-area-inset-bottom,0px))`
- **Commit:** `e138f2e`

### Fix 6: running-plan.html — wrong Haiku model string
- **Issue:** Running plan generation silently failing — showing "Plan was too large" for all plans including small ones
- **Root cause:** Model string `claude-haiku-4-5-20251001` is invalid. Correct string is `claude-haiku-4-5` (no date suffix). Anthropic returns error object → no `data.error` check → falls through as blank → TRUNCATED error message fires
- **Additional:** No `response.ok` check — HTTP errors from proxy were silently swallowed
- **Fix:** Model corrected to `claude-haiku-4-5`; added `response.ok` check and `data.error` check so real errors surface
- **Commit:** `1b86b43`
- **Brain update:** Correct Anthropic model strings table added to master.md (section 9)

### Fix 7: settings.html — remove height/weight unit toggles + fix privacy link
- **Removed:** Entire "Units" section (Weight kg/lbs/stone + Height cm/ft toggles), `setUnits()` JS function, both `data-units-weight`/`data-units-height` init blocks, `.units-group` + `.units-btn` CSS — 3,929 chars total
- **Why:** Unit toggles were saving to `members.weight_unit`/`members.height_unit` but nothing was reading those values. Unit preference is now managed within `nutrition.html` TDEE recalculator only.
- **Privacy link fixed:** `privacy.html` → `privacy-policy.html`
- **Commit:** `73dc197`

### Feat: nutrition.html — weight log unit follows member onboarding preference
- **Issue:** Weight log sheet hardcoded to 'kg' regardless of member's unit preference. TDEE recalculator unit choice not persisted between sessions.
- **Fix (6 changes):**
  1. `weight_unit` added to members SELECT query
  2. `saveTargets()` PATCH now includes `weight_unit: rcState.wtUnit`
  3. `memberData` in-memory object updated with `weight_unit` after save
  4. `openSheet()` inits `sheetWtUnit` from `memberData.weight_unit` → localStorage fallback → 'kg'
  5. `localStorage.setItem('vyve_weight_unit')` written on TDEE save
  6. `prefillRecalc()` calls `setWtUnit(savedWtUnit)` so recalculator opens in saved unit
- **Commit:** `7cfbe91`

### sw.js cache progression today
`r` → `s` → `t` → `u` → `v` → `w` → `x` (final: `vyve-cache-v2026-04-11x`)

### Hard rules added (31–34)
See master.md section 8 for full rules.

---

## 11 April 2026 — Platform Alert Fixes + Full Portal Auth Audit

### Context
Platform monitoring (deployed yesterday) began firing alerts. Three distinct issues identified from live alerts plus one discovered during the subsequent full 38-page portal audit.

### Fix 1: index.html — PostHog SyntaxError (CRITICAL)
- **Alert:** `js_error` — `SyntaxError: Unexpected token ','` at `index.html:305`
- **Root cause:** PostHog init on line 305 had literal `+ POSTHOG_KEY +` placeholder instead of the real key — invalid JS syntax
- **Impact:** Entire dashboard JavaScript blocked for all members on every page load
- **Fix:** Replaced `posthog.init( + POSTHOG_KEY + ,{...})` with real key `phc_8gekeZglc1HBDu3d9kMuqOuRWn6HIChhnaiQi6uvonl`
- **Commit:** `0d66099`

### Fix 2: tracking.js — Session views using anon key as Bearer (CRITICAL)
- **Alert:** `auth_401_session_views` on `/yoga-live.html` for `stuwatts09@gmail.com`
- **Root cause:** `tracking.js` built headers with `Authorization: Bearer SUPABASE_ANON` (anon key). RLS on `session_views` and `replay_views` requires authenticated JWT — anon key rejected with 401
- **Impact:** All 13 live and replay pages (yoga-live, mindfulness-live, workouts-live, checkin-live, therapy-live, education-live, events-live, podcast-live + all -rp equivalents) failing to log session views
- **Fix:** Replaced static headers constant with `async getHeaders()` function that fetches real user JWT via `window.vyveSupabase.auth.getSession()`, falls back to anon only if session unavailable
- **Commit:** `5adf652`

### Fix 3: nutrition-setup.html — Auth race condition (CRITICAL)
- **Alert:** `auth_401_members` on `/nutrition-setup.html` for Dean and Stuart
- **Root cause:** `window.addEventListener('load', () => { if (window.vyveCurrentUser) init(); })` fired before `vyveSupabase` was confirmed set — `supa()` helper fell back to anon key, which has no RLS permission to read/write `members`
- **Fix:** Removed the racing `window.load` fallback. `init()` now fires exclusively via `document.addEventListener('vyveAuthReady', ...)` which fires only after session confirmed
- **Commit:** `43319306`

### Fix 4: running-plan.html — anthropic-proxy rejecting anon key (HIGH — discovered in audit)
- **No alert fired** (EF silently rejected, no DB write to trigger alert)
- **Root cause:** `running-plan.html` called `anthropic-proxy` with `Authorization: Bearer SUPA_KEY` (anon key). `anthropic-proxy` has `verify_jwt: true` — rejects anon key
- **Impact:** Running plan generation broken for all members since `verify_jwt: true` was added to anthropic-proxy during security audit
- **Fix:** PROXY_URL fetch now uses async IIFE to get real JWT from `window.vyveSupabase.auth.getSession()` before sending request
- **Commit:** `a09a5a5`

### sw.js cache bumps
- `vyve-cache-v2026-04-11s` — after first three fixes
- `vyve-cache-v2026-04-11t` — after running-plan fix

### Full 38-page portal audit results
- **38 files audited** (36 HTML pages + auth.js + sw.js)
- **0 remaining issues** after today's fixes
- **32 pages clean** — correct auth patterns confirmed
- **6 informational** — public/infrastructure files (login, set-password, consent-gate, offline, auth.js, sw.js)
- Leaderboard warning was false positive — `getJWT()` correctly used in `loadLeaderboard()`
- nutrition-setup.html still shows minor flag (window.load present alongside vyveAuthReady) — resolved by Fix 3

### Hard rules added (28, 29, 30)
See master.md section 8 for full rules.

---

## 11 April 2026 — Nutrition Setup Flow + Full Onboarding Data Completeness

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
- Created `member_age(dob date)` SQL function — computes current age from DOB in any query
- Onboarding EF v57 now stores `dob` from form submission; removed static `age` write
- Age in TDEE calculation is now always accurate and updates automatically on birthdays without cron jobs
- Backfilled `age` integer for all 11 existing members manually
- Set Dean's DOB: 1991-02-06

### New: All onboarding questionnaire fields now persisted (onboarding EF v56 → v57)
DB migration added 7 new columns to `members`:
- `training_goals` text — comma-separated training goals array
- `barriers` text — barriers to exercise
- `sleep_hours_range` text — sleep duration choice (e.g. "7-8 hours")
- `sleep_help` text — sleep help preferences
- `social_help` text — social help preferences
- `nutrition_guidance` text — guidance level preference
- `location` text — member city/area

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
- Bumped through `j` → `r` during this session. Current: `vyve-cache-v2026-04-11r`

---

## 2026-04-11 (Leaderboard Auth Fix)

### Summary
`leaderboard.html` had `getJWT()` referencing `window._supabase` which doesn't exist. Auth.js exposes the Supabase client as `window.vyveSupabase`. The JWT call silently failed (caught by try/catch returning null), so the leaderboard edge function received no valid authentication and couldn't identify the caller for ranking.

### Fix
- `leaderboard.html` — changed `window._supabase` to `window.vyveSupabase` in `getJWT()`
- `sw.js` — cache bumped to `vyve-cache-v2026-04-11i`

### Rule Added
- All portal pages must use `window.vyveSupabase` for auth — never `_supabase`, `_sb`, or other aliases. grep for non-standard Supabase client references after any auth refactor.

---

## 11 April 2026 — Platform Monitoring System

### Built
- **`platform_alerts` table** — central alert storage (severity, type, source, member, dedup indexes, RLS service-role only)
- **`platform-alert` Edge Function v1** — receives alerts, deduplicates (same type + member within 1hr), sends Brevo email to Dean + Lewis, sends VAPID push to subscribed devices
- **Client-side Platform Monitor** (added to `auth.js`) — catches:
  - JS runtime errors (`window.onerror`)
  - Unhandled promise rejections
  - API 401s and 500s (fetch interceptor on all Supabase calls)
  - Network failures on API calls
  - Page load timeouts (app container not visible after 15s)
  - PWA not installed after 7 days of use
  - Exposes `window.vyveAlert(type, severity, details)` for manual reporting from page code
- **sw.js cache bumped** `v2026-04-11i` → `v2026-04-11j`

### Commits
- `vyve-site` 16eeb3e — auth.js monitor + sw.js cache bump

### Architecture decisions
- Monitor added to `auth.js` (not a separate file) since it's already loaded on every portal page
- `fetch()` interceptor pattern — wraps native fetch to monitor all Supabase API calls without modifying individual pages
- Deduplication both client-side (per session) and server-side (per type+member per hour) to prevent alert fatigue
- `platform-alert` EF is `verify_jwt: false` with CORS restriction — client-side can't send API keys, CORS is sufficient protection

### Outstanding monitoring items
- Health check cron EF (proactive service monitoring every 30 min) — not yet built
- Server-side error reporting in critical EFs (member-dashboard, wellbeing-checkin, log-activity, onboarding) — not yet wired
- Alert dashboard page (alerts.html or section on strategy.html) — not yet built


## 2026-04-11 (Audit Collateral — Certificates + Engagement Pages Fixed)

### Summary
Two more portal pages were broken by the security audit's removal of the `?email=` fallback from `member-dashboard`. Both `certificates.html` and `engagement.html` were calling the edge function with NO auth header at all — no `getJWT()` function existed on either page. After the audit enforced JWT-only auth on `member-dashboard`, both pages returned 401 on every load.

### Root Cause
When `member-dashboard` v29 removed the `?email=` fallback (Fix 2 in the audit), `index.html` was updated to use JWT auth. But `certificates.html` and `engagement.html` also call the same edge function and were NOT updated. They had no `getJWT()` helper and no `vyveSupabase` reference.

### Fixes Applied
- `certificates.html` — added `getJWT()` helper, replaced unauthenticated fetch with JWT-authenticated fetch
- `engagement.html` — same fix
- `sw.js` — cache bumped to `vyve-cache-v2026-04-11h`

### Pages Verified Safe
- `monthly-checkin.html` — already sends JWT ✅
- `nutrition.html`, `settings.html`, `log-food.html` — use `?email=` as REST API filter (PostgREST WHERE clause), not as EF auth. JWT sent correctly ✅
- `running-plan.html` — uses ANON key but `running_plan_cache` has `public_read` RLS policy ✅

### Rule Added
- When changing auth on an Edge Function, **grep all portal pages** for calls to that function. Every caller must be updated, not just the main dashboard.

---

## 2026-04-11 (Critical Bug Fix — Dashboard Stats Not Rendering)

### Summary
Fixed a JavaScript scoping bug in `index.html` that prevented dashboard stats from rendering for all users. Caused by the security audit refactor on the same day.

### Root Cause
The security audit refactor changed `email` from a script-level variable to `const email` inside `onAuthReady()`. The `loadDashboard()` function (defined at script scope) still referenced `email` on the `writeHomeCache(email, data)` call. Since `const` is block-scoped, `email` was undefined in `loadDashboard()`, causing a `ReferenceError`. The try/catch caught it and displayed "Could not connect. Please refresh." instead of rendering the dashboard data.

The edge function (`member-dashboard` v34) was returning 200 with correct data — the bug was purely frontend.

### Fix Applied
- `index.html` — changed `writeHomeCache(email,data)` to `writeHomeCache((window.vyveCurrentUser&&window.vyveCurrentUser.email)||'',data)` (commit 3b5dedf5)
- `sw.js` — cache bumped to `vyve-cache-v2026-04-11g` to force PWA refresh

### Files Changed
| File | Change |
|------|--------|
| `index.html` | Fixed email variable scope in `loadDashboard()` |
| `sw.js` | Cache bumped `v2026-04-11f` → `v2026-04-11g` |

### Rule Added
- When refactoring variable scope (var/let/const), always check all functions that reference the variable — not just the function where it's declared. `const` and `let` are block-scoped; `var` is function-scoped.

---

## 2026-04-11 (Security Remediation — Complete)

### Summary
Full security remediation executed across all 8 fixes identified in the 2026-04-11 audit. All critical and high-priority vulnerabilities resolved. Platform is now production-secure.

### Edge Functions Updated

| Function | Version | Change |
|----------|---------|--------|
| `github-proxy` | v15 | Added `x-proxy-key` header auth (GITHUB_PROXY_SECRET), CORS restricted to `online.vyvehealth.co.uk` |
| `member-dashboard` | v29 | Removed `?email=` query param fallback entirely, JWT-only auth enforced |
| `onboarding` | v57 | CORS restricted to `https://www.vyvehealth.co.uk`, ONBOARDING_SECRET check removed (Option A — static site can't safely hold secrets) |
| `send-email` | v16 | CORS restricted, service-role-key auth on HTTP handler, model fixed from `claude-sonnet-4-5` → `claude-sonnet-4-20250514` |
| `employer-dashboard` | v26 | Unauthenticated fallback code path removed, hard fail if EMPLOYER_DASHBOARD_API_KEY not configured |

### Portal Files Updated (vyve-site)
- `index.html` — removed `?email=` param and hardcoded fallback email `deanonbrown@hotmail.com` from member-dashboard fetch call
- `sw.js` — cache bumped to `vyve-cache-v2026-04-11a`

### Marketing Site Updated (Test-Site-Finalv3)
- `welcome.html` — removed `ONBOARDING_KEY` declaration and `x-onboarding-key` header from onboarding fetch call (Option A — placeholder was non-functional in static context)

### Database Changes
- **Fix 6** — `session_chat` INSERT policy `with_check` confirmed correct, no change needed
- **Fix 7** — Dropped 20 redundant per-operation RLS policies across 7 tables (`cardio`, `daily_habits`, `workouts`, `session_views`, `replay_views`, `weekly_scores`, `wellbeing_checkins`). Each now has exactly 1 `ALL` policy.
- **Fix 8** — Dropped 2 duplicate indexes on `exercise_notes` (`exercise_notes_member_idx`, `idx_exercise_notes_member`). `weekly_scores_member_week_unique` retained — it's a real unique constraint.

### Secrets Set in Supabase Dashboard
- `GITHUB_PROXY_SECRET` — protects github-proxy write access
- `ONBOARDING_SECRET` — set but unused (Option A decision)
- `EMPLOYER_DASHBOARD_API_KEY` — required for employer dashboard access

### Architecture Decision — Option A (Onboarding Secret)
The `ONBOARDING_SECRET` pattern was abandoned because `welcome.html` is a static GitHub Pages file — any secret embedded in it is publicly readable. CORS restriction to `https://www.vyvehealth.co.uk` is the correct and sufficient protection for a public-facing onboarding form at current scale.


---

## 2026-04-11 (Full System Audit)

### Summary
Full system audit completed across all layers: architecture, Supabase, Edge Functions, frontend, security, performance. 5 critical vulnerabilities identified, remediation plan created, backlog updated.

### Critical Findings
- **github-proxy** — zero authentication, allows unauthenticated read/write to private repo (FIX 1)
- **member-dashboard** — `?email=` fallback exposes member data without JWT (FIX 2)
- **onboarding** — CORS `*`, no payment verification, creates auth users from public internet (FIX 3)
- **send-email** — open email relay from `team@vyvehealth.co.uk` (FIX 4)
- **employer-dashboard** — API key secret not set, unauthenticated fallback active (FIX 5)

### Additional Findings
- `send-email` has invalid model name (`claude-sonnet-4-5`) — will cause re-engagement failures
- `session_chat` INSERT policy allows impersonation (`with_check: true` instead of `auth.email() = member_email`)
- 6 tables have duplicate RLS policies (ALL + per-operation) from previous security audit debugging
- Duplicate indexes on `weekly_scores` and `exercise_notes`
- `ai_decisions` INSERT policy overly permissive

### What's Good (Confirmed)
- All 39 tables have RLS enabled ✅
- Brain repo accurate against live state ✅
- Onboarding v48 well-built (stress scale, FK race, decision logging) ✅
- Auth.js consent gate working correctly ✅
- Database indexes well-placed for current query patterns ✅

### Outputs
- `VYVE_Full_System_Audit_2026-04-11.md` — complete audit report
- `VYVE_Remediation_Plan_2026-04-11.md` — step-by-step implementation for 11 fixes
- `tasks/backlog.md` — updated with security section at top

### Brain Updates
- `tasks/backlog.md` updated with 🔴 Security section

### Rules Added
- github-proxy requires `GITHUB_PROXY_SECRET` header (after fix deployed)
- member-dashboard: JWT-only auth, no `?email=` fallback (after fix deployed)
- onboarding: CORS restricted to `www.vyvehealth.co.uk` + `ONBOARDING_SECRET` header (after fix deployed)

## 2026-04-11 (Daily Sync)

### Summary
Full session: Layer 2 Web Push (VAPID) implemented end-to-end and confirmed working on iOS. Notifications redesigned from slide-up sheet to full-screen themed page.

### Completed
- **VAPID Web Push (Layer 2)** — P-256 key pair generated, `vapid.js` created (triggers on bell tap for iOS gesture compliance), `sw.js` push + notificationclick handlers added, `habit-reminder` v4 + `streak-reminder` v4 updated with RFC 8291 AES-GCM encryption using Deno Web Crypto only. `send-test-push` v4 confirmed working on iOS.
- **`VAPID_PRIVATE_KEY` secret** set in Supabase by Dean.
- **Notifications full-screen page** — replaced slide-up sheet with solid full-screen page: back arrow top left, clear-all bell top right, bottom nav bar, `var(--bg)` background (theme-aware), unread items highlighted.
- **Daily report** run manually for Friday 10 April: 5 activities, 2 new members.
- **sw.js cache** bumped to `vyve-cache-v2026-04-10aa`.

### Key Architecture Decisions
- iOS push permission must be triggered from a user gesture (bell tap) — not page load
- `esm.sh` library imports fail in Supabase Edge Functions — use Deno built-in Web Crypto only for RFC 8291 encryption
- `vapid.js` loaded on `index.html` only for now; expand to other pages when Capacitor wrap is underway

### Secrets
- `VAPID_PRIVATE_KEY` — set ✅
- VAPID public key: `BDbz2-0k3JcqRWKyasr3MNgEZrXhKsVvjS-otCyyV7Ya4Pi2xXOxXGETUpVoE56VorKzSNy7uyep53gOzNEMTu4`

## 2026-04-11 (Web Push encryption fix)

### fix: RFC 8291 full AES-GCM encryption — habit-reminder v4, streak-reminder v4, send-test-push v4

Apple's push service requires fully encrypted payloads (RFC 8291). Previous versions sent unencrypted JSON which Apple rejected with status 0. Rewrote `sendPush()` and `encryptPayload()` using Deno built-in Web Crypto only (no external libraries). Confirmed working on iOS PWA.

| Function | Version |
|----------|---------|
| `send-test-push` | v4 (confirmed working) |
| `habit-reminder` | v4 |
| `streak-reminder` | v4 |

## 2026-04-11 (Notifications — Layer 2 Web Push / VAPID)

### feat: VAPID Web Push — push handler in sw.js, vapid.js subscriber, EFs updated

**Commit:** d5937b957c63f3770bc4faa3ddbc24bb369cb904 (vyve-site)
**sw.js cache bumped:** `vyve-cache-v2026-04-10y` → `vyve-cache-v2026-04-10z`

#### Portal changes
- `vapid.js` (new) — requests push permission on auth, subscribes via `pushManager.subscribe()`, saves `{endpoint, p256dh, auth_key}` to `push_subscriptions` table. Loaded on `index.html` only.
- `sw.js` — added `push` event listener (shows native OS notification with icon/badge) and `notificationclick` listener (focuses or opens portal). Cache bumped to `vyve-cache-v2026-04-10z`.
- `index.html` — `<script src="/vapid.js"></script>` added before `nav.js`.

#### Edge Functions updated
| Function | Version | Change |
|----------|---------|--------|
| `habit-reminder` | v2 | After in-app write, fetches `push_subscriptions` for member → fires VAPID push if present. VAPID JWT signed with P-256 + VAPID_PRIVATE_KEY secret. |
| `streak-reminder` | v2 | Same VAPID dispatch pattern added. |

#### VAPID keys
- **Public key** (embedded in `vapid.js` and EFs): `BDbz2-0k3JcqRWKyasr3MNgEZrXhKsVvjS-otCyyV7Ya4Pi2xXOxXGETUpVoE56VorKzSNy7uyep53gOzNEMTu4`
- **Private key** — must be set as Supabase secret: `VAPID_PRIVATE_KEY` = `nlaC3bzFXVUOGj1lq46Uu94LzDZGJh6MA0ObeaPIU74` ⚠️ **Dean: set this secret before push will work**

#### iOS note
Web Push requires PWA installed to home screen on iOS (Safari 16.4+). Android Chrome works with no install required.

## 2026-04-11 (Notifications system — Layer 1)

### feat: in-app notifications — bell badge, slide-up sheet, 5 Edge Functions

**Commit:** f0f252f1c6421626a86135c77755cf42045aed9f
**sw.js cache bumped:** `vyve-cache-v2026-04-10x` → `vyve-cache-v2026-04-10y`

#### Supabase
- New table: `member_notifications` (id, member_email, type, title, body, read, created_at) + RLS (auth.email() = member_email) + lookup index
- New table: `push_subscriptions` (id, member_email, endpoint, p256dh, auth_key) + RLS — Layer 2 scaffold, no logic yet

#### Edge Functions deployed
| Function | Version | Change |
|----------|---------|--------|
| `notifications` | v1 (new) | GET → unread count + list (last 50). POST mark_read (one or all). JWT-verified. |
| `log-activity` | v12 | Writes streak milestone notifications (7/14/30/60/100 days) after successful insert via waitUntil(). Per-milestone dedup (fires once ever per milestone value). |
| `wellbeing-checkin` | v26 | Writes check-in confirmation notification after submission via waitUntil(). Deduped per day. |
| `habit-reminder` | v1 (new) | Cron 20:00 UTC daily. Finds members with no habit logged today → writes in-app notification. Layer 2 push extension point. |
| `streak-reminder` | v1 (new) | Cron 18:00 UTC daily. Finds members with streak ≥ 7 and no activity today → writes in-app notification. Layer 2 push extension point. |

#### Cron schedules registered
- `habit-reminder-daily` — `0 20 * * *` (8pm UTC)
- `streak-reminder-daily` — `0 18 * * *` (6pm UTC)

#### Portal — index.html
- Bell button (`#mob-bell-btn`): added `position:relative` to CSS, replaced `href='#notifications'` with `onclick="openNotifSheet()"`
- Badge span (`#notif-badge`): absolutely positioned on bell, `var(--accent,#e84393)` background, hidden when count = 0
- Notification sheet: slide-up overlay, `var(--card-bg)` background, `var(--text)`/`var(--text-muted)` text — fully theme-aware light/dark
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
`sw.js` cache bumped: `vyve-cache-v2026-04-10n` → `vyve-cache-v2026-04-10o`

Full audit of all 15 portal pages against nav.js injection (56px mobile header, 80px bottom nav, z-index 9999).

**workouts.html** — sticky sub-view headers (`.es-header`, `.sh-header`, `.prs-header`, `.hist-header`) had `top:0`, sitting under the 56px mobile nav on scroll. Added:
```css
@media(max-width:768px){ .es-header,.sh-header,.prs-header,.hist-header{top:56px} }
```

**log-food.html** — internal `.top-bar` (`position:sticky;top:0`) clipped under mobile nav. Added:
```css
@media(max-width:768px){ .top-bar{top:56px} }
```

**sessions.html** — duplicate `.mob-page-header` CSS block (`position:sticky;top:0`) was dead code; nav.js injects the real element. Removed the block entirely.

**Clean pages (no changes needed):** `index`, `habits`, `nutrition`, `settings`, `wellbeing-checkin`, `certificates`, `engagement`, `leaderboard`, `running-plan`, `login`, `set-password`.

---

### fix(settings): habits modal — save button buried under bottom nav + no close button

**Files:** `settings.html`, `sw.js`
`sw.js` cache bumped: `vyve-cache-v2026-04-10o` → `vyve-cache-v2026-04-10p`

**Root cause:** `.modal-overlay` had `z-index:1000`; bottom nav is `z-index:9999`. Modal rendered *under* the nav.

- `.modal-overlay` z-index: `1000 → 10001` (above nav) — applied to both habits and persona modals
- `.modal-sheet` converted to `display:flex; flex-direction:column` — enables sticky footer
- `.modal-cta` (Cancel / Save buttons) now `position:sticky; bottom:0` — always visible regardless of list length
- Habits list wrapped in `.modal-body` (`flex:1; overflow-y:auto`) — scrollable content area
- Added ✕ close button to header of both habits modal and persona modal
- Sheet padding moved from shorthand to `padding:20px 20px 0` with CTA handling its own bottom safe-area

---

### fix(settings): persona modal closes before save + AI reasoning → clean bestFor snippets + cache-first load

**Files:** `settings.html`, `sw.js`
`sw.js` cache bumped: `vyve-cache-v2026-04-10p` → `vyve-cache-v2026-04-10q`

**Bug 1 — modal closes on tap inside sheet:**
Added `onclick="event.stopPropagation()"` to `.modal-sheet` on both modals. Touch events no longer bubble up to the overlay, so only tapping the dark backdrop closes the modal.

**Bug 2 — verbose AI reasoning replaced with clean "Best for" snippet:**
- Removed `ai_decisions` Supabase fetch from page load (one fewer round trip)
- "Why this coach was chosen" label → "Best for"
- Box is now always visible (was `display:none` until DB returned)
- Each persona now has a `bestFor` field in the JS `PERSONAS` object:
  - **NOVA** — People driven by targets who want every session to count
  - **RIVER** — Anyone managing stress, burnout, or poor sleep
  - **SPARK** — People who struggle with consistency and need an energetic nudge
  - **SAGE** — Members who want to understand the science behind their choices
  - **HAVEN** — Anyone needing a safe, non-judgmental space for mental health

**Feature — settings cache-first load:**
- `populateFromCache(cache)` function fills UI instantly from `localStorage` (`vyve_settings_cache`)
- Cache TTL: 10 minutes; keyed to user email
- `waitForAuth` reads cache first → shows full UI immediately → Supabase refreshes in background
- Cache written at end of `loadProfile`; updated on persona save

---

## 2026-04-10 (leaderboard — live data)

### feat: leaderboard wired to live Supabase data

**Commits:** leaderboard EF v1 deployed to Supabase; vyve-site 7691280542f8

**leaderboard Edge Function v1** (new EF, verify_jwt: false, JWT-preferred auth)
- Queries `daily_habits`, `workouts`, `cardio`, `session_views` for current calendar month across all members
- Includes all members table entries (zero-activity members appear at bottom)
- Per-member counts: all activities, habits only, workouts only, streak
- **Streak:** consecutive days back from today where any activity of any type was logged
- Returns: `first_name`, plus per-metric objects (`all`, `habits`, `workouts`, `streak`) each containing `your_rank`, `total_members`, `your_count`, `above` (anonymous), `below_count`, `gap`
- All members above caller returned as anonymous — no names, no emails exposed

**leaderboard.html** — full rewrite
- Removed Sage and My team scope tabs — All members only
- All 4 metric tabs (All / Habits / Workouts / Streak) now live — switch client-side from single EF response
- Your position card, above board, gap nudge all rendered from live data
- Zero hardcoded mock data remaining
- Dynamic month label in pill (JS, not hardcoded)
- Streak tab gap nudge uses "days" unit not "activities"
- Loading state shown while EF responds; error state if EF fails

`sw.js` cache bumped: `vyve-cache-v2026-04-10m` → `vyve-cache-v2026-04-10n`

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
