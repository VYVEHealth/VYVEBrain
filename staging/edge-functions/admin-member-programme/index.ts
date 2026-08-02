// admin-member-programme v3 — VYVE Admin Console Shell 3, Sub-scope A (22 April 2026)
//   v3: reason field is now OPTIONAL on mutations. Still captured in audit log.
//   v2: verify_jwt=false at gateway (ES256 fix). In-code JWT verification retained.
//   Security unchanged: JWT + admin_users allowlist on every request.
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
function gateMutation(role, origin) {
  if (role === 'viewer') {
    return json({
      success: false,
      error: 'Viewer role cannot edit'
    }, 403, origin);
  }
  return null;
}
async function writeAudit(params) {
  const { error } = await service.from('admin_audit_log').insert({
    admin_email: params.admin_email,
    admin_role: params.admin_role,
    member_email: params.member_email,
    action: params.action,
    table_name: 'workout_plan_cache',
    column_name: params.column_name,
    old_value: params.old_value ?? null,
    new_value: params.new_value ?? null,
    reason: params.reason,
    ip_address: params.ip,
    user_agent: params.userAgent,
    created_at: new Date().toISOString()
  });
  if (error) console.error('Audit log insert failed:', error);
  return !error;
}
function validateProgrammeJson(pj) {
  if (!pj || typeof pj !== 'object' || Array.isArray(pj)) {
    return {
      valid: false,
      error: 'programme_json must be an object'
    };
  }
  if (!Array.isArray(pj.weeks) || pj.weeks.length === 0) {
    return {
      valid: false,
      error: 'programme_json.weeks must be a non-empty array'
    };
  }
  const firstWeek = pj.weeks[0];
  if (!firstWeek || !Array.isArray(firstWeek.sessions)) {
    return {
      valid: false,
      error: 'programme_json.weeks[0].sessions must be an array'
    };
  }
  const spw = firstWeek.sessions.length;
  if (spw === 0) {
    return {
      valid: false,
      error: 'programme_json has no sessions'
    };
  }
  return {
    valid: true,
    weeks_count: pj.weeks.length,
    sessions_per_week: spw
  };
}
async function handleGetProgramme(req, _admin, body) {
  const origin = req.headers.get('origin');
  const { member_email } = body;
  if (!member_email || typeof member_email !== 'string') {
    return json({
      success: false,
      error: 'member_email is required'
    }, 400, origin);
  }
  const email = member_email.toLowerCase();
  const { data, error } = await service.from('workout_plan_cache').select('id, member_email, plan_duration_weeks, current_week, current_session, is_active, paused_at, source, source_id, generated_at, programme_json').eq('member_email', email).maybeSingle();
  if (error) {
    console.error('get_programme failed:', error);
    return json({
      success: false,
      error: 'Failed to load programme',
      details: error.message
    }, 500, origin);
  }
  if (!data) return json({
    success: true,
    programme: null
  }, 200, origin);
  const include_json = body.include_json === true;
  const pj = data.programme_json;
  const summary = {
    id: data.id,
    member_email: data.member_email,
    plan_duration_weeks: data.plan_duration_weeks,
    current_week: data.current_week,
    current_session: data.current_session,
    is_active: data.is_active,
    paused_at: data.paused_at,
    source: data.source,
    source_id: data.source_id,
    generated_at: data.generated_at,
    programme_name: pj?.programme_name ?? null,
    split_type: pj?.split_type ?? null,
    sessions_per_week: pj?.sessions_per_week ?? (Array.isArray(pj?.weeks?.[0]?.sessions) ? pj.weeks[0].sessions.length : null),
    weeks_count: Array.isArray(pj?.weeks) ? pj.weeks.length : null,
    ...include_json ? {
      programme_json: pj
    } : {}
  };
  return json({
    success: true,
    programme: summary
  }, 200, origin);
}
async function handlePauseProgramme(req, admin, body) {
  const origin = req.headers.get('origin');
  const gate = gateMutation(admin.role, origin);
  if (gate) return gate;
  const { member_email } = body;
  const reason = optionalReason(body.reason);
  if (!member_email || typeof member_email !== 'string') {
    return json({
      success: false,
      error: 'member_email is required'
    }, 400, origin);
  }
  const email = member_email.toLowerCase();
  const { data: existing } = await service.from('workout_plan_cache').select('id, is_active, paused_at, programme_json').eq('member_email', email).maybeSingle();
  if (!existing) return json({
    success: false,
    error: 'Programme not found'
  }, 404, origin);
  if (existing.is_active === false) {
    return json({
      success: true,
      no_op: true,
      message: 'Programme already paused'
    }, 200, origin);
  }
  const pausedAt = new Date().toISOString();
  const { error: updErr } = await service.from('workout_plan_cache').update({
    is_active: false,
    paused_at: pausedAt
  }).eq('member_email', email);
  if (updErr) {
    console.error('pause update failed:', updErr);
    return json({
      success: false,
      error: 'Pause failed',
      details: updErr.message
    }, 500, origin);
  }
  const pj = existing.programme_json;
  const { ip, userAgent } = clientInfo(req);
  const audit_logged = await writeAudit({
    admin_email: admin.email,
    admin_role: admin.role,
    member_email: email,
    action: 'programme_pause',
    column_name: 'is_active',
    old_value: {
      is_active: true,
      programme_name: pj?.programme_name ?? null
    },
    new_value: {
      is_active: false,
      paused_at: pausedAt,
      programme_name: pj?.programme_name ?? null
    },
    reason,
    ip,
    userAgent
  });
  return json({
    success: true,
    paused_at: pausedAt,
    audit_logged
  }, 200, origin);
}
async function handleResumeProgramme(req, admin, body) {
  const origin = req.headers.get('origin');
  const gate = gateMutation(admin.role, origin);
  if (gate) return gate;
  const { member_email } = body;
  const reason = optionalReason(body.reason);
  if (!member_email || typeof member_email !== 'string') {
    return json({
      success: false,
      error: 'member_email is required'
    }, 400, origin);
  }
  const email = member_email.toLowerCase();
  const { data: existing } = await service.from('workout_plan_cache').select('id, is_active, paused_at, programme_json').eq('member_email', email).maybeSingle();
  if (!existing) return json({
    success: false,
    error: 'Programme not found'
  }, 404, origin);
  if (existing.is_active === true) {
    return json({
      success: true,
      no_op: true,
      message: 'Programme already active'
    }, 200, origin);
  }
  const { error: updErr } = await service.from('workout_plan_cache').update({
    is_active: true,
    paused_at: null
  }).eq('member_email', email);
  if (updErr) {
    console.error('resume update failed:', updErr);
    return json({
      success: false,
      error: 'Resume failed',
      details: updErr.message
    }, 500, origin);
  }
  const pj = existing.programme_json;
  const { ip, userAgent } = clientInfo(req);
  const audit_logged = await writeAudit({
    admin_email: admin.email,
    admin_role: admin.role,
    member_email: email,
    action: 'programme_resume',
    column_name: 'is_active',
    old_value: {
      is_active: false,
      paused_at: existing.paused_at,
      programme_name: pj?.programme_name ?? null
    },
    new_value: {
      is_active: true,
      paused_at: null,
      programme_name: pj?.programme_name ?? null
    },
    reason,
    ip,
    userAgent
  });
  return json({
    success: true,
    audit_logged
  }, 200, origin);
}
async function handleAdvanceWeek(req, admin, body) {
  const origin = req.headers.get('origin');
  const gate = gateMutation(admin.role, origin);
  if (gate) return gate;
  const { member_email, to_week } = body;
  const reason = optionalReason(body.reason);
  if (!member_email || typeof member_email !== 'string') {
    return json({
      success: false,
      error: 'member_email is required'
    }, 400, origin);
  }
  const toWeekNum = typeof to_week === 'number' ? to_week : parseInt(String(to_week), 10);
  if (!Number.isInteger(toWeekNum) || toWeekNum < 1) {
    return json({
      success: false,
      error: 'to_week must be a positive integer'
    }, 400, origin);
  }
  const email = member_email.toLowerCase();
  const { data: existing } = await service.from('workout_plan_cache').select('id, current_week, current_session, plan_duration_weeks, programme_json').eq('member_email', email).maybeSingle();
  if (!existing) return json({
    success: false,
    error: 'Programme not found'
  }, 404, origin);
  const maxWeek = existing.plan_duration_weeks;
  if (toWeekNum > maxWeek) {
    return json({
      success: false,
      error: `to_week exceeds plan duration (max ${maxWeek})`
    }, 400, origin);
  }
  if (existing.current_week === toWeekNum && existing.current_session === 1) {
    return json({
      success: true,
      no_op: true,
      message: 'Already at requested week, session 1'
    }, 200, origin);
  }
  const { error: updErr } = await service.from('workout_plan_cache').update({
    current_week: toWeekNum,
    current_session: 1
  }).eq('member_email', email);
  if (updErr) {
    console.error('advance_week update failed:', updErr);
    return json({
      success: false,
      error: 'Advance failed',
      details: updErr.message
    }, 500, origin);
  }
  const pj = existing.programme_json;
  const { ip, userAgent } = clientInfo(req);
  const audit_logged = await writeAudit({
    admin_email: admin.email,
    admin_role: admin.role,
    member_email: email,
    action: 'programme_advance_week',
    column_name: 'current_week',
    old_value: {
      current_week: existing.current_week,
      current_session: existing.current_session,
      programme_name: pj?.programme_name ?? null
    },
    new_value: {
      current_week: toWeekNum,
      current_session: 1,
      programme_name: pj?.programme_name ?? null
    },
    reason,
    ip,
    userAgent
  });
  return json({
    success: true,
    current_week: toWeekNum,
    current_session: 1,
    audit_logged
  }, 200, origin);
}
async function handleSwapPlan(req, admin, body) {
  const origin = req.headers.get('origin');
  const gate = gateMutation(admin.role, origin);
  if (gate) return gate;
  const { member_email, library_programme_id } = body;
  const reason = optionalReason(body.reason);
  if (!member_email || typeof member_email !== 'string') {
    return json({
      success: false,
      error: 'member_email is required'
    }, 400, origin);
  }
  if (!isValidUuid(library_programme_id)) {
    return json({
      success: false,
      error: 'library_programme_id must be a valid UUID'
    }, 400, origin);
  }
  const email = member_email.toLowerCase();
  const { data: memberRow, error: memberErr } = await service.from('members').select('email').eq('email', email).maybeSingle();
  if (memberErr) return json({
    success: false,
    error: 'Member lookup failed'
  }, 500, origin);
  if (!memberRow) return json({
    success: false,
    error: 'Member not found'
  }, 404, origin);
  const { data: libRow, error: libErr } = await service.from('programme_library').select('id, programme_name, category, duration_weeks, days_per_week, programme_json, is_active').eq('id', library_programme_id).maybeSingle();
  if (libErr) {
    console.error('library lookup failed:', libErr);
    return json({
      success: false,
      error: 'Library lookup failed'
    }, 500, origin);
  }
  if (!libRow) return json({
    success: false,
    error: 'Library programme not found'
  }, 404, origin);
  if (!libRow.is_active) {
    return json({
      success: false,
      error: 'Cannot swap to a deactivated library programme'
    }, 400, origin);
  }
  const shape = validateProgrammeJson(libRow.programme_json);
  if (!shape.valid) {
    return json({
      success: false,
      error: `Library programme_json malformed: ${shape.error}`
    }, 422, origin);
  }
  const { data: existing } = await service.from('workout_plan_cache').select('id, programme_json, current_week, current_session, source, source_id').eq('member_email', email).maybeSingle();
  const nowIso = new Date().toISOString();
  const { error: upErr } = await service.from('workout_plan_cache').upsert({
    member_email: email,
    programme_json: libRow.programme_json,
    plan_duration_weeks: libRow.duration_weeks ?? shape.weeks_count,
    current_week: 1,
    current_session: 1,
    is_active: true,
    paused_at: null,
    source: 'library',
    source_id: libRow.id,
    generated_at: nowIso
  }, {
    onConflict: 'member_email'
  });
  if (upErr) {
    console.error('swap upsert failed:', upErr);
    return json({
      success: false,
      error: 'Swap failed',
      details: upErr.message
    }, 500, origin);
  }
  const existingPj = existing?.programme_json;
  const { ip, userAgent } = clientInfo(req);
  const audit_logged = await writeAudit({
    admin_email: admin.email,
    admin_role: admin.role,
    member_email: email,
    action: 'programme_swap',
    column_name: '__row__',
    old_value: existing ? {
      programme_name: existingPj?.programme_name ?? null,
      source: existing.source,
      source_id: existing.source_id,
      current_week: existing.current_week,
      current_session: existing.current_session
    } : null,
    new_value: {
      programme_name: libRow.programme_name,
      source: 'library',
      source_id: libRow.id,
      current_week: 1,
      current_session: 1,
      weeks_count: shape.weeks_count
    },
    reason,
    ip,
    userAgent
  });
  return json({
    success: true,
    programme_name: libRow.programme_name,
    source: 'library',
    source_id: libRow.id,
    weeks_count: shape.weeks_count,
    audit_logged
  }, 200, origin);
}
Deno.serve(async (req)=>{
  const origin = req.headers.get('origin');
  if (req.method === 'OPTIONS') {
    return new Response('', {
      status: 200,
      headers: corsHeaders(origin)
    });
  }
  if (req.method !== 'POST') {
    return json({
      success: false,
      error: 'Method not allowed'
    }, 405, origin);
  }
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
      case 'pause_programme':
        return await handlePauseProgramme(req, authResult, body);
      case 'resume_programme':
        return await handleResumeProgramme(req, authResult, body);
      case 'advance_week':
        return await handleAdvanceWeek(req, authResult, body);
      case 'swap_plan':
        return await handleSwapPlan(req, authResult, body);
      case 'regenerate':
        return json({
          success: false,
          error: 'regenerate is not available in v1. Use swap_plan to replace from programme_library, or contact engineering for a bespoke regeneration.',
          deferred_to: 'admin-member-programme v1.1'
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
