## PM-651 — VYVE Mental Fitness: mental-fitness.html shipped (2026-06-18)

vyve-site commit `598a4a5978e7`. Six files: `mental-fitness.html` (new), `db.js` SCHEMA_V25, `sw.js` cache bump + precache, `mind.html` tile, `index.html` + `settings.html` vbb 464.

**mental-fitness.html** — single-page three-tab feature (Today / Train / Track) under the Mind hub. Three-tab strip at top mirrors engagement-v2 pattern; global app nav at bottom unchanged. No mockup chrome — full portal standard: `nav.js` back-button header, `theme.js` dual dark/light tokens, `db.js`/`sync.js`/`bus.js`/`haptics.js`/`analytics.js`/`achievements-evaluator.js` all loaded.

**Today tab:** streak stat (consecutive days with a practice or mood), this-week average mood, count of active trackers. Daily plan checklist (mood check-in + complete an exercise + any committed recovery actions; each tappable to launch the action). Early-warning card when triggered (PLACEHOLDER thresholds — Phil sign-off required before promoting to final values). Recommended exercise card (mood/burnout-adaptive, rotates daily otherwise).

**Train tab:** nine exercises in three categories (Calm down / Think clearer / Feel better) as tool-row cards → multi-step guided overlay (dot-progress strip, forward/back, field types: text/textarea/range/chips, breath animation on breathwork screens). Finish step writes to `mind_fitness_log` via Dexie + REST + `log-activity` EF for engagement/charity rollup. Recent practice log below.

**Track tab:** Mood section (SVG line chart last 14 scores, insight text, "Log today's mood" overlay with 5-face picker + emotion/driver chips + note). Going-without trackers (days free, money saved, health/time milestones, slip reset preserves longest streak; add-tracker overlay with 9 preset types). Burnout check (9-question quiz across E/C/F dimensions; score formula `(E+C+(12-F))/36×100`; four zones PLACEHOLDER — Phil sign-off required; trend line on re-checks; recovery suggestions with "+ Add" wiring to daily plan). Always-visible crisis signposting block.

**db.js SCHEMA_V25:** six new member-scoped Dexie stores — `mind_fitness_log`, `mind_moods`, `mind_trackers`, `mind_burnout_checks`, `mind_recovery_actions`, `mind_recovery_log`. All keyed on `id`, indexed on `member_email` + date/type fields + `client_id` partial-unique per §23.10.

**Supabase:** six tables live (migration `mental_fitness_tables`). All RLS-enabled (`(SELECT auth.email())=member_email` per §23.67), `vyve_lc_email` trigger on each, `tg_mark_home_state_dirty_ins/upd/del` on `mind_fitness_log` for engagement pipeline. Excluded from employer rollups by omission. Added to GDPR pipeline (backlog — erasure path to be wired in next session).

**Clinical gates (pending Phil sign-off):** burnout zone thresholds (30/50/70), early-warning trigger values (avg≤2.2, trending-down+latest≤2, burnout≥70), all zone/crisis copy. Signposting structure is present and mandatory from this commit; exact wording is Phil-gated.

**Practices count toward charity/engagement** via `mind:logged` bus event + `log-activity` EF call on exercise completion. Mood check-ins and burnout checks do NOT trigger log-activity (deliberate — logging a low mood must not earn a charity month).

**mind.html:** Mental Fitness tile added below Money tile (same `.tool-card` pattern, PM-651 comment).

## PM-650 — money.html: auth fix + enterprise-only track disclaimer (2026-06-18)

vyve-site commit `fe07a16c`. `money.html` only. Two fixes: (1) Auth replaced broken `vyveInitAuth` polling loop with canonical `window.VYVE_AUTH_READY` promise pattern (same as breathwork/journal) — `_email` now set correctly on every open so localStorage key `vyve_money_<email>` persists across sessions. (2) Track tab disclaimer ("your financial data is never shared with your employer") now `display:none` by default, shown only when `account_type === 'enterprise'` via `maybeShowPrivacyBadge()` — same gate as the Hub privacy badge. Individual members see neither. vbb 463.

## PM-649 — money.html: nav + safe-area + calc timing fixes (2026-06-18)

vyve-site commit `d3d9c09f`. 5 files. Three bugs fixed post-first-device-test: (1) Nav: added `nav.js` script tag, added `'money': 'Financial Wellbeing'` to `subPageLabels`, added `money` to mind path detection in `getActiveTab()`. `.wrap` padding-top now `calc(env(safe-area-inset-top,0px) + 76px)` to clear the sticky mobile header. (2) Reader back/next buttons: moved safe-area inset onto `.reader-top` `padding-top: calc(env(safe-area-inset-top,0px) + 14px)` so buttons sit below status bar. (3) Track calc: `money-calc.js` changed from `defer` to sync load; `renderTrack()` retries after 50ms if `VYVEMoney` not yet ready instead of bailing silently. Removed custom page-header block (nav.js provides header). vbb 462.

## PM-648 — VYVE Money: financial wellbeing feature (2026-06-18)

vyve-site commit `e420236e`. 6 files: `money.html` (new, 1462 lines), `money-calc.js` (new, pure calc module), `sw.js` (cache bump + precache), `index.html` (vbb 461), `settings.html` (vbb 461), `mind.html` (Money tile added).

**Feature.** VYVE Money is a five-view financial wellbeing tool inside the Mind pillar. Views: Hub (score ring + 4 KPIs + priority ladder + insights + learn nudge), Track (income + 50/30/20 split + expenses + savings pots + debts + net worth), Assess (8-question Likert check-in → 0-100 score + 4 dimension sub-scores + focus tips + recommended course), Plan (goal planner + emergency fund target + 20yr projection @ 2%/5% + avalanche/snowball debt payoff simulator), Learn (5-step starter path + 10 courses with knowledge checks + jargon buster).

**Persistence.** All financial figures stay in localStorage keyed per member email (`vyve_money_<email>`). Nothing sensitive leaves the device. Two server writes only: `mind_activities` row with `kind='money_checkin'` on assessment completion and `kind='money_course'` on course completion — no figures, just event + date. These earn Mind-pillar engagement credit and feed the charity mechanic.

**Calc module.** `money-calc.js` exposes `VYVEMoney` global: `calc()` (derived figures: needs/wants/essential/efMonths/savRate/dti/leftover/netWorth), `band()` (4 score bands), `scoreAssessment()`, `dimScores()`, `focusTips()`, `recommendCourse()`, `ladder()` (5 rungs), `insights()` (prioritised engine, max 5), `payoff()` (month-by-month avalanche/snowball), `projection()` (240-month compound), `goalMonths()`. All lifted verbatim from prototype, matching its behaviour exactly.

**Theme.** Full dual dark/light token parity via `theme.css`. No inline `:root` (§23.6). Portal palette (#0D2B2B / #1B7878 / #4DAAAA / #C9A84C), not the prototype's CC palette.

**Privacy.** Employer badge (`"your figures are never shared with your employer"`) conditional on `account_type === 'enterprise'` — hidden for individual members. Phil-gated mood/crisis copy: structural card absent; financial signposting (MoneyHelper, StepChange) ships freely.

**Nav.** nav.js wired (back → Mind). Mind tile added to `mind.html` tool-grid. sw.js precache + cache bump `vyve-cache-v2026-06-18-pm648-money-a`. vbb 460→461 in index.html + settings.html.

## PM-647 — Topnav prominence (2026-06-17)

CC commit `bf76bd4`. `assets/shell.css` only.

Topnav height 64→72px, padding 28→32px. Wordmark font-size 20→24px. Search padding and font-size bumped (fs-sm→fs-base). Bell icon buttons 34→40px hit area. User avatar circle 32→38px.

## PM-644/645/646 — CC shell layout: persistent left sidebar + topnav fix + dark mode (2026-06-17)

Three CC commits: `73b6f18` (PM-644), `07732e3` (PM-645), `83786d9` (PM-646).

**PM-644 — Persistent left sidebar** (`assets/shell.css`): `#app.ready` → `display:flex`. Sidebar `transform:translateX(0)` always on desktop (no `.open` needed). `topnav-tabs` hidden permanently. `main.main` flex:1. Mobile ≤900px: sidebar reverts to slide-in drawer.

**PM-645 — Topnav fix** (`assets/shell.css`): Topnav was only spanning the sidebar width because it was a flex sibling of `aside` + `main`. Added `margin-left:280px` as interim fix (superseded by PM-646). `topnav-tools` `margin-left:auto` pushes search+avatar to far right.

**PM-646 — Correct layout + dark mode** (`index.html`, `assets/shell.css`, `assets/tokens.css`, `pages/settings.html`):
- `index.html`: wrapped `<header.topnav>` + `<main>` in `<div class="app-body">` (flex column). Added theme boot script in `<head>` (reads `vyve-cc-theme` from localStorage, sets `data-theme` before first paint, avoids FOUC). Added `window.VYVE_THEME` helper (`get()`/`set(mode)`).
- `shell.css`: `.app-body { display:flex; flex-direction:column; flex:1 }`. Topnav margin-left removed (now correctly inside app-body). `main.main` margin-left removed.
- `tokens.css`: `@media (prefers-color-scheme: dark)` block added — applies dark tokens when `html` has no explicit `data-theme` attribute. System preference respected by default.
- `settings.html`: "Appearance" card added at top with Light / System / Dark segmented toggle. Wired to `VYVE_THEME.set()`. Persists to localStorage.

**Gotcha:** `#app` flex children must be sidebar | app-body-column — topnav as a direct flex sibling of sidebar caused the header to only span sidebar width.

## PM-643 — Team App Phase 4: session scheduler (2026-06-16)

CC commit `ebfc4c8`. Single file: `pages/sessions.html` (full rewrite). DB: `calendar_occurrences` admin write RLS added.

**`calendar_occurrences` write RLS** — 3 new policies: INSERT/UPDATE/DELETE → `is_admin()`. SELECT unchanged (open to all authenticated).

**`pages/sessions.html` rebuilt** — replaces the old localStorage/VYVE_MAKE stub entirely. Now drives `calendar_occurrences` directly via Supabase client.

- **3-tab list** — Upcoming (starts_at ≥ now, active, not cancelled), Past (starts_at < now, not cancelled, limit 100), Cancelled (cancelled_at IS NOT NULL). Live KPI strip.
- **Admin controls** — "Schedule session" button (hidden for team), Edit button per row, Cancel button per row (sets `cancelled_at`, keeps row). Hard delete behind a secondary confirm with explicit "test data only" warning.
- **Scheduler modal** — Fields: title (→ both `name` + `session_title`), category, type, starts_at, ends_at, host_name, host_role, location_online, location_venue, live_url, session_description, notes, source_catalogue_id.
- **Catalogue pre-fill** — dropdown of `service_catalogue` live_session rows auto-fills category, type, host, and calculates end time from `duration_minutes` when start is set.
- **Double confirm gate** — on new sessions: (1) modal-level banner warning "member-facing publish"; (2) JS `confirm()` showing title + formatted datetime before INSERT fires. Edit saves without second confirm (already live, editing is expected).
- **Team members** — read-only list; no Schedule/Edit/Cancel buttons.

**Gotcha:** `sessions.html` was previously a localStorage stub (VYVE_MAKE pattern) with no Supabase connection. Not relevant to member portal — safe to replace wholesale.

## PM-642 — Team App Phase 3: 3-source calendar union read + role gating (2026-06-16)

CC commit `5cbcda4`. Single file: `pages/calendar.html`.

**Source swap:** `cc_sessions` replaced with `calendar_occurrences` as the live-session feed. Query selects `id,name,session_title,starts_at,ends_at,category,type,location_online,location_venue,live_url,cancelled_at,active` filtered by `active=true` and `cancelled_at IS NULL`. `parseSessionStart()` updated to use `starts_at` (full timestamptz) instead of `session_date+'T10:00:00'`. Session title resolved as `session_title || name || 'Session'`. `live_url` mapped to `meet` for the Meet icon in all views. End time uses `ends_at` properly.

**Session date filter fixed:** was comparing `s.session_date === key` (string match); now compares `new Date(s.starts_at).toISOString().slice(0,10) === key`.

**Role gating:** `state.isAdmin` added; set in `boot()` from `window.VYVE_USER.role`. "New event" button hidden by default, shown for admins. Delete button in modal gated to `state.isAdmin` (previously gated to `owner_email === state.me` — team members had no delete anyway via RLS, but now also hidden client-side).

**Legend:** "Team event" → "Meeting" for clarity.

**3-source union is now complete:** `cc_calendar_events` (team meetings, RW for admins) + `calendar_occurrences` (live sessions, RO) union-at-read, colour-coded (teal=meeting, gold=session, coral=private).

## PM-641 — Team App Phase 2: auth role gating + task attachments (2026-06-16)

CC commit `50bf8f5`. No portal (vyve-site) changes.

**`lib/auth.js`** — `checkAdmin()` replaced: now calls `is_admin_or_team()` (broader gate) then `is_admin()` to determine specific role; returns `{ allowed, role }` instead of a boolean. `showApp()` accepts `role` arg, broadcasts it on `vyve:user` CustomEvent detail and sets `window.VYVE_USER = { email, role }` for synchronous access by page scripts.

**`pages/tasks.html`** — role-scoped controls wired:
- `state.isAdmin` flag added; set in `boot()` from `window.VYVE_USER.role`.
- "New task" button hidden by default (`style="display:none"`), shown in `boot()` if `isAdmin`.
- Delete button in editor modal gated: `isEdit && state.isAdmin` (team members see no delete).
- **Attachment section** added to editor modal (edit mode only): lists `cc_task_attachments` rows for the task; download via signed URL from `cc-task-docs-url` EF; delete (admin only) via same EF + row removal; upload via signed PUT to `cc-task-docs` bucket then `cc_task_attachments` INSERT.

**`cc-task-docs-url` EF v1** — ACTIVE. verify_jwt: true. Three actions: `upload` (returns signed PUT URL + storage_path), `download` (returns signed GET URL, content-disposition:attachment), `delete` (admin only — removes Storage object + attachment row). Storage path pattern: `<task_id>/<8-char-rand>/<file_name>`.

**`cc-task-docs` Storage bucket** — private, no public access. Storage RLS: upload/download → `is_admin_or_team()`, delete → `is_admin()`.

## PM-640 — Team App Phase 1 — Foundation (2026-06-16)

Backend-only. No UI shipped.

**`admin_users` role constraint** — extended existing `admin_users_role_check` to include `'team'` (full set now: admin / viewer / coach_full / coach_exercise / coach_mental / team).

**New SECURITY DEFINER RPCs:**
- `is_team()` — true if caller is in `admin_users` with `active=true AND role='team'`
- `is_admin_or_team()` — true if caller is in `admin_users` with `active=true AND role IN ('admin','team')`. Used as the permissive read gate across Tasks + Calendar + Attachments.

**RLS surgery on `cc_tasks`** — dropped old `cc_team_only` ALL policy; replaced with 4 per-cmd policies: SELECT → `is_admin_or_team()`; INSERT → `is_admin()`; UPDATE → `is_admin() OR (is_team() AND assignee = auth.email())`; DELETE → `is_admin()`.

**RLS surgery on `cc_calendar_events`** — same DROP; replaced with 4 policies: SELECT → `is_admin_or_team()`; INSERT/UPDATE/DELETE → `is_admin()`. Team members read-only on calendar; write surface comes in Phase 4 (scheduler).

**New table `cc_task_attachments`** — `id UUID PK`, `task_id UUID FK cc_tasks ON DELETE CASCADE`, `uploaded_by TEXT`, `file_name TEXT`, `storage_path TEXT`, `file_size BIGINT`, `mime_type TEXT`, `created_at TIMESTAMPTZ`. RLS: SELECT/INSERT → `is_admin_or_team()`; DELETE → `is_admin() OR (is_team() AND uploaded_by = auth.email())`. Storage bucket + signed-URL EF deferred to Phase 2.

**`admin_users` roster** — 5 team members added (role='team'): Calum Denham, Cole Patterson, Heidi Khoshtaghaza-Hay, Phil Hurwood, Ryan Hewitt.

**Gotcha banked:** existing `admin_users_role_check` constraint predated 'team' role (had admin/viewer/coach_full/coach_exercise/coach_mental only) — required drop+recreate, not ADD CONSTRAINT.


## PM-639 — Command Centre IA reorg (4 domains) + Team App spec (2026-06-16)

Talk-first IA session — **no code shipped**, decisions locked for build (Sonnet to continue). Artefacts: `CC-information-architecture.md` + `CC-team-app-spec.md`.

**4-domain nav model** replaces the two competing layers today (the 8-section `assets/sidebar-config.js` `VYVE_NAV` sidebar + the separate 7-tab `VYVE_NAV_TOP`, which collapsed all 8 Insights pages into one tab and never surfaced Partner Space). New top level:
- **Run the Business** — Daily / Commercial / Marketing / Delivery / Knowledge / Org as sidebar sub-groups.
- **Analytics** — the 8 cron-backed Insights pages **+ App Health pulled out of Delivery**.
- **Members** — admin-console Shell 1/2/3 + Broadcast + Active Users.
- **Partners** — the reconciled `partners.html` monolith. The 7 `pages/partner-*.html` are **orphans** (not referenced in router/sidebar/index) → KILL after a full-repo grep.

Four cross-domain moves: App Health Delivery→Analytics; Broadcast Delivery→Members; Active Users Org→Members (it reads real portal member data); old Partners skeleton Commercial→killed (superseded). Triage KILLs: old Partners skeleton, Performance (Metricool covers it), Brand (it's a doc), 7 orphan partner-* pages, root `Dashboard.html` (verify-then-kill). BUILD/LATER verdicts on the ~14 stub/skeleton pages live in the IA artefact + §13.

**Team App spec.** A role-scoped slice of the CC, web-first, Capacitor-wrapped to TestFlight **only once content is signed off**. Foundations ~80% already exist: `admin_users` (email/role/active) = roster; `cc_calendar_events` (attendees/meet_url/source/gcal_event_id/color) = meetings; `cc_tasks` (assignee/stage/completed_at/created_by) = assignable+completable. Genuinely missing: (1) `cc_task_attachments` table + private `cc-task-docs` bucket + signed-URL EF (partner-docs pattern); (2) team self-serve RLS via a new `is_team()` capability; (3) live-session scheduler write surface into `calendar_occurrences`.

v1 = everything (tasks + calendar + meetings + scheduler). **Calendar = 3 sources, union-at-read (no sync):** `cc_calendar_events` (team meetings RW) + `calendar_occurrences` (live events RO) + scheduler writes into `calendar_occurrences`, colour-coded by `source`. **Scheduler is capability-gated (admin + `lives`) + confirm-step** — it publishes member-facing session rows; a bad row lands on every member's session list. Decisive calls: roster = extend `admin_users.role` (admin/team), not a new table; packaging = 2nd Capacitor binary off `vyve-capacitor` pointing at the role-gated CC; calendar = union-at-read.

Build phases (Sonnet): **1** foundation (admin_users roles + `is_team()` + RLS on cc_tasks/cc_calendar_events/cc_task_attachments) → **2** tasks (shared-list UI + completion + attachments table/bucket + signed-URL EF) → **3** calendar (3-source view + meeting CRUD) → **4** scheduler (calendar_occurrences write + gate + confirm) → **5** wrap (deferred to content sign-off). Open, non-blocking: app name/bundle id, team route/subdomain (only matters at wrap), scheduler capability holders, gcal 2-way sync (lean internal-only v1), meet_url auto vs paste (lean paste v1).

## PM-637 — Partner onboarding polish (PM-634/635) + admin file retrieval (PM-636) (2026-06-16)

Continued same session after PM-632. Composio GitHub down → Vault PAT + Git Data API throughout.

**PM-634 (Test-Site `280b88f5`) — verification trim + free navigation.** Removed Photo ID and DBS/background-check uploads from step 2; verification now collects professional qualifications (required), governing body/membership (optional), two references (required). Overview flow + "what we collect" checklist + submission record/summary updated; `documents` payload now `{qualifications, profilePhoto}`. Navigation made non-linear: rail jumps to ANY step, "Continue" no longer hard-blocks, rail shows a green check per *complete* section and the % bar reflects completed-count (new `isStepComplete(i)`). Completeness enforced once, at Submit — `submitJourney` checks all 8 steps, jumps to the first incomplete, flags its fields, toasts which sections remain.

**PM-635 (Test-Site `f8007951`) — two live-test fixes.** E-sign date auto-stamps today + read-only (no picker). Profile photo renders as an `<img>` in the phone preview (was a CSS `background-image` that didn't display; matched the upload chip which used `<img>` reliably).

**PM-636 (CC `2ca57a41`) — admin file retrieval.** New EF `partner-file-url` (verify_jwt:true; admin-gated: caller's email in `admin_users` with `active`) returns a 5-min signed DOWNLOAD url (content-disposition attachment) for `partner-content`/`partner-docs`. Download button added to `partners.html` content items (queue + library); `downloadPartnerFile()` calls the EF with the item's `media_url`, saves to the admin's machine. Workflow: partner uploads starter video → private `partner-content` → admin downloads from Content & Moderation to run the live session off their Mac. No transcode/streaming pipeline (still not needed for this flow).

Verified: wizard JS syntax clean, all pushes md5-matched, both EFs ACTIVE. Live no-auth flow + uploads + downloads not yet browser-tested from this sandbox (can't reach supabase.co); Dean testing on live origin.

## PM-633 — Partner referral attribution + Stripe webhook v10 (2026-06-16)

Completed the partner revenue loop. stripe-webhook EF v10 live.

### Schema changes (PM-632 migration)
- `partner_partners.stripe_coupon_code` renamed to `stripe_promo_code`
- `partner_partners.human_promo_code` added (display only)
- `partner_partners.revenue_share_pct` default updated to 50%
- `partner_memberships` gained: `referred` bool, `account_type` (b2c/b2c), `subscription_value` numeric, `stripe_customer_id`, `stripe_subscription_id`, `attribution_date`
- `run_partner_payouts(period)` function rebuilt: counts referred=true, account_type=b2c, subscription_status=active members only. gross = sum(subscription_value), payout = gross × revenue_share_pct. Monthly cadence.
- `compute_partner_monthly_payout(partner_id, period)` helper fn added.

### stripe-webhook EF v10 (PM-633)
Added `handlePartnerReferral` to `customer.subscription.created` handler:
- Reads `discount.coupon.id` off the subscription object
- Looks up `partner_partners.stripe_promo_code` for a match
- Only attributes to `status='live'` partners
- Creates `partner_memberships` row: referred=true, account_type=b2c, subscription_value=20
- Attribution errors never fail the webhook — raised as platform_alerts instead
- B2B members excluded from partner revenue share entirely

### Coupon code convention (§23.122 — new hard rule)
Partner codes are Stripe Coupons with a MANUALLY SET readable coupon ID (e.g. MAYA, OLU50). NOT promotion codes — no promotion code objects needed. The coupon ID IS the partner code. Stored in `partner_partners.stripe_promo_code`. This is the permanent standard going forward.

### Revenue model locked
- B2C only: £20/month × 50% = £10/member/month to partner
- B2B excluded
- Monthly payouts, referred active members only
- Attribution permanent (referred flag set at first subscription.created, not recalculated)

### §23 rule
- **§23.122 (NEW):** VYVE partner referral codes are Stripe Coupons with manually-set readable IDs (e.g. MAYA, OLU50). Never use Stripe Promotion Code objects for partner attribution — one object only. Coupon ID stored in `partner_partners.stripe_promo_code`. stripe-webhook reads `discount.coupon.id` on `customer.subscription.created`.

## PM-632 — Partner onboarding: drop login/OTP, make it a public no-auth flow (2026-06-16)

Same-session correction to PM-631. The OTP/magic-link step was unnecessary over-engineering — a partner application needs no login (the member onboarding EF is public too). Dean received a magic-link email (Supabase's default OTP template) and rightly questioned why verification existed at all. Removed entirely.

- `partner-onboarding` EF → **v2, `verify_jwt:false` (public)**, same posture as member onboarding. Draft is a capability token: the `partner_id` UUID (unguessable) is returned at `start` and held in localStorage; `save`/`upload-url`/`submit` look up by id — no email, no JWT, no `getUser`. `start` accepts `resume_id` to resume a draft. `uploadToSignedUrl` still works without a session.
- Wizard `partner-onboarding.html` (Test-Site `08cf0612`): OTP overlay + `signInWithOtp`/`verifyOtp`/`beginAuth`/`skipAuth`/`closeAuth` all stripped; `ensureDraft()` creates the draft on step-1 Continue with zero friction; supabase-js retained for storage uploads only.
- Migration `partner_drop_contact_email_unique`: dropped the partial-unique index on `contact_email` — it was only an auth key, and a revisit (cleared localStorage) or duplicate email must not fail the insert. `contact_email` stays as plain contact data.
- **No email verification anywhere now.** If anti-spam is wanted later, add a post-submit confirm — never gate the flow.

Supersedes the PM-631 auth description (that entry's OTP details are historical). Test-Site `08cf0612` (PM-632). EF v2 ACTIVE.

## PM-631 — Partner onboarding JOURNEY built: self-serve wizard + partner-onboarding EF + private buckets (2026-06-16)

Built the partner self-serve onboarding journey PM-630 flagged as "NOT YET BUILT (next session)". Composio GitHub still down → Vault PAT + Git Data API throughout (§23.27). Brain HEAD moved PM-618→630 mid-session (parallel admin-backend session) — re-fetched fresh before editing per §23.26, avoided clobber. PM claim: max-across-repos 630 → this brain commit PM-631. (Test-Site wizard commit was labelled PM-619, claimed before the namespace re-check — non-monotonic but unique across repos, harmless.)

### Built
Rebuilt the provided prototype (`VYVE-Partner-Onboarding-Journey.html`) 1:1 — same tokens/icons/rail/8 steps/validation/file chips/watch-gate/retakeable assessment/live phone preview/submission summary — as production `Test-Site-Finalv3/partner-onboarding.html` (commit `898f0c61`, md5-verified). Mock layer replaced with the real backend; layered onto PM-630 models, NO duplication.

### partner-onboarding EF (v1, verify_jwt:true)
Action-routed `start | save | upload-url | submit`. Identity = magic-link OTP; ownership `partner_partners.contact_email == JWT email`. Service-role writes.
- `start`: create-or-resume. Inserts `partner_partners` (status `applied`, pillar mapped physical→body/mental→mind/social→connect, interim `role_title`=specialism, generated slug, `contact_email`), `partner_applications` (credentials seed), `partner_onboarding_progress` (pct 12). Resume returns stored credentials+progress.
- `save`: debounced merge of `credentials` (formFields+pillar+references), `steps` gates, `pct_complete`, assessment (passes/score/`assessment_passed_at`).
- `upload-url`: `createSignedUploadUrl` into `partner-docs` (doc) / `partner-content` (content); path `{partner_id}/{slot}/{uuid}-{file}`.
- `submit`: finalises `partner_partners` (role_title/bio/why/feel/avatar_url), writes final `credentials` (agreement+e-sign+signedAt, doc object-paths, launch, welcomePost) + `reference_contacts`, inserts `partner_content_items` per starter video at `in_review`, flips 8 gates + pct 100, notifies team via `send-email` (service-key bearer, non-fatal). Leaves `status='applied'` — admin advances pipeline; `trg_assert_partner_golive` still enforces go-live gate.

### Migration `partner_onboarding_intake_additive`
- `partner_partners.contact_email` + partial-unique on `lower()` WHERE NOT NULL — OTP identity/resume/dedupe key. Admin Invite path (PM-622) leaves NULL, no conflict.
- `partner_onboarding_progress.assessment_score numeric` + `assessment_passed_at timestamptz` — PM-630 had pass/fail booleans only; business rule needs score+timestamp.

### Storage
`partner-docs` (private,15MB,image+pdf), `partner-content` (private,500MB,video). Sensitive docs private-only via signed upload URLs.

### Decisions
- Bank/payout capture DROPPED from wizard (Stripe Connect at go-live; `partner_payouts` = runs not bank details; raw sort code/acct pre-approval = needless GDPR/PCI liability; prototype had them optional → no loss).
- Agreement copy + safeguarding/GDPR assessment questions placeholder behind visible "draft pending VYVE sign-off" — Lewis owns agreement, Phil owns safeguarding (HAVEN-style gate).
- Wizard localStorage offline fallback (testable in preview); OTP soft-gates after step 1 (Skip allowed), hard-gates at submit.

### Verified / not
Start+submit write-replay constraint-valid (status→pipeline, content→moderation queue, assessment persisted); sentinel cleaned. EF ACTIVE v1. Wizard md5-matched on Test-Site. **NOT yet exercised live end-to-end** — OTP→submit needs real inbox + live origin (sandbox egress blocks supabase.co). Dean to run first-use OTP→submit→pipeline check.

### §23.122 (NEW — HARD)
`partner_content_items.moderation_status` defaults `'draft'` but admin queue counts only `'in_review'`; default-written content is invisible to moderation. Writers intending review MUST set `in_review`. EF does.

### Commits
Test-Site-Finalv3 `898f0c61` (PM-619 label) — partner-onboarding.html. Supabase: migration `partner_onboarding_intake_additive`; EF `partner-onboarding` v1; buckets `partner-docs`,`partner-content`. VYVEBrain PM-631 (this).

### Next
Member-facing in-app Partner Space surface (no demo file); "Become a partner" CTA → `/partner-onboarding.html`; admin Invite to optionally capture `contact_email` + dedupe vs self-serve; programs sub-tab + curriculum persistence (from PM-630).

## PM-630 — Partner Space: admin backend built + live on vyve-command-centre (2026-06-16)

Long session. Partner Space admin console built from scratch as a standalone page (`partners.html`) on `admin.vyvehealth.co.uk`, matching Lewis's demo design system exactly (dark `#0d1117`, mint `#5ec4b0`, left sidebar, blur topbar). All wired to live Supabase data. Composio GitHub down → Vault PAT path throughout.

### Schema shipped (PM-618 base, all via Supabase MCP migrations)
8 new tables: `partner_partners`, `partner_applications`, `partner_content_items`, `partner_programs`, `partner_community_posts`, `partner_memberships`, `partner_onboarding_progress`, `partner_payouts`. All RLS-enabled. Go-live gate trigger (`trg_assert_partner_golive`) blocks `status→live` until `safeguarding_passed AND gdpr_passed AND pct_complete=100`. Engagement segment refresh fn (`refresh_partner_engagement_segments`). Onboarding pct sync trigger (`trg_sync_partner_onboarding_pct`). Payout ledger fn (`run_partner_payouts`). Mock seed data inserted then wiped clean (all tables at 0 rows).

### Admin UI shipped
`partners.html` (PM-620, standalone, self-contained, ~90KB):
- 7 views: Overview (KPIs, pipeline attention, top partners, activity feed), Pipeline & Approvals (kanban Applied→Vetting→Interview→Contract→Onboarding, click-to-review panel, Advance/Decline writes to DB), Partners (directory table with filters, detail drill-in with 5 sub-tabs: Overview/Content/Members/Revenue/Settings), Content & Moderation (queue/flagged/library/programs with Approve/Return), Onboarding (curriculum reference + in-progress tracker), Analytics & Engagement (pillar split, engagement leaderboard), Revenue & Payouts (ledger + Run payouts + Mark paid)
- Invite partner modal (PM-622→628): full form writing to `partner_partners` + `partner_applications`, lands in pipeline kanban immediately. Modal uses `document.body.appendChild` pattern to escape flex stacking context (§23.121).
- Add applicant (pipeline page) wired to same invite modal
- Request more info: logs note to `partner_applications.notes`
- Edit curriculum: editable 8-step modal
- Device preview panel: renders member view of any live partner

### Sidebar integration (PM-621)
`vyve-command-centre` sidebar has "Partner Space" section with single "Partner Management" link → `/partners.html`. Old 7 hash-route pages (partner-overview, partner-pipeline etc) still exist in repo but are unlinked — delete on CC overhaul.

### Key architecture decisions
- Palette: command-centre existing tokens, NOT the prototype's third dark theme
- Pillars stored as `body/mind/connect` (VYVE canonical), not `physical/mental/social`
- Live sessions and videos ride `calendar_occurrences`/`replay_videos` via FK — no parallel infra
- Revenue attribution: engagement-weighted split (sessions attended). Lewis must confirm before Revenue view ships real numbers to partners
- Go-live: same duty-of-care bar as HAVEN (§23.84). Phil/Lewis own human sign-off
- Modal stacking context fix: `document.body.appendChild(overlay)` before showing; z-index:99999. All new modals use this pattern (§23.121)

### Still missing from Lewis's original brief
- Member-facing Partner Space (in-app): `VYVE-Partner-Space-Demo.html` not provided — member browse/join/feed/library surface not built
- Partner onboarding journey: `VYVE-Partner-Onboarding-Journey.html` provided at session end — 8-step self-serve flow for incoming partners — NOT YET BUILT (next session)
- Impersonate/manage-as-partner capability
- Programs sub-tab (shows "coming soon")
- Curriculum edits don't persist to DB yet

### §23 rules
- **§23.121 (NEW):** Any modal using `position:fixed` that is a descendant of a `display:flex` or `display:grid` container MUST be appended to `document.body` at open time (`document.body.appendChild(el)`) before setting display. CSS stacking contexts created by flex/grid trap fixed children regardless of z-index. This is a browser spec behaviour, not a bug.

### Commits (vyve-command-centre)
PM-618 `77e480a6` — 7 partner pages + sidebar section
PM-619 `90e3ab68` — Partners top-nav tab (later removed)
PM-620 `6aeda22b` — standalone partners.html
PM-621 `b9b1ef8c` — sidebar cleanup (single link to /partners.html)
PM-622 `9854d433` — invite partner modal
PM-623 `62004c45` — overlay z-index fix attempt
PM-624 `0b6e7326` — overlay outside #app attempt
PM-625 `df08102b` — addEventListener fix
PM-626 `16d1c3df` — topbar z-index fix
PM-627 `ae2b7356` — cssText nuclear fix
PM-628 `6117c69a` — body.appendChild fix (working solution)
PM-629 `b7b8644c` — all stub buttons wired
PM-630 `bb2cd243` — syntax error fix (literal newline in string)

## PM-618 — fix home habit tap not repainting progress rings until reload (2026-06-15)

Dean: "click a habit, progress doesn't update until I leave the page and come back" — on Home (index.html), tested on his server.url dev-loop iPhone (so PM-609 was already in his shell — not the freeze). Composio GitHub down again → Vault PAT + Git Data API path throughout (§23.27). PM claimed 618 after cross-repo scan (PM-610/611 were taken by VYVEBrain onboarding commits; max-across-both was 617).

### Root cause
PM-609 fixed the habit *row* flipping instantly (early `renderHabitList()` on the fast Dexie path). But the progress *rings/counters* (`#pills-row`) recompute only via `loadPillarCounts()` → `renderPills()`, which reads Dexie via `allFor(email)`. That recount was wired ONLY to the cross-page `VYVEBus.subscribe('daily_habits', …)` channel (index.html L2846, built for the habits.html→home case). A same-page home tap goes through `togglePill`, which publishes on the **`habit:logged`** channel and calls `VYVEBus.recordWrite('daily_habits', …)` (the dedupe ledger, NOT publish/subscribe) — so the `daily_habits` subscribe never fired from a home tap. The row flipped (inline `renderHabitList()`), `optimisticPatch` updated the home-state aggregate for the score ring, but the pillar rings never recounted until the next boot re-ran `loadPillarCounts()`.

### Fix
`togglePill` now calls `loadPillarCounts()` (fire-and-forget, try/guarded) immediately after the Dexie write settles — after the `upsert` await in the tick branch and after the `delete` await in the untick branch. `loadPillarCounts` has no in-flight guard and reads Dexie, so re-call is safe; rings recompute within a frame of the local write. Dean confirmed fixed on device.

### Commit
vyve-site `7cae8af6` — index.html (2× `loadPillarCounts()` + vbb 460) + settings.html (settings-vbb-marker 460) + sw.js (CACHE_NAME `vyve-cache-v2026-06-15-pm618-habit-rings-recount`). Atomic via Git Data API (blobs→tree→commit→ref); §23.30 md5-perfect verify on all 3 = MATCH.

### Delivery
On main → reaches Dean (server.url) + Android members; NOT iOS 1.7 members until OTA/1.8 (§23.106). Same constraint as PM-609 / PM-601 / PM-575.

### §23 rule
- **§23.120 (NEW):** A same-page optimistic write must explicitly re-trigger every *sibling* renderer that derives from the written table, not just the primary surface's own renderer. Bus `subscribe(<table>)` channels are CROSS-PAGE (§23.42); a same-page tap that publishes on a *semantic* channel (`habit:logged`, `body:logged`) does NOT fire the `<table>` subscribe channel, and `recordWrite`/`recordCanonical` are dedupe-ledger calls, not publish. So a sibling renderer wired only to the table-subscribe channel goes stale until next boot. Audit when adding any same-page optimistic write: list every renderer that reads the written table (row list, pillar rings, score ring, counters, streak strip) and confirm each is retriggered inline (or via an in-page idempotent subscriber per §23.42), independent of the cross-page bus. Second occurrence of the PM-609 class (row flipped, sibling renderer didn't).

## PM-617 — Consent-version stamping gap closed: server-side trigger + backfill (2026-06-15)

Follow-on after the PM-616 close. The consent-version-null flag (observed on Azusa's row) fixed properly. Composio still down → Vault PAT path.

Gap: PM-603 added `members.privacy_version`/`health_consent_version` + backfilled existing consenters `'pre-versioning'`, but never wired the write path. consent-gate.html stamps `terms_version='v1.0'` (constant at L287) yet omits the privacy/health version fields — so every gate consent after 12 Jun landed NULL (9 rows incl. Azusa, Paul Skipper, Kieran Day). Onboarding doesn't touch consent; the gate (vyve-site/consent-gate.html) is the sole write path.

Constraint: native members run bundled builds, so a consent-gate.html edit can't reach the installed base (§23.106) — they're exactly who hits the gate. So the fix is server-side.

Fix: `BEFORE INSERT/UPDATE` trigger `trg_default_consent_versions` on `members` (`public.default_consent_versions()`, search_path pinned, REVOKE PUBLIC; migration `add_default_consent_versions_trigger`). Fill-null-only: `privacy_version='v1.0'` when `privacy_accepted_at` is set; `health_consent_version='v1.0'` when `health_data_consent` true. Never overwrites existing/history (`'pre-versioning'` untouched). Covers every client + build, zero lag.

Backfill: UPDATE the 9 v1.0-gate rows (`terms_version='v1.0'` AND `privacy_version` NULL). The trigger filled `health_consent_version` on the same UPDATE for the 5 health-consenters; left NULL for the 4 who declined. `'v1.0'` is the existing in-use convention (mirrors `terms_version`), not a new value — no Lewis decision needed.

Verified: consented-but-unversioned residual = 0; health-consented-unversioned residual = 0; `privacy_version` dist v1.0:9 / pre-versioning:27 / null:16 (the 16 nulls are genuinely never-consented). Trigger present.

Rider (not blocking): consent-gate.html should also write `privacy_version`/`health_consent_version` explicitly at source on the next vyve-site build (gate stamps `terms_version` but omits these). New §23.119 hard rule codified.

## PM-616 — CC Usage lifecycle + PostHog install analytics, and cardio foundation running-plan reconciler (2026-06-15)

Composio GitHub down again → Vault PAT + Git Data API path throughout (§23.27). Brain commit is PM-616; session work spans PM-612→615.

**PM-612 — Usage lifecycle status (cc-usage EF v10 / vyve-command-centre `b50d3b42`).** Replaced the single dormancy pill with per-member lifecycle. cc-usage members_json now carries `consent_done` (privacy_accepted_at not null), `installed`, `signed_in` (auth last_sign_in_at OR consent), and derived `lifecycle` (active > installed > consented > signed_in > never).

**PM-613 — PostHog install signal (cc-usage EF v11, Supabase version 13, verify_jwt:false).** Install-proof PRIMARY leg = PostHog person.properties.email that has EVER produced a `$current_url LIKE 'capacitor://%'` event (365-day window), OR'd with native push token / HealthKit. Cross-platform (catches Android + native opens with no push token); fails safe to push/HK if PostHog unreachable. `POSTHOG_API_KEY` already an EF secret (eu.posthog.com, project 138491). Added `installed_via` (native_event/push_token/healthkit). native_emails:22. Real-cohort after: active 21, installed 9, consented 2, signed_in 0, never 11; source native_event 17 / push 8 / hk 1 — PostHog now dominant. **Decision:** do NOT remove mobile web login (Paige web-only + only payer; older server.url builds; dev loop; enterprise fallback §23.1) — dashboard already separates app vs web.

**PM-614 — Usage status simplified to 3 tiers (vyve-command-centre `c2dc4933`).** Six labels → Never installed (merges never/consented/signed_in; web login doesn't count) / Installed · no activity / Active·Quiet·Inactive (≤7/8–30/30+). Headline + filters aligned. Granular lifecycle retained in cache for 360 drill-down. Cache-bust `?v=PM-614-v1` (CC has no SW/vbb markers).

**PM-615 — Cardio members landed plan-less; foundation running-plan backfill + reconciler.** Root cause: workouts stream auto-generates 8-wk plan (31/31), movement writes a wpc row (9/9), but CARDIO had no auto-plan — running plans are on-demand on running-plan.html → member_running_plans — so 2 of 3 cardio members (Paul Skipper, Kieran Day) were empty. NB "Foundation" in-brain = a MOVEMENT locked-ramp plan (Sedentary Reset), NOT a cardio fallback. Fix (A) backfill: INSERT member_running_plans for the 2 from running_plan_cache "Complete my first 5K / complete beginner / 2 days / 12 wks", plan_name 'Starter: Your First 5K', source='foundation', is_active=true (reversible: DELETE WHERE source='foundation'). (B) reconciler: SECURITY DEFINER fn `public.ensure_foundation_running_plans()` (migration add_ensure_foundation_running_plans_fn; search_path pinned; REVOKEd PUBLIC/anon/authenticated per §23.104; ACL {postgres,service_role}); CROSS JOIN LATERAL picks beginner-5K plan by goal/level (robust to cache_key change). Cron `vyve-foundation-running-plans` jobid 47, */5, active. Manual run inserted 0 (idempotent); 2 foundation plans active. Chose reconciler over onboarding-EF surgery: signup path untouched, self-heals future plan-less cases.

**Observed, not fixed:** new member rows have `privacy_version`/`health_consent_version` NULL (e.g. Azusa coco.azu0804@gmail.com, 14 Jun) — consent gate isn't stamping the PM-603 version columns. Enterprise/Sage consent-audit relevance; fix when next touching the gate.

## PM-608 — Onboarding/auth password-flow overhaul + welcome-email live-session sourcing + onboarding resilience (2026-06-12)

Long session covering the onboarding lock-out problem, the welcome email, and making onboarding robust against missing answers. Composio GitHub down → Vault PAT path used throughout. Brain commit is PM-608 (highest shipped PM this session = 607).

### Root problem: members locked out after onboarding
Onboarding EF (then v95) created the auth user with NO password (email_confirm only + magic link), password set later via a fragile recovery-email link. 23 of 61 auth users had `last_sign_in_at IS NULL` (~38% stuck). Failure modes: email providers pre-consuming single-use recovery tokens ("link already used"), silent fire-and-forget password failures, Supabase leaked-password breach rejections, two-password confusion, no failure visibility, recovery links opening in Safari not the app.

### Shipped — password setup flow
- **PM-602** (vyve-site a09956df): login.html — "First time here? Set up your account" link + vyveSetup() (resetPasswordForEmail). Markers 457.
- **PM-603** (Test-Site-Finalv3 dae05015): password+confirm fields in questionnaire §10. Superseded by PM-605.
- **PM-604** (vyve-site c578467): set-password.html maps Supabase leaked-password/breach error to actionable guidance. Markers 458, cache vyve-cache-v2026-06-12-pm604-pwbreach-msg.
- **PM-605** (Test-Site-Finalv3 6733650): full password-complexity gate in questionnaire — live pw-reqs checklist (8+/upper/lower/number/symbol) mirroring Supabase config EXACTLY; submit gated; BOTH submitQuestionnaire + retrySubmit now `await confirmPasswordSet(email,password)` (1 retry) before showResults — fire-and-forget removed; PASSWORD_SET_FAILED error screen.
- **set-member-password EF** (deployed, verify_jwt:false): {email,password} → resolves auth user via new SECURITY DEFINER RPC `public.get_auth_user_id_by_email(text)` (search_path='', service_role only) → admin PUT password. Returns {success:true}.
- **[DECISION] Supabase leaked-password protection turned OFF** (dashboard). Confirmed live auth config: password_min_length=8; required chars = lower+upper+digit+symbol; breach check OFF. So the form's complexity rule exactly matches what Supabase will accept.

### Shipped — onboarding EF v96 → v97 (live version 113)
- **v96 (PM-606, version 112):** welcome email + AI session rec now sourced from `calendar_occurrences` (live schedule: active=true, cancelled_at IS NULL, starts_at>now, order asc, limit 12) NOT static service_catalogue. Added fmtSessionWhen() (Europe/London "today/tomorrow/Weekday at Xpm") + occurrenceDurationMin(). `ls` (AI session list) + pickSessionRec(persona,stream,upcoming) repointed to upcoming. service_catalogue refs removed. Verified end-to-end: welcome_rec_2 = 'Join "Steps to Improve your Life with Jamie" tomorrow at 8:30am in Mindfulness & Mindset' — real session, host, concrete time.
- **v97 (PM-607, version 113):** onboarding resilience. (1) writeMember coerces `weight_unit: d.weightUnit || 'kg'`, `height_unit: d.heightUnit || 'cm'` (was `|| null` — explicit null OVERRODE the DB default on these NOT-NULL-with-default columns, hard-failing the whole member write). (2) On strict insert failure, retry with a minimal guaranteed-valid `core` payload (email, name, persona, recs, onboarding_complete, subscription_status, units, exercise_stream, life_context, cert counts) so a paid member is never locked out by one bad/missing optional field; fires `writeMember_core_fallback` team alert. Only a genuinely broken record (no email) fails. Verified: a payload OMITTING weightUnit/heightUnit entirely now completes (onboarding_complete:true, units default to kg/cm) — the exact case that hard-failed v96.

### Member rescues
12 stuck members password-set via temp one-shot EFs (all deleted after use): Dan Zadeh, Jack Lambert, Pippa Shanks, Katrina Melia, David McCormack, Lisa Fox, Ana Luna, Melanie Eaton, Hazel Smith, Ema Devereaux, Angie Jones-Moore, + Shaun Baker (shaunbaker122qa@gmail.com → password set to `Mario123!` via set-member-password; tell Shaun: email + Mario123!, sign in directly, don't tap reset links).

### Schema finding (logged for safety)
`members` has exactly ONE NOT-NULL-without-default column: `email` (correct). `weight_unit`/`height_unit` are NOT NULL but DEFAULT 'kg'/'cm' — so code must OMIT or default them, never send explicit null. v97 fixes the code side; making them nullable is a belt-and-braces backlog option.

### Pending (not built)
Welcome-email coach-voice rewrite (per-persona NOVA/RIVER/SPARK/SAGE AI-voiced + HAVEN pre-written/clinically-reviewed) — two mockups built (welcome-email-v2-mock.html, coach-voices-comparison.html), awaiting Lewis copy sign-off before building into the EF.

## PM-603 — Full brain reconciliation vs live (§23 holes filled, inventories/counts to live, stale items closed) (2026-06-12)

Dean flagged recurring wrong answers from sessions. Root cause: sessions faithfully updated the CURRENT FRONT, changelog, and (mostly) §23/§19 ship-narratives, but the durable inventory/count tables (§6/§7/§24) and the §20–22 status board rotted, and several §23 hard rules existed ONLY in the changelog. Full read of master + changelog, cross-checked against live Supabase (`execute_sql` + `list_edge_functions`) and GitHub.

### §23 reconciliation (the wrong-answers engine)
- Master's §23 jumped §23.94 → §23.104. The §23.95–103 band + §23.105 + a third §23.107 lived only in the changelog.
- **§23.105 back-filled** from PM-568 (no `current_setting('app.*')` in cron auth headers; embed the JWT literal).
- **Duplicate §23.107 → §23.110** (PM-573 CURRENT-FRONT rule; the PM-571 OTA rule keeps §23.107).
- **Promoted changelog → master §23.111–116:** tracker→log-activity-or-invisible (PM-575, was a 3rd §23.107), www-clone-before-bundle (PM-557 §23.95), Java-21-for-gradlew (PM-557, was a 2nd §23.94), achievement-toast-gate (PM-554 §23.97), lockBody-10s-timer (PM-554 §23.98), JS-cachebust-query-string (PM-585 §23.101).
- Orphan `dim values 1/2/3` table fragment at top of §23 reformatted to a note.

### Inventories + counts → live (12 Jun)
- §5/§6: 120 → **133 public tables**; §16 RLS 120 → 133; §6/§14 workout_plans ~297 → ~313; §23.91 replay_videos "=4" → 31.
- §1 members: 23 → **47** (trial 36, comp 10, paid 1; NO enterprise). §6 members row: added `is_test`, `privacy_version`, `health_consent_version`, `tour_completed_at`.
- §6/§7: documented the **CC Insights suite** (cc-app-health/usage/retention/wellbeing/platform/activity/revenue/ai EFs + `cc_*` cache tables + crons 38–45 + 8 admin pages) + `stripe-webhook` + `apply-trial` + `session-reminder-cron`. §7 count 124 → ~150.
- Cron: three divergent brain tables (28/29/30 "active") replaced by one live §24 table (41 jobs, **40 active**; jobid 27 disabled; jobid 26 daily → 36 hourly). §7 sub-table + §12 pointer marked superseded.

### Stale "open" items closed / contradictions resolved
- **GITHUB_PAT_CLAUDE rotation DONE** (PM-558, no expiry). §24 + front corrected — stop re-flagging "expires 20 June".
- **GDPR cron static-PSK** removed — §21/§22 marked resolved.
- **sync-health-data** "dead since 24 May" clarified: server-side scheduled path retired for foreground-only sync (§23.93); EF is live/ACTIVE v22.
- **Make** §12 reconciled to §24 (retired, not "broken/133 stuck").
- **changelog.md size** §21 corrected: 67KB/~800 lines (pre-PM-554 in `changelog-archive.md`), not 2.5MB.
- §19–22 status board refreshed off the 26-May snapshot (iOS 1.8/1.0.7 in review not 1.4/1.0.5; HAVEN 3 members not "Conor since 15 April"; OTA wiring DONE PM-602; dropped "before 31 May" guard).

### Production data fix
- 2 fake `enterprise` members (Callum Budzinski, Kelly Bestford — team) → `account_type='comp'`, `is_test=true`. They had inflated Revenue MRR by £20 (£40 → real £20, Paige only) and skewed cohort denominators.

### Open / confirm
- cron jobid 27 `session-publish-hourly` is DISABLED — Dean to confirm intentional.
- §23.106 OTA canary still unverified (top native, pre-Sage gate).
- Not line-audited this pass: master 943–990 (brand palette) + §23.34–86 rule bodies (stable doctrine).

### Commit
Brain-only (master.md + changelog.md, atomic via Git Data API; Composio not used). No vyve-site / EF / migration changes beyond the 2-row members data fix above.

## PM-602 — iOS 1.8 + Android 1.0.7 submitted; OTA wiring live in both binaries (2026-06-11)

End-to-end OTA setup session. Closes §23.107 (wiring now in binary) and advances §23.106 to "pending first canary verification."

### What shipped
- **`live-update.js` (PM-597/PM-600)** — `LiveUpdate.ready()` + `LiveUpdate.setChannel('production')` + `LiveUpdate.sync()` wired into vyve-site web shell. Native-guarded IIFE; no-op on server.url dev shell and web. `production` is the Capawesome channel name (not the UUID). File included on index.html and login.html (cold-start pages).
- **`.github/workflows/ota-deploy.yml`** — dormant OTA push workflow committed to vyve-site. Manual trigger via GitHub Actions UI (`workflow_dispatch`), rollout % input (default 10% canary). Authenticates via `CAPAWESOME_TOKEN` repo secret. Pushes to app `f9961f66-eb66-4102-b1c5-f9b2c7baeebf`, channel `production`. Ready to fire the moment 1.8 installs on a real device.
- **`CAPAWESOME_TOKEN`** — added to vyve-site GitHub Actions repo secrets (token name `vyve-ota-ci`, no expiry, created 11 Jun 2026).
- **iOS 1.8 (build 3)** — submitted to App Store Connect for review. `server.url` removed, `channel: production` in LiveUpdate block, `live-update.js` bundled. Screenshots uploaded (5 × 1284×2778 px). "What's New": OTA support messaging.
- **Android 1.0.7 (versionCode 53)** — AAB built and uploaded to Play Console production track. Same web shell as iOS 1.8.

### Capawesome channel clarification (banked)
Brain previously recorded channel as `89e12796` (the internal UUID). Live Channels page shows two channels: **`production`** (0 devices, 0 deployments — the correct target) and **`default`** (4 devices — where trial cohort landed due to no explicit channel in prior config). `live-update.js` + `capacitor.config.json` now both pin `production` explicitly.

### §23.107 update
The "no sync/ready calls" rule is now RESOLVED for 1.8+. `live-update.js` ships the wiring. §23.107 rewritten below.

### Next action
Once 1.8 is approved + installed on a real device (not Dean's server.url dev phone): trigger `ota-deploy.yml` from GitHub Actions with rollout=10. Watch Capawesome Cloud → VYVE Health → Live Updates → Channels → production → Logs for bundle receipt. Verify vbb marker updates on the device on next cold start. That closes §23.106.

## PM-601 — fix daily_habits hydrate dropping PK (engagement score read low) (2026-06-11)

### Root cause
Kelly's "Your Journey → Score" showed 74 at 23:10; server `compute_engagement_components_v2` returned 83. Not v1/v2 confusion, not decay, not midnight rollover. The v2 page computes from Dexie via `computeEngagementV2FromDexie` → `allFor(email)`. Her Dexie `daily_habits` held only TODAY's row (habits pillar rendered 5.0pts = today capped, vs SQL 19.71 = full decayed week). Server had habits on all 7 days. The `daily_habits` hydrate in `sync.js` used a hand-written `select=member_email,activity_date,habit_id,habit_completed,notes` — **no `id`**. PostgREST returned PK-less rows; Dexie's §23.43 merge keys on `r.id`, so all 365 days collapsed onto one null-keyed slot. Only the locally-autoticked today row (written with a real id by member-dashboard mirror) survived. Every OTHER activity table uses `select=*` (includes id) — habits was the sole offender.

### What shipped
- **vyve-site commit `d3fc35b`** (Git Data API fallback — Composio GitHub had no active connection this session): `sync.js` — added `id` to the `daily_habits` hydrate select (now `select=id,member_email,activity_date,habit_id,habit_completed,notes`). `index.html` + `settings.html` vbb-marker 455→456. `sw.js` CACHE_NAME → `vyve-cache-v2026-06-11-pm601-habits-id`. Verified all four at commit SHA.

### Brain corrections
- §11C parity claim ("72/72 exact match") annotated: formula parity holds, DATA parity is conditional on full Dexie hydration. Was masking this bug class.
- New **§23.109** (HARD RULE): explicit PostgREST `select=` on member-scoped activity tables must include `id`; prefer `select=*`. Missing-PK collapses local history silently.

### Not yet reaching members
Fix is on main; Dean sees it via server.url dev loop. Members on bundled iOS 1.7 / Android 1.0.6 frozen binaries will NOT get it until an OTA push — never fired (§23.106/107, Sage blocker). OTA push is the next action. A member force-quit only self-heals if their shell loads current main, which a bundled build does not.

## PM-596 — welcome.html: download app card after recs (2026-06-10)

### What shipped
- **Test-Site-Finalv3 commit `d62df2b`**: `welcome.html` — download app card inserted between `#resultContent` (AI recs) and `next-steps-card` (email info). Full-width teal gradient card with headline, sub-copy, and store badges. Device-sniffed: iPhone/iPad shows App Store badge only; Android shows Play Store badge only; desktop/unknown shows both side-by-side. App Store: `https://apps.apple.com/gb/app/vyve-health/id6762100652`. Play Store: `https://play.google.com/store/apps/details?id=co.uk.vyvehealth.app`.

## PM-595 — Usage page: phone numbers in member 360 modal + never-active outreach list (2026-06-10)

### What shipped
- **cc-usage EF v8** (Supabase): added `phone` to members select + `phoneMap` enrichment; `phone` now in every `members_json` row in the cache
- **vyve-command-centre commit `8a626dd`**: `assets/usage.js` — phone as tappable tel: link in 360 modal Profile section; never-active outreach modal now shows full name + email + phone per member; `pages/usage.html` — cache buster bumped to PM-595-v1

### Never-active password analysis (live query 2026-06-10)
15 real never-active members (zero activity across all tables). All have `encrypted_password` set (onboarding EF creates auth users). **9 have never signed in at all** (last_sign_in_at IS NULL): Melanie Eaton, Molly Moran, Ana Luna, Lisa Fox, David McCormack, Katrina Melia, Pippa Shanks, Jack Lambert, Dan Zadeh. 6 have logged in but not acted: Lou Walker (signed in today), Heidi Khoshtaghaza-Hay, Carly Doogan, Mark Maddison, Alex Jordon, Kieran Day. To see phone numbers and trigger outreach: Usage page → Members tab → filter "Never active" → click member for 360 modal, OR use the never-active modal.

## PM-594 — AI Usage page, wellbeing×activity correlation, HAVEN compliance flag (2026-06-10)

### What shipped
**Supabase:**
- cc-ai EF v1 (ai_interactions analysis: usage by trigger/persona, HAVEN compliance detail, 12-week trend)
- cc_ai table (BIGINT PK, headline/usage/haven/trend JSONB cols, admin-read RLS)
- Cron `cc-ai-hourly` jobid 45 at `35 * * * *`
- cc-activity EF v5 (fixes watch column names: pct_watched not watch_pct, watch_seconds for both tables; total_watch_minutes now shows 5.9 correctly)
- cc-wellbeing EF v4 (adds correlation_json: per-member avg_wb vs total_acts)
- cc_wellbeing.correlation_json column added

**vyve-command-centre (PM-594 commit `ef65f670f6ad`):**
- `pages/ai-usage.html` + `assets/ai-usage.js` — AI Usage page at `/#/ai-usage`
- `pages/wellbeing.html` + `assets/wellbeing.js` — correlation section added + wbRenderCorrelation function
- `assets/sidebar-config.js` — AI Usage entry added (7th Insights page)
- `lib/router.js` — ai-usage added to no-cache slug list

### Cache data (2026-06-10T07:18)
- AI: 68 interactions · 23 unique members · HAVEN alert active (9 interactions, clinical_gate_passed=false)
- HAVEN: 3 real members (Calum Denham, Conor Warren, Kieran Day) + Phil Hurwood (clinical lead himself). Mix of onboarding + re_engagement triggers. Compliance risk — needs Phil sign-off before Sage.
- Wellbeing correlation: 7 data points. Top 3 most active members avg wb 8.0, bottom 3 avg 5.0 — +3.0 difference, directionally consistent with VYVE hypothesis. n=7 is directional only.
- Activity: total_watch_minutes=5.9 fixed (was 0 due to wrong column names).

### HAVEN compliance summary
9 HAVEN interactions in production with real non-test members:
- calumdenham@gmail.com: onboarding 13 Apr
- conor@conorwarren.co.uk: onboarding 15 Apr + 3x re_engagement (May)
- kieranday97@gmail.com: onboarding 13 May + 2x re_engagement (May)
- phil_hurwood@hotmail.co.uk: onboarding 27 May (Phil is the clinical lead himself)
Action required: Dean to brief Lewis; coordinate Phil sign-off before Sage demo.

## PM-593 — CC audit cont.: cc-activity EF real build, SVG Day-N chart, re-engagement effectiveness (2026-06-10)

### What shipped
**Supabase:**
- cc-activity EF v4 (real build — stubs were v1-3; queries mal, exercise_logs, mind_activities, replay_video_views, session_live_views, weight_logs, member_running_plans, member_health_connections for all 7 sections)
- cc-retention EF v5 (adds reengage_json: per-stream email effectiveness, 7-day return rate)
- cc_retention.reengage_json column added

**vyve-command-centre (PM-593 commit `d88a35c3af04`):**
- `assets/retention.js`: Day-N horizontal bars → SVG line chart with benchmark dashed line, colour-coded points (green above / orange below), data table with pp delta vs benchmark, ⚠ low-confidence flag (n<10)
- `assets/retention.js`: retRenderReengage function + re-engagement effectiveness section added
- `pages/retention.html`: re-engagement card added after at-risk section, version bumped

### Cache data (2026-06-10T01:08)
- Re-engagement: Stream A (7-day inactive) 52% return rate (26/50 sent), Stream B (30-day inactive) 24% return rate (6/25 sent), overall 43%. Strong numbers — industry average is 5-15%.
- Activity: rebuilt with 11 adoption features, full pillar breakdown, heatmap, exercise depth. total_watch_minutes=0 (watch query column mapping issue — backlog).

### Remaining audit items (carry forward)
- Watch time query: replay_video_views column names differ — total_watch_minutes shows 0
- log-perf: only 79 rows from May 2026 testing; needs broader wiring across portal pages
- AI usage + cost page (ai_interactions table has all the data)
- Wellbeing × activity correlation chart (the VYVE ROI story)

## PM-592 — CC analytics audit: Revenue page, wellbeing EF v2, account type, WoW deltas (2026-06-10)

### What shipped
**Supabase:**
- cc-wellbeing EF v3 (real build — prior versions were stubs; computes from wellbeing_checkins + members baseline cols)
- cc-platform EF v2 (is_dean PostHog filter; perf_note added about 79-row coverage gap)
- cc-revenue EF v1 (MRR, subscription breakdown, trial pipeline, 12-week new-member trend)
- cc-usage EF v7 (adds account_type + subscription_status to member enrichment)
- cc_revenue_cache table (BIGINT PK, 5 JSONB cols, admin-read RLS, §23.104 applied)
- Cron `cc-revenue-hourly` jobid 44 at `20 * * * *`

**vyve-command-centre (PM-592 commit `5360249b9045`):**
- `pages/revenue.html` + `assets/revenue.js` — Revenue page at `/#/revenue` (MRR hero, breakdown table, trial pipeline, 12-week new-member trend)
- `assets/usage.js` patched: account_type pill column + week-over-week activity/DAU deltas in headline
- `pages/usage.html` patched: Account column header, delta sub-elements
- `assets/sidebar-config.js`: Revenue entry added (6th Insights page)
- `lib/router.js`: revenue added to no-cache slug list

### First cache data (2026-06-10)
- Wellbeing: avg 7.5/10 · 7/33 members ever checked in (21% participation) · 1 at-risk · 18 trend weeks
- Revenue: MRR £40 (1× £20 paid B2C + 2× £10 enterprise) · 22 trial pipeline · 9% conversion
- Platform (is_dean filtered): 13,730 views (down from 14,054) · 625 unique sessions

### Audit gaps resolved this session
- Wellbeing page was completely empty (stub EF) — now live with real data
- Platform page showing Dean's dev traffic — is_dean filter applied
- No revenue visibility anywhere — Revenue page created
- Members table had no subscription type column — Account pill added
- Headline had no trend direction — WoW delta arrows added for acts7d + active7d

### Remaining from audit (carry to next sessions)
- Day-N retention: still a table, needs visual line chart with benchmark
- Re-engagement email effectiveness (returned % after contact)
- cc-activity EF is a stub (data is stale, refresh broken)
- log-perf only wired on 5 pages from May testing — needs broader wiring
- AI usage + cost page; Notification effectiveness; Wellbeing × activity correlation

## PM-591 — Platform & UX analytics page live (2026-06-10)

### What shipped
- `pages/platform.html` + `assets/platform.js` — Platform & UX page at `admin.vyvehealth.co.uk/#/platform`
- `cc-platform` EF v1 (`verify_jwt:false`, admin-gated when JWT present, open to cron)
- `cc_platform` table — id=1 JSONB cache: headline_json, pages_json, errors_json, perf_json, dead_json; admin-read RLS; §23.104 revoke applied
- Cron `cc-platform-hourly` (jobid 43, `5 * * * *`)
- Sidebar: platform status `coming-soon` → `live`

### Data sources
- **PostHog HogQL** (eu.posthog.com, project 138491, `POSTHOG_API_KEY` from Vault):
  - `$pageview` events — top 50 pages by visit volume, unique users, % of total (last 30 days)
  - `ef_error` events — grouped by ef_name + status, count, last seen (last 30 days)
- **Supabase `perf_telemetry`** — fetched raw (79 rows), pivoted in EF to p50/p75/p95 per page for LCP/FCP/TTFB/INP

### Page sections
1. Headline strip: total views, unique sessions, EF error count, median LCP, pages tracked, low/dead count
2. Top pages — horizontal bar chart (top 20) + full sortable table (views / unique users / % of total)
3. EF error log — table by ef_name + status, colour-coded count pill, last-seen
4. Load time percentiles — per-page LCP p50/p75/p95, FCP p50, TTFB p50, INP p75, colour-coded by Web Vitals thresholds
5. Coverage — low-traffic (<10 views) and dead (0 views) vs 34 known pages

### First cache data (2026-06-10T00:32:09Z)
- 14,054 page views · 639 unique sessions · 76 pages tracked · 0 ef_errors · median LCP 391ms (excellent)
- 5 low-traffic pages · 0 dead pages · 7 pages with perf data
- All four Insights sidebar pages now live

## PM-590 — Wellbeing analytics page live (2026-06-10)

### What shipped
- `pages/wellbeing.html` + `assets/wellbeing.js` — Wellbeing page at `admin.vyvehealth.co.uk/#/wellbeing`
- `cc-wellbeing` EF v1 (same assertAdmin pattern as cc-retention: user-context client + is_admin() RPC)
- `cc_wellbeing` table — 6 JSONB columns: headline, trend, members, distribution, baseline, participation
- `compute_cc_wellbeing()` SECURITY DEFINER function; §23.104 revoke applied
- Cron `cc-wellbeing-hourly` (`55 * * * *`)
- Sidebar: wellbeing status `coming-soon` → `live`

### Also shipped this session (PM-589)
- Fix activity-depth auth: `actGetJwt()` now uses `vyve-cc-supabase-auth` key (matches retention.js)
- Read path changed from EF to PostgREST direct on `cc_activity` table (RLS handles auth)
- EF auth pattern fix: cc-activity v2 now uses user-context client + `is_admin()` RPC (matches cc-retention)

### Wellbeing page sections
1. Headline strip: avg wellbeing (7.5), checked-in members (7/33), total check-ins (31), at-risk (1 — Cole, score 1), improving vs baseline, participation %
2. Weekly score trend: 18 weeks (Jan–Jun 2026), colour-coded bars, hover for submission count
3. Member table: baseline vs latest, delta, trend arrow, status pill, check-in count — sorted at-risk first
4. Score distribution: per-bucket histogram (1–10)
5. 8-dimension baseline profile: avg onboarding self-assessments from members table (clearly labelled as baseline, not live check-in data — check-in sub-scores are NULL in current form)

### Key data
- 31 check-ins, 10 members ever checked in (but 7 of 33 real members with complete data)
- Dean: 14 check-ins (most engaged), Calum: +4 delta, Cole: -4 delta (at risk, score 1)
- Avg 7.5/10 overall wellbeing

## PM-588 — Cyber Essentials strategy agreed (2026-06-10)

- Decision: do CE (self-assessed) now via IASME (~£300-400, days to certificate). VYVE stack passes trivially — managed cloud, no on-prem, JWT auth, RLS everywhere.
- CE+ (independently verified, ~£1.5k, 4-6 weeks): hold until a specific deal requires it. Ask Sage procurement what they actually need before spending.
- Pen test (~£1-2k): hold until a live enterprise deal triggers the requirement.
- Public sector (NHS) route will require CE+ at higher contract values — no way around it, but not the immediate path.
- No code shipped this session.


## PM-585 / PM-586 — retention.js cache-bust + missing function definitions fixed (2026-06-09)

- PM-585: retention.html script tag version bumped from PM-580-v1 → PM-584-v1 to bust browser cache
- PM-586: Three render function definitions (retRenderDayN, retRenderStreaks, retRenderCriticalEvents) were missing from retention.js — the insert anchor used was an HTML comment that doesn't exist in JS files. Fixed by inserting before the `// ── Boot ─────` anchor which is stable. Verified all three definitions present in committed file (18,019 chars).
- Root cause lesson: always assert that str.replace() actually changed the string, not just that the target string appears somewhere in the result (it was already present in the function call added by a prior patch).
- Retention page fully working: all six sections render. §23.101 reminder: bump JS query-string version in HTML on every JS update.

## PM-584 — Retention page: day-N curve, streaks, critical events (2026-06-09)

- Day-N retention curve live: D1 61%, D3 50%, D7 68%, D14 47%, D30 69%, D60 57% vs industry benchmarks (D1:30%, D7:15%, D30:8%). VYVE well above at every interval.
- Streak analytics: avg current 1.6d, avg best 2.7d, max 16d, 2 members at 7+ streak now. Distribution chart by best-ever streak.
- Critical events (aha moment): 15 retained vs 3 churned (low confidence). Cardio in week 1 = +20pp retained. Check-in = +13pp. Sample too small for definitive conclusions.
- Consent gate removed from funnel — signal unreliable (10-min timeout bug). member_home_state also unusable (backfilled by cron for all members).
- created_at fixed for Dean (2025-12-07), Lewis (2025-12-19), Kelly (2026-02-28), Callum (2026-02-28) — first activity date at 09:00 UTC.
- Median TTF now 0h (same-day), 16 same-day activations. Mean 9d skewed by Kelly/Callum outliers.
- cc-retention EF → v4

## PM-580 — Retention & Activation page live (2026-06-09)

### What shipped
- `pages/retention.html` + `assets/retention.js` — Retention page at `admin.vyvehealth.co.uk/#/retention`
- `cc-retention` Edge Function v1 (`verify_jwt:false`, admin-gated via `assertAdmin()`)
- `cc_retention` table — single-row JSONB cache (funnel_json, cohorts_json, dormancy_json, atrisk_json); admin-read RLS
- Cron job 40 (`cc-retention-hourly`, `:15 * * * *`)
- **Sidebar restructured:** Insights section now has 5 entries — Overview & Members (usage), Retention (live), Activity Depth, Wellbeing, Platform & UX (last 3 as coming-soon stubs)
- **Router:** retention/activity/wellbeing/platform all added to no-cache slugs

### Cache data (first build, 2026-06-09)
- 33 real members · 20 ever active (61%) · 13 never active · avg 411h (~17 days) to first activity
- Dormancy: 15 active · 2 quiet · 3 inactive · 13 never
- 5 monthly cohorts (Dec 2025–Jun 2026) · 16 at-risk entries

### Key insight from first data
Average time to first activity is 17 days — almost certainly because many members are trial/BT/Sage contacts who got added without paying. The never-active problem is structural, not engagement. Worth flagging to Lewis.

### Retention page sections
1. Headline strip: total, ever active, active 7d, avg time to first, at-risk, never active
2. Activation funnel: signup → onboarding → PWA installed → first activity → active week 1 → active last 30d
3. Dormancy breakdown: active / quiet / inactive / never (4-cell grid)
4. Cohort retention table: monthly cohorts × week1/week2/month1/month2/still-active with heatmap colouring
5. At-risk members table: name, persona, joined, last active, total acts, 7d acts, trend (▲/▼/=), flags

### Next pages to build
- Activity Depth (`activity.html`) — feature adoption, watch-time leaderboard, time-of-day heatmap
- Wellbeing (`wellbeing.html`) — score trajectory vs baselines, mood pulse, 8-dimension radar
- Platform & UX (`platform.html`) — PostHog pages, rage clicks, paths
- Enterprise (`enterprise.html`) — team breakdown, Sage-ready

## PM-579 — Fix ACT_ICONS scope + sessions in platform_metrics_daily (2026-06-09)

- `platform_metrics_daily.sessions_count` was 0 for all dates because the cron ran before the PM-575 backfill. Fixed by running `recompute_platform_metrics()` for all dates with session/replay entries in `member_activity_log` (~51 dates).
- `ACT_ICONS`/`ACT_LABELS` moved to `window.VYVE_ACT_ICONS`/`VYVE_ACT_LABELS` globals at top of usage.js — survives router replaceChild re-injection and browser caching edge cases.
- Leftover `const score/scoreCls` removed from `usageOpen360` (syntax noise from patching).
- Modal title now shows "First Last" instead of email.
- cc_usage cache rebuilt.

## PM-578 — Fix ACT_ICONS scope + sessions in week-on-week (2026-06-09)

- **ACT_ICONS/usageFmtMeta not defined:** `const` declarations for `ACT_ICONS` and `ACT_LABELS` never landed in PM-577 (string replacement missed). `usageFmtMeta` also missing. Fixed by inlining both as `var` inside `usageLoadMemberLog` — avoids const hoisting/scope issues with router replaceChild entirely.
- **Sessions 0 in week-on-week:** `platform_metrics_daily` rows for 4–9 Jun were computed before the PM-575 backfill landed session/replay entries in `member_activity_log`. `recompute_platform_metrics` reads from `member_activity_log` so historical rows had no sessions. Fixed by running `backfill_platform_metrics(10)` — sessions now showing (4 Jun: 2, 5 Jun: 3, 6 Jun: 1, etc.).
- Cache rebuilt.

## PM-577 — Usage: names + sort persist + activity log detail + tracker REST fix (2026-06-09)

### What shipped
- `members.first_name` + `last_name` added to cc-usage EF enrichment and `members_json` cache
- Members table: displays "First Last" with email below; initials avatar uses name initials
- Column sort state persisted to `localStorage` (`vyve_cc_usage_sort`) — survives page reload
- Member column now sorts by `last_name`; all other headers unchanged
- **Member detail view:** clicking a row fetches `action: member_detail` from cc-usage EF; renders full activity log timeline (last 60 entries) grouped by date with type icons, labels, metadata (duration, distance, watch%, scores)
- **Tracker REST fix (PM-577):** player-tracker.js + replay-tracker.js now POST directly to `/rest/v1/member_activity_log` on first qualifying write (bypasses log-activity CAPS which has no replay type); `member_activity_log` RLS updated with member-self-insert + admin-read + member-self-read policies
- `cc-usage` EF → v5
- vbb 451 | sw: pm577-tracker-fix

### Replay test account clarification
- Test account replays visible: uncheck "Exclude test" in Members tab
- Overview chart uses `platform_metrics_daily` (02:15 UTC rebuild) — today's activity shows tomorrow; "today" column reads live from `member_activity_daily`

## PM-576 — GDPR-safe send_never_active: suppression check + unsubscribe link (2026-06-09)

- `cc-usage` EF → v4: `sendNeverActive()` now checks `engagement_emails.suppressed = true` before sending; suppressed members are skipped and returned in `skipped_suppressed[]`
- Unsubscribe link added to email footer (routes to settings.html#notifications)
- Sent emails recorded in `engagement_emails` table (stream: `never_active`, key: `never_active_manual`) so open/click tracking and suppression works
- jordz279@hotmail.com and kieranday97@gmail.com have existing suppressed=true rows — will be skipped automatically

## PM-575 — Fix session/replay activity log pipeline (2026-06-09)

### Root cause
`player-tracker.js` and `replay-tracker.js` write to `session_live_views` / `replay_video_views` but never called `log-activity` EF, so sessions/replays never landed in `member_activity_log` → never rolled up into `member_activity_daily` or `member_stats`. Sessions stopped at 25 May when old tracker was retired; replays never worked at all.

### What shipped
- **Backfill:** 2 `session_live_views` + 6 `replay_video_views` rows inserted into `member_activity_log` (idempotent, deduped on source_id)
- `rebuild_member_activity_daily_incremental()` run — sessions/replays now visible in rollup (65 session rows back to Mar 2026, 8 replay rows Jun 2026)
- `recompute_all_member_stats()` run — `member_stats` updated (39 rows)
- `cc_usage` cache rebuilt
- **`player-tracker.js`** (PM-575): on first write (`isInsert=true`) for `live` and `replay` modes, fire-and-forget `POST /functions/v1/log-activity` with `{type:'session_views'/'replay_views', activity_date}`. JWT from `session.cachedJwt`.
- **`replay-tracker.js`** (PM-575): same injection on `isInsert=true`.
- vbb bumped to 450. sw.js: `vyve-cache-v2026-06-09-pm575-session-replay-fix`

### §23.XXX — new hard rule
**§23.107:** When adding new watch-time/view tables (`session_live_views`, `replay_video_views`, or future equivalents), always wire a `log-activity` call from the tracker on first qualifying write. The rollup pipeline (`rebuild_member_activity_daily_incremental`) only reads from `member_activity_log` — any tracker that writes directly to a separate table without also calling `log-activity` will be silently invisible in all rollups, `member_stats`, dashboards, and achievements.

## PM-574 — Usage Analytics: today column + email never-active (2026-06-09)

- **Today column** added to Members table — live fetch from `member_activity_daily` on page load (not from cache), highlights in green when > 0
- **Email never-active modal** — "✉ Email never-active" button in Members filter bar; shows list of members with 0 total activities, confirms before send; respects exclude-test toggle
- `cc-usage` EF → v3: `send_never_active` action — persona-voiced re-engagement email per recipient, sent directly via Brevo, tagged `never-active-reengage`; admin JWT required for send action; cron cache rebuild unchanged
- Paige Coult confirmed: last activity genuinely 21 April (49d ago), `member_stats` is correct

## PM-573 — Recent-window review + brain currency fixes; Android 1.0.6 live; front re-fixed (2026-06-09)

Completed the changelog-window review Dean asked for (recovered archive PM-433→553a). Most of the window was already in the living brain; five drift/gap items fixed plus a front repair.

### Fixes
- **§3 business model** reconciled: 30-day free trial → £10/mo-forever conversion (VYVE10, separate Stripe link from the £20 new-signup link), access gated on `subscription_status` per §23.85. Conversion **LIVE end-to-end** (Stripe webhook secret set — Dean confirmed). New §3 row.
- **wellbeing-checkin EF** v22 → **v30** (PM-516 enriched debrief + structured output) in §7 inventory.
- **workout-plan-wizard.html** (PM-532 no-plan questionnaire) added to §8 (Body—Workouts).
- **Light-mode 46-page pass** (PM-494→508) recorded on the theme line.
- **Android 1.0.6 APPROVED + live** (Dean confirmed 9 Jun): both platforms bundled. §5/§23.4/§23.106 updated — OTA gap now COHORT-WIDE, not iOS-only. Only Dean's dev-loop iPhone stays on server.url.
- **CURRENT FRONT re-fixed:** the PM-571/572 closes had rewritten the front from a stale template, reverting the PM-569 deployment-flip line and re-adding the `session-reminder-cron` WARN that PM-568 cleared. Rewritten to lead with standing deployment facts + correct WARN set.

### New rule
- **§23.107 (HARD RULE):** never regenerate the shared CURRENT FRONT block from an in-context template — re-fetch fresh + edit surgically; standing facts owned by §5/§23, front only mirrors.

### Parallel-session churn
Heavy today: rebased four times. PM-568 (cron) → PM-545971 enterprise-bridge → PM-571 (usage v1) → PM-572 (is_test) all committed during this session; I claimed PM-569 (flip), PM-570 (changelog archive), PM-573 (this). Fresh-HEAD guard caught every collision — no clobbers on my side. (The front clobber that earned §23.107 was theirs, fixed here.)

### No code shipped
- Brain only.

### Open
- Verify ONE Capawesome OTA end-to-end (now cohort-wide blocker; pre-Sage gate, §23.106).
- Exec brief for Lewis + Alan updated (Android live + trial model): `VYVE_Platform_Update_2026-06-09.md`.

## PM-572 — Usage Analytics: is_test cohort filter (2026-06-09)

- `members.is_test BOOLEAN DEFAULT false` column added; 6 test accounts backfilled (`@test.com`)
- `cc-usage` EF → v2: `is_test` included in members enrichment
- `assets/usage.js`: `usageFilterMembers()` defaults to excluding test accounts (checkbox checked by default)
- `pages/usage.html`: "Exclude test" checkbox wired to filter
- Cache rebuilt — `members_json` now carries `is_test` field

## PM-571 — Usage Analytics v1: Overview + Members tabs (2026-06-09)

### What shipped
- `pages/usage.html` + `assets/usage.js` — Usage Analytics page at `admin.vyvehealth.co.uk/#/usage`
- `cc-usage` Edge Function v1 (`verify_jwt:false`, service-role, admin-gate) — hourly cron job 39 (`cc-usage-hourly`, `:30 * * * *`)
- `cc_usage` table — single-row JSONB cache mirroring `cc_app_health` pattern (id=1, seeded)
- Admin-read RLS policies added on: `cc_usage`, `member_stats`, `company_summary`, `member_activity_daily`
- Member-self-read RLS policies added on: `member_stats`, `member_activity_daily` (portal safety)
- Sidebar `assets/sidebar-config.js`: new **Insights** section with `usage` slug + `VYVE_NAV_TOP` Insights entry
- Router `lib/router.js`: `usage` slug added to no-cache list (same treatment as `app-health`)
- First cache built and verified: 38 member rows, 3 companies, 30-day daily series, headline 34 members / 15 active 7d

### Phase 1 scope (what's live)
- Headline strip: total members, active 7d/30d, DAU/MAU stickiness, activities 7d, at-risk count
- **Overview tab:** 30-day daily bar chart, activity breakdown by type (7d), week-on-week delta table, company breakdown
- **Members tab:** sortable table (email, engagement score ring, 7d/30d acts, active days, last active, programme, persona, status pill), search + filter (at-risk/needs-support/active/inactive), pagination (25/page)
- **Member 360 drill-down modal:** profile (persona, programme, programme week, at-risk/support flags, certs), engagement score with component bars, activity totals grid (total/7d/30d/90d/active-days/distinct-types), latest signals (wellbeing/stress/energy/weight)
- Data sources: `platform_metrics_daily` (headline + daily series, ~1 day behind), `member_activity_daily` (replays + DAU augment), `member_stats` (member list), `company_summary` (enterprise tab), `members` (persona/company enrichment)

### Open items (Phase 2+)
- `is_test` flag: open decision — Dean to confirm test/admin email list, then 1-column migration + backfill (blocks meaningful cohort filter)
- Phase 2: Activity depth tab (exercise_logs volume, cardio depth, time-of-day heatmap), Sessions/watch-time tab
- Phase 3: Wellbeing trends, Achievements, Retention cohorts
- Phase 4: Pages & UX (PostHog), Enterprise tab

## PM-571 — Capawesome OTA gap diagnosed (no sync/ready in shell); Dean's dev-phone restored to server.url loop; SPM xcodeproj gotcha (2026-06-09)

Follow-on to PM-569. Got Dean's iPhone back onto the server.url dev-loop (he'd installed bundled 1.7 from the App Store and lost live changes), and pinned down *why* the Capawesome OTA has never run end-to-end.

### OTA diagnosis (sharpens §23.106 -> new §23.107)
- `@capawesome/capacitor-live-update@8.2.2` IS installed + native-linked (confirmed in `npx cap sync ios` plugin list, 17 plugins) and CONFIGURED in Mac-local `capacitor.config.json`: `plugins.LiveUpdate = { appId: "f9961f66-eb66-4102-b1c5-f9b2c7baeebf", autoDeleteBundles: true, publicKey: "" }`.
- BUT there are NO `LiveUpdate.sync()` / `LiveUpdate.ready()` calls ANYWHERE in the vyve-site web shell — swept app.js/boot.js/init.js/auth.js/nav.js/sw.js/index.html/settings.html + org code search = 0 hits (only an unrelated "live-update" comment in personal-bests.html). The plugin does not auto-sync; without `sync()` nothing fetches, without `ready()` an applied bundle rolls back.
- Consequence: the rails are physically in 1.7 but the switch was never flipped. **1.7 CANNOT receive an OTA.** The fix is JS-only but gated on a NEW bundled binary: wire `sync()` on launch + `ready()` after first paint + channel `89e12796`, native-guarded, into the shell -> ship 1.8 -> only then can a bundle push land. The §23.106 canary therefore targets 1.8, not 1.7.
- Not ruled out: a native auto-sync in vyve-capacitor `AppDelegate.swift` (not checked) — but config has no autoUpdate flag and Capawesome doesn't auto-sync without the JS calls, so near-certain.

### Dean's dev phone
- Restored `server` block to Mac-local `capacitor.config.json` (`server.url = https://online.vyvehealth.co.uk`, cleartext false), kept LiveUpdate block intact (dormant under server.url). `npx cap sync ios` -> ran to device from Xcode -> confirmed back on the live loop. Live HEAD was vbb 447/PM-563 at session time; vyve-site has since advanced to PM-565 via a parallel session.
- DISCIPLINE: that `server` block is DEV-ONLY on Mac-local — strip it before the next store binary or 1.8 ships in server.url mode and breaks the bundled migration.

### SPM gotcha (new §23.108)
- vyve-capacitor is an SPM-based Capacitor project (`Package.swift`; "not compatible with SPM" warns) — there is NO `App.xcworkspace`. Open `ios/App/App.xcodeproj` directly. `open ...App.xcworkspace` fails "does not exist".

### No code shipped
- Diagnosis + brain only. No vyve-site / EF / vyve-capacitor commits. Mac-local config edit is uncommitted (dev-loop, intentional).

## PM-570 — Changelog history recovered into changelog-archive.md (2026-06-09)

The PM-554 consolidation (7 Jun) trimmed changelog.md from 504 entries (~2.96MB, back to 22 Apr) down to PM-554 onward, but master §19 still pointed at changelog.md for older detail — a stale/false pointer. Recovered the full pre-PM-554 history from git commit `5deea4fd` into new `brain/changelog-archive.md` (504 entries, 22 Apr — 7 Jun / PM-553a). changelog.md unchanged below (still PM-554—569). §19 pointer corrected to reference the archive for pre-PM-554. Nothing was lost — git retained every version; this relocates it to where the pointer claims it lives.

## PM-569 — iOS 1.7 live + deployment model flipped to bundled; brain consolidation + exec brief (2026-06-09)

### Context
Brain-consolidation session (ran parallel to the PM-568 cron-fix session; rebased onto its commit 9ca8b9c3). Trigger: Apple approved iOS 1.7 → it is now LIVE; the whole iOS member cohort sees a bundled build while Dean alone is on the server.url live shell. Reconciled against the brain, which (PM-475, 4 Jun) still asserted the opposite — "whole cohort server.url-live, no frozen bundle." That correction is now itself wrong and has been reverted.

### iOS train (clarified with Dean)
- 1.5 = first genuinely bundled submit (server.url removed) — PM-557, 7 Jun, was in review.
- 1.6 submitted then CANCELLED.
- Went straight to 1.7 — now APPROVED + LIVE on the App Store.
- 1.7 ships server.url removed → iOS members frozen on the vyve-site SHA baked into the binary.

### Android
- Bundled 1.0.6 versionCode 51 submitted ~5-6 Jun (PM-557), approval UNCONFIRMED, still in review as of 9 Jun (Dean to recheck Play Console).
- Prior live Android build is still a server.url build → Android members remain on the live shell until 1.0.6 lands.

### Deployment model — now live (reverts PM-475)
- iOS members: FROZEN on bundled 1.7, updatable ONLY via Capawesome OTA (app f9961f66 / prod channel 89e12796).
- Capawesome OTA has NEVER run end-to-end → iOS members currently have NO working update path short of a full App Store resubmit (days/cycle).
- Dean: server.url dev-loop on his iPhone → sees every vyve-site commit live (2-15min WKWebView cache).
- Net: a vyve-site commit reaches Dean + Android members, NOT iOS members. Settings vbb-marker verifies Dean's view only.

### vyve-capacitor remote drift
- Remote latest commit is PM-560 (splash). The 1.5/1.6/1.7 bundle ship-state lives only on Dean's Mac local, uncommitted. Curate + atomic-commit Mac-local → remote per PM-413 Pending #2.

### Brain edits applied this session
- CURRENT FRONT: surgical merge onto the PM-568 front (kept their cron-fix lines + cleared WARN) — replaced the stale "1.5 in review" line with the deployment-flip block + §23.106.
- §5 native app delivery row rewritten to the flipped model.
- §23.4 — PM-475 correction reverted; original bundled-split is the live truth again for iOS.
- §23.92 — flagged now load-bearing (iOS bundled).
- §19 — new entry (this PM).
- §23.106 (NEW HARD RULE) — bundled iOS cohort has no proven delivery channel; verified Capawesome OTA is the gating capability before Sage and before any member-facing iOS fix.
- backlog — capacitor.config.json doctrine marked RESOLVED (bundled chosen, shipped); OTA verification elevated to P0 native priority.

### Deliverable
- Exec brief for Lewis + Alan: `/mnt/user-data/outputs/VYVE_Platform_Update_2026-06-09.md`. NOT committed to repo — handed to Dean to share.

### No code shipped
- Consolidation + brain only. No vyve-site / EF / migration changes.

### Open / next
- Dean: confirm Android 1.0.6 approval state in Play Console → update brief's pending line + §5.
- Prove + verify ONE Capawesome OTA end-to-end (TOP native priority, pre-Sage gate).
- §23.105 (PM-568 cron-fix rule) has a changelog body but no §23 rule body in master.md — PM-568 session to back-fill.
- Changelog history: changelog.md only reaches back to PM-554 (07 Jun) — confirm whether late-May entries were trimmed at PM-554 or need recovery from an archive.
- Carried WARNs: posthog-test EF delete, server-side HK sync dead since 24 May, App Store Connect API key. (session-reminder-cron resolved by PM-568.)

## PM-568 — Fix: 9 cron jobs broken by null app.service_role_key (2026-06-09)

### Root cause
9 cron jobs used `current_setting('app.service_role_key', true)` string-concatenated into a JSON header literal. `app.service_role_key` was null (never set, or cleared at some point). The `::jsonb` cast on `session-reminder-cron` and `process-scheduled-pushes` threw `invalid input syntax for type json` on every tick. Other jobs using `jsonb_build_object` silently sent `Bearer ` (empty token) — EF auth rejected but no cron-level error.

### Fix
Rewrote all 9 cron job commands via `cron.alter_job()` to embed the service_role JWT literal directly inside `jsonb_build_object(...)`. Eliminates `current_setting()` dependency entirely — cleaner and not fragile to database-level config changes.

**Jobs fixed:**
`session-reminder-cron`, `process-scheduled-pushes`, `habit-reminder-daily`, `streak-reminder-daily`, `vyve-achievements-sweep-daily`, `vyve-alert-digest-morning`, `vyve-alert-digest-afternoon`, `vyve-alert-digest-evening`, `vyve-seed-weekly-goals`

### Verification
`session-reminder-cron` 20:40 UTC tick: `succeeded`. First clean run confirmed.
`process-scheduled-pushes` also `succeeded` at same tick.

### §23 rule
- **§23.105 (NEW):** Never use `current_setting('app.*', true)` in cron job commands for auth headers. The setting is null by default and `ALTER DATABASE` is blocked on Supabase Pro. Embed the JWT literal directly in `jsonb_build_object()` instead. If the key ever needs rotating, update cron job commands via `cron.alter_job()` — 9 jobs, one SQL block.

## Enterprise-readiness bridge session — documentation pack + consent schema + GDPR cron fix (2026-06-09)

### What shipped

**Documentation pack (6 documents):**
- `01_ropa_and_data_flow.md` — ROPA covering 8 processing activities with lawful bases (Art 6 + Art 9), data flow diagram, subprocessor calls. Delivered to outputs.
- `02_disaster_recovery_note.md` — DR/BCP note: RTO 4h / RPO 24h, named owner (Dean Brown), restore procedures for all 5 key scenarios, open actions before Sage pilot.
- `03_subprocessor_register.md` — 10-processor register (Supabase, Anthropic, Brevo, Stripe, PostHog, HubSpot, Apple, YouTube, Capawesome, Riverside) with DPA status and required actions.
- `04_how_we_handle_your_data.md` — External 2-page plain-language summary for procurement reviewers / employees.
- `05_security_questionnaire_updated.md` — Updated security questionnaire committed to `brain/security_questionnaire.md`. Updated from May 2026 to reflect: §23.104 audit clean (June 2026), 120 RLS tables, SECURITY DEFINER audit results, iOS 1.5/Android 1.0.6 in review, RLS cross-account test results, GDPR pipelines live.
- `06_consent_work.md` — Consent and transparency work: HealthKit disclosure copy (DRAFT, Phil + Lewis sign-off needed), privacy notice additions required (Art 6/9 lawful bases, PostHog session recording, data retention table), re-consent prompt spec, `privacy_employer_reporting` default decision brief, B2B employee consent model flag for DPA.

**Schema migration: `add_consent_version_columns`**
- Added `privacy_version TEXT` and `health_consent_version TEXT` to `members` table.
- Existing consented members stamped `'pre-versioning'` as sentinel. Non-consented members NULL.
- Column comments documenting intent added.
- Mirrors the existing `terms_version` versioning pattern.

**GDPR cron fix:**
- Jobs 21 (`vyve-gdpr-export-tick`) and 22 (`vyve-gdpr-erase-daily`): hardcoded bearer `dd536f57...` removed from `cron.job.command`.
- Finding: CRON_SECRET env var was not set on the EF, so the bearer was never validated — it was a visible artifact in pg_cron with no functional effect. Service-role client is the actual auth layer.
- Both jobs now call EFs with Content-Type only; EF security unchanged.

**RLS cross-account isolation test:**
- Impersonated member A (`calumdenham@gmail.com`) attempting to read member B (`deanonbrown@hotmail.com`) across 15 member-scoped tables.
- Result: zero rows visible on all 15 tables.
- Policy audit: all 15 tables confirmed `auth.email() = member_email` on both QUAL and WITH CHECK.

**Security questionnaire updated in `brain/security_questionnaire.md`** — reflects current live state (June 2026 audit, 120 tables, iOS/Android store status).

### Open decisions (not resolved this session — awaiting Dean/Lewis input)

1. **`privacy_employer_reporting` default** — keep `true` (LI basis, defensible) vs flip to `false` (explicit opt-in, safer for Sage procurement). Decision brief in `06_consent_work.md` §4.
2. **PostHog session recording** — Option A (LI basis + opt-out disclosure in privacy notice) vs Option B (explicit consent capture). Note: opt-out mechanism not yet built; don't publish privacy notice addition until it is.

### APNs key rotation (Dean's action items — not built this session)

Dean to action before Sage diligence (walk-through to be done as a dedicated focus):
1. Revoke the non-production APNs key in Apple Developer portal to free a slot (Apple's 2-keys-per-team cap)
2. Register new key
3. Update 5 Supabase secrets with new key values
4. Verify push delivery
5. Revoke old exposed key (KEY_ID `2MWXR57BU4`)

### Reminders for Dean

- Enable PITR on Supabase project (Dashboard > Billing > Add-ons) — reduces RPO from 24h to minutes, documented in DR note as open action.
- Store Android keystore (`vyve-release-key.jks`) + password in 1Password — flagged P0 in DR note.

### §23 rules (none earned — all work was data/config/docs, no novel architectural patterns)

## PM-567 — Security Tier 2c/2d: search_path + ai_decisions policy + final audit clean (2026-06-09)

### What changed

**search_path pin (Tier 2c):**
- Only ONE function was missing it: `watchdog_cron_failures`. All others already had `SET search_path TO 'public'` in place.
- Pinned to `public, cron, pg_temp` (must include `cron` schema — queries `cron.job` + `cron.job_run_details`).
- ACL also locked to service_role only in same migration.
- Smoke-tested: function executes and returns real results.
- Side-finding: `session-reminder-cron` failing every 5min with JSON construction error — `current_setting('app.service_role_key')` string-concatenated into JSON breaks with `sb_secret_*` key format. §23.7 class bug, separate fix needed.

**`exercise_canonical_set` view:** confirmed non-issue. `reloptions` null = Postgres default (security_invoker=false). Underlying tables are public-read anyway, no privilege escalation possible.

**`ai_decisions` INSERT policy (Tier 2d):**
- Old: `service_insert_decisions` — INSERT for `{public}` with `WITH CHECK (true)` — any authenticated member could insert decision rows attributed to any email.
- New: `service_insert_decisions_v2` — INSERT for `{service_role}` only. EFs write this table, members only read their own rows via `member_own_decisions` SELECT policy (unchanged).

**Storage buckets (`certificates`, `member-avatars`):** confirmed already correct. SELECT is public (intentional — certs downloaded, avatars displayed). Write ops are correctly scoped to own email. No changes needed.

**`running_plan_cache`:** shared parametric cache — no member_email column to scope against by design. Park.

### Final §23.104 audit result
**ZERO violations** (excluding deliberate exception `resolve_trial_campaign` — public for onboarding unauthenticated campaign lookup).

All SECURITY DEFINER functions: service_role only, or authenticated+service_role for the 4 legitimate member-facing ones (is_admin, refresh_member_home_state, queue_health_write_back, compute_engagement_components_v2).

### Complete security session summary (PM-564 → PM-567)
Starting: 50+ SECURITY DEFINER functions open to anon/public including 2 CRITICALs.
Ending: §23.104 audit fully clean. Zero open violations.
- PM-564 Tier 0+1: 21 functions locked including both CRITICALs
- PM-565 Tier 2a: authenticated IDOR self-scoped on 2 home-state/engagement fns
- PM-566 Tier 2b: 31 more locked including P0 vault/GDPR exposure
- PM-567 Tier 2c/2d: search_path pinned, ai_decisions INSERT locked, full audit clean

## PM-566 — Security Tier 2b: P0 vault exposure + remaining callable functions locked (2026-06-09)

### What changed
31 more SECURITY DEFINER functions revoked. No vyve-site changes. No member impact.

**P0 CRITICAL — now closed:**
- `read_vault_secret(text)` — any authenticated member could pull any Vault secret by name (Anthropic key, YouTube OAuth, PostHog key, all of it)
- `get_youtube_oauth_secrets()` — literally returned YouTube client_id + secret + refresh_token to any authenticated caller
- `gdpr_erase_purge_subject(text)` — any authenticated member could erase any other member's data

**HIGH — now closed:**
- `gdpr_export_pick_due()`, `refresh_member_home_state_v1_internal()`, `refresh_member_home_state_if_dirty()`, `vyve_refresh_daily()`

**MEDIUM/cron — now closed:**
- `evaluate_plan_fit()`, `charity_total_reconcile_and_heal()`

**Trigger functions (cosmetic cleanup — PostgREST blocks these regardless):**
- `assert_member_not_expired`, `calendar_occurrences_set_updated_at`, `charity_count_*` (6), `increment_habit_counter`, `podcast_episodes_set_updated_at`, `set_daily_mood_updated_at`, `set_updated_at_checkin_questions`, `tg_mark_home_state_dirty_*` (5), `tg_refresh_home_state_from_members`, `tg_refresh_member_home_state`, `vyve_sync_activity_log`

### Final audit state
§23.104 audit returns zero violations except two deliberate exceptions:
- `resolve_trial_campaign` — intentionally public (onboarding needs unauthenticated campaign code lookup)
- `watchdog_cron_failures` — internal ops, low risk, park for next session

### Full session security summary (PM-564 → PM-566)
- Tier 0: 17 service-only functions locked (both original CRITICALs)
- Tier 1: anon door closed on 4 client-callable functions
- Tier 2a: authenticated IDOR closed on refresh_member_home_state + compute_engagement_components_v2
- Tier 2b: 31 more functions locked including 2 P0 vault exposure holes + gdpr_erase_purge_subject

## PM-565 — Security Tier 2a: IDOR self-scope on refresh_member_home_state + compute_engagement_components_v2 (2026-06-09)

### What changed
Two `SECURITY DEFINER` functions patched to self-scope authenticated callers.
Role-guard added as first statement in BEGIN: `IF auth.role() <> 'service_role' THEN p_email := auth.email(); END IF;`
service_role callers (all EFs, all cron jobs) bypass the guard — auth.email() is NULL under service_role so the bypass is mandatory.

**`refresh_member_home_state(p_email text)`** — authenticated callers now forced to own home state. Guard placed before `e := lower(trim(p_email))` normalisation so the scoped value flows through correctly.

**`compute_engagement_components_v2(p_member_email text)`** — authenticated callers now forced to own engagement data.

**`is_admin()` and `queue_health_write_back()`** — confirmed safe by construction (no email param / trigger function). No changes needed.

### Verification
- `pg_get_functiondef` confirms `auth.role() <> 'service_role'` guard present in both functions.
- Zero `permission denied` / `42501` / function-name hits in `platform_alerts` post-apply.

### Remaining Tier 2 work (next session)
- Pin `search_path = public, pg_temp` on ~40 flagged functions (branch-test first).
- Recreate `exercise_canonical_set` view as invoker security.
- Tighten `running_plan_cache` / `ai_decisions` RLS WITH CHECK to own rows.
- Restrict bucket listing on `certificates` + `member-avatars`.

## PM-564 — Security Tier 0 + Tier 1: EXECUTE grants locked down (2026-06-09)

### What changed
Two Supabase migrations applied. No vyve-site code changes. No member impact.

**Tier 0 — 17 service-only functions: PUBLIC + anon + authenticated all revoked. `postgres` + `service_role` only.**
- `convert_member_to_paid` (CRITICAL — was callable by anyone unauthenticated)
- `gdpr_erasure_purge` (CRITICAL — same)
- `resolve_broadcast_audience`, `member_home_state_get_fresh`, `mark_member_lapsed` (HIGH)
- `expire_lapsed_trials`, `bump_charity_total`, `charity_total_reconcile`
- `get_certificate_buckets`, `get_certificate_buckets_for`, `get_charity_total`, `get_leaderboard`
- `apply_trial_campaign`, `grant_trial_on_signup`
- `drain_member_home_state_dirty`, `recompute_step_baselines`, `gdpr_erasure_pick_due`

**Tier 1 — 4 client-called functions: PUBLIC + anon revoked. `authenticated` + `service_role` retained.**
- `is_admin()` — Command Centre admin gating
- `refresh_member_home_state(text)` — connect.html + home-state-local.js
- `queue_health_write_back()` — healthbridge.js
- `compute_engagement_components_v2(text)` — home-state-local.js

### Verification
- Static call-path audit (remediation plan 2026-06-08): no vyve-site or vyve-command-centre client calls the Tier 0 set.
- `platform_alerts`: zero permission-denied hits on all target functions.
- `pg_stat_user_functions`: `track_functions=none` on Supabase Pro — call counters unavailable; static audit + alerts were the evidence layers.
- Post-migration ACL spot-check: all 21 functions confirmed correct. Zero `permission denied` / `42501` alerts in 10-minute observation window.

### MGMT_PAT status
`MGMT_PAT` not present in Vault (expired 6 Jun, not rotated). `backup-edge-functions.yml` GitHub Actions workflow silently broken. Dean to rotate: new Supabase Management API token → update Vault secret + GitHub Actions repo secret on VYVEBrain.

### Remaining security work (Tier 2 — next session)
- Self-scope the 4 client-callable functions (authenticated IDOR residual).
- Pin `search_path = public, pg_temp` on ~40 flagged functions.
- Recreate `exercise_canonical_set` view as invoker security.
- Tighten `running_plan_cache` / `ai_decisions` RLS policies.
- Restrict bucket listing on `certificates` + `member-avatars`.
- Branch-test all Tier 2 changes before prod.

### §23 rule
- **§23.104 (NEW):** Every `SECURITY DEFINER` function must `REVOKE EXECUTE FROM PUBLIC, anon, authenticated` unless deliberately member-callable. Member-callable ones must self-scope with service_role bypass.

## Employer Dashboard — projection toggle + colour preview shipped; parallel build reverted (2026-06-08)

### What shipped
- `Test-Site-Finalv3/vyve-dashboard-live-preview.html` (commit `3b2aa9e0`) — standalone preview of the employer dashboard. Adds a **Live / Projection** view toggle: Projection scales the live `employer-dashboard` EF response client-side to an adjustable headcount (default 10,000), holding rates (engagementRate, avgPerMember) constant while counts scale; amber "Illustrative projection — not real members" badge. Plus a light KPI colour lift (persistent gradient accents + amber/purple/pink variants on previously-plain cards). **Live `vyve-dashboard-live.html` left untouched.**

### Canonical employer system (confirmed — repo overrides memory)
- Data engine: deployed EF `employer-dashboard` (v41; source header says v20) — reads `members.company`, auth via `EMPLOYER_DASHBOARD_API_KEY` (x-api-key header / api_key param), CORS locked to https://www.vyvehealth.co.uk, in-memory rate limit 100/hr. Returns members{total,active,quiet,inactive,engagementRate} / activities / sessions{byCategory} / charity / trend. No wellbeing scores in this payload.
- Front-end: `Test-Site-Finalv3/vyve-dashboard-live.html` (live employer dashboard, www), plus `dashboard.html`, `employers.html`, `roi-calculator.html`.
- Company linkage is the `members.company` column (Sage, BT, Individual currently tagged) — NOT the `employer_members` table.

### Reverted / cleaned up (a parallel build was created before the canonical system was found)
- Dropped SQL RPC `public.employer_dashboard(text,int)`.
- Emptied `employer_members` (a 34-row "Northwind Group" demo seed was removed; table back to original empty state).
- Reverted the Employer Dashboard section out of `vyve-site/internal-dashboard/index.html` — vyve-site commit `ba12a486`, back to original 56,241 bytes.

### Open decisions
- Promote preview → live `vyve-dashboard-live.html`? (one commit when approved.)
- Should the projection toggle live on the real client-facing dashboard (real clients would see it) or only a separate demo page? Currently leaning: separate demo.

### Reference (for ROI if wired later)
- CIPD/Simplyhealth Health & Wellbeing at Work 2025: 9.4 sickness-absence days/employee/yr. Deloitte Mental Health & Employers 2024: £51bn UK cost, ~£1,900/employee, £4.70 return per £1 invested. A dedicated `roi-calculator.html` already exists.

### §23 rule
- §23.103 (NEW): Before building ANY employer/dashboard feature, run an org-wide code search across VYVEHealth first. The `employer-dashboard` EF, the Test-Site-Finalv3 employer pages, and the `members.company` model all already existed. Repo state overrides chat/memory — recon the full org before building, not just the obvious repo.

## PM-559 final state — App Health dashboard fully working (2026-06-08)

### Final fixes this session
- `assets/app-health.js` extracted from inline script (router injectPage replaceChild error)
- `lib/router.js` patched: skip `s.text` for external scripts; never cache app-health slug
- Missing comma in SYSTEM_CHECKS array fixed
- Admin RLS policies added: `platform_metrics_daily` + `certificates`
- System health panel: removed sync-health-data + log-perf (permanent red noise)
- 4 checks live: cc-app-health (green), daily-report (green), re-engagement (amber), certificate-checker (amber)
- Usage pagination 10/page working (1-10 of 61 pages)
- First-seen + last-seen on all error rows
- Drill-down modal + bulk resolve settled working
- Dead pages accurate, load times from perf_telemetry

### §23 rules
- §23.101 (NEW): CC router injectPage re-executes scripts via replaceChild — inline JS with template literals breaks. Always use external src JS files for CC pages with complex JS.
- §23.102 (NEW): After removing array items in JS, always run `node --check` before committing.

## PM-559 session close — App Health dashboard v1 shipped (2026-06-08)

### What shipped
- `cc_app_health` migration — single-row cache, RLS admin-read + service-role-write. pg_cron hourly.
- `cc-app-health` EF v4 — PostHog usage (100-page limit, slash-normalised dead pages), perf_telemetry LCP, platform_metrics_daily headlines. POSTHOG_API_KEY now in vault.
- `pages/app-health.html` in vyve-command-centre — live errors ranked by blast radius, at-a-glance strip, page usage, dead pages, load times, drill-down modal on every error row, bulk resolve settled, text alerts placeholder.
- `assets/sidebar-config.js` — app-health slug in Delivery section.
- CC commits: `7ab3e7af`, `7ba10f40`, `49b90b5`, `bf8c312b`, `49b90b5d`.

### Key state
- Page fully working: 0 active errors, 14 active members 7d, page usage + dead pages accurate, load times from perf_telemetry.
- POSTHOG_API_KEY in Supabase vault (added this session).
- 158 unresolved alerts — bulk resolve button on settled section when ready to triage.
- perf.js stopped collecting after 13 May — load times data is stale. Fix perf.js in a future session.
- App Health in Delivery nav — working via router slug.

### §23 rules
- §23.99 (NEW): POSTHOG_API_KEY must be in Supabase vault for cc-app-health EF to populate usage/perf. Key: query:read scope only.
- §23.100 (NEW): cc-app-health EF can only be triggered from Composio workbench (urllib), not bash_tool curl — sandbox blocks *.supabase.co per §23.86.

## PM-559 — Command Centre App Health: PostHog API wired + dashboard spec (2026-06-08)

Talk-first / spec-only session (Dean: Sonnet builds, Claude specs). No vyve-site or member-app code shipped.

### What happened
- Reviewed Lewis's existing Command Centre (`vyve-command-centre` repo): mature ~45-page SPA with real lib layer (router/ACL/comments/audit), BUT runs almost entirely on **localStorage**. `cc-adapter.js` (localStorage<->`cc_*`) exists but is FLAGGED OFF.
- Verified live: **all 19 `cc_*` tables are EMPTY (0 rows)**, incl `cc_tasks`. Seed data is in `assets/seed-data.js`; any real data Lewis entered lives only in his browser localStorage. No DB data to migrate/protect.
- Decision: do NOT rebuild the shell. Keep the bones, move data layer off localStorage onto Supabase + Storage, lead with App Health (its data already exists -> immediate value, vs Tasks which needs adoption first).

### PostHog connection — WIRED & VERIFIED
- Confirmed PostHog is live and receiving: 22,187 events / 25 people last 7d. `analytics.js` (PM-408) working.
- **Corrected a brain assumption:** `perf_telemetry` Supabase table looked dead (last row 13 May) — NOT lost; perf rerouted into PostHog as `perf_*` events at PM-408. Load times live in PostHog now.
- Dean created a PostHog Personal API key (Query:Read), stored as Edge Function secret **`POSTHOG_API_KEY`** (EF secrets, the correct home; `Deno.env.get`).
- Query API confirmed: `POST https://eu.posthog.com/api/projects/138491/query/`, Bearer key, HogQLQuery body. Project `138491`, EU.
- Real event names captured: `portal_page_viewed` (use for usage, not `$pageview`), `perf_first_paint`/`perf_navigation_timings`/`perf_auth_ready`/`perf_cross_nav` (load times), `dexie_open_failed` (the §23.83 IDB bug also in PostHog). Page property `properties.page` = clean `/x.html` paths.

### `platform_alerts` reality
- 2,846 rows, **`resolved=false` on every one** — written but never triaged. Triaged/resolvable view = genuine value PostHog can't give.
- ~1,970 `info` (noise), 481 `high`, 395 `critical`. `network_error_*` criticals STOPPED ~16 May (fixed-but-uncleared); `js_error`/`promise_rejection` STILL firing today. -> spec ranks by member-impact + live-vs-settled, not severity label.

### Deliverable
- Build-ready spec: App Health dashboard (errors-first ranked by members-hit-now; usage; dead pages; load times; VYVE light+dark; reviewer-only via `is_admin()`; SMS placeholder). At `/mnt/user-data/outputs/app-health-build-spec.md` (not in repo). Handed to Sonnet build session.
- SMS/text alerts parked — needs Twilio; spec leaves a labelled placeholder.

### Cleanup owed
- Throwaway EF `posthog-test` left ACTIVE-but-retired in Supabase (used to verify the connection). Delete via dashboard.

## PM-558 — GITHUB_PAT_CLAUDE rotated in Supabase Vault (2026-06-07)

- Old `vyve-cto-claude` PAT (expiring 20 Jun 2026) replaced with new token.
- Vault updated via `vault.update_secret()`. Edge Function secrets GITHUB_PAT + GITHUB_PAT_BRAIN also updated by Dean.
- New PAT verified working against VYVEBrain repo.

## PM-557 session close — bundled iOS 1.5 + Android 1.0.6 submitted; portal removals (2026-06-07)

### Portal (vyve-site)
- **PM-555** `9dc40fb0` vbb 442 — nutrition.html: food log coming-soon removed. connect.html: this week's challenge section removed.
- **PM-556** `a2c8501d` vbb 443 — session-live.css: `.sl-pill-live` + `.sl-cta-primary.sl-cta-live` switched red→green (#22c55e).

### Native apps
- **iOS 1.5 Build 1** — bundled mode (server.url removed from capacitor.config.json). Fresh vyve-site clone into www via PAT. Archived + exported via xcodebuild CLI. Uploaded via Xcode Organizer. In review.
- **Android 1.0.6 versionCode 51** — fresh vyve-site clone into www. Built via `./gradlew bundleRelease` with Java 21 (temurin@21). AAB at `android/app/build/outputs/bundle/release/app-release.aab`. Submitted to Play Console. Quick checks running → Send for review pending.

### Key state
- All members still on server.url live web shell until 1.5 approved + installed by members
- Capawesome: app `f9961f66`, prod channel `89e12796` — ready for first OTA
- www folder workflow: `git clone --depth 1 https://VYVEHealth:<PAT>@github.com/VYVEHealth/vyve-site.git www` before every bundle build
- Java 21 (temurin@21) required for Android CLI builds; `export JAVA_HOME=$(/usr/libexec/java_home -v 21)` before gradlew
- App Store Connect API key setup pending next session (saves Organizer step forever)
- GITHUB_PAT_CLAUDE expires 20 June 2026 — rotate urgently

### §23 rules
- §23.94 (NEW): Every Android CLI bundle build requires `export JAVA_HOME=$(/usr/libexec/java_home -v 21)` before `./gradlew bundleRelease`. Java 21 = temurin@21 installed via brew. Java 17/26 both fail.
- §23.95 (NEW): www folder is NOT auto-synced from GitHub. Before every bundle build: `rm -rf www && git clone --depth 1 https://VYVEHealth:<GITHUB_PAT_CLAUDE>@github.com/VYVEHealth/vyve-site.git www` (PAT from Supabase Vault). Never assume www is current.

## PM-554 session close — PF-23 v1 stabilised + per-page tours shipped (2026-06-07)

### Final state
- **firstrun.js** reverted to last working version (e2be18d4) + VYVE logo on slides only. No other changes.
- **Per-page independent tours** live on index, mind, exercise, connect, wellbeing-checkin, monthly-checkin.
- **achievements.js** — toasts suppressed during home tour; retry 3s after `vyve_seen_home` set.
- **settings.html** — Reset tour clears all 8 localStorage keys + writes `tour_completed_at: null` to server + Dexie + navigates to index.html.
- **10s auto-release safety timer** on `lockBody()` — page can never be permanently frozen.
- **No early lock scripts** — all removed. Body lock is JS-only inside firstrun.js.

### Gates (simple)
- `vyve_firstrun_done` — full tour done, nothing ever shows again
- `vyve_firstrun_slides_done` — intro slides seen
- `vyve_seen_home/mind/body/connect/checkin/monthly` — per-page tour seen

### vyve-site HEAD: commit `a48a417b`, vbb 439

### §23 rules
- §23.97: Achievement toasts must not fire while `vyve_seen_home` is unset. `showNext()` is the single chokepoint.
- §23.98: firstrun.js lockBody() must always have a 10s auto-release timer. Never lock without it.

## PM-554 stabilisation — first-run tour fixed to 4-step home-only (2026-06-07)

Multiple fix commits (fix2–fix8) through session. Root causes resolved:
- **fix5:** `_started` guard + single `vyveAuthReady` trigger prevented double-init race between 1500ms setTimeout and auth event.
- **fix6:** sessions.html was retired (PM-555 redirect) — tour destination corrected to connect-calendar.html.
- **fix8 (final):** Eliminated all cross-page hops entirely. Tour is now 4 steps, all on index.html — mood, focus, habits, rings. No resume cursor, no page navigation, no race conditions. Completes reliably and sets `vyve_firstrun_done` on Done.

**Final state:** intro slides (4) + home spotlight (4 steps). Copy is DRAFT in `COPY` object top of firstrun.js — Lewis edits in place.
**vyve-site commit `a47b5f84`, vbb 431, cache `vyve-cache-v2026-06-07-pm554-fr-homeonly`.**

## PM-554 — PF-23 v1 first-run experience shipped (2026-06-07)

### What shipped
- **`firstrun.js`** — full first-run engine: 4 swipeable intro slides (Part 1) + 7-step in-context spotlight tour (Part 2). Gate: `localStorage.vyve_firstrun_done` short-circuit → Dexie members row `tour_completed_at` check (~800ms cold-boot wait) → run. Resume cursor (`vyve_tour_active` + `vyve_tour_step`) persists across the two page hops (index→mind, mind→sessions). Dismissal (skip or done): sets `vyve_firstrun_done=1`, clears cursor, fires un-awaited `members.update({tour_completed_at})` via member-scoped RLS (§23.31). All copy in a single `COPY` object at top of file — Lewis edits that, never the logic.
- **`firstrun.css`** — scrim + box-shadow cutout overlay + tooltip card + slide dot strip + safe-area insets (§23.58) + web-tells suppression (§23.59). z-index 10000–10002 (above nav 9000).
- **`index.html`, `mind.html`, `sessions.html`** — load `firstrun.css` + `firstrun.js`. Haptics.js confirmed present on all three (§23.44). mind/sessions inert unless tour active.
- **`settings.html`** — vbb-marker bumped to 424.
- **`sw.js`** — CACHE_NAME `vyve-cache-v2026-06-07-pm554-firstrun`; `firstrun.js` + `firstrun.css` added to precache (§23.76).
- **`member-dashboard` EF v78** — adds `tour_completed_at` to member snapshot payload (column already in `members` table via migration this session).
- **DB migration** — `ALTER TABLE members ADD COLUMN IF NOT EXISTS tour_completed_at TIMESTAMPTZ` applied and verified.

### Commit
vyve-site `a5a4cadc` · vbb 424

### Key decisions
- Explanatory v1 only (no per-step achievements, decoupled from Achievements overhaul). Action-tutorial is a later iteration.
- Multi-page in-context spotlight: home→mind→sessions. Viable because snapshot-first paint renders hops <200ms.
- Dismissal writes `tour_completed_at` server-side (reinstall-safe, cross-device) via member-scoped RLS — no EF needed.
- Anchor-ready guard: rAF poll ~1.5s, timeout→container fallback — never spotlights an empty skeleton (§23.36/§23.47).
- `vyve:auth:ready` event also triggers init as an earlier path alongside the 1.5s DOMContentLoaded delay.

### §23 rules confirmed
§23.31 optimistic-first dismissal write · §23.36/§23.47 anchor-ready guard · §23.44 haptics.js dependency · §23.58 safe-area · §23.59 web-tells suppression · §23.76 precache new files · §23.72 vbb-marker both pages.
