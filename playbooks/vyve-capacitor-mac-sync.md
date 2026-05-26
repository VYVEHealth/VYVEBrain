# Playbook: vyve-capacitor Mac local sync & recovery

*Created 26 May 2026 PM-404 by Claude after Dean's local Mac copy diverged from remote by 1 commit + 12 working-tree mods + 90+ untracked files. Use this when the local working tree drifts unrecoverably or before any native bundle work.*

## Repo facts (do not change without updating this doc)

| Field | Value |
|---|---|
| Local path | `~/Projects/vyve-capacitor` |
| Remote | `git@github.com:VYVEHealth/vyve-capacitor.git` (private) |
| Default branch | `main` |
| Source-of-truth canonical commit | Always remote `main` |
| iOS app version | 1.2 (App Store, approved 28 April 2026) |
| Android app version | 1.0.2 (Play Store, awaiting Google review) |
| iOS bundle ID | `co.uk.vyvehealth.app` |
| Android keystore | `~/Projects/vyve-capacitor/android/app/keystore/vyve-release-key.jks` (PKCS12, alias `vyve-key`, pwd `Weareinthis2026!` — also stored in 1Password as of session ___ TBD) |
| Capacitor version | 6 (SPM-only on iOS, no Podfile) |
| Capgo Health plugin | `@capgo/capacitor-health@8.4.7` (iOS HealthKit live since 1.2; Android Health Connect APPROVED, not yet wired) |
| Browser plugin | `@capacitor/browser@8.0.3` (queued for external-link external-Safari handling, PM-250) |
| LiveUpdate (Capawesome OTA) | App `f9961f66-eb66-4102-b1c5-f9b2c7baeebf`, prod channel `89e12796`, autoDeleteBundles true |

## When local drifts: standard recovery sequence

**Symptom**: `git status` shows working-tree modifications + untracked files, `git log --oneline -5` shows only the initial commit, local working tree behind remote.

**Step 0 — Diagnose. Do nothing destructive yet.**

```bash
cd ~/Projects/vyve-capacitor
git fetch origin
echo "Local HEAD:  $(git rev-parse HEAD)"
echo "Remote HEAD: $(git rev-parse origin/main)"
echo "Behind:  $(git rev-list --count HEAD..origin/main) commits"
echo "Ahead:   $(git rev-list --count origin/main..HEAD) commits"
git log --oneline 3432aab..origin/main  # what's in remote not local
git status --short
```

**Step 1 — Snapshot dirty state to a stash with a tag.**

```bash
git stash push --include-untracked -m "RECOVERY-$(date +%Y%m%d-%H%M)-$(git rev-parse --short HEAD)"
git status --short  # should be empty after this
```

**Step 2 — Fast-forward pull to remote.**

```bash
git pull --ff-only origin main
```

If this errors with "Not possible to fast-forward" — local has commits not in remote. Stop and consult before forcing.

**Step 3 — Review stash contents.**

```bash
git stash show -p stash@{0} --stat
# For each file: was the local mod regenerated content (Capacitor sync), genuinely new work, or stale crud?
```

Categories typically seen:
- **Capacitor regeneration** (capacitor.build.gradle, capacitor.settings.gradle, Package.resolved, project.pbxproj) — discard. These regenerate on `npx cap sync`.
- **Manually edited native config** (Info.plist, AndroidManifest.xml, build.gradle, capacitor.config.json, AppDelegate.swift) — REVIEW LINE BY LINE. Cherry-pick the diffs that aren't already in remote.
- **www/ files** — should never be in vyve-capacitor's git. These belong in vyve-site. Add to `.gitignore` post-recovery.
- **`.bak-*` / `.bak2` / `.bundled-backup` files** — discard. These are pre-PF-14b/PM-115 dev artefacts.
- **`--exclude=.git` / `--exclude=.github` files** (0 bytes) — historical typo. Delete.

**Step 4 — Verify native config matches what's needed for the bundle.**

```bash
# Portrait lock (post-PM-250)
grep -A 4 "UISupportedInterfaceOrientations" ios/App/App/Info.plist
# Must show only UIInterfaceOrientationPortrait inside <array> for iPhone
grep -i "screenOrientation" android/app/src/main/AndroidManifest.xml
# Must show: android:screenOrientation="portrait"

# Bundled-mode config (post-PF-14b)
cat capacitor.config.json
# Must contain plugins.LiveUpdate.appId = f9961f66-eb66-4102-b1c5-f9b2c7baeebf
# Must contain server.iosScheme + server.androidScheme + server.hostname (NOT server.url)
```

**Step 5 — Apply cherry-picked stash items if any survived review.**

```bash
# Per-file restore from stash:
git checkout stash@{0} -- <path/to/file>
# Then review, commit normally.
```

**Step 6 — Gitignore the www/ tree.**

If untracked www/* files exist (they always do after Capacitor sync from vyve-site):

```bash
echo "" >> .gitignore
echo "# www/ is regenerated from vyve-site at bundle time — never committed here" >> .gitignore
echo "www/" >> .gitignore
git add .gitignore
git commit -m "gitignore: regenerated www/ tree (synced from vyve-site at bundle time)"
git push origin main
```

**Step 7 — Drop the stash once review complete.**

```bash
git stash drop stash@{0}
```

## .gitignore canonical contents (memory #5)

```
# Capacitor build artefacts
node_modules/
ios/App/Pods/
ios/DerivedData/
**/xcuserdata/**
www/cordova-plugins/
www/cordova.js
www/cordova_plugins.js

# Secrets — never commit
*.p8
*.p12
*.cer
*.mobileprovision
*.provisionprofile
*.jks
*.keystore
keystore.properties
google-services.json
GoogleService-Info.plist
.env*

# Dev artefacts
*.bak.*
*.bak-*

# www/ is regenerated from vyve-site at bundle time
www/

# Junk from earlier session typos
--exclude=*
```

## Bundle prep workflow (post-recovery)

Once local is in sync at remote `main`, the bundle workflow is:

1. **Confirm vyve-site main is at the SHA you want frozen into the bundle.**
2. **Sync www/ from vyve-site into vyve-capacitor**:
   ```bash
   cd ~/Projects/vyve-site && git pull --ff-only
   rsync -av --delete --exclude='.git' --exclude='.github' --exclude='node_modules' \
     ~/Projects/vyve-site/ ~/Projects/vyve-capacitor/www/
   ```
3. **Capacitor sync** (regenerates platform-specific bridge files):
   ```bash
   cd ~/Projects/vyve-capacitor && npx cap sync
   ```
4. **Asset regen if icon/splash sources changed**:
   ```bash
   npx @capacitor/assets generate --ios --android
   # Manual orphan cleanup in ios/App/App/Assets.xcassets/Splash.imageset/ — see memory #3
   ```
5. **iOS bundle** — open `ios/App/App.xcworkspace` in Xcode → Product → Archive → Distribute → App Store Connect.
6. **Android bundle** — `cd android && ./gradlew bundleRelease` → upload `app/build/outputs/bundle/release/app-release.aab` to Play Console.

## Keystore safety (memory #4 — P0 launch blocker)

The Android keystore is **unrecoverable** if lost. Bundle ID `co.uk.vyvehealth.app` becomes permanently unshippable.

Required redundant storage:
1. Local Mac at `~/Projects/vyve-capacitor/android/app/keystore/vyve-release-key.jks` (current)
2. **1Password vault entry** with file attachment + password — DO THIS BEFORE EVERY BUNDLE NIGHT
3. Optional: encrypted backup to iCloud Drive or USB stick

`.gitignore` covers it so it never reaches the GitHub remote.

## Junk files cleanup

Files commonly littering the local working tree:
- `*.bak-pf14b`, `*.bak-pf14b-android`, `*.bak2`, `*.bak3`, `*.bundled-backup` — pre-bundled-mode dev artefacts, all deletable after recovery
- `--exclude=.git`, `--exclude=.github` — earlier session typo from a `git add --exclude=...` command that was actually being interpreted as filenames

```bash
rm -f ~/Projects/vyve-capacitor/--exclude=.git
rm -f ~/Projects/vyve-capacitor/--exclude=.github
rm -f ~/Projects/vyve-capacitor/**/*.bak-*
rm -f ~/Projects/vyve-capacitor/**/*.bak[0-9]
rm -f ~/Projects/vyve-capacitor/capacitor.config.json.bundled-backup
```

## Source asset PNGs

Required at `assets/icon.png` and `assets/splash.png` in vyve-capacitor root:

| Asset | Size | Format | Background |
|---|---|---|---|
| icon.png | 1024×1024 | RGB no-alpha (Apple rejects RGBA) | #0D2B2B (VYVE Dark) |
| splash.png | 2732×2732 | RGB no-alpha | #0D2B2B (VYVE Dark) |

Verify with `sips`:
```bash
sips -g pixelWidth -g pixelHeight -g hasAlpha assets/icon.png
sips -g pixelWidth -g pixelHeight -g hasAlpha assets/splash.png
```

`hasAlpha: no` is mandatory — Apple's App Store rejects RGBA assets at submission. If `hasAlpha: yes`, flatten:
```bash
sips -s formatOptions opaque -s format png assets/icon.png --out assets/icon.png
```

On Apple Silicon Macs, `@capacitor/assets` requires Sharp's native binary:
```bash
npm install --include=optional sharp
```

## When to use this playbook

- Pre-bundle prep (every bundle night)
- After a major vyve-site campaign that touched native bridge code (apple-health.html, push-native.js, healthbridge.js)
- When Dean's Mac drifts from remote by ≥1 commit
- When working-tree shows ≥5 modified files or any untracked .bak files
- When a previous session's brain entry mentions "vyve-capacitor needs git work" or similar

## Open work tracked in backlog

- **Health Connect Android wire** — PM-404 follow-up. Plugin installed (`@capgo/capacitor-health@8.4.7`), Android Health Connect approval received. Needs: Health Connect SDK in `android/app/build.gradle`, permission strings in AndroidManifest, `<queries>` block declaring intent to discover Health Connect, vyve-site `healthbridge.js` Android branch parallel to existing iOS HealthKit path.
- **Browser plugin external-link wire** — `@capacitor/browser@8.0.3` installed, not yet called from vyve-site. PM-250 queued this; not wired. Confirm whether deferred or shipped pre-bundle.

