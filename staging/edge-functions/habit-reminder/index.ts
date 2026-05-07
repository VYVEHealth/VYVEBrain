import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
// ─────────────────────────────────────────────────────────────────────────────
// habit-reminder v13 — find members who haven't logged a habit today, push them.
//
// REFACTORED FROM v12: VAPID + member_notifications + sub lookup all delegated
// to the unified send-push EF. This EF now only contains business logic
// (who needs a reminder + what message they get).
//
// Cron: daily 20:00 UTC (= 21:00 BST = 9pm UK) via vyve-reengagement-daily.
// Skipping habit-reminder-daily job confirmed in pg_cron.
// ─────────────────────────────────────────────────────────────────────────────
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const LEGACY_SERVICE_ROLE_JWT = Deno.env.get('LEGACY_SERVICE_ROLE_JWT') ?? '';
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
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
async function callSendPush(memberEmails, type, title, body, data = {}) {
  // send-push has verify_jwt:true, so we MUST use the legacy JWT format
  // for the gateway. Send-push internally accepts either key for its own guard.
  const res = await fetch(`${SUPABASE_URL}/functions/v1/send-push`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LEGACY_SERVICE_ROLE_JWT}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      member_emails: memberEmails,
      type,
      title,
      body,
      data,
      dedupe_same_day: true
    })
  });
  if (!res.ok) {
    console.warn('[habit-reminder] send-push failed:', res.status, await res.text());
    return null;
  }
  return await res.json();
}
serve(async (req)=>{
  if (req.method === 'OPTIONS') return new Response('ok', {
    headers: CORS
  });
  try {
    const today = new Date().toISOString().slice(0, 10);
    // Find all members + which already logged a habit today
    const membersRes = await db('members?select=email,first_name');
    const members = await membersRes.json();
    const habitsRes = await db(`daily_habits?activity_date=eq.${today}&select=member_email`);
    const doneEmails = new Set((await habitsRes.json()).map((h)=>h.member_email));
    let candidates = 0, pushed = 0, deduped = 0, web_sent = 0, native_sent = 0;
    const failures = [];
    // Per-member: personalised body, single send-push call (dedupe handled by send-push)
    for (const member of members){
      if (doneEmails.has(member.email)) continue;
      candidates++;
      const firstName = member.first_name || 'there';
      const title = "Don't forget your daily habit";
      const body = `Hey ${firstName} — you haven't logged a habit today. Takes 30 seconds.`;
      const result = await callSendPush([
        member.email
      ], 'habit_reminder', title, body, {
        url: '/habits.html'
      });
      if (!result) {
        failures.push(member.email);
        continue;
      }
      if (result.deduped > 0) {
        deduped++;
      } else {
        pushed++;
        web_sent += result.web_sent || 0;
        native_sent += result.native_sent || 0;
      }
    }
    console.log(`[habit-reminder v13] ${today}: candidates=${candidates} pushed=${pushed} deduped=${deduped} web_sent=${web_sent} native_sent=${native_sent} failures=${failures.length}`);
    return new Response(JSON.stringify({
      success: true,
      date: today,
      candidates,
      pushed,
      deduped,
      web_sent,
      native_sent,
      failures
    }), {
      headers: {
        ...CORS,
        'Content-Type': 'application/json'
      }
    });
  } catch (err) {
    console.error('[habit-reminder v13] error:', err);
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
