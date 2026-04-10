# Playbook: GitHub Operator

> How AI reads and writes files in the VYVE Health repositories.

## Purpose
Safely read files from and commit changes to the VYVEHealth GitHub repos.

## When to Use
Every session that involves reading or modifying portal code.

## Repositories
| Repo | Hosts | Access |
|------|-------|--------|
| VYVEHealth/vyve-site (PRIVATE) | online.vyvehealth.co.uk | Composio full read/write |
| VYVEHealth/Test-Site-Finalv3 | www.vyvehealth.co.uk | Composio full read/write |

## Reading Files
1. **Composio** (preferred): GITHUB_GET_REPOSITORY_CONTENT or GITHUB_GET_FILE_CONTENT
2. **github-proxy GET**: `https://ixjfklpckgxrwjlfsaaz.supabase.co/functions/v1/github-proxy?path=filename.html`
3. **Direct API**: Ask Dean for temporary PAT if both fail

## Writing Files
1. **Composio GITHUB_COMMIT_MULTIPLE_FILES** (preferred): Atomic multi-file commits
2. **github-proxy PUT**: For large HTML files exceeding Composio limits
3. **Manual**: Output file for Dean to push via git CLI

## sw.js Cache Bump (MANDATORY)
After ANY portal file change, bump the service worker cache version:
```javascript
const CACHE_NAME = 'vyve-cache-v2026-04-0XX'; // increment last char
```
If you forget, users see stale cached pages.

## Commit Rules
1. Never commit API keys or secrets. Use ANTHROPIC_KEY_PLACEHOLDER.
2. Always provide complete files. No partial patches.
3. One logical change per commit.
4. Include sw.js bump in the same commit as portal changes.
5. Commit message format: `feat:` or `fix:` prefix.

## Failure Handling
| Problem | Action |
|---------|--------|
| Composio 403 on write | Expected for MCP reads. Use Composio direct or github-proxy PUT. |
| github-proxy 401 | GITHUB_PAT expired. Ask Dean to rotate in Supabase secrets. |
| File too large | Use github-proxy PUT. |
| Git conflict | Fetch latest, merge, then push. |
