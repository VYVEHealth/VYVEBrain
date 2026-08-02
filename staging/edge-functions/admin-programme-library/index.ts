// admin-programme-library v1 — VYVE Admin Console Content Mgmt, Phase 1 (23 April 2026)
//   Read-side admin endpoint for the programme_library.
//   Actions:
//     - list_programmes    — list all rows (summary only, no programme_json) for dropdowns & content view
//     - get_programme      — fetch one row with full programme_json for preview modal
//     - duplicate_programme— clone an existing row with " (copy)" suffix, is_active=false
//   Security pattern (matches admin-member-edit v6, admin-member-habits v3, etc):
//     - verify_jwt=false at gateway (avoids ES256 rejection)
//     - JWT verified in-code via anon.auth.getUser(token)
//     - admin_users allowlist with active=true required
//     - Role gating: only 'viewer' is blocked from duplicate (all other roles allowed for Phase 1)
//     - Every duplicate writes an admin_audit_log row (service role; reason optional)
//   Not in Phase 1 scope: create/edit/delete/toggle_active — those land with the visual
//   builder in Phase 4. Any missing action returns a clear 400.
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
      error: 'Viewer role cannot duplicate programmes'
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
    table_name: 'programme_library',
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
// ----- Handlers -----
// list_programmes: returns summary rows (no heavy programme_json)
// body: { include_inactive?: boolean }  — defaults to true (Dean wants to see all)
async function handleListProgrammes(req, _admin, body) {
  const origin = req.headers.get('origin');
  const includeInactive = body?.include_inactive !== false; // default true
  let q = service.from('programme_library').select('id, programme_name, description, category, difficulty, equipment, days_per_week, duration_weeks, sessions_per_week, tags, is_active, sort_order, created_at').order('sort_order', {
    ascending: true,
    nullsFirst: false
  }).order('programme_name', {
    ascending: true
  });
  if (!includeInactive) q = q.eq('is_active', true);
  const { data, error } = await q;
  if (error) {
    console.error('list_programmes failed:', error);
    return json({
      success: false,
      error: 'Failed to load programmes',
      details: error.message
    }, 500, origin);
  }
  return json({
    success: true,
    programmes: data ?? []
  }, 200, origin);
}
// get_programme: returns one row with full programme_json for preview
// body: { programme_id }
async function handleGetProgramme(req, _admin, body) {
  const origin = req.headers.get('origin');
  const { programme_id } = body;
  if (!isValidUuid(programme_id)) {
    return json({
      success: false,
      error: 'programme_id must be a valid UUID'
    }, 400, origin);
  }
  const { data, error } = await service.from('programme_library').select('id, programme_name, description, category, difficulty, equipment, days_per_week, duration_weeks, sessions_per_week, programme_json, tags, preview_sessions, is_active, sort_order, created_at').eq('id', programme_id).maybeSingle();
  if (error) {
    console.error('get_programme failed:', error);
    return json({
      success: false,
      error: 'Failed to load programme',
      details: error.message
    }, 500, origin);
  }
  if (!data) return json({
    success: false,
    error: 'Programme not found'
  }, 404, origin);
  // Lightweight shape summary for the UI (computed so preview renders without
  // trusting client-side assumptions about the JSON structure).
  const pj = data.programme_json;
  const weeksArr = Array.isArray(pj?.weeks) ? pj.weeks : [];
  const firstWeek = weeksArr[0];
  const firstWeekSessions = Array.isArray(firstWeek?.sessions) ? firstWeek.sessions : [];
  const shape = {
    weeks_count: weeksArr.length,
    sessions_in_week_1: firstWeekSessions.length,
    has_warmup_cooldown: firstWeekSessions.some((s)=>s?.warm_up || s?.cool_down),
    total_exercise_slots: weeksArr.reduce((total, wk)=>{
      if (!Array.isArray(wk?.sessions)) return total;
      return total + wk.sessions.reduce((t, s)=>t + (Array.isArray(s?.exercises) ? s.exercises.length : 0), 0);
    }, 0)
  };
  return json({
    success: true,
    programme: data,
    shape
  }, 200, origin);
}
// duplicate_programme: clone an existing row as a new UUID; is_active=false, name suffixed " (copy)".
// body: { programme_id, reason? }
async function handleDuplicateProgramme(req, admin, body) {
  const origin = req.headers.get('origin');
  const gate = gateMutation(admin.role, origin);
  if (gate) return gate;
  const { programme_id } = body;
  const reason = optionalReason(body.reason);
  if (!isValidUuid(programme_id)) {
    return json({
      success: false,
      error: 'programme_id must be a valid UUID'
    }, 400, origin);
  }
  const { data: source, error: srcErr } = await service.from('programme_library').select('programme_name, description, category, difficulty, equipment, days_per_week, duration_weeks, sessions_per_week, programme_json, tags, preview_sessions, sort_order').eq('id', programme_id).maybeSingle();
  if (srcErr) {
    console.error('duplicate source lookup failed:', srcErr);
    return json({
      success: false,
      error: 'Source lookup failed',
      details: srcErr.message
    }, 500, origin);
  }
  if (!source) return json({
    success: false,
    error: 'Source programme not found'
  }, 404, origin);
  // Build a fresh copy. Let the DB generate a new UUID via the column default (gen_random_uuid()).
  // Append " (copy)" — and if that name already exists, append " 2", " 3" etc. up to 20 tries.
  // This keeps the UI predictable when you duplicate the same thing twice.
  const baseName = `${source.programme_name} (copy)`;
  let newName = baseName;
  for(let i = 2; i <= 20; i++){
    const { data: clash } = await service.from('programme_library').select('id').eq('programme_name', newName).maybeSingle();
    if (!clash) break;
    newName = `${baseName} ${i}`;
  }
  const insertRow = {
    programme_name: newName,
    description: source.description,
    category: source.category,
    difficulty: source.difficulty,
    equipment: source.equipment,
    days_per_week: source.days_per_week,
    duration_weeks: source.duration_weeks,
    sessions_per_week: source.sessions_per_week,
    programme_json: source.programme_json,
    tags: source.tags,
    preview_sessions: source.preview_sessions,
    is_active: false,
    sort_order: null // don't inherit sort position
  };
  const { data: inserted, error: insErr } = await service.from('programme_library').insert(insertRow).select('id, programme_name, is_active, created_at').maybeSingle();
  if (insErr) {
    console.error('duplicate insert failed:', insErr);
    return json({
      success: false,
      error: 'Duplicate failed',
      details: insErr.message
    }, 500, origin);
  }
  const { ip, userAgent } = clientInfo(req);
  const audit_logged = await writeAudit({
    admin_email: admin.email,
    admin_role: admin.role,
    member_email: null,
    action: 'programme_duplicate',
    column_name: '__row__',
    old_value: {
      source_id: programme_id,
      source_name: source.programme_name
    },
    new_value: {
      new_id: inserted?.id,
      new_name: newName,
      is_active: false
    },
    reason,
    ip,
    userAgent
  });
  return json({
    success: true,
    programme: inserted,
    source_id: programme_id,
    audit_logged
  }, 200, origin);
}
// ----- Main -----
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
    body = {};
  } // list_programmes works with no body
  const action = body?.action;
  if (!action) return json({
    success: false,
    error: 'action required'
  }, 400, origin);
  try {
    switch(action){
      case 'list_programmes':
        return await handleListProgrammes(req, authResult, body);
      case 'get_programme':
        return await handleGetProgramme(req, authResult, body);
      case 'duplicate_programme':
        return await handleDuplicateProgramme(req, authResult, body);
      default:
        return json({
          success: false,
          error: `Unknown action: ${action}`,
          available_actions: [
            'list_programmes',
            'get_programme',
            'duplicate_programme'
          ]
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
