# Movement V2 Spec — Build Reference

> Single-read spec for the Movement V2 build. Captures every decision from the PM-418 design session. Build chats reference this once and execute — no design re-derivation needed.
>
> **Status:** Spec locked PM-418, 27 May 2026. Build sequenced after PM-413 (iOS 1.4 / Android 1.0.5 store approval) and PM-411 Bug B (workout-library Dexie stale-read).
>
> **Scope:** Movement section of the app (`movement.html`, plan picker, related EFs, HK history pull, plan-fit nudge). Closes PM-411 Bug A (movement plan structurally homeless) and goes well beyond it — Bug A's narrow fix (category backfill + branching) is one step of a seven-step build.

---

## 1. Architecture & state matrix

`movement.html` is **one page, five render states**. Render branches on `workout_plan_cache.programme_json.category='movement'` row presence + `member_health_connections` row presence + (for HK members) baseline data presence.

| State | Plan? | HK? | Description |
|---|---|---|---|
| 1 | On structured plan | Connected | HK ring auto-fills. Programme card + week consistency + Today's Movement prompts. Add-activity supplement available. |
| 2 | On structured plan | Not connected | Manual ring with 4-chip estimate. Same programme card + prompts + week consistency. Connect-prompt as upgrade path. |
| 3 | On Just Steps | Connected | HK ring. No programme card (Just Steps has no ramp). Editable target slider. Week consistency reframed as "days on target". |
| 4 | On Just Steps | Not connected | Manual ring + chip estimate. Editable target via stepper. Same week consistency reframe. |
| 5 | No plan | Either | Stripped surface: ring + week consistency + quick-log + recent + "Start a movement programme" CTA. |

Dean shorthand: `movement.html` is the Body pillar's movement sub-page. `exercise.html` is the Body hub that routes to it.

**§23.54 anchor:** "body" / "body.html" always means `exercise.html` in user requests. There is no body.html file.

---

## 2. The four plans (final library)

Office Worker Mobility was considered and **dropped** — it folds into Foundation as a desk-based starting context. Five plans was too many; four is the right shape.

### Just Steps

- **Audience:** Gym-goers, active members, anyone who's already got movement figured out and just wants tracking.
- **Duration:** Ongoing. No end date.
- **Target:** Member-set via slider. Range derived from baseline.
- **Prompts:** None.
- **Schema:** `prompt_pool=[]`, `daily_prompt_count=0`, `duration_weeks=null`, `weekly_targets` is a single row with `daily_steps=<member choice>`.
- **Adaptive:** ON by default for HK members; OFF for manual-only.

### Sedentary Reset — Foundation

- **Audience:** Low-baseline members building a daily-movement habit (Sarah-shape — call-centre worker, mostly sedentary).
- **Duration:** 4 weeks, locked progression.
- **Target ramp:** 3,000 → 4,000 → 4,500 → 5,000 steps/day across the weeks.
- **Prompts:** 2–3 per day across walk / stretch / movement-break / stand-walk / breathe pool.
- **No slider:** the locked ramp IS the safeguard. To override, member switches to Just Steps.

### Distance Builder

- **Audience:** Active walkers wanting to build endurance and pace (Hannah-shape — dog walks twice daily, parkrun Saturdays, 9-10k baseline).
- **Duration:** 6 weeks, locked progression.
- **Target ramp:** 8,000 → 9,000 → 9,500 → 10,500 → 11,000 → 12,000 steps/day.
- **Prompts:** Different copy from Foundation — "purposeful 30-min walk", "intervals on your walk", "uphill route today". Distance + pace metrics alongside steps.
- **No slider:** locked ramp.

### Return to Movement

- **Audience:** Post-illness, post-injury, post-pregnancy, returning from extended sedentary period.
- **Duration:** 6 weeks, gentle locked progression.
- **Target ramp:** 1,500 → 2,000 → 2,500 → 3,000 → 3,500 → 4,000 steps/day.
- **Prompts:** Very gentle copy. No "intervals" or "purposeful" language — soft framing throughout.
- **Clinical sign-off REQUIRED before ship.** Phil owns this gate, same shape as HAVEN.
- **No slider:** locked ramp.

---

## 3. HealthKit history at consent

When the member taps **Allow** on the existing HK consent prompt during onboarding, a background pull captures their history. **No new UI for this.** Loader screen explicitly removed from spec — pull is invisible and runs in `EdgeRuntime.waitUntil` style.

### Flow

1. Member taps Allow → Capgo `requestPermissions` resolves
2. Onboarding immediately advances to next screen (no loader)
3. Background: Capgo `queryAggregated` 3 windows × 30 days = 90 days of daily step totals
4. Server compute: median (p50), p25, p75 of those 90 daily totals
5. Stamp `members.baseline_steps_p50`, `baseline_steps_p25`, `baseline_steps_p75`, `baseline_computed_at`, `baseline_source='healthkit_history'`, `baseline_days_available` (so we know how much data we trusted)
6. Result is silently available to the plan-picker when member reaches it

### Why median, not mean

One parkrun day or one hike inflates mean badly. Median = "typical Tuesday". This matters when explaining the number to the member — "your typical day" reads as honest, "your average" reads as gamed.

### Fallback for <90 days of data

Use whatever's available (30+ days minimum). Stamp `baseline_days_available` honestly. If a member granted HK consent yesterday with no historical data — store `baseline_source='deferred'` and run pull again in 14 days when there's data to read.

### Consent disclosure copy

The HK consent screen needs one new italic line added to its existing copy:

> "When you tap Allow, we'll quickly check your last 90 days of step data to suggest the best movement plan for you. This stays on your device — only your daily-average summary is saved."

Lewis + Phil sign-off on the exact wording. Existing copy + new line, not a full rewrite.

### Non-HK members

No HK = no baseline. One-question chip prompt during plan picker setup: "Roughly how active are you usually? (Under 3k · 3–5k · 5–8k · Over 8k)". Stamp `members.baseline_activity_band`. Slider ranges derive from band midpoint.

---

## 4. Plan-picker page

New page or refactored `movement-plans.html`. Smart-sorted by fit to baseline.

### Smart sort

For HK members: rank plans by closeness of their mid-target to `baseline_steps_p50`.
For non-HK members: rank by closeness to chip-band midpoint.

Top match gets:
- Gold `Suggested for you` badge (top-right)
- Gold border
- Fit-line: "Fits your 7,400 baseline — starts at 8k, builds to 12k"

Off-baseline plans:
- Dimmed at 55% opacity (still tappable)
- Explainer chip in meta row: "Below your baseline" / "Specific use case"

Just Steps is always rendered — autonomy plan, always relevant regardless of baseline.

Baseline strip at top of library:
> "Based on your 7,400 steps/day baseline from Apple Health"
or
> "Based on the activity level you shared"

### Plan detail screens

**Just Steps detail (HK):** slider with safeguards (Section 6). Adaptive toggle.

**Just Steps detail (non-HK):** baseline chip question + narrower slider range. Adaptive toggle disabled (greyed) with copy: "Connect Apple Health to unlock adaptive targets."

**Foundation / Distance Builder / Return to Movement detail:** locked ramp display showing all weeks of the progression. Read-only. Locked-ramp note: "This ramp is fixed — the plan's value is the safety of the build. If 5k feels too easy by Week 4, switch to Just Steps with a higher target."

---

## 5. Movement page (consumption surface)

This is `movement.html` after the member's picked a plan. State-aware per the matrix in Section 1.

### Layout order (all states)

1. **Navbar** (back + title)
2. **Programme card** (hidden in States 3-5 / Just Steps and No Plan)
3. **Step ring** (HK or manual variant)
4. **Week consistency card** (always)
5. **Today's Movement card** (hidden in States 3-5)
6. **Browse all movement plans** button
7. **Quick log card** (kind pills + duration + distance + Sport pill new)
8. **Recent Movement card** (always)

### Programme card content

Differs by plan:
- **Foundation/Return to Movement:** "Daily movement" + step target + sessions/week + ramp progress
- **Distance Builder:** Step target + km target + sessions/week
- **Just Steps/No Plan:** Card hidden entirely

### Step ring states

**HK ring (auto-filled):**
- Source tag: `[watch icon] Apple Watch`
- Number from `healthbridge.js` autotick pipeline (existing)
- "+ Add activity" link → supplement modal

**Manual ring (chip-filled):**
- Source tag: `[hand icon] Self-reported`
- 4-chip estimate below ring: 2k / 5k / 7.5k / 10k+
- Connect-hint at bottom: "Have an Apple Watch or fitness tracker? Connect to unlock adaptive targets →"

### Today's Movement prompts

V1 ships **generic text prompts only** — not curated mobility videos.

Prompt pool (5 types, 1 sentence each — Lewis writes copy):
- **Movement break** (5 min) — "Walk to a window. Stretch your arms overhead. Roll your shoulders."
- **Short walk** (10 min) — "Outside if you can. Round the block, up to a coffee shop, anywhere."
- **Stretch your neck and shoulders** (3 min) — "Slow head tilts side to side. Shoulder rolls. Whatever feels tight."
- **Stand and walk around** (2 min) — "Up from your desk, around the room, back."
- **Take a breath** (2 min) — "Four slow breaths in, four out. Eyes closed if it helps."

Tap-to-complete — checkbox flips, optimistic Dexie write, un-awaited POST.

V2 (post-trial) swaps prompts for filmed sessions when Calum/Phil have content. **Page architecture unchanged** — just swap one prompt for one session, slot-by-slot.

### Add Activity modal (HK supplement)

Triggered from "+ Add activity" link on HK ring. For the football-match case where member took the watch off.

- Sport (default), Walk, Yoga, Pilates, Other pills
- Activity name (e.g. "Football match")
- Duration in minutes
- Approx steps (optional, capped at `daily_target × 2`)
- Stamps `source='manual_supplement'`, `manual_steps` column

Cap note: "Manual entries cap at twice your daily target to keep things honest. Football, a hike, or a class will fit comfortably."

### Quick-log kind pills

Adds **Sport** pill to existing set: Walk / Stretch / Yoga / Mobility / Pilates / **Sport** / Other. New enum value in `movement_activities.kind`.

Pilates icon: `circle-dot` (abstract, tint differentiates from Sport's `trophy`).

---

## 6. Just Steps slider safeguards

The only plan with a slider. Safeguarding logic is core product.

### Range derivation

**HK members:** `[baseline_steps_p50 × 0.9, baseline_steps_p50 × 1.5]`, rounded to nearest 500.

**Non-HK members:** Anchored to chip-band midpoint:
- Under 3k → range 2,000–5,000
- 3k–5k → range 3,500–7,000
- 5k–8k → range 5,000–9,500
- Over 8k → range 7,000–12,000

### Banner triggers

**Safeguard banner (amber)** — fires when slider value ≥ `baseline × 1.3`:

> ⚠ That's a big jump. Going much above your usual activity is where injury risk creeps in. We recommend starting closer to your baseline and letting us suggest bumps as you adapt.

**Cap banner (orange)** — fires when slider at maximum:

> 🛡 Slider's at its cap. Higher targets unlock as you build consistency at this level.

### Translation copy

Headline number + sub-line: "About **60 minutes** of walking". Mapping: ~100 steps/min walking pace, rounded to nearest 5 min.

### Phil sign-off

Maximum step caps need Phil's eyes before ship — especially Return to Movement's ceiling. Same gate as HAVEN clinical sign-off.

---

## 7. Adaptive target & plan-fit nudge

### Adaptive target (Just Steps only, HK only)

- Cron `evaluate-adaptive-targets` runs daily after `vyve_recompute_member_stats`
- For each HK member on Just Steps with `adaptive_targets_enabled=true`:
  - Compute 14-day rolling median from `member_health_daily`
  - If median ≥ 130% of current target AND ≥10 of 14 days hit target → suggest bump
  - Suggested new target = `median × 0.9`, rounded to nearest 500
- Fire as soft banner on movement.html + notification on home (NOT modal, NOT push)
- Member confirms → target updates
- Dismissed → 30-day cooldown via `members.target_suggestion_dismissed_at`

Adaptive bumps DISABLED for:
- Manual-only members (self-reinforcing data)
- Members on structured plans (the plan's ramp IS the progression)

### Plan-fit nudge (all structured plans, HK only)

- Cron `evaluate-plan-fit` runs daily 04:00 UTC after stats refresh
- For each HK member on structured plan past Week 2:
  - If 14-day median ≥ 130% of plan's **end-state target** → fire plan-up nudge
  - If 14-day median significantly below target for 21+ days → do NOT fire automatic plan-down. Phil-shaped human check-in instead (out of scope for v1, document the trigger event for ops review)

### Plan-up nudge UI

Gold banner on movement.html:

> ✨ You're crushing it
> ## You've outgrown Foundation
> Your 14-day average is **7,200 steps/day** — well above what Foundation is built for. Ready for something more challenging?
> [Move to Distance Builder] [Not now]

Plan-switch modal on accept:

> What carries over
> ✓ Your 4-day streak stays intact
> ✓ Certificate progress preserved
> ✓ Today's logged activity counts
> ✓ You can switch back any time

Dismissed → 30-day cooldown via `members.planfit_suggestion_dismissed_at`.

### Plan-fit copy varies by source plan

Lewis writes copy variants:
- Foundation graduate → "You've outgrown Foundation. Ready for something more challenging?"
- Distance Builder graduate → "You've built serious endurance. Ready to maintain it with Just Steps?"
- Return to Movement graduate → "You've built a solid base. Want to keep building?"

Phil reviews Return to Movement variant specifically.

---

## 8. WIRE & SUBSCRIBERS — the ecosystem integration

**This is the part that determines whether the build actually works.** Per PM-319 + PM-386 + PM-307 + PM-289, bus + Supabase + cross-page integration is where movement-as-first-class falls apart if specced incompletely.

### Write surfaces (8 paths)

Every write follows §23.31 Dexie-first contract: optimistic Dexie write with `client_id` UUID stamped → un-awaited POST to `log-activity` EF v7+ with same `client_id` → server insert → BEFORE triggers (caps, dedup) → AFTER triggers (dirty-mark `member_home_state`) → `refresh_member_home_state()` synchronous.

1. **Today's Movement prompt tick** → `movement_activities` row, `kind='other'`, `notes='Today's Movement · {prompt name}'`, `client_id`
2. **Quick-log kind pill** → `movement_activities` row, selected `kind`, `duration_minutes`, `distance_km`, `client_id`
3. **Add activity supplement** (HK modal) → `movement_activities` row, `source='manual_supplement'`, `kind`, `manual_steps`, `client_id`, day-cap `target × 2` enforced server-side
4. **Manual step estimate** (non-HK chip tap) → `manual_step_estimates` UPSERT on `(member_email, day)`, `client_id`, dirty-mark trigger
5. **Slider commit** (Just Steps target change) → `workout_plan_cache.programme_json.daily_target_steps` UPDATE + audit row
6. **Adaptive bump accept** → same as slider commit
7. **Plan switch** (nudge accept) → `workout_plan_cache` UPDATE — old row `is_active=false`, new row `is_active=true`, streak + certificate state preserved
8. **HK autotick** (existing, unchanged) → `daily_habits` (steps habit), `workouts` (HK workouts), `cardio` (HK runs/walks)

### Bus events to publish

Event names declared in `_shared/bus-events.md` (or equivalent registry).

**New events:**
- `movement:step_estimate` — fires on chip tap (write surface 4)
- `movement:target_changed` — fires on slider/adaptive commit (5, 6)
- `movement:plan_changed` — fires on plan switch (7)
- `movement:nudge_dismissed` — fires on nudge dismissal (analytics)
- `body:steps_updated` — fires on ANY write that changes the day's step total (3, 4, 8)

**Existing events to publish from new surfaces:**
- `movement:logged` — fires on 1, 2, 3 (with appropriate `kind` + `source` discriminator)
- `body:logged` — aggregator, fires alongside `movement:logged` per existing convention

### Subscribers — repaint audit

**§23 hard rule (new, see Section 10):** every new activity table requires touching all of these. Before commit, build chat runs repo-wide grep for `movement:*`, `body:*`, `movement_activities`, `workout_plan_cache`, `members.baseline_steps_p50`.

Predicted subscribers:
- **`index.html` (home)** — step ring on home, today's movement count tile, streak rendering, score ring v2
- **`exercise.html` (Body hub)** — must route to movement.html when `category='movement'` (PM-411 Bug A fix)
- **`engagement-v2.html`** — engagement score components include movement_activities count, must include manual_step_estimates
- **`leaderboard.html`** — steps-based leaderboards
- **`certificates.html`** — movement-tier certificate progress
- **Achievements** — placeholder system per PM-94, but events still fire
- **`member-dashboard` EF** — server-side aggregator, needs to know about manual_step_estimates rows
- **`movement-history.html`** — must show new rows immediately
- **`workout_plan_cache`** dirty-mark trigger family — extend to new table

### SQL + JS twin update (§23.77 candidate — now PROMOTED to hard rule, Section 10)

Every new activity table requires touching:
1. `compute_engagement_components_v2` SQL function
2. `v_active_days` SQL view
3. JS mirror `computeEngagementComponentsV2`
4. Dirty-mark triggers on new tables (call `refresh_member_home_state(NEW.member_email)`)
5. Activity-breakdown tile renderers on home + engagement-v2 pages
6. Charity reconcile function (`get_charity_total` + `charity_total_reconcile_and_heal`)
7. Completeness test (Section 9)

### Charity mechanic integration

Current rule: every 30 activities of a specific type = 1 month donated.

With movement-first-class (PM-307) + this spec's three new pathways, build must confirm all of these count as movements toward charity:
- Today's Movement prompt tick → YES
- Kind-pill quick-log session → YES
- HK supplement (football match) → YES
- HK autotick (existing) → already counts
- Manual step chip tap that hits day's target → YES (hitting the target IS a meaningful action; member who chip-taps "5k" daily for 30 days has donated a month)

Update `charity_total_reconcile_and_heal()` to add new branch: count `manual_step_estimates` rows where `estimate_bucket >= plan.daily_target_steps` for the day.

---

## 9. The completeness test

**Build chat MUST verify all 10 surfaces update within seconds of any movement write.** If any silently fails, build is incomplete.

For each of the 8 write surfaces above, verify:

1. ✓ Home page `index.html` step ring updates (HK autotick already, manual paths need wiring)
2. ✓ Home page day-streak dot strip lights current day
3. ✓ Home page "Progress Tracks" Movement tile increments
4. ✓ Charity mechanic counter increments (every 30 = 1 month)
5. ✓ Engagement score v2 (`engagement_body_points`, `engagement_score_v2`) refreshes via dirty-mark
6. ✓ Leaderboard "activities this month" count increments
7. ✓ Movement track certificate progress advances (The Architect tier)
8. ✓ Activity history on `movement-history.html` shows row immediately
9. ✓ Recent Movement card on `movement.html` shows row immediately
10. ✓ Bus event fires and any open page subscribed to `movement:*` or `body:*` repaints

Test the path that's most likely to break: **non-HK member taps the "5k" chip → all 10 surfaces update**. That's the most novel data path.

---

## 10. New §23 hard rule — promoted

**§23.78 (new):** Every new activity table or activity source requires touching:
1. SQL function `compute_engagement_components_v2` + JS twin `computeEngagementComponentsV2`
2. SQL view `v_active_days`
3. Dirty-mark trigger calling `refresh_member_home_state()` 
4. Activity-breakdown tile renderers on home + engagement-v2 pages
5. Charity reconcile function `charity_total_reconcile_and_heal()`
6. Completeness test (the 10 surfaces in Section 9)

Reference occurrences:
- PM-307 (movement_activities first-class promotion)
- PM-289 (connect_checkins first-class promotion)
- **PM-418 (movement v2 — manual_step_estimates + supplement + adaptive paths)** ← third occurrence promoting candidate to hard rule

---

## 11. Schema changes (new columns / tables)

### New columns

**`members`:**
- `baseline_steps_p50 INTEGER` — median daily steps from HK history pull
- `baseline_steps_p25 INTEGER` — quartile
- `baseline_steps_p75 INTEGER` — quartile
- `baseline_computed_at TIMESTAMPTZ` — when pull last ran
- `baseline_source TEXT` — `'healthkit_history'` | `'deferred'` | `'manual_band'`
- `baseline_days_available SMALLINT` — how many days we actually pulled
- `baseline_activity_band TEXT NULL` — for non-HK members: `'under_3k'` | `'3k_5k'` | `'5k_8k'` | `'over_8k'`
- `custom_step_target INTEGER NULL` — for Just Steps members and No Plan members (default 5000)
- `target_suggestion_dismissed_at TIMESTAMPTZ NULL` — cooldown for adaptive bumps
- `planfit_suggestion_dismissed_at TIMESTAMPTZ NULL` — cooldown for plan-fit nudges

**`workout_plan_cache.programme_json`:**
- New field `category TEXT` (the PM-411 Bug A backfill — `'workouts'` | `'movement'`)
- New field `adaptive_targets_enabled BOOLEAN DEFAULT true`
- New field `daily_target_steps INTEGER` (for Just Steps)
- New field `prompt_pool TEXT[]` (list of prompt keys for Today's Movement)
- New field `daily_prompt_count SMALLINT` (how many prompts per day)

**`movement_activities`:**
- New column `manual_steps INTEGER NULL` — for supplement entries with optional step count
- Extend `source` enum values: existing + `'manual_supplement'`
- Extend `kind` enum values: existing + `'sport'`

### New tables

**`manual_step_estimates`** (PM-418):
```sql
CREATE TABLE manual_step_estimates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_email TEXT NOT NULL REFERENCES members(email) ON DELETE CASCADE,
  day DATE NOT NULL,
  estimate_bucket SMALLINT NOT NULL CHECK (estimate_bucket IN (2000, 5000, 7500, 10000)),
  client_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (member_email, day)
);
-- Dirty-mark trigger zzz_refresh_home_state fires on INSERT/UPDATE/DELETE
-- RLS: standard member-scoped policies per security audit doctrine
```

**`programme_library`:**
- `category` backfill (PM-411 Bug A — already in backlog as architectural prereq)

---

## 12. Build sequence

7 steps, sized in Claude-assisted sessions:

1. **`programme_library.category` backfill + onboarding EF v37 writes category into `workout_plan_cache`** (PM-411 Bug A architectural prereq) — ~1 session
2. **New columns + new table migrations** (members + workout_plan_cache.programme_json + manual_step_estimates) — ~0.5 sessions  
3. **HK consent-time background baseline pull** (Capgo `queryAggregated` 3-window, median compute, stamp) — ~1 session
4. **`movement.html` v2** with state-aware render (5 variants), Today's Movement prompts, Sport pill, supplement modal — ~1.5 sessions
5. **Plan-picker page** with smart sort + Just Steps slider + safeguard banners — ~1 session
6. **`evaluate-plan-fit` daily cron + nudge banner UI + plan-up acceptance flow** preserving streak/certificate state — ~1 session
7. **Wire & subscribers audit** — repo-wide grep, update all 10 completeness-test surfaces, charity reconcile update, SQL/JS twin updates per §23.78 — ~0.5-1 session

**Total: ~6-7 Claude-assisted sessions.**

Dependencies:
- Sequenced after PM-413 (iOS 1.4 / Android 1.0.5 store approval) — trial cohort first
- Sequenced after PM-411 Bug B (workout-library Dexie stale-read race) — Thursday-grade surgical fix
- Phil sign-off needed on: Return to Movement plan content, slider max caps, plan-fit copy variants, consent disclosure copy
- Lewis writes: 5 Today's Movement prompt copy lines, 4 plan descriptions, plan-fit nudge copy variants

---

## 13. Out of scope for v1

Deferred to v2 or later:
- Office Worker Mobility as a distinct plan (folded into Foundation)
- Automatic plan-down adjustments (Phil-shaped human check-in instead)
- Adaptive bumps for manual-estimate members (self-reinforcing data)
- Curated mobility video content (Calum/Phil produce post-trial)
- Advanced toggle for above-cap target setting
- Plan-fit suggestions for non-HK members (insufficient data quality)
- Android Health Connect wiring (parked until Dean has Pixel/Galaxy device)
- Live-polling HK upgrade on Movement (current is per-session)
- Real-time plan-fit evaluation (cron-driven is correct starting shape)

---

## 14. Mockup references

Design session produced these mockups (all in `/mnt/user-data/outputs/` from the session):

1. `movement-plan-mockups.html` — initial clean-slate vs grounded comparison
2. `movement-manual-options.html` — three manual-only options (tick / chips / sessions-only)
3. `movement-v1-final.html` — first hybrid (HK + manual)
4. `movement-v1-three-state.html` — added No Plan state for gym-goers
5. `movement-plan-picker.html` — library + Just Steps slider + Foundation contrast
6. `movement-plan-fit-intelligence.html` — baseline pull + smart sort + nudge
7. `movement-v1-final-spec.html` — **final consolidated spec mockup, this is the visual ship target**

The final spec mockup (#7) is the source of truth for visual design. Where this document and the mockup disagree, the mockup wins for visuals, this document wins for logic.

---

*Spec locked PM-418, 27 May 2026. Build chats reference this once and execute.*
