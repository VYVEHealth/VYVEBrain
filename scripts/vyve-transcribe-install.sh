#!/bin/bash
# vyve-transcribe installer — PM-XXX. Idempotent. Run as root on the Hetzner box:
#   curl -s https://ixjfklpckgxrwjlfsaaz.supabase.co/functions/v1/serve-transcribe-installer | sudo bash
set -e
BASE=/srv/vyve/transcribe
SB_URL="https://ixjfklpckgxrwjlfsaaz.supabase.co"
echo "== vyve-transcribe installer =="
mkdir -p "$BASE/data"

echo "-- packages"
export DEBIAN_FRONTEND=noninteractive
apt-get -qq update >/dev/null || true
apt-get -qq install -y python3-venv python3-pip ffmpeg >/dev/null

echo "-- python venv + deps (daily-python, faster-whisper — a few minutes first time)"
if [ ! -d "$BASE/venv" ]; then python3 -m venv "$BASE/venv"; fi
"$BASE/venv/bin/pip" -q install --upgrade pip
"$BASE/venv/bin/pip" -q install requests daily-python faster-whisper

echo "-- service key"
SK=""
for f in /srv/vyve/agent/env /opt/vyve/env /opt/vyve/.env /opt/vyve/*.env; do
  [ -f "$f" ] || continue
  cand=$(grep -hoE '(SUPABASE_)?SERVICE(_ROLE)?_KEY=.*' "$f" 2>/dev/null | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'")
  if [ -n "$cand" ]; then SK="$cand"; echo "   found in $f"; break; fi
done
if [ -z "$SK" ]; then
  # last resort: any JWT-looking value in known env files
  for f in /srv/vyve/agent/env /opt/vyve/env /opt/vyve/.env; do
    [ -f "$f" ] || continue
    cand=$(grep -hoE 'eyJ[A-Za-z0-9_.-]+' "$f" 2>/dev/null | head -1)
    if [ -n "$cand" ]; then SK="$cand"; echo "   found JWT in $f"; break; fi
  done
fi
if [ -z "$SK" ]; then
  # PM-836 rule: interactive read from /dev/tty ONLY, then API-validate
  echo "   paste the Supabase service_role key, then Enter:"
  read -r SK < /dev/tty
fi
code=$(curl -s -o /dev/null -w "%{http_code}" "$SB_URL/rest/v1/transcribe_heartbeat?select=id" -H "apikey: $SK" -H "Authorization: Bearer $SK")
if [ "$code" != "200" ]; then echo "!! service key validation failed (HTTP $code) — aborting, nothing written"; exit 1; fi
echo "   key validated"

umask 077
cat > "$BASE/env" <<ENVEOF
SUPABASE_URL=$SB_URL
SUPABASE_SERVICE_KEY=$SK
WHISPER_MODEL=small
ENVEOF

echo "-- worker.py"
cat > "$BASE/worker.py" <<'PYEOF'
#!/usr/bin/env python3
# vyve-transcribe worker — PM-XXX
# Runs on the Hetzner box as systemd unit `vyve-transcribe` (Restart=always, Nice=19).
# Loop: live cc_meetings with transcribe=true -> join as 'VYVE Notetaker' bot via
# daily-python -> capture mixed room audio to WAV -> meeting ends (DB status or
# room empty 60s) -> queue cc_transcription_jobs -> faster-whisper small int8 ->
# transcript into cc_meetings -> delete audio. One capture at a time by design
# (global virtual speaker device); a second concurrent meeting stays 'waiting'
# and is picked up if still live when the slot frees.
# Modes: `worker.py` (daemon) | `worker.py bench` (benchmark only, no DB writes).
import os, sys, time, json, wave, threading, traceback, glob, subprocess

import requests

SB   = os.environ.get('SUPABASE_URL', '').rstrip('/')
KEY  = os.environ.get('SUPABASE_SERVICE_KEY', '')
H    = {'apikey': KEY, 'Authorization': 'Bearer ' + KEY, 'Content-Type': 'application/json'}
DATA = '/srv/vyve/transcribe/data'
MODEL_NAME = os.environ.get('WHISPER_MODEL', 'small')
POLL = 15

_daily_key = None
_daily_inited = False
_model = None
capture_state = {'meeting_id': None, 'thread': None, 'db_status': 'live'}


def log(*a):
    print(time.strftime('%H:%M:%S'), *a, flush=True)


def rest(method, path, **kw):
    hdrs = dict(H)
    hdrs.update(kw.pop('headers', {}))
    return requests.request(method, SB + path, headers=hdrs, timeout=30, **kw)


def report_error(context, message, severity='error'):
    try:
        requests.post(SB + '/functions/v1/report-error', json={
            'surface': 'transcribe-worker', 'context': context,
            'severity': severity, 'message': str(message)[:800],
        }, timeout=10)
    except Exception:
        pass


def daily_key():
    global _daily_key
    if _daily_key:
        return _daily_key
    r = rest('POST', '/rest/v1/rpc/get_daily_api_key', json={})
    r.raise_for_status()
    _daily_key = r.json()
    return _daily_key


def mint_bot_token(room_name):
    r = requests.post('https://api.daily.co/v1/meeting-tokens',
                      headers={'Authorization': 'Bearer ' + daily_key()},
                      json={'properties': {'room_name': room_name, 'user_name': 'VYVE Notetaker',
                                           'is_owner': True, 'exp': int(time.time()) + 6 * 3600}},
                      timeout=20)
    r.raise_for_status()
    return r.json()['token']


_speaker = None

def ensure_daily():
    global _daily_inited, _speaker
    from daily import Daily
    if not _daily_inited:
        Daily.init()
        _speaker = Daily.create_speaker_device('vyve-spk', sample_rate=16000, channels=1)
        Daily.select_speaker_device('vyve-spk')
        _daily_inited = True
    return _speaker


class Capture(threading.Thread):
    def __init__(self, meeting):
        super().__init__(daemon=True)
        self.m = meeting
        self.mdir = os.path.join(DATA, meeting['id'])
        os.makedirs(self.mdir, exist_ok=True)
        self.part = len(glob.glob(os.path.join(self.mdir, 'part*.wav'))) + 1
        self.error = None

    def run(self):
        try:
            self._run()
        except Exception as e:
            self.error = e
            log('capture error', self.m['id'], e)
            traceback.print_exc()
            report_error('capture', '%s meeting=%s' % (e, self.m['id']), 'critical')

    def _run(self):
        spk = ensure_daily()
        from daily import Daily, CallClient
        tok = mint_bot_token(self.m['daily_room_name'])
        client = CallClient()
        joined = threading.Event()
        join_err = []

        def on_join(data, error):
            if error:
                join_err.append(error)
            joined.set()

        client.join(self.m['daily_room_url'], meeting_token=tok, completion=on_join)
        if not joined.wait(30) or join_err:
            raise RuntimeError('bot join failed: %s' % (join_err or 'timeout'))
        log('bot joined', self.m['title'], 'part', self.part)

        path = os.path.join(self.mdir, 'part%02d.wav' % self.part)
        wf = wave.open(path, 'wb')
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(16000)
        last_human = time.time()
        last_check = 0.0
        try:
            while True:
                frames = spk.read_frames(1600)  # ~100ms @16k
                if frames:
                    wf.writeframes(frames)
                else:
                    time.sleep(0.05)
                now = time.time()
                if now - last_check > 5:
                    last_check = now
                    try:
                        parts = client.participants()
                        humans = [k for k in parts.keys() if k != 'local']
                        if humans:
                            last_human = now
                    except Exception:
                        pass
                    if capture_state['db_status'] in ('ended', 'cancelled'):
                        log('capture stop: db status', capture_state['db_status'])
                        break
                if now - last_human > 60:
                    log('capture stop: room empty 60s')
                    break
        finally:
            wf.close()
            try:
                client.leave()
            except Exception:
                pass
            try:
                client.release()
            except Exception:
                pass
        log('capture closed', path, os.path.getsize(path), 'bytes')


def patch_meeting(mid, payload):
    rest('PATCH', '/rest/v1/cc_meetings?id=eq.' + mid, json=payload,
         headers={'Prefer': 'return=minimal'})


def finalize_capture(meeting, cancelled, had_error):
    mid = meeting['id']
    parts = sorted(glob.glob(os.path.join(DATA, mid, 'part*.wav')))
    if cancelled:
        for p in parts:
            os.remove(p)
        patch_meeting(mid, {'transcript_status': 'none'})
        return
    # make sure the meeting is marked ended (people may have just left)
    r = rest('GET', '/rest/v1/cc_meetings?id=eq.%s&select=status,transcript_status' % mid)
    row = (r.json() or [{}])[0]
    if row.get('status') == 'live':
        patch_meeting(mid, {'status': 'ended', 'ended_at': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())})
    if not parts:
        patch_meeting(mid, {'transcript_status': 'failed',
                            'transcript_meta': {'error': 'no audio captured'}})
        report_error('capture', 'no audio captured meeting=%s' % mid, 'critical')
        return
    rest('POST', '/rest/v1/cc_transcription_jobs',
         json={'meeting_id': mid, 'audio_path': os.path.join(DATA, mid)},
         headers={'Prefer': 'return=minimal'})
    patch_meeting(mid, {'transcript_status': 'queued'})
    log('queued transcription', mid, len(parts), 'part(s)', 'had_error=%s' % had_error)


def get_model():
    global _model
    if _model is None:
        from faster_whisper import WhisperModel
        log('loading whisper model', MODEL_NAME, '(first run downloads it)')
        _model = WhisperModel(MODEL_NAME, device='cpu', compute_type='int8', cpu_threads=2)
    return _model


def transcribe_parts(parts):
    model = get_model()
    out, total_audio, t0 = [], 0.0, time.time()
    for i, p in enumerate(parts):
        if i > 0:
            out.append('\n— capture resumed (worker restart, a gap may be missing) —\n')
        segments, info = model.transcribe(p, language='en', vad_filter=True, beam_size=1)
        total_audio += float(getattr(info, 'duration', 0) or 0)
        para, para_start = [], None
        for seg in segments:
            if para_start is None:
                para_start = seg.start
            para.append(seg.text.strip())
            if seg.end - para_start > 30 or sum(len(x) for x in para) > 500:
                out.append('[%02d:%02d] %s' % (para_start // 60, para_start % 60, ' '.join(para)))
                para, para_start = [], None
        if para:
            out.append('[%02d:%02d] %s' % (para_start // 60, para_start % 60, ' '.join(para)))
    elapsed = time.time() - t0
    return '\n\n'.join(out).strip(), total_audio, elapsed


def claim_job():
    r = rest('GET', '/rest/v1/cc_transcription_jobs?status=eq.queued&order=created_at&limit=1')
    rows = r.json() or []
    if not rows:
        return None
    job = rows[0]
    r = rest('PATCH', '/rest/v1/cc_transcription_jobs?id=eq.%s&status=eq.queued' % job['id'],
             json={'status': 'running', 'locked_by': 'hetzner', 'locked_at': 'now()',
                   'started_at': 'now()', 'attempts': job.get('attempts', 0) + 1},
             headers={'Prefer': 'return=representation'})
    claimed = r.json() or []
    return claimed[0] if claimed else None  # empty = another worker won the CAS


def run_job(job):
    mid = job['meeting_id']
    parts = sorted(glob.glob(os.path.join(job['audio_path'], 'part*.wav')))
    patch_meeting(mid, {'transcript_status': 'processing'})
    try:
        text, audio_s, wall_s = transcribe_parts(parts)
        status = 'ready' if len(parts) == 1 else 'incomplete'
        patch_meeting(mid, {'transcript': text or '(no speech detected)',
                            'transcript_status': status,
                            'transcript_meta': {'model': MODEL_NAME, 'parts': len(parts),
                                                'audio_seconds': round(audio_s),
                                                'transcribe_seconds': round(wall_s),
                                                'rtf': round(wall_s / audio_s, 2) if audio_s else None}})
        rest('PATCH', '/rest/v1/cc_transcription_jobs?id=eq.' + job['id'],
             json={'status': 'done', 'completed_at': 'now()'}, headers={'Prefer': 'return=minimal'})
        for p in parts:
            os.remove(p)
        log('transcribed', mid, 'audio=%ds wall=%ds' % (audio_s, wall_s))
        # auto-summary (EF calls Claude server-side; non-fatal on failure)
        try:
            r2 = requests.post(SB + '/functions/v1/meeting-summary',
                               headers={'Authorization': 'Bearer ' + KEY, 'Content-Type': 'application/json'},
                               json={'meeting_id': mid}, timeout=90)
            log('summary', mid, r2.status_code)
            if r2.status_code != 200:
                report_error('summary', 'HTTP %s meeting=%s %s' % (r2.status_code, mid, r2.text[:200]))
        except Exception as e:
            report_error('summary', '%s meeting=%s' % (e, mid))
    except Exception as e:
        traceback.print_exc()
        failed_final = job.get('attempts', 0) + 1 >= 3
        rest('PATCH', '/rest/v1/cc_transcription_jobs?id=eq.' + job['id'],
             json={'status': 'error' if failed_final else 'queued', 'error': str(e)[:800]},
             headers={'Prefer': 'return=minimal'})
        if failed_final:
            patch_meeting(mid, {'transcript_status': 'failed', 'transcript_meta': {'error': str(e)[:300]}})
            report_error('transcribe', '%s meeting=%s' % (e, mid), 'critical')


def heartbeat(extra):
    try:
        rest('PATCH', '/rest/v1/transcribe_heartbeat?id=eq.1',
             json={'beat_at': 'now()', 'detail': extra}, headers={'Prefer': 'return=minimal'})
    except Exception:
        pass


def cleanup_old():
    cutoff = time.time() - 7 * 86400
    for p in glob.glob(os.path.join(DATA, '*', 'part*.wav')):
        if os.path.getmtime(p) < cutoff:
            os.remove(p)


def main_loop():
    os.makedirs(DATA, exist_ok=True)
    log('vyve-transcribe up. model=%s' % MODEL_NAME)
    cur = None  # active Capture
    cur_meeting = None
    last_cleanup = 0
    while True:
        try:
            r = rest('GET', '/rest/v1/cc_meetings?select=id,title,status,transcribe,transcript_status,daily_room_name,daily_room_url'
                            '&status=in.(live,ended,cancelled)&order=created_at.desc&limit=25')
            meetings = r.json() or []
            by_id = {m['id']: m for m in meetings}

            if cur is not None:
                mrow = by_id.get(cur_meeting['id'])
                capture_state['db_status'] = (mrow or {}).get('status', 'ended')
                if not cur.is_alive():
                    finalize_capture(cur_meeting,
                                     cancelled=capture_state['db_status'] == 'cancelled',
                                     had_error=cur.error is not None)
                    cur, cur_meeting = None, None

            if cur is None:
                for m in meetings:
                    if m['status'] == 'live' and m['transcribe'] and m['transcript_status'] in ('waiting', 'capturing'):
                        capture_state['db_status'] = 'live'
                        cur_meeting = m
                        cur = Capture(m)
                        patch_meeting(m['id'], {'transcript_status': 'capturing'})
                        cur.start()
                        break

            if cur is None:
                job = claim_job()
                if job:
                    run_job(job)

            heartbeat({'capturing': cur_meeting['id'] if cur_meeting else None})
            if time.time() - last_cleanup > 3600:
                cleanup_old()
                last_cleanup = time.time()
        except Exception as e:
            log('loop error', e)
            traceback.print_exc()
        time.sleep(POLL)


def bench():
    import urllib.request
    os.makedirs('/tmp/vyve-bench', exist_ok=True)
    src = '/tmp/vyve-bench/sample.wav'
    got = False
    for url in ('https://upload.wikimedia.org/wikipedia/commons/2/22/Jfk_berlin_address_high.ogg',
                'https://upload.wikimedia.org/wikipedia/commons/e/ec/Bill_Clinton_-_My_Life_%28audiobook_excerpt%29.ogg'):
        try:
            urllib.request.urlretrieve(url, '/tmp/vyve-bench/src')
            subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', '/tmp/vyve-bench/src',
                            '-t', '180', '-ar', '16000', '-ac', '1', src], check=True)
            got = True
            break
        except Exception as e:
            print('speech sample fetch failed:', e)
    if not got:
        print('falling back to synthetic audio (RTF approximation only)')
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'lavfi',
                        '-i', 'anoisesrc=d=180:c=pink:a=0.3', '-ar', '16000', '-ac', '1', src], check=True)
    t0 = time.time()
    get_model()
    load_s = time.time() - t0
    text, audio_s, wall_s = transcribe_parts([src])
    rtf = wall_s / audio_s if audio_s else 0
    print('\n================ BENCHMARK ================')
    print('model:            %s int8, 2 threads' % MODEL_NAME)
    print('model load:       %.0fs (one-off per worker start)' % load_s)
    print('audio length:     %.0fs' % audio_s)
    print('transcribe time:  %.0fs' % wall_s)
    print('RTF:              %.2f  (a 60-min meeting ≈ %.0f min to transcript)' % (rtf, 60 * rtf))
    print('sample of output: %s' % (text[:300].replace('\n', ' ')))
    print('===========================================')


if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == 'bench':
        bench()
    else:
        if not SB or not KEY:
            print('SUPABASE_URL / SUPABASE_SERVICE_KEY missing from env', file=sys.stderr)
            sys.exit(1)
        main_loop()

PYEOF

echo "-- benchmark (downloads the whisper model ~460MB first time; several minutes)"
set +e
(cd "$BASE" && ./venv/bin/python worker.py bench)
BENCH_RC=$?
set -e
if [ $BENCH_RC -ne 0 ]; then echo "!! benchmark failed — unit NOT enabled; send Dean the output above"; exit 1; fi

echo "-- daily-python import smoke test"
"$BASE/venv/bin/python" -c "from daily import Daily, CallClient; print('   daily-python OK')"

echo "-- systemd unit"
cat > /etc/systemd/system/vyve-transcribe.service <<'UNITEOF'
[Unit]
Description=VYVE meeting capture + transcription worker
After=network-online.target
StartLimitIntervalSec=0

[Service]
Type=simple
EnvironmentFile=/srv/vyve/transcribe/env
WorkingDirectory=/srv/vyve/transcribe
ExecStart=/srv/vyve/transcribe/venv/bin/python /srv/vyve/transcribe/worker.py
Restart=always
RestartSec=10
Nice=19
MemoryHigh=2300M

[Install]
WantedBy=multi-user.target
UNITEOF
systemctl daemon-reload
systemctl enable --now vyve-transcribe
sleep 3
systemctl --no-pager --lines=5 status vyve-transcribe || true
echo "== done. Heartbeat should appear in transcribe_heartbeat within ~15s =="
