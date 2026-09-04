# Command Centre — Full Repo Surface Inventory
**PM-988 pre-work · 4 Sep 2026 · pinned at `80412591` (live main HEAD)**
101 files, ~3.0MB source. Host: admin.vyvehealth.co.uk via Cloudflare Pages.

---

## 1. The four architectures living in one repo

The CC is not one app — it's four generations of architecture side by side. This is the single most important fact for the overhaul.

**A. The SPA shell** (`index.html` + `lib/` + `assets/` + `pages/`). Hash-routed: `lib/router.js` fetches `pages/<slug>.html` and injects it into a content slot via innerHTML. Shell owns login (magic link), sidebar (from `sidebar-config.js`), topbar, theme boot (`vyve-cc-theme`), collapsed-rail pref. Loads `tokens.css` → `shell.css` → `components.css`. This is the "real" CC and the natural spine of the app.

**B. Standalone monoliths, pre-tokens era.** `admin-console.html` (134KB, member admin) and `partners.html` (156KB, legacy partner management) — each a complete self-contained app with its own auth boot, own CSS system, own theme handling. `partners.html` was re-skinned onto token *values* in PM-762 but structurally still carries its own 29-var local system.

**C. Standalone monoliths, bolt-on era.** `coach-portal.html` (523KB — the biggest file in the repo, 15 views, 7 build waves) and `partner-portal.html` (250KB, 9 views). Both load `tokens.css` but carry 12–28KB of their own inline CSS, their own breakpoint sets, and their own theme keys (`vyve-coach-theme`, `vyve-partner-theme`). Both are built on the wave-zone/IIFE-shadowing pattern (edit bottom versions; legacy DOM CSS-hidden).

**D. Orphan utilities.** `meet.html` (Daily video embed for Meetings) — 3 hardcoded vars, no token load, no theme.

## 2. SPA shell pages — live (in nav)

| Page | KB | What it does | Data |
|---|---|---|---|
| home | 24 | Tile launchpad + live pulse (members/MRR/sessions/alerts) | cc-home EF |
| links | 8 | Static grouped directory of every VYVE surface/tool | static |
| inbox | 13 | Partner support messages, conversation view | Supabase |
| crm | 12 | Stage-grouped sales pipeline board | cc_leads/cc_clients |
| finance | 13 | Snapshot ledger, live billed MRR, £6K target bar, runway | cc_finance/cc_revenue_cache |
| invoicing | 18 | Raise/track/mark-paid + B2B seat-billing rows, Run-billing preview (PM-998) | cc_invoices + b2b-billing-run EF |
| investor | 14 | Funding pipeline + grant calendar | cc_investors/cc_grants |
| content | 10 | Post planner/approval ahead of Metricool | cc_posts |
| podcast | 10 | Episode tracker | cc_episodes |
| inbound | 9 | Website applications / contact / demo / podcast-guest feed | Supabase |
| tasks | 34 | Shared team task board | cc_tasks |
| documents | 25 | Internal docs/files (nav status "skeleton") | cc_documents |
| calendar | 48 | Operating calendar — sessions, deadlines, events | calendar_occurrences + cc_calendar_events |
| meetings | 23 | Daily-video meetings, bot transcription, AI summaries, task sign-off | Supabase + meet.html |
| broadcast | 21 | Push broadcast to member devices (Lewis-facing) | admin-broadcast-push EF |
| active-users | 16 | Who's in the app now | Supabase |
| complaints | 14 | Help & Support triage/resolve | member_complaints |
| partner-management | 173 | Full partner ops ported into the shell: pipeline kanban, go-live gates + portal-minimums checklist, moderation, payouts, revenue rollup | Supabase (heavy) |
| ambassadors | 18 | Ambassador roster, QR/join-link kits, agreement-sign go-live | ambassador RPCs |
| perks | 17 | Discount-partner CRUD + logo upload + engagement line | member_perks |
| bookings | 14 | Employer expert requests + booking ledger | bookings |
| employers | 30 | Organisations (status/seats/£-per-seat, activate/pause billing), New Employer wizard, portal logins, benchmarks | employers + employer-provision EF |
| platform-health | 10 | Watchtower tiles, alert feed, client errors | watchtower_status/platform_alerts |
| app-health, usage, retention, activity-depth, wellbeing, platform, revenue, ai-usage | 10–27 each | The 8 Insights pages (PM-559→594), each rendered by a paired `assets/<page>.js` (8.5–43KB) off an hourly-cron JSONB cache | cc_* cache tables |
| settings | 61 | Tabbed Account area (PM-9xx overhaul) | Supabase + localStorage |

## 3. Orphaned pages (in repo, delinked — soft-kill policy §23)

`action-plans` (45KB), `social-blueprint` (47KB), `brief` (Lewis morning brief, PM-912 kill), `strategy`, `dashboard`, `marketing`, `org`, `knowledge`, `competitors`, `commercial`, `delivery`, `team`, `clients`, `intel`, `intel-hub`, `activity`, `sessions`, `domain` (still used as the #/domain-* landing renderer), `trash`. ~20 files, ~250KB. All reachable via `#/slug`. **For the overhaul: these should not be re-skinned — they're out of scope by the soft-kill rule, but their weight matters if the repo becomes an app bundle.**

## 4. lib/ layer (16 modules)

Live spine: `router.js` (hash routing + fragment fetch), `auth.js` (strict/fail-closed magic-link gate), `acl.js` (area grants — how Cole/Calum get partner pages), `supabase-client.js` (the ONE wrapper, PM-779; `supabase.js` is the old stub that once clobbered it — both still present), `cc-sync.js` (PM-777 cc_kv strangler: all 16 localStorage-era pages server-backed), `notify.js` (PM-913 notifications), `quick-search.js` (Cmd+K), `shortcuts.js`, `ui.js`, `widgets.js`, `drafts.js` (modal autosave), `pdf-export.js`.
Legacy-era, still loaded by old pages: `data.js`, `store.js`, `entities.js`, `views.js`/`views-ui.js`, `comments.js`, `integrations.js`, `make.js`, `targets.js`, `notifications.js` (superseded by notify.js), `cc-adapter.js`. Plus `assets/seed-data.js` — **166KB of mock data still in the repo**, only legacy pages read it.

## 5. The monoliths in detail

**coach-portal.html — 523KB, 15 views:** dashboard, clients (+10-tab client workspace), daily check-ins, check-ins, exercises library, plans (all six template kinds), calendar, content library, messages, notifications, automations, leads, profile→Account (Overview/Settings/Data-Consent), settings (soft-killed parking spot), soon. Own breakpoints: 560/700/760/840/1020.

**partner-portal.html — 250KB, W1–W6 shell:** dashboard, notifications + 7 legacy panels (profile→Account tabs, content, sessions, bookings, earnings, community, help), calendar, leads, requests inbox. Own breakpoints: 600/720/800/900.

**admin-console.html — 134KB:** member list/detail/edit, attribution card, account resets. Own 28-var token system, dual theme keys (`vyve_admin_console_theme` legacy + `vyve-cc-theme`), breakpoint 960.

**partners.html — 156KB:** the pre-port original of partner-management. Still linked from the legacy top-nav Partners tab (`VYVE_NAV_TOP` → `/partners.html`). Near-twin of pages/partner-management.html (same 29-var mint-era block, same 23 font sizes).

## 6. Mobile story today (the desktop-first gap, quantified)

- Shell: proper responsive work exists — ≤900px drawer + bottom tab bar (PM-764/765 M1/M2), `.m-scroll` table wrappers, ≤640px bottom-sheet modals across 7 modal families.
- Monoliths: each invented its own breakpoints; M3 (admin-console/partners/partner-portal responsive pass) was scoped in July and **never ran**. coach-portal collapses its sidebar ≤900 (wave 1) but the 10-tab client workspace and dense builders are desktop-density.
- 20 distinct breakpoints repo-wide (440→1100). No shared breakpoint tokens exist at all — `--content-max`/`--sidebar-w` are the only layout tokens.
- Insights pages hard-set `html{font-size:14px}` — a page-level global that changes the rem base for the whole shell while mounted.

## 7. What the Capacitor wrap inherits

The shell is already close to wrappable: single-page boot, hash routing, no server-side rendering, auth in-page. The blockers are (a) the four-architecture split — the monoliths are separate documents, so an app shell either iframes them, absorbs them, or links out; (b) magic-link auth is hostile in a native webview (mail-app round-trip) — password/biometric session needed; (c) 166KB seed-data + ~250KB orphans + 45KB CHANGELOG ride into every bundle unless the bake excludes them; (d) Watchtower Phase 2 native push lands free once wrapped (scheduled_pushes rail already carries admin subscriptions).
