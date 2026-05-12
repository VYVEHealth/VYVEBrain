# Dead Edge Function inventory (12 May 2026)

**Drafted:** 12 May 2026, ~10:00 UTC, PM-66 staging session.
**Author:** Claude.
**Audit method:** Full live EF list (101 functions) cross-referenced with:
- 9 April 2026 security audit "keep" list (24 core EFs)
- All 14 inner pages in vyve-site repo (grep for EF slug strings)
- vyve-command-centre admin repo (Dashboard.html, admin-console.html, index.html)
- pg_cron jobs table (all live cron commands)
- Brain/master.md §7 + §19 inventory

**Status:** Audit complete. 41 retire-safe candidates identified, classified by category. No deletions performed — list staged for Dean's review and bulk delete on his timing.

---

## Headline numbers

| Tier | Count | Action |
|---|---|---|
| A — Keep (core operational + admin + cron-driven) | 60 | No action |
| C — Retire (zero references, name confirms one-shot intent) | 41 | Stage for bulk delete |
| **TOTAL EFs live** | **101** | |

Net reduction if all 41 retire: **101 → 60 EFs** (a 41% reduction).

The 9 April audit identified 89 dead EFs. Most have since been deleted (the dead-list patterns like `pwa-*`, `push-*`, `patch-*`, `fix-*`, `write-*`, `theme-*` are entirely gone). The 41 here are a different cohort that accumulated since.

---

## Two correction catches

These two would have been retired by a naïve "name-pattern" sweep but are actually live cron infrastructure:

| EF | Why I almost retired it | Why it stays |
|---|---|---|
| `schema-snapshot-refresh` | Name pattern matched `^schema-snapshot-`, looked like a one-shot debug tool | **Live cron jobid 14**, runs Sundays 03:00 UTC. Refreshes the schema snapshot used by other ops. |
| `seed-weekly-goals` | Name pattern matched `^seed-`, looked like a one-shot data seeder | **Live cron jobid 20**, runs Mondays 00:01 UTC. Generates weekly goals for every member each week. |

**Lesson for the brain:** name-pattern retirement is unsafe by itself. Always cross-reference with cron jobs + portal references + admin references before scheduling any EF for deletion. Codify as §23 candidate.

---

## Retire candidates (41 EFs), by category

### A. One-shot member-specific operations (6 EFs)

These were created for a specific member intervention and don't need to live forever. Each has an admin-dashboard equivalent or is fully obsolete.

- `ban-user-anthony` — one-shot member ban; admin-member-edit covers this now
- `generate-stuart-plan` — one-shot member-specific running plan
- `resend-welcome` — one-shot; onboarding EF handles this
- `send-stuart-reset` — one-shot member-specific password reset
- `trigger-callum-workout` — one-shot member-specific workout
- `trigger-owen-workout` — one-shot member-specific workout

### B. One-shot DB migrations (3 EFs)

Migrations have run; tables/columns exist. Functions no longer serve a purpose.

- `create-ai-decisions-table` — table exists since Apr 2026
- `run-migration-monthly-checkins` — migration executed; monthly_checkins table is live
- `run-monthly-checkins-migration` — duplicate of above (was renamed/duplicated)

### C. Debug & test utilities (13 EFs)

Dev/debug-only. Some used during onboarding of a feature, others one-shot smoke tests.

- `check-cron` — diagnostic; superseded by Supabase Dashboard cron view
- `debug-cert-content` — cert debug utility
- `debug-exercise-search` — exercise debug utility
- `debug-show-file` — debug utility
- `fire-test-push` — push pipeline smoke test
- `force-cache-refresh` — one-shot SW cache nuke
- `inspect-members-schema` — schema introspection helper
- `monthly-checkin-test` — test variant of monthly-checkin
- `re-engagement-test-sender` — test sender
- `send-test-push` — push pipeline smoke test
- `send-test-welcome` — onboarding test
- `smoketest-ach-push` — achievement push smoke test
- `test-html-render` — HTML render smoke test

### D. Obsolete features (8 EFs)

Features that were either replaced by a different EF, absorbed into a larger one, or deferred indefinitely.

- `add-exercise-stream` — superseded by direct workouts table inserts
- `cc-data` — one-shot Lewis ops
- `delete-housekeeping` — one-shot
- `edit-habit` — absorbed into admin-member-habits
- `generate-workout-plan` — absorbed into onboarding EF v37 phase-2 background job
- `get-activity-feed` — social activity feed feature is backlogged post-Capacitor
- `send-password-reset` — Supabase Auth handles native password reset now
- `update-brain-changelog` — automated brain commits use Composio GITHUB_COMMIT_MULTIPLE_FILES path, not this EF

### E. One-shot seeders & setups (8 EFs)

Data seeding for the workout library / habit library / member units. Already ran.

- `seed-b1` — workout library seed batch 1
- `seed-library-1` — workout library seed
- `seed-library-2` — workout library seed
- `setup-ai-decisions` — superseded by `create-ai-decisions-table` (also retiring)
- `setup-member-units` — one-shot member units initialiser
- `thumbnail-audit` — one-shot
- `thumbnail-batch-upload` — one-shot
- `thumbnail-upload` — one-shot

### F. One-shot admin ops (2 EFs)

Lewis-driven one-shots that don't need persistent EFs.

- `vicki-doc-sender` — one-shot ops email helper
- `vicki-preview-sender` — one-shot ops email helper

### G. Other (1 EF)

- `create-test-member` — one-shot test member creator. Could be useful as a dev tool but if it's been live for 30+ days unused, retire.

---

## How to retire

Same pattern as the 9 April audit. Bulk delete via Supabase CLI:

```bash
PROJECT_REF="ixjfklpckgxrwjlfsaaz"

for fn in \
  ban-user-anthony generate-stuart-plan resend-welcome send-stuart-reset \
  trigger-callum-workout trigger-owen-workout \
  create-ai-decisions-table run-migration-monthly-checkins run-monthly-checkins-migration \
  check-cron debug-cert-content debug-exercise-search debug-show-file fire-test-push \
  force-cache-refresh inspect-members-schema monthly-checkin-test re-engagement-test-sender \
  send-test-push send-test-welcome smoketest-ach-push test-html-render \
  add-exercise-stream cc-data delete-housekeeping edit-habit generate-workout-plan \
  get-activity-feed send-password-reset update-brain-changelog \
  seed-b1 seed-library-1 seed-library-2 setup-ai-decisions setup-member-units \
  thumbnail-audit thumbnail-batch-upload thumbnail-upload \
  vicki-doc-sender vicki-preview-sender \
  create-test-member; do
  supabase functions delete $fn --project-ref $PROJECT_REF
done

echo "Run 'supabase functions list --project-ref $PROJECT_REF' to verify."
```

Alternative: Composio `GITHUB_*` cannot delete Supabase EFs (different toolkit), but we have the `Supabase` MCP toolkit available. There's no direct "delete function" tool in the Supabase MCP toolkit as of this audit, so deletion requires either the CLI or the Supabase Dashboard. **Don't expect Claude to do this for you — needs Dean's CLI access.**

---

## What this does NOT do

- Does NOT touch any of the 60 KEEP EFs.
- Does NOT remove any cron jobs.
- Does NOT alter any RPC, RLS policy, or schema.
- Does NOT affect any portal member-facing functionality.

---

## Proposed §23 hard rule

**Hard rule (added 12 May 2026): EF deletions must verify against pg_cron jobs AND portal repo references AND admin repo references BEFORE retiring.** Name-pattern matching alone is unsafe. Two examples surfaced in this audit (`schema-snapshot-refresh`, `seed-weekly-goals`) where naïve pattern matching would have killed live cron infrastructure. Each retire-or-keep decision needs three lookups: pg_cron commands, vyve-site grep, vyve-command-centre grep.

---

## Cross-references

- 9 April 2026 security audit (`/mnt/project/vyve_security_audit_2026-04-09.md`) — the original 89-EF retire pass
- Brain §7 "Edge Functions — 15 Core Operational" — out of date (now ~24+ core)
- Brain §19 "Completed — Dean (Technical)" — reflects the current core EF state
- pg_cron jobs table — 19 active cron jobs at audit time
- vyve-site HEAD `6225d504` (PM-65 baseline)
- vyve-command-centre HEAD `53cd1456`

---

*End of dead EF inventory. 41 retire-safe candidates documented. No code changes. Brain-only artefact.*
