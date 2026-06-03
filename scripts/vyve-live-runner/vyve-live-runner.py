#!/usr/bin/env python3
"""
VYVE simulated-live auto-runner  (PM-445)
=========================================

A single, dependency-free daemon for an always-on box (a Mac mini, a cheap
mini-PC, a Pi 5 — anything that stays powered) that turns VYVE's scheduled
`calendar_occurrences` into real YouTube live broadcasts by pushing the
back-catalogue master files at their scheduled time.

It encodes the model proved by hand on 2 Jun 2026:

    enableAutoStart is BROKEN on this channel. A broadcast left on autostart
    sits in "ready" forever and a manual transition is rejected with
    invalidTransition. The reliable path is:

        broadcast created with autostart OFF + monitor OFF + autostop OFF
        -> start the ffmpeg push to the category's reusable RTMP key
        -> poll the bound stream until streamStatus == "active"
        -> explicitly transition the broadcast ready -> live
        -> when the push ends, explicitly transition live -> complete

    `session-publish` (the hourly Edge Function) is v5 and also pre-creates
    broadcasts with autostart OFF, so this runner OWNS every live/complete
    transition. The runner does the two halves the EF deliberately does NOT:
    the precise wait-until-airtime, and the live/complete transitions around
    a real ffmpeg push.

Master-file convention
----------------------
Put the bare filename in `calendar_occurrences.notes` and set VYVE_MEDIA_DIR to
the folder holding the masters. notes="Yoga Flexibility.mp4" +
VYVE_MEDIA_DIR="~/Desktop/VYVE LIVES" -> pushes "~/Desktop/VYVE LIVES/Yoga
Flexibility.mp4". An occurrence whose notes is empty or doesn't resolve to a
real file is skipped with a loud warning (it never airs silently broken).

Secrets
-------
Only the Supabase service key lives on the box (env). The YouTube OAuth creds
and the RTMP stream keys are read from Supabase Vault at runtime, so the
re-minted refresh token has ONE home (Vault) and the box always picks up the
current one.

    VYVE_SUPABASE_URL          https://ixjfklpckgxrwjlfsaaz.supabase.co
    VYVE_SUPABASE_SERVICE_KEY  <service-role key>          (required)
    VYVE_MEDIA_DIR             folder holding the master mp4s (required)
    VYVE_REFRESH_INTERVAL      daemon poll seconds (default 60)
    VYVE_SPAWN_HORIZON         spawn a worker this many seconds before start (default 900)

Usage / test modes
------------------
    python3 vyve-live-runner.py                      # daemon (normal operation)
    python3 vyve-live-runner.py --once <occ_id>      # run ONE occurrence NOW, ignoring its start time
    python3 vyve-live-runner.py --once <occ_id> --dry-run
                                                     # resolve everything + print the ffmpeg command
                                                     # and the API calls it WOULD make, pushing/
                                                     # transitioning NOTHING
    python3 vyve-live-runner.py --date 2026-06-04    # daemon, but only that day's occurrences

The --once / --dry-run modes are how to smoke-test the box against a single
slot before trusting it with a full schedule, exactly like the manual proof.
"""

import argparse
import json
import os
import subprocess
import sys
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone

YT = "https://www.googleapis.com/youtube/v3"
OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token"

# ── env ───────────────────────────────────────────────────────────────────
SUPABASE_URL = os.environ.get("VYVE_SUPABASE_URL", "https://ixjfklpckgxrwjlfsaaz.supabase.co").rstrip("/")
SERVICE_KEY = os.environ.get("VYVE_SUPABASE_SERVICE_KEY", "")
MEDIA_DIR = os.path.expanduser(os.environ.get("VYVE_MEDIA_DIR", ""))
# thumbnails: <basename>.jpg, in VYVE_THUMB_DIR if set, else alongside the masters
THUMB_DIR = os.path.expanduser(os.environ.get("VYVE_THUMB_DIR", "") or MEDIA_DIR)
REFRESH_INTERVAL = int(os.environ.get("VYVE_REFRESH_INTERVAL", "60"))
SPAWN_HORIZON = int(os.environ.get("VYVE_SPAWN_HORIZON", "900"))

STREAM_ACTIVE_TIMEOUT = 120  # seconds to wait for the bound stream to report active after ffmpeg starts
STREAM_POLL_INTERVAL = 3


def log(*a):
    print(f"[{datetime.now(timezone.utc).isoformat(timespec='seconds')}]", *a, flush=True)


def die(msg, code=1):
    log("FATAL:", msg)
    sys.exit(code)


# ── HTTP helpers (stdlib only) ──────────────────────────────────────────────
def _req(method, url, headers=None, data=None):
    body = None
    h = dict(headers or {})
    if data is not None:
        body = json.dumps(data).encode()
        h.setdefault("Content-Type", "application/json")
    r = urllib.request.Request(url, data=body, headers=h, method=method)
    try:
        with urllib.request.urlopen(r) as resp:
            txt = resp.read().decode()
            return resp.status, (json.loads(txt) if txt else None)
    except urllib.error.HTTPError as e:
        txt = e.read().decode()
        try:
            return e.code, json.loads(txt)
        except Exception:
            return e.code, {"_raw": txt[:500]}


def _form_post(url, fields):
    body = urllib.parse.urlencode(fields).encode()
    r = urllib.request.Request(url, data=body,
                               headers={"Content-Type": "application/x-www-form-urlencoded"},
                               method="POST")
    with urllib.request.urlopen(r) as resp:
        return json.loads(resp.read().decode())


def supa(method, path, data=None, prefer=None):
    h = {"apikey": SERVICE_KEY, "Authorization": f"Bearer {SERVICE_KEY}"}
    if prefer:
        h["Prefer"] = prefer
    return _req(method, f"{SUPABASE_URL}/rest/v1/{path}", headers=h, data=data)


def read_vault_secret(name):
    st, body = supa("POST", "rpc/read_vault_secret", data={"secret_name": name})
    if st != 200:
        die(f"vault read {name}: {st} {body}")
    return body  # RPC returns the bare string


def refresh_access_token():
    cid = read_vault_secret("YOUTUBE_OAUTH_CLIENT_ID")
    csec = read_vault_secret("YOUTUBE_OAUTH_CLIENT_SECRET")
    rtok = read_vault_secret("YOUTUBE_OAUTH_REFRESH_TOKEN")
    j = _form_post(OAUTH_TOKEN_URL, {
        "client_id": cid, "client_secret": csec,
        "refresh_token": rtok, "grant_type": "refresh_token",
    })
    if "access_token" not in j:
        die(f"token refresh failed: {j}")
    return j["access_token"]


def yt_get(token, path):
    return _req("GET", f"{YT}/{path}", headers={"Authorization": f"Bearer {token}"})


def yt_post(token, path, data):
    return _req("POST", f"{YT}/{path}",
                headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
                data=data)


# ── domain resolves ─────────────────────────────────────────────────────────
def get_occurrence(occ_id):
    st, rows = supa("GET", "calendar_occurrences?id=eq." + urllib.parse.quote(occ_id) +
                    "&select=id,category,starts_at,ends_at,session_title,session_description,name,description,notes,youtube_broadcast_id,active,cancelled_at")
    if st != 200 or not rows:
        die(f"occurrence {occ_id} not found ({st})")
    return rows[0]


def get_upcoming(date_filter=None):
    now = datetime.now(timezone.utc)
    hi = now.timestamp() + 24 * 3600
    q = ("calendar_occurrences?select=id,category,starts_at,ends_at,session_title,"
         "session_description,name,description,notes,youtube_broadcast_id"
         "&type=eq.live_session&active=eq.true&cancelled_at=is.null"
         "&order=starts_at.asc&limit=100")
    st, rows = supa("GET", q)
    if st != 200:
        log("WARN: upcoming query failed", st, rows)
        return []
    out = []
    for r in rows or []:
        try:
            sa = datetime.fromisoformat(r["starts_at"].replace("Z", "+00:00"))
        except Exception:
            continue
        if date_filter and sa.astimezone().strftime("%Y-%m-%d") != date_filter:
            continue
        if sa.timestamp() <= hi:
            out.append(r)
    return out


def get_category(category):
    st, rows = supa("GET", "session_categories?category=eq." + urllib.parse.quote(category) +
                    "&select=category,youtube_stream_id,youtube_playlist_id,default_privacy,display_name,active")
    if st != 200 or not rows:
        die(f"category '{category}' not in session_categories ({st})")
    return rows[0]


def resolve_rtmp(token, stream_id):
    st, body = yt_get(token, "liveStreams?part=cdn,status&id=" + urllib.parse.quote(stream_id))
    if st != 200 or not body.get("items"):
        die(f"liveStreams.list for {stream_id}: {st} {body}")
    cdn = body["items"][0]["cdn"]["ingestionInfo"]
    addr = cdn["ingestionAddress"].rstrip("/")
    key = cdn["streamName"]
    return f"{addr}/{key}", key


def stream_status(token, stream_id):
    st, body = yt_get(token, "liveStreams?part=status&id=" + urllib.parse.quote(stream_id))
    if st != 200 or not body.get("items"):
        return None
    return body["items"][0]["status"].get("streamStatus")


def resolve_media(occ):
    name = (occ.get("notes") or "").strip()
    if not name:
        return None, "notes is empty (no master filename)"
    if not MEDIA_DIR:
        return None, "VYVE_MEDIA_DIR is not set"
    path = os.path.join(MEDIA_DIR, name)
    if not os.path.isfile(path):
        return None, f"file not found: {path}"
    return path, None


def thumb_for(occ):
    """<basename>.jpg in THUMB_DIR for this occurrence's master filename."""
    name = (occ.get("notes") or "").strip()
    if not name or not THUMB_DIR:
        return None
    p = os.path.join(THUMB_DIR, os.path.splitext(name)[0] + ".jpg")
    return p if os.path.isfile(p) else None


def set_thumbnail(token, video_id, jpg_path):
    """Upload a custom thumbnail via thumbnails.set (uploadType=media, raw jpeg)."""
    with open(jpg_path, "rb") as f:
        data = f.read()
    url = f"https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId={urllib.parse.quote(video_id)}&uploadType=media"
    r = urllib.request.Request(url, data=data, method="POST",
                               headers={"Authorization": f"Bearer {token}", "Content-Type": "image/jpeg"})
    try:
        with urllib.request.urlopen(r) as resp:
            return resp.status, None
    except urllib.error.HTTPError as e:
        body = e.read().decode()[:300]
        # 403 here almost always = custom thumbnails not enabled for the channel
        hint = "  (channel may need custom-thumbnails enabled in YouTube Studio)" if e.code == 403 else ""
        return e.code, body + hint


def ensure_broadcast(token, occ, cat, dry_run):
    """Return broadcast_id. Uses the session-publish-minted one if present;
    otherwise mints+binds+playlist-inserts (autostart OFF) and CAS-writes it
    back so it can never double-mint against the Edge Function."""
    if occ.get("youtube_broadcast_id"):
        return occ["youtube_broadcast_id"], "existing"

    if dry_run:
        return "(would-mint)", "dry-run"

    title = (occ.get("session_title") or occ.get("name") or
             f"VYVE \u2014 {cat.get('display_name') or occ['category']}")
    desc = occ.get("session_description") or occ.get("description") or ""
    st, ins = yt_post(token, "liveBroadcasts?part=snippet,status,contentDetails", {
        "snippet": {
            "title": title[:100], "description": desc[:5000],
            "scheduledStartTime": occ["starts_at"], "scheduledEndTime": occ["ends_at"],
        },
        "status": {"privacyStatus": cat.get("default_privacy") or "unlisted",
                   "selfDeclaredMadeForKids": False},
        "contentDetails": {
            "enableAutoStart": False, "enableAutoStop": False, "enableDvr": True,
            "recordFromStart": True, "enableContentEncryption": False,
            "monitorStream": {"enableMonitorStream": False},
        },
    })
    if st not in (200, 201) or not ins.get("id"):
        die(f"liveBroadcasts.insert: {st} {ins}")
    bid = ins["id"]

    st, _ = yt_post(token, f"liveBroadcasts/bind?id={urllib.parse.quote(bid)}"
                           f"&part=id,contentDetails&streamId={urllib.parse.quote(cat['youtube_stream_id'])}", {})
    if st != 200:
        die(f"liveBroadcasts.bind: {st}")

    if cat.get("youtube_playlist_id"):
        yt_post(token, "playlistItems?part=snippet", {
            "snippet": {"playlistId": cat["youtube_playlist_id"],
                        "resourceId": {"kind": "youtube#video", "videoId": bid}}})

    # CAS write-back: only set if still null (the EF might have raced us).
    st, rows = supa("PATCH",
                    "calendar_occurrences?id=eq." + urllib.parse.quote(occ["id"]) +
                    "&youtube_broadcast_id=is.null",
                    data={"youtube_broadcast_id": bid}, prefer="return=representation")
    if st in (200, 201) and rows:
        return bid, "minted"
    # Someone else won the race — re-read and use theirs.
    fresh = get_occurrence(occ["id"])
    if fresh.get("youtube_broadcast_id"):
        log(f"  CAS lost; using existing broadcast {fresh['youtube_broadcast_id']}")
        return fresh["youtube_broadcast_id"], "raced"
    return bid, "minted"


def transition(token, bid, status):
    st, body = yt_post(token, f"liveBroadcasts/transition?broadcastStatus={status}"
                              f"&id={urllib.parse.quote(bid)}&part=status", {})
    if st != 200:
        log(f"  WARN transition->{status}: {st} {body}")
        return False
    return True


def ffmpeg_cmd(media_path, rtmp_url):
    return [
        "ffmpeg", "-hide_banner", "-loglevel", "warning",
        "-re", "-i", media_path,
        "-c:v", "libx264", "-preset", "veryfast", "-pix_fmt", "yuv420p",
        "-b:v", "4500k", "-maxrate", "4500k", "-bufsize", "9000k", "-g", "60",
        "-c:a", "aac", "-b:a", "128k", "-ar", "44100",
        "-f", "flv", rtmp_url,
    ]


def redact(rtmp_url, key):
    return rtmp_url.replace(key, key[:6] + "\u2026" + f"[{len(key)} chars]") if key else rtmp_url


# ── worker ──────────────────────────────────────────────────────────────────
def run_occurrence(occ, token, dry_run=False, wait_for_start=False):
    oid = occ["id"]
    label = occ.get("session_title") or occ.get("name") or occ["category"]
    log(f"=== occurrence {oid}  '{label}'  ({occ['category']})  starts {occ['starts_at']} ===")

    cat = get_category(occ["category"])
    media_path, err = resolve_media(occ)
    if err:
        log(f"  SKIP: {err}")
        return False
    rtmp_url, key = resolve_rtmp(token, cat["youtube_stream_id"])
    bid, how = ensure_broadcast(token, occ, cat, dry_run)
    thumb = thumb_for(occ)
    cmd = ffmpeg_cmd(media_path, rtmp_url)

    if dry_run:
        log("  DRY-RUN plan:")
        log(f"    media     : {media_path}")
        log(f"    category  : {cat['category']}  stream={cat['youtube_stream_id']}  playlist={cat.get('youtube_playlist_id')}")
        log(f"    rtmp      : {redact(rtmp_url, key)}")
        log(f"    broadcast : {bid}  ({how})")
        log(f"    thumbnail : {thumb or '(none found \u2014 would use YouTube auto-frame)'}")
        log(f"    would: set thumbnail -> start ffmpeg -> poll stream active -> transition {bid} ready->live")
        log(f"           -> wait ffmpeg end -> transition {bid} live->complete")
        log(f"    ffmpeg    : {' '.join(cmd[:-1])} {redact(rtmp_url, key)}")
        return True

    # custom thumbnail (best-effort; never blocks the air)
    if thumb:
        st, terr = set_thumbnail(token, bid, thumb)
        log(f"  thumbnail {bid} <- {os.path.basename(thumb)}: {'OK' if terr is None else f'{st} {terr}'}")
    else:
        log(f"  no thumbnail for '{occ.get('notes')}' \u2014 YouTube auto-frame will be used")

    if wait_for_start:
        start = datetime.fromisoformat(occ["starts_at"].replace("Z", "+00:00"))
        delay = (start - datetime.now(timezone.utc)).total_seconds()
        if delay > 0:
            log(f"  sleeping {int(delay)}s until air time")
            time.sleep(delay)

    log(f"  starting ffmpeg push -> {redact(rtmp_url, key)}")
    proc = subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)

    # poll the bound stream until YouTube sees active ingest, then go live
    deadline = time.time() + STREAM_ACTIVE_TIMEOUT
    went_live = False
    while time.time() < deadline:
        if proc.poll() is not None:
            log("  ffmpeg exited before stream went active")
            break
        if stream_status(token, cat["youtube_stream_id"]) == "active":
            if transition(token, bid, "live"):
                log(f"  broadcast {bid} -> LIVE")
                went_live = True
            break
        time.sleep(STREAM_POLL_INTERVAL)
    if not went_live:
        log("  WARN: never confirmed live; letting push run, will still complete on exit")

    proc.wait()
    err_tail = (proc.stderr.read().decode()[-400:] if proc.stderr else "")
    log(f"  ffmpeg finished rc={proc.returncode} {err_tail.strip()[:200]}")
    transition(token, bid, "complete")
    log(f"  broadcast {bid} -> COMPLETE. done.")
    return True


# ── daemon ──────────────────────────────────────────────────────────────────
def daemon(date_filter=None):
    handled = set()
    lock = threading.Lock()
    log(f"daemon up. refresh={REFRESH_INTERVAL}s horizon={SPAWN_HORIZON}s media_dir={MEDIA_DIR!r}")
    while True:
        try:
            token = refresh_access_token()
            for occ in get_upcoming(date_filter):
                with lock:
                    if occ["id"] in handled:
                        continue
                start = datetime.fromisoformat(occ["starts_at"].replace("Z", "+00:00"))
                if (start - datetime.now(timezone.utc)).total_seconds() <= SPAWN_HORIZON:
                    with lock:
                        handled.add(occ["id"])
                    t = threading.Thread(target=_safe_worker, args=(occ,), daemon=True)
                    t.start()
        except SystemExit:
            raise
        except Exception as e:
            log("daemon loop error:", repr(e))
        time.sleep(REFRESH_INTERVAL)


def _safe_worker(occ):
    try:
        token = refresh_access_token()  # fresh token per worker (long sleeps)
        run_occurrence(occ, token, dry_run=False, wait_for_start=True)
    except Exception as e:
        log(f"worker {occ.get('id')} error:", repr(e))


def main():
    ap = argparse.ArgumentParser(description="VYVE simulated-live auto-runner")
    ap.add_argument("--once", metavar="OCC_ID", help="run one occurrence now, ignoring start time")
    ap.add_argument("--dry-run", action="store_true", help="resolve + print plan, change nothing")
    ap.add_argument("--date", metavar="YYYY-MM-DD", help="daemon: only this day's occurrences")
    args = ap.parse_args()

    if not SERVICE_KEY:
        die("VYVE_SUPABASE_SERVICE_KEY not set")
    if not args.dry_run and not MEDIA_DIR:
        die("VYVE_MEDIA_DIR not set")

    if args.once:
        occ = get_occurrence(args.once)
        token = refresh_access_token()
        ok = run_occurrence(occ, token, dry_run=args.dry_run, wait_for_start=False)
        sys.exit(0 if ok else 1)

    daemon(args.date)


if __name__ == "__main__":
    main()
