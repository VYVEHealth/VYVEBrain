// Edge Function: wellbeing-checkin v28 — Security commit 1B fix-up (07 May 2026).
//
// CHANGES vs v27:
//   - triggered_by value corrected to 'weekly_checkin' to satisfy the existing
//     ai_interactions_triggered_by_check CHECK constraint (which allows only
//     ['weekly_checkin', 'onboarding', 'running_plan', 'milestone', 'manual',
//     're_engagement']). v27's 'wellbeing-checkin' would silently fail every insert.
//   - All other behaviour byte-identical to v27.
//
// CHANGES from v27 (still applies):
//   - getCORSHeaders no longer returns '*'. Falls through to https://online.vyvehealth.co.uk.
//   - 100KB payload cap.
//   - ai_interactions audit row written after Anthropic response (fire-and-forget).
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
const ANTHROPIC_KEY = Deno.env.get('ANTHROPIC_API_KEY') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const ALLOWED_ORIGINS = new Set([
  'https://online.vyvehealth.co.uk',
  'https://www.vyvehealth.co.uk'
]);
const DEFAULT_ORIGIN = 'https://online.vyvehealth.co.uk';
const MAX_BODY_BYTES = 102400;
function getCORSHeaders(req) {
  const origin = req.headers.get('Origin') ?? '';
  const allowOrigin = ALLOWED_ORIGINS.has(origin) ? origin : DEFAULT_ORIGIN;
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-vyve-deferred',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Credentials': 'true'
  };
}
function payloadTooLarge(req) {
  const cl = req.headers.get('content-length');
  if (!cl) return false;
  const n = Number(cl);
  return Number.isFinite(n) && n > MAX_BODY_BYTES;
}
function ukToday() {
  const now = new Date();
  const year = now.getUTCFullYear();
  const mar31 = new Date(Date.UTC(year, 2, 31));
  const lastSunMarch = new Date(Date.UTC(year, 2, 31 - mar31.getUTCDay()));
  lastSunMarch.setUTCHours(1, 0, 0, 0);
  const oct31 = new Date(Date.UTC(year, 9, 31));
  const lastSunOct = new Date(Date.UTC(year, 9, 31 - oct31.getUTCDay()));
  lastSunOct.setUTCHours(1, 0, 0, 0);
  const isBST = now >= lastSunMarch && now < lastSunOct;
  if (!isBST) return now.toISOString().slice(0, 10);
  return new Date(now.getTime() + 3600000).toISOString().slice(0, 10);
}
const PERSONA_PROMPTS = {
  NOVA: 'You are NOVA, a high-performance coach. You are driven, data-led, and precision-focused. You speak in terms of structure, metrics, and measurable progress. You celebrate wins with specificity — "you hit X, that matters" — and frame gaps as targets to close, not failures.',
  RIVER: 'You are RIVER, a mindful wellness guide. You are calm, empathetic, and holistic. You speak gently and with genuine warmth. You acknowledge the emotional weight of a tough week without dramatising it, and you celebrate good weeks as moments of flow to sustain.',
  SPARK: 'You are SPARK, a motivational powerhouse. You are energetic, warm, and challenge-driven. You bring humour when appropriate and hold people accountable with genuine care. You turn data into stories of effort and make the member feel like their progress is worth talking about.',
  SAGE: 'You are SAGE, a knowledge-first mentor. You are thoughtful, educational, and evidence-based. You help members understand the why behind their wellbeing, not just the what. You frame recommendations with rationale and treat members as intelligent adults.',
  HAVEN: 'You are HAVEN, a gentle mental wellbeing companion. You are non-judgmental, trauma-informed, and deeply human. You never pressure or prescribe. You always acknowledge feelings before actions. If someone appears to be in genuine distress or crisis, you gently signpost professional help — you never try to coach through it.'
};
function getISOWeek(d) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const iso_week = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return {
    iso_week,
    iso_year: date.getUTCFullYear()
  };
}
function getTimeOfDay() {
  const h = new Date().getUTCHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  if (h < 21) return 'evening';
  return 'night';
}
async function getAuthUser(req) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${token}`
    }
  });
  if (!res.ok) return null;
  const user = await res.json();
  return user.email?.toLowerCase() || null;
}
async function writeAiInteraction(email, persona, prompt_summary, recommendation, decision_log) {
  try {
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
        triggered_by: 'weekly_checkin',
        persona,
        prompt_summary,
        recommendation,
        decision_log
      })
    });
  } catch (e) {
    console.warn('[wellbeing-checkin] ai_interactions write failed:', e.message);
  }
}
async function writeNotification(email, type, title, body, route = null) {
  try {
    const today = ukToday();
    const checkRes = await fetch(`${SUPABASE_URL}/rest/v1/member_notifications?member_email=eq.${encodeURIComponent(email)}&type=eq.${encodeURIComponent(type)}&created_at=gte.${today}T00:00:00Z&limit=1`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });
    const existing = await checkRes.json();
    if (existing.length > 0) return;
    const payload = {
      member_email: email,
      type,
      title,
      body
    };
    if (route) payload.route = route;
    await fetch(`${SUPABASE_URL}/rest/v1/member_notifications`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(payload)
    });
  } catch (e) {
    console.warn('writeNotification error:', e);
  }
}
serve(async (req)=>{
  const CORS = getCORSHeaders(req);
  if (req.method === 'OPTIONS') return new Response('ok', {
    headers: CORS
  });
  if (payloadTooLarge(req)) {
    return new Response(JSON.stringify({
      error: 'Payload too large (>100KB)'
    }), {
      status: 413,
      headers: {
        ...CORS,
        'Content-Type': 'application/json'
      }
    });
  }
  try {
    const email = await getAuthUser(req);
    if (!email) {
      return new Response(JSON.stringify({
        error: 'Authentication required. Please log in.'
      }), {
        status: 401,
        headers: {
          ...CORS,
          'Content-Type': 'application/json'
        }
      });
    }
    const isDeferred = req.headers.get('x-vyve-deferred') === '1';
    const body = await req.json();
    const { score, answer, flow, member, historyContext } = body;
    if (!score || !answer) {
      return new Response(JSON.stringify({
        error: 'Missing required fields'
      }), {
        status: 400,
        headers: {
          ...CORS,
          'Content-Type': 'application/json'
        }
      });
    }
    let persona = 'RIVER';
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/members?email=eq.${encodeURIComponent(email)}&select=persona`, {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`
        }
      });
      const rows = await res.json();
      if (rows?.[0]?.persona) persona = rows[0].persona.toUpperCase();
    } catch (_) {}
    let previousScore = null;
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/wellbeing_checkins?member_email=eq.${encodeURIComponent(email)}&select=score_wellbeing,logged_at&order=logged_at.desc&limit=1`, {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`
        }
      });
      const rows = await res.json();
      if (rows?.[0]?.score_wellbeing) previousScore = rows[0].score_wellbeing;
    } catch (_) {}
    const isQuiet = flow === 'quiet';
    const personaLine = PERSONA_PROMPTS[persona] || PERSONA_PROMPTS.RIVER;
    const firstName = member?.firstName ?? 'there';
    const activitySummary = isQuiet ? 'The member had NO recorded activity this week.' : `This week: ${member?.habitsThisWeek ?? 0} daily habits, ${member?.workoutsThisWeek ?? 0} workouts, ${member?.cardioThisWeek ?? 0} cardio sessions, ${member?.sessionsThisWeek ?? 0} VYVE sessions watched.`;
    const seenThisWeek = (member?.seenThisWeek || []).join(', ') || 'none';
    const notSeen = (member?.sessionsNotSeen || []).join(', ') || 'none';
    const allTime = `${member?.habitsTotal ?? 0} habits and ${member?.workoutsTotal ?? 0} workouts logged all-time`;
    let scoreComparison = '';
    if (previousScore !== null) {
      const diff = score - previousScore;
      if (diff > 0) scoreComparison = `Their score this week is ${score}/10 — up ${diff} point${diff !== 1 ? 's' : ''} from last week (${previousScore}/10).`;
      else if (diff < 0) scoreComparison = `Their score this week is ${score}/10 — down ${Math.abs(diff)} point${Math.abs(diff) !== 1 ? 's' : ''} from last week (${previousScore}/10).`;
      else scoreComparison = `Their score this week is ${score}/10 — the same as last week (${previousScore}/10).`;
    } else {
      scoreComparison = `Their score this week is ${score}/10. This is their first check-in or no previous score is available.`;
    }
    const systemPrompt = `${personaLine}\n\nYou are writing a personalised weekly wellbeing response for a VYVE Health member named ${firstName}. This is private — only they will see it.\n\nMEMBER CONTEXT:\n- ${scoreComparison}\n- ${activitySummary}\n- Sessions watched this week: ${seenThisWeek}\n- Session types not yet explored: ${notSeen}\n- All-time activity: ${allTime}\n- Trend history: ${historyContext || 'No previous check-in history available.'}\n\nWrite your response in three clearly separated sections. Use plain text only — no markdown bold, no asterisks, no bullet symbols other than "-".\n\nSECTION 1 — SCORE RECAP (2–3 sentences)\nOpen in your own persona voice. Reference the score this week and compare to last week if available. Name the direction of travel — up, down, stable — and what that means in context.\n\nSECTION 2 — WHAT WENT WELL (2–3 sentences starting with the label "What went well:")\nIdentify what the member should feel good about this week. Be specific, not generic.\n\nSECTION 3 — WHAT TO AIM FOR (3–4 recommendations, each starting with "-")\nSet 3 to 4 specific, actionable targets for the coming week.\n\nTONE RULES:\n- Low score (1–4): lead with acknowledgement and warmth. No pressure.\n- Mid score (5–6): encouraging and forward-looking.\n- High score (7–10): celebrate genuinely. Push a stretch target.\n- Never use: "holistic", "wellness journey", "synergy", "self-care", "empower"\n- Never say you are an AI\n- Never use markdown bold or asterisks\n- Speak directly to the member as "you"\n\nFormat the output exactly as:\n[Score recap paragraph]\n\nWhat went well: [paragraph]\n\n- [recommendation 1]\n- [recommendation 2]\n- [recommendation 3]\n- [optional recommendation 4]`;
    const userMessage = `My wellbeing score this week is ${score}/10. I said: "${answer}"`;
    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1200,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userMessage
          }
        ]
      })
    });
    if (!aiRes.ok) throw new Error(`Anthropic error: ${await aiRes.text()}`);
    const aiData = await aiRes.json();
    const text = aiData.content?.[0]?.text ?? '';
    const paragraphs = text.split(/\n\n+/);
    const ack = paragraphs[0] ?? '';
    const wellPara = paragraphs.find((p)=>p.trim().toLowerCase().startsWith('what went well')) ?? '';
    const recsRaw = paragraphs.filter((p)=>p.trim().startsWith('-')).join('\n');
    const recsField = [
      wellPara,
      recsRaw
    ].filter(Boolean).join('\n\n');
    const activity_date = ukToday();
    const today = new Date();
    const { iso_week, iso_year } = getISOWeek(today);
    const day_of_week = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday'
    ][today.getUTCDay()];
    const time_of_day = getTimeOfDay();
    const nowISO = today.toISOString();
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/weekly_scores`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates,return=minimal'
        },
        body: JSON.stringify({
          member_email: email,
          iso_week,
          iso_year,
          activity_date,
          wellbeing_score: score,
          logged_at: nowISO
        })
      });
    } catch (e) {
      console.warn('weekly_scores write failed:', e);
    }
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/wellbeing_checkins`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates,return=minimal'
        },
        body: JSON.stringify({
          member_email: email,
          activity_date,
          day_of_week,
          time_of_day,
          iso_week,
          iso_year,
          score_wellbeing: score,
          flow_type: flow === 'quiet' ? 'quiet' : 'active',
          ai_recommendation: text,
          ai_persona: persona,
          logged_at: nowISO
        })
      });
    } catch (e) {
      console.warn('wellbeing_checkins write failed:', e);
    }
    EdgeRuntime.waitUntil(writeAiInteraction(email, persona, `Weekly check-in (score=${score}, flow=${flow === 'quiet' ? 'quiet' : 'active'}${isDeferred ? ', deferred' : ''})`, text, {
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1200,
      score_wellbeing: score,
      flow_type: flow === 'quiet' ? 'quiet' : 'active',
      previous_score: previousScore,
      deferred: isDeferred,
      iso_week,
      iso_year,
      response_status: aiRes.status
    }));
    let notifTitle;
    let notifBody;
    if (isDeferred) {
      notifTitle = 'Your check-in recommendations are ready';
      notifBody = `Your wellbeing score: ${score}/10. Tap to see this week's recommendations from ${persona}.`;
    } else {
      notifTitle = score >= 7 ? 'Great check-in!' : score >= 5 ? 'Check-in complete' : 'Check-in received';
      notifBody = score >= 7 ? `Score ${score}/10 — a strong week. Your ${persona} recommendations are ready.` : score >= 5 ? `Score ${score}/10 — solid week. Your ${persona} recommendations are ready.` : `Score ${score}/10 noted. Your ${persona} recommendations are ready.`;
    }
    EdgeRuntime.waitUntil(writeNotification(email, 'checkin_complete', notifTitle, notifBody, '/wellbeing-checkin.html'));
    return new Response(JSON.stringify({
      success: true,
      ack,
      recs: recsField,
      persona,
      full: text,
      deferred: isDeferred
    }), {
      headers: {
        ...CORS,
        'Content-Type': 'application/json'
      }
    });
  } catch (err) {
    console.error('wellbeing-checkin error:', err);
    return new Response(JSON.stringify({
      error: String(err)
    }), {
      status: 500,
      headers: {
        ...CORS,
        'Content-Type': 'application/json'
      }
    });
  }
});
