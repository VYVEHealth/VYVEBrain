// recipe-import — VYVE W7 part 2b (PM-1106)
//
// Member pastes a recipe URL; we fetch the page, pull the ingredients, and hand
// them back for the member to CONFIRM. Nothing is written to nutrition_recipes
// here — the client saves through the existing saveRecipe() path.
//
// THE RISK IS NOT THE PARSE. It is an Edge Function making outbound requests to
// arbitrary member-supplied URLs from inside Supabase's network (SSRF). Two
// distinct holes, two distinct mechanisms:
//
//  1. REDIRECTS. fetch() follows them itself and gives no per-hop hook, so
//     validating the pasted URL validates nothing — block hop 1 and a 302 into
//     169.254.169.254 still lands. Hence redirect:'manual' and a hand-driven
//     chain where EVERY hop goes through the identical gate. The redirect
//     target is not a special case; it is just another URL.
//
//  2. DNS. A hostname that passes every syntactic check can still resolve to a
//     private address. The rigorous fix is resolve-then-pin, and Deno Deploy
//     gives us no custom dialer and no Deno.resolveDns — so on this runtime we
//     CANNOT validate where a hostname points. That is why ALLOWED_HOSTS is a
//     hard allowlist rather than "validate arbitrary hosts carefully": a
//     maintained domain will not repoint its A record at link-local space, an
//     arbitrary member-supplied one might. The coverage cost is deliberate and
//     the rejected hosts are logged so the list grows from evidence.
//
// The private-range checks below are therefore belt-and-braces: they exist so a
// future widening of ALLOWED_HOSTS cannot quietly become the hole.

const SUPA_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANTHROPIC_KEY = Deno.env.get('ANTHROPIC_API_KEY') || Deno.env.get('ANTHROPIC_KEY') || '';

const MODEL = 'claude-haiku-4-5';
const MAX_HOPS = 3;
const MAX_BYTES = 2 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 8000;
const PER_MEMBER_DAILY = 10;
const GLOBAL_DAILY = 300;
const ALERT_AT = 0.8;
const MAX_INGREDIENTS = 40;

// Grow this from the ledger (status='blocked_host' grouped by host), never from
// guesses. UK-weighted because our members are.
const ALLOWED_HOSTS = [
  'bbcgoodfood.com', 'bbc.co.uk', 'allrecipes.com', 'seriouseats.com',
  'deliciousmagazine.co.uk', 'jamieoliver.com', 'nigella.com',
  'olivemagazine.com', 'greatbritishchefs.com', 'budgetbytes.com',
  'cookieandkate.com', 'food.com', 'epicurious.com', 'bonappetit.com',
  'simplyrecipes.com', 'tasty.co', 'hairybikers.com', 'riverford.co.uk',
  'mobkitchen.co.uk', 'pinchofnom.com', 'thehappyfoodie.co.uk',
  'waitrose.com', 'sainsburys.co.uk', 'tesco.com', 'marksandspencer.com',
  'goodhousekeeping.com', 'taste.com.au', 'thekitchn.com', 'lovefood.com',
  'realfood.tesco.com',
];

const CORS_ALLOW = [
  'https://online.vyvehealth.co.uk',
  'https://www.vyvehealth.co.uk',
  'capacitor://localhost',
  'https://localhost',
  'http://localhost',
];

function cors(origin: string | null) {
  const o = origin && CORS_ALLOW.includes(origin) ? origin : CORS_ALLOW[0];
  return {
    'Access-Control-Allow-Origin': o,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

// ── URL GATE ────────────────────────────────────────────────────────────────

const IPV4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;

function isPrivateHost(h: string): boolean {
  if (!h) return true;
  if (h === 'localhost' || h.endsWith('.localhost')) return true;
  if (h.endsWith('.local') || h.endsWith('.internal') || h.endsWith('.home.arpa')) return true;
  // Any IPv6 literal — ::1, fe80::, fc00::/7 and the ::ffff:127.0.0.1 mapping
  // are all reachable and none of them is a recipe site.
  if (h.includes(':') || h.startsWith('[')) return true;
  const m = h.match(IPV4);
  if (m) {
    const o = m.slice(1).map(Number);
    if (o.some((n) => n > 255)) return true;
    if (o[0] === 0 || o[0] === 10 || o[0] === 127) return true;
    if (o[0] === 169 && o[1] === 254) return true;              // link-local / IMDS
    if (o[0] === 172 && o[1] >= 16 && o[1] <= 31) return true;
    if (o[0] === 192 && o[1] === 168) return true;
    if (o[0] === 192 && o[1] === 0 && o[2] === 0) return true;
    if (o[0] === 100 && o[1] >= 64 && o[1] <= 127) return true; // CGNAT
    if (o[0] === 198 && (o[1] === 18 || o[1] === 19)) return true;
    if (o[0] >= 224) return true;                                // multicast + reserved
    return true; // no bare IP literal is ever on the allowlist anyway
  }
  return false;
}

function hostAllowed(h: string): boolean {
  // Equality or a real subdomain. NOT bare endsWith — 'notallrecipes.com'
  // ends with 'allrecipes.com'.
  return ALLOWED_HOSTS.some((d) => h === d || h.endsWith('.' + d));
}

type Gate = { ok: true; url: URL; host: string } | { ok: false; status: string; error: string; host: string };

function gateUrl(raw: string): Gate {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return { ok: false, status: 'bad_url', error: 'not a URL', host: '' };
  }
  const host = (u.hostname || '').toLowerCase().replace(/\.$/, '');
  // Credentials in the authority: https://allrecipes.com@169.254.169.254/ has
  // hostname 169.254.169.254, and a hand-rolled string check reads the
  // allowlisted part. URL parses it correctly; assert it anyway.
  if (u.username || u.password) {
    return { ok: false, status: 'bad_url', error: 'credentials in URL', host };
  }
  if (u.protocol !== 'https:') {
    return { ok: false, status: 'blocked_scheme', error: 'scheme ' + u.protocol, host };
  }
  if (u.port && u.port !== '443') {
    return { ok: false, status: 'blocked_port', error: 'port ' + u.port, host };
  }
  if (isPrivateHost(host)) {
    return { ok: false, status: 'blocked_private', error: 'private/loopback/link-local host', host };
  }
  if (!hostAllowed(host)) {
    return { ok: false, status: 'blocked_host', error: 'host not on allowlist', host };
  }
  return { ok: true, url: u, host };
}

// ── FETCH CHAIN ─────────────────────────────────────────────────────────────

type ChainResult =
  | { ok: true; res: Response; finalHost: string; hops: number }
  | { ok: false; status: string; error: string; host: string; hops: number };

async function fetchChain(startRaw: string): Promise<ChainResult> {
  let current = startRaw;
  let hops = 0;
  const seen = new Set<string>();
  for (;;) {
    const g = gateUrl(current);
    if (!g.ok) return { ...g, hops };
    const key = g.url.origin + g.url.pathname;
    if (seen.has(key)) {
      return { ok: false, status: 'too_many_redirects', error: 'redirect loop', host: g.host, hops };
    }
    seen.add(key);

    let res: Response;
    try {
      res = await fetch(g.url.toString(), {
        method: 'GET',
        redirect: 'manual', // the whole point — we drive the chain ourselves
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        headers: {
          // Built from scratch. The member's Authorization / apikey / cookies
          // are never forwarded to a third-party host.
          'User-Agent': 'VYVE-Health/1.0 (+https://www.vyvehealth.co.uk)',
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'en-GB,en;q=0.9',
        },
      });
    } catch (e) {
      const msg = String(e && (e as Error).name === 'TimeoutError' ? 'timeout' : e);
      return {
        ok: false,
        status: msg === 'timeout' ? 'timeout' : 'error',
        error: msg.slice(0, 300),
        host: g.host,
        hops,
      };
    }

    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get('location');
      try { await res.body?.cancel(); } catch { /* ignore */ }
      if (!loc) return { ok: false, status: 'error', error: 'redirect with no location', host: g.host, hops };
      if (hops >= MAX_HOPS) {
        return { ok: false, status: 'too_many_redirects', error: 'over ' + MAX_HOPS + ' hops', host: g.host, hops };
      }
      hops++;
      // Resolve relative Locations against the CURRENT url, then loop — the new
      // URL goes through gateUrl() at the top exactly like the pasted one did.
      try {
        current = new URL(loc, g.url).toString();
      } catch {
        return { ok: false, status: 'bad_url', error: 'bad redirect target', host: g.host, hops };
      }
      continue;
    }

    if (!res.ok) {
      try { await res.body?.cancel(); } catch { /* ignore */ }
      return { ok: false, status: 'error', error: 'HTTP ' + res.status, host: g.host, hops };
    }
    const ct = (res.headers.get('content-type') || '').toLowerCase();
    if (!ct.startsWith('text/html') && !ct.startsWith('application/xhtml')) {
      try { await res.body?.cancel(); } catch { /* ignore */ }
      return { ok: false, status: 'not_html', error: ct.slice(0, 120) || 'no content-type', host: g.host, hops };
    }
    return { ok: true, res, finalHost: g.host, hops };
  }
}

// content-length can lie or be absent under chunked encoding, so count bytes
// off the stream and abort at the cap rather than trusting the header.
async function readCapped(res: Response): Promise<{ ok: true; text: string } | { ok: false }> {
  const cl = parseInt(res.headers.get('content-length') || '0', 10);
  if (cl && cl > MAX_BYTES) { try { await res.body?.cancel(); } catch { /* ignore */ } return { ok: false }; }
  const reader = res.body?.getReader();
  if (!reader) return { ok: true, text: '' };
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_BYTES) { try { await reader.cancel(); } catch { /* ignore */ } return { ok: false }; }
    chunks.push(value);
  }
  const buf = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) { buf.set(c, off); off += c.byteLength; }
  return { ok: true, text: new TextDecoder('utf-8', { fatal: false }).decode(buf) };
}

// ── PARSE ───────────────────────────────────────────────────────────────────

function decodeEntities(s: string): string {
  return String(s || '')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&frac12;/g, '1/2').replace(/&frac14;/g, '1/4').replace(/&frac34;/g, '3/4')
    .replace(/&#x?([0-9a-fA-F]+);/g, (_m, d) => {
      try { return String.fromCodePoint(parseInt(d, /^x/i.test(_m.slice(2, 3)) ? 16 : 10)); } catch { return ' '; }
    });
}

function isoDurationToMins(v: unknown): number | null {
  if (typeof v !== 'string') return null;
  const m = v.match(/^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?)?/);
  if (!m) return null;
  const mins = (parseInt(m[1] || '0', 10) * 1440) + (parseInt(m[2] || '0', 10) * 60) + parseInt(m[3] || '0', 10);
  return mins > 0 && mins <= 1440 ? mins : null;
}

function firstString(v: unknown): string {
  if (typeof v === 'string') return v;
  if (Array.isArray(v) && v.length) return firstString(v[0]);
  if (v && typeof v === 'object') {
    const o = v as Record<string, unknown>;
    if (typeof o.name === 'string') return o.name;
    if (typeof o.text === 'string') return o.text;
  }
  return '';
}

function typeHas(node: Record<string, unknown>, want: string): boolean {
  const t = node['@type'];
  if (typeof t === 'string') return t.toLowerCase() === want;
  if (Array.isArray(t)) return t.some((x) => typeof x === 'string' && x.toLowerCase() === want);
  return false;
}

// Walk JSON-LD for a schema.org Recipe. Sites nest it under @graph, ship arrays
// at the root, or both.
function findRecipeNode(v: unknown, depth = 0): Record<string, unknown> | null {
  if (!v || depth > 6) return null;
  if (Array.isArray(v)) {
    for (const x of v) { const r = findRecipeNode(x, depth + 1); if (r) return r; }
    return null;
  }
  if (typeof v !== 'object') return null;
  const o = v as Record<string, unknown>;
  if (typeFhasRecipe(o)) return o;
  for (const k of ['@graph', 'mainEntity', 'mainEntityOfPage', 'itemListElement']) {
    if (k in o) { const r = findRecipeNode(o[k], depth + 1); if (r) return r; }
  }
  return null;
}
function typeFhasRecipe(o: Record<string, unknown>): boolean {
  return typeHas(o, 'recipe') && (Array.isArray(o.recipeIngredient) || Array.isArray(o.ingredients));
}

type Parsed = { name: string; ingredients: string[]; servings: number | null; prep: number | null; cook: number | null; source: 'json_ld' | 'html' };

function parseJsonLd(html: string): Parsed | null {
  const re = /<script[^>]+type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    let node: Record<string, unknown> | null = null;
    try {
      node = findRecipeNode(JSON.parse(m[1].trim().replace(/^\uFEFF/, '')));
    } catch { continue; }
    if (!node) continue;
    const rawIng = (node.recipeIngredient ?? node.ingredients) as unknown;
    const ingredients = (Array.isArray(rawIng) ? rawIng : [])
      .map((x) => decodeEntities(firstString(x)).replace(/\s+/g, ' ').trim())
      .filter(Boolean)
      .slice(0, MAX_INGREDIENTS);
    if (!ingredients.length) continue;
    let servings: number | null = null;
    const y = node.recipeYield;
    const ytxt = Array.isArray(y) ? String(y.find((x) => typeof x === 'string' || typeof x === 'number') ?? '') : String(y ?? '');
    const ym = ytxt.match(/\d+/);
    if (ym) { const n = parseInt(ym[0], 10); if (n >= 1 && n <= 50) servings = n; }
    return {
      name: decodeEntities(firstString(node.name)).trim().slice(0, 120) || 'Imported recipe',
      ingredients,
      servings,
      prep: isoDurationToMins(node.prepTime),
      cook: isoDurationToMins(node.cookTime),
      source: 'json_ld',
    };
  }
  return null;
}

function htmlToText(html: string): string {
  return decodeEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, '\n'),
  ).replace(/[ \t]+/g, ' ').replace(/\n{2,}/g, '\n').trim().slice(0, 14000);
}

// ── ANTHROPIC ───────────────────────────────────────────────────────────────

type Usage = { input_tokens?: number; output_tokens?: number } | null;

async function haiku(system: string, user: string, maxTokens: number): Promise<{ text: string; usage: Usage }> {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: user }],
    }),
    signal: AbortSignal.timeout(25000),
  });
  const j = await r.json();
  if (!r.ok) throw new Error('anthropic ' + r.status + ' ' + JSON.stringify(j).slice(0, 300));
  const text = (j.content || []).filter((c: { type: string }) => c.type === 'text').map((c: { text: string }) => c.text).join('');
  return { text, usage: j.usage || null };
}

function jsonFromModel(t: string): unknown {
  let s = String(t || '').trim();
  s = s.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  const a = s.indexOf('['), b = s.lastIndexOf(']');
  const c = s.indexOf('{'), d = s.lastIndexOf('}');
  const slice = (a >= 0 && (c < 0 || a < c)) ? s.slice(a, b + 1) : s.slice(c, d + 1);
  return JSON.parse(slice);
}

const STRUCT_SYSTEM = `You convert recipe ingredient lines into structured data.
Return ONLY a JSON array, no prose, no markdown fences. One object per input line, in the SAME ORDER, same length as the input.
Each object: {"raw": <the input line verbatim>, "name": <the food itself, singular, no quantity, no preparation words>, "qty": <number or null>, "unit": <"g"|"ml"|"tsp"|"tbsp"|"cup"|null>}
Rules:
- "name" is what you would search a food database for: "200g plain flour" -> "plain flour"; "2 large eggs, beaten" -> "egg"; "a handful of fresh basil" -> "basil".
- Drop preparation words (chopped, melted, beaten, to serve, finely diced) from "name".
- unit null means the qty counts whole items (2 eggs, 1 lemon). If there is no number at all, qty null.
- Convert simple fractions to decimals (1/2 -> 0.5). "a pinch" -> qty 1, unit "tsp". "a handful" -> qty null.
- Never invent an ingredient that is not in the input.`;

const FIND_SYSTEM = `You extract a recipe from the text of a web page.
Return ONLY JSON, no prose, no fences: {"name": <recipe title>, "servings": <integer 1-50 or null>, "prep_mins": <integer or null>, "cook_mins": <integer or null>, "ingredients": [<ingredient lines verbatim, in order>]}
If the page is not a recipe, return {"ingredients": []}. Never invent ingredients.`;

// ── SUPABASE HELPERS ────────────────────────────────────────────────────────

async function rest(path: string, init: RequestInit = {}) {
  const r = await fetch(SUPA_URL + '/rest/v1' + path, {
    ...init,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: 'Bearer ' + SERVICE_KEY,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  const txt = await r.text();
  let body: unknown = null;
  try { body = txt ? JSON.parse(txt) : null; } catch { body = txt; }
  return { ok: r.ok, status: r.status, body };
}

async function logImport(row: Record<string, unknown>) {
  try {
    const r = await rest('/nutrition_recipe_imports', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify(row),
    });
    const b = r.body as Array<{ id: string }> | null;
    return b && b[0] ? b[0].id : null;
  } catch (_e) {
    return null;
  }
}

function todayStartISO(): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

async function budgetAlert(used: number) {
  const day = new Date().toISOString().slice(0, 10);
  const fp = 'recipe_import_budget_' + day;
  const ex = await rest('/platform_alerts?fingerprint=eq.' + encodeURIComponent(fp) + '&select=id&limit=1');
  if (Array.isArray(ex.body) && ex.body.length) return;
  await rest('/platform_alerts', {
    method: 'POST',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({
      severity: 'high',
      type: 'recipe_import_budget',
      source: 'recipe-import',
      details: 'Recipe imports at ' + used + '/' + GLOBAL_DAILY + ' for ' + day,
      fingerprint: fp,
    }),
  });
}

// ── MATCHING ────────────────────────────────────────────────────────────────

const ITEM_KEYS = ['food_name', 'brand', 'barcode', 'off_id', 'calories_kcal', 'protein_g', 'carbs_g',
  'fat_g', 'fibre_g', 'sugar_g', 'saturated_fat_g', 'salt_g', 'serving_size_g', 'serving_unit', 'servings'];

type FoodRow = {
  code: string; product_name: string; brands: string | null;
  kcal_100g: number | null; protein_100g: number | null; carbs_100g: number | null; fat_100g: number | null;
  fibre_100g: number | null; sugar_100g: number | null; sat_fat_100g: number | null; salt_100g: number | null;
  serving_g: number | null; serving_label: string | null;
};

function tokens(s: string): string[] {
  return String(s || '').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').split(/\s+/).filter((w) => w.length > 2);
}

// food_products is a BARCODE database, so a one-word generic query ("milk")
// ranks branded rows by scan count and confidently returns Milka Alpine Milk
// Chocolate Bar at 539 kcal/100g. Generic foods live in nutrition_common_foods,
// which is what the picker's own search reaches for first. So do the same here:
// gather candidates from BOTH and score them, rather than trusting either.
function commonToFood(r: Record<string, unknown>): FoodRow {
  const n = (v: unknown) => (v == null ? null : Number(v));
  return {
    code: '', product_name: String(r.food_name || ''), brands: (r.brand as string) || null,
    kcal_100g: n(r.calories_kcal), protein_100g: n(r.protein_g), carbs_100g: n(r.carbs_g),
    fat_100g: n(r.fat_g), fibre_100g: n(r.fibre_g), sugar_100g: null, sat_fat_100g: null, salt_100g: null,
    serving_g: n(r.serving_size_g), serving_label: (r.serving_unit as string) || null,
  };
}

type Cand = { row: FoodRow; covered: number; extra: number; generic: boolean };

// Score on the PRODUCT NAME ONLY. nutrition_common_foods.brand is the literal
// placeholder "Whole Food", so counting brand tokens charged every generic row
// two words the member never asked for and handed the match to branded junk.
function scoreCand(want: string[], row: FoodRow): Cand {
  const got = new Set(tokens(row.product_name));
  const covered = want.filter((w) => got.has(w)).length;
  return { row, covered, extra: Math.max(0, got.size - covered), generic: row.code === '' };
}

// Best = most of the member's words covered, then fewest words the member did
// not ask for, then generic before branded, then the shortest name.
function pickBest(name: string, rows: FoodRow[]): { row: FoodRow | null; confidence: 'ok' | 'check' | 'none' } {
  const want = tokens(name);
  const cands = rows.filter((r) => r && r.kcal_100g != null && r.product_name).map((r) => scoreCand(want, r));
  if (!cands.length) return { row: null, confidence: 'none' };
  cands.sort((a, b) => (b.covered - a.covered) || (a.extra - b.extra)
    || (Number(b.generic) - Number(a.generic)) || (a.row.product_name.length - b.row.product_name.length));
  const best = cands[0];
  // Ambiguity means two DIFFERENT foods scored the same ("Whole Milk" vs
  // "Skimmed Milk"). The mirror is a barcode database, so the same food appears
  // once per brand — three rows all called "Plain Flour" are one food, not a
  // decision, and counting rows instead of distinct names turned every exact
  // match amber. An amber row the member glances at beats a green row that is
  // quietly wrong; an amber row on EVERY line means amber stops meaning anything.
  const names = new Set(cands.filter((c) => c.covered === best.covered && c.extra === best.extra)
    .map((c) => c.row.product_name.trim().toLowerCase()));
  const tied = names.size > 1;
  const full = want.length > 0 && best.covered === want.length;
  const conf: 'ok' | 'check' | 'none' = (full && best.extra <= 1 && !tied) ? 'ok' : 'check';
  return { row: best.row, confidence: conf };
}

function gramsFor(qty: number | null, unit: string | null, row: FoodRow | null): number | null {
  if (qty == null || !isFinite(qty) || qty <= 0) return null;
  if (unit === 'g' || unit === 'ml') return qty;          // ml→g at 1:1; honest for most liquids
  // "2 eggs" only converts when serving_g is a real single-item weight. A row
  // whose serving_g is exactly 100 is quoting per-100g, not one egg — treating
  // that as an item weight is how 2 eggs becomes 200g.
  if (unit === null && row && row.serving_g && row.serving_g > 0 && row.serving_g !== 100) return qty * row.serving_g;
  return null;                                             // tsp/tbsp/cup — no reliable grams
}

function buildItem(name: string, grams: number | null, row: FoodRow | null): Record<string, unknown> {
  const o: Record<string, unknown> = {};
  ITEM_KEYS.forEach((k) => { o[k] = null; });
  o.food_name = name.slice(0, 120);
  o.servings = 1;
  if (!row) return o;
  o.food_name = row.product_name ? row.product_name.slice(0, 120) : o.food_name;
  o.brand = row.brands || null;
  o.barcode = row.code || null;
  o.off_id = row.code || null;
  o.serving_unit = 'g';
  if (grams == null) { o.serving_size_g = null; return o; }
  const f = grams / 100;
  const r1 = (v: number | null) => (v == null ? null : Math.round(v * f * 10) / 10);
  o.serving_size_g = Math.round(grams * 10) / 10;
  o.calories_kcal = r1(row.kcal_100g);
  o.protein_g = r1(row.protein_100g);
  o.carbs_g = r1(row.carbs_100g);
  o.fat_g = r1(row.fat_100g);
  o.fibre_g = r1(row.fibre_100g);
  o.sugar_g = r1(row.sugar_100g);
  o.saturated_fat_g = r1(row.sat_fat_100g);
  o.salt_g = r1(row.salt_100g);
  return o;
}

// ── HANDLER ─────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  const H = { ...cors(origin), 'Content-Type': 'application/json' };
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors(origin) });
  if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'method' }), { status: 405, headers: H });

  // verify_jwt is true at the gateway, so a token is present and valid; we only
  // need the email off it. No email is ever taken from the body (PM-1003 class).
  let email = '';
  try {
    const auth = req.headers.get('authorization') || '';
    const tok = auth.replace(/^Bearer\s+/i, '');
    const payload = JSON.parse(atob(tok.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    email = String(payload.email || '').toLowerCase();
  } catch { /* fall through */ }
  if (!email) return new Response(JSON.stringify({ error: 'no_email' }), { status: 401, headers: H });

  let body: { url?: string } = {};
  try { body = await req.json(); } catch { /* empty */ }
  const raw = String(body.url || '').trim().slice(0, 2000);
  if (!raw) return new Response(JSON.stringify({ error: 'bad_url', message: 'Paste a link first.' }), { status: 400, headers: H });

  const fail = async (status: string, message: string, extra: Record<string, unknown> = {}) => {
    await logImport({ member_email: email, url: raw, host: String(extra.host || ''), status, billable: false,
      hops: Number(extra.hops || 0), error: String(extra.error || '').slice(0, 400) });
    return new Response(JSON.stringify({ error: status, message, host: extra.host || null }), { status: 200, headers: H });
  };

  // 1. Gate the pasted URL before anything costs us money or a socket.
  const g0 = gateUrl(raw);
  if (!g0.ok) {
    const msg = g0.status === 'blocked_host'
      ? `We can't import from ${g0.host || 'that site'} yet.`
      : g0.status === 'bad_url'
        ? "That doesn't look like a web address."
        : "That link isn't one we can open.";
    return fail(g0.status, msg, { host: g0.host, error: g0.error });
  }

  // 2. Quota. A refusal above does not burn one; only real work does.
  const since = todayStartISO();
  const mine = await rest(`/nutrition_recipe_imports?select=id&member_email=eq.${encodeURIComponent(email)}&billable=is.true&created_at=gte.${since}`);
  const mineN = Array.isArray(mine.body) ? mine.body.length : 0;
  if (mineN >= PER_MEMBER_DAILY) {
    return fail('quota', `That's ${PER_MEMBER_DAILY} imports today — the limit resets tomorrow.`, { host: g0.host });
  }
  const all = await rest(`/nutrition_recipe_imports?select=id&billable=is.true&created_at=gte.${since}`);
  const allN = Array.isArray(all.body) ? all.body.length : 0;
  if (allN >= GLOBAL_DAILY) {
    await budgetAlert(allN);
    return fail('global_quota', 'Importing is busy right now — try again shortly.', { host: g0.host });
  }
  if (allN >= Math.floor(GLOBAL_DAILY * ALERT_AT)) { try { await budgetAlert(allN); } catch { /* ignore */ } }

  // 3. Fetch, driving the redirect chain by hand.
  const chain = await fetchChain(raw);
  if (!chain.ok) {
    const msg = chain.status === 'timeout' ? 'That page took too long to answer.'
      : chain.status === 'not_html' ? "That link isn't a web page we can read."
      : chain.status === 'blocked_host' ? `That link redirects to ${chain.host || 'a site'} we can't import from.`
      : chain.status === 'blocked_private' || chain.status === 'blocked_scheme' || chain.status === 'blocked_port'
        ? "That link isn't one we can open."
        : chain.status === 'too_many_redirects' ? 'That link bounced around too much.'
        : "We couldn't open that page.";
    return fail(chain.status, msg, { host: chain.host, hops: chain.hops, error: chain.error });
  }

  const read = await readCapped(chain.res);
  if (!read.ok) {
    return fail('too_large', 'That page is too big to read.', { host: chain.finalHost, hops: chain.hops });
  }
  const html = read.text;

  // 4. Parse. JSON-LD first — it hands us clean ingredient strings, which makes
  // the model call small, cheap and accurate. HTML text is the fallback.
  let parsed = parseJsonLd(html);
  let usage: Record<string, unknown> = {};
  if (!parsed) {
    if (!ANTHROPIC_KEY) return fail('no_recipe', "We couldn't find a recipe on that page.", { host: chain.finalHost, hops: chain.hops });
    try {
      const out = await haiku(FIND_SYSTEM, htmlToText(html), 1600);
      usage.find = out.usage;
      const j = jsonFromModel(out.text) as Record<string, unknown>;
      const ings = Array.isArray(j.ingredients) ? (j.ingredients as unknown[]).map((x) => String(x).trim()).filter(Boolean).slice(0, MAX_INGREDIENTS) : [];
      if (ings.length) {
        const sv = Number(j.servings);
        parsed = {
          name: String(j.name || 'Imported recipe').slice(0, 120),
          ingredients: ings,
          servings: isFinite(sv) && sv >= 1 && sv <= 50 ? Math.round(sv) : null,
          prep: isFinite(Number(j.prep_mins)) ? Math.min(1440, Math.max(0, Math.round(Number(j.prep_mins)))) : null,
          cook: isFinite(Number(j.cook_mins)) ? Math.min(1440, Math.max(0, Math.round(Number(j.cook_mins)))) : null,
          source: 'html',
        };
      }
    } catch (e) {
      return fail('error', "We couldn't read that page.", { host: chain.finalHost, hops: chain.hops, error: String(e) });
    }
  }
  if (!parsed || !parsed.ingredients.length) {
    return fail('no_recipe', "We couldn't find a recipe on that page.", { host: chain.finalHost, hops: chain.hops });
  }

  // 5. Structure the ingredient lines.
  let struct: Array<{ raw: string; name: string; qty: number | null; unit: string | null }> = [];
  try {
    const out = await haiku(STRUCT_SYSTEM, JSON.stringify(parsed.ingredients), 2000);
    usage.structure = out.usage;
    const arr = jsonFromModel(out.text) as unknown[];
    struct = (Array.isArray(arr) ? arr : []).map((x, i) => {
      const o = (x || {}) as Record<string, unknown>;
      const q = Number(o.qty);
      const u = typeof o.unit === 'string' ? o.unit.toLowerCase() : null;
      return {
        raw: String(o.raw || parsed!.ingredients[i] || '').slice(0, 200),
        name: String(o.name || '').trim().slice(0, 80),
        qty: isFinite(q) && q > 0 ? q : null,
        unit: (u && ['g', 'ml', 'tsp', 'tbsp', 'cup'].includes(u)) ? u : null,
      };
    }).filter((x) => x.name);
  } catch (e) {
    return fail('error', "We couldn't read the ingredients.", { host: chain.finalHost, hops: chain.hops, error: String(e) });
  }
  if (!struct.length) {
    return fail('no_recipe', "We couldn't find a recipe on that page.", { host: chain.finalHost, hops: chain.hops });
  }

  // 6. Match against the OFF UK mirror. Sequential and small — 8-15 cheap
  // indexed reads, and doing them in parallel just moves the same load.
  const items = [];
  for (const s of struct) {
    const cands: FoodRow[] = [];
    const like = '*' + s.name.replace(/[*,()]/g, ' ').trim().split(/\s+/).join('*') + '*';
    try {
      const c = await rest('/nutrition_common_foods?select=food_name,brand,calories_kcal,protein_g,carbs_g,fat_g,fibre_g,serving_size_g,serving_unit'
        + '&or=(food_name.ilike.' + encodeURIComponent(like) + ',search_terms.ilike.' + encodeURIComponent(like) + ')&limit=6');
      if (Array.isArray(c.body)) for (const r of c.body) cands.push(commonToFood(r as Record<string, unknown>));
    } catch { /* fall through to the mirror */ }
    try {
      const r = await rest('/rpc/search_food_products', { method: 'POST', body: JSON.stringify({ q: s.name, lim: 3 }) });
      if (Array.isArray(r.body)) for (const x of r.body) cands.push(x as FoodRow);
    } catch { /* leave unmatched */ }
    const best = pickBest(s.name, cands);
    const row = best.row;
    const grams = gramsFor(s.qty, s.unit, row);
    const conf = row == null ? 'none' : (grams == null ? 'check' : best.confidence);
    items.push({
      raw: s.raw,
      name: s.name,
      qty: s.qty,
      unit: s.unit,
      grams,
      confidence: conf,
      match: row ? { code: row.code, product_name: row.product_name, brands: row.brands, kcal_100g: row.kcal_100g } : null,
      item: buildItem(s.name, grams, row),
    });
  }

  const importId = await logImport({
    member_email: email, url: raw, host: g0.host, status: 'ok', billable: true,
    hops: chain.hops, final_host: chain.finalHost, parse_source: parsed.source,
    ingredient_count: items.length, model: MODEL, usage,
  });

  return new Response(JSON.stringify({
    ok: true,
    import_id: importId,
    recipe: {
      name: parsed.name,
      servings: parsed.servings,
      prep_mins: parsed.prep,
      cook_mins: parsed.cook,
      source_url: raw,
      host: g0.host,
      parse_source: parsed.source,
    },
    items,
  }), { status: 200, headers: H });
});
