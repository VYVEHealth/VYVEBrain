**PM-1234 (2026-09-13, 07:30): LIST TOOLS ON EVERY LIST PAGE — CC `fdcf37e4` (coach-portal.html md5 `26710ce7`). New slice `350-list-tools-pm1234.js`. No migration, no EF.**

Dean, from Kahunas' Workout Programs and Clients pages: per-page (12 · 24 · 36 · 48 · 100), search top-right, list / grid, and on Clients a filter (archived / active / latest check-in / latest message / name A–Z / check-in day) — "across all the pages in the coaching portal that need it". Calum #14.

**Template lists.** A toolbar above `#pl-list` for every kind: search, sort (Newest first · A–Z · Z–A), ☰ List / ▦ Grid, per-page select, item count, and the **+ New** button moved into the same row; a pager below the list (‹ 1 2 3 › · "13–24 of 40", elided past nine pages). **DOM-level by design:** every renderer paints one direct child per item, so the tools filter (name element or full text), order (stable original index remembered on `data-lt-idx`, so "Newest first" survives an A–Z pass) and page those children, and re-apply after any re-render through a `MutationObserver` on `#pl-list` — no renderer touched (`paintWk`, forms, habits, `w4PaintList`). Foods and Meals are skipped (`LT_SKIP`) — they carry their own search and W9b filter drawer. Grid view = CSS on `#pl-list.lt-grid` (cards, full-width thumbnail). `plLoad` wrapped to re-apply. Search resets on kind change.

**Clients.** `#cl-toolbar` gains per-page (24 default — sets `CL_PAGE`/`clShown`, the existing "Show more" becomes the pager), sort (Newest · Name A–Z · Last active via `memberMap.last_active_at` · Latest check-in — lazy-loads the last 500 `coach_form_responses` and reduces to latest-per-client), and **Mon–Sun chips** on `assignments.checkin_day`. `clFiltered` SHADOWED = 200-tz-w1's body (status · tags · segments · search) + day filter + sort. "Latest message" sort not done — no per-client message timestamp in memory; next pass.

**Gotcha found and fixed before commit (§23.344).** The first cut looped forever: `ltApply` re-orders children with `appendChild`, the observer fires on our own mutations, `mute` had already been reset synchronously. Observer callbacks are microtasks — reset the mute flag in a `setTimeout(0)` so it is still true when they run, and skip the reorder entirely when the order already matches.

**Proof.** Harness over the real `#view-plans` + `#cl-toolbar` markup, 40 fake templates, 30 fake clients: bar built with + New inside, 12 shown, "40 items", pager 6 buttons, page 2 = items 12–23, per-page 100 shows all and hides the pager, search "plan a" → 2, A–Z reorders, grid class toggles, `plKind='food'` hides the controls and shows all; Clients: per-page select sets `CL_PAGE` 24, 7 day chips, Wed filter → 4 rows all Wednesday, A–Z → "A L" first, Latest check-in sort loads responses and puts the freshest first, per-page 48 → `48/48`. Build/smoke green, md5-perfect.

**Open.** Dean: reload → Workouts › Programmes: search · sort · List/Grid · per page · pager; Clients: per page, sort, day chips. Latest-message sort later.

---

