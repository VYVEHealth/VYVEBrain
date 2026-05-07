// VYVE Health — Email Health Watchdog v1
// Runs every 30 min via pg_cron. Checks for silent failures in the email pipeline.
// Sends multi-recipient alerts to dean+lewis+team if anything looks wrong.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};
// Multi-recipient: even if one inbox is broken, the others should get it
const ALERT_TO = "deanonbrown@hotmail.com";
const ALERT_CC = [
  "lewisvines@hotmail.com",
  "team@vyvehealth.co.uk"
];
// Suppression: don't fire the same alert >1x per 6 hours
const SUPPRESS_HOURS = 6;
serve(async (req)=>{
  if (req.method === "OPTIONS") return new Response("ok", {
    headers: corsHeaders
  });
  const sb = createClient(Deno.env.get("SUPABASE_URL"), Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: {
      persistSession: false
    }
  });
  const BREVO = Deno.env.get("BREVO_API_KEY");
  if (!BREVO) return new Response(JSON.stringify({
    error: "BREVO_API_KEY not set"
  }), {
    status: 500
  });
  const issues = [];
  const now = new Date();
  // ============== CHECK 1: Daily report delivery ==============
  // Last successful daily-report `delivered` event in Brevo within the last 26h?
  try {
    const yesterday = new Date(now.getTime() - 26 * 3600 * 1000).toISOString().slice(0, 10);
    const today = now.toISOString().slice(0, 10);
    const r = await brevoGet(`/v3/smtp/statistics/events?limit=20&tags=daily-report&event=delivered&startDate=${yesterday}&endDate=${today}`, BREVO);
    const events = r?.events ?? [];
    const teamDelivered = events.find((e)=>e.email === "team@vyvehealth.co.uk");
    if (!teamDelivered) {
      issues.push({
        severity: "critical",
        code: "daily_report_not_delivered_24h",
        title: "Daily report not delivered to team@vyvehealth.co.uk in last 26h",
        detail: `No 'delivered' event with tag 'daily-report' to team@ found in last 26h. Cron should run daily at 08:05 UTC. Either cron failed or Brevo couldn't deliver.`
      });
    }
  } catch (e) {
    issues.push({
      severity: "warn",
      code: "check1_error",
      title: "Daily-report check failed",
      detail: e.message
    });
  }
  // ============== CHECK 2: Recent hard bounces to team@ ==============
  try {
    const startDate = new Date(now.getTime() - 24 * 3600 * 1000).toISOString().slice(0, 10);
    const today = now.toISOString().slice(0, 10);
    const r = await brevoGet(`/v3/smtp/statistics/events?limit=20&email=team@vyvehealth.co.uk&event=hardBounces&startDate=${startDate}&endDate=${today}`, BREVO);
    const events = r?.events ?? [];
    if (events.length > 0) {
      issues.push({
        severity: "critical",
        code: "team_hardbounce",
        title: `${events.length} hard bounces to team@vyvehealth.co.uk in last 24h`,
        detail: `Latest reason: ${(events[0].reason || '').slice(0, 200)}`
      });
    }
  } catch (e) {
    issues.push({
      severity: "warn",
      code: "check2_error",
      title: "Bounce check failed",
      detail: e.message
    });
  }
  // ============== CHECK 3: team@ on Brevo blocklist ==============
  try {
    const r = await brevoGet(`/v3/smtp/blockedContacts?limit=50`, BREVO);
    const contacts = r?.contacts ?? [];
    const teamBlocked = contacts.find((c)=>c.email === "team@vyvehealth.co.uk");
    if (teamBlocked) {
      issues.push({
        severity: "critical",
        code: "team_on_blocklist",
        title: "team@vyvehealth.co.uk is on Brevo blocked-contacts list",
        detail: `Reason: ${teamBlocked.reason?.code || '?'} | blockedAt: ${teamBlocked.blockedAt}. Future automated emails to team@ will be silently dropped until unblocked.`
      });
    }
  } catch (e) {
    issues.push({
      severity: "warn",
      code: "check3_error",
      title: "Blocklist check failed",
      detail: e.message
    });
  }
  // ============== CHECK 4: Cron job failures in last 6h ==============
  try {
    const { data: failures } = await sb.rpc("watchdog_cron_failures", {
      hours_back: 6
    });
    if (failures && failures.length > 0) {
      const summary = failures.slice(0, 5).map((f)=>`${f.jobname}: ${f.return_message?.slice(0, 80)}`).join("; ");
      issues.push({
        severity: "critical",
        code: "cron_failures",
        title: `${failures.length} cron job failure(s) in last 6h`,
        detail: summary
      });
    }
  } catch (e) {
    // RPC may not exist yet — skip gracefully
    console.warn("[watchdog] cron-failures check skipped:", e.message);
  }
  // ============== CHECK 5: Hard bounce rate to any auto-email ==============
  // If Brevo bounces >5 in last hour across our tags, something's broken
  try {
    const hourAgo = new Date(now.getTime() - 3600 * 1000);
    const startDate = hourAgo.toISOString().slice(0, 10);
    const today = now.toISOString().slice(0, 10);
    const r = await brevoGet(`/v3/smtp/statistics/events?limit=50&event=hardBounces&startDate=${startDate}&endDate=${today}`, BREVO);
    const events = r?.events ?? [];
    const recent = events.filter((e)=>new Date(e.date) > hourAgo);
    if (recent.length >= 5) {
      issues.push({
        severity: "warn",
        code: "bounce_spike",
        title: `${recent.length} hard bounces across all auto-emails in last hour`,
        detail: `Sample recipients: ${[
          ...new Set(recent.slice(0, 8).map((e)=>e.email))
        ].join(', ')}`
      });
    }
  } catch (e) {
    issues.push({
      severity: "warn",
      code: "check5_error",
      title: "Bounce-spike check failed",
      detail: e.message
    });
  }
  // No issues? Done.
  if (issues.length === 0) {
    return new Response(JSON.stringify({
      success: true,
      checked_at: now.toISOString(),
      issues: 0
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
  // ============== Suppression: skip alerts already fired in last 6h ==============
  const cutoff = new Date(now.getTime() - SUPPRESS_HOURS * 3600 * 1000).toISOString();
  const { data: recent } = await sb.from("watchdog_alerts").select("code,fired_at").gte("fired_at", cutoff);
  const recentCodes = new Set((recent || []).map((r)=>r.code));
  const newIssues = issues.filter((i)=>!recentCodes.has(i.code));
  if (newIssues.length === 0) {
    return new Response(JSON.stringify({
      success: true,
      issues: issues.length,
      suppressed: issues.length,
      sent: 0
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
  // ============== Send alert email ==============
  const html = buildAlertHtml(newIssues, now);
  const subject = `\u{1F6A8} VYVE Email Pipeline Alert \u2014 ${newIssues.length} issue${newIssues.length > 1 ? 's' : ''} detected`;
  const sent = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": BREVO,
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify({
      sender: {
        name: "VYVE Watchdog",
        email: "team@vyvehealth.co.uk"
      },
      to: [
        {
          email: ALERT_TO
        }
      ],
      cc: ALERT_CC.map((e)=>({
          email: e
        })),
      subject,
      htmlContent: html,
      tags: [
        "watchdog-alert"
      ]
    })
  });
  // Record fired alerts so we don't repeat for SUPPRESS_HOURS
  for (const i of newIssues){
    await sb.from("watchdog_alerts").insert({
      code: i.code,
      severity: i.severity,
      title: i.title,
      detail: i.detail,
      fired_at: now.toISOString()
    });
  }
  return new Response(JSON.stringify({
    success: sent.ok,
    issues: issues.length,
    new_issues: newIssues.length,
    suppressed: issues.length - newIssues.length,
    issues_detail: newIssues
  }), {
    status: 200,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json"
    }
  });
});
async function brevoGet(path, key) {
  const r = await fetch(`https://api.brevo.com${path}`, {
    headers: {
      "api-key": key,
      Accept: "application/json"
    }
  });
  if (!r.ok) throw new Error(`Brevo ${path} \u2192 ${r.status}`);
  return r.json();
}
function buildAlertHtml(issues, now) {
  const rows = issues.map((i)=>{
    const colour = i.severity === "critical" ? "#C65D00" : "#C9A84C";
    const icon = i.severity === "critical" ? "\u{1F534}" : "\u{1F7E0}";
    return `<tr style="border-bottom:1px solid #EAF5F5;"><td style="padding:14px 18px;vertical-align:top;"><div style="font-size:14px;font-weight:700;color:${colour};margin-bottom:4px;">${icon} ${i.title}</div><div style="font-size:12px;color:#3A5A5A;line-height:1.6;">${i.detail}</div><div style="font-size:10px;color:#7A9A9A;margin-top:6px;">code: ${i.code}</div></td></tr>`;
  }).join("");
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="margin:0;padding:0;background:#F4FAFA;font-family:'Helvetica Neue',Arial,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#F4FAFA;padding:32px 16px;"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;"><tr><td style="background:#0D2B2B;padding:20px 28px;"><div style="font-family:Georgia,serif;font-size:18px;letter-spacing:5px;color:#fff;">VYVE</div><span style="color:#7AB8B8;font-size:12px;">Email Watchdog Alert</span><div style="color:#4A7A7A;font-size:11px;margin-top:4px;">${now.toUTCString()}</div></td></tr><tr><td style="padding:20px 28px;"><p style="margin:0 0 16px;font-size:14px;color:#3A5A5A;line-height:1.6;">The email watchdog detected ${issues.length} issue${issues.length > 1 ? 's' : ''} with the email pipeline. Each alert is suppressed for ${SUPPRESS_HOURS}h after firing once.</p><table width="100%" style="border:1px solid #C8E4E4;border-radius:8px;overflow:hidden;">${rows}</table><p style="margin:18px 0 0;font-size:11px;color:#7A9A9A;">Quick checks: Brevo blocked-contacts page, Supabase cron.job_run_details, recent Brevo events filtered by tag.</p></td></tr><tr><td style="background:#F4FAFA;padding:14px 28px;border-top:1px solid #C8E4E4;"><p style="margin:0;font-size:11px;color:#7A9A9A;">VYVE Health CIC \u00b7 Email watchdog \u00b7 Runs every 30 min</p></td></tr></table></td></tr></table></body></html>`;
}
