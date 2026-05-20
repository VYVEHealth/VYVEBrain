# Offline-Correctness Audit

**Purpose:** The pre-bundle gate for Phase 4 of the Bundle-Ready campaign. Verifies every member-facing page renders honestly when the device is offline.

**When to run:** Before every OTA bundle that includes new pages OR new write paths. Mandatory before the first-ever OTA (the imminent Phase 5 ship).

**How to run:** Two passes — a static schema/code audit (filled below as a table), then a dynamic airplane-mode device walk on Dean's iPhone with `server.url` pointing at online.vyvehealth.co.uk and network killed at OS level.

---

## Static audit framework

Per-page table. Filled in by code inspection + Supabase schema inspection.

| Page | Reads | Read source | Dexie-first? | Writes | Write pattern | `client_id` idempotency | §23.10 carve-outs |
|---|---|---|---|---|---|---|---|
| index.html (home) | TBD | TBD | TBD | TBD | TBD | TBD | TBD |
| habits.html | TBD | TBD | TBD | TBD | TBD | TBD | TBD |
| workouts.html | TBD | TBD | TBD | TBD | TBD | TBD | TBD |
| workouts-session.js | TBD | TBD | TBD | TBD | TBD | TBD | TBD |
| workouts-programme.js | TBD | TBD | TBD | TBD | TBD | TBD | TBD |
| cardio.html | TBD | TBD | TBD | TBD | TBD | TBD | TBD |
| movement.html | TBD | TBD | TBD | TBD | TBD | TBD | TBD |
| exercise.html | TBD | TBD | TBD | TBD | TBD | TBD | TBD |
| nutrition.html | TBD | TBD | TBD | TBD | TBD | TBD | TBD |
| log-food.html | TBD | TBD | TBD | TBD | TBD | TBD | TBD |
| settings.html | TBD | TBD | TBD | TBD | TBD | TBD | TBD |
| wellbeing-checkin.html | TBD | TBD | TBD | TBD | TBD | TBD | TBD |
| monthly-checkin.html | TBD | TBD | TBD | TBD | TBD | TBD | TBD |
| certificates.html | TBD | TBD | TBD | TBD | TBD | TBD | TBD |
| engagement.html | TBD | TBD | TBD | TBD | TBD | TBD | TBD |
| leaderboard.html | TBD | TBD | TBD | TBD | TBD | TBD | TBD |
| sessions.html | TBD | TBD | TBD | TBD | TBD | TBD | TBD |
| running-plan.html | TBD | TBD | TBD | TBD | TBD | TBD | TBD |
| login.html | TBD | TBD | TBD | TBD | TBD | TBD | TBD |
| set-password.html | TBD | TBD | TBD | TBD | TBD | TBD | TBD |
| mind.html | Dexie | Dexie | YES | mind_activities | §23.39 | YES (PM-183) | n/a |
| breathwork.html | Dexie | Dexie | YES | mind_activities | §23.39 | YES (PM-174) | n/a |
| journal.html | Dexie | Dexie | YES | mind_activities | §23.39 | YES (PM-175) | n/a |
| affirmations.html | Dexie | Dexie | YES | mind_activities + affirmation_favourites | §23.39 | YES (PM-176) | n/a |
| meditation.html | Dexie | Dexie | YES | mind_activities | §23.39 | YES (PM-180/183) | YouTube CDN for thumbnails (Tier 3, online-only) |
| sleep.html | Dexie | Dexie | YES | mind_activities | §23.39 | YES (PM-180/183) | YouTube CDN for thumbnails |
| visualisation.html | Dexie | Dexie | YES | mind_activities | §23.39 | YES (PM-180/183) | YouTube CDN for thumbnails |

Mind pages pre-filled per their commit notes. Body / Connect / Home / Engagement / Check-in pages need walking through.

---

## Schema audit

Every member-data Supabase table needs:

1. `updated_at TIMESTAMPTZ` column.
2. `BEFORE UPDATE` trigger that sets `updated_at = NOW()` on every row update.

Enumerate via:

```sql
SELECT
  t.table_name,
  EXISTS (
    SELECT 1 FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.table_name = t.table_name
      AND c.column_name = 'updated_at'
  ) AS has_updated_at,
  EXISTS (
    SELECT 1 FROM pg_trigger tr
    JOIN pg_class cl ON cl.oid = tr.tgrelid
    WHERE cl.relname = t.table_name
      AND tr.tgname LIKE '%updated_at%'
  ) AS has_trigger
FROM information_schema.tables t
WHERE t.table_schema = 'public'
  AND t.table_type = 'BASE TABLE'
ORDER BY t.table_name;
```

Add the trigger to any member-data table missing it. Catalogue tables (workout_plans, habit_library, nutrition_common_foods, personas, service_catalogue, knowledge_base) ALSO need it — delta-pull catalogue updates depend on `updated_at`.

---

## Idempotency audit

Every write surface must:

1. Generate a `client_id` UUID client-side at write time (`crypto.randomUUID()`).
2. Include `client_id` in the Supabase POST body.
3. Server table has `client_id` column with `UNIQUE` constraint OR the POST uses `Prefer: resolution=ignore-duplicates` with `on_conflict=client_id`.

**Status by table (to be filled during audit):**

| Table | Client-side `client_id`? | Server column? | UNIQUE? | Notes |
|---|---|---|---|---|
| mind_activities | YES | YES | YES | PM-173, gold standard |
| workouts | TBD | TBD | TBD | |
| cardio | TBD | TBD | TBD | |
| daily_habits | TBD | TBD | TBD | |
| exercise_logs | TBD | TBD | TBD | |
| custom_workouts | TBD | TBD | TBD | |
| exercise_swaps | TBD | TBD | TBD | |
| weight_logs | TBD | TBD | TBD | |
| nutrition_logs | TBD | TBD | TBD | |
| weekly_scores | TBD | TBD | TBD | |
| wellbeing_checkins | TBD | TBD | TBD | |
| monthly_checkins | TBD | TBD | TBD | |
| session_views | TBD | TBD | TBD | |
| replay_views | TBD | TBD | TBD | |

---

## Airplane-mode device walk procedure

1. Dean's iPhone with `server.url` pointing at `https://online.vyvehealth.co.uk`.
2. Open app, log in, hydrate (let first-login complete).
3. Open every page once, log in to background.
4. Force-quit app.
5. Enable Airplane Mode.
6. Re-launch app.
7. Walk every page in order. Record render behaviour:
   - **Renders** — page paints real data from Dexie
   - **Spinner** — page hangs on loading state (BUG)
   - **Empty** — page paints but with empty/placeholder data (BUG if data should exist in Dexie)
   - **Broken** — page errors out, shows error banner, or fails to render (BUG)
   - **Honest offline** — page paints with explicit "needs connection" state (§23.10 carve-out, OK)
8. For each writeable surface, attempt a write while offline. Confirm:
   - UI updates instantly (optimistic)
   - Write queues to `_sync_queue` (verify via `?debug=queue`)
   - Re-enable network → drain fires → write persists to Supabase
9. Cold-start-no-network: force-quit, keep airplane mode on, re-launch. App should open to a recognisable shell (Dexie-backed) and the login screen should detect no-connection if member is signed out.

---

## Critical paths

These specific scenarios must work offline-equivalently:

- **Log a habit completion.** Tap → UI ticks immediately → close app → re-open online → habit syncs.
- **Complete a workout session.** Open workouts → start session → record exercises → finish → UI updates → close app → re-open online → session + exercise_logs sync.
- **Log a mind activity (any of the six surfaces).** Open page → engage 30s+ → UI shows logged → close app → re-open online → mind_activity syncs.
- **View today's progress.** Home page opens → Today's progress card shows correct counts from Dexie.
- **Switch theme.** Settings → toggle theme → UI updates → close app → re-open → theme persisted.

These specific scenarios are EXPECTED to fail offline (honest §23.10 carve-outs):

- AI weekly check-in submit (requires Anthropic round-trip — show "this needs a connection" state)
- Live session video stream
- Live session chat (Realtime)
- Leaderboard ranking (cross-member aggregate — show last-cached ranking with "last updated X ago")
- Running plan generation (Anthropic)
- New certificate display (server cron-generated)
- First-ever sign-in (auth.users creation requires network)

Anything in the first list that fails offline is a P0 fix before bundling. Anything in the second list that fails offline gracefully (with a designed state) is OK.

---

## Status

**Filled in:** mind.html, breathwork.html, journal.html, affirmations.html, meditation.html, sleep.html, visualisation.html.
**Outstanding:** everything else.

Next session running this audit should start with the highest-traffic pages: index.html, habits.html, workouts.html.
