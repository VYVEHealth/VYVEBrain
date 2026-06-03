#!/usr/bin/env python3
"""
vyve-thumbgen.py  (PM-448)
==========================
Generate a branded 1280x720 thumbnail per master video, ready for the runner /
backfill to upload to YouTube via thumbnails.set.

For each .mp4 in the masters folder it grabs a representative frame (clamped to
the file's real duration, so the ~12 truncated stubs don't break it), applies
the VYVE teal grade, overlays category + title + host + logo, and writes
<basename>.jpg next to the master (or into VYVE_THUMB_DIR).

Title / host / category come from `calendar_occurrences` matched on
notes == filename (so they track the live calendar); fall back to a prettified
filename when a master isn't on the calendar.

Requirements (on the box):  python3, ffmpeg/ffprobe, `pip install Pillow`.
Drop PlayfairDisplay-*.ttf beside this script for the exact brand serif;
otherwise it falls back to Georgia/Times/DejaVu automatically.

Env:
    VYVE_SUPABASE_URL          (default the VYVE project)
    VYVE_SUPABASE_SERVICE_KEY  (to read titles/hosts from calendar_occurrences; optional)
    VYVE_MEDIA_DIR             masters folder (or pass --dir)
    VYVE_THUMB_DIR             output folder (default = masters folder)

Usage:
    python3 vyve-thumbgen.py                      # all masters in VYVE_MEDIA_DIR
    python3 vyve-thumbgen.py --only "Yoga Flexibility.mp4"
    python3 vyve-thumbgen.py --no-frame           # flat brand cards (no video frame)
    python3 vyve-thumbgen.py --dir "~/Desktop/VYVE LIVES" --out "~/Desktop/VYVE THUMBS"
"""
import argparse, json, os, subprocess, sys, tempfile, urllib.parse, urllib.request
from PIL import Image
import thumb_render as TR

SUPABASE_URL = os.environ.get("VYVE_SUPABASE_URL", "https://ixjfklpckgxrwjlfsaaz.supabase.co").rstrip("/")
SERVICE_KEY = os.environ.get("VYVE_SUPABASE_SERVICE_KEY", "")
LOGO_URL = "https://online.vyvehealth.co.uk/logo.png"
VID_EXT = (".mp4", ".mov", ".m4v", ".mkv")


def prettify(fn):
    base = os.path.splitext(fn)[0]
    return base.replace("_", " ").replace("riverside ", "").strip().title()


def calendar_map():
    """notes(filename) -> {title, host, category} from calendar_occurrences."""
    if not SERVICE_KEY:
        return {}
    url = (f"{SUPABASE_URL}/rest/v1/calendar_occurrences"
           "?select=notes,session_title,host_name,category&notes=not.is.null&limit=2000")
    req = urllib.request.Request(url, headers={"apikey": SERVICE_KEY, "Authorization": f"Bearer {SERVICE_KEY}"})
    try:
        with urllib.request.urlopen(req) as r:
            rows = json.loads(r.read().decode())
    except Exception as e:
        print(f"WARN: calendar lookup failed ({e}); using filenames", file=sys.stderr)
        return {}
    m = {}
    for row in rows:
        n = (row.get("notes") or "").strip()
        if n and n not in m:
            m[n] = {"title": row.get("session_title"), "host": row.get("host_name"),
                    "category": row.get("category")}
    return m


def cache_logo():
    path = os.path.join(tempfile.gettempdir(), "vyve-logo.png")
    if os.path.isfile(path):
        return path
    try:
        urllib.request.urlretrieve(LOGO_URL, path)
        return path
    except Exception:
        return None  # render() falls back to the VYVE wordmark


def duration(path):
    try:
        out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                              "-of", "csv=p=0", path], capture_output=True, text=True, timeout=30)
        return float(out.stdout.strip())
    except Exception:
        return 0.0


def grab_frame(path):
    dur = duration(path)
    t = 2.0 if dur <= 0 else min(max(8.0, dur * 0.15), max(1.0, dur - 1.0))
    tmp = os.path.join(tempfile.gettempdir(), "vyve-frame.jpg")
    try:
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-ss", str(t), "-i", path,
                        "-frames:v", "1", "-q:v", "2", tmp], check=True, timeout=60)
        return Image.open(tmp)
    except Exception as e:
        print(f"  WARN: frame grab failed for {os.path.basename(path)} ({e}); flat brand bg", file=sys.stderr)
        return None


def category_guess(fn):
    f = fn.lower()
    mind = ("meditation", "breathwork", "affirmation", "visualis", "journal", "sleep", "mindful", "stillness")
    return "Mindfulness & Mindset" if any(k in f for k in mind) else "Yoga, Pilates & Stretch"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dir", default=os.path.expanduser(os.environ.get("VYVE_MEDIA_DIR", "")))
    ap.add_argument("--out", default=os.path.expanduser(os.environ.get("VYVE_THUMB_DIR", "")))
    ap.add_argument("--only", help="single filename")
    ap.add_argument("--no-frame", action="store_true", help="flat brand card, no video frame")
    args = ap.parse_args()

    src = os.path.expanduser(args.dir)
    out = os.path.expanduser(args.out) if args.out else src
    if not src or not os.path.isdir(src):
        sys.exit(f"masters dir not found: {src!r} (set VYVE_MEDIA_DIR or --dir)")
    os.makedirs(out, exist_ok=True)

    cal = calendar_map()
    logo = cache_logo()
    files = [args.only] if args.only else sorted(f for f in os.listdir(src) if f.lower().endswith(VID_EXT))
    print(f"{len(files)} master(s); calendar entries: {len(cal)}; logo: {'yes' if logo else 'wordmark fallback'}")

    ok = 0
    for fn in files:
        meta = cal.get(fn, {})
        title = (meta.get("title") or prettify(fn))
        host = meta.get("host") or ""
        category = meta.get("category") or category_guess(fn)
        frame = None if args.no_frame else grab_frame(os.path.join(src, fn))
        dest = os.path.join(out, os.path.splitext(fn)[0] + ".jpg")
        try:
            TR.render(category, title, host, bg=frame, logo_path=logo, out=dest)
            print(f"  OK  {os.path.basename(dest)}  [{category} / {title} / {host or '—'}]")
            ok += 1
        except Exception as e:
            print(f"  FAIL {fn}: {e}", file=sys.stderr)
    print(f"done: {ok}/{len(files)} thumbnails -> {out}")


if __name__ == "__main__":
    main()
