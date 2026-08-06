# Playbook — Live-Box Remote Control (vyve-agent)

**PM-835 · created 6 Aug 2026.** How Claude manages the Hetzner live box (159.69.95.90) without SSH, from any session including phone-only-Dean incidents. Claude's sandbox egress is domain-whitelisted and cannot open SSH; Supabase is the control plane instead.

## Architecture

Three layers on the box (installed via `vyve-agent-install.sh`, PM-835):

1. **systemd hardening** — the runner unit carries a drop-in (`restart.conf`): `Restart=always`, `RestartSec=10`, `StartLimitIntervalSec=0`. Process death self-recovers in ~10s with no involvement from anyone.
2. **vyve-agent auto-heal** — separate systemd service (`vyve-agent`, itself `Restart=always`), 30s loop. Restarts the runner when the unit is inactive OR the Supabase `runner_heartbeat` beat is ≥5 min stale (covers hangs, not just crashes). Loop guard: never heals twice within 10 min. Every heal writes a `self_heal` row into `runner_commands` with the reason.
3. **Command queue** — the agent polls `runner_commands` for `status='pending'` rows (oldest first, one per 30s tick), executes an **allowlisted verb only**, and PATCHes the row with the output. No arbitrary shell by design: a compromised row cannot do anything outside the allowlist.

## Allowlist

| command | args | does |
|---|---|---|
| `restart_runner` | — | `systemctl restart` the runner unit, reports resulting active-state |
| `status` | — | `systemctl status` head (40 lines) |
| `journal` | `{"lines": N}` (default 80, cap 400) | `journalctl -u <runner> -n N` |
| `ls_masters` | — | `ls -la /srv/vyve/masters/media` |
| `disk` | — | `df -h / /srv` + `free -m` |
| `uptime` | — | box uptime + runner active-state |

## How Claude drives it

Issue a command (Supabase MCP `execute_sql`, project ixjfklpckgxrwjlfsaaz):

```sql
INSERT INTO runner_commands (command, args, requested_by)
VALUES ('journal', '{"lines": 120}', 'claude-session')
RETURNING id;
```

Wait ~30–60s (agent tick), then read:

```sql
SELECT status, result->>'output' AS output, result->>'rc' AS rc, completed_at
FROM runner_commands WHERE id = '<id>';
```

Status flow: `pending → running → done|error`. Output is truncated to the last 12,000 chars. If a row sits `pending` >2 min, the agent itself is down (see Failure modes).

RLS: `runner_commands` has RLS enabled with **no policies** — service-role only, invisible to every client role. Keep it that way; the command surface must never be reachable from the app.

## Incident decision tree (watchdog alert arrives)

1. `SELECT beat_at, now()-beat_at AS age, detail FROM runner_heartbeat;`
   - **Age <2 min** → runner alive; failure is session-specific (missing mp4, YouTube state). Issue `journal` around the session start time; check the row's `notes` filename against `ls_masters`.
   - **Age >5 min** → runner down/hung. Check for a recent `self_heal` row in `runner_commands`:
     - Self-heal present but heartbeat still stale → runner is crash-looping. Issue `journal` for the stack; this needs a code fix, not another restart.
     - No self-heal → the agent is down too (see below). Escalate to Dean SSH.
2. `SELECT * FROM broadcast_watch_alerts WHERE resolved_at IS NULL ORDER BY fired_at;` — an **open `runner_down` alert suppresses further runner emails** (dedupe by alert_key). During the 5–6 Aug incident this hid a 17-hour outage behind per-session symptoms: always check open alerts, not just the latest email.
3. Session-level `not_live` with a healthy heartbeat and file present → YouTube side: token (`youtube-token-health`), quota, or stream-key mismatch. `journal` will show the ffmpeg/API error.

## Failure modes & recovery

- **Agent down** (pending rows never picked up): systemd restarts it automatically; if it stays down the box itself is likely off/unreachable → Dean SSH `systemctl status vyve-agent` / Hetzner console. The agent has no watchdog of its own by design — it IS the watchdog; its liveness signal is command pickup.
- **Both runner and agent silent + no heartbeat** → box-level event (reboot without units enabled, network, Hetzner outage). Dean SSH is the only path.
- **Heal loop guard blocking** a needed restart: issue an explicit `restart_runner` command — commands bypass the 10-min guard.
- **Credential rotation**: the agent reads `/srv/vyve/agent/env` (chmod 600, service_role key auto-extracted from the runner's EnvironmentFile at install). Rotating the service key means re-running the installer or editing that file.

## Install / reinstall

`vyve-agent-install.sh` (delivered 6 Aug; re-generate from this playbook's spec if lost). Run as root on the box; idempotent. Auto-detects the runner unit name (`RUNNER_UNIT=<name>` to override) and the service key. Verifies both units active at the end.

## Standing rules

- The runner picking up schedule changes "on next heartbeat, no restart" is only true **while the heartbeat is fresh** — verify heartbeat age before relying on it (PM-833's regen assumed a live runner that had been dead 9 hours).
- After any calendar regen or runner incident, close the loop with `uptime` + `status` via the queue, and confirm the next scheduled session actually flips its broadcast to 'live' (watchdog auto-resolves as the proof).
