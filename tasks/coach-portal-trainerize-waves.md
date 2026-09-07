# Coach Portal — Trainerize waves (v1)

**Companion to:** `tasks/coach-portal-trainerize-gap-map.md` (PM-1066, items #62–#111) and `tasks/coach-portal-gap-map.md` (Kahunas, #1–#61, all dispositioned PM-983→990).
**Status:** briefs written 2026-09-07 late. **Nothing built.**
**How to use:** Dean says "load the brain, do Trainerize wave N". Load `brain/master.md` → `brain/changelog.md` → `tasks/backlog.md`, then the gap map, then the brief below. Run the §23.23 collision scan (last 15 commits on vyve-command-centre AND vyve-site for the wave's keywords) before any design talk. **The brain wins over these briefs; live Supabase wins over the brain.**

**Look and feel:** `coach-portal.html` is the benchmark. Every wave that touches UI: mockup first, dark first — until Wave D ships, after which light-first. Match the existing wave-zone pattern (new zone at the IIFE tail, shadow by same-scope redeclaration, edit the bottom versions).

**Estimates are Claude-assisted sessions.** Honest total ≈ **15–18**: W0 1 · W1 1.5 · W2 1.5 · W2b 1–1.5 · W3 1.5–2 · W4 2 · W5 2 · W6 2 · W7 2 · W8 1 · W9 2 · WD 1. This is not a one-day plan; it is a two-to-three-week plan at Dean's usual cadence. W0–W2 (≈4 sessions) is the visible-to-a-PT half; W5 is the highest-value single wave.

**Recommended order:** W0 → W1 → W2 → W2b → W3 → W4 → W5 → W6 → W7 → W8 → W9 → WD. Dependencies: W1/W5/W9 read the W0 snapshot; W4 challenge chat needs W3 threads; W7's AI meal draft needs W7's recipe library; WD can run any time after its mockup is approved.

---

## RULES FOR EVERY WAVE

- **The brain wins** over these briefs, memory and chat. Live Supabase wins for counts, EF versions and schema — re-read the schema before writing any EF or SQL.
- **Talk-first for anything production-affecting**; surgical patches need a one-line summary. Once direction is confirmed, execute end to end: commit, deploy, verify, brain update.
- **GitHub writes via the Vault PAT + Git Data API only.** §23.21 fresh-HEAD, §23.30 md5-perfect at the commit SHA (never `ref=branch`, never first-N-chars), §23.26 re-fetch brain files before blob creation, §23.24/25 PM claimed fresh across repos at commit time.
- **vyve-site commits** bump vbb-marker +1 in `index.html` AND `settings.html` AND the sw.js CACHE_NAME suffix in the same commit. Member-facing changes land on Dean's phone via server.url; members need an explicit OTA push — never conflate. OTA 591+ is still owed from W6 Member Admin; any wave that ships member-side code inherits that pending push.
- **Every `assignments` writer merge-preserves** (`merge_slots:true` / META_KEYS / GATE_KEYS discipline). New keys in this plan (`workout_queue`, `alerts`, `schedule_overrides`, `welcome_attachments`, new `gates` keys) are PROTECTED — add them to the protected list in coach-provision-client before any write path touches them.
- **HARD BOUNDARY stands:** no policy may grant coach access to wellbeing_checkins, weekly_scores, ai_interactions or any Mind-pillar table. New coach reads in this plan (achievements, health connection status, health daily aggregates, biometrics) go through consent-gated RPCs, and #106 additionally waits on Lewis + a consent version bump.
- **EF deploys** via native `deploy_edge_function`, full index.ts, verify_jwt as the existing function has it; CORS allowlist must carry `capacitor://localhost` and `https://localhost` (§23.189/200) — grep the eszip after deploy.
- **Verification is a real invocation**: minted coach JWT or §23.224 RLS role simulation, fixture rows cleaned to zero afterwards, jsdom smoke on the portal zone.
- **Lewis gates** are listed per wave. Build behind a flag; never block a wave on copy.
- **Close every wave** with the atomic VYVEBrain commit: changelog entry prepended, master CURRENT_FRONT line, backlog line, this file's Status line updated, gap-map rows marked SHIPPED.

---

## W0 — Backbone (1 session)

**Scope:** #98 snapshot + compliance engine, #71 realtime verify, #66 quick-add, #67 checklist, #95 tile pref, #70 archive flag.

**Build:**
1. Migration `tz_w0_coach_client_weekly`: table (partner_id, member_email, week_start, scheduled_count, completed_count, compliance_pct, nutrition_goal_days, nutrition_logged_days, sign_ins, last_msg_out, last_msg_in, weight_kg, computed_at; PK partner+member+week; coach RLS via is_coach_of; admin read). `gdpr_table_policy` row.
2. EF `coach-weekly-snapshot` v1 (cron Sun 23:30 UTC + `?member=` on-demand branch, x-vyve-cron-key): scheduled = programme_json days projected onto the week (reuse the projection you will formalise in W5 — write it as `_shared/programme_projection.ts` now, both consumers import it); completed = workouts + cardio rows in week; nutrition = days with nutrition_logs total within ±10% of tdee_target (or macro_override); sign_ins from members.last_seen history if available else count of log-activity rows; messages from coach_messages.
3. `coach-portal.html`: quick-add (+) in the header; dismissable Get-Started card on the cockpit; `coach_profile.calendar_tile = type|name` honoured by the W6 calendar; `archived` on threads list.
4. Verify current chat transport (poll interval, endpoint); decide Realtime for W3.
5. **Video backfill (PM-1067 finding):** `UPDATE coach_exercises ce SET video_url = wp.video_url FROM (SELECT DISTINCT ON (lower(exercise_name)) lower(exercise_name) n, video_url FROM workout_plans WHERE video_url <> '') wp WHERE lower(ce.name)=wp.n AND ce.video_url IS NULL AND ce.partner_id IS NULL` — expect 111 rows; eyeball 10 matches first; member player already resolves `video_url`.

**Verify:** run the snapshot for Calum's client; row appears; on-demand branch returns the same numbers; cron job registered.
**Dean checks:** none member-facing.
**Lewis:** none.

## W1 — Roster + Insights (1.5 sessions)

**Scope:** #62, #63 + #98 thresholds UI, #65, #78, #79, #80, #82, #84.

**Build:** cockpit Insights strip (4 charts over `coach_client_weekly`, 12-week default); auto-tags computed in the roster loader (thresholds from `coach_notification_prefs.auto_tags` jsonb with defaults workout 50/85, nutrition 2/5 days, inactive 7d, not-messaged 7d, not-responded 7d) rendered beside W4b tags with "Message this segment"; Settings › Auto tags page; roster view switcher (Summary / Exercise / Nutrition / Weight / Engagement column sets); multi-select bulk actions; Recent Activities roster feed with event-type filter; Leads inbox "Convert" → wizard prefill + `coach_leads.converted_client_id`; "Booking clients" derived segment + Invite; programme Subscribers panel (click the W3 count badge).

**Schema:** `coach_leads.converted_client_id`; prefs jsonb key only.
**Verify:** minted coach JWT against Calum's roster; segments compute; convert path creates the client and stamps the lead; fixture cleaned.
**Dean checks:** roster views on deanonbrown2; convert a test lead.

## W2 — Automations (1.5 sessions)

**Scope:** #64, #97, #69, #83, #102, #103.

**Build:** migration `tz_w2_auto_messages`: `coach_auto_messages` (partner_id, trigger, offset_days, fire_at_local, channel email|message|both, subject, body, enabled, is_stock) + seed function inserting the #97 stock set per coach on first portal open; `coach_messages.deliver_at`; `coach_clients.lapsed_at`. EF `coach-automations` v1 (cron */15, x-vyve-cron-key): evaluates triggers per active+consented client, ledger-dedupes via coach_notify_log (`auto:<rule>:<member>:<day>`), writes coach_messages (+ scheduled_pushes via the existing trigger) and/or Brevo; delivers `deliver_at`-due rows. Fold coach_automations (plan-change email) into the same Automations view with the existing rows migrated as trigger=`plan_changed`. Threshold alerts: `assignments.alerts` (protected) + branch over nutrition_logs. Lapse: stripe-webhook coaching-rail lapse → `lapsed_at` + coach-notify; member coaching surfaces read the flag. Welcome attachments: `_meta.welcome_attachments[]` (≤4, coach-content bucket) in the add-client wizard + invite email. Client Overview: health connection status RPC + "Ask to connect" firing the stock template now.

**Schema:** above + RPC `coach_client_health_status(email)`.
**Verify:** fixture client with start date backdated → day-3 message fires once, reruns fresh:0; scheduled message delivers at deliver_at; threshold alert fires and dedupes.
**Dean checks:** phone receives an auto message on deanonbrown2.
**Lewis:** stock message bodies [LEWIS COPY PASS] — ship with placeholders flagged.

## W2b — Coach help assistant (1–1.5 sessions)

**Scope:** #112.

**Build:** `playbooks/coach-help-corpus.md` (drafted by Claude from master §6/§7 coaching sections + the two gap maps + these briefs; Lewis tone pass, non-gating) → EF `coach-help` v1 (anthropic-proxy pattern: coach JWT, `partner_type='coach'` via get_my_partner_id, per-coach cap 40/day in coach_notification_prefs, system prompt = corpus with prompt caching, model Haiku by default with a Sonnet flag, refusal rule for non-VYVE topics, optional `{action:'open', route}` in the reply) → portal header help button opening a chat drawer (history in localStorage per coach, first-run suggested prompts: build a programme, add a client, set up check-ins, see what the client sees) → route buttons rendered from actions. Log usage to ai_interactions with `surface='coach_help'`.

**Answer + corpus spec (PM-1071, from Dean's Trainerize transcripts):** reply = one-line acknowledgement → clarifying question ONLY at a real fork (e.g. build for one client vs build in the library, then assign) → numbered steps using the exact on-screen labels → constraints as bullets (unique names, future start, file limits, timing) → related next task → thumbs up/down (logged to ai_interactions `helpful` for corpus repair; replaces their "Did that answer?"). Tolerate typos/shorthand silently. Off-topic: fixed polite refusal naming what it can help with. One idle nudge after 3 min, never more. Their masterclass upsell becomes a route button (`{action:'open', route}`) or a ≤40 s in-portal clip. Corpus = one entry per TASK (not per feature): task name · where (nav path) · steps with real labels · forks + which to pick · constraints · related tasks · deep-link route. First-run suggested prompts: build a programme · add a client · set up a check-in · create a challenge · see what the client sees.

**Cost controls (PM-1070, Dean):** (1) corpus in the system prompt with prompt caching (cached read ≈ 1/10 price); (2) topic gate before the corpus call — Haiku sees the question only (no corpus), returns on_topic|off_topic; off-topic/gibberish gets a fixed refusal string with no corpus call; (3) answer cache keyed on normalised question hash (`coach_help_cache`, 30-day TTL) — repeats are free; (4) input hygiene: max 500 chars, reject empty/duplicate-of-last, 3 s min interval; (5) per-coach cap 40/day + global daily budget in prefs with a `platform_alerts` high row at 80 %. Expected: ≈½p per answered question on Haiku with caching, ≈¼p per refusal, worst case 20p/coach/day.

**Verify:** minted coach JWT: on-topic answer with a route button; off-topic refused WITHOUT a corpus call (assert in logs); cache hit on repeat; non-coach 403; cap trips at 41; budget alert fires at 80 %.
**Dean checks:** ask it three real questions in the portal.
**Lewis:** corpus tone pass (non-gating).
**Rule from here:** every wave's closing checklist adds "update coach-help corpus for what shipped".

## W3 — Messaging depth (1.5–2 sessions)

**Scope:** #68, #76, #77, #71.

**Build:** migration `tz_w3_threads_media`: `coach_threads` (partner_id, kind group|challenge|direct, title, archived, challenge_id nullable), `coach_thread_members` (thread_id, member_email, joined_at), `coach_messages.thread_id` (nullable; NULL = legacy direct thread keyed on partner+member), `attachment_path`, `attachment_kind` (image|file|video|audio), bucket `coach-message-media` (private, 50 MB, image/pdf/mp4/webm/m4a) with read-through-domain-row policy (member reads objects under a thread they belong to; coach reads own prefix). RLS: members select messages where thread_id in their memberships OR legacy direct rows; insert same. Portal: New message → pick clients → "as a group" creates a thread; thread list mixes direct + group; attachments picker; MediaRecorder voice note (webm) upload; Realtime subscription if W0 verified polling. Member coach-messages.html: thread switcher gains group threads, attachment render (signed URL), audio player; recording deferred to the next binary (Capacitor recorder plugin — bank as a binary item).

**Verify:** RLS role simulation: member A in thread sees it, member B not in thread 42501; coach cannot read another partner's thread; signed-URL mint respects membership. jsdom on the portal zone.
**Dean checks:** phone: group thread appears, image attachment renders, voice note plays.
**Lewis:** none (empty-state strings placeholder).

## W4 — Challenges (2 sessions)

**Scope:** #72, #73, #74, #75 (+ challenge threads via W3).

**Build:** migration `tz_w4_coach_challenges`: `coach_challenges` (partner_id, type leaderboard|threshold, name, description, rules jsonb {earn:{workout:5,cardio:2,pb:20,nutrition_goal:10,habit:30,fitness_goal:100}, daily_cap_per_rule:1, threshold:null|int}, starts_at, ends_at, theme, image_path, status draft|live|ended|archived), `coach_challenge_participants` (challenge_id, member_email, opted_in_at, points, rank, passed, last_scored_at; member RLS insert/select own; coach select own challenge; unique). Auto-create a W3 thread kind=challenge on go-live. EF `challenge-score` v1 (hourly cron): idempotent recompute per live challenge from workouts/cardio/exercise_logs (PB via the e1RM history already computed for load_calc)/nutrition_logs vs targets/daily_habits/coach_client_goals; reads `employer_challenges` with the same rules contract where present so employer launches score too. Member: challenges.html "From your coach" / "Your company" block, opt-in sheet (names + points visible to other participants stated plainly), leaderboard view, threshold summit progress, home card hook. Portal: Challenges section (list, wizard: details → rules → theme → invite), live leaderboard, end/archive.

**Verify:** fixture challenge with two members; score EF produces expected points, cap respected, rerun idempotent; non-opted member sees nothing; employer_challenges row scores through the same EF.
**Dean checks:** phone: opt in, see leaderboard, do a workout, points move next run.
**Lewis:** opt-in consent copy on the member sheet [LEWIS COPY PASS].

## W5 — Programme scheduling (2 sessions) — highest value

**Scope:** #81, #85, #99, #104 (+ #89 tags/est-minutes, #84 if not done in W1).

**Build:** `_shared/programme_projection.ts` (from W0) becomes the single truth: given wpc (week_start, programme_json with phases, per-client schedule_overrides, checkin_day) → dated sessions. programme_json contract v2 additive `phases:[{name, weeks:[..]}]`; builder groups week tabs by phase, "+ Add next", "Import phase from…" (copy by value). `assignments.workout_queue` [{template_id, start_on|'on_end'}] (PROTECTED) + coach-provision-client branch (cron 65 or new cron) applying the next template when the active wpc ends → W5 plan-change push. `assignments.gates` += messaging/look_ahead_weeks/reschedule/own_workouts/water_tracker; coach-level `hide_vyve_library`; Settings › Client permissions defaults + per-client overrides. `assignments.schedule_overrides` {date→date moves, skips} (PROTECTED) written by the client Calendar tab drag and, in loose mode, by the member. Client workspace Calendar tab: projected sessions, completion overlay (workouts/exercise_logs), phase markers, "Add next phase" inline, look-ahead shading, completed-in-month counters, drag-reschedule. Member workouts.html: phase name + week-of-phase, look-ahead honoured, strict vs loose behaviour, own-workouts gate on custom_workouts. Roster "Current phase" + "Next phase" columns (W1 view switcher).

**Verify:** projection unit tests (fixtures for 4-week phases, overrides, look-ahead); queue applies on end and fires one push; strict mode leaves a missed session visible in the W0 snapshot; member cannot write overrides in strict mode (RLS/EF check).
**Dean checks:** phone: phase label on workouts, moved session lands on the new day, next phase applies at rollover.
**Lewis:** gate labels + plan-change strings (standing W5 item).

## W6 — Workout types + video pipeline (2 sessions)

**Scope:** #86, #88.

**Build:** programme_json day: `workout_type` regular|circuit|interval; circuit {rounds, rest_between_rounds_s, exercises[{reps|seconds}]}; interval {work_s, rest_s, rounds, exercises[]}. Builder three-type picker at create; circuit/interval editors; standalone rest block. Member player: round counter + timer mode (audible/haptic cues), logging shape for circuits (rounds completed) and intervals (rounds + time). Logs/Review views understand the new shapes. coach_exercises `video_url_alt`, `alt_label`; CC VYVE-library tool: paste CSV / URL list → bulk attach (YouTube unlisted or storage-ingest to bucket) → per-row result; "missing video" filter on the exercise grid; member player picks alt by profile preference.

**Verify:** fixture circuit + interval days render and log; TVS ignores duration-only rounds sensibly; bulk tool on 3 fixture rows then reverted.
**Dean checks:** phone: run a circuit and an interval session end to end.
**Content:** film → ingest (one sitting once footage exists).

## W7 — Nutrition (2 sessions + content)

**Scope:** #90, meal-plan PDF slot, #111 (gated), #87 (gated).

**Build:** migration `tz_w7_recipes`: coach_foods meal rows gain image_path, method jsonb[], prep_mins, cook_mins, servings, tags text[]; VYVE stock rows at null scope (staff-authored via the PM-1029 VYVE library); public-read for members via the existing member-read-through-plan policy plus a direct read on stock rows. Portal: recipe editor (photo upload to coach-content, steps, tags), Assign-to-client → nutrition plan days[]; nutrition slot `attachment_path` for a PDF plan. Member: log-food picker Recipes tab (this is the PM-1063 "My recipes" step — coordinate with that thread so it ships once), recipe card, Log-it, Save-to-My-meals. Then, gated: `coach-ai-draft` EF v1 (kind workout|meal_plan; anthropic-proxy pattern; coach JWT; coaching-tier; monthly cap in coach_notification_prefs) → drafts land in the builders, never auto-assign; portal "Draft with AI" entry points on both builders behind `AI_DRAFT_VISIBLE=false` until Calum says yes.

**Verify:** stock recipe visible to a coach and to a consented member; assigned recipe appears in the member's plan day; AI draft returns a valid template shape and never writes assignments.
**Dean checks:** phone: Recipes tab, log a recipe.
**Content:** ~100 stock recipes drafted from food_products macros → Lewis/Calum approve → seeded.
**Lewis/Calum:** AI drafts go/no-go; recipe copy.

## W8 — Scheduling (1 session)

**Scope:** #92, #93, #94, #96.

**Build:** booking_services `capacity` (default 1), `public`, `self_booking`, `thumbnail_path`; drop `bk_slot_guard` partial-unique → BEFORE INSERT trigger counting live bookings per slot < capacity (keep the friendly-error path in the EF); member slot picker shows places left; coach calendar tile shows roster. Partner-level default availability (`partner_partners.default_availability` jsonb) inherited on service create; "Time off" writes booking_exceptions across services. EF `coach-calendar-ics` v1 (tokenised URL in coach_profile, VEVENTs over coach_events + confirmed bookings + hosted calendar_occurrences). Prospect booking: public service → slot picker on `/lead/<slug>` (Test-Site) → coach-lead-submit v3 writes lead + booking with `lead_id`; requests inbox shows it; #78 Convert.

**Verify:** two bookings on one slot succeed at capacity 2, third refused at DB level; ICS validates in Google/Apple; prospect flow end to end from the public page.
**Dean checks:** book a class from the phone; subscribe the ICS on your Mac.
**Lewis:** prospect-booking public copy.

## W9 — Client workspace depth (2 sessions)

**Scope:** #101, #105, #107, #108, #109, #91, #106 (flagged).

**Build:** Overview header strip (RPC `coach_client_badges(email)` consent-gated); coach_client_goals `kind` + target fields + Upcoming/Current/Past; Insights Dashboard widget grid replacing the Overview static blocks (widgets: compliance dots, schedule, weight, calories, activity, plus sleep/steps behind the #106 flag; widget set in coach_profile); migration `tz_w9_biometrics`: `member_biometrics` (member_email, kind, value, unit, method, logged_at; member RLS own; coach_read via is_coach_of; gdpr row) + member log sheet on nutrition/body pages + coach Progress charts by kind + derived BMI/lean/fat; Review-by-workout session detail (exercise_logs vs prescribed day + feedback); per-habit heatmap; form question types (multi/single select w/ other, paragraph, scale_10) in schema + both renderers + bank additions + palette drag on the wizard Preview. #106: RPC `coach_client_health_daily(email, from, to)` returning steps/sleep/active-energy daily aggregates, gated on `consent_version >= N` where N is the new card version — ship dark.

**Verify:** RLS simulation for every new RPC (consented coach yes, non-linked coach 42501, member own yes); form renderer round-trips the new types on gate + weekly check-in.
**Dean checks:** phone: log a biometric, see it on the coach side; answer a multi-select on a check-in.
**Lewis:** #106 consent card wording + version bump (gates the flag flip only).

## WD — Light-first portal skin (1 session, mockup-gated)

**Scope:** #100.

**Build:** mockup first (three screens: cockpit, roster, client workspace) — white surfaces, green trim on sidebar and topbar, tokens from `tasks/cc-design-system-locked.md`; on approval flip the coach-portal default theme to light, token pass on sidebar/topbar/tab bar, keep the dark toggle. No structural changes. Verify contrast on the compliance colours and the challenge art tiles in light.

**Dean checks:** portal on Mac + phone browser in light; dark toggle still works.

---

## Cross-wave items
- **Binary items banked:** member voice-note recording (W3), any timer/haptic plugin needed for W6 intervals if WKWebView cues prove unreliable.
- **OTA discipline:** W3, W4, W5, W6, W7, W9 all ship member-side code; each ends with "OTA <vbb>" only after Dean's device pass.
- **Alan + Lewis ruling owed:** coach billing model (gap-map header). Nothing in these waves depends on it.
- **Achievements overhaul** (post-trial, Dean's call) absorbs #110 coach badges and the challenge-points vocabulary should be designed to reuse there.
