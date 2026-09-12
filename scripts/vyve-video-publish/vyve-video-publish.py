#!/usr/bin/env python3
"""
vyve-video-publish.py  —  PM-1197 / PM-1198

Partner uploads reach members through YouTube, not through our own storage egress.
This worker takes any approved, non-removed partner_content_items row that has a file in the
private `partner-content` bucket and no youtube_video_id yet, pushes it to the VYVE channel as
an UNLISTED video, and writes the video id back onto the row. partner-profile.html plays the
welcome video from YouTube the moment youtube_video_id is set (PM-1198).

NEVER write replay_video_id here — it is an FK into the replay catalogue and means "this item
aired" (§23.317). youtube_video_id is its own nullable column with no FK.

Scope (PM-1198): welcome videos only by default (VYVE_YT_WELCOME_ONLY=1). Everything else
reaches members by airing as a session and coming home as a replay (PM-1196), so uploading it
unlisted now would only burn the daily quota the live schedule shares. Flip the env to widen.

It also sweeps the other direction: a row that has been removed (including the urgent
safeguarding path) has its YouTube video flipped to private, so a takedown actually takes the
video down instead of leaving it on a live URL.

Why here and not an Edge Function: a 130MB resumable upload does not belong inside a function
with a wall-clock limit, and this box already needs partner media locally for the airing path.
One media worker, not two.

Quota: videos.insert costs ~1600 units of a default 10,000/day, so MAX_PER_DAY is the real
ceiling, not our own throughput. Over the cap we stop and say so rather than burning the
quota the live schedule may need.

Env (shares /opt/vyve/vyve-runner.env with the live runner):
  VYVE_SUPABASE_URL, VYVE_SUPABASE_SERVICE_KEY
Usage:
  vyve-video-publish.py --once          one pass, then exit (cron/systemd timer)
  vyve-video-publish.py --dry-run       resolve + print the plan, change nothing
  vyve-video-publish.py --item <uuid>   force one specific item
"""
import argparse, json, os, sys, time, urllib.parse, urllib.request
from datetime import datetime, timezone

SUPABASE_URL = os.environ.get("VYVE_SUPABASE_URL", "https://ixjfklpckgxrwjlfsaaz.supabase.co").rstrip("/")
SERVICE_KEY  = os.environ.get("VYVE_SUPABASE_SERVICE_KEY", "")
BUCKET       = "partner-content"
MAX_PER_DAY  = int(os.environ.get("VYVE_YT_MAX_PER_DAY", "5"))
WELCOME_ONLY = os.environ.get("VYVE_YT_WELCOME_ONLY", "1") != "0"
OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token"
UPLOAD_URL = "https://www.googleapis.com/upload/youtube/v3/videos"
API_URL    = "https://www.googleapis.com/youtube/v3/videos"
CHUNK = 8 * 1024 * 1024


def log(*a):
    print(datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), *a, flush=True)


def die(msg):
    log("FATAL:", msg); sys.exit(1)


def _req(method, url, headers=None, data=None, raw=None, timeout=300):
    h = dict(headers or {})
    body = raw
    if data is not None:
        body = json.dumps(data).encode()
        h.setdefault("Content-Type", "application/json")
    req = urllib.request.Request(url, data=body, headers=h, method=method)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            b = r.read()
            try:
                return r.status, json.loads(b)
            except Exception:
                return r.status, b
    except urllib.error.HTTPError as e:
        b = e.read()
        try:
            return e.code, json.loads(b)
        except Exception:
            return e.code, b


def supa(method, path, data=None, prefer=None):
    h = {"apikey": SERVICE_KEY, "Authorization": f"Bearer {SERVICE_KEY}"}
    if prefer:
        h["Prefer"] = prefer
    return _req(method, f"{SUPABASE_URL}/rest/v1/{path}", headers=h, data=data)


def read_vault_secret(name):
    st, body = supa("POST", "rpc/read_vault_secret", data={"secret_name": name})
    if st != 200:
        die(f"vault read {name}: {st} {body}")
    return body


def refresh_access_token():
    cid  = read_vault_secret("YOUTUBE_OAUTH_CLIENT_ID")
    csec = read_vault_secret("YOUTUBE_OAUTH_CLIENT_SECRET")
    rtok = read_vault_secret("YOUTUBE_OAUTH_REFRESH_TOKEN")
    payload = urllib.parse.urlencode({
        "client_id": cid, "client_secret": csec,
        "refresh_token": rtok, "grant_type": "refresh_token",
    }).encode()
    st, j = _req("POST", OAUTH_TOKEN_URL, headers={"Content-Type": "application/x-www-form-urlencoded"}, raw=payload)
    if st != 200 or "access_token" not in j:
        die(f"token refresh failed: {st} {j}")
    return j["access_token"]


def storage_download(path, dest):
    """Service-role read straight out of the private bucket — no signed URL needed on the box."""
    url = f"{SUPABASE_URL}/storage/v1/object/{BUCKET}/{urllib.parse.quote(path)}"
    req = urllib.request.Request(url, headers={"apikey": SERVICE_KEY, "Authorization": f"Bearer {SERVICE_KEY}"})
    with urllib.request.urlopen(req, timeout=900) as r, open(dest, "wb") as f:
        n = 0
        while True:
            b = r.read(CHUNK)
            if not b:
                break
            f.write(b); n += len(b)
    return n


def yt_upload(token, filepath, title, description):
    size = os.path.getsize(filepath)
    meta = {
        "snippet": {"title": title[:100], "description": description[:4900], "categoryId": "17"},
        "status": {"privacyStatus": "unlisted", "selfDeclaredMadeForKids": False},
    }
    # One init only — each one costs quota. urllib exposes Location on the response object.
    req = urllib.request.Request(UPLOAD_URL + "?uploadType=resumable&part=snippet,status",
                                 data=json.dumps(meta).encode(),
                                 headers={"Authorization": f"Bearer {token}",
                                          "Content-Type": "application/json",
                                          "X-Upload-Content-Length": str(size),
                                          "X-Upload-Content-Type": "video/*"},
                                 method="POST")
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            loc = r.headers.get("Location")
    except urllib.error.HTTPError as e:
        return None, f"resumable init {e.code} {e.read()[:300]}"
    if not loc:
        return None, "no resumable Location header"
    with open(filepath, "rb") as f:
        body = f.read()
    put = urllib.request.Request(loc, data=body,
                                 headers={"Authorization": f"Bearer {token}",
                                          "Content-Type": "video/*",
                                          "Content-Length": str(size)},
                                 method="PUT")
    try:
        with urllib.request.urlopen(put, timeout=1800) as r:
            j = json.loads(r.read())
    except urllib.error.HTTPError as e:
        return None, f"upload {e.code} {e.read()[:300]}"
    vid = (j or {}).get("id")
    return (vid, None) if vid else (None, f"no id in response: {j}")


def yt_set_private(token, video_id):
    st, j = _req("PUT", API_URL + "?part=status",
                 headers={"Authorization": f"Bearer {token}"},
                 data={"id": video_id, "status": {"privacyStatus": "private"}})
    return st in (200, 201), j


def alert(severity, atype, details):
    try:
        supa("POST", "platform_alerts", data={
            "severity": severity, "type": atype, "source": "vyve-video-publish",
            "page": "partner-content", "details": details,
        })
    except Exception:
        pass


def pending(item_id=None):
    q = ("partner_content_items?select=id,title,description,media_url,partner_id,is_welcome"
         "&moderation_status=eq.approved&removed_at=is.null"
         "&youtube_video_id=is.null&media_url=not.is.null&order=created_at.asc&limit=20")
    if WELCOME_ONLY:
        q += "&is_welcome=is.true"
    if item_id:
        q = f"partner_content_items?select=id,title,description,media_url,partner_id,is_welcome&id=eq.{item_id}"
    st, rows = supa("GET", q)
    return rows if st == 200 and isinstance(rows, list) else []


def takedowns():
    st, rows = supa("GET", "partner_content_items?select=id,title,youtube_video_id"
                           "&removed_at=not.is.null&youtube_video_id=not.is.null&limit=20")
    return rows if st == 200 and isinstance(rows, list) else []


def partner_name(pid):
    st, rows = supa("GET", f"partner_partners?select=name&id=eq.{pid}")
    return rows[0]["name"] if st == 200 and rows else ""


def run(dry_run=False, item_id=None):
    token = None
    done = 0

    for row in pending(item_id):
        if done >= MAX_PER_DAY and not item_id:
            log(f"stopping at MAX_PER_DAY={MAX_PER_DAY} (YouTube quota); {len(pending())-done} still waiting")
            alert("info", "yt_publish_quota_cap",
                  f"Hit the {MAX_PER_DAY}/day YouTube upload cap with items still queued.")
            break
        raw = row.get("media_url") or ""
        path = raw[len(BUCKET) + 1:] if raw.startswith(BUCKET + "/") else raw
        who = partner_name(row.get("partner_id"))
        title = (row.get("title") or "VYVE").strip()
        desc = (row.get("description") or "").strip()
        tail = f"{who} on VYVE Health." if who else ""
        full_desc = "\n\n".join([x for x in (desc, tail) if x])
        log(f"item {row['id']}  '{title}'  ({who})  <- {path}")
        if dry_run:
            log("  dry-run: would download + upload unlisted"); continue
        tmp = f"/tmp/vyvepub-{row['id']}"
        try:
            n = storage_download(path, tmp)
            log(f"  downloaded {n} bytes")
            if token is None:
                token = refresh_access_token()
            vid, err = yt_upload(token, tmp, title, full_desc)
            if err:
                log("  UPLOAD FAILED:", err)
                alert("high", "yt_publish_failed", f"{who}: '{title}' failed to publish — {err}")
                continue
            st, _ = supa("PATCH", f"partner_content_items?id=eq.{row['id']}",
                         data={"youtube_video_id": vid}, prefer="return=minimal")
            log(f"  published {vid}  (patch {st})")
            done += 1
        finally:
            try: os.remove(tmp)
            except Exception: pass

    for row in takedowns():
        if dry_run:
            log(f"dry-run: would privatise {row['youtube_video_id']} ('{row['title']}')"); continue
        if token is None:
            token = refresh_access_token()
        ok, j = yt_set_private(token, row["youtube_video_id"])
        log(f"takedown {row['youtube_video_id']} private={ok}")
        if ok:
            supa("PATCH", f"partner_content_items?id=eq.{row['id']}",
                 data={"youtube_video_id": None}, prefer="return=minimal")
        else:
            alert("high", "yt_takedown_failed",
                  f"Removed item '{row['title']}' is still live on YouTube as {row['youtube_video_id']}: {j}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--once", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--item")
    a = ap.parse_args()
    if not SERVICE_KEY:
        die("VYVE_SUPABASE_SERVICE_KEY not set")
    run(dry_run=a.dry_run, item_id=a.item)


if __name__ == "__main__":
    main()
