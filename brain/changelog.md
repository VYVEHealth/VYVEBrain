**PM-1229 (2026-09-13, 06:05): DAY BUILDER BLOCKS AS PANELS — CC `37377790` (coach-portal.html md5 `cca9b2f4`).**

Dean, side by side with Kahunas' Create a Workout: the three blocks ran together, the buttons were tiny, "rest between rounds doesn't match up". `330`'s `renderDayEditor` wrapper now re-parents each block (heading + rows container + add row) into an `.exv2-blk` panel: bordered card on `--surface-2`, a proper heading ("Warm up · optional", "Workout", "Cool down · optional"), each exercise row as a card, and one full-width dashed **add bar** holding a larger "+ Add exercises" (+ Rest block beside it on Workout). The cool-down button had no wrapper div in the base markup — it gets a bar created for it; the type panel and volume strip stay above. Circuit config: `.w6-cfg .field` gets a two-line label height so Rounds and Rest between rounds align. Harness against the real 260 markup: three panels in order `heading › rows › add bar`, rest block preserved, rows land inside. Build/smoke green, md5-perfect.

---

