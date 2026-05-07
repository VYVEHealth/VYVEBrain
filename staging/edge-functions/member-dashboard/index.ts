import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { applyOp, ukLocalDateISO, lastNightWindow, dailyMetricColumn, dailyUnitFor } from './_shared/taxonomy.ts';
import { getMemberAchievementsPayload } from './_shared/achievements.ts';
// member-dashboard v59 — CORS hardening (07 May 2026, security commit 1).
//
// CHANGES vs v58:
//   - getCORSHeaders no longer returns '*' when Origin is empty/null. Falls through
//     to https://online.vyvehealth.co.uk for any unrecognised case. Closes the
//     06 May 2026 audit finding on anon-readable wildcard exposure.
//   - Access-Control-Allow-Credentials always 'true' as a result.
//   - Member-facing flow byte-identical: legitimate browsers always send Origin.
//
// CHANGES vs v57 (still applies):
//   - goals.progress.habits = DISTINCT activity_dates this ISO week, not row count.
//   - habitsThisWeek query selects activity_date for client-side dedupe.
//
// CHANGES vs v55 (still applies):
//   - weekly_goals returned as {targets, progress}; exercise = workouts+cardio combined.
//
// UNCHANGED from v55:
//   - join_date sourced from members.created_at
//   - autotick habits + evaluator (byte-identical)
//   - all activity / engagement / certificate / charity payloads
//   - achievements payload
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const SUPABASE_ANON = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const ALLOWED_ORIGINS = new Set([
  'https://online.vyvehealth.co.uk',
  'https://www.vyvehealth.co.uk'
]);
const DEFAULT_ORIGIN = 'https://online.vyvehealth.co.uk';
const ASLEEP_STATES = new Set([
  'asleep',
  'light',
  'rem',
  'deep'
]);
function getCORSHeaders(req) {
  const origin = req.headers.get('Origin') ?? '';
  const allowOrigin = ALLOWED_ORIGINS.has(origin) ? origin : DEFAULT_ORIGIN;
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Credentials': 'true'
  };
}
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
async function rpc(fn) {
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
function ukToday() {
  return ukLocalDateISO();
}
function dateRange(days) {
  const dates = [];
  const todayStr = ukToday();
  const base = new Date(todayStr + 'T12:00:00Z');
  for(let i = days - 1; i >= 0; i--){
    const d = new Date(base);
    d.setUTCDate(base.getUTCDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}
function isoMondayUtcStr(now = new Date()) {
  const dt = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const dow = dt.getUTCDay();
  const daysBack = dow === 0 ? 6 : dow - 1;
  dt.setUTCDate(dt.getUTCDate() - daysBack);
  return dt.toISOString().slice(0, 10);
}
function buildActivityLog(habitDates, workoutDates, cardioDates, sessionDates) {
  const allDates = new Set([
    ...habitDates,
    ...workoutDates,
    ...cardioDates,
    ...sessionDates
  ]);
  const habitSet = new Set(habitDates);
  const workoutSet = new Set(workoutDates);
  const cardioSet = new Set(cardioDates);
  const sessionSet = new Set(sessionDates);
  return Array.from(allDates).sort().map((date)=>{
    const activities = [];
    if (habitSet.has(date)) activities.push('habits');
    if (workoutSet.has(date)) activities.push('workouts');
    if (cardioSet.has(date)) activities.push('cardio');
    if (sessionSet.has(date)) activities.push('sessions');
    return {
      date,
      activities
    };
  });
}
function evaluateHealthRule(rule, snap) {
  if (!rule) return {
    satisfied: null,
    progress: null
  };
  if (!snap.hasHealthkitConnection) return {
    satisfied: null,
    progress: null
  };
  try {
    if (rule.source === 'daily') {
      const col = dailyMetricColumn(rule.metric);
      if (!col) return {
        satisfied: null,
        progress: null
      };
      const row = snap.dailyByType.get(col);
      if (!row) return {
        satisfied: null,
        progress: null
      };
      let value = Number(row.value);
      const unitIn = row.unit || '';
      if (rule.metric === 'distance_km' && (unitIn === 'meter' || unitIn === 'm' || unitIn === '')) {
        value = value / 1000;
      }
      const target = rule.value ?? 0;
      const satisfied = applyOp(rule.op, value, target);
      return {
        satisfied,
        progress: {
          value: Number(value.toFixed(2)),
          target,
          unit: dailyUnitFor(rule.metric, unitIn)
        }
      };
    }
    if (rule.source === 'samples_sleep') {
      if (snap.sleepLastNightAsleepMin === null) {
        return {
          satisfied: null,
          progress: null
        };
      }
      const value = snap.sleepLastNightAsleepMin;
      const target = rule.value ?? 0;
      return {
        satisfied: applyOp(rule.op, value, target),
        progress: {
          value: Math.round(value),
          target,
          unit: 'minutes'
        }
      };
    }
    if (rule.source === 'activity_tables') {
      if (rule.metric === 'workout_any' && rule.agg === 'exists') {
        const count = snap.workoutsTodayCount + snap.cardioTodayCount;
        return {
          satisfied: count > 0,
          progress: {
            value: count,
            target: 1,
            unit: 'workouts'
          }
        };
      }
      if (rule.metric === 'cardio_duration_minutes' && rule.agg === 'sum') {
        const value = snap.cardioTodayMinutes;
        const target = rule.value ?? 0;
        return {
          satisfied: applyOp(rule.op, value, target),
          progress: {
            value,
            target,
            unit: 'minutes'
          }
        };
      }
      return {
        satisfied: null,
        progress: null
      };
    }
  } catch (_) {
    return {
      satisfied: null,
      progress: null
    };
  }
  return {
    satisfied: null,
    progress: null
  };
}
serve(async (req)=>{
  const corsHeaders = getCORSHeaders(req);
  if (req.method === 'OPTIONS') return new Response('ok', {
    headers: corsHeaders
  });
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
      global: {
        headers: {
          Authorization: req.headers.get('Authorization') ?? ''
        }
      }
    });
    const supabaseSr = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        persistSession: false
      }
    });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({
        error: 'Unauthorized'
      }), {
        status: 401,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    const enc = encodeURIComponent(user.email);
    const recent30Start = dateRange(30)[0];
    const todayLocal = ukLocalDateISO();
    const { windowStart: sleepStart, windowEnd: sleepEnd } = lastNightWindow();
    const sleepStartIso = sleepStart.toISOString();
    const sleepEndIso = sleepEnd.toISOString();
    const currentWeekStart = isoMondayUtcStr();
    const [member, homeState, weeklyGoalsRow, habitsRecent, workoutsRecent, cardioRecent, sessionsRecent, replaysRecent, charityTotal, certificates, healthConnections, memberHabits, dailyToday, sleepLastNight, workoutsToday, cardioToday, habitsThisWeek, workoutsThisWeek, cardioThisWeek, sessionsThisWeek, checkinsThisWeek, achievementsPayload] = await Promise.all([
      q('members', `email=eq.${enc}&select=*`).then((r)=>r[0]),
      q('member_home_state', `member_email=eq.${enc}&select=*`).then((r)=>r[0]),
      q('weekly_goals', `member_email=eq.${enc}&week_start=eq.${currentWeekStart}&select=*&limit=1`).then((r)=>r[0]),
      q('daily_habits', `member_email=eq.${enc}&select=activity_date&activity_date=gte.${recent30Start}`),
      q('workouts', `member_email=eq.${enc}&select=activity_date&activity_date=gte.${recent30Start}`),
      q('cardio', `member_email=eq.${enc}&select=activity_date&activity_date=gte.${recent30Start}`),
      q('session_views', `member_email=eq.${enc}&select=activity_date&activity_date=gte.${recent30Start}`),
      q('replay_views', `member_email=eq.${enc}&select=activity_date&activity_date=gte.${recent30Start}`),
      rpc('get_charity_total'),
      q('certificates', `member_email=eq.${enc}&select=id,activity_type,milestone_count,earned_at,certificate_url,charity_moment_triggered,global_cert_number&order=earned_at.desc`),
      q('member_health_connections', `member_email=eq.${enc}&select=platform,granted_scopes,connected_at,last_sync_at,last_sync_status,total_synced,revoked_at`),
      q('member_habits', `member_email=eq.${enc}&active=eq.true&select=habit_id,active,assigned_at,habit_library(id,habit_pot,habit_title,habit_description,habit_prompt,difficulty,health_rule)`),
      q('member_health_daily', `member_email=eq.${enc}&date=eq.${todayLocal}&source=eq.healthkit&select=sample_type,value,unit`),
      q('member_health_samples', `member_email=eq.${enc}&sample_type=eq.sleep&start_at=gte.${encodeURIComponent(sleepStartIso)}&start_at=lt.${encodeURIComponent(sleepEndIso)}&select=value,metadata`),
      q('workouts', `member_email=eq.${enc}&activity_date=eq.${todayLocal}&select=id`),
      q('cardio', `member_email=eq.${enc}&activity_date=eq.${todayLocal}&select=id,duration_minutes`),
      q('daily_habits', `member_email=eq.${enc}&activity_date=gte.${currentWeekStart}&select=activity_date`),
      q('workouts', `member_email=eq.${enc}&activity_date=gte.${currentWeekStart}&select=id`),
      q('cardio', `member_email=eq.${enc}&activity_date=gte.${currentWeekStart}&select=id`),
      q('session_views', `member_email=eq.${enc}&activity_date=gte.${currentWeekStart}&select=id`),
      q('wellbeing_checkins', `member_email=eq.${enc}&activity_date=gte.${currentWeekStart}&select=id`),
      getMemberAchievementsPayload(supabaseSr, user.email.toLowerCase(), {
        inflightLimit: 3,
        recentLimit: 8
      }).catch((e)=>{
        console.warn('[member-dashboard] achievements payload err:', e.message);
        return {
          unseen: [],
          inflight: [],
          recent: [],
          earned_count: 0,
          hk_connected: false
        };
      })
    ]);
    if (!member) {
      return new Response(JSON.stringify({
        error: 'Member not found'
      }), {
        status: 404,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
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
        body: JSON.stringify({
          p_email: user.email
        })
      });
      const refreshed = await q('member_home_state', `member_email=eq.${enc}&select=*`);
      state = refreshed[0] || {};
    }
    const dailyByType = new Map();
    for (const row of dailyToday || []){
      dailyByType.set(row.sample_type, {
        value: Number(row.value),
        unit: row.unit || ''
      });
    }
    let sleepLastNightAsleepMin = null;
    const sleepRows = sleepLastNight || [];
    if (sleepRows.length > 0) {
      let total = 0;
      for (const s of sleepRows){
        const sstate = String(s.metadata?.sleep_state ?? '').toLowerCase();
        if (!ASLEEP_STATES.has(sstate)) continue;
        total += Number(s.value || 0);
      }
      sleepLastNightAsleepMin = total;
    }
    const hkConnection = (healthConnections || []).find((c)=>c.platform === 'healthkit' && !c.revoked_at);
    const hasHealthkitConnection = !!hkConnection;
    const cardioTodayArr = cardioToday || [];
    const workoutsTodayArr = workoutsToday || [];
    const snap = {
      todayLocal,
      dailyByType,
      sleepLastNightAsleepMin,
      workoutsTodayCount: workoutsTodayArr.length,
      cardioTodayCount: cardioTodayArr.length,
      cardioTodayMinutes: cardioTodayArr.reduce((s, r)=>s + Number(r.duration_minutes || 0), 0),
      hasHealthkitConnection
    };
    const habits = (memberHabits || []).filter((mh)=>mh.habit_library).map((mh)=>{
      const lib = mh.habit_library;
      const rule = lib.health_rule || null;
      const evaluation = evaluateHealthRule(rule, snap);
      return {
        habit_id: lib.id,
        habit_pot: lib.habit_pot,
        habit_title: lib.habit_title,
        habit_description: lib.habit_description,
        habit_prompt: lib.habit_prompt,
        difficulty: lib.difficulty,
        has_rule: !!rule,
        health_auto_satisfied: evaluation.satisfied,
        health_progress: evaluation.progress
      };
    });
    const sessionsAll = [
      ...sessionsRecent.map((s)=>s.activity_date),
      ...replaysRecent.map((r)=>r.activity_date)
    ];
    const activityLog = buildActivityLog(habitsRecent.map((h)=>h.activity_date), workoutsRecent.map((w)=>w.activity_date), cardioRecent.map((c)=>c.activity_date), sessionsAll);
    const habitsTotal = state.habits_total ?? 0;
    const workoutsTotal = state.workouts_total ?? 0;
    const cardioTotal = state.cardio_total ?? 0;
    const sessionsTotal = state.sessions_total ?? 0;
    const checkinsTotal = state.checkins_total ?? 0;
    const habitStreak = {
      current: state.habits_streak_current ?? 0,
      best: state.habits_streak_best ?? 0
    };
    const workoutStreak = {
      current: state.workouts_streak_current ?? 0,
      best: state.workouts_streak_best ?? 0
    };
    const cardioStreak = {
      current: state.cardio_streak_current ?? 0,
      best: state.cardio_streak_best ?? 0
    };
    const sessionStreak = {
      current: state.sessions_streak_current ?? 0,
      best: state.sessions_streak_best ?? 0
    };
    const checkinStreak = {
      current: state.checkin_streak_current ?? 0,
      best: state.checkin_streak_best ?? 0
    };
    const overallStreak = {
      current: state.overall_streak_current ?? 0,
      best: state.overall_streak_best ?? 0
    };
    const joinDate = member.created_at ? String(member.created_at).slice(0, 10) : null;
    const tgt = weeklyGoalsRow || {};
    // habits goal = DISTINCT activity_dates this week (a member ticking 3 cards on Monday = 1 day, not 3).
    const habitDaysThisWeek = new Set((habitsThisWeek || []).map((r)=>r.activity_date).filter(Boolean)).size;
    const goalsPayload = {
      week_start: currentWeekStart,
      targets: {
        habits_target: Number(tgt.habits_target ?? 3),
        exercise_target: Number(tgt.exercise_target ?? 3),
        sessions_target: Number(tgt.sessions_target ?? 2),
        checkin_target: Number(tgt.checkin_target ?? 1)
      },
      progress: {
        habits: habitDaysThisWeek,
        exercise: (workoutsThisWeek || []).length + (cardioThisWeek || []).length,
        sessions: (sessionsThisWeek || []).length,
        checkin: (checkinsThisWeek || []).length
      }
    };
    return new Response(JSON.stringify({
      member: {
        first_name: member.first_name,
        last_name: member.last_name,
        email: member.email,
        persona: member.persona,
        onboarding_complete: member.onboarding_complete,
        subscription_status: member.subscription_status,
        join_date: joinDate
      },
      engagement: {
        score: state.engagement_score ?? 50,
        components: {
          recency: Number(state.engagement_recency ?? 0),
          consistency: Number(state.engagement_consistency ?? 0),
          variety: Number(state.engagement_variety ?? 0),
          wellbeing: Number(state.engagement_wellbeing ?? 0)
        },
        streak: overallStreak,
        streak_by_type: {
          habits: habitStreak,
          workouts: workoutStreak,
          cardio: cardioStreak,
          sessions: sessionStreak,
          checkins: checkinStreak
        },
        active_days_30: state.active_days_30 ?? 0
      },
      progress: {
        habits: {
          count: habitsTotal,
          target: 30,
          best_streak: habitStreak.best
        },
        workouts: {
          count: workoutsTotal,
          target: 30,
          best_streak: workoutStreak.best
        },
        cardio: {
          count: cardioTotal,
          target: 30,
          best_streak: cardioStreak.best
        },
        sessions: {
          count: sessionsTotal,
          target: 30,
          best_streak: sessionStreak.best
        },
        checkins: {
          count: checkinsTotal,
          target: 30,
          best_streak: checkinStreak.best
        }
      },
      recent: {
        habits: state.recent_habits_30d ?? 0,
        workouts: state.recent_workouts_30d ?? 0,
        cardio: state.recent_cardio_30d ?? 0,
        sessions: state.recent_sessions_30d ?? 0,
        checkins: checkinsTotal
      },
      activity_log: activityLog,
      weekly_goals: goalsPayload,
      wellbeing: {
        current_score: state.wellbeing_latest_score ?? null,
        last_checkin: state.wellbeing_latest_iso_week ?? null
      },
      charity_total: charityTotal || 0,
      certificates: certificates,
      habits: habits,
      health_feature_allowed: true,
      health_connection_state: hasHealthkitConnection ? 'connected' : 'none',
      health_connections: (healthConnections || []).map((c)=>({
          platform: c.platform,
          granted_scopes: c.granted_scopes || [],
          connected_at: c.connected_at,
          last_sync_at: c.last_sync_at,
          last_sync_status: c.last_sync_status,
          total_synced: c.total_synced || 0,
          is_revoked: !!c.revoked_at
        })),
      achievements: achievementsPayload
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error.message
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
