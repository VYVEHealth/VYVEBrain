// admin-member-programme v6 — Member Admin W5 (5 September 2026): plan-change notification.
//   v6: assign_template queues ONE scheduled_pushes row (type plan_change, data.url
//       /workouts.html) after a successful apply — send-push turns it into the bell row +
//       web/native push; never insert member_notifications here. Gated by
//       PLAN_CHANGE_NOTIFY (off until Lewis approves copy); {notify:true} overrides for
//       staff testing. Response gains notify_requested/notified. Else byte-equivalent to v5.
// admin-member-programme v5 — Member Admin W2 (5 September 2026): assign goes through
// the one data layer.
//   v5: assign_template now calls SQL `vyve_apply_template(member, template_id, actor)`
//       (SECURITY DEFINER, service_role only) instead of writing workout_plan_cache
//       itself. Accepts {template_id} (coach_templates row, partner_id IS NULL, active)
//       OR the legacy {library_programme_id} (mapped via payload->>'source_library_id'
//       — programme_library is RETIRED from the VYVE path, its 35 rows migrated).
//       NEW action list_templates {kind?} → VYVE-scope templates for pickers.
//   v4: rewritten to the live wpc contract (one ACTIVE row per member+surface, history
//       retained; pause/resume/advance by row id). W0 gate: role IN ('admin','team').
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
const CORS_ALLOWLIST = new Set([
  'https://online.vyvehealth.co.uk',
  'https://www.vyvehealth.co.uk',
  'https://admin.vyvehealth.co.uk',
  'https://vyvehealth.co.uk',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:8080',
  'http://127.0.0.1:5500'
]);
const STAFF_ROLES = new Set([
  'admin',
  'team'
]);
const ROW_COLS = 'id, member_email, plan_duration_weeks, current_week, current_session, is_active, paused_at, source, source_id, generated_at, programme_json';
function corsHeaders(origin) {
  const allow = origin && CORS_ALLOWLIST.has(origin) ? origin : 'https://admin.vyvehealth.co.uk';
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
    'Access-Control-Max-Age': '3600',
    'Vary': 'Origin'
  };
}
function json(body, status = 200, origin = null) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(origin)
    }
  });
}
const service = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false
  }
});
const anon = createClient(SUPABASE_URL, ANON_KEY, {
  auth: {
    persistSession: false
  }
});
async function verifyAuth(req) {
  const origin = req.headers.get('origin');
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return json({
      success: false,
      error: 'Missing or invalid authorization header'
    }, 401, origin);
  }
  const token = authHeader.slice(7);
  let email;
  try {
    const { data, error } = await anon.auth.getUser(token);
    if (error || !data.user?.email) {
      return json({
        success: false,
        error: 'Invalid token'
      }, 401, origin);
    }
    email = data.user.email.toLowerCase();
  } catch  {
    return json({
      success: false,
      error: 'Token verification failed'
    }, 401, origin);
  }
  const { data: admin, error: adminError } = await service.from('admin_users').select('email, role, active').eq('email', email).eq('active', true).maybeSingle();
  if (adminError || !admin) {
    console.warn('Admin access denied for', email, adminError?.message);
    return json({
      success: false,
      error: 'Admin access denied'
    }, 403, origin);
  }
  if (!STAFF_ROLES.has(admin.role)) {
    console.warn('Admin access denied (role) for', email, admin.role);
    return json({
      success: false,
      error: 'Admin access denied'
    }, 403, origin);
  }
  return {
    email: admin.email,
    role: admin.role
  };
}
function clientInfo(req) {
  const ip = req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';
  return {
    ip,
    userAgent: req.headers.get('user-agent') || 'unknown'
  };
}
function optionalReason(reason) {
  if (typeof reason !== 'string') return null;
  const t = reason.trim();
  return t.length > 0 ? t : null;
}
function isValidUuid(v) {
  return typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}
async function writeAudit(req, admin, params) {
  const { ip, userAgent } = clientInfo(req);
  const { error } = await service.from('admin_audit_log').insert({
    admin_email: admin.email,
    admin_role: admin.role,
    member_email: params.member_email,
    action: params.action,
    table_name: 'workout_plan_cache',
    column_name: params.column_name,
    old_value: params.old_value ?? null,
    new_value: params.new_value ?? null,
    reason: params.reason,
    ip_address: ip,
    user_agent: userAgent,
    created_at: new Date().toISOString()
  });
  if (error) console.error('Audit log insert failed:', error);
  return !error;
}
function summarise(row, includeJson) {
  const pj = row.programme_json ?? {};
  return {
    id: row.id,
    member_email: row.member_email,
    surface: pj.surface ?? null,
    programme_name: pj.programme_name ?? null,
    plan_type: pj.plan_type ?? null,
    split_type: pj.split_type ?? null,
    sessions_per_week: pj.sessions_per_week ?? (Array.isArray(pj.weeks?.[0]?.sessions) ? pj.weeks[0].sessions.length : null),
    weeks_count: Array.isArray(pj.weeks) ? pj.weeks.length : null,
    plan_duration_weeks: row.plan_duration_weeks,
    current_week: row.current_week,
    current_session: row.current_session,
    is_active: row.is_active,
    paused_at: row.paused_at,
    source: row.source,
    source_id: row.source_id,
    generated_at: row.generated_at,
    ...includeJson ? {
      programme_json: pj
    } : {}
  };
}
async function loadRow(id) {
  return await service.from('workout_plan_cache').select(ROW_COLS).eq('id', id).maybeSingle();
}
// ---------- W5 plan-change notification ----------
// One scheduled_pushes row per member, fire_at=now(). process-scheduled-pushes (*/5) hands it to
// send-push, which writes the member_notifications row (route from data.url) AND fans out web +
// native push in one pass — so this is the ONLY write; inserting member_notifications here too
// would give the member two bell entries. Gated: PLAN_CHANGE_NOTIFY defaults OFF until Lewis
// approves the copy; a staff caller may pass {notify:true} to send anyway (device testing).
const PLAN_CHANGE_NOTIFY = false; // [LEWIS COPY PASS] flip to true once the strings below are approved
const PLAN_CHANGE_COPY = {
  program: {
    title: 'Your programme has been updated',
    body: (name)=>`${name} is now your active programme. Open Workouts to see this week's sessions.`,
    url: '/workouts.html'
  },
  habits: {
    title: 'Your habits have been updated',
    body: (name)=>`Your new habit set is ready: ${name}. Open Habits to get started.`,
    url: '/habits.html'
  }
};
function notifyWanted(body) {
  if (body?.notify === true) return true; // explicit staff override (testing / early adopters)
  if (body?.notify === false) return false;
  return PLAN_CHANGE_NOTIFY;
}
async function queuePlanChange(email, kind, templateName, dedupeSuffix, actor) {
  const copy = PLAN_CHANGE_COPY[kind];
  if (!copy) return {
    queued: false,
    error: 'no_copy_for_kind'
  };
  const name = (templateName || '').trim() || (kind === 'program' ? 'A new programme' : 'A new habit set');
  const { error } = await service.from('scheduled_pushes').upsert({
    member_email: email,
    fire_at: new Date().toISOString(),
    type: 'plan_change',
    title: copy.title,
    body: copy.body(name),
    data: {
      url: copy.url,
      kind,
      template_name: name,
      actor
    },
    dedupe_key: `plan_change:${dedupeSuffix}`
  }, {
    onConflict: 'member_email,dedupe_key',
    ignoreDuplicates: true
  });
  if (error) {
    console.error('plan_change queue failed:', email, error.message);
    return {
      queued: false,
      error: error.message
    };
  }
  return {
    queued: true
  };
}
// ---------- get_programme ----------
async function handleGetProgramme(req, _admin, body) {
  const origin = req.headers.get('origin');
  const { member_email } = body;
  if (!member_email || typeof member_email !== 'string') {
    return json({
      success: false,
      error: 'member_email is required'
    }, 400, origin);
  }
  const email = member_email.toLowerCase().trim();
  const includeJson = body.include_json === true;
  const { data, error } = await service.from('workout_plan_cache').select(ROW_COLS).eq('member_email', email).order('is_active', {
    ascending: false
  }).order('generated_at', {
    ascending: false
  });
  if (error) {
    console.error('get_programme failed:', error);
    return json({
      success: false,
      error: 'Failed to load programme',
      details: error.message
    }, 500, origin);
  }
  const rows = (data ?? []).map((r)=>summarise(r, includeJson));
  const by_surface = {};
  for (const r of rows){
    if (r.is_active && r.surface && !by_surface[r.surface]) by_surface[r.surface] = r;
  }
  return json({
    success: true,
    member_email: email,
    rows,
    by_surface,
    active_count: rows.filter((r)=>r.is_active).length
  }, 200, origin);
}
// ---------- list_templates (VYVE scope) ----------
async function handleListTemplates(req, _admin, body) {
  const origin = req.headers.get('origin');
  const kind = typeof body.kind === 'string' && body.kind ? body.kind : 'program';
  const includeInactive = body.include_inactive === true;
  let q = service.from('coach_templates').select('id, kind, name, active, created_at, updated_at, payload').is('partner_id', null).eq('kind', kind).order('name', {
    ascending: true
  });
  if (!includeInactive) q = q.eq('active', true);
  const { data, error } = await q;
  if (error) return json({
    success: false,
    error: 'Failed to load templates',
    details: error.message
  }, 500, origin);
  const templates = (data ?? []).map((t)=>{
    const p = t.payload ?? {};
    const pre = p.prebuilt ?? null;
    return {
      id: t.id,
      kind: t.kind,
      name: t.name,
      active: t.active,
      surface: p.surface ?? pre?.surface ?? 'workouts',
      description: p.description ?? null,
      category: p.category ?? null,
      difficulty: p.difficulty ?? null,
      equipment: p.equipment ?? null,
      days_per_week: p.days_per_week ?? null,
      duration_weeks: p.duration_weeks ?? (Array.isArray(pre?.weeks) ? pre.weeks.length : Array.isArray(p.weeks) ? p.weeks.length : null),
      source_library_id: p.source_library_id ?? null,
      prebuilt: !!pre,
      created_at: t.created_at,
      updated_at: t.updated_at
    };
  });
  return json({
    success: true,
    kind,
    templates
  }, 200, origin);
}
// ---------- pause / resume / advance (row-level) ----------
async function handlePause(req, admin, body) {
  const origin = req.headers.get('origin');
  const { id } = body;
  const reason = optionalReason(body.reason);
  if (!isValidUuid(id)) return json({
    success: false,
    error: 'id must be a workout_plan_cache uuid'
  }, 400, origin);
  const { data: row, error } = await loadRow(id);
  if (error) return json({
    success: false,
    error: 'Fetch failed',
    details: error.message
  }, 500, origin);
  if (!row) return json({
    success: false,
    error: 'Programme row not found'
  }, 404, origin);
  if (row.is_active === false) return json({
    success: true,
    no_op: true,
    message: 'Row already inactive',
    row: summarise(row, false)
  }, 200, origin);
  const pausedAt = new Date().toISOString();
  const { error: updErr } = await service.from('workout_plan_cache').update({
    is_active: false,
    paused_at: pausedAt
  }).eq('id', id);
  if (updErr) return json({
    success: false,
    error: 'Pause failed',
    details: updErr.message
  }, 500, origin);
  const pj = row.programme_json ?? {};
  const audit_logged = await writeAudit(req, admin, {
    member_email: row.member_email,
    action: 'programme_pause',
    column_name: 'is_active',
    old_value: {
      wpc_id: id,
      is_active: true,
      surface: pj.surface ?? null,
      programme_name: pj.programme_name ?? null
    },
    new_value: {
      wpc_id: id,
      is_active: false,
      paused_at: pausedAt,
      surface: pj.surface ?? null,
      programme_name: pj.programme_name ?? null
    },
    reason
  });
  return json({
    success: true,
    id,
    paused_at: pausedAt,
    audit_logged
  }, 200, origin);
}
async function handleResume(req, admin, body) {
  const origin = req.headers.get('origin');
  const { id } = body;
  const reason = optionalReason(body.reason);
  if (!isValidUuid(id)) return json({
    success: false,
    error: 'id must be a workout_plan_cache uuid'
  }, 400, origin);
  const { data: row, error } = await loadRow(id);
  if (error) return json({
    success: false,
    error: 'Fetch failed',
    details: error.message
  }, 500, origin);
  if (!row) return json({
    success: false,
    error: 'Programme row not found'
  }, 404, origin);
  if (row.is_active === true) return json({
    success: true,
    no_op: true,
    message: 'Row already active',
    row: summarise(row, false)
  }, 200, origin);
  const pj = row.programme_json ?? {};
  const surface = pj.surface ?? null;
  if (!surface) return json({
    success: false,
    error: 'Row has no programme_json.surface; cannot resume safely'
  }, 422, origin);
  const { data: others } = await service.from('workout_plan_cache').select('id, programme_json').eq('member_email', row.member_email).eq('is_active', true).filter('programme_json->>surface', 'eq', surface).neq('id', id);
  const displaced = (others ?? []).map((o)=>({
      wpc_id: o.id,
      programme_name: o.programme_json?.programme_name ?? null
    }));
  if (displaced.length) {
    const { error: dErr } = await service.from('workout_plan_cache').update({
      is_active: false
    }).in('id', displaced.map((d)=>d.wpc_id));
    if (dErr) return json({
      success: false,
      error: 'Could not deactivate the currently active row',
      details: dErr.message
    }, 500, origin);
  }
  const { error: updErr } = await service.from('workout_plan_cache').update({
    is_active: true,
    paused_at: null
  }).eq('id', id);
  if (updErr) return json({
    success: false,
    error: 'Resume failed',
    details: updErr.message
  }, 500, origin);
  const audit_logged = await writeAudit(req, admin, {
    member_email: row.member_email,
    action: 'programme_resume',
    column_name: 'is_active',
    old_value: {
      wpc_id: id,
      is_active: false,
      paused_at: row.paused_at,
      surface,
      programme_name: pj.programme_name ?? null,
      displaced
    },
    new_value: {
      wpc_id: id,
      is_active: true,
      paused_at: null,
      surface,
      programme_name: pj.programme_name ?? null
    },
    reason
  });
  return json({
    success: true,
    id,
    displaced,
    audit_logged
  }, 200, origin);
}
async function handleAdvanceWeek(req, admin, body) {
  const origin = req.headers.get('origin');
  const { id, to_week } = body;
  const reason = optionalReason(body.reason);
  if (!isValidUuid(id)) return json({
    success: false,
    error: 'id must be a workout_plan_cache uuid'
  }, 400, origin);
  const toWeekNum = typeof to_week === 'number' ? to_week : parseInt(String(to_week), 10);
  if (!Number.isInteger(toWeekNum) || toWeekNum < 1) return json({
    success: false,
    error: 'to_week must be a positive integer'
  }, 400, origin);
  const { data: row, error } = await loadRow(id);
  if (error) return json({
    success: false,
    error: 'Fetch failed',
    details: error.message
  }, 500, origin);
  if (!row) return json({
    success: false,
    error: 'Programme row not found'
  }, 404, origin);
  const pj = row.programme_json ?? {};
  const maxWeek = row.plan_duration_weeks ?? (Array.isArray(pj.weeks) ? pj.weeks.length : null);
  if (maxWeek && toWeekNum > maxWeek) return json({
    success: false,
    error: `to_week exceeds plan duration (max ${maxWeek})`
  }, 400, origin);
  if (row.current_week === toWeekNum && row.current_session === 1) {
    return json({
      success: true,
      no_op: true,
      message: 'Already at requested week, session 1'
    }, 200, origin);
  }
  const { error: updErr } = await service.from('workout_plan_cache').update({
    current_week: toWeekNum,
    current_session: 1
  }).eq('id', id);
  if (updErr) return json({
    success: false,
    error: 'Advance failed',
    details: updErr.message
  }, 500, origin);
  const audit_logged = await writeAudit(req, admin, {
    member_email: row.member_email,
    action: 'programme_advance_week',
    column_name: 'current_week',
    old_value: {
      wpc_id: id,
      current_week: row.current_week,
      current_session: row.current_session,
      programme_name: pj.programme_name ?? null
    },
    new_value: {
      wpc_id: id,
      current_week: toWeekNum,
      current_session: 1,
      programme_name: pj.programme_name ?? null
    },
    reason
  });
  return json({
    success: true,
    id,
    current_week: toWeekNum,
    current_session: 1,
    audit_logged
  }, 200, origin);
}
// ---------- assign_template (alias swap_plan) — via vyve_apply_template() ----------
async function handleAssignTemplate(req, admin, body) {
  const origin = req.headers.get('origin');
  const { member_email } = body;
  const reason = optionalReason(body.reason);
  if (!member_email || typeof member_email !== 'string') return json({
    success: false,
    error: 'member_email is required'
  }, 400, origin);
  const email = member_email.toLowerCase().trim();
  let templateId = null;
  if (isValidUuid(body.template_id)) {
    templateId = body.template_id;
  } else if (isValidUuid(body.library_programme_id)) {
    // Legacy caller shape: map the retired programme_library id onto its migrated template.
    const { data: t } = await service.from('coach_templates').select('id').is('partner_id', null).eq('kind', 'program').filter('payload->>source_library_id', 'eq', body.library_programme_id).maybeSingle();
    if (!t) return json({
      success: false,
      error: 'No VYVE template migrated for that library programme'
    }, 404, origin);
    templateId = t.id;
  } else {
    return json({
      success: false,
      error: 'template_id (or legacy library_programme_id) must be a valid UUID'
    }, 400, origin);
  }
  const { data: tpl } = await service.from('coach_templates').select('id, name, active, payload').eq('id', templateId).is('partner_id', null).eq('kind', 'program').maybeSingle();
  if (!tpl) return json({
    success: false,
    error: 'Template not found in VYVE scope'
  }, 404, origin);
  if (!tpl.active) return json({
    success: false,
    error: 'Cannot assign an inactive template'
  }, 400, origin);
  const { data: result, error: rpcErr } = await service.rpc('vyve_apply_template', {
    p_member_email: email,
    p_template_id: templateId,
    p_actor: admin.email
  });
  if (rpcErr) return json({
    success: false,
    error: 'Assign failed',
    details: rpcErr.message
  }, 500, origin);
  const r = result ?? {};
  if (!r.ok) {
    const status = r.error === 'member_not_found' ? 404 : r.error === 'template_not_found_or_not_vyve_scope' ? 404 : 422;
    return json({
      success: false,
      error: r.error ?? 'Assign failed'
    }, status, origin);
  }
  const audit_logged = await writeAudit(req, admin, {
    member_email: email,
    action: 'programme_assign',
    column_name: '__row__',
    old_value: {
      prior_wpc_id: r.prior_wpc_id ?? null,
      programme_name: r.prior_programme_name ?? null,
      surface: r.surface
    },
    new_value: {
      wpc_id: r.wpc_id,
      programme_name: r.programme_name,
      surface: r.surface,
      source: 'vyve',
      source_id: templateId,
      template_id: templateId,
      current_week: 1,
      current_session: 1,
      weeks_count: r.weeks
    },
    reason
  });
  const notify = notifyWanted(body);
  let notified = false, notify_error;
  if (notify) {
    const q = await queuePlanChange(email, 'program', r.programme_name ?? tpl.name, `wpc:${r.wpc_id}`, admin.email);
    notified = q.queued;
    notify_error = q.error;
  }
  return json({
    success: true,
    wpc_id: r.wpc_id,
    prior_wpc_id: r.prior_wpc_id ?? null,
    surface: r.surface,
    programme_name: r.programme_name,
    source: 'vyve',
    source_id: templateId,
    template_id: templateId,
    weeks_count: r.weeks,
    audit_logged,
    notify_requested: notify,
    notified,
    ...notify_error ? {
      notify_error
    } : {}
  }, 200, origin);
}
Deno.serve(async (req)=>{
  const origin = req.headers.get('origin');
  if (req.method === 'OPTIONS') return new Response('', {
    status: 200,
    headers: corsHeaders(origin)
  });
  if (req.method !== 'POST') return json({
    success: false,
    error: 'Method not allowed'
  }, 405, origin);
  const authResult = await verifyAuth(req);
  if (authResult instanceof Response) return authResult;
  let body;
  try {
    body = await req.json();
  } catch  {
    return json({
      success: false,
      error: 'Invalid JSON body'
    }, 400, origin);
  }
  const action = body?.action;
  if (!action) return json({
    success: false,
    error: 'action required'
  }, 400, origin);
  try {
    switch(action){
      case 'get_programme':
        return await handleGetProgramme(req, authResult, body);
      case 'list_templates':
        return await handleListTemplates(req, authResult, body);
      case 'pause_programme':
        return await handlePause(req, authResult, body);
      case 'resume_programme':
        return await handleResume(req, authResult, body);
      case 'advance_week':
        return await handleAdvanceWeek(req, authResult, body);
      case 'assign_template':
      case 'swap_plan':
        return await handleAssignTemplate(req, authResult, body);
      case 'regenerate':
        return json({
          success: false,
          error: 'regenerate is not available. Use assign_template.'
        }, 501, origin);
      default:
        return json({
          success: false,
          error: `Unknown action: ${action}`
        }, 400, origin);
    }
  } catch (e) {
    console.error('Handler error:', e);
    return json({
      success: false,
      error: 'Internal error'
    }, 500, origin);
  }
});
