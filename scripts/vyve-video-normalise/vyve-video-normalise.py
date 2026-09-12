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
  vyve-video-normalise.py --once          one pass over partner uploads (systemd timer)
  vyve-video-normalise.py --dry-run       print the plan, encode nothing
  vyve-video-normalise.py --item <uuid>   force one item (ignores the attempts cap)
  vyve-video-normalise.py --max N         items per run (default 1)

Second mode — the session masters (PM-XXX):
  vyve-video-normalise.py --masters [--max N] [--budget-min M] [--only <substring>] [--dry-run]

  Walks the top level of VYVE_MEDIA_DIR (the 125 riverside masters — 22 are 640x360, 16 carry 48kHz
  audio, all carry ~10s keyframe intervals) and writes a runner-spec copy of each to
  norm/<same filename> with a JSON sidecar beside it. The ORIGINAL IS NEVER TOUCHED: the runner
  prefers norm/<notes> when its sidecar is valid and stream-copies it, and falls back to the
  original + re-encode otherwise. Masters are taken soonest-scheduled first so upcoming airings
  get the copy path early. Uses two x264 threads (nice 19) — the box has two cores and a copy-path
  push costs nothing — but never starts a master that would still be encoding when the next
  occurrence airs (calendar guard), never while a push is in flight, and never under the disk floor.

Sidecars (`<output>.json`) are the contract with the runner: they record the source's size/mtime
and the encode spec (preset, fps, gop, sample rate, channels, colour) so the runner can render
byte-compatible padding cards and verify the concat before choosing `-c copy`.
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
# preset/colour/gop are recorded in the sidecar and the runner renders its padding cards with the
# SAME values so the SPS/PPS match across the concat (a mismatch is caught by the runner's probe gate).
# preset: veryfast is what the live push already uses today (PM-1201 ffmpeg_cmd), so a crf-20 veryfast
# copy is never worse than what members see now; measured on the box for full-motion 1080p24 with two
# threads: medium 0.77x realtime, faster 1.05x, veryfast 1.5x — the 30h library is ~20h at veryfast, ~40h at medium.
TARGET = dict(v_bitrate="4500k", v_maxrate="4500k", v_bufsize="9000k", fps=30, gop_sec=2,
              a_bitrate="128k", a_rate=44100, max_edge=1920, preset="veryfast", crf=20,
              color="bt709", color_range="tv")
SPEC_VERSION = 2
COLOR_SETPARAMS = (f"setparams=range={TARGET['color_range']}:color_primaries={TARGET['color']}"
                   f":color_trc={TARGET['color']}:colorspace={TARGET['color']}")
NORM_SUBDIR = "norm"
KEEP_FPS = {"24000/1001", "24/1", "25/1", "30000/1001", "30/1"}   # kept as-is; anything else -> 30 CFR


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
    rfr = v.get("r_frame_rate") or "30/1"
    afr = v.get("avg_frame_rate") or rfr
    return {"width": w, "height": h, "duration": dur, "vcodec": v.get("codec_name"), "pix_fmt": v.get("pix_fmt"),
            "profile": v.get("profile"), "r_frame_rate": rfr, "avg_frame_rate": afr,
            "a_channels": int(a.get("channels") or 0) if a else 0,
            "acodec": a.get("codec_name") if a else None, "a_rate": int(a.get("sample_rate") or 0) if a else 0,
            "bit_rate": int((j.get("format") or {}).get("bit_rate") or 0), "has_audio": a is not None}, None


def target_fps(info):
    """Keep a standard source rate (24/25/30, drop-frame variants) so 24fps masters are not frame-doubled;
    anything else (VFR phones, 50/60/120) becomes 30 CFR. Returns (fps_string, gop_frames)."""
    fr = (info.get("r_frame_rate") or "30/1").strip()
    if fr != (info.get("avg_frame_rate") or fr).strip():
        fr = "30/1"   # VFR: r and avg disagree
    if fr not in KEEP_FPS:
        fr = "30/1"
    num, _, den = fr.partition("/")
    fps_val = float(num) / float(den or 1)
    return fr, int(round(fps_val * TARGET["gop_sec"]))


def encode(src, dst, info, threads=1):
    edge = TARGET["max_edge"]
    fps_str, gop = target_fps(info)
    # scale uniformly so the longest side is <= 1080p and both dimensions stay even; portrait keeps its shape
    # setparams pins the colour tags IN THE FRAMES: ffmpeg 8 lets frame-side properties (a jpeg's, a bt470bg
    # master's) win over the encoder's -colorspace/-color_primaries options, and the runner's copy gate
    # compares those tags across the concat entries (PM-XXX)
    vf = (f"scale='trunc(min(1,min({edge}/iw,{edge}/ih))*iw/2)*2':'trunc(min(1,min({edge}/iw,{edge}/ih))*ih/2)*2':out_range=tv,"
          f"fps={fps_str},format=yuv420p,{COLOR_SETPARAMS}")
    inputs = ["-i", src]
    if not info["has_audio"]:
        # the runner and YouTube both expect an audio track — synthesise silence as input 1
        inputs += ["-f", "lavfi", "-i", f"anullsrc=r={TARGET['a_rate']}:cl=stereo"]
    cmd = ["nice", "-n", "19", "ffmpeg", "-hide_banner", "-loglevel", "error", "-y"] + inputs + [
           "-map", "0:v:0", "-vf", vf,
           "-c:v", "libx264", "-preset", TARGET["preset"], "-profile:v", "high", "-threads", str(threads),
           "-crf", str(TARGET["crf"]), "-maxrate", TARGET["v_maxrate"], "-bufsize", TARGET["v_bufsize"],   # quality-led, capped at the runner rate
           "-g", str(gop), "-keyint_min", str(gop), "-sc_threshold", "0",
           "-fps_mode", "cfr",
           # pinned so the SPS/VUI is identical to the padding cards the runner renders (concat -c copy)
           "-color_range", TARGET["color_range"], "-colorspace", TARGET["color"],
           "-color_primaries", TARGET["color"], "-color_trc", TARGET["color"],
           "-map", "0:a:0" if info["has_audio"] else "1:a:0",
           "-c:a", "aac", "-b:a", TARGET["a_bitrate"], "-ar", str(TARGET["a_rate"]), "-ac", "2"]
    if not info["has_audio"]:
        cmd += ["-shortest"]
    cmd += ["-movflags", "+faststart", "-f", "mp4", dst]   # .part suffix hides the extension from ffmpeg
    t0 = time.time()
    out = subprocess.run(cmd, capture_output=True, text=True)
    return out.returncode == 0, (out.stderr.strip()[-400:] if out.returncode else ""), time.time() - t0


def spec_for(info, preset=None):
    """The values the runner must reproduce when it renders padding cards for this file."""
    fps_str, gop = target_fps(info)
    return {"v": SPEC_VERSION, "vcodec": "h264", "profile": "high", "pix_fmt": "yuv420p", "preset": preset or TARGET["preset"],
            "crf": TARGET["crf"], "maxrate": TARGET["v_maxrate"], "bufsize": TARGET["v_bufsize"],
            "fps": fps_str, "gop": gop, "acodec": "aac", "a_bitrate": TARGET["a_bitrate"], "ar": TARGET["a_rate"], "ch": 2,
            "color": TARGET["color"], "color_range": TARGET["color_range"]}


def sidecar_path(out_path):
    return out_path + ".json"


def write_sidecar(out_path, src_name, src_stat, info, out_info, secs, preset=None):
    sc = {"src": src_name, "src_bytes": src_stat[0], "src_mtime": src_stat[1],
          "bytes": os.path.getsize(out_path), "width": out_info["width"], "height": out_info["height"],
          "duration": out_info["duration"], "spec": spec_for(info, preset),
          "normalised_at": datetime.now(timezone.utc).isoformat(timespec="seconds"), "encode_sec": round(secs)}
    tmp = sidecar_path(out_path) + ".tmp"
    with open(tmp, "w") as f:
        json.dump(sc, f, indent=1)
    os.replace(tmp, sidecar_path(out_path))
    return sc


def read_sidecar(out_path):
    try:
        with open(sidecar_path(out_path)) as f:
            return json.load(f)
    except Exception:
        return None


def verify_output(dst, info):
    """The copy must probe as the spec says and be the same length as its source (±2s)."""
    out_info, err = probe(dst)
    if not out_info:
        return None, f"output probe failed: {err}"
    fps_str, _ = target_fps(info)
    want = [("vcodec", "h264"), ("pix_fmt", "yuv420p"), ("a_rate", TARGET["a_rate"]), ("a_channels", 2), ("acodec", "aac")]
    for k, v in want:
        if out_info.get(k) != v:
            return None, f"output {k}={out_info.get(k)!r}, expected {v!r}"
    if out_info.get("r_frame_rate") != fps_str:
        return None, f"output fps={out_info.get('r_frame_rate')}, expected {fps_str}"
    if (out_info.get("profile") or "").lower() != "high":
        return None, f"output profile={out_info.get('profile')!r}, expected High"
    if abs(out_info["duration"] - info["duration"]) > 2.0:
        return None, f"output duration {out_info['duration']:.1f}s vs source {info['duration']:.1f}s"
    return out_info, None


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

    backfill_partner_sidecars(dry_run)
    rows = pending(item_id, limit)
    if not rows:
        log("nothing pending"); return
    if airing_now():
        log("live push in progress — skipping this run (§23.318)"); return
    gap = next_airing_in(upcoming_by_file())
    if gap is not None and gap < 20 * 60 and not item_id:
        log(f"next airing in {gap/60:.0f}min — skipping this run so the encode never overlaps it"); return
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
            out_info, verr = verify_output(tmp_dst, info)
            if not out_info:
                raise RuntimeError(f"verify failed: {verr}")
            os.replace(tmp_dst, dst)
            write_sidecar(dst, path, (n, 0), info, out_info, secs)
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


# ── masters mode (PM-XXX) ───────────────────────────────────────────────────
def upcoming_by_file(days=14):
    """{notes filename: soonest starts_at epoch} over the next N days — the encode order, and the calendar guard."""
    now = datetime.now(timezone.utc)
    lo = now.strftime("%Y-%m-%dT%H:%M:%SZ")
    hi = datetime.fromtimestamp(now.timestamp() + days * 86400, timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    st, rows = supa("GET", "calendar_occurrences?select=notes,starts_at&type=eq.live_session&active=eq.true&cancelled_at=is.null"
                           f"&starts_at=gte.{lo}&starts_at=lte.{hi}&order=starts_at.asc&limit=1000")
    out = {}
    if st != 200 or not isinstance(rows, list):
        log(f"WARN: calendar read failed ({st}) — no scheduling priority, guard assumes an airing in 15 min")
        return None
    for r in rows:
        n = (r.get("notes") or "").strip()
        try:
            ts = datetime.fromisoformat(r["starts_at"].replace("Z", "+00:00")).timestamp()
        except Exception:
            continue
        if n and (n not in out or ts < out[n]):
            out[n] = ts
    return out


def next_airing_in(cal):
    """Seconds until the soonest scheduled occurrence (None = nothing in the window)."""
    if cal is None:
        return 900.0
    if not cal:
        return None
    return min(cal.values()) - time.time()


def backfill_partner_sidecars(dry_run=False):
    """partner/<id>.mp4 files written before sidecars existed (PM-1200 ran with preset medium, the same TARGET)."""
    d = os.path.join(MEDIA_DIR, SUBDIR)
    if not os.path.isdir(d):
        return
    for n in sorted(os.listdir(d)):
        p = os.path.join(d, n)
        if not n.endswith(".mp4") or os.path.isfile(sidecar_path(p)):
            continue
        info, err = probe(p)
        if not info:
            log(f"sidecar backfill: probe failed for {n}: {err}"); continue
        if dry_run:
            log(f"dry-run: would write sidecar for partner/{n}"); continue
        # PM-1200's v1 encoder was preset medium with the same crf/gop/rate — record what was actually used
        write_sidecar(p, f"{BUCKET}:{n}", (os.path.getsize(p), 0), info, info, 0, preset="medium")
        log(f"sidecar backfill: partner/{n} (legacy medium)")


def masters_todo(only=None):
    """Top-level masters lacking a valid norm copy. Valid = sidecar present, src size+mtime unchanged, output present."""
    todo = []
    for n in sorted(os.listdir(MEDIA_DIR)):
        src = os.path.join(MEDIA_DIR, n)
        if not n.lower().endswith(".mp4") or not os.path.isfile(src):
            continue
        if only and only.lower() not in n.lower():
            continue
        st = os.stat(src)
        dst = os.path.join(MEDIA_DIR, NORM_SUBDIR, n)
        sc = read_sidecar(dst)
        if sc and os.path.isfile(dst) and sc.get("src_bytes") == st.st_size and int(sc.get("src_mtime") or 0) == int(st.st_mtime) \
                and (sc.get("spec") or {}).get("v") == SPEC_VERSION and os.path.getsize(dst) == sc.get("bytes"):
            continue
        todo.append(n)
    return todo


def run_masters(dry_run=False, limit=500, budget_min=0, only=None):
    os.makedirs(os.path.join(MEDIA_DIR, NORM_SUBDIR), exist_ok=True)
    backfill_partner_sidecars(dry_run)
    cal = upcoming_by_file()
    todo = masters_todo(only)
    if not todo:
        log("masters: nothing to do — every top-level master has a valid norm copy"); return
    # soonest-scheduled first, then unscheduled alphabetically
    todo.sort(key=lambda n: ((cal or {}).get(n, float("inf")), n.lower()))
    log(f"masters: {len(todo)} to normalise ({sum(1 for n in todo if n in (cal or {}))} scheduled in the next 14 days)")
    t_end = time.time() + budget_min * 60 if budget_min else None
    done = 0
    for n in todo:
        if done >= limit:
            log(f"masters: --max {limit} reached"); break
        if t_end and time.time() > t_end:
            log("masters: budget exhausted"); break
        src = os.path.join(MEDIA_DIR, n)
        info, perr = probe(src)
        if not info:
            log(f"  SKIP {n}: probe failed: {perr}"); continue
        est = info["duration"] / 1.2 + 120   # veryfast/2 threads measured ~1.5x realtime on a free box; assume 1.2x + margin
        if dry_run:
            sched = (cal or {}).get(n)
            when = datetime.fromtimestamp(sched, timezone.utc).strftime("%d %b %H:%M") if sched else "unscheduled"
            log(f"  would encode {n}  {info['width']}x{info['height']} {info['r_frame_rate']} {info['a_rate']}Hz {info['duration']:.0f}s  ~{est/60:.0f}min  [{when}]")
            done += 1
            continue
        # guards — re-evaluated per master
        while True:
            if airing_now():
                log("  live push in flight — waiting 60s (§23.318)"); time.sleep(60); continue
            fg = free_gb(MEDIA_DIR)
            if fg < MIN_FREE_GB:
                log(f"  only {fg:.1f}GB free — stopping")
                alert("high", "normalise_disk_low", f"vyve-live-runner has {fg:.1f}GB free under {MEDIA_DIR}; the master normalise pass stopped.")
                return
            cal = upcoming_by_file() or cal
            gap = next_airing_in(cal)
            if gap is not None and gap < est:
                # would still be encoding when the next occurrence airs — wait for that airing to pass
                wait = min(max(gap, 0) + 60, 900)
                log(f"  next airing in {gap/60:.0f}min < ~{est/60:.0f}min encode for '{n}' — waiting {wait:.0f}s")
                time.sleep(wait); continue
            break
        dst = os.path.join(MEDIA_DIR, NORM_SUBDIR, n)
        tmp_dst = dst + ".part"
        st = os.stat(src)
        log(f"master '{n}'  {info['width']}x{info['height']} {info['r_frame_rate']} {info['vcodec']}/{info['acodec']}@{info['a_rate']} {info['duration']:.0f}s")
        try:
            ok, err, secs = encode(src, tmp_dst, info, threads=2)
            if not ok:
                raise RuntimeError(f"encode failed: {err}")
            out_info, verr = verify_output(tmp_dst, info)
            if not out_info:
                raise RuntimeError(f"verify failed: {verr}")
            os.replace(tmp_dst, dst)
            sc = write_sidecar(dst, n, (st.st_size, int(st.st_mtime)), info, out_info, secs)
            done += 1
            log(f"  -> {NORM_SUBDIR}/{n} {sc['bytes']/1048576:.1f}MB {sc['spec']['fps']} in {secs:.0f}s, {info['duration']/max(secs,0.1):.1f}x realtime  ({done} done, {free_gb(MEDIA_DIR):.1f}GB free)")
        except Exception as e:
            log(f"  FAILED '{n}': {str(e)[:300]}")
            alert("high", "normalise_master_failed", f"'{n}' failed to normalise: {str(e)[:300]}")
        finally:
            try: os.remove(tmp_dst)
            except Exception: pass
    log(f"masters: pass finished, {done} normalised, {len(masters_todo(only))} remaining")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--once", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--item")
    ap.add_argument("--max", type=int, default=None)
    ap.add_argument("--masters", action="store_true", help="normalise the session masters into norm/ (PM-XXX)")
    ap.add_argument("--budget-min", type=int, default=0, help="masters: stop starting new encodes after N minutes")
    ap.add_argument("--only", help="masters: only filenames containing this substring")
    a = ap.parse_args()
    if not SERVICE_KEY: die("VYVE_SUPABASE_SERVICE_KEY not set")
    if not shutil.which("ffmpeg") or not shutil.which("ffprobe"): die("ffmpeg/ffprobe not on PATH")
    if a.masters:
        run_masters(dry_run=a.dry_run, limit=a.max or 500, budget_min=a.budget_min, only=a.only)
    else:
        run(dry_run=a.dry_run, item_id=a.item, limit=a.max or 1)


if __name__ == "__main__":
    main()
