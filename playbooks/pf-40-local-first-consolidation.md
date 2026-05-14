# PF-40 — Local-First Consolidation Campaign

> Living campaign reference document. Updated as sub-items land. The audit JSON map at `audit/pf-40-1-callsites.json` is the machine-readable source of truth for call-site enumeration; this document is the human-readable narrative + decision log.

**Status:** PF-40.1 audit shipped 2026-05-14. PF-40.2 (fat-row hydrate) is the next ship.

**Source-of-truth chain:** `vyve-site` main HEAD `66f02b84f0588d0bc2fdbed4ca06ae684e10f685` at audit time. 78 HTML + JS files, 40,400 lines scanned. 321 unique network / local-DB call sites enumerated and classified.

---

## 0. Why this campaign exists

Layers 1-4 (Mar-Apr 2026, PM-29..PM-66) built the right scaffolding — event bus, optimistic UI primitives, Realtime cross-device bridge, perf-telemetry layer — but kept server-fetched `member-dashboard` Edge Function payload as the rendering source. The EF runs 17s cold / 7s warm. No amount of bus optimisation makes a 7-second EF feel like a native app.

The Premium Feel Campaign (May 2026, PM-77 onward) flipped to Dexie-first reads on a page-by-page basis (PF-6 habits, PF-7 workouts, PF-8 nutrition, PF-9 cardio, PF-10 checkins, PF-11 home, PF-12 settings, PF-34 movement+certificates). That pattern survives for tables whose columns happen to be self-contained inside a single Supabase table (workouts, cardio). It **fails** for tables whose UI reads denormalised join columns owned by a separate table — surfaced 14 May 2026 PM-106 evening on `habits.html` walking `test1@test.com`: page painted `undefined / undefined / undefined` for ~10 seconds until the EF round-trip arrived with the join columns.

Every Dexie-wired page is one schema-audit away from the same bug. Per-page clones build per-page latent bugs. PF-40 fixes the foundation (hydrate completeness, consolidated read/write API, tiered assets, offline-equivalent boot chain) so the remaining per-page migration is mechanical and bug-free.

---

## 1. The contract (immutable, codified active.md §3 + master.md §23.11/§23.12/§23.13)

- **Dexie is the source of truth for everything the app reads.** No exceptions on Tier 1+2 surfaces. Reads go through `VYVEData.read()`. No page-level `fetch()` calls for member or catalogue data, ever.
- **First-login is a deliberate long load** (~5MB JSON + ~5MB images), masked by the consent gate and persona-led walkthrough.
- **Asset strategy is tiered.** Tier 1 (brand chrome, persona portraits) bundled in IPA via PF-14b. Tier 2 (current programme thumbnails + assigned habit images) pre-fetched on first-login / plan-switch. Tier 3 (non-current-programme assets) CDN-on-view, HTTP-cached per session, no local persistence.
- **Writes mutate Dexie synchronously, return control immediately, queue to `_sync_queue`.** The drainer is the only HTTP-aware code in the write path.
- **Honest network-bound carve-outs (§23.10)** route through `VYVEData.fetchNetworkBound()` — distinguishable from accidental REST. Examples: anthropic-proxy (AI moments), leaderboard (cross-member aggregate), off-proxy (Open Food Facts), session_chat (Realtime), live session schedules, send-email.
- **Single-device-per-user is the working assumption through 31 May launch.** Multi-device works but with last-write-wins semantics. Proper conflict resolution post-launch.

---

## 2. Sub-item index

| # | Status | Sub-item | Depends on | Solo? | Device verify |
|---|---|---|---|---|---|
| PF-40.1 | ✅ SHIPPED | Write-path & read-path audit | — | ✓ | none |
| PF-40.2 | Next ship | Fat-row member-scoped hydrate | 40.1 | ship | iPhone + Android |
| PF-40.3 | Queued | Catalogue tables as first-class | 40.1 | ship | iPhone |
| PF-40.4 | Queued | `VYVEData.write()` + per-page migration | 40.1, 40.2 | ship | iPhone (each batch) |
| PF-40.5 | Queued | `VYVEData.read()` + page-level fetch removal | 40.2, 40.3, 40.4 | ship | iPhone (each batch) |
| PF-40.6 | Queued | Tier 1 assets bundled in IPA | PF-14b | ship | post-Apple review |
| PF-40.7 | Queued | Tier 2 pre-fetch on first-login / plan-switch | 40.3, 40.6 | ship | iPhone (walkthrough) |
| PF-40.8 | Queued | Tier 3 CDN-on-view + placeholders | 40.7 | ship | iPhone (offline browse) |
| PF-40.9 | Queued | Boot chain offline-equivalence | 40.5 | ship | iPhone airplane mode |
| PF-40.10 | Queued | Catalogue delta-pull + force-refresh lever | 40.3 | ship | none |
| PF-40.11 | Queued | Offline UX states for §23.10 carve-outs | 40.9 | ship (Lewis copy) | iPhone (each surface) |
| PF-40.12 | Queued | Spike-flag removal + main-only path | all above | ship | smoke test |

Total estimate ~13-16 Claude-assisted sessions. Against 31 May launch (17 days at PM-106): tight but doable if Sundays and evening sessions cover the device-verification batches.

---

## 3. Pre-existing surface (don't rebuild what's there)

The campaign is **evolving** an existing API, not building from scratch.

**`window.VYVEData`** is defined in `vyve-offline.js`. Current surface:

- `cacheGet(key)` / `cacheSet(key, value, opts)` — sync localStorage primitives.
- `fetchCached(url, { cacheKey, jwt, headers })` — cache-first GET, paint then refresh.
- `writeQueued({ url, method, headers, body, table?, optimistic? })` — POST/PATCH/DELETE wrapper with outbox queuing, dead-letter handling at 3 server-failures, idempotency keys.
- `outboxFlush()` / `outboxList()` / `outboxClear()` / `newClientId()` — outbox primitives.

**`window.VYVELocalDB`** is the Dexie wrapper (`db.js`). Per-table surface: `<table>.upsert / put / add / update / delete / allFor / getOne / where / toArray / count / orderBy`.

**`window.VYVESync`** is the hydrate-on-login + delta-pull engine (`sync.js`). Methods include `hydrate()` (session-memoised — see §23.7.8 hard rule), per-table `hydrateTable(t)` (bypasses memoisation, used for forced rehydrate per PM-97), and `runDeltaPull()` (the `visibilitychange-to-visible` belt-and-braces sweep against Supabase).

### What PF-40.4 must add to `VYVEData`:

- `VYVEData.write(table, row, opts)` — optimistic Dexie upsert (via `VYVELocalDB.<table>.upsert`) + bus publish + outbox enqueue (current `writeQueued` path) + return synchronously. Collapses the 21 `LOCAL_UPSERT` per-page workarounds and the 13 `W_QUEUED` direct calls into one signature.
- `VYVEData.subscribe(table, handler)` — bus subscription helper. PF-32 (cross-page write reflection) becomes a one-liner on every page that needs to react to writes elsewhere.

### What PF-40.5 must add:

- `VYVEData.read(table, query)` — Dexie read with the table's denormalised shape. If empty post-first-hydrate, throw `HydrateBug` (it's a hydrate problem, not a page problem — §23.11). Replaces the `fetchCached` cache-first pattern on Tier 1+2 surfaces. The 73 `R_MEMBER` and 4 `R_CATALOGUE` sites migrate to this. The 60 existing `LOCAL_READ` sites also migrate, gaining consistent denormalised-shape contracts.
- `VYVEData.fetchNetworkBound(endpoint, options)` — nameable, auditable wrapper for §23.10 carve-outs. The 36 `NET_BOUND` sites migrate here. Distinguishes deliberate network calls from accidental REST drift.

---

## 4. Audit findings (2026-05-14 — PF-40.1 ship)

### 4.1 Category breakdown

| Category | Count | Description |
|---|---|---|
| `WRAPPER` | 86 | Helper definition itself (auth.js supaFetch, sync.js writeQueued). Not a user-facing call site; do not migrate. |
| `R_MEMBER` | 73 | Member-scoped read. Target: VYVEData.read() in PF-40.5. Must read from Dexie unconditionally after PF-40.2 fat-row hydrate. |
| `LOCAL_READ` | 60 | Existing Dexie-first read via VYVELocalDB.<table>. Informational — shows where Dexie reads are already wired (PF-6/PF-7/PF-8/PF-9/PF-10/PF-1 |
| `NET_BOUND` | 36 | §23.10 honest network-bound carve-out. Anthropic AI moments, off-proxy (Open Food Facts), leaderboard cross-member aggregate, send-email, gi |
| `W_MEMBER` | 21 | Member-scoped write (POST/PATCH/PUT/DELETE on member table OR write-shaped EF call). Target: VYVEData.write() in PF-40.4. Migration collapse |
| `LOCAL_UPSERT` | 21 | Direct VYVELocalDB.<table>.upsert/put/add/update/delete call. The per-page workaround pattern (PF-1/PF-9/PF-10/PF-12/PF-34) that PF-40.4 abs |
| `W_QUEUED` | 13 | Write already routed through PF-4 writeQueued shadow drainer. PF-40.4 promotes these to optimistic-Dexie-upsert + bus-publish + queue, remov |
| `NET_BOUND_DEAD` | 4 | Network-bound EF that has been superseded — references remain in page code but the EF is dead-lettering. Candidates: log-perf (PF-30 redirec |
| `R_CATALOGUE` | 4 | Catalogue table read (habit_library, workout_plans, personas, etc). Target: VYVEData.read() in PF-40.5 after PF-40.3 adds catalogue tables t |
| `REALTIME` | 1 | Supabase Realtime channel subscription. Session chat. §23.10 carve-out; needs PF-40.11 offline UX state. |
| `INTERNAL` | 1 | Internal admin tool (internal-dashboard/). Out of PF-40 scope — separate access pattern, password-gated, not member-facing. |
| `DEAD` | 1 | Reference to a table/EF that should no longer be written or read. e.g. push_subscriptions post-1.2 native APNs. Flag for cleanup at PF-40.12 |
| `NEEDS_SCHEMA` | 1 |  |


### 4.2 PF-40.4 migration targets — writes

**55 write call sites** across 16 files. PF-40.4 collapses all of them into `VYVEData.write(table, row, opts)`.

**By category:**

| Category | Count | What it is today |
|---|---|---|
| `LOCAL_UPSERT` | 21 | Per-page `VYVELocalDB.<table>.upsert()` workarounds (PF-1 daily_habits, PF-9 cardio, PF-10 wellbeing, PF-12×6 settings, PF-34×4 movement). The pattern PF-40.4 absorbs. |
| `W_QUEUED` | 13 | Already routed through PF-4 `writeQueued()` shadow drainer. PF-40.4 promotes these — same outbox path, plus the now-mandatory optimistic Dexie upsert and bus publish. |
| `W_MEMBER` | 21 | Direct-fetch writes that bypass `writeQueued` entirely (PF-4b Part 2 hazard). Migrate all of these — PF-40.4 closes Part 2. |

**By file (hotspots):**

| File | Write sites |
|---|---|
| `movement.html` | 13 |
| `workouts-session.js` | 8 |
| `habits.html` | 7 |
| `settings.html` | 6 |
| `log-food.html` | 3 |
| `tracking.js` | 3 |
| `workouts-builder.js` | 3 |
| `cardio.html` | 2 |
| `sync.js` | 2 |
| `vyve-offline.js` | 2 |
| `achievements.js` | 1 |
| `nutrition.html` | 1 |
| `theme.js` | 1 |
| `wellbeing-checkin.html` | 1 |
| `workouts-exercise-menu.js` | 1 |


**By table / EF:**

| Table or EF slug | Write sites |
|---|---|
| `?` | 16 |
| `workouts` | 8 |
| `cardio` | 5 |
| `workout_plan_cache` | 5 |
| `daily_habits` | 4 |
| `members` | 4 |
| `custom_workouts` | 3 |
| `habit_library` | 2 |
| `member_habits` | 2 |
| `exercise_logs` | 2 |
| `achievements-mark-seen` | 1 |
| `wellbeing_checkins` | 1 |
| `exercise_swaps` | 1 |
| `exercise_notes` | 1 |


### 4.3 PF-40.5 migration targets — reads

**137 read call sites** across 32 files.

**By category:**

| Category | Count | Today |
|---|---|---|
| `R_MEMBER` | 73 | Member-scoped REST/EF reads still going to Supabase. PF-40.5 routes through `VYVEData.read()` after PF-40.2 fat-row hydrate. |
| `R_CATALOGUE` | 4 | Catalogue reads (`habit_library`, `workout_plans`, `personas`). Few sites today because most catalogue access is embedded in EF responses. PF-40.3 surfaces them in Dexie; PF-40.5 routes through `VYVEData.read()`. |
| `LOCAL_READ` | 60 | Already Dexie-first via `VYVELocalDB.<table>.*` (PF-6/PF-7/PF-8/PF-9/PF-10/PF-11/PF-12/PF-34 surfaces). PF-40.5 standardises through `VYVEData.read()` for consistent shape contracts. |

**By file (top 15):**

| File | Read sites |
|---|---|
| `wellbeing-checkin.html` | 15 |
| `index.html` | 13 |
| `monthly-checkin.html` | 13 |
| `certificates.html` | 11 |
| `workouts-programme.js` | 10 |
| `cardio.html` | 9 |
| `auth.js` | 7 |
| `home-state-local.js` | 7 |
| `workouts-notes-prs.js` | 6 |
| `workouts-library.js` | 5 |
| `exercise.html` | 4 |
| `movement.html` | 4 |
| `sync.js` | 4 |
| `engagement.html` | 3 |
| `log-food.html` | 3 |


### 4.4 PF-40.11 offline UX targets — §23.10 network-bound carve-outs

**36 network-bound call sites** across 21 files. These do NOT migrate to `VYVEData.read()` — they ARE genuinely network-bound. PF-40.11 designs offline UX states for each surface (explicit affordances, not graceful-degradation-to-blank).

**By EF slug / external API:**

| EF / external | Sites | PF-40.11 offline state |
|---|---|---|
| `platform-alert` | 11 | (server-side alerting — silent failure acceptable, retry on next online) |
| `share-workout` | 6 | "Sharing requires a connection — try again when you're online" |
| `youtube_data_api_external` | 2 | Library-browse for video catalogue — placeholder + 'Connect to load videos' |
| `anthropic-proxy` | 2 | "Your check-in is saved and will get a response once you're back online" (Lewis copy) |
| `gdpr-erase-cancel` | 1 | "GDPR cancellation requires a connection" |
| `schedule-push` | 1 | (silent failure acceptable on first-attempt; queue + retry) |
| `sync-health-data` | 1 | (silent failure acceptable — autotick retries on next online + visibilitychange) |
| `notifications` | 1 | (silent failure acceptable — retry on next online) |
| `leaderboard` | 1 | "Leaderboard refreshes when you're online" (existing localStorage cache pattern is the right shape) |
| `off-proxy` | 1 | "Connect to search the food database — your manual entries still log offline" |
| `monthly-checkin` | 1 | (same pattern as wellbeing-checkin) |
| `gdpr-export-request` | 1 | "GDPR export requests require a connection" |
| `wellbeing-checkin` | 1 | "Your check-in is saved. Reflection will be ready once you're online" (Lewis copy) |


Lewis copy gate covers ~10 strings. Currently the rate-limiting step for PF-40.11.

### 4.5 Dead-code candidates (flagged for PF-40.12 cleanup)

- **register-push-token + vapid.js push_subscriptions writes** — Pre-1.2 web-push subscription pipeline. iOS 1.2 (Build 3, submitted 27 Apr 2026) ships native APNs via Capgo HealthKit plugin path. Web-push path remains live for Android pre-Play-store-update + web fallback, but post-launch on 1.2 the iOS path is dead. push_subscriptions writes should be conditioned on platform OR the table marked legacy and pruned. Flag for PF-40 closer (PF-40.12).

- **log-perf EF references (3 sites)** — PF-30 (PM-90) redirected perf telemetry to PostHog; EF stopped receiving traffic. Any remaining /functions/v1/log-perf POSTs are dead-letter writes — confirm with grep against perf.js and delete the EF reference.

- **Other dead EFs (89 patchers)** — Per vyve_security_audit_2026-04-09: 89 one-shot patcher EFs are slated for deletion (pwa-*/push-*/pw-patch-*/patch-*/fix-*/write-*/theme-*/setup-*). Out of PF-40 scope but worth keeping in the campaign brain.

- **push_subscriptions in vapid.js** — vapid.js writes push subscriptions to push_subscriptions on bell-tap. Memory note from session continuity: iOS 1.2 (Build 3, submitted 27 Apr 2026) shipped native APNs path; existing push_subscriptions rows are stale PWA artefacts. Recommend: gate vapid.js subscribePush() on `!window.Capacitor || Capacitor.getPlatform() === 'web'` so the table only receives writes from the web fallback. Long-term cleanup at PF-40.12 if the native path proves fully reliable.

### 4.6 DEAN_DECISIONS_LOCKED — answers from PM-108

The original §4.6 of the PM-107 ship contained 4 open questions with self-supplied recommendations. The PM-108 follow-up surfaced 6 additional behaviour-divergence questions from the audit data and put all 10 to Dean. These are the locked answers.

PF-40.2 onwards proceeds under these decisions. Future Claudes: don't re-raise these unless data emerges that wasn't on the table at PM-108.

---

#### Q1. Habit log → home page update timing → **(a) optimistic-immediate**

Dexie write + bus publish + return synchronously. Home page re-paints from Dexie before HTTP confirms. Supabase write fires in background; Dean's explicit clarification: "data needs to be sent to Supabase as well". The `_sync_queue` drainer handles the network half. The user never waits.

Implication for PF-40.4 `VYVEData.write()`: returns when Dexie write + bus publish complete, not when HTTP confirms. HTTP failures surface as toast/banner, not as UI revert. Cross-page propagation via bus.

---

#### Q2. Achievement fire → toast location → **(a) originating page only, instant**

When you log a habit/workout/cardio and it earns an achievement, the toast appears on the page where you did the action, immediately. No queue-and-drain pattern.

Edge case: HealthKit autotick at 3am has no originating page. Two acceptable handlings: (i) queue the achievement, toast on next page mount (drain-on-mount as a fallback for the zero-active-page case only), or (ii) suppress toasts for autotick-earned achievements (they appear silently in the certificates list when next viewed). Default to (i) — it's cheap and matches the rest of the model. Confirm with Dean if it shows up in device verification as weird UX.

Implication: `achievements.js` evaluation fires the toast directly from the activity-write handler. No bus-driven toast subscribers on non-originating pages. Server queue exists only as a backstop for the autotick-no-active-page case.

---

#### Q3. Engagement score refresh → **(b) computed once per session, cached, bus invalidates**

Engagement page loads instantly from a cached computation. When new activity logs land (e.g. logging a second cardio session), the bus publishes; cached engagement invalidates; next read recomputes; calendar tick + count update before HTTP confirms.

Dean's exact scenario: "If I am on 1 cardio and I do another cardio session (2) and click engagement, that should show 2 cardio, and also have the cardio tick on the calendar action list." This works because Q1(a) means the Dexie write lands before the navigation. PF-11b's home-state-local.js stays as the compute engine, gains cache+invalidate semantics.

Implication: `_kv` table gets a cached engagement entry. Writes to any source table publish bus event; bus event invalidates `_kv`. PF-11b survives; doesn't become PF-40.3 catalogue work.

---

#### Q4. `members` writes ownership → **(a) all writes through `VYVEData.write('members', ...)`**

theme.js gets refactored to use the same path. Sync.js hydrate writes go through the same path. PM-97 §23.7.5 merge logic is in db.js's `members.upsert` — `VYVEData.write` delegates to it. Single merge path eliminates the "did the direct PATCH bypass the merge" question forever.

Tension with Q9: theme stays as a write target on `members` (so it can sync cross-device), but the read path is localStorage-first. Q4 covers the write; Q9 covers the read.

Implication: theme.js's 1 direct PATCH site (audit:`theme.js`, W_MEMBER) gets refactored in PF-40.4 alongside the other 5 settings.html `members` upserts.

---

#### Q5. Catalogue residency → **(a) every catalogue as first-class Dexie**

All catalogue tables join the Dexie schema during PF-40.3: `habit_library`, `workout_plans` (all 5 plans), `nutrition_common_foods` (125 rows), `personas`, `service_catalogue`, `knowledge_base`, `exercises` (TBD: real table or denormalised inside `workout_plans.programme_json` — confirm during PF-40.3).

~5MB first-login hydrate budget, masked by consent gate + persona-led walkthrough (~60-90s window per the PM-106 contract). Enables offline library-browse, offline workout-plan-switching, offline persona-switching.

Dean's intent expressed alongside Q8: "as an achievement is earned it is given instantly. Think first habit submitted achievement pops up instantly" — same instant-feel principle applies here: switching workout plans should feel instant whether on or offline because the data is local.

Implication: PF-40.3 scope is locked at ~7 catalogue tables + `running_plan_cache` (Q6).

---

#### Q6. Running plans schema → **(b) saved plans in Dexie, shared cache stays server-only**

`member_running_plans` becomes a member-scoped Dexie table — your saved plans render offline. `running_plan_cache` (the cross-member shared cache of common plan combinations) stays server-only — generation is anthropic-proxy network-bound by definition, so caching only matters server-side.

Sidesteps the codebase's only cross-member sync rule. running-plan.html plan-generation remains §23.10 (network-bound, can't AI-generate offline); plan-reading is local.

Implication: PF-40.3 adds `member_running_plans` to schema. PF-34b deferral is mostly closed by this — `running_plan_cache` stays a server concern, no schema work needed for it.

---

#### Q7. `weekly_scores` → **(a) derive client-side from `wellbeing_checkins`**

The wellbeing trend chart computes from the same `wellbeing_checkins` rows the page already reads. No new Dexie table. One source of truth. Removes a §23.11 hydrate gap by removing the gap.

Implication: wellbeing-checkin.html:1121 and the equivalent monthly-checkin.html site get a small `computeWeeklyTrend(checkins)` helper in PF-40.5. `weekly_scores` table not added to Dexie schema.

---

#### Q8. Achievements residency → **(b) pulled to Dexie on hydrate**

Server-side cron continues to evaluate authoritatively (preserves global cert numbering). Results are pulled into the `member_achievements` Dexie table (schema row already declared in db.js v2 — sync.js plan() entry was missing and gets added in PF-40.3).

Reads go local. `achievements-mark-seen` writes go through PF-40.4 `VYVEData.write`. Closes the PM-103 finding directly: server queue and local "unseen" set stay in sync via the regular sync path.

Q2(a) + Q8(b) combined: in-app actions fire instant toasts from the originating page; cron-earned achievements (HealthKit at 3am) sync to Dexie at next hydrate and toast on next page mount via the backstop in Q2's autotick handling.

Implication: sync.js plan() gets a `member_achievements` entry in PF-40.3. engagement.html and achievements.js switch from EF reads to Dexie reads in PF-40.5.

---

#### Q9. Theme + UI preferences → **(c) hybrid: localStorage fast-path + `members` sync layer**

Theme reads from localStorage on every page boot (instant, no Dexie await). `members.theme` is the cross-device sync target — writes go through Q4(a)'s `VYVEData.write` path, last-write-wins between devices.

Sets policy for future preferences (notifications, font size, accessibility): localStorage for paint-time read, `members.<field>` for sync.

Implication: theme.js keeps localStorage read; PATCH writes route via `VYVEData.write('members', {email, theme})`. Same shape applies to any future device-vs-member preference where the device path needs to be instant.

---

#### Q10. Offline UX states → **(b) notifications only; platform-alert silent**

`notifications` (1 caller, index.html) gets an offline UX state — personal notifications should explain themselves when network is dead. Lewis copy gate: one string.

`platform-alert` (11 callers) silently fails offline. Admin broadcasts most users will never see anyway. "No banner shown" is fine.

Implication: PF-40.11 copy gate is ~1 string for the notifications offline state, plus whatever the other §23.10 carve-outs need (sessions, AI moments, leaderboard, live chat). platform-alert gets no copy.

---

### 4.6.1 Decision consistency notes

- **Instant feel is the dominant theme.** Q1+Q2+Q3+Q5+Q8 all locked the "user sees the result before the network confirms" answer. The Q9 localStorage-first read continues the pattern. The PF-40.4 `VYVEData.write()` contract must support this end-to-end: return when Dexie+bus complete, never await HTTP.
- **Q4 + Q9 reconciled.** Single write path (`VYVEData.write`) for `members`; two-tier read (localStorage fast-path, Dexie/`members` row authoritative). theme.js refactor under PF-40.4 covers both.
- **Q6 narrows the cross-member sync question.** Only `running_plan_cache` would have needed it; (b) defers that. PF-40.3 schema is purely member-scoped + global catalogues with no cross-member dimension.
- **Q2 + Q8 work together.** Q2(a) handles the originating-page case; Q8(b) handles autotick + offline-earned achievements via the Dexie pull + drain-on-next-mount backstop. The PM-103 "1 toast vs 14 server queue" finding closes as a side-effect.

## 5. Audit method (reproducible)

1. `GITHUB_GET_A_REFERENCE` for `VYVEHealth/vyve-site` `refs/heads/main` → main HEAD SHA.
2. `GITHUB_GET_A_TREE` recursive at HEAD SHA → 99 tree entries, 78 in-scope source files (`*.html` + `*.js`, excluding `*.min.js`, `archive/`, `legacy/`, `.github/`, `node_modules`).
3. Parallel `GITHUB_GET_A_BLOB` fetch with `ThreadPoolExecutor(max_workers=15)` → 78/78 byte-exact (integrity verified against tree-reported size on `index.html`).
4. Multi-pattern regex grep over 40,400 lines using 18 patterns (REST URLs, EF URLs, `fetch(`, `supaFetch(`, `writeQueued(`, `VYVELocalDB.<table>.*`, `supabase.from()`, `supabase.functions.invoke()`, `Realtime channel`, PostHog, Anthropic, CDN, XHR, `sendBeacon`).
5. Per-line classification using context window (±4-6 lines) for ambiguous matches. Manual override pass on `UNKNOWN_*` buckets (5 multi-line REST URLs the single-line grep missed, 14 EF slugs not in the seed taxonomy, 7 untracked table names, 2 external API hits initially mis-bucketed).
6. Cross-reference against `master.md` §6 (table inventory) + `master.md` §7 (EF inventory) + `vyve_security_audit_2026-04-09.md` (EF deletion inventory).

Audit JSON map: `audit/pf-40-1-callsites.json` — keyed by `file:line`, includes evidence list, categories list, table/verb/ef_slug fields, and snippet. Drives PF-40.4 and PF-40.5 migrations mechanically.

### Patterns to refresh on each subsequent PF-40 ship

After each `VYVEData.write()` / `VYVEData.read()` batch lands, re-run the audit against the new main HEAD. The category-counts table at §4.1 should drift toward `LOCAL_READ` + `WRAPPER` + `NET_BOUND` only, with `R_MEMBER` / `R_CATALOGUE` / `W_MEMBER` / `W_QUEUED` / `LOCAL_UPSERT` → zero. Campaign close (PF-40.12) requires those four buckets at zero.

---

## 6. Folded into PF-40 (closed as standalone backlog items)

- **PF-14c** — Offline cold-boot (SHIPPED PM-105, history preserved in changelog).
- **PF-14d** — Offline nav between pages → folds into PF-40.9.
- **PF-14e** — Offline UX states for network-bound surfaces → folds into PF-40.11.
- **PF-15.write-optimistic** — habits/cardio/wellbeing await-order flip → folds into PF-40.4 (the API makes optimistic-first the default).
- **PF-31** — Page re-entry read path clobbers Dexie writes → folds into PF-40.5 (fat-row reads can't be clobbered) + PF-40.4 (writes guarantee Dexie state before returning).
- **PF-32** — Home page doesn't reflect cross-page writes → folds into PF-40.4 (bus publish is part of write API; every page uses `VYVEData.subscribe()` to react).
- **PF-33** — Synchronous header counter mutation missing → folds into PF-40.4 (API mutates in-memory + bus-publishes synchronously before returning).
- **PF-34** — engagement / certificates / running-plan / movement Dexie wires (partial) → certs + movement already-shipped slices survive; running-plan + engagement re-architect as PF-40 sub-items.
- **PF-34b** — running-plan.html schema work → folds into PF-40.3 (`running_plan_cache` + `member_running_plans` become first-class).
- **PF-35** — Home vs habits.html counter disagreement → resolved by PF-40.5 (both pages read from `home-state-local.js` summary, single source of truth).
- **PF-36** — Warmup orchestrator with consent-gate-as-hold-window → folds into PF-40.7 (Tier 2 pre-fetch runs during the consent-gate / walkthrough window).

## 7. Stays separate from PF-40

- **PF-14b** — Bundled-mode migration (sequences with PF-40.6 but its own commit for Apple/Google review cycle).
- **PF-21** — Bottom nav restructure (pure UI, post-PF-40.12).
- **PF-23** — Interactive guided tutorial (V2 target, post-PF-21, Lewis copy gate).
- **HAVEN clinical sign-off** (Phil-blocked, parallel work).
- **Achievements overhaul** (post-trial).
- **All copy gates** (PF-13 hydration, PF-23 tutorial, PF-27 AI-moment, PF-40.11 offline UX).

---

## 8. Editorial notes

- **Living document.** Update after each PF-40 sub-item ships. The category-count table at §4.1 should shrink toward zero on the `R_*` / `W_*` / `LOCAL_UPSERT` buckets as the campaign progresses.
- **Audit re-run cadence:** after PF-40.4 ships, after PF-40.5 ships, and at PF-40.12 (campaign closer) to confirm zero remaining migration targets.
- **JSON map at `audit/pf-40-1-callsites.json`** is the source of truth for call-site enumeration. This document is the narrative + decision log layer on top.
