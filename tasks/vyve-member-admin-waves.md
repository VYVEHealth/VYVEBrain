# VYVE Member Admin — wave briefs

**Companion to:** `tasks/vyve-member-admin-spec.md` (design, verdicts, architecture)
**Status:** briefs written 2026-09-04 (PM-1025). None started.
**How to use:** Dean says "load the brain, start wave N". Load `brain/master.md` →
`brain/changelog.md` → `tasks/backlog.md`, then read the spec, then the brief below.
The brief is the task; the spec is the reasoning behind it. **The brain wins over
both.**

---

## GATE AFTER W2 — READ THIS BEFORE PROPOSING W3

W0–W2 (~3.5 sessions) restore everything `admin-console.html` did and close the
stated need ("a member says their habits are wrong and I need to fix them").
**Dean's standing decision: stop there and reassess.** At spec time the platform had
95 members, 74 on trial and **zero** paying — the trial wall matters more than the
admin surface. Do not roll into W3 without Dean saying so.

---

## RULES FOR EVERY WAVE

These are not optional and are not repeated per wave.

- **The brain wins** over the spec, these briefs, memory and chat history. Live
  Supabase wins over the brain for counts, EF versions and schema.
- **Talk-first for anything production-affecting**; surgical patches need a one-line
  summary. Once direction is confirmed, execute end to end including commit, deploy,
  verify and brain update.
- **Mock-up first for UI**: never ship a new portal surface without an approved
  mockup. The benchmark is `coach-portal.html`; match it, do not approximate it.
- **GitHub writes via the Vault PAT and the Git Data API only.** §23.21 fresh-HEAD,
  §23.22 per-file drift check against the pinned base, §23.30 md5-perfect
  verification of every file at the commit SHA — never `ref=branch`, never
  first-N-chars. §23.210: retry a single mismatch before treating it as failure.
- **Claim the PM number fresh at commit time** by scanning live commit messages
  across all four repos (§23.24/23.25). Run the §23.23 session-start collision scan
  on the last 15 CC commits first.
- **CC is Cloudflare Pages** — no vbb or service-worker ritual. Bump `?v=` on any
  linked asset you touch, in the same commit, in every file that links it (§23.207).
  Page fragments are fetched `cache:'no-cache'` and need no bump. **You cannot reach
  the Cloudflare API from the sandbox — say so rather than claiming a deploy check.**
- **Soft-kill only.** Never delete a file.
- **Assert every anchor before patching.** `node --check` every inline script you
  touch. Prove the selector set unchanged either side of any CSS rewrite. Verify
  column names and constraints against live Supabase before writing EF code.
- **Every EF deploy is unverified until re-fetched or invoked** (§23.200). Use
  `Supabase:deploy_edge_function` only; pass `verify_jwt` explicitly (§23.165).
- **Commit in batches**, grouped so a regression on Dean's phone reverts one group
  not the session. Tell him the grouping before starting.
- **Close every session** with the atomic VYVEBrain sync — changelog prepended,
  master and backlog patched, new gotchas earning a §23 rule — plus a plain list of
  what to check on phone and desktop, **dark theme first**.

### Traps that apply to this whole programme

- This surface writes **directly** to `members`, `workout_plan_cache` and
  `member_habits` for all 95 members. The coach portal, at worst, damages one
  consented client. Behave accordingly.
- `admin-member-edit` allowlists **21 of 142 columns** deliberately. Widening it
  means adding a validator per field, never a blanket update.
- Coaches must **never** see: billing, trial clocks, attribution, persona,
  re-engagement streams, GDPR actions, certificates, push subscriptions, audit log.
- §23.214: RLS policies OR. An admin `ALL` policy widens every read for staff, so a
  staff account is not a valid test of what a member sees.

---

## W0 — Shell + Members list + member detail (Overview, Logs)

**Est. 1–1.5 sessions.** Base: CC HEAD at session start.

Build the surface and prove the shape end to end on EFs that already work.

**In scope:** a new CC page (`pages/member-admin.html`) on the coach-portal layout —
sidebar, member list with search, member detail workspace with a tab bar. Two tabs
live: **Overview** (profile fields via `admin-member-edit`, respecting its SAFE/SCARY
split and reason modal) and **Logs** (activity timeline). Members list is **all 95**,
no consent link, no `is_coach_of`.

**Explicitly out:** every other tab, every library, batch assign, tags, messages.

**Already decided, do not re-litigate:** this is a new surface, not a fork of
`coach-portal.html` and not a restore of `admin-console.html`. Both stay soft-killed.

**Traps:** `admin-member-edit` is `verify_jwt:false` at the gateway with in-code JWT
verification — that is correct, do not "fix" it. Its CORS allowlist already includes
`admin.vyvehealth.co.uk`. Call `field_schema` to build the edit controls rather than
hardcoding the enums; the EF is the source of truth for what is editable.

**Dean checks:** member list loads and searches, open a member, edit a SAFE field,
edit a SCARY field and see the reason modal, confirm the change lands in the audit
log.

---

## W1 — Habits, Goals, Nutrition tabs

**Est. 1 session.** Base: W0 shipped and device-checked.

**This wave closes the original need.** Habits first — it is the thing Dean actually
asked for.

**In scope:** **Habits** tab (assignment picker over the 38-row `habit_library`
against `member_habits`, via `admin-member-habits`) · **Goals** tab (via
`admin-member-weekly-goals`) · **Nutrition** tab (TDEE, macros, deficit — live
columns on `members`, which means widening the allowlist; `tdee_target` and
`deficit_percentage` are already SCARY fields).

**Explicitly out:** a habit *form builder*. Dean's call — VYVE assigns from the
library, it does not author habit forms. Same for check-in forms.

**Traps:** `member_habits` carries 472 live rows against real members; a bad write is
visible in the app immediately. `habit_library` rows created by coaches are
`active=false, created_by='coach:<pid>'` — filter those out of the VYVE picker or
staff will assign a coach's private habit to a stranger.

**Dean checks:** fix a member's habits end to end and confirm it changes in the app.

---

## W2 — Workouts / Plans tab, single-member assignment

**Est. 1–1.5 sessions.** Base: W1 shipped and device-checked.

**In scope:** **Workouts** and **Plans** tabs — view a member's current programme
from `workout_plan_cache`, browse the programme library via
`admin-programme-library`, assign a programme to **one** member via
`admin-member-programme`.

**Explicitly out:** batch assign (W4), the shared builder lift (W3), authoring new
programmes.

**Traps:** `workout_plan_cache` holds 89 live member programmes as JSONB against the
live `programme_json` contract. Read the contract from a real row before writing —
the member app renders it directly and a shape error breaks their Workouts tab.
Reassignment overwrites; decide with Dean whether the old programme is preserved.

**Dean checks:** view a real programme, assign a different one, confirm the member
app renders it.

### ⛔ STOP HERE unless Dean says otherwise. See the gate at the top.

---

## W3 — Lift the shared builders out of coach-portal

**Est. 2 sessions.** Base: W2 shipped, **and Dean has cleared the gate.**

The wave that produces **no visible feature** and is therefore the one that gets
skipped. If it is skipped, the 536KB duplication happens anyway and the architecture
in the spec was never bought. **Do it before W4, or not at all.**

**In scope:** extract the exercise library and the workout/programme builder from
`coach-portal.html` into shared components both surfaces consume. The exercise
library already carries a `vyve` / `mine` / `all` scope selector — the idea is
half-built; finish it rather than reinventing.

**Traps:** `coach-portal.html` is 536KB with shadowed functions (`viewClient`,
`calLoad`, `go` — the bottom definitions are the live ones). Read §23.204 before
blaming any layout fault on the extraction: inline styles set by JS and `#id *`
resets have bitten this class of work twice. **Revert to known-good bytes first and
diagnose second** if a live staff surface breaks.

**Dean checks:** the coach portal must behave **identically** afterwards. That is the
whole test. Calum uses it.

---

## W4 — Tags + batch assign (BOTH surfaces)

**Est. 1.5 sessions.** Base: W3 shipped.

The headline feature. Promoted to shared at Dean's instruction — coaches get it too.

**In scope:** `member_tags` table (per the spec: table not array; unique on
`member_email, lower(tag)`; **registered in `gdpr_table_policy` as `purge` at
creation**). Tag management on the member detail. Cohort picker: multi-select by
**name**, by **email**, or by **tag**. Batch assignment of a programme to the cohort.

**Non-negotiable, all three:**
1. **Dry-run preview** listing exactly who is about to change, before anything writes.
2. **One `admin_audit_log` row per member**, never one for the batch — a half-failed
   batch must be readable afterwards.
3. Report per-member success and failure honestly; never a single "done".

**Ask Dean before building:** whether a batch is reversible, and what that means.

**Traps:** this is the largest blast radius in the platform. Fifty members' programmes
rewritten overnight is visible to fifty people in their app the next morning.

**Dean checks:** tag some members, run a dry run, confirm the list is right, run it,
spot-check two members in the app.

---

## W5 — Plan-change notification + member inbox (MEMBER-FACING)

**Est. 1–1.5 sessions.** Base: W4 shipped. **The only wave with an external
dependency — treat it as its own thing.**

**Read this first:** `member_notifications` is referenced in exactly ONE place in the
member app (`wellbeing-checkin.html`). There is **no in-app inbox for a member to
read**. Writing notifications before the inbox exists sends them nowhere.

`coach-messages.html` DOES exist in the member app and works — the recommended route
is extending it into a general inbox carrying both messages and notifications, rather
than building a second surface. Confirm with Dean before choosing.

**In scope:** the member inbox, then plan-change notification via push
(`scheduled_pushes`) and in-app (`member_notifications`), wired on **both** surfaces.

**Already established:** the email half exists — `coach_automations` has zero rows
*by design* (built-in default-on templates) and `coach-provision-client` v7 already
diffs assignment slots and emails on change. Extend it; do not rebuild it.

**Gates:** member-facing, so **Lewis copy pass** on every string, and it needs an
**OTA push** (vbb marker +1 in `index.html` AND `settings.html` AND the `sw.js`
CACHE_NAME, same commit).

**Dean checks:** change a plan, receive the push, open the app, read it in the inbox.

---

## W6 — Messages VYVE-side, Admin tab, PT role model

**Est. 1.5 sessions.** Base: W5 shipped.

**In scope:** (a) VYVE-side messaging — `coach_messages.partner_id` nullable plus a
`sender_scope` discriminator (`coach` | `vyve`). **Do not create a VYVE partner row**;
it leaks into payout queries, roster counts and Discover, exactly as the four bare
referral placeholders did. (b) The **Admin tab**: billing and trial state,
attribution, persona, re-engagement stream, certificates, push subscriptions, GDPR
actions, audit log — all role-gated. (c) A **build-only role** for VYVE's own PTs
that reaches libraries and programmes but not billing, GDPR or the audit log —
`admin-member-edit` already understands `viewer` and `coach_exercise`; extend rather
than invent.

**Before starting:** run the PM-1003 fallback grep across the remaining legacy EFs.
Widening staff write access is the wrong moment to still be carrying unauthenticated
`?email=` holes.

**Dean checks:** message a member and read it in the app; confirm a build-only role
genuinely cannot reach billing or GDPR.
