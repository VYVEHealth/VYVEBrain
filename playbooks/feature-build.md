# Playbook: Feature Build

> End-to-end delivery of a new feature for VYVE Health.

## Purpose
Build and ship a complete feature from requirements to deployed code.

## When to Use
New portal page, Edge Function, database table, or significant enhancement.

## Pre-Flight
- [ ] Read brain/master.md
- [ ] Read brain/schema-snapshot.md
- [ ] Confirm feature doesn't already exist
- [ ] Identify tables/EFs affected
- [ ] Confirm blockers (Lewis sign-off items)

## Step 1: Requirements
Ask if not answered: What does it do? Which pages? New EF? New tables? Anthropic API? Pattern page? Lewis blockers?

## Step 2: Architecture Plan
```
Feature: [name]
New page: [yes/no — filename]
New EF: [yes/no — function name]
New table: [yes/no — columns]
Existing files modified: [list]
Auth: [JWT / public / API key]
```
Get Dean's approval before building.

## Step 3: Database (if needed)
- RLS from the start. Use `(select auth.email())` pattern.
- Index member_email and FK columns.
- Update schema-snapshot.md immediately.
- Naming: lowercase, snake_case, member_email FK, created_at default now().

## Step 4: Edge Function (if needed)
- Complete index.ts. No partial files.
- JWT: `supabase.auth.getUser(token)` internally. Public: verify_jwt false.
- Anthropic: ANTHROPIC_API_KEY from secrets. Sonnet 4 complex, Haiku 4.5 fast.
- Proper error codes: 400/401/409/500.

## Step 5: Portal Page (if needed)
- Single self-contained HTML with inline CSS/JS.
- theme.js before </head>. nav.js before </body>. auth.js for gating.
- Dual dark/light CSS blocks. VYVE palette: #0D2B2B, #1B7878, #4DAAAA, #c9a84c.
- Fonts: Playfair Display headings, DM Sans/Inter body.
- Mobile-first, 100dvh.

## Step 6: Commit and Deploy
1. Commit via Composio or github-proxy PUT.
2. Bump sw.js cache version.
3. Deploy EFs via Supabase CLI.
4. Test in browser.

## Step 7: Update Docs
Update master.md, schema-snapshot.md, archive task card.

## VYVE Page Skeleton
```html
<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>VYVE — [Page Name]</title>
  <style>
    [data-theme="dark"] { --bg:#0D2B2B; --text:#E0E0E0; --card:#163636; --teal:#1B7878; --teal-lt:#4DAAAA; --gold:#c9a84c; }
    [data-theme="light"] { --bg:#F5F5F5; --text:#1a1a1a; --card:#FFF; --teal:#1B7878; --teal-lt:#4DAAAA; --gold:#c9a84c; }
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:'DM Sans','Inter',sans-serif; background:var(--bg); color:var(--text); min-height:100dvh; }
  </style>
  <script src="/theme.js"></script>
</head>
<body>
  <div id="app"></div>
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <script src="/auth.js"></script>
  <script src="/nav.js"></script>
</body>
</html>
```

## Failure Handling
| Problem | Fix |
|---------|-----|
| Table already exists | Modify existing, don't duplicate |
| EF deploy fails | Check syntax, full index.ts, Supabase logs |
| Anthropic errors | Verify ANTHROPIC_API_KEY secret, model name |
| Page blank after deploy | Bump sw.js, hard refresh |
| Auth fails | Check auth.js inclusion, Supabase client init |
