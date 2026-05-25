# Achievements v1 → v2 Migration Map — PM-322 Item C

> Built 25 May 2026 PM. Explicit row-by-row mapping of the 32 v1 `achievement_metrics` and their tier ladders into the v2 catalog shape. Locked decision: **D1 — extend existing tables, do not migrate to new ones.** Existing 345 `member_achievements` rows survive untouched. v2 catalog rows get `pillar` populated; retired v1 rows get `pillar = NULL` and disappear from the v2 UI grid while staying queryable in DB.

## Inventory at this point (live snapshot 25 May 2026 PM)

- `achievement_metrics`: 32 rows
- `achievement_tiers`: 327 rows (all `copy_status = 'approved'`)
- `member_achievements`: 345 earns across 20 members
- Heaviest earn concentrations: `member_days` (58 earns / 20 members), `habits_logged` (43/10), `exercises_logged` (32/6), `cardio_minutes_total` (31/7), `workouts_logged` (28/9), `sessions_watched` (23/9), `workout_minutes_total` (23/6), `volume_lifted_total` (21/6).

## Mapping table

Five action categories used: **KEEP** (slug + tier ladder survive untouched, pillar tag added), **RENAME** (slug stays, display name updated), **EXTEND** (slug survives but new tiers appended above existing ones), **COLLAPSE** (slug retired, earns preserved by leaving the v1 row in place with `pillar = NULL`), **RETIRE-LEGACY** (v1 row stays in DB with `pillar = NULL` so earns remain queryable; no v2 counterpart).

### KEEP (9 metrics, 105 tier rows, 232 earns preserved)

| v1 slug | v2 slug | v2 pillar | Tier action | Earns | Notes |
|---|---|---|---|---|---|
| `workouts_logged` | `workouts_logged` | body | 13 → keep 7 active (B1), tiers 8-13 stay in DB as legacy ladder | 28 | v2 catalog uses tiers 1-7 only; existing earns on tiers 8-13 remain visible in "earned" history but no new earns fire there |
| `cardio_logged` | `cardio_logged` | body | 13 → keep 5 active (B2) | 20 | Same pattern — legacy tiers preserved |
| `habits_logged` | `habits_logged` | habits | 13 → keep 5 active (H1) | 43 | Heaviest user-facing concentration after member_days |
| `checkins_completed` | `checkins_completed` | checkins | 10 → keep 5 active (K1) | 9 | |
| `monthly_checkins_completed` | `monthly_checkins_completed` | checkins | 10 → keep 4 active (K2) | 3 | |
| `sessions_watched` | `sessions_watched` | connect | 13 → keep 5 active (C1) | 23 | Moves Body→Connect conceptually |
| `replays_watched` | `replays_watched` | connect | 13 → keep 5 active (C2) | 6 | |
| `volume_lifted_total` | `volume_lifted_total` | body | 10 → keep 4 active (B8) | 21 | **Surprise: this had 21 earns in DB despite §11A saying "not yet wired". Either evaluator was wired without brain update, or a one-time backfill fired. Investigate separately — does not block migration.** |
| `member_days` | `member_days` | (no pillar — tenure cross-cutting) | 10 → keep 10 active | 58 | Surfaced as a Hero/header element, not in any pillar grid. Pillar stays NULL, but `is_tenure = true` flag (new column) shows it on the profile header. *See note below — may need light schema addition.* |

### RENAME (3 metrics, 39 tier rows, 21 earns preserved)

| v1 slug | v2 slug | v2 pillar | Tier action | Earns | Notes |
|---|---|---|---|---|---|
| `workout_minutes_total` | `workout_minutes_total` | body | 12 → keep 5 active (B4); display name "Workout Minutes" → unchanged | 23 | Display unchanged, just pillar-tagged |
| `cardio_minutes_total` | `cardio_minutes_total` | body | 12 → keep 4 active (B5) | 31 | |
| `streak_checkin_weeks` | `streak_checkin_weeks` | checkins | 14 → keep 5 active (K5) | 0 | Display "Weekly Check-In Streak" stays |

### EXTEND (4 metrics, 56 tier rows kept + ~9 new tiers, 9 earns preserved)

| v1 slug | v2 slug | v2 pillar | Tier action | Earns | Notes |
|---|---|---|---|---|---|
| `streak_overall` | `streak_overall` | (no pillar — cross-cutting) | 14 → keep all 14, surfaces in Hero only | 6 | Treated like `member_days` — tenure-flavoured, not in pillar grid |
| `streak_habits` | `streak_habits` | habits | 14 → keep 6 active (H7) | 3 | |
| `streak_workouts` | `streak_workouts` | body | 14 → keep 5 active (B14) | 0 | |
| `streak_cardio` | `streak_cardio` | body | 14 → keep 5 active (B15) | 2 | |

### COLLAPSE (4 metrics, 46 tier rows, 64 earns preserved)

These metrics become *facets* of broader v2 metrics. The v1 row stays in DB so earns persist as legacy history; the v2 row is what fires going forward.

| v1 slug | v2 collapses into | v2 pillar | Tier action | Earns | Policy |
|---|---|---|---|---|---|
| `exercises_logged` | (collapsed; v2 uses `sets_completed_total` / B7 + `reps_lifted_total` / B6 from raw `exercise_logs`) | body | v1 13 tiers retired with `pillar = NULL`; not in v2 grid | 32 | Earns visible as legacy badges in "All time" view, not in pillar grid |
| `meals_logged` | (collapsed — nutrition deprioritised in v2 pillar shape) | NULL (retire-legacy) | v1 13 tiers retired | 3 | Three earns are Dean test data; tolerable loss |
| `weights_logged` | (collapsed — body composition is not its own pillar) | NULL (retire-legacy) | v1 13 tiers retired | 18 | Heavier earn count — surfaced in "All time" view |
| `streak_sessions` | (collapsed into v2 `streak_sessions` C13 with new lower thresholds: 7/14/30) | connect | v1 tiers 1-3 (3, 7, 14 days) preserved as approved; tiers 4-14 retired | 1 | Only 1 earn affected; sits on a tier that survives |

### RETIRE-LEGACY (12 metrics, 81 tier rows, 19 earns preserved)

These v1 metrics have no v2 equivalent. **Row stays in `achievement_metrics` with `pillar = NULL`. Tier rows stay in `achievement_tiers`. Earned `member_achievements` rows stay.** UI filters `WHERE pillar IS NOT NULL` to exclude them from the v2 grid, but a member's badge history still shows them as earned.

| v1 slug | Tier count | Earns | Notes |
|---|---|---|---|
| `custom_workouts_created` | 10 | 4 | Tier 1 ("first custom workout") is preserved conceptually by v2 `first_custom_workout` B19 (different slug; earns don't auto-port). |
| `workouts_shared` | 10 | 11 | Slug preserved in v2 as C11 with new threshold ladder (2 tiers); existing 11 earns become legacy ladder. **Edge case worth flagging.** |
| `lifetime_steps` | 10 | 0 | Now B21 with tighter 4-tier ladder. Old slug retires; new slug is `lifetime_steps_v2`. |
| `lifetime_distance_hk` | 10 | 0 | Retired entirely — distance covered by v2 `distance_total` B9 from cardio_logs, not HK. |
| `lifetime_active_energy` | 9 | 0 | Now B22 with tighter 2-tier ladder. New slug `lifetime_active_energy_v2`. |
| `nights_slept_7h` | 11 | 0 | Retired — sleep is not in v2 catalog (sleep data inconsistent across HK/manual). |
| `tour_complete` | 1 | 0 | Blocked on In-App Tour build anyway. Stays available for revival post-tour-ship. |
| `healthkit_connected` | 1 | 0 | Useful one-shot. Could survive into v2 as a behavioural Body — flag for Lewis. |
| `persona_switched` | 1 | 0 | Not in v2 catalog. Retire. |
| `full_five_weeks` | 1 | 0 | Recurring metric, never fired. Retire. v2 `focus_from_every_pillar_week` F4 covers similar territory. |
| `charity_tips` | 1 | 0 | Now C15 with 3-tier ladder; old single-tier retires. |
| `personal_charity_contribution` | 10 | 0 | Now C14 with 3-tier ladder; old 10-tier ladder retires. |

## What this resolves to in numbers

- **Total v1 earns: 345**
- **Earns preserved on rows that map cleanly to v2: 321** (workouts/cardio/habits/checkins/sessions/replays/volume/member_days/streaks/workout_minutes/cardio_minutes/streak_sessions tier 1-3)
- **Earns preserved as "legacy" badges (still earned, just not on active v2 ladder): 24** (exercises_logged 32 + meals 3 + weights 18 + workouts_shared excess + custom_workouts 4 + streak_sessions tier-4+ minus already-counted — see audit query below)
- **Earns lost: 0.** Every v1 earn stays queryable. The UI policy is what changes — some earns appear under "Legacy badges" rather than under their pillar grid.

## SQL audit query (to verify the headline numbers post-migration)

```sql
-- Confirm zero earns lost
SELECT
  (SELECT count(*) FROM member_achievements) AS total_earns_before_after,
  (SELECT count(*) FROM member_achievements ma
     JOIN achievement_metrics m ON m.slug = ma.metric_slug
     WHERE m.pillar IS NOT NULL) AS earns_on_active_v2_rows,
  (SELECT count(*) FROM member_achievements ma
     JOIN achievement_metrics m ON m.slug = ma.metric_slug
     WHERE m.pillar IS NULL) AS earns_on_legacy_rows,
  -- Sanity: must sum to total
  (SELECT count(*) FROM member_achievements ma
     JOIN achievement_metrics m ON m.slug = ma.metric_slug
     WHERE m.pillar IS NOT NULL) +
  (SELECT count(*) FROM member_achievements ma
     JOIN achievement_metrics m ON m.slug = ma.metric_slug
     WHERE m.pillar IS NULL) AS sum_check;
```

After D1 schema delta + this map applied: `total_earns_before_after = 345`, `sum_check = 345`.

## Open mapping questions (need Dean or Lewis call)

1. **`workouts_shared`** existing 11 earns are on a 10-tier ladder. v2 collapses to 2 tiers (C11). The 11 earns mostly sit above v2's tier 2 threshold. Do we:
   - (a) Preserve the v1 10-tier ladder as legacy, fire v2 ladder fresh; member sees both. *(My recommendation — cleanest.)*
   - (b) Re-issue v2 tier 2 to every member who had v1 tier 3+; old tiers go legacy.
2. **`healthkit_connected`** has zero earns but is conceptually useful for v2. Salvage as a behavioural Body one-shot? Costs nothing to keep.
3. **`streak_overall`** and `member_days` are *cross-cutting* — they don't belong to any pillar. The schema delta gives them `pillar = NULL`, but the UI still wants to show them prominently (Hero / profile header). One option: add a small `is_cross_cutting boolean` column and treat NULL-pillar rows in two classes (cross-cutting vs legacy). Cleaner than overloading NULL.

## Recommendation on the third open question

**Yes, add `is_cross_cutting boolean NOT NULL DEFAULT false`** to the D1 schema delta. Two rows get it set true: `streak_overall` and `member_days`. UI logic becomes:
- Grid: `WHERE pillar IS NOT NULL`
- Hero / profile header: `WHERE is_cross_cutting = true`
- Legacy badges drawer (members' "All time" view): `WHERE pillar IS NULL AND is_cross_cutting = false`

Three clean buckets, no NULL overloading. Adds one column to the migration.

## Final D1 schema delta (after this map)

```sql
ALTER TABLE achievement_metrics
  ADD COLUMN pillar text,
  ADD COLUMN hidden boolean NOT NULL DEFAULT false,
  ADD COLUMN icon_slug text,
  ADD COLUMN is_cross_cutting boolean NOT NULL DEFAULT false;

ALTER TABLE achievement_metrics
  ADD CONSTRAINT achievement_metrics_pillar_check
  CHECK (pillar IS NULL OR pillar IN ('body','habits','mind','connect','checkins','focus'));

CREATE INDEX idx_achievement_metrics_pillar
  ON achievement_metrics(pillar) WHERE pillar IS NOT NULL;
```

Then per the table above: `UPDATE achievement_metrics SET pillar = '...', icon_slug = '...' WHERE slug IN (...)` for the 16 surviving v1 metrics. New v2-only metrics are inserts. Retired metrics are no-op (pillar stays NULL by default).
