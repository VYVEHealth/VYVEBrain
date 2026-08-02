import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
// process-scheduled-pushes v2 — cron worker that fires due rows from scheduled_pushes.
//
// Cron: */5 * * * * (every 5 min). At 2h delay, members will see push at 2h0–4min.
//
// Auth: verify_jwt:false (matches the convention used by re-engagement-scheduler,
// daily-report, certificate-checker etc — these cron-driven EFs are public-callable
// because they have no exploitable side effects: the only work they do is process
// rows that were already created by authenticated paths). The queue rows in
// scheduled_pushes can only be inserted via the schedule-push EF (which IS JWT-
// gated and uses the JWT-supplied email). An attacker hitting this EF directly
// would only cause already-queued rows to fire slightly sooner — no security risk.
//
// Why v2 changed: v1 had verify_jwt:true plus an internal service-role check, but
// the cron command relies on `current_setting(\'app.service_role_key\')` which is
// NULL on this database (the setting was never configured). That's why
// habit-reminder-daily and achievements-sweep-daily have been silently failing
// since 28 April — same broken pattern. Switching to verify_jwt:false matches
// the working cron jobs and avoids needing the missing setting.
//
// Flow:
//   SELECT due rows (fire_at <= now, not fired, not cancelled)
//   for each row:
//     POST to send-push (LEGACY_SERVICE_ROLE_JWT)
//     mark fired_at = now() (or last_error if send-push failed)
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const LEGACY_SERVICE_ROLE_JWT = Deno.env.get('LEGACY_SERVICE_ROLE_JWT') ?? '';
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
const BATCH_LIMIT = 200;
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
async function callSendPush(row) {
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/send-push`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LEGACY_SERVICE_ROLE_JWT}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        member_emails: [
          row.member_email
        ],
        type: row.type,
        title: row.title,
        body: row.body,
        data: row.data || {},
        // One-shot reminders are time-of-day specific; same-day dedupe in send-push
        // would suppress a snooze that fires the same day as the original cron push.
        // Idempotency is already enforced upstream by dedupe_key on scheduled_pushes.
        dedupe_same_day: false
      })
    });
    if (!res.ok) {
      const txt = await res.text();
      return {
        ok: false,
        error: `send-push ${res.status}: ${txt.slice(0, 300)}`
      };
    }
    const j = await res.json();
    return {
      ok: true,
      result: j
    };
  } catch (e) {
    return {
      ok: false,
      error: String(e)
    };
  }
}
serve(async (req)=>{
  if (req.method === 'OPTIONS') return new Response('ok', {
    headers: CORS
  });
  const startedAt = new Date().toISOString();
  let dueCount = 0, fired = 0, failed = 0;
  const failures = [];
  try {
    const nowIso = new Date().toISOString();
    const dueRes = await db(`scheduled_pushes?fire_at=lte.${encodeURIComponent(nowIso)}&fired_at=is.null&cancelled_at=is.null&select=id,member_email,fire_at,type,title,body,data&order=fire_at.asc&limit=${BATCH_LIMIT}`);
    if (!dueRes.ok) {
      const txt = await dueRes.text();
      return new Response(JSON.stringify({
        error: 'db read failed',
        detail: txt.slice(0, 500)
      }), {
        status: 500,
        headers: {
          ...CORS,
          'Content-Type': 'application/json'
        }
      });
    }
    const rows = await dueRes.json();
    dueCount = rows.length;
    // Sequential to keep per-row marking simple and avoid hammering send-push.
    // 200 rows / cycle * 5 min cycle = max 40/min sustained, well within capacity.
    for (const row of rows){
      const result = await callSendPush(row);
      const updateBody = result.ok ? {
        fired_at: new Date().toISOString(),
        last_error: null
      } : {
        last_error: result.error || 'unknown'
      };
      const updRes = await db(`scheduled_pushes?id=eq.${row.id}`, {
        method: 'PATCH',
        body: JSON.stringify(updateBody),
        headers: {
          'Prefer': 'return=minimal'
        }
      });
      if (!updRes.ok) {
        const txt = await updRes.text();
        console.warn('[process-scheduled-pushes] mark failed:', row.id, updRes.status, txt);
      }
      if (result.ok) {
        fired++;
      } else {
        failed++;
        failures.push({
          id: row.id,
          error: result.error || 'unknown'
        });
      }
    }
    console.log(`[process-scheduled-pushes v2] ${startedAt} due=${dueCount} fired=${fired} failed=${failed}`);
    return new Response(JSON.stringify({
      ok: true,
      version: 'v2',
      started_at: startedAt,
      due: dueCount,
      fired,
      failed,
      failures: failures.slice(0, 20)
    }), {
      headers: {
        ...CORS,
        'Content-Type': 'application/json'
      }
    });
  } catch (err) {
    console.error('[process-scheduled-pushes v2] error:', err);
    return new Response(JSON.stringify({
      error: String(err),
      due: dueCount,
      fired,
      failed
    }), {
      status: 500,
      headers: {
        ...CORS,
        'Content-Type': 'application/json'
      }
    });
  }
});
