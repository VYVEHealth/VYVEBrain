# 20:00 ship runbook — PM-67a perf bundle

**For Dean, 12 May 2026 ~20:00 BST.**
**Pre-condition:** PM-66 ship committed to vyve-site main from local Mac (separate workstream).
**Workstream:** 8-file atomic commit on vyve-site main, byte-equal verify, brain changelog.
**Total estimated time, Claude-assisted:** 8 minutes.

---

## What this ships

Three premium-feel wins as one atomic vyve-site commit:

| File | Change | LOC |
|---|---|---|
| `index.html` | `<script src="/vyve-offline.js" defer>` (add `defer`) | +6 chars |
| `log-food.html` | same | +6 chars |
| `running-plan.html` | same | +6 chars |
| `certificates.html` | dispatch `vyvePaintDone` after `_certsEarlyPainted = true;` | +116 chars |
| `leaderboard.html` | dispatch `vyvePaintDone` after `_lbEarlyPainted = true;` | +116 chars |
| `engagement.html` | dispatch `vyvePaintDone` after offline cache-paint block | +118 chars |
| `habits.html` | dispatch `vyvePaintDone` after `updateBottomBar();` in `renderHabits()` | +112 chars |
| `sw.js` | cache key bump `pm65-wellbeing-canonical-a` → `pm67a-perf-defer-paint-a` | -2 chars |

**All 8 anchors verified ship-safe** at HEAD `6225d504` (each appears exactly once in target file).

---

## Sequencing

1. **Confirm PM-66 has shipped** — `git pull` on Mac, check vyve-site main HEAD. If PM-66 hasn't shipped yet, ship it FIRST, then refetch staged anchors against the new HEAD (PM-66 doesn't touch any of these 8 files, but verify).

2. **Tell Claude "ship PM-67a"** — Claude will:
   - Re-fetch all 8 target files at current main HEAD
   - Re-verify each anchor occurs exactly once (catches concurrent edits)
   - Apply str_replace to all 8
   - Atomic `GITHUB_COMMIT_MULTIPLE_FILES` to vyve-site main with message:
     > "PM-67a: defer /vyve-offline.js on 3 pages + vyvePaintDone wiring on 4 cache-painting surfaces (premium-feel perf bundle)"
   - Post-commit byte-equal verification (live ref, not raw CDN) per §23 brain rule
   - Brain commit: PM-67a changelog entry + new §23 hard rule proposal (head scripts default to defer)

3. **Open monthly-checkin.html in Safari ⌘+⇧+R** — verify theme is still applied immediately (since we did NOT defer theme.js). If theme flashes, escalate.

4. **Flip the Layer 5 perf flag** — `online.vyvehealth.co.uk?perf=1` once in Safari. Confirms perf flag is on. Then close + reopen the iOS app once to ensure sw.js cache rotated. Now warm-cache paint metric measures real-data paint (vyvePaintDone), not skeleton (FCP).

---

## What this does NOT do (intentionally)

- Does NOT defer `theme.js` on monthly-checkin.html. theme.js MUST run before paint to set `data-theme`. Deferring it = flash of wrong theme. Verified by source inspection (theme.js L39 `applyTheme(saved)` at module-load).
- Does NOT dispatch `vyvePaintDone` from inside the `render()` / `renderMetric()` / `renderHabits()` function bodies (only from cache-paint call sites). Means cold-load fresh-paint isn't captured as `paint_done` — falls back to FCP. **Option B** for a future patch: also dispatch from inside each render function so both cold and warm capture. perf.js first-fire-wins handles dedupe. Worth doing once Layer 5 numbers come in and we see how big the cold/warm gap is.
- Does NOT extract inline body JS to external files. Real win, but bigger trade-off. Wait for Layer 5 baseline.
- Does NOT extract inline head CSS to external files. Same.
- Does NOT touch any Edge Function, RPC, or migration. Pure portal-side static change.

---

## Failure modes

| Scenario | Likely cause | Recovery |
|---|---|---|
| Anchor not found in str_replace | Concurrent edit on main after staging | Claude reports failed file. Re-fetch, re-verify, re-stage just that file. |
| Post-commit byte-equal verification fails | GitHub CDN replication lag (normal first 30s) | Wait 60s, re-verify. If still fails, rollback. |
| sw.js cache key already used | PM-66 reused the same key | Bump letter: `pm67a-perf-defer-paint-b`. Cosmetic. |
| Theme flash on monthly-checkin.html | Should not happen — theme.js wasn't touched | Open dev tools, screenshot, send to Claude. We rolled nothing relevant. |
| iOS app stays on old cache after reload | sw.js cache rotation needs full app restart | Force-quit + reopen iOS app, or wait 30s for second navigation. |

---

## After the ship

**Lock the §23 PM-67a hard rule into master.md:**

> **Hard rule (PM-67a): head scripts in vyve-site default to `defer`. Render-blocking head scripts require an inline-comment justification explaining why synchronous load is necessary.** theme.js is the prototype of a justified exception (must run pre-paint to set `data-theme` for "no theme flash" — see L1-8). Any future head script added without `defer` AND without an inline-comment justification is a premium-feel regression and the commit gets reverted.

This rule pairs with the existing §23 PM-20 hard rule (defer audits must check inline consumers) — together they make every head-script addition cost the contributor a clear answer to "why synchronous?" before merge.

---

## Reference

- `/playbooks/premium-feel-perf-audit-2026-05-12.md` — full audit + ranked findings
- `/playbooks/layer5-perf-capture-protocol.md` — Layer 5 capture operator sheet
- `/playbooks/pm67-self-test-harness.md` — PM-67 design (separate workstream)
- `/home/user/staged_patches.json` (Composio workbench) — 8-patch bundle, verified

*Drafted 12 May 2026 ~09:30 UTC. Ships on Dean's go.*
