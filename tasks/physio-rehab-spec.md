# Physio / Rehab product — spec (PM-1207, 12 Sep 2026)

*Source of truth for the physiotherapy product. Written from Dean's afternoon on a Rehab My Patient (RMP) trial account — physio side and patient side (TrackRehab) — plus the demo-library import. Waves live in `tasks/physio-portal-waves.md`. Session brief in `prompts/session-physio-rehab-s2.md`.*

## 1. Why

Physios prescribe exercises and then hear nothing until the patient comes back — or doesn't. VYVE gives the physio adherence and pain trend without chasing, and gives the patient a native app instead of a PDF. Commercial model (Dean, 12 Sep): the physio's patient gets VYVE free for a month of rehab via the partner trial rail, then pays; the physio earns on the existing 50% partner rev share from Gate A. **Lewis owes the trial duration.**

The one-line finding from the RMP review: **their physio side is fine, their patient side is a website with checkboxes** — six-letter access code, no reminders, no notifications, poor on a phone. Our patient side is already a native app with a player, push, streaks and check-ins. That is the product.

## 2. Architecture (locked)

- One portal engine, two faces. `surface='rehab'` plan type, `partner_partners.capabilities {rehab:true}`, sidebar config per capability. A partner with both gets the union.
- **Wave 0 splits `coach-portal.html` (985KB, one file) into a shell + shared modules** (auth, REST, roster, library, messaging) + coaching modules; `physio-portal.html` is a thin page on the same shared modules. Two URLs, two names, zero coaching code in the physio bundle, one engine fixed once. Decision 12 Sep after weighing a straight duplicate (fast, but every shared fix made twice and drift within a month).
- Physio sidebar: Patients · Plans · Library · Templates · Messages · Settings. Nothing coaching-flavoured renders. Copy says physio/patient, never coach/client. Own entry point and name (Lewis).
- Patient side: a **Rehab tab in the app, separate from Body**, visible only with an active plan. Reuses the workout player; new post-session sheet.
- Video for the product = our own recordings on our own storage (`partner-content-play` signed-URL path / R2), never YouTube — see §23.331.

## 3. The plan (unit of work)

Plan name · patient · start date · duration (weeks) · exercises · note to patient · fixed safety-netting paragraph · red flag(s) · monitor selection. Templates are phased and diagnosis-named (RMP: "ACL and Meniscus Tear — Phase 1…5", "Lower Back Pain Facet Joint — Week 1-2"; own / RMP / community tiers).

**Prescription per exercise (rehab, not sets/reps):** hold seconds · repeat N times · perform N times daily · rest seconds · perform N days per week · both sides. New shape on top of `coach_build_program_json` — extend, don't bend the workout one.

**Monitor (chosen per plan, drives the patient's post-session questions).** Five 0–10 sliders with anchored ends:

| Metric | Question | Low anchor | High anchor |
|---|---|---|---|
| Pain | How is your Pain today? | No Pain | Worst Pain Possible |
| Mobility | How is your Mobility today? | I can't move at all | I have full mobility |
| Difficulty | How Difficult was your Session Today? | Easy | Very Difficult |
| Strength | How was your Strength levels today? | Low Strength | High Strength |
| Everyday tasks | How was your ability to do Every Day Tasks? | Unable to do Normal Activities | Fully Able to do all Activities |

Plus free text "anything you want to ask your physio" → existing coach thread. PROMs = same mechanism with a named instrument; leave the slot, don't build.

**Safety netting (RMP verbatim, for Phil to replace, never ship as-is):** "Important: If your symptoms worsen, or change significantly, such as becoming severe pain, sudden weakness, unexplained weight loss, fever, unrelenting night pain, foot drop, loss of bowel or bladder control, visual disturbances, chest pains, difficulty swallowing or speaking, numbness or anything that feels unusual or concerning, or if you have had a fall or trauma and are not improving, it's always best to get checked at A&E/Emergency Department – just to be on the safe side."

## 4. Patient side

- Plan list → plan → today's exercises (date-headed). Per exercise: instruction text, still + video, **done / skipped**, thumbs up/down. Therapist note pops once.
- Once per day: the monitor sliders for the plan's selected metrics.
- **VYVE additions:** push at the prescribed times of day; streak; offline video; the plan is in the app the patient already has — no code, no PDF needed. PDF export kept as a fallback for paper.

## 5. Physio side

Patient list (last activity, name, plans, practitioner, clinic) → plan view with three tabs: **Plan · Tracking · Monitor**. Tracking = exercises done vs skipped, liked vs disliked, over time. Monitor = a line per selected metric. Adherence = sessions done ÷ (times daily × days per week × duration). **Alert to the physio's thread when pain climbs or adherence drops for 2–3 weeks** — the "reach out and rebook" trigger. Thresholds are Phil's.

Delivery options RMP offers (email PDF + code, custom email, SMS credits, WhatsApp, copy, print/download with "attach diary", translate to ~30 languages): ours replaces all of it with the app invite; PDF fallback; translate later via the EF.

## 6. Library

- RMP taxonomy (41 top-level, now applied to the demo rows): S&C, TRX, Face, TMJ, Breathing, Neck, Shoulder, Elbow, Wrist, Hand/fingers/thumb, Lumbar Spine, Thoracic Spine, Pelvic Floor, Hip, Knee, Ankle, Toes, Balance, Cardio, Core, Swiss Ball, Posture, Dumbbell, Exercise Band, Foam Roller, Co-ordination, Pilates, Antenatal Pilates, Spiky Ball, Nerve Glides, Ergonomics, Falls, Senior, Paediatrics, Scoliosis, Yoga, Horse and Rider, Scar Therapy, Lymphatic, Medications, Advice.
- Second axis under body regions: Flexion · Extension · Side Flexion · Rotation · Abduction · Adduction · Stretching · Strengthening · Swiss Ball · Posture · Advice. S&C's second axis is equipment/movement. **Needs a `subcategory` column + sub-filter** (Wave 5).
- Four entry points: Categories · Advice (sheets per region — non-exercise plan items) · Diagnosis (A–Z conditions → curated exercises; how a physio actually browses) · Muscles (A–Z). We have muscles half-covered via `muscle_volumes`; diagnosis is new.
- Per-card "i" = patient-facing instruction (our `cues`, populated for the demo rows).
- AI Plan Generator (RMP Pro add-on): prompt → titled plan with prescription filled. Ours = Anthropic in an EF over the tagged library. Wave 6.

## 7. Demo library (temporary)

4,876 RMP videos as private `coach_exercises` rows on Dean's partner `a23478c8`, `source_slug LIKE 'rmp:%'`, imported from the Composio workbench via the Supabase Management API (`POST /v1/projects/{ref}/database/query`, MGMT_PAT). 5,106 on the channel; 353 marketing clips and 164 same-name re-uploads excluded (`uq_coach_ex_partner_name`). All public and embeddable. Quota: 206 units. Zero plays as of 12 Sep — plays show in RMP's Studio analytics as external embeds with our domain. **Tear down by ~12 Oct 2026** (`DELETE FROM coach_exercises WHERE source_slug LIKE 'rmp:%'`); never build anything that depends on these rows. `partner_id` RLS = only Dean's partner reads them.

## 8. Gates

- **Lewis:** trial duration; product name/entry point; every patient-facing string; multi-practitioner clinic pricing (later).
- **Phil:** safety netting, red flags, monitor wording, alert thresholds.
- **Dean:** schema (talk-first), Cloudflare CC deploy checks, OTA on his word only.

## 9. Parked

Multi-practitioner clinics under one licence (RMP: Practitioners 1/1, clinic settings, letterhead, clinical note templates, WhatsApp/SMS credits, webhook, API keys, import/export). Real for this market; does not fit one-partner-one-coach. Note, don't design around it yet.
