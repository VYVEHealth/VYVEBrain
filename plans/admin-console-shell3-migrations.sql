# Admin Console Shell 3 — Migrations Log

Every DDL migration required by Shell 3 lands here, in the order applied, with the exact SQL and the Supabase migration name used with `apply_migration`.

---

## 1. `extend_member_habits_assigned_by_admin` — 22 April 2026

**Required by:** `admin-member-habits` v1 (Sub-scope A)
**Spec reference:** `plans/admin-console-shell3-spec.md` §4.1
**Applied via:** Supabase MCP `apply_migration` (project `ixjfklpckgxrwjlfsaaz`)
**Rows affected:** 0 (existing 65 `member_habits` rows all had `assigned_by='onboarding'`)

```sql
ALTER TABLE public.member_habits
DROP CONSTRAINT member_habits_assigned_by_check;

ALTER TABLE public.member_habits
ADD CONSTRAINT member_habits_assigned_by_check
CHECK (assigned_by = ANY (ARRAY['onboarding'::text, 'ai'::text, 'theme_update'::text, 'self'::text, 'admin'::text]));
```

**Verification query:**
```sql
SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conname='member_habits_assigned_by_check';
-- → CHECK ((assigned_by = ANY (ARRAY['onboarding'::text, 'ai'::text, 'theme_update'::text, 'self'::text, 'admin'::text])))
```

**Rollback plan:** trivially revertible — DROP the new CHECK, re-add the old one. Not planned.

---

## Pattern: DB-layer smoke test for EFs with `verify_jwt: true`

When a new admin EF is deployed behind `verify_jwt: true`, we cannot smoke-test the mutating handlers end-to-end from the workbench (no JWT). The pattern used for `admin-member-habits` v1:

1. **HTTP layer** — confirm the EF rejects missing/bad auth and handles OPTIONS correctly via direct HTTPS requests.
2. **DB layer** — run the *exact* SQL the EF would run (including audit insert) via `execute_sql` against a harmless target (the Dean admin row, own assignments). Cleanup afterwards.
3. **Browser layer** — reserved for post-UI smoketest with real JWT; documented as "still open" in the changelog until closed.

This does not exercise the auth round-trip, but when the auth code is a verbatim copy of an already-verified EF (`admin-member-edit` v4), the residual risk is low and the DB guarantees are what actually matter for data integrity.

---

## Future migrations (not yet applied)

Per spec §9:
- Sub-scope B (bulk ops): none required
- Sub-scope C (content library): none required
- Sub-scope E (audit search): none required

Sub-scope A needs no further migrations beyond §1.

---

## 2. `admin-member-programme` v1 — no migration required (23 April 2026)

Confirmed during smoke-test prep: `workout_plan_cache` already has the `UNIQUE(member_email)` constraint the EF's upsert path needs, and the existing `source` column already accepts `'library'` (no enum/check restricts it). `programme_library.programme_json` shape validated in-EF via `validateProgrammeJson()` helper before write. Zero DDL changes.

## Testing primitive: DB-layer simulation requires a *persistent* backup table

The simulation pattern used for `admin-member-habits` v1 worked because the test was additive (insert a new row, delete it). For `admin-member-programme` v1, the simulation was destructive (`swap_plan` replaces the whole row including `programme_json`), so state needed to be captured and restored.

**Important:** `CREATE TEMP TABLE` does NOT persist across Supabase MCP `execute_sql` calls. Each call is a fresh session. Use a regular (non-temp) table with a clearly-prefixed name and drop it as the final step:

```sql
-- Start of sim
DROP TABLE IF EXISTS _admin_programme_smoketest_backup;
CREATE TABLE _admin_programme_smoketest_backup AS
SELECT * FROM <target_table> WHERE <predicate>;

-- ... run destructive sims ...

-- End of sim
UPDATE <target_table> t
SET <all_columns> = (SELECT ... FROM _admin_programme_smoketest_backup b WHERE ...)
WHERE <predicate>;
DROP TABLE _admin_programme_smoketest_backup;
```

Restore verification should include a JSONB/column-level equality check (`wpc.programme_json = b.programme_json`) — not just spot-checks on individual fields.
