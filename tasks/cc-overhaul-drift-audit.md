# Command Centre — Component / Spacing / Typography Drift Audit
**PM-988 pre-work · 4 Sep 2026 · pinned at `80412591`**
Method: automated census over every `<style>` block + shell/components/tokens CSS. Numbers below are counted, not estimated.

---

## Headline numbers

| Metric | Value | Premium-tool norm |
|---|---|---|
| Distinct font-size px literals repo-wide | **33** (9px→44px, incl. 12.8px, 14.5px, 15.5px, 16.5px) | 8–10 |
| Distinct border-radius values | **20** (2,3,4,6,7,8,9,10,11,12,13,14,16,18,20,28,30,34,99,999) | 5–6 |
| Distinct media-query breakpoints | **20** (440,480,560,600,640,680,700,720,760,768,800,820,840,860,880,900,901,960,1020,1100) | 3–4 |
| Token adoption (var() refs vs raw px/hex in tokenisable properties) | **47% overall** | ~95% |
| Files defining their own `.card` | **17** | 1 |
| Files defining their own `.btn` | **12** | 1 |
| Files defining their own `.pill` | **13** | 1 |
| Files with a local `:root`/theme var block | **12** | 1 (tokens.css) |

tokens.css v2 itself is good — 114 well-named vars, full dual theme, real elevation scale. The drift is that **half the repo doesn't use it, and a quarter of the repo actively fights it.**

## Finding 1 — The Insights family shadow design system (8 pages)

`app-health, usage, retention, activity-depth, wellbeing, platform, revenue, ai-usage` each carry a **complete duplicated dual-theme token block** (20–23 vars) redefining canonical names — `--bg, --surface, --text, --gold, --danger, --warning, --settled…` — with values that have **quietly diverged** from tokens.css:

- dark `--danger`: local `#e8674a` vs canonical `#F87171`
- dark `--warning`: local `#e8a34a` vs canonical `#E8A855`
- light `--warning`: local `#c97a2a` vs canonical `#E09B3D`
- light `--bg-alt`: local `#ECF2F2` vs canonical `#F7FAFA`

Because fragments are innerHTML-injected, these blocks apply **document-wide while the page is mounted** — navigating to an Insights page silently re-themes the shell chrome, then navigating away restores it. Each page also injects `html{font-size:14px}`, `body{font-family…}` and a `*{margin:0;padding:0}` global reset into the live document. Same 8 pages each redefine `.btn` (radius 8, 12px) and `.page-title` (22px) against components.css (`.btn` radius --r-md 10, `.page-title` on the shell scale). ~8× duplicated maintenance surface, and the reason "same-looking" pages feel subtly off from each other.

## Finding 2 — The mint-era twin (partners.html ↔ partner-management.html)

The PM-77x port copied partners.html into the shell **with its old design language attached**: both files share an identical 29-var block of which 22 are novel names from the retired system (`--mint, --mint-light, --card, --line, --muted, --dark, --mental…`). 43 hex literals, 23 distinct font sizes, 15 radii — in each. Two consequences: (a) any partner-management restyle has to be done twice or the legacy top-nav Partners tab (which still points at `/partners.html`) drifts; (b) the shell page pulls the whole retired vocabulary into the SPA document when mounted.

## Finding 3 — admin-console is a third theme system

28 local vars (25 shadowing canonical names, values close-but-not-equal), its own legacy theme key `vyve_admin_console_theme` read alongside `vyve-cc-theme`, its own `.modal/.toast/.avatar/.field/.spinner/.empty` implementations, and the repo's only 960px breakpoint. It is the member-admin surface — high traffic — running a fork of the design system.

## Finding 4 — The bolt-on portals load tokens then override them

coach-portal (45% adoption) and partner-portal (46%) link tokens.css but layer 12KB/28KB of own CSS with: own breakpoint ladders (560/700/760/840/1020 vs 600/720/800/900 — no overlap with the shell's 640/900), own theme keys, hardcoded gold/teal hexes in wave zones, and font sizes down to 9px/9.5px in dense grids. The wave-zone append pattern means every wave added CSS without consolidating — 6–7 generations of styles per file, live versions at the bottom.

## Finding 5 — Component duplication map

| Component | Canonical home | Also independently defined in |
|---|---|---|
| .card | components.css | 16 other files (both portals, all 8 Insights, partner-mgmt, partners, admin-console, ambassadors, perks…) |
| .btn | components.css (btn-primary/ghost/gold/sm/lg) | 11 others |
| .pill | shell/components | 12 others |
| .modal | shell.css + components.css (already ×2!) | admin-console, app-health, usage |
| .toast | shell.css | admin-console, partner-mgmt, partners |
| .kanban | components.css | partner-mgmt, partners |
| .stat | shell.css + components.css (×2) | admin-console |

Note shell.css and components.css **overlap each other** on .modal/.stat — even the canonical layer has two homes.

## Finding 6 — Typography scale is fiction in practice

tokens.css defines an 11-step --fs- scale, but the live distribution clusters at 10/11/12/13/14px (581 of ~870 declarations) with 28 other values sprinkled around them. Practical consequence: adjacent UI (e.g. a table label at 11px next to a pill at 11.5px next to meta text at 10.5px) reads as noise — one of the strongest "feels cheap" signals at phone width, where these sizes render below comfortable legibility anyway. The mobile-first restructure needs a **larger, coarser** scale, not just enforcement of the current one.

## Finding 7 — Spacing/radius drift

- Radius: 8px (69 uses), 10px (69), 12px (40) all fight for "the card radius"; 7/9/11/13px are one-off near-misses of neighbours. Both 99px and 999px are used for pills.
- Spacing: --s- adoption is minimal outside shell.css; page CSS uses raw px throughout (the 47% adoption number is dominated by colour vars, not spacing).
- Elevation: the good --shadow-* scale is barely referenced outside the shell; most cards are flat border-only, some hand-roll their own rgba shadows — inconsistent depth is another quiet cheapness signal.

## Finding 8 — Theme-key sprawl

Five localStorage theme keys live in the repo: `vyve-cc-theme` (canonical), `vyve_admin_console_theme` (legacy fallback), `vyve-coach-theme`, `vyve-partner-theme` (deliberate external-user separation), plus meet.html with none. A user moving between surfaces can get mismatched themes. The coach/partner separation was a deliberate call (partners aren't staff) — keep the separation but standardise the mechanism.

## What does NOT need fixing

- tokens.css v2 naming/structure — sound foundation, extend rather than replace.
- Shell responsive machinery (drawer, bottom tabs, .m-scroll, bottom-sheet modals) — the mobile patterns exist, they're just not adopted by the monoliths.
- The 20 orphaned legacy pages — out of scope by soft-kill policy.
- lib/ spine — architecture drift (supabase.js stub, dead legacy libs) is real but is code-hygiene, not design-system scope; flagged for the restructure phase, not the token phase.

## Priority order for the overhaul (drift-driven)

1. **Insights family** — delete 8 shadow token blocks + global resets, adopt shell scale. Highest duplication, mechanical fix, immediate consistency win across the most-used analytics surface.
2. **partner-management** — retire the mint vocabulary in the SPA copy; decide partners.html's fate (soft-kill from top-nav once parity confirmed).
3. **admin-console** — fold onto tokens (or absorb into the shell as a page — bigger call, restructure phase).
4. **coach/partner portals** — consolidate wave-zone CSS onto tokens during the mobile-first pass; unify breakpoint ladder.
5. **components.css/shell.css dedupe** — one canonical home per primitive.
