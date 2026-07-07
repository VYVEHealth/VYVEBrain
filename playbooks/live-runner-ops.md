# Playbook — Live-Session Runner (Hetzner box)

> Owner: Dean · Established PM-714 (7 Jul 2026) · The runner turns `calendar_occurrences` into real YouTube live broadcasts by pushing master mp4s over RTMP at their scheduled time. It lives on a Hetzner VPS; Dean's Mac is fully out of the loop.

## The box

| | |
|---|---|
| Host | Hetzner Cloud CX23 `vyve-live-runner` (project "VYVE Health", Dean's account) |
| IP | **159.69.95.90** (Nuremberg, eu-central) |
| OS | Ubuntu 26.04 · 2 vCPU · 4G RAM · 38G disk (~11G used by masters) |
| Cost | €5.99/mo (server + IPv4), hourly-billed |
| Access | `ssh root@159.69.95.90` — key auth ONLY. Claude: derive key from vault `VYVE_RUNNER_SSH_KEY` (base64 → PEM, chmod 600) and ssh from the Composio sandbox. Dean: his Mac key (`~/.ssh/id_ed25519`, `deanbrown@MacBook-Pro.local`) is authorized. |
| Daemon | systemd `vyve-live-runner` (enabled, Restart=always, survives reboot) |

## Layout

```
/opt/vyve/                    runner + thumb scripts + PlayfairDisplay.ttf
/opt/vyve/vyve-runner.env     chmod 600 — Supabase URL + service_role key + VYVE_MEDIA_DIR
/srv/vyve/masters/media/      the masters (124 mp4s @ PM-714) — occurrence `notes` = bare filename here
/srv/vyve/masters/media/hosts/  8 host cards (alex nicola jamie lewis lucy calum alan shan .jpg)
/etc/systemd/system/vyve-live-runner.service
```

Secrets model: ONLY the service_role key sits on the box. YouTube OAuth + RTMP stream keys are read from Supabase Vault at runtime — token rotations need no box changes. (The service key is the known-exposed one; when it's rotated, update `/opt/vyve/vyve-runner.env` and `systemctl restart vyve-live-runner`.)

## Daily verification (usually: do nothing)

The `broadcast-watchdog` EF (cron */5) checks the runner heartbeat and that scheduled sessions are actually live on YouTube — email to team@ + push to Dean on failure, auto-resolving. **Silence = healthy.** Manual check:

```
ssh root@159.69.95.90 'systemctl status vyve-live-runner --no-pager | head -5; journalctl -u vyve-live-runner -n 20 --no-pager'
```

Or query `runner_heartbeat` — `beat_at` should be <2 min old, `detail.upcoming` = sessions in window.

## Add a new video

1. Dean drops the mp4 into Mac `~/vyve-live/media/` (the Mac copy doubles as cold backup), then:
   `rsync -avP ~/vyve-live/ root@159.69.95.90:/srv/vyve/masters/`  (incremental — sends only new files)
2. Tell Claude the filename(s) + intended slot/rotation. Claude then: ffprobe duration on the box → `calendar_occurrences` rows (`notes` = EXACT filename incl. case; `ends_at` = starts + duration; host card via `image_url`). Member-facing copy (title/description) is Lewis-gated if new.
3. Filename rules learned PM-714: avoid multi-space runs (macOS `xargs` mangles them); if parallelising a big rsync (`xargs -P4`) always finish with one plain `rsync -avP` verify pass. Starlink pins a single rsync stream to ~1MB/s — that's latency, not bandwidth.

## Smoke test / manual air

```
ssh root@159.69.95.90
cd /opt/vyve && set -a && . ./vyve-runner.env && set +a
python3 vyve-live-runner.py --once <occurrence_id> --dry-run   # resolves media+keys+broadcast, prints plan, changes NOTHING
python3 vyve-live-runner.py --once <occurrence_id>             # airs it NOW (ignores start time)
```

## Restart / recover

```
systemctl restart vyve-live-runner        # after env or runner changes
journalctl -u vyve-live-runner -f         # follow logs
```

Runner script source of truth: `VYVEBrain/scripts/vyve-live-runner/` — edit there, then curl the raw file onto the box (PAT) and restart. Never hand-edit only the box copy.

Box dies entirely → emergency fallback is the Mac: `rsync` is already two-way-capable (Mac copy is current minus post-migration uploads), launchd plist still at `~/Library/LaunchAgents/com.vyve.live-runner.plist` — `launchctl load` it, and STOP the box daemon first if it's half-alive (two runners = double-push to the same RTMP key). Rebuild-from-scratch is ~20 min: create server with vault pubkey, apt ffmpeg, pull /opt/vyve files from VYVEBrain, write env, rsync masters from Mac, systemd enable.

## Standing notes

- `session-publish` cron 27 (hourly) still pre-creates broadcasts as belt-and-braces — CAS-safe to co-run with the runner. Optional: disable after a clean week of box-owned airs.
- Hetzner egress: ~15–20GB/mo of pushes vs 20TB included — viewers cost nothing (YouTube CDN serves them).
- August calendar regen (before 2 Aug) must carry the Calum rotation: Midweek Reset Weds 12:00 (resume reset 2,3,1…), Weekly Review Fris 19:30 (resume review 2,3,1…).
