// schema-snapshot-refresh v2 - uses GITHUB_PAT_BRAIN (fine-grained PAT scoped to VYVEBrain contents:write)
// Auto-generates brain/schema-snapshot.md from live DB and commits to VYVEHealth/VYVEBrain.
// Runs weekly via cron. Only commits if content changed (ignoring the timestamp line).
// No row counts — structural only — so weekly diffs reflect real schema changes.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { Client } from 'https://deno.land/x/postgres@v0.17.0/mod.ts';
import { encode as b64encode } from 'https://deno.land/std@0.168.0/encoding/base64.ts';
const GITHUB_PAT = Deno.env.get('GITHUB_PAT_BRAIN') ?? '';
if (!GITHUB_PAT) console.warn('GITHUB_PAT_BRAIN not set — PUT will fail');
const DB_URL = Deno.env.get('SUPABASE_DB_URL');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const OWNER = 'VYVEHealth';
const REPO = 'VYVEBrain';
const BRANCH = 'main';
const FILE_PATH = 'brain/schema-snapshot.md';
const GH_HEADERS = {
  'Authorization': `token ${GITHUB_PAT}`,
  'Accept': 'application/vnd.github.v3+json',
  'User-Agent': 'VYVE-Schema-Bot'
};
async function logAlert(severity, type, details) {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/platform_alerts`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        severity,
        type,
        source: 'schema-snapshot-refresh',
        details: details.slice(0, 4000)
      })
    });
  } catch (_) {}
}
async function buildSnapshot() {
  const client = new Client(DB_URL);
  await client.connect();
  try {
    const tablesQ = await client.queryObject`
      SELECT
        c.table_name AS tbl,
        c.column_name AS col,
        CASE
          WHEN c.data_type = 'USER-DEFINED' THEN c.udt_name
          WHEN c.data_type = 'ARRAY' THEN COALESCE(e.data_type, 'ARRAY') || '[]'
          ELSE c.data_type
        END AS dtype,
        c.is_nullable AS nullable,
        c.column_default AS dflt,
        COALESCE((
          SELECT true FROM information_schema.table_constraints tc
          JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
          WHERE tc.table_schema = 'public' AND tc.table_name = c.table_name
            AND ccu.column_name = c.column_name AND tc.constraint_type = 'UNIQUE'
          LIMIT 1), false) AS is_unique,
        COALESCE((
          SELECT true FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
          WHERE tc.table_schema = 'public' AND tc.table_name = c.table_name
            AND kcu.column_name = c.column_name AND tc.constraint_type = 'PRIMARY KEY'
          LIMIT 1), false) AS is_pk
      FROM information_schema.columns c
      LEFT JOIN information_schema.element_types e
        ON ((c.table_catalog, c.table_schema, c.table_name, 'TABLE', c.dtd_identifier)
           = (e.object_catalog, e.object_schema, e.object_name, e.object_type, e.collection_type_identifier))
      WHERE c.table_schema = 'public'
        AND c.table_name IN (SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE')
      ORDER BY c.table_name, c.ordinal_position;
    `;
    const checksQ = await client.queryObject`
      SELECT conrelid::regclass::text AS tbl, conname AS name, pg_get_constraintdef(oid) AS expr
      FROM pg_constraint
      WHERE contype = 'c' AND connamespace = 'public'::regnamespace
      ORDER BY conrelid::regclass::text, conname;
    `;
    const fksQ = await client.queryObject`
      SELECT
        con.conrelid::regclass::text AS src,
        a.attname AS src_col,
        con.confrelid::regclass::text AS tgt,
        af.attname AS tgt_col,
        con.conname AS name
      FROM pg_constraint con
      JOIN pg_attribute a ON a.attrelid = con.conrelid AND a.attnum = con.conkey[1]
      JOIN pg_attribute af ON af.attrelid = con.confrelid AND af.attnum = con.confkey[1]
      WHERE con.contype = 'f' AND con.connamespace = 'public'::regnamespace
      ORDER BY src, name;
    `;
    const triggersQ = await client.queryObject`
      SELECT event_object_table AS tbl,
             trigger_name AS name,
             action_timing AS timing,
             event_manipulation AS event,
             REGEXP_REPLACE(action_statement, '^EXECUTE FUNCTION ', '') AS fn
      FROM information_schema.triggers
      WHERE trigger_schema = 'public'
      ORDER BY event_object_table, trigger_name, event_manipulation;
    `;
    const fnsQ = await client.queryObject`
      SELECT p.proname AS name,
             pg_get_function_identity_arguments(p.oid) AS args,
             CASE p.prokind WHEN 'a' THEN 'aggregate' WHEN 'w' THEN 'window' WHEN 'p' THEN 'proc' ELSE 'func' END AS kind
      FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public'
      ORDER BY p.proname;
    `;
    const policiesQ = await client.queryObject`
      SELECT tablename AS tbl, policyname AS name, cmd, array_to_string(roles,',') AS roles, qual AS expr, with_check AS chk
      FROM pg_policies WHERE schemaname='public' ORDER BY tablename, policyname;
    `;
    const rlsTablesQ = await client.queryObject`
      SELECT relname AS tbl, relrowsecurity AS rls
      FROM pg_class c JOIN pg_namespace n ON c.relnamespace=n.oid
      WHERE n.nspname='public' AND c.relkind='r'
      ORDER BY relname;
    `;
    const indexesQ = await client.queryObject`
      SELECT tablename AS tbl, indexname AS name, indexdef AS defn
      FROM pg_indexes WHERE schemaname='public'
      ORDER BY tablename, indexname;
    `;
    const cronQ = await client.queryObject`
      SELECT jobname AS name, schedule, command AS cmd, active FROM cron.job ORDER BY jobname;
    `;
    const rlsMap = {};
    for (const r of rlsTablesQ.rows)rlsMap[r.tbl] = r.rls;
    const colsByTable = {};
    for (const r of tablesQ.rows){
      (colsByTable[r.tbl] ||= []).push(r);
    }
    const checksByTable = {};
    for (const r of checksQ.rows){
      (checksByTable[r.tbl] ||= []).push(r);
    }
    const fksBySrc = {};
    for (const r of fksQ.rows){
      (fksBySrc[r.src] ||= []).push(r);
    }
    const triggersByTable = {};
    for (const r of triggersQ.rows){
      (triggersByTable[r.tbl] ||= []).push(r);
    }
    const policiesByTable = {};
    for (const r of policiesQ.rows){
      (policiesByTable[r.tbl] ||= []).push(r);
    }
    const indexesByTable = {};
    for (const r of indexesQ.rows){
      (indexesByTable[r.tbl] ||= []).push(r);
    }
    const tableNames = Object.keys(colsByTable).sort();
    const totals = {
      tables: tableNames.length,
      columns: tablesQ.rows.length,
      fks: fksQ.rows.length,
      triggers: triggersQ.rows.length,
      functions: fnsQ.rows.length,
      policies: policiesQ.rows.length,
      indexes: indexesQ.rows.length,
      cron_jobs: cronQ.rows.length,
      rls_tables: Object.values(rlsMap).filter(Boolean).length
    };
    const ts = new Date().toISOString();
    const lines = [];
    lines.push(`# VYVE Health — Database Schema Snapshot`);
    lines.push(``);
    lines.push(`> Auto-generated from live Supabase project \`ixjfklpckgxrwjlfsaaz\`.`);
    lines.push(`> DO NOT EDIT — overwritten weekly by the \`schema-snapshot-refresh\` Edge Function.`);
    lines.push(`> Last refresh: ${ts}`);
    lines.push(``);
    lines.push(`**Totals:** ${totals.tables} tables (${totals.rls_tables} with RLS) · ${totals.columns} columns · ${totals.fks} FKs · ${totals.triggers} triggers · ${totals.functions} public functions · ${totals.policies} RLS policies · ${totals.indexes} indexes · ${totals.cron_jobs} cron jobs`);
    lines.push(``);
    lines.push(`---`);
    lines.push(``);
    lines.push(`## Tables (${tableNames.length})`);
    lines.push(``);
    for (const t of tableNames){
      const cols = colsByTable[t];
      const rlsBadge = rlsMap[t] ? ' · RLS' : '';
      lines.push(`### \`${t}\`${rlsBadge}`);
      lines.push(``);
      lines.push(`| Column | Type | Nullable | Default | PK | Unique |`);
      lines.push(`|---|---|---|---|---|---|`);
      for (const c of cols){
        const dflt = (c.dflt || '').toString().replace(/\|/g, '\\|').slice(0, 60);
        lines.push(`| \`${c.col}\` | ${c.dtype} | ${c.nullable} | ${dflt} | ${c.is_pk ? '✓' : ''} | ${c.is_unique ? '✓' : ''} |`);
      }
      const checks = checksByTable[`public.${t}`] || checksByTable[t];
      if (checks && checks.length > 0) {
        lines.push(``);
        lines.push(`**Check constraints:**`);
        for (const c of checks)lines.push(`- \`${c.name}\`: ${c.expr}`);
      }
      const fks = fksBySrc[`public.${t}`] || fksBySrc[t];
      if (fks && fks.length > 0) {
        lines.push(``);
        lines.push(`**Foreign keys:**`);
        for (const f of fks)lines.push(`- \`${f.src_col}\` → \`${f.tgt}.${f.tgt_col}\` (\`${f.name}\`)`);
      }
      const trigs = triggersByTable[t];
      if (trigs && trigs.length > 0) {
        lines.push(``);
        lines.push(`**Triggers:**`);
        const uniq = new Map();
        for (const tr of trigs){
          const k = tr.name;
          const prev = uniq.get(k) || '';
          uniq.set(k, prev ? `${prev}/${tr.event}` : `${tr.timing} ${tr.event}`);
        }
        for (const [name, desc] of uniq)lines.push(`- \`${name}\` — ${desc}`);
      }
      const pols = policiesByTable[t];
      if (pols && pols.length > 0) {
        lines.push(``);
        lines.push(`**RLS policies:**`);
        for (const p of pols){
          const expr = (p.expr || '—').replace(/\s+/g, ' ').slice(0, 200);
          const chk = p.chk ? ` / CHECK: ${p.chk.replace(/\s+/g, ' ').slice(0, 100)}` : '';
          lines.push(`- \`${p.name}\` (${p.cmd}, roles: ${p.roles}) — ${expr}${chk}`);
        }
      } else if (rlsMap[t]) {
        lines.push(``);
        lines.push(`**RLS policies:** _(none — service-role only)_`);
      }
      const idxs = indexesByTable[t];
      if (idxs && idxs.length > 0) {
        lines.push(``);
        lines.push(`**Indexes:**`);
        for (const i of idxs)lines.push(`- \`${i.name}\``);
      }
      lines.push(``);
    }
    lines.push(`---`);
    lines.push(``);
    lines.push(`## Public Functions (${fnsQ.rows.length})`);
    lines.push(``);
    for (const f of fnsQ.rows){
      lines.push(`- \`${f.name}(${f.args})\` — ${f.kind}`);
    }
    lines.push(``);
    lines.push(`---`);
    lines.push(``);
    lines.push(`## Cron Jobs (${cronQ.rows.length})`);
    lines.push(``);
    lines.push(`| Job | Schedule | Active | Command preview |`);
    lines.push(`|---|---|---|---|`);
    for (const j of cronQ.rows){
      const cmd = j.cmd.replace(/\s+/g, ' ').slice(0, 80).replace(/\|/g, '\\|');
      lines.push(`| \`${j.name}\` | \`${j.schedule}\` | ${j.active ? '✓' : '✗'} | \`${cmd}\` |`);
    }
    lines.push(``);
    lines.push(`---`);
    lines.push(``);
    lines.push(`*Generated by \`schema-snapshot-refresh\` Edge Function.*`);
    lines.push(``);
    return lines.join('\n');
  } finally{
    await client.end();
  }
}
function normalise(md) {
  return md.split('\n').filter((l)=>!l.startsWith('> Last refresh:')).join('\n');
}
async function commitIfChanged(content) {
  const apiUrl = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}?ref=${BRANCH}`;
  const getRes = await fetch(apiUrl, {
    headers: GH_HEADERS
  });
  let currentSha;
  let currentContent = '';
  if (getRes.ok) {
    const j = await getRes.json();
    currentSha = j.sha;
    if (j.content && j.encoding === 'base64') {
      const decoded = atob(j.content.replace(/\n/g, ''));
      currentContent = new TextDecoder().decode(Uint8Array.from(decoded, (c)=>c.charCodeAt(0)));
    }
  } else if (getRes.status !== 404) {
    throw new Error(`GitHub GET failed: ${getRes.status} ${await getRes.text()}`);
  }
  if (currentContent && normalise(currentContent) === normalise(content)) {
    return {
      committed: false,
      reason: 'No structural changes since last snapshot'
    };
  }
  const b64 = b64encode(new TextEncoder().encode(content));
  const putRes = await fetch(apiUrl, {
    method: 'PUT',
    headers: {
      ...GH_HEADERS,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: 'chore(brain): weekly schema-snapshot auto-refresh',
      content: b64,
      sha: currentSha,
      branch: BRANCH,
      committer: {
        name: 'VYVE Schema Bot',
        email: 'team@vyvehealth.co.uk'
      }
    })
  });
  if (!putRes.ok) throw new Error(`GitHub PUT failed: ${putRes.status} ${await putRes.text()}`);
  const putData = await putRes.json();
  return {
    committed: true,
    reason: currentContent ? 'Structural change detected' : 'Initial snapshot',
    commit_sha: putData.commit?.sha,
    blob_sha: putData.content?.sha
  };
}
serve(async (req)=>{
  const start = Date.now();
  try {
    const md = await buildSnapshot();
    const result = await commitIfChanged(md);
    const ms = Date.now() - start;
    if (result.committed) {
      await logAlert('info', 'schema_snapshot_committed', `${result.reason}. commit=${result.commit_sha} (${ms}ms, ${md.length} chars)`);
    }
    return new Response(JSON.stringify({
      ...result,
      ms,
      chars: md.length
    }), {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (err) {
    const msg = String(err);
    await logAlert('high', 'schema_snapshot_failed', msg);
    return new Response(JSON.stringify({
      error: msg
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
});
