# VYVE Brain — Active Working Set

> Session-scoped current state. Replaces the full master.md + changelog.md load at session start. ~30KB ceiling.
>
> **Created 09 May 2026 PM-37-Setup** as the working file for the new session-loading protocol.
> If a question needs depth not in here, fetch the canonical file on demand (see §7).

---

## 0. How to use this file

**Read order at session start (the new "Load VYVE brain" routine):**
1. This file (`brain/active.md`)
2. The relevant playbook(s) for the session goal — for a 1c migration: `playbooks/1c-migration-template.md` + `playbooks/cache-bus-taxonomy.md`
3. Last 3 changelog entries via grep on `## 2026-` headers, NOT a full file read of `changelog.md`

**This file is rebuilt (full rewrite) when:**
- A campaign milestone lands (1c-14 + cleanup commit → next campaign starts)
- Three or more sessions of incremental patches accumulate
- Live state has drifted from active.md in any way that has caused a wasted tool call

**This file is patched (atomic edit) when:**
- A migration ships — flip §3.1 row status, bump §2 SHAs, append to §4.9 if a §23 sub-rule earns working-set residency
- A §23 hard rule lands and is in the working-set hit-rate (not a cold-storage rule)
- A backlog top-row changes — patch §5

**The premium-feel framing for what gets in:** every rule in §4 must fire on a path the member sees during a typical session. If a rule is true but only matters during cron rewrites, security audits, or cold-storage paths, it lives in master.md §23 and gets fetched on demand. The lag-free contract — cache paint before auth, prefetch fan-out, queue-drain semantics, optimistic publish-before-fetch — is load-bearing. Those rules are in §4.

---

## 1. Source-of-truth chain

| Source | What it owns | When to read | What wins on conflict |
|---|---|---|---|
| `brain/active.md` (this file) | Working set for current session | EVERY session start | Loses to live state and to canonical files |
| `brain/master.md` | Deep canonical history; full §1-§22; full §23 narrative; full §24 references | When a question needs depth not in active.md | Wins over active.md on facts; loses to live state |
| `brain/changelog.md` | Every PM-NN entry, full reverse-chronological | When investigating a specific shipped change or pre-PM-30 history | Wins over master.md §19 (which lags rewrite cycles) |
| `tasks/backlog.md` | **Canonical backlog** — current top items, P0..P3 | When picking the next P0 or auditing P-state | Wins on backlog items |
| `brain/backlog.md` | **STALE** as of 09 May 2026 — last entry 28 April. Kept for archived snapshots only | NEVER for current-state decisions | Loses on backlog state |
| `playbooks/cache-bus-taxonomy.md` | The 1c-* campaign event taxonomy + subscriber map | EVERY 1c migration session | Wins on event names, schemas, subscriber wiring |
| Live Supabase / GitHub HEAD | Schema, EF versions, member counts, repo SHAs | Pre-flight EVERY session | Wins over EVERY brain file |

**Rule: when memory, chat history, and the brain disagree, the brain wins. When the brain and live state disagree, live state wins and the brain gets patched.**

---

## 2. Live state snapshot

> Refresh the SHA + version rows at the top of every session via a parallel pre-flight. The rest of this section is stable across sessions.

**HEADs (refresh at session start):**
- vyve-site main: `a8339d9c` (PM-50 ship — last shipped 11 May 2026; **Layer 2 active**)
- VYVEBrain main: `(set after this commit lands)`
- vyve-capacitor main: stub (Apr 18 2026 base) — local working tree not yet pushed
- Test-Site-Finalv3 main: marketing site, less active

**Cache-bus key currently live:**
- Pattern: `vyve-cache-v2026-05-09-pmNN-X-Y` (date prefix from PM-30)
- Last shipped: `vyve-cache-v2026-05-11-pm50-bridge-nutrition-logs-a` (one-table-per-commit Layer 2 cadence; wall-clock date prefix)
- P3 carried RESOLVED: PM-45 used wall-clock date for new campaign per PM-44 §23 sub-rule

**Mobile binaries:**
- iOS App Store: 1.2(1) **APPROVED** 28 April 2026 — bundles HealthKit + native push permission flow
- Android Google Play: 1.0.2 (versionCode 3) submitted, awaiting review

**Members (live count via Supabase, NOT cached here):**
- Cohort: build/test mix of B2C + early enterprise trial seats + internal accounts
- First paying B2C: Paige Coult, joined 13 April 2026, £20/month
- 3 admin operators in `admin_users`

**Audit-count baseline (publishing-surface call sites at HEAD `a8339d9c`, PM-50 wired nutrition_logs INSERT + DELETE — same primitive counts as post-PM-44 cleanup since PM-45 is infrastructure-only with no new publish/subscribe sites):**
- `VYVEData.invalidateHomeCache(`: 1 (subscriber-internal helper, in vyve-data.js)
- `VYVEData.recordRecentActivity(`: 1 (subscriber-internal helper, in vyve-data.js)
- `VYVEAchievements.evaluate(`: 12 (subscriber-internal helpers across achievement-handling subscribers)
- `VYVEBus.publish(`: 23 (across 14 publishing surfaces, post-PM-30..PM-44)
- `VYVEBus.subscribe(`: 29 (across the subscriber files)
- `VYVEBus.recordWrite(`: 10 (PM-46 habits × 1; PM-47 workouts-session × 1, movement × 2; PM-48 cardio × 1, movement walk × 1; PM-49 workouts-session × 1 for set:logged; PM-50 log-food × 3 across 2 INSERT sites + 1 DELETE site)
- `VYVEBus.installTableBridges(`: 1 (one call site; fifth entry added at PM-50 — now 5 entries in array, two for nutrition_logs grouped on same channel)
- `VYVEData.newClientId(` direct call sites: 4 (unchanged — log-food.html sites already had the call pre-PM-50)
- Postgres `REPLICA IDENTITY FULL` tables: 1 (nutrition_logs, migration pm50_nutrition_logs_replica_identity_full)

PM-50 wired the fifth Layer 2 bridge (nutrition_logs — first dual-op). Five coexisting bridges across 4 channels (nutrition_logs INSERT+DELETE share one channel). 21/21 self-tests including dual-op channel-grouping, INSERT/DELETE independence, kind override pattern. Use these as the pre-flight reference for PM-51+ Layer 2 wirings

---

## 3. Layer 2 Realtime bridge campaign — the active workstream

Layer 2 extends the lag-free contract to cross-device coherence. Phone logs habit → desktop tab reflects within ~2s without manual refresh. Mechanism: Supabase Realtime subscribes per-table-per-member; row events translate to bus events of the same name a local write would publish, with `origin: 'realtime'`. Self-suppression on the writing device prevents triple-firing of subscribers (`local` then `remote` then `realtime`). Layer 2 opened at PM-45.

**Layer 1c is closed.** §3.4 below carries forward the campaign closing summary for traceability; the canonical Layer 1c history lives in changelog PM-30..PM-44 entries and the now-OBSOLETE `playbooks/cache-bus-taxonomy.md` + `playbooks/1c-migration-template.md` (kept for historical reference only).

### 3.1 The 11-table plan — running state

11 tables in `supabase_realtime` publication (added at PM-45 via migration `pm45_layer2_realtime_publication_enable`). Per-table wiring lands one at a time PM-46+ following `playbooks/realtime-bus-bridge.md`.

| # | Table | Op | Bus event | Layer 1c lineage | Wired? | Notes |
|---|---|---|---|---|---|---|
| 2-1 | `daily_habits` | INSERT | `habit:logged` | PM-30 | ✓ PM-46 | Function-form `pk_field` for synthetic key (member_email\|activity_date\|habit_id). 9565ed93. |
| 2-2 | `workouts` | INSERT | `workout:logged` | PM-31 (+ PM-34, PM-35, PM-42 as alt sources via row.source) | ✓ PM-47 | `pk_field:'client_id'` (UUID col already wired in writeQueued + 2 new sites in movement.html). 8d3d6612. |
| 2-3 | `exercise_logs` | INSERT | `set:logged` | PM-32 | ✓ PM-49 | `pk_field:'client_id'` (3rd in array; already wired in workouts-session.js, simplest wiring so far). 15b9765a. |
| 2-4 | `cardio` | INSERT | `cardio:logged` | PM-33 (+ PM-34 movement_walk via row.source) | ✓ PM-48 | `pk_field:'client_id'` (matches PM-47 workouts pattern). 9e21fe04. |
| 2-5 | `nutrition_logs` | INSERT | `food:logged` | PM-36 | ✓ PM-50 | `pk_field:'client_id'`. Dual-op with row 2-6 — same channel `vyve_bridge_nutrition_logs`. a8339d9c. |
| 2-6 | `nutrition_logs` | DELETE | `food:deleted` | PM-36 | ✓ PM-50 | `pk_field:'client_id'`. Requires `REPLICA IDENTITY FULL` (migration pm50_nutrition_logs_replica_identity_full) so DELETE event carries client_id. a8339d9c. |
| 2-7 | `weight_logs` | INSERT | `weight:logged` | PM-37 | ❌ | |
| 2-8 | `wellbeing_checkins` | INSERT | `wellbeing:logged` | PM-39 (live + flush) | ❌ | |
| 2-9 | `monthly_checkins` | INSERT | `monthly_checkin:submitted` | PM-40 | ❌ | |
| 2-10 | `session_views` | INSERT | `session:viewed` (kind:'live') | PM-43 | ❌ | |
| 2-11 | `replay_views` | INSERT | `session:viewed` (kind:'replay') | PM-43 | ❌ | |
| 2-12 | `certificates` | INSERT | `certificate:earned` (NEW) | none — first L2 surface with no client publish | ❌ | Cron-driven; no `recordWrite` discipline (no own-write to suppress). Closes the PM-42 P3 cert cross-tab carryover. |

**Three tables intentionally deferred at PM-45:**

- `shared_workouts` — no `member_email` column (sharer-scoped via `shared_by`). Bridge uniformity gain > coherence gain on a low-frequency action. Revisit if real gap.
- `members` UPDATE — high-volume non-coherent UPDATE traffic (login + settings save). Cross-device persona switch is rare-event nice-to-have.
- `workout_plan_cache` UPDATE — already covered by per-event bridges (`workouts` INSERT for completions, PM-42 `programme:imported` for imports).

The deferral discipline is the most important quality-of-design call at PM-45. Bridge contract uniformity (every table has `member_email`, filtered server-side) > completeness for the sake of completeness. Same shape as PM-42 (server-cron writes out of scope for Layer 1c) and PM-43 (intentional engagement non-touches).

### 3.2 bus.js v2 API surface (post-PM-45)

```js
// New origin alongside 'local' and 'remote'
envelope.origin === 'realtime'

// Wire bridge config — call once at auth.js after Supabase client is ready.
// PM-46 introduced function-form pk_field for tables whose writing surface
// uses Prefer:return=minimal AND has no client-generated UUID column.
// PM-47 uses string-form pk_field:'client_id' for tables where the writing
// surface generates and writes a UUID column (cleaner — same string form
// as default 'id', no synthetic-tuple gymnastics).
window.VYVEBus.installTableBridges(supabase, [{
  table:            'daily_habits',
  event:            'habit:logged',
  op:               'INSERT',
  pk_field:         (row) => row.member_email + '|' + row.activity_date + '|' + row.habit_id,
                                                    // function form: synthetic key
                                                    // from row. String form 'id' also
                                                    // works (default).
  payload_from_row: (row) => ({ habit_id: row.habit_id, is_yes: row.habit_completed }),
  filter:           (row, payload) => true           // optional post-filter
}, /* ... */]);

// At every publish site that ALSO writes to a bridged table — call to
// suppress the Realtime echo of own writes (~5s TTL device-local map)
window.VYVEBus.recordWrite('daily_habits', insertedRow.id);

// Test-harness only (gated on window.__VYVE_BUS_MOCK_REALTIME)
window.VYVEBus.__mockRealtimeFire('daily_habits', 'INSERT', row);
```

Auth lifecycle: channels subscribe on `auth:ready`, unsubscribe on `auth:signed-out`, idempotent across re-auth. All channels filter server-side on `member_email=eq.<currentEmail>` with RLS as safety net.

### 3.3 Self-suppression rationale + boundary

A single member write under Layer 2 fires up to three events: `local` (writing device), `remote` (storage event echo to other tabs of same browser), `realtime` (Supabase echo to every signed-in device including writer). Writing device's third leg double-fires subscribers — wasteful, and breaks any subscriber using `origin` to drive UX text.

The fix is `recordWrite(table, pk)` at every publish site that writes to a bridged table. ~5s TTL device-local map keyed by `(table, primary_key)`. When a Realtime row arrives matching a recent-write key, the bridge suppresses before the bus event is built.

**This is not a CRDT.** Two devices writing the same primary key within 5s would mutually suppress, but that requires PK collision (rare with sequence-generated PKs). Reconcile-and-revert on POST failure stays Layer 4. Missed-event catch-up sweeps stay Layer 3. Ordering guarantees across devices are explicitly out of scope.

### 3.4 Layer 1c closing summary (historical reference)

PM-30..PM-44 across three working sessions. 14 surfaces migrated + cleanup commit. 23 publishers, 29 subscribers, 14 distinct event names. 6 real bug fixes shipped en route. 2 real engagement scope-fixes (PM-32, PM-43). 5 intentional engagement non-touches (PM-37 weight, PM-38 persona, PM-40 monthly, PM-41 share, PM-42 import). 6 §23 hard rules codified during the campaign. PM-44 closed Layer 1 with option (a) → option (b) cleanup: 34 fallback primitive call sites removed across 11 publishing files. Post-cleanup audit-count baseline: invalidate=1, record=1, evaluate=12 (subscriber-internal helpers preserved), publish=23, subscribe=29.

The bus is now the production path for all cache invalidation and achievements eval triggered from member-write surfaces. Layer 2 inherits the post-PM-44 invariant: subscribers are origin-agnostic and idempotent; the realtime echo fires the same subscriber chain a local publish would.

### 3.5 Methodology questions — running tally for Layer 2

**Resolved at PM-45:**

- Bridge contract uniformity: every bridged table has `member_email`, filtered server-side via `member_email=eq.<currentEmail>`. Tables without that column (e.g. `shared_workouts` uses `shared_by`) are out of scope for the standard bridge and need per-table custom approach if/when wired.
- Publication-enable pre-flight is mandatory before any subscriber wiring. RLS-on does NOT mean Realtime fires. New §23 sub-rule.
- High-volume non-coherent UPDATE tables (e.g. `members`) are deferred from the bridge unless real coherence gap emerges. Subscribing every device to every UPDATE produces continuous Realtime delivery for marginal benefit.
- Tables already covered by sibling per-event bridges (e.g. `workout_plan_cache` UPDATE covered by `workouts` INSERT + PM-42 `programme:imported`) are redundant and deferred.

**Open (P3, decide-and-codify when triggered):**

- `recordWrite` fallback when the writing device's `recordWrite` call fails or is missed. Subscribers see double-fire of cache-stale + achievement debounce eats triple-fires; acceptable degraded-but-functional. Promote to a real concern only if a measurable subscriber breakage emerges.
- Catch-up sweep on Realtime reconnect — when a device's connection drops and reconnects, missed events are not replayed. Subscribers tolerate (most just bust caches; fetch-on-render closes the gap on next read). Layer 3 territory.
- Two devices writing the same primary key within 5s mutually suppressing each other's echoes. Edge case dependent on PK collision; not a Layer 2 concern.


## 4. §23 hard rules — concise quick-reference

> Curated to working-set rules. Each entry: 1-3 sentences max. Master.md §23 is the canonical full text — line-numbers in parentheses point there.

### 4.1 Bus migration (PM-30..PM-40)

- **Option-(a) signalling for the duration of 1c-* (PM-30, master.md L1586).** Every `bus.publish` site replaces direct calls to the three primitives; the SUBSCRIBERS call the primitives internally. The "every member-action write must invalidateHomeCache" contract is discharged by the publishing site emitting `bus.publish` and the index.html bus subscriber calling `invalidateHomeCache` on the bus event. Cleanup commit (post-1c-14) takes option (b) once every direct-call site is gone.
- **Symmetric vs asymmetric fallback (PM-35, master.md §23).** At the `!VYVEBus` else-branch, classify per publish site: **symmetric** = pre-existing primitives present pre-bus, fallback mirrors them one-for-one (PM-30/31/32/33/34/37 + PM-39 live submitCheckin); **asymmetric** = bus path closes a primitive gap that didn't exist pre-bus, fallback intentionally does NOT add the missing primitives (PM-35/PM-36 deleteLog/PM-38/PM-40). Discriminator: "what was firing pre-bus at this publish site?" — not "what should have been firing".
- **Mixed fallback shapes within one commit (PM-36, master.md §23).** A single commit may legitimately ship symmetric fallback on some surfaces and asymmetric on others — classify per-surface. PM-36 was the first: log-food.html shipped symmetric on both insert paths and asymmetric on the delete path (which had ZERO primitives pre-bus). Pre-flight discipline: audit each publish site separately before deciding fallback shape.
- **Per-surface race-fix ordering (PM-39, master.md §23).** Initiator surfaces publish BEFORE the fetch (race-fix). Confirmer surfaces (queue-drain that re-fires queued POSTs and may fail/re-queue, e.g. `flushCheckinOutbox`) publish AFTER `res.ok` confirms server-side write. Discriminator: "does the publish initiate the write, or confirm a write that already happened?" Initiator → publish-before-fetch. Confirmer → publish-after-res.ok.
- **Self-subscribe pattern for page-owned achievement journeys (PM-37, master.md §23).** When a publishing page owns the achievement track for its own event (nutrition.html owns weight, log-food.html owns nutrition, etc.), the page self-subscribes to its own event for `VYVEAchievements.evaluate()` rather than wedging eval into the publishing function's else-branch. Cleaner; gets cross-tab eval coherence for free; debounced 1.5s in achievements.js so multi-subscriber double-fires coalesce safely. Idempotency flag is per-page (`__vyveNutritionBusWired` etc.).
- **Audit-count classification (PM-37 + PM-40, master.md L1300+).** A "publish-site primitive" is any non-comment, non-`typeof`-guard, non-function-definition line containing a CALL to one of the four primitives. Subscriber-internal calls count (real call sites at runtime). Calls inside `if (!window.VYVEBus)` else-branches count (source-code at static analysis time, not runtime paths). Comments, docblocks, function definitions, `typeof X === 'function'` guard lines do NOT count. Canonical post-PM-40 counts: see §3.2.
- **Layer 1c does NOT reconcile-and-revert on POST failure (PM-33, master.md §23).** When publish lands BEFORE the fetch (race-fix pattern), if the POST then fails, subscribers have already been told the activity happened. Cache-stale is fine (next fetch returns truth). Optimistic breadcrumb (recordRecentActivity 120s TTL) would be a minor lie until TTL — acceptable for Layer 1c. Reconcile-and-revert (publish `<event>:failed`, subscribers undo state) is Layer 4 territory; do NOT smuggle it into Layer 1c.

### 4.2 GitHub / brain commit discipline

- **Brain content NEVER goes into vyve-site (PM-13b, master.md §23).** vyve-site main branch is publicly served via GitHub Pages within ~30s of commit. Any `brain/`, `tasks/`, or root-level operational markdown that lands in vyve-site is publicly fetchable on the open internet. Brain commits go to `VYVEHealth/VYVEBrain` only. Verify the `repo` argument matches the file paths before every commit.
- **Large brain commits via Composio workbench (master.md §23).** Files >50K chars MUST commit via `run_composio_tool("GITHUB_COMMIT_MULTIPLE_FILES", args)` inside `COMPOSIO_REMOTE_WORKBENCH`, NEVER direct MCP. Direct MCP base64-corrupts large files. Verify post-commit by re-fetching and checking the first 100 chars.
- **GITHUB_COMMIT_MULTIPLE_FILES API shape.** Array field is `upserts` (NOT `files`); commit message field is `message` (NOT `commit_message`). Each upsert: `{path, content, sha}`. Refresh SHAs immediately before commit — stale SHAs cause 409.
- **Post-commit verify uses live SHA, not raw (master.md §23).** `GITHUB_GET_REPOSITORY_CONTENT` returns the live SHA + base64 content (strip whitespace, pad, decode). `GITHUB_GET_RAW_REPOSITORY_CONTENT` returns an S3-cached pre-signed URL that's stale for several minutes. Always verify via the live-SHA endpoint. S3 URL bytes must be fetched as `r.content.decode("utf-8")` not `r.text` (server returns text/plain with no charset → ISO-8859-1 default → fake mojibake on UTF-8 content).
- **Whole-tree audit pre-flight method (PM-26, master.md §23).** Before any audit, `GITHUB_GET_A_TREE` recursive on the target repo+ref → filter to source extensions → parallel-fetch every blob in that filtered list (NOT a hand-picked subset) → THEN grep. Hand-picking files generates false negatives. Cost difference: ~2 seconds on the workbench. Cost of a false-negative finding baked into a downstream design doc: measured in commits to undo. Every audit doc ends with a Source-of-truth block: tree SHA + file count fetched + grep commands.
- **`SUPABASE_` prefix forbidden on EF secrets (PM-5, master.md §23).** Dashboard rejects any custom EF secret name beginning with `SUPABASE_` — that prefix is reserved for runtime-injected vars. Saved as `MGMT_PAT` not `SUPABASE_MGMT_PAT`.
- **Native MCP for Edge Function source (PM-2, master.md §23).** `Supabase:get_edge_function` returns clean `files: [{name, content}]` array with full TypeScript intact for entrypoint + `_shared/*` siblings. Composio's `SUPABASE_GET_FUNCTION_BODY` returns ESZIP binary (compiled, types stripped) — use only for forensics, never for editing. Deploy multi-file EFs via `Supabase:deploy_edge_function` with all files listed; Composio's deploy is single-file only.

### 4.3 Schema / RLS / SQL

- **RLS auth functions wrapped in `(SELECT ...)` (PM-8, master.md §23).** Bare `auth.email()` / `auth.uid()` / `auth.role()` / `auth.jwt()` in any RLS policy `USING` or `WITH CHECK` is a SEVERE perf bug — Postgres re-evaluates per row. Wrap in `(SELECT auth.email())` and Postgres treats the result as an InitPlan, called once per query. Single biggest RLS perf knob. All 72 VYVE policies rewritten on 08 May PM-8.
- **One ALL policy preferred over multiple permissive (PM-8, master.md §23).** Multiple permissive policies for the same command are OR'd and double-cost. If an ALL policy already covers all relevant commands, do NOT add per-command policies on top — they don't tighten security, they only add cost.
- **`SUPABASE_APPLY_A_MIGRATION` silently partial-executes (master.md §23).** Multi-statement SQL can succeed at the tool level while only part has applied. For reliable trigger creation use `SUPABASE_BETA_RUN_SQL_QUERY` with `read_only:false`, one statement per call. Verify trigger creation via `pg_trigger` directly, NOT `information_schema.triggers`.
- **Trigger functions writing to RLS tables must be `SECURITY DEFINER`, not `SECURITY INVOKER` (master.md §23).** Standard discipline; codified pre-2026.
- **plpgsql composite-type cross-table NEW.col gotcha (master.md §23).** Shared trigger functions attached to multiple tables must NOT reference `NEW.<col>` for a column that exists only on some of them — even inside IF guards. plpgsql compiles the reference against the specific table's composite type before short-circuit evaluation. Use `to_jsonb(NEW) ->> 'col'` for defensive cross-table access.
- **CHECK constraint pre-flight before adding new enum values (master.md §23).** Before deploying an EF that writes a new value to a CHECK-constrained column, query `SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conname='<table>_<col>_check'` to confirm the value is in the allowed set. Otherwise the EF will silently `23514` every insert under `EdgeRuntime.waitUntil()` — no user-visible failure, just an empty audit trail.
- **`member_home_state` writer is `refresh_member_home_state(p_email)`, NOT `*/15` cron (PM-2, master.md §23).** The trigger-driven function fires AFTER INSERT OR DELETE OR UPDATE on 8 source tables (`cardio`, `daily_habits`, `replay_views`, `session_views`, `weekly_goals`, `weekly_scores`, `wellbeing_checkins`, `workouts`). Same-write-fresh: no 15-min staleness window. The `*/15` cron writes the sibling `member_stats` table. When extending derived counters, edit the trigger function — its `INSERT … ON CONFLICT ... DO UPDATE SET ...` clause is explicit and won't clobber separately-written columns.
- **Cross-check live Supabase before assuming brain authoritative on schema (06 May, master.md §23).** Before writing a migration that the brain says is missing, run a 30-second `information_schema.columns` pre-flight. If the brain says "this doesn't exist" and Supabase says it does, trust Supabase and update the brain after shipping.

### 4.4 Edge Functions / API

- **CORS default-origin pattern, no wildcard (07 May, master.md §23).** Every public-facing EF emits `Access-Control-Allow-Origin: <ALLOWED|DEFAULT>` where `DEFAULT='https://online.vyvehealth.co.uk'`. NEVER fall back to `*`, even when `Origin` is empty or `'null'`. The wildcard branch is anon-readable exposure.
- **`wss://` is a SEPARATE match-string from `https://` in CSP `connect-src` (07 May PM-2, master.md §23).** `https://*.supabase.co` does NOT cover `wss://*.supabase.co/realtime/v1/websocket`. Different schemes for the browser's match algorithm. Add `wss://` explicitly when the EF or page opens a WebSocket.
- **CSP pre-flight scans MUST include dynamic JS-built fetches (07 May PM-2, master.md §23).** Static-tag-only scans miss inline-JS-driven loads. PostHog's `eu-assets.i.posthog.com` is loaded via inline JS in auth.js — scan also: `fetch(`, `new EventSource`, `new WebSocket`, `new Image().src=`, dynamically-built `<script>` injections.
- **CSP rollouts MUST be tested in fresh incognito on the live URL before brain-commit (07 May PM-2, master.md §23).** GitHub Pages caches HTML, SW caches it again. Returning members run OLD HTML for hours after a CSP push, masking violations. Fresh incognito skips both caches. Holding the brain commit until incognito-clean is the workflow.
- **Web Crypto `importKey` for ECDSA private keys (28 April late PM, master.md §23).** `crypto.subtle.importKey('raw', ...)` for an ECDSA private key with `'sign'` usage is INVALID per Web Crypto spec — `'raw'` is for public keys with `'verify'` only. Private keys must be `'jwk'` (with `kty:'EC'`, `crv:'P-256'`, `d`, `x`, `y`) or `'pkcs8'`. Deno's Edge Runtime enforces strictly and throws `Invalid key usage`.
- **SW push handler is required for web push delivery (28 April PM, master.md §23).** Without `self.addEventListener('push', e => e.waitUntil(self.registration.showNotification(title, opts)))` in the SW, payload arrives, decrypts, and is discarded silently — no banner, no error logged anywhere visible. ALL future SW edits must preserve this listener.
- **SW notificationclick must read `data.url` (28 April PM, master.md §23).** Click-through routing for any push trigger that ships a deep-link URL requires `notificationclick` listener reading `e.notification.data?.url`, then `clients.matchAll` + `client.focus()` (preferred) or `clients.openWindow(url)` (fallback).
- **WASM-importing libraries CANNOT run inside Supabase EFs (07 May PM-5, master.md §23).** Deploy succeeds; invocation returns 503 with `x-served-by: base/server` (gateway-level BOOT_ERROR). Supabase EF runtime sandboxes WASM init. If you need WASM, the work belongs on a runner outside Supabase: GitHub Actions (preferred for VYVE), Cloudflare Workers, Fly.io.

### 4.5 Portal / client / cache (the premium-feel rules)

- **Cache invalidation on member-authored writes (PM-13, master.md §23).** Every page that writes a row representing a member action MUST call `VYVEData.invalidateHomeCache()` on success. The home dashboard's `vyve_home_v3_<email>` cache is wiped explicitly — without this call, home paints pre-write state on next visit and "flicker-corrects" itself when the EF round-trip returns. Heartbeat-style writes (tracking.js PATCH every 15s) are explicit exceptions. Plan-state writes (workout_plan_cache PATCH after `completeWorkout`) are exceptions for the same reason. Under Layer 1c, the contract is discharged via bus subscribers — see §4.1 option-(a).
- **Cache-paint-before-auth contract every gated page must hold (PM-12, master.md §23).** Cache paint runs SYNCHRONOUSLY on script parse, NOT inside `onAuthReady`. Two satisfying patterns: synchronous IIFE in `<head>` or top-of-body; immediate-call `loadPage()` with cache-discovered email. Test: ON A WARM CACHE LOAD, can the cache-paint reach the DOM before any `<script defer>` tag finishes executing? If no, the page violates the rule. The `_vyveWaitAuth()` helper is required boilerplate for the second pattern. Greppable check: `grep -n "vyveAuthReady', () => load" *.html` should return zero hits across the portal.
- **theme.js is the ONE script tag without `defer` (PM-7, master.md §23).** theme.js runs synchronously at parse time to set `<html data-theme="dark|light">` from localStorage BEFORE the body renders. With `defer`, dark-mode users see a white flash on every navigation. Every other script that touches `window.vyveSupabase` or `window.vyveCurrentUser` is fine to defer because they all wait for `vyveAuthReady` / `VYVE_AUTH_READY` Promise.
- **SW HTML caching strategy is stale-while-revalidate, not network-first (PM-7, master.md §23).** Cached HTML returns instantly from CacheStorage (~5ms); background `fetch()` repopulates for the next navigation; first-ever-visit falls through to network. Network-first waited a full network round trip on every navigation, silently bottlenecking the entire perf project until PM-7 caught it. Freshness preserved by cache-version bump on every deploy — members are at most ONE navigation behind latest. The SW cache-version bump becomes load-bearing under SWR.
- **Auth-ready Promise pattern + script-tag defer audit (PM-6, master.md §23).** `await window.VYVE_AUTH_READY` (Promise resolved with `{user, supabase}`) is the modern pattern. Two-path back-compat: `if (window.vyveCurrentUser) { fn(); } else { addEventListener('vyveAuthReady', fn, { once: true }); }`. Both are defer-safe by construction. When considering whether to defer a globally-depended-on script, use a depth-tracking walker that distinguishes top-level (parse-time) refs from function-body refs.
- **Per-page init must actually be invoked (06 May, master.md §23).** A function declaration is not an init wiring. `workouts-config.js` had `async function init()` declared but never called — entire workout resume feature silently dead until member feedback. Pattern: every page-init script needs an explicit invocation site, idempotent boot guard (`_vyveBootRan`), and handles BOTH the auth-already-fired race AND the auth-fires-later case. Audit by grepping `function init` / `async function init` and confirming a matching invocation site.
- **Home page fans out and prefetches (PM-5, master.md §23).** When `member-dashboard` returns on `index.html`, it MUST also write the same response into `vyve_engagement_cache` and `vyve_certs_cache`. Background prefetch via `_vyvePrefetchNextTabs(email, jwt)` fires fire-and-forget into `vyve_members_cache_<email>` (nutrition.html) and `vyve_programme_cache_<email>` (workouts page). Wrapped in `requestIdleCallback`. Network gate via `navigator.connection`: skips on saveData mode and any effectiveType other than 4g/wifi. If a new heavy-traffic page lands, add a third prefetch — don't fan-out unrelated EF calls.
- **Head-script `defer` audits must check inline consumers (PM-20, master.md §23).** Lifting an externally-imported script from sync-in-head to `defer` does NOT teleport its globals into a phase that inline `<script>...</script>` blocks earlier on the page can see. Audit pattern before deferring: grep host file for `<script>...</script>` blocks (no `src`) AND for `window.<global>` / bare `<global>` references. If matches, the lift is a real refactor.
- **Offline-honest surfaces (PM-10, master.md §23).** Pages calling Anthropic-proxy or streaming live MUST gate with `VYVEData.requireOnline()`. Gate is scoped: page-load gate for surfaces with nothing to show offline; action-only gate for surfaces with cached state worth showing. NEVER silent-queue an AI submission with no response — worse than a clean refusal.
- **`Prefer: resolution=ignore-duplicates,return=minimal` on every queued PostgREST insert (master.md §23).** Outbox MUST set this header on every POST that has a `client_id` partial unique index. Without it, a re-flush after a successful-but-network-dropped insert will 409 and dead-letter a row that actually persisted.
- **SW cache bump pattern.** `vyve-cache-v[date][letter]` pattern. Network-first for HTML means HTML-only changes don't require a bump; non-HTML (JS, CSS, images, sw.js itself) still do. Under SWR (current), bumps are mandatory eviction triggers — without them, stuck-old-cache members see arbitrarily-stale HTML indefinitely.
- **BST timezone bug (master.md §23).** Always construct local dates via `d.split('-')` → `new Date(+y, +m-1, +d)` in portal JS. `new Date(dateString)` parses as UTC and drifts by an hour in BST. Recurring class of bug.

### 4.6 Notification routing (29 April PM, master.md L1438+)

- **Every notification carries a route to its destination.** Tapping any notification on any surface lands the member precisely where the notification refers to. Single source of truth: `send-push` v13 reads `input.data.url` and writes it to `member_notifications.route`.
- **Currently routed types:** `habit_reminder` → `/habits.html`; `checkin_complete` → `/wellbeing-checkin.html`; `streak_milestone_*` → `/engagement.html#streak`; `achievement_earned_<slug>_<tier>` → `/engagement.html#achievements&slug=<slug>&tier=<tier>`.
- **Adding a new type:** decide destination URL (page + hash if applicable) → if going through `send-push`, pass `data: { url: '<route>' }`; if inserting `member_notifications` directly, pass `route: '<url>'` AND ensure push fan-out matches → if hash anchor, confirm target page has matching DOM `id` or `parseHashRoute()` handler → add to the routed-types table.
- **URL fragment grammar:** `#<id>&k1=v1&k2=v2` (id first, then `&`-separated params, NOT `?`-prefixed). Changing the grammar requires updating route generators + `parseHashRoute()` parser + any backfilled rows.

### 4.7 HealthKit / iOS specifics

- **HK auth resets on every binary upgrade (29 April PM-4, master.md §23).** Every signed-binary change (1.x → 1.y, PWA → native, dev → release) resets HealthKit per-app auth state to "not determined", regardless of App ID continuity. `member_health_connections.platform` row presence is NOT sufficient signal that HK is functional. Recovery: detect all-probes-unauthorized pattern and re-prompt.
- **Never synthesise `native_uuid` (29 April PM-4, master.md §23).** If the Capgo plugin doesn't return `platformId`/`id`/`uuid`/`metadataId`, `sampleToEF()` returns null and the caller skips the sample. Synthetic fallback shapes from `start_end_value` produce fragile dedupe keys that collide with themselves when plugin behaviour shifts across versions.
- **Supabase JS `.in()` queries hit 1000-row default cap (29 April PM-4, master.md §23).** Multi-type queries combining high-volume types (heart_rate ~2.5k/30d) with low-volume types (workouts <200/30d) under one `.in([...])` predicate silently truncate the low-volume types when the high-volume type fills the cap. Always split into per-type queries with explicit `.limit()` when sample types have wildly different cardinalities.
- **`platform_alerts.client_diagnostics` is the first-look diagnostic for HK regressions (29 April PM-4, master.md §23).** Capgo plugin doesn't surface "permission was reset on binary upgrade" — every probe just returns generic `Authorization not determined`. Query `SELECT created_at, alert_type, payload FROM platform_alerts WHERE alert_type LIKE 'health_%' ORDER BY created_at DESC LIMIT 20`.

### 4.8 Operational discipline

- **Credentials surfaced in chat or screenshots must be rotated (07 May PM-4, master.md §23).** Discipline is rotation-on-exposure regardless of whether the chat platform is a known leak source. Pattern: token displayed → revoke → re-generate without showing → store directly to project secret without it transiting chat. Applies to APNs `.p8` contents, Supabase service-role JWTs, GitHub PATs, OAuth client secrets.
- **Brain §24 reconciliation pre-flight whenever a stale flag is suspected (07 May PM-4, master.md §23).** Every audit finding gets a `tool_search`-grade fact-check against live state before sequencing. The "Capacitor not a git repo" flag had been in the brain for weeks — a 5-second `GITHUB_GET_A_REPOSITORY` call surfaced that the repo had existed since 18 April. Different shape, lower effort.
- **Bulk EF-source operations belong in server-side EFs, not chat fetch loops (07 May PM-4, master.md §23).** When working with multiple EFs' source bodies (backup, audit, refactor sweep), define the loop body as a Deno EF, deploy with `MGMT_PAT` access, register a cron, invoke once manually, let the cron own recurrence. 60 EFs × 10KB each via chat = 600KB context burn for a server-to-server file shuffle.
- **Exercise library renames must be paired with `exercise_logs` rename migration (08 May PM-2, master.md §23).** When renaming an exercise in `workout_plans`, also: seed an alias row in `exercise_canonical_names`, run a self-touch UPDATE on `exercise_logs` to fire the trigger and rewrite historical rows, audit `exercise_name_misses` after to confirm zero stragglers. Trigger system is a safety net, not a substitute for migration discipline.
- **Perf rewrites of dormant cron functions verify against live source (PM-16, master.md §23).** When picking up a perf-rewrite ticket against a function that hasn't been touched in days, do not trust the diagnosis embedded in the prompt. Fetch the live source via `Supabase:get_edge_function`, run `EXPLAIN ANALYZE` against the actual query. Codebase moves between when an audit is written and when the rewrite ships.
- **Audit-output discipline (PM-26, master.md §23).** Every audit report or design doc that depends on grep-style claims about a code surface MUST end with a Source-of-truth block: exact tree SHA + exact file count fetched + exact grep commands used. Without those three, the reader can't tell whether the finding was generated against a complete view.

### 4.9 New rules from this session (PM-37-Setup)

- **Session loading discipline.** "Load VYVE brain" routine reads `brain/active.md` + relevant playbooks (matched to the session goal) + recent changelog tail via grep on `## 2026-` headers, NOT full master.md or full changelog.md. Full files remain canonical for deep-history questions; the active file is the working set. If a question requires depth not in active.md, fetch the canonical file on demand using §7 as the lookup table.
- **Deferred whole-tree audit.** Whole-tree primitive audits run AFTER the patch ships, in parallel with the brain commit, NOT as a pre-flight requirement. Pre-flight fetches only the files the migration touches (with a separate sub-audit if the migration's own pre-flight needs broader signal). The audit-count discipline (PM-37/PM-40) applies to the post-ship audit, not the pre-ship state.
- **Migration template stability (post-PM-36).** Layer 1c migrations after PM-30..PM-36 follow a stable shape captured in `playbooks/1c-migration-template.md`. Pre-flight references the template rather than re-deriving the migration mechanics every session. Asymmetric / symmetric / mixed fallback decisions still require per-surface classification at pre-flight time, but the rationale is referenced via §4.1 sub-rules rather than re-narrated.
- **Layer 2 publication-enable pre-flight (PM-45, 10 May 2026).** Before wiring any subscriber to a Realtime row event, verify the table is in the `supabase_realtime` publication via `pg_publication_tables`. RLS being enabled on the table does NOT mean Realtime events fire — publication membership is independent of RLS. PM-45 added 11 tables; `shared_workouts`, `members`, `workout_plan_cache` are intentionally NOT in the publication for documented reasons. Pre-flight check is mandatory before any PM-46+ subscriber wiring assumes a table is bridged.
- **Layer 2 self-suppression discipline (PM-45).** Every publish site that writes to a bridged table MUST call `VYVEBus.recordWrite(table, pk)` immediately after the row insert resolves. Failure causes the writing device to double-fire subscribers (`local` then `realtime` ~2s later under different origins). Mitigation: subscribers are idempotent for cache-stale and achievement debounce 1.5s eats triple-fires — degraded-but-functional, but the explicit `recordWrite` is the discipline. `recordWrite` is added to the audit-count primitives at Layer 2: each PM-46+ commit should expect `+N` `VYVEBus.recordWrite(` call sites where N matches the publish site count for the bridged table.
- **Bridge contract uniformity (PM-45).** Every bridged table has a `member_email` column, filtered server-side via `member_email=eq.<currentEmail>`. Tables breaking this contract (e.g. `shared_workouts` uses `shared_by` for sharer scope) are deferred from the standard bridge or need a per-table custom filter approach if/when wired. Bridge uniformity > completeness for the sake of completeness — same shape as PM-42 (server-cron writes out of scope for Layer 1c) and PM-43 (intentional engagement non-touches).
- **Function-form `pk_field` for `Prefer:return=minimal` writing surfaces (PM-46, 11 May 2026).** Tables whose writing surface uses `Prefer: return=minimal` (the existing PM-30..PM-44 outbox pattern via `VYVEData.writeQueued`) never see the server-generated PK on the writing device. The synthetic-key approach: bridge config declares `pk_field` as a function `(row) => synthetic_key`; bridge derives the same synthetic key from the Realtime row payload; suppression matches. The synthetic key MUST be the unique constraint tuple for the table (e.g. `daily_habits` is unique on `(member_email, activity_date, habit_id)`) so the bridge can reliably derive it from the row. Surfaces that already use `return=representation` (or could be changed to) keep using string-form `pk_field: 'id'`. Both forms coexist; the bus.js dispatch handles `typeof entry.pk_field === 'function'` branch first, falls through to string-or-default 'id' otherwise.
- **String-form `pk_field:'client_id'` for tables with client-generated UUID columns (PM-47, 11 May 2026).** Tables that have a dedicated `client_id` UUID column populated by the writing surface (via `VYVEData.newClientId()`) use string-form `pk_field:'client_id'`. Cleaner than the synthetic-tuple function form: matches the default `'id'` shape, no per-table synthetic-key gymnastics. `vyve-offline.js writeQueued` auto-injects `client_id` into JSON body if not present — so any outbox-routed write to a table with the column gets it for free. Raw-fetch writes (e.g. `movement.html`) need an explicit `VYVEData.newClientId()` + addition to the INSERT body. The bridge `payload_from_row` typically maps `row.client_id → workout_id` (or equivalent) so subscribers see the same UUID local publishes carry. Legacy rows with NULL `client_id` → bridge sees `pk=undefined` → no recordWrite match → echoes through with `workout_id: null` (acceptable; no live writer to suppress).
- **`REPLICA IDENTITY FULL` for DELETE bridges that need non-PK row fields (PM-50, 11 May 2026).** Supabase Realtime DELETE events carry only the primary key column when the table uses default replica identity (`relreplident = 'd'`). Bridges with `pk_field` other than the table PK (e.g. `pk_field:'client_id'` on `nutrition_logs.id` UUID PK) need the old row's full column set to match recordWrite suppression keys. Set `REPLICA IDENTITY FULL` on the table via migration before wiring the DELETE bridge. WAL cost is per-row (entire old tuple persisted) — negligible on low-volume tables, non-trivial on high-volume tables (consider INDEX form with a covering index instead in that case). Document the requirement in the bridge config comment. Verify via `SELECT relreplident FROM pg_class WHERE relname = 'X'` → expect `'f'`.

---

## 5. Backlog top working set (P0/P1 only)

**Source: `tasks/backlog.md` (canonical). This section is a curated mirror — fetch the full file for P2/P3 tail.**

### P0 (next session)

- **✅ CLOSED — PM-46:** vyve-site `9565ed93`. First Layer 2 table-bridge wiring shipped. `daily_habits` INSERT → `habit:logged` echoes cross-device. Function-form `pk_field` introduced for `Prefer:return=minimal` writing surfaces (synthetic key: `member_email|activity_date|habit_id`). 4-file atomic commit (bus.js +467, auth.js +1799, habits.html +578, sw.js cache bump). 10/10 PM-46 self-tests + 45/45 PM-45 regression all passing. Two-device manual verify pending Dean. New §4.9 working-set rule codified (function-form pk_field discipline).

- **✅ CLOSED — PM-47:** vyve-site `8d3d6612`. Second Layer 2 table-bridge wiring shipped. `workouts` INSERT → `workout:logged` echoes cross-device via `pk_field:'client_id'`. 5 publisher classification: 3 INSERT into `workouts` (recordWrite added), 2 INSERT into `custom_workouts` (no bridge echo, no recordWrite). 4-file atomic commit (auth.js +1678, workouts-session.js +458, movement.html +1354, sw.js cache bump). 15/15 PM-47 self-tests across one group (two-bridge coexistence proven); 10/10 PM-46 + 45/45 PM-45 regression unchanged. New §4.9 working-set rule codified (string-form pk_field:'client_id' discipline). Two-device manual verify pending Dean.

- **✅ CLOSED — PM-48:** vyve-site `9e21fe04`. Third Layer 2 table-bridge wiring shipped. `cardio` INSERT → `cardio:logged` echoes cross-device via `pk_field:'client_id'`. 2 publishers (cardio.html PM-33, movement.html walk-branch PM-34), both needed explicit `VYVEData.newClientId()` (neither uses writeQueued). 4-file atomic commit: auth.js (+1254 chars), cardio.html (+500), movement.html (+421), sw.js cache bump. 17/17 PM-48 self-tests across one group (three-bridge coexistence). All previous 60+ tests still passing. Movement.html walk branch was deliberately deferred at PM-47 ("cardio.client_id wiring is PM-48's job") — comment preserved in code with PM-47/PM-48 history.

- **✅ CLOSED — PM-49:** vyve-site `15b9765a`. Fourth Layer 2 table-bridge wiring. `exercise_logs` INSERT → `set:logged` echoes cross-device via `pk_field:'client_id'`. Smallest wiring so far — exercise_logs.client_id was already wired in workouts-session.js (single publish site already generates client_id via VYVEData.newClientId() and the PM-32 publish envelope already mapped `exercise_log_id` from `payload.client_id`). 3-file atomic commit: auth.js (+1214, exercise_logs entry as fourth in array), workouts-session.js (+380, recordWrite inside _publishSetLogged), sw.js cache bump. 17/17 PM-49 self-tests across one group (four-bridge coexistence).

- **✅ CLOSED — PM-50:** vyve-site `a8339d9c`. Fifth Layer 2 table-bridge wiring shipped. **First dual-op bridge in the campaign** — `nutrition_logs` INSERT (`food:logged`) + DELETE (`food:deleted`), grouped on shared channel `vyve_bridge_nutrition_logs`. 3 publish sites in log-food.html (logSelectedFood, logQuickAdd, deleteLog) — all already had `client_id` in scope from PM-12/PM-36 era, just needed recordWrite. 3-file atomic vyve-site commit (auth.js +1627 chars for two array entries, log-food.html +859 chars for three recordWrite sites, sw.js cache bump) plus one Supabase migration (pm50_nutrition_logs_replica_identity_full) — required because default replica identity only carries PK in DELETE events. 21/21 PM-50 self-tests covering channel auto-grouping, INSERT/DELETE independence, kind override, REPLICA IDENTITY FULL semantics. All 80+ previous tests still passing. New §4.9 sub-rule codified (REPLICA IDENTITY FULL discipline for non-PK-bearing DELETE bridges).

- **PM-51 / Sixth Layer 2 table-bridge wiring (`weight_logs`).** Next in §3.1 (row 2-7). Pre-flight:

  1. Inspect `weight_logs.client_id` column presence (likely present if added in same wave as other client_id columns).
  2. Find publish site for `weight:logged` event (or whatever the existing event name is — confirm via search).
  3. Add bridge entry (sixth in array).
  4. recordWrite at publish site.
  5. sw.js cache bump.
  6. Two-device verify.

  Estimate: ~20-30 min. If single publish site and client_id pre-existing, this is PM-49 territory.

### P1 (working set)

- **Phase 3 grid extensions.** engagement.html Achievements tab live. Next: dashboard slot showing latest unseen / next-up tier; first-run tour integration.
- **Achievements Phase 2 sweep extensions.** `achievements-sweep` currently handles only `member_days`. Extend for HK lifetime metrics, `full_five_weeks`, `charity_tips`, `personal_charity_contribution`, `tour_complete`, `healthkit_connected`, `persona_switched`. Clean orphan `running_plans_generated` from evaluator INLINE map.
- **Native push notification triggers + cadence design.** APNs end-to-end live since PM 27 April. Decoupled from binary releases — deployable via web pushes + EFs without App Store cycle. Triggers needed: daily habit reminders local time, streak-risk alerts, achievement-tier-earned celebrations, live session start, weekly/monthly check-in nudges, re-engagement after 7 days inactive. Each = EF + cron + Lewis copy + frequency cap.
- **Android FCM** — Capacitor/FCM setup + Google Play binary. Pending Dean test device.
- **HAVEN persona auto-assignment** — clinical sign-off blocking (Phil).
- **VYVE_Health_Hub.html** — clinical assessment flow awaiting Phil's clinical sign-off. Same gate as HAVEN. Intentionally unlinked from nav.
- **Capacitor wrap parity.** vyve-capacitor local working tree not yet pushed to repo.

### Enterprise / commercial blockers (Lewis-side, tracked here for visibility)

- Brevo logo removal — ~$12/month, Lewis action before enterprise demo.
- Facebook Make connection refresh — **EXPIRES 22 May 2026**. Lewis to renew URGENTLY.
- B2B volume tier definition — Lewis + Dean, before first contract.
- Public-launch comms draft — week of 11 May 2026.

### P3 carried (decide-and-codify when triggered)

- log-food.html cross-tab diary-cache coherence (defer to Layer 3).
- `recordWrite` fallback when missed at a publish site (acceptable degraded-but-functional under self-suppression idempotency; promote only if real subscriber breakage emerges).
- Catch-up sweep on Realtime reconnect (Layer 3 territory).

---

## 6. Credentials, URLs & references (working-set only)

**Repos:**
- `VYVEHealth/vyve-site` (private) — portal source → `online.vyvehealth.co.uk` via GitHub Pages
- `VYVEHealth/VYVEBrain` (private) — brain canonical
- `VYVEHealth/vyve-capacitor` — Android/iOS build infrastructure
- `VYVEHealth/Test-Site-Finalv3` — marketing site → `www.vyvehealth.co.uk`

**Supabase:**
- Project ID: `ixjfklpckgxrwjlfsaaz` (West EU / Ireland, Pro plan)
- Auth storageKey: `vyve_auth` (localStorage)

**Portal:**
- Live URL: `online.vyvehealth.co.uk`
- Strategy dashboard: `online.vyvehealth.co.uk/strategy.html` (password: `vyve2026`)
- Demo reset: `online.vyvehealth.co.uk/index.html?reset=checkin`

**Stripe:**
- Live link: `buy.stripe.com/00wfZicla1Em0NnaIB93y00` (→ onboarding_v8.html)
- Coupons: `VYVE15`, `VYVE10`

**Brand tokens:**
- VYVE Dark `#0D2B2B`, Teal `#1B7878`, Teal Light `#4DAAAA`, Gold `#C9A84C`
- Fonts: Playfair Display (headlines), Inter (body)
- Tagline: "Build health before it breaks."

**Email:** `team@vyvehealth.co.uk` for ALL business comms (never personal Hotmail / Gmail).

**Cache-bus pattern:** `vyve-cache-v[date][pmNN-tag-letter]` — bump in same atomic commit as portal changes.

**SHAs (refresh at session start, see §2):** vyve-site main + VYVEBrain main.

---

## 7. What's NOT in this file — fetch the canonical doc on demand

| Question shape | Canonical source | When to fetch |
|---|---|---|
| Legal name, ICO, team roster, full personnel | `master.md` §1 | Legal, contracts, ICO renewal, employment |
| Mission/vision/competitive positioning | `master.md` §2 | Sales decks, comms, pitch refinement |
| Pricing structure, ARR targets, CAC math | `master.md` §3 | Investor prep, pricing changes |
| Enterprise pipeline (Sage deal, prospects) | `master.md` §4 | Sales-side work, HubSpot updates |
| Full tech stack (retired tech, replacements) | `master.md` §5 | Onboarding new contractors, docs |
| **Schema (85 tables, full column lists)** | `master.md` §6 + live `information_schema` | Schema-deep work, migrations, RLS audits |
| **Edge Function full inventory** | `master.md` §7 + `Supabase:list_edge_functions` | EF deploy planning, retirement audits |
| Portal page-by-page behaviour | `master.md` §8 | UX/UI work outside the active page |
| Onboarding flow detail | `master.md` §9 | Onboarding EF changes |
| **Persona prompts in full** (NOVA/RIVER/SPARK/SAGE/HAVEN) | `master.md` §10 | Persona prompt edits, HAVEN clinical work |
| AI feature inventory | `master.md` §11 | AI feature scoping |
| **Achievements full architecture** (32 metrics × 327 tiers, copy approval, sweep extensions) | `master.md` §11A | Ladder edits, evaluator wiring |
| Operational AI skills (Lewis-side) | `master.md` §12 | Lewis-side ops, content strategy |
| Employer + member dashboards | `master.md` §13 | Dashboard EF/UI work |
| Workout library + exercise architecture | `master.md` §14 | Workout content work |
| Marketing, brand, content production | `master.md` §15 | Marketing site work |
| **Full GDPR pipeline** (erasure, export, retention) | `master.md` §16 + `brain/gdpr_*.md` | DSAR work, GDPR auditing |
| Charity mechanic detail | `master.md` §17 | Charity comms, partner updates |
| Marketing site page inventory | `master.md` §18 | Marketing site changes |
| **Full §19 Current Status** (pre-PM-30 history) | `master.md` §19 | Investigating something pre-PM-30 |
| Enterprise blockers, demo readiness | `master.md` §20 | Pre-demo audit |
| Outstanding build items + priorities | `master.md` §21 | Quarterly planning |
| Open decisions (mostly Lewis-side) | `master.md` §22 | Quarterly review |
| **Full §23 narrative** (including pre-PM-30 rules not in §4 above) | `master.md` §23 | When §4 doesn't cover it |
| Full credentials list, third-party API keys | `master.md` §24 | Credential rotation, ops |
| **PM-NN entries pre-PM-30** | `changelog.md` (full) | Investigating any pre-PM-30 ship |
| **Current 1c migration template + commit shape** | `playbooks/1c-migration-template.md` | EVERY 1c migration session |
| Cache-bus event taxonomy + subscriber maps | `playbooks/cache-bus-taxonomy.md` | EVERY 1c migration session |
| Full backlog tail (P2/P3) | `tasks/backlog.md` (full file) | Backlog grooming, sequencing |
| Disaster recovery procedure | `playbooks/disaster-recovery.md` | DR drill, real DR event |
| Brain sync protocol | `playbooks/brain-sync.md` | This file's commit-discipline parent |

---

## 8. Editorial notes

- **Last full rebuild:** 09 May 2026 PM-37-Setup (this commit)
- **Next rebuild trigger:** every 3 Layer 2 table-bridge wirings or campaign closure.
- **Commit discipline for active.md edits:**
  - Patches: §2 SHA bumps, §3.1 status flips, §4 new sub-rules earning working-set residency, §5 backlog reordering — all atomic with the session's main brain commit
  - Rebuilds: campaign milestones, ≥3 patches accumulated, drift detected — full rewrite against current master.md
- **What does NOT belong in active.md:** anything from §7's "fetch on demand" list. If a question keeps surfacing that requires fetching the same canonical section session after session, that's the rebuild signal — promote it into active.md on the next rebuild.
