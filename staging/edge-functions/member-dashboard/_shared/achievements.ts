// _shared/achievements.ts — VYVE Achievements evaluator (Phase 1 + Phase 2 vol + Phase 3 grid)
// PM-1150: getMemberAchievementsPayload is now ONE rpc('member_achievements_payload') call.
//   It previously looped every INLINE metric and awaited each sequentially — ~26 internal
//   PostgREST round trips per member home load, measured p50 2,104ms at 30 concurrent and the
//   sole cause of the 200-VU failure band (§23.292). The SQL function reproduces the old output
//   EXACTLY, including the workouts_shared skip (the JS queries shared_workouts.member_email,
//   a column that does not exist, so it threw and was swallowed on every load — parity kept
//   deliberately; the real fix belongs with PM-358). Verified byte-identical against a live v90
//   invocation before deploy, and across all 107 members.
//   NOTE: evaluateInline and the INLINE/GRID_EXTRA maps below are UNCHANGED and still used by
//   the member-achievements EF's copy of this file. Do not delete them.
// PM-1063: this is the member-achievements v15 copy, now also bundled into member-dashboard v88
// (whose copy had been the PM-419 original since the overhaul — achievement_key selects 400'd on every home load).
// PM-1003 v4: hk-connected checks (isHkConnected + healthkitConnected) now require
// revoked_at IS NULL — a revoked Apple Health connection no longer counts as connected.
// 29 April 2026 v3: volume_lifted_total wired into INLINE map.
async function count(s, table, email) {
  const { count: c } = await s.from(table).select('*', {
    count: 'exact',
    head: true
  }).eq('member_email', email);
  return c ?? 0;
}
async function sumColumn(s, table, col, email) {
  const { data } = await s.from(table).select(col).eq('member_email', email);
  if (!data) return 0;
  let total = 0;
  for (const r of data)total += Number(r[col] ?? 0);
  return total;
}
async function homeStateField(s, email, field) {
  const { data } = await s.from('member_home_state').select(field).eq('member_email', email).maybeSingle();
  if (!data) return 0;
  return Number(data[field] ?? 0);
}
async function personaSwitched(s, email) {
  const { data } = await s.from('members').select('persona_switches').eq('email', email).maybeSingle();
  if (!data) return 0;
  const sw = data.persona_switches;
  return Array.isArray(sw) && sw.length > 0 ? 1 : 0;
}
async function volumeLiftedTotal(s, email) {
  const { data } = await s.from('exercise_logs').select('reps_completed,weight_kg').eq('member_email', email).lte('reps_completed', 100).lte('weight_kg', 500);
  if (!data) return 0;
  let total = 0;
  for (const r of data){
    const reps = Number(r.reps_completed ?? 0);
    const w = Number(r.weight_kg ?? 0);
    if (reps > 0 && w > 0) total += reps * w;
  }
  return total;
}
async function memberDays(s, email) {
  const { data } = await s.from('members').select('created_at').eq('email', email).maybeSingle();
  if (!data?.created_at) return 0;
  const ms = Date.now() - new Date(data.created_at).getTime();
  return Math.max(0, Math.floor(ms / 86400000));
}
async function tourComplete(s, email) {
  return 0;
}
async function healthkitConnected(s, email) {
  const { data } = await s.from('member_health_connections').select('member_email').eq('member_email', email).is('revoked_at', null).maybeSingle();
  return data ? 1 : 0;
}
async function hkDailySum(s, email, sampleType) {
  const { data } = await s.from('member_health_daily').select('value,source,preferred_source').eq('member_email', email).eq('sample_type', sampleType);
  if (!data) return 0;
  let total = 0;
  for (const r of data){
    const ps = r.preferred_source;
    if (ps && r.source !== ps) continue;
    total += Number(r.value ?? 0);
  }
  return total;
}
async function nightsSlept7h(s, email) {
  const { data } = await s.from('member_health_daily').select('value,source,preferred_source,date').eq('member_email', email).eq('sample_type', 'sleep_asleep_minutes');
  if (!data) return 0;
  const byDate = new Map();
  for (const r of data){
    const ps = r.preferred_source;
    if (ps && r.source !== ps) continue;
    const cur = byDate.get(r.date) ?? 0;
    byDate.set(r.date, cur + Number(r.value ?? 0));
  }
  let nights = 0;
  for (const v of byDate.values())if (v >= 420) nights++;
  return nights;
}
async function personalCharityContribution(s, email) {
  return 0;
}
async function charityTipsContributed(s, email) {
  return 0;
}
async function fullFiveWeeksCount(s, email) {
  return 0;
}
const INLINE = {
  habits_logged: (s, e)=>count(s, 'daily_habits', e),
  workouts_logged: (s, e)=>count(s, 'workouts', e),
  cardio_logged: (s, e)=>count(s, 'cardio', e),
  sessions_watched: (s, e)=>count(s, 'session_views', e),
  replays_watched: (s, e)=>count(s, 'replay_views', e),
  checkins_completed: (s, e)=>count(s, 'wellbeing_checkins', e),
  monthly_checkins_completed: (s, e)=>count(s, 'monthly_checkins', e),
  meals_logged: (s, e)=>count(s, 'nutrition_logs', e),
  weights_logged: (s, e)=>count(s, 'weight_logs', e),
  exercises_logged: (s, e)=>count(s, 'exercise_logs', e),
  custom_workouts_created: (s, e)=>count(s, 'custom_workouts', e),
  workouts_shared: (s, e)=>count(s, 'shared_workouts', e),
  running_plans_generated: (s, e)=>count(s, 'member_running_plans', e),
  workout_minutes_total: (s, e)=>sumColumn(s, 'workouts', 'duration_minutes', e),
  cardio_minutes_total: (s, e)=>sumColumn(s, 'cardio', 'duration_minutes', e),
  cardio_distance_total: (s, e)=>sumColumn(s, 'cardio', 'distance_km', e),
  volume_lifted_total: (s, e)=>volumeLiftedTotal(s, e),
  streak_overall: (s, e)=>homeStateField(s, e, 'overall_streak_current'),
  streak_habits: (s, e)=>homeStateField(s, e, 'habits_streak_current'),
  streak_workouts: (s, e)=>homeStateField(s, e, 'workouts_streak_current'),
  streak_cardio: (s, e)=>homeStateField(s, e, 'cardio_streak_current'),
  streak_sessions: (s, e)=>homeStateField(s, e, 'sessions_streak_current'),
  streak_checkin_weeks: (s, e)=>homeStateField(s, e, 'checkin_streak_current'),
  persona_switched: (s, e)=>personaSwitched(s, e)
};
const GRID_EXTRA = {
  member_days: (s, e)=>memberDays(s, e),
  tour_complete: (s, e)=>tourComplete(s, e),
  healthkit_connected: (s, e)=>healthkitConnected(s, e),
  lifetime_steps: (s, e)=>hkDailySum(s, e, 'steps'),
  lifetime_distance_hk: (s, e)=>hkDailySum(s, e, 'distance'),
  lifetime_active_energy: (s, e)=>hkDailySum(s, e, 'active_energy'),
  nights_slept_7h: (s, e)=>nightsSlept7h(s, e),
  personal_charity_contribution: (s, e)=>personalCharityContribution(s, e),
  charity_tips: (s, e)=>charityTipsContributed(s, e),
  full_five_weeks: (s, e)=>fullFiveWeeksCount(s, e)
};
let CACHE = null;
const CACHE_TTL_MS = 60_000;
export async function loadCatalog(supabase) {
  if (CACHE && Date.now() - CACHE.at < CACHE_TTL_MS) return CACHE.data;
  const [{ data: metrics }, { data: tiers }] = await Promise.all([
    supabase.from('achievement_metrics').select('*').order('sort_order'),
    supabase.from('achievement_tiers').select('*').order('metric_slug').order('tier_index')
  ]);
  const mMap = new Map();
  for (const m of metrics ?? [])mMap.set(m.slug, m);
  const tMap = new Map();
  for (const t of tiers ?? []){
    if (!tMap.has(t.metric_slug)) tMap.set(t.metric_slug, []);
    tMap.get(t.metric_slug).push(t);
  }
  for (const arr of tMap.values())arr.sort((a, b)=>a.tier_index - b.tier_index);
  const data = {
    metrics: mMap,
    tiers: tMap
  };
  CACHE = {
    at: Date.now(),
    data
  };
  return data;
}
async function isHkConnected(supabase, email) {
  const { data } = await supabase.from('member_health_connections').select('member_email').eq('member_email', email).is('revoked_at', null).maybeSingle();
  return !!data;
}
export async function evaluateInline(supabase, email) {
  const { metrics, tiers } = await loadCatalog(supabase);
  const hk = await isHkConnected(supabase, email);
  const { data: existingRows } = await supabase.from('member_achievements').select('metric_slug,tier_index').eq('member_email', email);
  const earnedSet = new Set();
  for (const r of existingRows ?? [])earnedSet.add(`${r.metric_slug}:${r.tier_index}`);
  const newRows = [];
  const earned = [];
  for (const [slug, fn] of Object.entries(INLINE)){
    const m = metrics.get(slug);
    if (!m) continue;
    if (m.source !== 'inline') continue;
    if (m.hidden_without_hk && !hk) continue;
    const ladder = tiers.get(slug) ?? [];
    if (ladder.length === 0) continue;
    let value = 0;
    try {
      value = await fn(supabase, email);
    } catch (e) {
      console.warn(`[ach] eval ${slug} failed:`, e.message);
      continue;
    }
    if (value <= 0) continue;
    for (const t of ladder){
      if (Number(t.threshold) > value) break;
      const key = `${slug}:${t.tier_index}`;
      if (earnedSet.has(key)) continue;
      newRows.push({
        member_email: email,
        metric_slug: slug,
        tier_index: t.tier_index
      });
      earned.push({
        metric_slug: slug,
        tier_index: t.tier_index,
        threshold: Number(t.threshold),
        title: t.title,
        body: t.body,
        display_name: m.display_name,
        unit: m.unit,
        earned_at: new Date().toISOString()
      });
    }
  }
  if (newRows.length > 0) {
    const { error } = await supabase.from('member_achievements').upsert(newRows, {
      onConflict: 'member_email,metric_slug,tier_index',
      ignoreDuplicates: true
    });
    if (error) {
      console.warn('[ach] insert err:', error.message);
      return [];
    }
  }
  return earned;
}
export async function getMemberAchievementsPayload(supabase, email, opts = {}) {
  const inflightLimit = opts.inflightLimit ?? 3;
  const recentLimit = opts.recentLimit ?? 8;
  const { data, error } = await supabase.rpc('member_achievements_payload', {
    p_email: email,
    p_inflight_limit: inflightLimit,
    p_recent_limit: recentLimit
  });
  if (error) throw new Error(`member_achievements_payload rpc failed: ${error.message}`);
  if (!data) return {
    unseen: [],
    inflight: [],
    recent: [],
    earned_count: 0,
    hk_connected: false
  };
  return data;
}
