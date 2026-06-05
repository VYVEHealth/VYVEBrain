// Edge Function: wellbeing-checkin v30 — enriched prompt + structured response for submitCheckinNew (PM-516)
//
// CHANGES vs v29:
//   - Handles BOTH submission surfaces:
//       * submitCheckin (legacy quiet/active flow): body has {score, answer, flow, member, historyContext}
//       * submitCheckinNew (active deepened flow):  body has {mood, dimension_energy, dimension_sleep,
//         dimension_stress, dimension_body, drivers[], improvement_focus, free_text, check_in_type}
//   - New path fetches daily_mood_7d from daily_mood_checkins table and returns it in response.
//   - New path uses enriched system prompt: dimensions, drivers, improvement_focus, baseline context,
//     4-week mood trend. Produces structured output: DEBRIEF / HABIT / CONTENT sections.
//   - max_tokens raised to 800 on new path (was 1200 on old path — reduce to 800, enough for quality).
//   - Legacy path unchanged (v29 behaviour preserved exactly).
//   - wellbeing_checkins write stores dimension columns + drivers + improvement_focus if present.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const ANTHROPIC_KEY = Deno.env.get('ANTHROPIC_API_KEY') ?? '';
const SUPABASE_URL  = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const ALLOWED_ORIGINS = new Set([
  'https://online.vyvehealth.co.uk',
  'https://www.vyvehealth.co.uk'
]);
const DEFAULT_ORIGIN = 'https://online.vyvehealth.co.uk';
const MAX_BODY_BYTES = 102400;

function getCORSHeaders(req: Request) {
  const origin = req.headers.get('Origin') ?? '';
  const allowOrigin = ALLOWED_ORIGINS.has(origin) ? origin : DEFAULT_ORIGIN;
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-vyve-deferred',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Credentials': 'true'
  };
}

function payloadTooLarge(req: Request) {
  const cl = req.headers.get('content-length');
  if (!cl) return false;
  const n = Number(cl);
  return Number.isFinite(n) && n > MAX_BODY_BYTES;
}

function ukToday(): string {
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

function getISOWeek(d: Date): { iso_week: number; iso_year: number } {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const iso_week = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return { iso_week, iso_year: date.getUTCFullYear() };
}

function getTimeOfDay(): string {
  const h = new Date().getUTCHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  if (h < 21) return 'evening';
  return 'night';
}

async function getAuthUser(req: Request): Promise<string | null> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) return null;
  const user = await res.json();
  return user.email?.toLowerCase() || null;
}

async function writeAiInteraction(email: string, persona: string, prompt_summary: string, recommendation: string, decision_log: Record<string, unknown>) {
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
  } catch (e: unknown) {
    console.warn('[wellbeing-checkin] ai_interactions write failed:', (e as Error).message);
  }
}

async function writeNotification(email: string, type: string, title: string, body: string, route: string | null = null) {
  try {
    const today = ukToday();
    const checkRes = await fetch(
      `${SUPABASE_URL}/rest/v1/member_notifications?member_email=eq.${encodeURIComponent(email)}&type=eq.${encodeURIComponent(type)}&created_at=gte.${today}T00:00:00Z&limit=1`,
      { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } }
    );
    const existing = await checkRes.json();
    if (existing.length > 0) return;
    const payload: Record<string, unknown> = { member_email: email, type, title, body };
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
  } catch (e: unknown) {
    console.warn('writeNotification error:', e);
  }
}

// ── PERSONA PROMPTS ────────────────────────────────────────────────────────────
const PERSONA_PROMPTS: Record<string, string> = {
  NOVA:  'You are NOVA, a high-performance coach. Driven, data-led, precision-focused. You speak in terms of metrics and measurable progress. You celebrate wins with specificity and frame gaps as targets to close, not failures.',
  RIVER: 'You are RIVER, a mindful wellness guide. Calm, empathetic, holistic. You speak with genuine warmth. You acknowledge the emotional weight of a tough week without dramatising it, and celebrate good weeks as moments of flow.',
  SPARK: 'You are SPARK, a motivational powerhouse. Energetic, warm, challenge-driven. You bring real energy and hold people accountable with care. You make the member feel like their progress is worth talking about.',
  SAGE:  'You are SAGE, a knowledge-first mentor. Thoughtful, evidence-based. You help members understand the why behind their wellbeing. You frame recommendations with rationale and treat members as intelligent adults.',
  HAVEN: 'You are HAVEN, a gentle mental wellbeing companion. Non-judgmental, trauma-informed, deeply human. You never pressure or prescribe. If someone appears in genuine distress, gently signpost professional help — never try to coach through a crisis.'
};

// ── LEGACY PATH (v29 behaviour, unchanged) ────────────────────────────────────
async function handleLegacyCheckin(
  req: Request, email: string, body: Record<string, unknown>,
  CORS: Record<string, string>
): Promise<Response> {
  const { score, answer, flow, member, historyContext } = body as {
    score: number; answer: string; flow: string;
    member: Record<string, unknown>; historyContext: string;
  };

  if (!score || !answer) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), {
      status: 400, headers: { ...CORS, 'Content-Type': 'application/json' }
    });
  }

  let persona = 'RIVER';
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/members?email=eq.${encodeURIComponent(email)}&select=persona`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
    });
    const rows = await res.json();
    if (rows?.[0]?.persona) persona = rows[0].persona.toUpperCase();
  } catch (_) {}

  let previousScore: number | null = null;
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/wellbeing_checkins?member_email=eq.${encodeURIComponent(email)}&select=score_wellbeing,logged_at&order=logged_at.desc&limit=1`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
    );
    const rows = await res.json();
    if (rows?.[0]?.score_wellbeing) previousScore = rows[0].score_wellbeing;
  } catch (_) {}

  const isQuiet = flow === 'quiet';
  const personaLine = PERSONA_PROMPTS[persona] || PERSONA_PROMPTS.RIVER;
  const firstName = (member?.firstName as string) ?? 'there';
  const activitySummary = isQuiet
    ? 'The member had NO recorded activity this week.'
    : `This week: ${member?.habitsThisWeek ?? 0} daily habits, ${member?.workoutsThisWeek ?? 0} workouts, ${member?.cardioThisWeek ?? 0} cardio sessions, ${member?.sessionsThisWeek ?? 0} VYVE sessions watched.`;
  const seenThisWeek = ((member?.seenThisWeek as string[]) || []).join(', ') || 'none';
  const notSeen = ((member?.sessionsNotSeen as string[]) || []).join(', ') || 'none';
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
    headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 800, system: systemPrompt, messages: [{ role: 'user', content: userMessage }] })
  });
  if (!aiRes.ok) throw new Error(`Anthropic error: ${await aiRes.text()}`);
  const aiData = await aiRes.json();
  const text = aiData.content?.[0]?.text ?? '';
  const paragraphs = text.split(/\n\n+/);
  const ack = paragraphs[0] ?? '';
  const wellPara = paragraphs.find((p: string) => p.trim().toLowerCase().startsWith('what went well')) ?? '';
  const recsRaw = paragraphs.filter((p: string) => p.trim().startsWith('-')).join('\n');
  const recsField = [wellPara, recsRaw].filter(Boolean).join('\n\n');

  const activity_date = ukToday();
  const today = new Date();
  const { iso_week, iso_year } = getISOWeek(today);
  const day_of_week = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][today.getUTCDay()];
  const time_of_day = getTimeOfDay();
  const nowISO = today.toISOString();
  const isDeferred = req.headers.get('x-vyve-deferred') === '1';

  try {
    const wsRes = await fetch(`${SUPABASE_URL}/rest/v1/weekly_scores`, {
      method: 'POST',
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({ member_email: email, iso_week, iso_year, activity_date, wellbeing_score: score, logged_at: nowISO })
    });
    if (!wsRes.ok) console.warn(`weekly_scores write returned ${wsRes.status}: ${await wsRes.text()}`);
  } catch (e: unknown) { console.warn('weekly_scores write failed:', e); }

  try {
    const wcRes = await fetch(`${SUPABASE_URL}/rest/v1/wellbeing_checkins`, {
      method: 'POST',
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({ member_email: email, activity_date, day_of_week, time_of_day, iso_week, iso_year, score_wellbeing: score, flow_type: flow === 'quiet' ? 'quiet' : 'active', ai_recommendation: text, ai_persona: persona, logged_at: nowISO })
    });
    if (!wcRes.ok) {
      const errBody = await wcRes.text();
      console.warn(`wellbeing_checkins write returned ${wcRes.status}: ${errBody}`);
      return new Response(JSON.stringify({ success: false, error: 'wellbeing_checkins_write_failed', detail: `HTTP ${wcRes.status}` }), {
        status: 200, headers: { ...CORS, 'Content-Type': 'application/json' }
      });
    }
  } catch (e: unknown) {
    console.warn('wellbeing_checkins write failed:', e);
    return new Response(JSON.stringify({ success: false, error: 'wellbeing_checkins_write_failed', detail: (e as Error).message }), {
      status: 200, headers: { ...CORS, 'Content-Type': 'application/json' }
    });
  }

  EdgeRuntime.waitUntil(writeAiInteraction(email, persona, `Weekly check-in legacy (score=${score}, flow=${flow === 'quiet' ? 'quiet' : 'active'}${isDeferred ? ', deferred' : ''})`, text, {
    model: 'claude-sonnet-4-20250514', max_tokens: 800, score_wellbeing: score, flow_type: flow === 'quiet' ? 'quiet' : 'active', previous_score: previousScore, deferred: isDeferred, iso_week, iso_year, path: 'legacy'
  }));

  let notifTitle: string;
  let notifBody: string;
  if (isDeferred) {
    notifTitle = 'Your check-in recommendations are ready';
    notifBody = `Your wellbeing score: ${score}/10. Tap to see this week's recommendations from ${persona}.`;
  } else {
    notifTitle = score >= 7 ? 'Great check-in!' : score >= 5 ? 'Check-in complete' : 'Check-in received';
    notifBody = score >= 7
      ? `Score ${score}/10 — a strong week. Your ${persona} recommendations are ready.`
      : score >= 5
        ? `Score ${score}/10 — solid week. Your ${persona} recommendations are ready.`
        : `Score ${score}/10 noted. Your ${persona} recommendations are ready.`;
  }
  EdgeRuntime.waitUntil(writeNotification(email, 'checkin_complete', notifTitle, notifBody, '/wellbeing-checkin.html'));

  return new Response(JSON.stringify({ success: true, ack, recs: recsField, persona, full: text, deferred: isDeferred }), {
    headers: { ...CORS, 'Content-Type': 'application/json' }
  });
}

// ── NEW PATH: enriched signal + structured output ─────────────────────────────
async function handleNewCheckin(
  email: string, body: Record<string, unknown>, CORS: Record<string, string>
): Promise<Response> {
  const {
    mood, dimension_energy, dimension_sleep, dimension_stress, dimension_body,
    drivers, improvement_focus, free_text, iso_week: bodyIsoWeek, iso_year: bodyIsoYear
  } = body as {
    mood: number;
    dimension_energy: number | null; dimension_sleep: number | null;
    dimension_stress: number | null; dimension_body: number | null;
    drivers: string[] | null; improvement_focus: string | null;
    free_text: string | null;
    iso_week: number; iso_year: number;
  };

  if (!mood || mood < 1 || mood > 10) {
    return new Response(JSON.stringify({ error: 'Invalid mood score' }), {
      status: 400, headers: { ...CORS, 'Content-Type': 'application/json' }
    });
  }

  // Parallel DB fetches — all non-critical, each catches independently
  const [memberRow, recentCheckins, dailyMoods] = await Promise.all([
    // Member profile: persona, first name
    fetch(`${SUPABASE_URL}/rest/v1/members?email=eq.${encodeURIComponent(email)}&select=persona,first_name,goals`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
    }).then(r => r.json()).catch(() => []),

    // Last 4 weekly check-ins for trend
    fetch(`${SUPABASE_URL}/rest/v1/wellbeing_checkins?member_email=eq.${encodeURIComponent(email)}&select=score_wellbeing,logged_at,dimension_energy,dimension_sleep,dimension_stress,dimension_body&order=logged_at.desc&limit=4`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
    }).then(r => r.json()).catch(() => []),

    // Daily mood last 7 days
    fetch(`${SUPABASE_URL}/rest/v1/daily_mood_checkins?member_email=eq.${encodeURIComponent(email)}&mood_date=gte.${sevenDaysAgo()}&select=mood_date,mood_score&order=mood_date.asc`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
    }).then(r => r.json()).catch(() => []),
  ]);

  const persona: string = (memberRow?.[0]?.persona?.toUpperCase()) || 'RIVER';
  const firstName: string = memberRow?.[0]?.first_name || 'there';
  const personaLine = PERSONA_PROMPTS[persona] || PERSONA_PROMPTS.RIVER;

  // Build 4-week mood trend string
  const prevScores: number[] = (recentCheckins as Array<{score_wellbeing: number; logged_at: string}>)
    .map(r => r.score_wellbeing).filter(Boolean);
  const previousScore: number | null = prevScores[0] ?? null;

  let trendLine = 'No previous check-in data.';
  if (prevScores.length >= 2) {
    const trendDesc = prevScores[0] > prevScores[prevScores.length - 1] ? 'declining over recent weeks'
      : prevScores[0] < prevScores[prevScores.length - 1] ? 'improving over recent weeks'
      : 'stable over recent weeks';
    trendLine = `Last ${prevScores.length} weekly scores: ${prevScores.join(', ')}. Trend: ${trendDesc}.`;
  } else if (prevScores.length === 1) {
    trendLine = `Last week: ${prevScores[0]}/10.`;
  }

  // Score movement
  let scoreLine = `Mood score this week: ${mood}/10.`;
  if (previousScore !== null) {
    const diff = mood - previousScore;
    if (diff > 0) scoreLine += ` Up ${diff} from last week (${previousScore}/10).`;
    else if (diff < 0) scoreLine += ` Down ${Math.abs(diff)} from last week (${previousScore}/10).`;
    else scoreLine += ` Same as last week (${previousScore}/10).`;
  }

  // Dimensions block — only mention scored dimensions
  const dimLines: string[] = [];
  if (dimension_energy != null) dimLines.push(`Energy: ${dimension_energy}/10`);
  if (dimension_sleep  != null) dimLines.push(`Sleep: ${dimension_sleep}/10`);
  if (dimension_stress != null) dimLines.push(`Stress: ${dimension_stress}/10`);
  if (dimension_body   != null) dimLines.push(`Body/physical: ${dimension_body}/10`);
  const dimensionsBlock = dimLines.length > 0
    ? `Dimension breakdown: ${dimLines.join(', ')}.`
    : 'No dimension breakdown provided.';

  // Drivers
  const driversLine = drivers && drivers.length > 0
    ? `What shaped the week (member-selected): ${drivers.join(', ')}.`
    : 'No specific drivers selected.';

  // Improvement focus
  const focusLine = improvement_focus
    ? `Member wants to focus on improving: ${improvement_focus}.`
    : '';

  // Build daily_mood_7d array for response (chart)
  const today = new Date();
  const daily_mood_7d: (number | null)[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const match = (dailyMoods as Array<{mood_date: string; mood_score: number}>)
      .find(m => m.mood_date === dateStr);
    daily_mood_7d.push(match ? match.mood_score : null);
  }

  // ── SYSTEM PROMPT ──────────────────────────────────────────────────────────
  const systemPrompt = `${personaLine}

You are writing a private weekly wellbeing reflection for a VYVE Health member named ${firstName}. Only they will see this. Be warm, specific, and genuinely useful — this should read like a message from someone who actually knows them, not a wellness template.

MEMBER DATA THIS WEEK:
- ${scoreLine}
- ${dimensionsBlock}
- ${driversLine}
${focusLine ? `- ${focusLine}` : ''}
- Weekly trend: ${trendLine}

TONE BY SCORE:
- 1–3: Lead with warmth and acknowledgement. Don't minimise what they're feeling. One gentle, low-effort action is enough.
- 4–5: Honest — it's been a mixed week. Find the real bright spots. Keep recommendations achievable.
- 6–7: Positive but not effusive. Build on what worked. One stretch nudge is fine.
- 8–10: Genuine celebration. Name specifically what's strong. Push one meaningful challenge.

RULES:
- Never use: "holistic", "wellness journey", "self-care", "empower", "synergy", "touch base"
- No markdown bold, no asterisks, no bullet symbols except "-"
- Never say you are an AI
- Speak directly as "you", not "the member"
- If stress is high (7+/10) and mood is low (1–4/10), acknowledge this combination directly — don't gloss it
- Use the dimension scores and drivers to be specific. If sleep was 3/10, say something about sleep. If "work pressure" was selected, acknowledge it.
- Keep it tight — a strong debrief is 3–4 sentences, not a paragraph for every point

OUTPUT FORMAT — respond with exactly these four labelled sections, nothing else:

DEBRIEF: [2–4 sentences. This is the main reflection — score movement, what drove it, what it means. Reference their specific dimensions and drivers if available.]

HABIT: [Exactly one habit suggestion relevant to their focus or lowest dimension. Format: habit name | one sentence on why it fits them this week.]

CONTENT: [Exactly one VYVE session or content type that fits their current state. Format: session name | one sentence on why now.]`;

  const userMessage = free_text
    ? `Mood score: ${mood}/10. In my own words: "${free_text}"`
    : `Mood score: ${mood}/10.`;

  const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 800,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }]
    })
  });
  if (!aiRes.ok) throw new Error(`Anthropic error: ${await aiRes.text()}`);
  const aiData = await aiRes.json();
  const rawText: string = aiData.content?.[0]?.text ?? '';

  // Parse structured output
  const debriefMatch = rawText.match(/DEBRIEF:\s*([\s\S]*?)(?=\nHABIT:|$)/i);
  const habitMatch   = rawText.match(/HABIT:\s*([\s\S]*?)(?=\nCONTENT:|$)/i);
  const contentMatch = rawText.match(/CONTENT:\s*([\s\S]*?)$/i);

  const debrief_text = debriefMatch?.[1]?.trim() ?? rawText.trim();

  let habit_name = '', habit_reason = '';
  if (habitMatch?.[1]) {
    const parts = habitMatch[1].trim().split('|');
    habit_name   = parts[0]?.trim() ?? '';
    habit_reason = parts[1]?.trim() ?? '';
  }

  let content_name = '', content_reason = '';
  if (contentMatch?.[1]) {
    const parts = contentMatch[1].trim().split('|');
    content_name   = parts[0]?.trim() ?? '';
    content_reason = parts[1]?.trim() ?? '';
  }

  // DB writes
  const activity_date = ukToday();
  const { iso_week, iso_year } = getISOWeek(today);
  const day_of_week = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][today.getUTCDay()];
  const time_of_day = getTimeOfDay();
  const nowISO = today.toISOString();

  // weekly_scores — best-effort
  try {
    const wsRes = await fetch(`${SUPABASE_URL}/rest/v1/weekly_scores`, {
      method: 'POST',
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({ member_email: email, iso_week, iso_year, activity_date, wellbeing_score: mood, logged_at: nowISO })
    });
    if (!wsRes.ok) console.warn(`weekly_scores write returned ${wsRes.status}`);
  } catch (e: unknown) { console.warn('weekly_scores write failed:', e); }

  // wellbeing_checkins — critical
  try {
    const wcRes = await fetch(`${SUPABASE_URL}/rest/v1/wellbeing_checkins`, {
      method: 'POST',
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({
        member_email: email, activity_date, day_of_week, time_of_day,
        iso_week, iso_year, score_wellbeing: mood, flow_type: 'active',
        ai_recommendation: rawText, ai_persona: persona, logged_at: nowISO,
        check_in_type: 'weekly',
        dimension_energy:  dimension_energy ?? null,
        dimension_sleep:   dimension_sleep  ?? null,
        dimension_stress:  dimension_stress ?? null,
        dimension_body:    dimension_body   ?? null,
        drivers:           drivers && drivers.length > 0 ? drivers : null,
        improvement_focus: improvement_focus || null,
      })
    });
    if (!wcRes.ok) {
      const errBody = await wcRes.text();
      console.warn(`wellbeing_checkins write returned ${wcRes.status}: ${errBody}`);
      return new Response(JSON.stringify({ success: false, error: 'wellbeing_checkins_write_failed', detail: `HTTP ${wcRes.status}` }), {
        status: 200, headers: { ...CORS, 'Content-Type': 'application/json' }
      });
    }
  } catch (e: unknown) {
    return new Response(JSON.stringify({ success: false, error: 'wellbeing_checkins_write_failed', detail: (e as Error).message }), {
      status: 200, headers: { ...CORS, 'Content-Type': 'application/json' }
    });
  }

  EdgeRuntime.waitUntil(writeAiInteraction(email, persona,
    `Weekly check-in new path (mood=${mood}, dims=${dimLines.join('/')}, drivers=${drivers?.join(',') || 'none'}, focus=${improvement_focus || 'none'})`,
    rawText,
    { model: 'claude-sonnet-4-20250514', max_tokens: 800, mood, dimensions: {dimension_energy, dimension_sleep, dimension_stress, dimension_body}, drivers, improvement_focus, previous_score: previousScore, iso_week, iso_year, path: 'new' }
  ));

  const notifTitle = mood >= 7 ? 'Great check-in!' : mood >= 5 ? 'Check-in complete' : 'Check-in received';
  const notifBody = mood >= 7
    ? `Score ${mood}/10 — a strong week. Your ${persona} reflection is ready.`
    : mood >= 5
      ? `Score ${mood}/10. Your ${persona} reflection is ready.`
      : `Score ${mood}/10 noted. Your ${persona} reflection is ready.`;
  EdgeRuntime.waitUntil(writeNotification(email, 'checkin_complete', notifTitle, notifBody, '/wellbeing-checkin.html'));

  return new Response(JSON.stringify({
    success: true,
    debrief_text,
    habit_name,
    habit_reason,
    content_name,
    content_reason,
    daily_mood_7d,
    persona,
    full: rawText,
  }), {
    headers: { ...CORS, 'Content-Type': 'application/json' }
  });
}

// ── HELPERS ───────────────────────────────────────────────────────────────────
function sevenDaysAgo(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 7);
  return d.toISOString().slice(0, 10);
}

// ── MAIN HANDLER ──────────────────────────────────────────────────────────────
serve(async (req: Request) => {
  const CORS = getCORSHeaders(req);
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (payloadTooLarge(req)) {
    return new Response(JSON.stringify({ error: 'Payload too large (>100KB)' }), {
      status: 413, headers: { ...CORS, 'Content-Type': 'application/json' }
    });
  }

  try {
    const email = await getAuthUser(req);
    if (!email) {
      return new Response(JSON.stringify({ error: 'Authentication required. Please log in.' }), {
        status: 401, headers: { ...CORS, 'Content-Type': 'application/json' }
      });
    }

    const body = await req.json() as Record<string, unknown>;

    // Route: new path sends 'mood', legacy path sends 'score'
    if ('mood' in body) {
      return await handleNewCheckin(email, body, CORS);
    } else {
      return await handleLegacyCheckin(req, email, body, CORS);
    }

  } catch (err: unknown) {
    console.error('wellbeing-checkin error:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' }
    });
  }
});
