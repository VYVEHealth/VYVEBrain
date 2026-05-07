# `gdpr-export` EF — Schema & Flow Mockup

**Status:** Mockup v2 (async pattern). Awaiting Dean sign-off before code lands.
**Last updated:** 07 May 2026 PM-3 (revised from sync-with-URL to async-with-email after research into industry-standard patterns; Strava and Notion both use async-queue-email; admin-mediated patterns like Slack do not apply to a B2C app like VYVE).

---

## Purpose

Article 15 GDPR right of access — programmatic export of every piece of member data VYVE holds about a single subject. Replaces the current manual `team@vyvehealth.co.uk` flow documented in the privacy policy. Procurement blocker for Sage and any other enterprise prospect with a security questionnaire.

## Industry-pattern alignment

The dominant B2C pattern for GDPR data export — across Strava (closest comparator: consumer health/fitness data), Notion (workspace export), most other consumer SaaS with personal data — is **async with email delivery**, not synchronous with on-screen URL. The flow is: member taps "Download my data" → confirmation modal → request queued → email lands within an hour with a signed-URL link. This pattern delivers three things VYVE wants:

- **Curiosity-click filter.** A button that says "you'll get an email within an hour" gets clicked by people who actually want their data, not by people idly exploring settings. Strava's volume confirms this — they have tens of millions of members and aren't drowning in archive requests.
- **Procurement-recognisable.** Security questionnaires ask "is DSAR fulfilment automated and audit-logged?" — the queue + cron + email pattern is the recognisable industry-standard answer. The reviewer ticks the box without follow-up.
- **Architectural consistency with commit 4.** The erasure flow already uses the same shape (request → grace period → cron → email). Two GDPR EFs that share table-design and email-template patterns are easier to maintain than two with different shapes.

## Endpoints (3 EFs total)

`POST /functions/v1/gdpr-export-request` with `verify_jwt: true` — member-facing, queues the export. Returns 202 immediately.

`POST /functions/v1/gdpr-export-execute` with `verify_jwt: false` (cron-only, secret-bearer check) — runs every 15 minutes, picks up due rows, builds the JSON, uploads to Storage, signs URL, sends Brevo email, marks completion.

`POST /functions/v1/gdpr-export-download` with `verify_jwt: false` (token-link) — optional. The Brevo email could carry the signed URL directly, OR it could carry a token-link to this EF which validates the token and 302s to a fresh signed URL. Token-link is slightly more procurement-friendly (URL not in inbox indefinitely) but also one more EF to maintain. **Recommend the simpler option: signed URL directly in email, 7-day expiry.** If Sage pushes back during procurement we can add the token-link layer later — it's purely a session-attribute hardening, not a security gap.

### Member-self path

Body: `{}` (empty). Target email is taken from the JWT's `auth.email()`. Every authenticated member can request their own export.

### Admin path

Body: `{ "target_email": "<email>" }`. EF looks up the requester in `admin_users`, requires the requester's role to be `admin`. If admin, queues the target's export; the email lands in the *target's* inbox (not the admin's), preserving the principle that the data subject is the one who receives the data. Lewis Vines is the only admin today (per the security questionnaire pattern). For procurement use cases where a reviewer asks for a specific member's data through Lewis, the target member is also notified — this is correct under Article 15, the subject must know their data was accessed.

### Rate limit

1 export per member per 30 days. Implementation: `gdpr-export-request` queries `gdpr_export_requests` for the requester's email and rejects (429 with `Retry-After` header) if the most recent request is less than 30 days old AND has `delivered_at IS NOT NULL` (i.e. successfully completed). A failed/queued-but-not-yet-delivered request doesn't count against the limit — that would let a single failure lock the member out for a month. Admin path is rate-limit-exempt (procurement timelines don't fit a 30-day cooldown).

## New table: `gdpr_export_requests`

```sql
CREATE TABLE public.gdpr_export_requests (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_email    text NOT NULL,                  -- subject
  requested_by    text NOT NULL,                  -- member-self email or admin email
  request_kind    text NOT NULL CHECK (request_kind IN ('member_self','admin')),
  requested_at    timestamptz NOT NULL DEFAULT now(),
  queued_at       timestamptz,                    -- when the cron picked it up
  delivered_at    timestamptz,                    -- when Brevo accepted the email
  failed_at       timestamptz,                    -- if the build/upload/email errored
  failure_reason  text,
  file_path       text,                           -- gdpr-exports/{email}/{timestamp}.json
  signed_url_expires_at timestamptz,
  size_bytes      bigint,
  tables_included int,
  brevo_message_id text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX gdpr_export_requests_pending
  ON public.gdpr_export_requests (requested_at)
  WHERE delivered_at IS NULL AND failed_at IS NULL;

CREATE INDEX gdpr_export_requests_by_member
  ON public.gdpr_export_requests (member_email, requested_at DESC);

ALTER TABLE public.gdpr_export_requests ENABLE ROW LEVEL SECURITY;
-- No policies = service-role only. Members don't query this table directly;
-- the request EF returns "queued" + estimated delivery time, that's all they need.
```

## Output

A single JSON file written to Supabase Storage `gdpr-exports/{target_email}/{ISO-8601-timestamp}.json`, signed with 7-day expiry. The Brevo email contains the signed URL plus a plain-English explainer. Subject line: "Your VYVE Health data export is ready". On expiry, the bucket file remains (audit trail) but the URL is dead — re-signing requires a fresh request through the normal flow (which respects the 30-day rate limit).

Bucket: `gdpr-exports`. Service-role-write-only, no public read, no authenticated read. Only signed URLs work. Lifecycle rule: delete files older than 90 days.

## JSON shape

(unchanged from v1)

```json
{
  "_meta": {
    "schema_version": "1.0",
    "generated_at": "2026-05-07T01:33:54.193Z",
    "subject_email": "lewisvines@hotmail.com",
    "exported_by": "lewisvines@hotmail.com",
    "export_kind": "member_self",
    "request_id": "uuid-from-gdpr_export_requests",
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
  "auth_user": { /* sanitised - see auth.users sanitisation below */ },
  "daily_habits": [ ... ],
  "workouts": [ ... ],
  /* ... 36 other tables, see Table coverage matrix ... */
}
```

## Table coverage matrix (39 included)

(unchanged from v1)

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

(unchanged from v1)

- `running_plan_cache` — shared parametric output cache keyed on `cache_key`, no `member_email` column. Their personal saved running plans are exported via `member_running_plans`.
- `personas`, `habit_library`, `habit_themes`, `knowledge_base`, `nutrition_common_foods`, `service_catalogue`, `workout_plans` — reference data, not member data.
- `admin_users`, `admin_audit_log` — staff-only audit data.
- `cc_*` (16 tables) — Cowork operational data, internal to VYVE staff, not member data.
- `gdpr_erasure_requests`, `gdpr_export_requests` — process metadata, not member content.

## README text (embedded in export)

(unchanged from v1; full text in original mockup)

## Brevo email template

Subject: **Your VYVE Health data export is ready**

Body (plain-English, persona-neutral):

```
Hi {first_name},

Your VYVE Health data export is ready to download.

This file contains every record we hold about you across our platform — your
profile, your activity history, your wellbeing check-ins, your nutrition logs,
your AI coach interactions, and everything else. It's the response to your
right of access under Article 15 of the UK GDPR.

Download your archive (link expires in 7 days):

  [Download my VYVE data] → {signed_url}

If you didn't request this, please reply to this email and we'll investigate.

For any questions about your data or your rights under UK GDPR, reach us at
team@vyvehealth.co.uk.

VYVE Health CIC
ICO Registration No. 00013608608
```

Lewis copy approval required before this template ships to Brevo. Suggest reusing the `re-engagement` template's wrapper styling for visual consistency.

## Receipt to `admin_audit_log`

After successful upload + signed-URL generation + Brevo email accepted, write one row:

```sql
INSERT INTO admin_audit_log (
  member_email,            -- subject of the export (target_email)
  action,                  -- 'gdpr_export_delivered'
  performed_by,            -- requesting admin or member email
  metadata,                -- jsonb: { request_id, kind, file_path, size_bytes, tables_included, signed_url_expires_at, requester_role, brevo_message_id }
  created_at               -- now()
)
VALUES (...);
```

If the export *fails* (build error, Storage upload error, Brevo error), write a `gdpr_export_failed` action with `metadata.failure_reason`. Cron retries failed requests on the next tick (max 3 attempts; after 3 it's flagged for manual investigation via `platform_alerts`).

`kind` is `member_self` or `admin`. The signed URL itself is NOT stored in the audit log (security — it's a credential, not metadata). Only the path and expiry.

## Cron schedule

`vyve-gdpr-export-tick`, schedule `*/15 * * * *` (every 15 minutes). At each tick the EF:

1. `SELECT * FROM gdpr_export_requests WHERE delivered_at IS NULL AND failed_at IS NULL ORDER BY requested_at LIMIT 5`. (5 cap so a sudden surge doesn't hammer Storage in one tick.)
2. For each row, set `queued_at = now()` (so concurrent ticks don't double-process), build the JSON, upload to Storage, sign the URL, send the Brevo email, set `delivered_at = now()` + the metadata fields. On error, set `failed_at = now()` + `failure_reason`, write the receipt, move on.
3. End of tick.

Latency from request to delivery: 0–15 minutes (avg ~7 min). The member-facing UI says "you'll get an email within an hour" to give us margin and not over-promise.

## Member-facing UI

`settings.html` gets a new "Privacy & Data" section in the About & Legal block, BELOW the existing privacy/terms links (so it's not the first thing they see):

```
Privacy & Data
──────────────
[Download my data]
   Get a copy of all data we hold about you under UK GDPR Article 15.
   You'll get an email within an hour with a download link.

[Delete my account]                                        (commit 4)
   Permanently delete your account and all associated data. There's a
   30-day grace period during which you can cancel.
```

Click on "Download my data" → modal:

```
We'll prepare a complete copy of every record we hold about you and
email it to {email} within the hour.

You can do this once every 30 days. If you've requested an export
recently, please wait until {next_eligible_date}.

This is your right under Article 15 of the UK GDPR.

[Cancel]                                            [Request export]
```

Click "Request export" → fetch `gdpr-export-request` → on 202, modal switches to:

```
Your export request is queued.

We'll email {email} within the next hour with a download link. The
link will work for 7 days.

[Close]
```

On 429 (rate-limited): modal shows the next-eligible date and a "Need this sooner? Email team@vyvehealth.co.uk" line.

The button should NOT show a loading spinner that blocks for the full 0-15 minutes. Member fires the request, gets the queued confirmation, closes the modal, goes about their day. Email arrives later.

## Failure modes & handling

| Mode | Handling |
|---|---|
| Subject email doesn't exist in `members` | `gdpr-export-request` returns 404 with `{ "error": "subject_not_found" }`. No row written. |
| Cron picks up a row, build errors mid-walk | Catch, log per-table errors to `failure_reason`, mark `failed_at = now()`. Cron retries on next tick (3-attempt cap before manual escalation). |
| Storage upload fails | Same — `failed_at` + retry. |
| Signed URL generation fails | Storage object exists but no URL — generate fresh on retry. |
| Brevo accepts the request but the email bounces | Brevo webhook (existing infrastructure) will mark `engagement_emails.suppressed = true` for the member; this case is detected when the next request from that member fires and we see suppressions. Out of scope for v1; manual investigation. |
| Member rate-limited | `gdpr-export-request` returns 429 with `Retry-After` header pointing at next-allowed timestamp. UI shows the next-eligible date. |
| Admin requesting non-existent target | 404. Audit row records the failed lookup with `metadata.outcome: "subject_not_found"`. |
| Cron crashes mid-cohort | Next cron sees the same un-delivered rows. The 5-cap LIMIT means a crash drops at most 5 in-flight requests; their `queued_at` is set but `delivered_at` is null, so they're picked up again. Idempotent — the table walk is read-only, the only side effect is the Storage upload + Brevo send, both of which are individually re-runnable. |
| Concurrent cron ticks (shouldn't happen with `*/15` but defensive) | Add `FOR UPDATE SKIP LOCKED` on the SELECT so two ticks can't grab the same row. Standard Postgres pattern. |

## EF skeleton (deferred to implementation phase)

```typescript
// gdpr-export-request — member-facing entry point
// verify_jwt: true at platform level

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req: Request) => {
  // CORS, auth, JWT validation (standard pattern from member-dashboard v59)
  const userEmail = (await getAuthUser(req))?.toLowerCase();
  if (!userEmail) return unauthorized();

  const body = await req.json().catch(() => ({}));
  const isAdmin = await checkAdmin(userEmail);
  const subject = isAdmin && body.target_email
    ? body.target_email.toLowerCase()
    : userEmail;

  // Verify subject exists
  const { data: member } = await supabaseSvc.from("members").select("email").eq("email", subject).maybeSingle();
  if (!member) return notFound();

  // Rate limit (skip for admin path)
  if (!isAdmin) {
    const { data: recent } = await supabaseSvc
      .from("gdpr_export_requests")
      .select("requested_at, delivered_at")
      .eq("member_email", subject)
      .not("delivered_at", "is", null)
      .order("requested_at", { ascending: false })
      .limit(1);
    if (recent?.length && (Date.now() - new Date(recent[0].requested_at).getTime()) < 30 * 86400000) {
      return rateLimited(recent[0].requested_at);
    }
  }

  // Queue the request
  const { data: row, error } = await supabaseSvc
    .from("gdpr_export_requests")
    .insert({
      member_email: subject,
      requested_by: userEmail,
      request_kind: isAdmin ? "admin" : "member_self",
    })
    .select()
    .single();
  if (error) return serverError(error);

  return new Response(JSON.stringify({
    success: true,
    request_id: row.id,
    estimated_delivery: "within 1 hour",
    target_email: subject,
  }), { status: 202 });
});


// gdpr-export-execute — cron tick
// verify_jwt: false at platform level, secret-bearer check inside

Deno.serve(async (req: Request) => {
  if (!cronSecretValid(req)) return unauthorized();

  const supabaseSvc = createClient(...);
  const { data: due } = await supabaseSvc.rpc("gdpr_export_pick_due", { limit_n: 5 });
  // gdpr_export_pick_due is a SQL function with FOR UPDATE SKIP LOCKED to prevent double-pickup

  const results = [];
  for (const req of due) {
    try {
      const json = await buildExport(supabaseSvc, req.member_email);
      const filePath = `${req.member_email}/${new Date().toISOString()}.json`;
      const { error: upErr } = await supabaseSvc.storage.from("gdpr-exports").upload(filePath, JSON.stringify(json));
      if (upErr) throw upErr;
      const { data: { signedUrl } } = await supabaseSvc.storage.from("gdpr-exports").createSignedUrl(filePath, 7 * 86400);
      await sendBrevoEmail(req.member_email, signedUrl);
      await supabaseSvc.from("gdpr_export_requests").update({
        delivered_at: new Date(),
        file_path: filePath,
        signed_url_expires_at: new Date(Date.now() + 7 * 86400000),
        size_bytes: JSON.stringify(json).length,
        tables_included: Object.keys(json).filter(k => !k.startsWith("_")).length,
      }).eq("id", req.id);
      await writeAuditLog(req, "gdpr_export_delivered", { file_path: filePath });
      results.push({ id: req.id, status: "delivered" });
    } catch (e) {
      await supabaseSvc.from("gdpr_export_requests").update({
        failed_at: new Date(),
        failure_reason: String(e).slice(0, 500),
      }).eq("id", req.id);
      await writeAuditLog(req, "gdpr_export_failed", { reason: String(e) });
      results.push({ id: req.id, status: "failed", error: String(e) });
    }
  }
  return new Response(JSON.stringify({ processed: due.length, results }));
});


async function buildExport(supabaseSvc, subject_email) {
  // Walk the table list (TABLES_MEMBER_SCOPED, TABLES_SINGLE_ROW, TABLE_SHARED_BY)
  // exactly as in v1. Sanitise auth.users. Return the JSON object.
  // Identical to v1 - sync vs async only changes the orchestration, not the build.
  ...
}
```

The `auth.users` sanitisation list (whitelist `id`, `email`, `created_at`, `updated_at`, `last_sign_in_at`, `email_confirmed_at`, `user_metadata`, `app_metadata`; drop everything else) is unchanged from v1.

## What this mockup is NOT covering

(unchanged from v1)

- Stripe data — out of scope, Stripe handles its own GDPR exports.
- Brevo data — Brevo retains email content; member can request from Brevo directly. We export the metadata (`engagement_emails`).
- HubSpot data — out of scope, HubSpot is for prospects.
- PostHog analytics events — TODO; PostHog has a delete-by-email API, will need a proxy for both export (commit 3 follow-up) and erasure (commit 4 follow-up). Not blocking for v1.

## Estimated build (Claude-assisted)

- Migration for `gdpr_export_requests` + indexes + RLS + `gdpr_export_pick_due` SQL function: ~45 min
- `gdpr-export-request` EF (member-self + admin paths, rate-limit check, queue insert): ~1 hour
- `gdpr-export-execute` EF (cron tick, table walk, sanitisation, Storage upload, Brevo, audit, retry): ~2 hours
- Cron registration: ~10 min
- Brevo template (Lewis copy approval): ~30 min coding, blocked on Lewis
- `settings.html` "Privacy & Data" section + modal flow + SW cache bump: ~1 hour
- Tests (manual + targeted unit on the table walk): ~1 hour

Total: ~6 hours, single session, two EF deploys + one schema migration + portal HTML changes (cache bump). Up from v1's 5h estimate; the +1h is the cron + queue table + retry handling. Worth it for the procurement-recognisable pattern and the curiosity-click filter.

## Open questions for Dean

1. **Storage bucket name** — `gdpr-exports`. Acceptable?
2. **Retention** — 90-day file lifecycle in the bucket. Confirm acceptable for procurement (some shops want 30 days, some 7 years).
3. **Member rate limit** — 1 per 30 days for member-self path, no limit for admin path. Reasonable?
4. **Email vs token-link.** Recommend signed URL directly in email body (simpler). Token-link adds one more EF and one more redirect; only worth it if Sage's procurement reviewer flags inbox-resident URLs as a concern. Keep simple unless told otherwise?
5. **`auth.users` sanitisation whitelist** — `id`, `email`, `created_at`, `updated_at`, `last_sign_in_at`, `email_confirmed_at`, `user_metadata`, `app_metadata`. Drop everything else (tokens, password hashes, recovery codes). Confirm.
6. **Settings UI placement** — new "Privacy & Data" section in About & Legal block on `settings.html`, button placement BELOW the privacy/terms links so curiosity clicks have to scroll. Confirm scope creep is acceptable in this commit.
