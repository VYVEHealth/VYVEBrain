# Playbook — CC Mobile Audit (pre-app-wrap)

**PM-923 · 11 Aug 2026.** Full-repo scan of `vyve-command-centre` for mobile-fit failures, triggered by Dean's device reports (topnav dark strip PM-920, invisible checkboxes PM-921, three clipped pages PM-923) and the decision that the CC becomes a phone app **this week**. This doc is the single source of truth for what's fixed, what remains, and the conventions every CC page must follow before the wrap.

## Scan method

Repo tarball via codeload → grep-based audit of all 46 `pages/*.html` + 3 root monoliths + `assets/*.css`: tables vs `.m-scroll` adoption, shared `.tab-bar` usage, fixed px widths ≥200, board/grid layouts, overflow handling, modal sizing. History note: **PM-764 (M1 mobile primitives) already shipped `.m-scroll` + near-full-screen modals ≤640px — but adoption stalled at 4 of 18 table pages.** That adoption gap is the root inconsistency Dean saw.

## Systemic findings → FIXED GLOBALLY (PM-923, CC `488c16d6`)

| # | Finding | Fix |
|---|---|---|
| 1 | **21 tables across 14 pages have no `.m-scroll` wrapper** (ai-usage, bookings, complaints, employers×2, finance, investor×2, invoicing, platform×2, podcast, retention×2, revenue×3, social-blueprint, usage, wellbeing) → clip at phone width with no swipe (Dean screenshot 2, cron table) | `@media ≤900px`: `.page table { display:block; overflow-x:auto }` — every table becomes its own scroller, zero markup changes. Escape hatch `table.no-mscroll`. |
| 2 | **Shared `.tab-bar` clips** (app-health, intel, sessions, settings, strategy, usage — Dean screenshots 1+2, Overview/Cron/Pipelines/Performance strip) | `.tab-bar` swipes on mobile (nowrap + overflow-x, hidden scrollbar), `.tab-btn` no-wrap. |
| 3 | **tasks `.tk-board` = rigid 4-col grid** → columns crushed/clipped (Dean screenshot 3). Note components.css already had a proper `.kanban` scroller — tasks rolled its own; the inconsistency in one line. | ≤900px board = flex snap-scroll, 80vw columns, swipe between To do/Doing/Blocked/Done. |
| 4 | Media elements could exceed viewport | `img/canvas/svg/video max-width:100%` inside pages. |

Earlier same-night shell fixes (separate commits): **PM-920** topnav toolbar overflow (the dark strip on every page) + meetings row wrapping; **PM-921** `.form-group` checkbox rule crushing labels.

## Fixed-width sampling (mostly benign)

The inline `width:420/640/760/900px` hits are overwhelmingly `max-width` (gate cards, modals, prose measures) — these shrink correctly. Newer pages (finance, ai-usage, content, crm, activity-depth, brief, dashboard) already carry their own ≤640/900 media rules; older pages have none — acceptable once the global table/tab/media rules apply, but see per-page list.

## Remaining per-page items (ride Streamline Phase 2/3 — this week, pre-wrap)

- **partners.html (165KB, 8 tables) + admin-console.html (132KB, 5 tables) + partner-portal.html** — the monoliths are NOT covered by the `.page table` rule (they're standalone documents, not SPA partials). They're being ported into the SPA in Phase 2/3 anyway; the port must land them under the global rules + a visual pass. **Until ported, they remain the worst mobile surfaces.**
- **calendar.html** — grid month view needs its own mobile treatment (agenda list ≤640px is the standard pattern); recurring-event modals check.
- **documents.html** — `min-width:340px` panel; verify two-pane collapses.
- **Charts (chart.js pages)** — `responsive:true` assumed; verify each canvas on device (app-health, usage, retention, revenue, wellbeing, activity-depth).
- **home.html launchpad + brief.html** — visual pass only.
- **Device QA sweep**: Dean walks every sidebar entry on iPhone after Phase 2/3; log failures against this doc.

## Conventions (bank these — every new/ported CC page)

1. Tables: rely on the global mobile scroller; add `.m-scroll` wrapper only when a table must scroll on desktop too. Opt out with `table.no-mscroll`.
2. Tab strips: use the shared `.tab-bar`/`.tab-btn` — never a bespoke pill row.
3. Boards/columns: use `.kanban`/`.kanban-col` (scrolls natively) — do not re-implement grids.
4. Widths: `max-width` always, fixed `width:*px` never on containers.
5. Inputs: type-scope any new form styling (§ PM-921 — broad `input` selectors eat checkboxes).
6. Modals: `.modal` only (already near-full-screen ≤640px).
7. New page? Test at 393pt before commit — the app wrap makes phone the primary surface.

## App-wrap readiness gate (end of week)

- [x] Shell fits (PM-920) · [x] Systemic table/tab/board fixes (PM-923) · [x] Meetings/tasks device-clean
- [ ] Phase 2 partners port + mobile pass · [ ] Phase 3 admin-console port + mobile pass · [ ] Calendar mobile view · [ ] Chart device sweep · [ ] Full sidebar walk on Dean's iPhone
- Then: Capacitor wrap (reuse vyve-capacitor patterns; no sw/vbb ritual — CC deploys via Cloudflare, wrap points at admin.vyvehealth.co.uk).
