// PM-1239 — run-engine Edge Function (Wave 0, server only, no member surface).
// Self-contained per §23.79: the engine module is inlined, not imported.
// Actions: health | profile | build | persist.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

// PM-1239 — running rebuild Wave 0 pace + plan engine.
// PURE FUNCTIONS ONLY. No Date.now(), no randomness, no I/O in this file.
// Distances in metres, durations in seconds, paces in seconds per kilometre.

export const ENGINE_VERSION = "run-engine@0.1.0";

export type Band = "easy" | "long" | "threshold" | "interval" | "rep";
export type VolumeKnob = "low" | "steady" | "high";
export type DifficultyKnob = "gentle" | "balanced" | "hard";

export interface RaceInput {
  distance_m: number;
  time_s: number;
}

export interface PaceRange {
  // min = faster bound, max = slower bound (seconds per km)
  min_s_per_km: number;
  max_s_per_km: number;
}

export type Bands = Record<Band, PaceRange>;

export interface Profile {
  fitness_score: number; // VDOT-class
  bands: Bands;
  equivalents: Record<string, number>; // predicted race times in seconds
  confidence: "low" | "medium" | "high";
}

// ---------------------------------------------------------------- maths

const round = (n: number, dp = 0) => {
  const f = Math.pow(10, dp);
  return Math.round(n * f) / f;
};

/** Riegel endurance model: predicted time over d2 from a known d1/t1. */
export function riegel(d1: number, t1: number, d2: number, exp = 1.06): number {
  return t1 * Math.pow(d2 / d1, exp);
}

/** Daniels-class VO2 / VDOT from a race performance. */
export function vdotFromRace(distance_m: number, time_s: number): number {
  const tMin = time_s / 60;
  const v = distance_m / tMin; // m/min
  const vo2 = -4.6 + 0.182258 * v + 0.000104 * v * v;
  const pct = 0.8 +
    0.1894393 * Math.exp(-0.012778 * tMin) +
    0.2989558 * Math.exp(-0.1932605 * tMin);
  return vo2 / pct;
}

/** Inverse of the VO2 polynomial: velocity (m/min) sustaining a given VO2. */
export function velocityForVo2(vo2: number): number {
  const a = 0.000104, b = 0.182258, c = -4.6 - vo2;
  return (-b + Math.sqrt(b * b - 4 * a * c)) / (2 * a);
}

const secPerKm = (vMetresPerMin: number) => 60000 / vMetresPerMin;

// Fractions of velocity at VDOT. Fast bound first.
const BAND_FRACTIONS: Record<Band, [number, number]> = {
  easy: [0.72, 0.62],
  long: [0.70, 0.60],
  threshold: [0.88, 0.83],
  interval: [1.00, 0.95],
  rep: [1.06, 1.02],
};

const DIFFICULTY_FACTOR: Record<DifficultyKnob, number> = {
  gentle: 0.98,
  balanced: 1.0,
  hard: 1.02,
};

export const VOLUME_FACTOR: Record<VolumeKnob, number> = {
  low: 0.85,
  steady: 1.0,
  high: 1.15,
};

export const INJURY_VOLUME_FACTOR = 0.9;

export function bandsFromVdot(
  vdot: number,
  difficulty: DifficultyKnob = "balanced",
): Bands {
  const vMax = velocityForVo2(vdot) * DIFFICULTY_FACTOR[difficulty];
  const out = {} as Bands;
  for (const key of Object.keys(BAND_FRACTIONS) as Band[]) {
    const [fast, slow] = BAND_FRACTIONS[key];
    out[key] = {
      min_s_per_km: Math.round(secPerKm(vMax * fast)),
      max_s_per_km: Math.round(secPerKm(vMax * slow)),
    };
  }
  return out;
}

/**
 * One or two race performances -> fitness score + bands + equivalents.
 * Two performances are blended 0.4 (shorter) / 0.6 (longer): the longer
 * effort describes the endurance end of the curve better.
 */
export function buildProfile(
  races: RaceInput[],
  opts: { difficulty?: DifficultyKnob } = {},
): Profile {
  const valid = races
    .filter((r) => r && r.distance_m > 0 && r.time_s > 0)
    .sort((a, b) => a.distance_m - b.distance_m);
  if (valid.length === 0) throw new Error("at least one race performance required");

  let score: number;
  if (valid.length === 1) {
    score = vdotFromRace(valid[0].distance_m, valid[0].time_s);
  } else {
    const shortest = valid[0];
    const longest = valid[valid.length - 1];
    score = 0.4 * vdotFromRace(shortest.distance_m, shortest.time_s) +
      0.6 * vdotFromRace(longest.distance_m, longest.time_s);
  }
  score = round(score, 1);

  const ref = valid[valid.length - 1];
  const equivalents: Record<string, number> = {};
  for (const [label, d] of Object.entries({
    "5k": 5000, "10k": 10000, "10mile": 16093, "half": 21097, "marathon": 42195,
  })) {
    equivalents[label] = Math.round(riegel(ref.distance_m, ref.time_s, d));
  }

  return {
    fitness_score: score,
    bands: bandsFromVdot(score, opts.difficulty ?? "balanced"),
    equivalents,
    confidence: valid.length >= 2 ? "high" : "medium",
  };
}

// ---------------------------------------------------------------- calendar

/** ISO weekday 1=Mon .. 7=Sun for a yyyy-mm-dd string. */
export function isoDow(date: string): number {
  const d = new Date(date + "T00:00:00Z");
  const js = d.getUTCDay();
  return js === 0 ? 7 : js;
}

export function addDays(date: string, days: number): string {
  const d = new Date(date + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** The Monday on or after `date`. Week 1 never contains a past day. */
export function firstMonday(date: string): string {
  const dow = isoDow(date);
  return dow === 1 ? date : addDays(date, 8 - dow);
}

/**
 * Which ISO weekdays this member runs on. The long run is pinned to their
 * chosen day and the rest are spaced evenly forward from it, so any unavoidable
 * back-to-back day falls AFTER the long run rather than before it.
 * 4 runs with a Sunday long run -> Mon / Wed / Fri / Sun.
 */
export function chooseRunDays(daysPerWeek: number, longRunDow: number): number[] {
  const days: number[] = [];
  for (let i = 0; i < daysPerWeek; i++) {
    const offset = Math.floor((i * 7) / daysPerWeek);
    days.push(((longRunDow - 1 + offset) % 7) + 1);
  }
  return Array.from(new Set(days)).sort((a, b) => a - b);
}

// ---------------------------------------------------------------- plan build

export interface TemplateStep {
  block: "warmup" | "main" | "cooldown";
  ordinal: number;
  kind: "run" | "walk" | "rest";
  distance_m: number | null;
  duration_s: number | null;
  band: Band | null;
  pace_mode: "target" | "limit" | "none";
  repeat_group: number | null;
  repeat_count: number | null;
  note: string | null;
}

export interface SessionTemplate {
  id: string;
  slug: string;
  name: string;
  session_type: string;
  coach_note: string | null;
  steps: TemplateStep[];
}

export interface TemplateWeek {
  week_index: number;
  day_slot: number;
  session_template_id: string;
  volume_multiplier: number;
  is_long_run: boolean;
  phase: string | null;
}

export interface PlanTemplate {
  id: string;
  slug: string;
  name: string;
  goal: string;
  mode: "block" | "rolling";
  target_distance_m: number | null;
  min_weeks: number;
  max_weeks: number;
  weeks: TemplateWeek[];
  sessions: Record<string, SessionTemplate>;
}

export interface BuildParams {
  start_date: string; // yyyy-mm-dd
  weeks: number;
  days_per_week: number;
  long_run_dow: number; // ISO 1-7
  volume_knob?: VolumeKnob;
  difficulty_knob?: DifficultyKnob;
  injury_adjusted?: boolean;
  surface?: "outdoor" | "treadmill";
  race_date?: string | null;
}

export interface BuiltStep extends TemplateStep {
  pace_s_per_km_min: number | null;
  pace_s_per_km_max: number | null;
}

export interface BuiltSession {
  week_index: number;
  day_index: number;
  scheduled_date: string;
  session_template_id: string;
  session_slug: string;
  name: string;
  session_type: string;
  phase: string | null;
  is_long_run: boolean;
  surface: "outdoor" | "treadmill";
  total_distance_m: number;
  est_duration_s_min: number;
  est_duration_s_max: number;
  coach_note: string | null;
  steps: BuiltStep[];
}

export interface BuiltPlan {
  engine_version: string;
  template_slug: string;
  name: string;
  mode: "block" | "rolling";
  start_date: string;
  end_date: string;
  race_date: string | null;
  weeks: number;
  days_per_week: number;
  long_run_dow: number;
  run_days: number[];
  total_distance_m: number;
  params: BuildParams;
  sessions: BuiltSession[];
}

/** Template + parameters + bands -> a dated, fully resolved plan. Deterministic. */
export function buildPlan(
  template: PlanTemplate,
  params: BuildParams,
  bands: Bands,
): BuiltPlan {
  const weeks = Math.min(Math.max(params.weeks, template.min_weeks), template.max_weeks);
  const volume = VOLUME_FACTOR[params.volume_knob ?? "steady"] *
    (params.injury_adjusted ? INJURY_VOLUME_FACTOR : 1);
  const surface = params.surface ?? "outdoor";
  const monday = firstMonday(params.start_date);
  const runDays = chooseRunDays(params.days_per_week, params.long_run_dow);

  const sessions: BuiltSession[] = [];
  let planTotal = 0;

  for (let w = 1; w <= weeks; w++) {
    const weekRows = template.weeks
      .filter((r) => r.week_index === w)
      .sort((a, b) => a.day_slot - b.day_slot);
    if (weekRows.length === 0) continue;

    // long run takes the member's long-run day; the rest fill the others in order
    const longRow = weekRows.find((r) => r.is_long_run) ?? null;
    const otherRows = weekRows.filter((r) => r !== longRow);
    const otherDays = runDays.filter((d) => d !== params.long_run_dow);

    const placed: Array<{ row: TemplateWeek; dow: number }> = [];
    if (longRow) placed.push({ row: longRow, dow: params.long_run_dow });
    otherRows.forEach((row, i) => {
      if (i < otherDays.length) placed.push({ row, dow: otherDays[i] });
    });
    placed.sort((a, b) => a.dow - b.dow);

    placed.forEach((p, idx) => {
      const tmpl = template.sessions[p.row.session_template_id];
      if (!tmpl) return;
      const scale = Number(p.row.volume_multiplier) * volume;

      let sessionDistance = 0;
      let minS = 0, maxS = 0;

      const steps: BuiltStep[] = tmpl.steps
        .slice()
        .sort((a, b) =>
          a.block === b.block ? a.ordinal - b.ordinal : blockRank(a.block) - blockRank(b.block)
        )
        .map((s) => {
          const reps = s.repeat_count ?? 1;
          const distance = s.distance_m == null
            ? null
            : Math.round((Number(s.distance_m) * scale) / 10) * 10;
          const band = s.band;
          const range = band ? bands[band] : null;

          if (distance != null) sessionDistance += distance * reps;

          if (distance != null && range) {
            minS += ((distance / 1000) * range.min_s_per_km) * reps;
            maxS += ((distance / 1000) * range.max_s_per_km) * reps;
          } else if (s.duration_s != null) {
            minS += s.duration_s * reps;
            maxS += s.duration_s * reps;
          }

          return {
            ...s,
            distance_m: distance,
            pace_s_per_km_min: range ? range.min_s_per_km : null,
            pace_s_per_km_max: range ? range.max_s_per_km : null,
          };
        });

      planTotal += sessionDistance;

      sessions.push({
        week_index: w,
        day_index: idx + 1,
        scheduled_date: addDays(monday, (w - 1) * 7 + (p.dow - 1)),
        session_template_id: tmpl.id,
        session_slug: tmpl.slug,
        name: tmpl.name,
        session_type: tmpl.session_type,
        phase: p.row.phase,
        is_long_run: p.row.is_long_run,
        surface,
        total_distance_m: sessionDistance,
        est_duration_s_min: Math.round(minS),
        est_duration_s_max: Math.round(maxS),
        coach_note: tmpl.coach_note,
        steps,
      });
    });
  }

  return {
    engine_version: ENGINE_VERSION,
    template_slug: template.slug,
    name: template.name,
    mode: template.mode,
    start_date: monday,
    end_date: addDays(monday, weeks * 7 - 1),
    race_date: params.race_date ?? null,
    weeks,
    days_per_week: params.days_per_week,
    long_run_dow: params.long_run_dow,
    run_days: runDays,
    total_distance_m: planTotal,
    params,
    sessions,
  };
}

function blockRank(b: string): number {
  return b === "warmup" ? 0 : b === "main" ? 1 : 2;
}


// ---------------------------------------------------------------- transport

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-vyve-internal-key",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
// House pattern (crisis-scan v2.2): internal callers present x-vyve-internal-key
// and the EF resolves the value via the service-role-only RPC vyve_internal_key().
let cachedInternalKey: string | null = null;
async function getInternalKey(): Promise<string> {
  if (cachedInternalKey !== null) return cachedInternalKey;
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/vyve_internal_key`, {
      method: "POST",
      headers: { apikey: SERVICE_ROLE, Authorization: `Bearer ${SERVICE_ROLE}`, "Content-Type": "application/json" },
      body: "{}",
    });
    const v = r.ok ? await r.json() : "";
    cachedInternalKey = typeof v === "string" ? v : "";
  } catch (_e) {
    cachedInternalKey = "";
  }
  return cachedInternalKey;
}

const admin = () => createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

async function loadTemplate(db: ReturnType<typeof admin>, slug: string): Promise<PlanTemplate> {
  const { data: plan, error: pe } = await db
    .from("run_plan_templates").select("*").eq("slug", slug).maybeSingle();
  if (pe) throw new Error(pe.message);
  if (!plan) throw new Error(`template not found: ${slug}`);

  const { data: weeks, error: we } = await db
    .from("run_template_weeks").select("*").eq("plan_template_id", plan.id)
    .order("week_index").order("day_slot");
  if (we) throw new Error(we.message);

  const ids = Array.from(new Set((weeks ?? []).map((w: any) => w.session_template_id)));
  const { data: sessions, error: se } = await db
    .from("run_session_templates").select("*").in("id", ids);
  if (se) throw new Error(se.message);

  const { data: steps, error: te } = await db
    .from("run_template_steps").select("*").in("session_template_id", ids)
    .order("block").order("ordinal");
  if (te) throw new Error(te.message);

  const byId: Record<string, SessionTemplate> = {};
  for (const s of sessions ?? []) {
    byId[s.id] = {
      id: s.id, slug: s.slug, name: s.name,
      session_type: s.session_type, coach_note: s.coach_note, steps: [],
    };
  }
  for (const st of steps ?? []) {
    byId[st.session_template_id]?.steps.push({
      block: st.block, ordinal: st.ordinal, kind: st.kind,
      distance_m: st.distance_m === null ? null : Number(st.distance_m),
      duration_s: st.duration_s, band: st.band, pace_mode: st.pace_mode,
      repeat_group: st.repeat_group, repeat_count: st.repeat_count, note: st.note,
    });
  }

  return {
    id: plan.id, slug: plan.slug, name: plan.name, goal: plan.goal, mode: plan.mode,
    target_distance_m: plan.target_distance_m,
    min_weeks: plan.min_weeks, max_weeks: plan.max_weeks,
    weeks: (weeks ?? []).map((w: any) => ({
      week_index: w.week_index, day_slot: w.day_slot,
      session_template_id: w.session_template_id,
      volume_multiplier: Number(w.volume_multiplier),
      is_long_run: w.is_long_run, phase: w.phase,
    })),
    sessions: byId,
  };
}

async function persist(
  db: ReturnType<typeof admin>, email: string, profile: Profile, plan: BuiltPlan, body: any,
) {
  const { error: pe } = await db.from("run_member_profile").upsert({
    member_email: email,
    fitness_score: profile.fitness_score,
    race1_distance_m: body.races?.[0]?.distance_m ?? null,
    race1_time_s: body.races?.[0]?.time_s ?? null,
    race1_source: body.races?.[0] ? "member" : null,
    race2_distance_m: body.races?.[1]?.distance_m ?? null,
    race2_time_s: body.races?.[1]?.time_s ?? null,
    race2_source: body.races?.[1] ? "member" : null,
    bands: profile.bands,
    volume_knob: body.params?.volume_knob ?? "steady",
    difficulty_knob: body.params?.difficulty_knob ?? "balanced",
    injury_adjusted: !!body.params?.injury_adjusted,
    confidence: profile.confidence,
    sources: { engine: ENGINE_VERSION },
    computed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }, { onConflict: "member_email" });
  if (pe) throw new Error(pe.message);

  const { data: planRow, error: ie } = await db.from("run_member_plans").insert({
    member_email: email,
    plan_template_id: body.plan_template_id ?? null,
    name: plan.name,
    mode: plan.mode,
    status: body.status ?? "draft",
    start_date: plan.start_date,
    end_date: plan.end_date,
    race_date: plan.race_date,
    weeks: plan.weeks,
    days_per_week: plan.days_per_week,
    long_run_dow: plan.long_run_dow,
    params: plan.params,
    projection: { equivalents: profile.equivalents, fitness_score: profile.fitness_score },
    total_distance_m: plan.total_distance_m,
    engine_version: ENGINE_VERSION,
    client_id: body.client_id ?? null,
  }).select("id").single();
  if (ie) throw new Error(ie.message);

  for (const s of plan.sessions) {
    const { data: sessRow, error: se } = await db.from("run_member_sessions").insert({
      plan_id: planRow.id, member_email: email,
      week_index: s.week_index, day_index: s.day_index, scheduled_date: s.scheduled_date,
      session_template_id: s.session_template_id, name: s.name, session_type: s.session_type,
      total_distance_m: s.total_distance_m,
      est_duration_s_min: s.est_duration_s_min, est_duration_s_max: s.est_duration_s_max,
      surface: s.surface, coach_note: s.coach_note,
    }).select("id").single();
    if (se) throw new Error(se.message);

    const rows = s.steps.map((st) => ({
      session_id: sessRow.id, member_email: email,
      block: st.block, ordinal: st.ordinal, kind: st.kind,
      distance_m: st.distance_m, duration_s: st.duration_s,
      band: st.band, pace_mode: st.pace_mode,
      pace_s_per_km_min: st.pace_s_per_km_min, pace_s_per_km_max: st.pace_s_per_km_max,
      repeat_group: st.repeat_group, repeat_count: st.repeat_count, note: st.note,
    }));
    if (rows.length) {
      const { error: te } = await db.from("run_member_steps").insert(rows);
      if (te) throw new Error(te.message);
    }
  }
  return planRow.id;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const action = body.action ?? new URL(req.url).searchParams.get("action") ?? "health";

    if (action === "health") {
      return json({
        ok: true,
        engine_version: ENGINE_VERSION,
        internal_key_present: (await getInternalKey()).length > 0,
      });
    }

    // auth: internal key, or a member JWT
    const hdrKey = req.headers.get("x-vyve-internal-key") ?? "";
    const internalKey = hdrKey ? await getInternalKey() : "";
    const internal = !!internalKey && hdrKey === internalKey;
    let email: string | null = null;
    if (!internal) {
      const auth = req.headers.get("Authorization") ?? "";
      const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
      if (!token) return json({ error: "unauthorised" }, 401);
      const { data, error } = await admin().auth.getUser(token);
      if (error || !data?.user?.email) return json({ error: "unauthorised" }, 401);
      email = data.user.email;
    } else if (body.member_email) {
      email = String(body.member_email).toLowerCase();
    }

    if (action === "profile") {
      return json(buildProfile(body.races ?? [], { difficulty: body.difficulty }));
    }

    if (action === "build" || action === "persist") {
      if (!body.template_slug) return json({ error: "template_slug required" }, 400);
      const db = admin();
      const template = await loadTemplate(db, body.template_slug);
      const profile = body.bands
        ? { fitness_score: body.fitness_score ?? 0, bands: body.bands, equivalents: {}, confidence: "low" } as Profile
        : buildProfile(body.races ?? [], { difficulty: body.params?.difficulty_knob });
      const plan = buildPlan(template, body.params, profile.bands);

      if (action === "build") return json({ profile, plan });

      if (!email) return json({ error: "member_email required" }, 400);
      const id = await persist(db, email, profile, plan, { ...body, plan_template_id: template.id });
      return json({ ok: true, plan_id: id, sessions: plan.sessions.length });
    }

    return json({ error: `unknown action: ${action}` }, 400);
  } catch (e) {
    return json({ error: String(e instanceof Error ? e.message : e) }, 500);
  }
});
