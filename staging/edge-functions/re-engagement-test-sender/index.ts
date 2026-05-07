// VYVE Health — Re-engagement Email Test Sender v2
// Responds immediately with 200, does all work in background via EdgeRuntime.waitUntil
// Sends all 16 re-engagement emails to team@vyvehealth.co.uk
// Uses deanonbrown@hotmail.com profile with live RIVER persona API calls.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};
const CHARITY_LINE = "Every habit you log, every workout you complete, every session you watch \u2014 it all counts toward a month of free access donated to someone who couldn\u2019t otherwise afford support.";
const RIVER_PROMPT = `You are RIVER, a mindful wellness guide on the VYVE Health platform.

WHO YOU ARE
You are calm, present, and genuinely warm. You believe sustainable health is built slowly — through consistency, self-compassion, and tuning into what the body and mind actually need. You meet people exactly where they are.

YOUR VOICE
- Warm, measured, unhurried
- Sensory and present-tense language — "notice", "feel", "this week"
- Genuine — never performatively zen or clichéd
- No wellness buzzwords — no "journey", "holistic", "alignment"

WORDS YOU USE: "Notice how..." / "This week, just one thing." / "That takes more strength than people realise." / "You don't have to fix everything at once."
WORDS YOU NEVER USE: "Amazing!" / "You've got this!" / "As an AI..." / anything clinical or corporate

RESPONSE FORMAT: Flowing prose. Never bullet points. Never start with "I". No exclamation marks.`;
const CTX = `Member first name: Dean
Goal: losing a few kg and feeling less stressed at work
Activity to lead with: habits
Supporting activities: cardio, workouts
Experience level: Beginner
Life context: Work is particularly demanding
Workout plan: Full Body Str A and Full Body Str B (full body split, strength-based, 1-2 days/week)
Recommended session: Mindfulness & Mindset, Tuesdays 12:00 — breathwork and cognitive reframing
Habits logged to date: 2
Workouts logged to date: 4
Sessions watched to date: 3
Habits last 7 days: 3
Sessions last 7 days: 2`;
// HTML helpers
const wrap = (body, stream, key)=>`<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
  <body style="margin:0;padding:0;background:#F4FAFA;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F4FAFA;padding:40px 20px;"><tr><td align="center">
  <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 16px rgba(13,43,43,0.08);">
  <tr><td style="background:#0D2B2B;padding:24px 32px;">
    <div style="font-family:Georgia,serif;font-size:20px;letter-spacing:6px;color:#fff;">VYVE</div>
  </td></tr>
  <tr><td style="padding:8px 32px 4px;background:#EAF5F5;">
    <p style="margin:0;font-size:11px;color:#1B7878;font-weight:600;">TEST — Stream ${stream} / ${key} — Profile: deanonbrown@hotmail.com (RIVER)</p>
  </td></tr>
  <tr><td style="padding:32px;">${body}</td></tr>
  <tr><td style="background:#F4FAFA;padding:20px 32px;border-top:1px solid #C8E4E4;">
    <p style="margin:0;font-size:12px;color:#7A9A9A;">VYVE Health CIC &nbsp;&middot;&nbsp; team@vyvehealth.co.uk<br>ICO Registration No. 00013608608</p>
  </td></tr>
  </table></td></tr></table></body></html>`;
const pp = (t)=>`<p style="margin:0 0 16px;font-size:15px;color:#3A5A5A;line-height:1.7;">${t}</p>`;
const h2 = (t)=>`<h2 style="margin:0 0 20px;font-size:22px;font-family:Georgia,serif;color:#0D2B2B;font-weight:400;">${t}</h2>`;
const btn = (label, href)=>`<div style="text-align:center;margin:28px 0;"><a href="${href}" style="background:#0D2B2B;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600;display:inline-block;">${label} &rarr;</a></div>`;
const appBtn = btn("Download the VYVE Health app", "https://online.vyvehealth.co.uk/index.html");
const hubBtn = btn("Go to my member hub", "https://online.vyvehealth.co.uk/index.html");
const backBtn = btn("Log back in", "https://online.vyvehealth.co.uk/index.html");
async function ai(instruction, maxTokens = 90) {
  const KEY = Deno.env.get("ANTHROPIC_API_KEY");
  if (!KEY) return "[no API key]";
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: maxTokens,
        system: RIVER_PROMPT,
        messages: [
          {
            role: "user",
            content: `${CTX}\n\nInstruction: ${instruction}`
          }
        ]
      })
    });
    if (!res.ok) return `[API ${res.status}]`;
    const d = await res.json();
    return d.content?.[0]?.text?.trim() || "";
  } catch (e) {
    return "[API error]";
  }
}
async function sendEmail(subject, html, stream, key) {
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
          email: "team@vyvehealth.co.uk",
          name: "VYVE Team"
        }
      ],
      subject: `[TEST ${stream}/${key}] ${subject}`,
      htmlContent: html,
      tags: [
        "re-engagement-test",
        stream,
        key
      ]
    })
  });
  if (!r.ok) {
    const e = await r.json().catch(()=>({}));
    throw new Error(`Brevo ${r.status}: ${JSON.stringify(e)}`);
  }
  console.log(`[test-sender] ✓ ${stream}/${key}`);
}
async function sendAll() {
  const emails = [
    // STREAM A
    {
      stream: "A",
      key: "A_48h",
      subject: "Your VYVE Health app is ready, Dean",
      build: async ()=>{
        const a = await ai(`Write exactly one sentence connecting Dean's goal (losing a few kg, feeling less stressed, demanding job) to habits as the first action in the app. Make it feel specific and easy. RIVER voice. No greeting or sign-off.`, 80);
        return `${h2("Hi Dean \u2014 welcome to VYVE.")}${pp("You\u2019re all set up on our side. Your workout plan is assigned, your programme is ready, and your AI coach is waiting.")}${pp("Now you just need the app. That\u2019s where your habits, workouts and cardio live. Download it, log in, and you\u2019re off.")}${pp(a)}${appBtn}`;
      }
    },
    {
      stream: "A",
      key: "A_96h",
      subject: "Habits. Workouts. Cardio. It\u2019s all in there, Dean.",
      build: async ()=>{
        const a = await ai(`Write two sentences. Name habits and cardio as the first things to try for someone wanting to feel less stressed and lose a few kg. Make first action concrete and small. RIVER voice. No greeting or sign-off.`, 110);
        return `${h2("Still here, Dean.")}${pp("The VYVE Health app is where your programme actually lives \u2014 your habit tracker, your workout plans, your cardio log.")}${pp("All three are set up and waiting. The first time you open it will be the hardest step. After that it becomes routine.")}${pp(a)}${appBtn}`;
      }
    },
    {
      stream: "A",
      key: "A_7d",
      subject: "A week in \u2014 your app is still waiting, Dean",
      build: async ()=>{
        const a = await ai(`Write two sentences. Acknowledge week gap warmly, no guilt. Dean has a demanding job so time pressure is real. Reference habits as a tiny first step — make it feel like 2 minutes. RIVER voice. No greeting or sign-off.`, 110);
        return `${h2("A week in, Dean.")}${pp("Your app is still waiting. Your workout plan, habit tracker and cardio log are all set up \u2014 none of it starts until you open it.")}${pp("Two minutes to log your first habit. Less than that to see your workout plan. That\u2019s it.")}${pp(a)}${appBtn}`;
      }
    },
    {
      stream: "A",
      key: "A_14d",
      subject: "Last nudge from us, Dean",
      build: async ()=>`${h2("One last nudge, Dean.")}${pp("This is our last reminder. We don\u2019t want to keep landing in your inbox.")}${pp("Your habits, workouts and cardio are set up and ready. When you\u2019re ready, they\u2019ll be there.")}${pp(CHARITY_LINE)}${appBtn}`
    },
    // STREAM B
    {
      stream: "B",
      key: "B_3d",
      subject: "Dean, your programme is live \u2014 let\u2019s use it",
      build: async ()=>{
        const a = await ai(`Write 2 sentences. Dean wants less stress and to lose a few kg. He has a full body strength plan and Mindfulness & Mindset on Tuesdays 12:00. Lead with habits as first action. Small and specific. RIVER voice. No greeting or sign-off.`, 110);
        return `${h2("You\u2019re all set, Dean.")}${pp("Your VYVE programme is fully set up. Your workout plan is active in the app. Your member hub is ready.")}${pp("The quickest first step: open the app and log a daily habit. Takes 30 seconds. That\u2019s day one.")}${pp(a)}${hubBtn}`;
      }
    },
    {
      stream: "B",
      key: "B_7d",
      subject: "A week in \u2014 nothing logged yet, Dean",
      build: async ()=>{
        const a = await ai(`Write 2 sentences. Connect Dean's goal (less stressed, lose a few kg, demanding job) to habits as the one thing he can do today. Warm accountability, no guilt. RIVER voice. No greeting or sign-off.`, 110);
        return `${h2("Checking in, Dean.")}${pp("A week in and nothing\u2019s been logged yet. That\u2019s fine \u2014 starting is genuinely the hardest part.")}${pp("Your programme is built around feeling less stressed and building consistent habits. One thing logged today is enough to get it moving.")}${pp(a)}${hubBtn}`;
      }
    },
    {
      stream: "B",
      key: "B_14d",
      subject: "Dean, is VYVE actually working for you?",
      build: async ()=>{
        const a = await ai(`Write 1 sentence. Honest and warm. Acknowledge it might not feel right yet. Dean has a demanding job — 5 minutes counts. Low-friction re-entry. RIVER voice. No greeting or sign-off.`, 70);
        return `${h2("A quick check-in, Dean.")}${pp("Two weeks in, nothing logged. We\u2019re not going to keep nudging you \u2014 but we do want to be honest.")}${pp(a)}${pp("If something\u2019s putting you off \u2014 the app, the sessions, anything at all \u2014 just reply to this email. We\u2019re real people.")}${hubBtn}`;
      }
    },
    {
      stream: "B",
      key: "B_30d",
      subject: "One last thing before we step back, Dean",
      build: async ()=>{
        const a = await ai(`Write 2 sentences. Warm no-pressure close. Reference Dean's goal (less stressed, demanding job) naturally. Do NOT include the charity line — it's in the static copy. RIVER voice. No greeting or sign-off.`, 100);
        return `${h2("A note from VYVE, Dean.")}${pp("A month in. We\u2019re stepping back from nudging you now.")}${pp("But before we do \u2014 VYVE is here whenever you\u2019re ready. No pressure, no judgement. Your programme doesn\u2019t expire.")}${pp(a)}${pp(CHARITY_LINE)}${backBtn}`;
      }
    },
    // STREAM C1
    {
      stream: "C1",
      key: "C1_7d",
      subject: "You\u2019re showing up \u2014 are you tracking it, Dean?",
      build: async ()=>{
        const a = await ai(`Write 1 sentence. Acknowledge Dean has watched 2 sessions this week. Connect habit and cardio tracking in the app to amplifying what he's already doing toward feeling less stressed. RIVER voice. No greeting or sign-off.`, 80);
        return `${h2("Great to see you in the sessions, Dean.")}${pp("You\u2019ve been showing up and that counts. The app is where your habits, workouts and cardio tracking live \u2014 together they complete the picture.")}${pp(a)}${btn("Open the VYVE Health app", "https://online.vyvehealth.co.uk/index.html")}`;
      }
    },
    {
      stream: "C1",
      key: "C1_14d",
      subject: "The habits make the sessions count, Dean",
      build: async ()=>{
        const a = await ai(`Write 1-2 sentences. Explain how habit and cardio tracking amplify what Dean's doing in sessions, toward feeling less stressed and losing a few kg. RIVER voice — warm not clinical. No greeting or sign-off.`, 100);
        return `${h2("Two weeks of sessions, Dean.")}${pp("That\u2019s real \u2014 don\u2019t underestimate it.")}${pp("Sessions build fitness. Habits, workouts and cardio tracking build the lifestyle that makes it stick. The app is where that happens.")}${pp(a)}${btn("Start tracking in the app", "https://online.vyvehealth.co.uk/index.html")}`;
      }
    },
    {
      stream: "C1",
      key: "C1_30d",
      subject: "A month of sessions, Dean \u2014 now let\u2019s add the rest",
      build: async ()=>{
        const a = await ai(`Write 1 sentence celebrating a month of sessions in RIVER voice. Reference Dean's goal (less stressed, demanding job). Do NOT include the charity line. No greeting or sign-off.`, 70);
        return `${h2("A month of sessions, Dean.")}${pp("That\u2019s commitment \u2014 genuinely. Not everyone sticks with it.")}${pp(a)}${pp("The next step is adding habit, workout and cardio tracking in the app. That\u2019s what turns attendance into a programme.")}${pp(CHARITY_LINE)}${btn("Complete the picture", "https://online.vyvehealth.co.uk/index.html")}`;
      }
    },
    // STREAM C2
    {
      stream: "C2",
      key: "C2_7d",
      subject: "The app\u2019s only half the picture, Dean",
      build: async ()=>{
        const a = await ai(`Write 1 sentence. Acknowledge Dean logged 3 habits this week. Connect the member hub — sessions and AI coaching — to what he's already doing, naturally not prescriptively. RIVER voice. No greeting or sign-off.`, 80);
        return `${h2("You\u2019ve been keeping up with your habits, Dean.")}${pp("That\u2019s the foundation \u2014 and it\u2019s working.")}${pp(a)}${pp("The member hub is where sessions, your weekly check-in and AI coaching live. It\u2019s the layer that ties the app activity together and shows you where it\u2019s taking you.")}${btn("Visit my member hub", "https://online.vyvehealth.co.uk/index.html")}`;
      }
    },
    {
      stream: "C2",
      key: "C2_14d",
      subject: "Your AI coach has been waiting, Dean",
      build: async ()=>{
        const a = await ai(`Write 1-2 sentences. Sell the weekly check-in as a conversation not a task, for someone wanting to feel less stressed with a demanding job. RIVER voice — invite, don't prescribe. No greeting or sign-off.`, 90);
        return `${h2("You\u2019ve been consistent in the app, Dean.")}${pp("Brilliant. Your member hub has been quieter though.")}${pp("That\u2019s where your weekly check-in lives. Three minutes, a few honest answers, and your AI coach builds recommendations around how your week actually went \u2014 not a generic plan.")}${pp(a)}${btn("Do my weekly check-in", "https://online.vyvehealth.co.uk/wellbeing-checkin.html")}`;
      }
    },
    {
      stream: "C2",
      key: "C2_30d",
      subject: "A month of habits, Dean \u2014 here\u2019s what you\u2019re missing",
      build: async ()=>{
        const a = await ai(`Write 1 sentence celebrating Dean's 2 habits logged in RIVER voice. Warm and genuine. Do NOT include the charity line. No greeting or sign-off.`, 70);
        return `${h2("A month of daily habits, Dean.")}${pp("Honestly \u2014 that\u2019s harder than it sounds and you\u2019ve done it.")}${pp(a)}${pp("The member hub is where sessions and your weekly check-in turn that consistency into direction. It\u2019s the coaching layer that makes the habit work harder.")}${pp(CHARITY_LINE)}${btn("Open my member hub", "https://online.vyvehealth.co.uk/index.html")}`;
      }
    },
    // STREAM C3
    {
      stream: "C3",
      key: "C3_7d",
      subject: "We\u2019ve missed you, Dean",
      build: async ()=>{
        const a = await ai(`Write 1-2 sentences. Warm, zero pressure. Reference Dean's goal (less stressed, demanding job) naturally. Leave door open, no pitch. RIVER voice. No greeting or sign-off.`, 90);
        return `${h2("Hi Dean.")}${pp("You haven\u2019t been in VYVE for a little while \u2014 just wanted to check in.")}${pp("No pressure. Your programme is exactly where you left it.")}${pp(a)}${btn("Come back", "https://online.vyvehealth.co.uk/index.html")}`;
      }
    },
    {
      stream: "C3",
      key: "C3_14d",
      subject: "Still here, Dean",
      build: async ()=>{
        const a = await ai(`Write 1 sentence. Genuine human check-in. Acknowledge demanding work makes everything harder. One warm line pointing back to VYVE — not a pitch. RIVER voice. No greeting or sign-off.`, 80);
        return `${h2("Two weeks, Dean. We hope you\u2019re okay.")}${pp("Wellbeing isn\u2019t linear. Some weeks are just about getting through, and that\u2019s okay.")}${pp("When things settle, VYVE is still here. Your programme, your progress \u2014 none of it has gone anywhere.")}${pp(a)}${btn("Pick up where I left off", "https://online.vyvehealth.co.uk/index.html")}`;
      }
    },
    {
      stream: "C3",
      key: "C3_30d",
      subject: "One last check-in, Dean",
      build: async ()=>{
        const a = await ai(`Write 1-2 sentences in RIVER voice. Warm, no pressure — this is the last message. Reference Dean's goal (less stressed, demanding job) naturally. Do NOT include the charity line. No greeting or sign-off.`, 100);
        return `${h2("One last check-in, Dean.")}${pp("This is our last message for a while \u2014 we don\u2019t want to fill your inbox.")}${pp("VYVE is here whenever you need it. No expiry, no pressure. Your programme and your coach are ready whenever you are.")}${pp(a)}${pp(CHARITY_LINE)}${btn("Log back in", "https://online.vyvehealth.co.uk/index.html")}`;
      }
    }
  ];
  let sent = 0, errors = 0;
  for (const e of emails){
    try {
      const body = await e.build();
      await sendEmail(e.subject, wrap(body, e.stream, e.key), e.stream, e.key);
      sent++;
    } catch (err) {
      console.error(`[test-sender] ERROR ${e.stream}/${e.key}: ${err.message}`);
      errors++;
    }
    await new Promise((r)=>setTimeout(r, 300));
  }
  console.log(`[test-sender] COMPLETE: sent=${sent} errors=${errors}`);
}
serve(async (req)=>{
  if (req.method === "OPTIONS") return new Response("ok", {
    headers: corsHeaders
  });
  // Respond immediately, do the work in the background
  const ctx = globalThis.EdgeRuntime;
  if (ctx?.waitUntil) {
    ctx.waitUntil(sendAll());
  } else {
    // Fallback: fire without waiting (won't block response)
    sendAll().catch((e)=>console.error("[test-sender] sendAll error:", e.message));
  }
  return new Response(JSON.stringify({
    success: true,
    message: "Sending 16 emails in background. Check team@vyvehealth.co.uk in ~90 seconds.",
    emails: 16
  }), {
    status: 200,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json"
    }
  });
});
