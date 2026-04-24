# Habits × HealthKit auto-tick — Build Plan

> **Status:** ✓ COMPLETE. Drafted 24 April 2026 during session 5, revised same day end-of-session 7a against the session 6 pipeline reality. Sessions 1 (7b) + 2 shipped 24 April. Session 3 shipped 25 April. Feature fully live end-to-end.
> **Target:** Ship as a minor release within the first 4–6 weeks after HealthKit v1 lands on the App Store.
> **Owner:** Dean (technical), Lewis (habit library copy + visual design sign-off).
> **Related:** `plans/healthkit-health-connect.md` (v1 HK integration); `plans/healthkit-views.md` (inspector + feed).

---

## Why this feature

Members who live in the Apple Watch ecosystem already do a lot of their "VYVE habits" — they walk, they workout, they sleep. Making them tick those habits manually is friction. Auto-confirming from HealthKit data turns the daily habits page from a to-do list into a "look at what you did today" surface. Engagement-multiplier, not a new product.

Hard UX constraint (Dean's call, unchanged): habits are **batch-submitted** via the Submit button on `habits.html`, not auto-logged behind the member's back. So "auto-tick" means **auto-populate the UI state**, not auto-insert into `daily_habits`. Member still owns the submit.

---

## Scope decisions

| Decision | Value | Rationale |
|---|---|---|
| Model | **Auto-populate tick state, member still hits Submit.** | Preserves member agency. |
| Mapping source | **`habit_library.health_rule jsonb` column**, per-habit rule. | Generic enough to extend to Health Connect, VYVE-native metrics, future wearables without re-scoping. |
| Evaluation | **Server-side** in `member-dashboard` v51+. Each assigned habit row returned with `health_auto_satisfied: bool \| null` and `health_progress: {value, target, unit} \| null`. | Single source of truth. No duplicate rule engine in the PWA. Unit-testable in isolation. |
| Override | **Member can change Yes → No/Skip manually.** Their tick wins over the auto-confirm. | Edge case: HealthKit thinks steps were done but member disagrees (e.g., took phone for a walk). |
| Pairs with | **Habits editing bug fix** (Critical Missing Piece #2 in backlog) — same session. | Without it, a member who submits in the morning gets locked in before HK catches up. Feature is 30% less compelling without editing. |
| Nutrition | **Deferred.** Capgo 8.4.7 has zero dietary types exposed; forking the plugin is a separate mini-project. | Not abandoning, sequencing. Water habit auto-tick blocks on this. |

---

## Routing — three data sources, not one

Session 6 split the HealthKit pipeline into three backing stores, each with different shape and semantics. The rule evaluator routes per metric:

| Metric family | Backing store | Why |
|---|---|---|
| `steps`, `distance_km`, `active_energy` | `member_health_daily` — one row per `(member, source, sample_type, date)`, already Watch-vs-iPhone deduped via Apple's `HKStatisticsCollectionQuery` | Indexed lookup by primary key. BST-correct (client constructs local day buckets). Aggregation already done. No per-sample arithmetic needed in the evaluator. |
| `sleep_asleep_minutes` | `member_health_samples` where `sample_type='sleep'`, summed by `metadata.sleep_state IN ('light','rem','deep','asleep')` excluding `{awake, inBed}` | Sleep needs segment-level fidelity. `HKCategoryValueSleepAnalysis` states aren't aggregable upstream — only a segment-summation does the right thing. |
| `workout_any`, `workout_cardio`, `workout_strength`, `workout_duration_minutes` | Direct query of `public.workouts` and `public.cardio`, filtered by `activity_date = <today local>` | HK workouts are already promoted to these tables by `sync-health-data` v6 (with `source='healthkit'` stamped post-session-7a). The taxonomy normalisation from sync-health-data v2 is the single source of truth for strength-vs-cardio routing. Re-querying raw `workout` samples would duplicate that logic. |
| `flights_climbed`, `apple_watch_rings` | Not available in v1 | `flightsClimbed` is not in the 7 granted read scopes. Apple Watch rings need `stand_hours` + the member's move goal, neither of which Capgo 8.4.7 exposes. Both dropped from v1 seed habits. |

Window semantics:

- `today_local` — lookup for daily table: `date = (current_date at time zone 'Europe/London')` (the daily row is already tagged with local date). For workouts/cardio: `activity_date = ...` (same semantics — set by `set_activity_time_fields()` trigger using BST-aware logic).
- `last_night` — sleep: segments whose `start_at` is between `(current_date - interval '1 day')` local 18:00 and `current_date` local 18:00. Captures last night's sleep even when evaluated at noon the next day.
- `last_24h` — rolling: less used, available for niche rules.

Supported `op` values: `gte`, `lte`, `eq`, `exists`.

---

## What shipped ahead of this plan

Three pre-requisites landed before the main build can start. All green.

### ✓ Session 5c (already in main, shipped 24 April)
`sampleToEF` in `healthbridge.js` folds `s.sleepState` into `metadata.sleep_state` on write, giving segment-level Apple sleep data in our store. Verified: 169 segments over 30 days for Dean's account with the full state vocabulary (`light`, `rem`, `deep`, `asleep`, `awake`, `inBed`) represented.

### ✓ Session 6 (shipped 24 April)
`member_health_daily` table exists with the `push_daily` handler in `sync-health-data` v5+ upserting aggregated step/distance/active_energy rows. BST bucket bug squashed. Verified: today's row for Dean reports 9,136 steps / 833 kcal / 6.8 km matching the Watch.

### ✓ Session 7a (shipped 24 April)
Workout cap is source-aware. `workouts.source` and `cardio.source` columns default `'manual'`; BEFORE INSERT cap only fires on manual rows; `sync-health-data` v6 stamps `source: 'healthkit'` on promotion. A Watch-heavy member doing 3+ workouts a day now gets all of them counted instead of the 3rd silently diverting to `activity_dedupe`. Without this the "complete a workout" rule would have returned false for any day the member genuinely did 3+.

---

## What maps cleanly today

Of the 30 habits currently in `habit_library`, three have unambiguous HealthKit signals:

| habit_pot | habit_title | Rule |
|---|---|---|
| movement | 10-minute walk | Daily lookup: `member_health_daily.distance` today ≥ 1 km (rough proxy for 10-min walk) OR `exists` a walking-type workout today |
| movement | Take the stairs | `flightsClimbed` today ≥ 3 floors *(requires scope addition — not in v1 seed)* |
| sleep | Sleep 7+ hours | Sleep-state sum today (last_night window) ≥ 420 min, counting `{light, rem, deep, asleep}` only |

Another four have partial signal (fuzzy — not seeded in v1):

- `movement / Active commute` — time-of-day heuristic over walking/cycling workouts. Brittle.
- `movement / Move every hour` — Apple Watch Stand Hours (`standHour` category — Watch-only, not in granted scopes). Drop.
- `movement / Stretch for 5 minutes` — short Yoga/Flexibility workout matches. Member might stretch untracked. Fuzzy.
- `mindfulness / Daily breathing exercise` — `mindfulness` type via Breathe/Oak/Headspace integrations. Only populates for members using those apps.

Everything else (social, most nutrition, most mindfulness, sleep hygiene behaviours) stays manual.

---

## New HK-native habits to add to library

The bigger unlock is adding habits *designed* around HK signals. Proposed seeds for Lewis's review:

| habit_pot | habit_title | habit_description | Rule source | Rule payload |
|---|---|---|---|---|
| movement | Walk 10,000 steps | Classic daily target. | daily | `{metric:"steps", agg:"exists_row_gte", window:"today_local", value:10000}` |
| movement | Walk 8,000 steps | Slightly gentler target — evidence suggests 8k delivers most of the 10k mortality benefit (Paluch et al., Lancet Public Health). | daily | `{metric:"steps", ..., value:8000}` |
| movement | Complete a workout | Strength, cardio, or movement session. Apple Watch auto-detects; Strong and Strava sync via HK too. | workouts+cardio | `{metric:"workout_any", agg:"exists", window:"today_local"}` |
| movement | 30 minutes of cardio | Running, cycling, rowing, swimming. | cardio | `{metric:"cardio_duration_minutes", agg:"sum", window:"today_local", op:"gte", value:30}` |

**Default threshold guidance for Lewis:** `Walk 8,000 steps` as the default for new members aged 50+ or with beginner fitness flag at onboarding; `Walk 10,000 steps` for NOVA persona and high-training-days flag. Both seeded; onboarding assigns one based on persona/fitness level. The threshold lives in `health_rule.value` so we can A/B without code changes.

**Active calories — silent-tracked only, no user-facing habit in v1.** `member_health_daily.active_energy` is already flowing (833 kcal landed for Dean today, no build needed). Future habit "Burn 500 active calories" is a one-row seed when we want to surface it.

**Apple Watch rings — dropped from v1.** Needs two additional scopes we don't have (`standHour`, member's move goal exposure). Reintroduce if/when Capgo exposes them or we fork.

---

## Schema change

```sql
alter table public.habit_library
  add column health_rule jsonb;

-- No index. Scanned per-member at request time, ~30 rows total.
```

Rule shape:

```json
{
  "source": "daily" | "samples_sleep" | "activity_tables",
  "metric": "steps" | "distance_km" | "active_energy" | "sleep_asleep_minutes" | "workout_any" | "workout_cardio" | "workout_strength" | "cardio_duration_minutes",
  "agg": "sum" | "max" | "exists" | "duration_sum_minutes" | "exists_row_gte",
  "window": "today_local" | "last_night" | "last_24h",
  "op": "gte" | "lte" | "eq" | "exists",
  "value": 10000
}
```

Supported `source` values in v1: `daily` (member_health_daily), `samples_sleep` (member_health_samples sleep segments), `activity_tables` (workouts+cardio). Future-extensible: `vyve_nutrition`, `vyve_session_views`, `health_connect_daily`, etc.

Example seed rules:

```json
-- Walk 10,000 steps
{"source":"daily","metric":"steps","agg":"sum","window":"today_local","op":"gte","value":10000}

-- Sleep 7+ hours
{"source":"samples_sleep","metric":"sleep_asleep_minutes","agg":"duration_sum_minutes","window":"last_night","op":"gte","value":420}

-- Complete a workout
{"source":"activity_tables","metric":"workout_any","agg":"exists","window":"today_local","op":"exists"}

-- 30 minutes of cardio
{"source":"activity_tables","metric":"cardio_duration_minutes","agg":"sum","window":"today_local","op":"gte","value":30}
```

---

## Server-side — extending `member-dashboard` to v51+

For each habit in `member_habits`, evaluate `health_rule` against the routed backing store and return `health_auto_satisfied: true | false | null` (null = no rule or member has no HK connection) and `health_progress: {value, target, unit}` when numeric.

Pseudocode:

```ts
// Single-pass context fetch (not per-rule)
const today = localToday(member.timezone ?? 'Europe/London');
const [dailyRows, sleepSegs, workoutsToday, cardioToday, hkConn] = await Promise.all([
  svc.from('member_health_daily')
     .select('sample_type, date, value, unit')
     .eq('member_email', memberEmail).eq('source', 'healthkit').eq('date', today),
  svc.from('member_health_samples')
     .select('start_at, end_at, metadata')
     .eq('member_email', memberEmail).eq('sample_type', 'sleep')
     .gte('start_at', lastNightStart(today)).lte('start_at', lastNightEnd(today)),
  svc.from('workouts').select('id, duration_minutes, source')
     .eq('member_email', memberEmail).eq('activity_date', today),
  svc.from('cardio').select('id, duration_minutes, cardio_type, source')
     .eq('member_email', memberEmail).eq('activity_date', today),
  svc.from('member_health_connections').select('platform, revoked_at')
     .eq('member_email', memberEmail).eq('platform', 'healthkit').maybeSingle(),
]);

const hkActive = hkConn && !hkConn.revoked_at;

for (const h of memberHabits) {
  const rule = habitLibraryMap.get(h.habit_library_id)?.health_rule;
  if (!rule || !hkActive) { h.health_auto_satisfied = null; continue; }
  const { satisfied, progress } = evaluateRule(rule, { dailyRows, sleepSegs, workoutsToday, cardioToday });
  h.health_auto_satisfied = satisfied;
  h.health_progress = progress;
}
```

Taxonomy helpers (`normWorkoutType`, `STRENGTH_CANON`, `CARDIO_CANON`, `IGNORED_CANON`) extracted from `sync-health-data` into a shared `_shared/taxonomy.ts` module so both EFs cannot drift.

---

## Client behaviour on `habits.html`

On page load:
1. Trigger `healthBridge.sync()` if `isNative()` and last sync > 15 min ago — freshens today's daily row + sleep segments.
2. Fetch habits from member-dashboard v51+; each row now carries `health_auto_satisfied` + `health_progress`.
3. For rows where `health_auto_satisfied === true`:
   - Pre-select "Yes"
   - Show a small Apple Health heart glyph badge in `var(--teal-lt)` (icon-only on mobile, icon + "from Apple Health" on desktop)
   - Member can tap No/Skip to override — badge stays, tick moves
4. For rows where `health_auto_satisfied === false` and rule exists:
   - Leave blank (default state)
   - Show progress hint on unsatisfied rows with numeric rules: `"6,420 / 10,000 steps"` — comes directly from `health_progress`, no extra computation
5. For rows where `health_auto_satisfied === null`:
   - No change from current UX (member has no HK connection, or habit has no rule)

On Submit: normal insert to `daily_habits`. The auto-tick path is UI-only — server state doesn't know the member "intended" yes until they submit.

---

## Pairing with the editing bug fix

Backlog's Critical Missing Piece #2. Without it, a member who submits in the morning gets locked in before HK catches up with an afternoon walk.

Combined session scope:
- Add `unique (member_email, activity_date, habit_id)` on `daily_habits` (0 duplicates in current data — verified 24 April, safe to add)
- Rewrite insert path to `upsert on conflict` updating `habit_completed`
- `habits.html` gets an "Edit today's submission" affordance when a submission already exists
- Auto-tick state can update even after submission (the evaluator runs on every member-dashboard fetch; `habits.html` re-reads on visibility-change)

---

## Per-session breakdown (revised)

| # | Session | Pre-req | Deliverables |
|---|---|---|---|
| ~~0~~ | ~~`healthbridge.js` sleepState metadata patch~~ | — | ✓ Shipped session 5c |
| ~~0a~~ | ~~Workout cap source-aware~~ | — | ✓ Shipped session 7a |
| ~~1~~ | ~~**Habit library additions + schema migration**~~ | ✓ Shipped session 7b (24 April) | ✓ `habit_library.health_rule` column added; 4 Lewis-approved seeds inserted (Walk 10k, Walk 8k, Complete a workout, 30 min cardio); 2 existing habits retrofitted (`10-minute walk`, `Sleep 7+ hours`); `Take the stairs` skipped pending `flightsClimbed` scope |
| ~~2~~ | ~~**Server evaluator**~~ | ✓ Shipped session 2 (24 April) | ✓ `member-dashboard` v51 deployed ACTIVE (`ezbr f0d28cf5...`); `habits` block added to response with `health_auto_satisfied` + `health_progress` per habit; evaluator routes `daily` / `samples_sleep` / `activity_tables`; snapshot-once pattern (no N+1); null-not-false for no-data. `_shared/taxonomy.ts` created and shipped as sibling in both EFs. `sync-health-data` v7 deployed — pure refactor, `promoteMapping` byte-identical to v6. SQL-validated against Dean's live data across all 6 seeded rule shapes. |
| ~~3~~ | ~~**Client UI + editing bug fix combined**~~ | ✓ Shipped session 3 (25 April) | ✓ `habits.html` wired to `member-dashboard` v51; fourth parallel fetch (`fetchDashboardHabits`), autotick pre-render pass stamping `notes='autotick'`, `.hk-progress` hints on unsatisfied rule rows, `.hk-badge` scaffolded hidden (design pending Lewis), `.autotick` card accent, cache key bumped to `vyve_habits_cache_v2`. Editing bug turned out already fixed: upsert-on-conflict in `logHabit`, DELETE-based Undo in `undoHabit`, unique constraint live. No SQL DDL, no SW bump (HTML-only change under network-first sw.js). Commit `25611117e`. |

Total: 3 sessions (1 + 2 shipped 24 April; 3 shipped 25 April — feature fully live). Progress hints merged into session 3 rather than held back as a "nice-to-have" since the evaluator now returns the numbers for free.

---

## Risks & mitigations (revised)

| Risk | Likelihood | Mitigation |
|---|---|---|
| Member submits before HK syncs; their "No" locks in; they complain | Medium (without editing fix) / Low (with) | Pair with editing bug fix — non-negotiable |
| Rule evaluator drifts from sync-health-data's workout-type normalisation | Low | Extract taxonomy into `_shared/taxonomy.ts` — both EFs import the same constants and functions |
| Sleep rule returns 0 for iPhone-only members (no Watch) | High (for that segment) | Evaluator returns `null` (not `false`) when the member has no sleep samples in the window — UI treats null as "no rule", member isn't shown a disappointed blank tick |
| HK returns stale sleep data (member hasn't opened Health app to sync iCloud) | Medium | Trigger `healthBridge.sync()` on habits.html open; accept we can't force an Apple Health app sync |
| Members find auto-tick confusing — feel surveilled not helped | Low | Badge copy + icon tested with Lewis + Alan before rollout; always reversible via tap |
| First-time migration: members with null `health_rule` break the evaluator's JSONB parser | Low | Null-check before rule evaluation; null = manual-only behaviour, no-op |

---

## Open questions parked for later

- Weekly goals (not daily habits) — should they also auto-track progress from HK? Separate product decision; would share the same routing layer cleanly.
- Push notification "Hey, you hit 10k steps — head to the app to log it" — depends on native push (Critical Missing Piece #1).
- Enterprise privacy — auto-tick vs manual: no difference in aggregate visibility (employer sees counts, not origin), but worth explicit check with Alan before Sage pilot.
- How to handle the daily-table `preferred_source` column when a future member has two sources (e.g., HealthKit + Fitbit). Evaluator currently hardcodes `source = 'healthkit'` — needs arbiter logic once multi-source lands.

---

*Plan committed to brain 24 April 2026; revised same day end-of-session 7a against session 6 pipeline reality; session 1 marked shipped end-of-session 7b same day; session 2 marked shipped end-of-session 2 same day; session 3 marked shipped 25 April — plan closed.*
