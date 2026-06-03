#!/usr/bin/env python3
"""
vyve-thumbs-backfill.py  (PM-448)
=================================
Set custom thumbnails on broadcasts that ALREADY exist (leftovers + any already
aired) from their <basename>.jpg. Upcoming rows have no broadcast yet — the
runner sets those at air time; this just catches the ones already minted.

Resolve: calendar_occurrences with youtube_broadcast_id NOT NULL
  -> notes -> <basename>.jpg in VYVE_THUMB_DIR/VYVE_MEDIA_DIR
  -> thumbnails.set(videoId, jpg)

Env: VYVE_SUPABASE_URL, VYVE_SUPABASE_SERVICE_KEY (required),
     VYVE_MEDIA_DIR / VYVE_THUMB_DIR (where the jpgs are).
Run on the box (needs the jpgs + Vault OAuth + Supabase).

    python3 vyve-thumbs-backfill.py            # all minted broadcasts with a matching jpg
    python3 vyve-thumbs-backfill.py --dry-run  # list what it would set, upload nothing
"""
import argparse, json, os, sys, urllib.error, urllib.parse, urllib.request

SUPABASE_URL = os.environ.get("VYVE_SUPABASE_URL", "https://ixjfklpckgxrwjlfsaaz.supabase.co").rstrip("/")
SERVICE_KEY = os.environ.get("VYVE_SUPABASE_SERVICE_KEY", "")
MEDIA_DIR = os.path.expanduser(os.environ.get("VYVE_MEDIA_DIR", ""))
THUMB_DIR = os.path.expanduser(os.environ.get("VYVE_THUMB_DIR", "") or MEDIA_DIR)


def supa_get(path):
    req = urllib.request.Request(f"{SUPABASE_URL}/rest/v1/{path}",
                                 headers={"apikey": SERVICE_KEY, "Authorization": f"Bearer {SERVICE_KEY}"})
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read().decode())


def read_vault(name):
    req = urllib.request.Request(f"{SUPABASE_URL}/rest/v1/rpc/read_vault_secret",
        data=json.dumps({"secret_name": name}).encode(),
        headers={"Content-Type": "application/json", "apikey": SERVICE_KEY,
                 "Authorization": f"Bearer {SERVICE_KEY}"}, method="POST")
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read().decode())


def token():
    body = urllib.parse.urlencode({
        "client_id": read_vault("YOUTUBE_OAUTH_CLIENT_ID"),
        "client_secret": read_vault("YOUTUBE_OAUTH_CLIENT_SECRET"),
        "refresh_token": read_vault("YOUTUBE_OAUTH_REFRESH_TOKEN"),
        "grant_type": "refresh_token"}).encode()
    req = urllib.request.Request("https://oauth2.googleapis.com/token", data=body,
        headers={"Content-Type": "application/x-www-form-urlencoded"}, method="POST")
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read().decode())["access_token"]


def set_thumb(tok, vid, jpg):
    data = open(jpg, "rb").read()
    url = (f"https://www.googleapis.com/upload/youtube/v3/thumbnails/set"
           f"?videoId={urllib.parse.quote(vid)}&uploadType=media")
    req = urllib.request.Request(url, data=data, method="POST",
                                 headers={"Authorization": f"Bearer {tok}", "Content-Type": "image/jpeg"})
    try:
        with urllib.request.urlopen(req) as r:
            return r.status, None
    except urllib.error.HTTPError as e:
        hint = " (custom thumbnails may not be enabled in Studio)" if e.code == 403 else ""
        return e.code, e.read().decode()[:200] + hint


def jpg_for(notes):
    if not notes:
        return None
    p = os.path.join(THUMB_DIR, os.path.splitext(notes.strip())[0] + ".jpg")
    return p if os.path.isfile(p) else None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()
    if not SERVICE_KEY:
        sys.exit("VYVE_SUPABASE_SERVICE_KEY not set")

    rows = supa_get("calendar_occurrences?select=id,notes,youtube_broadcast_id,session_title"
                    "&youtube_broadcast_id=not.is.null&order=starts_at.desc&limit=2000")
    todo = [(r["youtube_broadcast_id"], jpg_for(r.get("notes")), r.get("session_title") or r.get("notes"))
            for r in rows]
    todo = [(bid, jpg, t) for bid, jpg, t in todo if jpg]
    print(f"{len(rows)} broadcasts; {len(todo)} have a matching thumbnail")

    tok = None if args.dry_run else token()
    done = 0
    for bid, jpg, label in todo:
        if args.dry_run:
            print(f"  WOULD set {bid} <- {os.path.basename(jpg)}  ({label})")
            continue
        st, err = set_thumb(tok, bid, jpg)
        print(f"  {bid} <- {os.path.basename(jpg)}: {'OK' if err is None else f'{st} {err}'}")
        done += err is None
    if not args.dry_run:
        print(f"done: {done}/{len(todo)} set")


if __name__ == "__main__":
    main()
