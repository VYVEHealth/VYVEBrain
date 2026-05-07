import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
};
function generateId() {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 8);
}
// share-workout v10: add_programme now UPSERTs the single workout_plan_cache row
// per member (unique constraint on member_email). Previous UPDATE-then-INSERT
// flow always failed the INSERT with duplicate key.
const OFFENSIVE_SUBSTRINGS = [
  'FAT',
  'UGLY',
  'FATTY',
  'ASS',
  'TIT',
  'TITS',
  'BUT',
  'BUTT',
  'CUM',
  'CUNT',
  'DICK',
  'FUK',
  'FUCK',
  'SHIT',
  'SHT',
  'SEX',
  'SUCK',
  'PISS',
  'PUSS',
  'WANK',
  'FAG',
  'HAG',
  'NIG',
  'NGR',
  'NAZI',
  'RAPE',
  'KKK',
  'JEW',
  'KILL',
  'DIE',
  'DEAD',
  'GUN'
];
function normaliseForBlocklist(code) {
  return code.replace(/7/g, 'T').replace(/1/g, 'I').replace(/0/g, 'O').replace(/5/g, 'S').replace(/3/g, 'E').replace(/4/g, 'A').replace(/8/g, 'B').replace(/6/g, 'G').replace(/9/g, 'G').replace(/2/g, 'Z');
}
function isOffensive(code) {
  const normalised = normaliseForBlocklist(code);
  for (const banned of OFFENSIVE_SUBSTRINGS){
    if (normalised.includes(banned)) return true;
  }
  return false;
}
function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  for(let attempt = 0; attempt < 10; attempt++){
    let code = '';
    const bytes = crypto.getRandomValues(new Uint8Array(6));
    for (const b of bytes)code += chars[b % chars.length];
    if (!isOffensive(code)) return code;
    console.warn(`[share-workout] blocked offensive code "${code}" on attempt ${attempt + 1}`);
  }
  let fallback = '';
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  for (const b of bytes)fallback += 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[b % 32];
  return fallback;
}
async function getAuthenticatedEmail(authHeader) {
  if (!authHeader) return null;
  try {
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
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
    const { data: { user }, error } = await userClient.auth.getUser();
    if (error || !user?.email) return null;
    return user.email;
  } catch  {
    return null;
  }
}
Deno.serve(async (req)=>{
  if (req.method === 'OPTIONS') return new Response(null, {
    headers: corsHeaders
  });
  const url = new URL(req.url);
  const shareId = url.searchParams.get('id');
  const shareCode = url.searchParams.get('code')?.toUpperCase();
  const wantFull = url.searchParams.get('full') === 'true';
  const action = url.searchParams.get('action');
  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  if (req.method === 'GET' && shareCode && !shareId) {
    const { data: share, error } = await adminClient.from('shared_workouts').select('id, session_data, full_programme_json, shared_by, views, expires_at, discount_code, share_code').eq('share_code', shareCode).single();
    if (error || !share) return new Response(JSON.stringify({
      error: 'not_found'
    }), {
      status: 404,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
    if (new Date(share.expires_at) < new Date()) return new Response(JSON.stringify({
      error: 'expired'
    }), {
      status: 410,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
    adminClient.from('shared_workouts').update({
      views: share.views + 1
    }).eq('id', share.id).then(()=>{});
    const { data: sharer } = await adminClient.from('members').select('first_name').eq('email', share.shared_by).single();
    return new Response(JSON.stringify({
      id: share.id,
      share_code: share.share_code,
      session_data: share.session_data,
      has_full_programme: !!share.full_programme_json,
      shared_by_name: sharer?.first_name || 'A VYVE member',
      discount_code: share.discount_code
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
  if (req.method === 'POST' && action === 'save_session') {
    const email = await getAuthenticatedEmail(req.headers.get('Authorization'));
    if (!email) return new Response(JSON.stringify({
      error: 'auth_required'
    }), {
      status: 401,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
    const body = await req.json();
    const { session_data } = body;
    if (!session_data) return new Response(JSON.stringify({
      error: 'session_data required'
    }), {
      status: 400,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
    const workoutName = (session_data.session_name || session_data.source_programme || session_data.programme_name || 'Shared Workout') + ' (shared)';
    const cleanExercises = (session_data.exercises || []).map((ex)=>({
        exercise_name: ex.exercise_name,
        sets: ex.sets,
        reps: ex.reps,
        rest_seconds: ex.rest_seconds,
        muscle_group: ex.muscle_group || '',
        equipment_needed: ex.equipment_needed || ''
      }));
    const { error: insertError } = await adminClient.from('custom_workouts').insert({
      member_email: email,
      workout_name: workoutName,
      exercises: cleanExercises
    });
    if (insertError) {
      console.error('save_session error:', insertError);
      return new Response(JSON.stringify({
        error: insertError.message
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    return new Response(JSON.stringify({
      success: true
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
  if (req.method === 'POST' && action === 'add_programme') {
    const email = await getAuthenticatedEmail(req.headers.get('Authorization'));
    if (!email) return new Response(JSON.stringify({
      error: 'auth_required'
    }), {
      status: 401,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
    const id = shareId || (await req.json().catch(()=>({}))).share_id;
    if (!id) return new Response(JSON.stringify({
      error: 'share id required'
    }), {
      status: 400,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
    const { data: share, error: shareError } = await adminClient.from('shared_workouts').select('full_programme_json, programme_duration_weeks, expires_at').eq('id', id).single();
    if (shareError || !share) return new Response(JSON.stringify({
      error: 'not_found'
    }), {
      status: 404,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
    if (new Date(share.expires_at) < new Date()) return new Response(JSON.stringify({
      error: 'expired'
    }), {
      status: 410,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
    if (!share.full_programme_json) return new Response(JSON.stringify({
      error: 'no_programme'
    }), {
      status: 400,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
    // UPSERT: workout_plan_cache has UNIQUE(member_email). Overwrite existing row in
    // place rather than insert-new, which previously violated the unique key.
    const { error: upsertError } = await adminClient.from('workout_plan_cache').upsert({
      member_email: email,
      programme_json: share.full_programme_json,
      plan_duration_weeks: share.programme_duration_weeks || 8,
      current_week: 1,
      current_session: 1,
      is_active: true,
      paused_at: null,
      generated_at: new Date().toISOString(),
      source: 'shared',
      source_id: id
    }, {
      onConflict: 'member_email'
    });
    if (upsertError) {
      console.error('add_programme upsert error:', upsertError);
      return new Response(JSON.stringify({
        error: upsertError.message
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    return new Response(JSON.stringify({
      success: true
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
  if (req.method === 'GET' && shareId && wantFull) {
    const email = await getAuthenticatedEmail(req.headers.get('Authorization'));
    if (!email) return new Response(JSON.stringify({
      error: 'auth_required'
    }), {
      status: 401,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
    const { data: share, error } = await adminClient.from('shared_workouts').select('full_programme_json, programme_duration_weeks, shared_by, expires_at').eq('id', shareId).single();
    if (error || !share) return new Response(JSON.stringify({
      error: 'not_found'
    }), {
      status: 404,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
    if (new Date(share.expires_at) < new Date()) return new Response(JSON.stringify({
      error: 'expired'
    }), {
      status: 410,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
    const { data: sharer } = await adminClient.from('members').select('first_name').eq('email', share.shared_by).single();
    return new Response(JSON.stringify({
      full_programme_json: share.full_programme_json,
      programme_duration_weeks: share.programme_duration_weeks,
      shared_by_name: sharer?.first_name || 'A VYVE member'
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
  if (req.method === 'GET' && shareId) {
    const { data: share, error } = await adminClient.from('shared_workouts').select('id, session_data, full_programme_json, shared_by, views, expires_at, discount_code, share_code').eq('id', shareId).single();
    if (error || !share) return new Response(JSON.stringify({
      error: 'not_found'
    }), {
      status: 404,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
    if (new Date(share.expires_at) < new Date()) return new Response(JSON.stringify({
      error: 'expired'
    }), {
      status: 410,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
    adminClient.from('shared_workouts').update({
      views: share.views + 1
    }).eq('id', shareId).then(()=>{});
    const { data: sharer } = await adminClient.from('members').select('first_name').eq('email', share.shared_by).single();
    return new Response(JSON.stringify({
      id: share.id,
      share_code: share.share_code,
      session_data: share.session_data,
      has_full_programme: !!share.full_programme_json,
      shared_by_name: sharer?.first_name || 'A VYVE member',
      discount_code: share.discount_code
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
  if (req.method === 'POST' && !action) {
    const email = await getAuthenticatedEmail(req.headers.get('Authorization'));
    if (!email) return new Response(JSON.stringify({
      error: 'auth_required'
    }), {
      status: 401,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
    const body = await req.json();
    const { session_data, full_programme_json, programme_duration_weeks } = body;
    if (!session_data) return new Response(JSON.stringify({
      error: 'session_data required'
    }), {
      status: 400,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
    const exercises = session_data.exercises || [];
    const exerciseNames = exercises.map((e)=>e.exercise_name);
    let videoMap = {};
    if (exerciseNames.length > 0) {
      const { data: planRows } = await adminClient.from('workout_plans').select('exercise_name, video_url, thumbnail_url').in('exercise_name', exerciseNames);
      if (planRows) for (const row of planRows){
        if (!videoMap[row.exercise_name]) videoMap[row.exercise_name] = {
          video_url: row.video_url,
          thumbnail_url: row.thumbnail_url
        };
      }
    }
    const enrichedExercises = exercises.map((ex)=>({
        ...ex,
        video_url: videoMap[ex.exercise_name]?.video_url || null,
        thumbnail_url: videoMap[ex.exercise_name]?.thumbnail_url || null
      }));
    const newShareId = generateId();
    const shareCode = generateCode();
    const { error: insertError } = await adminClient.from('shared_workouts').insert({
      id: newShareId,
      shared_by: email,
      session_data: {
        ...session_data,
        exercises: enrichedExercises
      },
      full_programme_json: full_programme_json || null,
      programme_duration_weeks: programme_duration_weeks || null,
      discount_code: 'VYVE10',
      share_code: shareCode
    });
    if (insertError) return new Response(JSON.stringify({
      error: 'Failed to create share'
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
    const shareUrl = `https://online.vyvehealth.co.uk/shared-workout.html?id=${newShareId}`;
    return new Response(JSON.stringify({
      share_id: newShareId,
      share_url: shareUrl,
      share_code: shareCode
    }), {
      status: 201,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
  return new Response(JSON.stringify({
    error: 'Method not allowed'
  }), {
    status: 405,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json'
    }
  });
});
