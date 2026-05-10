# Realtime → Bus Bridge Playbook

> Layer 2 infrastructure playbook. Replaces `1c-migration-template.md` and `cache-bus-taxonomy.md` (both marked OBSOLETE at PM-44) as the canonical reference for cross-device cache coherence work.
>
> **Created PM-45, 10 May 2026** alongside the bus.js v2 ship.

---

## What Layer 2 is

Layer 1c migrated every direct-call cache primitive on the writing surface onto a typed event bus (`bus.publish('habit:logged', {...})`). Layer 1c made every member-write instant on the local tab and on other tabs of the same browser instance (storage event transport).

**Layer 2 extends the same lag-free contract to every other device the member is signed in on.** Member logs habit on phone → desktop tab reflects within ~2s without manual refresh. The mechanism: Supabase Realtime subscribes per-table-per-member to the same INSERT/UPDATE/DELETE row events the writing device generated, and the Realtime payload translates into a bus event of the same name a local write would publish, with `origin: 'realtime'`.

The bus.js v2 patch (PM-45) provides the infrastructure. Tables and surfaces are wired one at a time in PM-46 onwards using this playbook.

---

## bus.js v2 API (PM-45 ship)

```js
// New origin value alongside 'local' and 'remote'
envelope.origin === 'realtime'

// Wire bridge config — call once at auth.js after Supabase client is ready
window.VYVEBus.installTableBridges(supabase, [
  {
    table:            'daily_habits',
    event:            'habit:logged',
    op:               'INSERT',
    pk_field:         'id',                            // optional, defaults to 'id'
    payload_from_row: (row) => ({
      habit_id:    row.habit_id,
      logged_at:   row.completed_at
    }),
    filter:           (row, payload) => true           // optional post-filter
  },
  // ... more entries
]);

// At every publish site that ALSO writes to a bridged table — call to
// suppress the Realtime echo of own writes
window.VYVEBus.recordWrite('daily_habits', insertedRow.id);

// Test-harness only (gated on window.__VYVE_BUS_MOCK_REALTIME)
window.VYVEBus.__mockRealtimeFire('daily_habits', 'INSERT', {
  id: 1, member_email: 'lewis@example.com', habit_id: 'water'
});
```

`installTableBridges` defers the actual channel subscription until `auth:ready` fires (or fires immediately if the bus is being installed after auth has already fired). On `auth:signed-out` every channel unsubscribes; idempotent across re-auth within the same page lifetime.

---

## Self-suppression semantics

A single member write fires up to **three** events under Layer 2:

1. `origin: 'local'` — the writing device's own publish (subscribers fan out immediately)
2. `origin: 'remote'` — storage event echoes to other tabs of the same browser instance
3. `origin: 'realtime'` — Supabase Realtime echoes to every device the member is signed in on, **including the writing device**

The third leg is the Layer 2 echo problem: the writing device just published `local` and now Realtime delivers the same row back as `realtime`, double-firing every subscriber under different origins. Achievement evals would double-debounce, cache-busts would re-fire (idempotent but wasteful), and any subscriber tracking origin to drive UX text ("you logged this" vs "another device logged this") would mis-classify.

**Resolution: device-local recent-write log.**

- Every publish site that writes to a bridged table calls `VYVEBus.recordWrite(table, primary_key)` at the publish site, immediately after the row insert resolves
- The bridge GC scans for expired keys on every Realtime delivery (lazy, not interval-based)
- TTL is 5000ms — Supabase Realtime delivery is typically <2s end-to-end, 5s gives generous headroom
- When a Realtime row arrives matching a recent-write key, the bridge suppresses the bus event entirely (no `realtime` envelope is built or delivered)
- Cross-device echo: the OTHER device's write delivers as a fresh `realtime` event because that device's `recordWrite` lives on its own local map

This is **NOT a CRDT.** Two devices writing the same primary key within 5s would both suppress each other's echoes, but in practice that requires a primary-key collision (rare with most VYVE schemas — `daily_habits.id` is sequence-generated server-side; `weight_logs.id` likewise). The genuine same-PK same-time case is the writing device echoing back to itself, which is exactly what we want to suppress.

**Edge case: the writing device's `recordWrite` call fails or is missed.** Then the writing device sees its own publish as `local` and ~2s later as `realtime`, double-firing subscribers. Mitigation: subscribers are idempotent for cache-stale (a no-op extra invalidate just causes an extra fetch on next read). Achievement debounce 1.5s eats the double-fire of `evaluate`. Acceptable degraded-but-functional state.

---

## Tables in the Layer 2 publication (post-PM-45)

11 tables added to `supabase_realtime` publication via migration `pm45_layer2_realtime_publication_enable`:

| Table | Op | Bus event | Notes |
|---|---|---|---|
| `daily_habits` | INSERT | `habit:logged` | Mirror of PM-30 publish surface |
| `workouts` | INSERT | `workout:logged` | Mirror of PM-31 publish surface; carries `source` discriminator from row |
| `exercise_logs` | INSERT | `set:logged` | Mirror of PM-32 publish surface |
| `cardio` | INSERT | `cardio:logged` | Mirror of PM-33 publish surface; PM-34 `movement_walk` source originates here |
| `nutrition_logs` | INSERT | `food:logged` | Mirror of PM-36 publish surface; carries `kind` discriminator from row |
| `nutrition_logs` | DELETE | `food:deleted` | Mirror of PM-36 delete surface |
| `weight_logs` | INSERT | `weight:logged` | Mirror of PM-37 publish surface |
| `wellbeing_checkins` | INSERT | `wellbeing:logged` | Mirror of PM-39 live + flush surfaces |
| `monthly_checkins` | INSERT | `monthly_checkin:submitted` | Mirror of PM-40 publish surface |
| `session_views` | INSERT | `session:viewed` (kind:'live') | Mirror of PM-43 publish surface |
| `replay_views` | INSERT | `session:viewed` (kind:'replay') | Mirror of PM-43 publish surface |
| `certificates` | INSERT | `certificate:earned` (NEW) | Server-cron-driven INSERT; first Layer 2 surface with no client publish path. No `recordWrite` discipline (no own-write to suppress) |

**Three tables intentionally deferred:**

- `shared_workouts` — sharer-scoped (uses `shared_by`, not `member_email`). Cross-device coherence on the share-creator's "My shares" list is low value (sharing is a low-frequency action, not a continuous stream). Revisit if the gap becomes user-visible.
- `members` UPDATE — high-volume non-coherent UPDATE traffic (every login bumps `last_login_at`, every settings save bumps something). Subscribing every device to every `members` UPDATE produces noisy Realtime delivery for marginal benefit. Cross-device persona switch is a rare-event nice-to-have, defer until needed.
- `workout_plan_cache` UPDATE — already covered by per-event bridges. `workouts` INSERT covers per-workout state changes; PM-42 `programme:imported` event covers programme imports. The cross-device case is handled via the table that fired the event, not via the cache-shaped UPDATE on `workout_plan_cache`.

---

## Per-table wiring discipline (PM-46 onwards)

Each commit wires one table at a time. Same per-surface discipline as Layer 1c.

### Pre-flight checklist

1. **Table is in publication.** `SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='<table>';` — should return one row. (For a new table not yet in the PM-45 list, ALTER PUBLICATION it first via migration.)
2. **RLS allows the member to see their own rows.** All Layer 2 tables today have `member_email = auth.email()` policies — Realtime respects RLS by default.
3. **Primary key field.** Note the PK column (default `id`; if not, set `pk_field` in the bridge entry).
4. **Pre-bus surface fired the right primitives at the publish site.** For symmetric fallback discipline (PM-30/31/32/33/34/37 + PM-39 live), the publish site's pre-bus shape is mirrored in subscribers; for asymmetric (PM-35/36 delete/PM-38/40), the bus path closed a gap. Layer 2 inherits the post-1c shape automatically — the realtime echo fans out the same subscriber chain a local publish would.
5. **Engagement scope.** Re-read the PM-43 §23 sub-rule on engagement scope-fix vs intentional non-touch. The realtime echo fires the SAME subscribers as a local publish — which means if a table's local publish is correctly engagement-touching, its realtime echo is correctly engagement-touching too. No re-classification needed at PM-46+.

### Commit shape

1. **Add bridge config entry** to wherever `installTableBridges` is invoked (likely auth.js after the Supabase client is ready).
2. **Add `recordWrite` calls** at every existing publish site for the table. `VYVEBus.recordWrite('<table>', insertedRow.id)` immediately after the row insert resolves. Order: publish FIRST (per-surface race-fix ordering, PM-39 §23), then `recordWrite` once the inserted row's PK is known. For confirmer-pattern surfaces (PM-39 flush, PM-41 share, PM-42 import) the recordWrite fires after `res.ok` confirmed the write — same ordering as the publish.
3. **No new subscribers needed.** Existing Layer 1c subscribers are origin-agnostic; they fire on `local`, `remote`, and `realtime` identically.
4. **Self-test** with `__mockRealtimeFire`. Set `window.__VYVE_BUS_MOCK_REALTIME = true` in a test page, install the bridge config, fire a synthetic row, verify the subscriber fan-out matches the local-publish fan-out.
5. **Two-device manual verify.** Phone PWA + desktop tab signed in as the same member. Trigger the write on phone, watch the desktop without manually refreshing. Within ~2s the cache-bust + UI re-render should happen.
6. **sw.js cache bump.** Same atomic commit as the bridge entry add. Pattern: `vyve-cache-v2026-05-NN-pmNN-bridge-<table>-a`.

### What does NOT need to change

- `VYVEData.invalidateHomeCache`, `VYVEData.recordRecentActivity`, `VYVEAchievements.evaluate` — Layer 1c already routed these through subscribers
- Existing publish call sites — the publish event name and payload stay identical
- HTML wiring — bus.js is already loaded by every page that has Layer 1c subscribers
- Schema — no new columns needed; bridge config reads existing columns

---

## Audit-count discipline at Layer 2

Layer 1c PM-37 + PM-40 audit-count rule: count any non-comment, non-`typeof`-guard, non-function-definition line containing a CALL to one of `VYVEData.invalidateHomeCache`, `VYVEData.recordRecentActivity`, `VYVEAchievements.evaluate`, `VYVEBus.publish`, `VYVEBus.subscribe`.

**At Layer 2, add `VYVEBus.recordWrite` to the audit-count primitives.** Each PM-46+ commit should expect:

- `VYVEBus.publish(` count: unchanged (no new publish surfaces in Layer 2)
- `VYVEBus.subscribe(` count: unchanged (existing subscribers handle realtime origin)
- `VYVEBus.recordWrite(` count: +N where N is the number of publish sites for the bridged table (typically 1-2 per table; `nutrition_logs` has 3 — search insert, quickadd insert, delete)
- `VYVEData.invalidateHomeCache(` count: unchanged (1, subscriber-internal helper)
- `VYVEData.recordRecentActivity(` count: unchanged (1, subscriber-internal helper)
- `VYVEAchievements.evaluate(` count: unchanged (12, subscriber-internal helpers)

Source-of-truth block at end of every Layer 2 commit doc: tree SHA + file count fetched + grep commands (PM-26 §23 rule).

---

## What's NOT in scope for Layer 2

- **Optimistic UI delta reconciliation.** That's Layer 4. A failed POST is not reverted via subscriber callbacks; the next fetch returns truth. Realtime missed events are tolerated by subscribers (most just bust caches; achievement-track-completing events may need a periodic re-evaluate sweep, that's Layer 3).
- **Reconcile-and-revert on POST failure.** Layer 4. Subscribers do not undo state when a `:failed` event arrives.
- **SW-side bus** for the web push handler. Out of scope.
- **Ordering guarantees across devices.** Two devices writing close in time may deliver realtime events in different orders to a third device. Acceptable for cache-bust semantics; not acceptable for any future ordered-state machine, which would belong in Layer 4.
- **Catch-up sweep on reconnect.** When a device's Realtime connection drops and reconnects, missed events between the disconnect and reconnect are not replayed. Subscribers must tolerate (most do trivially; fetch-on-render closes the gap on the next read). Periodic re-sync is Layer 3.

---

## Cross-references

- bus.js v2 source: `online.vyvehealth.co.uk/bus.js` (vyve-site `bus.js`, post-PM-45 SHA `285d7738fe90`)
- self-test harness shape: PM-45 changelog entry §"Self-test harness"
- §23 sub-rules earned at PM-45: see active.md §4.9 + master.md §23 narrative
- Active campaign: active.md §3 documents Layer 2 progress per session
- Layer 1c stop-date playbooks (OBSOLETE): `playbooks/1c-migration-template.md`, `playbooks/cache-bus-taxonomy.md` — kept for historical traceability only
