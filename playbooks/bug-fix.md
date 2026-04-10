# Playbook: Bug Fix

> Diagnosing and fixing issues in VYVE Health.

## Purpose
Systematically find root cause and deliver minimal, safe fix.

## When to Use
When something is broken — member report, Dean spots it, or found during dev.

## Step 1: Reproduce and Classify
Get facts: expected vs actual behaviour, which page/EF/table, when it started, one member or all?

| Type | Urgency |
|------|---------|
| Data (missing rows, RLS blocking) | HIGH |
| Auth (can't log in, JWT expired) | HIGH |
| Edge Function (500s, timeouts) | HIGH |
| Display (layout, colours) | MEDIUM |
| Logic (wrong calc, duplicates) | MEDIUM |
| Cache (stale after deploy) | LOW — sw.js bump |

## Step 2: Investigate

**Frontend bugs:** Read page from GitHub. Check theme.js and auth.js included.

**Edge Function bugs:** Check Supabase EF logs. Read source. Verify secrets.

**Database bugs:**
```sql
SELECT * FROM [table] WHERE member_email = '[email]' ORDER BY created_at DESC LIMIT 10;
```
Check RLS policies, triggers (cap_*), constraints.

**Auth bugs:**
```sql
SELECT email, created_at, last_sign_in_at FROM auth.users WHERE email = '[email]';
```

## Step 3: Fix
Minimal fix first. Don't rewrite. Don't refactor.
- HTML/JS: Complete file, bump sw.js, commit.
- Edge Function: Complete index.ts, deploy, verify logs.
- Database: SELECT first to confirm targets, then UPDATE/INSERT/DELETE.
- Auth: Create missing auth user or send password reset.

## Step 4: Verify
Test the fix. Check for regressions. Check mobile (iOS PWA).

## Step 5: Document
Root cause, fix applied, files changed, follow-up actions.

## Common VYVE Bugs
| Symptom | Fix |
|---------|-----|
| Stale content after deploy | Bump sw.js cache |
| Unauthorized on load | Check auth.js, verify session |
| EF returns 500 | Check logs, verify secrets |
| Activity not logging | Check cap trigger, activity_dedupe |
| Workout programme missing | Check workout_plan_cache for member |
| Dark/light broken | Ensure dual CSS blocks + theme.js |
| workouts.html blank | Use MutationObserver, not waitForAuth |
| Chat not working | Check session_chat RLS, Realtime subscription |

## Output Format
```markdown
## Bug Fix Report
**Bug:** [description]
**Root Cause:** [explanation]
**Fix:** [what changed]
**Files Modified:** [list]
**sw.js Bumped:** [yes/no]
**Verified:** [yes/no]
**Follow-up:** [actions]
```
