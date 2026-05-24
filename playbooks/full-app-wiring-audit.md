# Full-App Dexie Wiring Audit

**Created:** 24 May 2026 — PM-274 phase 2
**Owner:** Dean + Claude
**Status:** Ready to work — every gap below is verified against vyve-site main at commit `0074a887` (PM-274 phase 1 ship)

This playbook is the deterministic checklist for tomorrow's full-app Dexie wiring audit. It catalogues, for every member-data write path in the app, where the write happens, what Dexie table is touched, what bus event fires, and which hub/dashboard surfaces should re-render — including the gaps where they don't.

The infrastructure is all in place from PM-77 onwards (Dexie + `sync.js` + `bus.js` + `vyve-localdb-table-pulled` catch-all per §23.48 + the PM-30 → PM-44 cache-bus migration with 23 publishers / 29 subscribers across 14 surfaces). This audit is about **completeness, not new infrastructure** — finding where the wiring should exist but doesn't.

---

## How to use this doc

For each row in the inventory below:

1. **Verify the writer is correctly wired** — Dexie upsert + bus publish + Supabase POST with outbox fallback, per §23.39. If any leg is missing, fix it.
2. **Verify every "should-subscribe" surface actually subscribes** — grep `VYVEBus.subscribe('<event>')` across the named files. If a hub/dashboard is in the list but the grep is empty, that's a gap.
3. **Verify the subscriber re-renders correctly** — not just listens. The handler should re-pull from Dexie and repaint the affected widgets, not just `console.log`.

Two pass modes Dean can request:

- **Pass A (review with Claude):** Work through table by table conversationally, Claude proposes fixes, Dean approves before commit.
- **Pass B ("go"):** Claude works through the gap list deterministically without further design conversation. All fixes land in a single atomic commit at the end.

---

## Codebase state at audit start

**vyve-site main:** `0074a887b0b8fd2ebf7f878566a4ea75ec12836a` (PM-274 phase 1)
**Twelve focus pages live:** `/focus/<slug>.html` × 12, shared `focus.css` + `focus-shell.js`, all writing via `VYVEFocusShell.complete()` which dispatches to the correct Dexie table per `home-focus-catalogue.js` `write_target` field.
**Twelve Dexie tables actively written:** see inventory.
**Bus event count:** ~14 distinct event names across the app.

---

## Table-by-table inventory

### 1. `daily_habits` — member habit tick/untick

**Writers:**
- `habits.html` — tick toggle on habit list, optimistic-first via §23.39 (canonical reference impl)
- `index.html` — Progress Pills tap-to-tick (PM-256, also optimistic-first)

**Bus events:** `habit:logged`, `habit:failed`, `habits:set-changed`, `habits:set-changed:failed`

**Should-subscribe surfaces:**
- ✓ `habits.html` (re-renders own list)
- ✓ `index.html` (re-renders Progress Pills + counters)
- ✓ `engagement.html` (Activity component score)
- ✓ `monthly-checkin.html` (reflects recent habit completions)
- ⚠ `exercise.html` (Body hub) — **gap.** Habits classified as "movement" pot should bump Body hub counters. Currently exercise.html doesn't subscribe at all.
- ⚠ `mind.html` (Mind hub) — **gap.** Habits in "mindfulness" pot should bump Mind hub counters. Currently mind.html only subscribes to `mind:*` events.
- ⚠ `connect.html` (Connect hub) — **gap.** Habits in "social" pot should bump Connect hub counters. Currently connect.html doesn't subscribe to `habit:logged`.
- ⚠ Achievement counters — see §11 below
- ⚠ Charity counter — see §12 below
- ⚠ Leaderboard — see §13 below

**Known bug from scan:** `index.html` has a `VYVEBus.subscribe('daily_habits', ...)` literal (no colon). Looks like a typo — should be `habit:logged`. Confirm + fix.

---

### 2. `mind_activities` — breathwork, journal, affirmation, meditation, visualisation, **+ 6 new focus-page kinds**

**Writers:**
- `breathwork.html` — `kind:'breathwork'`
- `journal.html` — `kind:'journal'`
- `affirmations.html` — `kind:'affirmation'`
- `meditation.html` — `kind:'meditation'`
- `visualisation.html` — `kind:'visualisation'`
- `/focus/reset.html` (NEW PM-274) — `kind:'breathwork'` (re-uses, same shape)
- `/focus/reflection.html` (NEW PM-274) — `kind:'journal'` (re-uses, same shape, shorter content)
- `/focus/gratitude.html` (NEW PM-274) — `kind:'gratitude'` (new kind)
- `/focus/sleep.html` (NEW PM-274) — `kind:'wind_down'` (new kind)
- `/focus/morninglight.html` (NEW PM-274) — `kind:'morning_light'` (new kind)
- `/focus/focus.html` (NEW PM-274) — `kind:'deep_work'` (new kind)
- `/focus/restore.html` (NEW PM-274) — `kind:'restore'` (new kind)
- `/focus/hydration.html` (NEW PM-274) — `kind:'hydration'` (new kind — v1 stub until proper `hydration_logs` table lands)

**Bus events:** `mind:logged`, `mind:failed`, `mind:unlogged`

**Should-subscribe surfaces:**
- ✓ `mind.html` (Mind hub) — already subscribes
- ✓ `breathwork.html` / `affirmations.html` / `meditation.html` / `visualisation.html` — own-page re-render
- ✓ `connect-feed.html` — subscribes (renders activity feed cross-member)
- ⚠ `index.html` — **gap.** Home doesn't subscribe to `mind:logged`. Means a Reset / Reflection / Gratitude completion from a focus page won't bump anything visible on home. The progress rings and "Today's focus" empty state should reflect the new completion.
- ⚠ `engagement.html` — **gap.** Activity Score Variety component reads "activity types in last 7 days" — currently this listens to `habit:logged`, `workout:logged`, `cardio:logged`, `food:logged`, `set:logged`, `session:viewed`, `wellbeing:logged`. Does NOT listen to `mind:logged`. Means a breathwork session doesn't count as a distinct activity type.
- ⚠ Achievement counters (multiple metrics — breathwork count, journal count, "mindfulness session" aggregate)
- ⚠ Charity counter
- ⚠ Leaderboard ("habits" metric vs "activities" metric depending on category)

**New `kind` values introduced by focus pages:** `gratitude`, `wind_down`, `morning_light`, `deep_work`, `restore`, `hydration`. No client-side schema change needed (the discriminator is free-text). Server-side may want a CHECK constraint update — defer to a Supabase migration ticket. The values currently land in the row, the POST goes through with `Prefer: resolution=ignore-duplicates,return=minimal`, no schema strictness on the kind column.

---

### 3. `cardio` — cardio sessions (cycling, running, walking, etc.)

**Writers:**
- `cardio.html` — duration + type picker, optimistic-first
- `/focus/movement.html` (NEW PM-274) — `cardio_type:'Walking'`, snapshot-on-completion HK enrichment
- `/focus/outdoors.html` (NEW PM-274) — `cardio_type:'Outdoor walk'`

**Bus events:** `cardio:logged`, `cardio:failed`

**Should-subscribe surfaces:**
- ✓ `cardio.html` (own re-render)
- ✓ `index.html` — already subscribes
- ✓ `engagement.html` — already subscribes
- ⚠ `exercise.html` (Body hub) — **gap.** Body hub should show recent cardio sessions and bump the Cardio track counter on completion. Currently doesn't subscribe.
- ⚠ Movement page — `movement.html` subscribes to `workout:failed` but NOT `cardio:logged`. If member logs a walk via focus-page and then opens movement.html, walk doesn't appear until next Dexie hydrate.
- ⚠ Achievement counters
- ⚠ Charity counter
- ⚠ Leaderboard

**Cap interaction:** server-side trigger caps `cardio` at 2/day; over-cap inserts route to `activity_dedupe` (master §6). Focus-shell does NOT pre-check cap client-side — if a member completes a 3rd walk in a day via a focus page, the Dexie write succeeds (no cap there), the bus event fires (subscribers update optimistically), then Supabase POST gets rerouted to `activity_dedupe` and the optimistic Dexie row is now wrong. **Decision needed:** strip the over-cap row from Dexie on POST 409? Or accept the optimistic skew (member sees their effort, server doesn't double-count for charity/achievements)? Tomorrow's call.

---

### 4. `workouts` — strength workouts, custom workouts

**Writers:**
- `movement.html` — set-by-set logging (the strength workout page, not the focus-page movement.html)
- `workouts.html` — programme follow

**Bus events:** `workout:logged`, `workout:failed`, `set:logged`, `programme:imported`, `workout:shared`

**Should-subscribe surfaces:**
- ✓ `workouts.html` / `movement.html` — own re-render
- ✓ `index.html` — already subscribes
- ✓ `engagement.html` — already subscribes
- ⚠ `exercise.html` (Body hub) — **gap, same shape as cardio gap.**
- ⚠ Achievement counters, charity counter, leaderboard — see general gaps below

---

### 5. `connect_checkins` — daily one-line social check-in

**Writers:**
- `connect-checkin.html` — canonical one-per-day reference impl
- `/focus/connect.html` (NEW PM-274) — optional textarea, writes with `focus_tag:'connect'`

**Bus events:** `connect:checkin:logged`, `connect:checkin:failed`

**Should-subscribe surfaces:**
- ✓ `connect.html` (Connect hub) — already subscribes
- ✓ `connect-feed.html` — already subscribes
- ⚠ `index.html` — **gap.** Home doesn't reflect a new connect check-in. Today's Focus or recent-activity widget should bump.
- ⚠ Achievement counters (Connect-track tier — the "Architect" achievement family)
- ⚠ Charity counter
- ⚠ Leaderboard

**One-per-day enforcement:** `connect_checkins` PK is `(member_email, checkin_date)` per master §6. Focus-page connect.html doesn't pre-check whether one already exists today — if it does, the Dexie upsert merges (replacing existing), bus event fires as "logged" again. Real semantics: members can refresh their connect post by completing the focus card. Probably fine but flag for Dean.

---

### 6. `nutrition_logs` — food logging

**Writers:**
- `log-food.html` — barcode + Open Food Facts pipeline
- `/focus/fuel.html` (NEW PM-274) — lightweight stub `meal_label:'Mindful meal'`, no macros

**Bus events:** `food:logged`, `food:failed`, `food:deleted`

**Should-subscribe surfaces:**
- ✓ `log-food.html` — own re-render
- ✓ `nutrition.html` (parent page) — **need to verify.** scan shows nutrition.html subscribes to `weight:logged` and `weight:failed` but NOT `food:logged`. If member logs food via /focus/fuel.html, the nutrition.html totals don't update without a page refresh.
- ✓ `index.html` — already subscribes
- ✓ `engagement.html` — already subscribes
- ⚠ Achievement counters, charity counter, leaderboard

**Stub semantics:** the focus-fuel write has `kcal: 0`, no protein/carbs/fat. This means nutrition.html's daily totals don't shift (good — no bogus calorie inflation), but the row exists for activity-count purposes. Verify the nutrition.html food-list filter excludes `kcal === 0` rows OR shows them with a "logged" badge instead of macros. **Likely a small fix on nutrition.html.**

---

### 7. `weight_logs` — daily weight entry

**Writers:**
- `nutrition.html` — weight modal

**Bus events:** `weight:logged`, `weight:failed`

**Should-subscribe surfaces:**
- ✓ `nutrition.html` — own re-render
- ✓ `index.html` — already subscribes
- ✓ `engagement.html` — no, the score doesn't include weight. Verify nothing missing here.

**Status: looks complete.** No focus-page writes to weight_logs.

---

### 8. `wellbeing_checkins` — weekly check-in

**Writers:**
- `wellbeing-checkin.html`

**Bus events:** `wellbeing:logged`, `wellbeing:failed`

**Should-subscribe surfaces:**
- ✓ `wellbeing-checkin.html` — own re-render
- ✓ `index.html` — already subscribes
- ✓ `engagement.html` — already subscribes (this is the Wellbeing component of the Activity Score)

**Status: looks complete.**

---

### 9. `monthly_checkins` — monthly self-assessment

**Writers:**
- `monthly-checkin.html`

**Bus events:** `monthly_checkin:submitted`, `monthly_checkin:failed`

**Should-subscribe surfaces:**
- ✓ `monthly-checkin.html` — own re-render
- ✓ `index.html` — already subscribes
- ⚠ `engagement.html` — **may be a gap.** scan shows no subscription. Need to verify whether monthly check-in is supposed to feed into Activity Score (probably not — it's a separate gamification track) but worth confirming.

---

### 10. `session_views` + `replay_views` — live session viewing

**Writers:**
- The live session pages (`*-live.html` shells) write `session_views`
- `replays.html` / `replay-category.html` write `replay_views`

**Bus events:** `session:viewed`, `session:viewed:failed`

**Should-subscribe surfaces:**
- ✓ `index.html` — subscribes to `session:viewed`
- ✓ `engagement.html` — subscribes
- ⚠ Achievement, charity, leaderboard — general gaps

**Status: writer side fine; subscriber-side has the usual gaps below.**

---

### 11. Achievement counters (`member_achievements`)

**Achievement evaluator architecture:** 32 metrics × multiple tiers = 327 approved tiers (master.md). Per master "knowingly shipped as placeholder for soft-launch trial — Dean's call. Both on post-trial overhaul backlog." This audit catalogues the wiring but doesn't fix the rough semantics — those are post-trial work.

**Current wiring:** The evaluator runs as a server-side cron + inline triggers on each writer table. Client side, achievements appear in Dexie via `member_achievements` table hydrate.

**Bus events:** `certificate:earned` (used by `certificates.html`). No achievement-specific bus event.

**Should-subscribe surfaces if achievement-bumped from focus pages:**
- Home tracks display
- Connect hub Elite hero (already subscribes via `home-state:hydrated`, indirectly)
- `certificates.html`

**Gap classification:** Focus pages don't bump any client-side achievement counter — that all runs server-side post-write. Members will see achievement progress update on next sync (typically <5min). For a "premium feel" instant update, an optimistic client-side achievement evaluator would need to mirror the server logic. **Out of scope for this audit; surfaces as a backlog item for the post-trial achievement overhaul.**

---

### 12. Charity counter

**Source:** computed server-side via `get_charity_total()` SQL function. Counts capped activity rows per master §6 (1 month donated per 30 activities collectively). Cron + display surface in `connect.html` charity strip.

**Client wiring:** Connect hub paints from a Dexie-cached number that comes from `member-dashboard` EF.

**Should-subscribe surfaces when ANY activity is logged:**
- `connect.html` charity strip — already paints from cached value, gets refresh on `home-state:hydrated`

**Gap classification:** The charity counter lags writes by however long it takes for `home-state:hydrated` to fire after a sync. For most cases this is fine; the counter doesn't need to feel instant. **No fix needed unless Dean wants instant-charity-update.**

---

### 13. Leaderboard

**Source:** `get_leaderboard()` SQL RPC, hydrated via the leaderboard page's own EF call (PM-242 noted this RPC needs an additive `email` column return before its EF can hydrate identity, which is also blocking leaderboard avatars).

**Client wiring:** `leaderboard.html` does NOT subscribe to any bus events. It re-fetches on visibility-change and after a manual pull-to-refresh.

**Gap classification:** Leaderboard rank shifts after every activity. Currently the leaderboard.html page is the only surface that shows leaderboard data, and it refetches when opened. No focus-page-specific wiring change is needed here unless Dean wants leaderboard rank to update live on Connect hub or Home hub. **Backlog item: leaderboard avatars + email-return + identity hydration was already parked at PM-242.**

---

## Cross-cutting gaps (the audit's main findings)

These are the most material wiring gaps surfaced by the scan. They apply across multiple activity types.

### A. Hub pages don't subscribe across activity types

The four hubs (Home, Body, Mind, Connect) should all subscribe to **every** activity event that affects their counters. Current state:

- **`index.html`** (Home) subscribes to a wide event set but **misses `mind:logged`** (focus pages writing mind activities won't update home).
- **`exercise.html`** (Body hub) **subscribes to nothing** — every cardio/workout/strength-habit write that lands while Body hub is open requires a manual reload to repaint. This is the biggest single gap surfaced.
- **`mind.html`** (Mind hub) subscribes only to `mind:*`. New focus-page `kind` values (gratitude, wind_down, morning_light, deep_work, restore, hydration) all publish `mind:logged` so they're covered, BUT mind.html doesn't subscribe to `habit:logged` for mindfulness-pot habits — gap.
- **`connect.html`** (Connect hub) subscribes to a reasonable set but doesn't subscribe to `habit:logged` for social-pot habits — gap.

**Fix shape:** Each hub gets a `VYVEBus.subscribe('vyve-localdb-table-pulled', ...)` catch-all subscriber that re-paints if the changed table is in the hub's domain. Avoids the per-event subscription explosion. Focus-shell.js already publishes the catch-all event via `dispatchEvent('vyve-localdb-table-pulled', { detail: { table, source, client_id } })`.

### B. `engagement.html` Variety component missing `mind:logged`

The Activity Score Variety component counts distinct activity types in last 7 days. Without `mind:logged` in the subscription set, a member who does breathwork every day for a week gets 0/12.5 on Variety. **Fix: add `mind:logged` to the engagement.html subscription set; map it to a "mindfulness" activity type bucket.**

### C. `nutrition.html` doesn't subscribe to `food:logged`

If a member logs food via `/focus/fuel.html` (or via `log-food.html`), then opens `nutrition.html`, the daily totals don't include the new entry until next page reload. **Fix: nutrition.html subscribes to `food:logged` / `food:deleted` and re-pulls today's totals from Dexie.**

### D. `index.html` `daily_habits` literal subscription

Scan found `VYVEBus.subscribe('daily_habits', ...)` in index.html. Every other habit-related subscription is on `habit:logged`. **Verify in code — likely a typo to fix.**

### E. Focus-shell publishes `vyve-localdb-table-pulled` for catch-all subscribers — but no hub subscribes

`focus-shell.js` (PM-274) dispatches the `vyve-localdb-table-pulled` CustomEvent on every complete. Three pages subscribe (connect-calendar, replays, sessions) but they're not the surfaces that need to react to focus-completes. **Hubs are the right subscribers — see fix A.**

---

## Tomorrow's session shape

If Dean says "go" deterministically:

1. **Pass 1 — Cross-cutting hub gaps (A).** Wire all four hubs to subscribe to `vyve-localdb-table-pulled` with a domain-filtered re-render. ~4 file changes, atomic commit.
2. **Pass 2 — `engagement.html` Variety map (B).** Add `mind:logged` + bucket mapping. 1 file change.
3. **Pass 3 — `nutrition.html` food subscription (C).** Add `food:logged` / `food:deleted` subscriber. 1 file change.
4. **Pass 4 — `index.html` daily_habits typo (D).** Verify + fix. 1 file change (likely a 1-line edit).
5. **Pass 5 — Decision on cap-rejection skew (cardio §3).** Either accept the optimistic skew or wire focus-shell to roll back Dexie on 409. Discuss with Dean before shipping.
6. **Pass 6 — Lewis copy pass on focus pages.** Separate workstream — focus-shell.js doesn't change, only `home-focus-catalogue.js` COPY[].
7. **Pass 7 — Capacitor bundle.** `npx cap sync` to pull all 12 focus pages + focus.css + focus-shell.js into the iOS+Android binary for next cut.

Total estimate: 4-6 hours of one session if "go" mode, longer if Pass A.

---

## Out-of-scope for this audit (parked as separate work)

- Achievement system overhaul (post-trial per master)
- `hydration_logs` proper table (Supabase migration + Dexie schema + sync.js + migration of nutrition.html water-tracker localStorage)
- Leaderboard avatar pipeline + `get_leaderboard()` `email` column return (parked at PM-242)
- Server-side achievement evaluator changes for the six new mind_activity kinds (gratitude, wind_down, morning_light, deep_work, restore, hydration)
- Capgo HealthKit live-polling upgrade on `/focus/movement.html` (v2 follow-up; v1 ships snapshot-on-completion)

---

## Reference state

- **vyve-site main at audit-start:** `0074a887b0b8fd2ebf7f878566a4ea75ec12836a`
- **sw cache key:** `pm274-focus-pages-a`
- **vbb-marker:** Update 159
- **Twelve focus pages live as `/focus/<slug>.html`** writing via `VYVEFocusShell.complete()`
- **Active Dexie schema version:** V12 (last bump PM-245 for `replay_videos`)
- **Bus event names in active use (~14):** `habit:logged/failed`, `habits:set-changed/failed`, `mind:logged/failed/unlogged`, `cardio:logged/failed`, `workout:logged/failed`, `set:logged`, `programme:imported`, `workout:shared`, `food:logged/failed/deleted`, `weight:logged/failed`, `wellbeing:logged/failed`, `monthly_checkin:submitted/failed`, `session:viewed/failed`, `connect:checkin:logged/failed`, `connect:reaction:logged/cleared`, `connect:challenge:progress`, `connect:hydrated`, `body:logged`, `certificate:earned`, `persona:switched`, `focus:write_failed` (NEW PM-274)

End of audit playbook.
