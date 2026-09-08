// challenge-score v3 — Trainerize W4 (PM-1085, 8 Sep 2026). Gap map #73: the points rule engine.
// Idempotent recompute (never increment) of points / rank / passed / breakdown for every opted-in
// participant of every live coach challenge, and of every employer launch that is in its date window.
// Same rules contract for both launchers ({earn:{workout,cardio,pb,nutrition_goal,habit,fitness_goal},
// daily_cap_per_rule, threshold}); employer launches use STOCK_RULES because employer_challenges carries none.
//
// Auth (no email fallback):
//   cron:  x-vyve-cron-key == VYVE_CRON_KEY → every live challenge (hourly job challenge-score-hourly)
//   coach: Authorization: Bearer <user JWT> → own challenges only (partner via rpc/get_my_partner_id)
// Body: { challenge_id?: uuid, action?: 'score'|'end', dry_run?: bool }
//   action 'end' (coach only): final score, then status='ended' + ended_at.
// Live coach challenges past ends_at are auto-ended after their final score on the cron pass.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SVC = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const ANON = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const CRON_KEY = Deno.env.get('VYVE_CRON_KEY') ?? '';
const H = { 'Content-Type': 'application/json', 'apikey': SVC, 'Authorization': 'Bearer ' + SVC };
const ALLOWED_ORIGINS = ['https://admin.vyvehealth.co.uk', 'https://online.vyvehealth.co.uk', 'https://www.vyvehealth.co.uk', 'capacitor://localhost', 'https://localhost', 'http://localhost:8080', 'http://localhost:3000'];
function cors(req: Request) {
  const o = req.headers.get('origin') || '';
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(o) ? o : '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-vyve-cron-key',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };
}
const json = (req: Request, s: number, b: unknown) => new Response(JSON.stringify(b), { status: s, headers: cors(req) });

type Row = Record<string, unknown>;
type Rules = { earn: Record<string, number>; daily_cap_per_rule: number; threshold: number | null };
const STOCK_RULES: Rules = { earn: { workout: 5, cardio: 2, pb: 20, nutrition_goal: 10, habit: 30, fitness_goal: 100 }, daily_cap_per_rule: 1, threshold: null };
const RULE_KEYS = ['workout', 'cardio', 'pb', 'nutrition_goal', 'habit', 'fitness_goal'];

async function restGet<T>(path: string): Promise<T> {
  const r = await fetch(SUPABASE_URL + '/rest/v1/' + path, { headers: H });
  if (!r.ok) throw new Error('rest ' + path.split('?')[0] + ' ' + r.status + ' ' + (await r.text()).slice(0, 200));
  return await r.json();
}
async function restPatch(path: string, body: unknown): Promise<void> {
  const r = await fetch(SUPABASE_URL + '/rest/v1/' + path, { method: 'PATCH', headers: { ...H, 'Prefer': 'return=minimal' }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error('patch ' + path.split('?')[0] + ' ' + r.status + ' ' + (await r.text()).slice(0, 200));
}
function inList(emails: string[]): string {
  return 'in.(' + emails.map((e) => '"' + e.replace(/"/g, '') + '"').join(',') + ')';
}
async function partnerFromJwt(token: string): Promise<string | null> {
  const r = await fetch(SUPABASE_URL + '/rest/v1/rpc/get_my_partner_id', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'apikey': ANON, 'Authorization': 'Bearer ' + token }, body: '{}'
  });
  if (!r.ok) return null;
  const v = await r.json();
  return typeof v === 'string' && v ? v : null;
}
const lc = (v: unknown) => String(v || '').toLowerCase();
const d10 = (v: unknown) => String(v || '').slice(0, 10);
function normRules(r: unknown): Rules {
  const o = (r && typeof r === 'object') ? r as Row : {};
  const earnIn = (o.earn && typeof o.earn === 'object') ? o.earn as Row : {};
  const earn: Record<string, number> = {};
  for (const k of RULE_KEYS) earn[k] = Math.max(0, Number(earnIn[k] ?? STOCK_RULES.earn[k]) || 0);
  const cap = Math.max(1, Math.floor(Number(o.daily_cap_per_rule) || 1));
  const th = o.threshold == null || o.threshold === '' ? null : Math.max(1, Math.floor(Number(o.threshold) || 0)) || null;
  return { earn, daily_cap_per_rule: cap, threshold: th };
}

type Launch = {
  kind: 'coach' | 'employer'; id: string; partner_id: string | null; type: string; rules: Rules;
  starts: string; ends: string; status: string; end_now: boolean;
};
type Part = { key: string; email: string; opted_in: string; points: number; rank: number | null; passed: boolean; breakdown: Row };

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors(req) });
  if (req.method !== 'POST') return json(req, 405, { error: 'method_not_allowed' });
  let body: Row = {};
  try { body = await req.json(); } catch (_) { body = {}; }

  // ── auth ──
  const isCron = !!CRON_KEY && req.headers.get('x-vyve-cron-key') === CRON_KEY;
  let scopePartner: string | null = null;
  if (!isCron) {
    const auth = req.headers.get('authorization') || '';
    const tok = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    if (!tok) return json(req, 401, { error: 'unauthorized' });
    scopePartner = await partnerFromJwt(tok);
    if (!scopePartner) return json(req, 401, { error: 'unauthorized' });
  }
  const dryRun = body.dry_run === true;
  const action = body.action === 'end' ? 'end' : 'score';
  const onlyId = typeof body.challenge_id === 'string' ? body.challenge_id : null;
  if (action === 'end' && (!onlyId || isCron)) return json(req, 400, { error: 'end_needs_challenge_id_and_coach' });
  const now = new Date();
  const today = now.toISOString().slice(0, 10);

  // ── launches in scope ──
  const launches: Launch[] = [];
  let cq = 'coach_challenges?select=id,partner_id,type,rules,starts_at,ends_at,status&status=eq.live';
  if (scopePartner) cq += '&partner_id=eq.' + scopePartner;
  if (onlyId) cq += '&id=eq.' + onlyId;
  const coachRows = await restGet<Row[]>(cq);
  for (const c of coachRows) {
    const ends = d10(c.ends_at);
    launches.push({ kind: 'coach', id: String(c.id), partner_id: String(c.partner_id), type: String(c.type), rules: normRules(c.rules),
      starts: d10(c.starts_at), ends, status: 'live', end_now: action === 'end' || (isCron && ends < today) });
  }
  if (!scopePartner && !onlyId) {
    // employer launches inside their window (+1 day grace for late logs); status is theirs to manage, never touched here
    const emp = await restGet<Row[]>('employer_challenges?select=id,starts_on,ends_on,status&status=neq.cancelled&starts_on=lte.' + today + '&ends_on=gte.' + new Date(now.getTime() - 86400000).toISOString().slice(0, 10));
    for (const e of emp) launches.push({ kind: 'employer', id: String(e.id), partner_id: null, type: 'leaderboard', rules: STOCK_RULES, starts: d10(e.starts_on), ends: d10(e.ends_on), status: String(e.status), end_now: false });
  }
  if (!launches.length) {
    if (onlyId && !isCron) return json(req, 404, { error: 'not_found_or_not_live' });
    return json(req, 200, { ok: true, dry_run: dryRun, launches: 0, participants: 0 });
  }

  // ── participants ──
  const parts = new Map<string, Part[]>(); // launch id → participants
  const coachIds = launches.filter((l) => l.kind === 'coach').map((l) => l.id);
  const empIds = launches.filter((l) => l.kind === 'employer').map((l) => l.id);
  if (coachIds.length) {
    const rows = await restGet<Row[]>('coach_challenge_participants?select=id,challenge_id,member_email,opted_in_at&opted_out_at=is.null&challenge_id=in.(' + coachIds.join(',') + ')');
    for (const r of rows) { const k = String(r.challenge_id); if (!parts.has(k)) parts.set(k, []); parts.get(k)!.push({ key: String(r.id), email: lc(r.member_email), opted_in: d10(r.opted_in_at), points: 0, rank: null, passed: false, breakdown: {} }); }
  }
  if (empIds.length) {
    const rows = await restGet<Row[]>('employer_challenge_optins?select=id,employer_challenge_id,member_email,opted_in_at&employer_challenge_id=in.(' + empIds.join(',') + ')');
    for (const r of rows) { const k = String(r.employer_challenge_id); if (!parts.has(k)) parts.set(k, []); parts.get(k)!.push({ key: String(r.id), email: lc(r.member_email), opted_in: d10(r.opted_in_at), points: 0, rank: null, passed: false, breakdown: {} }); }
  }
  const emails = Array.from(new Set(Array.from(parts.values()).flat().map((p) => p.email)));
  const fromIso = launches.reduce((m, l) => (l.starts < m ? l.starts : m), today);

  // ── bulk reads (service role; one query per table) ──
  let woBy = new Map<string, Row[]>(), caBy = woBy, haBy = woBy, nuBy = woBy, elBy = woBy, goBy = woBy;
  const memBy = new Map<string, Row>();
  if (emails.length) {
    const el = inList(emails);
    const [workouts, cardio, habits, nutri, exlogs, goals, members] = await Promise.all([
      restGet<Row[]>('workouts?select=member_email,activity_date&member_email=' + el + '&activity_date=gte.' + fromIso + '&limit=20000'),
      restGet<Row[]>('cardio?select=member_email,activity_date&member_email=' + el + '&activity_date=gte.' + fromIso + '&limit=20000'),
      restGet<Row[]>('daily_habits?select=member_email,activity_date&habit_completed=eq.true&member_email=' + el + '&activity_date=gte.' + fromIso + '&limit=20000'),
      restGet<Row[]>('nutrition_logs?select=member_email,activity_date,calories_kcal&member_email=' + el + '&activity_date=gte.' + fromIso + '&limit=50000'),
      restGet<Row[]>('exercise_logs?select=member_email,exercise_name,activity_date,logged_at,reps_completed,weight_kg&weight_kg=gt.0&reps_completed=gt.0&member_email=' + el + '&order=logged_at.asc&limit=50000'),
      restGet<Row[]>('coach_client_goals?select=member_email,partner_id,achieved_at&achieved_at=not.is.null&member_email=' + el + '&achieved_at=gte.' + fromIso),
      restGet<Row[]>('members?select=email,tdee_target,macro_override&email=' + el)
    ]);
    const byEmail = (rows: Row[]) => { const m = new Map<string, Row[]>(); for (const r of rows) { const k = lc(r.member_email); if (!m.has(k)) m.set(k, []); m.get(k)!.push(r); } return m; };
    woBy = byEmail(workouts); caBy = byEmail(cardio); haBy = byEmail(habits); nuBy = byEmail(nutri); elBy = byEmail(exlogs); goBy = byEmail(goals);
    for (const m of members) memBy.set(lc(m.email), m);
  }

  // PB days per member: a log is a PB when its e1RM beats every earlier log of the same exercise (full history incl. pre-challenge).
  const pbDaysBy = new Map<string, string[]>();
  for (const [em, rows] of elBy) {
    const best = new Map<string, number>(); const days: string[] = [];
    for (const r of rows) { // already ordered by logged_at asc
      const e1 = Number(r.weight_kg) * (1 + Number(r.reps_completed) / 30);
      const k = lc(r.exercise_name).trim();
      const prev = best.get(k);
      if (prev !== undefined && e1 > prev + 1e-9 && d10(r.activity_date) >= fromIso) days.push(d10(r.activity_date));
      if (prev === undefined || e1 > prev) best.set(k, e1);
    }
    pbDaysBy.set(em, days);
  }
  const nutriGoalDaysBy = new Map<string, string[]>();
  for (const [em, rows] of nuBy) {
    const mem = memBy.get(em) || {};
    const mo = (mem.macro_override && typeof mem.macro_override === 'object') ? mem.macro_override as Row : null;
    const target = Number((mo && (mo.calories || mo.kcal)) || mem.tdee_target || 0) || 0;
    const byDay = new Map<string, number>();
    for (const r of rows) { const d = d10(r.activity_date); byDay.set(d, (byDay.get(d) || 0) + (Number(r.calories_kcal) || 0)); }
    const days: string[] = [];
    if (target > 0) for (const [d, v] of byDay) if (v >= target * 0.9 && v <= target * 1.1) days.push(d);
    nutriGoalDaysBy.set(em, days);
  }

  // ── score ──
  const results: Row[] = [];
  let written = 0;
  for (const l of launches) {
    const ps = parts.get(l.id) || [];
    const endIso = l.ends < today ? l.ends : today;
    for (const p of ps) {
      const from = l.starts; // everyone scores from the challenge start (a late joiner's earlier activity counts — Trainerize shape)
      const inWin = (d: string) => d >= from && d <= endIso;
      const dayCount = (days: string[]) => { const m = new Map<string, number>(); for (const d of days) if (inWin(d)) m.set(d, (m.get(d) || 0) + 1); return m; };
      const sources: Record<string, Map<string, number>> = {
        workout: dayCount((woBy.get(p.email) || []).map((r) => d10(r.activity_date))),
        cardio: dayCount((caBy.get(p.email) || []).map((r) => d10(r.activity_date))),
        habit: dayCount((haBy.get(p.email) || []).map((r) => d10(r.activity_date))),
        nutrition_goal: dayCount(nutriGoalDaysBy.get(p.email) || []),
        pb: dayCount(pbDaysBy.get(p.email) || []),
        fitness_goal: dayCount((goBy.get(p.email) || []).filter((g) => l.kind === 'employer' ? false : String(g.partner_id) === l.partner_id).map((g) => d10(g.achieved_at)))
      };
      let total = 0; const bd: Row = {}; const todayBd: Row = {}; const daysActive = new Set<string>();
      for (const k of RULE_KEYS) {
        const per = l.rules.earn[k] || 0; let pts = 0;
        for (const [d, n] of sources[k]) { const earned = Math.min(n, l.rules.daily_cap_per_rule) * per; pts += earned; if (earned > 0) daysActive.add(d); if (d === today && earned > 0) todayBd[k] = earned; }
        bd[k] = pts; total += pts;
      }
      p.points = total; p.breakdown = { ...bd, today: todayBd, active_days: daysActive.size, scored_from: from };
      p.passed = l.rules.threshold != null && total >= l.rules.threshold;
    }
    ps.sort((a, b) => b.points - a.points || a.opted_in.localeCompare(b.opted_in));
    let rank = 0, last = -1;
    ps.forEach((p, i) => { if (p.points !== last) { rank = i + 1; last = p.points; } p.rank = rank; });
    results.push({ kind: l.kind, id: l.id, participants: ps.length, ended: l.end_now, top: ps.slice(0, 3).map((p) => ({ email: p.email, points: p.points, rank: p.rank })) });
    if (dryRun) continue;
    const table = l.kind === 'coach' ? 'coach_challenge_participants' : 'employer_challenge_optins';
    for (const p of ps) {
      await restPatch(table + '?id=eq.' + p.key, { points: p.points, rank: p.rank, passed: p.passed, breakdown: p.breakdown, last_scored_at: now.toISOString() });
      written++;
    }
    if (l.kind === 'coach') {
      const patch: Row = { last_scored_at: now.toISOString() };
      if (l.end_now) { patch.status = 'ended'; patch.ended_at = now.toISOString(); }
      await restPatch('coach_challenges?id=eq.' + l.id, patch);
    }
  }
  return json(req, 200, { ok: true, dry_run: dryRun, launches: launches.length, participants: written || Array.from(parts.values()).flat().length, today, results });
});
