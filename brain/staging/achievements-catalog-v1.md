# Achievements v2 Catalog (draft for build) — PM-322

> Rebuilt 25 May 2026 PM in the session after the original workbench-only draft was lost on conversation reset. Source-of-truth structural decisions all confirmed from the PM-322 handover prompt + the past-chat fragments produced before compaction. Tier counts here represent the **target shape**; per-tier copy is Lewis's pass (item A). v1 catalog continues to back the live grid via member-achievements EF until v2 build ships.

## Headline

| Pillar | Achievements | Tiers |
|---|---|---|
| Body | 22 | 76 |
| Habits | 11 | 36 |
| Mind | 13 | 46 |
| Connect | 17 | 57 |
| Check-ins | 9 | 33 |
| Focus | 8 | 24 |
| Hidden (cross-pillar) | 10 | 10 |
| **Total** | **90** | **282** |

## Locked structural decisions (from PM-322 handover, do not re-open)

1. **Catalog shape:** 90 achievements, ~282 tiers across 6 pillars + 10 hidden.
2. **Layout:** Direction C — Hero (latest unlock + next-to-unlock + recent) over a collapsed pillar-grouped map. Six pillar cards, tap to expand.
3. **Tier pattern:** Pattern 3 — one row per metric that climbs through tiers. Earned tiers remembered via gold dots underneath the row, plus the badge itself changing as the member climbs.
4. **Badge visual:** Path B — Lucide icon inside a tier-coloured frame. Icon constant per metric; frame evolves bronze → silver → gold → sapphire → ruby → emerald → amethyst → pearl → obsidian → diamond. Tier number in corner pip. Locked = dashed-outline frame, faded icon, no pip.
5. **Tier naming:** "Sapphire · The Warrior" — universal gemstone + Lewis-approved VYVE name. v1 cert names (Warrior, Architect, Relentless, Elite, Explorer) preserved where they fit, extended to fill up to 10 tiers.
6. **PBs out of catalog.** Single-session bests and rolling-PB metrics (heaviest lift, furthest run, etc.) live inline on the workout/cardio page, Strava-style. Different feature.
7. **Notifications batched** when multiple earn at once.
8. **Hidden achievements: 10**, sprinkled across pillars. Treatment: "Hidden achievement · Keep showing up honestly" placeholder slot — slot exists, reward not spoiled.

---

## BODY — 22 achievements, 76 tiers

Workouts + cardio + movement. Where the data is richest. Three sub-streams: workouts (weights), cardio, movement.

**Lucide icons (locked at design time):**
- `dumbbell` — workouts
- `footprints` — cardio
- `wind` — movement
- `activity` (pulse) — reps lifted
- `route` — distance
- `trophy` — single-session bests / programme-completion
- `timer` — longest single workout/cardio
- `sunrise` — early-morning behavioural

### Cumulative (9 achievements, 41 tiers)

| # | Slug | Icon | Tiers | Threshold ladder |
|---|------|------|-------|------------------|
| B1 | `workouts_logged` | dumbbell | 7 | 10, 30, 60, 100, 250, 500, 1000 |
| B2 | `cardio_logged` | footprints | 5 | 10, 30, 60, 100, 250 |
| B3 | `movement_sessions_logged` | wind | 5 | 10, 30, 60, 100, 250 |
| B4 | `workout_minutes_total` | timer | 5 | 300, 1000, 3000, 10000, 30000 |
| B5 | `cardio_minutes_total` | timer | 4 | 300, 1000, 3000, 10000 |
| B6 | `reps_lifted_total` | activity | 4 | 1000, 5000, 25000, 100000 |
| B7 | `sets_completed_total` | activity | 4 | 100, 500, 2500, 10000 |
| B8 | `volume_lifted_total` | dumbbell | 4 | 10000, 100000, 500000, 1000000 |
| B9 | `distance_total` | route | 5 | 25, 100, 500, 1000, 5000 (km) |

### Behavioural (4 achievements, 11 tiers)

| # | Slug | Icon | Tiers | Trigger |
|---|------|------|-------|---------|
| B10 | `workout_before_7am` | sunrise | 4 | logged a workout before 7am × 3, 5, 10, 25 |
| B11 | `workout_days_in_a_row` | dumbbell | 3 | 3, 5, 7 days with a logged workout |
| B12 | `muscle_groups_week` | activity | 1 | all main muscle groups in one week (one-shot, recurring) |
| B13 | `programme_week_complete` | trophy | 3 | complete a full programme week × 1, 5, 20 |

### Streaks (3 achievements, 14 tiers)

| # | Slug | Icon | Tiers | Threshold |
|---|------|------|-------|-----------|
| B14 | `streak_workouts` | dumbbell | 5 | 3, 7, 14, 30, 60 day workout streaks |
| B15 | `streak_cardio` | footprints | 5 | 3, 7, 14, 30, 60 day cardio streaks |
| B16 | `streak_movement` | wind | 4 | 3, 7, 14, 30 day movement streaks |

### One-shots (4 achievements, 4 tiers)

| # | Slug | Icon | Tiers | Trigger |
|---|------|------|-------|---------|
| B17 | `first_workout` | dumbbell | 1 | first workout logged |
| B18 | `first_cardio` | footprints | 1 | first cardio session logged |
| B19 | `first_custom_workout` | dumbbell | 1 | first custom workout created |
| B20 | `programme_complete_8wk` | trophy | 1 | complete a full 8-week programme |

### HK lifetime (HK-gated, 2 achievements, 6 tiers)

| # | Slug | Icon | Tiers | Threshold |
|---|------|------|-------|-----------|
| B21 | `lifetime_steps` | footprints | 4 | 100k, 500k, 1M, 5M lifetime steps |
| B22 | `lifetime_active_energy` | activity | 2 | 100k, 500k lifetime active kcal |

**Body total: 22 achievements, 76 tiers.** Heavy on cumulative because that's where Body data is richest. Behavioural row (`workout_before_7am`, `muscle_groups_week`) provides the variety hooks.

---

## HABITS — 11 achievements, 36 tiers

Simple yes/no logging. No PBs apply. Heavy on cumulative + streaks + behavioural breadth.

**Icons:** `check-circle` (default), `sunrise` (morning), `repeat` (same habit), `calendar-check` (full-day).

### Cumulative (3 achievements, 11 tiers)

| # | Slug | Icon | Tiers | Threshold |
|---|------|------|-------|-----------|
| H1 | `habits_logged` | check-circle | 5 | 30, 100, 300, 750, 1500 |
| H2 | `distinct_habit_types` | check-circle | 3 | 3, 5, 10 distinct habit types tried |
| H3 | `same_habit_repeats` | repeat | 3 | same habit logged 10, 50, 200 times running |

### Single-day (3 achievements, 7 tiers)

| # | Slug | Icon | Tiers | Trigger |
|---|------|------|-------|---------|
| H4 | `three_habits_day` | check-circle | 1 | 3 habits in a single day |
| H5 | `five_habits_day` | check-circle | 1 | 5 habits in a single day |
| H6 | `all_assigned_habits_day` | calendar-check | 5 | all assigned habits in a single day × 1, 3, 7, 14, 30 |

### Streaks (2 achievements, 10 tiers)

| # | Slug | Icon | Tiers | Threshold |
|---|------|------|-------|-----------|
| H7 | `streak_habits` | check-circle | 6 | 3, 7, 14, 30, 60, 100 day streak |
| H8 | `seven_day_including_weekend` | calendar-check | 4 | 7 days in a row including the weekend × 1, 3, 6, 12 times |

### Behavioural (3 achievements, 8 tiers)

| # | Slug | Icon | Tiers | Trigger |
|---|------|------|-------|---------|
| H9 | `habits_before_9am` | sunrise | 3 | habits logged before 9am × 5, 10, 25 |
| H10 | `first_habit` | check-circle | 1 | first habit logged ever |
| H11 | `weekly_habits_total` | check-circle | 4 | total habits in a week reaches 7, 14, 21, 28 |

---

## MIND — 13 achievements, 46 tiers

Breathwork, journals, meditation, affirmations, visualisation. Mind pillar shipped via PM-173 (April 2026). Data lives in `mind_activities` / `mind_*` tables. **Phil HAVEN sign-off required** on any copy that frames low-wellbeing days as positive achievement.

**Icons:** `brain` (default), `wind` (breathwork), `book-open` (journal), `flame` (meditation), `heart` (affirmation), `eye` (visualisation), `sunrise` (morning).

### Cumulative (5 achievements, 21 tiers)

| # | Slug | Icon | Tiers | Threshold |
|---|------|------|-------|-----------|
| M1 | `mind_sessions_logged` | brain | 5 | 10, 30, 60, 100, 250 |
| M2 | `breathwork_sessions` | wind | 4 | 5, 15, 50, 150 |
| M3 | `journal_entries` | book-open | 4 | 5, 15, 50, 150 |
| M4 | `meditation_sessions` | flame | 4 | 5, 15, 50, 150 |
| M5 | `mind_minutes_total` | brain | 4 | 100, 500, 2000, 10000 (minutes) |

### Variety (2 achievements, 5 tiers)

| # | Slug | Icon | Tiers | Trigger |
|---|------|------|-------|---------|
| M6 | `distinct_mind_types` | brain | 3 | 2, 3, 5 distinct mind types tried |
| M7 | `affirmations_saved` | heart | 2 | 5, 20 affirmations saved |

### Streaks (2 achievements, 9 tiers)

| # | Slug | Icon | Tiers | Threshold |
|---|------|------|-------|-----------|
| M8 | `streak_mind` | brain | 5 | 3, 7, 14, 30, 60 day streak |
| M9 | `meditation_streak` | flame | 4 | 5, 10, 21, 50 consecutive meditation days |

### Behavioural (2 achievements, 7 tiers)

| # | Slug | Icon | Tiers | Trigger |
|---|------|------|-------|---------|
| M10 | `mind_before_8am` | sunrise | 4 | mind session before 8am × 3, 10, 25, 50 |
| M11 | `visualisation_logged` | eye | 3 | visualisation × 1, 10, 30 |

### One-shots (2 achievements, 4 tiers, behavioural-as-milestone)

| # | Slug | Icon | Tiers | Trigger |
|---|------|------|-------|---------|
| M12 | `first_mind_session` | brain | 1 | first mind session of any type |
| M13 | `long_meditation` | timer | 3 | meditation ≥ 10min, 20min, 45min single session |

---

## CONNECT — 17 achievements, 57 tiers

Live sessions, chat, reactions, charity, community. Biggest pillar after Body. Reflects social-pillar emphasis in VYVE positioning.

**Icons:** `users` (default), `video` (sessions), `play-circle` (replays), `heart` (reactions), `gift` (charity), `share` (shared), `message-circle` (chat), `calendar` (programmes).

### Cumulative (6 achievements, 26 tiers)

| # | Slug | Icon | Tiers | Threshold |
|---|------|------|-------|-----------|
| C1 | `sessions_watched` | video | 5 | 5, 15, 50, 150, 500 |
| C2 | `replays_watched` | play-circle | 5 | 5, 15, 50, 150, 500 |
| C3 | `session_minutes_yoga` | video | 4 | 60, 300, 1000, 3000 |
| C4 | `session_minutes_mindfulness` | video | 4 | 60, 300, 1000, 3000 |
| C5 | `session_minutes_therapy` | video | 4 | 60, 300, 1000, 3000 |
| C6 | `session_minutes_education` | video | 4 | 60, 300, 1000, 3000 |

### Social (5 achievements, 16 tiers)

| # | Slug | Icon | Tiers | Threshold |
|---|------|------|-------|-----------|
| C7 | `reactions_given` | heart | 4 | 5, 25, 100, 500 |
| C8 | `reactions_received` | heart | 4 | 5, 25, 100, 500 |
| C9 | `checkins_with_reactions` | heart | 3 | 1, 10, 50 of your check-ins received reactions |
| C10 | `chat_messages_posted` | message-circle | 3 | 10, 100, 1000 chat messages in live sessions |
| C11 | `workouts_shared` | share | 2 | shared a workout × 1, 10 |

### Variety (2 achievements, 6 tiers)

| # | Slug | Icon | Tiers | Trigger |
|---|------|------|-------|---------|
| C12 | `distinct_session_categories` | video | 3 | 3, 5, 8 distinct session categories tried |
| C13 | `streak_sessions` | video | 3 | 7, 14, 30 day session attendance streak |

### Charity (2 achievements, 6 tiers, recurring)

| # | Slug | Icon | Tiers | Trigger |
|---|------|------|-------|---------|
| C14 | `personal_charity_contribution` | gift | 3 | personally triggered 1, 5, 20 charity months |
| C15 | `charity_tips` | gift | 3 | 1, 10, 100 collective milestones reached during your tenure (recurring) |

### One-shots (2 achievements, 3 tiers)

| # | Slug | Icon | Tiers | Trigger |
|---|------|------|-------|---------|
| C16 | `first_session_watched` | video | 1 | first live session attended |
| C17 | `first_replay_watched` | play-circle | 2 | first replay × 1, then 10 replays |

---

## CHECK-INS — 9 achievements, 33 tiers

Weekly wellbeing, monthly pillar check-ins, daily mood. **Phil HAVEN sign-off required** — `honest_checkin_tier5` and improvement-based metrics need clinical validation.

**Icons:** `clipboard-check` (default), `calendar-days` (weekly), `calendar-range` (monthly), `smile` (mood), `trending-up` (improvement), `pencil` (text response).

### Cumulative (4 achievements, 16 tiers)

| # | Slug | Icon | Tiers | Threshold |
|---|------|------|-------|-----------|
| K1 | `checkins_completed` | calendar-days | 5 | 4, 12, 26, 52, 104 (weekly) |
| K2 | `monthly_checkins_completed` | calendar-range | 4 | 3, 6, 12, 24 monthly check-ins |
| K3 | `daily_mood_checkins` | smile | 4 | 7, 30, 90, 365 daily mood entries |
| K4 | `checkin_text_responses` | pencil | 3 | wrote a text response 5, 25, 100 times |

### Streaks (2 achievements, 8 tiers)

| # | Slug | Icon | Tiers | Threshold |
|---|------|------|-------|-----------|
| K5 | `streak_checkin_weeks` | calendar-days | 5 | 4, 12, 26, 52, 104 consecutive weeks |
| K6 | `daily_mood_streak` | smile | 3 | 7, 30, 90 day mood streak |

### Improvement (2 achievements, 7 tiers, **Phil approval required**)

| # | Slug | Icon | Tiers | Trigger |
|---|------|------|-------|---------|
| K7 | `weekly_score_climb` | trending-up | 4 | 2, 3, 5, 8 consecutive weekly scores improving |
| K8 | `monthly_avg_improved` | trending-up | 3 | monthly avg improves over previous month × 1, 3, 6 times |

### One-shots (1 achievement, 2 tiers)

| # | Slug | Icon | Tiers | Trigger |
|---|------|------|-------|---------|
| K9 | `first_checkin` | calendar-days | 2 | first check-in submitted, first 5 check-ins |

---

## FOCUS — 8 achievements, 24 tiers

Focus cards from PM-173/PM-180 Mind work. New pillar — no v1 equivalent.

**Icons:** `target` (default), `layers` (pillars), `check-square` (complete), `repeat` (same focus).

### Cumulative (3 achievements, 11 tiers)

| # | Slug | Icon | Tiers | Threshold |
|---|------|------|-------|-----------|
| F1 | `focus_cards_completed` | check-square | 5 | 5, 20, 50, 150, 500 |
| F2 | `daily_focus_all_complete` | target | 3 | all today's focus cards × 1, 10, 30 days |
| F3 | `same_focus_completed_10x` | repeat | 3 | same focus card × 10, 25, 50 times |

### Variety (2 achievements, 4 tiers)

| # | Slug | Icon | Tiers | Trigger |
|---|------|------|-------|---------|
| F4 | `focus_from_every_pillar_week` | layers | 2 | focus from every pillar in one week × 1, 5 times (recurring) |
| F5 | `distinct_focuses_tried` | target | 2 | 5, 15 distinct focus cards tried |

### Streaks (2 achievements, 6 tiers)

| # | Slug | Icon | Tiers | Threshold |
|---|------|------|-------|-----------|
| F6 | `streak_focus` | target | 4 | 3, 7, 14, 30 day focus streak |
| F7 | `weekly_focus_completion` | target | 2 | hit 100% weekly focus completion × 1, 5 weeks |

### One-shots (1 achievement, 3 tiers)

| # | Slug | Icon | Tiers | Trigger |
|---|------|------|-------|---------|
| F8 | `first_focus_complete` | target | 3 | first focus × 1, 5, 25 completions |

---

## HIDDEN (cross-pillar) — 10 achievements, 10 tiers

All one-shots. Treatment: visible placeholder slot ("Hidden achievement · Keep showing up honestly"), reward not spoiled until earned.

| # | Slug | Icon | Trigger |
|---|------|------|---------|
| HD1 | `honest_checkin_tier5` | clipboard-check | wellbeing ≤ 4 submitted 5 times — **Phil approval required** |
| HD2 | `came_back` | sunrise | logged anything after 14+ days away |
| HD3 | `full_house` | layers | touched all 6 pillars in a single day |
| HD4 | `first_light` | sunrise | logged something before 6am |
| HD5 | `owl` | moon | logged something after 11pm |
| HD6 | `reciprocity` | heart | reacted to 25 different members' check-ins |
| HD7 | `streak_saver` | flame | logged on the final possible day before a streak would break × 3 times |
| HD8 | `anniversary` | gift | logged on your one-year join date |
| HD9 | `quiet_wins` | layers | completed a focus from every pillar in one week (delivered silently) |
| HD10 | `comeback_PB` | trophy | beat a personal session record after 14+ day gap |

---

## Notes on PBs (out of scope)

Personal-best tracking was explicitly **dropped from the achievements catalog** in the design lock. Single-session bests (heaviest lift, furthest run, longest workout, etc.) live inline post-set on the workout/cardio page — Strava model: the activity is the home, not the achievements page. `comeback_PB` is the *exception* — it's hidden, fires once, and rewards behaviour (long gap + bounce-back) rather than the PB itself.

This explains the tier-count gap vs v1 (327 → 282). PBs alone would have added ~30-40 tiers across single-session metrics; their removal more than offsets the new behavioural variety in Mind/Focus/Connect.

## Note on the v1 → v2 migration

See `brain/staging/achievements-migration-map.md` for the explicit slug-by-slug mapping policy. Headline:
- 9 v1 slugs survive unchanged as v2 metrics (workouts_logged, cardio_logged, habits_logged, etc.).
- 3 v1 slugs survive with renamed display + new pillar tag (member_days, streak_overall, sessions_watched).
- 4 v1 slugs collapsed into v2 metrics with broader scope (e.g. exercises_logged + sets_completed → sets_completed_total).
- 16 v1 slugs retired but **rows kept in `achievement_metrics`** with `pillar = NULL` so existing earns in `member_achievements` remain queryable. UI filter `WHERE pillar IS NOT NULL` excludes them from the grid.
- ~13 net-new v2 slugs need from-scratch Lewis copy across ~80-90 new tier rows.

## Note on Phil sign-off (item B)

Achievements that need explicit HAVEN-aware framing review before copy ships:
- All of MIND pillar (M1-M13) — voice review even where mechanics are fine
- `honest_checkin_tier5` (HD1) — therapeutic soundness of rewarding low-wellbeing submission
- `weekly_score_climb` (K7) and `monthly_avg_improved` (K8) — improvement-based metrics could feel punitive in low weeks
- `streak_saver` (HD7) — implies pressure, needs gentle framing
- `came_back` (HD2) — first message after a long absence; framing matters
