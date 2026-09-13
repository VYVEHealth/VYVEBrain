import "jsr:@supabase/functions-js/edge-runtime.d.ts";
// off-proxy v12 — PM-1063 (§23.233): Open Food Facts UK MIRROR READS FIRST.
//  • barcode: `food_products` exact match first (code + 12/13-digit variants);
//    OFF v2 only on a miss, and every OFF hit is written back so the next
//    member gets it locally. Rows older than 7 days trigger a background OFF
//    re-fetch AFTER the response (stale-while-revalidate).
//  • search: `nutrition_common_foods` first (unchanged), then local FTS/trigram
//    via `search_food_products()` (scans + UK boost); Search-a-licious only
//    when local returns <5, and those hits are written back too.
//  • misses (barcode not found anywhere / search with zero results) land in
//    `food_lookup_misses` — member-blind, feeds the 60–90-day FatSecret review.
//  • `_norm` contract and the legacy product shape are byte-compatible with v11.
// off-proxy v11 — PM-1060: `_norm` carries sugar_100g / sat_fat_100g / salt_100g.
// off-proxy v10 — PM-981 UK-first rebuild, Search-a-licious backend.
const SUPA_URL = Deno.env.get('SUPABASE_URL') ?? 'https://ixjfklpckgxrwjlfsaaz.supabase.co';
const SUPA_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const SAL_BASE = 'https://search.openfoodfacts.org';
const OFF_WORLD = 'https://world.openfoodfacts.org';
const SAL_FIELDS = 'product_name,brands,nutriments,serving_size,serving_quantity,code,countries_tags,unique_scans_n';
const OFF_FIELDS = 'product_name,brands,nutriments,serving_size,serving_quantity,code,countries_tags,lang,unique_scans_n';
const UA = {
  'User-Agent': 'VYVEHealth/1.0 (team@vyvehealth.co.uk)'
};
const SB = {
  'apikey': SUPA_KEY,
  'Authorization': `Bearer ${SUPA_KEY}`,
  'Content-Type': 'application/json'
};
const STALE_MS = 7 * 86400 * 1000;
const V = 'v12';
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
function scale(v, f) {
  return v == null ? null : Math.round(v * f * 100) / 100;
}
function saltOf(salt, sodium) {
  return salt != null ? salt : sodium != null ? Math.round(sodium * 2.5 * 100) / 100 : null;
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
      fibre_100g: num(n['fiber_100g']) ?? num(n['fibers_100g']),
      sugar_100g: num(n['sugars_100g']),
      sat_fat_100g: num(n['saturated-fat_100g']),
      salt_100g: saltOf(num(n['salt_100g']), num(n['sodium_100g']))
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
      fibre_100g: fs != null ? Math.round(fs * f * 10) / 10 : null,
      sugar_100g: scale(num(n['sugars_serving']), f),
      sat_fat_100g: scale(num(n['saturated-fat_serving']), f),
      salt_100g: scale(saltOf(num(n['salt_serving']), num(n['sodium_serving'])), f)
    };
  }
  return null;
}
// ─── local mirror ────────────────────────────────────────────────────────────
const FP_COLS = 'code,product_name,brands,kcal_100g,protein_100g,carbs_100g,fat_100g,fibre_100g,sugar_100g,sat_fat_100g,salt_100g,serving_g,serving_label,uk,scans,source,fetched_at';
// EAN-13 with a leading zero and UPC-A are the same product on OFF; try both spellings.
function codeVariants(code) {
  const c = code.replace(/\D/g, '');
  const out = new Set([
    code,
    c
  ]);
  if (c.length === 12) out.add('0' + c);
  if (c.length === 13 && c.startsWith('0')) out.add(c.slice(1));
  if (c.length === 8) out.add(c.padStart(13, '0'));
  return [
    ...out
  ].filter(Boolean);
}
async function localBarcode(code) {
  try {
    const list = codeVariants(code).map(encodeURIComponent).join(',');
    const r = await fetch(`${SUPA_URL}/rest/v1/food_products?select=${FP_COLS}&code=in.(${list})&limit=1`, {
      headers: SB
    });
    if (!r.ok) return null;
    const rows = await r.json();
    return rows[0] ?? null;
  } catch  {
    return null;
  }
}
async function localSearch(q, lim = 20) {
  try {
    const r = await fetch(`${SUPA_URL}/rest/v1/rpc/search_food_products`, {
      method: 'POST',
      headers: SB,
      body: JSON.stringify({
        q,
        lim
      })
    });
    if (!r.ok) {
      console.log(`[off-proxy ${V}] local search status=${r.status}`);
      return [];
    }
    return await r.json();
  } catch (e) {
    console.log(`[off-proxy ${V}] local search error: ${e}`);
    return [];
  }
}
// Mirror row → legacy product shape (+_norm), basis always 100g.
function fromRow(r) {
  const g = num(r.serving_g);
  return {
    product_name: r.product_name,
    brands: r.brands || null,
    code: r.code,
    serving_size: r.serving_label || null,
    serving_quantity: g,
    _mirror: true,
    nutriments: {
      'energy-kcal_100g': num(r.kcal_100g),
      'proteins_100g': num(r.protein_100g) ?? 0,
      'carbohydrates_100g': num(r.carbs_100g) ?? 0,
      'fat_100g': num(r.fat_100g) ?? 0,
      'fiber_100g': num(r.fibre_100g),
      'sugars_100g': num(r.sugar_100g),
      'saturated-fat_100g': num(r.sat_fat_100g),
      'salt_100g': num(r.salt_100g)
    },
    _norm: {
      basis: '100g',
      serving_g: g,
      serving_label: r.serving_label || null,
      kcal_100g: num(r.kcal_100g),
      protein_100g: num(r.protein_100g) ?? 0,
      carbs_100g: num(r.carbs_100g) ?? 0,
      fat_100g: num(r.fat_100g) ?? 0,
      fibre_100g: num(r.fibre_100g),
      sugar_100g: num(r.sugar_100g),
      sat_fat_100g: num(r.sat_fat_100g),
      salt_100g: num(r.salt_100g)
    }
  };
}
// OFF product (+_norm) → mirror row for write-back.
function toRow(p) {
  const n = p._norm;
  if (!n || !p.code || n.kcal_100g == null) return null;
  const ct = Array.isArray(p.countries_tags) ? p.countries_tags : [];
  return {
    code: String(p.code),
    product_name: String(p.product_name).slice(0, 300),
    brands: p.brands ? String(p.brands).slice(0, 200) : null,
    kcal_100g: n.kcal_100g,
    protein_100g: n.protein_100g ?? 0,
    carbs_100g: n.carbs_100g ?? 0,
    fat_100g: n.fat_100g ?? 0,
    fibre_100g: n.fibre_100g,
    sugar_100g: n.sugar_100g,
    sat_fat_100g: n.sat_fat_100g,
    salt_100g: n.salt_100g,
    serving_g: n.serving_g,
    serving_label: n.serving_label,
    uk: ct.includes('en:united-kingdom'),
    scans: num(p.unique_scans_n) ?? 0,
    source: 'off-live',
    fetched_at: new Date().toISOString()
  };
}
async function upsertRows(rows) {
  const body = rows.filter(Boolean);
  if (!body.length) return;
  try {
    const r = await fetch(`${SUPA_URL}/rest/v1/food_products?on_conflict=code`, {
      method: 'POST',
      headers: {
        ...SB,
        'Prefer': 'resolution=merge-duplicates,return=minimal'
      },
      body: JSON.stringify(body)
    });
    if (!r.ok) console.log(`[off-proxy ${V}] write-back status=${r.status} ${(await r.text()).slice(0, 200)}`);
  } catch (e) {
    console.log(`[off-proxy ${V}] write-back error: ${e}`);
  }
}
async function logMiss(kind, query) {
  try {
    await fetch(`${SUPA_URL}/rest/v1/food_lookup_misses`, {
      method: 'POST',
      headers: {
        ...SB,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        kind,
        query: query.slice(0, 200)
      })
    });
  } catch  {}
}
function bg(p) {
  // deno-lint-ignore no-explicit-any
  const rt = globalThis.EdgeRuntime;
  if (rt?.waitUntil) rt.waitUntil(p);
  else p.catch(()=>{});
}
// ─── upstream ────────────────────────────────────────────────────────────────
async function offBarcode(code) {
  const res = await fetch(`${OFF_WORLD}/api/v2/product/${encodeURIComponent(code)}?fields=${OFF_FIELDS}`, {
    headers: UA
  });
  if (res.status === 404) return {
    status: 404,
    product: null
  };
  if (!res.ok) return {
    status: res.status,
    product: null
  };
  const data = await res.json();
  return {
    status: 200,
    product: data.product ?? null
  };
}
async function refreshBarcode(code) {
  const { product: p } = await offBarcode(code);
  if (!p || !p.product_name) return;
  const norm = normalise(p);
  if (!norm) return;
  await upsertRows([
    toRow({
      ...p,
      _norm: norm
    })
  ]);
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
      fibre_100g: r.fibre_g != null ? Math.round(r.fibre_g * f * 10) / 10 : null,
      sugar_100g: null,
      sat_fat_100g: null,
      salt_100g: null
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
      console.log(`[off-proxy ${V}] sal ${ukOnly ? 'uk' : 'world'} status=${r.status}`);
      return [];
    }
    const d = await r.json();
    return (d.hits || []).map((h)=>({
        ...h,
        brands: Array.isArray(h.brands) ? h.brands.join(', ') : h.brands || null
      }));
  } catch (e) {
    console.log(`[off-proxy ${V}] sal fetch error: ${e}`);
    return [];
  }
}
function prep(products, cap, seen = new Set()) {
  const out = [];
  for (const p of products){
    if (!p.product_name || !String(p.product_name).trim()) continue;
    const key = (p.code || p.product_name).toString();
    if (seen.has(key)) continue;
    const norm = p._norm ?? normalise(p);
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
      const [commonRows, localRows] = await Promise.all([
        searchCommonFoods(q),
        localSearch(q, 20)
      ]);
      const seen = new Set();
      let offProducts = prep(localRows.map(fromRow), 20, seen);
      let upstream = 0;
      if (offProducts.length < 5) {
        const ukHits = await salSearch(q, true, 30);
        let fresh = prep(ukHits, 20 - offProducts.length, seen);
        if (offProducts.length + fresh.length < 5) {
          const world = await salSearch(q, false, 30);
          fresh = prep([
            ...ukHits,
            ...world
          ], 20 - offProducts.length, seen);
        }
        upstream = fresh.length;
        if (fresh.length) bg(upsertRows(fresh.map(toRow)));
        offProducts = [
          ...offProducts,
          ...fresh
        ];
      }
      const commonProducts = commonRows.map(formatCommonFood);
      if (!commonProducts.length && !offProducts.length) bg(logMiss('search', q));
      console.log(`[off-proxy ${V}] q="${q}" common=${commonProducts.length} local=${offProducts.length - upstream} upstream=${upstream}`);
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
      const row = await localBarcode(code);
      if (row) {
        const age = Date.now() - new Date(row.fetched_at).getTime();
        if (age > STALE_MS) bg(refreshBarcode(row.code));
        console.log(`[off-proxy ${V}] barcode ${code} local hit (${row.source}${age > STALE_MS ? ', refreshing' : ''})`);
        return jsonOk({
          found: true,
          code,
          product: fromRow(row)
        });
      }
      const { status, product: p } = await offBarcode(code);
      if (status === 404) {
        bg(logMiss('barcode', code));
        return jsonOk({
          found: false,
          code
        });
      }
      if (status !== 200) return json({
        error: `OFF returned ${status}`
      }, 502);
      if (!p || !p.product_name) {
        bg(logMiss('barcode', code));
        return jsonOk({
          found: false,
          code
        });
      }
      const norm = normalise(p);
      if (!norm) {
        bg(logMiss('barcode', code));
        return jsonOk({
          found: false,
          code,
          product_name: p.product_name,
          brands: p.brands || null
        });
      }
      const full = {
        ...p,
        _norm: norm
      };
      bg(upsertRows([
        toRow(full)
      ]));
      console.log(`[off-proxy ${V}] barcode ${code} upstream hit → mirrored`);
      return jsonOk({
        found: true,
        code,
        product: full
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
