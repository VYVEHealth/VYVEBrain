# Session Loading Protocol

> The new "Load VYVE brain" routine. Replaces the 4-file full-brain load (master + changelog + backlog + taxonomy) with a working-set load.
>
> Created 09 May 2026 PM-37-Setup.

---

## What changed

**Old protocol (sessions PM-30 through PM-40):**
1. Read `brain/master.md` (305KB) in full
2. Read `brain/changelog.md` (744KB) in full
3. Read `tasks/backlog.md` (180KB) in full
4. Read `playbooks/cache-bus-taxonomy.md` (42KB) in full
5. Confirm brain loaded, ask what we're working on

Total: ~1.27MB of context per session before any work starts. Most of it not used. The full master + changelog re-read every session was the single largest context tax.

**New protocol (PM-41 onwards):**
1. Read `brain/active.md` (~42KB curated working set)
2. Read the matching playbook(s) for the session goal
3. Grep the last 3 changelog headers via `grep -E "^## 2026-" brain/changelog.md | head -3` — read ONLY those entries (~10-30KB), not the full 744KB
4. Confirm brain loaded, ask what we're working on

Total: ~70-90KB of context per session. ~95% reduction.

**Premium-feel framing:** the old protocol was the brain equivalent of network-first HTML serving. The new protocol is stale-while-revalidate — paint instantly from the working set, fetch canonical only when a question genuinely needs it. The same architectural principle that made the portal feel instant applies to brain loading.

---

## Read order at session start

```
1. brain/active.md                                      [ALWAYS]
2. The relevant playbook(s)                             [SCOPED to session goal]
3. Last 3 changelog entries (grep then targeted read)   [ALWAYS]
4. (Optional) Pre-flight live state                     [WHEN ACTIVE.MD §2 IS STALE]
```

### 1. `brain/active.md`

Always read in full. ~42KB. Contains: source-of-truth chain, live state snapshot (HEAD SHAs, mobile binaries, cache-bus key), 1c migration campaign status (3.1) + audit-count baseline (3.2) + open methodology (3.3), curated §23 working-set rules (4.1-4.9), backlog top P0/P1, credentials/URLs, "fetch canonical when X" lookup table.

### 2. The relevant playbook(s)

Match to session goal:

| Session goal | Playbook to load |
|---|---|
| 1c migration (default for next ~3 sessions) | `playbooks/1c-migration-template.md` + `playbooks/cache-bus-taxonomy.md` |
| Build new feature | `playbooks/feature-build.md` + `playbooks/build.md` |
| Bug fix | `playbooks/bug-fix.md` + `playbooks/debug.md` |
| Repo audit | `playbooks/repo-audit.md` |
| Refactor | `playbooks/refactor.md` |
| Architecture decision | `playbooks/architect.md` |
| Brain sync (post-session commit) | `playbooks/brain-sync.md` |
| GitHub operations | `playbooks/github-operator.md` |
| Disaster recovery | `playbooks/disaster-recovery.md` |
| Frontend perf audit | `playbooks/perf-audit-2026-05-08.md` |

**DEFAULT DURING THE PREMIUM FEEL CAMPAIGN (PM-77 onwards): `playbooks/premium-feel-campaign.md`.** Always load this playbook + active.md + last 3 changelog entries on every session during the campaign. Old default reference to 1c-migration-template was for the closed Layer 1c work — historical only. After the Premium Feel Campaign closes (PF-20 ships, target 31 May 2026), this default will shifts to whatever campaign is next.

### 3. Last 3 changelog entries via grep

NOT a full file read. Pattern:

```python
# Pseudocode for the load step
import re
cl_text = read_file("brain/changelog.md")  # full file
# Find the line numbers of the most recent 3 ## 2026- headers
header_pat = re.compile(r'^## 2026-\d{2}-\d{2}\s+(.*)')
header_lines = [
    (i, m.group(1)) 
    for i, ln in enumerate(cl_text.splitlines()) 
    for m in [header_pat.match(ln)] if m
][:3]  # changelog is reverse-chrono, so [:3] = most recent 3

# Read only those 3 entries (each ~50-70 lines)
# For each header, slice from its line to the next header's line
```

In practice: use `recent_chats` style logic adapted to changelog. Each entry is ~3-5KB. Three entries = ~10-15KB. Grep, slice, read. Do not load the 744KB changelog file in full — that's the discipline.

### 4. (Optional) Pre-flight live state

When active.md §2 looks stale (e.g. SHAs from a previous session, no recent edit timestamps), refresh:
- `vyve-site` main HEAD via `GITHUB_GET_A_REPOSITORY` or `GITHUB_GET_REPOSITORY_CONTENT` on root
- `VYVEBrain` main HEAD same
- Supabase project state if the session involves schema or EF deploys

The active.md §2 row gets patched at session-end commit, so consecutive sessions only need this when something dramatic has shifted (e.g. an emergency hotfix shipped between sessions).

---

## Deferred-fetch pattern (the §4.9 hard rule, expanded)

The old protocol's pre-flight fetched the whole vyve-site tree before every session. The new protocol fetches ONLY the files the migration explicitly touches at pre-flight time, and runs the whole-tree primitive audit AFTER the patch ships, in parallel with writing the brain commit.

### Pre-flight fetches (target file only)

```
1. The publish-site file(s) the migration touches
2. The subscriber files the migration extends (if any new wiring)
3. NOT the whole tree
4. NOT every page that loads bus.js
```

For 1c migrations, this is typically 2-4 files. Compare to the whole-tree pre-flight which was 73+ files in PM-26 era.

### Post-ship audit (whole-tree)

After the patch lands and post-ship verification passes (steps 1-4 of `1c-migration-template.md` § Post-ship verification):

```
1. GITHUB_GET_A_TREE recursive on vyve-site main, new HEAD
2. Filter to source extensions (.html .js .ts .css .mjs)
3. Parallel-fetch every blob in the filtered list
4. Run the primitive count regex (with PM-37 + PM-40 classification rules)
5. Compute the delta vs the pre-ship baseline (§3.2 in active.md)
6. If delta matches expected: update §3.2, ship the brain commit
7. If delta does NOT match: investigate
```

The audit runs IN PARALLEL with writing the brain commit content (changelog entry, backlog patch, taxonomy patch, master.md §23 patch if applicable, active.md patches). Don't serialize — workbench cells can do both. Saves session time.

### What this preserves

The audit-count discipline (PM-37 + PM-40 classification rules) applies to the post-ship audit, not the pre-ship state. We're not skipping the audit — we're moving it. The migration ships against a target-file pre-flight that's narrower but still definitive for that file. The whole-tree validation comes after, where it can run alongside other commit-prep work.

### What this trades

- Slight risk: if a publishing site exists in a file we didn't pre-flight, it's missed at pre-flight and only caught at post-ship. Mitigation: the post-ship audit catches it before the brain commit, so the discovery cost is a fast-fix, not a regression.
- Reward: ~75% reduction in session pre-flight tool calls. Sessions that used to ship 1-2 migrations now ship 4-6 because the pre-flight tax dropped.

---

## When to break the protocol

This protocol assumes the session is on the well-trodden path: a 1c migration, a §23-rule fix, a small feature. Break the protocol when:

- **First session after a long gap.** If active.md is more than 3 sessions old, do a one-off full-brain load to verify nothing dramatic shifted that active.md missed.
- **Cross-domain investigation.** If the question spans schema + EF + portal + RLS, you may need master.md §6 + §7 + §8 + §16. Fetch them on demand per active.md §7 lookup table.
- **Pre-PM-30 historical investigation.** Active.md is post-PM-30 working set. For pre-PM-30 history, fetch master.md §19 (full current status) or grep changelog.md by date.
- **Major incident or production breakage.** Skip directly to disaster-recovery.md and live state. Brain hierarchy is irrelevant in incident response.
- **Brain sync session.** If the goal is a major brain rewrite (full master.md rewrite, taxonomy overhaul), load everything in full — that's the meta-work that justifies the cost.

---

## Confirming the load is complete

After reading active.md + relevant playbook(s) + last 3 changelog tail, the response shape is:

```
Brain loaded. State summary:
- vyve-site main: <SHA> (PM-NN ship, <date>)
- VYVEBrain main: <SHA>
- 1c campaign: NN of 14 shipped, next P0 = <surface>
- Active rules in scope: <list relevant §4 sub-rules for the session goal>

What are we working on?
```

Short. Definitive. No filler. The brain load is a fact-check, not a recap.

---

## Ongoing maintenance

- **Update active.md §2 SHAs** at the end of every session that ships to vyve-site or VYVEBrain. Atomic with the session's brain commit.
- **Patch active.md §3.1 + §3.2** at the end of every 1c migration session.
- **Patch active.md §4** when a new §23 sub-rule earns working-set residency (criterion: does this rule fire on a path the member sees during a typical session?).
- **Patch active.md §5** when backlog top items shift.
- **Patch active.md §7** when a new canonical source needs adding (e.g. a new playbook).
- **Rebuild active.md** when 3+ sessions have accumulated patches OR when a major campaign ends (1c-14 + cleanup commit is the next rebuild trigger).

The rebuild is a full rewrite against current master.md, not an incremental edit. Same discipline as master.md's own periodic full rewrites — drift compounds, patches accumulate, eventually the working set is no longer current. Better to rebuild than paper over.
