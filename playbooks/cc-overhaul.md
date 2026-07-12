# Command Centre Overhaul — Campaign Spec

**Opened:** PM-752 (2026-07-12) · **Owner:** Dean (direction) + Claude (build) · **Status:** Phase 0 complete, Phase 1 next
**Goal:** One coherent command centre at admin.vyvehealth.co.uk where the entire business is run — every page on one design system (VYVE brand colours, dual light/dark), every number live from Supabase, nothing reading stale localStorage.

---

## Phase 0 audit findings (2026-07-12)

The CC is three products stapled together across 45 surfaces and **four design systems**:

1. **Shell SPA** (`index.html` + `pages/*` + `lib/*` + `assets/*`) — light cream `tokens.css`, hash router loading page partials into `#page-slot`.
2. **partners.html** (108KB monolith) — GitHub-dark `#0d1117` + off-brand mint `#5ec4b0`.
3. **partner-portal.html** (76KB monolith, EXTERNAL-facing) — VYVE dark-teal, dual light/dark tokens.
4. **admin-console.html** (131KB monolith) — VYVE dark-teal dual-theme, **still uses Playfair Display** (retired brand-wide PM-739, never swept here).

Other rot found: `index.html` loads **two supabase-js versions** (2.39.3 AND 2.45.0); `lib/auth.js` carries a loud "any signed-in user" fallback if `is_admin()` is missing (RPC exists since PM-402 — fallback should be removed, fail closed); `lib/make.js` still shipped (Make data stores retired for Dean's stack).

### Data-source classification (every surface)

**A. LIVE Supabase — keep, re-skin onto the new system:**
| Surface | Source |
|---|---|
| Analytics ×8 (app-health, usage, retention, activity-depth, wellbeing, platform, revenue, ai-usage) | `assets/*.js` → cron-fed `cc_*` caches (all fresh, 1-row pattern) |
| broadcast | `members`, `admin_broadcast_log`, `admin-broadcast-push` EF (PM-402) |
| active-users | `members`, `weekly_scores`, `member_activity_log` |
| calendar | `cc_calendar_events` (empty) + `calendar_occurrences` (live) |
| tasks / documents | `cc_tasks` + `cc_task_attachments` + `cc-task-docs-url` EF / `cc_documents` (PM-640–643) — **wired but 0 rows, zero adoption** |
| sessions | `service_catalogue` (skeleton) |
| settings | `admin_users` + adapter feature flags (mixed) |
| admin-console.html | live members admin |
| partners.html | live partner mgmt (known mocks: Attendances-by-week, engagement scorer) |
| partner-portal.html | live, partner-facing |

**B. Lewis localStorage-SPA era — data frozen at the 13 May 2026 Make snapshot (`seed-data.js`, 166KB) or typed into one browser's localStorage; write path tries retired `VYVE_MAKE` first:**
brief · dashboard · inbox · activity · trash · crm (vyve_deals) · clients · finance · invoicing · investor · competitors · intel · compliance · team · knowledge · strategy · action-plans · social-blueprint · podcast · content.
**All 17 business `cc_*` tables exist and are EMPTY** (cc_clients, cc_leads, cc_finance, cc_invoices, cc_investors, cc_grants, cc_intel, cc_knowledge, cc_posts, cc_episodes, cc_okrs, cc_decisions, cc_swot, cc_sessions, cc_tasks, cc_calendar_events, cc_documents). `cc-adapter.js` written, never enabled.

**C. Dead/unreachable:** pages/commercial · marketing · delivery · org (unlinked since PM-685) · intel-hub (2KB stub).

---

## Decisions locked (Dean, 12 Jul 2026)

1. **Design system:** ONE token set, VYVE brand colours (`#0D2B2B` / `#1B7878` / `#4DAAAA` / gold `#C9A84C`), **dual light/dark on every surface**, built from the partner-portal/admin-console dark-teal lineage. partners.html mint system retired. Playfair swept (DM Sans per PM-739). Mirrors the member-app dual-token discipline (§23 theme rule) but is its own CC token file — the CC is an ops tool, not the member app.
2. **IA: five domains** — Run the Business / Members / Partners / Employers / Analytics. Employers is new (PM-749/750 made it real; provisioning UI lands there).
3. **Lewis SPA layer:** rebuild a **curated** Run-the-Business set directly on the empty `cc_*` tables inside the new shell; kill the rest. **Nothing deleted until Lewis confirms the kill list** (below).

### Proposed disposition — Lewis to confirm KILL column

**REBUILD on `cc_*` (curated):** Morning Brief (live-data rollup, not seed), Sales Pipeline/CRM (`cc_leads`+`cc_clients`), Finance + Invoicing (`cc_finance`+`cc_invoices`), Investors & Grants (`cc_investors`+`cc_grants`), Content/Social (`cc_posts`, Metricool external link stays), Podcast (`cc_episodes`), Tasks (`cc_tasks` — exists, needs adoption push), Documents (`cc_documents`), Calendar (union view — exists).
**KILL (Lewis to confirm):** dashboard (Brief absorbs it), inbox, activity, trash, competitors, intel, compliance, team, knowledge, strategy, action-plans, social-blueprint, intel-hub, commercial/marketing/delivery/org. Rationale: brain + Lewis's 24 skills already do intel/competitor/strategy jobs; localStorage CRUD nobody uses is liability not capability.
**RETIRE lib layer at migration end:** seed-data.js, store.js, entities.js, make.js, data.js, drafts.js, comments.js, notifications.js, views.js, views-ui.js, acl.js, targets.js, integrations.js, cc-adapter.js. Keep: router (rebuilt), auth (hardened), supabase-client (single version).

---

## Phase plan

- **Phase 1 — Design system + shell mockup.** Static HTML mockup: tokens v2 (dual theme), nav shell (5 domains), component kit (stat tiles, cards, tables, modals, forms, chart frame, status pills, toasts). Dean approval gate, then Lewis look.
- **Phase 2 — Shell ship.** New `assets/tokens.css` v2 + shell + router hardening (single supabase-js, auth fail-closed, remove dead lib loads behind a flag). Analytics pages re-skinned first (pure re-skin, data untouched) to prove the system.
- **Phase 3 — Run the Business.** Curated rebuild on `cc_*` (Brief, CRM, Finance/Invoicing, Investors/Grants, Content, Podcast) + kill list executed post-Lewis-confirm + seed-data/lib retirement for migrated pages.
- **Phase 4 — Members.** admin-console.html broken into the shell (or re-skinned in place first if lower risk), broadcast + active-users re-skinned, Playfair swept.
- **Phase 5 — Partners.** partners.html re-skinned onto the system + the two known mocks made real (attendances-by-week, engagement scorer) or removed.
- **Phase 6 — Employers.** New domain: employer provisioning UI (employer-provision EF exists, PM-750), employer list, benchmark-figures editor (Lewis/Alan source data), links to employer-portal.
- **Phase 7 — Partner Portal (external).** partner-portal.html adopts the token set LAST — different audience, works today, lowest urgency.

Each phase = its own session(s), own PM, brain-committed. §23.23 collision check before every build session (parallel CC sessions are likely).

## Risks / gotchas carried in
- Broadcast + Analytics are Lewis's daily surfaces — re-skin must not change behaviour; ship behind visual review.
- partner-portal is used by real partners — no mid-week breaking changes; Phase 7 only.
- admin-console 131KB monolith: prefer strangler (re-skin in place, extract views incrementally) over big-bang rewrite.
- cc_tasks/team-app zero adoption: rebuild is also a re-launch — Lewis/team onboarding needed or it stays empty.
- auth.js fail-open fallback must die in Phase 2.
