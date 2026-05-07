// VYVE Health — achievements-mark-seen v1
// JWT-authed endpoint. Marks earned tiers as seen so they don't re-toast.
// Body: { metric_slug?: string, tier_index?: number, mark_all?: boolean }
//   - { metric_slug, tier_index }: mark a single tier seen
//   - { mark_all: true }: mark every unseen tier seen for the caller
// Returns: { success, marked }
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const ALLOWED_ORIGINS = new Set([
  "https://online.vyvehealth.co.uk",
  "https://www.vyvehealth.co.uk"
]);
function getCORSHeaders(req) {
  const origin = req.headers.get("Origin") ?? "";
  const allowOrigin = ALLOWED_ORIGINS.has(origin) ? origin : origin === "null" || origin === "" ? "*" : "https://online.vyvehealth.co.uk";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Credentials": allowOrigin !== "*" ? "true" : "false"
  };
}
async function getAuthUser(req) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${token}`
    }
  });
  if (!res.ok) return null;
  const user = await res.json();
  return user.email?.toLowerCase() || null;
}
serve(async (req)=>{
  const corsHeaders = getCORSHeaders(req);
  if (req.method === "OPTIONS") return new Response("ok", {
    headers: corsHeaders
  });
  try {
    const email = await getAuthUser(req);
    if (!email) {
      return new Response(JSON.stringify({
        success: false,
        error: "auth required"
      }), {
        status: 401,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    const body = await req.json().catch(()=>({}));
    const { metric_slug, tier_index, mark_all } = body ?? {};
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        persistSession: false
      }
    });
    const now = new Date().toISOString();
    let q = supabase.from("member_achievements").update({
      seen_at: now
    }).eq("member_email", email).is("seen_at", null);
    if (mark_all === true) {
    // no further filters
    } else if (typeof metric_slug === "string" && Number.isInteger(tier_index)) {
      q = q.eq("metric_slug", metric_slug).eq("tier_index", tier_index);
    } else {
      return new Response(JSON.stringify({
        success: false,
        error: "specify {mark_all:true} OR {metric_slug,tier_index}"
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    const { data, error } = await q.select("metric_slug,tier_index");
    if (error) throw error;
    return new Response(JSON.stringify({
      success: true,
      marked: data?.length ?? 0,
      rows: data ?? []
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  } catch (err) {
    console.error("[achievements-mark-seen] error:", err.message);
    return new Response(JSON.stringify({
      success: false,
      error: err.message
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
});
