# Admin Console Shell 3 Sub-scope A — UI End-to-End Smoke Test

Written: 23 April 2026
Owner: Dean Brown
Status: ⏳ Not yet run — all three Shell 3 EFs untested from the browser with a real admin JWT.
Prerequisite: Shell 2 smoketest completed (covers SAFE / SCARY edit + audit log display) — see `admin-console-shell2-smoketest.md`.

> This runbook closes the last gap in Sub-scope A. All three Shell 3 EFs (`admin-member-habits`, `admin-member-programme`, `admin-member-weekly-goals`) have passed DB-layer simulation, and the UI shipped at `vyve-command-centre@f3d3f4f`. Only the full JWT round-trip + audit-log-display round-trip remains.

---

## Preconditions

- Signed in at `https://admin.vyvehealth.co.uk/admin-console.html` as `deanonbrown@hotmail.com`, `lewisvines@hotmail.com`, or `team@vyvehealth.co.uk`.
- DevTools → Network tab open to watch the XHRs.
- Test target: **your own member row** for maximum safety. The three Shell 3 EFs are reversible but `swap_plan` replaces the whole programme JSON.

## Test 1 — Programme controls panel

**Panel opens:**
1. Open your own member detail.
2. Expand the "Programme controls" accordion.

**Expected:** Panel loads with programme name, status (Active/Paused), week X/N, session Y, source. Buttons: Pause (or Resume if paused), Advance week…, Swap plan…

**Exercise pause + resume:**
3. Click **Pause** → reason modal opens.
4. Type a 5+ character reason (e.g. "UI smoketest — pause"). Click **Pause**.
5. Panel should reload showing paused state.
6. Click **Resume** → reason modal. Enter reason. Click **Resume**.
7. Panel reloads showing active state.

**Exercise advance_week:**
8. Click **Advance week…** → modal with current state + target-week input pre-filled to current+1.
9. Enter reason. Click **Advance**.
10. Panel reloads. Current week incremented by 1, session reset to 1.
11. **Revert:** repeat advance_week with the original week value as target, reason "revert smoketest".

**Exercise swap_plan (OPTIONAL — destructive, skip if unsure):**
- Look up a library UUID: `SELECT id, programme_name FROM programme_library WHERE is_active=true LIMIT 5;`
- Click **Swap plan…** → paste UUID → enter reason → Swap.
- Then use the same action to swap **back** to your original plan.

**DB verification:**
```sql
SELECT action, column_name, reason, created_at
FROM admin_audit_log
WHERE member_email = '<your email>' AND table_name = 'workout_plan_cache'
ORDER BY created_at DESC LIMIT 10;
```
Should show `programme_pause`, `programme_resume`, `programme_advance_week` (twice: advance + revert).

## Test 2 — Habits panel

**Panel opens:**
1. Expand the "Habits" accordion.

**Expected:** List of your current habit assignments (active + inactive), with pot / difficulty / assigned_by / status. Button: **Assign new habit…**

**Exercise deactivate + reactivate:**
2. Pick an active habit. Click **Deactivate…** → reason modal → Deactivate.
3. Panel reloads — the habit now shows Inactive.
4. Click **Reactivate…** on the same row → reason → Reactivate.
5. Panel reloads — habit back to Active.

**Exercise assign:**
6. Click **Assign new habit…** → select opens with 5 `<optgroup>` sections (sleep, movement, nutrition, mindfulness, social).
7. Pick a habit you don't currently have → reason → Assign.
8. Panel reloads — new habit appears with `assigned_by admin`.
9. **Cleanup:** Deactivate it, reason "smoketest cleanup".

**DB verification:**
```sql
SELECT action, reason, new_value->>'habit_title' AS title
FROM admin_audit_log
WHERE member_email = '<your email>' AND table_name = 'member_habits'
ORDER BY created_at DESC LIMIT 10;
```

## Test 3 — Weekly goals panel

**Panel opens:**
1. Expand the "Weekly goals" accordion.

**Expected:** Form showing current UK week (should match `date_trunc('week', now() AT TIME ZONE 'Europe/London')`), 5 number inputs (0..14), hint "No row yet — save will create it" OR "Row exists — save will update in place".

**Exercise save:**
2. Change a value (e.g. habits_target 3 → 5). Click **Save…** → reason modal shows the values → Save.
3. Panel reloads — form reflects the new values, and hint now says "Row exists — save will update in place".
4. **Exercise no-op:** click **Save…** again with same values → reason → Save. Toast should say "No change".
5. **Revert:** change values back to original (default 3/2/1/1/1), reason "revert smoketest", Save.

## Test 4 — Audit log shows new action vocabulary

1. Expand the existing **Audit Log** accordion.
2. Confirm the sequence of entries from Tests 1-3 is visible, with actions from the new vocabulary:
   - `programme_pause`, `programme_resume`, `programme_advance_week` (and optionally `programme_swap`)
   - `habit_deactivate`, `habit_reactivate`, `habit_assign`
   - `weekly_goals_upsert`
3. Reason text on each row matches what you typed.

## Test 5 — Modal dismissal

1. Open any of the reason modals (e.g. click Pause on programme).
2. Click the dark backdrop outside the modal → closes without writing. No toast.
3. Re-open. Press `Esc` → closes without writing.
4. Re-open. Type fewer than 5 characters of reason → click confirm → toast "Reason must be at least 5 characters", modal stays open.

## Test 6 — CORS / auth (passive)

Inspect the Network tab for each Shell 3 XHR call. Each `POST /functions/v1/admin-member-*` should return 200. If signed out, retrying should yield 401 `UNAUTHORIZED_NO_AUTH_HEADER` from the Supabase gateway.

## Test 7 — Role gating (optional — requires test admin)

Same pattern as Shell 2 smoketest Test 6. Create a `coach_exercise` or `viewer` admin row and exercise the panels to verify:
- `viewer` receives 403 on every mutating action (panel shows error toast).
- `coach_exercise` can use all three Shell 3 panels (no field-level restriction on habits/programme/weekly goals for this role in v1).

Cleanup: `DELETE FROM admin_users WHERE email = 'your-test-admin@example.com';`

---

## Sign-off

| Test | Passed? | Notes |
|------|---------|-------|
| 1. Programme panel (pause/resume/advance) | ☐ |  |
| 2. Habits panel (deactivate/reactivate/assign) | ☐ |  |
| 3. Weekly goals panel (save + no-op) | ☐ |  |
| 4. Audit log shows new actions | ☐ |  |
| 5. Modal dismissal + reason validation | ☐ |  |
| 6. Network requests succeed with JWT | ☐ |  |
| 7. Role gating (optional) | ☐ |  |

When all green, update `plans/admin-console-shell3-spec.md` §2 to mark Shell 3 Sub-scope A as "✅ Live" rather than "📋 Planned", and strike the last open items in the session 4 changelog entry.
