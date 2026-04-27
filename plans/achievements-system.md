# Achievements System — Architecture

**Status:** Phase 1 (data layer) **shipped 27 April 2026**. Phase 2 (sweep EF + push wiring) and Phase 3 (UI) are not yet shipped.

## Goals

- Reward members across the full breadth of platform engagement, not just streaks. 34 metrics, 349 tiers in current catalog.
- Cheap to evaluate. Inline metrics evaluated synchronously in `log-activity` (one COUNT or `member_home_state` field read per metric); sweep metrics evaluated nightly.
- Deterministic, idempotent. Re-evaluating doesn't double-insert. Re-seeds preserve Lewis-approved copy.
- Unblocked from copy. Engineering placeholders ship the data layer; Lewis approves copy in parallel; UI ships when copy lands.

## Tables

```
achievement_metrics  (slug PK, category, display_name, unit, source, hidden_without_hk, is_recurring, sort_order)
achievement_tiers    (metric_slug, tier_index PK, threshold, title, body, copy_status)
member_achievements  (id, member_email, metric_slug, tier_index, earned_at, seen_at, notified_at; UNIQUE on (email,slug,idx))
```

`copy_status` is the gate that lets re-seeds run safely: the upsert clause is `CASE WHEN copy_status='approved' THEN existing.title ELSE EXCLUDED.title END` so Lewis-approved rows survive forever once approved.

## Trigger sources

Each metric is either `inline` (cheap, evaluated synchronously inside `log-activity` after every successful insert) or `sweep` (evaluated nightly by `achievements-sweep` EF, due Phase 2).

| Source | Metrics |
|--------|---------|
| inline | habits_logged, workouts_logged, cardio_logged, sessions_watched, replays_watched, checkins_completed, monthly_checkins_completed, meals_logged, weights_logged, exercises_logged, custom_workouts_created, workouts_shared, running_plans_generated, workout_minutes_total, cardio_minutes_total, cardio_distance_total, streak_overall, streak_habits, streak_workouts, streak_cardio, streak_sessions, streak_checkin_weeks, persona_switched |
| sweep  | lifetime_steps, lifetime_distance_hk, lifetime_active_energy, nights_slept_7h, full_five_weeks, charity_tips, personal_charity_contribution, member_days, tour_complete, healthkit_connected |

`charity_tips` and `personal_charity_contribution` are inline-tagged in the catalog but in practice need access to the global charity_total state — they'll likely be moved to sweep in Phase 2 unless we add a charity-side trigger that fires per-member.

## Phase split

### Phase 1 — Data layer (shipped 27 April 2026)

- Migration `create_achievements_schema`.
- Seed: 34 metrics × 349 tiers, all placeholder copy.
- `_shared/achievements.ts` — evaluator + dashboard payload builder, with 60s in-memory catalog cache.
- `log-activity` v22 — evaluates inline metrics on every activity insert, returns `earned_achievements[]` in response, writes `member_notifications` rows for push.
- `member-dashboard` v55 — surfaces `achievements: { unseen, inflight, recent, earned_count, hk_connected }`.
- Backfill: 147 retroactive earnings across 13 members (single SQL UNION ALL CTE, no EF call).
- `playbooks/achievements-copy-for-lewis.md` — bulk Lewis approval doc.

### Phase 2 — Sweep + native push

- `achievements-sweep` EF on a daily cron (23:00 UK, extending the `vyve_schema_snapshot` pattern). Handles all sweep-source metrics. Runs `evaluateInline()` style logic but for sweep metrics — `member_days = NOW() - members.created_at`, HK lifetime aggregations, etc.
- Patch `_shared/achievements.ts`: `shared_workouts` uses `shared_by` not `member_email` (silent skip currently).
- Native push foundation — `@capacitor/push-notifications` plugin in vyve-capacitor, `push_subscriptions_native` table, `push-send-native` EF for APNs/FCM.
- Tour completion column on `members` (or signal — TBD with Lewis).
- Achievement push fan-out — extend the existing web-push sender to pick up `member_notifications.type LIKE 'achievement_earned_%'` rows.

### Phase 3 — UI (blocked on Lewis copy)

- Toast queue: client polls `unseen[]` and toasts each one, PATCHes `seen_at` via PostgREST direct. RLS allows authenticated UPDATE on own seen_at.
- Dashboard slot: `inflight[]` rendered as 3 progress bars showing N/threshold; `recent[]` rendered as a horizontal badge strip.
- `achievements.html` full grid: 34 cards, one per metric, showing earned tiers vs unearned. HK-gated metrics hidden entirely for non-HK members.
- Decision required: how to handle the 147 retroactive earnings — batch celebration or silent backfill. Default leaning to celebration ("Look at everything you've already achieved").

## Idempotency rules

- `evaluateInline()` returns only the rows it inserts this call; already-earned rows aren't re-returned.
- Recurring metrics (`full_five_weeks`, `charity_tips`) use `tier_index` as the nth occurrence ordinal, not a threshold position. Sweep increments to next index when the criterion is met again.
- `member_notifications` dedupe: type pattern `achievement_earned_<slug>_<idx>` is unique per member, queried with `IN.(...)` filter to skip already-written rows.

## Catalog cache

`_shared/achievements.ts` caches the full catalog (`achievement_metrics` + `achievement_tiers`) for 60 seconds in module-level memory. Edge Function instances are reused for ~1-15 min so the cache hits across multiple invocations. When the catalog changes (Lewis copy approved, new metric added), wait up to 60s for new instances to pick it up — or restart the EF to force a refresh.

## Decisions to lock with Lewis

1. Replace 349 placeholder titles + bodies (the copy doc).
2. Threshold sanity check on the ladders.
3. Retroactive earning policy — batch celebrate or silent backfill the 147 already-earned rows.
4. HAVEN persona blocker — does HAVEN-only access add an achievement metric, or is that out of scope until clinical sign-off? (Probably out of scope until Phil signs off.)
