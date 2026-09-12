Load VYVE brain. Then read `tasks/physio-rehab-spec.md` and `tasks/physio-portal-waves.md` from VYVEBrain — it's the full write-up from the session where we imported the Rehab My Patient library and I walked you through their product end to end. What follows is the short version so you have it in your head before the brain lands.

## Where we are

Last session (PM-1207) I decided to test a physio product with a PT partner before committing to it. To do that with no spend, we pulled Rehab My Patient's YouTube channel — 5,106 videos, all public and embeddable — into my demo partner `a23478c8` as 4,876 private `coach_exercises` rows (`source_slug LIKE 'rmp:%'`), categorised to RMP's own 41-name taxonomy. That surfaced a latent bug: the coach portal loaded the exercise library in one call capped at 1,000 rows, so I patched it to page (CC `fc3ba427`). The demo rows are a demo: they're someone else's content, YouTube's API terms give stored metadata a 30-day life, and the product ships on videos we record ourselves. Tear-down date is around 12 October. Don't build anything that depends on them.

I then spent an afternoon on an RMP trial account, physio side and patient side, and screenshotted everything. The spec file has the detail. The one-line finding: their physio side is fine, their patient side is a website with checkboxes that doesn't work on a phone, no reminders, no notifications. Our patient side is a native app that already has a player, push, streaks and check-ins. That's the product.

## What I want built

A rehab product for physiotherapists. The physio gets a rehab plan builder in the Command Centre on the coach-portal chrome — the architecture we already locked: `surface='rehab'` plan type, `partner_partners.capabilities {rehab:true}`, one portal with a rehab sidebar config. The patient gets a Rehab tab in the VYVE app, separate from Body, only visible when they have an active plan. The loop between them is the point: the patient does the session, answers the monitor questions, and the physio sees adherence and pain trend without chasing.

Commercially it rides rails we have: the physio's patient gets VYVE free for a month via the partner trial campaign, then pays, and the physio earns on the 50% partner rev share from Gate A. Lewis still owes us the trial duration.

## The shape of it — locked from the RMP review

The plan is the unit. Plan name, patient, start date, duration in weeks, the exercises, a note to the patient, and a fixed safety-netting paragraph (that copy is Phil's and Lewis's, not ours — leave a placeholder).

Each exercise carries a rehab prescription, not sets and reps: hold seconds, repeat N times, perform N times daily, rest seconds, perform N days per week, both sides yes/no. That's a new shape on top of what `coach_build_program_json` does today — extend it, don't bend the workout one.

Monitor is chosen per plan. Five checkboxes at creation — Pain, Mobility, Difficulty, Strength, Everyday tasks — and they define the post-session questions. Each is a 0–10 slider with anchored ends: "No Pain / Worst Pain Possible", "I can't move at all / I have full mobility", "Easy / Very Difficult", "Low Strength / High Strength", "Unable to do Normal Activities / Fully Able to do all Activities". Plus a free-text "anything you want to ask your physio" that lands in the existing coach thread. PROMs are the same mechanism with a named instrument — leave the slot, don't build it.

Per exercise the patient marks done or skipped and can thumbs-up/down it. Per day they answer the monitor sliders once. Tracking on the physio side is done-vs-skipped and liked-vs-disliked over time; Monitor is a line per metric. Adherence is sessions done against times-daily × days-per-week × duration.

Delivery is where we beat them. RMP does PDF by email, SMS credits, WhatsApp, print and a six-letter code. Ours: physio adds the patient, patient gets the VYVE invite with the trial applied, opens the app, Rehab tab is populated. PDF export stays as a fallback for someone who wants paper. Push at the prescribed times of day. A notification to the physio when pain climbs or adherence drops for two or three weeks — that's the "reach out and rebook" trigger.

The library needs two things from RMP's model we don't have: a second axis under body regions (Flexion, Extension, Rotation, Stretching, Strengthening, Advice) — a `subcategory` column and a sub-filter — and a diagnosis-led way in, which is how a physio actually browses. Advice sheets as non-exercise plan items and an AI "describe the patient, draft a plan" button are both real and both later.

## How I want this session to run

Wave 0 is the portal split: `coach-portal.html` becomes a shell plus shared modules (auth, REST, roster, library, messaging) and coaching modules, and `physio-portal.html` is a thin page on the same shared modules. No behaviour change for Calum, proven byte-for-byte on the CC. I chose this over a straight duplicate because every shared fix would otherwise be made twice. One to two sessions; then Wave 1.

Wave 0 first — the portal split — then the mockup, per our rule. Three screens, clickable, no schema, no code paths: the rehab plan builder in the CC, the patient's Rehab tab with a session and its post-session sheet, and the physio's patient view with Tracking and Monitor populated from a fortnight of made-up data. Dark first, on the CC design tokens. I'll put it in front of the PT and I'll put it in front of Lewis. If it lands, the rest of this session is schema and the builder; the app side and the physio tabs are Sessions 3 and 4. Estimate three sessions to a working loop.

Talk-first on the schema before you write a migration. Any vyve-site change goes to main for my dev shell first; OTA only on my word. CC changes need my Cloudflare deploy check. Nothing member-facing ships without Lewis on copy, and nothing clinical — safety netting, red flags, monitor wording, thresholds that trigger a physio alert — without Phil.

Multi-practitioner clinics (one licence, several physios) is real for this market and doesn't fit our one-partner-one-coach model. Park it, note it, don't design around it yet.

Default decisively, one recommendation, and push back if I'm wrong. Let's go.
