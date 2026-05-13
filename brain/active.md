# VYVE Brain — Active Working Set

> Session-scoped current state. Read this at session start. Do NOT read master.md / changelog.md / backlog.md unless this file points you to a specific section that's not in here.
>
> **Last full rebuild:** 13 May 2026 PM-77 (Premium Feel Campaign launch).
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

**Last verified:** 13 May 2026 PM-79.3 (this commit). PM-78 shipped PF-1/2/3; PM-79 shipped PF-4/5; build chat shipped PF-6 (commit `48c4d17e`) and PF-7 (commit `97863198`) directly to `local-first-spike` between PM-79 and now.

| What | Value |
|---|---|
| vyve-site main HEAD | `ff3e0e0f` (PM-76 perf.js v2 promotion — unchanged; PF-1/2/3 on feature branch only) |
| vyve-site `local-first-spike` HEAD | `97863198` (PF-1 through PF-7 — Dexie schema + hydrate + shadow outbound queue + since-cursor delta-pull + habits Dexie-first reads + workouts Dexie-first reads with thumbnail prefetch, spike gated by `localStorage.vyve_lf_spike`) |
| VYVEBrain main HEAD | this commit (PM-79.3 — PF-6/7 ship: habits + workouts Dexie-first reads) |
| SW cache key (production) | `vyve-cache-v2026-05-12-pm76-perf-promote-a` |
| iOS app store | 1.1 (Build 3) submitted 27 April 2026 — "Ready for Review", auto-release on approval |
| Android Play store | 1.0.2 awaiting Google Play review |
| Member count | ~15 cohort (B2C + enterprise trial + internal). Live via Supabase, not cached. |
| Active campaign | **Premium Feel Migration (local-first via Dexie)** — see `playbooks/premium-feel-campaign.md` |
| Launch target | 31 May 2026 |
| Last shipped vyve-site commits | main unchanged: `fc8232bb` (PM-74), `5cef00a2` (PM-75), `ff3e0e0f` (PM-76). Spike branch: `8d07d26b` (PF-1), `e8f02742` (PF-2/3), `903127d6` (PF-4), `fa116ef2` (PF-5), `48c4d17e` (PF-6), `97863198` (PF-7). |
| Closed campaigns | Layer 1 (PM-29), Layer 1c (PM-30..PM-44), Layer 2 (PM-45..PM-55), Layer 3 (PM-57), Layer 4 (PM-58..PM-66), Layer 5 (PM-21+PM-56+PM-75+PM-76) |
| Deferred campaigns | Layer 6 (SPA shell) — dropped in favour of local-first migration which delivers the same perceived speed |

---

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

**Status at PM-79.3 commit:** PF-1 through PF-7 SHIPPED to `local-first-spike` branch (`97863198`), 7 commits ahead of main, awaiting Dean's verification + merge. Spike covers Dexie schema (~27 tables), hydrate-on-login, shadow outbound queue (mirrors `writeQueued` into Dexie `_sync_queue` and runs parallel drainer), proper since-cursor delta-pull on visibilitychange, habits.html Dexie-first reads (3 sites flipped — member_habits join, daily_habits today, daily_habits 365-day dates), and workouts surfaces Dexie-first reads with PM-77.3 thumbnail prefetch (4 sites in workouts-programme.js + 1 in workouts-session.js, three-way branch: Dexie when enabled+non-empty, Supabase fallthrough otherwise). Realtime cross-device merge (PF-5b) deferred until post-launch — single-device-per-user assumption (§0) makes this acceptable. Next: PF-8 (nutrition.html + log-food.html refactor).

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
2.10. **PF-8 — nutrition.html + log-food.html refactor** next build task. Read TDEE / weight log / water log / today's macros from Dexie; writes through sync layer. Off-proxy stays on the wire (external API).
2.11. **PF-9 through PF-20** — remaining page refactors + iOS hardening + nav restructure. Sequenced in playbook.
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

**P1 — desired before launch, acceptable to slip:**

9. **Skeleton screens and empty states pass** (post-migration polish). Habits.html "unidentified habits" state needs replacement.
10. **Haptic feedback wiring** via Capacitor Haptics plugin on writing surfaces.
11. **Error handling polish** — warm/helpful error states instead of red alert boxes.
12. **iPhone real-device verification of perf-v2** — confirm cache_first axis fires from iOS Safari/Capacitor.

**P1 — post-launch (do not work on before 31 May):**

13. PM-71/PM-71b dashboard payload trim (becomes mostly obsolete after local-first migration — dashboard EF gets called rarely).
14. PM-72 materialise achievement_progress (same — obsolete-ish after migration).
15. PM-73 home redesign (deferred to after launch + after data on what the simplified payload actually contains).
16. Layer 6 SPA shell decision — likely dropped permanently. Local-first delivers most of what Layer 6 would have.

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

- **Last full rebuild:** 13 May 2026 PM-77. Latest patches: PM-78 (PF-1/2/3 + spike-gate rule), PM-79 (PF-4/5 + delta-pull cursor semantics), PM-79.1 (PF-23..PF-27 added — interactive tutorial + 4 polish tasks), PM-79.2 (PF-28 added — in-progress session + form draft persistence), PM-79.3 (PF-6 + PF-7 SHIPPED — habits + workouts Dexie-first reads, including PM-77.3 thumbnail prefetch on workouts), PM-79.4 (PF-29 added — Android Health Connect autotick wiring; PF-14 scope expanded with Android two-device verification, Capacitor scheme check, Dexie source indicator).
- **Next rebuild trigger:** campaign close (Premium Feel migration ship), OR 3+ patches accumulated to this file, OR drift detected (live state disagrees with §2).
- **Commit discipline for active.md edits:** §2 SHA bumps are atomic with the session's main brain commit. §3 status flips when a campaign task ships. §4 only gains new rules when a rule earns working-set residency. §5 reorders on backlog grooming.
- **What does NOT belong here:** anything from §7's fetch-on-demand list. If a question keeps surfacing that requires fetching the same canonical section session after session, that's the rebuild signal — promote it into active.md on the next rebuild.
- **What DOES belong here:** the live state snapshot, the active campaign's status, the working-set §23 rules, the P0/P1 backlog top, the operating mode. Everything a fresh Claude needs to be productive on the next session without reading master/changelog/backlog.
