// VYVE Health — notifications v2 — PWA standalone CORS fix
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const SUPABASE_ANON = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const ALLOWED_ORIGINS = new Set([
  'https://online.vyvehealth.co.uk',
  'https://www.vyvehealth.co.uk'
]);
function getCORSHeaders(req) {
  const origin = req.headers.get('Origin') ?? '';
  const allowOrigin = ALLOWED_ORIGINS.has(origin) ? origin : origin === 'null' || origin === '' ? '*' : 'https://online.vyvehealth.co.uk';
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Credentials': allowOrigin !== '*' ? 'true' : 'false'
  };
}
async function getAuthEmail(req) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  if (token === SUPABASE_ANON) return null;
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
serve(async (req)=>{
  const CORS = getCORSHeaders(req);
  if (req.method === 'OPTIONS') return new Response('ok', {
    headers: CORS
  });
  const email = await getAuthEmail(req);
  if (!email) {
    return new Response(JSON.stringify({
      error: 'Authentication required'
    }), {
      status: 401,
      headers: {
        ...CORS,
        'Content-Type': 'application/json'
      }
    });
  }
  const enc = encodeURIComponent(email);
  try {
    if (req.method === 'GET') {
      const res = await db(`member_notifications?member_email=eq.${enc}&order=created_at.desc&limit=50`);
      const notifications = await res.json();
      const unread_count = notifications.filter((n)=>!n.read).length;
      return new Response(JSON.stringify({
        unread_count,
        notifications
      }), {
        headers: {
          ...CORS,
          'Content-Type': 'application/json'
        }
      });
    }
    if (req.method === 'POST') {
      const body = await req.json();
      const { action, id } = body;
      if (action === 'mark_read') {
        if (id) {
          await db(`member_notifications?id=eq.${encodeURIComponent(id)}&member_email=eq.${enc}`, {
            method: 'PATCH',
            body: JSON.stringify({
              read: true
            }),
            headers: {
              'Prefer': 'return=minimal'
            }
          });
        } else {
          await db(`member_notifications?member_email=eq.${enc}&read=eq.false`, {
            method: 'PATCH',
            body: JSON.stringify({
              read: true
            }),
            headers: {
              'Prefer': 'return=minimal'
            }
          });
        }
        return new Response(JSON.stringify({
          success: true
        }), {
          headers: {
            ...CORS,
            'Content-Type': 'application/json'
          }
        });
      }
      return new Response(JSON.stringify({
        error: 'Unknown action'
      }), {
        status: 400,
        headers: {
          ...CORS,
          'Content-Type': 'application/json'
        }
      });
    }
    return new Response('Method not allowed', {
      status: 405,
      headers: CORS
    });
  } catch (err) {
    console.error('notifications error:', err);
    return new Response(JSON.stringify({
      error: String(err)
    }), {
      status: 500,
      headers: {
        ...CORS,
        'Content-Type': 'application/json'
      }
    });
  }
});
