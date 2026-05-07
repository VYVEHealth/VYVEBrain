// VYVE Health — gdpr-erase-request v1 (Security commit 4, 07 May 2026 PM-4).
//
// Article 17 GDPR right of erasure. Two-phase pattern with 30-day grace:
//   1. Member taps "Delete my account" → typed-email confirmation → this EF
//   2. Inserts row in gdpr_erasure_requests, scheduled_for = now() + 30 days
//   3. Brevo email sent with cancel link (token-in-querystring)
//   4. Cron vyve-gdpr-erase-daily picks up due rows after grace and runs gdpr-erase-execute
//
// Two paths:
//   - member_self: empty body, subject = JWT email
//   - admin: body {target_email}, requester must be active admin in admin_users
//     (admin path bypasses typed-email gate which is a member-side affordance)
//
// One pending request per email at a time (DB partial unique index enforces).
//
// verify_jwt: false at platform; internal /auth/v1/user validation (matches
// gdpr-export-request v1 / wellbeing-checkin v28 / log-activity v28 pattern).
// CORS default-origin fallback per §23 commit-1 rule. 100KB payload cap.
//
// See brain/gdpr_erasure_flow.md (signed off 07 May 2026 PM-3).
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const ALLOWED_ORIGINS = new Set([
  "https://online.vyvehealth.co.uk",
  "https://www.vyvehealth.co.uk"
]);
const DEFAULT_ORIGIN = "https://online.vyvehealth.co.uk";
const MAX_BODY_BYTES = 102400;
const GRACE_DAYS = 30;
const PORTAL_BASE = "https://online.vyvehealth.co.uk";
function getCORSHeaders(req) {
  const origin = req.headers.get("Origin") ?? "";
  const allow = ALLOWED_ORIGINS.has(origin) ? origin : DEFAULT_ORIGIN;
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Credentials": "true"
  };
}
function payloadTooLarge(req) {
  const cl = req.headers.get("content-length");
  if (!cl) return false;
  const n = Number(cl);
  return Number.isFinite(n) && n > MAX_BODY_BYTES;
}
async function getAuthEmail(req, supabaseUrl, anonKey) {
  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const token = auth.slice(7);
  const r = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${token}`
    }
  });
  if (!r.ok) return null;
  const u = await r.json();
  return u?.email?.toLowerCase() || null;
}
async function isAdmin(supabaseSvc, email) {
  const { data } = await supabaseSvc.from("admin_users").select("role,active").eq("email", email).eq("active", true).eq("role", "admin").maybeSingle();
  return !!data;
}
function generateCancelToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b)=>b.toString(16).padStart(2, "0")).join("");
}
// ─── Brevo email (request confirmation) ────────────────────────────────────
const wrap = (body)=>`<!DOCTYPE html><html><body style="margin:0;padding:0;background:#F4FAFA;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#F4FAFA;padding:32px 16px;"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#FFFFFF;border-radius:12px;overflow:hidden;box-shadow:0 2px 16px rgba(13,43,43,0.08);"><tr><td style="background:#0D2B2B;padding:24px 32px;"><img src="https://online.vyvehealth.co.uk/logo.png" alt="VYVE Health" style="height:36px;display:block;" /></td></tr><tr><td style="padding:32px;">${body}</td></tr><tr><td style="background:#F4FAFA;padding:20px 32px;border-top:1px solid #C8E4E4;"><p style="margin:0;font-size:12px;color:#7A9A9A;">VYVE Health CIC &nbsp;&middot;&nbsp; team@vyvehealth.co.uk<br>ICO Registration No. 00013608608</p></td></tr></table></td></tr></table></body></html>`;
const h2 = (t)=>`<h2 style="margin:0 0 20px;font-size:22px;font-family:Georgia,serif;color:#0D2B2B;font-weight:400;">${t}</h2>`;
const pp = (t)=>`<p style="margin:0 0 16px;font-size:15px;color:#3A5A5A;line-height:1.7;">${t}</p>`;
const btn = (label, href)=>`<div style="text-align:center;margin:28px 0;"><a href="${href}" style="background:#0D2B2B;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600;display:inline-block;">${label} &rarr;</a></div>`;
const callout = (t)=>`<div style="background:#FFF8E5;border-left:4px solid #C9A84C;padding:16px 20px;border-radius:6px;margin:20px 0;"><p style="margin:0;font-size:14px;color:#5A4A1A;line-height:1.6;">${t}</p></div>`;
function buildRequestEmailHTML(firstName, cancelUrl, scheduledFor, kind, requestedBy) {
  const name = firstName || "there";
  const scheduledDate = new Date(scheduledFor).toLocaleDateString("en-GB", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });
  const adminBlurb = kind === "admin" ? pp(`This deletion was scheduled by a VYVE administrator (<strong>${requestedBy}</strong>) on your behalf, in line with your right of erasure. If this wasn't requested by you, click the cancel link below immediately.`) : pp("This deletion was requested from inside your VYVE account.");
  return wrap(`
${h2(`Account deletion scheduled, ${name}.`)}
${pp(`We've received a request to permanently delete your VYVE Health account. Your data will be erased on <strong>${scheduledDate}</strong>.`)}
${adminBlurb}
${callout("Changed your mind? You have 30 days to cancel. After that, deletion is irreversible — we cannot recover your data once it's been purged.")}
${btn("Cancel the deletion", cancelUrl)}
${pp("Until the deletion runs, your account remains fully active. You can keep using VYVE as normal during the grace period, and can also cancel from the Settings page inside the app.")}
${pp("Questions about your data or your rights under UK GDPR? Reply to this email or write to us at team@vyvehealth.co.uk.")}
`);
}
async function sendBrevo(brevoKey, toEmail, toName, html, subject) {
  const r = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": brevoKey,
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
      subject,
      htmlContent: html,
      tags: [
        "gdpr_erase_request"
      ]
    })
  });
  const d = await r.json().catch(()=>({}));
  if (!r.ok) throw new Error(`Brevo ${r.status}: ${JSON.stringify(d).slice(0, 300)}`);
  return d.messageId || null;
}
async function writeAudit(supabaseSvc, subject, requester, kind, action, metadata) {
  try {
    await supabaseSvc.from("admin_audit_log").insert({
      admin_email: requester,
      admin_role: kind === "admin" ? "admin" : "member_self",
      member_email: subject,
      action,
      table_name: "gdpr_erasure_requests",
      new_value: metadata
    });
  } catch (e) {
    console.error("[writeAudit] failed:", e.message);
  }
}
// ─── Request handler ────────────────────────────────────────────────────────
serve(async (req)=>{
  const cors = getCORSHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: cors
    });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({
      error: "Method not allowed"
    }), {
      status: 405,
      headers: {
        ...cors,
        "Content-Type": "application/json"
      }
    });
  }
  if (payloadTooLarge(req)) {
    return new Response(JSON.stringify({
      error: "Payload too large (>100KB)"
    }), {
      status: 413,
      headers: {
        ...cors,
        "Content-Type": "application/json"
      }
    });
  }
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const BREVO_KEY = Deno.env.get("BREVO_API_KEY");
  const requesterEmail = await getAuthEmail(req, SUPABASE_URL, ANON_KEY);
  if (!requesterEmail) {
    return new Response(JSON.stringify({
      error: "Authentication required"
    }), {
      status: 401,
      headers: {
        ...cors,
        "Content-Type": "application/json"
      }
    });
  }
  let body = {};
  try {
    const text = await req.text();
    body = text ? JSON.parse(text) : {};
  } catch  {
    return new Response(JSON.stringify({
      error: "Invalid JSON body"
    }), {
      status: 400,
      headers: {
        ...cors,
        "Content-Type": "application/json"
      }
    });
  }
  const supabaseSvc = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: {
      persistSession: false
    }
  });
  const targetEmailRaw = (body?.target_email ?? "").toString().trim().toLowerCase();
  const reason = (body?.reason ?? "").toString().trim().slice(0, 2000) || null;
  const adminRequest = !!targetEmailRaw && targetEmailRaw !== requesterEmail;
  let kind;
  let subject;
  if (adminRequest) {
    const requesterIsAdmin = await isAdmin(supabaseSvc, requesterEmail);
    if (!requesterIsAdmin) {
      return new Response(JSON.stringify({
        error: "Admin access required for cross-member erasure"
      }), {
        status: 403,
        headers: {
          ...cors,
          "Content-Type": "application/json"
        }
      });
    }
    subject = targetEmailRaw;
    kind = "admin";
  } else {
    subject = requesterEmail;
    kind = "member_self";
  }
  const { data: member } = await supabaseSvc.from("members").select("email,first_name").eq("email", subject).maybeSingle();
  if (!member) {
    return new Response(JSON.stringify({
      error: "Subject email not found"
    }), {
      status: 404,
      headers: {
        ...cors,
        "Content-Type": "application/json"
      }
    });
  }
  // Already-pending check (also enforced by DB partial unique index, but we want a clean 409)
  const { data: pending } = await supabaseSvc.from("gdpr_erasure_requests").select("id, scheduled_for, cancel_token").eq("member_email", subject).is("executed_at", null).is("cancelled_at", null).maybeSingle();
  if (pending) {
    return new Response(JSON.stringify({
      error: "already_pending",
      message: "An erasure is already scheduled for this account.",
      scheduled_for: pending.scheduled_for,
      existing_request_id: pending.id
    }), {
      status: 409,
      headers: {
        ...cors,
        "Content-Type": "application/json"
      }
    });
  }
  const cancelToken = generateCancelToken();
  const scheduledFor = new Date(Date.now() + GRACE_DAYS * 86400 * 1000).toISOString();
  const { data: row, error: insertErr } = await supabaseSvc.from("gdpr_erasure_requests").insert({
    member_email: subject,
    requested_by: requesterEmail,
    request_kind: kind,
    reason,
    scheduled_for: scheduledFor,
    cancel_token: cancelToken
  }).select("id, member_email, request_kind, requested_at, scheduled_for, cancel_token").single();
  if (insertErr || !row) {
    console.error("[gdpr-erase-request] insert failed:", insertErr);
    // 23505 = unique_violation = race lost against another concurrent request
    if (insertErr?.code === "23505") {
      return new Response(JSON.stringify({
        error: "already_pending",
        message: "An erasure is already scheduled for this account."
      }), {
        status: 409,
        headers: {
          ...cors,
          "Content-Type": "application/json"
        }
      });
    }
    return new Response(JSON.stringify({
      error: "Failed to schedule erasure"
    }), {
      status: 500,
      headers: {
        ...cors,
        "Content-Type": "application/json"
      }
    });
  }
  // Send confirmation email (with cancel link)
  const cancelUrl = `${PORTAL_BASE}/gdpr-erasure-cancel.html?token=${cancelToken}`;
  let messageId = null;
  try {
    const html = buildRequestEmailHTML(member.first_name || "", cancelUrl, scheduledFor, kind, requesterEmail);
    messageId = await sendBrevo(BREVO_KEY, subject, member.first_name || "there", html, "VYVE Health: account deletion scheduled");
  } catch (e) {
    // Brevo failed but the row is in. Don't roll back — better to have a scheduled deletion
    // we can email about manually than to silently no-op. Surface to platform_alerts for staff
    // and let the response carry the error so the UI can show "scheduled but email failed,
    // contact support". The cancel banner inside the app is the secondary cancel surface anyway.
    console.error("[gdpr-erase-request] Brevo send failed:", e.message);
    try {
      await supabaseSvc.from("platform_alerts").insert({
        severity: "warning",
        type: "gdpr_erase_email_failed",
        source: "gdpr-erase-request",
        member_email: subject,
        details: `Erasure ${row.id} scheduled but confirmation email failed: ${e.message}`
      });
    } catch (e2) {
      console.error("[platform_alerts insert]", e2.message);
    }
  }
  await writeAudit(supabaseSvc, subject, requesterEmail, kind, "gdpr_erase_requested", {
    request_id: row.id,
    scheduled_for: scheduledFor,
    kind,
    requested_by: requesterEmail,
    reason: reason ? "(provided)" : null,
    brevo_message_id: messageId,
    email_sent: !!messageId
  });
  return new Response(JSON.stringify({
    success: true,
    request_id: row.id,
    target_email: row.member_email,
    kind: row.request_kind,
    requested_at: row.requested_at,
    scheduled_for: row.scheduled_for,
    grace_days: GRACE_DAYS,
    email_sent: !!messageId,
    message: kind === "admin" ? `Erasure scheduled for ${subject}. Confirmation email sent with cancel link.` : "We've scheduled your account for deletion. Check your email for confirmation and a cancel link."
  }), {
    status: 202,
    headers: {
      ...cors,
      "Content-Type": "application/json"
    }
  });
});
