# Coach Portal — Kahunas Gap Map (PM-982)

**Session:** 3 Sep 2026 evening. Dean walked a Kahunas.io trial account (~90 screenshots, 11 batches) against the live VYVE coach-portal (vyve-command-centre HEAD `0fe40063` at time of review). This is the complete numbered gap map for the one-go coach-portal overhaul. Nothing here is built; items reference existing VYVE infrastructure where the landing is already known.

**Standing exclusions (permanent, Dean 2 Sep 2026):** no coach payment/invoicing tooling of any kind — clients pay coaches outside VYVE; £10/mo member rail + £5/mo rev-share is the model. No impersonation ("Switch to Client"). No coach-facing Stripe/PayPal, packages, payment plans, billing tabs, extensions marketplace, or paid add-on tiers.

---

## Batch 1 — Dashboard / clients list / add-edit client

1. **Dashboard assembly** — quick actions (Add Client / Workout / Nutrition Plan), Latest Clients card (package + status + inline edit/message), Latest Check-Ins feed, Latest Messages card. No schema.
2. **Clients list upgrade** — stats strip (Active / Archived / New-7d / Deactivated / New check-ins / New messages / trial-ending-7d as our "Renewing"), full table (avatar, package, last check-in date+day, check-in day, status badges, Actions dropdown), search/filter, list/grid toggle, pagination. No schema.
3. **Add-client 4-step wizard** — Personal Info → Assign Plan → Assign Form → Review & Submit. New fields: phone, weight unit, welcome pack PDF (coach-content bucket, attached to invite), plan start date (scheduled invite send). NO payment fields. Single workout plan only (multi-plan assignment rejected — one live programme = workout_plan_cache contract).
4. **Check-in frequency + check-in day(s)** — `coach_clients.assignments` jsonb extension + member-side read. Only schema touch in batch 1.
5. **Broadcast** — loop-send over coach_messages.

## Batch 2 — Chat / notifications / check-ins / actions

6. **Client Chat two-pane layout** — searchable thread list + conversation pane, New Message → pick client.
7. **Notifications bell popover** — category tabs (check-in / onboarding response / message; no failed-payment tab), mark-all-read.
8. **Client Checkins page** — roster-wide all-checkins feed over coach_form_responses (client, date, submitted-on, check-in day, Actions).
9. **Daily Check-ins grid** — roster × Mon–Sun matrix, per-day status, week-range picker (roster-wide version of PM-961 per-client grid). No schema.
10. **Per-client Actions dropdown** — Resend Registration Email (re-mint coach-join link), Copy Login Details (activation link), Edit Client (wizard edit mode), Delete → soft archive. NOT taking: Switch to Client (impersonation), Reset Password (member owns auth), Cancel Membership (payment-adjacent).
11. **Sidebar IA** — nested submenus (Clients → All / Check ins / Daily Check-ins; Nutrition → Plans/Days/Meals/Foods/Supplements; Forms → Initial Questionnaire / Check In Form / Daily Habits / Terms & Conditions). Nutrition hierarchy data-model question parked to build time.
12. **Sidebar footer** — T&Cs + Privacy links, dark-mode toggle in header cluster. Trivial.

## Batch 3 — Nutrition

13. **Nutrition plans list** — computed macro rollup per row (P/C/F + kcal badge), Actions (Edit / Duplicate / Assign-to / Deactivate / Delete).
14. **HEADLINE: nutrition plan preview page** — day tabs, meals as sections, per-ingredient rows (food, qty, unit, per-item kcal/P/C/F), meal totals, day totals, meal notes. Ingredient-level composition on off-proxy v10 + nutrition_common_foods (same engine as member food log).
15. **Shopping-list generation** from plan ingredients (cheap once #14 exists).
16. **Meals as reusable library** (take). Days folded into plan editor, not a separate library (full Foods→Meals→Days→Plans hierarchy over-engineered). Judgement at build time.
17. **Foods page** — coach-scoped private food library over nutrition_my_foods/common_foods pattern.
18. **Supplements under Nutrition IA** — add-flow choice modal (Create vs Upload PDF/Excel), Timings field (Night/Day), rich-text notes. Confirms backlog "supplements text/PDF mode" shape.

## Batch 4 — Workouts

19. **Workout Programs list** — clients-assigned count badge (join over coach_clients assignments), copy/duplicate, assign-to from list, relative last-edit, type/days/tags columns.
20. **Quick-view side panel** (eye icon) — day dropdown + volume badges + exercise list w/ thumbnails.
21. **Program preview page** — day tabs (Push A / Pull A / …), drag-reorder handles, letter badges, thumbnails, sets/reps/rest/notes; clean read-only preview, drag-reorder in edit.
22. **HEADLINE: Total Volume Sets** — computed per-day muscle-group set volume (e.g. "Chest 10, Front Delts 9.5, Triceps 11"), fractional secondaries (primary=1, secondary=0.5). Needs muscle-group metadata on exercise library: enrich 876 stock rows from free-exercise-db primary/secondary in one pass; coach uploads get a picker. ONE BUILD with #27.
23. **Workouts library** — single-day workouts as first-class list (surface existing day templates).
24. **Circuits — PARKED**; needs product call (timed rounds vs sets×reps) before data model.
25. **Exercise thumbnails in list rows** — presentation only (VYVE video stills + free-exercise-db photo fallback).

## Batch 5 — Exercise library

26. **Exercise library as browsable card-grid page** — demo image, tag chips (body part / muscle / +N), View Exercise, search + filter.
27. **Create-exercise modal w/ Body Part + Volume allocation repeater** ("Another body part") — metadata powering #22. Data model: `muscle_volumes` jsonb on exercise rows.
28. **Default prescription** (sets/reps/rest) on library row, prefilled when dropped into a workout.
29. **Exercise type: Sets & Reps vs time-based** — moderate ripple into member player/logging; ties to #24.
30. **Alternative-exercise linking** — coach-curated swap options (picker modal); makes member exercise_swaps guided. Cheap differentiator.
31. External video sources (Vimeo/YouTube) — already parity, nothing to take.

## Batch 6 — Calendar / content library / packages

32. **Calendar full grid** — Month/Week/Day/List toggles, prev/next/today (upgrade from calendar v1 external-link only; booking engine + coach events back it).
33. **Event types + colours** — Appointment/Event/Goal/Task/Reminder/Call/Other, filterable, custom colour, optional client link, send-notification toggle (rides push spine), all-day flag. Small `coach_events` table.
34. **Requests inbox on calendar** — pending booking requests w/ count badge; closes coach side of "client self-booking" backlog item.
35. **Content Library** — folders, file upload (pdf/xls/docx/mp4/mov/avi/mp3), three types: File / Editor (rich-text authored) / YouTube-Vimeo. Needs `coach_content_items` + member viewing surface; coach-content bucket exists. Fills last SOON pill.
36. **Content access assignment** — map Kahunas package+drip to: all-clients / specific-clients + optional delay-from-start drip (take drip, drop package layer).
37. **EXPLICIT EXCLUSION: Packages/payment plans entirely** (list, one-time vs recurring, price, visibility, payment-plan wizard, Links/Preview). No VYVE equivalent by design. Only salvageable fragment (client-count-per-thing display) covered in #19.

## Batch 7 — Forms section

38. **Initial Questionnaire management page** — Default toggle + Status toggle per form, created/updated, Actions. Gaps: `is_default` flag (auto-assigned in add-client wizard) + active toggle; partial unique index per coach per kind.
39. **4-step form wizard with pre-filled question bank** — Set Up (title + tick-to-include stock questions: Weight/Waist/Height/Age/Diet detail/Allergies/Supplements/Years training/Current workouts/Goal physique/Medical issues/Anything else/Current photos) → Add Additional Question (Yes/No gate + repeater: text, answer-type, required) → Preview (drag-reorder, per-question type Number/Short/Long/Metric + required) → Save & Publish. Takes: stock question bank as seed data per kind (no schema), staged wizard UX over our single-page builder.
40. **Check-in form wizard, same pattern** — check-in bank (diet last week, stuck to diet?, feel/wellbeing, photos front/back/side, video uploads, anything else, Add All) + collapsed **Progress Tracking Questions** section → `section` field on questions, grouped rendering member-side. "Metric" type = our number-with-unit (already have).
41. **Daily Habits as Forms-section page** — lens over typed habits (PM-961): habit-template list the coach assigns. IA + template-list wrapper, not a new engine.
42. **Terms & Conditions under Forms** — `coach_terms` exists; gap is IA placement + default/status toggle parity. Near-zero.

## Batch 8 — Habit wizard / T&C template

43. **Daily Habit form wizard** — pre-filled habit bank (Drink 2L water / 10k steps / Meditate 10 min / 10 min sunshine / Add All), collapsed Progress Tracking section, **"client adds a daily note" toggle** (note column on habit completions — small member-side addition). Additional-question step reuses repeater.
44. **T&C creator with starter template** — "use my own" vs "create for me" choice modal dropping a full boilerplate coaching T&C (intro, acceptance, services, responsibilities, payment, confidentiality, liability, IP, termination, governing law) with [Your Business Name] placeholders. Static seed text, not AI. Keep the Payment & Fees section (coaches charge outside VYVE) but wording must never imply VYVE processes payment. Placeholder-substitution from coach profile at build time.

## Batch 9 — Coach configuration

45. **Coach notification preferences** — per-event Email/Push toggles (workout completed / checks in / message / daily habits / cardio / phase-ending "5 days before + day before"), daily check-in notification time, inactive-5-days nudge. `coach_notification_prefs` jsonb consulted before send; phase-ending scheduled alert = new cron vs plan end dates; inactivity digest = cron over last-activity. "Payment received" excluded (#37).
46. **Coach-level member-feature toggles (SLIM version)** — Kahunas has global unit prefs, nutrition logger on/off w/ per-client exclusions, micronutrients, verified-foods-only, water tracker, client-metrics visibility, load calculator. VYVE take: coach-controlled feature gating **per client** (assignments jsonb) for coaching-tier members only — nutrition-plan visibility, habit note, exercise-library access, goal-submission (see #61). NOT taking global unit overrides (fights member-first model). Full matrix parked.
47. **Load calculator** — member-side e1RM estimate per exercise from exercise_logs history, coach-toggleable per #46. Low priority, cheap.

Not taking from batch 9: Stripe Connect/PayPal tabs (#37 family), DNS/custom sending domain (all email rides Brevo under vyvehealth.co.uk), Video lib global settings (a "hide VYVE demo library" toggle could fold into #46 if ever wanted).

## Batch 10 — Coach profile

48. **Coach profile — public-facing fields** — photo, name, username, phone, web address, FB/IG, logo, About, Services offered, Target customer, Welcome video, **profile-completion % bar**. Closes "coach profile editing" backlog item; fields surface on member-side coach card + invite/apply page. `coach_profiles` extension + coach-content bucket for media.
49. **Coach account tab structure** — Overview / Settings / Data Consent lens. Data Consent = slim static page showing what client data the coach sees + consent basis, aligned with partner agreement. NOT taking: Billing tab, Extensions marketplace (Group Chat/Zapier/Team Members paid add-ons), self-serve Delete Account (offboarding stays admin/CC action), "AI Training Consent" checkbox (contradicts VYVE posture — no training on member data).

## Batch 11 — Client detail view

50. **Client header strip** — avatar, payment badge, contact, Last Active + quick-action icon row (water, stats, chat, goals, notes, message, edit), editable stat tiles: check-in day, package, total weeks, start weight, current weight (w/ delta), age.
51. **Client detail tab IA** — Dashboard / Checkins / Gallery / Q&A / Nutrition / Supplements / Workout / Calendar / Daily Habits / Logs (Billing excluded). Restructure of single-page client detail; Gallery = check-in photos (photo compare exists), Q&A = onboarding response viewer.
52. **Client dashboard tab** — Activity log timeline (plan added / Q&A completed / check-in submitted, timestamps + search; coach-scoped persistent event feed — we emit most already for notifications, needs persistence + per-client filter), **Client Notes** (coach-private free text on coach_clients), Latest check-ins list, Client Data latest-entry card (weight w/ % delta badge).
53. **Check-in history as metric-columned table** — one row per check-in, one column per typed form question (weight, waist, hip, biceps, thighs, sleep, diet adherence, water, workout rating, stress, energy, mood), column-settings gear, per-row actions, green status dot. Columns derivable from form schema (PM-961/963 typed questions). Tabular sibling of "check-in metric charts" backlog item. Strong take.
54. **Contextual check-in-day banner** — "Next Tuesday … is client's check-in day" toast on client open. Cheap once #4 exists.
55. **Q&A tab** — onboarding response viewer w/ Edit Answer / Reset Q&A / Download (PDF export via existing PDF pipeline + coach-content bucket).
56. **Per-client goals with countdown** — goal name, target date, notes, "enable countdown for client" toggle (member sees days-to-goal on dashboard). Small `coach_client_goals` table. Cheap differentiator.
57. **Coach-set water goal per client** — daily litres override for coaching-tier members (assignments jsonb); member water tracking exists.
58. **Logs tab** — coach view of member raw logs: Nutrition (kcal/P/F/C/micro per day + status + comments), Workouts, Cardio, Water, week pager. Consent-gated lens over existing member tables; RLS already consent-shaped.
59. **Progress modal with period compare** — Start / End / Average / Current + % change, All Time/Year/Month/Week. Derived from weight_logs/check-ins; pairs with #53.
60. **In-page chat popover** — floating chat widget on client detail reusing coach_messages. Low cost, high daily use.
61. **Edit-client wizard extras** — welcome pack PDF upload, weight unit, "allow client to add goal/competition" toggle, "give client access to full exercise video library" toggle. Per-client gates → fold into #46.

---

## Headline builds (the expensive/defining items)
- **#14** ingredient-level nutrition plan preview (+#15 shopping list, #16 meals library, #17 foods page)
- **#22 + #27** muscle-volume metadata on the 876-row exercise library + Total Volume Sets (one build)
- **#39/40/43** form wizard pattern with pre-filled question banks (one wizard component, three kinds)
- **#51–53** client detail tab restructure + metric-columned check-in table
- **#35–36** content library + drip assignment
- **#32–34** calendar full grid + coach_events + requests inbox

## Parked / product calls needed
- #24 circuits (timed rounds vs sets×reps)
- #11 nutrition IA hierarchy depth
- #16 meals-vs-days library split
- #46 full feature-gate matrix (slim version specced)

## Schema touches (consolidated)
- `coach_clients.assignments` jsonb extension: check-in frequency/day, water goal, per-client feature gates (#4, #46, #57, #61)
- `coach_clients.notes` (#52)
- `coach_forms.is_default` + active toggle + question `section` field (#38, #40)
- `coach_events` table (#33)
- `coach_content_items` table (#35)
- `coach_client_goals` table (#56)
- `muscle_volumes` jsonb on exercise rows + one-pass free-exercise-db enrichment (#22/#27)
- habit completion `note` column (#43)
- `coach_notification_prefs` jsonb (#45)
- `coach_profiles` fields (#48)
- Coach-scoped activity event persistence (#52)
