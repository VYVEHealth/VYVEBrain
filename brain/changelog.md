**PM-1241 (2026-09-13, 08:50): SESSIONS ACROSS, NOT DOWN · CREATE A DAY FROM A PROGRAMME SLOT. CC `67c6c31b` (coach-portal.html md5 `b9c67a33`). New slice `370-sessions-tabs-pm1241.js`.**

Dean, Kahunas side by side: weekly plan sessions stacked into a tall page ("I don't think these should be over the top, they should be across"); and a programme slot with no template that fits should let you build the day there, with the builder over the top.

**Weekly plans — tabs.** `#w-sessions` panels are untouched (340/360 markup); a `.wt-bar` above shows **Session 1 | Session 2 | … | + Add**, one panel visible at a time, tab label mirrors the session name as you type; **+ Add** opens a menu: **Create new session** (clicks the hidden `w-add-session`) and **Import a day template…** (select from `bpDays()`, adds a session, applies the template via the 360 import select once it is populated). Re-syncs on any `#w-sessions` childList mutation (mute flag per §23.344), `addWSession` wrapped to activate the new tab, `plLoad` wrapped to reset to tab 1. Rest days are not offered on weekly plans on purpose — sessions there are unordered and repeat weekly; a rest day is a programme concept (an empty slot).

**Programmes — build a day in place.** Every empty slot's select gets **✎ Create a new day here…** as the second option; choosing it seeds `{ name:'', exercises:[], warmup:[], cooldown:[] }` into the slot and calls `progDayOpen(j)`. When a coach has no day templates at all the slot now shows **+ Create a day** instead of "build a day template first". `progDayOpen` / `progDayDone` are wrapped so `#pg-dayedit` is **moved into a centred sheet over the page** while editing and moved home on Done (or backdrop click) — the §23.340 move-the-DOM pattern again, so the editor's ids, drawer buttons and volume strip all keep working. `renderProg` wrapped (last declaration is 260's).

**Proof.** Harness: two sessions → tabs "Push", "Session 2", only the last visible, add button hidden; click tab 1 → visibility flips; typing a name relabels the tab; Create new → 3 tabs, active 2; `renderProg` → `__new__` option present; choosing it seeds the slot, opens the editor, sheet on, host inside the sheet; Done → sheet off, host back home; templateless slot shows + Create a day. Build/smoke green, md5-perfect. Not device-checked.

**Not done here:** programme days as tabs (Kahunas' Day 1 | Day 2 | Rest day) — the week grid already reads across; changing it to tabs belongs with the Session-N default (Batch 3). "Save this day as a workout template" from the sheet — one checkbox, next pass.

---

