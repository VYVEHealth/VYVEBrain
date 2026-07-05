// Edge Function: wellbeing-checkin v37
// v37 (finding B, 4 Jul 2026): crisis-scan wired in. Both paths (new 'mood' flow
//      free_text + legacy 'answer') are scanned server-side via the crisis-scan EF,
//      fire-and-forget through EdgeRuntime.waitUntil — a scan failure or outage can
//      never delay or break the member's check-in, and NOTHING member-facing changes
//      (crisis response copy/routing is gated on Phil + Lewis). Covers HAVEN persona
//      turns since those happen inside this EF.
// v36: PM-666 model string updated claude-sonnet-4-20250514 -> claude-sonnet-4-5. Carries v35.
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

// v37: fire-and-forget safeguarding scan. Never throws to the caller.
async function scanForCrisis(email: string, name: string, source: string, fields: Record<string, string>) {
  try {
    const r = await fetch(`${SUPABASE_URL}/functions/v1/crisis-scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SUPABASE_KEY}` },
      body: JSON.stringify({ member_email: email, member_name: name || '(name unknown)', trigger_source: source, fields }),
    });
    if (!r.ok) console.warn(`[wellbeing-checkin] crisis-scan ${r.status}`);
  } catch (e: unknown) {
    console.warn('[wellbeing-checkin] crisis-scan call failed (non-blocking):', String(e));
  }
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

function sevenDaysAgo(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 7);
  return d.toISOString().slice(0, 10);
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

async function q(table: string, params: string): Promise<Record<string, unknown>[]> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
  });
  if (!res.ok) {
    console.warn(`[wellbeing-checkin] query failed on ${table}: ${res.status}`);
    return [];
  }
  return res.json();
}

async function writeAiInteraction(email: string, persona: string, prompt_summary: string, recommendation: string, decision_log: Record<string, unknown>) {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/ai_interactions`, {
      method: 'POST',
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
      body: JSON.stringify({ member_email: email, triggered_by: 'weekly_checkin', persona, prompt_summary, recommendation, decision_log })
    });
  } catch (e: unknown) { console.warn('[wellbeing-checkin] ai_interactions write failed:', (e as Error).message); }
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
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
      body: JSON.stringify(payload)
    });
  } catch (e: unknown) { console.warn('writeNotification error:', e); }
}

const PERSONA_PROMPTS: Record<string, string> = {
  NOVA:  'You are NOVA, a high-performance coach. Driven, data-led, precision-focused. You speak in terms of metrics and measurable progress. You celebrate wins with specificity and frame gaps as targets to close, not failures.',
  RIVER: 'You are RIVER, a mindful wellness guide. Calm, empathetic, holistic. You speak with genuine warmth. You acknowledge the emotional weight of a tough week without dramatising it, and celebrate good weeks as moments of flow.',
  SPARK: 'You are SPARK, a motivational powerhouse. Energetic, warm, challenge-driven. You bring real energy and hold people accountable with care. You make the member feel like their progress is worth talking about.',
  SAGE:  'You are SAGE, a knowledge-first mentor. Thoughtful, evidence-based. You help members understand the why behind their wellbeing. You frame recommendations with rationale and treat members as intelligent adults.',
  HAVEN: 'You are HAVEN, a gentle mental wellbeing companion. Non-judgmental, trauma-informed, deeply human. You never pressure or prescribe. If someone appears in genuine distress, gently signpost professional help — never try to coach through a crisis.'
};

const PERSONA_DISPLAY: Record<string, string> = {
  NOVA: 'NOVA', RIVER: 'RIVER', SPARK: 'SPARK', SAGE: 'SAGE', HAVEN: 'HAVEN'
};

function countByKind(rows: Record<string, unknown>[], kindField: string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const r of rows) {
    const k = (r[kindField] as string) || 'other';
    out[k] = (out[k] || 0) + 1;
  }
  return out;
}

function fmtCounts(map: Record<string, number>): string {
  return Object.entries(map).filter(([, n]) => n > 0).map(([k, n]) => `${n} ${k}`).join(', ');
}

async function handleNewCheckin(
  email: string, body: Record<string, unknown>, CORS: Record<string, string>
): Promise<Response> {
  const {
    mood, dimension_energy, dimension_sleep, dimension_stress, dimension_body,
    drivers, improvement_focus, free_text
  } = body as {
    mood: number;
    dimension_energy: number | null; dimension_sleep: number | null;
    dimension_stress: number | null; dimension_body: number | null;
    drivers: string[] | null; improvement_focus: string | null;
    free_text: string | null;
  };

  if (!mood || mood < 1 || mood > 10) {
    return new Response(JSON.stringify({ error: 'Invalid mood score' }), {
      status: 400, headers: { ...CORS, 'Content-Type': 'application/json' }
    });
  }

  const enc = encodeURIComponent(email);
  const weekAgo = sevenDaysAgo();
  const today = ukToday();

  const [
    memberRows,
    homeStateRows,
    recentCheckins,
    habits,
    workouts,
    cardio,
    movement,
    mind,
    dailyMoods,
  ] = await Promise.all([
    q('members',
      `email=eq.${enc}&select=persona,first_name,specific_goal,success_vision,past_barriers,experience_level,training_days_per_week,training_location,injuries,sleep_issues,life_context,sensitive_context,training_goals,barriers&limit=1`),
    q('member_home_state',
      `member_email=eq.${enc}&select=habits_this_week,workouts_this_week,cardio_this_week,sessions_this_week,checkins_this_week,last_habit_at,last_workout_at,last_cardio_at,last_session_at&limit=1`),
    q('wellbeing_checkins',
      `member_email=eq.${enc}&select=score_wellbeing,logged_at,dimension_energy,dimension_sleep,dimension_stress,dimension_body,drivers,improvement_focus&order=logged_at.desc&limit=4`),
    q('daily_habits',
      `member_email=eq.${enc}&activity_date=gte.${weekAgo}&activity_date=lte.${today}&select=activity_date`),
    q('workouts',
      `member_email=eq.${enc}&activity_date=gte.${weekAgo}&activity_date=lte.${today}&select=activity_date,workout_name`),
    q('cardio',
      `member_email=eq.${enc}&activity_date=gte.${weekAgo}&activity_date=lte.${today}&select=activity_date,cardio_type`),
    q('movement_activities',
      `member_email=eq.${enc}&activity_date=gte.${weekAgo}&activity_date=lte.${today}&select=activity_date,kind`),
    q('mind_activities',
      `member_email=eq.${enc}&activity_date=gte.${weekAgo}&activity_date=lte.${today}&select=activity_date,kind`),
    q('daily_mood_checkins',
      `member_email=eq.${enc}&mood_date=gte.${weekAgo}&select=mood_date,mood_value&order=mood_date.asc`),
  ]);

  const member = memberRows[0] ?? {};
  const homeState = homeStateRows[0] ?? {};

  const persona: string = ((member.persona as string)?.toUpperCase()) || 'RIVER';
  const firstName: string = (member.first_name as string) || 'there';
  const personaLine = PERSONA_PROMPTS[persona] || PERSONA_PROMPTS.RIVER;
  const memberGoal = (member.specific_goal as string) || (member.success_vision as string) || null;

  const prevScores: number[] = (recentCheckins as Array<{score_wellbeing: number}>)
    .map(r => r.score_wellbeing).filter(Boolean);
  const previousScore: number | null = prevScores[0] ?? null;

  let trendLine = 'No previous check-in data.';
  if (prevScores.length >= 2) {
    const dir = prevScores[0] > prevScores[prevScores.length - 1] ? 'declining' : prevScores[0] < prevScores[prevScores.length - 1] ? 'improving' : 'stable';
    trendLine = `Last ${prevScores.length} weekly scores: ${prevScores.join(', ')}. Trend: ${dir}.`;
  } else if (prevScores.length === 1) {
    trendLine = `Last week: ${prevScores[0]}/10.`;
  }

  let scoreLine = `Mood score this week: ${mood}/10.`;
  if (previousScore !== null) {
    const diff = mood - previousScore;
    if (diff > 0) scoreLine += ` Up ${diff} from last week (${previousScore}/10).`;
    else if (diff < 0) scoreLine += ` Down ${Math.abs(diff)} from last week (${previousScore}/10).`;
    else scoreLine += ` Same as last week (${previousScore}/10).`;
  }

  const dimLines: string[] = [];
  if (dimension_energy != null) dimLines.push(`Energy: ${dimension_energy}/10`);
  if (dimension_sleep  != null) dimLines.push(`Sleep: ${dimension_sleep}/10`);
  if (dimension_stress != null) dimLines.push(`Stress: ${dimension_stress}/10`);
  if (dimension_body   != null) dimLines.push(`Body/physical: ${dimension_body}/10`);
  const dimensionsBlock = dimLines.length > 0
    ? `Dimension breakdown: ${dimLines.join(', ')}.`
    : 'No dimension breakdown provided.';

  const habitDays = new Set(habits.map((h: Record<string, unknown>) => h.activity_date as string)).size;
  const workoutFmt = workouts.length > 0
    ? `${workouts.length} workout${workouts.length !== 1 ? 's' : ''} (${[...new Set(workouts.map((w: Record<string, unknown>) => w.workout_name as string).filter(Boolean))].slice(0,3).join(', ') || 'logged'})`
    : null;
  const cardioByKind = countByKind(cardio as Record<string, unknown>[], 'cardio_type');
  const cardioFmt = cardio.length > 0 ? `${cardio.length} cardio session${cardio.length !== 1 ? 's' : ''} (${fmtCounts(cardioByKind) || 'logged'})` : null;
  const movementByKind = countByKind(movement as Record<string, unknown>[], 'kind');
  const movementFmt = movement.length > 0 ? `${movement.length} movement session${movement.length !== 1 ? 's' : ''} (${fmtCounts(movementByKind) || 'logged'})` : null;
  const mindByKind = countByKind(mind as Record<string, unknown>[], 'kind');
  const mindFmt = mind.length > 0 ? `${mind.length} mind session${mind.length !== 1 ? 's' : ''} (${fmtCounts(mindByKind) || 'logged'})` : null;

  const hsSessions = (homeState.sessions_this_week as number) ?? 0;

  const activityLines: string[] = [];
  if (habitDays > 0) activityLines.push(`Habits: ${habitDays} day${habitDays !== 1 ? 's' : ''} logged`);
  else activityLines.push('Habits: none this week');
  if (workoutFmt) activityLines.push(`Body — workouts: ${workoutFmt}`);
  if (cardioFmt)  activityLines.push(`Body — cardio: ${cardioFmt}`);
  if (movementFmt) activityLines.push(`Body — movement: ${movementFmt}`);
  if (!workoutFmt && !cardioFmt && !movementFmt) activityLines.push('Body: no activity logged this week');
  if (mindFmt) activityLines.push(`Mind: ${mindFmt}`);
  else activityLines.push('Mind: no activity logged this week');
  if (hsSessions > 0) activityLines.push(`Sessions watched: ${hsSessions}`);
  const activityBlock = activityLines.join('\n');

  const gaps: string[] = [];
  if (habitDays === 0) gaps.push('daily habits');
  if (workouts.length === 0 && cardio.length === 0 && movement.length === 0) gaps.push('physical activity');
  if (mind.length === 0) gaps.push('mind activities');
  if (hsSessions === 0) gaps.push('live or replay sessions');
  const gapLine = gaps.length > 0 ? `Gaps this week (not logged): ${gaps.join(', ')}.` : 'No major gaps — all pillars touched.';

  const lastCheckin = recentCheckins[0] as Record<string, unknown> | undefined;
  const prevFocusLine = lastCheckin?.improvement_focus
    ? `Last week they wanted to improve: ${lastCheckin.improvement_focus}.`
    : '';

  const todayDate = new Date();
  const daily_mood_7d: (number | null)[] = [];
  const DAY_LABELS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const todayDow = todayDate.getUTCDay();
  const moodEntries: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(todayDate);
    d.setUTCDate(d.getUTCDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const match = (dailyMoods as Array<{mood_date: string; mood_value: number}>)
      .find(m => m.mood_date === dateStr);
    const val = match ? match.mood_value : null;
    daily_mood_7d.push(val);
    if (val !== null) {
      const dayIdx = (todayDow - 6 + (6 - i) + 7) % 7;
      moodEntries.push(`${DAY_LABELS[dayIdx]}:${val}`);
    }
  }
  const dailyMoodPromptLine = moodEntries.length > 0
    ? `Daily mood logged this week (${moodEntries.length} day${moodEntries.length !== 1 ? 's' : ''}): ${moodEntries.join(', ')}.`
    : '';

  const profileParts: string[] = [];
  if (memberGoal) profileParts.push(`Goal: ${memberGoal}`);
  if (member.experience_level) profileParts.push(`Experience: ${member.experience_level as string}`);
  if (member.training_days_per_week) profileParts.push(`Training days/week target: ${member.training_days_per_week as string}`);
  if (member.past_barriers) profileParts.push(`Past barriers: ${member.past_barriers as string}`);
  if (member.injuries) profileParts.push(`Injuries: ${member.injuries as string}`);
  if (member.sleep_issues) profileParts.push(`Sleep issues: ${member.sleep_issues as string}`);
  if (member.sensitive_context) profileParts.push('Sensitive context: yes — lead with extra care');
  const profileBlock = profileParts.length > 0 ? profileParts.join('\n') : 'Profile not available';

  const driversLine = drivers && drivers.length > 0
    ? `What shaped the week (member-selected): ${drivers.join(', ')}.`
    : 'No specific drivers selected.';
  const focusLine = improvement_focus
    ? `Member wants to focus on: ${improvement_focus}.`
    : '';

  const systemPrompt = `${personaLine}\n\nYou are writing a private weekly wellbeing reflection for a VYVE Health member named ${firstName}. Only they will see this. Be specific, warm, and genuinely useful — write like someone who has actually looked at their week, not a wellness template.\n\n=== MEMBER PROFILE ===\n${profileBlock}\n\n=== THIS WEEK'S ACTIVITY (actual logged data) ===\n${activityBlock}\n${gapLine}\n\n=== CHECK-IN DATA ===\n${scoreLine}\n${dimensionsBlock}\n${driversLine}\n${focusLine ? focusLine : ''}\n${dailyMoodPromptLine ? dailyMoodPromptLine : ''}\n${prevFocusLine ? prevFocusLine : ''}\nWeekly trend: ${trendLine}\n\nTONE BY SCORE:\n- 1–3: Lead with warmth and acknowledgement. Don't minimise. One gentle action is enough.\n- 4–5: Honest — a mixed week. Find the real bright spots. Keep recommendations achievable.\n- 6–7: Positive but not effusive. Build on what worked. One stretch nudge is fine.\n- 8–10: Genuine celebration. Name specifically what's strong. Push one meaningful challenge.\n\nRULES:\n- Never use: "holistic", "wellness journey", "self-care", "empower", "synergy", "touch base"\n- No markdown bold, no asterisks, no bullet symbols except "-"\n- Never say you are an AI\n- Speak directly as "you", not "the member"\n- If stress is high (dimension_stress low on scale) and mood is low (1–4/10), acknowledge the combination — don't gloss it\n- Use the actual activity data — reference what they logged. If they did 3 workouts, say so. If habits were missed all week, acknowledge it.\n- HABIT suggestion must relate to a real gap or their stated focus — not a generic suggestion\n- CONTENT suggestion must be a real VYVE session type (Yoga & Stretch, Mindfulness & Breathwork, Workouts, Weekly Check-In, Group Therapy, Education & Experts, The VYVE Podcast, Movement). Match it to their current state.\n- THIS WEEK actions must be specific to their actual data — name the activity type, day count, or dimension score. Not "try to move more" — say "aim for 3 strength sessions" or "log habits 5 out of 7 days".\n\nOUTPUT FORMAT — respond with exactly these five labelled sections, nothing else:\n\nDEBRIEF: [3–4 sentences. Score movement, what drove it, what they actually did this week. Reference specific logged activities. Personal and direct.]\n\nWHATS_WORKING: [1–2 sentences. What they should feel genuinely good about this week. Be specific — name the actual activity or dimension that's strong. No filler.]\n\nTHIS_WEEK:\n- [Action 1: specific, measurable, tied to their goal or a real gap]\n- [Action 2: specific, measurable, different pillar from Action 1]\n- [Action 3: specific, measurable — can be the focus area they selected]\n\nHABIT: [One habit suggestion tied to their stated focus or biggest gap. Format: habit name | one sentence on why it fits this specific week.]\n\nCONTENT: [One VYVE session type that fits their current state. Format: session name | one sentence on why now, tied to their actual week.]`;

  const userMessage = free_text
    ? `Mood score: ${mood}/10. In my own words: "${free_text}"`
    : `Mood score: ${mood}/10.`;

  const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: 'claude-sonnet-4-5', max_tokens: 1200, system: systemPrompt, messages: [{ role: 'user', content: userMessage }] })
  });
  if (!aiRes.ok) {
    const errText = await aiRes.text();
    console.error('[wellbeing-checkin] Anthropic new-path error:', aiRes.status, errText.slice(0, 500));
    throw new Error(`Anthropic error ${aiRes.status}: ${errText.slice(0, 200)}`);
  }
  const aiData = await aiRes.json();
  const rawText: string = aiData.content?.[0]?.text ?? '';

  const debriefMatch      = rawText.match(/DEBRIEF:\s*([\s\S]*?)(?=\nWHATS_WORKING:|$)/i);
  const whatsWorkingMatch = rawText.match(/WHATS_WORKING:\s*([\s\S]*?)(?=\nTHIS_WEEK:|$)/i);
  const thisWeekMatch     = rawText.match(/THIS_WEEK:\s*([\s\S]*?)(?=\nHABIT:|$)/i);
  const habitMatch        = rawText.match(/HABIT:\s*([\s\S]*?)(?=\nCONTENT:|$)/i);
  const contentMatch      = rawText.match(/CONTENT:\s*([\s\S]*?)$/i);

  const debrief_text    = debriefMatch?.[1]?.trim() ?? rawText.trim();
  const whats_working   = whatsWorkingMatch?.[1]?.trim() ?? '';

  const thisWeekRaw = thisWeekMatch?.[1]?.trim() ?? '';
  const this_week_actions: string[] = thisWeekRaw
    .split('\n')
    .map((l: string) => l.trim())
    .filter((l: string) => l.startsWith('-'))
    .map((l: string) => l.slice(1).trim())
    .filter(Boolean);

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

  const activity_date = ukToday();
  const { iso_week, iso_year } = getISOWeek(todayDate);
  const day_of_week = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][todayDate.getUTCDay()];
  const time_of_day = getTimeOfDay();
  const nowISO = todayDate.toISOString();

  try {
    const wsRes = await fetch(`${SUPABASE_URL}/rest/v1/weekly_scores`, {
      method: 'POST',
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({ member_email: email, iso_week, iso_year, activity_date, wellbeing_score: mood, logged_at: nowISO })
    });
    if (!wsRes.ok) console.warn(`weekly_scores write returned ${wsRes.status}`);
  } catch (e: unknown) { console.warn('weekly_scores write failed:', e); }

  try {
    const wcRes = await fetch(`${SUPABASE_URL}/rest/v1/wellbeing_checkins?on_conflict=member_email,iso_week,iso_year`, {
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
        free_text:         free_text || null,
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
    `Weekly check-in v37 (mood=${mood}, habits=${habitDays}d, workouts=${workouts.length}, cardio=${cardio.length}, movement=${movement.length}, mind=${mind.length}, drivers=${drivers?.join(',') || 'none'}, focus=${improvement_focus || 'none'})`,
    rawText,
    { model: 'claude-sonnet-4-5', max_tokens: 1200, mood, dimensions: {dimension_energy, dimension_sleep, dimension_stress, dimension_body}, drivers, improvement_focus, previous_score: previousScore, iso_week, iso_year, path: 'new_v37',
      activity_counts: { habitDays, workouts: workouts.length, cardio: cardio.length, movement: movement.length, mind: mind.length, sessions: hsSessions } }
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
    whats_working,
    this_week_actions,
    habit_name,
    habit_reason,
    content_name,
    content_reason,
    daily_mood_7d,
    persona,
    persona_display: PERSONA_DISPLAY[persona] || persona,
    full: rawText,
  }), {
    headers: { ...CORS, 'Content-Type': 'application/json' }
  });
}

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
    body: JSON.stringify({ model: 'claude-sonnet-4-5', max_tokens: 800, system: systemPrompt, messages: [{ role: 'user', content: userMessage }] })
  });
  if (!aiRes.ok) {
    const errText = await aiRes.text();
    console.error('[wellbeing-checkin] Anthropic legacy error:', aiRes.status, errText.slice(0, 500));
    throw new Error(`Anthropic error ${aiRes.status}: ${errText.slice(0, 200)}`);
  }
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
    const wcRes = await fetch(`${SUPABASE_URL}/rest/v1/wellbeing_checkins?on_conflict=member_email,iso_week,iso_year`, {
      method: 'POST',
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({ member_email: email, activity_date, day_of_week, time_of_day, iso_week, iso_year, score_wellbeing: score, flow_type: flow === 'quiet' ? 'quiet' : 'active', ai_recommendation: text, ai_persona: persona, logged_at: nowISO, free_text: answer || null })
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
    model: 'claude-sonnet-4-5', max_tokens: 800, score_wellbeing: score, flow_type: flow === 'quiet' ? 'quiet' : 'active', previous_score: previousScore, deferred: isDeferred, iso_week, iso_year, path: 'legacy'
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

    // v37: safeguarding scan on any member free-text, both paths, fire-and-forget.
    try {
      const scanFields: Record<string, string> = {};
      if (typeof body.free_text === 'string' && body.free_text.trim()) scanFields.free_text = body.free_text;
      if (typeof body.answer === 'string' && (body.answer as string).trim()) scanFields.answer = body.answer as string;
      if (Object.keys(scanFields).length > 0) {
        const nameGuess = String((body.member as Record<string, unknown> | undefined)?.firstName ?? '');
        EdgeRuntime.waitUntil(scanForCrisis(email, nameGuess, 'weekly_checkin', scanFields));
      }
    } catch (_e) { /* never block the check-in */ }

    if ('mood' in body) {
      return await handleNewCheckin(email, body, CORS);
    } else {
      return await handleLegacyCheckin(req, email, body, CORS);
    }

  } catch (err: unknown) {
    console.error('[wellbeing-checkin] outer catch:', String(err));
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
