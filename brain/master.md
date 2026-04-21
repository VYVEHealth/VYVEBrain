# VYVE Health — Master Brain Document

> Single source of truth for the VYVE Health platform. Any AI session starts here.
> Last full reconciliation: **20 April 2026** (`member_home_state` single-row aggregate + `zzz_refresh_home_state` triggers on 10 tables including `members`; member-dashboard EF v44 reads from aggregate with identical v43 response shape; `refresh_member_home_state(p_email)` is the sole sanctioned write path). Previous (19 April 2026): cap_replay_views trigger + combined 2/day cap; member-dashboard EF v43 reads counts from source tables; SECURITY DEFINER trigger fix on aggregation triggers; engagement.html v40 response mapping.

---

## 1. What Is VYVE Health?

VYVE Health CIC is a UK-based Community Interest Company building a proactive wellbeing platform for individuals and employers. Three pillars: Physical, Mental, Social health. AI coaching personas personalise the member experience.

**Stage:** Pre-revenue, MVP, validation.
**Members:** 17 in `public.members`. 18 `auth.users` (1 orphan — `anthony.clickit@gmail.com`, banned via `ban-user-anthony` EF v8).
**Legal:** ICO registered (00013608608). CIC = 6-8 point advantage in public sector procurement.

### Team
| Role | Person | Email | Scope |
|------|--------|-------|-------|
| CEO / Founder | Lewis Vines | lewisvines@hotmail.com | Commercial, sales, content, AI ops |
| CTO / Co-Founder | Dean Brown | deanonbrown@hotmail.com | Technical, part-time until 6K/month revenue |
| COO | Alan Bird | alanbird1@gmail.com | QA feedback |
| Fitness Content | Calum Denham | calumdenham@gmail.com | Programme review |

Business email: team@vyvehealth.co.uk (never use personal emails for business).

---

## 2. Product Overview

### What Members Get
- 5 AI coaching personas (NOVA, RIVER, SPARK, SAGE, HAVEN)
- 8-week personalised workout programmes (generated at onboarding, inline)
- Browse library of 30 pre-built programmes with pause/resume switching
- Single session sharing (public preview page for non-members)
- Daily habit tracking with monthly themes + custom habit creation
- Weekly and monthly wellbeing check-ins with AI reports
- AI-generated running plans
- Nutrition logging (TDEE, macros, food diary) + standalone nutrition setup
- Live sessions with real-time chat
- Certificate system with charity donation mechanic
- Leaderboards and engagement scoring
- In-app notifications (bell badge, slide-up sheet, streak milestones)
- Web push notifications (VAPID, habit reminders 20:00 UTC, streak reminders 18:00 UTC)
- Platform monitoring with email alerts

### Pricing
- B2C: 20/month individual
- B2B: 10/user/month. Volume tiers TBD for 200+ seats.
- Stripe: buy.stripe.com/00wfZicla1Em0NnaIB93y00. Coupons: VYVE15, VYVE10.

### Current Priority Order (April 2026)
1. Android approval (icon fix resubmitted 15 April)
2. iOS icon fix (Build 2 uploaded)
3. Exercise restructure + onboarding questionnaire update
4. Deploy `admin.html` to `admin.vyvehealth.co.uk`
5. Polish + test pass
6. Target: ready to sell from May 2026

---

## 3. Architecture

### Hosting
| Component | Where |
|-----------|-------|
| Member portal (PWA) | GitHub Pages → online.vyvehealth.co.uk — repo `VYVEHealth/vyve-site` (PRIVATE) |
| Marketing site | GitHub Pages → www.vyvehealth.co.uk — repo `VYVEHealth/Test-Site-Finalv3` |
| Admin dashboard | GitHub Pages → admin.vyvehealth.co.uk (target) — repo `VYVEHealth/vyve-command-centre` — file committed, deployment pending |
| Backend / DB | Supabase Pro (West EU/Ireland) — project `ixjfklpckgxrwjlfsaaz` |
| AI | Anthropic API (Claude Sonnet 4 + Haiku 4.5) — server-side Edge Functions ONLY |
| Email | Brevo (free tier, 300/day) |
| Payments | Stripe |
| Analytics | PostHog (EU endpoint) — sends raw email PII (deferred fix) |
| CRM | HubSpot (Hub ID: 148106724) |
| Automation | Make (Lewis only — social media) |

### Authentication
Supabase Auth. All portal pages gated. Auth0 is FULLY RETIRED. Current client `auth.js` v2.4 (with offline fast-path).

### Service Worker (`sw.js`)
Shipped 21 April 2026 — network-first for HTML navigations, cache-first for static assets. Key behaviours:
- `install` handler calls `self.skipWaiting()` after `cache.addAll` → new SW activates on the very next page load, no tab-close required.
- `activate` handler calls `self.clients.claim()` alongside old-cache purging → existing open tabs immediately switch to the new SW.
- HTML navigations (`req.mode === 'navigate'`, `.html`, or `/`) use network-first: every page reload fetches the latest HTML from GitHub Pages and falls back to cache only when offline.
- Static assets (JS, CSS, images) use cache-first with network fallback.
- Cross-origin requests and any `/functions/*` or `/auth/*` call bypass the SW entirely.
- `message` handler responds to `{type:'SKIP_WAITING'}` for future update-prompt UI.

**Implication:** HTML-only changes no longer require a `sw.js` cache bump to reach users — the network-first strategy ensures the latest HTML is served on every reload. `sw.js` cache bumps are still required when JS, CSS, or other cached assets change, because those remain cache-first.

### Repo Structure (vyve-site)
Single-file HTML pages. Self-contained inline CSS/JS. No build process, no bundler.

**Core pages:** index.html (dashboard, 81KB), habits.html, workouts.html (51KB), nutrition.html (74KB), nutrition-setup.html, log-food.html, wellbeing-checkin.html, monthly-checkin.html, sessions.html, running-plan.html, settings.html (66KB), certificates.html, engagement.html, leaderboard.html, shared-workout.html, login.html, set-password.html, consent-gate.html, strategy.html (password: vyve2026).

**Shared JS:** auth.js (17KB, v2.4), nav.js (18KB, body-prepend injection), theme.js (4.4KB), theme.css (6.8KB, semantic token layer), sw.js (4KB, network-first HTML, `vyve-cache-v2026-04-21f-navjs-body-prepend`), vapid.js (2.6KB), tracking.js (8.5KB), offline-manager.js, supabase.min.js.

**Workout JS modules** (loaded by workouts.html): workouts-config.js, workouts-programme.js, workouts-session.js, workouts-builder.js, workouts-exercise-menu.js, workouts-notes-prs.js, workouts-library.js.

**Session pages:** yoga-live.html, workouts-live.html, mindfulness-live.html, etc. + matching `*-rp.html` replay pages.

**Other:** VYVE_Health_Hub.html (182KB, standalone demo — no auth, not part of portal), offline.html, manifest.json, icons.

### Repo Structure (vyve-command-centre)
`apps/admin-dashboard/admin.html` — single-file admin dashboard (~1000 lines, Chart.js, dark+light theme). Auth via Supabase Auth + `admin_users` allowlist. Target deploy: `admin.vyvehealth.co.uk`.

### nav.js Injection Heights (mobile ≤768px)
- Mobile top header: `position:sticky; top:0; height:56px`. Injected at `document.body.prepend()` — NOT inside `#app` or `#skeleton`.
- Bottom nav: `position:fixed; bottom:0; z-index:9999; ~62px + safe-area`. Injected at `document.body.appendChild()`.
- Body gets `padding-bottom: calc(62px + env(safe-area-inset-bottom,0px)) !important`
- Any page-level sticky element must use `top:56px` on mobile, not `top:0`
- Modals must use `z-index:10001` minimum
- **Rule:** All nav chrome (desktop nav + mobile header + bottom nav + overlays + more-menu + avatar panel) lives at document.body level and is therefore independent of any page's `#app`/`#skeleton` loading state. Do not revert to `insertBefore(main, ...)` style injection — it broke exercise/movement pages on 21 April.

### nav.js Desktop Nav (>768px)
Desktop shows a "More ▾" dropdown and a profile avatar dropdown.

**More dropdown** — three grouped sections:
- Check-Ins: Weekly Check-In, Monthly Check-In
- Progress: My Certificates, Leaderboard, Activity Score
- Tools: Running Plan, Guides & PDFs, How-to Videos, Catch-Up Replays

**Avatar panel** — full name + email, Settings, Sign Out.

Globals: `vyveToggleNavMore(e)`, `vyveToggleAvatarMenu(e)`, `vyveCloseAllDesktop()`. Overlay `#navDesktopOverlay` (z-index:99) closes panels on outside click. Escape closes both. `@media(max-width:768px)` hides desktop dropdown CSS so mobile is unaffected.

### PWA Meta Tags
All portal pages include `<meta name="apple-mobile-web-app-capable" content="yes"/>`. Three pages (engagement, certificates, index) also have `<meta name="mobile-web-app-capable" content="yes"/>` (added 17 April). **13 pages still need the second tag** — tracked in backlog.

### Onboarding Form
`www.vyvehealth.co.uk/welcome` = `welcome.html` in `Test-Site-Finalv3` repo. 150s timeout, 45s slow timer. Calls `onboarding` EF v77 (Round 5: exercise stream routing).

### sw.js Cache Version
`vyve-cache-v2026-04-17u` (bump letter after every portal push — read current version first).

### Web Push (VAPID) — Live
- `vapid.js` loaded on `index.html` — subscribes on bell tap, saves to `push_subscriptions` table
- `sw.js` — `push` event listener + `notificationclick` listener live
- `habit-reminder` v8 + `streak-reminder` v8 — full RFC 8291 AES-GCM encryption via Deno Web Crypto
- `send-test-push` v7 — test tool (Supabase Dashboard → Edge Functions → Test)
- `VAPID_PRIVATE_KEY` secret set in Supabase
- VAPID public key: `BDbz2-0k3JcqRWKyasr3MNgEZrXhKsVvjS-otCyyV7Ya4Pi2xXOxXGETUpVoE56VorKzSNy7uyep53gOzNEMTu4`
- Rule: Apple push requires RFC 8291 encryption. `esm.sh` imports fail in Supabase EFs — always use Deno Web Crypto only.
- Rule: iOS push only works from home-screen-installed PWA (Safari 16.4+).

---

## 4. Database (Supabase — 68 tables, 25 FKs, 120 triggers, 32 public functions)

All RLS enabled.
**Email is the join key across member-scoped tables.** 25 foreign keys target `public.members.email`.

### Triggers (119, live and authoritative)

| Family | Tables | Purpose |
|---|---|---|
| `zz_lc_email` (BEFORE INS/UPD) | 42 tables | Lowercases `member_email` before write (via `vyve_lc_email()`) |
| `enforce_cap_*` (BEFORE INS) | workouts, cardio, daily_habits, kahunas_checkins, session_views, replay_views | **DB-level cap enforcement.** Over-cap rows are routed to `activity_dedupe` via the cap functions. session_views + replay_views share a combined 2/day cap (either trigger counts both tables). |
| `counter_*` (AFTER INS) | same 5 | Increments per-member counters on `members` |
| `auto_time_fields_*` (BEFORE INS) | workouts, cardio, daily_habits, session_views, replay_views, wellbeing_checkins | Derives `day_of_week`, `time_of_day` from `logged_at` |
| `auto_iso_week_*` (BEFORE INS) | kahunas_checkins, wellbeing_checkins | Derives `iso_week`, `iso_year` |
| `zz_sync_activity_log` (AFTER INS/UPD/DEL) | workouts, cardio, daily_habits, session_views, replay_views, wellbeing_checkins, monthly_checkins | Fans out to `member_activity_log` for the admin dashboard timeline |
| `*_updated_at` (BEFORE UPD) | all cc_* tables + push_subscriptions_native | Maintains `updated_at` |

**Rule:** Activity caps and time-field derivation are the database's job. Do not duplicate in `log-activity` EF. The `activity_dedupe` table is populated by the cap-enforcement triggers, not by the application.

### Foreign Keys (25)

All target `public.members.email`. Present on: `daily_habits`, `workouts`, `cardio`, `session_views`, `replay_views`, `kahunas_checkins`, `wellbeing_checkins`, `ai_interactions`, `persona_switches`, `weekly_goals` (via separate key), `engagement_emails`, `certificates`, `qa_submissions`, `employer_members`, `workout_plan_cache`, `exercise_logs`, `exercise_swaps`, `custom_workouts`, `member_habits`, `nutrition_logs`, `nutrition_my_foods`, `push_subscriptions_native`, `shared_workouts` (via `shared_by`), `member_stats`.

Plus `daily_habits.habit_id → habit_library.id` and `member_habits.habit_id → habit_library.id`.

### SQL Functions (31, public schema)

**Trigger support (15):** `vyve_lc_email`, `set_activity_time_fields`, `set_checkin_iso_week`, `cap_cardio`, `cap_daily_habits`, `cap_kahunas_checkins`, `cap_session_views` (counts combined session+replay), `cap_replay_views` (mirrors session cap), `cap_workouts`, `increment_cardio_counter`, `increment_habit_counter`, `increment_checkin_counter`, `increment_session_counter`, `increment_workout_counter`, `vyve_sync_activity_log`.

**Aggregation layer (11):** `compute_engagement_score`, `compute_engagement_components`, `recompute_member_stats(email)`, `recompute_all_member_stats()`, `recompute_company_summary()`, `recompute_platform_metrics(date)`, `rebuild_member_activity_daily()`, `rebuild_member_activity_daily_incremental()`, `backfill_platform_metrics(days)`, `bump_member_activity(email, type, date, at)`, `vyve_refresh_daily(email, date)`.

**Utility (6):** `get_charity_total()`, `get_capped_activity_count(email, activity_type)`, `next_certificate_number()`, `member_age(birth_date)`, `update_cc_updated_at`, `update_push_native_updated_at`.

### Cron Jobs (13)

| Name | Schedule (UTC) | Runs |
|---|---|---|
| `vyve-reengagement-daily` | 0 8 * * * | `re-engagement-scheduler` EF |
| `vyve-daily-report` | 5 8 * * * | `daily-report` EF |
| `vyve-certificate-checker` | 0 9 * * * | `certificate-checker` EF |
| `weekly-report` | 10 8 * * 1 | `weekly-report` EF |
| `monthly-report` | 15 8 1 * * | `monthly-report` EF |
| `habit-reminder-daily` | 0 20 * * * | `habit-reminder` EF |
| `streak-reminder-daily` | 0 18 * * * | `streak-reminder` EF |
| `warm-ping-every-5min` | */5 * * * * | `warm-ping` EF (keeps EFs warm) |
| `vyve_recompute_member_stats` | */15 * * * * | SQL `recompute_all_member_stats()` |
| `vyve_rebuild_mad_incremental` | */30 * * * * | SQL `rebuild_member_activity_daily_incremental()` |
| `vyve_recompute_company_summary` | 0 2 * * * | SQL `recompute_company_summary()` |
| `vyve_platform_metrics` | 15 2 * * * | SQL `recompute_platform_metrics()` |
| `vyve_schema_snapshot` | 0 3 * * 0 | `schema-snapshot-refresh` EF (weekly, Sunday 03:00 UTC) |

### Tables — Full Inventory (68)

#### Core Member & Activity (13)
`members` (17), `daily_habits` (88), `workouts` (62), `cardio` (19), `session_views` (40), `replay_views` (20), `kahunas_checkins` (14), `weekly_scores` (14), `wellbeing_checkins` (14), `monthly_checkins` (0), `ai_interactions` (21), `activity_dedupe` (583 — receives over-cap inserts), `session_chat` (4).

#### Workout & Exercise (7)
`workout_plans` (297), `workout_plan_cache` (12 — `is_active`/`paused_at`/`source` for pause/resume), `exercise_logs` (198), `exercise_swaps` (4), `exercise_notes` (6), `custom_workouts` (2), `programme_library` (30).

#### AI & Persona (6)
`personas` (5), `persona_switches` (0), `running_plan_cache` (5), `weekly_goals` (16), `knowledge_base` (15), `ai_decisions` (21).

#### Habit & Nutrition (7)
`habit_themes` (5), `habit_library` (30, `created_by` column for custom habits), `member_habits` (65), `nutrition_logs` (5), `nutrition_my_foods` (0), `nutrition_common_foods` (125), `weight_logs` (12).

#### Notifications & Push (3)
`member_notifications` (14), `push_subscriptions` (10), `push_subscriptions_native` (0 — for Capacitor).

#### Sharing (1)
`shared_workouts` (54).

#### Monitoring (1)
`platform_alerts` (60 — RLS on, no policies → service-role only).

#### Aggregation Layer (7) — All RLS-enabled, no policies, service-role only
| Table | Rows | Source | Purpose |
|---|---|---|---|
| `member_stats` | 17 | `recompute_all_member_stats()` every 15m | Per-member rollups + engagement components |
| `member_activity_daily` | 99 | `rebuild_member_activity_daily_incremental()` every 30m | Daily per-member counts |
| `member_activity_log` | 243 | `zz_sync_activity_log` triggers (live) | Unified timeline feed |
| `member_home_state` | 16 | `refresh_member_home_state(email)` fired from `zzz_refresh_home_state` triggers on 10 source tables (live) | Dashboard-ready per-member aggregate (read by member-dashboard EF v44+) |
| `company_summary` | 3 | `recompute_company_summary()` daily 02:00 | Per-company rollups |
| `platform_metrics_daily` | 92 | `recompute_platform_metrics()` daily 02:15 | Platform-wide daily KPIs |
| `admin_users` | 3 | Manual seed (Dean + Lewis) | Allowlist for `admin-dashboard` EF |
| `vyve_job_runs` | 1 | Scheduled rebuild functions | Last-run tracking |

#### Other (5)
`service_catalogue` (21), `certificates` (0), `employer_members` (0), `engagement_emails` (41), `qa_submissions` (3).

#### Command Centre — Lewis's Ops Dashboard Backing (18, all empty, not yet wired)
`cc_clients`, `cc_decisions`, `cc_documents`, `cc_episodes`, `cc_finance`, `cc_grants`, `cc_intel`, `cc_investors`, `cc_invoices`, `cc_knowledge`, `cc_leads`, `cc_okrs`, `cc_partners`, `cc_posts`, `cc_revenue`, `cc_sessions`, `cc_swot`, `cc_tasks`. Each has an `updated_at` trigger. Accessed via `cc-data` EF v2.

### Activity Caps (DB-level via triggers)

- `daily_habits`: 10/day per member (per habit per day via unique `(member_email, activity_date, habit_id)`)
- `workouts`, `cardio`: 2/day per member
- `session_views` + `replay_views`: **2/day combined** per member. Both `cap_session_views` and `cap_replay_views` count `COUNT(session_views) + COUNT(replay_views)` for the day, so any mix (2 live, 2 replay, 1+1) caps at 2 total. Added 19 April 2026.
- `kahunas_checkins`: 1/ISO week per member

Over-cap inserts route to `activity_dedupe` via the cap functions. Not discarded.

### Key Constraints

- `member_habits.assigned_by`: only `'onboarding'`, `'ai'`, `'theme_update'`, `'self'`
- `daily_habits` unique: `(member_email, activity_date, habit_id)`
- `workout_plan_cache` unique: `(member_email)` — upsert pattern
- `members.persona`: NOVA, RIVER, SPARK, SAGE, HAVEN

### Known RLS gaps (open backlog)

- `running_plan_cache.public_update` policy lets any authenticated user UPDATE any row — fix to `member_email = auth.email()`
- `session_chat`, `shared_workouts`, `monthly_checkins` missing INSERT policies
- Members table has 3 redundant RLS policies

---

## 5. Edge Functions (59 active)

All EFs use `verify_jwt: false` with internal JWT validation. Never set `verify_jwt: true` without updating every calling page.

### Production-critical (25)

| Function | Version | Purpose | Auth |
|---|---|---|---|
| `onboarding` | v77 | Persona + habits + stream-aware routing (workouts/movement/cardio) + inline workout plan (workouts only) + welcome email | CORS (public) |
| `member-dashboard` | v44 | Full dashboard data — reads `member_home_state` aggregate | JWT (internal) |
| `wellbeing-checkin` | v32 | Weekly check-in + AI | JWT (internal) |
| `monthly-checkin` | v13 | Monthly 8-pillar check-in + AI report | JWT (internal) |
| `log-activity` | v19 | PWA activity logging + streak notifications | JWT (internal) |
| `notifications` | v7 | In-app notifications fetch/mark-read | JWT (internal) |
| `employer-dashboard` | v29 | Aggregate, no PII | API key |
| `admin-dashboard` | v6 | Admin dashboard backing API | JWT + `admin_users` allowlist |
| `cc-data` | v2 | Command Centre read/write for Lewis | Internal |
| `anthropic-proxy` | v14 | Running plans AI | JWT (internal) |
| `send-email` | v20 | Brevo transactional (VYVE logo in header) | Auth + CORS |
| `re-engagement-scheduler` | v20 | Cron 08:00 | Cron |
| `daily-report` | v21 | Cron 08:05 | Cron |
| `weekly-report` | v14 | Cron Mon 08:10 | Cron |
| `monthly-report` | v14 | Cron 1st 08:15 | Cron |
| `certificate-checker` | v18 | Cron 09:00 | Cron |
| `certificate-serve` | v15 | Certificate HTML serving | Public |
| `github-proxy` | v19 | GET + PUT to vyve-site (x-proxy-key auth) | Header key |
| `github-proxy-marketing` | v9 | GET + PUT to marketing repo | Header key |
| `off-proxy` | v16 | Open Food Facts API proxy | Public |
| `habit-reminder` | v8 | Cron 20:00 + VAPID push | Cron |
| `streak-reminder` | v8 | Cron 18:00 + VAPID push | Cron |
| `platform-alert` | v1 | Client-side error reporting + email alerts | CORS |
| `warm-ping` | v1 | Keep-warm (cron every 5 min) | Cron |
| `leaderboard` | v7 | Leaderboard data | JWT |
| `share-workout` | v6 | Create + read shared workouts | JWT/Public |
| `generate-workout-plan` | v9 | Standalone 8-week plan generator. Used for regeneration/fallback flows. Onboarding v77 currently duplicates ~120 lines of this inline (refactor candidate — see backlog) | CORS (public) |
| `schema-snapshot-refresh` | v2 | Weekly snapshot of live DB schema, committed to `brain/schema-snapshot.md` via `GITHUB_PAT_BRAIN`. Cron: Sunday 03:00 UTC | Cron |
| `workout-library` | v4 | Browse/activate/pause library programmes | JWT |
| `send-password-reset` | v2 | Password reset email | Public (rate-limited) |
| `send-session-recap` | v11 | Session recap emails | Internal |
| `send-journey-recap` | v11 | Journey recap emails | Internal |

### Auxiliary / admin (5)

`ops-brief` v9, `storage-cleanup` v9, `internal-dashboard` v9, `resend-welcome` v6, `delete-housekeeping` v9.

### Testing / debug (6)

`send-test-welcome` v9, `send-test-push` v7, `monthly-checkin-test` v9, `check-cron` v18, `debug-exercise-search` v12, `re-engagement-test-sender` v15.

### One-shot migrations still deployed — safe to delete

`seed-library-1` v3, `seed-library-2` v1, `seed-b1` v1, `create-ai-decisions-table` v6, `setup-ai-decisions` v7, `setup-member-units` v6, `run-monthly-checkins-migration` v8, `run-migration-monthly-checkins` v13, `trigger-owen-workout` v6, `trigger-callum-workout` v6, `thumbnail-audit` v9, `thumbnail-upload` v8, `thumbnail-batch-upload` v6, `generate-stuart-plan` v6, `send-stuart-reset` v8, `ban-user-anthony` v8 (keep if ban workflow still needed).

---

## 6. AI Personas

### Score Scales (CRITICAL)
| Slider | 1 = | 10 = | Direction |
|---|---|---|---|
| Wellbeing | Struggling | Thriving | High = good |
| Energy | Exhausted | Full of energy | High = good |
| **Stress** | **Very stressed** | **Very calm** | **High = good (INVERTED from intuition)** |

### Persona Assignment (Hard Rules — in order)
1. HAVEN — life context includes Bereavement or Struggling with mental health
2. RIVER — stress ≤ 3 (actually stressed) OR wellbeing ≤ 4 OR energy ≤ 3
3. NOVA — wellbeing ≥ 7 AND energy ≥ 7 AND stress ≥ 7 (calm) AND 1-2 goals max where strength/performance/muscle is dominant
4. AI decides — everything else. SPARK is default for mixed goals.

NEVER assign NOVA or SPARK if serious life context in Section G.

### HAVEN Status
HAVEN is live and IS being assigned (first assignment: Conor Warren, 15 April 2026). Formal clinical review is open. Decision needed from Dean/Lewis: approve as-is or gate.

---

## 7. Onboarding Flow

**URL:** `www.vyvehealth.co.uk/welcome` (`welcome.html` in `Test-Site-Finalv3`)
**EF:** `onboarding` v77 (Round 5: exercise stream routing — reads `data.exerciseStream`, writes `members.exercise_stream`, skips workout plan generation for movement/cardio streams, stream-aware weekly goals/welcome email/recommendations)
**Staged reference:** `staging/onboarding_v67.ts` — **stale by 10 versions, delete or refresh**

### What fires on submit
1. `selectPersona()` — hard rules then AI fallback (correct stress scale)
2. `generateProgrammeOverview()` — AI names the 8-week programme
3. `selectHabits()` — AI selects 5 habits from library
4. `generateRecommendations()` — AI writes 3 first-week recs
5. `generateWorkoutPlan()` — inline, weeks 1-4 and 5-8 in parallel (no `waitUntil`)
6. Stage 1: `writeMember()` + `createAuthUser()` in parallel
7. Stage 2: `writeHabits()` + `writeWorkoutPlan()` + `writeAiInteraction()` + `writeWeeklyGoals()`
8. `sendWelcomeEmail()` via Brevo (VYVE logo in header)

### Client behaviour (welcome.html)
- 150s timeout via `AbortController`
- At 45s: loading text updates to warn it's still running
- On failure: error screen with retry button (stores form data)
- Up to 3 retries before showing support email

---

## 8. Habit System

- 5 habits per member assigned at onboarding
- `assigned_by` constraint: `'onboarding'`, `'ai'`, `'theme_update'`, `'self'`
- Custom habits: members create via `settings.html`, stored in `habit_library` with `created_by = email`
- `daily_habits`: one row per habit per day (unique constraint)
- **Habit count for dashboard/streaks = distinct DATES, not raw rows**
- Cap enforced by DB trigger `enforce_cap_daily_habits` (10/day)

---

## 9. App Store Status (16 April 2026)

| Platform | Status |
|---|---|
| iOS | On App Store, icon needs fixing. Build 2 with correct icon uploaded. |
| Android | Resubmitted 15 April with correct VYVE icon. Awaiting Google Play review. |
| Capacitor project | `C:\Users\DeanO\vyve-capacitor\` (Windows), also on Mac |
| Keystore | `vyve-release-key.jks` on Dean's Desktop (OneDrive) |
| Apple Team ID | VPW62W696B |
| APNs Key ID | 4WSJ4XSZ58 |
| Bundle ID | co.uk.vyvehealth.app |

---

## 10. Hard Rules (NEVER BREAK)

1. API keys NEVER in HTML or GitHub. Server-side EFs only.
2. Auth0 is dead. Never reference it.
3. Kahunas/PAD are dead. Product is "VYVE Health app".
4. Never say "Corporate Wellness" as tagline.
5. `sw.js` cache must be bumped after every portal push. Pattern: `vyve-cache-v2026-04-[date][letter]`.
6. EF deploys require full `index.ts` — no partial updates.
7. Dual dark/light CSS blocks. `theme.js` before `</head>`.
8. Employer dashboard = aggregate only. No PII.
9. HAVEN must signpost professional help if crisis.
10. Password reset emails route to `set-password.html`.
11. GitHub writes via `github-proxy` EF PUT (x-proxy-key auth). Composio MCP is READ-ONLY.
12. `workouts.html` uses MutationObserver on `#app`. Never revert to `waitForAuth`.
13. Business email: team@vyvehealth.co.uk.
14. Dean does not use Make. Lewis only.
15. **Stress scale: 1=very stressed, 10=very calm.** Never treat high stress as negative.
16. `member_habits.assigned_by`: only `'onboarding'`, `'ai'`, `'theme_update'`, `'self'` allowed.
17. Nav overlap: sticky elements use `top:56px` on mobile (not `top:0`). Bottom nav z-index:9999. Modals z-index:10001+.
18. Modal sheets must `stopPropagation` on the sheet element.
19. Settings cache: `vyve_settings_cache` in localStorage, 10-min TTL, keyed to user email.
20. Habit count = distinct `activity_date` values, not raw rows. Cap 10/day.
21. `verify_jwt: false` is the VYVE pattern. All EFs do internal JWT validation.
22. AI stays server-side: all Anthropic calls via Edge Functions only, never in HTML.
23. Lewis dislikes emojis: strip all emoji from content/copy before final commit.
24. Talk first, build second.
25. Large HTML files (>50KB): use `github-proxy` PUT, not inline Composio commits.
26. Never pass file content via inline `COMPOSIO_MULTI_EXECUTE_TOOL` — use workbench.
27. Dean does not run SQL manually — deploy DDL via one-shot EFs using `postgres` Deno driver.
28. Build speed: "1 week" = 1-2 focused days. "2-3 weeks" = 3-5 days.
29. GDPR/UK compliance by default: RLS on all user/employer data, anonymisation for workforce insights.
30. For Supabase EF deploys of large files (>10KB): always read from GitHub, store in variable, pass to deploy. Never inline.
31. **`sw.js` activate: NO page migration.** The activate handler deletes old caches only. Migration causes stale/broken pages to persist.
32. **Never inject `<script>` tags via naive string search.** The `</script>` in the injected tag will terminate any `<script>` block it lands inside.
33. **Most aggregation tables are service-role only.** `member_stats`, `member_activity_daily`, `member_activity_log`, `company_summary`, `platform_metrics_daily`, `admin_users`, `vyve_job_runs` have RLS enabled with NO policies — readable only from Edge Functions running as service role. Any client-side direct access will silently return zero rows. **Exception:** `member_home_state` has RLS enabled *with* a policy (`member_home_state_own_data`) allowing `auth.email() = member_email` read — so individual members can read their own aggregate row directly if a future frontend wants to bypass the EF. All writes still go through `refresh_member_home_state(p_email)` only.
34. **Activity caps are DB-level.** `enforce_cap_*` triggers on `workouts`, `cardio`, `daily_habits`, `kahunas_checkins`, `session_views` block over-cap inserts and route them to `activity_dedupe`. Do not duplicate cap logic in the application layer.
35. **Email lowercasing is automatic.** `zz_lc_email` triggers on 42 tables lowercase `member_email` on every INSERT/UPDATE. Application code does not need to `.toLowerCase()` before writing.
36. **Aggregation trigger functions must be SECURITY DEFINER.** `vyve_sync_activity_log`, `increment_habit_counter`, `vyve_refresh_daily`, and any other trigger function that writes to internal bookkeeping tables (`member_activity_log`, `member_activity_daily`, `member_notifications`, `member_stats`) must be `SECURITY DEFINER`. Without this, the trigger runs as the authenticated user, RLS on those tables blocks the write, and the entire INSERT on the source table rolls back silently. This took down all activity logging platform-wide on 19 April 2026.
37. **engagement.html expects member-dashboard response shape.** The page uses `data.counts`, `data.streaks`, `data.score.total`, `data.activityLog` (with `types[]`). Any refactor of the member-dashboard EF response shape must also update the translation layer in `loadPage()` in engagement.html. Mismatches are silent — score shows blank or NaN.
38. **`member_home_state` write path is `refresh_member_home_state(p_email)` ONLY.** Never `INSERT`/`UPDATE`/`DELETE` directly on `member_home_state` from an Edge Function, a trigger function, or the frontend. The function is `SECURITY DEFINER` and reads every source table to produce a single consistent row; it is also the canonical place where Dean's "sessions lifetime capped at 2/day" rule is enforced. Direct writes will drift from source truth and from the cap rule within minutes. `zzz_refresh_home_state` triggers on `members` (INSERT/UPDATE/DELETE) + 9 activity/score tables ensure the aggregate is always fresh — no cron is needed.

---



39. **Nav chrome stays dark in light theme.** Desktop nav, mobile-page-header, bottom nav, more-menu and avatar panel all remain on the dark-theme palette regardless of `[data-theme="light"]`. theme.css has a scoped override block pinning them. Do not override this — it's deliberate for brand consistency (teal logo + white labels on dark surface).
40. **nav.js injects nav chrome at `document.body` top, not inside `#app` or `#skeleton`.** Use `document.body.prepend(mobileHeader)` and `document.body.prepend(desktopNav)`. Injecting inside `#app` fails on pages with a `#skeleton` wrapper (the header hides when skeleton hides). Ship rule added 21 April 2026.
41. **New portal pages must load 4 standard scripts, in order:** `theme.js`, `auth.js`, `nav.js`, `offline-manager.js`. Do not roll your own top-bar or bottom-nav markup — nav.js injects both. Do not declare your own CSS for `.desktop-nav`, `.nav-logo`, `.nav-badge`, etc. — those class names are nav.js's and will conflict.
42. **Mobile `.wrap` padding template:** `padding: 24px 16px 100px` at `@media(max-width:768px)`. 24px top clears the nav.js sticky mobile header (56px + safe-area-inset-top); 100px bottom clears the bottom nav (62px + safe-area-inset-bottom). Pages that used less (exercise/movement had 8px top, wellbeing-checkin had 60px bottom) broke on iOS.
43. **Use the semantic token layer for new CSS.** `--label-strong`, `--label-accent`, `--label-eyebrow`, `--fill-subtle`, `--line-subtle`, etc. Reserve `--teal-lt` and `--teal-xl` for graphical elements only (dots, rings, chart lines) — they fail WCAG AA as text colours on the light background. See Section 13.
44. **HTML cache-bumps are no longer mandatory.** Since sw.js shipped network-first HTML on 21 April 2026, HTML-only edits reach users on the next reload without a `sw.js` cache bump. Still bump the cache when JS, CSS, or other cached assets change (they remain cache-first).

## 11. What NOT to Do

- Do NOT create tables that already exist (check the 68-table list above)
- Do NOT reference Auth0, Kahunas, PAD, or Google Sheets for portal data
- Do NOT put API keys in HTML files
- Do NOT modify EFs without complete `index.ts`
- Do NOT forget to bump `sw.js` after portal changes
- Do NOT use `assigned_by: 'onboarding_ai'` — check constraint violation
- Do NOT treat high stress score as bad — 10 = very calm
- Do NOT assign NOVA just because a member ticked strength among many goals
- Do NOT use `exec_sql` RPC — it doesn't work on this project. Use `postgres` Deno driver.
- Do NOT add page migration logic to `sw.js` activate handler
- Do NOT use naive string injection for `<script>` tags in HTML
- Do NOT duplicate cap enforcement in `log-activity` EF — DB triggers handle it
- Do NOT add client-side policies for the 7 aggregation tables — they are service-role-only by design

---

## 12. Security State (as of 18 April 2026)

### Shipped
| Fix | What Changed |
|---|---|
| `github-proxy` v15+ | x-proxy-key auth + CORS restriction |
| `member-dashboard` v30+ | JWT-only auth, email fallback removed |
| `onboarding` v57+ | CORS restricted to www.vyvehealth.co.uk |
| `send-email` v16+ | Auth + CORS + model name fix |
| `employer-dashboard` v26 | Unauthenticated fallback removed |
| `session_chat` RLS | SELECT restricted to authenticated users |
| Duplicate RLS policies | 20 redundant policies dropped |
| Source-table indexes | 18 April — workouts/cardio/certificates/ai_interactions on member_email + logged_at DESC |
| SW activate migration removed | 17 April — prevents stale cache persistence |
| Script-injection corruption fixes | 17 April — engagement.html, certificates.html, index.html |

### Open (backlog)
- `running_plan_cache.public_update` policy lets any auth user UPDATE any row
- XSS: `index.html` renders `firstName` via `.innerHTML` without escaping
- Missing INSERT policies on `session_chat`, `shared_workouts`, `monthly_checkins`
- 3 redundant RLS policies on `members`
- PostHog sends raw email PII (hash before send)
- 9 one-shot migration EFs still deployed
- 13 portal pages missing `<meta name="mobile-web-app-capable" content="yes"/>`

### By design (document, don't "fix")
- 7 aggregation/admin tables have RLS enabled with ZERO policies → service-role only via EFs (Rule 33)
- `platform_alerts` also RLS-on-no-policies → EFs bypass with service role

---

## 13. Design System (Phase A-E)

### Status
Phase A (tokens) and Phase B (semantic colour migration) shipped 17 April 2026. Phase C (session-page template consolidation — 14 stubs + 4 shared files) also 17 April. **Phase B refinement shipped 21 April 2026** — semantic token layer (`--label-*`, `--fill-*`, `--line-*`) for proper light-mode readability across 12 portal pages (see "Semantic Token Layer" below). Phases D (components) and E (typography/spacing) are open backlog items — when they land, they should consume the new semantic tokens rather than raw brand tokens.

`VYVE_Health_Hub.html` is out of scope for Phase A-E; planned for future redesign + PWA linking.

### Tokens in theme.css

**Brand accents** (`:root`): `--teal`, `--teal-lt`, `--teal-xl`, `--teal-dark`, `--green`, `--amber`, `--coral`, `--font-head`, `--font-body`.

**Semantic aliases:** `--success` (#2D9E4A), `--success-soft`, `--success-strong`, `--warning` (#E09B3D), `--warning-soft`, `--warning-strong`, `--danger` (#E06060), `--danger-soft`, `--danger-strong`, `--gold` (#C9A84C), `--gold-soft`.

**Activity track colours:**
| Token | Hex | Activity |
|---|---|---|
| `--track-habits` | #4DAAAA | Daily Habits |
| `--track-workouts` | #E09B3D | Workouts |
| `--track-cardio` | #E06060 | Cardio |
| `--track-sessions` | #9B7AE0 | Sessions |
| `--track-nutrition` | #2D9E4A | Nutrition |

**Habit pot colours:**
| Token | Hex | Theme |
|---|---|---|
| `--pot-movement` | #4DAAAA | Movement (shares with --track-habits, intentional) |
| `--pot-nutrition` | #2D9E4A | Nutrition (shares with --track-nutrition, intentional) |
| `--pot-mindfulness` | #5BA8D9 | Mindfulness |
| `--pot-social` | #E879A3 | Social |
| `--pot-sleep` | #6366B8 | Sleep |

**Scales:** spacing `--space-0` → `--space-16`; typography `--text-2xs` → `--text-4xl` + weights; radius `--radius-sm` / `--radius` / `--radius-lg` / `--radius-xl` / `--radius-pill` / `--radius-circle`; shadow `--shadow-sm/md/lg` + `--shadow-glow-teal`.

### Semantic Token Layer (shipped 21 April 2026)

Three families of theme-aware tokens. Values differ for `[data-theme="dark"]` (default) and `[data-theme="light"]`. All legacy tokens (`--text`, `--surface`, `--border`, `--muted`, `--on-accent`, `--white`, `--surface-hover`, `--surface-teal`, `--border-teal`) are kept as back-compat aliases pointing into this layer.

**Text tokens:** `--label-strong`, `--label-medium`, `--label-weak`, `--label-accent`, `--label-accent-strong`, `--label-eyebrow`, `--label-heading-em`, `--label-on-accent`, `--label-success`, `--label-warning`, `--label-danger`.

**Fill tokens:** `--fill-subtle`, `--fill-subtle-hover`, `--fill-accent`, `--fill-accent-hover`, `--fill-accent-strong`, `--fill-success`, `--fill-warning`, `--fill-danger`.

**Line tokens:** `--line-subtle`, `--line-accent`, `--line-accent-strong`, `--line-success`, `--line-warning`, `--line-danger`.

**Usage rules:**
- New CSS rules MUST use these semantic tokens. Do not reach for `--teal-lt` or `--teal-xl` as text colours — those are graphical accents only and fail WCAG AA contrast on the light background.
- For filled accent backgrounds (teal/green buttons), text must use `--label-on-accent` (always white) rather than `--label-strong`, which would render dark on light backgrounds and dark-on-dark on dark.
- Nav chrome (desktop nav, mobile header, bottom nav, more-menu, avatar panel) is **locked dark** in both themes — it does NOT flip with `[data-theme="light"]`. theme.css has a scoped override block that pins nav containers to the dark token values regardless of active theme.
- All contrast verified WCAG AA compliant on both themes before ship (see changelog 2026-04-21).

---

## 14. Offline Architecture (shipped 17 April 2026)

### Root cause of blank screen (fixed)
`vyveInitAuth()` called `await vyveSupabase.auth.getSession()`, which attempts a token-refresh network call. With no signal this hangs, `vyveAuthReady` never fires, pages never render — even though the data cache already exists.

### Layer 5 — auth.js offline fast-path (v2.4)
Inserted after `window.vyveSupabase = vyveSupabase;`, before `getSession()`:
- If `!navigator.onLine`: read `localStorage.getItem('vyve_auth')`
- If valid session found (has `user.email` + `access_token`): build user, `vyveRevealApp()`, dispatch `vyveAuthReady` — no network call
- If no valid cached session offline: redirect to login
- Online flow: unchanged

### Layer 2 — offline-manager.js
In `PRECACHE_ASSETS`. Exports `window.VYVEOffline`:
- `showBanner(ts)` — fixed banner, z-index 10002, #1B7878, top:0 desktop / top:56px mobile
- `hideBanner()`, `disableWriteActions()`, `enableWriteActions()`
- Write-action targeting: `[data-write-action]` attribute
- Listens to `window 'online'`/`'offline'`; dispatches `vyve-back-online` CustomEvent

### Layer 1 — page data caches

Pattern: `vyve_[page]_cache` → `{ data, ts: Date.now(), email }`. TTL 24h. **Always verify `cached.email === memberEmail`.**

| Page | Cache key | Coverage |
|---|---|---|
| index.html | `vyve_home_v2_[email]` | Full — banner wired |
| habits.html | `vyve_habits_cache` | Full: read + write + write-action |
| engagement.html | `vyve_engagement_cache` | Full |
| certificates.html | `vyve_certs_cache` | Full |
| leaderboard.html | `vyve_leaderboard_cache` | Full |
| workouts.html | — (JS modules) | Banner + write-action only |
| nutrition.html | `vyve_wt_cache_*` (weight only) | Banner + write-action only |
| sessions.html | — (static data) | Banner only |
| wellbeing-checkin.html | — (write-heavy) | Disable submit offline |
| settings.html | `vyve_settings_cache` | Pre-existing |

### Layer 3 — wellbeing-checkin.html
Sliders shown offline (member fills in). Submit disabled: "Submit when back online". Re-enables on `vyve-back-online`.

---

## 15. On the Horizon

- Exercise restructure (Option A — Exercise Hub): replaces Exercise tab with hub showing AI-assigned primary plan + cards for Movement, Workouts, Cardio, Classes. Plan at `plans/exercise-restructure.md`.
- `welcome.html` onboarding questionnaire update (part of exercise restructure)
- HealthKit/Health Connect via Capacitor (habits linking with activity, weight from smart scales)
- Calendar integration (Google/Apple) + dedicated calendar page
- Deploy `admin.html` to `admin.vyvehealth.co.uk`
- Social activity feed (spec produced, back-burnered pending Lewis sign-off)
- Wearables Tier 1 (HealthKit/Health Connect) mapped out; recommended against custom GPS

---

## 16. Key URLs

| Reference | Value |
|---|---|
| Supabase Project | `ixjfklpckgxrwjlfsaaz` |
| PostHog Key | `phc_8gekeZglc1HBDu3d9kMuqOuRWn6HIChhnaiQi6uvonl` |
| HubSpot Hub ID | 148106724 |
| Sage Deal | 495586118853 |
| Strategy Dashboard | `online.vyvehealth.co.uk/strategy.html` (password: `vyve2026`) |
| Demo Reset | `online.vyvehealth.co.uk/index.html?reset=checkin` |
| Onboarding form | `www.vyvehealth.co.uk/welcome` |
| `github-proxy` PUT | `https://ixjfklpckgxrwjlfsaaz.supabase.co/functions/v1/github-proxy?path=filename.html` |
| VAPID public key | `BDbz2-0k3JcqRWKyasr3MNgEZrXhKsVvjS-otCyyV7Ya4Pi2xXOxXGETUpVoE56VorKzSNy7uyep53gOzNEMTu4` |

---

*Last full reconciliation: 19 April 2026*
*Source: VYVEHealth/VYVEBrain repo (main branch)*
