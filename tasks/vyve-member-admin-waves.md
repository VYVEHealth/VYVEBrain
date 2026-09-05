# VYVE Member Admin — wave briefs (v2)

**Companion to:** `tasks/vyve-member-admin-spec.md` v2 (design, verified state, architecture)
**Status:** briefs rewritten 2026-09-05 (PM-1026) after the audit. **W0 + W1 SHIPPED 2026-09-05 (PM-1027). W2 SHIPPED 2026-09-05 (steps 1+2 PM-1028, step 3 PM-1029, CC `4fceb967`). W3 SHIPPED 2026-09-05 (PM-1030 `ee93b90b` page + nav, PM-1031 `7c2e8358` admin-console re-soft-killed; admin-dashboard v25 `member_health`). W4 SHIPPED 2026-09-05 (PM-1032 migration + `admin-batch-assign` EF, PM-1033 CC `239015a3` tags, PM-1034 CC `f3106ab1` batch). W4b SHIPPED 2026-09-05 (PM-1035/1036, CC `555ba2d5`). W5 SHIPPED 2026-09-05 (PM-1037 EFs `admin-member-programme` v6 / `admin-batch-assign` v2 / `coach-provision-client` v13, PM-1038 CC `ab4a1e6d`) — collapsed to one `scheduled_pushes` row per member, flag-gated on Lewis copy (§23.223). W6 SHIPPED 2026-09-05 (PM-1039 migrations + vyve-site `d470f7f3` vbb 591, PM-1040 CC `94f00a63`) — programme code-complete.**
**How to use:** Dean says "load the brain, do wave N". Load `brain/master.md` → `brain/changelog.md` → `tasks/backlog.md`, then read the spec, then the brief below. The brief is the task; the spec is the reasoning. **The brain wins over both; live Supabase wins over the brain.**

**Look and feel, every wave that touches UI:** `coach-portal.html` is the benchmark. Dean likes how it looks and wants the member-admin surface to feel the same — same sidebar, same client workspace, same tab bar, same density, same tokens. Match it; do not approximate it. Mock-up first, dark theme first.

**Estimates are Claude-assisted sessions.** Honest total ≈ **8–10**: W0 0.5 · W1 1 · W2 2–3 · W3 1.5–2 · W4 1.5–2 · W5 0.5–1 · W6 1.5–2. W0+W1 (~1.5) close the stated need; W2–W6 is the ambitious half.

---

## RULES FOR EVERY WAVE

- **The brain wins** over the spec, these briefs, memory and chat. Live Supabase wins for counts, EF versions and schema — re-read the schema before writing any EF or SQL.
- **Talk-first for anything production-affecting**; surgical patches need a one-line summary. Once direction is confirmed, execute end to end: commit, deploy, verify, brain update.
- **GitHub writes via the Vault PAT + Git Data API only.** §23.21 fresh-HEAD, §23.22 per-file drift check, §23.30 md5-perfect verification at the commit SHA — never `ref=branch`, never first-N-chars; §23.210 retry a single mismatch once.
- **Claim the PM number fresh at commit time** across all four repos (§23.24/23.25). §23.23 collision scan on the last 15 CC commits at session start.
- **CC is Cloudflare Pages** — no vbb ritual. Bump `?v=` on any linked asset you touch, same commit, every file that links it (§23.207). You cannot reach the Cloudflare API from the sandbox — say so.
- **Soft-kill only.** Never delete a file.
- **Assert every anchor before patching.** `node --check` every inline script you touch. Prove the selector set unchanged either side of any CSS rewrite. §23.204 (inline styles set by JS, `#id *` resets) before blaming layout on your change.
- **Every EF deploy is unverified until re-fetched or invoked** (§23.200). `Supabase:deploy_edge_function` only; pass `verify_jwt` explicitly (§23.165). admin-* EFs are `verify_jwt:false` at the gateway with in-code JWT verification — correct, do not "fix" it.
- **§23.214: RLS policies OR.** A staff account is never a valid test of what a member sees.
- **Commit in batches** grouped so a regression reverts one group, not the session. Tell Dean the grouping first.
- **Close every session** with the atomic VYVEBrain sync (changelog prepended, master + backlog patched, new gotchas → §23 rules) plus a plain list of what to check on phone and desktop, dark theme first.

### Traps for the whole programme

- This surface writes directly to `members`, `workout_plan_cache` and `member_habits` for all 95 members. The coach portal, at worst, damages one consented client. Behave accordingly.
- `workout_plan_cache` is one ACTIVE row per `(member_email, programme_json->>'surface')`, history retained. Never `.maybeSingle()` on member_email; never upsert on member_email (no such constraint); never touch a row without a surface filter. Read `coach_apply_assignments` for the canonical write.
- The admin-* EFs from April (`-habits` v17, `-programme` v17, `-weekly-goals` v17, `-programme-library` v15) are presumed stale until re-read against live schema. `admin_audit_log` has never recorded a member edit — nothing here is proven until you invoke it.
- `admin-member-edit` allowlists 21 of 142 columns deliberately. Widening = one validator per field, never a blanket update.
- Coaches must never see: billing, trial clocks, attribution, persona, re-engagement streams, GDPR actions, certificates, push subscriptions, audit log.

---

## W0 — Security gate (BEFORE anything else) — SHIPPED PM-1027

**Shipped 2026-09-05:** items 1–4 done and live-proven with minted partner/team JWTs (§23.216). Extras: `get_attribution`/`set_attribution` admin-only; admin-dashboard team shaping (`member_raw` 403, column-limited `member_detail`). Item 4 found no read fallbacks; seven unauthenticated cron sweeps + `platform-alert` intake went to the backlog.

**Est. 0.5 session.** No UI. Closes three live defects that exist today regardless of this build.

**In scope:**
1. `verifyAuth` in `admin-member-edit`, `admin-member-habits`, `admin-member-programme`, `admin-member-weekly-goals`, `admin-programme-library`, `admin-dashboard`: require `role IN ('admin','team')`. Deploy each; **live-invoke with a partner JWT and prove 403**, then with a team JWT and prove 200.
2. Role split inside `admin-member-edit`: `team` may not edit `subscription_status`, `persona`, `health_data_consent`, `sensitive_context`; `member_audit_log` action is admin-only. Deploy; live-invoke both roles.
3. `members` read for team: replace the 142-column `members_admin_read_pm796` SELECT with a column-limited view (`members_staff_view` — identity, company, account_type, subscription_status read-only, goals, exercise_stream, persona name only, habit/programme pointers; NO `sensitive_context`, NO health free text) or a column-privilege grant. Dean confirms the column list before the migration. admin keeps full read.
4. PM-1003 follow-on: one-pass grep of every legacy EF for `?email=` / body-email fallbacks that bypass JWT. Report; fix the ones found.

**Explicitly out:** anything member-facing, any UI.

**Dean checks:** none on phone. Paste the 403/200 invocation results in the brain entry.

---

## W1 — Fix the programme EF, restore admin-console, close the stated need — SHIPPED PM-1027

**Shipped 2026-09-05:** admin-member-programme v4 (rows by surface, row-id pause/resume/advance, `assign_template` with `swap_plan` alias — `programme_library.surface` column exists and is used), admin-member-habits v19 `create_library_habit`, admin-console.html restored + repointed (CC `75688462`). Dean has seen it; it is the interim look, not the coach-portal look — that is W3.

**Est. 1 session.** Base: W0 shipped.

**In scope:**
1. **Rewrite `admin-member-programme`** to the live contract. `get_programme` returns all rows for the member, active first, grouped by surface. `pause`/`resume`/`advance_week` take a row `id`, not an email. `swap_plan` (rename `assign_template`) takes `template_id` from `coach_templates WHERE partner_id IS NULL AND kind='program'` OR a `programme_library` id for now, deactivates the active `surface='workouts'` row, inserts a new row with `surface` set, `source='vyve'`, `source_id`, `current_week=1`. Audit row on every mutation. Deploy, live-invoke against a test member, confirm the member app renders it.
2. **Restore `admin-console.html`**: uncomment the three PM-1012 lines (`sidebar-config.js`, `pages/home.html`, `pages/links.html`); bump `?v=`; repoint its programme tab at the new EF shape. It is the interim surface until W3.
3. **"New library habit" form** in admin-console's habits tab: `habit_pot`, `habit_title`, `habit_description`, `difficulty` → insert into `habit_library` with `created_by='admin'`, `active=true`. Audit row.

**Explicitly out:** a habit form builder, new pages, the coach-portal look (that is W3).

**Traps:** `member_habits` carries 472 live rows; `habit_library` rows with `created_by LIKE 'coach:%'` are `active=false` and already filtered — keep it that way. `programme_library` rows lack `surface`; the EF injects it.

**Dean checks:** on phone as a real member after admin-console edits a habit and swaps a programme: habits page changes, workouts page renders the new programme, nothing else moved. Confirm both audit rows exist.

### Reassess here. Dean's call whether W2 starts now. Audit's note: the natural trigger for W2–W6 is the first enterprise cohort or the first VYVE PT.

---

## W2 — One data layer: null-scope library + `vyve_apply_template()` + scope-aware coach portal — SHIPPED (PM-1028 + PM-1029)

**Shipped 2026-09-05:** item 1 (`vyve_apply_template`, program + habits, fixture-proven, `coach_build_program_json` tolerates NULL partner) and item 2 (35 library rows → `coach_templates` partner_id NULL with `payload.prebuilt`; `assign_template` repointed, legacy id mapped) — PM-1028. Items 3 + 4 — PM-1029, CC `4fceb967`: `pscope()`/`pprefix()` sweep, `init()` staff branch gated on `rpc/is_admin_or_team`, coach-only chrome hidden (Calendar/Content/Notifications too — content uploads derive partner_id server-side), exercise scope defaults VYVE with VYVE rows editable, staff land on Programmes; migration `w2_null_scope_staff_write` gives team write on exercises/foods + `vyve/` storage. Inserts needed no change (`partner_id: partnerId` stamps null). Six storage prefixes, not three.

**Est. 2–3 sessions.** Base: W1 shipped. **The wave that makes "build once, hand to many" possible. It is mostly SQL, and it replaces v1's builder extraction.**

**In scope:**
1. **`vyve_apply_template(p_member_email text, p_template_id uuid, p_actor text) returns jsonb`** — SECURITY DEFINER, `search_path public`. Reads `coach_templates` where `id = p_template_id AND partner_id IS NULL AND active`. Programme kind: `coach_build_program_json(NULL, payload, name)` (confirm it tolerates a null partner; patch if not), then the canonical wpc deactivate/insert with `source='vyve'`. Habits kind: the same upsert-on-conflict as `coach_apply_assignments` with `assigned_by='admin'`; deactivate previously admin-assigned habits not in the new set. Returns `{ok, kind, wpc_id | habit_ids, prior_wpc_id}` — the prior id is what W4's revert needs. One migration, fixture-proven with a real template against a test member.
2. **Retire `programme_library` from the VYVE path**: migrate its 35 rows into `coach_templates` (`partner_id NULL, kind='program', payload=programme_json+surface`) — soft: leave the table, stop reading it. Repoint W1's `assign_template` at `vyve_apply_template`.
3. **Coach portal null scope**: `init()` — admin/team login with `get_my_partner_id()` null resolves to `partnerId = null` and continues instead of "Not linked". Introduce `pscope()` returning `partner_id=is.null` or `partner_id=eq.<id>` and sweep the 55 filters; inserts stamp `partner_id: partnerId` (null) — RLS `admin_all` on `coach_templates`/`cex_admin_all` on exercises already allow it. Staff see a "VYVE library" badge where a coach sees "Mine". Client-side sections that are coach-only (Clients, Leads, Messages, Automations, Forms, Profile) hide when `partnerId === null` — VYVE members are administered in W3's page, not here.
4. Exercise library: `vyve / mine / all` scope selector already exists — staff default to `vyve` and can author into it.

**Explicitly out:** any member-admin UI, batch, tags.

**Traps:** 536KB single file, shadowed functions (`viewClient`, `calLoad`, `go` — bottom definitions are live). Sweep with a script, assert the count of `partner_id=eq.` goes to zero and `pscope()` count matches. **Calum's portal must behave identically** — his `partnerId` is non-null, so every `pscope()` resolves as before; prove it by diffing his REST calls before/after in the network log. Revert to known-good bytes first, diagnose second, if a live staff surface breaks.

**Dean checks:** log in to the coach portal as Dean (admin, no partner): libraries load, VYVE-scope programme can be authored and saved; log in as Calum: nothing changed. `vyve_apply_template` on a test member renders in the app.

---

## W3 — `pages/member-admin.html`: the real surface, on the coach-portal chrome — SHIPPED PM-1030/1031

**Shipped 2026-09-05:** fragment inside the CC shell with an in-fragment coach-portal rail (library items link out to coach-portal at null scope rather than re-rendering the builders); list + w5 workspace with all eight tabs; Admin tab absent for team; admin-dashboard v25 `member_health` added because the check-in tables have member-own policies only. admin-console re-soft-killed, byte-untouched; its dropdown deliberately not repointed. Staff-initiated GDPR not wired.

**Est. 1.5–2 sessions.** Base: W2 shipped. **Mock-up first — this is the wave the coach-portal look applies to.**

**In scope:** new CC page on the coach-portal layout: sidebar (Dashboard · Members · Workouts · Exercise Library · Content Library · Notifications · Settings) · members list with search over all 95 (no consent link, no `is_coach_of`) · member workspace with tabs **Overview · Habits · Workouts · Goals · Nutrition · Check-ins · Logs · Admin**. Overview edits via `admin-member-edit` (`field_schema` drives the controls; SAFE/SCARY + reason modal). Habits via `admin-member-habits` + the W1 library-habit form. Workouts via the W1/W2 EF: view every wpc row grouped by surface, assign a VYVE template to one member, pause/resume/advance by row id. Goals via `admin-member-weekly-goals` (re-read it first). Nutrition = TDEE/macros/deficit on `members` (`tdee_target`/`deficit_percentage` already SCARY). Check-ins = `wellbeing_checkins`/`monthly_checkins`/`daily_mood_checkins`, read-only. Logs = activity timeline. **Admin tab** (admin role only): subscription/trial state, attribution (`get_attribution`/`set_attribution`), persona, re-engagement stream, certificates, push subscriptions, GDPR actions, audit log.

At the end of the wave: **re-soft-kill `admin-console.html`** (same three lines) and point the Members sidebar item at the new page.

**Explicitly out:** batch assign, tags, messages.

**Traps:** the member row comes from PostgREST — select a column list, never `*`; under W0 the team role gets the view. `team` must not see the Admin tab at all, not merely have its buttons disabled.

**Dean checks (dark theme first):** it looks like the coach portal; search, open a member, edit a SAFE field, edit a SCARY field with the reason modal, fix habits, assign a template, see it in the app, confirm audit rows; log in as `team` and confirm no Admin tab.

---

## W4 — Tags + batch assign — SHIPPED PM-1032/1033/1034

**Shipped 2026-09-05:** all five items. `member_tags` + purge row + `batch_id` in one migration; `admin-batch-assign` EF v1 with `facets`/`resolve_cohort` (facets AND'd, values OR'd, empty → 400, cap 100, test accounts excluded unless asked)/`dry_run`/`apply`/`revert`/`list_batches` + tag CRUD; four-step Batch page + Settings › Tags + Overview tag box. Two deviations from the brief, both deliberate: apply takes the dry run's email list, never the criteria, so preview and apply cannot diverge; revert is conditional — a batch row that is no longer the active one is reported `changed_since_batch` and left alone rather than forced. Habits kind snapshots the whole `member_habits` set into `old_value.prior_habits` because the RPC's upsert overwrites `assigned_by`. Proven live with a minted team JWT before the page existed. Team may apply and revert (spec role model).

### W4b — the PT-area version (Dean's ask, 2026-09-05) — NOT STARTED
Same shape for a coach's own consented clients inside `coach-portal.html`: cohort = multi-select over `coach_clients` (name/email/tag), template = the coach's own `coach_templates`, apply = the existing `update_assignments` → `coach_apply_assignments` path per client (already returns prior ids), one audit row per client, dry run → apply → per-client report → revert. Client tags need a partner scope (`member_tags.partner_id` nullable + policy, or a `coach_client_tags` table — decide at mock-up; VYVE tags must stay invisible to coaches either way). Own session, mock-up first, dark first, Calum-unchanged proof on his REST calls. Est. 1.5 sessions.


**Est. 1.5–2 sessions.** Base: W3 shipped. The headline feature. Shared with coaches only where the coach path already has a cohort (it does not — coach batch is a later ask; do not widen this wave).

**In scope:**
1. `member_tags` per spec §6 + `gdpr_table_policy` `purge` row in the same migration. Tag chips on the member Overview; global rename/delete in Settings.
2. `admin_audit_log.batch_id uuid` column.
3. **Cohort picker** on the Batch page: facets first (company, account_type, employer, attribution), then name / email / tag; multi-select; live count.
4. **`admin-batch-assign` EF** (new, `verify_jwt:false` + in-code JWT, admin/team): `dry_run` returns the exact member list with each member's current programme name; `apply` iterates server-side calling `vyve_apply_template` per member, one audit row per member with `batch_id`, `action='batch_assign'`, `old_value={prior_wpc_id, programme_name}`, `new_value={wpc_id, template_id}`; returns per-member ok/error; never a single "done". `revert` takes `batch_id`: per row, deactivate `new_value.wpc_id`, reactivate `old_value.prior_wpc_id`, write a `batch_revert` audit row. Habits kind analogous via prior active set in `old_value`.
5. Dry run → confirm ("N members, reversible, batch id shown") → apply → per-member report with a Revert button.

**Traps:** largest blast radius in the platform. Fifty programmes rewritten overnight is visible to fifty people the next morning. Cap a batch at 100 and refuse silently-broad cohorts (an empty picker must not mean "everyone").

**Dean checks:** tag three test members, dry run, confirm the list, apply, spot-check two in the app, revert, spot-check again.

---

## W5 — Plan-change notification (push + in-app) — SHIPPED PM-1037/1038

**Est. 0.5–1 session.** **As built:** the brief's `member_notifications` insert was WRONG — `send-push` writes the bell row from `data.url`; one `scheduled_pushes` row per member is the whole write (§23.223). Coach side shipped in the same session via `fireAutomations`. Base: W4 shipped. **The inbox already exists** (`notifications.html` ← `notifications` EF v25 ← `member_notifications`). No inbox build, no OTA.

**In scope:** inside `admin-batch-assign` apply (and the single-member assign in W3), insert `member_notifications` (`type='plan_change'`, `title`, `body`, `route='/workouts.html'`) and a `scheduled_pushes` row per member. Strings from Lewis (copy pass, non-gating: ship with placeholders behind a `NOTIFY_ENABLED` flag defaulting off until approved). Note the 7-day prune.

**Dean checks:** assign a template to himself, receive the push, open the bell, read it, tap through to Workouts.

---

## W6 — VYVE-side messages + PT role hardening — SHIPPED PM-1039/1040

**Shipped 2026-09-05:** (a) as briefed plus `sender_email`, a scope⇔partner CHECK, two partial indexes and the gdpr row; team's WITH CHECK is `partner_id IS NULL OR is_admin()`. (b) `coach-messages.html` two-thread model with switcher + `?t=vyve`; the coach-side popover needed nothing (coach policies never match a null partner); Messages tab in `member-admin.html` (coach threads deliberately not rendered). (c) collapsed to a trigger branch — `coach-message-push` v2 already forwards `coach_name`. (d) checked, not built: team cannot reach Admin tab / audit / billing (W3 jsdom + PM-1027 proof); `role='pt'` waits for a hire. Live-proven by RLS role simulation (§23.224), `coach_messages` had 0 rows before and after. OTA 591 pending Dean's pass.

**Est. 1.5–2 sessions.** Base: W5 shipped. Optional — Dean confirms it is wanted before starting.

**In scope:** (a) migration: `coach_messages.partner_id` nullable; `sender_scope text not null default 'coach' check (sender_scope in ('coach','vyve'))`; `cmsg_admin_all` → `is_admin_or_team()`; new `cmsg_member_ins_vyve` (own email, `sender='member'`, `partner_id IS NULL`). (b) `coach-messages.html` renders a VYVE thread labelled "VYVE team" when `partner_id` is null; coach-side popover unchanged for coaches; Messages section in `member-admin.html`. (c) `coach-message-push` null-partner branch. (d) PT role: confirm `team` under W0 already cannot reach billing/GDPR/audit; if VYVE hires a PT who should see even less, add `role='pt'` then — not before.

**Do not create a VYVE partner row** — `get_my_partner_id()` is one partner per login; five staff cannot share it.

**Dean checks:** message a test member from the CC, read and reply in the app, confirm the push; log in as team and confirm the Admin tab and audit log are unreachable.
