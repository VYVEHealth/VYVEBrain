**PM-1233 (2026-09-13, 07:00): THE PM-1231 LIBRARY COPIED TO CALUM'S PARTNER (`3d552455`). Migration `pm1233_calum_library_seed`. No repo change.**

Day templates copy Dean's payloads by name (15); weekly workouts (5) and programmes (4) are **rebuilt** on Calum's partner with `vyve_sess()` / `vyve_day_snap()` so every programme-day `src_id` points at Calum's own day templates, never Dean's (§23.275 — a foreign template id is silently skipped by the apply pipeline). Nutrition (3), habits (2), supplement stack (1), forms (3) straight copies. Idempotent on partner + kind + name. Calum after: workout_day 16 · workout 7 · program 6 · nutrition 4 · habits 3 · supplements 2 · forms 5 (his PM-1212 clones plus these). Not device-checked.

---

