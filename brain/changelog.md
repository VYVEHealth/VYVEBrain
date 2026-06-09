## PM-564 — Security Tier 0 + Tier 1: EXECUTE grants locked down (2026-06-09)

### What changed
Two Supabase migrations applied. No vyve-site code changes. No member impact.

**Tier 0 — 17 service-only functions: PUBLIC + anon + authenticated all revoked. `postgres` + `service_role` only.**
- `convert_member_to_paid` (CRITICAL — was callable by anyone unauthenticated)
- `gdpr_erasure_purge` (CRITICAL — same)
- `resolve_broadcast_audience`, `member_home_state_get_fresh`, `mark_member_lapsed` (HIGH)
- `expire_lapsed_trials`, `bump_charity_total`, `charity_total_reconcile`
- `get_certificate_buckets`, `get_certificate_buckets_for`, `get_charity_total`, `get_leaderboard`
- `apply_trial_campaign`, `grant_trial_on_signup`
- `drain_member_home_state_dirty`, `recompute_step_baselines`, `gdpr_erasure_pick_due`

**Tier 1 — 4 client-called functions: PUBLIC + anon revoked. `authenticated` + `service_role` retained.**
- `is_admin()` — Command Centre admin gating
- `refresh_member_home_state(text)` — connect.html + home-state-local.js
- `queue_health_write_back()` — healthbridge.js
- `compute_engagement_components_v2(text)` — home-state-local.js

### Verification
- Static call-path audit (remediation plan 2026-06-08): no vyve-site or vyve-command-centre client calls the Tier 0 set.
- `platform_alerts`: zero permission-denied hits on all target functions.
- `pg_stat_user_functions`: `track_functions=none` on Supabase Pro — call counters unavailable; static audit + alerts were the evidence layers.
- Post-migration ACL spot-check: all 21 functions confirmed correct. Zero `permission denied` / `42501` alerts in 10-minute observation window.

### MGMT_PAT status
`MGMT_PAT` not present in Vault (expired 6 Jun, not rotated). `backup-edge-functions.yml` GitHub Actions workflow silently broken. Dean to rotate: new Supabase Management API token → update Vault secret + GitHub Actions repo secret on VYVEBrain.

### Remaining security work (Tier 2 — next session)
- Self-scope the 4 client-callable functions (authenticated IDOR residual).
- Pin `search_path = public, pg_temp` on ~40 flagged functions.
- Recreate `exercise_canonical_set` view as invoker security.
- Tighten `running_plan_cache` / `ai_decisions` RLS policies.
- Restrict bucket listing on `certificates` + `member-avatars`.
- Branch-test all Tier 2 changes before prod.

### §23 rule
- **§23.104 (NEW):** Every `SECURITY DEFINER` function must `REVOKE EXECUTE FROM PUBLIC, anon, authenticated` unless deliberately member-callable. Member-callable ones must self-scope with service_role bypass.

## Employer Dashboard — projection toggle + colour preview shipped; parallel build reverted (2026-06-08)

### What shipped
- `Test-Site-Finalv3/vyve-dashboard-live-preview.html` (commit `3b2aa9e0`) — standalone preview of the employer dashboard. Adds a **Live / Projection** view toggle: Projection scales the live `employer-dashboard` EF response client-side to an adjustable headcount (default 10,000), holding rates (engagementRate, avgPerMember) constant while counts scale; amber "Illustrative projection — not real members" badge. Plus a light KPI colour lift (persistent gradient accents + amber/purple/pink variants on previously-plain cards). **Live `vyve-dashboard-live.html` left untouched.**

### Canonical employer system (confirmed — repo overrides memory)
- Data engine: deployed EF `employer-dashboard` (v41; source header says v20) — reads `members.company`, auth via `EMPLOYER_DASHBOARD_API_KEY` (x-api-key header / api_key param), CORS locked to https://www.vyvehealth.co.uk, in-memory rate limit 100/hr. Returns members{total,active,quiet,inactive,engagementRate} / activities / sessions{byCategory} / charity / trend. No wellbeing scores in this payload.
- Front-end: `Test-Site-Finalv3/vyve-dashboard-live.html` (live employer dashboard, www), plus `dashboard.html`, `employers.html`, `roi-calculator.html`.
- Company linkage is the `members.company` column (Sage, BT, Individual currently tagged) — NOT the `employer_members` table.

### Reverted / cleaned up (a parallel build was created before the canonical system was found)
- Dropped SQL RPC `public.employer_dashboard(text,int)`.
- Emptied `employer_members` (a 34-row "Northwind Group" demo seed was removed; table back to original empty state).
- Reverted the Employer Dashboard section out of `vyve-site/internal-dashboard/index.html` — vyve-site commit `ba12a486`, back to original 56,241 bytes.

### Open decisions
- Promote preview → live `vyve-dashboard-live.html`? (one commit when approved.)
- Should the projection toggle live on the real client-facing dashboard (real clients would see it) or only a separate demo page? Currently leaning: separate demo.

### Reference (for ROI if wired later)
- CIPD/Simplyhealth Health & Wellbeing at Work 2025: 9.4 sickness-absence days/employee/yr. Deloitte Mental Health & Employers 2024: £51bn UK cost, ~£1,900/employee, £4.70 return per £1 invested. A dedicated `roi-calculator.html` already exists.

### §23 rule
- §23.103 (NEW): Before building ANY employer/dashboard feature, run an org-wide code search across VYVEHealth first. The `employer-dashboard` EF, the Test-Site-Finalv3 employer pages, and the `members.company` model all already existed. Repo state overrides chat/memory — recon the full org before building, not just the obvious repo.

## PM-559 final state — App Health dashboard fully working (2026-06-08)

### Final fixes this session
- `assets/app-health.js` extracted from inline script (router injectPage replaceChild error)
- `lib/router.js` patched: skip `s.text` for external scripts; never cache app-health slug
- Missing comma in SYSTEM_CHECKS array fixed
- Admin RLS policies added: `platform_metrics_daily` + `certificates`
- System health panel: removed sync-health-data + log-perf (permanent red noise)
- 4 checks live: cc-app-health (green), daily-report (green), re-engagement (amber), certificate-checker (amber)
- Usage pagination 10/page working (1-10 of 61 pages)
- First-seen + last-seen on all error rows
- Drill-down modal + bulk resolve settled working
- Dead pages accurate, load times from perf_telemetry

### §23 rules
- §23.101 (NEW): CC router injectPage re-executes scripts via replaceChild — inline JS with template literals breaks. Always use external src JS files for CC pages with complex JS.
- §23.102 (NEW): After removing array items in JS, always run `node --check` before committing.

## PM-559 session close — App Health dashboard v1 shipped (2026-06-08)

### What shipped
- `cc_app_health` migration — single-row cache, RLS admin-read + service-role-write. pg_cron hourly.
- `cc-app-health` EF v4 — PostHog usage (100-page limit, slash-normalised dead pages), perf_telemetry LCP, platform_metrics_daily headlines. POSTHOG_API_KEY now in vault.
- `pages/app-health.html` in vyve-command-centre — live errors ranked by blast radius, at-a-glance strip, page usage, dead pages, load times, drill-down modal on every error row, bulk resolve settled, text alerts placeholder.
- `assets/sidebar-config.js` — app-health slug in Delivery section.
- CC commits: `7ab3e7af`, `7ba10f40`, `49b90b5`, `bf8c312b`, `49b90b5d`.

### Key state
- Page fully working: 0 active errors, 14 active members 7d, page usage + dead pages accurate, load times from perf_telemetry.
- POSTHOG_API_KEY in Supabase vault (added this session).
- 158 unresolved alerts — bulk resolve button on settled section when ready to triage.
- perf.js stopped collecting after 13 May — load times data is stale. Fix perf.js in a future session.
- App Health in Delivery nav — working via router slug.

### §23 rules
- §23.99 (NEW): POSTHOG_API_KEY must be in Supabase vault for cc-app-health EF to populate usage/perf. Key: query:read scope only.
- §23.100 (NEW): cc-app-health EF can only be triggered from Composio workbench (urllib), not bash_tool curl — sandbox blocks *.supabase.co per §23.86.

## PM-559 — Command Centre App Health: PostHog API wired + dashboard spec (2026-06-08)

Talk-first / spec-only session (Dean: Sonnet builds, Claude specs). No vyve-site or member-app code shipped.

### What happened
- Reviewed Lewis's existing Command Centre (`vyve-command-centre` repo): mature ~45-page SPA with real lib layer (router/ACL/comments/audit), BUT runs almost entirely on **localStorage**. `cc-adapter.js` (localStorage<->`cc_*`) exists but is FLAGGED OFF.
- Verified live: **all 19 `cc_*` tables are EMPTY (0 rows)**, incl `cc_tasks`. Seed data is in `assets/seed-data.js`; any real data Lewis entered lives only in his browser localStorage. No DB data to migrate/protect.
- Decision: do NOT rebuild the shell. Keep the bones, move data layer off localStorage onto Supabase + Storage, lead with App Health (its data already exists -> immediate value, vs Tasks which needs adoption first).

### PostHog connection — WIRED & VERIFIED
- Confirmed PostHog is live and receiving: 22,187 events / 25 people last 7d. `analytics.js` (PM-408) working.
- **Corrected a brain assumption:** `perf_telemetry` Supabase table looked dead (last row 13 May) — NOT lost; perf rerouted into PostHog as `perf_*` events at PM-408. Load times live in PostHog now.
- Dean created a PostHog Personal API key (Query:Read), stored as Edge Function secret **`POSTHOG_API_KEY`** (EF secrets, the correct home; `Deno.env.get`).
- Query API confirmed: `POST https://eu.posthog.com/api/projects/138491/query/`, Bearer key, HogQLQuery body. Project `138491`, EU.
- Real event names captured: `portal_page_viewed` (use for usage, not `$pageview`), `perf_first_paint`/`perf_navigation_timings`/`perf_auth_ready`/`perf_cross_nav` (load times), `dexie_open_failed` (the §23.83 IDB bug also in PostHog). Page property `properties.page` = clean `/x.html` paths.

### `platform_alerts` reality
- 2,846 rows, **`resolved=false` on every one** — written but never triaged. Triaged/resolvable view = genuine value PostHog can't give.
- ~1,970 `info` (noise), 481 `high`, 395 `critical`. `network_error_*` criticals STOPPED ~16 May (fixed-but-uncleared); `js_error`/`promise_rejection` STILL firing today. -> spec ranks by member-impact + live-vs-settled, not severity label.

### Deliverable
- Build-ready spec: App Health dashboard (errors-first ranked by members-hit-now; usage; dead pages; load times; VYVE light+dark; reviewer-only via `is_admin()`; SMS placeholder). At `/mnt/user-data/outputs/app-health-build-spec.md` (not in repo). Handed to Sonnet build session.
- SMS/text alerts parked — needs Twilio; spec leaves a labelled placeholder.

### Cleanup owed
- Throwaway EF `posthog-test` left ACTIVE-but-retired in Supabase (used to verify the connection). Delete via dashboard.

## PM-558 — GITHUB_PAT_CLAUDE rotated in Supabase Vault (2026-06-07)

- Old `vyve-cto-claude` PAT (expiring 20 Jun 2026) replaced with new token.
- Vault updated via `vault.update_secret()`. Edge Function secrets GITHUB_PAT + GITHUB_PAT_BRAIN also updated by Dean.
- New PAT verified working against VYVEBrain repo.

## PM-557 session close — bundled iOS 1.5 + Android 1.0.6 submitted; portal removals (2026-06-07)

### Portal (vyve-site)
- **PM-555** `9dc40fb0` vbb 442 — nutrition.html: food log coming-soon removed. connect.html: this week's challenge section removed.
- **PM-556** `a2c8501d` vbb 443 — session-live.css: `.sl-pill-live` + `.sl-cta-primary.sl-cta-live` switched red→green (#22c55e).

### Native apps
- **iOS 1.5 Build 1** — bundled mode (server.url removed from capacitor.config.json). Fresh vyve-site clone into www via PAT. Archived + exported via xcodebuild CLI. Uploaded via Xcode Organizer. In review.
- **Android 1.0.6 versionCode 51** — fresh vyve-site clone into www. Built via `./gradlew bundleRelease` with Java 21 (temurin@21). AAB at `android/app/build/outputs/bundle/release/app-release.aab`. Submitted to Play Console. Quick checks running → Send for review pending.

### Key state
- All members still on server.url live web shell until 1.5 approved + installed by members
- Capawesome: app `f9961f66`, prod channel `89e12796` — ready for first OTA
- www folder workflow: `git clone --depth 1 https://VYVEHealth:<PAT>@github.com/VYVEHealth/vyve-site.git www` before every bundle build
- Java 21 (temurin@21) required for Android CLI builds; `export JAVA_HOME=$(/usr/libexec/java_home -v 21)` before gradlew
- App Store Connect API key setup pending next session (saves Organizer step forever)
- GITHUB_PAT_CLAUDE expires 20 June 2026 — rotate urgently

### §23 rules
- §23.94 (NEW): Every Android CLI bundle build requires `export JAVA_HOME=$(/usr/libexec/java_home -v 21)` before `./gradlew bundleRelease`. Java 21 = temurin@21 installed via brew. Java 17/26 both fail.
- §23.95 (NEW): www folder is NOT auto-synced from GitHub. Before every bundle build: `rm -rf www && git clone --depth 1 https://VYVEHealth:<GITHUB_PAT_CLAUDE>@github.com/VYVEHealth/vyve-site.git www` (PAT from Supabase Vault). Never assume www is current.

## PM-554 session close — PF-23 v1 stabilised + per-page tours shipped (2026-06-07)

### Final state
- **firstrun.js** reverted to last working version (e2be18d4) + VYVE logo on slides only. No other changes.
- **Per-page independent tours** live on index, mind, exercise, connect, wellbeing-checkin, monthly-checkin.
- **achievements.js** — toasts suppressed during home tour; retry 3s after `vyve_seen_home` set.
- **settings.html** — Reset tour clears all 8 localStorage keys + writes `tour_completed_at: null` to server + Dexie + navigates to index.html.
- **10s auto-release safety timer** on `lockBody()` — page can never be permanently frozen.
- **No early lock scripts** — all removed. Body lock is JS-only inside firstrun.js.

### Gates (simple)
- `vyve_firstrun_done` — full tour done, nothing ever shows again
- `vyve_firstrun_slides_done` — intro slides seen
- `vyve_seen_home/mind/body/connect/checkin/monthly` — per-page tour seen

### vyve-site HEAD: commit `a48a417b`, vbb 439

### §23 rules
- §23.97: Achievement toasts must not fire while `vyve_seen_home` is unset. `showNext()` is the single chokepoint.
- §23.98: firstrun.js lockBody() must always have a 10s auto-release timer. Never lock without it.

## PM-554 stabilisation — first-run tour fixed to 4-step home-only (2026-06-07)

Multiple fix commits (fix2–fix8) through session. Root causes resolved:
- **fix5:** `_started` guard + single `vyveAuthReady` trigger prevented double-init race between 1500ms setTimeout and auth event.
- **fix6:** sessions.html was retired (PM-555 redirect) — tour destination corrected to connect-calendar.html.
- **fix8 (final):** Eliminated all cross-page hops entirely. Tour is now 4 steps, all on index.html — mood, focus, habits, rings. No resume cursor, no page navigation, no race conditions. Completes reliably and sets `vyve_firstrun_done` on Done.

**Final state:** intro slides (4) + home spotlight (4 steps). Copy is DRAFT in `COPY` object top of firstrun.js — Lewis edits in place.
**vyve-site commit `a47b5f84`, vbb 431, cache `vyve-cache-v2026-06-07-pm554-fr-homeonly`.**

## PM-554 — PF-23 v1 first-run experience shipped (2026-06-07)

### What shipped
- **`firstrun.js`** — full first-run engine: 4 swipeable intro slides (Part 1) + 7-step in-context spotlight tour (Part 2). Gate: `localStorage.vyve_firstrun_done` short-circuit → Dexie members row `tour_completed_at` check (~800ms cold-boot wait) → run. Resume cursor (`vyve_tour_active` + `vyve_tour_step`) persists across the two page hops (index→mind, mind→sessions). Dismissal (skip or done): sets `vyve_firstrun_done=1`, clears cursor, fires un-awaited `members.update({tour_completed_at})` via member-scoped RLS (§23.31). All copy in a single `COPY` object at top of file — Lewis edits that, never the logic.
- **`firstrun.css`** — scrim + box-shadow cutout overlay + tooltip card + slide dot strip + safe-area insets (§23.58) + web-tells suppression (§23.59). z-index 10000–10002 (above nav 9000).
- **`index.html`, `mind.html`, `sessions.html`** — load `firstrun.css` + `firstrun.js`. Haptics.js confirmed present on all three (§23.44). mind/sessions inert unless tour active.
- **`settings.html`** — vbb-marker bumped to 424.
- **`sw.js`** — CACHE_NAME `vyve-cache-v2026-06-07-pm554-firstrun`; `firstrun.js` + `firstrun.css` added to precache (§23.76).
- **`member-dashboard` EF v78** — adds `tour_completed_at` to member snapshot payload (column already in `members` table via migration this session).
- **DB migration** — `ALTER TABLE members ADD COLUMN IF NOT EXISTS tour_completed_at TIMESTAMPTZ` applied and verified.

### Commit
vyve-site `a5a4cadc` · vbb 424

### Key decisions
- Explanatory v1 only (no per-step achievements, decoupled from Achievements overhaul). Action-tutorial is a later iteration.
- Multi-page in-context spotlight: home→mind→sessions. Viable because snapshot-first paint renders hops <200ms.
- Dismissal writes `tour_completed_at` server-side (reinstall-safe, cross-device) via member-scoped RLS — no EF needed.
- Anchor-ready guard: rAF poll ~1.5s, timeout→container fallback — never spotlights an empty skeleton (§23.36/§23.47).
- `vyve:auth:ready` event also triggers init as an earlier path alongside the 1.5s DOMContentLoaded delay.

### §23 rules confirmed
§23.31 optimistic-first dismissal write · §23.36/§23.47 anchor-ready guard · §23.44 haptics.js dependency · §23.58 safe-area · §23.59 web-tells suppression · §23.76 precache new files · §23.72 vbb-marker both pages.
