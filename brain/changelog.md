**PM-1240 (2026-09-13, 08:30): REST BLOCK BUTTON REMOVED FROM THE WORKOUT BUILDER — CC `1c449941` (coach-portal.html md5 `cf8f057b`).** Dean: "remove the rest block from this page". The `330` `renderDayEditor` wrapper removes `.de-add-rest`; W6's `w6AddRestRow` and existing rest rows in saved templates are untouched (they still render and save). Rest between sets stays on every row. (Comment in the slice says PM-1237 — the number was taken by the parallel running-plan session; it is this entry.)

---

