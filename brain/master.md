# VYVE Health — Brain Master

<!--CURRENT_FRONT_START-->
## CURRENT FRONT (updated 2026-06-09, PM-584)

**Retention page complete: funnel + dormancy + day-N curve + streaks + critical events + cohorts + at-risk.**
**VYVE D7 retention 68% vs 15% industry benchmark — strong Sage story.**
**Streak avg 1.6d current / 2.7d best — streak formation is the main product gap.**
**Next: Activity Depth page (activity.html) — feature adoption, watch-time, time-of-day heatmap.**

**WARN: posthog-test EF still active — delete via dashboard.**
**WARN: sync-health-data EF dead since 24 May.**
**WARN: session-reminder-cron failing — §23.7.**
**iOS 1.5 / Android 1.0.6 in store review. Capawesome OTA never run (§23.106).**

<!--CURRENT_FRONT_END-->


> Single source of truth for the whole business. Last full rewrite 28 April 2026 PM; §1-18 re-audited and consolidated 26 May 2026 against live Supabase + GitHub state. If this drifts from live reality, rewrite it fully again — do not paper over. **Live counts (members, EF versions, table row counts, page state) live in the database and the repo — this doc never caches them.**

---

## 1. Company overview & legal

| Field | Detail |
|---|---|
| Legal name | VYVE Health CIC (Community Interest Company) |
| ICO registration | 00013608608 — registered March 2026, £52/year renewal |
| Business email | team@vyvehealth.co.uk (all business comms — never personal Gmail/Hotmail) |
| CEO / Founder | Lewis Vines — commercial, sales, content, copy sign-off |
| CTO / Co-founder | Dean Brown — technical, ~99% of build delegated to Claude |
| COO | Alan Bird — part-time shareholder, enterprise procurement background |
| Physical/Fitness Lead | Calum Denham — part-time shareholder, fitness content + programme review |
| Mental Health Lead | Phil — owns HAVEN clinical sign-off and mental health content |
| Sales | Vicki — outbound pipeline, enterprise prospecting |
| Community | Cole — member engagement, retention |
| Stage | Pre-revenue · MVP · trial cohort · iOS + Android live in stores |
| Cohort | Build/test cohort. ~20 trial-cohort members (23 in `members` live, mostly test accounts not real paying members). Single paying B2C: Paige Coult (joined 13 April, £20/month, still the only paying member). 3 admin operators in `admin_users`. Public push starting now. |
| Tagline | *Help yourself. Help others. Change the world.* |
| Mission | Proactive workplace wellbeing across three strategic pillars (Physical, Mental, Social) — expressed on the website as five (Mental, Physical, Nutrition, Education, Purpose) |

**CIC advantage.** Operating as a Community Interest Company gives a 6–8 point social-value uplift in public-sector procurement, unlocks grant streams closed to for-profits, and reinforces the charity mechanic. Not cosmetic — a procurement weapon and a capital flexibility lever.

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

Pre-call briefs via Sales Intelligence skill (8-step deep dive, ROI calculator, 20-competitor displacement table, objection scripts). Three Pillar Assessment as employer-facing prospect scoring tool. Public Sector Playbook (5 procurement routes, social-value scoring, tender template, 90-day action plan). Research Library with 20+ indexed studies and a Stat Bank of copy-paste statistics.

---

## 3. Business model & revenue streams

| Stream | Detail |
|---|---|
| B2C individual | £20/month per member. Stripe direct link. Onboarding via `welcome.html` (stream-aware since 19 April). |
| B2C trial → conversion | **LIVE end-to-end (PM-573 confirmed; Stripe webhook secret set).** 30-day free trial, then **£10/month-forever** conversion (`VYVE10`; a SEPARATE Stripe link from the £20 new-signup link, must NOT redirect to `welcome.html`). Access gated on `subscription_status` (cron flag-flip `expire_lapsed_trials`, never request-time date math) per §23.85. Off-app / IAP-compliant: wall → marketing-site `continue.html` (binds `members.id`) → £10/mo Payment Link → `stripe-webhook` EF flips `account_type→paid` + `subscription_status→active`. |
| B2B enterprise | £10/user/month. Contact-first sales. Volume tiers TBD before first enterprise contract; indicative bands: 50–200 full rate, 201–500 negotiable, 500+ bespoke. |
| Annual option | 10–15% discount — Lewis decision, Dean adds to Stripe once confirmed. |
| Positioning | Performance investment, not cost centre. ROI evidence anchored by Deloitte, RAND Europe, Gallup, Lancet, Warwick, UCL, WHO. |
| Series A targets | £1–2M ARR, 10%+ MoM growth, sub-8% churn, 100%+ NRR. |

---

## 4. Target market & enterprise pipeline

**Segments.** Private-sector enterprise (Sage warm lead, BT, Barclays, Balfour Beatty as priority targets). Public sector (NHS, councils, government) — CIC status the key wedge. Individuals direct via Stripe.

**Enterprise pipeline.**

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
| iOS app | Live on App Store, latest submission 1.4 in review (PM-413, 26 May) | LIVE |
| Android app | Live on Play Store, latest submission 1.0.5 in review (PM-413, 26 May) | LIVE |
| Presentation deck | Update once check-in sliders updated | UPDATE NEEDED |
| GDPR / DPA | Complete — swap client name in DPA before sending | COMPLETE |
| B2B pricing volume tiers | Lewis + Dean | TIERS PENDING |
| Health disclaimer | Done (Lewis confirmed PM-407, 26 May 2026) | COMPLETE |

---

## 5. Technology stack (complete)

| Technology | Detail |
|---|---|
| Portal hosting | GitHub Pages — `VYVEHealth/vyve-site` (private) → `online.vyvehealth.co.uk` |
| Marketing hosting | GitHub Pages — `VYVEHealth/Test-Site-Finalv3` → `www.vyvehealth.co.uk` |
| Admin console | Separate host — `admin.vyvehealth.co.uk` — served by `vyve-command-centre` repo |
| Native app delivery | `VYVEHealth/vyve-capacitor` (Dean's Mac at `~/Projects/vyve-capacitor`) is the Capacitor project that bundles the `vyve-site` web shell into both store binaries. **iOS: App Store LIVE on 1.7 (PM-569, 9 Jun 2026) — bundled mode, `server.url` REMOVED.** (1.5 was the first bundled submit PM-557; 1.6 submitted-then-cancelled; jumped straight to 1.7, now approved + live.) **Android: Play Store LIVE on bundled 1.0.6 versionCode 51 (approved 9 Jun, PM-573) — bundled, `server.url` removed, same as iOS.** Both stores ship the same web shell — single codebase, two binaries. **Deployment model (FLIPPED 2026-06-09 PM-569 — this reverses the PM-475 correction, which is now wrong):** iOS 1.7 ships with `server.url` removed, so **iOS members are FROZEN** on the vyve-site SHA baked into the 1.7 binary and receive changes ONLY via a Capawesome OTA (app `f9961f66` / prod channel `89e12796`). **No OTA has ever been pushed end-to-end (§23.106) — iOS members currently have no working update path short of a full store resubmit.** Dean alone runs the dev-loop server.url shell on his iPhone (→ `online.vyvehealth.co.uk`), so he sees every vyve-site commit live within the WKWebView cache window (2-15min); members do NOT. **Both platforms are now bundled (iOS 1.7 + Android 1.0.6).** A member freezes on the bundled vyve-site SHA the moment they install/update, so the OTA gap (§23.106) applies to the WHOLE cohort, not iOS-only. A member still on an older pre-bundle Android build keeps seeing live commits until they update. Only Dean's dev-loop iPhone is deliberately kept on server.url. vyve-capacitor REMOTE is behind Mac-local: the 1.5/1.6/1.7 ship-state (config server.url removal, version bumps) is uncommitted on remote (latest remote commit PM-560) — curate + commit per PM-413 Pending #2. |
| Brain | `VYVEHealth/VYVEBrain` — markdown source of truth, session-loaded at start of every Claude session |
| Authentication | Supabase Auth. `auth.js` v2.5 gates every portal page. `VYVE_RETURN_TO_KEY` in localStorage. Admin Console uses separate admin-side session. `is_admin()` SECURITY DEFINER RPC for Command Centre admin gating (PM-402). |
| Primary datastore | Supabase — project `ixjfklpckgxrwjlfsaaz` (West EU/Ireland, Pro plan). **120 public tables** as of 26 May 2026. |
| Portal AI | Anthropic API (Claude Sonnet 4). Server-side via Supabase Edge Functions only — never in committed HTML. Spend cap ~£50/month. |
| Operational AI | 24 custom Claude skills running daily/weekly/monthly intelligence, content, sales, and monitoring workflows for Lewis. |
| Automation | Make (Lewis only, social publishing). Dean uses `log-activity` EF directly — Make retired from Dean's stack. |
| Payments | Stripe. Live link: `buy.stripe.com/00wfZicla1Em0NnaIB93y00`. Coupons `VYVE15` and `VYVE10`. Redirects to `welcome.html`. First paying B2C: Paige Coult @ £20/month. |
| Email | Brevo — transactional SMTP API with custom HTML. No campaign builder, no Brevo branding injected. Verified sender `team@vyvehealth.co.uk` (ID 1, name "VYVE Health"). Proxy endpoint `smtp/email` (no `/v3/` prefix). |
| HealthKit integration | `@capgo/capacitor-health@8.4.7`. iOS device-validated. 7 read scopes (steps, distance, active energy, workouts, cardio, sleep, weight); 1 write scope (weight only — workout write-back unsupported by Capgo 8.4.7 on iOS). Cohort-wide post 1.2 approval — `member_health_connections` row presence is the truthsource. |
| Push notifications | Live end-to-end. Native APNs via `push-send-native` v5 (auto-revokes 410/400 BadDeviceToken). Web VAPID via `send-push` v13 (RFC 8291 aes128gcm). Service worker `push` + `notificationclick` listeners shipped 28 April. Reminder triggers (`habit-reminder`, `streak-reminder`), `achievement-earned-push`, and broadcast-push infrastructure (PM-402: `admin-broadcast-push` + `scheduled-push-runner` + `broadcast_schedules` table + Lewis-facing admin UI at `admin.vyvehealth.co.uk/#/broadcast`) all delegate to `send-push`. |
| Analytics | PostHog (`phc_8gekeZglc1HBDu3d9kMuqOuRWn6HIChhnaiQi6uvonl`, EU instance `eu.i.posthog.com`). Identity + event taxonomy live since PM-408 (26 May 2026) via `analytics.js` bridge subscribing to 29 VYVEBus events at `envelope.origin === 'local'` (no cross-tab/cross-device double-counting), with `is_dean` flag for filtering dev traffic out of dashboards and `host_kind` splitting `capacitor://` bundled native from `https://` web fallback. `window.vyveEFFetch(fnName, url, opts)` wraps fetch and captures `ef_error` on non-2xx/network. Session recording configured 100% in `posthog.init`. |
| CRM | HubSpot — `app-eu1.hubspot.com`. Hub ID 148106724. Timezone Europe/London. Currency GBP. |
| Streaming | Riverside (7 studios, permanent links) + YouTube (**ONE channel — `UCuptZFgSk0ZmNnE2IbYBdtg` "VYVE"** — with **9 reusable RTMP stream keys + 8 category playlists** all on that one channel; each stream key paired to a dedicated Riverside studio). Castr (scheduled pre-recorded). Architecture for scaling to 12-15 live sessions/day: reusable-stream pattern. `session-publish` EF (v5) PRE-CREATES broadcasts only (autostart/monitor/autostop OFF — **autostart is DEAD on this channel**); the pusher (`vyve-live-runner.py`) drives `ready->live` and `live->complete` explicitly around the ffmpeg push. |
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
| PWA framing | Product is described as "native iOS app built with Capacitor wrapper" — App Review notes must not call it a PWA per §23.1. |

---

## 6. Supabase architecture

Project `ixjfklpckgxrwjlfsaaz` (Pro plan, West EU/Ireland). **120 public base tables as of 26 May 2026**, all RLS-enabled. Live row counts are never cached in brain — query Supabase directly or read the auto-refreshed `brain/schema-snapshot.md` (regenerated weekly Sunday 03:00 UTC by `schema-snapshot-refresh` cron). Tables grouped below by purpose; the full live list lives in the DB.

### Core member + activity (member-scoped RLS)

| Table | Purpose |
|---|---|
| `members` | Core member profiles. Email PK. Persona, welcome recs, goals, consent flags, `exercise_stream`, `avatar_url`. **PM-420 step 3:** added `baseline_steps_p50`/`baseline_steps_p25`/`baseline_steps_p75` INT NULL + `baseline_source` (CHECK in `healthkit_history` / `manual_chip` / `deferred`) + `baseline_computed_at` + `baseline_days_available` + `baseline_activity_band` (CHECK in `under_3k` / `3k_5k` / `5k_8k` / `over_8k`). Populated by `pull-baseline-steps` EF v1 at consent time via Capgo `queryAggregated` 90-day window. **PM-428:** `baseline_steps_p50` is now kept live by `public.recompute_step_baselines()` (SECURITY DEFINER) — medians `member_health_daily` steps over a rolling **90-day** window EXCLUDING non-wear days (`< 1000` steps), min 5 wear-days, for members with a live `member_health_connections` row; source stays `'healthkit_history'`; idempotent. Cron jobid 33 daily 04:10 UTC. The consent-time snapshot was going stale (e.g. deanonbrown2 stuck at 7,500 vs live 5,882) — the picker reads this column for its Just Steps slider default/baseline. |
| `employer_members` | Employer–member relationships (empty until first enterprise goes live). |
| `daily_habits` | Habit completions. Cap 10/day via BEFORE INSERT trigger; over-cap routed to `activity_dedupe`. `notes='autotick'` distinguishes HK auto-ticked rows. |
| `workouts` | Workout completions. `source` column (`'manual'` vs `'healthkit'`). Cap 2/day for `source='manual'` only. HK-sourced rows bypass entirely. |
| `cardio` | Cardio completions. Same source-aware cap as workouts. |
| `session_views` | Live session views. Cap 2/day all sources. |
| `replay_views` | Legacy replay views table (no FK to `replay_videos`, additive into engagement-score Connect pillar). |
| `replay_video_views` | Per-video replay attribution from the YouTube IFrame API tracker (`replay-tracker.js`). One row per (member, video, client_id). Written at watch_seconds ≥ 30, updated every 30s. FK `youtube_video_id → replay_videos ON DELETE CASCADE`. |
| `session_live_views` | Per-live-session attribution from `player-tracker.js` (PM-304). 30s heartbeats during live broadcasts. Replaces legacy `tracking.js` writes to `session_views` for live shells. |
| `wellbeing_checkins` | Weekly check-in submissions with AI recommendations. UNIQUE on `(member_email, iso_week, iso_year)`. |
| `weekly_scores` | Weekly dashboard scores (wellbeing_score + engagement_score). |
| `monthly_checkins` | Monthly 8-pillar wellbeing check-in (`iso_month` YYYY-MM key, 24 columns: 8 pillar scores + matching notes + avg + ai_report + goal_progress). |
| `live_checkin_submissions` | Embedded weekly live check-in form (member+week_start unique). |
| `daily_mood_checkins` | Five-face daily mood tap on home (PM-258). |
| `daily_checkin_prompts` | Catalogue of daily prompt copy. |
| `checkin_reactions` | Member reactions on Connect check-ins. |
| `connect_checkins` | Connect-pillar member check-in posts. |
| `mind_activities` | Mind-pillar log (`kind` discriminator: breathwork / journal / affirmation / visualisation / meditation / sleep). Path 2 from PM-172 design lock. |
| `movement_activities` | Body-pillar Movement track. PM-307 first-class promotion (walk / stretch / yoga / mobility / pilates / other), backfilled from legacy `cardio.logged_via='movement'` + `workouts.plan_name='Movement'`. **PM-420 step 4a-pre-1 extended schema:** added `display_name`, `manual_steps`, `counts_for_charity` (default true), `hk_native_uuid`, `hk_promoted_to`, `prompt_kind`, `metadata` JSONB. `source` CHECK loosened to accept legacy `'manual'` alongside new vocabulary `hk_workout` / `manual_supplement` / `manual_log` / `prompt_tick`. 38 historical rows renamed `manual` → `manual_log`. Two new partial unique indexes: prompt-tick daily dedupe + hk-native-uuid dedupe. Fully trigger-wired (`auto_time_fields_movement`, `zz_lc_email`, three `mark_home_state_dirty` triggers). **PM-420 step 4c live write surfaces:** quick-log (`source='manual_log'`, +Sport kind), Today's Movement card (`source='prompt_tick'`, `prompt_kind`, daily-unique dedupe), Add Activity modal (`source='manual_supplement'`, `manual_steps`, `counts_for_charity=false` — watch-off bouts + HK step top-ups, summed onto the HK ring base). |
| `weekly_goals` | Recurring weekly goals (4-row template, reset Mondays via `seed-weekly-goals` cron). UNIQUE `(member_email, week_start)`. |
| `activity_dedupe` | Over-cap activity rows — routed by triggers, not discarded. |
| `qa_submissions` | QA test submissions. |
| `ai_interactions` | All Anthropic API calls (prompt, response, tokens, model). `triggered_by` ∈ `weekly_checkin / onboarding / running_plan / milestone / manual / re_engagement`. |
| `ai_decisions` | AI-driven decision audit (persona assignments, rec selections). |

### Achievements (Phase 1 shipped 27 April; v2 catalogue ship landed May)

| Table | Purpose |
|---|---|
| `achievement_metrics` | Metric definitions across pillars (Habits, Body, Mind, Connect, Check-ins, Focus + HK/collective/tenure/one-shot hidden categories). **107 rows live (26 May 2026).** Each has `source` (`inline` for log-activity-driven, `sweep` for cron-driven), `is_recurring` flag, `sort_order`, `phil_approved` flag for Mind/Check-ins clinical gating. **Architectural redirect since PM-335:** member-action metrics evaluate **client-side** via `achievements-evaluator.js` (Dexie-first, bus-subscribed, ~1660 LOC, ~65 handlers across 13 events), not server-inline — instant feedback on threshold-crossing tap is non-negotiable. Server-side `_shared/achievements.ts` + `log-activity evaluate_only` path still live for v1 server-wired metrics; unique constraint on `member_achievements` makes dual-path safe. |
| `achievement_tiers` | Tier rows (= ladders × thresholds). **538 rows live (26 May 2026).** `threshold numeric`, `title`, `body`, `copy_status` CHECK in `(placeholder, approved)`. `CASE WHEN copy_status='approved' THEN ... ELSE EXCLUDED.title END` upsert gate protects approved copy from re-seed overwrite. |
| `member_achievements` | UNIQUE `(member_email, metric_slug, tier_index)`. `earned_at`, `seen_at` (null = unseen toast pending), `notified_at`. Member-scoped read + UPDATE on own rows; service-role only INSERT/DELETE. Idempotent claim via `achievement-claim` EF v1. **Reminder:** sync.js is additive-pull; server deletes don't propagate to Dexie. |

### Workouts, exercise, programmes

| Table | Purpose |
|---|---|
| `workout_plans` | Workout library rows across plan days (~297 rows). |
| `workout_plan_cache` | Per-member workout programme (JSONB). UNIQUE constraint contradiction (surfaced PM-411) being resolved in PM-420 step 4a-pre-2: drop `workout_plan_cache_member_email_key` (full unique on `member_email`) and keep `workout_plan_cache_one_active_per_member` (partial unique WHERE `is_active=true`). Enables plan history (multiple wpc rows per member, only one active at a time). Onboarding EF v86 LIVE (deactivate-old + insert-new pattern). Site patch for `workouts-session.js` (PATCH must filter `is_active=eq.true`) **pending atomic 4-file commit**. Full-unique drop migration pending site patch landing. |
| `manual_step_estimates` | PM-420 step 4a-pre-1. Daily 4-band chip estimate for non-HK members on Movement page. PK `(member_email, estimate_date)`, UPSERT on band tap. Bands: `under_2k` (2000) / `5k` (5000) / `7_5k` (7500) / `over_10k` (10000). RLS member-scoped. `vyve_lc_email` trigger. Empty post-create (zero rows yet). |
| `exercise_logs` | Plan-agnostic set/rep/weight logs. |
| `exercise_swaps` | Member exercise substitutions. |
| `exercise_notes` | Per-exercise notes. |
| `custom_workouts` | Member-created workouts. |
| `shared_workouts` | Shared/community workouts. |
| `programme_library` | Programmes (gym, movement, etc). `category` backfill outstanding (PM-411 — movement plans structurally homeless until categorised). |
| `member_running_plans` | Per-member running plans (Supabase-first since 20 April). Multiple per member, one active. |
| `running_plan_cache` | AI running plan cache (5,376 cacheable combinations). Shared parametric cache keyed on `cache_key` — NOT member-scoped. RLS authenticated-only. |
| `exercise_canonical_names` | Alias-to-canonical mapping. Drives canonicalisation triggers across 7 write surfaces. |
| `exercise_name_misses` | Audit surface for unmapped exercise names. Never blocks the underlying write. |

### Habits, nutrition, weight, mind catalogue

| Table | Purpose |
|---|---|
| `habit_themes` | Monthly habit themes. |
| `habit_library` | Source habits. `health_rule jsonb` column drives autotick (null = manual-only). |
| `member_habits` | Habits assigned to members. |
| `nutrition_logs` | Food log entries. (Food log locked Coming Soon PM-374 — entry-points soft-gated, table preserved.) |
| `nutrition_my_foods` | Member-saved custom foods. |
| `nutrition_common_foods` | Pre-populated food database (~125 rows). |
| `weight_logs` | Member weight entries. One row per member per day (upsert on conflict). |
| `breathwork_patterns` | Catalogue of breathwork patterns. Public-read RLS. 4 active rows at launch (`box-4444`, `sigh`, `478`, `coherent-55`). |
| `breathwork_music` · `breathwork_imagery` | Optional breathwork accompaniment catalogues. |
| `affirmations_library` | Catalogue of affirmations. 30 active rows at launch — Claude-generated placeholders, Lewis to edit live. |
| `affirmation_favourites` | Member-saved affirmations. |
| `taglines` | Member-tagline catalogue. |

### AI, persona, knowledge

| Table | Purpose |
|---|---|
| `personas` | 5 AI coach personas (NOVA, RIVER, SPARK, SAGE, HAVEN) with full system prompts. |
| `persona_welcome_copy` | Hydration overlay welcome lines (persona × goal). NULL goal = persona generic fallback. HAVEN never goal-echoes (CHECK invariant + code short-circuit). |
| `persona_switches` | Member persona change requests. |
| `knowledge_base` | Knowledge rows (15). |

### Catalogue tables (§23.45 + §23.46 pattern, Lewis edits in Studio, devices hydrate via sync.js)

This is now a first-class pattern with 9+ catalogues built on it. Edit via Supabase Studio → Dexie picks up within `CATALOGUE_FRESH_TABLES` (5 min) OR immediately on `CATALOGUE_INVALIDATION_KEY` bump. Each catalogue has a `FALLBACK_*` const in the consuming page for cold-paint defaults — keep in lockstep.

| Table | Purpose |
|---|---|
| `service_catalogue` | Available sessions and content. `image_url` drives thumbnails. |
| `replay_playlists` | Replay category playlists (8 — one per stream). |
| `replay_videos` | Per-video YouTube metadata. Reconciled against YouTube via `refresh-replay-videos` v2 (DELETE-NOT-IN reconciliation closes the upsert-only stale-row gap, PM-410). |
| `mind_videos` | Mind sub-page videos (meditation / sleep / visualisation / breathwork). `kind` discriminator. |
| `persona_welcome_copy` | (See AI section above — same pattern.) |
| `how_to_resources` | How-to library (`kind ∈ pdf/video`). Renders `how-to-pdfs.html` / `how-to-videos.html`. |
| `podcast_platforms` | Podcast platform link chips on `podcast.html`. |
| `checkin_questions` | Versioned weekly + monthly check-in slider questions. Rails in place; hydration onto `wellbeing-checkin.html` + `monthly-checkin.html` is a follow-on touch when Lewis writes rows. |
| `daily_checkin_prompts` | Daily prompt copy. |

### HealthKit pipeline

| Table | Purpose |
|---|---|
| `member_health_connections` | Per-member HK connection state. Truthsource for autotick eligibility (allowlist dropped 26 April). |
| `member_health_samples` | Raw HK samples — long-format, per-sample. Includes sleep segments with `metadata.sleep_state`. |
| `member_health_daily` | Aggregated daily long-format (`queryAggregated` — steps/distance/active_energy per local date). |
| `member_health_write_ledger` | Write-back attempts (weight only; anti-echo via `native_uuid`). |

### Dashboard + aggregation

| Table | Purpose |
|---|---|
| `member_home_state` | One row per member. Dashboard aggregate (65+ columns including v2 engagement: `engagement_focus_points` / `engagement_habits_points` / `engagement_body_points` / `engagement_mind_points` / `engagement_connect_points` / `engagement_checkins_points` / `engagement_consistency_mult` / `engagement_variety_mult` / `engagement_active_days_7` / `engagement_pillars_touched_7` / `engagement_score_v2` from PM-295, plus 5 `last_*_at` from PM-16). Writer is `refresh_member_home_state(p_email)` plpgsql, fired synchronously by `zzz_refresh_home_state` AFTER INSERT/UPDATE/DELETE triggers on 8 source tables (`cardio`, `daily_habits`, `replay_views`, `session_views`, `weekly_goals`, `weekly_scores`, `wellbeing_checkins`, `workouts`) — same-write-fresh, no staleness. PM-386 added `mind_activities` / `movement_activities` / `connect_checkins` to dirty-mark triggers. HealthKit tables inherit refresh via autotick writes through `daily_habits` / `workouts` / `cardio`. |
| `member_home_state_dirty` | Dirty-queue table drained every 5 min by `vyve_drain_home_state_dirty` cron. |
| `member_activity_daily` | Per-member per-day aggregate. Refreshed every 30 min via `vyve_rebuild_mad_incremental`. |
| `member_activity_log` | Chronological activity log. |
| `member_stats` | Per-member rolling stats. Recomputed every 15 min via `vyve_recompute_member_stats`. |
| `members.planfit_suggestion` | PM-420 4d jsonb col. Pending plan-up nudge `{from_plan,to_plan_id,to_plan_name,median_14d,end_target,fired_at}`, set by `evaluate_plan_fit()`, read by movement.html banner, nulled on accept/dismiss (dismiss also stamps `planfit_suggestion_dismissed_at` 30-day cooldown). |
| `company_summary` | Enterprise aggregate rollup. Recomputed daily 02:00 UTC. |
| `platform_metrics_daily` | Platform-wide metrics per day. Recomputed daily 02:15 UTC. |
| `platform_alerts` | Central monitoring — errors, failures, proactive alerts. Service-role only. |
| `platform_counters` | Single-row-per-counter aggregate (charity_total). Reconciled daily 02:30 UTC. |
| `watchdog_alerts` | Email-watchdog suppression (per-code 6h dedupe). |
| `perf_telemetry` | Client-side paint/interaction telemetry sink. Written by `log-perf`. RLS service-role-only. |

### Certificates, engagement, sessions

| Table | Purpose |
|---|---|
| `certificates` | Issued certificate records. Global sequential numbers via `next_certificate_number()`. **PM-435:** re-pillared onto the five Your Journey buckets — `activity_type` ∈ {habits, mind, body, connect, checkins} + legacy {workouts, cardio, sessions} (widened CHECK); `pillar` column (legacy rows tagged `'legacy'`). Counts come from `public.get_certificate_buckets()` (single source, mirrors `engagement-v2 renderProgressTab` caps). Unique `(member_email, activity_type, milestone_count)`. |
| `engagement_emails` | Re-engagement email tracking. Streams A/B (C1/C2/C3 retired 4 May). |
| `session_chat` | Live session chat (last 50 per session). Open INSERT/SELECT for live chat. |
| `session_categories` | Session category metadata. |
| `calendar_occurrences` | Scheduled session occurrences (drives `*-live.html` shells; `starts_at` should be now/now+30s for testing per PM-304 walk lesson). |
| `broadcast_schedules` | Recurring scheduled broadcast push rows (PM-402). Lewis adds via Studio with `slug` UNIQUE + `audience` jsonb + `recurrence` jsonb. Drained by `vyve-broadcast-scheduler` cron every 5 min. |

### Live content delivery + simulated-live schedule (locked 2026-06-02)

**Model.** Live sessions are simulated-live: a pre-recorded master pushed in real time over RTMP (`ffmpeg -re`) into a reusable YouTube stream key. **Autostart is DEAD on this channel** — a broadcast on autostart sits in `ready` forever and a manual transition is rejected. So: `session-publish` v5 (hourly cron job 27) PRE-CREATES the liveBroadcast (unlisted, autostart/monitor/autostop OFF, DVR), binds the category reusable stream, playlistItems.insert. The pusher `vyve-live-runner.py` (VYVEBrain scripts/, PM-446) then pushes ffmpeg, polls the bound stream active, transitions `ready->live`, and `live->complete` on push end. `refresh-replay-videos` v2 (03:30 UTC) pulls the 8 playlists into `replay_videos` -> Replays. RTMP key NOT in Supabase -> resolved live via `liveStreams.list(part=cdn)`. Runs on an always-on box (interim: Dean's Mac); cannot run in an Edge Function. Runner is the multi-session daemon (supersedes the single-session `simulated-live-worker.py`).

**Cadence (3-4/day).** 07:00 Movement (themed) / 08:30 Mind (themed) / 13:00 Movement booster (blended) / 19:30 Wind-down (restore). Tuesday mornings = Healthy/mobility series. Repetition accepted.

**Recyclability rule.** Practice content (yoga/pilates/mobility/meditation/breathwork/affirmations/journaling/wind-downs) recurs freely; talks air once then on-demand in Replays.

**Library (riverside_ masters, deduped).** 53 Movement (yoga 15, gentle/yin 6, pilates 5, flows 7, flexibility 3, mobility 17) + 21 Mind (meditation 3, breathwork 3, affirmations 2, visualisation 1, journaling 2, talks 10) = 74 airable. 4 explainers NOT aired -> Mind-section intro content. Excluded: 3x background_5min; morning_stillness (pending). Lewis new set: Doing Hard Things + Not Drinking Alcohol -> talks; Why I Founded VYVE -> launch feature/onboarding; Welcome to VYVE -> onboarding; Suicide and Men -> gated (§23.84).

**Go-live = two tracks.** (1) Seed Replays now by uploading back-catalogue straight into the 8 category playlists (empty since PM-410). (2) Run the 3-4/day schedule on top. 30-day calendar (Wed 3 Jun -> Thu 2 Jul 2026) built; titles map to riverside_ files at wiring time, each -> a `calendar_occurrences` row.

### Notifications + push

| Table | Purpose |
|---|---|
| `member_notifications` | In-app notifications. Written by `send-push` AND by `log-activity` v23+ achievement evaluator. |
| `push_subscriptions` | VAPID web push subscriptions (dormant since 15 April; native is the iOS channel post-1.2). |
| `push_subscriptions_native` | APNs subscriptions for native iOS push. Android/FCM rows reserved (parked). |
| `scheduled_pushes` | One-shot delayed push queue (member-callable "Remind me in 2h"). Drained by `process-scheduled-pushes` cron every 5 min. |
| `admin_broadcast_log` | Audit log of admin broadcast pushes. RLS admin-gated. |
| `member_notifications` | (Listed once above.) |

### Member prompts + mood (PM-375)

| Table | Purpose |
|---|---|
| `member_prompts` | Lewis-driven in-app questionnaires (popup container). |
| `member_prompt_questions` | Questions per prompt (multi / single / slider / text / yes_no). |
| `member_prompt_dismissals` | Per-member gate state. |
| `member_prompt_responses` | Member answers. Read in Supabase Studio for the trial. |

### Connect challenges + reactions

| Table | Purpose |
|---|---|
| `weekly_challenges` | Catalogue of weekly Connect challenges. |
| `weekly_challenge_participation` | Member participation. |
| `checkin_reactions` | Reactions on Connect check-ins. |

### Podcast catalogue

| Table | Purpose |
|---|---|
| `podcast_episodes` | Episode list. |
| `podcast_platforms` | (See catalogue section above.) |

### Admin + command centre (`cc_*`, `admin_*`)

| Table | Purpose |
|---|---|
| `admin_users` | Admin-console operator accounts. |
| `admin_audit_log` | Immutable log of admin write actions. Service-role only. |
| `cc_clients`, `cc_leads`, `cc_investors`, `cc_partners` | Command Centre CRM tables. |
| `cc_tasks`, `cc_decisions`, `cc_okrs` | Task/decision/OKR tracking. |
| `cc_finance`, `cc_revenue`, `cc_grants`, `cc_invoices` | Financial tracking. |
| `cc_posts`, `cc_sessions`, `cc_intel`, `cc_knowledge`, `cc_documents`, `cc_swot`, `cc_episodes`, `cc_calendar_events` | Content + intel. |
| `vyve_job_runs` | Background job execution log. |

### GDPR pipeline (07 May 2026)

| Table | Purpose |
|---|---|
| `gdpr_export_requests` | Article 15 data-export queue. Walked by `gdpr-export-execute` via `gdpr_export_pick_due()` with `FOR UPDATE SKIP LOCKED`. 1-per-30-days rate limit member-self. |
| `gdpr_erasure_requests` | Article 17 right-to-be-forgotten queue. 7-day cancellation window via `due_at`. Walked by `gdpr-erase-execute`. |

### Activity caps (BEFORE INSERT triggers)

| Activity | Cap | Notes |
|---|---|---|
| `daily_habits` | 10/day | Generous headroom — `activity_dedupe` divert only at 11th+ insert/day/member. |
| `workouts` | 2/day **for `source='manual'` only** | HK-sourced rows bypass entirely. |
| `cardio` | 2/day for manual only | Same. |
| `session_views` | 2/day | All sources. |

Charity + certificate counters stay independently capped at 2/day via `get_charity_total()` and `increment_*_counter()` read-path caps.

---

## 7. Edge Functions — live inventory

**124 Edge Functions deployed (26 May 2026).** ~70 actively operational; the remainder are one-shot patchers / seeders / debug helpers / dormant throwaways. The 9 April security audit identified ~89 for deletion — partial cleanup complete; backlog item still open.

> **Versioning note.** Source-level semantic versions live in the EF source-file header comment (`// <ef-name> v<N> — <one-liner>`). To check the deployed version, read the source. The Supabase platform deploy counter (`version: N` in `list_edge_functions`) is a deploy/redeploy artefact and not surfaced here.

### Core operational (member-facing + cron-driven)

| Function | Status | Purpose |
|---|---|---|
| `onboarding` | LIVE v87 (Supabase version 92) | New member onboarding. Two-phase (fast persona/habits/recs + `EdgeRuntime.waitUntil()` for 8-week workout JSON). Stream-aware. **Single-file build** (emails.ts + workouts.ts inlined into index.ts — see §23.79). v87 (PM-420 step 4b): `writeWorkoutPlan` deactivate-old now scoped by surface (`&programme_json->>surface=eq.<surface>`) so re-onboarding one stream can't wipe the other surface's active plan. Carries v86 (deactivate-old+insert-new) + v85 (PM-419 surface stamping) + v84 (PM-408 flat-progression + deterministic movement plan) + v83 (crisis-scan). `ezbr_sha256: 9fbfb39875120dddd4029b7d0974df7d229e2c06c623476a81ff1fbe2d199dd4`. |
| `member-dashboard` | LIVE v77 (PM-497) | Full dashboard data in one call. Returns `_buckets` (from `get_certificate_buckets_for` SQL RPC) + raw pillar arrays. Includes `health_connections` + `health_feature_allowed` + `habits` block + `achievements` block. Reads `member_home_state` for `*_this_week` cached counts. |
| `employer-dashboard` | LIVE | Aggregate employer analytics. API-key auth (no PII). |
| `wellbeing-checkin` | LIVE v30 (PM-516: enriched debrief prompt + structured output) | Branching 5-step check-in. Enriched signal from 7 tables (home_state, stats, checkin history, daily mood, monthly, HealthKit). Structured AI debrief: debrief_text + habit/content cards. Grace period check. Writes `ai_interactions`. |
| `monthly-checkin` | LIVE | Monthly 8-pillar check-in. |
| `log-activity` | LIVE | PWA activity logging. Also serves as `evaluate_only` endpoint for trigger pages that write direct to PostgREST. Inline achievement evaluation + push fan-out under `EdgeRuntime.waitUntil()`. |
| `log-perf` | LIVE | Anonymous-friendly client telemetry sink (per-page TTFB / FP / FCP / LCP / INP / custom `auth_rdy` / `paint_done`). JWT-validated. Writes `perf_telemetry`. |
| `anthropic-proxy` | LIVE | Server-side Anthropic proxy for running plans + misc AI calls. `verify_jwt:false` at platform with internal `supabase.auth.getUser()` validation. Writes `ai_interactions` audit. |
| `generate-workout-plan` | LIVE | AI workout plan generation (invoked from onboarding's waitUntil path). |
| `sync-health-data` | LIVE | HealthKit sync. Stamps `source:'healthkit'` on promoted workout/cardio rows. |
| `get-health-data` | LIVE | Reads back health data for portal display. |
| `leaderboard` | LIVE | Privacy-aware leaderboard. Thin wrapper over `get_leaderboard(p_email, p_scope, p_range)` RPC — sort + top-100 slice + caller-row lookup all in Postgres window functions over `member_home_state`. Scales to 100K members without wire bloat. |
| `notifications` | LIVE | In-app notifications read/write. |
| `share-workout` | LIVE | Shared/community workout handler. |
| `workout-library` | LIVE | Library API for workouts + paused-plan logic. |
| `member-achievements` | LIVE | Achievements API surface — `tiers[].earned_at` / `tiers[].is_current` / `tiers[].progress` for the engagement-page grid + dashboard slot. |
| `achievement-claim` | LIVE | Idempotent achievement claim (anti-tamper via catalog lookup). Fans out to `achievement-earned-push` only on `newly_inserted=true`. |
| `achievements-mark-seen` | LIVE | Toast-clear endpoint. |
| `achievements-sweep` | LIVE | Daily 22:00 UTC cron for tenure / HK lifetime / collective metrics. Per-member fan-out via `achievement-earned-push` after upsert. |
| `connect-feed-preview` | LIVE | Connect community feed slice (PM-201 cache infrastructure). |
| `connect-feed-counts` | LIVE | Connect badge counts. |
| `connect-challenge-summary` | LIVE | Weekly Connect challenge summary. |
| `get-activity-feed` | LIVE | Personal activity feed. |
| `gdpr-export-request` / `gdpr-export-execute` | LIVE | Article 15 data-export queue + executor (4MB JSON / 27s typical, 7-day signed URL via Brevo email). |
| `gdpr-erase-request` / `gdpr-erase-cancel` / `gdpr-erase-status` / `gdpr-erase-execute` | LIVE | Article 17 erasure pipeline (7-day cancellation window, per-subject `gdpr_erase_purge_subject` PL/pgSQL deletes in dependency order with explicit ALTER TABLE DISABLE/ENABLE TRIGGER pairs — `session_replication_role=replica` unavailable from service-role connections). |

### Push + email

| Function | Status | Purpose |
|---|---|---|
| `send-push` | LIVE | Unified push fan-out — VAPID web (RFC 8291 aes128gcm) + APNs native (delegated to `push-send-native`). Service-role gated, dual-auth (`SUPABASE_SERVICE_ROLE_KEY` OR `LEGACY_SERVICE_ROLE_JWT` — see auth-shape gotcha PM-402: EFs that do `Bearer === SERVICE_KEY` equality check need the JWT-format `LEGACY_SERVICE_ROLE_JWT`, not the new `sb_secret_*` publishable shape). |
| `push-send-native` | LIVE | APNs sender. ES256 JWT via Web Crypto. Routes per environment. 410/400-BadDeviceToken auto-revokes. |
| `register-push-token` | LIVE | PWA `push-native.js` POSTs `{token, platform, environment, app_version}` to `push_subscriptions_native`. |
| `habit-reminder` | LIVE | Daily 20:00 UTC push. |
| `streak-reminder` | LIVE | Daily 18:00 UTC push (≥7 day streak threshold). |
| `achievement-earned-push` | LIVE | Thin glue between achievement evaluators and `send-push`. Skip in-app dedupe via `skip_inapp:true`. |
| `schedule-push` | LIVE | Member-callable delayed-push enqueuer ("Remind me in 2h"). |
| `process-scheduled-pushes` | LIVE | 5-min cron consumer for `scheduled_pushes`. |
| `admin-broadcast-push` | LIVE | Lewis-facing manual broadcast UI fan-out (PM-402). Defence-in-depth: front-end `is_admin` gate (Layer 1) + EF re-checks `is_admin` RPC under caller JWT (Layer 2). 6-shape audience resolver (`all` / `inactive` / `company` / `company_slug` / `email` / `emails[]`). |
| `scheduled-push-runner` | LIVE | 5-min cron for recurring broadcast schedules. |
| `send-email` | LIVE | Brevo transactional delivery. |
| `re-engagement-scheduler` | LIVE | Daily 08:00 UTC. Streams A + B (C1/C2/C3 retired 4 May). Reads `member_home_state.last_*_at` cols. Writes `ai_interactions` audit. |
| `send-session-recap` / `send-journey-recap` / `send-password-reset` / `send-test-welcome` / `vicki-preview-sender` / `vicki-doc-sender` | LIVE | Specific email surfaces. |
| `email-watchdog` | LIVE | 30-min cron checking 5 failure modes (missing daily delivery, hard-bounces, blocklist, pg_cron failures, bounce-spike). Per-code 6h suppression via `watchdog_alerts`. |
| `alert-digest` | LIVE v2 (PM-421) | Morning / afternoon / evening platform-alert digest. v2: per-incident diagnosis is three tiers — `plain` (everyday language, jargon banned) + `impact` (who's affected, what a member sees, member-count-led) + `technical` (engineer detail underneath). Sonnet 4 returns `{plain,impact,technical}` JSON; unparseable/failed → graceful fallback, email never blocks. Client-side severity is set by `classifySeverity()` in `auth.js` vyveMonitor (PM-423) — known-benign WebKit transients (e.g. IndexedDB `in-progress transaction`) downgraded to `info` so the digest doesn't cry wolf; genuine errors stay `high`. |

### Reports + housekeeping

| Function | Status | Purpose |
|---|---|---|
| `daily-report` | LIVE | Cron 08:05 UTC daily. |
| `weekly-report` | LIVE | Cron 08:10 Monday UTC. |
| `monthly-report` | LIVE | Cron 08:15 1st of month UTC. |
| `certificate-checker` | LIVE | **v24 (PM-435).** Daily 09:00 UTC. Reads `get_certificate_buckets()` (five capped Your Journey buckets: habits/mind/body/connect/checkins), issues one cert per 30 per track with `pillar`, upsert ignoreDuplicates (race-safe), emails only on new inserts. Certs render client-side via `/certificate.html?id=` (HTML/Storage generation dropped at v23). Calls `next_certificate_number()` — v23 called a non-existent fn and silently numbered all certs `1`; fixed. |
| `certificate-serve` | LIVE | Serves certificate HTML. |
| `warm-ping` | LIVE | 5-min keep-warm against 10 EFs. |
| `check-cron` | LIVE | Cron audit/verification. |
| `seed-weekly-goals` | LIVE | Mon 00:01 UTC seeder for the recurring weekly goals strip. Idempotent ON CONFLICT DO NOTHING. |
| `storage-cleanup` | LIVE | Storage housekeeping. |
| `schema-snapshot-refresh` | LIVE | Sunday 03:00 UTC, auto-commits structural changes to VYVEBrain. `GITHUB_PAT_BRAIN` fine-grained PAT, expires 18 April 2027. |
| `youtube-token-keepalive` | LIVE | Daily 03:00 UTC YouTube OAuth keepalive. |
| `refresh-replay-videos` | LIVE | Daily 03:30 UTC YouTube → `replay_videos` sync with DELETE-NOT-IN reconciliation (PM-410 — closes upsert-only stale-row gap; gated to run only if all 8 playlists fetch cleanly). |
| `session-publish` | LIVE | v5 — PRE-CREATE only (mint+bind+playlistItems.insert) from `calendar_occurrences` within 60min lookahead. `enableAutoStart=false` (autostart DEAD on this channel — the worker transitions ready->live + ->complete explicitly), `enableAutoStop=false`, monitorStream off. Hourly cron. |
| `broadcast-status` | LIVE | v1 (PM-445, verify_jwt) — member live-page probe. OAuth `liveBroadcasts.list?part=status` -> `{live:bool|null}` so `*-live.html` lets broadcast-live override the clock (§23.65). Fail-safe: returns live:null on YouTube/token error -> client clock-falls-back. |
| `youtube-token-health` | LIVE | v1 (PM-447, verify_jwt:false, cron job 35 `0 4 * * *`) — daily YouTube OAuth tripwire. Refresh grant + authed `channels.list` probe; alerts team@ via send-email on failure, silent when healthy. Refresh token is Google "Testing" mode (~7-day expiry). |
| `crisis-scan` | LIVE | Mental-health crisis scan on weekly check-in submissions. |

### Admin console + ops

| Function | Status | Purpose |
|---|---|---|
| `admin-dashboard` | LIVE | Admin console data API. |
| `admin-member-edit` / `admin-member-habits` / `admin-member-programme` / `admin-member-weekly-goals` / `admin-programme-library` | LIVE | Admin write surfaces. All audited to `admin_audit_log`. |
| `edit-habit` | LIVE | Habit definition edit helper. |
| `cc-data` | LIVE | Command Centre data API. |
| `internal-dashboard` | LIVE | Internal metrics. |
| `ops-brief` | LIVE | Ops brief generation. |
| `github-proxy` / `github-proxy-marketing` | LIVE | GET + PUT to vyve-site / Test-Site-Finalv3 via `GITHUB_PAT`. |
| `off-proxy` | LIVE | Open Food Facts proxy for `log-food.html`. |
| `broadcast-announcement` | LIVE | Broadcast announcement helper. |
| `connect-feed-preview` | LIVE | (Listed above.) |

### Shared modules

Two `_shared/*.ts` files referenced by multiple EFs (must redeploy in lockstep when modified):

- `_shared/taxonomy.ts` — workout-type constants, `classifyWorkout()`, `HealthRule` / `HealthProgress` / `HealthEvaluation` types, UK time helpers. Imported by `member-dashboard` + `sync-health-data`.
- `_shared/achievements.ts` — server-side achievement evaluator (`evaluateInline()` + `getMemberAchievementsPayload()`). 60s in-memory catalog cache. Skips `hidden_without_hk` metrics for members without HK connection. Imported by `log-activity` + `member-dashboard`. **Note:** member-action evaluation now primarily Dexie-first client-side via `achievements-evaluator.js` per PM-335 redirect; server path retained for v1 server-wired metrics until full retirement (unique constraint on `member_achievements` makes dual-path safe).

### Retired / dormant / one-shot

Roughly 40+ functions in the deployed list are dormant: one-shot seeders (`seed-library-*`, `seed-b1`, `seed-weekly-goals`), one-shot migrations (`run-migration-*`, `setup-*`, `create-*`, `inject-nav`, etc.), debug / inspect tools (`debug-*`, `inspect-*`, `force-cache-refresh`, `test-*`, `schema-snapshot-refresh`, `secret-scan`), throwaway YouTube tools (`yt-stream-diag`, `yt-channel-audit`, `yt-broadcast-delete`, `replay-inventory-tmp`, `replay-archive-tmp`, `replay-ghost-cleanup-tmp`), per-member action triggers (`trigger-owen-workout`, `trigger-callum-workout`, `send-stuart-reset`, `generate-stuart-plan`, `ban-user-anthony`), and model-comparison harness (`model-compare-*`, `onboarding-v83-test`). **Cleanup pending** — Composio doesn't expose a delete-EF tool; deletions need Supabase CLI or dashboard.

### EF deployment rules

- Always provide a **full** `index.ts` — no partial updates.
- `verify_jwt:false` for public-facing functions that handle their own auth or need unauth'd access (onboarding, send-email, webhooks).
- `verify_jwt:true` for everything that reads member data server-side OR is service-role-internal.
- `esm.sh` imports unreliable in Deno — use Deno built-ins (Web Crypto, std library) for crypto operations.
- `SUPABASE_DEPLOY_FUNCTION` for body changes; `SUPABASE_UPDATE_A_FUNCTION` corrupts deployed bundles.
- `SUPABASE_GET_FUNCTION_BODY` returns ESZIP binary (not human-readable); use native `Supabase:get_edge_function` MCP for source.

### Cron jobs — 29 active (all `active=true`; +`vyve-evaluate-plan-fit` PM-420 4d, 28 May)

| Job | Schedule | Function |
|---|---|---|
| `email-watchdog` | `*/30 * * * *` | email-watchdog |
| `warm-ping-every-5min` | `*/5 * * * *` | warm-ping |
| `process-scheduled-pushes` | `*/5 * * * *` | process-scheduled-pushes |
| `vyve-broadcast-scheduler` | `*/5 * * * *` | scheduled-push-runner |
| `vyve_drain_home_state_dirty` | `*/5 * * * *` | drain_home_state_dirty() |
| `vyve_recompute_member_stats` | `*/15 * * * *` | recompute_all_member_stats() |
| `vyve-evaluate-plan-fit` | `0 4 * * *` | evaluate_plan_fit() — PM-420 4d plan-up nudge |
| `vyve-recompute-step-baselines` | `10 4 * * *` | recompute_step_baselines() — PM-428 live rolling-90d baseline |
| `vyve-gdpr-export-tick` | `*/15 * * * *` | gdpr-export-execute |
| `vyve_rebuild_mad_incremental` | `*/30 * * * *` | rebuild_member_activity_daily_incremental() |
| `vyve-reengagement-daily` | `0 8 * * *` | re-engagement-scheduler |
| `vyve-alert-digest-morning` | `0 8 * * *` | alert-digest (morning) |
| `vyve-daily-report` | `5 8 * * *` | daily-report |
| `weekly-report` | `10 8 * * 1` | weekly-report (Mondays) |
| `monthly-report` | `15 8 1 * *` | monthly-report (1st of month) |
| `vyve-certificate-checker` | `0 9 * * *` | certificate-checker |
| `vyve-alert-digest-afternoon` | `0 14 * * *` | alert-digest (afternoon) |
| `streak-reminder-daily` | `0 18 * * *` | streak-reminder |
| `habit-reminder-daily` | `0 20 * * *` | habit-reminder |
| `vyve-alert-digest-evening` | `0 20 * * *` | alert-digest (evening) |
| `vyve-achievements-sweep-daily` | `0 22 * * *` | achievements-sweep |
| `vyve-seed-weekly-goals` | `1 0 * * 1` | seed-weekly-goals (Mon 00:01 UTC) |
| `vyve_recompute_company_summary` | `0 2 * * *` | recompute_company_summary() |
| `vyve_platform_metrics` | `15 2 * * *` | recompute_platform_metrics() |
| `vyve_charity_reconcile_daily` | `30 2 * * *` | charity_total_reconcile_and_heal |
| `vyve-gdpr-erase-daily` | `0 3 * * *` | gdpr-erase-execute (03:00 UTC, 120s timeout) |
| `youtube-token-keepalive-daily` | `0 3 * * *` | youtube-token-keepalive |
| `vyve-refresh-replay-videos-daily` | `30 3 * * *` | refresh-replay-videos |
| `vyve_schema_snapshot` | `0 3 * * 0` | schema-snapshot-refresh (Sundays) |
| `session-publish-hourly` | `5 * * * *` | session-publish |

---

## 8. Portal pages & web shell

All portal pages live at `online.vyvehealth.co.uk` and are bundled inside the iOS + Android Capacitor binaries via `npx cap copy` from `~/Projects/vyve-capacitor`. The web URL itself is the browser-accessible account-management fallback — the *member experience* (the app) is delivered exclusively through App Store and Play Store binaries. Every page is gated behind Supabase Auth (`auth.js` v2.5). **86 HTML files live (26 May 2026) — `ls *.html` in vyve-site for the full list.**

**Hub-page hero pattern (PM-244 / PM-246 / PM-247 / PM-252).** The four hubs (Home, Body, Mind, Connect) use a `position:fixed` photographic hero band at the top with scrolling content below. Soft seam between photo and content follows the §23.53 canonical scrolling-fade recipe — dedicated `.X-hero-fade` absolute-positioned div as first child of `.wrap`, lifted up 80px via `transform:translateY(-100%)`, 3-stop rgba gradient with `[data-theme="light"]` override.

**Hub-hero canonical size (PM-247): `max(250px, 35vh)`.** Two paired values must always match per page — `.X-hero { height: max(250px, 35vh); }` and `main { padding-top: max(250px, 35vh); }`.

### Hubs (top-level nav)

| Hub | File | Notes |
|---|---|---|
| Home | `index.html` | Member dashboard. Snapshot-first paint (PM-396/397/398) from `vyve_<hub>_snapshot_<email>` localStorage. Daily check-in pill strip, activity score ring (v1), recurring 4-row weekly goals strip, live session slot, charity banner, mood faces, member prompt sheet hook. |
| Body | `exercise.html` | Exercise Hub. Hero card + stream cards linking to Movement / Workouts / Cardio. **Dean shorthand: "body" or "body.html" always means `exercise.html`** — there is no `body.html`. PM-411 surfaced that movement plans are structurally homeless until `programme_library.category` backfill lands. |
| Mind | `mind.html` | Mind hub with sub-page tiles. |
| Connect | `connect.html` | Connect hub: live carousel, recent check-ins, reactions, challenge summary. |

### Sub-trackers (per-stream + per-activity surfaces)

| Stream | Pages |
|---|---|
| Body — Workouts | `workouts.html` (My Programme + My Workouts tabs), `workout-history.html`, `personal-bests.html`, `shared-workout.html`, `workout-plan-wizard.html` (PM-532 no-plan questionnaire flow) |
| Body — Cardio | `cardio.html`, `cardio-history.html`, `running-plan.html` |
| Body — Movement | `movement.html`, `movement-history.html` |
| Mind | `meditation.html`, `sleep.html`, `breathwork.html`, `visualisation.html`, `affirmations.html`, `journal.html`, `mind-library.html`, `mind-insights.html` |
| Nutrition | `nutrition.html`, `nutrition-setup.html`, `log-food.html` (locked Coming Soon per PM-374) |
| Habits | `habits.html` |
| Check-ins | `wellbeing-checkin.html` (weekly), `monthly-checkin.html`, `connect-checkin.html`, `connect-feed.html`, `connect-challenge.html`, `connect-calendar.html` |
| Health (HK) | `apple-health.html` (inspector — parked), `hk-diagnostic.html` |
| Other | `activity.html` (personal feed — built, unlinked), `engagement.html` (v1 score), `engagement-v2.html` (v2 score behind `?score=v2` flag) |

### Live + replay shells (per-stream)

| Pattern | Files |
|---|---|
| `*-live.html` (8) | `yoga-live` · `mindfulness-live` · `workouts-live` · `therapy-live` · `events-live` · `podcast-live` · `education-live` · `checkin-live` — broadcast surfaces with YouTube embed + chat + `player-tracker.js` for `session_live_views` attribution (PM-304). |
| `*-rp.html` (8) | `yoga-rp` · `mindfulness-rp` · `workouts-rp` · `therapy-rp` · `events-rp` · `podcast-rp` · `education-rp` · `checkin-rp` — replay-category shells reading `replay_playlists` + `replay_videos` via shared `session-rp.js` + `session-rp.css` (events-rp converted from standalone to canonical shell at PM-390). |
| Replays | `replays.html`, `replay-category.html` |

### Focus surfaces (Today's Focus pillar — Option A `focus_slug` reads)

`focus/connect.html` · `focus/focus.html` · `focus/gratitude.html` · `focus/hydration.html` · `focus/morninglight.html` · `focus/movement.html` · `focus/outdoors.html` · `focus/reflection.html` · `focus/reset.html` · `focus/restore.html` · `focus/sleep.html` · `focus/fuel.html` (retired with Food Log deferral PM-353).

### Sessions surface

`sessions.html` — listings page. Filter tabs (All/Daily/Weekly/Monthly). `session_chat` for live chat.

### Catalogues + help

`how-to-pdfs.html` · `how-to-videos.html` · `certificates.html` · `certificate.html` · `leaderboard.html` · `podcast.html`

### Account + auth

`login.html` · `set-password.html` · `settings.html` · `settings-account.html` · `consent-gate.html` · `gdpr-erasure-cancel.html`

### Onboarding

`welcome.html` — stream picker + questionnaire post-Stripe.

### Admin + internal

`strategy.html` (internal strategy dashboard, password `vyve2026`) · `internal-dashboard/index.html` · `reset-cache.html` · `perf-test.html` (dev surface, skipped from precache).

### Mockups + staging

| File | Status |
|---|---|
| `achievements-mockup-c.html` · `achievements-mockup-pathb.html` | Visual reference for v2 Achievements UI direction/badge work. Deletable once all 6 pillars are live. |
| `VYVE_Health_Hub.html` | **Staging — pending Phil's clinical sign-off before launch.** Standalone multi-step clinical assessment flow with scoring/risk classification → `generateReport()` text export. Unlinked from nav by design. **Do not delete or archive without Lewis/Phil approval** (§23 hard rule). |

### Admin console (separate host)

`admin.vyvehealth.co.uk` — served by `vyve-command-centre` repo. Shell 1 + Shell 2 + Shell 3 Sub-scope A UI live. Sub-scope B (bulk ops + multi-select) queued behind browser-side JWT smoketest. Lewis-facing broadcast UI at `/#/broadcast` (PM-402).

### PWA infrastructure

| Piece | Detail |
|---|---|
| Service worker | `sw.js` — network-first for HTML + skipWaiting + clients.claim. HTML changes reach users on next reload without cache bumps. Non-HTML assets use cache versioning (~22 file precache scope swept PM-405). Push event listener + notificationclick handler shipped 28 April. **Build marker invariant:** every vyve-site commit must bump `sw.js` `CACHE_NAME` suffix + `<span id="vbb-marker">` in BOTH `index.html` AND `<span id="settings-vbb-marker">` in `settings.html`, all in same commit (PM-299, memory #10). Build number permanently visible on Settings page. |
| Bus | `bus.js` — `VYVEBus.publish(eventName, envelope)` cross-cutting event spine. ~37 distinct event names live; 86 publish call sites. Envelope shape `{kind, source, client_id, origin, ...}`. `origin === 'local'` filters analytics to physical user actions only. **§23.42:** in-page subscribers should not envelope-trust events the same page already mutated optimistically — that's a cross-page-only pattern. |
| Achievement client | `achievements-evaluator.js` (~1660 LOC) — Dexie-first, bus-subscribed evaluator across all 6 pillars. Loaded on every page that publishes a tracked bus event AND on `engagement-v2.html`. Subscribes to 13 bus events, runs ~65 handler functions, debounces 100ms, fires toasts via `window.VYVEAchievements.queueEarned()`, claims earns via `achievement-claim` EF in background. Catalog cached in localStorage 24hr TTL. `earnedSet` populated from Dexie `member_achievements` at boot. |
| Local DB | `db.js` (Dexie, SCHEMA_V22) + `sync.js` — local IndexedDB cache for member-scoped tables + catalogue tables (with `CATALOGUE_FRESH_TABLES` 5-min stale window + `CATALOGUE_INVALIDATION_KEY` immediate-bump path). `VYVELocalDB.<table>.allFor(email)` is the canonical Dexie read. **Reminder:** `id: clientId` MUST be in POST payload, not just `client_id`, or server gen_random_uuid() creates Dexie duplicates (PM-386). **PM-425→REVERTED PM-436:** wpc Dexie PK was moved `member_email`→`id` to mirror BOTH surfaces (workouts + movement) locally, but re-keying an existing store jams the iOS IndexedDB upgrade (§23.83) → `db.open()` rejects → noop shim → blank rings/habits/progress on every device with v21 data. Reverted to `'member_email, is_active, generated_at'`; `db.version(22)` kept as a no-op bump for clean self-heal. Multi-plan-local mirror deferred — re-do via a NEW id-keyed store (Option B, backlog), never by re-keying this one. Both read surfaces (`workouts-programme.js` L84-98, `movement.html` `fetchPlan`) are surface-filtered + REST-fallback, so one local wpc row per member is safe. |
| Analytics | `analytics.js` — 29 VYVEBus events mirrored to PostHog. `vyveEFFetch` wraps fetch for `ef_error` capture. |
| Haptics | `haptics.js` — `VYVEHaptics.{selection, light, medium, success, heavy, error, warning}()` bridge. Loaded across 40+ surfaces. Palette: selection (steppers) / light (un-ticks, optimistic list deletes) / medium (destructive commits) / success (additive logs, save commits) / heavy (achievement reveal) / error (failure) / warning (pre-confirm). |
| Theme | `theme.js` — dual dark/light CSS tokens. `data-theme` on `html`. localStorage. All pages use dual-token CSS blocks — never single `:root`. Full light-mode pass shipped across 46 pages (PM-494→508, 6 Jun): white cards + semantic tokens on every surface. |
| Nav | `nav.js` — body-prepend pattern. Back button on inner pages, logo-only on home. Body icon Lucide `person-standing` (PM-376). |
| Consent gate | Built. Writes `privacy_accepted` + `health_data_consent` to `members`. |
| Viewport zoom | Disabled across all pages. |
| `target="_blank"` | Audit complete. |
| Offline mode | Cached portal content viewable offline; new HTML surfaces must land in `sw.js` precache in same commit (PM-405 audit signal). |

---

## 9. Onboarding flow

Member pays via Stripe → redirects to `welcome.html` → **stream picker** (workouts / movement / cardio) → onboarding questionnaire → `onboarding` EF → Supabase writes + persona assignment + habit assignment + stream-aware programme overview + weekly goals (5 targets) + recommendations + Brevo welcome email with App Store / Play Store download buttons + programme card. Phase 2 (`EdgeRuntime.waitUntil()`) writes the full 8-week workout JSON to `workout_plan_cache` in the background — only triggered when `stream==='workouts'`.

Supabase Auth user created directly by the onboarding EF. No Make, no Auth0.

Welcome email via Brevo includes programme overview card + native App Store / Play Store download buttons (iOS `https://apps.apple.com/gb/app/vyve-health/id6762100652`, Android `https://play.google.com/store/apps/details?id=co.uk.vyvehealth.app`). PWA install steps removed in May 2026. Stripe coupons `VYVE15` and `VYVE10`. Annual discount % TBD.

### Questionnaire — Section A (About you)

Order: First name + Last name (input-row) → Email + Confirm email (input-row, paired) → Mobile (own q-group, optional) → DOB + Gender (input-row) → Where are you based.

### Questionnaire — Section C (Physical Health, Workouts branch) field reference

- `location-train` (single, mandatory): `Full commercial gym` | `Basic gym` | `Home` | `Hotel gym` | `Mixed` | `Not sure`
- `equipment` (multi, conditional): `Bodyweight only` | `Resistance bands` | `Dumbbells` | `Kettlebells` | `Barbell and weights` | `Machines` | `Cables`
- `gymExperience` (single, mandatory): `Beginner` | `Intermediate` | `Advanced` | `Returning`
- `trainDays` (single, mandatory): `1-2` | `3` | `4` | `5+` | `Not sure`
- `sessionLength` (single): `15` | `20` | `30` | `45` | `60` (minutes) — **POSTed but not yet persisted by EF**
- `priorityMuscle` (single, optional): `Glutes` | `Arms` | `Back` | `Chest` | `Shoulders` | `Legs` | `None` — **POSTed but not yet persisted by EF**

Injury flags: `Shoulders` | `Knees` | `Hips` | `Back / spine` | `Wrists` | `Ankles` | `None`. Free-text avoid-exercises field retained.

**Persistence gap:** `sessionLength` + `priorityMuscle` POSTed but EF doesn't read/save. Add columns to `members` + bump EF in Stage 3 of the parked workout-engine work.

### Movement and Cardio streams

Movement stream still routes through legacy AI generation (movement engine planned post workout-engine v2). Cardio stream goes through `running-plan.html` + `anthropic-proxy`.

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

### HAVEN open issue

The onboarding EF assigns HAVEN to members hitting the low-wellbeing/high-stress thresholds. Phil has **not** signed off on the HAVEN persona content. Two paths in §22.

---

## 11. AI features

### Portal AI (Dean — technical)

| Feature | Status |
|---|---|
| Onboarding recommendations (persona assignment + 3 first-week recs + programme overview) | LIVE (`onboarding` EF) |
| Running plan generator | LIVE (`running-plan.html` + `anthropic-proxy` + Supabase cache) |
| Weekly check-in recommendations (persona-voiced AI recs) | LIVE (`wellbeing-checkin` + audit row) |
| Workout plan generator | LIVE (`generate-workout-plan` at onboarding via waitUntil) |
| **Habits × HealthKit autotick** | LIVE end-to-end. Schema + Lewis-approved seeds on `habit_library.health_rule`. Server evaluator in `member-dashboard` v55+ with `_shared/taxonomy.ts`. Client UI in `habits.html` with pre-tick on auto-satisfied rows. Cohort-wide post 1.2 — `member_health_connections` truthsource. |
| **Achievements (v2 catalogue, Dexie-first evaluator)** | LIVE — 107 metrics × 538 tiers, all-pillar Dexie-first via `achievements-evaluator.js` per PM-335 redirect. Server-side `_shared/achievements.ts` + `log-activity evaluate_only` retained for v1 metrics in dual-path. Idempotent claim via `achievement-claim` EF. Push fan-out via `achievement-earned-push`. See §11A. |
| **Engagement Score v2** | LIVE behind `?score=v2` flag + in-app chip link (PM-295). Six-pillar base × consistency × variety / 2.5, base 50 floor, ceiling 100. JS↔SQL parity proven on real member data. v1 path untouched alongside v2. See §11C. |
| Recurring weekly goals (fixed 4-row template) | LIVE — 3 habits / 3 exercise / 2 live sessions / 1 weekly check-in. Computes against `member-dashboard` goals payload. |
| Mind sub-pages (meditation / sleep / breathwork / visualisation / journal / affirmations) | LIVE — write to `mind_activities` with `kind` discriminator. Catalogue-driven content from `mind_videos`. |
| Movement track | LIVE — `movement.html` (state-aware, `<body data-mv-state=1..5>`) + `movement-history.html`, writes to `movement_activities`. PM-307 promotion to first-class table closed dual-write to legacy `cardio.logged_via='movement'` + `workouts.plan_name='Movement'` shapes. **PM-420 step 4c (vbb 301):** Today's Movement card (states 1-2, prompt_pool tap-to-complete), Sport quick-log pill, Add Activity HK-supplement modal (step top-ups summed onto HK ring base, survive refresh). **PM-426..431 (vbb 307→312):** Movement V2 picker (`movement-plans.html`) brought to portal standard (theme.css, nav.js, cache-first paint) + the picker→home flow made instant via the PM-427 Dexie wpc mirror; `renderPlan` now routes ANY sessionless movement plan (just_steps + locked_ramp Foundation/Distance) to the state-aware render — previously the structured session renderer's `if (!session) showNoPlan()` discarded picker-created plans and showed the no-plan CTA (§23.81). prog-card now names locked-ramp plans (states 1/2); Just Steps target editable while current; Add-steps modal opaque. |
| Member Prompts (Lewis-driven in-app questionnaires) | LIVE (PM-375) — 4-table schema, 8 question types, bottom-sheet modal on home boot. Two canary prompts seeded (weekly-preference, app-feedback). |
| Broadcast Push (Lewis manual + cron-driven recurring schedules) | LIVE (PM-402) — admin UI at `admin.vyvehealth.co.uk/#/broadcast`. 6-shape audience resolver. Full fan-out to in-app + native + web. |
| Weekly progress email (Friday, AI-generated, Brevo) | BACKLOG — blocked on Lewis copy template |
| Persona context modifiers (age 50+, beginner, time-poor, new parent) | BACKLOG |
| Session recommender (post check-in, mood/energy/time-aware) | BACKLOG |

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

## 11A. Achievements architecture

### Data model

Three tables: `achievement_metrics` (107 rows), `achievement_tiers` (538 rows, copy-status-gated upsert), `member_achievements` (UNIQUE `(member_email, metric_slug, tier_index)`, `seen_at` toast-state column).

Pillar grouping (v2 catalogue locked PM-322): Body / Habits / Mind / Connect / Check-ins / Focus, plus hidden HK / collective / tenure / one-shot categories. Layout direction C (Hero + Map). Tier pattern 3 (levels-up rows, gold dots showing earned tiers underneath). Badge visual Path B (Lucide icon inside 10-tier gemstone-coloured frame: bronze → silver → gold → sapphire → ruby → emerald → amethyst → pearl → obsidian → diamond).

### Architectural shape (post-PM-335 redirect)

**Member-action evaluation is Dexie-first, client-side, bus-subscribed.** Server-side inline/sweep split (the original §11A architecture) superseded for member-action metrics. Reason: instant feedback on the threshold-crossing tap is non-negotiable; server round-trip is 200-400ms best case, 2-3s on cellular — that breaks the achievement-toast moment.

**Components:**

1. **`achievements-evaluator.js`** (~1660 LOC client lib). Loaded on every page that publishes a tracked bus event AND on `engagement-v2.html`. Subscribes to 13 bus events; per event, debounces 100ms then runs all metric handlers (~65 across all events). Each handler reads Dexie store(s), computes a current value, calls `newEarnsForThreshold(slug, value)` against cached tier ladder, returns any tier rows ≥ threshold AND not in `earnedSet`. Earns flow to optimistic toast via `window.VYVEAchievements.queueEarned()` + background POST to `achievement-claim` EF. `earnedSet` populated from Dexie `member_achievements` at boot. Catalog cached in localStorage 24hr TTL (single fetch from `achievement_metrics` + `achievement_tiers` PostgREST — public SELECT RLS).

2. **`achievement-claim` EF v1** (JWT-required). Resolves member email from JWT, verifies `(metric_slug, tier_index)` exists in catalog (anti-tamper), inserts to `member_achievements` ON CONFLICT DO NOTHING, fans out to `achievement-earned-push` via `EdgeRuntime.waitUntil()` *only if* `newly_inserted=true`. Idempotent re-claims are no-ops with no double-push.

3. **Server-side server path (still live).** `_shared/achievements.ts` + `log-activity evaluate_only` retained for v1 server-wired metrics (workouts/cardio/sessions/etc) until full retirement. The unique constraint on `member_achievements` makes dual-path safe (no double-claim possible). `achievements-sweep` cron remains for tenure / HK lifetime / charity collective — genuinely sweep-shaped metrics.

### Sweep-still-server metrics

`member_days` tenure, HK lifetime (`lifetime_steps`, `lifetime_distance_hk`, `lifetime_active_energy`, `nights_slept_7h`), `charity_tips`, `personal_charity_contribution`. Run from `achievements-sweep` daily 22:00 UTC. Phase 2 sweep extensions still pending.

### Voice rules (locked for future ladder extensions)

- No emojis anywhere.
- Titles 3–6 words. Bodies 10–20 words (hard window, validation rejects).
- VYVE voice: proactive wellbeing, performance investment, prevention over cure, evidence over assumption. No fitness-influencer tone.
- Tier 11+ on long ladders short and reverent, no next-tier nudge.
- Recurring metrics: copy reads naturally as a repeatable milestone (no "another" assuming prior).
- Globally unique titles across all tier rows.
- Streaks ≠ counts in body voice — streaks emphasise consecutive cadence, counts emphasise cumulative volume.

### Phase 3 UI — LIVE

Lives on `engagement-v2.html` (replacing standalone Achievements tab plan from PM-322 once three-tab shell ships per §11C). Recently earned + Up next + Trophy cabinet (Path B 10-tier gemstone frames). Modal opens for any tile click and shows the full tier ladder with earned rows tinted gold, current row teal-bordered with inline progress bar, locked rows muted. Optional `tierIndex` deep-link from toast.

### Known partial implementations (backlog, not blocking)

- `daily_focus_all_complete` uses ≥3 distinct focuses/day proxy (not slot-locked to today's GRID triple)
- `weekly_focus_completion` uses ≥7 days/week proxy (not 21-slot completion %)
- `daily_mood_checkins` + `daily_mood_streak` are no-op (no Dexie store or bus event)
- `reactions_received` + `checkins_with_reactions` return 0 (local Dexie only has reactions GIVEN; received needs Realtime or server view)
- `chat_messages_posted` no-op (no bus event)
- `muscle_groups_week` no-op (no muscle→exercise taxonomy)
- `volume_lifted_total` evaluator not yet wired (needs sanity caps `reps > 100` OR `weight > 500`)

### Architectural lessons earned (codified across PM-335→389)

- **§23.77 candidate (third reinforcement at PM-389):** any new activity table requires touching `compute_engagement_components_v2` SQL function + `v_active_days` + dirty-mark triggers + JS mirror `computeEngagementComponentsV2` + activity-breakdown tile renderers. Three independent occurrences (PM-307 movement, PM-173 mind, PM-289 connect).
- **Bus envelope shape ≠ Dexie row column names.** Confirm Dexie column names against `db.js` SCHEMA_V<N> before reading from a store inside an evaluator.
- **sync.js `member_achievements` is additive-pull.** Server deletes don't propagate. Either build a delete-reconciler in sync.js (preferred long-term) or expose a client-side "forget local" helper.
- **Toast routing skips redirect stubs.** Route directly to the live page with query params, not to a stub-page with hash.

---

## 11B. Page documentation (`/page-docs/`)

Top-level folder in VYVEBrain repo opened PM-285. One markdown file per portal page describing what the page is, why it exists, what a member sees, how they use it, and what data flows through it. Plain English, member-readable, no SQL, no §23 references.

**Distinction from `/brain/master.md`.** Master is engineering-context only — Claude reads master for technical work, never these docs. `/page-docs/` is for Lewis/Alan/Calum/Phil/Vicki/Cole, sales prospects, support team, and ultimately the member-facing help centre.

**File naming.** Lowercase, matching the HTML filename: `engagement.md` for `engagement.html`, etc.

**As-you-go discipline (locked PM-285).** When a session touches a page, the corresponding `/page-docs/<page>.md` ships in the same commit as the code change, drafted or refreshed to match the page's current state. Avoids the documentation-deferred-forever failure mode. If the page-doc doesn't exist yet, this is the session that creates it. A whole-session backfill pass is acceptable as a session theme, but no individual page change ships without its doc being touched.

---

## 11C. Engagement Score v2 architecture (PM-295, 25 May 2026)

Six-pillar base × multipliers, 50 floor, 100 ceiling, 7-day linear decay. Designed PM-285, shipped PM-295 behind `?score=v2` flag + in-app chip link from engagement.html (Capacitor wrap has no URL bar, so redirect-only path didn't work alone).

### Formula

`final_score = 50 + min(50, (base_points × consistency_mult × variety_mult) / 2.5)`

### Six base-point pillars

| Pillar | Source tables | Per-event | Cap |
|---|---|---|---|
| **Today's Focus** | rows with `focus_slug IS NOT NULL` across cardio/connect_checkins/mind_activities/movement_activities | 5 pts | 3/day |
| **Daily Habits** | daily_habits | 1 pt | 5/day |
| **Body** | workouts + cardio + movement_activities (focus_slug IS NULL) | 2 pts | 2/day |
| **Mind** | mind_activities (focus_slug IS NULL) | 2 pts | 2/day |
| **Connect** | connect_checkins + session_views + replay_video_views + session_live_views | 2 pts | 2/day |
| **Check-ins** | wellbeing_checkins (8/week) + live_checkin_submissions (4/week) + monthly_checkins (12/month) | varies | form-level uniques |

**Focus disambiguation:** rows with `focus_slug IS NOT NULL` count under Focus ONLY, never under underlying pillar — prevents double-count (Reset focus writing to mind_activities would otherwise credit both Focus 5pts AND Mind 2pts).

### Multipliers — locked curves

**Consistency** driven by `active_days_7` (distinct activity_dates across all source tables in last 7 days):

| Days | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|---|---|---|---|---|---|---|---|---|
| Mult | 0.85 | 0.90 | 0.95 | 1.00 | 1.08 | 1.15 | 1.23 | 1.30 |

**Variety** driven by `pillars_touched_7` (count of 6 pillars with points > 0):

| Pillars | 0 | 1 | 2 | 3 | 4 | 5 | 6 |
|---|---|---|---|---|---|---|---|
| Mult | 0.90 | 0.90 | 0.95 | 1.00 | 1.07 | 1.14 | 1.20 |

Worked examples: workout-only 5 days/week → 53. Well-rounded 7/7 across 5 pillars → 85. Once-a-week struggler → 53. Exceptional week with all check-ins → 92. Inactive 7+ days → 50.

### Wellbeing dropped

Submitting an honest "I feel rough today — 3/10" should never penalise the score. The *act* of submitting earns 8 points (under Check-ins); contents inform AI recs not score. The v1 `engagement_wellbeing` column still populated for v1 backwards-compat but plays no role in v2.

### Schema delta

`member_home_state` gained 11 columns: `engagement_focus_points`, `engagement_habits_points`, `engagement_body_points`, `engagement_mind_points`, `engagement_connect_points`, `engagement_checkins_points`, `engagement_consistency_mult`, `engagement_variety_mult`, `engagement_active_days_7`, `engagement_pillars_touched_7`, `engagement_score_v2`. v1 columns untouched, both score paths populated by `refresh_member_home_state()` (v1 path renamed `refresh_member_home_state_v1_internal`).

### Compute parity — JS ↔ SQL

`compute_engagement_components_v2(p_member_email text)` SQL function in `public`, SECURITY DEFINER, returns 13-field record. `computeEngagementComponentsV2(tables, today)` in `home-state-local.js` returns same 13-field shape. Parity proven at 72/72 exact match on real member data.

### Page architecture (`engagement-v2.html`)

Sticky standalone page behind `?score=v2` redirect from `engagement.html` + in-app chip link. Score hero + multiplier strip + 6 pillar rows + Activity Breakdown 5-card grid + 30-day chip-row log + eye-icon explainer sheet. Score subscriber on all score-affecting bus events with 50ms debounce.

### v1 cleanup

Not done. v1 columns + v1 SQL function + v1 page all still live and untouched. Default flip + cleanup is a follow-up commit after Dean device-verifies v2 numbers.

### Three-tab future shape — DEFERRED

Engagement page (`Your Journey`) is a three-tab shell. **PM-435 order: Progress (default) / Score / Achievements** — Progress renders from Dexie on boot (no longer lazy-only). Score = v2 engagement content. Progress = the five capped pillar buckets (habits/mind/body/connect/checkins, identical caps to the cert tracks) + charity mechanic. Achievements = trophy-cabinet block from §11A. Achievements deep-link routes by `data-tab` click, order-independent.

### Push notification thresholds — DEFERRED

Re-engagement-scheduler v11 with soft-slide / pillar-gap / re-engagement thresholds originally scoped for PM-295 but deferred — pushes driven by a score nobody's confirmed on device yet was wrong sequencing.

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

### Cron jobs

See §7 for the 30 active pg_cron jobs.

---

## 13. Employer & member dashboards

### Employer dashboard

Live at `www.vyvehealth.co.uk/vyve-dashboard-live.html`. Served by `employer-dashboard`. API-key auth via `EMPLOYER_DASHBOARD_API_KEY`. **Aggregate only — no PII ever visible to employers.** Active = 0–7 days inactive · Quiet = 8–30 · Inactive = 30+ or never.

Trial/test data only today. Per-employer Auth-gated URLs (e.g. `/sage`) build when first enterprise trial starts.

### Member dashboard

Single call to `member-dashboard`. Cache-first — renders instantly from localStorage on return visits, snapshot-first paint per PM-396/397/398 to eliminate skeleton flicker. Server-authoritative hydration on every page load. HealthKit truthsource is `member_health_connections` row presence in the EF, not localStorage.

**Engagement score — v1 live, v2 design-locked PM-285, shipped PM-295 behind flag.** See §11C.

5 progress tracks: Daily Habits (The Architect), Workouts (The Warrior), Cardio (The Relentless), Sessions Watched (The Explorer), Weekly Check-ins (The Elite). 30-activity milestone certificates.

Achievements `unseen / inflight / recent / earned_count / hk_connected` payload also live in `member-dashboard` — Phase 3 UI on `engagement-v2.html`.

### Admin console

`admin.vyvehealth.co.uk` — live with Shell 1 (member viewer) + Shell 2 (pencil-click edits) + Shell 3 Sub-scope A (programme / habits / weekly-goals panels with shared reason modal). Sub-scope B (bulk ops + multi-select) queued. Lewis-facing broadcast UI at `/#/broadcast` (PM-402).

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

**Cache.** `workout_plan_cache` — historically one row per member, full 8-week JSONB programme. Generated at onboarding in background (Phase 2 waitUntil). **UNIQUE constraint contradiction being resolved (PM-420 step 4a-pre-2):** dropping `workout_plan_cache_member_email_key` (full unique on `member_email`); keeping `workout_plan_cache_one_active_per_member` (partial unique WHERE `is_active=true`). Enables plan history. Onboarding EF v86 already uses deactivate-old + insert-new write pattern. Pending: site patch (`workouts-session.js` filter add) + full-unique drop migration.

**Architecture.** All 5 plans available. AI recommends weekly schedule, not plan selection.

**Custom workouts.** `custom_workouts` table — member-created sessions.

**Exercise logs.** Plan-agnostic `exercise_logs` stores all sets/reps/weight permanently.

**Exercise Hub.** `exercise.html` as hub (Dean's "Body"), streams as sub-pages (`workouts.html`, `movement.html`, `cardio.html`). `members.exercise_stream` column (default `workouts`). Welcome flow includes stream picker.

**Movement track.** `movement.html` + `movement-history.html` write to `movement_activities` (PM-307 first-class promotion from `cardio.logged_via='movement'` + `workouts.plan_name='Movement'`). Movement plan content in `programme_library` still requires `category` backfill (PM-411 architectural item).

### Workout Engine v2 — PARKED

Calum delivered spec, scoring data (203 exercises × 8 base dimensions + 5 context fits + tier), and 20-scenario QA framework on 27 April. Architecture decided: deterministic engine (filter → score with context weights → rank → fill slots) replaces AI exercise selection. AI used only for programme name/rationale (Sonnet 4) + Layer 2 reviewer (Haiku 4.5). Drops cost ~30× AND raises quality. **Resumes when Calum returns filled inputs pack.**

---

## 15. Marketing, brand & content production

### Brand identity

| Element | Detail |
|---|---|
| Marketing site | `www.vyvehealth.co.uk` (GitHub Pages, `Test-Site-Finalv3`). |
| Brand palette | `#0D2B2B` (dark), `#1B7878` (teal), `#4DAAAA` (teal-light), `#C9A84C` (gold). |
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
| Article 15 export pipeline | LIVE (07 May 2026 commit 3) — `gdpr-export-request` + `gdpr-export-execute` + `gdpr_export_requests` table. Member-self 1-per-30-days rate limit, unlimited admin path. Brevo email + 7-day signed URL. |
| Article 17 erasure pipeline | LIVE (07 May 2026 commit 4) — `gdpr-erase-request` + `gdpr-erase-cancel` + `gdpr-erase-status` + `gdpr-erase-execute` + `gdpr_erasure_requests` table. 7-day cancellation window. Per-subject PL/pgSQL deletes in dependency order. Stripe + Brevo + PostHog purge rolled into execute path. |
| Microsoft Exchange (GoDaddy) | `team@vyvehealth.co.uk` is on a personal Microsoft Exchange via GoDaddy. Migrate to proper Workspace tenant post-first-enterprise-contract. SCCs: not in place; required if/when EU subprocessing involved. |
| External DPO | Required before 500 members. Budget £2–5K/year. |
| Employer reporting | Aggregate only — no individual names ever. |
| RLS | All 120 public tables have RLS enabled (26 May 2026 audit). |
| Security questionnaire | `brain/security_questionnaire.md` — pre-canned answers for procurement reviewers. |
| WHISPA programme | £3.7M research launching May 2026 — potential research partnership. Monitor. |

---

## 17. Charity mechanic

**Individual track.** Every 30 completions of a specific activity type = 1 free month donated to a charity partner recipient.

**Enterprise track.** Every 30 activities collectively by a company's members = 1 free month donated.

**Framing.** Collective impact — the team's activity funds access for people in need via VYVE's charity partners. Not a personal referral reward. Central to CIC positioning and social-impact narrative.

**Charity partner categories.** Addiction recovery · homelessness & reintegration · mental health organisations · social mobility programmes · physical health access for underserved populations.

**Partner economics.** £0 cost to charity partners to refer recipients. £0 cost to recipients. Counters reset after each 30 activities — unlimited donations possible. Milestone certificates awarded automatically.

**Named partner status:** Not yet confirmed. To be added once the first formal partnership agreement is in place.

**Operational mechanics.** Six `charity_count_*` AFTER INSERT/DELETE triggers across cap-aware activity tables maintain `platform_counters.counter_key='charity_total'`. Reconciled daily 02:30 UTC via `vyve_charity_reconcile_daily` cron with self-heal on drift. Read via `get_charity_total()`.

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

Hosted via GitHub Pages (`Test-Site-Finalv3`). Domain routes via Cloudflare. The portal pages at `online.vyvehealth.co.uk` are bundled inside the iOS + Android Capacitor binaries; the web URL itself is a browser-accessible account-management fallback.

---

## 19. Current status

### PM-569 — iOS 1.7 LIVE + deployment model flipped to bundled (2026-06-09)

iOS approved + live on the App Store at **1.7** (1.5 = first bundled submit PM-557; 1.6 submitted-then-cancelled; jumped to 1.7). 1.7 ships with `server.url` removed → **iOS members are now frozen on the bundled vyve-site SHA**, updatable only via a Capawesome OTA. **No OTA has ever run end-to-end**, so iOS members currently have no working update path short of a full store resubmit — new §23.106, top native priority before Sage. Dean alone runs the server.url dev-loop shell on his iPhone (sees every commit); members do not. Android bundled 1.0.6 vc51 still in review (approval unconfirmed) — Android members remain on the server.url live shell until it lands. §5 native row + §23.4 + §23.92 rewritten; PM-475 "no frozen cohort" correction reverted. vyve-capacitor remote is behind Mac-local on the 1.7 ship-state. Exec brief for Lewis + Alan produced (`VYVE_Platform_Update_2026-06-09.md`). No vyve-site code shipped — consolidation + brain only.

### PM-484 — Check-in merge: branching 5-step flow + enriched AI debrief (2026-06-05)

DB migration landed (8 new columns on `wellbeing_checkins`). `wellbeing-checkin` EF updated to v22 with full enriched signal assembly from 7 tables and structured AI response. `wellbeing-checkin.html` rebuilt as 5-step branching flow with new results screen. vbb Update 357. **Pending Lewis copy + Phil clinical sign-off for question wording** — structure is live, placeholders active.



Rolling 3-5 most recent ship narratives. Full detail for recent sessions lives in `brain/changelog.md`; everything pre-PM-554 (22 Apr — 7 Jun, trimmed from changelog.md at the PM-554 consolidation) is preserved in `brain/changelog-archive.md`. §19 is a status board, not an archive.

### PM-540/541 — JWT auto-refresh + session never-expire config (7 Jun 2026)

`window.vyveGetJWT` added to `auth.js`: shared helper that silently refreshes a stale access token via `refreshSession()` before returning. Returns `null` on genuine failure — never redirects mid-session. Hard login redirect stays in `vyveInitAuth` (cold boot) only. `habits.html` `supa()` updated to use `vyveGetJWT`; redirects to login only when null (truly dead session). `notifications.html` `getJWT` stub wired to delegate to `window.vyveGetJWT`, fixing "Couldn't load notifications" crash. Root cause: habits.html fired 3 parallel RLS queries with an expired access token simultaneously — all 401'd. Supabase Auth config patched via Management API: `sessions_timebox: 0`, `sessions_inactivity_timeout: 0` — members are never force-logged-out. vbb 411→412.

 + hybrid thumbnail model + Storage migration + on-device caching + deployment-model correction (4 Jun 2026)

Live-session host attributions corrected across the 30-day calendar (calendar_occurrences, UPDATE keyed on session_title): mindfulness talks wrongly credited to Lewis reassigned to Stephen / Jamie / Megan / Lucy (Lewis now hosts ZERO); Guided Journaling → Jamie. Thumbnails resolved into a hybrid per-host + per-type model (host photo by default; pilates.jpg for Nicola Pilates ×6, stretching.jpg for Alex Healthy ×20). New host photos supplied: megan, lucy (replaced), nicola, stephen, calum, alan, shan + type thumbs (PM-471/472 to /assets/hosts/). PM-473 added warmThumbnailPool() on-open prefetch + hardened a dead .all() (§23.87). PM-474 added the sw.js SWR cache vyve-session-thumbs-v1 (PRESERVE-listed). Then migrated the whole set to Supabase Storage bucket session-thumbnails and repointed image_url at Storage public URLs (seeded via one-shot seed-host-thumbnails EF over pg_net using LEGACY_SERVICE_ROLE_JWT after the Storage REST sb_secret_* rejection — §23.7). Net: thumbnails are content not code — instant via warm + SW cache, offline-capable, auto-updating, bundle-safe. Also confirmed + corrected the deployment model: capacitor.config.json ships server.url=live, so the WHOLE cohort is server.url-live (not bundled 1.3) — §5 / §23.4 corrected, new §23.92. Backlog: delete one-shot seed-host-thumbnails EF; remove dormant /assets/hosts/*.jpg copies; Calum/Alan/Shan staged but unscheduled.

### PM-424 — Mind tracker debug strip gating closed (28 May 2026)

Member-facing PM-324 debug strip was leaking onto every Today's Focus meditation play on `mind.html`. PM-418 gated the open-time render but left an ungated 1s `setInterval` poller re-inserting it. Fixed by guarding `renderDebugStrip()` at its entry behind `vyve_dev_panel_unlocked` (vyve-site `9300a0bf`, 4-file atomic, vbb 304→305). §23.63 candidate sharpening banked: gate the render fn entry, not the call site — pollers/subscribers bypass call-site gates. Remaining: the 8 `*-live.html` session-live strips still want a device-walk gating confirm.

### PM-413 — iOS 1.4 + Android 1.0.5 both submitted to App Review (26 May 2026)

iOS 1.4 build 3 sitting `Waiting for Review` in App Store Connect, auto-release on approval (24-48hr expected). 1.3 sidebar entry `Ready for Distribution` will auto-supersede on 1.4 approval. Android 1.0.5 versionCode 50 production release saved in Play Console; AAB accepted with 4 non-blocking warnings. Earned §23.76 (iPad orientation 4-array invariant — iOS Code 90474). Mac local has uncommitted changes to capacitor.config.json + several Android/iOS files that the remote `7a54c876` doesn't yet carry — selective audit-and-curate commit on vyve-capacitor pending. Brain doctrine corrected: Mac local was the real source of truth for the prior bundle ship, not the remote. Going forward, remote must match Mac-local ship-state after every bundle session via curated atomic commit. App Review notes scanned for residual "PWA-based" framing per §23.20 — corrected pre-submission.

### PM-411 — Bundle-prep park entry, no vyve-site changes (26 May 2026)

Park entry holding state for Dean's Thursday pickup ahead of Pro 20x weekly limit reset. Bundle-prep prompt locked at `/mnt/user-data/outputs/bundle-prep-prompt.md`. Body-hub overhaul campaign documented from the deanonbrown2@gmail.com onboarding walk earlier in the session. Three Body-side bugs surfaced — Bug A architectural (post-trial, 4-6h): Movement plan structurally homeless because workout_plan_cache rows all have `category: null` and exercise.html L350 hardcoded `href="workouts.html"` regardless of programme category. Bug B surgical (Thursday, 30-45min): activateProgramme cache-bust race where workouts-programme.js L78-89 reads Dexie before un-awaited criticalHydrate propagates. Bug C surgical (needs device console, 30-60min): Browse Library tab runtime error swallowed by outer try/catch. Schema-architecture note banked-not-codifying-solo: workout_plan_cache has contradictory UNIQUE indexes that may make workout-library EF v13 paused-plan logic non-functional in practice — promotes to §23 on second occurrence.

### PM-410 — Replay catalogue wipe + refresh-replay-videos v2 reconciliation (26 May 2026)

All 33 test-content replay videos archived to a new private YouTube playlist and source playlists emptied. `refresh-replay-videos` v2 shipped with a reconciliation step that DELETEs `replay_videos` rows whose `youtube_video_id` isn't in any live playlist — closes the permanent gap where YouTube-side deletions never propagated to Supabase. Three throwaway EFs deployed for the work are dormant in Supabase pending dashboard delete. Member-visible result: Replays hub shows empty state across all 8 categories on next page load until Lewis lands real content. §23 candidate banked: upsert-only sync without reconciliation = stale-row class bug whenever upstream supports deletion. Promotes on second recurrence.

### PM-408 — Analytics taxonomy ship pre-bundle (26 May 2026)

`analytics.js` central PostHog bridge added (267 lines, 45 HTML pages wired, precached via sw.js). Subscribes 29 VYVEBus events at `envelope.origin === 'local'` to avoid double-counting cross-tab/realtime echoes. auth.js v2.5 enriches identify with `{given_name, family_name, is_dean, host_kind}` for Dean-dev-traffic filtering and bundled-vs-web split. New `window.vyveEFFetch` wrapper available for opt-in EF error capture (not yet retrofitted). Banked NOT shipped: duplicate `posthog.init` inline block in index.html L1043-1046 pre-empts auth.js deferred init — safer as its own ship with incognito verification.

### PM-402 — Broadcast push infrastructure shipped end-to-end (26 May 2026)

Lewis-facing manual broadcast UI live at `admin.vyvehealth.co.uk/#/broadcast`; scheduled-push cron rails (no UI v1). New `broadcast_schedules` + `admin_broadcast_log` tables, `is_admin()` SECURITY DEFINER RPC, `resolve_broadcast_audience(jsonb)` resolver supporting 6 audience shapes. Two new EFs: `admin-broadcast-push` v2 (JWT-gated, defence-in-depth via is_admin RPC) and `scheduled-push-runner` v2. New pg_cron job 28 every 5min. Smoke test green end-to-end across all four channels (in-app row + APNs + VAPID web + audit log). Out-of-scope-v1 parked: scheduler creation UI in Command Centre, quote-pool infrastructure, Android FCM banners, same-day dedupe, custom audience JSON editor. Auth-shape gotcha banked first-occurrence: post-key-rotation `SUPABASE_SERVICE_ROLE_KEY` is `sb_secret_*` shape; EFs calling `send-push` with the legacy Bearer-equality check need `LEGACY_SERVICE_ROLE_JWT` instead.

---

## 20. Enterprise contract blockers

| Item | Owner | Status |
|---|---|---|
| B2B volume tiers defined | Lewis + Dean | OPEN |
| HAVEN clinical review | Phil | PENDING — persona content held from sign-off; auto-assignment currently active in production (see §10) |
| Brevo logo removal | Lewis | OPEN — ~$12/month add-on, needed before first enterprise demo |
| Employer dashboard build | Dean | OPEN — dashboard itself not built yet; API key wiring is downstream of that. Backlog item (Admin / Command Centre). |

---

## 21. Outstanding build items & priorities

The bundle-ready campaign drove the work for most of late May. iOS 1.4 + Android 1.0.5 are now in App Review (PM-413), so the immediate next state depends on review outcome. Re-pillar items below by phase only when bundle clears.

### Pre-launch (next sessions)

- **Body-hub overhaul (PM-411 backlog).** Bug A architectural (movement plan structurally homeless — programme_library category backfill + onboarding EF v37 to write category + exercise.html branching + movement.html programme-card section). Bug B surgical (activateProgramme cache-bust race in workouts-library.js / workouts-programme.js). Bug C surgical (Browse Library tab runtime error swallowed by try/catch). Mockup-first per the working style; Bug A is post-trial scope, B/C are Thursday-grade.
- **vyve-capacitor remote sync.** Dean's Mac at session end (PM-413) has uncommitted changes to capacitor.config.json + android/app/build.gradle + ios/App/App/Info.plist + package.json + ic_launcher_background.xml + regenerated mipmap PNGs. Selective audit-and-curate commit pending; remote `7a54c876` is missing the bundle session's recovery work.
- **Phil sign-off chase.** HAVEN persona auto-assignment still active in production (Conor Warren since 15 April) without clinical review. `VYVE_Health_Hub.html` staged in web root awaiting same. Both gated on Phil.
- **iOS 1.4 / Android 1.0.5 review outcomes.** Confirm Play Console shows `In review` not `Draft` next session (Dean had the "Send 1 change for review" button staged at PM-413 commit time).

### Pre-launch hygiene

- **OTA bundle prep.** Capawesome live update wiring needs a clean commit on `package.json` (Mac local has LiveUpdate via SPM in Xcode but not in package.json). First-ever Capawesome OTA push consider `--rollout 0.1` canary.
- **Replay catalogue refill.** PM-410 wiped all 33 test-content replay videos; Replays hub shows empty state until Lewis lands real content. Throwaway EFs (`replay-inventory-tmp`, `replay-archive-tmp`, `replay-ghost-cleanup-tmp`) still ACTIVE in Supabase pending dashboard delete.
- **PostHog duplicate-init follow-up (PM-408).** index.html L1043-1046 duplicate `posthog.init` pre-empts auth.js deferred init; needs incognito-verified ship.

### Post-launch backlog (do not work on before 31 May)

Achievements system overhaul (PM-94) — post-trial, 2-3 sessions, own campaign. In-App Tour PF-23 — v1 DESCOPED to explanatory (intro slides + in-context spotlight, no per-step achievement), decoupling it from Achievements; full build spec in tasks/backlog.md "READY TO BUILD — PF-23 v1", copy drafted PM-553, `members.tour_completed_at` migration approved. Build-ready; ship vehicle (next binary vs first OTA `--rollout 0.1` canary) is Dean's call. Realtime cross-device sync (PF-5b). Apple Health page redesign. `auth_blocked` banner in member UI. HealthKit background sync (~400 LOC Swift plugin, 4-5 sessions, 1 week soak). Health Connect (Android) — parked until Dean has Pixel/Galaxy device. The Fore grant register June/July 2026. WHISPA research partnership monitor.

### Backlog — security & hygiene

- Edge Functions deletion pass — one-shot patchers + debug EFs accumulate; ~32 active candidates plus the three throwaway replay EFs from PM-410.
- Anon-key rotation (admin console).
- Brain hygiene: changelog.md is 22,815 lines / ~2.5MB. Split pre-23 April entries into `changelog-archive/2026-Q1.md`. Base64-encoded historical blob cleanup pending.
- GDPR cron static-PSK exposure (accepted risk, rotate if Sage diligence surfaces).
- APNs key rotation (accepted risk, blocked on Apple 2-keys-per-team cap).
- Stripe secret on EF environment (carried from earlier sessions).
- Cron auth migration from hardcoded literals to Vault (cron jobs 21 + 22 hardcode PSK directly in `cron.job.command`).
- Standardise NO-ACTION FKs to CASCADE.
- Leaderboard refactor.
- Exercise restructure (Exercise Hub with Movement/Workouts/Cardio streams) — partially shipped via Body pillar work; finish post-trial.

---

## 22. Open decisions

- **B2B volume discount tiers** — formally define before first enterprise contract.
- **Annual pricing discount %** — Lewis decision, Dean adds to Stripe once confirmed.
- **HAVEN go-live** — Phil's clinical review. Auto-assignment currently active in production (Conor Warren on HAVEN since 15 April). Decide: pause auto-assignment until sign-off, or accelerate Phil's review.
- **`VYVE_Health_Hub.html` go-live** — Phil's clinical review of assessment instruments, scoring/risk thresholds, signposting copy. Page is staged in web root; promote to nav once approved.
- **Microsoft Exchange / GoDaddy migration (`team@vyvehealth.co.uk`)** — currently a personal account; migrate to a proper enterprise tenant post-first-enterprise-contract.
- **External DPO service** — required before 500 members.
- **Wellbeing Scorecard** — host on live domain. Which URL? Who builds form submission?
- **Today's Progress strip** — Lewis to approve copy before building.
- **Podcast rebrand timing** — *The Everyman* → *The VYVE Podcast* — when to switch fully.
- **Weekly-checkin-nudge copy split** — first-time activation vs continuity reminder. Phil + Lewis sign-off needed before EF scaffolding.
- **Named charity partner** — when to formally announce / sign first partnership. **Now load-bearing for the free-trial conversion copy** (the plural "charity partners" claim) — settle named partner or soften wording before that copy goes member-facing.
- **Free-trial conversion model (PM-476, design locked, build pending)** — 30-day trial (not 14); blended "easy first" charity milestone = ANY 30 activities (sum of `get_certificate_buckets`) funds the first donated month, then per-pillar resumes; no new anti-spam cap (capped buckets = 7/day ceiling → ~5-day floor); celebrate the milestone early but make the real conversion ask near the wall (~day 24) + day-30 wall; £10-off-FOREVER confirmed as the standing conversion price (resolves the standing-price question). Detail in changelog PM-476 + backlog Trial/membership; two review docs produced for Lewis (not in repo).
- **APNs key rotation** — accepted risk pending Sage procurement diligence. KEY_ID `2MWXR57BU4` exposed in chat 27 April 2026 PM, rotation attempted 07 May hit Apple's 2-keys-per-team cap. Risk profile low; rotate if Sage's security review surfaces it.
- **Secondary email service provider** — Brevo is single-provider for onboarding welcomes / certificates / re-engagement / push fan-outs. No failover ESP. Pre-Sage acceptable; post-Sage evaluate AWS SES as secondary.
- **GDPR cron static-PSK exposure** — cron jobids 21 + 22 hardcode SHA-256-shaped bearer in `cron.job.command`. Procurement reviewers will flag; either replace with `current_setting('app.gdpr_cron_psk')` lookup or drop bearer entirely (EFs already enforce service-role checks). Backlog rotation when convenient; not blocking Sage diligence unless raised.
- **Goal re-pillaring (PM-159, partial)** — certificate re-pillaring SHIPPED PM-435 (certs now read the five Your Journey buckets via `get_certificate_buckets()`). The per-activity GOAL-target half (weekly goal targets mapped onto the pillars) is still open. Revisit alongside home-redesign EF trim.
- **5 disabled Make tasks** — keep or remove: LinkedIn article, podcast brief, LinkedIn newsletter, PR pitch, employee advocacy pack.
- **Autotick evaluator multi-source arbiter** — when/if a future member has two sources (HealthKit + Fitbit).

---

## 23. Known gotchas & architecture rules

| `dim values 1/2/3` | `dimension_energy/sleep/stress/body` use 1/2/3 (low/mid/high tap), not the 1-10 scale of `score_*` columns. Branch thresholds: mood≤4 OR stress=1 OR energy=1 → negative; mood≥7 + 2×dim=3 → positive; else neutral. Mirror in EF `computeBranch` and client `computeBranchClient`. |

Curated and renumbered. Rules organised by topic family with monotonic numbering within each family. Promotion criterion: candidate after first occurrence, hard rule after second-or-third recurrence. Historical lineage preserved in `brain/changelog.md` — read the PM cited on each rule for the worked example.

### Architecture invariants (§23.1-§23.10)

#### §23.1 — VYVE is two Capacitor binaries, not a PWA

The product is delivered as the **iOS App Store** binary and the **Google Play Store** binary, both wrapping the `vyve-site` web shell via Capacitor. `online.vyvehealth.co.uk` is a browser-accessible **account-management fallback** for members who need web access — it is *not* the member experience. Do not reintroduce "add to home screen" / PWA install banners (removed 04 May PM-3). Member-facing copy says "the VYVE Health app" — never "the PWA". App Review notes describe VYVE as "native iOS app built with Capacitor wrapper". The phrase "PWA" is internal-only, referring strictly to the legacy infrastructure (service worker, `offline.html`) that still services the web fallback. Earned PM-77. Reinforced PM-413 — App Review notes scanned for residual PWA framing pre-submission.

#### §23.2 — Auth is Supabase Auth; Auth0 is gone

Supabase Auth is primary. Auth0 is gone entirely. Never say "Auth0 gated". Don't reintroduce Auth0 patterns.

#### §23.3 — On-device Dexie is the source of truth for member data

Every read goes to Dexie. Every write hits Dexie first, then queues to Supabase in the background. Supabase is the sync target + cross-device propagation via Realtime + server-side compute for AI / cron / leaderboards / employer aggregates. It is not the rendering source for the member's own data. This commitment may not be revised without a specific measured problem this architecture can't solve. Earned PM-77.

#### §23.4 — Bundled-native changes the meaning of every vyve-site main push (PM-115/116/178; RE-CONFIRMED LIVE PM-569)

Dean's iPhone in dev-loop mode (server.url → `online.vyvehealth.co.uk`) sees every vyve-site main commit live immediately (subject to WKWebView cache 2-15min). Bundled-mode members see only the SHA frozen in their IPA/AAB until an OTA via Capawesome lands. Dean seeing a change immediately ≠ live to members. Do not re-explain this. **HISTORY:** PM-475 (2026-06-04) temporarily corrected this to "whole cohort is server.url-live, no frozen bundle" because capacitor.config.json then shipped server.url=live. **That correction is now itself WRONG (reverted PM-569, 2026-06-09):** iOS 1.7 went live with server.url REMOVED, so iOS members ARE now frozen on the bundled SHA — the original §23.4 split is the live truth again for iOS. Android 1.0.6 is now live too (approved 9 Jun, PM-573), so once members update the whole cohort is bundled/frozen — the split (Dean live, members frozen) applies cohort-wide, not iOS-only. Net live state: a vyve-site commit reaches Dean (server.url) + Android members, NOT iOS members. See §23.106 for the OTA-delivery gap.

#### §23.5 — Anthropic key location

Server-side in Edge Functions only. Never in HTML or committed to GitHub. Stored as Supabase secret.

#### §23.6 — Theme system invariant

All portal pages use dual dark/light CSS token blocks. Never single `:root`. Always include `theme.js` before closing `head` — and `theme.js` is the one script tag that must NOT have `defer` (it runs synchronously at parse time to set `<html data-theme>` from localStorage before body renders; deferring causes a theme-flash on every navigation).

#### §23.7 — Edge Function deploys

Always require full `index.ts`. `verify_jwt:false` for public-facing functions. Service-role-guarded EFs that compare `Authorization` against `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` need the new `sb_secret_*` runtime value, OR the legacy JWT via the dual-auth `LEGACY_SERVICE_ROLE_JWT` secret. `send-push` v11+ and `achievement-earned-push` v1+ are canonical dual-auth implementations. Auth-shape gotcha banked first-occurrence PM-402 — EF-to-EF call where the callee uses Bearer-equality check needs `LEGACY_SERVICE_ROLE_JWT`, not `SUPABASE_SERVICE_ROLE_KEY`. Promotes to a sharpened sub-rule on second occurrence. **Sharpening (PM-474, THIRD occurrence): the Supabase Storage REST API also rejects the sb_secret_* shape** — PUT/POST to /storage/v1/object/... with Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY} returns 400 {"statusCode":"403","message":"Invalid Compact JWS"} because Storage verifies a JWT. Use LEGACY_SERVICE_ROLE_JWT (plus the apikey header) for any Storage REST call. Class now seen at: EF-to-EF Bearer-equality (PM-402) and Storage REST (PM-474). Rule: any service that JWT-verifies the key needs LEGACY_SERVICE_ROLE_JWT, never the rotated sb_secret_* value.

#### §23.8 — Composio `SUPABASE_UPDATE_A_FUNCTION` corrupts deployed bundles

Reproducer 28 April: deploy a working stub via `SUPABASE_DEPLOY_FUNCTION` (200), then call `SUPABASE_UPDATE_A_FUNCTION` with byte-identical body — next invoke returns persistent BOOT_ERROR. Metadata changes (verify_jwt) DO take effect, but the bundle gets mangled. **Always use `SUPABASE_DEPLOY_FUNCTION` for body changes.** UPDATE is unsafe except for slug/name renames. Companion: `SUPABASE_DEPLOY_FUNCTION` has no verify_jwt param — defaults true; for `verify_jwt:false` use the native Supabase MCP `deploy_edge_function` tool.

#### §23.9 — Native MCP for EF source over Composio

`Supabase:get_edge_function` returns clean `files: [{name, content}, …]` array suitable for editing and redeploy. Composio's `SUPABASE_GET_FUNCTION_BODY` returns compiled ESZIP bundle (types stripped, JS minified) — useful for forensics on a deployed bundle's actual runtime shape, not useful for editing. For multi-file EFs with shared modules, use native `Supabase:deploy_edge_function` with `files=[...]` listing all relative dependencies — Composio's `SUPABASE_DEPLOY_FUNCTION` only takes a single-file `file_content`.

#### §23.10 — Offline-equivalent operation is the contract, not a feature (PM-103)

Read paths cache aggressively. Write paths queue via `VYVEData.writeQueued` and stamp `client_id` so re-flushes are safe. Live data (live sessions, push, real-time chat) genuinely needs network and we say so. New tables that take member-authored writes get a nullable `client_id uuid` column + partial unique index `(member_email, client_id) WHERE client_id IS NOT NULL`. The outbox MUST set `Prefer: resolution=ignore-duplicates,return=minimal` on every queued PostgREST insert that has a `client_id` partial unique index — without it, a re-flush after a successful-but-network-dropped insert will 409 and dead-letter a row that actually persisted.

---

### Native bundle & store discipline (§23.11-§23.20)

#### §23.11 — Capacitor `Info.plist` uses `$(MARKETING_VERSION)` / `$(CURRENT_PROJECT_VERSION)` placeholders

Replace hardcoded version literals with build-setting placeholders once per project. Otherwise agvtool drifts vs Info.plist on Distribute.

#### §23.12 — Apple closes a version train on first upload

Regardless of approval status, a CFBundleShortVersionString version is closed on first upload. Re-shipping requires version bump. Re-exposed PM-413 cycle 1 (1.3 had been rejected earlier, train closed, only forward path was 1.3 → 1.4).

#### §23.13 — CLI archive → CLI exportArchive → Organizer Distribute bypasses GUI rollback issues

Use when Xcode GUI is fighting back. Also: when distributing, uncheck "Manage Version and Build Number" if agvtool has set the version locally — Xcode's distribute-time auto-bump leaves Info.plist drifted.

#### §23.14 — Quit Xcode fully before sed'ing `pbxproj`

The GUI silently rewrites it on view-focus.

#### §23.15 — Android version-code discipline

When re-establishing Android shipping for an existing app, jump versionCode to a clearly-higher integer rather than next-from-source-of-truth. `keystore.properties storeFile` path is relative to `android/app/`, not `android/`. PKCS12 keystores enforce store password === key password — don't write a brute-force loop that tries them separately. Any Android bundle containing a plugin that declares health permissions in its manifest triggers the Play Console Health Declaration, even if the plugin is dormant at runtime. Play Console retains state independent of the brain — verify live state before re-shipping an Android app that hasn't been touched in weeks.

#### §23.16 — iOS HK auth resets on binary upgrade

Every signed-binary change (1.x → 1.y, PWA → native, dev → release) resets HealthKit per-app auth state to "not determined", regardless of App ID continuity. iPhone Settings → Health → Data Access & Devices entry is created on first successful `requestAuthorization` prompt, NOT on install. Auto-sync code paths must detect the all-probes-unauthorized pattern and re-prompt; `member_health_connections.platform` row presence is NOT sufficient signal HK is functional. Check `platform_alerts.client_diagnostics` first when HK silently breaks — if every probe in the most recent row failed with `auth-not-determined`, you have a binary-upgrade auth reset, not a code bug. Server-side EFs maintaining a "last successful sync" cursor must verify a sync actually pulled data before advancing — empty pulls, all-probes-failed pulls, and explicit error responses must NOT advance the cursor. `sync-health-data` v9 implements this for HK via `diagnosticsShowAuthBlocked()`.

#### §23.17 — App Store icon must be RGB no-alpha

App Store Connect rejects PNGs with alpha channel even when alpha is uniformly 255. Flatten via PIL: `Image.new("RGB", size, bg).paste(rgba, (0,0), rgba)` before submission. Canonical brand icon source: `online.vyvehealth.co.uk/icon-512.png` (fully opaque, brand-correct). Lanczos upscale 512→1024 + RGB flatten on `#0D2B2B` is App Store-acceptable.

#### §23.18 — `@capacitor/assets` v3 single-icon scheme

Modern Xcode 14+ reads a single `AppIcon-512@2x.png` at 1024×1024 universal from `AppIcon.appiconset/`. Legacy 60/76/83.5 multi-size slots no longer in spec. `npx @capacitor/assets generate` doesn't clean orphans — manually `rm` files not referenced in regenerated `Contents.json`. Sharp on Apple Silicon requires `npm install --include=optional sharp`.

#### §23.19 — AppDelegate.swift bridge methods required for Capacitor PushNotifications

Without `application(_:didRegisterForRemoteNotificationsWithDeviceToken:)` and `application(_:didFailToRegisterForRemoteNotificationsWithError:)` posting to `NotificationCenter`, registration never fires. Audit before any future archive. App Store: `NSFaceIDUsageDescription` required even for unused biometric plugins — `capacitor-native-biometric` or any plugin linking `LocalAuthentication.framework` gets compiled into the binary regardless of use.

#### §23.20 — iPad orientation arrays are non-negotiable all-four (PM-413)

Any iOS Info.plist orientation work must independently inspect and preserve `UISupportedInterfaceOrientations~iphone` and `UISupportedInterfaceOrientations~ipad` arrays. The iPad array must declare all four orientations (Portrait, PortraitUpsideDown, LandscapeLeft, LandscapeRight). The iPhone array may be any subset. App Store validation Code 90474 fires when iPad orientations are incomplete — iPadOS Stage Manager and Split View require all four. The blanket sed pattern `sed -i '' '/UIInterfaceOrientationLandscapeLeft/d'` is array-agnostic and will collapse both arrays — use a Python heredoc edit targeting the specific key block instead. Audit signal at session end: any session that touched `ios/App/App/Info.plist` must include a pre-Archive grep check — both arrays present, iPad has all 4.

---

### Tooling discipline (§23.21-§23.30)

#### §23.21 — Parallel-session safety protocol (PM-177)

Foundation rule. Before committing a multi-file change via Git Data API, fetch live `main` SHA. If HEAD has moved since session start, treat the parallel session as a real collision: re-fetch every file you intend to commit, rebase patches against live content, re-verify. Per-file SHA matching at commit moment via Contents API raw accept on every committed file at the commit SHA. §23.21 catches *that* HEAD moved; the rebase rule below catches *what changed*.

#### §23.22 — Pre-commit content rebase, not just SHA-rebase (PM-296)

Before committing, fetch live HEAD content for every file being committed and compare against working base. On trivial drift (cache key bumped, vbb-marker bumped), re-fetch live content, re-apply patches to live content, continue. On substantial drift in regions your patch touches, abort, three-way-merge by hand. Do NOT commit through drift. §23.21 alone is insufficient — it checks branch SHA, not file content. Audit signal: any session-end commit message saying "restored content erased by [prior commit]" is a §23.22 violation in the prior commit.

#### §23.23 — Session-start feature-collision scan (PM-311)

After brain load, before code work, if the brief implies a coding deliverable, scan the last 15 vyve-site commits for feature keywords drawn from the brief. Hits get surfaced to Dean before design conversation opens. Sub-second cost; PM-311 wasted ~90 minutes re-implementing the live-tracker because parallel session shipped PM-304 in the gap between Dean's brief and session start. Skip on pure design / talk-first sessions and on "continue PM-X" briefs. Diagnostic/debug sessions still benefit but are unlikely to surface.

#### §23.24 — PM-claim recompute at commit time (PM-319)

Right before `POST /git/commits`, refresh-fetch `GET /commits?sha=main&per_page=5`. Parse first lines for `^PM-(\d+)`. Set my PM number to `max(seen) + 1`. If different from draft, sed-sweep staged files + commit message before posting. Atomic ref-update protects content; this protects label. Companion to the PM-XXX placeholder pattern: during a build that spans multiple turns with parallel sessions active, write source with `PM-XXX` / `pmxxx-` placeholders, then single sed-sweep to the freshly-claimed number at commit time immediately after the §23.21 fresh-HEAD fetch.

#### §23.25 — Cross-repo PM-number scan (PM-381)

§23.24 scans the ship target repo only. VYVE shares a single PM-number namespace across vyve-site and VYVEBrain — a parallel brain session may have claimed your PM-N for a staging artefact. At PM-claim time, scan last 5 commits in both repos, take max across both, claim max + 1. `.b` suffix convention for brain-narrative companion to canonical PM-N (PM-362.b weekly recap brain close after vyve-site PM-362, PM-379.b, PM-381.b). Standalone brain ships claim their own PM number.

#### §23.26 — Brain whole-file overwrite hazard (PM-354/355)

Brain commits MUST re-fetch `brain/changelog.md` + `brain/master.md` from live main IMMEDIATELY before blob creation. Parent-SHA match is necessary but not sufficient — parallel session can land brain content between fetch and commit, whole-file blobs silently overwrite. Fired twice in one session. Recovery: pull the colliding commit diff, extract +lines, re-prepend. Extend §23.21 fresh-HEAD discipline to brain files; brain reads of files >1MB MUST route through `/git/blobs/{sha}` not `/contents/{path}` (Contents API returns empty content + download_url for files >1MB, naive caller writes 0 bytes silently).

#### §23.27 — Composio outage fallback: direct PAT, max 2 retries (PM-185)

Composio is normally primary GitHub path. Outages happen (21 May 2026 security incident — tokens revoked, 401s despite "Active"). On any 401, max 2 Composio retries then fall back via Supabase MCP `execute_sql`: `SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'GITHUB_PAT_CLAUDE'`. Never ask Dean to paste — Vault has it. Then `bash_tool curl` direct vs GitHub REST. Reads use `Accept: application/vnd.github.raw`. Single-file writes use `PUT /repos/{owner}/{repo}/contents/{path}` with base64 + fresh SHA. Multi-file atomic commits need Git Data API: blobs → tree → commit → update ref (Contents API is one-file-per-call).

#### §23.28 — Curl arg-list rule: write large bodies to /tmp, never argv (PM-209)

Never substitute large file bodies into bash argv via `-d "$body"`; always write to /tmp and pass `--data-binary @file`. argv overflow corrupts silently. Companion to bash `for` loops with embedded base64 of multiple files via `python3 -c` silently reusing previous payload (PM-261b) — use Python urllib with body written to /tmp, never multi-iteration argv composition.

#### §23.29 — JSON parse from a file, not from an inline `python3 -c` in a `$()` capture (PM-210b)

When a captured API response is JSON, write the response body to a file first, then parse from disk. Never `<command> | python3 -c | $(...)`. JSON with control characters (multi-line message fields) breaks the inline parse silently; the surrounding `if [ -z "$VAR" ]` branch then reports the wrong failure mode. Distinct from the curl-argv rule — that's write-side, this is read-side.

#### §23.30 — Post-commit byte-perfect verification

After every commit, re-fetch every committed file at the commit SHA via Contents API with raw accept (or Git Blob API for >1MB files), compare bytes-to-bytes against local staged content via md5 or sha256. First-N-chars verification on UTF-8 files is a false-positive trap (newline normalisation can show false MISMATCH) — use md5 (PM-269). For multi-file atomic commits via `GITHUB_COMMIT_MULTIPLE_FILES`: `upserts` array (not `files`), `message` field (not `commit_message`), `deletes` is a flat array of path strings (not objects). Re-fetch and confirm the returned `changed_paths` match upserts — Composio's tool has been observed returning a different commit silently.

---

### Optimistic-first / bus discipline (§23.31-§23.40)

#### §23.31 — Optimistic-first / persist-then-upload contract (PM-151, sharpened PM-239)

Member-action writes: flip UI synchronously, then fire un-awaited background work (Dexie + outbox + bus publish). The haptic IS part of the UI flip and belongs in the same animation frame as the renderer, not gated behind any await (PM-368 lesson). Navigation/UI-flip happens immediately after bus publish, before any awaited fetch (PM-362 connect-checkin lesson — POST stays un-awaited with `keepalive:true`, page is gone before resolution). Failed writes fire `<event>:failed` for revert; subscribers undo state via `VYVEHomeState.revertPatch(type, {...})`. 4xx → eager revert; 5xx + network throw → suppress eager fire, revert via `vyve-outbox-dead` window event only (transient failures shouldn't flicker UI).

#### §23.32 — `client_id` row id must always be a valid UUID (PM-167)

Stamp `id: clientId` on POST payload alongside `client_id` — otherwise server `gen_random_uuid()` fires and Dexie row keyed by clientId desyncs from server row keyed by server id, producing 2 rows per logical activity. Earned PM-386 (33/33 movement, 38/42 mind, 13/13 cardio rows in production had `id != client_id`). Companion: when a new activity table goes live, every read surface displaying counts from it must be audited — score functions (SQL + JS twins), tile renderers, home pills, v1-column-additive reads. Default to Dexie-direct parallel reads over v1-column dependencies for surfaces displaying post-write state (PM-386 → PM-389 reinforcement).

#### §23.33 — The activity cap is a credit calculation, never a write gate (PM-166)

Counting caps must NOT be implemented as storage-destroying triggers. Never duplicate a magic threshold across triggers (PM-150). Caps apply to `source='manual'` only — Apple Watch members doing 3+ workouts/day were broken by the original 2/day cap. Charity + cert counters stay independently capped via read-path `LEAST(COUNT(*), 2)` and `existing_count < 2` checks.

#### §23.34 — Page-side Dexie wiring is a requirement, not an optimisation (PM-96)

Every page that paints member data MUST either (a) read `VYVELocalDB.<table>.allFor(memberEmail)` inside an `await VYVESync.hydrate()` block with REST fallback, OR (b) deliberately pass through to REST/EF for legit reasons (aggregate reports, server-computed leaderboards). Audit signal: ripgrep `VYVELocalDB` in every member-data page; 0 hits = amber by construction. Companion rules: `await VYVESync.hydrate()` returns true even when individual tables fail; first paint after sw.js cache key bump may flicker amber.

#### §23.35 — Dexie upserts MUST merge by default for member-scoped tables (PM-97)

`VYVELocalDB.<table>.upsert` must merge incoming row over existing keyed row, not replace. Replace-by-default loses optimistic fields the server hasn't echoed back yet.

#### §23.36 — UI state mutation must be synchronous on the active surface (PM-98)

The active surface mutates its own state synchronously on local tap and renders. The bus is fan-out (cross-page subscribers), not the trigger for the active page's own UI. Companion: optimistic INSERT rows must be FAT for denormalised stores (PM-153) — carry all join columns the UI needs to paint, otherwise hydrate-thin + paint-fat = "undefined" canaries (Habits 14 May lesson).

#### §23.37 — Cache-first first paint covers ALL surface counters (PM-100)

Not just the main list. Surfaces must self-correct on date rollover. In-app cache reset must force a full Dexie rehydrate before next paint (PM-102).

#### §23.38 — Hydrate via merge, never wipe-then-refill (PM-183.3)

Wipe-then-refill leaves the UI showing nothing in between. Merge writes over existing keyed rows; new rows append; deletions on server reconcile via tombstone or explicit DELETE event.

#### §23.39 — A page that reads from Dexie must load the Dexie stack (PM-183.6)

Sibling to §23.44 (script-tag inclusion auditing) but at architecture level: pages reading `VYVELocalDB` need db.js + sync.js + bus.js in their script tags. Defensive `if (window.VYVELocalDB)` guards mean missing script tags fail silently.

#### §23.40 — Mind activities log via the optimistic-first / outbox / failure-bus skeleton (PM-173)

Canonical implementation reference for the §23.31 contract — every new activity surface (movement PM-307, connect-checkin PM-289) follows this shape.

---

### Bus event discipline (§23.41-§23.50)

#### §23.41 — Envelope-trusted subscriber when publishing surface uses fire-and-forget Dexie writes (PM-293)

Cross-page bus subscribers MUST NOT trust Dexie as the sole source of truth when the publishing surface uses fire-and-forget Dexie writes. Subscriber applies the envelope's signal (sign / primary key / discriminator) to the active surface's in-memory state **synchronously**, renders, AND THEN re-reads Dexie as a second pass for state not in the envelope. Pattern: decode change from envelope → applyToActiveState → render → second-pass Dexie reload. The envelope contract: publishers MUST include primary key + signal of change direction (sign / is_yes / kind) so subscribers can decode without re-reading storage. Distinct from §23.36 — §23.36 covers active surface mutating own state on local tap; §23.41 covers cross-page subscribers reacting to remote publishes.

#### §23.42 — In-page-vs-cross-page envelope discipline (PM-391/401)

Envelope-trusted subscriber pattern is for CROSS-PAGE subscribers only, not in-page same-surface subscribers where the publisher already did the optimistic mutation. In-page subscribers using envelope re-mutation will double-apply (PM-391 reaction-tap +2 flicker). For in-page state-change render functions called from multiple bus events: the renderer should be idempotent over the no-change case (skip DOM rewrite when current DOM already matches incoming state). Earned PM-401 — `renderRecentCheckins` same-layout guard: before innerHTML rewrite, check if existing DOM cards have same IDs in same order, surgical update if yes, full rebuild if no. `innerHTML` rewrite destroys child `<img>` elements forcing re-decode even with hot HTTP cache — prefer surgical DOM patches over innerHTML rewrites when state changes don't affect layout/identity.

#### §23.43 — Bus migration discipline — whole-tree audit method

Pre-flight audits run against the whole tree, not a hand-picked subset. Audit-count discipline counts source-code call sites unconditionally regardless of runtime branch (`if (!VYVEBus)` branches still count). Asymmetric / symmetric / mixed fallback per surface classified by what was firing pre-bus at that publish site. Race-fix mechanics: publish-before-fetch for initiating writes; publish-after-res.ok for queue-drain confirmations. Server-side cron-driven writes are out of scope for Layer 1c. Layer 1 cache-bus campaign closed PM-44; Layer 2 opens with PM-45 (Supabase Realtime-to-bus event bridge).

#### §23.44 — Script-tag inclusion auditing during new-feature ship (PM-304)

A new feature lands runtime code on one page but the script tag is missing from a CONSUMING page. The consumer's `window.VYVEModuleName.foo()` silently bails because the global is undefined; defensive guards swallow it. Failure mode is invisible until tested on a surface the original wiring didn't think to test. Audit: `grep -l 'VYVE<Name>' *.html` then check each for the bridge script tag. Apply to every module surface added or removed by a refactor. Sibling: §23.51 (bridge-load coverage audit).

#### §23.45 — Catalogue imagery is DB-driven, nullable, with onerror fallback (PM-190)

Tables driving content (service_catalogue, replay_playlists, replay_videos, mind_videos, persona_welcome_copy, how_to_resources, podcast_platforms, checkin_questions) include nullable `image_url` / `icon_url` / equivalent. Render path uses `onerror` fallback to gradient placeholder. Lewis edits via Supabase Studio; devices pick up within 5min via `CATALOGUE_FRESH_TABLES`. Eighth application as of PM-384.b — pattern muscle-memorised, new catalogue ships need no new doctrine.

#### §23.46 — Catalogue schema changes require an invalidation-key bump (PM-190.c)

Bump `CATALOGUE_INVALIDATION_KEY` in `sync.js` on every catalogue schema change. Devices wipe and re-pull the catalogue table on next session start. Lockstep with the catalogue migration name.

#### §23.47 — Counters render truth, not loading placeholders (PM-186)

Empty state shows nothing (or honest empty copy), never spinner-as-permanent-state. Live carousels paint placeholders only when LIVE_PLACEHOLDERS data is real placeholder content, not "Loading…". Earned PM-186; reinforced in every hub redesign since.

#### §23.48 — Connect freshness model (four patterns) (PM-188)

Four patterns to choose from for surfaces that need cross-device fresh data: (1) hardcoded recurring catalogue (sessions-data.js — synchronous, always-present), (2) Dexie-synced + bus repaint (most member-data surfaces), (3) `_kv` cache slot with TTL + boot prefetch (Connect feed preview, 90s freshness window — PM-392), (4) Realtime echo via bus bridge (Layer 2 — PM-45 territory). Pre-PM-188 connect-feed always hit EF on tab-in; post-PM-188 cache-first paint with EF as fallback. Doctrine reference: `playbooks/connect-freshness.md`.

#### §23.49 — Specs cross-checked against live schema before lock (PM-187)

Trust Supabase over the brain on schema. Before composing any RLS migration / data shape spec from an audit recommendation, run `information_schema.columns` pre-flight against the target table. Same applies to GitHub repos, secrets timestamps, cron job lists. The brain may have a stale view. Cheap to verify, expensive to skip.

#### §23.50 — body:logged aggregator + cross-pillar event taxonomy (PM-382)

Aggregator events (`body:logged`) fire from each per-strand publisher (workout/cardio/movement) so cross-pillar subscribers (Connect tile counters, achievements eval) repaint without subscribing to N specific events. Discriminator `{kind}` informational only — subscribers unconditional unless they need per-strand filtering. Critical placement rule: don't double-publish from legacy dual-write sites (movement.html L637 retired with PM-383). Bus events that look page-local (`mind:*`, `body:*`, `connect:*`, `replay:*`, `live:*`) are ecosystem-wide — before "rewire subscribers to new name", run repo-wide search. PM-319 found 12 files using `mind:logged` from one parallel session's perspective; talk-first option-A retire-decision reversed mid-build to dual-publish. Decide retire-vs-coexist only AFTER the search.

---

### CSS / UX discipline (§23.51-§23.60)

#### §23.51 — Bridge-load coverage audit before claiming any per-surface wire complete (PM-364)

When wiring a cross-cutting capability behind a JavaScript bridge (window-namespaced shim with defensive `if (window.X)` guards): per-surface call-site wire is only half the work. The other half is verifying the bridge `<script src=>` tag is loaded on every target surface that can fire the wire. Defensive guards mean missing bridge-load is silent. Audit: grep bridge filename across root-level HTML, count load sites, cross-reference against trigger set. If bridge-load is a proper subset of trigger set, the wire is incomplete. PM-363 wired haptics globally to achievements `showNext()`; PM-364 prep found haptics.js loaded on 3/41 surfaces.

#### §23.52 — Hub-page hero doctrine (PM-216 → PM-226)

Photographic heroes on hub pages follow a single doctrine. Full spec in `playbooks/hub-page-hero-doctrine.md` — load before touching any hub-page hero. Invariants every hero ship honours:

- Hero is `position: fixed` with longhand `top:0; left:0; right:0; height: max(280px, 46vh)`. No `inset:0` shorthand (silently fails on WKWebView).
- Hero is body-level, not inside `<main>`. Parent stacking contexts interfere with fixed pinning on WKWebView.
- `translateZ(0)` + `will-change: transform` on hero for compositor promotion.
- `background-image:url()` not `<img>` for synchronous paint from image cache.
- `theme.js` always loaded before closing `<head>`.
- `§8` paired-values invariant: hero height ↔ main padding-top must move together (e.g. `max(250px, 35vh)` on both, or `calc()` parity).
- Dedicated `§23.53` fade band element (80px, 3-stop rgba) bridges photo into solid `var(--bg)` panel below.
- Both themes use the same structural composition — dark mode flows photo into dark teal panel, light mode flows photo into cream panel.

#### §23.53 — Hub-page photographic hero seam: scrolling-fade recipe (PM-238 → PM-244)

Dedicated fade-band element with `translateY(-100%)` sits at the seam between fixed hero and scrolling panel. 80px tall, 3-stop linear-gradient from `rgba(10,31,31,0)` → `rgba(10,31,31,0.85)` → `rgba(10,31,31,1)` on dark, mirror with `(240,250,248,...)` on light. Avoids the visible seam between WKWebView's fixed-positioning composition and scroll-panel content.

#### §23.54 — When Dean says "body" he means `exercise.html` (PM-252)

There is no body.html file. exercise.html serves as the Body / Physical pillar hub. Don't ask; substitute. Hub-page work referencing "body" mirrors mind.html and connect.html structures.

#### §23.55 — Hub-page doctrine adherence: audit before improvising (PM-267b)

Audit against `playbooks/hub-page-hero-doctrine.md` + §23.52 + §23.53 before improvising on a hub-page hero. Read the reference impl markup-first not CSS-first — exercise.html treats the eyebrow as the page name and the headline as a small tagline, not the reverse.

#### §23.56 — CSS-only iterations that fail on device should trigger a hook-path audit (PM-283)

Not another CSS pass. PM-280/281/282 iterated CSS for focus-page done-state composition; bug wasn't in CSS — `body.is-completed` was only added inside `focus-shell.complete()` (post-Save path), not on the page-reopen guard path. Three rounds of correct CSS spec, none of which ran because the body class wasn't being added in the path Dean was looking at. Audit the activation hook before iterating styling.

#### §23.57 — Converting mockup HTML into a portal page: diff against a known-good portal page across the FULL checklist

Not just the presenting symptom. Theme tokens, nav.js wire, sw.js precache, bus subscribe, Dexie read path, optimistic-first writes, persona context, light/dark parity, safe-area-inset, viewport zoom disabled — full checklist every time.

#### §23.58 — Fixed-position modal controls in iOS chrome zones must use safe-area-inset (PM-351)

Any fixed-position interactive element within the top 48px or bottom 48px of viewport on a fullscreen modal/overlay must use `env(safe-area-inset-*, 0px)` in positioning, not bare px values. Fallback parameter (`, 0px`) mandatory. Pattern: `top: calc(env(safe-area-inset-top, 0px) + 12px)` etc. Hit-target minimum 48px (Apple HIG 44pt min; 48px gives margin against rounded-corner clipping).

#### §23.59 — VYVE is a native app, not a browser: suppress web-page tells (PM-250)

Audit and suppress every WKWebView/Chrome default that leaks "I am a web page" feeling: viewport zoom disabled, text selection disabled where it doesn't add value, pull-to-refresh disabled, scroll-bounce suppressed where it surfaces blank background, copy-paste callouts off on non-text surfaces, browser context menus suppressed via `oncontextmenu="return false"` where they don't add value.

#### §23.60 — bash_tool `cd` does not persist across calls (PM-251)

Each tool call is a fresh shell. Use absolute paths or `cd ... && cmd` in a single call. Don't assume working directory carried over.

---

### Diagnostics / patch budget (§23.61-§23.70)

#### §23.61 — When two patches in a row don't move the diagnostic needle, stop patching (PM-327)

Earned at high cost — 4 patches in ~90 minutes failed to fix `ready: false` on the live tracker, all addressing surface symptoms while the bug was in the WKWebView ↔ YouTube postMessage bridge invisible to on-page debug strips. Rule: if two consecutive patches both ship cleanly, both advance some diagnostic, but the primary failure mode does not change, STOP. Don't ship a third. Surface to Dean explicitly: "Two patches haven't moved the needle. The bug is likely outside the layer I can see from the debug strip. We need [Safari Web Inspector / Android adb / Charles proxy / device console capture]." Concrete escalation: Safari Web Inspector → Develop menu → \[iPhone name\] → live page; `window.addEventListener('message', e => surfaceToDebugStrip(e))`; `capacitor.config.json` inspection; bypass the IFrame API entirely (Visibility API timer + manual CTA) when bridge is broken and trial doesn't justify deep WKWebView debugging.

#### §23.62 — Re-read campaign specs before writing code in their domain (PM-269 → PM-270)

Brain-load is not sufficient. The spec docs in `/playbooks/` carry the worked-example detail brain-load summaries strip. Read before writing.

#### §23.63 — Pre-bundle debug surface gating discipline (PM-409)

Before any production bundle commits, every debug surface on the member-facing app must be either (a) hidden behind `localStorage.vyve_dev_panel_unlocked === '1'`, (b) hidden behind a URL parameter that can't be set in the native app (`?debug=`-style — safe because Capacitor has no address bar), or (c) deleted. "Debug-labelled but technically harmless" UI is not acceptable; the label is the problem. Canonical pattern: one flag, multiple surfaces, one gesture (5 taps in 3 seconds on a benign UI element). Audit signal at scan time: repo-wide grep for `force[\s-]*refresh`, `reset.{0,20}(achievement|cache|local|dexie|data|member)`, `\?debug=`, `dev[\s_-]?panel`, `developer[\s_-]*tools?`, `diagnostic`. Console logging is exempt (not member-visible; preserves diagnostic trail). Bundle prep is the forcing function — debug surfaces drift in by predictable mechanism: "I'll hide it once X is proven" then attention moves to Y, surface stays.

**Sharpening (PM-424, candidate):** gating a debug surface behind a flag must guard the **render function's entry**, not only the call site that opens it. PM-418 gated `mind.html`'s open-time `renderDebugStrip()` call but left a `setInterval(…1000)` poller calling it unconditionally — the strip wiped on open then re-leaked within ≤1s on the next tick. Guarding the function entry (`if flag !== '1' return`) kills every path at once: open, poller, and future callers. Audit signal when gating any overlay: grep for **every** caller of the render fn. Promotes to a numbered sub-rule on second occurrence.

#### §23.64 — Dean tests on the native iOS app, not a browser

NEVER tell Dean to "navigate to URL X" or use `?query=params` in an address bar — he cannot, there is no address bar. For testing tell him which in-app page to open (Home, Body, Mind, Connect, More → page name). Debug flags requiring URL params are Claude's problem to solve via in-app trigger (settings toggle, long-press, localStorage, build flag), not Dean's problem. App refresh = force-quit + reopen via iOS app switcher.

#### §23.65 — Live device-walk testing scheduling (PM-304 walk lesson)

When testing `*-live.html` against a real broadcast, schedule `calendar_occurrences` with `starts_at = now()` or `now+30s`, NEVER `now+10min`. Skip PRE_ROLL — page should be trying to be LIVE the moment Riverside push hits YouTube. State-machine bug logged: LIVE gates on clock-time only, so YouTube `enableAutoStart` already-live doesn't flip page state until starts_at clock passes. Broadcast-live should override the clock — architectural fix needs a YT broadcast status probe.

**RESOLVED PM-445.** `broadcast-status` EF (OAuth `liveBroadcasts.list?part=status`, verify_jwt, returns `{live:bool|null}`) + session-live.js `probeBroadcastStatus()`/`effectiveState()` layered over the clock machine. broadcast-live overrides the clock; holds PRE_ROLL until confirmed live; JUST_ENDED on live->not-live; holds LIVE past `ends_at` on over-run; fails safe to clock-only on probe error (== prior behaviour). player-tracker + wake-lock bind on EFFECTIVE LIVE only. `live:true` branch still needs a real-push device walk to confirm.

#### §23.66 — session-publish EF: enableAutoStop=false (PM-310)

v1 had it true which auto-killed broadcasts at scheduled_end_time. From v5 (PM-439) `enableAutoStart`, `enableAutoStop`, and monitorStream are ALL false — autostart is dead on this channel, so `session-publish` pre-creates only and the runner (`vyve-live-runner.py`) explicitly transitions `ready->live` (after confirming the bound stream is active) and `live->complete` (on push end). Future safety-net: a cron could complete any broadcast still live >2hr past scheduled_end_time as unattended-cleanup.

#### §23.67 — RLS auth functions must be wrapped in (SELECT …)

Bare `auth.email()` / `auth.uid()` / `auth.role()` / `auth.jwt()` in any RLS policy `USING` or `WITH CHECK` is a severe perf bug — functions are `STABLE` not `IMMUTABLE`, so without subquery wrap Postgres re-evaluates them once per row AND inlines them into the query plan. With `(SELECT auth.email())`, Postgres treats result as InitPlan and caches it for the whole query. Wrap on every new policy from creation. Pre-flight any new policy with `SELECT * FROM pg_policies WHERE tablename = '...'` and check `qual` / `with_check` — fix before deploying. Multiple permissive RLS policies for the same command are OR'd and double-cost — when an `ALL` policy already covers all relevant commands, do NOT add per-command policies on top.

#### §23.68 — Trigger functions writing to RLS tables must be SECURITY DEFINER

`SECURITY INVOKER` triggers cannot write to RLS-protected tables. Also: `information_schema.triggers` hides triggers from read-only users — use `pg_trigger` joined to `pg_class` for verification. `session_replication_role = replica` does not work from service-role EF connections; use explicit `ALTER TABLE DISABLE/ENABLE TRIGGER` pairs instead. `SUPABASE_APPLY_A_MIGRATION` silently partial-executes — for reliable trigger creation use single statement per call via `SUPABASE_BETA_RUN_SQL_QUERY` with `read_only:false`. plpgsql composite-type gotcha: shared trigger functions on multiple tables must not reference `NEW.<col>` for a column existing only on some — use `to_jsonb(NEW) ->> 'col'` for defensive cross-table access.

#### §23.69 — Notification routing — every push carries a route

Every notification (in-app, web push, native push) carries `data.url`. `member_notifications.route` (TEXT) populated on every insert; VAPID web push payload `data.url`; APNs payload `data.url`; toast click handler in `/achievements.js` reads `earn.route`. SW posts `{type:'notification_navigate', url:...}` to existing tabs so a member already on the destination routes in-place via `parseHashRoute()`. Single source of truth: `send-push` v13 reads `input.data.url` and writes to `member_notifications.route` so web/native/in-app stay lockstep. Currently routed types: `habit_reminder` → `/habits.html`, `checkin_complete` → `/wellbeing-checkin.html`, `streak_milestone_*` → `/engagement.html#streak`, `achievement_earned_<slug>_<tier>` → `/engagement.html#achievements&slug=<slug>&tier=<tier>`. SW push handler requires `self.addEventListener('push', e => e.waitUntil(self.registration.showNotification(...)))` — without it, payload arrives, decrypts, and is discarded silently. SW notificationclick must read `data.url` then `clients.matchAll` + `client.focus()` / `clients.openWindow()`. Web Crypto: ECDSA private keys must be imported as `'jwk'` or `'pkcs8'`, never `'raw'` — Deno enforces strictly and throws `Invalid key usage` (silent under `try/catch`).

#### §23.70 — Push delivery state — three channels, one working

**APNs (iOS):** live and shipping via `push-send-native` v5+. Auto-revokes 410/400 BadDeviceToken. **FCM (Android):** `register-push-token` accepts and stores Android tokens but `push-send-native` explicitly skips them — Android members receive in-app rows + correct tap routing but no system banner. Standing backlog item. **VAPID web push:** retired; `push_subscriptions` table dormant since 15 April. `send-push` v12+ still includes the web fan-out leg but it's a no-op for current members. Don't invest further in VAPID; FCM is next push priority.

---

### Brain / portal hygiene (§23.71-§23.76)

#### §23.71 — Brain content NEVER goes into vyve-site (PM-13b)

vyve-site is private as a repo but main branch is served via GitHub Pages at `online.vyvehealth.co.uk`. Any file at `brain/`, `tasks/`, or root-level operational markdown that lands in vyve-site is publicly fetchable on the open internet within ~30s of commit. Brain commits go to `VYVEHealth/VYVEBrain` only. Before any `GITHUB_COMMIT_MULTIPLE_FILES` call, verify `repo` argument matches file paths: site code → `vyve-site`, brain markdown → `VYVEBrain`.

#### §23.72 — Every vyve-site commit bumps sw.js cache key + vbb-marker in BOTH index.html AND settings.html

Same commit. Build number permanently visible on Settings page (PM-299). Stale marker = Dean can't verify the update landed. Pick next monotonic integer above live HEAD at commit time per §23.21. Cache key suffix `pmNNN-<slug>-a` lockstep with vbb-marker bump. Memory invariant.

#### §23.73 — SW HTML caching strategy is stale-while-revalidate, not network-first

Cached HTML returns instantly from CacheStorage (~5ms), background `fetch()` repopulates the cache in parallel for the next navigation, first-ever-visit falls through to network. The cache-version bump on every deploy is the eviction trigger — without it, SWR can serve arbitrarily-stale HTML. SW install must use `fetch(url, { cache: 'reload' })` followed by `cache.put` per URL, never `cache.addAll()` and never default-mode `fetch()` — GitHub Pages CDN lag (5-10min typical) means default cache mode installs stale CDN copies into the new SW cache, and stale-while-revalidate then serves them indefinitely. `cache.addAll()` is also all-or-nothing — any single 404 fails the entire install.

#### §23.74 — Cloudflare email obfuscation rewrites emails

On `www.vyvehealth.co.uk`. Wrap emails in `email_off` comment tags.

#### §23.75 — Cross-origin runtime injection on member-facing surfaces is a PF-14c violation

Earned PM-405 audit: wellbeing-checkin.html injected Chart.js from cdnjs at runtime. SW correctly skips cross-origin so offline = blank chart canvas. Audit signal `grep -rn "script.src.*http" *.html` should return zero on member-facing surfaces. Vendor third-party libs locally + add to sw.js precache.

#### §23.76 — sw.js precache audit on every new HTML surface ship

Audit signal: any vyve-site commit adding HTML file in repo root should have sw.js diff in same atomic commit. Earned PM-405 audit — PM-251 + later ships added new HTML surfaces (8 live-broadcast shells + 8 replay-category shells + 4 mind/more surfaces + 2 session CSS files) without sw.js precache additions. Uncached HTML falls back to `/index.html` per SW handler — graceful but premium-feel regression. 22-file precache gap closed PM-406.

#### §23.78 — CHECK constraint write-surface audit before adding to pre-existing tables

**§23.79 — EF deploy never uses placeholder content; collapse multi-file EFs to single self-contained index.ts.** `Supabase:deploy_edge_function` bundles placeholder strings successfully and ships broken code live (it only checks that imported files resolve, not that content is real). NEVER do a two-step "deploy placeholder then fix". Pass real file content in the first call. For multi-file EFs where inlining all files reliably in one tool call is the risk, collapse to a single `index.ts` (strip `./relative` imports, dedupe shared env-var consts, alias any re-exported names) and deploy that one file. Verify post-deploy via `Supabase:get_logs` service=edge-function (boot errors + absence of error-status invocations) — the bash network allowlist blocks `*.supabase.co` so curl-probing the live endpoint isn't available. Earned PM-420 step 4b: a placeholder deploy went ACTIVE as onboarding version 91 with garbage content; caught on review, ~4 min window, no member hit it.

Before adding any CHECK constraint to a table that already has live production write surfaces, audit those surfaces for literal value writes that would violate the new constraint. PM-420 step 4a-pre-1 earned this rule the hard way: added `movement_activities.source` CHECK constraint with new vocabulary (`hk_workout` / `manual_supplement` / `manual_log` / `prompt_tick`) without first grepping for the existing `source: 'manual'` literal at `movement.html:644,931`. Constraint went live → production quick-log writes immediately started 400ing. ~90 second outage before hotfix migration loosened the CHECK to accept both vocabularies.

**Audit procedure:** for any CHECK on a pre-existing table column, run repo-wide grep for the literal old values (`grep -rn "source.*'<value>'"`) across `vyve-site` + EF source. Either rename writers in same atomic commit (preferred) or loosen the CHECK to accept old + new vocabulary during transition (acceptable for soft migrations). Never ship a strict CHECK against a column that has live production writes elsewhere.

The same trap class: any constraint that narrows the set of accepted values for a pre-existing column. NOT NULL on a previously-nullable column, narrower CHECK enums, foreign keys against tables that may have unreferenced strings — all require pre-flight write-surface audit.

#### §23.80 — Ported boot/IIFE blocks call page-local entry functions; grep the destination before shipping (PM-422, candidate)

When copying a page's boot/auth-observer IIFE between portal pages, the entry-function name (`init`, `boot`, the page-specific loader) is page-local and almost never matches the destination file. A copied IIFE calling a non-existent entry function throws an uncaught `ReferenceError` on every page load. It is non-fatal — it kills only the IIFE, so the page still works and it survives review and "works on my screen" — but it fires a `high`-severity `platform_alerts` row on every load for every member, flooding the alert-digest and burying genuine incidents. Earned PM-422: `workouts-notes-prs.js` carried an auth-observer IIFE copied from nutrition.html (comment said so) calling `init()`; that file has no `init()` (it defines on-demand session helpers), so it threw on every workouts.html load, live since PM-255, hitting 5+ real members before it was noticed. When porting any IIFE/bootstrap block between pages, grep the destination file for the called function's definition before shipping; if absent, wire it to the real entry point or delete the block. Sibling to §23.44 (script-tag inclusion audit) and §23.57 (mockup→page full-checklist diff). Promotes to hard rule on second occurrence.

**Digest-mapping note (banked, not codified):** the alert-digest commit-mapping heuristic maps an error's endpoint to a vyve-site file and shows that file's last 3 commits as "recent / possibly related." When the bug lives in a *sibling bundled script* (here the error was in `workouts-notes-prs.js` but the mapped file is `workouts.html`), the digest surfaces unrelated recent commits and the AI diagnosis may pin blame on them. Treat the digest's commit attribution as a hint, not a conclusion — always open the actual file/line from the error payload. Revisit if this misleads twice.

#### §23.81 — movement.html renderPlan must route by shape presence, not plan_type (PM-429, PM-431 — HARD RULE)

Movement-surface plans created by the picker (`movement-plans.html startPlan`) carry `weekly_targets` / `prompt_pool` but **never** `weeks[].sessions[]`. movement.html's structured session renderer reads weeks→sessions and bails `if (!session) showNoPlan()` — so a member WITH an active plan sees the no-plan "Choose your plan" CTA and the chosen plan renders as nothing. This is NOT a hydration/Dexie-timing bug (the row is in Dexie instantly via the PM-427 mirror); the renderer silently discards it. **Rule:** `renderPlan` routes on `!hasSessions` (any sessionless movement plan — just_steps AND locked_ramp Foundation/Distance) → the state-aware ring/target layer (`applyMovementState`); only genuinely session-shaped legacy plans take the structured path. Never dispatch by enumerating `plan_type` values — a new picker shape (e.g. a future "interval walk") would silently regress. Earned twice: PM-429 (just_steps bailed) then PM-431 (locked_ramp bailed identically). Sibling to §23.57 (mockup→page checklist): when a render path is copied from a sibling surface (here the workouts session renderer), audit which plan SHAPES the destination surface actually produces before trusting the copied dispatch.

#### §23.82 — A `supabase.rpc()` to a non-existent Postgres function fails silently, not loudly (PM-435, candidate)

supabase-js returns `{ error }` (not a throw) when the named function doesn't exist; an EF fallback that returns a constant on error then masks the bug indefinitely. `certificate-checker` v23 called `get_next_global_cert_number` (never existed — the real fn is `next_certificate_number()`); its `if (error) return 1` numbered EVERY certificate `1` for an unknown duration, only caught when max `global_cert_number` was 2 across 9 certs. **Rule:** when wiring an EF to an RPC, confirm the function exists in `pg_proc` before trusting it; any rpc-error fallback returning a constant is a candidate for hiding a missing-function bug — log the error, don't swallow to a default. Companion pattern (banked): when a value must match a client-side Dexie compute (here the Your Journey progress buckets), express the rule ONCE as a server SQL function (`get_certificate_buckets()`) consumed by both the EF and any backfill, rather than re-deriving it in two languages. Promotes to hard rule on second occurrence.

#### §23.83 — never re-key an existing Dexie store via a version bump (PM-436 — HARD RULE)

Changing a store's `keyPath` (primary key) in a later `db.version(N).stores()` forces Dexie to delete + recreate the object store inside the versionchange transaction. IndexedDB cannot alter a keyPath in place, and iOS/WKWebView mishandles delete-and-recreate-of-the-same-store-in-one-transaction — `db.open()` rejects on any device already holding the prior version's data, db.js falls through to the noop shim (`isEnabled()===false`), and EVERY Dexie-backed surface silently reads empty (0/30 home rings via `loadPillarCounts`, habits.html "no habits assigned") while EF-backed surfaces still paint. Fresh installs are unaffected (clean create, no migration), so it sails through quick tests and breaks ONLY existing-data devices on the next bundle — full member blast radius, silent, looks like data loss. PM-425 did exactly this (`workout_plan_cache` `member_email`→`id`, SCHEMA_V22); every device stuck at on-disk IDB v210 (= Dexie v21; Dexie stores IDB version as schema×10) because the 21→22 upgrade kept throwing. Reverted in PM-436 (`e44b2357`) — wpc back to `member_email`, `db.version(22)` kept as a no-op bump so jammed v21 devices upgrade 210→220 with no store recreate and self-heal on next open. **Rule:** to add/change a primary key, create a NEW store under a new name and repoint sync + reads (phones add a store cleanly), OR do a deliberate two-RELEASE delete-then-recreate (delete the store in one shipped version, recreate in a later one — never both in the same open). Never re-key in place. **Corollary:** a failed `db.open()` must not silently degrade to a confident `0` — distinguish "Dexie unavailable" from "genuinely zero" (graceful-fallback backlog item). Diagnostic: `indexedDB.open(name)` onsuccess → `db.version` (÷10 = Dexie schema version on the device); `VYVELocalDB.isEnabled()===false` + populated server tables = jammed open, not a data problem.

#### §23.84 — mental-health-sensitive video content gated on Phil + on-asset crisis signposting before airing (PM-437 — HARD RULE)

Any member-facing video addressing suicide, self-harm, addiction crisis, bereavement or equivalent acute mental-health territory (first instance: Lewis's "Suicide and Men") must NOT be scheduled into the live rotation or seeded to Replays until (a) Phil has clinically signed it off and (b) it carries visible crisis-support signposting (helpline on the asset + in the description). Extends the HAVEN safeguarding bar to video. Recovery-adjacent talks that are not acute (e.g. "Not Drinking Alcohol") may air but get flagged for Lewis's eye. Rationale: member duty-of-care + Sage/enterprise diligence expects this standard.

#### §23.85 — Membership access gate: ONE model, gate on `subscription_status` not `account_type` alone (PM-438 — HARD RULE)

`members.account_type` (`trial`/`paid`/`comp`/`enterprise`) is the **durable identity**; `members.subscription_status` (`active`/`expired`) is the **live access flag**. Access is granted iff `account_type IN ('comp','enterprise') OR subscription_status='active'`. NEVER treat `paid` as unconditionally allowed — a cancelled paid member is `account_type='paid'` + `subscription_status='expired'` and MUST be walled. The client gate (`auth.js` `vyveCheckAccess`, composed after `vyveCheckConsent`) and the DB write-guard (`assert_member_not_expired`, BEFORE INSERT trigger `aaa_membership_guard`) MUST share this exact predicate. Expiry is a **cron flag-flip** (`expire_lapsed_trials`, pg_cron jobid 34, daily 01:00 UTC) — NEVER request-time date math against `trial_ends_at` (keeps the gate cacheable / local-first per §23.12). `comp`/`enterprise` never expire. Conversion happens off-app (App/Play IAP rules): wall → external browser → marketing-site `continue.html` (prefills `VYVE10` £10-off-forever + binds `members.id` as `client_reference_id`) → £10/mo Payment Link → `stripe-webhook` EF flips `account_type→paid` + `subscription_status→active`. The conversion Payment Link MUST be separate from the £20 new-signup link and MUST NOT redirect to `welcome.html` (re-runs onboarding → clobbers returning members).

#### §23.86 — online.vyvehealth.co.uk is unreachable from the sandbox; never judge a portal asset broken from a sandbox 403 (PM-451 — HARD RULE)

The Claude sandbox egress only allows a fixed domain list (github.com, api.github.com, raw.githubusercontent.com, npm/pypi, etc.); `online.vyvehealth.co.uk` and `www.vyvehealth.co.uk` are NOT on it, so curl/fetch to them returns **403 (proxy deny) for EVERY path** — including long-live files like `logo.png`, `sw.js`, `theme.js` that the real app loads fine. A sandbox 403 is therefore NO evidence an asset is missing or that GitHub Pages is broken. To verify a committed asset landed, use the raw GitHub API pinned to the commit SHA (`GET /repos/.../contents/<path>?ref=<sha>` with `Accept: application/vnd.github.raw` -> 200), or have Dean confirm in-app. NEVER re-host or re-commit a portal asset on the strength of a sandbox 403 alone (first instance: PM-451 host-card thumbnails — all 403'd from the sandbox while present in the repo and served to users).

#### §23.87 — Dexie catalogue stores expose `.allFor()`, never `.all()`; a wrong accessor throws and a try/catch silently degrades the surface (PM-455 — HARD RULE)

Tables built with `makeCatalogueTable()` in db.js (e.g. `calendar_occurrences`, `service_catalogue`, `replay_videos`, `mind_videos`) expose `allFor()` (no-arg returns the whole table via `toArray()`), `replaceForMember(null, rows)`, and `upsert` — but NOT `all()`. Calling `.all()` throws `TypeError: ...all is not a function`. When that call sits inside a `try/catch` that returns a fallback (as the PM-453 home carousel did), the surface degrades silently to its fallback with no console error visible to the user — it just shows stale/old content. Always read catalogue stores via `.allFor(null)` (grep an existing consumer — sessions.html `readActiveBroadcasts` is the reference). When adding a try/catch fallback around a Dexie read, log the caught error so a wrong-accessor bug surfaces instead of hiding as "the new code isn't showing".

#### §23.88 — Version-controlled Python that runs on Dean's Mac must be Python 3.9-safe; no backslash inside an f-string expression (PM-458 — HARD RULE)

Dean's Mac runs the Xcode Command Line Tools system `python3`, which is **3.9** (`/Applications/Xcode.app/.../Python3.framework/Versions/3.9/`). The Claude sandbox/container is 3.12, where PEP 701 allows backslashes inside f-string expression parts — so `python3 -m py_compile` in-container does NOT catch a backslash-in-`{...}` that is a hard `SyntaxError` on 3.9/3.10/3.11. The `vyve-live-runner.py` had `f"… {x or '(none found \u2014 …)'}"` and died at import on the Mac. RULE: any `.py` meant to run on Dean's box must avoid backslashes inside f-string expression parts — use a literal Unicode character (`—`) rather than the `\u2014` escape, or pull the string out of the brace. When committing a runner/script, AST-scan FormattedValue source segments for `\` (the 3.12 py_compile won't flag it).

#### §23.89 — launchd LaunchAgents have NO access to ~/Desktop, ~/Documents, ~/Downloads (macOS TCC); keep an agent's working set in a non-protected dir (PM-460 — HARD RULE)

A macOS user LaunchAgent runs outside the interactive Terminal's TCC grant, so it cannot read/write the TCC-protected folders (~/Desktop, ~/Documents, ~/Downloads, iCloud Drive, removable/network volumes), and there is no UI prompt for a background agent — accesses fail with `Operation not permitted` (EPERM) and a RunAtLoad+KeepAlive job exit-loops (`launchctl list` shows `- <n> <label>`). It "works when run by hand" only because interactive Terminal carries the user's grant. RULE: anything launchd runs — the script, its env file, AND its data/media — must live in a non-protected location (e.g. `~/vyve-live` or `~/Library/Application Support/<app>`). First instance: the vyve-live-runner LaunchAgent died on `~/Desktop/Lives` until runner + env + masters were relocated to `~/vyve-live` (PM-460). (Granting Full Disk Access to /usr/bin/python3 or /bin/zsh also works but is a broad grant requiring manual GUI steps — relocation is cleaner and scriptable.)

#### §23.90 — Replay pages MIRROR YouTube playlists; remove a replay at the YouTube source, clearing the DB alone re-syncs (PM-461 — HARD RULE)

The in-app replay surfaces (replay-category.html and the live pages' QUIET state) render from replay_videos + replay_playlists, a CACHED MIRROR of the per-category YouTube playlists (replay_playlists.youtube_playlist_id), refreshed by a daily cron (~03:30). So `DELETE FROM replay_videos` on its own is futile — the next refresh re-pulls whatever is still in the YouTube playlist. To remove a replay: delete it at YouTube (playlistItems.delete to unlink, or videos.delete to remove the content entirely — which also drops it from the playlist), THEN zero the DB mirror for immediate effect (else it clears at the next cron). YouTube creds in Vault (YOUTUBE_OAUTH_CLIENT_ID/SECRET/REFRESH_TOKEN); refresh-token grant -> scope youtube covers videos.delete + playlistItems.delete. Conversely replays APPEAR on their own: vyve-live-runner playlistItems.inserts each broadcast into its category playlist at creation, and the refresh cron pulls it in.

---

### Content / brand discipline (carried)

- **Never "Kahunas"** — product is "VYVE Health app" in member copy.
- **Never "Corporate Wellness"** — not used as tagline or descriptor.
- **Live session badges** — green (`#22c55e`), never red.
- **Gemini imagery** — always append "Colour grade: deep teals and greens, warm highlights, no text, no logos."
- **`team@vyvehealth.co.uk`** is a Microsoft Exchange via GoDaddy mailbox, NOT Google Workspace. MX `vyvehealth-co-uk.mail.protection.outlook.com`. DKIM via `brevo1._domainkey` + `brevo2._domainkey`. Migrate to enterprise tenant post-first-enterprise-contract.
- **Always send pipeline alerts to multiple recipients** — single inbox failure must never blind us to itself. `email-watchdog` TO `deanonbrown@hotmail.com`, CC `lewisvines@hotmail.com` + `team@vyvehealth.co.uk`. Apply to any critical-path automated mail.
- **Pre-launch / staging files in vyve-site root** — "no inbound links + no backend wiring" is NOT sufficient signal a file is orphaned. Some files are staged unlinked from nav awaiting clinical/Lewis/Phil sign-off (e.g. `VYVE_Health_Hub.html`). Never archive or delete a substantial standalone HTML file without confirming with Dean.
- **Website footer** — "VYVE Health CIC" (not "Ltd").
- **Enterprise references** — named prospects not included in brain or investor docs. Use generic language.
- **`members.kahunas_qa_complete`** — dead post-04 May. Do not gate behaviour on it in new code. Backlog item flagged to drop the column.
- **BST timezone bug** — always construct local dates via `d.split('-')` → `new Date(+y, +m-1, +d)` in portal JS. `new Date(dateString)` parses as UTC and drifts by an hour in BST.
- **`esm.sh` unreliable in Deno** — use Deno built-ins (Web Crypto, std library) for crypto.
- **`first_name` location** — `members` table, not Supabase Auth `user_metadata`.
- **iOS Web Push user gesture** — must be triggered from button click, not page load. RFC 8291 AES-GCM encryption mandatory. (Web push retired; rule retained for historical reference if it returns.)
- **Employment Rights Act** — SSP changes 6 April 2026; strongest current economic argument for preventative wellbeing in sales conversations.

---


#### §23.91 — Replays only surface broadcasts with a REAL recorded duration; the broken-autostart back-catalogue is mostly dead (PM-465 — HARD RULE)

Refines §23.90. Pipeline: `session-publish` (cron jobid 27, hourly :05) PRE-CREATES each upcoming broadcast and adds its video to the category playlist (`session_categories.youtube_playlist_id` == `replay_playlists.youtube_playlist_id`, verified identical) — the `playlistItems.insert` is BEST-EFFORT (`playlistOk` logged, never blocks the row). `refresh-replay-videos` reads `replay_playlists`, upserts `replay_videos`, then reconciliation-DELETEs rows no longer in any playlist.

v4 (PM-465) DURATION GUARD: only upsert/seed items with `duration_sec > 0`. A pre-created-but-not-yet-aired broadcast reports `contentDetails.duration = "P0D"` (parses null); a live-but-unfinished one too. Without the guard those surfaced as 0-second replays. They are now held back until the recording finalises, then picked up next run. Verified live: upcoming `URgCwDw4Y2g` ("10 Minute Flow") held back (upcoming_leaked=false).

Cron change: `refresh-replay-videos` moved daily 03:30 → HOURLY at :45 (`vyve-refresh-replay-videos-hourly`, jobid 36; old jobid 26 unscheduled) so replays appear within ~1h of a session ending, not next morning.

Back-catalogue reality (4 Jun): of 21 `youtube_broadcast_id`s on file, only 4 were genuine watchable recordings (today's Yoga Flexibility `9b-xSEfEIKc` + Calming Breathwork `-LanVrrQGPA`, already in playlists; older Yoga `d-dNe6W-o4I` 51m + Mindfulness `24JKB3ufM4k` 18m48s). The rest: 10 deleted from YouTube, 5 zero-duration (P0D) shells, 1 stray PUBLIC "Big Buck Bunny" test (`aqz-KE-bpKQ`), 1 dev-test "PM-327 Device Walk" (`JEFNPGKhQqY`). 16 junk broadcast_ids NULLed in `calendar_occurrences` (the 10 deleted + 5 P0D + Big Buck Bunny); genuine + legit-upcoming + the dev-test record kept.

Tool: `replay-playlist-backfill` EF (verify_jwt:false, `?dry=1` for report-only) — idempotent curated backfill; eligibility = on-YouTube + privacy `unlisted` + real duration + title NOT `/(pm-\d)|(device walk)|(big buck bunny)/i`. Used to add the 2 genuine older recordings. `replay_videos` now = 4, zero junk.

#### §23.92 — Frequently-changing media lives in Storage + DB pointer, never bundled repo assets; warm-on-open + SW-SWR cache makes it local-fast (PM-471→474 — HARD RULE)

Content that changes on a live cadence (live-session thumbnails, any future per-session/per-host imagery) must NOT be committed as /assets/* files in vyve-site — those freeze into the binary at bundle time and can only change via an OTA. Instead: store the bytes in a Supabase Storage public bucket and point a DB column (calendar_occurrences.image_url) at the Storage public URL. To keep it as fast as a bundled/local asset without the freeze: (1) a warmThumbnailPool()-style on-open background prefetch of the distinct URL pool (new Image().src, idle-deferred, deduped) — cheap because the pool is small/fixed even as the schedule churns; (2) a sw.js stale-while-revalidate branch scoped to the Storage origin/path, writing a DEDICATED cache that is added to the activate PRESERVE set so it survives app-shell deploys (mirror the member-avatars block exactly — vyve-avatars-v1 / vyve-session-thumbs-v1 / vyve-drive-thumbs-v1 are the three preserved runtime caches). Net: download-once, persist on-device (Cache Storage), instant + offline + auto-updating, no bundle, no OTA. Dexie is for structured data; Cache Storage is the equivalent local-first store for binary media — do NOT stuff image bytes into Dexie. Thumbnail model on calendar_occurrences.image_url is hybrid per-host + per-type: <host>.jpg for host photos, pilates.jpg / stretching.jpg for type series (resolves the old type-vs-per-host open call). Seed Storage from GitHub-pinned bytes via a one-shot EF using LEGACY_SERVICE_ROLE_JWT (§23.7) invoked over pg_net (bash can't reach *.supabase.co, §23.86).


**Now load-bearing (PM-569): iOS members are bundled as of 1.7 live, so any `/assets/*` media committed into vyve-site genuinely freezes for the iOS cohort until an OTA — this rule is live, not hypothetical.**

#### §23.93 — Habit autotick is Dexie-first/instant; server backfill anchored to first-engagement; backfill rule UNIFORM across B2C/B2B (PM-477 — DOCTRINE, build pending)
The auto-tick must fire from local/Dexie the moment HealthKit loads on open — network never gates the tick (server is reconciler + cross-device truth; JS<->SQL parity). History backfill of habit ticks is anchored to FIRST GENUINE engagement (earliest real VYVE activity), not signup — a dormant-since-signup account gets today forward only, never a retroactive flood. The backfill rule is the SAME for individual and corporate: never fork it to inflate a corporate engagement number — inflation poisons the exact metric enterprise buys/renews on, sets a fake-high baseline, and detonates on cross-check; the first-engagement anchor already lets genuinely-engaged-then-lapsed staff backfill legitimately. HealthKit activity samples already backdate via promotion -> cardio/workouts/weight; this brings habit completion onto the same model. No HK background delivery — foreground-only sync, backfill-on-open.

#### §23.94 — `vyveGetJWT` is the only correct way to get a JWT in portal pages; hard redirects on token failure belong only in `vyveInitAuth` (PM-540/541 — HARD RULE)

All portal page code that needs a JWT MUST call `window.vyveGetJWT()` (defined in `auth.js`). It calls `getSession()` first; if the access token is expired, silently calls `refreshSession()` and returns the fresh token — invisible to the member. Returns `null` only when the refresh token itself is gone (days of inactivity). NEVER call `vyveSupabase.auth.getSession()` directly in page code for this purpose — it does not refresh and will return a stale token that causes 401s on RLS-gated queries. NEVER redirect to login from a per-request JWT fetch (`vyveGetJWT` does not redirect). The hard redirect lives ONLY in `vyveInitAuth` on cold boot. On a `null` return from `vyveGetJWT`, page code may redirect to login with `VYVE_RETURN_TO` set — but a failed page load (e.g. notifications empty state) should show an error state, not force a logout. Supabase session config: `sessions_timebox: 0`, `sessions_inactivity_timeout: 0` (never force-logout). Access token JWT expiry stays 1hr (correct — refresh is silent). Earned from PM-540: habits.html fired 3 parallel RLS queries with an expired access token, generating 3 simultaneous `critical` incidents for one member's normal hourly token expiry.

#### §23.104 — Every SECURITY DEFINER function defaults to service_role only (PM-564 — HARD RULE)

Every `SECURITY DEFINER` function in `public` must `REVOKE EXECUTE FROM PUBLIC, anon, authenticated` unless it is deliberately member-callable. The Postgres default grants EXECUTE to PUBLIC on function creation — this is wrong for SECURITY DEFINER functions and must be corrected at creation time. Member-callable functions that accept an email/id parameter must self-scope: `IF auth.role() <> 'service_role' THEN p_email := auth.email(); END IF;` — prevents authenticated-role IDOR while keeping EF service-role calls working (where `auth.email()` is NULL). Audit signal: `SELECT proname, proacl FROM pg_proc JOIN pg_namespace n ON n.oid=pronamespace WHERE n.nspname='public' AND prosecdef AND proacl::text LIKE '%anon%'` — any hit is a violation. Earned PM-564 (Tier 0/1 remediation of 21 functions, 2 CRITICALs among them).

#### §23.106 — Bundled iOS cohort has no proven delivery channel; a verified Capawesome OTA is the gating capability (PM-569 — HARD RULE)

As of iOS 1.7 (live 2026-06-09, server.url removed), iOS members are pinned to the vyve-site SHA baked into the binary. The ONLY fast path to change anything for them is a Capawesome OTA (app `f9961f66` / prod channel `89e12796`) — and that path has NEVER been exercised end-to-end. Until one OTA bundle is pushed and verified landing on a real member device, the sole way to ship an iOS member-facing fix is a full App Store resubmit (multi-day review per cycle). Consequences to keep front-of-mind every session until resolved: (1) a vyve-site commit does NOT reach iOS members — never tell Dean "members will see this in 2-15min" for iOS; that's Dean's server.url view only. (2) Verifying a build via the Settings vbb-marker confirms Dean's cohort, not iOS members. (3) Any urgent iOS member-facing bug is currently unshippable without store review — treat iOS member-facing regressions as high-severity accordingly. A verified OTA push is the top native priority, ahead of new features, and a hard pre-Sage gate. Android 1.0.6 is now live too (approved 9 Jun, PM-573) — the gap applies to the Android cohort as well; once members update, the entire installed base is bundled/frozen with no OTA path. (Numbering note: §23.105 is reserved by the PM-568 cron-fix session — its rule body is in the PM-568 changelog and should be back-filled into §23 by that session.)

#### §23.107 — Why the Capawesome OTA has never worked: no sync/ready in the shell (PM-571 — HARD RULE)
**The `@capawesome/capacitor-live-update@8.2.2` plugin is installed, native-linked, and configured in Mac-local `capacitor.config.json` (`appId f9961f66-eb66-4102-b1c5-f9b2c7baeebf`, `autoDeleteBundles:true`, `publicKey:""`) — but NO `LiveUpdate.sync()` / `LiveUpdate.ready()` calls exist anywhere in the vyve-site web shell (verified PM-571: full shell-file sweep + org code search, 0 hits; only an unrelated comment in personal-bests.html). The plugin does NOT auto-sync; without `sync()` nothing is fetched, without `ready()` an applied bundle rolls back. Therefore the live 1.7 binary CANNOT receive an OTA. The fix is JS-only but gated on a NEW bundled binary (1.8): wire `sync()` on launch + `ready()` after first paint + channel `89e12796`, native-guarded so the server.url dev-loop ignores it, then ship 1.8. The §23.106 canary push must target 1.8, NOT 1.7.**

#### §23.108 — vyve-capacitor is SPM, not CocoaPods: open App.xcodeproj (PM-571)
**The Capacitor iOS project uses Swift Package Manager (`Package.swift`), so there is NO `App.xcworkspace`. Open `ios/App/App.xcodeproj` directly — `open ios/App/App.xcworkspace` fails "does not exist". CocoaPods-era Capacitor used the workspace; this project does not.**

#### §23.107 — CURRENT FRONT is a shared single block; never rewrite it from an in-context template (PM-573 — HARD RULE)

The CURRENT FRONT block is overwritten by every session close. A session holding a stale in-context copy of the front, then regenerating the whole block to describe its own work, silently reverts other sessions' front edits. Happened repeatedly in one day: the PM-571/572 closes reverted both PM-568's cleared `session-reminder-cron` WARN and PM-569's deployment-flip line. **Rule:** when updating CURRENT FRONT, re-fetch `master.md` fresh immediately before the edit (§23.21/24/25 fresh-HEAD discipline applies to the front too) and edit its lines surgically / merge — never regenerate the whole block from memory or an earlier-in-session snapshot. Standing facts (deployment model, open WARNs) are OWNED by durable §-sections (§5/§23); the front only mirrors them.

## 24. Key references, credentials & URLs

### Core infrastructure

| Reference | Value |
|---|---|
| Supabase project ID | `ixjfklpckgxrwjlfsaaz` (West EU / Ireland, Pro) |
| PostHog key | `phc_8gekeZglc1HBDu3d9kMuqOuRWn6HIChhnaiQi6uvonl` |
| Stripe payment link | `buy.stripe.com/00wfZicla1Em0NnaIB93y00` → `welcome.html` |
| Stripe coupons | `VYVE15`, `VYVE10` (still active in Stripe; copy + values need refresh — Lewis call) |
| HubSpot | `app-eu1.hubspot.com` · Hub ID 148106724 · Timezone Europe/London · Currency GBP |
| Strategy dashboard | `online.vyvehealth.co.uk/strategy.html` (password `vyve2026`) |
| Internal password | `vyve2026` |
| Demo reset URL | `online.vyvehealth.co.uk/index.html?reset=checkin` |
| VYVE logo | `online.vyvehealth.co.uk/logo.png` |
| Brand icon source | `online.vyvehealth.co.uk/icon-512.png` (App Store/Capacitor canonical) |
| Podcast page | `www.vyvehealth.co.uk/vyve-podcast.html` |
| Admin console | `admin.vyvehealth.co.uk/admin-console.html` · Broadcast UI at `admin.vyvehealth.co.uk/#/broadcast` |

### Native apps

| Reference | Value |
|---|---|
| iOS App Store | VYVE Health app — version 1.3 `Ready for Distribution`, version **1.4 `Waiting for Review`** (PM-413, 26 May). App ID `co.uk.vyvehealth.app`. |
| Android Play Store | **1.0.5** versionCode 50 — production release saved, "Send 1 change for review" staged (PM-413). 1.0.2 was last live (April resubmission with icon fix). |
| Capacitor OTA | Capawesome live update. App ID `f9961f66`, prod channel `89e12796`. First OTA push candidate = PF-23 v1 first-run (build-ready PM-553) if not shipped in-binary — consider `--rollout 0.1` canary. |

### Secrets & PATs

| Reference | Value |
|---|---|
| GitHub PAT (Composio fallback) | Supabase Vault as `GITHUB_PAT_CLAUDE` (project `ixjfklpckgxrwjlfsaaz`, secret UUID `0c17013f-c79b-4950-8e2f-589ef81078cc`). Fine-grained, VYVEHealth org owner, all-repos, Contents + PRs + Workflows R/W. Fetch via Supabase MCP `execute_sql` — never ask Dean to paste. Expires **20 June 2026** (calendar rotation required). |
| GitHub PAT (brain-scoped) | `GITHUB_PAT_BRAIN` — Contents R/W on `VYVEHealth/VYVEBrain` only. Expires **18 April 2027**. |
| GitHub PAT (capacitor-scoped) | Fine-scoped, Contents R/W on `VYVEHealth/vyve-capacitor` only. Expires **7 May 2027**. Cached in macOS Keychain on Dean's Mac. |
| Supabase Management PAT | Supabase Vault secret `MGMT_PAT` + GitHub Actions repo secret `MGMT_PAT` on `VYVEHealth/VYVEBrain` for `backup-edge-functions.yml`. **No expiry** (rotated 9 Jun 2026). Update both copies in same session if ever rotated. |
| Legacy service-role JWT | Supabase secret `LEGACY_SERVICE_ROLE_JWT` (dual-auth pattern for `send-push`, `achievement-earned-push`, broadcast EFs). |
| VAPID public key | `BDbz2-0k3JcqRWKyasr3MNgEZrXhKsVvjS-otCyyV7Ya4Pi2xXOxXGETUpVoE56VorKzSNy7uyep53gOzNEMTu4` |
| YouTube Data API v3 OAuth | Vault secrets `YOUTUBE_OAUTH_CLIENT_ID`, `YOUTUBE_OAUTH_CLIENT_SECRET`, `YOUTUBE_OAUTH_REFRESH_TOKEN`. Google Cloud project `vyve-website`. Scope `https://www.googleapis.com/auth/youtube`. Owner `team@vyvehealth.co.uk`. Refresh token 7-day expiry while consent screen in Testing — re-mint via `developers.google.com/oauthplayground` weekly. Submit consent screen for Google verification post-launch to eliminate rotation. |
| APNs auth key | KEY_ID `2MWXR57BU4` — rotation deferred 07 May 2026 PM-4 as accepted risk (Apple 2-keys-per-team cap). Chat exposure 27 April PM. If Sage's security review surfaces it, rotate. |

### Repos

- `VYVEHealth/vyve-site` — portal web shell (GitHub Pages at `online.vyvehealth.co.uk`; bundled into Capacitor binaries via `npx cap copy`).
- `VYVEHealth/Test-Site-Finalv3` — marketing/onboarding site (`www.vyvehealth.co.uk`).
- `VYVEHealth/VYVEBrain` — AI source-of-truth document store.
- `VYVEHealth/vyve-command-centre` — Lewis's internal ops dashboard + admin console (`admin.vyvehealth.co.uk`).
- `VYVEHealth/vyve-capacitor` — iOS + Android native Capacitor wrapper. Remote private. Local at `~/Projects/vyve-capacitor` on Dean's Mac. SPM-only Capacitor 6 — no Podfile. `.gitignore` covers all key material.

### Live tables of note (recent infrastructure not in §6)

- `broadcast_schedules` + `admin_broadcast_log` — PM-402 broadcast push (Lewis-facing UI + scheduled cron rails). Recurring schedule = single Studio INSERT with `slug`, `title`, `body`, `audience` jsonb, `recurrence` jsonb, `is_active true`.
- `member_prompts` + `member_prompt_questions` + `member_prompt_dismissals` + `member_prompt_responses` — PM-375 Member Prompts (Lewis-driven in-app questionnaires).
- `checkin_questions` — PM-384 versioned slider questions for weekly + monthly check-ins.
- `podcast_platforms` — PM-378 catalogue.
- `mind_videos` — PM-367 catalogue.
- `persona_welcome_copy` — PM-372 hydration COPY_TABLE.
- `how_to_resources` — PM-377 catalogue (pdf/video).

### Active cron jobs (28 active; jobids 1-31 with gaps at 12/17/19)

| ID | Name | Schedule |
|---|---|---|
| 1 | vyve-reengagement-daily | 0 8 * * * |
| 2 | vyve-daily-report | 5 8 * * * |
| 3 | weekly-report | 10 8 * * 1 |
| 4 | monthly-report | 15 8 1 * * |
| 5 | vyve-certificate-checker | 0 9 * * * |
| 6 | habit-reminder-daily | 0 20 * * * |
| 7 | streak-reminder-daily | 0 18 * * * |
| 8 | warm-ping-every-5min | */5 * * * * |
| 9 | vyve_recompute_member_stats | */15 * * * * |
| 10 | vyve_recompute_company_summary | 0 2 * * * |
| 11 | vyve_platform_metrics | 15 2 * * * |
| 13 | vyve_rebuild_mad_incremental | */30 * * * * |
| 14 | vyve_schema_snapshot | 0 3 * * 0 |
| 15 | vyve-achievements-sweep-daily | 0 22 * * * |
| 16 | email-watchdog | */30 * * * * |
| 18 | process-scheduled-pushes | */5 * * * * |
| 20 | vyve-seed-weekly-goals | 1 0 * * 1 |
| 21 | vyve-gdpr-export-tick | */15 * * * * |
| 22 | vyve-gdpr-erase-daily | 0 3 * * * |
| 23 | vyve_charity_reconcile_daily | 30 2 * * * |
| 24 | vyve_drain_home_state_dirty | */5 * * * * |
| 25 | youtube-token-keepalive-daily | 0 3 * * * |
| 26 | vyve-refresh-replay-videos-daily | 30 3 * * * |
| 27 | session-publish-hourly | 5 * * * * |
| 28 | vyve-broadcast-scheduler | */5 * * * * |
| 35 | youtube-token-health-daily | 0 4 * * * |
| 29 | vyve-alert-digest-morning | 0 8 * * * |
| 30 | vyve-alert-digest-afternoon | 0 14 * * * |
| 31 | vyve-alert-digest-evening | 0 20 * * * |
| 32 | vyve-evaluate-plan-fit | 0 4 * * * |
| 33 | vyve-recompute-step-baselines | 10 4 * * * |

### Make scenarios (Lewis-side)

Retired. Lewis no longer running Make analytics collectors or the social publisher. Brain no longer tracks Make scenario IDs. If Lewis returns to Make-driven workflows, repopulate this section then.

### SW cache

See live `vyve-site/sw.js` (key bumps on every portal commit; do not maintain inline here).

### Composio / GitHub patterns (codified)

- Large files (>~50K chars): always commit via `run_composio_tool("GITHUB_COMMIT_MULTIPLE_FILES", args)` inside the Composio workbench, never direct MCP. When Composio is down (current state, ~6 days), fall back via Vault PAT + Git Data API per §23.27.
- `GITHUB_GET_RAW_REPOSITORY_CONTENT` → S3 URL needing secondary fetch; expires fast, save to `/tmp/` immediately. Decode bytes with `r.content.decode("utf-8")`, not `r.text` (S3 returns text/plain with no charset → requests defaults to ISO-8859-1, fake mojibake on UTF-8).
- `GITHUB_GET_REPOSITORY_CONTENT` → nested `data.content.content` base64; strip whitespace with `re.sub(r'\s+', '', b64)`, pad, decode.
- Multi-file atomic commits: `upserts` array (not `files`); `message` not `commit_message`. `deletes` is flat array of path strings, not objects.
- Always verify large commits by re-fetching at commit SHA and md5-comparing.

---

*Brain master sections 19-24 — curated 26 May 2026. Single source of truth for status board (§19), enterprise blockers (§20), backlog (§21), open decisions (§22), hard rules (§23), and references (§24). Section §24 (Premium Feel Campaign) and the broader PF-40 sub-campaign narrative removed — that campaign closed implicitly when local-first became the architectural baseline; ongoing PF-XX item tracking lives in `tasks/backlog.md` and `brain/active.md`. Section §25 (formerly references) merged into §24.*
