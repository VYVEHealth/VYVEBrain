// VYVE Health — Daily Report v8
// Changes from v7:
// - Optional ?to=email and ?cc=email params (or POST body {to, cc}) override default REPORT_TO recipient
// - Used for backfill catch-up to a personal address while team@ Brevo cache clears
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
    status: 500,
    headers: corsHeaders
  });
  let overrideDate = null;
  let overrideTo = null;
  let overrideCc = null;
  try {
    const url = new URL(req.url);
    overrideDate = url.searchParams.get("date");
    overrideTo = url.searchParams.get("to");
    overrideCc = url.searchParams.get("cc");
    if (req.method === "POST") {
      const ct = req.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        const body = await req.json().catch(()=>({}));
        if (body && typeof body.date === "string") overrideDate = overrideDate || body.date;
        if (body && typeof body.to === "string") overrideTo = overrideTo || body.to;
        if (body && typeof body.cc === "string") overrideCc = overrideCc || body.cc;
      }
    }
  } catch (_) {}
  if (overrideDate && !/^\d{4}-\d{2}-\d{2}$/.test(overrideDate)) {
    return new Response(JSON.stringify({
      success: false,
      error: "date must be YYYY-MM-DD"
    }), {
      status: 400,
      headers: corsHeaders
    });
  }
  const now = new Date();
  let yest;
  if (overrideDate) {
    const [y, m, d] = overrideDate.split("-").map(Number);
    yest = new Date(Date.UTC(y, m - 1, d));
  } else {
    yest = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1));
  }
  const yestStr = yest.toISOString().slice(0, 10);
  const yestMid = new Date(Date.UTC(yest.getUTCFullYear(), yest.getUTCMonth(), yest.getUTCDate()));
  const todayMid = new Date(yestMid.getTime() + 86400000);
  const dow = yest.getUTCDay();
  const dfm = (dow + 6) % 7;
  const wMon = new Date(yest);
  wMon.setUTCDate(yest.getUTCDate() - dfm);
  const wSun = new Date(wMon);
  wSun.setUTCDate(wMon.getUTCDate() + 6);
  const dateLabel = yest.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC"
  });
  const subjectPrefix = overrideDate ? "VYVE Daily (backfill)" : "VYVE Daily";
  try {
    const [h, w, c, s, ci, newM, totalM, reeng, aiCheckins, aiOnboarding, hDetail, wDetail, cDetail, sDetail] = await Promise.all([
      sb.from("daily_habits").select("member_email").eq("activity_date", yestStr),
      sb.from("workouts").select("member_email").eq("activity_date", yestStr),
      sb.from("cardio").select("member_email").eq("activity_date", yestStr),
      sb.from("session_views").select("member_email").eq("activity_date", yestStr),
      sb.from("wellbeing_checkins").select("member_email").gte("activity_date", wMon.toISOString().slice(0, 10)).lte("activity_date", wSun.toISOString().slice(0, 10)),
      sb.from("members").select("email,first_name,last_name,company").gte("created_at", yestMid.toISOString()).lt("created_at", todayMid.toISOString()).not("email", "in", `(${EXCLUDED.map((e)=>`\"${e}\"`).join(",")})`),
      sb.from("members").select("email", {
        count: "exact",
        head: true
      }).eq("subscription_status", "active").not("email", "in", `(${EXCLUDED.map((e)=>`\"${e}\"`).join(",")})`),
      sb.from("engagement_emails").select("member_email,stream,email_key,sent_at").gte("sent_at", yestMid.toISOString()).lt("sent_at", todayMid.toISOString()).eq("suppressed", false).order("stream").order("sent_at"),
      sb.from("wellbeing_checkins").select("member_email,score_wellbeing,flow_type,ai_persona,ai_recommendation,logged_at").gte("logged_at", yestMid.toISOString()).lt("logged_at", todayMid.toISOString()).not("ai_recommendation", "is", null).order("logged_at"),
      sb.from("ai_interactions").select("member_email,persona,recommendation,created_at").gte("created_at", yestMid.toISOString()).lt("created_at", todayMid.toISOString()).eq("triggered_by", "onboarding").order("created_at"),
      sb.from("daily_habits").select("member_email,logged_at").eq("activity_date", yestStr).order("logged_at"),
      sb.from("workouts").select("member_email,workout_name,plan_name,duration_minutes,logged_at").eq("activity_date", yestStr).order("logged_at"),
      sb.from("cardio").select("member_email,activity_type,duration_minutes,distance_km,logged_at").eq("activity_date", yestStr).order("logged_at"),
      sb.from("session_views").select("member_email,session_title,logged_at").eq("activity_date", yestStr).order("logged_at")
    ]);
    const cap = (rows, n)=>{
      const m = {};
      for (const r of rows)m[r.member_email] = (m[r.member_email] || 0) + 1;
      return Object.values(m).reduce((s, c)=>s + Math.min(c, n), 0);
    };
    const habitCount = cap(h.data || [], 1);
    const workoutCount = cap(w.data || [], 2);
    const cardioCount = cap(c.data || [], 2);
    const sessionCount = cap(s.data || [], 2);
    const checkinCount = new Set((ci.data || []).map((r)=>r.member_email)).size;
    const totalActs = habitCount + workoutCount + cardioCount + sessionCount + checkinCount;
    const uniqueActive = new Set([
      ...h.data || [],
      ...w.data || [],
      ...c.data || [],
      ...s.data || []
    ].map((r)=>r.member_email)).size;
    const totalMembers = totalM.count || 0;
    const newMembers = newM.data || [];
    const reengaged = reeng.data || [];
    const checkinAI = aiCheckins.data || [];
    const onboardAI = aiOnboarding.data || [];
    const allEmails = [
      ...new Set([
        ...(hDetail.data || []).map((r)=>r.member_email),
        ...(wDetail.data || []).map((r)=>r.member_email),
        ...(cDetail.data || []).map((r)=>r.member_email),
        ...(sDetail.data || []).map((r)=>r.member_email),
        ...checkinAI.map((r)=>r.member_email),
        ...onboardAI.map((r)=>r.member_email),
        ...reengaged.map((r)=>r.member_email)
      ])
    ];
    const { data: nameRows } = allEmails.length ? await sb.from("members").select("email,first_name,last_name,company").in("email", allEmails) : {
      data: []
    };
    const nameMap = {};
    const companyMap = {};
    for (const m of nameRows || []){
      nameMap[m.email] = ((m.first_name || '') + ' ' + (m.last_name || '')).trim();
      companyMap[m.email] = m.company || '';
    }
    const actRows = [];
    for (const r of hDetail.data || [])actRows.push({
      email: r.member_email,
      type: 'Habit',
      detail: 'Daily habit logged',
      time: r.logged_at,
      company: companyMap[r.member_email] || ''
    });
    for (const r of wDetail.data || [])actRows.push({
      email: r.member_email,
      type: 'Workout',
      detail: r.workout_name || r.plan_name || 'Workout',
      time: r.logged_at,
      company: companyMap[r.member_email] || ''
    });
    for (const r of cDetail.data || []){
      const parts = [
        r.activity_type || 'Cardio'
      ];
      if (r.duration_minutes) parts.push(`${r.duration_minutes} min`);
      if (r.distance_km) parts.push(`${r.distance_km} km`);
      actRows.push({
        email: r.member_email,
        type: 'Cardio',
        detail: parts.join(' · '),
        time: r.logged_at,
        company: companyMap[r.member_email] || ''
      });
    }
    for (const r of sDetail.data || [])actRows.push({
      email: r.member_email,
      type: 'Session',
      detail: r.session_title || 'Live session viewed',
      time: r.logged_at,
      company: companyMap[r.member_email] || ''
    });
    actRows.sort((a, b)=>a.time.localeCompare(b.time));
    const html = buildDaily(dateLabel, {
      habitCount,
      workoutCount,
      cardioCount,
      sessionCount,
      checkinCount,
      totalActs,
      uniqueActive,
      totalMembers
    }, newMembers, reengaged, nameMap, checkinAI, onboardAI, actRows);
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
      subject: `${subjectPrefix} — ${dateLabel}`,
      htmlContent: html,
      tags: [
        "daily-report"
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
      date: dateLabel,
      backfill: !!overrideDate,
      to: toEmail,
      cc: overrideCc,
      totalActs,
      newMembers: newMembers.length,
      activityRows: actRows.length
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  } catch (err) {
    console.error("[daily-report v8]", err.message);
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
const FTR = `<tr><td style="background:#F4FAFA;padding:16px 28px;border-top:1px solid #C8E4E4;"><p style="margin:0;font-size:11px;color:#7A9A9A;">VYVE Health CIC · Internal report · team@vyvehealth.co.uk</p></td></tr>`;
const TYPE_COL = {
  Habit: '#1B7878',
  Workout: '#2A6BB0',
  Cardio: '#C65D00',
  Session: '#6B4EA8'
};
function statRow(items) {
  const cells = items.map((i)=>`<td style="text-align:center;padding:12px 8px;"><div style="font-size:26px;font-weight:700;color:#0D2B2B;font-family:Georgia,serif;">${i.val}</div><div style="font-size:11px;color:#0D2B2B;margin-top:2px;font-weight:600;">${i.label}</div><div style="font-size:10px;color:#7A9A9A;">${i.sub}</div></td>`).join("");
  return `<tr><td style="padding:4px 28px;"><table width="100%" style="background:#F4FAFA;border-radius:8px;"><tr>${cells}</tr></table></td></tr>`;
}
function scoreChip(score) {
  const col = score <= 3 ? '#b05a45' : score <= 6 ? '#c4a82a' : '#1B7878';
  const bg = score <= 3 ? 'rgba(176,90,69,0.12)' : score <= 6 ? 'rgba(196,168,42,0.12)' : 'rgba(27,120,120,0.12)';
  return `<span style="display:inline-block;padding:2px 9px;border-radius:20px;background:${bg};color:${col};font-size:12px;font-weight:700;border:1px solid ${col}40;">${score}/10</span>`;
}
function aiBlock(name, subtitle, scoreHtml, persona, text) {
  const lines = text.split('\n').map((l)=>l.trim()).filter(Boolean);
  const bodyHtml = lines.map((line)=>line.startsWith('- ') ? `<div style="display:flex;gap:8px;margin-bottom:6px;"><div style="width:5px;height:5px;border-radius:50%;background:#4DAAAA;margin-top:6px;flex-shrink:0;"></div><div style="font-size:12px;color:#3A5A5A;line-height:1.6;">${line.slice(2)}</div></div>` : `<p style="margin:0 0 8px;font-size:12px;color:#3A5A5A;line-height:1.65;">${line}</p>`).join('');
  return `<div style="background:#F8FDFD;border:1px solid #C8E4E4;border-radius:8px;padding:14px 16px;margin-bottom:10px;"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;"><div><div style="font-size:13px;font-weight:700;color:#0D2B2B;">${name}</div><div style="font-size:11px;color:#7A9A9A;margin-top:1px;">${subtitle}</div></div><div style="text-align:right;">${scoreHtml}<div style="font-size:10px;color:#7A9A9A;margin-top:3px;letter-spacing:1px;">${persona}</div></div></div><div style="border-top:1px solid #EAF5F5;padding-top:10px;">${bodyHtml}</div></div>`;
}
function buildDaily(date, a, newM, reeng, nameMap, checkinAI, onboardAI, actRows) {
  const streamCol = {
    A: "#C65D00",
    B: "#1B7878",
    C1: "#2A9D8F",
    C2: "#6B9E9E",
    C3: "#3D5A5A"
  };
  const stepLbl = {
    A_48h: "48h",
    A_96h: "96h",
    A_7d: "7d",
    A_14d: "14d",
    B_3d: "3d",
    B_7d: "7d",
    B_14d: "14d",
    B_30d: "30d",
    C1_7d: "7d",
    C1_14d: "14d",
    C1_30d: "30d",
    C2_7d: "7d",
    C2_14d: "14d",
    C2_30d: "30d",
    C3_7d: "7d",
    C3_14d: "14d",
    C3_30d: "30d"
  };
  const streamDesc = {
    A: "App not opened",
    B: "No activity",
    C1: "App dormant",
    C2: "Portal dormant",
    C3: "Both dormant"
  };
  const newRows = newM.length === 0 ? `<tr><td colspan="3" style="padding:14px 0;text-align:center;color:#7A9A9A;font-size:13px;">No new members yesterday.</td></tr>` : newM.map((m)=>`<tr style="border-bottom:1px solid #EAF5F5;"><td style="padding:8px 10px;font-size:13px;color:#0D2B2B;font-weight:500;">${m.first_name || ''} ${m.last_name || ''}</td><td style="padding:8px 10px;font-size:12px;color:#5A7A7A;">${m.email}</td><td style="padding:8px 10px;font-size:12px;color:#3A5A5A;">${m.company || ''}</td></tr>`).join('');
  const reRows = reeng.length === 0 ? `<tr><td colspan="4" style="padding:14px 0;text-align:center;color:#7A9A9A;font-size:13px;">No re-engagement emails yesterday.</td></tr>` : reeng.map((r)=>`<tr style="border-bottom:1px solid #EAF5F5;"><td style="padding:8px 10px;font-size:13px;color:#0D2B2B;font-weight:500;">${nameMap[r.member_email] || r.member_email}</td><td style="padding:8px 10px;"><span style="background:${streamCol[r.stream]}22;color:${streamCol[r.stream]};padding:2px 7px;border-radius:4px;font-size:11px;font-weight:600;">${r.stream}</span></td><td style="padding:8px 10px;font-size:12px;color:#5A7A7A;">${streamDesc[r.stream] || ''}</td><td style="padding:8px 10px;font-size:12px;color:#3A5A5A;">${stepLbl[r.email_key] || r.email_key}</td></tr>`).join('');
  const actDetail = actRows.length === 0 ? `<tr><td colspan="4" style="padding:14px 0;text-align:center;color:#7A9A9A;font-size:13px;">No activities logged yesterday.</td></tr>` : actRows.map((r)=>{
    const col = TYPE_COL[r.type] || '#1B7878';
    const t = new Date(r.time).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC'
    }) + ' UTC';
    return `<tr style="border-bottom:1px solid #EAF5F5;"><td style="padding:8px 10px;font-size:13px;color:#0D2B2B;font-weight:500;">${nameMap[r.email] || r.email}</td><td style="padding:8px 10px;"><span style="background:${col}18;color:${col};padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;">${r.type}</span></td><td style="padding:8px 10px;font-size:12px;color:#3A5A5A;">${r.detail}</td><td style="padding:8px 10px;font-size:11px;color:#7A9A9A;white-space:nowrap;">${t}</td></tr>`;
  }).join('');
  const totalAiResponses = checkinAI.length + onboardAI.length;
  const checkinBlocks = checkinAI.map((r)=>{
    const name = (nameMap[r.member_email] || r.member_email).trim();
    const time = new Date(r.logged_at).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC'
    }) + ' UTC';
    return aiBlock(name, `Weekly check-in · ${r.flow_type} flow · ${time}`, scoreChip(r.score_wellbeing), r.ai_persona || '', r.ai_recommendation || '');
  }).join('');
  const onboardBlocks = onboardAI.map((r)=>{
    const name = (nameMap[r.member_email] || r.member_email).trim();
    const time = new Date(r.created_at).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC'
    }) + ' UTC';
    return aiBlock(name, `Onboarding recommendations · ${time}`, '', r.persona || '', r.recommendation || '');
  }).join('');
  const aiSection = totalAiResponses === 0 ? `<tr><td style="padding:4px 28px 12px;"><p style="font-size:13px;color:#7A9A9A;margin:0;">No AI responses issued yesterday.</p></td></tr>` : `<tr><td style="padding:4px 28px 12px;"><p style="font-size:12px;color:#7A9A9A;margin:0 0 10px;">${totalAiResponses} AI response${totalAiResponses !== 1 ? 's' : ''} issued yesterday</p>${checkinBlocks}${onboardBlocks}</td></tr>`;
  return W([
    HDR("Daily Report", date),
    SEC("Membership"),
    statRow([
      {
        label: "Total members",
        val: a.totalMembers,
        sub: "active subscriptions"
      },
      {
        label: "New yesterday",
        val: newM.length,
        sub: "joined"
      },
      {
        label: "Active yesterday",
        val: a.uniqueActive,
        sub: "logged activity"
      }
    ]),
    `<tr><td style="padding:4px 28px 12px;"><table width="100%" style="border:1px solid #C8E4E4;border-radius:8px;overflow:hidden;"><thead><tr style="background:#EAF5F5;"><th style="padding:8px 10px;text-align:left;font-size:10px;color:#1B7878;font-weight:600;text-transform:uppercase;">Name</th><th style="padding:8px 10px;text-align:left;font-size:10px;color:#1B7878;font-weight:600;text-transform:uppercase;">Email</th><th style="padding:8px 10px;text-align:left;font-size:10px;color:#1B7878;font-weight:600;text-transform:uppercase;">Company</th></tr></thead><tbody>${newRows}</tbody></table></td></tr>`,
    DIV,
    SEC("Activities yesterday"),
    statRow([
      {
        label: "Habits",
        val: a.habitCount,
        sub: "max 1/member"
      },
      {
        label: "Workouts",
        val: a.workoutCount,
        sub: "max 2/member"
      },
      {
        label: "Cardio",
        val: a.cardioCount,
        sub: "max 2/member"
      },
      {
        label: "Sessions",
        val: a.sessionCount,
        sub: "max 2/member"
      },
      {
        label: "Check-ins",
        val: a.checkinCount,
        sub: "1/week"
      }
    ]),
    `<tr><td style="padding:4px 28px 12px;"><table width="100%" style="background:#0D2B2B;border-radius:8px;"><tr><td style="text-align:center;padding:14px;"><div style="font-size:28px;font-weight:700;color:#7AB8B8;font-family:Georgia,serif;">${a.totalActs}</div><div style="font-size:10px;color:#4A8A8A;text-transform:uppercase;letter-spacing:1px;margin-top:2px;">Total activities</div></td></tr></table></td></tr>`,
    `<tr><td style="padding:4px 28px 12px;"><table width="100%" style="border:1px solid #C8E4E4;border-radius:8px;overflow:hidden;"><thead><tr style="background:#EAF5F5;"><th style="padding:8px 10px;text-align:left;font-size:10px;color:#1B7878;font-weight:600;text-transform:uppercase;">Member</th><th style="padding:8px 10px;text-align:left;font-size:10px;color:#1B7878;font-weight:600;text-transform:uppercase;">Type</th><th style="padding:8px 10px;text-align:left;font-size:10px;color:#1B7878;font-weight:600;text-transform:uppercase;">Activity</th><th style="padding:8px 10px;text-align:left;font-size:10px;color:#1B7878;font-weight:600;text-transform:uppercase;">Time</th></tr></thead><tbody>${actDetail}</tbody></table></td></tr>`,
    DIV,
    SEC("AI Responses yesterday"),
    aiSection,
    DIV,
    SEC("Re-engagement"),
    `<tr><td style="padding:4px 28px 12px;"><p style="font-size:12px;color:#7A9A9A;margin:0 0 8px;">${reeng.length} email${reeng.length !== 1 ? 's' : ''} sent yesterday</p><table width="100%" style="border:1px solid #C8E4E4;border-radius:8px;overflow:hidden;"><thead><tr style="background:#EAF5F5;"><th style="padding:8px 10px;text-align:left;font-size:10px;color:#1B7878;font-weight:600;text-transform:uppercase;">Name</th><th style="padding:8px 10px;text-align:left;font-size:10px;color:#1B7878;font-weight:600;text-transform:uppercase;">Stream</th><th style="padding:8px 10px;text-align:left;font-size:10px;color:#1B7878;font-weight:600;text-transform:uppercase;">Reason</th><th style="padding:8px 10px;text-align:left;font-size:10px;color:#1B7878;font-weight:600;text-transform:uppercase;">Step</th></tr></thead><tbody>${reRows}</tbody></table></td></tr>`,
    FTR
  ].join(''));
}
