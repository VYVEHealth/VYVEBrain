# VYVE Brain Changelog

## 2026-04-10 (evening session)

### Password Reset Flow — Full Fix
- Root cause: `login.html` had `redirectTo` pointing to `login.html` instead of `set-password.html`
- Fixed `redirectTo` in `login.html` to `https://online.vyvehealth.co.uk/set-password.html`
- Fixed `set-password.html` to call `signOut(scope: global)` after password update, then redirect to `login.html?reset=success`
- Added success banner on `login.html` when `?reset=success` param present
- Added "Link already used" card to `set-password.html` with inline resend form — user can request new link without navigating away
- Increased invalid link timeout from 3s to 5s for slow mobile connections
- Supabase SMTP configured to send via Brevo (`smtp-relay.brevo.com:587`) — emails now send from VYVE Health <team@vyvehealth.co.uk> not Supabase Auth
- Brevo domain `vyvehealth.co.uk` verified (DKIM + DMARC green) via GoDaddy DNS
- Reset email template updated to table-based HTML button (renders correctly in all email clients)
- cache bumped: `vyve-cache-v2026-04-10a` → `b` → `c`

### Workouts.html — Nav Overlap Fixes
- Rest timer sheet and reorder exercises sheet were rendering behind the bottom nav bar
- Fixed `ex-menu-sheet` padding-bottom: `calc(72px + env(safe-area-inset-bottom))`
- Fixed `reorder-sheet` padding-bottom: `calc(84px + env(safe-area-inset-bottom))` and max-height: `calc(80vh - 65px)`
- Fixed `reorder-save-btn` bottom margin
- cache bumped: `vyve-cache-v2026-04-10c`

### Workout Plan Generation — Architecture Fix
- Root cause: `waitUntil` in onboarding EF has a hard timeout; advanced PPL plans (~14k tokens output) were silently failing
- Stuart Watts (`stuwatts09@gmail.com`) had no plan in `workout_plan_cache` — was seeing static fallback library
- Deployed new `generate-workout-plan` Edge Function (v4) as standalone dedicated EF
  - Generates weeks 1-4 and weeks 5-8 in two parallel API calls, stitches together
  - `max_tokens: 16000` per call — handles largest possible plans
  - `stop_reason` guard: fails loudly if output truncated, never writes corrupt data
- Updated `onboarding` EF to v43: replaces inline `waitUntil(generateWorkoutPlan)` with fire-and-forget fetch to `generate-workout-plan` EF
- Stuart's plan generated manually and written to `workout_plan_cache`: 8 weeks, 32 sessions, 36,521 chars
- Plan join verified — week 4→5 transition seamless (same exercises, correct progressive overload step)

### Stuart Watts — Account Notes
- Two accounts exist: `swatts@geoffreyrobinson.co.uk` (Feb 2026, old/legacy) and `stuwatts09@gmail.com` (10 Apr 2026, active)
- Active account is `stuwatts09@gmail.com` — RIVER persona, 4-day PPL, Advanced, Gym
- Old account has 12 workout logs with null plan/name (logged via legacy flow)
- All workout data safe — nothing deleted


## 2026-04-10

### External Brain System Created
- brain/master.md — complete business + technical context
- brain/how-to-use.md — human operator guide
- brain/schema-snapshot.md — all 36 tables from live Supabase
- brain/startup-prompt.md — trigger prompt for any AI session
- brain/changelog.md — this file

### Playbooks Created
- playbooks/brain-sync.md — session/daily/recovery sync system
- playbooks/debug.md — diagnose and fix issues
- playbooks/build.md — implement new features
- playbooks/research.md — deep understanding before action
- playbooks/review.md — code quality review
- playbooks/optimise.md — performance and readability
- playbooks/refactor.md — structural improvements
- playbooks/repo-audit.md — comprehensive system audit
- playbooks/execution.md — execute predefined plans
- playbooks/architect.md — system architecture design
- playbooks/github-operator.md — repo read/write operations
- playbooks/feature-build.md — end-to-end feature delivery
- playbooks/bug-fix.md — bug diagnosis and fix

### Tasks
- tasks/backlog.md — prioritised work queue
- tasks/task-template.md — reusable task card

### Infrastructure
- README.md — quick start guide
- prompts/cold-start.md — paste into any AI to begin

### Data Source
All verified against live Supabase project ixjfklpckgxrwjlfsaaz on 10 April 2026.

## 2026-04-10 (evening)

### Repo Hygiene
- `VYVEHealth/VYVEBrain` set to private — contains Supabase IDs, API keys references, commercial pipeline
- Removed duplicate `brain-sync.md` from repo root (canonical copy is `playbooks/brain-sync.md`)

### vyve-site Actions Cleanup
- Deleted dead `.github/workflows/inject-key.yml` — legacy workflow from before `anthropic-proxy` EF existed
- Verified `running-plan.html` already uses `anthropic-proxy` EF v5 (no placeholder, no key in HTML)
- `static.yml` (GitHub Pages deploy) retained — only workflow now running on vyve-site
- Commit: f557dae

## 2026-04-10 (morning/afternoon session)

### Daily Report Fixed
- `BREVO_API_KEY` secret was missing/wrong in Supabase — renamed to correct value
- `daily-report` v16 deployed — added full activity detail table (member name, type, specific activity, time)
- Report manually triggered and confirmed sending to team@vyvehealth.co.uk

### Password Reset Flow Fixed
- Supabase Site URL updated to `https://online.vyvehealth.co.uk/set-password.html`
- `set-password.html` confirmed correctly handles `PASSWORD_RECOVERY` token event
- Supabase email template updated: new VYVE-branded HTML body, subject now "Reset your VYVE password"

### Welcome Emails Resent
- Alan Bird and Owen Barrett identified as missing welcome emails (onboarded while Brevo key was absent)
- `resend-welcome` one-shot EF deployed — resent branded welcome with fresh set-password links
- BCC to team@vyvehealth.co.uk confirmed working on all future onboarding emails

### Backlog Updated
- Added: password reset email template (desktop task)
- Added: Exercise page redesign (product idea — gym / cardio / walking plan umbrella)

### Product Thinking
- Discussed replacing "Workouts" nav item with "Exercise" umbrella page
- Members choose path at onboarding: gym programme, running plan, walking/activity plan, or mix
- Each path generates an 8-week personalised plan (Sandra use case — non-gym corporate members)
- Key open question: do non-gym plans use same `workout_plan_cache` structure or simpler format?
- Decision deferred — parked in backlog under Later
