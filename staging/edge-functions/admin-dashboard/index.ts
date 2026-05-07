// admin-dashboard v7 — JWT verify fallback (18 April 2026)
//   v5/v6 local-verify failed silently when SUPABASE_JWT_SECRET wasn't set in EF
//   runtime. v7 tries local verify first (fast path) and falls back to
//   supabase.auth.getUser(token) if local verify can't be done or fails.
//   Restores admin login immediately; local verify kicks in once Dean sets
//   `supabase secrets set SUPABASE_JWT_SECRET=...`.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
const JWT_SECRET = Deno.env.get('SUPABASE_JWT_SECRET') || '';
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
const MEMBER_FIELDS = 'email, first_name, last_name, phone, persona, company, company_slug, ' + 'subscription_status, onboarding_complete, onboarding_completed_at, ' + 'created_at, life_context, sensitive_context';
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
// ----- JWT verify (local fast path + Supabase Auth fallback) -----
let signingKeyPromise = null;
function getSigningKey() {
  if (!signingKeyPromise) {
    signingKeyPromise = crypto.subtle.importKey('raw', new TextEncoder().encode(JWT_SECRET), {
      name: 'HMAC',
      hash: 'SHA-256'
    }, false, [
      'verify'
    ]);
  }
  return signingKeyPromise;
}
function b64urlToBytes(s) {
  const padded = s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - s.length % 4) % 4);
  const bin = atob(padded);
  const out = new Uint8Array(bin.length);
  for(let i = 0; i < bin.length; i++)out[i] = bin.charCodeAt(i);
  return out;
}
async function verifyJwtLocal(token) {
  if (!JWT_SECRET) return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [h, p, s] = parts;
    const key = await getSigningKey();
    const ok = await crypto.subtle.verify('HMAC', key, b64urlToBytes(s), new TextEncoder().encode(h + '.' + p));
    if (!ok) return null;
    const payload = JSON.parse(new TextDecoder().decode(b64urlToBytes(p)));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch  {
    return null;
  }
}
async function verifyJwtViaSupabase(token) {
  const { data, error } = await anon.auth.getUser(token);
  if (error || !data?.user?.email) return null;
  return {
    email: data.user.email
  };
}
const allowlistCache = new Map();
const ALLOWLIST_TTL_MS = 60_000;
async function checkAdmin(email) {
  const cached = allowlistCache.get(email);
  if (cached && cached.expires > Date.now()) {
    return cached.role ? {
      email,
      role: cached.role
    } : null;
  }
  const { data: row, error } = await service.from('admin_users').select('role, active').eq('email', email).eq('active', true).maybeSingle();
  if (error) {
    // Transient DB / schema issue — don't cache the miss
    return null;
  }
  const role = row ? row.role || 'admin' : null;
  allowlistCache.set(email, {
    role,
    expires: Date.now() + ALLOWLIST_TTL_MS
  });
  return role ? {
    email,
    role
  } : null;
}
async function authorise(req) {
  const auth = req.headers.get('Authorization') || '';
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (!m) return null;
  const token = m[1];
  // Try local verify first (requires SUPABASE_JWT_SECRET to be set in secrets).
  let payload = await verifyJwtLocal(token);
  // Fallback to Supabase Auth if local verify is unavailable or failed.
  if (!payload) payload = await verifyJwtViaSupabase(token);
  if (!payload?.email) return null;
  return await checkAdmin(String(payload.email).toLowerCase());
}
// ----- handlers (unchanged from v6) -----
async function handleOverview() {
  const today = new Date().toISOString().slice(0, 10);
  const [latestMetric, memberCount, atRisk, needsSupport, alerts7d] = await Promise.all([
    service.from('platform_metrics_daily').select('*').order('metric_date', {
      ascending: false
    }).limit(1).maybeSingle(),
    service.from('members').select('*', {
      count: 'exact',
      head: true
    }),
    service.from('member_stats').select('*', {
      count: 'exact',
      head: true
    }).eq('at_risk', true),
    service.from('member_stats').select('*', {
      count: 'exact',
      head: true
    }).eq('needs_support', true),
    service.from('platform_alerts').select('*', {
      count: 'exact',
      head: true
    }).eq('resolved', false)
  ]);
  const last30 = await service.from('platform_metrics_daily').select('metric_date, active_users, new_members, total_activities, certificates_earned').gte('metric_date', new Date(Date.now() - 30 * 86400_000).toISOString().slice(0, 10)).order('metric_date', {
    ascending: true
  });
  return {
    today,
    latest_metrics: latestMetric.data || null,
    total_members: memberCount.count || 0,
    at_risk_count: atRisk.count || 0,
    needs_support_count: needsSupport.count || 0,
    unresolved_alerts: alerts7d.count || 0,
    last_30_days: last30.data || []
  };
}
async function handleMembers(params) {
  const page = Math.max(1, Number(params.page) || 1);
  const pageSize = Math.min(200, Math.max(1, Number(params.pageSize) || 50));
  const search = String(params.search || '').trim().toLowerCase();
  const sortBy = String(params.sortBy || 'last_activity_at');
  const sortDir = String(params.sortDir || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';
  const filter = String(params.filter || 'all');
  const allowedSort = new Set([
    'last_activity_at',
    'joined_at',
    'engagement_score',
    'total_activities',
    'activities_30d',
    'activities_7d',
    'cert_count'
  ]);
  const sortCol = allowedSort.has(sortBy) ? sortBy : 'last_activity_at';
  let q = service.from('member_stats').select(`
    member_email, last_activity_at, last_activity_type,
    total_activities, activities_7d, activities_30d, activities_90d,
    active_days_30d, engagement_score, at_risk, needs_support, cert_count,
    current_programme, programme_week, programme_active,
    latest_wellbeing_score, latest_weight_kg, joined_at, updated_at,
    members!inner(${MEMBER_FIELDS})
  `, {
    count: 'exact'
  });
  if (filter === 'at_risk') q = q.eq('at_risk', true);
  if (filter === 'needs_support') q = q.eq('needs_support', true);
  if (filter === 'active_7d') q = q.gt('activities_7d', 0);
  if (filter === 'inactive_30d') q = q.or('last_activity_at.is.null,last_activity_at.lt.' + new Date(Date.now() - 30 * 86400_000).toISOString());
  if (search) q = q.ilike('member_email', `%${search}%`);
  q = q.order(sortCol, {
    ascending: sortDir === 'asc',
    nullsFirst: false
  });
  q = q.range((page - 1) * pageSize, page * pageSize - 1);
  const { data, error, count } = await q;
  if (error) return {
    error: error.message
  };
  let extraResults = [];
  if (search && !search.includes('@')) {
    const { data: nameHits } = await service.from('members').select('email, first_name, last_name, company, persona, subscription_status, created_at').or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,company.ilike.%${search}%`).limit(50);
    const have = new Set((data || []).map((r)=>(r.member_email || '').toLowerCase()));
    const hits = (nameHits || []).filter((m)=>!have.has((m.email || '').toLowerCase()));
    if (hits.length) {
      const emails = hits.map((m)=>m.email.toLowerCase());
      const { data: matchingStats } = await service.from('member_stats').select(`*, members!inner(${MEMBER_FIELDS})`).in('member_email', emails);
      extraResults = matchingStats || [];
    }
  }
  return {
    page,
    pageSize,
    total: (count || 0) + extraResults.length,
    rows: [
      ...data || [],
      ...extraResults
    ]
  };
}
async function handleMemberDetail(params) {
  const email = String(params.email || '').toLowerCase();
  if (!email) return {
    error: 'email required'
  };
  const [member, stats, cert, push, eng, plan, notes] = await Promise.all([
    service.from('members').select('*').eq('email', email).maybeSingle(),
    service.from('member_stats').select('*').eq('member_email', email).maybeSingle(),
    service.from('certificates').select('*').eq('member_email', email).order('earned_at', {
      ascending: false
    }),
    service.from('push_subscriptions').select('endpoint, created_at').eq('member_email', email),
    service.from('engagement_emails').select('stream, email_key, sent_at, open_count, click_count').eq('member_email', email).order('sent_at', {
      ascending: false
    }).limit(30),
    service.from('workout_plan_cache').select('id, current_week, is_active, paused_at, generated_at, source, plan_duration_weeks, programme_name:programme_json->>programme_name').eq('member_email', email).order('generated_at', {
      ascending: false
    }).limit(1),
    service.from('member_notifications').select('type, title, body, created_at, read').eq('member_email', email).order('created_at', {
      ascending: false
    }).limit(20)
  ]);
  const programmes = (plan.data || []).map((p)=>({
      ...p,
      programme_name: p.programme_name || 'Custom programme'
    }));
  return {
    member: member.data,
    stats: stats.data,
    certificates: cert.data || [],
    push_subs: push.data || [],
    emails: eng.data || [],
    programmes,
    notifications: notes.data || []
  };
}
async function handleMemberProgramme(params) {
  const id = String(params.id || '');
  if (!id) return {
    error: 'id required'
  };
  const { data, error } = await service.from('workout_plan_cache').select('*').eq('id', id).maybeSingle();
  if (error) return {
    error: error.message
  };
  return {
    programme: data
  };
}
async function handleMemberTimeline(params) {
  const email = String(params.email || '').toLowerCase();
  const days = Math.min(365, Math.max(1, Number(params.days) || 30));
  const cutoffIso = new Date(Date.now() - days * 86400_000).toISOString();
  if (!email) return {
    error: 'email required'
  };
  if (days <= 30) {
    const { data } = await service.from('member_activity_log').select('*').eq('member_email', email).gte('logged_at', cutoffIso).order('logged_at', {
      ascending: false
    }).limit(500);
    return {
      mode: 'raw',
      rows: data || []
    };
  } else {
    const cutoffDate = new Date(Date.now() - days * 86400_000).toISOString().slice(0, 10);
    const { data } = await service.from('member_activity_daily').select('*').eq('member_email', email).gte('activity_date', cutoffDate).order('activity_date', {
      ascending: false
    });
    return {
      mode: 'daily',
      rows: data || []
    };
  }
}
async function handleMemberRaw(params) {
  const email = String(params.email || '').toLowerCase();
  const limit = Math.min(500, Math.max(1, Number(params.limit) || 200));
  if (!email) return {
    error: 'email required'
  };
  const [habits, workouts, cardio, sessions, replays, checkins, weight, monthly, ai] = await Promise.all([
    service.from('daily_habits').select('*').eq('member_email', email).order('logged_at', {
      ascending: false
    }).limit(limit),
    service.from('workouts').select('*').eq('member_email', email).order('logged_at', {
      ascending: false
    }).limit(limit),
    service.from('cardio').select('*').eq('member_email', email).order('logged_at', {
      ascending: false
    }).limit(limit),
    service.from('session_views').select('*').eq('member_email', email).order('logged_at', {
      ascending: false
    }).limit(limit),
    service.from('replay_views').select('*').eq('member_email', email).order('logged_at', {
      ascending: false
    }).limit(limit),
    service.from('wellbeing_checkins').select('*').eq('member_email', email).order('logged_at', {
      ascending: false
    }).limit(limit),
    service.from('weight_logs').select('*').eq('member_email', email).order('logged_at', {
      ascending: false
    }).limit(limit),
    service.from('monthly_checkins').select('*').eq('member_email', email).order('created_at', {
      ascending: false
    }).limit(limit),
    service.from('ai_interactions').select('id, triggered_by, persona, prompt_summary, recommendation, created_at').eq('member_email', email).order('created_at', {
      ascending: false
    }).limit(limit)
  ]);
  return {
    daily_habits: habits.data || [],
    workouts: workouts.data || [],
    cardio: cardio.data || [],
    session_views: sessions.data || [],
    replay_views: replays.data || [],
    wellbeing_checkins: checkins.data || [],
    weight_logs: weight.data || [],
    monthly_checkins: monthly.data || [],
    ai_interactions: ai.data || []
  };
}
async function handleCompanies() {
  const { data, error } = await service.from('company_summary').select('*').order('member_count', {
    ascending: false
  });
  if (error) return {
    error: error.message
  };
  return {
    rows: data || []
  };
}
async function handlePlatform(params) {
  const days = Math.min(365, Math.max(1, Number(params.days) || 60));
  const cutoff = new Date(Date.now() - days * 86400_000).toISOString().slice(0, 10);
  const { data, error } = await service.from('platform_metrics_daily').select('*').gte('metric_date', cutoff).order('metric_date', {
    ascending: true
  });
  if (error) return {
    error: error.message
  };
  return {
    rows: data || []
  };
}
async function handleActivityFeed(params) {
  const limit = Math.min(500, Math.max(1, Number(params.limit) || 100));
  const { data, error } = await service.from('member_activity_log').select('member_email, activity_type, activity_label, activity_date, logged_at, metadata').order('logged_at', {
    ascending: false
  }).limit(limit);
  if (error) return {
    error: error.message
  };
  return {
    rows: data || []
  };
}
async function handleAlerts(params) {
  const limit = Math.min(500, Math.max(1, Number(params.limit) || 100));
  const onlyUnresolved = params.unresolved !== false;
  let q = service.from('platform_alerts').select('*').order('created_at', {
    ascending: false
  }).limit(limit);
  if (onlyUnresolved) q = q.eq('resolved', false);
  const { data, error } = await q;
  if (error) return {
    error: error.message
  };
  return {
    rows: data || []
  };
}
async function handleHealth() {
  const [mStats, mDaily, cSum, pMet, mLog, mems, jobs] = await Promise.all([
    service.from('member_stats').select('updated_at', {
      count: 'exact'
    }).order('updated_at', {
      ascending: false
    }).limit(1),
    service.from('member_activity_daily').select('updated_at', {
      count: 'exact'
    }).order('updated_at', {
      ascending: false
    }).limit(1),
    service.from('company_summary').select('updated_at', {
      count: 'exact'
    }).order('updated_at', {
      ascending: false
    }).limit(1),
    service.from('platform_metrics_daily').select('updated_at, metric_date', {
      count: 'exact'
    }).order('updated_at', {
      ascending: false
    }).limit(1),
    service.from('member_activity_log').select('logged_at', {
      count: 'exact',
      head: true
    }),
    service.from('members').select('*', {
      count: 'exact',
      head: true
    }),
    service.from('vyve_job_runs').select('job_name, last_run_at, rows_processed')
  ]);
  return {
    member_stats: {
      rows: mStats.count,
      latest_update: (mStats.data || [])[0]?.updated_at
    },
    member_activity_daily: {
      rows: mDaily.count,
      latest_update: (mDaily.data || [])[0]?.updated_at
    },
    company_summary: {
      rows: cSum.count,
      latest_update: (cSum.data || [])[0]?.updated_at
    },
    platform_metrics_daily: {
      rows: pMet.count,
      latest_metric: (pMet.data || [])[0]?.metric_date
    },
    member_activity_log: {
      rows: mLog.count
    },
    members: {
      rows: mems.count
    },
    jobs: jobs.data || [],
    auth_mode: JWT_SECRET ? 'local_verify+fallback' : 'supabase_auth_only'
  };
}
Deno.serve(async (req)=>{
  const origin = req.headers.get('Origin');
  if (req.method === 'OPTIONS') return new Response(null, {
    status: 204,
    headers: corsHeaders(origin)
  });
  if (req.method !== 'POST') return json({
    error: 'method_not_allowed'
  }, 405, origin);
  const user = await authorise(req);
  if (!user) return json({
    error: 'unauthorized'
  }, 401, origin);
  let body;
  try {
    body = await req.json();
  } catch  {
    return json({
      error: 'invalid_json'
    }, 400, origin);
  }
  const action = String(body.action || '').toLowerCase();
  const params = body.params || {};
  try {
    let result;
    switch(action){
      case 'overview':
        result = await handleOverview();
        break;
      case 'members':
        result = await handleMembers(params);
        break;
      case 'member_detail':
        result = await handleMemberDetail(params);
        break;
      case 'member_timeline':
        result = await handleMemberTimeline(params);
        break;
      case 'member_raw':
        result = await handleMemberRaw(params);
        break;
      case 'member_programme':
        result = await handleMemberProgramme(params);
        break;
      case 'companies':
        result = await handleCompanies();
        break;
      case 'platform':
        result = await handlePlatform(params);
        break;
      case 'activity_feed':
        result = await handleActivityFeed(params);
        break;
      case 'alerts':
        result = await handleAlerts(params);
        break;
      case 'health':
        result = await handleHealth();
        break;
      default:
        return json({
          error: 'unknown_action',
          action
        }, 400, origin);
    }
    return json({
      ok: true,
      admin: user.email,
      action,
      data: result
    }, 200, origin);
  } catch (err) {
    return json({
      error: 'handler_failed',
      message: err.message
    }, 500, origin);
  }
});
