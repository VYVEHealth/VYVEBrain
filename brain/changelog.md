**PM-1235 (2026-09-13, 07:45): ROWS ARE ROWS AGAIN — CC `d7a2027c` (coach-portal.html md5 `df7fa420`).**

Dean's Day templates screenshot after PM-1234: thumbnail on its own line, name under it, the "unassigned" chip stretched full width, buttons below — every row twice the height. Not the grid view: the pager showed an item with `el.style.display = ''`, which **strips the row's inline `display:flex`** and lets it fall back to block. The rows carry their layout inline (every renderer writes `style="display:flex;…"`), so a DOM-level pager must remember and restore that value (`data-lt-disp`) rather than blanking it. §23.345. Grid view re-cut on Dean's note — thumbnail to the side, name and actions beside it, one compact card (flex-wrap card, 64×48 thumb, tighter buttons). Harness: shown rows read `display:flex`, hidden `none`, page 2 the same.

---

