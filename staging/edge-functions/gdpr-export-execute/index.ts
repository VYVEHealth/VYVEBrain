// VYVE Health — gdpr-export-execute v1 (Security commit 3, 07 May 2026 PM-3).
//
// Cron-driven executor for GDPR Article 15 export requests. Runs every 15 min.
// Picks up to 5 due rows from gdpr_export_requests via gdpr_export_pick_due()
// (FOR UPDATE SKIP LOCKED, attempt_count < 3, re-queues rows older than 10 min),
// builds per-subject JSON, uploads to gdpr-exports bucket, signs URL (7d),
// sends Brevo email, writes admin_audit_log receipt.
//
// Failure modes:
//   - Build/upload/sign/Brevo errors → mark failed_at if attempt_count reached
//     cap (3), otherwise leave for retry on next tick (10-min re-queue window).
//   - Cron crash mid-cohort → next tick re-picks (idempotent: Storage upload
//     overwrites, Brevo send produces a new message_id).
//   - Concurrent cron ticks → FOR UPDATE SKIP LOCKED in pick_due prevents
//     double-pickup.
//
// verify_jwt: false at platform; secret-bearer check inside.
// See brain/gdpr_export_schema.md (signed off 07 May 2026 PM-3).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const BREVO_KEY = Deno.env.get("BREVO_API_KEY");
const CRON_SECRET = Deno.env.get("CRON_SECRET") ?? "";
const SIGNED_URL_TTL_SECONDS = 7 * 86400; // 7 days
const TICK_LIMIT = 5;
const MAX_ATTEMPTS = 3;
// Member-scoped tables that filter on member_email = subject. Each is exported as an array.
const MEMBER_SCOPED_TABLES = [
  "daily_habits",
  "workouts",
  "cardio",
  "session_views",
  "replay_views",
  "wellbeing_checkins",
  "weekly_scores",
  "weekly_goals",
  "monthly_checkins",
  "nutrition_logs",
  "nutrition_my_foods",
  "weight_logs",
  "exercise_logs",
  "exercise_notes",
  "exercise_swaps",
  "custom_workouts",
  "workout_plan_cache",
  "certificates",
  "member_achievements",
  "member_health_connections",
  "member_health_daily",
  "member_health_samples",
  "member_health_write_ledger",
  "member_activity_daily",
  "member_activity_log",
  "member_running_plans",
  "member_habits",
  "persona_switches",
  "engagement_emails",
  "member_notifications",
  "scheduled_pushes",
  "push_subscriptions",
  "push_subscriptions_native",
  "session_chat",
  "platform_alerts",
  "qa_submissions",
  "ai_interactions",
  "ai_decisions",
  "employer_members",
  "activity_dedupe"
];
// Single-row tables: members (filtered on email), member_home_state + member_stats (member_email).
const SINGLE_ROW_TABLES = [
  {
    table: "members",
    col: "email"
  },
  {
    table: "member_home_state",
    col: "member_email"
  },
  {
    table: "member_stats",
    col: "member_email"
  }
];
// Different-column tables: shared_workouts uses shared_by (member as creator).
const SHARED_BY_TABLES = [
  {
    table: "shared_workouts",
    col: "shared_by"
  }
];
// auth.users sanitisation whitelist - everything else dropped (tokens, hashes, etc).
const AUTH_USER_WHITELIST = [
  "id",
  "email",
  "created_at",
  "updated_at",
  "last_sign_in_at",
  "email_confirmed_at",
  "user_metadata",
  "app_metadata"
];
const README_TEXT = `This file is your VYVE Health data export under Article 15 of the UK GDPR.

WHAT'S INCLUDED
This export contains every record VYVE Health CIC holds against your email
address across our platform tables. Each top-level key corresponds to one
database table; the value is either a single object (for one-row-per-member
tables like your profile) or an array of rows.

UNDERSTANDING DERIVED DATA
Some sections (member_home_state, member_stats, member_activity_daily) are
derived counters and aggregates computed from your raw activity. Deleting
your account purges both the source and derived rows; this export shows both
for completeness.

WHAT'S NOT INCLUDED
- Reference / library data (workout templates, habit themes, nutrition database)
  is not personal data and is not included.
- Shared resources (running plan templates) where multiple members hit the same
  cached output cannot be attributed to any single member; we have noted this
  exclusion in _meta.tables_excluded.
- Live session chat messages from OTHER members are not included — only your
  own messages. Note: chat sent in a live session was visible to all session
  attendees at the time. The same applies to any custom workouts you shared.
- Internal staff audit logs are not included; they record who accessed your
  data, not your data itself.

YOUR RIGHTS
You can request correction (Article 16) or erasure (Article 17) of any of
this data by emailing team@vyvehealth.co.uk. Erasure has a 30-day grace
period before permanent deletion, during which you can cancel by replying
to the confirmation email.

VYVE Health CIC · ICO Registration: 00013608608`;
// ─── Brevo email ─────────────────────────────────────────────────────────────
const wrap = (body)=>`<!DOCTYPE html><html><body style="margin:0;padding:0;background:#F4FAFA;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#F4FAFA;padding:32px 16px;"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#FFFFFF;border-radius:12px;overflow:hidden;box-shadow:0 2px 16px rgba(13,43,43,0.08);"><tr><td style="background:#0D2B2B;padding:24px 32px;"><img src="https://online.vyvehealth.co.uk/logo.png" alt="VYVE Health" style="height:36px;display:block;" /></td></tr><tr><td style="padding:32px;">${body}</td></tr><tr><td style="background:#F4FAFA;padding:20px 32px;border-top:1px solid #C8E4E4;"><p style="margin:0;font-size:12px;color:#7A9A9A;">VYVE Health CIC &nbsp;&middot;&nbsp; team@vyvehealth.co.uk<br>ICO Registration No. 00013608608</p></td></tr></table></td></tr></table></body></html>`;
const h2 = (t)=>`<h2 style="margin:0 0 20px;font-size:22px;font-family:Georgia,serif;color:#0D2B2B;font-weight:400;">${t}</h2>`;
const pp = (t)=>`<p style="margin:0 0 16px;font-size:15px;color:#3A5A5A;line-height:1.7;">${t}</p>`;
const btn = (label, href)=>`<div style="text-align:center;margin:28px 0;"><a href="${href}" style="background:#0D2B2B;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600;display:inline-block;">${label} &rarr;</a></div>`;
function buildEmailHTML(firstName, signedUrl, expiresAt) {
  const name = firstName || "there";
  const expDate = new Date(expiresAt).toLocaleDateString("en-GB", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });
  return wrap(`
${h2(`Your VYVE Health data export is ready, ${name}.`)}
${pp("This file contains every record we hold about you across our platform — your profile, activity history, wellbeing check-ins, nutrition logs, AI coach interactions, and more. It's the response to your right of access under Article 15 of the UK GDPR.")}
${btn("Download my VYVE data", signedUrl)}
${pp(`The link expires on ${expDate}. If you didn't request this export, please reply to this email and we'll investigate.`)}
${pp("For any questions about your data or your rights under UK GDPR, reach us at team@vyvehealth.co.uk.")}
`);
}
async function sendBrevo(toEmail, toName, signedUrl, expiresAt) {
  const r = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": BREVO_KEY,
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify({
      sender: {
        name: "VYVE Health",
        email: "team@vyvehealth.co.uk"
      },
      to: [
        {
          email: toEmail,
          name: toName
        }
      ],
      subject: "Your VYVE Health data export is ready",
      htmlContent: buildEmailHTML(toName, signedUrl, expiresAt),
      tags: [
        "gdpr_export"
      ]
    })
  });
  const d = await r.json().catch(()=>({}));
  if (!r.ok) throw new Error(`Brevo ${r.status}: ${JSON.stringify(d).slice(0, 300)}`);
  return d.messageId || null;
}
// ─── Build per-subject JSON ─────────────────────────────────────────────────
function sanitiseAuthUser(u) {
  if (!u) return null;
  const out = {};
  for (const k of AUTH_USER_WHITELIST){
    if (k in u) out[k] = u[k];
  }
  return out;
}
async function buildExport(supabaseSvc, subject) {
  const out = {
    _meta: {
      schema_version: "1.0",
      generated_at: new Date().toISOString(),
      subject_email: subject,
      tables_included: 0,
      tables_excluded: [
        {
          table: "running_plan_cache",
          reason: "shared_parametric_cache_no_subject_attribution"
        }
      ],
      vyve_legal_entity: "VYVE Health CIC",
      ico_registration: "00013608608",
      contact: "team@vyvehealth.co.uk"
    },
    _readme: README_TEXT
  };
  let tableCount = 0;
  for (const { table, col } of SINGLE_ROW_TABLES){
    const { data, error } = await supabaseSvc.from(table).select("*").eq(col, subject).maybeSingle();
    if (error) {
      console.warn(`[buildExport] ${table} error:`, error.message);
      out[table] = null;
      out._meta = {
        ...out._meta,
        [`error_${table}`]: error.message
      };
    } else {
      out[table] = data;
    }
    tableCount += 1;
  }
  const batches = [];
  for(let i = 0; i < MEMBER_SCOPED_TABLES.length; i += 8){
    batches.push(MEMBER_SCOPED_TABLES.slice(i, i + 8));
  }
  for (const batch of batches){
    const results = await Promise.all(batch.map((t)=>supabaseSvc.from(t).select("*").eq("member_email", subject)));
    batch.forEach((t, i)=>{
      const r = results[i];
      if (r.error) {
        console.warn(`[buildExport] ${t} error:`, r.error.message);
        out[t] = [];
        out._meta = {
          ...out._meta,
          [`error_${t}`]: r.error.message
        };
      } else {
        out[t] = r.data || [];
      }
      tableCount += 1;
    });
  }
  for (const { table, col } of SHARED_BY_TABLES){
    const { data, error } = await supabaseSvc.from(table).select("*").eq(col, subject);
    if (error) {
      console.warn(`[buildExport] ${table} error:`, error.message);
      out[table] = [];
      out._meta = {
        ...out._meta,
        [`error_${table}`]: error.message
      };
    } else {
      out[table] = data || [];
    }
    tableCount += 1;
  }
  try {
    const { data: usersData } = await supabaseSvc.auth.admin.listUsers({
      page: 1,
      perPage: 1000
    });
    const u = usersData?.users?.find((x)=>x.email?.toLowerCase() === subject);
    out.auth_user = sanitiseAuthUser(u);
    tableCount += 1;
  } catch (e) {
    console.warn("[buildExport] auth.users error:", e.message);
    out.auth_user = null;
    out._meta = {
      ...out._meta,
      error_auth_user: String(e)
    };
  }
  out._meta.tables_included = tableCount;
  return {
    json: out,
    tablesIncluded: tableCount
  };
}
async function writeAudit(supabaseSvc, subject, requester, kind, action, metadata) {
  try {
    await supabaseSvc.from("admin_audit_log").insert({
      admin_email: requester,
      admin_role: kind === "admin" ? "admin" : "member_self",
      member_email: subject,
      action,
      table_name: "gdpr_export_requests",
      new_value: metadata
    });
  } catch (e) {
    console.error("[writeAudit] failed:", e.message);
  }
}
async function processRequest(supabaseSvc, req) {
  const { id, member_email, requested_by, request_kind, attempt_count } = req;
  const startedAt = Date.now();
  try {
    const { json, tablesIncluded } = await buildExport(supabaseSvc, member_email);
    const jsonText = JSON.stringify(json, null, 2);
    const sizeBytes = jsonText.length;
    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    const filePath = `${member_email}/${ts}.json`;
    const { error: upErr } = await supabaseSvc.storage.from("gdpr-exports").upload(filePath, jsonText, {
      contentType: "application/json",
      upsert: true
    });
    if (upErr) throw new Error(`Storage upload: ${upErr.message}`);
    const { data: signed, error: signErr } = await supabaseSvc.storage.from("gdpr-exports").createSignedUrl(filePath, SIGNED_URL_TTL_SECONDS);
    if (signErr || !signed?.signedUrl) throw new Error(`Sign URL: ${signErr?.message || "no url"}`);
    const expiresAt = new Date(Date.now() + SIGNED_URL_TTL_SECONDS * 1000).toISOString();
    const { data: memberRow } = await supabaseSvc.from("members").select("first_name").eq("email", member_email).maybeSingle();
    const firstName = memberRow?.first_name || "there";
    const messageId = await sendBrevo(member_email, firstName, signed.signedUrl, expiresAt);
    await supabaseSvc.from("gdpr_export_requests").update({
      delivered_at: new Date().toISOString(),
      file_path: filePath,
      signed_url_expires_at: expiresAt,
      size_bytes: sizeBytes,
      tables_included: tablesIncluded,
      brevo_message_id: messageId
    }).eq("id", id);
    await writeAudit(supabaseSvc, member_email, requested_by, request_kind, "gdpr_export_delivered", {
      request_id: id,
      file_path: filePath,
      signed_url_expires_at: expiresAt,
      size_bytes: sizeBytes,
      tables_included: tablesIncluded,
      brevo_message_id: messageId,
      duration_ms: Date.now() - startedAt
    });
    return {
      status: "delivered"
    };
  } catch (e) {
    const msg = e.message || String(e);
    console.error(`[processRequest] ${member_email} attempt ${attempt_count}/${MAX_ATTEMPTS}:`, msg);
    const isFinalAttempt = attempt_count >= MAX_ATTEMPTS;
    const updates = {
      failure_reason: msg.slice(0, 500)
    };
    if (isFinalAttempt) updates.failed_at = new Date().toISOString();
    await supabaseSvc.from("gdpr_export_requests").update(updates).eq("id", id);
    await writeAudit(supabaseSvc, member_email, requested_by, request_kind, "gdpr_export_failed", {
      request_id: id,
      attempt: attempt_count,
      max_attempts: MAX_ATTEMPTS,
      final_attempt: isFinalAttempt,
      reason: msg,
      duration_ms: Date.now() - startedAt
    });
    return {
      status: "failed",
      detail: msg
    };
  }
}
Deno.serve(async (req)=>{
  if (CRON_SECRET) {
    const auth = req.headers.get("Authorization") ?? "";
    const expected = `Bearer ${CRON_SECRET}`;
    if (auth !== expected) {
      return new Response(JSON.stringify({
        error: "unauthorized"
      }), {
        status: 401,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({
      error: "Method not allowed"
    }), {
      status: 405,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
  const supabaseSvc = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: {
      persistSession: false
    }
  });
  const { data: due, error: pickErr } = await supabaseSvc.rpc("gdpr_export_pick_due", {
    limit_n: TICK_LIMIT
  });
  if (pickErr) {
    console.error("[gdpr-export-execute] pick_due error:", pickErr);
    return new Response(JSON.stringify({
      error: "pick_due failed",
      detail: pickErr.message
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
  const dueRows = due ?? [];
  console.log(`[gdpr-export-execute] picked ${dueRows.length} due rows`);
  const results = [];
  for (const row of dueRows){
    const r = await processRequest(supabaseSvc, row);
    results.push({
      id: row.id,
      member_email: row.member_email,
      ...r
    });
  }
  return new Response(JSON.stringify({
    success: true,
    processed: results.length,
    delivered: results.filter((r)=>r.status === "delivered").length,
    failed: results.filter((r)=>r.status === "failed").length,
    results
  }), {
    status: 200,
    headers: {
      "Content-Type": "application/json"
    }
  });
});
