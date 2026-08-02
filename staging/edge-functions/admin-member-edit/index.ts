// admin-member-edit v6 — VYVE Admin Console Shell 2 (22 April 2026)
//   v6: reason field is now OPTIONAL even on SCARY fields (was: min 5 chars required).
//       Still captured in admin_audit_log when provided. Rationale: pre-enterprise
//       solo-admin phase; friction outweighs benefit. Mandatory reason can be
//       re-added for specific sensitive fields (persona, subscription_status,
//       health_data_consent) in a later revision if enterprise DPA requires it.
//   v5: verify_jwt=false at gateway (ES256 fix). In-code JWT verification retained.
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
const SAFE_FIELDS = new Set([
  'first_name',
  'last_name',
  'company',
  'goal_focus',
  'tone_preference',
  'reminder_frequency',
  'contact_preference',
  'theme_preference',
  'exercise_stream',
  'display_name_preference',
  'notifications_milestones',
  'notifications_weekly_summary',
  'privacy_employer_reporting',
  're_engagement_stream'
]);
const SCARY_FIELDS = new Set([
  'persona',
  'sensitive_context',
  'health_data_consent',
  'subscription_status',
  'training_days_per_week',
  'tdee_target',
  'deficit_percentage'
]);
const VALID_PERSONAS = new Set([
  'NOVA',
  'RIVER',
  'SPARK',
  'SAGE',
  'HAVEN'
]);
const VALID_STREAMS = new Set([
  'A',
  'B',
  'C1',
  'C2',
  'C3',
  'paused',
  'none'
]);
const VALID_EXERCISE = new Set([
  'movement',
  'workouts',
  'cardio',
  'classes',
  'mixed'
]);
const VALID_THEMES = new Set([
  'light',
  'dark',
  'system'
]);
const VALID_DISPLAY = new Set([
  'first_name',
  'full_name',
  'initials',
  'anonymous'
]);
const VALID_TONE = new Set([
  'gentle',
  'direct',
  'motivational',
  'analytical'
]);
const VALID_REMINDER = new Set([
  'daily',
  'weekly',
  'off'
]);
const VALID_CONTACT = new Set([
  'email',
  'push',
  'both',
  'none'
]);
const VALID_GOAL_FOCUS = new Set([
  'habits',
  'workouts',
  'cardio',
  'wellbeing',
  'nutrition',
  'balanced'
]);
const VALID_SUB_STATUS = new Set([
  'active',
  'trialing',
  'past_due',
  'canceled',
  'paused',
  'none'
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
function optionalReason(reason) {
  if (typeof reason !== 'string') return null;
  const t = reason.trim();
  return t.length > 0 ? t : null;
}
function vStr(v, max) {
  if (v === null || v === '') return {
    valid: true,
    value: null
  };
  if (typeof v !== 'string') return {
    valid: false,
    error: 'Must be a string'
  };
  const t = v.trim();
  if (t.length === 0) return {
    valid: true,
    value: null
  };
  if (t.length > max) return {
    valid: false,
    error: `Too long (max ${max})`
  };
  return {
    valid: true,
    value: t
  };
}
function vEnum(v, allowed) {
  if (v === null || v === '') return {
    valid: true,
    value: null
  };
  if (typeof v !== 'string' || !allowed.has(v)) {
    return {
      valid: false,
      error: `Must be one of: ${Array.from(allowed).join(', ')}`
    };
  }
  return {
    valid: true,
    value: v
  };
}
function vBool(v) {
  if (v === null) return {
    valid: true,
    value: null
  };
  if (typeof v === 'boolean') return {
    valid: true,
    value: v
  };
  if (typeof v === 'string') {
    const l = v.toLowerCase();
    if ([
      'true',
      '1',
      'yes'
    ].includes(l)) return {
      valid: true,
      value: true
    };
    if ([
      'false',
      '0',
      'no'
    ].includes(l)) return {
      valid: true,
      value: false
    };
  }
  return {
    valid: false,
    error: 'Must be true or false'
  };
}
function vInt(v, min, max) {
  if (v === null || v === '') return {
    valid: true,
    value: null
  };
  const n = typeof v === 'string' ? parseInt(v, 10) : Number(v);
  if (!Number.isFinite(n) || !Number.isInteger(n)) return {
    valid: false,
    error: 'Must be a whole number'
  };
  if (n < min || n > max) return {
    valid: false,
    error: `Must be between ${min} and ${max}`
  };
  return {
    valid: true,
    value: n
  };
}
function validateField(field, raw) {
  switch(field){
    case 'first_name':
    case 'last_name':
      return vStr(raw, 80);
    case 'company':
      return vStr(raw, 200);
    case 'goal_focus':
      return vEnum(raw, VALID_GOAL_FOCUS);
    case 'tone_preference':
      return vEnum(raw, VALID_TONE);
    case 'reminder_frequency':
      return vEnum(raw, VALID_REMINDER);
    case 'contact_preference':
      return vEnum(raw, VALID_CONTACT);
    case 'theme_preference':
      return vEnum(raw, VALID_THEMES);
    case 'exercise_stream':
      return vEnum(raw, VALID_EXERCISE);
    case 'display_name_preference':
      return vEnum(raw, VALID_DISPLAY);
    case 'notifications_milestones':
    case 'notifications_weekly_summary':
    case 'privacy_employer_reporting':
    case 'sensitive_context':
    case 'health_data_consent':
      return vBool(raw);
    case 're_engagement_stream':
      return vEnum(raw, VALID_STREAMS);
    case 'persona':
      return vEnum(raw, VALID_PERSONAS);
    case 'subscription_status':
      return vEnum(raw, VALID_SUB_STATUS);
    case 'training_days_per_week':
      return vInt(raw, 0, 7);
    case 'tdee_target':
      return vInt(raw, 1000, 6000);
    case 'deficit_percentage':
      return vInt(raw, 0, 30);
    default:
      return {
        valid: false,
        error: `Unknown field: ${field}`
      };
  }
}
function clientInfo(req) {
  const ip = req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';
  return {
    ip,
    userAgent: req.headers.get('user-agent') || 'unknown'
  };
}
async function handleMemberEdit(req, admin, body) {
  const origin = req.headers.get('origin');
  const { member_email, field_name, new_value } = body;
  const reason = optionalReason(body.reason);
  if (!member_email || typeof member_email !== 'string') {
    return json({
      success: false,
      error: 'member_email is required'
    }, 400, origin);
  }
  if (!field_name || typeof field_name !== 'string') {
    return json({
      success: false,
      error: 'field_name is required'
    }, 400, origin);
  }
  const isSafe = SAFE_FIELDS.has(field_name);
  const isScary = SCARY_FIELDS.has(field_name);
  if (!isSafe && !isScary) {
    return json({
      success: false,
      error: `Field not editable: ${field_name}`
    }, 400, origin);
  }
  if (admin.role === 'coach_exercise' && (field_name === 'persona' || field_name === 'sensitive_context' || field_name === 'health_data_consent')) {
    return json({
      success: false,
      error: 'Your role cannot edit this field'
    }, 403, origin);
  }
  if (admin.role === 'viewer') {
    return json({
      success: false,
      error: 'Viewer role cannot edit'
    }, 403, origin);
  }
  const v = validateField(field_name, new_value);
  if (!v.valid) return json({
    success: false,
    error: v.error
  }, 400, origin);
  const processed = v.value;
  const { data: currentRow, error: fetchErr } = await service.from('members').select(`email, ${field_name}`).eq('email', member_email).maybeSingle();
  if (fetchErr) {
    console.error('Fetch member failed:', fetchErr);
    return json({
      success: false,
      error: 'Fetch failed',
      details: fetchErr.message
    }, 500, origin);
  }
  if (!currentRow) {
    return json({
      success: false,
      error: 'Member not found'
    }, 404, origin);
  }
  const oldValue = currentRow[field_name];
  if (JSON.stringify(oldValue ?? null) === JSON.stringify(processed ?? null)) {
    return json({
      success: true,
      no_op: true,
      message: 'No change (value matches current)',
      value: processed
    }, 200, origin);
  }
  const { error: updErr } = await service.from('members').update({
    [field_name]: processed
  }).eq('email', member_email);
  if (updErr) {
    console.error('Update failed:', updErr);
    return json({
      success: false,
      error: 'Update failed',
      details: updErr.message
    }, 500, origin);
  }
  const { ip, userAgent } = clientInfo(req);
  const { error: auditErr } = await service.from('admin_audit_log').insert({
    admin_email: admin.email,
    admin_role: admin.role,
    member_email,
    action: 'member_edit',
    table_name: 'members',
    column_name: field_name,
    old_value: oldValue ?? null,
    new_value: processed ?? null,
    reason,
    ip_address: ip,
    user_agent: userAgent,
    created_at: new Date().toISOString()
  });
  if (auditErr) console.error('Audit log insert failed:', auditErr);
  return json({
    success: true,
    field: field_name,
    old_value: oldValue ?? null,
    new_value: processed ?? null,
    audit_logged: !auditErr
  }, 200, origin);
}
async function handleMemberAuditLog(req, _admin, body) {
  const origin = req.headers.get('origin');
  const { member_email, limit } = body;
  if (!member_email) return json({
    success: false,
    error: 'member_email required'
  }, 400, origin);
  const lim = Math.min(Math.max(parseInt(String(limit ?? 20), 10) || 20, 1), 100);
  const { data, error } = await service.from('admin_audit_log').select('id, admin_email, admin_role, action, table_name, column_name, old_value, new_value, reason, ip_address, created_at').eq('member_email', member_email).order('created_at', {
    ascending: false
  }).limit(lim);
  if (error) {
    console.error('Audit log fetch failed:', error);
    return json({
      success: false,
      error: 'Failed to load audit log'
    }, 500, origin);
  }
  return json({
    success: true,
    audit_log: data ?? []
  }, 200, origin);
}
async function handleGetFieldSchema(req) {
  const origin = req.headers.get('origin');
  return json({
    success: true,
    safe_fields: Array.from(SAFE_FIELDS),
    scary_fields: Array.from(SCARY_FIELDS),
    enums: {
      persona: Array.from(VALID_PERSONAS),
      re_engagement_stream: Array.from(VALID_STREAMS),
      exercise_stream: Array.from(VALID_EXERCISE),
      theme_preference: Array.from(VALID_THEMES),
      display_name_preference: Array.from(VALID_DISPLAY),
      tone_preference: Array.from(VALID_TONE),
      reminder_frequency: Array.from(VALID_REMINDER),
      contact_preference: Array.from(VALID_CONTACT),
      goal_focus: Array.from(VALID_GOAL_FOCUS),
      subscription_status: Array.from(VALID_SUB_STATUS)
    }
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
      case 'member_edit':
        return await handleMemberEdit(req, authResult, body);
      case 'member_audit_log':
        return await handleMemberAuditLog(req, authResult, body);
      case 'field_schema':
        return await handleGetFieldSchema(req);
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
