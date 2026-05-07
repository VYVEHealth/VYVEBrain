// get-health-data v3
// 29 April 2026
// VYVE Health — Apple Health data inspector backend.
//
// v3 change (29 April 2026): Split the single combined samples query into 4 per-type
//   queries with sensible limits. Previously a single .in([...]) query against
//   member_health_samples hit Supabase's default 1,000-row cap; high-volume HR data
//   filled the entire quota and starved workouts/sleep/weight to zero rows even though
//   they existed in the DB. Diagnostic page was rendering 0 workouts / 0 sleep / 0 weight
//   while the underlying tables held 15 / 187 / 2 rows respectively over the last 30 days.
//
// v2 change: Read steps/distance/active_energy from member_health_daily (source-deduped)
//   instead of member_health_samples (which had raw Watch + iPhone doubles).
//   HR/weight/sleep/workouts still come from member_health_samples.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "https://online.vyvehealth.co.uk",
  "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Max-Age": "86400",
  "Vary": "Origin"
};
const WINDOW_DAYS = 30;
// Per-type row limits. Chosen so a typical 30-day window fits without truncation
// while protecting against runaway HR streams (Watch can produce 4-6/min = 200k+/30d).
const LIMIT_WORKOUT = 500;
const LIMIT_WEIGHT = 200;
const LIMIT_SLEEP = 2000;
const LIMIT_HR = 5000; // sufficient for daily min/max/avg aggregation
function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json"
    }
  });
}
function isoDate(d) {
  return d.toISOString().slice(0, 10);
}
function emptyDailyBuckets(start, end) {
  const out = {};
  const cur = new Date(start);
  cur.setUTCHours(0, 0, 0, 0);
  const endMs = end.getTime();
  while(cur.getTime() <= endMs){
    out[isoDate(cur)] = {};
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return out;
}
Deno.serve(async (req)=>{
  if (req.method === "OPTIONS") return new Response(null, {
    status: 200,
    headers: CORS_HEADERS
  });
  if (req.method !== "POST" && req.method !== "GET") return jsonResponse({
    error: "method_not_allowed"
  }, 405);
  const authHeader = req.headers.get("Authorization") || "";
  const jwt = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!jwt) return jsonResponse({
    error: "unauthorized"
  }, 401);
  const svc = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
  const { data: userData, error: userErr } = await svc.auth.getUser(jwt);
  if (userErr || !userData?.user?.email) return jsonResponse({
    error: "unauthorized"
  }, 401);
  const memberEmail = userData.user.email.toLowerCase();
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - WINDOW_DAYS * 86400_000);
  const startIso = startDate.toISOString();
  try {
    const { data: connRows } = await svc.from("member_health_connections").select("platform, last_sync_at, last_sync_status, granted_scopes, total_synced, revoked_at").eq("member_email", memberEmail);
    const connection = connRows && connRows[0] ? connRows[0] : null;
    // ─── Fetch each sample type independently with its own limit ───
    // The previous single .in([...]) query ran into the default 1,000-row cap and
    // HR data crowded out everything else. Per-type queries solve this cleanly.
    const baseSelect = "sample_type, workout_type, start_at, end_at, value, unit, metadata, app_source, promoted_to, native_uuid";
    const [workoutRes, hrRes, weightRes, sleepRes] = await Promise.all([
      svc.from("member_health_samples").select(baseSelect).eq("member_email", memberEmail).eq("sample_type", "workout").gte("start_at", startIso).order("start_at", {
        ascending: false
      }).limit(LIMIT_WORKOUT),
      svc.from("member_health_samples").select(baseSelect).eq("member_email", memberEmail).eq("sample_type", "heart_rate").gte("start_at", startIso).order("start_at", {
        ascending: false
      }).limit(LIMIT_HR),
      svc.from("member_health_samples").select(baseSelect).eq("member_email", memberEmail).eq("sample_type", "weight").gte("start_at", startIso).order("start_at", {
        ascending: false
      }).limit(LIMIT_WEIGHT),
      svc.from("member_health_samples").select(baseSelect).eq("member_email", memberEmail).eq("sample_type", "sleep").gte("start_at", startIso).order("start_at", {
        ascending: false
      }).limit(LIMIT_SLEEP)
    ]);
    if (workoutRes.error) throw workoutRes.error;
    if (hrRes.error) throw hrRes.error;
    if (weightRes.error) throw weightRes.error;
    if (sleepRes.error) throw sleepRes.error;
    const workoutSamples = workoutRes.data || [];
    const hrSamples = hrRes.data || [];
    const weightSamples = weightRes.data || [];
    const sleepSamples = sleepRes.data || [];
    const samples = [
      ...workoutSamples,
      ...hrSamples,
      ...weightSamples,
      ...sleepSamples
    ];
    // Fetch daily aggregates (steps, distance, active_energy)
    const { data: dailyRaw, error: dailyErr } = await svc.from("member_health_daily").select("sample_type, date, value, unit").eq("member_email", memberEmail).gte("date", isoDate(startDate)).order("date", {
      ascending: false
    });
    if (dailyErr) throw dailyErr;
    const daily = dailyRaw || [];
    // ─── Workouts card ───
    const workouts = workoutSamples.map((s)=>{
      const start = new Date(s.start_at);
      const end = new Date(s.end_at);
      const durationMin = Math.max(1, Math.round((end.getTime() - start.getTime()) / 60000));
      const distM = s.metadata && typeof s.metadata === "object" ? Number(s.metadata.distance_m) || null : null;
      return {
        date: s.start_at,
        type: s.workout_type || "unknown",
        duration_min: durationMin,
        distance_km: distM ? Number((distM / 1000).toFixed(2)) : null,
        source_app: s.app_source || null,
        promoted_to: s.promoted_to || null
      };
    });
    // ─── Steps daily (from aggregated table) ───
    const stepsDaily = emptyDailyBuckets(startDate, endDate);
    for (const d of daily){
      if (d.sample_type !== "steps") continue;
      if (!stepsDaily[d.date]) stepsDaily[d.date] = {};
      stepsDaily[d.date].total = Number(d.value || 0);
    }
    // ─── Heart rate daily (from samples) ───
    const hrAgg = {};
    for (const s of hrSamples){
      const day = isoDate(new Date(s.start_at));
      const v = Number(s.value || 0);
      if (!hrAgg[day]) hrAgg[day] = {
        min: v,
        max: v,
        sum: v,
        n: 1
      };
      else {
        hrAgg[day].min = Math.min(hrAgg[day].min, v);
        hrAgg[day].max = Math.max(hrAgg[day].max, v);
        hrAgg[day].sum += v;
        hrAgg[day].n += 1;
      }
    }
    // ─── Active energy daily (from aggregated table) ───
    const kcalDaily = emptyDailyBuckets(startDate, endDate);
    for (const d of daily){
      if (d.sample_type !== "active_energy") continue;
      if (!kcalDaily[d.date]) kcalDaily[d.date] = {};
      kcalDaily[d.date].total = Number(d.value || 0);
    }
    // ─── Sleep nightly ───
    const sleepNightly = {};
    for (const s of sleepSamples){
      const start = new Date(s.start_at);
      const end = new Date(s.end_at);
      const mins = Math.max(0, (end.getTime() - start.getTime()) / 60000);
      const night = new Date(start);
      if (night.getUTCHours() < 12) night.setUTCDate(night.getUTCDate() - 1);
      const day = isoDate(night);
      if (!sleepNightly[day]) sleepNightly[day] = {
        asleep: 0,
        rem: 0,
        deep: 0,
        light: 0,
        awake: 0
      };
      const state = s.metadata && typeof s.metadata === "object" ? String(s.metadata.sleep_state || "").toLowerCase() : "";
      if (state.includes("rem")) sleepNightly[day].rem += mins;
      else if (state.includes("deep")) sleepNightly[day].deep += mins;
      else if (state.includes("core") || state.includes("light")) sleepNightly[day].light += mins;
      else if (state.includes("awake")) sleepNightly[day].awake += mins;
      else sleepNightly[day].asleep += mins;
    }
    // ─── Distance daily (from aggregated table, already in metres) ───
    const distDaily = emptyDailyBuckets(startDate, endDate);
    for (const d of daily){
      if (d.sample_type !== "distance") continue;
      if (!distDaily[d.date]) distDaily[d.date] = {};
      const v = Number(d.value || 0);
      const km = d.unit === "km" ? v : v / 1000;
      distDaily[d.date].total_km = km;
    }
    // ─── Weight ───
    const weightHkSamples = weightSamples.map((s)=>({
        date: isoDate(new Date(s.start_at)),
        at: s.start_at,
        kg: Number(s.value || 0),
        source_app: s.app_source || null,
        native_uuid: s.native_uuid || null
      }));
    const { data: wlRows } = await svc.from("weight_logs").select("logged_date, logged_at, weight_kg, native_uuid").eq("member_email", memberEmail).gte("logged_date", isoDate(startDate)).order("logged_date", {
      ascending: false
    });
    const weightLogs = (wlRows || []).map((r)=>({
        date: r.logged_date,
        at: r.logged_at,
        kg: Number(r.weight_kg),
        source_app: r.native_uuid ? "apple_health" : "vyve_manual",
        native_uuid: r.native_uuid || null
      }));
    // ─── Counts (diagnostic) ───
    const counts = {
      workout: workoutSamples.length,
      heart_rate: hrSamples.length,
      weight: weightSamples.length,
      sleep: sleepSamples.length,
      steps: 0,
      active_energy: 0,
      distance: 0
    };
    // For aggregated types: count = distinct days with data
    for (const d of daily){
      const t = d.sample_type;
      if (t in counts) counts[t]++;
    }
    return jsonResponse({
      ok: true,
      window: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        days: WINDOW_DAYS
      },
      connection,
      counts,
      total_samples_in_window: samples.length + daily.length,
      workouts,
      steps_daily: Object.entries(stepsDaily).map(([date, v])=>({
          date,
          total: v.total || 0
        })).sort((a, b)=>b.date.localeCompare(a.date)),
      heart_rate_daily: Object.entries(hrAgg).map(([date, v])=>({
          date,
          min: v.min,
          max: v.max,
          avg: Math.round(v.sum / v.n)
        })).sort((a, b)=>b.date.localeCompare(a.date)),
      active_energy_daily: Object.entries(kcalDaily).map(([date, v])=>({
          date,
          total: Math.round(v.total || 0)
        })).sort((a, b)=>b.date.localeCompare(a.date)),
      sleep_nightly: Object.entries(sleepNightly).map(([date, v])=>({
          date,
          total_min: Math.round(v.asleep + v.rem + v.deep + v.light),
          rem_min: Math.round(v.rem),
          deep_min: Math.round(v.deep),
          light_min: Math.round(v.light),
          awake_min: Math.round(v.awake),
          asleep_min: Math.round(v.asleep)
        })).sort((a, b)=>b.date.localeCompare(a.date)),
      distance_daily: Object.entries(distDaily).map(([date, v])=>({
          date,
          total_km: Number((v.total_km || 0).toFixed(2))
        })).sort((a, b)=>b.date.localeCompare(a.date)),
      weight_hk_samples: weightHkSamples,
      weight_logs: weightLogs
    });
  } catch (err) {
    console.error("get-health-data error", err);
    return jsonResponse({
      error: "internal_error",
      message: String(err?.message || err)
    }, 500);
  }
});
