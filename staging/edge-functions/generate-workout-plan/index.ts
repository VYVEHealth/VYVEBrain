// generate-workout-plan v5
// Restores original two-step flow:
//   Step 1: generateProgrammeOverview() — AI names the programme (matches original onboarding)
//   Step 2: generateWorkoutPlan() — AI builds plan around that overview, constrained to
//           exercise library from workout_plans table so video/thumbnail URLs always resolve
// Plan generation split into two parallel calls (weeks 1-4, 5-8) to avoid 16k token limit
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
const ANTHROPIC_KEY = Deno.env.get('ANTHROPIC_API_KEY') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json'
};
const SENSITIVE_CONTEXT = [
  'Bereavement',
  'Major life change',
  'Recovering from illness or injury',
  'Struggling with mental health'
];
const PLAN_TYPE_SPLITS = {
  PPL: 'Push / Pull / Legs',
  Upper_Lower: 'Upper / Lower',
  Full_Body: 'Full Body',
  Home: 'Home',
  Movement_Wellbeing: 'Movement & Wellbeing'
};
function selectPlanType(data) {
  const location = String(data.trainingLocation || '').trim().toLowerCase();
  const days = parseInt(String(data.trainDays)) || 3;
  const experience = String(data.gymExperience || 'Beginner').toLowerCase();
  const goals = (data.trainingGoals || []).map((g)=>g.toLowerCase()).join(' ');
  const lifeContext = data.lifeContext || [];
  const hasSensitive = lifeContext.some((c)=>SENSITIVE_CONTEXT.includes(c));
  let planType = 'Full_Body';
  if (location === 'home') planType = 'Home';
  else if (hasSensitive && experience === 'beginner') planType = 'Movement_Wellbeing';
  else if (goals.includes('mobility') || goals.includes('flexibility') || goals.includes('mental')) planType = 'Movement_Wellbeing';
  else if (days <= 2) planType = 'Full_Body';
  else if (days === 3) planType = experience === 'advanced' ? 'PPL' : 'Full_Body';
  else if (days === 4) planType = experience === 'advanced' ? 'PPL' : 'Upper_Lower';
  else planType = 'PPL';
  return {
    planType,
    splitType: PLAN_TYPE_SPLITS[planType]
  };
}
async function callAnthropic(system, user, maxTokens) {
  const body = {
    model: 'claude-sonnet-4-20250514',
    max_tokens: maxTokens,
    messages: [
      {
        role: 'user',
        content: user
      }
    ]
  };
  if (system) body.system = system;
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error('Anthropic error: ' + await res.text());
  const d = await res.json();
  return {
    text: d.content?.[0]?.text ?? '',
    stopReason: d.stop_reason ?? ''
  };
}
// Step 1: Generate programme name + rationale (matches original generateProgrammeOverview)
async function generateProgrammeOverview(data, splitType, planType) {
  const scores = data.scores || {};
  const injuries = (data.injuries || []).join(', ') || 'none';
  const trainDays = parseInt(String(data.trainDays)) || 3;
  const location = String(data.trainingLocation || 'gym');
  const experience = String(data.gymExperience || 'Beginner');
  const goals = (data.trainingGoals || []).join(', ');
  const specificGoal = String(data.specificGoal || '');
  const equipment = (data.equipment || []).join(', ') || 'standard gym';
  const prompt = `You are an expert personal trainer naming an 8-week programme for a member.

The split type has already been decided: ${splitType} (${planType}). Do NOT change the split.

Member: location=${location}, equipment=${equipment}, experience=${experience}, training ${trainDays} days/week, goals=${goals || 'general fitness'}, specific goal=${specificGoal || 'not stated'}, injuries=${injuries}, wellbeing=${scores.wellbeing}/10, energy=${scores.energy}/10

Your job: write a short, motivating programme_name and a 2-3 sentence rationale addressed directly to the member (second person). The name should reflect the split type and their goals — NOT the location.

IMPORTANT: Only reference goals, injuries, or specific details that are explicitly listed above. Do NOT invent or assume any details not provided.

Respond ONLY with valid JSON (no markdown):
{"programme_name":"string","rationale":"string"}`;
  const { text } = await callAnthropic(null, prompt, 300);
  try {
    const clean = text.replace(/```json|```/g, '').trim();
    const overview = JSON.parse(clean);
    if (overview.programme_name && overview.rationale) return overview;
  } catch (_) {}
  return {
    programme_name: `8-Week ${splitType} Programme`,
    rationale: `Based on your profile, we've built you a custom ${trainDays}-day ${splitType} programme tailored to your experience level and goals.`
  };
}
function parseWeeksArray(raw) {
  const clean = raw.replace(/```json|```/g, '').trim();
  const s = clean.indexOf('[');
  const e = clean.lastIndexOf(']');
  if (s < 0 || e < 0) throw new Error('No JSON array found in response');
  return JSON.parse(clean.slice(s, e + 1));
}
serve(async (req)=>{
  if (req.method === 'OPTIONS') return new Response('ok', {
    headers: CORS
  });
  try {
    const data = await req.json();
    const email = data.email?.toLowerCase().trim();
    if (!email) return new Response(JSON.stringify({
      error: 'Missing email'
    }), {
      status: 400,
      headers: CORS
    });
    console.log('generate-workout-plan v5 called for', email);
    const { planType, splitType } = selectPlanType(data);
    const scores = data.scores || {};
    const lifeContext = data.lifeContext || [];
    const hasSensitive = lifeContext.some((c)=>SENSITIVE_CONTEXT.includes(c));
    const injuries = (data.injuries || []).join(', ') || 'none';
    const trainDays = parseInt(String(data.trainDays)) || 3;
    const location = String(data.trainingLocation || 'gym');
    const experience = String(data.gymExperience || 'Beginner');
    const goals = (data.trainingGoals || []).join(', ');
    const equipment = (data.equipment || []).join(', ') || 'standard gym';
    const specificGoal = String(data.specificGoal || '');
    const avoidExercises = String(data.avoidExercises || data.exercises_to_avoid || '');
    const lifeContextDetail = String(data.lifeContextDetail || data.life_context_detail || '');
    const isMix = location.toLowerCase().includes('mix');
    const pplPattern = trainDays === 4 ? 'Push A / Pull / Legs / Push B repeating each week' : 'Push / Pull / Legs repeating';
    // Fetch exercise library from workout_plans so AI uses exact names that resolve to videos
    console.log('Fetching exercise library...');
    const libRes = await fetch(`${SUPABASE_URL}/rest/v1/workout_plans?select=exercise_name,video_url,thumbnail_url&video_url=not.is.null&order=exercise_name`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });
    const libraryRaw = libRes.ok ? await libRes.json() : [];
    // Deduplicate by exercise_name
    const seen = new Set();
    const library = libraryRaw.filter((r)=>{
      if (seen.has(r.exercise_name)) return false;
      seen.add(r.exercise_name);
      return true;
    });
    console.log(`Exercise library loaded: ${library.length} exercises`);
    // Build lookup map for video/thumbnail enrichment after plan generation
    const videoMap = {};
    for (const ex of library){
      videoMap[ex.exercise_name] = {
        video_url: ex.video_url,
        thumbnail_url: ex.thumbnail_url
      };
    }
    // Step 1: Generate programme overview (AI-named, same as original onboarding)
    console.log('Generating programme overview...');
    const overview = await generateProgrammeOverview(data, splitType, planType);
    console.log('Programme name:', overview.programme_name);
    // Build shared context for plan generation calls
    const exerciseListText = library.map((e)=>e.exercise_name).join(', ');
    const CONTEXT = `Programme: "${overview.programme_name}" — ${overview.rationale}
Member: ${experience} level, ${location}${isMix ? ' (gym access)' : ''}, ${trainDays} days/week, ${splitType} split.
Goals: ${goals || 'general fitness'}${specificGoal ? ', specific: ' + specificGoal : ''}.
Avoid: ${avoidExercises || 'nothing specific'}. Injuries: ${injuries}.
${lifeContextDetail ? 'Scheduling: ' + lifeContextDetail + '.' : ''}
Wellbeing ${scores.wellbeing}/10, Stress ${scores.stress}/10, Energy ${scores.energy}/10.
Equipment: ${location.toLowerCase() === 'home' ? 'bodyweight + dumbbells only' : `full gym: barbells, dumbbells, cables, machines${isMix ? ' (gym confirmed)' : ''}`}.
${hasSensitive ? 'Sensitive context: moderate loading, prioritise form.' : ''}`;
    const EXERCISE_RULE = `CRITICAL — Exercise names: You MUST use ONLY exercise names from this approved list. Do not invent new names. Pick the most appropriate match from the list for each movement:
${exerciseListText}`;
    const RULES = `STRUCTURE RULES:
- session_number is GLOBAL — increments 1 through ${trainDays * 8}, never resets between weeks.
- letter_badge A–G per session.
- Exercises per session: 5-7 for Full_Body/Home; 6-8 for PPL/Upper_Lower.
- ${planType === 'PPL' ? `PPL pattern: ${pplPattern}` : ''}
- ${planType === 'Upper_Lower' ? 'Upper_Lower: Upper A / Lower A / Upper B / Lower B' : ''}
- ${avoidExercises ? `NEVER include: ${avoidExercises}` : ''}
- ${lifeContextDetail ? lifeContextDetail : ''}
- ${hasSensitive ? 'Sensitive: moderate loading, prioritise form, one low-impact option per session.' : ''}`;
    const PROGRESSION = `PROGRESSIVE OVERLOAD:
- Weeks 1-2: Foundation — 3 sets, 10-12 reps.
- Weeks 3-4: Build — 3-4 sets, 8-12 reps, +5-10% weight.
- Weeks 5-6: Volume — 4 sets, 8-10 reps.
- Week 7: Peak — 4-5 sets, 6-8 reps, heaviest loads.
- Week 8: Deload — 2-3 sets, 12-15 reps, -30-40% weight.`;
    const SHAPE = `Return ONLY a valid JSON array of week objects, no markdown:
[{
  "week": 1,
  "sessions": [{
    "session_number": 1,
    "session_name": "Push A — Chest, Shoulders & Triceps",
    "estimated_duration_mins": 45,
    "warm_up": "5 min light cardio + dynamic stretches",
    "cool_down": "3 min chest and shoulder stretch",
    "exercises": [{
      "letter_badge": "A",
      "exercise_name": "Bench Press – Barbell",
      "sets": 3,
      "reps": "10-12",
      "rest_seconds": 90,
      "notes": "Control the descent, drive through chest"
    }]
  }]
}]`;
    const systemBase = `You are an expert personal trainer building part of a personalised 8-week workout programme.\n\n${CONTEXT}\n\n${EXERCISE_RULE}\n\n${RULES}\n\n${PROGRESSION}\n\n${SHAPE}`;
    // Step 2: Generate weeks 1-4 and 5-8 in parallel
    console.log('Generating weeks 1-4 and 5-8 in parallel...');
    const [result1, result2] = await Promise.all([
      callAnthropic(systemBase, `Generate weeks 1-4 only (sessions 1–${trainDays * 4}). Foundation and build phases. Return ONLY the JSON array.`, 16000),
      callAnthropic(systemBase, `Generate weeks 5-8 only (sessions ${trainDays * 4 + 1}–${trainDays * 8}). Volume phase (weeks 5-6: 4 sets 8-10 reps), peak (week 7: 4-5 sets 6-8 reps), deload (week 8: 2-3 sets 12-15 reps). Return ONLY the JSON array.`, 16000)
    ]);
    if (result1.stopReason === 'max_tokens') throw new Error('Weeks 1-4 hit max_tokens limit');
    if (result2.stopReason === 'max_tokens') throw new Error('Weeks 5-8 hit max_tokens limit');
    const weeks1to4 = parseWeeksArray(result1.text);
    const weeks5to8 = parseWeeksArray(result2.text);
    const allWeeks = [
      ...weeks1to4,
      ...weeks5to8
    ];
    if (allWeeks.length !== 8) throw new Error(`Expected 8 weeks, got ${allWeeks.length}`);
    // Step 3: Enrich exercises with video_url + thumbnail_url from library lookup
    let matched = 0, unmatched = 0;
    for (const week of allWeeks){
      for (const session of week.sessions){
        for (const ex of session.exercises){
          const name = ex.exercise_name;
          if (videoMap[name]) {
            ex.video_url = videoMap[name].video_url;
            ex.thumbnail_url = videoMap[name].thumbnail_url;
            matched++;
          } else {
            ex.video_url = null;
            ex.thumbnail_url = null;
            unmatched++;
            console.warn(`No video match for: "${name}"`);
          }
        }
      }
    }
    console.log(`Video enrichment: ${matched} matched, ${unmatched} unmatched`);
    const plan = {
      programme_name: overview.programme_name,
      programme_rationale: overview.rationale,
      split_type: splitType,
      sessions_per_week: trainDays,
      plan_duration_weeks: 8,
      weeks: allWeeks
    };
    const totalSessions = allWeeks.reduce((a, w)=>a + (w.sessions?.length || 0), 0);
    console.log(`Plan complete: "${plan.programme_name}" — ${allWeeks.length} weeks, ${totalSessions} sessions, ${matched}/${matched + unmatched} exercises with video`);
    // Write to workout_plan_cache
    const writeRes = await fetch(`${SUPABASE_URL}/rest/v1/workout_plan_cache?on_conflict=member_email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'resolution=merge-duplicates,return=minimal'
      },
      body: JSON.stringify({
        member_email: email,
        programme_json: plan,
        plan_duration_weeks: 8,
        current_week: 1,
        current_session: 1,
        generated_at: new Date().toISOString()
      })
    });
    if (!writeRes.ok) throw new Error('DB write failed: ' + await writeRes.text());
    console.log('Plan written to workout_plan_cache for', email);
    return new Response(JSON.stringify({
      success: true,
      programme_name: plan.programme_name,
      weeks: allWeeks.length,
      sessions: totalSessions,
      videos_matched: matched,
      videos_unmatched: unmatched
    }), {
      headers: CORS
    });
  } catch (err) {
    console.error('generate-workout-plan v5 error:', String(err));
    return new Response(JSON.stringify({
      error: String(err)
    }), {
      status: 500,
      headers: CORS
    });
  }
});
