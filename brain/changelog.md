**PM-1222 (2026-09-13, 02:50): DECISION — the exercise picker IS the library, opened over the builder. No code, no repo change.**

Dean, on the two mockups: when a coach clicks Add an exercise, the full exercise library (PM-1220's rail + search + card grid, its "Picking into a session" mode) opens **over the top of the builder** as a sheet; the coach searches or browses, adds as many as they like, and **Done** drops them into the block that opened it. Not the narrow Kahunas-style drawer — PM-1221's drawer was the hedge for "search only" and is retired; the library page and the picker are one component in two contexts, which is what §23.333's shared-slice split wants anyway. Closes PM-1220 question (d) and Calum #11.

**Remaining pre-build decisions** (rail grouping, Recently used, Duplicate vs edit-in-place, programme = days-directly vs phases) are unchanged; the first three are cosmetic and can be settled in build, the fourth is Batch 3.

---

