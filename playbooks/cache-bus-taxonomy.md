# Cache-Bus Taxonomy

> Layer 1a of the premium-feel architecture campaign. **Brain-only draft.** No code shipped against this until Dean confirms the taxonomy.
>
> Authored 08 May 2026 PM-25, patched PM-26 after whole-tree audit caught audit-method drift in the original draft (see `Audit history` block at end). Grounded in live source read of vyve-site `df41d7cb` (HEAD as of session start, 86 blobs, all 73 source files now in audit scope).

---

## Purpose

A single in-app event surface that names every state change worth caring about, the caches each change invalidates, and the pages that subscribe to react. Replaces three ad-hoc systems (`invalidateHomeCache` / `recordRecentActivity` / direct cache-key writes from `auth.js` fan-out + `nav.js` touchstart prefetch) with one typed bus. Cross-tab transport via the `storage` event piggybacks on the same names.

The bus is the foundation for layers 2–4:

- **Layer 2 (prefetch graph):** prefetch destinations are declared per page; the bus tells the graph when something changed and a destination's cache needs warming. The existing `__vyvePrefetch` helpers + `nav.js` touchstart wiring (PM-18) become the seed of the prefetch graph; they don't get rebuilt.
- **Layer 3 (Realtime):** Supabase Realtime row events translate into bus events of the same name a local write would publish.
- **Layer 4 (optimistic UI):** every write surface publishes its event optimistically the moment the user taps, then reconciles against the server response.

---

## Refactor-vs-add framing (ruthless)

- **REFACTOR** — replaces an existing publish surface, semantics provably equivalent.
- **REFACTOR + race-fix / + scope-fix** — surface-level call shape collapses, bus version provably better.
- **ADD** — net-new publish surface, fixing a real defect.
- **NO-OP** — already coherent, listed for completeness.

The point: the bus should not become a parallel system next to a working one. Where today's wiring is correct, we rename. Where it's broken, we fix-as-we-rename and say so.

---

## Inventory — what exists today (live-verified, whole-tree)

### Existing publish surfaces

| Surface | Today's role | Lives in |
|---|---|---|
| `VYVEData.invalidateHomeCache(email?)` | Marks `vyve_home_v3_<email>` stale. Does NOT invalidate engagement / programme / exercise / habits / members caches. **Whole-tree count: 13 call sites across 9 files** (cardio, habits, log-food, movement, nutrition, wellbeing-checkin, tracking, vyve-offline, workouts-session). | `vyve-offline.js:408` |
| `VYVEData.recordRecentActivity(kind, opts)` | Writes a 2-min-TTL breadcrumb. Read by `getOptimisticActivityToday()` only. **Whole-tree count: 9 call sites across 6 files** (cardio, habits, movement, tracking, vyve-offline, workouts-session). | `vyve-offline.js:358` |
| `VYVEData.getOptimisticActivityToday()` | Reads outbox + breadcrumbs. Consumer: `index.html:763` only. | `vyve-offline.js:448` |
| `vyvePrefetchAfterAuth(user)` | Eager fan-out at sign-in. Once-per-session-per-email, network-gated. Writes home / engagement / certs / programme / exercise / habits / members caches. | `auth.js:336` |
| `window.__vyvePrefetch.{home,engagement,certs,exercise,habits,members}` | Per-destination prefetch helpers. **Wired to nav.js delegated `touchstart` + `mousedown` listener with route-table → helper map, network-OK gate, 5s hot-dedupe.** Live and active; PM-18 ship-truth confirmed PM-26 via whole-tree audit. | exposed in `auth.js:328`, invoked in `nav.js _pfHandleTouchStart` |
| `VYVEAchievements.evaluate()` | Debounced 1.5s call to `log-activity?evaluate_only=true`. **Whole-tree count: 16 call sites across 10 files** — habits, cardio, log-food (×2), monthly-checkin, movement (×2), nutrition, wellbeing-checkin, workouts-builder, workouts-programme, workouts-session (×5). The PM-26 figure of 20 over-counted by including 3 docblock-comment lines in `achievements.js` (L6, L11, L20) that demonstrate the API; corrected at PM-28. | `achievements.js:238` |
| `VYVEData.writeQueued(args)` | Outbox-buffered write for log-food + workouts-session. Auto-flushes on `online` event. | `vyve-offline.js:144` |

### Existing cache keys

(No drift on cache keys — only on call-site counts and write-surface coverage. Full table preserved from PM-25 draft; key callouts only:)

- **6 caches with no explicit invalidator on writes:** `vyve_engagement_cache`, `vyve_certs_cache`, `vyve_programme_cache_<email>`, `vyve_exercise_cache_v2`, `vyve_members_cache_<email>`, `vyve_habits_cache_v2`. Refreshed only by once-per-session `auth.js` fan-out. The biggest stale-paint vector.
- **2 caches not email-keyed (security-shaped):** `vyve_outbox`, `vyve_outbox_dead`. PM-27 fixes.
- **`vyve_dashboard_cache`:** **DEAD KEY (resolved PM-28 sub-audit).** Whole-tree audit at HEAD `040c496d` found a single read at `achievements.js:251` (`localStorage.getItem('vyve_dashboard_cache')` inside `replayUnseen()`, expecting shape `cached.data.achievements.unseen`) and **zero writers** — no `setItem` literal, no template-string variant, no `removeItem` — and the `.unseen` shape is referenced nowhere else in the tree. The read is a no-op every time. **Out of scope for the `auth:signed-out` bus cleanup handler — there is no live cache to evict.** Surgical removal of the dead read is a P3 backlog item, not bus-blocking.
- **`vyve_recent_activity_v1`:** not email-keyed but covered by 2-min TTL. Lower-stakes; rolls into 1c-1.

---

## Event taxonomy

Naming convention: `<noun>:<verb-past-tense>`. Envelope:

```js
{
  event: '<noun:verb>',
  ts: <epoch_ms>,
  email: '<member_email>',
  origin: 'local' | 'remote',
  txn_id: '<uuid>',
  ...
}
```

### Activity events

#### `activity:logged`
Umbrella event. Subscribers that don't care about type listen here.

```js
{ ...envelope, kind: 'habit'|'workout'|'cardio'|'session'|'checkin', date: 'YYYY-MM-DD', delta: 1 }
```
| Caches | Subscribers |
|---|---|
| `vyve_home_v3_<email>` (mark `_stale`), `vyve_engagement_cache` | index.html, engagement.html, achievements.js |

→ **REFACTOR + scope-fix.** Replaces 13× `invalidateHomeCache` + 9× `recordRecentActivity` + 20× `VYVEAchievements.evaluate` with one publish per write site (which fans out to all three effects internally).

#### `habit:logged`
```js
{ ...envelope, habit_id: '<uuid>', is_yes: true|false, autotick: false|true }
```
| Caches | Subscribers |
|---|---|
| `vyve_habits_cache_v2` (merge into `logsToday`) | habits.html, index.html, monthly-checkin.html |

→ **REFACTOR + scope-fix.** habits_cache_v2 currently uninvalidated; ticking a habit and nav-back shows it unticked until next sign-in.

#### `workout:logged`
```js
{ ...envelope, workout_id: <int>, completed: true, duration_min: <num>, source: 'programme'|'custom'|'movement'|'builder' }
```
**Sources:** `programme` + `custom` from workouts-session.js, `movement` from movement.html non-walk pills, `builder` from workouts-builder.js custom workout creation. Four publish sites collapse to one event with `source` discriminator.

| Caches | Subscribers |
|---|---|
| `vyve_home_v3_<email>`, `vyve_programme_cache_<email>` (only when `source: 'programme'`) | index.html, exercise.html, workouts.html, achievements.js |

→ **REFACTOR + scope-fix** (programme_cache).

#### `set:logged`
```js
{ ...envelope, exercise_log_id: <int>, exercise_name: '<str>', sets: <num>, reps: <num>, weight_kg: <num>|null }
```
| Caches | Subscribers |
|---|---|
| (none — exercise_logs has no client cache) | exercise.html (PR strip), workouts-session.js (next-set) |

→ **REFACTOR (decouple).** PR-strip refresh currently inline-coupled to save handler.

#### `session:viewed`
```js
{ ...envelope, session_id: '<str>', category: '<str>', minutes_watched: <num> }
```
| Caches | Subscribers |
|---|---|
| `vyve_home_v3_<email>`, `vyve_engagement_cache` | index.html, engagement.html, sessions.html, achievements.js |

→ **REFACTOR + scope-fix** (engagement_cache).

#### `checkin:submitted`
```js
{ ...envelope, kind: 'weekly'|'monthly', iso_year: <int>, iso_week: <int>|null, iso_month: <int>|null, score: <num>, mood: '<str>'|null }
```
**Two publish sites:** wellbeing-checkin.html (weekly, 2 sites — submit + flush) + monthly-checkin.html (monthly, 1 site at line 759). Both collapse to one event with `kind` discriminator.

| Caches | Subscribers |
|---|---|
| `vyve_home_v3_<email>`, `vyve_engagement_cache`, `vyve_checkin_outbox` (weekly only) | index.html, wellbeing-checkin.html, monthly-checkin.html, achievements.js |

→ **REFACTOR + scope-fix** (engagement_cache; monthly publish site previously not on the migration plan).

#### `cardio:logged`
```js
{ ...envelope, cardio_id: <int>, cardio_type: 'walking'|'running'|..., duration_min: <num>, distance_km: <num>|null, source: 'cardio_page'|'movement_walk' }
```
**Two publish sites:** cardio.html + movement.html walk pill (PM-15 04 May routed walks-as-cardio). One event with `source` discriminator.

| Caches | Subscribers |
|---|---|
| `vyve_home_v3_<email>`, `vyve_cardio_cache`, `vyve_engagement_cache` | index.html, cardio.html, engagement.html, achievements.js |

→ **REFACTOR + race-fix + scope-fix.** Race: cardio.html does direct fetch then post-await invalidate — 200–800ms gap where home reads pre-tick state. Bus version publishes optimistically before fetch.

### Profile / settings events

#### `weight:logged`
```js
{ ...envelope, logged_date: 'YYYY-MM-DD', weight_kg: <num> }
```
| Caches | Subscribers |
|---|---|
| `vyve_home_v3_<email>`, `vyve_wt_cache_<email>`, `vyve_wb_last`, `vyve_members_cache_<email>` (TDEE recalc if Δ > 0.5kg) | index.html, nutrition.html, settings.html |

→ **REFACTOR + scope-fix** (members + wb_last).

#### `food:logged`
```js
{ ...envelope, log_id: '<client_id>', meal_type: '<str>', calories: <num>, protein_g: <num>, carbs_g: <num>, fat_g: <num>, logged_at: <iso> }
```
| Caches | Subscribers |
|---|---|
| `vyve_food_diary:<email>:<YYYY-MM-DD>` | log-food.html, nutrition.html, achievements.js |

→ **REFACTOR + race-fix.** Today log-food.html maintains cache invalidation inline AND nutrition.html re-fetches on focus — race against just-completed insert. Bus version: log-food.html publishes with new totals delta computed client-side; nutrition.html applies delta from event rather than re-fetching.

#### `food:deleted`
```js
{ ...envelope, log_id: '<client_id>' }
```
→ **REFACTOR + race-fix.** Same race, opposite direction.

#### `persona:switched`
```js
{ ...envelope, from: '<str>', to: '<str>', reason: '<str>'|null }
```
| Caches | Subscribers |
|---|---|
| `vyve_home_v3_<email>`, `vyve_members_cache_<email>` | index.html, settings.html |

→ **ADD.** Today no client cache invalidation. Home greeting + recs show old persona until next sign-in.

#### `settings:saved`
```js
{ ...envelope, fields: ['<col1>', ...] }
```
| Caches | Subscribers |
|---|---|
| `vyve_members_cache_<email>` always; `vyve_home_v3_<email>` if home-affecting field | settings.html, index.html, nutrition.html, leaderboard.html (display_name only) |

→ **ADD.** Today no client cache invalidation.

#### `goal:updated`
→ **ADD.** Awaits Layer 3 Realtime publishers.

### System events

#### `achievement:earned`
| Caches | Subscribers |
|---|---|
| `vyve_ach_grid` (mark stale), `vyve_home_v3_<email>` | achievement-cabinet.html, index.html, toast queue |

→ **REFACTOR.**

#### `programme:updated`
```js
{ ...envelope, plan_cache_id: <int>, week_index: <int>, day_index: <int>, change_kind: 'completed'|'swapped'|'plan_replaced' }
```
| Caches | Subscribers |
|---|---|
| `vyve_programme_cache_<email>`, `vyve_exercise_cache_v2` | workouts.html, exercise.html, index.html |

→ **ADD.** Caches stale until next sign-in today.

#### `auth:ready`
→ **NO-OP / RENAME-LATER.** Already coherent via `vyveAuthReady` event + `window.VYVE_AUTH_READY` Promise.

#### `auth:signed-out`
| Caches | Subscribers |
|---|---|
| every member-scoped cache (home, programme, exercise, habits, members, recent_activity, food_diary, **outbox_<email> after PM-27**, active_session, workout_start) | every gated page (redirect) |

→ **ADD.** Today only `VYVE_RETURN_TO_KEY` removed; per-cache cleanup is by-eviction. Bus handler does explicit cleanup.

---

## Subscriber map (per-page) — corrected

| Page | Subscribes to | Handler |
|---|---|---|
| `index.html` | activity / habit / workout / cardio / session / checkin / weight / persona / goal / achievement / signed-out | mark home stale; if visible repaint via overlay |
| `habits.html` | habit:logged, signed-out | merge into habits_cache_v2; flip card UI |
| `workouts.html` | workout:logged, programme:updated, signed-out | mark programme_cache stale; refresh next-session |
| `exercise.html` | set:logged, programme:updated, signed-out | refresh PR strip; mark exercise_cache_v2 stale |
| `cardio.html` | cardio:logged, signed-out | invalidate cardio_cache; prepend new entry |
| `movement.html` | signed-out | clear in-memory state |
| `nutrition.html` | food:logged, food:deleted, weight:logged, settings:saved, signed-out | recompute totals from event delta; refresh weight chart; TDEE recalc |
| `log-food.html` | food:logged, food:deleted | merge / drop entries in current-day diary |
| `wellbeing-checkin.html` | checkin:submitted (kind:weekly), signed-out | lock submit UI |
| `monthly-checkin.html` | activity:logged, checkin:submitted, signed-out | refresh week strip |
| `engagement.html` | activity:logged, weight:logged, signed-out | mark engagement_cache stale; if visible repaint score ring |
| `leaderboard.html` | settings:saved (display_name), signed-out | mark leaderboard_cache stale |
| `settings.html` | settings:saved, persona:switched, signed-out | refresh persona badge + form values |
| `sessions.html` | session:viewed, signed-out | mark watched-state |
| `running-plan.html` | signed-out | clear in-memory state |

Cross-tab: every event published as `localStorage.setItem('vyve_bus', JSON.stringify(event))`. The `storage` event listener fires the same handler chain with `origin: 'remote'`. Self-tab uses CustomEvent on `window`.

---

## Migration plan (Layer 1c–onwards) — corrected from 10 to 14 commits

| # | Surface | Today's call shape | Bus event | Migration label |
|---|---|---|---|---|
| 1c-1 | habits.html log + autotick + undo | invalidate + record + evaluate | `bus.publish('habit:logged', ...)` | REFACTOR + scope-fix (habits_cache_v2) |
| 1c-2 | workouts-session.js complete (programme + custom) | three calls | `bus.publish('workout:logged', source:'programme'\|'custom', ...)` | REFACTOR + scope-fix (programme_cache) |
| 1c-3 | workouts-session.js exercise_log save | direct fetch + invalidate | `bus.publish('set:logged', ...)` | REFACTOR (decouple) |
| 1c-4 | cardio.html log | three calls | `bus.publish('cardio:logged', source:'cardio_page', ...)` | REFACTOR + race-fix + scope-fix |
| 1c-5 | **movement.html walk + non-walk paths (NEW)** | three calls × 2 paths | walks → `cardio:logged` source:'movement_walk'; non-walks → `workout:logged` source:'movement' | REFACTOR + scope-fix |
| 1c-6 | **workouts-builder.js custom workout creation (NEW)** | evaluate only | `bus.publish('workout:logged', source:'builder', ...)` | REFACTOR + scope-fix (no current invalidation = real bug) |
| 1c-7 | log-food.html insert + delete | inline cache writes + 2× evaluate | `bus.publish('food:logged'/'food:deleted', ...)` | REFACTOR + race-fix |
| 1c-8 | nutrition.html weight log | invalidate + evaluate | `bus.publish('weight:logged', ...)` | REFACTOR + scope-fix (members + wb_last) |
| 1c-9 | settings.html persona switch | direct fetch only | `bus.publish('persona:switched', ...)` | ADD |
| 1c-10 | settings.html save | direct fetch only | `bus.publish('settings:saved', ...)` | ADD |
| 1c-11 | wellbeing-checkin.html submit + flush | invalidate + evaluate | `bus.publish('checkin:submitted', kind:'weekly', ...)` | REFACTOR + scope-fix (engagement_cache) |
| 1c-12 | **monthly-checkin.html submit (NEW publish site)** | evaluate only (no invalidate today — defect) | `bus.publish('checkin:submitted', kind:'monthly', ...)` | REFACTOR + scope-fix |
| 1c-13 | tracking.js session view | invalidate + record + evaluate | `bus.publish('session:viewed', ...)` | REFACTOR + scope-fix (engagement_cache) |
| 1c-14 | **workouts-programme.js:391 `shareProgramme` + workouts-session.js:733 `shareWorkout` (two publish sites, one event)** | evaluate only after successful `share-workout` EF POST | `bus.publish('workout:shared', kind:'session'\|'programme', ...)` | REFACTOR (decouple) |

After 1c-14, all three legacy surfaces become dead. Final cleanup commit removes them.

**Counts after PM-28 sub-audit pass:** 2 pure REFACTOR (decouple), 9 REFACTOR + scope-fix, 2 REFACTOR + race-fix-or-scope-fix, 2 ADD. Of the 14 migrations, 12 fix something real on the way through (the 2 decouples are clean renames, no defect underneath); the bus is still the right shape. Campaign value framing holds after the audit.

---

## What 1a does NOT decide

- `bus.js` API shape (`publish` / `subscribe` / `unsubscribe` signatures, error handling, transport implementation) — Layer 1b commit decides.
- Realtime → bus translation — Layer 3 work.
- Optimistic delta reconcile-and-revert path — Layer 4.
- SW-side bus for the web push handler — out of scope.

---

## Pre-bus floorboards (PM-26 + PM-27)

- **PM-26 (this commit) — Whole-tree audit method as a §23 hard rule + taxonomy patch.** PM-25 draft proposed wiring touchstart-nav prefetch as a deliverable. Whole-tree audit at PM-26 start caught that nav.js (not in PM-25's hand-picked file batch) already contains the touchstart wiring — PM-18 shipped what its changelog claimed. The actual ship-truth violation was in PM-25's audit method. Same audit also caught: movement.html as a missed write surface (10 call sites), workouts-builder.js as a missed write surface, log-food + monthly-checkin + workouts-programme as missed `VYVEAchievements.evaluate` publish sites, and a 3× undercount of the total evaluate surface (7 → 20). Brain-only — no vyve-site change, no SW bump.
- **PM-27 — Email-key the outbox.** `vyve_outbox` and `vyve_outbox_dead` not email-keyed; shared device or sign-out / sign-in-as-different-member can flush queued writes against a different session's JWT (RLS catches server-side, client-side UX wrong). Migrate to `vyve_outbox_<email>` + `vyve_outbox_dead_<email>` with one-shot reader that adopts old `vyve_outbox` rows whose `member_email` matches current session.

After PM-27, this taxonomy commits as PM-28, then `bus.js` lands as PM-29.

---

## Source-of-truth (live-verified at PM-26 audit time)

- vyve-site `df41d7cb` (PM-26 audit base) → extended to `040c496d` (PM-28 sub-audits, post-PM-27 ship)
- VYVEBrain `master.md` `dce06959` § 6 / § 7 / § 19 / § 23 (pre-PM-28; refresh on commit)
- **Whole-tree pull (PM-26):** `GITHUB_GET_A_TREE` recursive on main → 86 blobs → 73 source-text candidates → all fetched and grepped
- **Whole-tree pull (PM-28 extension):** `GITHUB_GET_A_TREE` recursive on main at `040c496d` → 89 entries → 72 source-text files (.html .js .css; excludes vendor `supabase.min.js`, `test-schema-check.txt`, images, manifest.json, CNAME, dirs) → all 72 fetched and grepped (1.77M chars decoded)
- 13 `invalidateHomeCache` call sites (PM-26 whole-tree count via `grep -hE 'invalidateHomeCache' *.html *.js | grep -v 'function invalid' | grep -v 'typeof VYVEData' | wc -l`)
- 9 `recordRecentActivity` call sites (PM-26, same method)
- **16** `VYVEAchievements.evaluate` call sites (PM-28 corrected: regex `\bVYVEAchievements\s*\.\s*evaluate\s*\(` excluding docblock comment matches in `achievements.js` itself; PM-26 figure of 20 was inflated by 3 commented-out API examples)
- nav.js read confirms `_pfHandleTouchStart` + `document.body.addEventListener('touchstart', ..., {capture:true, passive:true})` + `mousedown` mirror — touchstart prefetch wired and active
- **PM-28 sub-audit grep commands:**
  - `vyve_dashboard_cache` literal: 1 read site (`achievements.js:251`), 0 writers, 0 removers
  - dynamic key construction: 0 hits on `setItem(\`...dashboard...\`)` template-strings or `localStorage[ ... dashboard ... ]` index access
  - `.unseen` shape consumers: 1 site (the `achievements.js:254` read itself)
  - workouts-programme.js:391 in context: lives inside `shareProgramme(btn)`, fires after successful `share-workout` EF POST
  - workouts-session.js:733 in context: lives inside `shareWorkout`, same pattern as L391; sibling publish site for the same `workout:shared` event
  - workouts-session.js:742 `shareCustomWorkout`: no `evaluate()` call (silent gap; not a defect blocking PM-29 — separate question for Lewis on whether custom shares should grant achievements)

If any of the above drifts, this taxonomy needs a re-pre-flight before extension. Don't paper.

---

## Audit history

- **PM-25 draft.** Initial taxonomy. Audit method: hand-picked subset of 23 files. Drift introduced: nav.js missed → touchstart wiring claimed absent (PM-18 ship-truth was actually correct). Movement / workouts-builder / 13 of 20 evaluate sites all missed for the same reason — grepped what I had, not what existed.
- **PM-26 patch.** Whole-tree audit. All 73 source files fetched and grepped. PM-25 findings re-verified against full tree. Errata captured. New §23 hard rule on whole-tree audit method. Touchstart-wiring deliverable removed (already shipped). Migration plan extended from 10 to 14 rows. Counts corrected throughout.
- **PM-28 patch.** Two sub-audits resolved: 1c-14 lands as `workout:shared` (REFACTOR-decouple, two publish sites — workouts-programme.js:391 + workouts-session.js:733 — collapsing into one event with `kind:'session'|'programme'`); `vyve_dashboard_cache` confirmed dead via whole-tree grep at HEAD `040c496d` (read at achievements.js:251, zero writers anywhere) and removed from bus cleanup scope. Editorial fix to PM-26 changelog: original PM-25 invalidate count was simply wrong (no stray comment-line); evaluate count corrected from 20 to 16 after excluding 3 docblock-comment lines in achievements.js. Source-of-truth extended to `040c496d`. No vyve-site change.
