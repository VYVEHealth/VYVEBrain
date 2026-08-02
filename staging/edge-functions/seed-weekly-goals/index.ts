// seed-weekly-goals v1 — Mon 00:01 UTC cron seeder for the recurring weekly goals strip (06 May 2026)
//
// Behaviour:
//  - Determines the current ISO Monday in UTC
//  - For every member with onboarding_complete=true AND subscription_status<>'cancelled',
//    upserts a weekly_goals row for that week with the v2 four-row template:
//      habits_target=3, exercise_target=3, sessions_target=2, checkin_target=1
//    Legacy columns (workouts_target, cardio_target, movement_target) zeroed so they don't surface.
//  - ON CONFLICT (member_email, week_start) DO NOTHING — re-runs are idempotent and safe.
//  - Service-role internally; verify_jwt:false at the gateway with a manual shared-secret guard
//    (cron supplies SEED_WEEKLY_GOALS_SECRET via the request header).
//  - Designed to be triggered by pg_cron via a SQL net.http_post call OR manually invoked from the workbench.
//
// Returns a structured summary so the cron job log captures success/failure cleanly.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const LEGACY_JWT = Deno.env.get('LEGACY_SERVICE_ROLE_JWT') ?? '';
const SHARED_SECRET = Deno.env.get('SEED_WEEKLY_GOALS_SECRET') ?? '';
function isoMondayUtc(now = new Date()) {
  const dt = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const dow = dt.getUTCDay();
  const daysBack = dow === 0 ? 6 : dow - 1;
  dt.setUTCDate(dt.getUTCDate() - daysBack);
  return dt.toISOString().slice(0, 10);
}
function authorise(req) {
  const auth = req.headers.get('authorization') || '';
  const bearer = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (SERVICE_ROLE_KEY && bearer === SERVICE_ROLE_KEY) return {
    ok: true
  };
  if (LEGACY_JWT && bearer === LEGACY_JWT) return {
    ok: true
  };
  if (SHARED_SECRET && req.headers.get('x-seed-secret') === SHARED_SECRET) return {
    ok: true
  };
  return {
    ok: false,
    status: 401,
    body: {
      error: 'unauthorized'
    }
  };
}
async function listActiveMembers() {
  // Active = onboarding_complete=true AND subscription_status<>'cancelled' (NULL counts as active for trial seats)
  const url = `${SUPABASE_URL}/rest/v1/members?select=email&onboarding_complete=eq.true&or=(subscription_status.is.null,subscription_status.neq.cancelled)`;
  const r = await fetch(url, {
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`
    }
  });
  if (!r.ok) throw new Error(`listActiveMembers ${r.status}: ${await r.text()}`);
  const rows = await r.json();
  return rows.map((m)=>m.email.toLowerCase().trim()).filter(Boolean);
}
async function upsertGoals(emails, weekStart) {
  if (emails.length === 0) return {
    written: 0,
    failed: 0
  };
  // Build payload: 4-row template, legacy columns zeroed.
  const payload = emails.map((email)=>({
      member_email: email,
      week_start: weekStart,
      habits_target: 3,
      exercise_target: 3,
      sessions_target: 2,
      checkin_target: 1,
      workouts_target: 0,
      cardio_target: 0,
      movement_target: 0
    }));
  // ON CONFLICT DO NOTHING via Prefer: resolution=ignore-duplicates,return=minimal
  const r = await fetch(`${SUPABASE_URL}/rest/v1/weekly_goals?on_conflict=member_email,week_start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      Prefer: 'resolution=ignore-duplicates,return=minimal'
    },
    body: JSON.stringify(payload)
  });
  if (!r.ok) {
    const errText = await r.text();
    return {
      written: 0,
      failed: emails.length,
      error: `${r.status}: ${errText.slice(0, 300)}`
    };
  }
  // PostgREST doesn't tell us how many rows actually inserted vs ignored — we return submitted count.
  // Treat "submitted" as "written or already-present" for simplicity. Counter-rows are checked downstream.
  return {
    written: emails.length,
    failed: 0
  };
}
serve(async (req)=>{
  if (req.method !== 'POST' && req.method !== 'GET') {
    return new Response(JSON.stringify({
      error: 'method not allowed'
    }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
  const auth = authorise(req);
  if (!auth.ok) {
    return new Response(JSON.stringify(auth.body), {
      status: auth.status,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
  const startedAt = new Date().toISOString();
  const weekStart = isoMondayUtc();
  try {
    const emails = await listActiveMembers();
    const result = await upsertGoals(emails, weekStart);
    const finishedAt = new Date().toISOString();
    const summary = {
      ok: result.failed === 0,
      week_start: weekStart,
      members_considered: emails.length,
      written_or_existing: result.written,
      failed: result.failed,
      error: result.error ?? null,
      started_at: startedAt,
      finished_at: finishedAt
    };
    console.log('[seed-weekly-goals]', JSON.stringify(summary));
    return new Response(JSON.stringify(summary), {
      status: result.failed === 0 ? 200 : 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (e) {
    console.error('[seed-weekly-goals] fatal', e);
    return new Response(JSON.stringify({
      ok: false,
      week_start: weekStart,
      error: String(e)
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
});
