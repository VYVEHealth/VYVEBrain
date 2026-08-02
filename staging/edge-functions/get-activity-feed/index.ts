// get-activity-feed v1
// 24 April 2026
// Unified personal activity feed for Exercise > Activity tab.
// Reverse-chrono merged workouts + cardio with HR overlay for HK-sourced rows.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "https://online.vyvehealth.co.uk",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Max-Age": "86400",
  "Vary": "Origin"
};
const MAX_LIMIT = 30;
const DEFAULT_LIMIT = 20;
function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json"
    }
  });
}
function humanize(raw, kind) {
  const norm = String(raw || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const map = {
    running: "Run",
    walking: "Walk",
    cycling: "Ride",
    hiking: "Hike",
    rowing: "Row",
    swimming: "Swim",
    strengthtraining: "Strength",
    functionalstrengthtraining: "Strength",
    traditionalstrengthtraining: "Strength",
    coretraining: "Core",
    pilates: "Pilates",
    yoga: "Yoga",
    hiit: "HIIT",
    highintensityintervaltraining: "HIIT",
    elliptical: "Elliptical",
    stairclimbing: "Stair climb"
  };
  if (map[norm]) return map[norm];
  if (!raw) return kind === "workout" ? "Workout" : "Cardio";
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}
Deno.serve(async (req)=>{
  if (req.method === "OPTIONS") return new Response(null, {
    status: 200,
    headers: CORS_HEADERS
  });
  if (req.method !== "POST") return json({
    error: "method_not_allowed"
  }, 405);
  const authHeader = req.headers.get("Authorization") || "";
  const jwt = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!jwt) return json({
    error: "unauthorized"
  }, 401);
  const svc = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
  const { data: userData, error: userErr } = await svc.auth.getUser(jwt);
  if (userErr || !userData?.user?.email) return json({
    error: "unauthorized"
  }, 401);
  const memberEmail = userData.user.email.toLowerCase();
  let body = {};
  try {
    body = await req.json();
  } catch  {}
  const before = body.before ? new Date(String(body.before)) : new Date();
  if (isNaN(before.getTime())) return json({
    error: "invalid_before"
  }, 400);
  let limit = Number(body.limit) || DEFAULT_LIMIT;
  if (limit > MAX_LIMIT) limit = MAX_LIMIT;
  if (limit < 1) limit = DEFAULT_LIMIT;
  try {
    const fetchLimit = limit * 2;
    const [wRes, cRes] = await Promise.all([
      svc.from("workouts").select("id, activity_date, workout_name, plan_name, duration_minutes, logged_at").eq("member_email", memberEmail).lt("logged_at", before.toISOString()).order("logged_at", {
        ascending: false
      }).limit(fetchLimit),
      svc.from("cardio").select("id, activity_date, cardio_type, duration_minutes, distance_km, logged_at").eq("member_email", memberEmail).lt("logged_at", before.toISOString()).order("logged_at", {
        ascending: false
      }).limit(fetchLimit)
    ]);
    if (wRes.error) throw wRes.error;
    if (cRes.error) throw cRes.error;
    const wRows = (wRes.data || []).map((r)=>({
        ...r,
        _src: "workouts"
      }));
    const cRows = (cRes.data || []).map((r)=>({
        ...r,
        _src: "cardio"
      }));
    const merged = [
      ...wRows,
      ...cRows
    ].filter((r)=>r.logged_at).sort((a, b)=>new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime()).slice(0, limit);
    const promotedIds = merged.map((r)=>r.id);
    const samplesByPromotedId = new Map();
    if (promotedIds.length > 0) {
      const { data: samplesData } = await svc.from("member_health_samples").select("id, promoted_to, promoted_id, app_source, native_uuid, workout_type, start_at, end_at").eq("member_email", memberEmail).in("promoted_id", promotedIds);
      for (const s of samplesData || []){
        if (s.promoted_id) samplesByPromotedId.set(s.promoted_id, s);
      }
    }
    const hrCandidates = merged.map((r, idx)=>({
        idx,
        sample: samplesByPromotedId.get(r.id)
      })).filter((c)=>c.sample && c.sample.start_at && c.sample.end_at);
    const hrByRowIdx = new Map();
    if (hrCandidates.length > 0) {
      const minStart = Math.min(...hrCandidates.map((c)=>new Date(c.sample.start_at).getTime()));
      const maxEnd = Math.max(...hrCandidates.map((c)=>new Date(c.sample.end_at).getTime()));
      if (isFinite(minStart) && isFinite(maxEnd)) {
        const { data: hrRows } = await svc.from("member_health_samples").select("start_at, end_at, value").eq("member_email", memberEmail).eq("sample_type", "heart_rate").gte("start_at", new Date(minStart).toISOString()).lte("end_at", new Date(maxEnd).toISOString()).limit(5000);
        const hr = hrRows || [];
        for (const c of hrCandidates){
          const wStart = new Date(c.sample.start_at).getTime();
          const wEnd = new Date(c.sample.end_at).getTime();
          const matches = hr.filter((h)=>{
            const hs = new Date(h.start_at).getTime();
            return hs >= wStart && hs <= wEnd;
          });
          if (matches.length >= 3) {
            const values = matches.map((h)=>Number(h.value || 0)).filter((v)=>v > 0);
            if (values.length === 0) continue;
            const avg = values.reduce((a, b)=>a + b, 0) / values.length;
            const max = Math.max(...values);
            hrByRowIdx.set(c.idx, {
              avg: Math.round(avg),
              max: Math.round(max)
            });
          }
        }
      }
    }
    const rows = merged.map((r, idx)=>{
      const sample = samplesByPromotedId.get(r.id);
      const sourceApp = sample?.app_source || null;
      const isHK = !!sample;
      const hr = hrByRowIdx.get(idx) || null;
      const rawType = sample?.workout_type || (r._src === "workouts" ? r.workout_name : r.cardio_type) || "";
      const typeDisplay = humanize(rawType, r._src === "workouts" ? "workout" : "cardio");
      return {
        id: r.id,
        source_table: r._src,
        occurred_at: r.logged_at,
        activity_date: r.activity_date,
        raw_type: rawType,
        type_display: typeDisplay,
        duration_minutes: r.duration_minutes,
        distance_km: r._src === "cardio" ? r.distance_km : null,
        pace_per_km: r._src === "cardio" && r.distance_km && r.duration_minutes ? Math.round(r.duration_minutes / r.distance_km * 60) : null,
        avg_hr: hr ? hr.avg : null,
        max_hr: hr ? hr.max : null,
        source_app: sourceApp,
        source_kind: isHK ? sourceApp && !/watch/i.test(sourceApp) ? "third_party" : "apple_watch" : "vyve",
        plan_name: r._src === "workouts" ? r.plan_name : null
      };
    });
    const nextBefore = rows.length === limit ? rows[rows.length - 1].occurred_at : null;
    return json({
      ok: true,
      rows,
      next_before: nextBefore
    });
  } catch (err) {
    console.error("get-activity-feed error", err);
    return json({
      error: "internal_error",
      message: String(err?.message || err)
    }, 500);
  }
});
