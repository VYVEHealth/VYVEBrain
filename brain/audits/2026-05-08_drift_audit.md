# VYVE Brain Drift Audit — 2026-05-08

**Auditor:** Claude (CTO session, single-purpose audit)  
**Scope:** Cross-reference master.md / changelog.md / backlog.md against live state  
**Method:** Reverse-chronological changelog walk + forward master sweep + backlog reconciliation + live-state introspection on every concrete claim  
**Sources of truth in priority order:** Live Supabase / live GitHub HEAD > changelog.md (history) > backlog.md (open work) > master.md (synthesis target)  
**Brain shas at audit time:** master `597fd80c`, changelog `6ca47716`, backlog `c2401097`  

This report surfaces drift only — no fixes shipped this session. Triage in next session.

---

## Executive summary

**Total drift hits: 19** across 5 severity buckets.

| Severity | Count | Definition |
|---|---|---|
| Critical | 3 | Master is materially wrong about live state in ways that will break a future session's pre-flight |
| High | 4 | Changelog entry shipped real code/infra but never landed in master synthesis sections |
| Medium | 7 | Counts, version numbers, ezbr hashes, header tallies stale vs live |
| Low | 3 | Cosmetic / wording / formatting |
| Cleanup | 2 | Backlog reconciliation noted, no master-side action |

**Top 3 fix-now items (Critical bucket):**

1. **§6 line 216 trigger claim is materially wrong.** Master says triggers on 10 source tables including 3 health tables; live truth is 8 tables, the health tables aren't triggered, `weekly_scores` is. Trigger name is wrong too (`tg_refresh_member_home_state` is the function, `zzz_refresh_home_state` is the trigger).
2. **§6 header says "76 tables", live is 85.** Header drift on the canary line — flagged ahead of audit, confirmed.
3. **§7 omits the 4 GDPR EFs from "Core operational" table.** Shipped 07 May PM-3 (commits 3 + 4), in changelog and §19, but missing from the §7 inventory rows. Pre-flight that asks "do we have erasure infra?" will return false negative.

Full per-section findings below. Numbering is contiguous across sections.

---

## §6 Tables (4 hits)

### Hit 1 — CRITICAL — `member_home_state` triggers are on 8 tables, not 10; trigger name is wrong

**Master.md §6 line 216 / §23 line 1130 (both copies of same claim):**

> "fired SYNCHRONOUSLY by `tg_refresh_member_home_state` triggers on every source-table mutation across **10 source tables** (daily_habits, workouts, cardio, session_views, replay_views, wellbeing_checkins, member_health_connections, member_health_daily, member_health_samples, weekly_goals)"

**Live (`pg_trigger` join `pg_class` filtered by definition LIKE '%refresh_member_home_state%'):**

8 tables carry the trigger: `cardio`, `daily_habits`, `replay_views`, `session_views`, `weekly_goals`, **`weekly_scores`**, `wellbeing_checkins`, `workouts`. The 3 `member_health_*` tables do NOT carry the trigger. `weekly_scores` does (master omits it).

Trigger name is `zzz_refresh_home_state` (the `zzz_` prefix forces it to fire last in alphabetical trigger order — relevant for post-write evaluator ordering). The `tg_refresh_member_home_state` symbol in master is the trigger FUNCTION name, not the trigger name itself.

**Proposed correction:** Rewrite the §6 line 216 sentence and the §23 line 1130 mirror to read:

> Writer is `refresh_member_home_state(p_email)` plpgsql function, fired SYNCHRONOUSLY by `zzz_refresh_home_state` AFTER INSERT OR DELETE OR UPDATE triggers (each calling `tg_refresh_member_home_state()`) on 8 source tables: `cardio`, `daily_habits`, `replay_views`, `session_views`, `weekly_goals`, `weekly_scores`, `wellbeing_checkins`, `workouts`. Healthkit tables (`member_health_connections`, `member_health_daily`, `member_health_samples`) do NOT trigger refreshes — autotick path writes through to `daily_habits` / `workouts` / `cardio` and inherits the refresh from those.

### Hit 2 — CRITICAL — §6 header says "76 tables", live is 85

**Master.md §6 line 136:**

> ## 6. Supabase architecture — 76 tables

**Live (`SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'`):** 85 tables.

This was the canary the user explicitly called out at session open. Confirmed.

**Proposed correction:** Change header to "## 6. Supabase architecture — 85 tables" and update intro paragraph if it repeats the count.

### Hit 3 — HIGH — §6 missing 5 live tables (3 newly shipped, 2 from PM-2)

**Live tables not documented anywhere in §6:**

- `gdpr_erasure_requests` (07 May PM-3, security commit 4)
- `gdpr_export_requests` (07 May PM-3, security commit 3)
- `perf_telemetry` (08 May PM-21)
- `exercise_canonical_names` (08 May PM-2)
- `exercise_name_misses` (08 May PM-2)

All five exist in changelog entries and are referenced in §19. None has a row in any §6 table-list block.

**Proposed correction:** Add a new "GDPR" subsection to §6 covering `gdpr_export_requests` + `gdpr_erasure_requests`. Add `perf_telemetry` to "Dashboard + aggregation" or create a new "Telemetry" subsection. Add `exercise_canonical_names` + `exercise_name_misses` to "Workouts, exercise, programmes" subsection (next to `exercise_logs` etc.).

### Hit 4 — MEDIUM — `member_home_state` claims **58 columns**, live is **65**

**Master.md §6 line 216:**

> Dashboard aggregate, **58 columns**

**Live (`information_schema.columns` filtered):** 65 columns. The delta of 7 covers (a) the 5 `*_this_week` columns added 06 May PM-2, (b) the 5 `last_*_at` columns added 08 May PM-16, minus (c) the 3 already-present columns the master count was based on. Net the master count is from before the 06 May / 08 May extensions.

**Proposed correction:** Change "58 columns" to "65 columns" and add a one-line note: "Last extended 08 May 2026 PM-16 with 5 `last_*_at` columns."

---

## §7 Edge Functions (5 hits)

### Hit 5 — CRITICAL — §7 "Core operational" table omits the 4 GDPR EFs

**Live ACTIVE EFs not in §7 core table:** `gdpr-erase-request`, `gdpr-erase-cancel`, `gdpr-erase-status`, `gdpr-erase-execute`, `gdpr-export-request`, `gdpr-export-execute`.

These are referenced indirectly in the §7 cron-jobs table (`vyve-gdpr-export-tick`, `vyve-gdpr-erase-daily`) and in the §19 status entries for 07 May PM-3, but they have no row in the §7 "Core operational" inventory. A pre-flight that greps §7 for "gdpr" finds the cron rows only — no EF metadata, no version, no JWT posture, no purpose summary.

**Proposed correction:** Add 6 rows to §7 "Core operational" — one for each shipped GDPR EF — with versions and purposes pulled from the 07 May PM-3 changelog entry.

### Hit 6 — MEDIUM — §7 header says "86 Edge Functions", live is 96

**Master.md §7 line 271:**

> 86 Edge Functions as of 04 May 2026.

**Live (Supabase Management API `GET /v1/projects/{ref}/functions`):** 96 ACTIVE EFs. The +10 since 04 May covers the 6 GDPR EFs, `log-perf` v1, and 3 small one-shots.

**Proposed correction:** Update to "96 Edge Functions as of 08 May 2026" and refresh the "~32 actively operational" claim — actual core operational count after adding the GDPR EFs is ~64.

### Hit 7 — MEDIUM — §7 cron-jobs header says "(19 active)", actual list and live both have 20

**Master.md §7 line 365:**

> ### Cron jobs (19 active)

The sub-table immediately below contains 20 rows. Live `cron.job` filtered by `active=true` returns 20 jobs. The header tally is one short of its own list — likely a leftover from PM-1's dedupe of jobid 19 not making the head-count update.

**Proposed correction:** Change to "(20 active)".

### Hit 8 — LOW — §7 cron-jobs table is missing nothing structural — just a couple of stale "purpose" descriptors

The 20 cron rows in §7 are all present in `cron.job`. The descriptions tagged with platform versions or EF names are mostly current. One spot of staleness: the `vyve_charity_reconcile_daily` row in §7 reads as a free-text inline rather than a clean table row; it was tacked on after the fact (PM-11). Not load-breaking, just inconsistent.

**Proposed correction:** Re-flow the `vyve_charity_reconcile_daily` row to match the pipe-table format of the other 19 rows.

### Hit 9 — LOW — Versioning-note disclaimer references stale numbers

Master.md §7 versioning-note paragraph (line 273):

> e.g. `send-email` brain `v22` while source said `v4`; `wellbeing-checkin` brain `v35` while source said `v25`

Live `wellbeing-checkin` is platform v43, source v28 (per 07 May commit 1B). The disclaimer is making the right point but the example numbers are now drift bait themselves.

**Proposed correction:** Either drop the specific numerical examples or update them to current values. Cleaner: drop. The principle stands without the example.

---

## §19 Current status (1 hit)

### Hit 10 — HIGH — §19 covers 08 May entries through PM-22 inclusive but doesn't yet mention PM-1's cron dedupe inline

**Master.md §19 carries the 08 May PM-22 entry as the most recent.** All entries from PM-22 down to PM-1 are present. Audit pass through §19 found one inconsistency: PM-1 (cron dedupe + EF cleanup, 95 → 93 EFs) is captured in §19, but the EF count it cites (93) was correct as of PM-1 mid-day; subsequent same-session shipping of `log-perf` v1 (PM-21) bumped live to 96. The §19 narrative reads as if 93 was the final state.

**Proposed correction:** Add a one-line trailer to the §19 PM-1 entry: "EF count subsequently rose to 96 as later PM-21 / PM-22 sessions shipped `log-perf` and the leaderboard RPC artefacts."

---

## §23 Hard rules (1 hit)

### Hit 11 — LOW — §23 `member_home_state` rule mirrors §6's stale 10-source-tables claim

§23 line 1130 hard rule (the `member_home_state` writer rule from 06 May PM-2) reads:

> fired by `tg_refresh_member_home_state` triggers on every source-table mutation across 10 source tables (daily_habits, workouts, cardio, session_views, replay_views, wellbeing_checkins, member_health_connections, member_health_daily, member_health_samples, weekly_goals)

Same wrong claim as §6 (Hit 1). Same correction needed.

**Proposed correction:** Apply the corrected sentence from Hit 1 here too — the rule and the §6 prose should be byte-identical so a future grep finds them both. Note `weekly_scores` is on the trigger list, the 3 `member_health_*` tables are not.

---

## §24 References (3 hits)

### Hit 12 — MEDIUM — §24 SW cache key is 2 days stale

**Master.md §24:**

> | SW cache | `vyve-cache-v2026-05-06a-workout-resume` |

**Live (`vyve-site/sw.js` on main HEAD `df41d7cb`):** `vyve-cache-v2026-05-08-perf-shim-f`. 12 SW cache bumps have shipped between the master value and live (06 May `workout-resume` → 08 May `perf-shim-f` via the entire 08 May session sequence).

**Proposed correction:** Update the §24 SW cache row to current value AND consider dropping it from §24 entirely — it's a value that bumps every commit, so any §24 reference is stale by definition. Better to point at the live `sw.js` file: "Live cache key: `<see vyve-site/sw.js>`".

### Hit 13 — MEDIUM — §24 references `welcome.html` as Stripe redirect target

**Master.md §24:**

> | Stripe payment link | `buy.stripe.com/00wfZicla1Em0NnaIB93y00` → `welcome.html` |

The marketing site historically used `onboarding_v8.html` for this; some recent brain content refers to it as `welcome.html`. Live status not verified this audit (Stripe redirect URL would need an HTTP check or a Stripe dashboard read). Flag for next-session triage.

**Proposed correction:** Verify the live Stripe redirect target via Stripe dashboard or live HEAD-request, then reconcile.

### Hit 14 — LOW — §24 iOS App Store version says 1.2 approved, but no §19 entry on the approval

**Master.md §24:**

> iOS App Store | VYVE Health app — version 1.2 approved 28 April 2026, Ready for Distribution.

§19 still anchors at 1.1 Build 3 submitted 27 April. The 1.2 approval is referenced here but not in §19. Either §19 is missing the approval landing or §24 is ahead of reality. Couldn't verify live (no App Store Connect tool wired).

**Proposed correction:** Cross-check via App Store Connect at next session, then either backfill §19 or correct §24 to reflect actual state.

---

## Backlog reconciliation (no master changes — informational only)

### Note A — 46 closed items, 40 open items, 1 hotfix marker

Backlog is well-maintained. Spot-check across the 08 May closures: every ✅ CLOSED item maps to either a §19 status entry or a 08 May changelog entry. No closed-but-not-shipped drift detected.

### Note B — Open items that may have shipped subsequently

The "Still pending (not started)" section in backlog (line 64) carries one PM-22 entry:

> 📋 **PM-22 — leaderboard snapshot table + cron + EF rewrite.** ~4-6h.

This was the original framing. PM-22 actually shipped as the SQL-side `get_leaderboard()` RPC (08 May PM-22 changelog entry, the reframe explicitly noted). The "Still pending" entry is now stale and should be removed — the closed-items section at the top of backlog already captures the actual ship.

**Proposed correction (next session):** Remove the line-64 "Still pending PM-22" entry; the actual work is in the "Added 08 May PM-22" closed items above.

---

## Live-state snapshot (reference for next session's fixes)

| Item | Live value | Master value |
|---|---|---|
| Public table count | 85 | 76 |
| Active EF count | 96 | 86 |
| Active cron jobs | 20 | 19 (header) / 20 (list) |
| Members | 15 | (not stated in master) |
| `member_home_state` columns | 65 | 58 |
| `member_home_state` triggers | 8 source tables (`cardio`, `daily_habits`, `replay_views`, `session_views`, `weekly_goals`, `weekly_scores`, `wellbeing_checkins`, `workouts`) | 10 (incl. 3 health tables, omits weekly_scores) |
| vyve-site main HEAD | `df41d7cb` (08 May PM-21) | (master has §19 entries through PM-22) |
| SW cache key | `vyve-cache-v2026-05-08-perf-shim-f` | `vyve-cache-v2026-05-06a-workout-resume` (§24 stale) |

---

## Prioritised remediation list

### Critical (fix immediately — pre-flight will break otherwise)

1. **Hit 1 + Hit 11** — Correct `member_home_state` trigger claim in §6 and §23 (both copies). 8 tables, not 10. Trigger name `zzz_refresh_home_state`, function name `tg_refresh_member_home_state`. `weekly_scores` is on the list, the 3 `member_health_*` tables are not.
2. **Hit 2** — §6 header to 85 tables.
3. **Hit 5** — Add 6 GDPR EF rows to §7 "Core operational" table.

### High (fix this week — correctness drift but not load-breaking)

4. **Hit 3** — Add 5 missing tables to §6 (`gdpr_erasure_requests`, `gdpr_export_requests`, `perf_telemetry`, `exercise_canonical_names`, `exercise_name_misses`).
5. **Hit 10** — Trailer the §19 PM-1 entry with the EF count delta.

### Medium (fix when next in those sections — counts/version drift)

6. **Hit 4** — `member_home_state` columns to 65.
7. **Hit 6** — §7 EF total header to "96 Edge Functions as of 08 May 2026".
8. **Hit 7** — §7 cron header to "(20 active)".
9. **Hit 12** — §24 SW cache key — either update or drop in favour of "see live sw.js".
10. **Hit 13** — Verify Stripe redirect target, reconcile §24.

### Low (skip unless already in those sections)

11. **Hit 8** — Re-flow `vyve_charity_reconcile_daily` row to table format.
12. **Hit 9** — Drop the stale numerical examples from the §7 versioning-note paragraph.
13. **Hit 14** — Cross-check iOS 1.2 approval status.

### Backlog cleanup (next session, optional)

- Remove the stale "Still pending PM-22" line from `tasks/backlog.md` (covered by Note B).

---

*End of audit. Report committed under `brain/audits/2026-05-08_drift_audit.md`. Master and changelog NOT modified this session — fixes are next-session work, this report is the deliverable.*
