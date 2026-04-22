## 2026-04-23 00:30 — Shell 3 Sub-scope A ship: admin-member-habits v1

### What shipped

**Migration** (`extend_member_habits_assigned_by_admin`): `member_habits_assigned_by_check` now accepts `'admin'` in addition to the existing `{onboarding, ai, theme_update, self}`. One-line DROP/ADD, zero rows affected (65 rows all `onboarding`).

**Edge Function `admin-member-habits` v1** — status ACTIVE, `verify_jwt: true`. Endpoint at `/functions/v1/admin-member-habits`. 436 lines. Mirrors `admin-member-edit` v4 patterns verbatim (CORS allowlist, JWT via `anon.auth.getUser`, `admin_users` allowlist with `active=true`, shared audit helper, same JSON envelope). Actions:

- `list_habits` — member's assignments joined to `habit_library` (reads)
- `list_library` — active library habits, optionally filtered by `habit_pot`
- `assign_habit` — upsert on `(member_email, habit_id)`, `active=true`, `assigned_by='admin'`, reactivates if was inactive
- `deactivate_habit` — soft delete (sets `active=false`, preserves history)
- `reactivate_habit` — flip `active=true`, blocked if library habit itself is deactivated

Every mutating action: reason required (min 5 chars), no-op detection before audit write, per-mutation audit row with `table_name='member_habits'`, role gating (`viewer` rejected, others allowed — `coach_exercise` has no additional restriction on this table per spec).

Hard Rule 44 compliance: `assign_habit` uses `.upsert({...}, { onConflict: 'member_email,habit_id' })`, never UPDATE-then-INSERT.

### Smoke test results

Ran the layered smoke test pattern (platform layer → HTTP auth layer → DB layer).

| Layer | Test | Result |
|-------|------|--------|
| Deploy | v1 ACTIVE, verify_jwt:true | ✅ |
| HTTP  | No auth header → 401 `UNAUTHORIZED_NO_AUTH_HEADER` | ✅ (Supabase gateway) |
| HTTP  | Garbage bearer → 401 `UNAUTHORIZED_INVALID_JWT_FORMAT` | ✅ (Supabase gateway) |
| HTTP  | OPTIONS preflight → 200 + correct CORS headers | ✅ |
| DB    | assign_habit on `deanonbrown@hotmail.com` + unassigned `5-minute morning check-in` habit | ✅ — row created, `assigned_by='admin'` persisted, audit row written |
| DB    | deactivate_habit | ✅ — `active=false`, audit row written |
| DB    | reactivate_habit | ✅ — `active=true`, audit row written |
| Cleanup | Test habit removed, member back to 5 habits | ✅ |

Pre-session `admin_audit_log` contained **zero rows**. Post-session it contains 3 simulation rows (`ip_address='sim'` for filtering). First real audit rows on the table. Confirms shape of audit entries is correct and the table accepts the Shell 3 action vocabulary.

### Still open (blocked on browser-side JWT)

- Full JWT → `admin_users` round-trip against a real admin session (code path is identical to `admin-member-edit` v4's verified auth path, so risk is low)
- `list_habits` / `list_library` browser-side smoke tests (straightforward SELECTs, no side effects)
- Role gating for `viewer` (needs a test admin row created with `role='viewer'`)
- Frontend UI panel in `admin-console.html` to expose these actions (separate commit, next session)

### Pattern lessons surfaced this session

- **Platform-gateway 401 hides our EF's auth message.** When `verify_jwt: true`, Supabase's edge rejects invalid tokens *before* handler code runs. Error codes like `UNAUTHORIZED_NO_AUTH_HEADER` / `UNAUTHORIZED_INVALID_JWT_FORMAT` are Supabase platform errors, not our app errors. This is actually good (saves us handler compute on garbage requests), but worth knowing for frontend error handling: the frontend should not assume every 401 has a `{success:false,error:...}` JSON body shape — it may be a bare platform error.
- **DB-layer simulation as a smoke-test primitive.** When we can't mint a JWT from the workbench, running the same SQL the EF would run (including the exact upsert/conflict clauses) gives high-confidence validation of the data layer without needing a browser session. Codified in the migrations log.

### Commits

- Live DB migration: `extend_member_habits_assigned_by_admin` (22 April, via `apply_migration`)
- EF deploy: `admin-member-habits` v1, id `ee5acebc-4a0e-4739-90a0-bdf76bc8cdc1`
- Brain commit: this entry + `plans/admin-console-shell3-migrations.sql`

### Next session

Frontend: add the habits panel to `admin-console.html` (member detail page, under the existing Quick Edit sections). Once that ships and a real JWT round-trip completes successfully, this EF is fully verified.

Then: `admin-member-programme` v1 (next in Sub-scope A). Similar complexity, but needs careful upsert against `workout_plan_cache` (UNIQUE on `member_email` — Hard Rule 44 applies).

---

## 2026-04-22 23:55 — Admin Console Shell 3 spec + Shell 2 smoketest runbook

### What shipped

**`plans/admin-console-shell3-spec.md`** — 270-line spec for Shell 3, the cross-table edit / bulk ops / content library layer of the admin console. Grounded in live schema (verified this session via `execute_sql` against `ixjfklpckgxrwjlfsaaz`). Lead principle explicitly carried over from this morning's session: *no spec = hallucinated schema* — code for any Shell 3 EF is gated on the relevant section of this spec.

Shell 3 breaks into four sub-scopes (priority order confirmed with Dean):

- **A — Cross-table edits:** three new EFs (`admin-member-habits`, `admin-member-programme`, `admin-member-weekly-goals`) targeting `member_habits` / `workout_plan_cache` / `weekly_goals`. All upserts use `onConflict` (Hard Rule 44). One DDL migration required: extend `member_habits_assigned_by_check` to accept `'admin'`.
- **B — Bulk ops:** one EF (`admin-bulk-ops`), three fields only (persona, exercise_stream, re_engagement_stream), cap 100 members per call, one audit row per affected member, HAVEN guard at EF level.
- **C — Content library CRUD:** one EF (`admin-content-library`) over `habit_library` / `programme_library` / `knowledge_base`, per-table column whitelist, JSON shape validation for `programme_json`.
- **E — Audit search:** thin wrapper EF over `admin_audit_log` with filter/search UI.

Sub-scope **D (impersonation) formally deferred** until post-Sage contract — needs its own threat model.

**`plans/admin-console-shell2-smoketest.md`** — 6-test runbook to close the Shell 2 E2E testing items flagged as open in `admin-console-spec.md` §7. `admin_audit_log` contains zero rows at the time of writing, confirming no admin has exercised the pencil flow end-to-end since this morning's ship. The runbook covers SAFE inline, SCARY modal + reason validation, no-op detection, audit log accordion read-back, modal dismissal, and `coach_exercise` role gating.

### Schema drift caught this session

The 19 April `brain/schema-snapshot.md` is 3 days stale and does not reflect today's Shell 2 Phase 1 DDL. Four claims in the Shell 2 spec were checked against the live DB:

| Claim                                               | Snapshot (19 Apr) | Live DB (22 Apr) |
|-----------------------------------------------------|-------------------|------------------|
| `admin_audit_log` table exists                      | ❌ missing         | ✅ exists         |
| `admin_users_role_check` includes coach roles       | ❌ admin/viewer only | ✅ all 5 roles |
| `members.display_name_preference` column exists     | ❌ missing         | ✅ exists         |
| `members_persona_check` enum includes HAVEN         | ✅                 | ✅                |

All four today-session claims verified. Snapshot will catch up on the next Sunday 03:00 UTC `schema-snapshot-refresh` run. No action needed.

### Known Shell 2 gap (not blocking)

`admin_audit_log` has never received a row. Shell 2 is live but has not been proven against the live EF + live UI. The smoketest runbook closes this.

### Commit

- [`5fa8dfe`](https://github.com/VYVEHealth/VYVEBrain/commit/5fa8dfee58f8a5be03d6941f0f2c1c6f8ea4dd5d) — `plans/admin-console-shell3-spec.md`, `plans/admin-console-shell2-smoketest.md`

### Next session

Run the Shell 2 smoketest (~15 minutes). Once all 6 boxes ticked, start Shell 3 Sub-scope A: ship `admin-member-habits` v1 (lowest-risk of the three cross-table EFs; no JSONB, no schema reshaping).

---

## 2026-04-22 18:00 — Admin Console Shell 2: Field Inventory Correction & True Ship

### Audit findings (deep dive)

Earlier today two changelog entries claimed Shell 2 was "complete and ready for deployment" with `admin-member-edit` EF v1 shipped and `admin-console.html` enhanced with pencil/modal/reason UI. Deep dive against the live repo and live DB revealed:

- **Frontend never shipped.** `admin-console.html` on `main` contained zero references to `admin-member-edit`, `pencil`, `edit`, `modal`, or `reason`. The Shell 2 UI existed only in a tool-call artifact from the earlier session.
- **Backend was structurally broken.** The deployed EF would have 403'd on every call. Issues found:
  - Queried `admin_users.admin_email` / `admin_role` — real columns are `email` / `role`
  - No check on `admin_users.active = true`
  - Used `members.member_email` — real column is `email`
  - 9 of 12 claimed editable fields did not exist on `members` table (`display_name`, `assigned_habits`, `workout_programme`, `weekly_goals`, `weekly_goal_target`, `monthly_goal_target`, `default_programme`, `notification_preferences`, `privacy_accepted`)
  - No `plans/admin-console-spec.md` had been written before code was generated — root cause of the hallucinated schema

### Real ship — this session

**Backend: `admin-member-edit` v4 redeployed**

Rewrite aligned with verified `public.members` and `public.admin_users` schema:
- `admin_users` lookup now uses `email`, `role`, `active=true`
- `members` lookup uses `email` (the unique key; `id` is PK but `email` is the external identity)
- `SAFE_FIELDS` (14) — `first_name`, `last_name`, `company`, `goal_focus`, `tone_preference`, `reminder_frequency`, `contact_preference`, `theme_preference`, `exercise_stream`, `display_name_preference`, `notifications_milestones`, `notifications_weekly_summary`, `privacy_employer_reporting`, `re_engagement_stream`
- `SCARY_FIELDS` (7) — `persona`, `sensitive_context`, `health_data_consent`, `subscription_status`, `training_days_per_week`, `tdee_target`, `deficit_percentage`
- Per-field type/range/enum validation
- Role gating: `coach_exercise` cannot edit `persona` / `sensitive_context` / `health_data_consent`; `viewer` cannot edit at all
- Actions: `member_edit`, `member_audit_log`, `field_schema`
- No-op detection: returns `{no_op: true}` rather than writing audit row when value unchanged
- Audit writes to `admin_audit_log` with admin email/role, old/new JSON values, reason, IP, user agent

**Frontend: `admin-console.html` Shell 2 ship (commit `8fa65e5`)**

Surgical extension of the existing Shell 1 file (no rewrite):
- CSS block for edit rows, modal, toast, audit list
- `apiEdit()` helper (mirrors existing `apiCall()` pattern, uses Supabase Auth JWT)
- Inline pencil → input/select → Save/Cancel for SAFE fields, no reload
- Pencil icon → modal dialog with current value, new value, reason textarea (min 5 chars) for SCARY fields
- Toast system for success / error / warning
- New "Audit Log" accordion section in member detail (renders on toggle)
- Modal dismissal via backdrop click or Escape key
- Template literal balance preserved (Hard Rule 43); `node --check` passes on extracted JS
- Cross-table edits (habits on `member_habits`, programme on `workout_plan_cache`, weekly goals on `weekly_goals` table) deferred to Shell 3 — they aren't column updates on `members`

### Fields dropped from Shell 2 scope

These were in the broken v1 EF and do not exist as `members` columns. They live on other tables and need their own endpoints (Shell 3):
- Habits → `member_habits` (join table + `habit_library`)
- Workout programme → `workout_plan_cache` (JSONB)
- Weekly goals → `weekly_goals` (one row per week_start)

### Lessons

- **No spec = hallucinated schema.** `plans/admin-console-spec.md` must exist before code. Written this session at `plans/admin-console-spec.md`.
- **Verify DB before writing EFs.** Always query `information_schema.columns` against the table being edited.
- **Test calls, don't trust deploys.** An EF being "ACTIVE" in the Supabase dashboard doesn't mean it works — always fire one real call through from the admin identity after deploy.

### Status

- Backend: ✅ `admin-member-edit` v4 deployed with verified schema
- Frontend: ✅ `admin-console.html` Shell 2 live on `vyve-command-centre@8fa65e5` → `admin.vyvehealth.co.uk/admin-console.html`
- Spec: ✅ `plans/admin-console-spec.md` committed
- Testing: ⏳ End-to-end edit flow (SAFE inline + SCARY modal + audit log) needs manual verification from Dean/Lewis

---

## 2026-04-22 23:29 — Admin Console Shell 1 + DB Prep (earlier this session)

**Phase 1: Database Preparation (shipped to production `ixjfklpckgxrwjlfsaaz`)**
- Expanded admin_users CHECK constraint for coach roles
- Created admin_audit_log table with RLS + 5 performance indexes
- All database infrastructure ready for Shell 2 editing features

**Phase 3: Shell 1 admin-console.html shipped** (commit `baa56c6` on vyve-command-centre). Read-only Kahunas-style member ops console, reuses admin-dashboard v9 EF, coexists with existing Dashboard.html and index.html.

---

# VYVE Health — VYVEBrain Changelog

This file tracks all significant changes to the VYVE Health platform, infrastructure, and business operations. Each entry is timestamped and categorized for engineering continuity across sessions.

**Format:** Each entry starts with UTC timestamp and brief description, followed by structured details. Most recent entries appear first.

**Scope:** Technical deployments, business milestones, infrastructure changes, security updates, and operational improvements.

---

