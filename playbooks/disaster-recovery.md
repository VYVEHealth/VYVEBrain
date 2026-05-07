# VYVE Disaster Recovery Playbook

> Single-document recovery procedures for the five failure scenarios identified in the 06 May 2026 backup/DR audit. Each section is self-contained — read only the section that matches your situation.

---

## Index

1. [Edge Function rollback](#1-edge-function-rollback) — restore an EF from `staging/edge-functions/` after a bad deploy or `SUPABASE_UPDATE_A_FUNCTION` corruption
2. [Capacitor SSD loss](#2-capacitor-ssd-loss) — _(deferred to backup session 2)_
3. [Supabase project deletion](#3-supabase-project-deletion) — _(deferred to backup session 2)_
4. [APNs key rotation](#4-apns-key-rotation) — _(deferred to backup session 2)_
5. [Storage bucket loss](#5-storage-bucket-loss) — _(deferred to backup session 2 — depends on Item 4 rclone backup landing first)_

---

## 1. Edge Function rollback

**When to use this:**

- A deploy went out and the EF returns persistent `BOOT_ERROR` or hard-throws on every invoke.
- `SUPABASE_UPDATE_A_FUNCTION` was used by accident (Composio path) and the bundle is now corrupted (per §23 hard rule — UPDATE mangles ESZIP, only DEPLOY is safe for body changes).
- A code change shipped that broke a downstream surface (e.g. member-dashboard EF returns wrong shape; trigger pages break) and the fastest recovery is reverting to the last-known-good source rather than diagnosing forward.
- A deploy went out without a corresponding brain commit and you need to inspect what was actually running before the change.

**Source of truth.** `VYVEBrain/staging/edge-functions/{slug}/` — populated weekly by the **Backup Edge Function Source** GitHub Actions workflow (`.github/workflows/backup-edge-functions.yml`, schedule `0 2 * * 0` Sundays 02:00 UTC, plus on-demand via the Actions UI's `Run workflow` button). The runner uses `supabase functions download` (CLI) which handles whatever ESZIP format version the Management API returns — that pivot is documented under §23 below. The MANIFEST.json at the top of `staging/edge-functions/` records every EF's `platform_version`, `verify_jwt`, `ezbr_sha256`, and per-file `sha256` at snapshot time. Cross-reference with `git log` on the brain repo to find the snapshot date you want to roll back to.

**Procedure.**

1. **Identify the target snapshot.** Open `VYVEBrain/staging/edge-functions/MANIFEST.json` on `main` (or any historical commit). Confirm the `snapshot_at` is the version you want and the EF's entry has `ok: true`. If the most recent snapshot is too new (i.e. it captured the broken state), `git log` the staging dir on the brain repo and check out an older commit.

2. **Capture the current corrupt state as a forensic snapshot.** Before overwriting, save what's currently deployed so we can post-mortem the corruption afterward:
   ```
   Supabase:get_edge_function(slug=<slug>, project_id=ixjfklpckgxrwjlfsaaz)
   ```
   Paste the response into a `forensics/{slug}-{ISO}-corrupt.json` scratch file (don't commit). Note the `ezbr_sha256` and `version` — you'll diff these against the rolled-back versions afterward to confirm the EF actually changed.

3. **Read the staged source.** From the brain repo, read every file under `staging/edge-functions/{slug}/`. The MANIFEST `entries[slug].files[]` array tells you exactly which files were captured (preserves relative paths like `_shared/taxonomy.ts`). Verify each file's sha256 matches the manifest entry — if any mismatch, the staging is itself drifted and you need to step back to an earlier brain commit.

4. **Reconstruct the deploy `files[]` payload.** Build the array in the shape `Supabase:deploy_edge_function` expects:
   ```json
   [
     { "name": "index.ts", "content": "<staged content>" },
     { "name": "_shared/taxonomy.ts", "content": "<staged content>" }
   ]
   ```
   Names match the staged file names verbatim (no path mangling).

5. **Deploy via the native MCP, NOT Composio.** This is non-negotiable — per §23 the Composio `SUPABASE_DEPLOY_FUNCTION` has no `verify_jwt` parameter (defaults true) and `SUPABASE_UPDATE_A_FUNCTION` corrupts bundles. Use:
   ```
   Supabase:deploy_edge_function(
     name=<slug>,
     project_id=ixjfklpckgxrwjlfsaaz,
     entrypoint_path="index.ts",
     verify_jwt=<value from manifest entry>,
     files=<array from step 4>
   )
   ```
   The `verify_jwt` argument MUST match what the manifest captured. If it doesn't, you'll either close off cron access (jwt:true on a bearer-less cron) or open up an authenticated EF (jwt:false on a member-facing surface).

6. **Verify with a real invocation.** Don't trust the deploy response alone — the §23 rule about bundle corruption was diagnosed through a deploy that returned 200 but invoked into BOOT_ERROR. Hit the EF with a representative payload:
   - For cron-only EFs: empty body POST, `Content-Type: application/json`, no auth header (matches the cron command shape).
   - For member-facing EFs: through the actual portal page that calls it, observing the network panel.
   - For service-role-guarded EFs: via the dual-auth pattern using `LEGACY_SERVICE_ROLE_JWT`.

7. **Confirm the new deploy's `ezbr_sha256` differs from the corrupt forensic snapshot.** Refetch via `Supabase:get_edge_function`. If the ezbr is identical to the corrupt one, the deploy didn't take — iterate.

8. **Update the brain.** New §19 entry with the rollback (slug, snapshot date rolled to, ezbr before/after, root-cause if known). New §23 rule if a new failure mode was discovered.

**What the Actions workflow writes per run.** A single commit to `main` from `vyve-ef-backup-bot` with message `vyve-ef-source-backup: {succeeded}/{attempted} EFs @ {ISO}`. The `MANIFEST.json` carries per-EF `ok`, `error`, `platform_version`, `verify_jwt`, `ezbr_sha256`, `entrypoint`, plus a `files[]` array with `name`, `sha256`, `bytes` per file. **Failure detection** is via GitHub's native Actions failure email — when the run conclusion is `failure`, GitHub emails the repo admin (Dean) automatically. No `vyve_job_runs` row, no `email-watchdog` integration — the runner moved out of Supabase, so those server-side observability surfaces don't apply. **Partial failures** (some EFs fetched, some didn't) do NOT mark the workflow run failed — they're visible in the manifest's per-entry `error` field. Read the manifest after each run to spot drift before it bites in a real rollback.

**Hard rule (locked in 07 May 2026 PM-5):** never run a rollback against a manifest where `ef_count_failed > 0` for the EF you're rolling back. If the slug you need is in the failed list, walk back to an earlier brain commit where it succeeded.

**Edge cases.**

- **Shared modules.** `_shared/taxonomy.ts` and `_shared/achievements.ts` are sibling files imported by multiple EFs. The backup captures them under each EF that imports them — a rollback of `member-dashboard` brings the version of `_shared/taxonomy.ts` that was in member-dashboard's bundle at snapshot time, which may differ from what's in `log-activity`'s bundle. If you're rolling back something that uses a shared module, also roll back any other EF whose copy of that module differs, in the same deploy session, otherwise you'll drift the modules out of lockstep at runtime.
- **EFs not in the KEEP list.** One-shot patchers, debug helpers, and `send-stuart-reset`-style hardcoded triggers aren't backed up. If one of those breaks, restoration is from chat history or just rebuilding from scratch — they're scoped to be disposable.
- **Brand-new EF (deployed since the last Sunday).** First brain backup hasn't run for it yet. Either trigger `vyve-ef-source-backup` manually before rolling back, or copy the source from your local clipboard / chat / whatever channel the deploy came from. The backup is weekly because deploys happen rarely and chat-history fallback covers the gap acceptably.

**Manual ad-hoc backup before risky deploys.** Before any deploy you suspect might go badly (large refactor, unfamiliar EF, time-pressured fix), trigger the workflow manually: github.com → VYVEBrain → Actions → 'Backup Edge Function Source' → Run workflow (main branch). Or via API: `gh workflow run backup-edge-functions.yml -R VYVEHealth/VYVEBrain`. ~2 minutes later staging is fresh and committed. Now you have a roll-back point dated to the moment before your risky deploy.

---

## 2. Capacitor SSD loss

_(Deferred to backup session 2 — recovery flow: clone `VYVEHealth/vyve-capacitor`, `npm install`, no pod install needed (SPM-only Capacitor 6), re-link signing certs from Apple Developer portal. Confirm `.gitignore` covers all signing artefacts before the first new commit. Brain §23 `vyve-capacitor git workflow` rule has the auth setup (fine-scoped GitHub PAT in macOS Keychain).)_

---

## 3. Supabase project deletion

_(Deferred to backup session 2 — recovery flow: open Supabase support ticket immediately to request snapshot restoration. Confirm snapshot date. Replay any post-snapshot migrations from `VYVEBrain/migrations/` after restore. Run `vyve-ef-source-backup` immediately to rebuild staging against the restored project. Reset all Edge Function secrets — they don't carry through snapshots.)_

---

## 4. APNs key rotation

_(Deferred to backup session 2 — recovery flow: workaround for Apple's 2-keys-per-team cap. Existing keys: `2MWXR57BU4` (currently active) plus one other. Sequence: revoke the second slot's key first to make room → create new key → update `APNS_AUTH_KEY` Supabase secret → invoke `push-send-native` end-to-end against Dean's iPhone token → revoke `2MWXR57BU4` once new key confirmed working. Currently logged as accepted risk in §22 pending Sage procurement diligence.)_

---

## 5. Storage bucket loss

_(Deferred to backup session 2 — depends on Item 4 (storage rclone backup) shipping first. Recovery flow once that's in place: rclone pull from B2 backup. 266 objects across 4 buckets; `exercise-videos` is the irreplaceable one (custom workout footage shot for the library).)_

---

*Last updated: 07 May 2026 PM-5. Section 1 live; sections 2-5 scaffolded for backup session 2 build.*
