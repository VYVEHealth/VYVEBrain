import "jsr:@supabase/functions-js/edge-runtime.d.ts";
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const ANTHROPIC_KEY = Deno.env.get('ANTHROPIC_API_KEY') ?? '';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
async function getStats() {
  const headers = {
    'apikey': SUPABASE_SERVICE_KEY,
    'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'count=exact'
  };
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  // ISO week start (Monday)
  const d = new Date(today);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  const weekStart = d.toISOString().split('T')[0];
  const [membersRes, habitsRes, sessionsRes, checkinsRes] = await Promise.all([
    fetch(`${SUPABASE_URL}/rest/v1/members?select=id`, {
      headers
    }),
    fetch(`${SUPABASE_URL}/rest/v1/daily_habits?select=id&created_at=gte.${todayStr}T00:00:00`, {
      headers
    }),
    fetch(`${SUPABASE_URL}/rest/v1/session_views?select=id&created_at=gte.${todayStr}T00:00:00`, {
      headers
    }),
    fetch(`${SUPABASE_URL}/rest/v1/kahunas_checkins?select=id&week_start=gte.${weekStart}`, {
      headers
    })
  ]);
  const [members, habits, sessions, checkins] = await Promise.all([
    membersRes.json(),
    habitsRes.json(),
    sessionsRes.json(),
    checkinsRes.json()
  ]);
  return {
    members: Array.isArray(members) ? members.length : 0,
    habitsToday: Array.isArray(habits) ? habits.length : 0,
    sessionsToday: Array.isArray(sessions) ? sessions.length : 0,
    checkinsWeek: Array.isArray(checkins) ? checkins.length : 0
  };
}
async function generateBrief(stats) {
  const context = `
VYVE Health is a UK CIC workforce wellbeing platform. Pre-revenue, ${stats.members} members.
Today's date: ${new Date().toDateString()}.

LIVE STATS TODAY:
- Total members: ${stats.members}
- Habits logged today: ${stats.habitsToday}
- Sessions viewed today: ${stats.sessionsToday}
- Check-ins this week: ${stats.checkinsWeek}

BUILD QUEUE STATUS:
- IN PROGRESS: Weekly Check-in Page (enterprise contract blocker)
- NEXT: habits.html (Kahunas replacement item 1 — needs habit_themes, habit_library tables)
- QUEUED: workouts.html, nutrition.html, persona context modifiers, PostHog wiring
- BLOCKED (needs Lewis): Today's Progress Strip (copy approval), Weekly Progress Email (copy template), AI Weekly Goals (copy + check-in must be done first)

LEWIS ACTION QUEUE:
- CRITICAL: Facebook Make connection refresh (expires 22 May 2026)
- HIGH: Brevo logo removal (~$12/month, required before any enterprise demo)
- HIGH: Re-engagement email copy (3 templates, blocking Dean's automation)
- MEDIUM: B2B volume discount tier definition (enterprise contract blocker)
- MEDIUM: Today's Progress strip copy approval

ENTERPRISE BLOCKERS (all unresolved — must clear before approaching Sage):
1. Weekly check-in page (Dean — in progress)
2. Brevo logo removal (Lewis)
3. Facebook Make connection refresh (Lewis)
4. B2B volume discount tiers (Lewis + Dean decision)
5. Make social publisher fix Scenario 4950386 (Lewis deferred)

OPEN DECISIONS: B2B volume discount tiers, annual pricing %, podcast rebrand timing, HAVEN go-live, Google Workspace migration timing.
  `;
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: `You are the AI operations advisor for VYVE Health. Given the current project state below, write a sharp 3-sentence daily ops brief for Dean Brown (technical co-founder). Sentence 1: the single most important thing Dean must do today and why. Sentence 2: the biggest risk if nothing moves this week. Sentence 3: one specific thing Lewis needs to action independently today. Be direct, no preamble, no sign-off.\n\n${context}`
        }
      ]
    })
  });
  const data = await res.json();
  return data.content?.[0]?.text ?? 'Unable to generate brief.';
}
Deno.serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action');
    if (action === 'stats') {
      const stats = await getStats();
      return new Response(JSON.stringify(stats), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    if (action === 'brief') {
      const stats = await getStats();
      const brief = await generateBrief(stats);
      return new Response(JSON.stringify({
        brief,
        stats
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    return new Response(JSON.stringify({
      error: 'Unknown action. Use ?action=stats or ?action=brief'
    }), {
      status: 400,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({
      error: String(err)
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
