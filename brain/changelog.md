**PM-1226 (2026-09-13, 05:05): NEW DAY OPENS EMPTY — THE DRAWER BUTTON IS THE PATH. CC `33643954` (coach-portal.html md5 `e1eed166`).**

Dean's Day templates › New screenshot proved PM-1225 was live (the block buttons read "+ Warm up exercises · or type a name", "+ Add exercises · or type a name · + Rest block") — and that he still couldn't see "what you've apparently built", because the base `renderDayEditor` renders one blank `[{}]` row when a day has no exercises: the first thing on screen was the old typed Exercise field with its datalist, and the green button below it read as an afterthought. The `330` wrapper now removes that single empty auto-row on a new day (only when it is the sole row and its name is blank); existing days are untouched. Weekly sessions inherit it (PM-1224 routes them through the same editor). §23.342.

**Open.** Dean: hard refresh → Day templates › + New → no row, "+ Add exercises" → drawer slides in. Programmes still to be pinned.

---

