# Cardio / Running Plan — rebuild wave map (PM-1237)

**Trigger:** "running wave N" / "cardio running plan" / "start running wave N"
**Opened:** 13 September 2026, from a full teardown of Runna (web onboarding + paid app, Dean's 7-day trial).
**Status:** **Waves 0 and 1 shipped 13 September 2026 (PM-1239, PM-1240, corrected PM-1241); Wave 2 part 1 shipped (PM-1244)** — schema, pace engine, template catalogue and variable plan length are live, server only, nothing member-facing. Plan lengths now: 5k 6–20 weeks, 10k 8–24, general training 4–26, start-running fixed at 9. **Wave 2 part 2 mockup shipped PM-1245** (`docs/mockups/running-wizard-mockup.html` in vyve-command-centre, twelve screens, nothing built) — the build is gated on Dean's reaction, Phil's injury wording and Lewis's strings.
**Owner gates:** Lewis — all member-facing strings + trial/entitlement framing. Phil — the injury-history question, its consent wording and anything that adapts training on an injury answer. **Calum Denham fronts the plans (PM-1242, Dean's call) — his name is the member-facing coach voice, but he does not author or review the periodisation; he reads the catalogue once and confirms he is happy to carry it. A CiRF-qualified review remains the stronger option and is still open.** *Corrected PM-1241: this was originally Calum's gate. He is a PT, not an endurance coach; CiRF is the off-track award that actually covers planning and mesocycles. Calum owns the strength work that runs alongside, where the evidence is strongest (~50% reduction in overuse running injury from strength training, 26-RCT meta-analysis) and where he is qualified.*

---

## 0. Scope — what this replaces, and what it must not touch

Dean, 13 Sep 2026: **this replaces the running-plan area and nothing else.** Any session that finds itself widening past this list should stop and ask.

**Replaced (and only at Wave 3, never before):**
- `running-plan.html` — the member-facing surface. **Soft-kill only:** unlinked from the Body stream and script loads, file kept in the repo, restorable in one line. Never deleted.
- The `anthropic-proxy` call made *from the running path*. The EF itself stays deployed and unchanged — other features call it.
- `running_plan_cache` (the 5,376-combination parametric AI cache) and `member_running_plans`. Both stay live and untouched until Wave 3 ships a working replacement; new work lands in new tables alongside them, so the current feature is never half-broken.

**Explicitly untouched:**
- `cardio.html` and `cardio-history.html` — cardio logging carries on exactly as it is.
- Nav, bottom bar, Home. The running plan lives **inside Body (`exercise.html`) as a stream**, the same pattern as Physiotherapy (PM-1213). No new tab, no Home change.
- Workouts, habits, Mind, Connect, sessions, nutrition, coaching, partner and employer surfaces: all out of scope.

**The one deliberate crossing, called out so it is never a surprise:** at **Wave 4**, ticking a plan session complete writes a row into `workouts` / `cardio` with a source tag, so a run counts toward streak, charity and achievements like any other activity. This is an insert through the existing promotion mechanism (the same one HealthKit rows already use), not a schema change to shared tables — but it does mean completed plan sessions appear in a member's existing totals. Intended. Note the PM-150 rule: caps apply to `source='manual'` only, so promoted rows bypass them.

**One pointer moves, at Wave 3:** members with `members.exercise_stream = 'cardio'` currently land on `running-plan.html` and would land on the new surface instead. Single value, reversible.

## 1. Why we are rebuilding

`running-plan.html` → `anthropic-proxy` → `running_plan_cache` (parametric AI cache) → `member_running_plans` produces a plan you **read**. It is slow (an AI call on the critical path), it is prose rather than data, it has no end condition, it never adapts, and nothing downstream can consume it. Dean's call: running was good when it was the first thing built and has been overtaken by everything we have learned since.

The target is not Runna parity. Runna does one thing and does it with a full team. The bar is: **a member opens Body → Running, and it feels like a premium product rather than a generated document** — close enough that the comparison flatters us, inside a platform that also does Mind, Connect, habits, nutrition, live sessions and coaching for the same £20/month that Runna charges £15.99 for running alone.

## 2. What Runna actually does (observed, not assumed)

**The plan is not generated per member. It is a curated template library, parameterised.** Their "General training" goal does not build anything — it *recommends* ("Dean, based on your responses, we recommend: Run Faster Plan") and opens **All Plans**: a filterable catalogue of named templates, each with a week range and a target distance — parkrun Improvement (6–26wk · 5km), 5k Improvement (8wk · 5km), Get Fit (6–26wk · 5km), New To Running (6–26wk · 5km), 10k (10wk), 10 Mile (12wk · 16.09km), Half Marathon (12wk · 21.1km), Hilly Half Marathon, Functional Fitness (8wk · 8km), Hyrox (8wk · 8km), Sprint/Olympic/Half Iron Tri. The wizard picks a template and fills in dates, days and paces.

**The onboarding is ~14 single-question screens, ~2.5 minutes, every answer an enum or a number.** DOB → goal → ability → gender → injury history → (race path: distance → terrain) → current race time → projection → days per week → days available → long-run day → start date → plan length → race day → units → recap → generate. Nothing free-text. Nothing an AI needs to interpret — which is exactly why the plan appears instantly.

**Three screens do the real work.** *Ability* is self-select but anchored to objective definitions ("can complete 5km without stopping in under 60 minutes"), and on the marathon path selecting Beginner reveals a conditional redirect to the Run a First 5k goal. *Current race time* (5km/10km/Half/Marathon toggle) is the single number everything is computed from — and in the app's Manage Plan they ask for **two**: a shorter and a longer distance, "for more accurate paces". *Injury history* carries its own not-medical-advice disclaimer, an explicit processing-consent line and a "Prefer not to say" option.

**Derived knobs are named and shown back.** After the wizard: Training Volume "Steady", Difficulty "Balanced", flagged "Adjusted for your injury history", editable later under Manage Plan. Answers never become a plan directly — they set a small parameter set, and the parameters drive the engine.

**The recap screen is the personalisation moment.** "Your plan is nearly ready" bullets every input back (estimated 5km time, available days, long-run day, start date, runs/week, current mileage, terrain) with Generate and Advanced Settings. Generation itself is 13 seconds of Olympian photography and "Designed by expert coaches, built for you" — theatre over a computation that is not 13 seconds long.

**Session structure — the thing we needed.** Blocks (**Warm-Up / Session / Cool Down**), numbered steps, each step a distance plus a pace target or limit, rest steps inline, each tagged RUN or REST, with an **Outdoor / Treadmill** toggle on the session:

```
Warm-Up   1  0.75mi at a conversational pace — no faster than 9:50/mi          RUN
Session   2  1mi at 9:10/mi                                                    RUN
(2-3)     3  1mi at 8:30/mi  ·  90s walking rest                               RUN / REST
Cool Down 4  0.75mi at a conversational pace — or slower!                      RUN
```

Session names are template names, not descriptions: "Over and Unders Miles", "Broken Miles", "Rolling 800s", "Progressive Long Run", "Easy Run". Week view is a training calendar with per-week totals (Week 1 8.8mi, Week 2 18.8mi, Week 3 20.8mi), per-day cards colour-coded by session type, "Add" on empty days, and a per-week **Reset**. Plan header: Total Weeks 0/16, Total Distance 368mi, Manage Plan, and **Estimated Race Times "in 16 weeks: 3:49:00–3:59:00"**.

**Pace framing worth stealing verbatim in spirit:** "No faster than 9:50/mi. **This is a limit, not a target** — run at whatever pace feels truly easy."

**Where AI actually sits in their product:** a timed-release **Personalised Workout Briefing** ("available in 6h 13m", "Why does this session matter?"), a post-session question on the next session's card ("How consistent was your pacing last time?"), and a named coach note (Ben Parker, Founding Coach). Narration, not generation.

**Their tabs are Running / Strength / Yoga / Pilates / Stretch & Stability.** They have already moved onto our ground; the answer is not to out-run them, it is that a runner buying Runna plus anything for mental health is already past £30.

## 3. Architecture decisions (locked unless Dean says otherwise)

- **Deterministic engine, no AI on the critical path.** Templates + parameters + maths. Plan appears in well under a second. AI earns its place in briefings, explanation and adaptation copy only.
- **Curated template library, authored by Calum.** Not per-member generation. A finite, reviewable set is the only version that is clinically and commercially defensible, and it is a far smaller build.
- **One fitness number drives every pace.** Race time → fitness score (Riegel / VDOT-class conversion) → five pace bands (easy, long, tempo/threshold, interval/VO2, rep). Sessions reference a **band**, never a hard figure, and bands are stored as ranges.
- **Two race times when we have them.** Short + long fits the curve far better than one; the second is optional.
- **Pre-fill, don't interrogate.** For members with a live `member_health_connections` row we estimate current weekly mileage, longest run and a 5k-equivalent from the last 90 days of HealthKit / Health Connect and present them as editable — "we worked this out from your last 12 weeks". Runna cannot do this at signup. This is our single biggest onboarding advantage and it is aimed exactly at the beginner-to-intermediate members we actually have.
- **Effort fallback.** Pace targets assume flat ground and decent GPS. Every session carries a heart-rate / effort alternative as a member-level setting from day one, not bolted on later.
- **Steps are the contract.** The step schema is written so a session can be translated into an Apple WorkoutKit composition or a Garmin Training API workout without a rewrite. We are not building either yet; we are not going to design ourselves out of them.
- **No in-app GPS tracking in v1** (see Wave 7). Completion comes back through the health pipeline we already run.

## 4. Waves

### Wave 0 — Schema + pace engine (server, no UI) — **SHIPPED 13 Sep 2026, PM-1239**
Eight tables: `run_plan_templates`, `run_session_templates`, `run_template_steps`, `run_template_weeks` (catalogue, authenticated-read where `is_active`) and `run_member_profile`, `run_member_plans`, `run_member_sessions`, `run_member_steps` (own-rows RLS on `auth.email()`, all registered `purge` for GDPR erasure). Engine is **`run-engine` v3** — pure TypeScript, no AI, no I/O in the maths: VDOT from one or two race times (blended 0.4 short / 0.6 long), five bands as fractions of vVDOT, Riegel equivalents, template + params → dated session set. Actions `health` / `profile` / `build` / `persist`; gated on `x-vyve-internal-key` (resolved via the `vyve_internal_key()` RPC — §23.346) or a member JWT.

**Conventions locked here:** everything stores SI (metres, seconds, seconds per km — miles are display only); plan `mode` is `block` or `rolling` with `end_date` nullable, so the General-training question below is a per-template flag rather than a schema change; steps carry a band reference **and** a resolved pace snapshot, so re-baselining at Wave 6 rewrites paces without touching structure; run days are spaced evenly *forward* from the long-run day so any unavoidable back-to-back falls after it, not before (4 runs + Sunday long → Mon/Wed/Fri/Sun).

**Proof:** two identical `build` calls returned byte-identical responses (md5 `3b31b4b8`, 23,977 chars); unauthenticated and wrong-key calls 401; `persist` wrote 1 plan / 24 sessions / 57 steps and was cleaned to zero residue; RLS proven by claims simulation. Fixture template `fixture-5k-improver` and its four session templates are `is_active=false` and exist only for the determinism harness. `member_running_plans` and `running_plan_cache` untouched and still serving.

### Wave 1 — Template library + authoring — **SHIPPED 13 Sep 2026, PM-1240; CORRECTED PM-1241**
Four plan templates, all `is_active=true`: **`start-running`** (8wk × 3 days, run/walk, beginner, five short runs to 30 continuous minutes) · **`general-training`** (`mode='rolling'`, a 4-week cycle authored out to 12 weeks, 3–5 days, all levels) · **`5k-improver`** (8wk, 3–4 days) · **`10k-build`** (10wk, 3–5 days). Seventeen session templates: Easy Run, Recovery Run, Easy Run + Strides, Long Run, Progressive Long Run, Threshold Blocks, Broken Miles, Over and Unders, Rolling 800s, and eight weekly run/walk progressions. 166 week rows, 61 step rows. Marathon and half deliberately absent — the member base is beginner/return-to-running.

**The three open decisions, closed.** General Training is **rolling**, not a fixed block. Calum's authoring surface is a **seed migration plus a rendered review sheet** (`docs/running-catalogue-review.html`), not a CC page — build the editor only if the catalogue proves it churns. And the first catalogue is a **Claude draft pending Calum's sign-off**: `coach_name` is NULL and `authored_by` reads `claude-draft PM-1240`, because waiting on a batch that had not arrived would have parked the wave.

**Corrections applied PM-1241, after a literature audit of the first draft.** The pace bands were a units error (Daniels' %VO2max used as %velocity) and are now accurate to his published table; the `long` band is retired to easy pace; Daniels' per-session quality ceilings are enforced in the engine with time floors for low-mileage weeks; and **Start Running was re-authored on the NHS Couch to 5K 9-week structure** after the 8-week draft was found to jump from 2 × 10 min with a walk break straight to 25 minutes continuous. See §23.349.

**Authoring rules, binding on every future template.** A repeated effort is a named distance and never scales (§23.348) — progression in a quality session comes from swapping the template or trimming the rep count, never from stretching the rep. **Quality volume is capped by the engine, not the author**: write the session at its full intended shape and let the build trim it to the week it lands in. **Day slots are a priority order**: a member on fewer days than the template authors keeps slots 1..n and the rest are dropped, so slot 1 is the long run and the remaining slots descend by importance. A week with no `is_long_run` row is legal from engine v5 — every run day is then available and slot order is chronological, which is what a within-week progression like C25K needs. And the **long run must be the longest session in its week**.

**Proof:** every plan built end to end at minimum and maximum days per week through `pg_net`; determinism re-proven after the v4 deploy (two identical `5k-improver` builds, md5 `34781c44`, 29,770 chars); no-key and wrong-key 401; RLS by claims simulation (`authenticated` 4/17/166/61 and zero fixture rows, `anon` 0/0/0/0). `start-running` is duration-authored and therefore totals 0km — correct for the plan, and something Wave 3's plan header must not render as "0 km".

### Wave 2 — Wizard, recap, projection — **variable plan length SHIPPED PM-1244; wizard next**
**Part 1, shipped 13 Sep 2026 (`run-engine@0.5.2`):** templates author as head + repeating cycle + fixed tail, `weekScript()` stretches or trims the cycle to the requested length, the tail inherits the final repetition's growth (§23.350), and the long-run ceiling is days-aware (§23.351). `start-running` is deliberately fixed at nine weeks. Part 2 is everything below.

**~~Phase-based expansion, ahead of everything else in this wave.~~ (done)** `buildPlan` clamps weeks to the template's min/max and needs authored rows for every week up to the max, so a 26-week plan means 130 hand-authored rows and every plan today is locked to a single length. The wizard asks "how many weeks" — that question cannot be honest until a template can be authored as a **repeating base block + a fixed peak + a fixed taper**, with the engine stretching the middle to the requested length. `general-training` already half-proves the pattern (12 weeks as a repeating 4-week cycle). Runna advertises 6–26 weeks on their beginner plans and that flexibility is a visible part of feeling premium.

Single-question screens, all enums. Ability with objective anchors and the conditional beginner redirect. Injury question gated on Phil. Pre-filled load and fitness inputs for connected members. **The projection screen** ("in 16 weeks: 3:49–3:59") and **the recap screen** are both mandatory — they are where the product feels personal. Derived knobs (volume, difficulty) named and shown, editable later.

### Wave 3 — Plan surfaces — **and where the catalogue grows (PM-1243)**
**Dean's bar: it must feel close to Runna or another premium running product; the route there is Claude's call.** The catalogue expands here, not earlier — the member never sees how many plans exist until this surface renders, and anything authored before it is another grid to re-cut if the surface wants a different shape. Add templates **only where the training genuinely differs**: half marathon (the real gap), marathon, a first-5k/parkrun bridge between Start Running and 5k Improver, **Return to Running** (conservative reload, pairs with the physio product — Runna has no equivalent), and 10 mile. About ten templates, presented as thirty-odd browsable entries via length × level × days-per-week, because most of Runna's apparent breadth is merchandising rather than programming (parkrun Improvement / Get Fit / New To Running are all 5km, 6–26 weeks, separated by level and volume). **Not building: Hyrox, triathlon, Functional Fitness** — outside what VYVE is and where Runna defends a different market. The binding constraint on catalogue size is the sign-off surface, not compute: a plan is a prescription, and fifty of them is a document no coach finishes.

Plan header (weeks complete, total distance, estimated race times, Manage Plan), training calendar by week with per-week totals and colour-coded day cards, and the session detail page: blocks, numbered steps, pace bands with the limit-not-a-target framing, outdoor/treadmill toggle, duration range, coach note. Lives inside Body (`exercise.html`) as a stream, same pattern as Physiotherapy — no nav change, no Home change. `running-plan.html` soft-killed at this point, never deleted.

### Wave 4 — The completion loop
Match finished activities from HealthKit / Health Connect to scheduled sessions (date + distance + duration window), auto-tick, write the `workouts`/`cardio` rows so streak, charity and achievements count, and show adherence per week. Manual "mark complete" and "skip" as fallbacks. This is the wave that makes the plan feel alive without a single line of tracking code.

### Wave 5 — Briefings and coach voice
Timed-release session briefing, "why does this session matter", post-session question feeding the next session's card, Calum's name and face on the recommendation. This is where AI belongs and the first place it appears in the feature. All copy Lewis-gated.

### Wave 6 — Adaptation
Rearrange workouts, missed-session handling, week reset, and **continuous re-baselining**: as sessions come back through Wave 4, the fitness number moves and the bands tighten. Runna re-baselines at the end race; ours can do it every week because the health pipeline is already there. This is the wave that makes week six still correct, and it is the real differentiator — along with flexing the plan on a bad wellbeing check-in week, which no running-only app can do.

### Wave 7 — Parked: device delivery and tracking
Three separate projects, none of them v1, in this order once the plan is good:
1. **Garmin** — cloud-to-cloud, no binary, OTA-safe. Apply to the Garmin Connect Developer Program (free to approved business developers, has lead time — worth starting early since it blocks nothing). OAuth + token table + a translator into their step/repeat JSON via the **Training API**, and a public webhook EF ingesting completed activities + FIT files via the **Activity API**. Note their APIs are deliberately narrow: structured running workouts in, activities back — no set-level strength data.
2. **Apple WorkoutKit** — iOS 17 / watchOS 10 framework, schedules our sessions straight into the native Workout app with per-step pace/HR alerts. No watch app needed. Swift, so a native plugin in `vyve-capacitor` and a **new store binary** — not OTA-able.
3. **In-app GPS tracking** — background-location plugin, Android foreground service, iOS always-location entitlement, Play Console background-location declaration. The plugin is the cheap part; GPS smoothing, auto-pause, battery and lock-screen behaviour are not. A tracker that drops a member's run is worse for "premium" than no tracker. Runna themselves throw a permissions gauntlet and a red LOW POWER MODE banner at the start of every run.

A watchOS or Wear OS app of our own is further out again: a separate native target in the same project and store listing, our branding and audio cues on top of what WorkoutKit already gives us for free. Not a founding piece.

## 5. Open decisions

- ~~Calum's authoring surface for templates~~ — **closed PM-1240: seed migration + rendered review sheet.**
- ~~Which goals ship in the first catalogue~~ — **closed PM-1240: Start Running, General Training, 5k, 10k.**
- ~~Whether "General training" is rolling or a fixed block~~ — **closed PM-1240: rolling, 4-week cycle.**
- Whether Wave 3's plan header shows elapsed time rather than distance for a duration-authored plan like Start Running — Dean.
- Calum's verdict on the first catalogue: weekly shape, progression, session structures, names and coach notes, and whether the eight-week run/walk ramp is too fast for a true beginner.
- Free-trial / entitlement framing for running specifically, if any — Lewis.
- Whether the projection screen's estimate is shown to members who have given only one race time, or held until we have two.
