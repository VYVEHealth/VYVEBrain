# Coach portal — Calum's review (opened PM-1217, 12 Sep 2026)

Trigger: "calum review" / "calum batch N". Calum Denham (partner `3d552455…`, live coach) is working through the coach portal in chunks against the PM-1212 demo cohort and sending feedback as he goes. This file is the tracker: every item he raises, where it landed, and what's still open. Batches are Claude-session-sized. Kahunas is his reference product — fine internally, never in member copy (§23).

## Batch 1 — shipped PM-1217 (CC `e456db20`), coach-side only

| # | Calum said | Finding | Status |
|---|---|---|---|
| 1 | Assign to… says I have no clients | `w3Clients()` selected non-existent `first_name,last_name` on `coach_clients`; 400 swallowed to `[]`. Live since PM-985. | **Fixed** (§23.338) |
| 2 | Images on Programmes / Day templates are massive | `.w3-exthumb` only sized inside `.de-row`; list rows painted native-size thumbnails | **Fixed** — base rule 56×40 |
| 3 | Quick view (eye) and Preview do the same thing | Both existed on every template row | **Fixed** — eye removed, Preview stays |
| 4 | "My Plans and Forms" heading on pages with no forms | One card title for all 11 kinds | **Fixed** — title per kind |
| 5 | A tab that takes you to the page you're on | `go('kindsel:*')` leaves one chip visible + active | **Fixed** — row hidden when ≤1 chip |
| 6 | Not sure what Group A/B/C does | Superset/circuit grouping with no explanation | **Fixed** — label "Superset" + hint |
| 7 | "Mark's Exercise…" sentence | "▶ marks exercises with a demo video" | **Fixed** — reworded |
| 8 | Can't click the date field, have to find the icon | Native Chrome behaviour | **Fixed** — `showPicker()` on click |
| 9 | Sidebar scrollbar doesn't match the theme | Unstyled | **Fixed** — `scrollbar-color` on tokens |
| 10 | App doesn't fit my laptop, side-scroll, buttons off-screen | Not reproducible blind; his viewport is ≤840px (burger breakpoint) — small laptop at high scaling. PM-1218 fixed the other end (wide monitors: column now centred, was pinned left) | **Open — needs screenshot + `innerWidth`** |

## Batch 2 — builder ergonomics, coach-side only (one session)

| # | Calum said | Plan |
|---|---|---|
| 11 | Visual exercise selector with thumbnails when adding exercises | **Shipped PM-1223** — ☰ Choose from library beside every block, library sheet, multi-add, Done |
| 12 | Weekly workouts show names without images | Editor side **shipped PM-1224** (weekly sessions now use the day builder — thumbnails, picker, toggle); the list/preview view still to do |
| 13 | Treadmill Run locked to sets/reps; want sets/reps · time · distance · calories per row | **Shipped PM-1223/1228** — Reps → Secs → Mins on the row label, seconds on save; distance / kcal = Batch 3 contract |
| 14 | Search/filter on Programmes, Weekly workouts, Day templates | Search box + sort on the three lists (recipes have the pattern from W9b) |
| 15 | Add New appends at the bottom of the page | Open the builder as the view, list hidden, back on save/cancel |
| 16 | Tabs per day vs whole-programme view | Toggle: Full programme / Session tabs on the programme builder and preview |
| 17 | Muscle-group filter returns odd results | **Shipped PM-1223** — taxonomy normalised (36→20 muscle values, 32→18 equipment) + rail with counts |
| 22 | (Dean, 13 Sep) Library should browse like Rehab My Patient — left rail of categories with counts, sub-groups, search, card grid with Add · info · play, favourites, My exercises | **Shipped PM-1223** — rail with counts, search, sort, video chip, ★ favourites, show-more; physio page gets it in part 2 |

## Batch 3 — talk-first (changes the `programme_json` contract the member app renders)

| # | Calum said | Notes |
|---|---|---|
| 18 | Blocks within one workout (warm-up / main / conditioning / cool-down) | New `blocks[]` on a day; `workouts-session.js` must render it. **Mocked PM-1221** (`docs/mockups/programme-builder-mockup.html`) with #13 #15 #19 #20 |
| 19 | Toggle weekday-tied vs Session 1/2/3 | W5 emits `session.day`; add a per-programme `days_mode` and a "complete when ready" render |
| 20 | Programmes should accept Weekly workouts, not only Day templates | Programme phases referencing `workout` templates as well as `workout_day` |
| 21 | Feature/access levels by package (1-to-1 vs cheap group programme) | Build on client tags (W4b) + `assignments.gates`; per-tag can/can't lists on content, messaging, nutrition, education |

## Call items (Calum + Dean, Lewis only where a member-facing string changes)

- "Weekly Workouts" naming — he'd build most bespoke plans there and the name says "one temporary week". Candidate: "Training plans".
- Goals "Target" — reads as a duplicate of the goal for nutrition goals; water makes sense. Decide the semantics, then the copy.
- Duplicate-then-edit vs edit-in-place-auto-fork on stock exercises — he sees both sides; leave as is until the call.

## Log
- 12 Sep 2026 — batch 1 received (Programmes / Weekly workouts / Day templates / Exercise Library / Profile); r1 shipped PM-1217.
- 13 Sep 2026 — PM-1218: Dean's own pass — wide-screen centring + notification reminder timestamps (not Calum items, same surface).
- 13 Sep 2026 — PM-1219: RMP import torn down, 478 stretches kept as stock; library browse redesign added as #22.
- 13 Sep 2026 — PM-1220: library mockup on CC main; Batch 2 build order written in the backlog.
- 13 Sep 2026 — PM-1221: programme builder mockup (Kahunas shape) on CC main; Dean asking Calum whether the picker needs a browse rail or search only.
- 13 Sep 2026 — PM-1222: Dean decided the picker is the library over the builder (multi-add, Done); Batch 2 build unblocked.
- 13 Sep 2026 — PM-1223: Batch 2 part 1 shipped (library v2, picker over the builder, Reps/Secs toggle, taxonomy). Part 2 = #12 #14 #15 + physio.
- 13 Sep 2026 — PM-1224: weekly workouts moved onto the day builder (Dean hit the old editor); Cardio 23 added to stock.
- 13 Sep 2026 — PM-1225: picker re-presented as a right-hand drawer, + Exercise opens it; doubled-library race fixed.
- 13 Sep 2026 — PM-1226→1228: drawer polished on Dean's live pass (blank row gone, video on top, minutes, cardio videos wired from Storage).
