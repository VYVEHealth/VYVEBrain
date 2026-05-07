// leaderboard v11 — classic 1-to-N board, time ranges, scope availability, tenure filter
// Changes from v10:
//   - Adds ?range=this_month|last_30d|all_time (default this_month).
//   - Per-metric ranked[] (top 100) with is_caller flag.
//   - Per-metric overflow_count (members ranked past 100) and zero_count (scope members with 0 on metric for range).
//   - all_time tenure filter: members with created_at < now()-7d qualify for ranked; younger counted in new_members_count.
//   - streak metric across ranges: overall_streak_current for this_month/last_30d, overall_streak_best for all_time.
//   - Top-level scope_available: true iff caller has an employer_members row with non-null employer_name.
//   - Preserves v10 contract: above[], below_count, gap, your_rank, your_count, total_members still returned.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const SUPABASE_ANON = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const ALLOWED_ORIGINS = new Set([
  'https://online.vyvehealth.co.uk',
  'https://www.vyvehealth.co.uk'
]);
const RANKED_CAP = 100;
const TENURE_DAYS = 7;
function getCORSHeaders(req) {
  const origin = req.headers.get('Origin') ?? '';
  const allowOrigin = ALLOWED_ORIGINS.has(origin) ? origin : origin === 'null' || origin === '' ? '*' : 'https://online.vyvehealth.co.uk';
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Credentials': allowOrigin !== '*' ? 'true' : 'false'
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
function resolveDisplayName(m, isCaller) {
  if (isCaller) return m?.first_name || 'You';
  if (!m) return 'Member';
  const pref = m.display_name_preference || 'anonymous';
  const first = (m.first_name || '').trim();
  const last = (m.last_name || '').trim();
  switch(pref){
    case 'full_name':
      if (first && last) return `${first} ${last}`;
      return first || last || 'Member';
    case 'first_name':
      return first || 'Member';
    case 'initials':
      {
        const fi = first.charAt(0).toUpperCase();
        const li = last.charAt(0).toUpperCase();
        const initials = `${fi}${li}`;
        return initials || 'Member';
      }
    case 'anonymous':
    default:
      return 'Member';
  }
}
function categoryString(r, range) {
  const parts = [];
  if (range === 'this_month') {
    if (r.habits_this_month > 0) parts.push('Habits');
    if (r.workouts_this_month > 0) parts.push('Workouts');
    if (r.cardio_this_month > 0) parts.push('Cardio');
    if (r.sessions_this_month > 0) parts.push('Sessions');
  } else if (range === 'last_30d') {
    if (r.recent_habits_30d > 0) parts.push('Habits');
    if (r.recent_workouts_30d > 0) parts.push('Workouts');
    if (r.recent_cardio_30d > 0) parts.push('Cardio');
    if (r.recent_sessions_30d > 0) parts.push('Sessions');
  } else {
    if (r.habits_total > 0) parts.push('Habits');
    if (r.workouts_total > 0) parts.push('Workouts');
    if (r.cardio_total > 0) parts.push('Cardio');
    if (r.sessions_total > 0) parts.push('Sessions');
  }
  return parts.join(' · ') || 'Active';
}
function allFor(r, range) {
  if (range === 'this_month') {
    return (r.habits_this_month || 0) + (r.workouts_this_month || 0) + (r.cardio_this_month || 0) + (r.sessions_this_month || 0) + (r.checkins_this_month || 0);
  }
  if (range === 'last_30d') {
    return (r.recent_habits_30d || 0) + (r.recent_workouts_30d || 0) + (r.recent_cardio_30d || 0) + (r.recent_sessions_30d || 0) + (r.recent_checkins_30d || 0);
  }
  return (r.habits_total || 0) + (r.workouts_total || 0) + (r.cardio_total || 0) + (r.sessions_total || 0) + (r.checkins_total || 0);
}
function habitsFor(r, range) {
  if (range === 'this_month') return r.habits_this_month || 0;
  if (range === 'last_30d') return r.recent_habits_30d || 0;
  return r.habits_total || 0;
}
function workoutsFor(r, range) {
  if (range === 'this_month') return r.workouts_this_month || 0;
  if (range === 'last_30d') return r.recent_workouts_30d || 0;
  return r.workouts_total || 0;
}
function streakFor(r, range) {
  if (range === 'all_time') return r.overall_streak_best || 0;
  return r.overall_streak_current || 0;
}
serve(async (req)=>{
  const CORS = getCORSHeaders(req);
  if (req.method === 'OPTIONS') return new Response('ok', {
    headers: CORS
  });
  try {
    // --- Auth: prefer JWT; fall back to ?email= param for backwards compat ---
    let callerEmail = null;
    const authHeader = req.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      if (token !== SUPABASE_ANON) {
        try {
          const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);
          const { data: { user }, error } = await supabase.auth.getUser(token);
          if (!error && user?.email) callerEmail = user.email.toLowerCase();
        } catch (_) {}
      }
    }
    const url = new URL(req.url);
    if (!callerEmail) {
      callerEmail = url.searchParams.get('email')?.toLowerCase() ?? null;
    }
    if (!callerEmail) {
      return new Response(JSON.stringify({
        error: 'Missing auth — send JWT or ?email= param'
      }), {
        status: 400,
        headers: {
          ...CORS,
          'Content-Type': 'application/json'
        }
      });
    }
    const scopeParam = (url.searchParams.get('scope') || 'all').toLowerCase();
    const scope = scopeParam === 'company' || scopeParam === 'my-team' ? scopeParam : 'all';
    const rangeParam = (url.searchParams.get('range') || 'this_month').toLowerCase();
    const range = rangeParam === 'last_30d' || rangeParam === 'all_time' ? rangeParam : 'this_month';
    // --- One round-trip ---
    const [homeRows, memberRows, employerRows] = await Promise.all([
      q('member_home_state', 'select=member_email,habits_this_month,workouts_this_month,cardio_this_month,sessions_this_month,checkins_this_month,recent_habits_30d,recent_workouts_30d,recent_cardio_30d,recent_sessions_30d,recent_checkins_30d,habits_total,workouts_total,cardio_total,sessions_total,checkins_total,overall_streak_current,overall_streak_best,last_activity_at'),
      q('members', 'select=email,first_name,last_name,display_name_preference,created_at'),
      q('employer_members', 'select=member_email,employer_name,department')
    ]);
    // Index lookups
    const memberByEmail = new Map();
    for (const m of memberRows)memberByEmail.set(m.email.toLowerCase(), m);
    const employerByEmail = new Map();
    for (const er of employerRows){
      const k = er.member_email.toLowerCase();
      if (!employerByEmail.has(k)) employerByEmail.set(k, er);
    }
    const callerEmployer = employerByEmail.get(callerEmail);
    const scopeAvailable = !!(callerEmployer && callerEmployer.employer_name);
    // --- Scope filter ---
    function includeRow(r) {
      const em = r.member_email.toLowerCase();
      if (scope === 'all') return true;
      if (scope === 'company') {
        if (!callerEmployer?.employer_name) return em === callerEmail;
        const their = employerByEmail.get(em);
        return their?.employer_name === callerEmployer.employer_name;
      }
      if (!callerEmployer?.employer_name) return em === callerEmail;
      const their = employerByEmail.get(em);
      return !!their && their.employer_name === callerEmployer.employer_name && their.department === callerEmployer.department;
    }
    // --- Tenure cutoff for all_time ---
    const tenureCutoffMs = Date.now() - TENURE_DAYS * 24 * 60 * 60 * 1000;
    function isNew(m) {
      if (!m?.created_at) return false;
      const ts = new Date(m.created_at).getTime();
      if (!isFinite(ts)) return false;
      return ts > tenureCutoffMs;
    }
    // --- Build ranked pool + track new-members-in-scope count ---
    const ranked = [];
    let newMembersCount = 0;
    for (const r of homeRows){
      if (!includeRow(r)) continue;
      const em = r.member_email.toLowerCase();
      const member = memberByEmail.get(em);
      const isCaller = em === callerEmail;
      const memberIsNew = !isCaller && range === 'all_time' && isNew(member);
      if (memberIsNew) {
        newMembersCount++;
        continue; // excluded from ranked on all_time
      }
      ranked.push({
        email: em,
        display_name: resolveDisplayName(member, isCaller),
        all: allFor(r, range),
        habits: habitsFor(r, range),
        workouts: workoutsFor(r, range),
        streak: streakFor(r, range),
        streak_best: r.overall_streak_best || 0,
        last_activity_ms: r.last_activity_at ? new Date(r.last_activity_at).getTime() : 0,
        cats: categoryString(r, range),
        is_new: false
      });
    }
    function sortedBy(metric) {
      return [
        ...ranked
      ].sort((a, b)=>{
        const diff = b[metric] - a[metric];
        if (diff !== 0) return diff;
        const recency = b.last_activity_ms - a.last_activity_ms;
        if (recency !== 0) return recency;
        return a.email.localeCompare(b.email);
      });
    }
    function buildMetric(metric) {
      const sorted = sortedBy(metric);
      // Split into active (count>0) and zeros. Zeros collapse into a footer count.
      const active = [];
      let zeroCount = 0;
      for (const m of sorted){
        if (m[metric] > 0) active.push(m);
        else zeroCount++;
      }
      // Caller always shows their position against ALL in-scope members, not just active ones.
      // your_rank uses the full sorted list (active + zeros ordered by tiebreakers).
      const callerIdx = sorted.findIndex((m)=>m.email === callerEmail);
      const total = sorted.length;
      const yourRank = callerIdx === -1 ? total : callerIdx + 1;
      const yourCount = callerIdx === -1 ? 0 : sorted[callerIdx][metric];
      // medal + bar scaled against top active count
      const topCount = active[0]?.[metric] ?? 1;
      const medals = [
        'gold',
        'silver',
        'bronze'
      ];
      // ranked[] is the top-100 of ACTIVE only (zeros get footer-collapsed).
      // BUT: if the caller is in the zero bucket, we still highlight them via the zero footer — not as a ranked row.
      const rankedList = active.slice(0, RANKED_CAP).map((m, i)=>({
          rank: i + 1,
          medal: medals[i] || '',
          count: m[metric],
          cats: m.cats,
          bar: topCount > 0 ? Math.round(m[metric] / topCount * 100) : 0,
          display_name: m.display_name,
          is_caller: m.email === callerEmail
        }));
      const overflowCount = Math.max(0, active.length - RANKED_CAP);
      // v10-compat above[] — using active sort for consistency with ranked[]
      const activeCallerIdx = active.findIndex((m)=>m.email === callerEmail);
      const aboveSlice = activeCallerIdx === -1 ? active.slice(0, 3) : active.slice(0, activeCallerIdx);
      const above = aboveSlice.slice(0, 10).map((m, i)=>({
          rank: i + 1,
          medal: medals[i] || '',
          count: m[metric],
          cats: m.cats,
          bar: topCount > 0 ? Math.round(m[metric] / topCount * 100) : 0,
          display_name: m.display_name
        }));
      const belowCount = callerIdx === -1 ? total : total - callerIdx - 1;
      const nextAbove = callerIdx > 0 ? sorted[callerIdx - 1][metric] : 0;
      const gap = callerIdx <= 0 ? 0 : Math.max(0, nextAbove - yourCount + 1);
      return {
        your_rank: yourRank,
        total_members: total,
        your_count: yourCount,
        above,
        below_count: belowCount,
        gap,
        ranked: rankedList,
        overflow_count: overflowCount,
        zero_count: zeroCount,
        new_members_count: newMembersCount
      };
    }
    const callerMember = memberByEmail.get(callerEmail);
    const firstName = callerMember?.first_name || 'You';
    return new Response(JSON.stringify({
      first_name: firstName,
      scope,
      range,
      scope_available: scopeAvailable,
      all: buildMetric('all'),
      habits: buildMetric('habits'),
      workouts: buildMetric('workouts'),
      streak: buildMetric('streak')
    }), {
      headers: {
        ...CORS,
        'Content-Type': 'application/json'
      }
    });
  } catch (err) {
    console.error('leaderboard error:', err);
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
