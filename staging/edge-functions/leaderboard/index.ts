// leaderboard v17 — SQL-side ranking via get_leaderboard() RPC (PM-22)
// Replaces v11/v16 application-side sort + slice with a single RPC call. EF is now a thin wrapper:
//   - Parse query params (scope, range, optional ?email= for legacy back-compat).
//   - JWT-validate caller (or fall back to ?email= for back-compat with pre-v11 clients).
//   - Call public.get_leaderboard(p_email, p_scope, p_range).
//   - Return RPC result as JSON.
// Response shape unchanged from v11/v16. Portal pages do not need to change.
//
// Why this is faster at scale: v11 pulled ALL rows from member_home_state + members + employer_members
// (one row per member each), sorted in JS, sliced in JS. At 100K members that's ~50MB+ JSON over the wire
// and ~100K-element array sorts on every load. v17 pushes the sort + top-100 slice into Postgres window
// functions, returns ~6KB regardless of total member count.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
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
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Credentials': allowOrigin !== '*' ? 'true' : 'false'
  };
}
serve(async (req)=>{
  const CORS = getCORSHeaders(req);
  if (req.method === 'OPTIONS') return new Response('ok', {
    headers: CORS
  });
  try {
    // Auth: prefer JWT; fall back to ?email= for back-compat with v11 callers.
    let callerEmail = null;
    const authHeader = req.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      if (token !== SUPABASE_ANON) {
        try {
          const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);
          const { data: { user }, error } = await supabase.auth.getUser(token);
          if (!error && user?.email) callerEmail = user.email.toLowerCase();
        } catch (_) {}
      }
    }
    const url = new URL(req.url);
    if (!callerEmail) {
      callerEmail = url.searchParams.get('email')?.toLowerCase() ?? null;
    }
    if (!callerEmail) {
      return new Response(JSON.stringify({
        error: 'Missing auth — send JWT or ?email= param'
      }), {
        status: 400,
        headers: {
          ...CORS,
          'Content-Type': 'application/json'
        }
      });
    }
    const scopeParam = (url.searchParams.get('scope') || 'all').toLowerCase();
    const scope = scopeParam === 'company' || scopeParam === 'my-team' ? scopeParam : 'all';
    const rangeParam = (url.searchParams.get('range') || 'this_month').toLowerCase();
    const range = rangeParam === 'last_30d' || rangeParam === 'all_time' ? rangeParam : 'this_month';
    // Service-role client to call the RPC (RPC is SECURITY DEFINER so any role technically works,
    // but service-role is consistent with the v11 query path).
    const sb = createClient(SUPABASE_URL, SUPABASE_KEY);
    const { data, error } = await sb.rpc('get_leaderboard', {
      p_email: callerEmail,
      p_scope: scope,
      p_range: range
    });
    if (error) {
      console.error('leaderboard RPC error:', error);
      return new Response(JSON.stringify({
        error: error.message || String(error)
      }), {
        status: 500,
        headers: {
          ...CORS,
          'Content-Type': 'application/json'
        }
      });
    }
    return new Response(JSON.stringify(data), {
      headers: {
        ...CORS,
        'Content-Type': 'application/json'
      }
    });
  } catch (err) {
    console.error('leaderboard error:', err);
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
