// VYVE Health — anthropic-proxy v16 — Security commit 1B fix-up (07 May 2026).
//
// CHANGES vs v15:
//   - triggered_by value corrected to 'running_plan' to satisfy the
//     ai_interactions_triggered_by_check CHECK constraint (allows only
//     ['weekly_checkin','onboarding','running_plan','milestone','manual','re_engagement']).
//     v15's 'anthropic-proxy:running-plan' would silently 23514 every insert. Note:
//     this EF is currently only called from running-plan.html, so 'running_plan' is
//     the natural fit. If a future caller uses anthropic-proxy for a non-running-plan
//     surface, a code branch + a constraint addition will be needed.
//   - All other behaviour byte-identical to v15.
//
// CHANGES from v15 (still applies):
//   - 100KB payload cap.
//   - ai_interactions audit row written for each successful Anthropic response.
//
// CHANGES from v14 (still applies):
//   - verify_jwt: false at platform; internal JWT validation via supabase.auth.getUser().
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const ALLOWED_ORIGINS = new Set([
  "https://online.vyvehealth.co.uk",
  "https://www.vyvehealth.co.uk"
]);
const DEFAULT_ORIGIN = "https://online.vyvehealth.co.uk";
const MAX_BODY_BYTES = 102400;
function getCorsHeaders(req) {
  const origin = req.headers.get("origin") ?? "";
  const allowedOrigin = ALLOWED_ORIGINS.has(origin) ? origin : DEFAULT_ORIGIN;
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, apikey, content-type"
  };
}
function payloadTooLarge(req) {
  const cl = req.headers.get('content-length');
  if (!cl) return false;
  const n = Number(cl);
  return Number.isFinite(n) && n > MAX_BODY_BYTES;
}
async function writeAiInteraction(email, prompt_summary, recommendation, decision_log) {
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    await fetch(`${SUPABASE_URL}/rest/v1/ai_interactions`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        member_email: email,
        triggered_by: 'running_plan',
        persona: null,
        prompt_summary,
        recommendation,
        decision_log
      })
    });
  } catch (e) {
    console.warn('[anthropic-proxy] ai_interactions write failed:', e.message);
  }
}
Deno.serve(async (req)=>{
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, {
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
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) {
    return new Response(JSON.stringify({
      error: "Missing authorization token"
    }), {
      status: 401,
      headers: {
        ...cors,
        "Content-Type": "application/json"
      }
    });
  }
  const supabase = createClient(Deno.env.get("SUPABASE_URL"), Deno.env.get("SUPABASE_ANON_KEY"), {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  });
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return new Response(JSON.stringify({
      error: "Invalid or expired token"
    }), {
      status: 401,
      headers: {
        ...cors,
        "Content-Type": "application/json"
      }
    });
  }
  const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!anthropicKey) {
    return new Response(JSON.stringify({
      error: "Anthropic API key not configured"
    }), {
      status: 500,
      headers: {
        ...cors,
        "Content-Type": "application/json"
      }
    });
  }
  let body;
  try {
    body = await req.json();
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
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": anthropicKey,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify(body)
  });
  const data = await response.json();
  if (response.ok && user.email) {
    try {
      const model = String(body?.model ?? 'unknown');
      const max_tokens = Number(body?.max_tokens ?? 0);
      const sys = String(body?.system ?? '').slice(0, 200);
      const messages = Array.isArray(body?.messages) ? body.messages : [];
      const lastUser = messages.length > 0 ? String(messages[messages.length - 1]?.content ?? '').slice(0, 200) : '';
      const respText = String(data?.content?.[0]?.text ?? '').slice(0, 500);
      EdgeRuntime.waitUntil(writeAiInteraction(user.email.toLowerCase(), `${model} (${max_tokens} max_tokens)${sys ? ' | system: ' + sys : ''}`, respText, {
        model,
        max_tokens,
        response_status: response.status,
        last_user_excerpt: lastUser,
        usage: data?.usage ?? null
      }));
    } catch (e) {
      console.warn('[anthropic-proxy] audit log path failed:', e.message);
    }
  }
  return new Response(JSON.stringify(data), {
    status: response.status,
    headers: {
      ...cors,
      "Content-Type": "application/json"
    }
  });
});
