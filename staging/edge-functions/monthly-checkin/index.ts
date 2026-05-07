// monthly-checkin v18
// v18 FIX: nutrition_logs schema drift. The table uses `activity_date` (not `log_date`)
//         and `calories_kcal` (not `calories`). v17 (and earlier) queried the old column
//         names which produced a Postgres 42703 error inside Promise.all, killing the
//         entire POST handler with a 500. Symptom: page jumps back to question and
//         alerts "Something went wrong". Zero successful monthly check-ins ever in DB.
// v17 FIX: GET requests now accept ?email=... query-string fallback when the JWT
//         doesn't resolve to a user. Previously the page would POST/GET with
//         ?email=... but the EF only ever read the email from the JWT or POST body,
//         producing a 400 "Missing email" for any user whose session hadn't fully
//         initialised.
// Fix: wellbeing_checkins table uses `score_wellbeing` (not `wellbeing_score`).
// `band` and `answer` columns do not exist on this table and have been dropped.
// Band is derived inline from the 1-10 score.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const SUPABASE_ANON = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const ANTHROPIC_KEY = Deno.env.get('ANTHROPIC_API_KEY') ?? '';
const CORS = {
  'Access-Control-Allow-Origin': 'https://online.vyvehealth.co.uk',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Credentials': 'true'
};
const PERSONA_VOICES = {
  NOVA: 'You are NOVA — a high-performance coach. Direct, data-led, precision-focused. Push the member with structured insights and measurable targets.',
  RIVER: 'You are RIVER — a mindful wellness guide. Calm, empathetic, restorative. Lead with compassion and sustainable progress.',
  SPARK: 'You are SPARK — a motivational powerhouse. Energetic, warm, challenge-driven. Celebrate wins, build momentum, call out patterns.',
  SAGE: 'You are SAGE — a knowledge-first mentor. Evidence-based, thoughtful. Explain the why behind every observation and recommendation.',
  HAVEN: 'You are HAVEN — a gentle wellbeing companion. Non-judgmental, trauma-informed. Always lead with warmth. Never push hard targets.'
};
async function q(table, params) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`
    }
  });
  if (!res.ok) throw new Error(`Query failed on ${table}: ${await res.text()}`);
  return res.json();
}
// Derive band label from a 1-10 wellbeing score
function scoreBand(score) {
  if (score <= 3) return 'struggling';
  if (score <= 5) return 'getting by';
  if (score <= 7) return 'solid';
  return 'strong';
}
function getMonthWindow() {
  const now = new Date();
  const day = now.getUTCDate();
  const year = now.getUTCFullYear();
  const mon = now.getUTCMonth();
  let finalDataYear;
  let finalDataMon;
  if (day >= 25) {
    finalDataYear = year;
    finalDataMon = mon;
  } else {
    finalDataYear = mon === 0 ? year - 1 : year;
    finalDataMon = mon === 0 ? 11 : mon - 1;
  }
  const isoMonth = `${finalDataYear}-${String(finalDataMon + 1).padStart(2, '0')}`;
  const monthName = new Date(finalDataYear, finalDataMon, 1).toLocaleString('en-GB', {
    month: 'long',
    year: 'numeric'
  });
  const start = `${finalDataYear}-${String(finalDataMon + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(finalDataYear, finalDataMon + 1, 0).getDate();
  const end = `${finalDataYear}-${String(finalDataMon + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  const nextWindowMon = finalDataMon === 11 ? 0 : finalDataMon + 1;
  const nextWindowYear = finalDataMon === 11 ? finalDataYear + 1 : finalDataYear;
  const nextWindowName = new Date(nextWindowYear, nextWindowMon, 1).toLocaleString('en-GB', {
    month: 'long'
  });
  const opensNext = `25 ${nextWindowName}`;
  return {
    available: true,
    windowInfo: '',
    isoMonth,
    monthName,
    start,
    end,
    opensNext
  };
}
// Check if member is new (joined < 1 full calendar month ago)
function isNewMember(joinedAt) {
  if (!joinedAt) return {
    locked: false,
    availableFrom: ''
  };
  const joined = new Date(joinedAt);
  const now = new Date();
  const eligibleYear = joined.getUTCMonth() === 11 ? joined.getUTCFullYear() + 1 : joined.getUTCFullYear();
  const eligibleMon = joined.getUTCMonth() === 11 ? 0 : joined.getUTCMonth() + 1;
  const eligibleDate = new Date(Date.UTC(eligibleYear, eligibleMon, 1));
  const locked = now < eligibleDate;
  const monthName = eligibleDate.toLocaleString('en-GB', {
    month: 'long',
    year: 'numeric'
  });
  const availableFrom = locked ? `1st ${monthName}` : '';
  return {
    locked,
    availableFrom
  };
}
function buildWeightSummary(logs) {
  if (!logs.length) return '  No weight logs this month';
  const sorted = [
    ...logs
  ].sort((a, b)=>a.logged_date.localeCompare(b.logged_date));
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const change = parseFloat((last.weight_kg - first.weight_kg).toFixed(1));
  const trend = sorted.map((l)=>`${l.logged_date}: ${l.weight_kg}kg`).join(', ');
  return [
    `  Entries: ${logs.length}`,
    `  Start of month: ${first.weight_kg}kg (${first.logged_date})`,
    `  End of month:   ${last.weight_kg}kg (${last.logged_date})`,
    `  Change:         ${change >= 0 ? '+' : ''}${change}kg`,
    `  Full trend:     ${trend}`
  ].join('\n');
}
// v18: nutrition_logs columns are activity_date + calories_kcal (was log_date + calories in v17 and earlier).
function buildNutritionSummary(logs) {
  if (!logs.length) return '  No nutrition logs this month';
  const days = new Set(logs.map((l)=>l.activity_date)).size;
  const totCal = logs.reduce((s, l)=>s + (l.calories_kcal || 0), 0);
  const totProt = logs.reduce((s, l)=>s + (l.protein_g || 0), 0);
  return [
    `  Days with food logged: ${days}`,
    `  Avg daily calories:    ${Math.round(totCal / days)} kcal`,
    `  Avg daily protein:     ${Math.round(totProt / days)}g`
  ].join('\n');
}
serve(async (req)=>{
  if (req.method === 'OPTIONS') return new Response('ok', {
    headers: CORS
  });
  try {
    let email = null;
    const authHeader = req.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      if (token !== SUPABASE_ANON) {
        try {
          const sb = createClient(SUPABASE_URL, SUPABASE_ANON);
          const { data: { user }, error } = await sb.auth.getUser(token);
          if (!error && user?.email) email = user.email.toLowerCase();
        } catch (_) {}
      }
    }
    const body = req.method === 'POST' ? await req.json().catch(()=>({})) : {};
    if (!email) email = (body.email ?? '').toLowerCase();
    // v17 FIX: fall back to query-string ?email=... for GET requests
    if (!email) {
      try {
        const urlEmail = new URL(req.url).searchParams.get('email');
        if (urlEmail) email = urlEmail.toLowerCase();
      } catch (_) {}
    }
    if (!email) return new Response(JSON.stringify({
      error: 'Missing email'
    }), {
      status: 400,
      headers: {
        ...CORS,
        'Content-Type': 'application/json'
      }
    });
    const win = getMonthWindow();
    const enc = encodeURIComponent(email);
    // GET: status check
    if (req.method === 'GET') {
      const [existing, memberRows] = await Promise.all([
        q('monthly_checkins', `member_email=eq.${enc}&iso_month=eq.${win.isoMonth}&select=id,ai_report,created_at,avg_score,score_wellbeing,score_energy,score_stress,score_physical,score_sleep,score_diet,score_social,score_motivation,goal_progress_score&limit=1`),
        q('members', `email=eq.${enc}&select=specific_goal,success_vision,created_at&limit=1`)
      ]);
      const mg = memberRows[0] ?? {};
      const goalText = mg.specific_goal || mg.success_vision || null;
      const { locked, availableFrom } = isNewMember(mg.created_at || null);
      if (locked) {
        return new Response(JSON.stringify({
          available: true,
          newMemberLocked: true,
          availableFrom,
          isoMonth: win.isoMonth,
          monthName: win.monthName,
          opensNext: win.opensNext,
          memberGoal: goalText
        }), {
          headers: {
            ...CORS,
            'Content-Type': 'application/json'
          }
        });
      }
      return new Response(JSON.stringify({
        available: true,
        newMemberLocked: false,
        alreadyDone: existing.length > 0,
        isoMonth: win.isoMonth,
        monthName: win.monthName,
        opensNext: win.opensNext,
        existing: existing[0] ?? null,
        memberGoal: goalText
      }), {
        headers: {
          ...CORS,
          'Content-Type': 'application/json'
        }
      });
    }
    // POST: submit
    if (req.method !== 'POST') return new Response('Method not allowed', {
      status: 405,
      headers: CORS
    });
    const { scores, notes, goal_progress_score, goal_progress_note } = body;
    if (!scores) return new Response(JSON.stringify({
      error: 'Missing scores'
    }), {
      status: 400,
      headers: {
        ...CORS,
        'Content-Type': 'application/json'
      }
    });
    const memberCheckRows = await q('members', `email=eq.${enc}&select=created_at&limit=1`);
    const { locked: postLocked } = isNewMember(memberCheckRows[0]?.created_at || null);
    if (postLocked) {
      return new Response(JSON.stringify({
        error: 'not_available_yet'
      }), {
        status: 403,
        headers: {
          ...CORS,
          'Content-Type': 'application/json'
        }
      });
    }
    const alreadyDone = await q('monthly_checkins', `member_email=eq.${enc}&iso_month=eq.${win.isoMonth}&select=id&limit=1`);
    if (alreadyDone.length > 0) {
      return new Response(JSON.stringify({
        error: 'already_done'
      }), {
        status: 409,
        headers: {
          ...CORS,
          'Content-Type': 'application/json'
        }
      });
    }
    const { isoMonth, monthName, start, end } = win;
    const dateFilter = `activity_date=gte.${start}&activity_date=lte.${end}`;
    const dateFilter2 = `logged_date=gte.${start}&logged_date=lte.${end}`;
    // v18: nutrition_logs uses activity_date (was log_date in v17 — caused 42703 column-not-exist)
    const dateFilter3 = `activity_date=gte.${start}&activity_date=lte.${end}`;
    const [memberRows, habits, workouts, cardio, sessions, replays, wbCheckins, historicalCheckins, weightLogs, nutritionLogs] = await Promise.all([
      q('members', [
        `email=eq.${enc}&select=`,
        `first_name,persona,`,
        `baseline_wellbeing,baseline_energy,baseline_stress,baseline_sleep,`,
        `baseline_physical,baseline_diet,baseline_social,baseline_motivation,`,
        `training_location,equipment,injuries,experience_level,training_days_per_week,`,
        `life_context,sensitive_context,past_barriers,success_vision,`,
        `sleep_issues,height_cm,weight_kg,tdee_target,specific_goal,`,
        `onboarding_completed_at&limit=1`
      ].join('')),
      q('daily_habits', `member_email=eq.${enc}&${dateFilter}&select=activity_date`),
      q('workouts', `member_email=eq.${enc}&${dateFilter}&select=activity_date,workout_name`),
      q('cardio', `member_email=eq.${enc}&${dateFilter}&select=activity_date,cardio_type`),
      q('session_views', `member_email=eq.${enc}&${dateFilter}&select=activity_date,session_name`),
      q('replay_views', `member_email=eq.${enc}&${dateFilter}&select=activity_date,session_name`),
      q('wellbeing_checkins', `member_email=eq.${enc}&activity_date=gte.${start}&activity_date=lte.${end}` + `&select=score_wellbeing,activity_date&order=activity_date.asc`),
      q('monthly_checkins', `member_email=eq.${enc}&iso_month=neq.${isoMonth}` + `&select=iso_month,avg_score,score_wellbeing,score_energy,score_stress,` + `score_physical,score_sleep,score_diet,score_social,score_motivation,` + `goal_progress_score,goal_progress_note` + `&order=iso_month.desc&limit=4`),
      q('weight_logs', `member_email=eq.${enc}&${dateFilter2}&select=logged_date,weight_kg&order=logged_date.asc`),
      // v18: select activity_date + calories_kcal (was log_date + calories — both renamed in PM-12 nutrition rework)
      q('nutrition_logs', `member_email=eq.${enc}&${dateFilter3}&select=activity_date,calories_kcal,protein_g&order=activity_date.asc`)
    ]);
    const member = memberRows[0] ?? {};
    const firstName = (member.first_name || 'there').toLowerCase().replace(/\b\w/g, (c)=>c.toUpperCase());
    const persona = member.persona || 'SPARK';
    const voice = PERSONA_VOICES[persona] || PERSONA_VOICES.SPARK;
    const memberGoalText = member.specific_goal || member.success_vision || 'Not specified at onboarding';
    const activityMap = {};
    const add = (rows, type)=>rows.forEach((r)=>{
        if (!activityMap[r.activity_date]) activityMap[r.activity_date] = [];
        if (!activityMap[r.activity_date].includes(type)) activityMap[r.activity_date].push(type);
      });
    add(habits, 'habits');
    add(workouts, 'workouts');
    add(cardio, 'cardio');
    add(sessions, 'sessions');
    add(replays, 'sessions');
    const activeDays = Object.keys(activityMap).length;
    const totalHabits = habits.length;
    const totalWorkouts = workouts.length;
    const totalCardio = cardio.length;
    const totalSessions = sessions.length + replays.length;
    const totalCheckins = wbCheckins.length;
    const sessionNames = [
      ...new Set([
        ...sessions.map((s)=>s.session_name),
        ...replays.map((s)=>s.session_name)
      ].filter(Boolean))
    ];
    const wbSummary = wbCheckins.length ? wbCheckins.map((c)=>`  Week of ${c.activity_date}: score ${c.score_wellbeing}/10 (${scoreBand(c.score_wellbeing)})`).join('\n') : '  No weekly check-ins completed this month';
    const avgWellbeing = wbCheckins.length ? (wbCheckins.reduce((s, r)=>s + (r.score_wellbeing || 0), 0) / wbCheckins.length).toFixed(1) : null;
    const LABELS = {
      wellbeing: 'Overall Wellbeing',
      energy: 'Energy Levels',
      stress: 'Stress Levels',
      physical: 'Physical Health',
      sleep: 'Sleep Quality',
      diet: 'Diet & Nutrition',
      social: 'Social Connection',
      motivation: 'Motivation & Purpose'
    };
    const avg = Object.values(scores).reduce((a, b)=>a + b, 0) / 8;
    const scoresText = Object.entries(LABELS).map(([id, label])=>`  ${label}: ${scores[id]}/10${notes?.[id] ? ` — "${notes[id]}"` : ''}`).join('\n');
    const baselineMap = {
      wellbeing: 'baseline_wellbeing',
      energy: 'baseline_energy',
      stress: 'baseline_stress',
      physical: 'baseline_physical',
      sleep: 'baseline_sleep',
      diet: 'baseline_diet',
      social: 'baseline_social',
      motivation: 'baseline_motivation'
    };
    const deltaLines = Object.entries(baselineMap).filter(([id, col])=>member[col] != null && scores[id] != null).map(([id, col])=>{
      const base = member[col], now = scores[id];
      const diff = now - base;
      return `  ${LABELS[id]}: ${base} → ${now} (${diff >= 0 ? '+' : ''}${diff})`;
    }).join('\n');
    const historicalText = historicalCheckins.length ? historicalCheckins.map((h)=>`  ${h.iso_month}: avg ${h.avg_score}/10 | wb ${h.score_wellbeing} energy ${h.score_energy} stress ${h.score_stress} sleep ${h.score_sleep}` + (h.goal_progress_score != null ? ` | goal progress ${h.goal_progress_score}/10${h.goal_progress_note ? ` — "${h.goal_progress_note}"` : ''}` : '')).join('\n') : '  No previous monthly check-ins (this is their first)';
    const profileLines = [];
    if (member.experience_level) profileLines.push(`Experience: ${member.experience_level}`);
    if (member.training_days_per_week) profileLines.push(`Training days/week: ${member.training_days_per_week}`);
    if (member.training_location) profileLines.push(`Location: ${member.training_location}`);
    if (member.injuries) profileLines.push(`Injuries: ${member.injuries}`);
    if (member.sleep_issues) profileLines.push(`Sleep issues at onboarding: ${member.sleep_issues}`);
    if (member.past_barriers) profileLines.push(`Past barriers: ${member.past_barriers}`);
    if (member.specific_goal) profileLines.push(`Specific goal: ${member.specific_goal}`);
    if (member.success_vision) profileLines.push(`Success vision: ${member.success_vision}`);
    if (member.weight_kg) profileLines.push(`Starting weight (onboarding): ${member.weight_kg}kg`);
    if (member.tdee_target) profileLines.push(`Calorie target: ${member.tdee_target} kcal/day`);
    if (member.life_context?.length) profileLines.push(`Life context: ${member.life_context.join(', ')}`);
    if (member.sensitive_context) profileLines.push(`Sensitive context: yes — lead with care`);
    const profileText = profileLines.join('\n') || 'Onboarding data not available';
    const goalProgressText = [
      `  Goal: ${memberGoalText}`,
      `  Self-rated progress this month: ${goal_progress_score ?? 'not provided'}/10`,
      goal_progress_note ? `  Member's own words: "${goal_progress_note}"` : ''
    ].filter(Boolean).join('\n');
    const systemPrompt = [
      voice,
      '',
      `You are writing ${firstName}'s ${monthName} monthly wellbeing report.`,
      `You have their full profile, activity data, weight trend, nutrition tracking, weekly check-in responses, goal progress, and historical data.`,
      `Make the report feel genuinely personal — use their actual numbers, their own words, their goal.`,
      '',
      'STRUCTURE (follow exactly):',
      `1. Opening (2-3 sentences): acknowledge ${monthName} honestly — active days, workouts, avg score. Warm but direct.`,
      '2. Goal progress (most important section): name their goal explicitly. Reference what they said. Use actual weight numbers if available. Praise real progress. Be honest if progress was slow.',
      "3. What's working: 2-3 sentences on strongest scores/activity. Quote their notes.",
      "4. What needs attention: 2-3 sentences on lower areas. Direct but kind.",
      '5. Trend: 1-2 sentences vs last month or onboarding baseline.',
      '6. Three recommendations: numbered, specific, actionable, tied to their goal and barriers.',
      '',
      'RULES: Under 500 words. Never mention AI. Use their name. If weight goal, always cite actual numbers. No invented data.'
    ].join('\n');
    const userPrompt = [
      '=== MEMBER PROFILE ===',
      profileText,
      '',
      '=== GOAL PROGRESS THIS MONTH ===',
      goalProgressText,
      '',
      '=== WEIGHT LOG ===',
      buildWeightSummary(weightLogs),
      '',
      '=== NUTRITION TRACKING ===',
      buildNutritionSummary(nutritionLogs),
      '',
      '=== BASELINE vs NOW ===',
      deltaLines || '  Not available',
      '',
      `=== ${monthName.toUpperCase()} ACTIVITY ===`,
      `Active days: ${activeDays}`,
      `Habits: ${totalHabits}`,
      `Workouts: ${totalWorkouts}`,
      `Cardio: ${totalCardio}`,
      `Sessions watched: ${totalSessions}${sessionNames.length ? ` (${sessionNames.slice(0, 5).join(', ')})` : ''}`,
      `Weekly check-ins: ${totalCheckins}`,
      '',
      '=== WEEKLY CHECK-IN RESPONSES ===',
      wbSummary,
      '',
      '=== SELF-RATED SCORES ===',
      scoresText,
      `Overall avg: ${avg.toFixed(1)}/10`,
      '',
      '=== HISTORICAL (last 4 months) ===',
      historicalText
    ].join('\n');
    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 900,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt
          }
        ]
      })
    });
    if (!aiRes.ok) throw new Error(`Anthropic error: ${aiRes.status} ${await aiRes.text()}`);
    const aiData = await aiRes.json();
    const aiReport = aiData?.content?.[0]?.text ?? 'Unable to generate report.';
    await fetch(`${SUPABASE_URL}/rest/v1/monthly_checkins`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify({
        member_email: email,
        iso_month: isoMonth,
        score_wellbeing: scores.wellbeing,
        score_energy: scores.energy,
        score_stress: scores.stress,
        score_physical: scores.physical,
        score_sleep: scores.sleep,
        score_diet: scores.diet,
        score_social: scores.social,
        score_motivation: scores.motivation,
        note_wellbeing: notes?.wellbeing || null,
        note_energy: notes?.energy || null,
        note_stress: notes?.stress || null,
        note_physical: notes?.physical || null,
        note_sleep: notes?.sleep || null,
        note_diet: notes?.diet || null,
        note_social: notes?.social || null,
        note_motivation: notes?.motivation || null,
        goal_progress_score: goal_progress_score ?? null,
        goal_progress_note: goal_progress_note || null,
        avg_score: parseFloat(avg.toFixed(2)),
        ai_report: aiReport,
        created_at: new Date().toISOString()
      })
    });
    return new Response(JSON.stringify({
      aiReport,
      firstName,
      monthName,
      isoMonth,
      opensNext: win.opensNext,
      memberGoal: memberGoalText,
      activity: {
        activeDays,
        totalHabits,
        totalWorkouts,
        totalCardio,
        totalSessions,
        totalCheckins,
        avgWellbeing,
        activityMap
      },
      scores,
      avg: parseFloat(avg.toFixed(1))
    }), {
      headers: {
        ...CORS,
        'Content-Type': 'application/json'
      }
    });
  } catch (err) {
    console.error('monthly-checkin error:', err);
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
