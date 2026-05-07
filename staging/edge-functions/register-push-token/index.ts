// VYVE Health — register-push-token v1
// Called from the Capacitor iOS app on the PushNotifications 'registration' event.
// verify_jwt: true — Supabase validates the bearer token before invocation;
// we then derive member_email from the JWT and upsert the device token by token (unique).
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const ALLOWED_ORIGINS = new Set([
  'https://online.vyvehealth.co.uk',
  'https://www.vyvehealth.co.uk',
  'capacitor://localhost',
  'http://localhost'
]);
function getCORSHeaders(req) {
  const origin = req.headers.get('Origin') ?? '';
  const allowOrigin = ALLOWED_ORIGINS.has(origin) ? origin : origin === '' || origin === 'null' ? '*' : 'https://online.vyvehealth.co.uk';
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Credentials': allowOrigin !== '*' ? 'true' : 'false'
  };
}
async function getAuthEmail(req) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${token}`
    }
  });
  if (!res.ok) return null;
  const user = await res.json();
  return user.email?.toLowerCase() || null;
}
function db(path, opts = {}) {
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...opts,
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      ...opts.headers || {}
    }
  });
}
function badRequest(msg, CORS) {
  return new Response(JSON.stringify({
    error: msg
  }), {
    status: 400,
    headers: {
      ...CORS,
      'Content-Type': 'application/json'
    }
  });
}
serve(async (req)=>{
  const CORS = getCORSHeaders(req);
  if (req.method === 'OPTIONS') return new Response('ok', {
    headers: CORS
  });
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({
      error: 'method not allowed'
    }), {
      status: 405,
      headers: {
        ...CORS,
        'Content-Type': 'application/json'
      }
    });
  }
  const email = await getAuthEmail(req);
  if (!email) {
    return new Response(JSON.stringify({
      error: 'unauthenticated'
    }), {
      status: 401,
      headers: {
        ...CORS,
        'Content-Type': 'application/json'
      }
    });
  }
  let body;
  try {
    body = await req.json();
  } catch  {
    return badRequest('invalid json', CORS);
  }
  const token = String(body.token || '').trim();
  const platform = String(body.platform || '').toLowerCase();
  const environment = String(body.environment || '').toLowerCase();
  const app_version = body.app_version ? String(body.app_version).trim().slice(0, 64) : null;
  if (!token) return badRequest('token required', CORS);
  if (token.length > 512) return badRequest('token too long', CORS);
  if (![
    'ios',
    'android'
  ].includes(platform)) return badRequest('platform must be ios or android', CORS);
  if (![
    'development',
    'production'
  ].includes(environment)) return badRequest('environment must be development or production', CORS);
  const now = new Date().toISOString();
  const upsertRes = await db('push_subscriptions_native?on_conflict=token', {
    method: 'POST',
    headers: {
      'Prefer': 'resolution=merge-duplicates,return=representation'
    },
    body: JSON.stringify({
      member_email: email,
      token,
      platform,
      environment,
      app_version,
      last_used_at: now,
      revoked_at: null,
      updated_at: now
    })
  });
  if (!upsertRes.ok) {
    const errText = await upsertRes.text();
    console.error('[register-push-token] upsert failed:', upsertRes.status, errText);
    return new Response(JSON.stringify({
      error: 'db error',
      detail: errText
    }), {
      status: 500,
      headers: {
        ...CORS,
        'Content-Type': 'application/json'
      }
    });
  }
  const rows = await upsertRes.json();
  console.log(`[register-push-token v1] registered token for ${email} platform=${platform} env=${environment} app_version=${app_version ?? '(none)'}`);
  return new Response(JSON.stringify({
    ok: true,
    id: rows[0]?.id,
    member_email: email
  }), {
    headers: {
      ...CORS,
      'Content-Type': 'application/json'
    }
  });
});
