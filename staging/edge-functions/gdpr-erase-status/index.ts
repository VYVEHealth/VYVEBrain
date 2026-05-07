// VYVE Health — gdpr-erase-status v1 (Security commit 4, 07 May 2026 PM-4).
//
// Tiny read-only EF returning pending-erasure status for the authenticated member.
// Used by settings.html to render the persistent in-app cancel banner without
// requiring members to read gdpr_erasure_requests directly (which is service-role
// only by RLS — we deliberately do NOT expose cancel_token to clients).
//
// Returns:
//   { has_pending: false }
//   { has_pending: true, scheduled_for: ISO, requested_at: ISO, request_kind: "member_self"|"admin" }
//
// verify_jwt: false at platform; internal /auth/v1/user validation. CORS allow-list
// with default-origin fallback (§23 commit-1 rule).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const ALLOWED_ORIGINS = new Set([
  "https://online.vyvehealth.co.uk",
  "https://www.vyvehealth.co.uk"
]);
const DEFAULT_ORIGIN = "https://online.vyvehealth.co.uk";
function getCORSHeaders(req) {
  const origin = req.headers.get("Origin") ?? "";
  const allow = ALLOWED_ORIGINS.has(origin) ? origin : DEFAULT_ORIGIN;
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Credentials": "true"
  };
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
Deno.serve(async (req)=>{
  const cors = getCORSHeaders(req);
  if (req.method === "OPTIONS") return new Response("ok", {
    headers: cors
  });
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const email = await getAuthEmail(req, SUPABASE_URL, ANON_KEY);
  if (!email) {
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
  const supabaseSvc = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: {
      persistSession: false
    }
  });
  const { data, error } = await supabaseSvc.from("gdpr_erasure_requests").select("scheduled_for, requested_at, request_kind").eq("member_email", email).is("executed_at", null).is("cancelled_at", null).is("failed_at", null).maybeSingle();
  if (error) {
    console.error("[gdpr-erase-status]", error);
    return new Response(JSON.stringify({
      error: "lookup failed"
    }), {
      status: 500,
      headers: {
        ...cors,
        "Content-Type": "application/json"
      }
    });
  }
  if (!data) {
    return new Response(JSON.stringify({
      has_pending: false
    }), {
      status: 200,
      headers: {
        ...cors,
        "Content-Type": "application/json"
      }
    });
  }
  return new Response(JSON.stringify({
    has_pending: true,
    scheduled_for: data.scheduled_for,
    requested_at: data.requested_at,
    request_kind: data.request_kind
  }), {
    status: 200,
    headers: {
      ...cors,
      "Content-Type": "application/json"
    }
  });
});
