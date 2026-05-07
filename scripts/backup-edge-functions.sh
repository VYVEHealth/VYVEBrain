#!/usr/bin/env bash
# VYVE Edge Function Source Backup — bash + supabase CLI version.
#
# `supabase functions download <slug>` puts decoded source under
# supabase/functions/<slug>/ (relative to the working dir). We then move each
# slug's files into the staging/edge-functions/ tree and build the manifest.
#
# Requirements: SUPABASE_ACCESS_TOKEN env (the CLI's recognised name), jq.

set -uo pipefail
# NOT set -e — we want per-EF errors logged into the manifest, not run-aborting.

REF="${SUPABASE_PROJECT_REF:-ixjfklpckgxrwjlfsaaz}"
STAGING="${STAGING_DIR:-staging/edge-functions}"
PAT="${MGMT_PAT:-${SUPABASE_ACCESS_TOKEN:-}}"
if [ -z "$PAT" ]; then
  echo "MGMT_PAT / SUPABASE_ACCESS_TOKEN not set" >&2
  exit 2
fi

# 07 May 2026 KEEP list — see VYVEBrain backlog Item 3 spec.
KEEP_LIST=(
  achievement-earned-push achievements-mark-seen achievements-sweep admin-dashboard
  admin-member-edit admin-member-habits admin-member-programme admin-member-weekly-goals
  admin-programme-library anthropic-proxy cc-data certificate-checker certificate-serve
  check-cron daily-report edit-habit email-watchdog employer-dashboard
  gdpr-erase-cancel gdpr-erase-execute gdpr-erase-request gdpr-erase-status
  gdpr-export-execute gdpr-export-request generate-workout-plan get-activity-feed
  get-health-data github-proxy github-proxy-marketing habit-reminder internal-dashboard
  leaderboard log-activity member-achievements member-dashboard monthly-checkin
  monthly-report notifications off-proxy onboarding ops-brief platform-alert
  process-scheduled-pushes push-send-native re-engagement-scheduler re-engagement-test-sender
  register-push-token schedule-push schema-snapshot-refresh seed-weekly-goals
  send-email send-journey-recap send-push send-session-recap share-workout
  storage-cleanup streak-reminder sync-health-data
  warm-ping weekly-report wellbeing-checkin workout-library
)

SNAPSHOT_AT=$(date -u +%Y-%m-%dT%H:%M:%SZ)
TOTAL="${#KEEP_LIST[@]}"
mkdir -p "$STAGING"

# Working dir for CLI downloads; deletes between EFs to keep things isolated.
WORK_ROOT=$(mktemp -d)
cd "$WORK_ROOT"

# Build a JSON manifest as we go using jq's append pattern.
echo '[]' > /tmp/manifest_entries.json

SUCCEEDED=0
FAILED=0
FAILED_SLUGS=()

i=0
for slug in "${KEEP_LIST[@]}"; do
  i=$((i+1))
  echo
  echo "[${i}/${TOTAL}] $slug"

  # Clean any previous download
  rm -rf supabase/functions/"$slug" 2>/dev/null || true

  # Download source via CLI (writes under supabase/functions/<slug>/)
  if ! supabase functions download "$slug" --project-ref "$REF" >/tmp/dl.log 2>&1; then
    err=$(tail -c 500 /tmp/dl.log | tr -d '\n' | head -c 500)
    echo "  FAIL download: $err"
    FAILED=$((FAILED+1))
    FAILED_SLUGS+=("$slug")
    jq --arg slug "$slug" --arg err "$err" \
      '. += [{slug: $slug, ok: false, error: $err}]' /tmp/manifest_entries.json > /tmp/m.tmp && mv /tmp/m.tmp /tmp/manifest_entries.json
    continue
  fi

  src_dir="supabase/functions/$slug"
  if [ ! -d "$src_dir" ]; then
    echo "  FAIL: download succeeded but $src_dir not present"
    FAILED=$((FAILED+1))
    FAILED_SLUGS+=("$slug")
    jq --arg slug "$slug" '. += [{slug: $slug, ok: false, error: "download produced no directory"}]' /tmp/manifest_entries.json > /tmp/m.tmp && mv /tmp/m.tmp /tmp/manifest_entries.json
    continue
  fi

  # Hit the Management API for metadata (version, verify_jwt, ezbr_sha256).
  meta=$(curl -sS -H "Authorization: Bearer $PAT" -H "Accept: application/json" \
    "https://api.supabase.com/v1/projects/$REF/functions/$slug")
  if ! echo "$meta" | jq -e . >/dev/null 2>&1; then
    echo "  FAIL: metadata not JSON: $(echo "$meta" | head -c 300)"
    FAILED=$((FAILED+1))
    FAILED_SLUGS+=("$slug")
    jq --arg slug "$slug" --arg err "metadata not JSON" '. += [{slug: $slug, ok: false, error: $err}]' /tmp/manifest_entries.json > /tmp/m.tmp && mv /tmp/m.tmp /tmp/manifest_entries.json
    continue
  fi

  # Build the per-file array (relative paths within $src_dir, with sha256 + bytes).
  files_json=$(cd "$src_dir" && find . -type f | sed 's|^\./||' | while read -r rel; do
    sha=$(sha256sum "$rel" | cut -d' ' -f1)
    bytes=$(wc -c <"$rel" | tr -d ' ')
    jq -n --arg n "$rel" --arg s "$sha" --argjson b "$bytes" '{name:$n, sha256:$s, bytes:$b}'
  done | jq -s .)

  file_count=$(echo "$files_json" | jq 'length')
  if [ "$file_count" -eq 0 ]; then
    echo "  FAIL: download produced 0 files"
    FAILED=$((FAILED+1))
    FAILED_SLUGS+=("$slug")
    jq --arg slug "$slug" --arg err "download produced 0 files" '. += [{slug: $slug, ok: false, error: $err}]' /tmp/manifest_entries.json > /tmp/m.tmp && mv /tmp/m.tmp /tmp/manifest_entries.json
    continue
  fi

  echo "  OK: $file_count files"
  SUCCEEDED=$((SUCCEEDED+1))

  # Move into staging — wipe target first so deletions land cleanly between snapshots.
  target_dir="$GITHUB_WORKSPACE/$STAGING/$slug"
  rm -rf "$target_dir"
  mkdir -p "$target_dir"
  cp -R "$src_dir"/. "$target_dir"/

  # Append manifest entry
  echo "$meta" | jq --arg slug "$slug" --argjson files "$files_json" \
    '{slug: $slug, ok: true, platform_version: .version, verify_jwt: .verify_jwt, status: .status, ezbr_sha256: .ezbr_sha256, entrypoint: .entrypoint_path, files: $files}' \
    > /tmp/entry.json
  jq --slurpfile entry /tmp/entry.json '. += $entry' /tmp/manifest_entries.json > /tmp/m.tmp && mv /tmp/m.tmp /tmp/manifest_entries.json
done

cd "$GITHUB_WORKSPACE"
echo
echo "=== Done. $SUCCEEDED/$TOTAL succeeded. $FAILED failed. ==="
if [ $FAILED -gt 0 ]; then
  echo "Failed: ${FAILED_SLUGS[*]}"
fi

if [ $SUCCEEDED -eq 0 ]; then
  echo "All EF backups failed — refusing to overwrite manifest." >&2
  exit 1
fi

# Sort entries by slug for deterministic diffs
jq 'sort_by(.slug)' /tmp/manifest_entries.json > /tmp/m_sorted.json

# Build final manifest
keep_json=$(printf '%s\n' "${KEEP_LIST[@]}" | jq -R . | jq -s .)
jq -n \
  --arg snap "$SNAPSHOT_AT" \
  --arg ref "$REF" \
  --argjson attempted "$TOTAL" \
  --argjson ok "$SUCCEEDED" \
  --argjson fail "$FAILED" \
  --argjson keep "$keep_json" \
  --slurpfile entries /tmp/m_sorted.json \
  '{
    snapshot_at: $snap,
    supabase_project: $ref,
    brain_repo: "VYVEHealth/VYVEBrain",
    brain_branch: "main",
    ef_count_attempted: $attempted,
    ef_count_succeeded: $ok,
    ef_count_failed: $fail,
    keep_list: $keep,
    entries: $entries[0],
  }' > "$GITHUB_WORKSPACE/$STAGING/MANIFEST.json"

echo "Manifest written: $GITHUB_WORKSPACE/$STAGING/MANIFEST.json"
