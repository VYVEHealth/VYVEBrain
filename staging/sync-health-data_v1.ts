
// sync-health-data v1
// 23 April 2026
// VYVE Health — HealthKit + Health Connect sync endpoint.
//
// Three actions:
//   - pull_samples:   client POSTs health samples, server dedups + promotes to workouts/cardio/weight_logs
//   - confirm_write:  client confirms it wrote a ledger entry to the native store (records native_uuid)
//   - mark_revoked:   client signals the user revoked permissions for a platform
//
// Auth: verify_jwt=false at platform level; this EF does internal JWT validation via supabase.auth.getUser().
// CORS: restricted to online.vyvehealth.co.uk.
// Writes to members-scoped tables use service_role (bypasses RLS).
// Reads use user JWT where possible to preserve audit.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "https://online.vyvehealth.co.uk",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Max-Age": "86400",
  "Vary": "Origin",
};

// ─────────────────────────────────────────────────────────────────────────────
// Guardrail constants
// ─────────────────────────────────────────────────────────────────────────────
const MAX_SAMPLES_PER_CALL = 500;
const MAX_SAMPLE_AGE_DAYS = 60;

// Outlier rejection thresholds (log to platform_alerts, skip insert)
const OUTLIER = {
  steps_per_day: 200_000,
  workout_seconds: 12 * 60 * 60,         // 12 hours
  weight_kg_min: 20,
  weight_kg_max: 400,
  heart_rate_bpm_max: 250,
  distance_per_event_km: 300,             // ultramarathon upper bound
};

// HealthKit/Health Connect workout type → VYVE bucket
const WORKOUT_TO_STRENGTH = new Set([
  "FunctionalStrengthTraining","TraditionalStrengthTraining","CoreTraining",
  "Pilates","CrossTraining",
  "STRENGTH_TRAINING","PILATES","CORE_TRAINING","CALISTHENICS", // HC variants
]);
const WORKOUT_TO_CARDIO = new Set([
  "Running","Cycling","Walking","Hiking","Rowing","Swimming",
  "HighIntensityIntervalTraining","Elliptical","StairClimbing","MixedCardio",
  "RUNNING","CYCLING","WALKING","HIKING","ROWING","SWIMMING","HIIT","HIGH_INTENSITY_INTERVAL_TRAINING", // HC variants
]);
// Yoga: strength if long, ignored if short (treat as mobility)
const YOGA_STRENGTH_MIN_MINUTES = 30;

// HealthKit workout types we ignore in v1 (mobility, leisure sports, too broad)
const WORKOUT_IGNORED = new Set([
  "MindAndBody","Dance","Golf","Baseball","Basketball","AmericanFootball",
  "Soccer","Tennis","Racquetball","TableTennis","Badminton","Squash","Cricket",
  "Bowling","Climbing","Surfing","WaterFitness","WaterPolo","WaterSports",
  "Gymnastics","Martial Arts","TrackAndField","Volleyball","Skating","Snowboarding",
  "Skiing","DownhillSkiing","CrossCountrySkiing","Hockey","Handball","Rugby",
  "Archery","Equestrian","Fishing","Hunting","Lacrosse","MountainBiking",
  "PaddleSports","Play","PreparationAndRecovery","Sailing","Wrestling","Other",
]);

// ─────────────────────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────────────────────
function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

function daysBetween(a: Date, b: Date): number {
  return Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

function dayOfWeek(d: Date): string {
  return ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][d.getUTCDay()];
}

function timeOfDay(d: Date): string {
  const h = d.getUTCHours();
  if (h < 5)  return "night";
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  if (h < 21) return "evening";
  return "night";
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// ─────────────────────────────────────────────────────────────────────────────
// Outlier gate. Returns `true` if sample should be inserted; logs to platform_alerts and returns false otherwise.
// ─────────────────────────────────────────────────────────────────────────────
async function passesOutlierCheck(
  sample: Record<string, unknown>,
  memberEmail: string,
  svc: ReturnType<typeof createClient>,
): Promise<boolean> {
  const t = sample.sample_type as string;
  const v = Number(sample.value ?? 0);
  const start = new Date(String(sample.start_at));
  const end = new Date(String(sample.end_at));
  const durationSec = Math.max(0, (end.getTime() - start.getTime()) / 1000);

  let reason: string | null = null;

  if (t === "workout" && durationSec > OUTLIER.workout_seconds) {
    reason = `workout duration ${durationSec}s exceeds ${OUTLIER.workout_seconds}s`;
  } else if (t === "steps" && v > OUTLIER.steps_per_day) {
    reason = `steps value ${v} exceeds ${OUTLIER.steps_per_day}`;
  } else if (t === "weight" && (v < OUTLIER.weight_kg_min || v > OUTLIER.weight_kg_max)) {
    reason = `weight ${v}kg outside [${OUTLIER.weight_kg_min}, ${OUTLIER.weight_kg_max}]`;
  } else if (t === "heart_rate" && v > OUTLIER.heart_rate_bpm_max) {
    reason = `heart rate ${v}bpm exceeds ${OUTLIER.heart_rate_bpm_max}`;
  } else if (t === "distance") {
    const km = (sample.unit === "km") ? v : v / 1000;
    if (km > OUTLIER.distance_per_event_km) {
      reason = `distance ${km}km exceeds ${OUTLIER.distance_per_event_km}km`;
    }
  }

  if (reason) {
    try {
      await svc.from("platform_alerts").insert({
        member_email: memberEmail,
        severity: "warning",
        source: "sync-health-data",
        type: "outlier_sample_rejected",
        details: `${reason}; native_uuid=${sample.native_uuid} | sample=${JSON.stringify(sample).slice(0, 800)}`,
      });
    } catch (_) { /* never fail sync on logging error */ }
    return false;
  }
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// Promotion: pure mapping. Returns {target, row} or null if the sample should stay raw.
// ─────────────────────────────────────────────────────────────────────────────
function promoteMapping(sample: Record<string, unknown>, memberEmail: string): {
  target: "workouts" | "cardio" | "weight_logs";
  row: Record<string, unknown>;
} | null {
  const t = sample.sample_type as string;
  const start = new Date(String(sample.start_at));
  const end = new Date(String(sample.end_at));
  const durationMin = Math.max(1, Math.round((end.getTime() - start.getTime()) / 60000));

  if (t === "weight") {
    const weightKg = Number(sample.value);
    // Normalize unit: HK gives kg; some sources may give lb
    const kg = sample.unit === "lb" ? weightKg * 0.453592 : weightKg;
    return {
      target: "weight_logs",
      row: {
        member_email: memberEmail,
        logged_date: isoDate(start),
        weight_kg: Number(kg.toFixed(2)),
        logged_at: start.toISOString(),
      },
    };
  }

  if (t === "workout") {
    const wt = (sample.workout_type as string) ?? "";
    if (WORKOUT_IGNORED.has(wt)) return null;

    const isYoga = wt === "Yoga" || wt === "YOGA";
    const isStrength = WORKOUT_TO_STRENGTH.has(wt) || (isYoga && durationMin >= YOGA_STRENGTH_MIN_MINUTES);
    const isCardio = WORKOUT_TO_CARDIO.has(wt);

    if (isStrength) {
      return {
        target: "workouts",
        row: {
          member_email: memberEmail,
          activity_date: isoDate(start),
          day_of_week: dayOfWeek(start),
          time_of_day: timeOfDay(start),
          session_number: 1,                  // HK workouts are standalone; not tied to a programme session
          plan_name: null,
          workout_name: wt || "Workout",
          duration_minutes: durationMin,
          logged_at: start.toISOString(),
        },
      };
    }
    if (isCardio) {
      const cardioType = wt.toLowerCase();
      const distanceM = Number(sample.metadata && (sample.metadata as any).distance_m) || null;
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
        },
      };
    }
    // Unknown workout type → don't promote, keep raw
    return null;
  }

  // steps, heart_rate, active_energy, sleep, distance — all raw-only in v1
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main handler
// ─────────────────────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: CORS_HEADERS });
  if (req.method !== "POST") return jsonResponse({ error: "method_not_allowed" }, 405);

  // Extract JWT
  const authHeader = req.headers.get("Authorization") || "";
  const jwt = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!jwt) return jsonResponse({ error: "unauthorized" }, 401);

  // Verify via service-role client (getUser accepts raw JWT)
  const svc = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error: userErr } = await svc.auth.getUser(jwt);
  if (userErr || !userData?.user?.email) return jsonResponse({ error: "unauthorized" }, 401);
  const memberEmail = userData.user.email.toLowerCase();

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return jsonResponse({ error: "invalid_json" }, 400); }

  const action = String(body.action || "pull_samples");

  try {
    if (action === "pull_samples")   return await handlePullSamples(body, memberEmail, svc);
    if (action === "confirm_write")  return await handleConfirmWrite(body, memberEmail, svc);
    if (action === "mark_revoked")   return await handleMarkRevoked(body, memberEmail, svc);
    return jsonResponse({ error: "unknown_action", action }, 400);
  } catch (err) {
    console.error("sync-health-data error", err);
    try {
      await svc.from("platform_alerts").insert({
        member_email: memberEmail,
        severity: "error",
        source: "sync-health-data",
        type: "handler_exception",
        details: String(err?.message || err).slice(0, 500),
      });
    } catch (_) { /* swallow */ }
    return jsonResponse({ error: "internal_error" }, 500);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Handler: pull_samples
// ─────────────────────────────────────────────────────────────────────────────
async function handlePullSamples(
  body: Record<string, unknown>,
  memberEmail: string,
  svc: ReturnType<typeof createClient>,
): Promise<Response> {
  const platform = String(body.platform || "");
  if (!["healthkit","health_connect"].includes(platform)) {
    return jsonResponse({ error: "invalid_platform" }, 400);
  }

  const samplesIn = Array.isArray(body.samples) ? body.samples as Record<string, unknown>[] : [];
  if (samplesIn.length > MAX_SAMPLES_PER_CALL) {
    return jsonResponse({ error: "batch_too_large", limit: MAX_SAMPLES_PER_CALL }, 413);
  }

  const grantedScopes = Array.isArray(body.granted_scopes) ? body.granted_scopes as string[] : [];

  // Upsert the connection row (bumps last_sync_at)
  const nowIso = new Date().toISOString();
  await svc.from("member_health_connections")
    .upsert({
      member_email: memberEmail,
      platform,
      granted_scopes: grantedScopes,
      last_sync_at: nowIso,
      last_sync_status: "ok",
      revoked_at: null,
    }, { onConflict: "member_email,platform" });

  // Fetch native UUIDs of confirmed writes for this member+platform — used to filter shadow-reads
  const { data: ledgerRows } = await svc
    .from("member_health_write_ledger")
    .select("native_uuid")
    .eq("member_email", memberEmail)
    .eq("platform", platform)
    .eq("write_status", "confirmed")
    .not("native_uuid", "is", null);
  const writtenByVyve = new Set((ledgerRows || []).map((r: any) => r.native_uuid));

  // Filter + normalise samples
  const cutoff = new Date(Date.now() - MAX_SAMPLE_AGE_DAYS * 86400_000);
  const toInsert: Record<string, unknown>[] = [];
  const skipped = { too_old: 0, shadow_read: 0, outlier: 0, invalid: 0 };

  for (const s of samplesIn) {
    try {
      if (!s.native_uuid || !s.sample_type || !s.start_at || !s.end_at) {
        skipped.invalid++; continue;
      }
      if (new Date(String(s.start_at)) < cutoff) { skipped.too_old++; continue; }
      if (writtenByVyve.has(String(s.native_uuid))) { skipped.shadow_read++; continue; }
      const ok = await passesOutlierCheck(s, memberEmail, svc);
      if (!ok) { skipped.outlier++; continue; }
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
        app_source: s.app_source ?? null,
      });
    } catch (_) { skipped.invalid++; }
  }

  // Batch insert; existing (member_email, source, native_uuid) rows silently dropped via ON CONFLICT
  let insertedSamples: Record<string, unknown>[] = [];
  if (toInsert.length > 0) {
    const { data, error } = await svc
      .from("member_health_samples")
      .upsert(toInsert, { onConflict: "member_email,source,native_uuid", ignoreDuplicates: true })
      .select("id, sample_type, workout_type, start_at, end_at, value, unit, metadata, native_uuid");
    if (error) throw error;
    insertedSamples = data ?? [];
  }

  // Promote newly-inserted samples
  const promoted = { workouts: 0, cardio: 0, weight_logs: 0, skipped_cap: 0 };
  for (const s of insertedSamples) {
    const m = promoteMapping(s, memberEmail);
    if (!m) continue;

    if (m.target === "weight_logs") {
      const { data, error } = await svc
        .from("weight_logs")
        .upsert(m.row, { onConflict: "member_email,logged_date" })
        .select("id");
      if (!error && data && data.length > 0) {
        promoted.weight_logs++;
        await svc.from("member_health_samples").update({
          promoted_to: "weight_logs", promoted_id: data[0].id,
        }).eq("id", (s as any).id);
      }
    } else {
      // workouts or cardio — insert; cap trigger may reject with custom SQLSTATE
      const { data, error } = await svc
        .from(m.target)
        .insert(m.row)
        .select("id");
      if (error) {
        // Cap trigger routes to activity_dedupe — we count it
        promoted.skipped_cap++;
      } else if (data && data.length > 0) {
        promoted[m.target]++;
        await svc.from("member_health_samples").update({
          promoted_to: m.target, promoted_id: data[0].id,
        }).eq("id", (s as any).id);
      }
    }
  }

  // Look up pending write-ledger entries for this member+platform that the client needs to flush
  const { data: pendingWrites } = await svc
    .from("member_health_write_ledger")
    .select("id, vyve_source_table, vyve_source_id, queued_at")
    .eq("member_email", memberEmail)
    .eq("platform", platform)
    .eq("write_status", "queued")
    .order("queued_at", { ascending: true })
    .limit(50);

  // Hydrate the payloads for each pending write
  const pendingPayloads: Record<string, unknown>[] = [];
  for (const row of pendingWrites || []) {
    const tgt = row.vyve_source_table as string;
    const { data: src } = await svc.from(tgt).select("*").eq("id", row.vyve_source_id).maybeSingle();
    if (src) pendingPayloads.push({
      ledger_id: row.id,
      vyve_source_table: tgt,
      payload: src,
    });
  }

  // Bump connection totals
  await svc.from("member_health_connections")
    .update({ total_synced: (insertedSamples.length || 0) + 0 })
    .eq("member_email", memberEmail)
    .eq("platform", platform);

  return jsonResponse({
    ok: true,
    inserted_raw: insertedSamples.length,
    skipped,
    promoted,
    pending_writes: pendingPayloads,
    server_last_sync_at: nowIso,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Handler: confirm_write
// ─────────────────────────────────────────────────────────────────────────────
async function handleConfirmWrite(
  body: Record<string, unknown>,
  memberEmail: string,
  svc: ReturnType<typeof createClient>,
): Promise<Response> {
  const ledgerId = String(body.ledger_id || "");
  const nativeUuid = body.native_uuid ? String(body.native_uuid) : null;
  const errorMsg = body.error_message ? String(body.error_message) : null;

  if (!ledgerId) return jsonResponse({ error: "ledger_id_required" }, 400);

  const status = errorMsg ? "failed" : "confirmed";
  const { data, error } = await svc
    .from("member_health_write_ledger")
    .update({
      native_uuid: nativeUuid,
      write_status: status,
      confirmed_at: new Date().toISOString(),
      error_message: errorMsg,
    })
    .eq("id", ledgerId)
    .eq("member_email", memberEmail)     // defence-in-depth: only the owner can confirm
    .select("id");

  if (error) throw error;
  if (!data || data.length === 0) return jsonResponse({ error: "ledger_not_found" }, 404);

  return jsonResponse({ ok: true, ledger_id: ledgerId, status });
}

// ─────────────────────────────────────────────────────────────────────────────
// Handler: mark_revoked
// ─────────────────────────────────────────────────────────────────────────────
async function handleMarkRevoked(
  body: Record<string, unknown>,
  memberEmail: string,
  svc: ReturnType<typeof createClient>,
): Promise<Response> {
  const platform = String(body.platform || "");
  if (!["healthkit","health_connect"].includes(platform)) {
    return jsonResponse({ error: "invalid_platform" }, 400);
  }

  const { error } = await svc
    .from("member_health_connections")
    .update({
      revoked_at: new Date().toISOString(),
      last_sync_status: "revoked",
    })
    .eq("member_email", memberEmail)
    .eq("platform", platform);

  if (error) throw error;
  return jsonResponse({ ok: true, platform });
}
