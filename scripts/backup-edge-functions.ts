// VYVE Edge Function Source Backup — runs in a GitHub Actions Deno runner.
//
// For each EF in the KEEP list:
//   1. Fetch metadata + ESZIP body via Supabase Management API
//   2. Decode the ESZIP using deno.land/x/eszip
//   3. Write each non-http source file to staging/edge-functions/{slug}/{filename}
//   4. Compute sha256 per file for the manifest
//
// At the end:
//   - Write MANIFEST.json with snapshot_at, supabase_project, KEEP list, per-EF entries
//     including platform_version, verify_jwt, ezbr_sha256, file_shas, error rows.
//   - Wipe each {slug}/ folder before re-writing so file deletions land cleanly between
//     snapshots (prevents stale files lingering when an EF removes a shared module).

import { Parser } from "https://deno.land/x/eszip@v0.109.0/mod.ts";
import { encodeHex } from "https://deno.land/std@0.224.0/encoding/hex.ts";
import { ensureDir } from "https://deno.land/std@0.224.0/fs/ensure_dir.ts";
import { join, dirname } from "https://deno.land/std@0.224.0/path/mod.ts";

const REF = Deno.env.get("SUPABASE_PROJECT_REF") || "ixjfklpckgxrwjlfsaaz";
const STAGING_DIR = Deno.env.get("STAGING_DIR") || "staging/edge-functions";
const PAT = Deno.env.get("MGMT_PAT");
if (!PAT) {
  console.error("MGMT_PAT env var not set");
  Deno.exit(2);
}

const KEEP_LIST = [
  "achievement-earned-push","achievements-mark-seen","achievements-sweep","admin-dashboard",
  "admin-member-edit","admin-member-habits","admin-member-programme","admin-member-weekly-goals",
  "admin-programme-library","anthropic-proxy","cc-data","certificate-checker","certificate-serve",
  "check-cron","daily-report","edit-habit","email-watchdog","employer-dashboard",
  "gdpr-erase-cancel","gdpr-erase-execute","gdpr-erase-request","gdpr-erase-status",
  "gdpr-export-execute","gdpr-export-request","generate-workout-plan","get-activity-feed",
  "get-health-data","github-proxy","github-proxy-marketing","habit-reminder","internal-dashboard",
  "leaderboard","log-activity","member-achievements","member-dashboard","monthly-checkin",
  "monthly-report","notifications","off-proxy","onboarding","ops-brief","platform-alert",
  "process-scheduled-pushes","push-send-native","re-engagement-scheduler","re-engagement-test-sender",
  "register-push-token","schedule-push","schema-snapshot-refresh","seed-weekly-goals",
  "send-email","send-journey-recap","send-push","send-session-recap","share-workout",
  "storage-cleanup","streak-reminder","sync-health-data",
  "warm-ping","weekly-report","wellbeing-checkin","workout-library",
];

interface ManifestEntry {
  slug: string;
  ok: boolean;
  platform_version?: number;
  verify_jwt?: boolean;
  status?: string;
  ezbr_sha256?: string;
  entrypoint?: string;
  files?: { name: string; sha256: string; bytes: number }[];
  error?: string;
}

const startedAt = new Date().toISOString();

async function sha256Hex(s: string): Promise<string> {
  const buf = new TextEncoder().encode(s);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return encodeHex(new Uint8Array(hash));
}

async function fetchAndDecode(slug: string, isFirst: boolean): Promise<ManifestEntry> {
  const headers = { Authorization: `Bearer ${PAT}` };
  const [metaRes, bodyRes] = await Promise.all([
    fetch(`https://api.supabase.com/v1/projects/${REF}/functions/${slug}`, { headers: { ...headers, Accept: "application/json" } }),
    fetch(`https://api.supabase.com/v1/projects/${REF}/functions/${slug}/body`, { headers }),
  ]);
  if (!metaRes.ok) {
    return { slug, ok: false, error: `metadata HTTP ${metaRes.status}: ${(await metaRes.text()).slice(0, 200)}` };
  }
  if (!bodyRes.ok) {
    return { slug, ok: false, error: `body HTTP ${bodyRes.status}: ${(await bodyRes.text()).slice(0, 200)}` };
  }
  const meta = await metaRes.json();
  const eszipBytes = new Uint8Array(await bodyRes.arrayBuffer());

  // DIAGNOSTIC: log first EF's body shape so we can see if it's actually ESZIP.
  if (isFirst) {
    console.log(`  [diag] body content-type: ${bodyRes.headers.get("content-type")}`);
    console.log(`  [diag] body bytes: ${eszipBytes.length}`);
    const first16 = Array.from(eszipBytes.slice(0, 16)).map(b => b.toString(16).padStart(2, "0")).join(" ");
    console.log(`  [diag] first 16 bytes (hex): ${first16}`);
    const first40ascii = new TextDecoder("utf-8", { fatal: false }).decode(eszipBytes.slice(0, 40)).replace(/[\x00-\x1F]/g, ".");
    console.log(`  [diag] first 40 bytes (ascii): ${first40ascii}`);
    console.log(`  [diag] meta keys: ${Object.keys(meta).join(", ")}`);
    console.log(`  [diag] meta.version: ${meta.version}, meta.ezbr_sha256: ${meta.ezbr_sha256}`);
  }

  let parser: Parser;
  try {
    parser = await Parser.createInstance();
  } catch (e) {
    return { slug, ok: false, error: `Parser.createInstance threw: ${e instanceof Error ? e.message : String(e)}` };
  }

  let specifiers: string[];
  try {
    specifiers = await parser.parseBytes(eszipBytes);
  } catch (e) {
    const head = Array.from(eszipBytes.slice(0, 16)).map(b => b.toString(16).padStart(2, "0")).join(" ");
    return { slug, ok: false, error: `parseBytes threw: ${e instanceof Error ? e.message : String(e)} | first 16 bytes: ${head}` };
  }

  try {
    await parser.load();
  } catch (e) {
    return { slug, ok: false, error: `parser.load threw: ${e instanceof Error ? e.message : String(e)}` };
  }

  const localFiles: { name: string; src: string; sha: string }[] = [];
  for (const spec of specifiers) {
    if (spec.startsWith("http://") || spec.startsWith("https://")) continue;
    let src: string | undefined;
    try {
      src = await parser.getModuleSource(spec);
    } catch (e) {
      console.error(`  [warn] getModuleSource(${spec}) threw: ${e instanceof Error ? e.message : String(e)}`);
      continue;
    }
    if (typeof src !== "string") continue;
    const name = spec.replace(/^source\//, "");
    const sha = await sha256Hex(src);
    localFiles.push({ name, src, sha });
  }
  if (!localFiles.length) {
    return { slug, ok: false, error: `no local source files in ESZIP after http filter (specifiers count: ${specifiers.length})` };
  }

  const efDir = join(STAGING_DIR, slug);
  try {
    await Deno.remove(efDir, { recursive: true });
  } catch {
    // Dir didn't exist, fine.
  }

  for (const f of localFiles) {
    const path = join(efDir, f.name);
    await ensureDir(dirname(path));
    await Deno.writeTextFile(path, f.src);
  }

  return {
    slug,
    ok: true,
    platform_version: meta.version,
    verify_jwt: meta.verify_jwt,
    status: meta.status,
    ezbr_sha256: meta.ezbr_sha256,
    entrypoint: meta.entrypoint_path,
    files: localFiles.map(f => ({ name: f.name, sha256: f.sha, bytes: f.src.length })),
  };
}

const entries: ManifestEntry[] = [];
let i = 0;
for (const slug of KEEP_LIST) {
  i++;
  try {
    const entry = await fetchAndDecode(slug, i === 1);
    entries.push(entry);
    console.log(`[${i}/${KEEP_LIST.length}] ${slug}: ${entry.ok ? `${entry.files!.length} files` : `FAIL ${entry.error}`}`);
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e);
    entries.push({ slug, ok: false, error: err });
    console.error(`[${i}/${KEEP_LIST.length}] ${slug}: THREW ${err}`);
  }
}

entries.sort((a, b) => a.slug.localeCompare(b.slug));
const succeeded = entries.filter(e => e.ok).length;
const failed = entries.length - succeeded;

if (succeeded === 0) {
  console.error(`\nAll ${KEEP_LIST.length} EF backups failed — refusing to overwrite manifest.`);
  console.error("Sample errors:");
  for (const e of entries.slice(0, 3)) console.error(`  ${e.slug}: ${e.error}`);
  Deno.exit(1);
}

await ensureDir(STAGING_DIR);
const manifest = {
  snapshot_at: startedAt,
  supabase_project: REF,
  brain_repo: "VYVEHealth/VYVEBrain",
  brain_branch: "main",
  ef_count_attempted: KEEP_LIST.length,
  ef_count_succeeded: succeeded,
  ef_count_failed: failed,
  keep_list: KEEP_LIST,
  entries,
};
await Deno.writeTextFile(
  join(STAGING_DIR, "MANIFEST.json"),
  JSON.stringify(manifest, null, 2),
);

console.log(`\n=== Done. ${succeeded}/${KEEP_LIST.length} EFs backed up. ${failed} failed. ===`);
if (failed > 0) {
  console.log("Failed slugs:", entries.filter(e => !e.ok).map(e => e.slug).join(", "));
}
