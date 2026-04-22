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
