# Partner Space — build spec (PM-660, talk-first, 2026-06-22)

> Handoff doc for the Sonnet build session. Dean + Claude mapped the whole partner situation end-to-end this session; **no code shipped here** (Opus/Orbis is the wrong vehicle for building per Dean). This is the decision record + build order. The QC/ingest pipeline is mapped but PARKED — see the Backlog section; it is NOT the first thing.

## What already exists (don't rebuild)

- **Admin monitoring/management:** `vyve-command-centre/partners.html` (PM-630) — pipeline kanban, partner directory, Content & Moderation queue (Approve/Return + Download via `partner-file-url` EF PM-636), onboarding tracker, analytics, revenue ledger. Canonical monolith; the 7 `pages/partner-*.html` are orphans → KILL.
- **Self-serve apply→verify→agreement:** `Test-Site-Finalv3/partner-onboarding.html` (PM-631/632/634/635/656/659) — public no-login, 6 steps (video-modules + education hidden PM-659, dormant in DOM as `ACTIVE=[0,1,2,5,6,7]`), qualifications + references, full executable agreement w/ DocuSign-style e-sign + signed-PDF download, one required "Welcome to VYVE" starter video. `partner-onboarding` EF v4 (public, draft keyed by unguessable `partner_id`).
- **Referral attribution:** stripe-webhook v10 (PM-633) — Stripe coupon ID IS the partner code, 50% rev-share on referred active B2C, monthly `run_partner_payouts`. B2B excluded.
- **8 `partner_*` tables** with RLS, go-live gate trigger, onboarding-pct sync, engagement-segment refresh.
- **Storage:** `partner-docs` (private 15MB), `partner-content` (private 500MB).
- **Live + replay infra:** partner content rides existing `calendar_occurrences` (live) + `replay_videos`/`replay_playlists` (replay) via FK. No parallel pipeline.
- **Push spine (LIVE end-to-end):** native APNs `push-send-native`, `send-push` fan-out, routing (`member_notifications.route`), `scheduled_pushes`, `broadcast_schedules` + `scheduled-push-runner`. Notifications to a new audience shape = new audience resolver, NOT new infra.

## Decisions LOCKED this session

1. **Two gates, not one.**
   - **Gate A — approved as partner** (admin advances pipeline): provisions a web login, partner gets backend access, builds their space, uploads content, drafts sessions. Members can't see any of it yet.
   - **Gate B — approved to go live** (Phil safeguarding/GDPR sign-off — same duty-of-care bar as HAVEN, §23.84): members can discover/join, content becomes visible. **The HELD migration from PM-659 is the Gate B mechanism** (deferred-aware pct + go-live gate skip) — still awaiting Phil + Lewis.
   - Consequence: onboarding partners can proceed NOW; Phil is not a blocker to partners getting started, only to member visibility.

2. **Partner management is WEB-ONLY.** Dean explicitly does not need in-app partner management. Everything partner-facing is a web surface (`is_partner()` CC-slice, Team App pattern PM-639/640). The member app is read-and-join only for partner content — no partner-management affordances in the app.

3. **Money model:** Community join is **FREE** within the app — any *active* member can follow any partner. The payment is the VYVE membership itself (£20 B2C); community access is a benefit of being a paying member. Partner earns via the existing 50% referral attribution only. **No Stripe at the join, no member-facing paywall.** Access still gated on `subscription_status` (§23.85) — a lapsed member is walled from the whole app, communities included, for free.

4. **Live model is simulated-live** (pre-recorded master pushed over RTMP by `vyve-live-runner.py`), not genuinely-live. A partner "going live at 8pm Friday" = upload + slot → `calendar_occurrence` → runner airs at that time → drops to replays after. Genuinely-live (per-partner Riverside) is a v2.

## Priority order (Dean's call this session)

**NEXT-UP build (onboard-partners readiness) — one schema, three deliverables:**
1. Partner web backend (`is_partner()` CC-slice) — Gate A.
2. Member-facing Partner Space (in-app) — Gate B.
3. Community subscription + notifications.

**PARKED to backlog:** the QC/ingest airing pipeline (videos may not even go live yet). Mapped so we know how to order videos for safe content when they arrive — see Backlog.

## NEXT-UP build detail

### Schema — `partner_memberships` is the hinge
Already exists (member↔partner join + engagement segment). It is the pivot for both surfaces:
- Member subscribes (front end) → free `partner_memberships` row.
- Partner posts/pushes (backend) → audience = subscribers of partner X.
Build this join properly and both the customer-facing space and the notification targeting fall out of it. `partner_community_posts` already exists for the feed.

### Deliverable 1 — Partner web backend (`is_partner()` CC-slice)
- New `is_partner()` role on `admin_users` (mirror `is_team()` PM-640) OR partner-specific auth — **decide: extend `admin_users.role` with `partner`, same as `team` was added.** Recommended: extend roles, it's the proven pattern.
- Login provisioned at Gate A (admin pipeline advance → create Supabase Auth user + send credentials). NOT before — keep the public application no-login (PM-632 lesson).
- Partner sees ONLY their own: Account/Profile · My Content (upload to `partner-content` + moderation status) · My Community (post feed notes to `partner_community_posts`, see subscribers, message them, trigger "we're live" nudge) · My Sessions (draft/schedule) · My Earnings (read-only payout ledger).
- All on `admin.vyvehealth.co.uk` behind the role. Heavy back-office (masters, scheduling, payouts) is web because it's not app-shaped.

### Deliverable 2 — Member-facing Partner Space (in-app)
- New in-app surface: discover a partner (who they are, pillar body/mind/connect, rating), see their sessions + content, JOIN (free → `partner_memberships` row).
- Read-and-join only. No management affordances.
- **Visible only after Gate B** (Phil sign-off). Before that, partner exists in backend but is invisible to members.
- Community-scoped sessions live HERE (filtered by `partner_id`), not the global `sessions.html` — see audience scoping below.

### Deliverable 3 — Community subscription + notifications
- Subscribe = free `partner_memberships` row (no checkout).
- Subscribers become a **push audience shape** plugged into the existing live spine — partner triggers notes/messages/"we're live 30-min-before" from their web backend; fan-out via `send-push` to the partner's subscribers.
- New audience resolver shape: `partner_subscribers(partner_id)`. The hard part (encryption, routing, scheduling) is already built.

### Audience scoping (the genuinely new piece, at DISPLAY layer not YouTube)
Broadcasts are already unlisted on one channel; gating is which members are shown the session + handed the link.
- `calendar_occurrences`: add `visibility` (`public` | `community`) + `partner_id` (nullable FK).
- Member-facing session reads (`sessions.html`, home live slot, `*-live.html`, replays) filter: show if `public`, OR `community` AND member in `partner_memberships` for that `partner_id`.
- This is also the guardrail against the Team-App-scheduler footgun (a bad `calendar_occurrences` row showing on every member's list) — community sessions never touch the global list by construction.

## Gate mechanics
- **Gate A:** admin advances pipeline (`partner_partners.status` → `onboarding`) → provision `is_partner()` login + send credentials.
- **Gate B:** `trg_assert_partner_golive` + the PM-659 HELD migration (deferred-aware) — blocks `status→live` until safeguarding_passed AND gdpr_passed (Phil) AND pct=100. Members see partner only at `live`.

## Applicable §23 rules for the build
- §23.122 — `partner_content_items.moderation_status` must be set `in_review` not `draft` or it's invisible to the admin queue.
- §23.85 — community access inherits the `subscription_status` gate; don't re-implement.
- §23.84 — Gate B is the same duty-of-care bar as HAVEN.
- §23.121 — CC modals use `document.body.appendChild` to escape flex stacking.
- §23.123 — marketing-site pages carry their own tokens, not portal theme tokens (only relevant if any partner surface lands on Test-Site).
- Push: §23.69/§23.70 — every notification carries a route; APNs live, FCM/Android stores token but no banner yet.

---

## BACKLOG (PARKED — mapped, not next)

### QC / ingest airing pipeline
When partner videos start arriving, this is how we order them for safe content. Design target: **Dean does minimum work — exception-only.**

- **Watcher on Dean's Mac** (launchd agent in `~/vyve-live` next to the runner, TCC-safe §23.89; Python 3.9-safe §23.88). Polls for submissions that have a slot + cleared moderation. Per submission, unattended: download master to `masters/` under runner naming → extract audio → transcribe → run transcript against VYVE rubric → ffmpeg-probe video → grab a few frames → write the `calendar_occurrence` at the requested time.
- **QC is transcript-first + mechanical, NOT "AI watches the video":**
  1. Transcribe audio (Whisper or hosted) — pennies for 45 min.
  2. Content QC on transcript vs VYVE rubric (safeguarding red-flags §23.84, tone/brand, delivers-what-title-promises, crisis-adjacent). Text LLM call, trivial cost. **This is the load-bearing check — the real risk is text, not video.**
  3. Video QC mechanical via ffmpeg (already on the box): resolution, bitrate, duration-matches-claim, audio present/not-silent/not-clipping, black-frame, loudness. Catches ~90% of "unusable" without a model watching.
  4. Optional cheap visual spot-check: ffmpeg grabs stills every few min → vision model (Gemini or Claude) on those FRAMES only. Catches "camera at the ceiling." Deliberately small; never the flaky centrepiece.
- **Exception-only human gate:** clean → auto-promote to scheduled, FYI Dean can ignore. Flagged → hold, one notification with the specific flag + transcript snippet, Dean taps approve/reject (~10s). Phil's per-partner sign-off is Gate B (once per partner, front-loaded onto onboarding) — after that, that partner's clean videos flow untouched.
- **Why the download is permanent:** runner pushes a LOCAL master over RTMP; it can't stream from Storage. The clean long-term exit is teaching the runner to fetch from Storage (deletes the download) — bigger build, not v1.
- **Caveat:** watcher inherits the runner's single-point-of-failure (only runs while Mac is awake; the PM-658 watchdog covers airing, not ingest). Always-on box is a when-Dean-is-full-time thing.

### YouTube channel / key model for partner scaling
- **Current reality (corrects the "channel per thing" memory):** ONE channel "VYVE" (`UCuptZFgSk0ZmNnE2IbYBdtg`), **9 reusable RTMP stream keys** (concurrency lanes, one broadcast each at a time) + **8 category playlists** (post-air buckets; replay pages split by playlist, not by key). Keys aren't category-bound; playlists are. Runner resolves a key's ingest URL live (`liveStreams.list part=cdn`); keys not stored in Supabase. Each key currently paired to a Riverside studio — only matters for genuinely-live; irrelevant for pre-recorded partner masters.
- **15 partners is NOT a key/channel problem** — it's slot allocation. They reuse the 9 keys across the day; ceiling is 9 simultaneous broadcasts. Add more keys (free) if ever needed. New logic = a no-double-book concurrency check at schedule/ingest time.
- **DECISION leaning two-channel:** a separate "VYVE Partners" channel for blast-radius isolation (partner content is least-controlled + safeguarding-risk surface), clean playlist namespace, independent quota. Costs: a second OAuth (new client/secret/refresh token, same Testing-mode expiry), runner becomes channel-aware (a `channel` column + branch, not a rewrite), token-health/keepalive cover two channels. If doing it, build the runner channel-aware from the start — painful to retrofit. Replay mirror reads partner-channel playlists into the same `replay_videos`/`replay_playlists` tagged `partner_id`; one "Partners" playlist as source, app filters by partner.

### Google OAuth verification — HARD DEPENDENCY when partner streaming goes live
- **Token is NOT fully fixed.** `youtube-token-health` (daily 4am) only *warns*; `youtube-token-keepalive` (daily) is quietly re-exercising the token (why Dean hasn't manually refreshed). Underlying issue live: consent screen still in Google **"Testing" mode** (~7-day refresh-token expiry), implicated in the PM-658 4-day outage.
- **Fix = push consent screen through Google verification** — removes Testing-mode expiry entirely. Promote from someday to hard dependency the moment partner streaming is on the table: a stopped token then takes down partner commitments to their communities, not just our own schedule. A second partner channel DOUBLES the rotation chore until verified — so verification is a dependency of the two-channel decision too.


## Workstream 4 — Claude-driven audited admin actions (PM-660 addendum)

Dean wants to run the pipeline from chat: ask "has anyone applied?", get an answer, say "approve them," and have Claude execute — with permission. Split by risk:

**Read half — ALREADY LIVE, zero build.** Everything is in Supabase; Claude queries `partner_*` (and `members`) directly via the Supabase MCP. "Has anyone applied to be a partner / member?" is answerable now. Proven PM-660: 3 partner rows (all Dean test runs, `declined`), 52 members. Agree a small status vocabulary so answers are consistent (applied=`status='applied'`, pipeline=vetting→contract, live=cleared Gate B).

**Write half — needs a thin AUDITED action surface, graduated by risk. Build this; do NOT let Claude run raw ad-hoc SQL writes against partner/member tables.**
- **Low-risk / reversible (Claude does on say-so):** advance pipeline stage applied→vetting→interview→contract, log note, request-more-info. Nothing member-facing. Writes `admin_audit_log`.
- **Gate A — provision login (explicit confirm):** Claude states the effect (creates `is_partner()` auth user + sends credentials) before running. Audited.
- **Gate B — go live to members (HARD RULE, high risk):** Claude MUST confirm safeguarding_passed AND gdpr_passed are actually recorded (Phil) before advancing `status→live`, and refuse + report if not — a casual in-chat "approve" must never flip a partner live without the duty-of-care gate (§23.84). The `trg_assert_partner_golive` trigger is the DB backstop; Claude is the conversational guard in front of it.
- Every write action lands in `admin_audit_log` (who approved what, when) — the audit trail is the guardrail, not Claude's judgement alone.

**Generalise:** same pattern applies to members (approve / comp / flag is_test / expire) and much of the admin console. Frame as "a small audited admin-action toolset Claude drives," partners as first consumer — not partner-only. Implementation options for Sonnet: (a) an MCP/EF action layer Claude calls, or (b) Claude drives existing admin EFs (`admin-member-edit` etc. already audit to `admin_audit_log`) — prefer reusing the audited EF pattern over new raw-write paths.

---
*Spec authored PM-660 (2026-06-22). Build in Sonnet. Gate A/B gating + free-join money model + web-only partner mgmt + simulated-live are LOCKED. Channel model + QC pipeline are PARKED backlog with leanings recorded.*
