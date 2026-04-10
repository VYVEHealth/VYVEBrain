# Playbook: Bug Fix

> Diagnosing and fixing issues in the VYVE Health platform.

---

## Purpose
Systematically identify the root cause of a bug and deliver a minimal, safe fix.

## When to Use
When a member, Dean, or Lewis reports something broken — or when you spot an issue during development.

---

## Step-by-Step Execution

### Step 1: Reproduce and Classify

**Get the facts:**
1. What is the expected behaviour?
2. What is the actual behaviour?
3. Which page / Edge Function / table is involved?
4. When did it start happening? (After a deploy? After a data change?)
5. Does it affect all members or just one?

**Classify the bug:**

| Type | Examples | Urgency |
|------|----------|---------|
| **Data** | Missing rows, wrong values, RLS blocking reads | HIGH — can block members |
| **Auth** | Can't log in, JWT expired, redirect loop | HIGH — members locked out |
| **Display** | Layout broken, wrong colours, missing content | MEDIUM |
| **Logic** | Wrong calculation, duplicate entries, wrong persona | MEDIUM |
| **Edge Function** | 500 errors, timeouts, wrong response shape | HIGH |
| **Cache** | Stale page after deploy | LOW — sw.js bump fixes it |

### Step 2: Investigate

**For frontend (HTML/JS) bugs:**
1. Read the page file from GitHub (Composio or github-proxy GET).
2. Search for the relevant function or DOM element.
3. Check for obvious issues: typos, missing variables, incorrect selectors.
4. Check if `theme.js` and `auth.js` are properly included.

**For Edge Function bugs:**
1. Check Supabase Edge Function logs (Dashboard → Edge Functions → Logs).
2. Read the function source if available.
3. Check the request/response shape.
4. Verify secrets are set (ANTHROPIC_API_KEY, GITHUB_PAT, etc.).

**For database bugs:**
1. Query the affected table:
   ```sql
   SELECT * FROM [table] WHERE member_email = '[email]' ORDER BY created_at DESC LIMIT 10;
   ```
2. Check RLS policies — are they blocking the expected operation?
3. Check triggers — is cap_* redirecting to activity_dedupe?
4. Check constraints — is a CHECK constraint rejecting valid data?

**For auth bugs:**
1. Check `auth.users` for the member's account:
   ```sql
   SELECT email, created_at, last_sign_in_at FROM auth.users WHERE email = '[email]';
   ```
2. Verify the member exists in the `members` table too.
3. Check if the page is using JWT correctly.

### Step 3: Fix

**Minimal fix first.** Don't rewrite the page. Don't refactor. Fix the specific bug.

**For HTML/JS fixes:**
1. Read the current file.
2. Make the minimal change.
3. Provide the complete updated file (no diffs — VYVE convention).
4. Bump sw.js cache version.
5. Commit via Composio or github-proxy PUT.

**For Edge Function fixes:**
1. Provide complete updated `index.ts`.
2. Deploy via Supabase CLI: `supabase functions deploy [name] --project-ref ixjfklpckgxrwjlfsaaz`
3. Verify the fix in logs.

**For database fixes:**
1. Write the SQL fix.
2. Test with a SELECT first to confirm it targets the right rows.
3. Execute the UPDATE/INSERT/DELETE.
4. Verify with a follow-up SELECT.

**For auth fixes:**
1. If member missing from auth.users → create via `backfill-auth-users` EF or manual SQL.
2. If password reset needed → send reset email via Supabase Dashboard.
3. If member exists in auth but not members → investigate onboarding flow.

### Step 4: Verify

1. **Test the fix** — open the affected page, reproduce the original steps, confirm the bug is gone.
2. **Check for regressions** — does anything else on the same page look broken?
3. **Check mobile** — many VYVE members use iOS PWA.

### Step 5: Document

Update the task card with:
- Root cause
- Fix applied
- Files changed
- Any follow-up actions needed

---

## Common VYVE Bugs and Quick Fixes

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| Page shows stale content after deploy | sw.js cache not bumped | Bump cache version, commit, hard refresh |
| "Unauthorized" on page load | JWT expired or auth.js not loaded | Check auth.js inclusion, verify Supabase session |
| Edge Function returns 500 | Syntax error or missing secret | Check EF logs, verify secrets |
| Activity not logging | Cap trigger redirected to activity_dedupe | Check activity_dedupe table, verify cap hasn't been hit |
| Workout programme not showing | workout_plan_cache empty for member | Check if onboarding Phase 2 completed (waitUntil) |
| Dark/light mode broken | Missing dual CSS block or theme.js | Ensure both `[data-theme="dark"]` and `[data-theme="light"]` blocks exist |
| workouts.html blank on load | Auth polling issue | Ensure MutationObserver pattern, NOT waitForAuth |
| Chat not working on session pages | session_chat RLS or Supabase Realtime issue | Check RLS policies, verify Realtime subscription |

---

## Failure Handling

| Problem | Action |
|---------|--------|
| Can't identify root cause | Add console.log statements to the page, deploy, reproduce, check browser console |
| Fix makes something else break | Revert the commit, investigate the interaction |
| Fix requires Lewis sign-off | Document the fix, mark task as BLOCKED, notify Lewis |
| Live member is affected | Prioritise — fix and deploy within the session if possible |

---

## Output Format

```markdown
## Bug Fix Report
**Bug:** [one-line description]
**Reported:** [date]
**Root Cause:** [explanation]
**Fix:** [what was changed]
**Files Modified:** [list]
**Edge Functions Redeployed:** [list]
**sw.js Bumped:** [yes/no — new version]
**Verified:** [yes/no]
**Follow-up:** [any remaining actions]
```
