// onboarding v94 - PM-524: fix selectHabits UUID prompt (was returning integers). Carries v93 + v92 + v91. writeWorkoutPlan deactivate-old now scoped by surface (preserves co-active workouts + movement plans). Carries v86 (wpc deactivate-old+insert-new) + v85 (surface pillar stamping) + v84 (flat-progression workouts + deterministic movement plan) + v83 (crisis-scan).
// Single-file build (inlined emails.ts + workouts.ts) to deploy in one tool call.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
const ANTHROPIC_KEY = Deno.env.get('ANTHROPIC_API_KEY') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const MAKE_WEBHOOK = Deno.env.get('MAKE_ONBOARDING_WEBHOOK') || '';
const BREVO_KEY = Deno.env.get('BREVO_API_KEY') ?? '';
const CORS = {
  'Access-Control-Allow-Origin': 'https://www.vyvehealth.co.uk',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};
const WORKOUT_SENSITIVE_CONTEXT = [
  'Bereavement',
  'Major life change',
  'Recovering from illness or injury',
  'Struggling with mental health'
];
const SENSITIVE_CONTEXT = WORKOUT_SENSITIVE_CONTEXT;
const SPLITS = {
  PPL: 'Push / Pull / Legs',
  Upper_Lower: 'Upper / Lower',
  Full_Body: 'Full Body',
  Home: 'Home',
  Movement_Wellbeing: 'Movement & Wellbeing'
};
function selectPlanType(d) {
  const loc = String(d.trainingLocation || '').trim().toLowerCase(), days = parseInt(String(d.trainDays)) || 3, exp = String(d.gymExperience || 'Beginner').toLowerCase();
  const goals = (d.trainingGoals || []).map((g)=>g.toLowerCase()).join(' '), lc = d.lifeContext || [], sens = lc.some((c)=>WORKOUT_SENSITIVE_CONTEXT.includes(c));
  if (loc === 'home') return {
    planType: 'Home',
    planReason: 'Home only.'
  };
  if (sens && exp === 'beginner') return {
    planType: 'Movement_Wellbeing',
    planReason: 'Sensitive+Beginner.'
  };
  if (goals.includes('mobility') || goals.includes('flexibility') || goals.includes('mental')) return {
    planType: 'Movement_Wellbeing',
    planReason: 'Mobility/flexibility goals.'
  };
  if (days <= 2) return {
    planType: 'Full_Body',
    planReason: days + 'd/wk.'
  };
  if (days === 3) return exp === 'advanced' ? {
    planType: 'PPL',
    planReason: '3d+Adv.'
  } : {
    planType: 'Full_Body',
    planReason: '3d+' + exp + '.'
  };
  if (days === 4) return exp === 'advanced' ? {
    planType: 'PPL',
    planReason: '4d+Adv.'
  } : {
    planType: 'Upper_Lower',
    planReason: '4d+' + exp + '.'
  };
  return {
    planType: 'PPL',
    planReason: days + 'd.'
  };
}
function slotsBySessionLength(sessionLengthRaw) {
  const v = String(sessionLengthRaw || '').toLowerCase().trim();
  if (v.includes('20')) return 2;
  if (v.includes('30')) return 4;
  if (v.includes('60')) return 8;
  return 6;
}
function buildFlatProgressionPrompt(d, planType, exerciseLibrary) {
  const split = SPLITS[planType] || planType;
  const days = parseInt(String(d.trainDays)) || 3;
  const slots = slotsBySessionLength(d.sessionLength);
  const exp = String(d.gymExperience || 'Beginner');
  const goals = (d.trainingGoals || []).join(', ') || 'general fitness';
  const injuries = (d.injuries || []).join(', ') || 'none';
  const avoid = String(d.avoidExercises || 'none');
  const loc = String(d.trainingLocation || 'gym');
  const equipment = (d.equipment || []).join(', ') || 'standard gym';
  const priority = String(d.priorityMuscle || '').trim();
  const s = d.scores || {};
  const exNames = exerciseLibrary.slice(0, 120).map((e)=>String(e.exercise_name || '')).filter(Boolean);
  const exList = exNames.join(', ');
  return `You are building an 8-week workout programme for a VYVE Health member, using a FLAT-PROGRESSION contract.

PROGRAMME SHAPE (critical):
- 8 weeks total. The same WORKING WEEK template repeats 6 times; a DELOAD WEEK template repeats twice.
- Schedule is hard-coded: Weeks 1, 2, 3, 5, 6, 7 = WORKING. Weeks 4 and 8 = DELOAD.
- You generate ONE working-week template AND ONE deload-week template. The code expands them.
- Primary compounds MUST be IDENTICAL across working and deload weeks. Only sets/reps change.

WORKING WEEK RULES:
- 3 sets per exercise (4 for primary compounds if intermediate/advanced)
- Rep range 8-12 for compounds, 10-15 for accessories
- Rest 90s primary, 60s accessories

DELOAD WEEK RULES:
- 2 sets per exercise (3 max)
- Rep range 12-15 (lighter weight implied)
- Rest 60 seconds
- Notes mention "deload \u2014 drop weight 30-40%, focus on form"

SESSION STRUCTURE:
- Split: ${split}
- Sessions per week: ${days}
- Exercises per session: ${slots}
- Order: primary compounds first, accessories after, isolation last

MEMBER PROFILE:
- Experience: ${exp}
- Location: ${loc}
- Equipment: ${equipment}
- Goals: ${goals}
- Injuries/limitations: ${injuries}
- Exercises to avoid: ${avoid}
${priority ? `- Priority muscle: ${priority} (bias selection within existing slots, do NOT add extra)` : ''}
- Wellbeing ${s.wellbeing || '5'}/10, Energy ${s.energy || '5'}/10

CRITICAL \u2014 use exercise names from this VYVE library exactly:
${exList}

NEVER include exercises from injuries/avoid list. NEVER invent exercise names not in the library.

PROGRAMME NAMING: Short motivating name based on split + goals (NOT location). Example: "8-Week Push/Pull/Legs Strength".

Respond ONLY with valid JSON. No preamble. No markdown. Schema:
{
  "programme_name": "string",
  "rationale": "2-3 sentence motivating rationale addressed to the member",
  "working_week": { "sessions": [ { "session_name": "Push A", "session_label": "Session 1", "exercises": [ { "exercise_name": "Bench Press", "sets": "3", "reps": "8-12", "rest_seconds": 90, "notes": "Control the descent" } ] } ] },
  "deload_week": { "sessions": [ { "session_name": "Push A \u2014 Deload", "session_label": "Session 1", "exercises": [ { "exercise_name": "Bench Press", "sets": "2", "reps": "12-15", "rest_seconds": 60, "notes": "Deload \u2014 drop weight 30-40%, focus on form" } ] } ] }
}`;
}
function parseFlatProgressionResponse(text) {
  const clean = text.replace(/```json|```/g, '').trim();
  try {
    const o = JSON.parse(clean);
    if (!o.programme_name || !o.working_week?.sessions || !o.deload_week?.sessions) return null;
    return o;
  } catch (e) {
    console.error('parseFlatProgressionResponse: JSON parse failed', e);
    return null;
  }
}
function enrichSessionsWithVideos(sessions, exerciseLibrary) {
  const libMap = {};
  for (const ex of exerciseLibrary){
    const name = String(ex.exercise_name || '').toLowerCase().trim();
    if (name) libMap[name] = {
      video_url: String(ex.video_url || ''),
      thumbnail_url: String(ex.thumbnail_url || '')
    };
  }
  let matched = 0, unmatched = 0;
  const out = sessions.map((s)=>({
      ...s,
      exercises: s.exercises.map((ex)=>{
        const key = ex.exercise_name.toLowerCase().trim();
        const urls = libMap[key];
        if (urls?.video_url) {
          matched++;
          return {
            ...ex,
            ...urls
          };
        }
        unmatched++;
        return ex;
      })
    }));
  return {
    sessions: out,
    matched,
    unmatched
  };
}
function expandToEightWeeks(working, deload) {
  const weeks = [];
  const schedule = [
    'W',
    'W',
    'W',
    'D',
    'W',
    'W',
    'W',
    'D'
  ];
  for (const slot of schedule){
    const template = slot === 'W' ? working : deload;
    weeks.push(JSON.parse(JSON.stringify(template)));
  }
  return weeks;
}
async function callAnthropicFlatProgression(prompt) {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 6000,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error('Anthropic flat-progression ' + r.status + ': ' + t.slice(0, 200));
  }
  const j = await r.json();
  return {
    text: j.content?.[0]?.text || '',
    stopReason: j.stop_reason || 'unknown'
  };
}
async function generateWorkoutPlanFlat(d, exerciseLibrary) {
  const { planType } = selectPlanType(d);
  const prompt = buildFlatProgressionPrompt(d, planType, exerciseLibrary);
  const result = await callAnthropicFlatProgression(prompt);
  if (result.stopReason === 'max_tokens') console.warn('Flat-progression generator hit max_tokens');
  const parsed = parseFlatProgressionResponse(result.text);
  if (!parsed) throw new Error('Failed to parse flat-progression response. Stop reason: ' + result.stopReason);
  const workingEnriched = enrichSessionsWithVideos(parsed.working_week.sessions, exerciseLibrary);
  const deloadEnriched = enrichSessionsWithVideos(parsed.deload_week.sessions, exerciseLibrary);
  const totalMatched = workingEnriched.matched + deloadEnriched.matched;
  const totalUnmatched = workingEnriched.unmatched + deloadEnriched.unmatched;
  const plan = expandToEightWeeks(workingEnriched.sessions, deloadEnriched.sessions);
  console.log(`Flat workout plan: ${plan.length} weeks (6 working + 2 deload), ${totalMatched}/${totalMatched + totalUnmatched} videos matched`);
  return {
    plan,
    programme_name: parsed.programme_name,
    programme_rationale: parsed.rationale,
    plan_type: planType,
    split_type: SPLITS[planType] || planType,
    videos_matched: totalMatched,
    videos_unmatched: totalUnmatched,
    shape: 'flat_8wk_w6d2'
  };
}
function profileMovementMember(d) {
  const lc = d.lifeContext || [];
  const sens = lc.some((c)=>WORKOUT_SENSITIVE_CONTEXT.includes(c));
  const exp = String(d.gymExperience || '').toLowerCase();
  const goals = (d.trainingGoals || []).map((g)=>g.toLowerCase());
  const startingGently = goals.some((g)=>g.includes('starting gently')) || goals.some((g)=>g.includes('starting gentle'));
  const movingMore = goals.some((g)=>g.includes('moving more'));
  const days = parseInt(String(d.movementFrequency || d.trainDays)) || 3;
  const movementDuration = String(d.movementDuration || '').toLowerCase();
  let startMin = 15, endMin = 30;
  if (movementDuration.includes('5') || movementDuration.includes('10')) {
    startMin = 10;
    endMin = 20;
  } else if (movementDuration.includes('45') || movementDuration.includes('60')) {
    startMin = 25;
    endMin = 45;
  }
  if (sens || exp === 'beginner' || startingGently) {
    return {
      level: 'gentle',
      startDurationMin: Math.min(startMin, 10),
      endDurationMin: Math.min(endMin, 20),
      walksPerWeek: Math.max(3, Math.min(days, 4)),
      includeMobility: false
    };
  }
  if (days >= 4 || movingMore) {
    return {
      level: 'active',
      startDurationMin: startMin,
      endDurationMin: endMin + 10,
      walksPerWeek: Math.min(days, 5),
      includeMobility: days >= 4
    };
  }
  return {
    level: 'default',
    startDurationMin: startMin,
    endDurationMin: endMin,
    walksPerWeek: Math.max(3, Math.min(days, 4)),
    includeMobility: false
  };
}
function durationForMovementWeek(weekNum, profile) {
  const t = (weekNum - 1) / 7;
  return Math.round(profile.startDurationMin + (profile.endDurationMin - profile.startDurationMin) * t);
}
function buildMovementWeek(weekNum, profile) {
  const sessions = [];
  const duration = durationForMovementWeek(weekNum, profile);
  const sessionsCount = profile.walksPerWeek;
  for(let i = 0; i < sessionsCount; i++){
    const isMobility = profile.includeMobility && i === sessionsCount - 1;
    if (isMobility) {
      sessions.push({
        session_name: 'Mobility & Stretch',
        session_label: `Session ${i + 1}`,
        exercises: [
          {
            exercise_name: 'Full-body mobility flow',
            sets: '1',
            reps: '15 min',
            rest_seconds: 0,
            notes: 'Gentle stretches and joint mobility. Move slowly, breathe through each position.'
          }
        ]
      });
    } else {
      sessions.push({
        session_name: `Walk \u2014 ${duration} min`,
        session_label: `Session ${i + 1}`,
        exercises: [
          {
            exercise_name: `${duration}-minute walk`,
            sets: '1',
            reps: `${duration} min`,
            rest_seconds: 0,
            notes: weekNum === 1 && i === 0 ? 'Start where you are. A comfortable pace is the right pace.' : profile.level === 'gentle' ? 'Easy pace. If you can hold a conversation, you are doing it right.' : 'Brisk pace. You should be able to talk but not sing.'
          }
        ]
      });
    }
  }
  return sessions;
}
function generateMovementPlan(d) {
  const profile = profileMovementMember(d);
  const weeks = [];
  for(let w = 1; w <= 8; w++)weeks.push(buildMovementWeek(w, profile));
  const startMin = profile.startDurationMin;
  const endMin = profile.endDurationMin;
  const programme_name = profile.level === 'gentle' ? 'Your Gentle Movement Journey' : profile.level === 'active' ? 'Your Daily Movement Plan' : 'Your Movement Programme';
  const rationale = profile.level === 'gentle' ? `Walks first. ${profile.walksPerWeek} times a week, starting at ${startMin} minutes and building to ${endMin} minutes by week 8. No pressure, no equipment \u2014 just consistency.` : profile.includeMobility ? `${profile.walksPerWeek - 1} walks a week (${startMin}-${endMin} min) plus a weekly mobility session. Builds the habit of moving daily without overwhelming your schedule.` : `${profile.walksPerWeek} walks a week, scaling from ${startMin} to ${endMin} minutes over 8 weeks. Simple, repeatable, and exactly what your body needs.`;
  return {
    plan: weeks,
    programme_name,
    programme_rationale: rationale,
    plan_type: 'Movement',
    split_type: 'Movement',
    shape: 'movement_walks_8wk'
  };
}
async function writeWorkoutPlan(email, plan, programmeName, planType, opts) {
  const em = email.toLowerCase().trim();
  const surface = opts?.surface || (planType === 'Movement' ? 'movement' : 'workouts');
  const payload = {
    member_email: em,
    programme_json: {
      weeks: plan,
      programme_name: programmeName,
      plan_type: planType,
      split_type: opts?.split_type || planType,
      programme_rationale: opts?.rationale || '',
      shape: opts?.shape || 'flat_8wk_w6d2',
      surface,
      generated_at: new Date().toISOString()
    },
    plan_duration_weeks: 8,
    current_week: 1,
    current_session: 1,
    is_active: true,
    source: 'onboarding',
    generated_at: new Date().toISOString()
  };
  // PM-420 step 4b: deactivate-old SCOPED BY SURFACE so a workouts re-onboarding
  // does not deactivate an active movement plan (and vice versa).
  const em_enc = encodeURIComponent(em);
  const surface_enc = encodeURIComponent(surface);
  const deactivate = await fetch(SUPABASE_URL + '/rest/v1/workout_plan_cache?member_email=eq.' + em_enc + '&is_active=eq.true&programme_json->>surface=eq.' + surface_enc, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': 'Bearer ' + SUPABASE_KEY,
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({
      is_active: false
    })
  });
  if (!deactivate.ok) {
    const t = await deactivate.text();
    throw new Error('writeWorkoutPlan deactivate-old: ' + t);
  }
  const r = await fetch(SUPABASE_URL + '/rest/v1/workout_plan_cache', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': 'Bearer ' + SUPABASE_KEY,
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify(payload)
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error('writeWorkoutPlan insert-new: ' + t);
  }
  console.log('Plan written for', em, '-', plan.length, 'weeks, shape:', payload.programme_json.shape, 'surface:', surface);
}
async function sendErrorAlert(fn, phase, mem, err) {
  if (!BREVO_KEY) return;
  const ts = new Date().toISOString();
  const se = err.replace(/</g, '&lt;').replace(/>/g, '&gt;').slice(0, 2000);
  const html = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#FFF5F5;font-family:Arial,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#FFF5F5;padding:30px 16px;"><tr><td align="center"><table width="540" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:10px;"><tr><td style="background:#8B0000;padding:18px 28px;"><span style="font-family:Georgia,serif;font-size:16px;letter-spacing:4px;color:#fff;">VYVE - ERROR ALERT</span></td></tr><tr><td style="padding:24px 28px;"><h2 style="margin:0 0 14px;font-size:18px;color:#8B0000;">Edge Function Failed</h2><table width="100%" cellpadding="6" cellspacing="0" style="font-size:13px;color:#333;"><tr><td style="font-weight:700;width:110px;">Function</td><td>${fn}</td></tr><tr><td style="font-weight:700;">Phase</td><td>${phase}</td></tr><tr><td style="font-weight:700;">Member</td><td>${mem}</td></tr><tr><td style="font-weight:700;">Time</td><td>${ts}</td></tr><tr><td style="font-weight:700;vertical-align:top;">Error</td><td style="color:#8B0000;font-family:monospace;font-size:12px;word-break:break-all;">${se}</td></tr></table></td></tr></table></td></tr></table></body></html>`;
  try {
    await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': BREVO_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        sender: {
          name: 'VYVE Alerts',
          email: 'team@vyvehealth.co.uk'
        },
        to: [
          {
            email: 'team@vyvehealth.co.uk',
            name: 'VYVE Team'
          }
        ],
        subject: '\u{1F6A8} ONBOARDING FAILED \u2014 ' + mem + ' \u2014 ' + phase,
        htmlContent: html,
        tags: [
          'error-alert',
          'onboarding'
        ]
      })
    });
  } catch (_) {}
}
async function sendAnswersBackup(data) {
  if (!BREVO_KEY || !data) return;
  const ts = new Date().toISOString();
  const email = String(data.email || 'unknown');
  const name = String(data.firstName || '') + ' ' + String(data.lastName || '');
  const html = `<!DOCTYPE html><html><body><h2>VYVE Answers Backup</h2><p>Onboarding failed for ${name.trim()} (${email}) at ${ts}.</p><pre>${JSON.stringify(data, null, 2).replace(/</g, '&lt;').replace(/>/g, '&gt;').slice(0, 8000)}</pre></body></html>`;
  try {
    await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': BREVO_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        sender: {
          name: 'VYVE Answers Backup',
          email: 'team@vyvehealth.co.uk'
        },
        to: [
          {
            email: 'team@vyvehealth.co.uk',
            name: 'VYVE Team'
          }
        ],
        subject: '\u{1F4CB} ANSWERS BACKUP \u2014 ' + name.trim() + ' (' + email + ') \u2014 ' + ts.slice(0, 10),
        htmlContent: html,
        tags: [
          'answers-backup',
          'onboarding'
        ]
      })
    });
    console.log('Answers backup sent for', email);
  } catch (e) {
    console.error('Answers backup failed:', e);
  }
}
async function sendManualOnboardAlert(data, phase, err) {
  if (!BREVO_KEY || !data) return;
  const name = `${String(data.firstName || '')} ${String(data.lastName || '')}`.trim();
  const email = String(data.email || 'unknown');
  const ts = new Date().toISOString();
  const se = String(err).replace(/</g, '&lt;').replace(/>/g, '&gt;').slice(0, 1000);
  const html = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#FFF8F0;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#FFF8F0;padding:30px 16px;">
<tr><td align="center"><table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:10px;overflow:hidden;">
<tr><td style="background:#C9A84C;padding:18px 28px;"><span style="font-family:Georgia,serif;font-size:16px;letter-spacing:4px;color:#fff;">VYVE &#8212; ACTION REQUIRED</span></td></tr>
<tr><td style="padding:28px;">
<h2 style="margin:0 0 6px;font-size:20px;color:#0D2B2B;">Manual onboard needed</h2>
<p style="margin:0 0 20px;font-size:14px;color:#3A5A5A;">A member completed the onboarding questionnaire but their account could not be created automatically. Their answers are saved below &#8212; please onboard them manually.</p>
<table width="100%" cellpadding="8" cellspacing="0" style="font-size:14px;color:#333;border-collapse:collapse;">
<tr><td style="font-weight:700;width:120px;border-bottom:1px solid #eee;">Name</td><td style="border-bottom:1px solid #eee;">${name}</td></tr>
<tr><td style="font-weight:700;border-bottom:1px solid #eee;">Email</td><td style="border-bottom:1px solid #eee;">${email}</td></tr>
<tr><td style="font-weight:700;border-bottom:1px solid #eee;">Time</td><td style="border-bottom:1px solid #eee;">${ts}</td></tr>
<tr><td style="font-weight:700;border-bottom:1px solid #eee;">Failed at</td><td style="border-bottom:1px solid #eee;color:#8B4513;">${phase}</td></tr>
<tr><td style="font-weight:700;vertical-align:top;padding-top:10px;">Error</td><td style="font-family:monospace;font-size:12px;color:#8B0000;word-break:break-all;padding-top:10px;">${se}</td></tr>
</table>
<div style="margin-top:24px;padding:16px 20px;background:#F4FAFA;border-radius:8px;border-left:3px solid #1B7878;">
<p style="margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#1B7878;">Next steps</p>
<p style="margin:0;font-size:14px;color:#3A5A5A;line-height:1.6;">1. Reply to the member at <a href="mailto:${email}" style="color:#1B7878;">${email}</a> to confirm their plan is being set up.<br>2. Use the admin onboarding tool or re-fire the EF with their answers to complete setup.</p>
</div>
</td></tr>
</table></td></tr></table></body></html>`;
  try {
    await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': BREVO_KEY, 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        sender: { name: 'VYVE Onboarding Alert', email: 'team@vyvehealth.co.uk' },
        to: [{ email: 'team@vyvehealth.co.uk', name: 'VYVE Team' }],
        subject: `\u26A0\uFE0F MANUAL ONBOARD NEEDED \u2014 ${name} (${email})`,
        htmlContent: html,
        tags: ['manual-onboard', 'onboarding-alert']
      })
    });
    console.log('Manual onboard alert sent for', email);
  } catch (e) {
    console.error('Manual onboard alert failed:', e);
  }
}

async function sendWelcomeEmail(e, fn, persona, pr, habits, recs, on, planTypeDesc, sessionRec, pwl, stream) {
  if (!BREVO_KEY) return;
  const lu = pwl || 'https://online.vyvehealth.co.uk/login.html';
  const bl = pwl ? 'Set your password &amp; sign in' : 'Sign in to VYVE';

  const streamIntro = stream === 'workouts'
    ? 'You are in. Habits loaded, 8-week programme ready.'
    : stream === 'movement'
    ? 'You are in. Habits loaded, your 8-week Movement plan is ready.'
    : 'You are in. Habits loaded, your Cardio hub is ready \u2014 generate your running plan when you want to start.';

  // Build habit rows HTML
  const habitRowsHtml = (habits || []).map((h) => {
    const label = h.habit_pot ? h.habit_pot.charAt(0).toUpperCase() + h.habit_pot.slice(1) : '';
    return `<div style="display:flex;align-items:flex-start;margin-bottom:14px;">
      <div style="flex-shrink:0;width:6px;height:6px;border-radius:50%;background:#4DAAAA;margin-top:6px;margin-right:12px;"></div>
      <div>
        <p style="margin:0;font-size:14px;font-weight:600;color:#0D2B2B;">${h.habit_title}</p>
        ${label ? `<p style="margin:2px 0 0;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#4DAAAA;">${label}</p>` : ''}
        <p style="margin:4px 0 0;font-size:13px;color:#3A5A5A;line-height:1.55;">${h.habit_description || ''}</p>
      </div>
    </div>`;
  }).join('');

  // Build first week recs HTML
  const recsHtml = (recs || []).filter(Boolean).map((rec) => {
    return `<div style="display:flex;align-items:flex-start;margin-bottom:14px;">
      <div style="flex-shrink:0;width:6px;height:6px;border-radius:50%;background:#1B7878;margin-top:7px;margin-right:12px;"></div>
      <p style="margin:0;font-size:14px;color:#3A5A5A;line-height:1.65;">${rec}</p>
    </div>`;
  }).join('');

  // Session rec HTML
  const sessionHtml = sessionRec
    ? `<div style="background:#F0F9F9;border-radius:8px;padding:16px 20px;margin-bottom:24px;border-left:3px solid #1B7878;">
        <p style="margin:0 0 2px;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#1B7878;">Recommended live session</p>
        <p style="margin:0;font-size:15px;font-weight:600;color:#0D2B2B;">${sessionRec.name}</p>
        <p style="margin:4px 0 0;font-size:13px;color:#3A5A5A;">${sessionRec.schedule_day}s at ${sessionRec.schedule_time} &middot; ${sessionRec.duration_minutes} min</p>
        <p style="margin:6px 0 0;font-size:13px;color:#3A5A5A;line-height:1.55;">${sessionRec.description || ''}</p>
      </div>`
    : '';

  // App tip (stream-aware)
  const appTip = stream === 'workouts'
    ? 'Start with the Workouts tab \u2014 your full 8-week programme is waiting. Log each session as you go and your progress tracks automatically.'
    : stream === 'movement'
    ? 'Open the Movement tab to find your plan. Log each session and your streaks build in the background.'
    : 'Head to the Running Plan tab to generate your personalised programme. Set your goal, your level, and your timeline \u2014 it takes 30 seconds.';

  const pwa = `<tr><td style="padding:0 32px 28px;"><p style="margin:0 0 12px;font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#1B7878;">Get the VYVE Health app</p><p style="margin:0 0 16px;font-size:14px;color:#3A5A5A;line-height:1.65;">Download from the App Store or Google Play, then sign in with your VYVE email.</p><table width="100%" cellpadding="0" cellspacing="0"><tr><td width="48%" style="vertical-align:middle;text-align:center;background:#0D2B2B;border-radius:8px;"><a href="https://apps.apple.com/gb/app/vyve-health/id6762100652" style="display:block;padding:14px 16px;color:#fff;text-decoration:none;font-size:14px;font-weight:600;">Download for iPhone &rarr;</a></td><td width="4%"></td><td width="48%" style="vertical-align:middle;text-align:center;background:#0D2B2B;border-radius:8px;"><a href="https://play.google.com/store/apps/details?id=co.uk.vyvehealth.app" style="display:block;padding:14px 16px;color:#fff;text-decoration:none;font-size:14px;font-weight:600;">Download for Android &rarr;</a></td></tr></table></td></tr>`;

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="margin:0;padding:0;background:#F4FAFA;font-family:Helvetica Neue,Arial,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#F4FAFA;padding:40px 20px;"><tr><td align="center"><table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;">
    <tr><td style="background:#0D2B2B;padding:24px 32px;"><div style="font-family:Georgia,serif;font-size:20px;letter-spacing:6px;color:#fff;">VYVE</div></td></tr>
    <tr><td style="padding:32px;">
      <h2 style="margin:0 0 8px;font-size:24px;font-family:Georgia,serif;color:#0D2B2B;font-weight:400;">Welcome to VYVE, ${fn}.</h2>
      <p style="margin:0 0 28px;font-size:15px;color:#3A5A5A;line-height:1.7;">${streamIntro}</p>

      <div style="background:#F0F9F9;border-radius:8px;padding:20px 24px;margin-bottom:28px;">
        <p style="margin:0 0 4px;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#1B7878;">Your Coach</p>
        <p style="margin:0;font-size:20px;font-weight:700;color:#0D2B2B;">${persona}</p>
        <p style="margin:8px 0 0;font-size:14px;color:#3A5A5A;line-height:1.6;">${pr}</p>
      </div>

      <div style="background:#F4FAFA;border-radius:8px;padding:16px 20px;margin-bottom:28px;border-left:3px solid #4DAAAA;">
        <p style="margin:0 0 4px;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#1B7878;">Your Programme</p>
        <p style="margin:0;font-size:15px;font-weight:600;color:#0D2B2B;">${on}</p>
        <p style="margin:8px 0 0;font-size:14px;color:#3A5A5A;line-height:1.6;">${planTypeDesc}</p>
      </div>

      <p style="margin:0 0 16px;font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#1B7878;">Your daily habits</p>
      <div style="margin-bottom:28px;">${habitRowsHtml}</div>

      <div style="margin-bottom:28px;">
        <p style="margin:0 0 14px;font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#1B7878;">Your first week</p>
        ${recsHtml}
      </div>

      ${sessionHtml}

      <div style="background:#FFFBF0;border-radius:8px;padding:16px 20px;margin-bottom:28px;border-left:3px solid #C9A84C;">
        <p style="margin:0 0 4px;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#C9A84C;">Where to start</p>
        <p style="margin:0;font-size:14px;color:#3A5A5A;line-height:1.6;">${appTip}</p>
      </div>

      <div style="text-align:center;margin:0 0 28px;">
        <a href="${lu}" style="background:#0D2B2B;color:#fff;text-decoration:none;padding:16px 36px;border-radius:8px;font-size:15px;font-weight:600;display:inline-block;">${bl} &rarr;</a>
      </div>
    </td></tr>
    ${pwa}
    <tr><td style="background:#F4FAFA;padding:20px 32px;border-top:1px solid #C8E4E4;"><p style="margin:0;font-size:12px;color:#7A9A9A;">VYVE Health CIC &middot; team@vyvehealth.co.uk &middot; ICO 00013608608</p></td></tr>
  </table></td></tr></table></body></html>`;

  await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': BREVO_KEY,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      sender: { name: 'VYVE Health', email: 'team@vyvehealth.co.uk' },
      to: [{ email: e, name: fn }],
      bcc: [{ email: 'team@vyvehealth.co.uk', name: 'VYVE Team' }],
      subject: 'Welcome to VYVE, ' + fn + ' \u2014 your programme is ready',
      htmlContent: html,
      tags: ['welcome', 'onboarding']
    })
  });
}

const PLAN_TYPE_DESCRIPTIONS = {
  Push_Pull_Legs: 'A classic compound split: Push days target chest, shoulders and triceps; Pull days hit back and biceps; Legs cover quads, hamstrings and glutes. Alternating A and B variants keep volume balanced across the 8 weeks.',
  Upper_Lower: 'Alternates upper-body and lower-body sessions across the week. Efficient for building strength and muscle with 3–4 days of training.',
  Full_Body: 'Each session trains the whole body with a mix of compound and accessory movements. Great for frequency and overall conditioning.',
  Home_Workouts: 'Bodyweight and minimal-kit sessions designed to deliver real results wherever you are — no gym required.',
  Movement_Wellbeing: 'Mobility, flexibility, and low-impact movement sessions to improve how you feel and move every day.',
  Cardio: 'Your personalised running and cardio programme, built around your goal and fitness level.'
};

function pickSessionRec(persona, stream, catalogue) {
  const sessions = (catalogue || []).filter((s) => s.type === 'live_session');
  if (!sessions.length) return null;
  // Priority map: persona -> preferred category
  const personaPref = {
    NOVA: 'Workouts',
    SPARK: 'Workouts',
    RIVER: 'Mindfulness & Mindset',
    SAGE: 'Education & Experts',
    HAVEN: 'Mindfulness & Mindset'
  };
  // Stream override: cardio members get pointed to workout session; movement gets mindfulness
  const streamPref = stream === 'cardio' ? 'Workouts' : stream === 'movement' ? 'Mindfulness & Mindset' : null;
  const preferred = streamPref || personaPref[persona] || 'Workouts';
  return sessions.find((s) => s.category === preferred) || sessions[0];
}


function resolveStream(d) {
  const raw = String(d.exerciseStream || '').toLowerCase().trim();
  if (raw === 'movement' || raw === 'cardio' || raw === 'workouts') return raw;
  return 'workouts';
}
async function resetMemberData(email) {
  const e = encodeURIComponent(email.toLowerCase().trim());
  const h = {
    'apikey': SUPABASE_KEY,
    'Authorization': 'Bearer ' + SUPABASE_KEY,
    'Prefer': 'return=minimal'
  };
  const tables = [
    'member_habits',
    'workout_plan_cache',
    'weekly_goals',
    'ai_interactions',
    'daily_habits',
    'workouts',
    'cardio',
    'exercise_logs',
    'exercise_swaps',
    'custom_workouts',
    'persona_switches',
    'certificates',
    'wellbeing_checkins',
    'monthly_checkins',
    'weekly_scores',
    'weight_logs',
    'nutrition_logs',
    'nutrition_my_foods',
    'session_views',
    'replay_views',
    'engagement_emails'
  ];
  await Promise.all(tables.map((t)=>fetch(SUPABASE_URL + '/rest/v1/' + t + '?member_email=eq.' + e, {
      method: 'DELETE',
      headers: h
    }).then(async (r)=>{
      if (!r.ok) console.error('Reset ' + t + ':', await r.text());
    }).catch((x)=>console.error('Reset ' + t + ':', x))));
  await fetch(SUPABASE_URL + '/rest/v1/ai_decisions?member_email=eq.' + e, {
    method: 'DELETE',
    headers: h
  }).catch(()=>{});
  console.log('Data reset for', email);
}
const PERSONA_PROMPTS = {
  NOVA: 'You are NOVA, a high-performance coach. Driven, data-led, precision-focused.',
  RIVER: 'You are RIVER, a mindful wellness guide. Calm, empathetic. Stress, sleep, emotional balance.',
  SPARK: 'You are SPARK, a motivational coach. Energetic, warm, challenge-driven. Consistency.',
  SAGE: 'You are SAGE, a knowledge-first mentor. Thoughtful, evidence-based.',
  HAVEN: 'You are HAVEN, a gentle wellbeing companion. Non-judgmental, trauma-informed. Signpost professional help.'
};
const PERSONA_DESCRIPTIONS = 'NOVA: high performance, calm (high stress score), strong wellbeing/energy. RIVER: struggling (low stress=actually stressed, low wellbeing/energy). SPARK: moderate-good, needs motivation. SAGE: analytical, evidence-driven. HAVEN: bereavement, mental health. STRESS: 1=very stressed, 10=very calm.';
function computeAge(dob) {
  if (!dob) return null;
  const b = new Date(dob), t = new Date();
  let a = t.getFullYear() - b.getFullYear();
  const m = t.getMonth() - b.getMonth();
  if (m < 0 || m === 0 && t.getDate() < b.getDate()) a--;
  return a > 0 && a < 120 ? a : null;
}
function isQuickPath(d) {
  return (d.trainingGoals || []).length === 0 && !String(d.trainingLocation || '').trim() && !String(d.gymExperience || '').trim();
}
function buildDecisionLog(d, persona, pt, pr, pm, prr, stream) {
  const s = d.scores || {}, lc = d.lifeContext || [];
  return {
    onboarding_version: 'v87',
    recorded_at: new Date().toISOString(),
    inputs: {
      exercise_stream: stream,
      location: d.trainingLocation,
      experience: d.gymExperience,
      train_days: d.trainDays,
      goals: d.trainingGoals,
      life_context: lc,
      sensitive_context: lc.some((c)=>SENSITIVE_CONTEXT.includes(c)),
      wellbeing: s.wellbeing,
      stress: s.stress,
      energy: s.energy,
      age_at_onboarding: computeAge(d.dob)
    },
    plan_decision: {
      plan_type: pt,
      split_type: SPLITS[pt],
      method: 'deterministic',
      reason: pr,
      generated: stream === 'workouts' || stream === 'movement'
    },
    persona_decision: {
      persona,
      method: pm,
      reason: prr
    }
  };
}
async function callAnthropic(sys, usr, mt = 1000) {
  const b = {
    model: 'claude-sonnet-4-20250514',
    max_tokens: mt,
    messages: [
      {
        role: 'user',
        content: usr
      }
    ]
  };
  if (sys) b.system = sys;
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify(b)
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error('Anthropic ' + r.status + ': ' + t.slice(0, 200));
  }
  const j = await r.json();
  return j.content?.[0]?.text ?? '';
}
async function selectPersona(d) {
  const s = d.scores || {}, lc = d.lifeContext || [], w = parseInt(s.wellbeing) || 5, st = parseInt(s.stress) || 5, en = parseInt(s.energy) || 5, tg = (d.trainingGoals || []).map((g)=>g.toLowerCase()), gl = tg.join(' ');
  async function mr(p, sr) {
    try {
      return await callAnthropic(null, `2-sentence explanation for VYVE member matched with ${p}. W=${s.wellbeing}/10,St=${s.stress}/10(1=stressed,10=calm),E=${s.energy}/10,Goals:${(d.trainingGoals || []).join(',') || 'N/A'},Ctx:${lc.join(',') || 'none'},Exp:${d.gymExperience || 'N/A'},Days:${d.trainDays || 'N/A'}. Write to member. Plain text.`, 150);
    } catch (_) {
      return sr;
    }
  }
  if (lc.some((c)=>[
      'Bereavement',
      'Struggling with mental health'
    ].includes(c))) {
    const r = "We've matched you with HAVEN - a gentle companion who'll support you at your own pace.";
    return {
      persona: 'HAVEN',
      method: 'hard_rule_haven',
      reason: r,
      aiReasoning: await mr('HAVEN', r)
    };
  }
  if (st <= 3 || w <= 4 || en <= 3) {
    const r = "We've matched you with RIVER - a calm guide focused on helping you recharge.";
    return {
      persona: 'RIVER',
      method: 'hard_rule_river',
      reason: r,
      aiReasoning: await mr('RIVER', r)
    };
  }
  if (w >= 7 && en >= 7 && st >= 7 && tg.length <= 2 && (gl.includes('strength') || gl.includes('performance') || gl.includes('muscle'))) {
    const r = "We've matched you with NOVA - a precision coach for your strength goals.";
    return {
      persona: 'NOVA',
      method: 'hard_rule_nova',
      reason: r,
      aiReasoning: await mr('NOVA', r)
    };
  }
  const txt = await callAnthropic(null, `Assign VYVE persona. ${PERSONA_DESCRIPTIONS}\nRULES:HAVEN=bereavement/MH.RIVER=stress<=3|wellbeing<=4|energy<=3.NOVA=all 7+,1-2 perf goals.SPARK=default.SAGE=analytical.\nMEMBER:W=${s.wellbeing}/10,St=${s.stress}/10(HIGH=calm),E=${s.energy}/10,Goals(${tg.length}):${tg.join(',') || 'none'},Spec:${d.specificGoal || 'N/A'},Ctx:${lc.join(',') || 'none'},Tone:${d.tonePreference || 'N/A'},Exp:${d.gymExperience || 'N/A'},Days:${d.trainDays || 'N/A'}\nJSON:{\"persona\":\"SPARK\",\"reason\":\"...\",\"aiReasoning\":\"...\"}`, 350);
  try {
    const p = JSON.parse(txt);
    if ([
      'NOVA',
      'RIVER',
      'SPARK',
      'SAGE',
      'HAVEN'
    ].includes(p.persona) && p.reason) return {
      ...p,
      method: 'ai_decision',
      aiReasoning: p.aiReasoning || p.reason
    };
  } catch (_) {}
  return {
    persona: 'SPARK',
    method: 'ai_fallback',
    reason: "We've matched you with SPARK.",
    aiReasoning: 'Motivation focus.'
  };
}
async function generateProgrammeOverview(d, stream) {
  if (stream === 'movement') {
    return {
      programme_name: 'Your Movement Programme',
      split_type: 'Movement',
      plan_type: 'Movement',
      sessions_per_week: 3,
      rationale: 'A walks-led plan that builds gradually over 8 weeks. Start where you are.'
    };
  }
  if (stream === 'cardio') {
    const goal = String(d.runningGoal || 'general fitness');
    return {
      programme_name: 'Your Running Journey',
      split_type: 'Cardio',
      plan_type: 'Cardio',
      sessions_per_week: parseInt(String(d.runningDays)) || 3,
      rationale: `Build toward ${goal}. Generate your personalised running plan from the Cardio tab when you are ready to start.`
    };
  }
  const { planType } = selectPlanType(d);
  const sp = SPLITS[planType];
  const td = parseInt(String(d.trainDays)) || 3;
  return {
    programme_name: `8-Week ${sp} Programme`,
    split_type: sp,
    plan_type: planType,
    sessions_per_week: td,
    rationale: `Your custom ${td}-day ${sp} programme \u2014 generating now.`
  };
}
async function selectHabits(d, lib) {
  const s = d.scores || {}, lc = d.lifeContext || [];
  const libLines = lib.map((h)=>`${h.id}|${h.habit_pot}|${h.habit_title}|${h.difficulty}`).join('\n');
  const exampleId = lib[0]?.id || 'uuid-here';
  const txt = await callAnthropic(null, `Select exactly 5 habits from the library below for this VYVE member. STRESS:1=stressed,10=calm.\nMember:Goals=${(d.trainingGoals || []).join(',') || 'general'},W=${s.wellbeing}/10,St=${s.stress}/10,Sl=${s.sleep}/10,E=${s.energy}/10,Ctx=${lc.join(',') || 'stable'},Exp=${d.gymExperience || 'N/A'},Sleep=${(d.sleepIssues || []).join(',') || 'none'},Act=${d.activityLevel || 'N/A'}\nLIB (id|pot|title|difficulty):\n${libLines}\nIMPORTANT: ids must be copied exactly from the LIB above. Do not use integers or invent ids.\nJSON:{"ids":["${exampleId}","...","...","...","..."],"reasoning":"brief"}`, 500);
  try {
    const o = JSON.parse(txt.replace(/\`\`\`json|\`\`\`/g, '').trim());
    if (Array.isArray(o.ids) && o.ids.length === 5) {
      const validIds = o.ids.filter((id) => lib.some((h) => h.id === id));
      if (validIds.length === 5) return { ids: validIds, reasoning: o.reasoning || 'Selected.' };
    }
  } catch (_) {}
  return {
    ids: lib.filter((h)=>h.difficulty === 'easy').slice(0, 5).map((h)=>h.id),
    reasoning: 'Balanced easy habits.'
  };
}
async function generateRecommendations(d, persona, ls, on, stream) {
  const s = d.scores || {}, lc = d.lifeContext || [], sens = lc.some((c)=>SENSITIVE_CONTEXT.includes(c)), pp = PERSONA_PROMPTS[persona] || PERSONA_PROMPTS.SPARK, fl = [];
  const age = computeAge(d.dob);
  if (age) fl.push('Age:' + age);
  if (d.gender && d.gender !== 'Prefer not to say') fl.push('Gender:' + d.gender);
  const g = (d.trainingGoals || []).filter(Boolean);
  if (g.length) fl.push('Goals:' + g.join(','));
  if (d.specificGoal) fl.push('Spec:' + d.specificGoal);
  fl.push('ExerciseStream:' + stream);
  if (stream === 'workouts') {
    if (d.trainDays) fl.push('Days:' + d.trainDays);
    if (d.trainingLocation) fl.push('Loc:' + d.trainingLocation);
    if (d.gymExperience) fl.push('Exp:' + d.gymExperience);
  } else if (stream === 'movement') {
    const mts = (d.movementTypes || []).join(',');
    if (mts) fl.push('MovementTypes:' + mts);
    if (d.movementFrequency) fl.push('MoveFreq:' + d.movementFrequency);
    if (d.movementDuration) fl.push('MoveDuration:' + d.movementDuration);
    if (d.movementLocation) fl.push('MoveLoc:' + d.movementLocation);
  } else if (stream === 'cardio') {
    if (d.runningLevel) fl.push('RunLevel:' + d.runningLevel);
    if (d.runningGoal) fl.push('RunGoal:' + d.runningGoal);
    if (d.runningDays) fl.push('RunDays:' + d.runningDays);
    if (d.runningLocation) fl.push('RunLoc:' + d.runningLocation);
  }
  if (s.wellbeing) fl.push('W:' + s.wellbeing + '/10');
  if (s.stress) fl.push('St:' + s.stress + '/10');
  if (lc.length) fl.push('Ctx:' + lc.join(','));
  const sm = fl.length ? fl.join('\n') : 'Name:' + d.firstName;
  const streamGuidance = stream === 'workouts' ? `First rec: workout programme named "${on}" is ready on the Exercise tab.` : stream === 'movement' ? `First rec: head to the Exercise tab and tap Movement to start their walks-led 8-week plan.` : `First rec: head to the Exercise tab and tap Cardio to generate their personalised running plan.`;
  return await callAnthropic(`${pp}\n\nWelcome new VYVE member. Warm, specific, no AI mention.\nIMPORTANT: Only reference information explicitly provided below. NEVER invent or assume weight, body measurements, target weights, health conditions, or any specifics not stated by the member.\n${streamGuidance}\nSESSIONS:\n${ls}\n3 recs: 1.Their exercise starting point per above 2.A live session that fits 3.First-week action${isQuickPath(d) ? '\nQuick-start' : ''}\nMEMBER:\n${sm}${sens ? '\nSENSITIVE' : ''}\nDash per rec, plain text.`, `3 recs for ${d.firstName}.`, 600);
}
async function writeMember(d, persona, pr, r1, r2, r3, stream) {
  const s = d.scores || {};
  const m = {
    email: d.email.toLowerCase().trim(),
    first_name: d.firstName,
    last_name: d.lastName,
    phone: d.phone || null,
    persona,
    persona_reason: pr,
    persona_assigned_at: new Date().toISOString(),
    welcome_persona_reason: pr,
    welcome_rec_1: r1,
    welcome_rec_2: r2,
    welcome_rec_3: r3,
    baseline_wellbeing: parseInt(s.wellbeing) || null,
    baseline_sleep: parseInt(s.sleep) || null,
    baseline_energy: parseInt(s.energy) || null,
    baseline_stress: parseInt(s.stress) || null,
    baseline_physical: parseInt(s.physical) || null,
    baseline_diet: parseInt(s.diet) || null,
    baseline_social: parseInt(s.social) || null,
    baseline_motivation: parseInt(s.motivation) || null,
    training_location: d.trainingLocation || null,
    equipment: (d.equipment || []).join(', ') || null,
    injuries: (d.injuries || []).join(', ') || null,
    exercises_to_avoid: d.avoidExercises || null,
    experience_level: d.gymExperience || null,
    training_days_per_week: parseInt(String(d.trainDays)) || null,
    sleep_issues: (d.sleepIssues || []).join(', ') || null,
    activity_level: d.activityLevel || null,
    height_cm: parseFloat(String(d.heightCm)) || null,
    weight_kg: parseFloat(String(d.weightKg)) || null,
    tdee_target: parseInt(String(d.recommendedCalories)) || null,
    social_barriers: (d.socialBarriers || []).join(', ') || null,
    life_context: d.lifeContext,
    life_context_detail: d.lifeContextExtra || null,
    alcohol_frequency: d.alcohol || null,
    sensitive_context: (d.lifeContext || []).some((c)=>SENSITIVE_CONTEXT.includes(c)),
    past_barriers: (d.pastBarriers || []).join(', ') || null,
    success_vision: d.successVision || null,
    goal_style: d.goalStyle || null,
    contact_preference: d.contactPreference || null,
    tone_preference: d.tonePreference || null,
    overwhelm_response: (d.overwhelmedPref || []).join(', ') || null,
    has_smartphone: d.smartphone === 'Apple' || d.smartphone === 'Android',
    has_smartwatch: d.smartwatch === 'Yes',
    specific_goal: d.specificGoal || null,
    additional_info: d.anythingElse || null,
    gender: d.gender || null,
    gender_self_describe: (d.gender_self_describe || '').trim() || null,
    company: d.company || null,
    tdee_formula: d.tdee_formula || null,
    onboarding_complete: true,
    onboarding_completed_at: new Date().toISOString(),
    subscription_status: 'active',
    dob: d.dob || null,
    goal_focus: d.nutritionGoal || null || (d.trainingGoals || []).join(', ') || null,
    tdee_maintenance: parseInt(String(d.tdeeMaintenance)) || null,
    deficit_percentage: parseInt(String(d.deficitPercentage)) || null,
    support_areas: (d.supportAreas || []).join(', ') || null,
    support_style: (d.supportStyle || []).join(', ') || null,
    motivation_help: (d.motivationHelp || []).join(', ') || null,
    training_goals: (d.trainingGoals || []).join(', ') || null,
    barriers: (d.barriers || []).join(', ') || null,
    sleep_hours_range: d.sleepHours || null,
    sleep_bedtime: d.bedtime || null,
    sleep_help: (d.sleepHelp || []).join(', ') || null,
    social_help: (d.socialHelp || []).join(', ') || null,
    nutrition_guidance: d.nutritionGuidance || null,
    location: d.location || null,
    weight_unit: d.weightUnit || null,
    height_unit: d.heightUnit || null,
    cert_habits_count: 0,
    cert_workouts_count: 0,
    cert_cardio_count: 0,
    cert_checkins_count: 0,
    cert_sessions_count: 0,
    milestone_level: null,
    milestone_message: null,
    milestone_read: false,
    exercise_stream: stream
  };
  const res = await fetch(SUPABASE_URL + '/rest/v1/members?on_conflict=email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': 'Bearer ' + SUPABASE_KEY,
      'Prefer': 'resolution=merge-duplicates,return=minimal'
    },
    body: JSON.stringify(m)
  });
  if (!res.ok) throw new Error('writeMember: ' + await res.text());
}
async function writeWeeklyGoals(e, stream) {
  const n = new Date(), d = n.getUTCDay(), m = new Date(n);
  m.setUTCDate(n.getUTCDate() + (d === 0 ? -6 : 1 - d));
  const targets = stream === 'movement' ? {
    habits_target: 3,
    workouts_target: 0,
    cardio_target: 0,
    sessions_target: 2,
    checkin_target: 1,
    movement_target: 3
  } : stream === 'cardio' ? {
    habits_target: 3,
    workouts_target: 0,
    cardio_target: 2,
    sessions_target: 1,
    checkin_target: 1
  } : {
    habits_target: 3,
    workouts_target: 2,
    cardio_target: 1,
    sessions_target: 1,
    checkin_target: 1
  };
  const r = await fetch(SUPABASE_URL + '/rest/v1/weekly_goals?on_conflict=member_email,week_start', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': 'Bearer ' + SUPABASE_KEY,
      'Prefer': 'resolution=merge-duplicates,return=minimal'
    },
    body: JSON.stringify({
      member_email: e.toLowerCase().trim(),
      week_start: m.toISOString().slice(0, 10),
      ...targets
    })
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error('writeWeeklyGoals: ' + t);
  }
}
async function writeAiInteraction(e, p, r1, r2, r3, dl) {
  const r = await fetch(SUPABASE_URL + '/rest/v1/ai_interactions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': 'Bearer ' + SUPABASE_KEY,
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({
      member_email: e.toLowerCase().trim(),
      triggered_by: 'onboarding',
      persona: p,
      prompt_summary: 'Onboarding recs',
      recommendation: '1. ' + r1 + '\n2. ' + r2 + '\n3. ' + r3,
      decision_log: dl,
      acted_on: false,
      created_at: new Date().toISOString()
    })
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error('writeAiInteraction: ' + t);
  }
}
async function writeAiDecisions(e, p, ar, hi, hr, lib) {
  const nm = lib.filter((h)=>hi.includes(h.id)).map((h)=>h.habit_title).join(', ');
  const r = await fetch(SUPABASE_URL + '/rest/v1/ai_decisions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': 'Bearer ' + SUPABASE_KEY,
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify([
      {
        member_email: e.toLowerCase().trim(),
        decision_type: 'persona_assigned',
        decision_value: p,
        reasoning: ar,
        triggered_by: 'onboarding',
        created_at: new Date().toISOString()
      },
      {
        member_email: e.toLowerCase().trim(),
        decision_type: 'habit_assigned',
        decision_value: nm,
        reasoning: hr,
        triggered_by: 'onboarding',
        created_at: new Date().toISOString()
      }
    ])
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error('writeAiDecisions: ' + t);
  }
}
async function writeHabits(e, ids) {
  const em = e.toLowerCase().trim(), now = new Date().toISOString();
  const rows = ids.map((id)=>({
      member_email: em,
      habit_id: id,
      assigned_at: now,
      assigned_by: 'onboarding',
      active: true
    }));
  const r = await fetch(SUPABASE_URL + '/rest/v1/member_habits', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': 'Bearer ' + SUPABASE_KEY,
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify(rows)
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error('writeHabits: ' + t);
  }
}
async function createAuthUser(e, fn, ln) {
  const r = await fetch(SUPABASE_URL + '/auth/v1/admin/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': 'Bearer ' + SUPABASE_KEY
    },
    body: JSON.stringify({
      email: e,
      email_confirm: true,
      user_metadata: {
        full_name: (fn + ' ' + ln).trim(),
        first_name: fn,
        last_name: ln
      }
    })
  });
  const d = await r.json();
  let uid = d.id;
  if (!r.ok) {
    if (d.msg?.includes('already been registered') || d.code === 'email_exists') {
      const lr = await fetch(SUPABASE_URL + '/auth/v1/admin/users?email=' + encodeURIComponent(e), {
        headers: {
          apikey: SUPABASE_KEY,
          'Authorization': 'Bearer ' + SUPABASE_KEY
        }
      });
      uid = (await lr.json()).users?.[0]?.id;
    } else return null;
  }
  if (!uid) return null;
  const lr2 = await fetch(SUPABASE_URL + '/auth/v1/admin/generate_link', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': 'Bearer ' + SUPABASE_KEY
    },
    body: JSON.stringify({
      type: 'recovery',
      email: e,
      redirect_to: 'https://online.vyvehealth.co.uk/set-password.html'
    })
  });
  return (await lr2.json()).action_link || null;
}
function fireCrisisScan(memberEmail, memberName, data) {
  try {
    fetch(SUPABASE_URL + '/functions/v1/crisis-scan', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + SUPABASE_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        member_email: memberEmail,
        member_name: memberName,
        trigger_source: 'onboarding',
        fields: {
          specific_goal: data.specificGoal || '',
          success_vision: data.successVision || '',
          life_context_detail: data.lifeContextExtra || '',
          anything_else: data.anythingElse || ''
        }
      })
    }).then(async (r)=>{
      if (!r.ok) console.error('[onboarding] crisis-scan non-2xx:', r.status);
    }).catch((e)=>console.error('[onboarding] crisis-scan threw:', String(e)));
  } catch (e) {
    console.error('[onboarding] crisis-scan fire failed:', String(e));
  }
}
serve(async (req)=>{
  if (req.method === 'OPTIONS') return new Response('ok', {
    headers: CORS
  });
  let phase = 'init', email = 'unknown';
  let data = null;
  try {
    phase = 'parse_request';
    try {
      const raw = await req.text();
      console.log('Onboarding CT:', req.headers.get('content-type'), 'Len:', raw.length);
      data = JSON.parse(raw);
    } catch (e) {
      console.error('Parse:', e);
      try {
        await sendErrorAlert('onboarding', 'parse', 'unknown', String(e));
      } catch (_) {}
      return new Response(JSON.stringify({
        error: 'Invalid body. Use Safari/Chrome, not Messenger.'
      }), {
        status: 400,
        headers: {
          ...CORS,
          'Content-Type': 'application/json'
        }
      });
    }
    if (!data.email || !data.firstName) return new Response(JSON.stringify({
      error: 'Missing email/name'
    }), {
      status: 400,
      headers: {
        ...CORS,
        'Content-Type': 'application/json'
      }
    });
    email = data.email.toLowerCase().trim();
    const fn = data.firstName, ln = data.lastName || '';
    const stream = resolveStream(data);
    console.log('Start v87:', email, fn, ln, 'stream:', stream);
    phase = 'batch1_parallel_fetch';
    const elPromise = stream === 'workouts' ? fetch(SUPABASE_URL + '/rest/v1/workout_plans?select=exercise_name,video_url,thumbnail_url&order=exercise_name.asc', {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: 'Bearer ' + SUPABASE_KEY
      }
    }) : Promise.resolve(null);
    const [personaResult, overviewResult, hlr, cr, elr] = await Promise.all([
      selectPersona(data),
      generateProgrammeOverview(data, stream),
      fetch(SUPABASE_URL + '/rest/v1/habit_library?active=eq.true&select=id,habit_pot,habit_title,difficulty', {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: 'Bearer ' + SUPABASE_KEY
        }
      }),
      fetch(SUPABASE_URL + '/rest/v1/service_catalogue?active=eq.true&select=type,category,name,description,duration_minutes,schedule_day,schedule_time&order=schedule_day.asc', {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: 'Bearer ' + SUPABASE_KEY
        }
      }),
      elPromise
    ]);
    const { persona, reason: personaReason, method: pm, aiReasoning } = personaResult;
    const ov = overviewResult;
    const hl = hlr.ok ? await hlr.json() : [];
    const cat = cr.ok ? await cr.json() : [];
    const exerciseLibrary = elr && elr.ok ? await elr.json() : [];
    const ls = cat.filter((s)=>s.type === 'live_session').map((s)=>'- ' + s.category + ': ' + s.schedule_day + 's ' + s.schedule_time + ' (' + s.duration_minutes + 'm)').join('\n');
    const { planType, planReason } = stream === 'workouts' ? selectPlanType(data) : {
      planType: stream === 'movement' ? 'Movement_Wellbeing' : 'Cardio',
      planReason: 'Stream-based'
    };
    console.log('Batch 1 complete. Persona:', persona, 'Plan:', planType, 'ExLib:', exerciseLibrary.length);
    fireCrisisScan(email, (fn + ' ' + ln).trim(), data);
    phase = 'batch2_parallel_ai';
    const [habitResult, recsText] = await Promise.all([
      selectHabits(data, hl),
      generateRecommendations(data, persona, ls, ov.programme_name, stream)
    ]);
    const { ids: hids, reasoning: hreas } = habitResult;
    const rl = recsText.split('\n').filter((l)=>l.trim().startsWith('-')).map((l)=>l.replace(/^-\s*/, '').trim()).filter(Boolean);
    const r1 = rl[0] || `${ov.programme_name} is ready.`, r2 = rl[1] || 'Join a live session.', r3 = rl[2] || 'Complete your check-in.';
    const dl = buildDecisionLog(data, persona, planType, planReason, pm, personaReason, stream);
    console.log('Batch 2 complete. Habits:', hids.length);
    const finalProgrammeName = ov.programme_name;
    phase = 'auth_and_member_write';
    const [pwl] = await Promise.all([
      createAuthUser(email, fn, ln),
      writeMember(data, persona, personaReason, r1, r2, r3, stream)
    ]);
    phase = 'reset_existing_data';
    await resetMemberData(email);
    phase = 'secondary_writes';
    const hlf = await fetch(SUPABASE_URL + '/rest/v1/habit_library?active=eq.true&select=id,habit_title,habit_description,habit_pot', {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: 'Bearer ' + SUPABASE_KEY
      }
    }).then((r)=>r.json()).catch(()=>hl);
    await Promise.all([
      writeHabits(email, hids),
      writeAiInteraction(email, persona, r1, r2, r3, dl),
      writeWeeklyGoals(email, stream),
      writeAiDecisions(email, persona, aiReasoning, hids, hreas, hlf),
      MAKE_WEBHOOK ? fetch(MAKE_WEBHOOK, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          first_name: fn,
          last_name: ln,
          persona,
          persona_reason: personaReason,
          exercise_stream: stream,
          rec_1: r1,
          rec_2: r2,
          rec_3: r3
        })
      }).catch(()=>{}) : Promise.resolve()
    ]);
    phase = 'welcome_email';
    // Resolve full habit objects for the 5 selected habits (ordered to match hids)
    const hlfArr = Array.isArray(hlf) ? hlf : [];
    const hlfMap = Object.fromEntries(hlfArr.map((h) => [h.id, h]));
    const habitsFull = hids.map((id) => hlfMap[id]).filter(Boolean);

    // Pick the most relevant live session based on stream + persona
    const sessionRec = pickSessionRec(persona, stream, cat);

    // Workout type description
    const planTypeDesc = PLAN_TYPE_DESCRIPTIONS[planType] || ov.rationale || '';

    await sendWelcomeEmail(email, fn, persona, personaReason, habitsFull, [r1, r2, r3], finalProgrammeName, planTypeDesc, sessionRec, pwl, stream);
    console.log('DONE v94:', email, persona, 'stream:', stream);
    if (stream === 'workouts') {
      const bgPromise = (async ()=>{
        try {
          const wpResult = await generateWorkoutPlanFlat(data, exerciseLibrary);
          await writeWorkoutPlan(email, wpResult.plan, wpResult.programme_name, wpResult.plan_type, {
            rationale: wpResult.programme_rationale,
            split_type: wpResult.split_type,
            shape: wpResult.shape,
            surface: 'workouts'
          });
          console.log('BG workout plan written:', email, wpResult.plan.length, 'weeks, shape:', wpResult.shape);
        } catch (e) {
          console.error('BG workout failed:', email, e);
        }
      })();
      if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) EdgeRuntime.waitUntil(bgPromise);
    }
    if (stream === 'movement') {
      try {
        const mp = generateMovementPlan(data);
        await writeWorkoutPlan(email, mp.plan, mp.programme_name, mp.plan_type, {
          rationale: mp.programme_rationale,
          split_type: mp.split_type,
          shape: mp.shape,
          surface: 'movement'
        });
        console.log('Movement plan written:', email, mp.plan.length, 'weeks');
      } catch (e) {
        console.error('Movement plan write failed:', email, e);
      }
    }
    return new Response(JSON.stringify({
      success: true,
      persona,
      persona_reason: personaReason,
      ai_reasoning: aiReasoning,
      exercise_stream: stream,
      programme_overview: ov,
      rec_1: r1,
      rec_2: r2,
      rec_3: r3,
      habits_assigned: hids,
      habit_reasoning: hreas,
      full_response: recsText,
      decision_log: dl,
      workout_plan: {
        programme_name: finalProgrammeName,
        status: stream === 'workouts' ? 'generating' : stream === 'movement' ? 'movement_written' : 'not_applicable'
      }
    }), {
      headers: {
        ...CORS,
        'Content-Type': 'application/json'
      }
    });
  } catch (err) {
    console.error(`FAIL [${phase}] [${email}]:`, err);
    try {
      await sendErrorAlert('onboarding', phase, email, String(err));
    } catch (_) {}
    if (data) {
      try {
        await sendAnswersBackup(data);
      } catch (_) {
        console.error('Answers backup failed');
      }
      try {
        await sendManualOnboardAlert(data, phase, String(err));
      } catch (_) {
        console.error('Manual onboard alert failed');
      }
    }
    return new Response(JSON.stringify({
      error: `Onboarding failed at ${phase}: ${String(err)}`
    }), {
      status: 500,
      headers: {
        ...CORS,
        'Content-Type': 'application/json'
      }
    });
  }
});
