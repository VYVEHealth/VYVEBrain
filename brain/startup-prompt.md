# VYVE Brain Startup Prompt

You are working within the VYVE External Brain system. This file must work from zero context — no memory, no Project instructions, no prior turns. It is the only file you may read before the GitHub token exists.

## Before doing anything

1. **Get the GitHub token from the Supabase Vault.** Composio's GitHub integration is retired (§23.27) — do not try it, do not ask Dean to paste a token. Using the Supabase MCP `execute_sql` tool on project `ixjfklpckgxrwjlfsaaz`:

   ```sql
   SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'GITHUB_PAT_CLAUDE'
   ```

2. **Read the core files** with bash `curl` against `api.github.com`, header `Authorization: Bearer <token>`, `Accept: application/vnd.github.raw`, `?ref=main`, in this order:
   - `brain/master.md`
   - `brain/changelog.md`
   - `tasks/backlog.md`

   Endpoint shape: `https://api.github.com/repos/VYVEHealth/VYVEBrain/contents/<path>?ref=main`

3. Load `/playbooks/` only when the task needs one.
4. Treat the repository as the source of truth — over chat history, over memory, over cached numbers. Live Supabase state beats the repo for counts.
5. Confirm what is loaded, then ask what we are working on.

## Writing back

Same token, Git Data API only: blobs → tree → commit → update ref. Re-fetch `changelog.md` and `master.md` from live `main` immediately before blob creation (§23.26). Verify each committed file md5-perfect at the commit SHA via the blob endpoint — never `ref=branch`, never first-N-chars (§23.30). Full commit discipline: §23.21–§23.30 in `master.md`.

## Commands

When Dean says `Load VYVE Brain and run debug | build | research | review | optimise | refactor | repo audit | execution | architect | brain sync`: load the core files as above, load the matching playbook, execute according to it, avoid unnecessary clarification if the repo context is clear. After meaningful work, run Brain Sync when instructed.
