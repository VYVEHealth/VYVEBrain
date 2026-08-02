// VYVE Health — gdpr-export-request v1 (Security commit 3, 07 May 2026 PM-3).
//
// Article 15 GDPR right of access. Async pattern matching Strava/Notion:
//   1. Member taps "Download my data" → this EF queues an export request
//   2. Returns 202 immediately with request_id + estimated delivery
//   3. gdpr-export-execute cron picks it up within 15 minutes
//   4. JSON built, uploaded to gdpr-exports bucket, signed URL emailed via Brevo
//
// Two paths:
//   - member_self: empty body, subject = JWT email
//   - admin: body {target_email}, requester must be active admin in admin_users
//
// Rate limit: 1 export per 30 days for member-self; admin path unlimited.
// See brain/gdpr_export_schema.md (signed off 07 May 2026 PM-3).
//
// verify_jwt: false at platform level; internal JWT validation via /auth/v1/user.
// Same pattern as wellbeing-checkin v28 / log-activity v28.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const ALLOWED_ORIGINS = new Set([
  "https://online.vyvehealth.co.uk",
  "https://www.vyvehealth.co.uk"
]);
const DEFAULT_ORIGIN = "https://online.vyvehealth.co.uk";
const MAX_BODY_BYTES = 102400;
const RATE_LIMIT_DAYS = 30;
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
  const adminRequest = !!targetEmailRaw && targetEmailRaw !== requesterEmail;
  let kind;
  let subject;
  if (adminRequest) {
    const requesterIsAdmin = await isAdmin(supabaseSvc, requesterEmail);
    if (!requesterIsAdmin) {
      return new Response(JSON.stringify({
        error: "Admin access required for cross-member exports"
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
  const { data: member } = await supabaseSvc.from("members").select("email").eq("email", subject).maybeSingle();
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
  if (kind === "member_self") {
    const { data: recent } = await supabaseSvc.from("gdpr_export_requests").select("id, requested_at, delivered_at").eq("member_email", subject).not("delivered_at", "is", null).order("requested_at", {
      ascending: false
    }).limit(1);
    if (recent && recent.length > 0) {
      const lastMs = new Date(recent[0].requested_at).getTime();
      const elapsedMs = Date.now() - lastMs;
      const limitMs = RATE_LIMIT_DAYS * 86400 * 1000;
      if (elapsedMs < limitMs) {
        const nextEligible = new Date(lastMs + limitMs);
        return new Response(JSON.stringify({
          error: "rate_limited",
          message: `You can request another export from ${nextEligible.toISOString().slice(0, 10)}.`,
          next_eligible_at: nextEligible.toISOString(),
          last_request_at: recent[0].requested_at
        }), {
          status: 429,
          headers: {
            ...cors,
            "Content-Type": "application/json",
            "Retry-After": String(Math.ceil((limitMs - elapsedMs) / 1000))
          }
        });
      }
    }
    const { data: pending } = await supabaseSvc.from("gdpr_export_requests").select("id, requested_at").eq("member_email", subject).is("delivered_at", null).is("failed_at", null).limit(1);
    if (pending && pending.length > 0) {
      return new Response(JSON.stringify({
        error: "already_pending",
        message: "An export request is already in progress. You'll get an email when it's ready.",
        existing_request_id: pending[0].id,
        existing_requested_at: pending[0].requested_at
      }), {
        status: 409,
        headers: {
          ...cors,
          "Content-Type": "application/json"
        }
      });
    }
  }
  const { data: row, error: insertErr } = await supabaseSvc.from("gdpr_export_requests").insert({
    member_email: subject,
    requested_by: requesterEmail,
    request_kind: kind
  }).select("id, member_email, request_kind, requested_at").single();
  if (insertErr || !row) {
    console.error("[gdpr-export-request] insert failed:", insertErr);
    return new Response(JSON.stringify({
      error: "Failed to queue export request"
    }), {
      status: 500,
      headers: {
        ...cors,
        "Content-Type": "application/json"
      }
    });
  }
  return new Response(JSON.stringify({
    success: true,
    request_id: row.id,
    target_email: row.member_email,
    kind: row.request_kind,
    requested_at: row.requested_at,
    estimated_delivery: "within 1 hour",
    message: kind === "admin" ? `Export queued for ${subject}. They will receive an email when it's ready.` : "We'll email you within an hour with a download link. The link will work for 7 days."
  }), {
    status: 202,
    headers: {
      ...cors,
      "Content-Type": "application/json"
    }
  });
});
