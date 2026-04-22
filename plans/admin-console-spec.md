# Admin Console Spec — Shell 1 + Shell 2 (and Shell 3 roadmap)

Written: 22 April 2026
Owner: Dean Brown
Status: Shell 1 live, Shell 2 live (22 April), Shell 3 planned
Related: `apps/admin-dashboard/admin.html` (legacy Dashboard.html), `admin-console.html` (new Kahunas-style)

> **Note:** This spec was written *after* Shell 1 and Shell 2 shipped, following the 22 April reconciliation. The earlier Shell 2 v1 EF was built without a written spec and hallucinated 9 non-existent `members` columns. This document is now the source of truth for the console's field inventory, EF contract, and role model.

---

## 1. Purpose

The admin console is the coach/admin ops layer on top of VYVE. It replaces the "DM Dean to run SQL" workflow with direct read + edit access to member records, gated by `admin_users` role.

Hosted separately at `admin.vyvehealth.co.uk` (repo `VYVEHealth/vyve-command-centre`), isolated from the member portal. Three HTML files coexist in the repo today:

| File               | Size     | Purpose                                                                  |
|--------------------|----------|--------------------------------------------------------------------------|
| `index.html`       | 132 KB   | Lewis's Command Centre — OKRs, CRM, content pipeline, Intelligence sync  |
| `Dashboard.html`   | 52 KB    | Legacy admin dashboard (v9 EF consumer)                                  |
| `admin-console.html` | ~84 KB | New Kahunas-style console — Shell 1 read-only + Shell 2 edit (current)   |

---

## 2. Three-shell plan

| Shell | Scope                                                                  | Status           |
|-------|------------------------------------------------------------------------|------------------|
| 1     | Read-only: member list, detail, timeline, raw tables                   | ✅ Live 21 April |
| 2     | Inline SAFE edits + SCARY modal edits on `members` table + audit log   | ✅ Live 22 April |
| 3     | Cross-table edits (habits, programme, weekly goals), bulk ops, content libraries | 📋 Planned |

---

## 3. Auth model

- Client uses Supabase Auth (anon key + email/password, same as member portal)
- All EF calls go with `Authorization: Bearer <JWT>`
- EFs verify via `anon.auth.getUser(token)`, extract email
- Check `admin_users` where `email = <JWT.email>` AND `active = true`
- `admin_users.role` controls capabilities (see §5)

### Real `admin_users` schema (verified)

| Column     | Type      | Nullable | Default      | Notes                                       |
|------------|-----------|----------|--------------|---------------------------------------------|
| `email`    | text      | no       | —            | PK for lookups                              |
| `role`     | text      | no       | `'admin'`    | CHECK: admin / viewer / coach_full / coach_exercise / coach_mental |
| `added_by` | text      | yes      | —            | audit                                       |
| `added_at` | timestamptz | no     | `now()`      | audit                                       |
| `active`   | boolean   | no       | `true`       | **all EFs must filter by `active = true`**  |
| `notes`    | text      | yes      | —            | free-form                                   |

Current active admins (22 April): `deanonbrown@hotmail.com`, `lewisvines@hotmail.com`, `team@vyvehealth.co.uk` — all role `admin`.

---

## 4. Edge Functions

| Function              | Version | Purpose                                     | verify_jwt |
|-----------------------|---------|---------------------------------------------|------------|
| `admin-dashboard`     | v9      | Read-only member data (overview, list, detail, timeline, raw) | true |
| `admin-member-edit`   | v4      | Shell 2: edit SAFE/SCARY fields on `members`, audit log reader, field schema | true |

### `admin-member-edit` v4 actions

| Action             | Input                                                         | Output                                     |
|--------------------|---------------------------------------------------------------|--------------------------------------------|
| `member_edit`      | `{ member_email, field_name, new_value, reason? }`            | `{ success, field, old_value, new_value, audit_logged }` or `{ success, no_op: true }` |
| `member_audit_log` | `{ member_email, limit? }`                                    | `{ success, audit_log: [...] }`            |
| `field_schema`     | `{}`                                                          | `{ safe_fields, scary_fields, enums }`    |

### Role gating inside `admin-member-edit`

- `admin` / `coach_full` / `coach_mental`: can edit all SAFE + all SCARY fields
- `coach_exercise`: cannot edit `persona`, `sensitive_context`, `health_data_consent`
- `viewer`: cannot edit anything (403)

---

## 5. Field inventory (Shell 2)

All fields live on `public.members`. Cross-table fields deferred to Shell 3.

### SAFE fields — inline pencil, no reason required (14)

| Field                         | Type      | UI type      | Validation                    |
|-------------------------------|-----------|--------------|-------------------------------|
| `first_name`                  | text      | text input   | max 80 chars, trim            |
| `last_name`                   | text      | text input   | max 80 chars, trim            |
| `company`                     | text      | text input   | max 200 chars, trim           |
| `goal_focus`                  | text      | select       | enum                          |
| `tone_preference`             | text      | select       | enum                          |
| `reminder_frequency`          | text      | select       | enum                          |
| `contact_preference`          | text      | select       | enum                          |
| `theme_preference`            | text      | select       | light / dark / system         |
| `exercise_stream`             | varchar   | select       | movement / workouts / cardio / classes / mixed |
| `display_name_preference`     | text      | select       | first_name / full_name / initials / anonymous |
| `notifications_milestones`    | bool      | yes/no       | boolean                       |
| `notifications_weekly_summary`| bool      | yes/no       | boolean                       |
| `privacy_employer_reporting`  | bool      | yes/no       | boolean                       |
| `re_engagement_stream`        | text      | select       | A / B / C1 / C2 / C3 / paused / none |

### SCARY fields — modal dialog, reason required (min 5 chars) (7)

| Field                   | Type    | UI type  | Why scary                                               |
|-------------------------|---------|----------|---------------------------------------------------------|
| `persona`               | text    | select   | Routes all AI voice (NOVA/RIVER/SPARK/SAGE/HAVEN). HAVEN requires clinical sign-off. |
| `sensitive_context`     | bool    | yes/no   | Locks member out of NOVA/SPARK; affects recommendation layer. |
| `health_data_consent`   | bool    | yes/no   | Legal — determines what health data the platform can store. |
| `subscription_status`   | text    | select   | Billing state (active/trialing/past_due/canceled/paused/none). |
| `training_days_per_week`| int     | number   | Regenerates workout programme on change (future). |
| `tdee_target`           | int     | number   | Affects nutrition targets. Range 1000–6000 kcal. |
| `deficit_percentage`    | int     | number   | Affects fat-loss targets. Range 0–30%. |

### Dropped from Shell 2 (not columns on `members` — see Shell 3)

- Habits → `member_habits` join table + `habit_library`
- Workout programme → `workout_plan_cache` (JSONB, one row per member, `UNIQUE(member_email)`)
- Weekly goals → `weekly_goals` (one row per member per week_start)
- Monthly check-in data → `wellbeing_checkins`, `monthly_checkins`

---

## 6. `admin_audit_log`

Every successful edit writes one row. Schema:

| Column      | Type        | Notes                                    |
|-------------|-------------|------------------------------------------|
| `id`        | uuid        | PK                                       |
| `admin_email` | text      | who performed the edit                   |
| `admin_role`| text        | role at time of edit                     |
| `member_email` | text     | target member                            |
| `action`    | text        | `member_edit` (Shell 2) — reserved for future actions |
| `table_name`| text        | always `members` in Shell 2              |
| `column_name` | text      | field edited                             |
| `old_value` | jsonb       | previous value (`null` if wasn't set)    |
| `new_value` | jsonb       | new value (`null` if cleared)            |
| `reason`    | text        | required for SCARY, null for SAFE        |
| `ip_address`| text        | from `cf-connecting-ip`/`x-forwarded-for`/`x-real-ip` |
| `user_agent`| text        | from request header                      |
| `created_at`| timestamptz | server-set                               |

RLS: service-role only. UI reads audit via `admin-member-edit` action `member_audit_log`.

---

## 7. UX pattern

### Member detail page layout (top to bottom)

1. **Header:** avatar, name, email, company pill, persona pill, status pill
2. **Stats strip:** engagement score, activities, streak, check-ins, last active, workouts, habits, certificates
3. **Quick Edit — Safe fields section** (visible when expanded; pencil icons)
4. **Quick Edit — Sensitive fields section** (pencil icons with amber "scary" badge)
5. Existing accordion sections: Profile, Programme, Activity Timeline, Raw Data, Certificates, Notifications, Engagement Emails, **Audit Log**, Push Subscriptions

### SAFE inline edit flow

1. Click pencil → the row swaps to input/select + Save + Cancel
2. Edit → click Save
3. EF returns success → toast appears → value in-row updates → form collapses
4. No-op (unchanged value) → toast "No change" → form collapses

### SCARY modal flow

1. Click amber pencil → modal opens with field name, current value, new-value input, reason textarea
2. Enter new value + reason (min 5 chars)
3. Click Save change → EF validates → success toast → modal closes → value updates
4. Reason stored in `admin_audit_log.reason`
5. Modal closable via backdrop click or Escape key

---

## 8. Shell 3 scope (future)

- **Cross-table edits:**
  - Habits: assign/remove on `member_habits`, create custom via `habit_library`
  - Workout programme: edit `workout_plan_cache.programme` JSON, regenerate button
  - Weekly goals: write `weekly_goals` for current/future weeks
- **Bulk operations:** multi-select in member list, bulk persona/stream change
- **Content libraries:** `habit_library`, `programme_library`, `knowledge_base` CRUD
- **Impersonation:** view portal as member (support scenarios) — requires separate EF + time-limited token
- **Advanced audit:** filter by admin, date range, column, free-text reason search
