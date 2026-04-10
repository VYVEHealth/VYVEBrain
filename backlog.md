# Playbook: Feature Build

> End-to-end delivery of a new feature for the VYVE Health platform.

---

## Purpose
Build and ship a complete feature — from requirements through to deployed code.

## When to Use
When adding a new portal page, Edge Function, database table, or significant enhancement to an existing page.

---

## Pre-Flight Checklist

Before writing any code:

- [ ] Read `brain/master.md` (or confirm it's loaded)
- [ ] Read `brain/schema-snapshot.md` to understand current DB state
- [ ] Confirm the feature doesn't already exist (check portal pages list)
- [ ] Identify which tables are affected or need creating
- [ ] Identify which Edge Functions are affected or need creating
- [ ] Confirm any blockers (e.g. "needs Lewis copy approval")

---

## Step-by-Step Execution

### Step 1: Requirements Clarification

Ask these questions if not already answered:
1. What does this feature do from the member's perspective?
2. Which portal page(s) does it affect?
3. Does it need a new Edge Function?
4. Does it need new database tables or columns?
5. Does it involve the Anthropic API?
6. Is there an existing page to use as a pattern? (e.g. wellbeing-checkin.html for check-in flows)
7. Are there any Lewis sign-off items blocking this?

### Step 2: Architecture Design

Produce a brief plan:
```
Feature: [name]
New page: [yes/no — filename]
New EF: [yes/no — function name]
New table: [yes/no — table name + columns]
Existing files modified: [list]
AI involved: [yes/no — which model, which EF]
Auth: [JWT required / public / API key]
```

Get Dean's approval on this plan before building.

### Step 3: Database Changes (if needed)

1. Design the table with RLS from the start.
2. Use Supabase MCP `apply_migration` or `execute_sql` for DDL.
3. Add RLS policies — use `(select auth.email())` pattern (not `auth.email()` directly — causes row-re-evaluation).
4. Add appropriate indexes on member_email and any FK columns.
5. Update `brain/schema-snapshot.md` immediately.

**Table naming conventions:**
- Lowercase, snake_case
- Member-scoped tables always have `member_email` column as FK to `members.email`
- Include `created_at timestamptz DEFAULT now()`

### Step 4: Edge Function (if needed)

1. Write complete `index.ts` — no partial files.
2. Handle auth:
   - Member-facing: validate JWT internally (`const { data: { user } } = await supabase.auth.getUser(token)`)
   - Public: `verify_jwt: false` in config
   - Employer: API key check
3. If calling Anthropic API:
   - Use `ANTHROPIC_API_KEY` from secrets
   - Never hardcode keys
   - Use appropriate model (Sonnet 4 for complex, Haiku 4.5 for simple/fast)
4. Return proper error codes (400 for bad input, 401 for auth failure, 409 for duplicates, 500 for server errors).
5. Deploy via Supabase CLI or Dashboard.

### Step 5: Portal Page (if needed)

Build the HTML file following VYVE conventions:
- Single self-contained HTML file with inline CSS and JS
- Include `theme.js` before `</head>`
- Include `nav.js` before `</body>`
- Include `auth.js` and gate the page behind Supabase Auth
- Use dual dark/light CSS blocks (not single `:root`)
- Use the VYVE colour palette: #0D2B2B (dark), #1B7878 (teal), #4DAAAA (teal-lt), #c9a84c (gold)
- Fonts: Playfair Display (headings), DM Sans / Inter (body)
- Mobile-first, `100dvh` for full-height layouts
- No `target="_blank"` without `rel="noopener"`

### Step 6: Commit and Deploy

1. Commit portal files via Composio `GITHUB_COMMIT_MULTIPLE_FILES` or github-proxy PUT.
2. **Bump sw.js cache version** in the same commit.
3. Deploy Edge Functions via Supabase CLI.
4. Test the feature in a browser (Dean logs in and verifies).

### Step 7: Update Documentation

1. Update `brain/master.md` with the new feature.
2. Update `brain/schema-snapshot.md` if DB changed.
3. Archive the task card to `tasks/completed/`.

---

## VYVE Page Template (Skeleton)

```html
<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>VYVE — [Page Name]</title>
  <link rel="manifest" href="/manifest.json">
  <link rel="icon" href="/favicon.ico">
  <style>
    /* Dark theme */
    [data-theme="dark"] { --bg: #0D2B2B; --text: #E0E0E0; --card: #163636; --teal: #1B7878; --teal-lt: #4DAAAA; --gold: #c9a84c; }
    /* Light theme */
    [data-theme="light"] { --bg: #F5F5F5; --text: #1a1a1a; --card: #FFFFFF; --teal: #1B7878; --teal-lt: #4DAAAA; --gold: #c9a84c; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'DM Sans', 'Inter', sans-serif; background: var(--bg); color: var(--text); min-height: 100dvh; }
  </style>
  <script src="/theme.js"></script>
</head>
<body>
  <div id="app">
    <!-- Page content here -->
  </div>
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <script src="/auth.js"></script>
  <script src="/nav.js"></script>
  <script>
    // Page logic here
  </script>
</body>
</html>
```

---

## Failure Handling

| Problem | Action |
|---------|--------|
| Feature requires a table that already exists | Read schema-snapshot.md. Modify existing table, don't duplicate. |
| Edge Function deploy fails | Check for syntax errors. Ensure full index.ts. Check Supabase logs. |
| Anthropic API returns errors | Verify ANTHROPIC_API_KEY is set in secrets. Check model name is correct. |
| Page doesn't render after deploy | Check sw.js cache was bumped. Hard refresh (Ctrl+Shift+R). |
| Auth fails on new page | Verify auth.js is included and Supabase client is initialised. |

---

## Output Format

Deliver:
1. Architecture plan (approved before building)
2. SQL migrations (if any)
3. Complete Edge Function index.ts (if any)
4. Complete HTML file(s)
5. Updated sw.js with bumped cache version
6. Commit message
7. Updated documentation entries
