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
| Streaming | Riverside (7 studios, permanent links) + YouTube (**ONE channel — `UCuptZFgSk0ZmNnE2IbYBdtg` "VYVE"** — with **9 reusable RTMP stream keys + 8 category playlists** all on that one channel; each stream key paired to a dedicated Riverside studio; PM-286 codifies this after verifying live via `yt-channel-audit` EF — PM-191's "9 channels" framing was wrong, it's 9 keys on 1 channel) + Castr (scheduled pre-recorded). Architecture for scaling to 12-15 live sessions/day locked PM-191: reusable-stream pattern (YouTube `liveStream.isReusable=true`, one persistent stream per channel, many `liveBroadcast` resources bound via API) with Command Centre orchestrating batch broadcast creation. See backlog "Session content management surface" v2 layer. Test next week before phase 2 build. |
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

## 6. Supabase architecture — 88 tables

Project `ixjfklpckgxrwjlfsaaz` (Pro plan, West EU/Ireland). All public tables have RLS enabled (April 2026 audit). Live row counts not tracked in brain — query Supabase directly or read the auto-refreshed `brain/schema-snapshot.md` (regenerated weekly Sunday 03:00 UTC by the `schema-snapshot-refresh` cron).

### Core member + activity (member-scoped RLS)

| Table | Purpose |
|---|---|
| `members` | Core member profiles. Email PK. Persona, welcome recs, goals, consent flags, `exercise_stream`, `avatar_url` (PM-228 23 May — Profile Identity slice, public URL into `member-avatars` Storage bucket). |
| `employer_members` | Employer–member relationships (empty until first enterprise goes live). |
| `daily_habits` | Habit completions. Cap 10/day via BEFORE INSERT trigger; over-cap routed to `activity_dedupe`. `notes='autotick'` distinguishes HK auto-ticked rows. |
| `workouts` | Workout completions. `source` column (`'manual'` vs `'healthkit'`). Cap 2/day for `source='manual'` only (since 7a, 24 April). HK-sourced rows bypass entirely. |
| `cardio` | Cardio completions. Same source-aware cap as workouts. |
| `session_views` | Live session views. Cap 2/day all sources. |
| `replay_views` | Replay views. |
| `replay_video_views` | PM-294 (24 May 2026, vyve-site `f770d696`, commit-labelled PM-292) — per-video replay attribution from the YouTube IFrame API tracker (`replay-tracker.js`). One row per (member, video, client_id). Written at watch_seconds ≥ 30 (Dean's "real engagement" threshold), updated every subsequent 30s via PostgREST `PATCH ?client_id=eq.X` upsert. `completed=true` when `pct_watched >= 90`. Denormalised `playlist_slug`, `category`, `host_name`, `total_seconds`, `activity_date` (YYYY-MM-DD, BST-aware — engagement.html reads via existing date-keyed `addLog` loop, additive into Variety 'sessions' bucket alongside `replay_views`). RLS member-scoped SELECT/INSERT/UPDATE on `auth.email() = member_email`; no DELETE policy (append/update-only from client). FK: `youtube_video_id → replay_videos(youtube_video_id) ON DELETE CASCADE`. Indexes: partial UNIQUE `(member_email, youtube_video_id, client_id)` for outbox-retry safety, `(member_email, last_updated_at DESC)` for future Continue Watching, `(youtube_video_id)` for future per-instructor drop-off analytics. Separate from legacy `replay_views` (dormant, sync-pulled only, still fed into `refresh_member_home_state` overall_streak UNION). |
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

### Mind section (NEW — PM-173 shipped 20 May 2026)

| Table | Purpose |
|---|---|
| `mind_activities` | Member-scoped Mind activity log. Single table, `kind` discriminator (breathwork / journal / affirmation / visualisation). No daily cap — raw log. RLS subquery-wrapped per §23 PM-8. Trigger reuses `set_activity_time_fields`. Path 2 from PM-172 design lock. |
| `breathwork_patterns` | Catalogue of breathwork patterns. Public-read RLS. 4 active rows at launch (`box-4444`, `sigh`, `478`, `coherent-55`). `phases jsonb`, `default_rounds`, audio URL columns (4, all nullable, day-1-silent-default). Add new patterns by Supabase INSERT — no app update. |
| `affirmations_library` | Catalogue of affirmations. Public-read RLS. 30 active rows at launch (**Claude-generated placeholders — Lewis to edit live in Supabase any time**). 5 categories: focus / growth / resilience / self-worth / self-care. Add or replace by Supabase INSERT/UPDATE. |

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
| `service_catalogue` | Available sessions and content. `image_url` (TEXT nullable, added PM-190 21 May 2026) drives thumbnail imagery per row — NULL renders gradient placeholder. Editable per row to allow on-the-fly imagery updates without code deploy. Governed by §23.49 (catalogue imagery contract). |

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

**Hub-page hero pattern (PM-244, 23 May 2026; PM-246 + PM-247, 23 May 2026; PM-252, 24 May 2026).** The hub pages (Home, Body, Mind, Connect) use a `position:fixed` photographic hero band at the top with scrolling content below. The soft seam between photo and content follows the **§23.57 canonical scrolling-fade recipe** — dedicated `.X-hero-fade` absolute-positioned div as first child of `.wrap`, lifted up 80px via `transform:translateY(-100%)`, 3-stop rgba gradient with `[data-theme="light"]` override. `connect.html` (PM-246), `mind.html` (PM-246), and `exercise.html` (PM-252 — the "Body" hub) all implement the recipe; `index.html` will adopt if/when it gets a photo hero during Premium Feel continuation.

**Hub-hero canonical size (PM-247, 23 May 2026): `max(250px, 35vh)`.** Two paired values must always match on each page or content overlaps the photo / a gap appears: (1) `.X-hero { height: max(250px, 35vh); }` and (2) `main { padding-top: max(250px, 35vh); }` (or its `body.X-page main` scoped override). The 35vh applies to viewport-driven scaling — the band takes 35% of viewport height on phones taller than ~720px. The 250px floor protects against the band collapsing too short on small phones where 35vh < 250px. Dean's spec at PM-247: *"the picture needs to only take up about 35%, similar to the connect one. That will be the target going forward for all hero images."* Before PM-247, connect was on `max(260px, 36vh)` and mind was on `max(280px, 46vh)`. Both standardised in the same commit.

**Caveat — see §23.58.** PM-244 was silently reverted within 16min by a stale-workbench whole-file commit on the same file; PM-246 recovered the recipe AND codified §23.58 to prevent recurrence.

### Core pages

| Page | Purpose |
|---|---|
| `index.html` | Member dashboard. Cache-first (skeleton on first load, instant on return). Reads `member-dashboard` v57. Daily check-in pill strip, activity score ring, recurring 4-row weekly goals strip (refreshed every Monday by `seed-weekly-goals` cron), live session slot, charity banner. "Coming Up This Week" block removed 06 May PM (was hardcoded placeholder, never dynamic). Orphan `.upcoming-*` CSS still in stylesheet pending hygiene pass. |
| `habits.html` | Daily habit logging. 7-day pill strip, streak + dot strip, monthly theme badge. Wired to HealthKit autotick: fourth parallel fetch to `member-dashboard` v55 merges `has_rule` + `health_auto_satisfied` + `health_progress` into `habitsData` by `habit_id`; pre-render `runAutotickPass()` stamps satisfied rule rows as yes with `notes='autotick'`; `.hk-progress` bar + text on unsatisfied rows; done-state sub-label reads "from Apple Health" on auto-ticked rows, "Logged to your progress" on manual-yes rows. No visual badge — attribution is copy-only. Cache key `vyve_habits_cache_v3`. PM-152: difficulty pill removed, description/prompt in tap-to-expand dropdown. PM-151: settings saves wired via `habits:set-changed` bus event. |
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

## 11B. Page documentation (`/page-docs/`)

New top-level folder in VYVEBrain repo, opened PM-285 (25 May 2026). One markdown file per portal page describing what the page is, why it exists, what a member sees, how they use it, and what data flows through it. Plain English, member-readable, no SQL, no §23 references.

**Distinction from `/brain/master.md`.** Master is engineering-context only — Claude reads master for technical work, never these docs. The /page-docs/ folder is for Lewis/Alan/Calum/Phil/Vicki/Cole, sales prospects who need to understand the product, support team members onboarding, and ultimately the member-facing help centre.

**File naming.** One file per portal page, lowercase, matching the HTML filename: `engagement.md` for `engagement.html`, `habits.md` for `habits.html`, etc.

**Maintenance.** Each doc is updated when the page itself meaningfully changes — new sections, new mechanics, new copy direction. The doc captures the *member experience* of the page, which moves more slowly than the implementation. Pages shipped without a doc earn a follow-up task on the next session that touches them.

**As-you-go discipline (locked PM-285, 25 May).** When a session touches a page — for any reason, architecture audit, feature build, bug fix, copy pass — the corresponding `/page-docs/<page>.md` ships in the same commit as the code change, drafted or refreshed to match the page's current state. The discipline avoids the documentation-deferred-forever failure mode where pages drift from their docs and the whole folder becomes untrusted. If the page-doc doesn't exist yet, this is the session that creates it. If it exists, this is the session that updates it. A whole-session pass to backfill page-docs across the portal is acceptable as a session theme, but no individual page change ships without its doc being touched.

**Current state.** `page-docs/README.md` (folder intro + maintenance convention + current-docs index) + `page-docs/engagement.md` (drafted alongside PM-285 v2 score design so the new architecture lands documented from day one). All other pages remain to be documented — Lewis decides priority order based on what he needs to explain externally first.

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

**Engagement score — v1 live, v2 design-locked PM-285 (25 May 2026), implementation tomorrow.**

**v1 (currently live).** Engagement score 0–100 ring. Activity + Consistency + Variety + Wellbeing components (12.5 points each) + base 50. Surface dropped from index home page PM-256 (24 May); lives on engagement.html only via the More menu. Dropped from index because PM-256 home redesign chose habits + focus carousel as the visible feedback loop, leaving the score as a deeper internal health signal. Computed both server-side (`compute_engagement_components` Postgres function) and client-side (`computeEngagementComponents` in `home-state-local.js`) in lockstep per PF-11b / PM-89.

**v2 (designed PM-285, implements PM-286+).** Full rewrite. New formula: `final_score = 50 + min(50, (base_points × consistency_mult × variety_mult) / 2.5)`. Wellbeing dropped entirely (the act of submitting a check-in earns its points; the score is not penalised by an honest low self-report). Consistency (0.85–1.30) and Variety (0.90–1.20) become multipliers on base points, not separate components — eliminates double-counting (daily user got credit for being daily AND consistent) and prevents gaming (1 tap per pillar at 11pm maxed Variety regardless of genuine engagement). Six base-point pillars: Today's Focus (5pts each, cap 3/day), Daily Habits (1pt each, cap 5/day), Body (2pts each, cap 2/day), Mind (2pts each, cap 2/day), Connect (2pts each, cap 2/day), Check-ins (weekly 8 / live 4 / monthly 12). 7-day rolling window with linear decay (today 100% → day-7 0%); new logs continuously displace old, score drift IS the re-engagement push trigger. Three push thresholds: soft slide <75 (14d cooldown), pillar gap <65 for 3d (5d cooldown), re-engagement <55 for 7d (14d cooldown). Pillar-gap notification reads variety calc to name which pillar is empty + suggests 10-min action. Two new tables required: `live_checkin_submissions` (form embedded in weekly, 1/week unique) + `monthly_checkins` (1/month unique). Today's Focus disambiguation via `focus_slug` column on target tables — rows with focus_slug counts under Focus only, not double-counted under their underlying pillar. Dexie-first instant updates: score recompute fires on bus events ~16ms after tap, server is backup not source. Bus subscriber order matters — recalc subscribes AFTER Dexie write subscriber (audit checklist item for tomorrow). Migration 5 phases (schema → v2 fn alongside v1 → JS port + parity → UI behind `?score=v2` flag → cutover). UI surfaces score hero + multiplier strip + per-pillar breakdown + Activity Breakdown 5-card grid (Daily Habits/Body/Mind/Connect/Check-ins, each with ⓘ eye → bottom-sheet explainer) + 30-day strip unchanged from v1. Lewis owns eye-popup copy. v2 30-day-tap-expand parked post-soft-launch. Full spec in Claude's `/home/claude/work/engagement-score-spec.md` session artefact; member-readable version at `/page-docs/engagement.md` (see §11A).

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

## 19. Current status — 24 May 2026 PM-294 (Per-video replay attribution shipped via YouTube IFrame API tracker. New `replay_video_views` Supabase table + Dexie SCHEMA_V13 store + standalone `replay-tracker.js` module + wiring through `replays.html`/`replay-category.html` + additive read in `engagement.html` Variety component. Closes the PM-235 regression where collapsing 8 separate replay pages into 1 hub broke per-category attribution. Tracker uses IFrame API onStateChange + 5s polling of getCurrentTime(); accumulator advances only when prev+current state both PLAYING (buffering/paused/seeking excluded). Threshold 30s for "real engagement" (Dean's call); first write at crossing via `VYVEData.writeQueued` (offline-tolerant Dexie + outbox), subsequent updates every 30s via PostgREST `PATCH ?client_id=eq.X`. `completed=true` when `pct_watched >= 90`. Local-first read merge already canonical via PM-119 `buildEngagementFromDexie` — no new layer needed; `replay-tracker.js` calls `VYVELocalDB.replay_video_views.upsert(row)` synchronously alongside the network write so next engagement read sees the row instantly. Legacy `replay_views` stays dormant per spec — no migration, `refresh_member_home_state` UNION untouched. 9-file atomic vyve-site commit `f770d696` (commit-message-labelled PM-292 due to brain-narrative PM-number collision with parallel session's PM-292 recovery commit at 21:02:33Z; renumbered to PM-294 in brain to preserve narrative integrity — git commit message stays as historical artefact). Supabase migration `pm292_create_replay_video_views` applied (also carries misnamed PM-292; migration names are append-only Supabase history). sw cache `pm292-replay-attribution-a`, vbb-marker 182. **§23 candidate** earned around pre-commit brain-HEAD re-fetch for PM-number claims — second PM-collision in three days; held back from formal §23 codification pending one more occurrence per the parallel-session "pre-commit content rebase" candidate (their proposal for code files, mine for brain narrative — both sibling discipline gaps in §23.41).)

## 19. Current status — 24 May 2026 PM-286 (PM-215 cron SHIPPED + architecture correction. `session-publish` EF v1 + `session_categories` table + hourly cron — end-to-end test passed creating a real broadcast on the VYVE channel, binding to the matching stream, adding to the matching playlist, writing back to `calendar_occurrences`. 2.6s elapsed, idempotent. Architecture correction: one YouTube channel, NOT nine — PM-191 captured the design conversation incorrectly; live verification via `yt-channel-audit` EF confirms single channel `UCuptZFgSk0ZmNnE2IbYBdtg` with 9 reusable RTMP keys + 8 playlists, all on that one channel. Privacy locked `unlisted` in cron, cannot be overridden. Playbook `live-sessions-operations.md` rewritten to match shipped reality. No vyve-site changes; Supabase + brain commit only.)

## 19. Current status — 24 May 2026 PM-284 (Focus pages — page-reopen done-restore + reflection prompt context. Two device-review issues from PM-283 ship. (1) 10 of 12 focus pages didn't persist done state across navigation — member completes "Send a message" on connect, navigates back, taps card again, sees "Mark complete" idle CTA despite Dexie row existing for today. Only reflection/reset/movement had per-page boot-time done detection. (2) reflection.html done state said "Today's reflection is saved." with no recall of what the prompt was. Fix (1) — centralised page-reopen done-restore in `focus-shell.js`. New helpers `queryTodaysRow(slug, email)` + `restoreDoneIfFoundRow(row)`. Reads `VYVEFocusCatalogue.getEntry(slug).write_target` to know which Dexie table + key to query — handles all 4 target tables: `mind_activities` (compound `[member_email+kind+activity_date]`), `connect_checkins` (compound `[member_email+checkin_date]`), `cardio` (date compound + cardio_type filter), `nutrition_logs` (date compound + meal_label filter). Wired into `init()` ready() — after auth resolves, queries Dexie, flips view-done if row found. PM-283 MutationObserver picks up the class change and stamps body.is-completed automatically. Zero per-page concession. `init()` resolve payload extended with `todaysRow` so reflection.html can render quote without duplicate query. Fix (2) — `.focus-done-prompt` element added in reflection.html view-done between title and sub. Inline CSS rule: italic Playfair, teal accent (light: teal-dark), centred, slightly smaller than title. `paintTodaysPrompt()` populates + shows it on boot regardless of which path activates view-done later. Also tightened margin in is-completed state. sw cache `pm284-reopen-restore-a`, vbb-marker 171, vyve-site `234e7a3d`. No new §23 rule — the fix follows §23.64 (hook-path audit before CSS iteration) and the centralise-in-shared-chrome pattern from PM-283.)

## 19. Current status — 24 May 2026 PM-283 (Focus done-state body-class auto-stamp — PM-280/281/282 didn't land. Three sessions of CSS surgery iterated on the done-state composition but none made it to device because the bug wasn't in CSS. `body.is-completed` was only added inside `focus-shell.complete()` (post-Save path). Every focus page's page-reopen guard (`renderDoneFromEntry()` → `swapView('view-done')`) activated view-done WITHOUT adding the body class, leaving the entire is-completed CSS block inert. Photo stayed fixed at 35vh, main kept its big padding-top, panel eyebrow + title stayed visible above the orb, internal margins stayed loose. Three rounds of CSS spec was correct; runtime never applied it on the path Dean was looking at. Fix: hooked `document.body.classList.add('is-completed')` into the existing `wireCompletionSlide` MutationObserver in `focus-shell.js` — observer already watches view-done for `.is-active` and already has an initial-paint hook, so one change covers post-Save AND page-reopen across all 12 focus pages with zero per-page edits. Same commit also drops `.focus-hero` max-height 45vh → 40vh and resets `.focus-cta-wrap` to static (no sticky, no gradient) with tight padding in is-completed state — ~60px of viewport reclaimed for the done-quote case where prior math overflowed by ~36px. sw cache `pm283-done-class-stamp-a`, vbb-marker 170, vyve-site `eb7562e8`. Earns §23.64 — CSS-only iterations that fail on device should trigger a hook-path audit, not another CSS pass.)

## 19. Current status — 24 May 2026 PM-279.2 (Live sessions ops playbook expanded — sibling-session work. Privacy = `unlisted` locked as canonical per Lewis decision 24 May. Session intake spec: 8 fields per session, preferred handover format pasted block in chat, pipe-delimited, one line per session, monthly batches. Portal Admin UI shape defined — lives in `vyve-command-centre` at `admin.vyvehealth.co.uk/calendar`, MVP = list + add + edit + cancel for `calendar_occurrences`, magic-link auth (Command Centre pattern), no YouTube broadcast UI, no Riverside integration. Order of operations locked: PM-215 cron FIRST → 1 month of pasted-timetable ops → Portal Admin UI MVP with those learnings. Pending Lewis non-blocking: per-category host names, instructor photo set. Operational playbook expansion only, no code, no new §23 rule.)

## 19. Current status — 24 May 2026 PM-279 (Reusable-stream diagnostic shipped — PM-215 unblocked. All 9 brand-account `liveStreams` returned `isReusable=true` against `liveStreams.list?mine=true`. Zero rework needed Riverside-side. PM-215 cron can `liveBroadcasts.bind` against existing stream IDs without re-auth or stream recreation. Tooling: one-shot `yt-stream-diag` EF + `public.read_vault_secret(text)` helper (kept for PM-215 cron reuse, codifies §23.45 at the Postgres layer). 9 stream IDs captured in changelog as canonical reference. Path forward: `session_categories` table seeded with 8 `youtube_stream_id` values → PM-215 cron EF (`liveBroadcasts.insert` → `liveBroadcasts.bind` → UPDATE `calendar_occurrences.youtube_broadcast_id`) → real end-to-end test. No vyve-site changes, no portal-deployment bumps — this is a Supabase-only ship.)

## 19. Current status — 24 May 2026 PM-275 → PM-275.2 (Focus pages composition arc — three-commit refinement closing the focus-page surface build. PM-275.0 reshaped to canonical §23.55 hub-hero pattern (photo as fixed top band at max(250px,35vh), §23.57 fade band into solid var(--bg) panel below, both themes use the same structural composition); PM-275.1 moved page title from photo band onto panel after Dean's device review flagged title clipping the §23.57 fade seam + invisibility against light photo zones in light mode; PM-275.2 promoted panel heading to a proper big page-heading (eyebrow tag + 2.4rem Playfair title as first two lines on the panel) after Dean flagged the photo-band eyebrow clipping behind back button. End state: photo band carries only photo + glass back button, heading lives at top of panel as eyebrow → big Playfair title → description → input/CTA, reads cleanly in both modes. sw cache `pm275-2-panel-heading-a`, vbb-marker 162, vyve-site `b9ffeb33`.)

**PM-275 → PM-275.2 (24 May 2026 PM, vyve-site `b9ffeb33`).** Three-commit composition arc closing the Today's Focus page surface build. PM-274 phase 1 (earlier today, `0074a887`) shipped 12 pages with shared chrome + §23.39 Dexie wiring; this arc refined the visual composition to match the canonical hub-page pattern, with two device-review iterations bringing the heading hierarchy into final shape.

**The arc commits.**

| PM     | Commit       | Change                                                                       |
|--------|--------------|------------------------------------------------------------------------------|
| 275.0  | `824ded45`   | Reshape focus pages to §23.55 hub-hero canonical (photo top band + §23.57 fade + var(--bg) panel below); both themes use same composition |
| 275.1  | `51ef8f44`   | Move page title from over-photo to panel below (was clipping fade seam + invisible in light mode against lighter photo zones) |
| 275.2  | `b9ffeb33`   | Promote panel heading to big proper page-heading (eyebrow tag + 2.4rem Playfair on panel; photo band carries no text); was photo-band eyebrow clipping in corner behind back button |

**PM-275.0 (24 May 2026 PM, vyve-site `824ded45`).** Reshape to canonical §23.55 hub-hero pattern. Replaces the PM-274 phase 1 composition which had dark mode = full-bleed photographic ground with content over photo + light mode = header band with solid panel below. That split meant the two themes were structurally different pages, and the dark photos washed badly against light-mode text. New composition: photo as fixed top band at `max(250px, 35vh)` matching the hub pattern (`mind.html`, `exercise.html`, `connect.html`), §23.57 fade band (80px, 3-stop rgba `(10,31,31)` dark / `(240,250,248)` light) bridging into solid `var(--bg)` scroll panel below. Same structural composition in both themes — dark mode flows photo into dark teal panel, light mode flows photo into cream panel. All interactive content (orb, timer, textarea, CTA) uses theme tokens (`var(--text)`, `var(--surface)`, `var(--text-muted)`) instead of hardcoded white-on-dark. 15 files atomic. focus-shell.js byte-identical to PM-274 (JS contract unchanged; only CSS + markup composition shifts). Existing 384×256 photos fit the 35vh band size naturally on phones — no upscaling needed for the new composition. sw cache `pm274-focus-pages-a` → `pm275-focus-hub-hero-a`. vbb-marker 159 → 160. **Discipline:** §23.41 fresh HEAD (parent matched `0074a887`), §23.55 longhand position + translateZ(0) + will-change + background-image-not-img, §23.57 dedicated fade element with `translateY(-100%)`, §8 paired-values invariant (`.focus-hero` height ↔ `body.focus-page main` padding-top).

**PM-275.1 (24 May 2026 PM, vyve-site `51ef8f44`).** Title moves from hero band onto panel. Dean's device review flagged two issues with PM-275.0: (1) page title was overlapping the §23.57 fade seam at the bottom of the photo band — `justify-content: center` on `.focus-hero-content` put the title near the bottom edge at 35vh on tall phones, exactly where the fade band started eating it; (2) white-on-photo title was invisible against lighter photo zones in light mode (e.g. the misty `/focus-outdoors.jpg` lake reflection). Both were caught on iPhone screenshots showing "Sit with the day", "Send a message", "Get outside" half-eaten by the fade. **Fix:** title moves onto the `var(--bg)` panel as new `.focus-panel-title` class (2rem Playfair, `var(--text)`, centered, padded), reads cleanly in both modes (white on dark / dark teal on cream). Hero band keeps only the small eyebrow tag anchored top-left of the band well clear of the fade. Matched the hub composition more faithfully than PM-275.0 (exercise.html: eyebrow "Body" + small headline tagline on photo, content-bearing surface lives on panel below). 15 files atomic. Python sweep moved `<h1 class="focus-hero-title">` out of hero markup and injected `<h1 class="focus-panel-title">` at top of `.focus-body` in all 12 pages. `.focus-hero-title` retained as `display:none` for backwards-compat. sw cache `pm275-focus-hub-hero-a` → `pm275-1-panel-title-a`. vbb-marker 160 → 161.

**PM-275.2 (24 May 2026 PM, vyve-site `b9ffeb33`).** Panel heading promoted to big proper page-heading. Dean's second device review flagged the hero-band eyebrow was clipping in the top-left corner of the photo, partially obscured by the 44px back button at `top: env(safe-area-inset-top) + 14px, left: 14px` — visible as "...N · REACH OUT" and "...IN · OUTSIDE" in the screenshots. Also wanted the title to read as a proper big page header above the description, not a smaller sub-title. **Fix:** photo band now carries no text at all (just photo + glass back button). The heading lives at the top of the panel as a two-line stack: `.focus-panel-eyebrow` (0.78rem, 0.22em uppercase, `var(--teal)`, centered — `5 MIN · REACH OUT`) above `.focus-panel-title` bumped 2rem → 2.4rem with tighter `-0.015em` letter-spacing (`Send a message`). Clean hierarchy: eyebrow → big title → description → input/CTA. `.focus-hero-eyebrow` now `display:none`. 15 files atomic. Python sweep injected `<div class="focus-panel-eyebrow">` above the existing `<h1 class="focus-panel-title">` in all 12 pages. sw cache `pm275-1-panel-title-a` → `pm275-2-panel-heading-a`. vbb-marker 161 → 162.

**Composition at end of arc.**

```
┌────────────────────────────────────────┐
│  [back]                                │  ← 44px glass back btn, top-left
│                                        │
│         photo hero band                │  ← max(250px, 35vh)
│         (no text, just photo)          │     §23.55 fixed band
│                                        │     background-cover + center
│                                        │
└────────── §23.57 fade band ────────────┘  ← 80px, theme-aware rgba
                                            
       5 MIN · REACH OUT                  ← .focus-panel-eyebrow
                                            (var(--teal) uppercase tag)
       Send a message                     ← .focus-panel-title
                                            (2.4rem Playfair var(--text))

   Tell someone you're thinking of them.  ← .focus-intro (var(--text-muted))
   Connection takes less than you think.

   ┌──────────────────────────────────┐
   │ Who did you reach out to?        │  ← input / orb / timer per page shape
   │ (Optional)                       │
   │                                  │
   └──────────────────────────────────┘

                                        
              ╭────────────────╮
              │  Mark complete │       ← sticky CTA pill
              ╰────────────────╯       (safe-area-inset honoured)
```

**Why three commits not one.** Dean's mockup-before-code discipline applied at session scale — ship the composition, device-test, refine. PM-275.0 caught the structural problem (dark/light split was wrong); PM-275.1 caught the title placement problem (clipping + invisibility); PM-275.2 caught the eyebrow corner problem (back-button clash) + escalated the title weight to "this is the page heading" treatment. Three commits because each shipped at the cost of the next not being designable-without-device feedback. Each was a ~5-15 minute Python sweep + atomic ship cycle, total ~45 mins from PM-275.0 to PM-275.2.

**No new §23 hard rule earned.** All three commits used existing patterns end-to-end. §23.39 optimistic-first (unchanged), §23.41 fresh HEAD (3×), §23.45 Vault PAT direct (Composio still 401 ~3 days), §23.52(a)(b)(c) pure-Python urllib + md5 verify + SHA shape (3×), §23.53 JSON parse, §23.55 hub-hero composition pattern adopted more faithfully each iteration, §23.57 fade band element honoured, §8 paired-values invariant honoured, §23.60 absolute paths. Lesson worth noting for next session but not yet a §23 rule: when adopting a canonical pattern (hub-hero here, copied from exercise.html), read the reference impl markup-first not CSS-first. PM-275.0 over-faithfully copied the CSS but didn't notice exercise.html actually puts the eyebrow at 1.6rem and the headline at 1.1rem — exercise treats the *eyebrow* as the page name and the *headline* as a small tagline. I had it backwards. Reading the markup would have caught that in one pass.

**State after this arc.**

- vyve-site main: `b9ffeb33f42204b4eef9a30676e127994007609d`
- sw cache key: `pm275-2-panel-heading-a`
- vbb-marker: Update 162
- 12 focus pages × shared chrome (`focus.css` + `focus-shell.js`) live with §23.55 + §23.57 canonical composition
- Composio still 401 (~3 days since 21 May incident); Vault PAT direct used throughout
- §23 hard rules unchanged (last addition was §23.63 in PM-269)

**Pending for tomorrow (unchanged from PM-274 phase 1 backlog).**

- Pass A: hub catch-all subscriptions (4 hubs subscribe `vyve-localdb-table-pulled`)
- Pass B: `engagement.html` Variety + `mind:logged`
- Pass C: `nutrition.html` food subscription
- Pass D: `index.html` `daily_habits` typo
- Cap-rejection skew decision on cardio focus pages
- Lewis copy pass on `home-focus-catalogue.js` COPY[]
- Capacitor bundle (`npx cap sync`) for next binary cut
- Larger-resolution photo regen (1170×2532 portrait) deferred — current 384×256 set works fine at the 35vh band size, no longer urgent

---

## 19. Current status — 24 May 2026 PM-274 phase 1 (Today's Focus pages campaign opens — twelve `/focus/<slug>.html` pages shipped in one atomic 17-file commit. Reset + Movement to production quality, the other ten as plausible scaffolds with working complete-button + §23.39 Dexie-write dispatch via shared `focus-shell.js`. Shared chrome `focus.css` carries theme-aware composition: dark mode full-bleed photographic ground + radial dim + film grain, light mode photo header band + solid panel below per PM-268 Option C applied at page scale. `home-focus-catalogue.js` gained `write_target` field per slug (drives Dexie table + bus event without a per-slug switch) + `link_url` swap from `"#"` to `/focus/<slug>.html`. Hydration page writes to `mind_activities` (kind:'hydration') as v1 stub until proper `hydration_logs` table lands. Phase 2 deliverable `playbooks/full-app-wiring-audit.md` shipped same session to drive tomorrow's hub-subscription gap-fixing work. sw cache `pm274-focus-pages-a`, vbb-marker 159, vyve-site `0074a887`.)

**PM-274 phase 1 (24 May 2026 PM, vyve-site `0074a887`).** Today's Focus pages campaign opens with the full surface-build delivered atomically. Twelve `/focus/<slug>.html` files plus shared `focus.css` (18.8KB) and `focus-shell.js` (20.8KB), home catalogue updated to drive both the carousel link_url AND the page-side Dexie wiring contract via new `write_target` field, sw cache key bumped + 14 new precache entries, vbb-marker bumped. 17 files atomic, all md5-verified at commit SHA. Parent matched session start (no parallel drift). Composio still 401 (~3 days since 21 May incident); Vault PAT direct used throughout (§23.45 pattern from playbook).

**Quality levels.** Reset is the production reference impl (14.7KB, box-breathing 4-4-4-4, 6 rounds, multi-ring SVG orb with phase progress + breath scale animation, Playfair timer, 3-view stack intro/session/done, sticky Begin/End-early CTAs, visibility-change pause). Movement is the production scaffold (15.7KB, two-state idle/active, duration picker [5/10/15/20], HK pill cohort-aware via `VYVEFocusShell.hkCohort()` returning `ios_connected`/`ios_disconnected`→Connect link/`android+web`→hidden, snapshot-on-completion via `healthBridge.sync()` + Dexie member_health_samples diff against baseline captured at start). Ten scaffolds use three shared shapes via a generator: **textarea** (reflection / gratitude / connect — single textarea + Save), **timer** (focus / restore / outdoors — duration picker + countdown timer + I'm done / Cancel), **one_tap** (hydration / sleep / morninglight / fuel — single tap CTA → done state). All twelve inline `<script>` blocks pass `node --check`.

**`focus-shell.js` — the dispatch contract.** Public API: `VYVEFocusShell.{init, complete, toast, hkCohort}`. `init({slug})` wires back button (→ /index.html, replaces history-back so members can't accidentally stack into focus surface), gates on auth (redirect to /login.html if no session, with return-path preserved), registers SW, returns a Promise. `complete({slug, payload})` is the §23.39 optimistic-first ladder: (1) build Dexie row from `catalogue.write_target` per-slug + page payload, (2) optimistic upsert to Dexie, (3) publish bus event (`mind:logged` / `cardio:logged` / `connect:checkin:logged` / `nutrition:logged` depending on table), (4) dispatch `vyve-localdb-table-pulled` catch-all CustomEvent, (5) background un-awaited POST to Supabase with outbox fallback on network failure. Returns `{ok, client_id, table, row}` synchronously after step 3 (critical path ~30ms). Reference impl: journal.html `saveEntry()`. The `focus_slug` field is stripped from POSTs until a Supabase migration adds it as a nullable text column on each writable table — that work parked as backlog.

**`home-focus-catalogue.js` — `write_target` field added per slug.** Shape per slug: `{table, kind, duration_seconds}` for mind_activities, `{table, cardio_type, default_minutes, hk_enrich}` for cardio, `{table, focus_tag}` for connect_checkins, `{table, meal_label}` for nutrition_logs. focus-shell.js dispatches Dexie writes off this contract without a per-slug switch statement — the catalogue is now authoritative for the wiring. Eight slugs write to `mind_activities` (with six new `kind` discriminator values introduced: `gratitude`, `wind_down`, `morning_light`, `deep_work`, `restore`, `hydration`), two slugs write to `cardio` (movement: Walking, outdoors: Outdoor walk), one to `connect_checkins`, one to `nutrition_logs`. `link_url` swapped from `"#"` to `/focus/<slug>.html` so the home carousel taps now route to the new pages.

**Shared chrome composition (`focus.css`).** Dark mode: `position:fixed` full-bleed photo at `z-index:0`, radial dim at `z-index:1` (lighter centre, darker edges via `radial-gradient(ellipse 90% 60% at 50% 35%, rgba(13,43,43,0.10) 0%, rgba(13,43,43,0.50) 60%, rgba(13,43,43,0.78) 100%)`), inline-SVG film grain at `z-index:2` (opacity 0.10, `mix-blend-mode: overlay`). Light mode: photo + dim + grain switch to `position:absolute` with `height:40vh` (min 280, max 360), `body::after` soft-fade band bridges the seam between photo band and solid panel below, `.focus-main` gains `padding-top: calc(40vh + 20px)` so content sits below the band. Glass back button `position:fixed top:env(safe-area-inset-top)+14px left:14px` 44px circle with backdrop-filter blur. Sticky CTA pill at bottom with safe-area-inset honoured + linear-gradient fade-up so it lifts cleanly off content underneath. `.focus-view` stack (`display:none` / `is-active`) lets multi-state pages (Reset, Movement) swap views without route changes.

**HealthKit cohort detection (Movement).** `VYVEFocusShell.hkCohort()` returns `'ios_connected' | 'ios_disconnected' | 'android' | 'web'` based on `Capacitor.getPlatform()` + `healthBridge.isFeatureEnabled()` + cached `vyve_hb_state` in localStorage. Movement page reads cohort on init and renders the HK pill accordingly: connected → "Apple Health connected" static pill (no link); disconnected → "Connect Apple Health →" link to /settings.html; android+web → pill hidden. No degraded-experience placeholder for sensor-less cohorts — the walk page works identically without sensors, the only difference is whether steps + distance numbers appear in the done-view stats.

**HK snapshot-on-completion (Movement, v1).** Movement captures `hkBaseline = {steps, distance_m}` at walk start via `healthBridge.sync()` + Dexie `member_health_samples.allFor(email)` filtered to today, captures `hkFinal` at walk end via the same path, writes `steps = hkFinal.steps - hkBaseline.steps` and `distance_km = (hkFinal.distance_m - hkBaseline.distance_m) / 1000` into the cardio row. Imperfect for v1 (counts any background walking inside the window) but honest. v2 lives behind a `healthBridge.queryRange(start, end)` API addition — backlog item, not blocking the soft-launch trial.

**Two scaffold-shape sharp edges.** (1) The cap-rejection skew on `cardio`: server-side trigger caps cardio at 2/day. If a member completes a 3rd walk via a focus page, Dexie write succeeds (no client-side cap), bus event fires (subscribers update optimistically), Supabase POST gets re-routed to `activity_dedupe` and the optimistic Dexie row is now wrong (counted by client, ignored by server). Decision deferred to tomorrow's audit pass. (2) Connect one-per-day semantics: `connect_checkins` PK is `(member_email, checkin_date)` — focus-page connect.html doesn't pre-check whether one exists today, so the Dexie upsert merges (replacing). Members can "refresh" their connect post by completing the focus card. Probably fine but flag to Lewis on the copy pass.

**Phase 2 deliverable — `playbooks/full-app-wiring-audit.md` (shipped this session).** 13 table-by-table inventories (daily_habits, mind_activities, cardio, workouts, connect_checkins, nutrition_logs, weight_logs, wellbeing_checkins, monthly_checkins, session_views/replay_views, achievements, charity, leaderboard) covering writers + bus events + should-subscribe surfaces + ⚠ gap markers. Five cross-cutting findings: (A) hubs don't subscribe across activity types — `exercise.html` Body hub **subscribes to nothing**, `mind.html` only `mind:*`, `connect.html` missing `habit:logged`, `index.html` missing `mind:logged`; (B) `engagement.html` Variety component missing `mind:logged` map; (C) `nutrition.html` not subscribed to `food:logged`/`food:deleted`; (D) `index.html` `daily_habits` literal subscription typo (no colon, looks malformed); (E) focus-shell publishes `vyve-localdb-table-pulled` catch-all but no hub subscribes — the proposed fix (Pass A) is the catch-all subscription added to all four hubs. Tomorrow's session shape: 7 passes (4 wiring fixes + cap decision + Lewis copy pass + Capacitor bundle).

**No new §23 hard rule earned.** PM-274 phase 1 is a surface-build ship using already-codified patterns (§23.39 optimistic-first, §23.41 fresh HEAD, §23.45 Vault PAT, §23.48 catalogue + bus, §23.52 pure-Python urllib, §23.55 hub-page composition principles re-applied at page scale, §23.60 absolute paths). PM-274 phase 2 (the audit + fixes) may earn a §23 rule around hub-subscription patterns once the fixes ship.

**State after this commit.**

- vyve-site main: `0074a887b0b8fd2ebf7f878566a4ea75ec12836a`
- sw cache key: `pm274-focus-pages-a`
- vbb-marker: Update 159
- 12 new HTML pages at `/focus/<slug>.html` + `focus.css` + `focus-shell.js` + `home-focus-catalogue.js` rewrite + `sw.js` cache bump + `index.html` marker bump = 17 files atomic
- Composio still 401 (~3 days since 21 May incident); Vault PAT direct used throughout
- §23 hard rules unchanged (last addition was §23.63 in PM-269)

**Pending for tomorrow.**

- Capacitor bundle: `npx cap sync` at `~/Projects/vyve-capacitor` pulls 12 new focus HTML files + focus.css + focus-shell.js into iOS+Android binary for next cut. Dean's dev iPhone reaches focus pages via WKWebView/dev-loop already (`server.url → online.vyvehealth.co.uk`); bundled cohort (iOS 1.3 / Android 1.0.3 from PM-115/116) only sees focus pages after next binary cut OR OTA via Capawesome (app `f9961f66`, prod channel `89e12796`).
- Lewis copy pass on COPY[] block in `home-focus-catalogue.js` — Eyebrow / Title / Body across all twelve slugs. focus-shell.js doesn't change; only the catalogue data does.
- Phase 2 audit pass: A/B/C/D/E gaps from the new playbook, cap-rejection skew decision, hub-subscription wiring.
- ⚠ §23.63 followup unresolved: `staging/focus-card-mockup.html` + `staging/premium-focus-mockup.html` still don't exist in VYVEBrain (were in-chat artefacts from PM-268 that never made it to the repo). Built to PM-268 textual spec; device-test feedback on Reset + Movement will surface any composition misses.

---

## 19. Current status — 24 May 2026 PM-273 (Today's Focus carousel shipped — 3-card snap-scroll on home, midday auto-centred, structural Option C light-mode split, all 12 photographic compositions validated dark + light. 5-commit arc PM-269 → PM-273 closes the surface-build phase opened by PM-268's image library. Next: `/focus/<slug>.html` page builds. sw cache `pm273-focus-qa-revert-a`, vbb-marker 158, vyve-site `5dd3f090`.)

**PM-269 → PM-273 (24 May 2026 PM, vyve-site `5dd3f090`).** Today's Focus carousel landed across five commits. Production state: 3-card horizontal snap-scroll between hero and Today's Habits on home, morning / midday / evening for today, midday auto-centres as current TOD, all three swipeable. Daily rotation through twelve category slugs via `home-focus-catalogue.js` (7-day × 3-TOD grid, 21 slots, hand-balanced so no day repeats and each slug surfaces 1-2 times per week). Card destinations are `href="#"` placeholders until `/focus/<slug>.html` pages ship in the next campaign.

**Option C structural light-mode (locked PM-268, implemented PM-270 after a PM-269 misfire).** Card becomes a grid 1fr 1fr in light mode. Left half = solid `var(--surface)` panel under the copy. Right half = same photo file as dark mode (no swap, no filter, no opacity manipulation), anchored `background-position: right center` so the subject pins to the right edge of the card (PM-271 fix). White-to-transparent fade element bridges the seam. Dark mode keeps the full-bleed photo + horizontal gradient over the left third for copy protection, subject anchored right via `background-position: 70% center`. Same source file in both modes — only the framing changes by theme. TOD pill becomes solid `var(--vyve-dark)` pill with white text in light mode, solid teal pill in current-TOD slot; frosted treatment retained in dark mode.

**Card aspect-ratio 16:9 (PM-270 fix to PM-269's 3:2).** Dean's PM-269 device review called the cards "too deep". Dropped ~25% in height while keeping width unchanged. Cards now sit cleanly between hero and Today's Habits without dominating the viewport.

**PM-268 (24 May 2026 PM, vyve-site `aac2b10f`).** Twelve photographic category images shipped as bundled assets for the Today's Focus pages campaign. All twelve consumed by the PM-269 → PM-273 carousel via `home-focus-catalogue.js`. Each slug carries: `eyebrow`, `title`, `body`, `duration_min`, `image`, `link_url`. Lewis to do the copy pass once `/focus/<slug>.html` pages ship.

**The twelve.** `reset` (steaming cup by window), `movement` (woodland path with golden light), `reflection` (open journal + mug), `hydration` (water glass + mint + lemon), `sleep` (candle + knitted throw + book), `morninglight` (sunlit windowsill + plant), `gratitude` (ceramic bowl with stone + leaf + rosemary), `focus` (dark desk + notebook + lamp), `restore` (misty hills at golden hour), `connect` (two mugs by window), `fuel` (sourdough + blueberries + almonds), `outdoors` (misty mountain loch with pines). All Gemini-generated to a shared shell prompt: 1536×1024 landscape, deep teal + forest green tones with warm highlights, subject in right two-thirds, quiet darker left third for copy overlay, no people facing camera, no text/logos, slight grain for warmth. Downscaled to 384×256 q82 progressive JPEG. Total 205KB.

**Architectural decisions captured for next session's build campaign.** Per-page route chosen (`/focus/<slug>.html` × 12 with shared `focus.css` + `focus-shell.js`) over inline-sheet pattern, after Dean pushed back on the "edit one thing" maintainability question. Reasoning: shared CSS/JS gives the same global-edit ergonomics as the sheet pattern offered, while standalone pages give a higher per-page premium ceiling (no parent CSS cascade, page-level transitions, easier full-screen immersive states) and URL-addressability as a bonus. Light-mode strategy = Option C (theme-aware card composition with photo-right + solid-panel-left), see `staging/focus-card-mockup.html` for the dark/light card composition reference. HealthKit treatment = timer-first, sensor-second across all cohorts (iPhone-HealthKit / iPhone-no-HealthKit / Android / desktop), no degraded-experience placeholders — Movement is the only of the twelve categories that benefits from a sensor, so we solve it once properly there and the other eleven are sensor-free by design.

**No new §23 hard rule earned.** PM-268 is an asset-ship plus planning artefact. Architectural decisions will earn their §23 entries when the next campaign (Today's Focus pages) closes, not before.

**State after this commit.**

- vyve-site main: `aac2b10fd768069b5abef39bfdf98a3242a59d00`
- sw cache key: `pm268-focus-images-bundle-a`
- vbb-marker: Update 153
- 12 new image files at vyve-site root, all in sw precache
- Composio still 401 (~3 days since 21 May incident); Vault PAT direct used throughout
- §23 hard rules unchanged (last addition was §23.62 in PM-267b)

---

## 19. Current status — 24 May 2026 PM-258 (Mood selector SVG faces + hero image lifted ~15%. Same-night small-touch ship after Dean device-tested PM-257 — mood selector going from emoji to custom inline-SVG line-drawn faces (no Unicode glyph rendering, no platform-emoji inconsistency); hero `background-position` lifted from `70% center` to `70% 65%` so the photo fills the lower two-thirds of the band and the dead-sky strip at top shrinks. 2-file atomic commit `95e840cd`, sw cache `pm258-mood-svg-faces-a`, vbb-marker 143.)

**PM-258 (24 May 2026, vyve-site `95e840cd`).** Two-touch refinement on top of PM-257 — mood selector visual swap + hero image position tune.

**Mood faces — emoji to inline SVG.** Dean called out that emoji aren't acceptable for the mood selector (platform rendering inconsistency, mixed-vendor design language). Looked at the mockup again and the "mood emojis" in image 1 are actually line-drawn faces inside circles, not Unicode glyphs — I'd misread them. PM-258 ships custom inline SVG faces matching that style. Each face: two `<circle>` eyes at `(8,9)` `(14,9)` r=1.1, single `<path>` mouth varying per mood (frown / flat / gentle smile / broader smile / widest smile), all `stroke-width:1.5 stroke-linecap:round` inheriting colour from `.mood-icon` via `currentColor`. Default: dim-white stroke on subtle white-tint background circle. Selected: bright teal stroke on tinted-teal background circle plus glow shadow. Tap interaction: visual `.selected` class applied immediately for 350ms before the thanks-state swap fires, so the member sees their selection register before the panel transitions away. Mood-icon size bumped 30 → 32px to give the line stroke breathing room.

**Hero image lifted ~15%.** Dean's PM-257 screenshot showed a noticeable dark-sky strip between the iOS status bar and the "Good evening" greeting on the night-hero photo. Root cause: `background-position: 70% center` was placing the photo's vertical centre at the container's vertical centre, which left ~50% sky above the figure. Patched to `background-position: 70% 65%` — lifts the photo focal point so the lower two-thirds (figure + loch + valley) fill the band and the top of the photo (sky) overflows above the visible container. Same value applied to all three TOD photos (consistent crop across morning / afternoon / night).

**Files (2).** `index.html` (84178 → 84887 bytes), `sw.js` (cache key bump only). vbb-marker `Update 142` → `Update 143`.

**Verified.** node --check clean on all 9 inline `<script>` blocks. Tag balance 26/26. §23.41 fresh-HEAD checked twice (pre-tree at `b633cb02`, pre-ref-update at `b633cb02` — no parallel ship). §23.52(a)(c) every blob via `--data-binary @file`, SHAs 40-char hex. §23.53 commit + ref responses parsed from file. Post-commit first-100-char re-fetch matched on both files.

**Composio still 401** (~3 days since 21 May incident). PAT-direct via Supabase Vault throughout per §23.45.

**No new §23 hard rule earned.** Small visual refinement — established doctrine throughout.

---

## 19. Current status — 24 May 2026 PM-257 (Home redesign iteration — mood check-in + Today's Habits list + Live carousel + bug fixes. Three device-visible PM-256 bugs fixed (greeting z-index bleed, hero bg-position, brand mark, bell colour, TOD pill). New transient `daily_mood_checkins` mechanic on hero. 2-file atomic commit `b633cb02`, sw cache `pm257-home-mood-habits-a`, vbb-marker 142. Supabase migration `pm257_create_daily_mood_checkins` applied first.)

**PM-257 (24 May 2026, vyve-site `b633cb02`, supabase migration `pm257_create_daily_mood_checkins`).** Same-night iteration on PM-256 after Dean's device-test feedback + mockup re-review. Three bugs visible on the screenshots from PM-256 + the five mockup gaps that didn't make tonight's first ship.

**Bugs fixed.**
- **Hero copy z-index bleed.** Greeting text was painting over Today's Habits row on long scroll (visible in Dean's screenshots). Root cause: `.index-hero-copy` was `position:absolute` body-level at `z-index:5`, while `.wrap` was at `z-index:2`. When wrap scrolled past the hero base, hero copy stayed visible above the wrap content. Fix: `.index-hero-copy` switched to `position:fixed` pinned to top of hero band at `z-index:1`; `.wrap` at `z-index:2` now unambiguously covers it on scroll. Greeting also re-anchored to top-of-hero rather than bottom (matches the new mockup composition).
- **Hero background-position.** Was `center bottom`. Figure-on-rock subject is in the lower-right of all 3 photos; center-bottom was cropping the figure on portrait viewports. Changed to `70% center` — keeps the figure in frame and shows sky on the upper third where copy sits.
- **Brand mark.** Was a Playfair "V" character. Now real `/logo.png` via `<a><img></a>`. Matches the rest of the portal chrome.
- **Bell badge colour.** Was gold `#C9A84C`. Now `var(--teal-lt)`. Bell badge is a soft notification indicator, not an alert flag.
- **TOD pill removed.** "Morning"/"Afternoon"/"Evening" pill dropped from hero top-right. Greeting copy already carries the time of day; the pill was redundant.

**Mood check-in mechanic.** Transient glass-overlay panel on hero base. 5-mood emoji row (Not great / Meh / Good / Great / Amazing). On tap: panel swaps to confirmation state ("Thanks for checking in, Dean."), holds 2.4s, fades 0.4s, height collapses 0.3s. Total dismiss arc: 3.1s. localStorage key `vyve_mood_checked_in_<email>_<date>` caches the checked-in state for paint-fast decision — subsequent same-day visits paint without the panel, no flash. Skip button does the same dismiss flow but with no DB row (panel still gone for the day). Synchronous localStorage check before paint — honest first-frame behaviour, no flicker.

**New Supabase table `daily_mood_checkins`** (applied via migration `pm257_create_daily_mood_checkins` before code ship). One row per member per day with UNIQUE(member_email, mood_date) so re-taps update rather than duplicate. Columns: `id uuid PK`, `member_email text NOT NULL`, `mood_date date NOT NULL`, `mood_value smallint NOT NULL CHECK (1..5)`, `mood_label text NOT NULL`, `created_at`, `updated_at` with SECURITY DEFINER trigger. Full RLS — 4 policies (select/insert/update/delete) scoped to `auth.email() = member_email`. Partial index `idx_daily_mood_checkins_member_date` on `(member_email, mood_date DESC)` for trend queries Lewis will run later.

**Mood write path** follows §23.39 optimistic-first contract — UI flips to thanks state immediately, localStorage marker written immediately, server upsert in background via `/daily_mood_checkins?on_conflict=member_email,mood_date` with `Prefer: resolution=merge-duplicates,return=minimal`. On failure: localStorage marker stays, member doesn't get re-prompted today. Next-day boundary naturally clears the date-keyed key.

**Today's Habits restructured from 5-ring boolean tap-to-tick to vertical list** per mockup. Each row = icon + name + sub-line + check toggle. Tap anywhere on row toggles. Sub-line generated from habit_title via keyword match (`subForHabit()` — 13 keywords + empty fallback). Same §23.39 optimistic-first write path as PM-256 — togglePill() now re-renders renderHabitList() instead of renderPills(). >5 habits → See all link to habits.html.

**Live Sessions This Week — new horizontal carousel** reading `calendar_occurrences` from Dexie, fall through to 4 placeholder cards when Dexie is empty (honest paint per §23.46 — placeholders carry category + time-of-day text labels like "Tonight 20:00" and "Tomorrow 17:30", not LIVE labels). 78% card width, snap-x scroll, aspect-ratio 2:1, gradient thumbnail variants (candle/zen/dawn) until real `image_url` photo data lands. Real broadcast data takes over the moment PM-251 calendar_occurrences hydrates + PM-215 cron writes broadcast IDs.

**My Progress section restored** — 5 rings with current labels (Hydration/Movement/Mind/Nutrition/Sessions). Painted with placeholder zero values for now (`PROGRESS_TRACKS` const inline). Members tap → engagement.html drilldown. Real per-track progress wiring + pillar realignment (rings → Habits/Body/Mind/Connect/Check-ins) is a separate campaign per Dean's note — this surface stays stable until then.

**Section order on home now:** Hero → Today's Focus → Today's Habits (list) → Live Sessions This Week (carousel) → My Progress (rings). Mood panel is overlay on hero, dismissed for the day after tap or skip.

**Files (2)** — `index.html` (63335 → 82821 bytes, 1469 → 1959 lines), `sw.js` (cache key bump `pm256-home-redesign-a` → `pm257-home-mood-habits-a`). vbb-marker `Update 141` → `Update 142`. No new image assets — focus card hero imagery is the obvious follow-up but ships when Dean generates the Gemini prompts I gave him.

**Verified.** node --check clean on all 9 inline `<script>` blocks. Tag balance 26/26. getElementById cross-check: 3 benign missing IDs (ring-val-css is existence-check before creation; next-slot lives in dead-code-after-return inside neutered paintWhatsNext; skeleton-screen lives in PM-256 commented-out legacy block). §23.41 fresh-HEAD checked twice (pre-tree-create at `135f4e33`, pre-ref-update at `135f4e33` — no parallel ship). §23.52(a)(c) every blob via `--data-binary @file`, both SHAs 40-char hex. §23.53 commit + ref responses parsed from file. Post-commit first-100-char re-fetch at commit SHA `b633cb02` matched on both files.

**Composio still 401** from 21 May security incident (now ~3 days). PAT-direct via Supabase Vault throughout per §23.45.

**No new §23 hard rule earned.** PM-257 exercises established doctrine: §23.39 (optimistic-first), §23.41 (parallel-session safety), §23.45 (PAT-direct fallback), §23.46 (honest paint), §23.52(a)(c), §23.53, §23.55 (hub-page hero), §23.57 (canonical scrolling-fade recipe).

**What didn't ship in PM-257.**
- Focus card hero imagery (gradient placeholder stays). Dean has Gemini prompts for 3 small photo cards (morning forest path, midday windowsill, evening candle). Follow-up commit when those land.
- Pillar realignment for My Progress rings (Habits/Body/Mind/Connect/Check-ins). Separate campaign — touches achievement engine + cert naming.
- Habit icon redesign (proper icon column on habit_library). Keyword match in iconForHabit() + subForHabit() stays as v1 fallback.
- AI-generated daily focus content. v1 stays as persona × TOD static lookup.
- Focus carousel (3-card horizontal scroll). Dean was stuck between carousel-vs-single-changing-card; I argued for and shipped single-changing-card. Worth a re-look on device.
- Real per-track progress data on My Progress rings. Currently zero placeholders.

## 19. Current status — 24 May 2026 PM-256 (Home redesign — cinematic time-of-day hero, dropped activity score + tracks + check-in. Last hub-page hero per §23.55. `index.html` full rewrite 121KB → 63KB / 1849 → 1469 lines. 5-file atomic commit `135f4e33`, sw cache `pm256-home-redesign-a`, vbb-marker 141. Three hero JPGs (morning sunrise / afternoon clarity / night moon) at 1024×1024 q82.)

**PM-256 (24 May 2026, vyve-site `135f4e33`).** Last hub-page hero shipped — the cinematic time-of-day index.html redesign Dean signed off via mockup-first review. `index.html` full rewrite: hero + Today's Focus card + What's on next + 5 Progress Pills (today's daily habits as tap-to-tick rings). Five surfaces dropped from current home: activity score ring + components, daily check-in card (mob-checkin + desktop daily-checkin-card + 7-day pill strip), overall streak bar, 5-track progress wall, weekly goals strip, collective impact charity banner, coming-up-this-week list. Two session-banners (live-now + up-next) collapsed into single What's on next card with state-aware presentation.

**What's there now.** Three-state photographic hero (`is-morning` / `is-afternoon` / `is-night`) swap via pre-paint inline IIFE on `getHours()`, boundaries 05-11 / 11-19 / 19-05 — first index hub to do 3-state (Body shipped day/night because we only had two photos; index gets three real photos). §23.55 doctrine: body-level fixed, longhand top/left/right/height, `translateZ(0)`, `background-image` (not `<img>`), z-index hero:1 wrap:2. §23.57 canonical scrolling-fade band as first child of .wrap. Hero height `max(360px, 48vh)` — taller than other hubs (Body at `max(250px, 35vh)`, Mind/Connect at `max(280px, 46vh)`) because index has more emotional weight per visit. Greeting + tagline anchored **bottom-left** rather than top-left (figure in lower-right of all three photos — copy on the left gives the figure breathing room as visual companion to the greeting).

Today's Focus card: persona × time-of-day static lookup, 15 entries (5 personas × morning/afternoon/evening). Tap → routes to relevant hub (exercise / mind / habits). v2 (post-trial): AI-generated daily focus via existing Anthropic pipeline.

What's on next: reads `calendar_occurrences` from Dexie. Live state if inside [starts_at, ends_at) AND `youtube_broadcast_id IS NOT NULL`, green LIVE tag + Join CTA → category live-page (CATEGORY_LIVE_PAGE map covers 8 categories). Else next future row with Day · HH:MM tag. Empty state when no calendar data.

5 Progress Pills = today's daily habits as rings. Pivoted from the mockup's certificate-track scoring at Dean's call — "habits the customer ticks off". Up to 5 habits rendered; >5 = 'See all ›' link to habits.html. Ring fill boolean per v1 (empty 0% / full 100%) — fractional ring with HK/water/target data deferred to a separate ship after the habit icon redesign. Tap-to-tick optimistic-first per §23.39: Dexie upsert + `VYVEHomeState.optimisticPatch` + `VYVEBus.recordWrite` + `VYVEBus.recordCanonical`, server upsert in background via `/daily_habits?on_conflict=member_email,activity_date,habit_id`. Untick = inverse path. Bus subscriber on `daily_habits` keeps cross-page (habits.html + index.html) in sync. Icon emoji via keyword-match against `habit_title` (12 keywords + 🌿 fallback) — durable until the habit icon redesign campaign supplies a proper icon column.

Tagline rotation per §23.55 local-midnight-anchored day-index. v1 = 3 hardcoded pools in JS (morning/afternoon/evening, 4 lines each). v2 = Dexie read of `taglines` table when Lewis populates with a `time_of_day` discriminator column.

**What this changes about §23.55 doctrine.** No new hard rule earned, but the index ship validates the doctrine on its fourth and final hub. Doctrine version count is unchanged (§23.55 stops at hub-page hero, not asset-count). Index is now precedent for any future page that wants three-variant TOD swap (Mind already has three; Body has two). The 3-state shape is additive — the swap script supports any number of `.is-X` classes.

**What changed about index.html specifically.** The mob-top / mob-streak / mob-tracks / mob-checkin / overall-streak / goals-strip / session-banners / tracks-grid / charity-strip blocks are all gone. The `vyve-home-state.js` + `home-state-local.js` modules are still loaded (other pages — engagement.html, connect.html — still consume them); index.html just doesn't call into them anymore. PostHog snippet, CSP, escapeHTML/safeURL, vapid, nav.js, offline-manager, HK reprompt banner, notifications overlay all preserved verbatim. Skeleton-timeout monitor neutered (no skeleton-screen DOM anymore; empty-state markup is the honest first paint per §23.46).

**Verified.** node --check clean on all 9 inline `<script>` blocks (the rewritten boot script, paint helpers, persona-focus library, calendar reader, pills toggle, plus preserved notif script + HK reprompt script + posthog + build banner). Tag balance 26/26. All `getElementById` IDs cross-referenced against DOM. §23.41 fresh-HEAD checked twice (pre-tree-create and pre-ref-update), both clean. §23.52(a) every blob via `--data-binary @file` — three binaries over 100KB exactly the size class that bricked PM-209.1 / PM-228 inline-d. §23.52(c) all 5 blob SHAs 40-char hex. §23.53 commit response parsed from file. First-100-char re-fetch verification on text files at commit SHA matched; md5 verification on three binaries matched.

**Composio still 401** from 21 May security incident (now ~3 days). PAT-direct via Supabase Vault throughout per §23.45 — Vault path stable.

**What didn't ship in PM-256.** Habit icon redesign (parked as follow-up campaign — keyword-match is durable until then). v2 Focus card AI generation. v2 Tagline pool TOD-aware filtering once `taglines.time_of_day` column lands. Activity score ring relocation to engagement.html (it already lives there; just removed from home). Charity banner relocation to give-back surface (already lives at vyvehealth.co.uk/give-back.html marketing surface; no portal-side need).

## 19. Current status — 24 May 2026 PM-255 (Standalone PB + Past Sessions pages, bespoke overlays retired. `personal-bests.html` (new) and `workout-history.html` (patched with per-session exercise breakdown) replace the `#prs-view` + `#sessions-history-view` sticky-header overlays inside `workouts.html`. Both match the canonical `page-header` recipe used by `cardio-history.html` and `movement-history.html`. "My PRs" → "My PBs" rename on the programme header button. 7-file atomic commit `97ae2607`, sw cache `pm255-pb-history-pages-a`, vbb-marker 140. No new §23 rule — refactor onto existing canonical pattern.)

**PM-255 (24 May 2026, vyve-site `97ae2607`).** Standalone Personal Bests + Past Sessions pages — bespoke overlays retired. The My PBs (`#prs-view`) and Past Sessions (`#sessions-history-view`) UIs were full-viewport `position:fixed` overlay divs living inside `workouts.html`, each with its own bespoke `.prs-header` / `.sh-header` sticky strip at `top:0` lacking `env(safe-area-inset-top)`. On Capacitor iOS with `apple-mobile-web-app-status-bar-style: black-translucent`, the iOS clock at `00:55` collided directly with the back button + page title on both views. Dean's read: "these pages just need to have a header like other pages" — exactly right. The fix wasn't a safe-area band-aid; it was promoting both surfaces to first-class standalone pages matching the canonical `page-header` recipe (eyebrow + title + sub + `nav.js` back) used by `cardio-history.html` and `movement-history.html`. **What shipped:** `personal-bests.html` (new, 12.6KB) — Dexie-first PB list keyed off `exercise_logs`, alphabetical with search, summary strip (Exercises count + Heaviest lift); `workout-history.html` patched with per-session exercise breakdown via tap-to-expand chevron (closes the feature gap from the old overlay which had per-session detail but no day grouping — workout-history had day grouping but no detail; now it has both); `workouts-programme.js` buttons converted from JS handlers to `<a href>` anchors; `workouts.html` overlay CSS + markup (34 + 34 lines) stripped with PM-255 marker comments left in place; `workouts-notes-prs.js` 8 dead functions + module state removed (`exerciseHistory` stays — overload nudge + rest-bar next-set hint still consume it); `sw.js` precaches `/personal-bests.html` + cache key bump `pm254-body-tighten-a` → `pm255-pb-history-pages-a`; `index.html` vbb-marker 139 → 140. **Verified:** node --check clean on all 5 JS files + 7 inline blocks; post-commit byte-equal fetch at commit SHA. **No new §23 rule earned** — refactor onto two existing canonical patterns (`page-header` recipe + Dexie-first read with REST hydrate fallback). **Composio outage continuation:** Composio still absent this session; fell back to Supabase MCP `vault.decrypted_secrets` → curl Git Data API per memory #10. First commit attempt threw `OSError: Argument list too long` on the inline-d index.html blob (121KB body past shell arg limit); retried with `curl --data @tempfile.json` and went through clean. Worth flagging: any multi-file Git Data API commit through bash curl should default to `--data @file` for any payload over ~100KB, not inline `-d`.

**PM-251 (23 May 2026, vyve-site `765c5b69`, supabase migration `pm251_live_page_state_machine`).** Live page state machine shipped end-to-end. 14-file atomic vyve-site commit + paired Supabase migration. Five-state engine in `session-live.js` (UPCOMING / PRE_ROLL / LIVE / JUST_ENDED / QUIET) reads `calendar_occurrences` from Dexie, picks the row whose time window covers "now" (±10min pre-roll, +30min just-ended grace), resolves state from clock + `youtube_broadcast_id` presence. Field resolution chain per-occurrence override → catalogue default → literal fallback for title/description/host. Adaptive ticker §23.48 Pattern 3 (1s near-live, 30s otherwise, visibilitychange-aware), bus listener on `vyve-localdb-table-pulled` for hydrate-driven re-paint, fallback REST GET in narrow Pre-roll/Live window covers 5-min sync gap to PM-215 cron. Same-day rollover handled — iframe src swap on `ends_at` boundary, no page reload. 8 shells generated from single template (yoga/mindfulness/workouts/checkin/therapy/events/education/podcast-live.html), each declares `{category, replaySlug, name, shortLabel, description, chatType}`. `events-live.html` migrated from legacy 24KB fat shape to 3KB shell — long-overdue cleanup. `sessions.html` hub now Dexie consumer for first time (4 new script tags) — LIVE pill gated on `hasActiveBroadcast(s)` (clock + broadcast_id presence), safe-fallback to clock-only when Dexie empty. Chat + Q&A behind `COMING_SOON_TABS=true` flag for v1; tabs render locked with coming-soon body. Schema migration: `calendar_occurrences` + `youtube_broadcast_id`, `session_title`, `session_description`, `host_name`, `host_role`, `host_photo_url`; `service_catalogue` + `default_host_name`, `default_host_role`, `default_host_photo_url`; partial index `idx_calendar_occurrences_live_lookup` for the fallback REST path. `default_host_name='Lewis Vines'` backfilled on every `type='live_session'` row pending per-instructor edits. `CATALOGUE_INVALIDATION_KEY` bump `pm245-replay-videos` → `pm251-live-state-machine` forces existing devices to re-pull calendar_occurrences with new override columns on next visit. sw cache `pm250-native-ux-a` → `pm251-live-state-machine-a`. vbb-marker 132 → 133. **State after this commit:** live pages render QUIET state immediately (latest replay from `replay_playlists`); live states activate the moment PM-215 cron writes `youtube_broadcast_id`. No code redeploy needed — PM-251 and PM-215 decoupled at the data contract. Hub LIVE pills currently all Offline (empty `ACTIVE_BROADCAST_CATEGORIES` until cron runs). **New §23 hard rule earned — §23.60 (bash_tool `cd` non-persistence across calls)**. Each bash_tool invocation starts a fresh shell; `cd` from previous calls is gone. Two real-world miscalls this session before realising the directory was wrong — wrong-directory writes look like network failures (empty/zero-byte files misread as "API returned garbage"). Rule: every multi-step bash sequence writing files uses either absolute paths throughout or re-`cd` at the start of every single call. **What didn't ship in PM-251:** PM-215 cron itself (this is its consumer surface — cron is the next ship), PM-214 admin console (Lewis edits overrides via Supabase dashboard until then), PM-251b instructor backfill (Lewis populates per-category default_host_* once Emma/Calum/Phil confirmed), PM-251c chat unlock (v1.1 flag flip).

 — avatars + privacy-aware identity rendering on connect-feed.html + connect.html Recent Check-Ins. Read-side sister to PM-228's settings-side write-side avatar pipeline. New `profile.js` (216 LOC) — single source of truth for avatar render, three states (initials text / photo `<img>` / V-mark `<img>` for anonymous), cross-member identity directory backed by `vyve_identity_<email>` localStorage keys. `connect-feed-preview` EF v1 → v2: added `limit`/`scope`/`today_only` params, added `avatar_url` + `is_anonymous` to response shape, anonymous-coupling rule enforced server-side (`avatar_url=null`, `display_name='Member'` when `display_name_preference='anonymous'` — photo URL never leaves the EF). connect-feed.html: direct PostgREST → EF v2 (one round-trip returns rows + reactions + identity). connect.html Recent Check-Ins: Dexie own-row fast paint + layered EF call for global community top-3. `.cin-avatar` CSS 36→40px. Live data sanity at ship: 16 anonymous, 3 full_name, 1 initials, 1 uploaded photo (95.8KB at 512×512 q=0.85). sw cache `pm245-replay-videos-a` → `pm242-feed-avatars-a` → (subsequently bumped by PM-246/247). vbb-marker 126 → 127. **§23.58 violation — own self-inflicted:** the same commit silently reverted PM-244's §23.57 fade recipe on connect.html because workbench connect.html was fetched at session start (`74bfc0af`) and never re-fetched before commit, even though parent SHA was correctly captured at `20c673dc`. The 58 lines of PM-243/244 fade work between those HEADs got flattened by the whole-file overwrite. Detected by next session opening connect.html as the §23.57 reference impl; recovery shipped at PM-246 (`ec3f2c30`). New §23 hard rule §23.58 codified — whole-file commits require re-fetching file body, not just confirming ref hasn't moved. **What didn't ship in PM-242 (Avatars):** leaderboard avatars (deferred — `get_leaderboard()` RPC needs additive `email` column return before its EF can hydrate identity; punted to next-session full-repo audit), Settings UI for changing privacy mode (full campaign owns), curated avatar library (full campaign owns).

**PM-247 + PM-246 + PM-245 + PM-244 + PM-243 + PM-241 + PM-240 (23 May 2026, vyve-site various).** Parallel session(s) shipped substantial Connect/Mind hub-page hero work during the PM-242 build window. Headline ships: PM-241 connect hero fade band, PM-242 fade-actually-scrolls fix, PM-243+244 colour-not-positioning fix (§23.57 fade recipe codified), PM-245 replays section-rail rebuild (per-video tiles, 8-section replay hub with /replay-category.html, new `replay_videos` table), PM-246 §23.57 applied to mind.html + PM-244 silent-revert recovery + §23.58 codified, PM-247 hub-hero canonical size standardised to `max(250px, 35vh)`. See changelog entries for full detail.

**PM-236 + handoff state (23 May 2026, vyve-site `13846ab6`).** Single-file diagnostic patch shipped: `replays.html?debug=1` surfaces VYVELocalDB table registration, Dexie row count, _kv meta state, direct REST status. Built to diagnose Dean's "no replays yet" empty state, but pull-to-refresh resolved before the diagnostic ran — issue was WKWebView serving cached db.js (Dexie v10) while running new replays.html (PM-235, expecting v11 store). SW cache bump in PM-236 (`pm236-replays-diag-a`) forced refetch, Dexie upgraded, tiles paint correctly. Diagnostic infrastructure stays in place for future Dexie/sync issues — `?debug=1` is now a real tool. **Design pivot identified by Dean post-paint:** the PM-235 playlist-embed iframe plays the most recent video but offers no in-place browse of the full playlist — member is stuck on the most recent and can only navigate via YouTube's player controls. Poor mobile browse experience. **New design locked for next-session build:** Replays hub becomes 8 sections of "3 most recent tiles + See all [category] ›" rails, with a new `/replay-category.html?cat=<slug>` shared page handling the full per-playlist view. Build plan: new `replay_videos` table (per-video rows, ~200-400 total at trial scale, indexed on (playlist_category, published_at DESC)), seeded from playlistItems.list for all 8 playlists via the established Vault OAuth + pg_net path. db.js SCHEMA_V12 + version chain + makeCatalogueTable consumer. sync.js new catalogue plan entry + CATALOGUE_INVALIDATION_KEY bump. Third rewrite of replays.html (sections + tile rails + See all routes). NEW replay-category.html shell (single page, URL-param driven, reverse-chron list). connect.html `renderLatestReplay` unchanged (still reads from `replay_playlists` for the single featured card). sw.js precache + nav.js subPageLabel for replay-category. **Session arc:** PM-229 (broadcast-ID approach with chip filter) → PM-231 (theme fix) → PM-235 (full pivot to playlists as source of truth, 8 playlist tiles) → PM-236 (diagnostic) → handoff. Four rewrites on the same surface in one session. **Lesson worth codifying:** Dean's architectural questions ("is that not how it works?", "I can only see the most recent video") both came AFTER mockup-approval and ship. Both were tap-flow issues invisible in static mockups. Next time on a video-browse surface, the mockup needs to walk through the tap-flow explicitly — "tap tile → what does member see → how do they navigate to next/previous?" Static tile mockup is insufficient for video surfaces.

**PM-235 (23 May 2026, vyve-site `1f0c81ff`).** Five-file atomic commit landing the replay surface rebuild. PM-229's `calendar_occurrences.youtube_broadcast_id` approach replaced with `replay_playlists` catalogue table — YouTube playlists are now the source of truth for replay videos, our table just holds the 8 playlist identifiers plus cached latest-video metadata (thumb, title, video_count, published_at). Why the rebuild: Dean's question "session goes live, session finishes, YouTube automatically adds that to the playlist, so why are we doing per-broadcast row mapping?" was correct. Manual SQL per broadcast doesn't scale; a `session-publish` EF cron to automate it is over-engineered when YouTube already aggregates broadcasts into category playlists automatically. **Supabase pre-shipped:** `replay_playlists` table created with RLS + `set_updated_at` trigger + partial index `(display_order) WHERE active = true`; 8 rows seeded with playlist IDs discovered via Vault OAuth + pg_net path (`youtube/v3/playlists?mine=true`); one-shot latest-video cache populated for all 8 via parallel `playlistItems.list` calls. `calendar_occurrences.youtube_broadcast_id` column DROPPED + partial index `idx_calendar_occurrences_replays` dropped first; 10 PM-229 test rows deleted, 6 original past-occurrence rows kept with broadcast_id nulled (legit historical scheduling data). **vyve-site changes:** `db.js` SCHEMA_V11 adds `replay_playlists` store + version chain + `makeCatalogueTable` consumer; `sync.js` adds catalogue plan entry + `CATALOGUE_FRESH_TABLES` entry + `CATALOGUE_INVALIDATION_KEY` bump `pm228-replays-youtube-id` → `pm235-replay-playlists` per §23.50; `replays.html` complete rewrite (PM-229's chip-filter + reverse-chron tile-list replaced with 8 playlist tiles in responsive grid, 1col mobile / 2col >=480px, in-place `videoseries` iframe on tap, close button tears down iframe to stop audio, "Latest" badge on most-recently-updated playlist); `connect.html` `renderLatestReplay` rewritten to read from `replay_playlists` (max `latest_video_published_at` across 8 rows); `sw.js` cache key bumped `pm234-avatar-crop-a` → `pm235-replay-playlists-a`. **Numbering — three renames per §23.14 rule 3:** internal PM-232 during data-layer build → PM-234 when two parallel sessions (More-menu trim + Replays-in-More-menu + avatar instant-paint) took PM-232/233 → PM-235 final ship when a third parallel session (avatar crop modal) took PM-234 during commit build. `sw.js` rebased once on the new HEAD's cache key value; other four files untouched by any parallel session. **YouTube API edge worth codifying:** `playlistItems.list` returns items in playlist order, not date order. Sort by `snippet.publishedAt DESC` client-side to find most recent. Sibling gotcha to PM-229's `broadcastStatus`/`mine` mutual-exclusion. **Lesson on architectural question framing:** Dean's "is that not how it works?" came after two layers of build. Tighter take on mockup-first → also data-layer-first: confirm data shape before building consumer surface. Catalogue-table-of-identifiers scales better than per-item-mirror when upstream system (YouTube/Spotify/Stripe) already aggregates content sensibly. **PM-235b cron EF (hourly refresh of `latest_video_*` cache) is the only follow-up — manually populated once today; quota math 8 calls/hour × 1 unit each = 192 units/day, well under 10000-unit daily.

**PM-233 → PM-239 (23 May 2026, vyve-site `e3823f71`/`d40099b0`/`fc3f756b`/`a1c2926c`/`994e5d9b`).** Five-ship avatar cascade. PM-233: instant-paint on return — populateFromCache renders photo from cached avatar_url (was always painting initials); sw.js gains vyve-avatars-v1 runtime cache (SWR); IIFE DOMContentLoaded handler listens for vyveAuthReady + localStorage email fallback. PM-234: crop modal — 300×300 stage with circular mask, 1-finger pan + 2-finger pinch-zoom + mouse-drag + wheel + slider, all driving the same tx/ty/scale transform; confirm bakes visible region into 512×512 JPEG q=0.85. PM-236: cold-boot cache patch — persistAvatarUrl also patches vyve_settings_cache.member.avatar_url; populateFromCache cross-checks Dexie un-awaitedly. PM-238: synchronous paint-first IIFE — dedicated `vyve_avatar_url_<email>` single-key localStorage cache read at the very top of the inline script before paintCacheEarly; written by persistAvatarUrl + loadProfile, cleared if server says null. PM-239: optimistic-first upload — crop confirm does blobToDataUrl synchronously, paints + persists data URL to Dexie + dedicated key + settings cache IMMEDIATELY, toasts "Photo updated ✓" immediately, then runs upload + PATCH in a background fire-and-forget IIFE; when Supabase public URL returns, swaps data URL for canonical URL in all caches and re-renders to prime the SW runtime cache. Eliminates the 30s Storage CDN cold-start wait from the critical path. Dean's report after PM-239: "paints instantly changes instantly and also loads instantly on load". §23.56 codifies the optimistic-first persist-then-upload pattern. Parallel-session number collisions noted: PM-235 (Replay Playlists), PM-237 + a second PM-238 (Connect hero) collided with my cache key bumps; §23.41 fresh re-fetch caught each one; §23.41 amended to require grep-verify before sed-bumping cache keys. settings.html size journey: 100105 → 99287 → 100677 → 114234 (+crop modal) → 116243 → 117495 → 120224. sw.js cache key ends at `pm239-avatar-optimistic-a`. vbb-marker ends at 120.

**PM-232 (23 May 2026, vyve-site `189bedaa`).** Two real bugs in the PM-228 avatar pipeline surfaced when Dean ran the first end-to-end upload. (1) Storage RLS denied — the pipeline URL-encoded the email segment of the upload path (`deanonbrown%40hotmail.com/avatar.jpg`), but the RLS policy reads `(storage.foldername(name))[1]` and compares against raw `auth.email()` which returns the un-encoded email (`deanonbrown@hotmail.com`). `%40` ≠ `@` → 403 forbidden. Fix: drop `encodeURIComponent` from the email segment of the path. Use `email + '/avatar.jpg'` raw, `encodeURI(path)` on the URL string itself. `@` is a valid path-segment char per RFC 3986. (2) PATCH `members.avatar_url` failed with 401 because the apikey header was sourced from `(window.VYVE_SUPABASE_ANON || '')` which is undefined in the portal — nothing sets that. The portal's anon key lives as `const SUPA_KEY` in settings.html's main inline script, scope-isolated from the avatar IIFE. Fix: declared `var SUPA_ANON_KEY` (same value) inside the IIFE and passed it to both the Storage upload AND the PATCH. sw cache `pm231-replays-theme-c-more-replays` → `pm232-avatar-rls-fix-a`. vbb-marker 113 → 114. §23.41 caught parallel-session drift on both sw.js (PM-231 Replays theme refinement) and index.html (PM-231 marker bump to 113) — fresh re-fetch right before commit, rebased cleanly. **Discipline note (no new §23 rule):** the PM-228 avatar pipeline shipped without a real end-to-end upload test. SQL migration validated, JS validated with `node --check`, structural grep passed — but no round-trip test through Storage RLS + REST PATCH. Both bugs would have surfaced in one upload attempt. For any pipeline touching Storage + RLS + REST in sequence, exercise the trip before declaring complete.

**PM-230 (23 May 2026, vyve-site `1ea875e3`).** Settings bugfix shipped within minutes of PM-228 device feedback from Dean. PM-228's surgical transformer correctly removed the old Account section's HTML (which held the `setting-name` + `setting-email` IDs — profile + email info migrated up to the new Profile section's `profile-name` + `profile-email` IDs) but **did not update the JS that wrote to those IDs**. Four call sites — `loadProfile()` lines 989+1057 and `populateFromCache()` lines 1666+1675 — executed `getElementById('setting-name').textContent = full` on null, threw TypeError, aborted mid-function. Result: Profile name, Coach name, Habits count all sat on "Loading…" placeholders because the paint code that runs AFTER those writes never executed. Fix: four null-guards, `{ var _sn = document.getElementById('setting-name'); if (_sn) _sn.textContent = full; }` shape, block-scoped var. Also stripped from About per Dean spec: Reset app cache row (`/reset-cache.html` chevron) and HK Diagnostic row (`/hk-diagnostic.html` chevron) — both debug surfaces that don't need member-facing tiles. The pages themselves still exist for direct-URL support access. About now: Privacy Policy, Contact support, Account & data chevron, App version. sw cache `pm229-replays-hub-a` → `pm230-settings-bugfix-a` (re-fetched fresh after §23.41 caught parallel PM-229 Replays hub drift between PM-228 and PM-230). vbb-marker 110 → 111. settings.html 100105 → 98541 bytes (−4 lines added as guards, −18 lines of debug rows removed). Discipline note: section-removal surgery must sweep for ALL `getElementById('<id>')` writes targeting elements that lived inside the removed section, not just the DOM. HTML scrub is necessary but not sufficient — orphaned JS writes throw and abort downstream rendering. Captured here as a discipline note rather than a §23 rule because the pattern is judgement-shaped not architecture-shaped (every removal has its own ID list and JS sweep).

**PM-289 (24 May 2026, vyve-site `1476b28f`).** Two-bug fix on Connect hub Elite hero (PM-198). Bug 1: dot strip blank on first paint — `renderStreak` short-circuited on `streak === currentStreak` (both 0 on cold init), skipping the trailing `renderDotStrip` call entirely. The 10 dots between "0 DAYS" / "30 DAYS" end-caps never painted. Fix: dot strip render lifted to top of function, runs unconditionally; firstPaint flag (`currentStreak === 0 && !#elite-dots.firstChild`) also forces first-render through. Bug 2: `connect_checkins` table empty for all real members despite UI showing posted state. Root cause in `connect-checkin.html`: un-awaited POST raced with `history.back()`, iOS WKWebView cancelled the in-flight request mid `.then()`, optimistic Dexie write held UI in checked-in state but server never saw the row → `refresh_member_home_state` UNION (PM-198 migration applied correctly) returned 0. Fixed via `keepalive: true` on fetch, awaited json/dexie chain before navigate-back, and `res.clone().text()` console.error on 4xx so future failures aren't silent. The §23.46 "paint truth not placeholders" rule covers read paths; write paths have no equivalent silent-failure rule yet — worth a §23 candidate if it recurs. Verified end-to-end via diagnostic SQL inserts: `overall_streak_current` jumped to 2 the moment server had rows. Files: connect.html, connect-checkin.html, sw.js (pm288-done-teal-a → pm289-elite-dots-a), index.html (vbb-marker 175 → 176).

**PM-228 (23 May 2026, vyve-site `d1657514`).** Five-file atomic commit landing the settings overhaul Dean designed-through tonight. New section structure: Profile (avatar+name+email+badge) → Coaching (persona + change-coach) → Preferences (Theme, Leaderboard name, Notifications grouped in one section) → Habits → Connections (Apple Health, future Strava/Garmin) → About (Help, Privacy, **Account & data chevron → /settings-account.html**, App version). New `settings-account.html` sub-page (43.5KB) holds Sign out (primary card top), Download my data (GDPR Article 15 modal), Danger zone (Delete my account → typed-email gate → `gdpr-erase-request` EF), erase-cancellation banner, PM-183.7 dev panel (5-tap App version unlock), and version footer with PF-14 7-tap spike toggle + PM-97 long-press reset gesture — all copied verbatim from the old settings.html. Live avatar pipeline: `members.avatar_url text` column added; public `member-avatars` Storage bucket created (512KB ceiling, JPEG/PNG/WebP allowlist) with 4 RLS policies (authenticated INSERT/UPDATE/DELETE scoped to `(storage.foldername(name))[1] = auth.email()`, public SELECT); client-side resize via canvas (centre-crop to square, max 512×512, JPEG q=0.85) which strips EXIF naturally; upload via `x-upsert: true` to `{email}/avatar.jpg`; PATCH `members.avatar_url` + optimistic Dexie upsert + `VYVEBus.publish('avatar:changed')`; render switches `.profile-avatar` initials for `<img>` immediately. Capacitor `@capacitor/camera` plugin deferred to next iOS binary cut — web file input works through WKWebView. Bug fixes folded in: **theme highlight race** (theme.js `defer` vs settings.html inline script ordering, fixed by retry-loop wrapper around `markActiveThemeBtn()`); **sign out race** (handler now awaits `vyveSupabase.auth.signOut()` directly + clears `vyve_auth` localStorage before redirect); **dead Primary Focus card removed** (`members.specific_goal` was written by 1 file and read by 0 — the actual goal column is `members.goal_focus`). sw cache `pm227-mind-hero-a` → `pm228-settings-restructure-a`. vbb-marker 109 → 110. `nav.js` `subPageLabels` gained `'settings-account': 'Account & Data'`. **Tooling: §23.52 violation tonight** — first attempt used `curl -d "$body"` for blob creates; two blobs (settings.html 132KB b64, index.html 162KB b64) overflowed argv silently, captured empty SHAs, tree built with empty-SHA slots, GitHub accepted, **settings.html and index.html disappeared from production for ~90 seconds**. Force-reverted main to last good `dea9279b`, re-attempted via `python3 + urllib.request` (no argv path) which committed cleanly as `d1657514`. The §23.52 rule has been in place since PM-209 (22 May) — tonight is a recurrence not a new gotcha. No new §23 rule earned, discipline note logged for next session: treat §23.52(a) `--data-binary @file` as mandatory on every blob create regardless of file size, since the size-threshold-where-argv-overflows is invisible at code-write time. Profile Identity Campaign slice ship — full campaign (Connect first-load modal, `profile.js` helper, `connect_onboarded_at` + `display_name_mode` columns, Capacitor camera, leaderboard/feed avatar rendering subscribers) remains scheduled.

**PM-212.7 (23 May 2026, vyve-site `b7b6ac3d` → `da563832`).** Closes the PM-212 logo-asset arc. Five-file atomic commit replaces `/logo-mark.png` with Dean's canonical VYVE_Logo.png upload (500×500 RGB, 14671 bytes, byte-for-byte SHA256 match verified post-commit); CSS rewritten on `.ep-thumb .logo-fallback img` to `width:100%; height:100%; object-fit:cover` with zero padding, container `display:flex` → `display:block` full-bleed; `.ep-thumb` parent's `border-radius:10px overflow:hidden` clips the rounded-square asset cleanly. `/logo-white.png` deleted (PM-212.4 leftover, verified unreferenced via repo-wide code search). sw cache `pm223-text-contrast-c` → `pm212-7-real-logo-a`. vbb-marker 104 → 105. Parallel-session drift caught — vyve-site HEAD moved `17f49276` → `b7b6ac3d` between session start and commit (PM-220–223 concurrent ships), §23.41 pre-commit refresh handled cleanly. Lesson from the PM-212.1–6 arc captured: six iterations were spent extracting/synthesising a V-mark glyph from `logo.png`/`icon-192.png`/`icon-512.png`, none of which were needed once Dean uploaded the actual brand asset. Default to asking for the canonical asset before extracting from secondary assets. Not earning a new §23 rule (principle is judgement-shaped, not architecture-shaped) but the arc is captured in changelog for future sessions to read.

**PM-212.3 → PM-212.6 (23 May 2026, vyve-site `38c64631` → `17f49276`).** Four-commit iteration arc on the podcast hub triggered by Dean's device-test feedback. **PM-212.3** (`d2c9a322`) reverted PM-212.2's V-glyph substitute back to `/logo.png` + filter approach with new CSS positioning — still rendered wrong on device. **PM-212.4** (`ca145636`) generated `/logo-white.png` server-side as a pre-baked white silhouette, shipped to repo + used directly — still wrong, because the underlying `logo.png` is a rounded brand container with the V-mark formed by colour variation inside a fully-opaque region, not by transparent negative space. Three failed iterations all stem from not inspecting the source asset shape before the first attempt. Investigation finally revealed `icon-192.png` contains the V-mark glyph visibly (light teal V on dark teal background, designed for small tile rendering). **PM-212.5** (`b863c04d`) shipped two changes: (1) skeleton-first paint — `paintSkeleton()` runs synchronously at script execution writing 4 + 6 placeholder cards with pulsing text bars + pill outlines, same dimensions as real card so zero layout shift on swap, `paint(rows)` guarded against empty-rows clobber so cold-first-visit sync doesn't blow away the skeleton; (2) service worker runtime cache for `drive.google.com/thumbnail` URLs — cache-first against dedicated `vyve-drive-thumbs-v1` cache with `{mode:'no-cors'}` opaque responses (renderable by `<img>`, cacheable by SW), activate handler `PRESERVE` Set extended so deploy CACHE_NAME bumps don't nuke the thumbnail cache, eliminates 200-500ms per-thumbnail network round-trip on every visit after the first. Real thumbnails on top of brand-tile fade in via opacity:0→1 transition triggered by `onload="this.classList.add('loaded');"`. Brand fallback switched from `/logo-white.png` to `/icon-192.png`. **PM-212.6** (`17f49276`) addressed Dean's "logo doesn't sit right on dark mode" — icon-192 had its own dark-teal rounded-square background reading as a foreign sticker on the card surface. Generated `/logo-mark.png` (192×192, 641 bytes): 15% inset crop drops the rounded-square edge ring, luminance threshold > 80 selects the light-teal V-mark glyph, recolour to white preserving alpha. Result: pure transparent-background white V on the card's own teal gradient, blends in both themes. CSS: `padding:18px` for V-mark breathing room, `object-fit:contain`. `paint(rows)` guard + skeleton + SW thumb cache + clean V-mark fallback together mean: first visit skeleton-paints instantly then real cards swap with thumbnail fade-in over 10-200ms, subsequent visits paint everything instantly from cache. Across the four commits: §23.41 pre-tree HEAD refresh caught two parallel-drift events (PM-220.x Connect parallax + PM-221/222 Connect frosted-glass) and merged against current HEAD rather than committing on stale parent. PAT-direct throughout (Composio still 401 from 21 May incident). No new §23 rules earned. `/logo-white.png` left in repo from PM-212.4 as leftover artifact — referenced nowhere, low-priority cleanup. Lesson captured: inspect source asset shape before choosing transformation path; don't substitute when user gives a literal "use X" constraint, debug toward it.

**PM-212.2 (23 May 2026, vyve-site `9badb2cb` → `38c64631`).** Two-fix follow-up on PM-212.1. (1) Logo fallback for missing thumbnails: PM-212.1's `<img src="/logo.png">` + `filter: brightness(0) invert(1)` approach didn't render cleanly on device — the filter chain wasn't producing a visible white V-mark at the 78px tile size (filter applied to 500×500 RGBA raster with transparent edges + teal V-glyph, theoretically should give white V over teal gradient but in practice rendered invisibly). Swapped to a **Playfair Display "V" character** in the `.logo-fallback` div: `font-family:var(--font-head); font-weight:800; font-size:2.6rem; color:#fff; text-shadow:0 1px 3px rgba(0,0,0,0.22)`. No asset dependency, scales cleanly, matches the existing `.mph-logo-v` pattern in nav.js (visual consistency with the mobile-page-header V-mark members already see at the top of every page). (2) Louis Watkins thumbnail at the Drive URL had EXIF Orientation set to 90° rotation but Drive's thumbnail service doesn't apply the EXIF transform — it serves raw pixel data oriented per the camera sensor. Fixed via `UPDATE public.podcast_episodes SET thumbnail_url = NULL WHERE id = 'ep_louis_watkins'`; falls back to V-glyph until v1.1 Storage migration where we can pre-process orientation server-side. 3-file atomic commit (podcast.html +19/-16, sw.js cache `pm211-podcast-b` → `pm211-podcast-c`, vbb-marker 82 → 83). Tooling discipline clean throughout. No new §23 rule.

**PM-212.1 (23 May 2026, vyve-site `bff78cb4` → `9badb2cb`).** Same-session device-test follow-up to PM-212 podcast hub MVP. Four-file atomic commit closing four pieces of Dean feedback. (1) `nav.js` wired into `podcast.html` via the standard `<script src="/nav.js" defer></script>` pattern — page now renders the standard mobile topbar (56px sticky, back button + "The VYVE Podcast" page label) plus the fixed bottom-nav with Home/Body/Mind/Connect (Connect highlighted via new `path.includes('podcast')` matcher in `getActiveTab`). Hero spacing fix is implicit — was sitting flush at viewport top because nav.js wasn't loaded; now sits at the same vertical position as every other portal page. (2) Thumbnail fallback for the 12 episodes without Drive thumbs (and any future Drive 404) swapped from bare gradient to the white VYVE logo over teal gradient — `.ep-thumb` always emits `.logo-fallback` child with `/logo.png` recoloured to white via `filter: brightness(0) invert(1)`; episode `<img>` layered on top via `z-index:1` when present; on `onerror` strip the failed img and logo shows through; `::after` darkening overlay at `z-index:2` keeps text legible above either layer. (3) Express Interest CTA changed from `<a>` linking to `vyvehealth.co.uk/vyve-podcast.html#guest` (external, opens new tab) to `<button>` opening a bottom-sheet modal that collects name + 3-line story then fires `window.location.href = 'mailto:team@vyvehealth.co.uk?subject=...&body=...'` — system mail composer takes over, Lewis receives normal emails, no EF, no DB, mirroring the `settings.html` Contact support handoff pattern. Modal styled with semantic theme tokens (var(--bg), var(--surface), var(--text), var(--teal-lt)), safe-area-inset-bottom honoured, slide-in/out animation matching `vyve-more-menu` from nav.js, closes on backdrop tap / Cancel / ESC / 400ms-after-mailto-fire (so mail app takes focus before sheet animates away). (4) `nav.js` gained two surgical lines: `path.includes('podcast')` added to the Connect-tab matcher in `getActiveTab()`, and `'podcast': 'The VYVE Podcast'` added to `subPageLabels` adjacent to existing connect-* entries. sw cache `pm211-podcast-a` → `pm211-podcast-b` (campaign-prefix preserved since this is same-line refinement). vbb-marker 81 → 82. New playbook `playbooks/podcast-episode-add.md` ships in this brain commit — direct answer to Dean's "how will new episodes get added" question, captured as durable Lewis-facing doc covering INSERT template, display_order shuffle, latest→archive migration, column reference, and forward-compat note for v2 audio_url column. Tooling discipline clean — PAT-direct, §23.52(a)/(b)/(c), §23.41, §23.53 all honoured. No new §23 rule earned.

**PM-212 (23 May 2026, vyve-site `31e6910e` → `bff78cb4`).** Podcast hub MVP shipped end-to-end in one session. Six-file atomic commit via Git Data API: `podcast.html` NEW (17314 bytes, hero + Latest Episodes section [7 rows] + Everyman Archive section [33 rows] + Be-a-guest CTA + "Coming soon" future-note; theme.css tokens throughout, no inline `:root` per PM-163; §23.46 honest-paint default empty markup with Dexie hydrate via `vyve-localdb-table-pulled` event; §23.49 imagery with onerror remove → gradient placeholder fallback); `connect.html` adds gold-gradient `.podcast-tile` immediately below the Calendar tile from PM-210b (same shape — 16:8 aspect ratio, frosted-pill mic icon, Playfair title, "Open →" CTA — reusing `.calendar-tile-*` inner classes); `db.js` SCHEMA_V10 = SCHEMA_V9 + `podcast_episodes: '&id, section, display_order, active'` + `db.version(10).stores(SCHEMA_V10)` + `makeCatalogueTable('podcast_episodes')` consumer; `sync.js` adds catalogue plan entry hitting `/podcast_episodes?active=eq.true&select=*&order=display_order` + `podcast_episodes: 1` to `CATALOGUE_FRESH_TABLES` (5-min stale) + `CATALOGUE_INVALIDATION_KEY` bumped `pm210-calendar-occurrences` → `pm211-podcast-episodes` (one-time refresh on every existing device's next visit per §23.50); `sw.js` cache `pm210-calendar-a` → `pm211-podcast-a` + `/podcast.html` precache entry; `index.html` vbb-marker 80 → 81. Supabase: `pm211_create_podcast_episodes` migration earlier in session — table + partial index on `(section, display_order) WHERE active=true` + `SECURITY DEFINER` updated_at trigger + RLS read-all policy `podcast_episodes_read_authenticated` for `authenticated` role; 40-row seed inserted via single ON CONFLICT UPSERT (7 latest post-VYVE-rebrand episodes + 33 Everyman archive; 28 with Drive thumbnail URLs, 12 with NULL thumbnail rendering as gradient placeholders). External-links MVP framing is deliberate — Dean's call to ship the functional shape now and defer the in-app audio player (Capacitor background-audio plugin, lock-screen controls, audio sourcing from Riverside masters or RSS feed, podcast_views activity + Achievement track, store resubmissions) to the post-trial "year of updates" bundle alongside Session Recaps + Portal Admin editor. Tooling discipline clean throughout — §23.45 PAT-direct (Composio still 401-ing from 21 May incident, now 36+ hours); §23.52(a) all six blob bodies routed via `/tmp/vyve/commit/blob_*.json` + `curl --data-binary @file` (largest index.html at 162KB body, exactly the size class that broke PM-209.1); §23.52(c) every SHA asserted non-empty + 40-char hex; §23.53 every response body to disk first, parsed in separate step; §23.41 pre-tree HEAD re-fetch confirmed parent at `31e6910e`; §23.52(b) post-commit `files[].status` confirmed `{added: 1, modified: 5, removed: 0}`; per-file first-100-char re-fetch all passed. No new §23 hard rules earned.

**PM-210b (23 May 2026, vyve-site `5488a1f9` → `31e6910e`).** Connect calendar member UI shipped — closes PM-210 end-to-end (PM-210a 22 May shipped the Supabase schema + 190-row backfill; PM-210b ships the member-side wiring). Six-file atomic commit via Git Data API (Composio still 401 from 21 May security incident, now 36+ hours): `db.js` SCHEMA_V9 adds `calendar_occurrences` Dexie store with index `'&id, type, starts_at, active'` + `db.version(9).stores(SCHEMA_V9)` chain entry + `makeCatalogueTable` consumer; `sync.js` adds catalogue plan entry hitting `/calendar_occurrences?active=eq.true&select=*&order=starts_at` with `replaceForMember(null, rows)` persist + `calendar_occurrences: 1` to `CATALOGUE_FRESH_TABLES` (5-min stale) + `CATALOGUE_INVALIDATION_KEY` bumped `pm190c-image-url` → `pm210-calendar-occurrences` (one-time refresh on next visit per §23.50); `connect-calendar.html` NEW 798 lines with Agenda (default) + Month grid views, dismissible filter pills (Live Sessions teal + Events gold, both active by default with OR semantics), Pattern 2 catalogue paint per §23.48 (synchronous Dexie read, no skeleton per §23.46, repaints on `vyve-localdb-table-pulled`), Pattern 3 30-second `setInterval` ticker for Live-now state with pause-on-hidden + immediate-eval on resume, all dark/light parity via `theme.css` semantic tokens with no inline `:root` per PM-163; `connect.html` Latest from VYVE carousel REPLACED with single wide Calendar destination tile reading next live session + next event from Dexie via new `renderCalendarTile()` (was `renderLatestFromVyve()`) + bus listener for `vyve-localdb-table-pulled` filtered to `calendar_occurrences`; `sw.js` cache `pm209-mind-focus-banner-a` → `pm210-calendar-a` + `/connect-calendar.html` precache entry; `index.html` vbb-marker 79 → 80. §23.52 discipline applied cleanly — all six blob bodies via `/tmp/pm210/blob_*.json` files + `curl --data-binary @file` (largest body index.html at 162KB, exactly the size class that broke PM-209.1); all SHAs asserted non-empty + 40-char hex shape; post-commit `GET /commits/{sha}` `files[].status` confirmed `{added: 1, modified: 5, removed: 0}` — six files exactly. **One new §23 hard rule earned tonight — §23.53 (JSON parse from file, not inline `python3 -c | $(...)`)**. The commit POST succeeded but the response parser one-liner choked on raw newlines in the multi-line commit message field, returned empty captured SHA, mid-pipeline `exit 1` fired — and from the operator's perspective looked identical to "GitHub returned no SHA". Sibling rule to §23.52(c). See §23.53 below.

**PM-210a (22 May 2026, brain `ea7af33f`, vyve-site untouched at `5488a1f9`).** Supabase-only ship — `pm210_create_calendar_occurrences` migration created the `calendar_occurrences` table with `type` discriminator (`live_session`|`event`), full timestamp shape (`starts_at`, `ends_at`), location fields, imagery URLs, FK to `service_catalogue` for materialised recurrences, cancellation flag, RLS enabled with single `calendar_occurrences_read_authenticated` read-all policy, `updated_at` trigger via `SECURITY DEFINER` function. Two partial indexes (`starts_at` + composite `(type, starts_at)`) both `WHERE active=true`. 190 backfill rows inserted covering 22 May → 16 Jul 2026, generated from `sessions-data.js` shape (not `service_catalogue` shape, because PM-190.d codified sessions-data.js as the actual member-facing source of truth post-PM-188). Breakdown: Yoga ×56, Mindfulness ×56, Workouts ×56, Group Therapy ×8, Weekly Check-In ×8, Events & Run Club ×2, Education & Experts ×2, Podcast ×2. Zero `event`-type rows yet — Lewis adds those via Supabase dashboard SQL editor as trial events get scheduled (handoff format documented in changelog).

**PM-209 + PM-209.1 (22 May 2026, vyve-site `316aded3` → `5488a1f9`).** Mind hub Today's Focus tile restructured: 150px corner-circle thumbnail (`.thumb-hero`, radial-glow ring positioned absolute right:-30px top:-30px) replaced by full-bleed `.hero-banner` matching the `.vz-hero` detail-page pattern. Image fills the card top via `background-image` + `--bg-img` CSS variable, dark gradient bottom-half for legibility, badge top-left in a frosted-pill, title + meta stack bottom-left in white. Play CTA retained as full-width teal bar below. Brings the hub tile into visual parity with what members see one tap deeper. `renderFocus()` JS rewritten to probe-then-paint via `new Image()` + onload (avoids gradient placeholder flashing intrinsic image dimensions). The atomic 3-file commit (mind.html + sw.js + index.html) initially failed: index.html (121KB) base64 body (~162KB) overflowed bash argv when routed through `curl -d "$body"`, the `BLOB_INDEX` capture came back empty, the tree was built with an empty blob SHA, and **GitHub silently accepted it and deleted index.html from production for ~3 minutes**. Recovery commit `5488a1f9` restored the file from the parent commit's blob. New §23.52 rule earned with three sub-clauses: (a) `-d "$body"` forbidden for any body >10KB, use `--data-binary @file`; (b) post-commit verify must inspect `commits/{sha}` files[].status array, not just file contents; (c) any SHA captured from a blob/tree create must be asserted non-empty before downstream use. sw cache `pm208-silent-refresh-a` → `pm209-mind-focus-banner-a`. vbb-marker 78 → 79.

**PM-205 (22 May 2026, vyve-site `5e2ba978`).** Posted-state hero-to-header gap final tune: `.wrap` posted-state `padding-top` 14px → 28px. PM-204 had landed the fix on the correct surface but 14px read cramped on-device. 28px confirmed by Dean. sw cache `pm204-wrap-padding-a` → `pm205-wrap-padding-28-a`. vbb-marker 75 → 76.

**PM-204 (22 May 2026, vyve-site `338a4a7a`).** Posted-state spacing fix — actually fixed this time. PM-201/202/203 chained three failed attempts (timid → aggressive → restore) all editing `body.posted-state-visible .topbar` padding, which on this page is **dead CSS**. The actual sticky header on connect-checkin.html is `.mobile-page-header`, injected by `nav.js` line 249 (created in `nav.js`, styled in `nav.js` line 115, with `min-height:56px` + safe-area). The `.topbar` selector in connect-checkin.html matches no DOM element on the page. Root-cause discovery came from Dean asking "is the painting different on this page" — that prompted a cascade audit, which found the dead selector. Real lever: `.wrap` `padding-top` in posted-state (PM-201 had set to 0; PM-204 corrects to 14px, PM-205 to 28px). PM-204 commit also removed the dead `body.posted-state-visible .topbar` rule entirely. New §23.51 rule earned (selector-match audit before re-tuning a CSS value across iterations). sw cache `pm203-spacing-restore-a` → `pm204-wrap-padding-a`. vbb-marker 74 → 75.

**PM-203 (22 May 2026, vyve-site `a1dd4e6b`).** Failed iteration — restored topbar padding-bottom from PM-202's 2px back to 14px and removed PM-201's negative margins. CSS edit landed cleanly but produced no visible on-device change because the `.topbar` selector still matched nothing. See PM-204 for root cause. sw cache `pm202-spacing-tighten-a` → `pm203-spacing-restore-a`. vbb-marker 73 → 74.

**PM-202 (22 May 2026, vyve-site `8df46dd1`).** Failed iteration — aggressive tighten: topbar `padding-bottom:8px → 2px`, `#posted-state margin-top:-12px`, `.hero-checkin margin-top:8px`. Intended to close PM-201's residual gap. Produced no visible change (selector matched nothing). Dean's screenshot of "still looks the same" was the PM-202 state, not PM-201. sw cache `pm201-prewarm-polish-a` → `pm202-spacing-tighten-a`. vbb-marker 72 → 73.

**PM-201 (22 May 2026, vyve-site `f2a923f7`).** Three polish fixes on top of PM-200's Direction B ship after live-device feedback from Dean. (1) Cache prewarm from Connect hub: `prewarmFeedPreview()` un-awaited from `paintAll()` writes `connect-feed-preview` EF result to Dexie `_kv` if cache stale (>60s), so by the time the member composes + posts a check-in (10-30s window), the cache is warm and the posted-state community section paints instantly. Shifts EF cold-start cost off the critical path entirely. Pattern is §23.7.7 fan-out-on-arrival applied to a sibling page. (2) Own-card display name + avatar consistency: `resolveOwnInitials()` client-side helper queries `members` table for `first_name` + `last_name` + `display_name_preference`, mirrors the EF logic, caches in-memory. Fixes "TE" rendering for test1@test.com when community card was rendering "TC". (3) Hero spacing **attempt** — tightened `.topbar` padding (later proven dead-CSS by PM-204). The first two ship correctly; the spacing component took four more commits to land. sw cache `pm200-community-preview-a` → `pm201-prewarm-polish-a`. vbb-marker 71 → 72. No new §23 rule earned at PM-201 itself.

**PM-200 (22 May 2026, vyve-site `416cec0b`, plus `connect-feed-preview` EF v1 deploy).** Reframes the connect-checkin.html posted-state from transaction receipt into a social on-ramp. The three-mock design exploration (A moment / B community / C streak) shipped tonight selected Direction B. The dead-end problem (member posts → screen shows receipt + two buttons → leave) was the deep flaw; B solves it structurally by putting the live community feed on the same screen. Three-panel layout: (1) Hero card (gradient teal) — own check-in as the largest element, avatar + "You · Posted HH:MM" + italic Playfair prompt eyebrow + 1.8rem Playfair body + focus tag + own-reaction count from Dexie, "Posted ✓" badge top-right absorbs the receipt role. (2) "Latest from VYVE" community preview — 3 latest check-ins across ALL members globally (Dean's PM-200 scope decision, not workplace-scoped), with display names resolved server-side per `members.display_name_preference`, reaction emoji buttons interactive in place via optimistic Dexie write + outbox queue. Live pulse dot + "N today" counter. "🌱 You're the first one today" empty state when feed excludes own row. (3) Single primary teal CTA "Open community feed →", ghost text link "Back to Connect", Playfair italic "Tomorrow waits with a fresh question." Lock + "come back tomorrow" dropped entirely. New EF `connect-feed-preview` v1 ACTIVE (id `1782d22d-2b9f-428e-b5fa-d44738e78580`) — `verify_jwt: true`, dual-client pattern (PM-187 shape), returns latest 3 connect_checkins with display name + initials resolved server-side, reaction counts aggregated by emoji key, plus today's distinct-member count. Mirrors §23.48 Pattern 4 client lifecycle (paint from `_kv` → fetch if stale → write + repaint). sw cache `pm199-recent-reactions-a` → `pm200-community-preview-a`. vbb-marker 70 → 71. No new §23 rule earned.

**PM-199 (22 May 2026, vyve-site `229601f1`).** PM-198 follow-up cleanup. Two gaps closed in `connect.html`: (1) `renderPostedState` toggles `#checkin-icon-pencil` / `#checkin-icon-tick` visibility alongside the CTA/badge/copy swap — both SVGs shipped in PM-198 but no JS toggle existed, tick was permanently `display:none`. (2) `renderRecentCheckins` builds a `{ checkin_id: count }` map from a parallel `checkin_reactions.allFor(memberEmail)` Dexie read inside `paintAll`, passes count into render. Previously read `c.reaction_count` which is not a column on `connect_checkins` — always rendered 0 despite live reactions on `connect-feed.html` for the same rows. Scope: own member, own reactions (v1). Bus subs to `connect:reaction:logged/cleared` already wired from PM-187. sw cache `pm198-elite-hero-a` → `pm199-recent-reactions-a`. vbb-marker 69 → 70. §23.46 contract preserved. No new §23 rule earned.


**PM-198 (22 May 2026, vyve-site `d0ad5320`).** Connect hub Elite section retired the "Your Momentum" framing (small ring with day count digit, flat gold progress bar, "21 more active days to unlock" sub-line) and shipped the Premium-Feel mockup Dean got from Cole Patterson 19 May. New shape: pencil check-in card FIRST (action), Elite hero card SECOND (destination). Elite hero is a 108px teal ring with a lock at centre, Playfair headline "The **Elite** Community unlocks at 30 days." (Elite in gold), and a 10-dot consecutive-day strip below with "6 DAYS / 30 DAYS" end-cap numerals in Playfair. Each dot = 3 days; done dots are solid teal-light with glow, today-pulse on next unfilled dot with 4px ring. Unlocked state (streak ≥ 30) swaps lock to 🌿 sprout, palette to green accents, headline to "You've unlocked the Elite Community."

**The mechanic.** Elite = **30 consecutive days of activity**, not 30 days in last 30. Miss a day and the streak resets to 0 — handled by the existing `refresh_member_home_state` SQL CTE pattern (`WITH ... runs WHERE run_end = v_today`), which only returns run_len when today is the end of a contiguous run. Dot strip and numerals drop to zero visually on miss; no grace period, no consolation prize — that visual reset is the cost of the streak and the source of the premium emotional weight.

**Connect check-ins now count toward overall streak.** Migration `pm198_add_connect_checkins_to_overall_streak` extended the UNION inside `refresh_member_home_state(p_email)` to include `connect_checkins.checkin_date` alongside the existing 5 sources (daily_habits, workouts, cardio, session_views, replay_views). `active_days_30` also extended to match — engagement consistency component now reflects Connect activity. Backfill ran for every member with at least one connect_checkins row (1 member tonight). Client-side `home-state-local.js` updated in the same commit: `VYVELocalDB.connect_checkins.allFor(email)` added to the parallel-load Promise.all, rows projected to `{activity_date: r.checkin_date}` shape and concatenated into `overallStreak` compute. Server + client now match exactly.

**Dexie-first read path.** Elite hero sources `overall_streak_current` from `VYVEHomeStateLocal.computeHomeStateFromDexie(email)` — the in-browser clone of the SQL function that replicates the full activity union locally. Synchronous Dexie read at paint, zero EF round trip. Cold-start with no Dexie data renders zeros honestly per §23.46; sync.js hydration fires `home-state:hydrated` → `paintAll()` re-runs → Elite hero recomputes from fresh data and ticks up.

**Optimistic-tick mechanic.** Member taps "Check In Now" → `connect-checkin.html` performs §23.39 optimistic-first write to Dexie + outbox queue → publishes `connect:checkin:logged` on the bus. `connect.html` already subscribes to that event (the prior `paintAll()` wiring) — recomputing from Dexie naturally produces the new streak because the optimistic row is already local. No separate +1 bump logic needed; the Dexie state IS the truth. Dot strip animates via CSS transition on `.dot` / `.dot.done` / `.dot.today` background+box-shadow swap. Server EF lands seconds later → reconciles silently via `home-state:hydrated`.

**Phase 3 pillar realignment (PM-159, post-launch) pre-positioning.** Dean's vision: engagement remaps from legacy 5 tracks (Habits/Workouts/Cardio/Sessions/Checkins) onto the new 5 pillars (Habits/Body/Mind/Connect/Checkins) where Body = workouts + cardio, Mind = mind_activities (the 6 sub-types shipped PM-173–183), Connect = live sessions + check-in + replay sessions. Tonight's PM-198 doesn't ship that realignment — too much downstream tail (achievements catalog 32 metrics × 327 tiers, certificate names "The Architect / Warrior / Relentless / Explorer / Elite", engagement.html component math). But the Elite hero now reads from `overall_streak_current` which is a single field — when the pillar realignment ships, no UI change needed, the field value just reflects new pillar definitions.

**Files committed:** `connect.html` (CSS block + markup reorder + render rewrite), `home-state-local.js` (parallel load + UNION), `sw.js` (cache `pm194-auth-recovery-a` → `pm198-elite-hero-a`), `index.html` (vbb-marker 68 → 69). Removed code: `computeStreak` (local 30-day one-day-grace), `renderMomentumSub` (two-axis), `computeEliteProgress` (4-table 30-in-30 approximation), `renderElite`. All collapse into `renderStreak` as single source. `ELITE_TARGET` and `STREAK_LIMIT_DAYS` constants left declared but unused — harmless.

**No new §23 rule earned.** All patterns exercised are established doctrine: §23.39 (optimistic-first write skeleton), §23.46 (paint truth, not placeholders), §23.48 Pattern 1 (bus-driven, no timers), §23.41 (parallel-session safety with HEAD re-check and post-commit verification). Composio creds still dead from the 21 May security incident; §23.45 PAT-direct path exercised end-to-end again, Git Data API multi-file commit (blobs → tree → commit → update ref), post-commit first-100-char verification passed on all 4 files pinned to new commit SHA.

**PM-197 (22 May 2026, this commit — brain-only).** Three further threads from Dean's design discussion folded into the existing 21 May Profile identity campaign spec, plus one architectural question resolved with live data. Thread 1: Connect first-load modal (not onboarding) for display-name + avatar pickers with first-name + curated V-badge defaults — page paints behind the modal, skip path produces sensible identity. Thread 2: photo upload uses Supabase Storage + Service Worker caching (centralised, not local — matches WhatsApp/Slack/Instagram pattern), Capacitor camera plugin for iOS picker, client-side resize to 512×512 + JPEG q=0.85 + EXIF strip before upload. Thread 3: Lewis-track policy concerns flagged (moderation, GDPR Article 17 bucket cleanup, offboarding) — worth sight before build. Thread 4: Edge Function cost analysis with live production data — currently using 0.25% of Pro plan's 2M-invocation monthly quota, even 100× scale stays under ceiling. Dexie campaigns (PF-15/PF-40/PM-96 family) pay off in paint speed + offline capability, NOT in EF cost reduction — that was always the right framing. No new §23 rule.

**PM-196 (22 May 2026, this commit — brain-only).** Two design threads from Dean folded into the brain. (1) Light-mode contrast audit added to the PM-195 Sunday Premium-Feel polish pass — Alan Bird is a light-mode user, current secondary text is faded teal on white, fails WCAG AA. Sunday scope expanded: Body flicker + light-mode contrast audit + reference-page propagation, combined window full Sunday + half Monday. (2) Theme preference added as 4th persisted preference on the existing 21 May Profile identity campaign spec — currently per-device localStorage, moving to `members.theme_preference` for cross-device sync. The planned `identity.js` helper renamed to `profile.js` since it now covers identity + theme together. Hybrid configuration approach resolved: theme + avatar via contextual first-time prompts, display name via onboarding-time with first-name-from-onboarding as smart default. Soft-launch tension flagged: current email-local-part display names will read as test environment on the 15-20 person trial leaderboard; surgical pre-trial `display_name` ship (1 session, independent of full campaign) parked as decision-point for Dean. Full diagnosis + decision matrix in `tasks/backlog.md` "Added 22 May 2026 — PM-196 supplement". Existing 21 May Profile identity entry kept as-is with PM-196 supplement noting three additions to apply at build time. No new §23 rule.

**PM-195 (22 May 2026, this commit — brain-only).** Dean reported Body-tab navigation showing exercise.html skeleton for 1-6s before content renders. Diagnosed in full: six contributing factors in exercise.html paint sequence (CACHE_TTL 1hr too short, cache key per-page only, VYVESync.criticalHydrate un-awaited per PM-125, skeleton stays up until reveal/10s watchdog, font-load layout shift, cold network round-trip). Five candidate fixes scoped (A bump TTL / B Dexie-first paint / C pre-warm from auth.js fan-out / D nav.js touchstart cache prime / E reduce skeleton lifetime). Dean's explicit call: do not fix in isolation — queue for Sunday/Monday Premium-Feel polish pass alongside Home / Mind / Connect, one coordinated pattern across all hubs. Full diagnostic + candidate fixes in `tasks/backlog.md` "Added 22 May 2026 — PM-195 diagnostic". No vyve-site changes this session. No new §23 rule.

**PM-194 (22 May 2026, vyve-site `40a3d010`).** Dean hit "Preview mode: Auth failed to initialise." banner ~75 min after login. Diagnosis via `auth.refresh_tokens` confirmed cached JWT expired at ~16:22 and the refresh attempt threw. The outer catch in `vyveInitAuth()` was handling thrown errors differently from null-session returns from `getSession()`: null-session → redirect to login (correct), thrown error → show banner and reveal app in half-authenticated state (wrong). Fix: thrown errors now mirror the null-session path — clear `vyve_auth`, write `VYVE_RETURN_TO_KEY`, redirect to login. Underlying refresh failure root cause unresolved (one observed instance, no repro yet); the defensive fix means future occurrences self-recover. SW `pm193-login-polish-a` → `pm194-auth-recovery-a`. vbb-marker 67 → 68. No new §23 rule (local to one function, not architectural doctrine).

**PM-193 (22 May 2026, this commit).** Dean screenshots showed two issues on login.html: a `<v>` placeholder block instead of the real logo (sat next to "VYVE Health" wordmark), and the form jumping upward when the iOS keyboard opened. Both fixed in vyve-site this session. Logo: swapped `<div class="logo-v">V</div>` for `<img src="/logo.png">` at 56×56 / radius 12. Keyboard: viewport `interactive-widget=resizes-content` → `resizes-visual` — keyboard now overlays without shrinking the layout viewport, so the centred `.wrap` no longer recomputes its position. vyve-site commit `a50d8b999ce3542d4df8b9653f88971f3da26a01`. SW `pm191-live-page-titles-a` → `pm193-login-polish-a`. vbb-marker 66 → 67. No new §23 rule (viewport-meta keyboard handling is standard mobile-web pattern, not VYVE-specific doctrine). The other two screenshot issues — native iOS splash (logo too small with white box) and the `<v>` chip iOS shows in the status bar — are vyve-capacitor native concerns (app icon + LaunchScreen.storyboard + capacitor.config.json SplashScreen plugin) not shippable via Capawesome OTA. Full spec parked in `tasks/backlog.md` under "Added 22 May 2026 — PM-193 follow-up" for Monday night's planned Xcode/bundle session.

**PM-192 (22 May 2026, this commit).** Live + replay session pages were rendering "SESSIONS" in the mobile header on all 16 pages (8 live + 8 replay). Root: `nav.js` `subPageLabels` had no entries for the `{name}-live` / `{name}-rp` file stems, falling through to `hubLabels.sessions`. The desktop `.topbar` rendered by `session-live.js` already carries the correct `<span class="session-name">…</span>` but `session-live.css` hides it on mobile by design — mobile pages get their label from `nav.js`. Fix: added 16 entries mapping to canonical titles from `sessions-data.js`. Single-file edit in `nav.js`, plus mandatory portal-deployment bumps (`sw.js` cache key, `index.html` vbb-marker). vyve-site commit `e94a5e595c01c9a74125280af767dcbb55da21e0`. SW `pm190e-direct-links-a` → `pm191-live-page-titles-a`. vbb-marker 65 → 66. No new §23 rule.

**PM-190.e (21 May 2026, this commit).** One-line port on top of PM-190.d. Live This Week card `href` was hardcoded `/sessions.html`; rewired to `s.liveUrl` so taps go directly to `yoga-live.html`, `workouts-live.html`, etc. Mirrors sessions.html behaviour. The two "View all ›" section-header links stay pointed at `/sessions.html` (correct — those are indices). Latest from VYVE was already linking to `s.replayUrl` per PM-190.d. vyve-site commit `5af820847aa2403becc56eed5d295ad1b559742b`. SW `pm190d-shared-sessions-a` → `pm190e-direct-links-a`. vbb-marker 64 → 65. No backlog edit, no new §23 rule.

**PM-190.d (21 May 2026, this commit).** PM-190 → PM-190.c shipped DB-driven imagery via `service_catalogue.image_url` + Dexie sync + freshness mechanism across three commits. Photos still didn't render on device after Update 63. Dean's question cut through: "why can't the front screen just render the pills from the sessions page?" Sessions.html has always rendered the same photos from a hardcoded JS const that loads synchronously. PM-190.d extracts that const into shared `sessions-data.js`, both sessions.html and connect.html consume it. Three changes in connect.html: Live This Week sorts chronologically by `getNextOccurrence`, formats "when" as actual `"Friday · 06:00"` from upcoming Date, sources thumbs from `s.thumb` (e.g. `/thumb-yoga.jpg`); Latest from VYVE links to `s.replayUrl` with same imagery. New file `sessions-data.js` precached in sw.js. vyve-site commit `360fdfe1425fba6c520e05212ae42e1b2ac55e45` (5 files: sessions-data.js NEW, sessions.html, connect.html, sw.js, index.html). SW `pm190c-catalogue-fresh-a` → `pm190d-shared-sessions-a`. vbb-marker 63 → 64. Device-confirmed: photos rendering at Update 64.

**What this abandons:** the DB-driven content-ops surface from PM-190. `service_catalogue.image_url` column stays in the DB (harmless, useful when Command Centre editor campaign lands). §23.49 and §23.50 stay as forward-looking doctrine — both pre-positioned for the editor campaign. The catalogue-freshness mechanism (PM-190.c sync.js changes) still useful for future catalogue schema bumps via `CATALOGUE_FRESH_TABLES` + `CATALOGUE_INVALIDATION_KEY`. No new §23 rule earned tonight — the lesson learned is judgement-shaped, not rule-shaped.

**PM-190.c (21 May 2026, this commit).** Recovery for PM-190's image_url column not producing photos on Dean's device. Root cause: `sync.js` has 24h stale window on catalogue tables; PM-190 added the column after the device had already pulled pre-migration rows. Render path read undefined `image_url` from Dexie, no `<img>` emitted. Fixed two-axis: (1) `service_catalogue` joined a new `CATALOGUE_FRESH_TABLES` registry with a 5-minute stale window (content-ops surfaces should never be on 24h); (2) new global `CATALOGUE_INVALIDATION_KEY` constant in sync.js — when its value differs from the value recorded in `_sync_meta` for a table, force one refresh regardless of stale window. Both axes live forward. `db.js _sync_meta.set` extended to accept an optional third arg for the key. vyve-site commit `5e785cebd9004e2bc255eeeb81135394f8ef6bd7` (4 files: sync.js, db.js, sw.js, index.html). SW `pm190-chronological-a` → `pm190c-catalogue-fresh-a`. vbb-marker 62 → 63. New §23 hard rule earned: §23.50 (catalogue schema changes require an invalidation-key bump). Paired contract with §23.49.

**PM-190.b (21 May 2026, this commit).** Follow-up to PM-190 imagery wiring. Live This Week carousel was sorting alphabetically by category, which forced "Education & Experts" to the lead position — and its `image_url` is NULL, so the carousel was always leading with a gradient tile. Replaced sort with chronological by next-occurrence: parse `schedule_day` + `schedule_time` into ms-until-next, sort ascending, NULL/unparseable schedules sort to back, alphabetical tie-break for stability. vyve-site commit `ca1581e2942d7985db1a8a580a6d5ddc5163f5b2` (3 files: `connect.html`, `sw.js`, `index.html`). SW `vyve-cache-v2026-05-21-pm189-connect-thumbs-a` → `vyve-cache-v2026-05-21-pm190-chronological-a`. vbb-marker Update 61 → 62. Tonight (Thu 23:56) the carousel will still lead with a gradient tile because Podcast at Fri 12:00 is genuinely the next session; chronological honesty over visual polish. Permanent fix is content: add Education + Podcast thumb files and populate the 4 NULL rows.

Tooling: Python urllib commit POST tripped a 403 egress filter false-positive ("Host resolves to a private/reserved IP"); curl with identical body succeeded first try. Swapped to curl for the commit step. Single observation, no rule earned, watch for repeat.

**PM-190 (21 May 2026, this commit).** Connect carousel imagery wired via DB-driven content surface. Three-part ship: (1) Supabase migration `add_image_url_to_service_catalogue` — `service_catalogue.image_url TEXT` nullable, no default, with column comment documenting NULL → gradient placeholder behaviour. (2) Backfill 16 rows (8 live_session + 8 replay) by category mapping: 6 of 8 categories pointed at existing `/thumb-*.jpg` files at vyve-site root (Yoga / Mindfulness / Workouts / Weekly Check-In / Group Therapy / Events & Run Club); Education + Podcast categories stay NULL until asset files land. (3) vyve-site commit `b92b4971741cd4a281e53e8ec84b76ad02c76266` (3 files: `connect.html`, `sw.js`, `index.html`) — `scroll-card-thumb` CSS gains absolute-positioned `img` covering the gradient and a bottom-darkening overlay for text legibility; `renderLiveThisWeek` and `renderLatestFromVyve` emit the img+overlay block only when `r.image_url` is non-null, fall back to bare gradient when null. `onerror` handler removes both img and overlay on 404 — degrades silently to gradient rather than broken-image icon. SW cache `vyve-cache-v2026-05-21-pm189-connect-polish-a` → `vyve-cache-v2026-05-21-pm189-connect-thumbs-a`. vbb-marker Update 60 → 61.

**No db.js or sync.js changes needed.** Dexie schema string indexes only `id, type, category, active` — non-indexed columns (`image_url`, `name`, `description`, etc.) flow through `select=*` automatically. The new column is transparent to the local store.

**One new §23 hard rule earned: §23.49 (catalogue imagery is DB-driven, nullable, with onerror fallback).** Codifies the contract: any catalogue surface with thumbnail imagery drives the URL from a nullable DB column on the row, never hardcoded in HTML/JS. Render path always emits the placeholder div; img is appended only when column is non-null. Backfill on column add — never invent paths hoping files appear later. Sessions.html still uses its hardcoded array; the §23.49 pattern lays groundwork for the future sessions.html migration paired with the Command Centre session editor campaign (parked in backlog post-PM-188). §23.49 also governs the future Command Centre editor — it writes against an already-shaped column rather than negotiating one at editor build time.

**Composio creds still dead** from this morning's security incident. §23.45 PAT-direct path exercised end-to-end again (4th time this session). Pre-commit HEAD re-check confirmed `902278e8` unchanged before commit; post-commit first-100-char verification passed on all 3 files pinned to the new commit SHA per §23.41.

Production iOS 1.3 (2) + Android 1.0.3 (10) bundled-mode at SHA `83874dd5` — unchanged. Dean's dev iPhone picks up Update 61 on next WKWebView cache cycle (2-15 min). Bundled members frozen at `83874dd5` until next Capawesome OTA. Brain HEAD before this commit: `b5fe7211`. vyve-site HEAD before this commit: `902278e8`. New vyve-site HEAD: `b92b4971`.

**PM-189 ship (21 May 2026).** Connect cluster visual polish shipped as atomic vyve-site commit `902278e8141f32144fa1447d86c35f325666ba7c` — 4 files, 5 audit deltas executed (focus chip inline, heart-count prominence in card header, hub copy collapsed into single motivating line, context-aware empty-state with 4 variants, card typography pass). Avatars parked under post-launch profile-identity campaign per Dean's polish-first / identity-second ordering. No new §23 rule earned at the ship — visual polish, no new architectural doctrine. Earlier this PM in PM-189 audit (separate brain-only commit `9f686afe`): Connect mockup vs live build audit identified 6 deltas; profile identity system spec locked as backlog item. PM-190 took one of the remaining gaps (Live This Week / Latest from VYVE empty thumbs) and shipped it as a content-ops campaign rather than a polish line item.

**PM-188 (21 May 2026).** Connect Phase 2 CLOSED across 7 build-queue items shipped PM-186 → PM-188. Final commit `0622db8e0d3622dccdabe81f8628e2f847af591a` applied §23.48 patterns 3+4 to sessions.html + leaderboard.html via surgical patches. Earlier in PM-188: bottom nav Sessions slot became Connect, Connect sub-pages stripped duplicate topbar, Live Sessions moved to More menu (commit `b9d625381080a880e707166b3f3fefe9260b3ef8`); sessions back-button + light-mode audit (commit `74bffac41df72347fe152b9c8a06db04e243b3d6`). One new §23 hard rule earned: §23.48 (Connect freshness model — four patterns for member-data surfaces, codified after step 7 design discussion).

**PM-187 (21 May 2026).** Connect Phase 2 underway. Two vyve-site commits shipped — `597851534a9c83296c95f57ba789a6bf5e54268e` (db.js SCHEMA_V8 with 5 new stores + sync.js PULLABLE wiring + connect.html NEW + sw.js cache bump + index.html vbb-marker) and `a7123667d2c13c003b314b23e5022b099919d5ef` (§23.46 hygiene follow-up: prompt fallback markup replaced "Loading…" skeleton with real fallback question). connect.html hub mirrors mind.html shape with §23.46-compliant paint — counters default 0, no skeleton chars, no localStorage snapshot. Steps 1+2 of the Phase 2 build queue SHIPPED; step 3 (connect-checkin.html) is next. One new §23 hard rule earned: §23.47 (specs cross-checked against live schema before lock — caught service_catalogue `kind`/`is_live`/`published_at` drift between PM-186 spec language and live `type`/`active`/`created_at` columns). Composio creds remain dead from the morning's security incident; §23.45 PAT-direct path exercised end-to-end including two Git Data API multi-file commits.

**Current campaign:** Bundle-Ready (locked PM-184). Six phases serving one goal: ship a bundled iOS + Android app members can use offline. Reference: `playbooks/bundle-ready-campaign.md`.

**Current phase:** Phase 0 (Mind v1) SHIPPED 20 May 2026 across PM-173 through PM-183 — all six user-visible pages (breathwork, journal, affirmations, meditation, sleep, visualisation) plus the mind.html hub real-wired against the §23.39 optimistic-first skeleton. Production iOS 1.3 (2) + Android 1.0.3 (10) bundled-mode at vyve-site SHA `83874dd5` (frozen since 15 May per PM-115/116). Main HEAD at vyve-site is `f44c7104` (PM-183 mind.html hub) — does not reach members until the next OTA bundle ships via Capawesome (production channel `89e12796-aa41-4176-8d78-bc2ef6dfd5c2`). Dean's dev iPhone via `server.url` dev-loop sees main HEAD immediately, subject to §23.29 WKWebView cache.

**Current phase: Phase 2 — Connect section build (in flight, PM-187).** Steps 1+2 of 7-item queue SHIPPED (db.js + sync.js wiring; connect.html hub). Step 3 next: connect-checkin.html — single-purpose write surface, 60-char body cap, 5 focus chips (Move/Mind/Fuel/Rest/Growth), §23.39 optimistic-first write to `connect_checkins`, already-posted-today guard redirects to read-only view. Subsequent steps: connect-feed.html (Workplace/Elite/Following tabs, reaction toggle pattern), connect-challenge.html (read-only community + personal progress), 2 Edge Functions (`connect-challenge-summary` + `connect-feed-counts`, both `verify_jwt: true`, 60s `_kv` cache), sub-page audit on sessions.html + leaderboard.html. Estimated 3-5 sessions remaining.

**Phase 1 — Body section consolidation deferred to after Phase 2 closes.** Body hub is `exercise.html` (existing, drift-corrected PM-186), not `body.html`. Decide `body_activities` table shape (mirror of mind_activities — `kind` discriminator across workouts/cardio/movement, `client_id` idempotency — vs view-over-existing-tables), apply mind.html shape inside exercise.html, audit sub-pages (workouts.html, cardio.html, movement.html). 2-3 sessions estimated.

**Phases after Phase 1.** Phase 2 — Connect section build (connect.html NEW, unifies leaderboard + sessions + charity impact). Phase 3 — Pillar realignment (Home / Engagement / Weekly check-in / Monthly check-in / Certificates all reframe around Mind / Body / Connect; certificates re-pillar pulled in from deferred-post-launch). Phase 4 — Offline-correctness sweep (PRE-BUNDLE GATE; new playbook `playbooks/offline-correctness-audit.md`). Phase 5 — Bundle and OTA (three tasks from PM-178 already queued in backlog). Phase 6 — external-blocker items (HAVEN sign-off, copy reviews, Brevo logo, etc).

**Formal PF-40 closure at this commit.** Original 12-sub-item scope (PM-106) was the wrong scaffolding (PM-111 device walk diagnosed real bug as cache-writer/template shape mismatch, not structural). Mind section v1 (PM-173–183) demonstrated the §23.39 optimistic-first skeleton organically replacing PF-40.4. Post-launch sub-items PF-40.3 through PF-40.12 closed as superseded; functionality re-absorbed into Bundle-Ready phases.

**Drift corrections at this commit.** §19 was 23 stacked "current status" entries — collapsed to this single fresh entry. §21 (outstanding build items) was framed around polish + Achievements Phase 3 + In-App Tour from before Mind section existed — rewritten this commit to mirror active.md §5. Active.md §2 is the live handoff surface (refreshed every session-end); §19 here is the campaign-level snapshot (refreshed on phase transitions and full rewrites).

**No new §23 hard rule earned this commit.** PM-184 is a planning artefact, not new architectural doctrine. Live doctrine: §23.39 (optimistic-first), §23.41 (parallel-session safety), §23.42 (bundled-native production-reach), §23.7.x cluster (Dexie wiring), §23.10 (offline-equivalent operation as contract).

### Future-vision — community scale mechanics and internal dogfooding (added 22 May 2026, PM-200 conversation)

Two threads from the PM-200 design conversation are parked as future-vision, not as build items. Documented here so future Claudes and any new founding-team member can pick the context up cleanly when the time comes.

**Internal dogfooding as cultural norm.** Every VYVE founding-team member (Lewis, Dean, Alan, Calum, Phil, Vicki, Cole) is expected to use VYVE as a member — check-ins, habits, sessions, Mind, Connect, the full surface. Their accounts appear on the leaderboard, in the Connect feed, in workplace scope, identical to any member. **No role flag, no "team account" filter, no exclusion mechanic.** The product VYVE sells is the product VYVE uses. Dean's framing during PM-200: "I would like to think that all of the guys that are on our app actually use this." Reframes the empty-feed problem entirely — the right fix isn't seed accounts or fictional users, it's leadership commitment to live inside the product. **Tactical implication for trial:** team check-in cadence drives feed density without any engineering work. At 15-20 trial members, 7 team members checking in daily doubles the active cohort.

**Distinct from this — separate "Content vs Check-in" distinction (also future-vision).** If VYVE later wants "official voices" — Phil sharing a clinical reflection, Calum sharing a workout reference, Cole publishing a community update — that's a Content surface, not a member-vs-team distinction. Members and team continue posting check-ins on equal footing; official content lives in a separate piped surface. Not built. Not specced. Worth noting now so we don't accidentally conflate the two when one of them comes up later.

**Community scale mechanics — five candidates, all deferred to post-trial empirical data.** When active member count grows past organic-feed thresholds, the following mechanics become worth considering. None are MVP. None block launch. Build threshold listed beside each — design decisions deferred until live data justifies one of them:

- **For You curated feed.** Algorithmic mix replacing linear "everyone today" feed: members you've reacted to before + workplace + same-prompt-as-you + recency-weighted. Default 8-12 cards on first paint, infinite scroll. Build threshold: >100 daily posts.
- **Hidden reaction counts below threshold of 3.** Show emoji icons, hide numeric count until ≥3 reactions. Removes the "0 reactions" sting that punishes vulnerability. Pattern lifted from BeReal + recent Instagram experiments. Does not affect leaderboard scoring (different surface, different mechanic). **Brand decision, not just UX** — touches "evidence over assumption" company value, needs Lewis weigh-in before build. Build threshold: >50 active members.
- **Guaranteed first reaction sweep.** Cron sweep (every 4h) checks `connect_checkins` for rows >4h old with 0 reactions; ensures at least one supportive reaction lands via a house account (Cole / Phil / "VYVE Community"). Members never see "0 reactions". Build threshold: >50 daily posts.
- **Impression tracking + "Seen by N" surfacing.** New table `checkin_impressions(checkin_id, member_email, seen_at)` writes on render. Surface impressions on own check-in card ("Seen by 14 of your community") so posters feel seen even without reactions. Pattern from Substack. Schema cheap to add now; surfacing deferred. Build threshold: >50 active members. **Worth adding the schema soon to avoid retrofit cost.**
- **Reaction-asymmetry detection.** Algorithmic promotion of low-impression-low-reaction posts on next render. Inverts the social-media default (popularity attracts popularity). Build threshold: probably 100+ active members.

The mechanics above compound — they're not mutually exclusive. Order of likely build: dogfooding norm (no engineering) → hidden-count-below-3 (one EF flag) → impression schema (one table) → For You feed (full algo) → asymmetry promotion.

---

### Completed — Dean (technical) — recent

- **Mind section v1 user-visible** (20 May 2026, PM-173 → PM-183). Six pages + hub all real-wired. YouTube embed bridge for meditation/sleep/visualisation pending ElevenLabs/Calum real audio.
- **Bundled-mode migration + Capawesome OTA pipeline** (15 May 2026, PM-115/116). iOS 1.3 (2) + Android 1.0.3 (10) live. Capawesome 14-day trial expires 28 May; default keep at £15/mo Starter.
- **iOS 1.2 + Android 1.0.2** Capacitor builds, HealthKit autotick, native push notifications session 1, achievement-earned-push EF.
- **Local-first migration** PF-1 through PF-15 + PF-30 SHIPPED to main. Dexie schema, hydrate-on-login, shadow outbound queue, delta-pull, optimistic-first writes, perf telemetry redirect to PostHog.
- **Achievements system Phase 1** (27 April 2026). 32 metrics × 327 tiers + inline evaluator + trophy-cabinet UI. Trial-safe placeholders; major overhaul post-trial.
- **35 → 88 Supabase tables** + 15+ core Edge Functions + GDPR Article 15/17 pipelines + admin console.
- **Supabase Auth v2.2** + Auth0 removal + all pages gated.

### Completed — Lewis (commercial)

- 24 custom Claude AI skills operational + 8+ automated recurring workflows.
- Sales Intelligence infrastructure, Public Sector Sales Playbook, Three Pillar Assessment, VYVE Brand Brain (16 sections), Member Welcome Pack, Research Library + Stat Bank.
- Competitive intelligence tracking (20+ competitors).
- 60+ podcast episodes catalogued; The Everyman → The VYVE Podcast rebrand pending.

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

**TOP PRIORITY: Bundle-Ready Campaign, Phase 1 (Body section consolidation).** See `playbooks/bundle-ready-campaign.md` for full phase breakdown. Active backlog top: `brain/active.md` §5 + `tasks/backlog.md` top.

### Critical missing pieces (Bundle-Ready phases)

**Phase 1 — Body section consolidation (NEXT, 2-3 sessions):**
- Decide `body_activities` table shape (table vs view; default = table).
- Migration + body.html hub build.
- Sub-page audit (workouts/cardio/movement/exercise).

**Phase 2 — Connect section build:** SHIPPED 21 May 2026 (PM-186 → PM-188).
- connect.html hub + connect-checkin.html + connect-feed.html + connect-challenge.html LIVE on main.
- Two Edge Functions deployed v1 ACTIVE (`connect-challenge-summary`, `connect-feed-counts`) with 60s `_kv` cache lifecycle.
- Bottom nav slot 4 swapped Sessions → Connect (Live Sessions accessible via More menu).
- Sub-page audit on sessions.html + leaderboard.html applied §23.48 patterns 3+4.
- New §23 hard rule earned: §23.48 (Connect freshness model — four patterns). Master.md §23.48 has full doctrine.
- Production reach gated on next OTA per §23.42.

**Phase 3 — Pillar realignment (3-4 sessions, heaviest phase):**
- Home page rewrite — pillar tiles replace certificate-track cards.
- Engagement page Variety component reframes per-pillar.
- Weekly + Monthly check-in rewrites — activity summary rolls up Mind/Body/Connect; AI prompt updated.
- Certificates re-pillar — three pillar certificates replace five activity certificates.

**Phase 4 — Offline-correctness sweep (PRE-BUNDLE GATE, 2-3 sessions):**
- Schema audit (`updated_at` + trigger on every member-data + catalogue table).
- Idempotency audit (`client_id` UUID on every write surface).
- Airplane-mode device walk + cold-start-no-network UX + fan-out-on-focus + `_sync_queue` drain hardening.

**Phase 5 — Bundle and OTA (1 session):**
- Port PM-178 hotfix to main.
- Sweep main for unship-ready work.
- First-ever Capawesome OTA push (consider `--rollout 0.1`).

### Phase 6 — External blockers (off critical path)

- HAVEN clinical sign-off (Phil).
- Weekly check-in nudge copy split (Phil + Lewis).
- PF-13 hydration COPY_TABLE finalisation (Dean writes, Lewis spot-check). 23 entries tagged `COPY_DEAN_FINAL`.
- Brevo logo removal (~$12/month, Lewis).
- Facebook Make connection refresh — **expires 22 May 2026, URGENT** (Lewis).
- Public launch comms draft (Lewis).
- B2B volume tier definition (Lewis + Dean).
- Mind v1 Lewis copy review on affirmations/journal/breathwork seed content.

### What drops off entirely (confirmed PM-184)

- Layer 6 SPA shell (dropped).
- PM-71 / PM-71b dashboard payload trim (obsolete post-bundle).
- PM-72 materialise achievement_progress (obsolete post-bundle).
- §23.5.1 backend EF perf campaign for home payload (obsolete post-bundle — Dexie-first paint renders <200ms regardless of EF latency).
- PWA install prompt code in index.html (Phase 1 removal).
- In-App Tour PF-23 (V2, blocked on Lewis copy, post-launch).
- Achievements system major overhaul (post-trial, post-launch).

### Post-launch backlog (do not work on before 31 May)

- Achievements system overhaul (PM-94) — post-trial, 2-3 sessions as own campaign.
- Realtime cross-device sync (PF-5b) — pattern 3 from PM-184 strategy discussion. Pattern 1+2 (cold-start fan-out + fan-out-on-focus) covers ~95% of real-world cases.
- Apple Health page redesign.
- `auth_blocked` banner in member UI.
- HealthKit background sync (~400 LOC Swift plugin, 4-5 sessions, 1 week soak).
- Health Connect (Android) — parked until Dean has Pixel/Galaxy device.
- The Fore grant register June/July 2026.
- WHISPA research partnership monitor.

### Backlog — security & hygiene

- Edge Functions deletion pass — one-shot patchers + debug EFs accumulate; ~32 active candidates.
- Anon-key rotation (admin console).
- Brain hygiene: base64-encoded historical blob in `brain/changelog.md` (~152K decoded chars) — cleanup pending.
- Changelog archive — split pre-17 April entries into `changelog-archive/2026-Q1.md`. Current changelog is 1.5MB and growing.
- GDPR cron static-PSK exposure (accepted risk, rotate if Sage diligence surfaces).
- APNs key rotation (accepted risk, blocked on Apple 2-keys-per-team cap).

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
- **Home page redesign shape (PM-73, 12 May 2026 PM)** — v2 mockup at `playbooks/home-redesign-v2-mockup.html` is Dean's working preference ("kind of likes this"). Parked behind premium-feel polish pass. (The Mind/Body/Connect nav re-architecture this line previously waited on is now substantially shipped — Body rename PM-154, Mind tab + 7 Mind pages PM-158/159.) When this comes back, the EF trim (PM-71 re-scope to delete home payload fields, move detail to `/stats` via a new `member-stats` EF) is in-scope alongside the UI build. Daily goals canonical shape locked: "Watch 1 session" / "Log daily habits" / "Log one form of exercise".
- **Goal & certificate re-pillaring (PM-159)** — with the BODY/Mind/Connect nav direction now partly shipped, the per-activity goal targets and certificate tracks (Habits/Workouts/Cardio) no longer map cleanly onto the section model. Moving goals + cert tracks onto the BODY/Mind/Connect pillars is **deferred to post-launch**. Revisit alongside the home-redesign EF trim.
- **`mind_sessions` schema (PM-159)** — the Mind data table (dedicated table, `activity_type` discriminator, never `daily_habits`) is decided but **not yet created**. Schema is intentionally deferred until breathwork's real fields exist, so the schema is derived from the first real Mind feature rather than guessed. Breathwork build is the trigger.
- **Body section hub is `exercise.html` (PM-186 drift correction)** — earlier §19 / Phase 1 backlog framing implied a new `body.html`. Dean's intent confirmed PM-186: the Body section hub is the existing `exercise.html` shell. Phase 1 work is consolidation under that shell (workouts / cardio / movement as streams already wired), apply mind.html visual idiom (Today's focus + Day streak + Today's progress), and the `body_activities` table decision (mirror of `mind_activities`, `kind` discriminator across workouts/cardio/movement, table not view per recent pattern). No file rename.

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



### §23.7.9 — Optimistic INSERT rows must be FAT for denormalised stores (PM-153, 16 May 2026)

**Surfaced PM-153.** PM-151's `saveHabits` add path wrote optimistic `member_habits` rows to Dexie carrying only the FK/scalar columns — `id, member_email, habit_id, assigned_at, assigned_by, active` — and none of the denormalised `habit_library` join columns (`habit_pot/habit_title/habit_description/habit_prompt/difficulty`). The Dexie `member_habits` store is FAT by design (the hydrate's `replaceForMember` writes the join columns so pages can render without a server round trip). habits.html's render path then `.filter()`s every row on `habit_title` — the PM-110 undefined-card guard. Result: the optimistically-inserted habit landed in Dexie titleless and was **silently dropped from the render**. The row existed; it just had no title, so the guard ate it.

**Rule.** An optimistic write that INSERTS a new row into a denormalised/fat Dexie table MUST populate the denormalised columns, not just the scalar/FK columns. Thin optimistic inserts are invisible to any reader that guards on a denormalised field. Where the writing page already holds the source data (settings.html holds `_habitLibrary`), join against it to build the fat row. Where it does not, either fetch the joined shape first or do not claim the write is optimistically complete.

**Distinct from §23.7.5.** §23.7.5 covers partial-*upsert* corruption of an *existing* fat row (default `.put()` replacing and dropping columns) — fixed there by a merge override. §23.7.9 covers the *insert* case: there is no existing row to merge with, so a merge override cannot save it; the inserted row must be born fat. Both are "the write looks right but the reader can't use it" — §23.7.5 on update, §23.7.9 on insert.

**Two-shape discipline.** The fix pattern is two row arrays from one source: a THIN array for the PostgREST write (Postgres has the real joined table; it must not receive denormalised copies) and a FAT array for the Dexie write. PM-153's `saveHabits` ships exactly this — `_supaAddRows` (thin) and `_dexieAddRows` (fat). Do not send the fat shape to Postgres and do not write the thin shape to Dexie.

**Audit signal:** any `VYVELocalDB.<table>.bulkUpsert(` / `.upsert(` whose row literal is an INSERT (no pre-existing row) — check the column set against what the table's hydrate `replaceForMember` writes and against what reader pages `.filter()` on. If the insert omits a column a reader guards on, the row will be invisible.

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

## §23.26 — PLACEHOLDER GUARD: never build an MCP tool call with literal placeholder strings as fields meant to carry real content.

**Surfaced PM-122 (15 May 2026), at non-trivial cost.** First multi-execute commit shipped a `GITHUB_COMMIT_MULTIPLE_FILES` call where the `upserts[0].content` field was the literal string `<PLACEHOLDER_EXERCISE>` — built as a "template I'll populate" but fired without populating. Production exercise.html on vyve-site main was 22 bytes of `<PLACEHOLDER_EXERCISE>` for ~90 seconds (commit `21b603be`) before the corrective ship `6911b55a` restored real content + landed the other 9 files atomically.

**Why this slipped past every other §23 discipline:**

The PM-86.1 / PM-87 §23 base64-corruption rules guard the *encoding* of content (don't pre-base64; let the tool encode UTF-8). They don't guard the *origin* of content (is this string actually the file body, or is it scaffolding text?). `node --check` ran clean against the patched file in the workbench — but the call to `COMPOSIO_MULTI_EXECUTE_TOOL` was constructed by hand in the JSON args, and the placeholder was a separate string that never got swapped for the real `patched["exercise.html"]` value. Post-commit byte-equal verify would have caught it — but on a single-file commit there's no other file to compare against to surface the asymmetry, and ship discipline was "ship-then-verify" not "verify-then-ship".

**The rule:**

1. When constructing any tool call whose fields carry file content (or any data the user-visible system will treat as canonical), every such field MUST be populated with a runtime-resolved variable before the tool call object is built. Never `"content": "<PLACEHOLDER>"` then "I'll fill it in".
2. Multi-execute MCP calls are not draftable in-place. Build the entire payload to a variable (`upserts = [...]` in workbench Python), assert content length and a head-sample against the patched file dict, THEN pass it to the tool.
3. Pre-flight assertion before invoking any commit tool: for every upsert, `assert u["content"] is patched[u["path"]] and len(u["content"]) > 100` (or whatever sane floor). If the assertion fires, refuse to ship.
4. If for any reason a single-file commit must ship (avoidable in almost every PM-prefixed scenario — coalesce into the next multi-file commit instead), do post-commit verify by base64-decoding the new blob via Contents API at the new commit SHA and asserting byte-equal against the local file string. Single-file commits MUST verify by content, not just blob SHA presence.
5. The workbench `run_composio_tool` path is preferred for any commit touching >50KB files (per existing §23) AND for any commit where the upserts array has more than 2 entries — the workbench JSON-load discipline is harder to slip a placeholder through than building the tool args inline.

**Recovery posture if this rule is breached again:**

- Don't revert. Immediately re-fetch the broken file's NEW SHA (which now points to the corrupted blob), then ship a corrective multi-file commit that includes the broken file with REAL content + any other files you were trying to ship. Sequence: re-fetch broken-file SHA → build correct upserts dict → workbench commit → byte-equal verify. The corrupt content lives in the immediate parent commit (so any subscriber on the wire during that window saw it), but the timeline closes within seconds rather than minutes.
- Promote a brain commit hygiene entry in active.md §2 acknowledging the breach. The corrective ship without the brain-side acknowledgment leaves the §23 rule un-strengthened and the lesson un-anchored.

**Test for whether the rule applies in a given session:** any time you find yourself writing `"content": "<...>"` or `"content": "PLACEHOLDER"` or similar in a tool-call JSON args block — STOP. The right path is `"content": patched[path]` where `patched` is the dict you've populated upstream. There is no scenario where placeholder content is correct.


**§23.27 — Never `await` criticalHydrate (or any network pull) on a first-paint path.** Surfaced PM-124–131. `criticalHydrate` is a per-page NETWORK pull; awaiting it anywhere a paint or a UI state-change depends on means the page/button waits on a network round-trip. Pattern: `try { VYVESync.criticalHydrate('x').catch(function(){}); } catch (_) {}` — fire-and-forget, never `await`. This applies inside helper functions too: PM-131 traced a residual 1s logging pause to `fetchHistory()` awaiting criticalHydrate internally, while `logCardio` awaited `fetchHistory`. Audit transitively, not just the top-level call site.

**§23.28 — A page is not local-first unless it loads db.js + sync.js + firstPaintHydrate.js.** Surfaced PM-133. movement.html contained fully correct, API-current Dexie code (`workout_plan_cache.allFor`, `.upsert`, `criticalHydrate`) that was 100% dead because the three scripts that define `window.VYVELocalDB` / `window.VYVESync` were never in the page's `<script src>` chain — every `if (window.VYVELocalDB && ...)` guard silently evaluated false, and the page ran permanently network-bound. When adding or auditing a local-first page, verify the script chain FIRST (db.js → sync.js → firstPaintHydrate.js, after bus.js, before vyve-home-state.js — see cardio.html as the reference chain), before trusting that any Dexie branch executes. A Dexie code audit that doesn't check script-tag presence is invalid.

**§23.29 — The `server.url` dev-loop build has a caching layer; do not assume reloads are live.** Surfaced PM-128–133, repeatedly re-confirmed PM-142–147. The app is a `server.url` live-site wrapper — `capacitor.config.json` points `server.url` → `online.vyvehealth.co.uk`, no Capawesome plugin block — so every vyve-site commit IS live on the next page load (no OTA, no resubmit for portal changes). BUT a caching layer (WKWebView HTTP cache — not a service worker; the banner `sw` field reads `no-sw`) holds the bundle for a variable 2-15min after a push. Updates take several cold reopens to land; the build banner shows a stale "Update N" until the cache expires. Cross-check against `online.vyvehealth.co.uk` in mobile Safari (separate HTTP cache) to confirm a deploy is live independent of the app. The build banner ("Update N") is the only reliable on-device confirmation. Identifying/busting this cache layer is open as PM-137 — it is the dev-loop's real bottleneck.

**§23.30 — Inline (non-`defer`) scripts must not call code that depends on `defer`-loaded scripts; gate on `DOMContentLoaded`.** Root cause of PM-146. engagement.html's main `<script>` block is inline, so it executes during HTML parsing — BEFORE any `<script defer>` runs (deferred scripts execute only after parsing completes, per HTML spec). It called `loadPage()` bare; `loadPage`'s Dexie-first block referenced `window.VYVELocalDB` / `VYVESync` / `VYVEHomeStateLocal`, all defined by `defer`'d scripts that had not executed yet — every guard evaluated false, the whole local-first path silently no-op'd, every load fell to the network. This is the §23.28 movement bug's sibling: there the scripts were absent; here they were present but not yet executed. Fix pattern: wrap the call — `if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true}); else start();`. index.html was immune only because its loader was already gated on the `vyveAuthReady` event (post-parse). When wiring any page's entry point, confirm it does not run before its `defer` dependencies.

**§23.31 — Dexie-derived counts must apply the same caps the server enforces.** Surfaced PM-147. Supabase caps workouts/cardio at 2/day via a BEFORE INSERT trigger (over-cap rows route to `activity_dedupe`, not discarded). Dexie stores every optimistic write uncapped — correct, it mirrors the real tables — but any count computed FROM Dexie must re-apply the cap or it diverges from the server (a glitched multi-fire inflated engagement's totals). `home-state-local.js` `cappedDailyCount` (Σ days `min(2,n)`, grouped by `activity_date`) is the canonical helper; use it for every workout/cardio/session total. The cap is a counting rule, not a storage rule. When adding a Dexie-derived metric, check whether the server applies a cap/dedupe to the same data and mirror it.

**§23.32 — `VYVEData.writeQueued` awaits the network internally; it is not a fire-and-forget queue. Never `await` it on a paint/interaction path.** Surfaced PM-148. Despite the name and the "outbox-queued" comments, `writeQueued` (vyve-offline.js) does `await fetch(...)` synchronously in its body and only resolves once the server responds; it falls back to the localStorage outbox queue ONLY on 5xx or network-failure. A slow-but-eventually-successful response is the worst case — it never queues, it blocks for the full round-trip. `completeWorkout` did `await VYVEData.writeQueued(...)` three times in series on the visible button path → "Saving..." frozen 75s+ when the backend was slow, and the downstream `optimisticPatch` + bus publish never fired until the POST returned (stale home score). This is the write-path sibling of §23.27 (never await criticalHydrate on a paint path): the rule generalises to *any* await whose callee touches the network, regardless of how "queue"-like its name is. Correct pattern (cardio.html `logCardio`, the reference): Dexie write + optimistic patch + bus publish + UI update first, all synchronous/local; then a raw un-awaited `fetch` in a background `(async function(){...})()` closure for the network. Do not `await writeQueued` from any handler that owns a button or a paint. If offline-retry durability is needed, the un-awaited fetch can still enqueue on failure — but the caller must not block on it.

**§23.32 extension (PM-148b).** A second PM-148 lesson: `node --check` on a single file does NOT catch cross-file collisions. workouts.html loads `workouts-config.js`, `workouts-programme.js`, `workouts-session.js`, and four more `workouts-*.js` as classic deferred `<script>`s — they ALL share one global scope. PM-148 added a top-level `function ordinalSuffix()` to workouts-session.js; `ordinalSuffix` was already declared in workouts-config.js → `SyntaxError: Identifier already declared` → workouts-session.js failed to parse → Exercise page dead. The faulty premise was a single-file grep (1 hit, concluded 'undefined'). RULE: before adding any top-level declaration (function/const/let/var) to a file that shares global scope with siblings, grep the identifier across ALL sibling files in that scope group, not just the target file. The `workouts-*.js` set is the canonical shared-scope group; treat any multi-`<script>` page the same way. A single-file grep returning one hit means 'one hit in this file' — never 'undefined in scope'.

**§23.33 — `execute_sql` / `select 1` proves only the management-API→Postgres path; it does NOT prove the public API gateway.** Surfaced PM-149. During the login outage, after the no-op `platform-alert` deploy, `select 1` succeeded and was reported as "Postgres is back / outage resolved." It was not. `execute_sql` (Supabase MCP) reaches Postgres via the **management API** — a separate path from the public `*.supabase.co` API gateway that the portal, the app, and GoTrue actually use. The public gateway was still 522-ing on every `/auth/v1/token` and `/rest/v1/*` call; this was only caught when the `api` service log was finally pulled. RULE: during any outage, a healthy `select 1` is necessary but NOT sufficient — it clears the DB layer only. Before declaring recovery, verify the layer the user's client actually hits: pull `get_logs(service='api')` and confirm recent real-client requests return 2xx (not 522/504). A 522 is a Cloudflare-edge code (origin handshake never completed) — it means the fault is at the edge/gateway, upstream of Postgres, and is NOT fixable from SQL or a function deploy; it needs a project restart or Supabase support. Match the verification path to the failing path.

### §23.34 — a counting cap must not be implemented as a storage-destroying trigger; never duplicate a magic threshold across triggers (PM-150, 16 May 2026)

**Surfaced PM-150.** The `session_views` 2/day cap was enforced by a BEFORE INSERT trigger that *rerouted* over-cap rows into `activity_dedupe` and `RETURN NULL`'d — PostgREST still returned 201, so the row loss was invisible to the client, the API log, and tracking.js. A cap that is conceptually a *counting rule* ("only N count toward X") was implemented as a *storage rule* ("only N rows may exist"), which silently destroyed every other signal those rows carried (goal progress, minutes-watched, future analytics).

**Rule part 1 — counting caps live in the counting layer.** If a limit is "only N count toward a score/certificate/milestone," enforce it where the count is *read* (`LEAST(count, N)` in the aggregating query/trigger), never by blocking or rerouting the INSERT. Storage stores the truth; readers apply caps. The only legitimate storage-side guard is genuine deduplication (a true unique constraint), not a quota.

**Rule part 2 — never duplicate a magic threshold across triggers.** PM-150 found the number `2` hardcoded into four triggers (`cap_session_views`, `cap_replay_views`, `charity_count_*`, `counter_sessions`, `update_cert_sessions_count`) with three *different* counting rules (cross-table sum, per-table sibling count, per-day LEAST). They had silently diverged. When a threshold governs multiple triggers, it must come from one source (a config row, or one canonical function the others call) — or, failing that, every copy must be audited together whenever one changes.

**Rule part 3 — one writer per denormalised counter column.** `cert_sessions_count` was written by both `counter_sessions` and `update_cert_sessions_count`. Two triggers writing the same column will diverge. A denormalised aggregate column has exactly one writer.

**Audit signal:** any BEFORE INSERT trigger that `RETURN NULL`s or redirects rows is suspect — grep for `RETURN NULL` in trigger functions and confirm each is genuine dedup, not a quota. Any integer literal appearing in more than one trigger function on related tables is a divergence risk.

### §23.35 — Converting mockup HTML into a portal page: diff against a known-good portal page across the FULL checklist, not just the presenting symptom.

**Earned PM-159→165.** The seven Mind pages were converted from ChatGPT mockups. PM-159 fixed the *visible* defect (a leftover hardcoded `<nav class="bnav">`) and wired scripts to make the page function — but did not audit the rest of the page against a reference. That left three more defects that surfaced one at a time over five follow-up commits: no `/theme.css` link (flat uncoloured nav — PM-160), an inline `:root` shadowing theme.css (broken light mode — PM-163), hardcoded dark colour literals (PM-164), and a deferred-and-late theme.js + hardcoded `data-theme="dark"` (theme-init divergence — PM-165). One job became six.

**Rule:** when converting mockup/external HTML into a VYVE portal page, before declaring it done, diff it against a known-good portal page (e.g. `exercise.html` or `habits.html`) across the **full** checklist — do not stop at the symptom that prompted the work:
- **Scripts:** theme.js (synchronous, first in `<head>`, before theme.css), auth.js, nav.js, sw.js registration, plus the local-first chain if the page is data-bound.
- **Stylesheet:** links `/theme.css`. No inline `:root` (it shadows theme.css — the inline `<style>` loads later and wins the cascade). No hardcoded dark colour literals (`rgba(13,43,43,*)`, `rgba(0,0,0,*)`) in component rules — use `var(--bg)`/`var(--surface)`/tokens.
- **`<html>` tag:** bare `<html lang="en">`. Never hardcode `data-theme` — theme.js owns it; a hardcoded value masks a flash-of-wrong-theme.
- **Both themes:** actually verify light AND dark, not just the default.
- **sw.js:** page added to `urlsToCache`.
- **nav.js:** page recognised by `getActiveTab()` / has the right `subPageLabels` entry.

The cost asymmetry is the point: a 5-minute parity diff at conversion time versus six separate commits, six cache-busts, six device-checks, and a visibly half-finished section in between.

## §23.36 — client_id / row id must always be a valid UUID (PM-167, 17 May 2026)

`client_id` (and the Dexie row `id`) on activity tables — `cardio`, `workouts`, etc. — are Postgres `uuid` columns. Any client-side generator MUST produce a valid UUID. The pattern `'c-' + Date.now() + '-' + Math.random()...` is **forbidden** — it is not a uuid and Postgres rejects the insert (`invalid input syntax for type uuid`), 4xx'ing the POST and reverting the optimistic row (logged-then-vanished). A `null` fallback is equally wrong — the row inserts but a null-keyed Dexie upsert cannot be read back. The required fallback when `VYVEData.newClientId()` is unavailable is `crypto.randomUUID()` (with a manual uuid v4 as last resort). Audit signal: ripgrep `'c-' +` and `: null` near `ClientId` across vyve-site.

## §23.37 — the activity cap is a credit calculation, never a write gate (PM-166, 17 May 2026)

The 2/day (and per-period) activity cap exists ONLY for credits — certificates, the charity mechanic, the engagement score. Raw activity tables (`cardio`, `workouts`, `daily_habits`, ...) MUST store every logged activity uncapped: 100 sessions in a day = 100 rows, all visible in history and weekly/monthly totals. `BEFORE INSERT` triggers that divert over-cap rows to `activity_dedupe` and return NULL are **forbidden** — they destroy member data. `enforce_cap_cardio` / `enforce_cap_workouts` were dropped 17 May for exactly this. The correct shape is the `update_cert_sessions_count` pattern: a stateless recompute that reads the raw table and applies `LEAST(daily_count, cap)` when computing the credit. The increment-style counters still need converting to this recompute pattern — P0, see backlog.


## §23.38 — a cold-load list paint must read from a persistent (localStorage) cache, not Dexie alone (PM-170, 17 May 2026)

A list surface that paints on page open MUST have a `localStorage` snapshot to paint from synchronously — Dexie alone is not enough. Dexie is empty on a cold boot until `criticalHydrate` (a network pull) resolves, so a Dexie-only first paint shows a false empty state until hydration completes or the member writes a row. cardio.html does this right: `readCache`/`writeCache` persist the rendered history to localStorage and `onAuthReady` paints from it synchronously before any hydrate. movement.html's Recent list shipped Dexie-only (PM-168/169) and painted blank on every cold open — fixed PM-170 by adding a localStorage cache (`vyve_movement_log_cache`) and a sync-paint path. **Rule:** when a page renders a member-data list at boot, give it a localStorage cache written on every render and read synchronously on cold load; the Dexie/hydrate read is the *refresh*, never the *first paint*. Audit signal: a render function whose only data source is a `VYVELocalDB.<table>.allFor()` call, reached on the boot path.
## §23.39 — Mind activities log via the optimistic-first / outbox / failure-bus skeleton (PM-173, 20 May 2026)

Every Mind kind (breathwork, journal, affirmation, visualisation) MUST log to `mind_activities` via the cardio.html skeleton — never an awaited foreground POST. Sequence: write to Dexie synchronously; publish `mind:logged` with `client_id` and `kind`; flip UI / clear inputs / repaint; THEN un-awaited background POST in IIFE; on 4xx publish `mind:failed` and `VYVELocalDB.mind_activities.delete(client_id)`; on network error keep the Dexie row for the outbox drainer to reconcile. `client_id` is `crypto.randomUUID()` per §23.37. The outbox dead-item path already publishes a `mind:failed` envelope when an item hits max-attempts or 4xx (PM-173 FAILURE_TABLE_MAP entry) — page-local listeners and home rerender subscribers (PM-171.1) work unchanged. **Forbidden:** `await fetch(...)` blocking the UI flip; mock-only or page-internal logging that doesn't go through Dexie + sync; per-kind divergence (a journal save must not skip the bus event because "it's just text"). Audit signal: a `mind_activities` write inside a page without a corresponding `VYVEBus.publish('mind:logged', ...)` line above it.

## §23.40 — Breathwork imagery sources: Storage now, bundle later (PM-174, 20 May 2026)

Mind imagery (breathwork session backgrounds and any future visualisation
stills) is sourced from **Supabase Storage public buckets** for now, NOT
bundled into `vyve-site/assets/`. The decision: Dean is testing PM-174 and
beyond via the live-update dev loop (Capacitor `server.url` pointed at
online.vyvehealth.co.uk), so a vyve-site commit that drops assets at
`assets/breathwork-imagery/` only renders after the next Capacitor binary
build — wrong loop for evening iteration. Supabase Storage URLs work
identically in the dev loop and in production.

**Tradeoff acknowledged:** Lewis can edit live (matches the Mind v1 catalogue
doctrine), but offline cold-boot on cellular = empty background until network
returns (acceptable at trial scale, single-device LWW). When PF-14b ships
bundled mode and `server.url` is no longer used for iteration, imagery is a
candidate for `assets/breathwork-imagery/` bundling with a `sw.js` urlsToCache
entry per image — at which point the merge pattern is: bundled list + Dexie
catalogue rows, page treats them identically, `is_bundled: true` flag for
debug telemetry. Until then: Storage only.

**Audit signal:** anyone proposing to bundle imagery before PF-14b ships
needs to confirm Dean is no longer using `server.url` live-loop, otherwise
the bundle never reaches the device in the dev cycle. Music is a separate
asset class — Storage permanently (track files are too big to bundle at
20-track scale).

**Rule:** Mind-section decorative assets (imagery, future visualisation
stills) MUST live in Supabase Storage public buckets with catalogue-table
rows pointing at the URLs while `server.url` is the active iteration mode.
Catalogue tables (`breathwork_imagery`, future `visualisation_imagery`) are
the extension point — INSERT rows, no engineering required. Bundling is a
post-PF-14b optimisation, not a launch shape.




### §23.41 — Parallel-session safety protocol (PM-177, 20 May 2026)

When multiple Claude sessions are active simultaneously and committing to the
same repo (Dean's confirmed pattern when racing to ship a feature campaign —
PM-175 journal + PM-176 affirmations + PM-177 music all in flight together
during the Mind v1 launch sprint), fetching SHAs once at session start is NOT
safe. Live HEAD drifts off the rebase base within minutes as parallel sessions
commit, and committing on a stale base will silently overwrite the parallel
session's work.

**Required discipline when parallel sessions are confirmed active:**

1. **Fetch live HEAD immediately before any rebase**, not at session start.
   `GITHUB_GET_REPOSITORY_CONTENT` at `ref=main` is the canonical source.
   Re-fetch within 60 seconds of the commit call if any other tool call has
   elapsed since the last fetch.

2. **Diff live against staged at structural-marker level** — SCHEMA version
   numbers (`SCHEMA_V6` vs `SCHEMA_V7`), `.version(N).stores(SCHEMA_VN)`
   chains, sw.js cache key suffixes (`pm176-affirmations-a` vs `pm177-...`),
   `vbb-marker` Update integers, PM-tags in code comments. Any structural
   marker that's been claimed by a parallel session needs renumbering on the
   in-flight commit BEFORE writing.

3. **Renumber monotonically past parallel ships.** Take the highest PM number
   visible across all structural markers in live HEAD, then claim the next
   integer above that. Don't reuse the PM number from session staging if
   parallel work already used it (PM-175 was originally this session's tag;
   journal claimed it; this commit took PM-177, skipping PM-176 which
   affirmations had taken).

4. **Brain-commit at the END of every session that ships**, never deferred.
   Parallel sessions can't see ungenerated brain state — if you ship code
   without a brain commit, other sessions are working from a stale picture
   and will produce avoidable collisions.

**Page-injected nav buttons + in-page view stacks (subordinate rule from
PM-174.1).** When a page has its own multi-view structure (breathwork.html
picker → intro → session → end), the global nav.js back button on
`.mph-back-btn` needs a view-aware override per-page, otherwise it fires
the default `history.back()` and exits the page entirely. Don't ship a
multi-view page without installing the override AND removing any redundant
in-page back chevrons that would duplicate it visually.

**Binary file transmission through workbench cells fails silently.** Inline
base64 in `run_composio_tool` `code_to_execute` payloads can truncate to a
coherent partial that still decodes without erroring — observed during
PM-177 trying to push JPEG thumbnails. Decoded 2877B from a 14021B
expected payload; md5 mismatch was the only signal. For binaries, route
via GitHub web UI direct-upload OR via Supabase Storage bucket (per
§23.40), NOT via workbench inline base64.



**Amendment (PM-239, 23 May 2026):** When bumping a sw.js cache key via `sed -i s|old|new|`, always:
1. `grep "CACHE_NAME = "` on the freshly-fetched file FIRST to read the current literal key
2. Use THAT key as the `sed` `old` pattern, not whatever you thought it was from memory
3. After sed, grep again to confirm the bump landed (sed silently no-ops if the pattern doesn't match)

Tonight had two no-op seds caught only by post-sed grep — committing those would have shipped sw.js without a cache key change, leaving the SW serving stale assets on devices.

## §23.42 — Bundled-native changes the meaning of every vyve-site main push (PM-115/116/178, 20 May 2026)

Through 27 April 2026, vyve-site `main` was the live source for every user — the Capacitor wrap pointed `server.url` at `https://online.vyvehealth.co.uk`, so every commit to main was instantly visible on every device. Mental model: "push to main = users see it."

After PM-115/116 (15 May 2026), iOS 1.3 (2) and Android 1.0.3 (10) ship bundled-mode. Capacitor packages a frozen snapshot of vyve-site into the IPA/AAB and reads from `capacitor://localhost`. Production users see the bundled SHA (`83874dd5` as of PM-115/116), full stop. A vyve-site main push **does not reach them** until an OTA bundle is built from that SHA and pushed to the Capawesome production channel.

**Implications future Claudes need to internalise:**

1. "Push to main and Shannon sees it" is false for bundled users. It's still true for any remaining 1.1 remote-origin users, and true for Dean's dev iPhone if he's repointed `server.url` for testing — but those are exceptions, not the rule.
2. A bug fix on main is **not shipped** until OTA. Verification on Dean's dev loop (server.url-pointed) doesn't verify production behaviour.
3. A hotfix-branch-then-OTA flow is the surgical option when main has unship-ready work. Branch from the production SHA, cherry-pick the fix, bundle from the hotfix branch. Main never enters the bundle.
4. A full-OTA flow bundles everything currently in `www/`. Any unshipped in-progress work on main goes out with it unless it's gated behind a feature flag or hidden from members. **Sweep main before bundling.**
5. The Capawesome channel listens for bundles tagged for the matching native version range. Same channel can serve iOS and Android (PM-115/116 set them to share `89e12796-aa41-4176-8d78-bc2ef6dfd5c2`).
6. First-ever push of a channel: consider `--rollout 0.1` for safety. Subsequent pushes can default to 100% once the workflow is proven.

The brain still carries scattered language assuming the old remote-origin model ("members will see it on next refresh", "push to main"). When found, correct in-line, not at session close — drift compounds.

## §23.43 — Dexie hydrate via merge, never wipe-then-refill (PM-183.3, 21 May 2026)

`db.js` exposes a per-table `replaceForMember(email, rows)` API used by `sync.js` to bring a member's local Dexie state into line with the server's snapshot on auth-ready, foreground, and delta-pull. The original shape did `where(memberKey).equals(email).delete()` THEN `bulkPut(rows)` inside a single `db.transaction('rw', ...)`.

The transaction is atomic at commit boundaries, but Dexie operations are progressive — a parallel reader querying the same store sees the delete take effect immediately for the duration of the transaction, not just at commit. So any aggregator page (mind.html hub, future Body / Connect hubs) that boots in parallel with sync.js's hydrate fan-out lands `dexie.allFor(email)` in the window between delete and bulkPut, and sees zero rows. The reader paints empty even though the server has the data, the writer just wrote it on a sibling page, and the next paint will be correct. The user experience is a "0 day streak / 0 / 2 sessions" flash for hundreds of ms to several seconds depending on REST latency, before the real numbers appear.

Diagnosed PM-183.3 after PM-183.1 (parallel REST fallback) and PM-183.2 (skeleton paint) had treated the symptom — both useful but neither fixing the cause.

**Hard rule.** `replaceForMember` must merge, not wipe-then-refill:

```js
// 1. Upsert new rows first (idempotent — Dexie .put is upsert by PK).
return db[tableName].bulkPut(rowList).then(function () {
  // 2. Sweep stale: rows for this member NOT in the new set.
  return db[tableName].where(memberKey).equals(email).primaryKeys().then(function (keys) {
    var stale = keys.filter(function (k) { return !incomingIds[k]; });
    if (!stale.length) return;
    return db[tableName].bulkDelete(stale);
  });
});
```

At no point during the transaction is the member's row set empty. Local optimistic writes that happened between the REST snapshot capture and the merge are preserved if they have a new id; only explicit server-side omissions get wiped.

Edge case: empty hydrate (server has no rows for this member) is still a delete-by-member, matching the old behaviour when there is nothing to merge with.

**Scope.** All 17 member-scoped tables that flow through `makeTable` use the same `replaceForMember` shape — daily_habits, workouts, exercise_logs, custom_workouts, exercise_swaps, workout_plan_cache, cardio, nutrition_logs, nutrition_my_foods, weight_logs, session_views, replay_views, wellbeing_checkins, monthly_checkins, weekly_goals, certificates, member_achievements, mind_activities, affirmation_favourites. One change in db.js fixes them all.

**Audit signal.** A `replaceForMember` implementation (or any future variant) whose first action inside the transaction is `.delete()` is a regression. Reads from any aggregator hub that runs in parallel with sync.js will paint empty. Code review: first verb in the transaction body must be `bulkPut`, not `delete`.

**Why this matters past Mind v1.** Phase 1 (Body section consolidation per PM-184) introduces a `body_activities` table with the same aggregator-hub shape — body.html will read from `dexie.allFor()` exactly like mind.html does. Phase 2 (Connect) likewise. Without this fix, every new aggregator hub repeats the same bug. With it, all future aggregator hubs paint instantly from Dexie on cold load.

**Architectural note for §3.** The §3 local-first commitment says "Every read goes to Dexie." That contract is only honourable if Dexie reads are never *transiently empty* due to background sync activity. The PM-183.3 fix makes that contract enforceable.

## §23.44 — A page that reads from Dexie must load the Dexie stack (PM-183.6, 21 May 2026)

mind.html was authored as an aggregator hub reading from `window.VYVELocalDB.mind_activities` — but the page only loaded `theme.js`, `auth.js`, `sw.js` register, the inline IIFE, and `nav.js`. The five scripts that actually populate `window.VYVELocalDB` — `dexie.min.js`, `bus.js`, `db.js`, `vyve-offline.js`, `sync.js` — were missing entirely. The IIFE's safety guards (`if (window.VYVELocalDB && window.VYVELocalDB.mind_activities)`) caused every call to silently fall through to the empty-array path. From outside it looked like Dexie was returning empty; in reality Dexie was never loaded.

This consumed five session iterations (PM-183.1 through PM-183.5a) treating downstream symptoms before a diagnostic overlay made `[t=0] VYVELocalDB? false` visible. The full chain of fixes shipped were each architecturally correct on their own terms (merge-not-wipe §23.43, localStorage snapshot §23.38, skeleton paint, parallel REST belt-and-braces), but none of them could have fixed the actual bug. A `<script src="db.js">` would have.

**Hard rule.** Any page that references `window.VYVELocalDB`, `window.VYVEBus`, `window.VYVESync`, or any of the Dexie/bus/sync helpers in its IIFE must load the corresponding script tags before the inline block. The canonical hub-with-bus stack, in order:

```html
<script src="auth.js" defer></script>
<script src="dexie.min.js" defer></script>
<script src="bus.js" defer></script>
<script src="db.js" defer></script>
<script src="vyve-offline.js" defer></script>
<script src="sync.js" defer></script>
```

`sync.js` is only required if the page needs the auth-ready REST hydrate (most aggregator hubs do). Pages that only write (journal.html) can omit it.

**Audit signal.** Before shipping any new page that reads from Dexie, grep the page's `<script src>` declarations. If `db.js` is absent, the page cannot read from local storage and any apparent Dexie behaviour is silent fall-through to empty.

**Debugging signal.** When a page's Dexie reads return empty unexpectedly, the first hypothesis to falsify is "is `window.VYVELocalDB` defined at all?", not "is the data missing from Dexie?". A two-line console check beats hours of downstream patching:

```js
console.log('VYVELocalDB:', !!window.VYVELocalDB);
console.log('mind_activities:', !!(window.VYVELocalDB && window.VYVELocalDB.mind_activities));
```

**Scope.** Audit pass needed on every existing portal page that contains the string `VYVELocalDB`, `VYVEBus`, or `VYVESync` in inline JS. Cross-reference against the page's `<script src>` declarations. Any mismatch is a PM-183.6-class latent bug — the page either silently degrades to no-storage mode (the mind.html case) or throws if the IIFE doesn't have safety guards.

**Process lesson worth carrying forward.** When a fix doesn't move the symptom, ship a diagnostic before shipping a sixth treatment. PM-183.5/5a's diagnostic overlay landed the answer in one screenshot. The five iterations before it were guessing in the dark because no instrumentation existed to confirm the actual state inside the WKWebView. Diagnostic-first should be the second move after the first patch fails, not the seventh.

## §23.45 — Composio outage fallback: direct PAT, max 2 retries (PM-185, 21 May 2026)

Composio has had at least one major outage that broke every GitHub call despite the dashboard reporting connections as Active (21 May 2026 security incident — they revoked all user GitHub tokens precautionarily). Pattern: tool_search reports `has_active_connection: true`, but every actual call returns `401 Bad credentials`, including the simplest `GET /user`. Clicking through the Composio dashboard to reconnect achieves nothing while the incident is live — fresh OAuth grants get the same 401.

**Protocol when GitHub calls via Composio return 401:**

1. Try the same call twice. If both fail with 401 (or any auth error), STOP.
2. Check `status.composio.dev` — if any GitHub-related incident is open, fall back immediately.
3. Fall back to direct GitHub PAT. Source: see §25 — Claude fetches via Supabase MCP; never ask Dean to paste it.
4. Use `bash_tool` with `curl` against the GitHub REST API:
   - Reads: `Authorization: Bearer $PAT` + `Accept: application/vnd.github.raw`.
   - Single-file writes: `PUT /repos/{owner}/{repo}/contents/{path}` with base64 content + fresh SHA (always refresh SHA immediately pre-commit per §23.41, never reuse).
   - Multi-file atomic commits: Git Data API chain — `POST /git/blobs` per file → `POST /git/trees` with base tree → `POST /git/commits` with parent → `PATCH /git/refs/heads/main`. Contents API is one-file-per-call and CANNOT do atomic multi-file.
5. §23.41 pre-commit SHA refresh + first-100-char post-commit verification are mandatory regardless of which path is used.
6. After Composio's status page goes green, do NOT immediately trust the connection — test end-to-end with a real read before re-routing future calls through it.

**Anti-pattern to avoid:** burning session time clicking the Composio UI to reconnect during a live outage. Reconnect attempts during an active incident produce fresh tokens that get revoked again immediately. The fallback path is faster and reliable.

---

## §23.46 — Counters render truth, not loading placeholders (PM-186, 21 May 2026)

Bundled-native, Dexie-is-source-of-truth means counters on every member-data surface should render the true value on first paint. The localStorage snapshot pattern (mind.html PM-183.4 / §23.38) was a workaround for a since-fixed sync bug (§23.43 merge-not-wipe). It is no longer the right answer for new pages.

**Rule:** Dexie reads are synchronous to first paint. Default value for any counter is `0` — the genuine zero state for an unhydrated or empty table. Skeleton characters (`·`, `…`) are forbidden on local-data surfaces because they signal ignorance about a value we can know.

- A new member sees `0` because they have done 0 things. That is honest.
- A reinstalled member sees `0 → real value` flicker as Dexie hydrates from Supabase. That flicker is also honest — the local store really is empty during the window.
- A warm-start member (99% of opens) sees the real value on first paint. Imperceptibly brief 0→real transition (~5-15ms, below human perception).

**Only genuinely-unresolved-remote-data may use `…`,** and only until the first successful fetch establishes a last-known value cached in Dexie `_kv`. After that, render the last-known value with an optional "Last updated Nm ago" tag rather than a skeleton. Surfaces that qualify: community counts, challenge community totals, fresh-catalogue freshness checks — the §23.10 carve-outs.

**Audit signal:** any page with `·` or `…` in default HTML markup for a streak, day count, activity total, personal progress, or any other Dexie-readable value is in violation. The literal characters `·` and `…` should appear in markup only inside §23.10 surfaces (and even there, hidden until first fetch is preferred).

**Implementation pattern:**

```html
<!-- Default markup -->
<div class="streak-ring"><span id="streak-val">0</span></div>
<div class="today-count"><span id="today-val">0</span>/<span id="today-target">2</span></div>
```

```js
function boot() {
  // window.vyveCurrentUser.email is already set via auth.js fast-path on warm starts
  if (!window.vyveCurrentUser || !window.vyveCurrentUser.email) {
    window.addEventListener('vyveAuthReady', boot, { once: true });
    return;
  }
  const email = window.vyveCurrentUser.email;
  // Dexie is already open via eager IIFE bootstrap in db.js
  Promise.all([
    VYVELocalDB.connect_checkins.allFor(email),
    // ... other tables
  ]).then(([rows]) => {
    render(rows);  // paints real values OR 0 if empty
  });
  // Subscribe to hydrate events so cold-install gets a repaint when sync.js lands data
  VYVEBus.subscribe('connect:hydrated', () => boot());
}
```

**Retroactive scope:** mind.html PM-183.4 snapshot (`vyve_mind_hub_snapshot`, `paintFromSnapshot`, `writeSnapshot`) is now obsolete and queued for Phase 4 (offline-correctness sweep) removal. Connect (Phase 2) ships without snapshots from day one.

**Why this is now a hard rule** (rather than a UX preference): bundled-native means Dexie IS the local DB, not a cache of a remote DB. Treating Dexie reads as if they need a loading state misrepresents the architecture to the user. A skeleton implies "we're computing this" — but for a local DB read on warm start, we're not. We already have it. Show it.

---

## §23.47 — Specs cross-checked against live schema before lock (PM-187, 21 May 2026)

PM-186's `playbooks/connect-spec.md` was written assuming `service_catalogue.kind` (`'live_session' | 'replay' | ...`), `is_live=true` boolean, and `published_at` timestamp — none of which exist on the live `service_catalogue` table. The live schema (verified at PM-187 build time) uses `type` ('live_session' / 'replay' / 'workout_plan'), `active` boolean, and `created_at` timestamp. Functionally identical, but the spec language was wrong, and a fresh session reading the spec to build off it would have wired three nonexistent columns and silently rendered empty carousels.

**The rule:** Any spec that locks design decisions referencing columns on existing tables must include a live `information_schema.columns` cross-check, executed at design lock time, captured inline in the spec — either as a code block showing the verified columns or as a one-line note ("verified PM-NN against live schema"). The cross-check has the same shape as §23.41's SHA refresh: cheap, catches drift, prevents downstream rework.

**Implementation pattern (design phase):**

```sql
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name IN ('table_one', 'table_two', ...)
ORDER BY table_name, ordinal_position;
```

Paste the result into the spec, alongside the data-model section. Any column referenced in spec prose that isn't in the result is a drift gap — fix the spec, not the live table (unless the migration is also part of the same spec lock, in which case the migration goes in first).

**Audit signal:** A spec that names columns from existing tables without an adjacent verification of those column names — caught either by the writer at lock time or by the next session that builds against the spec. PM-187 caught it at build time; the rule exists so the next spec catches it at lock time.

**Why this matters past Connect.** Phase 1 (Body consolidation) will produce a `body_activities` table spec that references shapes on `workouts`, `cardio`, `movement` history tables and `exercise_logs`. Phase 3 (Pillar realignment) will reference shapes on every member-scoped table when redefining the engagement-score Variety component. Phase 4 (Offline-correctness sweep) will reference every member-scoped table when applying the `updated_at` + `BEFORE UPDATE` trigger audit. Every one of these locks against an assumed shape is a potential drift gap if §23.47 isn't observed.

**Related rules:** §23.41 (SHA refresh — same shape, file SHAs instead of column names), §23.39 (write-shape audit — same shape, write path instead of column shape), §23.43 (Dexie hydrate merge — applies to the column shapes pulled).

---

## §23.48 — Connect freshness model (four patterns) (PM-188, 21 May 2026)

After step 7 design discussion, the implicit freshness model embedded across mind.html, the PM-187 Connect cluster, and the PM-187.3 EF wiring is codified explicitly. Every surface on every member-data page in the portal falls into exactly one of four patterns. Pick the right one at design time; the wrong one is either a §23.46 violation (skeleton on data Dexie can answer), a §23.10 violation (treating network-bound data as local), or a §23.7.7 violation (stale across rollover because no focus handler).

**Pattern 1 — Local member data. Bus-driven, no timers.**

Source of truth: Dexie + `_sync_queue` outbox. Examples: streak rings, posted-today, personal challenge progress, own recent check-ins, own reactions, habit ticks, workout logs.

Mechanism: synchronous Dexie read at paint (per §23.46, default 0 in markup), bus subscriptions repaint on every relevant write. The bus IS the freshness mechanism. No polling. No timers. No focus handler needed for the data itself — the §23.39 optimistic-first write path publishes the bus event the moment a write lands locally, so every subscribing surface is already in sync.

Required events to subscribe to: `<domain>:logged`, `<domain>:failed`, `<domain>:hydrated`, plus any cross-domain event that affects the surface's compute (e.g. Elite progress on connect.html subscribes to `mind:logged` and `body:logged` because those count toward the 30-day threshold).

**Pattern 2 — Catalogue data. Fan-out-on-focus, no live updates.**

Source of truth: Dexie copy of server catalogue tables, hydrated by sync.js. Examples: `service_catalogue`, `weekly_challenges`, `daily_checkin_prompts`, `personas`, `knowledge_base`, `habit_library`.

Mechanism: hydrate on `auth-ready`, refresh on `visibilitychange→visible` and `pageshow`. Paint reads Dexie synchronously. No timers. The focus loop IS the refresh mechanism. The user gets catalogue data as-of-when-they-opened-the-app or as-of-last-focus, never more stale than the gap between focus events — typically minutes in real use.

Required: every page that renders catalogue data must have a `visibilitychange` handler that re-runs its Dexie read (cheap, microseconds). Sync.js fan-out-on-focus is already wired; the page just needs to listen for the resulting bus event OR re-read on `visibilitychange` itself. Either works.

**Pattern 3 — Time-derived state from catalogue. Page-visible ticker, paused on hidden.**

This is the new pattern codified here. Source of truth: pure function of `(catalogue_row, Date.now())`. Examples: "is this session live right now / upcoming / finished", live session countdown timers, "available now until 18:00" eligibility windows, anything where the catalogue row contains a timestamp and the UI state changes as wall-clock time crosses it.

Mechanism: `setInterval` while page is visible, paused on `visibilitychange→hidden`, resumed on `→visible`. Interval re-evaluates the state machine for every visible row and reshuffles ordering if needed (e.g. live → top of carousel, upcoming next, finished hidden or last). On `→visible` after a long background period, ALSO immediately fire the state-machine re-evaluation once — don't wait up to N seconds for the next tick to correct stale UI.

Interval cadence: 30s for session-liveness state; 1s only for active countdowns the user is staring at. Default 30s.

This pattern is the minute/second-scale analogue of §23.7.7 rule 2 (date-anchored surfaces self-correct on date rollover). §23.7.7 handles the midnight case via `visibilitychange + focus` re-read of `todayStr`; §23.48 pattern 3 handles the same problem at higher frequencies for surfaces where state changes throughout the day.

What this does NOT solve: a catalogue row being edited server-side (cancelled, rescheduled, host swapped) while the page is open. That falls to pattern 2's focus loop — acceptable cost of at-most-one-focus-gap of staleness. If a surface needs sub-focus-gap freshness for catalogue edits, that's an explicit pattern 4 carve-out or a Realtime channel decision (defer to post-launch by default).

**Pattern 4 — Honestly-network-bound aggregates. 60s `_kv` cache, fetch-on-focus.**

Source of truth: server-side aggregate compute (Edge Function), can't be derived from Dexie. Examples: "X members checked in today" feed banner, challenge community total ring, leaderboard rankings, peer reactions on others' feed posts, charity collective total.

Mechanism: the PM-187.3 lifecycle, shipped and proven. (1) Paint immediately from `_kv` cache, counters default 0 or hidden if no last-known value (per §23.46 — only the genuinely-unresolved-remote-data carve-out may use `…`, and even then "Last updated Nm ago" with last-known is preferred). (2) On boot, check staleness: cache older than 60s OR missing OR key dimension mismatch (e.g. `challenge_id` changed). (3) If stale, fire EF un-awaited, write result to `_kv` with `computed_at_ms` timestamp, repaint. (4) `visibilitychange→visible` re-runs the staleness check; if stale, fire again. (5) EF errors leave last-known cache visible — never flicker to a blank, never overwrite good cache with an error state.

`_kv` key shape: `<surface>_<scope>_v<version>`, e.g. `connect_feed_counts_v1`, `connect_challenge_summary_v1`, `connect_leaderboard_v1`. Stored value includes `computed_at_ms` and any dimension keys needed for invalidation.

Realtime is NOT pattern 4 v1. Spec §6 (Connect) explicitly defers Realtime: "add post-launch only if Cole reports the gap hurts engagement." Same default for all pattern-4 surfaces: 60s cache + focus refresh covers the real-world cases. Reach for Realtime only when a specific UX gap is empirically demonstrated.

**Decision tree for "which pattern applies".**

1. Can Dexie answer this read with data already on device? → Pattern 1.
2. Is this catalogue data the server owns and the client mirrors? → Pattern 2.
3. Does the UI state change as wall-clock time crosses a timestamp in catalogue data? → Pattern 3, layered ON TOP of pattern 2.
4. Is this a cross-member aggregate or live community count that the client can't compute locally? → Pattern 4.

Most surfaces use exactly one pattern. Some compose: Live This Week carousel = pattern 2 (catalogue from Dexie) + pattern 3 (liveness state ticker). connect.html feed banner = pattern 4 (community count from EF). connect.html streak ring = pattern 1 (own connect_checkins from Dexie + bus).

**Audit signal for new pages or new surfaces on existing pages:**

For each surface on the page, ask the four decision-tree questions in order. The first "yes" identifies the pattern. If you can't answer "yes" to any of them, the surface is probably trying to render data that has no defined source — go back to spec.

Violations to grep for:
- Pattern 1 surface with no bus subscription → freshness depends on page reload, brittle.
- Pattern 1 surface with `await fetch(...)` in the paint path → §23.10 violation (offline contract broken).
- Pattern 2 surface with no `visibilitychange` handler → stale across long opens, no rollover correction.
- Pattern 3 surface with `setInterval` that doesn't pause on hidden → battery drain, esp. on bundled-native.
- Pattern 3 surface with no `visibilitychange→visible` immediate re-evaluation → stale up to interval-length on resume.
- Pattern 4 surface with `…` or "Loading…" in default markup when last-known cache exists → §23.46 violation.
- Pattern 4 surface that overwrites good cache with an error state on EF failure → user sees blank where they previously saw data.
- Any surface with a hand-rolled 60s cache that doesn't use `_kv` → divergence from canonical pattern, future maintenance debt.

**Application to existing surfaces.**

Already correct: mind.html hub (pattern 1 + 2), habits.html (pattern 1, post §23.7.7 fixes), connect.html hub (pattern 1 + 2 + 3 partial — Live This Week needs ticker, step 7), connect-feed.html (pattern 1 + 4), connect-challenge.html (pattern 1 + 4), index.html home (pattern 1 + 2).

Needs work at step 7: sessions.html (pattern 2 + 3 — full schedule, live ticker), leaderboard.html (pattern 4 — needs `_kv` cache + EF wiring + offline affordance per §23.10).

Future Phase 1 (Body consolidation): pattern 1 dominant, pattern 3 only if movement classes acquire live-session shape.

Future Phase 3 (Pillar realignment): all four patterns in play. Engagement score Variety component = pattern 1. Pillar certificate progress = pattern 1. Monthly check-in activity rollup = pattern 1.

**Why codify now.** PM-187 and step 7 made the four patterns visible because Connect happens to exercise all four cleanly. The next two phases (Body, Pillar) will each touch surfaces that should use a specific pattern; without a named matrix, each phase risks re-deriving the answer and getting it wrong. §23.48 is the matrix. Future specs reference §23.48 when wiring a surface, the way PM-187 spec referenced §23.46 for paint and §23.39 for writes.

**Related rules:** §23.46 (counters render truth — defines the paint side of patterns 1-2 and the carve-out for pattern 4), §23.10 (offline contract — defines which surfaces are pattern 4 carve-outs vs broken patterns 1-2), §23.7.7 (date rollover self-correction — the daily-rollover analogue of pattern 3's intra-day ticker), §23.39 (optimistic-first write skeleton — emits the bus events pattern 1 listens to), §23.43 (Dexie merge-not-wipe — makes pattern 2 hydration safe).

---

## §23.49 — Catalogue imagery is DB-driven, nullable, with onerror fallback (PM-190, 21 May 2026)

Any catalogue surface (`service_catalogue`, `programme_library`, future content tables) that renders cards with thumbnail imagery must drive the image URL from a nullable DB column on the catalogue row, not from a hardcoded filename mapping in HTML or JS. Render path: emit `<img src="..." onerror="this.remove()..."/>` only when the column is non-null; null means render the gradient placeholder unchanged. Asset files live in the vyve-site repo (or a future bucket) and the DB column holds the path/URL.

**Why codify.** Two failed patterns observed before this rule existed: sessions.html hardcodes 8 thumb filenames in an inline JS array (`thumb: 'thumb-yoga.jpg'`), making thumbnail updates a code deploy. The pre-PM-190 connect.html `renderLiveThisWeek` emitted an empty gradient div for every card because there was nowhere for imagery to come from. Both patterns share the same root: the catalogue's content surface assumes image filenames are infrastructure, not content. They're content — they belong in the catalogue row.

**The contract.**

1. **Column shape.** `image_url TEXT` nullable, no default. NULL means "use placeholder". Comment on column must document the placeholder behaviour so future devs (and the future Command Centre editor) don't assume non-null is required.
2. **Render path.** `card-thumb` div always emits, with absolute positioning. When `row.image_url` is non-null, append `<img src="..." onerror="..."/>` inside it; the img absolutely covers the gradient via CSS (`position:absolute;inset:0;width:100%;height:100%;object-fit:cover`). When null, no img is appended and the gradient shows through. `escapeHtml` the URL.
3. **onerror is mandatory.** A typo in the DB or a missing asset file must degrade silently to the gradient, not show a broken-image icon. Pattern: `onerror="this.remove();var ov=this.parentElement.querySelector('.scroll-card-thumb-overlay');if(ov)ov.remove();"`. The overlay (linear-gradient darken at the bottom for text legibility over photos) only makes sense over an image, so it removes alongside.
4. **Backfill on column add.** When adding `image_url` to an existing catalogue, immediately backfill rows whose corresponding asset file exists in the repo. Rows whose asset doesn't exist stay NULL — never invent a path hoping a file will appear later. The NULL → gradient fallback is the correct UX state until content lands.
5. **Sync transparency.** Dexie's schema string (`'id, type, category, active'`) lists indexed fields only; non-indexed columns flow through automatically via `select=*`. No db.js bump needed for catalogue image columns unless the column itself is indexed (don't index image URLs — wrong data type for lookups).

**Future-fit.** This rule is the contract the upcoming Command Centre session editor (parked in backlog post-PM-188) writes against. Editor exposes the column, content team edits per-row URLs, no engineering involvement to swap an image. Sessions.html eventually migrates from its hardcoded array to the same DB read; PM-190 lays the groundwork without doing the migration tonight (sessions.html scope stays parked behind the editor campaign).

**Surfaces governed by §23.49 today.** `service_catalogue.image_url` — used by connect.html `renderLiveThisWeek` (live_session rows) + `renderLatestFromVyve` (replay rows). Future use: sessions.html when it absorbs the catalogue swap, any new content carousel built off `service_catalogue` or a sibling table.

**Related rules:** §23.46 (NULL renders truth — empty thumb = gradient, not a skeleton), §23.47 (verify column names against live schema before render code locks them in).

---

## §23.50 — Catalogue schema changes require an invalidation-key bump (PM-190.c, 21 May 2026)

Adding a column to a catalogue table is half the work; the other half is making existing devices re-pull. `sync.js` has stale windows on catalogue tables (24h default, 5min for content-ops surfaces registered in `CATALOGUE_FRESH_TABLES`). A column added today is invisible to a device that pulled the table yesterday until the stale window expires. For long windows this is a real bug — for content-ops surfaces it's just slow. Either way, schema additions need an invalidation trigger.

**The contract.** Any migration that adds a column to a catalogue table AND that column is referenced by render code MUST be paired with a `sync.js` commit bumping `CATALOGUE_INVALIDATION_KEY` to a new string. The new value can be anything unique (`pm190c-image-url`, `pm205-xyz` etc); the requirement is that it differ from the value devices currently have recorded. On next visit, `shouldPullCatalogue` sees the mismatch and forces one refresh per affected catalogue. Subsequent visits with matching keys respect the stale window again.

**Don't bump for:** pure-write columns (audit fields, server-only flags, columns no client code reads). When in doubt, bump — a forced refresh is one extra REST round trip per device on next visit. Cheap.

**Why it matters.** PM-190 shipped `service_catalogue.image_url` + render path + backfill, and the photos didn't appear on device because Dexie was holding pre-migration rows. Recovery took an additional commit (PM-190.c) to add the invalidation mechanism *and* to drop service_catalogue's stale window from 24h to 5min (the right answer for content-ops surfaces regardless of whether a schema change is in flight). The clean version would have been one commit doing the migration, the render code, AND the invalidation bump together.

**Operating model.** `CATALOGUE_INVALIDATION_KEY` lives at the top of `sync.js` alongside the other stale-window constants. It's a string, version-suffixed when convenient (`pm190c-image-url`, `pm200-foo-column` etc) but the suffix is just for readability — only string equality matters. The per-table `invalidation_key` stored in `_sync_meta` is set by the success path in `hydrate()`; reading happens in `shouldPullCatalogue`.

**Related rules:** §23.49 (catalogue imagery is DB-driven — the rule §23.50 protects), §23.10 (offline contract — refreshes can't deadlock UI; stale data is acceptable, missing fields are not), §23.46 (counters render truth — same principle for catalogue render).

---

## §23.51 — When a CSS edit produces no visible change, audit the selector before re-tuning (PM-204, 22 May 2026)

PM-201/202/203 burned three commits on `connect-checkin.html` posted-state spacing by repeatedly tuning `body.posted-state-visible .topbar` padding. None of the three changes moved a single pixel on-device, because the page has no `.topbar` element — the actual sticky header is `.mobile-page-header`, injected at runtime by `nav.js` (line 249). The CSS rules were perfectly valid, the cache key was bumped on every commit, the build marker ticked on every commit, post-commit verification confirmed the file SHAs on main. Everything looked right except the rendered output. Three iterations went by before Dean's question — "is this page different in how it paints?" — prompted the cascade audit that found the dead selector.

**The rule.** When a CSS edit completes the pipeline (commit verified on main, cache key bumped, build marker advanced, device reports new marker) AND the rendered output looks identical to the previous state, do **not** re-tune the same value. The most likely explanation is that the selector matches nothing on the rendered page. Audit before the second attempt.

**Audit method (cheap, two minutes):**

1. `grep -n "class=\"<selector-base>\\|<selector-base>-" <page>.html` — does the markup actually contain an element with the class being targeted?
2. If not, grep shared injection scripts (`nav.js`, `theme.js`, anything in `<script src=>` at the top of the page) for `createElement`, `className =`, or the visible header text.
3. The element you're trying to style is whatever's actually on the rendered DOM — confirm its class against the CSS selector before tuning further.

**Anti-pattern that PM-201–203 instantiated three times.** A page imports a CSS pattern from an older sibling (here, the legacy sub-page `.topbar` shape) without checking whether the imported pattern matches what the page currently renders. The rule then sits as dead CSS forever, invisible to future sessions, ready to misdirect again.

**Hygiene corollary.** When PM-204 fixed this, it also **deleted** the dead `.topbar` override rather than leaving it adjacent to the working rule. Dead CSS is worse than missing CSS — it implies intent that the rendered output contradicts. Anywhere a future session might find a dead selector and read it as authoritative is a future bug.

**Why this isn't covered by existing rules.** §23.41 covers SHA freshness (the post-commit verify caught nothing because the verify only confirms file contents on main, not rendered-DOM effect). §23.47 covers spec-vs-schema drift (similar shape: assumed columns that don't exist on tables) but targets data, not DOM. §23.51 fills the DOM gap: the equivalent of §23.47 for the rendered page, where the "schema" is the actual DOM and the "spec" is the CSS selector.

**Audit signal.** Any CSS commit whose Dean-reported on-device effect is "looks the same" should be the trigger to grep for the selector before iterating. One grep beats three commits.

---

## §23.52 — Never substitute large file bodies into bash argv via `-d "$body"`; always write to /tmp and pass `--data-binary @file` (PM-209, 22 May 2026)

PM-209 nearly took the home page off production for several minutes. The Mind Today's Focus thumbnail refactor was a three-file atomic commit via the Git Data API (blobs → tree → commit → update ref). The pattern that broke: each blob create POSTed `{"content": "<base64>", "encoding": "base64"}` to `/git/blobs`, and the body was built inline via `body=$(python3 -c "import json; print(json.dumps({'content':'$b64',...}))")` then passed to `curl -d "$body"`. For mind.html (44KB) this worked. For sw.js (small) this worked. For index.html (121KB) the body exceeded the `execve` argv size limit (`/bin/sh: 20: python3: Argument list too long`), `BLOB_INDEX` came back empty, the subsequent tree was built with three blob entries one of which had an empty SHA, and the resulting GitHub tree silently omitted index.html. The push succeeded. The home page returned 404.

**The rule.** Any time a curl request body contains the contents of a file >10KB, **never** route the body through a shell variable. Always:

1. Write the JSON body to `/tmp/<name>_body.json` from inside a Python `-c` block (or directly with `python3` reading the file off disk).
2. POST with `curl --data-binary @/tmp/<name>_body.json` (not `-d "$VAR"`).

This applies to GitHub Git Data API blob creates, Supabase MCP migrations with large SQL, EF deploys with big bundled source, and any other large-body HTTP POST through bash.

**Why `-d` is the silent failure mode.** `curl -d "$body"` evaluates `$body` as a single argv element. Bash argv has a system limit (~128KB on Linux, lower on macOS). When exceeded, `execve` returns `E2BIG` and the shell prints "Argument list too long" to stderr — but the curl invocation that follows in a heredoc or chained pipeline may proceed with an empty body, or the surrounding `$()` capture returns empty, and downstream code consumes the empty result without recognising the failure. Empty SHAs cascaded into a tree that GitHub accepted at face value: "no entry for path index.html under this tree merge" was interpreted as "leave index.html out".

**Why the verify step caught it (eventually) but not soon enough.** §23.41 requires post-commit first-100-char re-fetch on each file. PM-209 was about to skip this for index.html because the file "wasn't supposed to change much" — the original verify plan only inspected mind.html and sw.js. The check that caught the deletion was a separate `commits/$SHA` API call inspecting `files[].status`, which surfaced `removed index.html`. Without that, the home page would have stayed dead until a member reported it.

**The audit corollary.** Post-commit verify on any atomic multi-file commit must call `GET /commits/{sha}` and assert that the `files[].status` array contains **exactly** the expected `modified`/`added` entries — no surprise `removed` entries. A file that fails to be staged correctly will show as `removed` on the commit diff against parent.

**Recovery.** PM-209.1 (commit `5488a1f9`) restored index.html from the parent commit's blob SHA, on top of the broken HEAD `316aded3`. Recovery took ~3 minutes once detected. Could have been zero if the body-overflow had been prevented at write time.

**Codification:**

- §23.52(a): `curl -d "$body"` for any body >10KB is forbidden. Write to file, pass `--data-binary @file`.
- §23.52(b): post-commit verify on atomic multi-file commits must inspect `files[].status` for the commit, not just file contents.
- §23.52(c): any blob/tree creation flow that captures a SHA into a shell variable must assert the SHA is non-empty before passing it to the next step.

---

## §23.53 — JSON parse from a file, not from an inline `python3 -c` in a `$()` capture (PM-210b, 23 May 2026)

PM-210b nearly hit a §23.52-class confusion on the commit step itself. The Git Data API `POST /git/commits` call succeeded — GitHub returned a fully-formed 201 response with the new commit SHA. But the surrounding shell pipeline was:

```bash
COMMIT_RESPONSE=$(curl -sf -X POST ... | tee /dev/null)
COMMIT_SHA=$(echo "$COMMIT_RESPONSE" | python3 -c "import json,sys; print(json.load(sys.stdin).get('sha',''))")
if [ -z "$COMMIT_SHA" ]; then echo "FAIL: empty commit SHA"; exit 1; fi
```

The response body contained a multi-line `message` field with literal `\n` characters interpreted as control characters by the inline `json.load`. Python 3 rejected them (`json.decoder.JSONDecodeError: Invalid control character at: line 20 column 116`). The exception bubbled to stderr; `print()` never executed; the `$(...)` capture returned empty. The `if [ -z "$COMMIT_SHA" ]` branch then fired with the misleading message "FAIL: empty commit SHA" — visually indistinguishable from "GitHub returned no SHA".

The commit was actually fine. The new SHA (`31e6910e...`) was sitting in the response body the whole time. Operator triage took one extra step to realise this — fortunately a cheap one, but in a parallel-session situation or any context where pulling the response back is non-trivial, this could have prompted a re-attempt of an already-successful commit (duplicate commit, parent mismatch, broken ref chain).

**The rule.** When a captured API response is JSON, **always write the response body to a file first**, then parse from disk in a separate step that surfaces parse errors as parse errors, not as empty captured values. Never use the `<command> | python3 -c | $(...)` shape for response parsing.

**Canonical pattern:**

```bash
curl -sf ... -o /tmp/response.json
SHA=$(python3 -c "import json; print(json.load(open('/tmp/response.json'))['sha'])")
# If python3 fails here, it prints the traceback to stderr and exits non-zero,
# which the surrounding script sees clearly. The $(...) capture only swallows
# stdout, not the exit code from a separate process.
[ -z "$SHA" ] && { echo "FAIL: response had no .sha — inspect /tmp/response.json"; exit 1; }
```

Or for the strictest version, separate the steps entirely so the operator can `cat /tmp/response.json` on any failure to see what GitHub actually returned.

**Why this isn't covered by existing rules.** §23.52(c) protects against the value being legitimately empty (captured-and-empty); §23.53 protects against the value being legitimately present but the parser failing (captured-and-mis-parsed). Both end up as empty shell variables. The two failure modes need different responses — §23.52(c) means "API failed, look at the request"; §23.53 means "API succeeded, look at the response and fix the parser". Conflating them sends triage down the wrong path.

**Operating pattern.** For every API call where the response is JSON and we need to extract a field:
1. `curl -sf ... -o /tmp/<step>_response.json` (capture to disk).
2. Inspect with a separate parse step that surfaces its own errors.
3. Keep `/tmp/<step>_response.json` files until session close — they're the only forensic trail if anything goes wrong downstream.

**Retroactive scope.** Every multi-step Git Data API chain (blob creates, tree create, commit create, ref update) should follow this pattern. The chain in PM-210b had four parse-from-stdin sites; three of them happened to parse cleanly because the response bodies didn't contain control characters in the fields being read. The fourth (commit response, reading from a `message` field full of newlines via the wider response) was the only one that failed — but the same fragile pattern was sitting in all four sites.

**Related rules.** §23.45 (PAT-direct path mechanics — the same chain this rule patches), §23.52 (the parallel rule on shell argv overflow during write operations — §23.53 is the read-side equivalent), §23.41 (post-commit verification — the verify step itself uses JSON parse against response bodies, same fragility, same fix).

---

## §23.54 — SW install must use `fetch(url, { cache: 'reload' })`, never `cache.addAll()` (PM-220.6, 23 May 2026)

**The rule.** In `sw.js`, the install handler precaches `urlsToCache` via an explicit `fetch(url, { cache: 'reload' })` followed by `cache.put`, never `cache.addAll()` and never default-mode `fetch()`. The `cache: 'reload'` mode forces bypass of both browser HTTP cache and any intermediate CDN cache.

```javascript
// CORRECT
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => Promise.all(
        urlsToCache.map(url =>
          fetch(url, { cache: 'reload' })
            .then(resp => resp && resp.status === 200 ? cache.put(url, resp) : null)
            .catch(() => {})  // asset-by-asset failure tolerated
        )
      ))
      .then(() => self.skipWaiting())
  );
});

// WRONG — default cache mode serves stale CDN copies
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});
```

**Why.** GitHub Pages fronts the repo via its own CDN. When `cache.addAll()` runs during install, each fetch uses the browser default cache mode, which is allowed to return cached CDN responses. If the CDN has not yet propagated the latest commit (typical 5-10 minute lag), install fetches the *previous* version of each precached file and stores it into the new SW cache. Activate then purges the old SW cache. The new cache, populated with stale CDN content, becomes the active cache. Stale-while-revalidate serves the stale content on every navigation. Each cache key bump installs another stale copy. **The fix never reaches the device.**

This pattern explains every "Update X shipped but the device still shows the previous bug" symptom. PM-220.4 → PM-220.5 was correctly committed and visible at origin but Dean's device kept rendering the diagnostic for three deploy cycles, all served from the SW cache populated during install while GitHub Pages CDN was still propagating.

**Side benefit.** `cache.addAll()` is all-or-nothing: any single 404 fails the entire install. `fetch + cache.put` per URL with `.catch(() => {})` tolerates asset-by-asset failures — one bad URL no longer kills the whole install.

**Signature.** If a bug appears to never get fixed despite committing the fix correctly across multiple deploy cycles, the SW install path is the first suspect. Verify the source on `main` is correct via API, verify the cache key bumped, verify vbb-marker bumped. If all three are correct and the device still shows the old bug, the SW install is grabbing stale CDN copies. Apply this rule.

**Related rules.** §23.42 (every vyve-site commit needs sw.js + vbb-marker bumped together), §23.51 (when a CSS edit produces no visible change, audit the selector — §23.54 is the SW-side equivalent: when a code change produces no visible change despite correct source, audit the SW install path).

---

## §23.55 — Hub-page hero doctrine (PM-216 → PM-226, 23 May 2026)

**The rule.** Photographic heroes on hub pages (Connect now, Mind / Body / Index next) follow a single settled doctrine. Full implementation spec is in `playbooks/hub-page-hero-doctrine.md` — load it before touching any hub-page hero. The contract here is the **invariants** that every hero ship must honour.

### Layout invariants

- Hero is `position: fixed` with **longhand** `top:0; left:0; right:0; height: max(280px, 46vh)`. No `inset:0` shorthand (silently fails on WKWebView per PM-221.1).
- Hero is **body-level**, not inside `<main>`. Parent stacking contexts interfere with fixed pinning on WKWebView (PM-220.1).
- `translateZ(0)` + `will-change: transform` on the hero. GPU compositor layer hint, canonical WKWebView fix for flaky `position: fixed`.
- Hero photo via CSS `background-image`, **never `<img>` children**. `<img>` inside a `translateZ(0)` GPU-layered fixed parent silently fails to paint on WKWebView (PM-220.5).
- Day/night swap via `.is-night` class on the hero, set by inline script before paint based on `getHours() < 6 || >= 19`.
- `main padding-top` matches hero height; `.wrap` has `background: var(--bg)`. Padding lives on the transparent element, never on the backgrounded element (PM-220.2). Spacer must be see-through.
- Gradient overlay is dark-top + clear-middle + dark-bottom: `linear-gradient(180deg, rgba(13,43,43,0.55) 0%, .25 22%, .05 45%, .05 60%, .25 80%, .50 100%)`. Top scrim for text legibility, middle clear so photo is the visual focus, bottom scrim for band-to-content transition (PM-223.2).
- `body::before` glow must be suppressed on hub pages: `body.<hub>-page::before{display:none}`. Same-z-index conflict with the hero on WKWebView (PM-220.3).
- `.wrap .fade` animation must be killed on hub pages: `body.<hub>-page .wrap.fade{animation:none}`. Transform on wrap creates stacking context interference (PM-220.3).
- z-index discipline: hero `z:1`, wrap `z:2`. Unambiguous.

### Typography invariants

- **Eyebrow = page name = primary focal point.** `1.6rem`, weight `700`, uppercase, letter-spacing `0.12em`, colour `var(--teal-lt)` (NOT white — PM-226 confirmed Dean's brand call). Text-shadow `0 2px 14px rgba(0,0,0,0.85), 0 1px 3px rgba(0,0,0,0.6)`.
- **Headline = tagline = supporting subtitle.** Playfair Display, `1.1rem`, weight `500`, line-height `1.25`, colour `rgba(255,255,255,0.92)`, `max-width: 85%`. Text-shadow `0 2px 14px rgba(0,0,0,0.75), 0 1px 3px rgba(0,0,0,0.5)`.
- Content layer padding: `calc(env(safe-area-inset-top, 0px) + 20px) 20px 0`. Status-bar clearance on iOS.
- Hierarchy is page-name-dominant, tagline-supporting. The reverse (tagline dominant) was tried and Dean rejected it (PM-224).

### Image production spec

- 1024 × 1024 progressive JPEG, quality 82.
- Source files (typically Gemini-generated at 1254×1254) resized via Python PIL `Image.LANCZOS` before commit.
- Stored at repo root as `/<hub>-hero-day.jpg` and `/<hub>-hero-night.jpg`.
- Both URLs added to `sw.js` `urlsToCache` array for offline support.
- `background-position` chosen per image composition. People in lower portion → `center bottom` (Connect's choice). Scenery distributed → `center center`. Sky as focus → `center top`.
- Brand grading line for Gemini: "Colour grade: deep teals and greens, warm highlights, no text, no logos."

### Editable rotating tagline (PM-225)

- Tagline pool stored in `public.taglines` Supabase table: `id uuid PK, text text, position int, active boolean, created_at, updated_at`. RLS `SELECT` for `anon + authenticated` where `active = true`. Edit via Supabase Studio.
- Rotation index: `Math.floor(Date.UTC(localYear, localMonth, localDate) / 86400000) % count`. Local-midnight-anchored day index. Same value for every member in the same timezone on the same date. Rolls over at local midnight on next page load (not mid-session).
- localStorage cache key `vyve.taglines.v1` for instant paint on next-load. First-ever visit shows the literal markup default per honest-paint contract (§23.46).
- Background fetch updates cache + repaints headline if rotation index changed.
- Markup contains a static default tagline. JS swaps it once the fetch settles. Fetch failure leaves the default in place.
- **Default for Mind / Body / Index: share the existing taglines pool.** Five Connect taglines work as VYVE-wide brand copy. If a hub needs its own pool later, add a `hub` column and filter the fetch.

### Page identity

- `<body class="<hub>-page hub-page">`. Both classes required. `hub-page` is the cross-cutting class that drives topbar suppression (nav.js JS-guard) and hub-page-scoped CSS (PM-218/219).
- `body.<hub>-page .mph-page-label{display:none}` to suppress the nav.js topbar page-label (the in-hero eyebrow is the page identifier now).

### Diagnostic-first principle (applies to all visual debugging)

When a CSS edit produces no visible change OR a known-correct DOM doesn't render visually, **ship a diagnostic build with extreme high-contrast values** (lime green text, magenta outlines, yellow tinted backgrounds) before continuing CSS speculation. PM-220.4 and PM-223.1 both used this pattern; each isolated the variable in one Dean cycle versus the multi-cycle CSS speculation that preceded them. Predict the three diagnostic outcomes before shipping — (a) renders correctly = original issue was elsewhere (contrast, position, etc), (b) container renders + content doesn't = element-specific render failure, (c) nothing renders = DOM / display issue. Pattern is borderline §23 but not yet promoted; codified in the playbook.

### Shipping order

Mind → Body → Index. Mind has the lowest content density and is the cleanest place to validate the doctrine on a second page. Index is busiest and benefits from any tuning learned on the simpler hubs.

### Related rules

§23.42 (every vyve-site commit needs sw.js + vbb-marker), §23.46 (honest-paint default in markup), §23.48 (Connect freshness model — tagline rotation is Pattern 2 catalogue), §23.51 (when CSS produces no visible change, audit before re-tuning — connects to the diagnostic-first principle), §23.54 (SW install must use `cache: 'reload'` — without this the hero ships never reached the device for 4 cycles).

---


### §23.56 — Optimistic-first persist-then-upload pattern (PM-239, 23 May 2026)

**Applies to:** any write that combines remote storage (slow CDN/network) with a locally-renderable artefact (image, file, generated text). Examples: avatar upload (shipped PM-239), Connect post media when shipped, custom workout photos if added, member-generated content uploads.

**The pattern:**

1. **Produce a local representation first.** For images, `blobToDataUrl(blob)` — data URL preferred because it survives page reload; `URL.createObjectURL` does not.
2. **Paint the UI from the local representation immediately.** No spinner, no "Saving…" toast, no awaiting. Member's mental model is "I changed this and it changed."
3. **Persist the local representation to ALL client-side caches that any subsequent read might consult.** For VYVE that's Dexie + every relevant localStorage key + every relevant page-scoped cache (e.g. `vyve_settings_cache`, `vyve_avatar_url_<email>`). The local-only nature of the representation is irrelevant — it renders fine in `<img>`, the persistence layer doesn't care.
4. **Confirm + toast immediately** — "Photo updated ✓", not "Saving…".
5. **Run the network write in a fire-and-forget IIFE.** No `await` from the calling scope.
6. **On network success, swap the local representation for the canonical server URL** in all the same caches. Re-render with the canonical URL so the browser primes the SW runtime cache with the canonical bytes (the data URL was inline, never went through the SW). Future cold-boots read the smaller canonical URL not the multi-KB data URL.
7. **On network failure, keep the local representation painted.** Toast "Saved locally — sync failed, will retry on next change". Member's next save attempt re-runs the optimistic flow with a fresh blob. No lost work.

**Anti-pattern this replaces:** `await uploadX → await persistX → renderUI → showToast` — critical-path network write blocks UI, leaves cold-boot stale if member navigates away mid-upload.

**Doesn't apply to:** writes that NEED server confirmation before UI changes — payment, account deletion, persona change (UI state IS derived from server state, not from a local artefact). Those still await server response.

**Reference implementation:** settings.html `handleAvatarPick` → crop modal `onConfirm` callback (PM-239 vyve-site `994e5d9b`).

### §23.57 — Hub-page photographic hero seam: canonical scrolling-fade recipe (PM-238 → PM-244, 23 May 2026)

**Applies to:** any portal page with a `position:fixed` photographic hero band at the top + scrolling content below. Currently `connect.html`, `mind.html`, and `exercise.html` (the "Body" hub — see §23.61 for the body↔exercise.html naming convention). Will apply to `index.html` if/when it gets a photo hero (Premium Feel campaign sequel work).

**The problem.** A fixed-position photographic hero meeting solid-bg scrolling content below creates a hard horizontal seam at the photo's bottom edge. The seam reads especially bad in light mode where the photo's dark teal lower zone falls off into near-white page content. In dark mode the colour proximity hides the seam but the edge is still visually wrong.

**Six commits of failed approaches before this recipe stuck:**

| PM | Attempt | Why it failed |
|---|---|---|
| 237 | Two-layer gradient on `.connect-hero-overlay` with `[data-theme="light"]` override | Painted on the fixed photo — didn't scroll. Dean's correct ask: fade should belong to the content. |
| 238 | Background gradient on `.wrap` top, `var(--bg)` endpoints | Wrap top sat flush below photo. Gradient painted in air between photo and content; both endpoints were essentially same-colour against the body radial gradient. Invisible. |
| 240 | `.wrap { margin-top:-80px; padding-top:80px }` to overlap photo, with background gradient | Mental model right (overlap photo). But WKWebView paint-order on background-property + overlapping fixed sibling + main's stacking context combined to make the gradient invisible. |
| 241 | Body-level fixed-position `.connect-hero-fade` element | Visible at last but fixed = didn't scroll. Cut through content mid-page when member scrolled. |
| 242 | Absolute-positioned `.connect-hero-fade` as first child of `.wrap`, `main { z-index: 2 }` | Positioning + scroll behaviour correct. Gradient still appeared invisible because of colour proximity bug from PM-238 striking in a new place (now over photo's dark-teal zone). |
| 243 | Debug ship with `background: red` | Proved PM-242's positioning + scroll worked perfectly. Isolated the real bug as colour proximity (gradient endpoints visually identical against photo's dark zone). |
| **244** | **Three-stop rgba gradient hitting opaque at 75%, theme-scoped override** | **Ships.** |

**The canonical recipe.** Verbatim from shipped `connect.html` PM-244 (vyve-site `a2e12cb0`):

1. **Bump `main` z-index from 1 to 2.** The hero is `position:fixed; z-index:1` at body level. Without this bump, main's z-index:1 tied with hero's z-index:1 and relied on DOM-order tie-break. WKWebView's paint order on `transform:translateZ(0)`-marked fixed elements made the tie-break unreliable for property-on-overlapping-element approaches. With main at z-index:2, the entire scrolling document layer unambiguously beats the hero in body stacking. No tie-break dependency.

```css
main{position:relative;z-index:2;}
```

2. **Add a dedicated `<div class="X-hero-fade">` as the FIRST CHILD of `.wrap`.** Not inside `<main>` directly, not a sibling of the hero at body level — must be inside the wrap so it scrolls with the wrap's box. Dedicated element, not a background-property hack.

```html
<main>
  <div class="wrap fade">
    <div class="connect-hero-fade"></div>
    <!-- ... rest of content ... -->
```

3. **Position the fade band absolute, anchored to wrap top, lifted up 80px via translateY(-100%).** The wrap already has `position:relative; z-index:2` (now inside main's z-index:2 stacking context). `top:0` puts the fade at wrap top, `transform:translateY(-100%)` lifts it 80px above. As wrap scrolls, fade scrolls with it. `height:80px` chosen by feel — long enough to feel soft, short enough not to swallow first content widget. Adjustable per page.

```css
.connect-hero-fade{
  position:absolute;
  top:0;
  left:0;
  right:0;
  height:80px;
  transform:translateY(-100%);
  pointer-events:none;
  z-index:1;
}
```

4. **Gradient: three-stop rgba, hits opaque at 75% Y not 100%.** A linear gradient from `transparent` to `var(--bg)` will be invisible when both endpoints are nearly the same colour against the photo backdrop. Use a 3-stop curve that hits ~60% opacity at 40% Y and full opacity by 75% Y. This guarantees visible "thickening" mid-band regardless of what's behind it, and full coverage at the seam. **rgba hardcoded per theme, no `color-mix` dependency** (per §23 doctrine carried over from PM-237 — keeps iOS Safari 16.2+ floor unnecessary). Theme-scoped via `[data-theme="light"]` override.

```css
.connect-hero-fade{
  background:linear-gradient(
    to bottom,
    rgba(10,31,31,0)   0%,
    rgba(10,31,31,0.6) 40%,
    rgba(10,31,31,1)   75%,
    rgba(10,31,31,1)   100%
  );
}
[data-theme="light"] .connect-hero-fade{
  background:linear-gradient(
    to bottom,
    rgba(240,250,248,0)   0%,
    rgba(240,250,248,0.6) 40%,
    rgba(240,250,248,1)   75%,
    rgba(240,250,248,1)   100%
  );
}
```

5. **`pointer-events:none`.** Fade band must never intercept taps on the photo or content beneath.

**Per-page application checklist.** When applying this to mind.html / exercise.html / index.html:

- [ ] Confirm the hero element has `position:fixed` with a `background-image` (not an `<img>` child — WKWebView img-paint failure per PM-220.x).
- [ ] Confirm `<main>` exists and has `position:relative; z-index:N`. Bump N to 2 if not already.
- [ ] Confirm `.wrap` (or page equivalent) has `position:relative` so the absolute fade child can anchor.
- [ ] Add `<div class="X-hero-fade"></div>` as FIRST child of the wrap, before any content.
- [ ] Add the CSS rule + light-theme override. Class name per page: `.connect-hero-fade`, `.mind-hero-fade`, `.exercise-hero-fade`, `.index-hero-fade`.
- [ ] Test on device: scroll the page. Fade band must scroll with content, dissolve must be visible against the photo's bottom edge in both themes.
- [ ] If invisible: ship a debug version with `background: red;` to isolate. Per the meta-lesson below.

**Meta-lesson — promote to its own §23 if it bites again.** When a CSS visual effect "doesn't work" across 2+ fix attempts and each fix looks the same, the next commit MUST be a debug ship with a guaranteed-visible value (solid colour, larger size, neon) to isolate the failure mode. Diagnosis before more attempts. Six commits on this seam — could have been three if I'd gone to debug-red at PM-241 instead of PM-243.

**Reference implementation.** `connect.html` PM-246, vyve-site `ec3f2c30` (replaces previous pointer to PM-244 `a2e12cb0` which was silently reverted by 59afbb85 within 16 minutes of shipping — see §23.58 for the gotcha and PM-246 for the recovery). `mind.html` PM-246 implements the recipe verbatim with `.mind-hero-fade` class. `exercise.html` PM-252, vyve-site `5beef819` (24 May 2026), implements the recipe verbatim with `.body-hero-fade` class — third hub page to ship the pattern, day/night 2-variant swap mirroring connect's scheme. Key lines: `main{position:relative;z-index:2;}` (early CSS block); `.X-hero-fade{...}` rule + `[data-theme="light"] .X-hero-fade{...}` override; `<div class="X-hero-fade"></div>` as first child of `.wrap` (mind/connect use `.wrap fade`; exercise uses plain `.wrap` because it has no `fadeUp` animation to suppress — both work identically for the recipe).

---

### §23.58 — Whole-file commits from stale workbench copies silently revert same-day unrelated work (PM-244 → 59afbb85 → PM-246, 23 May 2026)

**The hazard.** When a session starts work on file X with a workbench copy fetched at time T₀, and a different session ships unrelated changes to file X between T₀ and the original session's commit time T₁, a whole-file content commit from the original session will erase everything between T₀ and T₁. The commit message will say what the original session was doing (e.g. "Avatars on community surfaces"), so reviewers seeing the commit title won't catch that 80% of the diff is collateral damage to unrelated same-day work.

**The canonical case.** PM-244 (`a2e12cb0`, 16:32 UTC) shipped the §23.57 fade recipe on connect.html — `main z-index:2`, absolute-positioned `.connect-hero-fade` as first child of wrap, 3-stop rgba gradient, `[data-theme="light"]` override. Sixteen minutes later, `59afbb85` (16:48 UTC) shipped avatar work on connect-feed.html that ALSO whole-file rewrote connect.html with a workbench copy pre-dating PM-244. Net effect: PM-244 was cleanly reverted (z-index back to 1, fade back to `position:fixed`, gradient back to 2-stop, light-theme override gone, fade div relocated outside main). Avatars themselves landed correctly. The revert was undetected for the rest of the day until Dean asked to apply §23.57 to mind.html and Claude reading connect.html as the §23.57 reference found it didn't match the recipe.

**Why §23.41 fresh-HEAD fetch is the only defence.** The fresh-HEAD fetch right before commit is meant to detect "the file on main changed since my workbench was loaded — I need to merge". A whole-file content commit without that check silently writes whatever was in the workbench, regardless of what's actually on main. The blob SHA stage of Git Data API doesn't surface the conflict because the commit's parent is correctly set to current HEAD — the conflict is at the content level, not the ref level.

**The hard rule.**

1. **Any commit that touches a file's content as a whole-file write (which is most multi-file edit sessions) MUST be preceded by a fresh-HEAD fetch of that file from main, immediately before the commit batch is assembled.** Not at session start. Not at edit-time. Immediately before commit.
2. **If the freshly-fetched main copy of any file differs from the workbench base copy, STOP.** Either (a) re-apply the workbench edits on top of the fresh main copy, or (b) abort and surface the parallel ship to Dean for a merge decision.
3. **In bash/Python commit scripts, the fresh-HEAD fetch is a hard precondition.** `commit.py`'s `EXPECTED_HEAD` constant is the simplest enforcement — if HEAD has drifted from expected since the script was written/the workbench loaded, the script must abort.
4. **The §23.41 fresh-HEAD discipline applies to EVERY file in the commit batch, not just the file the session "is about".** PM-246's recovery was needed because the avatar session correctly fresh-fetched connect-feed.html but didn't think to fresh-fetch connect.html which it also touched.

**Meta-lesson — defence in depth.** This is a §23.41 violation by definition, but §23.41 as previously written emphasised the SHA-vs-ref-on-main check at commit time. That check passes here (parent SHA was correct), so §23.41 needs to be re-read as "fresh-fetch the CONTENT of every file you're about to write, not just confirm the ref hasn't moved". This addendum is codified here as §23.58 rather than buried in §23.41 because the failure mode is different enough to warrant its own anchor — and the recovery cost (one Claude session reading reference docs and finding the doc-impl drift) was lucky. Without that, the regression would have shipped to members.

**Defensive verification idea (low-priority playbook item).** A post-commit diff-the-diff script: for every file in a new commit, fetch the file's content from the previous commit and the new commit, diff them, and surface any sections that differ but aren't mentioned in the commit message. Cheap to write, would have caught this in ~1 second.

---
### §23.59 — VYVE is a native app, not a browser: audit and suppress every WKWebView/Chrome default that leaks "I am a web page" feeling into the app (PM-250, 23 May 2026)

**Status: HARD RULE.** Earned PM-250 from three regressions Dean caught on device in one session — text-selection callout on body copy, "Open in Safari" preview on internal links, full-screen "rotate to portrait" overlay still firing from PWA-era `auth.js` code.

**The doctrine.** Since iOS 1.2 (28 April 2026) and Android 1.0.2 the product has shipped as two Capacitor binaries wrapping the `vyve-site` web shell (per §23.20 "VYVE is not a PWA"). But the web shell still carries assumptions from the PWA era — defaults that were correct in a browser tab now feel wrong inside a native app, because members expect native-app interaction physics, not browser physics.

**The four canonical web-browser defaults that DON'T belong in a native app:**

1. **Long-press text → iOS callout toolbar** (`Copy | Look Up | Translate`). Native apps almost never expose this on incidental UI copy; it's a browser pattern. Suppress globally via `-webkit-touch-callout: none` on `html, body`. Re-enable on inputs, textareas, contenteditable, and an explicit `.selectable` opt-in utility for surfaces where copy-paste IS the intent (journal entries, AI response cards, code blocks).
2. **Long-press internal link → "Open in Safari" preview** (Peek/Pop in older iOS terms). Same fix: `-webkit-touch-callout: none` on `html, body` suppresses it for all link types globally.
3. **Tap highlight flash** — the grey/blue rectangle that briefly flashes when a button or link is tapped. Browser-default visual that's never been seen in native iOS or Android UI. Suppress globally via `-webkit-tap-highlight-color: transparent`.
4. **Text-selection drag-handles on body copy** — if a member long-presses to start selecting on a headline, body paragraph, or button label, the iOS selection magnifier appears and they enter a selection state on something that was never meant to be selectable. Suppress via `-webkit-user-select: none; user-select: none` on `html, body`. Re-enable on inputs + `.selectable`.

**The orientation question (PM-250 specific).** Locking portrait at the OS layer is the right place to do it — not in JS, not in CSS. `Info.plist` `UISupportedInterfaceOrientations = [UIInterfaceOrientationPortrait]` on iPhone (iPad keeps portrait + portrait-upside-down only — no landscape on tablets either). Android `AndroidManifest.xml` MainActivity gains `android:screenOrientation="portrait"`. The OS then ignores the rotation hardware event entirely; the WebView never rotates, no CSS or JS guard is needed. Any JS-side `screen.orientation.lock()` or CSS-side `@media (orientation: landscape)` overlay is a tell that the OS layer hasn't been set correctly — fix at the OS layer and delete the workaround.

**External link routing.** Browser-default for an `<a href="https://example.com/...">` tap inside WKWebView is to navigate IN the WebView (replacing the app's web shell with the external page). That's wrong: members get visually trapped in a foreign site with no way back to VYVE except the OS back gesture. The native-app pattern is to detect non-`online.vyvehealth.co.uk` URLs at click time and route through `@capacitor/browser`'s `Browser.open()` which presents `SFSafariViewController` (iOS) / Chrome Custom Tab (Android) — a modal browser sheet WITH a "Done" affordance back to the app. The plugin is already installed in `vyve-capacitor`; wiring is the client-side click handler.

**Sweep mandate.** Whenever an iOS-or-Android device test surfaces a "this feels like a web page" moment, treat it as evidence the wider audit is incomplete and re-grep the portal for the cousin defaults:

- `grep -ri "user-select\|touch-callout\|tap-highlight\|orientation\|landscape\|portrait" .` across vyve-site
- `grep -ri "browser\|safari\|chrome\|tab\|web app\|PWA\|install.*app\|add.*home.*screen" .` across vyve-site (member-facing copy only — internal-doctrine references are fine)
- Audit every `<a href>` for `target="_blank"` and external URLs — these are the candidates for Browser-plugin routing
- Audit every `window.open` / `location.href` for external destinations
- Confirm `Info.plist` orientation array matches intent (portrait-only on iPhone is the current VYVE policy)
- Confirm `AndroidManifest.xml` MainActivity has `screenOrientation` set
- Confirm there are no `meta viewport user-scalable=yes` or zoom-related metas — pinch-zoom on a native app surface is a tell (already disabled cohort-wide per earlier work, but worth checking)
- Confirm no PWA install banners or "add to home screen" prompts remain (removed 04 May PM-3 per §23.20 — re-verify periodically)

**Why this matters.** Members install VYVE from the App Store / Play Store and expect to interact with a native app. Every browser-default that bleeds through is a small "wait, am I in Safari?" moment that erodes the perceived quality of the product. The fixes are individually trivial CSS lines but collectively they're the difference between "feels like a website wrapped in an app" and "feels like a real app". Per north-star (memory: "make this feel like a premium app with absolutely no lag and instant feel") this is load-bearing polish, not optional polish.

**Cross-reference.** Pairs with §23.20 ("VYVE is not a PWA — it's two Capacitor binaries"). §23.20 is the strategic framing; §23.59 is the tactical audit checklist that flows from it.


### §23.60 — bash_tool `cd` does not persist across calls (PM-251, 23 May 2026)

**Status: HARD RULE.** Earned PM-251 from two real-world miscalls in the same session — both diagnosed initially as "GitHub returned bad credentials" or "API returned empty data" when the actual failure was a wrong-directory write that produced empty/garbage files which got misread.

**The mechanic.** Every `bash_tool` invocation starts a fresh `/bin/sh` (or equivalent) — `cd` from any previous call is gone. Patterns that *look* like they preserve state across calls don't:

```bash
# Call 1
cd /home/claude/work && mkdir -p out

# Call 2 — NOT in /home/claude/work, lands in /
curl ... > result.txt    # ← writes to /result.txt, not /home/claude/work/result.txt
```

The wrong-directory write may succeed (file created in `/`, possibly with no error if perms allow), or silently fail (write to `/` denied, file created as empty/zero-byte by another part of the pipeline). Either way the downstream step reads what looks like a real file with garbage contents, and the interpretation becomes "the API returned garbage" rather than "we wrote to the wrong place".

**Rule.** Every multi-step bash_tool sequence that writes files must either:

1. **Use absolute paths throughout** (`curl ... > /home/claude/work/result.txt`), OR
2. **Re-`cd` to the working directory at the start of every single bash_tool call** (`cd /home/claude/work && curl ...`)

The first is cleaner — preferred. The second is acceptable when iterating on a known location. **Mixing the two** — `cd` once at the start of a series, then relative paths in subsequent calls — is the actual antipattern. The mental model "we're working in /home/claude/work" carries from one call to the next in Claude's reasoning but not in the shell.

**Why this isn't covered by existing rules.** §23.41 (parallel-session safety) covers SHA freshness across calls. §23.52(a)/(b)/(c) covers argv overflow and SHA validation in the commit pipeline. §23.53 covers JSON parsing fragility. §23.60 covers the shell-state-discontinuity assumption, which is upstream of all three — if files land in the wrong directory, none of the post-write checks fire usefully because the empty/wrong file passes shape validation in the read step.

**Diagnostic tells that §23.60 fired:**

- Files reported as "0 bytes" or "no such file or directory" despite curl returning 200
- Output files visible at `/` (root) or wherever the parent shell starts
- API responses interpreted as "bad credentials" / "no data" when manual probe of the same URL succeeds
- File-presence checks (`ls -la`) showing files in unexpected locations

**Recovery.** When the symptom shows up, immediately re-issue the failing command with absolute paths and inspect both the intended and the unintended location for misplaced files. The wrong-directory artifacts are often safe to leave (no perms to write usually means nothing landed) but worth `rm`'ing if visible to keep the workspace clean.

**Cross-reference.** Pairs with §23.45 (PAT-direct path mechanics — the same pipeline this rule patches) and §23.52 (write-path discipline — §23.60 is the prior step's discipline).


### §23.61 — When Dean says "body" he always means `exercise.html` (PM-252, 24 May 2026)

**Status: HARD RULE.** Earned PM-252 when Claude initially blocked on a hub-hero ship because Dean's instruction said "apply the hub-hero treatment to body.html" but no `body.html` file exists in `vyve-site`.

**The mechanic.** VYVE's three pillars are Body / Mind / Connect. The hub pages for Mind and Connect are file-named after the pillar (`mind.html`, `connect.html`). The hub page for Body is historically named after the dominant content category that lived there first — `exercise.html` (the Exercise Hub with Movement / Workouts / Cardio / Classes streams). The page title is "VYVE — Body", the body class is `hub-page` (PM-252 adds `body-page`), the nav uses "Body" not "Exercise" as of PM-154 (16 May 2026 — Exercise hub renamed to Body in nav copy; the underlying filename was never changed). The naming asymmetry is permanent unless we ship a route migration as its own PM — see "Why not rename" below.

**The rule.** When Dean says "body" or "body.html" or "the body page" in any VYVE engineering context, he means `exercise.html`. Don't ask. Don't stop. Substitute and proceed. Memory edit #22 codifies this for future sessions; this brain entry codifies it for any session that does not have the memory loaded (e.g. a fresh Claude looking at the repo cold).

**Hub-page work referencing "body" mirrors `mind.html` and `connect.html`.** Specifically:

- `<body class="body-page hub-page">` (parallel to `mind-page hub-page` and `connect-page hub-page`)
- Photographic hero element class `.body-hero` (parallel to `.mind-hero`, `.connect-hero`)
- §23.57 fade band class `.body-hero-fade` (parallel to `.mind-hero-fade`, `.connect-hero-fade`)
- Hero photo asset paths `/body-hero-day.jpg` + `/body-hero-night.jpg` (parallel to connect's `connect-hero-day/night.jpg`)
- Eyebrow text "Body", not "Exercise"

**Why not rename `exercise.html` to `body.html`.** Tempting on first reading but it's a route migration, not a hub-hero job. It would touch: nav.js link entries, internal `<a href="exercise.html">` references across the portal (dashboard cards, related-page links), `sw.js` precache list, bundled iOS+Android binaries (cached members would 404 the new path until they re-launch and pick up new precache), HubSpot/PostHog event URLs that include the path, Brevo email templates that link in, and the Capacitor `server.url` fallback handling. Each is small but together it's a full PM of audit work for what would deliver zero member-visible benefit — members never see filenames. The naming asymmetry is purely a developer-facing wart and it lives in this brain entry to neutralise it.

**Cross-reference.** §8 hub-page hero pattern (which references all three: connect.html, mind.html, exercise.html). §23.57 fade recipe applies to all three.


### §23.62 — Hub-page doctrine adherence: audit against `playbooks/hub-page-hero-doctrine.md` + §23.55 + §23.57 before improvising (PM-261b → PM-267b, 24 May 2026)

**Earned PM-261b → PM-267b** (seven vyve-site commits — see brain/changelog.md 2026-05-24 entry for the b-suffix explanation). A seven-commit arc on the home hero that should have been one commit. PM-260 left the home page with non-canonical hero proportions (`max(360px, 48vh)`, then `max(300px, 40vh)`) vs Connect's canonical `max(250px, 35vh)`. Dean's "the hero has too much dead space" feedback should have triggered an immediate diff of home against `connect.html`. Instead it triggered five iterations of *positional* fixes (background-position, negative margin on `.wrap`, mood-panel anchor recalcs, greeting top offsets) — each individually defensible but collectively three commits papering over the structural issue. The §23.57 fade element was already in the home page's CSS + DOM (shipped in PM-256) but was being dragged out of its useful position by the negative-margin band-aid, so it had nothing to fade into. PM-267b closed the arc by deleting the band-aid and standardising the hero to canonical hub-page proportions.

**Rule.** When working on a page that is one of the four hubs (Home / Body / Mind / Connect) and a hero-area change is requested:

1. Before touching CSS, read `playbooks/hub-page-hero-doctrine.md` and re-confirm §23.55 (hub-hero layout invariants) + §23.57 (scrolling-fade recipe) + §23.61 (Body = exercise.html). These three sections together are the canonical contract.
2. **Diff the target hub page against a known-canonical hub page** — Connect is the reference implementation, since it earned the §23.57 fade across PM-237 → PM-244 and the §23.55 layout across PM-216 → PM-226. Mind and Body inherited from Connect. Home shipped a hub-hero in PM-256 but with non-canonical 48vh / 40vh proportions; PM-267b brought it into the standard.
3. **If the page is already §23.55/§23.57-compliant** and the request is purely a tonal refinement (image swap, background-position tweak, eyebrow text change), proceed normally.
4. **If the page deviates from canonical** (different hero height, missing fade element, fade element in the wrong place, ad-hoc margin tricks on `.wrap`/`main`), the first commit must restore canonical compliance. Subsequent commits do the tonal work on top.

**Anti-pattern.** Negative `margin-top` on the `body.<hub>-page .wrap` selector. The wrap is the §23.57 fade element's anchor — pulling the wrap upward pulls the fade upward with it, into the photo zone where it has nothing to fade. If the dead space between hero and content feels wrong, the answer is one of: (a) hero band too tall — shrink to canonical 35vh; (b) fade element missing or wrongly positioned — add per §23.57 recipe; (c) sec-label margins too generous — adjust the `.sec-label` rule, not the wrap. *Never* `.wrap { margin-top: -Npx }`.

**Audit signal.** Any commit that adds `margin-top` with a negative value to a hub-page wrap selector is a §23.62 smell. Search `git diff` for `margin-top: -` before approving any hero-area commit.

**Why this rule was missed for so long.** The hub-page doctrine is well-documented (master.md §23.55, §23.57, §23.61 + dedicated playbook) but the documentation is scattered across multiple §23 sections and a playbook file. There's no single "check this first" entry point for hub-page work. §23.62 is that entry point.

**Related rules.** §23.55 (hub-page hero layout invariants), §23.57 (scrolling-fade recipe), §23.61 (Body = exercise.html), §23.42 (every vyve-site commit needs sw.js + vbb-marker bumped together).

### §23.52(a) corollary — bash `for` loops with embedded base64 of multiple files via `python3 -c` silently reuse previous payload (PM-261b, 24 May 2026)

**Earned PM-261b first commit attempt.** Five-file commit (3 binary JPGs over 95KB each + 2 text files) issued through a bash `for` loop that embedded each file's base64 content into a `python3 -c` argv to write the JSON blob payload. argv overflow on files >~32KB caused `python3 -c` to abort silently with `/bin/sh: python3: Argument list too long`. The shell loop continued. The curl POST that followed re-sent the previous request body (which still pointed at /tmp/blob_payload.json containing index.html's content). Result: sw.js + 3 JPG blobs all returned the same SHA as index.html — caught immediately by §23.52(b) post-commit md5 verify, which would have shipped corrupt files otherwise.

**Rule (corollary to §23.52(a)).** When a commit flow needs to create multiple blobs from files of varied size, do not embed file content in bash argv at any stage. The entire commit pipeline must be a single Python process (urllib.request) — blobs, tree, commit, ref update, post-commit verify, all in one script. Reference implementation `/home/claude/commit.py`. The dash-vs-bash, `python3 -c` embedded payload, and `for fn in ...; do create_blob` loop patterns are all forbidden for multi-file commits.

**Why this is a corollary and not its own rule.** §23.52(a) already says "never substitute large file bodies into bash argv via `-d \"$body\"`". The corollary extends the same logic to *any* mechanism that puts file content in bash argv — including `python3 -c "...$base64..."`. Same failure mode (silent argv overflow), same recovery shape (re-issue via pure Python), same audit signal (multiple blob SHAs identical when files differ).

**Audit signal.** After every blob create batch, sanity-check that all returned SHAs are distinct (unless two files genuinely have identical content, which is rare). Pure Python urllib bypasses argv entirely — JSON body lives in a Python dict, gets serialised in-memory, sent as request body via `urllib.request.urlopen(req, data=...)`.



### §23.52(b) corollary — first-N-chars verification on UTF-8 files is a false-positive trap; use md5 (PM-269, 24 May 2026)

**Earned PM-269.** Post-commit verification script used `f.read(100)` (Python text-mode, returns 100 characters via UTF-8 decode) on the local side and `urlopen(...).read(100).decode('utf-8')` (binary read of 100 bytes, then decode) on the remote side. The two values diverged cleanly even though the files were identical — local got 100 characters, remote got however-many-characters 100 bytes decoded into (~94-98 in practice, less if there's an em-dash, smart quote, or other multibyte char in the prefix). Triggered a false MISMATCH warning that almost masked the underlying success.

**Rule.** Post-commit verification on text files must use full-content md5 (or full bytewise compare) against the repo at the new commit SHA. Never first-N-chars on UTF-8 content; the byte-to-char count mismatch makes the assertion fundamentally unsound. Pattern: `hashlib.md5(local_bytes).hexdigest() == hashlib.md5(remote_bytes).hexdigest()`. Reference implementation in `/home/claude/work/commit_pm270.py` onwards.

**Why this is a corollary and not its own rule.** §23.52(b) already mandates post-commit verification via `commits/{sha}` files[].status array + content re-fetch. The corollary is about *how* the content re-fetch comparison is done — md5/full-byte, never first-N-chars on text files.

**Audit signal.** If first-N-chars verification reports MISMATCH but md5 matches and the file sizes match, the cause is multibyte-char accounting; the file is actually fine. The fix is to delete the chars-count branch and only md5-compare.

### §23.63 — Re-read campaign specs before writing code in their domain; brain-load is not sufficient (PM-269 → PM-270, 24 May 2026)

**Earned PM-269 → PM-270.** PM-269 shipped a broken light-mode treatment on the Today's Focus carousel because I wrote CSS from partial recall of the Option C spec rather than re-reading the PM-268 plan or the `staging/focus-card-mockup.html` reference before opening the editor. What landed was closer to Option B (gradient overlay on full-bleed photo) than Option C (structural grid 1fr 1fr split). Dean had to paste the spec back from the previous session to correct the implementation. PM-270 then shipped the right architecture.

**Rule.** When a multi-session campaign locks an architectural decision (e.g. "Light mode = Option C"), the next session that touches that surface must re-read the spec from the brain or staging *before* writing code in its domain — not from session-start brain-load memory. Brain-load gets the high-level state into context, but campaign-specific architectural specs (CSS treatments, DOM structures, data shapes) need a deliberate fetch + re-read before implementation, especially when the spec is detailed enough that "from memory" reconstruction is plausible but inevitably lossy.

**Pattern.** For any campaign that locked a non-trivial architectural decision in a previous session:

1. Identify the campaign's spec source — usually a brain/master.md §19 entry, a staging mockup file, or a playbook in `/playbooks/`.
2. Re-read the spec end-to-end before writing the first line of CSS/JS in that campaign's domain.
3. If the spec references a mockup that may have been built in-chat (not committed), ask Dean for it before improvising.
4. Quote the spec back in the commit message if any deviation was made, with reasoning.

**Audit signal.** If a campaign produces device-test feedback like "this isn't what we agreed" or "did you forget the X part of the spec", the next implementation in that campaign should re-read the spec source explicitly before touching the editor — and the commit message should reference the spec section that was re-checked.

**Why this matters beyond CSS.** Same failure mode could bite on data shape (forgetting a column in a Supabase write), DOM structure (omitting a wrapper element required by another script), or behavioural contract (wrong cohort gating on a feature flag). The discipline is medium-wide: re-read before implementing, regardless of the layer.



### §23.64 — CSS-only iterations that fail on device should trigger a hook-path audit, not another CSS pass (PM-283, 24 May 2026)

**Earned PM-283.** Three sessions (PM-280, PM-281, PM-282) shipped progressively tighter CSS for the focus-page done-state composition. None landed on device. Each session reviewed the prior session's commit, concluded the CSS spec needed further tightening, shipped another CSS pass. Root cause was that the `body.is-completed` class — the hook the entire CSS block hung off — was only being added on one of two code paths (post-Save via `focus-shell.complete()`, not the page-reopen guard that ran `swapView('view-done')` directly). Every "fix" was tightening rules that weren't applying at runtime on the path Dean was looking at.

**Rule.** When a CSS-targeted fix doesn't land on device, the next session's first diagnostic step is **not** another CSS pass. It is verifying that the trigger condition the CSS hangs off is actually being met at runtime, on every code path that activates the surface under review.

**Pattern.**

1. Identify the hook the CSS depends on — typically a class, attribute, data-state, or media-query state that gates the entire block (`body.is-completed`, `[data-loaded="true"]`, `.is-active`, `@media (prefers-color-scheme: dark)`).
2. Enumerate every code path that should produce that hook — UI flips, page-load guards, route-change handlers, observer callbacks, server-pushed state.
3. For each path, confirm the hook actually lands. Class adds get stamped, attribute writes succeed, data flips through, observers fire. Add console logging if you need to be sure.
4. Only after the hook is verified universal across paths should the next CSS iteration proceed.

**Sibling case — DOM attributes that diverge between paths.** Same failure shape applies when a page initialises in two routes (cold load vs SPA navigation, post-mutation vs page-reopen, online vs offline boot) and one route fails to set a data attribute or class that downstream code depends on. The fix is centralising the hook in shared infrastructure (a `MutationObserver` watching the underlying state) rather than per-page assertions, when the underlying state is observable.

**Audit signal.** If you find yourself shipping the 3rd CSS-only iteration on the same surface without device confirmation between rounds, stop. The problem is almost certainly not in the CSS at the next iteration's level of detail. Look for the hook.

**Implementation lever in this project.** When the hook is gated by a `swapView()`-like call that flips view classes, the centralising pattern is a `MutationObserver` in shared chrome JS that auto-stamps the dependent class on body/document. One place to maintain, every page benefits, no per-page wiring drift. The PM-283 fix used the existing `wireCompletionSlide` observer in `focus-shell.js` — it was already watching for the same state transition the CSS depended on, just for a different purpose (scroll behaviour). Adding the class-stamp alongside the scroll was one line.



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
| GitHub PAT (Composio fallback) | Stored in Supabase Vault as `GITHUB_PAT_CLAUDE` (project `ixjfklpckgxrwjlfsaaz`, secret UUID `0c17013f-c79b-4950-8e2f-589ef81078cc`). Fine-grained, VYVEHealth org resource owner, all-repos, Contents + PRs + Workflows R/W. **Claude fetches via Supabase MCP:** `execute_sql` with `SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'GITHUB_PAT_CLAUDE'` — never ask Dean to paste it. Used when Composio is down (per §23.45). Expires **20 June 2026** (calendar rotation required) — 30-day fine-grained token created during PM-185 Composio incident. |
| YouTube Data API v3 OAuth | Three Vault secrets in project `ixjfklpckgxrwjlfsaaz`: `YOUTUBE_OAUTH_CLIENT_ID`, `YOUTUBE_OAUTH_CLIENT_SECRET`, `YOUTUBE_OAUTH_REFRESH_TOKEN`. Google Cloud project `vyve-website`. Scope: `https://www.googleapis.com/auth/youtube`. Owner account: `team@vyvehealth.co.uk` (manager of 9 brand-account channels — Yoga, Mindfulness, Workouts, Weekly Check-In, Group Therapy, Events, Education, Podcast, plus a 9th). Provisioned 23 May 2026 (PM-215 prep). **Refresh token 7-day expiry while OAuth consent screen is in Testing state** (`refresh_token_expires_in: 604799`). Re-mint weekly via `https://developers.google.com/oauthplayground` (Use your own OAuth credentials → custom scope `https://www.googleapis.com/auth/youtube` → exchange code → copy refresh token → update Vault). Eliminate the rotation by submitting the consent screen for Google verification (one-time, ~3-7 day review). Backlog item for verification submission post-launch. |
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