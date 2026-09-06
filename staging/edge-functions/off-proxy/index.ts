import "jsr:@supabase/functions-js/edge-runtime.d.ts";
// off-proxy v10 — PM-XXX UK-first rebuild, Search-a-licious backend.
// v9 (same session) proved the legacy cgi/search.pl endpoint is rate-limited
// (~10 searches/min/IP) and intermittently empty from shared edge egress IPs
// — the original reason search 'couldn't find stuff' and PM-374 locked the
// food log. v10 replaces it entirely with search.openfoodfacts.org
// (Search-a-licious): relevance-ranked full text, Lucene country filter,
// built for app traffic. Verified live: 'greek yogurt' → Asda + Aldi UK rows.
//  1. UK-filtered query first; unfiltered fallback when thin (<5).
//  2. Server-normalised `_norm` block per product (per-100g basis + parsed
//     serving grams) — client maths can never mix bases again.
//  3. Products without usable energy data are dropped.
//  4. Barcode: OFF v2 API, honest {found:false} (with name when known) so
//     the client can run quick-add-with-barcode.
// Contract: {products:[...]} preserved; hits are mapped into the legacy
// product shape (+_norm additive). v8-era clients keep working.
const SUPA_URL = Deno.env.get('SUPABASE_URL') ?? 'https://ixjfklpckgxrwjlfsaaz.supabase.co';
const SUPA_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const SAL_BASE = 'https://search.openfoodfacts.org';
const OFF_WORLD = 'https://world.openfoodfacts.org';
const SAL_FIELDS = 'product_name,brands,nutriments,serving_size,serving_quantity,code,countries_tags';
const OFF_FIELDS = 'product_name,brands,nutriments,serving_size,serving_quantity,code,countries_tags,lang';
const UA = {
  'User-Agent': 'VYVEHealth/1.0 (team@vyvehealth.co.uk)'
};
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'apikey, Authorization, Content-Type'
};
function num(v) {
  const n = typeof v === 'string' ? parseFloat(v) : v;
  return Number.isFinite(n) ? n : null;
}
// Parse "45 g" / "330ml" / "2 slices (88 g)" → grams. ml treated as grams.
function parseServingGrams(servingSize, servingQuantity) {
  const q = num(servingQuantity);
  if (q && q > 0 && q < 5000) return q;
  if (!servingSize) return null;
  const paren = servingSize.match(/\(([\d.]+)\s*(g|ml)\b/i);
  if (paren) return num(paren[1]);
  const lead = servingSize.match(/([\d.]+)\s*(g|ml)\b/i);
  if (lead) return num(lead[1]);
  return null;
}
function normalise(p) {
  const n = p.nutriments || {};
  const servingG = parseServingGrams(p.serving_size, p.serving_quantity);
  const kcal100 = num(n['energy-kcal_100g']);
  const kcalSrv = num(n['energy-kcal_serving']);
  if (kcal100 != null) {
    return {
      basis: '100g',
      serving_g: servingG,
      serving_label: p.serving_size || null,
      kcal_100g: kcal100,
      protein_100g: num(n['proteins_100g']) ?? 0,
      carbs_100g: num(n['carbohydrates_100g']) ?? 0,
      fat_100g: num(n['fat_100g']) ?? 0,
      fibre_100g: num(n['fiber_100g']) ?? num(n['fibers_100g'])
    };
  }
  if (kcalSrv != null && servingG) {
    const f = 100 / servingG;
    const fs = num(n['fiber_serving']);
    return {
      basis: 'serving',
      serving_g: servingG,
      serving_label: p.serving_size || null,
      kcal_100g: Math.round(kcalSrv * f * 10) / 10,
      protein_100g: Math.round((num(n['proteins_serving']) ?? 0) * f * 10) / 10,
      carbs_100g: Math.round((num(n['carbohydrates_serving']) ?? 0) * f * 10) / 10,
      fat_100g: Math.round((num(n['fat_serving']) ?? 0) * f * 10) / 10,
      fibre_100g: fs != null ? Math.round(fs * f * 10) / 10 : null
    };
  }
  return null;
}
async function searchCommonFoods(q) {
  const lower = q.toLowerCase().trim();
  const base = `${SUPA_URL}/rest/v1/nutrition_common_foods?select=food_name,category,brand,calories_kcal,protein_g,carbs_g,fat_g,fibre_g,serving_size_g,serving_unit&limit=8`;
  const headers = {
    'apikey': SUPA_KEY,
    'Authorization': `Bearer ${SUPA_KEY}`
  };
  const [r1, r2] = await Promise.all([
    fetch(`${base}&food_name=ilike.*${encodeURIComponent(lower)}*`, {
      headers
    }),
    fetch(`${base}&search_terms=ilike.*${encodeURIComponent(lower)}*`, {
      headers
    })
  ]);
  const rows1 = r1.ok ? await r1.json() : [];
  const rows2 = r2.ok ? await r2.json() : [];
  const seen = new Set();
  const merged = [];
  for (const r of [
    ...rows1,
    ...rows2
  ]){
    if (!seen.has(r.food_name)) {
      seen.add(r.food_name);
      merged.push(r);
    }
  }
  return merged.slice(0, 12);
}
function formatCommonFood(r) {
  const g = num(r.serving_size_g) ?? 100;
  const f = 100 / g;
  return {
    product_name: r.food_name,
    brands: r.brand || 'Whole Food',
    code: null,
    off_id: null,
    serving_size: `${r.serving_size_g}${r.serving_unit || 'g'}`,
    _common: true,
    nutriments: {
      'energy-kcal_serving': r.calories_kcal,
      'proteins_serving': r.protein_g,
      'carbohydrates_serving': r.carbs_g,
      'fat_serving': r.fat_g,
      'fiber_serving': r.fibre_g ?? 0
    },
    _norm: {
      basis: 'serving',
      serving_g: g,
      serving_label: `${r.serving_size_g}${r.serving_unit || 'g'}`,
      kcal_100g: Math.round((r.calories_kcal || 0) * f * 10) / 10,
      protein_100g: Math.round((r.protein_g || 0) * f * 10) / 10,
      carbs_100g: Math.round((r.carbs_g || 0) * f * 10) / 10,
      fat_100g: Math.round((r.fat_g || 0) * f * 10) / 10,
      fibre_100g: r.fibre_g != null ? Math.round(r.fibre_g * f * 10) / 10 : null
    }
  };
}
// Search-a-licious. Returns {hits:[...]}. brands comes back as an array.
async function salSearch(q, ukOnly, pageSize) {
  try {
    const query = ukOnly ? `${q} countries_tags:"en:united-kingdom"` : q;
    const r = await fetch(`${SAL_BASE}/search?q=${encodeURIComponent(query)}&langs=en&page_size=${pageSize}&fields=${SAL_FIELDS}`, {
      headers: UA
    });
    if (!r.ok) {
      console.log(`[off-proxy v10] sal ${ukOnly ? 'uk' : 'world'} status=${r.status}`);
      return [];
    }
    const d = await r.json();
    return (d.hits || []).map((h)=>({
        ...h,
        brands: Array.isArray(h.brands) ? h.brands.join(', ') : h.brands || null
      }));
  } catch (e) {
    console.log(`[off-proxy v10] sal fetch error: ${e}`);
    return [];
  }
}
function prep(products, cap) {
  const out = [];
  const seen = new Set();
  for (const p of products){
    if (!p.product_name || !String(p.product_name).trim()) continue;
    const key = (p.code || p.product_name).toString();
    if (seen.has(key)) continue;
    const norm = normalise(p);
    if (!norm) continue;
    seen.add(key);
    out.push({
      ...p,
      _norm: norm
    });
    if (out.length >= cap) break;
  }
  return out;
}
Deno.serve(async (req)=>{
  if (req.method === 'OPTIONS') return new Response(null, {
    status: 204,
    headers: CORS
  });
  const url = new URL(req.url);
  const type = url.searchParams.get('type');
  try {
    if (type === 'search') {
      const q = url.searchParams.get('q') || '';
      if (!q) return json({
        error: 'Missing q param'
      }, 400);
      const [commonRows, ukHits] = await Promise.all([
        searchCommonFoods(q),
        salSearch(q, true, 30)
      ]);
      let offProducts = prep(ukHits, 20);
      if (offProducts.length < 5) {
        const world = await salSearch(q, false, 30);
        offProducts = prep([
          ...ukHits,
          ...world
        ], 20);
      }
      const commonProducts = commonRows.map(formatCommonFood);
      console.log(`[off-proxy v10] q="${q}" common=${commonProducts.length} off=${offProducts.length}`);
      return jsonOk({
        products: [
          ...commonProducts,
          ...offProducts
        ].slice(0, 24)
      });
    } else if (type === 'barcode') {
      const code = url.searchParams.get('code') || '';
      if (!code) return json({
        error: 'Missing code param'
      }, 400);
      const res = await fetch(`${OFF_WORLD}/api/v2/product/${encodeURIComponent(code)}?fields=${OFF_FIELDS}`, {
        headers: UA
      });
      if (res.status === 404) return jsonOk({
        found: false,
        code
      });
      if (!res.ok) return json({
        error: `OFF returned ${res.status}`
      }, 502);
      const data = await res.json();
      const p = data.product;
      if (!p || !p.product_name) return jsonOk({
        found: false,
        code
      });
      const norm = normalise(p);
      if (!norm) return jsonOk({
        found: false,
        code,
        product_name: p.product_name,
        brands: p.brands || null
      });
      return jsonOk({
        found: true,
        code,
        product: {
          ...p,
          _norm: norm
        }
      });
    } else {
      return json({
        error: 'type must be search or barcode'
      }, 400);
    }
  } catch (err) {
    console.error('off-proxy error:', err);
    return json({
      error: 'Upstream request failed'
    }, 502);
  }
});
function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...CORS,
      'Content-Type': 'application/json'
    }
  });
}
function jsonOk(body) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      ...CORS,
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache'
    }
  });
}
