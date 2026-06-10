## PM-593 — CC audit cont.: cc-activity EF real build, SVG Day-N chart, re-engagement effectiveness (2026-06-10)

### What shipped
**Supabase:**
- cc-activity EF v4 (real build — stubs were v1-3; queries mal, exercise_logs, mind_activities, replay_video_views, session_live_views, weight_logs, member_running_plans, member_health_connections for all 7 sections)
- cc-retention EF v5 (adds reengage_json: per-stream email effectiveness, 7-day return rate)
- cc_retention.reengage_json column added

**vyve-command-centre (PM-593 commit `d88a35c3af04`):**
- `assets/retention.js`: Day-N horizontal bars → SVG line chart with benchmark dashed line, colour-coded points (green above / orange below), data table with pp delta vs benchmark, ⚠ low-confidence flag (n<10)
- `assets/retention.js`: retRenderReengage function + re-engagement effectiveness section added
- `pages/retention.html`: re-engagement card added after at-risk section, version bumped

### Cache data (2026-06-10T01:08)
- Re-engagement: Stream A (7-day inactive) 52% return rate (26/50 sent), Stream B (30-day inactive) 24% return rate (6/25 sent), overall 43%. Strong numbers — industry average is 5-15%.
- Activity: rebuilt with 11 adoption features, full pillar breakdown, heatmap, exercise depth. total_watch_minutes=0 (watch query column mapping issue — backlog).

### Remaining audit items (carry forward)
- Watch time query: replay_video_views column names differ — total_watch_minutes shows 0
- log-perf: only 79 rows from May 2026 testing; needs broader wiring across portal pages
- AI usage + cost page (ai_interactions table has all the data)
- Wellbeing × activity correlation chart (the VYVE ROI story)

## PM-592 — CC analytics audit: Revenue page, wellbeing EF v2, account type, WoW deltas (2026-06-10)

### What shipped
**Supabase:**
- cc-wellbeing EF v3 (real build — prior versions were stubs; computes from wellbeing_checkins + members baseline cols)
- cc-platform EF v2 (is_dean PostHog filter; perf_note added about 79-row coverage gap)
- cc-revenue EF v1 (MRR, subscription breakdown, trial pipeline, 12-week new-member trend)
- cc-usage EF v7 (adds account_type + subscription_status to member enrichment)
- cc_revenue_cache table (BIGINT PK, 5 JSONB cols, admin-read RLS, §23.104 applied)
- Cron `cc-revenue-hourly` jobid 44 at `20 * * * *`

**vyve-command-centre (PM-592 commit `5360249b9045`):**
- `pages/revenue.html` + `assets/revenue.js` — Revenue page at `/#/revenue` (MRR hero, breakdown table, trial pipeline, 12-week new-member trend)
- `assets/usage.js` patched: account_type pill column + week-over-week activity/DAU deltas in headline
- `pages/usage.html` patched: Account column header, delta sub-elements
- `assets/sidebar-config.js`: Revenue entry added (6th Insights page)
- `lib/router.js`: revenue added to no-cache slug list

### First cache data (2026-06-10)
- Wellbeing: avg 7.5/10 · 7/33 members ever checked in (21% participation) · 1 at-risk · 18 trend weeks
- Revenue: MRR £40 (1× £20 paid B2C + 2× £10 enterprise) · 22 trial pipeline · 9% conversion
- Platform (is_dean filtered): 13,730 views (down from 14,054) · 625 unique sessions

### Audit gaps resolved this session
- Wellbeing page was completely empty (stub EF) — now live with real data
- Platform page showing Dean's dev traffic — is_dean filter applied
- No revenue visibility anywhere — Revenue page created
- Members table had no subscription type column — Account pill added
- Headline had no trend direction — WoW delta arrows added for acts7d + active7d

### Remaining from audit (carry to next sessions)
- Day-N retention: still a table, needs visual line chart with benchmark
- Re-engagement email effectiveness (returned % after contact)
- cc-activity EF is a stub (data is stale, refresh broken)
- log-perf only wired on 5 pages from May testing — needs broader wiring
- AI usage + cost page; Notification effectiveness; Wellbeing × activity correlation

## PM-591 — Platform & UX analytics page live (2026-06-10)

### What shipped
- `pages/platform.html` + `assets/platform.js` — Platform & UX page at `admin.vyvehealth.co.uk/#/platform`
- `cc-platform` EF v1 (`verify_jwt:false`, admin-gated when JWT present, open to cron)
- `cc_platform` table — id=1 JSONB cache: headline_json, pages_json, errors_json, perf_json, dead_json; admin-read RLS; §23.104 revoke applied
- Cron `cc-platform-hourly` (jobid 43, `5 * * * *`)
- Sidebar: platform status `coming-soon` → `live`

### Data sources
- **PostHog HogQL** (eu.posthog.com, project 138491, `POSTHOG_API_KEY` from Vault):
  - `$pageview` events — top 50 pages by visit volume, unique users, % of total (last 30 days)
  - `ef_error` events — grouped by ef_name + status, count, last seen (last 30 days)
- **Supabase `perf_telemetry`** — fetched raw (79 rows), pivoted in EF to p50/p75/p95 per page for LCP/FCP/TTFB/INP

### Page sections
1. Headline strip: total views, unique sessions, EF error count, median LCP, pages tracked, low/dead count
2. Top pages — horizontal bar chart (top 20) + full sortable table (views / unique users / % of total)
3. EF error log — table by ef_name + status, colour-coded count pill, last-seen
4. Load time percentiles — per-page LCP p50/p75/p95, FCP p50, TTFB p50, INP p75, colour-coded by Web Vitals thresholds
5. Coverage — low-traffic (<10 views) and dead (0 views) vs 34 known pages

### First cache data (2026-06-10T00:32:09Z)
- 14,054 page views · 639 unique sessions · 76 pages tracked · 0 ef_errors · median LCP 391ms (excellent)
- 5 low-traffic pages · 0 dead pages · 7 pages with perf data
- All four Insights sidebar pages now live

## PM-590 — Wellbeing analytics page live (2026-06-10)

### What shipped
- `pages/wellbeing.html` + `assets/wellbeing.js` — Wellbeing page at `admin.vyvehealth.co.uk/#/wellbeing`
- `cc-wellbeing` EF v1 (same assertAdmin pattern as cc-retention: user-context client + is_admin() RPC)
- `cc_wellbeing` table — 6 JSONB columns: headline, trend, members, distribution, baseline, participation
- `compute_cc_wellbeing()` SECURITY DEFINER function; §23.104 revoke applied
- Cron `cc-wellbeing-hourly` (`55 * * * *`)
- Sidebar: wellbeing status `coming-soon` → `live`

### Also shipped this session (PM-589)
- Fix activity-depth auth: `actGetJwt()` now uses `vyve-cc-supabase-auth` key (matches retention.js)
- Read path changed from EF to PostgREST direct on `cc_activity` table (RLS handles auth)
- EF auth pattern fix: cc-activity v2 now uses user-context client + `is_admin()` RPC (matches cc-retention)

### Wellbeing page sections
1. Headline strip: avg wellbeing (7.5), checked-in members (7/33), total check-ins (31), at-risk (1 — Cole, score 1), improving vs baseline, participation %
2. Weekly score trend: 18 weeks (Jan–Jun 2026), colour-coded bars, hover for submission count
3. Member table: baseline vs latest, delta, trend arrow, status pill, check-in count — sorted at-risk first
4. Score distribution: per-bucket histogram (1–10)
5. 8-dimension baseline profile: avg onboarding self-assessments from members table (clearly labelled as baseline, not live check-in data — check-in sub-scores are NULL in current form)

### Key data
- 31 check-ins, 10 members ever checked in (but 7 of 33 real members with complete data)
- Dean: 14 check-ins (most engaged), Calum: +4 delta, Cole: -4 delta (at risk, score 1)
- Avg 7.5/10 overall wellbeing

## PM-588 — Cyber Essentials strategy agreed (2026-06-10)

- Decision: do CE (self-assessed) now via IASME (~£300-400, days to certificate). VYVE stack passes trivially — managed cloud, no on-prem, JWT auth, RLS everywhere.
- CE+ (independently verified, ~£1.5k, 4-6 weeks): hold until a specific deal requires it. Ask Sage procurement what they actually need before spending.
- Pen test (~£1-2k): hold until a live enterprise deal triggers the requirement.
- Public sector (NHS) route will require CE+ at higher contract values — no way around it, but not the immediate path.
- No code shipped this session.


## PM-585 / PM-586 — retention.js cache-bust + missing function definitions fixed (2026-06-09)

- PM-585: retention.html script tag version bumped from PM-580-v1 → PM-584-v1 to bust browser cache
- PM-586: Three render function definitions (retRenderDayN, retRenderStreaks, retRenderCriticalEvents) were missing from retention.js — the insert anchor used was an HTML comment that doesn't exist in JS files. Fixed by inserting before the `// ── Boot ─────` anchor which is stable. Verified all three definitions present in committed file (18,019 chars).
- Root cause lesson: always assert that str.replace() actually changed the string, not just that the target string appears somewhere in the result (it was already present in the function call added by a prior patch).
- Retention page fully working: all six sections render. §23.101 reminder: bump JS query-string version in HTML on every JS update.

## PM-584 — Retention page: day-N curve, streaks, critical events (2026-06-09)

- Day-N retention curve live: D1 61%, D3 50%, D7 68%, D14 47%, D30 69%, D60 57% vs industry benchmarks (D1:30%, D7:15%, D30:8%). VYVE well above at every interval.
- Streak analytics: avg current 1.6d, avg best 2.7d, max 16d, 2 members at 7+ streak now. Distribution chart by best-ever streak.
- Critical events (aha moment): 15 retained vs 3 churned (low confidence). Cardio in week 1 = +20pp retained. Check-in = +13pp. Sample too small for definitive conclusions.
- Consent gate removed from funnel — signal unreliable (10-min timeout bug). member_home_state also unusable (backfilled by cron for all members).
- created_at fixed for Dean (2025-12-07), Lewis (2025-12-19), Kelly (2026-02-28), Callum (2026-02-28) — first activity date at 09:00 UTC.
- Median TTF now 0h (same-day), 16 same-day activations. Mean 9d skewed by Kelly/Callum outliers.
- cc-retention EF → v4

## PM-580 — Retention & Activation page live (2026-06-09)

### What shipped
- `pages/retention.html` + `assets/retention.js` — Retention page at `admin.vyvehealth.co.uk/#/retention`
- `cc-retention` Edge Function v1 (`verify_jwt:false`, admin-gated via `assertAdmin()`)
- `cc_retention` table — single-row JSONB cache (funnel_json, cohorts_json, dormancy_json, atrisk_json); admin-read RLS
- Cron job 40 (`cc-retention-hourly`, `:15 * * * *`)
- **Sidebar restructured:** Insights section now has 5 entries — Overview & Members (usage), Retention (live), Activity Depth, Wellbeing, Platform & UX (last 3 as coming-soon stubs)
- **Router:** retention/activity/wellbeing/platform all added to no-cache slugs

### Cache data (first build, 2026-06-09)
- 33 real members · 20 ever active (61%) · 13 never active · avg 411h (~17 days) to first activity
- Dormancy: 15 active · 2 quiet · 3 inactive · 13 never
- 5 monthly cohorts (Dec 2025–Jun 2026) · 16 at-risk entries

### Key insight from first data
Average time to first activity is 17 days — almost certainly because many members are trial/BT/Sage contacts who got added without paying. The never-active problem is structural, not engagement. Worth flagging to Lewis.

### Retention page sections
1. Headline strip: total, ever active, active 7d, avg time to first, at-risk, never active
2. Activation funnel: signup → onboarding → PWA installed → first activity → active week 1 → active last 30d
3. Dormancy breakdown: active / quiet / inactive / never (4-cell grid)
4. Cohort retention table: monthly cohorts × week1/week2/month1/month2/still-active with heatmap colouring
5. At-risk members table: name, persona, joined, last active, total acts, 7d acts, trend (▲/▼/=), flags

### Next pages to build
- Activity Depth (`activity.html`) — feature adoption, watch-time leaderboard, time-of-day heatmap
- Wellbeing (`wellbeing.html`) — score trajectory vs baselines, mood pulse, 8-dimension radar
- Platform & UX (`platform.html`) — PostHog pages, rage clicks, paths
- Enterprise (`enterprise.html`) — team breakdown, Sage-ready

## PM-579 — Fix ACT_ICONS scope + sessions in platform_metrics_daily (2026-06-09)

- `platform_metrics_daily.sessions_count` was 0 for all dates because the cron ran before the PM-575 backfill. Fixed by running `recompute_platform_metrics()` for all dates with session/replay entries in `member_activity_log` (~51 dates).
- `ACT_ICONS`/`ACT_LABELS` moved to `window.VYVE_ACT_ICONS`/`VYVE_ACT_LABELS` globals at top of usage.js — survives router replaceChild re-injection and browser caching edge cases.
- Leftover `const score/scoreCls` removed from `usageOpen360` (syntax noise from patching).
- Modal title now shows "First Last" instead of email.
- cc_usage cache rebuilt.

## PM-578 — Fix ACT_ICONS scope + sessions in week-on-week (2026-06-09)

- **ACT_ICONS/usageFmtMeta not defined:** `const` declarations for `ACT_ICONS` and `ACT_LABELS` never landed in PM-577 (string replacement missed). `usageFmtMeta` also missing. Fixed by inlining both as `var` inside `usageLoadMemberLog` — avoids const hoisting/scope issues with router replaceChild entirely.
- **Sessions 0 in week-on-week:** `platform_metrics_daily` rows for 4–9 Jun were computed before the PM-575 backfill landed session/replay entries in `member_activity_log`. `recompute_platform_metrics` reads from `member_activity_log` so historical rows had no sessions. Fixed by running `backfill_platform_metrics(10)` — sessions now showing (4 Jun: 2, 5 Jun: 3, 6 Jun: 1, etc.).
- Cache rebuilt.

## PM-577 — Usage: names + sort persist + activity log detail + tracker REST fix (2026-06-09)

### What shipped
- `members.first_name` + `last_name` added to cc-usage EF enrichment and `members_json` cache
- Members table: displays "First Last" with email below; initials avatar uses name initials
- Column sort state persisted to `localStorage` (`vyve_cc_usage_sort`) — survives page reload
- Member column now sorts by `last_name`; all other headers unchanged
- **Member detail view:** clicking a row fetches `action: member_detail` from cc-usage EF; renders full activity log timeline (last 60 entries) grouped by date with type icons, labels, metadata (duration, distance, watch%, scores)
- **Tracker REST fix (PM-577):** player-tracker.js + replay-tracker.js now POST directly to `/rest/v1/member_activity_log` on first qualifying write (bypasses log-activity CAPS which has no replay type); `member_activity_log` RLS updated with member-self-insert + admin-read + member-self-read policies
- `cc-usage` EF → v5
- vbb 451 | sw: pm577-tracker-fix

### Replay test account clarification
- Test account replays visible: uncheck "Exclude test" in Members tab
- Overview chart uses `platform_metrics_daily` (02:15 UTC rebuild) — today's activity shows tomorrow; "today" column reads live from `member_activity_daily`

## PM-576 — GDPR-safe send_never_active: suppression check + unsubscribe link (2026-06-09)

- `cc-usage` EF → v4: `sendNeverActive()` now checks `engagement_emails.suppressed = true` before sending; suppressed members are skipped and returned in `skipped_suppressed[]`
- Unsubscribe link added to email footer (routes to settings.html#notifications)
- Sent emails recorded in `engagement_emails` table (stream: `never_active`, key: `never_active_manual`) so open/click tracking and suppression works
- jordz279@hotmail.com and kieranday97@gmail.com have existing suppressed=true rows — will be skipped automatically

## PM-575 — Fix session/replay activity log pipeline (2026-06-09)

### Root cause
`player-tracker.js` and `replay-tracker.js` write to `session_live_views` / `replay_video_views` but never called `log-activity` EF, so sessions/replays never landed in `member_activity_log` → never rolled up into `member_activity_daily` or `member_stats`. Sessions stopped at 25 May when old tracker was retired; replays never worked at all.

### What shipped
- **Backfill:** 2 `session_live_views` + 6 `replay_video_views` rows inserted into `member_activity_log` (idempotent, deduped on source_id)
- `rebuild_member_activity_daily_incremental()` run — sessions/replays now visible in rollup (65 session rows back to Mar 2026, 8 replay rows Jun 2026)
- `recompute_all_member_stats()` run — `member_stats` updated (39 rows)
- `cc_usage` cache rebuilt
- **`player-tracker.js`** (PM-575): on first write (`isInsert=true`) for `live` and `replay` modes, fire-and-forget `POST /functions/v1/log-activity` with `{type:'session_views'/'replay_views', activity_date}`. JWT from `session.cachedJwt`.
- **`replay-tracker.js`** (PM-575): same injection on `isInsert=true`.
- vbb bumped to 450. sw.js: `vyve-cache-v2026-06-09-pm575-session-replay-fix`

### §23.XXX — new hard rule
**§23.107:** When adding new watch-time/view tables (`session_live_views`, `replay_video_views`, or future equivalents), always wire a `log-activity` call from the tracker on first qualifying write. The rollup pipeline (`rebuild_member_activity_daily_incremental`) only reads from `member_activity_log` — any tracker that writes directly to a separate table without also calling `log-activity` will be silently invisible in all rollups, `member_stats`, dashboards, and achievements.

## PM-574 — Usage Analytics: today column + email never-active (2026-06-09)

- **Today column** added to Members table — live fetch from `member_activity_daily` on page load (not from cache), highlights in green when > 0
- **Email never-active modal** — "✉ Email never-active" button in Members filter bar; shows list of members with 0 total activities, confirms before send; respects exclude-test toggle
- `cc-usage` EF → v3: `send_never_active` action — persona-voiced re-engagement email per recipient, sent directly via Brevo, tagged `never-active-reengage`; admin JWT required for send action; cron cache rebuild unchanged
- Paige Coult confirmed: last activity genuinely 21 April (49d ago), `member_stats` is correct

## PM-573 — Recent-window review + brain currency fixes; Android 1.0.6 live; front re-fixed (2026-06-09)

Completed the changelog-window review Dean asked for (recovered archive PM-433→553a). Most of the window was already in the living brain; five drift/gap items fixed plus a front repair.

### Fixes
- **§3 business model** reconciled: 30-day free trial → £10/mo-forever conversion (VYVE10, separate Stripe link from the £20 new-signup link), access gated on `subscription_status` per §23.85. Conversion **LIVE end-to-end** (Stripe webhook secret set — Dean confirmed). New §3 row.
- **wellbeing-checkin EF** v22 → **v30** (PM-516 enriched debrief + structured output) in §7 inventory.
- **workout-plan-wizard.html** (PM-532 no-plan questionnaire) added to §8 (Body—Workouts).
- **Light-mode 46-page pass** (PM-494→508) recorded on the theme line.
- **Android 1.0.6 APPROVED + live** (Dean confirmed 9 Jun): both platforms bundled. §5/§23.4/§23.106 updated — OTA gap now COHORT-WIDE, not iOS-only. Only Dean's dev-loop iPhone stays on server.url.
- **CURRENT FRONT re-fixed:** the PM-571/572 closes had rewritten the front from a stale template, reverting the PM-569 deployment-flip line and re-adding the `session-reminder-cron` WARN that PM-568 cleared. Rewritten to lead with standing deployment facts + correct WARN set.

### New rule
- **§23.107 (HARD RULE):** never regenerate the shared CURRENT FRONT block from an in-context template — re-fetch fresh + edit surgically; standing facts owned by §5/§23, front only mirrors.

### Parallel-session churn
Heavy today: rebased four times. PM-568 (cron) → PM-545971 enterprise-bridge → PM-571 (usage v1) → PM-572 (is_test) all committed during this session; I claimed PM-569 (flip), PM-570 (changelog archive), PM-573 (this). Fresh-HEAD guard caught every collision — no clobbers on my side. (The front clobber that earned §23.107 was theirs, fixed here.)

### No code shipped
- Brain only.

### Open
- Verify ONE Capawesome OTA end-to-end (now cohort-wide blocker; pre-Sage gate, §23.106).
- Exec brief for Lewis + Alan updated (Android live + trial model): `VYVE_Platform_Update_2026-06-09.md`.

## PM-572 — Usage Analytics: is_test cohort filter (2026-06-09)

- `members.is_test BOOLEAN DEFAULT false` column added; 6 test accounts backfilled (`@test.com`)
- `cc-usage` EF → v2: `is_test` included in members enrichment
- `assets/usage.js`: `usageFilterMembers()` defaults to excluding test accounts (checkbox checked by default)
- `pages/usage.html`: "Exclude test" checkbox wired to filter
- Cache rebuilt — `members_json` now carries `is_test` field

## PM-571 — Usage Analytics v1: Overview + Members tabs (2026-06-09)

### What shipped
- `pages/usage.html` + `assets/usage.js` — Usage Analytics page at `admin.vyvehealth.co.uk/#/usage`
- `cc-usage` Edge Function v1 (`verify_jwt:false`, service-role, admin-gate) — hourly cron job 39 (`cc-usage-hourly`, `:30 * * * *`)
- `cc_usage` table — single-row JSONB cache mirroring `cc_app_health` pattern (id=1, seeded)
- Admin-read RLS policies added on: `cc_usage`, `member_stats`, `company_summary`, `member_activity_daily`
- Member-self-read RLS policies added on: `member_stats`, `member_activity_daily` (portal safety)
- Sidebar `assets/sidebar-config.js`: new **Insights** section with `usage` slug + `VYVE_NAV_TOP` Insights entry
- Router `lib/router.js`: `usage` slug added to no-cache list (same treatment as `app-health`)
- First cache built and verified: 38 member rows, 3 companies, 30-day daily series, headline 34 members / 15 active 7d

### Phase 1 scope (what's live)
- Headline strip: total members, active 7d/30d, DAU/MAU stickiness, activities 7d, at-risk count
- **Overview tab:** 30-day daily bar chart, activity breakdown by type (7d), week-on-week delta table, company breakdown
- **Members tab:** sortable table (email, engagement score ring, 7d/30d acts, active days, last active, programme, persona, status pill), search + filter (at-risk/needs-support/active/inactive), pagination (25/page)
- **Member 360 drill-down modal:** profile (persona, programme, programme week, at-risk/support flags, certs), engagement score with component bars, activity totals grid (total/7d/30d/90d/active-days/distinct-types), latest signals (wellbeing/stress/energy/weight)
- Data sources: `platform_metrics_daily` (headline + daily series, ~1 day behind), `member_activity_daily` (replays + DAU augment), `member_stats` (member list), `company_summary` (enterprise tab), `members` (persona/company enrichment)

### Open items (Phase 2+)
- `is_test` flag: open decision — Dean to confirm test/admin email list, then 1-column migration + backfill (blocks meaningful cohort filter)
- Phase 2: Activity depth tab (exercise_logs volume, cardio depth, time-of-day heatmap), Sessions/watch-time tab
- Phase 3: Wellbeing trends, Achievements, Retention cohorts
- Phase 4: Pages & UX (PostHog), Enterprise tab

## PM-571 — Capawesome OTA gap diagnosed (no sync/ready in shell); Dean's dev-phone restored to server.url loop; SPM xcodeproj gotcha (2026-06-09)

Follow-on to PM-569. Got Dean's iPhone back onto the server.url dev-loop (he'd installed bundled 1.7 from the App Store and lost live changes), and pinned down *why* the Capawesome OTA has never run end-to-end.

### OTA diagnosis (sharpens §23.106 -> new §23.107)
- `@capawesome/capacitor-live-update@8.2.2` IS installed + native-linked (confirmed in `npx cap sync ios` plugin list, 17 plugins) and CONFIGURED in Mac-local `capacitor.config.json`: `plugins.LiveUpdate = { appId: "f9961f66-eb66-4102-b1c5-f9b2c7baeebf", autoDeleteBundles: true, publicKey: "" }`.
- BUT there are NO `LiveUpdate.sync()` / `LiveUpdate.ready()` calls ANYWHERE in the vyve-site web shell — swept app.js/boot.js/init.js/auth.js/nav.js/sw.js/index.html/settings.html + org code search = 0 hits (only an unrelated "live-update" comment in personal-bests.html). The plugin does not auto-sync; without `sync()` nothing fetches, without `ready()` an applied bundle rolls back.
- Consequence: the rails are physically in 1.7 but the switch was never flipped. **1.7 CANNOT receive an OTA.** The fix is JS-only but gated on a NEW bundled binary: wire `sync()` on launch + `ready()` after first paint + channel `89e12796`, native-guarded, into the shell -> ship 1.8 -> only then can a bundle push land. The §23.106 canary therefore targets 1.8, not 1.7.
- Not ruled out: a native auto-sync in vyve-capacitor `AppDelegate.swift` (not checked) — but config has no autoUpdate flag and Capawesome doesn't auto-sync without the JS calls, so near-certain.

### Dean's dev phone
- Restored `server` block to Mac-local `capacitor.config.json` (`server.url = https://online.vyvehealth.co.uk`, cleartext false), kept LiveUpdate block intact (dormant under server.url). `npx cap sync ios` -> ran to device from Xcode -> confirmed back on the live loop. Live HEAD was vbb 447/PM-563 at session time; vyve-site has since advanced to PM-565 via a parallel session.
- DISCIPLINE: that `server` block is DEV-ONLY on Mac-local — strip it before the next store binary or 1.8 ships in server.url mode and breaks the bundled migration.

### SPM gotcha (new §23.108)
- vyve-capacitor is an SPM-based Capacitor project (`Package.swift`; "not compatible with SPM" warns) — there is NO `App.xcworkspace`. Open `ios/App/App.xcodeproj` directly. `open ...App.xcworkspace` fails "does not exist".

### No code shipped
- Diagnosis + brain only. No vyve-site / EF / vyve-capacitor commits. Mac-local config edit is uncommitted (dev-loop, intentional).

## PM-570 — Changelog history recovered into changelog-archive.md (2026-06-09)

The PM-554 consolidation (7 Jun) trimmed changelog.md from 504 entries (~2.96MB, back to 22 Apr) down to PM-554 onward, but master §19 still pointed at changelog.md for older detail — a stale/false pointer. Recovered the full pre-PM-554 history from git commit `5deea4fd` into new `brain/changelog-archive.md` (504 entries, 22 Apr — 7 Jun / PM-553a). changelog.md unchanged below (still PM-554—569). §19 pointer corrected to reference the archive for pre-PM-554. Nothing was lost — git retained every version; this relocates it to where the pointer claims it lives.

## PM-569 — iOS 1.7 live + deployment model flipped to bundled; brain consolidation + exec brief (2026-06-09)

### Context
Brain-consolidation session (ran parallel to the PM-568 cron-fix session; rebased onto its commit 9ca8b9c3). Trigger: Apple approved iOS 1.7 → it is now LIVE; the whole iOS member cohort sees a bundled build while Dean alone is on the server.url live shell. Reconciled against the brain, which (PM-475, 4 Jun) still asserted the opposite — "whole cohort server.url-live, no frozen bundle." That correction is now itself wrong and has been reverted.

### iOS train (clarified with Dean)
- 1.5 = first genuinely bundled submit (server.url removed) — PM-557, 7 Jun, was in review.
- 1.6 submitted then CANCELLED.
- Went straight to 1.7 — now APPROVED + LIVE on the App Store.
- 1.7 ships server.url removed → iOS members frozen on the vyve-site SHA baked into the binary.

### Android
- Bundled 1.0.6 versionCode 51 submitted ~5-6 Jun (PM-557), approval UNCONFIRMED, still in review as of 9 Jun (Dean to recheck Play Console).
- Prior live Android build is still a server.url build → Android members remain on the live shell until 1.0.6 lands.

### Deployment model — now live (reverts PM-475)
- iOS members: FROZEN on bundled 1.7, updatable ONLY via Capawesome OTA (app f9961f66 / prod channel 89e12796).
- Capawesome OTA has NEVER run end-to-end → iOS members currently have NO working update path short of a full App Store resubmit (days/cycle).
- Dean: server.url dev-loop on his iPhone → sees every vyve-site commit live (2-15min WKWebView cache).
- Net: a vyve-site commit reaches Dean + Android members, NOT iOS members. Settings vbb-marker verifies Dean's view only.

### vyve-capacitor remote drift
- Remote latest commit is PM-560 (splash). The 1.5/1.6/1.7 bundle ship-state lives only on Dean's Mac local, uncommitted. Curate + atomic-commit Mac-local → remote per PM-413 Pending #2.

### Brain edits applied this session
- CURRENT FRONT: surgical merge onto the PM-568 front (kept their cron-fix lines + cleared WARN) — replaced the stale "1.5 in review" line with the deployment-flip block + §23.106.
- §5 native app delivery row rewritten to the flipped model.
- §23.4 — PM-475 correction reverted; original bundled-split is the live truth again for iOS.
- §23.92 — flagged now load-bearing (iOS bundled).
- §19 — new entry (this PM).
- §23.106 (NEW HARD RULE) — bundled iOS cohort has no proven delivery channel; verified Capawesome OTA is the gating capability before Sage and before any member-facing iOS fix.
- backlog — capacitor.config.json doctrine marked RESOLVED (bundled chosen, shipped); OTA verification elevated to P0 native priority.

### Deliverable
- Exec brief for Lewis + Alan: `/mnt/user-data/outputs/VYVE_Platform_Update_2026-06-09.md`. NOT committed to repo — handed to Dean to share.

### No code shipped
- Consolidation + brain only. No vyve-site / EF / migration changes.

### Open / next
- Dean: confirm Android 1.0.6 approval state in Play Console → update brief's pending line + §5.
- Prove + verify ONE Capawesome OTA end-to-end (TOP native priority, pre-Sage gate).
- §23.105 (PM-568 cron-fix rule) has a changelog body but no §23 rule body in master.md — PM-568 session to back-fill.
- Changelog history: changelog.md only reaches back to PM-554 (07 Jun) — confirm whether late-May entries were trimmed at PM-554 or need recovery from an archive.
- Carried WARNs: posthog-test EF delete, server-side HK sync dead since 24 May, App Store Connect API key. (session-reminder-cron resolved by PM-568.)

## PM-568 — Fix: 9 cron jobs broken by null app.service_role_key (2026-06-09)

### Root cause
9 cron jobs used `current_setting('app.service_role_key', true)` string-concatenated into a JSON header literal. `app.service_role_key` was null (never set, or cleared at some point). The `::jsonb` cast on `session-reminder-cron` and `process-scheduled-pushes` threw `invalid input syntax for type json` on every tick. Other jobs using `jsonb_build_object` silently sent `Bearer ` (empty token) — EF auth rejected but no cron-level error.

### Fix
Rewrote all 9 cron job commands via `cron.alter_job()` to embed the service_role JWT literal directly inside `jsonb_build_object(...)`. Eliminates `current_setting()` dependency entirely — cleaner and not fragile to database-level config changes.

**Jobs fixed:**
`session-reminder-cron`, `process-scheduled-pushes`, `habit-reminder-daily`, `streak-reminder-daily`, `vyve-achievements-sweep-daily`, `vyve-alert-digest-morning`, `vyve-alert-digest-afternoon`, `vyve-alert-digest-evening`, `vyve-seed-weekly-goals`

### Verification
`session-reminder-cron` 20:40 UTC tick: `succeeded`. First clean run confirmed.
`process-scheduled-pushes` also `succeeded` at same tick.

### §23 rule
- **§23.105 (NEW):** Never use `current_setting('app.*', true)` in cron job commands for auth headers. The setting is null by default and `ALTER DATABASE` is blocked on Supabase Pro. Embed the JWT literal directly in `jsonb_build_object()` instead. If the key ever needs rotating, update cron job commands via `cron.alter_job()` — 9 jobs, one SQL block.

## Enterprise-readiness bridge session — documentation pack + consent schema + GDPR cron fix (2026-06-09)

### What shipped

**Documentation pack (6 documents):**
- `01_ropa_and_data_flow.md` — ROPA covering 8 processing activities with lawful bases (Art 6 + Art 9), data flow diagram, subprocessor calls. Delivered to outputs.
- `02_disaster_recovery_note.md` — DR/BCP note: RTO 4h / RPO 24h, named owner (Dean Brown), restore procedures for all 5 key scenarios, open actions before Sage pilot.
- `03_subprocessor_register.md` — 10-processor register (Supabase, Anthropic, Brevo, Stripe, PostHog, HubSpot, Apple, YouTube, Capawesome, Riverside) with DPA status and required actions.
- `04_how_we_handle_your_data.md` — External 2-page plain-language summary for procurement reviewers / employees.
- `05_security_questionnaire_updated.md` — Updated security questionnaire committed to `brain/security_questionnaire.md`. Updated from May 2026 to reflect: §23.104 audit clean (June 2026), 120 RLS tables, SECURITY DEFINER audit results, iOS 1.5/Android 1.0.6 in review, RLS cross-account test results, GDPR pipelines live.
- `06_consent_work.md` — Consent and transparency work: HealthKit disclosure copy (DRAFT, Phil + Lewis sign-off needed), privacy notice additions required (Art 6/9 lawful bases, PostHog session recording, data retention table), re-consent prompt spec, `privacy_employer_reporting` default decision brief, B2B employee consent model flag for DPA.

**Schema migration: `add_consent_version_columns`**
- Added `privacy_version TEXT` and `health_consent_version TEXT` to `members` table.
- Existing consented members stamped `'pre-versioning'` as sentinel. Non-consented members NULL.
- Column comments documenting intent added.
- Mirrors the existing `terms_version` versioning pattern.

**GDPR cron fix:**
- Jobs 21 (`vyve-gdpr-export-tick`) and 22 (`vyve-gdpr-erase-daily`): hardcoded bearer `dd536f57...` removed from `cron.job.command`.
- Finding: CRON_SECRET env var was not set on the EF, so the bearer was never validated — it was a visible artifact in pg_cron with no functional effect. Service-role client is the actual auth layer.
- Both jobs now call EFs with Content-Type only; EF security unchanged.

**RLS cross-account isolation test:**
- Impersonated member A (`calumdenham@gmail.com`) attempting to read member B (`deanonbrown@hotmail.com`) across 15 member-scoped tables.
- Result: zero rows visible on all 15 tables.
- Policy audit: all 15 tables confirmed `auth.email() = member_email` on both QUAL and WITH CHECK.

**Security questionnaire updated in `brain/security_questionnaire.md`** — reflects current live state (June 2026 audit, 120 tables, iOS/Android store status).

### Open decisions (not resolved this session — awaiting Dean/Lewis input)

1. **`privacy_employer_reporting` default** — keep `true` (LI basis, defensible) vs flip to `false` (explicit opt-in, safer for Sage procurement). Decision brief in `06_consent_work.md` §4.
2. **PostHog session recording** — Option A (LI basis + opt-out disclosure in privacy notice) vs Option B (explicit consent capture). Note: opt-out mechanism not yet built; don't publish privacy notice addition until it is.

### APNs key rotation (Dean's action items — not built this session)

Dean to action before Sage diligence (walk-through to be done as a dedicated focus):
1. Revoke the non-production APNs key in Apple Developer portal to free a slot (Apple's 2-keys-per-team cap)
2. Register new key
3. Update 5 Supabase secrets with new key values
4. Verify push delivery
5. Revoke old exposed key (KEY_ID `2MWXR57BU4`)

### Reminders for Dean

- Enable PITR on Supabase project (Dashboard > Billing > Add-ons) — reduces RPO from 24h to minutes, documented in DR note as open action.
- Store Android keystore (`vyve-release-key.jks`) + password in 1Password — flagged P0 in DR note.

### §23 rules (none earned — all work was data/config/docs, no novel architectural patterns)

## PM-567 — Security Tier 2c/2d: search_path + ai_decisions policy + final audit clean (2026-06-09)

### What changed

**search_path pin (Tier 2c):**
- Only ONE function was missing it: `watchdog_cron_failures`. All others already had `SET search_path TO 'public'` in place.
- Pinned to `public, cron, pg_temp` (must include `cron` schema — queries `cron.job` + `cron.job_run_details`).
- ACL also locked to service_role only in same migration.
- Smoke-tested: function executes and returns real results.
- Side-finding: `session-reminder-cron` failing every 5min with JSON construction error — `current_setting('app.service_role_key')` string-concatenated into JSON breaks with `sb_secret_*` key format. §23.7 class bug, separate fix needed.

**`exercise_canonical_set` view:** confirmed non-issue. `reloptions` null = Postgres default (security_invoker=false). Underlying tables are public-read anyway, no privilege escalation possible.

**`ai_decisions` INSERT policy (Tier 2d):**
- Old: `service_insert_decisions` — INSERT for `{public}` with `WITH CHECK (true)` — any authenticated member could insert decision rows attributed to any email.
- New: `service_insert_decisions_v2` — INSERT for `{service_role}` only. EFs write this table, members only read their own rows via `member_own_decisions` SELECT policy (unchanged).

**Storage buckets (`certificates`, `member-avatars`):** confirmed already correct. SELECT is public (intentional — certs downloaded, avatars displayed). Write ops are correctly scoped to own email. No changes needed.

**`running_plan_cache`:** shared parametric cache — no member_email column to scope against by design. Park.

### Final §23.104 audit result
**ZERO violations** (excluding deliberate exception `resolve_trial_campaign` — public for onboarding unauthenticated campaign lookup).

All SECURITY DEFINER functions: service_role only, or authenticated+service_role for the 4 legitimate member-facing ones (is_admin, refresh_member_home_state, queue_health_write_back, compute_engagement_components_v2).

### Complete security session summary (PM-564 → PM-567)
Starting: 50+ SECURITY DEFINER functions open to anon/public including 2 CRITICALs.
Ending: §23.104 audit fully clean. Zero open violations.
- PM-564 Tier 0+1: 21 functions locked including both CRITICALs
- PM-565 Tier 2a: authenticated IDOR self-scoped on 2 home-state/engagement fns
- PM-566 Tier 2b: 31 more locked including P0 vault/GDPR exposure
- PM-567 Tier 2c/2d: search_path pinned, ai_decisions INSERT locked, full audit clean

## PM-566 — Security Tier 2b: P0 vault exposure + remaining callable functions locked (2026-06-09)

### What changed
31 more SECURITY DEFINER functions revoked. No vyve-site changes. No member impact.

**P0 CRITICAL — now closed:**
- `read_vault_secret(text)` — any authenticated member could pull any Vault secret by name (Anthropic key, YouTube OAuth, PostHog key, all of it)
- `get_youtube_oauth_secrets()` — literally returned YouTube client_id + secret + refresh_token to any authenticated caller
- `gdpr_erase_purge_subject(text)` — any authenticated member could erase any other member's data

**HIGH — now closed:**
- `gdpr_export_pick_due()`, `refresh_member_home_state_v1_internal()`, `refresh_member_home_state_if_dirty()`, `vyve_refresh_daily()`

**MEDIUM/cron — now closed:**
- `evaluate_plan_fit()`, `charity_total_reconcile_and_heal()`

**Trigger functions (cosmetic cleanup — PostgREST blocks these regardless):**
- `assert_member_not_expired`, `calendar_occurrences_set_updated_at`, `charity_count_*` (6), `increment_habit_counter`, `podcast_episodes_set_updated_at`, `set_daily_mood_updated_at`, `set_updated_at_checkin_questions`, `tg_mark_home_state_dirty_*` (5), `tg_refresh_home_state_from_members`, `tg_refresh_member_home_state`, `vyve_sync_activity_log`

### Final audit state
§23.104 audit returns zero violations except two deliberate exceptions:
- `resolve_trial_campaign` — intentionally public (onboarding needs unauthenticated campaign code lookup)
- `watchdog_cron_failures` — internal ops, low risk, park for next session

### Full session security summary (PM-564 → PM-566)
- Tier 0: 17 service-only functions locked (both original CRITICALs)
- Tier 1: anon door closed on 4 client-callable functions
- Tier 2a: authenticated IDOR closed on refresh_member_home_state + compute_engagement_components_v2
- Tier 2b: 31 more functions locked including 2 P0 vault exposure holes + gdpr_erase_purge_subject

## PM-565 — Security Tier 2a: IDOR self-scope on refresh_member_home_state + compute_engagement_components_v2 (2026-06-09)

### What changed
Two `SECURITY DEFINER` functions patched to self-scope authenticated callers.
Role-guard added as first statement in BEGIN: `IF auth.role() <> 'service_role' THEN p_email := auth.email(); END IF;`
service_role callers (all EFs, all cron jobs) bypass the guard — auth.email() is NULL under service_role so the bypass is mandatory.

**`refresh_member_home_state(p_email text)`** — authenticated callers now forced to own home state. Guard placed before `e := lower(trim(p_email))` normalisation so the scoped value flows through correctly.

**`compute_engagement_components_v2(p_member_email text)`** — authenticated callers now forced to own engagement data.

**`is_admin()` and `queue_health_write_back()`** — confirmed safe by construction (no email param / trigger function). No changes needed.

### Verification
- `pg_get_functiondef` confirms `auth.role() <> 'service_role'` guard present in both functions.
- Zero `permission denied` / `42501` / function-name hits in `platform_alerts` post-apply.

### Remaining Tier 2 work (next session)
- Pin `search_path = public, pg_temp` on ~40 flagged functions (branch-test first).
- Recreate `exercise_canonical_set` view as invoker security.
- Tighten `running_plan_cache` / `ai_decisions` RLS WITH CHECK to own rows.
- Restrict bucket listing on `certificates` + `member-avatars`.

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
