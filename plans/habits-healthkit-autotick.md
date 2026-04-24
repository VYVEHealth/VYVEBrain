# Habits × HealthKit auto-tick — Build Plan

> **Status:** Drafted 24 April 2026 during session 5. Post-launch — not a v1 blocker.
> **Target:** Ship as a minor release (v1.1 / v1.2) within the first 4–6 weeks after HealthKit v1 lands on the App Store.
> **Owner:** Dean (technical), Lewis (habit library copy + visual design sign-off).
> **Related:** `plans/healthkit-health-connect.md` (v1 HK integration); `plans/healthkit-views.md` (inspector + feed).

---

## Why this feature

Members who live in the Apple Watch ecosystem already do a lot of their "VYVE habits" — they walk, they workout, they sleep. Making them tick those habits manually is friction. Auto-confirming from HealthKit data turns the daily habits page from a to-do list into a "look at what you did today" surface. Engagement-multiplier, not a new product.

The hard UX constraint Dean named explicitly: habits are **batch-submitted** via the Submit button on `habits.html`, not auto-logged behind the member's back. So "auto-tick" means **auto-populate the UI state**, not auto-insert into `daily_habits`. Member still owns the submit.

---

## Scope decisions (locked 24 April 2026)

| Decision | Value | Rationale |
|---|---|---|
| Model | **Auto-populate tick state, member still hits Submit.** | Preserves member agency. Dean's call. |
| Mapping source | **`habit_library.health_rule jsonb` column**, per-habit rule. | Generic enough to extend to Health Connect, VYVE-native metrics, future wearables without re-scoping. |
| Evaluation | **Server-side** in `member-dashboard` v51+. Each assigned habit row returned with `health_auto_satisfied: bool \| null`. | Single source of truth. No duplicate rule engine in the PWA. Easier to unit-test. |
| Override | **Member can change Yes → No/Skip manually.** Their tick wins over the auto-confirm. | Edge case: HealthKit thinks steps were done but member disagrees (e.g., took phone for a walk). |
| Pairs with | **Habits editing bug fix** (Critical Missing Piece #2 in backlog) — same session. | Without it, member who submits in the morning gets locked in before HK catches up. Feature is 30% less compelling without editing. |
| Nutrition | **Deferred.** Capgo 8.4.7 has zero dietary types exposed; forking the plugin is a separate mini-project (see `Nutrition work parked` section). | Not abandoning it, just sequencing. Water habit auto-tick blocks on this. |

---

## What maps cleanly today

Of the 30 habits currently in `habit_library`, three have unambiguous HealthKit signals:

| habit_pot | habit_title | Rule |
|---|---|---|
| movement | 10-minute walk | Sum of `distance` samples AND/OR duration of `walking`-type workouts today ≥ 10 min |
| movement | Take the stairs | Sum of `flightsClimbed` today ≥ 3 floors *(adds new scope — not in current 7 reads)* |
| sleep | Sleep 7+ hours | Sum of asleep-state sleep segments (asleep + rem + deep + light; exclude awake and inBed) for last night ≥ 420 min |

Another four have partial signal (loose/fuzzy — evaluate case-by-case before seeding rules):

- `movement / Active commute` — walking/cycling distance in commute windows. Time-of-day heuristic makes this brittle.
- `movement / Move every hour` — Apple Watch Stand Hours (`standHour` category — not in current reads; Watch-only).
- `movement / Stretch for 5 minutes` — infer from short Yoga / Flexibility workouts. Member might stretch without logging.
- `mindfulness / Daily breathing exercise` — HealthKit `mindfulness` type (Capgo supports). Only populates if member uses Breathe / Oak / Headspace / similar.

Everything else (social, most of nutrition, most of mindfulness, sleep hygiene behaviours) stays manual — no HK sensor exists.

---

## New HK-native habits to add to library

Retrofitting covers 3 habits. The bigger unlock is adding habits *designed* around HK signals. Proposed additions for Lewis's review:

| habit_pot | habit_title | habit_description | Rule |
|---|---|---|---|
| movement | Walk 10,000 steps | A classic daily target. Backed by research on metabolic health and longevity. | `steps` sum today ≥ 10000 |
| movement | Walk 8,000 steps | A slightly gentler daily target — evidence suggests 8k delivers most of the 10k health benefit. | `steps` sum today ≥ 8000 |
| movement | Complete a workout | Any strength, cardio, or movement session that counts. Apple Watch auto-detects; Strong and Strava sync too. | Exists any `workout` sample today matching strength/cardio buckets |
| movement | 30 minutes of cardio | Heart-pumping work. Running, cycling, rowing, swimming all count. | Sum of cardio-bucket workout durations today ≥ 30 min |
| movement | Close your Apple Watch rings | Move, Exercise, and Stand — all three. | `active_energy` ≥ member's Move goal (need to pull via extra scope); Exercise minutes ≥ 30; Stand hours ≥ 12. Requires 2 extra scopes (`activeCaloriesBurned` target + stand hours). |
| movement | Burn 500 active calories | A daily burn target for members on a fat-loss goal. | `active_energy` sum today ≥ 500 kcal |

Lewis call: habit_prompt copy, difficulty rating, which habit_pot each belongs in. I'd guess all `movement` except Apple Watch rings which might warrant its own category. Keep `habit_library.active = false` on the legacy "10-minute walk" if the new "Walk 8,000 steps" supersedes it.

---

## Schema change

```sql
alter table public.habit_library
  add column health_rule jsonb;

-- Index not needed — scanned per-member, small row count
```

Rule shape (proposed):

```json
{
  "source": "healthkit",
  "metric": "steps",
  "agg": "sum",
  "window": "today_local",
  "op": "gte",
  "value": 10000
}
```

Supported `metric` values (v1): `steps`, `distance_km`, `active_energy`, `workout_any`, `workout_cardio`, `workout_strength`, `sleep_asleep_minutes`, `flights_climbed`, `mindfulness_minutes`.

Supported `agg` values: `sum`, `max`, `exists`, `duration_sum_minutes`.

Supported `window` values: `today_local` (BST-aware, midnight → midnight), `last_night` (for sleep — sessions ending between today 00:00 and today 18:00 local), `last_24h` (rolling).

Supported `op` values: `gte`, `lte`, `eq`, `exists`.

Future-extensible: `source` could be `healthkit`, `health_connect`, `vyve_nutrition`, `vyve_session_views` etc.

Example seed rules:

```json
-- Walk 10,000 steps
{"source": "healthkit", "metric": "steps", "agg": "sum", "window": "today_local", "op": "gte", "value": 10000}

-- Sleep 7+ hours
{"source": "healthkit", "metric": "sleep_asleep_minutes", "agg": "duration_sum_minutes", "window": "last_night", "op": "gte", "value": 420}

-- Complete a workout
{"source": "healthkit", "metric": "workout_any", "agg": "exists", "window": "today_local", "op": "exists"}

-- 30 minutes of cardio
{"source": "healthkit", "metric": "workout_cardio", "agg": "duration_sum_minutes", "window": "today_local", "op": "gte", "value": 30}

-- Take the stairs
{"source": "healthkit", "metric": "flights_climbed", "agg": "sum", "window": "today_local", "op": "gte", "value": 3}
```

---

## Client-side gap to fix first

`healthbridge.js`'s `sampleToEF` currently drops `s.sleepState`. Capgo's `HealthSample` for sleep samples carries `sleepState: 'inBed' | 'asleep' | 'awake' | 'rem' | 'deep' | 'light'`. Without this, the sleep aggregation rule has no segment data to distinguish "in bed" from "actually asleep".

Patch:

```js
// In sampleToEF, extend metadata:
metadata: Object.assign(
  {},
  s.metadata || {},
  s.sleepState ? { sleep_state: s.sleepState } : {},
  s.distance ? { distance_m: s.distance } : {}
),
```

One-line client patch, ships ahead of this plan's main build so the sleep data starts arriving in a usable shape.

---

## Server-side: extending `member-dashboard` to v51+

For each habit in `member_habits` (already returned), also evaluate its `health_rule` against today's `member_health_samples` and return `health_auto_satisfied: true | false | null` (null = no rule, manual-only habit).

Pseudocode in the EF:

```ts
for (const h of memberHabits) {
  const rule = habitLibraryMap.get(h.habit_library_id)?.health_rule;
  if (!rule) { h.health_auto_satisfied = null; continue; }
  h.health_auto_satisfied = await evaluateRule(rule, memberEmail, samplesContext);
}
```

The rule evaluator reads `member_health_samples` with appropriate window filters. For sleep it needs the `metadata.sleep_state` from the client-side patch above. For workouts it uses the same strength/cardio bucket logic that's in `sync-health-data` v2's `promoteMapping` (consider shared helper to avoid drift).

Today's samples are queried once per request (not per rule) and passed as context.

---

## Client behaviour on `habits.html`

On page load:
1. Trigger `healthBridge.sync()` if `isNative()` and last sync > 15 min ago — ensures today's samples are fresh. Brief spinner on auto-tickable rows.
2. Fetch habits from member-dashboard (already happens). Each row now carries `health_auto_satisfied`.
3. For rows where `health_auto_satisfied === true`:
   - Pre-select "Yes"
   - Show a small badge: "✓ from Apple Health" (colour: var(--teal-lt); icon: HealthKit heart SVG)
   - Member can still tap No/Skip to override — the badge stays but the tick moves
4. For rows where `health_auto_satisfied === false` and rule exists:
   - Leave blank (default state)
   - Optional tiny hint: "Not yet — 6,420/10,000 steps" — progress towards the threshold. Requires the EF to return not just boolean but the actual progress value too. Nice-to-have.
5. For rows where `health_auto_satisfied === null`:
   - No change from current UX

On Submit: normal insert to `daily_habits`. The auto-tick path is UI-only — server state doesn't know the member "intended" yes until they submit.

---

## Pairing with the editing bug fix

Backlog's Critical Missing Piece #2: "Habits Editing Bug — Cannot un-skip or change habit answers once submitted." The auto-tick feature is materially weaker without this fix because of the morning-submit / afternoon-HK-sync mismatch.

Combined session scope:
- Edit `daily_habits` to support updating an existing row for today (or remove the 1/day cap entirely and use `upsert on conflict (member_email, activity_date)`)
- habits.html adds an "Edit today's submission" affordance when a submission already exists
- Auto-tick from HK can update state even after submission

Estimated combined effort: 2–3 sessions including testing.

---

## Nutrition work parked

Capgo `@capgo/capacitor-health` 8.4.7 exposes zero dietary types (verified 24 April 2026 from the plugin's `HealthDataType` enum — no `dietary*`). MFP, Cronometer, Lose It etc. all write to HealthKit's dietary types but we can't read them through this plugin.

Paths to unlock nutrition reads (separate mini-project):

1. **Fork Capgo, add dietary types.** Add ~15 enum cases + HKQuantityTypeIdentifier mappings + unit handling (g, ml, kcal). Same on Android Health Connect. ~2–3 sessions. Ongoing fork maintenance burden.
2. **Open PR upstream to Capgo.** Clean long-term, slow to merge. Run in parallel with (1).
3. **Wait.** No cost, no features.

Once unlocked, unblocks:

- `nutrition / Drink 2 litres of water` — auto-tick from `dietaryWater`
- `nutrition / Protein with every meal` — fuzzy, probably daily dietaryProtein threshold
- Nutrition totals on `nutrition.html` pulled from HealthKit for MFP-using members
- Macro adherence display (consumed vs TDEE target)

Merge strategy question (deferred): if both HK-pulled nutrition AND VYVE's own log-food.html entries exist for the same day, which wins? Probably HK-pulled totals take precedence if present, else sum from `nutrition_logs`. Needs to be explicit.

Scoped as separate plan when we sequence it: `plans/nutrition-healthkit.md`.

---

## Per-session breakdown

| # | Session | Pre-req | Deliverables |
|---|---|---|---|
| 0 | **`healthbridge.js` sleepState metadata patch** | None (can ship now ahead of the main build) | sampleToEF extended to fold `s.sleepState` into `metadata.sleep_state`; data starts landing correctly |
| 1 | **Habit library additions + schema migration** | Lewis signs off on new habit copy + difficulty | Migration adds `habit_library.health_rule`; Lewis-approved habits seeded with rules; existing 3 mappable habits retrofitted |
| 2 | **Server evaluator** | Session 1 merged | `member-dashboard` v51 returns `health_auto_satisfied` per assigned habit; shared rule-evaluator helper with sync-health-data's workout bucketing; unit-tested rule shapes |
| 3 | **Client UI + editing bug fix combined** | Session 2 deployed | habits.html pre-populates tick state from auto-satisfied flag; "✓ from Apple Health" badge (Lewis design); editing affordance for same-day submissions; daily_habits cap / upsert rework |
| 4 | **Progress hints (nice-to-have)** | Session 3 shipped | Rule returns progress value (`6420/10000 steps`) alongside satisfied boolean; habits.html shows inline on unsatisfied rows |

Total: ~3 sessions if (4) is dropped, ~4 sessions otherwise. Plus session 0 (a one-line patch) which can ship ahead of the rest.

---

## Risks & mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| Member submits before HK data syncs; their "No" locks in; they complain | High (without editing bug fix) | Pair with editing bug fix — non-negotiable |
| Rule evaluator drifts from sync-health-data's workout-type normalisation logic (double source of truth) | Medium | Extract `normWorkoutType`, `STRENGTH_CANON`, `CARDIO_CANON` into a shared helper module used by both EFs |
| Capgo plugin doesn't expose stand-hours / move-goal, breaking "Close your rings" habit | High | Either drop Apple Watch rings habit from v1 scope, or add scope requests and lobby Capgo for support |
| Members find "auto-confirmed" confusing — feel surveilled rather than helped | Low-medium | Badge copy and icon tested with Lewis + Alan before wider rollout; always reversible via tap |
| HealthKit returns stale sleep data (member hasn't opened Health app to trigger iCloud sync) | Medium | Trigger `plugin.requestAuthorization` or a gentle refresh on habits.html open; accept that we can't force an Apple Health app refresh |

---

## Open questions parked for later

- Should the badge say "Apple Health" or just "Auto-confirmed"? Branding call — Lewis.
- Weekly goals (not daily habits) — should they also auto-track progress from HK? Separate product decision.
- Can we proactively prompt "Hey, you hit 10k steps — head to the app to log it" via a push notification? Depends on native push (Critical Missing Piece #1 in backlog).
- Does the auto-tick feature need to respect the employer privacy boundary differently than manual ticks? Enterprise dashboard only sees aggregate, so probably not — but worth explicit check with Alan.

---

*Plan committed to brain 24 April 2026.*
