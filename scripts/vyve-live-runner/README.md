# vyve-live-runner

Always-on pusher for VYVE simulated-live. Turns `calendar_occurrences` into real
YouTube live broadcasts by pushing back-catalogue masters at their scheduled time.

**Why a box (not an Edge Function):** a 20-min ffmpeg push outlives the EF runtime.
**Why it transitions explicitly:** `enableAutoStart` is dead on this channel — a
broadcast on autostart sits in `ready` forever. `session-publish` v5 pre-creates
with autostart OFF; this runner owns every `ready->live` and `live->complete`.

## Model
broadcast (autostart/monitor/autostop OFF) -> ffmpeg push to the category's
reusable RTMP key -> poll bound stream until `streamStatus==active` ->
transition `ready->live` -> on push end transition `live->complete`.

## Setup (interim = Dean's Mac)
1. `brew install ffmpeg`
2. Drop `vyve-live-runner.py` somewhere stable (e.g. `~/vyve/`).
3. Masters live in `VYVE_MEDIA_DIR`; each occurrence's `notes` is the bare filename.
4. Keep-alive: `com.vyve.live-runner.plist` -> `~/Library/LaunchAgents/` (Linux: the systemd unit).

Only the Supabase service key sits on the box. YouTube OAuth creds + stream keys
are read from Vault at runtime, so the re-minted refresh token has one home.

## Smoke test (do this before trusting the schedule)
```
VYVE_SUPABASE_URL=https://ixjfklpckgxrwjlfsaaz.supabase.co \
VYVE_SUPABASE_SERVICE_KEY=<service-role key> \
VYVE_MEDIA_DIR="$HOME/Desktop/VYVE LIVES" \
python3 vyve-live-runner.py --once 0be49b96-eec2-4c06-9e01-762e10c39118 --dry-run
```
That occurrence is **4 Jun 07:00 Yoga Flexibility** (`Yoga Flexibility.mp4`,
stream `…341014499`). `--dry-run` resolves the file + RTMP target + broadcast plan
and prints the exact ffmpeg command, changing nothing. Drop `--dry-run` to air it
for real immediately (it ignores the start time under `--once`).

Daemon (normal operation): `python3 vyve-live-runner.py`
Single day: `python3 vyve-live-runner.py --date 2026-06-04`

## After the box is proven live
Turn OFF the `session-publish-hourly` pg_cron (jobid 27) so the box solely owns
broadcast creation — the runner's CAS write-back makes them safe to co-run until then.
