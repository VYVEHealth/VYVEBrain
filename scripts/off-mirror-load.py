#!/usr/bin/env python3
"""
VYVE — Open Food Facts UK mirror loader (PM-1063, §23.233).

Runs on the Hetzner box (vyve-live-runner). Pulls OFF's Parquet export, keeps
UK products with usable energy data, normalises to per-100g truth (the off-proxy
`_norm` contract), and upserts into Supabase `food_products` through PostgREST
with the box's service_role key. Idempotent — safe to re-run monthly.

  python3 off-mirror-load.py            # full run: download (if stale) → extract → upsert
  python3 off-mirror-load.py --no-download
  python3 off-mirror-load.py --extract-only
  python3 off-mirror-load.py --upsert-only

Env (from /opt/vyve/vyve-runner.env): VYVE_SUPABASE_URL, VYVE_SUPABASE_SERVICE_KEY
"""
import os, sys, json, time, csv, subprocess, urllib.request, urllib.error

WORK   = '/srv/vyve/off'
PARQ   = f'{WORK}/food.parquet'
CSV    = f'{WORK}/uk_products.csv'
SRC    = 'https://huggingface.co/datasets/openfoodfacts/product-database/resolve/main/food.parquet'
BATCH  = 2000
STALE_DAYS = 25

SUPA_URL = os.environ['VYVE_SUPABASE_URL'].rstrip('/')
SUPA_KEY = os.environ['VYVE_SUPABASE_SERVICE_KEY']

def log(*a): print(time.strftime('%H:%M:%S'), *a, flush=True)

def download():
    if os.path.exists(PARQ) and (time.time() - os.path.getmtime(PARQ)) < STALE_DAYS * 86400:
        log('parquet fresh, skipping download'); return
    log('downloading OFF parquet …')
    subprocess.run(['curl', '-sL', '--retry', '3', '-o', PARQ + '.part', SRC], check=True)
    os.replace(PARQ + '.part', PARQ)
    log('download done', os.path.getsize(PARQ) // 1_000_000, 'MB')

EXTRACT_SQL = f"""
COPY (
  WITH base AS (
    SELECT
      code,
      coalesce(
        list_filter(product_name, x -> x.lang = 'en')[1].text,
        list_filter(product_name, x -> x.lang = 'main')[1].text,
        product_name[1].text
      ) AS product_name,
      brands,
      serving_size,
      try_cast(serving_quantity AS DOUBLE) AS serving_quantity,
      coalesce(unique_scans_n, 0) AS scans,
      last_modified_t,
      list_filter(nutriments, x -> x.name = 'energy-kcal')[1]    AS kcal,
      list_filter(nutriments, x -> x.name = 'proteins')[1]       AS pro,
      list_filter(nutriments, x -> x.name = 'carbohydrates')[1]  AS carb,
      list_filter(nutriments, x -> x.name = 'fat')[1]            AS fat,
      list_filter(nutriments, x -> x.name = 'fiber')[1]          AS fib,
      list_filter(nutriments, x -> x.name = 'sugars')[1]         AS sug,
      list_filter(nutriments, x -> x.name = 'saturated-fat')[1]  AS sat,
      list_filter(nutriments, x -> x.name = 'salt')[1]           AS salt,
      list_filter(nutriments, x -> x.name = 'sodium')[1]         AS sod
    FROM read_parquet('{PARQ}')
    WHERE list_contains(countries_tags, 'en:united-kingdom')
      AND coalesce(no_nutrition_data, false) = false
      AND code IS NOT NULL AND length(code) BETWEEN 8 AND 14
  ),
  srv AS (
    SELECT *,
      CASE
        WHEN serving_quantity > 0 AND serving_quantity < 5000 THEN serving_quantity
        ELSE try_cast(regexp_extract(serving_size, '([0-9]+(?:\\.[0-9]+)?)\\s*(?:g|ml)', 1) AS DOUBLE)
      END AS serving_g
    FROM base
    WHERE product_name IS NOT NULL AND trim(product_name) <> ''
  ),
  norm AS (
    SELECT
      code, product_name, brands, serving_g, serving_size AS serving_label, scans, last_modified_t,
      CASE WHEN kcal."100g" IS NOT NULL THEN kcal."100g"
           WHEN kcal.serving IS NOT NULL AND serving_g > 0 THEN kcal.serving * 100.0 / serving_g END AS kcal_100g,
      CASE WHEN kcal."100g" IS NOT NULL THEN coalesce(pro."100g", 0)
           WHEN serving_g > 0 THEN coalesce(pro.serving, 0) * 100.0 / serving_g END AS protein_100g,
      CASE WHEN kcal."100g" IS NOT NULL THEN coalesce(carb."100g", 0)
           WHEN serving_g > 0 THEN coalesce(carb.serving, 0) * 100.0 / serving_g END AS carbs_100g,
      CASE WHEN kcal."100g" IS NOT NULL THEN coalesce(fat."100g", 0)
           WHEN serving_g > 0 THEN coalesce(fat.serving, 0) * 100.0 / serving_g END AS fat_100g,
      CASE WHEN kcal."100g" IS NOT NULL THEN fib."100g"
           WHEN serving_g > 0 THEN fib.serving * 100.0 / serving_g END AS fibre_100g,
      CASE WHEN kcal."100g" IS NOT NULL THEN sug."100g"
           WHEN serving_g > 0 THEN sug.serving * 100.0 / serving_g END AS sugar_100g,
      CASE WHEN kcal."100g" IS NOT NULL THEN sat."100g"
           WHEN serving_g > 0 THEN sat.serving * 100.0 / serving_g END AS sat_fat_100g,
      CASE WHEN kcal."100g" IS NOT NULL THEN coalesce(salt."100g", sod."100g" * 2.5)
           WHEN serving_g > 0 THEN coalesce(salt.serving, sod.serving * 2.5) * 100.0 / serving_g END AS salt_100g
    FROM srv
  )
  SELECT code, product_name, brands,
         round(kcal_100g, 1) AS kcal_100g, round(protein_100g, 2) AS protein_100g,
         round(carbs_100g, 2) AS carbs_100g, round(fat_100g, 2) AS fat_100g,
         round(fibre_100g, 2) AS fibre_100g, round(sugar_100g, 2) AS sugar_100g,
         round(sat_fat_100g, 2) AS sat_fat_100g, round(salt_100g, 2) AS salt_100g,
         round(serving_g, 2) AS serving_g, serving_label, scans,
         to_timestamp(last_modified_t) AS off_modified
  FROM norm
  WHERE kcal_100g IS NOT NULL AND kcal_100g >= 0 AND kcal_100g <= 950
) TO '{CSV}' (HEADER, DELIMITER ',');
"""

def extract():
    import duckdb
    log('extracting UK slice …')
    con = duckdb.connect()
    con.execute("SET memory_limit='2GB'; SET threads=2;")
    con.execute(EXTRACT_SQL)
    n = con.execute(f"SELECT count(*) FROM read_csv_auto('{CSV}')").fetchone()[0]
    log('extract done — rows:', n)
    return n

NUM = {'kcal_100g','protein_100g','carbs_100g','fat_100g','fibre_100g','sugar_100g','sat_fat_100g','salt_100g','serving_g','scans'}

def row_to_json(r):
    o = {}
    for k, v in r.items():
        if v == '' or v is None: o[k] = None
        elif k in NUM: o[k] = int(v) if k == 'scans' else float(v)
        else: o[k] = v
    o['uk'] = True
    o['source'] = 'off-dump'
    o['fetched_at'] = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
    return o

def post(batch):
    body = json.dumps(batch).encode()
    req = urllib.request.Request(
        f'{SUPA_URL}/rest/v1/food_products?on_conflict=code',
        data=body, method='POST',
        headers={'apikey': SUPA_KEY, 'Authorization': f'Bearer {SUPA_KEY}',
                 'Content-Type': 'application/json',
                 'Prefer': 'resolution=merge-duplicates,return=minimal'})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=120) as r:
                return r.status
        except urllib.error.HTTPError as e:
            msg = e.read().decode()[:300]
            if e.code in (502, 503, 504, 429) and attempt < 3:
                time.sleep(3 * (attempt + 1)); continue
            raise RuntimeError(f'{e.code} {msg}')
        except Exception as e:
            if attempt < 3: time.sleep(3 * (attempt + 1)); continue
            raise

def upsert():
    log('upserting …')
    done = 0; batch = []; seen = set()
    with open(CSV, newline='') as f:
        for r in csv.DictReader(f):
            if r['code'] in seen: continue
            seen.add(r['code'])
            batch.append(row_to_json(r))
            if len(batch) >= BATCH:
                post(batch); done += len(batch); batch = []
                if done % 20000 == 0: log('  ', done)
    if batch: post(batch); done += len(batch)
    log('upsert done —', done, 'rows')

if __name__ == '__main__':
    args = set(sys.argv[1:])
    if '--upsert-only' in args: upsert(); sys.exit()
    if '--extract-only' in args: extract(); sys.exit()
    if '--no-download' not in args: download()
    extract(); upsert()
    log('complete')
