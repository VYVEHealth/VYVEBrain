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
# host/type cards matching the in-app calendar image_url (e.g. hosts/alex.jpg);
# VYVE_HOSTCARD_DIR if set, else a "hosts" subdir of THUMB_DIR.
HOSTCARD_DIR = os.path.expanduser(os.environ.get("VYVE_HOSTCARD_DIR", "") or os.path.join(THUMB_DIR, "hosts"))
REFRESH_INTERVAL = int(os.environ.get("VYVE_REFRESH_INTERVAL", "60"))
SPAWN_HORIZON = int(os.environ.get("VYVE_SPAWN_HORIZON", "900"))

STREAM_ACTIVE_TIMEOUT = 120  # seconds to wait for the bound stream to report active after ffmpeg starts
STREAM_POLL_INTERVAL = 3

# PM-1201 — padding + hang protection.
# The first seconds of every airing were lost because ffmpeg pushed the master from t=0 while the
# runner was still waiting for the stream to go active and transitioning ready->live; the end was
# cut because the broadcast completed the instant ffmpeg exited while HLS viewers sat behind the
# live edge. Fix: the push is [holding card][master][end card] via the concat demuxer, ffmpeg starts
# EARLY_START_SEC before the slot so ready->live lands on the hour, and completion waits
# COMPLETE_HOLD_SEC after the push ends. Cards are rendered per airing at the master's own
# resolution/fps/audio so the concat is byte-compatible (falls back to a bare push on any failure).
PREROLL_SEC = int(os.environ.get("VYVE_PREROLL_SEC", "15"))
POSTROLL_SEC = int(os.environ.get("VYVE_POSTROLL_SEC", "10"))
COMPLETE_HOLD_SEC = int(os.environ.get("VYVE_COMPLETE_HOLD_SEC", "20"))
EARLY_START_SEC = int(os.environ.get("VYVE_EARLY_START_SEC", "10"))
RTMP_RW_TIMEOUT_US = int(os.environ.get("VYVE_RTMP_RW_TIMEOUT_US", str(30 * 1_000_000)))  # ffmpeg exits if YouTube stops reading
PUSH_GRACE_SEC = 180  # hard ceiling = media duration + padding + this; beyond it the push is killed
AIR_TMP = "/tmp/vyve-air"

# PM-XXX — stream-copy at airtime (§23.318). A master that vyve-video-normalise.py has already put into the
# push spec (norm/<notes> for session masters, partner/<id>.mp4 for uploads — each with a JSON sidecar) is
# pushed with `-c copy`: no encode at airtime, so the 2-vCPU box can carry several airings at once. The
# padding cards for the copy path are rendered ONCE with the sidecar's exact encode settings and cached
# under VYVE_MEDIA_DIR/cards/, and the concat is probe-gated before the push — any mismatch falls back
# to the per-airing re-encode path exactly as PM-1201 shipped it. VYVE_STREAM_COPY=0 disables the copy path.
STREAM_COPY = os.environ.get("VYVE_STREAM_COPY", "1") != "0"
NORM_SUBDIR = "norm"
CARD_CACHE_DIR = os.path.join(MEDIA_DIR, "cards") if MEDIA_DIR else ""
NORM_SPEC_VERSION = 2


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
                    "&select=id,category,starts_at,ends_at,session_title,session_description,name,description,notes,image_url,youtube_broadcast_id,youtube_stream_id,active,cancelled_at")
    if st != 200 or not rows:
        die(f"occurrence {occ_id} not found ({st})")
    return rows[0]


def get_upcoming(date_filter=None):
    now = datetime.now(timezone.utc)
    hi = now.timestamp() + 24 * 3600
    lo_iso = datetime.fromtimestamp(now.timestamp() - 300, timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    q = ("calendar_occurrences?select=id,category,starts_at,ends_at,session_title,"
         "session_description,name,description,notes,image_url,youtube_broadcast_id,youtube_stream_id"
         "&type=eq.live_session&active=eq.true&cancelled_at=is.null"
         "&starts_at=gte." + lo_iso +
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


def stream_for(occ, cat):
    """PM-1203: the ingest stream is allocated per occurrence at scheduling time (calendar_occurrences.
    youtube_stream_id, DB exclusion guard) — the category's own key is only the fallback for rows that
    pre-date the allocator."""
    return occ.get("youtube_stream_id") or cat["youtube_stream_id"]


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


def _read_sidecar(path):
    try:
        with open(path + ".json") as f:
            return json.load(f)
    except Exception:
        return None


def normalised_copy(name, original):
    """(path, sidecar) for a runner-spec copy of this master, or (None, None).

    Session master: norm/<name> whose sidecar still matches the original's size+mtime (a re-uploaded
    master silently invalidates its old copy). Partner upload: notes already points at partner/<id>.mp4,
    which the normaliser wrote — its sidecar is the proof. Anything without a current sidecar is not
    trusted for -c copy."""
    if not STREAM_COPY:
        return None, None
    if name.startswith("partner/") or name.startswith(NORM_SUBDIR + "/"):
        sc = _read_sidecar(original)
        return (original, sc) if sc and (sc.get("spec") or {}).get("v") == NORM_SPEC_VERSION else (None, None)
    cand = os.path.join(MEDIA_DIR, NORM_SUBDIR, name)
    sc = _read_sidecar(cand)
    if not sc or not os.path.isfile(cand):
        return None, None
    try:
        st = os.stat(original)
    except Exception:
        return None, None
    if sc.get("src_bytes") != st.st_size or int(sc.get("src_mtime") or 0) != int(st.st_mtime):
        return None, None
    if (sc.get("spec") or {}).get("v") != NORM_SPEC_VERSION or os.path.getsize(cand) != sc.get("bytes"):
        return None, None
    return cand, sc


def resolve_media(occ):
    """(path, err, sidecar). sidecar is set when `path` is a normalised copy eligible for stream-copy."""
    name = (occ.get("notes") or "").strip()
    if not name:
        return None, "notes is empty (no master filename)", None
    if not MEDIA_DIR:
        return None, "VYVE_MEDIA_DIR is not set", None
    path = os.path.join(MEDIA_DIR, name)
    if not os.path.isfile(path):
        return None, f"file not found: {path}", None
    npath, sc = normalised_copy(name, path)
    if npath:
        return npath, None, sc
    return path, None, None


def thumb_for(occ):
    """Thumbnail for this occurrence's broadcast.

    Prefer the branded host/type card the in-app calendar shows
    (calendar_occurrences.image_url basename, e.g. 'alex.jpg') resolved in
    HOSTCARD_DIR — keeps the YouTube thumbnail in lockstep with the in-app
    card and auto-follows any image_url remap (type<->per-host, one UPDATE).
    Fall back to the per-master frame card '<basename>.jpg' in THUMB_DIR.
    """
    iu = (occ.get("image_url") or "").strip()
    if iu and HOSTCARD_DIR:
        card = os.path.basename(urllib.parse.urlparse(iu).path)
        if card:
            p = os.path.join(HOSTCARD_DIR, card)
            if os.path.isfile(p):
                return p
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
             f"VYVE — {cat.get('display_name') or occ['category']}")
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
                           f"&part=id,contentDetails&streamId={urllib.parse.quote(stream_for(occ, cat))}", {})
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


def ffmpeg_cmd(media_path, rtmp_url, concat_list=None, copy=False):
    """The push. With a concat list (PM-1201) the input is [card][master][card]; otherwise the bare
    master as before. copy=True (PM-XXX) passes the normalised bytes straight through (`-c copy`) —
    near-zero CPU — and is only chosen after build_air_playlist() has probe-gated the concat.
    -rw_timeout makes ffmpeg give up when YouTube stops reading instead of sitting in CLOSE-WAIT
    forever (the 10 Sep zombies)."""
    inp = ["-f", "concat", "-safe", "0", "-re", "-i", concat_list] if concat_list else ["-re", "-i", media_path]
    if copy:
        codec = ["-c:v", "copy", "-c:a", "copy"]
    else:
        codec = ["-c:v", "libx264", "-preset", "veryfast", "-pix_fmt", "yuv420p",
                 "-b:v", "4500k", "-maxrate", "4500k", "-bufsize", "9000k", "-g", "60",
                 "-c:a", "aac", "-b:a", "128k", "-ar", "44100"]
    return [
        "ffmpeg", "-hide_banner", "-loglevel", "warning",
        *inp, *codec,
        "-rw_timeout", str(RTMP_RW_TIMEOUT_US),
        "-f", "flv", rtmp_url,
    ]


def probe_media(path):
    """width, height, fps, audio sample rate, channels, duration — what the padding cards must match."""
    try:
        out = subprocess.run(["ffprobe", "-v", "error", "-print_format", "json", "-show_streams", "-show_format", path],
                             capture_output=True, text=True, timeout=60)
        j = json.loads(out.stdout or "{}")
        v = next((x for x in j.get("streams", []) if x.get("codec_type") == "video"), None)
        a = next((x for x in j.get("streams", []) if x.get("codec_type") == "audio"), None)
        if not v:
            return None
        num, _, den = (v.get("avg_frame_rate") or v.get("r_frame_rate") or "30/1").partition("/")
        fps = round(float(num) / float(den or 1), 3) if float(den or 1) else 30.0
        if not (1 <= fps <= 120):
            fps = 30.0
        return {"w": int(v["width"]), "h": int(v["height"]), "fps": fps,
                # the video track timescale — every concat entry MUST share it (§23.326: the concat demuxer
                # applies the file offset in the wrong timebase when they differ: a 15s card at 1/12288 in
                # front of a 1/90000 master put the master's first frame at 109.86s and stalled -re for 95s)
                "vtb": int((v.get("time_base") or "1/90000").partition("/")[2] or 90000),
                "ar": int(a.get("sample_rate") or 44100) if a else None,
                "ch": int(a.get("channels") or 2) if a else 0,
                "dur": float((j.get("format") or {}).get("duration") or 0)}
    except Exception as e:
        log("  probe failed:", repr(e))
        return None


def render_card_clip(card_jpg, seconds, m, out_path, spec=None):
    """A still card (or a VYVE-dark frame when there is no card) as an h264/aac clip that concats
    cleanly with the master: same size, fps, sample rate and channel count.

    With `spec` (the normaliser sidecar, PM-XXX) the clip is encoded with the master's OWN x264/aac
    settings so its SPS/PPS/VUI match and the concat can be pushed with -c copy; the result is cached
    under cards/ keyed on everything that shapes it, so each card is rendered once ever."""
    fps = spec["fps"] if spec else m["fps"]
    if spec:
        key_src = {"spec": spec, "w": m["w"], "h": m["h"], "sec": seconds, "vtb": m.get("vtb"), "render_v": 3}  # bump render_v when the card recipe changes
        if card_jpg:
            st = os.stat(card_jpg)
            key_src["card"] = [os.path.abspath(card_jpg), st.st_size, int(st.st_mtime)]
            if os.path.dirname(os.path.abspath(card_jpg)).startswith(AIR_TMP):
                # a per-occurrence rendered title card: key on its pixels, not its temp path
                import hashlib
                with open(card_jpg, "rb") as f:
                    key_src["card"] = hashlib.sha1(f.read()).hexdigest()
        import hashlib
        key = hashlib.sha1(json.dumps(key_src, sort_keys=True).encode()).hexdigest()[:20]
        os.makedirs(CARD_CACHE_DIR, exist_ok=True)
        out_path = os.path.join(CARD_CACHE_DIR, f"{key}.mp4")
        if os.path.isfile(out_path) and os.path.getsize(out_path) > 0:
            return out_path
    if card_jpg:
        vin = ["-loop", "1", "-framerate", str(fps), "-t", str(seconds), "-i", card_jpg]
        vf = (f"scale={m['w']}:{m['h']}:force_original_aspect_ratio=decrease:out_range=tv,"
              f"pad={m['w']}:{m['h']}:(ow-iw)/2:(oh-ih)/2:color=0x0D2B2B,fps={fps},format=yuv420p")
    else:
        vin = ["-f", "lavfi", "-t", str(seconds), "-i", f"color=c=0x0D2B2B:s={m['w']}x{m['h']}:r={fps}"]
        vf = "format=yuv420p"
    if spec:
        # pin the colour tags in the frames — the encoder-level options lose to a jpeg's own tags (PM-XXX gate finding)
        vf += (f",setparams=range={spec['color_range']}:color_primaries={spec['color']}"
               f":color_trc={spec['color']}:colorspace={spec['color']}")
    cmd = ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", *vin]
    ch = spec["ch"] if spec else m["ch"]
    ar = spec["ar"] if spec else m["ar"]
    if ch:
        layout = "mono" if ch == 1 else "stereo"
        cmd += ["-f", "lavfi", "-t", str(seconds), "-i", f"anullsrc=r={ar}:cl={layout}"]
    if spec:
        cmd += ["-vf", vf, "-c:v", "libx264", "-preset", spec["preset"], "-profile:v", "high", "-threads", "1",
                "-crf", str(spec["crf"]), "-maxrate", spec["maxrate"], "-bufsize", spec["bufsize"],
                "-g", str(spec["gop"]), "-keyint_min", str(spec["gop"]), "-sc_threshold", "0", "-fps_mode", "cfr",
                "-pix_fmt", "yuv420p",
                "-color_range", spec["color_range"], "-colorspace", spec["color"],
                "-color_primaries", spec["color"], "-color_trc", spec["color"]]
        if ch:
            cmd += ["-c:a", "aac", "-b:a", spec["a_bitrate"], "-ar", str(ar), "-ac", str(ch), "-shortest"]
        else:
            cmd += ["-an"]
        cmd += ["-movflags", "+faststart", "-video_track_timescale", str(m["vtb"]), "-f", "mp4", out_path + ".part"]
        cmd = ["nice", "-n", "10"] + cmd
    else:
        cmd += ["-vf", vf, "-c:v", "libx264", "-preset", "veryfast", "-pix_fmt", "yuv420p", "-g", "60", "-r", str(fps)]
        if ch:
            cmd += ["-c:a", "aac", "-b:a", "128k", "-ar", str(ar), "-ac", str(ch), "-shortest"]
        else:
            cmd += ["-an"]
        cmd += ["-movflags", "+faststart", "-video_track_timescale", str(m["vtb"]), out_path]
    r = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
    if r.returncode != 0:
        raise RuntimeError(r.stderr.strip()[-300:])
    if spec:
        os.replace(out_path + ".part", out_path)
    return out_path


# ffprobe fields that must agree across every concat entry for -c copy to be safe (SPS/PPS/VUI and audio config)
_CONCAT_FIELDS = ["codec_name", "profile", "level", "width", "height", "pix_fmt", "r_frame_rate", "time_base",
                  "color_range", "color_space", "color_transfer", "color_primaries", "has_b_frames", "refs", "field_order"]
_CONCAT_AFIELDS = ["codec_name", "profile", "sample_rate", "channels", "channel_layout", "time_base"]


def _stream_signature(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-print_format", "json", "-show_streams", path],
                         capture_output=True, text=True, timeout=60)
    j = json.loads(out.stdout or "{}")
    v = next((x for x in j.get("streams", []) if x.get("codec_type") == "video"), {}) or {}
    a = next((x for x in j.get("streams", []) if x.get("codec_type") == "audio"), {}) or {}
    return {"v": {k: v.get(k) for k in _CONCAT_FIELDS}, "a": {k: a.get(k) for k in _CONCAT_AFIELDS}}


def verify_concat_copy(list_path, entries):
    """Gate for the copy path: every entry must carry an identical video/audio signature, and a full
    stream-copy demux of the playlist must complete without ffmpeg complaining. Returns (ok, reason)."""
    sigs = [_stream_signature(p) for p in entries]
    for i, sg in enumerate(sigs[1:], 1):
        for side in ("v", "a"):
            diff = {k: (sigs[0][side].get(k), sg[side].get(k)) for k in sg[side] if sigs[0][side].get(k) != sg[side].get(k)}
            if diff:
                return False, f"entry {i} {side} differs from entry 0: {diff}"
    # the real muxer (flv, 1/1000 timebase) so the warning text is in milliseconds; /dev/null is fine for flv
    r = subprocess.run(["nice", "-n", "10", "ffmpeg", "-hide_banner", "-loglevel", "warning", "-nostdin", "-y",
                        "-f", "concat", "-safe", "0", "-i", list_path, "-c", "copy", "-f", "flv", "/dev/null"],
                       capture_output=True, text=True, timeout=600)
    if r.returncode != 0:
        return False, f"copy demux rc={r.returncode}: {r.stderr.strip()[-200:]}"
    import re
    bad, tiny = [], 0
    for line in r.stderr.splitlines():
        line = line.strip()
        if not line or "update header" in line or "Failed to update" in line:
            continue   # flv cannot seek in /dev/null to write the duration — irrelevant for a live push
        mm = re.search(r"[Nn]on-monotonic\w* increasing dts to muxer in stream \d+: (\d+) >= (\d+)", line)
        if mm:
            # aac priming leaves each card/master join a few ms overlapped; ffmpeg nudges the dts and carries on.
            # Anything wider than 100ms at a join is a real fault and fails the gate.
            if abs(int(mm.group(1)) - int(mm.group(2))) <= 100:
                tiny += 1
                continue
        bad.append(line)
    if bad:
        return False, f"copy demux warned: {' | '.join(bad)[-300:]}"
    return True, f"ok ({tiny} sub-100ms dts nudges at joins)" if tiny else "ok"


FALLBACK_FONT = "/opt/vyve/PlayfairDisplay.ttf"


def render_fallback_card(oid, title, m):
    """When an occurrence has no host card: VYVE dark frame, gold wordmark, the session title.
    No new member-facing copy — the title is the session's own. Returns a jpg path or None."""
    try:
        d = os.path.join(AIR_TMP, oid)
        os.makedirs(d, exist_ok=True)
        tf = os.path.join(d, "title.txt")
        with open(tf, "w") as f:
            f.write((title or "VYVE").strip()[:80])
        out = os.path.join(d, "card.jpg")
        size = max(m["w"], 1280)
        fs_brand = int(size * 0.0625); fs_title = int(size * 0.033)
        font = f"fontfile={FALLBACK_FONT}:" if os.path.isfile(FALLBACK_FONT) else ""
        vf = (f"drawtext={font}text=VYVE:fontcolor=0xC9A84C:fontsize={fs_brand}:x=(w-text_w)/2:y=(h-text_h)/2-{int(fs_brand*0.75)},"
              f"drawtext={font}textfile={tf}:fontcolor=white:fontsize={fs_title}:x=(w-text_w)/2:y=(h-text_h)/2+{int(fs_brand*0.55)}")
        r = subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-f", "lavfi", "-t", "1",
                            "-i", f"color=c=0x0D2B2B:s={m['w']}x{m['h']}:r=1", "-vf", vf, "-frames:v", "1", out],
                           capture_output=True, text=True, timeout=60)
        return out if r.returncode == 0 and os.path.isfile(out) else None
    except Exception:
        return None


def verify_join_continuity(list_path, pre_seconds):
    """§23.326 — the master's first video packet must land right after the card (within 2s), never at
    card_seconds x (tb_master/tb_card). Cheap: reads only the first ~pre+3s of the concat. Returns (ok, reason)."""
    try:
        out = subprocess.run(["ffprobe", "-v", "error", "-f", "concat", "-safe", "0", "-i", list_path,
                              "-select_streams", "v:0", "-show_entries", "packet=pts_time,flags",
                              "-of", "csv=p=0", "-read_intervals", f"%+{pre_seconds + 3}"],
                             capture_output=True, text=True, timeout=120).stdout
        pts = [float(l.split(",")[0]) for l in out.splitlines() if l.strip() and l[0].isdigit()]
        if not pts:
            return False, "no packets read"
        if max(pts) < pre_seconds + 0.5:
            return False, f"master video does not start within {pre_seconds + 3}s of the playlist (concat timebase offset, §23.326)"
        return True, "ok"
    except Exception as e:
        return False, f"probe failed: {e}"


def _write_list(lst, entries):
    with open(lst, "w") as f:
        for p in entries:
            f.write("file '" + p.replace("'", "'\\''") + "'\n")
    return lst


def build_air_playlist(oid, media_path, card_jpg, title=None, sidecar=None, original_path=None):
    """Render the two cards and write the concat list. Returns (list_path, media_meta, copy, media_path) —
    copy=True means the playlist has passed the stream-copy gate (PM-XXX); media_path is the file the
    list was actually built on. (None, meta, False, path) when padding is not possible — the caller then
    pushes the bare master exactly as before. When the copy gate fails the ORIGINAL master and the
    PM-1201 re-encode path are used, never a half-trusted copy."""
    m = probe_media(media_path)
    if not m:
        return None, None, False, media_path
    d = os.path.join(AIR_TMP, oid)
    os.makedirs(d, exist_ok=True)
    if not card_jpg:
        card_jpg = render_fallback_card(oid, title, m)   # None again -> plain dark frame
    if sidecar:
        spec = sidecar["spec"]
        try:
            pre = render_card_clip(card_jpg, PREROLL_SEC, m, None, spec=spec)
            post = render_card_clip(card_jpg, POSTROLL_SEC, m, None, spec=spec)
            lst = _write_list(os.path.join(d, "list.txt"), (pre, media_path, post))
            ok, why = verify_join_continuity(lst, PREROLL_SEC)
            if ok:
                ok, why = verify_concat_copy(lst, [pre, media_path, post])
        except Exception as e:
            ok, why = False, f"card render failed: {e}"
        if ok:
            log(f"  stream-copy gate passed: {why}")
            return lst, m, True, media_path
        log(f"  WARN: stream-copy gate failed ({why}) — falling back to re-encode of the original")
        try:
            supa("POST", "platform_alerts", data={"severity": "info", "type": "runner_copy_gate_failed", "source": "vyve-live-runner",
                                                  "page": "live", "details": f"{oid}: {why[:400]}"})
        except Exception:
            pass
        media_path = original_path or media_path
        m = probe_media(media_path) or m
    try:
        pre = render_card_clip(card_jpg, PREROLL_SEC, m, os.path.join(d, "pre.mp4"))
        post = render_card_clip(card_jpg, POSTROLL_SEC, m, os.path.join(d, "post.mp4"))
    except Exception as e:
        log(f"  WARN: padding cards failed ({e}) — airing the bare master")
        return None, m, False, media_path
    lst = _write_list(os.path.join(d, "list.txt"), (pre, media_path, post))
    ok, why = verify_join_continuity(lst, PREROLL_SEC)
    if not ok:
        # 12 Sep 06:00/07:30/11:00: three padded airings died at ~110s because the join jumped 95s. Never again.
        log(f"  WARN: padded playlist failed the join check ({why}) — airing the bare master")
        try:
            supa("POST", "platform_alerts", data={"severity": "high", "type": "runner_join_check_failed", "source": "vyve-live-runner",
                                                  "page": "live", "details": f"{oid}: {why[:400]}"})
        except Exception:
            pass
        return None, m, False, media_path
    return lst, m, False, media_path


def cleanup_air(oid):
    d = os.path.join(AIR_TMP, oid)
    for n in ("pre.mp4", "post.mp4", "list.txt", "card.jpg", "title.txt"):
        try: os.remove(os.path.join(d, n))
        except Exception: pass
    try: os.rmdir(d)
    except Exception: pass


def redact(rtmp_url, key):
    return rtmp_url.replace(key, key[:6] + "…" + f"[{len(key)} chars]") if key else rtmp_url


# ── worker ──────────────────────────────────────────────────────────────────
def run_occurrence(occ, token, dry_run=False, wait_for_start=False):
    oid = occ["id"]
    label = occ.get("session_title") or occ.get("name") or occ["category"]
    log(f"=== occurrence {oid}  '{label}'  ({occ['category']})  starts {occ['starts_at']} ===")

    cat = get_category(occ["category"])
    media_path, err, sidecar = resolve_media(occ)
    if err:
        log(f"  SKIP: {err}")
        return False
    original_path = os.path.join(MEDIA_DIR, (occ.get("notes") or "").strip())
    stream_id = stream_for(occ, cat)
    rtmp_url, key = resolve_rtmp(token, stream_id)
    bid, how = ensure_broadcast(token, occ, cat, dry_run)
    thumb = thumb_for(occ)
    # PM-1201: build the padded playlist now, while there is still time before the slot.
    # PM-XXX: for a normalised master this also runs the stream-copy gate (dry-run runs it too — it changes nothing).
    concat_list, meta, copy, media_path = build_air_playlist(oid, media_path, thumb, label, sidecar=sidecar, original_path=original_path)
    cmd = ffmpeg_cmd(media_path, rtmp_url, concat_list, copy=copy)
    padded = PREROLL_SEC + POSTROLL_SEC if concat_list else 0
    expected = (meta["dur"] if meta else 0) + padded
    mode = "copy" if copy else "encode"

    if dry_run:
        log("  DRY-RUN plan:")
        log(f"    media     : {media_path}  [{mode}{' — normalised copy' if sidecar else ''}]")
        log(f"    category  : {cat['category']}  stream={stream_id}{' (allocated)' if occ.get('youtube_stream_id') else ' (category fallback)'}  playlist={cat.get('youtube_playlist_id')}")
        log(f"    rtmp      : {redact(rtmp_url, key)}")
        log(f"    broadcast : {bid}  ({how})")
        log(f"    thumbnail : {thumb or '(none found — would use YouTube auto-frame)'}")
        log(f"    padding   : {PREROLL_SEC}s card + master ({meta['dur']:.0f}s) + {POSTROLL_SEC}s card [{'host card' if thumb else 'rendered title card'}]; start {EARLY_START_SEC}s early; hold {COMPLETE_HOLD_SEC}s before complete" if meta else "    padding   : (probe failed — bare master)")
        log(f"    would: set thumbnail -> start ffmpeg -> poll stream active -> transition {bid} ready->live")
        log(f"           -> wait ffmpeg end (ceiling {expected + PUSH_GRACE_SEC:.0f}s) -> hold -> transition {bid} live->complete")
        log(f"    ffmpeg    : {' '.join(cmd[:-1])} {redact(rtmp_url, key)}")
        cleanup_air(oid)
        return True

    # custom thumbnail (best-effort; never blocks the air)
    if thumb:
        st, terr = set_thumbnail(token, bid, thumb)
        log(f"  thumbnail {bid} <- {os.path.basename(thumb)}: {'OK' if terr is None else f'{st} {terr}'}")
    else:
        log(f"  no thumbnail for '{occ.get('notes')}' — YouTube auto-frame will be used")

    if wait_for_start:
        start = datetime.fromisoformat(occ["starts_at"].replace("Z", "+00:00"))
        delay = (start - datetime.now(timezone.utc)).total_seconds() - (EARLY_START_SEC if concat_list else 0)
        if delay > 0:
            log(f"  sleeping {int(delay)}s until air time" + (f" (starting {EARLY_START_SEC}s early on the holding card)" if concat_list else ""))
            time.sleep(delay)

    log(f"  starting ffmpeg push -> {redact(rtmp_url, key)}" + ("  [padded]" if concat_list else "  [bare]") + f"  [{mode}]")
    proc = subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
    # PM-1201: drain stderr continuously. With a full 64KB pipe ffmpeg blocks on its next warning and
    # never exits — that is exactly how three Pilates pushes sat in CLOSE-WAIT for 30h on 10 Sep.
    err_buf = []
    def _drain(pipe):
        try:
            for line in iter(pipe.readline, b""):
                err_buf.append(line)
                if len(err_buf) > 60:
                    del err_buf[:-60]
        except Exception:
            pass
    threading.Thread(target=_drain, args=(proc.stderr,), daemon=True).start()

    # poll the bound stream until YouTube sees active ingest, then go live
    deadline = time.time() + STREAM_ACTIVE_TIMEOUT
    went_live = False
    while time.time() < deadline:
        if proc.poll() is not None:
            log("  ffmpeg exited before stream went active")
            break
        if stream_status(token, stream_id) == "active":
            if transition(token, bid, "live"):
                log(f"  broadcast {bid} -> LIVE")
                went_live = True
            break
        time.sleep(STREAM_POLL_INTERVAL)
    if not went_live:
        log("  WARN: never confirmed live; letting push run, will still complete on exit")

    ceiling = expected + PUSH_GRACE_SEC if expected else 6 * 3600
    killed = False
    try:
        proc.wait(timeout=ceiling)
    except subprocess.TimeoutExpired:
        killed = True
        log(f"  ERROR: push exceeded its ceiling ({ceiling:.0f}s) — killing ffmpeg")
        try: proc.kill()
        except Exception: pass
        proc.wait()
        try:
            supa("POST", "platform_alerts", data={"severity": "high", "type": "runner_push_hung", "source": "vyve-live-runner",
                                                  "page": "live", "details": f"'{label}' ({oid}) push ran past {ceiling:.0f}s and was killed; broadcast {bid} completed by force."})
        except Exception:
            pass
    err_tail = b"".join(err_buf[-6:]).decode(errors="replace")[-400:]
    log(f"  ffmpeg finished rc={proc.returncode} {err_tail.strip()[:200]}")
    cleanup_air(oid)
    if not killed and COMPLETE_HOLD_SEC > 0:
        log(f"  holding {COMPLETE_HOLD_SEC}s for viewers behind the live edge")
        time.sleep(COMPLETE_HOLD_SEC)
    # a worker's token is minted at spawn; a long session outlives it (the 10 Sep zombies got 401 here)
    try:
        token = refresh_access_token()
    except Exception as e:
        log("  WARN: token refresh before complete failed:", repr(e))
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
            ups = get_upcoming(date_filter)
            try:
                supa("POST", "runner_heartbeat",
                     data={"id": "runner",
                           "beat_at": datetime.now(timezone.utc).isoformat(),
                           "detail": {"upcoming": len(ups)}},
                     prefer="resolution=merge-duplicates")
            except Exception as _hb:
                log("heartbeat write failed:", repr(_hb))
            for occ in ups:
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
