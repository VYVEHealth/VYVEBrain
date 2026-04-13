// onboarding v67 — inline workout plan generation (no more waitUntil/generate-workout-plan)
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const ANTHROPIC_KEY = Deno.env.get('ANTHROPIC_API_KEY') ?? '';
const SUPABASE_URL  = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const BREVO_KEY     = Deno.env.get('BREVO_API_KEY') ?? '';
const MAKE_WEBHOOK  = Deno.env.get('MAKE_ONBOARDING_WEBHOOK') || '';

const CORS = {
  'Access-Control-Allow-Origin':  'https://www.vyvehealth.co.uk',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const SENSITIVE_CONTEXT = ['Bereavement','Major life change','Recovering from illness or injury','Struggling with mental health'];

async function sendErrorAlert(fn: string, phase: string, mem: string, err: string): Promise<void> {
  if (!BREVO_KEY) return;
  const ts = new Date().toISOString();
  const se = err.replace(/</g,'&lt;').replace(/>/g,'&gt;').slice(0,2000);
  const html = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#FFF5F5;font-family:Arial,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#FFF5F5;padding:30px 16px;"><tr><td align="center"><table width="540" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:10px;box-shadow:0 2px 12px rgba(180,40,40,0.08);"><tr><td style="background:#8B0000;padding:18px 28px;"><span style="font-family:Georgia,serif;font-size:16px;letter-spacing:4px;color:#fff;">VYVE — ERROR ALERT</span></td></tr><tr><td style="padding:24px 28px;"><h2 style="margin:0 0 14px;font-size:18px;color:#8B0000;">Edge Function Failed</h2><table width="100%" cellpadding="6" cellspacing="0" style="font-size:13px;color:#333;"><tr><td style="font-weight:700;width:110px;border-bottom:1px solid #eee;">Function</td><td style="border-bottom:1px solid #eee;">${fn}</td></tr><tr><td style="font-weight:700;border-bottom:1px solid #eee;">Phase</td><td style="border-bottom:1px solid #eee;">${phase}</td></tr><tr><td style="font-weight:700;border-bottom:1px solid #eee;">Member</td><td style="border-bottom:1px solid #eee;">${mem}</td></tr><tr><td style="font-weight:700;border-bottom:1px solid #eee;">Time</td><td style="border-bottom:1px solid #eee;">${ts}</td></tr><tr><td style="font-weight:700;vertical-align:top;">Error</td><td style="color:#8B0000;font-family:monospace;font-size:12px;word-break:break-all;">${se}</td></tr></table><p style="margin:16px 0 0;font-size:12px;color:#999;">Member saw error screen. Check the separate answers backup email.</p></td></tr></table></td></tr></table></body></html>`;
  try { await fetch('https://api.brevo.com/v3/smtp/email',{method:'POST',headers:{'api-key':BREVO_KEY,'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify({sender:{name:'VYVE Alerts',email:'team@vyvehealth.co.uk'},to:[{email:'team@vyvehealth.co.uk',name:'VYVE Team'}],subject:'\u{1F6A8} ONBOARDING FAILED \u2014 '+mem+' \u2014 '+phase,htmlContent:html,tags:['error-alert','onboarding']})}); } catch(_){}
}

async function sendAnswersBackup(data: Record<string,unknown>): Promise<void> {
  if (!BREVO_KEY || !data) return;
  const ts = new Date().toISOString();
  const email = String(data.email || 'unknown');
  const name = String(data.firstName || '') + ' ' + String(data.lastName || '');
  const scores = (data.scores as Record<string,string>) || {};
  const fields: [string,string][] = [
    ['Name', name.trim()],['Email', email],['Phone', String(data.phone || 'N/A')],
    ['DOB', String(data.dob || 'N/A')],['Gender', String(data.gender || 'N/A')],
    ['Location (area)', String(data.location || 'N/A')],['Training Location', String(data.trainingLocation || 'N/A')],
    ['Experience', String(data.gymExperience || 'N/A')],['Training Days/Week', String(data.trainDays || 'N/A')],
    ['Training Goals', ((data.trainingGoals as string[]) || []).join(', ') || 'N/A'],
    ['Specific Goal', String(data.specificGoal || 'N/A')],
    ['Equipment', ((data.equipment as string[]) || []).join(', ') || 'N/A'],
    ['Injuries', ((data.injuries as string[]) || []).join(', ') || 'None'],
    ['Exercises to Avoid', String(data.avoidExercises || 'None')],
    ['Wellbeing Score', scores.wellbeing || 'N/A'],['Stress Score', scores.stress || 'N/A'],
    ['Energy Score', scores.energy || 'N/A'],['Sleep Score', scores.sleep || 'N/A'],
    ['Physical Score', scores.physical || 'N/A'],['Diet Score', scores.diet || 'N/A'],
    ['Social Score', scores.social || 'N/A'],['Motivation Score', scores.motivation || 'N/A'],
    ['Sleep Hours', String(data.sleepHours || 'N/A')],['Bedtime', String(data.bedtime || 'N/A')],
    ['Sleep Issues', ((data.sleepIssues as string[]) || []).join(', ') || 'None'],
    ['Sleep Help', ((data.sleepHelp as string[]) || []).join(', ') || 'N/A'],
    ['Activity Level', String(data.activityLevel || 'N/A')],
    ['Height (cm)', String(data.heightCm || 'N/A')],['Weight (kg)', String(data.weightKg || 'N/A')],
    ['TDEE Target', String(data.recommendedCalories || 'N/A')],
    ['TDEE Maintenance', String(data.tdeeMaintenance || 'N/A')],
    ['Deficit %', String(data.deficitPercentage || 'N/A')],
    ['Nutrition Goal', String(data.nutritionGoal || 'N/A')],
    ['Nutrition Guidance', String(data.nutritionGuidance || 'N/A')],
    ['Life Context', ((data.lifeContext as string[]) || []).join(', ') || 'None'],
    ['Life Context Detail', String(data.lifeContextExtra || 'N/A')],
    ['Alcohol', String(data.alcohol || 'N/A')],
    ['Social Barriers', ((data.socialBarriers as string[]) || []).join(', ') || 'None'],
    ['Social Help', ((data.socialHelp as string[]) || []).join(', ') || 'N/A'],
    ['Past Barriers', ((data.pastBarriers as string[]) || []).join(', ') || 'None'],
    ['Success Vision', String(data.successVision || 'N/A')],
    ['Goal Style', String(data.goalStyle || 'N/A')],
    ['Tone Preference', String(data.tonePreference || 'N/A')],
    ['Overwhelm Response', ((data.overwhelmedPref as string[]) || []).join(', ') || 'N/A'],
    ['Contact Preference', String(data.contactPreference || 'N/A')],
    ['Support Areas', ((data.supportAreas as string[]) || []).join(', ') || 'N/A'],
    ['Support Style', ((data.supportStyle as string[]) || []).join(', ') || 'N/A'],
    ['Motivation Help', ((data.motivationHelp as string[]) || []).join(', ') || 'N/A'],
    ['Smartphone', String(data.smartphone || 'N/A')],['Smartwatch', String(data.smartwatch || 'N/A')],
    ['Additional Info', String(data.anythingElse || 'N/A')],
  ];
  const rows = fields.map(([k,v]) => `<tr><td style="font-weight:700;padding:6px 10px;border-bottom:1px solid #eee;width:160px;vertical-align:top;font-size:13px;">${k}</td><td style="padding:6px 10px;border-bottom:1px solid #eee;font-size:13px;">${String(v).replace(/</g,'&lt;').replace(/>/g,'&gt;')}</td></tr>`).join('');
  const html = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#F0FAF8;font-family:Arial,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#F0FAF8;padding:30px 16px;"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:10px;box-shadow:0 2px 12px rgba(27,120,120,0.08);"><tr><td style="background:#0D2B2B;padding:18px 28px;"><span style="font-family:Georgia,serif;font-size:16px;letter-spacing:4px;color:#fff;">VYVE — ANSWERS BACKUP</span></td></tr><tr><td style="padding:24px 28px;"><h2 style="margin:0 0 6px;font-size:18px;color:#0D2B2B;">Questionnaire Answers</h2><p style="margin:0 0 16px;font-size:13px;color:#888;">Onboarding failed for this member. Their answers are preserved below.</p><table width="100%" cellpadding="0" cellspacing="0" style="color:#333;">${rows}</table><p style="margin:20px 0 0;font-size:12px;color:#999;">Backup sent ${ts}.</p><pre style="background:#f4f4f4;padding:12px;border-radius:6px;font-size:11px;overflow-x:auto;margin-top:12px;max-height:400px;">${JSON.stringify(data,null,2).replace(/</g,'&lt;').replace(/>/g,'&gt;').slice(0,8000)}</pre></td></tr></table></td></tr></table></body></html>`;
  try {
    await fetch('https://api.brevo.com/v3/smtp/email',{method:'POST',headers:{'api-key':BREVO_KEY,'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify({sender:{name:'VYVE Answers Backup',email:'team@vyvehealth.co.uk'},to:[{email:'team@vyvehealth.co.uk',name:'VYVE Team'}],subject:'\u{1F4CB} ANSWERS BACKUP \u2014 '+name.trim()+' ('+email+') \u2014 '+ts.slice(0,10),htmlContent:html,tags:['answers-backup','onboarding']})});
    console.log('Answers backup sent for',email);
  } catch(e) { console.error('Answers backup failed:',e); }
}

async function resetMemberData(email: string): Promise<void> {
  const e = encodeURIComponent(email.toLowerCase().trim());
  const h = { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY, 'Prefer': 'return=minimal' };
  const tables = ['member_habits','workout_plan_cache','weekly_goals','ai_interactions','daily_habits','workouts','cardio','exercise_logs','exercise_swaps','custom_workouts','persona_switches','certificates','wellbeing_checkins','monthly_checkins','weekly_scores','weight_logs','nutrition_logs','nutrition_my_foods','session_views','replay_views','engagement_emails'];
  await Promise.all(tables.map(t => fetch(SUPABASE_URL+'/rest/v1/'+t+'?member_email=eq.'+e,{method:'DELETE',headers:h}).then(async r=>{if(!r.ok)console.error('Reset '+t+':',await r.text())}).catch(x=>console.error('Reset '+t+':',x))));
  await fetch(SUPABASE_URL+'/rest/v1/ai_decisions?member_email=eq.'+e,{method:'DELETE',headers:h}).catch(()=>{});
  console.log('Data reset for',email);
}

const PERSONA_PROMPTS: Record<string,string> = {NOVA:'You are NOVA, a high-performance coach. Driven, data-led, precision-focused.',RIVER:'You are RIVER, a mindful wellness guide. Calm, empathetic. Stress, sleep, emotional balance.',SPARK:'You are SPARK, a motivational coach. Energetic, warm, challenge-driven. Consistency.',SAGE:'You are SAGE, a knowledge-first mentor. Thoughtful, evidence-based.',HAVEN:'You are HAVEN, a gentle wellbeing companion. Non-judgmental, trauma-informed. Signpost professional help.'};
const PERSONA_DESCRIPTIONS = 'NOVA: high performance, calm (high stress score), strong wellbeing/energy. RIVER: struggling (low stress=actually stressed, low wellbeing/energy). SPARK: moderate-good, needs motivation. SAGE: analytical, evidence-driven. HAVEN: bereavement, mental health. STRESS: 1=very stressed, 10=very calm.';

function computeAge(dob: string|null): number|null { if(!dob)return null; const b=new Date(dob),t=new Date(); let a=t.getFullYear()-b.getFullYear(); const m=t.getMonth()-b.getMonth(); if(m<0||(m===0&&t.getDate()<b.getDate()))a--; return a>0&&a<120?a:null; }
function isQuickPath(d: Record<string,unknown>): boolean { return((d.trainingGoals as string[]||[]).length===0&&!String(d.trainingLocation||'').trim()&&!String(d.gymExperience||'').trim()); }
function selectPlanType(d: Record<string,unknown>):{planType:string;planReason:string} {
  const loc=String(d.trainingLocation||'').trim().toLowerCase(),days=parseInt(String(d.trainDays))||3,exp=String(d.gymExperience||'Beginner').toLowerCase();
  const goals=((d.trainingGoals as string[])||[]).map(g=>g.toLowerCase()).join(' '),lc=(d.lifeContext as string[])||[],sens=lc.some(c=>SENSITIVE_CONTEXT.includes(c));
  if(loc==='home')return{planType:'Home',planReason:'Home only.'};
  if(sens&&exp==='beginner')return{planType:'Movement_Wellbeing',planReason:'Sensitive+Beginner.'};
  if(goals.includes('mobility')||goals.includes('flexibility')||goals.includes('mental'))return{planType:'Movement_Wellbeing',planReason:'Mobility/flexibility goals.'};
  if(days<=2)return{planType:'Full_Body',planReason:days+'d/wk.'};
  if(days===3)return exp==='advanced'?{planType:'PPL',planReason:'3d+Adv.'}:{planType:'Full_Body',planReason:'3d+'+exp+'.'};
  if(days===4)return exp==='advanced'?{planType:'PPL',planReason:'4d+Adv.'}:{planType:'Upper_Lower',planReason:'4d+'+exp+'.'};
  return{planType:'PPL',planReason:days+'d.'};
}
const SPLITS:Record<string,string>={PPL:'Push / Pull / Legs',Upper_Lower:'Upper / Lower',Full_Body:'Full Body',Home:'Home',Movement_Wellbeing:'Movement & Wellbeing'};
function buildDecisionLog(d:Record<string,unknown>,persona:string,pt:string,pr:string,pm:string,prr:string):Record<string,unknown>{const s=(d.scores as Record<string,string>)||{},lc=(d.lifeContext as string[])||[];return{onboarding_version:'v67',recorded_at:new Date().toISOString(),inputs:{location:d.trainingLocation,experience:d.gymExperience,train_days:d.trainDays,goals:d.trainingGoals,life_context:lc,sensitive_context:lc.some(c=>SENSITIVE_CONTEXT.includes(c)),wellbeing:s.wellbeing,stress:s.stress,energy:s.energy,age_at_onboarding:computeAge(d.dob as string|null)},plan_decision:{plan_type:pt,split_type:SPLITS[pt],method:'deterministic',reason:pr},persona_decision:{persona,method:pm,reason:prr}};}

async function callAnthropic(sys:string|null,usr:string,mt=1000):Promise<string>{const b:Record<string,unknown>={model:'claude-sonnet-4-20250514',max_tokens:mt,messages:[{role:'user',content:usr}]};if(sys)b.system=sys;const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json','x-api-key':ANTHROPIC_KEY,'anthropic-version':'2023-06-01'},body:JSON.stringify(b)});if(!r.ok){const t=await r.text();throw new Error('Anthropic '+r.status+': '+t.slice(0,200));}const j=await r.json();return j.content?.[0]?.text??'';}

async function callAnthropicFull(sys:string|null,usr:string,mt=1000):Promise<{text:string;stopReason:string}>{const b:Record<string,unknown>={model:'claude-sonnet-4-20250514',max_tokens:mt,messages:[{role:'user',content:usr}]};if(sys)b.system=sys;const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json','x-api-key':ANTHROPIC_KEY,'anthropic-version':'2023-06-01'},body:JSON.stringify(b)});if(!r.ok){const t=await r.text();throw new Error('Anthropic '+r.status+': '+t.slice(0,200));}const j=await r.json();return{text:j.content?.[0]?.text??'',stopReason:j.stop_reason??'unknown'};}

async function selectPersona(d:Record<string,unknown>):Promise<{persona:string;reason:string;method:string;aiReasoning:string}>{const s=(d.scores as Record<string,string>)||{},lc=(d.lifeContext as string[])||[],w=parseInt(s.wellbeing)||5,st=parseInt(s.stress)||5,en=parseInt(s.energy)||5,tg=((d.trainingGoals as string[])||[]).map(g=>g.toLowerCase()),gl=tg.join(' ');async function mr(p:string,sr:string):Promise<string>{try{return await callAnthropic(null,`2-sentence explanation for VYVE member matched with ${p}. W=${s.wellbeing}/10,St=${s.stress}/10(1=stressed,10=calm),E=${s.energy}/10,Goals:${(d.trainingGoals as string[]||[]).join(',')||'N/A'},Ctx:${lc.join(',')||'none'},Exp:${d.gymExperience||'N/A'},Days:${d.trainDays||'N/A'}. Write to member. Plain text.`,150);}catch(_){return sr;}}if(lc.some(c=>['Bereavement','Struggling with mental health'].includes(c))){const r="We've matched you with HAVEN — a gentle companion who'll support you at your own pace.";return{persona:'HAVEN',method:'hard_rule_haven',reason:r,aiReasoning:await mr('HAVEN',r)};}if(st<=3||w<=4||en<=3){const r="We've matched you with RIVER — a calm guide focused on helping you recharge.";return{persona:'RIVER',method:'hard_rule_river',reason:r,aiReasoning:await mr('RIVER',r)};}if(w>=7&&en>=7&&st>=7&&tg.length<=2&&(gl.includes('strength')||gl.includes('performance')||gl.includes('muscle'))){const r="We've matched you with NOVA — a precision coach for your strength goals.";return{persona:'NOVA',method:'hard_rule_nova',reason:r,aiReasoning:await mr('NOVA',r)};}const txt=await callAnthropic(null,`Assign VYVE persona. ${PERSONA_DESCRIPTIONS}\nRULES:HAVEN=bereavement/MH.RIVER=stress<=3|wellbeing<=4|energy<=3.NOVA=all 7+,1-2 perf goals.SPARK=default.SAGE=analytical.\nMEMBER:W=${s.wellbeing}/10,St=${s.stress}/10(HIGH=calm),E=${s.energy}/10,Goals(${tg.length}):${tg.join(',')||'none'},Spec:${d.specificGoal||'N/A'},Ctx:${lc.join(',')||'none'},Tone:${d.tonePreference||'N/A'},Exp:${d.gymExperience||'N/A'},Days:${d.trainDays||'N/A'}\nJSON:{"persona":"SPARK","reason":"...","aiReasoning":"..."}`,350);try{const p=JSON.parse(txt);if(['NOVA','RIVER','SPARK','SAGE','HAVEN'].includes(p.persona)&&p.reason)return{...p,method:'ai_decision',aiReasoning:p.aiReasoning||p.reason};}catch(_){}return{persona:'SPARK',method:'ai_fallback',reason:"We've matched you with SPARK.",aiReasoning:'Motivation focus.'};}

async function generateProgrammeOverview(d:Record<string,unknown>):Promise<{programme_name:string;split_type:string;plan_type:string;sessions_per_week:number;rationale:string}>{const s=(d.scores as Record<string,string>)||{},td=parseInt(String(d.trainDays))||3,{planType}=selectPlanType(d),sp=SPLITS[planType];const txt=await callAnthropic(null,`You are a PT naming an 8-week programme. IMPORTANT: Only reference information explicitly provided below. NEVER invent or assume weight, body measurements, target weights, health conditions, or any specifics not stated.\nSplit:${sp}. loc=${d.trainingLocation||'gym'},exp=${d.gymExperience||'Beginner'},${td}d/wk,goals=${((d.trainingGoals as string[])||[]).join(',')||'general'},injuries=${((d.injuries as string[])||[]).join(',')||'none'},W=${s.wellbeing}/10,E=${s.energy}/10. JSON:{"programme_name":"str","rationale":"str"}`,250);try{const o=JSON.parse(txt.replace(/\`\`\`json|\`\`\`/g,'').trim());if(o.programme_name&&o.rationale)return{programme_name:o.programme_name,split_type:sp,plan_type:planType,sessions_per_week:td,rationale:o.rationale};}catch(_){}return{programme_name:`8-Week ${sp} Programme`,split_type:sp,plan_type:planType,sessions_per_week:td,rationale:`Custom ${td}-day ${sp} programme.`};}

async function selectHabits(d:Record<string,unknown>,lib:{id:string;habit_pot:string;habit_title:string;difficulty:string}[]):Promise<{ids:string[];reasoning:string}>{const s=(d.scores as Record<string,string>)||{},lc=(d.lifeContext as string[])||[];const txt=await callAnthropic(null,`Select 5 habits. STRESS:1=stressed,10=calm.\nMember:Goals=${(d.trainingGoals as string[]||[]).join(',')||'general'},W=${s.wellbeing}/10,St=${s.stress}/10,Sl=${s.sleep}/10,E=${s.energy}/10,Ctx=${lc.join(',')||'stable'},Exp=${d.gymExperience||'N/A'},Sleep=${(d.sleepIssues as string[]||[]).join(',')||'none'},Act=${d.activityLevel||'N/A'}\nLIB:\n${lib.map(h=>`${h.id}|${h.habit_pot}|${h.habit_title}|${h.difficulty}`).join('\n')}\nJSON:{"ids":[5],"reasoning":"brief"}`,400);try{const o=JSON.parse(txt.replace(/\`\`\`json|\`\`\`/g,'').trim());if(Array.isArray(o.ids)&&o.ids.length===5)return{ids:o.ids,reasoning:o.reasoning||'Selected.'};}catch(_){}return{ids:lib.filter(h=>h.difficulty==='easy').slice(0,5).map(h=>h.id),reasoning:'Balanced easy habits.'};}

async function generateRecommendations(d:Record<string,unknown>,persona:string,ls:string,on:string):Promise<string>{const s=(d.scores as Record<string,string>)||{},lc=(d.lifeContext as string[])||[],sens=lc.some(c=>SENSITIVE_CONTEXT.includes(c)),pp=PERSONA_PROMPTS[persona]||PERSONA_PROMPTS.SPARK,fl:string[]=[];const age=computeAge(d.dob as string|null);if(age)fl.push('Age:'+age);if(d.gender&&d.gender!=='Prefer not to say')fl.push('Gender:'+d.gender);const g=(d.trainingGoals as string[]||[]).filter(Boolean);if(g.length)fl.push('Goals:'+g.join(','));if(d.specificGoal)fl.push('Spec:'+d.specificGoal);if(d.trainDays)fl.push('Days:'+d.trainDays);if(d.trainingLocation)fl.push('Loc:'+d.trainingLocation);if(d.gymExperience)fl.push('Exp:'+d.gymExperience);if(s.wellbeing)fl.push('W:'+s.wellbeing+'/10');if(s.stress)fl.push('St:'+s.stress+'/10');if(lc.length)fl.push('Ctx:'+lc.join(','));const sm=fl.length?fl.join('\n'):'Name:'+d.firstName;return await callAnthropic(`${pp}\n\nWelcome new VYVE member. Warm, specific, no AI mention.\nIMPORTANT: Only reference information explicitly provided below. NEVER invent or assume weight, body measurements, target weights, health conditions, or any specifics not stated by the member.\nSESSIONS:\n${ls}\n3 recs: 1.Workout:${on} ready 2.Live session 3.First-week action${isQuickPath(d)?'\nQuick-start':''}\nMEMBER:\n${sm}${sens?'\nSENSITIVE':''}\nDash per rec, plain text.`,`3 recs for ${d.firstName}.`,600);}

// --- Workout Plan Generation (inline, was generate-workout-plan EF) ---

interface ExerciseRow { exercise_name: string; sets?: string; reps?: string; rest_seconds?: number; notes?: string; video_url?: string; thumbnail_url?: string; }
interface WorkoutDay { session_name: string; session_label?: string; exercises: ExerciseRow[]; }
interface WorkoutPlan { weeks: WorkoutDay[][]; programme_name: string; split_type: string; plan_type: string; }

function buildWorkoutContext(d: Record<string,unknown>, planType: string, exerciseLibrary: Record<string,unknown>[]): string {
  const injuries = ((d.injuries as string[])||[]).join(', ') || 'none';
  const avoid = String(d.avoidExercises||'none');
  const exp = String(d.gymExperience||'Beginner');
  const goals = ((d.trainingGoals as string[])||[]).join(', ') || 'general fitness';
  const days = parseInt(String(d.trainDays))||3;
  const loc = String(d.trainingLocation||'gym');
  const equipment = ((d.equipment as string[])||[]).join(', ') || 'standard gym';
  const s = (d.scores as Record<string,string>)||{};

  const exNames = exerciseLibrary.slice(0,120).map((e:Record<string,unknown>)=>String(e.exercise_name||'')).filter(Boolean);
  const exList = exNames.join(', ');

  return `Member profile:
- Plan type: ${planType} (${SPLITS[planType]})
- Experience: ${exp}
- Training days/week: ${days}
- Location: ${loc}
- Equipment: ${equipment}
- Goals: ${goals}
- Injuries/limitations: ${injuries}
- Exercises to avoid: ${avoid}
- Energy score: ${s.energy||'5'}/10
- Wellbeing score: ${s.wellbeing||'5'}/10

Available exercises from VYVE library (use these names exactly when possible):
${exList}`;
}

function buildWeeksPrompt(d: Record<string,unknown>, planType: string, context: string, weeksRange: string): string {
  const days = parseInt(String(d.trainDays))||3;
  const split = SPLITS[planType];
  return `You are building ${weeksRange} of an 8-week personalised workout programme for a VYVE Health member.

${context}

RULES:
- Generate exactly ${weeksRange === 'weeks 1-4' ? 4 : 4} weeks of workouts
- Each week has exactly ${days} workout sessions
- Session names must be consistent with the ${split} split
- Each session has 4-6 exercises
- For each exercise include: exercise_name, sets (e.g. "3"), reps (e.g. "8-12" or "10"), rest_seconds (e.g. 60), notes (optional form tip)
- Progressive overload: ${weeksRange === 'weeks 1-4' ? 'weeks 1-2 slightly lighter to build form, weeks 3-4 increase intensity' : 'weeks 5-6 increase volume, weeks 7-8 peak intensity'}
- Use exercise names from the library list when possible
- NEVER include exercises from the injuries/avoid list

Respond ONLY with valid JSON. No preamble. No explanation. No markdown. Schema:
{
  "weeks": [
    {
      "week_number": 1,
      "sessions": [
        {
          "session_name": "Push A",
          "session_label": "Session 1",
          "exercises": [
            {"exercise_name": "Bench Press", "sets": "3", "reps": "8-10", "rest_seconds": 90, "notes": "Control the descent"}
          ]
        }
      ]
    }
  ]
}`;
}

function parseWeeksArray(text: string): WorkoutDay[][] {
  const clean = text.replace(/```json|```/g,'').trim();
  let parsed: Record<string,unknown>;
  try { parsed = JSON.parse(clean); } catch(_) { return []; }
  const weeks = (parsed.weeks as Record<string,unknown>[]) || [];
  return weeks.map(w => {
    const sessions = (w.sessions as Record<string,unknown>[]) || [];
    return sessions.map(s => ({
      session_name: String(s.session_name||'Session'),
      session_label: String(s.session_label||''),
      exercises: ((s.exercises as Record<string,unknown>[])||[]).map(e => ({
        exercise_name: String(e.exercise_name||''),
        sets: String(e.sets||'3'),
        reps: String(e.reps||'10'),
        rest_seconds: parseInt(String(e.rest_seconds||60)),
        notes: String(e.notes||''),
      }))
    }));
  });
}

function enrichWithVideoUrls(weeks: WorkoutDay[][], exerciseLibrary: Record<string,unknown>[]): {weeks: WorkoutDay[]; matched: number; unmatched: number}[] {
  const libMap: Record<string,{video_url:string;thumbnail_url:string}> = {};
  for (const ex of exerciseLibrary) {
    const name = String(ex.exercise_name||'').toLowerCase().trim();
    if (name) libMap[name] = {video_url: String(ex.video_url||''), thumbnail_url: String(ex.thumbnail_url||'')};
  }
  let totalMatched = 0, totalUnmatched = 0;
  const enriched = weeks.map(sessions => {
    let wMatched = 0, wUnmatched = 0;
    const enrichedSessions = sessions.map(session => ({
      ...session,
      exercises: session.exercises.map(ex => {
        const key = ex.exercise_name.toLowerCase().trim();
        const urls = libMap[key];
        if (urls?.video_url) { wMatched++; return {...ex, ...urls}; }
        wUnmatched++;
        return ex;
      })
    }));
    totalMatched += wMatched; totalUnmatched += wUnmatched;
    return {weeks: enrichedSessions, matched: wMatched, unmatched: wUnmatched};
  });
  return enriched;
}

async function generateWorkoutPlan(d: Record<string,unknown>, exerciseLibrary: Record<string,unknown>[]): Promise<{plan: WorkoutDay[][];programme_name:string;plan_type:string;videos_matched:number;videos_unmatched:number}> {
  const {planType} = selectPlanType(d);
  const context = buildWorkoutContext(d, planType, exerciseLibrary);
  const prompt14 = buildWeeksPrompt(d, planType, context, 'weeks 1-4');
  const prompt58 = buildWeeksPrompt(d, planType, context, 'weeks 5-8');

  // Parallel AI calls for weeks 1-4 and 5-8
  const [r14, r58] = await Promise.all([
    callAnthropicFull(null, prompt14, 16000),
    callAnthropicFull(null, prompt58, 16000)
  ]);

  if (r14.stopReason === 'max_tokens') console.warn('Weeks 1-4 hit max_tokens');
  if (r58.stopReason === 'max_tokens') console.warn('Weeks 5-8 hit max_tokens');

  const weeks14 = parseWeeksArray(r14.text);
  const weeks58 = parseWeeksArray(r58.text);
  const allWeeks = [...weeks14, ...weeks58];

  console.log(`Workout plan parsed: ${allWeeks.length} weeks (expected 8)`);

  // Enrich with video URLs
  let totalMatched = 0, totalUnmatched = 0;
  const enriched = allWeeks.map(sessions => {
    const libMap: Record<string,{video_url:string;thumbnail_url:string}> = {};
    for (const ex of exerciseLibrary) {
      const name = String(ex.exercise_name||'').toLowerCase().trim();
      if (name) libMap[name] = {video_url: String(ex.video_url||''), thumbnail_url: String(ex.thumbnail_url||'')};
    }
    return sessions.map(session => ({
      ...session,
      exercises: session.exercises.map(ex => {
        const key = ex.exercise_name.toLowerCase().trim();
        const urls = libMap[key];
        if (urls?.video_url) { totalMatched++; return {...ex, ...urls}; }
        totalUnmatched++;
        return ex;
      })
    }));
  });

  // Get programme name from overview (passed separately) — use plan type as fallback
  const programmeName = `8-Week ${SPLITS[planType]} Programme`;

  return {
    plan: enriched,
    programme_name: programmeName,
    plan_type: planType,
    videos_matched: totalMatched,
    videos_unmatched: totalUnmatched,
  };
}

async function writeWorkoutPlan(email: string, plan: WorkoutDay[][], programmeName: string, planType: string): Promise<void> {
  const em = email.toLowerCase().trim();
  const payload = {
    member_email: em,
    plan_data: { weeks: plan, programme_name: programmeName, plan_type: planType, generated_at: new Date().toISOString() },
    generated_at: new Date().toISOString(),
    programme_name: programmeName,
    plan_type: planType,
  };
  const r = await fetch(SUPABASE_URL+'/rest/v1/workout_plan_cache?on_conflict=member_email',{
    method:'POST',
    headers:{'Content-Type':'application/json','apikey':SUPABASE_KEY,'Authorization':'Bearer '+SUPABASE_KEY,'Prefer':'resolution=merge-duplicates,return=minimal'},
    body:JSON.stringify(payload)
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error('writeWorkoutPlan: '+t);
  }
  console.log('Workout plan written for', em, '—', plan.length, 'weeks');
}

async function writeMember(d:Record<string,unknown>,persona:string,pr:string,r1:string,r2:string,r3:string):Promise<void>{const s=(d.scores as Record<string,string>)||{};const m={email:(d.email as string).toLowerCase().trim(),first_name:d.firstName,last_name:d.lastName,phone:d.phone||null,persona,persona_reason:pr,persona_assigned_at:new Date().toISOString(),welcome_persona_reason:pr,welcome_rec_1:r1,welcome_rec_2:r2,welcome_rec_3:r3,baseline_wellbeing:parseInt(s.wellbeing)||null,baseline_sleep:parseInt(s.sleep)||null,baseline_energy:parseInt(s.energy)||null,baseline_stress:parseInt(s.stress)||null,baseline_physical:parseInt(s.physical)||null,baseline_diet:parseInt(s.diet)||null,baseline_social:parseInt(s.social)||null,baseline_motivation:parseInt(s.motivation)||null,training_location:d.trainingLocation||null,equipment:(d.equipment as string[]||[]).join(', ')||null,injuries:(d.injuries as string[]||[]).join(', ')||null,exercises_to_avoid:d.avoidExercises||null,experience_level:d.gymExperience||null,training_days_per_week:parseInt(String(d.trainDays))||null,sleep_issues:(d.sleepIssues as string[]||[]).join(', ')||null,activity_level:d.activityLevel||null,height_cm:parseFloat(String(d.heightCm))||null,weight_kg:parseFloat(String(d.weightKg))||null,tdee_target:parseInt(String(d.recommendedCalories))||null,social_barriers:(d.socialBarriers as string[]||[]).join(', ')||null,life_context:(d.lifeContext as string[]),life_context_detail:d.lifeContextExtra||null,alcohol_frequency:d.alcohol||null,sensitive_context:(d.lifeContext as string[]||[]).some(c=>SENSITIVE_CONTEXT.includes(c)),past_barriers:(d.pastBarriers as string[]||[]).join(', ')||null,success_vision:d.successVision||null,goal_style:d.goalStyle||null,contact_preference:d.contactPreference||null,tone_preference:d.tonePreference||null,overwhelm_response:(d.overwhelmedPref as string[]||[]).join(', ')||null,has_smartphone:d.smartphone==='Apple'||d.smartphone==='Android',has_smartwatch:d.smartwatch==='Yes',specific_goal:d.specificGoal||null,additional_info:d.anythingElse||null,gender:d.gender||null,gender_self_describe:(d.gender_self_describe as string||'').trim()||null,tdee_formula:d.tdee_formula||null,onboarding_complete:true,onboarding_completed_at:new Date().toISOString(),subscription_status:'active',dob:d.dob as string||null,goal_focus:(d.nutritionGoal as string||null)||((d.trainingGoals as string[]||[]).join(', '))||null,tdee_maintenance:parseInt(String(d.tdeeMaintenance))||null,deficit_percentage:parseInt(String(d.deficitPercentage))||null,support_areas:(d.supportAreas as string[]||[]).join(', ')||null,support_style:(d.supportStyle as string[]||[]).join(', ')||null,motivation_help:(d.motivationHelp as string[]||[]).join(', ')||null,training_goals:(d.trainingGoals as string[]||[]).join(', ')||null,barriers:(d.barriers as string[]||[]).join(', ')||null,sleep_hours_range:d.sleepHours as string||null,sleep_bedtime:d.bedtime as string||null,sleep_help:(d.sleepHelp as string[]||[]).join(', ')||null,social_help:(d.socialHelp as string[]||[]).join(', ')||null,nutrition_guidance:d.nutritionGuidance as string||null,location:d.location as string||null,weight_unit:d.weightUnit as string||null,height_unit:d.heightUnit as string||null,cert_habits_count:0,cert_workouts_count:0,cert_cardio_count:0,cert_checkins_count:0,cert_sessions_count:0,milestone_level:null,milestone_message:null,milestone_read:false};const res=await fetch(SUPABASE_URL+'/rest/v1/members?on_conflict=email',{method:'POST',headers:{'Content-Type':'application/json','apikey':SUPABASE_KEY,'Authorization':'Bearer '+SUPABASE_KEY,'Prefer':'resolution=merge-duplicates,return=minimal'},body:JSON.stringify(m)});if(!res.ok)throw new Error('Member write: '+await res.text());}

async function writeWeeklyGoals(e:string):Promise<void>{const n=new Date(),d=n.getUTCDay(),m=new Date(n);m.setUTCDate(n.getUTCDate()+(d===0?-6:1-d));await fetch(SUPABASE_URL+'/rest/v1/weekly_goals?on_conflict=member_email,week_start',{method:'POST',headers:{'Content-Type':'application/json','apikey':SUPABASE_KEY,'Authorization':'Bearer '+SUPABASE_KEY,'Prefer':'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({member_email:e.toLowerCase().trim(),week_start:m.toISOString().slice(0,10),habits_target:3,workouts_target:2,cardio_target:1,sessions_target:1,checkin_target:1})});}
async function writeAiInteraction(e:string,p:string,r1:string,r2:string,r3:string,dl:Record<string,unknown>):Promise<void>{await fetch(SUPABASE_URL+'/rest/v1/ai_interactions',{method:'POST',headers:{'Content-Type':'application/json','apikey':SUPABASE_KEY,'Authorization':'Bearer '+SUPABASE_KEY,'Prefer':'return=minimal'},body:JSON.stringify({member_email:e.toLowerCase().trim(),triggered_by:'onboarding',persona:p,prompt_summary:'Onboarding recs',recommendation:'1. '+r1+'\n2. '+r2+'\n3. '+r3,decision_log:dl,acted_on:false,created_at:new Date().toISOString()})});}
async function writeAiDecisions(e:string,p:string,ar:string,hi:string[],hr:string,lib:{id:string;habit_title:string}[]):Promise<void>{const nm=lib.filter(h=>hi.includes(h.id)).map(h=>h.habit_title).join(', ');await fetch(SUPABASE_URL+'/rest/v1/ai_decisions',{method:'POST',headers:{'Content-Type':'application/json','apikey':SUPABASE_KEY,'Authorization':'Bearer '+SUPABASE_KEY,'Prefer':'return=minimal'},body:JSON.stringify([{member_email:e.toLowerCase().trim(),decision_type:'persona_assigned',decision_value:p,reasoning:ar,triggered_by:'onboarding',created_at:new Date().toISOString()},{member_email:e.toLowerCase().trim(),decision_type:'habit_assigned',decision_value:nm,reasoning:hr,triggered_by:'onboarding',created_at:new Date().toISOString()}])});}
async function writeHabits(e:string,ids:string[]):Promise<void>{const em=e.toLowerCase().trim(),now=new Date().toISOString();const rows=ids.map(id=>({member_email:em,habit_id:id,assigned_at:now,assigned_by:'onboarding',active:true}));const r=await fetch(SUPABASE_URL+'/rest/v1/member_habits',{method:'POST',headers:{'Content-Type':'application/json','apikey':SUPABASE_KEY,'Authorization':'Bearer '+SUPABASE_KEY,'Prefer':'return=minimal'},body:JSON.stringify(rows)});if(!r.ok){const t=await r.text();throw new Error('writeHabits: '+t);}}
async function createAuthUser(e:string,fn:string,ln:string):Promise<string|null>{const r=await fetch(SUPABASE_URL+'/auth/v1/admin/users',{method:'POST',headers:{'Content-Type':'application/json','apikey':SUPABASE_KEY,'Authorization':'Bearer '+SUPABASE_KEY},body:JSON.stringify({email:e,email_confirm:true,user_metadata:{full_name:(fn+' '+ln).trim(),first_name:fn,last_name:ln}})});const d=await r.json();let uid=d.id;if(!r.ok){if(d.msg?.includes('already been registered')||d.code==='email_exists'){const lr=await fetch(SUPABASE_URL+'/auth/v1/admin/users?email='+encodeURIComponent(e),{headers:{apikey:SUPABASE_KEY,'Authorization':'Bearer '+SUPABASE_KEY}});uid=(await lr.json()).users?.[0]?.id;}else return null;}if(!uid)return null;const lr2=await fetch(SUPABASE_URL+'/auth/v1/admin/generate_link',{method:'POST',headers:{'Content-Type':'application/json','apikey':SUPABASE_KEY,'Authorization':'Bearer '+SUPABASE_KEY},body:JSON.stringify({type:'recovery',email:e,redirect_to:'https://online.vyvehealth.co.uk/set-password.html'})});return(await lr2.json()).action_link||null;}

async function sendWelcomeEmail(e:string,fn:string,persona:string,pr:string,r1:string,r2:string,r3:string,pwl:string|null,on:string,or:string):Promise<void>{if(!BREVO_KEY)return;const lu=pwl||'https://online.vyvehealth.co.uk/login.html',bl=pwl?'Set your password &amp; sign in':'Sign in to VYVE';const pwa=`<tr><td style="padding:0 32px 28px;"><p style="margin:0 0 12px;font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#1B7878;">Download the VYVE Health app</p><table width="100%" cellpadding="0" cellspacing="0"><tr><td width="48%" style="vertical-align:top;background:#F0F9F9;border-radius:8px;padding:16px 18px;"><p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#0D2B2B;">iPhone</p><ol style="margin:0;padding-left:18px;font-size:13px;color:#3A5A5A;line-height:1.8;"><li>Open in Safari</li><li>Tap Share</li><li>Add to Home Screen</li></ol></td><td width="4%"></td><td width="48%" style="vertical-align:top;background:#F0F9F9;border-radius:8px;padding:16px 18px;"><p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#0D2B2B;">Android</p><ol style="margin:0;padding-left:18px;font-size:13px;color:#3A5A5A;line-height:1.8;"><li>Open in Chrome</li><li>Tap &#9285; menu</li><li>Add to Home screen</li></ol></td></tr></table></td></tr>`;const html=`<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="margin:0;padding:0;background:#F4FAFA;font-family:Helvetica Neue,Arial,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#F4FAFA;padding:40px 20px;"><tr><td align="center"><table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 16px rgba(13,43,43,0.08);"><tr><td style="background:#0D2B2B;padding:24px 32px;"><div style="font-family:Georgia,serif;font-size:20px;letter-spacing:6px;color:#fff;">VYVE</div></td></tr><tr><td style="padding:32px;"><h2 style="margin:0 0 8px;font-size:24px;font-family:Georgia,serif;color:#0D2B2B;font-weight:400;">Welcome to VYVE, ${fn}.</h2><p style="margin:0 0 24px;font-size:15px;color:#3A5A5A;line-height:1.7;">You are in. Habits loaded, 8-week programme ready.</p><div style="background:#F0F9F9;border-radius:8px;padding:20px 24px;margin-bottom:24px;"><p style="margin:0 0 4px;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#1B7878;">Your Coach</p><p style="margin:0;font-size:20px;font-weight:700;color:#0D2B2B;">${persona}</p><p style="margin:8px 0 0;font-size:14px;color:#3A5A5A;line-height:1.6;">${pr}</p></div><div style="background:#F4FAFA;border-radius:8px;padding:16px 20px;margin-bottom:24px;border-left:3px solid #4DAAAA;"><p style="margin:0 0 4px;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#1B7878;">Your Programme</p><p style="margin:0;font-size:15px;font-weight:600;color:#0D2B2B;">${on}</p><p style="margin:8px 0 0;font-size:14px;color:#3A5A5A;line-height:1.6;">${or}</p></div><p style="margin:0 0 12px;font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#1B7878;">Your first week</p><div style="border-left:3px solid #4DAAAA;padding:0 0 0 16px;margin-bottom:14px;"><p style="margin:0;font-size:14px;color:#3A5A5A;line-height:1.65;">${r1}</p></div><div style="border-left:3px solid #4DAAAA;padding:0 0 0 16px;margin-bottom:14px;"><p style="margin:0;font-size:14px;color:#3A5A5A;line-height:1.65;">${r2}</p></div><div style="border-left:3px solid #4DAAAA;padding:0 0 0 16px;margin-bottom:28px;"><p style="margin:0;font-size:14px;color:#3A5A5A;line-height:1.65;">${r3}</p></div><div style="text-align:center;margin:0 0 28px;"><a href="${lu}" style="background:#0D2B2B;color:#fff;text-decoration:none;padding:16px 36px;border-radius:8px;font-size:15px;font-weight:600;display:inline-block;">${bl} &rarr;</a></div></td></tr>${pwa}<tr><td style="background:#F4FAFA;padding:20px 32px;border-top:1px solid #C8E4E4;"><p style="margin:0;font-size:12px;color:#7A9A9A;">VYVE Health CIC &middot; team@vyvehealth.co.uk &middot; ICO 00013608608</p></td></tr></table></td></tr></table></body></html>`;await fetch('https://api.brevo.com/v3/smtp/email',{method:'POST',headers:{'api-key':BREVO_KEY,'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify({sender:{name:'VYVE Health',email:'team@vyvehealth.co.uk'},to:[{email:e,name:fn}],bcc:[{email:'team@vyvehealth.co.uk',name:'VYVE Team'}],subject:'Welcome to VYVE, '+fn+' \u2014 your programme is ready',htmlContent:html,tags:['welcome','onboarding']}));}

serve(async(req)=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:CORS});
  let phase='init',email='unknown';
  let data: Record<string,unknown>|null = null;
  try{
    phase='parse_request';
    try{const raw=await req.text();console.log('Onboarding CT:',req.headers.get('content-type'),'Len:',raw.length);data=JSON.parse(raw);
    }catch(e){console.error('Parse:',e);try{await sendErrorAlert('onboarding','parse','unknown',String(e));}catch(_){}return new Response(JSON.stringify({error:'Invalid body. Use Safari/Chrome, not Messenger.'}),{status:400,headers:{...CORS,'Content-Type':'application/json'}});}
    if(!data!.email||!data!.firstName)return new Response(JSON.stringify({error:'Missing email/name'}),{status:400,headers:{...CORS,'Content-Type':'application/json'}});
    email=(data!.email as string).toLowerCase().trim();
    const fn=data!.firstName as string,ln=data!.lastName as string||'';
    console.log('Start v67:',email,fn,ln);

    // BATCH 1 (parallel): persona + programme overview + habit library + service catalogue + exercise library
    phase='batch1_parallel_fetch';
    const[personaResult,overviewResult,hlr,cr,elr]=await Promise.all([
      selectPersona(data!),
      generateProgrammeOverview(data!),
      fetch(SUPABASE_URL+'/rest/v1/habit_library?active=eq.true&select=id,habit_pot,habit_title,difficulty',{headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+SUPABASE_KEY}}),
      fetch(SUPABASE_URL+'/rest/v1/service_catalogue?active=eq.true&select=type,category,name,description,duration_minutes,schedule_day,schedule_time&order=schedule_day.asc',{headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+SUPABASE_KEY}}),
      fetch(SUPABASE_URL+'/rest/v1/workout_plans?select=exercise_name,video_url,thumbnail_url&order=exercise_name.asc',{headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+SUPABASE_KEY}}),
    ]);
    const{persona,reason:personaReason,method:pm,aiReasoning}=personaResult;
    const ov=overviewResult;
    const hl=hlr.ok?await hlr.json():[];
    const cat:Record<string,unknown>[]=cr.ok?await cr.json():[];
    const exerciseLibrary:Record<string,unknown>[]=elr.ok?await elr.json():[];
    const ls=cat.filter(s=>s.type==='live_session').map(s=>'- '+s.category+': '+s.schedule_day+'s '+s.schedule_time+' ('+s.duration_minutes+'m)').join('\n');
    const{planType,planReason}=selectPlanType(data!);
    console.log('Batch 1 complete. Persona:',persona,'Plan:',planType,'ExLib:',exerciseLibrary.length);

    // BATCH 2 (parallel): habits + recs + workout plan (weeks 1-4 and 5-8 in parallel inside generateWorkoutPlan)
    phase='batch2_parallel_ai';
    const[habitResult,recsText,workoutPlanResult]=await Promise.all([
      selectHabits(data!,hl),
      generateRecommendations(data!,persona,ls,ov.programme_name),
      generateWorkoutPlan(data!,exerciseLibrary),
    ]);
    const{ids:hids,reasoning:hreas}=habitResult;
    const rl=recsText.split('\n').filter((l:string)=>l.trim().startsWith('-')).map((l:string)=>l.replace(/^-\s*/,'').trim()).filter(Boolean);
    const r1=rl[0]||`${ov.programme_name} is ready.`,r2=rl[1]||'Join a live session.',r3=rl[2]||'Complete your check-in.';
    const dl=buildDecisionLog(data!,persona,planType,planReason,pm,personaReason);
    console.log('Batch 2 complete. Habits:',hids.length,'WorkoutWeeks:',workoutPlanResult.plan.length,'Videos matched:',workoutPlanResult.videos_matched);

    // Use programme name from overview if available, else from workout plan
    const finalProgrammeName = ov.programme_name || workoutPlanResult.programme_name;

    phase='auth_and_member_write';
    const[pwl]=await Promise.all([createAuthUser(email,fn,ln),writeMember(data!,persona,personaReason,r1,r2,r3)]);

    phase='reset_existing_data';
    await resetMemberData(email);

    phase='secondary_writes';
    const hlf=await fetch(SUPABASE_URL+'/rest/v1/habit_library?active=eq.true&select=id,habit_title',{headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+SUPABASE_KEY}}).then(r=>r.json()).catch(()=>hl);
    await Promise.all([
      writeHabits(email,hids),
      writeWorkoutPlan(email,workoutPlanResult.plan,finalProgrammeName,workoutPlanResult.plan_type),
      writeAiInteraction(email,persona,r1,r2,r3,dl),
      writeWeeklyGoals(email),
      writeAiDecisions(email,persona,aiReasoning,hids,hreas,hlf),
      MAKE_WEBHOOK?fetch(MAKE_WEBHOOK,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,first_name:fn,last_name:ln,persona,persona_reason:personaReason,rec_1:r1,rec_2:r2,rec_3:r3})}).catch(()=>{}):Promise.resolve()
    ]);

    phase='welcome_email';
    await sendWelcomeEmail(email,fn,persona,personaReason,r1,r2,r3,pwl as string|null,finalProgrammeName,ov.rationale);

    console.log('DONE v67:',email,persona,'WorkoutPlan:',workoutPlanResult.plan.length,'weeks');
    return new Response(JSON.stringify({
      success:true,
      persona,
      persona_reason:personaReason,
      ai_reasoning:aiReasoning,
      programme_overview:ov,
      rec_1:r1,rec_2:r2,rec_3:r3,
      habits_assigned:hids,
      habit_reasoning:hreas,
      full_response:recsText,
      decision_log:dl,
      workout_plan:{
        programme_name:finalProgrammeName,
        weeks_generated:workoutPlanResult.plan.length,
        videos_matched:workoutPlanResult.videos_matched,
        videos_unmatched:workoutPlanResult.videos_unmatched,
      }
    }),{headers:{...CORS,'Content-Type':'application/json'}});
  }catch(err){
    console.error(`FAIL [${phase}] [${email}]:`,err);
    try{await sendErrorAlert('onboarding',phase,email,String(err));}catch(_){}
    if(data){try{await sendAnswersBackup(data);}catch(_){console.error('Answers backup failed');}}
    return new Response(JSON.stringify({error:`Onboarding failed at ${phase}: ${String(err)}`}),{status:500,headers:{...CORS,'Content-Type':'application/json'}});
  }
});
