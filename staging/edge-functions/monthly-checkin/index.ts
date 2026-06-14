// monthly-checkin v20
// v20 (PM-382): three-mode state machine. Submit window opens on the 1st of
//               the next calendar month (was: opens on 25th of current month).
//               Page is always live and useful — recap visible across all
//               three modes:
//                 - submit             → recap of the completed month + sliders
//                 - in_progress        → recap of the running month + "opens in N days"
//                 - new_member_locked  → recap of activity since joining + "your first opens 1st [month]"
//               GET response gains `mode`, `monthStart`, `monthEnd`, `daysUntilOpens`,
//               and returns both the data-month window and submit-window context.
//               POST validates against the submit window only and 403s for any
//               attempt to submit outside submit mode.
//               BST-aware "today" computed server-side (was UTC) — was a real
//               00-01 BST DST bug that would have surfaced the wrong submit
//               month at midnight transitions.
// v19 (PM-379): activity rollup migrated to canonical 4-pillar shape
//             (Habits / Body / Mind / Connect) — mirrors weekly recap
//             PM-362.b. Adds movement_activities, mind_activities,
//             connect_checkins, session_live_views, replay_video_views
//             to the parallel read, deduplicates session views across
//             the 4 view tables, and reshapes the Anthropic prompt's
//             === ACTIVITY === block so the AI sees Mind/Body/Connect/
//             Habits + weekly check-ins. Response body activity field
//             gains pillar totals (bodyTotal, mindTotal, connectTotal,
//             habitsDays) while preserving legacy fields for back-compat.
// v18 FIX: nutrition_logs schema drift. The table uses `activity_date` (not `log_date`)
//         and `calories_kcal` (not `calories`). v17 (and earlier) queried the old column
//         names which produced a Postgres 42703 error inside Promise.all, killing the
//         entire POST handler with a 500. Symptom: page jumps back to question and
//         alerts "Something went wrong". Zero successful monthly check-ins ever in DB.
// v17 FIX: GET requests now accept ?email=... query-string fallback when the JWT
//         doesn't resolve to a user.
// Fix: wellbeing_checkins table uses `score_wellbeing` (not `wellbeing_score`).
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL  = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const SUPABASE_ANON = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const ANTHROPIC_KEY = Deno.env.get('ANTHROPIC_API_KEY') ?? '';

const CORS = {
  'Access-Control-Allow-Origin': 'https://online.vyvehealth.co.uk',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Credentials': 'true',
};

const PERSONA_VOICES: Record<string, string> = {
  NOVA:  'You are NOVA — a high-performance coach. Direct, data-led, precision-focused. Push the member with structured insights and measurable targets.',
  RIVER: 'You are RIVER — a mindful wellness guide. Calm, empathetic, restorative. Lead with compassion and sustainable progress.',
  SPARK: 'You are SPARK — a motivational powerhouse. Energetic, warm, challenge-driven. Celebrate wins, build momentum, call out patterns.',
  SAGE:  'You are SAGE — a knowledge-first mentor. Evidence-based, thoughtful. Explain the why behind every observation and recommendation.',
  HAVEN: 'You are HAVEN — a gentle wellbeing companion. Non-judgmental, trauma-informed. Always lead with warmth. Never push hard targets.',
};

async function q(table: string, params: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
  });
  if (!res.ok) throw new Error(`Query failed on ${table}: ${await res.text()}`);
  return res.json();
}

function scoreBand(score: number): string {
  if (score <= 3) return 'struggling';
  if (score <= 5) return 'getting by';
  if (score <= 7) return 'solid';
  return 'strong';
}

// PM-382: BST-aware "today" server-side. UK members are the primary cohort and
// the existing client-side code is BST-locked (see §23.7.7 in the brain). The
// EF needs to agree with the client on what "today" is or the submit window
// rolls over at the wrong moment for members tapping at 00-01 BST. DST-aware
// via Intl.DateTimeFormat with explicit Europe/London tz so the EF works year
// round (BST in summer = UTC+1, GMT in winter = UTC+0). Returns Y/M/D ints.
function bstToday(): { year: number; month: number; day: number } {
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London', year: 'numeric', month: 'numeric', day: 'numeric'
  });
  const parts = fmt.formatToParts(new Date());
  const year  = parseInt(parts.find(p => p.type === 'year')!.value, 10);
  const month = parseInt(parts.find(p => p.type === 'month')!.value, 10) - 1; // 0-indexed
  const day   = parseInt(parts.find(p => p.type === 'day')!.value, 10);
  return { year, month, day };
}

type MonthInfo = {
  isoMonth: string;   // "2026-04"
  monthName: string;  // "April 2026"
  start: string;      // "2026-04-01"
  end: string;        // "2026-04-30"
};

function buildMonthInfo(year: number, mon: number): MonthInfo {
  const isoMonth  = `${year}-${String(mon + 1).padStart(2, '0')}`;
  const monthName = new Date(year, mon, 1).toLocaleString('en-GB', { month: 'long', year: 'numeric' });
  const start     = `${year}-${String(mon + 1).padStart(2, '0')}-01`;
  const lastDay   = new Date(year, mon + 1, 0).getDate();
  const end       = `${year}-${String(mon + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { isoMonth, monthName, start, end };
}

// PM-382: window logic.
// `submitWindow` = the completed calendar month that is the current target of
//                  a monthly check-in submission. Today is 25 May 2026 → April.
// `inProgress`   = the running calendar month.                           → May.
// `opensNext`    = display string for when the in-progress month will become
//                  the next submit window (always 1st of inProgress + 1).
// `daysUntilOpens` = whole days from today to that 1st-of-next-month date.
function computeWindows() {
  const today = bstToday();
  const inProgressYear = today.year;
  const inProgressMon  = today.month;
  const submitYear     = inProgressMon === 0 ? inProgressYear - 1 : inProgressYear;
  const submitMon      = inProgressMon === 0 ? 11 : inProgressMon - 1;

  const inProgress    = buildMonthInfo(inProgressYear, inProgressMon);
  const submitWindow  = buildMonthInfo(submitYear, submitMon);

  // "Opens 1st [month after inProgress]"
  const nextOpensMon  = inProgressMon === 11 ? 0 : inProgressMon + 1;
  const nextOpensYear = inProgressMon === 11 ? inProgressYear + 1 : inProgressYear;
  const opensNextDate = new Date(nextOpensYear, nextOpensMon, 1);
  const opensNext     = opensNextDate.toLocaleString('en-GB', { day: 'numeric', month: 'long' }); // "1 June"
  // Days from today (BST) to opensNextDate (00:00 local). Use UTC midnight of
  // both for the subtraction to avoid DST off-by-one.
  const todayUTC      = Date.UTC(today.year, today.month, today.day);
  const opensNextUTC  = Date.UTC(nextOpensYear, nextOpensMon, 1);
  const daysUntilOpens = Math.max(0, Math.round((opensNextUTC - todayUTC) / 86_400_000));

  return { submitWindow, inProgress, opensNext, daysUntilOpens };
}

function isNewMember(joinedAt: string | null): { locked: boolean; availableFrom: string; eligibleIsoMonth: string } {
  if (!joinedAt) return { locked: false, availableFrom: '', eligibleIsoMonth: '' };
  const joined = new Date(joinedAt);
  // First eligible submit window = first calendar month AFTER the join month
  // is fully complete. Joined 15 April 2026 → first full month = May → first
  // submit window = May → opens 1 June 2026. Joined 31 March → April is first
  // full month → submit window May → opens 1 June.
  // Equivalent: eligible when today is on/after the 1st of (joinMonth + 2).
  // joined 15 Apr → eligibleDate = 1 Jun.
  const eligibleYear  = joined.getUTCMonth() >= 10 ? joined.getUTCFullYear() + 1 : joined.getUTCFullYear();
  const eligibleMon   = (joined.getUTCMonth() + 2) % 12;
  const eligibleDate  = new Date(Date.UTC(eligibleYear, eligibleMon, 1));

  const today = bstToday();
  const todayUTC = Date.UTC(today.year, today.month, today.day);
  const locked = todayUTC < eligibleDate.getTime();
  const monthName = eligibleDate.toLocaleString('en-GB', { month: 'long', year: 'numeric' });
  const availableFrom = locked ? `1 ${monthName}` : '';
  const eligibleIsoMonth = `${eligibleYear}-${String(eligibleMon + 1).padStart(2, '0')}`;
  return { locked, availableFrom, eligibleIsoMonth };
}

function buildWeightSummary(logs: { logged_date: string; weight_kg: number }[]): string {
  if (!logs.length) return '  No weight logs this month';
  const sorted = [...logs].sort((a, b) => a.logged_date.localeCompare(b.logged_date));
  const first  = sorted[0];
  const last   = sorted[sorted.length - 1];
  const change = parseFloat((last.weight_kg - first.weight_kg).toFixed(1));
  const trend  = sorted.map(l => `${l.logged_date}: ${l.weight_kg}kg`).join(', ');
  return [
    `  Entries: ${logs.length}`,
    `  Start of month: ${first.weight_kg}kg (${first.logged_date})`,
    `  End of month:   ${last.weight_kg}kg (${last.logged_date})`,
    `  Change:         ${change >= 0 ? '+' : ''}${change}kg`,
    `  Full trend:     ${trend}`,
  ].join('\n');
}

function buildNutritionSummary(logs: { activity_date: string; calories_kcal: number; protein_g: number }[]): string {
  if (!logs.length) return '  No nutrition logs this month';
  const days    = new Set(logs.map(l => l.activity_date)).size;
  const totCal  = logs.reduce((s, l) => s + (l.calories_kcal || 0), 0);
  const totProt = logs.reduce((s, l) => s + (l.protein_g || 0), 0);
  return [
    `  Days with food logged: ${days}`,
    `  Avg daily calories:    ${Math.round(totCal / days)} kcal`,
    `  Avg daily protein:     ${Math.round(totProt / days)}g`,
  ].join('\n');
}

function countByKind(rows: { kind?: string; cardio_type?: string }[], kindField: 'kind' | 'cardio_type'): Record<string, number> {
  const out: Record<string, number> = {};
  for (const r of rows) {
    const k = (r as Record<string, string | undefined>)[kindField] || 'other';
    out[k] = (out[k] || 0) + 1;
  }
  return out;
}
function fmtByKind(map: Record<string, number>): string {
  const keys = Object.keys(map).filter(k => map[k] > 0);
  if (!keys.length) return '';
  return keys.map(k => `${map[k]} ${k}`).join(', ');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    let email: string | null = null;
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
    const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
    if (!email) email = (body.email ?? '').toLowerCase();
    if (!email) {
      try {
        const urlEmail = new URL(req.url).searchParams.get('email');
        if (urlEmail) email = urlEmail.toLowerCase();
      } catch (_) {}
    }
    if (!email) return new Response(JSON.stringify({ error: 'Missing email' }), {
      status: 400, headers: { ...CORS, 'Content-Type': 'application/json' }
    });

    const { submitWindow, inProgress, opensNext, daysUntilOpens } = computeWindows();
    const enc = encodeURIComponent(email);

    // GET: mode + recap-data-window resolution
    if (req.method === 'GET') {
      const [existing, memberRows] = await Promise.all([
        q('monthly_checkins',
          `member_email=eq.${enc}&iso_month=eq.${submitWindow.isoMonth}&select=id,ai_report,created_at,avg_score,score_wellbeing,score_energy,score_stress,score_physical,score_sleep,score_diet,score_social,score_motivation,goal_progress_score&limit=1`),
        q('members',
          `email=eq.${enc}&select=specific_goal,success_vision,created_at&limit=1`),
      ]);

      const mg = memberRows[0] ?? {};
      const goalText = mg.specific_goal || mg.success_vision || null;

      const newMember = isNewMember(mg.created_at || null);

      // Resolve mode + the data month to render recap against.
      let mode: 'submit' | 'in_progress' | 'new_member_locked';
      let dataMonth: MonthInfo;
      if (newMember.locked) {
        mode = 'new_member_locked';
        dataMonth = inProgress;
      } else if (existing.length > 0) {
        mode = 'in_progress';
        dataMonth = inProgress;
      } else {
        mode = 'submit';
        dataMonth = submitWindow;
      }

      return new Response(JSON.stringify({
        mode,
        // Data month the page should render the recap against
        isoMonth:        dataMonth.isoMonth,
        monthName:       dataMonth.monthName,
        monthStart:      dataMonth.start,
        monthEnd:        dataMonth.end,
        // Submit-window context (always present, even when mode !== 'submit')
        submitIsoMonth:  submitWindow.isoMonth,
        submitMonthName: submitWindow.monthName,
        // When does the next submit window open
        opensNext,            // "1 June"
        daysUntilOpens,       // whole days until it opens
        // New-member fields
        newMemberLocked: newMember.locked,
        availableFrom:   newMember.availableFrom,
        // Already-submitted report (only set in in_progress mode)
        existing:        existing[0] ?? null,
        // Member goal (used in submit-flow personalisation)
        memberGoal:      goalText,
        // Back-compat keys (pre-PM-382 callers)
        available:       true,                              // always true now
        alreadyDone:     existing.length > 0,
      }), { headers: { ...CORS, 'Content-Type': 'application/json' } });
    }

    // POST: submit — strictly validates against submitWindow
    if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: CORS });

    const { scores, notes, goal_progress_score, goal_progress_note } = body;
    if (!scores) return new Response(JSON.stringify({ error: 'Missing scores' }), {
      status: 400, headers: { ...CORS, 'Content-Type': 'application/json' }
    });

    const memberCheckRows = await q('members', `email=eq.${enc}&select=created_at&limit=1`);
    const newMemberCheck = isNewMember(memberCheckRows[0]?.created_at || null);
    if (newMemberCheck.locked) {
      return new Response(JSON.stringify({ error: 'not_available_yet', availableFrom: newMemberCheck.availableFrom }), {
        status: 403, headers: { ...CORS, 'Content-Type': 'application/json' }
      });
    }

    const alreadyDone = await q('monthly_checkins',
      `member_email=eq.${enc}&iso_month=eq.${submitWindow.isoMonth}&select=id&limit=1`);
    if (alreadyDone.length > 0) {
      return new Response(JSON.stringify({ error: 'already_done', isoMonth: submitWindow.isoMonth }), {
        status: 409, headers: { ...CORS, 'Content-Type': 'application/json' }
      });
    }

    const { isoMonth, monthName, start, end } = submitWindow;
    const dateFilter   = `activity_date=gte.${start}&activity_date=lte.${end}`;
    const dateFilter2  = `logged_date=gte.${start}&logged_date=lte.${end}`;
    const dateFilterCK = `checkin_date=gte.${start}&checkin_date=lte.${end}`;

    const [
      memberRows, habits, workouts, cardio, movement, mind, connectCheckins,
      sessions, sessionsLive, replays, replaysVideo,
      wbCheckins, historicalCheckins, weightLogs, nutritionLogs,
    ] = await Promise.all([
      q('members', [
        `email=eq.${enc}&select=`,
        `first_name,persona,`,
        `baseline_wellbeing,baseline_energy,baseline_stress,baseline_sleep,`,
        `baseline_physical,baseline_diet,baseline_social,baseline_motivation,`,
        `training_location,equipment,injuries,experience_level,training_days_per_week,`,
        `life_context,sensitive_context,past_barriers,success_vision,`,
        `sleep_issues,height_cm,weight_kg,tdee_target,specific_goal,`,
        `onboarding_completed_at&limit=1`,
      ].join('')),
      q('daily_habits',         `member_email=eq.${enc}&${dateFilter}&select=activity_date`),
      q('workouts',             `member_email=eq.${enc}&${dateFilter}&select=activity_date,workout_name`),
      q('cardio',               `member_email=eq.${enc}&${dateFilter}&select=activity_date,cardio_type`),
      q('movement_activities',  `member_email=eq.${enc}&${dateFilter}&select=activity_date,kind`),
      q('mind_activities',      `member_email=eq.${enc}&${dateFilter}&select=activity_date,kind`),
      q('connect_checkins',     `member_email=eq.${enc}&${dateFilterCK}&select=checkin_date`),
      q('session_views',        `member_email=eq.${enc}&${dateFilter}&select=activity_date,session_name,category`),
      q('session_live_views',   `member_email=eq.${enc}&${dateFilter}&select=activity_date,category`),
      q('replay_views',         `member_email=eq.${enc}&${dateFilter}&select=activity_date,session_name,category`),
      q('replay_video_views',   `member_email=eq.${enc}&${dateFilter}&select=activity_date,category`),
      q('wellbeing_checkins',
        `member_email=eq.${enc}&activity_date=gte.${start}&activity_date=lte.${end}` +
        `&select=score_wellbeing,activity_date&order=activity_date.asc`),
      q('monthly_checkins',
        `member_email=eq.${enc}&iso_month=neq.${isoMonth}` +
        `&select=iso_month,avg_score,score_wellbeing,score_energy,score_stress,` +
        `score_physical,score_sleep,score_diet,score_social,score_motivation,` +
        `goal_progress_score,goal_progress_note` +
        `&order=iso_month.desc&limit=4`),
      q('weight_logs',
        `member_email=eq.${enc}&${dateFilter2}&select=logged_date,weight_kg&order=logged_date.asc`),
      q('nutrition_logs',
        `member_email=eq.${enc}&${dateFilter}&select=activity_date,calories_kcal,protein_g&order=activity_date.asc`),
    ]);

    const member    = memberRows[0] ?? {};
    const firstName = (member.first_name || 'there')
      .toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase());
    const persona = member.persona || 'SPARK';
    const voice   = PERSONA_VOICES[persona] || PERSONA_VOICES.SPARK;
    const memberGoalText = member.specific_goal || member.success_vision || 'Not specified at onboarding';

    const sessKey = (r: { activity_date?: string; category?: string }) =>
      `${r.activity_date}|${(r.category || '').toLowerCase()}`;
    const sessionSet = new Set<string>();
    sessions.forEach((r: { activity_date?: string; category?: string }) => sessionSet.add(sessKey(r)));
    sessionsLive.forEach((r: { activity_date?: string; category?: string }) => sessionSet.add(sessKey(r)));
    const replaySet = new Set<string>();
    replays.forEach((r: { activity_date?: string; category?: string }) => replaySet.add(sessKey(r)));
    replaysVideo.forEach((r: { activity_date?: string; category?: string }) => replaySet.add(sessKey(r)));
    const totalSessionsWatched = sessionSet.size + replaySet.size;

    const activityMap: Record<string, string[]> = {};
    const addPillar = (rows: { activity_date?: string; checkin_date?: string }[], pillar: string, dateCol: string) => {
      rows.forEach(r => {
        const d = (r as Record<string, string | undefined>)[dateCol];
        if (!d) return;
        if (!activityMap[d]) activityMap[d] = [];
        if (!activityMap[d].includes(pillar)) activityMap[d].push(pillar);
      });
    };
    addPillar(habits,   'habits', 'activity_date');
    addPillar(workouts, 'body',   'activity_date');
    addPillar(cardio,   'body',   'activity_date');
    addPillar(movement, 'body',   'activity_date');
    addPillar(mind,     'mind',   'activity_date');
    addPillar(connectCheckins, 'connect', 'checkin_date');
    addPillar(sessions,        'connect', 'activity_date');
    addPillar(sessionsLive,    'connect', 'activity_date');
    addPillar(replays,         'connect', 'activity_date');
    addPillar(replaysVideo,    'connect', 'activity_date');

    const activeDays    = Object.keys(activityMap).length;
    const habitsDays    = new Set(habits.map((h: { activity_date: string }) => h.activity_date)).size;
    const habitsTicks   = habits.length;
    const bodyTotal     = workouts.length + cardio.length + movement.length;
    const mindTotal     = mind.length;
    const connectTotal  = connectCheckins.length + totalSessionsWatched;
    const totalCheckins = wbCheckins.length;

    const cardioByKind   = countByKind(cardio,   'cardio_type');
    const movementByKind = countByKind(movement, 'kind');
    const mindByKind     = countByKind(mind,     'kind');

    const sessionCategories: string[] = [...new Set([
      ...sessions.map((s: { category?: string }) => s.category),
      ...sessionsLive.map((s: { category?: string }) => s.category),
      ...replays.map((s: { category?: string }) => s.category),
      ...replaysVideo.map((s: { category?: string }) => s.category),
    ].filter(Boolean) as string[])];

    const totalHabits   = habitsTicks;
    const totalWorkouts = workouts.length;
    const totalCardio   = cardio.length;
    const totalSessions = totalSessionsWatched;

    const wbSummary = wbCheckins.length
      ? wbCheckins.map((c: { activity_date: string; score_wellbeing: number }) =>
          `  Week of ${c.activity_date}: score ${c.score_wellbeing}/10 (${scoreBand(c.score_wellbeing)})`).join('\n')
      : '  No weekly check-ins completed this month';

    const avgWellbeing = wbCheckins.length
      ? (wbCheckins.reduce((s: number, r: { score_wellbeing: number }) =>
          s + (r.score_wellbeing || 0), 0) / wbCheckins.length).toFixed(1)
      : null;

    const LABELS: Record<string, string> = {
      wellbeing: 'Overall Wellbeing', energy: 'Energy Levels',
      stress: 'Stress Levels',        physical: 'Physical Health',
      sleep: 'Sleep Quality',         diet: 'Diet & Nutrition',
      social: 'Social Connection',    motivation: 'Motivation & Purpose',
    };
    const avg = (Object.values(scores) as number[]).reduce((a, b) => a + b, 0) / 8;
    const scoresText = Object.entries(LABELS)
      .map(([id, label]) => `  ${label}: ${scores[id]}/10${notes?.[id] ? ` — "${notes[id]}"` : ''}`)
      .join('\n');

    const baselineMap: Record<string, string> = {
      wellbeing: 'baseline_wellbeing', energy: 'baseline_energy',
      stress: 'baseline_stress',       physical: 'baseline_physical',
      sleep: 'baseline_sleep',         diet: 'baseline_diet',
      social: 'baseline_social',       motivation: 'baseline_motivation',
    };
    const deltaLines = Object.entries(baselineMap)
      .filter(([id, col]) => member[col] != null && scores[id] != null)
      .map(([id, col]) => {
        const base = member[col] as number, now = scores[id] as number;
        const diff = now - base;
        return `  ${LABELS[id]}: ${base} → ${now} (${diff >= 0 ? '+' : ''}${diff})`;
      }).join('\n');

    const historicalText = historicalCheckins.length
      ? historicalCheckins.map((h: Record<string, unknown>) =>
          `  ${h.iso_month}: avg ${h.avg_score}/10 | wb ${h.score_wellbeing} energy ${h.score_energy} stress ${h.score_stress} sleep ${h.score_sleep}` +
          (h.goal_progress_score != null ? ` | goal progress ${h.goal_progress_score}/10${h.goal_progress_note ? ` — "${h.goal_progress_note}"` : ''}` : ''))
        .join('\n')
      : '  No previous monthly check-ins (this is their first)';

    const profileLines: string[] = [];
    if (member.experience_level)       profileLines.push(`Experience: ${member.experience_level}`);
    if (member.training_days_per_week) profileLines.push(`Training days/week: ${member.training_days_per_week}`);
    if (member.training_location)      profileLines.push(`Location: ${member.training_location}`);
    if (member.injuries)               profileLines.push(`Injuries: ${member.injuries}`);
    if (member.sleep_issues)           profileLines.push(`Sleep issues at onboarding: ${member.sleep_issues}`);
    if (member.past_barriers)          profileLines.push(`Past barriers: ${member.past_barriers}`);
    if (member.specific_goal)          profileLines.push(`Specific goal: ${member.specific_goal}`);
    if (member.success_vision)         profileLines.push(`Success vision: ${member.success_vision}`);
    if (member.weight_kg)              profileLines.push(`Starting weight (onboarding): ${member.weight_kg}kg`);
    if (member.tdee_target)            profileLines.push(`Calorie target: ${member.tdee_target} kcal/day`);
    if (member.life_context?.length)   profileLines.push(`Life context: ${(member.life_context as string[]).join(', ')}`);
    if (member.sensitive_context)      profileLines.push(`Sensitive context: yes — lead with care`);
    const profileText = profileLines.join('\n') || 'Onboarding data not available';

    const goalProgressText = [
      `  Goal: ${memberGoalText}`,
      `  Self-rated progress this month: ${goal_progress_score ?? 'not provided'}/10`,
      goal_progress_note ? `  Member's own words: "${goal_progress_note}"` : '',
    ].filter(Boolean).join('\n');

    const bodyDetailParts: string[] = [];
    if (workouts.length > 0) bodyDetailParts.push(`${workouts.length} workouts`);
    const cardioFmt   = fmtByKind(cardioByKind);
    if (cardioFmt)   bodyDetailParts.push(`cardio (${cardioFmt})`);
    const movementFmt = fmtByKind(movementByKind);
    if (movementFmt) bodyDetailParts.push(`movement (${movementFmt})`);
    const bodyDetail  = bodyDetailParts.join(' · ') || 'none';

    const mindFmt = fmtByKind(mindByKind);
    const mindDetail = mindFmt || 'none';

    const connectDetailParts: string[] = [];
    if (connectCheckins.length > 0) connectDetailParts.push(`${connectCheckins.length} daily check-ins`);
    if (totalSessionsWatched > 0)   connectDetailParts.push(`${totalSessionsWatched} sessions watched`);
    if (sessionCategories.length)   connectDetailParts.push(`categories: ${sessionCategories.slice(0,6).join(', ')}`);
    const connectDetail = connectDetailParts.join(' · ') || 'none';

    const activityBlock = [
      `Active days (any pillar): ${activeDays}`,
      `HABITS:  ${habitsDays} ${habitsDays === 1 ? 'day' : 'days'} · ${habitsTicks} ${habitsTicks === 1 ? 'habit' : 'habits'} ticked`,
      `BODY:    ${bodyTotal} ${bodyTotal === 1 ? 'activity' : 'activities'} — ${bodyDetail}`,
      `MIND:    ${mindTotal} ${mindTotal === 1 ? 'activity' : 'activities'} — ${mindDetail}`,
      `CONNECT: ${connectTotal} ${connectTotal === 1 ? 'activity' : 'activities'} — ${connectDetail}`,
      `Weekly check-ins completed: ${totalCheckins}${avgWellbeing ? ` (avg wellbeing ${avgWellbeing}/10)` : ''}`,
    ].join('\n');

    const systemPrompt = [
      voice, '',
      `You are writing ${firstName}'s ${monthName} monthly wellbeing report.`,
      `You have their full profile, four-pillar activity data (Habits / Body / Mind / Connect), weight trend, nutrition tracking, weekly check-in responses, goal progress, and historical data.`,
      `Make the report feel genuinely personal — use their actual numbers, their own words, their goal.`,
      '',
      'STRUCTURE (follow exactly):',
      `1. Opening (2-3 sentences): acknowledge ${monthName} honestly — active days, the pillars they hit hardest, weekly check-in volume. Warm but direct.`,
      '2. Goal progress (most important section): name their goal explicitly. Reference what they said. Use actual weight numbers if available. Praise real progress. Be honest if progress was slow.',
      '3. Pillar breakdown: 3-4 sentences across Habits / Body / Mind / Connect. Call out the strongest pillar and the lightest. Reference specific activity kinds (e.g. "the breathwork sessions", "your running consistency").',
      "4. What's working: 1-2 sentences on strongest scores or activity patterns. Quote their notes.",
      "5. What needs attention: 1-2 sentences on lower areas. Direct but kind.",
      '6. Trend: 1-2 sentences vs last month or onboarding baseline.',
      '7. Three recommendations: numbered, specific, actionable, tied to their goal and which pillar needs the most lift.',
      '',
      'RULES: Under 550 words. Never mention AI. Use their name. If weight goal, always cite actual numbers. No invented data. Refer to the pillars as Habits / Body / Mind / Connect (never "exercise pillar" or other names).',
    ].join('\n');

    const userPrompt = [
      '=== MEMBER PROFILE ===', profileText, '',
      '=== GOAL PROGRESS THIS MONTH ===', goalProgressText, '',
      '=== WEIGHT LOG ===', buildWeightSummary(weightLogs), '',
      '=== NUTRITION TRACKING ===', buildNutritionSummary(nutritionLogs), '',
      '=== BASELINE vs NOW ===', deltaLines || '  Not available', '',
      `=== ${monthName.toUpperCase()} ACTIVITY (4 PILLARS) ===`,
      activityBlock, '',
      '=== WEEKLY CHECK-IN RESPONSES ===', wbSummary, '',
      '=== SELF-RATED SCORES ===', scoresText, `Overall avg: ${avg.toFixed(1)}/10`, '',
      '=== HISTORICAL (last 4 months) ===', historicalText,
    ].join('\n');

    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': ANTHROPIC_KEY, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'claude-haiku-4-5', max_tokens: 900, system: systemPrompt, messages: [{ role: 'user', content: userPrompt }] }),
    });
    if (!aiRes.ok) throw new Error(`Anthropic error: ${aiRes.status} ${await aiRes.text()}`);
    const aiData   = await aiRes.json();
    const aiReport = aiData?.content?.[0]?.text ?? 'Unable to generate report.';

    await fetch(`${SUPABASE_URL}/rest/v1/monthly_checkins`, {
      method: 'POST',
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'resolution=merge-duplicates' },
      body: JSON.stringify({
        member_email: email, iso_month: isoMonth,
        score_wellbeing: scores.wellbeing, score_energy: scores.energy,
        score_stress: scores.stress,       score_physical: scores.physical,
        score_sleep: scores.sleep,         score_diet: scores.diet,
        score_social: scores.social,       score_motivation: scores.motivation,
        note_wellbeing: notes?.wellbeing||null,   note_energy: notes?.energy||null,
        note_stress: notes?.stress||null,         note_physical: notes?.physical||null,
        note_sleep: notes?.sleep||null,           note_diet: notes?.diet||null,
        note_social: notes?.social||null,         note_motivation: notes?.motivation||null,
        goal_progress_score: goal_progress_score ?? null,
        goal_progress_note: goal_progress_note || null,
        avg_score: parseFloat(avg.toFixed(2)),
        ai_report: aiReport,
        created_at: new Date().toISOString(),
      }),
    });

    return new Response(JSON.stringify({
      aiReport, firstName, monthName, isoMonth,
      opensNext, daysUntilOpens,
      memberGoal: memberGoalText,
      activity: {
        activeDays,
        habitsDays, habitsTicks,
        bodyTotal, mindTotal, connectTotal,
        cardioByKind, movementByKind, mindByKind,
        dailyCheckins: connectCheckins.length,
        sessionsWatched: totalSessionsWatched,
        sessionCategories,
        totalCheckins, avgWellbeing,
        activityMap,
        totalHabits, totalWorkouts, totalCardio, totalSessions,
      },
      scores, avg: parseFloat(avg.toFixed(1)),
    }), { headers: { ...CORS, 'Content-Type': 'application/json' } });

  } catch (err) {
    console.error('monthly-checkin error:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
