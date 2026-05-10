// VYVE Health — log-activity v29 — PM-19 (08 May 2026).
//
// CHANGES vs v28:
//   - Successful inserts now return the post-write member_home_state row
//     under `home_state` so the portal can write straight into vyve_home_v3_<email>
//     without a follow-up member-dashboard fetch. The row is computed
//     optimistically: read current member_home_state, increment the type's
//     `*_total` and `*_this_week` columns by 1, ALSO refresh `last_activity_at`
//     and the per-type `last_*_at`. Engagement_score and streaks are NOT
//     recomputed inline — those wait for the next refresh_member_home_state()
//     cycle, same staleness contract as the existing dashboard load (PM-17).
//   - evaluate_only path also returns the fresh home_state when present (no
//     mutation, just reads + returns).
//   - Cap-skip path returns the unchanged home_state too — same shape across
//     all success branches.
//   - All other behaviour byte-identical to v28.
//
// CHANGES from v28 (still applies):
//   - getCORSHeaders no longer returns '*' when Origin is empty/null. Falls through
//     to https://online.vyvehealth.co.uk for any unrecognised case. Closes the
//     06 May audit finding on anon-readable wildcard exposure.
//   - Access-Control-Allow-Credentials always 'true'.
//   - 100KB payload cap on req.json() — returns 413 if Content-Length > 102400.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { evaluateInline } from "./_shared/achievements.ts";
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const LEGACY_SERVICE_ROLE_JWT = Deno.env.get('LEGACY_SERVICE_ROLE_JWT') ?? '';
const ALLOWED_ORIGINS = new Set([
  'https://online.vyvehealth.co.uk',
  'https://www.vyvehealth.co.uk'
]);
const DEFAULT_ORIGIN = 'https://online.vyvehealth.co.uk';
const MAX_BODY_BYTES = 102400; // 100 KB
function getCORSHeaders(req) {
  const origin = req.headers.get('Origin') ?? '';
  const allowOrigin = ALLOWED_ORIGINS.has(origin) ? origin : DEFAULT_ORIGIN;
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Credentials': 'true'
  };
}
function payloadTooLarge(req) {
  const cl = req.headers.get('content-length');
  if (!cl) return false;
  const n = Number(cl);
  return Number.isFinite(n) && n > MAX_BODY_BYTES;
}
const CAPS = {
  daily_habits: 1,
  workouts: 2,
  cardio: 2,
  session_views: 2
};
const AGG_TYPE = {
  daily_habits: 'habit',
  workouts: 'workout',
  cardio: 'cardio',
  session_views: 'session'
};
const STREAK_MILESTONES = [
  7,
  14,
  30,
  60,
  100
];
// ── PM-19: Post-write home_state shape ──────────────────────────────────────
// Returned from every successful log-activity invocation. Lets the portal
// patch vyve_home_v3_<email> directly so the next dashboard paint reflects
// the just-logged activity without a round-trip.
//
// Optimistic delta: read current member_home_state, increment the *_total +
// *_this_week + last_*_at columns, return the patched row. Engagement_score
// and streaks are NOT recomputed inline — same 30-min staleness contract
// as PM-17. Portal callers should treat home_state as authoritative for
// totals/counts and last-known for derived metrics.
const TYPE_TO_HS_COLS = {
  daily_habits: {
    total: 'habits_total',
    weekly: 'habits_this_week',
    lastAt: 'last_habit_at'
  },
  workouts: {
    total: 'workouts_total',
    weekly: 'workouts_this_week',
    lastAt: 'last_workout_at'
  },
  cardio: {
    total: 'cardio_total',
    weekly: 'cardio_this_week',
    lastAt: 'last_cardio_at'
  },
  session_views: {
    total: 'sessions_total',
    weekly: 'sessions_this_week',
    lastAt: 'last_session_at'
  }
};
async function getHomeStatePatched(supabase, email, type, loggedAt) {
  // Read the live home state row (may be missing for brand-new members).
  // Fields cover everything the home cache renders: scores, streaks, totals,
  // this-week counts, last_*_at. Anything else the EF response carries
  // (member, workout summaries, habit details) is NOT in member_home_state
  // and stays whatever the portal had cached.
  try {
    const { data, error } = await supabase.from('member_home_state').select('*').eq('member_email', email).maybeSingle();
    if (error) {
      console.warn('[log-activity v29] home_state read err:', error.message);
      return null;
    }
    if (!data) return null;
    // Apply the optimistic delta only when type has a column mapping
    // (evaluate_only and cap-skip paths pass type='' or null — those just
    // return the row as-is).
    if (type && TYPE_TO_HS_COLS[type]) {
      const cols = TYPE_TO_HS_COLS[type];
      data[cols.total] = Number(data[cols.total] ?? 0) + 1;
      data[cols.weekly] = Number(data[cols.weekly] ?? 0) + 1;
      data[cols.lastAt] = loggedAt;
      // last_activity_at is the GREATEST of the five — bump it too if newer
      const cur = data['last_activity_at'];
      if (!cur || new Date(loggedAt) > new Date(cur)) {
        data['last_activity_at'] = loggedAt;
      }
    }
    return data;
  } catch (e) {
    console.warn('[log-activity v29] home_state read exception:', e.message);
    return null;
  }
}
// ────────────────────────────────────────────────────────────────────────────
async function getAuthUser(req) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${token}`
    }
  });
  if (!res.ok) return null;
  const user = await res.json();
  return user.email?.toLowerCase() || null;
}
async function bumpAggregates(supabase, email, type, activityDate, at) {
  try {
    const { error } = await supabase.rpc('bump_member_activity', {
      p_email: email,
      p_type: type,
      p_date: activityDate,
      p_at: at
    });
    if (error) console.warn('[log-activity] bump_member_activity RPC error:', error.message);
  } catch (e) {
    console.warn('[log-activity] bump_member_activity exception:', e.message);
  }
}
async function checkAndWriteStreakNotification(supabase, email, activityDate) {
  try {
    const tables = [
      'daily_habits',
      'workouts',
      'cardio',
      'session_views'
    ];
    const allDates = new Set();
    await Promise.all(tables.map(async (table)=>{
      const { data } = await supabase.from(table).select('activity_date').eq('member_email', email);
      if (data) data.forEach((r)=>allDates.add(r.activity_date));
    }));
    const sortedDates = Array.from(allDates).sort().reverse();
    let streak = 0;
    let checkDate = new Date(activityDate);
    for (const d of sortedDates){
      const dateStr = checkDate.toISOString().slice(0, 10);
      if (d === dateStr) {
        streak++;
        checkDate.setUTCDate(checkDate.getUTCDate() - 1);
      } else if (d < dateStr) break;
    }
    if (STREAK_MILESTONES.includes(streak)) {
      const type = `streak_milestone_${streak}`;
      const title = `${streak}-Day Streak`;
      const body = streak === 7 ? `A full week of activity — you've built real momentum. Keep going.` : streak === 14 ? `Two weeks straight. You're not just starting habits, you're keeping them.` : streak === 30 ? `30 days. That's not a streak anymore — that's a lifestyle.` : streak === 60 ? `60 days of consistent activity. You're in rare company.` : `100 days. Exceptional. This is what commitment looks like.`;
      const route = '/engagement.html#streak';
      const checkRes = await fetch(`${SUPABASE_URL}/rest/v1/member_notifications?member_email=eq.${encodeURIComponent(email)}&type=eq.${encodeURIComponent(type)}&limit=1`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      });
      const existing = await checkRes.json();
      if (existing.length === 0) {
        await fetch(`${SUPABASE_URL}/rest/v1/member_notifications`, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            member_email: email,
            type,
            title,
            body,
            route
          })
        });
      }
    }
  } catch (e) {
    console.warn('[log-activity] streak notification error:', e);
  }
}
async function writeAchievementNotifications(supabase, email, earned) {
  if (!earned?.length) return;
  try {
    const rows = earned.map((e)=>({
        member_email: email,
        type: `achievement_earned_${e.metric_slug}_${e.tier_index}`,
        title: e.title,
        body: e.body || `You earned ${e.title}.`,
        route: `/engagement.html#achievements&slug=${encodeURIComponent(e.metric_slug)}&tier=${e.tier_index}`
      }));
    const types = rows.map((r)=>`"${r.type}"`).join(',');
    const checkRes = await fetch(`${SUPABASE_URL}/rest/v1/member_notifications?member_email=eq.${encodeURIComponent(email)}&type=in.(${types})`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });
    const existing = await checkRes.json();
    const existingTypes = new Set(existing.map((x)=>x.type));
    const fresh = rows.filter((r)=>!existingTypes.has(r.type));
    if (fresh.length === 0) return;
    await fetch(`${SUPABASE_URL}/rest/v1/member_notifications`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(fresh)
    });
  } catch (e) {
    console.warn('[log-activity] achievement notification write failed:', e.message);
  }
}
async function pushAchievementEarned(email, earned) {
  if (!earned?.length) return;
  if (!LEGACY_SERVICE_ROLE_JWT) {
    console.warn('[log-activity] LEGACY_SERVICE_ROLE_JWT missing — skipping push fan-out');
    return;
  }
  try {
    const earns = earned.map((e)=>({
        metric_slug: e.metric_slug,
        tier_index: e.tier_index,
        title: e.title,
        body: e.body ?? null
      }));
    const res = await fetch(`${SUPABASE_URL}/functions/v1/achievement-earned-push`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LEGACY_SERVICE_ROLE_JWT}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        member_email: email,
        earns
      })
    });
    if (!res.ok) {
      const txt = await res.text();
      console.warn('[log-activity] achievement push failed:', res.status, txt);
    }
  } catch (e) {
    console.warn('[log-activity] achievement push error:', e.message);
  }
}
serve(async (req)=>{
  const corsHeaders = getCORSHeaders(req);
  if (req.method === "OPTIONS") return new Response("ok", {
    headers: corsHeaders
  });
  if (payloadTooLarge(req)) {
    return new Response(JSON.stringify({
      success: false,
      error: "Payload too large (>100KB)"
    }), {
      status: 413,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
      persistSession: false
    }
  });
  try {
    const member_email = await getAuthUser(req);
    if (!member_email) {
      return new Response(JSON.stringify({
        success: false,
        error: "Authentication required. Please log in."
      }), {
        status: 401,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    const body = await req.json();
    if (body && body.evaluate_only === true) {
      let earned_achievements = [];
      try {
        earned_achievements = await evaluateInline(supabase, member_email);
      } catch (e) {
        console.warn('[log-activity] evaluate_only evaluation failed:', e.message);
        earned_achievements = [];
      }
      if (earned_achievements.length > 0) {
        EdgeRuntime.waitUntil(writeAchievementNotifications(supabase, member_email, earned_achievements));
        EdgeRuntime.waitUntil(pushAchievementEarned(member_email, earned_achievements));
      }
      const home_state = await getHomeStatePatched(supabase, member_email, '', '');
      return new Response(JSON.stringify({
        success: true,
        evaluate_only: true,
        earned_achievements,
        home_state
      }), {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    const { type, activity_date, ...fields } = body;
    if (!type || !activity_date) {
      return new Response(JSON.stringify({
        success: false,
        error: "type and activity_date are required"
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    if (!CAPS[type]) {
      return new Response(JSON.stringify({
        success: false,
        error: `Unknown activity type: ${type}`
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    const cap = CAPS[type];
    const { count, error: countErr } = await supabase.from(type).select("*", {
      count: "exact",
      head: true
    }).eq("member_email", member_email).eq("activity_date", activity_date);
    if (countErr) throw countErr;
    const existing = count ?? 0;
    if (existing >= cap) {
      let earned_skip = [];
      try {
        earned_skip = await evaluateInline(supabase, member_email);
      } catch (e) {
        console.warn('[log-activity] eval (skip) err:', e.message);
      }
      if (earned_skip.length > 0) {
        EdgeRuntime.waitUntil(writeAchievementNotifications(supabase, member_email, earned_skip));
        EdgeRuntime.waitUntil(pushAchievementEarned(member_email, earned_skip));
      }
      // Cap-skip: no insert happened, return the unchanged home_state
      const home_state_skip = await getHomeStatePatched(supabase, member_email, '', '');
      return new Response(JSON.stringify({
        success: true,
        skipped: true,
        reason: `cap reached (${cap}/${cap})`,
        earned_achievements: earned_skip,
        home_state: home_state_skip
      }), {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    const session_number = existing + 1;
    const logged_at = new Date().toISOString();
    const payload = {
      member_email,
      activity_date,
      session_number,
      logged_at,
      ...fields
    };
    if (type === "daily_habits") delete payload.session_number;
    const { error: insertErr } = await supabase.from(type).insert(payload);
    if (insertErr) throw insertErr;
    const aggType = AGG_TYPE[type];
    if (aggType) EdgeRuntime.waitUntil(bumpAggregates(supabase, member_email, aggType, activity_date, logged_at));
    EdgeRuntime.waitUntil(checkAndWriteStreakNotification(supabase, member_email, activity_date));
    let earned_achievements = [];
    try {
      earned_achievements = await evaluateInline(supabase, member_email);
    } catch (e) {
      console.warn('[log-activity] achievement evaluation failed:', e.message);
      earned_achievements = [];
    }
    if (earned_achievements.length > 0) {
      EdgeRuntime.waitUntil(writeAchievementNotifications(supabase, member_email, earned_achievements));
      EdgeRuntime.waitUntil(pushAchievementEarned(member_email, earned_achievements));
    }
    // Successful insert — return optimistically-patched home_state
    const home_state = await getHomeStatePatched(supabase, member_email, type, logged_at);
    return new Response(JSON.stringify({
      success: true,
      skipped: false,
      session_number,
      type,
      member_email,
      activity_date,
      earned_achievements,
      home_state
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  } catch (err) {
    console.error("[log-activity] Error:", err.message);
    return new Response(JSON.stringify({
      success: false,
      error: err.message
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
});
