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
- vyve-site main: `b053cd8a` (PM-42 ship — last shipped 09 May 2026)
- VYVEBrain main: `(set after this commit lands)`
- vyve-capacitor main: stub (Apr 18 2026 base) — local working tree not yet pushed
- Test-Site-Finalv3 main: marketing site, less active

**Cache-bus key currently live:**
- Pattern: `vyve-cache-v2026-05-09-pmNN-X-Y` (date prefix from PM-30)
- Last shipped: `vyve-cache-v2026-05-09-pm42-import-a`
- P3 carried: convention drift (date prefix may not match wall clock — decide on calendar advance)

**Mobile binaries:**
- iOS App Store: 1.2(1) **APPROVED** 28 April 2026 — bundles HealthKit + native push permission flow
- Android Google Play: 1.0.2 (versionCode 3) submitted, awaiting review

**Members (live count via Supabase, NOT cached here):**
- Cohort: build/test mix of B2C + early enterprise trial seats + internal accounts
- First paying B2C: Paige Coult, joined 13 April 2026, £20/month
- 3 admin operators in `admin_users`

**Audit-count baseline (publishing-surface call sites at HEAD `b053cd8a`, post-PM-42):**
- See §3.2 for the canonical numbers — they are the pre-flight reference for PM-41

---

## 3. Layer 1c migration campaign — the active workstream

The 1c-* campaign migrates every direct-call cache primitive (`invalidateHomeCache`, `recordRecentActivity`, `evaluate`) onto the typed event bus (`bus.publish`). 14 surface migrations originally planned; **PM-42 reshape**: certificate dropped from campaign (server-side cron-driven write, no client publish site → §23 PM-42 rule), 1c-13 row repurposed for `programme:imported`. **13 surfaces shipped, 1 remaining (1c-14 live-sessions). Cleanup commit closes Layer 1.**

### 3.1 The 14-row plan — reconciled (post-PM-42)

| # | Surface | PM tag | Status | Event | Pre-bus shape | Fallback | Notes |
|---|---|---|---|---|---|---|---|
| 1c-1 | habits.html log + autotick + undo | PM-30 | ✅ shipped | `habit:logged` | invalidate + record + evaluate | symmetric | First migration; bus.js shipped same era |
| 1c-2 | workouts-session.js completeWorkout | PM-31 | ✅ shipped | `workout:logged` source:`programme`/`custom` | 3 calls + 1 fallback evaluate | symmetric | + scope-fix programme_cache |
| 1c-3 | workouts-session.js saveExerciseLog | PM-32 | ✅ shipped | `set:logged` | direct fetch + invalidate | symmetric | Pure decouple |
| 1c-4 | cardio.html log | PM-33 | ✅ shipped | `cardio:logged` source:`cardio_page` | 3 calls | symmetric | + race-fix + scope-fix |
| 1c-5 | movement.html walk + non-walk | PM-34 | ✅ shipped | `cardio:logged` movement_walk / `workout:logged` source:`movement` | 3 calls × 2 paths | symmetric | + scope-fix |
| 1c-6 | workouts-builder.js custom workout create | PM-35 | ✅ shipped | `workout:logged` source:`builder` | evaluate only | **asymmetric** | First asymmetric; + scope-fix (no current invalidation = real bug) |
| 1c-7 | log-food.html insert ×2 + delete | PM-36 | ✅ shipped | `food:logged` kind:`search`/`quickadd` / `food:deleted` | inserts: eval + invalidate; **delete: ZERO primitives (real bug)** | **mixed** | First commit shipping mixed fallback shapes |
| 1c-8 | nutrition.html weight log | PM-37 | ✅ shipped | `weight:logged` | invalidate + evaluate | symmetric | Self-subscribe pattern established |
| 1c-9 | settings.html persona switch | PM-38 | ✅ shipped | `persona:switched` | direct fetch only | **asymmetric** | + scope-fix (members_cache + home_v3 staleness on persona change was a real bug) |
| 1c-9b | ~~settings.html save~~ | n/a | **MERGED** into 1c-9 | — | — | — | The original taxonomy 1c-10 row "settings save" was dropped from the campaign post-PM-37; backlog and changelog both renumbered. Settings save IS persona save in practice today — no separate publish surface exists |
| 1c-10 | wellbeing-checkin.html submit + flush | PM-39 | ✅ shipped | `wellbeing:logged` kind:`live`/`flush` | live: invalidate + evaluate; flush: invalidate only | symmetric (mixed pre-bus shape) | First initiator + confirmer pattern; PM-39 §23 race-fix-ordering rule |
| 1c-11 | monthly-checkin.html submit | PM-40 | ✅ shipped | `monthly_checkin:submitted` | evaluate only | **asymmetric** | First post-PM-30 migration with NO new bus.js wiring (page already loaded bus.js) |
| 1c-12 | workouts-session.js shareWorkout + shareCustomWorkout, workouts-programme.js shareProgramme | PM-41 | ✅ shipped | `workout:shared` kind:`session`/`custom`/`programme` | A: eval; B: ZERO; C: eval | mixed | Three publish surfaces, one event with discriminator. shared-workout.html is read-only viewer (no publish site). Mirror of PM-36 + PM-39 mixed. Confirmer pattern (publish-after-res.ok) — payload carries share_code from EF response. Engagement non-touch (4th). |
| 1c-13 | workouts-programme.js confirmImportPlan | PM-42 | ✅ shipped | `programme:imported` (NEW) + `workout:logged source:'builder'` (REUSES PM-35) | ZERO both branches | asymmetric both | **Certificate dropped from campaign** (server-side cron-driven write, §23 PM-42 rule). Slot repurposed for confirmImportPlan — single function, two events gated on isProg. Real bug fix: 800ms setTimeout(loadProgramme) workaround replaced with synchronous self-subscriber. Engagement non-touch (5th). |
| 1c-14 | session-live.js (shared by 8 live-* pages) | TBD | 📋 next P0 | likely `session:viewed` (with `kind:'live'\|'replay'` discriminator? — pre-flight decides) | TBD pre-flight | TBD | Eight live-session pages all share `session-live.js` — ONE shared module = one publish surface, multiple consumer pages. Most complex of the campaign and intentionally last. Pre-flight: confirm session-live.js is the single write surface (or whether each *-live.html has its own publish-side calls); decide whether session_views vs replay_views need distinct events or one event with kind discriminator (mirror of PM-39 wellbeing). |

**After 1c-14 ships:** named cleanup commit removes the three legacy direct-call surfaces (`VYVEData.invalidateHomeCache`, `VYVEData.recordRecentActivity`, `VYVEAchievements.evaluate` from publishing sites — they remain available as subscriber-internal helpers). PM-30 §23 rule transitions from option (a) to option (b).

### 3.2 Audit-count baseline (post-PM-42, HEAD `b053cd8a`)

> The publishing-surface call-site count for each primitive across the whole vyve-site tree, computed under the PM-37 audit-count classification rule (PM-40 sub-rule: count source-code call sites unconditionally regardless of runtime branch).

| Primitive | Count | Notes |
|---|---|---|
| `VYVEData.invalidateHomeCache(` | 11 | Stable from PM-37 ship; PM-41 + PM-42 added zero |
| `VYVEData.recordRecentActivity(` | 8 | Stable from PM-37 ship |
| `VYVEAchievements.evaluate(` | 19 | Stable from PM-37 ship; PM-41 preserved 2 sites in if(!VYVEBus) else-branches; PM-42 added zero (subscriber-internal evals don't count per PM-40 audit rule) |
| `VYVEBus.publish(` | 22 | +5 across PM-41/PM-42 (PM-41 +3 workout:shared call sites; PM-42 +2 programme:imported + workout:logged source:'builder') |
| `VYVEBus.subscribe(` | 27 | +3 across PM-41/PM-42 (PM-41 +1 _markHomeStale extension; PM-42 +2 _markHomeStale extension + workouts.html self-sub) |

**Use these as the pre-flight reference for PM-43.** Whole-tree audit at session start (deferred from pre-flight per §4.9 below) confirms the numbers are unchanged or computes the new baseline.

### 3.3 Methodology questions — resolved + open

**Resolved:**
- PM-37: audit-count classification — count any non-comment, non-`typeof`-guard, non-function-definition line containing a call to one of the four primitives
- PM-40: in-fallback-branch counting — calls inside `if (!window.VYVEBus) { ... }` else-branches still count (source-code call sites at static analysis time, not runtime invocation paths)
- PM-42: campaign scope — server-side cron-driven write surfaces (e.g. certificate-checker EF v9 daily certificate generation) have NO client publish site and are therefore out of scope for Layer 1c. Cross-tab/cross-device staleness for these surfaces is a Layer 2 concern (cache-coherence) or Layer 3 concern (server-push). Discriminator: does the client invoke a write that fires inline cache primitives? If no, not 1c.
- PM-42: multi-event single-function migrations — when one function has semantically distinct branches (importing-a-programme vs saving-a-session-to-library), emit distinct event names per branch. Use one event with discriminator only when branches differ in *source/origin/variant* of the same semantic action. Per-branch race-fix and fallback discipline apply independently. Reuse existing event schemas when the semantic action matches (PM-42 session-save → PM-35 workout:logged source:'builder' precedent).

**Open (P3, decide-and-codify when triggered):**
- Cache-version date convention drift — `vyve-cache-v2026-05-09-pmNN-X-Y` carries date prefix from PM-30 through PM-42. Decide before next deploy that crosses midnight UK time
- log-food.html cross-tab diary-cache coherence — same shape as PM-33 cross-tab cardio.html. Punt to Layer 3 unless Lewis flags real cross-tab diary editing patterns
- Certificate cross-tab/cross-device cache coherence — Layer 2 follow-up from PM-42 certificate drop. When certificate-checker cron inserts a new row, certificates.html shows stale "0 certificates" until manual refresh. Punt to Layer 2 unless members complain

---

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

---

## 5. Backlog top working set (P0/P1 only)

**Source: `tasks/backlog.md` (canonical). This section is a curated mirror — fetch the full file for P2/P3 tail.**

### P0 (next session)

- **PM-43 / 1c-14 + Layer 1 cleanup commit.** ONE Layer 1c migration remaining: **live-session pages via `session-live.js`**. Eight live pages (yoga-live, mindfulness-live, therapy-live, events-live, education-live, podcast-live, workouts-live, checkin-live) all share one module — ONE shared publish surface, multiple consumer pages. Most complex of the campaign and intentionally last (most care). Likely emits `session:viewed` per cache-bus-taxonomy.md. Pre-flight at session start to (a) confirm session-live.js is the single write surface or whether each *-live.html has its own publish-side calls, (b) classify symmetric/asymmetric/mixed fallback per surface, (c) decide event name (likely `session:viewed` matches the `session_views` table semantics; possibly `kind:'live'|'replay'` discriminator covers session_views vs replay_views — mirror of PM-39 wellbeing kind:'live'|'flush'). After 1c-14 ships, **option-(b) cleanup commit** closes Layer 1: removes the three legacy direct-call publishing surfaces (`VYVEData.invalidateHomeCache`, `VYVEData.recordRecentActivity`, `VYVEAchievements.evaluate` from publishing sites — they remain available as subscriber-internal helpers). PM-30 §23 rule transitions from option (a) to option (b). Layer 1 closes; Layer 2 (cross-tab/cross-device cache coherence) campaign opens.

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

- Cache-version date convention drift (decide on calendar advance).
- log-food.html cross-tab diary-cache coherence (defer to Layer 3).

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
- **Next rebuild trigger:** post-1c-14 + cleanup commit (likely PM-46ish), OR after 3+ sessions of incremental patching
- **Commit discipline for active.md edits:**
  - Patches: §2 SHA bumps, §3.1 status flips, §4 new sub-rules earning working-set residency, §5 backlog reordering — all atomic with the session's main brain commit
  - Rebuilds: campaign milestones, ≥3 patches accumulated, drift detected — full rewrite against current master.md
- **What does NOT belong in active.md:** anything from §7's "fetch on demand" list. If a question keeps surfacing that requires fetching the same canonical section session after session, that's the rebuild signal — promote it into active.md on the next rebuild.
