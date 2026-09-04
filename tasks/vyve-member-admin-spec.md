# VYVE Member Admin — build spec (v2)

**Status:** DESIGN LOCKED v2 · revised 2026-09-05 (PM-1026) after Fable's audit of the v1 draft (PM-1024/1025). Build NOT started.
**Supersedes:** v1 of this file. `admin-console.html` (soft-killed PM-1012) is RESTORED as the interim surface in W1 and re-retired when W3 ships.
**Look and feel:** `coach-portal.html` is the visual benchmark for every NEW surface in this programme — Dean's call, restated 2026-09-05: "I like the look of the PT back end, I want it to feel very similar." Same sidebar, same client-workspace chrome, same tab bar, same density. Match it, do not approximate it.
**Waves:** `tasks/vyve-member-admin-waves.md` — seven waves, W0–W6.

---

## 1. What this is

A VYVE staff surface for administering members directly: look a member up, open their record, fix their habits/programme/goals, and (later) build a programme once and hand it to a cohort. Two halves with two different triggers:

- **The mundane half** — "a member says their habits are wrong and I need to fix them." Closed by **W0+W1**, ~1.5 sessions, using what already exists.
- **The ambitious half** — build once, assign to many, tags, VYVE PT role. **W2–W6.** Dean has decided to build it; the audit's advice that the natural trigger is the first enterprise cohort (Sage) or the first VYVE PT is recorded, not enforced.

**Users (launch):** Dean, Lewis, Alan, Calum, Cole. **Live `admin_users` reality (5 Sep):** 13 active rows — 4 admin, 5 team, 4 partner. See §3.

---

## 2. What already exists — VERIFIED against live state 2026-09-05

| Thing | Verified state | Consequence |
|---|---|---|
| `admin-member-edit` v21 | Live. 14 SAFE + 7 SCARY fields of 142. Audit log writes. **Gate = any active `admin_users` row**; only `viewer`/`coach_exercise` are restricted, and nobody holds those roles. No read action — the member row comes from PostgREST under `members_admin_read_pm796`. | W0 fixes the gate. Overview tab selects a column list, never `*`. |
| `admin-member-habits` v17 | Live, untouched since 22 Apr, checks out against live schema. `list_library` already filters `active=true`, so coach-private habits (`active=false, created_by='coach:<pid>'`) never reach the picker. `member_habits` unique `(member_email, habit_id)` exists. | Usable as-is after the W0 gate fix. |
| `admin-member-programme` v17 | Live, untouched since 22 Apr, **BROKEN against the live `workout_plan_cache` contract**: `.maybeSingle()` on member_email (5 members have multiple rows → 500); pause/resume flip every surface; `swap_plan` upserts `onConflict:'member_email'` with no such constraint → fails every call; `programme_library` rows carry no `surface`. | **Rewritten in W1** to the `coach_apply_assignments` pattern. |
| `admin-member-weekly-goals` v17, `admin-programme-library` v15, `admin-dashboard` v23 | Live, untouched since April. | Re-read before each is wired; presume stale until proven. |
| `admin_audit_log` | 22 rows, **zero** `member_edit` / `habit_*` / `programme_*` actions. | The member-admin backend has no production track record. Every wave live-verifies. |
| `admin-console.html` | 135KB, dual-theme (Wave 3), wired to all six EFs incl. `assign_habit` + `swap_plan`, restorable by uncommenting three lines (PM-1012). | **Restored in W1** as the interim surface. |
| Member inbox | `notifications.html` EXISTS in vyve-site, bell on `index.html`, reads `member_notifications` (998 rows) via `notifications` EF v25 (7-day prune). | v1 "blocker 1" was false. W5 writes rows; no inbox build, no OTA. |
| `coach_messages` | `partner_id NOT NULL`. `cmsg_admin_all` = `is_admin()` ALL exists; member SELECT is email-only; **member INSERT requires a consented `coach_clients` row** (member cannot reply to VYVE). | W6: nullable + `sender_scope` + member-insert branch + null-safe render + push EF branch + `is_admin_or_team`. |
| `workout_plan_cache` | 89 rows / 81 members / 83 active. Columns `is_active, paused_at, source, source_id`. Partial unique index `(member_email, programme_json->>'surface') WHERE is_active`. Surfaces `workouts:65, movement:24`. History is RETAINED (old rows `is_active=false`). | Reassignment never overwrites. Reversibility comes for free. |
| Programme sources | THREE: `programme_library` (35, no `surface`), `coach_templates kind=program`, `workout_plans` (313). | **One VYVE library: `coach_templates WHERE partner_id IS NULL`.** `programme_library` retired from the VYVE path in W2. |
| `coach_exercises` | 977 rows, ALL `partner_id IS NULL`; read policy `partner_id IS NULL OR = mine`. | The null-partner VYVE scope already exists at the data layer. |
| `coach-portal.html` | 536KB. Resolves `partnerId` once via `get_my_partner_id()`, shows "Not linked" if null, scopes **55** REST filters `partner_id=eq.` and stamps **24** inserts. `get_my_partner_id` resolves by `partner_partners.contact_email` — one partner per login. | Builders are not "lifted out"; the portal becomes null-scope-aware (W2). A VYVE partner row is rejected because five staff cannot share one login's partner. |
| Members | 95: trial 74 (61 `expired`), comp 19, paid 1, enterprise 1. Trial wall already live (PM-958 routing, trial-end-email day-6 arc). | "Zero paying" in v1 was stale. |

---

## 3. Security — W0, before anything else

Live defects found 2026-09-05, independent of this build:

1. **Partner-role logins pass the admin-EF gate.** Vanessa Sturman, April Rosson (external partners) and two second accounts hold `admin_users.role='partner'`; every `admin-member-*` EF accepts them and lets them edit `persona`, `subscription_status`, `health_data_consent`, `sensitive_context`, assign habits, swap programmes. Fix: `verifyAuth` requires `role IN ('admin','team')`.
2. **`team` is already the over-privileged role.** `members_admin_read_pm796` gives team SELECT on all 142 columns; `admin-member-edit` lets team edit `subscription_status`; `member_audit_log` action has no role check. Calum, Cole, Phil, Heidi, Ryan are team. The "build-only role that cannot see billing or private data" is what `team` must become — not a W6 nicety.
3. PM-1003's queued one-pass grep for `?email=` fallbacks across legacy EFs runs here.

Role model (locked): `admin` = everything incl. Admin tab, GDPR, audit log, subscription edits. `team` = member list + habits/programme/goals/nutrition + libraries + batch assign; NO subscription_status/persona/consent/sensitive_context edits, NO audit-log read, column-limited member read. `partner`/`coach` = never reach admin-* EFs. VYVE PTs are `team`.

---

## 4. Architecture (locked v2): one data layer, one builder, one new page

- **VYVE scope = `partner_id IS NULL`.** Library exercises already are. VYVE programme/habit/nutrition templates live in `coach_templates` with null `partner_id`. `admin_all` (`is_admin_or_team`) already grants staff write.
- **One materialisation path in SQL.** `vyve_apply_template(p_member_email, p_template_id, p_actor)` reuses `coach_build_program_json` and the exact `coach_apply_assignments` wpc pattern (deactivate active `surface='workouts'` row → insert new, `source='vyve'`, `source_id=template`). No `coach_clients`, no consent — VYVE is the controller. Habits via the same upsert-on-conflict as the coach path with `assigned_by='admin'` (already in the CHECK).
- **The coach portal is the builder.** It gains a scope helper: admin/team logins with no partner row resolve to the null scope instead of "Not linked", and the 55 filters/24 inserts go through `pscope()`. Calum's behaviour is unchanged because his `partnerId` is non-null. Nothing is extracted, nothing is forked.
- **One new CC page — `pages/member-admin.html` — on the coach-portal chrome.** Members list (all 95) + member workspace (Overview · Habits · Workouts · Goals · Nutrition · Check-ins · Logs · Admin) + Batch assign. This is where the coach-portal look matters and where mock-up-first applies.
- **Separate:** the member list source, the Admin tab, and authorisation. Everything else is shared by construction, not by copying.

Coaches must NEVER see: billing/subscription, trial clocks, attribution, persona, re-engagement streams, GDPR export/erasure, certificates, push subscriptions, audit log.

---

## 5. Surface map

Sidebar verdicts from v1 stand (Profile/Leads/Calendar/Questionnaires/Check-in forms/Lead forms/Terms KILL; Automations = kill editor keep mechanism; Notifications/Dashboard/Members/Workouts/Exercise Library/Content Library KEEP; Check-ins ADAPT; Settings ADAPT) with two changes:
- **Nutrition → Plans/Meals/Foods/Supplements: PARKED**, not KEEP. v1 had no VYVE write path; coach nutrition materialises via consent into `coach_nutrition_plans`. Revisit through the null-scope template route once W2 is proven.
- **Forms → Daily habits: KILL the builder, KEEP assignment, ADD a "new library habit" form** (one form, ~20 lines, not a builder) so adding a VYVE habit stops needing SQL. Ships in W1.

Member workspace: Overview · Habits · Workouts · Goals · Nutrition (TDEE/macros/deficit on `members`) · Check-ins (VYVE tables) · Logs · **Admin** (role-gated). Gallery/Q&A/Calendar KILL.

Check-in form builder kill is right for a reason v1 didn't give: VYVE check-ins are Phil-gated clinical instruments; a staff-authorable question builder is a route around that gate.

---

## 6. Batch assign (W4)

Cohort picker: **facets first** — `company`, `account_type`, `employer_members`, partner attribution — THEN name, email, tag. "Everyone at Sage" is a company filter, not a tag.

`member_tags` (table, not `text[]` — queryable, RLS-able, GDPR-registerable, global rename/delete): `id uuid pk, member_email text not null references members(email) on delete cascade, tag text not null, created_by text not null, created_at timestamptz default now(), unique (member_email, lower(tag))`, index on `lower(tag)`. Registered in `gdpr_table_policy` as `purge` in the same migration.

Non-negotiable: (1) dry-run preview listing exactly who changes; (2) the apply loop runs **server-side in an EF**, one `vyve_apply_template` call per member, one `admin_audit_log` row per member — never a browser loop of EF calls; (3) honest per-member success/failure report.

**Reversibility (decided):** add `batch_id uuid` to `admin_audit_log`. Every batch is reversible: revert = server-side replay of each row's `old_value` — for programmes, reactivate the retained prior row and deactivate the new one; for habits, restore prior `active`. `exercise_logs` are plan-agnostic; nothing is lost. Dry-run says "reversible"; the report carries the batch id.

---

## 7. Notifications (W5) and messages (W6)

W5: on every apply (single or batch), insert `member_notifications` (`type='plan_change'`, `title`, `body`, `route='/workouts.html'`) + a `scheduled_pushes` row. Email half already exists for coach-side (`coach-provision-client` diff). Lewis copy on the strings. Note the inbox prunes at 7 days.

W6 messages: `coach_messages.partner_id` nullable + `sender_scope text not null default 'coach' check in ('coach','vyve')`; `cmsg_admin_all` → `is_admin_or_team()`; a `cmsg_member_ins_vyve` policy branch (sender='member', partner_id null, own email); null-safe partner rendering in `coach-messages.html` and in the coach-side popover; `coach-message-push` branch for null partner ("VYVE team"). Never a VYVE partner row.

---

## 8. Open decisions

- Lewis copy on plan-change notification strings and VYVE message chrome (non-gating for W0–W4).
- Which `members` columns `team` may read (W0 proposes a view; Dean confirms the list).
- Whether admin-console is re-retired at W3 or kept as a fallback route (default: re-retire).
