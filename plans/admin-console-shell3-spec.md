# Admin Console Spec — Shell 3

Written: 22 April 2026
Owner: Dean Brown
Status: Planned (Shell 1 + Shell 2 live)
Parent spec: `plans/admin-console-spec.md`
Repo: `VYVEHealth/vyve-command-centre` (file: `admin-console.html`)

> **Why this document exists.** The 22 April morning session shipped a broken Shell 2 v1 EF because code was written before a spec. The root cause was codified in the lessons section of the parent spec: *no spec = hallucinated schema*. This document is the source of truth for Shell 3's field inventory, EF contract, RLS model, and rollout order. Code is not to be written for any Shell 3 endpoint until the relevant section here is agreed.

---

## 1. Goals

Shell 3 extends the admin console with the operations Shell 2 consciously punted on:

1. **Cross-table edits** — habits (`member_habits`), workout programme (`workout_plan_cache`), weekly goals (`weekly_goals`). These are not columns on `members`, so they need their own endpoints and UI panels.
2. **Bulk operations** — apply persona/stream/re-engagement changes to many members at once, with one audit row per affected member.
3. **Content library CRUD** — admin-only editing of `habit_library`, `programme_library`, `knowledge_base` (today these are read-only from the portal side and have never had an admin UI).
4. **Advanced audit** — filter `admin_audit_log` by admin, date range, action, table, free-text reason search. Currently the UI only shows recent rows scoped to one member.

Deferred to a later shell (not Shell 3): **member impersonation**. Impersonation needs a separate threat model (time-boxed tokens, explicit "acting as" banner in the portal, special audit action), and the support volume today doesn't justify it.

## 2. Non-goals

- No schema changes to `members`. Everything lives on the already-documented tables.
- No new UI surface outside `admin-console.html`. Shell 3 adds sections/panels to the existing Kahunas-style detail page and list page; it does not spawn a new file.
- No changes to the Shell 2 EF (`admin-member-edit`). It stays focused on `members`-column edits.
- No cron jobs, no background workers. Every Shell 3 EF responds synchronously to a single admin action.

## 3. Edge Function inventory (new)

| Function                   | Version | Purpose                                                         | verify_jwt |
|----------------------------|---------|-----------------------------------------------------------------|------------|
| `admin-member-habits`      | v1      | Assign / remove / toggle habits on a member's `member_habits`    | true       |
| `admin-member-programme`   | v1      | Edit `workout_plan_cache` for a member (pause, resume, swap plan, advance week/session, regenerate) | true |
| `admin-member-weekly-goals`| v1      | Upsert `weekly_goals` for current/future ISO week                | true       |
| `admin-bulk-ops`           | v1      | Batch persona / exercise_stream / re_engagement_stream change; capped at 100 members per call | true |
| `admin-content-library`    | v1      | CRUD over `habit_library`, `programme_library`, `knowledge_base` | true       |
| `admin-audit-search`       | v1      | Filter/search `admin_audit_log`                                  | true       |

All six follow the `admin-member-edit` v4 pattern: JWT via `anon.auth.getUser`, allowlist lookup on `admin_users` with `active=true`, service-role DB access, CORS allowlist (same set), structured JSON responses, audit logging on every mutating action.

## 4. Field inventory — cross-table edits (Sub-scope A)

### 4.1 `member_habits` — habit assignment

**Real schema (verified 22 April against live DB):**

| Column         | Type        | Nullable | Notes                                                    |
|----------------|-------------|----------|----------------------------------------------------------|
| `id`           | uuid        | no       | PK                                                       |
| `member_email` | text        | no       | FK → `members.email`. UNIQUE with `habit_id`             |
| `habit_id`     | uuid        | no       | FK → `habit_library.id`                                  |
| `assigned_at`  | timestamptz | no       | `now()`                                                  |
| `assigned_by`  | text        | no       | CHECK: `onboarding` / `ai` / `theme_update` / `self`     |
| `active`       | boolean     | no       | `true`                                                   |

**Important constraint.** `assigned_by` does not currently allow `admin`. Shell 3 must either:
- (a) **Extend the CHECK** to include `admin` (migration: one-line DDL, no data change), or
- (b) **Write as `self`** when admin assigns on behalf of a member.

Recommendation: **(a) — extend the CHECK**. Preserves audit fidelity (we can always tell when a human admin assigned a habit vs the onboarding AI). Migration lives at `plans/admin-console-shell3-migrations.sql` when the section is approved.

**Actions:**

| Action            | Input                                                 | DB effect                                                      |
|-------------------|-------------------------------------------------------|----------------------------------------------------------------|
| `list_habits`     | `{ member_email }`                                    | SELECT with join to `habit_library` for title/pot/difficulty   |
| `list_library`    | `{ pot? }`                                            | SELECT from `habit_library` where `active=true`, optionally filtered by `habit_pot` |
| `assign_habit`    | `{ member_email, habit_id, reason }`                  | UPSERT on `(member_email, habit_id)`, set `active=true`, `assigned_by='admin'` |
| `deactivate_habit`| `{ member_email, habit_id, reason }`                  | UPDATE `active=false` (soft delete — history preserved)        |
| `reactivate_habit`| `{ member_email, habit_id, reason }`                  | UPDATE `active=true`                                           |

Every mutating action is SCARY (it changes what the member is prompted with daily). All require `reason` (min 5 chars). Audit writes `table_name='member_habits'`, `column_name='active'` (for toggles) or `'habit_id'` (for new assignments), with old/new JSON showing the habit title from `habit_library`.

### 4.2 `workout_plan_cache` — programme

**Real schema:**

| Column               | Type        | Nullable | Notes                                                   |
|----------------------|-------------|----------|---------------------------------------------------------|
| `id`                 | uuid        | no       | PK                                                      |
| `member_email`       | text        | no       | **UNIQUE** — one row per member                         |
| `programme_json`     | jsonb       | no       | full 8-week plan                                        |
| `plan_duration_weeks`| int         | no       |                                                         |
| `current_week`       | int         | no       | `1`                                                     |
| `current_session`    | int         | no       | `1`                                                     |
| `generated_at`       | timestamptz | yes      |                                                         |
| `is_active`          | boolean     | yes      | `true` — used by portal to show/hide                    |
| `paused_at`          | timestamptz | yes      |                                                         |
| `source`             | text        | yes      | `'onboarding'` / `'share'` / `'admin_regen'`            |
| `source_id`          | text        | yes      |                                                         |

**Constraint awareness.** `member_email` UNIQUE forces upsert-on-conflict for any write. This is the same trap that produced Hard Rule 44 earlier today (share-workout v10): **never UPDATE-then-INSERT**. Every write in this EF uses `.upsert({...}, { onConflict: 'member_email' })`.

**Actions:**

| Action              | Input                                  | DB effect                                                       |
|---------------------|----------------------------------------|-----------------------------------------------------------------|
| `get_programme`     | `{ member_email }`                     | SELECT — returns the current row (or null)                       |
| `pause_programme`   | `{ member_email, reason }`             | UPDATE `is_active=false, paused_at=now()`                        |
| `resume_programme`  | `{ member_email, reason }`             | UPDATE `is_active=true, paused_at=null`                          |
| `advance_week`      | `{ member_email, to_week, reason }`    | UPDATE `current_week`, clamp 1..`plan_duration_weeks`            |
| `swap_plan`         | `{ member_email, library_programme_id, reason }` | UPSERT: copy `programme_json` from `programme_library`, reset `current_week=1, current_session=1, source='admin_swap', source_id=library_programme_id` |
| `regenerate`        | `{ member_email, reason }`             | Fire-and-forget call to the existing `generate-workout-plan` EF with admin override (new column needed on that EF's input; deferred to Shell 3.1 if too invasive) |

All SCARY. `regenerate` is an intentionally sharper action and has its own confirmation step in the UI.

### 4.3 `weekly_goals` — target editing

**Real schema:**

| Column            | Type | Nullable | Notes                                       |
|-------------------|------|----------|---------------------------------------------|
| `id`              | bigint | no     | PK (sequence)                               |
| `member_email`    | text   | no     | UNIQUE with `week_start`                    |
| `week_start`      | date   | no     | UNIQUE with `member_email` (ISO Monday)     |
| `habits_target`   | int    | no     | default `3`                                 |
| `workouts_target` | int    | no     | default `2`                                 |
| `cardio_target`   | int    | no     | default `1`                                 |
| `sessions_target` | int    | no     | default `1`                                 |
| `checkin_target`  | int    | no     | default `1`                                 |
| `created_at`      | timestamptz | no | `now()`                                    |

**Actions:**

| Action                 | Input                                                       | DB effect                                             |
|------------------------|-------------------------------------------------------------|-------------------------------------------------------|
| `get_weekly_goals`     | `{ member_email, week_start? }`                             | SELECT — default to the current ISO Monday if omitted |
| `upsert_weekly_goals`  | `{ member_email, week_start, habits_target, workouts_target, cardio_target, sessions_target, checkin_target, reason }` | UPSERT on `(member_email, week_start)`        |

**Validation:**
- `week_start` must be a Monday (ISO day-of-week 1). Future or current week only — past weeks are immutable (returns 400).
- Every target in range `0..14` (a week has 7 days; 14 is a generous upper bound covering twice-a-day targets).

All SCARY — changes a member's visible targets for the week.

## 5. Sub-scope B — Bulk operations (`admin-bulk-ops`)

Scope is deliberately narrow: **three fields only** can be bulk-changed from Shell 3. These are the ones Lewis has asked about informally in the past (re-segment a company, move everyone to a new exercise stream after the Exercise Hub restructure lands, pause re-engagement during a PR incident):

- `persona`
- `exercise_stream`
- `re_engagement_stream`

### Contract

```
POST { action: 'bulk_set_field',
       field_name: 'persona' | 'exercise_stream' | 're_engagement_stream',
       new_value: string,
       member_emails: string[],     // max 100 per call
       reason: string }              // min 10 chars for bulk (stricter than Shell 2's 5)
→ { success, updated: [email], skipped: [{email, reason}], audit_rows_written: int }
```

### Guarantees

1. **Atomicity per member, not per batch.** Each member is processed in its own transaction. A single failure does not roll back the others — failures land in `skipped[]` with a reason.
2. **One audit row per affected member.** `admin_audit_log` gets N rows for N members. `action='bulk_field_edit'` distinguishes these from single edits.
3. **Role gating.** `coach_exercise` can bulk-set `exercise_stream` only. `persona` and `re_engagement_stream` are admin/`coach_full`/`coach_mental` only.
4. **Hard cap: 100 members per call.** If the UI selects >100, it batches client-side. No EF-level paging — admins are expected to see what they're doing.
5. **HAVEN guard.** Bulk-setting `persona='HAVEN'` is blocked at the EF level until the clinical sign-off flag is set in the config. (Today, even a single admin-assigned HAVEN requires clinical review — bulk assignment is strictly worse.)

### UI

- Member list gets a multi-select checkbox column (already have the list; just add the column).
- "Bulk Action" dropdown above the table: pick field → value → reason → Preview → Confirm.
- Preview screen shows all N members with their current value for the chosen field. Admin can uncheck individuals before confirming.

## 6. Sub-scope C — Content library CRUD (`admin-content-library`)

Three libraries, one EF, three sub-actions each (list, upsert, toggle-active). Rows are rarely edited and all changes need `admin` role (not `coach_*`).

### Tables

**`habit_library`** — 30 rows today. Columns: `id`, `habit_pot` (enum: sleep/movement/nutrition/mindfulness/social), `habit_title`, `habit_description`, `habit_prompt`, `difficulty` (enum: easy/medium/hard), `active`, `created_by`.

**`programme_library`** — 30 rows today. Columns: `id`, `programme_name`, `description`, `category`, `difficulty`, `equipment`, `days_per_week`, `duration_weeks`, `sessions_per_week`, `programme_json` (full plan), `tags[]`, `preview_sessions` (jsonb), `is_active`, `sort_order`.

**`knowledge_base`** — 15 rows today. Columns: `id`, `topic`, `subtopic`, `content`, `source`, `permit_general_advice`, `active`, `updated_by`.

### Contract

```
POST { action: 'library_list',    table: 'habit_library' | 'programme_library' | 'knowledge_base',
                                   include_inactive?: boolean }
POST { action: 'library_upsert',  table: ..., row: {...}, reason: string }
POST { action: 'library_toggle',  table: ..., id: uuid, active: boolean, reason: string }
```

### Validation

- Every INSERT/UPDATE passes through a per-table whitelist of column names (no arbitrary columns).
- `programme_json` and `preview_sessions` are schema-validated against a minimal JSON shape before write: `{ weeks: [{ sessions: [{ exercises: [...] }] }] }`.
- `created_by` on `habit_library` is forced to the admin's email on INSERT.

### RLS awareness

The existing `habit_library` policies already allow members to edit their own custom habits (`created_by = auth.email()`). Shell 3 writes use the service role so this doesn't matter for admin writes, but the UI must indicate clearly when a row is a member's custom habit (so an admin doesn't accidentally edit someone's personal habit from the library view). The EF returns `created_by` in every row to support this.

### Audit

One audit row per mutation. `table_name` is the library table. `column_name` is `'__row__'` for full upserts (with old/new holding the whole row) or the specific field name for toggle-active.

## 7. Sub-scope E — Audit search (`admin-audit-search`)

Thin wrapper over `admin_audit_log`. No writes.

```
POST { action: 'search',
       filters?: {
         admin_email?: string,
         member_email?: string,
         action?: string,
         table_name?: string,
         column_name?: string,
         after?: ISO8601,
         before?: ISO8601,
         reason_contains?: string
       },
       limit?: number,   // max 200, default 50
       offset?: number } // default 0
→ { success, total, rows: [...], limit, offset }
```

`reason_contains` uses `ilike '%...%'` on `admin_audit_log.reason`. Indexed? No — the table is small (<1K rows/year at current admin volume). If it grows, add a GIN trigram index later.

UI lives on a new "Audit" tab in the console header, alongside the existing sections. Default view: last 50 rows, newest first. Filter panel collapses to a summary string ("7 days · admin=dean@... · table=members").

## 8. Rollout order

Sub-scopes land in separate sessions. Each includes the spec-confirmed EF, the UI panel, and a smoke test. Dean's priority ranking from today's session:

| Order | Sub-scope | EFs added                                              | Sessions |
|-------|-----------|--------------------------------------------------------|----------|
| 1     | A (cross-table edits) | `admin-member-habits`, `admin-member-programme`, `admin-member-weekly-goals` | 1–2 |
| 2     | B (bulk ops)          | `admin-bulk-ops`                                        | 1        |
| 3     | C (content library)   | `admin-content-library`                                 | 1        |
| 4     | E (audit search)      | `admin-audit-search`                                    | 0.5      |

D (impersonation) is formally deferred until post-Sage contract.

## 9. Migrations required for Shell 3

Collected in `plans/admin-console-shell3-migrations.sql` (not yet written — writes happen session-by-session, gated on this spec).

- **Sub-scope A:** extend `member_habits_assigned_by_check` to include `'admin'`. One line.
- **Sub-scope B:** none.
- **Sub-scope C:** none (existing RLS on library tables is compatible with service-role writes).
- **Sub-scope E:** none.

## 10. Testing contract

Every Shell 3 EF ships with a smoke-test script in `plans/admin-console-shell3-smoketests.md` (written alongside the EF) that:
- Fires one authenticated call per action from a real admin JWT
- Verifies the audit row lands with correct fields
- Verifies no-op detection works (same value in, no audit row out)
- Verifies role gating (`coach_exercise`, `viewer`) returns 403 where expected

No EF is considered shipped until its smoke test passes once against production. This is the codified version of the 22 April lesson: *test calls, don't trust deploys.*

## 11. Out of scope (reconfirmed)

- Member impersonation (deferred)
- Schema changes beyond the one-line `member_habits_assigned_by_check` extension
- Bulk operations on any field not in {persona, exercise_stream, re_engagement_stream}
- Changes to the Shell 2 EF `admin-member-edit`
- Any new HTML file in `vyve-command-centre`
