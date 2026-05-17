// _shared/achievements.ts — unchanged from v68 / PM-17.
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
function homeStateFieldFromCtx(ctx, field) {
  if (!ctx.homeStateRow) return 0;
  return Number(ctx.homeStateRow[field] ?? 0);
}
async function personaSwitched(s, email) {
  const { data } = await s.from('members').select('persona_switches').eq('email', email).maybeSingle();
  if (!data) return 0;
  const sw = data.persona_switches;
  return Array.isArray(sw) && sw.length > 0 ? 1 : 0;
}
const INLINE = {
  habits_logged: (s, e, _c)=>count(s, 'daily_habits', e),
  workouts_logged: async (_s, _e, c)=>homeStateFieldFromCtx(c, 'workouts_total'),
  cardio_logged: async (_s, _e, c)=>homeStateFieldFromCtx(c, 'cardio_total'),
  sessions_watched: (s, e, _c)=>count(s, 'session_views', e),
  replays_watched: (s, e, _c)=>count(s, 'replay_views', e),
  checkins_completed: async (_s, _e, c)=>homeStateFieldFromCtx(c, 'checkins_total'),
  monthly_checkins_completed: (s, e, _c)=>count(s, 'monthly_checkins', e),
  meals_logged: (s, e, _c)=>count(s, 'nutrition_logs', e),
  weights_logged: (s, e, _c)=>count(s, 'weight_logs', e),
  exercises_logged: (s, e, _c)=>count(s, 'exercise_logs', e),
  custom_workouts_created: (s, e, _c)=>count(s, 'custom_workouts', e),
  workouts_shared: (s, e, _c)=>count(s, 'shared_workouts', e),
  running_plans_generated: (s, e, _c)=>count(s, 'member_running_plans', e),
  workout_minutes_total: (s, e, _c)=>sumColumn(s, 'workouts', 'duration_minutes', e),
  cardio_minutes_total: (s, e, _c)=>sumColumn(s, 'cardio', 'duration_minutes', e),
  cardio_distance_total: (s, e, _c)=>sumColumn(s, 'cardio', 'distance_km', e),
  streak_overall: async (_s, _e, c)=>homeStateFieldFromCtx(c, 'overall_streak_current'),
  streak_habits: async (_s, _e, c)=>homeStateFieldFromCtx(c, 'habits_streak_current'),
  streak_workouts: async (_s, _e, c)=>homeStateFieldFromCtx(c, 'workouts_streak_current'),
  streak_cardio: async (_s, _e, c)=>homeStateFieldFromCtx(c, 'cardio_streak_current'),
  streak_sessions: async (_s, _e, c)=>homeStateFieldFromCtx(c, 'sessions_streak_current'),
  streak_checkin_weeks: async (_s, _e, c)=>homeStateFieldFromCtx(c, 'checkin_streak_current'),
  persona_switched: (s, e, _c)=>personaSwitched(s, e)
};
const HOME_STATE_STREAK_FIELDS = [
  'overall_streak_current',
  'habits_streak_current',
  'workouts_streak_current',
  'cardio_streak_current',
  'sessions_streak_current',
  'checkin_streak_current',
  'workouts_total',
  'cardio_total',
  'checkins_total'
].join(',');
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
async function fetchHomeStateRow(supabase, email) {
  const { data } = await supabase.from('member_home_state').select(HOME_STATE_STREAK_FIELDS).eq('member_email', email).maybeSingle();
  return data ?? null;
}
export async function evaluateInline(supabase, email) {
  const [{ metrics, tiers }, hk, existingRowsRes, homeStateRow] = await Promise.all([
    loadCatalog(supabase),
    isHkConnected(supabase, email),
    supabase.from('member_achievements').select('metric_slug,tier_index').eq('member_email', email),
    fetchHomeStateRow(supabase, email)
  ]);
  const ctx = {
    homeStateRow
  };
  const earnedSet = new Set();
  for (const r of existingRowsRes.data ?? [])earnedSet.add(`${r.metric_slug}:${r.tier_index}`);
  const slugs = Object.keys(INLINE);
  const valueResults = await Promise.all(slugs.map(async (slug)=>{
    const m = metrics.get(slug);
    if (!m) return null;
    if (m.source !== 'inline') return null;
    if (m.hidden_without_hk && !hk) return null;
    const ladder = tiers.get(slug) ?? [];
    if (ladder.length === 0) return null;
    try {
      const value = await INLINE[slug](supabase, email, ctx);
      return {
        slug,
        value,
        ladder,
        m
      };
    } catch (e) {
      console.warn(`[ach] eval ${slug} failed:`, e.message);
      return null;
    }
  }));
  const newRows = [];
  const earned = [];
  for (const r of valueResults){
    if (!r) continue;
    const { slug, value, ladder, m } = r;
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
  const [{ metrics, tiers }, hk, earnedRes, homeStateRow] = await Promise.all([
    loadCatalog(supabase),
    isHkConnected(supabase, email),
    supabase.from('member_achievements').select('metric_slug,tier_index,earned_at,seen_at').eq('member_email', email).order('earned_at', {
      ascending: false
    }),
    fetchHomeStateRow(supabase, email)
  ]);
  const ctx = {
    homeStateRow
  };
  const earned = earnedRes.data;
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
  const slugs = Object.keys(INLINE);
  const valueResults = await Promise.all(slugs.map(async (slug)=>{
    const m = metrics.get(slug);
    if (!m) return null;
    if (m.hidden_without_hk && !hk) return null;
    const ladder = tiers.get(slug) ?? [];
    if (ladder.length === 0) return null;
    try {
      const value = await INLINE[slug](supabase, email, ctx);
      return {
        slug,
        value,
        ladder,
        m
      };
    } catch  {
      return null;
    }
  }));
  const inflight = [];
  for (const r of valueResults){
    if (!r) continue;
    const { slug, value, ladder, m } = r;
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
