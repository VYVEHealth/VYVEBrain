// admin-member-weekly-goals v3 — VYVE Admin Console Shell 3, Sub-scope A (23 April 2026)
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
const TARGET_FIELDS = [
  'habits_target',
  'workouts_target',
  'cardio_target',
  'sessions_target',
  'checkin_target'
];
const TARGET_MIN = 0;
const TARGET_MAX = 14;
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
function gateMutation(role, origin) {
  if (role === 'viewer') {
    return json({
      success: false,
      error: 'Viewer role cannot edit'
    }, 403, origin);
  }
  return null;
}
function ukTodayIsoDate() {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/London',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return fmt.format(new Date());
}
function isoMondayOf(dateStr) {
  const [y, m, d] = dateStr.split('-').map((s)=>parseInt(s, 10));
  const dt = new Date(Date.UTC(y, m - 1, d));
  const dow = dt.getUTCDay();
  const daysBack = dow === 0 ? 6 : dow - 1;
  dt.setUTCDate(dt.getUTCDate() - daysBack);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}
function isValidIsoDate(s) {
  return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
}
function isMonday(dateStr) {
  const [y, m, d] = dateStr.split('-').map((x)=>parseInt(x, 10));
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCDay() === 1;
}
function validateTargetValue(field, raw) {
  const n = typeof raw === 'string' ? parseInt(raw, 10) : Number(raw);
  if (!Number.isFinite(n) || !Number.isInteger(n)) {
    return {
      valid: false,
      error: `${field} must be a whole number`
    };
  }
  if (n < TARGET_MIN || n > TARGET_MAX) {
    return {
      valid: false,
      error: `${field} must be between ${TARGET_MIN} and ${TARGET_MAX}`
    };
  }
  return {
    valid: true,
    value: n
  };
}
async function writeAudit(params) {
  const { error } = await service.from('admin_audit_log').insert({
    admin_email: params.admin_email,
    admin_role: params.admin_role,
    member_email: params.member_email,
    action: params.action,
    table_name: 'weekly_goals',
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
async function handleGetWeeklyGoals(req, _admin, body) {
  const origin = req.headers.get('origin');
  const { member_email, week_start } = body;
  if (!member_email || typeof member_email !== 'string') {
    return json({
      success: false,
      error: 'member_email is required'
    }, 400, origin);
  }
  let ws;
  if (week_start === undefined || week_start === null || week_start === '') {
    ws = isoMondayOf(ukTodayIsoDate());
  } else {
    if (!isValidIsoDate(week_start)) {
      return json({
        success: false,
        error: 'week_start must be YYYY-MM-DD'
      }, 400, origin);
    }
    if (!isMonday(week_start)) {
      return json({
        success: false,
        error: 'week_start must be an ISO Monday'
      }, 400, origin);
    }
    ws = week_start;
  }
  const email = member_email.toLowerCase();
  const { data, error } = await service.from('weekly_goals').select('id, member_email, week_start, habits_target, workouts_target, cardio_target, sessions_target, checkin_target, created_at').eq('member_email', email).eq('week_start', ws).maybeSingle();
  if (error) {
    console.error('get_weekly_goals failed:', error);
    return json({
      success: false,
      error: 'Failed to load weekly goals',
      details: error.message
    }, 500, origin);
  }
  return json({
    success: true,
    week_start: ws,
    goals: data ?? null
  }, 200, origin);
}
async function handleUpsertWeeklyGoals(req, admin, body) {
  const origin = req.headers.get('origin');
  const gate = gateMutation(admin.role, origin);
  if (gate) return gate;
  const { member_email, week_start } = body;
  const reason = optionalReason(body.reason);
  if (!member_email || typeof member_email !== 'string') {
    return json({
      success: false,
      error: 'member_email is required'
    }, 400, origin);
  }
  if (!isValidIsoDate(week_start)) {
    return json({
      success: false,
      error: 'week_start must be YYYY-MM-DD'
    }, 400, origin);
  }
  if (!isMonday(week_start)) {
    return json({
      success: false,
      error: 'week_start must be an ISO Monday'
    }, 400, origin);
  }
  const currentUkMonday = isoMondayOf(ukTodayIsoDate());
  if (week_start < currentUkMonday) {
    return json({
      success: false,
      error: `Past weeks are immutable (current UK Monday is ${currentUkMonday})`,
      current_uk_monday: currentUkMonday
    }, 400, origin);
  }
  const parsedTargets = {};
  for (const field of TARGET_FIELDS){
    if (!(field in body)) {
      return json({
        success: false,
        error: `Missing required field: ${field}`
      }, 400, origin);
    }
    const v = validateTargetValue(field, body[field]);
    if (!v.valid) return json({
      success: false,
      error: v.error
    }, 400, origin);
    parsedTargets[field] = v.value;
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
  const { data: existing } = await service.from('weekly_goals').select('id, habits_target, workouts_target, cardio_target, sessions_target, checkin_target').eq('member_email', email).eq('week_start', week_start).maybeSingle();
  if (existing) {
    const allSame = TARGET_FIELDS.every((f)=>existing[f] === parsedTargets[f]);
    if (allSame) {
      return json({
        success: true,
        no_op: true,
        message: 'All targets match existing values — no change',
        week_start,
        goals: existing
      }, 200, origin);
    }
  }
  const { error: upErr, data: upData } = await service.from('weekly_goals').upsert({
    member_email: email,
    week_start,
    ...parsedTargets
  }, {
    onConflict: 'member_email,week_start'
  }).select('id, member_email, week_start, habits_target, workouts_target, cardio_target, sessions_target, checkin_target, created_at').maybeSingle();
  if (upErr) {
    console.error('weekly_goals upsert failed:', upErr);
    return json({
      success: false,
      error: 'Upsert failed',
      details: upErr.message
    }, 500, origin);
  }
  const { ip, userAgent } = clientInfo(req);
  const audit_logged = await writeAudit({
    admin_email: admin.email,
    admin_role: admin.role,
    member_email: email,
    action: 'weekly_goals_upsert',
    column_name: '__row__',
    old_value: existing ? {
      habits_target: existing.habits_target,
      workouts_target: existing.workouts_target,
      cardio_target: existing.cardio_target,
      sessions_target: existing.sessions_target,
      checkin_target: existing.checkin_target,
      week_start
    } : null,
    new_value: {
      ...parsedTargets,
      week_start
    },
    reason,
    ip,
    userAgent
  });
  return json({
    success: true,
    week_start,
    goals: upData,
    created_new: !existing,
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
      case 'get_weekly_goals':
        return await handleGetWeeklyGoals(req, authResult, body);
      case 'upsert_weekly_goals':
        return await handleUpsertWeeklyGoals(req, authResult, body);
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
