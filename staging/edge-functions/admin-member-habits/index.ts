// admin-member-habits v3 — VYVE Admin Console Shell 3, Sub-scope A (22 April 2026)
//   v3: reason field is now OPTIONAL on mutations (was: min 5 chars required).
//       Still captured in admin_audit_log when provided. Rationale: pre-enterprise
//       solo-admin phase; friction outweighs benefit. Reason can be made mandatory
//       for specific sensitive fields (persona, subscription_status, health_data_consent)
//       in a later revision if enterprise DPA requires it.
//   v2: verify_jwt set to false at gateway to avoid ES256 rejection.
//       In-code JWT verification via anon.auth.getUser() handles ES256 natively.
//       Security unchanged: every request still verifies token + admin_users allowlist.
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
const VALID_POTS = new Set([
  'sleep',
  'movement',
  'nutrition',
  'mindfulness',
  'social'
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
// optional reason: returns trimmed string if provided and non-empty, else null
function optionalReason(reason) {
  if (typeof reason !== 'string') return null;
  const t = reason.trim();
  return t.length > 0 ? t : null;
}
function isValidUuid(v) {
  return typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}
async function writeAudit(params) {
  const { error } = await service.from('admin_audit_log').insert({
    admin_email: params.admin_email,
    admin_role: params.admin_role,
    member_email: params.member_email,
    action: params.action,
    table_name: 'member_habits',
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
async function handleListHabits(req, _admin, body) {
  const origin = req.headers.get('origin');
  const { member_email, include_inactive } = body;
  if (!member_email || typeof member_email !== 'string') {
    return json({
      success: false,
      error: 'member_email is required'
    }, 400, origin);
  }
  let q = service.from('member_habits').select('id, habit_id, active, assigned_at, assigned_by, habit_library(id, habit_pot, habit_title, habit_description, difficulty, active)').eq('member_email', member_email.toLowerCase()).order('assigned_at', {
    ascending: false
  });
  if (!include_inactive) q = q.eq('active', true);
  const { data, error } = await q;
  if (error) {
    console.error('list_habits failed:', error);
    return json({
      success: false,
      error: 'Failed to load habits',
      details: error.message
    }, 500, origin);
  }
  return json({
    success: true,
    habits: data ?? []
  }, 200, origin);
}
async function handleListLibrary(req, _admin, body) {
  const origin = req.headers.get('origin');
  const { pot } = body ?? {};
  if (pot !== undefined && pot !== null && !VALID_POTS.has(pot)) {
    return json({
      success: false,
      error: `pot must be one of: ${Array.from(VALID_POTS).join(', ')}`
    }, 400, origin);
  }
  let q = service.from('habit_library').select('id, habit_pot, habit_title, habit_description, habit_prompt, difficulty, active, created_by').eq('active', true).order('habit_pot', {
    ascending: true
  }).order('difficulty', {
    ascending: true
  });
  if (pot) q = q.eq('habit_pot', pot);
  const { data, error } = await q;
  if (error) {
    console.error('list_library failed:', error);
    return json({
      success: false,
      error: 'Failed to load library',
      details: error.message
    }, 500, origin);
  }
  return json({
    success: true,
    library: data ?? []
  }, 200, origin);
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
async function handleAssignHabit(req, admin, body) {
  const origin = req.headers.get('origin');
  const gate = gateMutation(admin.role, origin);
  if (gate) return gate;
  const { member_email, habit_id } = body;
  const reason = optionalReason(body.reason);
  if (!member_email || typeof member_email !== 'string') {
    return json({
      success: false,
      error: 'member_email is required'
    }, 400, origin);
  }
  if (!isValidUuid(habit_id)) {
    return json({
      success: false,
      error: 'habit_id must be a valid UUID'
    }, 400, origin);
  }
  const email = member_email.toLowerCase();
  const { data: memberRow, error: memberErr } = await service.from('members').select('email').eq('email', email).maybeSingle();
  if (memberErr) {
    console.error('member lookup failed:', memberErr);
    return json({
      success: false,
      error: 'Member lookup failed'
    }, 500, origin);
  }
  if (!memberRow) return json({
    success: false,
    error: 'Member not found'
  }, 404, origin);
  const { data: libRow, error: libErr } = await service.from('habit_library').select('id, habit_title, habit_pot, active').eq('id', habit_id).maybeSingle();
  if (libErr) {
    console.error('habit_library lookup failed:', libErr);
    return json({
      success: false,
      error: 'Habit lookup failed'
    }, 500, origin);
  }
  if (!libRow) return json({
    success: false,
    error: 'Habit not found'
  }, 404, origin);
  if (!libRow.active) {
    return json({
      success: false,
      error: 'Cannot assign a deactivated library habit'
    }, 400, origin);
  }
  const { data: existing } = await service.from('member_habits').select('id, active, assigned_by').eq('member_email', email).eq('habit_id', habit_id).maybeSingle();
  if (existing && existing.active === true) {
    return json({
      success: true,
      no_op: true,
      message: 'Habit already assigned and active',
      habit: {
        id: habit_id,
        title: libRow.habit_title
      }
    }, 200, origin);
  }
  const { error: upErr } = await service.from('member_habits').upsert({
    member_email: email,
    habit_id,
    active: true,
    assigned_by: 'admin',
    assigned_at: new Date().toISOString()
  }, {
    onConflict: 'member_email,habit_id'
  });
  if (upErr) {
    console.error('assign_habit upsert failed:', upErr);
    return json({
      success: false,
      error: 'Assignment failed',
      details: upErr.message
    }, 500, origin);
  }
  const { ip, userAgent } = clientInfo(req);
  const audit_logged = await writeAudit({
    admin_email: admin.email,
    admin_role: admin.role,
    member_email: email,
    action: 'habit_assign',
    column_name: 'habit_id',
    old_value: existing ? {
      active: existing.active,
      habit_title: libRow.habit_title
    } : null,
    new_value: {
      active: true,
      habit_id,
      habit_title: libRow.habit_title,
      habit_pot: libRow.habit_pot
    },
    reason,
    ip,
    userAgent
  });
  return json({
    success: true,
    habit: {
      id: habit_id,
      title: libRow.habit_title,
      pot: libRow.habit_pot
    },
    reactivated: !!existing,
    audit_logged
  }, 200, origin);
}
async function handleDeactivateHabit(req, admin, body) {
  const origin = req.headers.get('origin');
  const gate = gateMutation(admin.role, origin);
  if (gate) return gate;
  const { member_email, habit_id } = body;
  const reason = optionalReason(body.reason);
  if (!member_email || typeof member_email !== 'string') {
    return json({
      success: false,
      error: 'member_email is required'
    }, 400, origin);
  }
  if (!isValidUuid(habit_id)) {
    return json({
      success: false,
      error: 'habit_id must be a valid UUID'
    }, 400, origin);
  }
  const email = member_email.toLowerCase();
  const { data: existing, error: fetchErr } = await service.from('member_habits').select('id, active, habit_id, habit_library(habit_title, habit_pot)').eq('member_email', email).eq('habit_id', habit_id).maybeSingle();
  if (fetchErr) {
    console.error('member_habits fetch failed:', fetchErr);
    return json({
      success: false,
      error: 'Fetch failed'
    }, 500, origin);
  }
  if (!existing) return json({
    success: false,
    error: 'Assignment not found'
  }, 404, origin);
  if (existing.active === false) {
    return json({
      success: true,
      no_op: true,
      message: 'Habit already inactive'
    }, 200, origin);
  }
  const { error: updErr } = await service.from('member_habits').update({
    active: false
  }).eq('member_email', email).eq('habit_id', habit_id);
  if (updErr) {
    console.error('deactivate update failed:', updErr);
    return json({
      success: false,
      error: 'Deactivate failed',
      details: updErr.message
    }, 500, origin);
  }
  const lib = existing.habit_library;
  const { ip, userAgent } = clientInfo(req);
  const audit_logged = await writeAudit({
    admin_email: admin.email,
    admin_role: admin.role,
    member_email: email,
    action: 'habit_deactivate',
    column_name: 'active',
    old_value: {
      active: true,
      habit_title: lib?.habit_title,
      habit_pot: lib?.habit_pot
    },
    new_value: {
      active: false,
      habit_title: lib?.habit_title,
      habit_pot: lib?.habit_pot
    },
    reason,
    ip,
    userAgent
  });
  return json({
    success: true,
    habit_id,
    audit_logged
  }, 200, origin);
}
async function handleReactivateHabit(req, admin, body) {
  const origin = req.headers.get('origin');
  const gate = gateMutation(admin.role, origin);
  if (gate) return gate;
  const { member_email, habit_id } = body;
  const reason = optionalReason(body.reason);
  if (!member_email || typeof member_email !== 'string') {
    return json({
      success: false,
      error: 'member_email is required'
    }, 400, origin);
  }
  if (!isValidUuid(habit_id)) {
    return json({
      success: false,
      error: 'habit_id must be a valid UUID'
    }, 400, origin);
  }
  const email = member_email.toLowerCase();
  const { data: existing } = await service.from('member_habits').select('id, active, habit_id, habit_library(habit_title, habit_pot, active)').eq('member_email', email).eq('habit_id', habit_id).maybeSingle();
  if (!existing) return json({
    success: false,
    error: 'Assignment not found'
  }, 404, origin);
  if (existing.active === true) {
    return json({
      success: true,
      no_op: true,
      message: 'Habit already active'
    }, 200, origin);
  }
  const lib = existing.habit_library;
  if (!lib?.active) {
    return json({
      success: false,
      error: 'Cannot reactivate — library habit is deactivated'
    }, 400, origin);
  }
  const { error: updErr } = await service.from('member_habits').update({
    active: true
  }).eq('member_email', email).eq('habit_id', habit_id);
  if (updErr) {
    console.error('reactivate update failed:', updErr);
    return json({
      success: false,
      error: 'Reactivate failed',
      details: updErr.message
    }, 500, origin);
  }
  const { ip, userAgent } = clientInfo(req);
  const audit_logged = await writeAudit({
    admin_email: admin.email,
    admin_role: admin.role,
    member_email: email,
    action: 'habit_reactivate',
    column_name: 'active',
    old_value: {
      active: false,
      habit_title: lib.habit_title,
      habit_pot: lib.habit_pot
    },
    new_value: {
      active: true,
      habit_title: lib.habit_title,
      habit_pot: lib.habit_pot
    },
    reason,
    ip,
    userAgent
  });
  return json({
    success: true,
    habit_id,
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
      case 'list_habits':
        return await handleListHabits(req, authResult, body);
      case 'list_library':
        return await handleListLibrary(req, authResult, body);
      case 'assign_habit':
        return await handleAssignHabit(req, authResult, body);
      case 'deactivate_habit':
        return await handleDeactivateHabit(req, authResult, body);
      case 'reactivate_habit':
        return await handleReactivateHabit(req, authResult, body);
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
