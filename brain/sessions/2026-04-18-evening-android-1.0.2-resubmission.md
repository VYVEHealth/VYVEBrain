# 18 April 2026 (evening) — Android 1.0.2 resubmission + cloud build infrastructure

## Context
Android Play Store rejected VYVE Health (co.uk.vyvehealth.app) on 15 April for "Misleading Claims — App does not match the store listing" (icon mismatch between installed app and store listing). Dean fixed the Android icons on PC and this session dealt with getting the resubmission through Play Console + setting up portable build infrastructure for the future.

## What shipped

### 1. Android 1.0.2 (versionCode 3) submitted to Play Store review
- Regenerated all Android icons via `@capacitor/assets` from `resources/icon.png`
- Fixed `ic_launcher.png` and `ic_launcher_foreground.png` to show correct VYVE teal V on dark green
- Initial rebuild attempt used `versionCode 2` — Play Console rejected with "Version code 2 has already been used." Every signed AAB upload **burns a versionCode** even if rejected.
- Bumped to `versionCode 3`, `versionName "1.0.2"`. Rebuilt signed AAB via Android Studio.
- Keystore: `C:\Users\DeanO\OneDrive\Desktop\vyve-release-key.jks`, alias `vyve-key`
- Resolved Play Console's remaining 9 pending changes: Content Rating (PEGI 3 / All other app types), Target audience (18+), Privacy policy URL, Ads declaration (No), Data safety questionnaire, App category (Health & Fitness), Store listing (EN-GB).
- Submission went into review at ~19:20 UTC 18 April 2026. Typical icon-rejection re-review: 24–72 hours.

### 2. Created VYVEHealth/vyve-capacitor GitHub repo (PRIVATE)
- Was PC-only at `C:\Users\DeanO\vyve-capacitor\` — now backed up to GitHub.
- Initial commit `2775db4` — 82 files (Android + Capacitor project structure, no secrets).
- `.gitignore` blocks: `*.jks`, `keystore.properties`, `google-services.json`, `GoogleService-Info.plist`, `node_modules/`, build outputs.
- Verified no secrets leaked on push: scanned root, `android/`, `android/app/` — clean.

### 3. GitHub Actions cloud build workflow (ready, secrets not yet added)
- Workflow: `.github/workflows/android-release.yml` — triggers on `v*` tags or manual dispatch.
- Pushes a tag → 8-min build → signed AAB downloadable from Actions Artifacts.
- **Secrets required (not yet added by Dean):** `KEYSTORE_BASE64`, `KEYSTORE_PASSWORD`, `KEY_ALIAS=vyve-key`, `KEY_PASSWORD`.
- Test tag `v1.0.2-test` pushed, workflow failed at 19s (secrets missing) — expected, will re-run once secrets added.
- PowerShell one-liner for base64-encoding the keystore:
  ```powershell
  [Convert]::ToBase64String([IO.File]::ReadAllBytes("C:\Users\DeanO\OneDrive\vyve-release-key.jks")) | Set-Clipboard
  ```

### 4. Keystore now backed up in 3 places
- OneDrive root: `C:/Users/DeanO/OneDrive/vyve-release-key.jks` (primary)
- Desktop: `C:/Users/DeanO/OneDrive/Desktop/vyve-release-key.jks` (original)
- Google Drive (Dean's choice): secondary cloud copy
- Pending: GitHub Secret (encoded, for cloud builds)
- Pending: MacBook copy (once Dean sets up Mac as primary build machine)

### 5. Documentation added to repo
- `README.md` — full setup for PC, Mac, and cloud builds
- `docs/BUILD_GRADLE_REFERENCE.md` — updated `build.gradle` with `signingConfigs` block for auto-signing via `keystore.properties` (not yet applied to Dean's local `build.gradle`)
- `docs/FIRST_PUSH_STEPS.md` — PC git init instructions
- `docs/SETUP_GITHUB_SECRETS.md` — GitHub Secrets walkthrough
- `android/keystore.properties.example` — template for local signing config

## Learnings / New rules

- **versionCode burns on every upload.** Any signed AAB uploaded to Play Console consumes that integer even if rejected. Always bump `versionCode` by 1 on every rebuild regardless of whether the previous upload "counted". Added to VYVEBrain rules.
- **`gradlew bundleRelease` from CLI without signing config = unsigned AAB.** Android Studio wizard applies keystore; CLI does not, unless `signingConfigs.release` block + `keystore.properties` are in `build.gradle`. Reference implementation in `docs/BUILD_GRADLE_REFERENCE.md`.
- **Content Rating questionnaire requires explicit Submit on Summary (Step 3).** Saving mid-flow does not submit — Dean hit this, caused an extra round trip in Play Console.
- **Privacy policy URL submitted to Play Store = `https://www.vyvehealth.co.uk/privacy-policy.html`** — VYVEBrain previously recorded the live URL as `privacy.html`. Needs verification. If 404s, Google may reject within 24–72h; mitigation is either (a) add a redirect on marketing site from `/privacy-policy.html` → `/privacy.html`, or (b) edit the URL in Play Console before review starts.

## Outstanding / next steps

1. **Verify privacy URL resolves** — before the Play Store review completes. Test `https://www.vyvehealth.co.uk/privacy-policy.html` in browser. If 404s, fix one of two ways above.
2. **Add 4 GitHub Secrets** to enable cloud builds (Dean, 5 min, browser only): https://github.com/VYVEHealth/vyve-capacitor/settings/secrets/actions
3. **Re-run failed workflow** once secrets added — will produce signed AAB artifact, proving cloud pipeline works.
4. **MacBook setup** — once Dean next on Mac, install Homebrew + Android Studio, clone repo, copy keystore from OneDrive, create `android/keystore.properties`. README covers all steps.
5. **Apply updated `build.gradle`** (with signing config) to local PC `android/app/build.gradle` — currently Dean's local copy is still the "no auto-signing" version.
6. **Android next release = versionCode 4 / versionName 1.0.3** (not 3 — 3 is burned on the rejected-then-shipped 1.0.2). Add to brain rules.

## Files handled on PC tonight (for Dean's records)
- `vyve-release-key.jks` — Android keystore
- `AuthKey_*.p8` — Apple App Store Connect API key (iOS, not used tonight)
- `GoogleService-Info.plist` / `google-services.json` — Firebase config (iOS push, not used tonight)
