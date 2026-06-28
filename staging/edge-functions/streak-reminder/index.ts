import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

// ─────────────────────────────────────────────────────────────────────────────
// streak-reminder v14 — find members with active streaks ≥7 who haven't moved today.
//
// v14: FIRST CONSUMER of the comms send-gate. Each eligible member is checked
// with comms_can_send('push','streak','STK-SAVE') BEFORE the push fires
// (consent → calm-mode → quiet-hours → global frequency caps). On a real send we
// record it via comms_log_send so it counts against the shared frequency budget.
// Fail-closed: any gate error skips the send (restraint over noise).
// Business logic (streak calc + targeting) unchanged from v13.
//
// Cron: daily 18:00 UTC (= 19:00 BST = 7pm UK) via streak-reminder-daily.
// verify_jwt:false (cron auth pattern, PM-404).
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

// ── comms send-gate helpers ──────────────────────────────────────────────────
async function commsGate(email, channel, msgType, msgId) {
  try {
    const res = await db('rpc/comms_can_send', {
      method: 'POST',
      body: JSON.stringify({ p_email: email, p_channel: channel, p_msg_type: msgType, p_msg_id: msgId })
    });
    if (!res.ok) {
      console.warn('[streak-reminder] gate http', res.status, await res.text());
      return { allow: false, reason: 'gate_http_error' };
    }
    return await res.json();
  } catch (e) {
    console.warn('[streak-reminder] gate exception', String(e));
    return { allow: false, reason: 'gate_exception' };
  }
}

async function commsLogSend(email, channel, msgType, msgId, register, meta) {
  try {
    await db('rpc/comms_log_send', {
      method: 'POST',
      body: JSON.stringify({
        p_email: email, p_channel: channel, p_msg_type: msgType,
        p_msg_id: msgId, p_register: register, p_meta: meta || {}
      })
    });
  } catch (e) {
    console.warn('[streak-reminder] log_send error', String(e));
  }
}

async function getActivityDates(email) {
  const tables = ['daily_habits', 'workouts', 'cardio', 'session_views'];
  const allDates = new Set();
  await Promise.all(tables.map(async (t) => {
    const res = await db(`${t}?member_email=eq.${encodeURIComponent(email)}&select=activity_date`);
    (await res.json()).forEach((r) => allDates.add(r.activity_date));
  }));
  return allDates;
}

function calculateStreak(dates, today) {
  const sorted = Array.from(dates).sort().reverse();
  let streak = 0;
  const checkDate = new Date(today);
  if (!dates.has(today)) checkDate.setUTCDate(checkDate.getUTCDate() - 1);
  for (const d of sorted) {
    const dateStr = checkDate.toISOString().slice(0, 10);
    if (d === dateStr) {
      streak++;
      checkDate.setUTCDate(checkDate.getUTCDate() - 1);
    } else if (d < dateStr) break;
  }
  return streak;
}

async function callSendPush(memberEmails, type, title, body, data = {}) {
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
    console.warn('[streak-reminder] send-push failed:', res.status, await res.text());
    return null;
  }
  return await res.json();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const today = new Date().toISOString().slice(0, 10);
    const members = await (await db('members?select=email,first_name')).json();

    // Find which members are active today (any of 4 activity tables)
    const tables = ['daily_habits', 'workouts', 'cardio', 'session_views'];
    const activeToday = new Set();
    await Promise.all(tables.map(async (t) => {
      (await (await db(`${t}?activity_date=eq.${today}&select=member_email`)).json())
        .forEach((r) => activeToday.add(r.member_email));
    }));

    let candidates = 0, eligible = 0, pushed = 0, deduped = 0, gated = 0, web_sent = 0, native_sent = 0;
    const failures = [];
    const gatedReasons = {};

    for (const member of members) {
      candidates++;
      if (activeToday.has(member.email)) continue;
      const streak = calculateStreak(await getActivityDates(member.email), today);
      if (streak < 7) continue;
      eligible++;

      // ── send-gate: consent / calm-mode / quiet-hours / frequency budget ──
      const gate = await commsGate(member.email, 'push', 'streak', 'STK-SAVE');
      if (!gate.allow) {
        gated++;
        gatedReasons[gate.reason] = (gatedReasons[gate.reason] || 0) + 1;
        continue;
      }

      const firstName = member.first_name || 'there';
      const streakMsg = streak >= 30
        ? `You're on a ${streak}-day streak — one of the best on VYVE.`
        : streak >= 14
          ? `${streak} days and still going — don't let it stop now.`
          : `${streak} days in a row — keep it going.`;
      const title = `Your ${streak}-day streak is at risk`;
      const body = `${firstName}, ${streakMsg} Log anything today to protect it.`;

      const result = await callSendPush(
        [member.email],
        'streak_reminder',
        title,
        body,
        { url: '/index.html' }
      );
      if (!result) { failures.push(member.email); continue; }
      if (result.deduped > 0) deduped++;
      else {
        pushed++;
        web_sent += result.web_sent || 0;
        native_sent += result.native_sent || 0;
        await commsLogSend(member.email, 'push', 'streak', 'STK-SAVE', 'warm', { streak });
      }
    }

    console.log(`[streak-reminder v14] ${today}: candidates=${candidates} eligible=${eligible} pushed=${pushed} deduped=${deduped} gated=${gated} reasons=${JSON.stringify(gatedReasons)} web=${web_sent} native=${native_sent} failures=${failures.length}`);

    return new Response(JSON.stringify({
      success: true,
      date: today,
      candidates,
      eligible,
      pushed,
      deduped,
      gated,
      gatedReasons,
      web_sent,
      native_sent,
      failures
    }), {
      headers: { ...CORS, 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('[streak-reminder v14] error:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' }
    });
  }
});
