## Added 04 May 2026 PM-3

- **Wire Android FCM in `push-send-native`.** Tokens are already landing — `register-push-token` accepts and stores Android Capacitor tokens in `push_subscriptions_native` (2 tokens, 2 members as of 04 May). What's missing is the send path: `push-send-native` v5 has an explicit branch that skips every Android sub with `reason: "android FCM not implemented (backlog #6)"`. Build: FCM HTTP v1 endpoint (`https://fcm.googleapis.com/v1/projects/{project_id}/messages:send`), service-account JWT signer using Web Crypto (mirror the APNs ES256 pattern), branch on `platform === 'android'` after the iOS path. Until this ships, Android members get the in-app `member_notifications` row + correct routing on tap, but no system banner — the bell icon parity story isn't quite honest. Pre-requisite: Firebase project + service-account JSON key → store as Supabase secret `FCM_SERVICE_ACCOUNT_JSON`. ~1 session.
- **Deprecate VAPID web push stack.** `push_subscriptions` table (10 rows, last sub created 15 April 2026, none since iOS 1.2 ship) is functionally retired — every active member is on a Capacitor binary now. Plan: (1) one-week soak with logging on `send-push` v12 web fan-out leg confirming zero successful pushes; (2) remove the web fan-out branch from `send-push`; (3) drop `vapid.js` from `vyve-site` and the registration call from wherever it's still wired; (4) `DROP TABLE push_subscriptions` after a final 30-day soak. Low risk, just code hygiene. Defer until Android FCM is shipped — don't churn the push stack twice.
- **In-app notifications routing — DONE 04 May PM-3.** vyve-site commit `2fb5a49a`. Notifications sheet on `index.html` (the bell icon) renders each row as a tappable `<button data-id data-route>`; delegated click handler marks-read for that id only and navigates via `location.href = route`. Bulk mark-read on sheet open removed — pink dot now correctly means "not yet tapped". Clear all button retained for explicit bulk. SW cache `v2026-05-04b-habits-remind` → `v2026-05-04c-notif-routing`. No EF or schema changes — `member_notifications.route` column has been populated end-to-end since 29 April PM-2; the renderer just wasn't using it.
- **Brain language overhaul — DONE 04 May PM-3.** Stripped misleading "PWA" framing from master.md where it implied the iOS or Android *member* experience is a PWA. Added two new §23 hard rules: (1) "VYVE is not a PWA — it's two Capacitor binaries"; (2) "Push delivery state — three channels, one working" (APNs live, FCM stubbed, VAPID retired). Renamed §8 header. Reframed §5, §18, §24. Locked the model: vyve-site is the web shell bundled into iOS + Android Capacitor binaries; `online.vyvehealth.co.uk` is a browser-accessible account-management fallback only.

## Added 04 May 2026 PM-2

- **Standardise EF source-header semantic versioning.** Audit (this session) found the `vN` annotations across Edge Function source files inconsistent — some have `// VYVE Health — <name> v<N>` style, some have `// <name> v<N>`, some don't have a version comment at all, and a few of the §7 brain values had drifted away from source. With §7 now stripped of the version column and source declared canonical, source headers are the truth. Sweep all ~32 active EFs once, normalise to a single pattern: `// <ef-name> v<N> — <one-line summary>` followed by a `// Changes from v<N-1>:` block when relevant. Where source has no version comment, add one matching whatever the brain previously claimed (close enough, since the alternative is recovering history nobody has). ~30 mins, one-shot, no functional changes. Output: every active EF self-identifies its semantic version in the first line of source. **PM-3 04 May 2026: `onboarding` v82 done — header/log/`onboarding_version` all v-aligned. ~31 EFs still need the sweep.**

- **Drop `members.kahunas_qa_complete` column.** Dead code post re-engagement-scheduler v8 (04 May PM-2). One-week soak (verify no marketing automation, admin script, or report reads it via Supabase logs `query_log` if available, or audit table grep across all EFs/proxies), then `ALTER TABLE members DROP COLUMN kahunas_qa_complete;`. Low risk — column is boolean, not foreign-key referenced, no triggers attached. Do this around 11 May 2026.

## Added 04 May 2026 PM-1

- **Email pipeline silent-failure recovery (DONE).** Daily/weekly/monthly reports stopped reaching `team@vyvehealth.co.uk` on 28 April due to Brevo recipient-MX cache lag. Diagnosed and resolved 04 May PM-1. Backfilled 12 reports. Watchdog now in place. See changelog.
- **Email watchdog (LIVE).** `email-watchdog` v1 EF + jobid 16 cron (`*/30 * * * *`) covers 5 failure modes with multi-recipient alerts and 6h per-code suppression. New §23 hard rule codified.
- **Investigate elevated platform_alerts rate.** 38 alerts in the 28 Apr – 4 May window: `network_error_member-dashboard` (8), `network_error_register-push-token` (8), `network_error_notifications` (8), `network_error_members` (6), `network_error_sync-health-data` (2), `skeleton_timeout_index` (12), `skeleton_timeout_nutrition` (2), `skeleton_timeout_habits` (2), `js_error` (8). All delivered to Dean+Lewis Hotmail, no missing data, but the rate is elevated and several point at known networking surfaces (push-token registration, dashboard fetch, member fetch). Worth a session: pull the `client_diagnostics` payloads, group by member + alert type, and decide whether any indicate real production issues vs flaky network. ~30 mins exploration.
- **Migrate `team@vyvehealth.co.uk` from personal Microsoft Exchange via GoDaddy to enterprise tenant.** Currently a personal mailbox provisioned via the GoDaddy reseller path with a single `vyvehealth-co-uk.mail.protection.outlook.com` MX. Should move to a proper Microsoft 365 enterprise tenant (or equivalent) post-first-enterprise-contract. Reduces blast radius if anything happens to the personal account. Brain §16 corrected — this is NOT Google Workspace despite earlier userMemories cache stating so.

## Added 29 April 2026 PM-4

- **Surface `auth_blocked` state in member UI.** v9 EF returns `auth_blocked: true` when the all-probes-unauthorized pattern is detected. Currently the v0.6 client auto-recovery silently re-prompts. Better UX would be to show a dismissible banner ("Tap to reconnect Apple Health — required after app updates") when `last_sync_status === 'auth_blocked'`. Avoids the silent permission sheet appearing without context. ~30 mins.
- **Tuck "Force full backfill" button into Settings sub-page.** Currently lives next to "Sync now" on `apple-health.html`. With v9 in place, members shouldn't need it under normal conditions. Either: (a) move to a Settings → Apple Health → Advanced sub-section, (b) remove entirely and rely on `?fullsync=1` URL trigger for support cases. Decide during the apple-health redesign. Lewis copy approval needed.
- **Apple Health page redesign (queued).** Scope: replace `apple-health.html` entirely with an Apple Health-inspired hierarchy — Today's rings → Workouts feed → Steps trend → HR trend → Sleep nightly → Active energy → Weight sparkline. Counts demoted from headline cards to small footer ("Last sync · 2 mins ago · 30 days of data"). Mockup-first workflow per session prompt rule. Lewis copy + framing approval gate. ~2 sessions.
- **Cooldown frequency at scale.** v0.4 dropped `SYNC_MIN_INTERVAL_MS` from 60min to 2min for foreground responsiveness. With 15 members not a concern. At scale (100+ active iPhone members, multiple opens/day) worth checking EF call volume + Capgo battery impact. Monitor as cohort grows; consider lifecycle-only force-sync + 30-min cooldown for visibility events if needed.
- **Investigate increasing `MAX_SAMPLE_AGE_DAYS` cap from 365.** Current 365-day cap on backfill (set in `sync-health-data` v8) means a member connecting HK 18 months after joining gets 12 months. Acceptable for now; surfaceable if/when a real member complains. Trade-off vs runaway batch sizes during first-connect; v9 doesn't change this.

# VYVE Health — Task Backlog

> Updated: 04 May 2026 PM-1 (email pipeline silent failure resolved + `email-watchdog` v1 live every 30 min — multi-recipient alerts, 6h per-code suppression. Brain §16 corrected: `team@vyvehealth.co.uk` is Microsoft Exchange via GoDaddy, not Google Workspace.)

> Previous update: 29 April 2026 PM-3 (Phase 3 Achievements UI redesigned — trophy-cabinet pattern, one trophy per metric, full ladder in modal. 300+ tiles → ~28 trophies. Backlog gained tier-threshold rework as a parked future-vision item.) Headline news: **Achievements UI redesign live on engagement.html — Recently earned + Up next + Trophy cabinet sections, EF unchanged.** `member-achievements` v2 EF (JWT-required) backs the cabinet unchanged. SW cache `v2026-04-29c-trophy-cabinet`. vyve-site commit `30ef4ddba`.

---

## MVP Requirements (Critical for Enterprise Launch)

### 🔥 **Critical Missing Pieces**
1. **Native Push Notifications — Foundation + Session 1 + Session 2 item 1 SHIPPED. SW patch complete.** APNs (iOS) infra fully live end-to-end. AppDelegate.swift bridge methods (27 April PM), `register-push-token` v1 + `push-send-native` v5 ACTIVE. **iOS 1.2 APPROVED 28 April — Ready for Distribution** (bundles HealthKit + native push permission flow + reliability fixes). Session 1 of trigger work: `send-push` v11 unified fan-out EF (web VAPID + native APNs in one call, per-member same-day dedupe via `member_notifications`). `habit-reminder` v14 + `streak-reminder` v14 refactored to delegate. Session 2 item 1 (`achievement-earned-push` v1 + `log-activity` v23 + `achievements-sweep` v2) shipped — end-to-end verified on Vicki's real `member_days` tier 2 cross. **SW `push` + `notificationclick` handlers shipped (`vyve-site@124ecb53`)** — fixed silent web push breakage that had been live since initial rollout. Two new §23 hard rules codified (SW push listener requirement, notificationclick `data.url` routing).

   **Remaining trigger build (Session 2 — 5 EFs, 1/5 shipped 28 April PM):**
   - ~~`achievement-earned-push`~~ **SHIPPED 28 April PM.** v1 deployed; `log-activity` v23 (inline) + `achievements-sweep` v2 (sweep) wired to it. End-to-end smoke verified on Dean (synthetic) + Vicki (real `member_days` t2 cross during sweep). Lewis-approved copy intact. Push fan-out latency 0ms on log-activity (parallel waitUntil).
   - `session-start-nudge` — cron 15 min before scheduled live session start. Optional opt-in (use `members.notifications_milestones` or new column).
   - `weekly-checkin-nudge` — cron Monday 09:00 London. **Cohort split discovered 28 April PM:** of 15 members opted in via `notifications_weekly_summary=true`, 12 are overdue, but **11 of those 12 have never completed a wellbeing check-in at all**. A "your weekly check-in is overdue" push reads wrong to a first-timer. Bifurcated copy needed — first-time activation framing for the 11, continuity framing for prior check-iners. Mental-health-adjacent — Phil should weigh in. **Gated on Lewis + Phil conversation before scaffolding the EF.**
   - `monthly-checkin-nudge` — cron 1st of month 09:00 London.
   - `re-engagement-push` — companion to existing Brevo stream A; cron daily, push to 7-day inactive cohort.

   **Polish (Session 3):**
   - `notification_preferences` — extend `members.notifications_milestones` + `notifications_weekly_summary` to per-trigger booleans (or a new `notification_preferences` table); settings.html UI; max-pushes-per-day cap (3? Lewis decision); Lewis copy approval doc for all 5 trigger types.
   - Foreground-suppression on iOS — Capacitor `pushNotificationReceived` listener should consume the payload as in-app toast input rather than letting APNs banner display, when app is foregrounded.
   - Service worker `notificationclick` handler — read `data.url` from VAPID payload and route. Verify or build.

   **Android (FCM) — parked** until Dean has a Pixel/Galaxy device for testing. Architecture is extension-ready; `push_subscriptions_native.platform` already accommodates.

2. ~~**Habits Editing Bug** — Cannot un-skip or change habit answers once submitted.~~ **SHIPPED pre-session-3 (live on entry 25 April 2026).** Upsert-on-conflict in `logHabit`, Undo button with DELETE in `undoHabit`, unique constraint `daily_habits_member_habit_date_unique (member_email, activity_date, habit_id)` all confirmed live. Re-tapping a habit re-writes the row; Undo clears it and restores the three-button state. RLS `cmd=ALL` covers the UPDATE path cleanly.
3. **HealthKit Integration (iOS-first) + Health Connect (deferred)** — Full plan at `plans/healthkit-health-connect.md`. v1 scope locked: reads 7 data types, writes weight only (workouts write-back not supported by Capgo 8.4.7 on iOS — codified session 4, dead path removed session 5d).
   - ~~Session 1 (DB + EF foundation) shipped 23 April~~: 3 tables, `queue_health_write_back` trigger, `sync-health-data` EF v1 ACTIVE. Shadow-read guard verified.
   - ~~Session 2 pre-device work shipped 23 April~~: `@capgo/capacitor-health@8.4.7` installed, `npx cap sync ios` wired SPM manifest, Info.plist upgraded to Apple-defensible copy, entitlement confirmed.
   - ~~Session 3 (client orchestrator + Settings UI) shipped 23 April~~: `healthbridge.js` + `member-dashboard` v50 (adds health_connections + health_feature_allowed) + settings.html rewrite. Feature-flagged via `localStorage.vyve_healthkit_dev='1'` with server allowlist staged but not yet wired.
   - ~~Session 4 (iOS device validation + UX overhaul) shipped 23 April~~ (commit [612459b](https://github.com/VYVEHealth/vyve-site/commit/612459b)): Xcode 26.4.1 + signing setup, iPhone 15 Pro Max dev-build working, four plugin debugging iterations codifying Capgo 8.4.7 iOS taxonomy (`Health` plugin name, `calories` dataType, `workouts` read-only, no `saveWorkout`). UX pivoted to Apple-native patterns: consent-gate 4th card (iOS only), connect-only Settings toggle with "open iPhone Settings to disconnect" note, 7-day re-prompt banner on index.html. Initial 30-day pull logged as "complete" but unverified.
   - ~~Session 5 (validation, bug hunt, server-authoritative flag) shipped 24 April~~: spot-check of the 30-day pull surfaced two silent bugs. `sync-health-data` v2 (workout-type normalisation fixes unpromoted workouts), SQL backfill of 7 existing samples, then vyve-site commits 5a/5b/5c/5d: readSamples method-name fix + platformId in native_uuid, persistent `has_connected` flag fixing banner regression, server-authoritative hydration via member-dashboard v50 on every page load (flag is off localStorage now — real gate is `HEALTH_FEATURE_ALLOWLIST` in the EF), dead writeWorkout branch removed. SW cache: `v2026-04-24d-write-path-cleanup`.
   - ~~**Session 6 — pipeline rebuild shipped 24 April** (vyve-site `37ad068`)~~: `HKStatisticsCollectionQuery` (Capgo `queryAggregated`) adopted for steps/distance/active_energy; new `member_health_daily` long-format table receives deduped Watch-vs-iPhone aggregates; `sync-health-data` v3→v4→v5 deployed (weight native_uuid anti-echo, client diagnostics persistence, `push_daily` handler); BST bucket-anchor bug squashed (client builds daily anchors from local y/m/d, not ISO-parsed-as-UTC); sleep_state metadata verified landing end-to-end (169 sleep segments over 30 days for Dean with full `{light, rem, deep, asleep, awake, inBed}` state coverage); scale-to-app weight round-trip validated (88.55 kg Bluetooth → HealthKit → `member_health_samples` → `weight_logs` via promotion path). `apple-health.html` inspector built but parked (payload weight with 954 samples, needs paging/scoped-pull). `activity.html` personal feed built then unlinked from `exercise.html` (GPS route maps out of scope without Capgo plugin fork; concept likely reappears in a future community surface rather than per-member self-view).
   - ~~**Session 7a — workout cap now source-aware, shipped 24 April**~~: `workouts.source` + `cardio.source` columns (default `'manual'`); `cap_workouts` + `cap_cardio` triggers only cap manual rows; `session_number` check constraints dropped (were tied to the old 2/day cap); `queue_health_write_back()` nested-conditional fix (was crashing on any workouts INSERT for HK-connected members, masked by Dean being the only HK-connected member who'd not manually logged workouts since 5d shipped); `sync-health-data` v6 ACTIVE (stamps `source: 'healthkit'` on promoted workout/cardio rows). Charity totals + cert counters stay naturally capped at 2/day via `get_charity_total()` + `increment_*_counter()` read-path caps — lifting the trigger cap inflates nothing downstream.
   - ~~**Autotick session 7b — schema + Lewis-approved seeds, shipped 24 April**~~: `habit_library.health_rule jsonb` column (nullable, null = manual-only); 2 existing habits retrofitted (`10-minute walk` → daily distance ≥ 1km; `Sleep 7+ hours` → sleep-state sum ≥ 420 min last_night); 4 new Lewis-approved seeds inserted (`Walk 10,000 steps`, `Walk 8,000 steps`, `Complete a workout`, `30 minutes of cardio`, all movement pot). Paired with session 2 shipped same day. Plan updated at `plans/habits-healthkit-autotick.md`.
    - ~~**Autotick session 2 — server evaluator + `_shared/taxonomy.ts`, shipped 24 April**~~: `member-dashboard` v51 adds `habits` block to response — each active habit returns `health_auto_satisfied` (bool or null) and `health_progress` (`{value, target, unit}` or null). Evaluator routes per source: daily-table for steps/distance/active_energy, sleep-samples last-night window for `sleep_asleep_minutes`, direct workouts+cardio reads for `workout_any`/`cardio_duration_minutes`. Null-not-false semantics when no HK connection or no data in window. `sync-health-data` v7 is a pure refactor — extracts workout taxonomy into shared file, `promoteMapping` body byte-identical. SQL-validated against Dean's live data across all 6 seeded rule shapes. Session 3 (client UI + editing bug fix) is the last piece.
   - **Still open for v1 HealthKit launch:**
     - Consent-gate + re-prompt banner fresh-account flow test (needs clean signup — never done)
     - Rollout decisions: Alan first, then cohort of ~5. Rollback = `member-dashboard` v52 with reduced `HEALTH_FEATURE_ALLOWLIST`
     - Privacy.html HealthKit section + Lewis sign-off + App Store Connect questionnaire + Build 3 submit
     - Submission-scope decision: submit all 7 reads, or phase to 4 (workouts + weight + steps + active_energy) with v1.1 for HR/sleep/distance
   - **Post-launch HealthKit workstreams (all drafted 24 April):**
     - ~~`plans/habits-healthkit-autotick.md` — auto-tick habits from HK data (steps 8k/10k, sleep 7h+, workouts, cardio duration)~~ **SHIPPED 25 April 2026.** All three sessions live: schema + Lewis-approved seeds (session 1/7b), server evaluator + `_shared/taxonomy.ts` (session 2), client UI wired to `member-dashboard` v51 with pre-tick on auto-satisfied rows, `.hk-progress` hints on unsatisfied rows, `.hk-badge` scaffolded hidden pending Lewis design (session 3). Editing-bug fix turned out to already be in place (upsert + undo + unique constraint all live pre-entry). Feature fully flagged via `HEALTH_FEATURE_ALLOWLIST` — Dean only today. Rollout opens alongside the broader HK v1 launch.
     - `plans/healthkit-views.md` — Apple Health data inspector (`apple-health.html`) + personal activity feed on `exercise.html`. Transparency + engagement. ~2 sessions.
     - - `plans/healthkit-background-sync.md` — iOS HealthKit background delivery via `HKObserverQuery` + `BGAppRefreshTask`. **PARKED 25 April 2026** as future vision. Investigation done: Capgo 8.4.7 exposes zero background primitives (verified against the plugin source); architectural path is a companion Swift Capacitor plugin (~400 lines) alongside Capgo. Scope ≈4–5 build sessions + 1 week device soak + App Store review cycle. Unpark signals: Capacitor wrap on stores; member feedback naming background sync specifically; enterprise pilot requirement.
     - Nutrition/MFP reads via HK — parked. Capgo 8.4.7 exposes no dietary types. Would need plugin fork/PR. Separate plan at `plans/nutrition-healthkit.md` when sequenced. Unblocks water habit auto-tick and MFP-native nutrition totals.

### ⭐ **High-Value Additions**
4. **Enhanced Content Quality** — Update wellbeing check-in slider questions to match onboarding questionnaire. Add health disclaimer for App Store compliance.
5. **Advanced Analytics** — Enhanced employer insights with absenteeism correlation, burnout prediction, productivity metrics for enterprise ROI conversations.
6. **HealthKit Rollout — Open to All iPhone Users (~1 session) — SHIPPED 26 April 2026** — Drop the hard-coded `HEALTH_FEATURE_ALLOWLIST` in `member-dashboard` v51 (currently Dean only) and replace with `member_health_connections` row presence as the truthsource. Settings page gets an "Apple Health" toggle, rendered only on iOS Capacitor builds (Android Capacitor + PWA hide it via runtime guard). Existing consent gate flow handles the actual permission + data-sharing wording. **Android Health Connect parked** until Dean has a Pixel/Galaxy device for end-to-end testing — schema and EF logic are extension-ready, no blocker beyond device. Ships **before** the Achievements System (item 7) so the four HK-derived metrics (lifetime steps, distance, active energy, sleep nights) aren't a Dean-only feature on launch day. Effort: ~1 session.

7. **Achievements System — Cumulative-Forever, Push on Earn — PHASE 1 COMPLETE 27 April 2026** — Both Phase 1 layers shipped: data layer (AM session) + Lewis copy approval (PM, two sessions). **Live state:** 32 metrics × 327 tier rows, all `copy_status='approved'`, all 32 `display_name` values finalised. The `copy_status` gate ensures future re-seeds preserve Lewis-approved copy via `CASE WHEN copy_status='approved' THEN public.achievement_tiers.title ELSE EXCLUDED.title END`.

   **Catalog adjustments locked-in alongside copy approval:**
   - Dropped `running_plans_generated` (dead-wired, source table empty), `cardio_distance_total` (only 1/50 historical rows had distance), `session_minutes_total` (dead-wired, view-time data not meaningful yet).
   - Added `volume_lifted_total` in new `volume` category. Required `achievement_metrics_category_check` constraint expansion. Ladder: 100 kg → 50 megatons over 10 tiers. **Not yet wired in evaluator** — see Phase 2 below.
   - Fixed `streak_checkin_weeks` threshold ladder (was day values, corrected to weeks-scaled `3, 6, 10, 16, 26, 39, 52, 78, 104, 156, 208, 260, 312, 520`).

   **Final metric inventory (32):**
   - **Counts (12):** `habits_logged`, `workouts_logged`, `cardio_logged`, `sessions_watched`, `replays_watched`, `checkins_completed`, `monthly_checkins_completed`, `meals_logged`, `weights_logged`, `exercises_logged`, `custom_workouts_created`, `workouts_shared`
   - **Volume (1):** `volume_lifted_total`
   - **Time totals (2):** `workout_minutes_total`, `cardio_minutes_total`
   - **HK-derived (4, hidden_without_hk):** `lifetime_steps`, `lifetime_distance_hk`, `lifetime_active_energy`, `nights_slept_7h`
   - **Streaks (6):** `streak_overall`, `streak_habits`, `streak_workouts`, `streak_cardio`, `streak_sessions`, `streak_checkin_weeks`
   - **Variety (1, recurring):** `full_five_weeks`
   - **Collective (2):** `charity_tips` (recurring), `personal_charity_contribution`
   - **Tenure (1):** `member_days`
   - **One-shots (3):** `tour_complete`, `healthkit_connected`, `persona_switched`

   **Phase 2 — sweep extensions (next to schedule):**
   - `volume_lifted_total` evaluator wiring in `log-activity` INLINE map. **Mandatory sanity caps:** reject any `exercise_logs` row where `reps_completed > 100` or `weight_kg > 500` before counting toward the metric. Two corrupt rows on Dean's account (Back Squat, 2026-04-18, `reps_completed = 87616`) need zeroing first — would fire tier 10 immediately if left unfixed.
   - Sweep extensions for HK lifetime metrics, `full_five_weeks`, `charity_tips`, `personal_charity_contribution`, `tour_complete`, `healthkit_connected`, `persona_switched`. Currently `achievements-sweep` only handles `member_days`.
   - Clean orphan `running_plans_generated` entry from evaluator INLINE map next time we touch `log-activity`.

   **Phase 3 — UI (grid shipped 29 April PM):**
   - **DONE:** `/achievements.js` v1 client lib — toast queue, debounced evaluator, mark-seen, replay-unseen. Loaded on every portal page.
   - **DONE:** log-activity v24 `evaluate_only:true` short-circuit. Trigger pages fire `VYVEAchievements.evaluate()` post-write to activate the evaluator without restructuring the write path.
   - **DONE:** All 9 trigger pages wired (habits, cardio, wellbeing-checkin, monthly-checkin, log-food, movement, nutrition, workouts-session.js, workouts-builder.js, workouts-programme.js).
   - **DONE:** All 8 passive pages load `/achievements.js` for replay-unseen on load (index, engagement, sessions, exercise, settings, running-plan, certificates, leaderboard, workouts).
   - **DONE:** End-to-end smoke verified on Dean's account — toast rendered for `habits_logged` t7 cross.
   - **DONE:** **Notification routing infrastructure** (29 April PM-2, vyve-site `30e8398b`). `member_notifications.route` column + send-push v13 + log-activity v27 (platform v30) + achievement-earned-push v2 + `/achievements.js` + `engagement.html` parseHashRoute + SW postMessage bridge. Hard rule codified master §23. **Every notification anywhere routes to the right place.**
   - **DONE:** **Achievements grid live on `engagement.html`** (29 April PM, commit `997979b5`) — trophy-shelf UI, tier-tinted SVG shapes, modal on tile click, hash deep-link `#achievements` from toast clicks. Backed by `member-achievements` v2 EF (NEW, JWT-required, `getMemberGrid()` in `_shared/achievements.ts`). Tab strip: Progress (default) | Achievements. localStorage cache fallback for offline.
   - **DONE:** Phase 2 `volume_lifted_total` wired into INLINE evaluator with sanity caps. log-activity v25 → v26 (platform v29). 12 cohort tiers backfilled.
   - **TODO:** Index.html dashboard slot showing latest unseen / closest inflight (Phase 3 sub-task, not started).
   - **DONE:** Per-tile deep-link in toast click (`#achievements&slug=X&tier=N`) — modal opens directly on the earned tile (29 April PM-2).
   - **TODO:** Bespoke illustrated badge artwork upgrade — current SVG generator covers 4 shapes × 4 tints. Future upgrade via AI image gen (Gemini + Claude art direction with VYVE brand grade), drop-in replacement of `svgTrophy()` calls. Data layer doesn't change. Captured 29 April PM as the canonical upgrade path; not weeks of illustrator work as previously assumed.
   - **TODO:** Index.html dashboard slot showing latest unseen / closest inflight tier — Phase 3 sub-task, scoped during the morning ship and confirmed unstarted in PM-3. ~1 session of work, low risk (reads existing `getMemberAchievementsPayload()` output).
   - Native push hook on tier earn already wired (achievement-earned-push v2 with deep-link) and fires from real cohort actions.

7a. **Achievements tier-threshold rework — FUTURE VISION (parked 29 April 2026 PM-3)** — Several ladders feel sparse at the upper end (e.g. habits jumping 100 → 250 → 500 → 1000 doesn't keep next-tile reachable). Not blocking anything; trophy cabinet redesign already smooths the perceived density. **Approach when picked up:** surgical add-tiers-between-existing-thresholds (lower-blast-radius play that preserves existing earned `member_achievements` rows, preserves Lewis-approved tier copy via `copy_status='approved'` gate, only requires Lewis approval of new in-between titles — NOT a re-spacing of the whole ladder, NOT a rebackfill). Workflow: (1) audit pass on all 327 tiers identifying worst-spaced ladders, (2) draft new in-between tier copy in VYVE voice, (3) bulk-approval doc to Lewis (same pattern as original 327-row sign-off), (4) SQL migration adding rows with `CASE WHEN copy_status='approved'` protection. Estimated 2 sessions when prioritised. **Trigger to revisit:** real cohort feedback that next-tier-too-far is hurting engagement, or as part of a broader Achievements polish pass. Not before.
   - **TODO:** In-app notifications list UI (bell icon dropdown reading `member_notifications` rows for the authenticated member, marking `read=true` on tap, navigating via `route` column). Schema is ready (`route` populated). Likely lives in nav bar across all member-facing pages. Backlog item; not urgent until cohort grows past current testers.
   - **TODO:** Promote `route` to a first-class input on send-push (currently inferred from `data.url`). No behaviour change, just clarity. Defer until a real reason — current single-source-of-truth via data.url works fine.

   **Voice rules locked-in for future ladder extensions:** no emojis, titles 3-6 words, bodies 10-20 words, VYVE voice (proactive wellbeing, evidence over assumption, no fitness-influencer tone), tier 11+ on long ladders short and reverent (no next-tier nudge), recurring-metric copy evergreen, all titles globally unique. Streaks emphasise consecutive cadence; counts emphasise cumulative volume — distinct body voices.

   **Open verification items:**
   - Confirm `full_five_weeks` source-query maps to the five web pillars (mental/physical/nutrition/education/purpose) — Batch 6 copy enumerates these by name. If wired against five platform activity types instead, body needs a tweak.
   - `tour_complete` assumes the in-app tour is built (backlog item, post iOS approval). Metric currently not wired to anything.
   - `persona_switched` is intentionally one-shot (fires on first switch only, not subsequent).
   - **Copy review queue (Lewis re-approval, surfaced 29 April smoke):** (a) `cardio_logged` tier "50 cardio hit" → should read "50 cardio sessions"; (b) `exercises_logged` ladder gap 100 → 250 too steep, smooth to every-50 progression. Both flagged from real toast-render observation.

8. **In-App Tour / First-Run Walkthrough (~1–2 sessions)** — Full design spec landed 26 April. **Builds on top of the Achievements System** — every tour step earns the relevant first-tier achievement, so day one ends with banked progress on the 30-activity certificates instead of the brutal 0% cold start. **Tour activities count as real activities**, not throwaway tutorial ticks. Modal step-through (option a) confirmed for v1. Walks members through: home dashboard (score ring + streak), first habit log, first workout log, first cardio log (with HealthKit consent prompt at this step on iOS), first session watched, first weekly check-in. Each step ends with the member tapping the actual log button — earning `first_habit` / `first_workout` / `first_cardio` / `first_session` / `first_checkin` (tier 1 of each respective ladder) — and the achievement toast/push fires inline at each step. Tour completion itself earns the `tour_complete` achievement. Persistence via `members.tour_completed_at`, with "Restart tour" in Settings. Skip path required. **Dependencies:** Achievements System (item 7) shipped, Lewis copy + screenshot approval. **Ships after** achievements so the celebration moments at each step actually land. Effort: ~1–2 sessions, mostly UI.

---


9. ~~**Lewis copy approval — Achievements ~400 rows (BLOCKING UI)**~~ **DONE 27 April 2026 across two PM sessions.** All 327 tier rows approved (catalog trimmed from 349 to 327 via metric drops/adds during approval) and all 32 display names finalised. UI is now UNBLOCKED — Phase 3 ready to schedule. Voice rules captured in item 7 for future ladder extensions.

## Active Priorities (This Week)

1. **Android icon fix** — resubmitted 15 April, awaiting Google review (Play Store still pending)
2. ~~**iOS icon fix**~~ — **DONE.** Icon corrected in 1.1(3), then rolled into 1.2(1), now live in approved 1.2 binary on App Store.
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

- **[P1] SW push handler verification on a real browser** (Mac Safari / iPhone Safari). Tonight's `vyve-site@124ecb53` patch is verified at static-analysis level only; needs a manual `send-push` smoke against Dean's web subs to confirm a banner renders. Member-side rollout happens organically as cohort members reload portal over the next 24h.
- **[P1] `vyve-capacitor` git initialisation** — flagged backlog risk, two-line fix. Becomes painful once native source edits start (Swift plugins, custom Capacitor plugins).
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
- **Clean up one-shot migration EFs** — recount 28 April: ~32 still-ACTIVE candidates (the original 89-deletion list from the 9 April security audit was only partially actioned). Candidates: `seed-library-1`, `seed-library-2`, `seed-b1`, `create-ai-decisions-table`, `setup-ai-decisions`, `setup-member-units`, `trigger-owen-workout`, `trigger-callum-workout`, `thumbnail-audit`, `thumbnail-upload`, `thumbnail-batch-upload`, `generate-stuart-plan`, `send-stuart-reset`, `monthly-checkin-test`, `run-monthly-checkins-migration`, `run-migration-monthly-checkins`, `resend-welcome`, `delete-housekeeping`, `send-test-welcome`, `send-test-push`, `inspect-members-schema`, `create-test-member`, `create-ai-decisions-table`, `add-exercise-stream`, `force-cache-refresh`, `update-brain-changelog`, `debug-cert-content`, `debug-show-file`, `test-html-render`, `smoketest-ach-push` (28 April inert 410 stub). Keep `ban-user-anthony` if ban workflow still in use. Composio doesn't expose a delete-EF tool — needs Supabase CLI/dashboard.

---

## Brain Hygiene (from 18 April reconciliation)

### Done 24 April session
- ~~`brain/master.md` full rewrite — 55k chars, live-state-sourced from Supabase `list_tables` (70) + `list_edge_functions` (75). Previous file was base64-corrupted and schema had drifted badly (claimed 35 tables / 15 EFs / 31 members). Committed via workbench `run_composio_tool` path, post-commit-verified.~~

### Done this session
- ~~master.md §4: correct the "No triggers" / "No foreign keys" claims~~ **DONE 18 April — actual counts: 119 triggers, 25 FKs (not 14/24 as the previous note said)**
- ~~master.md §4: document the aggregation layer~~ **DONE 18 April — 7 tables + 11 functions + 4 cron jobs documented, Rule 33 added**
- ~~master.md §10: add Rule 33 — aggregation tables are EF-service-role only~~ **DONE 18 April** (+ Rule 34 DB-level caps, Rule 35 email auto-lowercasing)
- ~~Brain reconciliation: update EF inventory~~ **DONE 18 April — all 58 active EFs documented with live versions, missing ones added (admin-dashboard, cc-data, send-password-reset, warm-ping, leaderboard)**
- ~~Automate or delete `brain/schema-snapshot.md`~~ **DONE 18 April — automated via `schema-snapshot-refresh` EF v2 + `vyve_schema_snapshot` cron (Sunday 03:00 UTC). GitHub writes via new fine-grained `GITHUB_PAT_BRAIN` secret (VYVEBrain contents:write only). First auto-commit: [36384af](https://github.com/VYVEHealth/VYVEBrain/commit/36384afa58c9b8381a4d37d6e6554f571dea7229).**
- ~~Resolve `generate-workout-plan` EF ambiguity~~ **DONE 18 April — un-retired. Kept as canonical standalone plan generator. Onboarding v74 duplicates logic inline; refactor task added below.**

### Open
- **Full rewrite of `brain/master.md`** — session 6's pipeline changes (`member_health_daily` table, queryAggregated routing, BST gotcha, v5 push_daily handler) and session 7a's cap fix together constitute enough schema + EF churn that patching master incrementally would drift. Scope: audit all live EF versions (`sync-health-data` v6, `member-dashboard` v50, `certificate-checker` v9, etc.), table inventory including `member_health_daily`, trigger inventory including source-aware caps and fixed `queue_health_write_back`, updated Hard Rules (plpgsql NEW dereference trap + source discrimination for activity caps + queryAggregated-vs-samples routing + BST local-construction rule + nested-condition pattern for record field access). Own session.
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

## Workout Engine v2 — PARKED 27 April 2026 (awaiting Calum's filled inputs pack)

Calum (Physical Health Lead) has delivered the spec, scoring data, and QA framework. We've drafted the inputs pack to give him the remaining must-do inputs (slot templates, contraindications matrix, time→count bounds, progression sign-off, gap-list xlsx for 67 unscored exercises). When he returns the filled pack, the build resumes.

**Architecture decided:** deterministic engine (filter → score with context weights → rank → fill slots) replaces AI exercise selection. AI used only for programme name/rationale (Sonnet 4) + Layer 2 reviewer (Haiku 4.5). Drops cost ~30× (~£0.30 → ~£0.01 per onboarding) AND raises quality by encoding Calum's expertise as data.

**Stages on restart:**
1. Import 203 + 67 = 270 scored exercises into Supabase `exercise_scoring` table; build name normalisation layer (Calum: "Barbell Bench Press" ↔ ours: "Bench Press – Barbell")
2. Build deterministic selection engine in TS inside `generate-workout-plan` v12, behind feature flag
3. Persist new onboarding fields — add columns to `members` for `priority_muscle` + `session_length_workouts`, update onboarding EF v78 → v79 to save them (currently captured by form, dropped by EF)
4. Code Calum's 20 QA scenarios as automated regression tests
5. Shadow mode for ~50 onboardings (run old AI + new engine in parallel, log both, ship old)
6. Cutover after Calum sign-off on shadow comparisons
7. Movement & Wellbeing engine — Dean's call: separate path from workout engine, generates its own movement plan; not yet built (post-Stage 6)

**Calum maintenance surface:** hybrid — Google Sheet sync into Supabase for v1, upgrade to admin page in strategy dashboard later. Sheet → Supabase nightly sync EF needed at Stage 1.

**Inputs pack outputs (drafted, not yet sent to Calum):**
- `VYVE_Inputs_Pack_for_Calum.docx` — 13-page structured questions doc (slot templates, contraindications, time/count, progression, confirmation checklist)
- `VYVE_Exercise_Scoring_Gap.xlsx` — 67-exercise gap list in Calum's format, formulas auto-calc fit-scores + tier from his 8 base scores

**Onboarding alignment shipped today (`Test-Site-Finalv3` `c34c347`):** Section A email/mobile/confirm-email reorder + Section C equipment, environment, session length, priority muscle questions added/rebuilt to match Calum's spec inputs.

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
- Re-engagement copy review — Lewis to bulk-approve subjects + body copy across the new A/B ladder (A_48h/96h/7d/14d, B_3d/7d/14d/30d). Current copy carried forward from v7 staticBodies + AI persona overlay; structurally correct but not yet copy-passed by Lewis post-rewrite.
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