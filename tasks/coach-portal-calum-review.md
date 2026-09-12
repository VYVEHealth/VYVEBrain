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
| 10 | App doesn't fit my laptop, side-scroll, buttons off-screen | Not reproducible blind; his viewport is ≤840px (burger breakpoint) — small laptop at high scaling | **Open — needs screenshot + `innerWidth`** |

## Batch 2 — builder ergonomics, coach-side only (one session)

| # | Calum said | Plan |
|---|---|---|
| 11 | Visual exercise selector with thumbnails when adding exercises | Thumbnails in the builder picker (library already has them, PM-1157/1209) |
| 12 | Weekly workouts show names without images | `w3ThumbImg` per row in the workout view |
| 13 | Treadmill Run locked to sets/reps; want sets/reps · time · distance · calories per row | `w3RowSetMode` already carries reps/duration per row with no UI; add a per-row type control (reps / secs / distance / kcal) and carry it into `coach_build_program_json` |
| 14 | Search/filter on Programmes, Weekly workouts, Day templates | Search box + sort on the three lists (recipes have the pattern from W9b) |
| 15 | Add New appends at the bottom of the page | Open the builder as the view, list hidden, back on save/cancel |
| 16 | Tabs per day vs whole-programme view | Toggle: Full programme / Session tabs on the programme builder and preview |
| 17 | Muscle-group filter returns odd results | `muscle_volumes` (PM-985) fuzzy map; tighten to primary muscle + exact category |

## Batch 3 — talk-first (changes the `programme_json` contract the member app renders)

| # | Calum said | Notes |
|---|---|---|
| 18 | Blocks within one workout (warm-up / main / conditioning / cool-down) | New `blocks[]` on a day; `workouts-session.js` must render it; Calum to show the Kahunas version on the call first |
| 19 | Toggle weekday-tied vs Session 1/2/3 | W5 emits `session.day`; add a per-programme `days_mode` and a "complete when ready" render |
| 20 | Programmes should accept Weekly workouts, not only Day templates | Programme phases referencing `workout` templates as well as `workout_day` |
| 21 | Feature/access levels by package (1-to-1 vs cheap group programme) | Build on client tags (W4b) + `assignments.gates`; per-tag can/can't lists on content, messaging, nutrition, education |

## Call items (Calum + Dean, Lewis only where a member-facing string changes)

- "Weekly Workouts" naming — he'd build most bespoke plans there and the name says "one temporary week". Candidate: "Training plans".
- Goals "Target" — reads as a duplicate of the goal for nutrition goals; water makes sense. Decide the semantics, then the copy.
- Duplicate-then-edit vs edit-in-place-auto-fork on stock exercises — he sees both sides; leave as is until the call.

## Log
- 12 Sep 2026 — batch 1 received (Programmes / Weekly workouts / Day templates / Exercise Library / Profile); r1 shipped PM-1217.
