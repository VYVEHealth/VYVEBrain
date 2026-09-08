// VYVE Health — coach-help v3 (PM-1082, Trainerize W2b, gap map #112)
// In-portal help assistant for the Coach Portal. Coach JWT only.
//
// Flow per question:
//   auth (JWT → email) → partner via get_my_partner_id (partner_type must be 'coach') →
//   input hygiene (1–500 chars, letters present, 3 s min interval, duplicate-of-last) →
//   caps (per-coach 40 Anthropic calls/day, global budget with a platform_alerts high row at 80 %) →
//   answer cache (coach_help_cache, sha256(surface|corpus_version|model|qnorm), 30-day TTL, first-turn only) →
//   topic gate (Haiku, question only, no corpus; OFF = fixed refusal, no corpus call) →
//   answer (Haiku default / Sonnet flag; system = instructions + corpus with prompt caching; JSON reply) →
//   coach_help_log row (kind answer|refusal|cache_hit — own table: ai_interactions is FK'd to members.email and coaches are not members) → cache write.
// {action:'feedback', id, helpful} stamps helpful on the coach's own coach_help_log row.
//
// verify_jwt: true at the platform; internal getUser() as the second gate.
// CORS: Allow-Origin * (JWT-authenticated, no ambient credentials — §23.189a).
// Corpus source of truth: public.coach_help_corpus (surface='coach'); brain mirror playbooks/coach-help-corpus.md.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SURFACE = "coach";
const PER_COACH_DAILY_CAP = 40;        // Anthropic-calling questions per coach per UTC day (cache hits are free)
const GLOBAL_DAILY_BUDGET = 400;       // Anthropic-calling questions across all coaches per UTC day
const BUDGET_ALERT_AT = 0.8;
const MIN_INTERVAL_MS = 3000;
const MAX_Q_CHARS = 500;
const MAX_HISTORY_TURNS = 4;
const CACHE_TTL_DAYS = 30;
const CORPUS_TTL_MS = 5 * 60 * 1000;
const MODELS: Record<string, string> = { haiku: "claude-haiku-4-5", sonnet: "claude-sonnet-4-5" };
const GATE_MODEL = "claude-haiku-4-5";

const ROUTES = new Set([
  "dashboard","clients","clients_checkins","clients_daily","clients_batch","leads","messages","calendar","content",
  "exercises","notifications","automations","profile","settings","terms",
  "kindsel:program","kindsel:workout","kindsel:workout_day","kindsel:nutrition","kindsel:meal","kindsel:food",
  "kindsel:supplements","kindsel:onboarding","kindsel:checkin","kindsel:habits","kindsel:lead",
]);

const REFUSAL = "That one's outside what I can help with. I can help with anything in the coach portal — clients, programmes, nutrition plans, check-ins, messages, automations, your calendar and your profile. What are you trying to do?";

const GATE_SYSTEM = `You classify one message for a help assistant that lives inside the VYVE Coach Portal — a web tool where personal trainers and coaches manage clients, workout programmes, nutrition plans, check-in forms, daily habits, messages, automations, calendar and calls, content library, leads, their public profile, settings, and questions about how VYVE pays coaches.
Reply with exactly ON or OFF and nothing else.
ON = a question or request about using that portal or the VYVE Health app, or about coaching clients through VYVE, including vague, short, misspelt or shorthand ones; also greetings, thanks and "what can you do".
OFF = anything else: sport, news, weather, general fitness or nutrition science not about the portal, coding, other apps, personal chat, or gibberish with no readable request.`;

const ANSWER_SYSTEM = `You are the in-portal help assistant for the VYVE Coach Portal. Answer ONLY from the corpus that follows this message. Never invent a button, setting, page or feature that is not in the corpus. If the corpus does not cover the request, say so in one sentence and point to the nearest covered task.

Reply with a single JSON object and nothing else (no code fences):
{"ack": "one short sentence acknowledging what they want and the easiest way to do it",
 "clarify": null or "one question — ONLY when you genuinely cannot tell which of two covered tasks they mean and the steps would differ",
 "steps": ["numbered steps using the exact on-screen labels from the corpus, bold labels with **…**", ...],
 "constraints": ["short bullets: limits, timing, what must be true first", ...],
 "related": null or "one sentence naming the next task they will probably need",
 "route": null or one of the exact route strings listed in the corpus,
 "route_label": null or a 2–4 word button label such as "Open Clients"}

Rules: British English, second person, plain words, no emojis, no marketing. Tolerate typos and shorthand silently. Prefer answering over asking: pick the most direct path that matches their words ("give", "send", "assign" = assign what exists; "build", "create", "make" = build it) and mention the other path in "related". If "clarify" is set, keep "steps" empty. Keep steps to 8 or fewer. For a greeting or "what can you do", set ack to a one-line welcome, steps empty, and constraints to 4–6 things you can help with. Return the route that opens the page where the first step happens.`;

type Json = Record<string, unknown>;
const j = (status: number, body: Json, cors: Record<string, string>) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

let corpusCache: { body: string; version: number; at: number } | null = null;

async function sha256(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
function normalise(q: string): string {
  return q.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
}

Deno.serve(async (req: Request) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, apikey, content-type",
  };
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return j(405, { error: "Method not allowed" }, cors);

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
  const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const ANTHROPIC = Deno.env.get("ANTHROPIC_API_KEY") ?? "";
  const svcHeaders = { apikey: SERVICE, Authorization: `Bearer ${SERVICE}`, "Content-Type": "application/json" };

  // ---- auth ----
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) return j(401, { error: "Missing authorization token" }, cors);
  const userClient = createClient(SUPABASE_URL, ANON, { global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user?.email) return j(401, { error: "Invalid or expired token" }, cors);
  const email = user.email.toLowerCase();

  // ---- partner gate: coach partners only ----
  const pidRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_my_partner_id`, {
    method: "POST", headers: { apikey: ANON, Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: "{}",
  });
  const partnerId = pidRes.ok ? await pidRes.json().catch(() => null) : null;
  if (!partnerId || typeof partnerId !== "string") return j(403, { error: "Coach account required" }, cors);
  const ppRes = await fetch(`${SUPABASE_URL}/rest/v1/partner_partners?id=eq.${partnerId}&select=partner_type,name`, { headers: svcHeaders });
  const pp = ppRes.ok ? (await ppRes.json())[0] : null;
  if (!pp || pp.partner_type !== "coach") return j(403, { error: "Coach account required" }, cors);

  // ---- body ----
  let body: Json;
  try { body = await req.json(); } catch { return j(400, { error: "Invalid JSON body" }, cors); }
  const action = String(body.action ?? "ask");

  // ---- feedback ----
  if (action === "feedback") {
    const id = String(body.id ?? "");
    const helpful = body.helpful === true ? true : body.helpful === false ? false : null;
    if (!/^[0-9a-f-]{36}$/.test(id) || helpful === null) return j(400, { error: "id and helpful required" }, cors);
    const up = await fetch(`${SUPABASE_URL}/rest/v1/coach_help_log?id=eq.${id}&partner_id=eq.${partnerId}&select=id`, {
      method: "PATCH", headers: { ...svcHeaders, Prefer: "return=representation" }, body: JSON.stringify({ helpful, feedback_at: new Date().toISOString() }),
    });
    const upd = up.ok ? await up.json() : [];
    if (!upd.length) return j(404, { error: "Not found" }, cors);
    return j(200, { ok: true }, cors);
  }
  if (action !== "ask") return j(400, { error: "Unknown action" }, cors);

  // ---- input hygiene ----
  const question = String(body.question ?? "").replace(/\s+/g, " ").trim();
  const modelKey = body.model === "sonnet" ? "sonnet" : "haiku";
  const model = MODELS[modelKey];
  const rawHistory = Array.isArray(body.history) ? body.history : [];
  const history = rawHistory
    .filter((m: any) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .slice(-MAX_HISTORY_TURNS)
    .map((m: any) => ({ role: m.role, content: String(m.content).slice(0, 1200) }));
  const firstTurn = history.length === 0;
  if (!question) return j(400, { error: "Ask a question" }, cors);
  if (question.length > MAX_Q_CHARS) return j(400, { error: `Keep it under ${MAX_Q_CHARS} characters` }, cors);
  const qnorm = normalise(question);
  const hasLetters = /\p{L}{2,}/u.test(qnorm);

  // ---- today's usage (per coach + global) ----
  const dayStart = new Date(); dayStart.setUTCHours(0, 0, 0, 0);
  const todayIso = dayStart.toISOString();
  const usageRes = await fetch(
    `${SUPABASE_URL}/rest/v1/coach_help_log?surface=eq.${SURFACE}&created_at=gte.${todayIso}&select=coach_email,created_at,kind,question_norm,answer,model&order=created_at.desc`,
    { headers: svcHeaders },
  );
  const todays: any[] = usageRes.ok ? await usageRes.json() : [];
  const billable = (r: any) => r?.kind === "answer" || r?.kind === "refusal";
  const mine = todays.filter((r) => r.coach_email === email);
  const usedByMe = mine.filter(billable).length;
  const usedGlobal = todays.filter(billable).length;
  const remaining = Math.max(0, PER_COACH_DAILY_CAP - usedByMe);

  const last = mine[0];
  if (last && Date.now() - new Date(last.created_at).getTime() < MIN_INTERVAL_MS) {
    return j(429, { error: "One moment — send that again in a couple of seconds", remaining }, cors);
  }
  if (last && last.question_norm === qnorm && last.answer && Date.now() - new Date(last.created_at).getTime() < 120000) {
    return j(200, { id: null, answer: last.answer, remaining, cached: true, model: last.model ?? model }, cors);
  }

  async function log(kind: string, extra: Json, answer: Json | null): Promise<string | null> {
    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/coach_help_log`, {
        method: "POST", headers: { ...svcHeaders, Prefer: "return=representation" },
        body: JSON.stringify({
          partner_id: partnerId, coach_email: email, surface: SURFACE, kind, model,
          question: question.slice(0, 500), question_norm: qnorm, first_turn: firstTurn, answer, ...extra,
        }),
      });
      if (!r.ok) { console.warn("[coach-help] coach_help_log write failed:", r.status, (await r.text()).slice(0, 200)); return null; }
      const rows = await r.json();
      return rows[0]?.id ?? null;
    } catch (e) { console.warn("[coach-help] coach_help_log write failed:", (e as Error).message); return null; }
  }

  // gibberish / no letters → fixed refusal, no model call, logged as refusal (counts: it is abuse-shaped)
  if (!hasLetters) {
    const id = await log("refusal", { reason: "no_letters" }, null);
    return j(200, { id, answer: { ack: REFUSAL, steps: [], constraints: [], related: null, route: null }, remaining: Math.max(0, remaining - 1), refused: true, model }, cors);
  }

  // ---- corpus ----
  if (!corpusCache || Date.now() - corpusCache.at > CORPUS_TTL_MS) {
    const cr = await fetch(`${SUPABASE_URL}/rest/v1/coach_help_corpus?surface=eq.${SURFACE}&select=body,version`, { headers: svcHeaders });
    const row = cr.ok ? (await cr.json())[0] : null;
    if (!row) return j(500, { error: "Help corpus missing" }, cors);
    corpusCache = { body: row.body, version: row.version, at: Date.now() };
  }
  const corpus = corpusCache;

  // ---- answer cache (first turn only) ----
  const qhash = await sha256(`${SURFACE}|${corpus.version}|${modelKey}|${qnorm}`);
  if (firstTurn) {
    const cutoff = new Date(Date.now() - CACHE_TTL_DAYS * 86400000).toISOString();
    const hit = await fetch(`${SUPABASE_URL}/rest/v1/coach_help_cache?qhash=eq.${qhash}&created_at=gte.${cutoff}&select=answer,hits`, { headers: svcHeaders });
    const rows = hit.ok ? await hit.json() : [];
    if (rows[0]) {
      const answer = rows[0].answer;
      EdgeRuntime.waitUntil(fetch(`${SUPABASE_URL}/rest/v1/coach_help_cache?qhash=eq.${qhash}`, {
        method: "PATCH", headers: { ...svcHeaders, Prefer: "return=minimal" }, body: JSON.stringify({ hits: (rows[0].hits ?? 0) + 1, last_hit_at: new Date().toISOString() }),
      }));
      const id = await log("cache_hit", { qhash, corpus_version: corpus.version }, answer);
      return j(200, { id, answer, remaining, cached: true, model }, cors);
    }
  }

  // ---- caps (after the cache: cached answers stay free once a coach is capped) ----
  if (usedByMe >= PER_COACH_DAILY_CAP) {
    return j(429, { error: "You've used today's 40 questions — it resets at midnight UTC. Email team@vyvehealth.co.uk if you're stuck.", remaining: 0, cap: true }, cors);
  }
  if (usedGlobal >= GLOBAL_DAILY_BUDGET) {
    return j(503, { error: "Help is resting for the day — try again tomorrow or email team@vyvehealth.co.uk.", remaining, budget: true }, cors);
  }
  if (usedGlobal + 1 >= Math.ceil(GLOBAL_DAILY_BUDGET * BUDGET_ALERT_AT)) {
    EdgeRuntime.waitUntil((async () => {
      try {
        const fp = `coach_help_budget_${todayIso.slice(0, 10)}`;
        const ex = await fetch(`${SUPABASE_URL}/rest/v1/platform_alerts?fingerprint=eq.${fp}&select=id`, { headers: svcHeaders });
        if (ex.ok && (await ex.json()).length === 0) {
          await fetch(`${SUPABASE_URL}/rest/v1/platform_alerts`, {
            method: "POST", headers: { ...svcHeaders, Prefer: "return=minimal" },
            body: JSON.stringify({ severity: "high", type: "coach_help_budget", source: "coach-help", member_email: null, page: "coach-portal",
              details: `coach-help has used ${usedGlobal + 1}/${GLOBAL_DAILY_BUDGET} Anthropic calls today (${Math.round(BUDGET_ALERT_AT * 100)}% threshold).`, fingerprint: fp }),
          });
        }
      } catch (e) { console.warn("[coach-help] budget alert failed:", (e as Error).message); }
    })());
  }

  if (!ANTHROPIC) return j(500, { error: "Anthropic API key not configured" }, cors);

  async function anthropic(payload: Json): Promise<any> {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST", headers: { "Content-Type": "application/json", "x-api-key": ANTHROPIC, "anthropic-version": "2023-06-01" }, body: JSON.stringify(payload),
    });
    const d = await r.json();
    if (!r.ok) throw new Error(`anthropic ${r.status}: ${JSON.stringify(d).slice(0, 300)}`);
    return d;
  }

  // ---- topic gate (question only, no corpus) ----
  let gate = "ON"; let gateUsage: unknown = null;
  try {
    const g = await anthropic({ model: GATE_MODEL, max_tokens: 4, system: GATE_SYSTEM, messages: [{ role: "user", content: question }] });
    gateUsage = g?.usage ?? null;
    gate = String(g?.content?.[0]?.text ?? "ON").trim().toUpperCase().startsWith("OFF") ? "OFF" : "ON";
  } catch (e) { console.warn("[coach-help] gate failed, treating as ON:", (e as Error).message); }
  if (gate === "OFF") {
    const id = await log("refusal", { reason: "off_topic", usage: { gate: gateUsage } }, null);
    return j(200, { id, answer: { ack: REFUSAL, steps: [], constraints: [], related: null, route: null }, remaining: Math.max(0, remaining - 1), refused: true, model }, cors);
  }

  // ---- answer (corpus in system with prompt caching) ----
  let answer: Json; let answerUsage: unknown = null; let raw = "";
  try {
    const a = await anthropic({
      model, max_tokens: 800,
      system: [
        { type: "text", text: ANSWER_SYSTEM },
        { type: "text", text: `CORPUS (version ${corpus.version}):\n\n${corpus.body}`, cache_control: { type: "ephemeral" } },
      ],
      messages: [...history, { role: "user", content: question }],
    });
    answerUsage = a?.usage ?? null;
    raw = String(a?.content?.map((c: any) => c?.text ?? "").join("") ?? "");
    const clean = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
    const start = clean.indexOf("{"); const end = clean.lastIndexOf("}");
    const parsed = JSON.parse(clean.slice(start, end + 1));
    answer = {
      ack: String(parsed.ack ?? "").slice(0, 400),
      clarify: parsed.clarify ? String(parsed.clarify).slice(0, 300) : null,
      steps: Array.isArray(parsed.steps) ? parsed.steps.slice(0, 8).map((s: unknown) => String(s).slice(0, 400)) : [],
      constraints: Array.isArray(parsed.constraints) ? parsed.constraints.slice(0, 6).map((s: unknown) => String(s).slice(0, 300)) : [],
      related: parsed.related ? String(parsed.related).slice(0, 300) : null,
      route: ROUTES.has(String(parsed.route)) ? String(parsed.route) : null,
      route_label: parsed.route_label ? String(parsed.route_label).slice(0, 40) : null,
    };
  } catch (e) {
    console.warn("[coach-help] answer failed:", (e as Error).message);
    if (raw) answer = { ack: raw.slice(0, 1200), clarify: null, steps: [], constraints: [], related: null, route: null, route_label: null };
    else return j(502, { error: "Help is unavailable right now — try again in a minute", remaining }, cors);
  }

  const id = await log("answer", { qhash, corpus_version: corpus.version, usage: { gate: gateUsage, answer: answerUsage } }, answer);
  if (firstTurn && answer.steps && (answer.steps as unknown[]).length > 0 && !answer.clarify) {
    EdgeRuntime.waitUntil(fetch(`${SUPABASE_URL}/rest/v1/coach_help_cache`, {
      method: "POST", headers: { ...svcHeaders, Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({ qhash, surface: SURFACE, question_norm: qnorm, answer, model, corpus_version: corpus.version, created_at: new Date().toISOString(), hits: 0 }),
    }));
  }
  return j(200, { id, answer, remaining: Math.max(0, remaining - 1), cached: false, model }, cors);
});
