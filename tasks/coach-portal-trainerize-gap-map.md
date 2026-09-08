# Coach Portal — Trainerize Gap Map (PM-1066)

**Session:** 7 Sep 2026 late evening. Dean walked an ABC Trainerize trial account (dean24.trainerize.com, ~85 screenshots, 10 batches) against the live VYVE coach portal (vyve-command-centre HEAD `94f00a63`, coach-provision-client v13, vyve-site vbb 611). This map continues the numbering of `tasks/coach-portal-gap-map.md` (Kahunas, PM-982, #1–#61) so the two read as one list. Nothing here is built. Wave plan: `tasks/coach-portal-trainerize-waves.md`.

**Live state at time of walk:** 1 active coach client, 1 live coach partner + 2 onboarding, one template of each kind, zero private exercises, zero check-in responses, zero coach messages. We are still designing ahead of usage.

**Standing exclusions carried forward (Dean 2 Sep, reaffirmed PM-960, restated 7 Sep):** no coach payment/invoicing/products/sales/disputes/discount tooling; no impersonation ("view as client" parked on the same side); no coach self-serve deletion; no AI-training-consent patterns; no seat pricing artefacts (Pending clients, session credits, add-on tiers).

**Decision item logged for Alan + Lewis (NOT a build item):** whether VYVE should own coach billing via Stripe Connect Express (platform fee on coach transactions) versus today's model (client pays coach outside VYVE; £10/mo coaching rail → £5/mo rev-share). Roughly 3–4 sessions on top of existing Stripe/webhook/payout plumbing plus terms/VAT/refund policy from Lewis. Exclusion stands until ruled.

**Parked (product call, not this pass):** Team (multi-trainer businesses, locations, per-trainer metrics, trainer-to-trainer messaging) — shape noted as `coach_team_members` under a parent partner if a gym ever signs. Two-way Google Calendar OAuth sync (ICS feed first). Coach-created badges (land inside the post-trial Achievements overhaul, not before). Client-view mirror.

---

## Batch 1 — Dashboard, chrome, Messages

| # | Item | Call | Landing |
|---|---|---|---|
| — | Dashboard cockpit, quick actions, recent-activity card, notifications bell | Parity | W1 #1, #7 |
| 62 | **Coach Insights charts** — clients over 12 months, avg sign-ins/week, avg workouts/week, avg exercise compliance | Take | Cockpit strip over the `coach_client_weekly` snapshot (see #98). Compliance = completed ÷ prescribed sessions per week. **SHIPPED W1 PM-1075** |
| 63 | **Auto-tagged segments** — needs-attention / follow-up in one click | Take | Computed system tags (`inactive_7d`, `missed_workouts`, `checkin_overdue`, `new_this_week`, `trial_ending`, `goal_due`, `low/high_compliance`) beside W4b manual tags; "Message this segment" → broadcast. Predicates reuse coach-notify's inactive5/phase_ending. Thresholds in #98. **SHIPPED W1 PM-1075 (`missed_workouts` folded into low compliance)** |
| 64 | **Auto messages** — triggered sequences | Take — headline | `coach_auto_messages` (partner_id, trigger, offset_days, channel, body w/ {{first_name}} etc., enabled) + cron sweep in the coach-notify pattern writing coach_messages + scheduled_pushes. Triggers: activation, program_assigned, days_since_start N, first_workout, N_workouts, first_cardio, first_meal_logged, inactive N, checkin_submitted, goal_reached, birthday, health_not_connected. Folds coach_automations (plan-change email) under one Automations view. Stock default set in #97. **SHIPPED W2 PM-1077** (`coach_auto_messages` + `coach-automations` sweep, cron 71; plan-change cards folded into the view only) |
| 65 | Roster-wide Recent Activities feed w/ event-type filter | Take — small | Lens over coach_client_events (W5 #52). No schema. **SHIPPED W1 PM-1075 (widened the existing Notifications feed)** |
| 66 | Global (+) quick-add: Client / Message / Event / Announcement | Take — trivial | Header button → existing wizard, chat, event editor, broadcast. **SHIPPED W0 PM-1073** |
| 67 | Coach Get-Started checklist | Take — small | Dismissable cockpit card: first client, first programme, check-in form assigned, notifications set. **SHIPPED W0 PM-1073** |
| 68 | **Group conversations** — one thread, many clients | Take | `coach_threads` (kind group\|challenge) + `coach_thread_members` + `thread_id` on coach_messages; member RLS via membership. Challenge threads auto-created (#72). "Send separately" = existing broadcast. **SHIPPED W3 PM-1080 (fan-out rows, §23.243)** |
| 69 | Scheduled / pre-planned messages | Take — small | `deliver_at` on coach_messages, delivered by the #64 sweep. **SHIPPED W2 PM-1077** (`coach_messages.deliver_at`; trigger + member RLS guard; sweep delivers; coach cancel = delete) |
| 70 | Active / archived conversation filter | Take — trivial | Archive flag per thread. **SHIPPED W0 PM-1073 (coach_ui_prefs list until W3 threads)** |
| 71 | Real-time delivery in coach chat | Verify | Supabase Realtime on coach_messages, client-side only. Confirm polling state at build time first. **VERIFIED W0: 15 s poll, table not in supabase_realtime → W3 adds it. SHIPPED W3 PM-1080 (publication + both subscribers, polls kept as fallback)** |
| — | Team, Payments, Sale quick-add, Add-ons, referral/upgrade banners, Academy, hire-an-expert, FitMetrics | Parked / Excluded | See header. |

## Batch 2 — Challenges (+ messaging extras)

Landing note: VYVE has `challenge_library`/`challenge_enrolments` (PM-709, member self-enrol, client-side evaluator) and `employer_challenges` + `employer_challenge_optins` (PM-789, employer launch; **B2 member-side surfacing never built**). A coach challenge is a third launcher over the same shape; building the member side once closes the employer gap. Ruling taken 7 Sep: `coach_challenges` as its own table with an identical rules contract — do NOT generalise `employer_challenges` (Sage-facing production table).

| # | Item | Call | Landing |
|---|---|---|---|
| 72 | **Coach challenges — Leaderboard + Threshold types**, name/description/start/duration, invite clients | Take — headline | `coach_challenges` (partner_id, type, rules jsonb, starts_at, ends_at, theme, image_path, status) + `coach_challenge_participants` (member-RLS opt-in row = consent artefact; named leaderboard is only lawful with explicit opt-in). |
| 73 | **Points rule engine** — workout / cardio / PB set / daily nutrition goal hit / daily habit / fitness goal hit, per-rule points, daily cap, pass threshold | Take — one build with #72 | Server-side `challenge-score` EF on an hourly cron; reads workouts, cardio, exercise_logs (PB = e1RM beats history), nutrition_logs vs tdee/macro targets, daily_habits, coach_client_goals; writes points/rank/passed on the participant row. Idempotent recompute, never increment. |
| 74 | **Member-side challenge surface** | Take | challenges.html gains "From your coach" / "Your company" block above the catalogue: opt-in sheet, leaderboard (opted-in names + points), threshold summit progress. One component serves coach AND employer launches. |
| 75 | Themes + thumbnail | Take — partial | Own upload to coach-content + pick from the 23 `/challenge-art/` tiles. Unsplash dropped. |
| — | Auto-delete 7 days after end | Not taking | Archive + keep results. |
| 76 | **Message attachments** — image / file / video | Take | `attachment_path` + `attachment_kind` on coach_messages, new `coach-message-media` private bucket, read-through-domain-row storage policy. Member upload via the coach-checkins compression path. **SHIPPED W3 PM-1079/1080 (bucket `coach-message-media`, read-through-row)** |
| 77 | **Voice notes** | Take | Coach side MediaRecorder (webm); member playback first; member recording needs a native recorder plugin → next binary. **SHIPPED W3 PM-1080 (coach side + member playback); member recording banked** |

## Batch 3 — Clients + Team

| # | Item | Call | Landing |
|---|---|---|---|
| — | Coaching / Deactivated segments | Parity | invited→active→archived, reactivate. |
| — | Pending (seat-limit parking) | Excluded | |
| 78 | **Prospects → Convert to client** | Take — small | coach_leads + Leads inbox exist; Convert opens the add-client wizard prefilled, stamps `converted_client_id`. **SHIPPED W1 PM-1075** |
| 79 | **Booking-only clients** segment | Take — small | Derived: members with bookings on the coach's services who aren't in coach_clients; "Invite to coaching" action. No schema. **SHIPPED W1 PM-1075** |
| 80 | **Roster column views** — Summary / Exercise / Nutrition / Weight / Engagement | Take | View switcher on the W1 roster; columns from the #98 snapshot (programme, phase + %, phase end, compliance %, weight Δ, sign-ins/week). **SHIPPED W1 PM-1075** |
| 81 | **Programme phases + Next Phase queue** | Take — headline | `assignments.workout_queue` [{template_id, start_on}] (protected key) + cron branch in coach-provision-client applying the next template when the active wpc ends, firing the W5 plan-change push. Portal: Next-phase picker on the Workouts tab + roster column. |
| 82 | Roster multi-select bulk actions — message / tag / archive | Take — small | Checkboxes → broadcast prefill / W4b tags / archive. **SHIPPED W1 PM-1075** |
| — | Team (multi-trainer) | Parked | See header. |

## Batch 4 — Payments

All of Products / Sales / Invoices / Transactions / Disputes / Discount codes / Sales channels / Stripe gateway = **excluded pending the Alan + Lewis ruling** (header). Discount codes = parity via Stripe coupon partner codes (PM-633).

| # | Item | Call | Landing |
|---|---|---|---|
| 83 | **Automatic membership control** — downgrade/deactivate on lapse | Take — small | On coaching-subscription lapse (stripe-webhook), coach_clients row → `lapsed` flag (not archived), coach notified via coach-notify, member coaching surfaces gate on it. Today a lapsed member keeps coach access indefinitely. **SHIPPED W2 PM-1077** (`coach_clients.lapsed_at` sweep-stamped from `members`; `is_coach_of` gates; coach notified; member-side surfaces → W3) |

## Batch 5 — Master Libraries: programmes + workouts

| # | Item | Call | Landing |
|---|---|---|---|
| — | Shared vs Personal libraries, Browse by trainer, programme list, assign-to, copy, week tabs | Parity | PM-1029 null scope; W3 #19–21. |
| 84 | **Subscribers panel on a programme** — roster of clients on it, remove, message the cohort | Take — small | Join over `assignments.workout_template_id`; remove = clear slot; message = broadcast prefill. Pairs with #63. **SHIPPED W1 PM-1075** |
| 85 | **Training phases inside a programme** — named week blocks, + Add next, Import a phase from another programme | Take | Additive `phases:[{name, weeks:[..]}]` on programme_json contract v2; builder groups week tabs under phase headers; member workouts.html shows "Phase 2 · Week 6 of 8"; Import = copy weeks by value. One wave with #81. |
| 86 | **Circuit + Interval workout types** (Regular / Circuit rounds / Interval timer) | Take — headline, unparks Kahunas #24 | `workout_type` regular\|circuit\|interval on day templates; circuit = rounds + exercises w/ reps or seconds; interval = work/rest seconds × rounds. Builder three-type picker; member player round counter + timer mode (W3 duration-typed exercises give the seconds primitive). Standalone rest block folds in. |
| 87 | **AI workout builder** — one prompt → editable draft | Take — gated on Calum | `coach-ai-draft` EF (anthropic-proxy pattern, coach JWT, coaching-tier only, monthly cap) → day template or programme in the builder, never auto-assigned. Engine = the existing onboarding programme generator. Last in the wave order. |
| 88 | **Bulk exercise video attach** (pipeline, not feature) | Take | CC tool under VYVE library: CSV/URL list (exercise id → unlisted YouTube URL or bucket path via storage-ingest) → coach_exercises.video_url in one pass; "missing video" filter on the grid. Two slots from day one: `video_url` + `video_url_alt` + `alt_label` (male/female variant, member picks by profile preference, falls back). **Correction PM-1067:** the `exercise-videos` public bucket already holds 128 VYVE videos used by `workout_plans`; 111 match `coach_exercises` rows by exact name and were never linked — W0 backfills `video_url` by exact-name join (5 min), so the bulk tool is for the ~860 unfilmed rows only. |
| 89 | Workout list rows: thumbnail + est. minutes + tags/folders + filter | Take — small | est. minutes derived from sets × (tempo + rest); tags text[] on coach_templates + chips — verify whether the W3 tags column was ever populated. |
| — | Builder instructions block, supersets, add rest, custom exercise inline, drag from search pane; programme Calendar tab | Parity / fold | W3; rest block → #86; calendar preview → #85. |

## Batch 6 — Exercises, Meals, Foods, Habits, Forms

| # | Item | Call | Landing |
|---|---|---|---|
| — | Exercise library grid/search/filters/custom; male/female videos | Parity / fold into #88 | |
| 90 | **Recipe library** — stock recipes w/ photo, method, per-serving macros, meal-slot tags; assign into plans; client views how-to and logs in one tap; presets swappable | Take — headline (lands on the live PM-1063 "My recipes" thread) | Extend `coach_foods kind='meal'` with `image_path`, `method` (ordered steps), `prep_mins`, `cook_mins`, `servings`, `tags`; macros derived from ingredients via the OFF mirror; VYVE stock set authored at null scope (appears as Shared); Assign pushes into nutrition plan days[]; member recipe card in the log-food picker Recipes tab with Log-it + Save-to-My-meals. Content strand: ~100 stock recipes drafted from food_products macros for Lewis/Calum approval. |
| — | Foods custom + system library; Habits stock bank in pillar folders; Forms list/System/Active/preview/builder | Parity | coach_foods + 148k-row UK mirror; 34 stock habits w/ auto-rules; W2 #38–40. Dean: "our habits look way better". |
| 91 | **Form question types + onboarding bank alignment** | Take — small | Add: multi-select w/ options + free "other", single-select w/ options, static paragraph block, 1–10 scale (keep 1–5 stars). Bank: equipment access, days available, exercise frequency, cardio/experience self-ratings, smoking, injuries free text. Builder polish: palette + drag-to-insert on the wizard Preview step. Same typed renderer both sides (gate + coach-checkin.html). |

## Batch 7 — Scheduling

| # | Item | Call | Landing |
|---|---|---|---|
| — | Calendar month/week, event-type filters, Add menu; availability windows; event-type fields | Parity | W6 #32–33; booking_availability/exceptions; booking_services. Add Day view (trivial). |
| 92 | **Group / class event type** — capacity N, in-person or virtual, self-book | Take | `capacity` (default 1) on booking_services; replace `bk_slot_guard` partial-unique with a trigger counting live bookings < capacity; member picker shows "3 of 10 places"; coach tile shows roster. Thumbnail + explicit `self_booking` toggle fold in. |
| 93 | **Default availability + date-specific overrides + time off** | Take — small | Partner-level default windows inherited by new services; "Time off" range writes exceptions across all services. Virtual-only per window = delivery_mode on the service. |
| 94 | **Google Calendar sync** | Take — ICS first, OAuth parked | Tokenised `/calendar/<partner>.ics` EF over coach_events + confirmed bookings + hosted calendar_occurrences. Two-way busy-time import = OAuth app + DPA line → parked. |
| 95 | Calendar tile display — event type vs client name | Take — trivial | Pref in coach_profile jsonb. **SHIPPED W0 PM-1073** |
| 96 | **Prospect booking** — public consultation slot on the lead page | Take | booking_services `public=true` → slot picker on `www.vyvehealth.co.uk/lead/<slug>`; submit writes coach_leads + a booking keyed on `lead_id` (third door after member_email / employer_name); requests inbox + #78 Convert. |
| — | Session credit | Excluded | |

## Batch 8 — Business + Settings

| # | Item | Call | Landing |
|---|---|---|---|
| — | Business Dashboard | Split | Revenue side excluded; engagement side = #62 and free. |
| — | About / socials; Consultation form selector; Custom client tags; Terms editor | Parity | W7 #48; is_default; W4b; coach_terms. |
| — | Locations, Billing, Team roles, Branding (custom app) | Parked / Excluded | |
| 97 | **Auto-message stock set + onboarding attachments** | Take — extends #64 | Seeded per-coach defaults (ON, editable): first sign-in, day 3/7/14, first workout, first cardio, first meal, birthday (members.dob), connect-health (no member_health_connections row at day 2). Welcome email: `_meta.welcome_pack_path` → `welcome_attachments[]` (≤4 PDFs). Payment-failure messages excluded. **SHIPPED W2 PM-1077** (eleven stock rules seeded on first open; `_meta.welcome_attachments[]` ≤4 via cpc v14) |
| 98 | **Auto-tag thresholds + weekly snapshot backbone** | Take — extends #63 | Settings page: workout-compliance low/high %, nutrition-compliance days, inactivity / not-messaged / not-responded windows (jsonb). Persist `coach_client_weekly` (partner_id, member_email, week_start, scheduled_count, completed_count, compliance_pct, nutrition_days, sign_ins, last_msg_out, last_msg_in, weight) computed Sunday night + on demand. Feeds #62, #63, #80, #107. **SHIPPED W0 PM-1072 (snapshot + EF + cron); thresholds UI SHIPPED W1 PM-1075 (`coach_ui_prefs.auto_tags`)** |
| 99 | **Client permissions** — messaging mode, calendar look-ahead, strict/loose rescheduling, own workouts, water tracker, show/hide VYVE libraries | Take — unparks the rest of Kahunas #46 | `assignments.gates` += `messaging` (two_way\|one_way\|off), `look_ahead_weeks`, `reschedule` (strict\|loose), `own_workouts`, `water_tracker`; coach-level `hide_vyve_library`. Phase-change notify = W5 PLAN_CHANGE_NOTIFY (Lewis copy). Strict mode is what makes #62 compliance honest. |
| 100 | **Portal visual direction — light-first, white surfaces, green trim** | Design item — mockup gate | Coach-portal default-theme flip + token pass on sidebar/topbar using the PM-1006 design-system tokens. Talk-first: mockup before CSS; own short wave. Dean has said it twice. |

## Batch 9 — Client profile + workspace

| # | Item | Call | Landing |
|---|---|---|---|
| — | Profile modal tabs, programme panel, notes, tags, compliance strip, Forms + Compare | Parity | W5 10-tab workspace. Sales/Invoices excluded. |
| 101 | **Overview header strip** — last signed in, last message out/in, totals, recent badges | Take — small | members.last_seen, coach_messages timestamps, workouts/cardio totals; badges via a consent-gated whitelist RPC over member achievements. |
| 102 | **Health connection status + Ask to connect** | Take — small | Status-only RPC over member_health_connections (connected / revoked / never); button fires the #97 connect-health template immediately. **SHIPPED W2 PM-1077** (`coach_client_health_status()` RPC + Ask to connect on the Overview card) |
| 103 | **Threshold alerts per client** — calorie intake ≥ X% of goal; every meal log (15-min cap) | Take — small | `assignments.alerts` (protected key) + coach-notify branch over nutrition_logs vs tdee_target; dedupe via coach_notify_log. Defaults off. **SHIPPED W2 PM-1077** (`assignments.alerts` {calorie_pct, every_meal} via cpc v14; sweep alerts the coach) |
| 104 | **Client calendar** — programme days on real dates, completed vs scheduled, phase markers, Add next phase inline, drag-reschedule, look-ahead, completed-in-month | Take — headline (client workspace) | Projection (wpc week_start + day order → dates), completion overlay, Add-next-phase → #81 queue, drag = per-client `schedule_overrides` honoured by the member player and #62 compliance. Where #81, #85, #99, #62 meet — one wave. |
| 105 | **Goal types** — body weight (target + current, auto-progress), custom, nutrition, water; Upcoming / Current / Past | Take — small | coach_client_goals `kind` (custom\|body_weight\|nutrition\|water); body_weight derives progress from weight_logs; nutrition/water point at tdee/macro + water_goal. Member card shows delta. |
| 106 | Coach view of steps / sleep / active energy / body fat tiles | Take — **Lewis-gated** | Daily aggregates only (never samples) via RPC; NOT in the current data-sharing consent card → wording change + consent version bump + re-consent for existing clients. Build behind a flag. |
| — | Attachments per client; meal plan PDF; client-view mirror; session credits | Fold / Parked / Excluded | Files shortcut on Overview filtered to client; `attachment_path` on the nutrition slot (supplements doc-mode shape); mirror parked (impersonation-adjacent). |

## Batch 10 — Client programme, meal plan, progress, badges

| # | Item | Call | Landing |
|---|---|---|---|
| — | Training Program per client (phases, dates, Add next, Import, per-workout Edit/Schedule/Progress, print) | = #81 / #85 / #104 | Print folds. |
| 107 | **Client Insights Dashboard** — widget grid (compliance dots M–S for workouts/nutrition/habits, schedule, sleep, steps, activity, body weight, caloric intake) + Add widget | Take | Composite of the #98 snapshot + Logs + weight_logs + nutrition_logs; sleep/steps ride #106's flag; widget set is a coach preference. Replaces the W5 Overview's static blocks. |
| — | Weekly Exercise / Nutrition Compliance history (3M–3Y); Progress by habit | Fold | Charts over the #98 snapshot (scheduled_count → empty week renders empty); per-habit heatmap on the Habits tab. |
| 108 | **Biometrics** — body fat, lean/fat mass, BMI, resting HR, blood pressure, body measurements, calipers; time-range charts | Take | `member_biometrics` (kind, value, unit, method, logged_at; member-loggable, coach_read via consent); BMI + lean/fat mass derived; calipers = body fat w/ method; resting HR when the queued HRV/RHR permissions land. |
| 109 | **Review by workout** — tracked sessions, logged vs prescribed sets/reps/load, difficulty + note | Take — small | Session detail view joining exercise_logs to its programme_json day + PM-987 post-workout feedback. |
| 110 | Badges Earned (coach view) + coach-created badges | Split | Coach view = #101. `coach_badges` parked into the post-trial Achievements overhaul. |
| 111 | **Smart Meal Planner** — auto-generate ≤7 days from goal + preferences, client swaps | Take — gated, with #87 | `coach-ai-draft` kind=meal_plan sourcing #90 recipes + food_products macros → editable draft in the W4 day-tabbed plan builder. Needs #90 first; Calum/Lewis call on AI here. |

## Addendum (PM-1068) — Coach help assistant

| # | Item | Call | Landing |
|---|---|---|---|
| 112 | **In-portal AI help assistant** — scoped support bot ("how do I…"), first-run guided paths, off-topic refusal, deep links into the portal | Take — ~1 session + 0.5 for deep links | `coach-help` EF on the anthropic-proxy pattern (coach JWT, partner_type=coach only, per-coach daily cap, prompt caching); corpus = `playbooks/coach-help-corpus.md` drafted from the brain's coach-portal sections + wave briefs, Lewis tone pass; chat drawer in the portal header; refusal for anything not about VYVE coaching; responses may carry `{action:'open', route}` rendered as a button. **Corpus update becomes a closing step of every wave.** Running cost: pennies per question (Haiku + caching); well inside the existing spend line. |

---

## Headline builds (the defining items)
- **#64/#97** auto-message sequences with a stock default set
- **#72–74** coach challenges with server-side scoring + the member surface that also closes employer B2
- **#81/#85/#104/#99** programme phases, next-phase queue, client calendar with overrides, strict/loose — one wave
- **#86** circuit + interval workout types (member player)
- **#90** recipe library on the live My-recipes thread
- **#98** weekly snapshot backbone (feeds #62, #63, #80, #107)
- **#68/#76/#77** group threads, attachments, voice notes
- **#92/#96** group classes + prospect booking on the booking engine
- **#100** light-first portal skin (mockup-gated)

## Content strands (not build waves — run alongside)
- Exercise videos: #88 pipeline ready → Dean/Calum film → one-sitting ingest.
- Stock recipes: #90 → ~100 drafts from food_products macros → Lewis/Calum approve.
- Lewis copy: #64/#97 default message bodies, #106 consent wording, W5 plan-change strings (standing), #99 gate labels.

## Schema touches (consolidated)
- `coach_auto_messages` (#64/#97); `deliver_at`, `attachment_path/kind`, `thread_id` on coach_messages (#69/#76/#68); `coach_threads` + `coach_thread_members` (#68); `coach-message-media` bucket (#76)
- `coach_challenges` + `coach_challenge_participants` (#72); `challenge-score` EF + cron (#73)
- `coach_client_weekly` snapshot (#98); auto-tag thresholds jsonb (#98)
- `assignments`: `workout_queue` (#81), `alerts` (#103), `schedule_overrides` (#104), `gates` += messaging/look_ahead_weeks/reschedule/own_workouts/water_tracker (#99), `welcome_attachments[]` (#97), `lapsed` (#83)
- programme_json contract v2: `phases[]` (#85), `workout_type` + circuit/interval fields (#86)
- coach_exercises: `video_url_alt`, `alt_label` (#88); coach_templates: `tags text[]` (#89)
- coach_foods meal rows: `image_path`, `method`, `prep_mins`, `cook_mins`, `servings`, `tags` (#90)
- coach_forms question schema: multi/single-select options + other, paragraph, scale_10 (#91)
- booking_services: `capacity`, `public`, `self_booking`, `thumbnail_path`; `bk_slot_guard` → capacity trigger; bookings `lead_id` door (#92/#96); partner default availability + time-off (#93)
- coach_client_goals `kind` + target fields (#105); `member_biometrics` (#108)
- Consent-gated RPCs: achievements (#101), health connection status (#102), health daily aggregates (#106, flagged)
