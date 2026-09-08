// coach-provision-client v15 — PM-1089 Trainerize W5 (programme scheduling):
//  (1) META_KEYS +workout_queue +schedule_overrides (both PROTECTED — merge, never replace).
//  (2) GATES typed: load_calc/exercise_library/own_workouts/water_tracker/vyve_library booleans,
//      messaging two_way|one_way|off, look_ahead_weeks 0|1|2|4|99, reschedule strict|loose. Coach defaults live on
//      partner_partners.coach_ui_prefs.gate_defaults (portal own-row PATCH, §23.237) and seed `gates` on create/bulk.
//  (3) update_assignments += workout_queue [{template_id, start_on:'on_end'|'YYYY-MM-DD'}] (≤5, workout pool only),
//      schedule_overrides {'<ISO>': {to}|{skip:true}} (≤200, explicit null clears), week_start (PATCHes the active
//      coach workout_plan_cache row — the "Programme starts" control; null ignored).
//  (4) NEW action apply_gate_defaults — copies coach_ui_prefs.gate_defaults onto every non-archived client (merge).
//  (5) NEW cron action sweep_workout_queue (job coach-workout-queue-daily 00:20 UTC): pops the head of each live
//      client's queue when due (dated start ≤ today London, or 'on_end' once the active coach plan has ended —
//      calendar end for week_start rows, generated_at + weeks for legacy rows, immediately when no plan is active),
//      re-applies with p_week_start = the Monday of the start, fires the plan-change email/push through the same
//      PLAN_CHANGE_NOTIFY flag, logs phase_started. Also raises the coach `phase_ending` notify (7 days before a
//      calendar plan ends with an empty queue; deduped on coach_client_events meta.wpc_id).
// coach-provision-client v14 — PM-1077 Trainerize W2: META_KEYS +alerts (per-client threshold alerts
//  {calorie_pct, every_meal} read by the coach-automations sweep), _meta.welcome_attachments[] (≤4
//  coach-content paths; invite email links every attachment alongside the legacy welcome_pack_path),
//  save_notify_prefs whitelist +lapsed/+alert. No other behaviour changes.
// coach-provision-client v13 — W5 plan-change notification (5 September 2026):
//  fireAutomations now ALSO queues one scheduled_pushes row per changed plan slot for an
//  active+consented client (type plan_change, data.url → Workouts/Habits/Nutrition). send-push
//  turns that one row into the bell entry + web/native push — never insert member_notifications
//  here. Gated by PLAN_CHANGE_NOTIFY (off until Lewis approves the copy); update_assignments and
//  batch_apply accept {notify:true|false} to override. The automation email/message path is
//  unchanged; a queued push is reported as '<event>:push' in the automations list.
// coach-provision-client v12 — PM-1035 W4b (coach-side tags + batch assign + revert):
//  (1) update_assignments accepts merge_slots:true — absent slot keys are KEPT, an explicit
//      null/'' clears. Fixes the latent list "Assign to…" wipe (the modals send one slot and
//      the wholesale-replace path dropped every other slot). Plans-tab callers unchanged.
//  (2) NEW tag actions: set_client_tags {email, tags[]} (replacement set, ≤20, own client only),
//      rename_tag {from,to} (case-insensitive, merges), delete_tag {tag}. Reads are direct
//      PostgREST on coach_client_tags (own-partner RLS).
//  (3) NEW batch actions: batch_dry_run / batch_apply / batch_revert / list_batches —
//      one slot, one template, N own clients (cap 100, archived refused). Apply writes a
//      coach_batches header + one coach_batch_rows line per client with the exact prior
//      state (slot value, active workout_plan_cache row + week). Active+consented clients
//      materialise + get the automation email; invited clients get the slot set (lands on
//      accept). Revert is per row and conditional: slot still holds the batch value → restore
//      prior; workout slot restores the PRIOR wpc row (week preserved) instead of re-applying;
//      anything changed since → skipped changed_since_batch.
// v11 — PM-990 Wave 7: save_profile + save_notify_prefs. v10 — PM-987 Wave 5: META_KEYS +habit_note/water_goal/gates,
//   update_assignments water_goal + gates, coach_client_events feed. v9 — PM-983 Wave 1: create meta, MERGE of meta keys,
//   update_client, send_scheduled_invites cron, welcome-pack link. v8 — PM-960d: automations honour channel.
// v7 — PM-958g automations. v6 — PM-958 team role + program slot. v5 — PM-956 update_assignments.
// v4 — PM-954i pretty invite links. v3 — PM-954h attribution hotfix. v2 — PM-954d bulk + assignments.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SVC = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const BREVO_KEY = Deno.env.get('BREVO_API_KEY') ?? '';
const CRON_KEY = Deno.env.get('VYVE_CRON_KEY') ?? '';
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-vyve-cron-key', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const H = { 'Content-Type': 'application/json', 'apikey': SVC, 'Authorization': 'Bearer ' + SVC };
const j = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { ...CORS, 'Content-Type': 'application/json' } });
const prettyLink = (code) => 'https://www.vyvehealth.co.uk/start/' + code;
const newCode = () => crypto.randomUUID().replace(/-/g, '').slice(0, 12).toLowerCase();

// PM-983: assignment keys that are NOT template slots and must survive slot saves.
// PM-987: + habit_note (apply-written), water_goal, gates (Wave 5 slim #46). W5: + workout_queue, schedule_overrides.
const META_KEYS = ['checkin_day', 'checkin_frequency', '_meta', '_invite_send_at', 'habit_note', 'water_goal', 'gates', 'alerts', 'workout_queue', 'schedule_overrides'];
// W5 (#99): typed gate spec. Booleans, enums, and the look-ahead set. Unset = the member app's defaults
// (two_way / +1 week / loose / everything shown) — the same defaults the portal renders when a key is absent.
const GATE_BOOL = ['load_calc', 'exercise_library', 'own_workouts', 'water_tracker', 'vyve_library'];
const GATE_ENUM = { messaging: ['two_way', 'one_way', 'off'], reschedule: ['strict', 'loose'] };
const LOOK_AHEAD = [0, 1, 2, 4, 99];
const QUEUE_CAP = 5;
const OVERRIDE_CAP = 200;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const SLOT_LABEL = { onboarding_form_id: 'onboarding questionnaire', checkin_form_id: 'check-in form', habits_template_id: 'habits plan', workout_template_id: 'workout plan', nutrition_template_id: 'nutrition plan', supplements_template_id: 'supplement plan' };
const FREQS = ['weekly', 'fortnightly', 'monthly'];
// PM-990 Wave 7: coach profile jsonb whitelist + notification event kinds.
const PROFILE_TEXT_KEYS = { phone: 40, website: 200, facebook: 200, instagram: 200, services: 1000, target_customer: 500, welcome_video_url: 300 };
const NOTIFY_EVENTS = ['checkin', 'message', 'workout', 'cardio', 'habits', 'phase_ending', 'inactive5', 'lapsed', 'alert'];

// ── W5 plan-change push (member-facing; copy placeholder until Lewis signs it off) ──
// One scheduled_pushes row per changed slot, fire_at=now(); process-scheduled-pushes → send-push
// writes the bell row (route from data.url) + web/native push. This is the ONLY write.
const PLAN_CHANGE_NOTIFY = false; // [LEWIS COPY PASS] flip to true once approved
const PLAN_CHANGE_PUSH = {
  workout_updated: { title: '{{coach_name}} updated your training plan', body: '"{{plan_name}}" is live in your VYVE app. Open Workouts to see what\u2019s changed.', url: '/workouts.html' },
  habits_updated: { title: '{{coach_name}} updated your daily habits', body: '"{{plan_name}}" is live in your VYVE app. Open Habits to get started.', url: '/habits.html' },
  nutrition_updated: { title: '{{coach_name}} updated your nutrition targets', body: '"{{plan_name}}" now sets your calories and macros. Open Nutrition to see them.', url: '/nutrition.html' },
  supplements_updated: { title: '{{coach_name}} updated your supplement plan', body: '"{{plan_name}}" is live under Nutrition in your VYVE app.', url: '/nutrition.html' }
};
function notifyWanted(body) {
  if (body && body.notify === true) return true;
  if (body && body.notify === false) return false;
  return PLAN_CHANGE_NOTIFY;
}
async function queuePlanChangePush(memberEmail, event, vars, dedupeSuffix, partnerId) {
  const copy = PLAN_CHANGE_PUSH[event];
  if (!copy) return false;
  const day = new Date().toISOString().slice(0, 10);
  const row = { member_email: memberEmail, fire_at: new Date().toISOString(), type: 'plan_change', title: fillVars(copy.title, vars).slice(0, 120), body: fillVars(copy.body, vars).slice(0, 300), data: { url: copy.url, kind: event, template_name: vars.plan_name || null, coach: vars.coach_name || null, partner_id: partnerId }, dedupe_key: 'plan_change:coach:' + dedupeSuffix + ':' + day };
  try {
    const r = await fetch(SUPABASE_URL + '/rest/v1/scheduled_pushes?on_conflict=member_email,dedupe_key', { method: 'POST', headers: { ...H, 'Prefer': 'resolution=ignore-duplicates,return=minimal' }, body: JSON.stringify(row) });
    if (!r.ok) { console.warn('plan_change push queue failed', event, await r.text()); return false; }
    return true;
  } catch (e) { console.warn('plan_change push queue error', event, String(e)); return false; }
}

// PM-987: persistent per-client event feed — best-effort, never blocks the action.
async function logEvents(partnerId, memberEmail, events) {
  if (!events.length) return;
  try {
    await fetch(SUPABASE_URL + '/rest/v1/coach_client_events', { method: 'POST', headers: { ...H, 'Prefer': 'return=minimal' }, body: JSON.stringify(events.map((e) => ({ partner_id: partnerId, member_email: memberEmail, kind: e.kind, label: String(e.label).slice(0, 300), meta: e.meta || null }))) });
  } catch (_) { /* feed is advisory */ }
}

async function callerEmail(req) {
  const auth = req.headers.get('Authorization') || '';
  const r = await fetch(SUPABASE_URL + '/auth/v1/user', { headers: { 'apikey': SVC, 'Authorization': auth } });
  if (!r.ok) return null;
  const u = await r.json();
  return String(u.email || '').toLowerCase().trim() || null;
}
async function resolvePartner(email) {
  const e = encodeURIComponent(email);
  const [pr, ar] = await Promise.all([
    fetch(SUPABASE_URL + '/rest/v1/partner_partners?contact_email=ilike.' + e + '&select=id,name,slug,status,coach_ui_prefs&order=created_at.desc&limit=1', { headers: H }),
    fetch(SUPABASE_URL + '/rest/v1/admin_users?email=ilike.' + e + '&active=eq.true&role=in.(partner,admin,team)&select=role&limit=1', { headers: H })
  ]);
  const ps = pr.ok ? await pr.json() : [], as = ar.ok ? await ar.json() : [];
  if (!ps.length || !as.length) return null;
  return ps[0];
}
async function loadLibraries(partnerId) {
  const [tr, fr] = await Promise.all([
    fetch(SUPABASE_URL + '/rest/v1/coach_templates?partner_id=eq.' + partnerId + '&active=eq.true&select=id,kind,name', { headers: H }),
    fetch(SUPABASE_URL + '/rest/v1/coach_forms?partner_id=eq.' + partnerId + '&active=eq.true&select=id,kind,title,is_default', { headers: H })
  ]);
  const tpls = tr.ok ? await tr.json() : [], forms = fr.ok ? await fr.json() : [];
  return { tpls, forms };
}
// W5: validate a gates object → only recognised keys with recognised values survive. Returns null when nothing valid.
function cleanGates(src) {
  if (!src || typeof src !== 'object') return null;
  const g = {};
  for (const k of GATE_BOOL) if (typeof src[k] === 'boolean') g[k] = src[k];
  for (const k of Object.keys(GATE_ENUM)) if (typeof src[k] === 'string' && GATE_ENUM[k].includes(src[k])) g[k] = src[k];
  if (src.look_ahead_weeks !== undefined && src.look_ahead_weeks !== null) { const n = parseInt(src.look_ahead_weeks); if (LOOK_AHEAD.includes(n)) g.look_ahead_weeks = n; }
  return Object.keys(g).length ? g : null;
}
function gateDefaults(partner) {
  const p = partner && partner.coach_ui_prefs && typeof partner.coach_ui_prefs === 'object' ? partner.coach_ui_prefs : {};
  return cleanGates(p.gate_defaults) || null;
}
// W5: validate the next-phase queue. Only workout-pool templates, ≤5, start_on = 'on_end' | ISO date.
function cleanQueue(src, lib) {
  if (!Array.isArray(src)) return { queue: [], errors: ['workout_queue must be an array'] };
  const pool = new Set(lib.tpls.filter((t) => t.kind === 'workout' || t.kind === 'program').map((t) => t.id));
  const out = [], errors = [];
  for (const it of src.slice(0, QUEUE_CAP)) {
    const id = String((it && it.template_id) || '').trim();
    if (!pool.has(id)) { errors.push('workout_queue: ' + (id || '(empty)') + ' is not one of your workout plans'); continue; }
    let so = String((it && it.start_on) || 'on_end').trim();
    if (so !== 'on_end' && !ISO_DATE.test(so)) { errors.push('workout_queue: start_on must be on_end or YYYY-MM-DD'); continue; }
    out.push({ template_id: id, start_on: so });
  }
  if (src.length > QUEUE_CAP) errors.push('workout_queue: max ' + QUEUE_CAP + ' items');
  return { queue: out, errors };
}
// W5: validate schedule overrides. Keys ISO dates; values {to:'ISO'} or {skip:true}. Anything else dropped.
function cleanOverrides(src) {
  if (!src || typeof src !== 'object' || Array.isArray(src)) return {};
  const out = {};
  for (const k of Object.keys(src).slice(0, OVERRIDE_CAP)) {
    if (!ISO_DATE.test(k)) continue;
    const v = src[k];
    if (!v || typeof v !== 'object') continue;
    if (v.skip === true) { out[k] = { skip: true, by: v.by === 'member' ? 'member' : 'coach', at: typeof v.at === 'string' ? v.at : new Date().toISOString() }; continue; }
    if (typeof v.to === 'string' && ISO_DATE.test(v.to) && v.to !== k) out[k] = { to: v.to, by: v.by === 'member' ? 'member' : 'coach', at: typeof v.at === 'string' ? v.at : new Date().toISOString() };
  }
  return out;
}
// PM-983: validate + normalise the non-slot assignment fields from a client payload.
function metaFromSpec(spec) {
  const out = {};
  if (!spec || typeof spec !== 'object') return out;
  if (spec.checkin_day !== undefined && spec.checkin_day !== null && String(spec.checkin_day) !== '') {
    const d = parseInt(spec.checkin_day);
    if (!isNaN(d) && d >= 0 && d <= 6) out.checkin_day = d; // 0=Mon .. 6=Sun (portal convention)
  }
  if (spec.checkin_frequency && FREQS.includes(String(spec.checkin_frequency))) out.checkin_frequency = String(spec.checkin_frequency);
  const m = {};
  if (spec.phone && String(spec.phone).trim()) m.phone = String(spec.phone).trim().slice(0, 40);
  if (spec.weight_unit && ['kg', 'lb', 'st'].includes(String(spec.weight_unit))) m.weight_unit = String(spec.weight_unit);
  if (spec.welcome_pack_path && String(spec.welcome_pack_path).trim()) m.welcome_pack_path = String(spec.welcome_pack_path).trim().slice(0, 300);
  // W2 (#97): up to four welcome attachments (coach-content bucket paths). Explicit [] clears.
  if (Array.isArray(spec.welcome_attachments)) m.welcome_attachments = spec.welcome_attachments.map((p) => String(p || '').trim().slice(0, 300)).filter(Boolean).slice(0, 4);
  if (Object.keys(m).length) out._meta = m;
  return out;
}
function resolveAssignments(spec, lib, partner) {
  if (!spec || typeof spec !== 'object') spec = {};
  const out = {}, errors = [];
  const slotMap = {
    onboarding: { key: 'onboarding_form_id', pool: lib.forms.filter((f) => f.kind === 'onboarding'), label: (x) => x.title },
    checkin: { key: 'checkin_form_id', pool: lib.forms.filter((f) => f.kind === 'checkin'), label: (x) => x.title },
    habits: { key: 'habits_template_id', pool: lib.tpls.filter((t) => t.kind === 'habits'), label: (x) => x.name },
    workout: { key: 'workout_template_id', pool: lib.tpls.filter((t) => t.kind === 'workout' || t.kind === 'program'), label: (x) => x.name },
    nutrition: { key: 'nutrition_template_id', pool: lib.tpls.filter((t) => t.kind === 'nutrition'), label: (x) => x.name },
    supplements: { key: 'supplements_template_id', pool: lib.tpls.filter((t) => t.kind === 'supplements'), label: (x) => x.name }
  };
  for (const slot of Object.keys(slotMap)) {
    const raw = String(spec[slot] || '').trim();
    if (!raw) continue;
    const { key, pool, label } = slotMap[slot];
    const hit = pool.find((x) => x.id === raw) || pool.find((x) => label(x).toLowerCase() === raw.toLowerCase());
    if (hit) out[key] = hit.id;
    else errors.push(slot + ': no saved item called "' + raw + '"');
  }
  // PM-983: carry validated meta fields through create/bulk too.
  Object.assign(out, metaFromSpec(spec));
  // W5: gates from the spec, else the coach's defaults (Settings › Client permissions).
  const g = cleanGates(spec.gates) || gateDefaults(partner);
  if (g) out.gates = g;
  return { assignments: out, errors };
}
async function applyAssignments(partnerId, memberEmail, weekStart) {
  const args = { p_partner_id: partnerId, p_member_email: memberEmail };
  if (weekStart && ISO_DATE.test(weekStart)) args.p_week_start = weekStart;
  const r = await fetch(SUPABASE_URL + '/rest/v1/rpc/coach_apply_assignments', {
    method: 'POST', headers: H, body: JSON.stringify(args)
  });
  if (!r.ok) return { error: 'apply_failed: ' + (await r.text()).slice(0, 200) };
  return await r.json();
}

// ── PM-958g automations (PM-960d: channel-aware) ──
const AUTO_EVENTS = {
  workout_template_id: 'workout_updated',
  habits_template_id: 'habits_updated',
  nutrition_template_id: 'nutrition_updated',
  supplements_template_id: 'supplements_updated'
};
const AUTO_DEFAULTS = {
  workout_updated: { subject: '{{coach_name}} updated your training plan', body: 'Hi {{first_name}},\n\n{{coach_name}} has just updated your training \u2014 "{{plan_name}}" is live in your VYVE app now. Open Workouts to see what\u2019s changed.\n\nKeep going,\nVYVE Health' },
  habits_updated: { subject: '{{coach_name}} updated your daily habits', body: 'Hi {{first_name}},\n\n{{coach_name}} has refreshed your daily habits \u2014 "{{plan_name}}" is live in your VYVE app. They\u2019ll appear on your habits screen from today.\n\nKeep going,\nVYVE Health' },
  nutrition_updated: { subject: '{{coach_name}} updated your nutrition targets', body: 'Hi {{first_name}},\n\n{{coach_name}} has updated your nutrition \u2014 "{{plan_name}}" now sets your calories and macros in the VYVE app. Open Nutrition to see your new targets.\n\nKeep going,\nVYVE Health' },
  supplements_updated: { subject: '{{coach_name}} updated your supplement plan', body: 'Hi {{first_name}},\n\n{{coach_name}} has updated your supplement plan \u2014 "{{plan_name}}" is live in your VYVE app under Nutrition.\n\nKeep going,\nVYVE Health' }
};
function fillVars(t, vars) {
  return String(t || '').replace(/{{\s*(first_name|coach_name|plan_name)\s*}}/g, (_, k) => vars[k] || '');
}
function escHtml(s) {
  return String(s || '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}
// W5: `notify` (7th arg) queues a plan_change push per changed slot alongside the email/message automation.
async function fireAutomations(partner, clientEmail, changedKeys, lib, oldAsg, newAsg, notify) {
  if (!changedKeys.length) return [];
  let firstName = 'there';
  try {
    const mr = await fetch(SUPABASE_URL + '/rest/v1/members?email=ilike.' + encodeURIComponent(clientEmail) + '&select=first_name&limit=1', { headers: H });
    const ms = mr.ok ? await mr.json() : [];
    if (ms[0] && ms[0].first_name) firstName = ms[0].first_name;
  } catch (_) { /* default stands */ }
  let rows = [];
  try {
    const ar = await fetch(SUPABASE_URL + '/rest/v1/coach_automations?partner_id=eq.' + partner.id + '&select=event,enabled,subject,body,channel', { headers: H });
    rows = ar.ok ? await ar.json() : [];
  } catch (_) { /* defaults stand */ }
  const byEvent = {};
  rows.forEach((r) => { byEvent[r.event] = r; });
  const sent = [];
  for (const key of changedKeys) {
    const event = AUTO_EVENTS[key];
    if (!event) continue;
    const cfg = byEvent[event];
    if (cfg && cfg.enabled === false) continue;
    const tplId = newAsg[key];
    if (!tplId) continue; // slot cleared, not updated — no send
    const tpl = lib.tpls.find((t) => t.id === tplId);
    const vars = { first_name: firstName, coach_name: partner.name || 'Your coach', plan_name: (tpl && tpl.name) || 'your plan' };
    const subject = fillVars((cfg && cfg.subject) || AUTO_DEFAULTS[event].subject, vars);
    const bodyTxt = fillVars((cfg && cfg.body) || AUTO_DEFAULTS[event].body, vars);
    const channel = (cfg && cfg.channel) || 'email';
    const wantEmail = channel === 'email' || channel === 'both';
    const wantMsg = channel === 'message' || channel === 'both';
    let delivered = false;
    if (wantEmail && BREVO_KEY) {
      const bodyHtml = '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="margin:0;padding:0;background:#F4FAFA;font-family:Helvetica Neue,Arial,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#F4FAFA;padding:40px 20px;"><tr><td align="center"><table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;"><tr><td style="background:#0D2B2B;padding:24px 32px;"><div style="font-family:Georgia,serif;font-size:20px;letter-spacing:6px;color:#fff;">VYVE</div></td></tr><tr><td style="padding:32px;"><p style="margin:0;font-size:15px;color:#3A5A5A;line-height:1.7;white-space:pre-line;">' + escHtml(bodyTxt) + '</p><div style="text-align:center;margin:26px 0 6px;"><a href="https://online.vyvehealth.co.uk" style="background:#0D2B2B;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:14px;font-weight:600;display:inline-block;">Open the VYVE app &rarr;</a></div></td></tr><tr><td style="background:#F4FAFA;padding:20px 32px;border-top:1px solid #C8E4E4;"><p style="margin:0;font-size:12px;color:#7A9A9A;">VYVE Health CIC &middot; team@vyvehealth.co.uk &middot; ICO 00013608608</p></td></tr></table></td></tr></table></body></html>';
      try {
        const r = await fetch('https://api.brevo.com/v3/smtp/email', { method: 'POST', headers: { 'api-key': BREVO_KEY, 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify({ sender: { name: 'VYVE Health', email: 'team@vyvehealth.co.uk' }, to: [{ email: clientEmail, name: firstName }], subject, htmlContent: bodyHtml, tags: ['coach-automation', event] }) });
        if (r.ok) delivered = true; else console.warn('automation email failed', event, await r.text());
      } catch (e) { console.warn('automation email error', event, String(e)); }
    }
    if (wantMsg) {
      try {
        const mw = await fetch(SUPABASE_URL + '/rest/v1/coach_messages', { method: 'POST', headers: { ...H, 'Prefer': 'return=minimal' }, body: JSON.stringify({ partner_id: partner.id, member_email: clientEmail, sender: 'coach', body: bodyTxt }) });
        if (mw.ok) delivered = true; else console.warn('automation message failed', event, await mw.text());
      } catch (e) { console.warn('automation message error', event, String(e)); }
    }
    if (delivered) sent.push(event);
    // W5: push + bell entry rides the same change detection; independent of the email/message outcome.
    if (notify && await queuePlanChangePush(clientEmail, event, vars, key + ':' + tplId, partner.id)) sent.push(event + ':push');
  }
  return sent;
}

// ── W5: coach-side notify (phase_ending) — same rails as coach-automations ──
const COACH_DEFAULTS = { phase_ending: { email: true, push: true } };
function coachPref(raw, kind) {
  const d = COACH_DEFAULTS[kind] || { email: true, push: true };
  const o = (raw && raw.events && raw.events[kind]) || {};
  return { email: typeof o.email === 'boolean' ? o.email : d.email, push: typeof o.push === 'boolean' ? o.push : d.push };
}
async function coachEmail(coach, subject, lines) {
  if (!BREVO_KEY || !coach.contact_email) return false;
  const items = lines.map((l) => '<li style="margin:0 0 8px;font-size:14px;color:#3A5A5A;line-height:1.6;">' + escHtml(l) + '</li>').join('');
  const html = '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="margin:0;padding:0;background:#F4FAFA;font-family:Helvetica Neue,Arial,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#F4FAFA;padding:40px 20px;"><tr><td align="center"><table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;"><tr><td style="background:#0D2B2B;padding:24px 32px;"><div style="font-family:Georgia,serif;font-size:20px;letter-spacing:6px;color:#fff;">VYVE</div></td></tr><tr><td style="padding:32px;"><h2 style="margin:0 0 14px;font-size:20px;font-family:Georgia,serif;color:#0D2B2B;font-weight:400;">' + escHtml(subject) + '</h2><ul style="margin:0 0 20px;padding-left:20px;">' + items + '</ul><div style="text-align:center;margin:10px 0 6px;"><a href="https://admin.vyvehealth.co.uk/coach-portal.html" style="background:#0D2B2B;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:14px;font-weight:600;display:inline-block;">Open your coach portal &rarr;</a></div><p style="margin:14px 0 0;font-size:12px;color:#7A9A9A;text-align:center;">Change which updates you receive under Profile &rarr; Settings.</p></td></tr><tr><td style="background:#F4FAFA;padding:20px 32px;border-top:1px solid #C8E4E4;"><p style="margin:0;font-size:12px;color:#7A9A9A;">VYVE Health CIC &middot; team@vyvehealth.co.uk &middot; ICO 00013608608</p></td></tr></table></td></tr></table></body></html>';
  try {
    const r = await fetch('https://api.brevo.com/v3/smtp/email', { method: 'POST', headers: { 'api-key': BREVO_KEY, 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify({ sender: { name: 'VYVE Health', email: 'team@vyvehealth.co.uk' }, to: [{ email: coach.contact_email, name: coach.name || 'Coach' }], subject: 'VYVE coaching \u2014 ' + subject, htmlContent: html, tags: ['coach-automation', 'phase_ending'] }) });
    return r.ok;
  } catch (_) { return false; }
}
async function coachPush(coach, body, route) {
  if (!coach.contact_email) return false;
  try {
    const r = await fetch(SUPABASE_URL + '/rest/v1/scheduled_pushes', { method: 'POST', headers: { ...H, 'Prefer': 'resolution=ignore-duplicates,return=minimal' }, body: JSON.stringify({ member_email: String(coach.contact_email).toLowerCase(), fire_at: new Date().toISOString(), type: 'coach_notify', title: 'Coaching update', body: body.slice(0, 160), data: { route }, dedupe_key: 'coach_auto:' + coach.id + ':' + Date.now() }) });
    return r.ok;
  } catch (_) { return false; }
}
async function notifyCoach(coach, kind, subject, lines, route) {
  const p = coachPref(coach.coach_notification_prefs, kind);
  const out = { email: false, push: false };
  if (p.email) out.email = await coachEmail(coach, subject, lines);
  if (p.push) out.push = await coachPush(coach, lines[0] || subject, route);
  return out;
}

// PM-983: 7-day signed URL for the coach's welcome pack (coach-content is a private bucket).
async function signPack(path) {
  if (!path) return null;
  try {
    const r = await fetch(SUPABASE_URL + '/storage/v1/object/sign/coach-content/' + path.split('/').map(encodeURIComponent).join('/'), {
      method: 'POST', headers: H, body: JSON.stringify({ expiresIn: 604800 })
    });
    if (!r.ok) return null;
    const d = await r.json();
    return d && d.signedURL ? SUPABASE_URL + '/storage/v1' + d.signedURL : null;
  } catch (_) { return null; }
}
// W2 (#97): every welcome attachment signed for 7 days — legacy welcome_pack_path first, then _meta.welcome_attachments[].
async function signPacks(meta) {
  const paths = [];
  if (meta && meta.welcome_pack_path) paths.push(String(meta.welcome_pack_path));
  if (meta && Array.isArray(meta.welcome_attachments)) for (const p of meta.welcome_attachments) if (p && !paths.includes(String(p))) paths.push(String(p));
  const out = [];
  for (const p of paths.slice(0, 5)) { const u = await signPack(p); if (u) out.push({ url: u, name: String(p).split('/').pop().replace(/^pack-\d+-/, '').replace(/^att-\d+-/, '') }); }
  return out;
}
async function sendInviteEmail(email, firstName, coachName, link, packUrl) {
  if (!BREVO_KEY || !link) return false;
  const packs = Array.isArray(packUrl) ? packUrl : (packUrl ? [{ url: packUrl, name: 'welcome pack' }] : []);
  const packBlock = packs.length
    ? `<div style="background:#F0F9F9;border-radius:8px;padding:16px 20px;margin:0 0 24px;border-left:3px solid #C9A84C;"><p style="margin:0 0 4px;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#1B7878;">From your coach</p><p style="margin:0 0 10px;font-size:14px;color:#3A5A5A;">${escHtml(coachName)} has attached ${packs.length === 1 ? 'a welcome pack' : packs.length + ' documents'} for you (links work for 7 days).</p>${packs.map((p) => `<a href="${p.url}" style="display:block;margin:0 0 6px;color:#1B7878;font-size:14px;font-weight:600;">Open ${escHtml(p.name)} &rarr;</a>`).join('')}</div>`
    : '';
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="margin:0;padding:0;background:#F4FAFA;font-family:Helvetica Neue,Arial,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#F4FAFA;padding:40px 20px;"><tr><td align="center"><table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;"><tr><td style="background:#0D2B2B;padding:24px 32px;"><div style="font-family:Georgia,serif;font-size:20px;letter-spacing:6px;color:#fff;">VYVE</div></td></tr><tr><td style="padding:32px;"><h2 style="margin:0 0 8px;font-size:24px;font-family:Georgia,serif;color:#0D2B2B;font-weight:400;">Welcome to VYVE, ${firstName}.</h2><p style="margin:0 0 24px;font-size:15px;color:#3A5A5A;line-height:1.7;">${coachName} has set you up on the VYVE Health app \u2014 your home for workouts, habits, nutrition and check-ins, all managed by your coach.</p><div style="background:#F0F9F9;border-radius:8px;padding:18px 22px;margin-bottom:24px;border-left:3px solid #1B7878;"><p style="margin:0 0 4px;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#1B7878;">Your Coach</p><p style="margin:0;font-size:18px;font-weight:700;color:#0D2B2B;">${coachName}</p></div>${packBlock}<p style="margin:0 0 24px;font-size:14px;color:#3A5A5A;line-height:1.65;">Tap below to set your password and get started. Your first 7 days are free.</p><div style="text-align:center;margin:0 0 12px;"><a href="${link}" style="background:#0D2B2B;color:#fff;text-decoration:none;padding:16px 36px;border-radius:8px;font-size:15px;font-weight:600;display:inline-block;">Set your password &amp; sign in &rarr;</a></div><p style="margin:0 0 28px;text-align:center;font-size:12px;color:#7A9A9A;">Or open this link any time: <a href="${link}" style="color:#1B7878;">${link.replace('https://','')}</a></p><p style="margin:0 0 12px;font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#1B7878;">Get the VYVE Health app</p><table width="100%" cellpadding="0" cellspacing="0"><tr><td width="48%" style="vertical-align:middle;text-align:center;background:#0D2B2B;border-radius:8px;"><a href="https://apps.apple.com/gb/app/vyve-health/id6762100652" style="display:block;padding:14px 16px;color:#fff;text-decoration:none;font-size:14px;font-weight:600;">Download for iPhone &rarr;</a></td><td width="4%"></td><td width="48%" style="vertical-align:middle;text-align:center;background:#0D2B2B;border-radius:8px;"><a href="https://play.google.com/store/apps/details?id=co.uk.vyvehealth.app" style="display:block;padding:14px 16px;color:#fff;text-decoration:none;font-size:14px;font-weight:600;">Download for Android &rarr;</a></td></tr></table></td></tr><tr><td style="background:#F4FAFA;padding:20px 32px;border-top:1px solid #C8E4E4;"><p style="margin:0;font-size:12px;color:#7A9A9A;">VYVE Health CIC &middot; team@vyvehealth.co.uk &middot; ICO 00013608608</p></td></tr></table></td></tr></table></body></html>`;
  const r = await fetch('https://api.brevo.com/v3/smtp/email', { method: 'POST', headers: { 'api-key': BREVO_KEY, 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify({ sender: { name: 'VYVE Health', email: 'team@vyvehealth.co.uk' }, to: [{ email, name: firstName }], subject: coachName + ' has invited you to VYVE Health', htmlContent: html, tags: ['coach-invite', 'coaching'] }) });
  if (!r.ok) console.warn('invite email failed:', await r.text());
  return r.ok;
}
async function getClientRow(partnerId, email) {
  const r = await fetch(SUPABASE_URL + '/rest/v1/coach_clients?partner_id=eq.' + partnerId + '&member_email=ilike.' + encodeURIComponent(email) + '&select=*&limit=1', { headers: H });
  const rows = r.ok ? await r.json() : [];
  return rows[0] || null;
}
async function ensureCode(row) {
  if (row.invite_code) return row.invite_code;
  const code = newCode();
  await fetch(SUPABASE_URL + '/rest/v1/coach_clients?id=eq.' + row.id, { method: 'PATCH', headers: { ...H, 'Prefer': 'return=minimal' }, body: JSON.stringify({ invite_code: code }) });
  return code;
}
async function provisionOne(partner, row, lib, sendEmail) {
  const clientEmail = String(row.email || '').toLowerCase().trim();
  const fn = String(row.firstName || '').trim(), ln = String(row.lastName || '').trim();
  if (!clientEmail || !clientEmail.includes('@')) return { ok: false, error: 'valid email required' };
  if (!fn) return { ok: false, error: 'firstName required' };
  const { assignments, errors } = resolveAssignments(row.assignments, lib, partner);
  if (errors.length) return { ok: false, error: errors.join('; ') };
  // PM-983: scheduled invite — a future date holds the email, everything else provisions now.
  let scheduledFor = null;
  if (row.inviteSendAt) {
    const t = new Date(row.inviteSendAt);
    if (!isNaN(t.getTime()) && t.getTime() > Date.now() + 60000) { scheduledFor = t.toISOString(); assignments._invite_send_at = scheduledFor; }
  }
  const mr = await fetch(SUPABASE_URL + '/rest/v1/members?email=ilike.' + encodeURIComponent(clientEmail) + '&select=email&limit=1', { headers: H });
  const existing = mr.ok ? await mr.json() : [];
  if (existing.length) {
    const other = await fetch(SUPABASE_URL + '/rest/v1/coach_clients?member_email=ilike.' + encodeURIComponent(clientEmail) + '&status=neq.archived&select=partner_id&limit=1', { headers: H });
    const oRows = other.ok ? await other.json() : [];
    if (oRows.length && oRows[0].partner_id !== partner.id) return { ok: false, error: 'client_has_another_coach' };
    if (!oRows.length) return { ok: false, error: 'already a VYVE member \u2014 contact team@vyvehealth.co.uk to link them' };
  }
  const now = new Date();
  const trialEnds = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  if (!existing.length) {
    const wu = (assignments._meta && assignments._meta.weight_unit) || 'kg';
    const memberRow = { email: clientEmail, first_name: fn, last_name: ln || null, dob: row.dob || null, gender: row.gender || null, account_type: 'trial', trial_started_at: now.toISOString(), trial_ends_at: trialEnds.toISOString(), billing_tier: 'coaching', subscription_status: 'trial', signup_channel: 'coach', attribution_source: 'admin', signup_campaign: 'coach', signup_campaign_code: partner.slug || null, onboarding_complete: false, weight_unit: wu, height_unit: 'cm', cert_habits_count: 0, cert_workouts_count: 0, cert_cardio_count: 0, cert_checkins_count: 0, cert_sessions_count: 0 };
    const mw = await fetch(SUPABASE_URL + '/rest/v1/members?on_conflict=email', { method: 'POST', headers: { ...H, 'Prefer': 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify(memberRow) });
    if (!mw.ok) return { ok: false, error: 'member_write_failed: ' + (await mw.text()).slice(0, 200) };
  }
  const cu = await fetch(SUPABASE_URL + '/auth/v1/admin/users', { method: 'POST', headers: H, body: JSON.stringify({ email: clientEmail, email_confirm: true, user_metadata: { first_name: fn, last_name: ln || '' } }) });
  if (!cu.ok) { const cj = await cu.json().catch(() => ({})); const already = String(cj.msg || cj.message || '').toLowerCase().includes('already'); if (!already) return { ok: false, error: 'auth_create_failed' }; }
  const prior = await getClientRow(partner.id, clientEmail);
  const code = (prior && prior.invite_code) ? prior.invite_code : newCode();
  const ccRow = { partner_id: partner.id, member_email: clientEmail, status: 'invited', invited_first_name: fn, invited_last_name: ln || null, invite_sent_at: now.toISOString(), invite_count: (prior ? (prior.invite_count || 0) + 1 : 1), assignments, invite_code: code };
  const ccw = await fetch(SUPABASE_URL + '/rest/v1/coach_clients?on_conflict=partner_id,member_email', { method: 'POST', headers: { ...H, 'Prefer': 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify(ccRow) });
  if (!ccw.ok) return { ok: false, error: 'coach_clients_write_failed: ' + (await ccw.text()).slice(0, 200) };
  const pmRow = { member_email: clientEmail, partner_id: partner.id, joined_at: now.toISOString(), referred: true, account_type: 'coaching', subscription_status: 'trialing', subscription_value: 0 };
  const pmw = await fetch(SUPABASE_URL + '/rest/v1/partner_memberships', { method: 'POST', headers: { ...H, 'Prefer': 'resolution=ignore-duplicates,return=minimal' }, body: JSON.stringify(pmRow) });
  if (!pmw.ok) console.warn('partner_memberships write failed:', await pmw.text());
  const link = prettyLink(code);
  let emailSent = false;
  if (sendEmail && !scheduledFor) {
    const packUrl = await signPacks(assignments._meta);
    emailSent = await sendInviteEmail(clientEmail, fn, partner.name, link, packUrl);
  }
  return { ok: true, invite_link: link, email_sent: emailSent, email_scheduled: scheduledFor, trial_ends_at: trialEnds.toISOString() };
}
// PM-983: cron sweep — send invites whose scheduled time has passed, then clear the hold.
async function sweepScheduledInvites() {
  const nowIso = new Date().toISOString();
  const r = await fetch(SUPABASE_URL + '/rest/v1/coach_clients?status=eq.invited&assignments->>_invite_send_at=lte.' + encodeURIComponent(nowIso) + '&select=id,partner_id,member_email,invited_first_name,invite_code,assignments&limit=50', { headers: H });
  const rows = r.ok ? await r.json() : [];
  const results = [];
  for (const row of rows) {
    try {
      const pr = await fetch(SUPABASE_URL + '/rest/v1/partner_partners?id=eq.' + row.partner_id + '&select=id,name&limit=1', { headers: H });
      const ps = pr.ok ? await pr.json() : [];
      const coachName = (ps[0] && ps[0].name) || 'Your coach';
      const code = row.invite_code || newCode();
      if (!row.invite_code) await fetch(SUPABASE_URL + '/rest/v1/coach_clients?id=eq.' + row.id, { method: 'PATCH', headers: { ...H, 'Prefer': 'return=minimal' }, body: JSON.stringify({ invite_code: code }) });
      const asg = (row.assignments && typeof row.assignments === 'object') ? row.assignments : {};
      const packUrl = await signPacks(asg._meta);
      const sent = await sendInviteEmail(row.member_email, row.invited_first_name || 'there', coachName, prettyLink(code), packUrl);
      delete asg._invite_send_at;
      await fetch(SUPABASE_URL + '/rest/v1/coach_clients?id=eq.' + row.id, { method: 'PATCH', headers: { ...H, 'Prefer': 'return=minimal' }, body: JSON.stringify({ assignments: asg, invite_sent_at: new Date().toISOString() }) });
      results.push({ email: row.member_email, sent });
    } catch (e) { results.push({ email: row.member_email, error: String(e).slice(0, 120) }); }
  }
  return results;
}

// ── W5: date helpers (London calendar) ──
function londonDate(d = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d); // YYYY-MM-DD
}
function mondayOfIso(iso) {
  const d = new Date(iso + 'T00:00:00Z');
  const dow = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - dow);
  return d.toISOString().slice(0, 10);
}
function addDaysIso(iso, n) { const d = new Date(iso + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
// Last scheduled date of the active coach plan: calendar rows end on the Sunday of the final week; legacy rows
// (no week_start) are read as generated_at + plan weeks. Mirrors _shared/programme_projection.ts programmeEnd().
function planEnd(w) {
  if (!w) return null;
  const weeks = Math.max(1, Number(w.plan_duration_weeks || 1));
  if (w.week_start && ISO_DATE.test(String(w.week_start))) return addDaysIso(mondayOfIso(String(w.week_start)), weeks * 7 - 1);
  if (w.generated_at) return addDaysIso(mondayOfIso(String(w.generated_at).slice(0, 10)), weeks * 7 - 1);
  return null;
}
// ── W5: next-phase queue sweep (cron) ──
async function sweepWorkoutQueue(dryRun) {
  const today = londonDate();
  const r = await fetch(SUPABASE_URL + '/rest/v1/coach_clients?status=eq.active&consent_accepted_at=not.is.null&lapsed_at=is.null&assignments->workout_queue=not.is.null&select=id,partner_id,member_email,invited_first_name,assignments&limit=500', { headers: H });
  const rows = (r.ok ? await r.json() : []).filter((c) => Array.isArray(c.assignments && c.assignments.workout_queue) && c.assignments.workout_queue.length);
  const report = { today, applied: [], waiting: [], errors: [] };
  const partnerCache = {}, libCache = {};
  for (const c of rows) {
    try {
      const q = c.assignments.workout_queue;
      const head = q[0];
      const w = await activeWpc(c.member_email);
      let due = false, startIso = null;
      if (ISO_DATE.test(String(head.start_on || ''))) { due = String(head.start_on) <= today; startIso = mondayOfIso(String(head.start_on)); }
      else {
        const end = planEnd(w);
        due = !w || !end || end < today;
        startIso = mondayOfIso(today);
      }
      if (!due) { report.waiting.push({ email: c.member_email, template_id: head.template_id, start_on: head.start_on, plan_end: planEnd(w) }); continue; }
      if (dryRun) { report.applied.push({ email: c.member_email, template_id: head.template_id, week_start: startIso, dry_run: true }); continue; }
      if (!partnerCache[c.partner_id]) {
        const pr = await fetch(SUPABASE_URL + '/rest/v1/partner_partners?id=eq.' + c.partner_id + '&select=id,name,slug,status,contact_email,coach_notification_prefs,coach_ui_prefs&limit=1', { headers: H });
        const ps = pr.ok ? await pr.json() : [];
        partnerCache[c.partner_id] = ps[0] || { id: c.partner_id, name: 'Your coach' };
        libCache[c.partner_id] = await loadLibraries(c.partner_id);
      }
      const partner = partnerCache[c.partner_id], lib = libCache[c.partner_id];
      const tpl = lib.tpls.find((t) => t.id === head.template_id && (t.kind === 'workout' || t.kind === 'program'));
      const oldAsg = c.assignments;
      const na = { ...oldAsg, workout_queue: q.slice(1) };
      if (!na.workout_queue.length) delete na.workout_queue;
      if (!tpl) { // template deleted since it was queued — drop it and move on
        await fetch(SUPABASE_URL + '/rest/v1/coach_clients?id=eq.' + c.id, { method: 'PATCH', headers: { ...H, 'Prefer': 'return=minimal' }, body: JSON.stringify({ assignments: na }) });
        report.errors.push({ email: c.member_email, error: 'queued_template_missing', template_id: head.template_id });
        continue;
      }
      na.workout_template_id = tpl.id;
      delete na.schedule_overrides; // overrides belong to the plan that just ended
      const pw = await fetch(SUPABASE_URL + '/rest/v1/coach_clients?id=eq.' + c.id, { method: 'PATCH', headers: { ...H, 'Prefer': 'return=minimal' }, body: JSON.stringify({ assignments: na }) });
      if (!pw.ok) { report.errors.push({ email: c.member_email, error: 'save_failed: ' + (await pw.text()).slice(0, 160) }); continue; }
      const applied = await applyAssignments(partner.id, c.member_email, startIso);
      if (applied && applied.error) { report.errors.push({ email: c.member_email, error: applied.error }); continue; }
      const automations = await fireAutomations(partner, c.member_email, ['workout_template_id'], lib, oldAsg, na, PLAN_CHANGE_NOTIFY);
      await logEvents(partner.id, c.member_email, [{ kind: 'phase_started', label: 'Next phase started: ' + tpl.name + ' (from ' + startIso + ')', meta: { template_id: tpl.id, week_start: startIso, from_queue: true } }]);
      report.applied.push({ email: c.member_email, template: tpl.name, week_start: startIso, automations, remaining_queue: (na.workout_queue || []).length });
    } catch (e) { report.errors.push({ email: c.member_email, error: String(e).slice(0, 160) }); }
  }
  // phase_ending: calendar plans ending within 7 days with nothing queued → coach notify once per wpc.
  report.phase_ending = [];
  try {
    const horizon = addDaysIso(today, 7);
    const wr = await fetch(SUPABASE_URL + '/rest/v1/workout_plan_cache?is_active=eq.true&source=eq.coach&week_start=not.is.null&select=id,member_email,week_start,plan_duration_weeks,programme_json->>programme_name&limit=1000', { headers: H });
    const wpcs = wr.ok ? await wr.json() : [];
    const ending = wpcs.filter((w) => { const e = planEnd(w); return e && e >= today && e <= horizon; });
    if (ending.length) {
      const emails = ending.map((w) => '"' + String(w.member_email).toLowerCase() + '"').join(',');
      const cr = await fetch(SUPABASE_URL + '/rest/v1/coach_clients?status=eq.active&member_email=in.(' + emails + ')&select=id,partner_id,member_email,invited_first_name,assignments', { headers: H });
      const cls = cr.ok ? await cr.json() : [];
      for (const w of ending) {
        const c = cls.find((x) => String(x.member_email).toLowerCase() === String(w.member_email).toLowerCase());
        if (!c || (Array.isArray(c.assignments && c.assignments.workout_queue) && c.assignments.workout_queue.length)) continue;
        const er = await fetch(SUPABASE_URL + '/rest/v1/coach_client_events?partner_id=eq.' + c.partner_id + '&member_email=ilike.' + encodeURIComponent(c.member_email) + '&kind=eq.phase_ending&meta->>wpc_id=eq.' + w.id + '&select=id&limit=1', { headers: H });
        if (er.ok && (await er.json()).length) continue;
        if (dryRun) { report.phase_ending.push({ email: c.member_email, ends: planEnd(w), dry_run: true }); continue; }
        if (!partnerCache[c.partner_id]) {
          const pr = await fetch(SUPABASE_URL + '/rest/v1/partner_partners?id=eq.' + c.partner_id + '&select=id,name,slug,status,contact_email,coach_notification_prefs,coach_ui_prefs&limit=1', { headers: H });
          const ps = pr.ok ? await pr.json() : [];
          partnerCache[c.partner_id] = ps[0] || { id: c.partner_id, name: 'Your coach' };
        }
        const coach = partnerCache[c.partner_id];
        const first = c.invited_first_name || c.member_email;
        const line = first + "'s programme \u201c" + (w.programme_name || 'current plan') + "\u201d ends on " + planEnd(w) + ' and nothing is queued. Add their next phase under Clients \u2192 ' + first + ' \u2192 Plans.';
        const res = await notifyCoach(coach, 'phase_ending', first + "'s programme ends this week", [line], '/coach-portal.html#clients');
        await logEvents(c.partner_id, c.member_email, [{ kind: 'phase_ending', label: 'Coach notified: programme ends ' + planEnd(w) + ', no next phase queued', meta: { wpc_id: w.id, ends: planEnd(w), notified: res } }]);
        report.phase_ending.push({ email: c.member_email, ends: planEnd(w), notified: res });
      }
    }
  } catch (e) { report.errors.push({ phase_ending: String(e).slice(0, 160) }); }
  return report;
}

// ── PM-1035 W4b: coach-side batch assign + tags ──
const SLOT_KEYS = ['onboarding_form_id', 'checkin_form_id', 'habits_template_id', 'workout_template_id', 'nutrition_template_id', 'supplements_template_id'];
const BATCH_CAP = 100;
const TAG_CAP = 20;
function slotPool(key, lib) {
  switch (key) {
    case 'onboarding_form_id': return lib.forms.filter((f) => f.kind === 'onboarding').map((f) => ({ id: f.id, name: f.title }));
    case 'checkin_form_id': return lib.forms.filter((f) => f.kind === 'checkin').map((f) => ({ id: f.id, name: f.title }));
    case 'habits_template_id': return lib.tpls.filter((t) => t.kind === 'habits');
    case 'workout_template_id': return lib.tpls.filter((t) => t.kind === 'workout' || t.kind === 'program');
    case 'nutrition_template_id': return lib.tpls.filter((t) => t.kind === 'nutrition');
    case 'supplements_template_id': return lib.tpls.filter((t) => t.kind === 'supplements');
  }
  return [];
}
function slotName(key, id, lib) {
  if (!id) return null;
  const hit = slotPool(key, lib).find((x) => x.id === id) || lib.tpls.find((t) => t.id === id) || lib.forms.find((f) => f.id === id);
  return hit ? (hit.name || hit.title || null) : null;
}
async function activeWpc(email) {
  const r = await fetch(SUPABASE_URL + '/rest/v1/workout_plan_cache?member_email=ilike.' + encodeURIComponent(email) + '&is_active=eq.true&programme_json->>surface=eq.workouts&select=id,current_week,current_session,source,source_id,week_start,plan_duration_weeks,generated_at,programme_json->>programme_name&order=generated_at.desc&limit=1', { headers: H });
  const rows = r.ok ? await r.json() : [];
  return rows[0] ? { id: rows[0].id, current_week: rows[0].current_week, current_session: rows[0].current_session, source: rows[0].source, source_id: rows[0].source_id, week_start: rows[0].week_start, plan_duration_weeks: rows[0].plan_duration_weeks, generated_at: rows[0].generated_at, programme_name: rows[0].programme_name } : null;
}
async function setWpcActive(id, active) {
  const r = await fetch(SUPABASE_URL + '/rest/v1/workout_plan_cache?id=eq.' + id, { method: 'PATCH', headers: { ...H, 'Prefer': 'return=representation' }, body: JSON.stringify({ is_active: active }) });
  const rows = r.ok ? await r.json() : [];
  return rows.length > 0;
}
// Apply for a NON-workout slot re-materialises the workout at week 1 (coach_apply_assignments
// re-runs every slot). Batch keeps the client's workout row + week when the workout template
// itself did not change: snapshot, apply, then swap back if a fresh row for the same template appeared.
// (W5: the RPC now carries week_start / week / session forward itself when the template is unchanged;
// this wrapper stays as belt-and-braces for the row identity.)
async function applyPreservingWorkout(partnerId, email) {
  const before = await activeWpc(email);
  const applied = await applyAssignments(partnerId, email);
  if (before && applied && !applied.error) {
    const after = await activeWpc(email);
    if (after && after.id !== before.id && after.source === before.source && String(after.source_id || '') === String(before.source_id || '')) {
      if (await setWpcActive(after.id, false)) await setWpcActive(before.id, true);
    }
  }
  return applied;
}
async function ownClients(partnerId, emails) {
  const want = [...new Set((Array.isArray(emails) ? emails : []).map((e) => String(e || '').toLowerCase().trim()).filter((e) => e.includes('@')))];
  if (!want.length) return { rows: [], unknown: [] };
  const r = await fetch(SUPABASE_URL + '/rest/v1/coach_clients?partner_id=eq.' + partnerId + '&status=neq.archived&select=id,member_email,status,consent_accepted_at,invited_first_name,invited_last_name,assignments&limit=1000', { headers: H });
  const all = r.ok ? await r.json() : [];
  const byEmail = {};
  all.forEach((c) => { byEmail[String(c.member_email).toLowerCase()] = c; });
  const rows = [], unknown = [];
  for (const e of want) { if (byEmail[e]) rows.push(byEmail[e]); else unknown.push(e); }
  return { rows, unknown };
}
function isLive(c) { return c.status === 'active' && !!c.consent_accepted_at; }
// Write ONE slot on one client (merge — every other assignments key survives). Materialises +
// fires the plan-updated automation for active+consented clients; invited clients get the slot
// set and it lands on accept. fireAuto=false on revert-of-workout (the wpc swap is the change).
// W5: opts.notify → plan_change push alongside the automation.
async function writeSlot(partner, row, lib, key, value, opts) {
  const oldAsg = (row.assignments && typeof row.assignments === 'object') ? row.assignments : {};
  const na = { ...oldAsg };
  if (value) na[key] = value; else delete na[key];
  const w = await fetch(SUPABASE_URL + '/rest/v1/coach_clients?id=eq.' + row.id, { method: 'PATCH', headers: { ...H, 'Prefer': 'return=minimal' }, body: JSON.stringify({ assignments: na }) });
  if (!w.ok) return { error: 'save_failed: ' + (await w.text()).slice(0, 200) };
  let applied = null, automations = [];
  if (isLive(row) && opts.apply !== false) {
    applied = key === 'workout_template_id' ? await applyAssignments(partner.id, row.member_email) : await applyPreservingWorkout(partner.id, row.member_email);
    if (applied && !applied.error && opts.fireAuto !== false && value && value !== oldAsg[key]) automations = await fireAutomations(partner, row.member_email, [key], lib, oldAsg, na, opts.notify === true);
  }
  return { na, applied, automations };
}
async function batchDryRun(partner, lib, key, tplId, emails) {
  const { rows, unknown } = await ownClients(partner.id, emails);
  const tplName = slotName(key, tplId, lib);
  const out = [];
  for (const c of rows) {
    const cur = (c.assignments || {})[key] || null;
    const item = { email: c.member_email, name: ((c.invited_first_name || '') + ' ' + (c.invited_last_name || '')).trim() || c.member_email, status: c.status, live: isLive(c), now_id: cur, now_name: slotName(key, cur, lib), after_id: tplId, after_name: tplName, mode: cur === tplId ? 'already' : (isLive(c) ? 'push' : 'on_accept') };
    if (key === 'workout_template_id') { const w = await activeWpc(c.member_email); item.now_programme = w ? w.programme_name : null; item.now_week = w ? w.current_week : null; }
    out.push(item);
  }
  return { rows: out, unknown_emails: unknown, template_name: tplName, over_cap: rows.length > BATCH_CAP };
}
async function batchApply(partner, lib, key, tplId, emails, reason, actor, notify) {
  const { rows, unknown } = await ownClients(partner.id, emails);
  if (!rows.length) return { error: 'no_clients' };
  if (rows.length > BATCH_CAP) return { error: 'over_cap', cap: BATCH_CAP };
  const tplName = slotName(key, tplId, lib);
  const hr = await fetch(SUPABASE_URL + '/rest/v1/coach_batches', { method: 'POST', headers: { ...H, 'Prefer': 'return=representation' }, body: JSON.stringify({ partner_id: partner.id, slot_key: key, template_id: tplId, template_name: tplName, reason: reason ? String(reason).slice(0, 300) : null, created_by: actor }) });
  const hrows = hr.ok ? await hr.json() : [];
  if (!hrows[0]) return { error: 'batch_header_failed: ' + (hr.ok ? 'empty' : (await hr.text()).slice(0, 200)) };
  const batchId = hrows[0].id;
  const results = [];
  let applied = 0, failed = 0, notified = 0;
  for (const c of rows) {
    const cur = (c.assignments || {})[key] || null;
    const line = { batch_id: batchId, partner_id: partner.id, member_email: c.member_email, prior_value: cur, prior_name: slotName(key, cur, lib), applied_now: false, status: 'applied' };
    try {
      if (cur === tplId) { line.status = 'skipped'; line.error = 'already_on_it'; }
      else {
        if (key === 'workout_template_id' && isLive(c)) { const w = await activeWpc(c.member_email); if (w) { line.prior_wpc_id = w.id; line.prior_week = w.current_week; } }
        const r = await writeSlot(partner, c, lib, key, tplId, { notify });
        if (r.error) { line.status = 'failed'; line.error = r.error; }
        else {
          line.applied_now = !!(r.applied && !r.applied.error);
          if (r.applied && r.applied.error) { line.status = 'failed'; line.error = r.applied.error; }
          else if (key === 'workout_template_id' && line.applied_now) { const w2 = await activeWpc(c.member_email); if (w2 && w2.id !== line.prior_wpc_id) line.new_wpc_id = w2.id; }
          line.automations = r.automations;
        }
      }
    } catch (e) { line.status = 'failed'; line.error = String(e).slice(0, 200); }
    if (line.status === 'applied') applied++; else if (line.status === 'failed') failed++;
    if ((line.automations || []).some((a) => String(a).endsWith(':push'))) notified++;
    const { automations, ...dbLine } = line;
    await fetch(SUPABASE_URL + '/rest/v1/coach_batch_rows', { method: 'POST', headers: { ...H, 'Prefer': 'return=minimal' }, body: JSON.stringify(dbLine) });
    if (line.status === 'applied') await logEvents(partner.id, c.member_email, [{ kind: 'batch_assign', label: 'Batch: assigned ' + (SLOT_LABEL[key] || 'plan') + ': ' + (tplName || 'plan') + (reason ? ' \u2014 ' + String(reason).slice(0, 120) : ''), meta: { batch_id: batchId, slot_key: key, template_id: tplId } }]);
    results.push({ email: c.member_email, status: line.status, error: line.error || null, applied_now: line.applied_now, prior_name: line.prior_name, prior_week: line.prior_week || null, automations: line.automations || [], notified: (line.automations || []).some((a) => String(a).endsWith(':push')) });
  }
  await fetch(SUPABASE_URL + '/rest/v1/coach_batches?id=eq.' + batchId, { method: 'PATCH', headers: { ...H, 'Prefer': 'return=minimal' }, body: JSON.stringify({ applied_count: applied, failed_count: failed }) });
  return { batch_id: batchId, template_name: tplName, applied, failed, skipped: results.length - applied - failed, notify_requested: !!notify, notified, unknown_emails: unknown, results };
}
async function batchRevert(partner, lib, batchId) {
  const hr = await fetch(SUPABASE_URL + '/rest/v1/coach_batches?id=eq.' + encodeURIComponent(batchId) + '&partner_id=eq.' + partner.id + '&select=*&limit=1', { headers: H });
  const hrows = hr.ok ? await hr.json() : [];
  const batch = hrows[0];
  if (!batch) return { error: 'batch_not_found' };
  const rr = await fetch(SUPABASE_URL + '/rest/v1/coach_batch_rows?batch_id=eq.' + batch.id + '&select=*&order=created_at.asc', { headers: H });
  const lines = rr.ok ? await rr.json() : [];
  const key = batch.slot_key;
  const results = [];
  let reverted = 0;
  for (const line of lines) {
    const res = { email: line.member_email, status: 'skipped', note: null };
    if (line.status !== 'applied') { res.note = line.status === 'reverted' ? 'already_reverted' : line.status; results.push(res); continue; }
    try {
      const row = await getClientRow(partner.id, line.member_email);
      const cur = row ? ((row.assignments || {})[key] || null) : null;
      if (!row || row.status === 'archived' || cur !== batch.template_id) { res.note = 'changed_since_batch'; }
      else if (key === 'workout_template_id' && line.applied_now) {
        const w = await activeWpc(line.member_email);
        if (!w || (line.new_wpc_id && w.id !== line.new_wpc_id)) res.note = 'changed_since_batch';
        else {
          const wr = await writeSlot(partner, row, lib, key, line.prior_value, { apply: false });
          if (wr.error) { res.note = wr.error; }
          else {
            if (await setWpcActive(w.id, false)) {
              if (line.prior_wpc_id && !(await setWpcActive(line.prior_wpc_id, true))) await setWpcActive(w.id, true); // never leave nothing
            }
            res.status = 'reverted';
          }
        }
      } else {
        const wr = await writeSlot(partner, row, lib, key, line.prior_value, {});
        if (wr.error || (wr.applied && wr.applied.error)) res.note = wr.error || wr.applied.error;
        else res.status = 'reverted';
      }
    } catch (e) { res.note = String(e).slice(0, 200); }
    if (res.status === 'reverted') {
      reverted++;
      await fetch(SUPABASE_URL + '/rest/v1/coach_batch_rows?id=eq.' + line.id, { method: 'PATCH', headers: { ...H, 'Prefer': 'return=minimal' }, body: JSON.stringify({ status: 'reverted', reverted_at: new Date().toISOString() }) });
      await logEvents(partner.id, line.member_email, [{ kind: 'batch_revert', label: 'Batch reverted: ' + (SLOT_LABEL[key] || 'plan') + ' back to ' + (line.prior_name || 'none'), meta: { batch_id: batch.id, slot_key: key } }]);
    } else if (res.note && res.note !== 'already_reverted' && line.status === 'applied') {
      await fetch(SUPABASE_URL + '/rest/v1/coach_batch_rows?id=eq.' + line.id, { method: 'PATCH', headers: { ...H, 'Prefer': 'return=minimal' }, body: JSON.stringify({ revert_note: String(res.note).slice(0, 200) }) });
    }
    results.push(res);
  }
  const remaining = lines.filter((l) => l.status === 'applied').length - reverted;
  if (remaining <= 0) await fetch(SUPABASE_URL + '/rest/v1/coach_batches?id=eq.' + batch.id, { method: 'PATCH', headers: { ...H, 'Prefer': 'return=minimal' }, body: JSON.stringify({ reverted_at: new Date().toISOString() }) });
  return { batch_id: batch.id, reverted, remaining: Math.max(0, remaining), results };
}
async function listBatches(partner) {
  const hr = await fetch(SUPABASE_URL + '/rest/v1/coach_batches?partner_id=eq.' + partner.id + '&select=id,slot_key,template_id,template_name,reason,created_at,applied_count,failed_count,reverted_at&order=created_at.desc&limit=30', { headers: H });
  const batches = hr.ok ? await hr.json() : [];
  if (!batches.length) return [];
  const ids = batches.map((b) => b.id).join(',');
  const rr = await fetch(SUPABASE_URL + '/rest/v1/coach_batch_rows?batch_id=in.(' + ids + ')&select=batch_id,member_email,status,applied_now,prior_name,revert_note', { headers: H });
  const lines = rr.ok ? await rr.json() : [];
  const by = {};
  lines.forEach((l) => { (by[l.batch_id] = by[l.batch_id] || []).push(l); });
  return batches.map((b) => { const ls = by[b.id] || []; return { ...b, total: ls.length, applied: ls.filter((l) => l.status === 'applied').length, reverted: ls.filter((l) => l.status === 'reverted').length, failed: ls.filter((l) => l.status === 'failed').length, skipped: ls.filter((l) => l.status === 'skipped').length, rows: ls }; });
}
function cleanTags(arr) {
  const seen = new Set(), out = [];
  for (const t of (Array.isArray(arr) ? arr : [])) {
    const s = String(t || '').trim().replace(/\s+/g, ' ').slice(0, 40);
    if (!s) continue;
    const k = s.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k); out.push(s);
  }
  return out;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  try {
    // PM-983: cron-only branch — VYVE_CRON_KEY header, no partner context needed.
    const cronKey = req.headers.get('x-vyve-cron-key') || '';
    let bodyPeek = null;
    if (cronKey && CRON_KEY && cronKey === CRON_KEY) {
      bodyPeek = await req.json().catch(() => ({}));
      if (String(bodyPeek.action || '') === 'send_scheduled_invites') {
        const results = await sweepScheduledInvites();
        return j({ success: true, action: 'send_scheduled_invites', count: results.length, results });
      }
      // W5: daily next-phase sweep (+ phase_ending coach notify). {dry_run:true} reports without writing.
      if (String(bodyPeek.action || '') === 'sweep_workout_queue') {
        const report = await sweepWorkoutQueue(bodyPeek.dry_run === true);
        return j({ success: true, action: 'sweep_workout_queue', ...report });
      }
    }
    const email = await callerEmail(req);
    if (!email) return j({ error: 'auth_required' }, 401);
    const partner = await resolvePartner(email);
    if (!partner) return j({ error: 'not_a_partner' }, 403);
    const body = bodyPeek || await req.json();
    const action = String(body.action || 'create');

    if (action === 'libraries') {
      const lib = await loadLibraries(partner.id);
      return j({ success: true, templates: lib.tpls, forms: lib.forms });
    }
    // ── PM-990 Wave 7: coach account settings ──
    if (action === 'save_profile') {
      const patch = {};
      if (typeof body.name === 'string' && body.name.trim().length >= 2) patch.name = body.name.trim().slice(0, 80);
      if (typeof body.bio === 'string') patch.bio = body.bio.trim().slice(0, 2000) || null;
      const pr = await fetch(SUPABASE_URL + '/rest/v1/partner_partners?id=eq.' + partner.id + '&select=coach_profile&limit=1', { headers: H });
      const prow = pr.ok ? await pr.json() : [];
      const prof = (prow[0] && prow[0].coach_profile && typeof prow[0].coach_profile === 'object') ? prow[0].coach_profile : {};
      const src = (body.profile && typeof body.profile === 'object') ? body.profile : {};
      for (const k of Object.keys(PROFILE_TEXT_KEYS)) {
        if (!(k in src)) continue;
        const v = String(src[k] == null ? '' : src[k]).trim();
        if (!v) { delete prof[k]; continue; }
        if (k === 'welcome_video_url' && !/^https:\/\/(www\.)?(youtube\.com|youtu\.be|vimeo\.com)\//i.test(v)) return j({ error: 'welcome_video_url must be a YouTube or Vimeo link' }, 400);
        prof[k] = v.slice(0, PROFILE_TEXT_KEYS[k]);
      }
      for (const k of ['photo_path', 'logo_path']) {
        if (!(k in src)) continue;
        const v = String(src[k] == null ? '' : src[k]).trim();
        if (!v) { delete prof[k]; continue; }
        if (v.indexOf('p-' + partner.id + '/profile/') !== 0) return j({ error: k + ' must live in your profile folder' }, 400);
        prof[k] = v.slice(0, 300);
      }
      patch.coach_profile = prof;
      const w = await fetch(SUPABASE_URL + '/rest/v1/partner_partners?id=eq.' + partner.id, { method: 'PATCH', headers: { ...H, 'Prefer': 'return=minimal' }, body: JSON.stringify(patch) });
      if (!w.ok) return j({ error: 'save_failed: ' + (await w.text()).slice(0, 200) }, 500);
      return j({ success: true, action: 'save_profile', profile: prof, name: patch.name || partner.name });
    }
    if (action === 'save_notify_prefs') {
      const src = (body.prefs && typeof body.prefs === 'object') ? body.prefs : {};
      const se = (src.events && typeof src.events === 'object') ? src.events : {};
      const ev = {};
      for (const k of NOTIFY_EVENTS) {
        const o = (se[k] && typeof se[k] === 'object') ? se[k] : {};
        ev[k] = { email: o.email === true, push: o.push === true };
      }
      const dt = /^([01]\d|2[0-3]):[0-5]\d$/.test(String(src.digest_time || '')) ? String(src.digest_time) : '18:00';
      const prefs = { events: ev, digest_time: dt };
      const w = await fetch(SUPABASE_URL + '/rest/v1/partner_partners?id=eq.' + partner.id, { method: 'PATCH', headers: { ...H, 'Prefer': 'return=minimal' }, body: JSON.stringify({ coach_notification_prefs: prefs }) });
      if (!w.ok) return j({ error: 'save_failed: ' + (await w.text()).slice(0, 200) }, 500);
      return j({ success: true, action: 'save_notify_prefs', prefs });
    }
    // ── W5 (#99): push the coach's gate defaults onto every non-archived client (merge over existing gates) ──
    if (action === 'apply_gate_defaults') {
      const defs = cleanGates(body.gates) || gateDefaults(partner);
      if (!defs) return j({ error: 'no_defaults' }, 400);
      const cr = await fetch(SUPABASE_URL + '/rest/v1/coach_clients?partner_id=eq.' + partner.id + '&status=neq.archived&select=id,member_email,assignments&limit=1000', { headers: H });
      const cls = cr.ok ? await cr.json() : [];
      let updated = 0;
      for (const c of cls) {
        const asg = (c.assignments && typeof c.assignments === 'object') ? c.assignments : {};
        const na = { ...asg, gates: { ...(asg.gates || {}), ...defs } };
        const w = await fetch(SUPABASE_URL + '/rest/v1/coach_clients?id=eq.' + c.id, { method: 'PATCH', headers: { ...H, 'Prefer': 'return=minimal' }, body: JSON.stringify({ assignments: na }) });
        if (w.ok) updated++;
      }
      return j({ success: true, action, updated, gates: defs });
    }
    if (action === 'create') {
      const lib = await loadLibraries(partner.id);
      const r = await provisionOne(partner, body, lib, true);
      if (!r.ok) return j({ error: r.error }, 400);
      return j({ success: true, action: 'create', client_email: String(body.email).toLowerCase().trim(), ...r });
    }
    if (action === 'bulk') {
      const rows = Array.isArray(body.rows) ? body.rows : [];
      if (!rows.length) return j({ error: 'rows required' }, 400);
      if (rows.length > 100) return j({ error: 'max 100 rows per upload' }, 400);
      const sendEmails = body.send_emails !== false;
      const lib = await loadLibraries(partner.id);
      const results = [];
      for (const row of rows) {
        const r = await provisionOne(partner, row, lib, sendEmails);
        results.push({ email: String(row.email || '').toLowerCase().trim(), ...r });
      }
      const okCount = results.filter((r) => r.ok).length;
      return j({ success: true, action: 'bulk', total: rows.length, created: okCount, failed: rows.length - okCount, results });
    }
    // ── PM-1035 W4b: batch assign + tags (partner-scoped, no single client email) ──
    if (action === 'list_batches') {
      return j({ success: true, action, batches: await listBatches(partner) });
    }
    if (action === 'batch_dry_run' || action === 'batch_apply') {
      const key = String(body.slot_key || '');
      const tplId = String(body.template_id || '').trim();
      if (!SLOT_KEYS.includes(key)) return j({ error: 'slot_key must be one of ' + SLOT_KEYS.join(', ') }, 400);
      const lib = await loadLibraries(partner.id);
      if (!tplId || !slotPool(key, lib).some((x) => x.id === tplId)) return j({ error: 'template_id: not one of your saved items for that slot' }, 400);
      const emails = Array.isArray(body.emails) ? body.emails : [];
      if (!emails.length) return j({ error: 'emails required' }, 400);
      if (action === 'batch_dry_run') return j({ success: true, action, ...(await batchDryRun(partner, lib, key, tplId, emails)) });
      const r = await batchApply(partner, lib, key, tplId, emails, body.reason, email, notifyWanted(body));
      if (r.error) return j({ error: r.error, cap: r.cap }, r.error === 'over_cap' || r.error === 'no_clients' ? 400 : 500);
      return j({ success: true, action, ...r });
    }
    if (action === 'batch_revert') {
      const lib = await loadLibraries(partner.id);
      const r = await batchRevert(partner, lib, String(body.batch_id || ''));
      if (r.error) return j({ error: r.error }, r.error === 'batch_not_found' ? 404 : 500);
      return j({ success: true, action, ...r });
    }
    if (action === 'rename_tag' || action === 'delete_tag') {
      const from = String(body.from || body.tag || '').trim();
      if (!from) return j({ error: 'tag required' }, 400);
      const q = SUPABASE_URL + '/rest/v1/coach_client_tags?partner_id=eq.' + partner.id + '&tag=ilike.' + encodeURIComponent(from);
      if (action === 'delete_tag') {
        const d = await fetch(q, { method: 'DELETE', headers: { ...H, 'Prefer': 'return=representation' } });
        const rows = d.ok ? await d.json() : [];
        return j({ success: true, action, removed: rows.length });
      }
      const to = String(body.to || '').trim().replace(/\s+/g, ' ').slice(0, 40);
      if (!to) return j({ error: 'to required' }, 400);
      const cr = await fetch(q + '&select=id,member_email', { headers: H });
      const cur = cr.ok ? await cr.json() : [];
      let renamed = 0, merged = 0;
      for (const t of cur) {
        // merge-aware: if the client already carries the target name (case-insensitive), drop this row instead
        const ex = await fetch(SUPABASE_URL + '/rest/v1/coach_client_tags?partner_id=eq.' + partner.id + '&member_email=ilike.' + encodeURIComponent(t.member_email) + '&tag=ilike.' + encodeURIComponent(to) + '&id=neq.' + t.id + '&select=id&limit=1', { headers: H });
        const exists = ex.ok ? await ex.json() : [];
        if (exists.length) { await fetch(SUPABASE_URL + '/rest/v1/coach_client_tags?id=eq.' + t.id, { method: 'DELETE', headers: { ...H, 'Prefer': 'return=minimal' } }); merged++; }
        else { const u = await fetch(SUPABASE_URL + '/rest/v1/coach_client_tags?id=eq.' + t.id, { method: 'PATCH', headers: { ...H, 'Prefer': 'return=minimal' }, body: JSON.stringify({ tag: to }) }); if (u.ok) renamed++; }
      }
      return j({ success: true, action, renamed, merged });
    }

    const clientEmail = String(body.email || '').toLowerCase().trim();
    if (!clientEmail || !clientEmail.includes('@')) return j({ error: 'valid client email required' }, 400);
    const row = await getClientRow(partner.id, clientEmail);
    if (!row) return j({ error: 'client_not_found' }, 404);
    if (action === 'set_client_tags') {
      // PM-1035: replacement set, ≤20, own client only (row resolved above).
      const tags = cleanTags(body.tags);
      if (tags.length > TAG_CAP) return j({ error: 'max ' + TAG_CAP + ' tags per client' }, 400);
      const cr = await fetch(SUPABASE_URL + '/rest/v1/coach_client_tags?partner_id=eq.' + partner.id + '&member_email=ilike.' + encodeURIComponent(clientEmail) + '&select=id,tag', { headers: H });
      const cur = cr.ok ? await cr.json() : [];
      const wantK = new Set(tags.map((t) => t.toLowerCase()));
      const haveK = new Set(cur.map((t) => String(t.tag).toLowerCase()));
      const del = cur.filter((t) => !wantK.has(String(t.tag).toLowerCase())).map((t) => t.id);
      const add = tags.filter((t) => !haveK.has(t.toLowerCase()));
      if (del.length) await fetch(SUPABASE_URL + '/rest/v1/coach_client_tags?id=in.(' + del.join(',') + ')', { method: 'DELETE', headers: { ...H, 'Prefer': 'return=minimal' } });
      if (add.length) {
        const ins = await fetch(SUPABASE_URL + '/rest/v1/coach_client_tags', { method: 'POST', headers: { ...H, 'Prefer': 'return=minimal' }, body: JSON.stringify(add.map((t) => ({ partner_id: partner.id, member_email: clientEmail, tag: t }))) });
        if (!ins.ok) return j({ error: 'tag_write_failed: ' + (await ins.text()).slice(0, 200) }, 500);
      }
      return j({ success: true, action, tags, added: add.length, removed: del.length });
    }
    if (action === 'update_assignments') {
      const lib = await loadLibraries(partner.id);
      const validIds = new Set([...lib.tpls.map((t) => t.id), ...lib.forms.map((f) => f.id)]);
      const KEYS = ['onboarding_form_id', 'checkin_form_id', 'habits_template_id', 'workout_template_id', 'nutrition_template_id', 'supplements_template_id'];
      const oldAsg = (row.assignments && typeof row.assignments === 'object') ? row.assignments : {};
      // PM-1035: merge_slots:true keeps every slot not named in the request (explicit null/'' clears);
      // default remains the Plans-tab contract — slots absent from the request are cleared.
      const merge = body.merge_slots === true;
      // PM-983: start from preserved meta keys so a slot save never wipes check-in day etc.
      const na = {};
      if (merge) Object.assign(na, oldAsg);
      else for (const mk of META_KEYS) if (oldAsg[mk] !== undefined) na[mk] = oldAsg[mk];
      const src = (body.assignments && typeof body.assignments === 'object') ? body.assignments : {};
      for (const k of KEYS) {
        if (merge && !(k in src)) continue;
        if (merge && (src[k] === null || String(src[k]).trim() === '')) { delete na[k]; continue; }
        const v = String(src[k] || '').trim();
        if (!v) continue;
        if (!validIds.has(v)) return j({ error: k + ': not one of your saved items' }, 400);
        na[k] = v;
      }
      // Meta fields settable through the same action (validated, overlay wins).
      const metaIn = metaFromSpec(src);
      if (metaIn._meta) metaIn._meta = { ...(na._meta || {}), ...metaIn._meta };
      Object.assign(na, metaIn);
      // PM-987 Wave 5: water goal + slim per-client feature gates (member-read direct).
      if ('water_goal' in src) {
        if (src.water_goal === null || src.water_goal === '') delete na.water_goal;
        else { const wgl = parseFloat(src.water_goal); if (!isNaN(wgl) && wgl >= 0.5 && wgl <= 8) na.water_goal = Math.round(wgl * 10) / 10; }
      }
      // W5 (#99): typed gate merge — only recognised keys/values land; an explicit null on a key clears it.
      if (src.gates && typeof src.gates === 'object') {
        const g = { ...(na.gates || {}), ...(cleanGates(src.gates) || {}) };
        for (const gk of Object.keys(src.gates)) if (src.gates[gk] === null) delete g[gk];
        if (Object.keys(g).length) na.gates = g; else delete na.gates;
      }
      // W2 (#103): per-client threshold alerts. null clears; calorie_pct 50..300 or null; every_meal boolean.
      if ('alerts' in src) {
        if (src.alerts === null) delete na.alerts;
        else if (src.alerts && typeof src.alerts === 'object') {
          const al = { ...(na.alerts || {}) };
          if ('calorie_pct' in src.alerts) { const pc = parseInt(src.alerts.calorie_pct); if (src.alerts.calorie_pct === null || isNaN(pc)) delete al.calorie_pct; else al.calorie_pct = Math.min(300, Math.max(50, pc)); }
          if (typeof src.alerts.every_meal === 'boolean') { if (src.alerts.every_meal) al.every_meal = true; else delete al.every_meal; }
          if (Object.keys(al).length) na.alerts = al; else delete na.alerts;
        }
      }
      // W5 (#81): next-phase queue. null / [] clears; otherwise validated replacement list.
      if ('workout_queue' in src) {
        if (src.workout_queue === null || (Array.isArray(src.workout_queue) && !src.workout_queue.length)) delete na.workout_queue;
        else {
          const cq = cleanQueue(src.workout_queue, lib);
          if (cq.errors.length) return j({ error: cq.errors.join('; ') }, 400);
          if (cq.queue.length) na.workout_queue = cq.queue; else delete na.workout_queue;
        }
      }
      // W5 (#104): schedule overrides. null clears; otherwise validated replacement map (portal sends the whole map).
      if ('schedule_overrides' in src) {
        if (src.schedule_overrides === null) delete na.schedule_overrides;
        else { const ov = cleanOverrides(src.schedule_overrides); if (Object.keys(ov).length) na.schedule_overrides = ov; else delete na.schedule_overrides; }
      }
      const w = await fetch(SUPABASE_URL + '/rest/v1/coach_clients?id=eq.' + row.id, { method: 'PATCH', headers: { ...H, 'Prefer': 'return=minimal' }, body: JSON.stringify({ assignments: na }) });
      if (!w.ok) return j({ error: 'save_failed: ' + (await w.text()).slice(0, 200) }, 500);
      // W5: "Programme starts" — re-anchor the active coach workout plan (no re-apply, nothing else moves).
      let weekStartSet = null;
      if (typeof src.week_start === 'string' && ISO_DATE.test(src.week_start)) {
        const ws = mondayOfIso(src.week_start);
        const cur = await activeWpc(clientEmail);
        if (cur && cur.source === 'coach') {
          const pw = await fetch(SUPABASE_URL + '/rest/v1/workout_plan_cache?id=eq.' + cur.id, { method: 'PATCH', headers: { ...H, 'Prefer': 'return=minimal' }, body: JSON.stringify({ week_start: ws }) });
          if (pw.ok) weekStartSet = ws;
        }
      }
      let applied = null, automations = [];
      const notify = notifyWanted(body);
      const slotChanged = KEYS.some((k) => (na[k] || null) !== (oldAsg[k] || null));
      // W5: a pure overrides / queue / gates / week_start save does NOT re-materialise (nothing changed on the templates).
      const needsApply = row.status === 'active' && row.consent_accepted_at && (slotChanged || body.reapply === true || !('workout_queue' in src || 'schedule_overrides' in src || 'week_start' in src || src.gates) || 'water_goal' in src || 'habit_note' in src);
      if (needsApply) {
        applied = await applyAssignments(partner.id, clientEmail);
        if (applied && !applied.error) {
          const changed = Object.keys(AUTO_EVENTS).filter((k) => na[k] && na[k] !== oldAsg[k]);
          automations = await fireAutomations(partner, clientEmail, changed, lib, oldAsg, na, notify);
        }
      }
      // PM-987: event feed — slot changes + water/gates changes. W5: + queue / overrides / week_start.
      const evs = [];
      for (const k of KEYS) {
        if ((na[k] || null) === (oldAsg[k] || null)) continue;
        if (na[k]) {
          const it = lib.tpls.find((t) => t.id === na[k]) || lib.forms.find((f) => f.id === na[k]);
          evs.push({ kind: 'plan_assigned', label: 'Assigned ' + (SLOT_LABEL[k] || 'plan') + ': ' + ((it && (it.name || it.title)) || 'plan') });
        } else evs.push({ kind: 'plan_cleared', label: 'Removed ' + (SLOT_LABEL[k] || 'plan') });
      }
      if ((na.water_goal || null) !== (oldAsg.water_goal || null)) evs.push({ kind: 'water_goal', label: na.water_goal ? 'Set daily water goal: ' + na.water_goal + 'L' : 'Cleared daily water goal' });
      if (JSON.stringify(na.gates || {}) !== JSON.stringify(oldAsg.gates || {})) evs.push({ kind: 'gates', label: 'Updated client permissions', meta: na.gates || {} });
      if (JSON.stringify(na.workout_queue || []) !== JSON.stringify(oldAsg.workout_queue || [])) evs.push({ kind: 'phase_queue', label: (na.workout_queue || []).length ? 'Next phase queued: ' + (na.workout_queue || []).map((q) => (slotName('workout_template_id', q.template_id, lib) || 'plan') + (q.start_on === 'on_end' ? '' : ' from ' + q.start_on)).join(' \u2192 ') : 'Next-phase queue cleared', meta: { queue: na.workout_queue || [] } });
      if (JSON.stringify(na.schedule_overrides || {}) !== JSON.stringify(oldAsg.schedule_overrides || {})) evs.push({ kind: 'schedule', label: 'Schedule adjusted: ' + Object.keys(na.schedule_overrides || {}).length + ' session' + (Object.keys(na.schedule_overrides || {}).length === 1 ? '' : 's') + ' moved or skipped', meta: na.schedule_overrides || {} });
      if (weekStartSet) evs.push({ kind: 'week_start', label: 'Programme start set to ' + weekStartSet, meta: { week_start: weekStartSet } });
      await logEvents(partner.id, clientEmail, evs);
      return j({ success: true, action: 'update_assignments', assignments: na, applied, automations, notify_requested: notify, notified: automations.some((a) => String(a).endsWith(':push')), week_start: weekStartSet });
    }
    if (action === 'update_client') {
      // PM-983 edit wizard: invited_* names always editable; the members profile row only
      // while the client has never activated (member-first — once active it's theirs).
      const fn = String(body.firstName || '').trim(), ln = String(body.lastName || '').trim();
      const patch = {};
      if (fn) patch.invited_first_name = fn;
      if (ln || body.lastName === '') patch.invited_last_name = ln || null;
      if (Object.keys(patch).length) {
        const w = await fetch(SUPABASE_URL + '/rest/v1/coach_clients?id=eq.' + row.id, { method: 'PATCH', headers: { ...H, 'Prefer': 'return=minimal' }, body: JSON.stringify(patch) });
        if (!w.ok) return j({ error: 'save_failed: ' + (await w.text()).slice(0, 200) }, 500);
      }
      if (row.status === 'invited' && !row.consent_accepted_at) {
        const mp = {};
        if (fn) mp.first_name = fn;
        if (ln) mp.last_name = ln;
        if (body.dob) mp.dob = body.dob;
        if (body.gender !== undefined) mp.gender = body.gender || null;
        if (body.weightUnit && ['kg', 'lb', 'st'].includes(String(body.weightUnit))) mp.weight_unit = String(body.weightUnit);
        if (Object.keys(mp).length) {
          const mw = await fetch(SUPABASE_URL + '/rest/v1/members?email=ilike.' + encodeURIComponent(clientEmail), { method: 'PATCH', headers: { ...H, 'Prefer': 'return=minimal' }, body: JSON.stringify(mp) });
          if (!mw.ok) console.warn('update_client members patch failed:', await mw.text());
        }
      }
      return j({ success: true, action: 'update_client' });
    }
    if (action === 'resend' || action === 'copy_link') {
      const code = await ensureCode(row);
      const link = prettyLink(code);
      let emailSent = false;
      if (action === 'resend') {
        const asg = (row.assignments && typeof row.assignments === 'object') ? row.assignments : {};
        const packUrl = await signPacks(asg._meta);
        emailSent = await sendInviteEmail(clientEmail, row.invited_first_name || 'there', partner.name, link, packUrl);
      }
      await fetch(SUPABASE_URL + '/rest/v1/coach_clients?id=eq.' + row.id, { method: 'PATCH', headers: { ...H, 'Prefer': 'return=minimal' }, body: JSON.stringify({ invite_sent_at: new Date().toISOString(), invite_count: (row.invite_count || 0) + 1 }) });
      if (action === 'resend') await logEvents(partner.id, clientEmail, [{ kind: 'invite_resent', label: 'Invite email re-sent' }]);
      return j({ success: true, action, invite_link: link, email_sent: emailSent });
    }
    if (action === 'archive') {
      await fetch(SUPABASE_URL + '/rest/v1/coach_clients?id=eq.' + row.id, { method: 'PATCH', headers: { ...H, 'Prefer': 'return=minimal' }, body: JSON.stringify({ status: 'archived', archived_at: new Date().toISOString() }) });
      await logEvents(partner.id, clientEmail, [{ kind: 'archived', label: 'Client archived' }]);
      return j({ success: true, action: 'archive' });
    }
    if (action === 'reactivate') {
      const status = row.consent_accepted_at ? 'active' : 'invited';
      await fetch(SUPABASE_URL + '/rest/v1/coach_clients?id=eq.' + row.id, { method: 'PATCH', headers: { ...H, 'Prefer': 'return=minimal' }, body: JSON.stringify({ status, archived_at: null }) });
      await logEvents(partner.id, clientEmail, [{ kind: 'reactivated', label: 'Client reactivated' }]);
      return j({ success: true, action: 'reactivate', status });
    }
    return j({ error: 'unknown_action' }, 400);
  } catch (err) {
    console.error('coach-provision-client error:', err);
    return j({ error: String(err).slice(0, 500) }, 500);
  }
});
