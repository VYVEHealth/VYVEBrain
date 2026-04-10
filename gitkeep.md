# Playbook: GitHub Operator

> How AI reads and writes files in the VYVE Health repositories.

---

## Purpose
Safely read files from and commit changes to the VYVEHealth GitHub repos.

## When to Use
Every session that involves reading or modifying portal code, marketing site code, or any file in the GitHub repos.

---

## Repositories

| Repo | URL | Hosts | Access |
|------|-----|-------|--------|
| `VYVEHealth/vyve-site` | PRIVATE | online.vyvehealth.co.uk (portal) | Composio GitHub integration (full read/write) |
| `VYVEHealth/Test-Site-Finalv3` | PUBLIC | www.vyvehealth.co.uk (marketing) | Composio GitHub integration |

---

## Reading Files

### Method 1: Composio GitHub (Preferred)
Use `GITHUB_GET_FILE_CONTENT` or `GITHUB_LIST_DIRECTORY` via Composio integration.

### Method 2: github-proxy Edge Function (GET)
```
GET https://ixjfklpckgxrwjlfsaaz.supabase.co/functions/v1/github-proxy?path=filename.html
```
Returns the raw file content.

### Method 3: Direct GitHub API
If Composio is unavailable, ask Dean for a temporary PAT.

---

## Writing Files

### Method 1: Composio GITHUB_COMMIT_MULTIPLE_FILES (Preferred)
- Use for atomic multi-file commits
- Always include sw.js bump in the same commit if portal files changed
- Commit message format: `feat: [description]` or `fix: [description]`

### Method 2: github-proxy Edge Function (PUT)
```
PUT https://ixjfklpckgxrwjlfsaaz.supabase.co/functions/v1/github-proxy?path=filename.html
Body: raw file content
```
- Used for large HTML files that exceed Composio limits
- One file per request

### Method 3: Download + Manual Push
If both Composio and github-proxy are unavailable:
1. Generate the complete file content
2. Output it for Dean to save locally
3. Dean pushes manually via git CLI

---

## sw.js Cache Bump (MANDATORY)

After ANY portal file change, bump the service worker cache version:

```javascript
// In sw.js, find the CACHE_NAME line:
const CACHE_NAME = 'vyve-cache-v2026-04-0XX';
// Increment the last character (a→b, b→c, etc.)
// Or if at 'z', increment the number and reset to 'a'
```

**If you forget this step, users will see stale cached pages.**

---

## Commit Rules

1. **Never commit API keys, tokens, or secrets.** Use `ANTHROPIC_KEY_PLACEHOLDER` in code.
2. **Always provide complete files.** No partial patches.
3. **Test locally or verify the logic before committing.** The portal is live.
4. **One logical change per commit.** Don't bundle unrelated changes.
5. **Include sw.js bump** in the same commit as portal file changes.

---

## Failure Handling

| Problem | Action |
|---------|--------|
| Composio returns 403 on write | This is expected for MCP reads. Use Composio direct or github-proxy PUT instead. |
| github-proxy returns 401 | GITHUB_PAT may have expired. Ask Dean to rotate it in Supabase secrets. |
| File too large for Composio | Use github-proxy PUT method. |
| Git conflict on push | Fetch latest first, merge, then push. |

---

## Output Format

When proposing code changes, always provide:
1. **File path** (e.g. `workouts.html`)
2. **Complete file content** (never diffs for HTML pages)
3. **sw.js cache bump** (new version string)
4. **Commit message**
