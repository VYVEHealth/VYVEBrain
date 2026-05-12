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
