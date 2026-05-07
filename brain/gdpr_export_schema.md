# `gdpr-export` EF — Schema & Flow Mockup

**Status:** Mockup. Awaiting Dean sign-off before code lands.
**Last updated:** 07 May 2026 PM (security commit 2 spillover).

---

## Purpose

Article 15 GDPR right of access — programmatic export of every piece of member data VYVE holds about a single subject. Replaces the current manual `team@vyvehealth.co.uk` flow documented in the privacy policy. Procurement blocker for Sage and any other enterprise prospect with a security questionnaire.

## Endpoints (single EF, two paths)

`POST /functions/v1/gdpr-export` with `verify_jwt: true`. The request body switches between member-self and admin paths:

**Member-self export.** Requesting member exports their own data. Body: `{}` (empty). Target email is taken from the JWT's `auth.email()`. No additional check — every authenticated member can export their own data on demand.

**Admin export.** Body: `{ "target_email": "<email>" }`. EF reads JWT, looks up the requester in `admin_users`, requires the requester's role to be `admin`. If admin, exports the target. If not admin, returns 403. Lewis Vines is the only admin today (per the security questionnaire pattern).

Rate limit: 1 export per member per hour (cheap heuristic — query `admin_audit_log` for `gdpr_export` rows by this requester in last hour, refuse if any). Mostly to prevent accidental double-clicks; not a real abuse vector.

## Output

A single signed-URL JSON file written to Supabase Storage `gdpr-exports/{target_email}/{ISO-8601-timestamp}.json`, signed with 7-day expiry. EF response body is `{ "success": true, "url": "<signed_url>", "expires_at": "<ISO>", "file_path": "gdpr-exports/...", "size_bytes": N, "tables_included": M }`.

The signed URL is the deliverable. The member or admin downloads it once and the file expires after 7 days. After expiry, the bucket file remains (audit trail) but the URL is dead — re-signing requires a fresh export call.

Bucket policy: bucket `gdpr-exports` is service-role-write-only. No public read, no authenticated read. Only signed URLs work. Bucket lifecycle rule: delete files older than 90 days (we don't need to retain export blobs forever; the audit log entry is the durable record).

## JSON shape

```json
{
  "_meta": {
    "schema_version": "1.0",
    "generated_at": "2026-05-07T01:33:54.193Z",
    "subject_email": "lewisvines@hotmail.com",
    "exported_by": "lewisvines@hotmail.com",
    "export_kind": "member_self",
    "tables_included": 39,
    "tables_excluded": [
      { "table": "running_plan_cache", "reason": "shared_parametric_cache_no_subject_attribution" }
    ],
    "vyve_legal_entity": "VYVE Health CIC",
    "ico_registration": "00013608608",
    "contact": "team@vyvehealth.co.uk"
  },
  "_readme": "Plain-English explanation of what each section contains, how to interpret derived/cache tables, and which categories of data are NOT in this export and why. (See README block below for full text.)",
  "members": { /* single row, the canonical profile */ },
  "auth_user": {
    "id": "...",
    "email": "...",
    "created_at": "...",
    "last_sign_in_at": "...",
    "user_metadata": { ... }
  },
  "daily_habits": [ /* array of rows */ ],
  "workouts": [ ... ],
  "cardio": [ ... ],
  "session_views": [ ... ],
  "replay_views": [ ... ],
  "wellbeing_checkins": [ ... ],
  "weekly_scores": [ ... ],
  "weekly_goals": [ ... ],
  "monthly_checkins": [ ... ],
  "nutrition_logs": [ ... ],
  "nutrition_my_foods": [ ... ],
  "weight_logs": [ ... ],
  "exercise_logs": [ ... ],
  "exercise_notes": [ ... ],
  "exercise_swaps": [ ... ],
  "custom_workouts": [ ... ],
  "shared_workouts": [ /* matched on shared_by = subject email */ ],

  "certificates": [ ... ],
  "member_achievements": [ ... ],
  "member_health_connections": [ ... ],
  "member_health_daily": [ ... ],
  "member_health_samples": [ ... ],
  "member_health_write_ledger": [ ... ],
  "member_home_state": { /* single row */ },
  "member_stats": { /* single row */ },
  "member_running_plans": [ ... ],
  "member_habits": [ ... ],
  "member_activity_daily": [ ... ],
  "member_activity_log": [ ... ],
  "persona_switches": [ ... ],
  "engagement_emails": [ ... ],
  "member_notifications": [ ... ],
  "scheduled_pushes": [ ... ],
  "push_subscriptions": [ ... ],
  "push_subscriptions_native": [ ... ],
  "session_chat": [ /* member's own chat messages — see README note */ ],
  "platform_alerts": [ ... ],
  "qa_submissions": [ ... ],
  "ai_interactions": [ ... ],
  "ai_decisions": [ ... ],
  "employer_members": [ /* relationship rows */ ],
  "activity_dedupe": [ /* over-cap inserts — kept for completeness */ ]
}
```

## Table coverage matrix (39 included)

| Category | Tables | Source pattern |
|---|---|---|
| **Identity & profile** | `members`, `auth.users` (via admin API) | `email` / `id` join |
| **Daily activity** | `daily_habits`, `workouts`, `cardio`, `session_views`, `replay_views`, `activity_dedupe` | `member_email = subject` |
| **Wellbeing** | `wellbeing_checkins`, `weekly_scores`, `weekly_goals`, `monthly_checkins` | `member_email = subject` |
| **Nutrition** | `nutrition_logs`, `nutrition_my_foods`, `weight_logs` | `member_email = subject` |
| **Strength & exercise** | `exercise_logs`, `exercise_notes`, `exercise_swaps`, `custom_workouts`, `workout_plan_cache`, `shared_workouts` | `member_email` (or `shared_by` for shared_workouts) |
| **Achievements & certs** | `certificates`, `member_achievements` | `member_email = subject` |
| **HealthKit / wearables** | `member_health_connections`, `member_health_daily`, `member_health_samples`, `member_health_write_ledger` | `member_email = subject` |
| **Derived state** | `member_home_state` (single row), `member_stats` (single row), `member_activity_daily`, `member_activity_log`, `member_running_plans`, `member_habits` | `member_email = subject` |
| **AI & coaching** | `ai_interactions`, `ai_decisions`, `persona_switches` | `member_email = subject` |
| **Comms & engagement** | `engagement_emails`, `member_notifications`, `scheduled_pushes`, `push_subscriptions`, `push_subscriptions_native` | `member_email = subject` |
| **Other** | `session_chat`, `platform_alerts`, `qa_submissions`, `employer_members` | `member_email = subject` |

## Tables excluded and why

- `running_plan_cache` — shared parametric output cache keyed on `cache_key`, no `member_email` column. We cannot identify which rows the subject's parameters generated. Their personal saved running plans are exported via `member_running_plans` (which DOES have `member_email`).
- `personas`, `habit_library`, `habit_themes`, `knowledge_base`, `nutrition_common_foods`, `service_catalogue`, `workout_plans` — reference data, not member data.
- `admin_users`, `admin_audit_log` — staff-only audit data. The audit log entry created BY this export will be visible to staff/admin only; it is not exported back to the subject (Article 15 covers personal data, not procedural metadata about who accessed it).
- `cc_*` (16 tables) — Cowork operational data, internal to VYVE staff, not member data.
- `gdpr_erasure_requests` (commit 4) — process metadata, not member content.

## README text (embedded in export)

```
This file is your VYVE Health data export under Article 15 of the UK GDPR.

WHAT'S INCLUDED
This export contains every record VYVE Health CIC holds against your email
address ({subject_email}) across our platform tables. Each top-level key
corresponds to one database table; the value is either a single object (for
one-row-per-member tables like your profile) or an array of rows.

UNDERSTANDING DERIVED DATA
Some sections (member_home_state, member_stats, member_activity_daily) are
derived counters and aggregates computed from your raw activity. Deleting your
account purges both the source and derived rows; this export shows both for
completeness.

WHAT'S NOT INCLUDED
- Reference / library data (workout templates, habit themes, nutrition database)
  is not personal data and is not included.
- Shared resources (running plan templates) where multiple members hit the same
  cached output cannot be attributed to any single member; we have noted this
  exclusion in _meta.tables_excluded.
- Live session chat messages from OTHER members are not included — only your own
  messages. Note: chat sent in a live session was visible to all session attendees
  at the time. The same applies to any custom workouts you shared (in
  shared_workouts).
- Internal staff audit logs are not included; they record who accessed your data,
  not your data itself.

YOUR RIGHTS
You can request correction (Article 16) or erasure (Article 17) of any of this
data by emailing team@vyvehealth.co.uk. Erasure has a 30-day grace period before
permanent deletion, during which you can cancel by replying to the confirmation
email.

VYVE Health CIC · ICO Registration: 00013608608
```

## Receipt to `admin_audit_log`

After successful upload to Storage and signed-URL generation, write one row:

```sql
INSERT INTO admin_audit_log (
  member_email,        -- subject of the export (target_email)
  action,              -- 'gdpr_export'
  performed_by,        -- requesting admin or member email
  metadata,            -- jsonb: { kind, file_path, size_bytes, tables_included, signed_url_expires_at, requester_role }
  created_at           -- now()
)
VALUES (...);
```

`kind` is `member_self` or `admin`. The signed URL itself is NOT stored in the audit log (security — it's a credential, not metadata). Only the path and expiry.

## EF skeleton (deferred to implementation phase)

```typescript
// VYVE Health — gdpr-export v1
// verify_jwt: true at platform level.
// Single endpoint, two paths: member-self and admin.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const TABLES_MEMBER_SCOPED = [
  "daily_habits", "workouts", "cardio", "session_views", "replay_views",
  "wellbeing_checkins", "weekly_scores", "weekly_goals", "monthly_checkins",
  "nutrition_logs", "nutrition_my_foods", "weight_logs",
  "exercise_logs", "exercise_notes", "exercise_swaps", "custom_workouts",
  "workout_plan_cache",
  "certificates", "member_achievements",
  "member_health_connections", "member_health_daily", "member_health_samples",
  "member_health_write_ledger",
  "member_activity_daily", "member_activity_log",
  "member_running_plans", "member_habits",
  "persona_switches",
  "engagement_emails", "member_notifications", "scheduled_pushes",
  "push_subscriptions", "push_subscriptions_native",
  "session_chat", "platform_alerts", "qa_submissions",
  "ai_interactions", "ai_decisions",
  "employer_members", "activity_dedupe"
];
const TABLES_SINGLE_ROW = [ "members", "member_home_state", "member_stats" ];
const TABLE_SHARED_BY = "shared_workouts"; // uses shared_by, not member_email

async function buildExport(supabaseSvc, subject_email) {
  const out = { _meta: { ... }, _readme: README_TEXT };
  // Single-row tables
  for (const t of TABLES_SINGLE_ROW) {
    const col = (t === "members") ? "email" : "member_email";
    const { data } = await supabaseSvc.from(t).select("*").eq(col, subject_email).maybeSingle();
    out[t] = data;
  }
  // Multi-row member-scoped tables (parallel batches of 10)
  // .in() cap is 1000 rows per query — irrelevant here, single subject
  const batches = chunk(TABLES_MEMBER_SCOPED, 10);
  for (const b of batches) {
    const results = await Promise.all(
      b.map(t => supabaseSvc.from(t).select("*").eq("member_email", subject_email).order("created_at", { ascending: true, nullsFirst: false }))
    );
    b.forEach((t, i) => out[t] = results[i].data || []);
  }
  // shared_workouts (different col)
  const { data: sw } = await supabaseSvc.from(TABLE_SHARED_BY).select("*").eq("shared_by", subject_email);
  out["shared_workouts"] = sw || [];
  // auth.users via admin API
  const { data: { user } } = await supabaseSvc.auth.admin.getUserByEmail(subject_email);
  out["auth_user"] = user ? sanitiseAuthUser(user) : null;
  return out;
}

// Upload to Storage + sign URL + write audit + return URL
```

The `auth.users` row needs sanitising — strip `confirmation_token`, `recovery_token`, `email_change_token_current`, `phone_change_token`, etc. Subject doesn't need their own auth tokens; admin definitely shouldn't see another member's. Whitelist approach: include `id`, `email`, `created_at`, `updated_at`, `last_sign_in_at`, `email_confirmed_at`, `user_metadata`, `app_metadata`. Drop everything else.

## Failure modes & handling

| Mode | Handling |
|---|---|
| Subject email doesn't exist in `members` | Return 404 with `{ "error": "subject_not_found" }`. Don't write audit row. |
| Subject email matches but a downstream `.from(t).select(...)` errors | Log to `platform_alerts`, continue with other tables, include `_meta.partial_export: true` and `_meta.errored_tables: [...]` in the JSON. Better to deliver partial than fail entirely. |
| Storage upload fails | Return 500. No audit row (the export didn't actually happen). |
| Signed URL generation fails | Storage object exists but no URL — create new signed URL on retry, or fall back to a 24-hour shorter signing. Audit row created either way (the data WAS written). |
| Member rate-limited | Return 429 with `Retry-After` header pointing at the next-allowed timestamp. |
| Admin requesting non-existent target | 404. Audit row records the failed lookup with `metadata.outcome: "subject_not_found"`. |

## What this mockup is NOT covering

- Stripe data (subscriptions, invoices). Out of scope — Stripe handles its own GDPR exports for their data; we don't proxy it. We could include `stripe_customer_id` as a pointer in `_meta`.
- Brevo data (transactional email content). Out of scope — Brevo holds the email content, we just hold the metadata in `engagement_emails` which IS exported.
- HubSpot data (CRM contact). Out of scope — HubSpot is for prospect / lead data, not member data. If a member is also a HubSpot lead, they need to make a separate request to HubSpot (or to us, which we then forward to HubSpot).
- PostHog analytics events. Currently TODO — PostHog has its own GDPR API. We would need to proxy a delete-by-email call to PostHog as part of the erasure flow (commit 4) but for export, point the subject at PostHog directly.

## Estimated build (Claude-assisted)

- EF core (member-self + admin paths, table walk, sanitisation): ~2 hours
- Storage bucket setup + RLS policy + lifecycle rule: ~30 min
- `admin_audit_log` write + receipt format: ~30 min
- Member-facing trigger surface (settings.html "Export my data" button calling the EF + showing the signed URL): ~1 hour
- Tests via supabase CLI + manual: ~1 hour

Total: ~5 hours, single session, comfortably one EF redeploy budget.

## Open questions for Dean

1. **Storage bucket name** — `gdpr-exports` is the suggestion. Acceptable?
2. **Retention** — 90-day file lifecycle in the bucket. Confirm acceptable for procurement (some shops want 30 days, some 7 years).
3. **Member rate limit** — 1 per hour. Reasonable, or stricter?
4. **`auth.users` sanitisation list** — confirm the whitelist approach above is right for the admin path (member-self path could include all fields since they're already authenticated as that user, but safer to keep one shape for both).
5. **Surface for the member to trigger this** — `settings.html` button is the obvious home. Add a "Download my data" row in the About & Legal block. Confirm scope creep is acceptable in this commit.
