import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// member-dashboard v50 — ADDITIVE: health_connections block for HealthKit integration.
// Returns per-platform connection state (connected, last_sync_at, granted_scopes) plus
// a health_feature_allowed boolean that gates the Settings UI section client-side.
// Allowlist is hard-coded here while we pilot; will move to a DB table post-launch.
// verify_jwt stays false at platform level (v49 restored this after v48 regression).
// Certificate refactor 'id' field retained.

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const SUPABASE_ANON = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

const ALLOWED_ORIGINS = new Set([
  'https://online.vyvehealth.co.uk',
  'https://www.vyvehealth.co.uk'
]);

// HealthKit feature allowlist: members whose Settings → Apple Health panel is visible.
// Dean-only during dev; add more emails before broader rollout.
const HEALTH_FEATURE_ALLOWLIST = new Set([
  'deanonbrown@hotmail.com'
]);

function getCORSHeaders(req: Request) {
  const origin = req.headers.get('Origin') ?? '';
  const allowOrigin = ALLOWED_ORIGINS.has(origin)
    ? origin
    : origin === 'null' || origin === ''
      ? '*'
      : 'https://online.vyvehealth.co.uk';
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Credentials': allowOrigin !== '*' ? 'true' : 'false'
  };
}

async function q(table: string, params: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`
    }
  });
  if (!res.ok) throw new Error(`Query failed on ${table}: ${await res.text()}`);
  return res.json();
}

async function rpc(fn: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({})
  });
  if (!res.ok) return 0;
  return res.json();
}

function ukToday(): string {
  const bst = new Date(Date.now() + 60 * 60 * 1000);
  return bst.toISOString().slice(0, 10);
}

function dateRange(days: number): string[] {
  const dates: string[] = [];
  const todayStr = ukToday();
  const base = new Date(todayStr + 'T12:00:00Z');
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(base);
    d.setUTCDate(base.getUTCDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

function buildActivityLog(
  habitDates: string[],
  workoutDates: string[],
  cardioDates: string[],
  sessionDates: string[]
) {
  const allDates = new Set([...habitDates, ...workoutDates, ...cardioDates, ...sessionDates]);
  const habitSet = new Set(habitDates);
  const workoutSet = new Set(workoutDates);
  const cardioSet = new Set(cardioDates);
  const sessionSet = new Set(sessionDates);
  return Array.from(allDates).sort().map(date => {
    const activities: string[] = [];
    if (habitSet.has(date)) activities.push('habits');
    if (workoutSet.has(date)) activities.push('workouts');
    if (cardioSet.has(date)) activities.push('cardio');
    if (sessionSet.has(date)) activities.push('sessions');
    return { date, activities };
  });
}

serve(async (req) => {
  const corsHeaders = getCORSHeaders(req);
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
      global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } }
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const enc = encodeURIComponent(user.email!);
    const recent30Start = dateRange(30)[0];

    const [
      member,
      homeState,
      weeklyGoalsRow,
      habitsRecent,
      workoutsRecent,
      cardioRecent,
      sessionsRecent,
      replaysRecent,
      charityTotal,
      certificates,
      healthConnections
    ] = await Promise.all([
      q('members', `email=eq.${enc}&select=*`).then((r: any) => r[0]),
      q('member_home_state', `member_email=eq.${enc}&select=*`).then((r: any) => r[0]),
      q('weekly_goals', `member_email=eq.${enc}&select=*&order=created_at.desc&limit=1`).then((r: any) => r[0]),
      q('daily_habits',  `member_email=eq.${enc}&select=activity_date&activity_date=gte.${recent30Start}`),
      q('workouts',      `member_email=eq.${enc}&select=activity_date&activity_date=gte.${recent30Start}`),
      q('cardio',        `member_email=eq.${enc}&select=activity_date&activity_date=gte.${recent30Start}`),
      q('session_views', `member_email=eq.${enc}&select=activity_date&activity_date=gte.${recent30Start}`),
      q('replay_views',  `member_email=eq.${enc}&select=activity_date&activity_date=gte.${recent30Start}`),
      rpc('get_charity_total'),
      q('certificates',  `member_email=eq.${enc}&select=id,activity_type,milestone_count,earned_at,certificate_url,charity_moment_triggered,global_cert_number&order=earned_at.desc`),
      q('member_health_connections', `member_email=eq.${enc}&select=platform,granted_scopes,connected_at,last_sync_at,last_sync_status,total_synced,revoked_at`)
    ]);

    if (!member) {
      return new Response(JSON.stringify({ error: 'Member not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let state = homeState;
    if (!state) {
      await fetch(`${SUPABASE_URL}/rest/v1/rpc/refresh_member_home_state`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ p_email: user.email })
      });
      const refreshed = await q('member_home_state', `member_email=eq.${enc}&select=*`);
      state = refreshed[0] || {};
    }

    const sessionsAll = [
      ...(sessionsRecent as any[]).map((s: any) => s.activity_date),
      ...(replaysRecent  as any[]).map((r: any) => r.activity_date)
    ];
    const activityLog = buildActivityLog(
      (habitsRecent   as any[]).map((h: any) => h.activity_date),
      (workoutsRecent as any[]).map((w: any) => w.activity_date),
      (cardioRecent   as any[]).map((c: any) => c.activity_date),
      sessionsAll
    );

    const habitsTotal   = state.habits_total   ?? 0;
    const workoutsTotal = state.workouts_total ?? 0;
    const cardioTotal   = state.cardio_total   ?? 0;
    const sessionsTotal = state.sessions_total ?? 0;
    const checkinsTotal = state.checkins_total ?? 0;

    const habitStreak   = { current: state.habits_streak_current   ?? 0, best: state.habits_streak_best   ?? 0 };
    const workoutStreak = { current: state.workouts_streak_current ?? 0, best: state.workouts_streak_best ?? 0 };
    const cardioStreak  = { current: state.cardio_streak_current   ?? 0, best: state.cardio_streak_best   ?? 0 };
    const sessionStreak = { current: state.sessions_streak_current ?? 0, best: state.sessions_streak_best ?? 0 };
    const checkinStreak = { current: state.checkin_streak_current  ?? 0, best: state.checkin_streak_best  ?? 0 };
    const overallStreak = { current: state.overall_streak_current  ?? 0, best: state.overall_streak_best  ?? 0 };

    return new Response(JSON.stringify({
      member: {
        first_name: member.first_name,
        last_name: member.last_name,
        email: member.email,
        persona: member.persona,
        onboarding_complete: member.onboarding_complete,
        subscription_status: member.subscription_status
      },
      engagement: {
        score: state.engagement_score ?? 50,
        components: {
          recency:     Number(state.engagement_recency     ?? 0),
          consistency: Number(state.engagement_consistency ?? 0),
          variety:     Number(state.engagement_variety     ?? 0),
          wellbeing:   Number(state.engagement_wellbeing   ?? 0)
        },
        streak: overallStreak,
        streak_by_type: {
          habits:   habitStreak,
          workouts: workoutStreak,
          cardio:   cardioStreak,
          sessions: sessionStreak,
          checkins: checkinStreak
        },
        active_days_30: state.active_days_30 ?? 0
      },
      progress: {
        habits:   { count: habitsTotal,   target: 30, best_streak: habitStreak.best },
        workouts: { count: workoutsTotal, target: 30, best_streak: workoutStreak.best },
        cardio:   { count: cardioTotal,   target: 30, best_streak: cardioStreak.best },
        sessions: { count: sessionsTotal, target: 30, best_streak: sessionStreak.best },
        checkins: { count: checkinsTotal, target: 30, best_streak: checkinStreak.best }
      },
      recent: {
        habits:   state.recent_habits_30d   ?? 0,
        workouts: state.recent_workouts_30d ?? 0,
        cardio:   state.recent_cardio_30d   ?? 0,
        sessions: state.recent_sessions_30d ?? 0,
        checkins: checkinsTotal
      },
      activity_log:  activityLog,
      weekly_goals:  weeklyGoalsRow || null,
      wellbeing: {
        current_score: state.wellbeing_latest_score     ?? null,
        last_checkin:  state.wellbeing_latest_iso_week  ?? null
      },
      charity_total: charityTotal || 0,
      certificates:  certificates,
      health_feature_allowed: HEALTH_FEATURE_ALLOWLIST.has((user.email ?? '').toLowerCase()),
      health_connections: (healthConnections as any[] || []).map((c: any) => ({
        platform:         c.platform,
        granted_scopes:   c.granted_scopes || [],
        connected_at:     c.connected_at,
        last_sync_at:     c.last_sync_at,
        last_sync_status: c.last_sync_status,
        total_synced:     c.total_synced || 0,
        is_revoked:       !!c.revoked_at
      }))
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error', details: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});