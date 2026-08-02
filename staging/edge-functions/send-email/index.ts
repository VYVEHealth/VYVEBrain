// VYVE Health — send-email v4
// Changes from v3: Logo image replaces text "VYVE" in email header
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";
const FROM_EMAIL = "team@vyvehealth.co.uk";
const FROM_NAME = "VYVE Health";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
// Restrict direct HTTP handler to internal callers only
const ALLOWED_ORIGINS = new Set([
  "https://online.vyvehealth.co.uk",
  "https://www.vyvehealth.co.uk"
]);
function getCorsHeaders(req) {
  const origin = req.headers.get("origin") ?? "";
  const allowedOrigin = ALLOWED_ORIGINS.has(origin) ? origin : "https://online.vyvehealth.co.uk";
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  };
}
// ── Goal → activity priority classifier ─────────────────────────────────────────────────
export function classifyGoal(goalFocus) {
  const g = (goalFocus || "").toLowerCase();
  const rules = [
    {
      keys: [
        "weight",
        "lose",
        "fat",
        "slim",
        "tone",
        "calorie",
        "diet"
      ],
      category: "body_composition",
      primary: "habits",
      secondary: "cardio",
      tertiary: "workouts"
    },
    {
      keys: [
        "muscle",
        "strength",
        "lift",
        "build",
        "bulk",
        "power"
      ],
      category: "strength",
      primary: "workouts",
      secondary: "habits",
      tertiary: "cardio"
    },
    {
      keys: [
        "run",
        "race",
        "5k",
        "10k",
        "marathon",
        "cardio",
        "endurance",
        "fitness"
      ],
      category: "endurance",
      primary: "cardio",
      secondary: "workouts",
      tertiary: "habits"
    },
    {
      keys: [
        "stress",
        "anxiety",
        "mental",
        "mind",
        "calm",
        "relax",
        "balance"
      ],
      category: "mental_wellbeing",
      primary: "habits",
      secondary: "cardio",
      tertiary: "workouts"
    },
    {
      keys: [
        "sleep",
        "rest",
        "recovery",
        "energy",
        "fatigue",
        "tired"
      ],
      category: "recovery",
      primary: "habits",
      secondary: "cardio",
      tertiary: "workouts"
    },
    {
      keys: [
        "health",
        "wellbeing",
        "lifestyle",
        "general",
        "overall",
        "better"
      ],
      category: "general_health",
      primary: "habits",
      secondary: "cardio",
      tertiary: "workouts"
    }
  ];
  for (const rule of rules){
    if (rule.keys.some((k)=>g.includes(k))) {
      return {
        primary: rule.primary,
        secondary: rule.secondary,
        tertiary: rule.tertiary,
        category: rule.category
      };
    }
  }
  return {
    primary: "habits",
    secondary: "workouts",
    tertiary: "cardio",
    category: "unknown"
  };
}
// ── Persona-voiced AI line generator ─────────────────────────────────────────────────
export async function generatePersonaLine(systemPrompt, userMessage, maxTokens = 150) {
  const ANTHROPIC_KEY = Deno.env.get("ANTHROPIC_API_KEY");
  if (!ANTHROPIC_KEY) {
    console.warn("[send-email] ANTHROPIC_API_KEY not set — using fallback copy");
    return "";
  }
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: userMessage
          }
        ]
      })
    });
    if (!res.ok) {
      const err = await res.text();
      console.error(`[send-email] Anthropic API error ${res.status}: ${err}`);
      return "";
    }
    const data = await res.json();
    return data.content?.[0]?.text?.trim() || "";
  } catch (err) {
    console.error("[send-email] generatePersonaLine failed:", err.message);
    return "";
  }
}
// ── Brevo sender ─────────────────────────────────────────────────────────────────────
export async function sendBrevoEmail(to, name, subject, html, tags) {
  const KEY = Deno.env.get("BREVO_API_KEY");
  if (!KEY) throw new Error("BREVO_API_KEY not set");
  const r = await fetch(BREVO_API_URL, {
    method: "POST",
    headers: {
      "api-key": KEY,
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify({
      sender: {
        name: FROM_NAME,
        email: FROM_EMAIL
      },
      to: [
        {
          email: to,
          name
        }
      ],
      subject,
      htmlContent: html,
      tags
    })
  });
  const d = await r.json().catch(()=>({}));
  if (!r.ok) throw new Error(`Brevo ${r.status}: ${JSON.stringify(d)}`);
  return d.messageId || null;
}
// ── Email HTML helpers (shared with scheduler) ─────────────────────────────────────────
export function wrap(body) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;background:#F4FAFA;font-family:'Helvetica Neue',Arial,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#F4FAFA;padding:40px 20px;"><tr><td align="center"><table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 16px rgba(13,43,43,0.08);"><tr><td style="background:#0D2B2B;padding:24px 32px;"><img src="https://online.vyvehealth.co.uk/logo.png" alt="VYVE Health" style="height:36px;display:block;" /></td></tr><tr><td style="padding:32px;">${body}</td></tr><tr><td style="background:#F4FAFA;padding:20px 32px;border-top:1px solid #C8E4E4;"><p style="margin:0;font-size:12px;color:#7A9A9A;">VYVE Health CIC &nbsp;&middot;&nbsp; team@vyvehealth.co.uk<br>ICO Registration No. 00013608608</p></td></tr></table></td></tr></table></body></html>`;
}
export const p = (t)=>`<p style="margin:0 0 16px;font-size:15px;color:#3A5A5A;line-height:1.7;">${t}</p>`;
export const h2 = (t)=>`<h2 style="margin:0 0 20px;font-size:22px;font-family:Georgia,serif;color:#0D2B2B;font-weight:400;">${t}</h2>`;
export const cta = (label, href)=>`<div style="text-align:center;margin:28px 0;"><a href="${href}" style="background:#0D2B2B;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600;display:inline-block;">${label} &rarr;</a></div>`;
// ── Direct HTTP handler (for ad-hoc test sends, internal scheduler calls) ─────────────────
serve(async (req)=>{
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response("ok", {
    headers: corsHeaders
  });
  // Auth check — require service role key or valid internal bearer
  const authHeader = req.headers.get("Authorization") ?? "";
  const providedKey = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!providedKey || providedKey !== SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({
      success: false,
      error: "Unauthorized"
    }), {
      status: 401,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
  try {
    const KEY = Deno.env.get("BREVO_API_KEY");
    if (!KEY) throw new Error("BREVO_API_KEY not set");
    const body = await req.json().catch(()=>({}));
    const toEmail = body.to || "team@vyvehealth.co.uk";
    const toName = body.name || "VYVE Team";
    const subject = body.subject || "VYVE Health — send-email test";
    const htmlBody = body.html || wrap(`${h2("Test email")}${p("send-email v4 is live. Logo header active.")}`);
    const tags = body.tags || [
      "test"
    ];
    const msgId = await sendBrevoEmail(toEmail, toName, subject, htmlBody, tags);
    console.log(`[send-email] Sent to ${toEmail} — messageId: ${msgId}`);
    return new Response(JSON.stringify({
      success: true,
      messageId: msgId,
      to: toEmail,
      subject
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  } catch (err) {
    console.error("[send-email] Error:", err.message);
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
