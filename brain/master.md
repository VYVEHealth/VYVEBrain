# VYVE Health — Brain Master

> Single source of truth for the whole business. Full rewrite 24 April 2026 (not a patch). Captures live state through Autotick session 2 inclusive (sessions 1+2 shipped 24 April 2026). If this drifts from live reality, rewrite it fully again — do not paper over.

---

## 1. Company overview & legal

| Field | Detail |
|---|---|
| Legal name | VYVE Health CIC (Community Interest Company) |
| ICO registration | 00013608608 — registered March 2026, £52/year renewal |
| Business email | team@vyvehealth.co.uk (all business comms use this, never personal Gmail/Hotmail) |
| CEO / Founder | Lewis Vines — commercial, sales, content, copy sign-off |
| CTO / Co-founder | Dean Brown — technical, ~99% of build delegated to Claude |
| COO | Alan Bird — part-time shareholder, enterprise procurement background |
| Physical/Fitness Lead | Calum Denham — part-time shareholder, fitness content + programme review |
| Mental Health Lead | Phil — owns HAVEN clinical sign-off and mental health content |
| Sales | Vicki — outbound pipeline, enterprise prospecting |
| Community | Cole — member engagement, retention |
| Stage | Pre-revenue · MVP · validation · sell-ready target May 2026 |
| Members | ~17 active (late April 2026 data) across B2C + early enterprise trial seats |
| Tagline | *Help yourself. Help others. Change the world.* |
| Mission | Proactive workplace wellbeing across three strategic pillars (Physical, Mental, Social) — expressed on the website as five (Mental, Physical, Nutrition, Education, Purpose) |

**CIC advantage.** Operating as a Community Interest Company gives a 6–8 point social-value uplift in public-sector procurement, unlocks grant streams closed to for-profits, and reinforces the charity mechanic. Not cosmetic — it's a procurement weapon and a capital flexibility lever.

---

## 2. Mission, vision & competitive positioning

VYVE differentiates through **proactive, multi-pillar wellbeing** against competitors that are overwhelmingly reactive and single-pillar. The core message is prevention over cure — build health before it breaks. VYVE is positioned as a performance investment, not a cost centre, underwritten by ROI evidence from Deloitte, RAND Europe, Gallup, The Lancet, University of Warwick, UCL, and WHO.

**The three strategic pillars** are Physical (workouts, cardio, nutrition, running, habit library, exercise hub), Mental (wellbeing check-ins with AI recs, 5 AI personas, monthly pillar check-ins, HAVEN safe-space persona), and Social (live sessions with chat, leaderboards, charity mechanic, community activity, upcoming employer team dashboards).

**The five website pillars** (Mental, Physical, Nutrition, Education, Purpose) are a member-facing expansion of the three strategic pillars — Social is represented via Education and Purpose, Physical is split into Physical and Nutrition. Same doctrine, different audience.

### Competitive landscape

| Category | Detail |
|---|---|
| Primary threats | Unmind (£61M capital), Spectrum.Life (won AXA Health EAP; Cara launching Q2 2026), YuLife (new CEO + Bupa partnership) |
| Unstable players | Headspace (15% layoffs — approach their UK clients), Spring Health (£6–7B Alma acquisition — validates market) |
| Others tracked | Wellhub, BetterUp, Virgin Pulse, Champion Health, Heka, Vitality, Calm, Koa Health, Lyra, Thrive Global |
| Key sales stat | UK hit 5M mental ill-health sick days in the first 58 working days of 2026 |
| Regulatory window | Employment Rights Act SSP changes effective 6 April 2026 — strongest current economic case for preventative wellbeing |

### Company values (six)

Proactive not reactive · Evidence over assumption · People first always · Radical transparency · Long-term thinking · Health for everyone.

### Sales intelligence infrastructure

Pre-call briefs via Sales Intelligence skill (8-step deep dive, ROI calculator, 20-competitor displacement table, objection handling scripts). Three Pillar Assessment as an employer-facing prospect scoring tool. Public Sector Playbook covering 5 procurement routes, social-value scoring, tender template, 90-day action plan. Research Library with 20+ indexed studies and a Stat Bank of copy-paste statistics for sales conversations.

---

## 3. Business model & revenue streams

| Stream | Detail |
|---|---|
| B2C individual | £20/month per member. Stripe direct link. Onboarding via `welcome.html` (stream-aware since 19 April). |
| B2B enterprise | £10/user/month. Contact-first sales. Volume tiers still TBD before first enterprise contract; indicative bands: 50–200 full rate, 201–500 negotiable, 500+ bespoke. |
| Annual option | 10–15% discount — Lewis decision, Dean adds to Stripe once confirmed. |
| Positioning | Performance investment, not cost centre. ROI evidence anchored by Deloitte, RAND Europe, Gallup, Lancet, Warwick, UCL, WHO. |
| Series A targets | £1–2M ARR, 10%+ MoM growth, sub-8% churn, 100%+ NRR. |

First paying B2C customer and first named charity partner confirmed late April 2026.

---

## 4. Target market & enterprise pipeline

**Segments.** Private-sector enterprise (Sage warm lead, BT, Barclays, Balfour Beatty as priority targets). Public sector (NHS, councils, government) — CIC status the key wedge. Individuals direct via Stripe.

**Enterprise pipeline (generic language — named prospects not included in doc).**

| Prospect | Status |
|---|---|
| Enterprise lead (senior wellbeing lead, large UK employer) | Warm. Internal contact via Lewis. Most likely first enterprise client. |
| Secondary enterprise targets | Identified; outreach staged behind first-contract close. |
| Public sector | Playbook ready. CIC status provides procurement advantage. |

**Demo readiness.**

| Item | Owner | Status |
|---|---|---|
| Employer dashboard | Live — aggregate only, no PII | LIVE |
| Member portal | Full experience demoable | LIVE |
| Admin console (Shell 1 + 2 + 3 Sub-scope A) | Live at admin.vyvehealth.co.uk | LIVE |
| Presentation deck | Update once check-in sliders updated | UPDATE NEEDED |
| GDPR / DPA | Complete — swap client name in DPA before sending | COMPLETE |
| B2B pricing volume tiers | Lewis + Dean | TIERS PENDING |
| Brevo logo removal | Lewis — ~$12/month add-on | PENDING |
| Health disclaimer | Short para for App Store listing + onboarding checkbox | PENDING |

---

## 5. Technology stack (complete)

| Technology | Detail |
|---|---|
| Portal hosting | GitHub Pages — `VYVEHealth/vyve-site` (private) → `online.vyvehealth.co.uk` |
| Marketing hosting | GitHub Pages — `VYVEHealth/Test-Site-Finalv3` → `www.vyvehealth.co.uk` |
| Admin console | Separate host — `admin.vyvehealth.co.uk` — served by `vyve-command-centre` repo |
| Brain | `VYVEHealth/VYVEBrain` — markdown source of truth, session-loaded at start of every Claude session |
| Authentication | Supabase Auth. `auth.js` v2.2 gates every portal page. `VYVE_RETURN_TO_KEY` in localStorage. Admin Console uses separate admin-side session. |
| Primary datastore | Supabase — project `ixjfklpckgxrwjlfsaaz` (West EU/Ireland, Pro plan). 70 public tables as of 24 April 2026. |
| Portal AI | Anthropic API (Claude Sonnet 4). Server-side via Supabase Edge Functions only — never in committed HTML. Spend cap ~£50/month. |
| Operational AI | 24 custom Claude skills running daily/weekly/monthly intelligence, content, sales, and monitoring workflows for Lewis. |
| Automation | Make (Lewis only, social publishing). Dean uses `log-activity` EF directly — Make retired from Dean's stack. |
| Payments | Stripe. Live link: `buy.stripe.com/00wfZicla1Em0NnaIB93y00`. Coupons `VYVE15` and `VYVE10`. Redirects to `welcome.html`. |
| Email | Brevo — transactional SMTP API with custom HTML. No campaign builder, no Brevo branding injected. Verified sender `team@vyvehealth.co.uk` (ID 1, name "VYVE Health"). Proxy endpoint `smtp/email` (no `/v3/` prefix). ~$12/month upgrade still outstanding to remove the "Sent via Brevo" footer. |
| HealthKit integration | `@capgo/capacitor-health@8.4.7`. iOS device-validated. 7 read scopes (steps, distance, active energy, workouts, cardio, sleep, weight); 1 write scope (weight only — workout write-back unsupported by Capgo 8.4.7 on iOS, codified session 4). Feature-flagged server-side via `HEALTH_FEATURE_ALLOWLIST` in `member-dashboard`. |
| Analytics | PostHog (`phc_8gekeZglc1HBDu3d9kMuqOuRWn6HIChhnaiQi6uvonl`) — Supabase Auth identity wiring still pending. |
| CRM | HubSpot — `app-eu1.hubspot.com`. Hub ID 148106724. Timezone Europe/London. Currency GBP. Enterprise lead deal tracked. |
| Streaming | Riverside (7 studios, permanent links) + YouTube (8 channels) + Castr (scheduled pre-recorded). |
| Podcast | *The VYVE Podcast* (rebranded from *The Everyman Podcast*). Page live at `vyvehealth.co.uk/vyve-podcast.html`. |

### Retired technologies — never suggest

| Technology | Replacement |
|---|---|
| Google Sheets | Supabase. Sheets legacy only for PAD/credentials reference. |
| Apps Script | Retired from portal. Only Action Ticks (strategy dashboard) + `backup.gs` remain permanently. |
| Typeform | Replaced by `welcome.html` (stream-aware since 19 April). |
| Looker Studio | Replaced by HTML dashboards on GitHub Pages. |
| Auth0 | Gone entirely. Supabase Auth primary. Never say "Auth0 gated". |
| Kahunas | Replaced by the PWA. Never reference in member copy — product is "VYVE Health app". |
| Make (Dean) | Retired from Dean's stack. All activity writes via `log-activity` EF. |
| onboarding_v8.html | Superseded by `welcome.html`. |

---

## 6. Supabase architecture — 74 tables

Project `ixjfklpckgxrwjlfsaaz` (Pro plan, West EU/Ireland). All public tables have RLS enabled (April 2026 audit). Listing live-verified 26 April 2026.

### Core member + activity (member-scoped RLS)

| Table | Rows | Purpose |
|---|---|---|
| `members` | 14 | Core member profiles. Email PK. Persona, welcome recs, goals, consent flags, `exercise_stream`. |
| `employer_members` | 0 | Employer–member relationships (empty until first enterprise goes live). |
| `daily_habits` | 151 | Habit completions. Cap 1/day via BEFORE INSERT trigger. |
| `workouts` | 53 | Workout completions. Cap 2/day for `source='manual'` only since 7a. New `source` column. |
| `cardio` | 23 | Cardio completions. Same source-aware cap as workouts since 7a. |
| `session_views` | 51 | Live session views. Cap 2/day. |
| `replay_views` | 5 | Replay views. |
| `qa_submissions` | 3 | QA test submissions. |
| `wellbeing_checkins` | 17 | Weekly check-in submissions with AI recommendations. |
| `weekly_scores` | 17 | Weekly dashboard scores (wellbeing_score + engagement_score). |
| `weekly_goals` | 19 | First-week onboarding goals per member. Live-computed from activity tables. |
| `activity_dedupe` | 609 | Over-cap activity rows — routed by triggers, not discarded. |
| `ai_interactions` | 21 | All Anthropic API calls (prompt, response, tokens, model). |
| `ai_decisions` | 29 | AI-driven decision audit (persona assignments, rec selections). |

### Workouts, exercise, programmes

| Table | Rows | Purpose |
|---|---|---|
| `workout_plans` | 297 | Workout library rows across plan days. |
| `workout_plan_cache` | 12 | Per-member workout programme (JSONB). Single source of truth. |
| `exercise_logs` | 274 | Plan-agnostic set/rep/weight logs. |
| `exercise_swaps` | 4 | Member exercise substitutions. |
| `exercise_notes` | 7 | Per-exercise notes. |
| `custom_workouts` | 4 | Member-created workouts. |
| `shared_workouts` | 60 | Shared/community workouts. |
| `programme_library` | 31 | Programmes (gym, movement, etc). `category` column open as backlog item. |
| `member_running_plans` | 0 | Per-member running plans (Supabase-first since 20 April). Multiple per member, one active. |
| `running_plan_cache` | 6 | AI running plan cache (5,376 cacheable combinations). |

### Habits, nutrition, weight, sleep

| Table | Rows | Purpose |
|---|---|---|
| `habit_themes` | 5 | Monthly habit themes. |
| `habit_library` | **34** | Source habits. **New `health_rule jsonb` column (24 April — autotick 7b).** Null = manual-only. |
| `member_habits` | 72 | Habits assigned to members. |
| `nutrition_logs` | 5 | Food log entries. |
| `nutrition_my_foods` | 0 | Member-saved custom foods. |
| `nutrition_common_foods` | 125 | Pre-populated food database. |
| `weight_logs` | 16 | Member weight entries. One row per member per day (upsert on conflict). |
| `monthly_checkins` | 0 | Monthly 8-pillar wellbeing check-in (iso_month YYYY-MM). |

### AI, persona, knowledge

| Table | Rows | Purpose |
|---|---|---|
| `personas` | 5 | AI coach personas (NOVA, RIVER, SPARK, SAGE, HAVEN) with full system prompts. |
| `persona_switches` | 0 | Member persona change requests. |
| `knowledge_base` | 15 | Knowledge rows. |

### HealthKit pipeline (NEW — shipped April 2026)

| Table | Rows | Purpose |
|---|---|---|
| `member_health_connections` | 1 | Per-member HK connection state (platform, `has_connected`, last_sync_at). |
| `member_health_samples` | 1,674 | Raw HK samples — long-format, per-sample rows. Includes sleep segments with state metadata. |
| `member_health_daily` | 95 | Aggregated daily long-format table (`queryAggregated` — steps/distance/active_energy per local date). Session 6 pipeline rebuild. |
| `member_health_write_ledger` | 1 | Write-back attempts (weight only; anti-echo via `native_uuid`). |

### Dashboard + aggregation

| Table | Rows | Purpose |
|---|---|---|
| `member_home_state` | 14 | One row per member. Dashboard aggregate. Populated via triggers from 10 source tables. Read by `member-dashboard` v44+. |
| `member_activity_daily` | 99 | Per-member per-day aggregate. |
| `member_activity_log` | 300 | Chronological activity log. |
| `member_stats` | 14 | Per-member rolling stats. |
| `company_summary` | 3 | Enterprise aggregate rollup. |
| `platform_metrics_daily` | 99 | Platform-wide metrics per day. |
| `platform_alerts` | 164 | Central monitoring — errors, failures, proactive alerts. Service-role only. |

### Certificates + engagement

| Table | Rows | Purpose |
|---|---|---|
| `certificates` | 2 | Issued certificate records. Global sequential numbers. |
| `engagement_emails` | 39 | Re-engagement email tracking. Streams A/B/C1/C2/C3. |
| `session_chat` | 5 | Live session chat (last 50 per session). Open INSERT/SELECT for live chat. |
| `service_catalogue` | 21 | Available sessions and content. |

### Notifications

| Table | Rows | Purpose |
|---|---|---|
| `member_notifications` | 20 | In-app notifications. |
| `push_subscriptions` | 10 | VAPID web push subscriptions. |
| `push_subscriptions_native` | 1 | APNs subscriptions for native iOS push. Live end-to-end as of 27 April 2026 PM session. Schema: `member_email`, `token`, `platform`, `environment`, `app_version`, `created_at`, `last_used_at`, `revoked_at`. Per-token unique index. Android/FCM rows reserved (parked, backlog). |

### Admin + command centre (`cc_*`, `admin_*`)

| Table | Rows | Purpose |
|---|---|---|
| `admin_users` | 3 | Admin-console operator accounts. |
| `admin_audit_log` | 16 | Immutable log of admin write actions. Service-role only — no RLS policies. |
| `cc_clients`, `cc_leads`, `cc_investors`, `cc_partners` | 0 each | Command Centre CRM tables. |
| `cc_tasks`, `cc_decisions`, `cc_okrs` | 0 | Task/decision/OKR tracking. |
| `cc_finance`, `cc_revenue`, `cc_grants`, `cc_invoices` | 0 | Financial tracking. |
| `cc_posts`, `cc_sessions`, `cc_intel`, `cc_knowledge`, `cc_documents`, `cc_swot`, `cc_episodes` | 0 | Content + intel. |
| `vyve_job_runs` | 1 | Background job execution log. |

### Activity caps (BEFORE INSERT triggers)

| Activity | Cap | Notes |
|---|---|---|
| `daily_habits` | 10/day | Generous headroom — `activity_dedupe` divert only at 11th+ insert/day/member. (Live `cap_daily_habits()` body.) |
| `workouts` | 2/day **for `source='manual'` only** | Since 7a. HK-sourced rows bypass entirely. |
| `cardio` | 2/day for manual only | Same. |
| `session_views` | 2/day | All sources. |
| `kahunas_checkins` | 1/ISO week | Legacy table — still enforced. |

**Charity + certificate counters stay independently capped at 2/day via `get_charity_total()` and `increment_*_counter()` read-path caps.** Lifting the trigger cap for HK data inflates nothing downstream — Watch-heavy members get full dashboard + leaderboard credit without rocketing the charity counter past its designed pace.

---

## 7. Edge Functions — live inventory

74 active Edge Functions as of 26 April 2026. ~25 are actively operational; the remainder are one-shot patchers/seeders/debug helpers retained for reference. Security audit (9 April) identified ~89 for deletion — partial cleanup complete, more remain.

### Core operational (actively serving requests)

| Function | Version | Purpose |
|---|---|---|
| `onboarding` | v78 | New member onboarding. Two-phase (fast persona/habits/recs + `EdgeRuntime.waitUntil()` for 8-week workout JSON). Stream-aware since 19 April (`if stream==='workouts'`). |
| `member-dashboard` | v51 | Full dashboard data in one call. Server-authoritative hydration on every page load. `HEALTH_FEATURE_ALLOWLIST` gates HealthKit; `health_connections` + `health_feature_allowed` + new `habits` block in payload. Each habit returns `health_auto_satisfied` + `health_progress` evaluated server-side against `member_health_daily` / `member_health_samples` / `workouts` / `cardio` via the autotick evaluator (session 2). Imports `_shared/taxonomy.ts`. |
| `employer-dashboard` | v31 | Aggregate employer analytics. API-key auth (no PII). |
| `wellbeing-checkin` | v35 | Weekly check-in flow. AI recs pulled from activity + persona. |
| `monthly-checkin` | v17 | Monthly 8-pillar check-in. Writes `monthly_checkins`. |
| `log-activity` | v21 | PWA activity logging. Replaced Make entirely. |
| `anthropic-proxy` | v16 | Server-side Anthropic proxy for running plans + misc AI calls. verify_jwt:true. |
| `generate-workout-plan` | v11 | AI workout plan generation (invoked from onboarding's waitUntil path). |
| `sync-health-data` | v7 | HealthKit sync. Stamps `source:'healthkit'` on promoted workout/cardio rows (7a). `queryAggregated` routing for steps/distance/active_energy; sleep segments with full state metadata. v7 refactor (session 2) extracts workout taxonomy to `_shared/taxonomy.ts` — `promoteMapping` body byte-identical to v6, zero behaviour change. |
| `get-health-data` | v2 | Reads back health data for portal display. |
| `get-activity-feed` | v1 | Personal activity feed (community surface, parked for now). |
| `admin-dashboard` | v9 | Admin console data API. |
| `admin-member-edit` | v6 | Admin write to member record. Audited. |
| `admin-member-habits` | v3 | Admin assigns/removes habits. Audited. |
| `admin-member-programme` | v3 | Admin changes member's programme. Audited. |
| `admin-member-weekly-goals` | v3 | Admin edits weekly goals. Audited. |
| `admin-programme-library` | v1 | Admin manages programme library. |
| `edit-habit` | v1 | Habit definition edit helper. |
| `share-workout` | v10 | Shared/community workout handler. |
| `workout-library` | v7 | Library API for workouts. |
| `leaderboard` | v11 | Leaderboard with scope tabs, range filter, privacy-aware name resolver, tie-aware gap copy. Reads aggregation layer only. |
| `notifications` | v9 | In-app notifications read/write. |
| `register-push-token` | v1 | PWA `push-native.js` POSTs `{token, platform, environment, app_version}`; row written to `push_subscriptions_native` with per-token uniqueness. `verify_jwt:true`. Live 27 April 2026 PM. |
| `push-send-native` | v5 | APNs sender. ES256 JWT via Web Crypto from `APNS_AUTH_KEY`/`APNS_KEY_ID`/`APNS_TEAM_ID`. Routes per environment: `api.development.push.apple.com` vs `api.push.apple.com`. `NATIVE_PUSH_ALLOWLIST` fail-closed. 410/400-BadDeviceToken auto-revokes. `verify_jwt:false` with manual service-role guard (literal compare against `SUPABASE_SERVICE_ROLE_KEY`). Live 27 April 2026 PM. |
| `send-push` | v11 | **Unified push fan-out (shipped 28 April).** Single sender for both VAPID web (inline RFC 8291 aes128gcm) + APNs native (delegated to `push-send-native`). Per-member same-day dedupe via `member_notifications` lookup. Writes in-app notification row + fans out to `push_subscriptions` (web) + `push_subscriptions_native` (native). Service-role gated via dual-auth (`SUPABASE_SERVICE_ROLE_KEY` OR `LEGACY_SERVICE_ROLE_JWT`). `verify_jwt:true` (forced — Composio DEPLOY can't set false; UPDATE corrupts bundle). Used by `habit-reminder`, `streak-reminder`, and all future trigger EFs. |
| `habit-reminder` | v14 | Habit reminder push (cron 20:00 UTC daily). Refactored 28 April — calls `send-push` instead of inline VAPID. Stripped ~150 lines of crypto/sub-lookup boilerplate. |
| `streak-reminder` | v14 | Streak-risk push (cron 18:00 UTC daily, ≥7 day streak threshold). Refactored 28 April — calls `send-push`. Same shape as habit-reminder. |
| `platform-alert` | v3 | Writes to `platform_alerts`. |
| `warm-ping` | v3 | Keep-warm pinger to prevent cold starts. |
| `check-cron` | v20 | Cron job audit/verification. |
| `send-email` | v22 | Brevo transactional delivery. |
| `send-session-recap` | v13 | Session recap emails. |
| `send-journey-recap` | v13 | Journey recap emails. |
| `send-password-reset` | v4 | Password reset flow. |
| `re-engagement-scheduler` | v22 | A/B/C1/C2/C3 streams. Cron 8:00 UTC daily. |
| `daily-report` | v23 | Cron 8:05 UTC daily. |
| `weekly-report` | v16 | Weekly report generation. |
| `monthly-report` | v16 | Monthly report generation. |
| `certificate-checker` | v24 | Generates HTML certs to Supabase Storage. Global sequential numbers. Cron 9:00 UTC daily. |
| `certificate-serve` | v26 | Serves certificate HTML files. |
| `github-proxy` | v21 | GET + PUT to `vyve-site` via `GITHUB_PAT` secret. Read-only via direct MCP — writes via this proxy or one-shot EFs. |
| `github-proxy-marketing` | v11 | Same for `Test-Site-Finalv3`. |
| `off-proxy` | v18 | Open Food Facts proxy for `log-food.html`. |
| `ops-brief` | v11 | Ops brief generation. |
| `internal-dashboard` | v11 | Internal metrics. |
| `storage-cleanup` | v11 | Storage housekeeping. |
| `schema-snapshot-refresh` | v4 | Weekly cron, auto-commits structural changes to VYVEBrain. |
| `cc-data` | v4 | Command Centre data API. |
| `debug-exercise-search` | v14 | Exercise-library search debug tool. |

### Retired / one-shot / debug (kept around, not actively invoked)

Approximately 30 functions across `seed-*`, `patch-*`, `trigger-*-workout`, `setup-*`, `run-migration-*`, `debug-*`, `test-*`, `send-stuart-*`, `ban-user-*`, `thumbnail-*`, `delete-housekeeping`, `force-cache-refresh`, `resend-welcome`, `update-brain-changelog`. Cleanup pass pending — the 9 April security audit identified ~89 for deletion, which has been partially actioned.

### EF deployment rules

- Always provide a **full** `index.ts` — no partial updates.
- `verify_jwt:false` for public-facing functions that handle their own auth or need unauth'd access (onboarding, send-email, webhooks).
- `verify_jwt:true` for everything that reads member data server-side (`member-dashboard`, `wellbeing-checkin`, `log-activity`, `anthropic-proxy`).
- `esm.sh` imports are unreliable in Deno — use Deno built-ins (`Web Crypto`, std library) for crypto operations. Codified from iOS Web Push RFC 8291 implementation.

---

## 8. Portal pages & PWA infrastructure

All portal pages live at `online.vyvehealth.co.uk`. Every page is gated behind Supabase Auth (`auth.js` v2.2).

### Core pages

| Page | Purpose |
|---|---|
| `index.html` | Member dashboard. Cache-first (skeleton on first load, instant on return). Reads `member-dashboard` v51. Daily check-in pill strip, activity score ring, goals, live session slot, charity banner. |
| `habits.html` | Daily habit logging. 7-day pill strip, streak + dot strip, monthly theme badge. Fully wired to HealthKit autotick (sessions 3 + 3a, 25 April): fourth parallel fetch to `member-dashboard` v51 merges `has_rule` + `health_auto_satisfied` + `health_progress` into `habitsData` by `habit_id`; pre-render `runAutotickPass()` stamps satisfied rule rows as yes with `notes='autotick'`; `.hk-progress` bar + text on unsatisfied rows; done-state sub-label reads "from Apple Health" on auto-ticked rows, "Logged to your progress" on manual-yes rows. No visual badge — attribution is copy-only. Upsert on conflict + DELETE-based Undo live pre-session-3. Cache key `vyve_habits_cache_v2`. |
| `exercise.html` | **Exercise Hub (since 19 April).** Hero card + stream cards linking to Movement / Workouts / Cardio / Classes. |
| `workouts.html` | Gym programme page. My Programme / My Workouts tabs. Custom workouts, exercise logs, swap. Reads `workout_plan_cache`. |
| `movement.html` | Movement stream. Reads `workout_plan_cache`, activity list, video modal, Mark as Done. No content yet in `programme_library` — default-state members see no-plan state. |
| `cardio.html` | Cardio stream. Weekly progress + quick-log + recent history. Running plans Supabase-first since 20 April. |
| `nutrition.html` | TDEE + macros + hydration + weight tracker. Links to `log-food.html`. |
| `log-food.html` | Food logging via Open Food Facts (`off-proxy` v18). |
| `sessions.html` | Live session listings. Filter tabs (All/Daily/Weekly/Monthly). `session_chat` for live chat (last 50). |
| `settings.html` | Theme, persona, notifications, privacy (display-name preference), HealthKit connect toggle + 7-day re-prompt banner suppression. |
| `wellbeing-checkin.html` | Weekly check-in. Privacy-first. AI recs in persona voice. Nav rebuilt 21 April (`f78a7ba`). |
| `monthly-checkin.html` | Monthly 8-pillar check-in. Same nav rebuild as weekly. |
| `certificates.html` | Member certificate display. 5 tracks with progress. `certificate-serve` v26. |
| `engagement.html` | Activity score page with full scoring methodology. |
| `leaderboard.html` | Privacy-aware leaderboard. Classic 1→N top-100. Range selector (This month / Last 30 days / All-time). Scope tabs (All / Company / Team). Anonymous banner linking to `/settings.html#privacy`. Title-case rendering for ALL-CAPS/all-lower names. Zero-activity footer collapse. 7-day tenure filter on All-time. |
| `running-plan.html` | AI running plan generator. Supabase-first since 20 April (`member_running_plans`). Cache via `running_plan_cache`. `anthropic-proxy` v16, Haiku 4096 max_tokens. |
| `welcome.html` | **Stream picker onboarding** (replaced `onboarding_v8.html` on 19 April). Fires `onboarding` v78 which is stream-aware. |
| `login.html` · `set-password.html` | Supabase Auth flows. |
| `strategy.html` | Internal strategy dashboard (password `vyve2026`). Reads Action Ticks Apps Script + Supabase. |
| `apple-health.html` | Inspector page — built session 6, parked (954-sample payload needs paging). |
| `activity.html` | Personal activity feed — built session 6, unlinked from `exercise.html` (GPS route maps out of scope without Capgo plugin fork; concept parked, likely returns as a community surface). |
| `shared-workout.html` | Shareable workout import endpoint. Receives a workout `id` and renders it for adoption. |
| `certificate.html` | Single-cert viewer (distinct from the `certificates.html` index). |
| `consent-gate.html` | Standalone consent-gate route. Also wired into onboarding flow. |
| `nutrition-setup.html` | TDEE/macros initial setup wizard. |
| `offline.html` | PWA offline fallback page. |
| `how-to-pdfs.html` · `how-to-videos.html` | Help/education library shells. |
| Session live/replay variants | `yoga-{live,rp}.html`, `mindfulness-{live,rp}.html`, `workouts-{live,rp}.html`, `education-{live,rp}.html`, `events-{live,rp}.html`, `podcast-{live,rp}.html`, `therapy-{live,rp}.html`, `checkin-{live,rp}.html` — per-stream live + replay shells. |
| `VYVE_Health_Hub.html` | **Staging — pending Phil's clinical sign-off before launch.** Standalone single-file experience: welcome card → multi-step clinical assessment flow with scoring/risk classification → `generateReport()` text export. Sits in `vyve-site` web root unlinked from nav by design (not promoted until Phil signs off the assessment instruments + risk thresholds + signposting copy). Same clinical-gate pattern as HAVEN persona. Do not delete or archive without Lewis/Phil approval. |

### Admin console (separate host)

`admin.vyvehealth.co.uk/admin-console.html` — served by `vyve-command-centre` repo. Shell 1 + Shell 2 + Shell 3 Sub-scope A UI live. Sub-scope B (bulk ops + multi-select) ready to ship once browser-side JWT smoketest closes on Sub-scope A.

### PWA infrastructure

| Piece | Detail |
|---|---|
| Service worker | `sw.js` — network-first for HTML + skipWaiting + clients.claim (since 21 April). HTML changes reach users on next reload without cache bumps. Non-HTML assets still use cache versioning `vyve-cache-v[date][letter]` — current cache version `v2026-04-26b-revert-hub-archive`. |
| Theme system | `theme.js` — dual dark/light CSS tokens. `data-theme` on `html`. Stored in localStorage. All pages use dual-token CSS blocks — never single `:root`. |
| Nav | `nav.js` — body-prepend since 21 April. Back button on inner pages, logo-only on home. Wired into `wellbeing-checkin.html` + `monthly-checkin.html` on 21 April (previously had bespoke nav markup). |
| Consent gate | Built. Writes `privacy_accepted` + `health_data_consent` to `members`. |
| Viewport zoom | Disabled across all pages. |
| `target="_blank"` | Audit complete. |
| Auth promise | Pending refactor — `auth.js` currently non-deferred across 14 portal pages; `window.VYVE_AUTH_READY` promise refactor queued (this-week item) to unblock the deferred-script perf win. |

### Offline mode (shipped 17 April)

Portal operates offline for cached content. Members can view cached workouts/habits without connectivity.

---

## 9. Onboarding flow

Member pays via Stripe → redirects to `welcome.html` → **stream picker** (workouts / movement / cardio) → onboarding questionnaire → `onboarding` EF v78 → Supabase writes + persona assignment + habit assignment + stream-aware programme overview + weekly goals (5 targets) + recommendations + Brevo welcome email with PWA install steps + programme card. Phase 2 (`EdgeRuntime.waitUntil()`) writes the full 8-week workout JSON to `workout_plan_cache` in the background — only triggered when `stream==='workouts'`.

Supabase Auth user created directly by the onboarding EF. No Make, no Auth0.

Welcome email via Brevo includes programme overview card + iOS/Android PWA install steps. Stripe coupons `VYVE15` and `VYVE10`. Annual discount % TBD (Lewis to decide).

### Questionnaire — Section A (About you)

Order (post 27 April 2026 reorder): First name + Last name (input-row) → Email + Confirm email (input-row, paired) → Mobile (own q-group, optional) → DOB + Gender (input-row) → Where are you based.

### Questionnaire — Section C (Physical Health, Workouts branch) field reference

Engine-relevant inputs from the Workouts stream after 27 April 2026 alignment:

- `location-train` (single, mandatory): `Full commercial gym` | `Basic gym` | `Home` | `Hotel gym` | `Mixed` | `Not sure`
- `equipment` (multi, conditional — shown for Home / Hotel gym / Mixed / Not sure; hidden for Full commercial gym + Basic gym): `Bodyweight only` | `Resistance bands` | `Dumbbells` | `Kettlebells` | `Barbell and weights` | `Machines` | `Cables`
- `gymExperience` (single, mandatory): `Beginner` | `Intermediate` | `Advanced` | `Returning` (mapping for Returning to be defined at engine-build restart — likely Beginner with elevated Joint Friendliness weight)
- `trainDays` (single, mandatory): `1-2` | `3` | `4` | `5+` | `Not sure`
- `sessionLength` (single, **NEW 27 April 2026, not yet persisted by EF**): `15` | `20` | `30` | `45` | `60` (minutes)
- `priorityMuscle` (single, **NEW 27 April 2026, not yet persisted by EF**, optional): `Glutes` | `Arms` | `Back` | `Chest` | `Shoulders` | `Legs` | `None` — drives the "Priority muscle selected" context weight in Calum's scoring table

Injury flags kept as-is at Dean's call (no expansion to pregnancy/HBP/60+/recent injury/deconditioned in this pass): `Shoulders` | `Knees` | `Hips` | `Back / spine` | `Wrists` | `Ankles` | `None`. Free-text avoid-exercises field also retained.

**Persistence gap (carries into engine-build restart):** `sessionLength` and `priorityMuscle` are POSTed to onboarding EF v78 but the EF doesn't read or save them. Members onboarding pre-restart fill the fields but answers are dropped. Add columns to `members` + bump EF to v79 in Stage 3 of the parked workout-engine work.

### Movement and Cardio streams

Movement stream still routes through legacy AI generation (no engine yet — separate movement engine planned post workout-engine v2). Cardio stream goes through `running-plan.html` + `anthropic-proxy` v16.

---

## 10. AI personas

Five personas live in `personas` table with full system prompts.

| Persona | Character |
|---|---|
| **NOVA** | High-performance coach. Driven, data-led, precision-focused. Metrics and measurable progress. |
| **RIVER** | Mindful wellness guide. Calm, empathetic, holistic. Stress, sleep, emotional balance. |
| **SPARK** | Motivational powerhouse. Energetic, warm, challenge-driven. Accountability. |
| **SAGE** | Knowledge-first mentor. Thoughtful, evidence-based. The "why". |
| **HAVEN** | Gentle mental health companion. Non-judgmental, trauma-informed. **Built and live but pending clinical review by Phil before promotion.** Until then, do not auto-assign in production. |

### Assignment rules

| Condition | Assignment |
|---|---|
| Stress ≤ 4 OR wellbeing ≤ 3 | RIVER or HAVEN (post-clinical-review) |
| Bereavement / mental health in Section G | HAVEN or RIVER only — never NOVA or SPARK |
| High training days + performance goal + low stress | Consider NOVA |
| Past barriers = motivation/consistency | Consider SPARK |
| Analytical style + wants to understand why | Consider SAGE |
| Serious life context flagged in Section G | Never NOVA or SPARK regardless of other signals |

---

## 11. AI features

### Portal AI (Dean — technical)

| Feature | Status |
|---|---|
| Onboarding recommendations (persona assignment + 3 first-week recs + programme overview) | LIVE (`onboarding` v78) |
| Running plan generator (`running-plan.html` + `anthropic-proxy` v16 + Supabase cache) | LIVE |
| Weekly check-in recommendations (persona-voiced AI recs) | LIVE (`wellbeing-checkin` v35) |
| Workout plan generator (8-week custom programme at onboarding via waitUntil) | LIVE (`generate-workout-plan` v11) |
| **Habits × HealthKit autotick** | **LIVE end-to-end (sessions 1 + 2 + 3 + 3a, 24–25 April 2026).** Schema + Lewis-approved seeds on `habit_library.health_rule`, server evaluator in `member-dashboard` v51 with `_shared/taxonomy.ts`, client UI in `habits.html` wired to v51 with pre-tick on auto-satisfied rows, `.hk-progress` hints on unsatisfied rows, done-state copy swap ("from Apple Health" vs "Logged to your progress") as the sole attribution mechanism — no visual badge. `notes='autotick'` on auto-written `daily_habits` rows persists the copy variant across reloads. Flag-gated via `HEALTH_FEATURE_ALLOWLIST` — Dean only today. |
| AI weekly goals (phase 1 targets set at onboarding) | LIVE |
| Weekly progress email (Friday, AI-generated, Brevo) | BACKLOG — blocked on Lewis copy template |
| Persona context modifiers (age 50+, beginner, time-poor, new parent) | BACKLOG |
| Session recommender (post check-in, mood/energy/time-aware) | BACKLOG |

### HealthKit autotick — what shipped in sessions 1 (7b), 2 (24 April 2026) + 3 (25 April 2026)

- `habit_library.health_rule jsonb` column added (nullable; null = manual-only).
- Two existing habits retrofitted with rules: `10-minute walk` (daily distance ≥ 1km) and `Sleep 7+ hours` (sleep-state sum ≥ 420 min last_night).
- Four new Lewis-approved habit seeds inserted (created_by `autotick-7b`): Walk 10,000 steps, Walk 8,000 steps, Complete a workout, 30 minutes of cardio. Thresholds defaulted per plan: 8k for 50+/beginner/non-NOVA, 10k for NOVA/high-training.
- Rule shape: `{source, metric, agg, window, op, value}`. Supported source values in v1: `daily` (`member_health_daily`), `samples_sleep` (`member_health_samples` sleep segments), `activity_tables` (workouts+cardio). Future-extensible: `vyve_nutrition`, `vyve_session_views`, `health_connect_daily`.

**Session 2 additions (server evaluator):**

- `member-dashboard` v51 deployed ACTIVE with `habits` block in response payload. Each active habit returns `habit_id`, `habit_pot`, `habit_title`, `habit_prompt`, `difficulty`, `has_rule`, `health_auto_satisfied` (bool or null), `health_progress` (`{value, target, unit}` or null).
- Evaluator routes per rule source: `daily` → `member_health_daily` lookup for today; `samples_sleep` → `member_health_samples` sleep rows in last-night window (yesterday 18:00 local to today 11:00 local); `activity_tables` → `workouts` + `cardio` for today.
- Snapshot-once pattern: all health data fetched in a single `Promise.all` batch, then each habit's rule evaluates against the in-memory snapshot — no N+1 per habit.
- Null-not-false: evaluator returns `{satisfied: null, progress: null}` when rule is null OR member has no HealthKit connection OR no data in window. UI will treat null as "manual-only", no disappointed blank tick.
- `_shared/taxonomy.ts` created as sibling file in both `member-dashboard` and `sync-health-data` deploys. Exports the workout-type constants (`STRENGTH_CANON` / `CARDIO_CANON` / `IGNORED_CANON` / `YOGA_CANON`), `classifyWorkout()` helper, `HealthRule` / `HealthProgress` / `HealthEvaluation` types, `applyOp()`, and UK time helpers (`ukLocalDateISO`, `lastNightWindow`). Both EFs now import from here instead of maintaining duplicates.
- `sync-health-data` v7 — pure refactor to import from `_shared/taxonomy.ts`. `promoteMapping` body preserved byte-identical to v6 (verified via substring check pre-deploy). Zero behaviour change.
- SQL-validated against Dean's live data across all 6 seeded rule shapes (distance, steps ≥8k, steps ≥10k, sleep ≥420min, workout_any, cardio_duration). Oracle results matched evaluator logic exactly.

**Session 3 additions (client UI):**

- `habits.html` now fetches `member-dashboard` v51 as a fourth parallel query (`fetchDashboardHabits()`) and merges the `habits` block into `habitsData` by `habit_id` (67/67 alignment verified against `member_habits.habit_id` pre-edit).
- Pre-render `runAutotickPass()` upserts a yes row for every habit where `has_rule === true && health_auto_satisfied === true && !logsToday[id]`, stamping `notes='autotick'` so the Apple Health origin persists across reloads.
- `.hk-progress` renders the progress bar + text on unsatisfied rule rows (`6.8 / 10 km`, `9,136 / 10,000 steps`, `294 / 420 minutes`, `18 / 30 minutes`). Done-state sub-label reads "from Apple Health" on auto-ticked rows, "Logged to your progress" on manual-yes rows (session 3a).
- Editing bug fix confirmed already live on entry: upsert-on-conflict in `logHabit`, DELETE-based Undo in `undoHabit`, unique constraint `daily_habits_member_habit_date_unique` present on DB, 0 duplicates.
- `vyve_habits_cache` localStorage key bumped to `vyve_habits_cache_v2` so stale pre-session-3 payloads (missing the new fields) get cleanly ignored on first load.
- No server changes this session. No SQL DDL. No SW cache bump (HTML-only; network-first since 21 April). `cap_daily_habits` confirmed 10/day (not 1/day) — master corrected.

Feature complete. Plan closed at `plans/habits-healthkit-autotick.md`.

### Operational AI (Lewis — 24 built skills)

| Skill | Cadence |
|---|---|
| Daily Intelligence | Weekday morning — 6 intelligence areas, top 3 actions, 7-day dedup cache. |
| Content Engine | Daily (3 posts) — LinkedIn, Instagram, Facebook from single podcast source. 9-day rotation. |
| Sales Intelligence | Pre-call — 8-step deep dive, ROI calc, 20-competitor displacement table, objection scripts. |
| Research Radar | Weekly — 4 credibility tiers, 20+ indexed studies, Stat Bank. |
| Competitor Deep Dive | Weekly — 20+ competitors, threat/opportunity matrix, countermeasures. |
| Client Health Monitor | On-demand — Green/Amber/Red scoring, 15+ early warning signals, tiered retention plays. |
| Investor & Growth Tracker | Monthly — UK health tech funding, KPIs, grant calendar (5 UK grants), Series A prep. |
| + 17 more frameworks | Personal Brand Architect, Partnership Finder, Regulatory Compliance Watch, Weekly Strategic Digest, Quality Monitor, plus 12 reusable frameworks. |

---

## 12. Automated operations — workflows & cadences

### Daily

- Morning brief (weekday) — 6-area intelligence scan, top 3 actions.
- Social content (3 posts) — LinkedIn, Instagram, Facebook. 9-day queue.
- Engagement ritual (weekday noon) — structured 30-min community playbook.
- Publishing monitor — Make.com publisher error detection.

### Weekly

- Strategic digest (Monday 8am) — synthesis from 9 JSON data sources.
- Competitor deep dive.
- Research radar.
- Analytics feedback — cross-platform engagement via Make.
- Content intelligence — performance synthesis + next brief.

### Monthly

- Content calendar (month-end) — 25 pieces across 4 themed weeks.
- Thought leadership (1st of month) — macro-trend synthesis for external distribution.

### Make social analytics

Scenario 4993944 (IG), 4993948 (FB), 4993949 (LinkedIn) → Data Store 107716.

**Social publisher Scenario 4950386 — BROKEN since 23 March. 133 posts stuck. Lewis to fix.**

---

## 13. Employer & member dashboards

### Employer dashboard

Live at `www.vyvehealth.co.uk/vyve-dashboard-live.html`. Served by `employer-dashboard` v31. API-key auth via `EMPLOYER_DASHBOARD_API_KEY`. **Aggregate only — no PII ever visible to employers.** Active = 0–7 days inactive · Quiet = 8–30 · Inactive = 30+ or never.

Trial/test data only today. Per-employer Auth-gated URLs (e.g. `/sage`) build when first enterprise trial starts.

### Member dashboard

Single call to `member-dashboard` v51. Cache-first — renders instantly from localStorage on return visits, skeleton on first load, silent background refresh. Server-authoritative hydration on every page load (HealthKit flag is `HEALTH_FEATURE_ALLOWLIST` in the EF, not localStorage).

Engagement score 0–100 ring. Activity + Consistency + Variety + Wellbeing components (12.5 points each). Base 50.

5 progress tracks: Daily Habits (The Architect), Workouts (The Warrior), Cardio (The Relentless), Sessions Watched (The Explorer), Weekly Check-ins (The Elite). 30-activity milestone certificates.

### Admin console

`admin.vyvehealth.co.uk/admin-console.html` — live with Shell 1 (member viewer) + Shell 2 (pencil-click edits) + Shell 3 Sub-scope A (programme / habits / weekly-goals panels with shared reason modal). Sub-scope B (bulk ops + multi-select) queued behind browser-side JWT smoketest on Sub-scope A. Shell 2 E2E smoketest still pending.

All admin writes audited to `admin_audit_log`. 16 live audit rows (10 from Sub-scope A smoketest, 6 from earlier). `toggleSection` had a latent Shell 2 bug (missing audit-log dispatch) — fixed during Sub-scope A ship.

---

## 14. Workout library & exercise architecture

| Programme | Detail |
|---|---|
| Push/Pull/Legs (PPL) | 11 workout days (Legs A + B). |
| Upper/Lower | 8 workout days. |
| Full Body | 7 workout days. |
| Home Workouts | 7 workout days. |
| Movement & Wellbeing | 7 content tabs. |
| Total in Supabase | 297 rows in `workout_plans` across ~40 workout days. |

**Cache.** `workout_plan_cache` — one row per member, full 8-week JSONB programme. Generated at onboarding in background (Phase 2 waitUntil).

**Architecture.** All 5 plans available. AI recommends weekly schedule, not plan selection.

**Custom workouts.** `custom_workouts` table — member-created sessions.

**Exercise logs.** Plan-agnostic `exercise_logs` stores all sets/reps/weight permanently (274 rows live).

**Exercise Hub restructure (shipped 19 April).** Option A design. `exercise.html` as hub, streams as sub-pages (`workouts.html`, `movement.html`, `cardio.html`). `members.exercise_stream` column (default `workouts`; 18 members backfilled). Welcome flow includes stream picker.

Still open: movement plan content in `programme_library` (no rows with `category='movement'` yet), `programme_library.category` column to distinguish movement vs gym, backfill decision for existing members, Classes stream on the hub, hub progress across all streams vs just primary.

---

## 15. Marketing, brand & content production

### Brand identity

| Element | Detail |
|---|---|
| Marketing site | `www.vyvehealth.co.uk` (GitHub Pages, `Test-Site-Finalv3`). |
| Brand palette | `#0D2B2B` (dark), `#1B7878` (teal), `#4DAAAA` (teal-light), `#c9a84c` (gold). |
| Fonts | Playfair Display (headings), DM Sans / Inter (body). |
| Homepage | Three audience paths: Individual / Employer / Members Area. |
| Legal pages | `privacy.html` + `terms.html` live. |
| Podcast page | `vyvehealth.co.uk/vyve-podcast.html`. 35+ episodes. Rebranded: *The Everyman Podcast* → *The VYVE Podcast*. |
| Key message | Prevention over cure. Build health before it breaks. |
| Image strategy | Google Gemini. Always append: *"Colour grade: deep teals and greens, warm highlights, no text, no logos."* |
| Brand brain | 16-section knowledge base (Lewis's Claude project). |
| Member welcome pack | 8-page A4 deck: mission, features, app, live sessions, monthly themes, podcast, charity, getting started. |

### Content production

- Social queue: 133 posts queued. Pipeline (Make Scenario 4950386) broken since 23 March.
- Content target: 10–14 posts/week. Currently ~6/week due to publisher outage.
- Pre-recorded sessions target: 30 videos. Workflow: Claude script → ElevenLabs → Audacity → stock footage → CapCut → Castr. Scope cap: exactly 30 before hiring instructors.

### CIPD 2025 crisis statistics (sales-critical)

- £150bn annual cost of ill health to UK economy.
- 9.4 days average sickness absence per employee (24-year high).
- 41% of long-term absence driven by mental ill health.
- 2.8M economically inactive due to long-term health conditions.
- 37% of UK employers still purely reactive — market opportunity.
- 5–8% average EAP utilisation — VYVE's gamification directly addresses this gap.

### 15A. Lewis's origin story & The VYVE Podcast

Lewis nearly lost his life to addiction, standing on a train platform watching trains pass. Honest conversations — first with himself, then with people who mattered — saved him. That lived experience is the authentic foundation of VYVE's mission and mental-health positioning.

*The Everyman Podcast* launched Feb 2023 with one founding rule: no topic off limits. Men's health, mental health, addiction recovery, purpose, performance. 35+ episodes with guests including Matthew Jarvis, Calum Denham, Luke Ambler, Ray Winstone, Dr Tamara Russell, David Wetherill, 3 Dads Walking. Available on Spotify, Apple Podcasts, Amazon Music.

Rebrand *The Everyman* → *The VYVE Podcast* in progress. Guest expression-of-interest form live on `vyve-podcast.html`.

---

## 16. GDPR, compliance & legal

| Document | Status |
|---|---|
| ICO registration | 00013608608 — registered March 2026, £52/year |
| DPA | Complete — swap client name before sending |
| DPIA | Complete — next review September 2026 |
| Data retention policy | Complete |
| Breach notification procedure | Complete |
| Privacy Policy | Live (`privacy.html`) |
| Terms of Service | Live (`terms.html`) |
| Compliance calendar | Live — CIC36, DPIA reviews, insurance, HSE audits |
| Google SCCs | Not in place — personal Google account. Migrate post-first-enterprise-contract. |
| External DPO | Required before 500 members. Budget £2–5K/year. |
| Employer reporting | Aggregate only — no individual names ever. |
| RLS | All 70 tables have RLS enabled (9 April audit). |
| WHISPA programme | £3.7M research launching May 2026 — potential research partnership. Monitor. |

---

## 17. Charity mechanic

**Individual track.** Every 30 completions of a specific activity type = 1 free month donated to a charity partner recipient.

**Enterprise track.** Every 30 activities collectively by a company's members = 1 free month donated.

**Framing.** Collective impact — the team's activity funds access for people in need via VYVE's charity partners. Not a personal referral reward. Central to CIC positioning and social-impact narrative.

**Charity partner categories.** Addiction recovery · homelessness & reintegration · mental health organisations · social mobility programmes · physical health access for underserved populations.

**Partner economics.** £0 cost to charity partners to refer recipients. £0 cost to recipients. Counters reset after each 30 activities — unlimited donations possible. Milestone certificates awarded automatically.

First named charity partner confirmed late April 2026.

---

## 18. Website structure & live pages

| Page | Role |
|---|---|
| `index.html` | Homepage — dual Individual/Employer paths. |
| `individual.html` | Five pillars, pricing, Give Back. |
| `about.html` | Origin story, values, CIPD stats, founding team. |
| `give-back.html` | Charity mechanic explainer. |
| `roi-calculator.html` | Interactive ROI with CIPD 2025 benchmarks. |
| `vyve-podcast.html` | 35+ episodes, guest form, Spotify/Apple/Amazon links. |
| `privacy.html` · `terms.html` | Legal. |
| `employer.html` | **Currently 404 — not built yet.** |
| `welcome.html` | Post-payment onboarding (stream picker + questionnaire). |
| `vyve-dashboard-live.html` | Employer dashboard for account management. |

Hosted via GitHub Pages (`Test-Site-Finalv3`). Domain routes via Cloudflare. Portal pages are PWA-enabled with offline capability.

---

## 19. Current status — 27 April 2026

### Completed — Dean (technical)

- Supabase Pro. **74 public tables**, ~25 core operational Edge Functions, SQL functions for activity caps + charity totals.
- Supabase Auth migration complete. Auth0 gone. `auth.js` v2.2 live.
- All portal pages live: index, habits, exercise, workouts, movement, cardio, nutrition, log-food, settings, certificates, engagement, leaderboard, sessions, wellbeing-checkin, monthly-checkin, running-plan, welcome, login, set-password, strategy. Plus parked: apple-health, activity.
- Theme system (dual dark/light tokens) live. `nav.js` body-prepend pattern. Cache-first dashboard. Consent gate built and wired. Viewport zoom disabled. `target="_blank"` audit complete.
- Service worker network-first for HTML + skipWaiting + clients.claim (21 April) — HTML changes reach users on next reload without cache bumps.
- Activity logging via `log-activity` v21 (Make retired from Dean's stack).
- Re-engagement system live — streams A/B/C1/C2/C3, `engagement_emails` live.
- Certificate automation — `certificate-checker` v24, global sequential numbers, Brevo delivery.
- Running plan generator — Haiku 4096 max_tokens, Supabase-first, `member_running_plans` table.
- **Admin Console Shell 1 + 2 + 3 Sub-scope A** — live at `admin.vyvehealth.co.uk`.
- **Exercise Hub (19 April)** — stream-aware onboarding, hub page, movement + cardio sub-pages, running plan server-side storage.
- **Leaderboard refactor (21 April)** — privacy-aware, classic top-100, range selector, scope tabs, anonymous banner, tie-aware gap copy.
- **HealthKit integration (iOS)** — 7 read scopes + 1 write (weight). Device-validated on iPhone 15 Pro Max. `@capgo/capacitor-health@8.4.7` wired via SPM. Session 6 pipeline rebuild: `queryAggregated`-based `member_health_daily`, BST bucket bug squashed, sleep_state coverage verified, scale-to-app weight round-trip validated.
- **Autotick session 7a (24 April)** — source-aware workout/cardio caps, `sync-health-data` v6 stamps `source:'healthkit'`, `queue_health_write_back` nested-conditional fix.
- **Autotick session 7b (24 April)** — `habit_library.health_rule` column, 2 retrofits + 4 new Lewis-approved seeds.
- **Autotick session 2 (24 April)** — `member-dashboard` v51 server evaluator, `_shared/taxonomy.ts` shared module, `sync-health-data` v7 refactor.
- **Autotick session 3 (25 April)** — `habits.html` wired to v51 `habits` block (fourth parallel fetch), pre-render autotick pass stamping `notes='autotick'`, `.hk-progress` hints, cache key bumped to `vyve_habits_cache_v2`. No server or SQL changes.
- **Autotick session 3a (25 April)** — `.hk-badge` dropped (phantom "pending Lewis sign-off" dependency proven non-existent), replaced with copy-only attribution on done-state sub-label. Feature LIVE end-to-end.
- `member_home_state` aggregate with real-time trigger maintenance wired to 10 source tables.
- `schema-snapshot-refresh` weekly cron, auto-committing structural changes to VYVEBrain.
- Push notifications live end-to-end (iOS Web Push via RFC 8291 AES-GCM encryption, user-gesture-triggered).
- 14 active members in `members` table across B2C + early enterprise trial seats (3 admin operators tracked separately in `admin_users` — total 17 platform identities). First paying B2C. First named charity partner.
- **iOS App Store 1.1 (3) submitted (27 April 2026)** — Capgo HealthKit plugin compiled into the binary. Asset pipeline rebuilt via `npx @capacitor/assets generate --ios` to the v3 single-icon scheme (1024×1024 universal `AppIcon-512@2x.png` replacing the legacy 60/76/83.5 multi-size convention). 6-output splash imageset (3 light + 3 dark, universal/anyany at @1×/@2×/@3×) generated from a 2732×2732 dark-teal canvas with the brand logo centred. Submitted via Xcode Organizer → App Store Connect, status "Ready for Review", auto-release on approval. The 26 April web rollout (`member-dashboard` v54, `healthbridge.js` v0.3 defensive `getPlugin`, three-state Settings UI, `HEALTH_FEATURE_ALLOWLIST` dropped) had already shipped to all iPhone members; this build closes the loop by putting the Capgo plugin inside the App Store binary so opted-in members get autotick on next app update.

### Completed — Lewis (commercial)

- 24 custom AI skills operational. 8+ automated recurring workflows.
- 133-post social queue. Social analytics pipeline (3 Make scenarios → Data Store 107716).
- Sales Intelligence infrastructure — pre-call briefs, displacement table, ROI calculator.
- Public Sector Sales Playbook — 5 procurement routes.
- Three Pillar Assessment — employer-facing prospect tool.
- VYVE Brand Brain — 16-section knowledge base.
- Member Welcome Pack — 8-page deck.
- Research Library — 20+ indexed studies, Stat Bank.
- Competitive intelligence — 20+ competitors tracked.
- 35+ podcast episodes catalogued on branded page.

---

## 20. Enterprise contract blockers

| Item | Owner | Status |
|---|---|---|
| Brevo logo removal (~$12/month) | Lewis | OPEN |
| Facebook Make connection refresh | Lewis | **CRITICAL — EXPIRES 22 MAY 2026** |
| B2B volume tiers defined | Lewis + Dean | OPEN |
| Make social publisher fix (Scenario 4950386) | Lewis | DEFERRED (133 posts stuck since 23 March) |
| Health disclaimer wording | Lewis sign-off | PENDING |
| HAVEN clinical review | Phil | PENDING — persona built but held from promotion |

---

## 21. Outstanding build items & priorities

**PRIORITY #1 — App Store reviews in flight:** iOS 1.1 (3) submitted to App Store Connect on 27 April 2026 with Capgo HealthKit plugin compiled in (status: Ready for Review, auto-release on approval). Android 1.0.2 awaiting Google Play review since 15 April resubmission (icon-fix). Once iOS approves, all opted-in iPhone members get autotick cohort-wide on next app update. **New top priority post-approval: polish + bug-fix pass + execute Achievements + In-App Tour build pipeline (designed 26 April)** — these are the headline UX wins for the May sell-ready milestone.

### Critical missing pieces (MVP-blocking)

1. Native push notifications (APNs + FCM via Capacitor). VAPID web push currently covers PWA. 2–3 sessions estimated.
2. ~~Habits editing bug~~ **SHIPPED pre-session-3** — upsert on conflict + Undo (DELETE) + unique constraint all confirmed live on DB and in `habits.html` on 25 April 2026 entry audit. No further work needed.
3. HealthKit launch rollout — gating sequence completed 26 April (web): `member-dashboard` v54 with hydration globals, `healthbridge.js` v0.3 with defensive plugin lookup, three-state Settings UI, `HEALTH_FEATURE_ALLOWLIST` dropped in favour of `member_health_connections` row presence as the truthsource. Web layer is fully rolled out for all iPhone members. **Final remaining piece: Apple Review approval of 1.1 (3) puts the Capgo plugin in the App Store binary** — at which point any opted-in iPhone member upgrading from PWA to native gets autotick. Consent-gate fresh-signup flow E2E test still pending (requires a clean signup; not yet done).

### This weekend's active priorities

- Android icon fix (resubmitted 15 April, awaiting Google review).
- ~~iOS icon fix (app live but icon wrong, Build 2 uploaded).~~ ✓ **SHIPPED 27 April** — version bumped to 1.1 (3), Capgo HealthKit plugin compiled in, asset pipeline rebuilt to `@capacitor/assets` v3 single-icon scheme, all 5 Xcode asset warnings cleared (4 silenced by the modern single-1024 universal scheme; 5th was orphaned splash files from a previous Capacitor convention, manually rm'd). Submitted to App Store Connect awaiting Apple Review.
- Exercise restructure — Rounds 1–5 shipped, still open: movement plan content in `programme_library`, `category` column, existing-member backfill decision, Classes stream, hub progress aggregation, `mrpSetCompletion` race-unsafe GET-then-PATCH (acceptable for MVP).
- Admin Console Sub-scope A browser smoketest. Then Sub-scope B (bulk ops + multi-select).
- Polish and bug-fix pass.
- **Target: sell-ready May 2026.**

### This week

- `auth.js` ready-promise refactor (`window.VYVE_AUTH_READY`) — unblocks deferred-script perf win.
- Tech debt: `#skeleton` + `#app` dual-main DOM on `exercise.html` + `movement.html` — migrate to single `#app` with internal skeleton state.
- ~~HealthKit autotick session 3~~ ✓ SHIPPED 25 April — feature LIVE end-to-end across sessions 1/2/3/3a. Attribution is copy-only ("from Apple Health" in the done sub-label); the badge scaffold idea was dropped as a phantom dependency. Nothing remaining on this workstream.
- Calendar integration (Google/Apple) + calendar page in portal.

### Soon

- Weekly check-in slider questions — update to mirror initial questionnaire questions.
- Push notification permission request (Capacitor flow).
- Re-engagement automations (3) — 7-day no login, questionnaire incomplete, registered no activity. Lewis owns email copy.
- Live viewer count on session pages — only display when 20+ viewers.
- AI weekly goals system (phase 2) — blocked on check-in page + Lewis email copy.
- Weekly progress summary email (Friday, AI-generated, Brevo) — blocked on Lewis copy.
- Today's Progress dot strip — blocked on Lewis copy approval.
- Persona context modifier system.
- PostHog / Supabase Auth identity wiring.
- Milestone message system.
- Social activity feed (activity-only, no comments/photos in v1) — scoped and back-burnered.
- Wearable integration (HealthKit deepen + Health Connect) — HealthKit live, Health Connect deferred (session 1 plan complete, device work paused).
- HealthKit background sync — **parked 25 April 2026** as future vision. Full investigation + parked plan at `plans/healthkit-background-sync.md`. Scoping confirmed Capgo 8.4.7 exposes zero background primitives; architectural path would be a companion Swift Capacitor plugin (~400 lines) alongside Capgo, ≈4–5 build sessions + 1 week device soak + App Store review cycle. Not a priority until the Capacitor wrap is on the App Store and a real member/enterprise signal justifies the work.
- National Lottery Awards for All application.
- The Fore grant — register June/July 2026.
- WHISPA research partnership — monitor May 2026 launch.

### Backlog — security & hygiene

- Edge Functions deletion pass — security audit (9 April) identified ~89 dead EFs; partial cleanup, more remain.
- Anon-key rotation (admin console).
- Brain hygiene — base64-encoded historical blob in `brain/changelog.md` (~152K decoded chars) — cleanup session pending.

---

## 22. Open decisions

- B2B volume discount tiers — formally define before first enterprise contract.
- Annual pricing discount % — Lewis decision, Dean adds to Stripe once confirmed.
- Weekly check-in slider questions — map to onboarding questionnaire wording.
- Health disclaimer wording — draft ready, Lewis sign-off.
- Make social publisher fix timing — deferred by Lewis.
- Wellbeing Scorecard — host on live domain. Which URL? Who builds form submission?
- Today's Progress strip — Lewis to approve copy before building.
- Podcast rebrand timing — *The Everyman* → *The VYVE Podcast* — when to switch fully.
- HAVEN go-live — Phil's clinical review.
- `VYVE_Health_Hub.html` go-live — Phil's clinical review of assessment instruments, scoring/risk thresholds, and signposting copy. Page is staged in web root; promote to nav once approved.
- Google Workspace migration (`team@vyvehealth.co.uk`) — post-first-enterprise-contract.
- External DPO service — required before 500 members.
- 5 disabled Make tasks — keep or remove: LinkedIn article, podcast brief, LinkedIn newsletter, PR pitch, employee advocacy pack.
- Autotick evaluator multi-source arbiter — when/if a future member has two sources (HealthKit + Fitbit).

---

## 23. Known gotchas & architecture rules

| Rule | Detail |
|---|---|
| **Auth** | Supabase Auth is primary. Auth0 gone entirely. Never say "Auth0 gated". |
| **GitHub writes** | `vyve-site` is read-only via direct GitHub MCP — always 403. Writes via `github-proxy` v21 or one-shot EFs. For **large brain commits (>~50K chars), always use `run_composio_tool("GITHUB_COMMIT_MULTIPLE_FILES", args)` inside the Composio workbench — never direct MCP — to avoid base64 corruption.** Always verify post-commit by fetching and checking the first 100 chars. |
| **`upserts` not `files`** | In `GITHUB_COMMIT_MULTIPLE_FILES`: array field is `upserts`, commit text field is `message` (not `commit_message`). |
| **File read patterns** | `GITHUB_GET_RAW_REPOSITORY_CONTENT` returns an S3 URL needing a secondary fetch — S3 URLs expire fast, save to `/tmp/` immediately. `GITHUB_GET_REPOSITORY_CONTENT` returns nested `data.content.content` base64 — strip whitespace with `re.sub(r'\s+', '', b64)`, pad, then decode. |
| **`SUPABASE_APPLY_A_MIGRATION` silently partial-executes** | Multi-statement SQL can succeed at the tool level while only part has actually applied. For reliable trigger creation use `SUPABASE_BETA_RUN_SQL_QUERY` with `read_only:false`, one statement per call. Always verify trigger creation via `pg_trigger` directly — not `information_schema.triggers`. |
| **Trigger functions writing to RLS tables** | Must be `SECURITY DEFINER`, not `SECURITY INVOKER`. |
| **plpgsql composite-type gotcha** | Shared trigger functions attached to multiple tables must not reference `NEW.<col>` for a column that exists only on some of them, even inside IF guards. plpgsql compiles the reference against the specific table's composite type before short-circuit evaluation. Use `to_jsonb(NEW) ->> 'col'` for defensive cross-table access. Codified 24 April (`queue_health_write_back` crashed on workouts INSERTs for HK-connected members). |
| **Activity cap source-discrimination** | Original 2/day caps were spam prevention — wrong for Apple Watch members doing 3+ workouts/day. Since 7a, caps only apply to `source='manual'`. Charity + cert counters stay independently capped via read-path `LEAST(COUNT(*), 2)` and `existing_count < 2` checks — lifting the trigger cap inflates nothing downstream. |
| **BST timezone bug** | Always construct local dates via `d.split('-')` → `new Date(+y, +m-1, +d)` in portal JS. `new Date(dateString)` parses as UTC and drifts by an hour in BST. Recurring class of bug. |
| **`esm.sh` unreliable in Deno** | Use Deno built-ins (Web Crypto, std library) for crypto. Codified from iOS Web Push RFC 8291 work. |
| **`first_name` location** | `members` table, not Supabase Auth `user_metadata`. |
| **SW cache bump** | Pattern `vyve-cache-v[date][letter]`. Since 21 April network-first for HTML means HTML-only changes don't require a bump; non-HTML (JS, CSS, images) still do. |
| **Cloudflare email obfuscation** | Rewrites emails on `www.vyvehealth.co.uk`. Wrap emails in `email_off` comment tags. |
| **Never "Kahunas"** | Product is "VYVE Health app" in member copy. |
| **Never "Corporate Wellness"** | Not used as tagline or descriptor. |
| **Anthropic key location** | Server-side in Edge Functions only. Never in HTML or committed to GitHub. Stored as Supabase secret. |
| **HAVEN safeguarding** | Must signpost professional help in crisis. Clinical review required before go-live. |
| **NOVA/SPARK restriction** | Never assign with serious life context flagged in Section G. |
| **Brevo logo** | Free plan injects "sent via Brevo" footer. ~$12/month upgrade removes it. Pending before enterprise demo. |
| **Google Workspace** | `team@vyvehealth.co.uk` is a personal Google account. Migrate post-first-enterprise. |
| **Gemini imagery** | Always append: *"Colour grade: deep teals and greens, warm highlights, no text, no logos."* |
| **Live session badges** | Green (`#22c55e`), never red. |
| **`weekly_goals` dedupe** | Unique constraint on `(member_email, week_start)`. Safe to re-run onboarding. |
| **iOS Web Push user gesture** | Must be triggered from a user gesture (button click), not page load. RFC 8291 AES-GCM encryption mandatory. |
| **Employment Rights Act** | SSP changes 6 April 2026 — strongest current economic argument for preventative wellbeing. Use in all sales conversations. |
| **Theme system** | All portal pages use dual dark/light CSS token blocks. Never single `:root`. Always include `theme.js` before closing `head`. |
| **EF deploys** | Always require full `index.ts`. `verify_jwt:false` for public-facing. |
| **Capacitor #1 priority** | PWA is ready to wrap. Primary business goal. |
| **Website footer** | Standardise all footers to "VYVE Health CIC" (not "Ltd") — legal structure. |
| **Enterprise references** | Named prospects not included in brain or investor docs. Use generic language. |
| **Pre-launch / staging files in `vyve-site` root** | "No inbound links + no backend wiring" is NOT a sufficient signal that an HTML file is orphaned. Some files are staged in the web root unlinked from nav while waiting on a clinical/Lewis/Phil sign-off (e.g. `VYVE_Health_Hub.html`). Never archive or delete a substantial standalone HTML file from `vyve-site` without confirming with Dean first. Codified 26 April after I incorrectly archived `VYVE_Health_Hub.html` and Dean reverted me. |
| **`GITHUB_COMMIT_MULTIPLE_FILES` deletes shape** | `upserts` takes objects `{path, content, sha?}` but `deletes` takes a flat array of path strings, not objects. Mixed shape — the API rejects `[{path, sha}]` for deletes with a "valid string" validation error. |
| **App Store icon must be RGB no-alpha** | App Store Connect rejects PNGs with an alpha channel even when alpha is uniformly 255. RGBA-fully-opaque is NOT acceptable — must be flat RGB. Flatten via PIL: `Image.new("RGB", size, bg).paste(rgba, (0,0), rgba)` before submission. Codified 27 April. |
| **`@capacitor/assets` v3 single-icon scheme** | Modern Xcode 14+ reads a single `AppIcon-512@2x.png` at 1024×1024 universal from `AppIcon.appiconset/`. Legacy 60/76/83.5 multi-size slots are no longer in spec. Tool rewrites `Contents.json` to single-entry universal — running `npx @capacitor/assets generate --ios` once silences all multi-size warnings. Codified 27 April. |
| **Sharp on Apple Silicon** | `npm install --include=optional sharp` is required on M-series Macs before any `@capacitor/assets` or other sharp-using tool will run. Sharp 0.33+ moved prebuilt platform binaries into optional dependencies; default `npm install` skips them. Codified 27 April. |
| **`@capacitor/assets generate` doesn't clean up orphans** | Files from previous-convention naming (e.g. `splash-2732x2732*.png` from pre-v3) remain in the imageset directory after regeneration. Manually `rm` any files not referenced in the regenerated `Contents.json`, otherwise Xcode flags "N unassigned children". Codified 27 April. |
| **Canonical brand icon source** | `online.vyvehealth.co.uk/icon-512.png` is the PWA install icon — fully opaque, brand-correct, what members already see on home screens. Lanczos upscale 512→1024 + RGB flatten on `#0D2B2B` is App Store-acceptable. The other portal logo `logo.png` is 500×500 with real transparency (alpha extrema 0–255) — usable in-app on a teal background, NOT usable as App Store icon source. Codified 27 April. |
| **App Privacy carries forward across versions** | Once 1.0 publishes Health + Fitness data types, 1.1 inherits without re-attestation. Apple maps HealthKit's 7 read scopes onto those two umbrella categories (steps/distance/active-energy/workouts → Fitness; heart-rate/weight/sleep → Health). Don't expect the data-type wizard to re-trigger on minor version bumps. Codified 27 April. |
| **Distribute App: uncheck "Manage Version and Build Number"** | When agvtool has set the version locally, Xcode's distribute-time auto-bump leaves Info.plist drifted from the App Store Connect record. Always uncheck if you've used agvtool for the bump. Codified 27 April. |
| **agvtool "Jambase targets" preamble** | Harmless. agvtool falls through to native targets and writes the version correctly. Don't be alarmed by the preamble line "No marketing version number found for Jambase targets". Codified 27 April. |
| **`vyve-capacitor` is NOT a git repo** | Operational risk. Currently fine while changes are mostly asset/version-bump deltas, but becomes painful once native source edits start (Swift plugins, custom Capacitor plugins). Two-line fix when ready: `git init && git add . && git commit -m "Initial commit"` from `~/Projects/vyve-capacitor`. Backlog. |
| **AppDelegate.swift bridge methods required for Capacitor PushNotifications** | Without `application(_:didRegisterForRemoteNotificationsWithDeviceToken:)` and `application(_:didFailToRegisterForRemoteNotificationsWithError:)` posting `.capacitorDidRegisterForRemoteNotifications` / `.capacitorDidFailToRegisterForRemoteNotifications` to `NotificationCenter`, the registration event never fires. Symptoms: `getState()` shows plugin found, permission granted, listeners attached, no error — but no token row. Audit `AppDelegate.swift` against every Capacitor plugin's iOS setup section before any future archive — installing the npm package is necessary but not sufficient. Codified 27 April 2026 PM. |
| **Service-role-guarded EFs need the `sb_secret_*` value, not the legacy JWT** | When an EF compares `Authorization` against `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` literal, runtime-injected value post-key-rotation is the new `sb_secret_*` not the legacy `eyJhbGc...` JWT. `SUPABASE_GET_PROJECT_API_KEYS` without `reveal:true` returns the new key masked with bullets. ALWAYS pass `reveal:true` for manual workbench/curl invocations against service-role-gated EFs. Codified 27 April 2026 PM. |
| **App Store: `NSFaceIDUsageDescription` required even for unused biometric plugins** | `capacitor-native-biometric` or any plugin linking `LocalAuthentication.framework` gets compiled into the binary; Apple's binary scanner may flag missing `NSFaceIDUsageDescription` even with no JS calls. Defensively add via `/usr/libexec/PlistBuddy -c "Add :NSFaceIDUsageDescription string '<copy>'" Info.plist`. Codified 27 April 2026 PM. |
| **Composio `SUPABASE_UPDATE_A_FUNCTION` corrupts deployed bundles** | Confirmed reproducer 28 April: deploy a working stub via `SUPABASE_DEPLOY_FUNCTION` (status 200), then call `SUPABASE_UPDATE_A_FUNCTION` with byte-identical body — next invoke returns persistent BOOT_ERROR. Affects body regardless of source format. Metadata changes (verify_jwt) DO take effect, but the bundle gets mangled. **Always use `SUPABASE_DEPLOY_FUNCTION` for body changes.** UPDATE is unsafe except for slug/name renames. Codified 28 April 2026. |
| **`SUPABASE_DEPLOY_FUNCTION` has no verify_jwt param — defaults true** | Combined with the UPDATE corruption rule above, this means we cannot reliably set `verify_jwt:false` on Composio-deployed EFs. With `verify_jwt:true` the gateway accepts only JWT-format tokens and rejects `sb_secret_*` with `UNAUTHORIZED_INVALID_JWT_FORMAT`. Codified 28 April 2026. |
| **Dual-auth pattern for service-role-guarded EFs** | Workaround for the verify_jwt-stuck-true situation. Save the legacy service-role JWT as a non-`SUPABASE_*`-prefixed secret (`LEGACY_SERVICE_ROLE_JWT`). Have the EF's guard accept `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` (= `sb_secret_*`) OR `Bearer ${LEGACY_SERVICE_ROLE_JWT}`. External callers (workbench INVOKE, Composio) use the legacy path; internal EF→EF callers can use either. send-push v11 is the canonical implementation. Codified 28 April 2026. |

---

## 24. Key references, credentials & URLs

| Reference | Value |
|---|---|
| Supabase project ID | `ixjfklpckgxrwjlfsaaz` (West EU / Ireland, Pro) |
| Service account | `supabase_palli-wode` |
| VAPID public key | `BDbz2-0k3JcqRWKyasr3MNgEZrXhKsVvjS-otCyyV7Ya4Pi2xXOxXGETUpVoE56VorKzSNy7uyep53gOzNEMTu4` |
| PostHog key | `phc_8gekeZglc1HBDu3d9kMuqOuRWn6HIChhnaiQi6uvonl` |
| Stripe payment link | `buy.stripe.com/00wfZicla1Em0NnaIB93y00` → `welcome.html` |
| Stripe coupons | `VYVE15`, `VYVE10` |
| HubSpot | `app-eu1.hubspot.com` · Hub ID 148106724 · Timezone Europe/London · Currency GBP |
| Strategy dashboard | `online.vyvehealth.co.uk/strategy.html` (password `vyve2026`) |
| Internal password | `vyve2026` |
| Demo reset URL | `online.vyvehealth.co.uk/index.html?reset=checkin` |
| VYVE logo | `online.vyvehealth.co.uk/logo.png` |
| Podcast page | `www.vyvehealth.co.uk/vyve-podcast.html` |
| Admin console | `admin.vyvehealth.co.uk/admin-console.html` |
| Make social publisher | Scenario 4950386 — BROKEN since 23 March |
| Make analytics collectors | Scenarios 4993944 (IG), 4993948 (FB), 4993949 (LinkedIn) → Data Store 107716 |
| Facebook connection expiry | **22 MAY 2026 — Lewis to renew urgently** |
| GitHub PAT | `GITHUB_PAT_BRAIN` — scoped to `VYVEHealth/VYVEBrain` Contents R/W. Expires **18 April 2027** (calendar rotation required) |

### Repos

- `VYVEHealth/vyve-site` — portal PWA (GitHub Pages at `online.vyvehealth.co.uk`).
- `VYVEHealth/Test-Site-Finalv3` — marketing/onboarding site (`www.vyvehealth.co.uk`).
- `VYVEHealth/VYVEBrain` — AI source-of-truth document store (this repo).
- `vyve-command-centre` — Lewis's internal ops dashboard + admin console.

### Composio / GitHub patterns (codified)

- Large files (>~50K chars): always commit via `run_composio_tool("GITHUB_COMMIT_MULTIPLE_FILES", args)` inside the Composio workbench, never direct MCP.
- `GITHUB_GET_RAW_REPOSITORY_CONTENT` → S3 URL needing secondary fetch; expires quickly, save to `/tmp/` immediately.
- `GITHUB_GET_REPOSITORY_CONTENT` → nested `data.content.content` base64; strip whitespace + pad + decode.
- Multi-file atomic commits: `upserts` array (not `files`); field is `message` not `commit_message`.
- Always verify large commits by re-fetching and checking the first 100 characters.

---

*End of VYVE Health brain master. Single source of truth. Full rewrite 24 April 2026 — supersedes all prior versions. Next rewrite when drift warrants, not by incremental patching.*
