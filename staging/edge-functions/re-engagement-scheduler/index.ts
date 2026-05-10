// VYVE Health — Re-engagement Email Scheduler v11 — PM-16 perf (08 May 2026 PM-16).
//
// CHANGES vs v10:
//   - Replace 4 .in() queries against daily_habits/workouts/session_views/wellbeing_checkins
//     with a single .in() query against member_home_state for the new last_*_at columns
//     (added in migration pm16_add_last_at_columns_to_member_home_state).
//   - At current scale (~30 active members), the old shape pulled hundreds of rows from
//     each activity table. At 100K members it would pull millions. New shape pulls one
//     row per active member, regardless of activity count.
//   - All other behaviour byte-identical to v10.
//
// CHANGES vs v9 (still applies):
//   - triggered_by value 're_engagement' satisfies the ai_interactions check constraint.
//   - Per-step streamKey moved into decision_log.stream_key.
//
// CHANGES vs v8 (still applies):
//   - Single-app world: streams A + B only.
//   - Stream A gate: privacy_accepted_at IS NULL AND no app activity.
//   - Stream B: opened the app, currently dormant (no activity in last 7d).
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};
const EXCLUDED_EMAILS = new Set([
  "test@test.com",
  "maketest@vyvehealth.co.uk",
  "team@vyvehealth.co.uk"
]);
const CADENCE = {
  A: [
    {
      key: "A_48h",
      delayHours: 48
    },
    {
      key: "A_96h",
      delayHours: 96
    },
    {
      key: "A_7d",
      delayHours: 168
    },
    {
      key: "A_14d",
      delayHours: 336
    }
  ],
  B: [
    {
      key: "B_3d",
      delayHours: 72
    },
    {
      key: "B_7d",
      delayHours: 168
    },
    {
      key: "B_14d",
      delayHours: 336
    },
    {
      key: "B_30d",
      delayHours: 720
    }
  ]
};
const CHARITY_LINE = "Every habit you log, every workout you complete, every session you watch \u2014 it all counts toward a month of free access donated to someone who couldn\u2019t otherwise afford support.";
function hoursAgo(h) {
  return new Date(Date.now() - h * 3600000);
}
function hasUsefulProfile(m) {
  return !!(m.persona || m.goal_focus);
}
function isOverwhelmed(m) {
  const v = m.overwhelm_response || "";
  return v.includes("Fewer notifications") || v.includes("I'll manage myself");
}
function classifyGoal(goalFocus) {
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
      primary: "habits",
      secondary: "cardio",
      tertiary: "workouts"
    }
  ];
  for (const r of rules)if (r.keys.some((k)=>g.includes(k))) return {
    primary: r.primary,
    secondary: r.secondary,
    tertiary: r.tertiary
  };
  return {
    primary: "habits",
    secondary: "workouts",
    tertiary: "cardio"
  };
}
async function writeAiInteraction(email, persona, prompt_summary, recommendation, decision_log) {
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
        triggered_by: 're_engagement',
        persona,
        prompt_summary,
        recommendation,
        decision_log
      })
    });
  } catch (e) {
    console.warn('[scheduler v11] ai_interactions write failed:', e.message);
  }
}
const wrap = (body)=>`<!DOCTYPE html><html><body style="margin:0;padding:0;background:#F4FAFA;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#F4FAFA;padding:32px 16px;"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#FFFFFF;border-radius:12px;overflow:hidden;box-shadow:0 2px 16px rgba(13,43,43,0.08);"><tr><td style="background:#0D2B2B;padding:24px 32px;"><img src="https://online.vyvehealth.co.uk/logo.png" alt="VYVE Health" style="height:36px;display:block;" /></td></tr><tr><td style="padding:32px;">${body}</td></tr><tr><td style="background:#F4FAFA;padding:20px 32px;border-top:1px solid #C8E4E4;"><p style="margin:0;font-size:12px;color:#7A9A9A;">VYVE Health CIC &nbsp;&middot;&nbsp; team@vyvehealth.co.uk<br>ICO Registration No. 00013608608</p></td></tr></table></td></tr></table></body></html>`;
const pp = (t)=>`<p style="margin:0 0 16px;font-size:15px;color:#3A5A5A;line-height:1.7;">${t}</p>`;
const h2 = (t)=>`<h2 style="margin:0 0 20px;font-size:22px;font-family:Georgia,serif;color:#0D2B2B;font-weight:400;">${t}</h2>`;
const btn = (label, href)=>`<div style="text-align:center;margin:28px 0;"><a href="${href}" style="background:#0D2B2B;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600;display:inline-block;">${label} &rarr;</a></div>`;
const appBtn = btn("Download the VYVE Health app", "https://online.vyvehealth.co.uk/index.html");
const hubBtn = btn("Open the VYVE Health app", "https://online.vyvehealth.co.uk/index.html");
const backBtn = btn("Log back in", "https://online.vyvehealth.co.uk/index.html");
function memberContext(m, priority) {
  return [
    `Member first name: ${m.first_name || "there"}`,
    `Goal: ${m.goal_focus || "general wellbeing"}`,
    `Activity to lead with: ${priority.primary}`,
    `Supporting activities: ${priority.secondary}, ${priority.tertiary}`,
    `Experience level: ${m.experience_level || "not specified"}`,
    `Life context: ${m.life_context?.join(", ") || "none"}`,
    m.welcome_rec_1 ? `Workout plan: ${m.welcome_rec_1.substring(0, 120)}` : null,
    m.welcome_rec_2 ? `Recommended session: ${m.welcome_rec_2.substring(0, 120)}` : null,
    `Habits logged to date: ${m.cert_habits_count}`,
    `Workouts logged to date: ${m.cert_workouts_count}`,
    `Sessions watched to date: ${m.cert_sessions_count}`
  ].filter(Boolean).join("\n");
}
async function aiLine(email, persona, streamKey, systemPrompt, userPrompt, maxTokens) {
  const KEY = Deno.env.get("ANTHROPIC_API_KEY");
  if (!KEY) return null;
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: userPrompt
          }
        ]
      })
    });
    const d = await r.json();
    if (!r.ok) {
      console.error("[ai] error:", d);
      return null;
    }
    const txt = d?.content?.[0]?.text?.trim();
    if (!txt) return null;
    EdgeRuntime.waitUntil(writeAiInteraction(email, persona, `re-engagement ${streamKey} (${maxTokens} max_tokens) | system: ${systemPrompt.slice(0, 200)}`, txt, {
      model: "claude-haiku-4-5-20251001",
      max_tokens: maxTokens,
      response_status: r.status,
      last_user_excerpt: userPrompt.slice(0, 200),
      usage: d?.usage ?? null,
      stream_key: streamKey
    }));
    return txt;
  } catch (e) {
    console.error("[ai] fetch failed:", e.message);
    return null;
  }
}
async function buildA(m, key) {
  const n = m.first_name || "there";
  const useAI = hasUsefulProfile(m) && !!m.persona_system_prompt;
  const priority = classifyGoal(m.goal_focus);
  const subjects = {
    A_48h: `Your VYVE Health app is ready, ${n}`,
    A_96h: `Habits. Workouts. Cardio. It\u2019s all in there, ${n}.`,
    A_7d: `A week in \u2014 your app is still waiting, ${n}`,
    A_14d: `Last nudge from us, ${n}`
  };
  if (!subjects[key]) return null;
  const staticBodies = {
    A_48h: `${h2(`Hi ${n} \u2014 welcome to VYVE.`)}
${pp("You\u2019re all set up on our side. Your workout plan is assigned, your programme is ready, and your AI coach is waiting.")}
${pp("Now you just need the app. That\u2019s where your habits, workouts and cardio live. Download it, log in, and you\u2019re off.")}
${appBtn}`,
    A_96h: `${h2(`Still here, ${n}.`)}
${pp("The VYVE Health app is where your programme actually lives \u2014 your habit tracker, your workout plans, your cardio log.")}
${pp("All three are set up and waiting. The first time you open it will be the hardest step. After that it becomes routine.")}
${appBtn}`,
    A_7d: `${h2(`A week in, ${n}.`)}
${pp("Your app is still waiting. Your workout plan, habit tracker and cardio log are all set up \u2014 none of it starts until you open it.")}
${pp("Two minutes to log your first habit. Less than that to see your workout plan. That\u2019s it.")}
${appBtn}`,
    A_14d: `${h2(`One last nudge, ${n}.`)}
${pp("This is our last reminder. We don\u2019t want to keep landing in your inbox.")}
${pp("Your habits, workouts and cardio are set up and ready. When you\u2019re ready, they\u2019ll be there.")}
${pp(CHARITY_LINE)}
${appBtn}`
  };
  let body = staticBodies[key];
  if (useAI && key !== "A_14d") {
    const instruction = {
      A_48h: `Write exactly one sentence connecting the member's goal ("${m.goal_focus}") to ${priority.primary} as their first action in the app. Make it feel specific and easy. Do not greet or sign off.`,
      A_96h: `Write exactly one sentence naming ${priority.primary} as the most important of the three activities for someone with the goal "${m.goal_focus}", and why. Do not greet or sign off.`,
      A_7d: `Write exactly one sentence. Warm, no guilt. Reference ${priority.primary} as a specific tiny first step. If life context includes time pressure, acknowledge it. Do not greet or sign off.`
    };
    const ctx = memberContext(m, priority);
    const aiText = await aiLine(m.email, m.persona, key, m.persona_system_prompt, `${ctx}\n\nInstruction: ${instruction[key]}`, 80);
    if (aiText) body = body.replace(appBtn, pp(aiText) + appBtn);
  }
  return {
    subject: subjects[key],
    html: wrap(body),
    ai_used: useAI && key !== "A_14d"
  };
}
async function buildB(m, key) {
  const n = m.first_name || "there";
  const useAI = hasUsefulProfile(m) && !!m.persona_system_prompt;
  const priority = classifyGoal(m.goal_focus);
  const goalDesc = m.goal_focus || "your wellbeing";
  const lc = m.life_context?.join(", ") || "none";
  const subjects = {
    B_3d: `${n}, your programme is live \u2014 let\u2019s use it`,
    B_7d: `Checking in, ${n}`,
    B_14d: `${n}, is VYVE actually working for you?`,
    B_30d: `One last thing before we step back, ${n}`
  };
  if (!subjects[key]) return null;
  const staticBodies = {
    B_3d: `${h2(`You\u2019re all set, ${n}.`)}
${pp("You\u2019ve been in the app \u2014 brilliant. The quickest way to make it count is to log a daily habit today. Takes 30 seconds.")}
${pp(`Your programme is built around ${goalDesc}. One small log a day is what turns it from setup into momentum.`)}
${hubBtn}`,
    B_7d: `${h2(`Checking in, ${n}.`)}
${pp("It\u2019s been a few days. That\u2019s fine \u2014 starting again is genuinely easier than starting cold.")}
${pp(`Your programme is built around ${goalDesc}. One habit logged today is enough to get it moving.`)}
${hubBtn}`,
    B_14d: `${h2(`A quick check-in, ${n}.`)}
${pp("Two weeks since you\u2019ve been active. We\u2019re not going to keep nudging you \u2014 but we do want to be honest.")}
${pp("If something\u2019s putting you off \u2014 the app, the sessions, anything at all \u2014 just reply to this email. We\u2019re real people.")}
${hubBtn}`,
    B_30d: `${h2(`A note from VYVE, ${n}.`)}
${pp("A month since you\u2019ve been active. We\u2019re stepping back from nudging you now.")}
${pp("But before we do \u2014 VYVE is here whenever you\u2019re ready. No pressure, no judgement. Your programme doesn\u2019t expire.")}
${pp(CHARITY_LINE)}
${backBtn}`
  };
  let body = staticBodies[key];
  if (useAI) {
    const instructions = {
      B_3d: {
        inst: `Write 2 sentences. Reference the member's goal ("${m.goal_focus}") and lead with ${priority.primary} as the specific first action today. Reference welcome_rec_1 if available. Concrete and small. Do not greet or sign off.`,
        maxTokens: 100,
        insertBefore: hubBtn
      },
      B_7d: {
        inst: `Write 2 sentences. Connect the member's goal ("${m.goal_focus}") to ${priority.primary} as the one thing they can do today. Warm accountability, no guilt. Do not greet or sign off.`,
        maxTokens: 100,
        insertBefore: hubBtn
      },
      B_14d: {
        inst: `Write 1 sentence. Honest, warm. Acknowledge it might not feel right yet. If life context includes time pressure (${lc}), reference that 5 minutes counts. Do not greet or sign off.`,
        maxTokens: 70,
        insertBefore: hubBtn
      },
      B_30d: {
        inst: `Write 2 sentences in persona voice. Warm no-pressure close. Reference the goal ("${m.goal_focus}") naturally. Do not repeat the charity line \u2014 it is already in the email. Do not greet or sign off.`,
        maxTokens: 100,
        insertBefore: pp(CHARITY_LINE) + backBtn
      }
    };
    const cfg = instructions[key];
    if (cfg) {
      const ctx = memberContext(m, priority);
      const aiText = await aiLine(m.email, m.persona, key, m.persona_system_prompt, `${ctx}\n\nInstruction: ${cfg.inst}`, cfg.maxTokens);
      if (aiText) body = body.replace(cfg.insertBefore, pp(aiText) + cfg.insertBefore);
    }
  }
  return {
    subject: subjects[key],
    html: wrap(body),
    ai_used: useAI
  };
}
async function sendBrevo(to, name, subject, html, tags) {
  const KEY = Deno.env.get("BREVO_API_KEY");
  if (!KEY) throw new Error("BREVO_API_KEY not set");
  const r = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": KEY,
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
serve(async (req)=>{
  if (req.method === "OPTIONS") return new Response("ok", {
    headers: corsHeaders
  });
  const body = await req.json().catch(()=>({}));
  const DRY_RUN = body.dry_run === true;
  const supabase = createClient(Deno.env.get("SUPABASE_URL"), Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: {
      persistSession: false
    }
  });
  const results = [];
  const now = new Date();
  try {
    const { data: membersRaw, error } = await supabase.from("members").select(`
      email,first_name,persona,onboarding_complete,onboarding_completed_at,
      created_at,overwhelm_response,privacy_accepted_at,
      cert_habits_count,cert_workouts_count,cert_sessions_count,
      subscription_status,goal_focus,experience_level,life_context,
      welcome_rec_1,welcome_rec_2
    `).eq("subscription_status", "active");
    if (error) throw error;
    const { data: personaRows } = await supabase.from("personas").select("name,system_prompt").eq("active", true);
    const personaMap = {};
    for (const p of personaRows || [])personaMap[p.name] = p.system_prompt;
    const emails = (membersRaw || []).map((m)=>m.email);
    // PM-16: pull last_*_at columns from member_home_state in ONE query instead of
    // four .in() queries against daily_habits/workouts/session_views/wellbeing_checkins.
    // O(member_count) rows total, regardless of activity volume.
    const { data: homeStateRows } = emails.length ? await supabase.from("member_home_state").select("member_email,last_habit_at,last_workout_at,last_session_at,last_checkin_at").in("member_email", emails) : {
      data: []
    };
    const homeStateMap = {};
    for (const r of homeStateRows || [])homeStateMap[r.member_email] = r;
    const members = (membersRaw || []).map((m)=>{
      const hs = homeStateMap[m.email] || {
        last_habit_at: null,
        last_workout_at: null,
        last_session_at: null,
        last_checkin_at: null
      };
      return {
        ...m,
        persona_system_prompt: m.persona ? personaMap[m.persona] || null : null,
        last_habit: hs.last_habit_at,
        last_workout: hs.last_workout_at,
        last_session: hs.last_session_at,
        last_checkin: hs.last_checkin_at
      };
    });
    const { data: sent } = await supabase.from("engagement_emails").select("member_email,stream,email_key,suppressed").in("member_email", emails);
    const sentMap = {};
    const suppMap = {};
    for (const r of sent || []){
      sentMap[r.member_email] ??= {};
      sentMap[r.member_email][r.stream] ??= new Set();
      sentMap[r.member_email][r.stream].add(r.email_key);
      if (r.suppressed) {
        suppMap[r.member_email] ??= new Set();
        suppMap[r.member_email].add(r.stream);
      }
    }
    for (const m of members){
      if (EXCLUDED_EMAILS.has(m.email.toLowerCase())) {
        results.push({
          email: m.email,
          stream: "none",
          email_key: "",
          status: "excluded"
        });
        continue;
      }
      const r = await processMember(m, supabase, now, sentMap, suppMap, DRY_RUN);
      if (r) results.push(r);
    }
    const sc = results.filter((r)=>r.status === "sent").length;
    const sk = results.filter((r)=>r.status === "skipped").length;
    const ex = results.filter((r)=>r.status === "excluded").length;
    const er = results.filter((r)=>r.status === "error").length;
    const ai = results.filter((r)=>r.ai_used).length;
    return new Response(JSON.stringify({
      success: true,
      dry_run: DRY_RUN,
      version: 11,
      processed: results.length,
      sent: sc,
      skipped: sk,
      excluded: ex,
      errors: er,
      ai_calls: ai,
      results
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  } catch (err) {
    console.error("[scheduler v11] fatal:", err.message);
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
async function processMember(m, supabase, now, sentMap, suppMap, dryRun) {
  const created = new Date(m.created_at);
  const lH = m.last_habit ? new Date(m.last_habit) : null;
  const lW = m.last_workout ? new Date(m.last_workout) : null;
  const lS = m.last_session ? new Date(m.last_session) : null;
  const lC = m.last_checkin ? new Date(m.last_checkin) : null;
  const onbDone = m.onboarding_completed_at ? new Date(m.onboarding_completed_at) : null;
  const lastAny = [
    lH,
    lW,
    lS,
    lC
  ].filter(Boolean).reduce((a, b)=>!a || b && b > a ? b : a, null);
  const hasAnyActivity = !!lastAny;
  const consentDone = !!m.privacy_accepted_at;
  let stream = null;
  let trigger = created;
  if (!consentDone && !hasAnyActivity) {
    stream = "A";
    trigger = created;
  } else {
    const dormant = !lastAny || lastAny < hoursAgo(168);
    if (dormant) {
      stream = "B";
      trigger = lastAny || onbDone || created;
    }
  }
  if (!stream) return {
    email: m.email,
    stream: "none",
    email_key: "",
    status: "skipped",
    reason: "active \u2014 no stream"
  };
  if (suppMap[m.email]?.has(stream)) return {
    email: m.email,
    stream,
    email_key: "",
    status: "suppressed"
  };
  const sentForStream = sentMap[m.email]?.[stream] || new Set();
  if (isOverwhelmed(m) && sentForStream.size >= 1) return {
    email: m.email,
    stream,
    email_key: "",
    status: "skipped",
    reason: "overwhelm preference"
  };
  const cadence = CADENCE[stream];
  let nextStep = null;
  for (const step of cadence){
    if (sentForStream.has(step.key)) continue;
    if (now >= new Date(trigger.getTime() + step.delayHours * 3600000)) {
      nextStep = step;
      break;
    }
  }
  if (!nextStep) return {
    email: m.email,
    stream,
    email_key: "",
    status: "skipped",
    reason: "not yet due or cadence complete"
  };
  const result = stream === "A" ? await buildA(m, nextStep.key) : await buildB(m, nextStep.key);
  if (!result) return {
    email: m.email,
    stream,
    email_key: nextStep.key,
    status: "error",
    reason: "no content built"
  };
  if (dryRun) return {
    email: m.email,
    stream,
    email_key: nextStep.key,
    status: "sent",
    reason: "DRY RUN",
    subject: result.subject,
    ai_used: result.ai_used
  };
  try {
    const msgId = await sendBrevo(m.email, m.first_name || "there", result.subject, result.html, [
      stream,
      nextStep.key
    ]);
    await supabase.from("engagement_emails").insert({
      member_email: m.email,
      stream,
      email_key: nextStep.key,
      sent_at: now.toISOString(),
      brevo_message_id: msgId,
      suppressed: false
    });
    const isLast = cadence[cadence.length - 1].key === nextStep.key;
    if (isLast) await supabase.from("engagement_emails").upsert({
      member_email: m.email,
      stream,
      email_key: `${stream}_suppressed`,
      sent_at: now.toISOString(),
      suppressed: true
    }, {
      onConflict: "member_email,stream,email_key"
    });
    console.log(`[scheduler v11] SENT ${m.email} | ${stream} | ${nextStep.key} | ai=${result.ai_used}`);
    return {
      email: m.email,
      stream,
      email_key: nextStep.key,
      status: "sent",
      subject: result.subject,
      ai_used: result.ai_used
    };
  } catch (err) {
    console.error(`[scheduler v11] ERROR ${m.email} | ${err.message}`);
    return {
      email: m.email,
      stream,
      email_key: nextStep.key,
      status: "error",
      reason: err.message
    };
  }
}
