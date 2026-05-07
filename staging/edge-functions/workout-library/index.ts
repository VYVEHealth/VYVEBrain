import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
const MAX_PAUSED = 3;
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
};
async function getEmail(authHeader) {
  if (!authHeader) return null;
  try {
    const client = createClient(SUPABASE_URL, ANON_KEY, {
      global: {
        headers: {
          Authorization: authHeader
        }
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    const { data: { user }, error } = await client.auth.getUser();
    if (error || !user?.email) return null;
    return user.email;
  } catch  {
    return null;
  }
}
// Enforce paused plan cap: keep only the N most recently paused, delete the rest
async function enforcePausedCap(admin, email) {
  const { data: paused } = await admin.from('workout_plan_cache').select('id, paused_at').eq('member_email', email).eq('is_active', false).order('paused_at', {
    ascending: false
  });
  if (paused && paused.length > MAX_PAUSED) {
    const toDelete = paused.slice(MAX_PAUSED).map((r)=>r.id);
    await admin.from('workout_plan_cache').delete().in('id', toDelete);
  }
}
Deno.serve(async (req)=>{
  if (req.method === 'OPTIONS') return new Response(null, {
    headers: corsHeaders
  });
  const admin = createClient(SUPABASE_URL, SERVICE_KEY);
  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  // POST — activate or resume
  if (req.method === 'POST') {
    const email = await getEmail(req.headers.get('Authorization'));
    if (!email) return new Response(JSON.stringify({
      error: 'Unauthorized'
    }), {
      status: 401,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
    let body = {};
    try {
      body = await req.json();
    } catch (_) {}
    // ── Resume a paused plan ──
    if (body.action === 'resume' && body.plan_id) {
      const { data: pausedPlan, error: fetchErr } = await admin.from('workout_plan_cache').select('*').eq('id', body.plan_id).eq('member_email', email).eq('is_active', false).single();
      if (fetchErr || !pausedPlan) {
        return new Response(JSON.stringify({
          error: 'Paused plan not found'
        }), {
          status: 404,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
      // Pause current active programme(s)
      await admin.from('workout_plan_cache').update({
        is_active: false,
        paused_at: new Date().toISOString()
      }).eq('member_email', email).eq('is_active', true);
      // Reactivate the paused plan (preserve week/session progress)
      await admin.from('workout_plan_cache').update({
        is_active: true,
        paused_at: null
      }).eq('id', body.plan_id);
      // Enforce cap
      await enforcePausedCap(admin, email);
      const programmeName = pausedPlan.programme_json?.programme_name || 'Programme';
      return new Response(JSON.stringify({
        success: true,
        programme_name: programmeName
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // ── Activate a new library programme ──
    const programmeId = body.programme_id;
    if (!programmeId) return new Response(JSON.stringify({
      error: 'programme_id required'
    }), {
      status: 400,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
    const { data: programme, error: libErr } = await admin.from('programme_library').select('*').eq('id', programmeId).eq('is_active', true).single();
    if (libErr || !programme) return new Response(JSON.stringify({
      error: 'Programme not found'
    }), {
      status: 404,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
    // UPSERT new active programme (fixes duplicate key constraint violation)
    const { error: upsertErr } = await admin.from('workout_plan_cache').upsert({
      member_email: email,
      programme_json: programme.programme_json,
      plan_duration_weeks: programme.duration_weeks,
      current_week: 1,
      current_session: 1,
      is_active: true,
      source: 'library',
      source_id: programmeId,
      generated_at: new Date().toISOString()
    }, {
      onConflict: 'member_email'
    });
    if (upsertErr) {
      console.error('activate error:', upsertErr);
      return new Response(JSON.stringify({
        error: upsertErr.message
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Enforce cap — delete oldest paused plans beyond limit
    await enforcePausedCap(admin, email);
    return new Response(JSON.stringify({
      success: true,
      programme_name: programme.programme_name
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
  // GET ?id=UUID — full detail
  if (id) {
    const { data, error } = await admin.from('programme_library').select('*').eq('id', id).eq('is_active', true).single();
    if (error || !data) return new Response(JSON.stringify({
      error: 'Not found'
    }), {
      status: 404,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
    return new Response(JSON.stringify(data), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
  // GET — metadata list
  const { data, error } = await admin.from('programme_library').select('id,programme_name,description,category,difficulty,equipment,days_per_week,duration_weeks,sessions_per_week,tags,preview_sessions,sort_order').eq('is_active', true).order('sort_order', {
    ascending: true
  });
  if (error) return new Response(JSON.stringify({
    error: error.message
  }), {
    status: 500,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json'
    }
  });
  return new Response(JSON.stringify(data), {
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json'
    }
  });
});
