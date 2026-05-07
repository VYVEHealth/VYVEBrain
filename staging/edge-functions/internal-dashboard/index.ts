import { createClient } from 'jsr:@supabase/supabase-js@2';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type, x-dashboard-token',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};
const DASHBOARD_TOKEN = Deno.env.get('DASHBOARD_TOKEN') ?? 'vyve2026';
Deno.serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  // Simple token auth — token passed in header from dashboard JS
  const token = req.headers.get('x-dashboard-token');
  if (token !== DASHBOARD_TOKEN) {
    return new Response(JSON.stringify({
      error: 'Unauthorized'
    }), {
      status: 401,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
  const supabase = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));
  const EXCLUDED = [
    'test@test.com',
    'maketest@vyvehealth.co.uk',
    'team@vyvehealth.co.uk'
  ];
  try {
    const [members, habits, workouts, cardio, sessions, checkins, weekly, emails, certs] = await Promise.all([
      supabase.from('members').select('*').not('email', 'in', `(${EXCLUDED.map((e)=>`"${e}"`).join(',')})`),
      supabase.from('daily_habits').select('member_email,activity_date').limit(50000),
      supabase.from('workouts').select('member_email,activity_date').limit(50000),
      supabase.from('cardio').select('member_email,activity_date').limit(50000),
      supabase.from('session_views').select('member_email,activity_date').limit(50000),
      supabase.from('wellbeing_checkins').select('member_email,activity_date').limit(50000),
      supabase.from('weekly_scores').select('*').limit(10000),
      supabase.from('engagement_emails').select('member_email,stream,sent_at').limit(50000),
      supabase.from('certificates').select('*').limit(10000)
    ]);
    // Surface any errors
    for (const [label, result] of Object.entries({
      members,
      habits,
      workouts,
      cardio,
      sessions,
      checkins,
      weekly,
      emails,
      certs
    })){
      if (result.error) throw new Error(`${label}: ${result.error.message}`);
    }
    return new Response(JSON.stringify({
      members: members.data,
      habits: habits.data,
      workouts: workouts.data,
      cardio: cardio.data,
      sessions: sessions.data,
      checkins: checkins.data,
      weekly: weekly.data,
      emails: emails.data,
      certs: certs.data
    }), {
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
