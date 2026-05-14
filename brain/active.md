# VYVE Brain — Active Working Set

> Session-scoped current state. Read this at session start. Do NOT read master.md / changelog.md / backlog.md unless this file points you to a specific section that's not in here.
>
> **Last full rebuild:** 13 May 2026 PM-77 (Premium Feel Campaign launch), PM-84 (PF-24/25 scope expanded — bottom-nav-as-persistent-floor + chrome dimension audit — and PF-30 added — local-first telemetry redirect).
> **Target ceiling:** 35KB.
>
> If this file disagrees with master.md or changelog.md, this file is wrong and needs a rebuild. Tell Dean.

---

## 0. How to use this file

**Read order at session start (the new "Load VYVE brain" routine):**

1. This file (`brain/active.md`) — always, in full.
2. `playbooks/premium-feel-campaign.md` — currently the active campaign. Always while campaign is open.
3. Last 3 changelog entries via grep, NOT the full file: `grep -n "^## 2026-" brain/changelog.md | head -3` then read those entries via line-range view.
4. Only fetch master/changelog/backlog full files if a question explicitly needs history this file doesn't carry.

Total typical load: ~50-80KB. Versus the old 1.65MB. Stay within this budget.

**Operating mode for this campaign (LOCKED 13 May 2026 PM-77 — do not deviate without explicit Dean override):**

- **Claude leads, Dean drives.** When Claude faces a technical decision between options, Claude decides and moves forward. Dean retains veto by saying "no, do it differently" — but the default is forward motion, not menu presentation. Asking Dean "should we use X or Y" wastes his time. He has said clearly he is fully led by Claude.
- **Architectural commitment is immutable** (see §3). Future Claudes may not propose pivoting away from local-first without producing a specific measured problem this architecture can't solve.
- **It is not a PWA.** VYVE is a Capacitor-wrapped native iOS+Android app with web fallback at online.vyvehealth.co.uk. If any session references "PWA", correct it. The "PWA install prompt" code in index.html is legacy and slated for removal.
- **Single-device-per-user is the working assumption.** Conflict resolution = last-write-wins. No per-table conflict policy work. Multi-device edge cases triaged post-launch.
- **All existing member data wiped at launch (31 May 2026).** No data-migration concerns. Every member day-1 is a new member with empty local DB.
- **Session granularity matches Dean's reality.** He works in long evening sessions (3-6 hours), all-day Sundays, and small commute/lunch windows (15-90 minutes). Tasks in the campaign playbook are sliced so any window can pick up a task and ship it.
- **Brain is the contract.** Every session-end updates active.md (always) + the campaign playbook (if task progressed) + master/changelog/backlog (only on architectural changes or campaign closures). One atomic commit.
- **No more architectural surprises.** If a deviation must happen, it must be justified against §3 in the changelog and Dean must approve in chat.

---

## 1. Source-of-truth chain

Live > Brain > Chat history.

- **Live = Supabase + GitHub vyve-site + GitHub VYVEBrain main branches.** Always canonical for state.
- **Brain = this file + playbooks + master/changelog/backlog.** Canonical for narrative, decisions, history.
- **Chat history = transient.** May contain stale numbers, abandoned approaches, in-the-moment thinking. Trust brain over chat.

When the three disagree:
- Numbers (table counts, EF versions, member counts, SHAs) → fetch live via Supabase/GitHub tools, never trust cached values.
- Decisions and architecture → trust brain master/this file's §3.
- Open questions → check changelog tail first.

---

## 2. Live state snapshot (refreshed every session-end)

**Last verified:** 14 May 2026 daytime session — three production ships landed sequentially during Dean's workday (read/plan/diagnostic + low-risk only, device verification deferred to evening). **PM-97 reset-rehydrate fix SHIPPED** (`361b44dc`, settings.html `resetLocalCache()` flipped from `hydrate()` to per-table `hydrateTable()` for `members`/`member_habits`/`workout_plan_cache` — bypasses the `hydratePromise` session-memoisation that made the original `await hydrate()` a no-op; failure now BLOCKS reload per §23.7.8). **PF-34 (1/3) certificates.html Dexie-first wire SHIPPED** (`be690345`, member-dashboard EF response shape built locally from `certificates` + raw activity tables + `members.first_name`; EF still fires in background for authoritative cert numbering + charity_total). **PF-34 (2/3) movement.html Dexie-first wire + 4 optimistic upserts SHIPPED** (`f8bc15cf`, fetchPlan read flips + per-page upserts on markDone workouts/wpc and logMovement walk-cardio/non-walk-workouts paths per PF-4b Part 2). **PF-34 (3/3) running-plan.html → audit-only outcome** — `member_running_plans` not in Dexie schema, `running_plan_cache` only exists in db.js as a future-use `_kv` mention (cross-member shared cache by `cache_key`, not member-scoped); proper wire needs schema work + cross-member sync rule, deferred as PF-34b. **sessions.html audit** — fully static catalogue, zero network calls, no wire needed. **leaderboard.html audit** — single `leaderboard` EF call computing cross-member aggregates server-side; cannot be local-first by nature; existing localStorage offline-cache pattern is the right shape. **PF-14c offline cold-boot fix SHIPPED** (`66f02b84`, PM-105 same-day follow-up). Causes A+B addressed: vendored `/dexie.min.js` (94KB from jsDelivr, dexie@4.0.10 verified) into the repo and changed `db.js` `DEXIE_CDN` constant to `/dexie.min.js`; added `/supabase.min.js`, `/dexie.min.js`, `/achievements.js` to `sw.js urlsToCache`. sw.js cache key: `pf34-movement-a` → `pf14c-precache-a`. Cause C (Promise.race timeout on `vyveLoadSupabaseSDK`) deferred as belt-and-braces — ship in a follow-up only if device verification reveals further hangs. Shipped without device verification: the change is offline-only-affecting (asset cache populates from precache list instead of from-first-fetch, but content identical), online happy path is byte-equivalent, so the ship can't make anything worse — if A+B are sufficient, offline cold-boot resolves; if there's a Cause D we missed, offline cold-boot still fails the same way. Verification: Dean airplane-mode-off iPhone, kill app, re-open offline tonight. **Brain drift surfaced**: pre-session SW cache key in this file said `pm97-pf15-merge-upsert-a` but live `sw.js` was actually on `pm101-ship-a` — PM-98..PM-101 shipped on main without active.md §2 being refreshed afterward. PM-103 entry below preserved for canary-walk findings context.

| What | Value |
|---|---|
| vyve-site main HEAD | `66f02b84` (PF-14c offline cold-boot precache + Dexie vendoring). Today's ships: `361b44dc` PM-97 reset-rehydrate fix → `be690345` PF-34 1/3 certificates Dexie wire → `f8bc15cf` PF-34 2/3 movement Dexie wire → `66f02b84` PF-14c precache fix. Earlier landings still on main: `ddc13271` PM-97 PF-15 partial-upsert seal, `433d0650` exercise.html PM-96 reference, spike merge `c469e504`. Note: the live SW cache key reflected `pm101-ship-a` at session-start, meaning at least one additional ship landed between PM-97 partial-upsert (`ddc13271`) and this morning that active.md did not record. Brain realigned to live state. |
| vyve-site `local-first-spike` HEAD | `fa3bd6e6` (merged into main via PM-95 `c469e504`; HEAD frozen at the PF-14 part 2 settings-toggle commit; branch retained for historical reference, slated for PF-15 cleanup deletion) |
| VYVEBrain main HEAD | this commit (14 May 2026 daytime — PM-105: PF-14c offline cold-boot fix ship + §23.7.8 addendum (hydrate vs hydrateTable API gotcha) + §23.10 primitives 2a/2b (SW urlsToCache must cover all runtime-injected scripts; no cross-origin runtime deps in critical path). PM-104 commit prior — three ship + audit summary + brain realignment). |
| SW cache key (production) | `vyve-cache-v2026-05-14-pf14c-precache-a` (PF-14c — offline cold-boot precache fix. Bumped today through pm97-reset-rehydrate-a → pf34-certs-a → pf34-movement-a → pf14c-precache-a. NOTE: pre-session live key was `pm101-ship-a`, meaning PM-98..PM-101 shipped without active.md §2 refresh — realigned in PM-104 brain commit.) |
| iOS app store | 1.1 (Build 3) submitted 27 April 2026 — "Ready for Review", auto-release on approval |
| Android Play store | 1.0.2 awaiting Google Play review |
| Member count | ~15 cohort (B2C + enterprise trial + internal). Live via Supabase, not cached. |
| Active campaign | **Premium Feel Migration (local-first via Dexie)** — see `playbooks/premium-feel-campaign.md` |
| Launch target | 31 May 2026 |
| Last shipped vyve-site commits | main unchanged: `fc8232bb` (PM-74), `5cef00a2` (PM-75), `ff3e0e0f` (PM-76). Spike branch: `8d07d26b` (PF-1), `e8f02742` (PF-2/3), `903127d6` (PF-4), `fa116ef2` (PF-5), `48c4d17e` (PF-6), `97863198` (PF-7), `d2fc1e89` (PF-8), `197a0d89` (PF-9), `9813e800` (PF-10), `8b79c54d` (PF-11a), `a248bfef` (PF-11b), `707aa3af` (PF-30), `302087de` (PF-12, PM-91), `11abad83` (PF-13 scaffolding, PM-92). |
| Closed campaigns | Layer 1 (PM-29), Layer 1c (PM-30..PM-44), Layer 2 (PM-45..PM-55), Layer 3 (PM-57), Layer 4 (PM-58..PM-66), Layer 5 (PM-21+PM-56+PM-75+PM-76) |
| Deferred campaigns | Layer 6 (SPA shell) — dropped in favour of local-first migration which delivers the same perceived speed |

---


### Canary walk findings (PM-103, 14 May 2026 evening)

**Two test accounts provisioned, fully Supabase-side:**
- `test1@test.com` / `1234` — clean fresh-onboarding account. No daily activity. Mirrors Dean's `members` profile shape (SPARK, kg/cm, individual, dark theme, onboarding_complete true). 12 member_habits (11 active + 1 inactive). Workout plan cloned (8-wk PPL Holiday Shred). Engagement score 50 base, all zeros. **Purpose: launch-experience canary** — every Sage employee day-1 looks like this account.
- `test@test.com` / `1234` — seeded mid-journey. 48 daily_habits rows across 12 distinct days, 4 workouts, 6 cardio. Engagement score 78, plausible streaks. **Purpose: existing-customer-reinstall canary** — the path where Dexie has to rehydrate from a populated Supabase. Both accounts share Dean's habit set + WPC.

**Surfaced bugs (severity-ordered):**

1. **PF-14c P0 LAUNCH BLOCKER — Offline cold-boot fails completely.** App opens to a black screen when network is dead. Nav between pages doesn't work offline. Once logged in, the app should function fully offline for non-network-bound surfaces. Currently fails on every test. Codified as §23.10 Offline-equivalence contract. Sub-tasks PF-14c (cold-boot), PF-14d (SW nav), PF-14e (offline UX states).

2. **PF-31 P0 — Page re-entry reads from a source that clobbers Dexie writes.** Workouts page shows session complete locally + fires "First Tonne Lifted" achievement. Navigate to home (still 0/0). Navigate back to workouts — green check has DISAPPEARED. Server-side verified: write landed, achievement evaluator fired correctly, 14 achievements queued. The bug is in the client read path on page mount somehow not finding or being overwritten by stale data. Diagnostic shape: probe `exercise.html`/`workouts-session.js` page-mount read sequence; trace whether REST fallback runs and clobbers fresh Dexie rows.

3. **PF-32 P0 — Home page doesn't reflect cross-page writes.** Log a habit → home page progress strip stays at 0 until cache-bust or hard reload. Log a workout → home stays at 0. Log cardio → home stays at 0. Achievement toast queue on server has 14 entries; client showed 1 toast. The bus publish exists but home either isn't subscribed or its subscriber doesn't re-paint from local. Fix shape: home subscribes to all activity bus events, re-paints from `member_home_state` (which is trigger-maintained server-side already) AND local Dexie summary, whichever is fresher. Achievement toast drain on every page mount, not just on originating-page evaluation event.

4. **PF-33 P1 — Synchronous header counter mutation missing.** Tap habit → habit card flips (instant, correct, §23.7.6 satisfied) but the page-header counters (DAY STREAK / TOTAL LOGGED) wait for round-trip. Same on every activity-logging page. Fix: mutate in-memory dataset synchronously, repaint header same-tick, fire Dexie write + bus publish in background. §23.7.6 was only partially applied — only the visible card-flip got synchronous treatment, the header didn't.

5. **PF-34 P1 — Engagement.html / certificates.html / running-plan.html / movement.html cold-load is 10-15s.** These are the PF-15.x unwired pages. Mechanical clone of PM-96 exercise.html pattern. Single session to sweep all four.

6. **PF-35 P2 — Home page "HABITS 11" vs habits.html header "1 total logged" disagree on the same concept.** Home reads raw row count; habits.html header reads distinct-day count from member_home_state. Both technically correct for their source, both showing the same logical thing. Fix: enforce "page-header numbers must read from a pre-aggregated summary, never raw row count" as a §23 rule. Likely §23.11 candidate.

7. **PF-36 P2 — Warmup orchestrator with consent gate / first-run tour as natural hold window.** Dean's architectural insight: consent gate + 60-90s first-run tour give the warmup window for free; reinstall path needs an explicit "Getting your VYVE ready..." holding screen. Three flows (brand-new, returner-warm-Dexie, reinstall-cold), one warmup engine. Summary-first design (Tier 1: pre-aggregated summaries; Tier 2: rolling-window detail; Tier 3: on-demand archive) keeps the warmup payload BOUNDED regardless of member tenure — critical for the 6-month / 12-month-tenured member case.

8. **PM-97 P0 HOT — reset-rehydrate gesture currently breaks production.** Long-press footer reset in settings.html clears Dexie tables then reloads BEFORE hydrate completes. Fix specified in backlog under PM-97 section. 30-min ship.

### Sequencing for next session(s)

Priority order — does NOT match campaign playbook PF-N ordering, deliberately:

1. **PM-97 reset-rehydrate fix** (30 min, P0 HOT, no device verification required)
2. **PF-14c offline cold-boot diagnostic** (1-2 hours, read-only, scope the fix precisely; device verification needed before shipping fix itself)
3. **PF-15.x sweep** (3-4 hours, mechanical, ships engagement/certificates/running-plan/movement; sessions audit + leaderboard carve-out documentation)
4. **PF-31 + PF-32 + PF-33** (2-3 sessions combined, all need device verification — pair with Dean on iPhone)
5. **PF-14d (offline SW nav) + PF-14e (offline UX states)** (1-2 sessions, paired with Dean)
6. **PF-36 warmup orchestrator** (1 session, paired with consent-gate-on-first-load integration)

Estimated total: 6-8 focused Claude sessions over 2½-3 weeks to "Sage demo ready." Each ship paired with Dean's canary walk on test1 before stacking the next phase.


## 3. The active campaign — Premium Feel Migration (local-first via Dexie)

**Goal:** Make VYVE feel like a native app where every tap is instant. Members should never wait on a server round-trip during normal use.

**Architectural commitment (IMMUTABLE — locked PM-77):**

VYVE is a Capacitor-wrapped native iOS+Android app with web fallback at online.vyvehealth.co.uk.

**On-device Dexie (IndexedDB) is the source of truth for the member's own data.** Every read goes to Dexie. Every write hits Dexie first, then queues to Supabase in the background.

**Supabase is:**
- The sync target (backup + cross-device propagation via Realtime).
- The server-side compute layer for things that genuinely need it: AI persona/plan generation, cron-driven achievements/certificates, employer aggregate reporting, leaderboards.
- Not the rendering source for the member's own data.

**This commitment may not be revised** without producing a specific measured problem this architecture can't solve. Any future Claude that proposes "let's try a different pattern" must justify against this paragraph in the changelog and get Dean's explicit approval. The Layers 1-4 era of pivoting between architectures is closed.

**Why this campaign exists:** Layers 1-4 built optimistic UI + cross-device sync + reconcile-and-revert, but the rendering source is still server-fetched member-dashboard EF data. That EF runs 17s cold / 7s warm, so the app does not feel instant despite the architectural plumbing. Local-first removes the server-fetch hot path entirely. The 4-5 sessions spent on Layers 1-4 are not wasted — the event bus, optimistic patterns, and Realtime bridges remain useful in the new architecture — but they were the wrong priority ordering. This campaign corrects that.

**Why Dexie specifically:** Mature (10+ years), free (MIT license, no premium tier needed), works inside Capacitor's WKWebView, no new backend service required, full control over the sync layer. RxDB was considered but its Supabase replication plugin is paid (€480/year) and over-engineered for our single-device-per-user assumption. PowerSync was considered but adds a separate backend service. Dexie + a custom sync layer using existing Supabase calls is the right shape.

**Campaign tasks:** see `playbooks/premium-feel-campaign.md` for the full PF-1 through PF-N backlog.

**Status at PM-95 commit:** PF-1 through PF-13 scaffolding + PF-30 + PF-14 parts 1-4 SHIPPED and MERGED TO MAIN (HEAD `a3c74734`). Spike branch redundant. **PF-14 device verification PARTIAL** — Dean's iPhone walk validated Dexie alive on iOS WKWebView, paint-grace indicator semantics correct, Habits/Home/Nutrition/Log-Food paint from Dexie (`Paint: dexie`). Five surfaces show `Paint: supabase` despite spike on (Cardio, Workouts session, Wellbeing Check-in, Monthly Check-in, Settings) — diagnosed as Dexie hydration coverage gap, queued as P0 for PF-15. **PF-14b promoted to launch blocker** — Dean's `capacitor.config.json` confirmed remote-origin (`server.url: https://online.vyvehealth.co.uk`), subject to Apple ITP 7-day storage purge which directly breaks the campaign's instant-always promise. PF-14b: migrate to bundled-mode + Capgo or Capawesome live-updates service (~£10/mo at our scale), submit iOS 1.2 / Android 1.0.3, review ~24-72hr. Sequence: this weekend session → submit Sun/Mon → review through ~20 May → 31 May launch on ITP-exempt build.

**Status at PM-92 commit:** PF-1 through PF-13 scaffolding COMPLETE on `local-first-spike` branch (`11abad83`), 15 commits ahead of main, awaiting Dean's verification + merge. Spike covers Dexie schema (~27 tables), hydrate-on-login, shadow outbound queue (mirrors `writeQueued` into Dexie `_sync_queue` and runs parallel drainer), proper since-cursor delta-pull on visibilitychange, habits.html Dexie-first reads (3 sites flipped), workouts surfaces Dexie-first reads with PM-77.3 thumbnail prefetch (4+1 sites), nutrition surfaces Dexie-first reads (4 sites), cardio.html Dexie-first reads (3 sites + per-page optimistic `VYVELocalDB.cardio.upsert` at POST-success), wellbeing-checkin + monthly-checkin Dexie-first reads (11 sites total + optimistic wellbeing_checkins.upsert at submit), index.html cold-start Dexie-derived paint (PF-11a), **PF-11b — index.html client-side member_home_state computation** via new `home-state-local.js` module porting `refresh_member_home_state` + `compute_engagement_components` SQL functions to JS over Dexie data, **PF-30 — local-first telemetry redirect** via perf.js v3 (POST target moved from dead `/functions/v1/log-perf` to PostHog capture; new events `perf_first_paint`, `perf_cross_nav`, `perf_auth_ready`, `perf_paint_done`, `perf_navigation_timings`, `perf_sync_queue_high`, `dexie_hydrate_completed`), index.html telemetry hooks for `dexie_cold_paint`/`dexie_full_paint`/`dexie_engagement_drift`, db.js `dexie_idb_lost`/`dexie_open_failed` on §3.1 mitigation A WKWebView crash, PostHog session replay at 100% for soft-launch week (auth.js `posthog.init` config), **PF-12 — settings.html Dexie-first reads + 6 optimistic upsert sites** (cert/eng deferred to PF-12b), and **PF-13 scaffolding — first-login persona-led welcome overlay** (`/hydration.js` 19KB new file with 5-persona × goal-echo COPY_TABLE, HAVEN never-echo hard rule codified three layers deep, SAFE_ECHO_GOALS whitelist, 1500ms minimum display, once-per-device via localStorage.vyve_hydration_shown). Engagement score, all 4 components, all 6 streaks (overall + 5 types), recent_30d counts, weekly goal progress — all now Dexie-derived on cold-start. `members` reads still on Supabase across all pages per PF-8 PF-4b Part 1 carve-out. `weekly_scores` not in Dexie schema (PF-30 companion candidate, deferred — tagged via `known_divergence_sources` on engagement-drift events). AI-moment EF submits stay on the wire. `member-dashboard` EF still always fires post-Dexie-paint to upgrade `charity_total` (cross-member), `achievements`, `certificates`, and HK connection state — these stay server-only. A TTL-cache that skips the EF call when local data is fresh enough is the natural post-launch iteration. Realtime cross-device merge (PF-5b) deferred until post-launch. Sentry deferred to PF-30b — needs DSN from Dean (free-tier Sentry project, ~3 min). **PF-13 copy gate open:** 23 entries in `hydration.js` COPY_TABLE tagged `COPY_DEAN_FINAL` — draft lines are live-displayable but pre-launch Dean must finalise. ~30-45 min of Dean writing time. Next: PF-12b (certificates + engagement Dexie-first, ~1-2 hours), PF-14 (Capacitor device verification), PF-15 (hardening).


**PF-4b — Optimistic-write-to-Dexie hazard (surfaced PM-82, expanded PM-86 into two parts).**

*Part 1 — shadow drainer data-table gap.* PF-4's shadow drainer mirrors `writeQueued` calls into the Dexie `_sync_queue` outbound log but does NOT update the actual Dexie data tables. Pages that read-after-write the same record on the same page surface this gap. First instance: PF-8 `members` PATCH on TDEE recalc.

*Part 2 — direct-fetch bypass (added PM-86, surfaced by PF-9).* Not every write call site goes through `VYVEData.writeQueued`. Cardio's POST is a direct `fetch()` to the Supabase REST endpoint, so the shadow drainer never sees it at all. Read-after-write hazard is the same shape (logged session won't appear in Dexie history until next delta-pull) but the root cause is different: bypass, not gap. Likely other direct-fetch writes exist across the portal — PF-10/11/12 should scan for both shapes.

*Architectural fix options (all deferred to PF-15 hardening pass):* (1) codify shadow drainer to apply optimistic Dexie writes alongside `_sync_queue` enqueue (fixes Part 1 only); (2) audit all write call sites and route direct-fetch writes through `VYVEData.writeQueued` (fixes Part 2 only); (3) both — likely PF-15's choice.

*Page-level workaround pattern until PF-15:* When a refactor would create a read-after-write hazard, either (a) keep that specific read on Supabase and document the carve-out in the page's commit (PF-8 `members` pattern), or (b) add a per-page optimistic Dexie upsert at the write call site (PF-1 `daily_habits` pattern, now also PF-9 `cardio.upsert` at POST-success). Choose (b) when the write call site is reachable and the table is in the Dexie schema; choose (a) when it isn't, or when the table is deliberately not local-first (e.g., `members` row containing TDEE targets that change rarely).
---

### 3.1 iOS-specific mitigations (from PM-77.1 research dive)

Added 13 May 2026 after web research dive on production reports of Dexie + Capacitor + Supabase. Three load-bearing risks identified, all mitigatable. Sync layer + page code must follow these patterns:

**A. WKWebView IndexedDB crash-wipe (WebKit bug 144875, recurred iOS 17.4).** Process kills (low-memory, force-quit) can lose in-flight Dexie writes; rare full-store wipe possible. Apple has not fixed. **Mitigation:** keep Dexie transactions short, force a flush on `visibilitychange` to hidden (via `db.close()` then reopen, or explicit transaction commit), detect "Connection to Indexed Database server lost" errors and recover by re-hydrating from Supabase. **For VYVE specifically:** Supabase is the canonical store; worst-case wipe = member sees "preparing your VYVE" hydration screen on next open. Not data loss.

**B. Capacitor origin pattern affects ITP exposure.** Apple ITP's 7-day script-writable-storage purge applies to **third-party (remote) origins** in WKWebView. Capacitor apps that bundle assets locally (`capacitor://localhost`) are first-party and **exempt**. Apps that load a remote origin (e.g., `https://online.vyvehealth.co.uk` inside the wrap) **may be subject** to the 7-day rule. **Action required:** PF-1 must verify which pattern the current iOS 1.1 build uses. If remote-origin, the campaign should migrate to local-bundle as part of PF-1 or PF-2, not after. Lock the scheme explicitly in `capacitor.config` to prevent reinstall/upgrade wipes (Capacitor 5→6→7 scheme migrations have wiped IndexedDB for users in the past).

**C. Supabase Realtime WebSocket dropped when iOS backgrounds the app.** Realtime events delivered during background window are missed; JS client does not auto-replay on reconnect. **Mitigation:** sync layer must run a delta-pull (`?since=last_sync_at`) on every `visibilitychange` returning to visible, regardless of whether Realtime claims it stayed connected. Belt-and-braces. This is the Layer 3 pattern from PM-57 carried forward into the new sync engine.

**Production evidence:** Multiple Capacitor + Dexie apps have shipped to the App Store and operated without systematic data loss when these patterns are followed (ParkManager, HandyCap, others). The pattern is well-trodden. The bugs are known. The mitigations are standard.

**Escape hatch if needed:** Capacitor SQLite plugin stores data in a native file outside the WebKit sandbox — immune to crash-wipe and ITP. Considered as a fallback if Dexie surfaces problems we can't mitigate, but adds SQL surface area and loses Dexie's query convenience. NOT planned. Only invoke if PF-1 spike fails for crash-wipe reasons specifically.

---

## 4. §23 hard rules — working-set subset (the 15 most load-bearing)

Full §23 lives in `master.md` (50+ rules). These are the ones that fire on most sessions. If a question doesn't match one of these, check master.md §23 before assuming no rule applies.

### Commit discipline

- **Pre-commit SHA refresh.** Always fetch fresh SHAs immediately before commit — drift is rare but catastrophic.
- **Post-commit byte-equal verify.** Re-fetch via Contents API (live ref, not raw — raw is CDN-cached and stale for several minutes). md5 every patched file against staged content.
- **Files over 50KB route through Composio workbench `GITHUB_COMMIT_MULTIPLE_FILES`** via `run_composio_tool`, NOT direct MCP — direct MCP corrupts large files.
- **Multi-file commits use `upserts` field (not `files`) and `message` field (not `commit_message`).** New files omit `sha`; existing files require fresh `sha`.
- **Plain UTF-8 in `upserts[].content` — NEVER pre-base64-encode** (PM-86.1, codified PM-93). The tool base64-encodes internally. Pre-encoding causes silent double-encoding: commit succeeds, blob SHAs look normal, content renders as garbage. The single-file `GITHUB_CREATE_OR_UPDATE_FILE_CONTENTS` accepts either plain or base64 (auto-detected); the multi-file tool does NOT. Pass strings directly.
- **Post-commit byte-equal verification on every changed file.** Use Contents API base64-decode at commit-SHA ref, OR raw at commit-SHA (not branch — raw at branch is CDN-cached for several minutes). MD5 or head-100-chars equality against the staged content. Contents API returns `encoding=none` with empty content for files >1MB — switch to raw-at-commit-SHA or blob-by-SHA in that case.
- **One atomic commit per logical unit of work.** Don't dribble related changes across multiple commits.

### Audit method

- **Whole-tree audits use `GITHUB_GET_A_TREE` recursive + parallel-fetch all .html/.js blobs + local grep.** Never pre-select a subset — past sessions have produced false negatives by guessing which files to audit (3× undercounting on PM-58).
- **Verify Supabase triggers via `pg_trigger`, not `information_schema.triggers`** — the latter silently hides triggers from read-only users.
- **Edge function source: `Supabase:get_edge_function` returns readable source.** `SUPABASE_GET_FUNCTION_BODY` returns ESZIP binary — useless.

### Architecture (load-bearing for future sessions)

- **Auth state-change handler guards on event type, not session-null** (PM-74). `if (ev === 'SIGNED_OUT')` only. Supabase fires TOKEN_REFRESHED with null session when refresh fails — that is not a sign-out and must not redirect.
- **401 redirect must signOut-before-redirect** (PM-74). `await signOut() → set vyve_return_to → location.replace`. Naked `location.href = '/login.html'` creates auth loops on stale tokens.
- **RLS policies wrap auth functions in `(SELECT ...)`** (PM-8). Bare `auth.email()` causes per-row re-evaluation and 300-2000ms planning overhead. Always `(SELECT auth.email())`.
- **AFTER STATEMENT triggers + transition tables, never AFTER ROW for aggregation refresh** (PM-68). Inline-on-write aggregation refresh causes writer-contention cascades.
- **Cache-paint runs before auth, not inside `onAuthReady`** (PM-3). Pages must `paintCacheEarly()` as a synchronous IIFE at the top, before any auth-gated code.
- **Read SDK state-change listeners BEFORE wiring triggers that fire those events** (PM-74 §23.5.3). PM-67e shipped perf instrumentation that called getSession without auditing what would react — that caused the auth loop.

### Read me when about to make architectural changes

- **For Premium Feel Campaign work specifically:** §3 of this file is immutable. Dexie is the local source. Don't propose alternatives.
- **Spike-gate pattern (codified PF-1, May 2026):** When shipping new architecture onto main before all members are ready to use it, gate via `localStorage.vyve_lf_spike === '1'`. Inert otherwise — the new code is dead weight for everyone except spike testers, and the work can ship to main without a parallel deploy pipeline. Pattern used because `vyve-site` GitHub Pages only deploys from `main` (single-branch publish, no preview ref). Generalises to any future architectural slice that wants live-on-main testing. The inert path MUST install a no-op shim under the same window symbol (e.g. `window.VYVELocalDB`) so call-sites don't need to branch.

---

### Dexie flush + reconnect discipline (PM-77.1, load-bearing for the campaign)

- **On `visibilitychange` to hidden:** force-flush any open Dexie transactions (`db.close()` then auto-reopen on next access, OR ensure all transactions resolve before the event handler returns). Protects against WKWebView process-kill data loss.
- **On `visibilitychange` to visible:** run sync layer delta-pull (`since=last_sync_at`) against Supabase regardless of Realtime connection state. iOS suspends WebSockets on background; the JS client does not auto-replay missed events.
- **On "Connection to Indexed Database server lost" error:** trigger graceful re-hydration from Supabase, do not crash, do not silently lose writes. Use the existing offline outbox as the durable queue while DB is unreachable.
- **Capacitor config:** lock the WebView scheme (`capacitor://localhost`) explicitly in `capacitor.config.ts` and never change it across releases — scheme migrations between Capacitor major versions have wiped user IndexedDB stores in past versions.

---

## 5. Backlog top working set (P0/P1 only)

**P0 — must ship before 31 May launch:**

1. **PF-1 — Dexie spike** SHIPPED to `local-first-spike` (PM-78, commit `8d07d26b`). Awaiting Dean merge + verification.
2. **PF-2 — Full Dexie schema** SHIPPED to `local-first-spike` (PM-78, commit `e8f02742`).
2.5. **PF-3 — Sync engine pull-on-login** SHIPPED to `local-first-spike` (PM-78, commit `e8f02742`).
2.6. **PF-4 — Shadow outbound queue** SHIPPED to `local-first-spike` (PM-79, commit `903127d6`). Mirror + parallel drainer behind spike-gate; legacy localStorage outbox still canonical.
2.7. **PF-5 — Delta-pull cursor + foreground belt-and-braces** SHIPPED to `local-first-spike` (PM-79, commit `fa116ef2`). Realtime cross-device merge deferred to PF-5b / post-launch.
2.8. **PF-6 — habits.html Dexie-first reads** SHIPPED to `local-first-spike` (PM-79.3 / commit `48c4d17e`). Three Supabase reads replaced with Dexie. Spike-off path unchanged.
2.9. **PF-7 — workouts surfaces Dexie-first reads + thumbnail prefetch** SHIPPED to `local-first-spike` (PM-79.3 / commit `97863198`). Four reads in workouts-programme.js + one in workouts-session.js. PM-77.3 thumbnail prefetch included. Three-way branch (Dexie-when-non-empty / Supabase fallthrough). Writes already covered by PF-4 shadow drainer; no write-path changes.
2.10. **PF-8 — nutrition surfaces Dexie-first reads** SHIPPED to `local-first-spike` (PM-82 narrative / commit `d2fc1e89`). Four reads flipped: `weight_logs` in nutrition.html; `nutrition_logs` today + recent-foods history + `nutrition_my_foods` in log-food.html. `members` reads kept on Supabase due to PF-4b read-after-write hazard. `off-proxy` (Open Food Facts external API) stays on the wire. Writes already covered by PF-4 shadow drainer.
2.11. **PF-9 — cardio.html Dexie-first reads** SHIPPED to `local-first-spike` (PM-86 narrative / commit `197a0d89`). Three reads flipped: `weekly_goals` cardio-week count + workouts week count in `fetchWeek`; `cardio` history slice 10 in `fetchHistory`. PF-4b Part 2 surfaced: cardio's POST is a direct `fetch()`, not `writeQueued`, so PF-4 drainer doesn't see it — per-page optimistic `VYVELocalDB.cardio.upsert` added at POST-success (matches PF-1 `daily_habits` pattern). SW cache key bumped to `pm78-pf9-cardio-a`.
2.11a. **PF-10 — wellbeing-checkin + monthly-checkin Dexie-first reads** SHIPPED to `local-first-spike` (PM-87 narrative / commit `9813e800`). Eleven reads flipped total across both pages. AI-moment EF submits (wellbeing-checkin EF v29, monthly-checkin EF v18) stay on the wire as deliberate server-compute carve-outs. `weekly_scores` (not in Dexie schema) and `members` (PF-8 carve-out) stay on Supabase. Optimistic `wellbeing_checkins.upsert` at submit covers PF-4b Part 2; monthly skipped (no on-page read-after-write hazard). SW cache key bumped to `pm78-pf10-checkins-a`.
2.11b. **PF-11a — index.html cold-start Dexie-derived paint** SHIPPED to `local-first-spike` (PM-88 narrative / commit `8b79c54d`). New `buildHomeFromDexie()` synthesises partial member-dashboard payload from Dexie when localStorage `vyve_home_v3_<email>` cache is empty. Bootstrap flow: cache → render+EF | Dexie → render+EF | empty → skeleton+EF. EF always upgrades engagement.score + streaks + charity_total + achievements. SW cache key bumped to `pm78-pf11a-home-a`.
2.11c. **PF-11b — index.html client-side member_home_state computation** SHIPPED to `local-first-spike` (PM-89 narrative / commit `a248bfef`). New `home-state-local.js` module (~25KB, 700 LOC) ports `refresh_member_home_state` + `compute_engagement_components` SQL functions to JS. `buildHomeFromDexie` now returns full EF response shape with real engagement score + real streaks + real progress. EF still fires to upgrade `charity_total` + `achievements` + `certificates` + HK state. TTL-cache skip-EF-when-fresh is the natural post-launch iteration. SW cache key bumped to `pm78-pf11b-home-b`.
2.11d. **PF-12 — settings.html Dexie-first reads + optimistic upserts** SHIPPED to `local-first-spike` (PM-91 narrative / commit `302087de`). 2 reads flipped (`habit_library` catalogue + member habits assignment hydrate 2-up). 6 optimistic upsert sites added on write paths (profile, persona switch, theme, notification prefs, goal focus, privacy toggle). `certificates.html` + `engagement.html` Dexie-first reads carved out to PF-12b (~1-2 hours) — both are read-mostly EF-backed pages and lower-priority than PF-13 scaffolding. SW cache key bumped to `pm78-pf12-settings-a`.
2.11e. **PF-13 scaffolding — first-login persona-led welcome overlay** SHIPPED to `local-first-spike` (PM-92 narrative / commit `11abad83`). New `/hydration.js` (19KB, 444 LOC). COPY_TABLE with 5 personas × generic + goal-echo variants (23 lines total, all tagged `// COPY: DEAN TO FINALISE`). HAVEN never-echo hard rule codified three layers deep (header comment, COPY_TABLE comment, runtime short-circuit before goal lookup, `goal = null` for HAVEN in showHydration). `SAFE_ECHO_GOALS` whitelist hardcoded (7 entries: build strength, improve performance, find calm, better sleep, build a habit, understand my body, build a routine — expandable). 1500ms minimum display via `Promise.all([hydrateWait, minWait])`. Once-per-device via `localStorage.vyve_hydration_shown`. 5 persona-matched animations as inline CSS (reusable by PF-27). Telemetry: `welcome_hydration_shown` + `welcome_hydration_skipped` to PostHog. SW cache key bumped to `pm92-pf13-hydration-a`. **COPY GATE OPEN — Dean to finalise 23 entries** in COPY_TABLE before launch (~30-45 min). Search for `COPY_DEAN_FINAL` tag to locate. Onboarding-side stash of `vyve_persona` + `vyve_primary_goal` to localStorage is a separate follow-up — `onboarding_v8.html` patch + onboarding EF response handler — without it the fresh-device-on-returning-member path uses the 50-100ms Dexie-fallback (acceptable, below human perceptual threshold).
2.11f. **PF-14** — Device verification COMPLETE (PM-96, 13 May 2026 late). Dexie indicator + settings toggle shipped (`82524093`, `fa3bd6e6`); spike merged to main (`c469e504`); paint-grace indicator semantics shipped (`244d96fc`); stale habits-cache fix shipped (`a3c74734`); hydrate-await on 4 pages shipped (`67711c4e`). Architecture validated on Dean's iPhone 17. Eight findings logged for PF-15; PF-15 P0-1 (Dexie hydration coverage gap) diagnosed and partially fixed in PM-96 (see 2.11g). Cross-sync test (iPhone+Android) still QUEUED; will fold into PF-15 re-walk after remaining unwired pages are Dexie-wired.
2.11f-b. **PF-14b — Bundled-mode migration + live-updates service** [LAUNCH BLOCKER]. Edit `capacitor.config.json` to remove `server.url`, copy spike-branch site files into `www/`, integrate Capgo (~£10/mo) or Capawesome (~£8/mo) SDK for over-the-air updates, lock scheme to `capacitor://localhost`, submit iOS 1.2 + Android 1.0.3. Apple ITP 7-day storage purge does not apply to bundled-mode (first-party content). Sequence: this weekend → submit Sun/Mon → review through ~20 May. ~2-3h Claude + Dean Xcode time + 24-72h Apple review. **Hard launch dependency for Premium Feel Campaign promise** — without this, members who go 7 days without opening lose their Dexie store and hit a 5-30s re-hydrate screen on next open.
2.11g. **PF-15 — Hardening (in progress)**. Part 1 (PM-96): diagnostic IIFE added to dexie-source-indicator.js → device walk → root cause confirmed = page-side Dexie wiring gap (NOT hydrate timing). Part 2 (PM-96): `exercise.html` Dexie-wired (`433d0650`). Part 3 (PM-97, 13 May 2026 late): partial-upsert merge override on `member_habits` + `members` + long-press recovery gesture (`ddc13271`). Codified as §23.7.5. Remaining P0 items: (a) **§23.5.1 backend EF latency campaign** — three-week-old finding still unfixed, dominant cause of every "data pulls slow" symptom; tonight confirmed live in habits page header dashes never resolving + 20s write-UI lag. This is the next session's P0, not the PF-15 sweep. (b) PF-15.x sweep: wire `movement.html` / `sessions.html` / `leaderboard.html` / `running-plan.html` / `certificates.html` / `engagement.html` where they paint member data (per-page audit needed; some may be legit REST-pass-through). (c) PF-15.write-optimistic: flip the await/optimisticPatch order in habits.html + cardio.html + wellbeing-checkin.html so UI updates instantly while writeQueued fires in background. The Dexie write should happen first, optimisticPatch + publish second, writeQueued third without await — failure path is the existing `habit:failed` revert subscriber. (d) localStorage shape-cache audit. Plus original scope: PM-77.1 mitigations A/B/C codification, force-resync escape hatch, queue drain batching, storage quota handling.
2.11h. **PF-16 through PF-20** — nav restructure + merge to main (merge already done in PM-95, so PF-20 collapses) + remaining hardening + spike-branch cleanup. Sequenced in playbook.
2.12. **PF-29 — Android Health Connect autotick wiring** pre-launch. Capacitor side already configured (plugin + manifest permissions in 1.0.2 Play Store build). Web-side evaluator routes Android requests to Health Connect plugin + Android-specific permissions UX (Lewis copy gate). No Play Store re-review needed since permissions are already declared. ~3-4 hours.
2a. **PF-21 — bottom nav restructure** to Mind / Body / Connect. Pencilled in post-PF-19. ~2-4 hours.
2b. **PF-22 — hub landing pages** for each tab. Scope-flexible: build pre-launch if bandwidth allows, defer to V2 otherwise. ~4-8 hours per hub.
2c. **PF-23 — Interactive guided tutorial** (5 micro-actions × achievement-per-step, persona-voiced). V2 target. Hard sequencing: post-PF-21. Hard blocker: Lewis copy for 5 personas. ~20-25 hours. Stands on its own as a feature — NOT a hydration time-killer (PF-13 handles that).
2d. **PF-24 — Page transitions.** Slide for sub-pages, crossfade for tab switches. Reduced-motion variant. Pre-launch if bandwidth. ~3-4 hours.
2e. **PF-25 — Typography pass.** Tabular numerals on counters, line-height audit, FOUT check, letter-spacing on caps, overflow handling. Pre-launch. ~2-3 hours.
2f. **PF-26 — Pull-to-refresh wiring.** Triggers `runDeltaPull()` per page. Pre-launch. Cheap + high-leverage. ~1-2 hours.
2g. **PF-27 — Loading-to-success animation on AI moments.** Persona-matched animation + staged messaging on weekly/monthly check-in submit. Lewis copy gate. Pre-launch if bandwidth. ~3-4 hours.
2h. **PF-28 — In-progress session + form draft persistence.** Persists workout/cardio session orchestration state + form drafts to local-only Dexie tables so mid-workout app-close resumes exactly where left off (Strong/Strava parity). Pre-launch. ~3-4 hours.
3. **HAVEN clinical sign-off** (Phil). Currently auto-assignment is gated. Phil must review before HAVEN persona ships in production.
4. **Weekly check-in nudge copy** (Phil + Lewis). Currently uses placeholder.
5. **Brevo logo removal** ($12/month addon). Lewis to action before any enterprise demo.
6. **Facebook Make connection refresh** — expires 22 May 2026. Lewis to action.
7. **Public launch comms draft** (Lewis).
8. **B2B volume tier definition** (Lewis + Dean) — define formally before first enterprise contract.
2.13. **PF-30 — Local-first telemetry redirect** SHIPPED to `local-first-spike` (PM-90 narrative / commit `707aa3af`). perf.js v3 strips dead metrics, redirects POST target from `/functions/v1/log-perf` (dead post-PF-11) to PostHog capture. New events: `perf_first_paint`, `perf_cross_nav` (sessionStorage handoff for tap→next-screen timing), `perf_auth_ready`, `perf_paint_done`, `perf_navigation_timings` (pagehide rollup), `perf_sync_queue_high` (fires when `_sync_queue` depth > 5 on pagehide), `dexie_hydrate_completed` (listens for `vyve-localdb-hydrated`). index.html telemetry hooks: `dexie_cold_paint` (PF-11a path), `dexie_full_paint` (PF-11b path), `dexie_engagement_drift` (EF upgrade diff with `known_divergence_sources: ['weekly_scores_v_wellbeing_checkins']` tag — see §3.1 below). db.js wraps the open-failed catch with PostHog `dexie_idb_lost` (WKWebView mitigation A telemetry) + `dexie_open_failed` (other open errors). auth.js `posthog.init` config gains `session_recording` at 100% for soft-launch week (drop to 10% +1 week after hard-launch). PostHog identity wiring was already done — `posthog.identify(email)` fires in `vyveCapturePageView` from `vyveSignalAuthReady`. Memory entry on "PostHog identity wiring pending" was stale; PF-30 leaves identity untouched. Sentry deferred to PF-30b — needs DSN from Dean. SW cache key bumped `pm78-pf11b-home-b` → `pm90-pf30-telem-a`. Files: perf.js (v2→v3), auth.js (init config), db.js (crash recovery), sw.js (cache key), index.html (paint+drift hooks). node --check passed on all JS + all 8 inline scripts in index.html.

**P1 — desired before launch, acceptable to slip:**

9. **Skeleton screens and empty states pass** (post-migration polish). Habits.html "unidentified habits" state needs replacement.
10. **Haptic feedback wiring** via Capacitor Haptics plugin on writing surfaces.
11. **Error handling polish** — warm/helpful error states instead of red alert boxes.
12. **iPhone real-device verification of perf-v2** — confirm cache_first axis fires from iOS Safari/Capacitor.

**P1 — post-launch (do not work on before 31 May):**

13. **Achievements system overhaul** (PM-94 placeholder) — current 32 metrics × 327 tiers + inline evaluator is functionally correct and trial-safe, but Dean's framing: "just a placeholder, needs a massive overhaul and huge improvement." Post-trial scope TBD pending engagement data from 15-20 trial members. Tier thresholds, metric mix, copy on tier titles, celebration moments on unlock, nav surfacing all in scope. Lewis copy approval gate (`copy_status='approved'`). Likely 2-3 sessions as a campaign in its own right. See `tasks/backlog.md` PM-94.
14. **PF-13 hydration.js COPY_TABLE finalisation** (PM-94 placeholder) — 11 distinct persona welcome lines + 2 fallbacks tagged `COPY_DEAN_FINAL` in `/hydration.js`. Drafts are member-displayable real sentences (trial-safe). Dean owns. ~30-45 min writing time. Light Lewis spot-check on tone. Post-trial: rewrite informed by what trial members actually responded to.
15. PM-71/PM-71b dashboard payload trim (becomes mostly obsolete after local-first migration — dashboard EF gets called rarely).
16. PM-72 materialise achievement_progress (same — obsolete-ish after migration).
17. PM-73 home redesign (deferred to after launch + after data on what the simplified payload actually contains).
18. Layer 6 SPA shell decision — likely dropped permanently. Local-first delivers most of what Layer 6 would have.

---

## 6. Credentials, URLs & references (working-set only)

| What | Value |
|---|---|
| Supabase project ID | `ixjfklpckgxrwjlfsaaz` (West EU / Ireland, Pro plan) |
| vyve-site repo | `VYVEHealth/vyve-site` (private, main branch) |
| VYVEBrain repo | `VYVEHealth/VYVEBrain` (private, main branch) |
| Capacitor project | `~/Projects/vyve-capacitor` on Dean's Mac (NOT a git repo — backlog risk) |
| Portal URL | https://online.vyvehealth.co.uk |
| Marketing URL | https://www.vyvehealth.co.uk |
| Stripe payment link | buy.stripe.com/00wfZicla1Em0NnaIB93y00 |
| HubSpot | app-eu1.hubspot.com, Hub ID 148106724 |
| Brain commit pattern | `vyve-cache-v2026-MM-DD-pmNN-<slug>-<letter>` |

For full credentials, EF inventory, table inventory: fetch `master.md` §24 (renumbered to §25 post-PM-77).

---

## 7. What's NOT in this file — fetch on demand

| Question type | Where to look | When |
|---|---|---|
| Full §23 rule history (50+ rules) | `master.md` §23 | When §4 doesn't cover the case |
| Pre-PM-30 changelog entries | `changelog.md` (full) | Investigating pre-Layer-1c ship history |
| Edge Function inventory + cron job map | `master.md` §7 | Any EF-related work |
| Supabase table inventory + column shapes | `master.md` §6 + live `list_tables` | Any DB schema work |
| Onboarding flow detail (10-section questionnaire shape) | `master.md` §9 | Onboarding EF changes |
| AI persona system prompts (NOVA/RIVER/SPARK/SAGE/HAVEN) | `master.md` §10 + Supabase `personas` table | Persona work |
| GDPR pipeline (export, erase, retention) | `master.md` §16 + `playbooks/disaster-recovery.md` | GDPR work |
| Cache-bus taxonomy (PM-29..PM-44 era) | `playbooks/cache-bus-taxonomy.md` | Touching bus events |
| Disaster recovery procedures | `playbooks/disaster-recovery.md` | DR drill, real DR event |
| Brain commit/sync protocol details | `playbooks/brain-sync.md` | Editing brain files |
| Old Layer 1c migration template | `playbooks/1c-migration-template.md` | Legacy — likely never needed again |
| Layer 5 perf capture protocol | `playbooks/layer5-perf-capture-protocol.md` | Reading perf_telemetry data post-launch |
| **PREMIUM FEEL CAMPAIGN tasks** | `playbooks/premium-feel-campaign.md` | **EVERY session during this campaign** |

---

## 8. Editorial notes

- **Last full rebuild:** 13 May 2026 PM-77. Latest patches: PM-78 (PF-1/2/3 + spike-gate rule), PM-79 (PF-4/5 + delta-pull cursor semantics), PM-79.1 (PF-23..PF-27 added — interactive tutorial + 4 polish tasks), PM-79.2 (PF-28 added — in-progress session + form draft persistence), PM-79.3 (PF-6 + PF-7 SHIPPED — habits + workouts Dexie-first reads, including PM-77.3 thumbnail prefetch on workouts), PM-79.4 (PF-29 added — Android Health Connect autotick wiring; PF-14 scope expanded with Android two-device verification, Capacitor scheme check, Dexie source indicator), PM-82.5 (brain restore — PM-80/81/82 ship narratives spliced into changelog; §2/§3/§5 advanced to PF-8 SHIPPED state; PF-4b surfaced into §3; orphan-commit drift documented in changelog as a §23 hard-rule candidate). PM-83 (PF-13 scope expanded — persona-led welcome + safe goal echo from onboarding questionnaire; Dean owns copy directly, removed from Lewis blocker list; HAVEN-never-personalised hard rule documented). PM-87 (PF-10), PM-88 (PF-11a + PF-11 split), PM-89 (PF-11b — index.html Dexie-derived home-state computation via home-state-local.js). PM-90 (PF-30 SHIPPED — perf.js v3 telemetry redirect + PostHog session replay + new dexie/perf events; PostHog identity confirmed already wired in auth.js, memory note on "pending" was stale; Sentry deferred to PF-30b pending DSN). PM-91 (PF-12 SHIPPED — settings.html Dexie-first + 6 optimistic upsert sites; certificates/engagement carved out to PF-12b). PM-92 (PF-13 scaffolding SHIPPED — `/hydration.js` persona-led welcome overlay with HAVEN never-echo + SAFE_ECHO_GOALS whitelist + 1500ms min display; copy gate open, Dean to finalise 13 distinct COPY_TABLE entries). **PM-93 (verification-mode audit repair — brain drift caught: spike HEAD `707aa3af`→`11abad83`, SW cache key `pm90-pf30-telem-a`→`pm92-pf13-hydration-a`, two missing changelog entries (PM-91 + PM-92) re-spliced from live commit messages, playbook PF-12 + PF-13 statuses flipped SHIPPED, playbook PF-30 stale 'identity pending' language stripped, new §4 hard rule on plain-UTF-8 in upserts content codified)**. PM-94 (trial-phase placeholders consciously deferred — hydration COPY_TABLE finalisation + Achievements system overhaul both logged to backlog as P1 post-launch with Dean's explicit framing; memory entry #17 captures the trial-safe operating mode for both items).
- **Next rebuild trigger:** campaign close (Premium Feel migration ship), OR 3+ patches accumulated to this file, OR drift detected (live state disagrees with §2).
- **Commit discipline for active.md edits:** §2 SHA bumps are atomic with the session's main brain commit. §3 status flips when a campaign task ships. §4 only gains new rules when a rule earns working-set residency. §5 reorders on backlog grooming.
- **What does NOT belong here:** anything from §7's fetch-on-demand list. If a question keeps surfacing that requires fetching the same canonical section session after session, that's the rebuild signal — promote it into active.md on the next rebuild.
- **What DOES belong here:** the live state snapshot, the active campaign's status, the working-set §23 rules, the P0/P1 backlog top, the operating mode. Everything a fresh Claude needs to be productive on the next session without reading master/changelog/backlog.
