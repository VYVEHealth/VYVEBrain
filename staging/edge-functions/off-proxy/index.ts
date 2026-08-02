import "jsr:@supabase/functions-js/edge-runtime.d.ts";
// off-proxy v8
// Fix: OFF results were being over-filtered. Scorer now only SORTS, never excludes.
// Any product with an English name is included; non-English names sink to bottom.
const SUPA_URL = Deno.env.get('SUPABASE_URL') ?? 'https://ixjfklpckgxrwjlfsaaz.supabase.co';
const SUPA_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const OFF_BASE = 'https://world.openfoodfacts.org';
const OFF_FIELDS = 'product_name,brands,nutriments,serving_size,code,countries_tags,lang';
const PAGE_SIZE = 30;
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'apikey, Authorization, Content-Type'
};
function isEnglishName(name) {
  if (!name) return false;
  const nonAscii = (name.match(/[^\x00-\x7F]/g) || []).length;
  return nonAscii / name.length < 0.15; // slightly more lenient
}
function scoreOFF(p) {
  let s = 0;
  const countries = p.countries_tags || [];
  const isUK = countries.some((c)=>c.includes('united-kingdom'));
  const isEn = isEnglishName(p.product_name || '') || (p.lang || '') === 'en';
  if (isEn) s += 10;
  if (isUK) s += 5;
  if (isEn && isUK) s += 5;
  return s;
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
  return {
    product_name: r.food_name,
    brands: r.brand || 'Whole Food',
    code: null,
    off_id: null,
    serving_size: `${r.serving_size_g}${r.serving_unit}`,
    _common: true,
    nutriments: {
      'energy-kcal_serving': r.calories_kcal,
      'proteins_serving': r.protein_g,
      'carbohydrates_serving': r.carbs_g,
      'fat_serving': r.fat_g,
      'fiber_serving': r.fibre_g ?? 0
    }
  };
}
Deno.serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: CORS
    });
  }
  const url = new URL(req.url);
  const type = url.searchParams.get('type');
  try {
    if (type === 'search') {
      const q = url.searchParams.get('q') || '';
      if (!q) return json({
        error: 'Missing q param'
      }, 400);
      const [commonRows, offData] = await Promise.all([
        searchCommonFoods(q),
        fetch(`${OFF_BASE}/cgi/search.pl?search_terms=${encodeURIComponent(q)}&json=1&page_size=${PAGE_SIZE}&fields=${OFF_FIELDS}&sort_by=unique_scans_n`, {
          headers: {
            'User-Agent': 'VYVEHealth/1.0 (team@vyvehealth.co.uk)'
          }
        }).then((r)=>r.ok ? r.json() : {
            products: []
          }).catch(()=>({
            products: []
          }))
      ]);
      const commonProducts = commonRows.map(formatCommonFood);
      // KEY CHANGE: sort by score but NEVER filter out — all products pass through
      const offProducts = (offData.products || []).filter((p)=>p.product_name && p.product_name.trim().length > 0).map((p, i)=>({
          ...p,
          _score: scoreOFF(p),
          _rank: i
        })).sort((a, b)=>b._score !== a._score ? b._score - a._score : a._rank - b._rank).slice(0, 20).map(({ _score, _rank, ...p })=>p);
      console.log(`[off-proxy] q="${q}" common=${commonProducts.length} off=${offProducts.length}`);
      const merged = [
        ...commonProducts,
        ...offProducts
      ].slice(0, 24);
      return jsonOk({
        products: merged
      });
    } else if (type === 'barcode') {
      const code = url.searchParams.get('code') || '';
      if (!code) return json({
        error: 'Missing code param'
      }, 400);
      const offUrl = `${OFF_BASE}/api/v0/product/${encodeURIComponent(code)}.json?fields=${OFF_FIELDS}`;
      const res = await fetch(offUrl, {
        headers: {
          'User-Agent': 'VYVEHealth/1.0 (team@vyvehealth.co.uk)'
        }
      });
      if (!res.ok) return json({
        error: `OFF returned ${res.status}`
      }, 502);
      return jsonOk(await res.json());
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
