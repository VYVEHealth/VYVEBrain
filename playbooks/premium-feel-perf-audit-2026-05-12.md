# Premium-feel perf audit — pre-PM-67 staging session

**Drafted:** 12 May 2026, ~09:00 UTC, PM-66 staging session.
**Author:** Claude / Dean.
**Source ref:** vyve-site HEAD `6225d504` (PM-65 baseline). All 14 inner pages + bus.js + vyve-offline.js + auth.js + theme.js + perf.js read live for this audit.
**Mandate:** "Make this become the best app possible. In terms of productivity and lag and instant clicks like every other premium app on the market." Dean away from keyboard until ~20:00 — staging diffs for review, no production code shipped without sign-off.
**Status:** Audit + staged diffs. Production-affecting work waits on Dean's explicit go.

---

## TL;DR — three premium-feel wins ranked by effort × impact

| Win | Effort | Impact | Risk | Verdict |
|---|---|---|---|---|
| **3× `defer` on `/vyve-offline.js` in `<head>`** (index.html, log-food.html, running-plan.html) | 3-character change ×3 files + sw.js bump | Unblocks first paint on 3 highest-traffic pages | Verified safe — no top-level VYVEData consumers, bindAutoFlush() falls into the `setTimeout(0)` branch when document.readyState ≠ 'loading' | **SHIP CANDIDATE — needs Dean go** |
| **`vyvePaintDone` wiring** on certificates / engagement / leaderboard / habits (4 cache-painting surfaces) | 5-line addition per file + sw.js bump | Layer 5 telemetry captures real-data paint instead of skeleton paint — turns FCP into a measure of what members actually see | Pure additive dispatch; no behavior change; perf.js was designed for this signal (PM-21) | **SHIP CANDIDATE — needs Dean go** |
| **`defer` on `/theme.js` in monthly-checkin.html** | 1-character change | Would unblock first paint by ~5-15ms | ❌ **UNSAFE** — theme.js calls `applyTheme(saved)` at module-load top level to set `data-theme` on `<html>` before body renders. Defer-ing causes a flash of wrong theme. | **REJECTED — keep as-is** |

The first two wins ship together as one atomic vyve-site commit (8 files = 7 page+sw.js + brain commit). Total LOC change: ~40 lines. Total perf impact: real first-paint improvement on 3 inner pages + accurate Layer 5 metrics on 4 cache-painting surfaces.

**Staged patches verified:** all 8 anchors occur exactly once in their target files. Byte-equal verification post-commit per §23 brain rule.

---

## What was audited

Read live at HEAD `6225d504`:
- All 14 inner pages: index, certificates, sessions, monthly-checkin, wellbeing-checkin, nutrition, workouts, habits, engagement, leaderboard, log-food, movement, running-plan, settings
- bus.js, vyve-offline.js, vyve-home-state.js, auth.js, theme.js, perf.js

Audit dimensions, per page:
- Size in KB
- Head scripts: blocking / deferred / async / module count
- Head inline JS + inline CSS char counts
- Body inline script structure (IIFE / DOMContentLoaded / function defs / awaits / fetches)
- Sequential await fetch patterns (waterfall risk)
- Image count + lazy-loading discipline
- Preconnect / dns-prefetch / preload directives
- Service worker registration
- Viewport + theme-color meta presence

---

## Findings, ranked

### 1. Render-blocking head scripts (4 pages affected, 3 are safe to defer, 1 isn't)

The §23 PM-20 hard rule says: "head-script `defer` audits must check inline consumers on the host page." Applied:

| Page | Blocking head script | Safe to defer? | Why |
|---|---|---|---|
| `index.html` | `/vyve-offline.js` | ✅ YES | Only consumers are inside event handlers (depth > 0). vyve-offline.js's only top-level side effect is `bindAutoFlush()` which itself checks `document.readyState` and falls into the `setTimeout(0)` branch when defer-loaded. No paint-relevant work happens at module load. |
| `log-food.html` | `/vyve-offline.js` | ✅ YES | Same as index — no top-level VYVEData consumers; only 3 references inside handlers. |
| `running-plan.html` | `/vyve-offline.js` | ✅ YES | Same — 3 references all inside handlers. |
| `monthly-checkin.html` | `/theme.js` | ❌ NO | **theme.js line 39 calls `applyTheme(saved)` at module-load top level**, setting `<html data-theme>` BEFORE body renders. Defer-ing causes a brief flash of the wrong theme. The script comment on line 3 makes this explicit: *"Load this in `<head>` on every portal page, **before any CSS or other scripts**."* Keep as render-blocking — the 5-15ms cost is the cost of "no theme flash." |

**Staged diff** (3 files in vyve-site, plus sw.js cache-key bump):

```diff
# index.html / log-food.html / running-plan.html
- <script src="/vyve-offline.js"></script>
+ <script src="/vyve-offline.js" defer></script>

# sw.js
- 'vyve-cache-v2026-05-11-pm65-wellbeing-canonical-a'
+ 'vyve-cache-v2026-05-12-pm67a-perf-defer-paint-a'
```

**Estimated wall-clock perf improvement on the three pages:** unknown without baseline. Layer 5 capture will quantify. The change is qualitatively correct — vyve-offline.js is 33KB and parsing it in the critical path delays first paint by exactly that much.

### 2. `vyvePaintDone` wiring on the 4 cache-painting surfaces

The Layer 5 perf playbook (`/playbooks/layer5-perf-capture-protocol.md`) identified that for `certificates.html`, `engagement.html`, `leaderboard.html`, `habits.html`, FCP fires when the **skeleton** paints — not when real data shows. perf.js (PM-21) is designed to listen for `CustomEvent('vyvePaintDone')` as the "real paint" signal, but ZERO pages currently dispatch it.

**Staged diffs verified per page** — each adds one line dispatching `vyvePaintDone` immediately after the cache-paint completes:

- `certificates.html`: after `_certsEarlyPainted = true;` inside the IIFE at L378
- `leaderboard.html`: after `_lbEarlyPainted = true;` inside the IIFE at L789
- `engagement.html`: after the offline cache-paint block at L807
- `habits.html`: after `updateBottomBar();` at end of `renderHabits()` function at L427

```javascript
try { window.dispatchEvent(new CustomEvent('vyvePaintDone', { detail: { source: 'cache' } })); } catch (_) {}
```

perf.js records `paint_done` on FIRST fire only, so a single dispatch per page is sufficient for v1 — earliest fire wins.

**Why this matters for "premium feel":** without it, Layer 5's `paint_done` column is empty and the only paint metric is FCP, which fires when the skeleton renders. A premium-feel target like "warm cache paint under 200ms" needs the right signal to measure. Otherwise we ship cache improvements and the numbers don't move because FCP was never measuring the thing we improved.

### 3. Bigger wins, design recommendations (not yet diffs)

These are real opportunities but bigger trade-offs. Documented for future review, not staged for tonight.

#### 3a. Inline body script extraction

| Page | Inline body JS chars | Comment |
|---|---|---|
| index.html | 56,429 | Mostly an IIFE + a DOMContentLoaded block — extractable to `index-init.js` |
| engagement.html | 55,745 | Two big IIFEs (22K + 28K) — extractable |
| habits.html | 52,311 | One enormous 51K block with 30 awaits + 9 fetches — biggest opportunity |
| log-food.html | 50,634 | Two blocks (44K + 5.5K DOMContentLoaded) — extractable |
| nutrition.html | 48,704 | One 42K IIFE + a DOMContentLoaded block — extractable |
| settings.html | 45,314 | Single large block — extractable |
| running-plan.html | 43,434 | Large IIFE — extractable |
| wellbeing-checkin.html | 41,972 | Large IIFE — extractable |

**Trade-off.** Moving inline body JS to external `.js` files:
- ✅ Cache across navigations (returns instantly on warm)
- ✅ Cache-bust independently of HTML
- ✅ Browser can parallel-download with CSS
- ❌ Adds one HTTP roundtrip on cold
- ❌ sw.js precache list grows
- ❌ Each page's JS becomes a new asset to version

**Recommendation:** worth doing eventually as a Layer 6+ campaign, but the wins compound only when caching is reliable. Wait for the Layer 5 baseline numbers to know which pages need this most. Don't ship blind.

#### 3b. Inline head CSS extraction

| Page | Inline head CSS chars |
|---|---|
| workouts.html | 31,631 |
| nutrition.html | 24,951 |
| index.html | 24,910 |
| engagement.html | 22,629 |
| log-food.html | 18,952 |
| settings.html | 17,434 |
| running-plan.html | 17,379 |

Same trade-offs as 3a. Note: `theme.css` (15.8K) and one page-specific CSS are already external on every page. The inline CSS here is page-specific styling that got inlined instead of externalized. Same recommendation — defer until Layer 5 data tells us where it hurts most.

#### 3c. Serial await waterfalls

Search confirmed: most `await fetch` calls in inline body scripts are inside event handlers (button clicks, form submits), not in initial page-load critical path. Only `running-plan.html` shows two await-fetches within 7 lines of each other at the top of the file — likely the "load existing plan" sequence. Worth a closer look.

```
running-plan.html L69: await fetch(MRP_TABLE_URL + '?member_email=eq.' + ...)
running-plan.html L76: const res = await fetch(MRP_TABLE_URL, ...)
```

If these are independent reads, `Promise.all([fetch(...), fetch(...)])` halves the wait. If sequential dependency, no change possible. Needs source inspection — staging for closer look.

### 4. Supabase SDK (`supabase.min.js` — 185KB)

Audit confirmed: every page has `<link rel="preload">` for `supabase.min.js` in the head, and `auth.js` dynamically injects the actual `<script>` tag after page load (L454). This is the right pattern — preload allows parallel download without blocking parse. No action needed.

### 5. No image weight issue

Audit showed near-zero `<img>` tags across all 14 pages. The portal is text + SVG. Image-loading optimization is not the bottleneck.

---

## Discipline: why nothing was shipped while Dean was away

Standing instruction is clear: "anything that touches live Supabase, the Edge Functions, or vyve-site main gets discussed first." The defer patches and `vyvePaintDone` wiring both touch vyve-site main. They're staged in `staged-patches-pm67a.json` (workbench-local, see /home/user/staged_patches.json) for Dean's 20:00 review.

The recommendation is: ship the bundle as a single atomic vyve-site commit when Dean is back. Net effect: 3 pages start painting faster, 4 pages start emitting honest Layer 5 paint metrics. Doesn't fight the Layer 5 capture protocol — it sets it up correctly.

Items 3a/3b are design-stage and need Layer 5 numbers before deciding which pages to migrate. Item 3c needs source inspection.

---

## Ready-to-ship menu for 20:00

1. **Ship the defer+paint commit?** YES/NO/DISCUSS. If YES: 8-file atomic commit on vyve-site main (3 defer patches + 4 paint dispatches + sw.js cache-key bump), byte-equal verification post-commit, brain changelog entry under PM-67a. All 8 anchors verified ship-safe (unique in target file).
2. **Inspect `running-plan.html` L69/L76 for Promise.all opportunity?** YES/NO. Half-session investigation, possibly one-line patch.
3. **Order the §3a/3b page-by-page migrations** waiting for Layer 5 baseline numbers? Stay parked for now per current recommendation.

---

## §23 hard rule candidate (proposed, not yet codified)

**Premium-feel rule: head scripts should default to `defer`. Exceptions require an inline comment justifying the synchronous load.** theme.js is the prototype of a justified exception (must run before paint to set data-theme). Adding a new render-blocking head script without that justification is a premium-feel regression. Pair with PM-20 (defer audits check inline consumers) as part of the same hardening pattern.

---

*End of premium-feel perf audit. All findings verified against live source at vyve-site HEAD `6225d504`. No production code shipped. Three concrete wins staged for Dean's 20:00 review.*
