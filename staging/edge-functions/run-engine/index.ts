// PM-1239 — run-engine Edge Function (Wave 0, server only, no member surface).
// PM-1240 (v4) — repeated-effort distances no longer scale with volume.
// PM-1241 (v6) — quality ceilings are time-aware: a percentage cap alone starves a
//   low-mileage runner of any real threshold stimulus.
// PM-1241 (v5) — band fractions corrected against Daniels (the Wave 0 figures were
//   %VO2max used as %velocity); per-session quality-volume caps; a week with no
//   long run fills every run day instead of silently dropping a session.
// Self-contained per §23.79: the engine module is inlined, not imported.
// Actions: health | profile | build | persist.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

// PM-1239 — running rebuild Wave 0 pace + plan engine.
// PURE FUNCTIONS ONLY. No Date.now(), no randomness, no I/O in this file.
// Distances in metres, durations in seconds, paces in seconds per kilometre.

export const ENGINE_VERSION = "run-engine@0.4.0";

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

// Fractions of VELOCITY at VDOT. Fast bound first.
// PM-1241: Daniels publishes his zones as fractions of VO2 UPTAKE (E 59-74%,
// T ~88%, I 95-100%). Wave 0 used those numbers as velocity fractions, which is
// only near-correct at the top of the range — hence easy and threshold came out
// materially slow while interval and rep were fine. These are solved backwards
// from the published pace table: at VDOT 38.3 (a 25:00 5k, vVDOT 4:45/km) they
// give easy 6:10-6:53, threshold 5:17-5:28, interval 4:45-5:01, rep 4:29-4:40,
// against Daniels' easy 6:10-6:53, threshold 5:19, interval 4:54, rep ~4:35.
// `long` is NOT a separate intensity — Daniels runs long runs at E pace, so it
// carries the easy range and exists only as a display label.
const BAND_FRACTIONS: Record<Band, [number, number]> = {
  easy: [0.77, 0.69],
  long: [0.77, 0.69],
  threshold: [0.90, 0.87],
  interval: [1.00, 0.95],
  rep: [1.06, 1.02],
};

// PM-1241 — Daniels' per-session ceilings, as fractions of that week's volume.
// T no more than 10%, I no more than 8% (and never more than 10km), R no more
// than 5%, long run no more than 30%. Enforced by trimming REP COUNTS, never rep
// distances: an 800 stays an 800, a 20km week just gets fewer of them.
const QUALITY_CAP_FRACTION: Partial<Record<Band, number>> = {
  threshold: 0.10,
  interval: 0.08,
  rep: 0.05,
};
const INTERVAL_SESSION_CAP_M = 10000;
const LONG_RUN_CAP_FRACTION = 0.30;
const MIN_REPS = 2;

// Daniels' percentages assume a runner with mileage to spend. At 15km a week,
// 10% is eight minutes at threshold — below the dose that produces the
// adaptation at all, and his own guidance is that a tempo run is about twenty
// minutes. So each quality band gets a floor and a ceiling in TIME at that
// band's pace, and the percentage only binds between them.
const QUALITY_TIME_FLOOR_S: Partial<Record<Band, number>> = { threshold: 1200, interval: 720 };
const QUALITY_TIME_CEILING_S: Partial<Record<Band, number>> = { threshold: 1800, interval: 900 };
const REP_FLOOR_M = 800;

/** Metres covered in `seconds` at the middle of a band. */
function metresAtBand(bands: Bands, band: Band, seconds: number): number {
  const r = bands[band];
  const mid = (r.min_s_per_km + r.max_s_per_km) / 2;
  return mid > 0 ? (seconds * 1000) / mid : 0;
}

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

    // The long run takes the member's chosen day; the rest fill the others in
    // slot order. PM-1241: when NO row is flagged as the long run — a run/walk
    // week, say — every run day is available, so slot order is simply
    // chronological and a week that progresses within itself stays in sequence.
    const longRow = weekRows.find((r) => r.is_long_run) ?? null;
    const otherRows = weekRows.filter((r) => r !== longRow);
    const otherDays = longRow
      ? runDays.filter((d) => d !== params.long_run_dow)
      : runDays.slice();

    const placed: Array<{ row: TemplateWeek; dow: number }> = [];
    if (longRow) placed.push({ row: longRow, dow: params.long_run_dow });
    otherRows.forEach((row, i) => {
      if (i < otherDays.length) placed.push({ row, dow: otherDays[i] });
    });
    placed.sort((a, b) => a.dow - b.dow);

    // Two settling passes: compose the week uncapped to get its volume, derive
    // the caps from it, recompose. Deterministic — fixed iteration count, no I/O.
    let composed = placed.map((p) =>
      composeSession(template.sessions[p.row.session_template_id], Number(p.row.volume_multiplier) * volume, bands, null)
    );
    let caps: Caps = { threshold: 0, interval: 0, rep: 0, long: 0 };
    for (let iter = 0; iter < 2; iter++) {
      const weekTotal = composed.reduce((a, c) => a + (c ? c.total : 0), 0);
      caps = {
        threshold: Math.min(
          Math.max(QUALITY_CAP_FRACTION.threshold! * weekTotal,
                   metresAtBand(bands, "threshold", QUALITY_TIME_FLOOR_S.threshold!)),
          metresAtBand(bands, "threshold", QUALITY_TIME_CEILING_S.threshold!),
        ),
        interval: Math.min(
          Math.max(QUALITY_CAP_FRACTION.interval! * weekTotal,
                   metresAtBand(bands, "interval", QUALITY_TIME_FLOOR_S.interval!)),
          metresAtBand(bands, "interval", QUALITY_TIME_CEILING_S.interval!),
          INTERVAL_SESSION_CAP_M,
        ),
        rep: Math.max(QUALITY_CAP_FRACTION.rep! * weekTotal, REP_FLOOR_M),
        long: LONG_RUN_CAP_FRACTION * weekTotal,
      };
      composed = placed.map((p) => {
        const tmpl = template.sessions[p.row.session_template_id];
        if (!tmpl) return null;
        let scale = Number(p.row.volume_multiplier) * volume;
        if (p.row.is_long_run && caps.long > 0) {
          const un = composeSession(tmpl, scale, bands, null);
          if (un && un.total > caps.long) scale = scale * (caps.long / un.total);
        }
        return composeSession(tmpl, scale, bands, caps);
      });
    }

    placed.forEach((p, idx) => {
      const tmpl = template.sessions[p.row.session_template_id];
      const c = composed[idx];
      if (!tmpl || !c) return;
      planTotal += c.total;
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
        total_distance_m: c.total,
        est_duration_s_min: Math.round(c.minS),
        est_duration_s_max: Math.round(c.maxS),
        coach_note: tmpl.coach_note,
        steps: c.steps,
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

interface Caps { threshold: number; interval: number; rep: number; long: number }
interface Composed { steps: BuiltStep[]; total: number; minS: number; maxS: number }

/**
 * One session template + a volume scale + resolved bands -> concrete steps.
 * `caps` null composes at the template's authored rep counts; otherwise rep
 * counts are trimmed (never below MIN_REPS) so the session respects Daniels'
 * per-session quality ceilings for the week it sits in.
 */
function composeSession(
  tmpl: SessionTemplate | undefined,
  scale: number,
  bands: Bands,
  caps: Caps | null,
): Composed | null {
  if (!tmpl) return null;
  const sorted = tmpl.steps.slice().sort((a, b) =>
    a.block === b.block ? a.ordinal - b.ordinal : blockRank(a.block) - blockRank(b.block)
  );

  const key = (s: TemplateStep) =>
    s.repeat_group != null ? `g${s.repeat_group}` : `s${s.block}${s.ordinal}`;

  // Authored rep counts, per-rep banded distance per group, and the banded
  // distance that sits OUTSIDE any repeat (which cannot be trimmed away).
  const groupReps: Record<string, number> = {};
  const groupBandPerRep: Record<string, Partial<Record<Band, number>>> = {};
  const unrepeated: Partial<Record<Band, number>> = {};
  for (const s of sorted) {
    const raw = s.distance_m == null ? 0 : Number(s.distance_m);
    if (s.repeat_count != null) {
      const g = key(s);
      groupReps[g] = s.repeat_count;
      if (s.band && raw > 0) {
        groupBandPerRep[g] = groupBandPerRep[g] ?? {};
        groupBandPerRep[g][s.band] = (groupBandPerRep[g][s.band] ?? 0) + raw;
      }
    } else if (s.band && raw > 0) {
      const scaled = Math.round((raw * scale) / 10) * 10;
      unrepeated[s.band] = (unrepeated[s.band] ?? 0) + scaled;
    }
  }

  if (caps) {
    // Remaining allowance per band, consumed group by group in a fixed order.
    const left: Partial<Record<Band, number>> = {};
    for (const b of Object.keys(QUALITY_CAP_FRACTION) as Band[]) {
      left[b] = Math.max(0, (caps as unknown as Record<string, number>)[b] - (unrepeated[b] ?? 0));
    }
    for (const g of Object.keys(groupBandPerRep).sort()) {
      let allowed = groupReps[g];
      for (const b of Object.keys(groupBandPerRep[g]) as Band[]) {
        if (left[b] === undefined) continue;
        const per = groupBandPerRep[g][b]!;
        if (per > 0) allowed = Math.min(allowed, Math.floor(left[b]! / per));
      }
      const finalReps = Math.max(MIN_REPS, Math.min(groupReps[g], allowed));
      groupReps[g] = finalReps;
      for (const b of Object.keys(groupBandPerRep[g]) as Band[]) {
        if (left[b] === undefined) continue;
        left[b] = Math.max(0, left[b]! - groupBandPerRep[g][b]! * finalReps);
      }
    }
  }

  let total = 0, minS = 0, maxS = 0;
  const steps: BuiltStep[] = sorted.map((s) => {
    const reps = s.repeat_count != null ? groupReps[key(s)] ?? s.repeat_count : 1;
    // PM-1240: a repeated effort is a NAMED distance, not a volume dial.
    // "Rolling 800s" must stay 800m and a stride must stay 100m at every
    // volume knob; only unrepeated steps (warmups, easy runs, long runs)
    // absorb the week multiplier and the member's volume setting.
    const distance = s.distance_m == null
      ? null
      : s.repeat_count != null
        ? Math.round(Number(s.distance_m))
        : Math.round((Number(s.distance_m) * scale) / 10) * 10;
    const range = s.band ? bands[s.band] : null;

    if (distance != null) total += distance * reps;
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
      repeat_count: s.repeat_count != null ? reps : s.repeat_count,
      pace_s_per_km_min: range ? range.min_s_per_km : null,
      pace_s_per_km_max: range ? range.max_s_per_km : null,
    };
  });

  return { steps, total, minS, maxS };
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
