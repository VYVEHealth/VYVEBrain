// VYVE Health — Monthly Report v2
// Changes from v1:
// - Optional ?to / ?cc / ?month_start (or POST body) for backfill + recipient override
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
  let overrideMonthStart = null;
  let overrideTo = null;
  let overrideCc = null;
  try {
    const url = new URL(req.url);
    overrideMonthStart = url.searchParams.get("month_start");
    overrideTo = url.searchParams.get("to");
    overrideCc = url.searchParams.get("cc");
    if (req.method === "POST") {
      const ct = req.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        const body = await req.json().catch(()=>({}));
        if (body && typeof body.month_start === "string") overrideMonthStart = overrideMonthStart || body.month_start;
        if (body && typeof body.to === "string") overrideTo = overrideTo || body.to;
        if (body && typeof body.cc === "string") overrideCc = overrideCc || body.cc;
      }
    }
  } catch (_) {}
  const now = new Date();
  let mStart;
  if (overrideMonthStart) {
    const [y, m] = overrideMonthStart.split("-").map(Number);
    mStart = new Date(Date.UTC(y, m - 1, 1));
  } else {
    mStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  }
  const mEnd = new Date(Date.UTC(mStart.getUTCFullYear(), mStart.getUTCMonth() + 1, 1));
  const pmStart = new Date(Date.UTC(mStart.getUTCFullYear(), mStart.getUTCMonth() - 1, 1));
  const pmEnd = mStart;
  const monthLabel = mStart.toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC"
  });
  const exFilter = `(${EXCLUDED.map((e)=>`\"${e}\"`).join(",")})`;
  const subjectPrefix = overrideMonthStart ? "VYVE Monthly (backfill)" : "VYVE Monthly";
  try {
    const [totalM, totalPrevM, newThisM, newPrevM, appOpened, habM, wrkM, carM, sesM, ciM, habPM, wrkPM, carPM, sesPM, reengM, reengPM, certsTotal, charityTotal, certsM, byCompany, streamDist, avgScoresM, avgScoresPM] = await Promise.all([
      sb.from("members").select("email", {
        count: "exact",
        head: true
      }).eq("subscription_status", "active").not("email", "in", exFilter),
      sb.from("members").select("email", {
        count: "exact",
        head: true
      }).lt("created_at", mStart.toISOString()).eq("subscription_status", "active").not("email", "in", exFilter),
      sb.from("members").select("email,first_name,company").gte("created_at", mStart.toISOString()).lt("created_at", mEnd.toISOString()).not("email", "in", exFilter),
      sb.from("members").select("email", {
        count: "exact",
        head: true
      }).gte("created_at", pmStart.toISOString()).lt("created_at", pmEnd.toISOString()).not("email", "in", exFilter),
      sb.from("members").select("email", {
        count: "exact",
        head: true
      }).eq("kahunas_qa_complete", true).eq("subscription_status", "active").not("email", "in", exFilter),
      sb.from("daily_habits").select("member_email").gte("logged_at", mStart.toISOString()).lt("logged_at", mEnd.toISOString()),
      sb.from("workouts").select("member_email").gte("logged_at", mStart.toISOString()).lt("logged_at", mEnd.toISOString()),
      sb.from("cardio").select("member_email").gte("logged_at", mStart.toISOString()).lt("logged_at", mEnd.toISOString()),
      sb.from("session_views").select("member_email").gte("logged_at", mStart.toISOString()).lt("logged_at", mEnd.toISOString()),
      sb.from("wellbeing_checkins").select("member_email").gte("logged_at", mStart.toISOString()).lt("logged_at", mEnd.toISOString()),
      sb.from("daily_habits").select("member_email").gte("logged_at", pmStart.toISOString()).lt("logged_at", pmEnd.toISOString()),
      sb.from("workouts").select("member_email").gte("logged_at", pmStart.toISOString()).lt("logged_at", pmEnd.toISOString()),
      sb.from("cardio").select("member_email").gte("logged_at", pmStart.toISOString()).lt("logged_at", pmEnd.toISOString()),
      sb.from("session_views").select("member_email").gte("logged_at", pmStart.toISOString()).lt("logged_at", pmEnd.toISOString()),
      sb.from("engagement_emails").select("stream,email_key,member_email").gte("sent_at", mStart.toISOString()).lt("sent_at", mEnd.toISOString()).eq("suppressed", false),
      sb.from("engagement_emails").select("stream").gte("sent_at", pmStart.toISOString()).lt("sent_at", pmEnd.toISOString()).eq("suppressed", false),
      sb.from("certificates").select("id", {
        count: "exact",
        head: true
      }),
      sb.from("certificates").select("id", {
        count: "exact",
        head: true
      }).eq("charity_moment_triggered", true),
      sb.from("certificates").select("id", {
        count: "exact",
        head: true
      }).gte("earned_at", mStart.toISOString()).lt("earned_at", mEnd.toISOString()),
      sb.from("members").select("company").not("email", "in", exFilter).eq("subscription_status", "active").not("company", "is", "null"),
      sb.from("engagement_emails").select("member_email,stream,email_key").eq("suppressed", false),
      sb.from("weekly_scores").select("wellbeing_score,engagement_score").gte("logged_at", mStart.toISOString()).lt("logged_at", mEnd.toISOString()).not("member_email", "in", exFilter),
      sb.from("weekly_scores").select("wellbeing_score,engagement_score").gte("logged_at", pmStart.toISOString()).lt("logged_at", pmEnd.toISOString()).not("member_email", "in", exFilter)
    ]);
    const cap = (rows, n)=>{
      const m = {};
      for (const r of rows)m[r.member_email] = (m[r.member_email] || 0) + 1;
      return Object.values(m).reduce((s, c)=>s + Math.min(c, n), 0);
    };
    const uniq = (rows)=>new Set(rows.map((r)=>r.member_email)).size;
    const avg = (rows, key)=>rows.length ? +(rows.reduce((s, r)=>s + (r[key] || 0), 0) / rows.length).toFixed(1) : null;
    const actsM = cap(habM.data || [], 1) + cap(wrkM.data || [], 2) + cap(carM.data || [], 2) + cap(sesM.data || [], 2) + uniq(ciM.data || []);
    const actsPM = cap(habPM.data || [], 1) + cap(wrkPM.data || [], 2) + cap(carPM.data || [], 2) + cap(sesPM.data || [], 2);
    const activeMCount = new Set([
      ...habM.data || [],
      ...wrkM.data || [],
      ...sesM.data || [],
      ...ciM.data || []
    ].map((r)=>r.member_email)).size;
    const activePMCount = new Set([
      ...habPM.data || [],
      ...wrkPM.data || [],
      ...sesPM.data || []
    ].map((r)=>r.member_email)).size;
    const total = totalM.count || 0;
    const retentionRate = total > 0 ? Math.round(activeMCount / total * 100) : 0;
    const actsPerMember = activeMCount > 0 ? +(actsM / activeMCount).toFixed(1) : 0;
    const appRate = total > 0 ? Math.round((appOpened.count || 0) / total * 100) : 0;
    const growthPct = (totalPrevM.count || 0) > 0 ? Math.round((total - (totalPrevM.count || 0)) / (totalPrevM.count || 1) * 100) : null;
    const compMap = {};
    for (const r of byCompany.data || [])if (r.company) compMap[r.company] = (compMap[r.company] || 0) + 1;
    const compRows = Object.entries(compMap).sort((a, b)=>b[1] - a[1]).map(([c, n])=>`<tr style="border-bottom:1px solid #EAF5F5;"><td style="padding:7px 10px;font-size:13px;color:#0D2B2B;">${c}</td><td style="padding:7px 10px;font-size:13px;font-weight:700;color:#1B7878;text-align:right;">${n}</td></tr>`).join("");
    const newMList = newThisM.data || [];
    const newMRows = newMList.length === 0 ? `<tr><td colspan="2" style="padding:10px;text-align:center;color:#7A9A9A;font-size:13px;">No new members this month.</td></tr>` : newMList.map((m)=>`<tr style="border-bottom:1px solid #EAF5F5;"><td style="padding:7px 10px;font-size:13px;color:#0D2B2B;">${m.first_name || m.email}</td><td style="padding:7px 10px;font-size:12px;color:#5A7A7A;">${m.company || ""}</td></tr>`).join("");
    const latestStream = {};
    for (const r of (streamDist.data || []).reverse())if (!latestStream[r.member_email]) latestStream[r.member_email] = r.stream;
    const streamCount = {};
    for (const s of Object.values(latestStream))streamCount[s] = (streamCount[s] || 0) + 1;
    const streamNames = {
      A: "App not opened",
      B: "No activity yet",
      C1: "App dormant, portal active",
      C2: "Portal dormant, app active",
      C3: "Both dormant"
    };
    const streamRows2 = Object.entries(streamCount).sort().map(([s, n])=>`<tr style="border-bottom:1px solid #EAF5F5;"><td style="padding:7px 10px;font-size:12px;font-weight:600;color:#0D2B2B;">${s}</td><td style="padding:7px 10px;font-size:12px;color:#5A7A7A;">${streamNames[s] || ""}</td><td style="padding:7px 10px;font-size:13px;font-weight:700;color:#C65D00;text-align:right;">${n}</td></tr>`).join("");
    const wellM = avg(avgScoresM.data || [], "wellbeing_score");
    const wellPM = avg(avgScoresPM.data || [], "wellbeing_score");
    const engM = avg(avgScoresM.data || [], "engagement_score");
    const wellTrend = wellM && wellPM ? wellM > wellPM ? "\u2191" : wellM < wellPM ? "\u2193" : "\u2013" : "";
    const d = (a, b)=>a > b ? `<span style="color:#1B7878;"> +${a - b}</span>` : a < b ? `<span style="color:#C65D00;"> ${a - b}</span>` : "";
    const html = W([
      HDR("Monthly Report", monthLabel),
      SEC("Growth"),
      statRow([
        {
          label: "Total members",
          val: total + (growthPct !== null ? `<span style="font-size:12px;color:#1B7878;"> ${growthPct > 0 ? "+" : ""}${growthPct}%</span>` : ""),
          sub: "active subscriptions"
        },
        {
          label: "New this month",
          val: newMList.length + d(newMList.length, newPrevM.count || 0),
          sub: `${newPrevM.count || 0} prev month`
        },
        {
          label: "App opened rate",
          val: `${appRate}%`,
          sub: `${appOpened.count || 0} members`
        }
      ]),
      `<tr><td style="padding:0 28px 12px;"><table width="100%" style="border:1px solid #C8E4E4;border-radius:8px;overflow:hidden;"><thead><tr style="background:#EAF5F5;"><th style="padding:7px 10px;text-align:left;font-size:10px;color:#1B7878;font-weight:600;text-transform:uppercase;">New member</th><th style="padding:7px 10px;text-align:left;font-size:10px;color:#1B7878;font-weight:600;text-transform:uppercase;">Company</th></tr></thead><tbody>${newMRows}</tbody></table></td></tr>`,
      `<tr><td style="padding:0 28px 12px;"><table width="100%" style="border:1px solid #C8E4E4;border-radius:8px;overflow:hidden;"><thead><tr style="background:#EAF5F5;"><th style="padding:7px 10px;text-align:left;font-size:10px;color:#1B7878;font-weight:600;text-transform:uppercase;">Company</th><th style="padding:7px 10px;text-align:right;font-size:10px;color:#1B7878;font-weight:600;text-transform:uppercase;">Members</th></tr></thead><tbody>${compRows}</tbody></table></td></tr>`,
      DIV,
      SEC("Engagement quality"),
      statRow([
        {
          label: "Active members",
          val: activeMCount + d(activeMCount, activePMCount),
          sub: `${retentionRate}% retention`
        },
        {
          label: "Total activities",
          val: actsM + d(actsM, actsPM),
          sub: `${actsPM} prev month`
        },
        {
          label: "Per active member",
          val: actsPerMember,
          sub: "avg activities"
        },
        {
          label: "Avg wellbeing",
          val: wellM !== null ? `${wellM} ${wellTrend}` : "n/a",
          sub: wellPM !== null ? `${wellPM} prev month` : "first month"
        }
      ]),
      DIV,
      SEC("Re-engagement health"),
      statRow([
        {
          label: "Emails sent",
          val: (reengM.data || []).length + d((reengM.data || []).length, (reengPM.data || []).length),
          sub: `${(reengPM.data || []).length} prev month`
        },
        {
          label: "Members in streams",
          val: Object.values(streamCount).reduce((s, n)=>s + n, 0),
          sub: "currently in re-engagement"
        }
      ]),
      streamRows2.length > 0 ? `<tr><td style="padding:0 28px 12px;"><table width="100%" style="border:1px solid #C8E4E4;border-radius:8px;overflow:hidden;"><thead><tr style="background:#EAF5F5;"><th style="padding:7px 10px;text-align:left;font-size:10px;color:#1B7878;font-weight:600;text-transform:uppercase;">Stream</th><th style="padding:7px 10px;text-align:left;font-size:10px;color:#1B7878;font-weight:600;text-transform:uppercase;">Reason</th><th style="padding:7px 10px;text-align:right;font-size:10px;color:#1B7878;font-weight:600;text-transform:uppercase;">Members</th></tr></thead><tbody>${streamRows2}</tbody></table></td></tr>` : "<tr><td></td></tr>",
      DIV,
      SEC("Charity \u0026 social impact"),
      statRow([
        {
          label: "Certificates earned",
          val: certsTotal.count || 0,
          sub: "all time"
        },
        {
          label: "This month",
          val: certsM.count || 0,
          sub: "earned"
        },
        {
          label: "Donated months",
          val: charityTotal.count || 0,
          sub: "total donated"
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
          email: toEmail,
          name: "VYVE Team"
        }
      ],
      subject: `${subjectPrefix} — ${monthLabel}`,
      htmlContent: html,
      tags: [
        "monthly-report"
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
      month: monthLabel,
      backfill: !!overrideMonthStart,
      to: toEmail,
      cc: overrideCc,
      total,
      actsM,
      activeMCount
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  } catch (err) {
    console.error("[monthly-report v2]", err.message);
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
const FTR = `<tr><td style="background:#F4FAFA;padding:16px 28px;border-top:1px solid #C8E4E4;"><p style="margin:0;font-size:11px;color:#7A9A9A;">VYVE Health CIC · Monthly report · team@vyvehealth.co.uk</p></td></tr>`;
function statRow(items) {
  const cells = items.map((i)=>`<td style="text-align:center;padding:12px 8px;"><div style="font-size:22px;font-weight:700;color:#0D2B2B;font-family:Georgia,serif;">${i.val}</div><div style="font-size:11px;color:#0D2B2B;margin-top:2px;font-weight:600;">${i.label}</div><div style="font-size:10px;color:#7A9A9A;">${i.sub}</div></td>`).join("");
  return `<tr><td style="padding:4px 28px;"><table width="100%" style="background:#F4FAFA;border-radius:8px;"><tr>${cells}</tr></table></td></tr>`;
}
