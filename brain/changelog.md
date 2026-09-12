**PM-1227 (2026-09-13, 05:20): THE DRAWER RENDERS FULL-SIZE — A CLASS-NAME COLLISION FROM PM-1080. CC `b481bafe` (coach-portal.html md5 `af31f5e1`).**

Dean: "the drawer doesn't load properly" — screenshot: the library squashed into a ~400px column pinned top-left, no backdrop. Cause: `220-tz-w3-pm1080.js` (messaging, 8 Sep) styles its *inner* dialog as `.w3-modal{…width:100%;max-width:460px;overflow:auto;background…}` — the same class `132-shared-library.js` uses for its full-screen overlay (`position:fixed;inset:0;…`). 220 loads after 132, so every 132-style overlay has been a 460px box for five days: Assign to…, the video preview sheet, quick view (retired PM-1217), and now the PM-1225 drawer. Nobody reported it because the assign modal was already broken by the PM-985 column bug (§23.338) and the preview sheet only looks odd, not wrong. Fix: 220's dialog renamed `.w3-mdlg` (CSS + the one markup site; `.w3-modal-bg` untouched); the drawer (`.exv2-modal`) now states its own overlay rules (fixed, inset 0, z-index 975, backdrop, `.in` background/border/flex) so no later collision can squash it again. §23.343.

**Open.** Dean: hard refresh → + Add exercises → drawer slides in from the right, most of the screen, backdrop behind. Programmes still to be pinned.

---

