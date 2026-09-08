// coach-automations v1 — PM-1077 Trainerize W2 (gap-map #64/#97 auto-message sequences,
// #69 scheduled messages, #83 membership lapse, #103 threshold alerts).
// 15-min cron (x-vyve-cron-key or service-role Bearer). Sweep-based like coach-notify: NO
// triggers on member hot-path tables. Four passes per run:
//   1. lapse    — coach_clients.lapsed_at stamped from members (canceled/unpaid/expired/paused,
//                 never for account_type=comp) and cleared on reactivation; coach notified once.
//                 is_coach_of() gates on lapsed_at, so coach data access ends server-side.
//   2. deliver  — coach_messages rows whose deliver_at has passed: created_at reset to now so
//                 they land in thread order on both sides, then coach-message-push (the insert
//                 trigger skipped them on purpose — migration tz_w2_auto_messages).
//   3. rules    — coach_auto_messages per active+consented+non-lapsed client. Event triggers
//                 (activation, first_*, n_workouts, checkin_submitted) fire on the next run;
//                 timed triggers (days_since_start, inactive, health_not_connected, birthday)
//                 fire once London time passes fire_at_local, inside 08:00–20:00. Dedupe via
//                 coach_auto_message_log.dedupe_key (own ledger — never pruned). Channel
//                 message → coach_messages row (push rides the existing trigger); email → Brevo.
//   4. alerts   — assignments.alerts {calorie_pct, every_meal} per client → coach notified
//                 (email/push per coach_notification_prefs.events.alert), keyed per day / 15-min.
// dry_run:true = detect + report, zero writes. Coach JWT + {action:'test', rule} = renders the
// rule for the coach and emails it to their own contact_email (never a client).
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SVC = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const BREVO_KEY = Deno.env.get('BREVO_API_KEY') ?? '';
const CRON_KEY = Deno.env.get('VYVE_CRON_KEY') ?? '';
const H = { 'Content-Type': 'application/json', 'apikey': SVC, 'Authorization': 'Bearer ' + SVC };
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-vyve-cron-key', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const j = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { ...CORS, 'Content-Type': 'application/json' } });
const SWEEP_ENABLED = true;               // one-line kill for every automated send
const SEND_WINDOW = { from: 8 * 60, to: 20 * 60 };   // London minutes, timed triggers only
const LAPSE_STATUSES = new Set(['canceled', 'unpaid', 'incomplete_expired', 'paused', 'expired']);
const TRIGGERS = ['activation', 'days_since_start', 'first_workout', 'first_cardio', 'first_meal', 'n_workouts', 'inactive', 'checkin_submitted', 'health_not_connected', 'birthday'];

function londonParts(d: Date) {
  const f = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false });
  const p: Record<string, string> = {};
  for (const x of f.formatToParts(d)) p[x.type] = x.value;
  return { date: p.year + '-' + p.month + '-' + p.day, minutes: (parseInt(p.hour) % 24) * 60 + parseInt(p.minute), md: p.month + '-' + p.day, year: p.year };
}
function dateDiffDays(a: string, b: string) { return Math.round((Date.parse(a + 'T00:00:00Z') - Date.parse(b + 'T00:00:00Z')) / 864e5); }
function hhmm(s: string) { const m = /^(\d{2}):(\d{2})$/.exec(String(s || '')); return m ? parseInt(m[1]) * 60 + parseInt(m[2]) : 9 * 60; }
async function get(path: string) { const r = await fetch(SUPABASE_URL + '/rest/v1/' + path, { headers: H }); return r.ok ? await r.json() : []; }
function inList(v: string[]) { return 'in.(' + v.map((e) => '"' + String(e).replace(/"/g, '') + '"').join(',') + ')'; }
function escHtml(s: unknown) { return String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string)); }
function fillVars(t: string, vars: Record<string, string>) { return String(t || '').replace(/{{\s*(first_name|coach_name|days)\s*}}/g, (_, k) => vars[k] || ''); }
function emailHtml(title: string, bodyTxt: string, coachName: string) {
  const paras = escHtml(bodyTxt).split(/\n{2,}/).map((p) => '<p style="margin:0 0 14px;font-size:14px;color:#3A5A5A;line-height:1.6;">' + p.replace(/\n/g, '<br/>') + '</p>').join('');
  return '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="margin:0;padding:0;background:#F4FAFA;font-family:Helvetica Neue,Arial,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#F4FAFA;padding:40px 20px;"><tr><td align="center"><table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;"><tr><td style="background:#0D2B2B;padding:24px 32px;"><div style="font-family:Georgia,serif;font-size:20px;letter-spacing:6px;color:#fff;">VYVE</div></td></tr><tr><td style="padding:32px;"><p style="margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#1B7878;">From ' + escHtml(coachName) + '</p><h2 style="margin:0 0 18px;font-size:20px;font-family:Georgia,serif;color:#0D2B2B;font-weight:400;">' + escHtml(title) + '</h2>' + paras + '<div style="text-align:center;margin:22px 0 6px;"><a href="https://online.vyvehealth.co.uk/coach-messages.html" style="background:#0D2B2B;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:14px;font-weight:600;display:inline-block;">Reply in the VYVE app &rarr;</a></div></td></tr><tr><td style="background:#F4FAFA;padding:20px 32px;border-top:1px solid #C8E4E4;"><p style="margin:0;font-size:12px;color:#7A9A9A;">VYVE Health CIC &middot; team@vyvehealth.co.uk &middot; ICO 00013608608</p></td></tr></table></td></tr></table></body></html>';
}
async function brevo(to: string, toName: string, subject: string, html: string, tags: string[]) {
  if (!BREVO_KEY || !to) return false;
  try {
    const r = await fetch('https://api.brevo.com/v3/smtp/email', { method: 'POST', headers: { 'api-key': BREVO_KEY, 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify({ sender: { name: 'VYVE Health', email: 'team@vyvehealth.co.uk' }, to: [{ email: to, name: toName || to }], subject, htmlContent: html, tags }) });
    if (!r.ok) console.warn('brevo failed', to, await r.text());
    return r.ok;
  } catch (e) { console.warn('brevo error', String(e)); return false; }
}
// ── coach-side notifications (lapse + alerts): same rails as coach-notify ──
const COACH_DEFAULTS: Record<string, { email: boolean; push: boolean }> = { lapsed: { email: true, push: true }, alert: { email: true, push: true } };
function coachPref(raw: any, kind: string) {
  const d = COACH_DEFAULTS[kind];
  const o = (raw && raw.events && raw.events[kind]) || {};
  return { email: typeof o.email === 'boolean' ? o.email : d.email, push: typeof o.push === 'boolean' ? o.push : d.push };
}
async function coachEmail(coach: any, subject: string, lines: string[]) {
  const items = lines.map((l) => '<li style="margin:0 0 8px;font-size:14px;color:#3A5A5A;line-height:1.6;">' + escHtml(l) + '</li>').join('');
  const html = '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="margin:0;padding:0;background:#F4FAFA;font-family:Helvetica Neue,Arial,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#F4FAFA;padding:40px 20px;"><tr><td align="center"><table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;"><tr><td style="background:#0D2B2B;padding:24px 32px;"><div style="font-family:Georgia,serif;font-size:20px;letter-spacing:6px;color:#fff;">VYVE</div></td></tr><tr><td style="padding:32px;"><h2 style="margin:0 0 14px;font-size:20px;font-family:Georgia,serif;color:#0D2B2B;font-weight:400;">' + escHtml(subject) + '</h2><ul style="margin:0 0 20px;padding-left:20px;">' + items + '</ul><div style="text-align:center;margin:10px 0 6px;"><a href="https://admin.vyvehealth.co.uk/coach-portal.html" style="background:#0D2B2B;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:14px;font-weight:600;display:inline-block;">Open your coach portal &rarr;</a></div><p style="margin:14px 0 0;font-size:12px;color:#7A9A9A;text-align:center;">Change which updates you receive under Profile &rarr; Settings.</p></td></tr><tr><td style="background:#F4FAFA;padding:20px 32px;border-top:1px solid #C8E4E4;"><p style="margin:0;font-size:12px;color:#7A9A9A;">VYVE Health CIC &middot; team@vyvehealth.co.uk &middot; ICO 00013608608</p></td></tr></table></td></tr></table></body></html>';
  return brevo(coach.contact_email, coach.name || 'Coach', 'VYVE coaching \u2014 ' + subject, html, ['coach-automations']);
}
async function coachPush(coach: any, body: string, route: string) {
  if (!coach.contact_email) return false;
  try {
    const r = await fetch(SUPABASE_URL + '/rest/v1/scheduled_pushes', { method: 'POST', headers: { ...H, 'Prefer': 'resolution=ignore-duplicates,return=minimal' }, body: JSON.stringify({ member_email: String(coach.contact_email).toLowerCase(), fire_at: new Date().toISOString(), type: 'coach_notify', title: 'Coaching update', body: body.slice(0, 160), data: { route }, dedupe_key: 'coach_auto:' + coach.id + ':' + Date.now() }) });
    return r.ok;
  } catch (_) { return false; }
}
async function notifyCoach(coach: any, kind: string, subject: string, lines: string[], route: string, dryRun: boolean) {
  const p = coachPref(coach.coach_notification_prefs, kind);
  if (dryRun) return { email: p.email, push: p.push };
  const out = { email: false, push: false };
  if (p.email) out.email = await coachEmail(coach, subject, lines);
  if (p.push) out.push = await coachPush(coach, lines[0] || subject, route);
  return out;
}
async function pushViaRelay(memberEmail: string, coachName: string, preview: string) {
  try {
    const r = await fetch(SUPABASE_URL + '/functions/v1/coach-message-push', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + SVC }, body: JSON.stringify({ member_email: memberEmail, coach_name: coachName, preview: preview.slice(0, 140) }) });
    return r.ok;
  } catch (_) { return false; }
}
async function callerEmail(req: Request) {
  const auth = req.headers.get('Authorization') || '';
  if (!auth.startsWith('Bearer ')) return null;
  const r = await fetch(SUPABASE_URL + '/auth/v1/user', { headers: { 'apikey': SVC, 'Authorization': auth } });
  if (!r.ok) return null;
  const u = await r.json();
  return String(u.email || '').toLowerCase().trim() || null;
}
async function coachForEmail(email: string) {
  const e = encodeURIComponent(email);
  const [pr, ar] = await Promise.all([
    get('partner_partners?contact_email=ilike.' + e + '&partner_type=eq.coach&select=id,name,contact_email&order=created_at.desc&limit=1'),
    get('admin_users?email=ilike.' + e + '&active=eq.true&role=in.(partner,admin,team)&select=role&limit=1')
  ]);
  return (pr.length && ar.length) ? pr[0] : null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  const key = req.headers.get('x-vyve-cron-key') || '';
  const bearer = (req.headers.get('Authorization') || '').replace('Bearer ', '');
  const isCron = (CRON_KEY && key === CRON_KEY) || (SVC && bearer === SVC);
  let body: any = {};
  try { body = await req.json(); } catch (_) { body = {}; }

  // ── coach JWT: test-send a rule to yourself ──
  if (!isCron) {
    const em = await callerEmail(req);
    if (!em) return j({ error: 'unauthorised' }, 401);
    const coach = await coachForEmail(em);
    if (!coach) return j({ error: 'not_a_coach' }, 403);
    if (body.action !== 'test') return j({ error: 'unknown_action' }, 400);
    const rule = body.rule || {};
    const vars = { first_name: (coach.name || 'Coach').split(' ')[0], coach_name: coach.name || 'Your coach', days: String(rule.offset_days || 5) };
    const subject = '[TEST] ' + fillVars(rule.subject || rule.name || 'Automation', vars);
    const txt = fillVars(rule.body || '', vars);
    if (!txt) return j({ error: 'empty_body' }, 400);
    const ok = await brevo(coach.contact_email, coach.name, subject, emailHtml(subject.replace('[TEST] ', ''), txt, coach.name || 'Your coach'), ['coach-automation-test']);
    return j({ success: ok, to: coach.contact_email, rendered: txt });
  }

  try {
    const dryRun = body.dry_run === true;
    const now = new Date();
    const nowIso = now.toISOString();
    const lon = londonParts(now);
    const cut30 = new Date(now.getTime() - 30 * 60000).toISOString();
    const cut24h = new Date(now.getTime() - 24 * 3600e3).toISOString();
    const cut48h = new Date(now.getTime() - 48 * 3600e3).toISOString();
    const report: any = { success: true, dry_run: dryRun, lapsed: [], reactivated: [], delivered: 0, rules_fired: [], alerts: [], errors: [] };

    // ── 2. deliver scheduled messages (independent of client state) ──
    if (dryRun) {
      const due = await get('coach_messages?deliver_at=lte.' + encodeURIComponent(nowIso) + '&select=id,partner_id,member_email');
      report.delivered = due.length;
    } else {
      const r = await fetch(SUPABASE_URL + '/rest/v1/coach_messages?deliver_at=lte.' + encodeURIComponent(nowIso), { method: 'PATCH', headers: { ...H, 'Prefer': 'return=representation' }, body: JSON.stringify({ deliver_at: null, created_at: nowIso }) });
      const rows = r.ok ? await r.json() : [];
      if (rows.length) {
        const pids = [...new Set(rows.map((x: any) => x.partner_id).filter(Boolean))];
        const ps = pids.length ? await get('partner_partners?id=in.(' + pids.join(',') + ')&select=id,name') : [];
        const nameById: Record<string, string> = {};
        for (const p of ps) nameById[p.id] = p.name;
        for (const m of rows) { if (m.sender === 'coach') await pushViaRelay(String(m.member_email).toLowerCase(), m.partner_id ? (nameById[m.partner_id] || 'Your coach') : 'VYVE team', m.body || ''); }
      }
      report.delivered = rows.length;
    }

    if (!SWEEP_ENABLED) return j({ ...report, note: 'sweep disabled' });

    // ── client universe ──
    const clients = await get('coach_clients?status=eq.active&consent_accepted_at=not.is.null&select=id,partner_id,member_email,consent_accepted_at,assignments,lapsed_at');
    if (!clients.length) return j({ ...report, clients: 0 });
    const emails = ([...new Set(clients.map((c: any) => String(c.member_email).toLowerCase()))] as string[]).slice(0, 400);
    const pids = [...new Set(clients.map((c: any) => c.partner_id))];
    const [members, coaches, rules] = await Promise.all([
      get('members?email=' + inList(emails) + '&select=email,first_name,dob,account_type,subscription_status,last_active_at,tdee_target,macro_override'),
      get('partner_partners?id=in.(' + pids.join(',') + ')&partner_type=eq.coach&select=id,name,contact_email,coach_notification_prefs'),
      get('coach_auto_messages?partner_id=in.(' + pids.join(',') + ')&enabled=eq.true&select=id,partner_id,key,name,trigger,offset_days,n,fire_at_local,channel,subject,body&order=sort.asc')
    ]);
    const memByEmail: Record<string, any> = {};
    for (const m of members) memByEmail[String(m.email).toLowerCase()] = m;
    const coachById: Record<string, any> = {};
    for (const c of coaches) coachById[c.id] = c;
    const rulesByPid: Record<string, any[]> = {};
    for (const r of rules) (rulesByPid[r.partner_id] = rulesByPid[r.partner_id] || []).push(r);

    // ── 1. lapse pass ──
    for (const c of clients) {
      const em = String(c.member_email).toLowerCase();
      const m = memByEmail[em];
      const coach = coachById[c.partner_id];
      if (!m || !coach) continue;
      const lapsedNow = m.account_type !== 'comp' && LAPSE_STATUSES.has(String(m.subscription_status || '').toLowerCase());
      const first = m.first_name || em;
      if (lapsedNow && !c.lapsed_at) {
        report.lapsed.push({ email: em, status: m.subscription_status });
        if (!dryRun) {
          await fetch(SUPABASE_URL + '/rest/v1/coach_clients?id=eq.' + c.id, { method: 'PATCH', headers: { ...H, 'Prefer': 'return=minimal' }, body: JSON.stringify({ lapsed_at: nowIso }) });
          await fetch(SUPABASE_URL + '/rest/v1/coach_client_events', { method: 'POST', headers: { ...H, 'Prefer': 'return=minimal' }, body: JSON.stringify({ partner_id: c.partner_id, member_email: em, kind: 'lapsed', label: 'VYVE membership lapsed (' + (m.subscription_status || 'expired') + ') \u2014 coaching paused', meta: { status: m.subscription_status } }) });
          await notifyCoach(coach, 'lapsed', first + "'s VYVE membership has lapsed", [first + "'s VYVE membership has lapsed (" + (m.subscription_status || 'expired') + '). Their plans, thread and history are kept; live data access and automations pause until they rejoin.'], '/index.html', false);
        }
        c.lapsed_at = nowIso;
      } else if (!lapsedNow && c.lapsed_at) {
        report.reactivated.push(em);
        if (!dryRun) {
          await fetch(SUPABASE_URL + '/rest/v1/coach_clients?id=eq.' + c.id, { method: 'PATCH', headers: { ...H, 'Prefer': 'return=minimal' }, body: JSON.stringify({ lapsed_at: null }) });
          await fetch(SUPABASE_URL + '/rest/v1/coach_client_events', { method: 'POST', headers: { ...H, 'Prefer': 'return=minimal' }, body: JSON.stringify({ partner_id: c.partner_id, member_email: em, kind: 'membership_reactivated', label: 'VYVE membership active again \u2014 coaching resumed' }) });
        }
        c.lapsed_at = null;
      }
    }
    const live = clients.filter((c: any) => !c.lapsed_at && memByEmail[String(c.member_email).toLowerCase()] && coachById[c.partner_id]);
    const liveEmails = [...new Set(live.map((c: any) => String(c.member_email).toLowerCase()))] as string[];

    // ── 3. rules ──
    const needAct = rules.some((r: any) => ['first_workout', 'first_cardio', 'first_meal', 'n_workouts', 'inactive', 'checkin_submitted', 'health_not_connected'].includes(r.trigger));
    let wos: any[] = [], cas: any[] = [], meals: any[] = [], cfr: any[] = [], hc: any[] = [];
    if (needAct && liveEmails.length) {
      const el = inList(liveEmails);
      [wos, cas, meals, cfr, hc] = await Promise.all([
        get('workouts?member_email=' + el + '&select=id,member_email,logged_at&order=logged_at.asc&limit=5000'),
        get('cardio?member_email=' + el + '&select=id,member_email,logged_at&order=logged_at.asc&limit=3000'),
        get('nutrition_logs?member_email=' + el + '&select=id,member_email,logged_at,activity_date,calories_kcal&order=logged_at.asc&limit=8000'),
        get('coach_form_responses?submitted_at=gte.' + encodeURIComponent(cut30) + '&select=id,form_id,partner_id,member_email'),
        get('member_health_connections?member_email=' + el + '&revoked_at=is.null&select=member_email')
      ]);
    }
    const ciKind: Record<string, string> = {};
    if (cfr.length) { const forms = await get('coach_forms?id=in.(' + [...new Set(cfr.map((r: any) => r.form_id))].join(',') + ')&select=id,kind'); for (const f of forms) ciKind[f.id] = f.kind; }
    const byMem = (rows: any[]) => { const o: Record<string, any[]> = {}; for (const r of rows) (o[String(r.member_email).toLowerCase()] = o[String(r.member_email).toLowerCase()] || []).push(r); return o; };
    const woBy = byMem(wos), caBy = byMem(cas), mealBy = byMem(meals), cfrBy = byMem(cfr);
    const hcSet = new Set(hc.map((r: any) => String(r.member_email).toLowerCase()));
    const inWindow = lon.minutes >= SEND_WINDOW.from && lon.minutes < SEND_WINDOW.to;

    type Fire = { c: any; rule: any; key: string; vars: Record<string, string> };
    const fires: Fire[] = [];
    for (const c of live) {
      const em = String(c.member_email).toLowerCase();
      const m = memByEmail[em];
      const coach = coachById[c.partner_id];
      const consentIso = c.consent_accepted_at;
      const consentDate = londonParts(new Date(consentIso)).date;
      const daysIn = dateDiffDays(lon.date, consentDate);
      const first = m.first_name || 'there';
      const base = { first_name: first, coach_name: coach.name || 'Your coach', days: '' };
      const since = (rows: any[]) => rows.filter((r) => r.logged_at && r.logged_at >= consentIso);
      for (const r of rulesByPid[c.partner_id] || []) {
        const timedOk = inWindow && lon.minutes >= hhmm(r.fire_at_local);
        const k = 'auto:' + r.id + ':' + em;
        switch (r.trigger) {
          case 'activation':
            if (consentIso >= cut48h) fires.push({ c, rule: r, key: k, vars: base });
            break;
          case 'days_since_start':
            if (daysIn === (r.offset_days || 0) && (r.offset_days === 0 ? true : timedOk)) fires.push({ c, rule: r, key: k, vars: base });
            break;
          case 'first_workout': { const w = since(woBy[em] || [])[0]; if (w && w.logged_at >= cut24h) fires.push({ c, rule: r, key: k, vars: base }); break; }
          case 'first_cardio': { const w = since(caBy[em] || [])[0]; if (w && w.logged_at >= cut24h) fires.push({ c, rule: r, key: k, vars: base }); break; }
          case 'first_meal': { const w = since(mealBy[em] || [])[0]; if (w && w.logged_at >= cut24h) fires.push({ c, rule: r, key: k, vars: base }); break; }
          case 'n_workouts': { const n = r.n || 10; const list = since(woBy[em] || []); const w = list[n - 1]; if (w && w.logged_at >= cut24h) fires.push({ c, rule: r, key: k + ':' + n, vars: base }); break; }
          case 'inactive': {
            const days = r.offset_days || 5;
            const last = m.last_active_at || consentIso;
            const lastDate = londonParts(new Date(last)).date;
            const quiet = dateDiffDays(lon.date, lastDate);
            if (quiet >= days && timedOk) fires.push({ c, rule: r, key: k + ':' + lastDate, vars: { ...base, days: String(quiet) } });
            break;
          }
          case 'checkin_submitted':
            for (const resp of cfrBy[em] || []) if (resp.partner_id === c.partner_id && ciKind[resp.form_id] === 'checkin') fires.push({ c, rule: r, key: k + ':' + resp.id, vars: base });
            break;
          case 'health_not_connected':
            if (daysIn >= (r.offset_days || 2) && !hcSet.has(em) && timedOk) fires.push({ c, rule: r, key: k, vars: base });
            break;
          case 'birthday': {
            const dob = String(m.dob || '').slice(5, 10);
            if (dob && dob === lon.md && timedOk) fires.push({ c, rule: r, key: k + ':' + lon.year, vars: base });
            break;
          }
        }
      }
    }
    if (dryRun) {
      report.rules_fired = fires.map((f) => ({ email: f.c.member_email, rule: f.rule.name, trigger: f.rule.trigger, key: f.key, channel: f.rule.channel, preview: fillVars(f.rule.body, f.vars).slice(0, 120) }));
    } else if (fires.length) {
      const ins = await fetch(SUPABASE_URL + '/rest/v1/coach_auto_message_log?on_conflict=dedupe_key', { method: 'POST', headers: { ...H, 'Prefer': 'resolution=ignore-duplicates,return=representation' }, body: JSON.stringify(fires.map((f) => ({ partner_id: f.c.partner_id, member_email: String(f.c.member_email).toLowerCase(), rule_id: f.rule.id, rule_name: f.rule.name, channel: f.rule.channel, dedupe_key: f.key }))) });
      const landed = ins.ok ? await ins.json() : [];
      const freshKeys: Record<string, number> = {};
      for (const l of landed) freshKeys[l.dedupe_key] = l.id;
      for (const f of fires) {
        if (freshKeys[f.key] === undefined) continue;
        const em = String(f.c.member_email).toLowerCase();
        const coach = coachById[f.c.partner_id];
        const txt = fillVars(f.rule.body, f.vars);
        const subj = fillVars(f.rule.subject || f.rule.name, f.vars);
        let msgId: string | null = null, emailed = false;
        if (f.rule.channel === 'message' || f.rule.channel === 'both') {
          const mw = await fetch(SUPABASE_URL + '/rest/v1/coach_messages', { method: 'POST', headers: { ...H, 'Prefer': 'return=representation' }, body: JSON.stringify({ partner_id: f.c.partner_id, member_email: em, sender: 'coach', body: txt }) });
          if (mw.ok) { const rows = await mw.json(); msgId = rows[0] && rows[0].id; } else report.errors.push('message ' + f.key + ': ' + (await mw.text()).slice(0, 120));
        }
        if (f.rule.channel === 'email' || f.rule.channel === 'both') emailed = await brevo(em, f.vars.first_name, subj, emailHtml(subj, txt, coach.name || 'Your coach'), ['coach-automation', f.rule.trigger]);
        await fetch(SUPABASE_URL + '/rest/v1/coach_auto_message_log?id=eq.' + freshKeys[f.key], { method: 'PATCH', headers: { ...H, 'Prefer': 'return=minimal' }, body: JSON.stringify({ message_id: msgId, channel: (msgId && emailed) ? 'both' : msgId ? 'message' : emailed ? 'email' : 'failed' }) });
        report.rules_fired.push({ email: em, rule: f.rule.name, message_id: msgId, emailed });
      }
    }

    // ── 4. threshold alerts ──
    const alertClients = live.filter((c: any) => c.assignments && c.assignments.alerts && (c.assignments.alerts.calorie_pct || c.assignments.alerts.every_meal));
    if (alertClients.length) {
      if (!meals.length) meals = await get('nutrition_logs?member_email=' + inList(alertClients.map((c: any) => String(c.member_email).toLowerCase())) + '&activity_date=eq.' + lon.date + '&select=id,member_email,logged_at,activity_date,calories_kcal');
      const todayBy = byMem(meals.filter((r: any) => r.activity_date === lon.date));
      const bucket = Math.floor(now.getTime() / (15 * 60000));
      type Al = { coach: any; key: string; line: string; email: string };
      const als: Al[] = [];
      for (const c of alertClients) {
        const em = String(c.member_email).toLowerCase();
        const m = memByEmail[em], coach = coachById[c.partner_id], a = c.assignments.alerts;
        const first = m.first_name || em;
        const rows = todayBy[em] || [];
        if (a.calorie_pct) {
          const target = (m.macro_override && Number(m.macro_override.calories)) || Number(m.tdee_target) || 0;
          const kcal = rows.reduce((s: number, r: any) => s + (Number(r.calories_kcal) || 0), 0);
          if (target > 0 && kcal >= target * (Number(a.calorie_pct) / 100)) als.push({ coach, email: em, key: 'alert:cal:' + em + ':' + lon.date, line: first + ' is at ' + Math.round(kcal) + ' kcal today \u2014 ' + Math.round(kcal / target * 100) + '% of their ' + Math.round(target) + ' kcal target (your alert is set at ' + a.calorie_pct + '%).' });
        }
        if (a.every_meal) {
          const recent = rows.filter((r: any) => r.logged_at >= new Date(now.getTime() - 15 * 60000).toISOString());
          if (recent.length) als.push({ coach, email: em, key: 'alert:meal:' + em + ':' + bucket, line: first + ' logged ' + recent.length + ' food item' + (recent.length === 1 ? '' : 's') + ' just now (' + Math.round(recent.reduce((s: number, r: any) => s + (Number(r.calories_kcal) || 0), 0)) + ' kcal).' });
        }
      }
      if (dryRun) report.alerts = als.map((a) => ({ email: a.email, key: a.key, line: a.line }));
      else if (als.length) {
        const ins = await fetch(SUPABASE_URL + '/rest/v1/coach_auto_message_log?on_conflict=dedupe_key', { method: 'POST', headers: { ...H, 'Prefer': 'resolution=ignore-duplicates,return=representation' }, body: JSON.stringify(als.map((a) => ({ partner_id: a.coach.id, member_email: a.email, rule_name: 'alert', channel: 'coach', dedupe_key: a.key }))) });
        const landed = ins.ok ? await ins.json() : [];
        const fresh = new Set(landed.map((l: any) => l.dedupe_key));
        const byCoach: Record<string, Al[]> = {};
        for (const a of als) if (fresh.has(a.key)) (byCoach[a.coach.id] = byCoach[a.coach.id] || []).push(a);
        for (const pid of Object.keys(byCoach)) {
          const list = byCoach[pid];
          const r = await notifyCoach(list[0].coach, 'alert', list.length === 1 ? 'Client alert' : list.length + ' client alerts', list.map((a) => a.line), '/index.html', false);
          report.alerts.push({ coach: pid, count: list.length, ...r });
        }
      }
    }
    report.clients = clients.length;
    report.live = live.length;
    return j(report);
  } catch (err) {
    console.error('coach-automations error:', err);
    return j({ error: String(err).slice(0, 400) }, 500);
  }
});
