// _shared/achievements.ts — VYVE Achievements evaluator (Phase 1 + Phase 2 vol + Phase 3 grid)
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
  const { data } = await s.from('member_health_connections').select('member_email').eq('member_email', email).maybeSingle();
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
const CATEGORY_LABELS = {
  counts: 'Activity Counts',
  volume: 'Strength Volume',
  time_totals: 'Time Logged',
  hk: 'Apple Health Lifetime',
  streaks: 'Streaks',
  variety: 'Variety',
  collective: 'Charity & Community',
  tenure: 'Tenure',
  one_shot: 'Milestones'
};
const CATEGORY_ORDER = [
  'counts',
  'volume',
  'time_totals',
  'streaks',
  'hk',
  'variety',
  'collective',
  'tenure',
  'one_shot'
];
export async function getMemberGrid(supabase, email) {
  const { metrics, tiers } = await loadCatalog(supabase);
  const hk = await isHkConnected(supabase, email);
  const { data: earnedRows } = await supabase.from('member_achievements').select('metric_slug,tier_index,earned_at,seen_at').eq('member_email', email);
  const earnedByKey = new Map();
  for (const r of earnedRows ?? [])earnedByKey.set(`${r.metric_slug}:${r.tier_index}`, r);
  const allEvaluators = {
    ...INLINE,
    ...GRID_EXTRA
  };
  const slugsToEval = [];
  for (const m of metrics.values()){
    if (m.hidden_without_hk && !hk) continue;
    if (allEvaluators[m.slug]) slugsToEval.push(m.slug);
  }
  const valueResults = await Promise.all(slugsToEval.map(async (slug)=>{
    try {
      return [
        slug,
        await allEvaluators[slug](supabase, email)
      ];
    } catch (e) {
      console.warn(`[ach-grid] ${slug} eval failed:`, e.message);
      return [
        slug,
        null
      ];
    }
  }));
  const valueByMetric = new Map(valueResults);
  const rows = [];
  for (const m of metrics.values()){
    if (m.hidden_without_hk && !hk) continue;
    const ladder = tiers.get(m.slug) ?? [];
    if (ladder.length === 0) continue;
    const currentValueRaw = valueByMetric.has(m.slug) ? valueByMetric.get(m.slug) : null;
    const hasValue = currentValueRaw !== null && currentValueRaw !== undefined;
    const currentValue = hasValue ? Number(currentValueRaw) : 0;
    const earnedIndexes = new Set();
    let highestEarned = 0;
    for (const t of ladder){
      const er = earnedByKey.get(`${m.slug}:${t.tier_index}`);
      if (er) {
        earnedIndexes.add(t.tier_index);
        if (t.tier_index > highestEarned) highestEarned = t.tier_index;
      }
    }
    const nextTier = ladder.find((t)=>!earnedIndexes.has(t.tier_index));
    const tierTiles = ladder.map((t)=>{
      const earnedRow = earnedByKey.get(`${m.slug}:${t.tier_index}`);
      const isEarned = !!earnedRow;
      const isCurrent = !isEarned && nextTier && t.tier_index === nextTier.tier_index;
      const tile = {
        index: t.tier_index,
        threshold: Number(t.threshold),
        title: t.title,
        body: t.body,
        earned: isEarned,
        is_current: isCurrent
      };
      if (isEarned) {
        tile.earned_at = earnedRow.earned_at;
        tile.seen = !!earnedRow.seen_at;
      }
      if (isCurrent && hasValue) {
        const prevThreshold = ladder.filter((p)=>p.tier_index < t.tier_index).reduce((acc, p)=>Math.max(acc, Number(p.threshold)), 0);
        const span = Math.max(1, Number(t.threshold) - prevThreshold);
        const into = Math.max(0, currentValue - prevThreshold);
        const pct = Math.min(100, Math.max(0, into / span * 100));
        tile.progress = {
          current: currentValue,
          target: Number(t.threshold),
          prev_threshold: prevThreshold,
          pct: Math.round(pct * 10) / 10
        };
      }
      return tile;
    });
    rows.push({
      slug: m.slug,
      display_name: m.display_name,
      category: m.category,
      unit: m.unit,
      is_recurring: m.is_recurring,
      sort_order: m.sort_order,
      current_value: hasValue ? currentValue : null,
      highest_tier_earned: highestEarned,
      max_tier: ladder[ladder.length - 1].tier_index,
      tiers: tierTiles
    });
  }
  rows.sort((a, b)=>{
    const ca = CATEGORY_ORDER.indexOf(a.category);
    const cb = CATEGORY_ORDER.indexOf(b.category);
    if (ca !== cb) return (ca === -1 ? 99 : ca) - (cb === -1 ? 99 : cb);
    return a.sort_order - b.sort_order;
  });
  const seenCats = new Set();
  const categories = [];
  for (const row of rows){
    if (seenCats.has(row.category)) continue;
    seenCats.add(row.category);
    categories.push({
      key: row.category,
      display: CATEGORY_LABELS[row.category] ?? row.category
    });
  }
  return {
    hk_connected: hk,
    categories,
    metrics: rows,
    earned_total: earnedRows?.length ?? 0
  };
}
