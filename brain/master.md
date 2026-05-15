# VYVE Health — Brain Master

> Single source of truth for the whole business. Full rewrite 28 April 2026 PM (not a patch). Captures live state through iOS 1.2 approval + autotick sessions 1–3a + push notifications sessions 1 + 2 item 1 + sw.js handler patch inclusive. Patched 8 May PM-3/PM-4/PM-5 (§23 cache-paint-before-auth hard rule + 10 pages migrated + workouts gap-fills + index.html prefetch fan-out) without full rewrite. Supersedes the 24 April rewrite. If this drifts from live reality, rewrite it fully again — do not paper over.

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
| Native app delivery | `~/Projects/vyve-capacitor` (under git as `VYVEHealth/vyve-capacitor`, fine-scoped PAT) is the Capacitor project that bundles the `vyve-site` web shell into both store binaries. **iOS:** App Store as **VYVE Health 1.2** (approved 28 April 2026), with `@capgo/capacitor-health@8.4.7` + native APNs registration via `AppDelegate.swift` bridge methods. **Android:** Play Store live (both stores shipping the same web shell — single codebase, two binaries). The browser at `online.vyvehealth.co.uk` is an account-management fallback only — 100% of new members install via App Store / Play Store. |
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

## 6. Supabase architecture — 85 tables

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
| `weekly_goals` | Recurring weekly goals (4-row template, reset Mondays via `seed-weekly-goals` cron). Columns: `habits_target` / `exercise_target` (combined workouts+cardio) / `sessions_target` / `checkin_target` are the live targets; `workouts_target` / `cardio_target` / `movement_target` are legacy and zeroed by the seeder. UNIQUE `(member_email, week_start)`. |
| `activity_dedupe` | Over-cap activity rows — routed by triggers, not discarded. |
| `ai_interactions` | All Anthropic API calls (prompt, response, tokens, model). `triggered_by` CHECK accepts `weekly_checkin`/`onboarding`/`running_plan`/`milestone`/`manual`/`re_engagement` (last added 07 May 2026 commit 1B). Audit coverage as of 1B: onboarding, weekly check-ins (wellbeing-checkin v28), running plan generation (anthropic-proxy v16), re-engagement scheduler (v10). `milestone`/`manual` reserved for future surfaces. |
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
| `running_plan_cache` | AI running plan cache (5,376 cacheable combinations). Shared parametric cache keyed on `cache_key` — NOT member-scoped. RLS authenticated-only on read/insert/update since 07 May 2026 (commit 1); anonymous access blocked. Service-role exempt. |
| `exercise_canonical_names` | Alias-to-canonical mapping for exercise-library names (08 May 2026 PM-2). Seeded with 6 alias rules at ship; expandable as library evolves. Drives the canonicalisation triggers across 7 write surfaces (`exercise_logs`, `exercise_notes`, `exercise_swaps` × 2 cols, `custom_workouts`, `shared_workouts` × 2 cols, `workout_plan_cache`, `workout_plans`). Auth-readable. |
| `exercise_name_misses` | Audit surface for unmapped exercise names observed at write time (08 May 2026 PM-2). Logs `member_email`, `observed_name`, `observed_at`. Never blocks the underlying write (BEGIN/EXCEPTION/NULL pattern). Drives library-expansion decisions. Service-role only. |

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
| `member_home_state` | One row per member. Dashboard aggregate, **65 columns** (last extended 08 May 2026 PM-16 with 5 `last_*_at` columns; 5 `*_this_week` columns landed 06 May PM-2). Writer is the `refresh_member_home_state(p_email)` plpgsql function, fired SYNCHRONOUSLY by `zzz_refresh_home_state` AFTER INSERT OR DELETE OR UPDATE triggers (each calling the `tg_refresh_member_home_state()` trigger function) on **8 source tables** (`cardio`, `daily_habits`, `replay_views`, `session_views`, `weekly_goals`, `weekly_scores`, `wellbeing_checkins`, `workouts`) — same-write-fresh, no staleness, NOT cron-driven. The `zzz_` prefix forces last-fire ordering relative to other triggers on the same table. HealthKit tables (`member_health_connections`, `member_health_daily`, `member_health_samples`) do NOT carry the trigger — autotick writes through to `daily_habits` / `workouts` / `cardio` and inherits the refresh from those. (Sibling table `member_stats` is the cron target; do not conflate.) Carries today/total/this_month/this_week/recent_30d aggregates, all streaks (overall + per-type incl. checkin), goal targets+done for current week, engagement components, last_activity_at. The 5 `*_this_week` integer columns (habits/workouts/cardio/sessions/checkins) added 06 May 2026 PM-2 are populated and live but **still not yet read by `member-dashboard` v59** (confirmed in 08 May PM-10 audit) — closing this is the P1-1 backlog item. Read by `member-dashboard` v55+. |
| `member_activity_daily` | Per-member per-day aggregate. Refreshed every 30 min via `vyve_rebuild_mad_incremental` cron. |
| `member_activity_log` | Chronological activity log. |
| `member_stats` | Per-member rolling stats. Recomputed every 15 min via `vyve_recompute_member_stats` cron. |
| `company_summary` | Enterprise aggregate rollup. Recomputed daily 02:00 UTC via `vyve_recompute_company_summary` cron. |
| `platform_metrics_daily` | Platform-wide metrics per day. Recomputed daily 02:15 UTC via `vyve_platform_metrics` cron. |
| `platform_alerts` | Central monitoring — errors, failures, proactive alerts. Service-role only. |
| `platform_counters` | Single-row-per-counter aggregate table for incrementally maintained platform-wide totals. Currently one row: `counter_key='charity_total'` (maintained by 6 `charity_count_*` AFTER INSERT/DELETE triggers across the 6 cap-aware activity tables). RLS service-role-only. Read via `get_charity_total()`. Reconciled daily 02:30 UTC via `vyve_charity_reconcile_daily` cron with self-heal on drift. |
| `watchdog_alerts` | Email-watchdog suppression table. Per-code 6h dedupe so a continuing failure doesn't spam alerts. Service-role only. |
| `perf_telemetry` | Client-side paint/interaction telemetry sink (08 May 2026 PM-21). Bigserial PK; columns `member_email`, `page`, `metric_name`, `metric_value` (double), `nav_type`, `ua_brief`, `ts`. Indexed `(page, metric_name, ts DESC)` for percentile rollups + `(ts DESC)` for housekeeping. RLS service-role-only with `(SELECT auth.role())` wrap per §23 PM-8. Written by `log-perf` v1, JWT-validated server-side (member email never trusted from body). One-way pipe — no member-readable path. |

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

### GDPR (Article 15 export + Article 17 erasure pipelines, 07 May 2026)

| Table | Purpose |
|---|---|
| `gdpr_export_requests` | Member-initiated Article 15 data-export queue (security commit 3). Walked by `gdpr-export-execute` cron via `gdpr_export_pick_due()` with `FOR UPDATE SKIP LOCKED`. 1-per-30-days rate limit member-self, unlimited admin-path. RLS service-role-only; reads via the EF surfaces only. |
| `gdpr_erasure_requests` | Member-initiated Article 17 right-to-be-forgotten queue (security commit 4). 7-day cancellation window via `due_at`. Walked by `gdpr-erase-execute` cron via `gdpr_erasure_pick_due()`. Cancel surface on standalone `gdpr-erasure-cancel.html` (token-link, no auth). RLS service-role-only. |

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

96 Edge Functions as of 08 May 2026. ~64 actively operational (table below — includes the 6 GDPR EFs shipped 07 May commits 3+4 and `log-perf` v1 from 08 May PM-21); the remainder are one-shot patchers/seeders/debug helpers retained for reference (see Retired subsection). Security audit (9 April) identified ~89 for deletion — partial cleanup complete; ~32 candidates remain (see backlog).

> **Versioning note (revised 04 May 2026 PM-2).** This table previously carried a "Sem. ver" column that mixed two systems — sometimes mirroring the source-header `vN` (semantic) and sometimes the Supabase platform deploy counter (auto-incremented on every deploy/no-op). Audit found the column unreliable on roughly a third of EFs (specific stale examples removed 08 May PM-23 — the principle stands without numbers that themselves drift). **Source-level semantic versions live in the EF source-file header comment** (`// <ef-name> v<N> — <one-liner>`). To check the deployed version, read the source. The §7 table now carries only a Status indicator. The Supabase platform deploy counter is a deploy/redeploy artefact and not surfaced here.

### Core operational (actively serving requests)

| Function | Status | Purpose |
|---|---|---|
| `onboarding` | LIVE | New member onboarding. Two-phase (fast persona/habits/recs + `EdgeRuntime.waitUntil()` for 8-week workout JSON). Stream-aware since 19 April (`if stream==='workouts'`). |
| `member-dashboard` | LIVE | Full dashboard data in one call. Server-authoritative hydration on every page load. Includes `health_connections` + `health_feature_allowed` + `habits` block (each habit returns `health_auto_satisfied` + `health_progress` evaluated server-side via the autotick evaluator) + `achievements` block (`unseen[], inflight[], recent[], earned_count, hk_connected`). Imports `_shared/taxonomy.ts` and `_shared/achievements.ts`. v60 (08 May 2026 PM-13) parallelised both achievements `INLINE` evaluator passes via `Promise.all` (was 23 serial PostgREST round trips) and pre-fetched the 6 streak fields from `member_home_state` in a single shot. v61 (08 May 2026 PM-17) dropped 4 of 5 this-week PostgREST queries (workouts/cardio/sessions/checkins now read from `state.workouts_this_week` / `cardio_this_week` / `sessions_this_week` / `checkins_this_week` populated by `refresh_member_home_state`); habitsThisWeek query stays because goal-progress needs `COUNT(DISTINCT activity_date)` and `member_home_state.habits_this_week` is `COUNT(*)`. Three INLINE evaluators (`workouts_logged` / `cardio_logged` / `checkins_completed`) also routed through the cached `homeStateRow` — saves 3 more round trips per achievements pass. Platform v67, ezbr `72ce2bbe…`. |
| `employer-dashboard` | LIVE | Aggregate employer analytics. API-key auth (no PII). |
| `wellbeing-checkin` | LIVE | Weekly check-in flow. AI recs pulled from activity + persona. v28 (07 May 2026, security commit 1B): CORS default-origin, 100KB payload cap, `ai_interactions` audit row written per AI response (`triggered_by='weekly_checkin'`). |
| `monthly-checkin` | LIVE | Monthly 8-pillar check-in. Writes `monthly_checkins`. |
| `log-activity` | LIVE | PWA activity logging — ALSO serves as `evaluate_only` endpoint for trigger pages that write direct to PostgREST. v28 (07 May 2026, security commit 1B): CORS default-origin, 100KB payload cap. v22 added inline achievement evaluation (`evaluateInline()`); v23 (28 April PM) added push fan-out via `achievement-earned-push` v1; **v24 (29 April AM)** added `evaluate_only:true` short-circuit that skips write/cap/dedup logic and runs evaluator + fan-out only — closes the inline-evaluator-never-fires-from-real-writes gap. All trigger pages now call this post-write via `VYVEAchievements.evaluate()`. Both notification paths fire under `EdgeRuntime.waitUntil()`. Imports `_shared/achievements.ts`. |
| `log-perf` | LIVE | Anonymous-friendly client telemetry sink. Captures per-page paint/interaction metrics from `perf.js` (TTFB, DOM done, load, FP, FCP, LCP, INP, plus VYVE-custom `auth_rdy` and `paint_done`). 100KB payload cap, 50 metrics per request max. `verify_jwt:false` at platform with internal `getAuthEmail()` JWT validation per §23 custom-auth pattern; member email derived from JWT, never trusted from body. CORS default-origin pattern. Returns 204 on success. Writes to `perf_telemetry` (bigserial PK, RLS service-role-only). v1 (08 May 2026 PM-21), platform v1, ezbr `9df3ce50315f7c7ad6592ab4f8c350a0c749667bb7d758c7d46700992be9afcb`, ~155 lines source. Unauth'd curl → HTTP 401 confirmed live. |
| `anthropic-proxy` | LIVE | Server-side Anthropic proxy for running plans + misc AI calls. `verify_jwt:false` at platform with internal `supabase.auth.getUser()` validation (per §23 custom-auth pattern). v16 (07 May 2026, security commit 1B): 100KB payload cap, `ai_interactions` audit row per AI response (`triggered_by='running_plan'`, member email from JWT, persona null since proxy doesn't know it). |
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
| `leaderboard` | LIVE | Leaderboard with scope tabs, range filter, privacy-aware name resolver, tie-aware gap copy. **v17 (08 May 2026 PM-22)** is a thin wrapper around the `get_leaderboard(p_email, p_scope, p_range)` RPC — sort + top-100 slice + caller-row lookup all run in Postgres window functions over `member_home_state`. Response shape unchanged from v11/v16; portal pages did not need to change. Platform v17, ezbr `ee55c3fe…`, ~110 lines source. The v11/v16 path pulled all rows from `member_home_state` + `members` + `employer_members` and sorted in JS — at 100K members that was a ~50MB+ wire payload and a ~100K-element JS sort per request; v17 returns ~6KB regardless of scale. Already in `warm-ping` keep-warm list. |
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
| `re-engagement-scheduler` | LIVE | Two streams: A (no consent + no activity) and B (onboarded but dormant). Cron 8:00 UTC daily. v11 (08 May 2026 PM-16): replaced 4 parallel `.in()` queries against `daily_habits` / `workouts` / `session_views` / `wellbeing_checkins` with a single `.in()` against `member_home_state` for the new `last_habit_at` / `last_workout_at` / `last_cardio_at` / `last_session_at` / `last_checkin_at` cols (added by migrations `pm16_add_last_at_columns_to_member_home_state` and `pm16_extend_refresh_member_home_state_with_last_at`). At 100K members the old shape pulled millions of rows from activity tables; new shape pulls one row per active member. Dry-run verified end-to-end 08 May PM-17 — HTTP 200, version: 11, processed 15 / 0 errors. v10 (07 May 2026, security commit 1B): `aiLine()` writes `ai_interactions` audit row per AI generation (`triggered_by='re_engagement'`, streamKey in `decision_log.stream_key`). C1/C2/C3 retired 4 May (legacy two-surface split — Kahunas app + portal). |
| `seed-weekly-goals` | LIVE | Mon 00:01 UTC cron seeder for the recurring weekly goals strip. Iterates `members` where `onboarding_complete=true AND subscription_status<>'cancelled'` and upserts a 4-target row per member for the current ISO Monday: `habits_target=3, exercise_target=3, sessions_target=2, checkin_target=1`, legacy targets zeroed. ON CONFLICT `(member_email, week_start)` DO NOTHING — idempotent. Dual-auth (service-role OR `LEGACY_SERVICE_ROLE_JWT` OR `SEED_WEEKLY_GOALS_SECRET` shared-secret header). `verify_jwt:false` at gateway with manual guard. Source v1. |
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
| `gdpr-export-request` | LIVE | Member-facing GDPR Article 15 export queue (07 May 2026, security commit 3). Decodes JWT for email, validates against rate limit (1/30d member-self, unlimited admin path), upserts a `gdpr_export_requests` row, returns 202 with request_id. 409 on already-pending request. `verify_jwt:false` at gateway with internal JWT validation per §23 custom-auth pattern. v1, platform v3. |
| `gdpr-export-execute` | LIVE | Cron-driven GDPR export executor. Pulled by `vyve-gdpr-export-tick` (`*/15 * * * *`, 90s timeout). Walks `gdpr_export_pick_due()` (FOR UPDATE SKIP LOCKED, attempt cap 3), assembles JSON across 45 tables, sanitises `auth.users` to 8-key whitelist, uploads to `gdpr-exports` Storage bucket, generates 7-day signed URL, sends Brevo email with VYVE-branded HTML, writes `admin_audit_log` receipt. 3-attempt retry. PSK-bearer auth. `verify_jwt:false`. v1, platform v3. End-to-end test passed: 4MB JSON / 27s latency / real email / signed URL working. |
| `gdpr-erase-request` | LIVE | Member-facing GDPR Article 17 erasure queue (07 May 2026, security commit 4). Member confirms via typed-email gate in `settings.html`; EF inserts a `gdpr_erasure_requests` row with `due_at = now() + 7 days` (cancellation window). `verify_jwt:false` with internal JWT validation. v1, platform v3. |
| `gdpr-erase-cancel` | LIVE | Cancellation surface for in-flight erasure requests. Token-link from email lands on standalone `gdpr-erasure-cancel.html`; EF marks the request `cancelled_at = now()`. Plain-HTML token-link page (no auth required, token gates write). v1, platform v4. |
| `gdpr-erase-status` | LIVE | Member-callable status check for an erasure request. Returns request state (queued / cancelled / executing / completed). `verify_jwt:true`. v1, platform v2. |
| `gdpr-erase-execute` | LIVE | Cron-driven GDPR erasure executor. Pulled by `vyve-gdpr-erase-daily` (`0 3 * * *`, 120s timeout). Processes rows where `due_at <= now() AND cancelled_at IS NULL` via `gdpr_erasure_pick_due()`. Per-subject `gdpr_erase_purge_subject(p_email)` SECURITY DEFINER PL/pgSQL deletes in dependency order with explicit `ALTER TABLE ... DISABLE/ENABLE TRIGGER` pairs in try/finally (the `SET session_replication_role = replica` path is unavailable from service-role connections). Stripe Customer DELETE, Brevo + PostHog third-party purge rolled into the same execute path. `verify_jwt:false`, PSK-bearer guard. v1, platform v4. |

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

### Cron jobs (20 active)

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
| `vyve-seed-weekly-goals` | `1 0 * * 1` | seed-weekly-goals (Mon 00:01 UTC, refreshes home dashboard goal strip for active members) |
| `vyve_recompute_company_summary` | `0 2 * * *` | recompute_company_summary() |
| `vyve_platform_metrics` | `15 2 * * *` | recompute_platform_metrics() |
| `vyve_recompute_member_stats` | `*/15 * * * *` | recompute_all_member_stats() |
| `vyve_rebuild_mad_incremental` | `*/30 * * * *` | rebuild_member_activity_daily_incremental() |
| `warm-ping-every-5min` | `*/5 * * * *` | warm-ping (10 EFs warmed) |
| `process-scheduled-pushes` | `*/5 * * * *` | process-scheduled-pushes (consumes due rows from `scheduled_pushes`, fans out via `send-push`) |
| `vyve-gdpr-export-tick` | `*/15 * * * *` | gdpr-export-execute (PSK-bearer, walks queue rows in `gdpr_export_requests` with `FOR UPDATE SKIP LOCKED`, 90s timeout) |
| `vyve-gdpr-erase-daily` | `0 3 * * *` | gdpr-erase-execute (PSK-bearer, processes due erase requests at 03:00 UTC, 120s timeout) |
| `vyve_schema_snapshot` | `0 3 * * 0` | schema-snapshot-refresh (Sundays) |
| `vyve_charity_reconcile_daily` | `30 2 * * *` | charity_total_reconcile_and_heal — recomputes legacy 6-table UNION, compares to cached counter, heals + writes platform_alerts on drift. Jobid 23. |

Cron dedupe — 08 May 2026: jobid 19 `process-scheduled-pushes-every-5min` was a dead duplicate of jobid 18 `process-scheduled-pushes` (same `*/5 * * * *` schedule, same target EF, but jobid 19 was missing the service-role `Authorization` header). Unscheduled via `cron.unschedule(19)`. Jobid 18 is canonical.

---

## 8. Portal pages & web shell

All portal pages live at `online.vyvehealth.co.uk` and are bundled inside the iOS + Android Capacitor binaries via `npx cap copy` from `~/Projects/vyve-capacitor`. The web URL itself is the browser-accessible account-management fallback — the *member experience* (the app) is delivered exclusively through the App Store and Play Store binaries. Every page is gated behind Supabase Auth (`auth.js` v2.3).

### Core pages

| Page | Purpose |
|---|---|
| `index.html` | Member dashboard. Cache-first (skeleton on first load, instant on return). Reads `member-dashboard` v57. Daily check-in pill strip, activity score ring, recurring 4-row weekly goals strip (refreshed every Monday by `seed-weekly-goals` cron), live session slot, charity banner. "Coming Up This Week" block removed 06 May PM (was hardcoded placeholder, never dynamic). Orphan `.upcoming-*` CSS still in stylesheet pending hygiene pass. |
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
| Service worker | `sw.js` — network-first for HTML + skipWaiting + clients.claim. HTML changes reach users on next reload without cache bumps. Non-HTML assets still use cache versioning. **Push event listener + notificationclick handler shipped 28 April** (`vyve-site@124ecb53`). Current cache: `vyve-cache-v2026-05-08-paint-engagement-habits-9`. |
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
| Weekly check-in recommendations (persona-voiced AI recs) | LIVE (`wellbeing-checkin` source v28 / platform v43; bumped 07 May commit 1B with payload cap + audit-row write) |
| Workout plan generator (8-week custom programme at onboarding via waitUntil) | LIVE (`generate-workout-plan` v11) |
| **Habits × HealthKit autotick** | **LIVE end-to-end (sessions 1 + 2 + 3 + 3a, 24–25 April 2026).** Schema + Lewis-approved seeds on `habit_library.health_rule`, server evaluator in `member-dashboard` v55 with `_shared/taxonomy.ts`, client UI in `habits.html` wired with pre-tick on auto-satisfied rows, `.hk-progress` hints on unsatisfied rows, done-state copy swap as the sole attribution mechanism — no visual badge. `notes='autotick'` on auto-written `daily_habits` rows persists the copy variant across reloads. **Cohort-wide post 1.2 approval** — `HEALTH_FEATURE_ALLOWLIST` was dropped 26 April; truthsource is `member_health_connections` row presence. |
| **Achievements System Phase 1** | **LIVE end-to-end (27 April 2026).** Catalog (32 metrics × 327 tier rows, all `copy_status='approved'`) + inline evaluator + sweep cron + dashboard payload + mark-seen EF + 185-tier backfill marked seen. See §11A for full architecture. |
| **Achievement push fan-out** | **LIVE end-to-end (28 April 2026 PM, Session 2 item 1).** `achievement-earned-push` v1 + `log-activity` v23 (inline path) + `achievements-sweep` v2 (sweep path). One push per earned tier, dedupe-off, in-app suppressed (caller writes `member_notifications` separately). Smoke-tested live on Dean (synthetic earn → APNs HTTP 200) and on Vicki (real `member_days` tier 2 crossed during sweep invoke → push delivered). |
| Recurring weekly goals (fixed 4-row template, reset Mondays via `seed-weekly-goals` cron) | LIVE — backend prior session, front-end shipped 06 May PM. 3 habits / 3 exercise (workouts+cardio combined) / 2 live sessions / 1 weekly check-in. Computes against `member-dashboard` v57's `goals.{targets,progress}` payload. |
| AI weekly goals (phase 1 targets set at onboarding — superseded by fixed template above) | RETIRED |
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
| RLS | All public tables have RLS enabled (9 April audit + verified through achievements ship 27 April). Anon-access wildcard policies on `running_plan_cache` closed 07 May 2026; remaining 5 INSERT-on-`public`-role policies are semantically authenticated-only via `WITH CHECK (auth.email() = …)` and pose no real hole — re-roling to `authenticated` is a tidiness item (see `security_questionnaire.md`). |
| Security questionnaire | `brain/security_questionnaire.md` — pre-canned answers for procurement reviewers covering the `verify_jwt:false`+custom-auth pattern, the anon key in HTML, the localStorage `VYVE_RETURN_TO_KEY`, and the cosmetic `public`-role policy labels. |
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

## 19. Current status — 15 May 2026 PM-116 (PF-14b Android half SHIPPED; Android 1.0.3 (versionCode 10) submitted to Google Play; both stores now awaiting platform review)

**Headline:** the PF-14b architectural fix is now mechanically complete on both platforms. iOS 1.3 (2) submitted to App Review last night (PM-115), Android 1.0.3 (versionCode 10) submitted to Google Play Production track tonight. Same `capacitor.config.json` from PM-115, same `www/` packaged from vyve-site `83874dd5`, same Capawesome production channel `89e12796-aa41-4176-8d78-bc2ef6dfd5c2`. Both apps now bundled-mode with OTA updates available, both awaiting platform review. Once approved and released, the Apple ITP 7-day storage-purge problem and the equivalent Android WebView storage policies stop applying — local-first becomes architecturally guaranteed on production devices.

**What shipped this session (PM-116):**

- Android keystore recovered from Google Drive — `vyve-release-key.jks` (PKCS12, alias `vyve-key`, password `Weareinthis2026!`, valid until 2051, SHA1 `CC:48:EA:AF:C1:47:ED:43:20:63:4F:FF:07:99:79:20:55:7D:23:B9`). Path: `~/Projects/vyve-capacitor/android/app/keystore/vyve-release-key.jks`. **NOT YET in 1Password.**
- Android build pipeline established on Dean's Mac from scratch — `local.properties` rewritten from Windows path (`C:\\Users\\DeanO\\AppData\\Local\\Android\\Sdk`) to `/Users/deanbrown/Library/Android/sdk`. JBR (Android Studio bundled JDK 21) used as `JAVA_HOME`.
- `android/app/build.gradle` patched with keystore loader + `signingConfigs.release` block + version bumps. Backup at `.bak-pf14b-android`.
- `android/variables.gradle` minSdkVersion bumped 24 → 26 (required by Capgo Health Android manifest, drops ~1,460 long-tail devices). Backup at `.bak-pf14b`.
- `android/keystore.properties` written with `storeFile=keystore/vyve-release-key.jks` (NOT `app/keystore/...` — see §23.21).
- Health Connect declaration completed in Play Console covering 25+ permissions. Permanent on Play Console once approved.
- versionCode 10 assigned (after 2 and 3 were rejected — see §23.20).
- Release notes mirror iOS 1.3 "What's New" copy.

**State of the two platforms now:**

- **iOS:** 1.3 (2) in App Review since PM-115. Auto-release on approval. 1.2 train closed (rejected mid-review pre-PM-115). 1.1 (3) status unclear — may have approved-and-released between PM-113 and now.
- **Android:** 1.0.3 (versionCode 10) in Google Play review since PM-116. Auto-publish on approval, Production track. Prior: 1.0.2 (versionCode 2) live since 21 April 2026 (brain previously said "awaiting review" — 3-4 week silent drift, corrected this session per §23.24).

**Five §23 rules earned PM-116 (full text in §23):**

- §23.20 — when re-establishing Android shipping for an existing app, jump versionCode to a clearly-higher integer (10+) rather than next-from-source-of-truth.
- §23.21 — `keystore.properties storeFile` path is relative to `android/app/`, not `android/`.
- §23.22 — PKCS12 keystores enforce store password === key password; don't loop them separately.
- §23.23 — any Android bundle containing a plugin that declares health permissions in its manifest triggers Play Console Health Declaration even if the plugin is dormant at runtime.
- §23.24 — verify live Play/App Store state before re-shipping an app that hasn't been touched in weeks (brain drift gate).

**Launch-window posture (15 May 2026, 16 days from 31 May target):**

- Both apps in platform review. Apple typically 24-48hr, Google typically hours-to-a-day.
- Capawesome 14-day trial expires 28 May 2026 (cancel/keep decision **27 May 2026**, four days before launch). Default: keep, £15/mo USD Starter tier.
- HAVEN Phil sign-off still pending — not blocking the bundled-mode ship, blocks broader promotion only.
- vyve-capacitor still not a git repo on Dean's Mac. Hit three times in 72hr now. P0 same-week priority.
- 1Password backup of Android keystore + password is P0 — must land before any Mac risk window.

**What did NOT ship this session:**

- vyve-capacitor `git init` + remote push (P0 same-week, escalated).
- 1Password keystore backup (P0).
- Capawesome `publicKey` hardening (post-launch).
- Native Health Connect integration on Android (PF-29, post-launch).

---



**Headline:** the Apple ITP 7-day storage-purge problem that gated PF-14b is mechanically solved on iOS. New bundled-mode `capacitor.config.json` removed `server.url`, packaged vyve-site `83874dd5` into the IPA, integrated Capawesome live-updates SDK for OTA updates without going through Apple review each time. iOS 1.3 (2) is in App Review, auto-release on approval. ~24-48hr Apple review window. Android is the next session's work — same campaign, same architectural fix, separate native pipeline.

**Why this matters for the Premium Feel Campaign:** the local-first commitment in `brain/active.md` §3 promised members instant page renders from on-device Dexie. That promise was always going to fail on iOS as soon as a member went 7 days without opening the app — ITP would wipe their IndexedDB and they'd hit a 5-30s re-hydrate screen on next open. Bundled-mode + first-party origin (`capacitor://localhost`) means VYVE is no longer subject to ITP's third-party storage purge. The local-first architecture now actually delivers on the architectural commitment.

**Capawesome economics:** 14-day Starter trial started 14 May 2026. Cancel/keep decision **27 May 2026** — four days before the 31 May launch. £15/mo USD Starter (not £8 as the brain previously held — correction made in PM-115). At our scale Starter is sufficient. Trial gives time to validate one OTA update before paying.

**Tonight's pipeline lessons:** five new §23 hard rules earned (§23.15 through §23.19). The version-bumping saga consumed most of the session — Xcode GUI silently rewriting pbxproj on view focus combined with Capacitor's Info.plist shipping literal version strings (not `$(MARKETING_VERSION)` placeholders) defeated every standard approach. Pipeline that finally worked: quit Xcode entirely → sed pbxproj → PlistBuddy to replace Info.plist literals with placeholders → `xcodebuild -archive` CLI → `xcodebuild -exportArchive` with `method=app-store-connect signingStyle=automatic` → Xcode Organizer Distribute App for upload.

**State after this session:**

- vyve-capacitor `~/Projects/vyve-capacitor` — bundled mode `capacitor.config.json` in place (backup at `.bak-pf14b`). `www/` populated with vyve-site `83874dd5` (96 files, 3.8MB). `@capawesome/capacitor-live-update@8.2.2` installed. `App/Info.plist` uses placeholder version strings. `App.xcodeproj/project.pbxproj` at `MARKETING_VERSION = 1.3` + `CURRENT_PROJECT_VERSION = 2`. Android side untouched.
- vyve-capacitor still **not** a remote-tracked git repo on Dean's Mac. Hit twice this 48hr window. Now a launch blocker, not just hygiene.
- Capawesome account: org "VYVE Health", app `f9961f66-eb66-4102-b1c5-f9b2c7baeebf`, production channel `89e12796-aa41-4176-8d78-bc2ef6dfd5c2`. Both iOS and Android will share these.
- iOS App Store Connect: 1.3 (2) Waiting for Review. 1.2 (1) train closed. Older trains (1.0, 1.1) approved-and-released or stale.
- Android Play Store: 1.0.2 still on Play review at last brain-check; status not re-verified tonight. Android 1.0.3 work is next session.

**Sequencing into next session (Android 1.0.3):**

1. `npx cap sync android` — confirm live-update plugin detected on Android side.
2. Inspect `android/app/build.gradle` for current `versionCode` and `versionName`. Bump appropriately — Play Store rule is `versionCode` strictly greater than every previously uploaded build.
3. Apply Android equivalent of the iOS Info.plist placeholder fix if `build.gradle` ships with hardcoded values (highly likely — same Capacitor template assumption).
4. `./gradlew bundleRelease` from `android/` → produces signed-or-unsigned `.aab`.
5. Locate keystore (currently undocumented — backlog item to find + document during this work).
6. Sign AAB manually for tonight; portable CI signing stays on backlog.
7. Upload to Google Play Console (Internal Testing or Production, whichever track 1.0.2 used).
8. Mirror iOS 1.3 "What's New" release notes.
9. Submit for review. Google review is usually hours, not days.

**Open items NOT addressed tonight, all on backlog:**

- Capawesome 27 May cancel/keep decision
- vyve-capacitor git init + remote push (chronic, twice-hit)
- Android 1.0.3 build + submit (next session)
- Post-1.3-approval device verification that bundled mode actually loads from local `www/`, not remote `online.vyvehealth.co.uk`
- Post-1.3-approval Apple Health (Capgo plugin) verification under bundled mode
- Capawesome `publicKey` for OTA bundle code-signing (hardening, post-launch)
- Android keystore documentation + portable CI signing pipeline

**iOS 1.1 (Build 3) status:** the brain showed it as "Ready for Review, auto-release on approval" from 27 April. The fact that 1.2 (1) was uploaded and rejected between then and now means 1.1 likely approved-and-released at some point. Status will resolve when 1.3 (2) lands — will be visible in App Store Connect Distribution history.

**Soft launch still targets 31 May 2026.** iOS pipeline now de-risked. Android remains. Once both stores have approved-and-released 1.3 / 1.0.3, every other PF-14 sub-item (PF-14c / PF-14d / PF-14e offline UX) can ship as OTA updates via Capawesome — no more 24-48hr review cycles for each one.

## 19. Current status — 13 May 2026 PM-97 (PF-15 P0 partial-upsert landmine sealed; backend EF latency confirmed as the actual felt-perf bottleneck)

Continuation of PM-96 the same evening. Dean pushed back on "session closed" framing — "data still pulls slow" was the lived experience and the campaign wasn't finished. Right call. Three distinct issues surfaced this session, two of them root-caused, one of them shipped, one of them captured for the next session.

**Issue 1 — Habits page rendering "undefined".** Indicator dot was GREEN (paint dexie, last read dexie / nutrition_common_foods) but every habit card showed `undefined` for title, description, difficulty badge, prompt. This is PM-95 finding #3 partial-upsert landmine, undercounted — applies to `members` table too, not just `member_habits`. Four partial-upsert call sites on settings.html (lines 67956, 72937, 78308, 80704) silently overwrite rich rows with bare 2-3 field shapes via default Dexie `.put()`. Fixed in `ddc13271` — db.js merge overrides on both stores + long-press-footer recovery gesture in settings.html + sw.js cache bump to `pm97-pf15-merge-upsert-a`. Codified as §23.7.5.

**Issue 2 — Habits write UI lag, 20+ seconds, button doesn't change.** Diagnosed but NOT shipped. SQL query against `daily_habits` showed 12+ writes landing on server today with 1-7s gaps — server side is healthy. Bottleneck is on the client: `habits.html` line 27719 `await VYVEData.writeQueued(...)` awaits the network round-trip BEFORE firing `VYVEHomeState.optimisticPatch(...)`. The "optimistic" UI isn't optimistic. Compounded by §23.5.1 — slow backend EFs mean the await waits for 10-30s in production.

**Issue 3 — Header dashes never resolve.** Day Streak + Total Logged on habits.html show ━ placeholder loaders that never populate. Page IS Dexie-wired but the dashboard refresh that populates these counters hits the same slow EFs as everything else. Confirms §23.5.1's "all client-facing EFs are slow" reading.

**Honest read of where we are:** tonight fixed real bugs (PM-96 exercise.html wiring, PM-97 partial-upsert landmine + recovery gesture). The Premium Feel campaign is NOT done. Three campaigns still ahead:

1. **PF-15.x sweep** — six unwired pages still on REST: movement, sessions, leaderboard, running-plan, certificates, engagement. ~3-4 hours.
2. **PF-14b bundled-mode Capacitor migration** — 7-day ITP Dexie purge still applies. Mac required. Launch blocker.
3. **§23.5.1 backend EF latency** — three-week-old finding logged 12 May, never worked on, dominant cause of every "data pulls slow" symptom tonight. The right next session is this one, not PF-15.x or PF-14b, because polishing the client while the backend is this slow is invisible work.

**State at end of PM-97:** vyve-site main HEAD `ddc13271`. SW cache key `vyve-cache-v2026-05-13-pm97-pf15-merge-upsert-a`. Tonight closes with one fewer landmine, one new diagnostic confirmation, and clarity on what the next campaign actually is.

## 19. Current status — 13 May 2026 PM-96 (PF-14 verification COMPLETE + PF-15 part 2 exercise.html Dexie wiring shipped)

Tonight's session was the diagnostic-led completion of PF-14 device verification and the first PF-15 page-wiring fix. PF-14 part 6 (commit `67711c4e`, late PM-95) added `await VYVESync.hydrate()` to four pages on a guess about why those pages were amber. Dean's walk after that ship showed the patch helped some pages but left Exercise hub still amber and (apparently) regressed Habits + Nutrition. The session was running on speculation.

PM-96 reset to diagnostic-first.

**Shipped tonight (2 vyve-site commits on main):**
- `4ffe3d72` — PM-96 diagnostic. 70-line IIFE appended to `dexie-source-indicator.js` listening to sync.js's per-table events + snapshotting `_sync_meta` + Dexie row counts on hydrate completion. Fires single `pf14_hydrate_diagnostic` PostHog event per page load with the full per-table picture. Stashes snapshot on `window.__pf14_lastDiag` and logs `[PF-15 diag]` summary to console. 8s fallback timer if hydrate event never fires. Spike-gated. sw.js cache key bump.
- `433d0650` — PM-96 PF-15 part 2. `exercise.html` `fetchPlan()` rewritten as hydrate-await → Dexie-first read from `workout_plan_cache.allFor(email)` → REST fallback. Spike-off path identical to pre-patch. localStorage cache layer (`vyve_exercise_cache_v2`) untouched. sw.js cache key bump.

**Diagnosis from Dean's iPhone walk (post-diagnostic ship):** Six of seven surfaces went GREEN — PF-14 part 6's hydrate-await pattern DID work. Settings, which was amber earlier tonight, was green after the part 6 ship. Habits + Nutrition were green, not regressed — the earlier "regression" was a transient SW activation-window artifact. Only Exercise hub stayed amber. Code audit of `exercise.html` confirmed zero `VYVELocalDB` references — never wired to Dexie. Finding #2 hypothesis (c) from PM-95 (partial page-side migration) was correct, just on a different page than guessed. Fixed in `433d0650`.

**Surfaces audited tonight (root-level .html + page-shipped .js modules):**

| Page | VYVELocalDB refs | await hydrate | Status |
|---|---:|---:|---|
| index.html | 12 | 0 (delegates to home-state-local.js + hydration.js) | GREEN |
| habits.html | 15 | 1 | GREEN |
| workouts.html | 0 | 0 | GREEN via workouts-programme.js (12 refs, 4 awaits) |
| cardio.html | 11 | 2 | green (PF-14 part 6 patch, not walked tonight) |
| nutrition.html | 3 | 1 | GREEN |
| log-food.html | 9 | 3 | GREEN |
| wellbeing-checkin.html | 12 | 2 | green (PF-14 part 6, not walked) |
| monthly-checkin.html | 8 | 1 | green (PF-14 part 6, not walked) |
| settings.html | 25 | 1 | GREEN |
| exercise.html | 0 → 3 | 0 → 1 | AMBER → GREEN after `433d0650` |
| movement.html | 0 | 0 | amber, low-stakes, PF-15.x backlog |
| sessions.html | 0 | 0 | unknown, PF-15.x audit |
| leaderboard.html | 0 | 0 | probably legit REST-pass-through, PF-15.x audit |
| running-plan.html | 0 | 0 | needs Dexie wiring, PF-15.x |
| certificates.html | 0 | 0 | needs Dexie wiring, PF-15.x |
| engagement.html | 0 | 0 | likely needs Dexie wiring, PF-15.x audit |

**State at end of PM-96:** `vyve-site` main HEAD `433d0650`. SW cache key `vyve-cache-v2026-05-13-pm96-pf15-exercise-dexie-a`. PF-14 device verification COMPLETE. PF-15 part 1+2 SHIPPED. Six remaining unwired pages logged as PF-15.x sweep (Sunday session). PF-14b bundled-mode migration remains the launch blocker.

Four new §23 hard rules codified tonight: §23.7.1 page-side Dexie wiring requirement; §23.7.2 hydrate resolves true on partial failure; §23.7.3 SW activation amber flicker; §23.7.4 diagnostic-before-fix protocol.

## 19. Current status — 12 May 2026 PM (PM-68 + PM-68b + PM-69 + PM-70 ships — member-dashboard EF backend perf overhaul)

**🚢 BACKEND PERF OVERHAUL SHIPPED.** Four Supabase migrations + two member-dashboard EF deploys (v68 → v69) tonight, in response to the PM-67-night discovery that the bottleneck was server-side (17-38 s wallclock). Root cause identified, fixed at the source. See changelog 2026-05-12 PM-68+ block for full detail.

**What shipped:**
- `pm68_kill_sync_trigger_fanout` — removed 9 heavy AFTER ROW `zzz_refresh_home_state` triggers; replaced with 27 light AFTER STATEMENT dirty-flag triggers on a new `member_home_state_dirty` queue table. Writers now do nothing but mark the row dirty; readers refresh on demand.
- `pm68_b_unified_dashboard_state_rpc` — `member_home_state_get_fresh(p_email)` collapses dirty-check + refresh + state read + charity_total into one round trip.
- `pm69_dirty_queue_drain_cron` — `vyve_drain_home_state_dirty` pg_cron every 5 min covers idle-member rows. Caps idle staleness at 5 min.
- `pm70_fold_charity_total_into_state_rpc` — folded charity_total into the unified RPC. Eliminated per-request `get_charity_total()` round trip.
- member-dashboard EF v68 — first cut, separate refresh-if-dirty RPC.
- member-dashboard EF v69 — final cut, unified RPC; collapses three round trips into one. `verify_jwt: false` preserved.

**EXPLAIN ANALYZE on real members:**
- `refresh_member_home_state_if_dirty` CLEAN path: **2.4 ms**.
- DIRTY path (full refresh + flag clear): **32 ms**.
- Full drain of all 15 backfilled members: 426 ms.

**Expected production impact:** member-dashboard EF wallclock should drop from 17-38 s to 200-900 ms steady state. log-activity / wellbeing-checkin / monthly-checkin should also drop materially because writers no longer pay the trigger cost inline. Concurrent-user contention on member_home_state row locks effectively eliminated.

**Stale-row backfill done:** every `member_home_state` row was refreshed during the PM-68 backfill. Pre-shipment, the oldest were 6+ days stale (lewisvines 3 days, alanbird1 4 days, 8 others 6 days). All now fresh as of 2026-05-12 ~21:00 UTC.

**Outstanding (queued for next session):**
- PM-71 — pre-fetch dashboard-only fields (workoutsToday, cardioToday, dailyToday, sleepLastNight, healthConnections) into `member_home_state` during refresh; drop 5 PostgREST queries from the dashboard EF.
- PM-72 — materialise `member_achievement_progress` so the 23-evaluator achievements pass becomes 1 query.
- Verify in production that real member traffic produces sub-second EF wallclock.

**Brain integrity check:** the brain at §pg_cron and §06 May PM-2 already correctly states `recompute_all_member_stats` writes to `member_stats` (NOT `member_home_state`). Pre-PM-69 there was NO scheduled refresh of `member_home_state` — only on-write trigger refreshes — which is why inactive members had 6+ day stale rows.

**Pre-launch hard blockers (unchanged this session, all Lewis-blocked):** HAVEN clinical sign-off (Phil), weekly check-in nudge copy split, Brevo logo removal, Facebook Make connection expires 22 May, public-launch comms draft, B2B volume tier.

---

## 19. Current status — 12 May 2026 (PM-66 + PM-67a + PM-67d ships; member-dashboard EF latency discovered as PRIMARY perf regression)

**🚢 LAYER 4 EIGHT-COMMIT MILESTONE — 8/8 SURFACES SHIPPED. CAMPAIGN CLOSED.** vyve-site main HEAD `5947927b8e806d07dde802123a66a678848865bd`. PM-66 (`d81e1429`) shipped Layer 4 capstone monthly-checkin.html canonical-publish-only wiring + index.html belt-and-braces subscriber + sw.js cache key bump. PM-67a (`e274b734`) shipped premium-feel perf bundle — `defer` on vyve-offline.js across 3 HTML pages, `vyvePaintDone` dispatches on 4 pages (certificates, leaderboard, engagement path-1, engagement path-2 cache, habits end-of-renderHabits), and sw.js precache list expansion (wellbeing-checkin, monthly-checkin, leaderboard, log-food, running-plan, settings + perf.js + tracking.js + push-native.js + healthbridge.js). PM-67d (`5947927b`) shipped waterfall bundle — monthly-checkin.html init() first_name + status fetches parallelised, wellbeing-checkin.html fetchMemberData() allSeenRes promoted to 6th member of existing 5-fetch Promise.all. 14 files atomic across 3 commits. All byte-equal verified at commit time. Tree `db7873b1` is the production HEAD.

**🚨 PRIMARY PERF REGRESSION IDENTIFIED — MEMBER-DASHBOARD EF LATENCY 17-38 SECONDS.** Layer 5 baseline capture attempted post-ship and FAILED — perf_telemetry table empty after 25 min of normal use. Investigation pivoted on Dean's report of "every page taking longer to load and every page way less responsive than before." Edge function logs (12 May, ~21:30-22:30 UTC) revealed real cause: member-dashboard EF v67 execution_time_ms measurements 38585, 37640, 36147, 22708, 22642, 22546, 17984, 17966, 17211, 12946, 10934, 8808, 8015, 7659, 4976, 4160, 4083, 3119, 2649 ms — repeatedly 17-38 seconds server-side per response. Other slow EFs: notifications 24504/12037/5601 ms, monthly-checkin POST 18565 ms, wellbeing-checkin POST 12939 ms, log-activity POSTs 8961/10973/7886 ms. Tonight's client-side wins (50-250ms total) are dwarfed by this 30-40s backend ceiling. **No amount of client-side polish papers over a 38-second EF response.**

**Likely member-dashboard EF root causes** (member-dashboard EF v67 source pulled in tonight's transcript at `/mnt/transcripts/2026-05-12-20-45-33-vyve-pm66-pm67a-pm67d-ship-night.txt`):
- Single `Promise.all` of ~18 parallel q()/rpc() PostgREST queries (members, member_home_state, weekly_goals, daily_habits×30d, workouts×30d, cardio×30d, session_views×30d, replay_views×30d, get_charity_total RPC, certificates, member_health_connections, member_habits with habit_library join, member_health_daily today, member_health_samples sleep, workouts today, cardio today, daily_habits this-week, plus getMemberAchievementsPayload).
- `_shared/achievements.ts` has 23 INLINE evaluators all running in parallel via Promise.all (PM-13 parallelised them).
- If member_home_state row missing, calls `refresh_member_home_state` RPC then re-fetches synchronously — slow fallback path.
- PM-17 reduced 4 of 5 this-week queries by reading from member_home_state cache. PM-13 parallelised the achievements evaluator. Despite both, 30-40s still observed — suggests bottleneck is either (a) Supabase EF cold-start, (b) PostgREST connection pool exhaustion under 18-wide Promise.all + 23-wide inner achievements parallel, (c) refresh_member_home_state RPC slow path, (d) some query missing index, or (e) RLS overhead.
- `warm-ping` EF exists in logs and runs periodically (last call 2949ms / 1993ms / 411ms) — keep-warm intent is there but clearly not preventing cold-start latency.

**Premium-feel performance overhaul is now THE single highest priority for the week.** Dean explicit: "we need to do everything we can do to make this app feel as premium as possible and make it as quick and responsive as possible... we need to get EVERYTHING DONE!" 20+ hours committed across multiple sessions. Backend work (EFs, tables, indexes, RPCs, materialised views, denormalised state expansion) fully in scope. Layer 5 baseline capture deferred until perf.js bug fix lands (PM-67e — `record('perf_active', 1)` sentinel so we know when script ran, plus fallback for SW-cache navigation timing returning ≤0). All Layer 4 work CLOSED — no further surface migrations queued.

**Layer 4 8-commit migration shapes proven across PM-58..PM-66:**
1. PM-58 cardio — shared `member_home_state` patch via VYVEHomeState (cardio in TYPE_TO_HS_COLS)
2. PM-59 habits — `member_home_state` patch + page-local optimisticPatch/revertPatch (habits in TYPE_TO_HS_COLS, habits.html owns page-local 7-day cache)
3. PM-60 nutrition — `nutrition` namespace, no member_home_state patch (nutrition_logs/weight_logs not in TYPE_TO_HS_COLS), page-local cache invalidation only
4. PM-61 workouts.html — `workout_plan_cache` namespace, page-local optimisticPatch (workouts in TYPE_TO_HS_COLS via workouts_today_count derived path)
5. PM-62 onboarding_v8.html — `member_home_state` patch (workouts in TYPE_TO_HS_COLS), no page-local cache (page navigates away after submit)
6. PM-63 workouts-session.js — single shared module reused across two surfaces (workouts.html session-detail + index.html resume-card), `member_home_state` patch via TYPE_TO_HS_COLS
7. PM-64 movement.html — `member_home_state` patch (workouts in TYPE_TO_HS_COLS), page-local optimisticPatch/revertPatch on session-card render
8. PM-65 wellbeing-checkin.html — FIRST canonical-publish-only EF-writer (wellbeing_checkins NOT in TYPE_TO_HS_COLS, page has no local cache, no optimisticPatch/revertPatch/page-side failed-subscriber, index.html belt-and-braces is sole safety net)
9. PM-66 monthly-checkin.html — capstone, second canonical-publish-only shape, EF v23 returns aiReport object on 200 (no success field) so failure discriminator is `!res.ok` only — NEW §23 sub-rule 4.9 codifies this.

**Non-Layer-4 carry-forward unchanged from PM-65:** iOS 1.1 (Build 3) "Ready for Review" since 27 April auto-release on approval; Android 1.0.2 still awaiting Google Play review; HEALTH_FEATURE_ALLOWLIST dropped 26 April so HealthKit autotick LIVE on web for all opted-in iPhone members; GDPR Article 17 erasure pipeline (Commit 4) complete and live; GDPR export pipeline (Commit 3) complete and live. C4 Android push permission verified (POST_NOTIFICATIONS injected into merged manifest, google-services.json present — not a launch blocker). C5 Capacitor WebView SW check deferred — WKWebView `isInspectable` defaults false on iOS 16.4+ production builds.

**Pre-launch blockers (unchanged):** HAVEN auto-assignment without clinical sign-off (Phil, overdue); weekly check-in nudge copy split (Phil + Lewis, overdue); Brevo logo removal; Facebook Make connection expiring 22 May 2026 (10 days); public-launch comms draft; B2B volume tier definition.

## 19. Current status — 11 May 2026 (PM-65)

**📡 LAYER 4 EIGHT-COMMIT MILESTONE — 7/8 SURFACES SHIPPED (PM-66 capstone remaining).** vyve-site `ccf9c9baba7267b51baf01653ac66df9e95ccb0d`. PM-65 ships wellbeing-checkin.html — the FIRST Layer 4 EF-writer surface and the FIRST canonical-publish-only shape in the campaign. Layer 4 optimistic UI binding now covers: cardio.html (PM-58), habits.html (PM-59), nutrition.html (PM-60), tracking.js (PM-61), log-food.html (PM-62), workouts-session.js (PM-63), movement.html (PM-64), wellbeing-checkin.html (PM-65). Workouts family fully closed at PM-64; PM-66 monthly-checkin.html is the capstone.

**Seven Layer 4 shapes now proven through PM-65:** (1) shared `member_home_state` patch via VYVEHomeState (cardio, habits); (2) page-local cache patch via in-page helpers (nutrition's vyve_wt_cache); (3) snapshot-based revert for UPSERT-natural-key surfaces (nutrition); (4) asymmetric multi-table patch + symmetric canonical suppression (tracking.js); (5) page-in-memory-state IS the cache contents + dual-op signed-patch with full-row delete snapshot (log-food.html); (6) writeQueued + home_state hybrid (habits + workouts-session.js); (7) **canonical-publish-only — no patch, no revert, index.html belt-and-braces is the only safety net (wellbeing-checkin.html — first EF-writer surface)**.

**PM-65 ship details (11 May 2026 — Layer 4 wellbeing-checkin.html canonical-publish-only).** 3-file atomic commit `ccf9c9ba`, retry_count 0, all 3 files byte-equal verified post-commit. wellbeing-checkin.html (+3,857 chars) wires recordCanonical + canonical:true on both publish sites (live optimistic-pre-fetch + flush post-confirmed) and wellbeing:failed dispatch on three converging failure classes (!res.ok / data.success !== true / network throw). NO vyve-home-state.js script tag — FIRST Layer 4 surface to intentionally skip the module because wellbeing_checkins is not in TYPE_TO_HS_COLS. NO optimisticPatch and NO page-side revert subscriber — there's nothing to patch and nothing to revert. index.html (+382 chars) adds the wellbeing:failed belt-and-braces invalidateHomeCache subscriber, mirror of cardio/habit/workout/food/session:viewed shape. sw.js cache key pm64-movement-canonical-a → pm65-wellbeing-canonical-a.

**Asymmetric publish timing preserved within one surface family.** Live submit publishes BEFORE the EF fetch (PM-33..38 race-fix optimistic); deferred flush publishes AFTER res.ok (PM-39 initiator+confirmer post-server-confirmation). Both get recordCanonical + canonical:true; the 10s suppression TTL covers the writing device's own realtime echo regardless of timing. Codified as a forward §4.9 sub-rule.

**EF-writer failure-class discriminator extended to `!res.ok || data.success !== true`.** Direct-fetch EF surfaces have a richer failure surface than direct-DB surfaces — an EF can return HTTP 200 with a structured failure envelope. Layer 4 EF-writer surfaces capture both classes plus the catch-block network throw; all three converge on a single `<event>:failed` envelope with `reason: 'http_error'|'ef_failure'|'network'` for observability. Forward-applies to PM-66 monthly-checkin.html.

**Two pre-existing bugs found in pre-flight, both backlog not PM-65 scope.** (1) Live-path renders `undefined` ack/recs on EF 500 — incidentally fixed by PM-65's `!res.ok || data.success !== true` branch returning before renderResponse. (2) EF v28 returns `{success:true}` on 200 even if the Supabase `weekly_scores` / `wellbeing_checkins` writes throw inside their try/catch with `console.warn` only — backlog as P2 EF hardening.

**Audit-baseline drift correction (PM-58 §4.9 live-state-grep rule applied AGAIN).** Pre-flight strict-grep at HEAD `1b085800` revealed: subscribe narrative said 42 → live 46 (§1 lagged through PM-63/PM-64); optimisticPatch live 9 (PM-64 changelog said 10 — overcount); revertPatch live 7 (PM-64 changelog said 9 — overcount); vyve-home-state.js HTMLs live 22 (§1 narrative said 18 — undercounted since PM-61). All four corrected in the same atomic brain commit per PM-58 / PM-61 precedent.

**Audit counts post-PM-65** (strict-grep at `ccf9c9ba`, call-sites only): publish 43 → 45 (+2 wellbeing:failed); subscribe 46 → 47 (+1 index.html belt-and-braces); recordWrite 17 (unchanged — wellbeing-checkin's 2 recordWrite calls were already at PM-52); recordCanonical 13 → 15 (+2 flush + live); installTableBridges 1; optimisticPatch 9 (unchanged — first Layer 4 surface to skip); revertPatch 7 (unchanged — canonical-publish-only); vyve-home-state.js HTMLs 22 (unchanged — wellbeing-checkin intentionally does not tag).

**Three new §4.9 sub-rules codified (see active.md):**
1. Canonical-publish-only Layer 4 shape for EF-writer + non-home_state surfaces — no script tag, no patch, no revert, no page-side self-subscriber; index.html belt-and-braces is the ONLY safety net.
2. Asymmetric publish timing within one surface family is preserved at Layer 4 promotion — recordCanonical's 10s TTL tolerates whatever timing the surface already has.
3. EF-writer failure-class discriminator is `!res.ok || data.success !== true`, not just `!res.ok` — covers servers that 200-with-error-body.

**Two-device manual verify still pending Dean across PM-58/59/60/61/62/63/64/65.** Carried forward — no Android device. PM-65 testable via simulated EF failure in dev tools (block POST wellbeing-checkin → confirm wellbeing:failed publishes; confirm index.html belt-and-braces wipes vyve_home_v3).

**Layer 4 status: 7/8 surfaces shipped + 1 capstone remaining (PM-66 monthly-checkin.html).** Layer 5 telemetry clock running — target 18 May 2026, gates Layer 6 SPA-shell decision.

**Carried non-Layer-4 work** unchanged from PM-64: iOS 1.1(3) "Ready for Review" since 27 April; Android 1.0.2 awaiting Google Play; HAVEN clinical sign-off (Phil); weekly check-in nudge copy split (Phil + Lewis); Brevo logo removal (Lewis); Facebook Make connection expires 22 May 2026 (Lewis); B2B volume tier definition; public-launch comms draft.

## 19. Current status — 11 May 2026 (PM-62)

**📡 LAYER 4 IN PROGRESS — 5/8 SURFACES SHIPPED across PM-58..PM-62, four working sessions on 11 May 2026.** vyve-site `677f301f`. Optimistic UI binding to bus + reconcile-and-revert on POST failure now live on cardio.html (PM-58), habits.html (PM-59), nutrition.html (PM-60), tracking.js (PM-61), and log-food.html (PM-62). Five Layer 4 shapes proven: (1) shared `member_home_state` patch via VYVEHomeState (cardio, habits); (2) page-local cache patch via in-page helpers (nutrition's vyve_wt_cache); (3) snapshot-based revert for UPSERT-natural-key surfaces (nutrition); (4) asymmetric multi-table patch + symmetric canonical suppression for surfaces where one publisher writes to N>1 bridged tables (tracking.js); (5) page-in-memory-state IS the cache contents + dual-op signed-patch with full-row delete snapshot (log-food.html). Failure dispatch dichotomy holds: direct-fetch surfaces fire `<event>:failed` regardless of HTTP status (cardio, tracking); writeQueued surfaces discriminate 4xx eager vs 5xx deferred via the PM-59 writeQueued return-shape extension (habits, nutrition, log-food). DELETE-404 treated as idempotent success at both writeQueued first-try AND outboxFlush retry — covers cross-device delete races.

**PM-62 ship details (11 May 2026 — Layer 4 log-food.html dual-op signed-patch).** 3-file atomic commit `677f301f`, retry_count 0, all 3 files byte-equal verified post-commit. log-food.html (+12,410 chars) wires the FIRST non-habits signed-patch surface (food:logged +1 across logSelectedFood/logQuickAdd, food:deleted -1) AND the FIRST surface where the page's in-memory state IS the cache contents (diaryLogs serialized via saveDiaryCache, no separate helper layer like nutrition PM-60's vyve_wt_cache). `_deletedRow` snapshot captured BEFORE the optimistic filter in deleteLog; recordCanonical + canonical:true + original_sign added to all three publish envelopes; writeQueued NOW AWAITED at all three sites (previously fire-and-forget per PM-12 comment — adds 50-200ms latency on success-path before "Log Food" button re-enables, acceptable). On dead:true fires food:failed eagerly with full-restoration snapshot {kind:'insert'|'delete', clientId, meal, removedRow?}; on queued:true registers _logFoodInflight tracker. Module-level DOMContentLoaded IIFE wires page-owned food:failed revert subscriber (branches on snapshot.kind to filter-or-push the row + renderDiary + saveDiaryCache + toast on inserts/silent on delete reverts) + vyve-outbox-dead window listener (filters detail.items table='nutrition_logs', correlates by POST body.client_id OR DELETE url client_id=eq.<x>, synthesises food:failed from inflight; legacy-fallback ages out trackers >5min). DELETE-404 idempotent-success carries from PM-59 — cross-device delete races never fire food:failed. index.html (+938 chars) food:failed belt-and-braces invalidateHomeCache after the existing food:logged/food:deleted _markHomeStale subscribes (subscribe 18 → 19). sw.js cache key pm61-layer4-tracking-a → pm62-layer4-logfood-a. Five new §4.9 hard rules codified (signed dual-op surfaces carry original_sign on publish+failed; snapshot envelopes carry full restoration payload for non-home-state surfaces; prefer canonical:true boolean for all new Layer 4 wiring; awaiting a previously fire-and-forget writeQueued is a behavioural change; page-in-memory-state IS the cache contents).

**Audit count post-PM-62**: publish 38, subscribe 42, recordWrite 16 (unchanged — nutrition_logs recordWrite was at PM-50), recordCanonical 9 (+3 across log-food's three publish sites), installTableBridges 1.

**Layer 4 remaining (3 surfaces):** workouts family (workouts-session.js 4 sites + workouts-programme.js 3 sites + workouts-builder.js 1 site + movement.html 3 sites — likely 2 sessions; highest member-daily-flow frequency so highest premium-feel ROI of the remaining three), wellbeing-checkin.html (2 sites, server-side EF writer with PM-39 initiator+confirmer; needs canonical:true boolean because kind:'live'/'flush' already in use), monthly-checkin.html (1 site, server-side EF writer, capstone). Layer 5 telemetry clock running — target 18 May 2026, gates Layer 6 SPA-shell decision.

**Two-device manual verify still pending Dean across PM-58/59/60/61/62.** Carried forward — no Android device available; can resume verify once a second device is on hand. Layer 4 implementation does not depend on the verify; the verify is for cross-device echo + suppression confirmation only, and PM-58/59/60/61/62 are all atomic on the writer device with revert paths exercisable via simulated 4xx in dev tools.

**Carried non-Layer-4 work** unchanged from PM-61: iOS 1.1(3) at "Ready for Review" since 27 April; Android 1.0.2 awaiting Google Play; HAVEN clinical sign-off (Phil); weekly check-in nudge copy split (Phil + Lewis); Brevo logo removal (Lewis); Facebook Make connection expires 22 May 2026 (Lewis); B2B volume tier definition; public-launch comms draft.

## 19. Current status — 11 May 2026

**📡 LAYER 4 IN PROGRESS — 4/8 SURFACES SHIPPED across PM-58..PM-61, three working sessions on 11 May 2026.** vyve-site `88a562ba`. Optimistic UI binding to bus + reconcile-and-revert on POST failure is now live on cardio.html (PM-58), habits.html (PM-59), nutrition.html (PM-60), and tracking.js (PM-61). Four Layer 4 shapes proven: (1) shared home_state patch via VYVEHomeState for surfaces with columns in `member_home_state` (cardio + habits); (2) page-local cache patch via in-page helpers for surfaces without home_state columns (nutrition's vyve_wt_cache); (3) snapshot-based revert for UPSERT-natural-key surfaces where revert must restore prior value not just clear new (nutrition); (4) asymmetric multi-table patch + symmetric canonical suppression where one publisher writes to N>1 bridged tables but only some are in TYPE_TO_HS_COLS (tracking.js patches session_views, suppresses replay_views only). Failure dispatch has two cadences codified: direct-fetch surfaces fire `<event>:failed` regardless of HTTP status (terminal from the page's perspective — cardio, tracking); writeQueued surfaces discriminate 4xx eager vs 5xx deferred via the PM-59 writeQueued return-shape extension (habits, nutrition). DELETE-404 treated as idempotent success at both writeQueued first-try AND outboxFlush retry — covers cross-device delete races.

**PM-61 ship details (11 May 2026 — Layer 4 tracking.js + 16-page rollout + 2-page Layer 2 gap fix).** 19-file atomic commit `88a562ba`, retry_count 0, all 19 byte-equal verified post-commit. tracking.js v7 → v8 (+6,156 chars) wires the FIRST multi-table publisher in Layer 4 and introduces the `canonical: true` boolean payload discriminator to coexist with `kind:'live'|'replay'` from PM-54. index.html `_markHomeStale` gate extended to OR on the boolean; session:viewed:failed belt-and-braces subscriber added (subscribe 17 → 18). sw.js cache key bumped to `pm61-layer4-tracking-a`. 16 session pages (`checkin-live/rp`, `education-live/rp`, `events-live/rp`, `mindfulness-live/rp`, `podcast-live/rp`, `therapy-live/rp`, `workouts-live/rp`, `yoga-live/rp`) had `<script src="/vyve-home-state.js" defer></script>` inserted between bus.js and tracking.js. checkin-rp.html + workouts-rp.html ALSO had bus.js added — pre-existing PM-43/PM-54 gap where tracking.js's `if (window.VYVEBus)` had been silently no-op-ing since PM-43 and the PM-54 session:viewed bridge was never installed on those pages. Seven new §4.9 hard rules codified (see §23 below).

**Audit baseline drift correction (PM-58 §4.9 live-state-grep rule applied).** active.md §2 at PM-60 ship claimed publish=29, recordWrite=15; live grep at HEAD `1e7962d5` actually showed publish=33, recordWrite=16 runtime. habits.html had 8 publish sites (not 6 implied by brain); nutrition.html had 4 publish sites (not 2 implied). Brain narrative corrected in the PM-61 brain commit alongside the new sub-rule additions. Post-PM-61 projected baseline: publish=34, subscribe=40, recordWrite=16 (unchanged — session_views recordWrite was already wired at PM-54), recordCanonical=6, installTableBridges=1.

**Carried non-Layer-4 work** unchanged from PM-60: iOS 1.1(3) at "Ready for Review" since 27 April; Android 1.0.2 awaiting Google Play review; HAVEN auto-assignment in production needs Phil's clinical sign-off; weekly check-in nudge copy split needs Phil + Lewis; Brevo logo removal needs Lewis action; Facebook Make connection expires 22 May 2026 (Lewis); B2B volume tier definition still open; public-launch comms draft still open. The 11 May 2026 public announce was a comms event, not a technical go-live — iOS 1.2 already approved and cohort-wide before that date.

**Layer 4 remaining (4 surfaces):** log-food.html (3 publish sites, first non-habits signed-patch surface, sign:+1 insert / sign:-1 delete; PM-62 likely target), workouts family (~8 sites across 4 files), wellbeing-checkin.html (2 sites, server-side EF writer with PM-39 initiator+confirmer), monthly-checkin.html (1 site, server-side EF writer, capstone). Layer 5 telemetry clock running — target 18 May 2026, gates Layer 6 SPA-shell decision. Two-device manual verify pending Dean across PM-58/59/60/61.

## 19. Current status — 10 May 2026

**🎉 LAYER 1 CACHE-BUS CAMPAIGN COMPLETE — PM-30..PM-44 (15 commits, three working sessions on 09-10 May 2026).** vyve-site `66b14ee1`. 14 surfaces migrated, 23 publishers + 29 subscribers, 14 distinct event names with 5 using discriminator patterns. 6 real bug fixes shipped en route. 5 §23 hard rules codified during the campaign + 1 in the cleanup commit. Schema discipline held. Subscriber-internal helpers preserved per option (b). Audit-count delta from pre-PM-30 baseline: invalidate 11→1, record 8→1, evaluate 19→12 (subscriber-internal only). The bus is now the production path for all cache invalidation and achievements eval triggered from member-write surfaces; Layer 2 (Supabase Realtime row events translating to bus events) opens next session.

## 19. Current status — 09 May 2026

**09 May 2026 PM-36 — Layer 1c-7: `log-food.html` (3 publish surfaces) → `bus.publish('food:logged' | 'food:deleted', ...)`.** vyve-site `640c9d69818bf136b657f52bf17f3644598ce117` (new tree `0c0195845070241c64239b9cccd4c45b4c33730c`). Seventh Layer 1c migration. **First 1c migration shipping two distinct event names from one publishing page**, and **first to ship MIXED fallback shapes in one commit** (symmetric on both insert paths, asymmetric on the delete path). Three publish surfaces collapse to bus.publish: logSelectedFood (search-based food logging) → `food:logged source:'search'`; logQuickAdd (manual entry) → `food:logged source:'quickadd'`; deleteLog → `food:deleted`. Both `food:logged` and `food:deleted` are taxonomy ADDs (neither existed pre-PM-36).

**Bug fix on the way through.** Pre-PM-36 deleteLog had ZERO primitives — the home dashboard's "today's calories" count and engagement_cache score component never refreshed after a food delete until next sign-in. Bigger gap than PM-35's missing invalidate+record on workouts-builder.js. Bus path closes that gap via the index.html `_markHomeStale` and engagement.html `_markEngagementStale` subscribers (both extended in this commit to subscribe to food:logged + food:deleted, source-agnostic).

**Mixed fallback discipline (NEW §23 sub-rule).** PM-35 introduced asymmetric-fallback as a counterpoint to PM-33/PM-34 symmetric-fallback. PM-36 ships BOTH in one commit, classified per surface:

- **logSelectedFood + logQuickAdd insert paths: SYMMETRIC fallback.** Pre-PM-36 had `evaluate` (always, before writeQueued) + `invalidateHomeCache` (inside writeQueued branch only). Bus path defers both to subscribers; `!VYVEBus` else-branch preserves prior shipping primitives one-for-one (evaluate fires inline; invalidate fires inline only on the writeQueued branch).
- **deleteLog delete path: ASYMMETRIC fallback.** Pre-PM-36 had ZERO primitives. Bus path closes the gap via subscribers; `!VYVEBus` else-branch intentionally adds nothing back to preserve prior shipping behaviour.

The classifier that decides which to apply: **what was firing pre-bus at the publish site?** Insert paths had primitives → mirror them in fallback (symmetric). Delete path had no primitives → preserve nothing in fallback (asymmetric). Both decisions trace to the same invariant: `!VYVEBus` path must produce semantically-identical behaviour to pre-bus. Different commits across the campaign will ship different shapes; the page-level decision must be made at pre-flight time.

**Pre-flight scope corrections vs the taxonomy 1c-7 row.** Whole-tree audit at HEAD `218dfe8b` (the PM-35 ship) surfaced two errors:

- **Three publish surfaces, not two.** Taxonomy row says "log-food.html insert + delete". Live source has TWO insert paths (`logSelectedFood` search-based at L1045-L1121 + `logQuickAdd` manual at L1124-L1167) plus one delete path (`deleteLog` at L780-L839). Both insert paths are functionally identical for the bus migration (same payload shape, same writeQueued contract); they fold into one event with `kind:'search'|'quickadd'` discriminator.
- **deleteLog had ZERO primitives, not "evaluate-only".** The taxonomy framing of "inline cache writes + 2× evaluate" was approximately right for the inserts but wrong for delete. Delete had no primitives whatsoever — explicit bug, real cache-staleness gap.

**Two new subscribers wired** (extending existing handlers, not new bus subscriptions):

- `index.html:1303-onwards` `_markHomeStale` — extended to `food:logged` and `food:deleted` (source-agnostic, idempotent, mirrors the four prior events).
- `engagement.html:1656-onwards` `_markEngagementStale` — extended to `food:logged` and `food:deleted` (source-agnostic).

bus.js script tag added to log-food.html between auth.js and achievements.js per PM-31 convention. **First new bus.js wiring since PM-34 (movement.html).** The 1c-7 row is the first since PM-34 to add a bus.js tag to a new host page; future 1c migrations on log-food.html (none planned), and 1c-8 onwards may or may not need new tags depending on which page they touch.

**Schema.**
- `food:logged`: `{ client_id, meal_type, calories_kcal, kind: 'search' | 'quickadd' }`. `client_id` is the row identity (every nutrition_logs row has had one since PM-12). `meal_type` is `'breakfast' | 'lunch' | 'dinner' | 'snacks'`. `calories_kcal` is the per-row contribution (post-servings multiplication for logSelectedFood; flat for logQuickAdd). `kind` discriminates the publish site for future consumers; no current consumer reads it.
- `food:deleted`: `{ client_id, meal_type }`. Calories not carried — the row is gone.

**51 of 51 self-tests passing** in `/mnt/files/pm36_test.js` (15 groups, 505 lines): bus API smoke; logSelectedFood publish fan-out (6 tests); logQuickAdd publish fan-out (3); deleteLog publish fan-out (3); race-fix verification across all 3 surfaces; subscriber fan-out simulator with event-isolation tests; symmetric fallback verification (5 tests on insert paths); asymmetric fallback verification (3 tests on delete path); cross-tab origin:remote preservation for both events; validation guards (3); **PM-12 outbox-cancellation logic preserved**; PM-30/31/32/33/34/35 regression (4); two-event distinction; writeQueued contract preserved; **mixed-fallback count discipline** (4 tests verifying VYVEBus-present vs !VYVEBus deltas on both surfaces).

`node --check` clean on all 16 inline JS blocks across the three patched HTML files (log-food.html: 3 blocks; index.html: 8; engagement.html: 5).

**SW cache.** `vyve-cache-v2026-05-09-pm35-builder-a` → `vyve-cache-v2026-05-09-pm36-food-a`.

**Source-of-truth.** vyve-site pre-commit `218dfe8be75c3e97f6920ae45f680fec032438b3` (PM-35 ship), post-commit `640c9d69818bf136b657f52bf17f3644598ce117` (PM-36 ship), new tree `0c0195845070241c64239b9cccd4c45b4c33730c`. Whole-tree audit per §23 PM-26 + typeof/docblock/function-def exclusions per PM-32 + PM-28 + asymmetric-fallback discipline per PM-35 + mixed-fallback discipline per PM-36 (this commit). Post-commit verification per §23: 9 marker presence checks across all 4 files via live-SHA fetch (not raw — CDN-cached). Live blob SHAs: log-food.html `bfda139bc647`, index.html `44c0027527d2`, engagement.html `75d4d45291f8`, sw.js `d3a5cbe31420`.

**Sequence after PM-40:** Eleven Layer 1c migrations down (1c-1 through 1c-11), three to go (1c-12, 1c-13, 1c-14). 79% complete by surface count. Remaining surfaces: shared-workout (single-page, ASYMMETRIC), certificate / certificates (achievement-adjacent), live-session pages via session-live.js (eight live pages share one module). Then option-(b) cleanup commit closes Layer 1. Next session = PM-41, shared-workout recommended (smallest blast radius of the three remaining).

**PM-40 (Layer 1c-11: monthly-checkin.html → `bus.publish('monthly_checkin:submitted', { iso_month })`).** Eleventh Layer 1c migration. Single publishing surface (`submitCheckin` at `monthly-checkin.html:728-810`), ASYMMETRIC fallback, NEW event `monthly_checkin:submitted` (taxonomy ADD). Fourth asymmetric-fallback migration after PM-35, PM-36-deleteLog, PM-38. Pre-bus had 1 evaluate at L760, 0 invalidate, 0 record. Bus path replaces inline evaluate with publish-before-fetch + self-subscriber. Same shape as PM-35 workouts-builder (single-evaluate pre-bus).

**bus.js script tag NOT needed** — monthly-checkin.html already loads bus.js at L487 since PM-30 era for its existing `habit:logged` subscriber. **First 1c migration since PM-30 with no new bus.js wiring.**

Subscribers: index.html `_markHomeStale` extends source-agnostic to monthly_checkin:submitted (tenth event); engagement.html intentionally NOT wired (third intentional non-touch — engagement scoring has no monthly_checkin component); monthly-checkin.html self-subscribes for achievements eval (PM-37/PM-39 self-subscribe pattern — page-owned achievement journey). Coexists with the existing PM-30 `habit:logged` subscriber on the same page (independent fan-outs, isolated event names — verified by self-tests 11.1/11.2/11.3).

Schema: `{ iso_month: 'YYYY-MM' }`. Computed client-side using same pattern as init() at L929. Self-tests verify zero-padding for January and December edge cases.

Race-fix: standard initiator pattern (publish-before-fetch). NOT the PM-39 deferred-flush pattern — monthly check-in has no offline queue.

**P3 audit-count classification clarification RESOLVED:** count source-code call sites unconditionally regardless of runtime branch. Calls inside `if (!window.VYVEBus) { ... }` else-branches still count. Codified as new §23 sub-rule below.

SW cache: `vyve-cache-v2026-05-09-pm39-wellbeing-a` → `vyve-cache-v2026-05-09-pm40-monthly-a`. 34/34 self-tests passing across 11 groups. vyve-site `21bb6f3cd58fc3f628a67c60b5e619e106079d49`.

Audit-count delta vs post-PM-39 baseline (canonical methodology resolved): publish 16→17 (+1), subscribe 22→24 (+2 across index + monthly self-subscriber); invalidate/record/evaluate unchanged (asymmetric — bus path adds zero direct primitives; the L760 evaluate moved into else-branch but still counts per resolved methodology, so evaluate count is unchanged). Cumulative bus surface across PM-30..PM-40: 17 publishers, 24 subscribers.

**PM-39 (Layer 1c-10: wellbeing-checkin.html → `bus.publish('wellbeing:logged', { kind: 'live' | 'flush', ... })`).** Tenth Layer 1c migration. **TWO publishing surfaces** (live submit `submitCheckin` + deferred flush `flushCheckinOutbox`) with SYMMETRIC fallback on both, but with DIFFERENT pre-bus shapes (live had invalidate + evaluate; flush had invalidate-only). NEW event name `wellbeing:logged` with `kind` discriminator (`'live'` | `'flush'`) — matches the PM-36 `kind:'search'|'quickadd'` precedent.

Real bug fix on the way through: pre-PM-39 the engagement Wellbeing component (max 12.5 pts of 100, derived directly from most recent weekly score) was NEVER invalidated on check-in submission. Member submitted check-in → engagement.html showed stale Wellbeing component until 24h cache TTL or until member logged some other activity that fired _markEngagementStale. PM-39 closes the gap by extending engagement.html `_markEngagementStale` to wellbeing:logged. **First 1c migration since PM-36 where engagement.html is wired** (PM-37 weight + PM-38 persona were both intentional engagement non-touches — neither has a scoring component).

Subscribers: index.html `_markHomeStale` extends source-agnostic to wellbeing:logged (ninth event on the same handler); engagement.html `_markEngagementStale` extends (NEW for PM-39, first since PM-36); wellbeing-checkin.html self-subscribes for achievements eval (PM-37 self-subscribe pattern — "The Elite" 30-week-checkin track lives on this page).

**NEW §23 sub-rule codified this commit:** per-surface race-fix ordering for queue-drain surfaces. The standard Layer 1c race-fix pattern (publish-BEFORE-fetch) applies to write-initiator surfaces. Queue-drain surfaces (where publish is conditional on `res.ok` of a re-fired previously-queued request) publish AFTER `res.ok` confirms server-side write. PM-39 establishes the pattern with flushCheckinOutbox.

bus.js script tag added to wellbeing-checkin.html (first new wiring since PM-38). SW cache: pm38-persona-a → pm39-wellbeing-a. 41/41 self-tests passing across 12 groups. vyve-site `1a5d9ef8b1c4909c32e0f2199755dc52a7f0a9e6`.

**PM-38 (Layer 1c-9: settings.html persona switch → `bus.publish('persona:switched', ...)`).** Ninth Layer 1c migration. Single publishing surface (`savePersona` at `settings.html:1213-1258`), ASYMMETRIC fallback, NEW event name `persona:switched` (taxonomy ADD). Third asymmetric-fallback migration in the campaign after PM-35 (`workouts-builder.js`) and PM-36 (`deleteLog`).

Pre-bus primitives at the publish site: ZERO. Pre-PM-38 `savePersona` chained three sequential supaFetch calls (members PATCH → persona_switches POST → ai_decisions POST), updated DOM, self-busted `vyve_settings_cache` — but never invalidated `vyve_members_cache_<email>`. Bug: a member who switched persona saw stale per-persona protein-guidance copy on `nutrition.html` (populatePage:842 reads m.persona from the unchanged cache) until next sign-in. PM-38 closes the gap via the new `_markMembersCacheStale` subscriber on index.html.

Subscriber fan-out: index.html `_markHomeStale` extends source-agnostic to persona:switched (eighth event on the same handler); index.html `_markMembersCacheStale` (NEW handler in same DOMContentLoaded block) busts `vyve_members_cache_<email>` directly; engagement.html intentionally NOT wired (no persona component in scoring); achievements eval NOT wired (persona switching isn't an achievement event — the PM-37 self-subscribe pattern correctly does not apply here).

Asymmetric fallback: !VYVEBus path preserves pre-PM-38 zero-primitive semantics exactly. Bus path closes the cache-staleness gap via subscribers. Schema: `{ from_persona, to_persona }`.

bus.js script tag added to settings.html (first new bus.js wiring since PM-37/nutrition.html). SW cache: `vyve-cache-v2026-05-09-pm37-weight-a` → `vyve-cache-v2026-05-09-pm38-persona-a`. 30/30 self-tests passing across 10 groups. vyve-site `a0b98f17f2b2cc96995f66f8696b8e8864ec732f`.

NEW §23 hard rule codified this commit: asymmetric-fallback discipline for cache-staleness gap migrations is now established as a hard rule, not a per-commit footnote. Three asymmetric migrations (PM-35, PM-36-deleteLog, PM-38) confirm the pattern.

Audit-count delta vs post-PM-37 baseline (per PM-37 audit-count classification rule): publish 13→14 (+1 settings.html), subscribe 17→19 (+2 index.html persona handlers); invalidate/record/evaluate unchanged (asymmetric — bus path adds zero direct primitives).

**PM-37 (Layer 1c-8: nutrition.html weight log → `bus.publish('weight:logged', ...)`).** Eighth Layer 1c migration. Single publishing surface (`saveWtLog` at `nutrition.html:631-673`), SYMMETRIC fallback, NEW event name `weight:logged` (taxonomy ADD). Smaller commit than PM-36 by design — one publishing surface, no two-event split. Closer in shape to PM-35 (`workouts-builder.js`) than PM-36 (`log-food.html`).

Pre-flight scope corrections vs taxonomy 1c-8 row: (a) `wb_last` is the wellbeing-score-last cache (`vyve_wb_last` at engagement.html:799/915 + index.html:839), NOT a weight cache — strike from taxonomy; (b) `saveWtLog` writes only to `weight_logs`, not `members` (the `members.weight_kg` write is in the TDEE recalculator at L1302, a separate feature) — strike `members` from 1c-8 scope. Net correction: 1c-8 is REFACTOR + race-fix only, no scope-fix. Mirror of PM-33/PM-35/PM-36 editorial corrections.

Subscriber fan-out: index.html `_markHomeStale` extends source-agnostic to `weight:logged` (mirrors the six prior events); nutrition.html self-subscribes for achievements eval (NEW pattern — page-owned achievement journey); engagement.html intentionally NOT wired (engagement scoring has no weight component — first 1c migration where engagement.html is intentionally non-touched).

Symmetric fallback: !VYVEBus path preserves pre-PM-37 invalidate + evaluate semantics one-for-one. Bus path moves both to subscribers. Schema: `{ weight_kg: number, logged_date: 'YYYY-MM-DD' }`.

bus.js script tag added to nutrition.html (first new bus.js wiring since PM-36). SW cache: `vyve-cache-v2026-05-09-pm36-food-a` → `vyve-cache-v2026-05-09-pm37-weight-a`. 31/31 self-tests passing. vyve-site `c1c731a1df61e69871626794b06e4bd8b0e210b8`.

NEW §23 sub-rules codified this commit: (a) audit-count classification (excludes typeof guards + function defs + comments; subscriber-internal calls count; canonical post-PM-36 counts 11/8/19 for invalidate/record/evaluate primitives — resolves the P3 recon backlog item from PM-35 close); (b) self-subscribe pattern for page-owned achievement journeys (idempotent flag per page; sets precedent for 1c-9 onwards).

**09 May 2026 PM-35 — Layer 1c-6: `workouts-builder.js` custom workout creation → `bus.publish('workout:logged', source:'builder', ...)`.** vyve-site `218dfe8be75c3e97f6920ae45f680fec032438b3`. Sixth Layer 1c migration; smallest commit in the campaign so far (one publishing site, ~30 lines changed). The single existing primitive — a `VYVEAchievements.evaluate()` call at `workouts-builder.js:109` on the POST/create path — collapses into `bus.publish('workout:logged', { workout_id: null, completed: true, duration_min: null, source: 'builder' })` published BEFORE the fetch (race-fix mechanic, same as PM-33/PM-34). The PATCH/edit path is intentionally untouched — silent both before and after, matching today's POST-only eval semantic (editing a custom workout is a definition-tier change, not a completion event).

**Bug fix on the way through.** Pre-PM-35 saveCustomWorkout had ZERO invalidate/record primitives — only evaluate, and only on the POST path. The home dashboard "today's workouts" count and the engagement_cache score component never refreshed after a custom workout creation until next sign-in. The bus path closes that gap via the pre-existing `index.html` `_markHomeStale` and `engagement.html` `_markEngagementStale` source-agnostic `workout:logged` subscribers, plus the `workouts.html` unconditional eval subscriber. `source: 'builder'` correctly bypasses the workouts.html source-gated programme_cache stale and renderProgramme (both gated on `source === 'programme'`) — verified self-test 4.3.

**Asymmetric fallback (NEW codified discipline).** The `!VYVEBus` else-branch fires `evaluate()` only — NOT the full primitive triplet. Pre-PM-35 didn't fire invalidate or record, so adding them to the fallback would silently change behaviour for the rare case bus.js failed to load. The bus path adds invalidate + record via subscribers (real bug fix); the fallback intentionally preserves prior shipping code semantics. Different from PM-33/PM-34 symmetric-fallback (which mirrored existing pre-bus primitives one-for-one because those primitives existed pre-bus). Codified as a §23 sub-rule in this brain commit so future migrations distinguish symmetric-fallback (PM-33/PM-34 case: pre-existing primitives present) from asymmetric-fallback (PM-35 case: bus path closes a primitive gap).

**Pre-flight scope decision: NO new subscribers needed.** All three downstream subscribers already wired by PM-31 + PM-33-bonus: index.html (home-stale, source-agnostic), engagement.html (engagement-stale, source-agnostic), workouts.html (eval unconditional + programme stale gated on `source: 'programme'`). bus.js already loaded on workouts.html (the host page that loads workouts-builder.js) since PM-31 — no new script tag. Pure publishing-site migration.

**Schema.** `{ workout_id: null, completed: true, duration_min: null, source: 'builder' }`. Both `workout_id` and `duration_min` null at this site — POST uses `Prefer: return=minimal` so no server PK comes back, and custom workout creation isn't a timed event (it's a template definition, not a completion). PM-34's nullable widening on both fields covers this.

**Taxonomy editorial fixes on the way through.** The `workout:logged` Subscribers column listed `index.html, exercise.html, workouts.html, achievements.js`. Whole-tree audit at HEAD `5e404079` proved two of those wrong: (1) **exercise.html has zero VYVEBus references** and doesn't load bus.js — it's the Exercise Hub landing page, reads `workout_plan_cache` not workout completion events, not a subscriber. (2) **achievements.js has zero VYVEBus references** — it's invoked via direct `VYVEAchievements.evaluate()` calls from page-level subscribers, not via bus subscription (option-(a) discipline mirror; same correction PM-33 applied to cardio:logged). engagement.html was missing despite being a confirmed `workout:logged` subscriber (PM-33 bonus fix). Subscribers column patched: `index.html, workouts.html, engagement.html` — three subscribers, all source-agnostic for `workout:logged` (workouts.html's source-gated programme_cache stale is internal to that subscriber's handler, not a separate subscriber).

**Whole-tree primitive audit at HEAD `5e404079`.** Methodology applied: typeof guards excluded (PM-32 §23 sub-rule), docblock comments excluded (PM-28 §23 sub-rule), function definitions excluded. Result: invalidate **11**, record **8**, evaluate **19**. Reconciled against the prompt's stated 13/8/15 post-PM-34: record matches; invalidate is 2 lower (likely subscriber-internal calls double-counted in earlier audits — needs separate recon commit); evaluate is 4 higher because subscriber-block evaluate calls inside `workouts.html:588` and `workouts.html:614` are publish-surface-irrelevant but I include them as raw call sites. **The PM-35 publishing-surface count change is what matters: workouts-builder.js publish surface goes from 1 evaluate / 0 invalidate / 0 record (pre-PM-35) to 1 evaluate-in-fallback / 0 invalidate / 0 record (post-PM-35). Net change at the publishing surface: 0 / 0 / 0.** Asymmetric-fallback discipline: when the bus path closes a primitive gap (rather than mirroring pre-existing primitives), publishing-surface counts CAN drop in some configurations; in this configuration they stay at zero because the only pre-PM-35 primitive was evaluate, and that's preserved in the fallback. Methodology reconciliation against the broader portal flagged for a separate audit-recon commit, not blocking PM-35.

**43 of 43 self-tests passing** in a Node harness with patched `saveCustomWorkout` extracted via regex and run inside a sandbox with browser-equivalent global scope (bare `VYVEBus` / `VYVEAchievements` identifiers exposed alongside `window.VYVEBus` / `window.VYVEAchievements`). Test groups: bus API regression smoke; POST publish fan-out (6 envelope-shape tests); race-fix verification (publish ts ≤ fetch resolve ts AND publish recorded before fetch call recorded); subscriber fan-out (home-stale + engagement-stale + workouts.html eval all fire once on builder publish, programme stale BYPASSED, render BYPASSED); source discriminator integrity for all 4 sources (programme STILL stales, custom/movement/builder all bypass); cross-tab origin:remote preserves source:'builder'; **asymmetric fallback verification** (4 tests: !VYVEBus fires evaluate, !VYVEBus does NOT fire invalidate or record, !VYVEBus + !VYVEAchievements no-op, VYVEBus present fires NO direct evaluate); PATCH/edit path silent (4 tests: no publish, no eval, no fallback fire); envelope shape (email/txn_id/ts/origin); PM-30/31/32/33/34 regression (8 tests: all prior events flow correctly, all 4 workout:logged sources delivered to source-agnostic subscriber); PM-34 schema widening preserved; validation guards (empty name / empty exercises return early without publish or fetch); count discipline (1 publish, 0 direct eval, 1 fetch).

**SW cache.** `vyve-cache-v2026-05-09-pm34-movement-a` → `vyve-cache-v2026-05-09-pm35-builder-a`.

**Source-of-truth.** vyve-site pre-commit `5e4040797ddce859026c4c61def20448723228a6` (PM-34 ship), post-commit `218dfe8be75c3e97f6920ae45f680fec032438b3` (PM-35 ship), new tree `09cfa5b2d1dee3cb0d64e3ac2fb24b02f88dc3b5`. Whole-tree audit per §23 PM-26 + typeof-guard exclusion per PM-32 + docblock-comment exclusion per PM-28 + asymmetric-fallback discipline per PM-35 (this commit). Post-commit verification per §23: marker presence verified across workouts-builder.js (`VYVEBus.publish('workout:logged'`, `source: 'builder'`, PM-35 marker — all live, blob SHA `c9173586828b`) and sw.js (cache literal live, blob SHA `e80a4cb77d79`).

**Sequence after PM-35:** Six Layer 1c migrations down (1c-1 through 1c-6), eight to go (1c-7 log-food.html → 1c-14 share-workout). Then option-(b) cleanup commit closes Layer 1. Next session = PM-36, likely 1c-7 (log-food.html insert + delete; race-fix migration with `food:logged` + `food:deleted` as paired events — first 1c migration with two distinct event names from one publishing surface).

**09 May 2026 PM-34 — Layer 1c-5: `movement.html` (walk + non-walk paths) → `bus.publish('cardio:logged' | 'workout:logged', ...)`.** vyve-site `5e4040797ddce859026c4c61def20448723228a6` (new tree `ee1ea552683029b97a5d7836c214fcf675814d9d`). Fifth Layer 1c migration. Two publishing surfaces in movement.html (`markDone` programme-completion + `logMovement` quick-log) collapse to bus.publish per the taxonomy 1c-5 row. The discriminator is event-name, not commit-name: `markDone` always publishes `workout:logged source:'movement'`; `logMovement` publishes `cardio:logged source:'movement_walk'` (walk) or `workout:logged source:'movement'` (non-walk) based on `isWalk`. First migration shipping TWO race-fixes from the same page in one commit.

**Programme heartbeat boundary preserved (PM-31 invariant).** `markDone`'s flow is POST /workouts → publish workout:logged → PATCH /workout_plan_cache (advance current_session/current_week) → removeItem(CACHE_KEY). The PATCH stays SILENT — programme counter, not member action. Verified self-test 11.1: markDone produces exactly ONE bus event total across the full handler.

**Pre-flight scope decision: NO new subscribers needed.** All four downstream subscribers were already wired by PM-31 + PM-33 + PM-33's bonus fix. index.html `_markHomeStale` source-agnostic. engagement.html `_markEngagementStale` source-agnostic. workouts.html PM-31 subscriber correctly bypasses `vyve_programme_cache_<email>` stale for `source: 'movement'` (programme_cache is for the workouts-session.js journey, not movement.html — different page, different cache, different source value) — verified self-test 3.6 / 3.7. cardio.html PM-33 subscriber fires eval on `cardio:logged` source-agnostic. Pure publishing-site migration.

**Schema.** `cardio_id` and `workout_id` both omitted (movement.html has no client UUID equivalent, POST `Prefer: return=minimal`). Taxonomy patched: `workout_id` widened from `<int|string>` to `<int|string>?` for explicit nullability.

**Distance hoist refactor.** `walkDistanceKm` lifted from inside `if (isWalk)` to a `let` before the publish block so the bus envelope carries the same value the POST body will. Pure code move.

**Whole-tree primitive audit at HEAD `392316a8`.** Pre-PM-34: invalidate **13** / record **8** / evaluate **15**. After PM-34 ship: **unchanged at 13/8/15**. Both publishing surfaces use the symmetric bus-fallback else-branch pattern from PM-33 — the !VYVEBus path adds back the same three primitives one-for-one. Codified in PM-33's §23 hard rule: pure REFACTOR + race-fix migrations don't drop the count, which is correct.

**47 of 47 self-tests passing** in a Node harness with bus.js loaded verbatim and browser shims. Test groups: bus API regression, walk-pill cardio:logged fan-out, non-walk workout:logged fan-out (with source discriminator correctly bypassing programme_cache stale), markDone publishing the same shape as the non-walk path, race-fix verification, dual-publish from same page (no cross-pollination), cross-tab origin:'remote' delivery for both event names with source preserved, fallback path across walk/non-walk/markDone, PM-31 programme_cache regression, prior-event regression for habit/workout/set/cardio, **workout_plan_cache heartbeat boundary verified — markDone produces exactly 1 bus event total despite POST + PATCH + removeItem in the handler**.

**SW cache.** `vyve-cache-v2026-05-09-pm33-cardio-a` → `vyve-cache-v2026-05-09-pm34-movement-a`.

**Source-of-truth.** vyve-site pre-commit `fe7e06ce` (PM-33 ship), post-commit `5e4040797ddce859026c4c61def20448723228a6` (PM-34 ship), new tree `ee1ea552`. Whole-tree audit per §23 PM-26 + typeof-guard exclusion per PM-32 + symmetric-fallback discipline per PM-33. Post-commit verification per §23: marker presence verified across movement.html (bus.js tag + 1× cardio:logged publish + 2× workout:logged publish + 'movement_walk' + 'movement' + PM-34 marker, all live), sw.js (cache literal live). Live SHAs: movement.html `6c0b8292`, sw.js `59aa7021`.

**Sequence after PM-34:** Halfway through Layer 1c — five down (1c-1 through 1c-5), nine to go (1c-6 workouts-builder.js → 1c-14 share-workout). Then option-(b) cleanup closes Layer 1. Next session = PM-35, likely 1c-6 (workouts-builder.js custom workout creation — taxonomy ADD migration, evaluate-only today, no current invalidation = real bug).

**09 May 2026 PM-33 — Layer 1c-4: `cardio.html` log → `bus.publish('cardio:logged', ...)`.** vyve-site `fe7e06ce52abb42e55034cfb0145c2297ce9ccbc` (new tree `18b111fd2e60ef98cf8e9ffe4ba97884ea11a634`). Fourth Layer 1c migration; first to ship a real race-fix (PM-30/PM-31/PM-32 were pure REFACTOR with bug-fixes-on-the-way-through). Three primitive sites in cardio.html `logCardio` (L643 invalidate + L646 record + L648 evaluate) collapse into one `bus.publish('cardio:logged', { cardio_type, duration_min, distance_km, source: 'cardio_page' })` published OPTIMISTICALLY before the POST fetch. Race-fix mechanic: bus.publish is a synchronous in-tab dispatch + microsecond cross-tab broadcast, decoupling local UI staleness propagation from the fetch round-trip. Subscribers (home-stale, engagement-stale, eval) all do cheap idempotent ops on the local tab; the fetch resolution doesn't gate the UI. The 200-800ms gap pre-PM-33 (where home read pre-tick state if a member tapped Home mid-await) is closed.

**Pre-flight scope corrections caught against live source.** Whole-tree audit at HEAD `392316a8` (73 source files, 1,743,473 chars) proved two taxonomy claims wrong on the `cardio:logged` row: (1) **`vyve_cardio_cache` is in-page only** — single hit at cardio.html:252, no cross-page consumer; the page already busts it post-fetch via `localStorage.removeItem(CACHE_KEY)` + re-fetch at L661-L662. The taxonomy's "scope-fix to cardio_cache" framing was a false positive. (2) **`vyve_engagement_cache` is the actual scope-fix** — read by engagement.html (5 sites, 24h TTL gate) and written by auth.js (sign-in fan-out), with **zero invalidators on writes pre-PM-33**. Log cardio (or any activity), navigate to engagement.html within 24h, see stale scores. PM-33 closes that gap on cardio:logged (primary motivation) AND folds in subscribers for habit/workout/set:logged (closing the same gap on the three earlier-shipped events). Bonus fix flagged explicitly — same precedent as PM-30 autotick-evaluate and PM-32 legacy-fallback home-stale gaps.

**Fold-vs-split decision: SPLIT.** The taxonomy's `cardio:logged` row lists two publish sites: cardio.html + movement.html walk pill. Pre-flight read of movement.html L630-L710 confirmed walk + non-walk paths share the same primitives block at L687-L697 (the if/else only branches the fetch URL/payload + `recordRecentActivity('cardio'|'workout')` arg). Folding 1c-4 + 1c-5 would mean publishing two different bus events from the same block based on `isWalk` — doubles the blast radius. Split keeps each commit to one publish site / one event name. PM-34 → movement.html (both walk → cardio:logged source:'movement_walk' AND non-walk → workout:logged source:'movement') in one commit, since the shared block can't be carved.

**Schema.** `cardio_id` omitted from envelope — `Prefer: return=minimal` means no server PK; no consumer needs it. Taxonomy patched in same brain commit (cardio_id widened from `<int>` to `<int>?`).

**Subscriber wiring (option-(a) discipline preserved).**

- `index.html`: extended the existing `_markHomeStale` handler in `__vyveHomeBusWired` block with one-line `subscribe('cardio:logged', _markHomeStale)`. Same handler body fires for habit/workout/set/cardio — they all stale `vyve_home_v3_<email>` identically.
- `engagement.html`: NEW `__vyveEngagementBusWired` block. Subscribes to `cardio:logged` (primary), `habit:logged`, `workout:logged`, `set:logged` (bonus fix). Handler does `localStorage.removeItem('vyve_engagement_cache')`. Idempotent, origin-agnostic. Visibility-gated repaint of a live engagement.html tab intentionally NOT included — cache-stale is sufficient; live optimistic delta is Layer 4.
- `cardio.html`: NEW `__vyveCardioBusWired` block. Achievements eval only — cardio's own page-state cache is busted by the existing post-await flow at L661-L662 (page-state, not bus territory). Mirrors workouts.html's PM-31/PM-32 pattern.

**Two new bus.js script tags** (cardio.html + engagement.html), both inserted between auth.js and achievements.js per the established pattern.

**Cross-tab origin handling.** All three subscribers origin-agnostic per option-(a). Local + remote fire identically; achievements.js debouncer (1.5s) collapses cross-tab fan-in.

**Whole-tree primitive audit at HEAD `392316a8` (73 source-text files, 1,743,473 chars decoded; typeof guard lines excluded per PM-32 §23 sub-rule):** invalidateHomeCache **13** sites, recordRecentActivity **8** sites, VYVEAchievements.evaluate **15** sites. After PM-33 ship: counts unchanged at **13/8/15**. The symmetric bus-fallback else-branch preserves all three primitives one-for-one (three removed at L643/L646/L648; three added back in the fallback) — explains why PM-33 doesn't drop the counts the way PM-30/31/32 did. Worth flagging in audits going forward: pure REFACTOR + race-fix migrations (no asymmetric removal) leave the count identical, which is correct, not a bug.

**39 of 39 self-tests passing** in a Node harness with browser shims and bus.js loaded verbatim. Test groups: bus API regression, idempotent subscriber wiring, full subscriber fan-out, envelope shape (incl. distance_km nullable), **race-fix verification (publishers fire before fetch resolves — measured)**, cross-tab origin:'remote' delivery via storage event, storage event noise filtering, fallback path, regression on PM-30/PM-31/PM-32 events, engagement-stale bonus fix on habit/workout/set:logged. `node --check` clean across all inline JS blocks (cardio.html 3, engagement.html 5, index.html 8).

**SW cache.** `vyve-cache-v2026-05-09-pm32-exerciselog-a` → `vyve-cache-v2026-05-09-pm33-cardio-a`. Same atomic commit.

**Source-of-truth.** vyve-site pre-commit `392316a8` (PM-32 ship), post-commit `fe7e06ce52abb42e55034cfb0145c2297ce9ccbc` (PM-33 ship), new tree `18b111fd2e60ef98cf8e9ffe4ba97884ea11a634`. Whole-tree audit method per §23 PM-26. Post-commit verification per §23: live-SHA fetch via `GITHUB_GET_REPOSITORY_CONTENT` (not raw), 4 files (cardio.html `dbace512`, engagement.html `9a8a7323`, index.html `461a195b`, sw.js `f01df275`) — head-100 + char-count + marker-presence all confirmed live.

**Sequence after PM-33:** PM-34 → 1c-5 (movement.html walk + non-walk paths). Both paths fold into one commit because they share the same primitives block; the discriminator is event-name, not commit-name. After PM-34, ten more 1c migrations (1c-6 through 1c-14, plus the option-(b) cleanup) before Layer 1 closes.

**09 May 2026 PM-32 — Layer 1c-3: `workouts-session.js` `saveExerciseLog` → `bus.publish('set:logged', ...)`.** vyve-site `392316a86bd94f01fe3a44ef38837ce1ed857d2c` (new tree `bcb5f1538b81ed830f63029d72e9197011e1fcd6`). Third Layer 1c migration. Three primitive sites in saveExerciseLog (L405 invalidateHomeCache + L406 evaluate writeQueued path; L412 evaluate legacy fallback) collapse into one shared `_publishSetLogged()` helper called from both write paths. Schema: `{ exercise_log_id, exercise_name, set_number, reps, weight_kg }`. `exercise_log_id` is `payload.client_id` (writeQueued uses `Prefer: return=minimal`, no server PK comes back; client UUID is the stable identifier). `set_number` was renamed from the function's misleading `setsCompleted` parameter (it's actually a 1-based set INDEX from `tickSet`'s `setIdx + 1`, not a cumulative count) — taxonomy schema patched in same brain commit to match.

**Pre-flight scope corrections caught against the live source.** The taxonomy's `set:logged` row listed subscribers as "exercise.html (PR strip), workouts-session.js (next-set)". Whole-tree audit at HEAD `ee0497a5` proved both wrong: (1) exercise.html is the Exercise Hub landing page — three stream cards (Movement / Workouts / Cardio) plus a programme-progress hero card. It reads `workout_plan_cache`, NOT `exercise_logs`. There is no PR strip on exercise.html. Its `vyve_exercise_cache_v2` cache holds programme JSON (programme_name, weeks, current_session) and is correctly staled by `programme:updated` (an open ADD migration), not `set:logged`. (2) The actual "PR strip" (`comp-pr-strip` element) lives on workouts.html and is populated by `renderCompletionView` inside `completeWorkout` — already shipped under PM-31. (3) The "PRs tab" (`#prs-view` in workouts.html, populated by `workouts-notes-prs.js`) is read-only and re-loads on `openPrsView()` — no live coupling to `set:logged`. (4) The "next-set hint" referenced in the taxonomy is `checkProgressNudge` + `checkOverloadNudge` in workouts-notes-prs.js / workouts-session.js, which fire BEFORE `saveExerciseLog` runs, reading from in-memory `exerciseHistory` (loaded once per session by workouts-programme.js, intentionally NOT updated mid-session because nudges compare against the previous session's bests, not against today's just-logged sets). They aren't reactive subscribers — they're pre-save evaluators. **Net: there is no live UI today that needs to refresh on `set:logged` per-set.** PM-32 ships subscribers driven purely by the engagement-variety/score consequence on home and the achievements eval consequence — both of which are real and were previously inline-coupled to the save handler.

**Bug-fix on the way through.** Pre-PM-32 the legacy fallback path (L411-L413, fires when `!VYVEData.writeQueued`) only called `VYVEAchievements.evaluate()` — it was missing the `invalidateHomeCache()` that the writeQueued path called on L405. PM-32's `_publishSetLogged()` helper is symmetric across both paths, so the legacy path now stales home correctly via the bus subscriber chain. Same kind of "free fix on the migration" PM-30's autotick-evaluate gap closed.

**Subscriber wiring (option-(a) discipline preserved).**

- `index.html`: extended the existing PM-30/PM-31 `_markHomeStale` handler in the `__vyveHomeBusWired` block to subscribe to `set:logged` as well. One-line addition. Origin-agnostic, idempotent. Same `_markHomeStale` body fires for `habit:logged`, `workout:logged`, and `set:logged` — they all stale `vyve_home_v3_<email>` identically (engagement variety/score component on the home dashboard score ring is sensitive to all three).
- `workouts.html`: added a second `subscribe('set:logged', ...)` inside the existing `__vyveWorkoutsBusWired` block (alongside the PM-31 `workout:logged` subscriber). Achievements eval only — no cache to stale. The achievements.js debouncer (1.5s) collapses the rapid per-set fan-in (a typical session ticks 3-5 sets per exercise across 4-6 exercises = 12-30 publishes per session) into a single eval call, making the per-set publishing cheap.

**No new bus.js script tag.** Both index.html (PM-29) and workouts.html (PM-31) already carry `<script src="/bus.js" defer>`. Smaller commit than PM-30/PM-31.

**Cross-tab origin handling.** Both subscribers are origin-agnostic per option-(a) discipline. Index home-stale fires on local + remote identically (idempotent localStorage write). Workouts.html eval fires on local + remote identically; if a member has workouts-session open in tab A and workouts.html visible in tab B, ticking a set on A fires the eval on B's tab (debouncer collapses to one eval call across both tabs).

**Whole-tree primitive audit at HEAD ee0497a5 (full §23 PM-26 method, all 73 source-text files, 1,795,025 chars decoded):** invalidateHomeCache **14** call sites, recordRecentActivity **8** call sites, VYVEAchievements.evaluate **18** call sites. Excludes `typeof X === 'function'` guard lines that PM-31's audit incorrectly counted as call sites — see new §23 sub-rule under PM-26. After PM-32 ship: invalidateHomeCache count drops to **13** (saveExerciseLog L405 site removed; L592 fallback inside the new bus-publish helper preserved as a structural protection, the L411-fetch-fallback path's bus-fallback else-branch adds one new site so net balance is -1 from a publishing-surface perspective). Evaluate count drops to **15** publishing-surface sites (L406 + L412 removed; L597 + L744 inside completeWorkout / afterCompletion preserved as separate concerns; bus-fallback else-branch adds one site).

**46 of 46... wait, 20 of 20 self-tests passing** in a Node harness with browser shims (`window`, `document`, `localStorage`, `CustomEvent`, `StorageEvent`) plus the unchanged bus.js loaded verbatim. Test groups: (1) bus API regression, (2) idempotent subscriber wiring, (3) writeQueued path full subscriber fan-out — home invalidate + eval, no recordRecentActivity (correctly — set:logged doesn't bump recent-activity, that's saveExerciseLog/completeWorkout split), (4) envelope shape — exercise_log_id / exercise_name / set_number / reps / weight_kg / event / ts / email / origin / txn_id all preserved, (5) bodyweight `weight_kg: null` preserved, (6) cross-tab origin:'remote' delivery via storage event with correct `vyve_bus` key, (7) storage-event noise filtering — non-bus key / paired removeItem newValue:null / malformed JSON, (8) per-set rapid-succession publishing — 5 sets → 5 invalidates + 5 evaluates (debouncer simulated separately; harness counts raw calls), (9) fallback path `!window.VYVEBus` → primitive triplet still fires (writeQueued + legacy paths both protected), (10) regression on PM-30 habit:logged + PM-31 workout:logged subscribers still flow correctly through the extended `_markHomeStale` handler, (11) subscriber isolation — `set:logged` does NOT touch `vyve_programme_cache_<email>` (that's `workout:logged` source:'programme' only), (12) event-name validation regression — invalid event names warn-and-no-op, valid `set:logged` passes. `node --check` clean on workouts-session.js, sw.js, and 10 inline `<script>` blocks across index.html (8) + workouts.html (2) — 0 syntax failures.

**SW cache.** `vyve-cache-v2026-05-09-pm31-workouts-a` → `vyve-cache-v2026-05-09-pm32-exerciselog-a`. Same atomic commit. `/bus.js` already in `urlsToCache` from PM-29.

**Source-of-truth.** vyve-site pre-commit `ee0497a5` (PM-31 ship), post-commit `392316a86bd94f01fe3a44ef38837ce1ed857d2c` (PM-32 ship), new tree SHA `bcb5f1538b81ed830f63029d72e9197011e1fcd6`. Whole-tree audit method per §23 PM-26: `GITHUB_GET_A_TREE` recursive on main → 90 entries → 73 source-text files (.html .js .css; excludes vendor `supabase.min.js`, `test-schema-check.txt`, manifest.json, CNAME, images, dirs) → all 73 fetched (1,795,025 chars decoded) → grep for `invalidateHomeCache` / `recordRecentActivity` / `VYVEAchievements\s*\.\s*evaluate\s*\(` excluding comment lines (`//`, ` * `) AND `typeof X === 'function'` guard lines (new §23 sub-rule). Post-commit verification per §23: live-SHA fetch via `GITHUB_GET_REPOSITORY_CONTENT` (not raw — CDN-cached), all 4 files: head-100 char match, char-count match, blob_sha matches `path_status` from the commit response (workouts-session.js blob `b60a2ad4fa62a1736897dbedf8504f75bf524964`, index.html blob `983a4bbcf56cdcc12c1b9f033ecc60d71240be7f`, workouts.html blob `457cef1ea9424b17a0b6e168087c03cf3417c653`, sw.js blob `f58be5e50c372b704772e9c83d53898ef09eb52a` all confirmed live).

**Sequence after PM-32:** PM-33 → 1c-4 (`cardio.html` log → `bus.publish('cardio:logged', source:'cardio_page', ...)`). REFACTOR + race-fix + scope-fix per the taxonomy. Different file, similar pattern.

**09 May 2026 PM-31 — Layer 1c-2: `workouts-session.js` `completeWorkout` → `bus.publish('workout:logged', source:'programme'|'custom', ...)`.** vyve-site `ee0497a5cca1957ca1b3f2aa1f9aa4181e2e7ed7`. Second Layer 1c migration. Single publish site collapses three primitives (L569 + L573 evaluate, L581 invalidate, L586 record) at completeWorkout's post-write block; subscribers on workouts.html and index.html replace the inline calls. Pre-flight scope correction: live source has ONE unified `completeWorkout()` at L531 (not two as the original taxonomy implied — both programme and custom completions route through the same function via runtime check on `programmeData && cacheRow`), so PM-31 ships one bus.publish, not two. Schema: `{ workout_id: _workoutClientId, completed:true, duration_min, source:'programme'|'custom' }`. workouts.html new `DOMContentLoaded` IIFE gated on `__vyveWorkoutsBusWired` — subscribes to `workout:logged`, stales `vyve_programme_cache_<email>` only when `source:'programme'` (closes the nav-back-without-dismissing-completion-screen gap left open by `afterCompletion`'s L690 removeItem), always fires `VYVEAchievements.evaluate()` per option-(a) discipline, calls `renderProgramme()` only when `document.visibilityState === 'visible'` AND `#programme-content` is the active tab. Origin-agnostic — local and remote handled identically. index.html PM-30 home-stale subscriber refactored to extract `_markHomeStale` handler then subscribe to BOTH `habit:logged` AND `workout:logged` (same `__vyveHomeBusWired` flag preserved). exercise.html dropped from PM-31 scope — `vyve_exercise_cache_v2` staleness is for `set:logged` (1c-3) and `programme:updated` (open ADD), not for workout completion. Plan-cache heartbeat boundary preserved: workout_plan_cache PATCH at L596+ stays silent (PM-13 04 May invariant); bus.publish lands BEFORE the PATCH block (verified structurally). 46 of 46 self-tests passing in Node harness with browser shims; `node --check` clean on workouts-session.js + sw.js + 10 inline JS blocks across workouts.html (2) + index.html (8). SW cache `vyve-cache-v2026-05-08-pm30-habits-a` → `vyve-cache-v2026-05-09-pm31-workouts-a`. Whole-tree audit at HEAD pre-commit per §23 PM-26: 73 source-text files, 1,821,887 chars; live primitive counts originally reported as (15 invalidate / 12 record / 18 evaluate); PM-32 whole-tree re-audit at the same HEAD reconciled to **(14 invalidate / 8 record / 18 evaluate)** — the original PM-31 numbers double-counted `typeof X === 'function'` guard lines as call sites alongside the actual invocation immediately following on the next line. Evaluate count was correct because the evaluate sites are guarded by `if (window.VYVEAchievements)` (a property check, not a `typeof === 'function'` line), so its audit pattern matched only call sites. PM-32 codifies the audit discipline as a §23 sub-rule under PM-26. Post-commit verification: blob_sha + head-100 + char-count match across all 4 files via `GITHUB_GET_REPOSITORY_CONTENT` (live SHA, not raw). Sequence after PM-31: PM-32 → 1c-3 (`saveExerciseLog` → `bus.publish('set:logged', ...)`).

**08 May 2026 PM-22 — `leaderboard` v17: SQL-side ranking via `get_leaderboard()` RPC.** Reframed from the original backlog scoping. The pre-flight against the live source surfaced that v11/v16 was already reading from `member_home_state` (not aggregating live activity tables — that work was done when the aggregate was built). The actual cliff was different: v11 pulled ALL rows from `member_home_state` + `members` + `employer_members`, sorted four times in JS (one per metric), sliced top-100 in JS, then JSON-serialised. At 100K members that's ~50MB over the wire and four ~100K-element array sorts per request. PM-22 became "push the sort + slice into Postgres," not "build a snapshot table" — the cron + denormalised snapshot the backlog item described would have added 24h staleness for no real benefit over a window-function rewrite. Migration `pm22_create_get_leaderboard_rpc` adds `public.get_leaderboard(text, text, text) RETURNS jsonb` — `STABLE`, `SECURITY DEFINER`, single CTE chain that scopes via `employer_members` join, applies the `all_time` 7-day tenure filter, computes `display_name` server-side from `display_name_preference`, builds four parallel `ROW_NUMBER()` orderings (one per metric: all/habits/workouts/streak), then assembles the v11-shape response via `jsonb_build_object`. EF v17 is a 110-line wrapper: parse params, JWT-validate (with `?email=` back-compat), call RPC, return. Platform v17, ezbr `ee55c3fe…`. Functional parity verified live: top-level keys, all 8 of them per metric, ranked-entry shape, above-entry shape — no missing fields, no extras. Edge cases verified live: caller in zero-bucket (rank against full sorted list, `caller_in_ranked:false`, `gap:0`); caller at #1 in streak (`above:[]`); `scope=company` with no employer-row (falls back to caller-only, `total_members:1`); `range=all_time` uses `overall_streak_best`. Warm-RPC timing 9ms over 5 iterations at 15-member scale; cold compile 58ms. `leaderboard` was already in the `warm-ping` keep-warm list so cold-start exposure is mitigated. No portal change.

**08 May 2026 PM-21 — perf telemetry pipeline live (`perf_telemetry` + `log-perf` v1 + `perf.js` shim).** End-to-end client→table observability for the perf project. Schema: `perf_telemetry` table created via `pm21_create_perf_telemetry` migration — bigserial PK, `member_email` / `page` / `metric_name` / `metric_value` (double) / `nav_type` / `ua_brief` / `ts`, RLS service-role-only with `(SELECT auth.role())` wrap per §23 PM-8 rule, two indexes: `idx_perf_telemetry_page_metric_ts` on `(page, metric_name, ts DESC)` for percentile rollups, `idx_perf_telemetry_ts` on `(ts DESC)` for housekeeping. EF: `log-perf` v1 deployed via native `Supabase:deploy_edge_function` (Composio router doesn't expose it), platform v1, ezbr `9df3ce50…`, `verify_jwt:false` at gateway with internal `getAuthEmail()` JWT validation per §23 custom-auth pattern, 100KB payload cap, 50 metrics per request max, CORS default-origin pattern, returns 204 on success. Curl with no auth → HTTP 401 confirmed. Client: `perf.js` shim added to vyve-site, gated `?perf=1` OR `localStorage.vyve_perf_enabled='1'` (default-off in production, opt-in via single URL visit, persists in localStorage). Captures TTFB / DOM done / load / FP / FCP / LCP / INP plus VYVE-custom `auth_rdy` (vyveAuthReady relative to fetchStart) and `paint_done` (custom 'vyvePaintDone' event). Posts on pagehide via `fetch + keepalive` (sendBeacon can't carry Authorization header). 12s fallback flush. Wired only on `index.html` for now — script tag added after auth.js with defer, SW cache `monthly-defer-e` → `perf-shim-f`. Other portal pages deferred until a few days of index data confirms the shim is overhead-neutral. Read pattern: `SELECT page, metric_name, percentile_cont(0.5)/(0.95) WITHIN GROUP (ORDER BY metric_value), COUNT(*) FROM perf_telemetry WHERE ts > now() - interval '1 day' GROUP BY 1,2`.

**08 May 2026 PM-20 — `monthly-checkin.html` head-script defer.** vyve-site `2bfc4478`. Lifted `nav.js` and `offline-manager.js` to `defer` on monthly-checkin.html — head-blocking parses on a low-traffic page that doesn't need them sync. `theme.js` stayed sync per the §23 PM-7 hard rule (FOUC prevention). SW cache `eager-prefetch-d` → `monthly-defer-e`. Verified live via the GitHub Contents API. The audit pass that produced this fix also surfaced the wider portal-head defer-safety problem now logged as a P2 backlog item (`vyve-offline.js` exposing `window.VYVEData` to inline consumers on 8 host pages — defer reorders execution past inline parse-time references, real lift not a sweep).

**08 May 2026 PM-19 — `log-activity` v29: write-response `home_state` payload + optimistic delta.** Source v29 / platform v34, ezbr `68d62d9c0c94dd75b2221f1cd91cc739083faf50cf224f31907a9e937cbf6762`. Every successful write path now returns the post-write `member_home_state` row in the response, plus an optimistic delta computed for the just-logged activity type. The `evaluate_only:true` short-circuit and the cap-skip path also return `home_state` so the client has a single shape to consume. No portal wiring done — the client-side opportunistic-update (skip the `member-dashboard` round trip on the next page nav, paint from the response) is a follow-up, not in scope this session. Foundation only.

**08 May 2026 PM-18 hotfix — home cache key alignment.** vyve-site `81908633`. Resolves the cache-key mismatch introduced by PM-18: the eager-prefetch fan-out wrote home cache under `vyve_home_cache_<email>`, but the home-page reader was on `vyve_home_v3_<email>`. Renamed the writer to match the reader; first-paint instant-cache path verified end-to-end after the rename.

**08 May 2026 PM-18 — eager prefetch fan-out + universal touchstart-nav prefetch.** Builds on PM-14's microtask fan-out. `auth.js` now eagerly prefetches the dashboard payload for the major portal pages on first sign-in, and adds a universal `touchstart`-triggered prefetch for any in-app nav so the destination's network requests are in-flight before the route-change paints. Pairs with the cache-paint-before-auth migration: when the prefetched payload lands before nav, the next page paints from cache zero-RTT; when it doesn't, the cache-paint-then-revalidate path on the destination still hides the latency. Net effect: most internal navigations now feel instant on warm sessions. SW cache bumped in the same commit.

**08 May 2026 PM-17 — `member-dashboard` v61: drop 4 of 5 this-week PostgREST queries.** Building on PM-13. The Promise.all gateway in `member-dashboard` was firing 5 separate `daily_habits` / `workouts` / `cardio` / `session_views` / `wellbeing_checkins` queries each scoped to `currentWeekStart`, then mapping the results into `weekly_goals.progress.*`. Pre-flight against the live schema confirmed `member_home_state` already carries the equivalent `*_this_week` columns populated by `refresh_member_home_state(p_email)` with the same week boundaries — so the four non-habits values can be served from the cached row directly. `habitsThisWeek` query stays because goal progress uses `COUNT(DISTINCT activity_date)` (Set-of-dates in JS) and the column is `COUNT(*)`. Same staleness contract as the totals already served from `member_home_state`. v61 also extends `_shared/achievements.ts` `HOME_STATE_STREAK_FIELDS` to include `workouts_total` / `cardio_total` / `checkins_total`, and routes the matching three INLINE evaluators (`workouts_logged` / `cardio_logged` / `checkins_completed`) through `homeStateFieldFromCtx()` — 3 more round trips dropped per achievements pass on top of PM-13's savings. Net: 7 fewer PostgREST round trips per dashboard load. Deployed via native Supabase MCP `deploy_edge_function` (Composio router doesn't expose it). Platform v67, ezbr `72ce2bbe…`, deno typecheck clean, 401-handler verified live. No portal commit.

**08 May 2026 PM-16 — `re-engagement-scheduler` v11: scaling fix on the dormancy lookup.** Audit was partially stale: `recompute_all_member_stats()` and `daily-report` v8 already had the right shape, so the cliff wasn't where the audit said. The actual cliff was scheduler v10 fetching all rows from `daily_habits` / `workouts` / `session_views` / `wellbeing_checkins` via 4 parallel `.in()` queries and computing `MAX(activity_date)` in JS (millions of rows at 100K members). Two migrations to fix: `pm16_add_last_at_columns_to_member_home_state` adds 5 nullable `timestamptz` cols (`last_habit_at` / `last_workout_at` / `last_cardio_at` / `last_session_at` / `last_checkin_at`) + index on `last_activity_at`, backfilled all 30+ existing rows from source tables. `pm16_extend_refresh_member_home_state_with_last_at` extends `refresh_member_home_state(p_email)` to populate the 5 new cols (per-type SELECTs, GREATEST aggregation, INSERT and ON CONFLICT branches both updated). Dean's row verified populating correctly. v11 EF replaces 4 activity-table `.in()` queries with single `.in()` against `member_home_state` for the 5 new cols; builds `homeStateMap` keyed on `member_email` and merges `last_habit` / `last_workout` / `last_session` / `last_checkin` into per-member object. All other behaviour byte-identical to v10. Platform v31, ezbr `0b58be0d…`. Network proxy blocked the test invocation at deploy time, but verified live 08 May PM-17 via curl: HTTP 200, version: 11, processed 15 members, 0 errors, A/B classification via the new `last_*_at` shape working. Audit-vs-code drift earned a new §23 hard rule.

**08 May 2026 PM-15 — paint-timing audit across 10 candidate gated portal pages, one fix.** The PM-12 promote-to-medium-priority backlog item: scan every portal page that ships cache-paint code for the same anti-pattern PM-12 fixed on engagement/habits (cache-read inside a function gated on `vyveAuthReady`). Audit covered exercise.html / certificates.html / settings.html / nutrition.html / sessions.html / leaderboard.html / log-food.html / wellbeing-checkin.html / running-plan.html / workouts.html. Eight already correct: exercise/certificates/settings/nutrition all have a `paintCacheEarly()` IIFE at the top; sessions/leaderboard already paint correctly; log-food/wellbeing-checkin/running-plan are AI/network-honest by design (no cache to paint from). Workouts.html was the single fix: added a synchronous `paintProgrammeFromCache()` IIFE at the top of `workouts-programme.js` that reads `vyve_auth` → email, reads `vyve_programme_cache_<email>`, sets module-scope `let` vars (`memberEmail` / `cacheRow` / `programmeData` declared in `workouts-config.js`, accessible across classic-script scope), calls `renderProgramme()` (hoisted function declaration). Boot path's `loadProgramme()` still runs on auth and refreshes from network. SW cache `microtask-workouts-b` → `paint-programme-c`. vyve-site `7e5ab3f1`. Verified live.

**08 May 2026 PM-14 — index.html prefetch fan-out lifted from idle to microtask.** PM-13 fixed habits prefetch (block #3) but block #2 (workouts/exercise) was still idle-gated. Lifted to `Promise.resolve().then()` microtask. Block #1 (nutrition) stays idle-gated — heavier, member taps it less often immediately after home. SW cache `precache-engagement-workouts-a` → `microtask-workouts-b`. vyve-site `3719e305`. Verified live.

**08 May 2026 PM-13 — SW precache engagement+workouts; habits prefetch out of idle.** Reopened the cache-paint perf project after Lewis flagged habits and engagement still feeling slow post-PM-12. Two concrete gaps caught: (a) `engagement.html` and `workouts.html` were not in the SW `urlsToCache` precache list so first-navigation HTML arrival was network-bound even with PM-7's SWR live, (b) the habits prefetch in `_vyvePrefetchNextTabs` was wrapped in `requestIdleCallback` (~1.5s delay) so members tapping habits immediately after home paint hit an empty cache. Fix: added engagement.html + workouts.html to precache list, lifted habits prefetch to microtask (`Promise.resolve().then`). Members + programme prefetches stay idle-gated — heavier, less critical. Site `186b432944`. Cache key `vyve-cache-v2026-05-08-precache-engagement-workouts-a`.

**08 May 2026 PM-12 — Cache-paint-before-auth pattern extended to engagement.html and habits.html + habits cache prefetch from index.** vyve-site `3fcd9169`. Lewis reported both pages slow post-PM-11. Diagnosis: PM-3/4/5 set up the cache-paint pattern only on `index.html`. engagement.html and habits.html ship the same cache logic but gate it behind a `vyveAuthReady` event listener — meaning the paint waits for the deferred auth.js chain (theme.js + auth.js + achievements.js + offline-manager.js) to fully execute before the cache check even runs, even when the cache is fully populated. The PM-3 hard rule "cache paint runs before auth, not inside `onAuthReady`" was authored as a general principle but was only enforced on index.html — the audit didn't catch the drift on engagement / habits because they have cache-PAINT code, just in the wrong place. Fix: each page now (a) discovers email synchronously from its own cache, (b) paints from cache without waiting for auth, (c) awaits auth via a new `_vyveWaitAuth()` helper before the network refresh fetch. Wiring at the bottom of each script changed from `if (vyveCurrentUser) loadPage(); else addEventListener(vyveAuthReady, loadPage)` to immediate `loadPage()` call. The helper handles the timing edge case where `window.VYVE_AUTH_READY` Promise hasn't been created yet because auth.js is deferred and executes after the inline script reaches its wiring — listens for the `vyveAuthReady` event AND polls for the Promise appearing late, with a 5s safety-net timeout. The `_renderedFromCache` flag in engagement also now gates the login redirect — if we painted from cache and the network refresh fails to get a JWT, we don't yank the user to `/login.html` on top of valid cached data. Plus index.html `_vyvePrefetchNextTabs` (PM-9) extended with a third idle-time fetch wave that warms `vyve_habits_cache_v2` — pulls `member_habits` (with library JOIN) + today's `daily_habits` in parallel, writes the composite cache shape habits.html expects. Engagement cache was already fanned out from the `member-dashboard` payload in index since PM-2 06 May, so no prefetch change needed there — the bug was purely paint-timing. SW cache key `theme-throttle-8` → `paint-engagement-habits-9`. node-check on every inline JS block in all 3 HTMLs + sw.js: clean. Post-commit Contents API verification on all 4 files: byte-match.

**08 May 2026 PM-11 — P0-1 charity counter incremental rewrite + P2-1 theme.js fetch throttle (both shipped, both verified).** Two of the audit's ship-now items closed in one session.

P0-1 — `get_charity_total()` rewrite. Migration `p0_1_charity_total_incremental_counter` shipped: new `platform_counters` table (PK `counter_key`, single row keyed `'charity_total'`, RLS service-role-only); 6 charity-specific trigger functions (`charity_count_*`) attached AFTER INSERT OR DELETE on `daily_habits / workouts / cardio / session_views / replay_views / wellbeing_checkins` — first cap-eligible row per (member, day-or-week) bumps +1, last cap-eligible row removed bumps -1, cap math mirrors the legacy `get_charity_total()` UNION (1/day for habits + checkins-per-week, 2/day for workouts/cardio/sessions/replays); central `bump_charity_total(p_delta)` SECURITY DEFINER helper for the increment write; backfilled to **444** (matches legacy fn output exactly); legacy `get_charity_total()` body replaced with O(1) `SELECT counter_value FROM platform_counters WHERE counter_key = 'charity_total'`. **EXPLAIN ANALYZE: 127.5ms → 0.93ms (137× faster), Buffers shared hit=1382 → 180. Stays flat regardless of platform scale.** Stress test in same session: cap=1 (habits) and cap=2 (workouts via healthkit-source bypass to test 3-rows-in-cap-band path) both pass — insert-bump, insert-no-bump, delete-no-bump, delete-bump transitions all correct, counter perfectly restored to 444 after stress. Self-healing reconciliation cron `vyve_charity_reconcile_daily` (jobid 23, 02:30 UTC, between recompute_company_summary 02:00 and platform_metrics 02:15) added: `charity_total_reconcile_and_heal()` recomputes via the legacy 6-table UNION, compares to cached, on drift it heals (UPDATE counter to recomputed truth) AND writes a `platform_alerts` row of type `charity_counter_drift` so any divergence surfaces visibly within 24h. `charity_total_reconcile()` (read-only variant) kept for ad-hoc inspection. Layered alongside the existing `increment_*_counter` triggers (which feed per-member `members.cert_*_count`, separate concern); the two trigger families share the cap math but write to different surfaces — important to note for any future work that touches either. Note: `replay_views` had no `counter_replays` trigger pre-migration (was contributing to charity_total via the legacy scan, but cert counters didn't track it) — new pipeline includes replay_views explicitly.

P2-1 — `theme.js` fetch throttle. vyve-site `7ff486f4`. The 5247 calls to `members.theme_preference` in pg_stat_statements were because `theme.js` ran a Supabase fetch on every page load regardless of whether localStorage already had the value. Patch: 1h TTL gate via `vyve_theme_synced_at` localStorage stamp. Skip the fetch entirely if stamp is fresh. Stamp updated on every successful response (even null/empty rows). `vyveSetTheme()` refreshes the stamp when it writes through to Supabase, so the next page load sees a fresh stamp and skips the read. Cross-device divergence is rare in practice (vyveSetTheme writes through to both surfaces synchronously) and a 1h propagation delay on the rare divergent case is acceptable. Two patches one file, sw.js cache key bumped `prefetch-exercise-7` → `theme-throttle-8`. Both files node --check clean. Post-commit Contents-API verification: theme.js 5427 bytes, sw.js 6164 bytes, both match.

Net: drops one round-trip from every page load + drops the platform's #1 query from 127ms to 0.93ms. **Audit's two ship-now items both closed.** Pre-launch items (P0-2, P1-1, P1-2) remain queued.

**08 May 2026 PM-10 — Full-platform perf audit · static evidence pass · no code shipped.** End-to-end audit post-PM-9 covering portal pages, EFs, Postgres tables/indexes/RLS, SW behaviour, and cron pipeline. Three independent angles: pg_stat_statements ranked by total time, pg_stat_user_tables row counts + idx-vs-seqscan ratios, EXPLAIN ANALYZE on hot-path queries. Source read of member-dashboard v59, _shared/achievements.ts, leaderboard v11, theme.js, sw.js, index.html prefetch IIFE. Telemetry shim deferred — static evidence sufficient for a concrete fix list. Output: `/playbooks/perf-audit-2026-05-08.md` (25K chars) with EXPLAIN ANALYZE evidence, fix shapes, tier per finding. Headlines: (P0-1, ship-now) `get_charity_total()` is the #1 query in pg_stat_statements (577s total, 190ms mean, 3037 calls) — 6-table UNION ALL scan, fix is incremental `platform_counters` table; (P0-2, pre-launch) `recompute_all_member_stats()` LEFT JOIN cartesian explosion produces 4.9M intermediate rows for a 15-row result, 2.3s at 15 members, unworkable at 1K+; (P1-1) member-dashboard still parallel-queries source tables instead of reading the dormant `*_this_week` state columns, plus achievements inflight loop fires 23 `count(*)` calls serially; (P1-2) leaderboard reads all members+home_state+employer rows unbounded per call, 50MB+ at 100K; (P2-1, ship-now) theme.js fetches Supabase on every page load instead of once per session; (P2-2, at-scale) `refresh_member_home_state` 207ms synchronous trigger across 10 source tables. Confirmed PM-8 RLS wrap intact across all 72 policies (zero drift). Cache-paint project genuinely closed perceived-perf at current scale; audit's main contribution is the at-scale projection.

**08 May 2026 PM-9 — Extend index prefetch to populate exercise cache.** Tiny follow-up to PM-5 + PM-8. PM-5 prefetched `vyve_members_cache_<email>` (nutrition) and `vyve_programme_cache_<email>` (workouts) from index.html on idle, but missed `vyve_exercise_cache_v2` (exercise.html's primary cache key, different shape from programme cache). vyve-site `a2c99e46`: same `workout_plan_cache` fetch now writes both keys (`{row, data}` for programme + `{data, ts, email}` for exercise). One fetch, two cache writes. sw.js cache key bumped to `vyve-cache-v2026-05-08-theme-throttle-8`. Nutrition already covered by PM-5 via members cache. `vyve_weight_logs_v1` is migration-only legacy storage with a different shape from the `weight_logs` table — left alone. After this, exercise should paint from warm cache on any visit that follows a home visit; the only cold-tap path remaining is "tap Exercise as the very first action of a session without going through home" — to be closed by the universal touchstart-on-nav prefetch (backlog'd PM-7).

**08 May 2026 PM-8 — RLS auth-function wrap migration (the actual perf bottleneck).** Lewis hit ~10s on exercise + nutrition tabs minutes after PM-7 brain commit. SW SWR alone can't account for 10s — that's REST query latency. Diagnostic: `workout_plan_cache` query timed at 30000ms cold, 1500-3200ms warm via anon-key REST (which returns 0 rows under RLS — the latency was pure planner overhead). EXPLAIN ANALYZE under an authenticated JWT showed Planning Time 327.9ms, Execution 19ms, plan = Seq Scan with `One-Time Filter` containing inlined `auth.email()` evaluation. Audit of `pg_policies`: 71 policies across ~50 tables all using bare `auth.email()` / `auth.uid()` / `auth.role()` instead of the wrapped `(SELECT auth.X())` pattern that Supabase docs flag as the #1 RLS perf optimisation. Unwrapped pattern forces per-row function eval + planner-time inlining. We had been bleeding ~300ms per query for the entire platform history. Migration shipped (`wrap_auth_functions_in_rls_policies`): 72 policies rewritten with `(SELECT auth.X())` wrap, 2 redundant `members` policies dropped (`members_select_own`/`members_update_own` covered by `members_own_data` ALL). Mechanical generation via regex `auth\.(email|uid|jwt|role)\s*\(\s*\)` → `(SELECT auth.\1())`, applied as one atomic migration. Post-migration EXPLAIN: Planning 11.6ms (28× faster), Execution 1.1ms (17× faster), plan now uses InitPlan caching the auth result for the whole query. REST round trip from remote workbench (150ms baseline RTT) dropped from 1500-30000ms to 307-888ms avg 543ms. Local-device numbers should be 50-200ms. New §23 hard rule codified for the wrap pattern. Audit gap: the security audit (commits 1-4) was scoped at "is RLS correct", didn't include the perf-linter rule. Will need a separate perf-focused audit pass on RLS going forward.

**08 May 2026 PM-7 — SW HTML stale-while-revalidate (cache-paint perf project actually closed).** Member feedback minutes after PM-6 brain commit landed: exercise tab took ~3s to load on a fresh app open. Auth.js defer alone can't account for 3s. Diagnosed as the SW's `network-first` HTML strategy — every page open waits a full network round trip on the HTML doc itself before any of the cache-paint IIFE / Promise / defer wins can engage. The whole project had been quietly optimising everything *downstream* of HTML arrival while leaving HTML arrival itself blocking on the network. Two commits, vyve-site `3a20fcda` (functional) + `e72f672b` (cleanup of two stale comment headers I missed on the first pass). sw.js HTML branch reworked: cached HTML returns instantly via `caches.match()` (~5ms read), background fetch runs in parallel and populates cache for the NEXT navigation, first-ever-visit falls through to network as before, offline + no cache still falls back to `/index.html`. Cache key bumped `vyve-cache-v2026-05-08-auth-defer-5` → `vyve-cache-v2026-05-08-swr-html-6`. Strategy block + section banner + inline comment all updated. Members are at most ONE navigation behind latest HTML — same freshness guarantee as before because the cache-version bump on every deploy forces cache rebuild. Diagnostic walk also surfaced a separate inconsistency: 29 pages have `nav.js` / `offline-manager.js` / `vyve-offline.js` / `tracking.js` non-deferred where most other pages defer them. theme.js is correctly NOT deferred (sets `data-theme` synchronously to prevent FOUC). Backlog'd as a sweep, not blocking on this fix. New §23 hard rule codified below: SW HTML caching strategy and the network-first vs SWR trade-off.

**08 May 2026 PM-6 — auth.js defer + window.VYVE_AUTH_READY Promise (Session 5 of perf project shipped).** Final session of the cache-paint perf project. PM-5 reframed Session 5 in backlog from "1-2h" to "P1 ~half-day, full portal touch" based on a quick read of consumer refs across 14 pages. Pre-flight expanded scope to actual surface (23 in-scope HTML pages + 18 deferred consumer JS modules) and audited every reference with a depth-tracking walker, then walked back the reframe. The codebase had been built defensively against this exact change for months — every consumer pattern (two-path `if/else` with `vyveAuthReady` listener, `waitForAuth`/`tryLoad` polling, function-body refs) was already defer-safe. Of 23 in-scope pages, 18 had zero top-level refs. The other 5 had top-level matches but on inspection were either the canonical two-path pattern (4 pages) or false positives from the walker's template-literal brace-tracking bug (leaderboard's 3 refs all inside function bodies). Of 18 consumer JS modules, only `workouts-config.js` had a top-level ref and its comment literally anticipated this change. Zero per-page migration was needed. Single atomic commit `b089eba3`: auth.js (+970 chars — `window.VYVE_AUTH_READY` Promise + idempotent `vyveSignalAuthReady(user)` helper that fires the event AND resolves the Promise atomically), sw.js (cache key `vyve-cache-v2026-05-08-prefetch-4` → `vyve-cache-v2026-05-08-auth-defer-5`), 35 portal pages get `defer` on the auth.js script tag (4 pages already had defer and were left alone). Verification: `node --check` on auth.js + sw.js, inline-script syntax check on 4 most-JS-heavy pages (15 inline blocks, all clean), pre-commit SHA refresh on all 37 paths, post-commit byte-for-byte verification via Contents API (37/37 match). Win is estimated 150-300ms first paint cold-start by unblocking head preload hints from auth.js parse stall — actual numbers come back tomorrow. New §23 hard rule codified below: defer-safety pre-flight pattern.

**08 May 2026 PM-2 — Exercise name canonicalisation system shipped + Stu Watts cross-day history fix.** Member feedback (Lewis relayed): Stu completed Push A → Push B with same exercise, second session didn't show his previous-session data. Diagnosed as data drift: April 10 logs written under old naming convention (`Barbell Bench Press`, `Cable Lateral Raise`, `Seated Dumbbell Shoulder Press`), current programme uses new convention introduced 19 April Exercise Hub. History join key in `buildExerciseCard()` is exact-string `exerciseHistory[ex.exercise_name]` — orphaned the moment the library renamed. Cohort blast radius: 28 true orphan rows on Stu, 0 on anyone else (other "missing from cache" names were legitimately retired library entries, not drift). Built permanent normaliser system rather than one-shot patch. Two new tables (`exercise_canonical_names` 6 alias rules seeded, `exercise_name_misses` audit surface), 1 view (`exercise_canonical_set`), 4 PL/pgSQL functions, **9 triggers across 7 tables**: `exercise_logs.exercise_name`, `exercise_notes.exercise_name`, `exercise_swaps.original_exercise` + `.replacement_exercise`, `custom_workouts.exercises` (recursive JSONB walker), `shared_workouts.session_data` + `.full_programme_json` (JSONB), `workout_plan_cache.programme_json` (JSONB), `workout_plans.exercise_name`. Every write at every surface goes through canonicalisation; unmatched names log to `exercise_name_misses` with member_email + observed_at, never block the underlying write (BEGIN/EXCEPTION/NULL pattern). Mid-session correction: walker initially logged ALL non-alias names as misses including canonical ones (5,000+ bogus rows); fixed by adding canonical-set check before miss log, truncated bogus misses, re-ran. Final result: 0 orphan rows in `exercise_logs` across the whole DB, 22 distinct miss names surfaced (Alan Bird's beginner bodyweight programme — 18 names — and Callum Budzinski's library-variant choices — 4 names). These misses are library gaps, not drift; right action is library expansion, deferred to content session. Stu's specific feedback: 28 April-10 rows rewritten to canonical, his next Push session will cross-link properly. Zero EF redeploys, zero portal changes, zero SW bumps — entirely server-side. New §23 hard rule codified: exercise library renames must be paired with exercise_logs rename migration; the canonical normaliser is now the protection layer but library-rename → log-rename pairing remains the discipline. **Items 4-6 of backup/DR session 2 still parked.**

**08 May 2026 PM-1 — Brain hygiene + cleanup pass.** Ahead of backup/DR session 2, ran the cleanup track: dropped duplicate cron `process-scheduled-pushes-every-5min` (jobid 19, same `*/5 * * * *` schedule as canonical jobid 18 but missing the service-role `Authorization` header — would have been a 401-loop if it ever fired against a JWT-required EF). Deleted the two scratch EFs left over from PM-5 architecture pivot (`vyve-ef-source-backup` v3 and `vyve-mgmt-api-probe` v2, no cron pointing at either, both inert) — Composio still has no delete-EF tool, so deletion via Supabase dashboard. EF count dropped 95 → 93. Cron jobs went 20 → 19 after dedupe. §7 cron table refreshed to reflect all 19 live jobs (master had been carrying 17, missing `vyve-gdpr-export-tick` and `vyve-gdpr-erase-daily`). Storage state reconciled in passing: 5 buckets (`certificates`, `exercise-thumbnails`, `exercise-videos`, `cc-documents`, `gdpr-exports`) with 267 objects across 4 of them (cc-documents empty), `exercise-videos` carries 124 objects @ 418MB which is the irreplaceable footprint for Item 4 (storage rclone backup). Drift caught for §22 risk register: jobids 21 + 22 hardcode a static bearer PSK in the `cron.job.command` body, viewable to anyone with cron-table read access — backlog rotation, not urgent. (EF count subsequently rose to 96 in same-day PM-21 / PM-22 sessions as `log-perf` v1 and the `get_leaderboard` RPC artefacts shipped — the 93 figure here was correct as of mid-day PM-1.)

**07 May 2026 PM-5 — EF source backup shipped via GitHub Actions (Item 3 closed).** Pivoted from the original Supabase EF approach in PM-4 spec after three architecture walls in sequence: (a) Supabase rejects secret names with `SUPABASE_` prefix, (b) Management API `/body` returns ESZIP2.3 binary not JSON, (c) `deno.land/x/eszip` WASM parser can't load inside Supabase Edge runtime (BOOT_ERROR). GitHub Actions runner uses `supabase functions download` CLI which handles ESZIP decoding internally. Workflow at `VYVEBrain/.github/workflows/backup-edge-functions.yml`, schedule `0 2 * * 0` Sundays 02:00 UTC + `workflow_dispatch`. Script at `VYVEBrain/scripts/backup-edge-functions.sh`. First snapshot landed `2026-05-07T13:48:28Z` — 62/62 EFs succeeded, 0 failed, MANIFEST.json + 62 source folders at `VYVEBrain/staging/edge-functions/`. Failure detection moved off email-watchdog (jobid 16 reads `cron.job_run_details`, runner no longer in Supabase) onto GitHub's native Actions failure email. Disaster-recovery playbook scaffolded at `playbooks/disaster-recovery.md` with EF rollback procedure (§1) live; sections 2-5 (Capacitor SSD, project deletion, APNs rotation, storage bucket loss) deferred to backup session 2. Four new §23 hard rules codified (full text below).

**07 May 2026 PM-2 — Security commit 2 (CSP meta tag + render-time XSS sanitiser, plus 5-policy hygiene roll).** Member-facing portal-side commit, 46 files touched twice (cdd04999 then d336db0b fix-1 in same session after incognito test on `mindfulness-live.html` surfaced 3 v1 violations: PostHog dynamic script load, Supabase Realtime `wss://`, `frame-ancestors`-via-meta browser warning). Final CSP is pragmatic-with-`'unsafe-inline'` on script-src and style-src — going strict would have broken 83 inline `<script>` blocks across 44 files plus 24 inline event handlers. CSP delivers `default-src 'self'`, locked `connect-src` (Supabase HTTPS+WSS, Brevo, Open Food Facts, googleapis, PostHog), locked `frame-src` (YouTube only), `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`. XSS sanitiser narrowed mid-session — original brief targets (workouts.html / exercise.html) had no live XSS surface. Real targets: `shared-workout.html` cross-member XSS via `${ex.exercise_name}` and `${ex.thumbnail_url}` in `custom_workouts.exercises[]` jsonb, `index.html` and `wellbeing-checkin.html` self-XSS via `${firstName}` interpolations. Inline `escapeHTML` + `safeURL` helpers added to those three files; pattern matched the existing escapeHTML helper in `leaderboard.html`. SW cache bumped twice: `vyve-cache-v2026-05-07a-csp` then `vyve-cache-v2026-05-07b-csp-fix1`. Incognito test on v2 came back clean (only a `favicon.ico 404`, pre-existing). Hygiene rolled in: schema migration re-roled 5 cosmetic `{public}` INSERT policies to `{authenticated}` on habit_library, monthly_checkins, scheduled_pushes, session_chat, shared_workouts — all had `WITH CHECK (auth.email() = …)` quals already, re-rolling for procurement-reviewer optics. Audit pipeline from commits 1+1B confirmed live by dry-run invocation of `re-engagement-scheduler` — 2 fresh `re_engagement` rows landed in `ai_interactions` at 2026-05-07 01:33Z. Mockups for commits 3+4 (gdpr-export, gdpr-erase) also landed this session at VYVEBrain `de44e237`, awaiting Dean sign-off before EF builds. Three new §23 hard rules added (CSP incognito test mandatory, CSP pre-flight must include dynamic JS-built fetches, `wss://` distinct from `https://` in connect-src). Brain commit deferred until after incognito-clean confirmation, then landed. **Sign-off pass 07 May PM-3:** both GDPR mockups iterated through Dean review and signed off in same evening. Commit 3 mockup updated v1 (sync-with-URL) → v2 (async-with-email Strava/Notion pattern) → v2.1 (dropped optional gdpr-export-download EF) and signed off — all 5 decisions confirmed. Commit 4 mockup updated v1 → v2 (added typed-email destructive-action confirmation gate per Dean's "people might click delete by mistake" concern) → v2.1 (sign-off) — all 6 decisions confirmed including Stripe Customer DELETE, `session_replication_role = replica` trigger management, plain-HTML token-link cancel page, and rolling Brevo+PostHog third-party purge into the execute path. Both commits unblocked for next session; estimated 6h each, ~12h combined.

**Security commit 3 SHIPPED 07 May 2026 PM-3** (vyve-site `952c4275`, Supabase migrations + 2 EFs + cron). Member-facing async-with-email GDPR Article 15 export pipeline live end-to-end. Build details:

- Schema: `gdpr_export_requests` table (15 cols, 2 indexes, RLS service-role-only, lc_email trigger) + `gdpr_export_pick_due()` SQL function (FOR UPDATE SKIP LOCKED, attempt cap 3, 10-min re-queue window). Storage bucket `gdpr-exports` (50MB JSON-only, service-role-write-only).
- EFs: `gdpr-export-request` v1 (member-facing, queues request, 1/30d rate limit member-self, unlimited admin path, 409 on already-pending) + `gdpr-export-execute` v1 (cron-driven, walks 45 tables, sanitises auth.users to 8-key whitelist, uploads to Storage, 7d signed URL, Brevo email with VYVE-branded HTML, audit log receipt, 3-attempt retry).
- Cron: `vyve-gdpr-export-tick` jobid 21, `*/15 * * * *`, 90s timeout, bearer-less call matching half-dozen other cron-only EFs.
- Frontend: `settings.html` "Privacy & Data" section between About and Account actions, "Download my data" → modal → fetch with existing getJWT()/SUPA_KEY helpers. "Delete my account" placeholder shown disabled. SW cache bumped to `vyve-cache-v2026-05-07c-gdpr-export`.
- End-to-end test passed against deanonbrown@hotmail.com: 4MB JSON across 45 tables, 27s latency, real Brevo email with working 7-day signed URL, admin_audit_log row with full metadata.
- Lewis copy approval still required on the Brevo email template before broader rollout — iterating copy is a single EF redeploy. Discussed: HTML companion file in bucket deferred (raw JSON is GDPR-compliant and matches Strava/Notion); option 1 adopted (tighten email copy to telegraph "structured data file" expectation when Lewis reviews).

Commit 4 (gdpr-erase) shipped same evening (07 May PM-3 cont.) — 4 EFs (`gdpr-erase-request`, `gdpr-erase-cancel`, `gdpr-erase-execute`, `gdpr-erase-status`) all ACTIVE, plus `vyve-gdpr-erase-daily` cron jobid 22 on `0 3 * * *`. Brain mockup signed off `763ee48a`. The §19 entry capturing this was missed at the time and is recorded here retrospectively (08 May PM-1).

**07 May 2026 PM — Security commit 1B (CORS hardening + payload caps + `ai_interactions` audit logging across 4 EFs).** Hygiene completion of the security pass. Four EF redeploys: `log-activity` v28 (platform v31, ezbr `f88f98f6…`), `wellbeing-checkin` v28 (platform v41, ezbr `bbce9c4b…`), `anthropic-proxy` v16 (platform v21, ezbr `207d9b03…`), `re-engagement-scheduler` v10 (platform v28, ezbr `05e1c305…`). One schema migration: `ai_interactions_triggered_by_check` expanded with `re_engagement`. Audit trail extended from onboarding-only (21 rows) to four AI surfaces. Mid-commit catch: original literals (`'wellbeing-checkin'`, `'anthropic-proxy:running-plan'`, `'re-engagement:<key>'`) failed the existing CHECK; corrected to `'weekly_checkin'`/`'running_plan'`/`'re_engagement'` and constraint expanded once. New §23 hard rule: CHECK constraint pre-flight before adding any new triggered_by-style value. Brain commit landed same session.

**07 May 2026 — Security commit 1 (`running_plan_cache` RLS lockdown + `member-dashboard` v59 CORS hardening).** First of a multi-session pass against the 06 May audit. Anon-readable wildcard CORS removed from `member-dashboard` (now defaults to `https://online.vyvehealth.co.uk` for any unrecognised Origin); three open-to-`public` RLS policies on `running_plan_cache` replaced with `authenticated`-only. Audit's framing of the cache as member-scoped corrected — it's a shared parametric cache, no `member_email` column. EF v59 = platform v63, ezbr `57f1ceaad2cf76bc5de282719a9c4262c5abe985188e4b94bab7a92e23a697bb`. Five other audit findings deferred to commits 1B (CORS+ai_interactions+payload-cap on remaining EFs), 2 (CSP+XSS), and 3-4 (GDPR export + erasure EFs, mockup-first). Brain commit landed same session.

**06 May 2026 PM-2 — Home dashboard correctness fix + Layer A pre-staging.** Started as a query-reduction pass on `member-dashboard` v57 (~22 parallel PostgREST queries on the hot path), pivoted mid-session when pre-flight surfaced two corrections that were more important than the original scope. Pivot 1: brain §6 said `member_home_state` was "populated via triggers" but didn't name the writer; the actual writer is `refresh_member_home_state(p_email)` (trigger-fired, synchronous, same-write-fresh) — separate from `recompute_all_member_stats()` which writes `member_stats` on a 15-min cron. The original plan to extend the cron function for this-week counters was wrong-target; extended `refresh_member_home_state` instead. Pivot 2: while reading the v57 source in detail, spotted that `goalsPayload.progress.habits` was raw row count of `daily_habits` rows for the week, so a member ticking 3 separate habit cards on the same Monday read as 3/3 against the "Log 3 daily habits" target — semantically wrong (the target means 3 days of engagement, not 3 individual ticks). Shipped split into two layers in one session: **schema** (5 new int columns on `member_home_state`: `habits_this_week`, `workouts_this_week`, `cardio_this_week`, `sessions_this_week`, `checkins_this_week` — all `NOT NULL DEFAULT 0`; `refresh_member_home_state(p_email)` extended to populate them mirroring the existing `*_this_month` block; full cohort backfilled, all 15 active home_state rows verified matching live source-table counts) and **EF v58** (platform v62, ezbr `61e04441…`) which reads `daily_habits.activity_date` for the week, dedupes via `Set`, and emits `progress.habits` as distinct-day count. Other 4 `progress.*` counters unchanged (row count is correct for those — caps prevent same-day spam, and one workout on each of two days is legitimately two). The `*_this_week` columns are live, fresh, and currently dormant on the hot path — staged for a future EF rev to swap the 4 remaining `*_this_week` PostgREST queries for `state.*_this_week` reads. Habits will need a separate `habits_distinct_days_this_week` column at that point because the current `habits_this_week` is row count not distinct-day count. Net member-visible win: habits goal stops over-counting same-day ticks. Net hot-path query reduction: 0 (deferred). Layer B (`achievements_inflight` jsonb on `member_home_state`) and Layer C (`activity_log` from `member_activity_daily`) parked in backlog.

**06 May 2026 PM — Recurring weekly goals on home dashboard (vyve-site `9152599a`).** Closed the front-end half of a backend that had been silently shipped earlier and never documented in the brain. `index.html` GOALS render rewritten to read the new `weekly_goals` shape (`targets.{habits,exercise,sessions,checkin}_target` + `progress.{habits,exercise,sessions,checkin}` with exercise = workouts+cardio combined). 4-row template: 3 habits / 3 exercise sessions / 2 live sessions / 1 weekly check-in, recurring via the already-active `seed-weekly-goals` EF + `vyve-seed-weekly-goals` cron (`1 0 * * 1`). The strip had been silently dead in production for any member past week-1 because the renderer was on the legacy `workouts_target`/`cardio_target` shape but the columns are zeroed by the new seed template. "Coming Up This Week" block removed from `index.html` entirely (was hardcoded March dates, never dynamic). Net delete 918 bytes. SW `v2026-05-06a-workout-resume` → `v2026-05-06b-weekly-goals-recurring`. Side-discovery: brain master.md was significantly out of sync with live Supabase state for `weekly_goals` columns + EF + cron — separate audit item raised on `schema-snapshot-refresh` cron health.

**06 May 2026 — workouts.html session resume fixed (vyve-site `46006af1`).** Member feedback (WhatsApp 18:28): "Did 2 of the 5 exercises without issue, on the 3rd during a rest period was on another page and when went back to it, its lost the workout and made me redo it all over again." Diagnosis: the persistence layer in `workouts-session.js` was complete and correct (`vyve_active_session` localStorage blob, `saveSessionState()` on every set log, `clearSessionState()` on close + complete, 4-hour staleness TTL, full DOM-state capture inc. kg/reps/ticked/bw/note + timer offset). The bug was in `workouts-config.js`: `async function init()` was declared but never invoked anywhere on the page — there was no `DOMContentLoaded` handler, no IIFE, no trailing call. The only thing wiring `loadProgramme()` was a stray `addEventListener('vyveAuthReady', …)` that had been textually hoisted into the middle of `init`'s body during a prior edit, and that listener didn't call `restoreSessionState()`. So set logs persisted to `exercise_logs`, the resume blob persisted to localStorage, but on every page reload the resume path was dead — the member came back to a fresh "Start" button. Fixed by replacing the orphan `init()` with `vyveBootWorkouts(user)`, called via two-path wiring: if `window.vyveCurrentUser` is already populated when this defer-script parses (likely, since `auth.js` is non-deferred and the fast-path can dispatch `vyveAuthReady` synchronously before the listener attaches) → boot on next tick; otherwise listen for the event. Idempotent via `_vyveBootRan` guard. Promise.all wrapped in try/catch so a single data-load failure (e.g. exercise notes timing out) doesn't block restoreSessionState — an active session takes priority over the data load. Existing two-week+ stale `vyve_active_session` blobs in member browsers will self-clear on first restore attempt via the existing 4-hour TTL. SW cache `v2026-05-04s-kb-pure-css` → `v2026-05-06a-workout-resume`.

**04 May 2026 PM-15 — Movement page distance support + walks routed to cardio + PM-13b wiring closed.** Member feedback: the movement page quick-log accepted six types (walk/stretch/yoga/mobility/pilates/other) and only logged duration — no distance, even though walks are the most natural thing to log a distance for. Plus, every type was being written to the `workouts` table, miscategorising walks as workouts (cost: walks didn't credit cardio progress, "The Relentless" certificate, or activity-score variety). Plus, neither `markDone` (programme path) nor `logMovement` (quick-log path) had PM-13b breadcrumb wiring, so home overlay was blind to movement-page logs until the EF round-tripped. Fixed all three in one commit. Quick-log now branches: Walk → POST `/cardio` with `cardio_type='walking'` + new optional `distance_km` field that only renders when Walk is the active pill; everything else → POST `/workouts` unchanged. Both success paths now call `invalidateHomeCache` + `recordRecentActivity` with the right `kind` (`'cardio'` for walks, `'workout'` otherwise). `vyve-offline.js` script tag added to head — was missing entirely on this page, so VYVEData was undefined regardless of any wiring. SW `v2026-05-04k-home-optimistic` → `v2026-05-04l-movement-distance`. vyve-site commit `91eff384`. Walks now correctly land in cardio, distances are captured, home dashboard reflects movement-page logs immediately on next visit. No EF changes, no migrations, no schema changes.

**04 May 2026 PM-14 — Monthly check-in EF column drift fix.** Member feedback: monthly-checkin "didn't work, just jumping back to question and not running the API". Diagnosis: `monthly-checkin` v17 queried `nutrition_logs.log_date` and `.calories`, but those columns were renamed to `activity_date` and `calories_kcal` during the PM-12 nutrition rework. Postgres returned 42703 (column does not exist) inside the EF's Promise.all, killing the entire POST handler with a 500. Page's catch handler hides the AI-loading state, restores step-9, and alerts "Something went wrong" — exactly the symptom reported. Zero successful monthly check-ins in the entire DB confirmed the impact: every member who has ever tried failed silently. Fix: deploy v18 with `activity_date`/`calories_kcal` substituted in the WHERE filter, SELECT, type signature, and `buildNutritionSummary` field reads. No client-side change. Tested live with realistic payload — 200 OK in 13.6s, real AI report generated, real activity counts, then test row deleted from `monthly_checkins` so Lewis's April 2026 slot remains open. **Members can now complete monthly check-ins for the first time since the feature shipped.**

**04 May 2026 PM-13b — Home dashboard tick lag fix: breadcrumb wiring follow-up.** PM-13 (commit `aa978349`) shipped `invalidateHomeCache` + `getOptimisticActivityToday` and wired invalidation into 6 write sites — but missed that the overlay only walks `vyve_outbox`, and every wired write site uses direct `fetch('POST')` not `writeQueued`. The outbox stays empty, the overlay is a no-op, and with the cache wiped the dashboard goes straight to skeleton-then-EF: the 1–10s lag Dean reported persisted. This commit closes the gap with a 2-min-TTL breadcrumb store `vyve_recent_activity_v1` that direct-fetch sites populate alongside the existing invalidate call. `getOptimisticActivityToday` now merges outbox + breadcrumbs (deduped against outbox by `habitId` for habits). New writes: `VYVEData.recordRecentActivity(kind, opts)` and internal `readRecentActivity()` in vyve-offline.js. Wiring: habits.html (yes-tick + autotick loop record; undo strips matching breadcrumb so the overlay drops the un-done tick), cardio.html (was missing both invalidate AND record — now has both), workouts-session.js completeWorkout (records workout breadcrumb; the exercise_logs invalidate site stays as-is since it doesn't bump counts), tracking.js onVisitStart (records session breadcrumb; heartbeats deliberately don't, same reason as the existing per-session invalidation policy). SW `v2026-05-04j-home-optimistic` → `v2026-05-04k-home-optimistic`. vyve-site commit `1549c84e`. **No member action needed** — fix is purely additive, takes effect on next portal visit after the new SW activates.

**INCIDENT — 04 May 2026 PM-13b — Brain files briefly leaked via GitHub Pages.** Commit `e31af6e2` to `vyve-site` (intended as a brain-only update from a prior session that got replayed during this session's first commit attempt) added `brain/master.md`, `brain/changelog.md`, `tasks/backlog.md` to vyve-site root. vyve-site is private as a repo but is served via GitHub Pages at `online.vyvehealth.co.uk`, and Pages serves any file from the source branch — so all three brain files were publicly fetchable for ~3 minutes. Member emails, supabase project ID, Stripe links, deal stages, the lot. Closure commit `431bfc0c` removed them; Pages 404'd within 15 seconds of the delete. No evidence of access in that window (would require speculative request to `/brain/master.md`). Mitigation: §23 hard rule added below, and any future brain commit goes through paranoid path verification before sending.

**04 May 2026 PM-13 — Home dashboard tick lag fix.** Closes the "tick a habit, navigate to home, dot stays empty for 1-10s" bug. Two-part fix. PART 1: every successful activity write across the app now calls new `VYVEData.invalidateHomeCache()` to wipe the bespoke `vyve_home_v3_<email>` cache that was painting stale pre-tick state. Wired into habits.html (logHabit/undoHabit/autotick), workouts-session.js (saveExerciseLog/completeWorkout but NOT plan_cache heartbeat), nutrition.html (weight log), log-food.html (delete + both inserts), wellbeing-checkin.html (submitCheckin + flushCheckinOutbox), tracking.js (onVisitStart only — heartbeats don't invalidate). PART 2: new `VYVEData.getOptimisticActivityToday()` walks `vyve_outbox` for pending writes matching today's UK-local date, returns counts per activity type. `renderDashboardData` in index.html overlays this onto the EF response — pill strip gets today's date if habits.hasToday, counts bump per type (but only if EF doesn't already reflect today, defending against the race where flush completed between EF query and render), activity_log gets today's row so daysInactive=0. Honest fallback: empty outbox → no-op. `<script src="/vyve-offline.js">` added to index.html next to auth.js. SW `v2026-05-04i-logfood-clientid` → `v2026-05-04j-home-optimistic`. vyve-site commit [`aa978349`](https://github.com/VYVEHealth/vyve-site/commit/aa9783495fed6cee772134f9ed7f4f76be0ca184). Doctrine still complete; this is a UX-perceived-latency fix on top.


**04 May 2026 PM-12 — log-food.html offline rework: client_id row identity.** Closes session 2b — the last remaining offline-tolerance gap. Both insert paths (logFood + logQuickAdd) generate `client_id` locally via `VYVEData.newClientId()`, queue via `VYVEData.writeQueued` with `Prefer: resolution=ignore-duplicates,return=minimal`. deleteLog now filters by `client_id` for instant optimistic UI, walks the outbox to cancel pending inserts in-place when the user deletes a never-flushed row, and queues `DELETE ?client_id=eq.<>&member_email=eq.<>` for already-flushed rows. Render button onclick switched to pass `r.client_id`. loadDiary upgraded to paint-cache-first via new `vyve_food_diary:<email>:<date>` localStorage cache. Legacy server rows without client_id get a fabricated UUID locally + fire-and-forget PATCH backfill. SW `v2026-05-04h-checkin-deferred` → `v2026-05-04i-logfood-clientid`. vyve-site commit [`6fb46b72`](https://github.com/VYVEHealth/vyve-site/commit/6fb46b727ca8f548a7f63b4f84df642a786aa3e6). With 2b closed, the offline-tolerance doctrine is **complete across every member-facing surface**: tolerant where we can be (workouts, habits, weight log, nutrition log + cache-first reads), honest where we can't (live sessions, running plan generation), bridged where it makes sense (wellbeing check-in queues + defers via notifications). No outstanding offline-tolerance items in the backlog.


**04 May 2026 PM-11 — Wellbeing check-in offline queue + deferred AI response.** Closes session 2c (PM-10 shipped the user-facing half; this ships the back-half). New `flushCheckinOutbox()` in wellbeing-checkin.html drains a `localStorage.vyve_checkin_outbox` queue on the `online` event and on a 1.5s page-load retry, re-firing the EF call with `X-VYVE-Deferred: 1` header. EF v25 → v26: reads the header to swap notification copy to "Your check-in recommendations are ready / Tap to see this week's recommendations from {persona}", and adds `route: '/wellbeing-checkin.html'` to all notifications (deferred AND online) so taps deep-link straight to the existing `renderAlreadyDone()` flow. Idempotency via the existing natural-key unique index `(member_email, iso_week, iso_year)` plus `Prefer: resolution=merge-duplicates` — no client_id plumbing needed. SW `v2026-05-04g-offline-gates` → `v2026-05-04h-checkin-deferred`. vyve-site commit [`81aafc58`](https://github.com/VYVEHealth/vyve-site/commit/81aafc58f4c0ee935da08d260034984d2dba58a3). Doctrine completion: tolerant where we can (workouts/habits/weight log writes queue, reads paint from cache), honest where we can't (live sessions + running plan generation refuse cleanly), bridged where it makes sense (check-in queues + defers via notifications). Session 2b (log-food client_id rework) is the only remaining offline-tolerance backlog item.


**04 May 2026 PM-10 — Offline gates for AI / live pages.** Lewis directive: certain surfaces shouldn't pretend to work offline. New `VYVEData.requireOnline()` helper paints a full-page "You're offline" state with custom per-surface body copy + auto-reload on the `online` event. Wired into: all 8 live session pages (7 via single patch in session-live.js, events-live.html via inline gate with explicit else-bracket — validated by node --check after catching a doubled-function-signature bug from the first regex anchor), running-plan.html (gate inside generatePlan only — saved plans still visible offline), wellbeing-checkin.html (gate inside submitCheckin only — cached previous-week display still works). SW `v2026-05-04f-cache-paint-first` → `v2026-05-04g-offline-gates`. vyve-site commit [`3e46a2f5`](https://github.com/VYVEHealth/vyve-site/commit/3e46a2f56d2897ec283a343f18735b7bcde2a036). The doctrine sharpens: VYVE is offline-tolerant where it can be (workouts, habits, weight log, paint-cache-first reads), offline-honest where it can't (live streams, AI calls). PM-10 ships the user-facing half of session 2c; the back-half (deferred AI response via member_notifications fan-out) is the only remaining check-in offline work.


**04 May 2026 PM-9 — Offline data layer session 3 (paint-cache-first across remaining surfaces).** Audit-driven scope reduction: walking through index, engagement, leaderboard, sessions, habits showed most pages already had bespoke paint-cache-first localStorage caches. Two surgical fixes shipped: (1) engagement.html `loadAchievements` flipped from cache-on-failure to paint-cache-first with diff-checked re-render (achievements tab now feels instant on every switch); (2) habits.html offline cache horizon extended (offline branch no longer requires <24h freshness — stale data > empty state when on a flight or in a gym). SW cache `v2026-05-04e-offline-habits-weight` → `v2026-05-04f-cache-paint-first`. vyve-site commit [`09b51953`](https://github.com/VYVEHealth/vyve-site/commit/09b519538f3e1a872c261eb657f5b40bee40d056). The original "every page feels slow" complaint was largely a Phase-3 achievements-tab issue masquerading as universal — the audit caught that. Sessions 2b (log-food client_id rework) and 2c (wellbeing-checkin offline UX) remain in backlog.


**04 May 2026 PM-8 — Offline data layer session 2a (habits + weight log writes).** Extended the offline-tolerance pattern from workouts to two more high-frequency surfaces: `daily_habits` (logHabit / undoHabit / autotick) and `weight_logs` (the nutrition.html weight tracker POST). Idempotent via existing natural-key on_conflict + merge-duplicates — re-flushes are no-ops without needing client_id. Three more partial unique indexes added (`weight_logs`, `nutrition_logs`, `wellbeing_checkins` — last two pre-staged for sessions 2b/2c). SW cache `v2026-05-04d-offline-data` → `v2026-05-04e-offline-habits-weight`. vyve-site commit [`9a9e7cec`](https://github.com/VYVEHealth/vyve-site/commit/9a9e7cecc9723a9493d209e929572ab252d914e2). Sessions 2b (log-food rework around client_id row identity) and 2c (wellbeing-checkin offline UX with deferred AI response) remain in backlog.


**04 May 2026 PM-7 — Offline data layer session 1 (workouts).** Generic `vyve-offline.js` shipped with cache-then-network reads and outbox-queued writes. Schema: `client_id uuid` + partial unique index `(member_email, client_id)` added to `exercise_logs`, `workouts`, `cardio`, `daily_habits`. Wired workouts-only end-to-end: `loadExerciseHistory` + `loadCustomWorkouts` cache-first; `saveExerciseLog`, completeWorkout's workouts INSERT, and the workout_plan_cache PATCH all queue with idempotent client_ids. SW cache `v2026-05-04c-notif-routing` → `v2026-05-04d-offline-data`. `/vyve-offline.js` added to precache list. vyve-site commit [`d988c963`](https://github.com/VYVEHealth/vyve-site/commit/d988c9634f058c62ccf3ce1a2c51cd8d735f7c3b). Sessions 2 (habits/weight/nutrition/wellbeing) and 3 (read-only caching across remaining pages) parked in backlog.


### Completed — Dean (technical)

- **08 May 2026 PM-30 — Layer 1c-1: habits → `bus.publish('habit:logged', ...)` shipped.** vyve-site `27eaeafd`. First Layer 1c migration. Three habits.html write sites (logHabit + runAutotickPass + undoHabit) collapse from three legacy primitives (invalidate + record + evaluate) to one `bus.publish` per site. Subscribers wired on habits.html (in-memory `logsToday` + `habitsData` sort + `vyve_habits_cache_v2` cache merge + breadcrumb record/scrub + achievements eval-on-yes/autotick), index.html (home-stale via `VYVEData.invalidateHomeCache(envelope.email)` per option-(a) home-stale signalling decision; idempotent via `__vyveHomeBusWired`), monthly-checkin.html (recap-stale + visibility/step-gated re-fetch via `loadRecap`). Schema: `bus.publish('habit:logged', { habit_id, is_yes: true|false|null, autotick?: true })` — `is_yes:null` covers undo. Achievements eval gates on `is_yes:true || autotick:true`; debouncer (1.5s) coalesces multi-subscriber double-fires into one network call. Bug-fix on the way through: autotick now grants achievement credit (silent gap pre-PM-30 — the autotick path called record + invalidate but never `VYVEAchievements.evaluate()`). Direct-call surface drops 13/9/16 → 10/7/13 (invalidate / record / evaluate). 33/33 self-tests passing in Node harness with browser shims (API surface, local yes/no/skip/autotick/undo, cross-tab via `storage` event with origin rewrite, storage filtering, invalid-name rejection, visibility/step gating, idempotent registration). Inline JS syntax `node --check`'d on all 13 `<script>` blocks across the 3 patched HTMLs + sw.js — 0 failures. Whole-tree audit at HEAD `25b112e9` confirmed brain counts unchanged before patching. Post-commit live-SHA verification on all 4 files via `GITHUB_GET_REPOSITORY_CONTENT` (head-200 char match, length match, blob_sha matches `path_status`). SW cache `pm29-bus-a` → `pm30-habits-a` same atomic commit. New tree SHA `f1013b15`. Sequence next: PM-31 → 1c-2 (workouts-session complete handler → `bus.publish('workout:logged', source:'programme'|'custom', ...)`).

- **08 May 2026 PM-29 — `bus.js` shipped (Layer 1b foundation for the cache-bus).** vyve-site `25b112e9`. New file `bus.js` (240 lines, ~10KB) — in-app event bus + cross-tab transport, the rail every Layer 1c migration publishes/subscribes through. API on `window.VYVEBus`: `publish(eventName, payload)`, `subscribe(eventName, handler)` (returns unsub fn), `unsubscribe`, `__inspect()`. Envelope shape per `playbooks/cache-bus-taxonomy.md`: `{ event, ts, email, origin: 'local'|'remote', txn_id, ...payload }` with `email` captured from `window.vyveCurrentUser` at publish-time and `txn_id` reserved for future Layer-3 Realtime echo dedup. Event-name validation `/^[a-z][a-z0-9_-]*:[a-z][a-z0-9_-]*$/i`. In-tab transport: subscriber map walked in registration order, each handler wrapped in try/catch. Cross-tab transport: `localStorage.setItem('vyve_bus', ...)` then immediate `removeItem` (storage events fire on the write); `storage` event listener fires same handler chain with `origin: 'remote'`. Auth bridge: `vyveAuthReady` listener publishes `auth:ready`; `window.vyveSignOut` wrapped so `auth:signed-out` publishes BEFORE redirect (race-free wrap with auth-ready fallback; `__busWrapped` idempotency flag). Documented limitation: session-player pages (events-live, events-rp, session-live, session-rp) use an inline `#logoutBtn` click handler that bypasses `vyveSignOut` — sign-outs from those rare full-screen contexts won't publish `auth:signed-out`, acceptable. Symbol-collision audit at HEAD `040c496d` (whole-tree per §23): no conflicts. 43 of 43 self-tests passing. SW cache `pm27-outbox-a` → `pm29-bus-a` in same atomic commit; `/bus.js` added to `urlsToCache`; `<script src="/bus.js" defer>` inserted at index.html:L302 between auth.js and perf.js. No subscribers wired (Layer 1c work). Sequence next: PM-30 → 1c-1 (habits → `bus.publish('habit:logged', ...)`).

- **08 May 2026 PM-28 — cache-bus taxonomy patch + 1c-14 resolved + `vyve_dashboard_cache` deprecated.** Brain-only commit. Two PM-27 sub-audits resolved: 1c-14 (`workouts-programme.js:391`) lands as `bus.publish('workout:shared', kind:'session'|'programme', ...)` — the lone evaluate call is fired after a successful `share-workout` EF POST inside `shareProgramme(btn)`, with a sibling publish site at `workouts-session.js:733` `shareWorkout` that collapses into the same event. `vyve_dashboard_cache` whole-tree audit at HEAD `040c496d` against literal + dynamic-key + bracket-access patterns found one read at `achievements.js:251` and zero writers anywhere in the 72-file tree, no other consumer of the `.unseen` shape — dead key, removed from `auth:signed-out` bus cleanup scope. Editorial fix to PM-26 changelog: original PM-25 invalidate count was simply wrong (no stray comment-line); evaluate count corrected from 20 to 16 after excluding 3 docblock-comment lines in `achievements.js`. Migration plan stays at 14 rows; bus shape unchanged. Three new P3 backlog items spawned: surgical removal of the dead read, taxonomy `Existing cache keys` whole-tree-verified inventory tightening, and `shareCustomWorkout` evaluate-gap question for Lewis.

- **08 May 2026 PM-27 — outbox email-keyed.** `vyve_outbox` / `vyve_outbox_dead` localStorage migrated to per-member `vyve_outbox_<email>` / `vyve_outbox_dead_<email>` with one-shot adoption inside `outboxList()`/`deadList()`. Adopts legacy flat-keyed rows whose `body.member_email` matches the current session, discards mismatches silently. New `VYVEData.outboxReplace(items)` public setter for callers that mutate the queue in place (log-food cancel path the only one). `outboxFlush` short-circuits without an authenticated email; `vyveAuthReady` listener retries flush once auth fan-out populates `vyveCurrentUser`. Whole-tree audit at vyve-site `df41d7cb` (all 72 source files) confirmed the only direct-string consumer outside vyve-offline.js was log-food.html:805. SW cache `v2026-05-08-perf-shim-f` → `v2026-05-08-pm27-outbox-a`. vyve-site commit `040c496d`.

- **Native app store welcome email + login PWA install banner removal (04 May 2026 PM-3, 2 commits + 1 EF deploy)** — cleaned up legacy PWA install affordances now that iOS 1.2 is on App Store (since 28 April) and Android Play Store URL is live. `vyve-site` `login.html` strips the entire "Add VYVE to your home screen" banner (CSS + HTML + `initPWAPrompt` script — 5,054 chars / 4 surgical cuts) — kept SW registration for offline cache. `onboarding` EF v82 deploys with the welcome-email `pwa` constant rewritten from "Open in Safari → Add to Home Screen" instructions into native App Store + Play Store download buttons (iOS `apps.apple.com/gb/app/vyve-health/id6762100652`, Android `play.google.com/store/apps/details?id=co.uk.vyvehealth.app`). v82 also closes the source-header drift logged PM-2: header label, console.logs, and `onboarding_version` field all bumped v78→v82. New ezbr_sha `e004b86d…` ≠ v81 `db0ac99e…`. Members onboarding from today get directed to the wrapped app rather than the legacy PWA-install workaround.
- **Email pipeline silent-failure recovery + watchdog (04 May 2026 PM-1, 6 commits)** — daily/weekly/monthly internal reports stopped landing in `team@vyvehealth.co.uk` on 28 April; Dean noticed manually 6 days later. Diagnosed as Brevo recipient-MX cache lag independent of public DNS: `team@` mailbox was hard-bouncing through one specific upstream Microsoft Exchange / GoDaddy blip on 28 April, healed at the inbox layer the same day, but Brevo's outbound mail server kept the failed MX cached well past public DNS TTL and the address sat on Brevo's blocked-contacts list silently absorbing every retry. Public DNS, MX, SPF, DKIM, DMARC all verified correct on GoDaddy panel; inbound to `team@` confirmed working from Dean's phone before any Brevo retest landed. Brevo dashboard's "Check configuration" button validates outbound auth (passed all green) but does NOT refresh recipient-MX cache — that's Brevo's biggest hidden-failure surface. Cleared by waiting ~3h; tested with manual canary fire that confirmed delivery resumption. Shipped: (1) `daily-report` v8, `weekly-report` v3, `monthly-report` v2 — all three EFs gain optional `?date`/`?week_start`/`?month_start` and `?to`/`?cc` params for backfill and recipient override; default cron behaviour unchanged. (2) 12 backfilled reports to `team@` covering 24 Apr → 3 May activity (10 dailies + 1 weekly + April monthly) — all delivered, zero bounces. Duplicate copies also landed in Dean+Lewis Hotmail during the wait window — harmless extras. (3) `email-watchdog` v1 EF + jobid 16 cron (`*/30 * * * *`) — five checks: missing-daily-delivery (26h), recent team@ hard-bounces (24h), team@ on blocklist, pg_cron failures (6h), bounce-spike across all auto-emails (1h). Alerts via multi-recipient (Dean Hotmail TO + Lewis Hotmail + team@ CC) so a single inbox failure can't blind us; per-code 6h suppression via `watchdog_alerts` table. New §23 hard rule for the Brevo MX cache lag pattern. master.md §16 corrected: `team@` is Microsoft Exchange via GoDaddy, never was Google Workspace — userMemories cache had it wrong.
- **HealthKit auto-recovery + sync-gap closure (29 April PM-4, 7 commits)** shipped end-to-end. Diagnosed silent breakage of HK reads on 1.2 App Store binary install (28 April 19:24 UTC onwards): iOS reset HK auth to "not determined" on the new signed binary, existing sync flow had no recovery path, and `last_sync_at` advanced through broken syncs creating a data gap. Fixed via three changes: (1) `get-health-data` v6 — split combined samples query into 4 per-type queries to escape Supabase's 1000-row default cap that was crowding out workouts/sleep/weight under HR volume; (2) `healthbridge.js` v0.4–v0.7 — Capacitor App lifecycle listeners, 60→2min cooldown, auto-recovery via `requestAuthorization` retry on all-probes-unauthorized pattern, `?fullsync=1` URL trigger, Force-full-backfill button on apple-health.html, dropped synthetic native_uuid fallback; (3) `sync-health-data` v9 — don't advance `last_sync_at` on auth-blocked syncs, mark `last_sync_status:'auth_blocked'` instead so next successful sync's incremental window covers the gap. Plus DB cleanup of 7 synthetic-UUID dup workout samples + 4 dup cardio rows on Dean's account. Live data flow confirmed: today's aggregates ingesting at 15:00 UTC, missing 28 April 18:33 BST run recovered at 15:21 UTC, 28 April daily totals retroactively corrected. Three new §23 hard rules codified. See PM-4 changelog entry for full diagnostic journey.
- **Achievements UI trophy-cabinet redesign** shipped (29 April 2026 PM-3, vyve-site `30ef4ddba`). Replaced wall-of-tiles grid with three sections: Recently earned (last 6 unlocks, horizontal scroller) → Up next (top 3 in-progress) → Trophy cabinet (one trophy per metric, click → full-ladder modal). EF unchanged. SW cache `v2026-04-29c-trophy-cabinet`. Mockup-first workflow used and approved before code touched.
- **Notification routing infrastructure** shipped end-to-end (29 April 2026 PM-2, vyve-site `30e8398b`). Every notification on every surface (in-app toast, in-app row, web push, native push) carries a route to the right destination. Schema: `route TEXT` column added to `member_notifications`, all 35+ existing rows backfilled via SQL `regexp_replace`. Server: `send-push` v13 (writes `data.url` to row); `achievement-earned-push` v2 (per-tier deep-link `/engagement.html#achievements&slug=X&tier=Y`); `log-activity` v27 (platform v30) — streak rows route to `/engagement.html#streak`, achievement rows carry per-tier route. Client: `/achievements.js` toast click reads `earn.route` with fallback; `engagement.html` `parseHashRoute()` parses `#achievements&slug=X&tier=N` and auto-opens modal once grid loads; `notification_navigate` postMessage listener routes in-place if member already on the page; `#streak` anchor target added. SW cache `v2026-04-29a-ach-grid` → `v2026-04-29b-routes`.
- Supabase Pro. **76 public tables**, ~30 core operational Edge Functions, SQL functions for activity caps + charity totals.
- Supabase Auth migration complete. Auth0 gone. `auth.js` v2.3 live.
- All portal pages live: index, habits, exercise, workouts, movement, cardio, nutrition, log-food, settings, certificates, engagement, leaderboard, sessions, wellbeing-checkin, monthly-checkin, running-plan, welcome, login, set-password, strategy. Plus parked: apple-health, activity.
- Theme system (dual dark/light tokens) live. `nav.js` body-prepend pattern. Cache-first dashboard. Consent gate built and wired. Viewport zoom disabled. `target="_blank"` audit complete.
- Service worker network-first for HTML + skipWaiting + clients.claim. **Push event listener + notificationclick handler shipped 28 April PM** (`vyve-site@124ecb53`) — fixed silent web push breakage that had been live since initial push rollout. Current cache: `vyve-cache-v2026-05-08-theme-throttle-8`.
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
- **APNs key rotation (07 May 2026 PM-4)** — accepted risk pending Sage procurement diligence. KEY_ID `2MWXR57BU4` was exposed in chat 27 April 2026 PM, rotation attempted 07 May 2026 PM-4 hit Apple's 2-keys-per-team cap. Risk profile assessed as low (chat platform not a known leak source, exploitation requires team ID + bundle ID + .p8 contents combined, blast radius is "phishing pushes to VYVE iOS members" not data breach). If Sage's security review surfaces this, rotate then.
- **Secondary email service provider (deferred)** — Brevo is the single-provider for onboarding welcomes, certificates, re-engagement, push notification fan-outs. No failover ESP. Pre-Sage acceptable; post-Sage we evaluate AWS SES as a secondary. Not building now.
- **GDPR cron static-PSK exposure (08 May 2026 PM-1)** — cron jobids 21 (`vyve-gdpr-export-tick`) and 22 (`vyve-gdpr-erase-daily`) hardcode the same SHA-256-shaped bearer token directly in their `cron.job.command` bodies (`Authorization: Bearer dd536f57…6111`). Anyone with read access to `cron.job` (the postgres role / service role) can see it. Risk profile is low — Supabase service role is already the highest-privilege credential and anyone with it has more direct attack surfaces than this PSK — but procurement reviewers will flag it. Two fixes possible: (a) replace the static PSK with a database-setting lookup (`current_setting('app.gdpr_cron_psk')`) so the value lives outside `cron.job.command`, or (b) drop the bearer entirely and rely on the EFs' existing service-role-only checks. Backlog rotation when convenient; not blocking Sage diligence unless explicitly raised.
- **Home page redesign shape (PM-73, 12 May 2026 PM)** — v2 mockup at `playbooks/home-redesign-v2-mockup.html` is Dean's working preference ("kind of likes this"). Parked behind end-of-month Mind/Body/Connect nav re-architecture + premium-feel polish pass. When this comes back, the EF trim (PM-71 re-scope to delete home payload fields, move detail to `/stats` via a new `member-stats` EF) is in-scope alongside the UI build. Daily goals canonical shape locked: "Watch 1 session" / "Log daily habits" / "Log one form of exercise".

---

## 23. Known gotchas & architecture rules

### §23.7.1 — Page-side Dexie wiring is a requirement, not an optimisation (PM-96 ship night, 13 May 2026)

Every page that paints member data MUST either (a) read `VYVELocalDB.<table>.allFor(memberEmail)` inside an `await VYVESync.hydrate()` block with REST fallback below, OR (b) deliberately pass through to REST/EF for legit reasons (aggregate reports, server-computed leaderboards). PF-14 part 6 added `await VYVESync.hydrate()` to four pages on the assumption the issue was hydrate timing; that fix DID work for the four wired pages but couldn't help `exercise.html` because the page had ZERO `VYVELocalDB` references — never migrated. PM-96 part 2 (`433d0650`) added the Dexie read path. Audit signal: ripgrep for `VYVELocalDB` in every member-data page; 0 hits on a member-data page = amber by construction (the indicator will paint amber regardless of what hydrate does). The PF-15 sweep walks every remaining unwired page (movement, sessions, leaderboard, running-plan, certificates, engagement) and applies the same template OR documents a deliberate REST carve-out in the commit.

### §23.7.2 — `await VYVESync.hydrate()` returns true even when individual tables fail (PM-96, 13 May 2026)

`sync.js` `hydrate()` collects per-table pass/fail in module-private `failedTables{}` (no public getter) but resolves `true` regardless of partial failure. Callers cannot rely on the resolved promise meaning "the table I'm about to read is populated". Two design implications: (a) every Dexie read must defensively check for empty/missing result and fall through to REST (this is the PM-96 part 2 pattern); (b) when investigating a coverage gap, the diagnostic must inspect `_sync_meta.get(table)` and Dexie row counts directly, NOT the hydrate return value. PM-96 diagnostic (`4ffe3d72`) codifies pattern (b) — appended an IIFE to `dexie-source-indicator.js` that listens to sync.js's `vyve-localdb-table-pulled` / `-failed` / `-hydrated` events and snapshots full state to PostHog. PF-15.y backlog item proposes changing `hydrate()` return type to `{ok, failed, ms, failedTables}` summary object during the PF-15 sweep when we're touching every page anyway.

### §23.7.3 — First paint after sw.js cache key bump may flicker amber (PM-96, 13 May 2026)

Not a real regression. The new service worker has to install + activate + claim clients; during that window the first network request may slip past the local-first rail before the new code is serving. Subsequent paints settle correctly. Don't read amber on the first reload after a cache key bump as evidence the underlying code is broken — reload once more before drawing conclusions. PM-96 mistakenly diagnosed habits + nutrition as "regressed" based on a single first-reload observation; the post-diagnostic walk showed both green. PF-15.z backlog has a deferred mitigation (suppress amber state changes for ~1500ms after `controllerchange`); documenting the rule is the cheaper near-term fix.

### §23.7.4 — Diagnostic-before-fix when a speculative patch fails (PM-96, 13 May 2026)

If a fix doesn't work on the first device walk, stop. Don't ship a second speculative patch. Ship a diagnostic that captures the actual state, walk the device once, read the data, then write one real fix. The PM-95 → PM-96 session boundary demonstrated the cost of the alternative — PF-14 part 6 was a guess-built patch that fixed the right problem on the wrong pages and missed the actual unwired page. The PM-96 protocol shape is: speculative-patch-failed → diagnostic commit → walk → fix commit. No third speculative patch in between. The diagnostic infrastructure is reusable — `dexie-source-indicator.js` now has the event-listener + `_sync_meta`-inspection + PostHog wire baked in, so future hydrate-coverage questions answer themselves with a walk.

### §23.7.5 — VYVELocalDB.<table>.upsert MUST merge by default for member-scoped tables (PM-97 ship night, 13 May 2026)

Default Dexie `.put()` is full-replace, not merge. Partial payloads silently drop every column not in the object literal. PM-95 finding #3 logged this bug class for `member_habits` via two settings.html call sites; tonight's audit revealed the same landmine on `members` via two more settings.html call sites (4 total partial-upsert call sites, all on settings.html, all on these two tables). The user-visible failure: habits.html renders "undefined" for every column when member_habits rows have been corrupted; settings persona/goal changes silently drop name/company/goal_focus from the members row in Dexie.

**The fix shipped tonight:** db.js `member_habits.upsert` and `members.upsert` overrides now do read-modify-write merge inside a Dexie transaction. `Object.assign({}, existing, row)` preserves every column the partial payload didn't supply.

**The audit signal for future pages:** `ripgrep VYVELocalDB\.\w+\.upsert\(` and inspect each object literal. Count the fields. If the count is less than the full row schema and the table is member-scoped (not an activity table), the table needs a merge override in db.js.

**Exempt tables** — these are always called with full rows from the activity-log code paths and full-replace is the correct behaviour: `cardio`, `daily_habits`, `wellbeing_checkins`, `monthly_checkins`, `exercise_logs`, `session_views`, `replay_views`, `nutrition_logs`. The merge override only goes on tables where partial writes are legitimate (settings updates, persona changes, single-field PATCH-like operations).

**Recovery from existing corruption:** if a user's Dexie store already has bare rows from a pre-PM-97 partial upsert, the long-press-version-footer gesture in settings.html clears member_habits + members for that member, resets _sync_meta, and re-hydrates. Exposed as `window.__pf15_resetLocalCache()` for debug. Spike-gated.

**Related but distinct from §23.7.2** — that rule covers hydrate-side failures resolving silently as `true`. §23.7.5 covers write-side failures corrupting silently via default Dexie semantics. Both are "things that look right but aren't" classes of bug, both need diagnostic infra to surface, both deserve §23 codification.

### §23.7.6 — UI state mutation must be synchronous on the active surface; the bus is fan-out, not the trigger (PM-98 ship night, 13 May 2026)

User-perceived UI state changes must happen synchronously inside the event handler that triggers them, BEFORE any bus publish or network write. The bus is for fan-out to OTHER surfaces (home page count overlays, achievements eval, breadcrumb writes, cross-tab and cross-device sync via Layer 2 Realtime bridge) — not the trigger for the active surface's own re-render. Dexie writes can be fire-and-forget Promises but the in-memory state mutation that drives the render must be synchronous in the handler.

**Discovery (PM-98, 13 May 2026):** habits.html `logHabit`/`undoHabit` ran tap → `VYVEBus.publish('habit:logged')` → subscriber mutates `logsToday` and calls `renderHabits`. iOS Safari and iOS Capacitor took 15+ seconds to flip the button. Even after the network write was made fire-and-forget, iOS still failed. The exact reason inside WebKit's task scheduler was never isolated and doesn't need to be — making the visible UI state change synchronous in the handler bypasses the question entirely. Desktop Chrome had hidden the problem.

**Critical-path order for any write surface (use this template):**
1. Synchronous in-memory state mutation (the variable that drives the render function)
2. Synchronous re-sort if needed + synchronous render call — DOM flips this paint frame
3. `showToast` feedback
4. Dexie write — fire-and-forget Promise, no `await`
5. `localStorage` cache persist (so nav-back paints correct state)
6. `VYVEBus.publish` — fan-out for fan-out's sake
7. `writeQueued` (NOT awaited) with `.then()` for 4xx/5xx → publish `<event>:failed`

**Defensive subscriber pattern for the active surface's own publish:**
The subscriber must compute `alreadyCorrect` from the envelope against current local state, and skip the resort + render when local already matches. The subscriber's real value is remote-origin publishes (cross-tab, cross-device) where local is NOT yet correct, plus side-effect work that runs unconditionally (cache persist, breadcrumb write/scrub, achievements eval, inflight tracker prune). Failure subscribers (`<event>:failed`) stay unconditional — failure is by definition a state change away from optimistic paint.

**What stays unchanged about the bus:**
- It is structurally required for cross-surface fan-out (home page count updates, achievements eval, breadcrumb writes).
- It is the foundation for Layer 2 Realtime cross-device sync.
- Active-surface publishes still fire for remote subscribers and side-effect handlers — just NOT for the active surface's own re-render.

**Audit signal across the codebase:** ripgrep `VYVEBus\.subscribe\(['"]<event>['"]` and check whether the subscriber calls a `render<X>` function when `<event>` is also published from the same page. If yes, that subscriber needs the `alreadyCorrect` defensive check and the active surface needs the synchronous critical-path order above. Surfaces to audit: cardio.html, workouts.html (session save), wellbeing-checkin.html, monthly-checkin.html, nutrition.html (logWeight/logWater), log-food.html.

**Exempt path:** `runAutotickPass` style flows that run during page load BEFORE the first `renderHabits()` — these can mutate `logsToday` synchronously and let the awaited page-load render paint the final state. No tap-to-flip latency to optimise.

**Related but distinct from §23.7.5** — that rule is about write-side data corruption (partial-upsert landmine in Dexie). §23.7.6 is about write-side UI responsiveness on iOS WebKit. Both surface from the same broad principle (the user's hands and the data layer are not the same problem) but they live in different files.

### §23.7.7 — Cache-first first paint must cover ALL surface counters, not just the main list; surfaces must self-correct on date rollover (PM-100, 14 May 2026)

Two rules in one section because they were discovered together in the post-PM-98 walk and they share a common root: the cache-first paint pattern was implemented for the visible "main content" of habits.html but not extended to the header counters or to the date-context, leaving the user-perceived first paint half-instant and stale across midnight.

**Rule 1: cache-first paint covers every counter, not just the main list.**

When a page implements cache-first first paint (paint from localStorage cache synchronously, then refresh in the background), the cache MUST include every datum the page renders on first paint. Habits page cached `habitsData` + `logsToday` and re-rendered the list instantly, but DAY STREAK / TOTAL LOGGED sat on em-dash placeholders until the awaited `fetchHabitDates() → updateStats(allDates)` chain completed because `activeDates` was not in the cache. The post-PM-98 Dexie-first `fetchHabitDates()` helped — but it only ran AFTER the awaits in `loadHabitsPage`, defeating the local-first promise for the header.

**The fix shape (PM-100):** stamp `activeDates: allDates` into the canonical full-paint cache write. Cache-first paint branches read `_hc.activeDates` and call `updateStats(_hc.activeDates) + renderWeekStrip(...)` synchronously alongside `renderHabits()`. Header populates this paint frame.

**Audit signal for other pages:** for every cache-first paint site, enumerate every DOM element the page renders on first paint. If any of them are populated from data the cache doesn't include, the cache is incomplete and that element will sit on placeholder text until the slow path returns. Surfaces to audit: workouts.html (programme progress %, week badge), nutrition.html (TDEE values, macro rings, water tracker, weight chart), cardio.html (week count / target / history rows), engagement.html (score ring components), index.html (already covered by vyve-home-state.js).

**Rule 2: date-anchored surfaces must self-correct on date rollover.**

`todayStr` captured at page load is correct at page load. If the page is open or backgrounded across midnight, every downstream calc still uses yesterday's date — habits render as "Done today" against yesterday's logsToday, the week strip points to yesterday's column, the daily check-in / habit-log button references yesterday's slot. Dean's PM-100 screenshot: 11/11 done today on Thursday because yesterday's `logsToday` was rendered as today's "Done" state. Home page correctly showed empty pill because it captures `todayStr` from a different entry point — surfaces disagreed on what "today" means.

**The fix shape (PM-100):**
1. Cache writes stamp `todayStr` into every cache entry. Cache-first paint date-guards stateful fields: `logsToday = (_hc.todayStr === todayStr) ? (_hc.logsToday || {}) : {}`. The date-stable fields (assigned habits list, exercise plan, etc.) are still reused — they don't roll over.
2. `visibilitychange` + `focus` handler at page bottom: re-evaluates `bstToday()`. If `todayStr` changed since page load, wipe today-specific state, reset the date label, and re-run the page-load function for a clean fetch. Cheap, runs once per resume.

**Audit signal for other pages:** any page that captures `todayStr` or equivalent date variable once at page load and references it for "today's" data MUST have a visibility/focus handler. Surfaces to audit: index.html (home; check `vyve-home-state.js`), workouts.html (today's session selection), nutrition.html (today's macro totals, today's water entries), cardio.html (today's row in history), wellbeing-checkin.html (today's check-in slot), monthly-checkin.html (this month's slot — same problem at month boundaries).

**Related to §23.7.6** — §23.7.6 was the synchronous critical-path for taps. §23.7.7 is the synchronous first-paint completeness for cache-first surfaces. Both are about delivering the premium-app feel: §23.7.6 says "user taps must feel instant"; §23.7.7 says "page first paint must be complete from local, not half-painted with stale or missing fields." A surface needs both to feel right.


**PM-101 addendum (14 May 2026):** prefer an async Dexie read over caching a computed value when Dexie can satisfy a first-paint counter. PM-100 stamped `activeDates` into the cache write so the cache-first paint could call `updateStats(_hc.activeDates)` synchronously, but that depended on the cache containing the field — caches written by pre-PM-100 sessions didn't have it, so on first reopen after upgrade the header sat on dashes until the slow path completed. Dexie already had every row needed to derive the counter (`VYVELocalDB.daily_habits.allDatesFor(email)` returns a sorted array of distinct dates) — the cache wasn't the source of truth, Dexie was. The cleaner pattern: kick off `VYVELocalDB.<table>.<derive>(email)` as a fire-and-forget Promise in parallel with the cache-first paint, and let the `.then` populate the header when it resolves (typically ms). Cache is then a paint accelerator for shape data (list, current state) but no longer authoritative for derived counters. PM-101 ships this for habits.html header. Same pattern applies anywhere Dexie can produce a first-paint counter — workouts.html "Week 1 of 8 — 0%", nutrition.html water progress, cardio.html week count, etc. Audit signal: every `updateStats(...)`/`render<Counter>(...)` call after an `await` is a candidate for the parallel-Dexie-read treatment.

### §23.7.8 — In-app cache reset must force a full Dexie rehydrate before next paint (logged 14 May 2026, PM-102)

**Status:** HARD RULE. Surfaced live on production iPhone 14 May 2026 ~00:30 BST. Dean's account: tapped the in-app cache reset gesture (settings.html long-press footer recovery); index.html and habits.html then rendered broken state — "HABITS 1" instead of 44 distinct-days, "0 of 11 done today" with all habit cards showing "undefined" titles and descriptions. Server data was fully intact (verified: 44 distinct habit days, 9 daily_habits rows today, 11 active member_habits with proper habit_library join columns populated). The breakage was purely client-side: reset cleared `vyve_home_v3_<email>` AND wiped Dexie tables, but the page paint that fired immediately after had nothing to render from and no completed re-hydrate sitting behind it.

**Root cause:** The reset path is fire-and-forget against Dexie clear + localStorage wipe. It does not await `VYVESync.hydrate()` (or equivalent full re-pull from Supabase) before unblocking navigation. Next page load hits:
- Empty `vyve_home_v3` → `buildHomeFromDexie()` fallback path → Dexie tables empty → returns stub state with `habits_total=1` (count of zero rows + base, or stale, depending on path) and empty habits assigned → home renders the stub as if it were truth.
- Empty Dexie `member_habits` on habits.html → cache-first paint fails (no row matches member_email) → renders the synthesised "undefined" placeholders that the partial-upsert override (§23.7.5) was written to defend against, only here the rows aren't *partially* wrong, they're absent entirely so even the merge defence has nothing to merge with.

The dexie-source-indicator overlay confirmed it in the field: badge read "Paint: dexie / Last: supabase / member_habits / Method: fetch / Age: 2.6s" while the cards rendered "undefined." Dexie had been *asked* for the data 2.6s ago, the fetch had landed, but the denormalised join columns hadn't propagated yet because the timing window was wrong — the page rendered before the post-fetch persist completed, and there was no re-render trigger fired after the persist landed.

**Hard rule:** Any code path that clears local cache (Dexie tables, `vyve_home_v3_*`, `vyve_engagement_cache`, outbox, sync_meta, or any other client-side store) MUST:

1. Block UI until `VYVESync.hydrate(email)` has completed for at least the member-scoped tables the user is about to navigate into (`members`, `member_habits`, `workout_plan_cache` minimum). A 2-3 second loading toast is acceptable; rendering empty/undefined state is not.
2. Force a hard reload AFTER hydrate resolves, not before. The reset gesture's existing `location.reload()` must come from inside the `.then()` of the rehydrate, never alongside it.
3. If hydrate fails (offline, RLS, network 5xx), surface a user-facing error and BLOCK the reload. Do not allow navigation into a known-empty Dexie state.

This rule extends §23.7.5 (partial-upsert landmine) and §23.7.7 (cache-first first paint completeness) — together they cover the three failure modes for client-side state: partial writes, empty cache, and stale-cache-during-rehydrate-race.

**Audit signal:** any caller of `VYVELocalDB.<table>.clear()`, `localStorage.removeItem('vyve_home_v3_*')`, or `_sync_meta.set(table, 0)` is suspect. Especially the PM-97 recovery gesture in settings.html and any dev tools that clear state. Sweep when next on settings.html or any debug surface.

**Field-test:** the in-app reset gesture itself was confirmed broken on production 14 May 2026; **FIXED 14 May 2026 PM-104** (commit `361b44dc` on vyve-site main). Fix outcome resolves PM-97 and is the proof point for the API addendum below.

**Addendum (PM-104, 14 May 2026 daytime — API discipline behind the rule).** This rule names the WHAT (rehydrate before paint) but not the HOW. PM-97's first fix attempt followed the rule and still shipped broken. The reason: `VYVESync.hydrate()` is **idempotent within a session** — it returns the page-boot `hydratePromise` from cache, so a second `await window.VYVESync.hydrate()` resolves immediately with the original boot's result and performs no new pulls. A reset gesture that clears tables and then awaits `hydrate()` will return instantly with stale state; the reload then fires against empty Dexie. The fix is to use **per-table `VYVESync.hydrateTable(tableName)`** for each table the post-reload paint will read — `hydrateTable()` calls `pullOneTable` directly each invocation, bypassing the memoised promise. Hard rule extension:

> Any post-clear rehydrate MUST iterate the relevant tables via `VYVESync.hydrateTable(t)` per table, NEVER `VYVESync.hydrate()` alone. The latter is page-boot-scoped and a no-op on second call.

PM-97's shipped fix awaits `hydrateTable()` for `members`, `member_habits`, `workout_plan_cache` in sequence, then reloads. Failure on any table blocks the reload and surfaces a user-facing error. The same shape applies to any future reset path (admin dev tools, persona-switch flow if it ever resets state, etc.) — search for callers of `VYVELocalDB.<table>.clear()` or `_sync_meta.set(table, 0)` and ensure each one uses the per-table API.



### §23.8 — Timezone correctness audit pending: codebase is BST-locked, needs to be device-local (logged 14 May 2026, PM-100 follow-up)

**Status:** AUDIT PENDING. Documented as known-gotcha to prevent further BST-locked code being shipped. Fix carried as backlog item.

**The problem (surfaced by Dean, 14 May 2026):** the codebase mixes two date-source approaches inconsistently. `bstToday()` is a UK-hardcoded function in 8 files (`habits.html`, `cardio.html`, `wellbeing-checkin.html`, `monthly-checkin.html`, `movement.html`, `home-state-local.js`, `workouts-session.js`, plus copies in `nutrition-setup.html` and `healthbridge.js`) that adds +60 minutes during DST and treats `bst.toISOString().slice(0,10)` as today. This gives the wrong date for any member outside UK:
- Australian member at 10am AEST sees today = UTC date, often a day BEHIND their wall clock during evening logging
- US east coast member at 9pm EST sees today = next day's UTC date if BST adds +60
- Even UK members visiting another timezone get the wrong "today"

Date FORMATTING is separately wrong: 20+ files use `toLocaleDateString('en-GB', ...)` to format display dates. That's device-local in terms of clock but always displays in UK format regardless of member preference. Not a correctness bug like `bstToday` but inconsistent.

**The fix shape (to be applied during the audit sweep):**

1. **Replace `bstToday()` with a shared device-local helper.** Conceptually:
   ```javascript
   function deviceLocalToday() {
     const d = new Date();
     return d.getFullYear() + '-' +
            String(d.getMonth() + 1).padStart(2, '0') + '-' +
            String(d.getDate()).padStart(2, '0');
   }
   ```
   This is what the member's wall clock shows. UK winter, UK summer, Australia, US — all correct. Place the helper in a shared module (probably `vyve-time.js` or fold into an existing shared file) so every page uses one implementation.

2. **Audit every `bstToday()` call site** and replace. Currently 8 files × ~2-6 calls each. Most are inside cache-keying, activity-date payloads, and the visibility/midnight rollover handlers we just shipped in PM-100.

3. **Server-side implication: `activity_date` in writes is now device-local, which is what we want anyway.** The member's perception of "I logged this on Wednesday" matches the row's `activity_date`. Reporting/analytics that aggregate across timezones can use `created_at` (UTC) when needed. NO database migration required — `activity_date` is already a `date` column with no timezone; sending the device-local date string is exactly the correct shape. Verify before shipping that no Edge Function applies BST-specific date math to `activity_date` server-side (likely zero — the column is treated as opaque).

4. **Replace `toLocaleDateString('en-GB', ...)` with locale-respectful formatting** where the display text matters. For most internal pages this is cosmetic; for member-facing "Friday 14 May" headers, use `toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })` so members see their device's locale formatting. Lower priority than the `bstToday()` correctness bug — can ship in the same audit sweep.

5. **Member timezone display (optional polish):** consider stamping the member's IANA timezone (`Intl.DateTimeFormat().resolvedOptions().timeZone`) onto the `members` row at first login. Useful for analytics ("when does this member log activities?") and for any future server-driven date logic (cron reminders that fire at the member's local 9am, not 9am UTC). Not strictly needed for the correctness fix.

**Until the audit ships:** treat any new code that touches "today" as a §23.8 obligation. New page or new feature → use device-local from day one, do NOT add another `bstToday()` import or copy the BST helper into a new file. The audit will retire the existing call sites in a single sweep; new code should not extend the surface area.

**Audit signal for future work:** `ripgrep "bstToday|isDST|toLocaleDateString\('en-GB'"` across vyve-site shows the full current footprint. Run this at the start of the audit session to get a fresh count.

**Estimated audit scope:** Half-day Claude minimum. 8 files for `bstToday` replacement (the correctness fix) and the locale formatting clean-up sweeps another 20+ files but is mechanical find-and-replace once the helper is in place. SW cache key bump on every touched HTML.

**Field-test confirmation (14 May 2026 ~00:01 BST):** Dean's iPhone screenshot captured the exact bug §23.7.7 documented and PM-100 fixed. App had been backgrounded across midnight (13→14 May). On resume, habits.html still rendered "11 of 11 done today" for Thursday using Wednesday's logsToday because `todayStr = bstToday()` was captured once at `loadHabitsPage()` and never re-evaluated. Home page correctly showed empty pill (different `todayStr` capture point — surfaces disagreed on what "today" means). PM-100's `vyveHabitsMidnightWatch()` IIFE on visibilitychange/focus is the right fix for habits.html; same pattern must extend to cardio, wellbeing-checkin, monthly-checkin, nutrition, log-food when §23.7.7 audit sweep runs. Confirms the rule is non-theoretical.

### §23.9 — `auth.users` INSERT via SQL must default token columns to empty string, never NULL (logged 14 May 2026, PM-103)

**Status:** HARD RULE. Codified after the test1@test.com / test@test.com provisioning session (14 May 2026 ~01:00 BST).

**The bug.** Creating Supabase auth users via raw SQL (instead of the Auth Admin API) requires populating `auth.users.encrypted_password` with `crypt(password, gen_salt('bf'))` and explicitly setting `email_confirmed_at`, `aud='authenticated'`, `role='authenticated'`, plus an `auth.identities` row. All standard. The non-obvious gotcha: gotrue's signin path string-ops on FOUR token columns that are technically nullable in the schema but treated as empty strings by gotrue:

- `confirmation_token`
- `recovery_token`
- `email_change_token_new`
- `email_change`

If any of those are left NULL on the inserted row, gotrue returns `400 "Database error querying schema"` to the client on every signin attempt — making the account appear broken even though the password is valid and the row exists.

**The fix shape.** Either set the columns to `''` in the INSERT, or run a post-INSERT UPDATE:

```sql
UPDATE auth.users
SET confirmation_token = COALESCE(confirmation_token, ''),
    recovery_token = COALESCE(recovery_token, ''),
    email_change_token_new = COALESCE(email_change_token_new, ''),
    email_change = COALESCE(email_change, '')
WHERE email IN (...);
```

**The lesson.** The Auth Admin API would set these correctly. SQL-only provisioning is fine for test accounts and seeding but every future invocation MUST set these four columns to `''` explicitly. Brain commit memory entry "auth.users INSERT via SQL: token columns must default to '' not NULL" carries the rule forward.

**Affected only by manual provisioning paths.** Real members onboarding via Stripe → onboarding EF v37 → `auth.admin.createUser()` get the correct defaults from gotrue itself. This is exclusively a manual-seed-via-SQL gotcha.

### §23.10 — Offline-equivalent operation is the contract, not a feature (logged 14 May 2026, PM-103)

**Status:** ARCHITECTURAL CONTRACT. Codified after Dean's canary walk on test1@test.com (14 May 2026 evening) surfaced that the app currently fails to open at all when offline. The Premium Feel campaign scoped local-first reads/writes; it did NOT scope offline-equivalent operation explicitly. This rule closes that gap.

**The contract.** Once a member has logged in successfully at least once, the app must function fully offline for every surface that doesn't strictly require the network. There is no "offline mode" with reduced functionality; offline is the same mode, just with network-bound surfaces showing honest offline states.

**Surfaces that MUST work offline (no exceptions):**

- Cold-boot to home page paint in under 2 seconds with zero network calls awaited.
- Nav between pages. Every page boot is offline-safe.
- All Dexie-wired data reads: home dashboard, habits, workouts, cardio, nutrition, settings, certificates view (already-earned), engagement score (computed client-side), achievements (already-earned).
- All Dexie-wired data writes: habit ticks, workout logs, cardio logs, weight entries, food entries, persona changes, theme toggle, habit add/remove via settings.
- Offline writes queue visibly with a "saved locally, will sync" affordance. PF-4 sync engine already has the queue infrastructure (`_sync_queue` table); the UI surface is missing.

**Surfaces that MAY require network — must show honest offline state, not blank or hung:**

- Sessions schedule listing (server-driven calendar).
- Live session chat (Supabase Realtime — needs connection).
- Leaderboard (cross-member aggregate compute, server-side).
- AI moments: weekly check-in submit (Anthropic call), monthly check-in submit, running plan generation, persona switches that trigger re-generation.
- Cron-driven content (newly-earned certificates after server cron fires).

**Required engineering primitives:**

1. **Boot chain must be offline-safe end-to-end.** Every `await` between page load and `vyveSignalAuthReady` event MUST tolerate network failure. `auth.js` session restore reads the locally-persisted Supabase session FIRST, paints from it immediately, and only attempts server-side token refresh as a background non-blocking step. PostHog `posthog.init` must NEVER block paint — wrap in a non-awaited promise or load lazily after auth-ready.
2. **Service Worker offline navigation strategy.** `sw.js` must serve cached app shell for navigation requests when the network fails. Currently configured as network-first with no offline fallback for navigation — must shift to cache-first OR network-falling-back-to-cache for HTML routes. Asset cache must include every wired-page's HTML + its critical inline JS dependencies.

2a. **SW urlsToCache must include EVERY runtime-loaded script the app fetches** — not just the ones referenced via `<script src>` tags in HTML. This rule discovered in PF-14c (PM-105, 14 May 2026). Scripts injected dynamically by other scripts (e.g. `auth.js` injecting `<script src="/supabase.min.js">`, `db.js` injecting Dexie) MUST be in `urlsToCache` despite never appearing in HTML head. When they're missing, offline cold-boot fails because `caches.match()` misses, the SW handler falls through to `fetch()`, the fetch throws, and WKWebView's behaviour for a rejected `respondWith()` is inconsistent — sometimes firing `script.onerror`, sometimes hanging silently. A hung `await` in the boot path leaves `#app` at `display:none` forever. Audit signal: grep all `.js` files for `document.createElement('script')` or `appendChild` patterns and confirm every injected `src` is in `urlsToCache`.

2b. **No cross-origin runtime dependencies in the critical path.** Discovered same campaign (PF-14c). The SW fetch handler skips cross-origin requests (`if (url.origin !== self.location.origin) return;` is the correct policy — you can't cache other people's CDN), which means any runtime `<script src="https://cdn.somewhere">` injection will fail offline regardless of `urlsToCache` configuration. Vendor every critical-path dependency locally. Dexie was on `cdn.jsdelivr.net` until PM-105; vendored to `/dexie.min.js` (94KB) as part of the PF-14c fix. Cross-origin dependencies are acceptable ONLY for non-critical-path features that have their own offline UX (PostHog telemetry, fonts that have local fallbacks). Critical path = anything `await`ed in any page's boot before `vyveSignalAuthReady`.
3. **Per-page boot must be offline-resilient.** No `await fetch(...)` in any page's initial paint path. All reads go through `VYVELocalDB.<table>.allFor(email)` first; REST is fallback only when Dexie has nothing. Already a §23.7.1 rule but worth restating as part of the offline contract.
4. **Offline-bound UX states must exist as first-class affordances.** "Connect to view live sessions", "Leaderboard refreshes when you're online", "Your check-in is saved and will submit when connection returns" — all need to ship before launch as designed components, not gracefully-degrading-into-blank.
5. **`navigator.onLine` is a HINT, not gospel.** Combined with actual fetch failure detection. Many devices report `onLine = true` when on a captive portal or weak signal that drops fetches.

**Audit signal:** turn iPhone airplane mode on after a successful login. Cold-boot the app. Nav between pages. Every Dexie-wired surface must paint identically to online state. Every network-bound surface must show a designed offline affordance, not a blank.

**Sequencing within the Premium Feel campaign.** PF-14c carries the offline-cold-boot diagnostic and fix. PF-14d carries the offline-nav SW work. PF-14e carries the per-page offline-bound UX states. All are P0 LAUNCH BLOCKER alongside PF-14b bundled-mode migration. None can be deferred to post-launch — the moment a Sage employee opens the app on the Tube and sees black, the trial is over.

### §23.5.1 — Member-dashboard EF latency is the dominant client-perceived perf bottleneck (PM-67 ship night, 12 May 2026)

Discovered 12 May 2026 mid-session: member-dashboard EF v67 execution_time_ms regularly hits 17-38 seconds server-side. This is the dominant cause of the "everything feels slower" regression Dean reported the night of 12 May despite three client-side ships (PM-66 + PM-67a + PM-67d, 14 files). Client-side defer/paint-dispatch/Promise.all optimisations save 50-250ms per surface. The EF wastes 30,000-40,000 ms. **Fix the backend before shipping more client-side polish.**

Investigative facts that ANY future perf work must respect:
1. Logs at 12 May ~21:30-22:30 UTC: member-dashboard 38585/37640/36147/22708/22642/22546/17984/17966/17211 ms; notifications 24504/12037/5601 ms; monthly-checkin POST 18565 ms; wellbeing-checkin POST 12939 ms; log-activity POSTs 8961/10973/7886 ms. **All non-cron client-facing EFs are slow, not just member-dashboard.**
2. PM-13 parallelised the 23 INLINE achievement evaluators in `_shared/achievements.ts`. PM-17 cut 4 of 5 this-week queries by reading from `member_home_state`. Both LIVE in v67. The 30-40s ceiling persists despite them — bottleneck is deeper than per-EF code.
3. `warm-ping` EF is deployed and running (3 calls visible in tonight's logs: 2949/1993/411 ms) — does NOT prevent the observed cold-start latency.
4. Likely real causes to investigate in order: (a) Supabase Pro EF cold-start behaviour for West EU Ireland; (b) PostgREST connection pool exhaustion under 18-wide Promise.all + 23-wide inner achievements parallel in the same EF invocation; (c) `refresh_member_home_state` RPC synchronous fallback path when member_home_state row missing; (d) missing indexes on `member_email + activity_date` style queries hit across daily_habits/workouts/cardio/session_views/replay_views; (e) RLS evaluation overhead though EF uses service-role.
5. Full member-dashboard EF v67 source + _shared/achievements.ts + _shared/taxonomy.ts + full EF log dump loaded in transcript `/mnt/transcripts/2026-05-12-20-45-33-vyve-pm66-pm67a-pm67d-ship-night.txt`. Use it before re-fetching.
6. Layer 5 baseline capture impossible until perf.js gets the `record('perf_active', 1)` sentinel + navigation-timing fallback fix (PM-67e queued). Without baseline numbers, any perf claim before/after a fix is qualitative.



### §23.5.2 — Resolution of §23.5.1: member_home_state refresh is now dirty-flag, not inline-on-write (PM-68 + PM-69, 12 May 2026 PM)

The §23.5.1 bottleneck was diagnosed and shipped this session. Root cause was NOT EF cold-start, NOT PostgREST pool exhaustion, NOT missing indexes — it was 9 `AFTER ROW EXECUTE FUNCTION zzz_refresh_home_state` triggers calling the ~20 KB plpgsql `refresh_member_home_state(p_email)` synchronously inline in every writer's transaction, doing ~40 aggregations against the same hot tables every concurrent reader was trying to read. Writers held row locks on `member_home_state`; readers queued behind them.

**The new shape, codified as a hard rule for all future server-side perf work:**

1. **Aggregation refresh must NEVER be inline in a writer's transaction if the aggregation touches tables other writers also lock.** The default pattern is dirty-flag + on-demand read-side refresh + cron drain for idle rows.
2. **AFTER STATEMENT + transition tables (REFERENCING NEW TABLE / OLD TABLE) for dirty-flag triggers.** Lets `INSERT…ON CONFLICT` collapse bulk writes into one upsert per affected member. AFTER ROW triggers with `FOR EACH ROW` are forbidden for any trigger that does more than a few microseconds of work.
3. **Read-side refresh pattern:** EF calls a SECURITY DEFINER plpgsql function that does `EXISTS(dirty queue)` → refresh-if-dirty → clear-dirty → read state in one SQL round trip. Idempotent under concurrency (last-write-wins via UPSERT in refresh fn).
4. **Cron safety net for idle members:** every dirty-flag pattern must ALSO have a cron that drains the queue (`*/5 * * * *` is the default cadence). Otherwise rows for idle members never refresh.
5. **Whole-aggregate caches (the kind that are the same value for every member) belong in `platform_counters` and get folded into per-request RPCs as synthetic fields (e.g. `__charity_total`)** — NOT called separately from the EF.

**Verified numbers from this session (real members, warm cache, EXPLAIN ANALYZE):**
- `refresh_member_home_state_if_dirty` clean path: 2.4 ms.
- `refresh_member_home_state_if_dirty` dirty path (full refresh + flag clear): 32 ms.
- `member_home_state_get_fresh` (unified RPC): same cost class — one PostgREST round trip total.
- Full drain of 15 members: 426 ms.

Audit method for any whole-tree trigger or aggregation work going forward MUST follow §23's recursive-tree audit rule (no pre-selected subsets) and verify against `pg_trigger` directly, not `information_schema.triggers`.

- **Page-local optimistic cache patch for non-home-state Layer 4 surfaces (added 11 May 2026 PM-60).** Not every Layer 4 surface has a column in `member_home_state`. Weight logs (`weight_logs` table) aren't tracked there — engagement scoring has no weight component per PM-37; the member-dashboard EF doesn't read weight fields. For these surfaces, the Layer 4 contract still applies but the patch target is the page-local cache (`vyve_wt_cache_<email>` for nutrition; future `vyve_food_log_cache_<email>` and similar for log-food.html). Helpers live in the page itself, NOT in `vyve-home-state.js` — that library's scope is the shared home cache (`vyve_home_v3_<email>`). Page-local helpers MUST implement the same shape: `_patch<Surface>CacheOptimistic(opts) → snapshot` BEFORE publish; `_revert<Surface>CachePatch(opts, snapshot)` on `<event>:failed`. For UPSERT-natural-key surfaces (weight_logs, food_logs, daily_habits via upsert paths), the snapshot MUST capture the prior row state — UPDATE case has a `priorKg`/`priorValue` to restore, INSERT case removes the entry. Without snapshot capture, the revert can't distinguish "this row was new" from "this row overwrote a prior value", and the revert math is wrong. First cleanly-worked example is PM-60 nutrition.html's `_patchWtCacheOptimistic` returning `{priorKg, priorExisted}` and `_revertWtCachePatch` branching on `snapshot.priorExisted`. The vyve-outbox-dead window listener pattern from PM-59 habits.html carries over for these surfaces too — inflight tracker entries store the snapshot so the dead-letter path's `<event>:failed` publish has the data needed to revert.

- **Skip the post-save server re-fetch when an optimistic patch IS canonical (added 11 May 2026 PM-60).** Pre-Layer-4 the user-initiated save caller (`logWeight` at L1337 in nutrition.html, similar shape on other surfaces) awaited the writeQueued POST and then re-fetched server state via `_cachedX = await loadXLogs()` to refresh the in-memory cache. In the writeQueued queued path (5xx/network), that re-fetch wipes the optimistic patch — the row is in the outbox, not yet in the DB, so the server response doesn't include it. Premium-feel-wise, the user briefly sees the row, then it disappears (the re-fetch overwrites), then it comes back when the outbox flushes — visibly worse than no Layer 4 wiring at all. **Discipline**: every Layer 4 surface migration MUST audit the caller-side flow for post-save re-fetches and replace them with `_cachedX = loadXCache()` from the just-patched local cache. The cache patch IS canonical for the row we just wrote; rows from other sources (cross-tab, cross-device) arrive via Layer 2 realtime echo through the surface's bridge. Revert path restores via the snapshot in `<event>:failed`. Side benefit: zero extra network round-trip per save. Surfaces with this pattern to audit on migration: log-food.html (similar `loadFoodLog()` post-save?), workouts family (`loadSessions` / `loadWorkouts` post-save?), monthly-checkin.html (likely none — server-side EF response is the canonical source). Verify on read.

- **writeQueued return shape carries failure-class discriminators (added 11 May 2026 PM-59).** `VYVEData.writeQueued(args)` returns `{ok, queued, status, response?, item, dead?, retry?, threw?}` where the field combinations encode the failure class for Layer 4 callers:
  - 2xx success → `{ok:true, queued:false, status, response, item}`
  - **DELETE-404 → `{ok:true, queued:false, status:404, response, item}`** (treated as idempotent success at first try AND at outboxFlush retry — covers cross-device DELETE races where the other device already removed the target row).
  - 4xx (other than DELETE-404) → `{ok:false, queued:false, status, response, item, dead:true}` — NOT queued, NOT retried; the caller must fire `<event>:failed` eagerly to trigger the page's revert subscriber.
  - 5xx / network throw / offline → `{ok:true, queued:true, status?, item, retry:true, threw?}` — the item is in the outbox, will be retried by outboxFlush, may eventually dead-letter; the caller should register an inflight tracker entry for `vyve-outbox-dead` correlation.

  outboxFlush short-circuits 4xx items to dead-letter without consuming the `MAX_SERVER_ATTEMPTS` retry budget (otherwise a 422 would burn N retries that will never succeed). Backward-compat: existing callers that only check `.ok` and don't capture the return continue to behave identically for 2xx and 5xx/network paths — only the new 4xx-eager path requires opt-in. **Layer 4 writeQueued-surface migration discipline**: every Layer 4 surface migration that uses writeQueued MUST capture the return value and branch on `dead:true` (eager fire `<event>:failed`) vs `queued:true` (register inflight tracker keyed by synthetic_key or client_id, await `vyve-outbox-dead`).

- **`vyve-outbox-dead` CustomEvent carries `detail.items[]` payload (added 11 May 2026 PM-59).** Pre-PM-59 shape: `new CustomEvent('vyve-outbox-dead')` — bare event, no payload. New shape: `new CustomEvent('vyve-outbox-dead', {detail: {items: [...]}})` where each item is the dead outbox entry plus `last_status` (HTTP status of the final failing response) and `dead_reason` (`'http_4xx'` for short-circuit dead-letter, `'max_attempts'` for retry-budget exhausted). Subscribers correlate dead items to their page-scoped inflight trackers via table + body fragments — for POST writes, extract the page's identifying field (e.g. habit_id, client_id) from `JSON.parse(item.body)`; for DELETE writes, extract from `item.url` query string (`habit_id=eq.X`). Pre-PM-59 bare-event subscribers (none in the live portal before PM-59) still receive the event; the PM-59 habits.html listener has a legacy-fallback branch that ages out inflight entries past 5min when `detail` is absent (covers a hypothetical rollback). Forward-compat: every Layer 4 writeQueued-surface migration MUST register inflight trackers on `queued:true` returns AND prune them on success/revert/dead-letter to keep the page-scoped map bounded.

- **Sign-aware optimisticPatch + revertPatch for surfaces with both forward and backward writes (added 11 May 2026 PM-59).** `VYVEHomeState.optimisticPatch(type, opts)` and `revertPatch(type, opts)` accept `opts.sign` (+1 forward write, -1 undo write). Defaults: `optimisticPatch.sign = +1` (PM-58 cardio shape — forward-only surfaces don't need to change); `revertPatch` flips the original sign (`origSign = opts.sign === -1 ? -1 : +1`; `revertSign = -origSign`). The publish envelope MUST carry `original_sign` so the `<event>:failed` revert subscriber knows which direction to flip — without it, an undo-then-failed-undo would revert in the wrong direction (pushing the row count negative-via-floor, off by 2 from where it started). Surfaces with both write directions: habits.html (logHabit +1 / undoHabit -1 / autotick +1); log-food.html when wired (food:logged +1 / food:deleted -1). Forward-only surfaces (cardio, sessions, weights, wellbeing/monthly checkins, workouts) can omit the sign parameter. `applyDelta` walks `last_*_at` and `last_activity_at` forward only — sign<0 paths intentionally leave timestamps alone; the next member-dashboard fetch corrects them. Deliberate simplicity-vs-perfection tradeoff documented in vyve-home-state.js applyDelta comment.

- **Page-scoped inflight tracker discipline for writeQueued Layer 4 wirings (added 11 May 2026 PM-59).** Every writeQueued publish site that emits `kind:'canonical'` MUST maintain a page-scoped `_<surface>Inflight` map for `vyve-outbox-dead` correlation. Entry shape: `{<id_field>, logged_at, original_sign, enqueued_at, ...optional_metadata}`, keyed by whatever the table's bridge `recordWrite` uses (synthetic_key for return=minimal surfaces; client_id for UUID-bearing surfaces). Entries registered on writeQueued `queued:true` return; pruned in three places:
  1. **On success** — the bus subscriber for the same event (origin-agnostic — local, remote, and realtime all drain the tracker) checks `envelope.synthetic_key` or equivalent and removes the entry.
  2. **On revert** — the `<event>:failed` subscriber removes the entry after applying revertPatch.
  3. **Defensively on age** — the `vyve-outbox-dead` legacy-fallback branch (no detail payload) ages out entries past 5min as a final safety net.

  Without the inflight tracker, the page can't correlate a `vyve-outbox-dead` event back to which logical action died — meaning the revert wouldn't know what to undo. habits.html `_habitInflight` is the first instance (PM-59); future Layer 4 writeQueued-surface migrations extend the same pattern with their own page-scoped map names. The map is module-level (declared at the top of the page's script alongside other globals like `memberEmail` / `todayStr`).

- **DELETE-404 is idempotent success at every layer of the write pipeline (added 11 May 2026 PM-59, expanded by the cross-device habit-undo race scenario).** A DELETE request returning 404 means the target row doesn't exist — which is the intended end-state of the DELETE. Treating that as a failure (queueing for retry, eventually dead-lettering, firing `<event>:failed`, reverting the optimistic state) produces backwards user-visible behaviour in cross-device races: device A undoes a habit (row deleted), device B undoes the same habit a moment later, B's DELETE returns 404, without explicit handling B's UI reverts to show the habit as logged. PM-59 codifies the semantic at both writeQueued (first try) and outboxFlush (retry) — `if (resp.status === 404 && item.method === 'DELETE') continue;` short-circuits the failure path to success. Discipline: every Layer 4 surface that emits DELETE writes (log-food.html food:deleted, potentially others) inherits this treatment for free via vyve-offline.js; no per-surface code needed beyond the standard publish + tracker + revert pattern.

- **Layer 4 client-side cache patching beats round-tripping log-activity for home_state (added 11 May 2026 PM-58).** log-activity v29 returns a `home_state` row on every success branch (insert, cap-skip, evaluate_only), but routing writing surfaces through log-activity to consume it costs 200-800ms of EF cold-start latency vs ~50µs of local math. The `TYPE_TO_HS_COLS` mapping (which columns to increment per activity type) is short, bounded, and stable — duplicating it in `vyve-home-state.js` is the right call. When `member_home_state` gains a column the client doesn't know about, the client patch leaves the column alone and the next member-dashboard fetch overwrites the row in full. Worst case is one stale column for ~30 min cache TTL — acceptable for the speed gain. **Discipline**: any update to log-activity v29's `getHomeStatePatched` `TYPE_TO_HS_COLS` map MUST be paired with the same edit in `vyve-home-state.js`. Both files name the mapping identically and comment-flag the pairing. Premium-feel architecture imperative: every ms of network latency on the optimistic path degrades the tap-to-paint contract; option (c) direct client-side patching is the only Layer 4 interpretation consistent with that contract.

- **`kind:'canonical'` payload discriminator for cache-patched envelopes (added 11 May 2026 PM-58).** Publishing surfaces that have already patched `vyve_home_v3_<email>` via `VYVEHomeState.optimisticPatch` BEFORE publishing the bus event MUST set `kind:'canonical'` on the envelope payload. The `_markHomeStale` subscriber on index.html fast-paths on `envelope.kind === 'canonical'` — it skips the `invalidateHomeCache` wipe because the optimisticPatch has already written post-write truth into the cache. Without the gate, the subscriber would discard the patch and revert to the pre-Layer-4 fetch-and-wait paint. `kind` is a **payload-level discriminator**, NOT a new envelope origin — origins remain `local`/`remote`/`realtime`/`realtime-resync`. Any new origin-agnostic subscriber wired post-PM-58 (cache-stale handlers) MUST also gate on `envelope.kind !== 'canonical'` if its handler wipes a cache the canonical publish has patched. This is the second payload-level discriminator on the bus alongside Layer 2's various `kind: 'live' | 'flush' | 'realtime' | ...` distinctions — same shape, different semantic axis.

- **`recordCanonical(table, pk)` discipline for canonical publishes (added 11 May 2026 PM-58).** Every publish site that emits a `kind:'canonical'` envelope MUST call `VYVEBus.recordCanonical(table, pk)` IMMEDIATELY before the publish (and after any existing `recordWrite` call). The bridge layer drops Realtime echoes (origin `realtime` AND `realtime-resync`) for the same `(table, pk)` on the writing device only, for `CANONICAL_SUPPRESS_TTL_MS=10000` (vs `SUPPRESS_TTL_MS=5000` for the recordWrite path). Without the call, the writing device's own realtime echo would arrive 1-2s later carrying no canonical payload, re-firing `_markHomeStale` subscribers and wiping the cache the canonical publish just patched. The 10s TTL covers initial echo plus any subsequent `realtime-resync` replay PM-57 might fire during that window. Map is distinct from `recentWrites` (different TTL, different invariant). Other devices have no canonical to protect and process the echo normally (their `_markHomeStale` will fire and wipe their home cache as before — same behaviour as PM-46..PM-55). Layer 4 audit-count baseline adds `VYVEBus.recordCanonical(=N` (one per Layer 4 surface migration).

- **`<event>:failed` revert path with eager-on-direct-fetch / deferred-on-outbox failure dichotomy (added 11 May 2026 PM-58).** Publishing surfaces wire a `<event>:failed` revert path so the optimistic patch is undone when the POST fails. Discriminator is HTTP status, not error class:
  - **Direct-fetch surfaces** (cardio.html shipped PM-58; movement.html for cardio + workout publishes likely next session): fire `<event>:failed` regardless of HTTP status — any non-ok response is terminal from the page's perspective, no retry mechanism behind the fetch.
  - **writeQueued/outbox surfaces** (habits.html, log-food.html, nutrition.html, wellbeing-checkin.html, monthly-checkin.html — when wired post-PM-58): 4xx → fire `<event>:failed` eagerly on the first non-ok response (4xx never becomes 2xx no matter how many retries, sitting on the optimistic state through retries that won't help is the lie); 5xx or network throw → suppress eager fire and instead fire on `vyve-outbox-dead` window event only (5xx/network usually clears on retry, eager fire on transient failures would flicker the UI).

  Subscriber pattern: publishing page subscribes to its own `<event>:failed` and calls `VYVEHomeState.revertPatch(type, {loggedAt})`. index.html subscribes belt-and-braces and wipes the home cache so the next paint is guaranteed to re-fetch member-dashboard truth — protects against client-side revert math diverging from server-side reality (e.g. column added to `member_home_state` since the client `revertPatch` was authored). When the writeQueued surfaces start wiring Layer 4, the `writeQueued` return shape extension (adding `status` and `responseError` fields so the caller can distinguish 4xx from 5xx from network) lands at the same commit as the first writeQueued surface migration — likely habits.html next session.

- **Live-state whole-tree grep beats the brain narrative when a surface count drifts (added 11 May 2026 PM-58).** The PM-55 brain narrative said 23 `VYVEBus.publish(` call sites and 31 `VYVEBus.subscribe(` sites. PM-57 corrected subscribers to 33 (live whole-portal audit). PM-58 whole-tree grep at HEAD `5de6b6f5` found 24 publish sites (workouts-programme.js L394 `workout:shared` had been undercounted across both prior narratives) and 33 subscribers consistent with PM-57. Drift is bounded but real; the discipline is: **every Layer-N+ session that touches publishers or subscribers MUST run the §4.2 whole-tree audit primitive grep BEFORE committing AND correct the brain narrative in the same commit.** The pre-flight grep takes ~30s on the Composio workbench (parallel-fetch via live-SHA endpoint + regex pass across 70 source files filtered to .html + .js, excluding `.github/` and `internal-dashboard/`). This is cheaper than a downstream design call built on a wrong baseline.

- **Cache-version date convention drift resolution (added 10 May 2026 PM-44).** The `vyve-cache-v2026-05-09-pmNN-X-Y` pattern that carried date prefix `2026-05-09` from PM-30 through PM-44 represents a sequence-uniquifying token, not a wall-clock timestamp. The PM-NN suffix is what makes each version unique; the date prefix is a campaign-scoped namespace. PM-44 shipped at `2026-05-10 00:22 UTC` (post-midnight UK time) but uses the `2026-05-09` prefix because the campaign that started 09 May still owns this version namespace. **Convention going forward:** within a campaign, date is fixed at campaign-start; new campaigns get fresh date prefixes (the next major campaign — Layer 2 — should start its first commit with whatever date that commit ships on). This resolves the P3 carried item from PM-30..PM-43.

- **Real engagement scope-fix vs intentional non-touch classification (added 09 May 2026 PM-43).** When a new bus event publishes from a surface whose write affects server-computed engagement scoring (engagement.html's Variety / Activity / Consistency / Wellbeing components, all derived server-side and cached client-side as `vyve_engagement_cache`), the `engagement._markEngagementStale` subscriber MUST be wired (real scope-fix, closes a cache-staleness bug). When the surface has no engagement-scoring impact, the engagement subscriber is intentionally omitted (non-touch). The classification is determined by reading engagement.html's scoring components at pre-flight time and verifying whether the new write affects any of them. **Tell from PM-30..PM-43 audit:** engagement-touching events are all activity-logging surfaces (habits, workouts, sets, cardio, food, sessions, wellbeing); engagement-non-touching events are user-state surfaces (weight, persona, share, programme import, monthly check-in). Use this heuristic for future post-Layer-1 events: if the event represents "member did an activity X minutes/reps/grams worth", it touches engagement; if it represents "member changed their settings/preferences/social-state", it doesn't. PM-43's session:viewed was the first non-defensive engagement subscriber extension since PM-30..PM-32 — a useful checkpoint that the campaign's later-half migrations (PM-37+) targeted user-state surfaces while the earlier half targeted activity-logging surfaces.

- **Multi-event single-function migrations are valid (added 09 May 2026 PM-42).** When one function has semantically distinct branches that should fire distinct events, emit distinct event names per branch — not one event with discriminator. PM-42 `confirmImportPlan` emits `programme:imported` (isProg=true) and `workout:logged source:'builder'` (isProg=false) from one function. Per-branch race-fix and fallback discipline apply independently. **Schema test:** if branches differ in *source/origin/variant* of the same semantic action, use one event with discriminator (PM-36 food:logged kind:'search'|'quickadd'; PM-39 wellbeing:logged kind:'live'|'flush'; PM-41 workout:shared kind:'session'|'custom'|'programme'). If branches differ in *what semantic action is happening*, use distinct event names (PM-42: importing-a-programme vs saving-a-session-to-library are different actions). Reuse existing event schemas where the semantic action matches an established event (PM-42 session-save → PM-35 workout:logged source:'builder' precedent).

- **Server-side cron-driven write surfaces are out of scope for Layer 1c (added 09 May 2026 PM-42).** Layer 1c migrates direct-call client primitives at publishing sites. If the write happens server-side via cron (e.g. certificate-checker EF v9 generating certificates daily), the client has NO publish surface — there's no inline `evaluate`/`invalidate`/`record` call to migrate. Cross-tab/cross-device staleness for these surfaces is a Layer 2 concern (cache-coherence) or Layer 3 concern (server-push notifications), not Layer 1c. PM-42 dropped certificate from the campaign with this rationale; the active.md row 1c-13 was repurposed for `programme:imported` (a real Layer 1c surface with the missing-primitive bug fix). **The discriminator:** does the client invoke a write that fires inline cache primitives? If no, it's not a Layer 1c surface — punt to Layer 2 cross-tab cache-coherence work.

- **Migration template stability post-PM-36 (added 09 May 2026 PM-37-Setup).** Layer 1c migrations after PM-30..PM-36 follow a stable shape captured in `playbooks/1c-migration-template.md`. Pre-flight references the template rather than re-deriving the migration mechanics every session. Asymmetric / symmetric / mixed fallback decisions still require per-surface classification at pre-flight time, but the rationale is referenced via §23 sub-rules (PM-35 / PM-36 / PM-38) rather than re-narrated in each session. Companion rule: when a migration deviates from the template's standard shape (new race-fix discipline, new subscriber category, new commit topology), update the template in the same atomic brain commit so the next session's pre-flight reflects the latest pattern, not the legacy shape. The template has a stop-date — when 1c-14 + cleanup commit lands, the template is OBSOLETE and either gets archived or rewritten for the next campaign.

- **Deferred whole-tree audit (added 09 May 2026 PM-37-Setup).** Whole-tree primitive audits run AFTER the patch ships, in parallel with writing the brain commit, NOT as a pre-flight requirement. Pre-flight fetches only the files the migration explicitly touches (typically 2-4 files for a 1c migration; previously 73+ via whole-tree pre-flight). The audit-count classification discipline (PM-37 + PM-40) applies to the post-ship audit, not the pre-ship state. Trade-off accepted: slight risk of missing a publishing site that lives outside the pre-flight target file, mitigated by the post-ship audit catching it before the brain commit (so discovery cost = fast-fix, not regression). Reward: ~75% reduction in session pre-flight tool calls; sessions that used to ship 1-2 migrations can now ship 4-6 because the pre-flight tax dropped. Companion rule: post-ship audit is itself non-negotiable — if it surfaces a delta that doesn't match the migration's expected impact, investigate before brain-committing. The audit is moved, not skipped.

- **Session loading discipline (added 09 May 2026 PM-37-Setup).** "Load VYVE brain" routine reads `brain/active.md` (working set, ~42KB) + relevant playbooks (matched to session goal) + last 3 changelog entries via grep on `## 2026-` headers — NOT full master.md (305KB) or full changelog.md (744KB). Full files remain canonical for deep-history questions; the active file is the working set. If a question requires depth not in active.md, fetch the canonical file on demand using active.md §7 as the lookup table. Total load shifts from ~1.27MB to ~70-90KB per typical session — same architectural principle as the portal's stale-while-revalidate strategy: paint instantly from the working set, fetch canonical only when a question genuinely needs it. The rebuild trigger for active.md is post-1c-14 + cleanup commit, OR after 3+ sessions of incremental patching. Companion rule: every patch to active.md is atomic with the session's main brain commit; rebuilds get their own dedicated commit (full rewrite against current master.md, not incremental edit).

- **Audit-count discipline: count source-code call sites unconditionally (added 09 May 2026 PM-40, resolves the P3 ambiguity raised in PM-39 backlog).** When a symmetric-fallback migration moves an inline primitive call into an `if (!window.VYVEBus) { ... }` else-branch, the call site is still counted toward the publish-site primitive count for that page. The §23 audit-count classification rule (PM-37) is about source-code call sites at **static analysis time**, NOT runtime invocation paths. This preserves methodological symmetry with the pre-bus baseline: a symmetric-fallback migration that doesn't add or remove primitives produces the same primitive count as before (the call moved branches but didn't go away). The discriminator: **does the line of source code contain a call to one of the four primitives, after applying the existing exclusions (comments, typeof guards, function definitions, object property keys)?** If yes, it counts — regardless of whether it sits inside `if (!VYVEBus)`, `if (something)`, or no guard at all. Resolves the P3 ambiguity raised in PM-39 backlog. Practical implication: PM-30..PM-40 audit counts are stable under this discipline (no methodology drift); future migrations preserve the convention.

- **Per-surface race-fix ordering for queue-drain surfaces (added 09 May 2026 PM-39).** The standard Layer 1c race-fix pattern (`bus.publish` lands BEFORE the fetch) applies only to surfaces that initiate a write. **Queue-drain surfaces** — where the publish is conditional on `res.ok` of a re-fired request that may fail and re-queue (e.g. `flushCheckinOutbox` draining `vyve_checkin_outbox` after the device comes back online) — publish AFTER `res.ok` confirms server-side write. Publishing optimistically on a queue drain would claim cache-stale on a check-in that hasn't actually been written server-side yet — broken semantics if the flush fails and the queue retries. The discriminator: **does the publish initiate the write, or does it confirm a write that already happened?** Initiator → publish-before-fetch (PM-33..38 + PM-39 live submitCheckin pattern). Confirmer → publish-after-res.ok (PM-39 deferred flushCheckinOutbox pattern). Future queue-drain migrations (any deferred flush of queued POSTs that re-fires the EF on the `online` event or page-load) must follow this discipline. The pattern preserves the queue-retry semantics: failed flushes leave the queue intact AND do not fire publish, so subscribers don't see false cache-stale signals on a check-in that didn't actually land server-side.

- **Asymmetric fallback for cache-staleness gap migrations (added 09 May 2026 PM-38, codifying the pattern from PM-35 + PM-36-deleteLog).** When a publishing site has ZERO pre-bus primitives but the bus path is genuinely closing a cache-staleness bug, the asymmetric fallback (no inline primitives in the `!VYVEBus` else-branch) is the correct shape. The bug fix lives in subscribers; the fallback preserves pre-bus zero-primitive semantics exactly. This is now an established pattern, not an exception. Three migrations confirm: PM-35 (`workouts-builder.js` — bus path adds invalidate + record + eval via subscribers; fallback preserves evaluate-only-on-old-flow), PM-36 `deleteLog` (bus path adds home-stale + engagement-stale via subscribers; fallback preserves zero primitives — the home dashboard's calorie ring + engagement_cache score were genuinely broken pre-PM-36), PM-38 (bus path adds members-cache + home-stale via subscribers; fallback preserves zero — nutrition.html persona-driven protein copy was genuinely stale pre-PM-38). The pre-flight discriminator from PM-35 still applies: ask "what was firing pre-bus at this publish site?" If zero, asymmetric. If something, symmetric. Distinguishes from sites where pre-bus already had primitives that just need mirroring (PM-30/31/32/33/34/37 — symmetric). For asymmetric migrations the changelog must explicitly document: (a) what cache-staleness bug existed pre-bus, (b) which subscriber closes it, (c) why the fallback intentionally does NOT add the missing primitives. PM-38 elevates this from recurring per-commit footnote to hard rule.

- **Self-subscribe pattern for page-owned achievement journeys (added 09 May 2026 PM-37).** When a publishing page owns the achievement track for its own event (nutrition.html owns weight tracking, workouts.html owns workout/set tracking, log-food.html owns nutrition tracking, etc.), the publishing page self-subscribes to its own event for `VYVEAchievements.evaluate()`. This is cleaner than wedging eval into the publishing function's symmetric-fallback else-branch, and gets cross-tab eval coherence for free (tab B's open page picks up freshly-earned tiers when tab A logs). Pattern: `document.addEventListener('DOMContentLoaded', () => { if (!VYVEBus || __vyveXBusWired) return; __vyveXBusWired = true; VYVEBus.subscribe('event:name', () => VYVEAchievements.evaluate()); });`. Idempotency flag is per-page (`__vyveNutritionBusWired`, `__vyveSettingsBusWired`, etc.). PM-37 established the pattern on nutrition.html for `weight:logged`. Future 1c migrations on pages that own achievement journeys (1c-9 settings persona-switch may need it for any eval; 1c-10..1c-14 onwards) should use this pattern rather than mixing eval into the publish-site if/else. Eval is debounced 1.5s in `achievements.js`, so over-firing across the bus path + the `!VYVEBus` fallback (during the deploy window when only some clients have bus.js) coalesces safely.

- **Audit-count classification — what counts as a publish-site primitive (added 09 May 2026 PM-37).** Resolves the P3 audit-count methodology recon (open from PM-35 close). A "publish-site primitive" is any non-comment, non-`typeof`-guard, non-function-definition line that contains a CALL to one of the four primitives: `VYVEData.invalidateHomeCache(`, `VYVEData.recordRecentActivity(`, `VYVEAchievements.evaluate(` (or `evaluateNow`), `VYVEBus.publish(` / `VYVEBus.subscribe(` (the latter two counted separately as bus-API primitives). Subscriber-internal calls count (they're real call sites at runtime). Comments and docblocks don't count (PM-26 source-of-truth discipline). Function definitions in `vyve-offline.js` etc. don't count (PM-28). `typeof X === 'function'` guard lines don't count (PM-32). Canonical post-PM-36 counts at HEAD `640c9d69`: invalidate/record/evaluate = **11/8/19**, publish/subscribe = **13/17**. Use these as the baseline for PM-38 pre-flight diff. Earlier "13/8/15" disagreement was a different methodology (likely included subscriber-internal duplicates from comments). The recon backlog item from PM-35 close is now CLOSED.

- **Layer 1c bus-fallback else-branches: MIXED shapes within one commit (added 09 May 2026 PM-36).** A single commit may legitimately ship symmetric fallback on some surfaces and asymmetric fallback on others, classified per-surface by what was firing pre-bus at that specific publish site (not per-commit). PM-36 was the first to do this: `log-food.html` shipped symmetric on both insert paths (logSelectedFood + logQuickAdd had pre-existing primitives mirrored in fallback) and asymmetric on the delete path (deleteLog had ZERO primitives pre-bus, fallback preserves zero). The same `!VYVEBus path semantically identical to pre-bus` invariant covers both shapes — what differs is what "pre-bus" means at each publish site. Pre-flight discipline: audit each publish site separately before deciding the fallback shape; do NOT assume a commit's fallback shape is uniform across surfaces. Document the per-surface decision in the changelog. The mixed-fallback case is structurally common — most pages in the remaining 1c migrations will have multiple publish sites with potentially different pre-bus primitive shapes.

- **Layer 1c bus-fallback else-branches: symmetric vs asymmetric (added 09 May 2026 PM-35).** When migrating a publishing site to `bus.publish` with a `!VYVEBus` else-branch fallback, distinguish at audit time whether the fallback is **symmetric** (PM-33/PM-34 pattern: pre-existing primitives present at the publish site → fallback mirrors them one-for-one to preserve prior shipping behaviour exactly; publishing-surface counts unchanged is correct) or **asymmetric** (PM-35 pattern: bus path closes a primitive gap that didn't exist at the publish site pre-bus → fallback intentionally does NOT add the missing primitives, since pre-bus didn't fire them either; the bus path IS the bug fix, the fallback preserves pre-bus semantics). The discriminator is what was firing pre-bus at the publish site, not what *should* have been firing. Document the fallback shape explicitly in the changelog so the asymmetry is searchable. Symmetric-fallback count discipline (PM-33 §23 sub-rule) still applies to symmetric migrations; asymmetric migrations may show publishing-surface count drops but will not in PM-35's specific case (the only pre-bus primitive was `evaluate`, preserved in the fallback). Future bus migrations must classify the fallback shape during pre-flight, not after the patch.

- **Layer 1c bus migrations DO NOT reconcile-and-revert on POST failure (added 09 May 2026 PM-33).** When a publishing site emits `bus.publish` optimistically before the POST fetch (PM-33 race-fix pattern), subscribers stale caches and fire achievements eval IMMEDIATELY. If the POST then fails (4xx/5xx/network), subscribers have already been told the activity happened. The cache-stale is fine — the next fetch returns truth (no row in the table) — but any breadcrumb-style optimistic state (e.g. `recordRecentActivity` 120s TTL) would be a minor lie until TTL. **This is intentional for Layer 1c.** Reconcile-and-revert paths (publish a `<event>:failed` event, subscribers undo state) are Layer 4 territory. The whole point of Layer 1c is to rename event surfaces with provable equivalence to today's behaviour, not to add new failure semantics. Future Layer 1c migrations that introduce optimistic publish-before-fetch must NOT smuggle in reconcile work; that gets its own session and its own taxonomy entries (`<event>:failed`, `<event>:retried`). Current Layer 1c failure-window staleness is bounded: home cache TTL is the next sign-in cycle, engagement cache TTL is 24h with PM-33 invalidation now firing on activity events (so a failed POST + successful retry self-resolves on the retry's publish), recordRecentActivity breadcrumb is 120s. Acceptable.

- **RLS policies MUST wrap auth functions in (SELECT ...) (added 08 May 2026 PM-8).** Bare `auth.email()` / `auth.uid()` / `auth.role()` / `auth.jwt()` in any RLS policy `USING` or `WITH CHECK` clause is a SEVERE performance bug. The functions are `STABLE` not `IMMUTABLE`, so without the subquery wrap Postgres re-evaluates them once per row AND inlines them into the query plan during planning. The result: 300-2000ms planning overhead per query at any non-trivial table size, plus per-row JWT decode. With the wrap `(SELECT auth.email())`, Postgres treats the result as an InitPlan and caches it for the whole query — auth function called exactly once. This is THE single biggest RLS perf knob and Supabase documents it explicitly: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select. The 08 May PM-8 migration `wrap_auth_functions_in_rls_policies` rewrote all 72 affected VYVE policies; future policies must follow the same pattern from creation. Pre-flight any new policy with `SELECT * FROM pg_policies WHERE tablename = '...'` and check `qual` / `with_check` — if they contain `auth.X()` not inside a `(SELECT ...)` subquery, fix before deploying. The semantic behaviour is identical (still scopes to authenticated user); only the timing changes.

- **Multiple permissive RLS policies for the same command are OR'd and double-cost (added 08 May 2026 PM-8).** `members` had three policies: `members_own_data` (ALL — covers SELECT, INSERT, UPDATE, DELETE), `members_select_own` (SELECT only), `members_update_own` (UPDATE only). All three were permissive, so on every SELECT against `members`, Postgres ran BOTH `members_own_data` AND `members_select_own` and OR'd the results. Each policy ran its own auth function eval — even after the wrap fix, that's two InitPlans where one would do. Dropped the redundants in the same migration. Pattern: when an `ALL` policy already covers all relevant commands, do NOT add per-command policies on top — they don't tighten security, they only add cost. If you genuinely need per-command differentiation (different qual for SELECT vs UPDATE), use a `RESTRICTIVE` policy or differentiate via a single ALL policy with command-aware logic. Most VYVE tables correctly have one ALL policy each — `members` was the historical outlier.

- **SW HTML caching strategy is stale-while-revalidate, not network-first (added 08 May 2026 PM-7).** For a Capacitor-wrapped app where members navigate constantly between pages, the SW HTML strategy must be SWR: cached HTML returns instantly from CacheStorage (~5ms), background `fetch()` repopulates the cache in parallel for the next navigation, first-ever-visit falls through to network. The original `network-first` strategy waited a full network round trip on the HTML doc on every navigation before any downstream optimisation (cache-paint IIFE, auth.js Promise/defer, head preload chain) could engage. Auth.js defer + cache-paint IIFEs across 10 pages were silently bottlenecked by HTML arrival latency for the entire perf project until PM-7 caught it. Freshness guarantee is preserved by the cache-version bump on every deploy — members are at most ONE navigation behind latest. The 99% case (no deploy in last 30s) is a perf win; the 1% case (mid-session deploy) costs one extra navigation to see new HTML. Pattern: any time perf optimisation is happening downstream of "the page loads", check the SW first to see if the HTML arrival itself is the bottleneck. The cache-version bump rule (every executable change to portal code = a new SW cache key) becomes load-bearing under SWR — without it, a stuck-old-cache member could see arbitrarily-stale HTML indefinitely, since SWR doesn't force-refresh on schedule. The bump is the eviction trigger.

- **theme.js is the ONE script tag that must NOT have `defer` (added 08 May 2026 PM-7).** theme.js runs synchronously at parse time to set `<html data-theme="dark|light">` from `localStorage.getItem('vyve_theme')` BEFORE the body renders. With `defer`, the `data-theme` attribute would only be set after HTML parse completes, causing a visible theme flash on every navigation — particularly painful for dark-mode users who'd see a white flash before the correct dark theme applies. The "no FOUC" guarantee is the entire point of having theme.js in the head as a synchronous script. PM-6 audit caught this and excluded theme.js from the defer pass; codifying here so future "let's defer everything" sweeps know not to touch it. Every other script that touches `window.vyveSupabase` or `window.vyveCurrentUser` (auth.js, all consumer modules) is fine to defer because they all wait for `vyveAuthReady` / `VYVE_AUTH_READY` Promise anyway.

- **Auth-ready Promise pattern + script-tag defer audit (added 08 May 2026 PM-6).** When considering whether to add `defer` to a globally-depended-on script (auth.js, theme.js, anything that exposes window globals), don't trust a quick reference grep — run a depth-tracking walker that distinguishes top-level (parse-time-evaluated) refs from function-body / listener-callback refs. The PM-5 reframe of Session 5 estimated "all 14 pages break" based on raw `window.vyveSupabase` count; the actual audit found zero pages required migration because every consumer was already wrapped in a listener/IIFE/function. The new shape: pages can `await window.VYVE_AUTH_READY` (Promise resolved with `{user, supabase}`) instead of attaching the `vyveAuthReady` event. Both fire from the idempotent `vyveSignalAuthReady(user)` helper at the same moment in both fast-path and authoritative-session branches. Existing event listeners stay valid — Promise is purely additive, full back-compat. The two-path pattern `if (window.vyveCurrentUser) { fn(); } else { addEventListener('vyveAuthReady', fn, { once: true }); }` is defer-safe by construction (sync `if` evaluates false under defer, listener attaches, fires later) and remains the recommended pattern for legacy code. New code should prefer `await window.VYVE_AUTH_READY` for cleaner ergonomics. Walker caveat to remember: brace-depth heuristics undercount inside template literals with `${...}` interpolation — eyeball any depth-0 hits before trusting them.

- **Brain §24 reconciliation pre-flight whenever a stale flag is suspected (added 07 May 2026 PM-4).** When the brain says infrastructure is in state X but the audit or current task implies it might be in state Y, verify against live truth before scoping work. Capacitor's "NOT a git repo (backlog risk)" had been in §23 + §24 + memory for weeks — a 5-second `GITHUB_GET_A_REPOSITORY` call surfaced that the repo had existed since 18 April 2026 (just an outdated stub). The plan changed from "git init from zero" to "audit local working tree against the 18 April snapshot, .gitignore the missed Apple signing files, force-push" — different shape, lower effort. The pattern: every audit finding gets a `tool_search`-grade fact-check against live state before sequencing. Same logic that the 06 May PM rule applies to Supabase schema ("trust Supabase over the brain") extends to GitHub repos, secrets last-rotated timestamps, cron job lists, and any other thing the brain might have a stale view of.

- **Credentials surfaced in chat or screenshots must be rotated before recurring use (added 07 May 2026 PM-4).** A Supabase Management PAT was generated for the EF source backup work and the value appeared briefly in chat (also captured in a screenshot of the Supabase tokens page). Even though the chat platform isn't a known leak source, the discipline is rotation-on-exposure regardless. Pattern: token displayed → revoke → re-generate without showing → store directly to the project secret without it transiting chat. Applies to APNs `.p8` contents, Supabase service-role JWTs, GitHub PATs, OAuth client secrets, anything Brevo/Stripe/PostHog. The APNs key exposure on 27 April was a softer breach of this same principle (we logged it, didn't rotate, accepted the risk on 07 May) — establishing the rule now means future Claudes don't replay the pattern.

- **Bulk EF-source operations belong in server-side EFs, not chat fetch loops (added 07 May 2026 PM-4).** When working with multiple EFs' source bodies (backup, audit, refactor sweep), do the work in a server-side EF that calls the Supabase Management API with `SUPABASE_MGMT_PAT` — don't loop `Supabase:get_edge_function` from chat. The native MCP returns clean source through the Claude tool surface, so 60 EFs at ~10KB each becomes ~600KB of context burn for what should be a server-to-server file-shuffling operation. Composio's `SUPABASE_GET_FUNCTION_BODY` is doubly useless here because it returns ESZIP binary not source (existing §23 rule). Pattern: define the loop body as a Deno EF, deploy with `SUPABASE_MGMT_PAT` access, register a cron, invoke once manually for the initial run, let the cron own recurrence. The `vyve-ef-source-backup` EF (build pending) is the canonical example — single deploy, Sundays 02:00 UTC cron, `vyve_job_runs` row per run, email-watchdog catches failures.

- **Offline-honest surfaces (added PM-10).** Any page that calls Anthropic-proxy (running plan, weekly check-in, future AI features) or streams from a live source (live sessions, real-time chat) MUST gate with `VYVEData.requireOnline()` rather than pretend to function offline. The gate is scoped: page-load gate for surfaces that have nothing to show offline (live sessions); action-only gate for surfaces with cached state worth showing (running-plan: saved plans still visible; wellbeing-checkin: previous-week display still visible). NEVER silent-queue an AI submission with no response surfaced to the member — that's a worse experience than refusing the submission cleanly. The UX pattern is consistent: brand-styled card, honest body copy explaining why the surface needs network, auto-reload on `online` event.

- **EFs querying renamed columns silently fail until exercised (added PM-14).** When a `nutrition_logs` migration during PM-12 renamed `log_date → activity_date` and `calories → calories_kcal`, the `monthly-checkin` EF was not updated. Postgres returns 42703 when the EF runs, the page's generic catch handler shows a vague error, and the failure is invisible at the table level — `monthly_checkins` had ZERO rows from the day the feature shipped until PM-14 caught it via member feedback. Lessons: (1) any column rename migration MUST be paired with a grep across all Edge Function source for the old column name before deploy. (2) EFs that handle low-frequency member actions (monthly check-ins, certificate generation, annual reports) need an automated post-deploy smoke test rather than waiting for a real member to trigger them — they can sit broken for months without anyone noticing. (3) Page-level catch handlers that show "Something went wrong" without surfacing the actual EF error code mask server-side bugs from the dev surface; consider logging the response body to console so it appears in browser DevTools / Sentry. None of these is shipped today; flagged in backlog as ENG hygiene items.

- **Brain content NEVER goes into vyve-site (added PM-13b).** vyve-site is private as a repo but its main branch is served via GitHub Pages at `online.vyvehealth.co.uk`. Pages serves any path that exists on the source branch. Any file at `brain/`, `tasks/`, or root-level operational markdown that lands in vyve-site is therefore publicly fetchable on the open internet within ~30s of commit, regardless of repo privacy. Brain commits go to `VYVEHealth/VYVEBrain` only. Before any `GITHUB_COMMIT_MULTIPLE_FILES` call, verify the `repo` argument matches the file paths: site code → `vyve-site`, brain markdown → `VYVEBrain`. After every commit, re-fetch and confirm the `changed_paths` returned match the upserts sent — `GITHUB_COMMIT_MULTIPLE_FILES` has been observed (PM-13b) returning a different commit than the one requested, which silently no-ops the intended changes and may include unrelated paths. If the response paths don't match the request, the commit must be assumed broken and re-issued with a uniquifier in the message.

- **CHECK constraint pre-flight before adding any new `triggered_by`-style enum value (added 07 May 2026 PM, security commit 1B).** Before deploying an EF that writes a new value to a column with a CHECK constraint, query `SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conname='<table>_<col>_check'` to confirm the value is in the allowed set. Otherwise the EF will silently `23514` every insert under `EdgeRuntime.waitUntil()` — no user-visible failure, just an empty audit trail. Lesson learned the hard way on commit 1B: deployed three EFs with new `triggered_by` values, then tried to test-insert one and got the CHECK violation. Three forced redeploys. Same idea applies to enums, FK targets, and any non-NULL constraint that depends on related state.

- **CSP meta-tag rollouts MUST be tested in fresh incognito on the live URL before brain-commit (added 07 May 2026 PM-2, security commit 2).** GitHub Pages caches HTML and the service worker caches it again on the client. A returning member with a stale SW cache will keep running the OLD HTML for hours after a CSP push, masking violations. The reliable test is a fresh incognito window with DevTools console open, hitting the live URL post-deploy. SW cache bump is mandatory but not sufficient — incognito skips both the disk cache and any prior SW registration entirely. Holding the brain commit until incognito-clean is the workflow, not the exception. Lesson learned 07 May PM-2: v1 of the CSP looked fine on inspection but failed three live checks (PostHog dynamic load, `wss://` realtime, `frame-ancestors` meta-tag warning) — fix-1 landed within minutes thanks to the test, but a brain commit on v1 would have asserted a green ship.

- **CSP pre-flight scans MUST include dynamic JS-built fetches, not only static `<script src>` and `<link href>` tags (added 07 May 2026 PM-2, security commit 2).** The PostHog snippet in `auth.js` calls `https://eu-assets.i.posthog.com/static/array.js` via inline JS — no static tag references that host. Static-tag-only scans miss it entirely, the CSP locks down script-src without that allowlist entry, and the page silently breaks under the new policy. Pre-flight must also scan: `fetch(`...`)` calls, `new EventSource(...)` calls, `new WebSocket(...)` calls, `new Image().src=` patterns, dynamically-built `<script>` injections, third-party SDKs that lazy-load resources (PostHog, Sentry, Stripe, Google Analytics — all known offenders). For VYVE specifically: PostHog (eu-assets + eu.i hosts), Supabase Realtime WebSocket (wss scheme), YouTube Data API v3 (googleapis fetch in events-rp.html), Open Food Facts (openfoodfacts.org fetch in log-food.html via off-proxy EF or direct).

- **WebSocket protocol (`wss:`) is a SEPARATE match-string from HTTPS (`https:`) in CSP `connect-src` (added 07 May 2026 PM-2, security commit 2).** `https://*.supabase.co` on connect-src does NOT cover `wss://*.supabase.co/realtime/v1/websocket` — they're different schemes for the browser's match algorithm. Same applies to `ws://` (insecure WS), though VYVE never uses that. Any EF or page that opens a WebSocket needs the `wss://` scheme explicitly listed. Future-proofing: when adding any third-party API to connect-src, check whether it ever opens WebSockets (Supabase Realtime yes, PostHog event capture no, Brevo no, OFF no — but the next one might).

- **Audit findings need schema cross-check before implementation (added 07 May 2026, security commit 1).** The 06 May audit recommended `auth.email() = member_email` as the qual for `running_plan_cache` policies, but the table has no `member_email` column — it's a shared parametric cache keyed on `cache_key`. The recommended migration would have failed at policy-create time. Rule: before composing any RLS migration from an audit recommendation, run a 30-second `information_schema.columns` pre-flight against the target table. Cheap to do, cheaper than a failed prod migration mid-session. Same pattern from the 06 May PM rule ("trust Supabase over the brain on schema") extended to: trust Supabase over the audit document on schema.

- **CORS default-origin pattern, no wildcard (added 07 May 2026, security commit 1).** Every public-facing EF emits `Access-Control-Allow-Origin: <ALLOWED|DEFAULT>` where `DEFAULT='https://online.vyvehealth.co.uk'`. NEVER fall back to `*`, even when `Origin` is empty or `'null'`. Legitimate browsers always send the Origin header on a cross-origin request to the EF; only file://, sandboxed iframes, and curl-without-Origin ever produce empty/null, none of which are real member surfaces. The wildcard branch is anon-readable exposure and was the basis of one of the audit findings. Refactored pattern in `member-dashboard` v59: `ALLOWED_ORIGINS.has(origin) ? origin : DEFAULT_ORIGIN`. Drop the `Access-Control-Allow-Credentials` ternary too — always `'true'` because we never emit `*`. Roll this pattern across `wellbeing-checkin`, `log-activity`, `anthropic-proxy`, every other EF reading the Origin header. Tracked in commit 1B backlog.

- **Shared resource RLS posture, not member-scoped (added 07 May 2026, security commit 1).** `running_plan_cache` is the canonical example: a shared parametric output cache keyed on plan inputs, multiple members hit the same row when they request matching plans. The right RLS posture for a shared resource is: (a) anonymous access blocked at every operation, (b) authenticated access granted at every operation members legitimately need, (c) service role exempt for backend operations. NOT `auth.email() = member_email` — that's only correct for member-scoped tables (`daily_habits`, `workouts`, `cardio` etc.). Distinguish at policy-design time: does the table have a `member_email` column AND is each row owned by exactly one member? If yes, member-scoped qual. If no (shared cache, reference data, parametric output), authenticated-true qual.

- **Cross-check live Supabase state before assuming brain is authoritative on schema (added 06 May PM).** The 06 May PM session uncovered three pieces of live infrastructure that weren't in master.md: `weekly_goals.exercise_target` column, `seed-weekly-goals` EF, `vyve-seed-weekly-goals` cron. Whole subsystem built and deployed in a prior session, brain not updated, schema-snapshot-refresh cron either didn't run or didn't catch it. Pattern: before writing a migration or building infrastructure that the brain says is missing, run a 30-second pre-flight check — `information_schema.columns` for the relevant tables, `cron.job` for relevant schedules, `SUPABASE_LIST_EDGE_FUNCTIONS` for relevant slugs. If the brain says "this doesn't exist" and Supabase says it does, **trust Supabase** and update the brain after shipping. Cheap to do, expensive to skip. Backlog item raised to audit `schema-snapshot-refresh` health.

- **`member_home_state` writer is `refresh_member_home_state(p_email)`, NOT the `*/15` cron (added 06 May PM-2).** The brain previously implied `vyve_recompute_member_stats` (cron `*/15 * * * *` on `recompute_all_member_stats()`) was the populator for `member_home_state`. It is not — that cron writes the sibling table `member_stats`. The actual `member_home_state` writer is the `refresh_member_home_state(p_email)` plpgsql function, fired by `zzz_refresh_home_state` AFTER INSERT OR DELETE OR UPDATE triggers (each calling the `tg_refresh_member_home_state()` trigger function) on **8 source tables** (`cardio`, `daily_habits`, `replay_views`, `session_views`, `weekly_goals`, `weekly_scores`, `wellbeing_checkins`, `workouts`). HealthKit tables (`member_health_connections`, `member_health_daily`, `member_health_samples`) do NOT carry the trigger — autotick writes through to the activity tables and inherits the refresh from those. Trigger-driven means same-write-fresh: no 15-min staleness window. When extending derived counters on `member_home_state`, edit `refresh_member_home_state(p_email)` — its `INSERT … ON CONFLICT (member_email) DO UPDATE SET …` clause is explicit and only touches columns it lists, so a separately-written column (e.g. a future cron-populated `achievements_inflight`) is safe and won't be clobbered by the trigger refresh path. Confirmed safe by reading the current function body 06 May.

- **For reading EF source, prefer native `Supabase:get_edge_function` over Composio's body endpoint (added 06 May PM-2).** `Supabase:get_edge_function` returns a clean `files: [{name, content}, …]` array with full TypeScript source intact for every file (entrypoint + `_shared/*` siblings + deno.json), suitable for editing and redeploy. Composio's `SUPABASE_GET_FUNCTION_BODY` returns the compiled ESZIP bundle with types stripped and JS minified — useful for forensics on a deployed bundle's actual runtime shape, not useful for editing. For deploying multi-file EFs with shared modules, use native `Supabase:deploy_edge_function` with `files=[{name, content}, …]` listing all relative dependencies (entrypoint + every `_shared/*.ts` import); Composio's `SUPABASE_DEPLOY_FUNCTION` only takes a single-file `file_content` and is unsuitable for any EF that imports from `_shared/`.



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
| **`vyve-capacitor` git workflow** | Local at `~/Projects/vyve-capacitor`, remote `VYVEHealth/vyve-capacitor` (private). SPM-only Capacitor 6 — no Podfile. `.gitignore` covers `*.p8`, `*.p12`, `*.cer`, `*.mobileprovision`, `*.provisionprofile`, `*.jks`, `*.keystore`, `keystore.properties`, `google-services.json`, `GoogleService-Info.plist`, `node_modules/`, `ios/App/Pods/`, `ios/DerivedData/`, all `xcuserdata` paths, `www/cordova-plugins/`, `www/cordova.js`, `www/cordova_plugins.js`, `*.bak.*`, `.env*`. Force-push from local was used 07 May 2026 PM to replace an Android-only stub from 18 April 2026; future commits are normal `add/commit/push`. Auth via fine-scoped GitHub PAT (Contents R/W on `vyve-capacitor` only, expires 7 May 2027) cached in macOS Keychain. |
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

| **Supabase EF secret names cannot start with `SUPABASE_` (added 07 May PM-5)** | The dashboard rejects any custom Edge Function secret whose name begins with `SUPABASE_` — that prefix is reserved for runtime-injected vars (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_URL`). Caught when trying to add `SUPABASE_MGMT_PAT` per the PM-4 spec; saved as `MGMT_PAT` instead. When provisioning new secrets in future sessions, drop the `SUPABASE_` prefix from any name you'd otherwise want to use. |
| **Management API `/functions/{slug}/body` returns ESZIP binary (added 07 May PM-5)** | `https://api.supabase.com/v1/projects/{ref}/functions/{slug}/body` always returns `application/octet-stream` ESZIP2.3 binary regardless of `Accept` header or query params. There is no JSON variant of this endpoint. To extract decoded source files, use `supabase functions download <slug>` from the CLI — the CLI ships with the matching ESZIP decoder. The `deno.land/x/eszip@v0.109.0` parser library cannot decode ESZIP2.3 (panics with `Utf8Error { valid_up_to: 181 }` inside the Rust crate, propagating as a WASM `unreachable` trap not catchable from JS). Probed via 7-URL diagnostic EF (`vyve-mgmt-api-probe`); only the metadata endpoint `/functions/{slug}` (no suffix) returns JSON, and that's metadata only (version, verify_jwt, ezbr_sha256, entrypoint_path) — not source. |
| **WASM-importing libraries cannot run inside Supabase Edge Functions (added 07 May PM-5)** | Tried `import { Parser } from "https://deno.land/x/eszip@v0.109.0/mod.ts"` inside an EF; deploy succeeded but invocation returned 503 with `x-served-by: base/server` (gateway-level BOOT_ERROR, empty response body). Same import works locally and in GitHub Actions Deno runners. Supabase's EF runtime sandboxes WASM init at module-import time. If you need WASM, the work belongs on a runner outside Supabase: GitHub Actions (preferred — same repo, same access, native cron, free for private repos), Cloudflare Workers, Fly.io, or local. The `vyve-ef-source-backup` GitHub Actions workflow is the canonical pattern. |
| **`git diff --quiet -- path/` ignores untracked files (added 07 May PM-5)** | When using `git diff --quiet -- path/` in CI to gate a commit, untracked new files/directories don't trigger the diff and the gate fires "no changes" even when the path is full of brand-new content. Caught when the EF backup workflow successfully wrote 62 new directories to `staging/edge-functions/` but skipped the commit because the gate was on the wrong side of the staging-area boundary. Correct pattern: `git add path/` THEN `git diff --cached --quiet -- path/` THEN commit/push. Applies to any future automation that detects "did this generated content change". |


### §23.5.3 — Auth state-change handler: TOKEN_REFRESHED with null session is NOT a sign-out (PM-74, 12 May 2026)

Resolution of the auth-loop incident from PM-67e ship night. `vyveSupabase.auth.onAuthStateChange((ev, session) => { ... })` in auth.js must guard on the **event type**, not on the session being null. Specifically the L803 predicate **must be `if (ev === 'SIGNED_OUT')`**, NOT `if (ev === 'SIGNED_OUT' || !session)`. Supabase auth-js v2 fires the callback with a null session in at least three benign scenarios that should NOT redirect:

1. `INITIAL_SESSION` with no cached session — handled by the fast-path read at L818-825 and the authoritative-check at L852. The state listener has nothing useful to add.
2. `TOKEN_REFRESHED` with null session — fires when the refresh-token request to gotrue **fails** (expired refresh_token, network blip mid-refresh, gotrue 400 on the refresh endpoint). On a failed refresh, the next authenticated fetch will 401, and the 401 handler is now responsible for signing out properly (see the second discipline below). Redirecting at the auth state-change layer creates a redirect loop: failed-refresh → redirect → /login.html → portal page reload → auth.js authoritative-check re-attempts refresh → fails again → repeat.
3. `USER_UPDATED` mid-flow during certain Supabase-internal state transitions.

**Companion discipline for the 401 redirect path.** Every server-side 401 handler that redirects to /login.html MUST sign out first to clear localStorage, otherwise the next paint can loop on stale session fragments. The canonical shape (applied at 9 sites in PM-74):

```js
if(res.status === 401){
  try { if (window.vyveSupabase) await window.vyveSupabase.auth.signOut(); } catch(_) {}
  try { localStorage.setItem('vyve_return_to', window.location.href); } catch(_) {}
  window.location.replace('/login.html');
  return;
}
```

Three load-bearing pieces: (a) `signOut()` first clears the dead session from localStorage (`vyve_auth` storageKey) so subsequent auth.js loads don't re-attempt to validate a corpse; (b) `vyve_return_to` capture mirrors auth.js's own pattern at L844 and L856 so the member lands back where they were after re-login; (c) `location.replace` not `location.href` removes the back-button trap into the dead-session page. The handler must be inside an `async` function for the `await signOut()` — checked at audit time via a strict brace-depth enclosing-fn walker, NOT the naive "nearest function-decl above" walker (the latter false-flagged 3 of 9 PM-74 sites because they sat inside `if (...)` and `await new Promise(resolve => {})` blocks).

**The deeper rule, generalised.** When wiring listeners on third-party SDK state machines, guard on the **event the SDK actually says fired**, not on derived properties of the state object. Supabase's contract is "fire `SIGNED_OUT` when the session is genuinely terminated". A null session passed alongside `TOKEN_REFRESHED` is a different signal — "refresh failed, you'll get a 401 on your next call" — and conflating the two is a class of bug that surfaces only under specific timing (the JWT crept past expiry, a refresh attempt was triggered, the refresh token was also bad). The PM-67e perf.js ship surfaced this latent bug by adding an eager `getSession()` call that increased the rate of refresh attempts; the bug itself predates the perf work and would have surfaced eventually from any other refresh trigger (auth-js's own background refresh timer, an EF that returns 401 mid-session, etc.).

**Audit method when adding any new state-change listener or modifying auth.js's onAuthStateChange.** Read the listener **first**, write the trigger **second**. PM-67e shipped perf instrumentation that called getSession without auditing what would react to the resulting state change — the brain commit at the end of last session captured this discipline but the rule wasn't codified at §23. Codifying here so future Claudes treat it as enforced.


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

### Hard rule (added PM-13): cache invalidation on member-authored writes

Every page that writes a row representing a member action (habit tick, workout completion, weight log, food log, check-in submission, session view) MUST call `VYVEData.invalidateHomeCache()` on success. The home dashboard's bespoke `vyve_home_v3_<email>` localStorage cache is deliberately not subscribed to outbox events — it's wiped explicitly. Without this call, the home screen paints pre-write state on next visit and "flicker-corrects" itself when the EF round-trip returns, which feels broken.

Heartbeat-style writes (e.g., `tracking.js` PATCH every 15s) are explicit exceptions — only the initial insert invalidates, since subsequent heartbeats don't change today's activity counts. Programme advance counters (e.g., `workout_plan_cache` PATCH after `completeWorkout`) are also exceptions for the same reason — those aren't member activity, they're plan state.

The optimistic overlay in `renderDashboardData` (`VYVEData.getOptimisticActivityToday()` → bump pill strip + counts + activity_log) is the second layer: even with cache wiped and a slow EF round-trip, the dashboard reflects local state immediately. Together: invalidate → skeleton → optimistic-from-outbox → EF authoritative replacement. Member never sees stale state.

### Hard rule (added 08 May PM-12): cache-paint-before-auth is a contract every gated page must hold, not a one-time index.html setup

PM-3 codified "cache paint runs before auth, not inside `onAuthReady`" as a hard rule but PM-12 found two pages (engagement.html, habits.html) that ship cache-paint code in the wrong place — gated behind `addEventListener('vyveAuthReady', loadPage)` so the paint waits for the entire deferred-auth chain. The page-level test that catches this: ON A WARM CACHE LOAD, can the cache-paint reach the DOM before any `<script defer>` tag finishes executing? If the answer is no, the page violates the rule. Two implementation patterns satisfy the rule:

1. **Synchronous IIFE in `<head>` or top-of-body** (the index.html shape) — runs at parser-reach, doesn't depend on any deferred script, paints directly to the DOM via `innerHTML` or `textContent`.
2. **Immediate-call `loadPage()` with cache-discovered email** (the PM-12 shape) — bottom-of-body inline script calls `loadPage()` synchronously; the function discovers email from cache before falling back to auth, paints from cache, then awaits auth via `_vyveWaitAuth()` for the network refresh.

The `_vyveWaitAuth()` helper is required boilerplate on any page that uses pattern 2 because auth.js is deferred and the `window.VYVE_AUTH_READY` Promise may not exist yet when the inline script reaches its wiring. The helper falls back through three signals: existing `vyveCurrentUser`, then `VYVE_AUTH_READY` Promise (if it exists OR appears via polling), then `vyveAuthReady` event, with a 5s safety-net timeout. Copy the helper verbatim — don't reinvent it per page. Also — when a page paints from cache and the network refresh fails to get a JWT, do NOT redirect to `/login.html` on top of the valid cached paint; gate the redirect on `_renderedFromCache` being false.

The audit-time signal that this rule has drifted: any portal page where the `loadPage` / `loadPageData` / equivalent function is called only from inside an `addEventListener('vyveAuthReady', ...)` block, and where the cache-read code lives inside that function. Greppable check: `grep -n "vyveAuthReady', () => load" *.html` should return zero hits across the portal once all pages comply.

### Hard rule (added 08 May PM-11): platform-wide aggregates that scale with total platform activity must be incrementally maintained, not scanned on read

`get_charity_total()` was the single most expensive query on the platform pre-PM-11: a 6-table UNION ALL with GROUP BY that scaled linearly in total platform activity, called on every dashboard load. At 32 members + 1.7K activities it was 127ms; projected 30s+ at 100K members, would exceed `work_mem` and hit `statement_timeout`. The fix shape that worked — and that should be the default for any platform-wide aggregate going forward — is: dedicated single-row-per-counter table (`platform_counters`), AFTER INSERT/DELETE triggers on each source table that bump ±1 only when the row crosses a cap boundary (centralised via a `bump_*` SECURITY DEFINER helper that does the actual UPDATE), the read function becomes O(1) `SELECT counter_value`, and a daily reconciliation cron compares cached vs scan-recomputed and heals + alerts on drift. Pattern is generalisable: any future platform-wide totals (total active days, total kg lifted, total minutes moved, anything that needs to render on a dashboard banner) should follow the same shape — counter table + bump triggers + daily reconcile-and-heal — never a scan on read. The PM-11 migration left the legacy scan body in `charity_total_reconcile()` so the daily cron has it for verification; that's the right home for the scan, not the read path. Sibling-trigger families that share cap math (e.g. `charity_count_*` and `increment_*_counter`) must be kept aligned manually — there's no shared helper between them yet because they write to different surfaces (platform aggregate vs per-member cert counters). Future work that changes cap rules has to update BOTH families, or we get drift between charity_total and the per-member cert_*_count fields.

### Hard rule (added 08 May PM-11): theme/preference reads from members table must be throttled, not per-page

The 5247 calls to `members.theme_preference` in pg_stat_statements pre-PM-11 was `theme.js` running a Supabase fetch on every page load to support cross-device sync. The right shape is: localStorage timestamp (`vyve_*_synced_at`) gates the fetch with an hourly TTL. The setter (`vyveSetTheme()`) writes through to both surfaces and refreshes the stamp synchronously, so the typical session does ONE network read per hour at most. Same pattern applies to any future `members`-row preference reads (notification prefs, display name preference, etc.) — the read path on every page load is wrong; once-per-session-or-hour cross-device sync is right.

### Hard rule (added 08 May PM-5): home page fans out and prefetches for top nav targets

When `member-dashboard` returns on `index.html`, it MUST also write the same response into `vyve_engagement_cache` and `vyve_certs_cache`. Both pages cache the full member-dashboard EF response under their own keys, so this is shape-compatible. Free warm-cache for the next tab the member taps.

Background prefetch via `_vyvePrefetchNextTabs(email, jwt)` fires fire-and-forget fetches into the heaviest next-tap pages' caches:
- `vyve_members_cache_<email>` ← /rest/v1/members?email=eq.<> (nutrition.html)
- `vyve_programme_cache_<email>` ← /rest/v1/workout_plan_cache?member_email=eq.<>&is_active=eq.true (workouts page)

Wrapped in `requestIdleCallback` so it doesn't compete with index render. Network gate via `navigator.connection`: skips on saveData mode and any effectiveType other than 4g/wifi. Failures are silent — target pages fall back to their own fetch.

If a new heavy-traffic page is added to the portal AND the member-dashboard EF response doesn't already include the data it needs, add a third prefetch call inside `_vyvePrefetchNextTabs` that fills that page's cache key. Don't fan-out unrelated EF calls; pick the smallest fetch that fills the target cache.

### Hard rule (added 08 May PM-3): cache paint runs before auth, not inside `onAuthReady`

Every portal page that has a per-page localStorage cache MUST paint that cache **synchronously on script parse**, NOT inside the `onAuthReady` handler. Cache-paint inside `onAuthReady` waits for the Supabase SDK to load, parse, initialise, and the optimistic fast-path to fire before the member sees anything — that's the bulk of perceived "every page has to load once clicked" lag.

Pattern:

```js
function _readEmailFromAuthCache() {
  try {
    const raw = localStorage.getItem('vyve_auth');
    if (!raw) return null;
    const sess = JSON.parse(raw);
    const inner = (sess && sess.access_token) ? sess : (sess && sess.currentSession);
    return (inner && inner.user && inner.user.email) || null;
  } catch (_) { return null; }
}
let _earlyPainted = false;
(function paintCacheEarly() {
  try {
    const email = _readEmailFromAuthCache();
    if (!email) return;
    // ... read this page's cache, call render fn, reveal #app, set _earlyPainted = true
  } catch (_) {}
})();
```

The auth-ready handler still fires the background fetch + swap, but the `_earlyPainted` guard prevents double-paint.

Rationale: `auth.js` stores its session under `localStorage.vyve_auth` (Supabase's `storageKey: 'vyve_auth'` config). Reading that synchronously gives us the member's email without any SDK round-trip — the fast-path inside `vyveInitAuth` reads the same row a few hundred ms later. We just don't need to wait for it.

Don't use bespoke per-page TTL gates. Paint the cache regardless of age — fresh fetch always overwrites (model: `index.html`). Short TTLs cause unnecessary skeleton flashes mid-day.

Pages that follow this pattern (post 08 May PM-4): `index.html`, `settings.html`, `exercise.html`, `movement.html`, `certificates.html`, `nutrition.html`, `log-food.html`, `leaderboard.html`, `engagement.html`, `running-plan.html`. Pages where the pattern doesn't apply (no fetch, or content is form-fill not display of historical data): `sessions.html`, `monthly-checkin.html`, `wellbeing-checkin.html`.

Companion rule: when adding a cache-write site, double-check the truthiness gate. The certificates.html bug from 08 May (`if (data.error)` instead of `!data.error`) silently broke cache writes for months. Always test the cache-write path actually fires on a successful response.

### Hard rule (added 06 May): per-page init must actually be invoked

A function declaration is not an init wiring. `workouts-config.js` had `async function init() { ... await Promise.all([...]); restoreSessionState(); }` declared but never called — no `DOMContentLoaded` handler, no IIFE, no trailing `init();` — and the entire workout resume feature was silently dead until member feedback exposed it on 06 May. Lesson: every page-init script needs an explicit invocation site, and the invocation site needs to handle BOTH the auth-already-fired race (defer-script parsed after `auth.js` non-deferred has dispatched `vyveAuthReady`) AND the auth-fires-later case. Pattern: `if (window.vyveCurrentUser && window.vyveCurrentUser.email) { setTimeout(boot, 0); } else { window.addEventListener('vyveAuthReady', boot); }` with an idempotent boot guard (`_vyveBootRan`). When auditing other portal pages for the same bug, grep for `function init` / `async function init` and confirm there's a matching invocation site. If a refactor adds a new event listener inside a function body that isn't called, the listener will register only when that function is invoked — silently broken if it never is.

- **Exercise library renames must be paired with exercise_logs rename migration (added 08 May 2026 PM-2).** When the workout_plans library renames an exercise — e.g. "Barbell Bench Press" → "Bench Press – Barbell" during the 19 April Exercise Hub naming-convention pass — the corresponding `exercise_logs` rows DO NOT auto-update. The history join in `buildExerciseCard()` keys off the literal `exercise_name` string, so renamed-library + un-renamed-logs = orphaned history. Stu Watts hit this on his 1 May Push B opening blank for exercises he'd hammered on 10 April. As of 08 May PM-2 the canonical normaliser system (`exercise_canonical_names` alias table + 9 triggers across 7 tables) handles this transparently for new writes — but the developer-side discipline still applies: when renaming an exercise in the library, also: (a) seed an alias row mapping old→new in `exercise_canonical_names`, (b) run a self-touch UPDATE on `exercise_logs` to fire the trigger and rewrite historical rows, (c) audit `exercise_name_misses` after the migration to confirm zero stragglers. The trigger system is a safety net, not a substitute for the migration discipline. Similarity scores from pg_trgm are useful for SUGGESTING canonicalisation candidates but are NOT a substitute for human judgement on muscle-group equivalence — pg_trgm proposed `Barbell Row` → `Upright Row – Barbell` at 0.600 because of shared trigrams; the right target was `Bent Over Row – Barbell` (different muscle group entirely). Manual review the alias seeds; trust the trigger for the carry-forward.

### Hard rule (added 08 May PM-16): perf rewrites of dormant cron functions verify against live source

The PM-16 audit identified `recompute_all_member_stats()` and `daily-report` v8 as the scaling chokepoints for re-engagement, but pre-flight showed both were already in their PM-11 incremental shape — the audit's diagnosis had been overtaken by earlier perf work the audit author wasn't tracking. The real cliff was elsewhere (`re-engagement-scheduler` v10 doing 4 parallel `.in()` queries against activity tables and computing `MAX` in JS, millions of rows at 100K members). Lesson: when picking up a perf-rewrite ticket against a function that hasn't been touched in days, do not trust the diagnosis embedded in the prompt. Fetch the live source via `Supabase:get_edge_function`, run `EXPLAIN ANALYZE` against the actual query, or pull the relevant migration against the schema column you assume exists. The codebase moves between when an audit is written and when the rewrite ships; the audit is a hypothesis, not a contract. Pattern: every perf-rewrite session opens with a one-cell pre-flight that fetches the live source of every function the rewrite touches and the live schema of every table the rewrite reads from. Cheap insurance against shipping a fix for a problem that no longer exists or, worse, a fix that breaks because the schema isn't what the audit assumed.

### Hard rule (added 08 May PM-20): head-script `defer` audits must check inline consumers on the host page

Lifting an externally-imported `<script>` from sync-in-head to `defer` only changes its execution order — it does NOT teleport its globals into a phase that inline `<script>...</script>` blocks earlier on the page can see. `vyve-offline.js` exposes `window.VYVEData` (and similar globals) which inline blocks on `events-live.html`, `index.html`, `log-food.html`, `running-plan.html` reference at parse time. Add `defer` to the external import and those inline blocks throw `VYVEData is not defined` because the deferred script hasn't executed yet. Same trap with `/supabase.min.js` consumed by inline blocks on `hk-diagnostic.html`, `login.html`, `set-password.html`. Audit pattern before deferring any head-script: (1) grep the host file for `<script>...</script>` blocks (no `src`); (2) grep those blocks for `window.<global>` references and bare `<global>` references where `<global>` is anything the external script defines; (3) if there are matches, lifting is a real refactor — the inline consumers must be rewritten to await a ready signal — not a defer-tag flip. Cheap defers are scripts whose globals are only consumed by other deferred scripts or by event handlers fired post-DOMContentLoaded. The PM-20 monthly-checkin.html lift was clean because that page has no inline consumers; the eight portal pages that DO have them are tracked as a P2 backlog item.

### Hard rule (added 08 May PM-26): pre-flight audits run against the whole tree, not a hand-picked subset

When auditing the live state of any code surface (vyve-site, an EF, a migration set, a config tree), the first action is `GITHUB_GET_A_TREE` recursive on the relevant repo + branch, then fetch every source file that could plausibly contain a hit before running the grep. Hand-picking the files you "judged most relevant" is exactly how PM-25 generated a false negative: I grepped for `touchstart` across 23 of the 86 vyve-site blobs, found zero hits, and concluded PM-18's universal touchstart-nav prefetch had never shipped. nav.js — which I hadn't fetched — contains the entire `_pfHandleTouchStart` delegated listener with the `_PF_ROUTES` map, network-OK gate, 5s hot-dedupe, and a `mousedown` mirror. PM-18 shipped exactly what its changelog claimed. The ship-truth violation was in my audit method, not in the prior session's work. Same audit pass also missed `movement.html` (10 invalidate/record/evaluate call sites), `workouts-builder.js` (a `VYVEAchievements.evaluate` site), and 13 of 20 evaluate publishers across the platform — all because they weren't in my hand-picked file batch.

The pattern that catches this: (1) `GITHUB_GET_A_TREE` recursive on the target repo+ref, (2) filter to source extensions you'd grep (.html .js .ts .css .mjs for vyve-site; adapt per repo), (3) parallel-fetch every blob in that filtered list — not a subset, not "the ones likely to matter", every one — (4) THEN run the grep. The cost difference between fetching 23 files and 73 files via `GITHUB_GET_REPOSITORY_CONTENT` parallel is ~3 seconds vs ~1 second on the workbench's connection. The cost of a false-negative finding that gets baked into a downstream design doc is measured in commits to undo. Always cheaper to fetch wide.

Companion check: when an audit produces a "ship-truth drift" finding against a prior session's claimed work, the priors should be: (a) the prior session shipped what it said it shipped (most likely — these sessions verify post-commit), (b) the audit methodology is incomplete (second most likely — file-subset selection is the failure mode I just demonstrated), (c) genuine drift (least likely without a clear corruption / revert mechanism). Re-run the audit at higher fidelity before publishing the finding. The whole-tree pull is the higher-fidelity audit.

Audit-output discipline: every audit report or design doc that depends on grep-style claims about a code surface MUST end with a `Source-of-truth` or equivalent block listing the exact tree SHA, the exact file count fetched, and the exact grep commands used. Without those three, the reader can't tell whether the finding was generated against a complete view. The `cache-bus-taxonomy.md` PM-26 patch is the canonical example; the PM-28 patch extends the same Source-of-truth block to record the sub-audit greps used to resolve `vyve_dashboard_cache` and 1c-14 against HEAD `040c496d`.

PM-32 sub-rule (added 09 May): primitive call-site audits exclude `typeof X === 'function'` guard lines from the count. The pattern in the live source is:

```js
if (window.VYVEData && typeof VYVEData.invalidateHomeCache === 'function') {
  VYVEData.invalidateHomeCache();    // ← THIS is the call site
}
```

Both lines mention `invalidateHomeCache`, but only the second is an actual invocation. PM-31's audit regex (`\binvalidateHomeCache\s*\(`) matched both lines because the guard line includes the substring `invalidateHomeCache(` in `=== 'function')`-adjacent contexts (some files even have the guard inline as `if (typeof X.invalidateHomeCache === 'function') X.invalidateHomeCache();` which legitimately matches the call-site regex once but the guard pattern was ambiguous on multi-line forms). PM-32 reconciliation against the same HEAD `ee0497a5` corrects PM-31's reported 15/12/18 to **14 invalidate / 8 record / 18 evaluate** publishing-surface call sites. Future audits must use a regex that explicitly excludes `typeof` lines, or eyeball every match before counting. Concretely: filter out any line where the primitive name appears inside a `typeof X === 'function'` test, regardless of indentation, and any line where the primitive name appears as an object property reference inside `Object.prototype.hasOwnProperty.call()`. The simplest reliable filter is: count lines matching `<primitive>\s*\(` AND NOT matching `typeof.*<primitive>`. The evaluate count (18) was correct because the evaluate guards are property checks (`if (window.VYVEAchievements)`), not `typeof === 'function'` checks, so the regex matched cleanly.

### Hard rule (added 08 May PM-30): bus migration discipline — option-(a) signalling for the duration of the 1c-* campaign

For Layer 1c migrations 1c-1 through 1c-14, every `bus.publish` site replaces direct calls to `VYVEData.invalidateHomeCache` / `VYVEData.recordRecentActivity` / `VYVEAchievements.evaluate` with one publish — but the **subscribers call those existing primitives internally** rather than the publishing site calling them directly. The §23 master.md hard rule that every member-action write MUST call `invalidateHomeCache()` on success (codified pre-PM-30 at the `vyve_home_v3_<email>` cache section) stays in force throughout the migration; the publishing site discharges the contract by emitting `bus.publish`, and the index.html bus subscriber discharges it by calling `invalidateHomeCache` on the bus event. Same pattern for `recordRecentActivity` (called inside the per-page bus subscriber that owns the breadcrumb concern, not at the publishing site).

This is option (a) of the home-stale signalling decision — chosen at PM-30 over option (b) (eliminate the primitives as external surfaces, fold their logic entirely into bus subscriber handlers). Option (a) wins for the transitional period because mixing bus-driven and direct-call home-stale signals across the 14 migrations would produce an inconsistent contract for 14 sessions; option (a) keeps the contract universal until a named cleanup commit after 1c-14 makes the option-(b) cut atomically.

Migrations 1c-2 through 1c-14 follow the same pattern. The cleanup commit (post-PM-44ish, captured as a P3 backlog item at PM-30) takes option (b) once every direct-call site is gone.

Schema discipline for 1c-* migrations: undo / clear / no-op publishes go through the same event with a discriminator (e.g. `is_yes:null`), not a separate `<noun>:cleared` event. Achievement evaluator eligibility is gated by the subscriber on the discriminator (`if (is_yes === true || autotick === true)`). The achievements.js debouncer (1.5s) makes multi-subscriber double-fires safe; subscribers do NOT need to gate on `origin === 'local'` to avoid double eval — over-inclusivity is the right call because at least one open tab needs to fire eval for the inline path to run.

### §23.11 — Hydrate completeness (logged 14 May 2026, PM-106)

**Status:** HARD RULE. Surfaced on `test1@test.com` canary walk 14 May 2026 ~19:46 BST. The Habits page painted from Dexie immediately per §23.7.1 (`member_habits` rows existed in Dexie post-hydrate) but every card rendered `undefined / undefined / undefined` because the hydrate had pulled the column subset native to `member_habits` (member_email, habit_id, is_active, assigned_at, last_completed_at) and NOT the denormalised join columns the template reads from (name, description, category, difficulty — all owned by `habit_library`). EF backfill ~10s later returned fat-row data; page re-rendered correctly. Indicator stayed amber throughout, then resolved green after EF re-paint. Same family as §23.7.5 (partial-upsert landmine) and §23.7.8 (reset-rehydrate before paint), from the **read** direction not the write direction.

**Hard rule:** Every page-read against Dexie must find fat-row data with every column the UI renders, including denormalised columns from joined catalogue tables. Missing columns are **hydrate bugs**, not page bugs. The fix shape is to expand `db.js pullOneTable(table)` to fetch with the relevant PostgREST embedded joins (`select=*,habit_library(name,description,...)`) and denormalise onto the row before storing in Dexie. Same shape as what member-dashboard EF v40 already does server-side.

**Audit signal:** for every member-scoped table in the Dexie schema, list the columns the UI reads on the consuming pages. Cross-reference against the columns `pullOneTable` pulls. Gaps are bugs.

**Tables known affected at PM-106 (audit driving PF-40.2):**
- `member_habits` ← needs `habit_library` join (name, description, category, difficulty, theme)
- Almost certainly: `workout_plan_cache` ← needs `workout_plans`-derived metadata where surfaced
- Almost certainly: `daily_habits` ← when surfaced with habit context
- Audit pending for: nutrition_logs, exercise_logs, wellbeing_checkins, weekly_goals

**Fix lands in PF-40.2.** Until then, pages that hit this bug will see the same 10s "undefined → real" transition; no per-page workaround should be deployed (would be wasted code that PF-40 deletes). This rule extends §23.10 — offline-equivalent operation requires hydrate completeness as a precondition.

### §23.12 — No page-level network fetches for member or catalogue data (logged 14 May 2026, PM-106)

**Status:** HARD RULE. Codifies the read-path direction of the local-first contract (active.md §3). Page code must never directly call `fetch()` / `supaFetch()` / PostgREST endpoints for member-scoped or catalogue data. Reads go through the upcoming `VYVEData.read(table, query)` API (PF-40.5). Writes go through `VYVEData.write(table, row)` (PF-40.4). The data layer is the only code that knows HTTP.

**The carve-outs (§23.10 honest-network-bound surfaces)** go through an explicit `VYVEData.fetchNetworkBound(endpoint, options)` API so they're nameable and auditable rather than indistinguishable from accidental REST calls. Carve-outs: leaderboard, AI moments (Anthropic round-trips), live session schedule, live session chat (Realtime), cron-driven content (newly-earned certs).

**Audit signal:** `ripgrep "fetch\(|supaFetch\(" --type=html --type=js` across `vyve-site`. Every hit that isn't inside `db.js`, `auth.js`, the upcoming `VYVEData.*` modules, or an explicit §23.10 carve-out is a violation.

**Cascading benefit when shipped:** PF-4b Part 1 (`members` read-after-write hazard) ceases to exist — `VYVEData.write()` does optimistic Dexie upsert before queueing the network write. PF-8's `members` carve-out closes. PF-33 (synchronous header counter mutation) becomes the API's responsibility, not the page's. PF-31 (page re-entry clobber) is impossible because reads only consult Dexie.

**Fix lands incrementally PF-40.4 (writes) + PF-40.5 (reads).** Until then, new code SHOULD follow the pattern (so the migration is mechanical) but existing code stays as-is until the audit (PF-40.1) drives the mechanical sweep.

### §23.13 — Tiered asset strategy (logged 14 May 2026, PM-106)

**Status:** HARD RULE. Codifies the asset direction of the local-first contract (active.md §3). Assets fall into one of three tiers; the tier determines storage strategy.

**Tier 1 — Bundled in IPA via PF-14b. ~2-3MB total.**
- Brand chrome (logo, icons, gradients, illustration system)
- Persona portraits (5 personas) + persona-matched animations (reusable by PF-13 hydration overlay + PF-27 AI-moment loading states)
- Home/empty-state illustrations
- Achievement tier illustrations
- Available offline forever, even before first login.

**Tier 2 — Pre-fetched on first-login / plan-switch. ~3-4MB.**
- Thumbnails for every exercise in the member's **currently active** workout plan
- Thumbnails for assigned habits (member_habits set)
- Persona-bound UI assets for daily surfaces
- Pre-fetch runs as part of onboarding EF v37 success handler (after consent gate, during walkthrough)
- Re-runs on plan switch
- Persisted in SW asset cache; lives until programme changes

**Tier 3 — CDN-on-view, HTTP-cached per session, no local persistence. Unbounded library size.**
- Non-current-programme exercise thumbnails (browsing the library when changing plans)
- Session card images (live session catalogue)
- Library-browse surfaces show placeholder + exercise name when offline; the library is a connected-state activity per §23.10

**Audit signal:** for every `<img src="...">` in vyve-site HTML/JS, classify the asset Tier 1 / 2 / 3. Tier 1 → must be in `www/assets/` under Capgo bundled mode. Tier 2 → must be in the pre-fetch list emitted by `VYVEAssets.prefetch(programme)`. Tier 3 → CDN URL only, must NOT be in SW asset cache, MUST have a placeholder fallback.

**Fix lands PF-40.6 (Tier 1) + PF-40.7 (Tier 2) + PF-40.8 (Tier 3).** PF-14b expands its scope to include Tier 1 asset bundling.


### §23.14 — Parallel-session collision discipline (logged 14 May 2026, PM-109)

**Status:** HARD RULE. Two PM-107 commits within 26 minutes (PM-108 context) and one mid-session brain drift in PM-104 prove that the "Live > Brain > Chat" source-of-truth chain leaves a real gap when two Claude sessions run against the same campaign in parallel.

**The risk pattern.** Session A loads brain at T=0, works for 30+ minutes, ships at T=45. Session B starts at T=15 with the same brain snapshot, doesn't see Session A's in-flight work, ships at T=20. Both sessions believe they hold the next PM number. The later-merged commit overwrites or duplicates the earlier one. Brain narrative drifts. Dean inherits the cleanup.

**Rules:**

1. **Pre-ship SHA re-check is non-optional.** Already in §4 — restated here for emphasis: immediately before any GITHUB_COMMIT_MULTIPLE_FILES, re-fetch main HEAD via GITHUB_GET_A_REFERENCE and compare to the SHA you started from. If it has moved, STOP. Read the new commit. Decide whether to rebase, merge, or stand down. Do not commit blind.

2. **If main moved during your session, read what shipped before assuming you have new work to do.** Fetch the parallel commit's diff via GITHUB_GET_A_COMMIT. Compare its deliverables to yours. Common outcomes:
   - **Stand down** — the parallel session covered everything you would have. Do not commit redundant work.
   - **Patch differences** — your work caught something theirs missed; commit only the delta as a follow-up (next PM number).
   - **Replace** — only if their work is materially worse, which is rare and requires Dean confirmation in chat.

3. **PM numbering after a parallel collision: take the next number, not the same.** If main has PM-107 from a parallel session and your work is a meaningful follow-up, it's PM-108, not "PM-107 part 2". Sequencing reflects what landed, not what you set out to do.

4. **Brief gaps left by a parallel session are valid follow-up work.** PM-108 is the canonical example: PM-107 shipped the audit but missed the DEAN_DECISION_NEEDED batch the brief specified. PM-108 closed that gap as a clean follow-up commit. Future sessions facing the same shape: read the brief carefully, compare to what the parallel session shipped, and commit the missing piece — not the whole thing again.

5. **Diagnostic dives during an audit are out of scope.** PM-108 dove into habits.html / db.js / sync.js trying to root-cause the PM-106 canary mid-audit. Brief said audit; auditing means cataloguing, not fixing. If you find yourself wanting to fix something during a read-only ship, log it as a finding in the playbook and keep auditing. Verified findings only land in §23. Unverified ones go in the changelog entry of the session that surfaced them and stay there until probed.

6. **Long-running sessions are at higher collision risk.** If you've been holding context for 45+ minutes without committing, the probability that another session has shipped against your campaign rises. Cheap mitigation: occasional `GITHUB_LIST_COMMITS` checks during long reads, particularly before any new tool-using sub-phase.

**Why this earns hard-rule status:** The parallel-collision shape has now appeared three times in five days (PM-104 brain drift after PM-98..PM-101 shipped silently, PM-107×2, PM-108 cleanup). It's not a freak occurrence; it's a property of how the brain-first / multi-session pattern interacts with GitHub's last-write-wins semantics. The rule documents the response so each future occurrence is cheap to handle.

**Worked example — PM-110 (the rule's first successful firing).** Brief stated "add `member_achievements` to sync.js plan() — schema slot already declared in db.js v2 but the pull entry is missing". PM-108 had locked it as Q8 of DEAN_DECISIONS_LOCKED. PM-109 carried it forward verbatim. PM-110 ran a 3-second `grep -nE "member_achievements" sync.js` against live `main@66f02b84` and found the entry at L268-276, with `GITHUB_LIST_COMMITS` confirming it has been there since `e8f02742` (13 May 2026, PF-2 + PF-3 commit). The "missing pull entry" finding was a PM-108 diagnostic-dive assertion that never had a verification step against live code; it propagated through two PM brief documents before PM-110's pre-edit live-file read caught it. Outcome: PM-110 dropped the planned `sync.js` edit entirely (no-op whitespace ships were rejected on the cursor/indent regression risk vs zero functional gain), surfaced the gap to Dean in chat, and proceeded with the probe + SW bump only. The rule fired exactly as designed — pre-edit live-state verification before assuming the brief is correct about the current world. Lesson encoded for future sessions: **when a brief says "X is missing from Y, add it", first verify "X is missing from Y" against live Y.** Cheap, high-leverage, prevents redundant ships.


### §23.15 — Quit Xcode fully before sed'ing `pbxproj`. The GUI silently rewrites it on view-focus.

**Earned PM-115.** Tonight burned 17 archives at the wrong version because Xcode's General tab silently rewrote `App.xcodeproj/project.pbxproj` every time it had focus and we'd just sed'd a value into it. The pattern: sed `CURRENT_PROJECT_VERSION = 1` to `CURRENT_PROJECT_VERSION = 2`, verify on disk with grep, switch to Xcode to archive, archive completes with `CURRENT_PROJECT_VERSION = 1` because Xcode rewrote pbxproj back the moment its General tab rendered.

**Rule:** Before editing `App.xcodeproj/project.pbxproj` directly via sed (or any other CLI tool), **fully quit Xcode** (`osascript -e 'tell application "Xcode" to quit'`), verify it's gone (`pgrep -x Xcode` returns nothing), THEN edit. Backgrounding Xcode is insufficient — the General tab must not be loaded into memory at all. After editing, you can reopen Xcode but do not focus the General tab unless the change has already been picked up by `xcodebuild -showBuildSettings`.

**The deeper rule:** Xcode's General tab in Identity is a read-write reflection of `pbxproj` build settings, not a read-only view. When the tab loads, it re-asserts what it last "knew" the values to be. If your sed change happened while the tab was already showing old values, the tab clobbers your change on next focus. This is not documented behaviour; it is observed reality.

**Mitigation alternatives:**
- Use `xcconfig` files for version strings instead of pbxproj literals (more invasive refactor; not done in VYVE)
- Use the GUI exclusively (slow, but Xcode doesn't fight itself)
- Use the CLI exclusively and never reopen Xcode after a sed (what we did tonight, eventually)

### §23.16 — Composio-tarball pattern for pulling vyve-site from Dean's Mac (private repo, no PAT, no `gh` CLI).

**Earned PM-115 (second instance — first was an earlier session, escalated tonight).** Dean's Mac has no GitHub PAT configured in keychain (or osxkeychain helper has stale auth) and no `gh` CLI installed. `git clone https://github.com/VYVEHealth/vyve-site.git` returns 403 "Write access to repository not granted" — the auth flow for a private repo can't complete.

**Pattern (validated PM-115):** use the assistant's Composio session to bundle the desired vyve-site state into a tarball, upload to S3 with a signed URL, share the URL + SHA-256, Dean runs `curl + tar -xzf` locally.

Mechanics:
1. Assistant fetches the target vyve-site commit via Composio `GITHUB_GET_A_TREE` recursive + parallel blob fetches.
2. Assistant assembles files into `/mnt/files/staging/` in the workbench.
3. `tar -czf /mnt/files/vyve-site-<sha>.tar.gz -C /mnt/files/staging .`
4. Upload via `upload_local_file` → returns S3 URL.
5. Compute SHA-256 of the tarball in the workbench.
6. Share URL + SHA-256 with Dean. Dean runs `curl -L -o /tmp/vyve-site-<sha>.tar.gz <url>` → `shasum -a 256 /tmp/vyve-site-<sha>.tar.gz` → compare → `tar -xzf` into `www/`.

**Tonight's instance:** vyve-site `83874dd5` (PM-114, 96 files, 3.8MB) into `~/Projects/vyve-capacitor/www/`. SHA-256 `288fda05bbbf765e8879010dcfbe8ad52e9a483552a04d20e47e07e151417b75` verified before extraction.

**Backlog escalation:** vyve-capacitor needs to become a real remote-tracked git repo (private VYVEHealth org repo, PAT-configured), so this dance isn't required. Hit twice in 48hr. Filed as a launch blocker, not hygiene.

### §23.17 — Capacitor's `App/Info.plist` ships with hardcoded version strings, not build-setting placeholders. Replace literals with `$(MARKETING_VERSION)` and `$(CURRENT_PROJECT_VERSION)` once per project.

**Earned PM-115.** With `GENERATE_INFOPLIST_FILE = NO` (the Capacitor default for the App target), archives copy `App/Info.plist` verbatim into the bundle. `CFBundleShortVersionString` and `CFBundleVersion` values in Info.plist are used directly — pbxproj `MARKETING_VERSION` and `CURRENT_PROJECT_VERSION` are ignored even when set. The Capacitor template ships Info.plist with literal strings like `<string>1.2</string>` rather than the standard Xcode placeholder syntax `<string>$(MARKETING_VERSION)</string>`.

This means: bumping `pbxproj` does nothing. The archive ships at whatever's in Info.plist.

**Fix (one-time per project, before first version bump after PF-14b setup):**

```bash
cd ios/App
cp App/Info.plist App/Info.plist.bak-pf14b
/usr/libexec/PlistBuddy -c "Set :CFBundleShortVersionString \$(MARKETING_VERSION)" App/Info.plist
/usr/libexec/PlistBuddy -c "Set :CFBundleVersion \$(CURRENT_PROJECT_VERSION)" App/Info.plist
# Verify
/usr/libexec/PlistBuddy -c "Print :CFBundleShortVersionString" App/Info.plist  # should output: $(MARKETING_VERSION)
/usr/libexec/PlistBuddy -c "Print :CFBundleVersion" App/Info.plist             # should output: $(CURRENT_PROJECT_VERSION)
```

After this fix, subsequent version bumps follow the standard pattern: edit `MARKETING_VERSION` and `CURRENT_PROJECT_VERSION` in `pbxproj`, the archive picks up the new values via Info.plist placeholder resolution.

**Re-verify after every Capacitor major upgrade.** `cap sync` is non-destructive to Info.plist as of Capacitor 8.3.0, but a major version migration (Capacitor 8 → 9 → ...) may overwrite. Confirm via PlistBuddy after any Capacitor upgrade. Same rule applies to the Android equivalent — check `android/app/build.gradle` for hardcoded versionCode/versionName when working on Android side.

### §23.18 — Apple closes a version train on first upload, regardless of whether the build was approved, rejected, or never reviewed.

**Earned PM-115.** Tonight's project was at iOS 1.2 (1) in App Store Connect. The 1.2 (1) build had been uploaded and ultimately rejected — never approved, never released. Despite this, the 1.2 train was closed: every subsequent upload attempt as 1.2.x was rejected at validation with "this version is no longer accepted." The only forward path was to bump marketing version to 1.3.

**Rule:** Track which marketing versions have been uploaded, not just which have been approved. Once any build in a marketing version has touched Apple's servers via upload, that train is closed forever. The next forward path is marketing version + 1.

**Pre-upload check:** before bumping `CURRENT_PROJECT_VERSION` (build number) and re-uploading under the same marketing version, verify in App Store Connect Distribution → iOS Builds that the marketing version still shows as "open" (i.e. accepting new builds). If it shows any historical builds at all — even rejected ones — bump marketing version.

**Re-statement of an earlier draft rule in PM-100s era that wasn't formally codified.** Now formally codified with tonight's hard evidence (17 wasted archives).

### §23.19 — CLI archive → CLI exportArchive → Organizer Distribute (or altool upload) bypasses every Xcode GUI rollback issue. Use when the GUI is fighting back.

**Earned PM-115.** When `xcodebuild -archive` ran from the command line tonight, it produced a clean 1.3 (2) archive on first attempt — once §23.15 (quit Xcode) + §23.17 (Info.plist placeholder fix) were in place. Xcode's Organizer GUI then accepted the CLI-produced archive for Distribute → App Store Connect upload without any of the version-rollback issues that plagued the in-IDE archive flow.

**Pipeline (validated PM-115):**

```bash
# 1. Archive from CLI (Xcode quit, do not reopen until step 3)
xcodebuild \
  -project ios/App/App.xcodeproj \
  -scheme App \
  -configuration Release \
  -destination "generic/platform=iOS" \
  archive \
  -archivePath ~/Desktop/VYVE-1.3-2.xcarchive

# 2. Export IPA from archive
cat > /tmp/ExportOptions.plist <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>method</key>
  <string>app-store-connect</string>
  <key>signingStyle</key>
  <string>automatic</string>
</dict>
</plist>
EOF

xcodebuild \
  -exportArchive \
  -archivePath ~/Desktop/VYVE-1.3-2.xcarchive \
  -exportPath ~/Desktop/VYVE-1.3-2-export \
  -exportOptionsPlist /tmp/ExportOptions.plist

# 3a. Upload via Organizer GUI (what we did tonight)
open ~/Desktop/VYVE-1.3-2.xcarchive  # opens in Organizer
# Click "Distribute App" → App Store Connect → Upload → wait for processing

# 3b. OR upload via altool CLI (alternative; not used tonight)
xcrun altool --upload-app \
  -f ~/Desktop/VYVE-1.3-2-export/App.ipa \
  -t ios \
  -u <apple-id-email> \
  -p <app-specific-password>
```

**Verification checkpoints in the pipeline:**

- After archive: `PlistBuddy -c "Print :CFBundleShortVersionString" ~/Desktop/VYVE-1.3-2.xcarchive/Products/Applications/App.app/Info.plist` should return the target marketing version
- After archive: same path with `CFBundleVersion` should return the target build number
- After export: IPA exists at `~/Desktop/VYVE-1.3-2-export/App.ipa`
- After upload: App Store Connect Distribution → iOS Builds shows the new build appearing within minutes (processing state ~5min, then "Ready to Submit")

**When to use this over the IDE flow:** anytime version values aren't sticking, anytime signing certs are being recalculated unexpectedly, anytime the IDE archive button is producing inconsistent output across attempts. The CLI is deterministic — same inputs produce same outputs. The IDE has hidden state.

### §23.20 — When re-establishing Android shipping for an existing app, jump versionCode to a clearly-higher integer rather than next-from-source-of-truth.

**Earned PM-116.** Local source had `versionCode 1`. iOS-equivalent reasoning suggested bumping to 2 for the next ship. Play Console rejected: "Version code 2 has already been used." Bumped to 3. Rejected. Bumped to 10. Accepted.

Cause: Play Console retains versionCode history across **all** uploads ever made to the application — not just published releases. Internal testing tracks, abandoned test uploads, legacy package-name uploads under the same dev account, all consume integers in the same monotonic sequence. The local source-of-truth (build.gradle) only knows what was committed; it doesn't know what was uploaded.

**Rule:** When the local Android build environment has been re-established on a new machine, when shipping the first build after a long gap, or when Play Console history is uncertain — start at versionCode 10 (or higher) rather than `prior + 1`. Cheap insurance against three to five rejected upload cycles. The wasted integers don't matter; you'll hit 100, 200, 1000 over the app's lifetime and the numbers are private to Play Console anyway.

**Pre-upload check (when uncertainty matters):** Play Console → App bundle explorer → see the highest existing versionCode across every track ever uploaded. Bump from that + 5-10 buffer.

### §23.21 — `keystore.properties storeFile` path is relative to `android/app/`, not `android/`.

**Earned PM-116.** First `keystore.properties` written with `storeFile=app/keystore/vyve-release-key.jks`. Gradle build failed: `Keystore file '/Users/deanbrown/Projects/vyve-capacitor/android/app/app/keystore/vyve-release-key.jks' not found for signing config 'release'.` Double `app/app/` in the resolved path.

Cause: `signingConfigs.release { storeFile file(...) }` block sits inside `android/app/build.gradle`. Gradle evaluates relative paths from the directory containing the `build.gradle` file doing the evaluation — that's `android/app/`. So `storeFile=app/keystore/...` resolves to `android/app/app/keystore/...`.

**Rule:** in `android/keystore.properties`, `storeFile` is relative to `android/app/`. Correct value when keystore lives at `android/app/keystore/vyve-release-key.jks` is `storeFile=keystore/vyve-release-key.jks`. The `keystore.properties` file itself sits at `android/keystore.properties` (rootProject level), but its `storeFile` value gets re-resolved at the `app/` level.

Workaround if path discipline gets confused: use an absolute path in `keystore.properties`. Costs portability across machines, fine for solo dev.

### §23.22 — PKCS12 keystores enforce store password === key password. Don't write a brute-force loop that tries them separately.

**Earned PM-116.** Recovered keystore from Drive. Tried Dean's candidate passwords against store password — `Weareinthis2026!` hit. Wrote a second loop to brute-force the key password separately. Result: same password also worked as the key password.

Cause: PKCS12 (`.jks` files created by modern keytool default to PKCS12 format since Java 9+, including the Android Studio bundled keytool) does not support separate store and key passwords. The format mandates they be identical. JKS-format keystores (legacy) allow separate passwords; PKCS12 doesn't.

**Rule:** When working with a `.jks` file of unknown provenance, first check its format with `keytool -list -keystore <path>` and look at the storetype header (or just try the store password as the key password first). If PKCS12, save the loop time. If legacy JKS, expect they may differ.

**Detection one-liner:** `keytool -list -v -keystore foo.jks -storepass <password> | grep -i "Keystore type"` returns either `PKCS12` or `jks`.

### §23.23 — Any Android bundle containing a plugin that declares health permissions in its manifest triggers the Play Console Health Declaration, even if the plugin is dormant at runtime.

**Earned PM-116.** Capgo Health plugin (`@capgo/capacitor-health@8.4.7`) is installed in the project but has no runtime activation path on Android today — Health Connect integration is a future PF-29 backlog item. The plugin's manifest still declares 25+ `android.permission.health.READ_*` permissions. Play Console's AAB scanner detected those and raised a hard release-blocking error: "You must complete the health declaration."

**Rule:** Before the first Android build that includes any plugin whose manifest declares `android.permission.health.*` permissions, plan time for the Health Declaration in Play Console. It is a 25+ field free-text form covering each declared permission, with each field requiring a written description of intended use. The declaration is permanent — once approved, future builds skip the form unless new health permissions are added to the manifest.

**Honest declaration is the right move when the plugin will be activated within ~6 months.** Strip-the-plugin is the right move if the plugin is incidental and won't ship in the live feature set within that window — it's faster, more truthful, and avoids maintaining a declaration that drifts from reality.

**Copy guidance:** descriptions should be in "planned use case" framing, naming the surface the data feeds (dashboard, AI coach recommendations, nutrition module, etc.), and explicitly stating data is private to the member if true. Google's review process for the declaration is automated for new declarations on existing apps; only edge cases or contradictory descriptions get manual review.

### §23.24 — Play Console retains state independent of the brain — verify live state before re-shipping an Android app that hasn't been touched in weeks.

**Earned PM-116.** Brain said: "Android 1.0.2 awaiting Play review." Pre-upload check showed 1.0.2 had been live since 21 April 2026 (3-4 weeks earlier), 3 installs, 100% rollout. Brain drift was silent because no PM-* between then and now had reason to touch Android state.

**Rule:** Same shape as §23.5 / §23.6 / §23.14 — when about to ship to a platform brain hasn't touched in weeks, fetch the live state of that platform's developer console (Play Console for Android, App Store Connect for iOS) before composing the ship plan. The pre-upload state-fetch costs a screenshot and 30 seconds; the cost of shipping based on stale brain assumptions is wasted version codes, mis-framed release notes, and bad assumptions about which track to upload to.

**Verification surfaces to fetch before any Android ship:**

- Play Console → App dashboard → live version + last-update timestamp + install count + rollout %
- Play Console → Test and release → Latest production release card (closed/open status, versionCode)
- Play Console → App bundle explorer → highest versionCode ever uploaded (drives §23.20)
- Play Console → App content → existing Health Declaration status (skips §23.23 marathon if already done)

**Same for iOS:** App Store Connect Distribution → iOS Builds (closed-train status per §23.18), Privacy → Health/Activity declarations, App Review status of all version trains.

### §23.25 — `tool_search` does not surface third-party MCP toolkits directly; route through `COMPOSIO_SEARCH_TOOLS` → `COMPOSIO_MULTI_EXECUTE_TOOL`.

**Surfaced PM-121 (15 May 2026).** `tool_search(query="github get repository content")` and any variant returns Google Drive write tools and Supabase `deploy_edge_function` — NOT the GitHub Composio toolkit. The GitHub MCP connection is active and operational; the host's `tool_search` discovery layer simply does not index Composio-provided toolkits (github, brevo, supabase via Composio, etc.) the way it surfaces first-party tools.

**The working pattern (verified PM-121):**

1. **Discovery:** call `tool_search(query="composio <toolkit>")` — e.g. `composio github repository`. This loads the Composio meta-tools (`COMPOSIO_SEARCH_TOOLS`, `COMPOSIO_MULTI_EXECUTE_TOOL`, `COMPOSIO_REMOTE_WORKBENCH`, `COMPOSIO_GET_TOOL_SCHEMAS`, `COMPOSIO_MANAGE_CONNECTIONS`, `COMPOSIO_WAIT_FOR_CONNECTIONS`, `COMPOSIO_REMOTE_BASH_TOOL`).
2. **Plan + schema fetch:** call `COMPOSIO_SEARCH_TOOLS` with a structured `queries` array and `session: {generate_id: true}` on first use. This returns connection status for the toolkit, the recommended plan, known pitfalls, and the input schemas for all relevant tool slugs in a single call. Reuse the returned `session_id` for the rest of the workflow.
3. **Execution:** call `COMPOSIO_MULTI_EXECUTE_TOOL` with the resolved tool slugs (`GITHUB_GET_REPOSITORY_CONTENT`, `GITHUB_COMMIT_MULTIPLE_FILES`, `GITHUB_GET_A_BRANCH`, `GITHUB_GET_A_TREE`, etc.) inside a `tools[]` array. Batch independent calls — the executor parallelises automatically. Pass `session_id` always.
4. **Heavy lifting:** for large file decoding, multi-file parallel fetches via raw URL, hashing, byte-equal verification, etc., use `COMPOSIO_REMOTE_WORKBENCH` (Jupyter sandbox with persistent state). `run_composio_tool(tool_slug, arguments)` from inside the workbench is the in-script equivalent of `COMPOSIO_MULTI_EXECUTE_TOOL`.

**Response handling quirks:**
- Large responses (`>300k tokens`) get saved to `/mnt/files/mex/trip.json` automatically; structure_info + data_preview returned inline. Always parse from the file when present rather than retrying for inline.
- `GITHUB_GET_REPOSITORY_CONTENT` returns `encoding: 'none'` and empty `content` for files over GitHub's Contents API 1MB limit (changelog.md hits this). Workaround: fetch via raw URL at the pinned commit SHA (`https://raw.githubusercontent.com/<owner>/<repo>/<sha>/<path>`), or via blob SHA from the `_links.git` URL on a prior call. Raw-at-branch is CDN-cached and stale per §23.15 — only use it for read-only loads where stale-by-minutes is acceptable.
- The Contents API returns base64 with embedded newlines. Decode with `re.sub(r'\s+', '', b64)` + pad to multiple of 4 + `base64.b64decode`.

**What this rule replaces:** prior sessions' implicit assumption that `tool_search` was the single discovery entry point for any tool. That worked for the previous interface generation; the current generation routes Composio toolkits through Composio's own meta-tools. The transition is invisible to the human — Dean's POV is "GitHub still works" — but it broke this session's first three minutes when `tool_search` returned only Google Drive and one Supabase tool repeatedly. Future Claudes: if `tool_search` returns suspiciously-narrow first-party results for an apparently-Composio-mediated toolkit (github, brevo, hubspot, the various Make/Slack/etc. integrations), jump straight to `tool_search(query="composio <toolkit>")` and proceed via the meta-tools. Don't burn turns retrying `tool_search` with variant phrasings.

**Connection status check:** `COMPOSIO_SEARCH_TOOLS` returns a `toolkit_connection_statuses` array. For github, expect `has_active_connection: true` and `accounts[].status: "ACTIVE"` with the `VYVEHealth` GitHub user. If not, `COMPOSIO_MANAGE_CONNECTIONS` with action `add` for the toolkit slug initiates a re-auth flow; surface the returned `redirect_url` as a markdown link and call `COMPOSIO_WAIT_FOR_CONNECTIONS` to poll. This has not yet fired in production but is the documented path.

**Generality:** this rule applies to every Composio-mediated toolkit, not just GitHub. The same indirection (or lack thereof, depending on the host generation) affects brevo, googledocs, supabase-via-composio (separate from the first-party Supabase tools), and any other toolkit listed in the Composio account inventory.

## 24. Premium Feel Campaign — local-first migration (active)

> **Launched 13 May 2026 PM-77.** Target launch 31 May 2026. See `brain/active.md` §3 and `playbooks/premium-feel-campaign.md` for the working details.

VYVE is migrating from a server-first architecture (every page fetches from Supabase EFs on every load) to a local-first architecture (every page reads from on-device Dexie/IndexedDB; Supabase becomes the background sync target).

**The architectural commitment, locked at PM-77, is immutable:**

- VYVE is a **Capacitor-wrapped native iOS+Android app** with web fallback at online.vyvehealth.co.uk. It is NOT a PWA. Future Claudes that reference "PWA" are wrong. The PWA install prompt code in index.html is legacy and slated for removal.
- **On-device Dexie (IndexedDB) is the source of truth for the member's own data.** Every read goes to Dexie. Every write hits Dexie first, then queues to Supabase in the background.
- **Supabase is** the sync target, the cross-device propagation layer via Realtime, and the server-side compute layer for AI generation, cron-driven achievements/certificates, leaderboards, and employer aggregate reporting. **It is not the rendering source for the member's own data.**
- **This commitment may not be revised** without producing a specific measured problem this architecture can't solve. Any future session that proposes "let's try a different pattern" must justify against this paragraph in the changelog and get Dean's explicit approval. The Layers 1-4 era of pivoting between architectures is closed.

**Why this campaign exists:** Layers 1-4 (PM-29 through PM-66) built optimistic UI patterns, cross-device sync via Supabase Realtime, and reconcile-and-revert. They are valuable work that remains useful in the new architecture. But the rendering source remained server-fetched member-dashboard EF data, and that EF runs 17s cold / 7s warm. So the app never feels instant despite the architectural plumbing. Layers 1-4 solved the cross-device coherence problem; they did not solve the "every tap is instant" problem. Local-first solves the latter directly by removing the server-fetch hot path entirely.

**Why Dexie specifically:** Mature (10+ years), free (MIT, no premium tier), works inside Capacitor's WKWebView, no new backend service, full control over the sync layer. RxDB was considered but its Supabase replication plugin is paid (€480/year) and over-engineered for the single-device-per-user working assumption. PowerSync was considered but adds a separate backend service to the stack. Dexie + a custom sync layer using existing Supabase calls is the right shape.

**Operating mode for this campaign:**

- **Claude leads, Dean drives.** Default for technical decisions: Claude decides and moves forward, Dean retains veto. Asking Dean to choose between options wastes his time — he is fully led by Claude.
- **Single-device-per-user is the working assumption.** Last-write-wins for any conflicts. No per-table conflict policy work. Multi-device cases are supported but not optimised; the 1-2% edge cases get triaged post-launch.
- **All existing member data is wiped at launch (31 May 2026).** No migration concerns from old to new.
- **Session granularity matches Dean's reality:** long evening sessions (3-6 hours), all-day Sundays, plus small commute/lunch windows. Tasks in the campaign playbook are sliced so any window can pick up a task and ship it.
- **Brain is the contract.** Every session-end updates `brain/active.md` (always) + the campaign playbook (if task progressed) + master/changelog/backlog (only on architectural changes or campaign closures).

**What goes out of scope as part of this campaign (DO NOT WORK ON during the campaign):**

- Layer 6 SPA shell — dropped (local-first delivers the perceived speed gains; SPA shell is no longer worth the rewrite).
- PM-71 / PM-71b dashboard payload trim — becomes mostly obsolete after migration.
- PM-72 materialise achievement_progress — same, becomes obsolete.
- PM-73 home redesign — deferred until after launch + data on what the simplified payload contains.
- Backend EF perf work (warm-keeping cron, denormalisation) — becomes mostly obsolete after migration.

These remain in the historical backlog as superseded. Post-launch they can be revisited; during the campaign they are deferred.

**Task backlog:** see `playbooks/premium-feel-campaign.md`. 20 tasks (PF-1 through PF-20) sequenced from "Dexie spike on daily_habits end-to-end" through "merge local-first branch into main". Each task is self-contained and shippable in a single session window.

**Status:** Campaign just launched at this commit. PF-1 (Dexie spike) is the next task. Ready to pick up.

---

### PF-40 Local-First Consolidation Campaign (logged PM-106, 14 May 2026 evening)

**The consolidation phase of the Premium Feel Campaign.** Strengthens the architectural commitment from "Dexie is the source for member-scoped reads/writes" to **"Dexie is the complete reading source for the app"** — every page renders from Dexie unconditionally, with explicit §23.10 carve-outs for honestly-network-bound surfaces. The campaign exists because the per-page wire pattern (PF-6 through PF-12, PF-15.x, PF-34) was correct in shape but incomplete in foundation — the hydrate layer pulls thin rows where the UI reads fat data, the write path bypasses any consolidation point, and assets have no tiering. The Habits "undefined" canary on 14 May 2026 evening surfaced this gap on production. PF-40 fixes the foundation; the per-page work becomes mechanical.

**Sub-items in dependency order:**

- **PF-40.1 audit** (read-only, ~3-4h solo daytime, no device). Enumerate every `fetch()`, every `supaFetch()`, every `writeQueued()`, every direct PostgREST call across vyve-site. Classify as member-scoped read / catalogue read / member-scoped write / §23.10 carve-out / dead code. Output a JSON map keyed by file:line that drives PF-40.4 + PF-40.5 mechanically. Also produces `playbooks/pf-40-local-first-consolidation.md` as the campaign reference document.
- **PF-40.2 fat-row member-scoped hydrate** (~1-2 sessions, device verify). Expand `db.js pullOneTable()` for every member-scoped table to fetch with denormalised join columns. Fixes the Habits "undefined" canary at the root. Schema audit per table.
- **PF-40.3 catalogue tables as first-class** (~1 session). Add `habit_library`, `workout_plans` (all 5 plans), `nutrition_common_foods`, `personas`, `service_catalogue`, `knowledge_base`, exercises, `running_plan_cache` to the hydrate. `_catalogue_meta` table tracks `last_updated_at` per catalogue for delta-pulls.
- **PF-40.4 `VYVEData.write(table, row)` API + per-page migration** (~1 session API + 2 sessions migration, device verify each batch). Optimistic Dexie upsert with fat-row support, bus publish, `_sync_queue` enqueue, return synchronously. Drainer is the only HTTP-aware code. Per-page workarounds (PF-1 daily_habits, PF-9 cardio, PF-10 wellbeing, PF-12 settings × 6, PF-34 movement × 4) all collapse into the API.
- **PF-40.5 `VYVEData.read(table, query)` API + page-level fetch removal** (~2 sessions, device verify each batch). Page reads from Dexie unconditionally. If Dexie is empty post-first-hydrate, that's a hydrate bug — throw, don't fall back. Carve-outs use explicit `VYVEData.fetchNetworkBound()`.
- **PF-40.6 Tier 1 assets bundled in IPA** (~0.5 session, folds into PF-14b). Move brand chrome + persona portraits/animations + illustrations into `www/assets/` under Capgo bundled mode. iOS 1.2 build includes Tier 1.
- **PF-40.7 Tier 2 pre-fetch** (~1 session, device verify). `VYVEAssets.prefetch(programme)` runs as part of onboarding EF v37 success handler + on plan switch. Persists into SW asset cache.
- **PF-40.8 Tier 3 CDN-on-view + placeholders** (~0.5 session). SW fetch handler explicitly excludes Tier 3 URLs from cache. Library-browse surfaces show honest offline state.
- **PF-40.9 boot chain offline-equivalence** (~1 session, airplane-mode device test mandatory). Every `await` between page load and `vyveSignalAuthReady` tolerates network failure. PF-14d folds here.
- **PF-40.10 catalogue delta-pull with `updated_at` + force-refresh lever** (~1 session). Delta-pull respects `updated_at`. Emergency catalogue retractions via `_catalogue_force_refresh` version bump.
- **PF-40.11 offline UX states for §23.10 carve-outs** (~1-2 sessions, Lewis copy gate). Designed offline states for leaderboard, sessions schedule, AI moments, live chat, certificate-pending. Folds PF-14e.
- **PF-40.12 spike-flag removal + main-only path** (~0.5 session, campaign closer). All spike-off code paths deleted, toggle UI removed, `vyve_lf_spike` treated as unconditionally ON.

**Total estimate:** 13-16 Claude-assisted sessions. Two batches are device-required (the read/write API migrations). Hard sequencing: PF-40.1 must land first; everything else parallelises into four work streams (data layer, asset layer, boot layer, UX layer).

**Folded into PF-40 (closed as standalone backlog items at campaign launch):** PF-14c (already shipped PM-105), PF-14d, PF-14e, PF-15.write-optimistic, PF-31, PF-32, PF-33, PF-34 partial, PF-34b, PF-35, PF-36. All become symptoms PF-40 fixes structurally. Backlog cleanup at PF-40 close.

**Stays separate:** PF-14b (bundled-mode migration — same review cycle but its own commit), PF-21 (nav restructure), PF-23 (interactive tutorial — V2), HAVEN clinical sign-off (Phil-blocked), achievements overhaul (post-trial), copy gates.

**Status at PM-106 commit:** scoped and approved by Dean. Next ship is PF-40.1 audit (solo daytime, read-only).


## 25. Key references, credentials & URLs

| Reference | Value |
|---|---|
| Supabase project ID | `ixjfklpckgxrwjlfsaaz` (West EU / Ireland, Pro) |
| Service account | `supabase_palli-wode` |
| VAPID public key | `BDbz2-0k3JcqRWKyasr3MNgEZrXhKsVvjS-otCyyV7Ya4Pi2xXOxXGETUpVoE56VorKzSNy7uyep53gOzNEMTu4` |
| PostHog key | `phc_8gekeZglc1HBDu3d9kMuqOuRWn6HIChhnaiQi6uvonl` |
| Stripe payment link | `buy.stripe.com/00wfZicla1Em0NnaIB93y00` → `welcome.html` (target-url drift suspected — historically `onboarding_v8.html` per the marketing-site config; verify via Stripe dashboard at next opportunity, then reconcile here). |
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
| SW cache | See live `vyve-site/sw.js` (key bumps on every portal commit; do not maintain inline here). Latest at this rewrite: `vyve-cache-v2026-05-08-perf-shim-f` (08 May 2026 PM-21). |
| Make social publisher | Scenario 4950386 — BROKEN since 23 March |
| Make analytics collectors | Scenarios 4993944 (IG), 4993948 (FB), 4993949 (LinkedIn) → Data Store 107716 |
| Facebook connection expiry | **22 MAY 2026 — Lewis to renew urgently** |
| GitHub PAT | `GITHUB_PAT_BRAIN` — scoped to `VYVEHealth/VYVEBrain` Contents R/W. Expires **18 April 2027** (calendar rotation required) |
| APNs auth key | KEY_ID `2MWXR57BU4` — **rotation deferred 07 May 2026 PM-4 as accepted risk** (see §22). Chat exposure 27 April PM, rotation attempt 07 May hit Apple's 2-keys-per-team cap, deferred pending Sage procurement diligence. If Sage's security review surfaces it, rotate then via the runbook in `playbooks/disaster-recovery.md` (TBC). |
| GitHub PAT (`vyve-capacitor`) | Fine-scoped, Contents R/W on `VYVEHealth/vyve-capacitor` only. Expires **7 May 2027** (calendar rotation required). Cached in macOS Keychain on Dean's Mac. |
| Supabase Management PAT | Stored as Supabase Edge Function secret `MGMT_PAT` (NOT `SUPABASE_MGMT_PAT` — Supabase reserves the `SUPABASE_` prefix; see §23). ALSO stored as GitHub Actions repository secret `MGMT_PAT` on `VYVEHealth/VYVEBrain` for the `backup-edge-functions.yml` workflow. Both copies hold the same PAT value. Project-scoped via Management API. Expires **6 Jun 2026** (calendar rotation required) — when rotating, update both the Supabase secret AND the GitHub Actions secret in the same session. |
| Legacy service-role JWT | Stored as Supabase secret `LEGACY_SERVICE_ROLE_JWT` (dual-auth pattern for `send-push` + `achievement-earned-push`) |

### Repos

- `VYVEHealth/vyve-site` — portal web shell (GitHub Pages at `online.vyvehealth.co.uk`; bundled into both Capacitor binaries via `npx cap copy`).
- `VYVEHealth/Test-Site-Finalv3` — marketing/onboarding site (`www.vyvehealth.co.uk`).
- `VYVEHealth/VYVEBrain` — AI source-of-truth document store (this repo).
- `vyve-command-centre` — Lewis's internal ops dashboard + admin console.
- `~/Projects/vyve-capacitor` — iOS native Capacitor wrapper. Local git repo, remote `VYVEHealth/vyve-capacitor` (private), reconciled 07 May PM-4. See §23 `vyve-capacitor git workflow` rule for full auth + ignore setup.

### Composio / GitHub patterns (codified)

- Large files (>~50K chars): always commit via `run_composio_tool("GITHUB_COMMIT_MULTIPLE_FILES", args)` inside the Composio workbench, never direct MCP.
- `GITHUB_GET_RAW_REPOSITORY_CONTENT` → S3 URL needing secondary fetch; expires quickly, save to `/tmp/` immediately. Decode bytes with `r.content.decode("utf-8")`, not `r.text`.
- `GITHUB_GET_REPOSITORY_CONTENT` → nested `data.content.content` base64; strip whitespace + pad + decode.
- Multi-file atomic commits: `upserts` array (not `files`); field is `message` not `commit_message`. `deletes` is a flat array of path strings, not objects.
- Always verify large commits by re-fetching and checking the first 100 characters.

---

*End of VYVE Health brain master. Single source of truth. Full rewrite 28 April 2026 PM — supersedes all prior versions including the 24 April rewrite. Next rewrite when drift warrants, not by incremental patching.*