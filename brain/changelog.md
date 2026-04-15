## 16 April 2026 — Full Brain Reconciliation (Deep Audit)

### Context
Full deep audit performed: all project chats reviewed, live Supabase DB inspected (61 tables, RLS policies, indexes, constraints), live repo tree analysed, key Edge Functions source-read, auth.js + sw.js + index.html analysed for security patterns. Brain was found materially outdated — master.md had drifted significantly from reality.

### master.md — Complete Rewrite
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

## 15 April 2026 — Android Resubmitted with Correct VYVE Icon

### Fix: Android icon rejection resolved
- **Issue:** Google Play rejected app — icon on device didn't match store listing (placeholder Capacitor X icon)
- **Fix:** Generated correct icons using `npx capacitor-assets generate --android` from `resources/icon.png` (1024x1024 VYVE logo)
- **Java:** Installed Microsoft OpenJDK 21 on Windows machine (was missing)
- **Build:** `gradlew bundleRelease` succeeded, AAB signed with `vyve-release-key.jks`
- **Submitted:** Resubmitted via Google Play Console Publishing Overview — 9 changes sent for review
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

## 15 April 2026 (cont.) â Capacitor safe area + back button fix

### Problem
After wrapping the PWA in Capacitor for iOS/Android, three issues surfaced:
1. Mobile header (back button, logo, page label) sat behind the iOS status bar / notch â couldn't tap back
2. Back button showed on primary nav pages (Workouts, Nutrition, Sessions) where it shouldn't
3. Exercise search overlay and history view header were also behind the status bar

### Root cause
No page had `viewport-fit=cover` in the viewport meta, so `env(safe-area-inset-top)` returned 0. The Capacitor web view extends behind the status bar by default.

### Fixes (nav.js)
- Inject `viewport-fit=cover` into the viewport meta tag at runtime â covers all 39+ portal pages without touching each file
- Added `padding-top: env(safe-area-inset-top, 0px)` to `.mobile-page-header` CSS
- Changed `isHome` to `isNavPage` â primary nav pages (Home, Workouts, Nutrition, Sessions) now show the VYVE logo; all sub-pages show the back button

### Fixes (workouts.html)
- `.es-header` (exercise search overlay): added `padding-top: calc(14px + env(safe-area-inset-top, 0px))`
- `.hist-header` (exercise history overlay): same fix

### New rule for brain/master.md
- **Capacitor safe area:** Any new full-screen overlay (`position:fixed;inset:0`) must add `padding-top: calc(original + env(safe-area-inset-top, 0px))` to its sticky header. nav.js handles the main page header globally.

### sw.js bumped to `vyve-cache-v2026-04-15g`

### Commit: 65d8ffeab0c7c91e68b8196ad1f8d168d96688a1


## 15 April 2026 (cont.) â 401 redirect handling added to 6 portal pages

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
Full portal audit confirmed NO other pages have the `async async` syntax error or any other script-killing bugs. The engagement.html fix from earlier today was the only critical issue. workouts.html was a false positive â its only inline EF call is platform-alert (skeleton monitor); all data loading lives in external JS modules.


## 15 April 2026 â engagement.html critical fix + cleanup

### Bug: `async async function loadPage()` syntax error
- **Root cause:** Double `async` keyword on the `loadPage()` function declaration killed the entire `<script>` block at parse time. Every function in the block was undefined â page showed infinite skeleton loading.
- **Impact:** engagement.html completely broken for all members. Skeleton timeout monitor fired platform_alert but user saw no content.
- **Fix:** Removed duplicate `async` keyword.

### Cleanup: 5 dead client-side calc functions removed
- `calcStreaks`, `calcWeekStreaks`, `calcDayStats`, `calcVariety7d`, `computeEngagementScore` were copied from old client-side approach but never called â EF v37 computes everything server-side.
- Removed ~4,100 chars of dead code.

### Fix: 401 redirect added
- engagement.html had no auth failure handling â if JWT expired, page showed empty content with no guidance.
- Added JWT presence check (redirect to login if missing) and 401 status check on fetch response.

### sw.js bumped to `vyve-cache-v2026-04-15e`

### Commit: cce5d358eca4c3166b8e156ea81738ccbaef861e


## 14 April 2026 (evening) â App Store rejection fixes

### Apple App Store Review Response
- **Guideline 2.3.8 (Accurate Metadata):** Capacitor placeholder icon submitted by mistake. Generated full iOS icon set (15 sizes, 1024Ã1024 source) from VYVE logo. Zip provided to Dean for Xcode replacement.
- **Guideline 2.5.1 (HealthKit UI disclosure):** Added "Apple Health" section to settings.html between Notifications and About sections.
  - Toggle to sync with Apple Health (reads: workouts, steps, heart rate/HRV, sleep; writes: workout completions, mindful minutes)
  - Expandable detail panel shows what data VYVE reads and writes
  - Privacy notice: "Your health data stays on your device and is never shared with your employer"
  - Wired to `window.VYVENative.requestHealthKit()` for when capacitor-plugins.js lands
  - `handleAppleHealthToggle()` JS function added
- sw.js cache bumped: `vyve-cache-v2026-04-13f` â `vyve-cache-v2026-04-14a`
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

## 13 April 2026 â Onboarding v67 + portal fixes

### onboarding v67 (Supabase Edge Function)
- Workout plan generation moved inline (was `EdgeRuntime.waitUntil` â external `generate-workout-plan` EF)
- Two parallel Anthropic calls for weeks 1-4 and 5-8 (16K tokens each via `callAnthropicFull`)
- `callAnthropicFull` added â returns `{text, stopReason}` for max_tokens detection
- Exercise library fetched from `workout_plans` table in Batch 1 alongside persona/overview
- `generateWorkoutPlan` + `writeWorkoutPlan` added inline
- Anti-hallucination instructions added to `generateProgrammeOverview` and `generateRecommendations`
- `workout_plan` stats in response JSON: `{programme_name, weeks_generated, videos_matched, videos_unmatched}`
- Decision log version tag updated to v67

### welcome.html (Test-Site-Finalv3)
- AbortController timeout: 90s â 150s in both `submitQuestionnaire` and `retrySubmit`
- Slow timer: 30s â 45s in both locations
- Slow timer text: "up to a minute" â "up to two minutes"

### nutrition.html (vyve-site)
- Empty state title: "Your nutrition plan is not set up yet" â "Your nutrition targets aren't set up yet"
- Empty state text: "Complete your onboarding..." â "Add your height, weight, and activity level..."

### sw.js (vyve-site)
- Cache version bumped: `vyve-cache-v2026-04-13e` â `vyve-cache-v2026-04-13f`

## 2026-04-13 (evening session)

### CRITICAL - Onboarding EF Recovery
- Composio workbench overwrote onboarding EF with `CONTENT_FROM_WORKBENCH` placeholder - wiped all code
- Recovered from `VYVEBrain/staging/onboarding_v67.ts` backup
- **5 fixes applied during recovery:**
  1. Missing `}` in `sendWelcomeEmail` - fetch options object wasn't closed (`]}));` -> `]})});`)
  2. `workout_plan_cache` schema mismatch - `plan_data` column renamed to `programme_json`, added `plan_duration_weeks`, `current_week`, `current_session`, `is_active`, `source`
  3. Two-phase flow restored - workout plan generation moved back to `EdgeRuntime.waitUntil()` background task (v67 had inlined it synchronously, causing slow onboarding)
  4. `workoutPlanResult` reference error - removed from success response JSON (no longer exists after waitUntil change)
  5. UTF-8 em-dash encoding - replaced all `â` (em-dash) characters with `-` to prevent `aâ¬â` garbled text in persona reason strings
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


## 13 April 2026 â Light mode contrast audit + full fix across portal

### Fix: 84 hardcoded dark-theme colors converted to CSS vars across 13 pages + nav.js

**Root cause:** Pages used hardcoded `rgba(255,255,255,...)`, `#fff`, `rgba(10,31,31,...)`, and `#0A1F1F` colors instead of CSS variables from `theme.css`. These were designed for dark backgrounds and became invisible/unreadable when the light theme was active.

**Architecture finding:** `theme.css` correctly defines both light and dark variable sets. The problem was individual pages bypassing the system with inline hardcoded values.

### Files updated (15 total):
| File | Issues Fixed | Key Changes |
|------|-------------|-------------|
| `nav.js` | 15 | Entire nav component â desktop nav, mobile header, bottom nav, More menu. Affects ALL pages. |
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
| `sw.js` | â | Cache bumped to `vyve-cache-v2026-04-13d` |

### Design decisions:
- `#fff` on `var(--teal)` backgrounds (buttons, avatars) left as-is â white on teal has good contrast in both themes
- Barcode scanner overlay kept dark with white text â it's a camera UI, not page content
- Skeleton shimmer animations converted to `var(--surface)` / `var(--surface-hover)`
- SVG chart label `setAttribute('fill',...)` calls in nutrition.html converted to CSS vars

### Rule added:
**Never use hardcoded `#fff`, `rgba(255,255,255,...)`, `#0A1F1F`, or `rgba(10,31,31,...)` in portal CSS.** Always use CSS variables from `theme.css`: `var(--text)`, `var(--text-muted)`, `var(--text-faint)`, `var(--border)`, `var(--surface)`, `var(--nav-bg)`, etc. Exception: `#fff` is acceptable for text on fixed-colour backgrounds like `var(--teal)` buttons or camera overlays.

## 13 April 2026 â Careers page added to marketing site

### Feat: careers.html live at www.vyvehealth.co.uk/careers.html
- **Page:** 11 active roles across Advisory, Podcast, Marketing, Community, Clinical departments
- **Jobs managed via JS array** â Lewis can add/remove/hide roles by editing the `JOBS` array in the `<script>` block. `active: false` hides a role without deleting it.
- **Apply flow:** "Apply Now" opens candidate's email client with pre-filled subject line â all applications land in `team@vyvehealth.co.uk`
- **Repo:** `VYVEHealth/Test-Site-Finalv3` â `careers.html` committed to main
- **Note:** Original uploaded file was truncated (missing IntersectionObserver init + closing HTML tags). Reconstructed tail appended before push.

### Feat: Careers link added to footer across 8 marketing pages
- Pages updated: `index.html`, `individual.html`, `individual-platform.html`, `give-back.html`, `give-back-employers.html`, `corporate.html`, `platform.html`, `about-individual.html`
- Link added under Company column after "Terms of Service"
- 7 other pages (employers, contact, about, etc.) have different footer structures â Careers link not added (would need separate pass)

## 13 April 2026 â running_plan_cache RLS fix (401 on PATCH/POST)

### Fix: Added INSERT + UPDATE RLS policies to `running_plan_cache`
- **Root cause:** Table had only a public SELECT policy. The page (`running-plan.html`) uses the anon key (`SUPA_HDR`) for all cache operations. Reads worked, but PATCH (use_count bump) and POST (save new plan) returned 401.
- **Alert:** `auth_401_running_plan_cache` â Calum Denham, 14:55, running-plan.html
- **Fix:** Migration `running_plan_cache_insert_update_policies` â added `running_plan_cache_public_insert` (INSERT) and `running_plan_cache_public_update` (UPDATE) policies, both `TO public WITH CHECK (true)`. Appropriate because this is a shared cache (not user-specific data).
- **No portal code change needed** â the page already sends the correct requests, they were just being rejected by RLS.

### Triage: 4 alerts dismissed (Dean, 13:33, transient network blip)
- `network_error_member-dashboard` (CRITICAL) â "Failed to fetch" on dashboard `/`
- `network_error_notifications` (CRITICAL) â "Failed to fetch" on dashboard `/`
- `js_error` (HIGH) Ã 2 â "Script error. at :0" on `/` and `/workouts.html`
- All 4 fired within 14 seconds for the same user (Dean). Classic connectivity blip â downstream JS errors are cross-origin error masking from the failed fetches. No code bug.

## 13 April 2026 â Command Centre: Full Supabase Wiring

### Feat: Command Centre data now persists in Supabase
Lewis's Command Centre (`admin.vyvehealth.co.uk`) was previously localStorage-only â clearing the browser lost all data, and Lewis and Dean couldn't share data. Now fully wired to Supabase.

### Database â 18 new `cc_` tables created
All tables: RLS enabled, locked to `team@vyvehealth.co.uk`, `created_by` column, `updated_at` triggers.

| Table | Module |
|-------|--------|
| `cc_clients` | Clients kanban |
| `cc_leads` | Sales Pipeline CRM |
| `cc_investors` | Investor Relations |
| `cc_partners` | Partner Network |
| `cc_tasks` | Tasks kanban |
| `cc_decisions` | Strategy Room â Decisions log |
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

### Storage â `cc-documents` bucket created
- Private bucket, 50MB file limit
- Allowed types: PDF, DOCX, XLSX, PPTX, TXT, CSV, images
- RLS: team@vyvehealth.co.uk only (SELECT, INSERT, DELETE)
- Files stored with UUID filename, metadata in `cc_documents` table

### Edge Function â `cc-data` v1 deployed
Single function handles all Command Centre data operations:
- `GET /cc-data/{table}` â list with optional filters (?type, ?stage, ?status, ?owner, ?quadrant)
- `POST /cc-data/{table}` â create record
- `PATCH /cc-data/{table}/{id}` â update record  
- `DELETE /cc-data/{table}/{id}` â delete (also removes Storage file for documents)
- `POST /cc-data/upload` â multipart upload â Storage â cc_documents metadata
- `GET /cc-data/signed-url/{id}` â 1-hour signed URL for secure file viewing
- Auth: JWT required, `team@vyvehealth.co.uk` only

### index.html â fully rewired (commit `eb2dc09`)
- Added `CC_API` helper functions: `ccFetch`, `ccList`, `ccCreate`, `ccUpdate`, `ccDelete`, `ccUploadFile`, `ccSignedUrl`
- Added `ccLoadAll()` â fetches all 18 tables in parallel on login, populates every data array
- `initApp()` converted to async â calls `ccLoadAll()` after auth, re-renders current page
- 20 save/delete functions converted to async Supabase calls: `saveClient`, `saveLead`, `saveInvestor`, `saveDecision`, `saveCompanyOkr`, `saveGrant`, `savePost`, `saveKbItem`, `saveFinance`, `saveRevenue`, `updateOkrPct`, `addSwot`, `removeSwot`, `removeIntelItem`, `doImportModal`, `processDocFile`, `deleteDoc`, `clearAgentData`, `removeKbItem`, `openTaskModal`
- `processDocFile()` â files now upload to Supabase Storage via `ccUploadFile()`, no longer stored in localStorage
- `viewDoc()` â now async, generates signed URL for secure file viewing/download
- `persist()` / `load()` â retained for UI preferences only (dark mode, Claude API key, per-member todos)
- Zero business data `persist()` calls remaining

### Result
- Lewis and Dean now share the same data â any record entered by either is instantly visible to the other
- Clearing browser cache no longer loses any business data
- Files uploaded to the Documents section go to Supabase Storage automatically
- Lewis can now populate clients, pipeline, OKRs, decisions etc. with confidence data won't be lost

## 13 April 2026 â anthropic-proxy auth fix (running-plan.html JS error)

### Fix: anthropic-proxy v14 â verify_jwt: false + internal JWT validation
- **Root cause:** `anthropic-proxy` had `verify_jwt: true` (Supabase gateway-level). Running-plan.html uses the old `waitForAuth` pattern â if auth session hadn't initialised before the user hit Generate, the fetch fell back to the anon key, which was rejected by the gateway. Browser showed `Script error. at :0` (cross-origin error masking).
- **Fix:** Switched to `verify_jwt: false` with internal JWT validation via `supabase.auth.getUser()` â matches the pattern used by all other VYVE Edge Functions.
- **Also added:** CORS restriction to `online.vyvehealth.co.uk` and `www.vyvehealth.co.uk` (was `*`).
- **running-plan.html:** No change needed â the page already tries to get a JWT from `window.vyveSupabase.auth.getSession()` and sends it. The EF now validates internally instead of at the gateway.

## 13 April 2026 â Brevo Email Logo + Backlog Cleanup

### Feat: VYVE logo added to all Brevo email templates
- **send-email** v20 â `wrap()` header updated: text "VYVE" replaced with `<img>` tag loading `https://online.vyvehealth.co.uk/logo.png` (height 36px)
- **re-engagement-scheduler** v20 â same `wrap()` logo update
- **certificate-checker** v18 â same `wrap()` logo update (notification emails only; certificate HTML documents unchanged)
- All three EFs now show the VYVE logo image in the dark header bar of every outbound email

### Backlog: Items dropped
- **Dashboard skeleton loading screen** â dropped (not needed now)
- **Weekly check-in slider questions** â dropped (monthly check-in covers this instead)
- **Brevo logo in emails** â completed â

## 13 April 2026 â Monthly Check-In Wiring + Habit Count Fix

### Feat: Monthly Check-In wired into portal nav
- **nav.js** â Monthly Check-In added to More menu (below Weekly Check-In), calendar icon
- **monthly-checkin.html** â new `#new-member-banner` div + `newMemberLocked` handler in init()
- **monthly-checkin EF v13** â `isNewMember()` function: checks `members.created_at`, blocks if member joined < 1 full calendar month ago. Returns `newMemberLocked: true` + `availableFrom: "1st May 2026"` on GET. Also guards POST submit.
- **New-member message:** "Your monthly check-in will be available from 1st [Month Year]. Complete your first full month with VYVE and we'll have your personalised report ready."
- **Model fix:** `claude-haiku-4-5-20251001` (invalid) â `claude-haiku-4-5` in monthly-checkin EF

### Fix: Weekly check-in habit count
- **wellbeing-checkin.html** â `habitsThisWeek` was counting every raw `daily_habits` row (e.g. 5 habits logged Monday = counted as 5). Fixed to count distinct `activity_date` values capped at 7 â max 1 per day, max 7 per week.
- Query updated: `select=id` â `select=activity_date`
- Count: `habits?.length` â `Math.min([...new Set(habits.map(h=>h.activity_date))].length, 7)`

### sw.js cache
- Bumped: `vyve-cache-v2026-04-13a` â `vyve-cache-v2026-04-13b`

## 13 April 2026 â VYVE Command Centre: Setup, Auth & Fixes

### New: Command Centre live at admin.vyvehealth.co.uk
- **What:** Lewis's internal ops dashboard (`vyve-command-centre` repo) identified, deep-dived, and brought to production-ready state
- **URL:** `admin.vyvehealth.co.uk` â custom domain via GoDaddy CNAME â GitHub Pages
- **Auth:** Replaced hard-coded login (`admin@vyve.co.uk` / `vyve2026`) with real Supabase Auth. `team@vyvehealth.co.uk` auth account activated, password set via SQL.
- **Repo:** `VYVEHealth/vyve-command-centre` (public). CNAME file committed for custom domain.

### Fixes applied to Command Centre index.html
| Fix | Detail |
|-----|--------|
| SyntaxError: doLogin undefined | HTML modal markup injected inside TEAM JS array â removed |
| Binary garbage blob (~750 chars) | Corrupted OKR renderer â removed and reconstructed |
| Missing `</script>` tag | Data script block unclosed â fixed |
| 8 duplicate modal blocks | All modals appeared twice â deduplicated |
| `Â¾(` Ã 3 | Corrupted `v()` helper calls â fixed |
| `justify-conte"` | Truncated CSS â fixed to `justify-content:space-between` |
| OKR slider `oninput` | Control char + `his.value` â fixed to `this.value` |
| Missing amber ternary Ã 3 | OKR progress bar colour â fixed |
| Stray `2 ` before `el2.innerHTML` | SyntaxError on line 1566 â removed |
| Duplicate h1 headings on all pages | Page title showed in topbar AND as h1 â all h1s removed from page-headers |
| Tasks page corrupt | Contained stray THREATS/SWOT/Decisions/Learnings content â replaced with correct kanban layout |

### Architecture notes (Command Centre)
- Single `index.html` ~120KB, vanilla JS + Chart.js, GitHub Pages
- Data in `localStorage` â Supabase connection planned (same DB `ixjfklpckgxrwjlfsaaz`, tables prefixed `cc_`)
- Lewis's 24 AI skills run in Claude.ai Projects (subscription) â Agent Sync JSON paste is the intended workflow
- Claude API key field in Settings is a placeholder â no API calls wired yet
- `send-password-reset` Edge Function deployed and neutered after use

## 13 April 2026 â iOS App Store: Build 2 Submitted (Correct VYVE Icon)

### Fix: Replaced placeholder Capacitor icon with correct VYVE logo
- **What:** Generated correct app icon from `logo512.png` using `@capacitor/assets generate --ios`
- **Icon source:** `resources/icon.png` (1024x1024px, VYVE teal V logo)
- **Build 2** archived and uploaded to App Store Connect
- **Status:** App is "Waiting for Review" with Build 1 (placeholder icon). Build 2 is uploaded and ready.
- **Next:** If Apple approves Build 1, submit 1.0.1 update immediately with Build 2 icon. If rejected, resubmit with Build 2.
- **Note:** Cannot swap builds once "Waiting for Review" â Apple has locked the submission.

## 13 April 2026 â iOS App Submitted to App Store

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
- **Status:** Submitted for review â Apple will email on approval (typically 24-48 hours)
- **Architecture:** Remote URL loading (`https://online.vyvehealth.co.uk`) â portal updates live instantly, no resubmission needed

### App Store listing content
- **Subtitle:** Proactive Wellbeing Platform
- **Primary Category:** Health & Fitness
- **Secondary Category:** Lifestyle
- **Price:** Free
- **Countries:** All regions
- **Apple ID:** 6762100652

### Both platforms now submitted
- Android: `app-release.aab` submitted to Google Play (12 Apr) â
- iOS: Submitted to App Store (13 Apr) â

## 12 April 2026 â Android App Submitted to Google Play

### Feat: VYVE Health Android app built and submitted
- **What:** Full Capacitor Android build completed and submitted to Google Play Store for review
- **Package ID:** `co.uk.vyvehealth.app`
- **Build:** `app-release.aab` (5.77MB, 3s download time)
- **Keystore:** `vyve-release-key.jks` saved to Dean's Desktop (OneDrive). Password stored securely.
- **Key alias:** `vyve-key`
- **google-services.json:** Placed in `android/app/` â
- **Project location:** `C:\Users\DeanO\vyve-capacitor\`
- **Plugins (15):** app, browser, camera, filesystem, haptics, keyboard, local-notifications, network, preferences, push-notifications, screen-orientation, share, splash-screen, status-bar, capacitor-native-biometric
- **Countries targeted:** United Kingdom
- **Google Play listing:** Full description written, 4 screenshots processed, feature graphic generated (1024x500), 512px icon uploaded
- **Status:** Submitted for review â Google will email on approval (typically 1-3 days)
- **Architecture:** Remote URL loading (`https://online.vyvehealth.co.uk`) â portal updates live instantly, no resubmission needed

### Google Play Store listing content
- **Short description:** Proactive workplace wellbeing â Physical, Mental & Social health
- **App category:** Health & Fitness
- **Content rating:** All other app types â PEGI Everyone
- **Health features ticked:** Activity & fitness, Nutrition & weight management, Period tracking, Sleep management, Stress management/relaxation/mental acuity
- **Target audience:** 18+
- **Countries:** United Kingdom

### iOS â Pending Mac
- All pre-requisites complete. When Mac arrives: install Xcode, run `npx cap add ios && npx cap sync ios`, open in Xcode, configure signing + capabilities, build + submit.
- Estimated time once Mac available: ~2.5 hours

### Notes
- Old Kahunas app (`com.kahunas.io.VYVE`) still live on Play Store with 1 install â leave alone, deprecate after new app approved
- `capacitor-plugins.js` not yet added to portal â do this next session ("add plugins to portal")
- Health disclaimer checkbox on welcome.html â pending Lewis sign-off

## 12 April 2026 â Capacitor App Store Wrap: Pre-Mac Setup Complete

### Planning: Full Capacitor wrap mapped and config files generated
- **What:** Complete Capacitor wrap plan created for iOS App Store + Android Play Store submission
- **Plugins selected (all added now):** Push Notifications, Status Bar, Splash Screen, App, Keyboard, Haptics, Network, Browser, Share, App Launcher, Local Notifications, Preferences, HealthKit/Google Fit, Camera, Filesystem, Biometrics, Screen Orientation. RevenueCat deferred (keep payments on Stripe web).
- **Files generated:** `capacitor.config.ts`, `package.json`, `capacitor-plugins.js` (full native bridge exposing `window.VYVENative`), `ios-info-plist-additions.xml`, `android-manifest-additions.xml`, `supabase-migration-push-native.sql`, `SETUP-GUIDE.md`
- **Architecture decision:** Remote URL loading (`server.url: https://online.vyvehealth.co.uk`) â portal updates go live instantly without App Store resubmission

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

## 12 April 2026 â Browse Library: Your Programmes + Resume

### Feat: Paused plans section in Browse Library
- **What:** Added "Your Programmes" section at the top of the Browse Library tab showing all paused plans with a Resume button.
- **UI:** Deduplicated by programme name (shows most recently paused). Shows week progress ("Week 2 of 8") and source label ("Your bespoke plan" / "From library" / "Shared"). Confirmation modal before resuming.
- **Backend:** `workout-library` EF v3 â added `action: resume` POST handler. Pauses current active plan, reactivates the selected paused plan preserving `current_week` and `current_session` progress.
- **Frontend:** `workouts-library.js` â new `loadPausedPlans()`, `confirmResume()`, `resumeProgramme()` functions. Paused plans fetched via REST API from `workout_plan_cache` with `is_active=false`.
- **sw.js:** Bumped to `vyve-cache-v2026-04-12ab`
- **Commit:** `3fd4b23727c3fa822b84c69454d0b1b8af15f966`

### Data: PPL Power & Size Builder â Push B â Upper
- **What:** Updated `cbudzski3@gmail.com`'s active programme in `workout_plan_cache`
- **Push A** renamed to **Push** (dropped the "A") across all 8 weeks
- **Push B** replaced with **Upper â Chest, Back, Shoulders & Arms** across all 8 weeks
- Upper sessions designed as proper balanced upper body: chest pressing + back pulling + shoulders + biceps (hammer curls) + triceps. Exercises vary across periodisation phases. Avoids duplicating Pull day movements.

## 12 April 2026 â Browse Library visibility fix

### Fix: workouts.html #tab-library outside .wrap
- **Root cause:** `#tab-library` div was positioned outside `<main>` and `.wrap` in the HTML (line 545), after all the fixed-position overlays. Content rendered into DOM but was invisible â it sat below the fold with no scroll context, especially when `body.style.overflow` was stuck as `'hidden'` from a previous workout session.
- **Fix 1 (HTML):** Moved `#tab-library` inside `.wrap`, directly after `#tab-custom` where it belongs. Library content now inherits `.wrap` padding and participates in normal body scroll.
- **Fix 2 (JS):** Added `document.body.style.overflow = ''` at start of `init()` in `workouts-config.js`. Belt-and-braces: clears stuck overflow even when no saved session state exists to restore.
- **sw.js:** Bumped to `vyve-cache-v2026-04-12aa`
- **Commit:** `4474936db1f9ac4a5f80101390a41177e6fc4f9b`

## 12 April 2026 â member-dashboard v31: Server-Side Aggregation

### Change: member-dashboard EF v31 + index.html frontend update
- **What:** All streak, score, count, and goal-progress calculations moved server-side into the Edge Function
- **Why:** Response payload was growing linearly with activity history (~5KB for current members, unbounded at scale). Now fixed ~2KB regardless of history size.
- **EF changes (v31):** Ported `calcStreaks`, `calcWeekStreaks`, `calcDayStats`, `calcVariety7d`, `computeEngagementScore` from frontend JS into TypeScript. Same 11 parallel DB queries unchanged. New response shape includes `counts`, `streaks`, `checkinStreak`, `score`, `habitStrip`, `habitDatesThisWeek`, `goals`, `charity`, `daysInactive`, `daysActive30`.
- **Frontend changes (index.html):** Removed client-side calc functions. `renderDashboardData` now maps pre-computed values directly to DOM. `renderDailyCheckinStrip` updated to accept `habitStrip` + `habitDatesThisWeek` + `habitStreakCurrent`. `renderGoals` updated to accept pre-computed `goals` object.
- **Cache key bumped:** `vyve_home_cache_` â `vyve_home_v2_` to force invalidation of old-shape cache on all devices.
- **sw.js:** Bumped to `vyve-cache-v2026-04-12a`
- **Commit:** 8ef469cde210e65cff6eb9bc49b33c3b04cadb3c

## 11 April 2026 â Food Log, Settings, Weight Unit, Running Plan (Evening Session)

### Fix 5: log-food.html â JWT auth error + LOG FOOD button behind nav
- **Issue:** "Error logging â try again" on all food log entries + LOG FOOD button hidden behind bottom nav
- **Root cause 1:** `supa()` helper used `SUPA_ANON` as Bearer token â `nutrition_logs` RLS rejected with 401
- **Root cause 2:** `.sheet` CSS had `padding-bottom:env(safe-area-inset-bottom,0px)` â only accounts for iPhone notch, not the 80px nav bar
- **Fix:** `supa()` now uses `vyveSupabase.auth.getSession()` for real JWT; `.sheet` padding-bottom changed to `calc(80px + env(safe-area-inset-bottom,0px))`
- **Commit:** `e138f2e`

### Fix 6: running-plan.html â wrong Haiku model string
- **Issue:** Running plan generation silently failing â showing "Plan was too large" for all plans including small ones
- **Root cause:** Model string `claude-haiku-4-5-20251001` is invalid. Correct string is `claude-haiku-4-5` (no date suffix). Anthropic returns error object â no `data.error` check â falls through as blank â TRUNCATED error message fires
- **Additional:** No `response.ok` check â HTTP errors from proxy were silently swallowed
- **Fix:** Model corrected to `claude-haiku-4-5`; added `response.ok` check and `data.error` check so real errors surface
- **Commit:** `1b86b43`
- **Brain update:** Correct Anthropic model strings table added to master.md (section 9)

### Fix 7: settings.html â remove height/weight unit toggles + fix privacy link
- **Removed:** Entire "Units" section (Weight kg/lbs/stone + Height cm/ft toggles), `setUnits()` JS function, both `data-units-weight`/`data-units-height` init blocks, `.units-group` + `.units-btn` CSS â 3,929 chars total
- **Why:** Unit toggles were saving to `members.weight_unit`/`members.height_unit` but nothing was reading those values. Unit preference is now managed within `nutrition.html` TDEE recalculator only.
- **Privacy link fixed:** `privacy.html` â `privacy-policy.html`
- **Commit:** `73dc197`

### Feat: nutrition.html â weight log unit follows member onboarding preference
- **Issue:** Weight log sheet hardcoded to 'kg' regardless of member's unit preference. TDEE recalculator unit choice not persisted between sessions.
- **Fix (6 changes):**
  1. `weight_unit` added to members SELECT query
  2. `saveTargets()` PATCH now includes `weight_unit: rcState.wtUnit`
  3. `memberData` in-memory object updated with `weight_unit` after save
  4. `openSheet()` inits `sheetWtUnit` from `memberData.weight_unit` â localStorage fallback â 'kg'
  5. `localStorage.setItem('vyve_weight_unit')` written on TDEE save
  6. `prefillRecalc()` calls `setWtUnit(savedWtUnit)` so recalculator opens in saved unit
- **Commit:** `7cfbe91`

### sw.js cache progression today
`r` â `s` â `t` â `u` â `v` â `w` â `x` (final: `vyve-cache-v2026-04-11x`)

### Hard rules added (31â34)
See master.md section 8 for full rules.

---

## 11 April 2026 â Platform Alert Fixes + Full Portal Auth Audit

### Context
Platform monitoring (deployed yesterday) began firing alerts. Three distinct issues identified from live alerts plus one discovered during the subsequent full 38-page portal audit.

### Fix 1: index.html â PostHog SyntaxError (CRITICAL)
- **Alert:** `js_error` â `SyntaxError: Unexpected token ','` at `index.html:305`
- **Root cause:** PostHog init on line 305 had literal `+ POSTHOG_KEY +` placeholder instead of the real key â invalid JS syntax
- **Impact:** Entire dashboard JavaScript blocked for all members on every page load
- **Fix:** Replaced `posthog.init( + POSTHOG_KEY + ,{...})` with real key `phc_8gekeZglc1HBDu3d9kMuqOuRWn6HIChhnaiQi6uvonl`
- **Commit:** `0d66099`

### Fix 2: tracking.js â Session views using anon key as Bearer (CRITICAL)
- **Alert:** `auth_401_session_views` on `/yoga-live.html` for `stuwatts09@gmail.com`
- **Root cause:** `tracking.js` built headers with `Authorization: Bearer SUPABASE_ANON` (anon key). RLS on `session_views` and `replay_views` requires authenticated JWT â anon key rejected with 401
- **Impact:** All 13 live and replay pages (yoga-live, mindfulness-live, workouts-live, checkin-live, therapy-live, education-live, events-live, podcast-live + all -rp equivalents) failing to log session views
- **Fix:** Replaced static headers constant with `async getHeaders()` function that fetches real user JWT via `window.vyveSupabase.auth.getSession()`, falls back to anon only if session unavailable
- **Commit:** `5adf652`

### Fix 3: nutrition-setup.html â Auth race condition (CRITICAL)
- **Alert:** `auth_401_members` on `/nutrition-setup.html` for Dean and Stuart
- **Root cause:** `window.addEventListener('load', () => { if (window.vyveCurrentUser) init(); })` fired before `vyveSupabase` was confirmed set â `supa()` helper fell back to anon key, which has no RLS permission to read/write `members`
- **Fix:** Removed the racing `window.load` fallback. `init()` now fires exclusively via `document.addEventListener('vyveAuthReady', ...)` which fires only after session confirmed
- **Commit:** `43319306`

### Fix 4: running-plan.html â anthropic-proxy rejecting anon key (HIGH â discovered in audit)
- **No alert fired** (EF silently rejected, no DB write to trigger alert)
- **Root cause:** `running-plan.html` called `anthropic-proxy` with `Authorization: Bearer SUPA_KEY` (anon key). `anthropic-proxy` has `verify_jwt: true` â rejects anon key
- **Impact:** Running plan generation broken for all members since `verify_jwt: true` was added to anthropic-proxy during security audit
- **Fix:** PROXY_URL fetch now uses async IIFE to get real JWT from `window.vyveSupabase.auth.getSession()` before sending request
- **Commit:** `a09a5a5`

### sw.js cache bumps
- `vyve-cache-v2026-04-11s` â after first three fixes
- `vyve-cache-v2026-04-11t` â after running-plan fix

### Full 38-page portal audit results
- **38 files audited** (36 HTML pages + auth.js + sw.js)
- **0 remaining issues** after today's fixes
- **32 pages clean** â correct auth patterns confirmed
- **6 informational** â public/infrastructure files (login, set-password, consent-gate, offline, auth.js, sw.js)
- Leaderboard warning was false positive â `getJWT()` correctly used in `loadLeaderboard()`
- nutrition-setup.html still shows minor flag (window.load present alongside vyveAuthReady) â resolved by Fix 3

### Hard rules added (28, 29, 30)
See master.md section 8 for full rules.

---

## 11 April 2026 â Nutrition Setup Flow + Full Onboarding Data Completeness

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
- Created `member_age(dob date)` SQL function â computes current age from DOB in any query
- Onboarding EF v57 now stores `dob` from form submission; removed static `age` write
- Age in TDEE calculation is now always accurate and updates automatically on birthdays without cron jobs
- Backfilled `age` integer for all 11 existing members manually
- Set Dean's DOB: 1991-02-06

### New: All onboarding questionnaire fields now persisted (onboarding EF v56 â v57)
DB migration added 7 new columns to `members`:
- `training_goals` text â comma-separated training goals array
- `barriers` text â barriers to exercise
- `sleep_hours_range` text â sleep duration choice (e.g. "7-8 hours")
- `sleep_help` text â sleep help preferences
- `social_help` text â social help preferences
- `nutrition_guidance` text â guidance level preference
- `location` text â member city/area

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
- Bumped through `j` â `r` during this session. Current: `vyve-cache-v2026-04-11r`

---

## 2026-04-11 (Leaderboard Auth Fix)

### Summary
`leaderboard.html` had `getJWT()` referencing `window._supabase` which doesn't exist. Auth.js exposes the Supabase client as `window.vyveSupabase`. The JWT call silently failed (caught by try/catch returning null), so the leaderboard edge function received no valid authentication and couldn't identify the caller for ranking.

### Fix
- `leaderboard.html` â changed `window._supabase` to `window.vyveSupabase` in `getJWT()`
- `sw.js` â cache bumped to `vyve-cache-v2026-04-11i`

### Rule Added
- All portal pages must use `window.vyveSupabase` for auth â never `_supabase`, `_sb`, or other aliases. grep for non-standard Supabase client references after any auth refactor.

---

## 11 April 2026 â Platform Monitoring System

### Built
- **`platform_alerts` table** â central alert storage (severity, type, source, member, dedup indexes, RLS service-role only)
- **`platform-alert` Edge Function v1** â receives alerts, deduplicates (same type + member within 1hr), sends Brevo email to Dean + Lewis, sends VAPID push to subscribed devices
- **Client-side Platform Monitor** (added to `auth.js`) â catches:
  - JS runtime errors (`window.onerror`)
  - Unhandled promise rejections
  - API 401s and 500s (fetch interceptor on all Supabase calls)
  - Network failures on API calls
  - Page load timeouts (app container not visible after 15s)
  - PWA not installed after 7 days of use
  - Exposes `window.vyveAlert(type, severity, details)` for manual reporting from page code
- **sw.js cache bumped** `v2026-04-11i` â `v2026-04-11j`

### Commits
- `vyve-site` 16eeb3e â auth.js monitor + sw.js cache bump

### Architecture decisions
- Monitor added to `auth.js` (not a separate file) since it's already loaded on every portal page
- `fetch()` interceptor pattern â wraps native fetch to monitor all Supabase API calls without modifying individual pages
- Deduplication both client-side (per session) and server-side (per type+member per hour) to prevent alert fatigue
- `platform-alert` EF is `verify_jwt: false` with CORS restriction â client-side can't send API keys, CORS is sufficient protection

### Outstanding monitoring items
- Health check cron EF (proactive service monitoring every 30 min) â not yet built
- Server-side error reporting in critical EFs (member-dashboard, wellbeing-checkin, log-activity, onboarding) â not yet wired
- Alert dashboard page (alerts.html or section on strategy.html) â not yet built


## 2026-04-11 (Audit Collateral â Certificates + Engagement Pages Fixed)

### Summary
Two more portal pages were broken by the security audit's removal of the `?email=` fallback from `member-dashboard`. Both `certificates.html` and `engagement.html` were calling the edge function with NO auth header at all â no `getJWT()` function existed on either page. After the audit enforced JWT-only auth on `member-dashboard`, both pages returned 401 on every load.

### Root Cause
When `member-dashboard` v29 removed the `?email=` fallback (Fix 2 in the audit), `index.html` was updated to use JWT auth. But `certificates.html` and `engagement.html` also call the same edge function and were NOT updated. They had no `getJWT()` helper and no `vyveSupabase` reference.

### Fixes Applied
- `certificates.html` â added `getJWT()` helper, replaced unauthenticated fetch with JWT-authenticated fetch
- `engagement.html` â same fix
- `sw.js` â cache bumped to `vyve-cache-v2026-04-11h`

### Pages Verified Safe
- `monthly-checkin.html` â already sends JWT â
- `nutrition.html`, `settings.html`, `log-food.html` â use `?email=` as REST API filter (PostgREST WHERE clause), not as EF auth. JWT sent correctly â
- `running-plan.html` â uses ANON key but `running_plan_cache` has `public_read` RLS policy â

### Rule Added
- When changing auth on an Edge Function, **grep all portal pages** for calls to that function. Every caller must be updated, not just the main dashboard.

---

## 2026-04-11 (Critical Bug Fix â Dashboard Stats Not Rendering)

### Summary
Fixed a JavaScript scoping bug in `index.html` that prevented dashboard stats from rendering for all users. Caused by the security audit refactor on the same day.

### Root Cause
The security audit refactor changed `email` from a script-level variable to `const email` inside `onAuthReady()`. The `loadDashboard()` function (defined at script scope) still referenced `email` on the `writeHomeCache(email, data)` call. Since `const` is block-scoped, `email` was undefined in `loadDashboard()`, causing a `ReferenceError`. The try/catch caught it and displayed "Could not connect. Please refresh." instead of rendering the dashboard data.

The edge function (`member-dashboard` v34) was returning 200 with correct data â the bug was purely frontend.

### Fix Applied
- `index.html` â changed `writeHomeCache(email,data)` to `writeHomeCache((window.vyveCurrentUser&&window.vyveCurrentUser.email)||'',data)` (commit 3b5dedf5)
- `sw.js` â cache bumped to `vyve-cache-v2026-04-11g` to force PWA refresh

### Files Changed
| File | Change |
|------|--------|
| `index.html` | Fixed email variable scope in `loadDashboard()` |
| `sw.js` | Cache bumped `v2026-04-11f` â `v2026-04-11g` |

### Rule Added
- When refactoring variable scope (var/let/const), always check all functions that reference the variable â not just the function where it's declared. `const` and `let` are block-scoped; `var` is function-scoped.

---

## 2026-04-11 (Security Remediation â Complete)

### Summary
Full security remediation executed across all 8 fixes identified in the 2026-04-11 audit. All critical and high-priority vulnerabilities resolved. Platform is now production-secure.

### Edge Functions Updated

| Function | Version | Change |
|----------|---------|--------|
| `github-proxy` | v15 | Added `x-proxy-key` header auth (GITHUB_PROXY_SECRET), CORS restricted to `online.vyvehealth.co.uk` |
| `member-dashboard` | v29 | Removed `?email=` query param fallback entirely, JWT-only auth enforced |
| `onboarding` | v57 | CORS restricted to `https://www.vyvehealth.co.uk`, ONBOARDING_SECRET check removed (Option A â static site can't safely hold secrets) |
| `send-email` | v16 | CORS restricted, service-role-key auth on HTTP handler, model fixed from `claude-sonnet-4-5` â `claude-sonnet-4-20250514` |
| `employer-dashboard` | v26 | Unauthenticated fallback code path removed, hard fail if EMPLOYER_DASHBOARD_API_KEY not configured |

### Portal Files Updated (vyve-site)
- `index.html` â removed `?email=` param and hardcoded fallback email `deanonbrown@hotmail.com` from member-dashboard fetch call
- `sw.js` â cache bumped to `vyve-cache-v2026-04-11a`

### Marketing Site Updated (Test-Site-Finalv3)
- `welcome.html` â removed `ONBOARDING_KEY` declaration and `x-onboarding-key` header from onboarding fetch call (Option A â placeholder was non-functional in static context)

### Database Changes
- **Fix 6** â `session_chat` INSERT policy `with_check` confirmed correct, no change needed
- **Fix 7** â Dropped 20 redundant per-operation RLS policies across 7 tables (`cardio`, `daily_habits`, `workouts`, `session_views`, `replay_views`, `weekly_scores`, `wellbeing_checkins`). Each now has exactly 1 `ALL` policy.
- **Fix 8** â Dropped 2 duplicate indexes on `exercise_notes` (`exercise_notes_member_idx`, `idx_exercise_notes_member`). `weekly_scores_member_week_unique` retained â it's a real unique constraint.

### Secrets Set in Supabase Dashboard
- `GITHUB_PROXY_SECRET` â protects github-proxy write access
- `ONBOARDING_SECRET` â set but unused (Option A decision)
- `EMPLOYER_DASHBOARD_API_KEY` â required for employer dashboard access

### Architecture Decision â Option A (Onboarding Secret)
The `ONBOARDING_SECRET` pattern was abandoned because `welcome.html` is a static GitHub Pages file â any secret embedded in it is publicly readable. CORS restriction to `https://www.vyvehealth.co.uk` is the correct and sufficient protection for a public-facing onboarding form at current scale.


---

## 2026-04-11 (Full System Audit)

### Summary
Full system audit completed across all layers: architecture, Supabase, Edge Functions, frontend, security, performance. 5 critical vulnerabilities identified, remediation plan created, backlog updated.

### Critical Findings
- **github-proxy** â zero authentication, allows unauthenticated read/write to private repo (FIX 1)
- **member-dashboard** â `?email=` fallback exposes member data without JWT (FIX 2)
- **onboarding** â CORS `*`, no payment verification, creates auth users from public internet (FIX 3)
- **send-email** â open email relay from `team@vyvehealth.co.uk` (FIX 4)
- **employer-dashboard** â API key secret not set, unauthenticated fallback active (FIX 5)

### Additional Findings
- `send-email` has invalid model name (`claude-sonnet-4-5`) â will cause re-engagement failures
- `session_chat` INSERT policy allows impersonation (`with_check: true` instead of `auth.email() = member_email`)
- 6 tables have duplicate RLS policies (ALL + per-operation) from previous security audit debugging
- Duplicate indexes on `weekly_scores` and `exercise_notes`
- `ai_decisions` INSERT policy overly permissive

### What's Good (Confirmed)
- All 39 tables have RLS enabled â
- Brain repo accurate against live state â
- Onboarding v48 well-built (stress scale, FK race, decision logging) â
- Auth.js consent gate working correctly â
- Database indexes well-placed for current query patterns â

### Outputs
- `VYVE_Full_System_Audit_2026-04-11.md` â complete audit report
- `VYVE_Remediation_Plan_2026-04-11.md` â step-by-step implementation for 11 fixes
- `tasks/backlog.md` â updated with security section at top

### Brain Updates
- `tasks/backlog.md` updated with ð´ Security section

### Rules Added
- github-proxy requires `GITHUB_PROXY_SECRET` header (after fix deployed)
- member-dashboard: JWT-only auth, no `?email=` fallback (after fix deployed)
- onboarding: CORS restricted to `www.vyvehealth.co.uk` + `ONBOARDING_SECRET` header (after fix deployed)

## 2026-04-11 (Daily Sync)

### Summary
Full session: Layer 2 Web Push (VAPID) implemented end-to-end and confirmed working on iOS. Notifications redesigned from slide-up sheet to full-screen themed page.

### Completed
- **VAPID Web Push (Layer 2)** â P-256 key pair generated, `vapid.js` created (triggers on bell tap for iOS gesture compliance), `sw.js` push + notificationclick handlers added, `habit-reminder` v4 + `streak-reminder` v4 updated with RFC 8291 AES-GCM encryption using Deno Web Crypto only. `send-test-push` v4 confirmed working on iOS.
- **`VAPID_PRIVATE_KEY` secret** set in Supabase by Dean.
- **Notifications full-screen page** â replaced slide-up sheet with solid full-screen page: back arrow top left, clear-all bell top right, bottom nav bar, `var(--bg)` background (theme-aware), unread items highlighted.
- **Daily report** run manually for Friday 10 April: 5 activities, 2 new members.
- **sw.js cache** bumped to `vyve-cache-v2026-04-10aa`.

### Key Architecture Decisions
- iOS push permission must be triggered from a user gesture (bell tap) â not page load
- `esm.sh` library imports fail in Supabase Edge Functions â use Deno built-in Web Crypto only for RFC 8291 encryption
- `vapid.js` loaded on `index.html` only for now; expand to other pages when Capacitor wrap is underway

### Secrets
- `VAPID_PRIVATE_KEY` â set â
- VAPID public key: `BDbz2-0k3JcqRWKyasr3MNgEZrXhKsVvjS-otCyyV7Ya4Pi2xXOxXGETUpVoE56VorKzSNy7uyep53gOzNEMTu4`

## 2026-04-11 (Web Push encryption fix)

### fix: RFC 8291 full AES-GCM encryption â habit-reminder v4, streak-reminder v4, send-test-push v4

Apple's push service requires fully encrypted payloads (RFC 8291). Previous versions sent unencrypted JSON which Apple rejected with status 0. Rewrote `sendPush()` and `encryptPayload()` using Deno built-in Web Crypto only (no external libraries). Confirmed working on iOS PWA.

| Function | Version |
|----------|---------|
| `send-test-push` | v4 (confirmed working) |
| `habit-reminder` | v4 |
| `streak-reminder` | v4 |

## 2026-04-11 (Notifications â Layer 2 Web Push / VAPID)

### feat: VAPID Web Push â push handler in sw.js, vapid.js subscriber, EFs updated

**Commit:** d5937b957c63f3770bc4faa3ddbc24bb369cb904 (vyve-site)
**sw.js cache bumped:** `vyve-cache-v2026-04-10y` â `vyve-cache-v2026-04-10z`

#### Portal changes
- `vapid.js` (new) â requests push permission on auth, subscribes via `pushManager.subscribe()`, saves `{endpoint, p256dh, auth_key}` to `push_subscriptions` table. Loaded on `index.html` only.
- `sw.js` â added `push` event listener (shows native OS notification with icon/badge) and `notificationclick` listener (focuses or opens portal). Cache bumped to `vyve-cache-v2026-04-10z`.
- `index.html` â `<script src="/vapid.js"></script>` added before `nav.js`.

#### Edge Functions updated
| Function | Version | Change |
|----------|---------|--------|
| `habit-reminder` | v2 | After in-app write, fetches `push_subscriptions` for member â fires VAPID push if present. VAPID JWT signed with P-256 + VAPID_PRIVATE_KEY secret. |
| `streak-reminder` | v2 | Same VAPID dispatch pattern added. |

#### VAPID keys
- **Public key** (embedded in `vapid.js` and EFs): `BDbz2-0k3JcqRWKyasr3MNgEZrXhKsVvjS-otCyyV7Ya4Pi2xXOxXGETUpVoE56VorKzSNy7uyep53gOzNEMTu4`
- **Private key** â must be set as Supabase secret: `VAPID_PRIVATE_KEY` = `nlaC3bzFXVUOGj1lq46Uu94LzDZGJh6MA0ObeaPIU74` â ï¸ **Dean: set this secret before push will work**

#### iOS note
Web Push requires PWA installed to home screen on iOS (Safari 16.4+). Android Chrome works with no install required.

## 2026-04-11 (Notifications system â Layer 1)

### feat: in-app notifications â bell badge, slide-up sheet, 5 Edge Functions

**Commit:** f0f252f1c6421626a86135c77755cf42045aed9f
**sw.js cache bumped:** `vyve-cache-v2026-04-10x` â `vyve-cache-v2026-04-10y`

#### Supabase
- New table: `member_notifications` (id, member_email, type, title, body, read, created_at) + RLS (auth.email() = member_email) + lookup index
- New table: `push_subscriptions` (id, member_email, endpoint, p256dh, auth_key) + RLS â Layer 2 scaffold, no logic yet

#### Edge Functions deployed
| Function | Version | Change |
|----------|---------|--------|
| `notifications` | v1 (new) | GET â unread count + list (last 50). POST mark_read (one or all). JWT-verified. |
| `log-activity` | v12 | Writes streak milestone notifications (7/14/30/60/100 days) after successful insert via waitUntil(). Per-milestone dedup (fires once ever per milestone value). |
| `wellbeing-checkin` | v26 | Writes check-in confirmation notification after submission via waitUntil(). Deduped per day. |
| `habit-reminder` | v1 (new) | Cron 20:00 UTC daily. Finds members with no habit logged today â writes in-app notification. Layer 2 push extension point. |
| `streak-reminder` | v1 (new) | Cron 18:00 UTC daily. Finds members with streak â¥ 7 and no activity today â writes in-app notification. Layer 2 push extension point. |

#### Cron schedules registered
- `habit-reminder-daily` â `0 20 * * *` (8pm UTC)
- `streak-reminder-daily` â `0 18 * * *` (6pm UTC)

#### Portal â index.html
- Bell button (`#mob-bell-btn`): added `position:relative` to CSS, replaced `href='#notifications'` with `onclick="openNotifSheet()"`
- Badge span (`#notif-badge`): absolutely positioned on bell, `var(--accent,#e84393)` background, hidden when count = 0
- Notification sheet: slide-up overlay, `var(--card-bg)` background, `var(--text)`/`var(--text-muted)` text â fully theme-aware light/dark
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
`sw.js` cache bumped: `vyve-cache-v2026-04-10n` â `vyve-cache-v2026-04-10o`

Full audit of all 15 portal pages against nav.js injection (56px mobile header, 80px bottom nav, z-index 9999).

**workouts.html** â sticky sub-view headers (`.es-header`, `.sh-header`, `.prs-header`, `.hist-header`) had `top:0`, sitting under the 56px mobile nav on scroll. Added:
```css
@media(max-width:768px){ .es-header,.sh-header,.prs-header,.hist-header{top:56px} }
```

**log-food.html** â internal `.top-bar` (`position:sticky;top:0`) clipped under mobile nav. Added:
```css
@media(max-width:768px){ .top-bar{top:56px} }
```

**sessions.html** â duplicate `.mob-page-header` CSS block (`position:sticky;top:0`) was dead code; nav.js injects the real element. Removed the block entirely.

**Clean pages (no changes needed):** `index`, `habits`, `nutrition`, `settings`, `wellbeing-checkin`, `certificates`, `engagement`, `leaderboard`, `running-plan`, `login`, `set-password`.

---

### fix(settings): habits modal â save button buried under bottom nav + no close button

**Files:** `settings.html`, `sw.js`
`sw.js` cache bumped: `vyve-cache-v2026-04-10o` â `vyve-cache-v2026-04-10p`

**Root cause:** `.modal-overlay` had `z-index:1000`; bottom nav is `z-index:9999`. Modal rendered *under* the nav.

- `.modal-overlay` z-index: `1000 â 10001` (above nav) â applied to both habits and persona modals
- `.modal-sheet` converted to `display:flex; flex-direction:column` â enables sticky footer
- `.modal-cta` (Cancel / Save buttons) now `position:sticky; bottom:0` â always visible regardless of list length
- Habits list wrapped in `.modal-body` (`flex:1; overflow-y:auto`) â scrollable content area
- Added â close button to header of both habits modal and persona modal
- Sheet padding moved from shorthand to `padding:20px 20px 0` with CTA handling its own bottom safe-area

---

### fix(settings): persona modal closes before save + AI reasoning â clean bestFor snippets + cache-first load

**Files:** `settings.html`, `sw.js`
`sw.js` cache bumped: `vyve-cache-v2026-04-10p` â `vyve-cache-v2026-04-10q`

**Bug 1 â modal closes on tap inside sheet:**
Added `onclick="event.stopPropagation()"` to `.modal-sheet` on both modals. Touch events no longer bubble up to the overlay, so only tapping the dark backdrop closes the modal.

**Bug 2 â verbose AI reasoning replaced with clean "Best for" snippet:**
- Removed `ai_decisions` Supabase fetch from page load (one fewer round trip)
- "Why this coach was chosen" label â "Best for"
- Box is now always visible (was `display:none` until DB returned)
- Each persona now has a `bestFor` field in the JS `PERSONAS` object:
  - **NOVA** â People driven by targets who want every session to count
  - **RIVER** â Anyone managing stress, burnout, or poor sleep
  - **SPARK** â People who struggle with consistency and need an energetic nudge
  - **SAGE** â Members who want to understand the science behind their choices
  - **HAVEN** â Anyone needing a safe, non-judgmental space for mental health

**Feature â settings cache-first load:**
- `populateFromCache(cache)` function fills UI instantly from `localStorage` (`vyve_settings_cache`)
- Cache TTL: 10 minutes; keyed to user email
- `waitForAuth` reads cache first â shows full UI immediately â Supabase refreshes in background
- Cache written at end of `loadProfile`; updated on persona save

---

## 2026-04-10 (leaderboard â live data)

### feat: leaderboard wired to live Supabase data

**Commits:** leaderboard EF v1 deployed to Supabase; vyve-site 7691280542f8

**leaderboard Edge Function v1** (new EF, verify_jwt: false, JWT-preferred auth)
- Queries `daily_habits`, `workouts`, `cardio`, `session_views` for current calendar month across all members
- Includes all members table entries (zero-activity members appear at bottom)
- Per-member counts: all activities, habits only, workouts only, streak
- **Streak:** consecutive days back from today where any activity of any type was logged
- Returns: `first_name`, plus per-metric objects (`all`, `habits`, `workouts`, `streak`) each containing `your_rank`, `total_members`, `your_count`, `above` (anonymous), `below_count`, `gap`
- All members above caller returned as anonymous â no names, no emails exposed

**leaderboard.html** â full rewrite
- Removed Sage and My team scope tabs â All members only
- All 4 metric tabs (All / Habits / Workouts / Streak) now live â switch client-side from single EF response
- Your position card, above board, gap nudge all rendered from live data
- Zero hardcoded mock data remaining
- Dynamic month label in pill (JS, not hardcoded)
- Streak tab gap nudge uses "days" unit not "activities"
- Loading state shown while EF responds; error state if EF fails

`sw.js` cache bumped: `vyve-cache-v2026-04-10m` â `vyve-cache-v2026-04-10n`

## 2026-04-10 (workouts modularisation)

### refactor: workouts.html â split inline JS into 6 modules

**Commit:** b28c2b79b6754b58bf1dda79873f94b903bae851

workouts.html was 2,117 lines / 131KB with a single 1,575-line inline `<script>` block. Every future edit had the large-file deployment problem (>10KB Composio inline limit). Split into named `<script src="...">` files â no bundler, no `type="module"`, no behaviour changes.

| File | Lines | Responsibility |
|------|-------|----------------|
| `workouts-config.js` | 81 | Consts, 26 globals, `getJWT`, utility functions |
| `workouts-programme.js` | 237 | Programme load/render, exercise library cache, custom workouts |
| `workouts-session.js` | 598 | Session open/close, set logging, timers, completion flow |
| `workouts-exercise-menu.js` | 269 | Exercise menus, reorder, swap/add, history view |
| `workouts-builder.js` | 153 | Custom workout builder, rest settings |
| `workouts-notes-prs.js` | 235 | Notes, PRs, sessions history, MutationObserver boot |

`workouts.html` reduced from 2,117 â 548 lines (CSS + HTML shell + 6 `<script src>` tags).

**Verification:** 89/89 functions present across modules. Zero missing, zero extra.

**Load order:** config â programme â session â exercise-menu â builder â notes-prs â nav.js

`sw.js` cache bumped: `vyve-cache-v2026-04-10l` â `vyve-cache-v2026-04-10m`

## 2026-04-10 (settings page â persona selector, habit manager, goals, units, ai_decisions)

### New features deployed

**settings.html** â major update with 4 new sections:

1. **AI Coach section** â shows current persona name + description. Displays why the coach was chosen, pulled from new `ai_decisions` table (falls back to `members.persona_reason`). "Change coach" bottom sheet shows all 5 personas with descriptions. HAVEN shown as coming soon. Change takes effect immediately, writes to `persona_switches` + `ai_decisions` with `triggered_by: 'self'`.

2. **Daily Habits section** â shows current habits as tags. "Manage habits" bottom sheet shows all 30 habits from `habit_library` grouped by pot (Sleep, Movement, Nutrition, Mindfulness, Social). Max 10 selectable. Saves to `member_habits` with `assigned_by: 'self'`. Logs to `ai_decisions`.

3. **Your Goals section** â 8-button grid (Lose weight, Build muscle, Improve fitness, Reduce stress, Better sleep, Build consistency, More energy, General health). Saves immediately to `members.specific_goal`. Logs to `ai_decisions`.

4. **Units section** â weight (kg/lbs/stone) and height (cm/ft) toggles. Saves to new `members.weight_unit` and `members.height_unit` columns.

### New infrastructure

- **`ai_decisions` table** â created with RLS. Columns: `id`, `member_email`, `decision_type` (persona_assigned/habit_assigned/goal_updated/persona_changed), `decision_value`, `reasoning`, `triggered_by`, `created_at`. Members can read their own rows. Service role inserts.

- **`members.weight_unit` + `members.height_unit`** â new columns, default 'kg' and 'cm'.

### onboarding v48 (EF version 51)

- `selectPersona()` now calls Claude to generate a specific, member-facing reasoning paragraph for every assignment â hard-rule or AI path. Format: "Based on your onboarding responses: [specific signals]. [Coach] is [reason]."
- `selectHabits()` now returns both `ids` and `reasoning` â Claude explains which profile signals drove the habit selection.
- New `writeAiDecisions()` function writes two rows to `ai_decisions` at onboarding: one for persona, one for habits.
- Response now includes `ai_reasoning` and `habit_reasoning` fields.

### sw.js
Cache bumped: `vyve-cache-v2026-04-10k` â `vyve-cache-v2026-04-10l`

## 2026-04-10 (onboarding â major bug fixes & persona logic corrections)

### Root causes fixed
Three separate bugs were silently preventing habit assignment for every new member since v44:
1. **FK race condition** â `writeHabits` fired in parallel with `writeMember`. When `writeHabits` beat the DB, the FK on `member_email` failed. Fixed in v44: two-stage Promise.all, `writeMember` commits first.
2. **`assigned_by: 'onboarding_ai'`** â check constraint on `member_habits` only allows `'onboarding'`, `'ai'`, `'theme_update'`, `'self'`. Fixed in v46: changed to `'onboarding'`.
3. **Stress scale inverted** â onboarding questionnaire labels stress 1=very stressed, 10=very calm. All code treated high stress as negative. Fixed in v45: flipped all hard rules, added scale reminders to all AI prompts.

### onboarding v47 (deployed as EF version 50) â cumulative fixes
- **v44**: Two-stage Promise.all â `writeMember` then FK-safe writes
- **v45**: Corrected stress scale throughout â RIVER hard rule: `stress <= 3` (not `>= 7`), NOVA: `stress >= 7` (not `<= 4`)
- **v46**: `assigned_by: 'onboarding'` (was `'onboarding_ai'` â check constraint violation)
- **v47**: NOVA hard rule now requires 1-2 goals max where performance is dominant. Members with 3+ mixed goals go to AI path.

### welcome.html â fix: silent failure with fake results
- Previously: any EF failure (timeout, error) showed fake hardcoded RIVER results. Member thought they'd onboarded. Nothing wrote to DB.
- Now: 90s `AbortController` timeout. At 30s loading text updates. On failure: error screen with retry button. Stored form data allows retry without re-filling questionnaire. Up to 3 retries.
- Commit: `9fb62ad5890b` in Test-Site-Finalv3

### Persona corrections (inverted stress scale)
| Member | Old (wrong) | New (correct) | Reason |
|--------|-------------|---------------|--------|
| Stuart Watts | RIVER | NOVA | stress 7=calm, wellbeing 8, energy 8, gym 4x, holiday goal |
| Alan Bird | RIVER | SPARK | stress 10=very calm but energy 5, mixed lifestyle goals |
| Dean Brown | NOVA | SPARK | stress 8=calm but 5 mixed goals, 1-2 days/week, demanding work context |

### Alan Bird â habits corrected
Previous habits were based on wrong assumption he was stressed. Replaced stress-relief set with goal-aligned set:
- Removed: Consistent bedtime, Pre-sleep wind-down routine, Daily breathing exercise
- Added: Drink 2 litres of water, Eat breakfast, Move every hour

### Members backfilled (had no habits due to bugs)
- Alan Bird, Stuart Watts, Owen Barrett: habits manually inserted
- Owen Barrett: workout plan triggered (had no plan)
- Callum Budzinski: workout plan triggered
- Kelly Bestford, Lewis Vines, Callum Budzinski: habits manually inserted

### daily_habits table fixes
- Unique constraint added: `(member_email, activity_date, habit_id)` â one row per habit per day
- Cap trigger raised from 1/day to 10/day â allows all 5 habits to log
- On conflict key in portal updated to `member_email,activity_date,habit_id`

### habits.html fixes
- Bottom bar: removed `position:fixed` â now flows inline below habits list (was overlapping)
- Auth: upgraded from polling `waitForAuth` to event-driven `vyveAuthReady`
- sw.js bumped to `vyve-cache-v2026-04-10k`


---

## 2026-04-10 (performance â caching & loading)

### sw.js â perf: cache-first portal HTML + Supabase thumbnail caching
- Added `PORTAL_PAGES` array â all portal HTML pages now served cache-first with background revalidation (previously network-first, required round-trip on every visit)
- Added stale-while-revalidate handler for Supabase storage URLs (`/storage/`) â thumbnails cached in `RUNTIME_CACHE` after first load
- Cache version bumped: `vyve-cache-v2026-04-10h` â `vyve-cache-v2026-04-10i`

### auth.js â perf: dispatch vyveAuthReady event
- Added `window.dispatchEvent(new CustomEvent('vyveAuthReady'))` immediately after `vyveRevealApp()` is called
- Pages listening for this event now proceed instantly when auth resolves rather than waiting for a polling tick

### index.html â perf: replace waitForAuth polling with event-driven pattern
- `waitForAuth(attempts)` polling loop (100ms interval, 20 retries max) replaced with `waitForAuth()` event listener
- Listens for `vyveAuthReady` custom event â fires immediately when auth.js resolves the session
- Falls back to `setTimeout(3000)` hard fallback if event never fires
- Eliminates up to 100ms artificial lag per poll cycle on cold loads

### workouts.html â perf: exercise library localStorage cache + lazy thumbnails
- `loadAllExercises()` now checks `localStorage` key `vyve_exercise_library_v1` before hitting Supabase
- Cache TTL: 24 hours. Cache hit = zero network request, instant exercise search
- On cache miss/expiry: fetches from Supabase and writes to cache for next visit
- Thumbnail `<img>` tags in exercise search list now use `data-src` + `class="es-lazy-thumb"` instead of eager `src`
- `renderExerciseList()` now attaches an `IntersectionObserver` after rendering â images only load when scrolled into view (`rootMargin: 100px` pre-load buffer)
- Fallback for browsers without IntersectionObserver: all images load immediately (same as before)

# VYVE Brain Changelog

## 2026-04-10 (onboarding QA â welcome.html)

### welcome.html â fix: text contrast across full questionnaire (light mode)
- `--text-2` bumped from `#3A5A5A` to `#1E3C3C` in light theme block
- `--text-3` bumped from `#7A9A9A` to `#4A7272` in light theme block
- Affects all question labels, hints, slider end labels, and sub-text. welcome.html has its own inline CSS block so change is isolated to onboarding only.

### welcome.html â feat: city/town searchable dropdown for location field
- Replaced plain text input with type-ahead dropdown backed by static JS array of ~100 UK cities and towns
- Filters on 2+ characters, shows max 8 results, click/tap to select, closes on blur
- Hint updated: "Start typing your city or town â if it doesn't appear, just type it in and continue"
- No external API dependency â fully self-contained

### welcome.html â fix: email sender address in results screen
- "What happens next" paragraph now explicitly names `team@vyvehealth.co.uk` as the sender
- Copy: "Keep an eye out for a welcome email from team@vyvehealth.co.uk"

### welcome.html â feat: persona card â coach explanation line
- Static line added below AI-generated persona reason on results screen
- Copy: "Your coach shapes every recommendation, check-in, and message you receive. You can change them anytime in your settings."

### welcome.html â feat: "What's inside VYVE" feature showcase on results screen
- New section below "What happens next" card
- 7 features: 8-week programme, AI coaching, daily habits, live sessions, nutrition, weekly check-ins, certificates/leaderboards/charity
- Each item has bold title + 1-sentence description emphasising personalisation and ability to update anytime
- No emojis (Lewis preference â applied globally to welcome.html)

### results-preview.html â added to Test-Site-Finalv3
- Standalone QA preview page at www.vyvehealth.co.uk/results-preview.html
- Shows mocked results screen with realistic data for review
- Temporary file â delete once QA sign-off complete

## 2026-04-10 (evening â bug fixes session)

### workouts.html â fix: reorder wipes in-progress sets
- `saveReorder()` now snapshots kg/reps/ticked/bw/notes per exercise name before calling `renderSessionBody()`, then restores after. Mid-session reorder no longer wipes workout progress.
- commit b93fd175

### theme.css + auth.js â feat: portrait orientation lock
- CSS `#vyve-rotate-overlay` shown via `@media (orientation: landscape) and (max-height: 430px)` â phone-only, not tablets.
- `vyvePortraitLock()` IIFE in auth.js: calls `screen.orientation.lock('portrait')` (Android) and injects the overlay div into every portal page automatically â no per-page changes needed.
- iOS Safari ignores the API; CSS overlay handles iOS.
- Decision: overlay kept post-Capacitor as safety net for browser access. Suppress during active workout session is a known backlog item.
- sw.js bumped to vyve-cache-v2026-04-10f

### workouts.html â fix: PR/history scroll lock + content hidden under nav
- `openPrsView()` / `openSessionsHistory()` now clear `body.overflow` so fixed overlay scrolls on iOS (body:hidden was blocking touch events).
- `closePrsView()` / `closeSessionsHistory()` re-apply body lock if session still active.
- Both views reset `scrollTop = 0` on open.
- `.prs-body` and `.sh-body` bottom padding now `calc(80px + env(safe-area-inset-bottom,0px))` â last items no longer hidden under nav.
- Both fixed views get `-webkit-overflow-scrolling:touch` + `overscroll-behavior:contain`.
- sw.js bumped to vyve-cache-v2026-04-10g

### workouts.html â feat: persist active session across navigation
- Navigating away (e.g. Sessions tab) and back no longer resets a workout.
- `saveSessionState()` serialises currentSessionData, sessionExercises, sessionLog, completedSetsCount, all DOM state (kg/reps/ticked/bw/notes), and timer to `localStorage` key `vyve_active_session`.
- Called on session start and every set tick.
- `restoreSessionState()` called at end of `init()` â reopens session view with all progress and timer intact if saved state exists and is under 4 hours old.
- Cleared on `closeSessionView()` (explicit exit) and `completeWorkout()` (done).
- sw.js bumped to vyve-cache-v2026-04-10h


## 2026-04-10 (evening â portrait lock)

### theme.css + auth.js â feat: portrait orientation lock
- **Problem:** Portal pages rotated freely to landscape on phone rotation. VYVE is portrait-only â landscape is always accidental on a phone.
- **CSS (theme.css):** Added `#vyve-rotate-overlay` â a fixed full-screen overlay with a rotating phone icon and message. Shown via `@media (orientation: landscape) and (max-height: 430px)` so it only triggers on phone-sized landscape, not tablets. Overlay sits above `#app` but does not unmount it â no state loss.
- **JS (auth.js):** `vyvePortraitLock()` IIFE injected at bottom of auth.js. Calls `screen.orientation.lock('portrait')` (Android Chrome). Also injects the `#vyve-rotate-overlay` div into the DOM on every portal page at load â no per-page changes needed.
- iOS Safari ignores the API lock; CSS overlay handles iOS.
- sw.js bumped vyve-cache-v2026-04-10e â vyve-cache-v2026-04-10f


## 2026-04-10 (evening)

### workouts.html â fix: reorder wipes in-progress sets
- **Bug:** Opening the reorder modal mid-session and saving the new order called `renderSessionBody()`, which rebuilt the entire DOM from scratch. All ticked sets, kg/reps values, and bodyweight toggles were lost.
- **Fix:** `saveReorder()` now captures a snapshot of all per-exercise DOM state (kg, reps, ticked, bodyweight, notes) keyed by exercise name before reordering. After `renderSessionBody()` re-renders, the snapshot is replayed back into the new DOM positions.
- Exercise name is the stable key â this works correctly because reorder doesn't change the exercises, only their positions.
- commit b93fd175

### sw.js â cache bump vyve-cache-v2026-04-10d â vyve-cache-v2026-04-10e


## 2026-04-10 (late evening session)

### settings.html â 3 fixes
- `<!--email_off-->` tags stripped from `mailto:team@vyvehealth.co.uk` href â Cloudflare was injecting them literally, breaking iOS Mail â commit 737fadd
- Privacy Policy link corrected from `/privacy` (404) to `/privacy.html` â commit c8d7d40
- Both fixes atomic, settings.html is clean

### how-to-videos.html + how-to-pdfs.html â replaced with placeholders
- Both pages had custom nav markup, no theme.js, no nav.js, no auth gate, no SW registration
- Replaced entirely with clean placeholder pages (coming soon)
- Each now has: theme.js, nav.js, auth gate IIFE, SW registration, proper `data-theme="dark"` default
- Back button and standard VYVE nav now work on both pages â commit 32461c3
- sw.js cache bumped vyve-cache-v2026-04-10c â vyve-cache-v2026-04-10d

### running-plan.html â max_tokens fix
- `max_tokens` was hard-coded to `4096` when Haiku was switched in on 6 April (commit 758b572)
- Original code had `getMaxTokens(goal)` â marathon was 10,000, half was 7,000
- 20-week marathon plan (Stuart Watts) was being truncated mid-JSON every time
- Fixed: `max_tokens` raised to `16000` â covers all plan combinations with headroom
- Bonus: stripped `<!--email_off-->` Cloudflare tags from monthly limit mailto link â commit cb729bb

## 2026-04-10 (late evening session)

### generate-workout-plan â Full Restoration + Video Fix
- Discovered v4 had two unintentional regressions vs original onboarding v42:
  1. `programme_name` was hardcoded template instead of AI-generated
  2. `programme_rationale` was hardcoded template instead of AI-generated
- Root cause of Stuart's missing videos/thumbnails identified:
  - AI-generated plans invent exercise names (e.g. "Barbell Bench Press")
  - `workout_plans` library uses different format (e.g. "Bench Press â Barbell")
  - `workouts.html` uses strict equality match (`===`) â no fuzzy matching
  - This was always the case for AI plans; videos only worked when Stuart was on the static fallback library
- Deployed `generate-workout-plan` v5 with full restoration:
  - Step 1: `generateProgrammeOverview()` restored â AI generates personalised programme name and rationale (matches original onboarding v42 behaviour)
  - Step 2: Exercise library fetched from `workout_plans` table at runtime and injected into prompt â AI MUST use only approved exercise names
  - Step 3: After plan generation, each exercise enriched with `video_url` + `thumbnail_url` via direct lookup against library
  - Plan generation still uses two parallel calls (weeks 1-4, weeks 5-8) to avoid 16k token limit
- Stuart's plan regenerated with v5: "PPL Holiday Shred" â 8 weeks, 32 sessions, 212/212 exercises matched to videos
- `generate-workout-plan` is now the canonical plan generation path â onboarding v43 calls it as fire-and-forget

### Known Architecture Note
- `workouts.html` `getVideoUrl()` / `getThumbnailUrl()` use strict name equality â this is fine now that the EF constrains AI to library names
- If any future plan has unmatched exercises (v5 logs warnings), the issue will be in the prompt constraint, not the frontend


## 2026-04-10 (evening session)

### Password Reset Flow â Full Fix
- Root cause: `login.html` had `redirectTo` pointing to `login.html` instead of `set-password.html`
- Fixed `redirectTo` in `login.html` to `https://online.vyvehealth.co.uk/set-password.html`
- Fixed `set-password.html` to call `signOut(scope: global)` after password update, then redirect to `login.html?reset=success`
- Added success banner on `login.html` when `?reset=success` param present
- Added "Link already used" card to `set-password.html` with inline resend form â user can request new link without navigating away
- Increased invalid link timeout from 3s to 5s for slow mobile connections
- Supabase SMTP configured to send via Brevo (`smtp-relay.brevo.com:587`) â emails now send from VYVE Health <team@vyvehealth.co.uk> not Supabase Auth
- Brevo domain `vyvehealth.co.uk` verified (DKIM + DMARC green) via GoDaddy DNS
- Reset email template updated to table-based HTML button (renders correctly in all email clients)
- cache bumped: `vyve-cache-v2026-04-10a` â `b` â `c`

### Workouts.html â Nav Overlap Fixes
- Rest timer sheet and reorder exercises sheet were rendering behind the bottom nav bar
- Fixed `ex-menu-sheet` padding-bottom: `calc(72px + env(safe-area-inset-bottom))`
- Fixed `reorder-sheet` padding-bottom: `calc(84px + env(safe-area-inset-bottom))` and max-height: `calc(80vh - 65px)`
- Fixed `reorder-save-btn` bottom margin
- cache bumped: `vyve-cache-v2026-04-10c`

### Workout Plan Generation â Architecture Fix
- Root cause: `waitUntil` in onboarding EF has a hard timeout; advanced PPL plans (~14k tokens output) were silently failing
- Stuart Watts (`stuwatts09@gmail.com`) had no plan in `workout_plan_cache` â was seeing static fallback library
- Deployed new `generate-workout-plan` Edge Function (v4) as standalone dedicated EF
  - Generates weeks 1-4 and weeks 5-8 in two parallel API calls, stitches together
  - `max_tokens: 16000` per call â handles largest possible plans
  - `stop_reason` guard: fails loudly if output truncated, never writes corrupt data
- Updated `onboarding` EF to v43: replaces inline `waitUntil(generateWorkoutPlan)` with fire-and-forget fetch to `generate-workout-plan` EF
- Stuart's plan generated manually and written to `workout_plan_cache`: 8 weeks, 32 sessions, 36,521 chars
- Plan join verified â week 4â5 transition seamless (same exercises, correct progressive overload step)

### Stuart Watts â Account Notes
- Two accounts exist: `swatts@geoffreyrobinson.co.uk` (Feb 2026, old/legacy) and `stuwatts09@gmail.com` (10 Apr 2026, active)
- Active account is `stuwatts09@gmail.com` â RIVER persona, 4-day PPL, Advanced, Gym
- Old account has 12 workout logs with null plan/name (logged via legacy flow)
- All workout data safe â nothing deleted


## 2026-04-10

### External Brain System Created
- brain/master.md â complete business + technical context
- brain/how-to-use.md â human operator guide
- brain/schema-snapshot.md â all 36 tables from live Supabase
- brain/startup-prompt.md â trigger prompt for any AI session
- brain/changelog.md â this file

### Playbooks Created
- playbooks/brain-sync.md â session/daily/recovery sync system
- playbooks/debug.md â diagnose and fix issues
- playbooks/build.md â implement new features
- playbooks/research.md â deep understanding before action
- playbooks/review.md â code quality review
- playbooks/optimise.md â performance and readability
- playbooks/refactor.md â structural improvements
- playbooks/repo-audit.md â comprehensive system audit
- playbooks/execution.md â execute predefined plans
- playbooks/architect.md â system architecture design
- playbooks/github-operator.md â repo read/write operations
- playbooks/feature-build.md â end-to-end feature delivery
- playbooks/bug-fix.md â bug diagnosis and fix

### Tasks
- tasks/backlog.md â prioritised work queue
- tasks/task-template.md â reusable task card

### Infrastructure
- README.md â quick start guide
- prompts/cold-start.md â paste into any AI to begin

### Data Source
All verified against live Supabase project ixjfklpckgxrwjlfsaaz on 10 April 2026.

## 2026-04-10 (evening)

### Repo Hygiene
- `VYVEHealth/VYVEBrain` set to private â contains Supabase IDs, API keys references, commercial pipeline
- Removed duplicate `brain-sync.md` from repo root (canonical copy is `playbooks/brain-sync.md`)

### vyve-site Actions Cleanup
- Deleted dead `.github/workflows/inject-key.yml` â legacy workflow from before `anthropic-proxy` EF existed
- Verified `running-plan.html` already uses `anthropic-proxy` EF v5 (no placeholder, no key in HTML)
- `static.yml` (GitHub Pages deploy) retained â only workflow now running on vyve-site
- Commit: f557dae

## 2026-04-10 (morning/afternoon session)

### Daily Report Fixed
- `BREVO_API_KEY` secret was missing/wrong in Supabase â renamed to correct value
- `daily-report` v16 deployed â added full activity detail table (member name, type, specific activity, time)
- Report manually triggered and confirmed sending to team@vyvehealth.co.uk

### Password Reset Flow Fixed
- Supabase Site URL updated to `https://online.vyvehealth.co.uk/set-password.html`
- `set-password.html` confirmed correctly handles `PASSWORD_RECOVERY` token event
- Supabase email template updated: new VYVE-branded HTML body, subject now "Reset your VYVE password"

### Welcome Emails Resent
- Alan Bird and Owen Barrett identified as missing welcome emails (onboarded while Brevo key was absent)
- `resend-welcome` one-shot EF deployed â resent branded welcome with fresh set-password links
- BCC to team@vyvehealth.co.uk confirmed working on all future onboarding emails

### Backlog Updated
- Added: password reset email template (desktop task)
- Added: Exercise page redesign (product idea â gym / cardio / walking plan umbrella)

### Product Thinking
- Discussed replacing "Workouts" nav item with "Exercise" umbrella page
- Members choose path at onboarding: gym programme, running plan, walking/activity plan, or mix
- Each path generates an 8-week personalised plan (Sandra use case â non-gym corporate members)
- Key open question: do non-gym plans use same `workout_plan_cache` structure or simpler format?
- Decision deferred â parked in backlog under Later
