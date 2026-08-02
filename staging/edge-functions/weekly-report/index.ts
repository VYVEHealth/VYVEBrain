// VYVE Health — Weekly Report v3
// Changes from v2:
// - Optional ?to=email and ?cc=email override default REPORT_TO
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};
const REPORT_TO_DEFAULT = "team@vyvehealth.co.uk";
const EXCLUDED = [
  "test@test.com",
  "maketest@vyvehealth.co.uk",
  "team@vyvehealth.co.uk"
];
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
    success: false,
    error: "BREVO_API_KEY not set"
  }), {
    status: 500
  });
  let overrideWeekStart = null;
  let overrideTo = null;
  let overrideCc = null;
  try {
    const url = new URL(req.url);
    overrideWeekStart = url.searchParams.get("week_start");
    overrideTo = url.searchParams.get("to");
    overrideCc = url.searchParams.get("cc");
    if (req.method === "POST") {
      const ct = req.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        const body = await req.json().catch(()=>({}));
        if (body && typeof body.week_start === "string") overrideWeekStart = overrideWeekStart || body.week_start;
        if (body && typeof body.to === "string") overrideTo = overrideTo || body.to;
        if (body && typeof body.cc === "string") overrideCc = overrideCc || body.cc;
      }
    }
  } catch (_) {}
  if (overrideWeekStart && !/^\d{4}-\d{2}-\d{2}$/.test(overrideWeekStart)) {
    return new Response(JSON.stringify({
      success: false,
      error: "week_start must be YYYY-MM-DD"
    }), {
      status: 400,
      headers: corsHeaders
    });
  }
  let lastMon;
  if (overrideWeekStart) {
    const [y, m, d] = overrideWeekStart.split("-").map(Number);
    lastMon = new Date(Date.UTC(y, m - 1, d));
  } else {
    const now = new Date();
    const todayDow = now.getUTCDay();
    const daysToLastMon = todayDow === 0 ? 6 : todayDow - 1;
    lastMon = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - daysToLastMon - 7));
  }
  const lastSun = new Date(lastMon);
  lastSun.setUTCDate(lastMon.getUTCDate() + 6);
  const prevMon = new Date(lastMon);
  prevMon.setUTCDate(lastMon.getUTCDate() - 7);
  const prevSun = new Date(prevMon);
  prevSun.setUTCDate(prevMon.getUTCDate() + 6);
  const wStart = lastMon.toISOString();
  const wEnd = new Date(lastSun.getTime() + 86400000).toISOString();
  const pwStart = prevMon.toISOString();
  const pwEnd = new Date(prevSun.getTime() + 86400000).toISOString();
  const dateRange = `${lastMon.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC"
  })} – ${lastSun.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC"
  })}`;
  const subjectPrefix = overrideWeekStart ? "VYVE Weekly (backfill)" : "VYVE Weekly";
  try {
    const exFilter = `(${EXCLUDED.map((e)=>`\"${e}\"`).join(",")})`;
    const [totalM, newThisW, newPrevW, appOpened, habW, wrkW, carW, sesW, ciW, habPW, wrkPW, carPW, sesPW, reengW, reengPW, certsTotal, charityTotal, avgScores] = await Promise.all([
      sb.from("members").select("email", {
        count: "exact",
        head: true
      }).eq("subscription_status", "active").not("email", "in", exFilter),
      sb.from("members").select("email", {
        count: "exact",
        head: true
      }).gte("created_at", wStart).lt("created_at", wEnd).not("email", "in", exFilter),
      sb.from("members").select("email", {
        count: "exact",
        head: true
      }).gte("created_at", pwStart).lt("created_at", pwEnd).not("email", "in", exFilter),
      sb.from("members").select("email", {
        count: "exact",
        head: true
      }).eq("kahunas_qa_complete", true).eq("subscription_status", "active").not("email", "in", exFilter),
      sb.from("daily_habits").select("member_email").gte("logged_at", wStart).lt("logged_at", wEnd),
      sb.from("workouts").select("member_email").gte("logged_at", wStart).lt("logged_at", wEnd),
      sb.from("cardio").select("member_email").gte("logged_at", wStart).lt("logged_at", wEnd),
      sb.from("session_views").select("member_email").gte("logged_at", wStart).lt("logged_at", wEnd),
      sb.from("wellbeing_checkins").select("member_email").gte("logged_at", wStart).lt("logged_at", wEnd),
      sb.from("daily_habits").select("member_email").gte("logged_at", pwStart).lt("logged_at", pwEnd),
      sb.from("workouts").select("member_email").gte("logged_at", pwStart).lt("logged_at", pwEnd),
      sb.from("cardio").select("member_email").gte("logged_at", pwStart).lt("logged_at", pwEnd),
      sb.from("session_views").select("member_email").gte("logged_at", pwStart).lt("logged_at", pwEnd),
      sb.from("engagement_emails").select("stream,email_key").gte("sent_at", wStart).lt("sent_at", wEnd).eq("suppressed", false),
      sb.from("engagement_emails").select("stream,email_key").gte("sent_at", pwStart).lt("sent_at", pwEnd).eq("suppressed", false),
      sb.from("certificates").select("id", {
        count: "exact",
        head: true
      }),
      sb.from("certificates").select("id", {
        count: "exact",
        head: true
      }).eq("charity_moment_triggered", true),
      sb.from("weekly_scores").select("wellbeing_score,engagement_score").gte("logged_at", wStart).lt("logged_at", wEnd).not("member_email", "in", exFilter)
    ]);
    const cap = (rows, n)=>{
      const m = {};
      for (const r of rows)m[r.member_email] = (m[r.member_email] || 0) + 1;
      return Object.values(m).reduce((s, c)=>s + Math.min(c, n), 0);
    };
    const uniq = (rows)=>new Set(rows.map((r)=>r.member_email)).size;
    const actsW = cap(habW.data || [], 1) + cap(wrkW.data || [], 2) + cap(carW.data || [], 2) + cap(sesW.data || [], 2) + uniq(ciW.data || []);
    const actsPW = cap(habPW.data || [], 1) + cap(wrkPW.data || [], 2) + cap(carPW.data || [], 2) + cap(sesPW.data || [], 2);
    const activeWCount = new Set([
      ...habW.data || [],
      ...wrkW.data || [],
      ...sesW.data || [],
      ...ciW.data || []
    ].map((r)=>r.member_email)).size;
    const activePWCount = new Set([
      ...habPW.data || [],
      ...wrkPW.data || [],
      ...sesPW.data || []
    ].map((r)=>r.member_email)).size;
    const delta = (a, b)=>b === 0 ? "" : a > b ? `<span style="color:#1B7878;font-size:11px;"> +${a - b}</span>` : a < b ? `<span style="color:#C65D00;font-size:11px;"> ${a - b}</span>` : ` <span style="color:#7A9A9A;font-size:11px;">&#8213;</span>`;
    const scores = avgScores.data || [];
    const avgWell = scores.length ? (scores.reduce((s, r)=>s + (r.wellbeing_score || 0), 0) / scores.length).toFixed(1) : "n/a";
    const avgEng = scores.length ? Math.round(scores.reduce((s, r)=>s + (r.engagement_score || 0), 0) / scores.length) : "n/a";
    const reengByStream = {};
    for (const r of reengW.data || [])reengByStream[r.stream] = (reengByStream[r.stream] || 0) + 1;
    const streamNames = {
      A: "App not opened",
      B: "No activity",
      C1: "App dormant",
      C2: "Portal dormant",
      C3: "Both dormant"
    };
    const streamRows = Object.entries(reengByStream).map(([s, n])=>`<tr style="border-bottom:1px solid #EAF5F5;"><td style="padding:7px 10px;font-size:12px;font-weight:600;color:#0D2B2B;">${s}</td><td style="padding:7px 10px;font-size:12px;color:#5A7A7A;">${streamNames[s] || ""}</td><td style="padding:7px 10px;font-size:13px;font-weight:700;color:#1B7878;text-align:right;">${n}</td></tr>`).join("");
    const reengTotal = (reengW.data || []).length;
    const reengPWTotal = (reengPW.data || []).length;
    const appRate = totalM.count ? Math.round((appOpened.count || 0) / (totalM.count || 1) * 100) : 0;
    const checkinRate = totalM.count ? Math.round(uniq(ciW.data || []) / (totalM.count || 1) * 100) : 0;
    const html = W([
      HDR("Weekly Report", dateRange),
      SEC("Membership"),
      statRow([
        {
          label: "Total members",
          val: totalM.count || 0,
          sub: "active"
        },
        {
          label: "New this week",
          val: (newThisW.count || 0) + delta(newThisW.count || 0, newPrevW.count || 0),
          sub: `${newPrevW.count || 0} prev week`
        },
        {
          label: "App opened",
          val: `${appRate}%`,
          sub: `${appOpened.count || 0} of ${totalM.count || 0}`
        }
      ]),
      DIV,
      SEC("Engagement this week"),
      statRow([
        {
          label: "Active members",
          val: activeWCount + delta(activeWCount, activePWCount),
          sub: `${activePWCount} prev week`
        },
        {
          label: "Total activities",
          val: actsW + delta(actsW, actsPW),
          sub: `${actsPW} prev week`
        },
        {
          label: "Check-in rate",
          val: `${checkinRate}%`,
          sub: `${uniq(ciW.data || [])} members`
        },
        {
          label: "Avg wellbeing",
          val: avgWell,
          sub: `Avg engagement: ${avgEng}`
        }
      ]),
      DIV,
      SEC("Re-engagement this week"),
      `<tr><td style="padding:4px 28px 12px;"><p style="font-size:12px;color:#7A9A9A;margin:0 0 8px;">${reengTotal} emails sent${reengPWTotal > 0 ? ` (${reengPWTotal} prev week)` : ""}</p>${reengTotal > 0 ? `<table width="100%" style="border:1px solid #C8E4E4;border-radius:8px;overflow:hidden;"><thead><tr style="background:#EAF5F5;"><th style="padding:7px 10px;text-align:left;font-size:10px;color:#1B7878;font-weight:600;text-transform:uppercase;">Stream</th><th style="padding:7px 10px;text-align:left;font-size:10px;color:#1B7878;font-weight:600;text-transform:uppercase;">Reason</th><th style="padding:7px 10px;text-align:right;font-size:10px;color:#1B7878;font-weight:600;text-transform:uppercase;">Sent</th></tr></thead><tbody>${streamRows}</tbody></table>` : "<p style=\"font-size:12px;color:#7A9A9A;\">No re-engagement emails sent this week.</p>"}</td></tr>`,
      DIV,
      SEC("Charity mechanic"),
      statRow([
        {
          label: "Certificates earned",
          val: certsTotal.count || 0,
          sub: "all time"
        },
        {
          label: "Donated months",
          val: charityTotal.count || 0,
          sub: "triggered"
        }
      ]),
      FTR
    ].join(""));
    const toEmail = overrideTo || REPORT_TO_DEFAULT;
    const brevoBody = {
      sender: {
        name: "VYVE Health",
        email: "team@vyvehealth.co.uk"
      },
      to: [
        {
          email: toEmail
        }
      ],
      subject: `${subjectPrefix} — ${dateRange}`,
      htmlContent: html,
      tags: [
        "weekly-report"
      ]
    };
    if (overrideCc) brevoBody.cc = [
      {
        email: overrideCc
      }
    ];
    const br = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": BREVO,
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify(brevoBody)
    });
    if (!br.ok) {
      const t = await br.text();
      throw new Error(`Brevo ${br.status}: ${t}`);
    }
    return new Response(JSON.stringify({
      success: true,
      dateRange,
      backfill: !!overrideWeekStart,
      to: toEmail,
      cc: overrideCc,
      actsW,
      activeWCount,
      reengTotal
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  } catch (err) {
    console.error("[weekly-report v3]", err.message);
    return new Response(JSON.stringify({
      success: false,
      error: err.message
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
});
const W = (body)=>`<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="margin:0;padding:0;background:#F4FAFA;font-family:'Helvetica Neue',Arial,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#F4FAFA;padding:32px 16px;"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;">${body}</table></td></tr></table></body></html>`;
const HDR = (label, sub)=>`<tr><td style="background:#0D2B2B;padding:20px 28px;"><div style="font-family:Georgia,serif;font-size:18px;letter-spacing:5px;color:#fff;display:inline;">VYVE</div><span style="color:#7AB8B8;font-size:12px;margin-left:10px;">${label}</span><div style="color:#4A7A7A;font-size:11px;margin-top:4px;">${sub}</div></td></tr>`;
const SEC = (t)=>`<tr><td style="padding:6px 28px 0;"><div style="font-size:10px;color:#1B7878;font-weight:600;text-transform:uppercase;letter-spacing:2px;">${t}</div></td></tr>`;
const DIV = `<tr><td style="padding:0 28px;"><hr style="border:none;border-top:1px solid #EAF5F5;margin:12px 0;"></td></tr>`;
const FTR = `<tr><td style="background:#F4FAFA;padding:16px 28px;border-top:1px solid #C8E4E4;"><p style="margin:0;font-size:11px;color:#7A9A9A;">VYVE Health CIC · Weekly report · team@vyvehealth.co.uk</p></td></tr>`;
function statRow(items) {
  const cells = items.map((i)=>`<td style="text-align:center;padding:12px 8px;"><div style="font-size:22px;font-weight:700;color:#0D2B2B;font-family:Georgia,serif;">${i.val}</div><div style="font-size:11px;color:#0D2B2B;margin-top:2px;font-weight:600;">${i.label}</div><div style="font-size:10px;color:#7A9A9A;">${i.sub}</div></td>`).join("");
  return `<tr><td style="padding:4px 28px;"><table width="100%" style="background:#F4FAFA;border-radius:8px;"><tr>${cells}</tr></table></td></tr>`;
}
