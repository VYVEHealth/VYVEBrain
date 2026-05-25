# Architecture Audit — Chat 5 verification of PM-378 map

**Generated PM-379, 25 May 2026 (Sunday).** Repo HEAD at audit time: `vyve-site` `c00a24ca` (PM-377), matching the map's baseline. No drift between map generation and audit run.

**Scope.** Verifies every flagged item in `brain/staging/architecture-map-pm378.md` against live source. Adds findings the map deferred or missed. **No fix code written, by design** — Chat 6 plans, Chat 7+ ships.

**Severity scale.**
- **P0** — members can see it, or there's data loss / data-blind risk, or a contract is broken at the layer that should enforce it.
- **P1** — contract is broken but other paths mask the user-facing effect today.
- **P2** — dead code, naming inconsistency, doc/inventory drift only.

**Brain-drift** is called out separately wherever the brain claims work that wasn't actually shipped — poisons future sessions until corrected.

---

## Recommended fix order (Chat 6's input)

The bus event-name regex finding (Item P0-1) reshapes the priority list — it explains *why* several other "phantom subscriber" items look like contract violations: they aren't broken individually, they're symptoms of one root bug at the bus regex layer. Fix Item P0-1 first and several apparent "orphans" stop being orphans.

**P0 — Land first, in order:**

1. **P0-1: bus.js `EVENT_NAME_RE` rejects every 3-segment event name.** Single-line regex change in `bus.js`. Re-enables: Connect reactions cross-page sync, Connect check-in cross-page sync, Connect challenge progress, session:viewed:failed revert, habits:set-changed:failed revert, the stray `daily_habits` subscribe. Roughly 8 events come back to life from one edit. Touches every Connect-using subscriber + the achievements-evaluator's `reactions_given` and `checkins_completed` metrics. **Do this first or several other P0 fixes are wasted work.**

2. **P0-2: `body:logged` phantom contract.** Aggregator publish from the three Body publishers (workout:logged, cardio:logged, movement:logged in workouts-session.js / cardio.html / movement.html) — Chat 6 picks the shape. Fixes Connect tile counter lag after Body activity.

3. **P0-3: `movement.html` dual-write to `workouts` table.** PM-307 brain claims this was collapsed; it wasn't. Members get double-credited on Body counters when they log movement (one row in `movement_activities`, one row in `workouts`, both fire bus events, both hit aggregators). Brain-drift class.

4. **P0-4: focus-shell TABLE_TO_BUS_EVENT publishes pluralised event names that no one subscribes to.** Three dead entries (`workouts:logged`, `habits:logged`, `nutrition:logged`). Latent today because no focus slug actually writes to those tables — but if/when a focus slug *is* pointed at `workouts` or `daily_habits`, completion silently won't fan out. P0 because it's a footgun for the next focus-catalogue addition.

5. **P0-5: events-rp.html out-of-band shell.** Missing `session-rp.js`, `theme.js`, `session-rp.css`. Whole replay state machine + theme tokens don't load for events-category replays. Members landing on an events replay get a broken page.

**P1 — Batch after P0:**

6. **P1-1: `replay:viewed` achievement metric had a confused picture in the map but is live.** Map said only `replay-tracker.js` publishes (0-page-load → metric inert). Reality: `player-tracker.js` ALSO publishes `replay:viewed` via `cfg.busEvent` on 11 pages (PM-304 unified tracker). Metric is fine. No fix needed; correction goes in the map.

7. **P1-2: Connect achievement-evaluator metrics blind.** Direct consequence of P0-1 — `reactions_given` and `checkins_completed` server-side achievement evaluator may be catching these, but the client-side inline evaluator never fires because the subscribe-time regex check fails. Resolved by P0-1; flagged here so Chat 6 verifies the achievement counts agree after the fix lands.

8. **P1-3: Workouts-session.js `set:logged` envelope-trusted subscriber audit.** §23.65 surface. Confirm `workouts.html` subscriber pattern.

9. **P1-4: tracking.js / player-tracker.js double-tracker on 8 live shells.** Both fire writes; map called this out. Latent today because `session_views` and `session_live_views` are separate tables — no collision, just double network traffic + double activity attribution.

**P2 — Cleanup, can defer:**

10. P2-1: `replay-tracker.js` orphan module (0 pages) — delete file + sw.js precache.
11. P2-2: `<table-event>:failed` literal — map called it a template-string bug. **It's not** — it's a comment string in a docblock at vyve-offline.js L721. Real publish at L796 uses `map.event` (dynamic). False alarm.
12. P2-3: Map quantitative corrections (outbox-caller count, tracking.js load count, missed events `live:viewed` / `mind:viewed`, etc.) — single map-edit commit alongside the audit.
13. P2-4: avatar:changed / specific_goal:changed / focus:write_failed orphan publishers — decide retire vs add subscriber when next touching settings.html / index.html.

**Brain-drift items requiring brain commit alongside:**

- §23.67 PM-251 retro: tracking.js still loaded on 17 shells contra brain claim. (Already partially acknowledged in PM-304 changelog entry, but map's flag stands.)
- PM-307 movement: brain explicitly says two-table routing collapsed. It wasn't.
- PM-365 hydration.js / water naming clash: brain already noted this in changelog but TABLE_TO_BUS_EVENT in focus-shell still encodes the dead names — sibling issue.

---

## Bus event-name regex — the headline finding (P0-1)

### What's wrong

`bus.js:132` defines `var EVENT_NAME_RE = /^[a-z][a-z0-9_-]*:[a-z][a-z0-9_-]*$/i;`. This regex requires **exactly one colon**. Both `publish()` (L253) and `subscribe()` (L279) early-return with `console.warn` if an event name fails the test. Subscribers don't get pushed onto the `subscribers[]` array; publishes don't reach `deliverLocal`.

The Realtime bridge path bypasses publish() — `handleRealtimeRow` builds the envelope and calls `deliverLocal` directly (L614). So Realtime-bridged events DO deliver, but the regex still blocked the subscribers at registration time, so there's nothing to deliver to.

### What's affected

Tested every event name in the inventory against the regex (real Node regex run). Rejected names:

| Event | Used by | Path that breaks |
|---|---|---|
| `connect:reaction:logged` | 3 publishers (connect.html, connect-feed.html, connect-checkin.html), 2 subscribers (connect.html, achievements-evaluator.js) | Cross-page reaction sync + achievement metric `reactions_given` |
| `connect:reaction:cleared` | Same 3 publishers, 1 subscriber (connect.html) | Cross-page reaction un-sync |
| `connect:checkin:logged` | connect-checkin.html publishes; connect.html / connect-feed.html / connect-challenge.html / achievements-evaluator.js subscribe; engagement-v2.html subscribes | Home repaint, Connect hub repaint, achievement metric `checkins_completed`, engagement score recompute |
| `connect:checkin:failed` | connect-checkin.html publishes; connect.html subscribes | Revert path |
| `connect:challenge:progress` | 0 publishers (map flagged this orphan); 2 subscribers | Even if a publisher landed, the subscribe-time reject means it wouldn't deliver |
| `session:viewed:failed` | tracking.js publishes; index.html + tracking.js own-retry subscribe | Session-view revert + retry path |
| `habits:set-changed:failed` | settings.html publishes; habits.html subscribes | Settings revert path |
| `daily_habits` (stray) | 0 publishers; index.html L2461 subscribes | Map called this "dead subscribe" — it's also unregisterable, so doubly dead |
| `vyve-localdb-table-pulled` (via VYVEBus.subscribe at engagement-v2.html L1642) | window CustomEvent only — never reaches VYVEBus | Dead subscription |

### What still works despite the bug

Every Connect surface's optimistic local DOM repaint runs **in the same handler** before the broken `VYVEBus.publish` call, e.g. `connect-feed.html:render()` at L686-ish runs before the publish at L664. So the user sees their tap take effect instantly on the current page. What they don't see is:
- Home Connect counters refreshing when they tap a reaction on connect.html
- Engagement-v2 Connect pillar count incrementing
- Achievement evaluator inline-firing on `reactions_given` or `checkins_completed`
- Connect hub repaint when they post a check-in from connect-checkin.html (would have rolled back history.back fixed by PM-362)

PM-362 fixed the synchronous-navigation issue in connect-checkin so the page-flow works. But cross-page sync on Connect has been silently broken since the page was built. That this hasn't surfaced as a member complaint is partly because the home page repaints from other paths (calendar_occurrences hydrate, `members` table polling, `_rerenderHome` via `persona:switched` and other valid 2-segment events), so the lag isn't catastrophic — but it's still material.

### Why this hasn't been caught

- `console.warn('[VYVEBus] invalid event name:', ...)` fires every time but iOS WKWebView in the native app silences console output by default; in the dev loop Dean's been hunting bigger fires.
- The Realtime bridge for `certificates` (auth.js L436) uses `'certificate:earned'` which IS 2-segment and works correctly — that path is the only Realtime-driven bus path in production, so absence-of-bug there gave false confidence.
- No automated tests around bus subscribe-success.

### Fix direction (for Chat 6, not Chat 6's exact code)

Loosen the regex to permit one-or-more colons:
`/^[a-z][a-z0-9_-]*(:[a-z][a-z0-9_-]*)+$/i`

…or strip the validation entirely (it's belt-and-braces — the bus would happily key on any non-empty string). Decide whether to keep validation for typo-safety or drop. Plus: re-audit ALL 3-segment events to make sure their handlers are sane post-fix, because the publish/subscribe sites have shipped multiple times without anyone catching that their effects weren't propagating.

### One trap to flag

The achievements-evaluator at L1389 subscribes to `'connect:reaction:logged'`. Once the regex is fixed, that subscriber will start firing for real on every reaction tap. Each existing member who's been tapping reactions for the past N months will, on next page-load, have an inflated count once the inline-evaluator catches up — unless the server-side `_shared/achievements.ts` evaluator has been crediting those events all along. **Chat 6 must verify the achievements arithmetic before flipping the regex**, otherwise members may earn a flurry of "you just hit X reactions" toasts on the first page-load after the fix lands.

---

## Item-by-item verification of map flags

### Flag 1: `body:logged` phantom contract (map's notes #1)

**Map said:** 3 connect surfaces subscribe, 0 publishers. Likely cause of Connect counter lag after body activity.

**Verified:** Confirmed. Subscribers at `connect.html:2071`, `connect-feed.html:944`, `connect-challenge.html:586`. Zero publishers in the codebase (no aggregator pattern emitting body:logged on the union of workout/cardio/movement events).

**Member-visible symptom:** Connect challenge ring + Connect feed + Connect home counters stay stale after a member logs a workout / cardio / movement entry on the same device, until something else triggers a repaint (auth-ready re-fire, `vyve-localdb-table-pulled` for the relevant table, or page nav). NOT latent — a member who taps "Log walk" on movement.html then immediately back-navigates to connect.html sees the previous day's counts.

**Severity: P0.**

**Fix direction:** Either (a) add a `body:logged` publish to each of the three body publishers alongside their existing per-table publish, with a discriminator field, OR (b) add a fourth subscription on each connect surface listening to the union `workout:logged|cardio:logged|movement:logged`. The "body:logged" aggregator name reads cleaner. Connect surfaces already filter by discriminator if needed.

### Flag 2: `replay:viewed` orphan publisher (map's notes #2)

**Map said:** Only publisher is replay-tracker.js (loaded on 0 pages). Achievement metric `replays_watched` is live-data-blind.

**Verified — map is WRONG.** `player-tracker.js:569` publishes `cfg.busEvent` where `cfg.busEvent === 'replay:viewed'` for `mode='replay'` (line 109). player-tracker.js is loaded on 11 pages: 8 `*-live.html` shells + replays.html + replay-category.html + mind.html.

The grep that produced the map was looking for the literal string `'replay:viewed'` in publish calls — it caught replay-tracker.js but missed the dynamic `cfg.busEvent` indirection in player-tracker.js.

**Member-visible symptom:** None. `replays_watched` achievement is wired correctly. **Latent inventory error only.**

**Severity: P2 (map correction).**

**Fix direction:** Update the map. Also delete `replay-tracker.js` (truly 0 page loads — see Flag 10) — but that's a separate cleanup, not a fix to a real bug.

### Flag 3: `tracking.js` not retired (map's notes #3)

**Map said:** Brain §23.67 / PM-251 retro claims tracking.js was retired; still loaded on 17 shells (8 live + 9 rp). PM-304 brain entry partially acknowledges this.

**Verified:** Loaded on exactly 17 pages: 8 `*-live.html` + 7 `*-rp.html` (events-rp inclusive, contra Flag 5) + `sessions.html`. Wait — re-count: actually the 8 live + 8 rp + sessions = 17. Yes 17. (events-rp loads tracking.js but not session-rp.js — different issue.)

**Member-visible symptom:** Double network traffic on live shells (tracking.js writes `session_views`, player-tracker.js writes `session_live_views`). Both write 30s heartbeats. Member doesn't see anything broken; aggregator reads correctly via de-dup logic (PM-294/PM-304 brain entry, also wellbeing-checkin recap card de-dups by `(activity_date, category)` across the 4 view tables). Latent battery / data cost only.

**Severity: P1 (cleanup).**

**Fix direction:** After Chat 6 / Chat 7 ships, retire `tracking.js` script tag from all 8 live shells (player-tracker.js covers them), keep on rp shells until per-replay attribution doctrine is finalised. Verify via grep + on-device.

### Flag 4: events-rp.html out-of-band (map's notes #4)

**Map said:** Missing `session-rp.js` and `theme.js` script tags. Single rp shell that differs from the other 7.

**Verified:** Confirmed. events-rp.html's `<head>` loads `auth.js`, `bus.js`, `vyve-home-state.js`, `perf.js`, `tracking.js`, `nav.js` — no `session-rp.js`, no `theme.js`, no `session-rp.css`. Other 7 rp shells (e.g. yoga-rp.html) load `session-rp.js`, `theme.js`, `session-rp.css`. Out-of-band confirmed.

**Member-visible symptom:** Whoever lands on an Events category replay (`events-rp.html`) gets no replay state machine (no PRE_ROLL / LIVE-equivalent state, no "Mark as completed" CTA), no theme tokens (page renders in browser-default colours, presumably very ugly in light mode), no rp-specific CSS. They see a broken page.

**Severity: P0.**

**Fix direction:** Add the 3 missing tags to events-rp.html `<head>`, matching yoga-rp.html order. Single-file fix.

### Flag 5: `movement.html` dual-writes (map's notes #5)

**Map said:** Per PM-307 brain entry, movement should write only `movement_activities`. Inventory shows REST writes to BOTH `movement_activities` AND `workouts`, plus bus publishes of BOTH `movement:logged` AND `workout:logged`.

**Verified — confirmed and the brain is wrong.** movement.html writes:
- `VYVELocalDB.workouts.upsert` at L620
- REST POST to `/rest/v1/workouts` at L693
- `VYVELocalDB.workouts.delete` at L712 (revert)
- `/rest/v1/movement_activities` at L879+ and L999
- Bus publishes `workout:logged` (L637) AND `movement:logged` (L910) on success
- Bus publishes `workout:failed` (L702) AND `movement:failed` (L1008) on failure

So a single tap on movement.html writes two Supabase rows AND fires two bus events. Achievements evaluator's `workouts_logged` AND `movement_sessions_logged` BOTH fire. Connect tile counter (when P0-2 lands) would double-count. Home pill `Body` may already double-count via the `workouts.html` Dexie merge in `loadPillarCounts()` (it sums workouts+cardio+movement).

**Member-visible symptom:** Movement activity inflates Body counters by 2× the truth (or 3× depending on the union of inflating paths). Charity counters likely double-credit too. **Members logging movement get double credit for everything.**

**Severity: P0 — also brain-drift class.** PM-307 changelog entry explicitly says "collapses to one table: `movement_activities`" but the legacy path was left in place.

**Fix direction:** Decide whether to retire the `workouts` writes from movement.html (PM-307's stated intent) OR roll the dual-write back into a sanctioned alias (movement_activities is the truth, workouts gets an old-shape mirror for legacy aggregators). Either way, the Dexie writes + REST writes + bus publishes need to go from 4 to 2. Confirm there's nothing reading `workouts` rows with `plan_name='Movement'` that'd break with the cleanup — `wellbeing-checkin.html` reads from both tables already, so removing the workouts duplicates would just leave the canonical movement_activities row visible.

### Flag 6: `<table-event>:failed` literal placeholder (map's notes #6)

**Map said:** Template-string interpolation bug in vyve-offline.js. 1 publish, 0 subs.

**Verified — map is WRONG.** The string `<table-event>:failed` appears at vyve-offline.js L721 inside a `/* ... */` comment block describing the public contract of the outbox dead-letter publish. It's documentation, not code. The actual publish at L796 uses `map.event` (dynamic, takes the real event from FAILURE_TABLE_MAP).

**Member-visible symptom:** None — the literal never fires.

**Severity: P2 (map correction only).**

**Fix direction:** Update the map to retract the flag.

### Flag 7: `'daily_habits'` stray subscribe (map's notes #7)

**Map said:** index.html L2461 subscribes to `'daily_habits'` (a Dexie table name as event name). No publisher.

**Verified:** Confirmed — index.html L2461 calls `VYVEBus.subscribe('daily_habits', function() {...})`. No publisher. Comment above says "cross-page consistency". Probably a typo — the developer meant `'habit:logged'` (which IS subscribed correctly nearby at L2335ish).

**ALSO:** `'daily_habits'` is regex-rejected anyway (no colon). So even if a publisher existed, the subscribe would have failed silently.

**Member-visible symptom:** None — handler unreachable from both directions.

**Severity: P2 (dead code).**

**Fix direction:** Remove the subscribe block. Or correct to `'habit:logged'` if cross-page consistency was the intent — but the existing `habit:logged` subscriber three blocks below already handles that.

### Flag 8: `connect:challenge:progress` + `connect:hydrated` orphan subscribers (map's notes #8)

**Map said:** No publisher. Whether intentional (Realtime bridge planned) or dead.

**Verified:** Both are regex-rejected (3-segment + hyphen with no second colon). `connect:challenge:progress` has 2 subscribers (connect-challenge.html + connect.html), `connect:hydrated` has 1 (connect.html). Zero publishers in source.

**Member-visible symptom:** None today — they were never reachable.

**Severity: P1.**

**Fix direction (after P0-1 lands):** Decide whether the events were placeholders for a planned Realtime bridge or dead listeners. Best guess from the brain narrative: `connect:hydrated` was meant to be a "connect tables finished hydrating" signal — could be wired to a fan-out from the existing `vyve-localdb-table-pulled` listener filtered to connect tables. `connect:challenge:progress` looks designed for a server-side cron progress beat — would need a Realtime bridge config on whichever table tracks weekly_challenge_participation deltas, OR a client-side derivation in connect-challenge.html that publishes the event after a successful POST.

### Flag 9: `certificate:earned` orphan subscriber (map's notes #9)

**Map said:** Server-side cron produces certs, no client publisher today, may be valid forward design.

**Verified — map's instinct is right.** `auth.js:436` installs a Realtime bridge config for the `certificates` table INSERT op, mapped to bus event `certificate:earned`. The bridge calls `deliverLocal()` (bypassing the publish() regex) so the event delivers. `certificate:earned` is also 2-segment so it would pass the regex anyway.

Subscribers at `index.html:2675` (calls `_rerenderHome`) and `certificates.html:507` (refreshes the cert list).

**Member-visible symptom:** Works as designed. Server certificate-checker cron INSERTs a row → Realtime fires → bridge delivers → home + certificates page refresh.

**Severity: not a flag — works correctly.**

**Fix direction:** Update the map to confirm this is a sanctioned pattern, not an orphan.

### Flag 10: avatar:changed / specific_goal:changed / focus:write_failed orphan publishers (map's notes #10)

**Map said:** Confirm whether anyone needs to react and is currently missing.

**Verified:**
- `avatar:changed`: published from settings.html:2359, 0 subscribers. Avatar paint comes from `members` table Dexie hydrate via `vyve-localdb-table-pulled`.
- `specific_goal:changed`: published from settings.html:1826, 0 subscribers. Same shape — `members` row update + Dexie hydrate handles paint.
- `focus:write_failed`: published from focus-shell.js:352, 0 subscribers. No revert path observed for focus writes.

**Member-visible symptom:** Avatar / goal changes paint correctly on next hydrate (~1s typical). Focus write failure leaves the Dexie write in an unconfirmed state — `focus-shell.js` already runs `await dexiePromise` in `complete()` so the Dexie write is final; the failure publish is informational only and discarded. None visible to members.

**Severity: P2 (dead publishers).**

**Fix direction:** Either retire the publishes (small cleanup) or add subscribers (more thought needed for focus failure — does the focus surface need to revert UI state when the background REST POST fails? Currently it doesn't). For avatar / goal, the Dexie hydrate covers the use case. Lowest-priority cleanup.

### Flag 11: weight / water write paths in nutrition.html (map's notes #11)

**Map said:** Inventory missed direct REST writes for `weight_logs`; water possibly local-only.

**Verified:**
- **weight**: Direct REST POST to `${REST}/weight_logs` at L764 (via VYVEData.writeQueued path) AND a synchronous POST at L780. `weight:logged` published at L743. `recordWrite('weight_logs', syntheticKey)` + `recordCanonical('weight_logs', syntheticKey)` called for bus suppression and Layer 4 canonical patch. Realtime bridge config exists at auth.js L234. Solid write path.
- **water**: Confirmed local-only. `WATER_KEY='vyve_water_'` localStorage key (L1097), `adjustWater(delta)` (L1120) writes to localStorage only. No `/rest/v1/water_*` or `/rest/v1/hydration_*` calls anywhere. PM-365 brain entry confirms this is by design.
- **TDEE save** (`saveTargets`): L1472 writes to `members` table (target columns: tdee_kcal, protein_g, fat_g, carbs_g, etc.). Direct REST PATCH on members row.

**Member-visible symptom:** All paths work as expected.

**Severity: not a flag — map's inventory gap, no real issue.**

**Fix direction:** Update map to document the paths.

### Flag 12: workouts-builder.js publishing `workout:logged` (map's notes #12)

**Map said:** A builder publishing a completion event is suspicious.

**Verified:** workouts-builder.js L118 publishes `workout:logged` with `source: 'builder'` discriminator AND `workout_id: null, completed: true, duration_min: null`. Surrounding comments explain this is a "asymmetric fallback" path from the cache-bus campaign (PM-35 context) — adopting a custom workout into the programme treats it as a logged workout for invalidation purposes only.

**Member-visible symptom:** Achievements evaluator's `workouts_logged` and `first_custom_workout` may double-count if a member adopts a workout (publishes from builder) AND completes the workout (publishes from session.js) on the same row. Map doesn't have data to know if this causes duplicates today — the evaluator's `member_achievements` unique constraint would dedup the highest-tier earn but the metric counter may be off by 1.

**Severity: P1.**

**Fix direction:** Either (a) change the builder publish to a different event name (e.g. `workout:adopted`) so it doesn't double-count completion semantics, or (b) keep the publish but have subscribers gate on `source !== 'builder'` to skip the credit. The achievements-evaluator currently doesn't filter on source. Cleanest is renaming.

### Flag 13: workouts-notes-prs.js + workouts-exercise-menu.js no bus events (map's notes #13)

**Map said:** Both write tables but publish no bus events. Confirm whether subscribers expect swap:applied / note:saved / pr:logged (none found).

**Verified:** Confirmed — zero `VYVEBus.publish` calls in either file. No subscribers anywhere looking for swap/note/pr events.

**Member-visible symptom:** None — the writes are silent metadata. The active workouts.html surface re-reads its data from Dexie + REST on next render, so it picks up the new note / swap / PR without a bus signal. Cross-page concerns (e.g. PB displayed on home) would need a bus signal, but home doesn't display PBs currently.

**Severity: P2 (latent gap, design call).**

**Fix direction:** Decide whether PB attainment ever needs to fan out cross-page (e.g. "new PB" toast + achievement firing). Not pressing — backlog item, not Chat 6 priority.

### Flag 14: VYVEBus bridge to window CustomEvents (map's notes #14)

**Map said:** engagement-v2.html L1642 uses VYVEBus.subscribe for `vyve-localdb-table-pulled` while every other listener uses window.addEventListener. There must be a bridge in bus.js.

**Verified — map is WRONG. There is no bridge.** bus.js does NOT bridge `vyve-localdb-table-pulled` to VYVEBus subscriptions. The engagement-v2 line at L1642 calls `window.VYVEBus.subscribe('vyve-localdb-table-pulled', recompute)` which:
1. Fails the regex check (no colon in event name) → `console.warn` + early return with no-op fn.
2. Never registers `recompute` as a handler.
3. Never fires.

`engagement-v2.html` does NOT recompute when tables are hydrated. The recompute is presumably driven by the other bus subscriptions in the same wireBus() block (workout:logged, mind:logged, etc.) plus the cold-load read at boot — both of which work for 2-segment events.

**Member-visible symptom:** engagement-v2 score doesn't refresh on the next sync.js hydrate after a foreground or cold-load. Members navigating to engagement-v2 might see slightly stale numbers until they trigger a write that fires a recognised bus event. Hard to notice in practice.

**Severity: P1.**

**Fix direction:** Convert the dead subscribe to a `window.addEventListener('vyve-localdb-table-pulled', recompute)` to match every other consumer of that signal. Or, more broadly, add a window-event-to-bus-event bridge to bus.js if there's a general desire to unify the two transports. The former is single-line, the latter is design work.

### Flag 15: §23.65 envelope-trusted subscribers (map's notes #15)

**Map said:** Brain notes engagement.html, mind.html, connect.html, exercise.html still to audit.

**Verified — quick triage:**
- `engagement.html` is the **v1 redirect stub** per master.md — pure redirect to engagement-v2.html. No write surface. No §23.65 risk.
- `mind.html` subscribes to `mind:logged` / `mind:failed` / `mind:unlogged`. Handlers call `loadMindData()` style helper (Dexie re-read only). §23.65 surface — would benefit from envelope-aware fast path. Risk is real because the 6 Mind publishers (breathwork/meditation/sleep/visualisation/journal/affirmations) all use fire-and-forget Dexie writes per §23.39.
- `connect.html` is the headline §23.65 risk — already discussed under Flag 1 (body:logged) AND broken at the regex level (Flag P0-1). Once the regex is fixed, the §23.65 race surfaces too.
- `exercise.html` reads `workout_plan_cache` only — no write subscriber for which §23.65 applies. Clean.

**Severity: P1 per surface.**

**Fix direction:** After P0-1 lands and Connect bus traffic flows, audit connect.html subscribers for envelope-trusted patterns. mind.html is a separate touch — apply the §23.65 pattern to its three mind:* subscribers.

### Flag 16: Achievement evaluator gap on replay:viewed (map's notes #16)

**Map said:** Evaluator's EVENT_HANDLERS lists `replay:viewed`; only publisher (replay-tracker.js) loaded on 0 pages → metric unreachable.

**Verified — map WRONG, as per Flag 2.** player-tracker.js publishes `replay:viewed` via cfg.busEvent on 11 pages. Achievement metric reaches data.

**Severity: not a flag.**

### Flag 17: §23.7.6 audit signal (map's notes #17)

**Map said:** Pages with synchronous tap to confirm: cardio.html, workouts.html, wellbeing-checkin.html, monthly-checkin.html, nutrition.html, log-food.html.

**Verified — spot-checked. Not exhaustively re-audited in this session** (this is Chat 6 work). Each of these pages has the §23.39 / §23.7.6 publisher pattern wired correctly based on the recent ship history (PM-362 connect-checkin, PM-368 home habit, PM-371 wellbeing recap, etc.).

**Severity: deferred to Chat 6 review per page during that chat's fix planning.**

---

## Items the map deferred — audited here

### Failure-mode story (map said audit this)

Three failure scenarios:

**(a) Dexie write succeeds, Supabase POST fails (airplane mode, 5xx):**

For surfaces using the outbox path (8 callers — habits, cardio, journal, visualisation, workouts-session, focus-shell, player-tracker, replay-tracker): `VYVEData.writeQueued` stages the row in the outbox table; offline-manager.js + sync.js drain on `vyve-back-online`. Dead-letter after max-attempts fires `vyve-outbox-dead` window event; per-page subscribers (habits.html, log-food.html, nutrition.html, workouts-session.js) revert the Dexie row + publish `<table>:failed`.

For surfaces using direct REST (the other 18ish writers — connect-checkin, connect-feed, connect.html reactions, settings, mind pages, monthly-checkin, wellbeing-checkin, nutrition saveTargets / logWeight): NO outbox path. A network failure or 5xx leaves the optimistic Dexie row in place AND the bus event already published. Next sync.js hydrate would arrive without that row from the server → `replaceForMember` merge-not-wipe (§23.43) would either keep the row (if its PK matches a stale server row) or quietly drop it (if no matching server row exists). Net: the local-only row persists silently until member clears Dexie or settings → debug → reset wipes it.

Member-visible symptom of (a): optimistic UI succeeds, network silently fails, local state diverges from server. Member sees their tap stuck (data appears saved) until they hit a force-refresh.

**(b) Bus event fires before Dexie commit, subscriber reads stale Dexie:**

This is §23.65's exact failure mode. PM-293 fixed it for `habit:logged`. Same risk exists wherever a publisher uses fire-and-forget Dexie writes (§23.39 default) and a subscriber re-reads Dexie. See Flag 15 — mind.html and connect.html are the next surfaces with this risk. Latent today on Connect because the regex blocks the cross-page sync anyway; will manifest the moment P0-1 lands and Connect bus traffic flows.

**(c) Supabase Realtime drops mid-session and never reconnects:**

bus.js Layer 3 (PM-57) implements reconnect-resync: on `'SUBSCRIBED'` callback firing for the 2nd+ time on the same channel, it fires synthetic `origin:'realtime-resync'` envelopes per event-name on that channel. So a single disconnect + reconnect IS handled. But if Realtime never reconnects (offline forever, session timeout), the bridge stays dead and any server-side row changes from another device or server-side cron (certificate-earned, achievement-claim from server-side evaluator) never reach the member's device until full page reload, which re-runs `installTableBridges` from auth.js.

Member-visible symptom of (c): cross-device sync stops working until force-quit + reopen. Edge case at trial scale.

### Brain-vs-reality drift class

Map flagged `tracking.js` (§23.67 / PM-251 retro) and `movement.html` (PM-307) as brain-drift. Audited the broader claim space:

- **§23.67 PM-251 / tracking.js**: Brain explicitly claims tracking.js was retired by PM-251. Live state: loaded on 17 shells, still firing `session:viewed` on every live session. Two-tracker overlap on 8 live shells. CONFIRMED brain-drift.
- **PM-307 movement_activities**: Brain explicitly claims "collapses to one table: movement_activities". Live state: dual-writes to `workouts` + `movement_activities`, dual-publishes `workout:logged` + `movement:logged`. CONFIRMED brain-drift, more severe (member-visible double-counting).
- **PM-374 food-log lockdown**: Brain notes `food:logged`/`food:deleted` bus subscribers in engagement-v2 / achievements-evaluator / home-state-local remain registered but unreachable. Verified — these subscribers exist, the publishers exist in log-food.html but log-food.html is gated behind the coming-soon cover. Latent but documented in the changelog. Not new drift.
- **PM-365 hydration.js naming clash**: Brain explicitly notes `hydration.js` is the PF-13 welcome overlay, NOT water tracking. Verified — `hydration.js` is loaded only on index.html, handles persona welcome copy. Water uses localStorage `WATER_KEY`. Brain accurately describes — not drift.
- **PM-353 focus pillar source tables**: Brain says fuel / nutrition_logs retired from Focus pillar reads. Verified — focus-shell catalogue has no slug pointing at nutrition_logs anymore (fuel slug exists at focus/fuel.html but its `write_target` would have been nutrition_logs; the catalogue I read shows only mind_activities + cardio + connect_checkins targets in the live catalogue rows). Need a closer read in Chat 6 but appears clean.
- **focus-shell TABLE_TO_BUS_EVENT dead entries**: `workouts: 'workouts:logged'`, `daily_habits: 'habits:logged'`, `nutrition_logs: 'nutrition:logged'` — three pluralised event names with zero subscribers. No focus slug currently writes to these three tables, so the entries are inert today. NEW drift — these names don't match the actual event taxonomy and would footgun the next focus catalogue addition. P0-4.

---

## Quantitative corrections to the map

For the map-update commit (alongside this audit):

| Map claim | Reality |
|---|---|
| "Distinct VYVEBus events: 43" | 45+ — missed `live:viewed` (player-tracker.js publishes), `mind:viewed` (player-tracker.js publishes), `workouts:logged` (focus-shell publishes, no subs), `nutrition:logged` (focus-shell publishes, no subs), `habits:logged` (focus-shell publishes, no subs), `live_checkin:logged` (engagement-v2.html subscribes, no publisher in repo). Sum depends on whether you count the dead pluralised focus-shell ones — call it 45 real + 5 dead. |
| "Outbox writes: 1 caller (replay-tracker.js only)" | At least 8 callers: visualisation.html, cardio.html, workouts-session.js, habits.html (3 sites), focus-shell.js, journal.html (2 sites), replay-tracker.js, player-tracker.js. Map's regex must have missed the bulk. |
| "replay:viewed orphan publisher" | NOT orphan — player-tracker.js publishes via cfg.busEvent indirection at L569 on 11 pages. |
| "`<table-event>:failed` literal" | NOT a code bug — comment-only string in vyve-offline.js L721 docblock. |
| "bus.js bridges vyve-localdb-table-pulled" | DOES NOT — engagement-v2.html L1642 subscribe is regex-rejected dead. |
| "tracking.js writes session_views" | Writes BOTH session_views (live shells) AND replay_views (rp shells); `isReplay` switches table at L42. |
| "events-rp.html missing session-rp.js and theme.js" | Also missing session-rp.css. Three missing tags, not two. |

---

## Notes for Chat 6 reading this

- Treat P0-1 as the hinge. Several follow-ups become easier once it lands. Do not batch P0-1 with other P0 fixes — it warrants its own walk-through with achievement-count verification before flipping.
- The map's value isn't degraded by the corrections above. Most of its raw observations were right; the bus-regex bug is the kind of thing only deep verification surfaces. Update the map alongside this audit so Chat 6 reads from accurate ground truth.
- The "fix direction" lines in this audit are *directions*, not specs. Chat 6 still picks the exact code shape, runs talk-first design on anything non-trivial, and applies §23.39 / §23.65 / §23.66 / §23.67 / §23.70 discipline at ship.
- A single commit fixing P0-1 has the highest leverage. A single commit fixing P0-3 (movement dual-write) has the highest member-visible impact. P0-2 (body:logged aggregator) is the biggest discoverability win — gets Connect counters tracking Body activity.

End of audit. This is the verify-and-categorise pass against PM-378's inventory. Chat 6 starts from here.
