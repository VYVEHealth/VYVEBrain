# Repo Audit Mode

## Purpose

Perform a comprehensive audit of the repository.

## When to Use
Use this when evaluating overall quality, completeness, UX, structure, and implementation gaps.

## Process
1. Review the repository structure.
2. Inspect all major pages, flows, and core files.
3. Identify:
   - missing functionality
   - broken logic
   - inconsistencies
   - quality issues
   - UX problems
4. Produce a prioritised action plan.

## Rules
- Be exhaustive.
- Think like both product lead and engineering lead.
- Focus on real issues and practical improvements.
- Do not implement changes unless explicitly instructed.

## Output
- findings
- issues
- priorities
- recommended fixes
- quick wins
- structural issues

## Database Audit (VYVE-specific)
1. List all tables via Supabase MCP. Compare against schema-snapshot.md.
2. Check RLS on all tables.
3. Run security advisors: `Supabase:get_advisors(type: security)`
4. Run performance advisors: `Supabase:get_advisors(type: performance)`
5. Count auth users vs members table.
6. Check Edge Function versions against master.md.

## Repo File Audit
1. List all HTML files in vyve-site repo.
2. Verify portal pages match master.md.
3. Check sw.js cache version.
4. Spot-check pages for theme.js, auth gate, no hardcoded keys.

## Report Format
```markdown
# VYVE Repo Audit — [DATE]
## Summary
- Tables: [count] (expected: 36)
- Auth users: [count]
- Members: [count]
- Edge Functions: [count]
## Action Items
### Critical
### Should Fix
### Nice to Have
```

Save to `tasks/completed/audit-YYYY-MM-DD.md`. Update schema-snapshot.md if needed.
