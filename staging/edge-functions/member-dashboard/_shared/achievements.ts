// _shared/achievements.ts — VYVE Achievements evaluator (Phase 1)
// Spec: VYVEBrain backlog item 7. Schema: achievement_metrics × achievement_tiers × member_achievements.
// Evaluator returns earned tier rows for inline (sync) metrics. Sweep metrics are handled by achievements-sweep EF.
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
  streak_overall: (s, e)=>homeStateField(s, e, 'overall_streak_current'),
  streak_habits: (s, e)=>homeStateField(s, e, 'habits_streak_current'),
  streak_workouts: (s, e)=>homeStateField(s, e, 'workouts_streak_current'),
  streak_cardio: (s, e)=>homeStateField(s, e, 'cardio_streak_current'),
  streak_sessions: (s, e)=>homeStateField(s, e, 'sessions_streak_current'),
  streak_checkin_weeks: (s, e)=>homeStateField(s, e, 'checkin_streak_current'),
  persona_switched: (s, e)=>personaSwitched(s, e)
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
  const { data } = await supabase.from('member_health_connections').select('member_email').eq('member_email', email).maybeSingle();
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
  const { metrics, tiers } = await loadCatalog(supabase);
  const hk = await isHkConnected(supabase, email);
  const { data: earned } = await supabase.from('member_achievements').select('metric_slug,tier_index,earned_at,seen_at').eq('member_email', email).order('earned_at', {
    ascending: false
  });
  const tierOf = (slug, idx)=>(tiers.get(slug) ?? []).find((t)=>t.tier_index === idx);
  const unseen = (earned ?? []).filter((r)=>!r.seen_at).map((r)=>{
    const m = metrics.get(r.metric_slug);
    const t = tierOf(r.metric_slug, r.tier_index);
    return {
      metric_slug: r.metric_slug,
      tier_index: r.tier_index,
      earned_at: r.earned_at,
      title: t?.title ?? '',
      body: t?.body ?? '',
      display_name: m?.display_name ?? r.metric_slug,
      unit: m?.unit ?? null
    };
  });
  const recent = (earned ?? []).slice(0, recentLimit).map((r)=>{
    const m = metrics.get(r.metric_slug);
    const t = tierOf(r.metric_slug, r.tier_index);
    return {
      metric_slug: r.metric_slug,
      tier_index: r.tier_index,
      earned_at: r.earned_at,
      title: t?.title ?? '',
      display_name: m?.display_name ?? r.metric_slug,
      unit: m?.unit ?? null
    };
  });
  const earnedMaxByMetric = new Map();
  for (const r of earned ?? []){
    const cur = earnedMaxByMetric.get(r.metric_slug) ?? 0;
    if (r.tier_index > cur) earnedMaxByMetric.set(r.metric_slug, r.tier_index);
  }
  const inflight = [];
  for (const [slug, fn] of Object.entries(INLINE)){
    const m = metrics.get(slug);
    if (!m) continue;
    if (m.hidden_without_hk && !hk) continue;
    const ladder = tiers.get(slug) ?? [];
    if (ladder.length === 0) continue;
    let value = 0;
    try {
      value = await fn(supabase, email);
    } catch  {
      continue;
    }
    if (value <= 0) continue;
    const earnedTop = earnedMaxByMetric.get(slug) ?? 0;
    const nextTier = ladder.find((t)=>t.tier_index > earnedTop);
    if (!nextTier) continue;
    inflight.push({
      metric_slug: slug,
      display_name: m.display_name,
      current_value: value,
      next_tier_index: nextTier.tier_index,
      next_threshold: Number(nextTier.threshold),
      next_title: nextTier.title,
      highest_tier_earned: earnedTop,
      unit: m.unit
    });
  }
  inflight.sort((a, b)=>b.current_value / (b.next_threshold || 1) - a.current_value / (a.next_threshold || 1));
  return {
    unseen,
    inflight: inflight.slice(0, inflightLimit),
    recent,
    earned_count: earned?.length ?? 0,
    hk_connected: hk
  };
}
