**PM-1236 (2026-09-13, 08:15): BUILDER AS A PAGE · KAHUNAS/TRAINERIZE NAMING · IMPORT A DAY INTO A WEEKLY PLAN. CC `41cc9709` (coach-portal.html md5 `f09bbf84`). New slice `360-builder-page-pm1236.js`.**

Dean answered three of the Calum questions himself, with Kahunas and Trainerize open: **naming** — match them (Kahunas: Workout Programs / Workouts; Trainerize: Programs / Workouts / Exercises); **blocks** — Warm up · Workout · **Cardio finisher** · Cool down (fixed four); **days** — **Session 1, 2, 3 by default**, with a "tie to weekdays" checkbox; **programmes** — "when creating a programme or workout you should be able to import your day templates"; and **"+ New shouldn't go under the existing ones"** (Calum #15).

**Shipped now (coach-side).** (1) **Builder is the page:** a `MutationObserver` on `#pl-editor`'s style (nine call sites toggle it directly) hides the list card + pager while the editor is open, scrolls to top, and puts **← Back** beside the editor title (clicks the existing Cancel). Closes #15. (2) **Names:** Day templates → **Workouts**, Weekly workouts → **Weekly plans**, Programmes stays. Sidebar, kind chips, `KIND_LABEL` ("New workout" / "New weekly plan"), `PL_TITLES`. **Kinds are unchanged** — `workout_day` / `workout` / `program` in every table, payload and function; only labels moved. (3) **Weekly plan sessions: "Import a day template…"** select beside the session name (`coach_templates` kind `workout_day`, cached, refreshed after any `plLoad`) — picks a saved workout, fills the session name if blank, re-renders the session with that day's rows (confirm if the session already has rows). `addWSession` wrapped, not re-shadowed.

**Recorded for Batch 3 (member-app contract):** blocks = fixed four with `finisher[]`; Session-N default + weekday checkbox; distance/kcal targets; programmes importing weekly plans; tiers.

**Proof.** Harness over `#view-plans` + a `#w-sessions` host: sidebar reads "Workouts", chip "Weekly plans", `KIND_LABEL.workout_day = 'workout'`; editor open → list card hidden + Back present; Back → Cancel → list back; new session → import select with the seeded template → change → name filled "Push A", rows rendered. Build/smoke green; three files md5-perfect.

**Open.** Dean: reload → Workouts › + New → list disappears, ← Back; Weekly plans › + New › session › Import a day template. Brain strings (§19/§23 references to "Day templates" / "Weekly workouts") are historical and stay.

---

