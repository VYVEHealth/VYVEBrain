#!/usr/bin/env python3
"""
vyve-video-normalise.py  —  PM-1200

Normalise once at ingest so that airing is a stream-copy, not a re-encode (§23.318).

Every approved, non-removed partner upload with a file in the private `partner-content` bucket and
no normalised copy yet is pulled down, probed, and re-encoded ONCE into the exact shape the live
runner pushes to YouTube today (h264 high, yuv420p, longest side <= 1080p, 30fps, 2s keyframes,
4500k capped, aac 128k 44.1kHz stereo, faststart). The result lands under VYVE_MEDIA_DIR as
partner/<item_id>.mp4 — already where run_occurrence() looks, so the fetch-to-box step is done here.
The storage original is the archive and is never touched.

Also closes on the way through:
  - width / height / duration_sec are back-filled from the probe for items that pre-date PM-1199
  - HEVC / odd-pixel-format / 48kHz / VFR sources become a plain h264/aac file that plays everywhere
  - April's 14.5 Mbps class of upload comes down to ~4.5 Mbps
  - a removed item (including the urgent safeguarding path) has its box copy DELETED

Guards (the box is 2 vCPU and airs live sessions):
  - never encodes while the runner has an RTMP push running — a re-encode would starve it (§23.318)
  - nice 19, single-threaded x264, one item per run; the timer brings the next one
  - stops when free disk under VYVE_MEDIA_DIR is below VYVE_NORMALISE_MIN_FREE_GB (default 2)
  - three failed attempts and it stops retrying that item and raises a high alert

Env (shares /opt/vyve/vyve-runner.env with the live runner):
  VYVE_SUPABASE_URL, VYVE_SUPABASE_SERVICE_KEY, VYVE_MEDIA_DIR
Usage:
  vyve-video-normalise.py --once          one pass (systemd timer)
  vyve-video-normalise.py --dry-run       print the plan, encode nothing
  vyve-video-normalise.py --item <uuid>   force one item (ignores the attempts cap)
  vyve-video-normalise.py --max N         items per run (default 1)
"""
import argparse, json, os, shutil, subprocess, sys, time, urllib.parse, urllib.request
from datetime import datetime, timezone

SUPABASE_URL = os.environ.get("VYVE_SUPABASE_URL", "https://ixjfklpckgxrwjlfsaaz.supabase.co").rstrip("/")
SERVICE_KEY  = os.environ.get("VYVE_SUPABASE_SERVICE_KEY", "")
MEDIA_DIR    = os.path.expanduser(os.environ.get("VYVE_MEDIA_DIR", "/srv/vyve/masters/media"))
BUCKET       = "partner-content"
SUBDIR       = "partner"
MIN_FREE_GB  = float(os.environ.get("VYVE_NORMALISE_MIN_FREE_GB", "2"))
MAX_ATTEMPTS = 3
CHUNK = 8 * 1024 * 1024

# Matches vyve-live-runner.py ffmpeg_cmd() so the runner can `-c copy` this file straight to RTMP.
TARGET = dict(v_bitrate="4500k", v_maxrate="4500k", v_bufsize="9000k", fps=30, gop=60,
              a_bitrate="128k", a_rate=44100, max_edge=1920)


def log(*a):
    print(datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), *a, flush=True)


def die(msg):
    log("FATAL:", msg); sys.exit(1)


def _req(method, url, headers=None, data=None, timeout=120):
    h = dict(headers or {})
    body = None
    if data is not None:
        body = json.dumps(data).encode(); h.setdefault("Content-Type", "application/json")
    req = urllib.request.Request(url, data=body, headers=h, method=method)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            b = r.read()
            try: return r.status, json.loads(b)
            except Exception: return r.status, b
    except urllib.error.HTTPError as e:
        b = e.read()
        try: return e.code, json.loads(b)
        except Exception: return e.code, b


def supa(method, path, data=None, prefer=None):
    h = {"apikey": SERVICE_KEY, "Authorization": f"Bearer {SERVICE_KEY}"}
    if prefer: h["Prefer"] = prefer
    return _req(method, f"{SUPABASE_URL}/rest/v1/{path}", headers=h, data=data)


def alert(severity, atype, details):
    try:
        supa("POST", "platform_alerts", data={"severity": severity, "type": atype, "source": "vyve-video-normalise",
                                              "page": "partner-content", "details": details})
    except Exception:
        pass


def storage_download(path, dest):
    url = f"{SUPABASE_URL}/storage/v1/object/{BUCKET}/{urllib.parse.quote(path)}"
    req = urllib.request.Request(url, headers={"apikey": SERVICE_KEY, "Authorization": f"Bearer {SERVICE_KEY}"})
    with urllib.request.urlopen(req, timeout=1800) as r, open(dest, "wb") as f:
        n = 0
        while True:
            b = r.read(CHUNK)
            if not b: break
            f.write(b); n += len(b)
    return n


def probe(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-print_format", "json", "-show_streams", "-show_format", path],
                         capture_output=True, text=True, timeout=120)
    if out.returncode != 0:
        return None, out.stderr.strip()[:300]
    j = json.loads(out.stdout or "{}")
    v = next((s for s in j.get("streams", []) if s.get("codec_type") == "video"), None)
    a = next((s for s in j.get("streams", []) if s.get("codec_type") == "audio"), None)
    if not v:
        return None, "no video stream"
    # phones store rotation as metadata; the visible shape is what members see
    rot = 0
    try:
        rot = int(float((v.get("tags") or {}).get("rotate", 0)))
    except Exception: pass
    for sd in v.get("side_data_list") or []:
        if "rotation" in sd:
            try: rot = int(float(sd["rotation"]))
            except Exception: pass
    w, h = int(v.get("width") or 0), int(v.get("height") or 0)
    if rot % 180: w, h = h, w
    dur = float((j.get("format") or {}).get("duration") or v.get("duration") or 0)
    return {"width": w, "height": h, "duration": dur, "vcodec": v.get("codec_name"), "pix_fmt": v.get("pix_fmt"),
            "acodec": a.get("codec_name") if a else None, "a_rate": int(a.get("sample_rate") or 0) if a else 0,
            "bit_rate": int((j.get("format") or {}).get("bit_rate") or 0), "has_audio": a is not None}, None


def encode(src, dst, info):
    edge = TARGET["max_edge"]
    # scale uniformly so the longest side is <= 1080p and both dimensions stay even; portrait keeps its shape
    vf = (f"scale='trunc(min(1,min({edge}/iw,{edge}/ih))*iw/2)*2':'trunc(min(1,min({edge}/iw,{edge}/ih))*ih/2)*2',"
          f"fps={TARGET['fps']},format=yuv420p")
    inputs = ["-i", src]
    if not info["has_audio"]:
        # the runner and YouTube both expect an audio track — synthesise silence as input 1
        inputs += ["-f", "lavfi", "-i", f"anullsrc=r={TARGET['a_rate']}:cl=stereo"]
    cmd = ["nice", "-n", "19", "ffmpeg", "-hide_banner", "-loglevel", "error", "-y"] + inputs + [
           "-map", "0:v:0", "-vf", vf,
           "-c:v", "libx264", "-preset", "medium", "-profile:v", "high", "-threads", "1",
           "-crf", "20", "-maxrate", TARGET["v_maxrate"], "-bufsize", TARGET["v_bufsize"],   # quality-led, capped at the runner rate
           "-g", str(TARGET["gop"]), "-keyint_min", str(TARGET["gop"]), "-sc_threshold", "0",
           "-fps_mode", "cfr",
           "-map", "0:a:0" if info["has_audio"] else "1:a:0",
           "-c:a", "aac", "-b:a", TARGET["a_bitrate"], "-ar", str(TARGET["a_rate"]), "-ac", "2"]
    if not info["has_audio"]:
        cmd += ["-shortest"]
    cmd += ["-movflags", "+faststart", "-f", "mp4", dst]   # .part suffix hides the extension from ffmpeg
    t0 = time.time()
    out = subprocess.run(cmd, capture_output=True, text=True)
    return out.returncode == 0, (out.stderr.strip()[-400:] if out.returncode else ""), time.time() - t0


def airing_now():
    """True while the live runner has an RTMP push in flight — never compete with it for the two cores."""
    out = subprocess.run(["pgrep", "-af", "ffmpeg"], capture_output=True, text=True)
    return any("-f flv" in line or "rtmp" in line for line in out.stdout.splitlines() if "vyve-video-normalise" not in line)


def free_gb(path):
    st = os.statvfs(path)
    return st.f_bavail * st.f_frsize / (1024 ** 3)


def pending(item_id=None, limit=1):
    if item_id:
        q = f"partner_content_items?select=id,title,media_url,partner_id,width,height,duration_sec,normalise_attempts&id=eq.{item_id}"
    else:
        q = ("partner_content_items?select=id,title,media_url,partner_id,width,height,duration_sec,normalise_attempts"
             "&moderation_status=eq.approved&removed_at=is.null&media_url=not.is.null&normalised_at=is.null"
             f"&normalise_attempts=lt.{MAX_ATTEMPTS}&order=created_at.asc&limit={limit}")
    st, rows = supa("GET", q)
    return rows if st == 200 and isinstance(rows, list) else []


def takedowns():
    st, rows = supa("GET", "partner_content_items?select=id,title,normalised_path&removed_at=not.is.null&normalised_path=not.is.null&limit=20")
    return rows if st == 200 and isinstance(rows, list) else []


def run(dry_run=False, item_id=None, limit=1):
    os.makedirs(os.path.join(MEDIA_DIR, SUBDIR), exist_ok=True)

    # removals first — freeing disk is never blocked by anything
    for row in takedowns():
        p = os.path.join(MEDIA_DIR, row["normalised_path"])
        if dry_run:
            log(f"dry-run: would delete {p} ('{row['title']}')"); continue
        try:
            if os.path.isfile(p): os.remove(p)
            supa("PATCH", f"partner_content_items?id=eq.{row['id']}", data={"normalised_path": None, "normalised_bytes": None},
                 prefer="return=minimal")
            log(f"takedown: removed box copy for '{row['title']}'")
        except Exception as e:
            log(f"takedown FAILED for '{row['title']}': {e}")

    rows = pending(item_id, limit)
    if not rows:
        log("nothing pending"); return
    if airing_now():
        log("live push in progress — skipping this run (§23.318)"); return
    fg = free_gb(MEDIA_DIR)
    if fg < MIN_FREE_GB:
        log(f"only {fg:.1f}GB free under {MEDIA_DIR} — stopping")
        alert("high", "normalise_disk_low", f"vyve-live-runner has {fg:.1f}GB free under {MEDIA_DIR}; partner video normalising is paused until space is freed.")
        return

    for row in rows:
        raw = row.get("media_url") or ""
        path = raw[len(BUCKET) + 1:] if raw.startswith(BUCKET + "/") else raw
        src = f"/tmp/vyvenorm-{row['id']}-src"
        dst_rel = f"{SUBDIR}/{row['id']}.mp4"
        dst = os.path.join(MEDIA_DIR, dst_rel)
        tmp_dst = dst + ".part"
        log(f"item {row['id']}  '{row['title']}'  <- {path}")
        if dry_run:
            log(f"  dry-run: would encode -> {dst_rel}"); continue
        attempts = int(row.get("normalise_attempts") or 0) + 1
        supa("PATCH", f"partner_content_items?id=eq.{row['id']}", data={"normalise_attempts": attempts}, prefer="return=minimal")
        try:
            n = storage_download(path, src)
            log(f"  downloaded {n} bytes")
            info, perr = probe(src)
            if not info:
                raise RuntimeError(f"probe failed: {perr}")
            log(f"  source {info['width']}x{info['height']} {info['duration']:.0f}s {info['vcodec']}/{info['acodec']} {info['bit_rate']//1000}kbps")
            ok, err, secs = encode(src, tmp_dst, info)
            if not ok:
                raise RuntimeError(f"encode failed: {err}")
            os.replace(tmp_dst, dst)
            out_info, _ = probe(dst)
            size = os.path.getsize(dst)
            patch = {"normalised_path": dst_rel, "normalised_at": datetime.now(timezone.utc).isoformat(),
                     "normalised_bytes": size, "normalise_error": None}
            # back-fill what PM-1199 now captures at upload, for anything uploaded before it
            if not row.get("width") and info["width"]: patch["width"] = info["width"]
            if not row.get("height") and info["height"]: patch["height"] = info["height"]
            if not row.get("duration_sec") and info["duration"]: patch["duration_sec"] = int(round(info["duration"]))
            st, _ = supa("PATCH", f"partner_content_items?id=eq.{row['id']}", data=patch, prefer="return=minimal")
            dims = f"{out_info['width']}x{out_info['height']}" if out_info else "?"
            log(f"  normalised -> {dst_rel} {size/1048576:.1f}MB ({dims}) in {secs:.0f}s, {info['duration']/max(secs,0.1):.1f}x realtime  (patch {st})")
        except Exception as e:
            msg = str(e)[:300]
            log("  FAILED:", msg)
            supa("PATCH", f"partner_content_items?id=eq.{row['id']}", data={"normalise_error": msg}, prefer="return=minimal")
            if attempts >= MAX_ATTEMPTS:
                alert("high", "normalise_failed", f"'{row['title']}' ({row['id']}) failed to normalise {attempts} times and will not be retried: {msg}")
        finally:
            for f in (src, tmp_dst):
                try: os.remove(f)
                except Exception: pass


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--once", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--item")
    ap.add_argument("--max", type=int, default=1)
    a = ap.parse_args()
    if not SERVICE_KEY: die("VYVE_SUPABASE_SERVICE_KEY not set")
    if not shutil.which("ffmpeg") or not shutil.which("ffprobe"): die("ffmpeg/ffprobe not on PATH")
    run(dry_run=a.dry_run, item_id=a.item, limit=a.max)


if __name__ == "__main__":
    main()
