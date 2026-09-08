// coach-weekly-snapshot v2 — Trainerize W5 (PM-1089): projection v2 (week_start anchor, session days, schedule_overrides skips).
// v1 — Trainerize W0 (PM-1068, 8 Sep 2026). Gap map #98: the weekly snapshot backbone.
// Writes one coach_client_weekly row per (partner, client, ISO week) — the table W1 insights/auto-tags,
// W5 scheduling, W9 dashboard all read. Scheduled sessions come from _shared/programme_projection.ts
// (the single projection truth W5 will extend with phases/queue/overrides).
//
// Auth (no email fallback, PM-1003 class):
//   cron:  x-vyve-cron-key == VYVE_CRON_KEY → every partner with active clients (or {partner_id})
//   coach: Authorization: Bearer <user JWT> → partner resolved server-side via rpc/get_my_partner_id; null → 401
// Body: { member?: email, weeks?: 1..26 (cron default 2 = this + last week; coach default 12), dry_run?: bool }
// Cron: Sunday 23:30 UTC (job coach-weekly-snapshot-sunday) — the week is still open, so the last sweep
// re-computes the two most recent weeks and late logs are caught the following Sunday.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { mondayOf, isoDate, recentWeekStarts, projectWeek, pickCompliancePlan, WpcRow } from './_shared/programme_projection.ts';

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
const DAY = 86400000;

async function restGet<T>(path: string): Promise<T> {
  const r = await fetch(SUPABASE_URL + '/rest/v1/' + path, { headers: H });
  if (!r.ok) throw new Error('rest ' + path.split('?')[0] + ' ' + r.status + ' ' + (await r.text()).slice(0, 200));
  return await r.json();
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

type Client = { partner_id: string; member_email: string; status: string; assignments?: Row | null };
type Row = Record<string, unknown>;

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors(req) });
  if (req.method !== 'POST') return json(req, 405, { error: 'method_not_allowed' });
  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch (_) { body = {}; }

  // ── auth ──
  const isCron = !!CRON_KEY && req.headers.get('x-vyve-cron-key') === CRON_KEY;
  let scopePartner: string | null = null;
  if (isCron) {
    scopePartner = typeof body.partner_id === 'string' ? body.partner_id : null;
  } else {
    const auth = req.headers.get('authorization') || '';
    const tok = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    if (!tok) return json(req, 401, { error: 'unauthorized' });
    scopePartner = await partnerFromJwt(tok);
    if (!scopePartner) return json(req, 401, { error: 'unauthorized' });
  }
  const dryRun = body.dry_run === true;
  const memberFilter = typeof body.member === 'string' ? body.member.trim().toLowerCase() : null;
  const weeksN = Math.min(26, Math.max(1, Number(body.weeks) || (isCron ? 2 : 12)));
  const now = new Date();
  const weekStarts = recentWeekStarts(weeksN, now);
  const fromIso = weekStarts[0];
  const thisMon = isoDate(mondayOf(now));

  // ── clients in scope ──
  let cq = 'coach_clients?select=partner_id,member_email,status,assignments&archived_at=is.null';
  if (scopePartner) cq += '&partner_id=eq.' + scopePartner;
  if (memberFilter) cq += '&member_email=ilike.' + encodeURIComponent(memberFilter);
  else cq += '&status=eq.active';
  const clients = await restGet<Client[]>(cq);
  if (!clients.length) return json(req, 200, { ok: true, dry_run: dryRun, partners: 0, clients: 0, weeks: weekStarts, rows: 0 });
  const emails = Array.from(new Set(clients.map((c) => c.member_email.toLowerCase())));
  const partnerIds = Array.from(new Set(clients.map((c) => c.partner_id)));

  // ── bulk reads (service role; one query per table) ──
  const el = inList(emails);
  const [wpcs, workouts, cardio, nutri, mal, weights, msgs, members] = await Promise.all([
    restGet<WpcRow[]>('workout_plan_cache?select=member_email,programme_json,plan_duration_weeks,current_week,is_active,paused_at,generated_at,source,week_start&is_active=eq.true&member_email=' + el),
    restGet<Row[]>('workouts?select=member_email,activity_date&member_email=' + el + '&activity_date=gte.' + fromIso),
    restGet<Row[]>('cardio?select=member_email,activity_date&member_email=' + el + '&activity_date=gte.' + fromIso),
    restGet<Row[]>('nutrition_logs?select=member_email,activity_date,calories_kcal&member_email=' + el + '&activity_date=gte.' + fromIso + '&limit=20000'),
    restGet<Row[]>('member_activity_log?select=member_email,activity_date&member_email=' + el + '&activity_date=gte.' + fromIso + '&limit=20000'),
    restGet<Row[]>('weight_logs?select=member_email,logged_date,weight_kg&member_email=' + el + '&order=logged_date.desc&limit=5000'),
    restGet<Row[]>('coach_messages?select=partner_id,member_email,sender,created_at&partner_id=in.(' + partnerIds.join(',') + ')&member_email=' + el + '&order=created_at.desc&limit=20000'),
    restGet<Row[]>('members?select=email,tdee_target,macro_override&email=' + el)
  ]);

  const lc = (v: unknown) => String(v || '').toLowerCase();
  const byEmail = <T extends Row>(rows: T[], key = 'member_email') => {
    const m = new Map<string, T[]>();
    for (const r of rows) { const k = lc(r[key]); if (!m.has(k)) m.set(k, []); m.get(k)!.push(r); }
    return m;
  };
  const wpcBy = byEmail(wpcs as unknown as Row[]);
  const woBy = byEmail(workouts), caBy = byEmail(cardio), nuBy = byEmail(nutri), malBy = byEmail(mal), wtBy = byEmail(weights), msgBy = byEmail(msgs);
  const memBy = new Map(members.map((m) => [lc(m.email), m]));

  const weekEnd = (ws: string) => isoDate(new Date(new Date(ws + 'T00:00:00Z').getTime() + 6 * DAY));
  const inWeek = (d: unknown, ws: string, we: string) => { const s = String(d || '').slice(0, 10); return s >= ws && s <= we; };

  const out: Row[] = [];
  for (const c of clients) {
    const em = lc(c.member_email);
    const plan = pickCompliancePlan((wpcBy.get(em) || []) as unknown as WpcRow[]);
    const mem = memBy.get(em) || {};
    const mo = (mem.macro_override && typeof mem.macro_override === 'object') ? mem.macro_override as Row : null;
    const kcalTarget = Number((mo && (mo.calories || mo.kcal)) || mem.tdee_target || 0) || 0;
    const pmsgs = (msgBy.get(em) || []).filter((m) => m.partner_id === c.partner_id);
    const lastOut = pmsgs.find((m) => m.sender === 'coach')?.created_at ?? null;
    const lastIn = pmsgs.find((m) => m.sender === 'member')?.created_at ?? null;
    for (const ws of weekStarts) {
      const we = weekEnd(ws);
      const proj = projectWeek(plan, ws, now, (c.assignments && (c.assignments as Row).schedule_overrides) ? (c.assignments as Row).schedule_overrides as Record<string, { to?: string; skip?: boolean }> : null);
      const completed = (woBy.get(em) || []).filter((r) => inWeek(r.activity_date, ws, we)).length;
      const cardioN = (caBy.get(em) || []).filter((r) => inWeek(r.activity_date, ws, we)).length;
      const kcalByDay = new Map<string, number>();
      for (const r of (nuBy.get(em) || [])) {
        if (!inWeek(r.activity_date, ws, we)) continue;
        const d = String(r.activity_date).slice(0, 10);
        kcalByDay.set(d, (kcalByDay.get(d) || 0) + (Number(r.calories_kcal) || 0));
      }
      const loggedDays = kcalByDay.size;
      let goalDays = 0;
      if (kcalTarget > 0) for (const v of kcalByDay.values()) if (v >= kcalTarget * 0.9 && v <= kcalTarget * 1.1) goalDays++;
      const activeDays = new Set((malBy.get(em) || []).filter((r) => inWeek(r.activity_date, ws, we)).map((r) => String(r.activity_date).slice(0, 10))).size;
      const wt = (wtBy.get(em) || []).find((r) => String(r.logged_date) <= we);
      const compliance = proj.scheduled_count > 0 ? Math.min(100, Math.round(completed / proj.scheduled_count * 100)) : null;
      out.push({
        partner_id: c.partner_id, member_email: c.member_email, week_start: ws,
        week_index: proj.week_index, scheduled_count: proj.scheduled_count,
        completed_count: completed, cardio_count: cardioN, compliance_pct: compliance,
        nutrition_goal_days: goalDays, nutrition_logged_days: loggedDays, active_days: activeDays,
        last_msg_out: lastOut, last_msg_in: lastIn,
        weight_kg: wt ? Number(wt.weight_kg) : null,
        computed_at: now.toISOString()
      });
    }
  }

  if (dryRun) return json(req, 200, { ok: true, dry_run: true, partners: partnerIds.length, clients: clients.length, weeks: weekStarts, this_week: thisMon, rows: out.length, sample: out.slice(-3) });

  // Upsert in chunks on the PK.
  let written = 0;
  for (let i = 0; i < out.length; i += 500) {
    const chunk = out.slice(i, i + 500);
    const r = await fetch(SUPABASE_URL + '/rest/v1/coach_client_weekly?on_conflict=partner_id,member_email,week_start', {
      method: 'POST', headers: { ...H, 'Prefer': 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify(chunk)
    });
    if (!r.ok) return json(req, 500, { error: 'upsert_failed', status: r.status, detail: (await r.text()).slice(0, 300), written });
    written += chunk.length;
  }
  const resp: Row = { ok: true, dry_run: false, partners: partnerIds.length, clients: clients.length, weeks: weekStarts, this_week: thisMon, rows: written };
  if (!isCron) resp.data = out; // the portal wants the fresh rows back without a second read
  return json(req, 200, resp);
});
