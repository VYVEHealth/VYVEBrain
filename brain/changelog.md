# VYVE Brain Changelog

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
