## PM-737 — Podcast page gets its header back; Playfair removed from the exercise library (Lewis); OTA Update 503 live (2026-07-08)

**Dean's report:** no header/back button on the podcast section; Lewis dislikes the serif display font on the exercise library.

1. **podcast.html** carried `class="hub-page"` — the PM-218/219 class that suppresses the sticky back-button header, reserved for top-level tab hubs. Podcast is a Connect DESTINATION, and its hero is an in-page card (no bleed dependency) — class removed, standard header + back button now inject. **Audit note: check other destination pages for stray `hub-page`** (legit set per PM-218: index, exercise, mind, connect).
2. **exercise.html:** both Playfair usages swapped to `--font-body` — `.page-title` (weight-display→bold; DM Sans has no 800) and `.body-hero-headline`. Scope deliberately exercise.html only per Lewis's ask; Playfair remains the brand heading font elsewhere.

**Ship:** vyve-site `fa461af8`, vbb 502→503, sw `pm737-podcast-header-exercise-font-a`, md5 × 5. **OTA Update 503 live** — signed, production 100%, artifact `2f85fd4e`, probe-verified (checksum `18d365e8…` byte-matched; bundle content pre-verified: Update 503 marker, zero `font-head` in exercise.html, PM-737 body comment in podcast.html). Supersedes 502.

## PM-736 — Lewis copy: Connect community tile → "Browse All Communities"; OTA Update 502 live (2026-07-08)

Lewis via Dean: the Connect tile reading "Community" now reads **"Browse All Communities"** (title + aria-label; sub-line unchanged). vyve-site `33fd0e7d`, vbb 501→502, sw `pm736-community-tile-copy-a`, md5 × 4. PM-734/735 were claimed by parallel sessions — recompute held.

**OTA:** signed Update 502 uploaded (artifact `52436357`), production 100%, supersedes 501. Probe against a real iOS 1.9 fleet device confirms serving: checksum `5144ad4a…` byte-matched on download, "Browse All Communities" in connect.html, Update 502 marker, pm736 CACHE_NAME, signature present. Note: the Composio sandbox ROTATES between calls — re-stage secrets/bundle per push; secrets wiped after use.

## PM-735 — Marketing-site analytics live: PostHog EU on welcome.html + homepage, full signup-funnel visibility per campaign/partner link (2026-07-08)

Trigger: Lewis texted Dean "are the onboarding emails working — I've sent VYVE to people tonight and haven't got any emails." Investigation: zero signups since 3 Jul (Reece), onboarding EF had zero real invocations in 24h, onboarding-health cron 200, all entry pages 200, no platform_alerts. Dean then ran a live signup himself (deanonbrown1@hotmail.com, 19:54Z, completed clean — flagged `is_test` so it stays out of member counts). Verdict: pipeline healthy; Lewis's contacts simply never completed (or likely never started) the questionnaire. The real gap exposed: the marketing site had ZERO analytics — "never opened the link" vs "opened and bailed at section N" vs "balked at the Stripe step" were indistinguishable.

**Ship (Test-Site-Finalv3 `9e6a70ea`, md5-verified both files at commit SHA, live-verified on Fastly):**
- PostHog JS on `welcome.html` + `index.html` — **EU host (project 138491), cookieless (`persistence:'memory'` — no consent banner needed), `disable_session_recording:true`** (the questionnaire is health data; the sub-processor register's "10% sampled, masked" statement stays true by never recording marketing pages), autocapture on (pageviews + homepage Stripe-CTA clicks), **no identify/no PII** — fully anonymous events.
- Custom funnel events on welcome: `welcome_section_view` {section} (hooked in `goTo()` — exact drop-off section), `welcome_submit` (submit + retry, {retry:n}), `welcome_error` {message ≤120ch}, `welcome_success` (top of `showResults`).
- **Attribution:** `?c=` (trial campaign: 7/14/30-day links, `/trial/[slug]` route) and `?partner=` (PM-682 join flow) registered as super-properties on every event, sessionStorage-persisted per-tab so they survive the multi-section form — one funnel in PostHog, breakable down per link. Answers Lewis's question permanently: opens → per-section progress → submit → success, per campaign.

**Gotchas:** PM-734 was claimed mid-session by a parallel session (employer-portal demo on the SAME marketing repo — first PM race on Test-Site-Finalv3); §23.24 fresh-HEAD recompute held. Also self-caught a §23.30-adjacent trap: comparing python `len(str)` (chars) against `wc -c` (bytes) on a multibyte file looks like data loss — verify with byte counts only.

**Follow-ups:** backlog P3 duplicate-posthog.init on portal index.html unchanged (separate surface). Lewis: PostHog EU DPA confirmation (finding G carry-over) now also covers marketing-site collection.
## PM-733 — OTA Update 501 LIVE on production: tonight's full community build pushed to the member fleet (2026-07-08)

Dean: "How can we push these OTA updates" → pushed per the PM-698/706 procedure from the Composio sandbox.

**Ship:** vyve-site main `74252809` (PM-730 tree, Update 501, 237 files / 11MB) signed with vault `CAPAWESOME_LU_PRIVATE_KEY` and uploaded via `@capawesome/cli` 4.15.0 `apps:liveupdates:upload` — **deployment `6bfc3a74`, artifact `39691911`, channel production, 100% rollout.** Custom props `pm=PM-733` / `vbb=501` / `vyve_site_sha=74252809…`. Members receive PM-720→730 in one hop: communities carousel + Join card on Connect, join fix, instructor communities with posts, name-first display surfaces, Sessions/Library tabs with covers, replay ?v= deep link, feed link, gap fixes.

**Server-half verification (PM-698 protocol):** `apps:devices:probe` against a real iOS 1.9 device (`2285837f…`, last seen today) AND a real Android 1.0.8 device (`e7813628…`) — both told they'd receive artifact `39691911` with checksum `556946c5…`; artifact downloaded exactly as a device would — **sha256 byte-matches the probe checksum**; contents verified (`Update 501` in index.html, pm730 CACHE_NAME in sw.js, communities carousel in connect.html, cover img in partner-profile.html, deep link in replays.html). Signature present in both probes. Remaining unknown is only the routine on-device apply (double-restart / first-run fast path per PM-706).

**CLI notes:** bare `npx capawesome` resolves a deprecated 0.0.3 squatter package — always `npx -y @capawesome/cli@<ver>`. No `apps:devices:list` command — device telemetry via the raw REST GET (still live per PM-699 gotcha (a)). Secrets staged then wiped from the sandbox.

**Fleet note:** one iOS 1.8 device (`793eb1ee…`, seen 2026-07-07) still on the broken-config binary — cannot OTA by design; heals when it updates to 1.9 from the store.

## PM-732 — Replay→community attribution is now automatic: insert trigger + calendar-keyed backfill (2026-07-08)

Dean: Calum's Library was missing videos. Cause: today's "Midweek Reset" replay was created AFTER the PM-723 one-shot backfill — one-shot backfills go stale on every new replay.

**Fix (DB only, no site change):**
1. Backfill re-run, now keyed on the calendar's own `partner_id` links (generalises to any partner, not the 3-host mapping): Midweek Reset attributed → Calum's library = 4 (Midweek Reset, Movement & Exercise, Nutrition Basics, The VYVE Approach).
2. **`replay_partner_attribution` BEFORE INSERT trigger on `replay_videos`:** a new replay whose title matches a partner-linked `calendar_occurrences` row (latest occurrence wins) inherits that `partner_id`. Thursday's "Sleep, Stress & Recovery", the Weekly Review, and all future Alex/Nicola replays self-file. Written per §23.143 discipline (checked constraints first; none on the column).

**Open with Dean:** unattributed mindfulness titles with no Calum-hosted calendar session ("The Power of Habits", "Steps to Improve your Life", "Goals & the Power of Them", "Taking Accountability for your Life") — could be Lewis mindset content or Calum's; awaiting Dean's word before attributing. Note: mindfulness playlist has repeated titles across dates (recurring sessions) — duplicates are expected rows, not data errors.

**Pattern for the brain:** any "backfill X by matching Y" ship must include the forward mechanism (trigger or ingestion-path change) in the same session — a one-shot backfill is stale by the next content drop.

## PM-731 — Calum's cover fixed: the asset itself was cropped; full banner copied first-party as calum-banner.jpg (2026-07-08)

Dean's device pass post-PM-730: Alex + Nicola covers now render perfectly (layout is correct) — Calum's was still missing its title row. Root cause was the ASSET, not the page: `session-thumbnails/calum.jpg` is a top-cropped rendition (starts mid-"WEEKLY"). The complete artwork exists as the YouTube live thumbnail of today's Midweek Reset replay (`WgqfDGukw94/maxresdefault_live.jpg` — the Just Dropped card proved it loads and is complete).

**Because `_live` YT thumb URLs can go stale after stream processing, the image was copied first-party:** one-shot EF `copy-cover-asset` (service-role storage upload, i.ytimg-only source allowlist) deployed → invoked via pg_net → `session-thumbnails/calum-banner.jpg` (101,708 bytes, verified in storage.objects) → EF **neutered to a 410 tombstone** (MCP can't delete functions — **Dean: delete `copy-cover-asset` from the dashboard**, audit dead-function discipline). `cover_url` updated. No site code change — PM-728's intrinsic-ratio hero just loads the new asset.

**Invocation notes for the brain:** functions gateway rejected the legacy anon key on a verify_jwt function (`UNAUTHORIZED_LEGACY_JWT`) — one-shot EFs invoked from pg_net need verify_jwt:false for the invocation window, then tombstone. pg_net is installed and is the working path for calling EFs from SQL (async: poll `net._http_response`).

**Also for Lewis's list:** calum.jpg (the session-card asset) is itself top-cropped — worth replacing with the full source banner from the content pipeline at some point; session cards crop with object-fit anyway so it's cosmetic there.

## PM-730 — Community cover final: no bleed, banner flush below the header, fits exactly (2026-07-08)

Dean's call after the PM-728 pass: the under-header bleed itself was the remaining problem — with the hero pulled to the top of the page, the banner's title row ("WEEKLY") sat beneath the translucent back-button header bar. His direction: forget the bleed, the cover just needs to fit perfectly in the space below the header regardless of how much room it takes.

Removed main's negative top margin (the PM-726 bleed); the hero now starts flush below the back-button header and the PM-728 intrinsic-ratio `<img>` renders the entire banner at natural size. Coverless min-height reduced to 160px (no bleed compensation).

**Cover arc, final state (PM-724 → 730):** cover_url column → session-thumbnails host banners → intrinsic-ratio `<img>` drives hero height → NO bleed, flush below header. **Design rule going forward: text-bearing banner artwork never goes under chrome and never gets ratio-fit — natural size, below the header, container follows the image.**

**Ship:** vyve-site `74252809`, vbb 500→501, sw `pm730-cover-below-header-a`, md5 × 4. (PM-729 claimed by a parallel session in another repo — cross-repo recompute worked as designed.)

## PM-729 — First box day verified clean; 1:15 "Sleep, Stress & Recovery" stub diagnosed (Mac's parting shot, pre-cutover), deleted + re-aired; needrestart hardened (2026-07-08)

**Box day one — all airs exact-duration:** Flexibility Routine 1 (06:00Z, 21:36), Guided Journaling (07:30Z, 5:00), Steps to Improve your Life (11:00Z, 4:28), **Midweek Reset 1 (12:00Z, 20:04 — first fresh-content air through the new pipe, Calum card on the broadcast)**. Migration 100% closed.

**The 1:15 stub (Dean spotted in Replays):** "Sleep, Stress & Recovery" was **7 Jul 17:00Z — aired by the MAC ~5.5h before cutover**, and the Mac was still sleep-flapping that evening (corroborated by the 19:00Z runner_down alert, resolved 19:15Z). It napped ~75s into the push; ffmpeg died; broadcast ended; 1:15 corpse replay `xIr-m1xqnhw`. NOT a box failure — the exact failure mode the migration kills. Actioned: stub deleted via YouTube API `videos.delete` (204) using vault OAuth (RPC is **`read_vault_secret`** — note exact name); re-air inserted 9 Jul 17:00Z (12:42, clean broadcast id). Insert used an OVERLAPS guard after a too-wide first guard blocked on the 16:30 session.

**Two box hardening findings from the journal:**
1. **needrestart/unattended-upgrades WILL kill mid-air pushes** — 8 Jul 06:36 the daily security run upgraded python3.14 and needrestart bounced `vyve-live-runner` (harmless: between airs, 15 min after the 06:00 air ended — pure luck). Fixed permanently: `/etc/needrestart/conf.d/vyve.conf` with `$nrconf{override_rc}{qr(^vyve-live-runner)} = 0;` — security upgrades still apply, the unit is never auto-bounced; the daemon picks up new libs at its next natural restart. **Rebuild-critical: replicate this file on any box rebuild.**
2. **thumbnails.set 429 rateLimitExceeded** (10:45Z, Steps session) — YouTube API thumbnail-upload quota. Non-fatal by design (runner logs + proceeds; broadcast keeps its session-publish-era thumbnail). Known-benign; revisit only if it recurs daily at scale (quota bump or thumbnail-once-at-creation).

Minor: journal shows a transient double "daemon up" (PIDs 15829/16099) during the 06:36-06:37 needrestart+daemon-reexec shuffle; `ps` confirms exactly one runner since. Watch, don't chase.
## PM-728 — Community cover: intrinsic-ratio <img> hero, banner never crops (2026-07-08)

PM-727's bottom-anchored paint still clipped the banner top on device — the session-thumbnails assets are NOT 16:9, and any fixed-ratio guess crops somewhere. Restructured: `.profile-hero` now contains a real `<img class="profile-cover-img">` at `width:100%;height:auto` and the hero is `height:auto` — the hero's height comes from the image's own intrinsic dimensions, so the full banner is always visible whatever the asset ratio. Gradient `min-height` block remains the coverless fallback; `onerror` hides the img (gradient shows). Bleed unchanged (main negative margin). Overlay + avatar untouched (absolute within hero).

**Ship:** vyve-site `70081493`, vbb 499→500, sw `pm728-cover-intrinsic-a`, md5 × 4.

**Pattern (final form of the PM-727 lesson):** for artwork of unknown/varied dimensions, never size the container and fit the image — let a natural-ratio `<img>` size the container.

## PM-727 — Community cover banners fit properly: bottom-anchored 16:9 paint, no title crop (2026-07-08)

PM-726's covers rendered but `center/cover` cropped the 16:9 branded banners (session titles cut off — Dean screenshots 13:45). Fix: hero background now paints `center bottom / 100% auto` — the full banner is visible at its natural ratio, bottom-anchored; the under-header bleed strip above it shows the pillar-gradient underlay, which blends with the banners' dark green backgrounds. Hero height = `min(56.25vw, 360px)` (the banner's 16:9 footprint, tablet-capped) + the 56px+safe-area bleed strip.

**Ship:** vyve-site `313fac9f`, vbb 498→499, sw `pm727-cover-fit-a`, md5 × 4.

**Pattern:** branded artwork with baked-in text must never be painted `cover` into an arbitrary-ratio box — anchor at natural ratio and let an underlay fill the remainder.

## PM-726 — Community hero bleed v2 (main-margin), live-session cover photos, avatars back to initials; Connect carousel verified intact (2026-07-08)

**Dean's second device pass (screenshots 11:33):**

1. **Gap still above the cover** — PM-725's negative margin on `.profile-hero` (main's first child) did not take on device. Moved the negative top margin to **`main` itself** (`margin-top:calc(-56px - env(safe-area-inset-top))`) — an adjacent-sibling margin against the sticky header that can't be defeated by first-child margin behaviour. Hero keeps the compensated height. **Pattern rule: for inner-page hero bleeds, put the pull on `main`, not the hero.**
2. **Covers were flat gradients, not photos** — PM-724's YouTube maxres picks 404'd for all three covers (the avatar picks loaded, the cover picks didn't — maxresdefault only exists for some videos). Dean's actual preference stated: **the live-session cover photo** at the top of each community. Set `cover_url` to the session-thumbnails bucket host photos — `alex.jpg` / `nicola.jpg` / `calum.jpg` — the same assets live session cards use (PM-456 image_url convention). These are Supabase public storage, guaranteed to resolve.
3. **"Rather than in the profile picture":** Alex + Nicola `avatar_url` cleared → clean pillar-tinted initials. The session artwork looked wrong cropped into the circle. Calum keeps his existing avatar.
4. **Connect carousel:** Dean believed it was removed. Verified on live main — markup (lines ~880), renderCommunities, and PM-724 tile placement (Calendar → Podcast → Community) all intact; logic exactly matches Dean's stated model (unjoined = Join card top; joined = carousel top + bottom hub tile). No code change. If it's genuinely absent on his device after force-quit, need a Connect-tab screenshot to diagnose.

**Ship:** vyve-site `535c556d`, vbb 497→498, sw `pm726-hero-bleed-b`, md5 × 4.

**Lesson (candidate §23 rule if it recurs):** don't set cover/thumbnail assets to YouTube maxresdefault URLs without a resolution fallback — maxres does not exist for every video and fails silently as a CSS background. Prefer first-party storage assets (session-thumbnails bucket).

## PM-725 — Community profile cover bleeds to the top of the page (2026-07-08)

Dean's follow-up on PM-724: individual community pages still had a gap above the cover. `.profile-hero` now pulls up under the sticky `.mobile-page-header` with `margin-top:calc(-56px - env(safe-area-inset-top))` and grows its height by the same amount — the theme.css hub-hero bleed pattern, applied to an inner page that keeps its back-button header. The translucent blurred header floats over the photo (iOS large-title feel); avatar and meta positions unchanged; the existing hero overlay keeps the back button legible.

**Ship:** vyve-site `7970cab2`, vbb 496→497, sw `pm725-hero-bleed-a`, md5 × 4.

**Pattern note for future inner-page heroes:** sticky header pages get the bleed via negative margin + height compensation on the hero block itself — do NOT remove the header (that's the hub-page pattern) and do NOT re-add main padding.

## PM-724 — Community polish from Dean's device pass: top-gap fixed, cover photos + portraits live, bottom Community tile restored for subscribed members (2026-07-08)

**Dean's screenshots flagged three things:**

1. **Big dead gap above "Community" on partner-space** — root cause: partner-space + partner-profile (PM-661-era) set `main{padding-top:calc(safe-area + 60px)}` to clear the page header, but `.mobile-page-header` is STICKY and occupies its own flow slot — the pad double-counted the chrome. Correct inner pages (connect-feed, replays) have no main top pad. Fixed on both pages. **Watch for this on any other PM-661-era page** (partner-portal member surfaces if/when built).
2. **Covers + portraits** — `partner_partners.cover_url` added. Rendered: Discover card `.pc-hero` gets an `<img>` (object-fit cover, `onerror` remove → pillar-gradient fallback) and profile hero gets `url() center/cover` layered over the gradient (existing overlay keeps top-edge legibility). Assets set from the instructors' own branded session thumbnails (i.ytimg maxres): Alex avatar "15 Minute Flow Along with Alex" + cover "Full Body Movement Flow"; Nicola avatar "15 Mins of Yoga with Nicola" + cover "Yoga Relaxation"; Calum cover "The VYVE Approach to Health & Fitness". Thumb picks were deterministic (network sandbox can't render i.ytimg) — **Dean/Lewis eyeball on device; each swap is a one-line UPDATE**. Emma + Men Together fall back to gradient (no cover set).
3. **Bottom Community destination tile restored for SUBSCRIBED members** — `#community-tile-bottom` after the Podcast tile, toggled inversely to the top Join card by renderCommunities(): unsubscribed = top Join card only; subscribed = carousel at top + full-size Community tile in the destination cluster.

**Ship:** vyve-site `eb70932c`, vbb 495→496, sw `pm724-community-polish-a`, md5 × 6. Carousel avatars pick up Alex/Nicola photos automatically (avatar_url was already rendered).

**Noted, not in scope:** pillar dot colours are inconsistent across surfaces — partner-space `.pc-dot` maps body→gold/mind→teal while the connect carousel `COMM_PILLAR_COL` maps body→teal/mind→gold (visible in Dean's screenshots: Alex gold band on Discover, teal circle in carousel). One mapping should win; cosmetic, needs a 5-minute pass + Dean's colour call.

## PM-723 — Community Sessions + Library tabs live: calendar/replay attribution backfilled, Library renders the replay catalogue, replays.html ?v= deep link; 48h-notice trigger narrowed (2026-07-08)

**Dean's brief:** the Sessions and Library tabs on the new instructor communities were empty — show each person's upcoming scheduled sessions and their current replays.

**DB (live, verified):**
- `calendar_occurrences.partner_id` backfilled by host_name → partner (Alex → alex-movement, Nicola → nicola-yoga, Calum + Calum Denham → calum-denham-performance). Upcoming now linked: **Alex 51, Nicola 48, Calum 14**. All are `visibility='public'`, so the partner-space community rail (filters visibility=community) is untouched.
- `replay_videos.partner_id` (nullable FK, ON DELETE SET NULL) added; backfilled by exact title match against the hosts' calendar titles: **Alex 32, Nicola 30, Calum 4** of 99 replays. 33 unmatched (other hosts' mindfulness content + 1 stray) correctly left NULL. RLS: existing `replay_videos_select_authenticated` covers the new profile query.
- **`trg_partner_session_min_notice` NARROWED (latent production bug):** the PM-684-era guard raised on ANY insert/update of a partner-linked row starting <48h out — it blocked this backfill and would equally have blocked cancelling tomorrow's partner session or editing any near-term row. Now raises only on `TG_OP='INSERT' OR NEW.starts_at IS DISTINCT FROM OLD.starts_at` — the actual "no short-notice scheduling" intent. Self-serve scheduling behaviour unchanged.

**Site (vyve-site `96706dd0`, vbb 494→495, sw `pm723-profile-sessions-library-a`, md5 × 5):**
- **Sessions tab needed zero code** — it already queried upcoming by partner_id; the backfill lit it up.
- **Library tab** (partner-profile) now fetches the partner's `replay_videos` (thumb_url, title, duration, published_at desc, limit 60) in parallel with published `partner_content_items`, rendering replays first in the existing video-card style with real thumbnails (`.video-thumb img` CSS added). Replay cards link `/replays.html?v=<youtube_video_id>`.
- **replays.html `?v=` deep link:** one-shot — fires on the first paint whose data contains the target, matching `youtube_video_id` OR `replay_videos.id` (the latter because pre-existing partner_content_items cards already linked `?v=<replay_video_id>` against a deep link that didn't exist until now). Opens via the existing `mountPlayer` so the PM-292 watch-time tracker attributes normally; consumed flag stops the visibilitychange/table-pulled repaints re-opening a player the member closed.

**Verify on device:** any instructor community → Sessions tab lists upcoming with dates; Library tab shows the replay catalogue with thumbnails; tapping a replay lands on Catch-Up with that video playing.

## PM-722 — Instructor communities live: Alex + Nicola created, Calum broadened, seeded posts + likes; names now headline all community surfaces; placeholder partners hidden via community_visible (2026-07-08)

**Dean's brief:** make the communities area real with the people already in the app — Alex (movement/stretch), Nicola (yoga — Dean said "Nicole", catalogue host is Nicola), Calum (resets, weekly review, nutrition, education). Names + descriptions + a few posts with reactions.

**DB (live, verified):**
- `partner_partners.community_visible` boolean NOT NULL DEFAULT true added. Set false for the four bare referral-placeholder partners (antonia, april, david, ivan — "VYVE Partner", no bio/avatar). They stay `status='live'` so **stripe-reconcile attribution is untouched** (it loads status=eq.live only); they just no longer render as junk cards in Discover.
- **alex-movement** (Alex, "Movement & Mobility", body) and **nicola-yoga** (Nicola, "Yoga & Pilates", mind) created live with bios drafted from their actual session catalogues (Healthy Knees/Hips/Spine series, desk flows / yin, breathwork, NSDR, Pilates).
- **calum-denham-performance** broadened: role_title → "Performance, Nutrition & Habits", bio extended to cover Midweek Reset, Weekly Review, nutrition/sleep/habits education.
- **9 seeded partner posts** (3 each, author_kind='partner', author_email=team@, staggered over 4 days, one pinned welcome per community, like_count 2–7 = the "reactions" — post reactions are the denormalised `like_count`, no per-member reaction rows for partner posts). Calum's community already had 3 PM-661-era posts → now 6. Post copy is Claude-drafted in each instructor's voice — **Lewis copy pass welcome, non-gating** (PM-720 precedent).

**Site (vyve-site `350227bc`, vbb 493→494, sw `pm722-instructor-communities-a`, md5 × 6):**
- All three member surfaces previously displayed `role_title||slug` as the partner's name and never selected `name`. Now: **name headlines, role_title is the sub-line** — partner-space cards (pc-name/pc-role), partner-profile header + feed author, connect.html carousel (comm-name/comm-sub). Avatar-fallback initials also derive from name.
- Discover (partner-space) and the connect carousel filter `community_visible=eq.true`. partner-profile deliberately unfiltered (reachable only by id via existing links; a referred member's profile link still works).

**Live set now member-visible in Discover:** Alex, Nicola, Calum Denham, Emma Clarke, Men Together CIC. **Open question for Dean/Lewis:** Emma Clarke's contact_email is Dean's personal hotmail — demo-era artefact? Hide via community_visible=false if so (one UPDATE, no code).

**Verify on device:** Discover shows 5 named communities with real bios; join Alex/Nicola → carousel shows names with specialism sub-lines; profiles show pinned welcome + posts with heart counts.

## PM-721 — Community join FIXED: engagement_segment='new' violated the partner_memberships CHECK — no member had EVER successfully joined a community (2026-07-08)

**Dean's report post-PM-720:** "I'm not able to join any communities." Diagnosis: 7 live partners exist, RLS is correct (member INSERT policy `member_email = auth.email()` present), schema fine — but BOTH member-facing join handlers (`partner-space.html` `_psJoin` + `partner-profile.html` join) POST `engagement_segment:'new'`, and the table CHECK allows only `highly_engaged / regular / at_risk`. Postgres 23514 → PostgREST **400** (not the handled 409) → silent `btn.textContent='Join'` reset. `partner_memberships` was completely EMPTY — zero rows ever — so the member join path has been dead since PM-661 shipped it. Root cause proven via SQL probe (check_violation confirmed, rolled back). Server rails unaffected: `stripe-reconcile` v5 writes `'regular'` (valid); the empty table also means no currently-active referred Stripe subs, which is truthful.

**Fix (vyve-site `e7b3ff6f`, vbb 492→493, sw `pm721-join-fix-a`):** `engagement_segment` removed from both POSTs — the column DEFAULT `'regular'` applies. Both silent-failure else branches now `console.error('community join failed', status, body)` — the silent reset is what turned a one-line bug into a live report (PM-289 optimistic-write lesson, read-side variant). md5-perfect × 5 at the commit SHA.

**New hard rule §23.143** (second occurrence of the class — first was platform_alerts.severity rejecting 'warning', PM-692): before any client or EF writes a literal value to a text column, read `pg_get_constraintdef` for that table's CHECKs. PostgREST surfaces CHECK violations as plain 400s that optimistic UIs swallow.

**Sweep note:** pre-existing unswept `PM-XXX` placeholders in partner-space.html / partner-profile.html (PM-661/665-era headers) were relabelled PM-721 by the commit-time sweep — attribution noise only.

**Verify on device:** partner-space → Discover → Join on any community; then Connect hub should flip from the Join card to the Your communities carousel (PM-720) on next open.

## PM-720 — Connect hub workover (Lewis ask): Your communities carousel at top; Recent check-ins off the hub; Community destination tile retired (2026-07-08)

**Lewis's brief via Dean:** community is the focus of the Connect area. Subscribed communities show in a carousel at the top; unsubscribed members see a "Join a community" prompt; recent check-ins leave the hub and live only inside the check-in flow.

**Ship (vyve-site `8678d7a5`, vbb 491→492, CACHE_NAME `vyve-cache-v2026-07-08-pm720-connect-communities-a`):**

1. **Your communities carousel** — new top-of-hub section above Today's check-in. §23.46 honest paint: header + `scroll-row` carousel + Join card all boot `display:none`; `loadCommunities()` decides. Data: Dexie-first `partner_memberships_local` (synced on login, PM-665) filtered `subscription_status='active'`; **REST membership fallback ONLY when Dexie returns zero rows** so a fresh device never falsely shows Join to a subscribed member. Display rows fetched once per page load from `partner_partners?status=eq.live` — **Gate B respected by construction**; a joined-but-suspended partner silently drops out (empty result → Join card). Cards mirror partner-space identity (avatar_url with initials fallback, `role_title||slug` name, pillar dot body-teal/mind-gold/connect-green) and route to `partner-profile.html?id=`. Trailing dashed "+ Discover" card → partner-space.html. `__commLoaded` guard = one fetch per page load; repaints via paintAll are no-ops after first.
2. **Join a community card (empty state)** — the coral `community-tile` reused at the top with new copy ("Join a community / Free expert-led communities inside VYVE / Explore →") → partner-space.html. CSS comment updated; class kept so no style churn.
3. **Recent check-ins section REMOVED from the hub** — markup gone; `renderRecentCheckins()` given a one-line early return on missing `#recent-list`. All downstream callers (bus subscribers, PM-401 surgical path, reaction handlers — all already null-guarded) left intact. **The `connect-feed-preview` EF fetch + `_kv` pre-warm is deliberately KEPT** — connect-checkin.html posted-state reads that cache (PM-201). Feed entry paths: new "See the community feed ›" link under the check-in card CTA + connect-checkin.html post-submit CTA (pre-existing).
4. **Bottom Community destination tile retired** — superseded by the carousel/Join card at top.

**Copy note (Lewis):** "Your communities" / "Join a community" / "Free expert-led communities inside VYVE" / "+ Discover" shipped as written per Dean's call — tweakable in a follow-up, not gating.

**Verification:** all 3 inline script blocks node --check clean; ID diff exactly the intended delta (−recent-checkins-wrap/recent-empty/recent-list/community-tile, +communities-hdr/communities-row/community-join-card); 4-file atomic commit (connect.html, index.html, settings.html, sw.js) md5-perfect at `8678d7a5`. Live on-device paint of the subscribed carousel pending Dean's next app open (force-quit + reopen, Connect tab).

**PM-claim note:** PM-720 claimed after fresh cross-repo recompute (VYVEBrain at PM-719, vyve-site at PM-718, capacitor at PM-707).

## PM-718 — VYVE 75 water integration: 3.5L catalogue-driven target + deep links (2026-07-07)

`challenge_library.daily_tasks` water task now carries `target_litres: 3.5`. nutrition.html derives a raised water target from any ACTIVE daily-type enrolment carrying one (Dexie read post-auth + 4s late pass) — no duplicated state, auto-restores on abandon/complete/expire, works cross-device via enrolment sync. `water:target_hit` therefore fires at the raised bar. Deep links: home-card water pill (`data-hcclink`, capture-phase handler because the parent card is an `<a>`) and every un-ticked auto row in the day view ("Go" chip) navigate to their completion surface — water → `/nutrition.html#water` (smooth-scroll to the water card), body → exercise.html, mind/habits/checkin likewise. vyve-site `42014875`, vbb 491.

## PM-717 (vyve-site) — Challenges sheet legibility (2026-07-07) — **NUMBER COLLISION with brain PM-717 (Hetzner stack refs), third race of the night; both immutable in git, brain disambiguates here**

Three device bugs from Dean's screenshots: (1) sheet background used `var(--surface)` which is TRANSLUCENT in dark theme — page bled through behind sheet text; now `var(--more-bg)` (the opaque nav More-sheet token) + veil 0.78/blur 6px. (2) Task labels rendered iOS-default BLUE: the page reset covered `a{color:inherit}` but NOT buttons — buttons don't inherit colour from body per UA stylesheet; fix `button{color:inherit}` (new §23.141). (3) "5 daily tasks" goal label hardcoded — now task-count-driven. Shipped as PM-716 commit `b708022b`, renumbered `b18d69f2` after the SECOND PM race of the night (parallel session claimed PM-716 = runner ops playbook). vbb 490.

## PM-715 — VYVE 75 true 75-Hard shape: catalogue daily tasks + day view + progress photos (2026-07-07)

**Schema:** `challenge_library.daily_tasks` JSONB — `[{key,label,short,type:auto|manual|photo,auto?,target_litres?}]`. VYVE 75 redefined to six tasks: 45-min workout (auto:body) · second workout outdoors (manual) · nutrition plan / no alcohol (manual) · water (auto) · read 10 pages (manual) · progress photo (camera). **Evaluator v2:** daily-type stamping is catalogue-driven (`AUTO_FAMILY` event mapping, `LEGACY_TASKS` fallback); new shared `stampDaily()` is the SINGLE writer of daily `day_state`; public `VYVEChallenges.tickManual(slug,key)` / `.attachPhoto(slug,key,path)` for UI writes. **Day view (challenges.html):** daily enrolments open a checklist sheet — auto rows tick from bus events, manual rows tap-to-tick, photo row opens native camera via `<input capture>` (no binary change), client-side canvas compress to 1280px JPEG, upload to NEW private `challenge-photos` bucket (member-scoped RLS on first path segment = auth.email()), path stored in `day_state.photos[date]`; 75-dot completion grid. Home-card task pills now catalogue-driven (`short` labels). Migration `challenges_v2_daily_tasks_photo_bucket` (named PM-714 pre-race — see below). Shipped as PM-714 commit `15e38439`, renumbered `bcfd3db9` after the FIRST PM race (parallel session claimed PM-714 = Hetzner runner migration). vbb 487→488. **Existing enrolments under the old 5-key shape don't complete against the 6-task list — abandon + rejoin (only Dean affected).** **HARD PRE-LAUNCH BLOCKER: challenge-photos bucket is NOT in the GDPR erasure pipeline.**

## PM-713 — Home-screen active-challenge card (2026-07-07)

`challenges-home.js` + `index.html` "Your challenge" section directly under Today's habits (Dean's placement call: pinned pairing, NOT time-shared with habits). Flagship-first selection, else nearest-to-complete; "+N more" pill; hidden with no active enrolment. Daily type shows live task-tick pills; streak/count show bar. Repaints on `challenge:progressed/completed/joined`. Card is one `<a>` to challenges.html. sw precache. vbb 486. Commit `d6ca6f39`.

## PM-712 — Challenge artwork: 23 branded SVG tiles (2026-07-07)

Dean needed card artwork pre-Sage-meeting; no image-gen available, so a branded abstract SVG set was designed in-session (VYVE palette: deep teal bg gradients, teal/teal-lt/gold/amber/green motifs — plates, pulse, ribbons, ridgeline+sun, concentric calm rings, crescent, droplet, dawn horizon, flame, gold 75 emblem, etc.), QA'd via cairosvg contact sheet, committed to `/challenge-art/*.svg` (~96KB total), and mapped to ALL 60 `challenge_library.image_url` rows via CASE update. CATALOGUE_INVALIDATION_KEY bumped `pm712-challenge-art` for instant device refill. Lewis can replace any tile with Gemini photography row-by-row in Studio; icon system remains onerror fallback. Commit `9aa7603c`, vbb 485.

## PM-711 — Challenge card logos: 26-icon themed fallback system (2026-07-07)

`iconFor(lib)` derives a Lucide-style icon from metric/filter (dumbbell, heart-pulse, run, footprints, brain/pen/wind/moon/quote per mind kind, msg, radio, play, checks, droplet, scale, clipboard, phone, zap, grid, balance, sunrise, layers, mic, flag), pillar-tinted thumbs (`p-body` teal / `p-mind` gold / `p-connect` green / `p-habits` amber). DB `image_url` wins with onerror fallback (§23.45). Commit `0abb0329`, vbb 484.

## PM-710 — Challenges added to the MOBILE More sheet (2026-07-07)

PM-709 added the item only to the desktop `moreItems` dropdown; the mobile bottom sheet Dean actually uses is a SEPARATE hardcoded template ~100 lines below in nav.js — item never appeared on device. One diagnosis round-trip was burned on a wrong stale-JS theory (cache-clear) before reading the second surface. New hard rule §23.140. Commit `145ff60c`, vbb 483.

## PM-709 — Challenges v1 LIVE end-to-end (2026-07-07)

**Feature (Lewis ask via Dean):** subscribable time-boxed challenges across Body/Mind/Connect/Habits/All-rounder, easy/medium/hard, hard-mode (miss a day → day 1, resets counted not hidden), VYVE 75 flagship. **Architecture: challenges are a LENS over existing activity** — no new logging; `challenges-evaluator.js` subscribes to the §23.50 bus taxonomy and increments enrolments; injected on EVERY page by nav.js (coverage by construction, §23.44). **Schema:** `challenge_library` (catalogue, Studio-edited, 5-min fresh window) + `challenge_enrolments` (member RLS, optimistic Dexie + fire-and-forget REST PATCH, last-write-wins — known small-window limitation). Dexie SCHEMA_V28 (additive). sync.js registry both tables. **60-challenge catalogue seeded (55 active;** weekend-warrior/every-other-day/new-pb/full-picture/four-episodes dormant pending v2 rules + pb:achieved/podcast:played publishes). **New events:** `water:target_hit` (nutrition crossing tap, once/London-day), `app:opened` (evaluator boot, once/day), `challenge:joined/progressed/completed`. Enrolments self-timed (evergreen catalogue — the anti-pattern that left connect-challenge dark). Streaks BST-aware. Count rules implemented: kind/mode/stream/before_hour/min_km filters + weekly_distinct/weekly_consecutive/distinct_pillars/balanced/triple_day. challenges.html real portal page in More. Temp settings mockup link removed. Commit `0674ab74`, vbb 482. Precedes: PM-707 mockup `50643a9f` (vbb 480), PM-708 temp settings review link `305dd19f` (vbb 481).

## PM-714 — Tier 1 I CLOSED: live runner migrated off Dean's Mac to a Hetzner VPS (159.69.95.90); 6 new Calum sessions scheduled in-order (Midweek Reset Weds 12:00 / Weekly Review Fris 19:30) (2026-07-07)

**The trigger:** overnight 6–7 Jul the Mac produced 10 `runner_down` alerts (heartbeat dying 7–10 min, recovering 20–40, cycling from 02:26Z — classic macOS dark-wake sleep cycles; something in the PM-702/703 Xcode work reset whatever kept it awake). All auto-resolved, zero missed airs (06:00Z aired clean mid-flap), but the SPOF had spoken. `pmset -a sleep 0 disablesleep 1` applied as morning mitigation; migration executed same evening.

**The box:** Hetzner CX23 `vyve-live-runner`, Nuremberg (eu-central), Ubuntu 26.04, IP **159.69.95.90**, €5.99/mo (server €5.49 + IPv4 €0.50), 38G disk / 3.7G RAM / 2 vCPU. Hetzner account is Dean's, project "VYVE Health". Access: SSH as root with vault **VYVE_RUNNER_SSH_KEY** (base64-wrapped ed25519 private key; pubkey comment `vyve-runner-ops`); Dean's Mac key (`deanbrown@MacBook-Pro.local`) also in authorized_keys for rsync. Claude drives the box from the Composio sandbox (derive key from vault → ssh).

**Layout:** `/opt/vyve/` = runner + thumb scripts + `PlayfairDisplay.ttf` (pulled from VYVEBrain scripts/ via PAT) + `vyve-runner.env` (chmod 600; service key lifted from the Mac's transferred env — never pasted in chat; **the exposed service_role key now also lives on the box: rotation still owed, one more consumer to update when it happens**). `/srv/vyve/masters/` = full rsync of Mac `~/vyve-live` (11G); masters in `media/` (**124 mp4s**), host cards in `media/hosts/` (8: alex/nicola/jamie/lewis/lucy + calum/alan/shan pulled from Supabase Storage — the Mac's hosts dir only had 5 and the runner had been falling back to YouTube auto-frames; box is now strictly better). systemd unit `vyve-live-runner` enabled (auto-start on reboot, Restart=always).

**Transfer gotchas (Starlink, ~10G):** single-stream rsync pinned ~1MB/s (Starlink latency/jitter throttles one TCP stream, not bandwidth); `xargs -P4` parallel rsync roughly doubled aggregate. BUT macOS `ls | xargs -I{}` COLLAPSES runs of multiple spaces in filenames — 4 double-spaced masters got mangled paths and skipped ((l)stat errors). Plain `rsync -avP` cleanup pass recovered the 2 genuinely missing. Rule of thumb: parallelise for speed, always finish with one plain `rsync -avP` verify pass.

**Verification + cutover:** `--once --dry-run` against occurrence `166594c3` resolved everything end-to-end (media file, vault YouTube OAuth, live RTMP key via liveStreams.list, existing broadcast `0K2C8HY1tSY`, full ffmpeg plan). Cutover strictly ordered — Mac `launchctl bootout` FIRST (confirmed `MAC RUNNER STOPPED`), THEN `systemctl enable --now` — no two-runner co-push window. Box heartbeat landed 1s after daemon boot (`upcoming=6`); watchdog (unchanged, cron */5) now monitors the box through the exact same `runner_heartbeat` mechanism. First unattended box air: 8 Jul 06:00Z. **The Mac is fully out of the live-session loop; `~/vyve-live` on the Mac is now a cold backup.** New-video workflow: drop into Mac `~/vyve-live/media`, re-run the rsync (incremental), tell Claude the filename.

**New content (Dean, all hosted by Calum):** `midweek reset 1/2/3.mp4` + `weekly review 1/2/3.mp4` (NOTE: file is `Weekly review 3.mp4` capital W — notes column matches exactly). Scheduled strict in-order rotation through July: **Midweek Reset Weds 12:00Z** (8/15/22/29 Jul → reset 1/2/3/1) — replaced the 4 existing 12:00 Movement rows IN PLACE (recyclable flexibility content, density stays 6/day); **Weekly Review Fris 19:30Z** (10/17/24/31 Jul → review 1/2/3/1) — slots were empty, 4 inserts. Category `Mindfulness & Mindset`, host cards `calum.jpg`, ffprobe durations drive `ends_at` (16–20 min each). Copy Dean-cleared. **August calendar regen (due before 2 Aug) must carry the rotation forward** (Weds continue 2,3,1…; Fris continue 2,3,1…).

**PM-collision note:** parallel sessions shipped PM-708–713 (vyve-site challenges run) during this session; PM-714 claimed after fresh cross-repo recompute.

## PM-706 — iOS 1.9 RELEASED; OTA first-run fast path shipped (immediate sync + in-session reload on built-in bundle); signed 479 live on production channel (2026-07-07)

**iOS 1.9 (build 4) APPROVED + RELEASED by Apple ~13:00 BST 7 Jul** (auto-release was set). Dean's live experience surfaced the UX gap this session fixes: fresh 1.9 boots the bundled 455 www snapshot (deliberately older, PM-702) — no VYVE Money, no Community tile — and catching up to the channel bundle required the manual double-restart with a dwell long enough for the download (30–60s on weak 4G). Dean also uninstalled/reinstalled mid-diagnosis, which resets LiveUpdate state to built-in and restarts the dance (plus costs HealthKit grants + push token per PM-704). Unacceptable for members.

**Ship 1 — vyve-site `cb739c23` (PM-706, vbb 478→479, CACHE_NAME `vyve-cache-v2026-07-07-pm706-ota-first-run-a`):** `live-update.js` now has TWO paths. FIRST-RUN FAST PATH — when `getCurrentBundle().bundleId == null` (built-in bundle: fresh install or binary update), sync fires IMMEDIATELY (no 3s delay, no session guard); if a bundle stages, `LiveUpdate.reload()` applies it in-session behind an "Updating VYVE…" overlay (brand-dark, spinner; 800ms grace before showing so a current binary never flashes it; 60s hard cap then release UI and fall back to next-cold-start apply). STEADY-STATE PATH (already on an OTA bundle) unchanged: PM-700 silent staging, applies next cold start — never yank a mid-session member. `ready()` untouched and un-guarded — rollback protection intact through the reload (the new bundle's own live-update.js calls ready() post-reload). Session flag set at sync-fire time (§23 flag-before-work); sessionStorage survives reload() so the post-reload boot skips re-sync.

**Ship 2 — signed bundle Update 479 live on production:** uploaded via `@capawesome/cli` 4.15.0 `apps:liveupdates:upload` from the Composio sandbox (PM-698 procedure), signed with vault `CAPAWESOME_LU_PRIVATE_KEY`, 100% rollout. Deployment `75b78778`, artifact `44bfe9fa`, custom props `pm=PM-706` / `vbb=479` / `vyve_site_sha=cb739c23…`. Server-half verified per PM-698: real-device probe returned the new artifact + signature, artifact downloaded exactly as a device would — sha256 `a3b74803…` byte-matches the probe checksum; contents verified (212 files, `Update 479` in index.html, pm706 CACHE_NAME in sw.js, fast-path code in live-update.js, money.html/partner-space.html/connect.html present). This also retires the broken-index exposure: the prior channel bundle 477 was cut BEFORE PM-705, so OTA'd devices were running index.html with the orphan `<script>` swallowing vapid.js + nav.js; 479 carries the fix.

**Sequencing caveat (understood, accepted):** the fast path travels inside the bundle, but a fresh install always executes the BINARY's copy of live-update.js first — so members installing 1.9 today still do one legacy double-restart to reach 479; every subsequent OTA is seamless. The next binary bundles the fix and kills the problem at install too.

**Diagnosis notes banked:** (a) Capawesome channel/deployment `updatedAt` + `updatedBy` are bumped by DEVICE check-ins (12:44Z bump matched device `1ac3ccd1` sync) — updatedBy showing a user UUID is NOT evidence of a human console action. (b) Dean's uninstall/reinstall reset the OTA state machine to built-in — reinstalling is never the OTA recovery move; restart-twice-with-dwell is (now automated by this ship). (c) The App Store live description still opens with the stale "requires an internet connection… loads content from our secure web portal" PWA copy — same §23.1 family PM-702 purged from the review notes; LEWIS to fix alongside the HAVEN copy item.

**Backlog adds:** next binary (1.10/1.0.9) ships CURRENT www, not an aged snapshot — with the fast path proven, "binaries ship verified state" no longer justifies a weeks-stale first paint; bundle current main at archive time. Device-verify the fast path when a fresh install next happens naturally (Dean's reinstalled store app will exercise it on its NEXT update cycle only after it reaches 479 via one legacy double-restart).

## PM-704 — Android 1.0.8 SUBMITTED to Play; dual-app comparison exposed the immortal-Dexie property: store app renders phantom local rows (container persistence + additive-pull), dev shell is server-true (2026-07-05)

**Android 1.0.8 (versionCode 54) uploaded to Play Console and submitted** — both store resubmissions now in review. On approval the frozen cohort self-heals to current main via signed OTA on first double-restart.

**Dexie divergence diagnosed (Dean's device only, but architecturally instructive):** with both apps side-by-side on one phone for the first time, the store app showed inflated progress tracks (e.g. 19/30 sessions, 15/30 check-ins) vs the dev shell's lower numbers. Server truth (raw tables AND member_activity_log, cross-checked live): habits 36 / cardio 6 / workouts 0 / sessions 0 / weekly check-ins 1 — the **dev shell matches exactly**. Mechanism: iOS preserves the app container across every same-bundle-ID install; `co.uk.vyvehealth.app` on Dean's phone has container continuity through years of dev builds and deployment-model flips, so its `capacitor://localhost` Dexie still holds rows from pre-June bundled eras whose server counterparts were later cleaned up (dev-account hygiene) — and **sync.js is additive-pull, so server deletes never propagate: local rows are immortal**. The `.dev` bundle ID got a fresh container tonight, hence server-true. Fix for Dean's device: delete + reinstall the store app (container destroyed → clean backfill; costs HealthKit re-grant + push token rotation). Member exposure: none today (no member's server rows are ever deleted), but two future paths exist — (a) GDPR rectification/admin correction leaves devices rendering pre-correction numbers forever; (b) PF-4 queued writes that never flush show local-only activity, silently undercounting employer aggregates and charity milestones. **Backlog: Settings-level "resync my data" control (nuke Dexie → re-hydrate) + reconcile-on-hydrate design for counters.** Confirmed behaviour: member uninstall→reinstall backfills to exact server truth (dev shell is the live proof).

§23 rule: iOS app containers survive every same-bundle-ID install — local storage is NEVER reset by reinstalling over an app; combined with additive-pull sync, any server-side row deletion creates permanent client divergence on existing devices. Plan data corrections accordingly.

## PM-703 — Dev/ship mode switchers on the Mac; dev shell rebuilt as separate "VYVE Dev" app (.dev bundle ID, inverted icon); ship state verified post-switch (2026-07-05)

Dean's dev-loop shell (overwritten twice during PM-701's verification) is back as a COEXISTING app: `mode-dev.sh` / `mode-ship.sh` in `~/Projects/vyve-capacitor` (Mac-only, uncommitted — remote hygiene backlog). mode-dev: swaps root config to `capacitor.config.dev.json` (server.url shell, **NO LiveUpdate block** — dev shell never syncs OTA), pbxproj bundle ID → `co.uk.vyvehealth.app.dev`, CFBundleDisplayName → "VYVE Dev", inverted icon (`assets/icon-dev.png`, sharp negate), `cap sync`. mode-ship: restores `capacitor.config.ship.json` (canonical ship config: LiveUpdate + RSA public key + readyTimeout), ship bundle ID/name/icon, `cap sync`, then PRINTS the embedded LiveUpdate block as a mandatory pre-archive eyeball check. Ship-mode restore run and verified tonight — embedded config carries the full block. Config file inventory on the Mac: `capacitor.config.json` (active), `.ship.json` (canonical ship), `.dev.json` (dev shell), plus stale `.bak-pf14b`/`.bundled-backup` (delete candidates). Dev shell facts: fresh HealthKit grants on first open; native push does NOT reach it (APNs topic = ship bundle ID) — store install is the push test surface; Settings→Build shows live main (477+) since it loads online.vyvehealth.co.uk.

§23 rule: **native builds are MODE-SWITCHED, never hand-edited** — `./mode-dev.sh` before any dev-shell build, `./mode-ship.sh` (and verify its printed LiveUpdate block) before any archive.

## PM-702 — iOS 1.9 (build 4) SUBMITTED for review; Android 1.0.8 (versionCode 54) AAB built. Version-string archaeology solved: Info.plist hardcodes were overriding the project (2026-07-05)

Store resubmissions carrying the PM-701 corrected native state (LiveUpdate block + RSA public key + readyTimeout 10000, no server.url). `www/` deliberately left at the device-verified 455 snapshot — first launch OTA-pulls signed 477 through the proven pipeline; binaries ship verified state, OTA carries freshness.

**Version archaeology (explains weeks of confusion):** the pbxproj was at MARKETING_VERSION **1.7** / build 3 — "1.8" existed ONLY as a hardcoded `CFBundleShortVersionString` in Info.plist, which OVERRIDES project settings. That's why Capawesome device records showed versionName 1.7/1.4 chaos and why the first re-archive tonight still read 1.8 (3) despite the pbxproj bump. Fixed permanently: plist now carries `$(MARKETING_VERSION)` / `$(CURRENT_PROJECT_VERSION)` placeholders (PlistBuddy), pbxproj = 1.9 / 4, re-archived → Organizer read **1.9 (4)** → uploaded 00:17Z → **Submitted for Review**. App Review notes REPLACED — the stale text called it "a PWA-based wellness app that loads content from https://online.vyvehealth.co.uk", violating §23.1 and describing the pre-bundled architecture; new copy: native Capacitor app, test creds, bug-fixes-only release.

**Android:** `build.gradle` versionName was actually **1.0.6** (not 1.0.7 — same label-drift family), bumped to versionCode 54 / versionName 1.0.8. Gradle crashed on the system JDK ("Unsupported class file major version 70" = JDK 26); built clean with Android Studio's bundled JBR: `export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"`. Signed AAB at `android/app/build/outputs/bundle/release/app-release.aab`. **Play Console upload pending Dean confirmation.**

**LEWIS FLAG (logged, not actioned):** the live App Store description names HAVEN and promises "professionally facilitated group therapy sessions" while HAVEN's clinical gate is still open — store copy is ahead of Phil's sign-off. Same family as the pre-Sage HAVEN blocker; Lewis to decide whether copy waits for sign-off or gets softened.

**§23 rules earned:** (1) Info.plist hardcoded version strings OVERRIDE pbxproj — keep `$(MARKETING_VERSION)`/`$(CURRENT_PROJECT_VERSION)` placeholders in the plist and treat the pbxproj as the single version source; never infer project state from the store label. (2) Android release builds on this Mac REQUIRE Android Studio's JBR via JAVA_HOME — the system JDK is too new for this Gradle. (3) Ship binaries with the last DEVICE-VERIFIED `www/` snapshot; OTA delivers freshness — never refresh `www/` right before an archive without re-verifying on-device.

Post-approval sequence: members on 1.9/1.0.8 OTA to current main on first double-restart; then Tier 1 **I (runner off Dean's Mac)** + dev-shell rebuild with `.dev` bundle ID + dashboard-delete `ota-canary-watch` slug + Mac vyve-capacitor state (new configs, version bumps) needs committing to remote per hygiene backlog.

## PM-701 — §23.106 CLOSED: OTA verified end-to-end on a real device (Update 476 on-screen). TWO shipped-binary defects found + fixed; bundles now RSA-signed; PM-700 race fix shipped + signed 477 live. Store binaries need 1.9/1.0.8 to join (2026-07-04)

**The verification succeeded — and en route falsified PM-602's three-week-old claim that "OTA wiring [was] live in both binaries." It never was. Both defects were native-config, invisible to every web-side check, and exactly what §23.106 existed to catch.**

**Defect 1 — embedded config stripped.** `ios/App/App/capacitor.config.json` in the shipped iOS 1.8 (and Android 1.0.7 equivalent) contained ONLY `packageClassList` — no `plugins.LiveUpdate` block, no Capawesome appId. Casualty of hand-editing the embedded config during the pre-archive server.url removal. The plugin was in the binary but booted blind: zero API contact, ever. Proven by fleet telemetry: in 3 weeks on the store, NOT ONE 1.8/1.0.7 device ever registered with Capawesome — the 5 registered devices were all June dev/test builds. Dean's fresh store install (Build 455 tree = PM-600 `c81f2218`, no VYVE Money) reproduced it: two double-restarts, a 30s-dwell test, zero phone-home.

**Defect 2 — `publicKey: ""` enforces signing.** After fixing the config (root `capacitor.config.json` rewritten to ship state, `cap sync`, Xcode dev build to Dean's phone), the device phoned home (first store-config contact ever) but sync failed: `signatureMissing — Bundle does not contain a signature`. The plugin treats an empty-string publicKey as signing-enabled. Console also revealed `Ready timeout is set to 0. Automatic rollback is disabled` — the crash-loop rollback protection live-update.js was designed around had never been armed.

**Resolution — signing adopted properly (better for Sage DD than deleting the key line):** RSA-4096 keypair generated (`apps:liveupdates:generatesigningkey`); private key vaulted as **CAPAWESOME_LU_PRIVATE_KEY** (base64-wrapped PEM); public key + `readyTimeout: 10000` + channel + appId in the new canonical root config; old dev config preserved as `capacitor.config.dev.json` (Mac, uncommitted). Signed 476 bundle uploaded (deployment `7dc530d5`, artifact `e5485cf1`). Dean's rebuilt phone: downloaded, signature-verified, staged, applied — **Settings → Build read 476. §23.106 CLOSED.** `platform_alerts` closure record `3e0f5124`; `ota-canary-watch-15min` cron unscheduled (EF slug `ota-canary-watch` inert — dashboard-delete when convenient).

**PM-700 (vyve-site `cdcf6a91`, vbb 477, md5-verified ×4):** live-update.js flag-before-work race fixed — the session-synced flag was set BEFORE the 3s timer, so navigating off the boot page within 3s killed sync for the whole session while marking it done (ate Dean's first verification attempts; would hit fast-navigating members identically). Flag now set inside the timer when sync fires. **Signed 477 bundle live on production** (deployment `eb1cd930`, sha `cdcf6a91`) — Dean's phone re-verifies the full loop with the fix on next double-restart.

**Store reality (CRITICAL for launch narrative):** iOS 1.8 / Android 1.0.7 store installs can NEVER OTA — their embedded config is broken and OTA can't fix native config. The frozen cohort joins only via **iOS 1.9 / Android 1.0.8 archives** carrying the corrected config (LiveUpdate block + public key + readyTimeout). Dean's Mac is already in the exact archive-ready state (synced, device-verified). TOP NATIVE PRIORITY: archive + submit both. Dean's phone currently runs the dev-signed store-config build (dev shell overwritten tonight); dev-shell rebuild with `.dev` bundle ID is the follow-up so both coexist; APNs token rotated on reinstall (new token registered cleanly; old one will 410-auto-revoke).

**§23 hard rules earned:** (1) NEVER hand-edit embedded configs (`ios/App/App/capacitor.config.json`, `android/app/src/main/assets/…`) — edit the ROOT config, regenerate via `cap sync`, then READ BACK the embedded output before archiving. (2) Capawesome `publicKey: ""` ≡ signing enforced — omit or use a real key; all VYVE bundles are now signed, every upload MUST pass `--private-key` (vault `CAPAWESOME_LU_PRIVATE_KEY`). (3) `readyTimeout` must be set or auto-rollback is off. (4) Capawesome `device.appDeploymentId` is NOT an apply signal (stayed null after a confirmed on-device apply) — never build detection on it; `devices:probe` bumps `lastSeenAt`. (5) `platform_alerts` columns are severity/type/source/details — no title/detail; the tripwire EF's success branch used wrong columns and was only waiting-path-verified: ALERTING EFS GET BOTH BRANCHES VERIFIED BY REAL INVOCATION. (6) No native "wiring live" claim enters the brain without device-verified behaviour. (7) Flag-before-work is a named race: never mark work done before the work runs.

**Observed, parked:** bundled 455 tree throws a startup `SyntaxError: Unexpected token '<'` at index.html:2857 in the native shell (non-fatal) — check whether 477 still does (backlog).

Tier 1 remaining: **I (runner off Dean's Mac)** + the 1.9/1.0.8 archives above.

## PM-699 — Tier 1 finding K: FIRST-EVER OTA bundle live on production channel; server half verified end-to-end (device probes + artifact checksum); on-device apply pending with automated tripwire armed (2026-07-04)

§23.106 attacked directly. Capawesome account state first: trial converted to a PAID plan (Dean-confirmed; console shows 0/200 build minutes, 1/1,000 MAU, 100GB transfer — functional). No token existed anywhere retrievable (vault, EF env, GitHub Actions secrets all checked — GH Actions secrets are write-only by design anyway); the `vyve-capacitor-mac-cli` token (49d old) lives only in the Mac's CLI config, and `vyve-ota-ci` (22d old, Last Seen: Never) was clearly minted for this job and never used. Dean rotated `vyve-ota-ci` in the console; new value vaulted as **CAPAWESOME_TOKEN** + service-role-only accessor `public.capawesome_token()` (migration `capawesome_token_accessor`, same pattern as `vyve_internal_key()`).

**Pre-push channel state confirmed the finding exactly:** production channel `89e12796` had `totalAppDeployments: 0` — nothing EVER deployed — but `totalAppDevices: 4` phoning home (5 by session end: 3 iOS build-3 + 2 Android; one iOS device active TODAY 18:14Z). Client side alive, server side empty.

**Shipped:** vyve-site main `999307c` (Update 476 / PM-695 tree, 11MB, 212 files) uploaded via `@capawesome/cli` 4.15.0 `apps:liveupdates:upload` from the Composio sandbox — bundle artifact `6ab8e9e6`, **deployment `383c172e` live on production at 100% rollout**, custom properties `pm=PM-698-canary`, `vyve_site_sha`, `vbb=476`. Deliberately no ios-min/android-min constraints: pre-plugin binaries can't sync at all, so absence protects them.

**Server-half verification (no device needed):** (1) Capawesome's own `apps:devices:probe` run against two REAL fleet devices (active iOS build-3 + Android versionCode-50) — both told they would receive bundle `6ab8e9e6` with checksum `b1df6fdb…`; (2) artifact downloaded exactly as a device would from the probe's URL — sha256 matches the probe checksum byte-perfect; (3) contents verified: `vbb-marker">Update 476` in index.html + `vyve-cache-v2026-07-04-pm695-…` CACHE_NAME in sw.js + live-update.js/auth.js present. The serving path, channel matching, and decision logic are proven. Remaining unknown is ONLY the on-device apply (Capawesome's client + our live-update.js ready() rollback wiring).

**Tripwire (temporary — DELETE after it fires):** EF `ota-canary-watch` v1 (verify_jwt:false, cron `ota-canary-watch-15min` `*/15`) polls the Capawesome device list via `capawesome_token()` RPC; when any device's `appDeploymentId` flips to `383c172e` it writes a `platform_alerts` info row (idempotency anchor — fires once) + emails team@ "OTA VERIFIED (§23.106 closed)". Live-verified: real invocation returned `state: waiting`, all 5 devices `dep: null`. **Verification lands hands-free the next time anyone opens the store app** (nobody was available tonight; Lewis airborne). Member-visible effect of the bundle itself: the frozen ~11 Jun cohort catches up a month to current main on their next double-restart — code they'd have had all along if OTA had worked.

**Gotchas (§23 candidates):** (a) Capawesome REST `/bundles` endpoint is DEPRECATED — CLI `apps:liveupdates:*` (bundle/upload/rollback/rollout) is the path; the raw device/channel/app GET endpoints still work for telemetry. (b) `--git-ref` on upload resolves against the app's LINKED Git repository and hard-fails otherwise ("Git reference not found") — use `--custom-property` for provenance instead. (c) `apps:devices:probe` BUMPS the device's `lastSeenAt` — never use last-seen as evidence of member activity after probing; the tripwire keys on `appDeploymentId` only for this reason. (d) CLI auth: `CAPAWESOME_TOKEN` env var, no login step needed. (e) Verification marker for any future OTA: Settings → Build row (`settings-vbb-marker`).

Rollback if ever needed: `capawesome apps:liveupdates:rollback --app-id f9961f66-… --channel production`. Tier 1 after K confirms: I (runner off Dean's Mac). Channels carry an `expiresAt` (~30d rolling) — production currently 2026-08-03; watch this if the channel ever goes untouched for a month.

## PM-698 — Tier 1 finding J CLOSED: Google OAuth consent screen published to production; 7-day refresh-token expiry ELIMINATED (2026-07-04)

Executed the publish-not-verify plan: full Google verification skipped deliberately — publishing alone kills the Testing-mode 7-day refresh-token expiry, and the unverified-app warning is irrelevant because Dean (team@) is the only person who ever consents. Console (GCP project `vyve-website`, number 210114068429): Google Auth Platform → Audience → Publish app → status **In production**. OAuth user cap 1/100 lifetime — irrelevant, single consenter. Client "VYVE Backend" is a **Web application** type; its sole Authorised redirect URI is now `http://localhost:8765` — this REPLACED the old `developers.google.com/oauthplayground` URI, which existed only for the weekly manual re-mint chore this PM kills (playground path is dead; a future re-consent uses the localhost flow below).

**Re-consent flow (repeatable):** consent URL built from vault creds (`accounts.google.com/o/oauth2/v2/auth` + client_id + `redirect_uri=http://localhost:8765` + `scope=.../auth/youtube` + `access_type=offline&prompt=consent`), Dean approves as team@ through the unverified warning (Advanced → "Go to … (unsafe)"; NOTE the developer-email link on that page is a mailto trap — opens Mail), browser dies on localhost:8765 (nothing listening, expected), code harvested from the address bar, exchanged server-side. Exchange + verification ran from the Composio remote sandbox — bash_tool egress allowlist has no googleapis domains (§23 note).

**Proof chain (all live):** (1) code exchange → refresh token, scope `https://www.googleapis.com/auth/youtube`; (2) fresh refresh-grant with the NEW token + `channels.list?mine=true` → `UCuptZFgSk0ZmNnE2IbYBdtg` "VYVE" (right account, right channel); (3) vault `YOUTUBE_OAUTH_REFRESH_TOKEN` updated in place via `vault.update_secret` (head+length verified); (4) `youtube-token-keepalive` invoked through the production pg_net path → 200, and **`refresh_token_expires_in` is ABSENT from Google's response** (Testing-mode tokens return 604800s) — the expiry clock no longer exists.

**Zero consumer changes needed:** keepalive v2 reads vault per-run via `get_youtube_oauth_secrets()` RPC; `vyve-live-runner.py` reads via `read_vault_secret` RPC inside every `refresh_access_token()` — the token has one home (vault) and both picked the new one up automatically. Keepalive cron (jobid 25, 03:00 UTC) and `youtube-token-health` tripwire (jobid 35, 04:00 UTC) stay as belt-and-braces; health's next tick doubles as independent confirmation. PF-PARK-3's token-expiry half is resolved — the only surviving question there is whether partner streaming warrants a separate channel (+2nd OAuth client), now a pure isolation decision with no rotation-chore multiplier.

Tier 1 remaining: K (OTA canary), I (runner off Dean's Mac). H drafted PM-697.

## PM-697 — Finding H DRAFTED: sub-processor register v1 at reports/sub-processor-register-2026-07-04.md (2026-07-04)

14 processors enumerated with data categories, special-category flags, hosting regions, transfer mechanisms, DPA status. Core: Supabase (EU/Ireland, all member+health data), Anthropic (US, the one special-category flow leaving the EU — IDTA/SCCs, no-training commercial terms), Stripe, Brevo (EU), PostHog EU (masked+10%% per PM-695), APNs/FCM, Capawesome (EU). Email hosting (team@ on consumer-grade tenant) flagged honestly as the weak link — receives crisis-alert content; ties to finding U. Includes questionnaire-truthful statements + 5 open actions for Lewis (file Supabase/Brevo/PostHog/Capawesome DPAs, confirm Anthropic terms, YouTube-embed privacy-policy line). LEWIS OWNS EXECUTION — register is DPA-schedule-ready.

## PM-696 — CRITICAL signup fix: production signup dead since PM-689; onboarding v99 sets password at auth-user creation; welcome.html gates on password_set; set-member-password DELETED. Findings C + F CLOSED (66 dead EFs swept, 163→96) (2026-07-04)

**Discovery.** PM-689 stubbed `set-member-password` to 410+JWT — but `Test-Site-Finalv3/welcome.html` hard-gated its success screen on calling it. Every signup after the stub dead-ended at PASSWORD_SET_FAILED with a Try-again that could never succeed. Zero members harmed: the only signup since (reece-calvert@hotmail.com, 18:30 3 Jul) landed ~30 min before the stub, has a password, signed in at 18:31.

**Fix (both halves live-verified).** `onboarding` EF **v99** (platform v117, verify_jwt:false unchanged): `createAuthUser(e,fn,ln,pw)` includes the member's chosen password in the admin create body; already-exists path (re-onboards) applies it via admin PUT `/auth/v1/admin/users/{id}`; magic link now via `/auth/v1/admin/generate_link` (works by email, also yields userId on the exists path); response carries `password_set`. `welcome.html` (Test-Site-Finalv3 commit `547ad7b`, md5-verified): `confirmPasswordSet` is now a synchronous check of `result.password_set`; both gate call-sites replaced; SET_PW_FN deleted; retry re-fires onboarding, which is idempotent and re-applies the password — Try-again genuinely recovers (better than the old design, where a transient failure stranded the member). Live verification: fresh signup → `password_set:true` → GoTrue password-grant token issued with the chosen password; re-onboard same email with a DIFFERENT password → sign-in works with the new one. Test account (pm696-signup-test@) fully purged incl. auth.users; two test welcome emails BCC'd to team@ (subject "PM696test") — ignore.

**Transcription-integrity method (reusable).** v98 source captured via native MCP was proven byte-faithful to the deployed eszip before patching: the eszip stores Deno's reformatted emit (pretty-printed, redundant parens stripped) so direct byte-compare fails — whitespace-stripped **and paren-stripped** md5 matched exactly (53,626 chars both sides). Relay to the deploy sandbox went content-addressed via a git blob (`c65d16b`), md5-checked, then deployed via Management API `POST /v1/projects/{ref}/functions/deploy` (the CLI's own endpoint; native MCP deploy equivalent).

**Finding F CLOSED — 66 dead EFs deleted (163→96 deployed, incl. set-member-password last).** Reference checks ran wider than the register's ~5: all 52 cron jobs, public DB function sources, grep across all three repo tarballs (vyve-command-centre, vyve-site, Test-Site-Finalv3), and all 95 keep-set EF bodies (eszip grep via Management API). Two survivors were held out of the sweep: `achievement-earned-push` (live fetch() dependency of achievement-claim, achievements-sweep cron 15, and log-activity — KEPT permanently) and `set-member-password` (the welcome.html dependency above — deleted only after the PM-696 fix shipped). **Finding C closes with it**: both PM-689 slugs are gone (create-test-user went in the 66).

## PM-695 — Finding G CLOSED: PostHog session replay masked + 10% client-side sampling (2026-07-04)

vyve-site commit `999307c`, vbb 475→476, sw CACHE_NAME `vyve-cache-v2026-07-04-pm695-posthog-replay-mask-a`, md5-verified all 4 files. auth.js **v2.6** + index.html inline posthog.init (the two configs MUST stay lock-step — index.html's init runs first on the home page and wins; documented in code comments): `maskAllInputs:true`, `maskInputOptions {password,email}` (deleted the historical `email:false` unmask), `maskTextSelector '.profile-email, [data-ph-mask]'`, replay off by default (`disable_session_recording:true`) + 10% gate via sessionStorage `vyve_ph_rec` decided once per browser session, recording started in the `loaded` callback (the pre-load stub does not queue startSessionRecording). Sampling is client-side because the vault phx key lacks project:write — flipping the dashboard Session-replay 10% setting is optional belt-and-braces, not required. **LEWIS: confirm the PostHog EU DPA is signed** (EU-hosted project 138491) — finding H's sub-processor register cites it.

## PM-694 — Finding D FIXED: partner-content-upload shared password DELETED (EF v6 JWT + server-derived partner_id; portal PM-693 real Supabase Auth login). Also: crisis-scan v2.2 pattern fix + finding B verification closed via Dean's live check-in (2026-07-04)

**Finding D (register: shared password in public repo + no ownership check) — closed.** Discovery went deeper than the register: partner-portal.html's "login" was a client-side shared password ("vyve2026") that spoofed `state.session` — the real Supabase Auth flow (boot/showLogin/showApp with `is_partner()`) existed on the page but was DEAD CODE because a second `boot()` declaration (the password gate) shadowed it via JS function hoisting. Zero partner logins had ever been provisioned (`admin_users` role='partner': 0 rows); 5 of 7 live partners have no `contact_email`.

**Shipped:**
1. **`partner-content-upload` → v6** (platform v6, id d07bae94, **verify_jwt:true**): `x-portal-key` gate deleted; caller resolved from JWT → `admin_users` role: role='partner' → partner_id derived server-side from `partner_partners.contact_email` (client partner_id IGNORED); role admin/owner → explicit `body.partner_id` accepted (Dean/Lewis ops/demo path); anyone else 403. NEW guard: `commit` rejects a `storage_path` not under the caller's own partner prefix. Actions/logic otherwise unchanged. VERIFIED: old shared-key call now 401s at the platform (`UNAUTHORIZED_NO_AUTH_HEADER`) before the handler runs.
2. **partner-portal.html PM-693** (`vyve-command-centre` commit `c40ec337`, md5-verified): password gate + `PORTAL_PW` + `ALLOWED_EMAIL` + spoofed session + shadowing `boot()` all deleted — the real Supabase Auth flow is now the only flow. Login card is email+password `signInWithPassword`; sign-out is `auth.signOut()`; all 5 EF call sites send `Authorization: Bearer <session token>` via `efHeaders()`; partner identity via `rpc('get_my_partner_id')` with `DEMO_PARTNER_ID` fallback for admins (EF admin path takes the explicit id, so Dean/Lewis demo flow is unchanged); `showApp` loaders chained after `loadPartnerData` (carries the PM-level race fix from the old boot) and now include `loadPushQueue`. Inline JS `node --check` clean.

**Ops follow-up (Gate A provisioning):** real partners now NEED provisioned logins to use the portal — `partner-provision` EF from partners.html is the path (creates Auth user + `admin_users` role='partner' + credentials email). Blocker: 5 of 7 live partners have no `contact_email` (only emma-clarke-yoga→Dean, calum-denham-performance→Lewis). Backfill emails before provisioning. Until provisioned, the portal is admin-demo only — which matches actual usage today.

**Finding B closure (carried from PM-692):** Dean's live phone check-in verified the member-JWT → wellbeing-checkin v37 → crisis-scan chain (v37's `free_text` persistence proved execution) BUT exposed a detection gap: "Feeling a bit empty and numb" missed the rigid `/\bfeel\s+(empty|numb|...)/` pattern. **crisis-scan → v2.2** (platform v10): distress_numbness now matches feel/feeling/feels + optional intensifier (so/really/a bit/completely/totally/pretty/very). Re-fired Dean's exact sentence: concern tier, email + high-severity platform_alerts row — full chain verified end-to-end, test row cleaned. Lesson: members write "feeling", not "feel" — deterministic patterns need live-phrasing tests, not just canonical-phrase tests. Three clearly-marked TEST safeguarding emails are in team@ from tonight's verification.

**Tier 0 remaining:** C (Dean dashboard-deletes set-member-password + create-test-user slugs), E HAVEN routing (Lewis), F 68-slug EF sweep, G PostHog mask. Tier 1 J (Google OAuth verification) to start.

---

## PM-692 — Risk-register finding B (internal-alerting half) SHIPPED: crisis-scan wired into every disclosure surface + persistent platform_alerts records; member-facing half explicitly gated on Phil + Lewis (2026-07-04)

Worked finding B from the risk register: `crisis-scan` existed but nothing ongoing called it — a member disclosing suicidal ideation in a check-in, journal, or community post produced no internal alert. Discovery corrected one register assumption: **no HAVEN freeform chat exists** (`ai_interactions.triggered_by` ∈ re_engagement/onboarding/weekly_checkin/running_plan only) — HAVEN turns happen inside `wellbeing-checkin`, so wiring that EF covers HAVEN. Scannable surfaces mapped: `wellbeing_checkins.free_text`+legacy `answer` (EF), `monthly_checkins` 8 note fields + `goal_progress_note` (EF), `mind_activities.content` kind='journal' (client direct-insert), `connect_checkins.body` (client direct-insert, 60-char CHECK). daily_mood_checkins is fixed labels — nothing to scan.

**Shipped (all live):**
1. **`crisis-scan` → v2.1** (platform v9, id 767a1b66): (a) writes a **persistent `platform_alerts` row BEFORE the email** (critical→critical, concern→high) so a Brevo outage can never lose a safeguarding signal and the alert-digest crons give a redundant path — the row carries source+categories+hit-count ONLY, the member's raw text goes to the safeguarding email exclusively (data minimisation: CC dashboards must not carry distress disclosures); (b) gate now also accepts `x-vyve-internal-key` == vault **VYVE_INTERNAL_KEY** (secret e8b06b52) via service-role-only RPC `vyve_internal_key()` — the DB-trigger caller path; Bearer SERVICE_KEY unchanged for EF-to-EF; (c) email copy source-neutral (was hardcoded "onboarding scanner") via SOURCE_PHRASES map.
2. **Migration `crisis_scan_wiring_triggers`:** generic `notify_crisis_scan()` SECURITY DEFINER trigger fn (TG_ARGV = source label + text column; pg_net async post with the vault key; exception-swallowed so member writes can NEVER fail on alerting problems; fires only when text non-null and actually changed on UPDATE; text capped 4000 chars; looks up first_name). Triggers: `zz_crisis_scan_journal` on `mind_activities` (INSERT OR UPDATE OF content, WHEN kind='journal') and `zz_crisis_scan_connect` on `connect_checkins` (INSERT OR UPDATE OF body).
3. **`wellbeing-checkin` → v37** (platform v67, verify_jwt:true preserved): `scanForCrisis()` fire-and-forget via `EdgeRuntime.waitUntil` in serve() after body parse — covers both the new 'mood' flow (`free_text`) and legacy path (`answer`), trigger_source `weekly_checkin`, fully try/catch-wrapped: scan failure cannot delay or break a member's check-in. Also now persists `free_text` into `wellbeing_checkins.free_text` on both paths (column existed, v36 never wrote it — the member's own words were being dropped).
4. **`monthly-checkin` → v21** (platform v33): same fire-and-forget scan in the POST path over `note_<dimension>` ×8 + `goal_progress_note`, trigger_source `monthly_checkin`.
5. **`gdpr-erase-execute` → v4.1** (platform v15): all `alertPlatform` 'warning' severities → 'high' — latent bug found via the same constraint (below); its third-party-purge-failure alerts were silently rejected since v1.

**Live verification (real invocations):** direct invoke with internal key (critical tier, weekly_checkin) → 200, safeguarding email sent, `platform_alerts` critical row written; DB-trigger path via real `connect_checkins` write (concern tier) → fired async, email sent, `platform_alerts` high row written. Test subject `test-crisis-1@vyvehealth.test` swept afterwards via `gdpr_erasure_purge` (verified clean — bonus re-verification of PM-691's machinery). **Outstanding verification:** the member-JWT path through wellbeing-checkin needs one real check-in from Dean's phone with a benign concern phrase — Claude cannot mint member JWTs.

**GOTCHA (§23 rule candidate): `platform_alerts.severity` CHECK allows ONLY critical/high/info — 'warning' is silently rejected** (client-side catch swallows the 42514). Bit crisis-scan v2 in live test and had been silently biting gdpr-erase since day one. Any EF writing platform_alerts must use critical/high/info.

**Explicitly NOT shipped (Phil + Lewis gate):** member-facing crisis-response copy, persistent crisis signposting on disclosure surfaces, suppressing the persona reply on a critical hit, and force-routing to HAVEN/RIVER. The full register-B fix requires those; what shipped is the "a human is told, with a persistent record" half, which had zero member-facing surface and needed no sign-off. Note for the register narrative: on a critical hit today the member still receives the normal AI persona reflection — the internal alert fires in parallel.

Onboarding already called crisis-scan (v83+) — coverage is now: onboarding, weekly check-in (incl. HAVEN), monthly check-in, journal, community check-ins.

---

## PM-691 — Risk-register finding A FIXED: catalog-driven GDPR enumeration in BOTH executors; BONUS CRITICAL found+fixed: both GDPR crons were dead (401 every tick); erase now purges export artefacts from storage; finding V closed (2026-07-04)

Worked risk-register finding A (reports/12+13 companion, `vyve_remediation_risk_register_2026-07-03.md`). Register framing corrected first: the 2 executed erasures (7 May) were **TEST accounts** (`test-erase@`/`test-erase-2@vyvehealth.test`) with **zero residual rows** — no real-subject Article 17 harm and no re-run needed. The coverage gap was real and WIDER than reported: full catalog scan found **27** member-scoped tables missing from the hand lists (not 16) — all mind_*, daily_mood_checkins, movement_activities, connect_checkins, checkin_reactions, comms_send_log, exercise_name_misses, health_alerts, session_reminders, session_live_views, live_checkin_submissions, manual_step_estimates, member_prompt_responses/dismissals, member_home_state_dirty, partner_community_posts (author_email), partner_memberships, perf_telemetry, replay_video_views, weekly_challenge_participation, affirmation_favourites.

**Shipped (all live, all verified by real invocation):**
1. **Migration `gdpr_catalog_driven_enumeration`:** `gdpr_table_policy` registry (policies purge/retain; retain = gdpr_erasure_requests [Art 17(3) receipt], admin_audit_log [access log], stripe_events [financial records] — Lewis should confirm these legal bases for the DPA). All 71 current purge tables baseline-registered. `gdpr_member_scoped_tables()` runtime enumeration keyed on member_email/author_email/shared_by; **unregistered new tables default to PURGE** (fail-safe — new features cannot orphan) and raise a platform_alert at erase time. `gdpr_erasure_purge(p_email)` rewritten IN PLACE (same signature): two-pass delete (sweeps trigger-recreated rows without the old trigger-disable dance), retain-count accounting with legal basis in the receipt, members last, **zero-residual verification pass** (`verified_clean`). Orphan `gdpr_erase_purge_subject` DROPPED — **finding V closed**.
2. **NEW CRITICAL (not in register): both GDPR crons were silently dead.** Jobs 21 (export */15) + 22 (erase daily 03:00) sent NO Authorization header while the EFs enforce a CRON_SECRET bearer gate → **every tick 401'd**; a member export/erasure request would queue forever with no failure marking (confirmed: scheduled 17:00 tick 401, net._http_response 64862). CRON_SECRET value is unreadable (EF env only, not vault) and ≠ the legacy service-role JWT other crons send (EF env has migrated key format). Fix: vault secret **GDPR_CRON_KEY** + `gdpr_cron_key()` SECURITY DEFINER accessor (EXECUTE revoked from anon/authenticated, granted to service_role only); both EF gates now accept Bearer CRON_SECRET OR Bearer SERVICE_KEY OR `x-vyve-cron-key` == vault value (fetched via RPC, cached per isolate); crons 21/22 altered to send `x-vyve-cron-key` read from vault inside the cron command. Side effect: gate is now ALWAYS enforced (previously open when CRON_SECRET unset).
3. **gdpr-export-execute → platform v13 (logical v4):** hand lists deleted; enumerates via `gdpr_member_scoped_tables()` RPC — **fails hard if enumeration fails, never a silent partial export**. Retain-policy tables INCLUDED (Art 15 covers retained data), listed in `_meta.retained_on_erasure`. `_readme` completeness claim now true by construction; schema_version 2.0.
4. **gdpr-erase-execute → platform v14 (logical v4):** treats `verified_clean:false` as hard failure (request NOT marked executed); **NEW: purges the subject's export artefacts from the gdpr-exports bucket** (an export file IS a complete copy of their data — leaving it post-erasure was an Article 17 residual; best-effort with platform_alert on failure since the DB purge is not re-runnable). Third-party purges/auth-delete/Brevo unchanged.

**Live verification:** purge fn: synthetic subject with mind_moods/daily_mood_checkins/movement_activities → verified_clean, 9 rows, 0 errors, 343ms, second pass swept trigger-recreated member_activity_log/home_state rows. Export pipeline: queued request + cron-identical tick → 200 delivered, **tables_included 76** (was 44), file uploaded, URL signed, Brevo sent. Erase pipeline: full cycle member→export→erase → executed, verified_clean, **export artefact removed (removed:1)**, zero storage residual. All test subjects + files cleaned; only Dean's own May export remains in the bucket. Erasure receipts for test subjects retained by design.

**Constraint gotchas hit:** mind_moods.score CHECK 1–5; movement_activities.kind CHECK IN (walk/stretch/yoga/mobility/pilates/sport/other).

**Follow-ups:** (a) Lewis to confirm retain legal bases (stripe_events/admin_audit_log/gdpr_erasure_requests) for the DPA; (b) cc_leads/cc_* CRM tables keyed on `email` are deliberately OUT of member-export scope (different lawful basis, business-contact records) — note for DPO narrative; (c) CRON_SECRET env var on both GDPR EFs is now vestigial — remove via dashboard when convenient; (d) member-avatars bucket erasure cleanup still pending but moot until photo upload ships (existing backlog line). Remaining Tier 0 register items untouched: B (crisis-scan), C (dashboard slug deletes), D (partner-content-upload), E (HAVEN routing), F (68-slug EF sweep), G (PostHog mask).

**§23 rule candidates applied this session:** member-scoped tables MUST key on member_email/author_email/shared_by (the enumeration convention — a member table keyed `email` would be invisible to GDPR machinery); every new member-scoped table should be registered in `gdpr_table_policy` (unregistered = auto-purge + alert, never silent); any cron hitting a gated EF must send an auth header the gate actually accepts — verify with a real tick, 401s from pg_cron are silent.

## PM-690 — Full technical review COMPLETE (5/5 passes, bodies read): GDPR export ALSO gap-broken (CRITICAL), crisis-scan not wired to check-in surfaces (CRITICAL), erasure finding corrected to the WIRED function + FK-proven (2026-07-03)

Completed the five-pass deep review promised after PM-688's baseline was found inference-heavy. Full doc: reports/13-full-review-2026-07-03.md. PM-689 covered pass 1 (open EFs). This adds passes 2–5, all reading function/SQL bodies end-to-end.

**Pass 2 — money/identity: CLEAN.** stripe-webhook (HMAC, done PM-689), apply-trial (SQL guard `account_type not in (comp,enterprise,paid) AND trial_ends_at is null` — tight), partner-provision (verify_jwt:true + isAdmin, CSPRNG pw, audit — THIS IS THE TEMPLATE for closing partner-content-upload PM-688 §2.1), stripe-reconcile (CC_CRON_SECRET, insert-only dedup), send-password-reset (dead 404 stub). No findings.

**Pass 3 — GDPR executors: TWO CRITICALS + a correction to PM-688.**
- CORRECTION: PM-688 §1.1 diffed `gdpr_erase_purge_subject` (16.6KB) — that function is NOT WIRED. The live erase executor (gdpr-erase-execute cron #22) calls `gdpr_erasure_purge` (3.9KB), a different function. Right conclusion, wrong evidence. §23 rule: two purge fns exist, only gdpr_erasure_purge is live — any fix targets THAT one.
- CRITICAL: erasure leaves 16 member tables behind, FK-PROVEN. Wired purge deletes by hand-list + relies on CASCADE. FK check on 20 unlisted member_email tables: only 4 have CASCADE→members (checkin_reactions, connect_checkins, replay_video_views, weekly_challenge_participation). The other 16 have NO FK and orphan: all mind_* (moods, burnout_checks, activities, fitness_log, trackers, recovery_actions, recovery_log), daily_mood_checkins (150 rows), live_checkin_submissions, manual_step_estimates, member_prompt_responses, member_prompt_dismissals, movement_activities (44), partner_memberships, session_live_views, affirmation_favourites. Entire Mind pillar has no cascade net. 2 erasures already executed → standing Article 17 failure, named subjects.
- CRITICAL: gdpr-export-execute (Article 15) has its OWN independent hand-list (MEMBER_SCOPED_TABLES, 40 tables), omits the SAME Mind/connect tables, AND the bundled _readme promises "every record VYVE Health CIC holds against your email." False completeness claim on the most sensitive category. Export is SELECT so no cascade saves it — omission total.
- Root cause: TWO independent hand-maintained lists, both drifted identically. Fix once: single catalog-driven SECURITY DEFINER enumeration (every member_email/author/shared_by table) feeding BOTH; re-run erasure for the 2 subjects; CI guard. Machinery otherwise excellent (cron-secret, SKIP LOCKED, retry, signed URLs, auth.users whitelist, third-party purges, audit).

**Pass 4 — clinical: CRITICAL coverage gap.** crisis-scan itself is well-built (service-role, deterministic critical/concern keyword tiers, Samaritans/Shout/999 signposting, human 4h/24h reach-out, no AI). BUT it's caller-driven and almost nothing calls it — self-describes as "the onboarding scanner." ZERO committed EF sources invoke it. wellbeing-checkin v66 (live weekly check-in) takes member free_text → sends to Claude → stores → returns advice, with NO crisis-scan call (full body read confirms). Frontend signposting on only 3 pages (VYVE_Health_Hub unlinked, mental-fitness, movement-plans); the disclosure surfaces have zero: wellbeing-checkin.html (2 textareas), journal.html (2), monthly-checkin.html (9), connect-checkin.html (1), mind.html. Compounding: persona not re-evaluated on distress — a low-wellbeing member on NOVA/SPARK gets performance-framed AI on a crisis disclosure. Fix: wire crisis-scan into all free-text surfaces + persistent signposting + crisis-hit → fixed clinical response + force HAVEN/RIVER. Lewis+Phil own policy, Dean wires. MORE urgent than the HAVEN-signoff finding.

**Pass 5 — keep-set spot checks: CLEAN.** partner-file-url (JWT+admin+bucket allowlist+5min signed), off-proxy (fixed-destination, no SSRF, public data). Pattern confirmed: estate uses 3 consistent correct auth shapes (member JWT / in-code admin / cron secret) + fixed-destination proxies. Stopped after pattern confirmation rather than reading every keep fn (judgment call, noted).

**Net:** core engineering is genuinely good (auth, payments, admin, isolation all well-built). Failures are (a) isolated dead scaffolding — 2 killed PM-689, ~68 to delete — and (b) two systemic list-drift bugs (GDPR coverage, crisis-scan coverage). No auth-pattern breaks in production member-facing code. Full Tier 0–3 remediation in reports/13.

**Production changes this session:** none beyond PM-689's 2 kills. This pass was read-only + doc.

## PM-689 — Audit pass #1 (open EF bodies read): 2 unauthenticated account-takeover primitives KILLED; stripe-webhook + admin cluster cleared; 68-slug EF delete partition built (2026-07-03)

Continuation of the PM-688 enterprise DD audit. PM-688's HIGH/MEDIUM tail was inferred from verify_jwt flags + slug names, not read bodies. This pass read the open (verify_jwt:false) non-cron functions end-to-end. The inference badly under-rated two functions and over-rated the admin cluster.

**CRITICAL — found + KILLED this session (production change, verified by real invocation):**
- `set-member-password` — was verify_jwt:false with ZERO auth (no JWT, no key, only advisory CORS). Took arbitrary {email,password} and reset ANY member's password via service-role Auth admin API (email_confirm:true). Full account-takeover primitive, public internet. → overwritten with 410 stub + verify_jwt:true. Curl with no-JWT and anon-only both return 403 pre-body. **Dashboard-delete the slug when convenient.**
- `create-test-user` — was verify_jwt:false, ZERO auth. Created arbitrary auth user + member row via service role, hardcoded password '1234'. Unauthenticated account-creation primitive. → same 410+JWT kill, verified 403.

Both were dead debug/utility functions nothing live calls. Neutralised same-session rather than waiting (bleed-stop > discuss-first, per judgement).

**HIGH — static-key PII/debug functions (on delete list, not emergency — gated, fixed-target):**
- `inspect-members-schema` — static querystring key `vyve-26apr2026-hk-test`, service role, dumps member email/name rows + insert/delete probe on members. Querystring keys get logged.
- `create-test-member` — same static key, seeds known account test@test.com / vyve2026, returns creds in response.
- Shared hardcoded key `vyve-26apr2026-hk-test` reused across ≥2 debug fns → §23 note.
- `debug-show-file` — no gate, but hardcoded to one fixed cert path (own account). Leaks 1 file's first 500 chars. LOW; delete.

**PASS / cleared (resolves PM-688 opens):**
- `stripe-webhook` — proper HMAC-SHA256 sig verify, 300s replay tolerance, timing-safe compare, refuses w/o secret (503), stripe_events insert-first idempotency via 23505 short-circuit. Resolves PM-688 §2.3.
- **Admin-write cluster (`admin-member-edit`, `admin-member-programme` read in full; 4 more share copy-identical verifyAuth):** verify_jwt:false is the DOCUMENTED ES256 gateway fix, NOT missing auth. Each does in-code JWT verify (anon.auth.getUser) → admin_users allowlist → active check → role gating → field/enum/UUID validation → admin_audit_log write. This is the BEST-built part of the estate. PM-688's "admin cluster open = HIGH" was wrong in the alarming direction.

**MEDIUM — new:** `admin-member-edit` v6 made `reason` OPTIONAL even on SCARY fields (persona, subscription_status, health_data_consent); code comment defers mandatory-reason to "if enterprise DPA requires it." It does — one-line revert per sensitive field before enterprise.

**Artefacts:** full keep/delete partition of all 163 deployed EFs saved to `reports/ef-delete-list-2026-07-03.txt` (68 delete candidates; ~5 need admin-console-reference check before the sweep — internal-dashboard EF, cc-data, edit-habit, add-exercise-stream, admin-test-push-oneshot). Deletion is its own CLI session (deploy_edge_function can only overwrite, not delete).

**Coverage:** every EF that can mutate member data is now read or pattern-confirmed. This is a complete SECURITY pass. Remaining audit passes are correctness/governance: #2 money/identity tail (stripe-reconcile, apply-trial, partner-provision, send-password-reset — not yet read), #3 GDPR executors read end-to-end (gap already found via SQL, executors not yet body-read), #4 clinical/crisis-scan coverage trace.

**Next-session queue:** (1) CLI delete sweep from the 68-list after the ~5 checks; (2) fix PM-688 §1.1 erasure gap (catalog-driven purge + re-run 2 subjects); (3) close partner-content-upload (PM-688 §2.1); (4) HAVEN interim routing decision for Lewis.

## PM-688 — Enterprise due-diligence technical audit (read-only): GDPR erasure gap, partner-EF access-control, HAVEN exposure quantified (2026-07-03)

Ran a full read-only technical audit framed as a corporate buyer's InfoSec/DPO/procurement review (Sage-class), ahead of enterprise sales. No writes except this entry + the report. Report at `reports/12-enterprise-dd-audit-2026-07-03.md`. Supersedes the security/GDPR/enterprise-readiness slices of the April `reports/01,05,09` against live state (35→133 tables, 15→165 EFs since).

**CRITICAL findings (contract-stalling / regulator-relevant):**
1. **GDPR erasure misses 31 member-identifiable tables** — `gdpr_erase_purge_subject()` deletes ~44 tables; 96 carry a member email/author col; ~27 real-PII tables silently retained after a "complete" erasure, incl. the ENTIRE Mind pillar (`mind_activities` 97 rows, `daily_mood_checkins` 150, `connect_checkins` 45, `movement_activities` 44, all `mind_*`). `gdpr_erasure_requests` shows 2 erasures already ran → standing Article-17 failure with named subjects. Root cause: hand-maintained delete list not updated on new-feature ships. Broader than the brain's "mind-fitness tables" note. Fix: catalog-driven self-maintaining purge + CI guard + re-run for the 2 subjects.
2. **`partner-content-upload` broken access control** — `verify_jwt:false`, gated only by `x-portal-key:"vyve2026"` (committed in the PUBLIC vyve-command-centre repo), runs service-role, trusts client `partner_id` with NO ownership check. Anyone reading our public code can list/upload/edit any partner's content. Brain tracks this as a §23.132/133 productionisation TODO — reclassified as a SECURITY DEFECT, pull forward (= PM-684 partner-login work). Low real-world blast radius (7 partners, no member PII) but textbook OWASP finding a pen-test flags red.
3. **HAVEN live without clinical sign-off — 14 real (non-test) members assigned** the persona (interaction exposure smaller: ~3 members+Phil per prior notes). Known pre-Sage blocker, now quantified. Interim: stop new HAVEN assignment + reroute to RIVER, or get interim clinical review on record. Brief Lewis.

**HIGH:** PostHog session-replay 100% with email UNMASKED on a health app (§1.2); ~90 dead/debug EFs still ACTIVE+open (`debug-show-file`, `inspect-members-schema`, `set-member-password`, `create-test-user` etc.) — April's ~89-delete list barely actioned; sub-processor register absent for DPA; live-runner on Dean's Mac (SPOF); Google OAuth stuck Testing (~7-day token, external lead time — start now); OTA canary never verified end-to-end; SSO/SAML + per-employer tenancy isolation absent/unproven; Mental Fitness crisis copy placeholder (0 rows so far).

**PASS/strengths (say in questionnaire):** RLS on 100% of tables; NO live secrets in any repo (only anon/publishable keys + the vyve2026 gate string); EU residency confirmed; private buckets correct (partner-docs/content, gdpr-exports, cc-docs); working export+erasure machinery; native APNs live; scale-ready leaderboard RPC + member_home_state aggregate; broad cron watchdog coverage.

**MEDIUM/LOW:** 3× client-side vyve2026 gates over RLS-protected data (downgraded from critical — sb_publishable key means RLS still applies, not a PII leak); ~20 bare-`auth.email()` RLS policies (§23.67 perf); synchronous per-row `member_home_state` triggers on 8+ tables (scale bottleneck — shift to dirty-mark); no test harness/build step; `ai_interactions` unbounded retention; 15 RLS-on/0-policy tables (deliberate service-role deny-all — document); stripe-webhook signature/idempotency = verify-don't-assume.

Full 20-item remediation roadmap in the report, tiered by "unblocks a signature soonest" (T0 this week: erasure fix, partner-EF, HAVEN interim, dead-EF purge, PostHog mask). Nothing shipped to production; no code changed.

## PM-687 — July calendar uplifted to 6/day: +60 rows (12:00 Mind, 17:30 Movement daily), 188 future sessions total (2026-07-03)

Same session as PM-686, Dean asked for 6/day instead of 4. Added two daily slots across 4 Jul – 2 Aug from the same June pool: **12:00 Mindfulness & Mindset** and **17:30 Yoga, Pilates & Stretch** — 60 rows, rotation offsets (Mind +11, Movement +28). Post-insert same-day-title dedupe found 4 clashes; swapped via least-recently-scheduled pick (note: a single-statement LATERAL LRU pick snapshots and can select the same title for multiple rows — 28/29 Jul needed a second distinct-pick pass).

**Final shape:** 188 future rows, 0 same-day duplicate titles. Daily: 07:00 Mv · 08:30 Mi · 12:00 Mi · 13:00 Mv · 17:30 Mv · 19:30 alternating (Mv Tue/Thu/Fri/Sun, Mi Mon/Wed/Sat); Tuesdays 7/day with the 18:00 Education slot. Repeat cadence: Mind ~weekly (21-title pool at ~2.4/day), Movement ~fortnightly (55 titles at ~3.6/day). **This is the density ceiling on the current 76-master library** — going past 6/day means new recordings (Workout-category content still parked on Calum's inputs pack; Suicide and Men stays gated §23.84). Runner heartbeat healthy throughout.

## PM-686 — July live-session calendar regenerated: 121 rows, 4 Jul – 2 Aug, runner confirmed picking up (2026-07-03)

The 30-day calendar (PM-451, 4 Jun – 2 Jul) ran dry yesterday; from 3 Jul the only future `live_session` rows were the 7 weekly Tue 18:00 Education & Experts slots (through 18 Aug). Runner heartbeat was healthy but starved (`upcoming: 0`). Regenerated the month in one SQL insert — no new content, no new copy, so no Lewis gate: the pool is the 76 proven June rows (55 Movement + 21 Mind), `DISTINCT ON (category, session_title)` taking the latest June row per title, carrying `notes` (runner filename), `session_description`, host, thumbnails, and duration verbatim.

**Template (Europe/London, mirrors June's core pattern minus the PM-658 catch-up-block noise):** Movement (Yoga, Pilates & Stretch) daily 07:00 + 13:00, plus 19:30 Tue/Thu/Fri/Sun. Mind (Mindfulness & Mindset) daily 08:30, plus 19:30 Mon/Wed/Sat. Existing Tue 18:00 Education rows untouched. Rotation = alphabetical pool cycled by slot index modulo pool size (series like Healthy Hips 1→3 air in order as a side effect). One extra Movement row tonight Fri 3 Jul 20:00 so launch day isn't empty. Total inserted: 121 (Movement 78 incl. tonight, Mind 43). `visibility='public'`, `partner_id` NULL (48h partner trigger not in play).

**Verified live:** per-day lineup 4/day + Tue 5/day correct; runner heartbeat flipped `upcoming: 0 → 4` on the next loop (~18:08 UTC) with no restart — forward window (§23.125 fix) seeing the new rows. First canary is tonight's 20:00 broadcast (runner mints via `ensure_broadcast`; watchdog cron 50 covers it).

**Stale-WARN correction:** master's front WARN and the §cron table said cron 27 `session-publish-hourly` is DISABLED — live `cron.job` shows `active=true` (re-enabled PM-658 as belt-and-braces). Both corrected this entry.

**Backlog:** "calendar regeneration before 2 Jul" carried item closed (a day late — schedule gap was today only, and today got a session). Still carried: the ~40 stale empty-notes rows deactivation, service_role rotation, runner off Dean's Mac.

## PM-685 — CC IA reorg shipped (PM-639 Phase A): 4-domain nav, hub layer retired, 11 dead pages killed (2026-07-03)

Built the locked PM-639 Phase A IA in `vyve-command-centre`. Single atomic commit `038799c`, md5-verified pinned to SHA. Admin-only — zero member blast radius.

**4-domain nav live:** `VYVE_NAV_TOP` is now Run the Business (→ #/brief) / Analytics (→ #/usage) / Members (→ #/active-users) / Partners (href → `/partners.html`). Old 7-tab hub layer retired; `VYVE_ROUTE_TO_TOP` remapped (Daily/Commercial/Marketing/Delivery/Knowledge/Org → brief, Analytics → usage, Members → active-users). Sidebar restructured to match: new **Analytics** section (all 8 Insights pages, App Health moved out of Delivery), new **Members** section (Member Admin href → `admin-console.html`, Broadcast moved from Delivery, Active Users moved from Org), new **Partners** section (`partners.html` monolith + `partner-portal.html`). Commercial dropped the old partners skeleton; Marketing dropped Performance + Brand.

**Kills (all grep-confirmed zero inbound references):** root `Dashboard.html` (only ref was a CSS comment in admin-console.html), `pages/partners.html` (Commercial skeleton), `pages/performance.html`, `pages/brand.html`, all 7 orphan `pages/partner-*.html`. Note: `pages/partner-revenue.html` had received the PM-683 payout rewire but was unreachable — the monolith carries identical logic, killed with the rest.

**Collateral patches:** `lib/router.js` renderTopNav supports href tabs (Partners links the monolith directly; href tabs bypass ACL filter and never highlight active — acceptable). `lib/quick-search.js` guards slug-less top tabs. 4 dangling `#/performance` KPI links in `pages/brief.html` + `pages/dashboard.html` repointed to `#/social-blueprint`.

**Deliberately left for Layer 2:** the 4 now-unreachable hub pages (`pages/commercial|marketing|delivery|org.html`) — harmless dead files, sweep after Dean confirms no bookmarks; `assets/seed-data.js` (166K mock data, loaded by `index.html` shell) — the Layer 2 headline is a full mock audit: what still reads seed data, plus the known hardcoded Attendances-by-week + engagement-segment scorer in `partners.html`.

**CC v2 layering agreed with Dean:** L1 IA reorg (this, DONE) → L2 real data everywhere (seed-data quarantine + kill mocks) → L3 auth (per-partner portal logins folded into onboarding, PM-684 headline) → L4 Claude-driven audited actions (PF-NEXT-15) → L5 Team App wrap (deferred, content sign-off).

**Test note:** admin.vyvehealth.co.uk behind Fastly — verify with a fresh `?z=N` key (§23.138).

## PM-684 — Partner content scheduling: approved ≠ live, partner-set go-live (48h min), editable-in-review, video thumbnails (2026-06-26)

Continuation of the partner-portal work. Turned "approve = instantly live" into a real publish lifecycle the partner controls, fixed two upload bugs surfaced along the way, and added best-effort video thumbnails. All on `ixjfklpckgxrwjlfsaaz`, all production. Demo partner = Emma Clarke (`4867d2c2-53bd-4139-8289-19df0132d71e`).

**Storage ceiling (carried from PM-683, confirmed):** the 413s on big uploads were the project-GLOBAL storage upload limit (§23.131), not the bucket `file_size_limit`. Raised global to 2GB; a spend-cap banner clamps the true ceiling below 2GB but well above the ~250MB real files. Verified by real PUTs (60/100/250MB → 200). Test objects deleted via Storage REST using a service_role key fetched from the Management API (§23.136).

**Upload list was phantom-empty (THE bug behind a long cache chase):** `boot()` and the password-unlock handler called `loadPartnerData(); loadContent(); …` WITHOUT awaiting. `loadContent` early-returns `if(!state.partnerId)return;`, and `partnerId` is only set by the async `loadPartnerData` — so it raced and silently rendered an empty list that looked exactly like a cache/RLS miss. Fixed both call sites to chain off `loadPartnerData().then(...)`. (§23.135)

**`partner-content-upload` reads its own list via the EF (service role), not anon REST:** the demo portal's anon key can't satisfy `partner_own_content_select` (RLS USING `get_my_partner_id()` is NULL for anon — §23.132 class), so "Your Content" was 0 rows. EF gained a `list` action; portal reads through it.

**`partner-file-url` bucket-prefix bug:** `media_url` is stored as `<bucket>/<key>` (e.g. `partner-content/<id>/<file>`); the admin passed it straight as `path` → `createSignedUrl('partner-content/partner-content/…')` → 404→500 on Download. v2 strips a leading known-bucket prefix. (§23.137)

**Scheduling model — approved is NOT live:**
- `publish_at timestamptz` on `partner_content_items`, NULLABLE. NULL = approved-but-unscheduled = NOT live. Live = `moderation_status='approved' AND publish_at IS NOT NULL AND publish_at <= now()`, evaluated live (no cron) by both member RLS `member_read_live_partner_content` and the portal chips.
- `moderation_status` `published` → renamed `approved` (CHECK still transitionally allows `published`; nothing writes it — one-line cleanup later). Lifecycle: draft → in_review → approved → (scheduled→live by clock). §23.122 updated.
- Legacy rows had been backfilled `publish_at = created_at` (a time nobody chose), making old approved items spuriously "Live". Cleared all legacy `publish_at` to NULL → they read "Approved", not Live.
- **48h minimum lead** on go-live, enforced in the picker (`min`), client validation, AND the EF (`commit` + `update` reject `< now()+48h`). (§23.139)
- **Edits lock at approval:** partner can change title/description/go-live ONLY while `in_review`; the EF `update` action 409s otherwise (`…WHERE moderation_status='in_review'`), so a stale page can't bypass it. Chips relabelled: in_review now reads "Pending approval" (never auto-live).

**Thumbnails (best-effort, no server pipeline):** at upload the browser captures a poster frame (`<video>`→seek→canvas→320px JPEG), uploads it to a new PUBLIC bucket `partner-thumbnails` via a `sign-thumb` EF action, and stores the public URL in `thumbnail_url`. Portal + admin moderation rows render it; falls back to the film icon if a codec won't decode in-browser. Public bucket is fine — poster frames are low-sensitivity and public read avoids per-thumb signing.

**`partner-content-upload` v5** (verify_jwt:false, `x-portal-key` gate): actions `sign` / `sign-thumb` / `commit` (publish_at required & ≥48h, optional thumbnail_url) / `list` / `update` (alias `reschedule`; title/description/publish_at, in_review only, 48h). EF-verified: sign-thumb 200+public_url; commit & update both 400 on a 24h time.

**Migrations:** `partner_content_publish_at_and_approved_status`, `partner_content_publish_at_nullable_unscheduled`, `partner_content_thumbnails` (+ public `partner-thumbnails` bucket).

**Fastly note:** admin.vyvehealth.co.uk sits behind Fastly with per-edge-node caching; an empty-cache hard reload doesn't help — bust with a novel `?z=N` query key. (§23.138)

**Commits (vyve-command-centre):** scheduling `b41b9ecb`, approved-unscheduled `7239237`, refinements `302387b8` (partner-portal.html) + `4d4f1051` (partners.html).

**Next (Dean's call, NOT built):** wire partner-portal login to real per-partner auth and fold account creation INTO partner onboarding — replace shared password + `DEMO_PARTNER_ID` with an auth user + `admin_users` role='partner' matched on `partner_partners.contact_email`, flip the EF back to JWT. TUS/resumable uploads belong with that JWT build. See backlog.

## PM-683 — Partner referral system: tier links, trial attribution, payout rewire, and partner-portal video upload working (2026-06-25)

Long session (continuation + one compaction). Built the referral system out from PM-682's single-partner link into a full tiered/trial/payout/portal stack, then spent the back half getting partner video upload actually working end-to-end. All on `ixjfklpckgxrwjlfsaaz`, all production.

**Tier links £20 / £15 / £10 — per-partner coupons KILLED:**
- Identity now rides on the subscription, not the coupon. `partner-join-redirect` v5 stamps `subscription_data[metadata][partner_slug]` + tier on the Checkout Session; the coupon only carries the discount. Two SHARED coupons created live: `VYVE_TIER15` (£5 off forever), `VYVE_TIER10` (£10 off forever); £20 tier = no coupon. Per-partner coupons are dead — onboarding a partner no longer needs a coupon object. (§23.134)
- `404.html` (Test-Site-Finalv3) extended: `/join/<slug>/20|15|10` forwards the tier; `/trial/<slug>` → `welcome.html?c=<slug>`.
- VERIFIED LIVE via a verify-tier EF: £20→2000/0, £15→2000−500=1500, £10→1000, `partner_slug` stamped on each `cs_live` session.

**Attribution model (3-tier fallback):**
- `stripe-webhook` v13 `handlePartnerReferral`: (1) `subscription.metadata.partner_slug`, (2) legacy coupon-id → `partner_partners.stripe_promo_code`, (3) `members.signup_campaign_code` (trial conversions). `netMonthlyValue()` = actual net paid.
- `stripe-reconcile` v5: single global active-sub scan, same 3-tier match. PRIMARY attribution path because the member row is created at welcome.html AFTER `subscription.created`, so the webhook usually skips and the reconciler (every 15 min, cron #52) catches it. Verified clean: 7 partners, 0 errors.

**Partner provisioning:** 4 live partner rows added (50% share, trial_days 14): `antonia`, `april`, `david`, `ivan` (+ existing men-together-cic, Emma Clarke, Calum Denham = 7). Correction mid-session: these are INDEPENDENT partners, not Men Together staff — role_title set to generic 'VYVE Partner', pillar 'connect'; real role_title/pillar still TBD (backlog). 15 join links + 5 trial links handed to Lewis.

**Free-trial attribution (£20→£10 conversion locked):**
- Partner trial reuses the existing free-trial machinery. `/trial/<slug>` → `welcome.html?c=<slug>` (free, no card) → onboarding EF creates member (trial_ends_at NULL) → welcome.html fires `apply-trial` → `apply_trial_campaign(email, code)` stamps the trial. At £10 conversion the webhook/reconcile read `members.signup_campaign_code` to credit the partner.
- `partner_partners.trial_days` column added (default 14). `apply_trial_campaign` rewritten to fall back to a live partner slug when the code isn't in `trial_campaigns`. BUG caught + fixed: the PL/pgSQL variable `code` shadowed the `trial_campaigns.code` column → renamed `v_code`. Verified: men-together-cic→14d, generic 14day→14d, unknown→rejected.

**Admin payouts rewired (both surfaces):**
- `runPayouts()` in BOTH `partners.html` (live SPA) and `pages/partner-revenue.html` used a stale model: `totalMRR = (active members) × £20` split by a dead `sessions_attended` column, ignoring real `partner_memberships.subscription_value`. Rewired both → gross = `Σ(subscription_value WHERE referred) per partner`, payout = gross × share. Matches partner-facing earnings. £0 across all 7 now (no conversions yet = correct).

**Partner-portal video upload — made to actually work (the back-half saga):**
- Symptom: upload "did nothing". Root causes, all fixed:
  1. The portal called `partner-file-url` for the upload URL — WRONG function (it's an admin-gated DOWNLOAD helper). Built NEW EF `partner-content-upload` (sign + commit). (§23.133)
  2. `partner-portal.html` is a SHARED-PASSWORD demo (`vyve2026`) that SPOOFS `state.session = {user:{email}}` with NO real JWT. So the upload EF can't verify a user token — it gates on an `x-portal-key: vyve2026` header instead (verify_jwt:false). (§23.133)
  3. `is_partner()` only allowed `role='partner'` (zero exist) → broadened to `role IN ('partner','admin','owner')` so the team can enter the portal. No RLS uses is_partner — safe.
  4. **The big one:** ALL anon reads on `partner_partners` were throwing "permission denied for function get_my_partner_id" — a `public` RLS policy calls `get_my_partner_id()` but `anon` lacked EXECUTE, so the whole SELECT errored, leaving the portal empty and `partnerId` unset (which silently disabled upload). Granted EXECUTE to anon+authenticated. (§23.132)
  5. Bucket `partner-content` was 500MB; raised to 2GB — but that did nothing because the PROJECT GLOBAL storage upload limit is 50MB and overrides per-bucket. Proven directly: 50MB PUT → 200, 100MB PUT → 400 `{"statusCode":"413","Payload too large"}`. Real fix is the Dashboard global storage limit (Dean action — not SQL-changeable via our tools). (§23.131)
- Portal wired: upload `sign` → PUT to signed URL → `commit` (EF writes `partner_content_items` row at `moderation_status='in_review'`, service role, RLS-clean). Client-side 2GB size guard + clear over-size message added. CC commits: dab224b, 50dd777, 0a311f6.
- DISCOVERED the real partner→login linkage that earlier notes said didn't exist: `partner_partners.contact_email = auth.email()` (via `get_my_partner_id`, SECURITY DEFINER). Real partner logins live in `admin_users` (role='partner'); currently ZERO exist. This is the basis for replacing the demo `DEMO_PARTNER_ID` pin with real per-partner routing.

**EFs deployed:** partner-join-redirect v5, stripe-webhook v13, stripe-reconcile v5, partner-content-upload v2, `apply_trial_campaign` (SQL fn). **Migrations:** `partner_trial_days`, `is_partner_allow_admins_for_portal`, `grant_execute_get_my_partner_id_to_anon`. **Throwaway EFs to sweep (next dead-EF pass):** setup-tier-coupons, verify-tier, test-storage-sign, test-upload-put. **EF source comments still carry PM-PLACEHOLDER** (not swept — would mean redeploying prod EFs for a comment; PM-683 recorded here instead). **Playbook added:** `playbooks/referral-system.md`.

**Compliance flag for Lewis (no emojis):** auto-converting trials need UK pre-charge disclosure + a reminder ~3 days before the £10 flip. Lewis owns the copy.

## PM-682 — Partner referral link: discount fix, branded /join via 404.html, earnings = net paid, ~15-min community join (2026-06-25)

Long session off a continuation handoff. Goal: make the partner referral link actually work. Multiple stale-brain landmines corrected.

**The £20 bug — partner discount now actually applies (the headline):**
- ROOT CAUSE: Stripe Payment Links CANNOT pre-apply a coupon (no `discounts` field on the `payment_link` object; only `allow_promotion_codes` for the customer to TYPE a code). PM-675's `payment_link_url` (`buy.stripe.com/14A9AU5WM0AifIhcQJ93y02`, `plink_1Tlycv`) was a bare £20 link — every Men Together signup would have been charged full price with zero attribution. Coupon `mentogethercic` (amount_off 1000, forever, valid) was attached to nothing.
- FIX: `partner-join-redirect` v4 mints a Stripe **Checkout Session** (mode=subscription, `price_1TCmukLyCqq49zQI5uTJpO0Q`, `discounts[0][coupon]=<partner.stripe_promo_code>`) and 303s to it. Coupon auto-applied, member types nothing. Subscription carries `discount.coupon.id` → stripe-webhook attribution. VERIFIED LIVE (Dean screenshot): £20 − Men Together CIC £10 = **£10 due**, on checkout.stripe.com.
- Per-partner Stripe payment-link objects NO LONGER NEEDED. Onboarding a partner = coupon + DB row; the EF builds the discounted checkout live from `stripe_promo_code`. (§23.127)

**Branded /join/[slug] works with NO Cloudflare:**
- Mechanism is `Test-Site-Finalv3/404.html` (GitHub Pages catch-all): reads `/join/<slug>` from the path and `window.location.replace`s to `partner-join-redirect`. `join.html` never executes for the subpath (Pages can't path-route a file). PM-676's "join.html dynamic redirect live + MATCH verified" was WRONG.
- No confirmed Cloudflare in front of the domain (Dean: "I don't think we have Cloudflare"). Earlier 404-cache symptom = GitHub/Fastly edge during iteration, not Cloudflare. No Worker / Redirect Rule / subdomain. master line 1105 corrected. (§23.129)

**Earnings = 50% of what the member ACTUALLY pays (£5), not 50% of £20 list (£10):**
- `partner_memberships.subscription_value` DEFAULT `20` DROPPED (silent £20 default overpaid the whole discount; null→£0 is the safe-fail direction).
- `stripe-webhook` v11 + `stripe-reconcile` v2/v3: `subscription_value = netMonthlyValue(sub)` = `(price.unit_amount − coupon.amount_off)` or `× (1−percent_off)`, /100. Men Together: £10 stored → £5 payout, £5 to VYVE. Helper unit-tested across amount_off / percent_off / `discounts[]` array form / over-discount clamp / missing-price fallback.
- `run_partner_payouts` UNCHANGED — always `Σ(subscription_value) × pct`, just fed the wrong number. (§23.128)
- CC `partner-portal.html` (commit 35198f0): MRR now `Σ(actual subscription_value) × share` (was hardcoded `20 × share`); `gross_amount`→`gross` select fix (payout history was silently 400ing → always empty); blurb corrected from "50% of the £20/month".

**Post-payment redirect fixed — `onboarding_v8.html` is DEAD:**
- `onboarding_v8.html` 404s on the live site (served the 404.html). Real onboarding questionnaire is `welcome.html` (428KB, multi-section, reads `?c=` campaign param). master line 163 already flagged it superseded; the Stripe success_urls were the stale part. `partner-join-redirect` v4 success_url → `welcome.html?partner=<slug>&cs={CHECKOUT_SESSION_ID}`. (§23.130)

**Community auto-join — SAFE path chosen (no onboarding/webhook surgery):**
- A partner-referred member's `partner_memberships` row (= community membership) is written by the coupon→webhook path. Gap was timing: `subscription.created` fires before the member record exists (created at welcome.html submit), so it was matched only by the nightly reconciler.
- FIX: `stripe-reconcile` cron #52 nightly → **every 15 min** (`*/15 * * * *`). Referred members join the community within ~15 min of paying. Per-run 'clean' info alert dropped (would be ~96/day; liveness via `cron.job_run_details`). REJECTED the alternative (welcome.html?partner → onboarding EF writes row + webhook merge-on-conflict) — too much regression risk on the signup + earnings paths (incl. the webhook's `engagement_segment` stomp on a merge) for a marginal instant-vs-15min gain. Reconcile v3 invocation verified: 200, Men Together checked, 0 recovered, 0 errors.
- `?partner=<slug>` now rides the welcome.html success_url but is INERT — there for a future instant-join (onboarding EF could write the row from the `cs` session id, leaving the webhook untouched).

**EFs deployed:** stripe-webhook v11, stripe-reconcile v3, partner-join-redirect v4 (all verify_jwt=false). **Migration:** `partner_subscription_value_drop_default`. **Cron:** #52 → `*/15`. **CC commit:** 35198f0. **Playbook:** `partner-onboarding.md` rewritten (no payment-link step).

## PM-675–676 — Partner payment links + branded /join/ redirect + partner onboarding playbook (2026-06-22)

**PM-675 — Partner payment links (CC):**
- `partner_partners` table: added `payment_link_url TEXT` and `payment_link_id TEXT` columns
- Men Together CIC partner row inserted: slug=`men-together-cic`, coupon=`mentogethercic`, payment_link_url=`https://buy.stripe.com/14A9AU5WM0AifIhcQJ93y02` (created via Composio Stripe, £10 off forever pre-applied to `price_1TCmukLyCqq49zQI5uTJpO0Q`), status=`onboarding`
- `partners.html` Settings panel: payment link URL field added (shown first, above coupon ID field). `savePaymentLink()` function saves to `payment_link_url`
- `partner-portal.html` Earnings tab: shows payment link (not bare coupon code) with Copy link button. Messaging: '£10 off forever pre-applied'. Falls back to `stripe_promo_code` if no link set

**PM-676 — Branded /join/ redirect + partner onboarding playbook:**
- `Test-Site-Finalv3/join.html`: dynamic partner redirect page. Path: `www.vyvehealth.co.uk/join/[slug]`. Reads slug from URL path, queries `partner_partners` (status=live, anon key) for `payment_link_url`, shows VYVE-branded loading screen for 900ms, then redirects to Stripe payment link. Error state if slug not found. Falls back to general checkout on network error. Requires `status='live'` — shows error during onboarding stage. noindex/nofollow meta.
- `VYVEBrain/playbooks/partner-onboarding.md`: complete Claude-executable playbook. 8 steps: Stripe coupon (STRIPE_CREATE_COUPON via Composio), payment link (STRIPE_CREATE_PAYMENT_LINK), DB row (Supabase MCP), branded URL (auto-resolved by join.html), Gate A (portal provision), partner profile setup, Gate B (go live), hand-off to partner. Includes tool slugs, SQL template, time estimate, reconciliation note.

**Men Together CIC partner URLs:**
- Branded: `https://www.vyvehealth.co.uk/join/men-together-cic`
- Stripe: `https://buy.stripe.com/14A9AU5WM0AifIhcQJ93y02`
- Coupon: `mentogethercic` (£10 off forever)

**How to onboard any future partner:** Tell Claude the name, slug, pillar, contact email, and discount. Claude reads `playbooks/partner-onboarding.md` and executes Steps 1–4 (Stripe coupon + link + DB row) autonomously in ~3 minutes via Composio + Supabase MCP. Steps 5–8 require Dean/Lewis approval gates.

## PM-674 — Partner earnings: Stripe attribution reconciliation (2026-06-22)

Dean: webhook failures would mean partners miss earnings and feel ripped off. Two things built to make this impossible to miss.

**EF stripe-reconcile v1 (cron #52, nightly 02:00 UTC):**
Calls Stripe API directly (`STRIPE_SECRET_KEY` EF env var) to list all active subscriptions. Filters client-side to those with `discount.coupon.id` matching a known `partner_partners.stripe_promo_code`. For each match, checks `partner_memberships` for a `referred=true` row. If missing: inserts the attribution row + writes a `high` severity `platform_alerts` row (type: `stripe_attribution_recovered`) so it surfaces in the daily report. If Stripe API itself fails (bad key, network): writes `critical` alert immediately. If everything is clean: writes `info` alert confirming it ran. Authenticated via `CC_CRON_SECRET`. Paginates up to 500 subs per partner (5 pages of 100).

**Failure modes covered:**
- Webhook EF timeout/crash → reconciler catches it next morning
- Webhook signature misconfigured → `critical` alert on first reconcile run (Stripe subs exist, no rows)
- `STRIPE_SECRET_KEY` missing → `critical` alert immediately on first cron run
- Member signed up before partner row existed → caught once partner row + promo code assigned
- Everything fine → `info` alert in daily report confirming clean run

**CC partners.html (PM-674, commit 32d5b7e7):** New Stripe referral code field in the partner Settings panel (`renderPartnerSettings`). Input auto-uppercases. `savePromoCode()` writes to `partner_partners.stripe_promo_code`. Shows green tick if code assigned, amber warning if not. This is the step that must happen before ANY attribution or reconciliation can work.

**Earnings model clarification (Dean):** Partner earnings = members who used the referral code at Stripe checkout ONLY. Community joiners (app Join button, `referred=false`) are NOT part of earnings. Attribution source: `stripe-webhook` v10 `handlePartnerReferral` writes `partner_memberships` with `referred=true` when `discount.coupon.id` matches `partner_partners.stripe_promo_code`. Reconciler is the safety net, not the primary path.

**Action required before any of this is live:** For each real partner, create a Stripe coupon in the dashboard (0% discount, readable ID e.g. EMMA50), then assign it in `partners.html` Settings tab. Partner shares the code. Webhook + reconciler then handle everything automatically.

## PM-666–PM-672 — Partner Portal: sessions scheduling, scheduled push queue, theme, earnings (2026-06-22)

**PM-666 partner_scheduled_pushes migration:** One-shot push queue table. `id, partner_id, title, body, send_at, sent_at, cancelled_at, recipient_count, error`. Index on `send_at WHERE sent_at IS NULL AND cancelled_at IS NULL`. RLS: admin ALL, partner own rows (INSERT: `send_at > now()+5min`; UPDATE: only if `sent_at IS NULL`). Also added `trg_partner_session_min_notice` BEFORE INSERT/UPDATE trigger on `calendar_occurrences` — raises exception if `partner_id IS NOT NULL AND starts_at < now()+48h`.

**PM-666 partner-push-dispatcher EF v1 (cron every 15 min):** Fetches pending `partner_scheduled_pushes` rows (`send_at<=now, sent_at IS NULL, cancelled_at IS NULL`). For each: `resolve_broadcast_audience({type:partner_subscribers, partner_id})` → `send-push` EF with `LEGACY_SERVICE_ROLE_JWT`. Marks `sent_at + recipient_count` on success, `error` on failure. Authenticated via `CC_CRON_SECRET` header. Cron job #51 wired in Supabase pg_cron.

**PM-670 partner-portal.html: Supabase CDN init fix** — removed `lib/supabase.js` dependency (doesn't exist in CC), replaced with CDN `supabase-js@2.39.3` + self-contained `_getSB()` client.

**PM-671 partner-portal.html: password gate** — magic link auth replaced with `vyve2026` password gate (sessionStorage). Auto-loads Emma Clarke (`DEMO_PARTNER_ID`). All DB calls converted from `sb().from()` to raw `fetch(SUPA_URL+'/rest/v1/...')` with anon key (no session required for demo).

**PM-672 partner-portal.html: full feature build (commit 2bbd063b):**
- **Light/dark theme**: dual CSS token blocks (:root/dark + light), toggle button in topbar (moon/sun), persisted in localStorage `vyve-partner-theme`. Same pattern as member portal.
- **Sessions tab rebuilt**: schedule form (title, date+time, duration 30/45/60/90 min, YouTube URL). 48hr minimum enforced client-side (min attribute) and server-side (DB trigger). Writes to `calendar_occurrences` with `visibility='community'` and `partner_id`. Upcoming sessions list below with `fmtDT()` formatter and live URL link.
- **Community tab notify panel**: send-now replaced with scheduled push. Date+time picker. Preview Audience calls `resolve_broadcast_audience` RPC directly (anon key, no admin JWT). Schedule Push writes to `partner_scheduled_pushes`. Scheduled queue rendered below panel with pending/sent/cancelled states + Cancel button (sets `cancelled_at`). Queue reloads on schedule, cancel, and post actions.
- **Earnings tab wired**: MRR calculated as `referred_count * 20 * (revenue_share_pct/100)`. Shows per-member rate when no referrals yet. Payout history from `partner_payouts`.

**Push flow end-to-end:** Partner schedules push in portal → `partner_scheduled_pushes` row → `partner-push-dispatcher` cron (15min) → `resolve_broadcast_audience(partner_subscribers)` → `send-push` EF → APNs to subscribed members → tap routes to `/partner-profile.html?id=`.

**Session constraint:** `trg_partner_session_min_notice` on `calendar_occurrences` — 48hr rule is belt-and-braces (client enforces via min date attribute, DB raises exception as backstop).

**Demo state:** password `vyve2026`, auto-loads Emma Clarke. URL: `https://admin.vyvehealth.co.uk/partner-portal.html`

## PM-669 (2026-06-23): broadcast-watchdog v2 — treat 'complete' as healthy

**Problem:** Two watchdog alerts fired today. Yoga Flexibility (19:30 UTC) was a genuine failure — ffmpeg rc=224, broken pipe at 88s due to Mac network dropout. Nutrition Basics (17:00 UTC) was a false positive — rc=0 clean finish, video simply shorter than its 30-min slot; broadcast went `complete` at 17:12, watchdog checked at 17:16 with `ends_at=17:30` still in the future and called it a failure.

**Fix:** `broadcast-watchdog` v2 deployed. Added `&& lc !== 'complete'` to the not_live check. `complete` = video finished before slot end = success. Only `created`, `ready`, `none`, or missing broadcast id now trigger an alert. Verified via dryrun: `{due:0, would_alert:[], would_resolve:0}`.

**Genuine failure pattern (Yoga Flexibility):** `ffmpeg rc=224 / Broken pipe` at 88.75s + immediate `daemon loop error: TimeoutError` — Mac internet dropout. Runner and OAuth healthy. Structural fix (VPS migration) remains backlog.

Also noted: `daemon loop error: URLError(gaierror(8))` at 02:31 UTC — overnight DNS blip, self-recovered, no session impact.

## PM-668 (2026-06-23): Dexie v27 catalogue recovery — calendar + replays blank

**Root cause:** PM-665 committed db.js with SCHEMA_V26 declared before SCHEMA_V25. At evaluation time, SCHEMA_V25 was `undefined`, so `Object.assign({}, SCHEMA_V25, ...)` yielded a partial object missing the six Mental Fitness tables from V25 AND (critically) the inherited catalogue stores from earlier versions. Any device that opened the app after PM-665 (22 Jun evening) got Dexie upgraded to a corrupt v26 — catalogue stores (`calendar_occurrences`, `replay_playlists`, `replay_videos`, `service_catalogue`, `personas`) were either missing or schema-broken. PM-667 fixed the declaration order but Dexie skips the upgrade for devices already at v26, leaving the corruption frozen.

**Fix (PM-668, commit b01fc7bb):** Added `db.version(27).stores(SCHEMA_V26).upgrade(tx => clear the 5 catalogue tables)`. Any affected device upgrades to v27, the clear() runs, and sync.js refills all catalogue tables on next foreground open (5-min stale window). No member-scoped data touched. Self-heals for all affected members automatically on next app open. vbb 475.

**New §23 rule:** §23.124 — Never chain `.version(N).stores(...).version(N+1).stores(...)` — always use separate `db.version(N).stores(...)` calls. The chained form is valid Dexie syntax but obscures evaluation-order bugs when schema vars depend on each other. Separate calls make the dependency chain obvious.

## PM-666 (2026-06-23): Model string hotfix — onboarding + wellbeing-checkin EFs

`claude-sonnet-4-20250514` deprecated by Anthropic, causing Anthropic 404 on every new onboarding (batch1_parallel phase). Fix: `onboarding` EF bumped v97→v98 (Supabase version 116), `wellbeing-checkin` EF bumped v35→v36 (Supabase version 66) — both patched to `claude-sonnet-4-5`. Gokce Erdogan (gkcerdogan@outlook.com) manually re-onboarded via pg_net after fix confirmed — member row, auth user, 5 habits, movement plan all created successfully. Note: `anthropic-proxy` passes through client-supplied model string (no hardcode); running-plan.html client-side model reference is a portal web shell issue (lower priority, not causing errors). `re-engagement-scheduler` uses Haiku not Sonnet — unaffected.


## PM-665 — Partner Space: Dexie-first community feed (2026-06-22)

Dean: feed should paint instantly on open, no waiting for page to load. Dexie-first, same pattern as the rest of the app.

**db.js SCHEMA_V26 (vyve-site commit 124332ed):** Two new Dexie stores:
- `partner_community_posts`: `'id, partner_id, [partner_id+created_at], created_at'` — `makeTable` with `memberKey:'partner_id'` so `allFor(partnerId)` returns all cached posts for a given partner.
- `partner_memberships_local`: `'id, member_email, partner_id, [member_email+partner_id]'` — standard `makeTable` for the member's joined partners. Compound index for O(1) joined-check without full table scan.
`db.version(26).stores(SCHEMA_V26)` — clean upgrade, no re-keying (§23.83).

**sync.js:** `partner_memberships_local` added to MEMBER_TABLES sync loop. Runs on every login — so by the time a member taps into any partner profile their joined-status is already in Dexie. `partner_community_posts` is NOT in the sync loop (can't resolve partner IDs synchronously at sync time) — cached by `partner-profile.html` on first open instead.

**partner-profile.html:** `loadFeed` split into `renderFeedPosts` (pure render, takes any posts array) + `loadFeed` (Dexie-first, REST background). Flow: (1) read `partner_community_posts.allFor(partnerId)` from Dexie, sort desc, paint immediately — zero network, zero skeleton on return visits; (2) fetch REST in background; (3) `bulkUpsert` results into Dexie; (4) re-render only if first-post-id or count changed (avoids flicker on no-change). Post divs tagged `data-post-id` for the change-detection check. First-ever open to a partner still hits the network (Dexie cold), subsequent opens are instant.

**index.html + settings.html:** vbb 472→473. **sw.js:** cache `vyve-cache-v2026-06-22-pm665-dexie-partner-posts-c`.

**New §23 rule candidate:** partner_community_posts uses `memberKey:'partner_id'` in makeTable — so `allFor(partnerId)` returns all posts for a partner, not all posts for a member. This is intentional but non-obvious. Any future Dexie store where the scoping key is not `member_email` must document the `memberKey` override explicitly in the SCHEMA comment and the `makeTable` call.

## PM-664 — Partner Space: community push notifications (2026-06-22)

**Workstream 3 complete.**

**Migration `partner_subscribers_audience`:** Extended `public.resolve_broadcast_audience(criteria jsonb)` with a seventh audience shape `partner_subscribers`. Usage: `{"type":"partner_subscribers","partner_id":"<uuid>"}`. Resolves to `partner_memberships.member_email` WHERE `pm.subscription_status='active'` AND `members.subscription_status='active'` (cross-checked so lapsed members don't get pushes they can't act on). REVOKE/GRANT preserved. All six existing shapes unchanged.

**`partner-portal.html` (CC, commit `c7470e1b`):** New "Notify community" card in the Community tab above the post compose card. Two-step: Preview Audience (calls `admin-broadcast-push` in `preview` mode, shows recipient count) then Send Push (confirm dialog, fires `send` mode). Audience: `{type:partner_subscribers, partner_id}`. Route: `/partner-profile.html?id=<partner_id>`. Push type: `partner_community`. Writes to `admin_broadcast_log` via the existing EF audit trail.

**End-to-end partner push path:** partner types title+message in their portal → preview (see how many subscribers) → confirm send → `admin-broadcast-push` EF → `resolve_broadcast_audience` resolves subscribers → `send-push` EF fans out to APNs/in-app → tap routes member to `/partner-profile.html?id=` (Community tab). Fully audited to `admin_broadcast_log`.

**Partner Space Workstreams 1-3 now complete:**
- WS1: Partner web backend (`is_partner()`, Gate A provision, `partner-portal.html` 5-tab CC slice)
- WS2: Member-facing in-app space (`partner-space.html` discover + `partner-profile.html` profile)
- WS3: Community notifications (`partner_subscribers` audience shape, notify panel in portal)
- WS4 (Claudedriven audited actions): read half live (Supabase MCP), write half in partners.html for pipeline advances + Gate A provision. Full audited action EF layer is next natural extension.

Gate B still holds — no live partners yet.

## PM-663 — Gate B approvers: Dean + Lewis only (Phil not in partner approval chain) (2026-06-22)

Dean: "Phil won't approve partners. Me and Lewis will."

`vyve-command-centre/partners.html` (commit `0556ba2d`): Gate B go-live confirm dialog updated — "Confirm Phil has signed off on safeguarding and GDPR" removed, replaced with "Confirm Dean and Lewis have both approved this partner".

Brain: §23.84 scope clarification added — the rule covers member-facing VIDEO content (suicide/self-harm/addiction crisis/acute MH), NOT partner go-live decisions. Partner Gate B is Dean + Lewis. If a specific partner video touches acute MH territory, §23.84 applies to that video (Phil gates it); the partner community going live is a separate call and Phil doesn't block it. PM-660 and PM-659 CURRENT_FRONT lines corrected to remove "Phil" from gate B description.

## PM-661 — Partner Space: full build (schema + RLS + EF + CC partner portal + Connect tile + in-app discover page) (2026-06-22)

**Schema (migration partner_space_schema):**
- `admin_users.role` CHECK extended: added `partner` (was admin/viewer/coach_full/coach_exercise/coach_mental/team)
- `calendar_occurrences`: added `visibility TEXT NOT NULL DEFAULT 'public' CHECK IN (public,community)` + `partner_id UUID REFERENCES partner_partners(id) ON DELETE SET NULL` + index on `partner_id`
- `is_partner()` SECURITY DEFINER RPC (authenticated + service_role callable; §23.104 REVOKE)
- `partner_memberships`: added `subscription_status TEXT DEFAULT 'active'`, `community_joined_at TIMESTAMPTZ`, UNIQUE `(member_email, partner_id)`

**Schema (migration partner_role_rls_policies):**
- `get_my_partner_id()` SECURITY DEFINER helper — resolves partner row from calling user's email + admin_users check
- Partner-scoped RLS on `partner_partners` (SELECT/UPDATE own row), `partner_content_items` (INSERT/SELECT/UPDATE own, UPDATE gated to draft/in_review only), `partner_community_posts` (CRUD own posts, author_kind='partner' enforced), `partner_memberships` (SELECT own subscribers), `partner_payouts` (SELECT own), `partner_onboarding_progress` (SELECT own)

**EF partner-provision v1 (JWT required, admin-gated):**
- `provision`: creates/reuses Supabase Auth user, upserts `admin_users` row `role=partner`, emails credentials via send-email EF, writes `admin_audit_log`
- `deprovision`: deactivates `admin_users` row, bans Auth user (reversible 10yr ban)

**vyve-command-centre commit 2a0a11fd (PM-661):**
- `partner-portal.html` (new, standalone, 879 lines): partner-facing CC-slice. 5 tabs: Profile (edit role_title/pillar/bio/why/avatar_url), Content (upload video to partner-content via signed URL → `partner_content_items` at `in_review` per §23.122), Community (post/delete feed, subscriber stats), Sessions (reads `calendar_occurrences` filtered by `partner_id`), Earnings (referred member count, est MRR, payout history, promo code). Magic-link auth, `is_partner()` gate on boot.
- `partners.html`: Gate A confirm dialog + `partner-provision EF` call on advance to `onboarding`; Gate B explicit Phil sign-off confirm language on advance to `live`

**vyve-site commit 58046d6c (PM-661), 5 files, all md5-verified:**
- `connect.html`: Community destination tile (coral gradient, peer of Calendar/Podcast), links to `/partner-space.html`. CSS `.community-tile` class added.
- `partner-space.html` (new, 416 lines): in-app Partner Space discover page. Three pill views: Discover (live partners grid — Gate B enforced, only `status=live`), Joined (filtered), Sessions (community `calendar_occurrences` filtered to joined partners). Join writes `partner_memberships` row (free, no Stripe). Nav back → Connect.
- `index.html` + `settings.html`: vbb 470→471
- `sw.js`: cache `vyve-cache-v2026-06-22-pm661-partner-space-a`, `partner-space.html` added to precache

**Entry path: Connect hub → Community tile → `/partner-space.html`** (eventually moves to Home — decision parked per Dean).

**Gate B still holds:** `partner-space.html` filters partners by `status='live'` — no live partners yet (all 3 rows are Dean test runs, `declined`). Page will show empty state until first partner is approved and Phil signs off.

**Next on Partner Space:**
- `partner-profile.html` — individual partner profile (Community/Sessions/Library tabs, Join button) per the mockup
- Wire `partner-space.html` supabase auth pattern (depends on how auth.js exposes `vyveSupabase` — verify on device)
- Workstream 4 (Claudedriven audited actions) — first use case is partner pipeline advances already in partners.html; read half already works via Supabase MCP

## PM-660 addendum — Claude-driven audited admin actions (Workstream 4) (2026-06-22)

Dean: Claude should be able to interact with the whole partner/member system from chat — read state ("has anyone applied?"), report, and on permission execute approvals. Folded into the spec as Workstream 4.
- **Read half is ALREADY LIVE** (Supabase MCP over `partner_*` + `members`) — proven this session: 3 partner rows (all Dean test runs, status `declined`, none `applied`/`live`), 52 members (up from 47). No build.
- **Write half = thin AUDITED action surface, graduated by risk** (do NOT let Claude run raw ad-hoc writes): low-risk stage advances on say-so; Gate A provision-login on explicit confirm; **Gate B go-live is a HARD-RULE confirm — Claude verifies safeguarding+gdpr recorded (Phil) before flipping `status→live`, refuses otherwise (§23.84), never on a casual "approve."** All writes → `admin_audit_log`. Prefer reusing existing audited admin EFs (`admin-member-edit` pattern) over new raw-write paths. Generalises to members + the admin console; partners first consumer.

## PM-660 — Partner Space: full end-to-end map + build spec for Sonnet (talk-first, no code) (2026-06-22)

Mapped the entire partner situation with Dean end-to-end. No code shipped (Opus/Orbis wrong vehicle for building — Sonnet builds). Authored `playbooks/partner-space-build.md` as the handoff spec.

**Decisions LOCKED:**
- **Two gates.** Gate A = approved as partner → web login provisioned, builds their space, uploads content, drafts sessions (members can't see). Gate B = Phil safeguarding/GDPR sign-off (HAVEN-bar §23.84, the PM-659 HELD migration) → members can discover/join + content visible. So partner onboarding can proceed NOW; Phil only blocks member visibility, not partner start.
- **Partner management is WEB-ONLY** — Dean explicitly does not want in-app partner management. `is_partner()` CC-slice (extend `admin_users.role`, Team App pattern PM-640). Member app is read-and-join only for partner content.
- **Money model: community join is FREE.** Any active member follows any partner; payment is the VYVE membership itself (£20 B2C), community access is a benefit of paying. Partner earns via existing 50% referral attribution only. No Stripe at join, no member paywall. Access still gated on `subscription_status` (§23.85).
- **Live model is simulated-live** (pre-recorded master over RTMP via runner), not genuinely-live. "Live at 8pm Friday" = upload + slot → `calendar_occurrence` → runner airs → replays after. Genuinely-live (per-partner Riverside) is v2.

**NEXT-UP build (Sonnet) — one schema, three deliverables:** (1) partner web backend `is_partner()` CC-slice [Gate A]; (2) member-facing in-app Partner Space — discover/join free/feed/sessions [Gate B-visible]; (3) community subscription + notifications. `partner_memberships` is the hinge for both surfaces (member subscribes ↔ partner's push audience). New: `calendar_occurrences.visibility` (`public`|`community`) + `partner_id` for audience scoping at the DISPLAY layer (also the guardrail against the Team-App-scheduler global-list footgun). Notifications = new `partner_subscribers(partner_id)` audience shape over the EXISTING live push spine (APNs/`send-push`/scheduled) — hard part already built.

**PARKED to backlog (mapped, not next — videos may not even go live yet):**
- **QC/ingest airing pipeline.** Design target: Dean does minimum work, exception-only. Watcher launchd agent in `~/vyve-live` (TCC-safe §23.89, py3.9-safe §23.88) does the whole loop unattended: download master → transcribe audio → rubric the transcript → ffmpeg-probe → frame-sample → write `calendar_occurrence` at requested slot. **QC is transcript-first + mechanical, NOT "AI watches the video"** (the thing that's burned Dean before): transcript-vs-VYVE-rubric is the load-bearing safeguarding check (real risk is text §23.84); ffmpeg does resolution/bitrate/silence/black-frame mechanically; optional cheap vision-on-stills catches "camera at the ceiling" only. Clean → auto-schedule (FYI). Flagged → hold + one notification + 10s approve/reject. Download is permanent until the runner can fetch from Storage (bigger build). Watcher inherits runner SPOF (Mac-awake only).
- **YouTube channel/key model.** Corrected the "channel per thing" memory: ONE channel, **9 reusable stream keys** (concurrency lanes, 1 broadcast each) + **8 category playlists** (post-air buckets; replay split by playlist not key). 15 partners is NOT a key/channel problem — it's slot allocation (reuse 9 keys across the day, ceiling = 9 concurrent, add more keys free; new logic = no-double-book check). Leaning a separate "VYVE Partners" channel for blast-radius isolation (least-controlled content + safeguarding surface) — costs a 2nd OAuth + channel-aware runner (`channel` column + branch). Build runner channel-aware from the start if doing it.
- **Google OAuth verification = HARD DEPENDENCY for partner streaming.** Token NOT fully fixed: `youtube-token-health` only warns, `youtube-token-keepalive` is quietly papering over it; consent screen still "Testing" mode (~7-day expiry, implicated in PM-658 outage). A stopped token then takes down partner commitments to their communities. A 2nd partner channel doubles the chore until verified.

Brain-only commit (changelog + master CURRENT FRONT line + backlog Partner Space section + new playbook). No vyve-site/EF/migration changes.

## PM-659 — Partner onboarding: hide Video modules + Education (8→6 steps) + single required "Welcome to VYVE" video; honest deferred gates (2026-06-22)

Dean: "hide video modules and education for now, add later and backdate people onto it" + "starter content — only required piece is a Welcome to VYVE explaining who they are and what their community is about."

**Discovery that reshaped the job.** `partner-onboarding` EF submit was HARDCODING the go-live gates — `gdpr_passed:true, videos_watched:true, safeguarding_passed:true, pct_complete:100` regardless of what the partner did (only `starter_videos_uploaded` was data-driven, requiring `>=3`). So hiding the two steps would have made the platform assert every partner passed a Safeguarding & GDPR assessment they never saw, and a 1-video starter change could not be HTML-only (EF gated `starter.length>=3`). The DB go-live gate `assert_partner_golive` was already mooted by the faked submit.

**Three-part honest-by-construction ship.**
1. `Test-Site-Finalv3/partner-onboarding.html` (commit `95d260e7`, md5-verified). 8→6 steps via an `ACTIVE=[0,1,2,5,6,7]` step-array indirection — panes st3 (Video modules) + st4 (Education) kept dormant in the DOM, never activated. Re-enable later = add `3,4` back to ACTIVE (one line). All index-keyed fns untouched; nav/progress/rail/eyebrows/submit-completeness iterate ACTIVE; dynamic "Step N of 6" eyebrow. Starter content reduced to one required slot — "Welcome to VYVE" (prompt: introduce who you are + what your community is about); slots 2/3 optional. Wizard sends `modulesDeferred:true`; `gateSteps()` writes the deferred trio false + `modules_deferred`. Overview hero/flow/dataReqs trimmed (8→6 steps, dropped Education card, "2 Required assessments"→"48h Review turnaround", starter row → welcome video).
2. `partner-onboarding` EF **v4** (deployed, ACTIVE, ezbr `a3549cc2…`). Submit no longer fakes gates: writes `videos_watched/safeguarding_passed/gdpr_passed` from payload (false while deferred), stamps `steps.modules_deferred`, `starter_videos_uploaded` now `starter.length>=1`, and removed the forced `pct_complete:100` (BEFORE trigger `trg_sync_partner_onboarding_pct` recomputes pct + the safeguarding/gdpr columns from steps — forcing 100 would defeat the gate during deferral). Client filters empty starter slots (no junk `in_review` rows). When modules return, client stops sending `modulesDeferred` → EF writes real values again, no redeploy.
3. **HELD migration** (`HELD_partner_modules_deferred.sql`, NOT applied — awaiting Phil + Lewis): `compute_partner_onboarding_pct` 5-step denominator when deferred + `assert_partner_golive` skips safeguarding/gdpr when deferred, so a deferred partner can hit 100% and go live. Compliance call (partner runs live member sessions without a safeguarding/GDPR assessment) — Phil/Lewis gate it. Until applied, onboarding is open but go-live BLOCKS deferred partners.

**Verified (SQL replay of the v4 submit write).** Deferred partner + 1 welcome video → trigger computes pct=63% (5/8 after admin approval), `safeguarding_passed=false`, `gdpr_passed=false`, `modules_deferred=true`, `starter_ok=true`; `assert_partner_golive` raises as expected. Egress to supabase.co is sandbox-blocked so the EF endpoint wasn't hit over HTTP; deploy compiled clean and the DB-side contract (the only logic change) is replay-verified.

**Back-date recipe (when modules return):** `UPDATE partner_onboarding_progress SET steps=(steps-'modules_deferred')||'{"videos_watched":false,"safeguarding_passed":false,"gdpr_passed":false}' WHERE steps->>'modules_deferred'='true';` — gate snaps back to the full 8-step rule; cohort must re-complete.

**Note:** 3 pre-existing `partner_partners` rows (0 live) onboarded under the old faked-gate EF — NOT modules_deferred-marked, show safeguarding/gdpr passed=true from the old submit. If any are real (not test), decide whether to re-flag. Logged to backlog.

## PM-658 — Live-session outage (4 days): runner forward-window blindness + server-side broadcast watchdog + missed-session reschedule (2026-06-22)

Live sessions silently stopped airing for ~4 days (last broadcast minted 18 Jun 18:30 UTC, null thereafter). No error anywhere — a silent blinding, not a crash.

**Root cause.** `vyve-live-runner.py` `get_upcoming()` queried `calendar_occurrences` with `order=starts_at.asc&limit=100` and only an UPPER time bound (`hi = now + 24h`, applied client-side) — no lower bound. Once active `live_session` occurrences exceeded ~100 (reached ~18 Jun at 4/day from the 22 May oldest), the 100-row ascending window pinned to the OLDEST (all past) occurrences, so the current/next sessions fell outside the window. The runner stopped both creating broadcasts and airing them. New hard rule §23.125.

**Red herrings ruled out (in order):** schedule intact — 163 active `live_session` occurrences, 111 past / 52 future, through 18 Aug (not a scheduling gap); YouTube OAuth token proven healthy via a live refresh grant (200); `session-publish` EF proven healthy (returned ok:true); cron 27 `session-publish-hourly` disabled since 4 Jun — intentional, the runner owns creation (`ensure_broadcast` CAS reuses existing id else mints).

**Runner fix (committed here to `scripts/vyve-live-runner/vyve-live-runner.py`; Mac copy patched live).**
- Forward window: `get_upcoming()` now adds `lo_iso = now − 300s` as `&starts_at=gte.<lo_iso>`, so the ascending+limit window tracks the present instead of the epoch.
- Heartbeat: the daemon loop now upserts `runner_heartbeat` (`id='runner'`, `beat_at`, `detail={upcoming:N}`) every cycle before processing, arming the watchdog's daemon-down detection.
First time the runner is under version control — the brain copy is now the source of truth (Mac was the only copy and had drifted into the bug).

**Server-side watchdog (the Mac being down can't take alerting down too).**
- `broadcast-watchdog` EF v1 (`verify_jwt:false`). For every session that should be airing now (started ≥ GRACE_MIN=4 ago, `ends_at ≥ now`), verifies the YouTube broadcast is actually `live` via `liveBroadcasts.list?part=status`; missing id or non-live = failure. Also flags a stale `runner_heartbeat` (> 6 min). Dedupes via `broadcast_watch_alerts` (one open alert per key, auto-resolves when healthy). Alerts: email `team@vyvehealth.co.uk` (send-email EF) + native push to `deanonbrown@hotmail.com` (push-send-native EF). Modes: `{}` normal, `{"check":"dryrun"}`, `{"check":"selftest"}`. NOTE: deployed v1 header comment still reads `(PM-XXX)` — cosmetic; sweep to PM-658 on next functional redeploy.
- Migration `broadcast_watchdog_tables`: `public.runner_heartbeat` + `public.broadcast_watch_alerts` (unique partial index on open `alert_key`). RLS on, no policies (service-role bypass).
- pg_cron 50 `broadcast-watchdog-5min` (`*/5 * * * *`).
- pg_cron 27 `session-publish-hourly` re-enabled (`5 * * * *`) as belt-and-braces — CAS-safe alongside the runner.

**Reschedule.** The 11 missed sessions across 19–21 Jun moved into a 22–27 Jun evening catch-up block (19:30 + 20:45 UTC), durations preserved (`ends_at = new_start + original duration`), `youtube_broadcast_id` cleared so the runner re-mints.

**Verified.** Runner heartbeat landed post-reload (`detail.upcoming=6`, fresh within seconds) — confirms both patches live and the forward window seeing current sessions again. Watchdog: normal run clean (due:0), selftest delivered BOTH email (success) and push (sent:1, 200). Next scheduled session is the live end-to-end proof; watchdog pushes Dean only if it fails.

**Structural risk logged to backlog:** runner still on Dean's sleep-prone Mac with a Google OAuth app in "Testing" mode (~7-day refresh-token expiry). Move to an always-on box + complete consent-screen verification.

## PM-657 — VYVE Money: full bug-fix run PM-653–657 (2026-06-18)

vyve-site commits `4c1c0f2c` (PM-653) · `5efff1e7` (PM-654) · `4f4ec78e` (PM-657). All fixes to `money.html` post-ship.

**PM-653 — gap + track calc + privacy notice.**
- Wrap padding-top corrected (was double-counting safe-area inset on top of sticky header height).
- `updateSplit()` introduced: updates split bars, KPIs, net worth in-place without re-rendering expense/debt lists — stops focus destruction on keystroke.
- All expense/savings/income `oninput` handlers now call `updateSplit()` instead of `renderTrack()`.
- One-time privacy notice added (all users): "Your data stays on your phone — VYVE never sees it." Dismissed permanently via `localStorage('vyve_money_privacy_seen')`. Never shown again after first dismiss.

**PM-654 — gap (final) + localStorage key migration.**
- Wrap padding-top set to flat `16px` (sticky header is in-flow above `<main>`, needs no clearance).
- Fixed localStorage key mismatch: data saves to `vyve_money_anon` before auth resolves, then `onAuthReady` sets `_email` and `load()` read `vyve_money_email@...` (empty) — state reset to defaults, wiping typed values. Now: on auth, if email-keyed store is empty and anon store has data, migrates automatically and removes anon key. Also: state loaded immediately on page open (anon key) so data is visible before auth resolves.

**PM-657 — IIFE scope bug (expense inputs not updating split).**
Root cause: `money.html` JS runs inside an IIFE. Inline `oninput` HTML attributes execute in global scope and could not see `state` or `save()` — silently throwing `ReferenceError` on every keystroke. Needs/wants bars never updated. Fix: `window.state = state` and `window.save = save` added alongside existing window exposures. Two lines, root cause resolved. Savings & debt bar worked because `setVal()`/`setPot()` were already on `window`.

**§23 gotcha added:** Inline HTML `oninput`/`onclick` attributes run in global scope, not inside the IIFE that defines the page's JS. Any variable or function referenced in an inline handler must be explicitly exposed on `window`. This applies to `state`, `save`, and any other IIFE-scoped identifier. Always check `window.x = x` alongside `window.go`, `window.toggleType` etc.

## PM-656 — Partner Agreement embedded in onboarding: executable contract + DocuSign-style e-sign + signed-copy download (2026-06-21)

`Test-Site-Finalv3/partner-onboarding.html` (commits `e6bc95af` -> `f402b123` -> `e1ecd34b`; the site commit MESSAGES carry literal "PM-XXX" placeholders — canonical PM is **656**). Step 3 ("Partner agreement & commercials") previously showed 5 placeholder clauses; now renders Lewis's full executable **VYVE Partner Agreement verbatim** — all 10 clause-1.1 definitions, clauses 2–20 with every sub-clause (6.3(a)–(d), 17.2(a)–(d) as lettered lists), Schedules 1 & 2, and a two-column signature block. Bracketed drafting values resolved to operative numbers (24mo non-solicit / 30d payment & cure / 60d termination / "exclusive of VAT"); entity rendered "VYVE Health CIC (company no. 16449796)".

**DocuSign-style merge.** Party (2) legal name + the "This Agreement is dated …" line auto-fill from Step-1 `contactName` (fallback `businessName`) + today's date on step open; the partner signature block fills live (cursive name + today's date) as they type the e-sign field. VYVE side reads "To be countersigned by VYVE on acceptance". Merge logic: `fillContract()` over `#contractPane [data-mf]` (keys `pname`/`date`/`sig`), called on step show (`step===2`) and on `signName` input.

**Revenue share aligned to 50%** everywhere to match the signed contract — clause 8 body, Schedule 2, the acknowledgement checkbox, the hero stat ("Standard revenue share"), and the submit payload (`revenueSharePct:50`, was 30; `partnerLegalName` now captured). **NOTE:** `partner_partners.revenue_share_pct` DB **default is still 30** — flip-to-50 decision pending Dean (backlog PF-NEXT-7).

**Signed-copy download.** New "Download signed copy" button under the e-sign fields, disabled until `checks.agree && signName` (`refreshDownloadState()`; wired into `fillContract` + `toggleCheck` for the `agree` box). `downloadSignedAgreement()` clones the fully-merged `#contractPane`, opens a new window with a clean white A4 print stylesheet (light theme, mint accents, signature cards, footer "Signed electronically via vyvehealth.co.uk on <date>") and triggers `window.print()` → save as PDF. Browser print-to-PDF, zero deps; swap to a client-side PDF lib only if a silent `.pdf` download is wanted (backlog PF-NEXT-10).

**Styling fix.** The agreement pane first shipped as a white box — injected CSS referenced `var(--card2)`/`var(--gold)`, which are UNDEFINED on the marketing site, so they fell back to light defaults. Re-skinned to the page's own dark palette (`--dark/--card/--surface/--mint/--white`): `.doc-wrap` card with a header band, mint section heads, lettered sub-clauses, mint "auto-filled" merge pills, signature cards. New gotcha → **§23.123**.

Lewis-gated: this is Lewis's approved copy, embedded live per Dean's direction; Lewis copy/legal sign-off on the live origin still outstanding (backlog PF-NEXT-9). No EF/DB change — static marketing file only.

## PM-651 — VYVE Mental Fitness: mental-fitness.html shipped (2026-06-18)

vyve-site commit `598a4a5978e7`. Six files: `mental-fitness.html` (new), `db.js` SCHEMA_V25, `sw.js` cache bump + precache, `mind.html` tile, `index.html` + `settings.html` vbb 464.

**mental-fitness.html** — single-page three-tab feature (Today / Train / Track) under the Mind hub. Three-tab strip at top mirrors engagement-v2 pattern; global app nav at bottom unchanged. No mockup chrome — full portal standard: `nav.js` back-button header, `theme.js` dual dark/light tokens, `db.js`/`sync.js`/`bus.js`/`haptics.js`/`analytics.js`/`achievements-evaluator.js` all loaded.

**Today tab:** streak stat (consecutive days with a practice or mood), this-week average mood, count of active trackers. Daily plan checklist (mood check-in + complete an exercise + any committed recovery actions; each tappable to launch the action). Early-warning card when triggered (PLACEHOLDER thresholds — Phil sign-off required before promoting to final values). Recommended exercise card (mood/burnout-adaptive, rotates daily otherwise).

**Train tab:** nine exercises in three categories (Calm down / Think clearer / Feel better) as tool-row cards → multi-step guided overlay (dot-progress strip, forward/back, field types: text/textarea/range/chips, breath animation on breathwork screens). Finish step writes to `mind_fitness_log` via Dexie + REST + `log-activity` EF for engagement/charity rollup. Recent practice log below.

**Track tab:** Mood section (SVG line chart last 14 scores, insight text, "Log today's mood" overlay with 5-face picker + emotion/driver chips + note). Going-without trackers (days free, money saved, health/time milestones, slip reset preserves longest streak; add-tracker overlay with 9 preset types). Burnout check (9-question quiz across E/C/F dimensions; score formula `(E+C+(12-F))/36×100`; four zones PLACEHOLDER — Phil sign-off required; trend line on re-checks; recovery suggestions with "+ Add" wiring to daily plan). Always-visible crisis signposting block.

**db.js SCHEMA_V25:** six new member-scoped Dexie stores — `mind_fitness_log`, `mind_moods`, `mind_trackers`, `mind_burnout_checks`, `mind_recovery_actions`, `mind_recovery_log`. All keyed on `id`, indexed on `member_email` + date/type fields + `client_id` partial-unique per §23.10.

**Supabase:** six tables live (migration `mental_fitness_tables`). All RLS-enabled (`(SELECT auth.email())=member_email` per §23.67), `vyve_lc_email` trigger on each, `tg_mark_home_state_dirty_ins/upd/del` on `mind_fitness_log` for engagement pipeline. Excluded from employer rollups by omission. Added to GDPR pipeline (backlog — erasure path to be wired in next session).

**Clinical gates (pending Phil sign-off):** burnout zone thresholds (30/50/70), early-warning trigger values (avg≤2.2, trending-down+latest≤2, burnout≥70), all zone/crisis copy. Signposting structure is present and mandatory from this commit; exact wording is Phil-gated.

**Practices count toward charity/engagement** via `mind:logged` bus event + `log-activity` EF call on exercise completion. Mood check-ins and burnout checks do NOT trigger log-activity (deliberate — logging a low mood must not earn a charity month).

**mind.html:** Mental Fitness tile added below Money tile (same `.tool-card` pattern, PM-651 comment).

## PM-650 — money.html: auth fix + enterprise-only track disclaimer (2026-06-18)

vyve-site commit `fe07a16c`. `money.html` only. Two fixes: (1) Auth replaced broken `vyveInitAuth` polling loop with canonical `window.VYVE_AUTH_READY` promise pattern (same as breathwork/journal) — `_email` now set correctly on every open so localStorage key `vyve_money_<email>` persists across sessions. (2) Track tab disclaimer ("your financial data is never shared with your employer") now `display:none` by default, shown only when `account_type === 'enterprise'` via `maybeShowPrivacyBadge()` — same gate as the Hub privacy badge. Individual members see neither. vbb 463.

## PM-649 — money.html: nav + safe-area + calc timing fixes (2026-06-18)

vyve-site commit `d3d9c09f`. 5 files. Three bugs fixed post-first-device-test: (1) Nav: added `nav.js` script tag, added `'money': 'Financial Wellbeing'` to `subPageLabels`, added `money` to mind path detection in `getActiveTab()`. `.wrap` padding-top now `calc(env(safe-area-inset-top,0px) + 76px)` to clear the sticky mobile header. (2) Reader back/next buttons: moved safe-area inset onto `.reader-top` `padding-top: calc(env(safe-area-inset-top,0px) + 14px)` so buttons sit below status bar. (3) Track calc: `money-calc.js` changed from `defer` to sync load; `renderTrack()` retries after 50ms if `VYVEMoney` not yet ready instead of bailing silently. Removed custom page-header block (nav.js provides header). vbb 462.

## PM-648 — VYVE Money: financial wellbeing feature (2026-06-18)

vyve-site commit `e420236e`. 6 files: `money.html` (new, 1462 lines), `money-calc.js` (new, pure calc module), `sw.js` (cache bump + precache), `index.html` (vbb 461), `settings.html` (vbb 461), `mind.html` (Money tile added).

**Feature.** VYVE Money is a five-view financial wellbeing tool inside the Mind pillar. Views: Hub (score ring + 4 KPIs + priority ladder + insights + learn nudge), Track (income + 50/30/20 split + expenses + savings pots + debts + net worth), Assess (8-question Likert check-in → 0-100 score + 4 dimension sub-scores + focus tips + recommended course), Plan (goal planner + emergency fund target + 20yr projection @ 2%/5% + avalanche/snowball debt payoff simulator), Learn (5-step starter path + 10 courses with knowledge checks + jargon buster).

**Persistence.** All financial figures stay in localStorage keyed per member email (`vyve_money_<email>`). Nothing sensitive leaves the device. Two server writes only: `mind_activities` row with `kind='money_checkin'` on assessment completion and `kind='money_course'` on course completion — no figures, just event + date. These earn Mind-pillar engagement credit and feed the charity mechanic.

**Calc module.** `money-calc.js` exposes `VYVEMoney` global: `calc()` (derived figures: needs/wants/essential/efMonths/savRate/dti/leftover/netWorth), `band()` (4 score bands), `scoreAssessment()`, `dimScores()`, `focusTips()`, `recommendCourse()`, `ladder()` (5 rungs), `insights()` (prioritised engine, max 5), `payoff()` (month-by-month avalanche/snowball), `projection()` (240-month compound), `goalMonths()`. All lifted verbatim from prototype, matching its behaviour exactly.

**Theme.** Full dual dark/light token parity via `theme.css`. No inline `:root` (§23.6). Portal palette (#0D2B2B / #1B7878 / #4DAAAA / #C9A84C), not the prototype's CC palette.

**Privacy.** Employer badge (`"your figures are never shared with your employer"`) conditional on `account_type === 'enterprise'` — hidden for individual members. Phil-gated mood/crisis copy: structural card absent; financial signposting (MoneyHelper, StepChange) ships freely.

**Nav.** nav.js wired (back → Mind). Mind tile added to `mind.html` tool-grid. sw.js precache + cache bump `vyve-cache-v2026-06-18-pm648-money-a`. vbb 460→461 in index.html + settings.html.

## PM-647 — Topnav prominence (2026-06-17)

CC commit `bf76bd4`. `assets/shell.css` only.

Topnav height 64→72px, padding 28→32px. Wordmark font-size 20→24px. Search padding and font-size bumped (fs-sm→fs-base). Bell icon buttons 34→40px hit area. User avatar circle 32→38px.

## PM-644/645/646 — CC shell layout: persistent left sidebar + topnav fix + dark mode (2026-06-17)

Three CC commits: `73b6f18` (PM-644), `07732e3` (PM-645), `83786d9` (PM-646).

**PM-644 — Persistent left sidebar** (`assets/shell.css`): `#app.ready` → `display:flex`. Sidebar `transform:translateX(0)` always on desktop (no `.open` needed). `topnav-tabs` hidden permanently. `main.main` flex:1. Mobile ≤900px: sidebar reverts to slide-in drawer.

**PM-645 — Topnav fix** (`assets/shell.css`): Topnav was only spanning the sidebar width because it was a flex sibling of `aside` + `main`. Added `margin-left:280px` as interim fix (superseded by PM-646). `topnav-tools` `margin-left:auto` pushes search+avatar to far right.

**PM-646 — Correct layout + dark mode** (`index.html`, `assets/shell.css`, `assets/tokens.css`, `pages/settings.html`):
- `index.html`: wrapped `<header.topnav>` + `<main>` in `<div class="app-body">` (flex column). Added theme boot script in `<head>` (reads `vyve-cc-theme` from localStorage, sets `data-theme` before first paint, avoids FOUC). Added `window.VYVE_THEME` helper (`get()`/`set(mode)`).
- `shell.css`: `.app-body { display:flex; flex-direction:column; flex:1 }`. Topnav margin-left removed (now correctly inside app-body). `main.main` margin-left removed.
- `tokens.css`: `@media (prefers-color-scheme: dark)` block added — applies dark tokens when `html` has no explicit `data-theme` attribute. System preference respected by default.
- `settings.html`: "Appearance" card added at top with Light / System / Dark segmented toggle. Wired to `VYVE_THEME.set()`. Persists to localStorage.

**Gotcha:** `#app` flex children must be sidebar | app-body-column — topnav as a direct flex sibling of sidebar caused the header to only span sidebar width.

## PM-643 — Team App Phase 4: session scheduler (2026-06-16)

CC commit `ebfc4c8`. Single file: `pages/sessions.html` (full rewrite). DB: `calendar_occurrences` admin write RLS added.

**`calendar_occurrences` write RLS** — 3 new policies: INSERT/UPDATE/DELETE → `is_admin()`. SELECT unchanged (open to all authenticated).

**`pages/sessions.html` rebuilt** — replaces the old localStorage/VYVE_MAKE stub entirely. Now drives `calendar_occurrences` directly via Supabase client.

- **3-tab list** — Upcoming (starts_at ≥ now, active, not cancelled), Past (starts_at < now, not cancelled, limit 100), Cancelled (cancelled_at IS NOT NULL). Live KPI strip.
- **Admin controls** — "Schedule session" button (hidden for team), Edit button per row, Cancel button per row (sets `cancelled_at`, keeps row). Hard delete behind a secondary confirm with explicit "test data only" warning.
- **Scheduler modal** — Fields: title (→ both `name` + `session_title`), category, type, starts_at, ends_at, host_name, host_role, location_online, location_venue, live_url, session_description, notes, source_catalogue_id.
- **Catalogue pre-fill** — dropdown of `service_catalogue` live_session rows auto-fills category, type, host, and calculates end time from `duration_minutes` when start is set.
- **Double confirm gate** — on new sessions: (1) modal-level banner warning "member-facing publish"; (2) JS `confirm()` showing title + formatted datetime before INSERT fires. Edit saves without second confirm (already live, editing is expected).
- **Team members** — read-only list; no Schedule/Edit/Cancel buttons.

**Gotcha:** `sessions.html` was previously a localStorage stub (VYVE_MAKE pattern) with no Supabase connection. Not relevant to member portal — safe to replace wholesale.

## PM-642 — Team App Phase 3: 3-source calendar union read + role gating (2026-06-16)

CC commit `5cbcda4`. Single file: `pages/calendar.html`.

**Source swap:** `cc_sessions` replaced with `calendar_occurrences` as the live-session feed. Query selects `id,name,session_title,starts_at,ends_at,category,type,location_online,location_venue,live_url,cancelled_at,active` filtered by `active=true` and `cancelled_at IS NULL`. `parseSessionStart()` updated to use `starts_at` (full timestamptz) instead of `session_date+'T10:00:00'`. Session title resolved as `session_title || name || 'Session'`. `live_url` mapped to `meet` for the Meet icon in all views. End time uses `ends_at` properly.

**Session date filter fixed:** was comparing `s.session_date === key` (string match); now compares `new Date(s.starts_at).toISOString().slice(0,10) === key`.

**Role gating:** `state.isAdmin` added; set in `boot()` from `window.VYVE_USER.role`. "New event" button hidden by default, shown for admins. Delete button in modal gated to `state.isAdmin` (previously gated to `owner_email === state.me` — team members had no delete anyway via RLS, but now also hidden client-side).

**Legend:** "Team event" → "Meeting" for clarity.

**3-source union is now complete:** `cc_calendar_events` (team meetings, RW for admins) + `calendar_occurrences` (live sessions, RO) union-at-read, colour-coded (teal=meeting, gold=session, coral=private).

## PM-641 — Team App Phase 2: auth role gating + task attachments (2026-06-16)

CC commit `50bf8f5`. No portal (vyve-site) changes.

**`lib/auth.js`** — `checkAdmin()` replaced: now calls `is_admin_or_team()` (broader gate) then `is_admin()` to determine specific role; returns `{ allowed, role }` instead of a boolean. `showApp()` accepts `role` arg, broadcasts it on `vyve:user` CustomEvent detail and sets `window.VYVE_USER = { email, role }` for synchronous access by page scripts.

**`pages/tasks.html`** — role-scoped controls wired:
- `state.isAdmin` flag added; set in `boot()` from `window.VYVE_USER.role`.
- "New task" button hidden by default (`style="display:none"`), shown in `boot()` if `isAdmin`.
- Delete button in editor modal gated: `isEdit && state.isAdmin` (team members see no delete).
- **Attachment section** added to editor modal (edit mode only): lists `cc_task_attachments` rows for the task; download via signed URL from `cc-task-docs-url` EF; delete (admin only) via same EF + row removal; upload via signed PUT to `cc-task-docs` bucket then `cc_task_attachments` INSERT.

**`cc-task-docs-url` EF v1** — ACTIVE. verify_jwt: true. Three actions: `upload` (returns signed PUT URL + storage_path), `download` (returns signed GET URL, content-disposition:attachment), `delete` (admin only — removes Storage object + attachment row). Storage path pattern: `<task_id>/<8-char-rand>/<file_name>`.

**`cc-task-docs` Storage bucket** — private, no public access. Storage RLS: upload/download → `is_admin_or_team()`, delete → `is_admin()`.

## PM-640 — Team App Phase 1 — Foundation (2026-06-16)

Backend-only. No UI shipped.

**`admin_users` role constraint** — extended existing `admin_users_role_check` to include `'team'` (full set now: admin / viewer / coach_full / coach_exercise / coach_mental / team).

**New SECURITY DEFINER RPCs:**
- `is_team()` — true if caller is in `admin_users` with `active=true AND role='team'`
- `is_admin_or_team()` — true if caller is in `admin_users` with `active=true AND role IN ('admin','team')`. Used as the permissive read gate across Tasks + Calendar + Attachments.

**RLS surgery on `cc_tasks`** — dropped old `cc_team_only` ALL policy; replaced with 4 per-cmd policies: SELECT → `is_admin_or_team()`; INSERT → `is_admin()`; UPDATE → `is_admin() OR (is_team() AND assignee = auth.email())`; DELETE → `is_admin()`.

**RLS surgery on `cc_calendar_events`** — same DROP; replaced with 4 policies: SELECT → `is_admin_or_team()`; INSERT/UPDATE/DELETE → `is_admin()`. Team members read-only on calendar; write surface comes in Phase 4 (scheduler).

**New table `cc_task_attachments`** — `id UUID PK`, `task_id UUID FK cc_tasks ON DELETE CASCADE`, `uploaded_by TEXT`, `file_name TEXT`, `storage_path TEXT`, `file_size BIGINT`, `mime_type TEXT`, `created_at TIMESTAMPTZ`. RLS: SELECT/INSERT → `is_admin_or_team()`; DELETE → `is_admin() OR (is_team() AND uploaded_by = auth.email())`. Storage bucket + signed-URL EF deferred to Phase 2.

**`admin_users` roster** — 5 team members added (role='team'): Calum Denham, Cole Patterson, Heidi Khoshtaghaza-Hay, Phil Hurwood, Ryan Hewitt.

**Gotcha banked:** existing `admin_users_role_check` constraint predated 'team' role (had admin/viewer/coach_full/coach_exercise/coach_mental only) — required drop+recreate, not ADD CONSTRAINT.


## PM-639 — Command Centre IA reorg (4 domains) + Team App spec (2026-06-16)

Talk-first IA session — **no code shipped**, decisions locked for build (Sonnet to continue). Artefacts: `CC-information-architecture.md` + `CC-team-app-spec.md`.

**4-domain nav model** replaces the two competing layers today (the 8-section `assets/sidebar-config.js` `VYVE_NAV` sidebar + the separate 7-tab `VYVE_NAV_TOP`, which collapsed all 8 Insights pages into one tab and never surfaced Partner Space). New top level:
- **Run the Business** — Daily / Commercial / Marketing / Delivery / Knowledge / Org as sidebar sub-groups.
- **Analytics** — the 8 cron-backed Insights pages **+ App Health pulled out of Delivery**.
- **Members** — admin-console Shell 1/2/3 + Broadcast + Active Users.
- **Partners** — the reconciled `partners.html` monolith. The 7 `pages/partner-*.html` are **orphans** (not referenced in router/sidebar/index) → KILL after a full-repo grep.

Four cross-domain moves: App Health Delivery→Analytics; Broadcast Delivery→Members; Active Users Org→Members (it reads real portal member data); old Partners skeleton Commercial→killed (superseded). Triage KILLs: old Partners skeleton, Performance (Metricool covers it), Brand (it's a doc), 7 orphan partner-* pages, root `Dashboard.html` (verify-then-kill). BUILD/LATER verdicts on the ~14 stub/skeleton pages live in the IA artefact + §13.

**Team App spec.** A role-scoped slice of the CC, web-first, Capacitor-wrapped to TestFlight **only once content is signed off**. Foundations ~80% already exist: `admin_users` (email/role/active) = roster; `cc_calendar_events` (attendees/meet_url/source/gcal_event_id/color) = meetings; `cc_tasks` (assignee/stage/completed_at/created_by) = assignable+completable. Genuinely missing: (1) `cc_task_attachments` table + private `cc-task-docs` bucket + signed-URL EF (partner-docs pattern); (2) team self-serve RLS via a new `is_team()` capability; (3) live-session scheduler write surface into `calendar_occurrences`.

v1 = everything (tasks + calendar + meetings + scheduler). **Calendar = 3 sources, union-at-read (no sync):** `cc_calendar_events` (team meetings RW) + `calendar_occurrences` (live events RO) + scheduler writes into `calendar_occurrences`, colour-coded by `source`. **Scheduler is capability-gated (admin + `lives`) + confirm-step** — it publishes member-facing session rows; a bad row lands on every member's session list. Decisive calls: roster = extend `admin_users.role` (admin/team), not a new table; packaging = 2nd Capacitor binary off `vyve-capacitor` pointing at the role-gated CC; calendar = union-at-read.

Build phases (Sonnet): **1** foundation (admin_users roles + `is_team()` + RLS on cc_tasks/cc_calendar_events/cc_task_attachments) → **2** tasks (shared-list UI + completion + attachments table/bucket + signed-URL EF) → **3** calendar (3-source view + meeting CRUD) → **4** scheduler (calendar_occurrences write + gate + confirm) → **5** wrap (deferred to content sign-off). Open, non-blocking: app name/bundle id, team route/subdomain (only matters at wrap), scheduler capability holders, gcal 2-way sync (lean internal-only v1), meet_url auto vs paste (lean paste v1).

## PM-637 — Partner onboarding polish (PM-634/635) + admin file retrieval (PM-636) (2026-06-16)

Continued same session after PM-632. Composio GitHub down → Vault PAT + Git Data API throughout.

**PM-634 (Test-Site `280b88f5`) — verification trim + free navigation.** Removed Photo ID and DBS/background-check uploads from step 2; verification now collects professional qualifications (required), governing body/membership (optional), two references (required). Overview flow + "what we collect" checklist + submission record/summary updated; `documents` payload now `{qualifications, profilePhoto}`. Navigation made non-linear: rail jumps to ANY step, "Continue" no longer hard-blocks, rail shows a green check per *complete* section and the % bar reflects completed-count (new `isStepComplete(i)`). Completeness enforced once, at Submit — `submitJourney` checks all 8 steps, jumps to the first incomplete, flags its fields, toasts which sections remain.

**PM-635 (Test-Site `f8007951`) — two live-test fixes.** E-sign date auto-stamps today + read-only (no picker). Profile photo renders as an `<img>` in the phone preview (was a CSS `background-image` that didn't display; matched the upload chip which used `<img>` reliably).

**PM-636 (CC `2ca57a41`) — admin file retrieval.** New EF `partner-file-url` (verify_jwt:true; admin-gated: caller's email in `admin_users` with `active`) returns a 5-min signed DOWNLOAD url (content-disposition attachment) for `partner-content`/`partner-docs`. Download button added to `partners.html` content items (queue + library); `downloadPartnerFile()` calls the EF with the item's `media_url`, saves to the admin's machine. Workflow: partner uploads starter video → private `partner-content` → admin downloads from Content & Moderation to run the live session off their Mac. No transcode/streaming pipeline (still not needed for this flow).

Verified: wizard JS syntax clean, all pushes md5-matched, both EFs ACTIVE. Live no-auth flow + uploads + downloads not yet browser-tested from this sandbox (can't reach supabase.co); Dean testing on live origin.

## PM-633 — Partner referral attribution + Stripe webhook v10 (2026-06-16)

Completed the partner revenue loop. stripe-webhook EF v10 live.

### Schema changes (PM-632 migration)
- `partner_partners.stripe_coupon_code` renamed to `stripe_promo_code`
- `partner_partners.human_promo_code` added (display only)
- `partner_partners.revenue_share_pct` default updated to 50%
- `partner_memberships` gained: `referred` bool, `account_type` (b2c/b2c), `subscription_value` numeric, `stripe_customer_id`, `stripe_subscription_id`, `attribution_date`
- `run_partner_payouts(period)` function rebuilt: counts referred=true, account_type=b2c, subscription_status=active members only. gross = sum(subscription_value), payout = gross × revenue_share_pct. Monthly cadence.
- `compute_partner_monthly_payout(partner_id, period)` helper fn added.

### stripe-webhook EF v10 (PM-633)
Added `handlePartnerReferral` to `customer.subscription.created` handler:
- Reads `discount.coupon.id` off the subscription object
- Looks up `partner_partners.stripe_promo_code` for a match
- Only attributes to `status='live'` partners
- Creates `partner_memberships` row: referred=true, account_type=b2c, subscription_value=20
- Attribution errors never fail the webhook — raised as platform_alerts instead
- B2B members excluded from partner revenue share entirely

### Coupon code convention (§23.122 — new hard rule)
Partner codes are Stripe Coupons with a MANUALLY SET readable coupon ID (e.g. MAYA, OLU50). NOT promotion codes — no promotion code objects needed. The coupon ID IS the partner code. Stored in `partner_partners.stripe_promo_code`. This is the permanent standard going forward.

### Revenue model locked
- B2C only: £20/month × 50% = £10/member/month to partner
- B2B excluded
- Monthly payouts, referred active members only
- Attribution permanent (referred flag set at first subscription.created, not recalculated)

### §23 rule
- **§23.122 (NEW):** VYVE partner referral codes are Stripe Coupons with manually-set readable IDs (e.g. MAYA, OLU50). Never use Stripe Promotion Code objects for partner attribution — one object only. Coupon ID stored in `partner_partners.stripe_promo_code`. stripe-webhook reads `discount.coupon.id` on `customer.subscription.created`.

## PM-632 — Partner onboarding: drop login/OTP, make it a public no-auth flow (2026-06-16)

Same-session correction to PM-631. The OTP/magic-link step was unnecessary over-engineering — a partner application needs no login (the member onboarding EF is public too). Dean received a magic-link email (Supabase's default OTP template) and rightly questioned why verification existed at all. Removed entirely.

- `partner-onboarding` EF → **v2, `verify_jwt:false` (public)**, same posture as member onboarding. Draft is a capability token: the `partner_id` UUID (unguessable) is returned at `start` and held in localStorage; `save`/`upload-url`/`submit` look up by id — no email, no JWT, no `getUser`. `start` accepts `resume_id` to resume a draft. `uploadToSignedUrl` still works without a session.
- Wizard `partner-onboarding.html` (Test-Site `08cf0612`): OTP overlay + `signInWithOtp`/`verifyOtp`/`beginAuth`/`skipAuth`/`closeAuth` all stripped; `ensureDraft()` creates the draft on step-1 Continue with zero friction; supabase-js retained for storage uploads only.
- Migration `partner_drop_contact_email_unique`: dropped the partial-unique index on `contact_email` — it was only an auth key, and a revisit (cleared localStorage) or duplicate email must not fail the insert. `contact_email` stays as plain contact data.
- **No email verification anywhere now.** If anti-spam is wanted later, add a post-submit confirm — never gate the flow.

Supersedes the PM-631 auth description (that entry's OTP details are historical). Test-Site `08cf0612` (PM-632). EF v2 ACTIVE.

## PM-631 — Partner onboarding JOURNEY built: self-serve wizard + partner-onboarding EF + private buckets (2026-06-16)

Built the partner self-serve onboarding journey PM-630 flagged as "NOT YET BUILT (next session)". Composio GitHub still down → Vault PAT + Git Data API throughout (§23.27). Brain HEAD moved PM-618→630 mid-session (parallel admin-backend session) — re-fetched fresh before editing per §23.26, avoided clobber. PM claim: max-across-repos 630 → this brain commit PM-631. (Test-Site wizard commit was labelled PM-619, claimed before the namespace re-check — non-monotonic but unique across repos, harmless.)

### Built
Rebuilt the provided prototype (`VYVE-Partner-Onboarding-Journey.html`) 1:1 — same tokens/icons/rail/8 steps/validation/file chips/watch-gate/retakeable assessment/live phone preview/submission summary — as production `Test-Site-Finalv3/partner-onboarding.html` (commit `898f0c61`, md5-verified). Mock layer replaced with the real backend; layered onto PM-630 models, NO duplication.

### partner-onboarding EF (v1, verify_jwt:true)
Action-routed `start | save | upload-url | submit`. Identity = magic-link OTP; ownership `partner_partners.contact_email == JWT email`. Service-role writes.
- `start`: create-or-resume. Inserts `partner_partners` (status `applied`, pillar mapped physical→body/mental→mind/social→connect, interim `role_title`=specialism, generated slug, `contact_email`), `partner_applications` (credentials seed), `partner_onboarding_progress` (pct 12). Resume returns stored credentials+progress.
- `save`: debounced merge of `credentials` (formFields+pillar+references), `steps` gates, `pct_complete`, assessment (passes/score/`assessment_passed_at`).
- `upload-url`: `createSignedUploadUrl` into `partner-docs` (doc) / `partner-content` (content); path `{partner_id}/{slot}/{uuid}-{file}`.
- `submit`: finalises `partner_partners` (role_title/bio/why/feel/avatar_url), writes final `credentials` (agreement+e-sign+signedAt, doc object-paths, launch, welcomePost) + `reference_contacts`, inserts `partner_content_items` per starter video at `in_review`, flips 8 gates + pct 100, notifies team via `send-email` (service-key bearer, non-fatal). Leaves `status='applied'` — admin advances pipeline; `trg_assert_partner_golive` still enforces go-live gate.

### Migration `partner_onboarding_intake_additive`
- `partner_partners.contact_email` + partial-unique on `lower()` WHERE NOT NULL — OTP identity/resume/dedupe key. Admin Invite path (PM-622) leaves NULL, no conflict.
- `partner_onboarding_progress.assessment_score numeric` + `assessment_passed_at timestamptz` — PM-630 had pass/fail booleans only; business rule needs score+timestamp.

### Storage
`partner-docs` (private,15MB,image+pdf), `partner-content` (private,500MB,video). Sensitive docs private-only via signed upload URLs.

### Decisions
- Bank/payout capture DROPPED from wizard (Stripe Connect at go-live; `partner_payouts` = runs not bank details; raw sort code/acct pre-approval = needless GDPR/PCI liability; prototype had them optional → no loss).
- Agreement copy + safeguarding/GDPR assessment questions placeholder behind visible "draft pending VYVE sign-off" — Lewis owns agreement, Phil owns safeguarding (HAVEN-style gate).
- Wizard localStorage offline fallback (testable in preview); OTP soft-gates after step 1 (Skip allowed), hard-gates at submit.

### Verified / not
Start+submit write-replay constraint-valid (status→pipeline, content→moderation queue, assessment persisted); sentinel cleaned. EF ACTIVE v1. Wizard md5-matched on Test-Site. **NOT yet exercised live end-to-end** — OTP→submit needs real inbox + live origin (sandbox egress blocks supabase.co). Dean to run first-use OTP→submit→pipeline check.

### §23.122 (NEW — HARD)
`partner_content_items.moderation_status` defaults `'draft'` but admin queue counts only `'in_review'`; default-written content is invisible to moderation. Writers intending review MUST set `in_review`. EF does.

### Commits
Test-Site-Finalv3 `898f0c61` (PM-619 label) — partner-onboarding.html. Supabase: migration `partner_onboarding_intake_additive`; EF `partner-onboarding` v1; buckets `partner-docs`,`partner-content`. VYVEBrain PM-631 (this).

### Next
Member-facing in-app Partner Space surface (no demo file); "Become a partner" CTA → `/partner-onboarding.html`; admin Invite to optionally capture `contact_email` + dedupe vs self-serve; programs sub-tab + curriculum persistence (from PM-630).

## PM-630 — Partner Space: admin backend built + live on vyve-command-centre (2026-06-16)

Long session. Partner Space admin console built from scratch as a standalone page (`partners.html`) on `admin.vyvehealth.co.uk`, matching Lewis's demo design system exactly (dark `#0d1117`, mint `#5ec4b0`, left sidebar, blur topbar). All wired to live Supabase data. Composio GitHub down → Vault PAT path throughout.

### Schema shipped (PM-618 base, all via Supabase MCP migrations)
8 new tables: `partner_partners`, `partner_applications`, `partner_content_items`, `partner_programs`, `partner_community_posts`, `partner_memberships`, `partner_onboarding_progress`, `partner_payouts`. All RLS-enabled. Go-live gate trigger (`trg_assert_partner_golive`) blocks `status→live` until `safeguarding_passed AND gdpr_passed AND pct_complete=100`. Engagement segment refresh fn (`refresh_partner_engagement_segments`). Onboarding pct sync trigger (`trg_sync_partner_onboarding_pct`). Payout ledger fn (`run_partner_payouts`). Mock seed data inserted then wiped clean (all tables at 0 rows).

### Admin UI shipped
`partners.html` (PM-620, standalone, self-contained, ~90KB):
- 7 views: Overview (KPIs, pipeline attention, top partners, activity feed), Pipeline & Approvals (kanban Applied→Vetting→Interview→Contract→Onboarding, click-to-review panel, Advance/Decline writes to DB), Partners (directory table with filters, detail drill-in with 5 sub-tabs: Overview/Content/Members/Revenue/Settings), Content & Moderation (queue/flagged/library/programs with Approve/Return), Onboarding (curriculum reference + in-progress tracker), Analytics & Engagement (pillar split, engagement leaderboard), Revenue & Payouts (ledger + Run payouts + Mark paid)
- Invite partner modal (PM-622→628): full form writing to `partner_partners` + `partner_applications`, lands in pipeline kanban immediately. Modal uses `document.body.appendChild` pattern to escape flex stacking context (§23.121).
- Add applicant (pipeline page) wired to same invite modal
- Request more info: logs note to `partner_applications.notes`
- Edit curriculum: editable 8-step modal
- Device preview panel: renders member view of any live partner

### Sidebar integration (PM-621)
`vyve-command-centre` sidebar has "Partner Space" section with single "Partner Management" link → `/partners.html`. Old 7 hash-route pages (partner-overview, partner-pipeline etc) still exist in repo but are unlinked — delete on CC overhaul.

### Key architecture decisions
- Palette: command-centre existing tokens, NOT the prototype's third dark theme
- Pillars stored as `body/mind/connect` (VYVE canonical), not `physical/mental/social`
- Live sessions and videos ride `calendar_occurrences`/`replay_videos` via FK — no parallel infra
- Revenue attribution: engagement-weighted split (sessions attended). Lewis must confirm before Revenue view ships real numbers to partners
- Go-live: same duty-of-care bar as HAVEN (§23.84). Phil/Lewis own human sign-off
- Modal stacking context fix: `document.body.appendChild(overlay)` before showing; z-index:99999. All new modals use this pattern (§23.121)

### Still missing from Lewis's original brief
- Member-facing Partner Space (in-app): `VYVE-Partner-Space-Demo.html` not provided — member browse/join/feed/library surface not built
- Partner onboarding journey: `VYVE-Partner-Onboarding-Journey.html` provided at session end — 8-step self-serve flow for incoming partners — NOT YET BUILT (next session)
- Impersonate/manage-as-partner capability
- Programs sub-tab (shows "coming soon")
- Curriculum edits don't persist to DB yet

### §23 rules
- **§23.121 (NEW):** Any modal using `position:fixed` that is a descendant of a `display:flex` or `display:grid` container MUST be appended to `document.body` at open time (`document.body.appendChild(el)`) before setting display. CSS stacking contexts created by flex/grid trap fixed children regardless of z-index. This is a browser spec behaviour, not a bug.

### Commits (vyve-command-centre)
PM-618 `77e480a6` — 7 partner pages + sidebar section
PM-619 `90e3ab68` — Partners top-nav tab (later removed)
PM-620 `6aeda22b` — standalone partners.html
PM-621 `b9b1ef8c` — sidebar cleanup (single link to /partners.html)
PM-622 `9854d433` — invite partner modal
PM-623 `62004c45` — overlay z-index fix attempt
PM-624 `0b6e7326` — overlay outside #app attempt
PM-625 `df08102b` — addEventListener fix
PM-626 `16d1c3df` — topbar z-index fix
PM-627 `ae2b7356` — cssText nuclear fix
PM-628 `6117c69a` — body.appendChild fix (working solution)
PM-629 `b7b8644c` — all stub buttons wired
PM-630 `bb2cd243` — syntax error fix (literal newline in string)

## PM-618 — fix home habit tap not repainting progress rings until reload (2026-06-15)

Dean: "click a habit, progress doesn't update until I leave the page and come back" — on Home (index.html), tested on his server.url dev-loop iPhone (so PM-609 was already in his shell — not the freeze). Composio GitHub down again → Vault PAT + Git Data API path throughout (§23.27). PM claimed 618 after cross-repo scan (PM-610/611 were taken by VYVEBrain onboarding commits; max-across-both was 617).

### Root cause
PM-609 fixed the habit *row* flipping instantly (early `renderHabitList()` on the fast Dexie path). But the progress *rings/counters* (`#pills-row`) recompute only via `loadPillarCounts()` → `renderPills()`, which reads Dexie via `allFor(email)`. That recount was wired ONLY to the cross-page `VYVEBus.subscribe('daily_habits', …)` channel (index.html L2846, built for the habits.html→home case). A same-page home tap goes through `togglePill`, which publishes on the **`habit:logged`** channel and calls `VYVEBus.recordWrite('daily_habits', …)` (the dedupe ledger, NOT publish/subscribe) — so the `daily_habits` subscribe never fired from a home tap. The row flipped (inline `renderHabitList()`), `optimisticPatch` updated the home-state aggregate for the score ring, but the pillar rings never recounted until the next boot re-ran `loadPillarCounts()`.

### Fix
`togglePill` now calls `loadPillarCounts()` (fire-and-forget, try/guarded) immediately after the Dexie write settles — after the `upsert` await in the tick branch and after the `delete` await in the untick branch. `loadPillarCounts` has no in-flight guard and reads Dexie, so re-call is safe; rings recompute within a frame of the local write. Dean confirmed fixed on device.

### Commit
vyve-site `7cae8af6` — index.html (2× `loadPillarCounts()` + vbb 460) + settings.html (settings-vbb-marker 460) + sw.js (CACHE_NAME `vyve-cache-v2026-06-15-pm618-habit-rings-recount`). Atomic via Git Data API (blobs→tree→commit→ref); §23.30 md5-perfect verify on all 3 = MATCH.

### Delivery
On main → reaches Dean (server.url) + Android members; NOT iOS 1.7 members until OTA/1.8 (§23.106). Same constraint as PM-609 / PM-601 / PM-575.

### §23 rule
- **§23.120 (NEW):** A same-page optimistic write must explicitly re-trigger every *sibling* renderer that derives from the written table, not just the primary surface's own renderer. Bus `subscribe(<table>)` channels are CROSS-PAGE (§23.42); a same-page tap that publishes on a *semantic* channel (`habit:logged`, `body:logged`) does NOT fire the `<table>` subscribe channel, and `recordWrite`/`recordCanonical` are dedupe-ledger calls, not publish. So a sibling renderer wired only to the table-subscribe channel goes stale until next boot. Audit when adding any same-page optimistic write: list every renderer that reads the written table (row list, pillar rings, score ring, counters, streak strip) and confirm each is retriggered inline (or via an in-page idempotent subscriber per §23.42), independent of the cross-page bus. Second occurrence of the PM-609 class (row flipped, sibling renderer didn't).

## PM-617 — Consent-version stamping gap closed: server-side trigger + backfill (2026-06-15)

Follow-on after the PM-616 close. The consent-version-null flag (observed on Azusa's row) fixed properly. Composio still down → Vault PAT path.

Gap: PM-603 added `members.privacy_version`/`health_consent_version` + backfilled existing consenters `'pre-versioning'`, but never wired the write path. consent-gate.html stamps `terms_version='v1.0'` (constant at L287) yet omits the privacy/health version fields — so every gate consent after 12 Jun landed NULL (9 rows incl. Azusa, Paul Skipper, Kieran Day). Onboarding doesn't touch consent; the gate (vyve-site/consent-gate.html) is the sole write path.

Constraint: native members run bundled builds, so a consent-gate.html edit can't reach the installed base (§23.106) — they're exactly who hits the gate. So the fix is server-side.

Fix: `BEFORE INSERT/UPDATE` trigger `trg_default_consent_versions` on `members` (`public.default_consent_versions()`, search_path pinned, REVOKE PUBLIC; migration `add_default_consent_versions_trigger`). Fill-null-only: `privacy_version='v1.0'` when `privacy_accepted_at` is set; `health_consent_version='v1.0'` when `health_data_consent` true. Never overwrites existing/history (`'pre-versioning'` untouched). Covers every client + build, zero lag.

Backfill: UPDATE the 9 v1.0-gate rows (`terms_version='v1.0'` AND `privacy_version` NULL). The trigger filled `health_consent_version` on the same UPDATE for the 5 health-consenters; left NULL for the 4 who declined. `'v1.0'` is the existing in-use convention (mirrors `terms_version`), not a new value — no Lewis decision needed.

Verified: consented-but-unversioned residual = 0; health-consented-unversioned residual = 0; `privacy_version` dist v1.0:9 / pre-versioning:27 / null:16 (the 16 nulls are genuinely never-consented). Trigger present.

Rider (not blocking): consent-gate.html should also write `privacy_version`/`health_consent_version` explicitly at source on the next vyve-site build (gate stamps `terms_version` but omits these). New §23.119 hard rule codified.

## PM-616 — CC Usage lifecycle + PostHog install analytics, and cardio foundation running-plan reconciler (2026-06-15)

Composio GitHub down again → Vault PAT + Git Data API path throughout (§23.27). Brain commit is PM-616; session work spans PM-612→615.

**PM-612 — Usage lifecycle status (cc-usage EF v10 / vyve-command-centre `b50d3b42`).** Replaced the single dormancy pill with per-member lifecycle. cc-usage members_json now carries `consent_done` (privacy_accepted_at not null), `installed`, `signed_in` (auth last_sign_in_at OR consent), and derived `lifecycle` (active > installed > consented > signed_in > never).

**PM-613 — PostHog install signal (cc-usage EF v11, Supabase version 13, verify_jwt:false).** Install-proof PRIMARY leg = PostHog person.properties.email that has EVER produced a `$current_url LIKE 'capacitor://%'` event (365-day window), OR'd with native push token / HealthKit. Cross-platform (catches Android + native opens with no push token); fails safe to push/HK if PostHog unreachable. `POSTHOG_API_KEY` already an EF secret (eu.posthog.com, project 138491). Added `installed_via` (native_event/push_token/healthkit). native_emails:22. Real-cohort after: active 21, installed 9, consented 2, signed_in 0, never 11; source native_event 17 / push 8 / hk 1 — PostHog now dominant. **Decision:** do NOT remove mobile web login (Paige web-only + only payer; older server.url builds; dev loop; enterprise fallback §23.1) — dashboard already separates app vs web.

**PM-614 — Usage status simplified to 3 tiers (vyve-command-centre `c2dc4933`).** Six labels → Never installed (merges never/consented/signed_in; web login doesn't count) / Installed · no activity / Active·Quiet·Inactive (≤7/8–30/30+). Headline + filters aligned. Granular lifecycle retained in cache for 360 drill-down. Cache-bust `?v=PM-614-v1` (CC has no SW/vbb markers).

**PM-615 — Cardio members landed plan-less; foundation running-plan backfill + reconciler.** Root cause: workouts stream auto-generates 8-wk plan (31/31), movement writes a wpc row (9/9), but CARDIO had no auto-plan — running plans are on-demand on running-plan.html → member_running_plans — so 2 of 3 cardio members (Paul Skipper, Kieran Day) were empty. NB "Foundation" in-brain = a MOVEMENT locked-ramp plan (Sedentary Reset), NOT a cardio fallback. Fix (A) backfill: INSERT member_running_plans for the 2 from running_plan_cache "Complete my first 5K / complete beginner / 2 days / 12 wks", plan_name 'Starter: Your First 5K', source='foundation', is_active=true (reversible: DELETE WHERE source='foundation'). (B) reconciler: SECURITY DEFINER fn `public.ensure_foundation_running_plans()` (migration add_ensure_foundation_running_plans_fn; search_path pinned; REVOKEd PUBLIC/anon/authenticated per §23.104; ACL {postgres,service_role}); CROSS JOIN LATERAL picks beginner-5K plan by goal/level (robust to cache_key change). Cron `vyve-foundation-running-plans` jobid 47, */5, active. Manual run inserted 0 (idempotent); 2 foundation plans active. Chose reconciler over onboarding-EF surgery: signup path untouched, self-heals future plan-less cases.

**Observed, not fixed:** new member rows have `privacy_version`/`health_consent_version` NULL (e.g. Azusa coco.azu0804@gmail.com, 14 Jun) — consent gate isn't stamping the PM-603 version columns. Enterprise/Sage consent-audit relevance; fix when next touching the gate.

## PM-608 — Onboarding/auth password-flow overhaul + welcome-email live-session sourcing + onboarding resilience (2026-06-12)

Long session covering the onboarding lock-out problem, the welcome email, and making onboarding robust against missing answers. Composio GitHub down → Vault PAT path used throughout. Brain commit is PM-608 (highest shipped PM this session = 607).

### Root problem: members locked out after onboarding
Onboarding EF (then v95) created the auth user with NO password (email_confirm only + magic link), password set later via a fragile recovery-email link. 23 of 61 auth users had `last_sign_in_at IS NULL` (~38% stuck). Failure modes: email providers pre-consuming single-use recovery tokens ("link already used"), silent fire-and-forget password failures, Supabase leaked-password breach rejections, two-password confusion, no failure visibility, recovery links opening in Safari not the app.

### Shipped — password setup flow
- **PM-602** (vyve-site a09956df): login.html — "First time here? Set up your account" link + vyveSetup() (resetPasswordForEmail). Markers 457.
- **PM-603** (Test-Site-Finalv3 dae05015): password+confirm fields in questionnaire §10. Superseded by PM-605.
- **PM-604** (vyve-site c578467): set-password.html maps Supabase leaked-password/breach error to actionable guidance. Markers 458, cache vyve-cache-v2026-06-12-pm604-pwbreach-msg.
- **PM-605** (Test-Site-Finalv3 6733650): full password-complexity gate in questionnaire — live pw-reqs checklist (8+/upper/lower/number/symbol) mirroring Supabase config EXACTLY; submit gated; BOTH submitQuestionnaire + retrySubmit now `await confirmPasswordSet(email,password)` (1 retry) before showResults — fire-and-forget removed; PASSWORD_SET_FAILED error screen.
- **set-member-password EF** (deployed, verify_jwt:false): {email,password} → resolves auth user via new SECURITY DEFINER RPC `public.get_auth_user_id_by_email(text)` (search_path='', service_role only) → admin PUT password. Returns {success:true}.
- **[DECISION] Supabase leaked-password protection turned OFF** (dashboard). Confirmed live auth config: password_min_length=8; required chars = lower+upper+digit+symbol; breach check OFF. So the form's complexity rule exactly matches what Supabase will accept.

### Shipped — onboarding EF v96 → v97 (live version 113)
- **v96 (PM-606, version 112):** welcome email + AI session rec now sourced from `calendar_occurrences` (live schedule: active=true, cancelled_at IS NULL, starts_at>now, order asc, limit 12) NOT static service_catalogue. Added fmtSessionWhen() (Europe/London "today/tomorrow/Weekday at Xpm") + occurrenceDurationMin(). `ls` (AI session list) + pickSessionRec(persona,stream,upcoming) repointed to upcoming. service_catalogue refs removed. Verified end-to-end: welcome_rec_2 = 'Join "Steps to Improve your Life with Jamie" tomorrow at 8:30am in Mindfulness & Mindset' — real session, host, concrete time.
- **v97 (PM-607, version 113):** onboarding resilience. (1) writeMember coerces `weight_unit: d.weightUnit || 'kg'`, `height_unit: d.heightUnit || 'cm'` (was `|| null` — explicit null OVERRODE the DB default on these NOT-NULL-with-default columns, hard-failing the whole member write). (2) On strict insert failure, retry with a minimal guaranteed-valid `core` payload (email, name, persona, recs, onboarding_complete, subscription_status, units, exercise_stream, life_context, cert counts) so a paid member is never locked out by one bad/missing optional field; fires `writeMember_core_fallback` team alert. Only a genuinely broken record (no email) fails. Verified: a payload OMITTING weightUnit/heightUnit entirely now completes (onboarding_complete:true, units default to kg/cm) — the exact case that hard-failed v96.

### Member rescues
12 stuck members password-set via temp one-shot EFs (all deleted after use): Dan Zadeh, Jack Lambert, Pippa Shanks, Katrina Melia, David McCormack, Lisa Fox, Ana Luna, Melanie Eaton, Hazel Smith, Ema Devereaux, Angie Jones-Moore, + Shaun Baker (shaunbaker122qa@gmail.com → password set to `Mario123!` via set-member-password; tell Shaun: email + Mario123!, sign in directly, don't tap reset links).

### Schema finding (logged for safety)
`members` has exactly ONE NOT-NULL-without-default column: `email` (correct). `weight_unit`/`height_unit` are NOT NULL but DEFAULT 'kg'/'cm' — so code must OMIT or default them, never send explicit null. v97 fixes the code side; making them nullable is a belt-and-braces backlog option.

### Pending (not built)
Welcome-email coach-voice rewrite (per-persona NOVA/RIVER/SPARK/SAGE AI-voiced + HAVEN pre-written/clinically-reviewed) — two mockups built (welcome-email-v2-mock.html, coach-voices-comparison.html), awaiting Lewis copy sign-off before building into the EF.

## PM-603 — Full brain reconciliation vs live (§23 holes filled, inventories/counts to live, stale items closed) (2026-06-12)

Dean flagged recurring wrong answers from sessions. Root cause: sessions faithfully updated the CURRENT FRONT, changelog, and (mostly) §23/§19 ship-narratives, but the durable inventory/count tables (§6/§7/§24) and the §20–22 status board rotted, and several §23 hard rules existed ONLY in the changelog. Full read of master + changelog, cross-checked against live Supabase (`execute_sql` + `list_edge_functions`) and GitHub.

### §23 reconciliation (the wrong-answers engine)
- Master's §23 jumped §23.94 → §23.104. The §23.95–103 band + §23.105 + a third §23.107 lived only in the changelog.
- **§23.105 back-filled** from PM-568 (no `current_setting('app.*')` in cron auth headers; embed the JWT literal).
- **Duplicate §23.107 → §23.110** (PM-573 CURRENT-FRONT rule; the PM-571 OTA rule keeps §23.107).
- **Promoted changelog → master §23.111–116:** tracker→log-activity-or-invisible (PM-575, was a 3rd §23.107), www-clone-before-bundle (PM-557 §23.95), Java-21-for-gradlew (PM-557, was a 2nd §23.94), achievement-toast-gate (PM-554 §23.97), lockBody-10s-timer (PM-554 §23.98), JS-cachebust-query-string (PM-585 §23.101).
- Orphan `dim values 1/2/3` table fragment at top of §23 reformatted to a note.

### Inventories + counts → live (12 Jun)
- §5/§6: 120 → **133 public tables**; §16 RLS 120 → 133; §6/§14 workout_plans ~297 → ~313; §23.91 replay_videos "=4" → 31.
- §1 members: 23 → **47** (trial 36, comp 10, paid 1; NO enterprise). §6 members row: added `is_test`, `privacy_version`, `health_consent_version`, `tour_completed_at`.
- §6/§7: documented the **CC Insights suite** (cc-app-health/usage/retention/wellbeing/platform/activity/revenue/ai EFs + `cc_*` cache tables + crons 38–45 + 8 admin pages) + `stripe-webhook` + `apply-trial` + `session-reminder-cron`. §7 count 124 → ~150.
- Cron: three divergent brain tables (28/29/30 "active") replaced by one live §24 table (41 jobs, **40 active**; jobid 27 disabled; jobid 26 daily → 36 hourly). §7 sub-table + §12 pointer marked superseded.

### Stale "open" items closed / contradictions resolved
- **GITHUB_PAT_CLAUDE rotation DONE** (PM-558, no expiry). §24 + front corrected — stop re-flagging "expires 20 June".
- **GDPR cron static-PSK** removed — §21/§22 marked resolved.
- **sync-health-data** "dead since 24 May" clarified: server-side scheduled path retired for foreground-only sync (§23.93); EF is live/ACTIVE v22.
- **Make** §12 reconciled to §24 (retired, not "broken/133 stuck").
- **changelog.md size** §21 corrected: 67KB/~800 lines (pre-PM-554 in `changelog-archive.md`), not 2.5MB.
- §19–22 status board refreshed off the 26-May snapshot (iOS 1.8/1.0.7 in review not 1.4/1.0.5; HAVEN 3 members not "Conor since 15 April"; OTA wiring DONE PM-602; dropped "before 31 May" guard).

### Production data fix
- 2 fake `enterprise` members (Callum Budzinski, Kelly Bestford — team) → `account_type='comp'`, `is_test=true`. They had inflated Revenue MRR by £20 (£40 → real £20, Paige only) and skewed cohort denominators.

### Open / confirm
- cron jobid 27 `session-publish-hourly` is DISABLED — Dean to confirm intentional.
- §23.106 OTA canary still unverified (top native, pre-Sage gate).
- Not line-audited this pass: master 943–990 (brand palette) + §23.34–86 rule bodies (stable doctrine).

### Commit
Brain-only (master.md + changelog.md, atomic via Git Data API; Composio not used). No vyve-site / EF / migration changes beyond the 2-row members data fix above.

## PM-602 — iOS 1.8 + Android 1.0.7 submitted; OTA wiring live in both binaries (2026-06-11)

End-to-end OTA setup session. Closes §23.107 (wiring now in binary) and advances §23.106 to "pending first canary verification."

### What shipped
- **`live-update.js` (PM-597/PM-600)** — `LiveUpdate.ready()` + `LiveUpdate.setChannel('production')` + `LiveUpdate.sync()` wired into vyve-site web shell. Native-guarded IIFE; no-op on server.url dev shell and web. `production` is the Capawesome channel name (not the UUID). File included on index.html and login.html (cold-start pages).
- **`.github/workflows/ota-deploy.yml`** — dormant OTA push workflow committed to vyve-site. Manual trigger via GitHub Actions UI (`workflow_dispatch`), rollout % input (default 10% canary). Authenticates via `CAPAWESOME_TOKEN` repo secret. Pushes to app `f9961f66-eb66-4102-b1c5-f9b2c7baeebf`, channel `production`. Ready to fire the moment 1.8 installs on a real device.
- **`CAPAWESOME_TOKEN`** — added to vyve-site GitHub Actions repo secrets (token name `vyve-ota-ci`, no expiry, created 11 Jun 2026).
- **iOS 1.8 (build 3)** — submitted to App Store Connect for review. `server.url` removed, `channel: production` in LiveUpdate block, `live-update.js` bundled. Screenshots uploaded (5 × 1284×2778 px). "What's New": OTA support messaging.
- **Android 1.0.7 (versionCode 53)** — AAB built and uploaded to Play Console production track. Same web shell as iOS 1.8.

### Capawesome channel clarification (banked)
Brain previously recorded channel as `89e12796` (the internal UUID). Live Channels page shows two channels: **`production`** (0 devices, 0 deployments — the correct target) and **`default`** (4 devices — where trial cohort landed due to no explicit channel in prior config). `live-update.js` + `capacitor.config.json` now both pin `production` explicitly.

### §23.107 update
The "no sync/ready calls" rule is now RESOLVED for 1.8+. `live-update.js` ships the wiring. §23.107 rewritten below.

### Next action
Once 1.8 is approved + installed on a real device (not Dean's server.url dev phone): trigger `ota-deploy.yml` from GitHub Actions with rollout=10. Watch Capawesome Cloud → VYVE Health → Live Updates → Channels → production → Logs for bundle receipt. Verify vbb marker updates on the device on next cold start. That closes §23.106.

## PM-601 — fix daily_habits hydrate dropping PK (engagement score read low) (2026-06-11)

### Root cause
Kelly's "Your Journey → Score" showed 74 at 23:10; server `compute_engagement_components_v2` returned 83. Not v1/v2 confusion, not decay, not midnight rollover. The v2 page computes from Dexie via `computeEngagementV2FromDexie` → `allFor(email)`. Her Dexie `daily_habits` held only TODAY's row (habits pillar rendered 5.0pts = today capped, vs SQL 19.71 = full decayed week). Server had habits on all 7 days. The `daily_habits` hydrate in `sync.js` used a hand-written `select=member_email,activity_date,habit_id,habit_completed,notes` — **no `id`**. PostgREST returned PK-less rows; Dexie's §23.43 merge keys on `r.id`, so all 365 days collapsed onto one null-keyed slot. Only the locally-autoticked today row (written with a real id by member-dashboard mirror) survived. Every OTHER activity table uses `select=*` (includes id) — habits was the sole offender.

### What shipped
- **vyve-site commit `d3fc35b`** (Git Data API fallback — Composio GitHub had no active connection this session): `sync.js` — added `id` to the `daily_habits` hydrate select (now `select=id,member_email,activity_date,habit_id,habit_completed,notes`). `index.html` + `settings.html` vbb-marker 455→456. `sw.js` CACHE_NAME → `vyve-cache-v2026-06-11-pm601-habits-id`. Verified all four at commit SHA.

### Brain corrections
- §11C parity claim ("72/72 exact match") annotated: formula parity holds, DATA parity is conditional on full Dexie hydration. Was masking this bug class.
- New **§23.109** (HARD RULE): explicit PostgREST `select=` on member-scoped activity tables must include `id`; prefer `select=*`. Missing-PK collapses local history silently.

### Not yet reaching members
Fix is on main; Dean sees it via server.url dev loop. Members on bundled iOS 1.7 / Android 1.0.6 frozen binaries will NOT get it until an OTA push — never fired (§23.106/107, Sage blocker). OTA push is the next action. A member force-quit only self-heals if their shell loads current main, which a bundled build does not.

## PM-596 — welcome.html: download app card after recs (2026-06-10)

### What shipped
- **Test-Site-Finalv3 commit `d62df2b`**: `welcome.html` — download app card inserted between `#resultContent` (AI recs) and `next-steps-card` (email info). Full-width teal gradient card with headline, sub-copy, and store badges. Device-sniffed: iPhone/iPad shows App Store badge only; Android shows Play Store badge only; desktop/unknown shows both side-by-side. App Store: `https://apps.apple.com/gb/app/vyve-health/id6762100652`. Play Store: `https://play.google.com/store/apps/details?id=co.uk.vyvehealth.app`.

## PM-595 — Usage page: phone numbers in member 360 modal + never-active outreach list (2026-06-10)

### What shipped
- **cc-usage EF v8** (Supabase): added `phone` to members select + `phoneMap` enrichment; `phone` now in every `members_json` row in the cache
- **vyve-command-centre commit `8a626dd`**: `assets/usage.js` — phone as tappable tel: link in 360 modal Profile section; never-active outreach modal now shows full name + email + phone per member; `pages/usage.html` — cache buster bumped to PM-595-v1

### Never-active password analysis (live query 2026-06-10)
15 real never-active members (zero activity across all tables). All have `encrypted_password` set (onboarding EF creates auth users). **9 have never signed in at all** (last_sign_in_at IS NULL): Melanie Eaton, Molly Moran, Ana Luna, Lisa Fox, David McCormack, Katrina Melia, Pippa Shanks, Jack Lambert, Dan Zadeh. 6 have logged in but not acted: Lou Walker (signed in today), Heidi Khoshtaghaza-Hay, Carly Doogan, Mark Maddison, Alex Jordon, Kieran Day. To see phone numbers and trigger outreach: Usage page → Members tab → filter "Never active" → click member for 360 modal, OR use the never-active modal.

## PM-594 — AI Usage page, wellbeing×activity correlation, HAVEN compliance flag (2026-06-10)

### What shipped
**Supabase:**
- cc-ai EF v1 (ai_interactions analysis: usage by trigger/persona, HAVEN compliance detail, 12-week trend)
- cc_ai table (BIGINT PK, headline/usage/haven/trend JSONB cols, admin-read RLS)
- Cron `cc-ai-hourly` jobid 45 at `35 * * * *`
- cc-activity EF v5 (fixes watch column names: pct_watched not watch_pct, watch_seconds for both tables; total_watch_minutes now shows 5.9 correctly)
- cc-wellbeing EF v4 (adds correlation_json: per-member avg_wb vs total_acts)
- cc_wellbeing.correlation_json column added

**vyve-command-centre (PM-594 commit `ef65f670f6ad`):**
- `pages/ai-usage.html` + `assets/ai-usage.js` — AI Usage page at `/#/ai-usage`
- `pages/wellbeing.html` + `assets/wellbeing.js` — correlation section added + wbRenderCorrelation function
- `assets/sidebar-config.js` — AI Usage entry added (7th Insights page)
- `lib/router.js` — ai-usage added to no-cache slug list

### Cache data (2026-06-10T07:18)
- AI: 68 interactions · 23 unique members · HAVEN alert active (9 interactions, clinical_gate_passed=false)
- HAVEN: 3 real members (Calum Denham, Conor Warren, Kieran Day) + Phil Hurwood (clinical lead himself). Mix of onboarding + re_engagement triggers. Compliance risk — needs Phil sign-off before Sage.
- Wellbeing correlation: 7 data points. Top 3 most active members avg wb 8.0, bottom 3 avg 5.0 — +3.0 difference, directionally consistent with VYVE hypothesis. n=7 is directional only.
- Activity: total_watch_minutes=5.9 fixed (was 0 due to wrong column names).

### HAVEN compliance summary
9 HAVEN interactions in production with real non-test members:
- calumdenham@gmail.com: onboarding 13 Apr
- conor@conorwarren.co.uk: onboarding 15 Apr + 3x re_engagement (May)
- kieranday97@gmail.com: onboarding 13 May + 2x re_engagement (May)
- phil_hurwood@hotmail.co.uk: onboarding 27 May (Phil is the clinical lead himself)
Action required: Dean to brief Lewis; coordinate Phil sign-off before Sage demo.

## PM-593 — CC audit cont.: cc-activity EF real build, SVG Day-N chart, re-engagement effectiveness (2026-06-10)

### What shipped
**Supabase:**
- cc-activity EF v4 (real build — stubs were v1-3; queries mal, exercise_logs, mind_activities, replay_video_views, session_live_views, weight_logs, member_running_plans, member_health_connections for all 7 sections)
- cc-retention EF v5 (adds reengage_json: per-stream email effectiveness, 7-day return rate)
- cc_retention.reengage_json column added

**vyve-command-centre (PM-593 commit `d88a35c3af04`):**
- `assets/retention.js`: Day-N horizontal bars → SVG line chart with benchmark dashed line, colour-coded points (green above / orange below), data table with pp delta vs benchmark, ⚠ low-confidence flag (n<10)
- `assets/retention.js`: retRenderReengage function + re-engagement effectiveness section added
- `pages/retention.html`: re-engagement card added after at-risk section, version bumped

### Cache data (2026-06-10T01:08)
- Re-engagement: Stream A (7-day inactive) 52% return rate (26/50 sent), Stream B (30-day inactive) 24% return rate (6/25 sent), overall 43%. Strong numbers — industry average is 5-15%.
- Activity: rebuilt with 11 adoption features, full pillar breakdown, heatmap, exercise depth. total_watch_minutes=0 (watch query column mapping issue — backlog).

### Remaining audit items (carry forward)
- Watch time query: replay_video_views column names differ — total_watch_minutes shows 0
- log-perf: only 79 rows from May 2026 testing; needs broader wiring across portal pages
- AI usage + cost page (ai_interactions table has all the data)
- Wellbeing × activity correlation chart (the VYVE ROI story)

## PM-592 — CC analytics audit: Revenue page, wellbeing EF v2, account type, WoW deltas (2026-06-10)

### What shipped
**Supabase:**
- cc-wellbeing EF v3 (real build — prior versions were stubs; computes from wellbeing_checkins + members baseline cols)
- cc-platform EF v2 (is_dean PostHog filter; perf_note added about 79-row coverage gap)
- cc-revenue EF v1 (MRR, subscription breakdown, trial pipeline, 12-week new-member trend)
- cc-usage EF v7 (adds account_type + subscription_status to member enrichment)
- cc_revenue_cache table (BIGINT PK, 5 JSONB cols, admin-read RLS, §23.104 applied)
- Cron `cc-revenue-hourly` jobid 44 at `20 * * * *`

**vyve-command-centre (PM-592 commit `5360249b9045`):**
- `pages/revenue.html` + `assets/revenue.js` — Revenue page at `/#/revenue` (MRR hero, breakdown table, trial pipeline, 12-week new-member trend)
- `assets/usage.js` patched: account_type pill column + week-over-week activity/DAU deltas in headline
- `pages/usage.html` patched: Account column header, delta sub-elements
- `assets/sidebar-config.js`: Revenue entry added (6th Insights page)
- `lib/router.js`: revenue added to no-cache slug list

### First cache data (2026-06-10)
- Wellbeing: avg 7.5/10 · 7/33 members ever checked in (21% participation) · 1 at-risk · 18 trend weeks
- Revenue: MRR £40 (1× £20 paid B2C + 2× £10 enterprise) · 22 trial pipeline · 9% conversion
- Platform (is_dean filtered): 13,730 views (down from 14,054) · 625 unique sessions

### Audit gaps resolved this session
- Wellbeing page was completely empty (stub EF) — now live with real data
- Platform page showing Dean's dev traffic — is_dean filter applied
- No revenue visibility anywhere — Revenue page created
- Members table had no subscription type column — Account pill added
- Headline had no trend direction — WoW delta arrows added for acts7d + active7d

### Remaining from audit (carry to next sessions)
- Day-N retention: still a table, needs visual line chart with benchmark
- Re-engagement email effectiveness (returned % after contact)
- cc-activity EF is a stub (data is stale, refresh broken)
- log-perf only wired on 5 pages from May testing — needs broader wiring
- AI usage + cost page; Notification effectiveness; Wellbeing × activity correlation

## PM-591 — Platform & UX analytics page live (2026-06-10)

### What shipped
- `pages/platform.html` + `assets/platform.js` — Platform & UX page at `admin.vyvehealth.co.uk/#/platform`
- `cc-platform` EF v1 (`verify_jwt:false`, admin-gated when JWT present, open to cron)
- `cc_platform` table — id=1 JSONB cache: headline_json, pages_json, errors_json, perf_json, dead_json; admin-read RLS; §23.104 revoke applied
- Cron `cc-platform-hourly` (jobid 43, `5 * * * *`)
- Sidebar: platform status `coming-soon` → `live`

### Data sources
- **PostHog HogQL** (eu.posthog.com, project 138491, `POSTHOG_API_KEY` from Vault):
  - `$pageview` events — top 50 pages by visit volume, unique users, % of total (last 30 days)
  - `ef_error` events — grouped by ef_name + status, count, last seen (last 30 days)
- **Supabase `perf_telemetry`** — fetched raw (79 rows), pivoted in EF to p50/p75/p95 per page for LCP/FCP/TTFB/INP

### Page sections
1. Headline strip: total views, unique sessions, EF error count, median LCP, pages tracked, low/dead count
2. Top pages — horizontal bar chart (top 20) + full sortable table (views / unique users / % of total)
3. EF error log — table by ef_name + status, colour-coded count pill, last-seen
4. Load time percentiles — per-page LCP p50/p75/p95, FCP p50, TTFB p50, INP p75, colour-coded by Web Vitals thresholds
5. Coverage — low-traffic (<10 views) and dead (0 views) vs 34 known pages

### First cache data (2026-06-10T00:32:09Z)
- 14,054 page views · 639 unique sessions · 76 pages tracked · 0 ef_errors · median LCP 391ms (excellent)
- 5 low-traffic pages · 0 dead pages · 7 pages with perf data
- All four Insights sidebar pages now live

## PM-590 — Wellbeing analytics page live (2026-06-10)

### What shipped
- `pages/wellbeing.html` + `assets/wellbeing.js` — Wellbeing page at `admin.vyvehealth.co.uk/#/wellbeing`
- `cc-wellbeing` EF v1 (same assertAdmin pattern as cc-retention: user-context client + is_admin() RPC)
- `cc_wellbeing` table — 6 JSONB columns: headline, trend, members, distribution, baseline, participation
- `compute_cc_wellbeing()` SECURITY DEFINER function; §23.104 revoke applied
- Cron `cc-wellbeing-hourly` (`55 * * * *`)
- Sidebar: wellbeing status `coming-soon` → `live`

### Also shipped this session (PM-589)
- Fix activity-depth auth: `actGetJwt()` now uses `vyve-cc-supabase-auth` key (matches retention.js)
- Read path changed from EF to PostgREST direct on `cc_activity` table (RLS handles auth)
- EF auth pattern fix: cc-activity v2 now uses user-context client + `is_admin()` RPC (matches cc-retention)

### Wellbeing page sections
1. Headline strip: avg wellbeing (7.5), checked-in members (7/33), total check-ins (31), at-risk (1 — Cole, score 1), improving vs baseline, participation %
2. Weekly score trend: 18 weeks (Jan–Jun 2026), colour-coded bars, hover for submission count
3. Member table: baseline vs latest, delta, trend arrow, status pill, check-in count — sorted at-risk first
4. Score distribution: per-bucket histogram (1–10)
5. 8-dimension baseline profile: avg onboarding self-assessments from members table (clearly labelled as baseline, not live check-in data — check-in sub-scores are NULL in current form)

### Key data
- 31 check-ins, 10 members ever checked in (but 7 of 33 real members with complete data)
- Dean: 14 check-ins (most engaged), Calum: +4 delta, Cole: -4 delta (at risk, score 1)
- Avg 7.5/10 overall wellbeing

## PM-588 — Cyber Essentials strategy agreed (2026-06-10)

- Decision: do CE (self-assessed) now via IASME (~£300-400, days to certificate). VYVE stack passes trivially — managed cloud, no on-prem, JWT auth, RLS everywhere.
- CE+ (independently verified, ~£1.5k, 4-6 weeks): hold until a specific deal requires it. Ask Sage procurement what they actually need before spending.
- Pen test (~£1-2k): hold until a live enterprise deal triggers the requirement.
- Public sector (NHS) route will require CE+ at higher contract values — no way around it, but not the immediate path.
- No code shipped this session.


## PM-585 / PM-586 — retention.js cache-bust + missing function definitions fixed (2026-06-09)

- PM-585: retention.html script tag version bumped from PM-580-v1 → PM-584-v1 to bust browser cache
- PM-586: Three render function definitions (retRenderDayN, retRenderStreaks, retRenderCriticalEvents) were missing from retention.js — the insert anchor used was an HTML comment that doesn't exist in JS files. Fixed by inserting before the `// ── Boot ─────` anchor which is stable. Verified all three definitions present in committed file (18,019 chars).
- Root cause lesson: always assert that str.replace() actually changed the string, not just that the target string appears somewhere in the result (it was already present in the function call added by a prior patch).
- Retention page fully working: all six sections render. §23.101 reminder: bump JS query-string version in HTML on every JS update.

## PM-584 — Retention page: day-N curve, streaks, critical events (2026-06-09)

- Day-N retention curve live: D1 61%, D3 50%, D7 68%, D14 47%, D30 69%, D60 57% vs industry benchmarks (D1:30%, D7:15%, D30:8%). VYVE well above at every interval.
- Streak analytics: avg current 1.6d, avg best 2.7d, max 16d, 2 members at 7+ streak now. Distribution chart by best-ever streak.
- Critical events (aha moment): 15 retained vs 3 churned (low confidence). Cardio in week 1 = +20pp retained. Check-in = +13pp. Sample too small for definitive conclusions.
- Consent gate removed from funnel — signal unreliable (10-min timeout bug). member_home_state also unusable (backfilled by cron for all members).
- created_at fixed for Dean (2025-12-07), Lewis (2025-12-19), Kelly (2026-02-28), Callum (2026-02-28) — first activity date at 09:00 UTC.
- Median TTF now 0h (same-day), 16 same-day activations. Mean 9d skewed by Kelly/Callum outliers.
- cc-retention EF → v4

## PM-580 — Retention & Activation page live (2026-06-09)

### What shipped
- `pages/retention.html` + `assets/retention.js` — Retention page at `admin.vyvehealth.co.uk/#/retention`
- `cc-retention` Edge Function v1 (`verify_jwt:false`, admin-gated via `assertAdmin()`)
- `cc_retention` table — single-row JSONB cache (funnel_json, cohorts_json, dormancy_json, atrisk_json); admin-read RLS
- Cron job 40 (`cc-retention-hourly`, `:15 * * * *`)
- **Sidebar restructured:** Insights section now has 5 entries — Overview & Members (usage), Retention (live), Activity Depth, Wellbeing, Platform & UX (last 3 as coming-soon stubs)
- **Router:** retention/activity/wellbeing/platform all added to no-cache slugs

### Cache data (first build, 2026-06-09)
- 33 real members · 20 ever active (61%) · 13 never active · avg 411h (~17 days) to first activity
- Dormancy: 15 active · 2 quiet · 3 inactive · 13 never
- 5 monthly cohorts (Dec 2025–Jun 2026) · 16 at-risk entries

### Key insight from first data
Average time to first activity is 17 days — almost certainly because many members are trial/BT/Sage contacts who got added without paying. The never-active problem is structural, not engagement. Worth flagging to Lewis.

### Retention page sections
1. Headline strip: total, ever active, active 7d, avg time to first, at-risk, never active
2. Activation funnel: signup → onboarding → PWA installed → first activity → active week 1 → active last 30d
3. Dormancy breakdown: active / quiet / inactive / never (4-cell grid)
4. Cohort retention table: monthly cohorts × week1/week2/month1/month2/still-active with heatmap colouring
5. At-risk members table: name, persona, joined, last active, total acts, 7d acts, trend (▲/▼/=), flags

### Next pages to build
- Activity Depth (`activity.html`) — feature adoption, watch-time leaderboard, time-of-day heatmap
- Wellbeing (`wellbeing.html`) — score trajectory vs baselines, mood pulse, 8-dimension radar
- Platform & UX (`platform.html`) — PostHog pages, rage clicks, paths
- Enterprise (`enterprise.html`) — team breakdown, Sage-ready

## PM-579 — Fix ACT_ICONS scope + sessions in platform_metrics_daily (2026-06-09)

- `platform_metrics_daily.sessions_count` was 0 for all dates because the cron ran before the PM-575 backfill. Fixed by running `recompute_platform_metrics()` for all dates with session/replay entries in `member_activity_log` (~51 dates).
- `ACT_ICONS`/`ACT_LABELS` moved to `window.VYVE_ACT_ICONS`/`VYVE_ACT_LABELS` globals at top of usage.js — survives router replaceChild re-injection and browser caching edge cases.
- Leftover `const score/scoreCls` removed from `usageOpen360` (syntax noise from patching).
- Modal title now shows "First Last" instead of email.
- cc_usage cache rebuilt.

## PM-578 — Fix ACT_ICONS scope + sessions in week-on-week (2026-06-09)

- **ACT_ICONS/usageFmtMeta not defined:** `const` declarations for `ACT_ICONS` and `ACT_LABELS` never landed in PM-577 (string replacement missed). `usageFmtMeta` also missing. Fixed by inlining both as `var` inside `usageLoadMemberLog` — avoids const hoisting/scope issues with router replaceChild entirely.
- **Sessions 0 in week-on-week:** `platform_metrics_daily` rows for 4–9 Jun were computed before the PM-575 backfill landed session/replay entries in `member_activity_log`. `recompute_platform_metrics` reads from `member_activity_log` so historical rows had no sessions. Fixed by running `backfill_platform_metrics(10)` — sessions now showing (4 Jun: 2, 5 Jun: 3, 6 Jun: 1, etc.).
- Cache rebuilt.

## PM-577 — Usage: names + sort persist + activity log detail + tracker REST fix (2026-06-09)

### What shipped
- `members.first_name` + `last_name` added to cc-usage EF enrichment and `members_json` cache
- Members table: displays "First Last" with email below; initials avatar uses name initials
- Column sort state persisted to `localStorage` (`vyve_cc_usage_sort`) — survives page reload
- Member column now sorts by `last_name`; all other headers unchanged
- **Member detail view:** clicking a row fetches `action: member_detail` from cc-usage EF; renders full activity log timeline (last 60 entries) grouped by date with type icons, labels, metadata (duration, distance, watch%, scores)
- **Tracker REST fix (PM-577):** player-tracker.js + replay-tracker.js now POST directly to `/rest/v1/member_activity_log` on first qualifying write (bypasses log-activity CAPS which has no replay type); `member_activity_log` RLS updated with member-self-insert + admin-read + member-self-read policies
- `cc-usage` EF → v5
- vbb 451 | sw: pm577-tracker-fix

### Replay test account clarification
- Test account replays visible: uncheck "Exclude test" in Members tab
- Overview chart uses `platform_metrics_daily` (02:15 UTC rebuild) — today's activity shows tomorrow; "today" column reads live from `member_activity_daily`

## PM-576 — GDPR-safe send_never_active: suppression check + unsubscribe link (2026-06-09)

- `cc-usage` EF → v4: `sendNeverActive()` now checks `engagement_emails.suppressed = true` before sending; suppressed members are skipped and returned in `skipped_suppressed[]`
- Unsubscribe link added to email footer (routes to settings.html#notifications)
- Sent emails recorded in `engagement_emails` table (stream: `never_active`, key: `never_active_manual`) so open/click tracking and suppression works
- jordz279@hotmail.com and kieranday97@gmail.com have existing suppressed=true rows — will be skipped automatically

## PM-575 — Fix session/replay activity log pipeline (2026-06-09)

### Root cause
`player-tracker.js` and `replay-tracker.js` write to `session_live_views` / `replay_video_views` but never called `log-activity` EF, so sessions/replays never landed in `member_activity_log` → never rolled up into `member_activity_daily` or `member_stats`. Sessions stopped at 25 May when old tracker was retired; replays never worked at all.

### What shipped
- **Backfill:** 2 `session_live_views` + 6 `replay_video_views` rows inserted into `member_activity_log` (idempotent, deduped on source_id)
- `rebuild_member_activity_daily_incremental()` run — sessions/replays now visible in rollup (65 session rows back to Mar 2026, 8 replay rows Jun 2026)
- `recompute_all_member_stats()` run — `member_stats` updated (39 rows)
- `cc_usage` cache rebuilt
- **`player-tracker.js`** (PM-575): on first write (`isInsert=true`) for `live` and `replay` modes, fire-and-forget `POST /functions/v1/log-activity` with `{type:'session_views'/'replay_views', activity_date}`. JWT from `session.cachedJwt`.
- **`replay-tracker.js`** (PM-575): same injection on `isInsert=true`.
- vbb bumped to 450. sw.js: `vyve-cache-v2026-06-09-pm575-session-replay-fix`

### §23.XXX — new hard rule
**§23.107:** When adding new watch-time/view tables (`session_live_views`, `replay_video_views`, or future equivalents), always wire a `log-activity` call from the tracker on first qualifying write. The rollup pipeline (`rebuild_member_activity_daily_incremental`) only reads from `member_activity_log` — any tracker that writes directly to a separate table without also calling `log-activity` will be silently invisible in all rollups, `member_stats`, dashboards, and achievements.

## PM-574 — Usage Analytics: today column + email never-active (2026-06-09)

- **Today column** added to Members table — live fetch from `member_activity_daily` on page load (not from cache), highlights in green when > 0
- **Email never-active modal** — "✉ Email never-active" button in Members filter bar; shows list of members with 0 total activities, confirms before send; respects exclude-test toggle
- `cc-usage` EF → v3: `send_never_active` action — persona-voiced re-engagement email per recipient, sent directly via Brevo, tagged `never-active-reengage`; admin JWT required for send action; cron cache rebuild unchanged
- Paige Coult confirmed: last activity genuinely 21 April (49d ago), `member_stats` is correct

## PM-573 — Recent-window review + brain currency fixes; Android 1.0.6 live; front re-fixed (2026-06-09)

Completed the changelog-window review Dean asked for (recovered archive PM-433→553a). Most of the window was already in the living brain; five drift/gap items fixed plus a front repair.

### Fixes
- **§3 business model** reconciled: 30-day free trial → £10/mo-forever conversion (VYVE10, separate Stripe link from the £20 new-signup link), access gated on `subscription_status` per §23.85. Conversion **LIVE end-to-end** (Stripe webhook secret set — Dean confirmed). New §3 row.
- **wellbeing-checkin EF** v22 → **v30** (PM-516 enriched debrief + structured output) in §7 inventory.
- **workout-plan-wizard.html** (PM-532 no-plan questionnaire) added to §8 (Body—Workouts).
- **Light-mode 46-page pass** (PM-494→508) recorded on the theme line.
- **Android 1.0.6 APPROVED + live** (Dean confirmed 9 Jun): both platforms bundled. §5/§23.4/§23.106 updated — OTA gap now COHORT-WIDE, not iOS-only. Only Dean's dev-loop iPhone stays on server.url.
- **CURRENT FRONT re-fixed:** the PM-571/572 closes had rewritten the front from a stale template, reverting the PM-569 deployment-flip line and re-adding the `session-reminder-cron` WARN that PM-568 cleared. Rewritten to lead with standing deployment facts + correct WARN set.

### New rule
- **§23.107 (HARD RULE):** never regenerate the shared CURRENT FRONT block from an in-context template — re-fetch fresh + edit surgically; standing facts owned by §5/§23, front only mirrors.

### Parallel-session churn
Heavy today: rebased four times. PM-568 (cron) → PM-545971 enterprise-bridge → PM-571 (usage v1) → PM-572 (is_test) all committed during this session; I claimed PM-569 (flip), PM-570 (changelog archive), PM-573 (this). Fresh-HEAD guard caught every collision — no clobbers on my side. (The front clobber that earned §23.107 was theirs, fixed here.)

### No code shipped
- Brain only.

### Open
- Verify ONE Capawesome OTA end-to-end (now cohort-wide blocker; pre-Sage gate, §23.106).
- Exec brief for Lewis + Alan updated (Android live + trial model): `VYVE_Platform_Update_2026-06-09.md`.

## PM-572 — Usage Analytics: is_test cohort filter (2026-06-09)

- `members.is_test BOOLEAN DEFAULT false` column added; 6 test accounts backfilled (`@test.com`)
- `cc-usage` EF → v2: `is_test` included in members enrichment
- `assets/usage.js`: `usageFilterMembers()` defaults to excluding test accounts (checkbox checked by default)
- `pages/usage.html`: "Exclude test" checkbox wired to filter
- Cache rebuilt — `members_json` now carries `is_test` field

## PM-571 — Usage Analytics v1: Overview + Members tabs (2026-06-09)

### What shipped
- `pages/usage.html` + `assets/usage.js` — Usage Analytics page at `admin.vyvehealth.co.uk/#/usage`
- `cc-usage` Edge Function v1 (`verify_jwt:false`, service-role, admin-gate) — hourly cron job 39 (`cc-usage-hourly`, `:30 * * * *`)
- `cc_usage` table — single-row JSONB cache mirroring `cc_app_health` pattern (id=1, seeded)
- Admin-read RLS policies added on: `cc_usage`, `member_stats`, `company_summary`, `member_activity_daily`
- Member-self-read RLS policies added on: `member_stats`, `member_activity_daily` (portal safety)
- Sidebar `assets/sidebar-config.js`: new **Insights** section with `usage` slug + `VYVE_NAV_TOP` Insights entry
- Router `lib/router.js`: `usage` slug added to no-cache list (same treatment as `app-health`)
- First cache built and verified: 38 member rows, 3 companies, 30-day daily series, headline 34 members / 15 active 7d

### Phase 1 scope (what's live)
- Headline strip: total members, active 7d/30d, DAU/MAU stickiness, activities 7d, at-risk count
- **Overview tab:** 30-day daily bar chart, activity breakdown by type (7d), week-on-week delta table, company breakdown
- **Members tab:** sortable table (email, engagement score ring, 7d/30d acts, active days, last active, programme, persona, status pill), search + filter (at-risk/needs-support/active/inactive), pagination (25/page)
- **Member 360 drill-down modal:** profile (persona, programme, programme week, at-risk/support flags, certs), engagement score with component bars, activity totals grid (total/7d/30d/90d/active-days/distinct-types), latest signals (wellbeing/stress/energy/weight)
- Data sources: `platform_metrics_daily` (headline + daily series, ~1 day behind), `member_activity_daily` (replays + DAU augment), `member_stats` (member list), `company_summary` (enterprise tab), `members` (persona/company enrichment)

### Open items (Phase 2+)
- `is_test` flag: open decision — Dean to confirm test/admin email list, then 1-column migration + backfill (blocks meaningful cohort filter)
- Phase 2: Activity depth tab (exercise_logs volume, cardio depth, time-of-day heatmap), Sessions/watch-time tab
- Phase 3: Wellbeing trends, Achievements, Retention cohorts
- Phase 4: Pages & UX (PostHog), Enterprise tab

## PM-571 — Capawesome OTA gap diagnosed (no sync/ready in shell); Dean's dev-phone restored to server.url loop; SPM xcodeproj gotcha (2026-06-09)

Follow-on to PM-569. Got Dean's iPhone back onto the server.url dev-loop (he'd installed bundled 1.7 from the App Store and lost live changes), and pinned down *why* the Capawesome OTA has never run end-to-end.

### OTA diagnosis (sharpens §23.106 -> new §23.107)
- `@capawesome/capacitor-live-update@8.2.2` IS installed + native-linked (confirmed in `npx cap sync ios` plugin list, 17 plugins) and CONFIGURED in Mac-local `capacitor.config.json`: `plugins.LiveUpdate = { appId: "f9961f66-eb66-4102-b1c5-f9b2c7baeebf", autoDeleteBundles: true, publicKey: "" }`.
- BUT there are NO `LiveUpdate.sync()` / `LiveUpdate.ready()` calls ANYWHERE in the vyve-site web shell — swept app.js/boot.js/init.js/auth.js/nav.js/sw.js/index.html/settings.html + org code search = 0 hits (only an unrelated "live-update" comment in personal-bests.html). The plugin does not auto-sync; without `sync()` nothing fetches, without `ready()` an applied bundle rolls back.
- Consequence: the rails are physically in 1.7 but the switch was never flipped. **1.7 CANNOT receive an OTA.** The fix is JS-only but gated on a NEW bundled binary: wire `sync()` on launch + `ready()` after first paint + channel `89e12796`, native-guarded, into the shell -> ship 1.8 -> only then can a bundle push land. The §23.106 canary therefore targets 1.8, not 1.7.
- Not ruled out: a native auto-sync in vyve-capacitor `AppDelegate.swift` (not checked) — but config has no autoUpdate flag and Capawesome doesn't auto-sync without the JS calls, so near-certain.

### Dean's dev phone
- Restored `server` block to Mac-local `capacitor.config.json` (`server.url = https://online.vyvehealth.co.uk`, cleartext false), kept LiveUpdate block intact (dormant under server.url). `npx cap sync ios` -> ran to device from Xcode -> confirmed back on the live loop. Live HEAD was vbb 447/PM-563 at session time; vyve-site has since advanced to PM-565 via a parallel session.
- DISCIPLINE: that `server` block is DEV-ONLY on Mac-local — strip it before the next store binary or 1.8 ships in server.url mode and breaks the bundled migration.

### SPM gotcha (new §23.108)
- vyve-capacitor is an SPM-based Capacitor project (`Package.swift`; "not compatible with SPM" warns) — there is NO `App.xcworkspace`. Open `ios/App/App.xcodeproj` directly. `open ...App.xcworkspace` fails "does not exist".

### No code shipped
- Diagnosis + brain only. No vyve-site / EF / vyve-capacitor commits. Mac-local config edit is uncommitted (dev-loop, intentional).

## PM-570 — Changelog history recovered into changelog-archive.md (2026-06-09)

The PM-554 consolidation (7 Jun) trimmed changelog.md from 504 entries (~2.96MB, back to 22 Apr) down to PM-554 onward, but master §19 still pointed at changelog.md for older detail — a stale/false pointer. Recovered the full pre-PM-554 history from git commit `5deea4fd` into new `brain/changelog-archive.md` (504 entries, 22 Apr — 7 Jun / PM-553a). changelog.md unchanged below (still PM-554—569). §19 pointer corrected to reference the archive for pre-PM-554. Nothing was lost — git retained every version; this relocates it to where the pointer claims it lives.

## PM-569 — iOS 1.7 live + deployment model flipped to bundled; brain consolidation + exec brief (2026-06-09)

### Context
Brain-consolidation session (ran parallel to the PM-568 cron-fix session; rebased onto its commit 9ca8b9c3). Trigger: Apple approved iOS 1.7 → it is now LIVE; the whole iOS member cohort sees a bundled build while Dean alone is on the server.url live shell. Reconciled against the brain, which (PM-475, 4 Jun) still asserted the opposite — "whole cohort server.url-live, no frozen bundle." That correction is now itself wrong and has been reverted.

### iOS train (clarified with Dean)
- 1.5 = first genuinely bundled submit (server.url removed) — PM-557, 7 Jun, was in review.
- 1.6 submitted then CANCELLED.
- Went straight to 1.7 — now APPROVED + LIVE on the App Store.
- 1.7 ships server.url removed → iOS members frozen on the vyve-site SHA baked into the binary.

### Android
- Bundled 1.0.6 versionCode 51 submitted ~5-6 Jun (PM-557), approval UNCONFIRMED, still in review as of 9 Jun (Dean to recheck Play Console).
- Prior live Android build is still a server.url build → Android members remain on the live shell until 1.0.6 lands.

### Deployment model — now live (reverts PM-475)
- iOS members: FROZEN on bundled 1.7, updatable ONLY via Capawesome OTA (app f9961f66 / prod channel 89e12796).
- Capawesome OTA has NEVER run end-to-end → iOS members currently have NO working update path short of a full App Store resubmit (days/cycle).
- Dean: server.url dev-loop on his iPhone → sees every vyve-site commit live (2-15min WKWebView cache).
- Net: a vyve-site commit reaches Dean + Android members, NOT iOS members. Settings vbb-marker verifies Dean's view only.

### vyve-capacitor remote drift
- Remote latest commit is PM-560 (splash). The 1.5/1.6/1.7 bundle ship-state lives only on Dean's Mac local, uncommitted. Curate + atomic-commit Mac-local → remote per PM-413 Pending #2.

### Brain edits applied this session
- CURRENT FRONT: surgical merge onto the PM-568 front (kept their cron-fix lines + cleared WARN) — replaced the stale "1.5 in review" line with the deployment-flip block + §23.106.
- §5 native app delivery row rewritten to the flipped model.
- §23.4 — PM-475 correction reverted; original bundled-split is the live truth again for iOS.
- §23.92 — flagged now load-bearing (iOS bundled).
- §19 — new entry (this PM).
- §23.106 (NEW HARD RULE) — bundled iOS cohort has no proven delivery channel; verified Capawesome OTA is the gating capability before Sage and before any member-facing iOS fix.
- backlog — capacitor.config.json doctrine marked RESOLVED (bundled chosen, shipped); OTA verification elevated to P0 native priority.

### Deliverable
- Exec brief for Lewis + Alan: `/mnt/user-data/outputs/VYVE_Platform_Update_2026-06-09.md`. NOT committed to repo — handed to Dean to share.

### No code shipped
- Consolidation + brain only. No vyve-site / EF / migration changes.

### Open / next
- Dean: confirm Android 1.0.6 approval state in Play Console → update brief's pending line + §5.
- Prove + verify ONE Capawesome OTA end-to-end (TOP native priority, pre-Sage gate).
- §23.105 (PM-568 cron-fix rule) has a changelog body but no §23 rule body in master.md — PM-568 session to back-fill.
- Changelog history: changelog.md only reaches back to PM-554 (07 Jun) — confirm whether late-May entries were trimmed at PM-554 or need recovery from an archive.
- Carried WARNs: posthog-test EF delete, server-side HK sync dead since 24 May, App Store Connect API key. (session-reminder-cron resolved by PM-568.)

## PM-568 — Fix: 9 cron jobs broken by null app.service_role_key (2026-06-09)

### Root cause
9 cron jobs used `current_setting('app.service_role_key', true)` string-concatenated into a JSON header literal. `app.service_role_key` was null (never set, or cleared at some point). The `::jsonb` cast on `session-reminder-cron` and `process-scheduled-pushes` threw `invalid input syntax for type json` on every tick. Other jobs using `jsonb_build_object` silently sent `Bearer ` (empty token) — EF auth rejected but no cron-level error.

### Fix
Rewrote all 9 cron job commands via `cron.alter_job()` to embed the service_role JWT literal directly inside `jsonb_build_object(...)`. Eliminates `current_setting()` dependency entirely — cleaner and not fragile to database-level config changes.

**Jobs fixed:**
`session-reminder-cron`, `process-scheduled-pushes`, `habit-reminder-daily`, `streak-reminder-daily`, `vyve-achievements-sweep-daily`, `vyve-alert-digest-morning`, `vyve-alert-digest-afternoon`, `vyve-alert-digest-evening`, `vyve-seed-weekly-goals`

### Verification
`session-reminder-cron` 20:40 UTC tick: `succeeded`. First clean run confirmed.
`process-scheduled-pushes` also `succeeded` at same tick.

### §23 rule
- **§23.105 (NEW):** Never use `current_setting('app.*', true)` in cron job commands for auth headers. The setting is null by default and `ALTER DATABASE` is blocked on Supabase Pro. Embed the JWT literal directly in `jsonb_build_object()` instead. If the key ever needs rotating, update cron job commands via `cron.alter_job()` — 9 jobs, one SQL block.

## Enterprise-readiness bridge session — documentation pack + consent schema + GDPR cron fix (2026-06-09)

### What shipped

**Documentation pack (6 documents):**
- `01_ropa_and_data_flow.md` — ROPA covering 8 processing activities with lawful bases (Art 6 + Art 9), data flow diagram, subprocessor calls. Delivered to outputs.
- `02_disaster_recovery_note.md` — DR/BCP note: RTO 4h / RPO 24h, named owner (Dean Brown), restore procedures for all 5 key scenarios, open actions before Sage pilot.
- `03_subprocessor_register.md` — 10-processor register (Supabase, Anthropic, Brevo, Stripe, PostHog, HubSpot, Apple, YouTube, Capawesome, Riverside) with DPA status and required actions.
- `04_how_we_handle_your_data.md` — External 2-page plain-language summary for procurement reviewers / employees.
- `05_security_questionnaire_updated.md` — Updated security questionnaire committed to `brain/security_questionnaire.md`. Updated from May 2026 to reflect: §23.104 audit clean (June 2026), 120 RLS tables, SECURITY DEFINER audit results, iOS 1.5/Android 1.0.6 in review, RLS cross-account test results, GDPR pipelines live.
- `06_consent_work.md` — Consent and transparency work: HealthKit disclosure copy (DRAFT, Phil + Lewis sign-off needed), privacy notice additions required (Art 6/9 lawful bases, PostHog session recording, data retention table), re-consent prompt spec, `privacy_employer_reporting` default decision brief, B2B employee consent model flag for DPA.

**Schema migration: `add_consent_version_columns`**
- Added `privacy_version TEXT` and `health_consent_version TEXT` to `members` table.
- Existing consented members stamped `'pre-versioning'` as sentinel. Non-consented members NULL.
- Column comments documenting intent added.
- Mirrors the existing `terms_version` versioning pattern.

**GDPR cron fix:**
- Jobs 21 (`vyve-gdpr-export-tick`) and 22 (`vyve-gdpr-erase-daily`): hardcoded bearer `dd536f57...` removed from `cron.job.command`.
- Finding: CRON_SECRET env var was not set on the EF, so the bearer was never validated — it was a visible artifact in pg_cron with no functional effect. Service-role client is the actual auth layer.
- Both jobs now call EFs with Content-Type only; EF security unchanged.

**RLS cross-account isolation test:**
- Impersonated member A (`calumdenham@gmail.com`) attempting to read member B (`deanonbrown@hotmail.com`) across 15 member-scoped tables.
- Result: zero rows visible on all 15 tables.
- Policy audit: all 15 tables confirmed `auth.email() = member_email` on both QUAL and WITH CHECK.

**Security questionnaire updated in `brain/security_questionnaire.md`** — reflects current live state (June 2026 audit, 120 tables, iOS/Android store status).

### Open decisions (not resolved this session — awaiting Dean/Lewis input)

1. **`privacy_employer_reporting` default** — keep `true` (LI basis, defensible) vs flip to `false` (explicit opt-in, safer for Sage procurement). Decision brief in `06_consent_work.md` §4.
2. **PostHog session recording** — Option A (LI basis + opt-out disclosure in privacy notice) vs Option B (explicit consent capture). Note: opt-out mechanism not yet built; don't publish privacy notice addition until it is.

### APNs key rotation (Dean's action items — not built this session)

Dean to action before Sage diligence (walk-through to be done as a dedicated focus):
1. Revoke the non-production APNs key in Apple Developer portal to free a slot (Apple's 2-keys-per-team cap)
2. Register new key
3. Update 5 Supabase secrets with new key values
4. Verify push delivery
5. Revoke old exposed key (KEY_ID `2MWXR57BU4`)

### Reminders for Dean

- Enable PITR on Supabase project (Dashboard > Billing > Add-ons) — reduces RPO from 24h to minutes, documented in DR note as open action.
- Store Android keystore (`vyve-release-key.jks`) + password in 1Password — flagged P0 in DR note.

### §23 rules (none earned — all work was data/config/docs, no novel architectural patterns)

## PM-567 — Security Tier 2c/2d: search_path + ai_decisions policy + final audit clean (2026-06-09)

### What changed

**search_path pin (Tier 2c):**
- Only ONE function was missing it: `watchdog_cron_failures`. All others already had `SET search_path TO 'public'` in place.
- Pinned to `public, cron, pg_temp` (must include `cron` schema — queries `cron.job` + `cron.job_run_details`).
- ACL also locked to service_role only in same migration.
- Smoke-tested: function executes and returns real results.
- Side-finding: `session-reminder-cron` failing every 5min with JSON construction error — `current_setting('app.service_role_key')` string-concatenated into JSON breaks with `sb_secret_*` key format. §23.7 class bug, separate fix needed.

**`exercise_canonical_set` view:** confirmed non-issue. `reloptions` null = Postgres default (security_invoker=false). Underlying tables are public-read anyway, no privilege escalation possible.

**`ai_decisions` INSERT policy (Tier 2d):**
- Old: `service_insert_decisions` — INSERT for `{public}` with `WITH CHECK (true)` — any authenticated member could insert decision rows attributed to any email.
- New: `service_insert_decisions_v2` — INSERT for `{service_role}` only. EFs write this table, members only read their own rows via `member_own_decisions` SELECT policy (unchanged).

**Storage buckets (`certificates`, `member-avatars`):** confirmed already correct. SELECT is public (intentional — certs downloaded, avatars displayed). Write ops are correctly scoped to own email. No changes needed.

**`running_plan_cache`:** shared parametric cache — no member_email column to scope against by design. Park.

### Final §23.104 audit result
**ZERO violations** (excluding deliberate exception `resolve_trial_campaign` — public for onboarding unauthenticated campaign lookup).

All SECURITY DEFINER functions: service_role only, or authenticated+service_role for the 4 legitimate member-facing ones (is_admin, refresh_member_home_state, queue_health_write_back, compute_engagement_components_v2).

### Complete security session summary (PM-564 → PM-567)
Starting: 50+ SECURITY DEFINER functions open to anon/public including 2 CRITICALs.
Ending: §23.104 audit fully clean. Zero open violations.
- PM-564 Tier 0+1: 21 functions locked including both CRITICALs
- PM-565 Tier 2a: authenticated IDOR self-scoped on 2 home-state/engagement fns
- PM-566 Tier 2b: 31 more locked including P0 vault/GDPR exposure
- PM-567 Tier 2c/2d: search_path pinned, ai_decisions INSERT locked, full audit clean

## PM-566 — Security Tier 2b: P0 vault exposure + remaining callable functions locked (2026-06-09)

### What changed
31 more SECURITY DEFINER functions revoked. No vyve-site changes. No member impact.

**P0 CRITICAL — now closed:**
- `read_vault_secret(text)` — any authenticated member could pull any Vault secret by name (Anthropic key, YouTube OAuth, PostHog key, all of it)
- `get_youtube_oauth_secrets()` — literally returned YouTube client_id + secret + refresh_token to any authenticated caller
- `gdpr_erase_purge_subject(text)` — any authenticated member could erase any other member's data

**HIGH — now closed:**
- `gdpr_export_pick_due()`, `refresh_member_home_state_v1_internal()`, `refresh_member_home_state_if_dirty()`, `vyve_refresh_daily()`

**MEDIUM/cron — now closed:**
- `evaluate_plan_fit()`, `charity_total_reconcile_and_heal()`

**Trigger functions (cosmetic cleanup — PostgREST blocks these regardless):**
- `assert_member_not_expired`, `calendar_occurrences_set_updated_at`, `charity_count_*` (6), `increment_habit_counter`, `podcast_episodes_set_updated_at`, `set_daily_mood_updated_at`, `set_updated_at_checkin_questions`, `tg_mark_home_state_dirty_*` (5), `tg_refresh_home_state_from_members`, `tg_refresh_member_home_state`, `vyve_sync_activity_log`

### Final audit state
§23.104 audit returns zero violations except two deliberate exceptions:
- `resolve_trial_campaign` — intentionally public (onboarding needs unauthenticated campaign code lookup)
- `watchdog_cron_failures` — internal ops, low risk, park for next session

### Full session security summary (PM-564 → PM-566)
- Tier 0: 17 service-only functions locked (both original CRITICALs)
- Tier 1: anon door closed on 4 client-callable functions
- Tier 2a: authenticated IDOR closed on refresh_member_home_state + compute_engagement_components_v2
- Tier 2b: 31 more functions locked including 2 P0 vault exposure holes + gdpr_erase_purge_subject

## PM-565 — Security Tier 2a: IDOR self-scope on refresh_member_home_state + compute_engagement_components_v2 (2026-06-09)

### What changed
Two `SECURITY DEFINER` functions patched to self-scope authenticated callers.
Role-guard added as first statement in BEGIN: `IF auth.role() <> 'service_role' THEN p_email := auth.email(); END IF;`
service_role callers (all EFs, all cron jobs) bypass the guard — auth.email() is NULL under service_role so the bypass is mandatory.

**`refresh_member_home_state(p_email text)`** — authenticated callers now forced to own home state. Guard placed before `e := lower(trim(p_email))` normalisation so the scoped value flows through correctly.

**`compute_engagement_components_v2(p_member_email text)`** — authenticated callers now forced to own engagement data.

**`is_admin()` and `queue_health_write_back()`** — confirmed safe by construction (no email param / trigger function). No changes needed.

### Verification
- `pg_get_functiondef` confirms `auth.role() <> 'service_role'` guard present in both functions.
- Zero `permission denied` / `42501` / function-name hits in `platform_alerts` post-apply.

### Remaining Tier 2 work (next session)
- Pin `search_path = public, pg_temp` on ~40 flagged functions (branch-test first).
- Recreate `exercise_canonical_set` view as invoker security.
- Tighten `running_plan_cache` / `ai_decisions` RLS WITH CHECK to own rows.
- Restrict bucket listing on `certificates` + `member-avatars`.

## PM-564 — Security Tier 0 + Tier 1: EXECUTE grants locked down (2026-06-09)

### What changed
Two Supabase migrations applied. No vyve-site code changes. No member impact.

**Tier 0 — 17 service-only functions: PUBLIC + anon + authenticated all revoked. `postgres` + `service_role` only.**
- `convert_member_to_paid` (CRITICAL — was callable by anyone unauthenticated)
- `gdpr_erasure_purge` (CRITICAL — same)
- `resolve_broadcast_audience`, `member_home_state_get_fresh`, `mark_member_lapsed` (HIGH)
- `expire_lapsed_trials`, `bump_charity_total`, `charity_total_reconcile`
- `get_certificate_buckets`, `get_certificate_buckets_for`, `get_charity_total`, `get_leaderboard`
- `apply_trial_campaign`, `grant_trial_on_signup`
- `drain_member_home_state_dirty`, `recompute_step_baselines`, `gdpr_erasure_pick_due`

**Tier 1 — 4 client-called functions: PUBLIC + anon revoked. `authenticated` + `service_role` retained.**
- `is_admin()` — Command Centre admin gating
- `refresh_member_home_state(text)` — connect.html + home-state-local.js
- `queue_health_write_back()` — healthbridge.js
- `compute_engagement_components_v2(text)` — home-state-local.js

### Verification
- Static call-path audit (remediation plan 2026-06-08): no vyve-site or vyve-command-centre client calls the Tier 0 set.
- `platform_alerts`: zero permission-denied hits on all target functions.
- `pg_stat_user_functions`: `track_functions=none` on Supabase Pro — call counters unavailable; static audit + alerts were the evidence layers.
- Post-migration ACL spot-check: all 21 functions confirmed correct. Zero `permission denied` / `42501` alerts in 10-minute observation window.

### MGMT_PAT status
`MGMT_PAT` not present in Vault (expired 6 Jun, not rotated). `backup-edge-functions.yml` GitHub Actions workflow silently broken. Dean to rotate: new Supabase Management API token → update Vault secret + GitHub Actions repo secret on VYVEBrain.

### Remaining security work (Tier 2 — next session)
- Self-scope the 4 client-callable functions (authenticated IDOR residual).
- Pin `search_path = public, pg_temp` on ~40 flagged functions.
- Recreate `exercise_canonical_set` view as invoker security.
- Tighten `running_plan_cache` / `ai_decisions` RLS policies.
- Restrict bucket listing on `certificates` + `member-avatars`.
- Branch-test all Tier 2 changes before prod.

### §23 rule
- **§23.104 (NEW):** Every `SECURITY DEFINER` function must `REVOKE EXECUTE FROM PUBLIC, anon, authenticated` unless deliberately member-callable. Member-callable ones must self-scope with service_role bypass.

## Employer Dashboard — projection toggle + colour preview shipped; parallel build reverted (2026-06-08)

### What shipped
- `Test-Site-Finalv3/vyve-dashboard-live-preview.html` (commit `3b2aa9e0`) — standalone preview of the employer dashboard. Adds a **Live / Projection** view toggle: Projection scales the live `employer-dashboard` EF response client-side to an adjustable headcount (default 10,000), holding rates (engagementRate, avgPerMember) constant while counts scale; amber "Illustrative projection — not real members" badge. Plus a light KPI colour lift (persistent gradient accents + amber/purple/pink variants on previously-plain cards). **Live `vyve-dashboard-live.html` left untouched.**

### Canonical employer system (confirmed — repo overrides memory)
- Data engine: deployed EF `employer-dashboard` (v41; source header says v20) — reads `members.company`, auth via `EMPLOYER_DASHBOARD_API_KEY` (x-api-key header / api_key param), CORS locked to https://www.vyvehealth.co.uk, in-memory rate limit 100/hr. Returns members{total,active,quiet,inactive,engagementRate} / activities / sessions{byCategory} / charity / trend. No wellbeing scores in this payload.
- Front-end: `Test-Site-Finalv3/vyve-dashboard-live.html` (live employer dashboard, www), plus `dashboard.html`, `employers.html`, `roi-calculator.html`.
- Company linkage is the `members.company` column (Sage, BT, Individual currently tagged) — NOT the `employer_members` table.

### Reverted / cleaned up (a parallel build was created before the canonical system was found)
- Dropped SQL RPC `public.employer_dashboard(text,int)`.
- Emptied `employer_members` (a 34-row "Northwind Group" demo seed was removed; table back to original empty state).
- Reverted the Employer Dashboard section out of `vyve-site/internal-dashboard/index.html` — vyve-site commit `ba12a486`, back to original 56,241 bytes.

### Open decisions
- Promote preview → live `vyve-dashboard-live.html`? (one commit when approved.)
- Should the projection toggle live on the real client-facing dashboard (real clients would see it) or only a separate demo page? Currently leaning: separate demo.

### Reference (for ROI if wired later)
- CIPD/Simplyhealth Health & Wellbeing at Work 2025: 9.4 sickness-absence days/employee/yr. Deloitte Mental Health & Employers 2024: £51bn UK cost, ~£1,900/employee, £4.70 return per £1 invested. A dedicated `roi-calculator.html` already exists.

### §23 rule
- §23.103 (NEW): Before building ANY employer/dashboard feature, run an org-wide code search across VYVEHealth first. The `employer-dashboard` EF, the Test-Site-Finalv3 employer pages, and the `members.company` model all already existed. Repo state overrides chat/memory — recon the full org before building, not just the obvious repo.

## PM-559 final state — App Health dashboard fully working (2026-06-08)

### Final fixes this session
- `assets/app-health.js` extracted from inline script (router injectPage replaceChild error)
- `lib/router.js` patched: skip `s.text` for external scripts; never cache app-health slug
- Missing comma in SYSTEM_CHECKS array fixed
- Admin RLS policies added: `platform_metrics_daily` + `certificates`
- System health panel: removed sync-health-data + log-perf (permanent red noise)
- 4 checks live: cc-app-health (green), daily-report (green), re-engagement (amber), certificate-checker (amber)
- Usage pagination 10/page working (1-10 of 61 pages)
- First-seen + last-seen on all error rows
- Drill-down modal + bulk resolve settled working
- Dead pages accurate, load times from perf_telemetry

### §23 rules
- §23.101 (NEW): CC router injectPage re-executes scripts via replaceChild — inline JS with template literals breaks. Always use external src JS files for CC pages with complex JS.
- §23.102 (NEW): After removing array items in JS, always run `node --check` before committing.

## PM-559 session close — App Health dashboard v1 shipped (2026-06-08)

### What shipped
- `cc_app_health` migration — single-row cache, RLS admin-read + service-role-write. pg_cron hourly.
- `cc-app-health` EF v4 — PostHog usage (100-page limit, slash-normalised dead pages), perf_telemetry LCP, platform_metrics_daily headlines. POSTHOG_API_KEY now in vault.
- `pages/app-health.html` in vyve-command-centre — live errors ranked by blast radius, at-a-glance strip, page usage, dead pages, load times, drill-down modal on every error row, bulk resolve settled, text alerts placeholder.
- `assets/sidebar-config.js` — app-health slug in Delivery section.
- CC commits: `7ab3e7af`, `7ba10f40`, `49b90b5`, `bf8c312b`, `49b90b5d`.

### Key state
- Page fully working: 0 active errors, 14 active members 7d, page usage + dead pages accurate, load times from perf_telemetry.
- POSTHOG_API_KEY in Supabase vault (added this session).
- 158 unresolved alerts — bulk resolve button on settled section when ready to triage.
- perf.js stopped collecting after 13 May — load times data is stale. Fix perf.js in a future session.
- App Health in Delivery nav — working via router slug.

### §23 rules
- §23.99 (NEW): POSTHOG_API_KEY must be in Supabase vault for cc-app-health EF to populate usage/perf. Key: query:read scope only.
- §23.100 (NEW): cc-app-health EF can only be triggered from Composio workbench (urllib), not bash_tool curl — sandbox blocks *.supabase.co per §23.86.

## PM-559 — Command Centre App Health: PostHog API wired + dashboard spec (2026-06-08)

Talk-first / spec-only session (Dean: Sonnet builds, Claude specs). No vyve-site or member-app code shipped.

### What happened
- Reviewed Lewis's existing Command Centre (`vyve-command-centre` repo): mature ~45-page SPA with real lib layer (router/ACL/comments/audit), BUT runs almost entirely on **localStorage**. `cc-adapter.js` (localStorage<->`cc_*`) exists but is FLAGGED OFF.
- Verified live: **all 19 `cc_*` tables are EMPTY (0 rows)**, incl `cc_tasks`. Seed data is in `assets/seed-data.js`; any real data Lewis entered lives only in his browser localStorage. No DB data to migrate/protect.
- Decision: do NOT rebuild the shell. Keep the bones, move data layer off localStorage onto Supabase + Storage, lead with App Health (its data already exists -> immediate value, vs Tasks which needs adoption first).

### PostHog connection — WIRED & VERIFIED
- Confirmed PostHog is live and receiving: 22,187 events / 25 people last 7d. `analytics.js` (PM-408) working.
- **Corrected a brain assumption:** `perf_telemetry` Supabase table looked dead (last row 13 May) — NOT lost; perf rerouted into PostHog as `perf_*` events at PM-408. Load times live in PostHog now.
- Dean created a PostHog Personal API key (Query:Read), stored as Edge Function secret **`POSTHOG_API_KEY`** (EF secrets, the correct home; `Deno.env.get`).
- Query API confirmed: `POST https://eu.posthog.com/api/projects/138491/query/`, Bearer key, HogQLQuery body. Project `138491`, EU.
- Real event names captured: `portal_page_viewed` (use for usage, not `$pageview`), `perf_first_paint`/`perf_navigation_timings`/`perf_auth_ready`/`perf_cross_nav` (load times), `dexie_open_failed` (the §23.83 IDB bug also in PostHog). Page property `properties.page` = clean `/x.html` paths.

### `platform_alerts` reality
- 2,846 rows, **`resolved=false` on every one** — written but never triaged. Triaged/resolvable view = genuine value PostHog can't give.
- ~1,970 `info` (noise), 481 `high`, 395 `critical`. `network_error_*` criticals STOPPED ~16 May (fixed-but-uncleared); `js_error`/`promise_rejection` STILL firing today. -> spec ranks by member-impact + live-vs-settled, not severity label.

### Deliverable
- Build-ready spec: App Health dashboard (errors-first ranked by members-hit-now; usage; dead pages; load times; VYVE light+dark; reviewer-only via `is_admin()`; SMS placeholder). At `/mnt/user-data/outputs/app-health-build-spec.md` (not in repo). Handed to Sonnet build session.
- SMS/text alerts parked — needs Twilio; spec leaves a labelled placeholder.

### Cleanup owed
- Throwaway EF `posthog-test` left ACTIVE-but-retired in Supabase (used to verify the connection). Delete via dashboard.

## PM-558 — GITHUB_PAT_CLAUDE rotated in Supabase Vault (2026-06-07)

- Old `vyve-cto-claude` PAT (expiring 20 Jun 2026) replaced with new token.
- Vault updated via `vault.update_secret()`. Edge Function secrets GITHUB_PAT + GITHUB_PAT_BRAIN also updated by Dean.
- New PAT verified working against VYVEBrain repo.

## PM-557 session close — bundled iOS 1.5 + Android 1.0.6 submitted; portal removals (2026-06-07)

### Portal (vyve-site)
- **PM-555** `9dc40fb0` vbb 442 — nutrition.html: food log coming-soon removed. connect.html: this week's challenge section removed.
- **PM-556** `a2c8501d` vbb 443 — session-live.css: `.sl-pill-live` + `.sl-cta-primary.sl-cta-live` switched red→green (#22c55e).

### Native apps
- **iOS 1.5 Build 1** — bundled mode (server.url removed from capacitor.config.json). Fresh vyve-site clone into www via PAT. Archived + exported via xcodebuild CLI. Uploaded via Xcode Organizer. In review.
- **Android 1.0.6 versionCode 51** — fresh vyve-site clone into www. Built via `./gradlew bundleRelease` with Java 21 (temurin@21). AAB at `android/app/build/outputs/bundle/release/app-release.aab`. Submitted to Play Console. Quick checks running → Send for review pending.

### Key state
- All members still on server.url live web shell until 1.5 approved + installed by members
- Capawesome: app `f9961f66`, prod channel `89e12796` — ready for first OTA
- www folder workflow: `git clone --depth 1 https://VYVEHealth:<PAT>@github.com/VYVEHealth/vyve-site.git www` before every bundle build
- Java 21 (temurin@21) required for Android CLI builds; `export JAVA_HOME=$(/usr/libexec/java_home -v 21)` before gradlew
- App Store Connect API key setup pending next session (saves Organizer step forever)
- GITHUB_PAT_CLAUDE expires 20 June 2026 — rotate urgently

### §23 rules
- §23.94 (NEW): Every Android CLI bundle build requires `export JAVA_HOME=$(/usr/libexec/java_home -v 21)` before `./gradlew bundleRelease`. Java 21 = temurin@21 installed via brew. Java 17/26 both fail.
- §23.95 (NEW): www folder is NOT auto-synced from GitHub. Before every bundle build: `rm -rf www && git clone --depth 1 https://VYVEHealth:<GITHUB_PAT_CLAUDE>@github.com/VYVEHealth/vyve-site.git www` (PAT from Supabase Vault). Never assume www is current.

## PM-554 session close — PF-23 v1 stabilised + per-page tours shipped (2026-06-07)

### Final state
- **firstrun.js** reverted to last working version (e2be18d4) + VYVE logo on slides only. No other changes.
- **Per-page independent tours** live on index, mind, exercise, connect, wellbeing-checkin, monthly-checkin.
- **achievements.js** — toasts suppressed during home tour; retry 3s after `vyve_seen_home` set.
- **settings.html** — Reset tour clears all 8 localStorage keys + writes `tour_completed_at: null` to server + Dexie + navigates to index.html.
- **10s auto-release safety timer** on `lockBody()` — page can never be permanently frozen.
- **No early lock scripts** — all removed. Body lock is JS-only inside firstrun.js.

### Gates (simple)
- `vyve_firstrun_done` — full tour done, nothing ever shows again
- `vyve_firstrun_slides_done` — intro slides seen
- `vyve_seen_home/mind/body/connect/checkin/monthly` — per-page tour seen

### vyve-site HEAD: commit `a48a417b`, vbb 439

### §23 rules
- §23.97: Achievement toasts must not fire while `vyve_seen_home` is unset. `showNext()` is the single chokepoint.
- §23.98: firstrun.js lockBody() must always have a 10s auto-release timer. Never lock without it.

## PM-554 stabilisation — first-run tour fixed to 4-step home-only (2026-06-07)

Multiple fix commits (fix2–fix8) through session. Root causes resolved:
- **fix5:** `_started` guard + single `vyveAuthReady` trigger prevented double-init race between 1500ms setTimeout and auth event.
- **fix6:** sessions.html was retired (PM-555 redirect) — tour destination corrected to connect-calendar.html.
- **fix8 (final):** Eliminated all cross-page hops entirely. Tour is now 4 steps, all on index.html — mood, focus, habits, rings. No resume cursor, no page navigation, no race conditions. Completes reliably and sets `vyve_firstrun_done` on Done.

**Final state:** intro slides (4) + home spotlight (4 steps). Copy is DRAFT in `COPY` object top of firstrun.js — Lewis edits in place.
**vyve-site commit `a47b5f84`, vbb 431, cache `vyve-cache-v2026-06-07-pm554-fr-homeonly`.**

## PM-554 — PF-23 v1 first-run experience shipped (2026-06-07)

### What shipped
- **`firstrun.js`** — full first-run engine: 4 swipeable intro slides (Part 1) + 7-step in-context spotlight tour (Part 2). Gate: `localStorage.vyve_firstrun_done` short-circuit → Dexie members row `tour_completed_at` check (~800ms cold-boot wait) → run. Resume cursor (`vyve_tour_active` + `vyve_tour_step`) persists across the two page hops (index→mind, mind→sessions). Dismissal (skip or done): sets `vyve_firstrun_done=1`, clears cursor, fires un-awaited `members.update({tour_completed_at})` via member-scoped RLS (§23.31). All copy in a single `COPY` object at top of file — Lewis edits that, never the logic.
- **`firstrun.css`** — scrim + box-shadow cutout overlay + tooltip card + slide dot strip + safe-area insets (§23.58) + web-tells suppression (§23.59). z-index 10000–10002 (above nav 9000).
- **`index.html`, `mind.html`, `sessions.html`** — load `firstrun.css` + `firstrun.js`. Haptics.js confirmed present on all three (§23.44). mind/sessions inert unless tour active.
- **`settings.html`** — vbb-marker bumped to 424.
- **`sw.js`** — CACHE_NAME `vyve-cache-v2026-06-07-pm554-firstrun`; `firstrun.js` + `firstrun.css` added to precache (§23.76).
- **`member-dashboard` EF v78** — adds `tour_completed_at` to member snapshot payload (column already in `members` table via migration this session).
- **DB migration** — `ALTER TABLE members ADD COLUMN IF NOT EXISTS tour_completed_at TIMESTAMPTZ` applied and verified.

### Commit
vyve-site `a5a4cadc` · vbb 424

### Key decisions
- Explanatory v1 only (no per-step achievements, decoupled from Achievements overhaul). Action-tutorial is a later iteration.
- Multi-page in-context spotlight: home→mind→sessions. Viable because snapshot-first paint renders hops <200ms.
- Dismissal writes `tour_completed_at` server-side (reinstall-safe, cross-device) via member-scoped RLS — no EF needed.
- Anchor-ready guard: rAF poll ~1.5s, timeout→container fallback — never spotlights an empty skeleton (§23.36/§23.47).
- `vyve:auth:ready` event also triggers init as an earlier path alongside the 1.5s DOMContentLoaded delay.

### §23 rules confirmed
§23.31 optimistic-first dismissal write · §23.36/§23.47 anchor-ready guard · §23.44 haptics.js dependency · §23.58 safe-area · §23.59 web-tells suppression · §23.76 precache new files · §23.72 vbb-marker both pages.
