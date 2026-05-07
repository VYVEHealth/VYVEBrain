# `gdpr-erase-request` + `gdpr-erase-execute` EFs — Flow Mockup

**Status:** Mockup v2. Awaiting Dean sign-off before any code or schema lands.
**Last updated:** 07 May 2026 PM-3 (revised from v1 to add typed-email destructive-action confirmation gate per Dean's call; standard pattern from GitHub repo deletion / Stripe account closure / AWS S3 bucket deletion).

---

## Purpose

Article 17 GDPR right of erasure. Two-phase to allow accidental-request recovery and match industry practice (30-day grace period). Procurement blocker for Sage. Currently the privacy policy directs members to email `team@vyvehealth.co.uk` for erasure; this mockup replaces the manual flow with a programmatic one.

## Flow

1. **Request** — Member taps "Delete my account" in `settings.html` (or admin clicks "Erase member" in admin UI). Confirmation modal. On confirm, EF `gdpr-erase-request` writes a row to a new `gdpr_erasure_requests` table with `scheduled_for = now() + interval '30 days'` and sends a Brevo email with a "this wasn't me, cancel" token-link.
2. **Grace period (30 days)** — The row sits with `executed_at IS NULL`. The member can hit the cancel link to cancel; cancel writes `cancelled_at` and `cancellation_reason`. Account remains fully active — they can log in, use the app, etc.
3. **Execute** — Cron `vyve-gdpr-erase-daily` (03:00 UTC daily) calls `gdpr-erase-execute`. Selects rows where `scheduled_for <= now() AND executed_at IS NULL AND cancelled_at IS NULL`. For each, walks the table list in dependency order, with triggers temporarily disabled, then deletes from `auth.users` last. Writes a final receipt row to `admin_audit_log`.

## New table: `gdpr_erasure_requests`

```sql
CREATE TABLE public.gdpr_erasure_requests (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_email    text NOT NULL,
  requested_at    timestamptz NOT NULL DEFAULT now(),
  requested_by    text NOT NULL,                  -- member-self email or admin email
  request_kind    text NOT NULL CHECK (request_kind IN ('member_self','admin')),
  reason          text,                            -- optional, free-text
  scheduled_for   timestamptz NOT NULL,           -- requested_at + 30 days
  cancel_token    text NOT NULL UNIQUE,           -- hex(32) for the cancel link
  cancelled_at    timestamptz,
  cancelled_by    text,
  cancellation_reason text,
  executed_at     timestamptz,                    -- when the cron actually ran the purge
  execution_summary jsonb,                         -- per-table delete counts, errors, duration
  stripe_handled  boolean NOT NULL DEFAULT false, -- did execute path successfully cancel any active subscription
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- One pending request per email (cannot stack erasures while one is in-flight)
CREATE UNIQUE INDEX gdpr_erasure_requests_pending_unique
  ON public.gdpr_erasure_requests (member_email)
  WHERE executed_at IS NULL AND cancelled_at IS NULL;

CREATE INDEX gdpr_erasure_requests_due
  ON public.gdpr_erasure_requests (scheduled_for)
  WHERE executed_at IS NULL AND cancelled_at IS NULL;

-- RLS: service-role-only. Member doesn't query this table; their UI just tells them
-- "an erasure has been scheduled" and the Brevo email is the only surface.
ALTER TABLE public.gdpr_erasure_requests ENABLE ROW LEVEL SECURITY;
-- No policies = service-role only.
```

## EF #1: `gdpr-erase-request`

`POST /functions/v1/gdpr-erase-request` — `verify_jwt: true`.

**Body:** `{ "reason": "<optional free text>" }` (member-self) OR `{ "target_email": "<email>", "reason": "..." }` (admin path; rejects if requester isn't in `admin_users`).

**Process:**
1. Resolve subject email (member-self from JWT, admin from body + admin check).
2. Check for existing pending request — if `gdpr_erasure_requests` already has a row for this email with `executed_at IS NULL AND cancelled_at IS NULL`, return 409 `{ "error": "already_pending", "scheduled_for": "<existing>" }`.
3. Generate `cancel_token = crypto.getRandomValues(32 bytes).toHex()`.
4. Insert row.
5. Send Brevo email via `send-email` EF — subject "VYVE Health: account deletion scheduled". Body includes the scheduled date, a one-click cancel link `https://online.vyvehealth.co.uk/gdpr-erasure-cancel.html?token=<cancel_token>`, and a plain-English explanation.
6. Write receipt to `admin_audit_log` action `gdpr_erase_requested`.
7. Return 202 `{ "success": true, "scheduled_for": "...", "id": "..." }`.

**Cancel surface:** new tiny portal page `gdpr-erasure-cancel.html` (not in nav, not gated by Auth — it has the token). Reads `?token=...`, calls a `gdpr-erase-cancel` EF (verify_jwt: false; auth via the token only), shows "Cancelled — your account is safe" confirmation. The cancel EF writes `cancelled_at`, `cancelled_by` (or 'token_self_cancel'), `cancellation_reason: 'token_link'`. One additional Brevo email confirms cancellation.

## EF #2: `gdpr-erase-execute`

`POST /functions/v1/gdpr-erase-execute` — `verify_jwt: false`, secret-bearer check (only the cron's bearer should hit this). Same pattern as the existing cron-only EFs.

**Cron:** `vyve-gdpr-erase-daily` schedule `0 3 * * *`. (Daily at 03:00 UTC; 1-day max purge latency from scheduled date.)

**Process:**
1. Select all due rows: `executed_at IS NULL AND cancelled_at IS NULL AND scheduled_for <= now()`.
2. For each row, run the **purge sequence** (below) in a single function call. Even if one fails, continue to the next subject — failures get logged but don't block the cohort.
3. On success, `UPDATE gdpr_erasure_requests SET executed_at = now(), execution_summary = $1 WHERE id = $2`.
4. On failure, write a `platform_alerts` row with severity `gdpr_erase_failed` for staff investigation. Don't mark `executed_at` — cron will retry tomorrow.

## Purge sequence (per subject)

This is the contentious bit. The brief said "kill triggers, walk children first, parent last". Refining based on actual schema inspection (07 May 2026):

### Step 1: Pre-flight — Stripe
If `members.subscription_status = 'active'` and `members.stripe_customer_id IS NOT NULL`:
- Call Stripe API to cancel any active subscription **and delete the Customer object** (a full delete, not just unsubscribe — GDPR Article 17 requires it).
- Mark `gdpr_erasure_requests.stripe_handled = true` once confirmed.
- Failure here aborts the purge. We don't want to delete the member from VYVE while they still have an active Stripe Customer associated. (Unless Stripe returns 404 — already-deleted is success.)

### Step 2: Disable triggers
Disable the triggers that would react to source-row deletes and either (a) try to refresh derived state for an about-to-disappear subject, or (b) write new audit rows during the purge:

```sql
-- Refresh-state triggers (8 tables)
ALTER TABLE cardio              DISABLE TRIGGER zzz_refresh_home_state;
ALTER TABLE daily_habits        DISABLE TRIGGER zzz_refresh_home_state;
ALTER TABLE replay_views        DISABLE TRIGGER zzz_refresh_home_state;
ALTER TABLE session_views       DISABLE TRIGGER zzz_refresh_home_state;
ALTER TABLE weekly_goals        DISABLE TRIGGER zzz_refresh_home_state;
ALTER TABLE weekly_scores       DISABLE TRIGGER zzz_refresh_home_state;
ALTER TABLE wellbeing_checkins  DISABLE TRIGGER zzz_refresh_home_state;
ALTER TABLE workouts            DISABLE TRIGGER zzz_refresh_home_state;
ALTER TABLE members             DISABLE TRIGGER zzz_refresh_home_state;

-- Activity-log sync triggers (5 tables)
ALTER TABLE cardio              DISABLE TRIGGER zz_sync_activity_log;
ALTER TABLE daily_habits        DISABLE TRIGGER zz_sync_activity_log;
ALTER TABLE monthly_checkins    DISABLE TRIGGER zz_sync_activity_log;
ALTER TABLE replay_views        DISABLE TRIGGER zz_sync_activity_log;
ALTER TABLE session_views       DISABLE TRIGGER zz_sync_activity_log;
ALTER TABLE wellbeing_checkins  DISABLE TRIGGER zz_sync_activity_log;
ALTER TABLE workouts            DISABLE TRIGGER zz_sync_activity_log;

-- Cert count triggers (2 tables)
ALTER TABLE replay_views        DISABLE TRIGGER replay_views_cert_count_trigger;
ALTER TABLE session_views       DISABLE TRIGGER session_views_cert_count_trigger;

-- HealthKit write-back triggers (2 tables)
ALTER TABLE workouts            DISABLE TRIGGER queue_health_write_back_workouts;
ALTER TABLE weight_logs         DISABLE TRIGGER queue_health_write_back_weight;
```

ALTER TABLE ... DISABLE TRIGGER is per-trigger, scoped to the table. Service role can issue these. They're session-level if used as `LOCAL` but ours are persistent across the EF call. **Critical:** these are project-global once issued. Two simultaneous erasure runs (won't happen with daily cron, but for safety) could re-enable mid-other-run. To be safe, the EF should re-enable triggers in a `try/finally` block — `finally` always runs, even if the purge mid-fails.

Alternative considered: `SET session_replication_role = replica` for the duration of the EF (Postgres setting that disables ALL non-replica triggers in the current session). Cleaner — no need to enumerate triggers. Service role can SET this; it's session-scoped (not transaction-scoped); EF should `RESET session_replication_role` on exit. **Going with this** — simpler, atomic, and any new trigger we add later won't need updating in the erasure EF.

### Step 3: Delete from member-data tables (children before parents)

Order matters less without FKs (no cascade), but it still matters for the derived tables — delete the source rows before the derived tables, so any derived-recompute that escaped trigger-disable doesn't re-aggregate stale data.

```
-- Round 1: derived / aggregated state (delete first to avoid recompute)
DELETE FROM member_home_state, member_stats, member_activity_daily, member_activity_log,
            member_achievements, certificates
WHERE member_email = $1;

-- Round 2: comms metadata
DELETE FROM engagement_emails, member_notifications, scheduled_pushes,
            push_subscriptions, push_subscriptions_native
WHERE member_email = $1;

-- Round 3: AI + decisions
DELETE FROM ai_interactions, ai_decisions, persona_switches WHERE member_email = $1;

-- Round 4: chat + qa + alerts
DELETE FROM session_chat, qa_submissions, platform_alerts WHERE member_email = $1;

-- Round 5: nutrition / wellbeing / scores / goals / checkins
DELETE FROM nutrition_logs, nutrition_my_foods, weight_logs,
            wellbeing_checkins, weekly_scores, weekly_goals, monthly_checkins
WHERE member_email = $1;

-- Round 6: strength / exercise / running / habits
DELETE FROM exercise_logs, exercise_notes, exercise_swaps, custom_workouts,
            workout_plan_cache, member_running_plans, member_habits
WHERE member_email = $1;
DELETE FROM shared_workouts WHERE shared_by = $1;

-- Round 7: HealthKit
DELETE FROM member_health_samples, member_health_daily, member_health_write_ledger,
            member_health_connections
WHERE member_email = $1;

-- Round 8: activity sources (these are the trigger targets — disable already done)
DELETE FROM workouts, cardio, session_views, replay_views, daily_habits,
            activity_dedupe
WHERE member_email = $1;

-- Round 9: relationship rows
DELETE FROM employer_members WHERE member_email = $1;

-- Round 10: parent member row
DELETE FROM members WHERE email = $1;

-- Round 11: auth.users (admin API call)
SELECT auth.admin.deleteUser((SELECT id FROM auth.users WHERE email = $1));
```

`member-dashboard` and other EFs reading `member_email` will return 404 / empty for the deleted email going forward, which is correct behaviour.

### Step 4: Re-enable triggers
`RESET session_replication_role` — restores all triggers to their previous state. (If we used per-trigger DISABLE, would need to ENABLE every one. Using `session_replication_role = replica` makes this a one-liner.)

### Step 5: Final receipt
`INSERT INTO admin_audit_log (member_email, action, performed_by, metadata, created_at)` with action `gdpr_erase_executed` and metadata containing per-round delete counts, total duration, Stripe outcome, any errors caught.

## Failure modes

| Mode | Handling |
|---|---|
| Stripe API down | Abort the subject's purge; cron retries tomorrow. `platform_alerts` row written. Don't update `executed_at`. |
| One DELETE round errors (e.g. constraint violation we didn't anticipate) | Catch, log to `execution_summary.errors[]`, continue to next round. At end, if `errors[]` non-empty, **don't** update `executed_at` — let cron retry tomorrow with a fresh attempt. The previous deletes are not reversed (idempotent — running again deletes the remaining rows). |
| `auth.admin.deleteUser` fails | This is the riskiest one — leaves an orphan auth row with no `members` parent. Mitigation: this is the LAST step, and if it fails we set `executed_at = now()` anyway (the personal data is gone) but flag `execution_summary.auth_user_orphaned = true` so a human can clean it up. Personal data has been purged from the public schema regardless. |
| Cron crashes mid-cohort | The next cron sees the same due rows (executed_at still null). Idempotent — re-running deletes any leftover rows but most will be no-ops. |
| Member with active Stripe sub but stripe_customer_id stale | Skip Stripe step (404 from Stripe), continue with purge. Log warning. |
| Member tries to log in during the 30-day grace | Allowed. Their account is fully functional. They can also re-trigger erasure-cancel via UI, or cancel via the email link. |
| Member tries to request erasure during their own grace | 409 with existing scheduled_for (above). |

## Cancel flow

`gdpr-erase-cancel` EF, `verify_jwt: false`, body `{ "token": "<hex>" }`:

1. `SELECT * FROM gdpr_erasure_requests WHERE cancel_token = $1 AND cancelled_at IS NULL AND executed_at IS NULL`. If no row, return 410 `{ "error": "invalid_or_used_token" }`.
2. If `scheduled_for < now()`, the cancellation window is closed (cron may already have run). Return 410. Edge case but possible if cron runs between the link click and EF response.
3. UPDATE the row: `cancelled_at = now()`, `cancelled_by = 'token_self_cancel'`, `cancellation_reason = 'cancelled via email link'`.
4. Send confirmation Brevo email.
5. Receipt to `admin_audit_log` action `gdpr_erase_cancelled`.
6. Return 200.

The cancel page (`gdpr-erasure-cancel.html`) is a tiny static page that calls this EF on load and shows the result. No login required (the token is the auth).

## Surface integration

### Member-facing: `settings.html`

New "Delete my account" row in the same "Privacy & Data" section as the export button (commit 3), placed *below* "Download my data" so the destructive action is the second thing they see after the safer one. The row reads:

```
[Delete my account]
   Permanently delete your account and all associated data. There's a
   30-day grace period during which you can cancel by replying to the
   confirmation email.
```

Click → confirmation modal with **typed-confirmation gate** (industry-standard destructive-action pattern, used by GitHub for repo deletion, Stripe for account closure, AWS for S3 bucket deletion):

```
┌─────────────────────────────────────────────────────────────┐
│  Delete your VYVE Health account                            │
├─────────────────────────────────────────────────────────────┤
│  This will:                                                 │
│   · Schedule the permanent deletion of every record we      │
│     hold about you across our platform                      │
│   · Cancel any active VYVE subscription                     │
│   · Begin a 30-day grace period, during which you can       │
│     cancel by replying to the confirmation email or         │
│     clicking the cancel link inside it                      │
│   · After 30 days: irreversible. We cannot recover your     │
│     data once it's been purged.                             │
│                                                             │
│  This is your right under Article 17 of the UK GDPR.        │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  To confirm, type your email address below:                 │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐   │
│   │ {placeholder: lewisvines@hotmail.com}               │   │
│   └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Reason for leaving (optional):                             │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐   │
│   │                                                     │   │
│   └─────────────────────────────────────────────────────┘   │
│                                                             │
│         [Cancel]              [Schedule deletion]           │
│                                ^^^^^^^^^^^^^^^^^^           │
│                                disabled until typed         │
│                                email matches account        │
└─────────────────────────────────────────────────────────────┘
```

The "Schedule deletion" button is **disabled** until the typed email matches the account's email exactly (case-insensitive trim). The placeholder text shows their email so they don't have to leave the modal to look it up. This kills "I clicked through three modals and oh no" mistakes — the deliberate typing breaks autopilot. The reason field is genuinely optional and stored on `gdpr_erasure_requests.reason` for our own learning (high-volume reasons might point at retention problems).

On confirm → fetch `gdpr-erase-request` → on 202, modal switches to:

```
Your account deletion is scheduled.

We've emailed {email} with a confirmation. The email contains a "this
wasn't me, cancel" link you can click any time in the next 30 days.

After {scheduled_for_date} your data will be permanently deleted and
cannot be recovered.

[Close]
```

The settings page should also surface a persistent banner at the top while a deletion is pending: "Your account is scheduled for deletion on {date}. [Cancel deletion]." Click the cancel button → a smaller confirm-cancel modal ("Cancel the scheduled deletion? Your account will remain active.") → calls the cancel EF. This gives the member two cancel paths (email link + in-app banner) which is the right shape for a destructive action with a 30-day window.

### Cancel-link page: `gdpr-erasure-cancel.html`

New portal page, NOT in nav, NOT Auth-gated (the token in the URL is the auth). Reads `?token=<hex>`, calls `gdpr-erase-cancel` EF on load, shows one of three states:

- **Token valid + cancellation succeeded:** "Your account is safe. The scheduled deletion has been cancelled. You can keep using VYVE as normal."
- **Token expired/used/invalid:** "This cancellation link has expired or been used. If you didn't intend to delete your account, please email team@vyvehealth.co.uk urgently — we have a 30-day grace period and can stop the deletion if it hasn't yet executed."
- **Token valid but `scheduled_for < now()` (cron may have already run):** Same as above, plus "Your account may have already been deleted. Email us immediately and we'll check."

### Admin UI

Out of scope for this commit. Lewis can use Supabase Studio + a manual REST call to `gdpr-erase-request` with `target_email` if he ever needs to erase someone for procurement/support. Build the admin button in a future commit. **Critical:** the admin path bypasses the typed-email confirmation gate (an admin acting on behalf of a member can't type the *member's* email convincingly without it being weird), so the admin EF call is the un-friction'd path. That's correct — Lewis is the safety check on his own actions, the typed-confirm is for the member.

## What this mockup is NOT covering

- **Backups** — Supabase Pro has automatic daily backups for 7 days. Erased rows will be in those backups for up to 7 days post-erasure. Industry-standard practice; ICO accepts this. Will document in security_questionnaire.md.
- **Email metadata at Brevo** — Brevo retains the engagement_emails sends in their own analytics. We'd need to add a Brevo contact-delete API call to fully purge. Putting in backlog as commit 4 follow-up.
- **PostHog events** — same. PostHog has a delete-by-email API. Backlog.
- **HubSpot contact** — same, but HubSpot is for prospects, not members; unlikely to overlap. Backlog.
- **IP / device logs in Supabase platform** — outside our app schema, retained by Supabase per their policy. Document in DPA.

## Estimated build (Claude-assisted)

- Migration for `gdpr_erasure_requests` + indexes + RLS: ~30 min
- `gdpr-erase-request` EF (member-self + admin paths, Brevo template, audit row): ~1 hour
- `gdpr-erase-cancel` EF (token check, update, Brevo confirm, audit): ~30 min
- `gdpr-erase-execute` EF (Stripe call, session_replication_role, 11 delete rounds, receipt): ~2 hours
- Cron registration: ~10 min
- Brevo template (Lewis copy approval): ~30 min coding, blocked on Lewis copy
- `settings.html` + `gdpr-erasure-cancel.html` (mockup-first per Dean's rule): ~1 hour
- Tests (manual + targeted unit): ~1 hour

Total: ~6 hours, single session, two EF deploys + one schema migration + portal HTML changes (cache bump). Tight but feasible; if it spills, the request EF + cancel EF + table can ship in one session and the execute EF can ship in a second.

## Open questions for Dean

1. **Stripe Customer delete vs cancel-only.** Per Article 17, full Customer delete is the right answer. Confirm this is what we want — it means re-subscribing in future requires a fresh Stripe Customer. (Reasonable; they're a fresh GDPR member anyway.)
2. **Re-enable trigger pattern.** `session_replication_role = replica` is the recommended approach (one-liner, atomic, future-proof). Per-trigger DISABLE/ENABLE is the alternative. Confirm `replica` mode is acceptable.
3. **Cancel-link UX.** Plain HTML page with token-in-querystring is the proposal. Acceptable, or want it gated by Auth? (Auth-gated means the member must log in to cancel, which is annoying if they're cancelling because they got the email and weren't expecting it. Token-only is the standard pattern.)
4. **Lewis copy approval** — request email + cancel email + cancel-confirmation email = 3 Brevo templates needed. He'll want to write these.
5. **Settings UI scope confirmed in this revision.** "Delete my account" button + typed-email-confirmation modal + persistent in-app cancel banner all in `settings.html`, plus the `gdpr-erasure-cancel.html` standalone page. Adds a SW cache bump and an incognito test cycle, same as commit 2 shipped last session. Build estimate updated to reflect this (Settings UI was already in the v1 estimate; the typed-confirm gate adds maybe 10 minutes of JS to disable/enable the button on input change). No further sign-off needed unless you want different copy.
6. **Backlog or commit 4? Brevo contact-delete + PostHog event-delete API calls** during execute path. Could roll into commit 4 (~30 extra min each, both have well-documented APIs) or defer. Lean: roll in. Procurement reviewers see an end-to-end purge that handles the third-party processors, which is the gold standard.
