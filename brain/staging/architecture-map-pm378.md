# Architecture Map — Write Surfaces, Bus Events, Data Flows

**Generated PM-378, 25 May 2026 (Sunday).** Repo HEAD at fetch: `vyve-site` `c00a24ca` (PM-377), `VYVEBrain` `f52c2fd2` (PM-377).

This document is the canonical inventory of every data-write path through `vyve-site` as it exists today. It is the input for the Chat 5 audit pass against the §23.39 / §23.7.6 / §23.65 contract. **Inventory only — no fixes proposed here.** Anything flagged inline is a note for the auditor, not a recommendation.

The contract being inventoried (one-line summary): every member-facing write is **synchronous Dexie + bus publish + UI flip, then un-awaited background Supabase write**. Bus subscribers should react from the envelope synchronously and only re-read Dexie as a second pass.

---

## 1. Headline numbers

- **Write-surface HTML pages inventoried:** 38 (covering all six pillars + check-ins + workouts/cardio/movement + nutrition + sessions/replays + settings + focus pages)
- **Distinct VYVEBus events found:** **45 real + 5 dead pluralised** (full table in §3 below). _**PM-379 correction:** initial inventory missed `live:viewed`, `mind:viewed`, `workouts:logged`, `nutrition:logged`, `habits:logged`, `live_checkin:logged`. The last four are publish-only with zero subscribers (dead pluralised focus-shell names — see Flag P0-4 in audit). Original count of 43 stands for real-event names with at least one publisher AND subscriber wired correctly._
- **Distinct `window` CustomEvents found:** **10** (infrastructure layer — table-pulled, outbox, auth-ready, etc.)
- **Dexie write call sites:** 23 distinct (`VYVELocalDB.<table>.<op>`)
- **Direct PostgREST writes (`/rest/v1/<table>`):** 26 distinct tables touched
- **Edge Function calls from client:** 17 distinct EFs called
- **Outbox writes (`VYVEData.writeQueued`):** **8 callers** (PM-379 correction — original grep missed the bulk): `visualisation.html`, `cardio.html`, `workouts-session.js`, `habits.html` (3 sites), `focus-shell.js`, `journal.html` (2 sites), `replay-tracker.js`, `player-tracker.js`

### Health signals (note inline, not yet judged)

- **3 orphan publishers** (publish, no subscribers): `'avatar:changed'` (settings), `'specific_goal:changed'` (settings), `'focus:write_failed'` (focus-shell). _**PM-379 correction:** original list included `'replay:viewed'` as orphan — it is NOT. `player-tracker.js` publishes `'replay:viewed'` via dynamic `cfg.busEvent` indirection (L569) on 11 pages (8 live shells + replays.html + replay-category.html + mind.html). Original grep matched only the literal string and missed the indirection._
- **3 orphan subscribers** (subscribe, no publishers): `'body:logged'` (3 connect pages — phantom contract), `'connect:hydrated'` (connect.html), `'daily_habits'` (index.html — stray subscribe using a Dexie table name as event name)
- **`<table-event>:failed`** literal string was originally flagged as a template-string interpolation bug. _**PM-379 correction:** NOT a bug. The literal appears only inside a `/* ... */` docblock at `vyve-offline.js` L721 describing the public contract of the outbox dead-letter publish. The actual publish at L796 uses `map.event` (dynamic, from FAILURE_TABLE_MAP). Retract the flag._
- **`tracking.js` (legacy)** still loaded on 17 `*-live.html` + `*-rp.html` shells. Brain (§23.67, PM-251 retro) claimed PM-251 dropped it; **it did not.** Both legacy `tracking.js` and new `player-tracker.js` are now loaded simultaneously on 8 `*-live.html` shells.
- **`replay-tracker.js`** is loaded on **zero pages** — orphan module. `player-tracker.js` (PM-304) replaces it, but the old file has not been deleted from the repo.
- **`events-rp.html`** does NOT load `session-rp.js`, `theme.js`, OR `session-rp.css`. The other 7 rp shells load all three. Out-of-band shell. _**PM-379 correction:** original entry said two missing tags; actual count is three (session-rp.css was missed in initial inventory)._
- **`prompts.js` and `hydration.js`** are each loaded on only `index.html`. PM-375 brain entry notes this is by design (incremental adoption); flagged here so the auditor knows it's intentional.

---

## 2. Bus contract definitions (for reference)

### VYVEBus event taxonomy (from observed envelope shapes)

Events follow the convention `<surface>:<verb>`:
- `<surface>:logged` — successful write, includes envelope with primary key + sign/direction + client_id
- `<surface>:failed` — write failed (4xx or outbox dead-letter), used for revert
- `<surface>:unlogged` — explicit undo (mind section uses this)
- `<surface>:<sub-action>:logged|cleared` — sub-actions (e.g. `connect:reaction:logged`, `connect:reaction:cleared`)

### Window CustomEvent taxonomy (infrastructure layer)

- `vyveAuthReady` — auth.js fires once when `vyveCurrentUser` populated (38 listeners across 35 files — universal handshake)
- `vyve-localdb-hydrated` — sync.js fires after first successful hydrate
- `vyve-localdb-table-pulled` — sync.js (and focus-shell.js) fires per-table after each successful pull; carries `detail.table` and `detail.source`
- `vyve-localdb-table-failed` — sync.js fires when a table pull fails
- `vyve-localdb-table-delta` — sync.js fires for incremental deltas
- `vyve-back-online` — offline-manager.js (sync.js subscribes for drain trigger)
- `vyve-outbox-drained` — vyve-offline.js (sync.js listens)
- `vyve-outbox-dead` — vyve-offline.js fires when an item hits max-attempts (habits/log-food/nutrition/workouts-session listen for revert)
- `vyve-syncqueue-dead` — sync.js fires for unrecoverable sync errors
- `vyveAuthReady`, `vyveSignedOut`, `vyveHapticReady` — auth/haptic lifecycle
- `vyvePaintDone` — certificates/habits/leaderboard fire after first paint (perf telemetry)
- `vyve-hydration-dismissed` — hydration.js fires on close

---

## 3. Bus event catalogue (all 43)

For each event: publishers, subscribers, file:line where they live. Subscriber counts include both the `VYVEBus.subscribe('X')` form and indirect subscription via the `achievements-evaluator.js` EVENT_HANDLERS map.

| Event | Publishers | Subscribers | Notes |
|---|---|---|---|
| `habit:logged` | `habits.html` (logHabit / undoHabit), `index.html` (togglePill x2 — tick + untick) | `habits.html`, `index.html`, `monthly-checkin.html`, `achievements-evaluator.js` | Envelope `{kind:'canonical', habit_id, is_yes, logged_at, synthetic_key, sign}`. PM-291 cross-page sync surface. |
| `habit:failed` | `habits.html` | `habits.html`, `index.html`, `achievements-evaluator.js`?  — actually only `habits.html` + `index.html` direct | Revert path. |
| `habits:set-changed` | `settings.html` | `habits.html`, `index.html` | Settings → assignment-set change, both consumers re-read Dexie. |
| `habits:set-changed:failed` | `settings.html` | `habits.html` | Settings revert. |
| `workout:logged` | `workouts-session.js`, `workouts-builder.js`, `workouts-programme.js`, `movement.html` | `workouts.html`, `index.html`, `achievements-evaluator.js` | Movement republishes via this event too — heritage from when movement wrote to `workouts` table. **Note for auditor:** PM-307 split movement into its own `movement_activities` table + `movement:logged`, but `movement.html` still publishes `workout:logged` from the legacy code paths (`workouts.html` Dexie write at L?). Look at movement.html to confirm whether legacy dual-publishing is alive. |
| `workout:failed` | `workouts-session.js`, `movement.html` | `workouts-session.js`, `index.html`, `achievements-evaluator.js` | Revert + achievements gating. |
| `workout:shared` | `workouts-programme.js`, `workouts-session.js` | `index.html`, `achievements-evaluator.js` | Share-button event; achievement metric `workouts_shared_v2`. |
| `set:logged` | `workouts-session.js` | `workouts.html`, `index.html`, `achievements-evaluator.js` | Per-set tick (not per-workout completion). |
| `cardio:logged` | `cardio.html` | `cardio.html`, `index.html`, `achievements-evaluator.js` | |
| `cardio:failed` | `cardio.html` | `cardio.html`, `index.html` | |
| `movement:logged` | `movement.html` | `movement.html` (own), `movement-history.html`, `index.html`, `achievements-evaluator.js` | PM-307 table. |
| `movement:failed` | `movement.html` | `movement.html`, `index.html` | |
| `mind:logged` | `breathwork.html`, `meditation.html`, `sleep.html`, `visualisation.html`, `journal.html`, `affirmations.html`, `player-tracker.js` (mind videos write through `meditation.html`'s pattern? — see note below) | `mind.html`, `breathwork.html`, `journal.html`, `affirmations.html`, `connect.html`, `connect-feed.html`, `connect-challenge.html`, `achievements-evaluator.js` | **`player-tracker.js` publishes `mind:logged`** — confirmed at the legacyPayload publish near top of file. Mind video page (meditation/sleep/visualisation) uses player-tracker for video tracking, then republishes via `mind:logged`. |
| `mind:failed` | `breathwork.html`, `meditation.html`, `sleep.html`, `visualisation.html`, `journal.html`, `affirmations.html` | `mind.html`, `breathwork.html`, `journal.html` | |
| `mind:unlogged` | `breathwork.html`, `journal.html` | `mind.html`, `journal.html` | Mind explicit undo (only breathwork + journal use it; the other 4 mind pages don't). |
| `connect:checkin:logged` | `connect-checkin.html` | `connect.html`, `connect-feed.html`, `connect-challenge.html`, `achievements-evaluator.js` | |
| `connect:checkin:failed` | `connect-checkin.html` | `connect.html` | |
| `connect:reaction:logged` | `connect-checkin.html`, `connect-feed.html`, `connect.html` | `connect.html`, `achievements-evaluator.js` | All three reaction surfaces publish; only the hub plus the evaluator listen. |
| `connect:reaction:cleared` | `connect-checkin.html`, `connect-feed.html`, `connect.html` | `connect.html` | |
| `connect:challenge:progress` | (none — orphan subscriber, see notes) | `connect-challenge.html`, `connect.html` | **ORPHAN SUBSCRIBER.** Nothing in repo publishes this. Likely intended to fire from the achievement-claim EF response or from a future challenge-completion path. |
| `connect:hydrated` | (none — orphan subscriber) | `connect.html` | **ORPHAN SUBSCRIBER.** Probably intended as a paired event with `vyve-localdb-table-pulled` filtered to connect tables. |
| `body:logged` | (none — orphan subscriber) | `connect.html`, `connect-feed.html`, `connect-challenge.html` | **ORPHAN SUBSCRIBER × 3.** Phantom contract: connect surfaces wait for a unified "any body activity" signal that nothing publishes. workout:logged / cardio:logged / movement:logged are the de-facto sources but no aggregator publishes `body:logged`. Connect tile counts may lag after body activity for this reason. |
| `weight:logged` | `nutrition.html` | `nutrition.html`, `index.html` | One-per-day upsert. |
| `weight:failed` | `nutrition.html` | `nutrition.html` | Revert. Note: 3 publish sites in file (likely multiple failure branches). |
| `food:logged` | `log-food.html` | `index.html` | |
| `food:deleted` | `log-food.html` | `index.html` | |
| `food:failed` | `log-food.html` | `index.html`, `log-food.html` | 4 publish sites — multiple failure branches. Note for auditor: per the PM-374 brain entry, food-log entry is locked Coming Soon, so these publishers are unreachable in production today but still in code. |
| `wellbeing:logged` | `wellbeing-checkin.html` | `wellbeing-checkin.html`, `index.html`, `achievements-evaluator.js` | |
| `wellbeing:failed` | `wellbeing-checkin.html` | `index.html` | |
| `monthly_checkin:submitted` | `monthly-checkin.html` | `monthly-checkin.html`, `index.html`, `achievements-evaluator.js` | |
| `monthly_checkin:failed` | `monthly-checkin.html` | `index.html` | |
| `session:viewed` | `tracking.js` (legacy) | `index.html`, `achievements-evaluator.js` | Legacy live tracker. PM-251 was supposed to retire tracking.js — `tracking.js` is still loaded on every live + rp shell (17 pages), so this event still fires from real surfaces. |
| `session:viewed:failed` | `tracking.js` | `index.html`, `tracking.js` (own retry) | |
| `replay:viewed` | `player-tracker.js` (via dynamic `cfg.busEvent` indirection at L569 — fires when `mode='replay'`); `replay-tracker.js` (literal — but loaded on 0 pages, never fires) | `achievements-evaluator.js` via EVENT_HANDLERS (`eval_replays_watched` + 6 session-minutes + streak metrics) | **PM-379 correction.** Original entry called this an orphan publisher because the inventory grep matched the literal string and missed `player-tracker.js`'s dynamic indirection. Reality: `player-tracker.js` loads on 11 pages (8 live shells + replays.html + replay-category.html + mind.html) and publishes `replay:viewed` whenever the player is in replay mode. The `replays_watched` achievement metric is live, not data-blind. `replay-tracker.js` is still loaded on 0 pages and can be deleted as cleanup. |
| `persona:switched` | `settings.html` | `index.html` | Single consumer (probably to refresh persona-tinted greeting). |
| `avatar:changed` | `settings.html` | (none) | **ORPHAN PUBLISHER.** Profile avatar upload publishes but no listener. Avatar paint is presumably driven off `members` Dexie row via `vyve-localdb-table-pulled`. |
| `specific_goal:changed` | `settings.html` | (none) | **ORPHAN PUBLISHER.** Goal change writes to `members` table, no listener — same shape as avatar:changed. |
| `programme:imported` | `workouts-programme.js` | `workouts.html`, `index.html` | Programme adoption (shared-workout → import flow). |
| `certificate:earned` | (none — orphan subscriber) | `certificates.html`, `index.html` | **ORPHAN SUBSCRIBER.** Certificate earn is server-side (certificate-checker cron), no client publisher today. Subscribers presumably waiting for a future Realtime bridge or for `member-dashboard` push to fire this client-side. |
| `daily_habits` | (none — name reuses Dexie table name) | `index.html` (L2461 — stray subscribe) | **DEAD SUBSCRIBE.** This is `VYVEBus.subscribe('daily_habits', ...)` using a Dexie table name as an event name. No publisher uses this string. Probably a bug — comment above the subscribe says "cross-page consistency". Auditor: confirm intent. |
| `focus:write_failed` | `focus-shell.js` | (none) | **ORPHAN PUBLISHER.** Focus page write-fail signal not consumed. Focus-shell also publishes individual surface events (`mind:logged` etc.) per the focus catalogue write_target mapping. |
| `vyve-localdb-table-pulled` | (window CustomEvent only; NO bus bridge — see §6 + PM-379 audit Flag 14) | `engagement-v2.html` L1642 calls `VYVEBus.subscribe('vyve-localdb-table-pulled', recompute)` — but **the regex check in `publish()`/`subscribe()` rejects this name (no colon)**, so the subscriber never registers. Every other consumer correctly uses `window.addEventListener`. **PM-379 correction:** original inventory speculated there must be a bridge in bus.js — there is not. The engagement-v2 sub is dead. |
| `<table-event>:failed` | (none — was misread as a publish) | (none) | **PM-379 correction.** Not a bug — the literal `<table-event>:failed` appears only inside a `/* ... */` docblock at `vyve-offline.js` L721 describing the public contract of the outbox dead-letter publish. The real publish at L796 uses `map.event` (dynamic, from FAILURE_TABLE_MAP) — fires the actual event name (e.g. `habit:failed`) per row that hits max-attempts. Retract the flag. |

---

## 4. Write surfaces — one entry per page/module

For each surface: which Dexie table it writes, which bus event it publishes, which Supabase path it uses, and a notes block on anything unusual.

### 4.1 Habits

**`habits.html`** — daily habits log surface
- **Dexie writes:** `VYVELocalDB.daily_habits.upsert()` (logHabit tick), `VYVELocalDB.daily_habits.delete()` (undoHabit). Fire-and-forget.
- **Bus publishes:** `habit:logged` (5 sites — tick + untick branches), `habit:failed` (revert)
- **Supabase write path:** outbox via `VYVEData.writeQueued`? — actually, the code uses `VYVEData.writeQueued` indirectly? **Audit check:** my regex found 0 `VYVEData.writeQueued` calls in `habits.html`. Need to confirm whether habits.html POSTs direct via fetch + `?on_conflict` or via outbox. PM-291 brain entry implies optimistic-first with no awaited fetch.
- **Subscribers reacting to its events:** `habits.html` itself (defensive), `index.html` (home pillar count repaint), `monthly-checkin.html`, `achievements-evaluator.js`
- **Other reads:** Loads `habit_library`, `member_habits`, `daily_habits` from Dexie; calls `member-dashboard` EF for the autotick block (PM-99-era HK integration)
- **Notes:** Reference §23.65 implementation — habits.html undo runs fire-and-forget Dexie delete then publishes; index.html subscriber uses envelope-trusted pattern (L2336-ish).

**`index.html`** — also a habit write surface
- **Dexie writes:** Same `daily_habits.upsert / delete` as habits.html — home page Today's Habits list publishes when ticked there
- **Bus publishes:** `habit:logged` from `togglePill()` tick + untick (L2292, L2334)
- **Side-channel:** uses `VYVEHomeState.optimisticPatch('daily_habits', {loggedAt, sign})` and `VYVEBus.recordWrite('daily_habits', synthKey)` + `VYVEBus.recordCanonical('daily_habits', synthKey)` — a separate bus-write-tracking mechanism that doesn't appear documented in master. Auditor: confirm what `recordWrite` / `recordCanonical` do in `bus.js`.

**`settings.html`** — habit assignment-set write surface
- **Dexie writes:** `VYVELocalDB.habit_library.upsert/delete`, `VYVELocalDB.member_habits.upsert` (×2), `VYVELocalDB.members.upsert` (×4 — name, persona, goal, display-name pref)
- **Bus publishes:** `habits:set-changed` (toAdd/toRemove envelope), `habits:set-changed:failed` (revert)
- **Supabase write path:** Direct `/rest/v1/members` calls (4 sites). Custom habit creation/edit/delete via direct REST writes on `habit_library`.

### 4.2 Workouts (the gym programme + custom + sessions)

**`workouts-session.js`** — actual workout completion + per-set tick (loaded by workouts.html)
- **Dexie writes:** `VYVELocalDB.exercise_logs.upsert()` (per set), `VYVELocalDB.workouts.upsert/delete()` (per workout completion)
- **Bus publishes:** `set:logged`, `workout:logged`, `workout:failed`, `workout:shared`
- **Supabase write path:** Direct `/rest/v1/exercise_logs` POST + `/rest/v1/workouts` POST. The audit also caught `/rest/v1/workout_plan_cache` updates (programme progress).
- **Note for auditor:** §23.65 — `workouts.html` subscribes to `workout:logged` and `set:logged` from this module. Confirm subscriber pattern matches the envelope-trusted contract.

**`workouts-builder.js`** — custom workout authoring
- **Dexie writes:** `VYVELocalDB.custom_workouts.delete()` (1 site)
- **Bus publishes:** `workout:logged` (1 site — odd for a builder)
- **Supabase write path:** Direct `/rest/v1/custom_workouts` POST/PATCH/DELETE (5 sites)
- **Note:** "workout:logged" from a builder is suspicious — auditor confirm whether this is for testing the just-built workout, or whether it's misclassified.

**`workouts-programme.js`** — programme adoption + share
- **Dexie writes:** None directly — writes via REST and lets sync.js hydrate
- **Bus publishes:** `workout:logged` (1 site — programme adoption), `workout:shared` (multiple sites), `programme:imported`
- **Supabase write path:** Direct `/rest/v1/workout_plan_cache`, `/rest/v1/workout_plans`, `/rest/v1/custom_workouts`, `/rest/v1/exercise_logs`. EF call: `share-workout` (6 sites).

**`workouts-notes-prs.js`** — exercise notes + PR writes
- **Supabase write path:** `/rest/v1/exercise_notes` (3 sites), `/rest/v1/exercise_logs` (PR backfills), `/rest/v1/workouts`
- **Bus publishes:** None directly — relies on parent flow
- **Auditor note:** No bus events from this module. Could be deliberate (PR/notes is silent metadata) or a gap.

**`workouts-exercise-menu.js`** — exercise swap
- **Supabase write path:** `/rest/v1/exercise_swaps` (1 site)
- **Bus publishes:** None
- **Note:** Swap rewrites `workout_plan_cache` in-memory but doesn't appear to publish — auditor confirm whether subscribers expect a `swap:applied` event (none found).

**`workouts.html`** — the page shell, subscriber-only for writes (the modules above handle writes)
- **Bus subscribes:** `workout:logged`, `set:logged`, `programme:imported`
- **Dexie reads:** `workout_plan_cache`, `exercise_logs`, custom workouts

### 4.3 Cardio

**`cardio.html`**
- **Dexie writes:** `VYVELocalDB.cardio.upsert()`, `VYVELocalDB.cardio.delete()`
- **Bus publishes:** `cardio:logged`, `cardio:failed`
- **Supabase write path:** Direct `/rest/v1/cardio` POST/DELETE (5 sites total — includes member_running_plans reads at `/rest/v1/member_running_plans`)
- **Subscribers reacting:** `cardio.html` (own re-paint), `index.html`, `achievements-evaluator.js`
- **Note:** PM-307 removed walking from cardio.html in favour of movement.html. Per PM-321 dead-code stays in cardio-history.html as no-op filter.

### 4.4 Movement

**`movement.html`**
- **Dexie writes:** `VYVELocalDB.workouts.upsert / delete` (legacy two-table routing, see master §6 movement_activities entry), `VYVELocalDB.workout_plan_cache.upsert()` (programme progress)
- **Bus publishes:** `movement:logged`, `movement:failed`, `workout:logged`, `workout:failed` — **dual-publishes both event families**, almost certainly a leftover from PM-307 where the movement track was migrated from `workouts` table to its own `movement_activities` table but the publish wasn't fully scrubbed
- **Supabase write path:** Direct `/rest/v1/movement_activities` (3 sites) AND `/rest/v1/workouts` (movement writing to workouts table — same legacy bridge that PM-307 was supposed to retire)
- **Auditor note:** Confirm whether movement.html still writes `workouts` table on top of `movement_activities`. Per PM-307 brain entry, the two-table routing was collapsed to one table; but the REST inventory shows movement.html still hits both.

### 4.5 Mind (six pages)

**`breathwork.html` / `meditation.html` / `sleep.html` / `visualisation.html` / `journal.html` / `affirmations.html`**
- Each writes to `mind_activities` table only.
- **Dexie writes:** `VYVELocalDB.mind_activities.upsert()` (8 total across the 6 pages — journal writes twice because of edit-vs-create), `VYVELocalDB.mind_activities.delete()` (also 8 — undo paths)
- **Bus publishes:** `mind:logged` (per page), `mind:failed` (per page); breathwork.html + journal.html additionally publish `mind:unlogged`
- **Supabase write path:** Direct `/rest/v1/mind_activities` POST/DELETE (18 sites across 7 files — also includes `mind.html` and `wellbeing-checkin.html` which READ from mind_activities for aggregation)
- **Affirmations specifically:** also writes `VYVELocalDB.affirmation_favourites.upsert/delete` for the favourites toggle. Bus publish for that? — no, favourites doesn't have a separate event; appears to be local-only state.

**`mind.html`** — hub subscriber, no writes
- **Bus subscribes:** `mind:logged`, `mind:failed`, `mind:unlogged`
- **Dexie reads:** `mind_activities`, `mind_videos`, `breathwork_patterns`, `affirmations_library`

**`mind-library.html` / `mind-insights.html`** — both read-only

**`player-tracker.js`** — video watch attribution (loaded on mind videos + replay surfaces)
- **Bus publishes:** `mind:logged` with legacyPayload shape (for mind video views)
- **Outbox writes:** `VYVEData.writeQueued` (4 sites — the only consumer of the outbox path in the whole repo besides replay-tracker.js)
- **Direct REST:** `/rest/v1/replay_video_views`, `/rest/v1/session_live_views` (PM-304 unified tracker, writes both shapes)

### 4.6 Connect

**`connect-checkin.html`** — daily Connect check-in write
- **Dexie writes:** `VYVELocalDB.connect_checkins.upsert/delete()` (3 sites), `VYVELocalDB.checkin_reactions.upsert()`
- **Bus publishes:** `connect:checkin:logged`, `connect:checkin:failed`, `connect:reaction:logged`, `connect:reaction:cleared`
- **Supabase write path:** Direct `/rest/v1/connect_checkins` (4 sites), `/rest/v1/checkin_reactions` (9 sites across the 3 connect files), `/rest/v1/members` (display name preference at check-in?)
- **EF calls:** `connect-feed-preview` (4 sites across the 3 files)

**`connect-feed.html`** — feed + reactions
- **Dexie writes:** `VYVELocalDB.checkin_reactions.upsert()`
- **Bus publishes:** `connect:reaction:logged`, `connect:reaction:cleared`
- **EF calls:** `connect-feed-counts`, `connect-feed-preview`

**`connect.html`** — hub subscriber + reactions
- **Dexie writes:** `VYVELocalDB.checkin_reactions.upsert()` (recent check-ins card)
- **Bus publishes:** `connect:reaction:logged`, `connect:reaction:cleared`
- **Bus subscribes:** `mind:logged`, `body:logged` (phantom), `connect:reaction:logged`, `connect:reaction:cleared`, `connect:checkin:logged`, `connect:checkin:failed`, `connect:challenge:progress` (phantom), `connect:hydrated` (phantom)
- **Auditor note:** Three of connect.html's subscriptions have zero publishers. Connect's repaint depends on signals that don't fire.

**`connect-challenge.html`** — weekly challenge
- **Bus subscribes:** `mind:logged`, `body:logged` (phantom), `connect:checkin:logged`, `connect:challenge:progress` (phantom)
- **Supabase write path:** `/rest/v1/weekly_challenge_participation`
- **EF calls:** `connect-challenge-summary`

**`connect-calendar.html`** — read-only catalogue surface
- **No writes.** Subscribes to `vyve-localdb-table-pulled` for calendar_occurrences hydrate.

### 4.7 Check-ins

**`wellbeing-checkin.html`** — weekly
- **Dexie writes:** `VYVELocalDB.wellbeing_checkins.upsert()`
- **Bus publishes:** `wellbeing:logged`, `wellbeing:failed`
- **Supabase write path:** Direct `/rest/v1/wellbeing_checkins`, `/rest/v1/weekly_scores`, `/rest/v1/members`. **MASSIVE READ SURFACE** — reads from 10 tables for the activity recap card (PM-362.b): `daily_habits`, `workouts`, `cardio`, `movement_activities`, `mind_activities`, `connect_checkins`, `session_views`, `session_live_views`, `replay_views`, `replay_video_views`. Plus `connect_checkins` and `mind_activities`.
- **EF calls:** `wellbeing-checkin` (the submit path uses the EF for AI recs in addition to the direct REST writes)

**`monthly-checkin.html`** — monthly 8-pillar
- **Bus publishes:** `monthly_checkin:submitted`, `monthly_checkin:failed`
- **Supabase write path:** `/rest/v1/wellbeing_checkins`?, also reads from `daily_habits`, `workouts`, `cardio`, `session_views`, `replay_views`, `members`
- **EF calls:** `monthly-checkin`
- **Bus subscribes:** `habit:logged`, `monthly_checkin:submitted` (own)
- **Auditor note:** Backlog comment at master.md L? notes "monthly check-ins currently earn ZERO credit (no counter trigger, no charity trigger)" — may be true, may be stale. monthly_checkin:submitted IS in achievements-evaluator EVENT_HANDLERS so handler exists; the gap is server-side trigger, not client wiring.

### 4.8 Nutrition

**`nutrition.html`** — weight + water + TDEE targets
- **Bus publishes:** `weight:logged` (1 site), `weight:failed` (3 sites)
- **Supabase write path:** Direct fetches to `weight_logs` table found in comments but no explicit `/rest/v1/weight_logs` in the regex — needs deeper look. Auditor note: PM-365 brain entry says "logWeight() optimistic-paint per PM-60 local-first contract" — so it's writing somewhere. Find the path.
- **Water:** PM-365 added `adjustWater(+/-)` → `selection()` haptic. Where does water store? — no `/rest/v1/water_*` or `/rest/v1/hydration` REST call observed. **Possibly local-only state.** Worth confirming.
- **TDEE save:** `saveTargets()` per PM-365 — writes to `members` table or a dedicated targets table? Audit confirm.
- **Bus subscribes:** `vyve-outbox-dead` (window event)

**`log-food.html`** — food logging
- **Bus publishes:** `food:logged` (2 sites), `food:deleted`, `food:failed` (4 sites)
- **Supabase write path:** Direct `/rest/v1/nutrition_logs`? — not in my regex hits. Likely via EF.
- **EF calls:** `off-proxy` (Open Food Facts)
- **Bus subscribes:** `food:failed` (own revert), `vyve-outbox-dead`
- **Note:** PM-374 locked food log as Coming Soon — surface is unreachable from nutrition.html nav and shows a cover overlay on direct nav. Code paths intact but inert.

### 4.9 Sessions / Replays / Live

**`session-live.js`** — live session lifecycle (loaded on 8 `*-live.html` shells)
- **Dexie reads:** `calendar_occurrences`, `replay_playlists`
- **No direct Dexie writes** — delegates to player-tracker.js
- **Bus subscribes:** none directly; uses `vyveAuthReady` + `vyve-localdb-table-pulled` window listeners
- **Note:** Coordinates the state machine PRE_ROLL → LIVE → COMPLETED. Tracker init/destroy is its responsibility.

**`tracking.js`** (legacy, still loaded on 17 shells)
- **Bus publishes:** `session:viewed`, `session:viewed:failed`
- **Supabase write path:** internal — its own POST to `session_views` table (need to confirm; my regex didn't catch a /rest/v1/ hit in tracking.js)
- **Auditor note:** Per the brain (§23.67), tracking.js was supposed to be retired by PM-251. It is still loaded everywhere. Two trackers running simultaneously on 8 `*-live.html` shells (legacy + player-tracker).

**`replay-tracker.js`** (orphan — loaded on 0 pages)
- **Bus publishes:** `replay:viewed` (never fires since module isn't loaded)
- **Dexie writes:** `VYVELocalDB.replay_video_views.upsert()`
- **Outbox writes:** `VYVEData.writeQueued({table:'replay_video_views', ...})`
- **Supabase write path:** `/rest/v1/replay_video_views` POST (initial) + PATCH (every 30s)
- **Auditor note:** Dead module in the tree. Either delete or restore the script tag on replay pages. Per master §11A "v1 no-ops: reactions_received, checkins_with_reactions, chat_messages_posted" — but `replays_watched` ISN'T flagged as no-op, suggesting the achievement metric assumes data flows that no longer happen.

**`player-tracker.js`** — PM-304 unified tracker
- **Loaded on:** 8 `*-live.html` shells + `replays.html` + `replay-category.html` + `mind.html`
- **Outbox writes:** `VYVEData.writeQueued` (4 sites)
- **Supabase write path:** `/rest/v1/replay_video_views` AND `/rest/v1/session_live_views` (polymorphic on `mode='replay'|'live'`)
- **Bus publishes:** `mind:logged` (when in mind-video mode)
- **Auditor note:** Doesn't publish `replay:viewed` or `session:viewed`. Achievement metrics that depend on those events (per evaluator EVENT_HANDLERS) won't fire from this tracker. Either the evaluator needs to listen to a different event, or the tracker needs to publish.

**`sessions.html`** — session list page
- **Loads `tracking.js` only** (no player-tracker or session-live, since it's the index page not a live shell)
- **No writes** — read-only catalogue

**`replays.html` / `replay-category.html`** — replay browser
- **Loaded modules:** `player-tracker.js` (for inline video tracking inside the replays page)
- **No direct writes** — relies on tracker

### 4.10 Focus pages (12 pages under `/focus/`)

**`focus-shell.js`** — shared chrome
- **Dexie writes:** indirect via parent surface's `write_target` mapping (catalogue defines `mind_activities` / `connect_checkins` / `cardio` / `nutrition_logs` per slug)
- **Bus publishes:** `focus:write_failed` (orphan publisher), AND publishes the underlying surface event (`mind:logged`, etc.) by routing via the write_target spec
- **Window dispatch:** `vyve-localdb-table-pulled` (1 site) — fires synthetic table-pulled events so subscribers re-read after focus writes
- **Auditor note:** Focus shell is a meta-surface — every focus page writes to whatever table its slug maps to. Per PM-353, focus pillar reads from 4 source tables: cardio, connect_checkins, mind_activities, movement_activities. The `nutrition_logs` route is now dead per PM-374 food-log lockdown.

### 4.11 Profile / Settings

**`settings.html`** — covered above under Habits. Also:
- **Avatar upload:** writes to Supabase Storage bucket `member-avatars`, then writes `avatar_url` to `members` table, publishes `avatar:changed`
- **Persona switch:** writes `members.persona`, publishes `persona:switched`
- **Specific goal:** writes `members.specific_goal`, publishes `specific_goal:changed`
- **Name preference:** writes `members.display_name_preference` (4 `members.upsert` Dexie writes total)
- **HK connect toggle:** writes `member_health_connections` (need REST confirm — not caught in my regex)

**`settings-account.html`** — GDPR + account-level
- **EF calls:** `gdpr-export-request`
- **No bus events**

### 4.12 Other write surfaces

**`achievements-evaluator.js`** — listens to 13 events, claims achievement earns
- **Dexie writes:** `VYVELocalDB.member_achievements.upsert()` — local mirror of earned tiers (1 site)
- **EF calls:** `achievement-claim` (2 sites — claimOne flow), `achievements-mark-seen` (via `achievements.js`)
- **Bus subscribes:** via `EVENT_HANDLERS` loop — 13 events (see §3 above). No bus publishes from this module itself.

**`achievements.js`** — toast UI + replay-unseen
- **EF calls:** `achievements-mark-seen`, `log-activity`
- **Bus events:** Doesn't publish or subscribe directly to VYVEBus; coordinates via `window.VYVEAchievements.queueEarned([...])` global API call from the evaluator.

**`hydration.js`** — first-paint welcome overlay (loaded on index.html only)
- **No Dexie writes** — local-only dismissal state
- **Window dispatch:** `vyve-hydration-dismissed` (1 site)
- **Reads:** `persona_welcome_copy` catalogue (Dexie + REST fallback) per PM-372

**`prompts.js`** — member prompt questionnaires (loaded on index.html only, PM-375)
- **Dexie writes:** `VYVELocalDB.member_prompt_dismissals.upsert()` (3 sites)
- **Supabase write path:** Direct `/rest/v1/member_prompt_dismissals` (upsert on conflict), `/rest/v1/member_prompt_responses` POST. Both with `keepalive:true`.
- **No bus events** — system fires UI-side only

**`shared-workout.html`** — workout import endpoint
- **Bus subscribes:** likely listens for `programme:imported` to bounce home
- **EF calls:** `share-workout` (via workouts-programme.js)

**`leaderboard.html`** — read-only
- **EF calls:** `leaderboard`
- **No writes**

**`certificates.html`** — read-only
- **EF calls:** `member-dashboard` (for the certificate block)
- **Bus subscribes:** `certificate:earned` (orphan — see notes)

**`running-plan.html`** — AI running plan
- **EF calls:** `anthropic-proxy` (single call to generate)
- **Supabase write path:** `member_running_plans` writes — but my regex caught only the READ from cardio.html. Auditor confirm where running-plan.html writes to.

**`personal-bests.html`** — read-only PBs surface

---

## 5. Module-level summary

| Module | Loaded on | Writes Dexie | Writes Supabase | Publishes | Subscribes |
|---|---|---|---|---|---|
| `bus.js` | every page (via auth.js cascade) | n/a | n/a | n/a — bus core | n/a |
| `db.js` | every page | n/a (defines stores) | n/a | n/a | n/a |
| `sync.js` | every page | yes — hydrates from server | reads only | window: `vyve-localdb-*`, `vyve-syncqueue-dead` | window: `vyve-back-online`, `vyve-outbox-drained` |
| `auth.js` | every page | no | no | window: `vyveAuthReady`, `vyveSignedOut` | n/a |
| `home-state-local.js` | index, connect, engagement-v2 | no | no | none | none (pure compute lib) |
| `vyve-home-state.js` | every page (~36 loads) | no | no | unknown (separate module — auditor: confirm shape) | unknown |
| `vyve-offline.js` | every page | yes — outbox dead-letter Dexie deletes | no (only consumes the outbox) | `<table-event>:failed` (the literal-string bug), `vyve-outbox-dead`, `vyve-outbox-drained` | window: `vyve-back-online`, `vyveAuthReady` |
| `firstPaintHydrate.js` | various | no (loader only) | no | unknown | unknown |
| `hydration.js` | index.html only | no | no | window: `vyve-hydration-dismissed` | none |
| `haptics.js` | 37 pages (PM-364 sweep) | no | no | none | window: `vyveHapticReady`(?) — pure bridge |
| `profile.js` | 3 pages | no | no | none | none — pure utility |
| `prompts.js` | index.html only | yes — `member_prompt_dismissals` | yes — `member_prompt_dismissals`, `member_prompt_responses` | none | none |
| `nav.js` | every page | no | no | n/a | n/a |
| `theme.js` | every page | no (localStorage) | no | n/a | n/a |
| `achievements.js` | 25 pages | no | no | n/a (uses VYVEAchievements global, not bus) | n/a |
| `achievements-evaluator.js` | 18 pages | yes — `member_achievements` | yes — `achievement-claim` EF | n/a | via EVENT_HANDLERS loop: 13 events |
| `focus-shell.js` | focus pages | yes — table per slug | yes — table per slug | `focus:write_failed`, surface-specific events, window: `vyve-localdb-table-pulled` | n/a |
| `session-live.js` | 8 `*-live.html` shells | no | no | none | window: `vyve-localdb-table-pulled`, `vyveAuthReady` |
| `session-rp.js` | 7 of 8 `*-rp.html` shells (`events-rp.html` missing — PM-379: also missing `theme.js` AND `session-rp.css`, three tags total) | no | no | none | window: `vyveAuthReady` |
| `tracking.js` (legacy) | 17 live + rp shells | no | yes — `session_views` AND `replay_views` (PM-379 correction — `isReplay` switch at L42 routes to `replay_views` on rp shells, `session_views` on live shells) | `session:viewed`, `session:viewed:failed` | own retry path |
| `player-tracker.js` | 8 live shells + replays + replay-category + mind | yes — `replay_video_views` | yes — outbox path | `mind:logged` (only) | none |
| `replay-tracker.js` | 0 pages — orphan | yes — `replay_video_views` | yes — outbox | `replay:viewed` (never fires) | none |
| `workouts-session.js` | workouts.html | yes — `workouts`, `exercise_logs` | yes — same tables direct REST | `set:logged`, `workout:logged`, `workout:failed`, `workout:shared` | window: `vyve-outbox-dead`, `vyveAuthReady` |
| `workouts-builder.js` | workouts.html | yes — `custom_workouts` | yes — `custom_workouts` | `workout:logged` | none |
| `workouts-programme.js` | workouts.html | no | yes — `workout_plan_cache`, `workout_plans`, `custom_workouts`, `exercise_logs` | `workout:logged`, `workout:shared`, `programme:imported` | none |
| `workouts-notes-prs.js` | workouts.html | no | yes — `exercise_notes`, `exercise_logs`, `workouts` | none | none |
| `workouts-exercise-menu.js` | workouts.html | no | yes — `exercise_swaps` | none | window: `pointermove`, `pointerup`, `pointercancel` (drag UX) |
| `workouts-library.js` | workouts.html | no | reads `workout_plan_cache` | none | none |
| `workouts-config.js` | various | no | no | n/a | `vyveAuthReady` |
| `healthbridge.js` | (via Capacitor bridge) | yes — HK autotick writes via REST to `daily_habits` / `workouts` / `cardio` | yes — `member_health_*` tables | none | `vyveAuthReady` |
| `push-native.js` | (via Capacitor) | no | yes — `push_subscriptions_native` (via register-push-token EF) | none | none |
| `offline-manager.js` | every page (offline ground truth) | n/a | no | window: `vyve-back-online` | n/a |
| `dexie-source-indicator.js` | (dev/debug) | no | no | none | window: `vyve-localdb-*` listeners + PostHog capture |
| `mind-journal-prompts.js` | (catalogue data) | n/a | n/a | n/a | n/a |
| `home-focus-catalogue.js` | (catalogue data) | n/a | n/a | n/a | n/a |
| `sessions-data.js` | (catalogue data) | n/a | n/a | n/a | n/a |

---

## 6. Edge Function call surface (client → EF)

Each EF and where the client calls it.

| EF | Called from | Frequency |
|---|---|---|
| `member-dashboard` | `certificates.html`, `habits.html` | 2 sites — but most pages presumably also call it via cached hydrate. The two direct sites are special cases. |
| `monthly-checkin` | `monthly-checkin.html` | 1 — submit |
| `wellbeing-checkin` | `wellbeing-checkin.html` | 1 — submit |
| `log-activity` | `achievements.js`, `session-live.js` | 2 — evaluate_only + session-view path |
| `notifications` | `index.html` | 1 — fetch unread list |
| `leaderboard` | `leaderboard.html` | 1 |
| `share-workout` | `workouts-programme.js`, `workouts-session.js` | 6 — share + adopt |
| `workout-library` | `workouts-library.js` | 3 |
| `connect-feed-preview` | `connect-checkin.html`, `connect-feed.html`, `connect.html` | 4 |
| `connect-feed-counts` | `connect-feed.html`, `connect.html` | 2 |
| `connect-challenge-summary` | `connect-challenge.html`, `connect.html` | 2 |
| `off-proxy` | `log-food.html` | 1 |
| `anthropic-proxy` | `running-plan.html` | 1 |
| `gdpr-export-request` | `settings-account.html` | 1 |
| `schedule-push` | `habits.html` | 1 — "Remind me in 2h" |
| `platform-alert` | 9 pages (certificates, habits, index, log-food, monthly-checkin, nutrition, running-plan, wellbeing-checkin, workouts) | client-side error/skeleton-timeout reporter |
| `achievement-claim` | `achievements-evaluator.js` | 2 — claim earn |
| `achievements-mark-seen` | `achievements.js` | 1 — toast dismiss |

---

## 7. Direct PostgREST writes — table-by-table

| Table | Written from | Read from (subset — focus on aggregators) |
|---|---|---|
| `daily_habits` | habits.html (via Dexie + outbox/REST), index.html, settings.html (read?) | monthly-checkin, wellbeing-checkin |
| `workouts` | workouts-session.js, workouts-notes-prs.js, movement.html | monthly-checkin, wellbeing-checkin |
| `cardio` | cardio.html | monthly-checkin, wellbeing-checkin |
| `movement_activities` | movement.html | wellbeing-checkin |
| `mind_activities` | 6 mind pages | mind.html, wellbeing-checkin |
| `connect_checkins` | connect-checkin.html | wellbeing-checkin |
| `checkin_reactions` | connect-checkin, connect-feed, connect.html | |
| `wellbeing_checkins` | wellbeing-checkin.html | monthly-checkin |
| `weekly_scores` | wellbeing-checkin.html | |
| `weekly_challenge_participation` | connect-challenge.html | |
| `exercise_logs` | workouts-session.js, workouts-notes-prs.js, workouts-programme.js | |
| `exercise_notes` | workouts-notes-prs.js | |
| `exercise_swaps` | workouts-exercise-menu.js | |
| `custom_workouts` | workouts-builder.js, workouts-programme.js | |
| `workout_plan_cache` | exercise.html, movement.html, workouts-library.js, workouts-programme.js, workouts-session.js | |
| `workout_plans` | workouts-programme.js | |
| `member_running_plans` | cardio.html | running-plan.html (probably writes — auditor confirm) |
| `members` | connect-checkin, monthly-checkin, settings, wellbeing-checkin | catalogue read everywhere |
| `affirmation_favourites` | affirmations.html | |
| `member_prompt_dismissals` | prompts.js | |
| `member_prompt_responses` | prompts.js | |
| `replay_video_views` | replay-tracker.js (orphan), player-tracker.js | wellbeing-checkin (reads) |
| `session_live_views` | player-tracker.js | wellbeing-checkin (reads) |
| `session_views` | tracking.js | monthly-checkin, wellbeing-checkin |
| `replay_views` | tracking.js (presumably — rp shells fire it) | monthly-checkin, wellbeing-checkin |
| `calendar_occurrences` | (read only by session-live.js) | |
| `taglines` | (read only by connect.html, mind.html) | |

---

## 8. Notes for the Chat 5 auditor (surfaced inline above, consolidated here)

1. **`body:logged` phantom contract.** Three connect surfaces subscribe; nothing publishes. Likely cause of Connect counter lag after body activity.
2. **`replay:viewed` — NOT orphan (PM-379 correction).** Original entry called `replay-tracker.js` the only publisher; reality is `player-tracker.js` also publishes via dynamic `cfg.busEvent` indirection on 11 pages. Achievement metric `replays_watched` is live. `replay-tracker.js` itself is loaded on 0 pages (orphan module, can be deleted as cleanup).
3. **`tracking.js` not retired.** Brain claims PM-251 dropped it; it's still on 17 shells, including all 8 `*-live.html` shells which now also load `player-tracker.js`. Two trackers run simultaneously on live shells.
4. **`events-rp.html` is out-of-band.** Missing `session-rp.js`, `theme.js`, AND `session-rp.css` (three tags — PM-379 correction). Single rp shell that differs from the other 7.
5. **`movement.html` dual-writes.** Per PM-307 brain entry, movement should write only `movement_activities`. Inventory shows REST writes to BOTH `movement_activities` AND `workouts`, plus bus publishes of BOTH `movement:logged` AND `workout:logged`. Two-table routing wasn't fully collapsed.
6. **`<table-event>:failed` — NOT a code bug (PM-379 correction).** The literal appears only inside a `/* ... */` docblock at `vyve-offline.js` L721 describing the public contract of the outbox dead-letter publish. The real publish at L796 uses `map.event` (dynamic, from FAILURE_TABLE_MAP). Retract the flag.
7. **`'daily_habits'` stray subscribe in index.html L2461.** Using a Dexie table name as event name. Dead code.
8. **`connect:challenge:progress` and `connect:hydrated` orphan subscribers.** Confirm whether intentional (Realtime bridge planned) or dead listeners.
9. **`certificate:earned` orphan subscriber.** Server-side cron produces certs; no client publisher today. May be valid forward design.
10. **`avatar:changed`, `specific_goal:changed`, `focus:write_failed` orphan publishers.** Confirm whether anyone needs to react and is currently missing.
11. **`weight_logs` and `water/hydration` write paths in nutrition.html unclear.** My inventory didn't catch a direct REST write or outbox call. Confirm whether water is local-only (probably yes per PM-365 wording) and whether weight writes via outbox or a hidden path.
12. **`workouts-builder.js` publishing `workout:logged`.** A builder publishing a completion event is suspicious. Confirm intent.
13. **`workouts-notes-prs.js`, `workouts-exercise-menu.js`** publish no bus events despite writing tables. Confirm whether subscribers expect `swap:applied` / `note:saved` / `pr:logged` (none found).
14. **VYVEBus subscribe to `vyve-localdb-table-pulled` is dead, not bridged (PM-379 correction).** `engagement-v2.html` L1642 calls `VYVEBus.subscribe('vyve-localdb-table-pulled', recompute)` — there is NO bridge in bus.js, and the event-name fails the regex (`EVENT_NAME_RE` requires a colon). The subscriber never registers. Fix: convert to `window.addEventListener('vyve-localdb-table-pulled', recompute)` to match every other consumer. See audit Flag P0-1 + Flag 14 for context.
15. **Audit signal §23.65** (envelope-trusted subscribers): brain notes `engagement.html`, `mind.html`, `connect.html`, `exercise.html` still to audit. From this inventory: `engagement.html` is the old v1 score page (read-only); `mind.html` subscribes to `mind:logged`/`failed`/`unlogged` and calls re-render — confirm whether it trusts envelope or re-reads Dexie; `connect.html` is the phantom-subscriber risk (see #1); `exercise.html` only reads `workout_plan_cache` — likely no §23.65 risk.
16. **Achievement evaluator gap on `replay:viewed`.** The evaluator's EVENT_HANDLERS map lists `replay:viewed` as a target event; the only publisher (replay-tracker.js) is loaded on 0 pages. The `replays_watched` metric is unreachable in production today.
17. **§23.7.6 audit signal:** the brain lists pages to audit including cardio.html, workouts.html, wellbeing-checkin.html, monthly-checkin.html, nutrition.html, log-food.html. Each has a synchronous-tap surface; confirm in Chat 5 that none re-derive UI state from the bus subscriber pass.

---

End of architecture map. This is the inventory of what IS. Chat 5 will audit what SHOULD-BE against this baseline.
