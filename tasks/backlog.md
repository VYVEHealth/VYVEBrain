# VYVE Health — Task Backlog

> Updated: 24 April 2026 (Sessions: HealthKit session 4 device validation + session 5 validation/flag/banner shipped)

---

## MVP Requirements (Critical for Enterprise Launch)

### 🔥 **Critical Missing Pieces**
1. **Native Push Notifications (2-3 sessions)** — APNs (iOS) + FCM (Android) via Capacitor plugins. Daily habit reminders, weekly check-in prompts, milestone celebrations, streak risk alerts. Currently only VAPID web push works on PWA.
2. **Habits Editing Bug** — Cannot un-skip or change habit answers once submitted. Members accidentally clicking wrong option are locked out until next day.
3. **HealthKit Integration (iOS-first) + Health Connect (deferred)** — Full plan at `plans/healthkit-health-connect.md`. v1 scope locked: reads 7 data types, writes weight only (workouts write-back not supported by Capgo 8.4.7 on iOS — codified session 4, dead path removed session 5d).
   - ~~Session 1 (DB + EF foundation) shipped 23 April~~: 3 tables, `queue_health_write_back` trigger, `sync-health-data` EF v1 ACTIVE. Shadow-read guard verified.
   - ~~Session 2 pre-device work shipped 23 April~~: `@capgo/capacitor-health@8.4.7` installed, `npx cap sync ios` wired SPM manifest, Info.plist upgraded to Apple-defensible copy, entitlement confirmed.
   - ~~Session 3 (client orchestrator + Settings UI) shipped 23 April~~: `healthbridge.js` + `member-dashboard` v50 (adds health_connections + health_feature_allowed) + settings.html rewrite. Feature-flagged via `localStorage.vyve_healthkit_dev='1'` with server allowlist staged but not yet wired.
   - ~~Session 4 (iOS device validation + UX overhaul) shipped 23 April~~ (commit [612459b](https://github.com/VYVEHealth/vyve-site/commit/612459b)): Xcode 26.4.1 + signing setup, iPhone 15 Pro Max dev-build working, four plugin debugging iterations codifying Capgo 8.4.7 iOS taxonomy (`Health` plugin name, `calories` dataType, `workouts` read-only, no `saveWorkout`). UX pivoted to Apple-native patterns: consent-gate 4th card (iOS only), connect-only Settings toggle with "open iPhone Settings to disconnect" note, 7-day re-prompt banner on index.html. Initial 30-day pull logged as "complete" but unverified.
   - ~~Session 5 (validation, bug hunt, server-authoritative flag) shipped 24 April~~: spot-check of the 30-day pull surfaced two silent bugs. `sync-health-data` v2 (workout-type normalisation fixes unpromoted workouts), SQL backfill of 7 existing samples, then vyve-site commits 5a/5b/5c/5d: readSamples method-name fix + platformId in native_uuid, persistent `has_connected` flag fixing banner regression, server-authoritative hydration via member-dashboard v50 on every page load (flag is off localStorage now — real gate is `HEALTH_FEATURE_ALLOWLIST` in the EF), dead writeWorkout branch removed. SW cache: `v2026-04-24d-write-path-cleanup`.
   - **Session 6 next — closing out v1:**
     - Write-path round-trip on-device (Dean logs weight on nutrition.html → ledger queued → confirmed → no shadow-read, no re-log duplication)
     - Verify six new sample types land on Dean's next sync (steps, HR, weight, active_energy, sleep, distance)
     - Consent-gate + re-prompt banner fresh-account flow test (needs clean signup)
     - Rollout decisions: Alan first, then cohort of ~5. Rollback = EF v51 with reduced allowlist.
     - Privacy.html HealthKit section + Lewis sign-off + App Store Connect questionnaire + Build 3 submit
     - Submission-scope decision: submit all 7 reads, or phase to 4 (workouts + weight + steps + active_energy) with v1.1 for HR/sleep/distance
   - **Post-launch HealthKit workstreams (all drafted 24 April):**
     - `plans/habits-healthkit-autotick.md` — auto-tick habits from HK data (steps 10k, sleep 7h+, workouts, cardio duration, flights). Server-authoritative `health_rule jsonb` on `habit_library`; `member-dashboard` v51 returns `health_auto_satisfied` per habit; habits.html pre-populates tick state. Pairs with editing-bug fix (Critical Missing Piece #2). ~3 sessions.
     - `plans/healthkit-views.md` — Apple Health data inspector (`apple-health.html`) + personal activity feed on `exercise.html`. Transparency + engagement. ~2 sessions.
     - Nutrition/MFP reads via HK — parked. Capgo 8.4.7 exposes no dietary types. Would need plugin fork/PR. Separate plan at `plans/nutrition-healthkit.md` when sequenced. Unblocks water habit auto-tick and MFP-native nutrition totals.

### ⭐ **High-Value Additions**
4. **Enhanced Content Quality** — Update wellbeing check-in slider questions to match onboarding questionnaire. Add health disclaimer for App Store compliance.
5. **Advanced Analytics** — Enhanced employer insights with absenteeism correlation, burnout prediction, productivity metrics for enterprise ROI conversations.

---

## Active Priorities (This Weekend)

1. **Android icon fix** — resubmitted 15 April, awaiting Google review
2. **iOS icon fix** — app live but icon wrong, Build 2 uploaded
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
- **Clean up one-shot migration EFs** — ~9 remain (was "89 dead" before most were deleted in the 9 April / 11 April cleanups). Candidates for deletion: `seed-library-1`, `seed-library-2`, `seed-b1`, `create-ai-decisions-table`, `setup-ai-decisions`, `setup-member-units`, `trigger-owen-workout`, `trigger-callum-workout`, `thumbnail-batch-upload`, `generate-stuart-plan`, `send-stuart-reset`. Keep `ban-user-anthony` if ban workflow still in use.

---

## Brain Hygiene (from 18 April reconciliation)

### Done this session
- ~~master.md §4: correct the "No triggers" / "No foreign keys" claims~~ **DONE 18 April — actual counts: 119 triggers, 25 FKs (not 14/24 as the previous note said)**
- ~~master.md §4: document the aggregation layer~~ **DONE 18 April — 7 tables + 11 functions + 4 cron jobs documented, Rule 33 added**
- ~~master.md §10: add Rule 33 — aggregation tables are EF-service-role only~~ **DONE 18 April** (+ Rule 34 DB-level caps, Rule 35 email auto-lowercasing)
- ~~Brain reconciliation: update EF inventory~~ **DONE 18 April — all 58 active EFs documented with live versions, missing ones added (admin-dashboard, cc-data, send-password-reset, warm-ping, leaderboard)**
- ~~Automate or delete `brain/schema-snapshot.md`~~ **DONE 18 April — automated via `schema-snapshot-refresh` EF v2 + `vyve_schema_snapshot` cron (Sunday 03:00 UTC). GitHub writes via new fine-grained `GITHUB_PAT_BRAIN` secret (VYVEBrain contents:write only). First auto-commit: [36384af](https://github.com/VYVEHealth/VYVEBrain/commit/36384afa58c9b8381a4d37d6e6554f571dea7229).**
- ~~Resolve `generate-workout-plan` EF ambiguity~~ **DONE 18 April — un-retired. Kept as canonical standalone plan generator. Onboarding v74 duplicates logic inline; refactor task added below.**

### Open
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
- Re-engagement automations x3 (blocked on Lewis email copy)
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