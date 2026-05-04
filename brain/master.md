# VYVE Health — Brain Master

> Single source of truth for the whole business. Full rewrite 28 April 2026 PM (not a patch). Captures live state through iOS 1.2 approval + autotick sessions 1–3a + push notifications sessions 1 + 2 item 1 + sw.js handler patch inclusive. Supersedes the 24 April rewrite. If this drifts from live reality, rewrite it fully again — do not paper over.

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
| Cohort | Build/test cohort. ~15 rows in `members` table, mix of B2C + early enterprise trial seats + internal accounts. First paying B2C customer Paige Coult (joined 13 April, £20/month). 3 admin operators in `admin_users`. Live count via Supabase, not cached in brain. |
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
| B2C individual | £20/month per member. Stripe direct link. Onboarding via `welcome.html` (stream-aware since 19 April). First paying customer Paige Coult, signed up 13 April 2026. |
| B2B enterprise | £10/user/month. Contact-first sales. Volume tiers still TBD before first enterprise contract; indicative bands: 50–200 full rate, 201–500 negotiable, 500+ bespoke. |
| Annual option | 10–15% discount — Lewis decision, Dean adds to Stripe once confirmed. |
| Positioning | Performance investment, not cost centre. ROI evidence anchored by Deloitte, RAND Europe, Gallup, Lancet, Warwick, UCL, WHO. |
| Series A targets | £1–2M ARR, 10%+ MoM growth, sub-8% churn, 100%+ NRR. |

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
| iOS Capacitor app on App Store | 1.2 approved + Ready for Distribution (28 April) — bundles HealthKit + native push permission flow | LIVE |
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
| Native app delivery | `~/Projects/vyve-capacitor` (NOT a git repo — backlog) is the Capacitor project that bundles the `vyve-site` web shell into both store binaries. **iOS:** App Store as **VYVE Health 1.2** (approved 28 April 2026), with `@capgo/capacitor-health@8.4.7` + native APNs registration via `AppDelegate.swift` bridge methods. **Android:** Play Store live (both stores shipping the same web shell — single codebase, two binaries). The browser at `online.vyvehealth.co.uk` is an account-management fallback only — 100% of new members install via App Store / Play Store. |
| Brain | `VYVEHealth/VYVEBrain` — markdown source of truth, session-loaded at start of every Claude session |
| Authentication | Supabase Auth. **`auth.js` v2.3** gates every portal page. `VYVE_RETURN_TO_KEY` in localStorage. Admin Console uses separate admin-side session. |
| Primary datastore | Supabase — project `ixjfklpckgxrwjlfsaaz` (West EU/Ireland, Pro plan). 76 public tables as of 28 April 2026. |
| Portal AI | Anthropic API (Claude Sonnet 4). Server-side via Supabase Edge Functions only — never in committed HTML. Spend cap ~£50/month. |
| Operational AI | 24 custom Claude skills running daily/weekly/monthly intelligence, content, sales, and monitoring workflows for Lewis. |
| Automation | Make (Lewis only, social publishing). Dean uses `log-activity` EF directly — Make retired from Dean's stack. |
| Payments | Stripe. Live link: `buy.stripe.com/00wfZicla1Em0NnaIB93y00`. Coupons `VYVE15` and `VYVE10`. Redirects to `welcome.html`. First paying B2C: Paige Coult @ £20/month. |
| Email | Brevo — transactional SMTP API with custom HTML. No campaign builder, no Brevo branding injected. Verified sender `team@vyvehealth.co.uk` (ID 1, name "VYVE Health"). Proxy endpoint `smtp/email` (no `/v3/` prefix). ~$12/month upgrade still outstanding to remove the "Sent via Brevo" footer. |
| HealthKit integration | `@capgo/capacitor-health@8.4.7`. iOS device-validated. 7 read scopes (steps, distance, active energy, workouts, cardio, sleep, weight); 1 write scope (weight only — workout write-back unsupported by Capgo 8.4.7 on iOS, codified session 4). Cohort-wide post 1.2 approval (`HEALTH_FEATURE_ALLOWLIST` dropped 26 April; `member_health_connections` row presence is the truthsource). |
| Push notifications | Live end-to-end as of 28 April PM. Native APNs via `push-send-native` v5 (auto-revokes 410/400 BadDeviceToken) functional since early PM. Web VAPID via `send-push` v12 (RFC 8291 aes128gcm) functional since late PM — v11 had a silent bug in `makeVapidJwt` (`crypto.subtle.importKey('raw', …, ['sign'])` invalid for ECDSA private keys per Web Crypto spec, Deno enforces strictly), v12 fixes via `'jwk'` import with x/y reconstructed from the public key. Service worker `push` + `notificationclick` listeners shipped tonight (`vyve-site@124ecb53`). Reminder triggers (`habit-reminder` v14, `streak-reminder` v14) and `achievement-earned-push` v1 all delegate to `send-push` and inherit the fix automatically. |
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
| Kahunas | Replaced by the VYVE Health app. Never reference in member copy — product is "VYVE Health app". |
| Make (Dean) | Retired from Dean's stack. All activity writes via `log-activity` EF. |
| onboarding_v8.html | Superseded by `welcome.html`. |

---

## 6. Supabase architecture — 76 tables

Project `ixjfklpckgxrwjlfsaaz` (Pro plan, West EU/Ireland). All public tables have RLS enabled (April 2026 audit). Live row counts not tracked in brain — query Supabase directly or read the auto-refreshed `brain/schema-snapshot.md` (regenerated weekly Sunday 03:00 UTC by the `schema-snapshot-refresh` cron).

### Core member + activity (member-scoped RLS)

| Table | Purpose |
|---|---|
| `members` | Core member profiles. Email PK. Persona, welcome recs, goals, consent flags, `exercise_stream`. |
| `employer_members` | Employer–member relationships (empty until first enterprise goes live). |
| `daily_habits` | Habit completions. Cap 10/day via BEFORE INSERT trigger; over-cap routed to `activity_dedupe`. `notes='autotick'` distinguishes HK auto-ticked rows. |
| `workouts` | Workout completions. `source` column (`'manual'` vs `'healthkit'`). Cap 2/day for `source='manual'` only (since 7a, 24 April). HK-sourced rows bypass entirely. |
| `cardio` | Cardio completions. Same source-aware cap as workouts. |
| `session_views` | Live session views. Cap 2/day all sources. |
| `replay_views` | Replay views. |
| `qa_submissions` | QA test submissions. |
| `wellbeing_checkins` | Weekly check-in submissions with AI recommendations. |
| `weekly_scores` | Weekly dashboard scores (wellbeing_score + engagement_score). |
| `weekly_goals` | First-week onboarding goals per member. Live-computed from activity tables. |
| `activity_dedupe` | Over-cap activity rows — routed by triggers, not discarded. |
| `ai_interactions` | All Anthropic API calls (prompt, response, tokens, model). |
| `ai_decisions` | AI-driven decision audit (persona assignments, rec selections). |

### Achievements (NEW — Phase 1 shipped 27 April 2026)

| Table | Purpose |
|---|---|
| `achievement_metrics` | 32 metric definitions across categories (counts, volume, time_totals, distance, hk, streaks, variety, collective, tenure, one_shot). Auth-readable. |
| `achievement_tiers` | 327 tier rows (= ladders × thresholds). All `copy_status='approved'` (Lewis-signed-off across two PM sessions 27 April). `CASE WHEN copy_status='approved'` gate protects approved copy from re-seed overwrite. Auth-readable. |
| `member_achievements` | UNIQUE(member_email, metric_slug, tier_index). `earned_at`, `seen_at` (null = unseen toast pending), `notified_at`. Member-scoped read + UPDATE. |

### Workouts, exercise, programmes

| Table | Purpose |
|---|---|
| `workout_plans` | Workout library rows across plan days. |
| `workout_plan_cache` | Per-member workout programme (JSONB). Single source of truth. |
| `exercise_logs` | Plan-agnostic set/rep/weight logs. |
| `exercise_swaps` | Member exercise substitutions. |
| `exercise_notes` | Per-exercise notes. |
| `custom_workouts` | Member-created workouts. |
| `shared_workouts` | Shared/community workouts. |
| `programme_library` | Programmes (gym, movement, etc). `category` column open as backlog item. |
| `member_running_plans` | Per-member running plans (Supabase-first since 20 April). Multiple per member, one active. |
| `running_plan_cache` | AI running plan cache (5,376 cacheable combinations). |

### Habits, nutrition, weight, sleep

| Table | Purpose |
|---|---|
| `habit_themes` | Monthly habit themes. |
| `habit_library` | Source habits. `health_rule jsonb` column drives autotick (null = manual-only). |
| `member_habits` | Habits assigned to members. |
| `nutrition_logs` | Food log entries. |
| `nutrition_my_foods` | Member-saved custom foods. |
| `nutrition_common_foods` | Pre-populated food database. |
| `weight_logs` | Member weight entries. One row per member per day (upsert on conflict). |
| `monthly_checkins` | Monthly 8-pillar wellbeing check-in (iso_month YYYY-MM). |

### AI, persona, knowledge

| Table | Purpose |
|---|---|
| `personas` | 5 AI coach personas (NOVA, RIVER, SPARK, SAGE, HAVEN) with full system prompts. |
| `persona_switches` | Member persona change requests. |
| `knowledge_base` | Knowledge rows. |

### HealthKit pipeline

| Table | Purpose |
|---|---|
| `member_health_connections` | Per-member HK connection state (platform, `has_connected`, `last_sync_at`, `revoked_at`). Now the truthsource for autotick eligibility (allowlist dropped 26 April). |
| `member_health_samples` | Raw HK samples — long-format, per-sample rows. Includes sleep segments with state metadata (`metadata.sleep_state`). |
| `member_health_daily` | Aggregated daily long-format table (`queryAggregated` — steps/distance/active_energy per local date). Watch-vs-iPhone dedupe handled native by Apple's `HKStatisticsCollectionQuery`. |
| `member_health_write_ledger` | Write-back attempts (weight only; anti-echo via `native_uuid`). |

### Dashboard + aggregation

| Table | Purpose |
|---|---|
| `member_home_state` | One row per member. Dashboard aggregate. Populated via triggers from 10 source tables. Read by `member-dashboard` v55+. |
| `member_activity_daily` | Per-member per-day aggregate. Refreshed every 30 min via `vyve_rebuild_mad_incremental` cron. |
| `member_activity_log` | Chronological activity log. |
| `member_stats` | Per-member rolling stats. Recomputed every 15 min via `vyve_recompute_member_stats` cron. |
| `company_summary` | Enterprise aggregate rollup. Recomputed daily 02:00 UTC via `vyve_recompute_company_summary` cron. |
| `platform_metrics_daily` | Platform-wide metrics per day. Recomputed daily 02:15 UTC via `vyve_platform_metrics` cron. |
| `platform_alerts` | Central monitoring — errors, failures, proactive alerts. Service-role only. |
| `watchdog_alerts` | Email-watchdog suppression table. Per-code 6h dedupe so a continuing failure doesn't spam alerts. Service-role only. |

### Certificates + engagement

| Table | Purpose |
|---|---|
| `certificates` | Issued certificate records. Global sequential numbers. |
| `engagement_emails` | Re-engagement email tracking. Streams A/B/C1/C2/C3. |
| `session_chat` | Live session chat (last 50 per session). Open INSERT/SELECT for live chat. |
| `service_catalogue` | Available sessions and content. |

### Notifications

| Table | Purpose |
|---|---|
| `member_notifications` | In-app notifications. Written by `send-push` (web/native fan-out caller) AND by `log-activity` v23+ (achievement evaluator, `skip_inapp:true` on the push side to prevent double-write). |
| `push_subscriptions` | VAPID web push subscriptions. |
| `push_subscriptions_native` | APNs subscriptions for native iOS push. Per-token unique index. Schema: `member_email`, `token`, `platform`, `environment`, `app_version`, `created_at`, `last_used_at`, `revoked_at`. Android/FCM rows reserved (parked, backlog). |
| `scheduled_pushes` | One-shot delayed push queue. Inserted by `schedule-push` EF (member-callable, e.g. habits "Remind me in 2h"). Drained by `process-scheduled-pushes` cron (`*/5 * * * *`) which fires due rows via `send-push` v13 and stamps `fired_at`. Composite UNIQUE on `(member_email, dedupe_key)` — re-tap of the same button updates `fire_at` instead of double-scheduling. Partial index on due rows for fast cron scan. RLS: members see/manage own rows only. |

### Admin + command centre (`cc_*`, `admin_*`)

| Table | Purpose |
|---|---|
| `admin_users` | Admin-console operator accounts (Dean, Lewis, Calum). |
| `admin_audit_log` | Immutable log of admin write actions. Service-role only — no RLS policies. |
| `cc_clients`, `cc_leads`, `cc_investors`, `cc_partners` | Command Centre CRM tables (empty). |
| `cc_tasks`, `cc_decisions`, `cc_okrs` | Task/decision/OKR tracking. |
| `cc_finance`, `cc_revenue`, `cc_grants`, `cc_invoices` | Financial tracking. |
| `cc_posts`, `cc_sessions`, `cc_intel`, `cc_knowledge`, `cc_documents`, `cc_swot`, `cc_episodes` | Content + intel. |
| `vyve_job_runs` | Background job execution log. |

### Activity caps (BEFORE INSERT triggers)

| Activity | Cap | Notes |
|---|---|---|
| `daily_habits` | 10/day | Generous headroom — `activity_dedupe` divert only at 11th+ insert/day/member. |
| `workouts` | 2/day **for `source='manual'` only** | Since 7a. HK-sourced rows bypass entirely. |
| `cardio` | 2/day for manual only | Same. |
| `session_views` | 2/day | All sources. |

**Charity + certificate counters stay independently capped at 2/day via `get_charity_total()` and `increment_*_counter()` read-path caps.** Lifting the trigger cap for HK data inflates nothing downstream — Watch-heavy members get full dashboard + leaderboard credit without rocketing the charity counter past its designed pace.

---

## 7. Edge Functions — live inventory

86 Edge Functions as of 04 May 2026. ~32 actively operational (table below); the remainder are one-shot patchers/seeders/debug helpers retained for reference (see Retired subsection). Security audit (9 April) identified ~89 for deletion — partial cleanup complete; ~32 candidates remain (see backlog).

> **Versioning note (revised 04 May 2026 PM-2).** This table previously carried a "Sem. ver" column that mixed two systems — sometimes mirroring the source-header `vN` (semantic) and sometimes the Supabase platform deploy counter (auto-incremented on every deploy/no-op). Audit found the column unreliable on roughly a third of EFs (e.g. `send-email` brain `v22` while source said `v4`; `wellbeing-checkin` brain `v35` while source said `v25`). **Source-level semantic versions live in the EF source-file header comment** (`// <ef-name> v<N> — <one-liner>`). To check the deployed version, read the source. The §7 table now carries only a Status indicator. The Supabase platform deploy counter is a deploy/redeploy artefact and not surfaced here.

### Core operational (actively serving requests)

| Function | Status | Purpose |
|---|---|---|
| `onboarding` | LIVE | New member onboarding. Two-phase (fast persona/habits/recs + `EdgeRuntime.waitUntil()` for 8-week workout JSON). Stream-aware since 19 April (`if stream==='workouts'`). |
| `member-dashboard` | LIVE | Full dashboard data in one call. Server-authoritative hydration on every page load. Includes `health_connections` + `health_feature_allowed` + `habits` block (each habit returns `health_auto_satisfied` + `health_progress` evaluated server-side via the autotick evaluator) + `achievements` block (`unseen[], inflight[], recent[], earned_count, hk_connected`). Imports `_shared/taxonomy.ts` and `_shared/achievements.ts`. |
| `employer-dashboard` | LIVE | Aggregate employer analytics. API-key auth (no PII). |
| `wellbeing-checkin` | LIVE | Weekly check-in flow. AI recs pulled from activity + persona. |
| `monthly-checkin` | LIVE | Monthly 8-pillar check-in. Writes `monthly_checkins`. |
| `log-activity` | LIVE | PWA activity logging — ALSO serves as `evaluate_only` endpoint for trigger pages that write direct to PostgREST. v22 added inline achievement evaluation (`evaluateInline()`); v23 (28 April PM) added push fan-out via `achievement-earned-push` v1; **v24 (29 April AM)** added `evaluate_only:true` short-circuit that skips write/cap/dedup logic and runs evaluator + fan-out only — closes the inline-evaluator-never-fires-from-real-writes gap. All trigger pages now call this post-write via `VYVEAchievements.evaluate()`. Both notification paths fire under `EdgeRuntime.waitUntil()`. Imports `_shared/achievements.ts`. |
| `anthropic-proxy` | LIVE | Server-side Anthropic proxy for running plans + misc AI calls. `verify_jwt:true`. |
| `generate-workout-plan` | LIVE | AI workout plan generation (invoked from onboarding's waitUntil path). |
| `sync-health-data` | LIVE | HealthKit sync. Stamps `source:'healthkit'` on promoted workout/cardio rows. `queryAggregated` routing for steps/distance/active_energy; sleep segments with full state metadata. v7 refactor extracts workout taxonomy to `_shared/taxonomy.ts`. |
| `get-health-data` | LIVE | Reads back health data for portal display. |
| `get-activity-feed` | LIVE | Personal activity feed (parked — `activity.html` unlinked). |
| `admin-dashboard` | LIVE | Admin console data API. |
| `admin-member-edit` | LIVE | Admin write to member record. Audited. |
| `admin-member-habits` | LIVE | Admin assigns/removes habits. Audited. |
| `admin-member-programme` | LIVE | Admin changes member's programme. Audited. |
| `admin-member-weekly-goals` | LIVE | Admin edits weekly goals. Audited. |
| `admin-programme-library` | LIVE | Admin manages programme library. |
| `edit-habit` | LIVE | Habit definition edit helper. |
| `share-workout` | LIVE | Shared/community workout handler. |
| `workout-library` | LIVE | Library API for workouts. |
| `leaderboard` | LIVE | Leaderboard with scope tabs, range filter, privacy-aware name resolver, tie-aware gap copy. Reads aggregation layer only. |
| `notifications` | LIVE | In-app notifications read/write. |
| `register-push-token` | LIVE | PWA `push-native.js` POSTs `{token, platform, environment, app_version}`; row written to `push_subscriptions_native` with per-token uniqueness. `verify_jwt:true`. |
| `push-send-native` | LIVE | APNs sender. ES256 JWT via Web Crypto from `APNS_AUTH_KEY`/`APNS_KEY_ID`/`APNS_TEAM_ID`. Routes per environment: `api.development.push.apple.com` vs `api.push.apple.com`. `NATIVE_PUSH_ALLOWLIST` fail-closed. 410/400-BadDeviceToken auto-revokes. `verify_jwt:false` with manual service-role guard. |
| `send-push` | LIVE | **Unified push fan-out (28 April PM, JWK fix late PM).** Single sender for both VAPID web (inline RFC 8291 aes128gcm) + APNs native (delegated to `push-send-native`). Per-member same-day dedupe via `member_notifications` lookup. Writes in-app notification row + fans out to web + native subs. Service-role gated via dual-auth (`SUPABASE_SERVICE_ROLE_KEY` OR `LEGACY_SERVICE_ROLE_JWT`). `verify_jwt:true` (forced — see §23). v12 fixes the VAPID private key import: was `'raw'` with `['sign']` (invalid per spec, throwing `Invalid key usage` silently inside the per-sub try/catch), now `'jwk'` with x/y reconstructed from `VAPID_PUBLIC_KEY`'s uncompressed point bytes. Module-scoped `_vapidPrivKey` cache so import only runs once per isolate. |
| `habit-reminder` | LIVE | Habit reminder push (cron 20:00 UTC daily). Refactored 28 April — calls `send-push` instead of inline VAPID. `verify_jwt:true`. |
| `streak-reminder` | LIVE | Streak-risk push (cron 18:00 UTC daily, ≥7 day streak threshold). Refactored 28 April — calls `send-push`. `verify_jwt:true`. |
| `achievement-earned-push` | LIVE | **Achievement push fan-out (28 April PM).** Thin glue between achievement evaluator and `send-push`. Input `{member_email, earns:[{metric_slug, tier_index, title, body}]}`. One push per earned tier with `dedupe_same_day:false` and `skip_inapp:true`. Called by `log-activity` v23 (inline path) and `achievements-sweep` v2 (sweep path). Service-role gated, dual-auth. `verify_jwt:true`. |
| `schedule-push` | LIVE | **One-shot delayed push enqueuer (4 May 2026 PM-5).** Member-callable. Decodes JWT for email, validates `{type, title, body, fire_in_seconds}` (clamped 60..86400), upserts `scheduled_pushes` row keyed on `dedupe_key` (defaults `${type}_${YYYY-MM-DD}`). Re-tap resets `fired_at`/`cancelled_at`/`last_error`. `verify_jwt:true`. |
| `process-scheduled-pushes` | LIVE | **Scheduled push consumer cron (4 May 2026 PM-5).** Cron `*/5 * * * *`. Selects `WHERE fire_at <= now() AND fired_at IS NULL AND cancelled_at IS NULL` (limit 200, partial index), fires each via `send-push` with `dedupe_same_day:false`, stamps `fired_at` on success / `last_error` on failure. Service-role gated, dual-auth. `verify_jwt:true`. |
| `achievements-mark-seen` | LIVE | Toast-clear endpoint. POST + JWT auth. `{mark_all:true}` or `{metric_slug, tier_index}`. Updates `member_achievements.seen_at = NOW()` for caller's own rows. Used by Phase 3 toast UI on dismiss. |
| `achievements-sweep` | LIVE | Cron-driven daily sweep (22:00 UTC) for tenure / lifetime / time-window achievement metrics. v1 handled `member_days` only; v2 (28 April PM) extends tier query to pull title/body and fans out via `achievement-earned-push` per member after upsert. Phase 2 metric extensions deferred. `verify_jwt:false`, service-role internally. |
| `member-achievements` | LIVE | Achievements API surface — read-side helper for the engagement page achievements grid + dashboard slot. Returns earned/inflight/recent + tier metadata. `verify_jwt:true`. |
| `platform-alert` | LIVE | Writes to `platform_alerts`. |
| `warm-ping` | LIVE | Keep-warm pinger (5-min cron) hitting 10 EFs to prevent cold starts. |
| `check-cron` | LIVE | Cron job audit/verification. |
| `send-email` | LIVE | Brevo transactional delivery. |
| `send-session-recap` | LIVE | Session recap emails. |
| `send-journey-recap` | LIVE | Journey recap emails. |
| `send-password-reset` | LIVE | Password reset flow. |
| `re-engagement-scheduler` | LIVE | Two streams: A (no consent + no activity) and B (onboarded but dormant). Cron 8:00 UTC daily. C1/C2/C3 retired 4 May (legacy two-surface split — Kahunas app + portal). Source comment header: v8. |
| `daily-report` | LIVE | Cron 8:05 UTC daily. |
| `email-watchdog` | LIVE | Email pipeline watchdog (shipped 04 May 2026 PM-1). Cron `*/30 * * * *`. Five checks: missing daily delivery (26h), recent `team@` hard-bounces (24h), `team@` on Brevo blocklist, `pg_cron` failures (6h), bounce-spike across all auto-emails (1h). Multi-recipient alerting (Dean Hotmail TO + Lewis Hotmail + `team@` CC). Per-code 6h suppression via `watchdog_alerts` table. `verify_jwt:false`. |
| `weekly-report` | LIVE | Weekly report generation. Cron 08:10 Monday UTC. |
| `monthly-report` | LIVE | Monthly report generation. Cron 08:15 1st of month UTC. |
| `certificate-checker` | LIVE | Generates HTML certs to Supabase Storage. Global sequential numbers. Cron 9:00 UTC daily. |
| `certificate-serve` | LIVE | Serves certificate HTML files. |
| `github-proxy` | LIVE | GET + PUT to `vyve-site` via `GITHUB_PAT` secret. |
| `github-proxy-marketing` | LIVE | Same for `Test-Site-Finalv3`. |
| `off-proxy` | LIVE | Open Food Facts proxy for `log-food.html`. |
| `ops-brief` | LIVE | Ops brief generation. |
| `internal-dashboard` | LIVE | Internal metrics. |
| `storage-cleanup` | LIVE | Storage housekeeping. |
| `schema-snapshot-refresh` | LIVE | Weekly cron Sunday 03:00 UTC, auto-commits structural changes to VYVEBrain. `GITHUB_PAT_BRAIN` fine-grained PAT — expires 18 April 2027 (calendar rotation). |
| `cc-data` | LIVE | Command Centre data API. |
| `debug-exercise-search` | LIVE | Exercise-library search debug tool. |

### Shared modules

Two shared modules referenced by multiple EFs as sibling files (must redeploy in lockstep when modified):

- `_shared/taxonomy.ts` — workout-type constants (`STRENGTH_CANON` / `CARDIO_CANON` / `IGNORED_CANON` / `YOGA_CANON`), `classifyWorkout()` helper, `HealthRule` / `HealthProgress` / `HealthEvaluation` types, `applyOp()`, UK time helpers (`ukLocalDateISO`, `lastNightWindow`). Imported by `member-dashboard` and `sync-health-data`.
- `_shared/achievements.ts` — achievement evaluator. Two exports: `evaluateInline(supabase, email)` (runs all inline metrics, idempotent upsert+ignoreDuplicates, returns earned tiers — used by `log-activity` v22+) and `getMemberAchievementsPayload(supabase, email, opts)` (returns `{unseen, inflight, recent, earned_count, hk_connected}` — used by `member-dashboard` v55). Loads catalog with 60s in-memory cache. Skips `hidden_without_hk` metrics for members without `member_health_connections`. Imported by `log-activity` and `member-dashboard`.

### Retired / one-shot / debug (kept around, not actively invoked)

Approximately 32 functions across `seed-*`, `patch-*`, `trigger-*-workout`, `setup-*`, `run-migration-*`, `debug-*`, `test-*`, `send-stuart-*`, `ban-user-*`, `thumbnail-*`, `delete-housekeeping`, `force-cache-refresh`, `resend-welcome`, `update-brain-changelog`, `smoketest-ach-push` (28 April inert stub). Cleanup pass pending — the 9 April security audit identified ~89 for deletion, partially actioned. Composio doesn't expose a delete-EF tool; deletions need Supabase CLI or dashboard.

### EF deployment rules

- Always provide a **full** `index.ts` — no partial updates.
- `verify_jwt:false` for public-facing functions that handle their own auth or need unauth'd access (onboarding, send-email, webhooks).
- `verify_jwt:true` for everything that reads member data server-side (`member-dashboard`, `wellbeing-checkin`, `log-activity`, `anthropic-proxy`).
- `esm.sh` imports are unreliable in Deno — use Deno built-ins (Web Crypto, std library) for crypto operations. Codified from iOS Web Push RFC 8291 implementation.
- `SUPABASE_DEPLOY_FUNCTION` for body changes; `SUPABASE_UPDATE_A_FUNCTION` corrupts deployed bundles (codified §23, 28 April).

### Cron jobs (16 active)

| Job | Schedule | Function |
|---|---|---|
| `email-watchdog` | `*/30 * * * *` | email-watchdog (every 30 min — checks 5 failure modes, alerts Dean+Lewis on first detection per 6h window) |
| `vyve-reengagement-daily` | `0 8 * * *` | re-engagement-scheduler |
| `vyve-daily-report` | `5 8 * * *` | daily-report |
| `weekly-report` | `10 8 * * 1` | weekly-report (Mondays) |
| `monthly-report` | `15 8 1 * *` | monthly-report (1st of month) |
| `vyve-certificate-checker` | `0 9 * * *` | certificate-checker |
| `streak-reminder-daily` | `0 18 * * *` | streak-reminder |
| `habit-reminder-daily` | `0 20 * * *` | habit-reminder |
| `vyve-achievements-sweep-daily` | `0 22 * * *` | achievements-sweep |
| `vyve_recompute_company_summary` | `0 2 * * *` | recompute_company_summary() |
| `vyve_platform_metrics` | `15 2 * * *` | recompute_platform_metrics() |
| `vyve_recompute_member_stats` | `*/15 * * * *` | recompute_all_member_stats() |
| `vyve_rebuild_mad_incremental` | `*/30 * * * *` | rebuild_member_activity_daily_incremental() |
| `warm-ping-every-5min` | `*/5 * * * *` | warm-ping (10 EFs warmed) |
| `process-scheduled-pushes` | `*/5 * * * *` | process-scheduled-pushes (consumes due rows from `scheduled_pushes`, fans out via `send-push`) |
| `vyve_schema_snapshot` | `0 3 * * 0` | schema-snapshot-refresh (Sundays) |

---

## 8. Portal pages & web shell

All portal pages live at `online.vyvehealth.co.uk` and are bundled inside the iOS + Android Capacitor binaries via `npx cap copy` from `~/Projects/vyve-capacitor`. The web URL itself is the browser-accessible account-management fallback — the *member experience* (the app) is delivered exclusively through the App Store and Play Store binaries. Every page is gated behind Supabase Auth (`auth.js` v2.3).

### Core pages

| Page | Purpose |
|---|---|
| `index.html` | Member dashboard. Cache-first (skeleton on first load, instant on return). Reads `member-dashboard` v55. Daily check-in pill strip, activity score ring, goals, live session slot, charity banner. |
| `habits.html` | Daily habit logging. 7-day pill strip, streak + dot strip, monthly theme badge. Wired to HealthKit autotick: fourth parallel fetch to `member-dashboard` v55 merges `has_rule` + `health_auto_satisfied` + `health_progress` into `habitsData` by `habit_id`; pre-render `runAutotickPass()` stamps satisfied rule rows as yes with `notes='autotick'`; `.hk-progress` bar + text on unsatisfied rows; done-state sub-label reads "from Apple Health" on auto-ticked rows, "Logged to your progress" on manual-yes rows. No visual badge — attribution is copy-only. Cache key `vyve_habits_cache_v2`. |
| `exercise.html` | **Exercise Hub.** Hero card + stream cards linking to Movement / Workouts / Cardio / Classes. |
| `workouts.html` | Gym programme page. My Programme / My Workouts tabs. Custom workouts, exercise logs, swap. Reads `workout_plan_cache`. |
| `movement.html` | Movement stream. Reads `workout_plan_cache`, activity list, video modal, Mark as Done. No content yet in `programme_library` — default-state members see no-plan state. |
| `cardio.html` | Cardio stream. Weekly progress + quick-log + recent history. Running plans Supabase-first via `member_running_plans`. |
| `nutrition.html` | TDEE + macros + hydration + weight tracker. Links to `log-food.html`. |
| `log-food.html` | Food logging via Open Food Facts (`off-proxy` v18). |
| `sessions.html` | Live session listings. Filter tabs (All/Daily/Weekly/Monthly). `session_chat` for live chat (last 50). |
| `settings.html` | Theme, persona, notifications, privacy (display-name preference), HealthKit connect toggle + 7-day re-prompt banner suppression. |
| `wellbeing-checkin.html` | Weekly check-in. Privacy-first. AI recs in persona voice. |
| `monthly-checkin.html` | Monthly 8-pillar check-in. |
| `certificates.html` | Member certificate display. 5 tracks with progress. `certificate-serve` v26. |
| `engagement.html` | Activity score page with full scoring methodology. **Phase 3 Achievements UI lands here as a new tab** — design-locked but not yet built. |
| `leaderboard.html` | Privacy-aware leaderboard. Classic 1→N top-100. Range selector. Scope tabs. Anonymous banner. Title-case rendering. Zero-activity footer collapse. 7-day tenure filter on All-time. |
| `running-plan.html` | AI running plan generator. Supabase-first. `anthropic-proxy` v16, Haiku 4096 max_tokens. |
| `welcome.html` | **Stream picker onboarding.** Fires `onboarding` v78 which is stream-aware. Section A reordered + Section C aligned to Calum's spec on 27 April (`sessionLength` + `priorityMuscle` not yet persisted by EF — see §9). |
| `login.html` · `set-password.html` | Supabase Auth flows. |
| `strategy.html` | Internal strategy dashboard (password `vyve2026`). Reads Action Ticks Apps Script + Supabase. |
| `apple-health.html` | Inspector page — built session 6, parked (954-sample payload needs paging). |
| `activity.html` | Personal activity feed — built, unlinked from `exercise.html` (GPS route maps out of scope without Capgo plugin fork). |
| `shared-workout.html` | Shareable workout import endpoint. Receives a workout `id` and renders it for adoption. |
| `certificate.html` | Single-cert viewer (distinct from the `certificates.html` index). |
| `consent-gate.html` | Standalone consent-gate route. Also wired into onboarding flow. |
| `nutrition-setup.html` | TDEE/macros initial setup wizard. |
| `offline.html` | PWA offline fallback page. |
| `how-to-pdfs.html` · `how-to-videos.html` | Help/education library shells. |
| Session live/replay variants | `yoga-{live,rp}.html`, `mindfulness-{live,rp}.html`, `workouts-{live,rp}.html`, `education-{live,rp}.html`, `events-{live,rp}.html`, `podcast-{live,rp}.html`, `therapy-{live,rp}.html`, `checkin-{live,rp}.html` — per-stream live + replay shells. |
| `VYVE_Health_Hub.html` | **Staging — pending Phil's clinical sign-off before launch.** Standalone single-file experience: welcome card → multi-step clinical assessment flow with scoring/risk classification → `generateReport()` text export. Sits in `vyve-site` web root unlinked from nav by design. Same clinical-gate pattern as HAVEN persona. Do not delete or archive without Lewis/Phil approval (§23 hard rule). |

### Admin console (separate host)

`admin.vyvehealth.co.uk/admin-console.html` — served by `vyve-command-centre` repo. Shell 1 + Shell 2 + Shell 3 Sub-scope A UI live. Sub-scope B (bulk ops + multi-select) ready to ship once browser-side JWT smoketest closes on Sub-scope A.

### PWA infrastructure

| Piece | Detail |
|---|---|
| Service worker | `sw.js` — network-first for HTML + skipWaiting + clients.claim. HTML changes reach users on next reload without cache bumps. Non-HTML assets still use cache versioning. **Push event listener + notificationclick handler shipped 28 April** (`vyve-site@124ecb53`). Current cache: `vyve-cache-v2026-04-29h-fullsync-btn`. |
| Achievement client | `achievements.js` v1 (29 April) — toast queue + debounced evaluator + mark-seen + replay-unseen. Loaded on every portal page (trigger and passive). Trigger pages call `VYVEAchievements.evaluate()` after direct PostgREST writes; passive pages auto-replay unseen tiers from `vyve_dashboard_cache.data.achievements.unseen[]` on load. |
| Theme system | `theme.js` — dual dark/light CSS tokens. `data-theme` on `html`. Stored in localStorage. All pages use dual-token CSS blocks — never single `:root`. |
| Nav | `nav.js` — body-prepend pattern. Back button on inner pages, logo-only on home. |
| Consent gate | Built. Writes `privacy_accepted` + `health_data_consent` to `members`. |
| Viewport zoom | Disabled across all pages. |
| `target="_blank"` | Audit complete. |
| Auth promise | Pending refactor — `auth.js` currently non-deferred across 14 portal pages; `window.VYVE_AUTH_READY` promise refactor queued (this-week item) to unblock the deferred-script perf win. |

### Offline mode

Portal operates offline for cached content. Members can view cached workouts/habits without connectivity.

---

## 9. Onboarding flow

Member pays via Stripe → redirects to `welcome.html` → **stream picker** (workouts / movement / cardio) → onboarding questionnaire → `onboarding` EF v78 → Supabase writes + persona assignment + habit assignment + stream-aware programme overview + weekly goals (5 targets) + recommendations + Brevo welcome email with App Store / Play Store download buttons + programme card. Phase 2 (`EdgeRuntime.waitUntil()`) writes the full 8-week workout JSON to `workout_plan_cache` in the background — only triggered when `stream==='workouts'`.

Supabase Auth user created directly by the onboarding EF. No Make, no Auth0.

Welcome email via Brevo includes programme overview card + native App Store / Play Store download buttons (iOS `https://apps.apple.com/gb/app/vyve-health/id6762100652`, Android `https://play.google.com/store/apps/details?id=co.uk.vyvehealth.app`). PWA install steps removed in `onboarding` EF v82 on 04 May 2026 PM-3. Stripe coupons `VYVE15` and `VYVE10`. Annual discount % TBD (Lewis to decide).

### Questionnaire — Section A (About you)

Order (post 27 April 2026 reorder): First name + Last name (input-row) → Email + Confirm email (input-row, paired) → Mobile (own q-group, optional) → DOB + Gender (input-row) → Where are you based.

### Questionnaire — Section C (Physical Health, Workouts branch) field reference

Engine-relevant inputs from the Workouts stream after 27 April 2026 alignment:

- `location-train` (single, mandatory): `Full commercial gym` | `Basic gym` | `Home` | `Hotel gym` | `Mixed` | `Not sure`
- `equipment` (multi, conditional — shown for Home / Hotel gym / Mixed / Not sure; hidden for Full commercial gym + Basic gym): `Bodyweight only` | `Resistance bands` | `Dumbbells` | `Kettlebells` | `Barbell and weights` | `Machines` | `Cables`
- `gymExperience` (single, mandatory): `Beginner` | `Intermediate` | `Advanced` | `Returning` (mapping for Returning to be defined at engine-build restart — likely Beginner with elevated Joint Friendliness weight)
- `trainDays` (single, mandatory): `1-2` | `3` | `4` | `5+` | `Not sure`
- `sessionLength` (single, **NEW 27 April 2026, not yet persisted by EF**): `15` | `20` | `30` | `45` | `60` (minutes)
- `priorityMuscle` (single, **NEW 27 April 2026, not yet persisted by EF**, optional): `Glutes` | `Arms` | `Back` | `Chest` | `Shoulders` | `Legs` | `None`

Injury flags kept as-is at Dean's call: `Shoulders` | `Knees` | `Hips` | `Back / spine` | `Wrists` | `Ankles` | `None`. Free-text avoid-exercises field also retained.

**Persistence gap (carries into engine-build restart):** `sessionLength` and `priorityMuscle` are POSTed to onboarding EF v78 but the EF doesn't read or save them. Add columns to `members` + bump EF to v79 in Stage 3 of the parked workout-engine work.

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
| **HAVEN** | Gentle mental health companion. Non-judgmental, trauma-informed. **Built and live but pending clinical review by Phil before promotion.** |

### Assignment rules

| Condition | Assignment |
|---|---|
| Stress ≤ 4 OR wellbeing ≤ 3 | RIVER or HAVEN (post-clinical-review) |
| Bereavement / mental health in Section G | HAVEN or RIVER only — never NOVA or SPARK |
| High training days + performance goal + low stress | Consider NOVA |
| Past barriers = motivation/consistency | Consider SPARK |
| Analytical style + wants to understand why | Consider SAGE |
| Serious life context flagged in Section G | Never NOVA or SPARK regardless of other signals |

### HAVEN open issue (28 April 2026)

The onboarding EF assigns HAVEN to members hitting the low-wellbeing/high-stress thresholds, and `conor@conorwarren.co.uk` (joined 15 April, baseline_wellbeing=3, baseline_stress=2) is currently on HAVEN in production. Phil has **not** signed off on the HAVEN persona content. Two paths to resolve:

1. **Pause HAVEN auto-assignment** in the onboarding EF until Phil signs off — fall through to RIVER for the threshold cases.
2. **Get Phil to clinical-review** the persona content + signposting copy + crisis-handling rules, then unblock cohort-wide.

Open decision in §22.

---

## 11. AI features

### Portal AI (Dean — technical)

| Feature | Status |
|---|---|
| Onboarding recommendations (persona assignment + 3 first-week recs + programme overview) | LIVE (`onboarding` v78) |
| Running plan generator (`running-plan.html` + `anthropic-proxy` v16 + Supabase cache) | LIVE |
| Weekly check-in recommendations (persona-voiced AI recs) | LIVE (`wellbeing-checkin` v35) |
| Workout plan generator (8-week custom programme at onboarding via waitUntil) | LIVE (`generate-workout-plan` v11) |
| **Habits × HealthKit autotick** | **LIVE end-to-end (sessions 1 + 2 + 3 + 3a, 24–25 April 2026).** Schema + Lewis-approved seeds on `habit_library.health_rule`, server evaluator in `member-dashboard` v55 with `_shared/taxonomy.ts`, client UI in `habits.html` wired with pre-tick on auto-satisfied rows, `.hk-progress` hints on unsatisfied rows, done-state copy swap as the sole attribution mechanism — no visual badge. `notes='autotick'` on auto-written `daily_habits` rows persists the copy variant across reloads. **Cohort-wide post 1.2 approval** — `HEALTH_FEATURE_ALLOWLIST` was dropped 26 April; truthsource is `member_health_connections` row presence. |
| **Achievements System Phase 1** | **LIVE end-to-end (27 April 2026).** Catalog (32 metrics × 327 tier rows, all `copy_status='approved'`) + inline evaluator + sweep cron + dashboard payload + mark-seen EF + 185-tier backfill marked seen. See §11A for full architecture. |
| **Achievement push fan-out** | **LIVE end-to-end (28 April 2026 PM, Session 2 item 1).** `achievement-earned-push` v1 + `log-activity` v23 (inline path) + `achievements-sweep` v2 (sweep path). One push per earned tier, dedupe-off, in-app suppressed (caller writes `member_notifications` separately). Smoke-tested live on Dean (synthetic earn → APNs HTTP 200) and on Vicki (real `member_days` tier 2 crossed during sweep invoke → push delivered). |
| AI weekly goals (phase 1 targets set at onboarding) | LIVE |
| Weekly progress email (Friday, AI-generated, Brevo) | BACKLOG — blocked on Lewis copy template |
| Persona context modifiers (age 50+, beginner, time-poor, new parent) | BACKLOG |
| Session recommender (post check-in, mood/energy/time-aware) | BACKLOG |

### HealthKit autotick — what shipped across sessions 1–3a

- `habit_library.health_rule jsonb` column added (nullable; null = manual-only).
- Two existing habits retrofitted with rules: `10-minute walk` (daily distance ≥ 1km) and `Sleep 7+ hours` (sleep-state sum ≥ 420 min last_night).
- Four new Lewis-approved habit seeds inserted (created_by `autotick-7b`): Walk 10,000 steps, Walk 8,000 steps, Complete a workout, 30 minutes of cardio. Thresholds defaulted per plan: 8k for 50+/beginner/non-NOVA, 10k for NOVA/high-training.
- Rule shape: `{source, metric, agg, window, op, value}`. Supported source values in v1: `daily` (`member_health_daily`), `samples_sleep` (`member_health_samples` sleep segments), `activity_tables` (workouts+cardio). Future-extensible: `vyve_nutrition`, `vyve_session_views`, `health_connect_daily`.
- Server evaluator in `member-dashboard` v55. Snapshot-once pattern: all health data fetched in a single `Promise.all` batch, then each habit's rule evaluates against the in-memory snapshot — no N+1 per habit.
- Null-not-false semantics: evaluator returns `{satisfied: null, progress: null}` when rule is null OR member has no HealthKit connection OR no data in window.
- Client UI in `habits.html`: fourth parallel fetch to `member-dashboard` v55 merges `has_rule` + `health_auto_satisfied` + `health_progress` by `habit_id`. Pre-render `runAutotickPass()` upserts a yes row for every habit where `has_rule === true && health_auto_satisfied === true && !logsToday[id]`, stamping `notes='autotick'`. `.hk-progress` renders progress bar + text on unsatisfied rule rows. Done-state sub-label reads "from Apple Health" on auto-ticked rows, "Logged to your progress" on manual-yes rows.
- Plan closed at `plans/habits-healthkit-autotick.md`.

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

## 11A. Achievements Architecture

Phase 1 of the Achievements System shipped end-to-end on 27 April 2026 across two AM/PM sessions. Phase 2 (sweep extensions) and Phase 3 (UI) are still pending. Tonight's 28 April PM work added the push fan-out wiring on top of Phase 1.

### Data model — three tables

`achievement_metrics` (32 rows). Slug PK. Categories: `counts` (12), `volume` (1), `time_totals` (2), `distance` (0 — `cardio_distance_total` dropped pending real distance capture), `hk` (4, `hidden_without_hk` flag), `streaks` (6), `variety` (1, recurring), `collective` (2), `tenure` (1), `one_shot` (3). Each metric has `source` (`inline` for log-activity-driven, `sweep` for cron-driven), `is_recurring` flag, `sort_order`. The catalogue header.

`achievement_tiers` (327 rows). Composite PK `(metric_slug, tier_index)`. `threshold numeric`, `title text`, `body text`, `copy_status` CHECK in `(placeholder, approved)`. **All 327 rows currently `copy_status='approved'`.** The `copy_status` gate protects Lewis-signed-off copy from overwrite by future re-seeds via `CASE WHEN copy_status='approved' THEN public.achievement_tiers.title ELSE EXCLUDED.title END` in the upsert path.

`member_achievements`. UNIQUE `(member_email, metric_slug, tier_index)`. `earned_at`, `seen_at` (null = unseen toast pending), `notified_at`. Three indexes: `idx_member_achievements_email`, `idx_member_achievements_unseen` (partial WHERE seen_at IS NULL), `idx_member_achievements_recent` (member_email, earned_at DESC). Member-scoped read + UPDATE on own rows; service-role only INSERT/DELETE.

### Final 32-metric inventory

- **Counts (12):** `habits_logged`, `workouts_logged`, `cardio_logged`, `sessions_watched`, `replays_watched`, `checkins_completed`, `monthly_checkins_completed`, `meals_logged`, `weights_logged`, `exercises_logged`, `custom_workouts_created`, `workouts_shared`
- **Volume (1):** `volume_lifted_total` — **not yet wired in evaluator** (Phase 2; needs sanity caps `reps_completed > 100` OR `weight_kg > 500` to exclude before counting)
- **Time totals (2):** `workout_minutes_total`, `cardio_minutes_total`
- **HK-derived (4, hidden_without_hk):** `lifetime_steps`, `lifetime_distance_hk`, `lifetime_active_energy`, `nights_slept_7h` — all sweep-source, **not yet wired in `achievements-sweep` v2** (Phase 2)
- **Streaks (6):** `streak_overall`, `streak_habits`, `streak_workouts`, `streak_cardio`, `streak_sessions`, `streak_checkin_weeks`
- **Variety (1, recurring):** `full_five_weeks` — sweep-source, Phase 2
- **Collective (2):** `charity_tips` (recurring), `personal_charity_contribution` — sweep-source, Phase 2
- **Tenure (1):** `member_days` — **the only sweep metric currently wired in `achievements-sweep` v2**
- **One-shots (3):** `tour_complete`, `healthkit_connected`, `persona_switched` — Phase 2

### Evaluator pattern (`_shared/achievements.ts`)

Two exports:

- `evaluateInline(supabase, email)` — runs every inline metric for a given member, inserts any newly-earned tiers via upsert+ignoreDuplicates on the unique conflict target, returns the freshly-earned tier rows. 60s in-memory catalog cache. Skips `hidden_without_hk` metrics for members without `member_health_connections`. Used by `log-activity` v22+.

- `getMemberAchievementsPayload(supabase, email, opts)` — read-only, returns `{unseen, inflight, recent, earned_count, hk_connected}` for the dashboard. `unseen` = earned tiers not yet seen (toast queue); `inflight` = top N closest-to-earn next tiers (progress bars), sorted by `current_value / next_threshold` descending; `recent` = last N earned. Used by `member-dashboard` v55.

### Inline vs sweep split

Counts + time totals + streak day-of evaluations + persona_switched fire **inline** from `log-activity` v22+ — one COUNT after insert is cheap on indexed tables, immediacy matters for the toast. Tenure/variety/collective/HK-lifetime/one-shot metrics go into **`achievements-sweep`** at 22:00 UTC daily — window calcs that don't benefit from immediacy.

**Critical — evaluator activation pattern (29 April).** Trigger pages (habits.html, workouts.html, cardio.html, sessions.html, wellbeing-checkin.html, monthly-checkin.html, log-food.html, movement.html, nutrition.html, plus the workouts-*.js modules) write directly to PostgREST tables via `/rest/v1/<table>` POSTs, NOT through log-activity. The inline evaluator therefore does not fire from these writes unless the client explicitly calls log-activity afterwards. log-activity v27 (platform v30) · member-achievements v2 · send-push v13 · achievement-earned-push v2 (NEW · JWT-required, getMemberGrid endpoint for Phase 3 grid) added an `evaluate_only:true` mode for exactly this purpose; all trigger pages now call `VYVEAchievements.evaluate()` from the new `/achievements.js` client lib after each successful write. Without this wire-up the inline path would remain dead even though the EF code is correct. Codified as a §23 hard rule.

### Push fan-out (28 April PM)

Both call sites of the evaluator now also fan out via `achievement-earned-push` v1 → `send-push` v11:

- **Inline (`log-activity` v23):** `pushAchievementEarned(email, earned)` POSTs to `achievement-earned-push` under `EdgeRuntime.waitUntil()` (parallel to existing `writeAchievementNotifications` in-app log). Hot path latency unchanged.
- **Sweep (`achievements-sweep` v2):** per-member sequential fan-out after upsert. Failure isolated per member.
- **`skip_inapp:true`** in the push payload prevents `send-push` from double-writing the in-app row (caller writes via `member_notifications` separately).
- **`dedupe_same_day:false`** — multiple tiers in the same day = feature, not duplicate.

**Note on the original 28 April PM smoketest framing:** Vicki's `member_days` tier 2 cross during sweep was recorded at the time as "push delivered". That was true for the **APNs native** path (HTTP 200 from `push-send-native`) but illusory for the **web VAPID** path — `send-push` v11's `web_sent` counter was always zero, falling through silently because `makeVapidJwt` was throwing inside the per-sub try/catch and being caught as `{ok:false, status:0}` without ever logging. Fixed in `send-push` v12 (28 April late PM). Web VAPID is now actually functional in production for the first time since rollout.

### Backfill (one-time, 27 April)

185 earned tiers backfilled across 15 members during catalog ship. All marked `seen_at = notified_at = NOW()` so the future Phase 3 toast queue starts empty — without this, every existing member's first dashboard load would have fired dozens of toasts at once.

### Voice rules (locked-in for future ladder extensions)

- No emojis anywhere.
- Titles 3–6 words. Bodies 10–20 words (hard window, validation rejects).
- VYVE voice: proactive wellbeing, performance investment, prevention over cure, evidence over assumption. No fitness-influencer tone.
- Tier 11+ on long ladders short and reverent, no next-tier nudge.
- Recurring metrics: copy reads naturally as a repeatable milestone (no "another" assuming prior).
- Globally unique titles across all 327 rows.
- Streaks ≠ counts in body voice — streaks emphasise consecutive cadence, counts emphasise cumulative volume.

### Phase 3 UI (LIVE — trophy-cabinet redesign 29 April PM-3)

Achievements ships as a **tab on `engagement.html`** alongside the Progress content. Layout (29 April PM-3 redesign superseding morning's wall-of-tiles):

1. **Recently earned** — horizontal scroll of last 6 unlocks. Each card = trophy + tier title + metric + time-ago. Click → modal (full ladder).
2. **Up next** — top 3 in-progress metrics by `progress.pct` desc. Locked-style trophy preview + progress bar + "X to go". Click → modal (full ladder, scrolled to the current tier).
3. **Trophy cabinet** — one trophy per metric, grouped by category, on cream shelves. Number on the trophy face = highest tier earned (or "?" with locked tinting). Click → modal (full ladder).

Modal opens for any tile click and shows the full tier ladder for that metric, with earned rows tinted gold, current row teal-bordered with inline progress bar, locked rows muted. Optional `tierIndex` param scrolls the named row into view (used by Up Next + toast deep-link `#achievements&slug=X&tier=N`).

Backed unchanged by `member-achievements` v2 EF — `tiers[].earned_at`, `tiers[].is_current`, `tiers[].progress` already returned, no server work needed for the redesign. Toast queue + mark-seen via `achievements-mark-seen` EF + push-on-earn via `achievement-earned-push` v2 all wired and live since the morning ship. Dashboard slot on `index.html` (latest unseen / closest inflight) still unstarted — Phase 3 sub-task.

### Open Phase 2 / Phase 3 items

- `volume_lifted_total` evaluator wiring — Phase 2; needs sanity caps; two corrupt rows on Dean's account (Back Squat, 2026-04-18, `reps_completed = 87616`) need zeroing first or they'd fire tier 10 immediately.
- HK lifetime metrics + `full_five_weeks` + `charity_tips` + `personal_charity_contribution` + `tour_complete` + `healthkit_connected` + `persona_switched` sweep extensions.
- Clean orphan `running_plans_generated` entry from evaluator INLINE map next time we touch `log-activity`.
- Confirm `full_five_weeks` source-query semantics map to the five web pillars (mental/physical/nutrition/education/purpose).
- `tour_complete` blocked on the In-App Tour build (item 8 in backlog).
- Phase 3 UI surfaces (engagement.html tab + toast + dashboard slot).

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

### Cron jobs (Supabase pg_cron)

See §7 for the 14 active cron jobs (all `active=true` as of 28 April).

---

## 13. Employer & member dashboards

### Employer dashboard

Live at `www.vyvehealth.co.uk/vyve-dashboard-live.html`. Served by `employer-dashboard` v31. API-key auth via `EMPLOYER_DASHBOARD_API_KEY`. **Aggregate only — no PII ever visible to employers.** Active = 0–7 days inactive · Quiet = 8–30 · Inactive = 30+ or never.

Trial/test data only today. Per-employer Auth-gated URLs (e.g. `/sage`) build when first enterprise trial starts.

### Member dashboard

Single call to `member-dashboard` v55. Cache-first — renders instantly from localStorage on return visits, skeleton on first load, silent background refresh. Server-authoritative hydration on every page load (HealthKit truthsource is `member_health_connections` row presence in the EF, not localStorage).

Engagement score 0–100 ring. Activity + Consistency + Variety + Wellbeing components (12.5 points each). Base 50.

5 progress tracks: Daily Habits (The Architect), Workouts (The Warrior), Cardio (The Relentless), Sessions Watched (The Explorer), Weekly Check-ins (The Elite). 30-activity milestone certificates.

Achievements `unseen / inflight / recent / earned_count / hk_connected` payload also live in v55 — Phase 3 UI will surface this on `engagement.html`.

### Admin console

`admin.vyvehealth.co.uk/admin-console.html` — live with Shell 1 (member viewer) + Shell 2 (pencil-click edits) + Shell 3 Sub-scope A (programme / habits / weekly-goals panels with shared reason modal). Sub-scope B (bulk ops + multi-select) queued behind browser-side JWT smoketest on Sub-scope A. Shell 2 E2E smoketest still pending.

All admin writes audited to `admin_audit_log`.

---

## 14. Workout library & exercise architecture

| Programme | Detail |
|---|---|
| Push/Pull/Legs (PPL) | 11 workout days (Legs A + B). |
| Upper/Lower | 8 workout days. |
| Full Body | 7 workout days. |
| Home Workouts | 7 workout days. |
| Movement & Wellbeing | 7 content tabs. |
| Total in Supabase | ~297 rows in `workout_plans` across ~40 workout days. |

**Cache.** `workout_plan_cache` — one row per member, full 8-week JSONB programme. Generated at onboarding in background (Phase 2 waitUntil).

**Architecture.** All 5 plans available. AI recommends weekly schedule, not plan selection.

**Custom workouts.** `custom_workouts` table — member-created sessions.

**Exercise logs.** Plan-agnostic `exercise_logs` stores all sets/reps/weight permanently.

**Exercise Hub restructure (shipped 19 April).** Option A design. `exercise.html` as hub, streams as sub-pages (`workouts.html`, `movement.html`, `cardio.html`). `members.exercise_stream` column (default `workouts`). Welcome flow includes stream picker.

Still open: movement plan content in `programme_library` (no rows with `category='movement'` yet), `programme_library.category` column to distinguish movement vs gym, backfill decision for existing members, Classes stream on the hub, hub progress across all streams vs just primary.

### Workout Engine v2 — PARKED (awaiting Calum's filled inputs pack)

Calum delivered the spec, scoring data (203 exercises × 8 base dimensions + 5 context fits + tier), and 20-scenario QA framework on 27 April. Architecture decided: deterministic engine (filter → score with context weights → rank → fill slots) replaces AI exercise selection. AI used only for programme name/rationale (Sonnet 4) + Layer 2 reviewer (Haiku 4.5). Drops cost ~30× (~£0.30 → ~£0.01 per onboarding) AND raises quality.

**Build resumes when Calum returns the filled inputs pack** (`VYVE_Inputs_Pack_for_Calum_v2.docx` + `VYVE_Exercise_Scoring_Gap.xlsx`). Stages on restart locked at backlog "Workout Engine v2".

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
| Microsoft Exchange (GoDaddy) | `team@vyvehealth.co.uk` is on a personal Microsoft Exchange via GoDaddy account. Migrate to a proper Workspace tenant post-first-enterprise-contract. SCCs: not currently in place; required if/when EU subprocessing is involved. |
| External DPO | Required before 500 members. Budget £2–5K/year. |
| Employer reporting | Aggregate only — no individual names ever. |
| RLS | All public tables have RLS enabled (9 April audit + verified through achievements ship 27 April). |
| WHISPA programme | £3.7M research launching May 2026 — potential research partnership. Monitor. |

---

## 17. Charity mechanic

**Individual track.** Every 30 completions of a specific activity type = 1 free month donated to a charity partner recipient.

**Enterprise track.** Every 30 activities collectively by a company's members = 1 free month donated.

**Framing.** Collective impact — the team's activity funds access for people in need via VYVE's charity partners. Not a personal referral reward. Central to CIC positioning and social-impact narrative.

**Charity partner categories.** Addiction recovery · homelessness & reintegration · mental health organisations · social mobility programmes · physical health access for underserved populations.

**Partner economics.** £0 cost to charity partners to refer recipients. £0 cost to recipients. Counters reset after each 30 activities — unlimited donations possible. Milestone certificates awarded automatically.

**Named partner status:** Not yet confirmed. To be added once the first formal partnership agreement is in place.

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

Hosted via GitHub Pages (`Test-Site-Finalv3`). Domain routes via Cloudflare. The portal pages at `online.vyvehealth.co.uk` are bundled inside the iOS + Android Capacitor binaries; the web URL itself is a browser-accessible account-management fallback (still service-worker-cached for offline resilience).

---

## 19. Current status — 04 May 2026 PM-8

**04 May 2026 PM-8 — Offline data layer session 2a (habits + weight log writes).** Extended the offline-tolerance pattern from workouts to two more high-frequency surfaces: `daily_habits` (logHabit / undoHabit / autotick) and `weight_logs` (the nutrition.html weight tracker POST). Idempotent via existing natural-key on_conflict + merge-duplicates — re-flushes are no-ops without needing client_id. Three more partial unique indexes added (`weight_logs`, `nutrition_logs`, `wellbeing_checkins` — last two pre-staged for sessions 2b/2c). SW cache `v2026-05-04d-offline-data` → `v2026-05-04e-offline-habits-weight`. vyve-site commit [`9a9e7cec`](https://github.com/VYVEHealth/vyve-site/commit/9a9e7cecc9723a9493d209e929572ab252d914e2). Sessions 2b (log-food rework around client_id row identity) and 2c (wellbeing-checkin offline UX with deferred AI response) remain in backlog.


**04 May 2026 PM-7 — Offline data layer session 1 (workouts).** Generic `vyve-offline.js` shipped with cache-then-network reads and outbox-queued writes. Schema: `client_id uuid` + partial unique index `(member_email, client_id)` added to `exercise_logs`, `workouts`, `cardio`, `daily_habits`. Wired workouts-only end-to-end: `loadExerciseHistory` + `loadCustomWorkouts` cache-first; `saveExerciseLog`, completeWorkout's workouts INSERT, and the workout_plan_cache PATCH all queue with idempotent client_ids. SW cache `v2026-05-04c-notif-routing` → `v2026-05-04d-offline-data`. `/vyve-offline.js` added to precache list. vyve-site commit [`d988c963`](https://github.com/VYVEHealth/vyve-site/commit/d988c9634f058c62ccf3ce1a2c51cd8d735f7c3b). Sessions 2 (habits/weight/nutrition/wellbeing) and 3 (read-only caching across remaining pages) parked in backlog.


### Completed — Dean (technical)

- **Native app store welcome email + login PWA install banner removal (04 May 2026 PM-3, 2 commits + 1 EF deploy)** — cleaned up legacy PWA install affordances now that iOS 1.2 is on App Store (since 28 April) and Android Play Store URL is live. `vyve-site` `login.html` strips the entire "Add VYVE to your home screen" banner (CSS + HTML + `initPWAPrompt` script — 5,054 chars / 4 surgical cuts) — kept SW registration for offline cache. `onboarding` EF v82 deploys with the welcome-email `pwa` constant rewritten from "Open in Safari → Add to Home Screen" instructions into native App Store + Play Store download buttons (iOS `apps.apple.com/gb/app/vyve-health/id6762100652`, Android `play.google.com/store/apps/details?id=co.uk.vyvehealth.app`). v82 also closes the source-header drift logged PM-2: header label, console.logs, and `onboarding_version` field all bumped v78→v82. New ezbr_sha `e004b86d…` ≠ v81 `db0ac99e…`. Members onboarding from today get directed to the wrapped app rather than the legacy PWA-install workaround.
- **Email pipeline silent-failure recovery + watchdog (04 May 2026 PM-1, 6 commits)** — daily/weekly/monthly internal reports stopped landing in `team@vyvehealth.co.uk` on 28 April; Dean noticed manually 6 days later. Diagnosed as Brevo recipient-MX cache lag independent of public DNS: `team@` mailbox was hard-bouncing through one specific upstream Microsoft Exchange / GoDaddy blip on 28 April, healed at the inbox layer the same day, but Brevo's outbound mail server kept the failed MX cached well past public DNS TTL and the address sat on Brevo's blocked-contacts list silently absorbing every retry. Public DNS, MX, SPF, DKIM, DMARC all verified correct on GoDaddy panel; inbound to `team@` confirmed working from Dean's phone before any Brevo retest landed. Brevo dashboard's "Check configuration" button validates outbound auth (passed all green) but does NOT refresh recipient-MX cache — that's Brevo's biggest hidden-failure surface. Cleared by waiting ~3h; tested with manual canary fire that confirmed delivery resumption. Shipped: (1) `daily-report` v8, `weekly-report` v3, `monthly-report` v2 — all three EFs gain optional `?date`/`?week_start`/`?month_start` and `?to`/`?cc` params for backfill and recipient override; default cron behaviour unchanged. (2) 12 backfilled reports to `team@` covering 24 Apr → 3 May activity (10 dailies + 1 weekly + April monthly) — all delivered, zero bounces. Duplicate copies also landed in Dean+Lewis Hotmail during the wait window — harmless extras. (3) `email-watchdog` v1 EF + jobid 16 cron (`*/30 * * * *`) — five checks: missing-daily-delivery (26h), recent team@ hard-bounces (24h), team@ on blocklist, pg_cron failures (6h), bounce-spike across all auto-emails (1h). Alerts via multi-recipient (Dean Hotmail TO + Lewis Hotmail + team@ CC) so a single inbox failure can't blind us; per-code 6h suppression via `watchdog_alerts` table. New §23 hard rule for the Brevo MX cache lag pattern. master.md §16 corrected: `team@` is Microsoft Exchange via GoDaddy, never was Google Workspace — userMemories cache had it wrong.
- **HealthKit auto-recovery + sync-gap closure (29 April PM-4, 7 commits)** shipped end-to-end. Diagnosed silent breakage of HK reads on 1.2 App Store binary install (28 April 19:24 UTC onwards): iOS reset HK auth to "not determined" on the new signed binary, existing sync flow had no recovery path, and `last_sync_at` advanced through broken syncs creating a data gap. Fixed via three changes: (1) `get-health-data` v6 — split combined samples query into 4 per-type queries to escape Supabase's 1000-row default cap that was crowding out workouts/sleep/weight under HR volume; (2) `healthbridge.js` v0.4–v0.7 — Capacitor App lifecycle listeners, 60→2min cooldown, auto-recovery via `requestAuthorization` retry on all-probes-unauthorized pattern, `?fullsync=1` URL trigger, Force-full-backfill button on apple-health.html, dropped synthetic native_uuid fallback; (3) `sync-health-data` v9 — don't advance `last_sync_at` on auth-blocked syncs, mark `last_sync_status:'auth_blocked'` instead so next successful sync's incremental window covers the gap. Plus DB cleanup of 7 synthetic-UUID dup workout samples + 4 dup cardio rows on Dean's account. Live data flow confirmed: today's aggregates ingesting at 15:00 UTC, missing 28 April 18:33 BST run recovered at 15:21 UTC, 28 April daily totals retroactively corrected. Three new §23 hard rules codified. See PM-4 changelog entry for full diagnostic journey.
- **Achievements UI trophy-cabinet redesign** shipped (29 April 2026 PM-3, vyve-site `30ef4ddba`). Replaced wall-of-tiles grid with three sections: Recently earned (last 6 unlocks, horizontal scroller) → Up next (top 3 in-progress) → Trophy cabinet (one trophy per metric, click → full-ladder modal). EF unchanged. SW cache `v2026-04-29c-trophy-cabinet`. Mockup-first workflow used and approved before code touched.
- **Notification routing infrastructure** shipped end-to-end (29 April 2026 PM-2, vyve-site `30e8398b`). Every notification on every surface (in-app toast, in-app row, web push, native push) carries a route to the right destination. Schema: `route TEXT` column added to `member_notifications`, all 35+ existing rows backfilled via SQL `regexp_replace`. Server: `send-push` v13 (writes `data.url` to row); `achievement-earned-push` v2 (per-tier deep-link `/engagement.html#achievements&slug=X&tier=Y`); `log-activity` v27 (platform v30) — streak rows route to `/engagement.html#streak`, achievement rows carry per-tier route. Client: `/achievements.js` toast click reads `earn.route` with fallback; `engagement.html` `parseHashRoute()` parses `#achievements&slug=X&tier=N` and auto-opens modal once grid loads; `notification_navigate` postMessage listener routes in-place if member already on the page; `#streak` anchor target added. SW cache `v2026-04-29a-ach-grid` → `v2026-04-29b-routes`.
- Supabase Pro. **76 public tables**, ~30 core operational Edge Functions, SQL functions for activity caps + charity totals.
- Supabase Auth migration complete. Auth0 gone. `auth.js` v2.3 live.
- All portal pages live: index, habits, exercise, workouts, movement, cardio, nutrition, log-food, settings, certificates, engagement, leaderboard, sessions, wellbeing-checkin, monthly-checkin, running-plan, welcome, login, set-password, strategy. Plus parked: apple-health, activity.
- Theme system (dual dark/light tokens) live. `nav.js` body-prepend pattern. Cache-first dashboard. Consent gate built and wired. Viewport zoom disabled. `target="_blank"` audit complete.
- Service worker network-first for HTML + skipWaiting + clients.claim. **Push event listener + notificationclick handler shipped 28 April PM** (`vyve-site@124ecb53`) — fixed silent web push breakage that had been live since initial push rollout. Current cache: `vyve-cache-v2026-04-29h-fullsync-btn`.
- Activity logging via `log-activity` v23 (Make retired from Dean's stack).
- Re-engagement system live — streams A/B/C1/C2/C3, `engagement_emails` live.
- Certificate automation — `certificate-checker` v24, global sequential numbers, Brevo delivery.
- Running plan generator — Haiku 4096 max_tokens, Supabase-first, `member_running_plans` table.
- **Admin Console Shell 1 + 2 + 3 Sub-scope A** — live at `admin.vyvehealth.co.uk`.
- **Exercise Hub (19 April)** — stream-aware onboarding, hub page, movement + cardio sub-pages, running plan server-side storage.
- **Leaderboard refactor (21 April)** — privacy-aware, classic top-100, range selector, scope tabs, anonymous banner, tie-aware gap copy.
- **HealthKit integration** — 7 read scopes + 1 write (weight). Device-validated. `@capgo/capacitor-health@8.4.7` wired via SPM. Pipeline rebuild around `queryAggregated` + `member_health_daily`. BST bucket bug squashed. Sleep-state coverage verified.
- **HealthKit autotick (sessions 1–3a, 24–25 April)** — schema + Lewis-approved seeds + server evaluator + `_shared/taxonomy.ts` + client UI + copy-only attribution. **Cohort-wide post 26 April** — `HEALTH_FEATURE_ALLOWLIST` dropped, truthsource is `member_health_connections` row presence.
- **Achievements System Phase 1 (27 April)** — three new tables, 32 metrics × 327 tier rows all `copy_status='approved'`, `_shared/achievements.ts` evaluator (inline + read-only), `log-activity` v22 inline integration, `member-dashboard` v55 dashboard payload, `achievements-mark-seen` v1, `achievements-sweep` v2 (member_days only — Phase 2 metrics deferred), 185-tier backfill marked seen. See §11A.
- **Push notifications Foundation (28 April PM)** — `send-push` v11 unified web/native fan-out EF + `habit-reminder` v14 + `streak-reminder` v14 refactored to delegate. Dual-auth pattern via `LEGACY_SERVICE_ROLE_JWT`. Three §23 hard rules codified.
- **Push notifications Session 2 item 1 (28 April PM)** — `achievement-earned-push` v1 + `log-activity` v23 + `achievements-sweep` v2 push fan-out wiring. End-to-end smoke on Dean (synthetic) and on Vicki (real `member_days` t2 cross during sweep). Lewis-approved copy intact.
- **SW push handler patch (28 April PM continuation)** — diagnosed silent web push breakage from initial rollout; sw.js had no `push` event listener AND no `notificationclick` handler. Patched in `vyve-site@124ecb53`. Cache key bumped. Two new §23 hard rules codified.
- **VAPID JWK fix in `send-push` v12 (28 April late PM)** — verifying the SW handler patch end-to-end on Mac Safari surfaced a deeper second bug: `crypto.subtle.importKey('raw', …, ['sign'])` for the VAPID private key was throwing `Invalid key usage` (invalid per Web Crypto spec; Deno enforces strictly) inside the per-sub `try/catch` in `makeVapidJwt`. Caught silently as `{ok:false, status:0}`, counted in `web_attempted` but never `web_sent` or `web_revoked`. Fixed by importing as JWK with x/y reconstructed from the public key bytes; module-scoped key cache. Verified end-to-end via `fire-test-push` v3 (inline JWK → 4× HTTP 201 from `web.push.apple.com` with valid `apns-id` headers) and `fire-test-push` v4 (production wrapper through `send-push` v12 → `web_sent: 4`). Web push pipeline functional for the first time since initial rollout. Third new §23 hard rule codified.
- **iOS App Store 1.2 — APPROVED (28 April 2026)** — bundles HealthKit + native push permission flow + reliability fixes. Status: **Ready for Distribution**. Version trail: 1.0(1) → 1.0(2) (icon-fix) → 1.1(3) submitted 27 April with HealthKit (later pulled from review) → 1.2(1) submitted 28 April 00:36 UTC with HealthKit + native push → approved 28 April. Cohort-wide HK autotick now live for any opted-in iPhone member upgrading from PWA to native.
- **First paying B2C customer** — Paige Coult, joined 13 April 2026, £20/month.
- 15 active members in `members` table (live count via Supabase). 3 admin operators in `admin_users`.
- `member_home_state` aggregate with real-time trigger maintenance wired to 10 source tables.
- `schema-snapshot-refresh` weekly cron, auto-committing structural changes to VYVEBrain.
- **Phase 3 Achievements foundation (29 April AM)** — closed the silent inline-evaluator gap. log-activity v26 (platform v29) deployed with `evaluate_only:true` short-circuit. New `/achievements.js` v1 client lib (toast queue + debounced evaluator + mark-seen + replay-unseen) loaded across all portal pages. All 9 trigger pages wired to call evaluator after writes; 8 passive pages load lib for replay-unseen. SW cache bumped `v2026-04-28c-ach-wire`. End-to-end smoke verified on Dean (first real member-action achievement earn since system was built). Phase 3 UI (engagement.html grid tab + index.html dashboard slot) still pending; foundation now unblocks it.

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
- **Achievements copy approval (27 April PM)** — 327/327 tier rows + 32 display names approved across two sessions. Voice rules locked-in.

---

## 20. Enterprise contract blockers

| Item | Owner | Status |
|---|---|---|
| Brevo logo removal (~$12/month) | Lewis | OPEN |
| Facebook Make connection refresh | Lewis | **CRITICAL — EXPIRES 22 MAY 2026** |
| B2B volume tiers defined | Lewis + Dean | OPEN |
| Make social publisher fix (Scenario 4950386) | Lewis | DEFERRED (133 posts stuck since 23 March) |
| Health disclaimer wording | Lewis sign-off | PENDING |
| HAVEN clinical review | Phil | PENDING — persona content held from sign-off; auto-assignment currently active in production (see §10) |

---

## 21. Outstanding build items & priorities

**TOP PRIORITY: Polish + bug-fix pass + Achievements Phase 3 UI + In-App Tour build pipeline.** iOS 1.2 is approved and Ready for Distribution; the cohort-wide HealthKit + native push window is now open. The May 2026 sell-ready milestone now hinges on the headline UX wins, not on store reviews.

### Critical missing pieces

1. **Push notifications — Session 2 trigger build (4 of 5 EFs remaining):**
   - `session-start-nudge` — cron 15min pre-scheduled live session start. Optional opt-in.
   - `weekly-checkin-nudge` — cron Monday 09:00 London. **Cohort split discovered 28 April PM:** of 15 members opted in via `notifications_weekly_summary=true`, 12 are overdue, but **11 of those 12 have never completed a wellbeing check-in at all**. A "your weekly check-in is overdue" push reads wrong to a first-timer. Bifurcated copy needed: first-time activation framing for the 11, continuity framing for prior check-iners. Mental-health-adjacent — Phil should weigh in. Gated on Lewis + Phil conversation before scaffolding the EF makes sense.
   - `monthly-checkin-nudge` — cron 1st of month 09:00 London.
   - `re-engagement-push` — companion to existing Brevo stream A; cron daily, push to 7-day inactive cohort.

   Session 2 item 1 (`achievement-earned-push`) is shipped and proven end-to-end.

2. **Push notifications — Session 3 polish:**
   - `notification_preferences` per-trigger booleans (extend `members.notifications_milestones` + `notifications_weekly_summary` columns OR new table); settings.html UI.
   - Max-pushes-per-day cap (3? Lewis decision).
   - Lewis copy approval doc for all 5 trigger types.
   - Foreground-suppression on iOS — Capacitor `pushNotificationReceived` listener should consume the payload as in-app toast input rather than letting APNs banner display when app is foregrounded.

3. **Achievements Phase 2 — sweep extensions:**
   - `volume_lifted_total` evaluator wiring with sanity caps (`reps_completed > 100` OR `weight_kg > 500` excluded). Two corrupt rows on Dean's account (Back Squat, 2026-04-18, `reps_completed = 87616`) need zeroing first.
   - HK lifetime metrics (4) + `full_five_weeks` + `charity_tips` + `personal_charity_contribution` + `tour_complete` + `healthkit_connected` + `persona_switched`.
   - Clean orphan `running_plans_generated` entry from evaluator INLINE map next time we touch `log-activity`.

4. **Achievements Phase 3 — UI (now unblocked, not yet sequenced):**
   - Achievements as a tab on `engagement.html`.
   - Toast queue for newly-earned tiers (post mark-seen workflow via `achievements-mark-seen` v1).
   - Dashboard slot showing latest unseen / next-up tier.

5. **In-App Tour / First-Run Walkthrough.** Builds on top of Achievements — every tour step earns the relevant first-tier achievement, so day one ends with banked progress instead of 0% cold start. Modal step-through (option a) confirmed for v1. Persistence via `members.tour_completed_at`. Skip path required. Lewis copy + screenshot approval needed. ~1–2 sessions, mostly UI.

### This week

- `auth.js` ready-promise refactor (`window.VYVE_AUTH_READY`) — unblocks deferred-script perf win.
- Tech debt: `#skeleton` + `#app` dual-main DOM on `exercise.html` + `movement.html` — migrate to single `#app` with internal skeleton state.
- Calendar integration (Google/Apple) + calendar page in portal.
- SW push handler verification on a real browser (Mac Safari / iPhone Safari) — tonight's `124ecb53` patch is verified at static-analysis level only; needs a manual `send-push` smoke against Dean's web subs to confirm banner renders.
- `vyve-capacitor` git initialisation (`git init && git add . && git commit -m "Initial commit"` from `~/Projects/vyve-capacitor`) — flagged backlog risk.

### Soon

- Weekly check-in slider questions — update to mirror initial questionnaire questions.
- Re-engagement automations (3) — 7-day no login, questionnaire incomplete, registered no activity. Lewis owns email copy.
- Live viewer count on session pages — only display when 20+ viewers.
- AI weekly goals system (phase 2) — blocked on check-in page + Lewis email copy.
- Weekly progress summary email (Friday, AI-generated, Brevo) — blocked on Lewis copy.
- Today's Progress dot strip — blocked on Lewis copy approval.
- Persona context modifier system.
- PostHog / Supabase Auth identity wiring.
- Milestone message system.
- Social activity feed (activity-only, no comments/photos in v1) — scoped and back-burnered.
- HealthKit background sync — **parked 25 April 2026** as future vision. Full investigation + parked plan at `plans/healthkit-background-sync.md`. Capgo 8.4.7 exposes zero background primitives; architectural path is a companion Swift Capacitor plugin (~400 lines), ≈4–5 build sessions + 1 week device soak + App Store review cycle.
- Health Connect (Android) — parked until Dean has a Pixel/Galaxy device for E2E testing. Schema + EF logic extension-ready.
- Nutrition/MFP reads via HK — parked. Capgo 8.4.7 exposes no dietary types; would need plugin fork/PR.
- National Lottery Awards for All application.
- The Fore grant — register June/July 2026.
- WHISPA research partnership — monitor May 2026 launch.
- Workout Engine v2 — parked awaiting Calum's filled inputs pack.

### Backlog — security & hygiene

- Edge Functions deletion pass — ~32 still-ACTIVE candidates (one-shots, debug, migration EFs from earlier sessions). Tonight's `smoketest-ach-push` v2 (inert 410 stub) added to the list. Composio doesn't expose a delete-EF tool — needs Supabase CLI/dashboard.
- Anon-key rotation (admin console).
- Brain hygiene — base64-encoded historical blob in `brain/changelog.md` (~152K decoded chars) — cleanup session pending.
- Changelog archive — split pre-17 April entries into `changelog-archive/2026-Q1.md`. Current changelog is 247K chars and growing.

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
- HAVEN go-live — Phil's clinical review. **Currently auto-assigning in production** (Conor Warren on HAVEN since 15 April). Decide: pause auto-assignment until sign-off, or accelerate Phil's review.
- `VYVE_Health_Hub.html` go-live — Phil's clinical review of assessment instruments, scoring/risk thresholds, and signposting copy. Page is staged in web root; promote to nav once approved.
- Microsoft Exchange / GoDaddy migration (`team@vyvehealth.co.uk`) — currently a personal account; migrate to a proper enterprise tenant post-first-enterprise-contract.
- External DPO service — required before 500 members.
- 5 disabled Make tasks — keep or remove: LinkedIn article, podcast brief, LinkedIn newsletter, PR pitch, employee advocacy pack.
- Autotick evaluator multi-source arbiter — when/if a future member has two sources (HealthKit + Fitbit).
- **Weekly-checkin-nudge copy split (28 April)** — first-time activation vs continuity reminder. Phil + Lewis sign-off needed before EF scaffolding.
- Named charity partner — when to formally announce / sign first partnership.

---

## 23. Known gotchas & architecture rules

| Rule | Detail |
|---|---|
| **Auth** | Supabase Auth is primary. Auth0 gone entirely. Never say "Auth0 gated". |
| **`members.kahunas_qa_complete` is dead post-04 May** | Column still exists on the `members` table for historical reasons but **nothing reads it after re-engagement-scheduler v8**. Was the gate for the legacy Stream A in v7 ("never finished onboarding QA"). v8 replaced the gate with `privacy_accepted_at IS NULL AND no activity`. Do not gate behaviour on `kahunas_qa_complete` in new code; do not assume rows with `kahunas_qa_complete=false` are pre-onboarding. Backlog item flagged to drop the column once we're confident no admin/marketing automation reads it (one-week soak then drop). |
| **GitHub writes** | `vyve-site` is read-only via direct GitHub MCP — always 403. Writes via `github-proxy` v21 or one-shot EFs. For **large brain commits (>~50K chars), always use `run_composio_tool("GITHUB_COMMIT_MULTIPLE_FILES", args)` inside the Composio workbench — never direct MCP — to avoid base64 corruption.** Always verify post-commit by fetching and checking the first 100 chars. |
| **`upserts` not `files`** | In `GITHUB_COMMIT_MULTIPLE_FILES`: array field is `upserts`, commit text field is `message` (not `commit_message`). |
| **File read patterns** | `GITHUB_GET_RAW_REPOSITORY_CONTENT` returns an S3 URL needing a secondary fetch — S3 URLs expire fast, save to `/tmp/` immediately. `GITHUB_GET_REPOSITORY_CONTENT` returns nested `data.content.content` base64 — strip whitespace with `re.sub(r'\s+', '', b64)`, pad, then decode. |
| **Composio fetch decoding** | When fetching from `GITHUB_GET_RAW_REPOSITORY_CONTENT` S3 URLs, always use `r.content.decode("utf-8")` not `r.text`. The S3 server returns `text/plain` with no charset, so `requests` defaults to ISO-8859-1 and silently produces fake mojibake on UTF-8 content. Codified 25 April after a 10× scope overestimate on the mojibake sweep. |
| **`SUPABASE_APPLY_A_MIGRATION` silently partial-executes** | Multi-statement SQL can succeed at the tool level while only part has actually applied. For reliable trigger creation use `SUPABASE_BETA_RUN_SQL_QUERY` with `read_only:false`, one statement per call. Always verify trigger creation via `pg_trigger` directly — not `information_schema.triggers`. |
| **Trigger functions writing to RLS tables** | Must be `SECURITY DEFINER`, not `SECURITY INVOKER`. |
| **plpgsql composite-type gotcha** | Shared trigger functions attached to multiple tables must not reference `NEW.<col>` for a column that exists only on some of them, even inside IF guards. plpgsql compiles the reference against the specific table's composite type before short-circuit evaluation. Use `to_jsonb(NEW) ->> 'col'` for defensive cross-table access. Codified 24 April. |
| **Activity cap source-discrimination** | Original 2/day caps were spam prevention — wrong for Apple Watch members doing 3+ workouts/day. Since 7a, caps only apply to `source='manual'`. Charity + cert counters stay independently capped via read-path `LEAST(COUNT(*), 2)` and `existing_count < 2` checks. |
| **BST timezone bug** | Always construct local dates via `d.split('-')` → `new Date(+y, +m-1, +d)` in portal JS. `new Date(dateString)` parses as UTC and drifts by an hour in BST. Recurring class of bug. |
| **`esm.sh` unreliable in Deno** | Use Deno built-ins (Web Crypto, std library) for crypto. Codified from iOS Web Push RFC 8291 work. |
| **`first_name` location** | `members` table, not Supabase Auth `user_metadata`. |
| **SW cache bump** | Pattern `vyve-cache-v[date][letter]`. Network-first for HTML means HTML-only changes don't require a bump; non-HTML (JS, CSS, images, **sw.js itself**) still do. |
| **SW push handler requirement (28 April PM)** | Web push delivery requires `self.addEventListener('push', e => e.waitUntil(self.registration.showNotification(title, opts)))` in the SW. Without it, payload arrives, decrypts, and is discarded silently — no banner, no error logged anywhere visible. Confirmed dead from initial web push rollout through 28 April PM. ALL future SW edits must preserve this listener; touch only with intent. |
| **SW notificationclick must read `data.url` (28 April PM)** | Click-through routing for any push trigger that ships a deep-link URL requires `self.addEventListener('notificationclick', e => { const url = e.notification.data?.url || '/'; ... })` followed by `clients.matchAll` + `client.focus()` (preferred) or `clients.openWindow(url)` (fallback). Without this, taps fall back to browser default. |
| **Web Crypto `importKey` for ECDSA private keys (28 April late PM)** | `crypto.subtle.importKey('raw', bytes, {name:'ECDSA', namedCurve:'P-256'}, false, ['sign'])` is **invalid per Web Crypto spec** — `'raw'` format is for public keys with `'verify'` usage only. Private keys must be imported as `'jwk'` (with `kty:'EC'`, `crv:'P-256'`, `d`, `x`, `y`) or `'pkcs8'`. Deno's Supabase Edge Runtime enforces strictly and throws `Invalid key usage`. Hid in the original `send-push` v11 because the throw was swallowed inside the per-sub `sendWebPush` try/catch and counted as a silent attempt fall-through. Codified after spending two sessions thinking the only push bug was the SW handler. Fix pattern: reconstruct `x` and `y` from `VAPID_PUBLIC_KEY`'s uncompressed point (`0x04 \|\| X(32) \|\| Y(32)`) and use `d = VAPID_PRIVATE_KEY` as the JWK private scalar. See `send-push` v12 `getVapidPrivateKey()`. |
| **Cloudflare email obfuscation** | Rewrites emails on `www.vyvehealth.co.uk`. Wrap emails in `email_off` comment tags. |
| **Never "Kahunas"** | Product is "VYVE Health app" in member copy. |
| **Never "Corporate Wellness"** | Not used as tagline or descriptor. |
| **Anthropic key location** | Server-side in Edge Functions only. Never in HTML or committed to GitHub. Stored as Supabase secret. |
| **iOS HK auth resets on binary upgrade (29 April PM-4)** | Every signed-binary change (1.x → 1.y, PWA → native, dev → release) resets HealthKit per-app auth state to "not determined", regardless of App ID continuity. iPhone Settings → Health → Data Access & Devices entry is created on first successful `requestAuthorization` prompt, NOT on install — so a member upgrading sees "VYVE Health is not in iPhone Settings → Health" before any prompt fires, despite previous binary having had full grants. Auto-sync code paths must detect the all-probes-unauthorized pattern and re-prompt; `member_health_connections.platform` row presence is NOT sufficient signal that HK is functional. Recovery shipped in `healthbridge.js` v0.6 + `sync-health-data` v9. |
| **Supabase JS `.in()` queries hit 1000-row default cap (29 April PM-4)** | Multi-type queries combining high-volume types (heart_rate, ~2.5k/30d) with low-volume types (workouts/sleep/weight, <200/30d) under a single `.in([...])` predicate silently truncate the low-volume types to zero rows when the high-volume type fills the 1000-row default. The diagnostic page rendered "0 workouts" while the DB held 154. Always split into per-type queries with explicit `.limit()` calls when sample types have wildly different cardinalities. Codified after `get-health-data` v6 fix. |
| **Never synthesise `native_uuid` (29 April PM-4)** | If the Capgo plugin doesn't return `platformId`/`id`/`uuid`/`metadataId`, `sampleToEF()` returns null and the caller skips the sample. Earlier code synthesised a fallback shape from `start_end_value` — produced fragile dedupe keys that collided with themselves when plugin behaviour shifted across versions (real UUIDs returned later didn't match synthetic UUIDs from earlier syncs → same workout, two rows in `member_health_samples`, dup-promoted to `cardio`). 7 dup workout samples + 4 dup cardio rows cleaned up on Dean's account; client-side fix in `healthbridge.js` v0.5 prevents recurrence. |
| **Check `platform_alerts.client_diagnostics` first when HK silently breaks (29 April PM-4)** | The Capgo plugin doesn't surface "permission was reset on binary upgrade" — every probe just returns the generic `Authorization not determined` error. `platform_alerts` rows logged from `healthbridge.js` are the canonical first-look diagnostic surface for any HK regression. Query: `SELECT created_at, alert_data->'diagnostics' FROM platform_alerts WHERE alert_type='healthkit_diagnostics' AND member_email=? ORDER BY created_at DESC LIMIT 5;` — if every probe in the most recent row failed with `auth-not-determined`, you have a binary-upgrade auth reset, not a code bug. Always check this before chasing entitlements, plugin registration, or EF code. |
| **Server-side EFs must verify a sync actually pulled data before advancing `last_sync_at` (29 April PM-4)** | Generalised rule from the 28 April HK gap bug. Any EF that maintains a "last successful sync" cursor must check the response shape — empty pulls, all-probes-failed pulls, and explicit error responses must NOT advance the cursor. `sync-health-data` v9 implements this for HK via `diagnosticsShowAuthBlocked()` returning `auth_blocked:true` instead of advancing. Apply the same pattern to any future cursor-advancing EF (e.g. fitness-bridge for Android Health Connect, future sleep integrations). |
| **HAVEN safeguarding** | Must signpost professional help in crisis. Clinical review required before promotion — HAVEN is currently auto-assigning in production despite Phil not having signed off (open issue, see §10/§22). |
| **NOVA/SPARK restriction** | Never assign with serious life context flagged in Section G. |
| **Brevo logo** | Free plan injects "sent via Brevo" footer. ~$12/month upgrade removes it. Pending before enterprise demo. |
| **Microsoft Exchange via GoDaddy** | `team@vyvehealth.co.uk` is a personal Microsoft Exchange via GoDaddy mailbox. NEVER refer to it as Google Workspace — that is incorrect. MX is `vyvehealth-co-uk.mail.protection.outlook.com`. SPF authorises `secureserver.net`, `spf.protection.outlook.com`, and `spf.brevo.com`. DKIM via `brevo1._domainkey` and `brevo2._domainkey` CNAMEs. Migrate to enterprise tenant post-first-enterprise-contract. |
| **Brevo recipient-MX cache lag (04 May PM-1)** | Brevo's outbound mail-relay servers cache MX records for recipient domains independent of public DNS TTL. When `team@vyvehealth.co.uk` started hard-bouncing on 28 April due to a transient upstream blip, Brevo logged the bounce, added the address to its transactional blocked-contacts list, and continued routing to a stale MX even after the inbox layer self-healed. The dashboard's "Check configuration" button validates outbound auth (SPF/DKIM/DMARC/brevo-code) but does NOT touch the recipient-MX cache. All four green ticks can mask a real failure. **Symptoms:** EFs return success, cron fires fine, Brevo API returns 200 + valid messageId, but `smtp/statistics/events?event=hardBounces` shows every send rejected. **Diagnosis:** check `smtp/blockedContacts` and `smtp/statistics/events` filtered by recipient and `event=hardBounces` for the bounce reason text. **Resolution:** (a) wait 1–4h for Brevo's resolver to expire its cache (typical), (b) Brevo support flush request, (c) temporarily reroute via cron `body` override (`{"to":"alt@email","cc":"alt2@email"}`) to a known-good inbox while the cache clears. **Watchdog coverage (`email-watchdog` v1, jobid 16):** `team_hardbounce`, `team_on_blocklist`, `daily_report_not_delivered_24h` all alert within 30 min of recurrence. |
| **Always send pipeline alerts to multiple recipients (04 May PM-1)** | A single inbox failure must never blind us to itself. `email-watchdog` sends to `deanonbrown@hotmail.com` (TO) with `lewisvines@hotmail.com` and `team@vyvehealth.co.uk` (CC) — even if `team@` were the failing recipient, the two Hotmail addresses still receive the alert. Apply the same multi-recipient pattern to any future critical-path automated mail (alerts, on-call notifications, enterprise sales alerts). |
| **Gemini imagery** | Always append: *"Colour grade: deep teals and greens, warm highlights, no text, no logos."* |
| **Live session badges** | Green (`#22c55e`), never red. |
| **`weekly_goals` dedupe** | Unique constraint on `(member_email, week_start)`. Safe to re-run onboarding. |
| **iOS Web Push user gesture** | Must be triggered from a user gesture (button click), not page load. RFC 8291 AES-GCM encryption mandatory. |
| **Employment Rights Act** | SSP changes 6 April 2026 — strongest current economic argument for preventative wellbeing. Use in all sales conversations. |
| **Theme system** | All portal pages use dual dark/light CSS token blocks. Never single `:root`. Always include `theme.js` before closing `head`. |
| **EF deploys** | Always require full `index.ts`. `verify_jwt:false` for public-facing. |
| **VYVE is not a PWA — it's two Capacitor binaries** | The product is delivered as the **iOS App Store** binary and the **Google Play Store** binary, both wrapping the `vyve-site` web shell via Capacitor. `online.vyvehealth.co.uk` is a browser-accessible **account-management fallback** for members who need web access — it is *not* the member experience. Don't reintroduce "add to home screen" / PWA install banners (removed 04 May PM-3). Member-facing copy says "the VYVE Health app" — never "the PWA". The phrase "PWA" is internal-only and refers strictly to the legacy infrastructure (service worker, `offline.html`) that still services the web fallback. |
| **iOS Capacitor wrap is LIVE** | App Store binary 1.2 approved 28 April. HealthKit + native push permission flow in production. Cohort-wide HK autotick available to any opted-in iPhone member. |
| **Push delivery state — three channels, one working** | **APNs (iOS):** live and shipping via `push-send-native` v5+. Auto-revokes 410/400 BadDeviceToken. **FCM (Android):** `register-push-token` accepts and stores Android tokens in `push_subscriptions_native`, but `push-send-native` v5 explicitly skips them with `reason: "android FCM not implemented (backlog #6)"`. Android members receive in-app `member_notifications` rows + correct tap routing — but no system banner. **VAPID web push:** retired. `push_subscriptions` table still exists, last sub registered 15 April 2026 (pre-iOS-1.2). `send-push` v12 still includes the web fan-out leg but it's a no-op for current members. Don't invest further in VAPID; FCM is the next push priority. |
| **Website footer** | Standardise all footers to "VYVE Health CIC" (not "Ltd") — legal structure. |
| **Enterprise references** | Named prospects not included in brain or investor docs. Use generic language. |
| **Pre-launch / staging files in `vyve-site` root** | "No inbound links + no backend wiring" is NOT a sufficient signal that an HTML file is orphaned. Some files are staged in the web root unlinked from nav while waiting on a clinical/Lewis/Phil sign-off (e.g. `VYVE_Health_Hub.html`). Never archive or delete a substantial standalone HTML file from `vyve-site` without confirming with Dean first. |
| **`GITHUB_COMMIT_MULTIPLE_FILES` deletes shape** | `upserts` takes objects `{path, content, sha?}` but `deletes` takes a flat array of path strings, not objects. |
| **App Store icon must be RGB no-alpha** | App Store Connect rejects PNGs with alpha channel even when alpha is uniformly 255. Flatten via PIL: `Image.new("RGB", size, bg).paste(rgba, (0,0), rgba)` before submission. |
| **`@capacitor/assets` v3 single-icon scheme** | Modern Xcode 14+ reads a single `AppIcon-512@2x.png` at 1024×1024 universal from `AppIcon.appiconset/`. Legacy 60/76/83.5 multi-size slots no longer in spec. |
| **Sharp on Apple Silicon** | `npm install --include=optional sharp` required on M-series Macs before any sharp-using tool will run. |
| **`@capacitor/assets generate` doesn't clean orphans** | Manually `rm` files not referenced in regenerated `Contents.json`, otherwise Xcode flags "N unassigned children". |
| **Canonical brand icon source** | `online.vyvehealth.co.uk/icon-512.png` is the PWA install icon — fully opaque, brand-correct. Lanczos upscale 512→1024 + RGB flatten on `#0D2B2B` is App Store-acceptable. |
| **App Privacy carries forward across versions** | Once 1.0 publishes Health + Fitness data types, subsequent versions inherit without re-attestation. |
| **Distribute App: uncheck "Manage Version and Build Number"** | When agvtool has set the version locally, Xcode's distribute-time auto-bump leaves Info.plist drifted. |
| **agvtool "Jambase targets" preamble** | Harmless. agvtool falls through to native targets and writes correctly. |
| **`vyve-capacitor` is NOT a git repo** | Operational risk. Two-line fix: `git init && git add . && git commit -m "Initial commit"` from `~/Projects/vyve-capacitor`. Backlog. |
| **AppDelegate.swift bridge methods required for Capacitor PushNotifications** | Without `application(_:didRegisterForRemoteNotificationsWithDeviceToken:)` and `application(_:didFailToRegisterForRemoteNotificationsWithError:)` posting `.capacitorDidRegisterForRemoteNotifications` / `.capacitorDidFailToRegisterForRemoteNotifications` to `NotificationCenter`, the registration event never fires. Audit before any future archive. |
| **Service-role-guarded EFs need the `sb_secret_*` value, not the legacy JWT** | When an EF compares `Authorization` against `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` literal, runtime-injected value post-key-rotation is the new `sb_secret_*` not the legacy `eyJhbGc...` JWT. ALWAYS pass `reveal:true` to `SUPABASE_GET_PROJECT_API_KEYS` for manual workbench/curl invocations. |
| **App Store: `NSFaceIDUsageDescription` required even for unused biometric plugins** | `capacitor-native-biometric` or any plugin linking `LocalAuthentication.framework` gets compiled into the binary. Defensively add via PlistBuddy. |
| **Composio `SUPABASE_UPDATE_A_FUNCTION` corrupts deployed bundles** | Reproducer 28 April: deploy a working stub via `SUPABASE_DEPLOY_FUNCTION` (status 200), then call `SUPABASE_UPDATE_A_FUNCTION` with byte-identical body — next invoke returns persistent BOOT_ERROR. Metadata changes (verify_jwt) DO take effect, but the bundle gets mangled. **Always use `SUPABASE_DEPLOY_FUNCTION` for body changes.** UPDATE is unsafe except for slug/name renames. |
| **`SUPABASE_DEPLOY_FUNCTION` has no verify_jwt param — defaults true** | Combined with the UPDATE corruption rule, this means we cannot reliably set `verify_jwt:false` on Composio-deployed EFs. With `verify_jwt:true` the gateway accepts only JWT-format tokens and rejects `sb_secret_*` with `UNAUTHORIZED_INVALID_JWT_FORMAT`. |
| **Dual-auth pattern for service-role-guarded EFs** | Workaround for the verify_jwt-stuck-true situation. Save the legacy service-role JWT as a non-`SUPABASE_*`-prefixed secret (`LEGACY_SERVICE_ROLE_JWT`). Have the EF's guard accept `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` (= `sb_secret_*`) OR `Bearer ${LEGACY_SERVICE_ROLE_JWT}`. External callers (workbench INVOKE, Composio) use the legacy path; internal EF→EF callers can use either. `send-push` v11 and `achievement-earned-push` v1 are canonical implementations. |
| **EF semantic version vs Supabase platform version (28 April)** | Brain tracks **semantic versions** (Dean-controlled bumps with code changes). The Supabase API returns **platform versions** that auto-increment on every deploy/redeploy/metadata change, including no-ops. As of 28 April, platform version is consistently +3 to +4 ahead of semantic version across most EFs (a residue of the `SUPABASE_UPDATE_A_FUNCTION` corruption diagnostics). Treat the gap as expected, not as drift. When auditing brain vs live, compare semantic versions; the platform-numbers from `list_edge_functions` are not the source of truth. |
| **Trigger pages bypass log-activity for direct PostgREST writes (29 April)** | habits.html, workouts.html, cardio.html, sessions.html, wellbeing-checkin.html, monthly-checkin.html, log-food.html, movement.html, nutrition.html, plus the workouts-*.js modules write to their tables via direct `/rest/v1/<table>` POSTs, NOT through `log-activity`. The inline achievement evaluator wired into log-activity v22+ therefore does not fire from these writes by default. log-activity v26 (platform v29) (29 April) added an `evaluate_only:true` short-circuit that skips write/cap/dedup logic and runs the evaluator only; trigger pages now call `VYVEAchievements.evaluate()` from `/achievements.js` after each successful write. Without this wire-up the inline path is dead even though the EF code is correct. ALL future trigger pages added must include this call. Standard new-trigger checklist: (1) load `/achievements.js`, (2) fire `VYVEAchievements.evaluate()` in post-write success branch, (3) any waitUntil fan-out to push or in-app already runs server-side from the EF — no client work needed.

**Phase 3 grid (29 April 2026 PM)** — `engagement.html` Achievements tab live. Trophy-shelf design with cream shelves, tier-tinted SVG trophies/shields/medals/banners. Bronze/silver/gold/platinum tinting by tier index (1-3/4-6/7-9/10+). Shape varies by category (trophy=counts, shield=volume, medal=streaks, banner=one-shots/charity/variety). Tile click → modal with full title/body/earned-date or progress. Hash deep-link `#achievements` switches tab on load + on hashchange — toast clicks from `/achievements.js` now route to a real grid. Backed by `member-achievements` v2 EF (JWT-required, calls `getMemberGrid()` from `_shared/achievements.ts`). Cache-Control: `private, max-age=30`. localStorage cache fallback for offline (`vyve_ach_grid`).

**Phase 2 `volume_lifted_total` wiring (29 April 2026 PM)** — wired into INLINE evaluator with sanity caps `reps_completed <= 100 AND weight_kg <= 500` matching grid helper. Two corrupt `exercise_logs` rows on Dean's account (Back Squat, 2026-04-18, reps=87616) zeroed. Cohort backfill of 12 earned tiers across 4 members (Dean t1-5, Lewis t1-3, Stuart t1-3, Calum t1) marked seen on insert to prevent toast storm. log-activity bumped to v26 (platform v29) to keep shared module in lockstep with member-achievements.
 |

### Hard Rule (notification routing) — 29 April 2026 PM

**Every notification — in-app, web push, native push — carries a route to its destination. Tapping any notification on any surface lands the member precisely where the notification refers to.**

**Where the route lives:**
- `member_notifications.route` (TEXT column) — populated on every insert
- VAPID web push payload `data.url` — read by SW `notificationclick` handler
- APNs payload `data.url` (via `push-send-native`) — read by Capacitor `pushNotificationActionPerformed`
- The toast click handler in `/achievements.js` reads `earn.route` from the EF response (with deep-link fallback)
- The SW posts `{type:'notification_navigate', url:...}` to existing tabs so a member already on the destination page routes in-place via `engagement.html`'s `parseHashRoute()`

**Single source of truth:** `send-push` v13 reads `input.data.url` and writes it to `member_notifications.route` so web/native push payloads + in-app row stay in lockstep. Other writers (e.g. `log-activity` v27 `writeAchievementNotifications` + `checkAndWriteStreakNotification`) build the route inline and pass it in both fields.

**Checklist for adding a new notification type:**
1. Decide the destination URL (page + hash if applicable). Examples: `/habits.html`, `/wellbeing-checkin.html`, `/engagement.html#streak`, `/engagement.html#achievements&slug=X&tier=Y`, `/sessions.html#session-{id}`.
2. If the writer goes through `send-push`: pass `data: { url: '<route>' }` — `send-push` v13+ writes it to `member_notifications.route` automatically and the SW + native handler read it from `data.url`.
3. If the writer inserts to `member_notifications` directly (e.g. `log-activity` streak/achievement handlers): pass `route: '<url>'` in the row payload AND ensure any push fan-out includes the same URL in `data.url`.
4. If the destination is a hash anchor (`#streak`, `#achievements&...`), confirm the target page has either a matching DOM `id` (for plain hash scrolls) OR a `parseHashRoute()`-style handler (for parametric hashes that open modals/tabs).
5. If the destination is a parametric deep-link, add a `<meta name="vyve-supported-hashes">` style note in the brain so future Claudes don't break the parser by changing the URL fragment grammar.
6. Add the new notification type + route to the §23 known-types list below.

**Currently routed notification types:**

| `type` prefix | Route |
|---|---|
| `habit_reminder` | `/habits.html` |
| `checkin_complete` | `/wellbeing-checkin.html` |
| `streak_milestone_*` | `/engagement.html#streak` |
| `achievement_earned_<slug>_<tier>` | `/engagement.html#achievements&slug=<slug>&tier=<tier>` |

**Existing rows backfilled** 29 April 2026 PM via SQL — `regexp_replace` extraction of slug + tier from `achievement_earned_*` types worked cleanly (15 rows). Test row `smoke_test_send_push_v1` left NULL by design.

**Common pitfall:** if you change the URL fragment grammar (e.g. switch from `&slug=` to `?slug=` after the hash), you must update both the route generators (in `_shared/achievements.ts` if added later, `log-activity` v27, `achievement-earned-push` v2) AND the `parseHashRoute()` parser in `engagement.html` AND any backfilled rows. The current grammar is `#<id>&k1=v1&k2=v2` — id first, then `&`-separated params, NOT a `?`-prefixed query string.


---
| **Offline-tolerant where we can, online-honest where we can't** | The doctrine for offline behaviour across the app. Read paths cache aggressively under `vyve_cache:<key>` (paint cache → background refresh → swap on diff). Write paths queue via `VYVEData.writeQueued` and stamp a client-generated `client_id` so re-flushes are safe. Live data (live sessions, push, real-time chat) genuinely needs network and we say so. New tables that take member-authored writes get a nullable `client_id uuid` column + partial unique index `(member_email, client_id) WHERE client_id IS NOT NULL`. New pages that read member-state get a cacheKey via `VYVEData.fetchCached`. Loaded by `vyve-offline.js`. |
| **`Prefer: resolution=ignore-duplicates,return=minimal` on every queued PostgREST insert** | The outbox MUST set this header on every POST that has a `client_id` partial unique index. Without it, a re-flush after a successful-but-network-dropped insert will 409 and the outbox will dead-letter a row that actually persisted. With it, PostgREST collapses duplicate (member_email, client_id) inserts into success and the outbox drains cleanly. The header is set in `vyve-offline.js` callers (workouts-session.js patched 04 May PM-7), not inside the data layer itself, so callers retain full control over headers (apikey, anon, JWT). |

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
| Brand icon source | `online.vyvehealth.co.uk/icon-512.png` (App Store/Capacitor canonical) |
| Podcast page | `www.vyvehealth.co.uk/vyve-podcast.html` |
| Admin console | `admin.vyvehealth.co.uk/admin-console.html` |
| iOS App Store | VYVE Health app — version 1.2 approved 28 April 2026, Ready for Distribution. App ID `co.uk.vyvehealth.app`. |
| Android Play Store | 1.0.2 awaiting Google Play review since 15 April resubmission (icon-fix). Keystore on Windows PC. |
| SW cache | `vyve-cache-v2026-04-29h-fullsync-btn` |
| Make social publisher | Scenario 4950386 — BROKEN since 23 March |
| Make analytics collectors | Scenarios 4993944 (IG), 4993948 (FB), 4993949 (LinkedIn) → Data Store 107716 |
| Facebook connection expiry | **22 MAY 2026 — Lewis to renew urgently** |
| GitHub PAT | `GITHUB_PAT_BRAIN` — scoped to `VYVEHealth/VYVEBrain` Contents R/W. Expires **18 April 2027** (calendar rotation required) |
| APNs auth key | KEY_ID `2MWXR57BU4` — **rotation pending** (.p8 PEM was exposed in chat 27 April PM) |
| Legacy service-role JWT | Stored as Supabase secret `LEGACY_SERVICE_ROLE_JWT` (dual-auth pattern for `send-push` + `achievement-earned-push`) |

### Repos

- `VYVEHealth/vyve-site` — portal web shell (GitHub Pages at `online.vyvehealth.co.uk`; bundled into both Capacitor binaries via `npx cap copy`).
- `VYVEHealth/Test-Site-Finalv3` — marketing/onboarding site (`www.vyvehealth.co.uk`).
- `VYVEHealth/VYVEBrain` — AI source-of-truth document store (this repo).
- `vyve-command-centre` — Lewis's internal ops dashboard + admin console.
- `~/Projects/vyve-capacitor` — iOS native Capacitor wrapper. **Not a git repo (backlog risk).**

### Composio / GitHub patterns (codified)

- Large files (>~50K chars): always commit via `run_composio_tool("GITHUB_COMMIT_MULTIPLE_FILES", args)` inside the Composio workbench, never direct MCP.
- `GITHUB_GET_RAW_REPOSITORY_CONTENT` → S3 URL needing secondary fetch; expires quickly, save to `/tmp/` immediately. Decode bytes with `r.content.decode("utf-8")`, not `r.text`.
- `GITHUB_GET_REPOSITORY_CONTENT` → nested `data.content.content` base64; strip whitespace + pad + decode.
- Multi-file atomic commits: `upserts` array (not `files`); field is `message` not `commit_message`. `deletes` is a flat array of path strings, not objects.
- Always verify large commits by re-fetching and checking the first 100 characters.

---

*End of VYVE Health brain master. Single source of truth. Full rewrite 28 April 2026 PM — supersedes all prior versions including the 24 April rewrite. Next rewrite when drift warrants, not by incremental patching.*
