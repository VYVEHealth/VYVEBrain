# Command Centre — Design Token System Proposal (v3)
**PM-988 pre-work · 4 Sep 2026 · PROPOSAL ONLY — nothing applied to the repo.**
Informed by the drift audit. Principle: **evolve tokens.css v2, don't replace it** — 114 vars with good names already exist and ~2,470 var() references depend on them. v3 = tighten values, add the missing tiers (breakpoints, density, component tokens), and make mobile-first the default posture. Your benchmark screenshots slot into the "Dean calibration points" flagged throughout.

---

## 1. Colour — keep, consolidate, one addition

Keep the v2 structure exactly: brand → neutrals → semantic → sidebar → accent, dual-theme via `[data-theme]`. Changes:

- **Absorb the diverged values.** The Insights-local variants (their `--warning`/`--danger` etc.) die; canonical wins. One reconciliation pass, no new names.
- **Kill the v2 alias tail as a separate block** — fold `--teal/--gold/--settled/--ring` into the main block so there's one `:root`, not two.
- **Add an interaction tier** (the gap that makes buttons/rows feel flat): `--hover-overlay: rgba(13,43,43,.04)` / dark `rgba(233,243,243,.05)`, `--active-overlay` at ~1.6×, `--selected-bg: var(--accent-pale)`. Today every page invents its own hover colour.
- **Add `--surface-raised`** (modal/popover surface, one step above --surface in dark; equals --surface in light). Dark-mode modals currently sit on the same value as the page and lose depth.
- Retired vocabulary (`--mint*`, `--card`, `--line`, `--muted`, `--dark`, admin-console's `--teal-dark/--teal-xl/--row-hover`) maps to canonical names in a one-time sed table during migration — no aliases kept.

**Dean calibration point:** whether the light theme stays cream-warm (`#F3F6F6`) or moves cooler/whiter toward the Linear/Stripe register. Cream is the brand link; near-white is the premium-tool register. Your benchmark shots decide this — it's a 2-value change (`--bg`, `--bg-alt`).

## 2. Typography — the biggest value change

Current scale is desktop-dense (base 13.5px, drift down to 9px). A mobile-first app cannot ship 10–11px body text. Proposed scale — fewer steps, bigger floor:

```
--fs-2xs:  11px   /* pills, table meta — the FLOOR. Nothing below this. */
--fs-xs:   12px   /* labels, captions, badges */
--fs-sm:   13px   /* secondary/table body */
--fs-base: 14px   /* body default (was 13.5) */
--fs-md:   16px   /* emphasised body, inputs (16 = no iOS zoom-on-focus) */
--fs-lg:   18px   /* card titles */
--fs-xl:   22px   /* page titles */
--fs-2xl:  28px   /* section heroes */
--fs-3xl:  34px   /* stat heroes */
--fs-4xl:  44px   /* login/hero only */
```

10 steps (was 11 + 33 wild literals). Migration rule: every px literal snaps to nearest step; 9–10.5px → --fs-2xs (deliberate upsize). Weights/letter-spacing tokens unchanged. `--fs-hero: 56px` retired (login pane only user — restyle that once).
**Line-height tokens added** (missing entirely today): `--lh-tight: 1.2` (headings), `--lh-base: 1.5` (body), `--lh-dense: 1.35` (tables). Fonts stay DM Sans / DM Mono — they're distinctive and already everywhere; mono for numbers is the cheapest "Stripe dashboard" signal we already own.

## 3. Spacing — keep the scale, add semantic layout tokens

The 4px `--s-0..10` scale is right; adoption is the problem. Additions that make adoption natural, because they name what pages actually build:

```
--pad-card:    var(--s-5);          /* 20 — card interior */
--pad-card-m:  var(--s-4);          /* 16 — card interior ≤ tablet */
--pad-page:    clamp(16px, 4vw, 32px);   /* replaces --content-pad 32px fixed */
--gap-grid:    var(--s-4);          /* between cards */
--gap-stack:   var(--s-3);          /* between rows in a list */
--row-h:       44px;                /* touch-safe table/list row */
--row-h-dense: 36px;                /* desktop dense mode */
--tap-min:     44px;                /* minimum hit target — mobile-first law */
```

## 4. Radii — 20 values → 5

```
--r-sm:   6px    /* inputs, pills-in-tables, small chips */
--r-md:   10px   /* buttons, inputs — THE control radius */
--r-lg:   14px   /* cards — THE card radius */
--r-xl:   20px   /* modals, sheets, hero panels */
--r-pill: 999px
```

Retire --r-xs/--r-2xl. Migration snap: 2–7→sm, 8–11→md, 12–16→lg, 18–34→xl, 99/999→pill. Single decision that removes the near-miss noise (7/9/11/13px) outright.
**Dean calibration point:** card radius 14 vs 10 — Linear runs tight (~8–10), Notion softer. Benchmark shots decide; it's one token.

## 5. Elevation — keep v2 shadows, add usage law

The --shadow-xs..xl scale is already premium-grade; it's just unused. v3 adds the **law**, encoded as component tokens so it can't drift:

```
--elev-card:    var(--shadow-sm);
--elev-raised:  var(--shadow-md);   /* dropdowns, popovers */
--elev-overlay: var(--shadow-xl);   /* modals, sheets, command palette */
```

Cards get border + --elev-card in light, border-only in dark (dark depth comes from --surface steps, not shadow). Ends the flat-vs-hand-rolled-shadow mix.

## 6. Breakpoints — 20 → 3, as tokens

CSS vars can't drive @media, so these live as a **documented constant set** + optional build-time check:

```
sm:  640px   /* phone → large phone   (below = single column, bottom tabs, sheets) */
md:  900px   /* tablet → desktop      (sidebar drawer ↔ persistent rail boundary — already the shell's line) */
lg:  1280px  /* wide desktop          (dense multi-column) */
```

**Mobile-first authoring rule: base styles = phone; @media (min-width) adds density.** Every current page is authored the other way round. All monolith ladders (440…1100) snap to these three during their restyle passes. 640/900 are already the shell's most-used lines — this codifies the de-facto winners.

## 7. Density — the desktop-app ↔ mobile-app bridge

One mechanism instead of per-page media queries for the CC's dense tables:

```
html[data-density="comfortable"]  /* default; mobile always this */
html[data-density="compact"]     /* desktop opt-in: --row-h→--row-h-dense, --pad-card→--s-4, --fs-sm tables */
```

Lets the same table components serve the Linear-style dense desktop view and a touch-usable app without forking markup. Cheap to implement (a handful of var swaps), big payoff for the Capacitor wrap.

## 8. Component tokens (new tier)

The audit shows primitives redefined 12–17×. The fix isn't just "use components.css" — it's giving components.css a token contract so surfaces can differ *by variable, never by redefinition*:

```
--btn-h: 40px;  --btn-h-sm: 32px;  --btn-pad-x: var(--s-4);
--btn-radius: var(--r-md);  --btn-fs: var(--fs-sm);
--input-h: 44px;  --input-radius: var(--r-md);  --input-fs: var(--fs-md);
--card-radius: var(--r-lg);  --card-pad: var(--pad-card);  --card-border: 1px solid var(--border);
--pill-fs: var(--fs-2xs);  --pill-pad: 3px 10px;
--modal-radius: var(--r-xl);  --modal-max-w: 560px;
--table-row-h: var(--row-h);
```

Consolidation target: **one primitive, one home** — `.btn .card .pill .badge .modal .sheet .toast .stat .tab .field .table .empty .spinner .kanban` all live in components.css only; shell.css keeps layout chrome only (the current shell/components overlap on .modal/.stat gets resolved into components).

## 9. Theme structure — unchanged mechanism, unified keys

Keep: `[data-theme]` attribute, light default, system fallback via prefers-color-scheme, pre-paint boot script. Change: **one storage key per audience** — `vyve-cc-theme` (staff shell + admin-console + meet), `vyve-coach-theme`, `vyve-partner-theme` (external audiences stay separate by design) — and delete the `vyve_admin_console_theme` legacy read. All three keys drive the identical token file.

## 10. Migration shape (for the later ship sessions — not now)

1. tokens.css v3 lands (additive + value tightening) — zero visual risk to var() consumers beyond the deliberate scale shifts.
2. components.css v2 with the token contract; shell.css slimmed to chrome.
3. Page passes in the audit's priority order (Insights → partner-management → admin-console → portals), each = delete local block + snap literals; the density/breakpoint law applies as each page is touched.
4. Benchmark-informed decisions (bg temperature, card radius, table density) resolved before step 3 starts — they're single-token calls but touch everything.

## Dean calibration points — the list your benchmark pass answers

1. Light background temperature: cream-warm (brand) vs near-white (tool register).
2. Card radius: 10 vs 14.
3. Dense-table default on desktop: compact or comfortable.
4. Dark theme as the *primary* design target (Linear-style) vs light-primary as today.
5. Command palette prominence — quick-search.js exists (Cmd+K); does it become a first-class shell citizen with its own component tokens (your benchmark list includes command palettes, so I assume yes and have left --elev-overlay/--modal-* ready for it).
