// sync-health-data v9
// 29 April 2026
// VYVE Health — HealthKit + Health Connect sync endpoint.
//
// v9 change vs v8: Don't advance last_sync_at when the client reports all probes
//   failed with "Authorization not determined". Previously the EF wrote
//   last_sync_at: nowIso unconditionally on every pull_samples call, even when
//   zero samples came back due to silent auth failure. This created a gap where
//   the next successful sync's incremental window started from an "auth-broken"
//   timestamp and missed the real data that landed in HK during the broken
//   window (Dean's run from 28 April 18:33 BST was in this gap).
//   Now: if diagnostics show all probes failed with auth-not-determined, we
//   write last_sync_status:'auth_blocked' but leave last_sync_at unchanged so
//   the next successful sync re-pulls from the genuine last good timestamp.
//
// v8 change: MAX_SAMPLE_AGE_DAYS bumped from 60 → 365 to support the
//   first-connect-from-join_date backfill.
// v7 change: Pure refactor — extracts workout-type taxonomy.
// v6 change: Stamp `source: 'healthkit'` / 'health_connect' on promoted rows.
// v5 change: Added `push_daily` action.
// v4 change: Persist client diagnostics from pull_samples body.
// v3 change: Weight upsert includes native_uuid.
// v2 change: Workout-type matching is taxonomy-agnostic.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { normWorkoutType, STRENGTH_CANON, CARDIO_CANON, IGNORED_CANON, YOGA_CANON, YOGA_STRENGTH_MIN_MINUTES, ALLOWED_DAILY_TYPES } from "./_shared/taxonomy.ts";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "https://online.vyvehealth.co.uk",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Max-Age": "86400",
  "Vary": "Origin"
};
const MAX_SAMPLES_PER_CALL = 500;
const MAX_DAILY_PER_CALL = 200;
const MAX_SAMPLE_AGE_DAYS = 365;
const OUTLIER = {
  steps_per_day: 200_000,
  workout_seconds: 12 * 60 * 60,
  weight_kg_min: 20,
  weight_kg_max: 400,
  heart_rate_bpm_max: 250,
  distance_per_event_km: 300
};
function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json"
    }
  });
}
function dayOfWeek(d) {
  return [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"
  ][d.getUTCDay()];
}
function timeOfDay(d) {
  const h = d.getUTCHours();
  if (h < 5) return "night";
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  if (h < 21) return "evening";
  return "night";
}
function isoDate(d) {
  return d.toISOString().slice(0, 10);
}
function platformSourceTag(platform) {
  return platform === "health_connect" ? "health_connect" : "healthkit";
}
// v9: detect the all-probes-failed-with-auth-not-determined pattern from client diagnostics.
// When true, we should NOT advance last_sync_at, only mark status. This preserves the
// last good timestamp so the next successful sync's incremental window covers the gap.
function diagnosticsShowAuthBlocked(diag) {
  if (!diag || typeof diag !== "object") return false;
  const probes = [];
  if (diag.queryWorkouts) probes.push(diag.queryWorkouts);
  if (diag.readSamples && typeof diag.readSamples === "object") {
    for(const k in diag.readSamples)probes.push(diag.readSamples[k]);
  }
  if (diag.queryAggregated && typeof diag.queryAggregated === "object") {
    for(const k in diag.queryAggregated)probes.push(diag.queryAggregated[k]);
  }
  if (probes.length === 0) return false;
  return probes.every((p)=>p && p.ok === false && /Authorization not determined/i.test(String(p.error || "")));
}
async function passesOutlierCheck(sample, memberEmail, svc) {
  const t = sample.sample_type;
  const v = Number(sample.value ?? 0);
  const start = new Date(String(sample.start_at));
  const end = new Date(String(sample.end_at));
  const durationSec = Math.max(0, (end.getTime() - start.getTime()) / 1000);
  let reason = null;
  if (t === "workout" && durationSec > OUTLIER.workout_seconds) reason = `workout duration ${durationSec}s exceeds ${OUTLIER.workout_seconds}s`;
  else if (t === "steps" && v > OUTLIER.steps_per_day) reason = `steps value ${v} exceeds ${OUTLIER.steps_per_day}`;
  else if (t === "weight" && (v < OUTLIER.weight_kg_min || v > OUTLIER.weight_kg_max)) reason = `weight ${v}kg outside [${OUTLIER.weight_kg_min}, ${OUTLIER.weight_kg_max}]`;
  else if (t === "heart_rate" && v > OUTLIER.heart_rate_bpm_max) reason = `heart rate ${v}bpm exceeds ${OUTLIER.heart_rate_bpm_max}`;
  else if (t === "distance") {
    const km = sample.unit === "km" ? v : v / 1000;
    if (km > OUTLIER.distance_per_event_km) reason = `distance ${km}km exceeds ${OUTLIER.distance_per_event_km}km`;
  }
  if (reason) {
    try {
      await svc.from("platform_alerts").insert({
        member_email: memberEmail,
        severity: "warning",
        source: "sync-health-data",
        type: "outlier_sample_rejected",
        details: `${reason}; native_uuid=${sample.native_uuid} | sample=${JSON.stringify(sample).slice(0, 800)}`
      });
    } catch (_) {}
    return false;
  }
  return true;
}
function promoteMapping(sample, memberEmail, sourceTag) {
  const t = sample.sample_type;
  const start = new Date(String(sample.start_at));
  const end = new Date(String(sample.end_at));
  const durationMin = Math.max(1, Math.round((end.getTime() - start.getTime()) / 60000));
  if (t === "weight") {
    const weightKg = Number(sample.value);
    const kg = sample.unit === "lb" ? weightKg * 0.453592 : weightKg;
    return {
      target: "weight_logs",
      row: {
        member_email: memberEmail,
        logged_date: isoDate(start),
        weight_kg: Number(kg.toFixed(2)),
        logged_at: start.toISOString(),
        native_uuid: sample.native_uuid
      }
    };
  }
  if (t === "workout") {
    const wtRaw = sample.workout_type ?? "";
    const wtCanon = normWorkoutType(wtRaw);
    if (!wtCanon) return null;
    if (IGNORED_CANON.has(wtCanon)) return null;
    const isYoga = wtCanon === YOGA_CANON;
    const isStrength = STRENGTH_CANON.has(wtCanon) || isYoga && durationMin >= YOGA_STRENGTH_MIN_MINUTES;
    const isCardio = CARDIO_CANON.has(wtCanon);
    if (isStrength) {
      return {
        target: "workouts",
        row: {
          member_email: memberEmail,
          activity_date: isoDate(start),
          day_of_week: dayOfWeek(start),
          time_of_day: timeOfDay(start),
          session_number: 1,
          plan_name: null,
          workout_name: wtRaw || "Workout",
          duration_minutes: durationMin,
          logged_at: start.toISOString(),
          source: sourceTag
        }
      };
    }
    if (isCardio) {
      const cardioType = wtCanon;
      const distanceM = Number(sample.metadata && sample.metadata.distance_m) || null;
      return {
        target: "cardio",
        row: {
          member_email: memberEmail,
          activity_date: isoDate(start),
          day_of_week: dayOfWeek(start),
          time_of_day: timeOfDay(start),
          session_number: 1,
          cardio_type: cardioType,
          duration_minutes: durationMin,
          distance_km: distanceM ? Number((distanceM / 1000).toFixed(2)) : null,
          logged_at: start.toISOString(),
          source: sourceTag
        }
      };
    }
    return null;
  }
  return null;
}
Deno.serve(async (req)=>{
  if (req.method === "OPTIONS") return new Response(null, {
    status: 200,
    headers: CORS_HEADERS
  });
  if (req.method !== "POST") return jsonResponse({
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
  let body;
  try {
    body = await req.json();
  } catch  {
    return jsonResponse({
      error: "invalid_json"
    }, 400);
  }
  const action = String(body.action || "pull_samples");
  try {
    if (action === "pull_samples") return await handlePullSamples(body, memberEmail, svc);
    if (action === "push_daily") return await handlePushDaily(body, memberEmail, svc);
    if (action === "confirm_write") return await handleConfirmWrite(body, memberEmail, svc);
    if (action === "mark_revoked") return await handleMarkRevoked(body, memberEmail, svc);
    return jsonResponse({
      error: "unknown_action",
      action
    }, 400);
  } catch (err) {
    console.error("sync-health-data error", err);
    try {
      await svc.from("platform_alerts").insert({
        member_email: memberEmail,
        severity: "error",
        source: "sync-health-data",
        type: "handler_exception",
        details: String(err?.message || err).slice(0, 500)
      });
    } catch (_) {}
    return jsonResponse({
      error: "internal_error"
    }, 500);
  }
});
async function handlePushDaily(body, memberEmail, svc) {
  const platform = String(body.platform || "");
  if (![
    "healthkit",
    "health_connect"
  ].includes(platform)) return jsonResponse({
    error: "invalid_platform"
  }, 400);
  const dailyIn = Array.isArray(body.daily) ? body.daily : [];
  if (dailyIn.length > MAX_DAILY_PER_CALL) return jsonResponse({
    error: "batch_too_large",
    limit: MAX_DAILY_PER_CALL
  }, 413);
  const cutoff = new Date(Date.now() - MAX_SAMPLE_AGE_DAYS * 86400_000);
  const toUpsert = [];
  const skipped = {
    invalid: 0,
    too_old: 0,
    bad_type: 0,
    bad_value: 0
  };
  for (const d of dailyIn){
    if (!d || !d.sample_type || !d.date || d.value == null) {
      skipped.invalid++;
      continue;
    }
    const t = String(d.sample_type);
    if (!ALLOWED_DAILY_TYPES.has(t)) {
      skipped.bad_type++;
      continue;
    }
    const date = String(d.date);
    const dObj = new Date(date + "T00:00:00Z");
    if (isNaN(dObj.getTime())) {
      skipped.invalid++;
      continue;
    }
    if (dObj < cutoff) {
      skipped.too_old++;
      continue;
    }
    const v = Number(d.value);
    if (!isFinite(v) || v < 0) {
      skipped.bad_value++;
      continue;
    }
    if (t === "steps" && v > OUTLIER.steps_per_day) {
      skipped.bad_value++;
      continue;
    }
    toUpsert.push({
      member_email: memberEmail,
      source: platform,
      sample_type: t,
      date,
      value: Number(v.toFixed(3)),
      unit: d.unit ? String(d.unit) : null
    });
  }
  let upserted = 0;
  if (toUpsert.length > 0) {
    const { data, error } = await svc.from("member_health_daily").upsert(toUpsert, {
      onConflict: "member_email,source,sample_type,date"
    }).select("member_email");
    if (error) throw error;
    upserted = data ? data.length : 0;
  }
  return jsonResponse({
    ok: true,
    upserted,
    skipped
  });
}
async function handlePullSamples(body, memberEmail, svc) {
  const platform = String(body.platform || "");
  if (![
    "healthkit",
    "health_connect"
  ].includes(platform)) return jsonResponse({
    error: "invalid_platform"
  }, 400);
  const sourceTag = platformSourceTag(platform);
  const samplesIn = Array.isArray(body.samples) ? body.samples : [];
  if (samplesIn.length > MAX_SAMPLES_PER_CALL) return jsonResponse({
    error: "batch_too_large",
    limit: MAX_SAMPLES_PER_CALL
  }, 413);
  const grantedScopes = Array.isArray(body.granted_scopes) ? body.granted_scopes : [];
  // v9: detect auth-blocked sync from client diagnostics
  const isAuthBlocked = diagnosticsShowAuthBlocked(body.diagnostics);
  if (body.diagnostics && typeof body.diagnostics === "object") {
    try {
      await svc.from("platform_alerts").insert({
        member_email: memberEmail,
        severity: "info",
        source: "sync-health-data",
        type: "client_diagnostics",
        details: JSON.stringify(body.diagnostics).slice(0, 4000)
      });
    } catch (_) {}
  }
  const nowIso = new Date().toISOString();
  // v9: Only advance last_sync_at when the sync wasn't auth-blocked. Auth-blocked syncs
  // get last_sync_status:'auth_blocked' but leave last_sync_at unchanged so the next
  // successful sync's incremental window starts from the genuine last good timestamp.
  if (isAuthBlocked) {
    await svc.from("member_health_connections").upsert({
      member_email: memberEmail,
      platform,
      granted_scopes: grantedScopes,
      last_sync_status: "auth_blocked",
      revoked_at: null
    }, {
      onConflict: "member_email,platform"
    });
  } else {
    await svc.from("member_health_connections").upsert({
      member_email: memberEmail,
      platform,
      granted_scopes: grantedScopes,
      last_sync_at: nowIso,
      last_sync_status: "ok",
      revoked_at: null
    }, {
      onConflict: "member_email,platform"
    });
  }
  const { data: ledgerRows } = await svc.from("member_health_write_ledger").select("native_uuid").eq("member_email", memberEmail).eq("platform", platform).eq("write_status", "confirmed").not("native_uuid", "is", null);
  const writtenByVyve = new Set((ledgerRows || []).map((r)=>r.native_uuid));
  const cutoff = new Date(Date.now() - MAX_SAMPLE_AGE_DAYS * 86400_000);
  const toInsert = [];
  const skipped = {
    too_old: 0,
    shadow_read: 0,
    outlier: 0,
    invalid: 0
  };
  for (const s of samplesIn){
    try {
      if (!s.native_uuid || !s.sample_type || !s.start_at || !s.end_at) {
        skipped.invalid++;
        continue;
      }
      if (new Date(String(s.start_at)) < cutoff) {
        skipped.too_old++;
        continue;
      }
      if (writtenByVyve.has(String(s.native_uuid))) {
        skipped.shadow_read++;
        continue;
      }
      const ok = await passesOutlierCheck(s, memberEmail, svc);
      if (!ok) {
        skipped.outlier++;
        continue;
      }
      toInsert.push({
        member_email: memberEmail,
        source: platform,
        sample_type: s.sample_type,
        native_uuid: s.native_uuid,
        start_at: s.start_at,
        end_at: s.end_at,
        value: s.value ?? null,
        unit: s.unit ?? null,
        workout_type: s.workout_type ?? null,
        metadata: s.metadata ?? {},
        app_source: s.app_source ?? null
      });
    } catch (_) {
      skipped.invalid++;
    }
  }
  let insertedSamples = [];
  if (toInsert.length > 0) {
    const { data, error } = await svc.from("member_health_samples").upsert(toInsert, {
      onConflict: "member_email,source,native_uuid",
      ignoreDuplicates: true
    }).select("id, sample_type, workout_type, start_at, end_at, value, unit, metadata, native_uuid");
    if (error) throw error;
    insertedSamples = data ?? [];
  }
  const promoted = {
    workouts: 0,
    cardio: 0,
    weight_logs: 0,
    skipped_cap: 0
  };
  for (const s of insertedSamples){
    const m = promoteMapping(s, memberEmail, sourceTag);
    if (!m) continue;
    if (m.target === "weight_logs") {
      const { data, error } = await svc.from("weight_logs").upsert(m.row, {
        onConflict: "member_email,logged_date"
      }).select("id");
      if (!error && data && data.length > 0) {
        promoted.weight_logs++;
        await svc.from("member_health_samples").update({
          promoted_to: "weight_logs",
          promoted_id: data[0].id
        }).eq("id", s.id);
      }
    } else {
      const { data, error } = await svc.from(m.target).insert(m.row).select("id");
      if (error) promoted.skipped_cap++;
      else if (data && data.length > 0) {
        promoted[m.target]++;
        await svc.from("member_health_samples").update({
          promoted_to: m.target,
          promoted_id: data[0].id
        }).eq("id", s.id);
      }
    }
  }
  const { data: pendingWrites } = await svc.from("member_health_write_ledger").select("id, vyve_source_table, vyve_source_id, queued_at").eq("member_email", memberEmail).eq("platform", platform).eq("write_status", "queued").order("queued_at", {
    ascending: true
  }).limit(50);
  const pendingPayloads = [];
  for (const row of pendingWrites || []){
    const tgt = row.vyve_source_table;
    const { data: src } = await svc.from(tgt).select("*").eq("id", row.vyve_source_id).maybeSingle();
    if (src) pendingPayloads.push({
      ledger_id: row.id,
      vyve_source_table: tgt,
      payload: src
    });
  }
  await svc.from("member_health_connections").update({
    total_synced: (insertedSamples.length || 0) + 0
  }).eq("member_email", memberEmail).eq("platform", platform);
  return jsonResponse({
    ok: true,
    inserted_raw: insertedSamples.length,
    skipped,
    promoted,
    pending_writes: pendingPayloads,
    server_last_sync_at: isAuthBlocked ? null : nowIso,
    auth_blocked: isAuthBlocked
  });
}
async function handleConfirmWrite(body, memberEmail, svc) {
  const ledgerId = String(body.ledger_id || "");
  const nativeUuid = body.native_uuid ? String(body.native_uuid) : null;
  const errorMsg = body.error_message ? String(body.error_message) : null;
  if (!ledgerId) return jsonResponse({
    error: "ledger_id_required"
  }, 400);
  const status = errorMsg ? "failed" : "confirmed";
  const { data, error } = await svc.from("member_health_write_ledger").update({
    native_uuid: nativeUuid,
    write_status: status,
    confirmed_at: new Date().toISOString(),
    error_message: errorMsg
  }).eq("id", ledgerId).eq("member_email", memberEmail).select("id");
  if (error) throw error;
  if (!data || data.length === 0) return jsonResponse({
    error: "ledger_not_found"
  }, 404);
  return jsonResponse({
    ok: true,
    ledger_id: ledgerId,
    status
  });
}
async function handleMarkRevoked(body, memberEmail, svc) {
  const platform = String(body.platform || "");
  if (![
    "healthkit",
    "health_connect"
  ].includes(platform)) return jsonResponse({
    error: "invalid_platform"
  }, 400);
  const { error } = await svc.from("member_health_connections").update({
    revoked_at: new Date().toISOString(),
    last_sync_status: "revoked"
  }).eq("member_email", memberEmail).eq("platform", platform);
  if (error) throw error;
  return jsonResponse({
    ok: true,
    platform
  });
}
