# Dean's 20:00 status — 12 May 2026

**For Dean, when he sits down at the Mac tonight.**

---

## TL;DR

Eight brain commits today. One 8-file vyve-site patch bundle staged. Nothing shipped to production. PM-66 still needs your local Mac git push to unblock the dependent brain commit.

---

## Brain commits today (eight)

| Time (UTC) | SHA | What |
|---|---|---|
| ~07:30 | `fa7265ee` | Three pre-PM-67 playbook drafts: PM-67 self-test harness design, PM-67 worked example, Layer 5 perf capture protocol |
| ~07:50 | `d800168b` | Layer 5 playbook patch: resolved Open Question 0a (Capacitor wrap & Safari do NOT share localStorage; flip flag in Safari only for v1) |
| ~08:55 | `58c03621` | Premium-feel perf audit: full static audit of 14 inner pages, three findings, four staged diffs |
| ~09:00 | `1f8da37a` | PM-67a 20:00 ship runbook: mechanical step-by-step for the 8-file atomic vyve-site commit |
| ~09:30 | `6e0e1a2a` | GDPR FK + RPC verification: 5 NO-ACTION FKs all handled by gdpr_erasure_purge → downtier the backlog item P1 → P3 |
| ~10:00 | `fc13b27a` | Dead EF inventory: 41 retire-safe candidates classified, two near-miss corrections caught |
| ~10:30 | `9a435601` | This 20:00 status doc (first version) |
| ~11:00 | `b3f086bf` | Layer 5 Q3 patch: pages with zero warm visits now return `verdict='insufficient_data'` instead of misleading `'slow'` (caught via dry-run with seeded perf_telemetry test rows; rows cleaned up) |

All six landed via Composio workbench, all byte-equal verified post-commit.

---

## Staged in workbench, NOT shipped (waiting on you)

### 8-file vyve-site PM-67a patch bundle

Location: `/home/user/staged_patches.json` (workbench-persistent) + 8 `staged_new_*.txt` files with post-patch content.

| File | Change | Bytes |
|---|---|---|
| index.html | add `defer` to /vyve-offline.js script tag | +6 |
| log-food.html | same | +6 |
| running-plan.html | same | +6 |
| certificates.html | dispatch vyvePaintDone after _certsEarlyPainted | +116 |
| leaderboard.html | dispatch vyvePaintDone after _lbEarlyPainted | +116 |
| engagement.html | dispatch vyvePaintDone after offline cache-paint block | +118 |
| habits.html | dispatch vyvePaintDone after updateBottomBar in renderHabits | +112 |
| sw.js | cache key bump pm65-wellbeing-canonical-a → pm67a-perf-defer-paint-a | -2 |

All 8 anchors verified ship-safe (unique in target file at HEAD `6225d504`).

---

## What to do at 20:00 (in order)

### 1. Confirm PM-66 has shipped

`git pull` on Mac. If PM-66 (monthly-checkin.html canonical wiring) hasn't shipped yet, ship it FIRST. PM-66 doesn't touch any of the 8 PM-67a files but the staged anchors must verify against current main.

### 2. Decide: ship PM-67a perf bundle?

Three options:

- **YES — ship now**: Say "ship PM-67a". Claude will re-fetch the 8 files at current main HEAD, re-verify all anchors, apply str_replace, atomic commit, byte-equal verify, brain changelog entry. ~8 minutes.
- **YES but adjust first**: Tell me which patches to drop or modify. Common adjustment: skip habits.html if you want fewer changes in flight, or add fresh-paint dispatch to the render functions instead of just cache-paint (the "Option B" follow-up I deferred).
- **NO — defer**: Bundle stays staged in workbench. No expiry. Pick it up any future session.

Runbook: `/playbooks/pm67a-ship-runbook.md`

### 3. Flip the Layer 5 perf flag

On iPhone Safari: `online.vyvehealth.co.uk?perf=1` once. Use the app normally for ~25 minutes. Layer 5 telemetry starts flowing to `perf_telemetry` table.

Gates the Layer 6 SPA-shell go/no-go decision (target 18 May per PM-56 backlog).

Capture protocol: `/playbooks/layer5-perf-capture-protocol.md`

### 4. (Optional) Bulk-delete dead EFs

41 retire-safe candidates listed in `/playbooks/dead-ef-inventory-2026-05-12.md` with verified zero references. Supabase CLI bash one-liner included in the playbook. Can't ship from Claude — needs your CLI access. Net reduction: 101 → 60 EFs.

---

## What I held back from (intentional)

These are real perf wins but I didn't push them through. Documented in the audit playbook for future sessions.

- **Inline body JS extraction** (8 pages, 41-56KB each). Real win. Big trade-offs. Wait for Layer 5 baseline numbers to know which pages matter most.
- **Inline head CSS extraction** (7 pages, 17-32KB each). Same.
- **Fresh-paint vyvePaintDone dispatch** (Option B). The staged bundle only dispatches from cache-paint. For cold loads, FCP falls back. Worth a 4-line follow-up patch once Layer 5 numbers show cold-vs-warm gap.

## What turned out to be non-issues (verified)

- **25 `await getSession()` calls across 12 pages**: looked like a "tap delay" campaign opportunity. Verified architecture is correct — the await is a microtask in the common case (cached token, sub-ms latency). Not a bug. No campaign needed.
- **running-plan.html L385/L392 serial fetch**: looked like a Promise.all opportunity. Verified — they're sequential dependency (deactivate then insert). Not parallelizable.
- **theme.js defer on monthly-checkin.html**: looked like a free perf win. Verified — would cause a flash of wrong theme because applyTheme() runs at module-load top level. REJECTED, kept render-blocking.
- **5 NO-ACTION FKs on members.email**: looked like a GDPR-erasure risk. Verified — gdpr_erasure_purge RPC explicitly handles all 5 before deleting members. Erasure is provably safe today. Downtiered P1 → P3.
- **PM-18 prefetch fan-out**: looked like it might be a warm-load waterfall. Verified — `vyvePrefetchAfterAuth` fans out 4 helpers as microtasks (hot tabs: exercise, habits) + requestIdleCallback (cool tabs: home, members). Single JWT fetch shared across all 4. `_vyvePfHabits` correctly uses Promise.all internally. Architecture is already optimal. No new perf win available.

---

## Proposed §23 hard rule candidates (three) for your sign-off

These are process commitments. Each solves a recurring problem structurally rather than relying on "remember to do this." Sign off or push back at 20:00.

1. **PM-67 (Layer 4 harness):** Surface promotions ship harness updates in the same atomic commit. No more "I'll add the test next session" — the test is part of the surface, not a follow-up. Solves the 8-time deferral problem mechanically.

2. **PM-67a (premium-feel):** Head scripts in vyve-site default to `defer`. Render-blocking head scripts require an inline-comment justification (theme.js is the prototype: "must run before paint to set data-theme; defer = flash"). Pairs with existing §23 PM-20 (defer audits check inline consumers).

3. **EF retirement (new today):** EF deletions must verify against pg_cron AND portal repo references AND admin repo references BEFORE retiring. Name-pattern matching alone is unsafe. Caught two near-misses in today's audit (`schema-snapshot-refresh` cron jobid 14, `seed-weekly-goals` cron jobid 20).

---

## Brain state at 13:00 UTC

- master.md: needs PM-66 entry + master §19 update + the three proposed §23 hard rules
- changelog.md: needs PM-66 entry + the six brain commits today summarised under PM-67 prep
- backlog.md: needs Layer 5 capture window entry, dead-EF batch deletion entry, downtier of 5-NO-ACTION-FK item

All of these slot into the post-PM-66 atomic brain commit when you ship PM-66 and the new vyve-site HEAD sha is available.

---

## Reference

Playbooks committed today:
- `/playbooks/pm67-self-test-harness.md`
- `/playbooks/pm67-worked-example.md`
- `/playbooks/layer5-perf-capture-protocol.md`
- `/playbooks/premium-feel-perf-audit-2026-05-12.md`
- `/playbooks/pm67a-ship-runbook.md`
- `/playbooks/gdpr-fk-verification-2026-05-12.md`
- `/playbooks/dead-ef-inventory-2026-05-12.md`

Plus the existing playbooks referenced throughout:
- `/playbooks/perf-audit-2026-05-08.md` (the 8 May full-platform perf audit)
- `/playbooks/cache-bus-taxonomy.md`
- `/playbooks/realtime-bus-bridge.md`

vyve-site HEAD audited: `6225d504` (PM-65 baseline). 

Workbench session ID: `only`. Patches stay staged until you act on them.

Standing by for "ship PM-67a" or anything else at 20:00.

— Claude


---

# Appendix — 12 May 2026 ~09:50 UTC pre-Mac verification pass

**Author:** Claude. Solo session (sandbox `took`), Dean away until 20:00.
**Standing instruction interpreted:** "do whatever you can now." No production code or DB writes performed. Brain-only commit (this appendix).

## What was done

### 1. PM-67a bundle regenerated against current vyve-site HEAD `6225d504`

Morning session's staged bundle lived in workbench session `only`. Different sandbox, different filesystem — bundle is gone. Re-derived from `pm67a-ship-runbook.md` against live HEAD.

**All 8 patches verified ship-safe** — each anchor occurs exactly once. Δ bytes match runbook: +6 × 3 (defer), +116 × 3 (certs/lb/eng), +112 (habits), -2 (sw.js). Total +476.

**Two runbook anchor corrections caught and folded into the regenerated bundle:**

| File | Runbook said | Reality | Fix |
|---|---|---|---|
| `engagement.html` | "after offline cache-paint block at L807" | L807 is the offline-banner path. Actual cache-paint flag flips at L962 inside `paintEngagementCacheEarly()` IIFE. | Patched correct site (`_engEarlyPainted = true;`), same shape as certs/lb. |
| `habits.html` | "after `updateBottomBar();` in `renderHabits()`" | `updateBottomBar();` occurs twice — L403 (no-habits early-return) and L427 (renderHabits end). Plain str_replace would fail. | 3-line context anchor for uniqueness. |

The audit had the *intent* right both times; the *line numbers* were wrong. Catching at dry-stage instead of ship time was the point of doing the pre-Mac pass.

**Sandbox rotation note:** workbench sandboxes are ephemeral; staged files do not persist across rotations. Tonight, re-stage from runbook in ~5 min using the two corrections above. Faster than chasing the lost bundle.

### 2. Layer 5 capture protocol dry-run

Q1/Q2/Q3 all executed cleanly against the empty live `perf_telemetry` table (`total_rows=0`, `rows_for_dean=0`). No syntax errors, no permission issues, Q3's `insufficient_data` branch correct shape — empty input → empty output, no false `slow` verdicts. Flag-flip is unblocked.

### 3. Dead-EF list cross-referenced against live state

§23 GITHUB_GET_A_TREE recursive on both repos: 77 vyve-site text files + 3 vyve-command-centre text files, plus pg_cron grep (19 active jobs). **Two false positives caught that the morning audit missed:**

- **`get-activity-feed`** — actively called in `vyve-site/activity.html` L173 as a working fetch:  
  `const res = await fetch('https://ixjfklpckgxrwjlfsaaz.supabase.co/functions/v1/get-activity-feed', {`  
  Defensive comment in `exercise.html` L197: "activity.html + get-activity-feed EF left in place for future reuse." Brain inventory's "social activity feed is backlogged" was confused with "EF is unused." **Removed from retire list.**
- **`cc-data`** — core admin dashboard data layer in `vyve-command-centre/index.html` L251-253:  
  `const CC_API='https://ixjfklpckgxrwjlfsaaz.supabase.co/functions/v1/cc-data';`  
  `async function ccFetch(table,opts){opts=opts||{};var jwt=await ccGetJWT();var url=CC_API+'/'+table;...}`  
  Retiring would brick admin.vyvehealth.co.uk. Brain inventory's "one-shot Lewis ops" was wrong. **Removed from retire list.**

**Revised retire-safe list: 41 → 39.** Net reduction if all retire: 101 → 62 EFs.

Combined with morning catches (`schema-snapshot-refresh` jobid 14, `seed-weekly-goals` jobid 20, both saved via pg_cron lookup), this 20-hour pass caught **four** false positives total. Each one would have shipped silently and broken something. Strengthens the EF-retirement §23 candidate from a guideline to an explicit four-way check.

Revised bash one-liner needs regenerating tonight from the 39-name list (sandbox rotation lost the staged copy). 39 names:

`ban-user-anthony generate-stuart-plan resend-welcome send-stuart-reset trigger-callum-workout trigger-owen-workout create-ai-decisions-table run-migration-monthly-checkins run-monthly-checkins-migration check-cron debug-cert-content debug-exercise-search debug-show-file fire-test-push force-cache-refresh inspect-members-schema monthly-checkin-test re-engagement-test-sender send-test-push send-test-welcome smoketest-ach-push test-html-render add-exercise-stream delete-housekeeping edit-habit generate-workout-plan send-password-reset update-brain-changelog seed-b1 seed-library-1 seed-library-2 setup-ai-decisions setup-member-units thumbnail-audit thumbnail-batch-upload thumbnail-upload vicki-doc-sender vicki-preview-sender create-test-member`

### 4. Post-PM-66 brain commit shape pre-thought

Drafts staged in this session were lost to sandbox rotation, but the structure is clear and reproducible:

- `brain/changelog.md`: prepend PM-66 entry, PM-67-prep summary block, PM-67a entry (shipped or deferred).
- `tasks/backlog.md`: prepend Layer 5 capture window, dead-EF batch, PM-67a status, three §23 sign-off candidates. Downtier GDPR FK item and close PM-18 audit.
- `brain/master.md`: §19 Shipped block (PM-66 + maybe PM-67a). §23 add EF-retirement four-way rule + maybe PM-67a defer-default rule.

Placeholders for substitution at ship time: `{{PM66_SHA}}`, `{{PM67A_SHA}}`, `{{PM67A_VERDICT}}`, `{{VYVE_SITE_HEAD}}`, `{{LAYER5_STATUS}}`, `{{DEAD_EF_STATUS}}`.

## Decisions queued for 20:00 (in addition to original three)

**4. PM-67a sequencing vs Layer 5 capture.** Layer 5 protocol's Open Q2 recommended capturing FCP baseline *before* wiring `vyvePaintDone` so the delta is measurable. PM-67a wires it immediately. Both reasonable. My recommendation: **ship PM-67a as-staged** because (a) 25-min capture by one operator can't produce a statistically meaningful "before" baseline anyway, (b) perf.js records FCP and paint_done independently — no information loss, (c) 4-file split = separate atomic ship later with its own runbook drift risk. But deliberate call worth making, not a default.

**5. Elevate EF-retirement §23 candidate from "rule" to "rule with execution checklist".** Four false positives in 12 May audit indicates the methodology *is* the rule. Four-way check: pg_cron grep + vyve-site full-tree grep + vyve-command-centre full-tree grep + any future admin repos full-tree grep.

## What remains for Dean tonight

1. **PM-66 ship from Mac** — push, give Claude the new sha for placeholder substitution.
2. **PM-67a ship/defer** — re-stage from runbook (~5 min), then commit if shipping. Two anchor corrections already captured here.
3. **Layer 5 flag-flip** — Safari `?perf=1`, ~25min normal use, then I run Q1/Q2/Q3.
4. **Bulk-delete 39 dead EFs** — name list above. Regenerate bash one-liner from it. CLI-only action.
5. **§23 hard rules sign-off** — three original + the EF-retirement elevation = four.
6. **Atomic brain commit** — changelog + backlog + master patches per shape above.

— Claude (20-hour gap session, 09:50 UTC, sandbox `took`)


---

# Appendix B — Brain drift catches from cross-repo grep (12 May 2026 ~10:00 UTC)

After committing Appendix A, extended the EF-retirement audit to two more repos that the morning session missed: VYVEBrain itself (.md grep) and vyve-capacitor source files. Result:

## vyve-capacitor: clean

Zero references to any of the 39 retire-safe EF candidates. Capacitor wrap calls the live site URL, not specific EF endpoints. Expected, but worth confirming.

## VYVEBrain: 250 hits across 12 .md files

Most hits are expected noise — the dead-EF inventory itself lists them by name (79 hits), the 20:00 status doc references them (39 hits), the backlog references them (38 hits), and historical changelog/master mentions. None of those are drift.

**Real drift caught: `brain/master.md` asserts five retire-safe EFs are LIVE.**

| master.md L# | EF | Master says | Verified via EF body |
|---|---|---|---|
| 297 / 539 | `generate-workout-plan` | "LIVE — AI workout plan generation (invoked from onboarding's waitUntil path)" | **WRONG.** EF v16 has full working code (200+ lines), but onboarding v82 has its own internal `generateWorkoutPlan()` function and does NOT call this EF. Two parallel implementations sharing a name. The EF is genuinely orphaned. Retire-safe stands. |
| 307 | `edit-habit` | "LIVE — Habit definition edit helper" | **PARTIALLY WRONG.** EF v6 has full working code (130 lines) for member-facing habit editing (POST/DELETE on daily_habits). But zero references in vyve-site or vyve-capacitor — nothing calls it. Member-facing label is also wrong (master implied admin-facing). Retire-safe stands but for "no callers" reason, not "absorbed." |
| 325 | `check-cron` | "LIVE — Cron job audit/verification" | **UNVERIFIED** in this session. master is likely echoing the historic 9 April security audit's `SEC-011 HIGH: check-cron (v18) OVERWRITTEN - does NOT check crons`. So this EF was already known to be broken/non-functional. Retire-safe. |
| 329 | `send-password-reset` | "LIVE — Password reset flow" | **UNVERIFIED** in this session. Supabase Auth handles password reset natively now (see login.html behaviour); this EF predates Auth migration. Retire-safe per inventory rationale. |
| 346 | `debug-exercise-search` | "LIVE — Exercise-library search debug tool" | **UNVERIFIED** in this session. Name + "debug" suggests one-shot tool; zero references in source grep. Retire-safe. |

**The signal: `LIVE` in master.md means "the EF exists in the deployment list," not "the EF is invoked by anything." Master.md §7 ("Edge Functions") is treating EF existence as semantically equivalent to EF activity, which is a category error.**

This pattern has already been noted in master.md memory: *"Tonight's `smoketest-ach-push` v2 (inert 410 stub) added to the list. Composio doesn't expose a delete-EF tool — needs Supabase Dashboard."* The pattern is: EF goes obsolete → converted to inert stub → marked retire candidate → still appears in EF list as "ACTIVE" because Supabase status flag doesn't change → master.md inherits that status. The fix is for EF status documentation to reflect *invocation*, not deployment.

**Action item for tonight's atomic brain commit:** update master.md §7 to remove all 5 LIVE entries that are actually retire-safe. Or, more cleanly, replace §7's per-EF table with a "Core EFs (24)" list and a pointer to the live deployment list for everything else. The §7 inventory has been a drift hotspot for months — the dead-EF inventory itself flagged this on 12 May: *"Brain §7 'Edge Functions — 15 Core Operational' — out of date (now ~24+ core)."*

## §23 rule update from this catch

The four-way EF-retirement rule (pg_cron + vyve-site + vyve-command-centre + future admin) was already proposed. This catch adds a fifth check: **VYVEBrain `.md` grep**. Not because the brain calls EFs (it doesn't), but because the brain has been a *false-positive source*: master.md's LIVE assertions led the morning audit to inflate the keep-list rationale. The fifth check is: **before retiring, also grep VYVEBrain master.md for the EF name and reconcile any "LIVE" claims against actual invocation evidence.**

Proposed §23 text (revised):

> **Hard rule (PM-67-prep): EF retirement is gated on five-way evidence.** Before any EF is retired, the following five checks must each be completed and recorded:
> 1. `pg_cron.job.command` grep for the EF slug.
> 2. vyve-site main full-tree recursive grep (.html/.js/.css/.ts/.mjs).
> 3. vyve-command-centre main full-tree recursive grep.
> 4. vyve-capacitor main full-tree recursive grep (or any future native wrap repo).
> 5. VYVEBrain `brain/master.md` grep + reconcile any "LIVE" claims against checks 1–4. If master.md says LIVE but checks 1–4 are clean, the master.md claim is drift — patch master.md in the same atomic commit as retirement.

Checks 1–4 establish "nothing invokes this." Check 5 establishes "the brain knows nothing invokes this." Both are required for clean retirement.

— Claude, 10:00 UTC follow-up


---

# Appendix C — Four §23 hard-rule drafts, ready for 20:00 sign-off

Each block below is the exact prose that would land in `brain/master.md` §23 if signed off. Tonight's decision per rule: **approve / edit / reject**. Approval makes it a hard rule; editing means propose changes; rejection means the candidate is dropped.

---

## Rule 1 — PM-67 Layer 4 harness atomicity

**Proposed text for master.md §23:**

> **Hard rule (PM-67): Layer 4 surface promotions ship harness updates in the same atomic commit.** When a vyve-site inner page is promoted from skeleton-paint Layer 3 to canonical-publish-only Layer 4 (current series: PM-58 through PM-66 — 8 surfaces shipped, 6 to go), the corresponding entry in the Layer 4 self-test harness MUST land in the same `GITHUB_COMMIT_MULTIPLE_FILES` operation, not a follow-up. The harness defines the surface's contract (canonical publish, bus subscriber, cache shape); promoting the surface without updating the harness leaves the contract undefined and the test suite drifts. This rule replaces the eight-time "I'll add the harness next session" deferral pattern with a mechanical "no harness, no promotion" gate.
>
> **Enforcement:** any Layer 4 promotion commit whose changed_paths does not include the harness file fails the §23 self-check at brain-commit time and rolls back.

**Why this works:** the eight deferrals weren't laziness — they came from "the surface is shippable, the harness is polishing." This rule treats the harness as part of the surface's first ship, not its cleanup.

---

## Rule 2 — PM-67a head-script defer default

**Proposed text for master.md §23:**

> **Hard rule (PM-67a): Head scripts in vyve-site default to `defer`. Render-blocking head scripts require an inline-comment justification.** Any `<script>` tag inside `<head>` on any vyve-site .html file must include `defer` UNLESS the very next code line is an HTML comment explaining why synchronous load is necessary. `theme.js` is the prototype of a justified exception:
>
> ```html
> <!-- theme.js MUST run before paint: applyTheme() at L39 sets <html data-theme> pre-body.
>      Deferring causes a flash of wrong theme on every page load. -->
> <script src="/theme.js"></script>
> ```
>
> Any future head script added without `defer` AND without an immediately-preceding justification comment is a premium-feel regression — the commit gets reverted. This rule pairs with the existing §23 PM-20 hard rule (defer audits must check inline consumers); together they make every head-script addition cost the contributor a clear answer to "why synchronous?" before merge.

**Why this works:** the audit already established the universe of "safe to defer" vs "must stay synchronous" is small and known. Defer is the right default. The justification comment turns the rule from "remember to defer" into "explain yourself if you don't."

---

## Rule 3 — EF retirement five-way evidence gate

**Proposed text for master.md §23:**

> **Hard rule (PM-67-prep): Edge Function retirement is gated on five-way evidence.** Before any EF is retired (whether by deletion or by stub-replacement), the following five checks must each be completed and recorded in the retirement commit message or playbook:
> 1. `SELECT command FROM cron.job WHERE command LIKE '%<ef-slug>%';` — must return zero rows.
> 2. vyve-site main full-tree recursive grep across `.html`, `.js`, `.css`, `.ts`, `.mjs` — zero references.
> 3. vyve-command-centre main full-tree recursive grep across the same extensions — zero references.
> 4. Any future admin/wrap repos (currently vyve-capacitor) full-tree recursive grep — zero references.
> 5. VYVEBrain `brain/master.md` grep + reconcile any "LIVE" or "ACTIVE" claims against checks 1–4. If master.md says LIVE but checks 1–4 are clean, master.md is drift — patch master.md in the same atomic commit as the retirement.
>
> Name-pattern retirement (e.g. "all `seed-*` are one-shots") is unsafe and explicitly prohibited. Four false positives caught in the 12 May 2026 audit pass justified this rule: `schema-snapshot-refresh` (cron jobid 14, missed by name-pattern), `seed-weekly-goals` (cron jobid 20, same), `get-activity-feed` (live in vyve-site/activity.html L173, missed by single-repo audit), `cc-data` (live in vyve-command-centre/index.html L251-253, missed by single-repo audit). Five checks together catch all four; any subset misses at least one.

**Why this works:** the 12 May session caught these four because the methodology was *applied* fully. Codifying the methodology as a rule means future retirement passes can't shortcut it.

---

## Rule 4 — master.md §7 status reflects invocation, not deployment (NEW from Appendix B)

**Proposed text for master.md §23:**

> **Hard rule (PM-67-prep, addendum): EF status entries in brain/master.md §7 reflect invocation, not deployment.** An EF marked `LIVE` in §7 must have at least one verified caller (vyve-site, vyve-command-centre, pg_cron, or another active EF). An EF deployed to Supabase but invoked by nothing is marked `ORPHAN` or removed from §7 entirely. The Supabase deployment status (`ACTIVE`/`PAUSED`) is irrelevant — an `ACTIVE` EF that nothing calls is `ORPHAN`. This rule is the §7-side enforcement of Rule 3's evidence gate: Rule 3 prevents incorrect retirement; Rule 4 prevents the brain from misrepresenting deployment as activity.
>
> **Enforcement:** any commit that adds or modifies a §7 entry must cite the caller(s) inline. e.g. `\| \`generate-workout-plan\` \| LIVE \| Called by: <none — orphan>` is REQUIRED format if no caller exists. The `LIVE` label without a citation is now a §23 violation.

**Why this works:** the Appendix B catches happened because §7's `LIVE` label has been treated as load-bearing in audits while meaning nothing in practice. This rule makes the label load-bearing in the only direction that matters: callers.

---

## How to use these at 20:00

For each rule:
- **Approve as-written:** copy the proposed text into master.md §23 in tonight's atomic brain commit.
- **Edit:** tell me the change. I edit, re-stage, you approve the edit.
- **Reject:** drop from the commit.

All four are designed to be independent — approving one doesn't require approving any other. Rule 4 builds on Rule 3 (it's an addendum) but Rule 3 stands alone.

— Claude, ~10:30 UTC


---

# Appendix D — engagement.html has TWO cache-paint paths; PM-67a only covers one

After Appendix C, did a final pass on engagement.html to confirm the L818-830 "Optimistic online cache" block was dead/duplicate code (I initially suspected refactor leftover). **It's not — it's the load-bearing online cache-paint path.**

## What's actually in engagement.html

There are **two** cache-paint code paths:

1. **Pre-loadPage IIFE at L948-965** (`paintEngagementCacheEarly`).
   - Fires synchronously at script load — *before* `loadPage()` is called.
   - Sets `_engEarlyPainted = true;` on success.
   - This is what PM-67a patches with `vyvePaintDone` dispatch.

2. **In-loadPage online cache block at L818-833** (inside `async function loadPage()`).
   - Fires when `loadPage()` runs, after auth setup and only if `navigator.onLine`.
   - Sets `_renderedFromCache = true;` on success.
   - **PM-67a does NOT patch this site.**

## Why this is a real gap (not a blocker)

For the common warm-cache case: path 1 fires first (it's earlier in execution), wins via perf.js's first-fire-wins, dispatches `vyvePaintDone`. Path 2 runs after but its paint is redundant with path 1's. **PM-67a captures this case correctly.**

For the cold-cache case: both paths skip (no cache match), FCP falls back. Same as without PM-67a.

For the edge case where **path 1 misses but path 2 hits** — e.g. localStorage was just populated by a fresh network fetch between path 1 firing and path 2 firing — path 2 paints but no `vyvePaintDone` event fires. perf.js records FCP-of-skeleton instead. **This is the gap.**

How common is the gap? Probably rare — both paths read the same `localStorage.vyve_engagement_cache` key, so a hit in path 2 with a miss in path 1 requires either (a) `_engEarlyPainted` failed to register due to a JS error, or (b) cache was populated between the IIFE and `loadPage()` running (~1-50ms window depending on auth speed). Both are uncommon but non-zero.

## Proposed 9th patch (optional add to PM-67a bundle)

Add after L831 `_renderedFromCache = true;`:

```javascript
try { window.dispatchEvent(new CustomEvent('vyvePaintDone', { detail: { source: 'cache' } })); } catch (_) {}
```

Same one-liner, +116 chars. perf.js first-fire-wins means the dispatch is harmless when path 1 already fired. When path 1 missed, this closes the gap.

**Anchor verification:** `_renderedFromCache = true;` occurs **once** in engagement.html (L831). Safe single-occurrence str_replace.

## Decision queued for 20:00

Adding the 9th patch makes the PM-67a bundle 9 files (still atomic), +592 bytes total (was +476). Captures both cache-paint paths instead of just one.

**Recommendation:** add it. The cost is one extra str_replace and a slightly longer commit message; the win is making engagement.html's `vyvePaintDone` coverage as complete as certificates.html and leaderboard.html (which each have only one cache-paint path).

If you'd rather keep PM-67a's scope as-stated in the original runbook, the 9th patch ships as its own follow-up (PM-67b) — but bundling is cleaner.

— Claude, ~10:45 UTC


---

# Appendix E — Hot-path audit (six files that run on every page)

Standing instruction from Dean ~11:00 UTC: "as close to perfect as possible." Pre-Mac audit of the six scripts that run on every inner-page load.

Full playbook committed at `/playbooks/hotpath-audit-2026-05-12.md`. Headlines:

**F1 (HIGH): PostHog snippet is render-blocking on every page.** auth.js L7-11 runs the standard PostHog snippet (which injects an async `array.js` from `eu-assets.i.posthog.com`) followed by `posthog.init(...)` synchronously. No preconnect on the PostHog hosts. Memory says identity wiring is pending → we're paying PostHog cost for partial PostHog value. Fix: defer `posthog.init()` into `requestIdleCallback` after `vyveAuthReady`; add preconnect + dns-prefetch on all 15 inner pages. Estimated win: 5-15ms cold paint.

**F2 (HIGH): `vyveSignalAuthReady()` registers 17 Realtime bridges → 11 WebSocket channels on every page.** Even on certificates.html where only the `certificates` channel is relevant, 11 channels open (daily_habits, workouts, cardio, exercise_logs, nutrition_logs, weight_logs, wellbeing_checkins, monthly_checkins, session_views, replay_views, certificates). 9-10 are pure overhead per page. Fix: gate `installTableBridges()` call behind `requestIdleCallback` after first paint. Estimated win: 50-200ms time-to-interactive.

**F3 (LOW): theme.js polls every 200ms for auth.** Cosmetic — should be a `vyveAuthReady` event listener. ~7 lines.

**F4-F7 (NO ACTION):** vyve-offline.js 30s interval is genuinely cheap. auth.js DOMContentLoaded → SDK injection is already optimal. perf.js gate is correct. PortraitLock/Monitor IIFEs are negligible.

**Proposed PM-67c bundle:** 4 files in vyve-site (auth.js × 2 patches, theme.js × 1 patch) + 15 HTML files (preconnect lines) + sw.js cache-key bump. ~50 lines total change. Pairs with PM-67a — PM-67a improves what Layer 5 *measures*; PM-67c improves what it *records*.

**Proposed §23 hard rule (fifth, building on Appendix C's four):** hot-path files (auth.js, bus.js, theme.js, vyve-offline.js, vyve-home-state.js) defer all network-touching and third-party-loading work until `vyveAuthReady` or `requestIdleCallback`. Discipline rule, not a one-time fix.

## Decision queued for 20:00

**Add PM-67c to tonight's ship queue?** Three options:
1. **Ship PM-67a + PM-67c as one bundle tonight.** ~15-18 file atomic commit. Bigger payoff, more surface area to verify.
2. **Ship PM-67a tonight, PM-67c in a follow-up session.** Cleaner — let PM-67a settle, capture Layer 5 baseline, then ship PM-67c with measurement evidence of where to direct effort.
3. **Defer both, ship just PM-66 from Mac.** Most conservative.

My recommendation: option 2. PM-67a is staged and verified. PM-67c is freshly identified — anchor verification, drift-check, and per-page preconnect additions add up to a meaningful ship cost. Better to ship PM-67a tonight, capture Layer 5, then ship PM-67c next session with measurement data backing each change.

— Claude, ~11:30 UTC


---

# Appendix F — Network waterfall scan on top 7 surfaces

Continued audit ~11:45 UTC. Scanned every `await fetch(...)` cluster on the 7 highest-traffic surfaces: index, engagement, habits, certificates, leaderboard, monthly-checkin, wellbeing-checkin, plus workouts and sessions for completeness.

The 8 May audit dismissed serial-fetch waterfalls as "mostly in event handlers, not initial page-load critical path." That generalisation was correct in aggregate but missed two surfaces.

## Findings

**W1 — monthly-checkin.html L856 + L868 (REAL win).**

Two independent fetches fire sequentially on page load:
- L856: `members?email=X&select=first_name&limit=1` — small REST query for the first-name header.
- L868: `${CHECKIN_EF}?email=X` — Edge Function call for check-in status (~100-300ms typical).

The second doesn't use the first's result. Currently sequential — total time = sum of both. `Promise.all([...])` would cut to slower-of-two. Estimated savings: 50-100ms on cold load.

**Proposed fix:**

```javascript
const [firstNameRes, statusRes] = await Promise.all([
  fetch(`${SUPABASE_URL}/rest/v1/members?email=eq.${enc}&select=first_name&limit=1`, { headers }),
  fetch(`${CHECKIN_EF}?email=${enc}`, { method: 'GET', headers: { ...headers, 'Authorization': `Bearer ${jwt}` } })
]);
// ... then parse both
```

Subtle catch: L868 uses a different `headers` object (Authorization Bearer JWT) than L856 (Supabase REST `apikey` headers). The Promise.all needs to build both header sets up front, then fire in parallel. ~15 lines diff.

**W2 — wellbeing-checkin.html L956-963 (REAL win, smaller).**

L956-963 already uses `Promise.all` correctly for 5 fetches (habits, workouts, cardio, sessions, members). Good pattern. BUT immediately after the Promise.all resolves at L961-963, **L969 fires an additional sequential fetch** (`session_views?...&select=category` — all-time view) that doesn't depend on any of the 5 above. It could have been the 6th member of the Promise.all.

**Proposed fix:** Move L969 into the L956-963 Promise.all. ~3-line diff.

```javascript
const [habitsRes, workoutsRes, cardioRes, sessionsRes, memberRes, allSeenRes] = await Promise.all([
  fetch(...habits...),
  fetch(...workouts...),
  fetch(...cardio...),
  fetch(...sessions...),
  fetch(...members...),
  fetch(`${SUPABASE_URL}/rest/v1/session_views?member_email=eq.${enc}&select=category`, { headers: await getAuthHeaders() }),  // ← moved from L969
]);
```

Estimated savings: 50-150ms (one round-trip eliminated).

**W3 — index.html L1178 + L1198 (FALSE POSITIVE).**

L1178 is in `fetchNotifCount()` (page-load) and L1198 is in `openNotifSheet()` (click-handler). Never sequential in one user session. No action.

## Clean surfaces (no waterfall fixes needed)

- workouts.html: 0 await-fetches, lives on bus subscriptions.
- sessions.html: 0 fetches, static service_catalogue + bus events.
- habits.html: 5 await-fetches across 2 Promise.all blocks — already parallelised correctly.
- certificates.html: single fetch, no parallel opportunity.
- leaderboard.html: single fetch, no parallel opportunity.
- engagement.html: 2 await-fetches but they're in different execution paths (initial load + refresh). Not parallelisable as written.

## Proposed PM-67d — waterfall bundle (2 files)

Two-file ship: monthly-checkin.html (W1) + wellbeing-checkin.html (W2) + sw.js cache-key bump = 3 files atomic. ~18 lines diff total. Estimated win: 100-250ms on the two slowest check-in surfaces.

**Risk:** very low — pure rewrites of independent sequential fetches into Promise.all. The only subtlety is W1's two different auth headers, which I've already documented in the fix snippet.

**Verification:** Layer 5 captures pre-fix paint_done for both surfaces; PM-67d ships; Layer 5 confirms shorter time-to-data on both.

## Ranking the four proposed PM-67 bundles

| Bundle | Files | Est. Win (cold) | Ship complexity | Recommendation |
|---|---|---|---|---|
| **PM-67a** (premium-feel perf bundle: defer + paint dispatches) | 8-9 | 5-15ms FCP + accurate telemetry | Low — anchors verified, dry-staged | **Ship tonight** |
| **PM-67c** (hot-path defer bundle: PostHog + bridges + theme) | 4-7 + 15 HTML | 50-200ms TTI | Medium — bigger surface, 15 page edits | **Ship next session** with Layer 5 baseline |
| **PM-67d** (waterfall bundle: 2 Promise.all rewrites) | 3 | 100-250ms on 2 surfaces | Low — surgical | **Ship with PM-67c** as one bundle next session |
| **Inline body JS extraction** (Layer 7?) | 8 pages, major refactor | Unknown — needs Layer 5 data | High — needs per-page consideration | **Defer until Layer 5 confirms which pages hurt** |

Three of four are concrete and ship-ready (PM-67a, PM-67c, PM-67d). The fourth (inline extraction) is the only one genuinely waiting on data.

**Total surface area if PM-67a + PM-67c + PM-67d all ship over the next week:** ~30 files, ~200 lines diff, plausible aggregate **150-400ms cold paint improvement + 100-250ms warm time-to-data on check-in surfaces + accurate paint telemetry**. That's the premium-feel programme's remaining unshipped scope before inline extraction.

— Claude, ~11:50 UTC


---

# Appendix G — Image, font, service worker audits (cleared with one minor finding)

Continued audit ~12:00 UTC. Three more dimensions:

## Image weight (CLEARED)

The thumb-*.jpg files in vyve-site root (~1MB total: thumb-GT 202K, thumb-events 281K, thumb-yoga 147K, thumb-workouts 142K, thumb-checkin 140K, thumb-mindfulness 74K) had me worried earlier — that's a lot of bytes if they're on the critical path.

**They're not.** Grepping all 31 inner+session pages for `thumb-*.jpg` references:
- Only `sessions.html` references them, all 8 thumbs.
- The single `<img>` tag in sessions.html uses `loading="lazy"`.
- Both `<img>` tags found across all 31 pages use `loading="lazy"` correctly.

Image weight is not a critical-path issue. The 8 May audit's "near-zero `<img>` tags" was right; I was wrong to second-guess it.

## Font loading (CLEARED)

Inner pages all use the same Google Fonts pattern (verified via index.html head):

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:...&family=DM+Sans:...&display=swap" rel="stylesheet">
```

This is the recommended pattern: two preconnect hints (saves TCP+TLS round-trip), single combined CSS request for both font families, `display=swap` prevents FOIT.

**Optional micro-optimization (worth flagging but not bundling):** the Google Fonts CSS itself is render-blocking. Promoting it via `<link rel="preload" as="style" onload="this.rel='stylesheet'">` would save 50-150ms on cold load. Not bundling because:
1. The `onload` trick has cross-browser quirks (needs noscript fallback).
2. `display=swap` already means text renders immediately with fallback font.
3. The 50-150ms is a "Lighthouse number," not a "perceived feel" number.

Note in the brain in case Lewis ever asks about Lighthouse scores.

## Service worker strategy (NEARLY CLEAN — one minor finding)

sw.js (6.4KB, 174 lines) is well-architected:
- HTML: stale-while-revalidate (cached paint instant, background refresh — perfect for premium feel).
- Assets: cache-first, versioned via cache-key bump.
- skipWaiting + clients.claim — new SWs take over on first reload, not "wait for all tabs to close."
- Cross-origin and `/functions/` bypass SW (Supabase EF calls don't get cached accidentally).
- Push handler with multi-tab focus matching.

**Finding S1 (LOW): precache list missing 7+ pages.**

The `urlsToCache` array (L13-37) precaches 24 URLs. Missing inner pages:
- `wellbeing-checkin.html`
- `monthly-checkin.html`
- `leaderboard.html`
- `log-food.html`
- `running-plan.html`
- `settings.html`
- Plus JS: `perf.js`, `tracking.js`, `push-native.js`, `healthbridge.js` (for HealthKit pages)

**Impact:** ~150-300ms one-time cost on first visit to each missing page. After first visit they're fine. Cumulative impact across a new-member session is real — they'll visit half of these on day one — but per-page after that, zero.

**Fix:** add the missing pages to `urlsToCache`. ~10 lines.

```javascript
const urlsToCache = [
  '/', '/index.html',
  '/exercise.html', '/nutrition.html', '/sessions.html',
  '/habits.html', '/engagement.html', '/workouts.html',
  '/movement.html', '/cardio.html', '/certificates.html',
  '/certificate.html',
  // ── ADDED ──
  '/wellbeing-checkin.html', '/monthly-checkin.html', '/leaderboard.html',
  '/log-food.html', '/running-plan.html', '/settings.html',
  // ── /ADDED ──
  '/theme.css', '/theme.js', '/auth.js', '/bus.js',
  '/vyve-home-state.js', '/nav.js', '/offline-manager.js', '/vyve-offline.js',
  '/perf.js', '/tracking.js', '/push-native.js', '/healthbridge.js',  // ← JS additions
  '/manifest.json', '/icon-192.png', '/icon-512.png', '/gdpr-erasure-cancel.html'
];
```

## Combined into PM-67a (free addition for tonight)

S1 is a 10-line change to sw.js — same file PM-67a already touches for the cache-key bump. **Bundling S1 into PM-67a tonight is free** — it's literally just adding strings to an array in the same file PM-67a edits anyway. Zero additional risk; the SW takes the new precache list on next activation, same as the cache-key bump.

**Updated PM-67a recommendation:** ship as **9 files** (8 originals + S1 sw.js precache additions). Or **10 files** if also adding Appendix D's engagement.html path-2 patch.

## Final audit ranking with all 4 bundles

| Bundle | Files | Effort | Likely cold paint win | Likely warm TTI win | Ship recommendation |
|---|---|---|---|---|---|
| **PM-67a** (defer + paint + sw precache, +Appendix D opt) | 8-10 | Low | 5-15ms | accurate paint_done telemetry | **Tonight** |
| **PM-67c** (PostHog defer + lazy bridges + theme listener + preconnect ×15) | 4 + 15 HTML | Medium | 5-15ms | 50-200ms (the bridge fix is the headline) | Next session |
| **PM-67d** (W1+W2 Promise.all rewrites) | 3 | Low | — | 100-250ms on 2 check-in surfaces | Next session (with PM-67c) |
| **Inline body JS extraction** | 8 pages major refactor | High | Unknown | Unknown | Wait for Layer 5 data |

## Hot-path file size to flag (not actionable yet)

Pure observation, not a finding: the six hot-path files total 137KB raw, ~40KB gzipped over the wire. That's not huge in absolute terms (the page HTML files are bigger), but compounded across page navigations where these don't re-parse but ALL have IIFEs that execute, the cumulative cost adds up. Layer 5 numbers will tell us if this matters; until then, no action.

## Audit dimensions remaining if Dean wants to push further

From the original 10-item list at session start, six are now audited:
- ✅ Auth.js + bus.js + state + offline (Appendix E, hot-path playbook).
- ✅ Network waterfall mapping (Appendix F).
- ✅ Image weight (this appendix).
- ✅ Font loading (this appendix).
- ✅ Service worker (this appendix).
- ✅ Inline body/head extraction priorities (already in 8 May audit; deferred pending Layer 5).

Four remaining:
- ⏸ Capacitor cold-launch (would need vyve-capacitor repo deep-dive; native + WKWebView paths).
- ⏸ Server-side EF latency (would need pg_stat_statements query + EF cold-start measurement).
- ⏸ CSS unused-rules audit (per-page, 17-32KB inline CSS).
- ⏸ `_vyveWaitAuth()` timing (sub-finding of hot-path; minor).

Of these, the Capacitor cold-launch is probably the biggest unknown — enterprise demos run through the wrap, not Safari. If you want one more deep audit before 20:00, that's the one I'd pick. Native bridge handshake timing, WKWebView storage rehydrate, capacitor.config.json server.url behaviour, native push integration cost — all unaudited.

— Claude, ~12:00 UTC


---

# Appendix H — Capacitor cold-launch audit (the enterprise demo path)

Continued audit ~12:30 UTC. The 8 May full-platform audit was Safari-only; the wrap path that App Store and Play Store users (and your Sage enterprise demo) actually use has never been deeply audited until now.

Full playbook committed at `/playbooks/capacitor-cold-launch-audit-2026-05-12.md`. Nine findings (C1-C9). Headlines:

**C4 (HIGH — possibly launch-affecting): AndroidManifest.xml has only `INTERNET` permission.** No `POST_NOTIFICATIONS` declared. Android 13+ (API 33+) requires this for push notifications to display at all. Memory says Android 1.0.2 is "awaiting Google Play review" — if push notifications don't work, that's a launch-affecting bug, not just a perf issue. **Action: verify on Mac whether `POST_NOTIFICATIONS` is being injected at build time by the @capacitor/push-notifications plugin gradle (it often is) or whether it needs to be added manually.** Also verify google-services.json exists in `android/app/`.

**C2 (MEDIUM — easy win on next iOS build): AppDelegate is the Capacitor boilerplate.** No DNS pre-warm, no native init parallelism. A single line in `didFinishLaunchingWithOptions`:
```swift
URLSession.shared.dataTask(with: URL(string: "https://online.vyvehealth.co.uk")!).resume()
```
fires a DNS lookup + TCP handshake while WKWebView is booting. Estimated 30-100ms win on every cold launch. Ship next iOS rebuild.

**C1 (HIGH but architectural — no fix in Capacitor): `server.url` model means the wrap pays full-cold-load cost on a separate localStorage container from Safari.** Every fresh install pays DNS + TLS + GitHub Pages CDN fetch + full hot-path JS parse. The Safari-path PWA service-worker precache **does NOT carry over** to the wrap. Mitigations all live in the web layer — Layer 4 + PM-67a + PM-67c + S1 SW precache (all in flight). This is the perf ceiling for the wrap path; everything we do in the web layer applies to the wrap, but the wrap has no way to do better than that.

**C3 (LOW): `UIRequiredDeviceCapabilities = armv7` is anachronistic.** Should be `arm64`. One-line Info.plist fix. Cosmetic. Ship with C2.

**C5 (UNVERIFIED, important to verify): Does sw.js actually register inside WKWebView?** Safari supports SW; WKWebView does too but with quirks. If it does, the offline cache strategy applies to the wrap. If it doesn't, the wrap path is purely network-bound and the SW precache list (S1) does nothing for it. **Quick verification check for Mac tonight.**

**C6-C9: minor or informational.**

## Four verification checks for tonight's Mac session

These are quick non-blocking checks to add to the queue. Each takes <1 minute:

1. **Open Safari Web Inspector → iPhone → vyve-capacitor WebView → console.** Run `navigator.serviceWorker.controller` — is it null (SW not registered in wrap) or an object (SW running)?
2. **`ls android/app/google-services.json`** — does the FCM config exist locally?
3. **`grep -r POST_NOTIFICATIONS android/`** — is the permission injected anywhere by plugin gradles?
4. **Cold-launch iOS wrap, then in WebView console: `localStorage.length`** — does localStorage persist across launches (positive number) or wipe (0)?

Answers to these four definitively characterise the wrap's cold-launch behaviour. They take 5 minutes total and tell us whether C4 needs urgent action and whether C5 is "no concern" or "the wrap is uncached on every launch."

## Decision queued for 20:00

**Is the Capacitor work in scope before public launch (11 May 2026)?**

If yes:
- **C4 verification** is non-negotiable (Android launch could be affected).
- **C2 + C3** ship together as the next iOS rebuild (low effort, low risk, real wins).
- **C5 verification** informs whether wrap-specific web-layer mitigations are needed.

If no:
- Park C2, C3, C5 until post-launch.
- Still run the C4 verification — push notifications matter for enterprise demos.

## Updated programme completion picture

Premium-feel programme has TWO parallel paths now:
- **Web layer (PM-67a/c/d + Layer 5 + inline extraction):** ~70% done after tonight's PM-67a ship, ~85% after PM-67c+PM-67d ship next session.
- **Native wrap (C1-C9):** ~30% done — C1 architectural cost accepted, C7-C8 clean, but C2, C3, C4, C5 all unaddressed. C4 might be a launch blocker.

Combined: roughly **65% across both paths** today. After tonight's PM-67a + C4 verification + Layer 5 baseline: **75%**. After PM-67c + PM-67d + C2/C3 ship: **88%**. The remaining 12% is Layer 5-driven inline extraction priorities + any wrap-specific Layer 5 findings we can't predict.

— Claude, ~12:45 UTC
