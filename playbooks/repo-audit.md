# Playbook: Repo Audit

> Full health check of the VYVE codebase and infrastructure.

## Purpose
Verify live system matches documentation, catch drift, find issues.

## When to Use
- Monthly (scheduled)
- After major feature deployments
- After losing AI context (account disruption, model switch)
- Before enterprise demos

## Phase 1: Database Verification (10 min)
1. List all tables via Supabase MCP. Compare count against schema-snapshot.md.
2. Check RLS status — every table must have rls_enabled: true.
3. Run security advisors: `Supabase:get_advisors(type: security)`
4. Run performance advisors: `Supabase:get_advisors(type: performance)`
5. Count auth users: `SELECT count(*) FROM auth.users;` Compare with members.
6. Check Edge Function versions against master.md.

## Phase 2: Repo File Check (10 min)
1. List all HTML files in vyve-site repo root.
2. Verify each portal page in master.md exists.
3. Read sw.js — record CACHE_NAME value.
4. Check auth.js references Supabase, not Auth0.
5. Spot-check 3 pages for theme.js, auth gate, no hardcoded keys.

## Phase 3: Edge Function Verification (5 min)
1. List deployed EFs via Supabase.
2. Compare against master.md live function list.
3. Flag any not in keep list.
4. Check for stub/test functions to clean up.

## Phase 4: Report
```markdown
# VYVE Repo Audit — [DATE]
## Summary
- Tables: [count] (expected: 36)
- Auth users: [count]
- Members: [count]
- Edge Functions: [count]
- Security issues: [count]
- Performance warnings: [count]
## Action Items
### Critical
### Should Fix
### Nice to Have
```

Save to `tasks/completed/audit-YYYY-MM-DD.md`. Update schema-snapshot.md if needed.
