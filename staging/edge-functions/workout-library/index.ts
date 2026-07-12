import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const MAX_PAUSED = 3;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

async function getEmail(authHeader: string | null): Promise<string | null> {
  if (!authHeader) return null;
  try {
    const client = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
      auth: { autoRefreshToken: false, persistSession: false }
    });
    const { data: { user }, error } = await client.auth.getUser();
    if (error || !user?.email) return null;
    return user.email;
  } catch { return null; }
}

// Enforce paused-plan cap: keep only the N most recently paused.
// IMPORTANT: only ever auto-delete spare LIBRARY picks (one-tap re-obtainable).
// Never auto-delete a member's tailored/onboarding/custom/shared/picker plan —
// those persist as resumable paused plans indefinitely.
async function enforcePausedCap(admin: any, email: string) {
  const { data: paused } = await admin
    .from('workout_plan_cache')
    .select('id, paused_at')
    .eq('member_email', email)
    .eq('is_active', false)
    .eq('source', 'library')
    .order('paused_at', { ascending: false });

  if (paused && paused.length > MAX_PAUSED) {
    const toDelete = paused.slice(MAX_PAUSED).map((r: any) => r.id);
    await admin.from('workout_plan_cache').delete().in('id', toDelete);
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const admin = createClient(SUPABASE_URL, SERVICE_KEY);
  const url = new URL(req.url);
  const id = url.searchParams.get('id');

  // POST — activate or resume
  if (req.method === 'POST') {
    const email = await getEmail(req.headers.get('Authorization'));
    if (!email) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    let body: { programme_id?: string; action?: string; plan_id?: string } = {};
    try { body = await req.json(); } catch (_) {}

    // ── Resume a paused plan ──
    if (body.action === 'resume' && body.plan_id) {
      const { data: pausedPlan, error: fetchErr } = await admin
        .from('workout_plan_cache')
        .select('*')
        .eq('id', body.plan_id)
        .eq('member_email', email)
        .eq('is_active', false)
        .single();

      if (fetchErr || !pausedPlan) {
        return new Response(JSON.stringify({ error: 'Paused plan not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // Pause current active programme(s) on the SAME surface as the plan being resumed,
      // so resuming a workouts plan doesn't disturb an active movement plan (and vice versa).
      const resumeSurface = (pausedPlan.programme_json && pausedPlan.programme_json.surface) || 'workouts';
      await admin
        .from('workout_plan_cache')
        .update({ is_active: false, paused_at: new Date().toISOString() })
        .eq('member_email', email)
        .eq('is_active', true)
        .eq('programme_json->>surface', resumeSurface);

      // Reactivate the paused plan (preserve week/session progress)
      await admin
        .from('workout_plan_cache')
        .update({ is_active: true, paused_at: null })
        .eq('id', body.plan_id);

      // Enforce cap (library-only)
      await enforcePausedCap(admin, email);

      const programmeName = pausedPlan.programme_json?.programme_name || 'Programme';
      return new Response(JSON.stringify({ success: true, programme_name: programmeName }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ── Activate a new library programme ──
    const programmeId = body.programme_id;
    if (!programmeId) return new Response(JSON.stringify({ error: 'programme_id required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const { data: programme, error: libErr } = await admin.from('programme_library').select('*').eq('id', programmeId).eq('is_active', true).single();
    if (libErr || !programme) return new Response(JSON.stringify({ error: 'Programme not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    // Surface this programme belongs to (programme_library.surface column is reliably populated;
    // default to 'workouts' defensively). Used both to scope the pause and to stamp the new row.
    const surface = programme.surface || 'workouts';

    // Deactivate-old + insert-new (matches onboarding EF v87). No upsert: member_email is no
    // longer unique (PM-420 4a-pre-2 dropped the full unique), so onConflict:'member_email'
    // throws "no unique or exclusion constraint matching the ON CONFLICT specification".
    // Pause the member's current active plan ON THIS SURFACE ONLY (stays resumable);
    // other-surface active plans (e.g. a movement plan) are left untouched.
    // v22: capture the paused row IDs so a failed insert can ROLL BACK the pause —
    // a failed activate must never strand a member with zero active plans
    // (PM: Phil Just-Steps incident, 2026-07-05).
    const { data: pausedRows } = await admin
      .from('workout_plan_cache')
      .update({ is_active: false, paused_at: new Date().toISOString() })
      .eq('member_email', email)
      .eq('is_active', true)
      .eq('programme_json->>surface', surface)
      .select('id');

    // Stamp surface INTO programme_json so the active-plan read path
    // (workouts-programme.js filters programme_json->>surface=eq.workouts) finds it,
    // and the partial unique (member_email, programme_json->>surface WHERE is_active) holds.
    const newProgrammeJson = { ...(programme.programme_json || {}), surface };

    // v22: plan_duration_weeks is NOT NULL with no default. Open-ended programmes
    // (Just Steps: duration_weeks = null) use sentinel 0 — same convention as the
    // movement picker (movement-plans.html startPlan). Never pass null through
    // (§23: explicit null overrides nothing and hard-fails the row).
    const durationWeeks = programme.duration_weeks
      ?? ((newProgrammeJson.weekly_targets || []).length || 0);

    const { error: insertErr } = await admin.from('workout_plan_cache').insert({
      member_email: email,
      programme_json: newProgrammeJson,
      plan_duration_weeks: durationWeeks,
      current_week: 1,
      current_session: 1,
      is_active: true,
      source: 'library',
      source_id: programmeId,
      generated_at: new Date().toISOString()
    });

    if (insertErr) {
      console.error('activate error:', insertErr);
      // v22 rollback: restore the plan(s) we just paused so the member is never
      // left planless by a failed activate.
      try {
        const ids = (pausedRows || []).map((r: any) => r.id);
        if (ids.length) {
          await admin
            .from('workout_plan_cache')
            .update({ is_active: true, paused_at: null })
            .in('id', ids);
        }
      } catch (rbErr) {
        console.error('activate rollback failed:', rbErr);
      }
      return new Response(JSON.stringify({ error: insertErr.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Enforce cap — delete oldest paused LIBRARY plans beyond limit (never tailored/onboarding)
    await enforcePausedCap(admin, email);

    return new Response(JSON.stringify({ success: true, programme_name: programme.programme_name }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  // GET ?id=UUID — full detail
  if (id) {
    const { data, error } = await admin.from('programme_library').select('*').eq('id', id).eq('is_active', true).single();
    if (error || !data) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  // GET — metadata list
  const { data, error } = await admin
    .from('programme_library')
    .select('id,programme_name,description,category,difficulty,equipment,days_per_week,duration_weeks,sessions_per_week,tags,preview_sessions,sort_order')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
});
