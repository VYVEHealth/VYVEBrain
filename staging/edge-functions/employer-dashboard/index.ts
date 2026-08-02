// employer-dashboard v20 — removed unauthenticated fallback, CORS restricted
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const EMPLOYER_API_KEY = Deno.env.get('EMPLOYER_DASHBOARD_API_KEY') ?? '';
const CORS = {
  'Access-Control-Allow-Origin': 'https://www.vyvehealth.co.uk',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
  'Access-Control-Allow-Methods': 'GET, OPTIONS'
};
// Simple in-memory rate limiting (reset on cold start)
const requestCounts = new Map();
const RATE_LIMIT = 100;
const RATE_WINDOW = 60 * 60 * 1000;
function checkRateLimit(key) {
  const now = Date.now();
  const record = requestCounts.get(key);
  if (!record || now > record.resetAt) {
    requestCounts.set(key, {
      count: 1,
      resetAt: now + RATE_WINDOW
    });
    return true;
  }
  if (record.count >= RATE_LIMIT) return false;
  record.count++;
  return true;
}
function validateAuth(req) {
  if (!EMPLOYER_API_KEY) {
    // Key not configured — hard fail, no fallback
    console.error('employer-dashboard: EMPLOYER_DASHBOARD_API_KEY not configured');
    return {
      valid: false,
      error: 'Server misconfiguration — contact support.'
    };
  }
  const apiKey = req.headers.get('x-api-key') || req.headers.get('X-API-Key');
  const url = new URL(req.url);
  const queryKey = url.searchParams.get('api_key');
  const providedKey = apiKey || queryKey;
  if (!providedKey) {
    return {
      valid: false,
      error: 'Missing API key. Provide x-api-key header or api_key query param.'
    };
  }
  if (providedKey !== EMPLOYER_API_KEY) {
    return {
      valid: false,
      error: 'Invalid API key.'
    };
  }
  return {
    valid: true,
    identifier: 'api-key-auth'
  };
}
async function query(table, params) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`
    }
  });
  return res.json();
}
serve(async (req)=>{
  if (req.method === 'OPTIONS') return new Response('ok', {
    headers: CORS
  });
  try {
    const auth = validateAuth(req);
    if (!auth.valid) {
      return new Response(JSON.stringify({
        error: auth.error
      }), {
        status: 401,
        headers: {
          ...CORS,
          'Content-Type': 'application/json'
        }
      });
    }
    const clientId = auth.identifier || 'unknown';
    if (!checkRateLimit(clientId)) {
      return new Response(JSON.stringify({
        error: 'Rate limit exceeded. Try again later.'
      }), {
        status: 429,
        headers: {
          ...CORS,
          'Content-Type': 'application/json'
        }
      });
    }
    const url = new URL(req.url);
    const company = url.searchParams.get('company') || 'ALL';
    let memberEmails = null;
    const allMembers = await query('members', 'select=email,company,created_at');
    const companies = [
      ...new Set(allMembers.map((m)=>m.company).filter((c)=>!!c))
    ];
    if (company !== 'ALL') {
      memberEmails = allMembers.filter((m)=>m.company === company).map((m)=>m.email);
    }
    const totalMembers = company === 'ALL' ? allMembers.length : memberEmails?.length ?? 0;
    async function fetchActivity(table, select = 'member_email,activity_date,logged_at') {
      if (memberEmails !== null && memberEmails.length === 0) return [];
      const emailFilter = memberEmails ? `&member_email=in.(${memberEmails.map((e)=>`"${e}"`).join(',')})` : '';
      return query(table, `select=${select}${emailFilter}`);
    }
    const [habits, workouts, cardio, kahCheckins, wbCheckins, sessions, replays] = await Promise.all([
      fetchActivity('daily_habits'),
      fetchActivity('workouts'),
      fetchActivity('cardio'),
      fetchActivity('kahunas_checkins'),
      fetchActivity('wellbeing_checkins'),
      fetchActivity('session_views', 'member_email,activity_date,category,minutes_watched,logged_at'),
      fetchActivity('replay_views', 'member_email,activity_date,category,minutes_watched,logged_at')
    ]);
    const totalHabits = habits.length;
    const totalWorkouts = workouts.length;
    const totalCardio = cardio.length;
    const totalCheckins = kahCheckins.length + wbCheckins.length;
    const totalLiveViews = sessions.length;
    const totalReplayViews = replays.length;
    const totalActivities = totalHabits + totalWorkouts + totalCardio + totalCheckins + totalLiveViews + totalReplayViews;
    const now = new Date();
    const day7 = new Date(now.getTime() - 7 * 86400000).toISOString().slice(0, 10);
    const day30 = new Date(now.getTime() - 30 * 86400000).toISOString().slice(0, 10);
    const lastActiveMap = {};
    const allActivity = [
      ...habits,
      ...workouts,
      ...cardio,
      ...kahCheckins,
      ...wbCheckins,
      ...sessions,
      ...replays
    ];
    for (const row of allActivity){
      const email = row.member_email;
      const date = row.activity_date || row.logged_at?.slice(0, 10) || '';
      if (!lastActiveMap[email] || date > lastActiveMap[email]) lastActiveMap[email] = date;
    }
    const scopeEmails = memberEmails ?? allMembers.map((m)=>m.email);
    let activeCount = 0, quietCount = 0, inactiveCount = 0;
    for (const email of scopeEmails){
      const last = lastActiveMap[email];
      if (!last) {
        inactiveCount++;
        continue;
      }
      if (last >= day7) {
        activeCount++;
        continue;
      }
      if (last >= day30) {
        quietCount++;
        continue;
      }
      inactiveCount++;
    }
    const engagementRate = totalMembers > 0 ? Math.round((activeCount + quietCount) / totalMembers * 100) : 0;
    const thisMonthPrefix = now.toISOString().slice(0, 7);
    const thisMonth = allActivity.filter((r)=>{
      const d = r.activity_date || r.logged_at?.slice(0, 10) || '';
      return d.startsWith(thisMonthPrefix);
    }).length;
    const avgPerMember = totalMembers > 0 ? (totalActivities / totalMembers).toFixed(1) : '0';
    const monthCounts = {};
    for (const row of allActivity){
      const d = row.activity_date || row.logged_at?.slice(0, 10) || '';
      if (!d) continue;
      const ym = d.slice(0, 7);
      monthCounts[ym] = (monthCounts[ym] || 0) + 1;
    }
    const trend = Object.keys(monthCounts).sort().slice(-10).map((ym)=>{
      const [y, m] = ym.split('-');
      const label = new Date(parseInt(y), parseInt(m) - 1, 1).toLocaleDateString('en-GB', {
        month: 'short',
        year: '2-digit'
      });
      return {
        label,
        count: monthCounts[ym]
      };
    });
    const monthsDonated = Math.floor(totalActivities / 30);
    const remainder = totalActivities % 30;
    const progressPct = Math.round(remainder / 30 * 100);
    const catMap = {};
    const SKIP_CATS = new Set([
      'Sessions Hub',
      'Unknown',
      ''
    ]);
    for (const s of sessions){
      const cat = s.category || 'Unknown';
      if (SKIP_CATS.has(cat)) continue;
      if (!catMap[cat]) catMap[cat] = {
        liveViews: 0,
        liveMins: 0,
        replayViews: 0,
        replayMins: 0
      };
      catMap[cat].liveViews++;
      catMap[cat].liveMins += Math.round(parseFloat(s.minutes_watched) || 0);
    }
    for (const r of replays){
      const cat = r.category || 'Unknown';
      if (SKIP_CATS.has(cat)) continue;
      if (!catMap[cat]) catMap[cat] = {
        liveViews: 0,
        liveMins: 0,
        replayViews: 0,
        replayMins: 0
      };
      catMap[cat].replayViews++;
      catMap[cat].replayMins += Math.round(parseFloat(r.minutes_watched) || 0);
    }
    const byCategory = Object.entries(catMap).map(([category, v])=>({
        category,
        ...v
      })).sort((a, b)=>b.liveViews + b.replayViews - (a.liveViews + a.replayViews));
    const totalLiveMins = sessions.reduce((s, r)=>s + Math.round(parseFloat(r.minutes_watched) || 0), 0);
    const totalReplayMins = replays.reduce((s, r)=>s + Math.round(parseFloat(r.minutes_watched) || 0), 0);
    return new Response(JSON.stringify({
      companies,
      members: {
        total: totalMembers,
        active: activeCount,
        quiet: quietCount,
        inactive: inactiveCount,
        engagementRate
      },
      activities: {
        total: totalActivities,
        thisMonth,
        avgPerMember,
        habits: totalHabits,
        checkins: totalCheckins,
        workouts: totalWorkouts,
        cardio: totalCardio
      },
      sessions: {
        totalLiveViews,
        totalReplayViews,
        totalLiveMins,
        totalReplayMins,
        byCategory
      },
      charity: {
        monthsDonated,
        remainder,
        progressPct,
        nextMilestone: {
          remaining: 30 - remainder
        }
      },
      trend
    }), {
      headers: {
        ...CORS,
        'Content-Type': 'application/json'
      }
    });
  } catch (err) {
    console.error('employer-dashboard error:', err);
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
