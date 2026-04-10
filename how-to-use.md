# Playbook: Repo Audit

> Full health check of the VYVE codebase and infrastructure.

---

## Purpose
Verify the live system matches documentation, catch drift, find issues before they become production problems.

## When to Use
- Monthly (scheduled)
- After major feature deployments
- After losing AI context (account disruption, model switch)
- Before enterprise demos

---

## Step-by-Step Execution

### Phase 1: Database Verification (10 min)

1. **List all tables** via Supabase MCP or `list_tables` tool.
   - Compare count against `brain/schema-snapshot.md`
   - Flag any new tables not in the snapshot
   - Flag any tables in the snapshot that no longer exist

2. **Check RLS status** — every table must have `rls_enabled: true`.

3. **Run security advisors:**
   ```
   Supabase:get_advisors(type: "security")
   ```
   - Document any WARN or ERROR level findings

4. **Run performance advisors:**
   ```
   Supabase:get_advisors(type: "performance")
   ```
   - Document duplicate indexes, missing indexes, RLS init plan issues

5. **Count auth users:**
   ```sql
   SELECT count(*) FROM auth.users;
   ```
   - Compare with members table count. Gap = members without auth accounts.

6. **Check Edge Function versions** against the master brain document.

### Phase 2: Repo File Check (10 min)

1. **List all HTML files** in the vyve-site repo root.
2. **Verify each portal page** listed in master.md exists.
3. **Check sw.js** — read the CACHE_NAME value. Record it.
4. **Check auth.js** — verify it references Supabase, not Auth0.
5. **Spot-check 3 random pages** for:
   - `theme.js` included before `</head>`
   - Supabase Auth gate present
   - No hardcoded API keys

### Phase 3: Edge Function Verification (5 min)

1. List deployed Edge Functions (via Supabase dashboard or MCP).
2. Compare against the live function list in master.md.
3. Flag any functions not in the keep list — candidates for deletion.
4. Check for stub/test functions that should be cleaned up.

### Phase 4: Report Generation

Produce a markdown report with:

```markdown
# VYVE Repo Audit — [DATE]

## Summary
- Tables: [count] (expected: 36)
- Auth users: [count]
- Members: [count]
- Edge Functions: [count] active
- Security issues: [count]
- Performance warnings: [count]

## Changes Since Last Audit
- [list of new/removed/changed items]

## Action Items
### 🔴 Critical
- [items]

### 🟡 Should Fix
- [items]

### 🟢 Nice to Have
- [items]

## Schema Updates Needed
[If schema-snapshot.md needs updating, list the changes]
```

---

## Tool Usage

| Tool | Used For |
|------|----------|
| Supabase MCP (list_tables, execute_sql, get_advisors) | Database checks |
| Composio GitHub (GITHUB_LIST_DIRECTORY, GITHUB_GET_FILE_CONTENT) | Repo file checks |
| github-proxy GET | Alternative file reading |

---

## Failure Handling

| Problem | Action |
|---------|--------|
| Can't connect to Supabase MCP | Use Supabase Dashboard manually. Document what you can't verify. |
| Can't read GitHub repo | Use github-proxy GET as fallback. |
| Schema has drifted significantly | Stop audit. Update schema-snapshot.md first. Then re-run. |

---

## Output
Save the audit report to `tasks/completed/audit-YYYY-MM-DD.md` and update `brain/schema-snapshot.md` if anything changed.
