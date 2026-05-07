// VYVE Health — achievement-earned-push v2
// v1 + deep-link route (29 April 2026 PM): each earn now generates a per-tier
// deep-link route ('/engagement.html#achievements&slug=X&tier=Y') so the SW
// notificationclick lands directly on the modal for the earned tier.
// Also passes route through to send-push v13 which writes it into
// member_notifications.route, keeping web/native push + in-app row in lockstep.
//
// Auth: dual-auth (sb_secret_* OR LEGACY_SERVICE_ROLE_JWT) per §23 rule.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const LEGACY_SERVICE_ROLE_JWT = Deno.env.get('LEGACY_SERVICE_ROLE_JWT') ?? '';
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};
function buildAchievementRoute(slug, tierIndex) {
  return `/engagement.html#achievements&slug=${encodeURIComponent(slug)}&tier=${tierIndex}`;
}
async function sendPushOne(email, earn) {
  const type = `achievement_earned_${earn.metric_slug}_${earn.tier_index}`;
  const title = String(earn.title || '').trim() || 'Achievement unlocked';
  const body = String(earn.body || '').trim() || `You earned ${title}.`;
  const route = buildAchievementRoute(earn.metric_slug, earn.tier_index);
  const data = {
    url: route,
    metric_slug: earn.metric_slug,
    tier_index: earn.tier_index
  };
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/send-push`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LEGACY_SERVICE_ROLE_JWT}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        member_emails: [
          email
        ],
        type,
        title,
        body,
        data,
        dedupe_same_day: false,
        skip_inapp: true
      })
    });
    if (!res.ok) {
      const txt = await res.text();
      return {
        ok: false,
        status: res.status,
        error: txt
      };
    }
    const j = await res.json();
    return {
      ok: true,
      send_push: j
    };
  } catch (e) {
    return {
      ok: false,
      status: 0,
      error: String(e)
    };
  }
}
serve(async (req)=>{
  if (req.method === 'OPTIONS') return new Response('ok', {
    headers: CORS
  });
  const authHeader = req.headers.get('Authorization') ?? '';
  const matchesNew = SUPABASE_KEY && authHeader === `Bearer ${SUPABASE_KEY}`;
  const matchesLegacy = LEGACY_SERVICE_ROLE_JWT && authHeader === `Bearer ${LEGACY_SERVICE_ROLE_JWT}`;
  if (!matchesNew && !matchesLegacy) {
    return new Response(JSON.stringify({
      error: 'service role required'
    }), {
      status: 403,
      headers: {
        ...CORS,
        'Content-Type': 'application/json'
      }
    });
  }
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
  let input;
  try {
    input = await req.json();
  } catch  {
    return new Response(JSON.stringify({
      error: 'invalid json'
    }), {
      status: 400,
      headers: {
        ...CORS,
        'Content-Type': 'application/json'
      }
    });
  }
  const memberEmail = String(input?.member_email || '').toLowerCase().trim();
  const earns = Array.isArray(input?.earns) ? input.earns : [];
  if (!memberEmail) {
    return new Response(JSON.stringify({
      error: 'member_email required'
    }), {
      status: 400,
      headers: {
        ...CORS,
        'Content-Type': 'application/json'
      }
    });
  }
  if (earns.length === 0) {
    return new Response(JSON.stringify({
      ok: true,
      processed: 0,
      sent: 0,
      failed: 0,
      details: []
    }), {
      headers: {
        ...CORS,
        'Content-Type': 'application/json'
      }
    });
  }
  const details = [];
  let sent = 0, failed = 0;
  for (const raw of earns){
    const e = {
      metric_slug: String(raw?.metric_slug || ''),
      tier_index: Number(raw?.tier_index ?? 0),
      title: String(raw?.title || ''),
      body: raw?.body ?? null
    };
    if (!e.metric_slug || !e.tier_index || !e.title) {
      details.push({
        metric_slug: e.metric_slug,
        tier_index: e.tier_index,
        ok: false,
        error: 'invalid earn (missing metric_slug, tier_index, or title)'
      });
      failed++;
      continue;
    }
    const r = await sendPushOne(memberEmail, e);
    if (r.ok) sent++;
    else failed++;
    details.push({
      metric_slug: e.metric_slug,
      tier_index: e.tier_index,
      ok: r.ok,
      ...r
    });
  }
  return new Response(JSON.stringify({
    ok: true,
    processed: earns.length,
    sent,
    failed,
    details
  }), {
    headers: {
      ...CORS,
      'Content-Type': 'application/json'
    }
  });
});
