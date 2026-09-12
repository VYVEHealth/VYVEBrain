**PM-1225 (2026-09-13, 04:50): THE PICKER IS A DRAWER, "+ EXERCISE" OPENS IT, AND THE DOUBLED LIBRARY IS FIXED. CC `f18764dc` (coach-portal.html md5 `8690b289`). No migration, no EF.**

**Dean's library screenshot showed "All exercises 2,956" and every card twice.** Root cause: two callers hit `exLoad` concurrently (the wrapped `exInit` and `go()`'s section preload), both passed the `cexLoaded=false` guard, both reset and concatenated their pages. Pre-existing race, made visible by the rail's count. Fix in the `330` wrapper: single-flight (an in-flight promise is returned to every concurrent caller) + dedupe `cexRows` by id after any load. §23.341.

**The picker is what Dean described, presented the way he described it.** Same component (PM-1223's moved `#exv2-wrap`), now a **drawer that slides in from the right** (`min(1180px, 88vw)`, full height, 220ms transform) with the picks strip and Done in its header. The flow he wants is unchanged from PM-1223: search "chest press" → + Add, + Add → search "back extension" → + Add → **Done · add 6** → rows land → sets and reps after. **"+ Exercise" / "+ Warm up exercises" / "+ Cool down exercises" now open the drawer directly** (the original buttons are clone-replaced so their blank-row listener is gone; a quiet "or type a name" link keeps typed entry). This was the missing piece in his experience: his Weekly workouts page was on the PM-955 editor until PM-1224, so he had never seen a picker at all — the "big dropdown" he objected to was the native datalist on the old row.

**Proof.** Harness: concurrent `exInit`+`exLoad`+`exLoad` → one underlying load, 150 rows not 160; `.de-add-main` reads "+ Add exercises" and opens the drawer (`display:flex`, wrap moved in), two picks → Done · add 2 → rows in `.de-main`, wrap home; "or type a name" adds a blank row. `build-portals --check` + smoke green; two files md5-perfect at `f18764dc`. Not device-checked.

**Open.** Dean: hard refresh → Exercise Library reads **1,478** → Weekly workouts › + New → **+ Add exercises** slides the library in from the right → search, add several across searches, Done. Then Programmes: say what you hit.

---

