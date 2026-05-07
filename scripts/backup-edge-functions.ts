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
//
// Failure modes:
//   - Any per-EF error (fetch/parse) is captured in the manifest entry's `error` field
//     but does NOT abort the run. Partial snapshots still commit.
//   - If 100% of EFs fail (likely a PAT/network outage), exit non-zero so Actions
//     emails Dean and the manifest+staging are NOT overwritten.

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

// 07 May 2026 KEEP list — EFs whose source we back up.
// Excludes one-shot patchers, debug helpers, hardcoded-recipient triggers (full DELETE
// list documented in VYVEBrain backlog Item 3 spec). When the cohort changes — e.g.
// a new EF ships and survives the next Lewis-or-Dean cleanup pass — add the slug here
// and bump the brain entry. Re-validate against `Supabase:list_edge_functions` if drift
// is suspected.
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

async function fetchAndDecode(slug: string): Promise<ManifestEntry> {
  const headers = { Authorization: `Bearer ${PAT}`, Accept: "application/json" };
  const [metaRes, bodyRes] = await Promise.all([
    fetch(`https://api.supabase.com/v1/projects/${REF}/functions/${slug}`, { headers }),
    fetch(`https://api.supabase.com/v1/projects/${REF}/functions/${slug}/body`, { headers: { Authorization: `Bearer ${PAT}` } }),
  ]);
  if (!metaRes.ok) {
    return { slug, ok: false, error: `metadata HTTP ${metaRes.status}: ${(await metaRes.text()).slice(0, 200)}` };
  }
  if (!bodyRes.ok) {
    return { slug, ok: false, error: `body HTTP ${bodyRes.status}: ${(await bodyRes.text()).slice(0, 200)}` };
  }
  const meta = await metaRes.json();
  const eszipBytes = new Uint8Array(await bodyRes.arrayBuffer());

  const parser = await Parser.createInstance();
  const specifiers: string[] = await parser.parseBytes(eszipBytes);
  await parser.load();

  const localFiles: { name: string; src: string; sha: string }[] = [];
  for (const spec of specifiers) {
    if (spec.startsWith("http://") || spec.startsWith("https://")) continue;
    const src = await parser.getModuleSource(spec);
    if (typeof src !== "string") continue;
    // Specifier paths look like "source/index.ts" or "source/_shared/taxonomy.ts".
    // Strip the "source/" prefix so files land at staging/edge-functions/{slug}/index.ts etc.
    const name = spec.replace(/^source\//, "");
    const sha = await sha256Hex(src);
    localFiles.push({ name, src, sha });
  }
  if (!localFiles.length) {
    return { slug, ok: false, error: "no local source files in ESZIP after http filter" };
  }

  // Wipe the per-EF staging dir before writing — handles file deletions cleanly.
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

// Sequential, not parallel — the WASM parser instance has internal state and we want
// deterministic file ordering on disk. 60 EFs at ~2-4s each = 2-4 minutes; well within
// the 10-min Actions timeout.
const entries: ManifestEntry[] = [];
let i = 0;
for (const slug of KEEP_LIST) {
  i++;
  try {
    const entry = await fetchAndDecode(slug);
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
