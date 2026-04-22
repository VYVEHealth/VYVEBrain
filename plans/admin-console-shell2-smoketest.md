# Admin Console Shell 2 — End-to-End Smoke Test

Written: 22 April 2026
Owner: Dean Brown
Status: ⏳ Not yet run — `admin_audit_log` contains zero rows as of 22 April 18:40 UTC.

> **Why this matters.** Shell 2 shipped this morning but no admin has actually exercised a pencil edit against the live `admin-member-edit` v4 EF. The empty audit log confirms it. The parent spec flags five test scenarios as "open." This document is the runbook for closing them.

---

## Preconditions

- You are logged in at `https://admin.vyvehealth.co.uk/admin-console.html` as one of the three active admins (`deanonbrown@hotmail.com`, `lewisvines@hotmail.com`, `team@vyvehealth.co.uk`).
- Browser DevTools → Network tab is open so you can watch the `admin-member-edit` XHR.
- Pick a low-stakes test target. Best candidate: **your own member row**. You see exactly what changes on the portal side. Do NOT test against real prospects (Sage BT etc.) — their rows are fragile.

## Test 1 — SAFE field, inline pencil (no reason)

**Goal:** confirm the inline pencil → input → Save round-trip works and produces the right audit row.

1. Open your own member detail page in the admin console.
2. In the **Quick Edit — Safe fields** section, click the pencil next to `company`.
3. The row swaps to a text input + Save/Cancel.
4. Change the value to something harmless (append " — TEST 1" to whatever is there).
5. Click **Save**.

**Expected observable:**
- Toast: "Saved."
- The displayed value updates in the row.
- Network tab shows `POST /functions/v1/admin-member-edit` with status `200`.
- Response body: `{ success: true, field: "company", old_value: "...", new_value: "... — TEST 1", audit_logged: true }`.

**DB verification (SQL Editor):**
```sql
SELECT admin_email, action, table_name, column_name, old_value, new_value, reason, created_at
FROM admin_audit_log
ORDER BY created_at DESC
LIMIT 1;
```
- `action = 'member_edit'`
- `table_name = 'members'`
- `column_name = 'company'`
- `reason IS NULL` (SAFE fields don't collect a reason)
- `old_value` and `new_value` differ as expected

## Test 2 — SAFE field no-op detection

**Goal:** confirm that saving the same value does not write an audit row.

1. Click the pencil next to `company` again.
2. Don't change anything. Click **Save**.

**Expected:**
- Toast: "No change" or similar.
- Response: `{ success: true, no_op: true, message: "No change (value matches current)" }`.
- **No new row** in `admin_audit_log`. Re-run the SQL above — the count has not increased.

## Test 3 — SCARY field, modal + reason

**Goal:** confirm the modal flow for sensitive fields.

1. In the **Quick Edit — Sensitive fields** section, click the amber pencil next to `persona`.
2. Modal opens with current persona, new-value dropdown, reason textarea.
3. Select a different persona (e.g. change NOVA → SAGE).
4. Try clicking **Save change** with no reason. Should show a validation error (reason required).
5. Type a reason fewer than 5 characters. Should still fail.
6. Type a full reason (e.g. "Test 3 — verifying SCARY flow end-to-end").
7. Click **Save change**.

**Expected:**
- Modal closes.
- Toast: "Saved."
- Persona pill in the header updates to the new value.
- Audit row: `action='member_edit'`, `column_name='persona'`, `reason='Test 3 — verifying SCARY flow end-to-end'`.

**Rollback:** set the persona back to its original value (will require a second reason — that's correct).

## Test 4 — Audit Log accordion renders

**Goal:** confirm the UI reads back what Tests 1 and 3 just wrote.

1. Scroll to the **Audit Log** accordion section in the member detail.
2. Click to expand.

**Expected:**
- At least three rows (Test 1 edit, Test 3 persona edit, Test 3 rollback — or more depending on other testing).
- Each row shows: admin email, action, column, old → new, reason (if present), timestamp.
- Newest first.

## Test 5 — Modal dismissal via backdrop click and Escape

**Goal:** confirm the modal closes cleanly without saving.

1. Open the `persona` modal again (amber pencil).
2. Click the dark backdrop outside the modal. Modal should close. No audit row written.
3. Open the modal again.
4. Press `Esc`. Modal should close. No audit row written.

## Test 6 — Role gating for `coach_exercise`

**Goal:** confirm a `coach_exercise` admin cannot edit `persona`, `sensitive_context`, or `health_data_consent`.

**Setup (SQL Editor):**
```sql
-- Create a temporary coach_exercise admin (replace the email with a real auth user you can sign in as)
INSERT INTO admin_users (email, role, added_by, active, notes)
VALUES ('your-test-email@example.com', 'coach_exercise', 'deanonbrown@hotmail.com', true, 'E2E test — delete after');
```

1. Sign out, sign in as the test coach.
2. Open any member detail.
3. Try clicking the amber pencil next to `persona`.

**Expected behaviour (two acceptable modes):**
- Ideal: the amber pencil is disabled/hidden for this role.
- Acceptable: the pencil is clickable but the EF returns `403` with `"Your role cannot edit this field"`, and the UI surfaces the error as a toast.

**Cleanup:**
```sql
DELETE FROM admin_users WHERE email = 'your-test-email@example.com';
```

---

## Sign-off

Once all six tests pass, update `plans/admin-console-spec.md` §7 to strike "Testing still open" and add a dated confirmation here.

| Test | Passed? | Notes |
|------|---------|-------|
| 1. SAFE inline edit | ☐ |  |
| 2. SAFE no-op | ☐ |  |
| 3. SCARY modal + reason | ☐ |  |
| 4. Audit Log accordion | ☐ |  |
| 5. Modal dismissal | ☐ |  |
| 6. `coach_exercise` gating | ☐ |  |
