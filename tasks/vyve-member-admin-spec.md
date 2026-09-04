# VYVE Member Admin — build spec (v1 draft)

**Status:** DESIGN LOCKED, NOT STARTED · drafted 2026-09-04 (PM-1024) with Dean
**Supersedes:** `admin-console.html`, soft-killed at PM-1012 and not coming back
**Benchmark:** `coach-portal.html` — Dean's call: that is the quality bar and the layout

---

## 1. What this is

The VYVE-side equivalent of the coach portal: a staff surface for administering
members directly. Driven by a real need — "a member says their habits are wrong and
I need to go in and fix them" — plus the ability to build workouts once and hand
them to many people.

**Users (launch):** Dean, Lewis, Alan, Calum, Cole. Five people, `admin_users`
role `admin` or `team`.
**Users (later):** VYVE's own PTs, building set plans. The role model must already
allow a build-only role that cannot see billing or GDPR surfaces.

---

## 2. What already exists (do not rebuild)

The member-admin **backend was never killed** — PM-1012 only delinked the UI.

| Edge Function | State | Covers |
|---|---|---|
| `admin-member-edit` | **v21 live** | Field edits w/ SAFE/SCARY split, enum validation, role gating, full `admin_audit_log` writes (old/new/reason/IP/UA), `field_schema` self-description, attribution get/set |
| `admin-member-habits` | live | Member habit assignment |
| `admin-member-programme` | live | Member programme read/write |
| `admin-member-weekly-goals` | live | Weekly goal admin |
| `admin-programme-library` | live | Programme library |
| `admin-dashboard` | live | Platform overview |

**Known limit:** `admin-member-edit` allowlists **21 fields of the members table's
142**. Widening it is a list edit, not a rewrite — but it is a deliberate allowlist
and every added field needs a validator. Do not replace it with a blanket update.

Live data this surface administers: **95 members**, 89 programmes in
`workout_plan_cache`, 472 rows in `member_habits` against a 38-row `habit_library`,
977 rows in `coach_exercises`, 313 in `workout_plans`.

---

## 3. The architecture decision

**Do NOT fork `coach-portal.html`.** It is 536KB. A copy means every builder exists
twice and every future fix happens twice.

**Do NOT make VYVE a coach either.** The coach model is a *consented third party*
scoped by `is_coach_of`, with a deliberate hard boundary excluding the Mind pillar so
Phil stays out of the critical path. VYVE staff are the **controller**: no consent
gate, scope is all 95 members, and wellbeing data is legitimately in scope.

**The shape:** shared builders, two shells, separate write paths.

- **Shared:** exercise library, workout/programme builder, nutrition plan builder,
  content library, the client/member workspace chrome. The exercise library already
  carries a `vyve` / `mine` / `all` scope selector — the shared-library idea is
  half-built already.
- **Separate:** the shells, the access rules, and critically **the write path**. The
  coach portal writes to `coach_*` tables and only materialises into member data via
  `coach_apply_assignments`, gated on consent. VYVE writes **directly** to
  `workout_plan_cache`, `member_habits` and `members`. This is the part that is new
  work, not an edit.

---

## 4. Surface map — sidebar

Verdicts agreed with Dean, 2026-09-04.

| Coach portal item | VYVE verdict |
|---|---|
| Profile | **KILL** — coach's public profile, VYVE isn't listed |
| Messages | **KEEP** (see §6.3 — needs a schema decision) |
| Notifications | **KEEP, rebuild** — platform events, not client events |
| Dashboard | **KEEP, rebuild** on `admin-dashboard` |
| Clients → All clients | **KEEP, rescope** → **Members**, all 95, no consent link |
| Clients → Check-ins | **ADAPT** → `wellbeing_checkins` / `monthly_checkins` |
| Clients → Daily check-ins | **ADAPT** → `daily_mood_checkins` |
| Leads | **KILL** |
| Nutrition → Plans/Meals/Foods/Supplements | **KEEP** |
| Workouts → Programmes/Weekly/Day templates | **KEEP — core ask** |
| Exercise Library | **KEEP** — 977 rows, scope selector exists |
| Calendar | **KILL** — CC already has one on `calendar_occurrences` |
| Content Library | **KEEP** |
| Automations | **KILL the editor, KEEP the mechanism** (see §6.2) |
| Forms → Questionnaires | **KILL** — onboarding EF owns this |
| Forms → Check-in forms | **KILL** — Dean's call |
| Forms → Daily habits | **KILL the builder, KEEP assignment** — picker over `habit_library`, not a form builder |
| Forms → Lead forms | **KILL** |
| Forms → Terms | **KILL** |
| Settings | **ADAPT** → staff/admin settings |

### VYVE-only sections (coaches must NEVER see these)

Billing and subscription state · trial clocks · partner attribution · persona
assignment · re-engagement streams (A/B/C1/C2/C3) · GDPR export and erasure ·
certificates · push subscriptions · the audit log.

---

## 5. Surface map — member detail

Coach portal has 11 tabs. VYVE takes 8.

**KEEP:** Overview · Nutrition (TDEE, macros, deficit — live columns on `members`) ·
Workouts · Habits · Logs · Goals · Plans
**ADAPT:** Check-ins — same layout, VYVE's own check-in tables
**KILL:** Gallery (coach progress photos; VYVE's are `challenge-photos`, sensitive) ·
Q&A (coach questionnaire) · Calendar (coach diary)
**ADD:** Admin tab — the VYVE-only sections above, role-gated.

---

## 6. New features

### 6.1 Batch assign — THE headline feature

Not in the coach portal, not in admin-console, nowhere. **Build it shared — coaches
get it too.** Twenty clients starting the same 8-week block is twenty manual
assignments today.

**Cohort picker (Dean's design):** multi-select, where you can
- type a member's **name**
- type a member's **email**
- search a **tag**

**Tags are new.** No tag infrastructure exists (`taglines` is unrelated partner copy).

```
member_tags (
  id           uuid pk,
  member_email text not null,
  tag          text not null,
  created_by   text not null,      -- admin email
  created_at   timestamptz default now(),
  unique (member_email, lower(tag))
)
```

Table, not a `text[]` on members: queryable, RLS-able, registerable in the GDPR
catalogue, and a tag can be renamed or deleted globally without rewriting 95 rows.
Tag catalogue is `select distinct tag` — no second table until it needs one.

**MUST be registered in `gdpr_table_policy` as `purge`** at creation. The catalogue
defaults unregistered tables to purge-and-alert, but register it deliberately.

**Assignment must be transactional and audited:** one `admin_audit_log` row per
member, never one row for the batch — a batch that half-fails must be readable
afterwards.

### 6.2 Plan-change notification

**Already half-built.** `coach_automations` has zero rows *by design* — it runs on
built-in default-on templates, and `coach-provision-client` v7 already diffs old vs
new assignment slots and emails the client on every change.

Missing: **push and in-app**. Both rails exist (`scheduled_pushes` live with 27 rows;
`member_notifications` has the right shape — `type`, `title`, `body`, `route`). This
is wiring, not building. Extend to both surfaces.

**GAP TO RESOLVE FIRST:** `member_notifications` is referenced in exactly ONE place in
the member app (`wellbeing-checkin.html`). There is effectively **no in-app inbox for
a member to read**. If plan-change alerts and staff messages both land there, members
have nowhere to see them. A member-side notifications inbox is member-facing work:
Lewis copy pass + OTA. **Sequence this before, or the notifications go nowhere.**

### 6.3 Messages

The loop already exists end to end and has never been used (0 rows):
`coach_messages` + the coach-side popover + `coach-messages.html` in the member app.
Nothing to build for coaches.

**Blocker for the VYVE side:** `coach_messages` is scoped by `partner_id`, and VYVE is
not a partner. Two options:

1. Create a VYVE partner row — **rejected**: a fake partner row leaks into payout
   queries, roster counts and the Discover list. Same class of bug as the four bare
   referral placeholders that needed `community_visible` to hide them.
2. **RECOMMENDED:** `partner_id` nullable + a `sender_scope` discriminator
   (`coach` | `vyve`). Member-side surface shows both, labelled honestly.

---

## 7. Open decisions

- **Role model for VYVE PTs.** A build-only role that reaches libraries and
  programmes but not billing, GDPR or the audit log. `admin-member-edit` already
  understands `viewer` and `coach_exercise` — extend rather than invent.
- **Member-facing notification inbox** — build it, or route plan-change alerts to
  push only? Gates §6.2.
- **Widening the 21-field allowlist** — which of the 142 columns actually need
  editing? Needs a pass with Dean; each one needs a validator.
- **Lewis copy** on any member-facing notification and message copy.

---

## 8. Wave plan (estimates are Claude-assisted sessions)

| Wave | Content | Est. |
|---|---|---|
| **W0** | Shell + Members list + member detail (Overview/Logs) on existing EFs. Proves the shape end to end. | 1–1.5 |
| **W1** | Habits + Goals + Nutrition tabs. Closes the original "fix my habits" need. | 1 |
| **W2** | Workouts/Plans tab + programme assignment to one member. | 1–1.5 |
| **W3** | Shared builders lifted out of coach-portal: exercise library, programme builder. Both surfaces on one copy. | 2 |
| **W4** | **Tags + batch assign**, shipped to BOTH surfaces. | 1.5 |
| **W5** | Plan-change notification (push + in-app) + member inbox if agreed. Member-facing: Lewis copy + OTA. | 1–1.5 |
| **W6** | Messages VYVE-side (`sender_scope`), Admin tab, role model for PTs. | 1.5 |

**Total ≈ 9–11 sessions.** W0–W2 alone (≈3.5) restore everything admin-console did
and close the immediate need; everything after is new capability.

Dean device check between waves, dark theme first — the pattern that worked for the
design-system waves.
