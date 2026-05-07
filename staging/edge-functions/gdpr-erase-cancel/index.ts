// VYVE Health — gdpr-erase-cancel v2 (Security commit 4, 07 May 2026 PM-4).
//
// Cancels a pending GDPR erasure request via either:
//   (A) cancel_token in body (email link path) — token IS the auth
//   (B) authenticated JWT in Authorization header (in-app banner path) —
//       JWT identifies the subject; pending row looked up by member_email.
//
// Both paths converge on the same UPDATE: set cancelled_at, cancelled_by,
// cancellation_reason. Source-of-truth is the row, not the auth method.
//
// Token shape: 32 bytes hex (64 chars). JWT validated via /auth/v1/user.
//
// verify_jwt: false at platform.
// CORS default-origin fallback per §23 commit-1 rule. 100KB payload cap.
//
// See brain/gdpr_erasure_flow.md (signed off 07 May 2026 PM-3).
// v1 → v2 changelog: added JWT mode for in-app cancellation from settings banner.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const ALLOWED_ORIGINS = new Set([
  "https://online.vyvehealth.co.uk",
  "https://www.vyvehealth.co.uk"
]);
const DEFAULT_ORIGIN = "https://online.vyvehealth.co.uk";
const MAX_BODY_BYTES = 102400;
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
// ─── Brevo email (cancellation confirmation) ────────────────────────────────
const wrap = (body)=>`<!DOCTYPE html><html><body style="margin:0;padding:0;background:#F4FAFA;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#F4FAFA;padding:32px 16px;"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#FFFFFF;border-radius:12px;overflow:hidden;box-shadow:0 2px 16px rgba(13,43,43,0.08);"><tr><td style="background:#0D2B2B;padding:24px 32px;"><img src="https://online.vyvehealth.co.uk/logo.png" alt="VYVE Health" style="height:36px;display:block;" /></td></tr><tr><td style="padding:32px;">${body}</td></tr><tr><td style="background:#F4FAFA;padding:20px 32px;border-top:1px solid #C8E4E4;"><p style="margin:0;font-size:12px;color:#7A9A9A;">VYVE Health CIC &nbsp;&middot;&nbsp; team@vyvehealth.co.uk<br>ICO Registration No. 00013608608</p></td></tr></table></td></tr></table></body></html>`;
const h2 = (t)=>`<h2 style="margin:0 0 20px;font-size:22px;font-family:Georgia,serif;color:#0D2B2B;font-weight:400;">${t}</h2>`;
const pp = (t)=>`<p style="margin:0 0 16px;font-size:15px;color:#3A5A5A;line-height:1.7;">${t}</p>`;
function buildCancelEmailHTML(firstName) {
  const name = firstName || "there";
  return wrap(`
${h2(`Your account is safe, ${name}.`)}
${pp("We've cancelled the scheduled deletion of your VYVE Health account. Nothing has been deleted, and you can keep using VYVE as normal.")}
${pp("If you didn't request this cancellation, please reply to this email immediately so we can investigate.")}
${pp("Any questions about your data or your rights under UK GDPR? Reach us at team@vyvehealth.co.uk.")}
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
        "gdpr_erase_cancel"
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
      admin_role: kind,
      member_email: subject,
      action,
      table_name: "gdpr_erasure_requests",
      new_value: metadata
    });
  } catch (e) {
    console.error("[writeAudit] failed:", e.message);
  }
}
// ─── Handler ──────────────────────────────────────────────────────────────
serve(async (req)=>{
  const cors = getCORSHeaders(req);
  if (req.method === "OPTIONS") return new Response("ok", {
    headers: cors
  });
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
  const tokenRaw = (body?.token ?? "").toString().trim();
  const supabaseSvc = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: {
      persistSession: false
    }
  });
  let row = null;
  let cancelledBy = "";
  let cancellationReason = "";
  let authMode = "token";
  if (tokenRaw) {
    // Path A: token-based
    if (!/^[a-f0-9]{64}$/.test(tokenRaw)) {
      return new Response(JSON.stringify({
        error: "invalid_or_used_token",
        message: "This cancellation link has expired or been used. If you didn't intend to delete your account, email team@vyvehealth.co.uk urgently."
      }), {
        status: 410,
        headers: {
          ...cors,
          "Content-Type": "application/json"
        }
      });
    }
    const { data } = await supabaseSvc.from("gdpr_erasure_requests").select("id, member_email, scheduled_for, cancelled_at, executed_at").eq("cancel_token", tokenRaw).maybeSingle();
    row = data;
    // Optional logged-in attribution (token IS the auth, but capture canceller if present)
    const loggedInEmail = await getAuthEmail(req, SUPABASE_URL, ANON_KEY);
    cancelledBy = loggedInEmail || "token_self_cancel";
    cancellationReason = loggedInEmail ? "in_app_banner" : "email_link";
    authMode = "token";
  } else {
    // Path B: JWT-based (in-app settings)
    const email = await getAuthEmail(req, SUPABASE_URL, ANON_KEY);
    if (!email) {
      return new Response(JSON.stringify({
        error: "auth_required",
        message: "Provide either a cancellation token or a logged-in session."
      }), {
        status: 401,
        headers: {
          ...cors,
          "Content-Type": "application/json"
        }
      });
    }
    const { data } = await supabaseSvc.from("gdpr_erasure_requests").select("id, member_email, scheduled_for, cancelled_at, executed_at").eq("member_email", email).is("executed_at", null).is("cancelled_at", null).is("failed_at", null).maybeSingle();
    row = data;
    cancelledBy = email;
    cancellationReason = "in_app_settings";
    authMode = "jwt";
  }
  if (!row || row.cancelled_at || row.executed_at) {
    return new Response(JSON.stringify({
      error: "invalid_or_used_token",
      message: "There's nothing pending to cancel for this account, or the link has been used. If something looks wrong, email team@vyvehealth.co.uk."
    }), {
      status: 410,
      headers: {
        ...cors,
        "Content-Type": "application/json"
      }
    });
  }
  if (new Date(row.scheduled_for).getTime() < Date.now()) {
    return new Response(JSON.stringify({
      error: "window_closed",
      message: "The 30-day cancellation window has closed and the deletion may already have run. Email team@vyvehealth.co.uk immediately and we'll check.",
      scheduled_for: row.scheduled_for
    }), {
      status: 410,
      headers: {
        ...cors,
        "Content-Type": "application/json"
      }
    });
  }
  const { error: updateErr } = await supabaseSvc.from("gdpr_erasure_requests").update({
    cancelled_at: new Date().toISOString(),
    cancelled_by: cancelledBy,
    cancellation_reason: cancellationReason
  }).eq("id", row.id).is("cancelled_at", null).is("executed_at", null);
  if (updateErr) {
    console.error("[gdpr-erase-cancel v2] update failed:", updateErr);
    return new Response(JSON.stringify({
      error: "Failed to cancel erasure"
    }), {
      status: 500,
      headers: {
        ...cors,
        "Content-Type": "application/json"
      }
    });
  }
  // Send confirmation email (best-effort)
  let messageId = null;
  try {
    const { data: member } = await supabaseSvc.from("members").select("first_name").eq("email", row.member_email).maybeSingle();
    const html = buildCancelEmailHTML(member?.first_name || "");
    messageId = await sendBrevo(BREVO_KEY, row.member_email, member?.first_name || "there", html, "VYVE Health: account deletion cancelled");
  } catch (e) {
    console.error("[gdpr-erase-cancel v2] Brevo send failed:", e.message);
    try {
      await supabaseSvc.from("platform_alerts").insert({
        severity: "info",
        type: "gdpr_erase_cancel_email_failed",
        source: "gdpr-erase-cancel",
        member_email: row.member_email,
        details: `Cancellation succeeded for ${row.id} but confirmation email failed: ${e.message}`
      });
    } catch (e2) {
      console.error("[platform_alerts insert]", e2.message);
    }
  }
  await writeAudit(supabaseSvc, row.member_email, cancelledBy, authMode === "jwt" ? "member_self" : "token", "gdpr_erase_cancelled", {
    request_id: row.id,
    cancelled_by: cancelledBy,
    reason: cancellationReason,
    auth_mode: authMode,
    brevo_message_id: messageId,
    email_sent: !!messageId
  });
  return new Response(JSON.stringify({
    success: true,
    request_id: row.id,
    target_email: row.member_email,
    cancelled_at: new Date().toISOString(),
    auth_mode: authMode,
    message: "The scheduled deletion has been cancelled. Your account is safe."
  }), {
    status: 200,
    headers: {
      ...cors,
      "Content-Type": "application/json"
    }
  });
});
