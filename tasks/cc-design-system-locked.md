# CC Design System — LOCKED (v3)
**PM-988 · locked 4 Sep 2026 by Dean (calibration calls made by Claude Fable, Dean-approved in lieu of the benchmark pass). This document is the executable spec for the migration sessions. Base state: CC HEAD `80412591`. Companion docs: `tasks/cc-overhaul-inventory.md`, `tasks/cc-overhaul-drift-audit.md`.**

**EXECUTION STATUS: Wave 0 SHIPPED 2026-09-04 (PM-1006, CC `c6a9fb49`) — tokens.css v3, components.css v2, shell.css slimmed to chrome, density boot in index.html. Two logged deviations recorded in the changelog: shell.css's breakpoint ladder is left to the mobile-first restructure, and the page-specific `.ap-*`/`#page-settings` blocks stay verbatim until Wave 4. Part A shipped with `--fs-xxs`/`--fs-hero` retained as compat aliases (they still had 14 live refs — see §23.201) for retirement in Wave 4. Wave 1 SHIPPED 2026-09-04 (PM-1007, CC `ca188b5e`) — the 8 Insights pages off their local dual-theme blocks and document-wide resets, primitives handed to components.css, Part C snaps applied, breakpoints on the 640/900/1280 ladder, zero JS changes, DOM byte-identical. Five behaviour-preserving scope calls logged in the changelog (`.stat-*` strip, modal sub-parts, `.card` margin, `.page-header` flex, `.btn:disabled`); the last exposed a real gap in components.css (no `:disabled` state) → new §23.202, to close in the components pass. Inline `style=` attributes and raw colour literals were deliberately left untouched — Part C's tables cover font-size/radius/breakpoint/var-names only. Wave 2 SHIPPED 2026-09-04 (PM-1008, CC `44367135`) — pages/partner-management.html: two scoped `html[data-theme]` blocks deleted, all 222 rules on canonical names, breakpoints on the 640/900/1280 ladder, zero JS changes, DOM byte-identical, `partners.html` byte-untouched. Three Part C deviations logged (`--mint`→`--accent`, `--mint-light`→`--accent-hover`, `--dark`→`--bg`) because the page's own values contradict the retired-name table — Part C's map was written from a different page's vocabulary and is NOT safe to apply blind on the remaining waves; check each page's actual values first. A 12-name scoped compat-alias block stays on the page because the frozen DOM and its 124KB renderer reference the mint names ~150x (§23.203); `--surface` deliberately excluded from it. `--amber` (referenced 4x, defined nowhere) aliased to `--warning`. Wave 2 was reverted and re-landed the same evening (PM-1009/1010, CC `0102d872`) after Dean's device check — both faults were PRE-EXISTING specificity bugs on the page, not the migration (§23.204): an inline `display:flex` set by the page's own JS that no stylesheet rule could beat, and an `#page-id *` reset out-ranking every components.css class rule. Waves 3 and 4 should expect the same class of fault on their pages and check inline styles + reset specificity BEFORE attributing anything to the migration. Wave 3 SHIPPED 2026-09-04 (PM-1011, CC `0c5811f2`) — `admin-console.html` linked to tokens.css + components.css and its local `:root` + both `html[data-theme]` blocks deleted. Corrections to this document's own premises, for Wave 4's benefit: the page DID carry a `:root` (12 names) as well as the theme blocks; Part C's `--teal-dark`→`--accent-hover` and `--teal-xl`→`--accent-pale` rows are both wrong on value AND moot (zero consumers), leaving `--row-hover`→`--hover-overlay` as the only live map — Part C's retired-name table has now been wrong on every page that has checked it, so **check values, never apply it blind**. No compat-alias block was needed (all 63 non-CSS var refs are canonical names). Primitives handed to components including `.page-header`/`.hdr-row`, inverting Wave 1's scope call because this page's frozen DOM has the child components expects; `.error-banner` kept page-local — components' copy is light-theme-only, a second §23.202 gap to close in the components pass. components' `!important` on `.grid-3`/`.grid-4` at base and 640 means page grid rules are never in control below 900px — Wave 4 must assume the same. §23.204 checked and clears both halves on this page. One JS change (Law 6 theme-key migrate); the page's `'dark'` default is deliberately retained against the shell's system default — aligning it needs the hardcoded `data-theme="dark"` pulled from the markup too, deferred to Wave 4. **shell.css is deliberately NOT linked** on this page (standalone document, own chrome, 22 colliding class names), so Law 2 does not apply to its `html,body` + `*` reset, which stays and is tokenised. **Wave 3's page was SOFT-KILLED the same session (PM-1012, CC `1d8ecd6c`): admin-console.html is delinked from all CC nav, file preserved. The migration still stands and the page still renders on its direct URL. Process note for Wave 4: confirm with Dean that a surface is still wanted BEFORE migrating it — this one was migrated and retired within the hour, and the sweep list has ~24 pages on it.** NEXT: Wave 4 (small-page sweep) — also retires the `--fs-xxs`/`--fs-hero` compat aliases and moves the `.ap-*`/`#page-settings` blocks out of components.css.**

Status of the five calibration points — ALL LOCKED:
1. Light bg = near-white teal-tinted (not cream). 2. Card radius 12 / control radius 10. 3. Desktop = compact density default, mobile = comfortable always. 4. System theme default retained; dark is the PRIMARY design review target. 5. Command palette = first-class (styling only in this phase; promotion rides the restructure).

---

## PART A — tokens.css v3 (complete replacement file content)

Replace `assets/tokens.css` with exactly this. Names are backwards-compatible with all ~2,470 existing var() refs; retired names are listed in Part D and must be migrated in the same wave that touches their consumers.

```css
/* =====================================================================
   VYVE Command Centre — Design Tokens v3 (PM-988 lock, 2026-09-04)
   Single source of truth. Do NOT redefine any of these names in a page.
   ===================================================================== */
:root {
  /* Brand */
  --vyve-dark: #0D2B2B; --vyve-teal: #1B7878; --vyve-teal-light: #4DAAAA;
  --vyve-teal-pale: #DEEFEF; --vyve-gold: #C9A84C; --vyve-gold-pale: #F4ECD3;
  --vyve-cream: #EFF4F4; --vyve-charcoal: #1A2B2B;

  /* Pillars */
  --pillar-physical: #D49B2C; --pillar-physical-pale: #F6EDD6;
  --pillar-mental: #4DAAAA;   --pillar-mental-pale: #DEEFEF;
  --pillar-social: #D17F6E;   --pillar-social-pale: #F7E3DE;

  /* Neutrals — light (LOCK 1: near-white, teal-tinted) */
  --bg: #F7F9F9; --bg-alt: #FBFCFC; --surface: #FFFFFF;
  --surface-2: #F0F4F4; --surface-3: #E4EBEB; --surface-sunken: #EDF2F2;
  --surface-raised: #FFFFFF;
  --border: rgba(13,43,43,.09); --border-strong: rgba(13,43,43,.18);
  --text: #0D2B2B; --text-muted: #4E6E6E; --text-dim: #8CA6A6;

  /* Semantic */
  --success: #1F8F45; --success-pale: #D8EDDE;
  --warning: #E09B3D; --warning-pale: #FAEAD0;
  --danger:  #C64545; --danger-pale:  #F3D6D3;
  --info:    #3D7FD9; --info-pale:    #D7E4F5;

  /* Interaction (NEW tier — no page invents hover colours any more) */
  --hover-overlay: rgba(13,43,43,.04);
  --active-overlay: rgba(13,43,43,.07);
  --selected-bg: var(--accent-pale);
  --focus-ring: 0 0 0 3px rgba(77,170,170,.28);

  /* Sidebar (unchanged — brand-dark both themes) */
  --sidebar-bg: #0D2B2B; --sidebar-bg-2: #0A2222;
  --sidebar-text: rgba(245,242,236,.75);
  --sidebar-active: rgba(77,170,170,.16); --sidebar-active-fg: #EAF5F5;
  --sidebar-hover: rgba(255,255,255,.05);
  --sidebar-section: rgba(255,255,255,.32); --sidebar-border: rgba(255,255,255,.08);

  /* Accent */
  --accent: var(--vyve-teal); --accent-hover: #166262;
  --accent-light: var(--vyve-teal-light); --accent-pale: var(--vyve-teal-pale);
  --on-accent: #FFFFFF;

  /* v2 aliases, folded in (was a separate block) */
  --teal: var(--vyve-teal); --teal-lt: var(--vyve-teal-light);
  --gold: #A8873A; --gold-pale: rgba(201,168,76,.14);
  --settled: rgba(13,43,43,.10); --settled-pale: rgba(13,43,43,.04);
  --ring: rgba(27,120,120,.5);

  /* Typography */
  --font-head: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-body: var(--font-head);
  --font-mono: 'DM Mono', 'SF Mono', ui-monospace, 'Roboto Mono', monospace;

  /* Type scale (LOCK: 10 steps, 11px floor, 16px inputs = no iOS zoom) */
  --fs-2xs: 11px; --fs-xs: 12px; --fs-sm: 13px; --fs-base: 14px;
  --fs-md: 16px; --fs-lg: 18px; --fs-xl: 22px; --fs-2xl: 28px;
  --fs-3xl: 34px; --fs-4xl: 44px;

  --fw-normal: 400; --fw-medium: 500; --fw-semi: 600; --fw-bold: 700;
  --ls-tight: -0.02em; --ls-snug: -0.01em; --ls-normal: 0; --ls-wide: 0.04em; --ls-mega: 0.12em;
  --lh-tight: 1.2; --lh-base: 1.5; --lh-dense: 1.35;

  /* Radii (LOCK 2: five values only) */
  --r-sm: 6px; --r-md: 10px; --r-lg: 12px; --r-xl: 20px; --r-pill: 999px;

  /* Spacing (4px scale, unchanged) + semantic layout */
  --s-0: 0; --s-1: 4px; --s-2: 8px; --s-3: 12px; --s-4: 16px; --s-5: 20px;
  --s-6: 24px; --s-7: 32px; --s-8: 40px; --s-9: 56px; --s-10: 80px;
  --pad-card: var(--s-5); --pad-card-m: var(--s-4);
  --pad-page: clamp(16px, 4vw, 32px);
  --gap-grid: var(--s-4); --gap-stack: var(--s-3);
  --row-h: 44px; --row-h-dense: 36px; --tap-min: 44px;

  /* Layout */
  --sidebar-w: 244px; --topbar-h: 62px; --content-max: 1320px;
  --content-pad: var(--pad-page); /* alias kept; consumers unchanged */

  /* Elevation (values unchanged) + usage aliases */
  --shadow-xs: 0 1px 1px rgba(13,43,43,.04);
  --shadow-sm: 0 1px 2px rgba(13,43,43,.04), 0 2px 4px rgba(13,43,43,.04);
  --shadow-md: 0 2px 4px rgba(13,43,43,.04), 0 8px 16px rgba(13,43,43,.06);
  --shadow-lg: 0 4px 8px rgba(13,43,43,.06), 0 16px 32px rgba(13,43,43,.10);
  --shadow-xl: 0 8px 16px rgba(13,43,43,.08), 0 32px 64px rgba(13,43,43,.16);
  --shadow-focus: var(--focus-ring);
  --elev-card: var(--shadow-sm); --elev-raised: var(--shadow-md); --elev-overlay: var(--shadow-xl);

  /* Motion + z (unchanged) */
  --t-instant: .08s ease; --t-fast: .15s ease;
  --t-base: .24s cubic-bezier(.4,0,.2,1); --t-slow: .4s cubic-bezier(.4,0,.2,1);
  --z-sidebar: 40; --z-overlay: 49; --z-drawer: 50; --z-topbar: 30; --z-modal: 100; --z-toast: 120;

  /* Component contract (NEW — components.css consumes these; pages NEVER redefine primitives) */
  --btn-h: 40px; --btn-h-sm: 32px; --btn-pad-x: var(--s-4);
  --btn-radius: var(--r-md); --btn-fs: var(--fs-sm);
  --input-h: 44px; --input-radius: var(--r-md); --input-fs: var(--fs-md);
  --card-radius: var(--r-lg); --card-pad: var(--pad-card); --card-border: 1px solid var(--border);
  --pill-fs: var(--fs-2xs); --pill-pad: 3px 10px;
  --modal-radius: var(--r-xl); --modal-max-w: 560px;
  --table-row-h: var(--row-h); --table-fs: var(--fs-sm);
}

/* Dark theme (LOCK 4: primary design target — review every wave dark-first) */
html[data-theme="dark"] {
  --bg: #081616; --bg-alt: #0B1D1D; --surface: #0E2222;
  --surface-2: #132C2C; --surface-3: #1A3838; --surface-sunken: #0A1C1C;
  --surface-raised: #132C2C;
  --border: rgba(141,196,196,.12); --border-strong: rgba(141,196,196,.22);
  --text: #E9F3F3; --text-muted: #93B3B3; --text-dim: #5E7D7D;
  --hover-overlay: rgba(233,243,243,.05); --active-overlay: rgba(233,243,243,.09);
  --focus-ring: 0 0 0 3px rgba(111,197,197,.35);
  --shadow-sm: 0 1px 2px rgba(0,0,0,.32); --shadow-md: 0 4px 12px rgba(0,0,0,.4);
  --shadow-lg: 0 24px 64px rgba(0,0,0,.6); --shadow-xl: 0 24px 64px rgba(0,0,0,.6);
  --vyve-cream: #0C2020;
  --pillar-physical-pale: rgba(212,155,44,.18);
  --pillar-mental-pale: rgba(77,170,170,.18);
  --pillar-social-pale: rgba(209,127,110,.18);
  --gold: #D5B65E; --gold-pale: rgba(213,182,94,.12);
  --settled: rgba(233,243,243,.16); --settled-pale: rgba(233,243,243,.06);
  --ring: rgba(111,197,197,.55);
  --accent: var(--vyve-teal-light); --accent-hover: #6FC5C5;
  --accent-pale: rgba(77,170,170,.10); --on-accent: #081616;
  --success: #4ADE80; --success-pale: rgba(74,222,128,.12);
  --warning: #E8A855; --warning-pale: rgba(232,168,85,.13);
  --danger: #F87171; --danger-pale: rgba(248,113,113,.12);
  --info: #60A5FA; --info-pale: rgba(96,165,250,.12);
  --sidebar-bg: #061212;
}
@media (prefers-color-scheme: dark) {
  html:not([data-theme="light"]):not([data-theme="dark"]) {
    /* EXACT duplicate of the html[data-theme="dark"] block above — keep byte-identical when editing */
  }
}

/* Density (LOCK 3): compact is desktop opt-out-able; comfortable is the base */
html[data-density="compact"] {
  --row-h: var(--row-h-dense); --card-pad: var(--s-4); --table-fs: var(--fs-xs);
}
```
NOTE for the implementer: the prefers-color-scheme block must carry the full dark var set duplicated verbatim (CSS has no mixins) — expand it when writing the file; the comment above marks intent, not content.

## PART B — Laws (apply to every wave)

1. **Breakpoints: exactly three — 640 / 900 / 1280, min-width only.** Base styles are phone. `@media (min-width:640px)` adds tablet density, `(min-width:900px)` desktop (the existing shell drawer↔rail line), `(min-width:1280px)` wide. Every other breakpoint encountered in a file being touched is converted; files not being touched are left alone.
2. **No page defines `:root`, `html{}`, `body{}`, or a `*` reset.** Fragments inherit the shell. Deleting these blocks is the first edit of every page pass.
3. **One primitive, one home.** `.btn .card .pill .badge .modal .sheet .toast .stat .tab .field .table .empty .spinner .kanban` live in components.css ONLY, built on the component-contract tokens. shell.css keeps chrome (sidebar/topbar/drawer/login) only.
4. **Class names and DOM structure are frozen.** The paired JS renderers (assets/*.js, page inline scripts) select by class/id — restyle values, never rename selectors, never restructure markup. Behaviour zero-change is the acceptance bar.
5. **Density boot:** shell adds `data-density="compact"` on `<html>` when viewport ≥900px unless localStorage `vyve-cc-density` says otherwise; mobile never compact. One small addition to the index.html boot script (pre-paint, beside the theme boot).
6. **Theme keys:** all staff surfaces read/write `vyve-cc-theme` only. admin-console's `vyve_admin_console_theme` read is deleted (one-time migrate: if old key exists and new doesn't, copy then remove). `vyve-coach-theme` / `vyve-partner-theme` untouched — external audiences, out of scope.
7. **Dark-first review:** after each wave, the implementer's own visual reasoning pass and Dean's device check happen in dark theme first, then light.

## PART C — Migration snap tables (mechanical, no judgment)

**Font-size px → token:** ≤11.5→--fs-2xs · 12/12.5/12.8→--fs-xs · 13/13.5→--fs-sm · 14/14.5→--fs-base · 15–16.5→--fs-md · 17–19→--fs-lg · 20–23→--fs-xl · 24–28→--fs-2xl · 30–36→--fs-3xl · 42–44→--fs-4xl.
**Radius px → token:** 2–7→--r-sm · 8–11→--r-md · 12–16→--r-lg · 18–34→--r-xl · 99/999→--r-pill. Cards specifically → var(--card-radius); buttons/inputs → var(--btn-radius)/var(--input-radius).
**Breakpoints:** 440/480/560/600→640 · 640→640 · 680–860→900 · 880–960→900 · 1020–1100→1280. Max-width queries invert to min-width during the rewrite of that block.
**Retired var names → canonical:** --mint→--accent-pale · --mint-light→--surface-2 · --card→--surface · --line→--border · --muted→--text-muted · --dark→--vyve-dark · --mental/--physical/--social→--pillar-* · --sb-*→--sidebar-* · --font→--font-body · admin-console --teal-dark→--accent-hover · --teal-xl→--accent-pale · --row-hover→--hover-overlay. Anything not in this table: nearest canonical by inspection, logged in the wave's commit message.

## PART D — Wave plan (Opus execution scope; one wave = one session = one commit + Dean device check)

**Wave 0 — foundations.** tokens.css v3 (Part A verbatim, dark block expanded) + components.css v2 (all primitives rebuilt on the contract tokens; absorb shell.css's .modal/.stat/.toast; slim shell.css to chrome) + density boot in index.html. Risk note: the type-scale value shifts (base 13.5→14 etc.) move every var() consumer at once — that is intended; raw-literal pages are untouched until their wave.
**Wave 1 — Insights family (8 pages + their 8 assets/*.js only if they inject styles).** Per page: delete the local dual-theme block, html/body/reset globals, local .btn/.page-* definitions; snap remaining literals per Part C; convert breakpoints. Zero JS changes.
**Wave 2 — pages/partner-management.html.** Delete the mint-era :root, apply the retired-name map, snap, three breakpoints. `partners.html` stays BYTE-UNTOUCHED — its delink from VYVE_NAV_TOP is Dean's call after he confirms partner-management parity on device.
**Wave 3 — admin-console.html.** Local 28-var system deleted in favour of a tokens.css `<link>` (+components.css); theme-key migration per Law 6; local primitive definitions dropped where components.css now covers them; page-specific styles (member table, detail drawer) restyled onto tokens in place. Biggest wave — allow a full session.
**Wave 4 — small-page sweep.** Remaining shell pages with raw literals (home, finance, invoicing, employers, tasks, calendar, meetings, crm, content, podcast, investor, inbound, inbox, documents, broadcast, active-users, complaints, ambassadors, perks, bookings, platform-health, links, settings, domain). Mechanical snap only; most are already 50%+ adopted.

**OUT of Opus scope (stays with Fable):** coach-portal.html, partner-portal.html, meet.html, the mobile-first restructure, command-palette promotion, monolith absorb/iframe/link-out decision, Capacitor wrap. Orphaned legacy pages: never touched (soft-kill policy).

## PART E — Guardrails for the executing session (non-negotiable)

- Brain is source of truth; load it first. If this spec conflicts with the brain, the brain wins.
- GitHub writes via Vault PAT + Git Data API only (blobs→tree→commit→update ref). §23.21 fresh-HEAD refresh before every commit; §23.30 md5-perfect verification of every committed file at the commit SHA (never ref=branch, never first-N-chars).
- §23.24/25 fresh PM-number claim at commit time across all four repos; §23.23 session-start collision scan (last 15 CC commits for design-system keywords) — parallel sessions are real.
- CC deploys via Cloudflare Pages auto-deploy (<1 min); no vbb/sw ritual applies to this repo (§23.163: check Cloudflare deployments, not GitHub Pages builds).
- Soft-kill only: no file deletions, ever, without fresh explicit instruction from Dean.
- Every inline `<script>` block of every touched file node-parses post-edit. Anchored patches assert ALL anchors before applying ANY.
- One wave per session. End every session with the atomic VYVEBrain sync (changelog prepended, backlog + this spec's status updated) and a plain list of Dean's device checks. Never tell Dean to stop, rest, or defer.
- If anything on a page looks like it needs a judgment call this spec doesn't cover: stop, state the question plainly, wait for Dean. Do not improvise design decisions.
