# VYVE Health — Brain Master

<!--CURRENT_FRONT_START-->
**PM-745 (2026-07-08): Men Together cover composed from the crest (PIL: dark-green field + disc + shadow, 1600×900) — assets/partners/men-together-cover.jpg, cover_url set, no OTA needed. All live communities now have covers except Emma Clarke (demo-artefact question still open). vyve-site `1425897f`, vbb 508.**
**PM-744 (2026-07-08): Men Together CIC logo live — Lewis asset optimised to assets/partners/men-together.png (new /assets/partners/ convention), avatar_url set, all avatar surfaces pick it up from data (no OTA required). vyve-site `f49c45a1`, vbb 507.**
**PM-743 (2026-07-08): PARTNER FUNNEL SESSION 2 (gate integrity) LIVE — go-live trigger now BEFORE INSERT OR UPDATE with audited override (GUC `vyve.partner_golive_override`='actor|reason'; trigger self-writes admin_audit_log — never silent). Forensic: "Men Together pct 25" was Dean's declined test row; the REAL finding was 9 live partners with NO progress row (INSERT bypass) — all 9 backfilled honest minimal rows (`admin_onboarded_pre_gate`, pct 13). HELD migration stays held. Assessment scoring moved SERVER-SIDE: EF v7 (`assessment` action grades vs server QUIZ_KEY, sole writer of safeguarding/gdpr gate; save strips protected steps + drops payload.assessment — both forge paths live-proven closed) + wizard `e5205090` (key removed client-side, cross-device resume adopts graded pass). PENDING DEAN: contact emails for Men Together/Alex/Nicola → Gate-A provision (placeholders skipped).**
**PM-741 (2026-07-08): BUNDLED REPLAYS FIXED — YouTube Error 153 (capacitor://localhost origin rejected); playback via NEW same-domain yt-embed.html wrapper + replay-tracker.js initRemote (shim player over postMessage relay — all attribution machinery unchanged). client-error-report EF v2 live: standing client-error intake → platform_alerts (severity high, shell-tagged; details column is TEXT — LIKE dedupe, jsonb contains never matches; both branches invocation-verified). vyve-site `70124da8`, vbb 506, OTA Update 506 live (artifact `3165b4e8`). FOLLOW-UP: live-session pages likely same 153 on bundled — same wrapper pattern.**
**PM-739 (2026-07-08): PLAYFAIR RETIRED APP-WIDE (Lewis) — theme.css --font-head token → DM Sans (+ weight-display 800→700) + all 31 hardcoded literals swept (nav wordmark, certificates ×5 — flag, setup wizards, trial-ended, offline shell). Zero Playfair font-family declarations remain; Google Fonts links inert, cleanup candidate. vyve-site `d9775d64`, vbb 505, OTA Update 505 live (artifact `7047af98`, supersedes 504). Brand palette docs referencing Playfair headings are now historical.**
**PM-739 (2026-07-08): PARTNER FUNNEL SESSION 1 (funnel integrity) LIVE — `partner-onboarding` EF v6 (stale resume_id → 404 `resume_not_found`, one-shot resume-link + submit-confirmation emails via `credentials._system` flags set only on successful send; known gap: unmetered public `start` until Session 3 rate limiting) + wizard rewrite (Test-Site-Finalv3 `cb340d44`): no fake submit success (confirmed-200 gate + failure panel), markOffline()/15s-retry heals, in-memory File refs + retryPendingUploads(), `?resume=<id>` support, `_loadSB` promise fix (async SDK broke resume merge), PostHog per PM-735 config. Lewis: email copy pass non-gating; "Become a VYVE partner" CTA GATING (rec: footer + about.html). Sessions 2–4 approved, scoped in backlog.**
**PM-738 (2026-07-08): Playfair removed from the WORKOUT library (workouts.html ×12 + workouts-library.js ×3; weight-display→bold ×4); exercise.html PM-737 swap reverted (wrong target — Dean meant workouts). vyve-site `5c5ccc40`, vbb 504. OTA Update 504 live (artifact `1509105e`, supersedes 503). Check remaining workouts-*.js injectors if serif persists mid-flow.**
**PM-737 (2026-07-08): podcast.html header restored (stray `hub-page` class removed — audit other destinations) + Playfair removed from exercise.html (Lewis; page-title + hero headline → DM Sans, scope exercise-only). vyve-site `fa461af8`, vbb 503. OTA Update 503 live (artifact `2f85fd4e`, probe-verified, supersedes 502).**
**PM-736 (2026-07-08): Lewis copy — Connect tile "Community" → "Browse All Communities" (vyve-site `33fd0e7d`, vbb 502) + signed OTA Update 502 live on production (artifact `52436357`, probe-verified, supersedes 501).**
**PM-735 (2026-07-08): MARKETING ANALYTICS LIVE — PostHog EU on welcome.html + www homepage (Test-Site-Finalv3 `9e6a70ea`): cookieless, session recording OFF (health-data posture preserved), no PII. Funnel events welcome_section_view/submit/error/success + campaign_code (?c=) and partner_slug (?partner=) super-properties — per-link signup funnels now visible. Context: Lewis's "no onboarding emails" query — pipeline verified healthy (Dean live test signup, flagged is_test); nobody had completed signup. PM-734 = parallel employer-portal demo commit on the same repo.**
**PM-733 (2026-07-08): OTA UPDATE 501 LIVE — signed bundle of vyve-site `74252809` (tonight's full community build, PM-720→730) on production at 100% (deployment `6bfc3a74`, artifact `39691911`). Server-half verified per PM-698: probes against real iOS 1.9 + Android 1.0.8 fleet devices, artifact sha256 byte-matched, contents checked. CLI gotcha: bare `npx capawesome` = deprecated squatter; use `npx -y @capawesome/cli@4.15.0`. Channel now serves 501 (supersedes 479).**
**PM-732 (2026-07-08): replay attribution automated — `replay_partner_attribution` BEFORE INSERT trigger on replay_videos (title→partner via partner-linked calendar rows); backfill re-keyed on calendar partner_id; Calum library = 4 incl. today's Midweek Reset. Rule: every backfill ships with its forward mechanism. Awaiting Dean on 4 ambiguous mindfulness titles.**
**PM-731 (2026-07-08): Calum cover fixed — asset was the problem (calum.jpg top-cropped); full banner copied first-party to session-thumbnails/calum-banner.jpg via one-shot EF copy-cover-asset (now a 410 tombstone — DEAN: delete from dashboard). Gateway rejects legacy anon key on verify_jwt EFs (UNAUTHORIZED_LEGACY_JWT); pg_net is the SQL→EF invocation path. No site change (vbb stays 501).**
**PM-730 (2026-07-08): community cover FINAL — bleed removed (title sat under the translucent header); banner renders flush below the back-button header at natural intrinsic size, hero follows the image. Design rule: text-bearing artwork never under chrome, never ratio-fit. vyve-site `74252809`, vbb 501.**
**PM-728 (2026-07-08): community cover intrinsic-ratio hero — real <img> at natural size drives hero height (session-thumbnails assets aren't 16:9; PM-727's ratio guess cropped). Full banner always visible; gradient min-height fallback. vyve-site `70081493`, vbb 500.**
**PM-727 (2026-07-08): community cover fit — hero banners bottom-anchored at natural 16:9 (100% auto), gradient underlay fills the bleed strip; no more title crop. Pattern: never `cover`-paint text-bearing artwork into arbitrary-ratio boxes. vyve-site `313fac9f`, vbb 499.**
**PM-726 (2026-07-08): community hero bleed v2 — negative margin on MAIN (not the hero; PM-725's first-child margin didn't take on device — pattern rule for inner-page hero bleeds), covers switched to session-thumbnails bucket host photos (PM-724's YT maxres picks 404'd — avoid maxresdefault without fallback), Alex/Nicola avatars → initials. Connect carousel verified intact, no change. vyve-site `535c556d`, vbb 498.**
**PM-725 (2026-07-08): community profile hero bleed — cover sits at the very top under the translucent sticky header (negative-margin + height-compensation, theme.css hub-hero pattern on an inner page). vyve-site `7970cab2`, vbb 497.**
**PM-724 (2026-07-08): COMMUNITY POLISH (Dean device pass) — partner-space/profile top gap fixed (main padding-top removed; sticky header occupies flow space — PM-661-era double-count, check other pages of that era), partner_partners.cover_url added + rendered on Discover card bands and profile hero (Alex/Nicola portraits + Alex/Nicola/Calum covers from branded session thumbs — swaps are one-line UPDATEs), Connect bottom Community tile restored for subscribed members (inverse of top Join card). vyve-site `eb70932c`, vbb 496. Known cosmetic: pillar dot colour mapping differs between partner-space and connect carousel.**
**PM-723 (2026-07-08): COMMUNITY SESSIONS + LIBRARY LIVE — calendar_occurrences.partner_id backfilled by host (Alex 51 / Nicola 48 / Calum 14 upcoming; Sessions tab needed zero code), replay_videos.partner_id added + title-match backfill (32/30/4 of 99), profile Library tab renders the replay catalogue (thumbs, duration) above partner_content_items with cards deep-linking /replays.html?v=; replays.html one-shot ?v= deep link mounts the PM-292-tracked player (matches youtube_video_id or row id). trg_partner_session_min_notice NARROWED to insert-or-starts_at-change — old shape raised on ANY update to partner rows <48h out (would have blocked cancellations). vyve-site `96706dd0`, vbb 495.**
**PM-722 (2026-07-08): INSTRUCTOR COMMUNITIES LIVE — alex-movement + nicola-yoga created (bios from their session catalogues), calum-denham-performance broadened to "Performance, Nutrition & Habits", 9 partner posts seeded with like_counts. New `partner_partners.community_visible` flag hides the 4 bare referral placeholders from Discover + connect carousel WITHOUT touching stripe-reconcile (status stays live). All member surfaces now headline partner `name` with role_title sub (previously role_title||slug, `name` never selected). vyve-site `350227bc`, vbb 494. Emma Clarke demo-artefact question open for Dean/Lewis.**
**PM-721 (2026-07-08): COMMUNITY JOIN FIXED — both member join handlers (partner-space + partner-profile) sent `engagement_segment:'new'`, rejected by the table CHECK (regular/highly_engaged/at_risk only) → silent 400; `partner_memberships` had ZERO rows ever. Field dropped (DEFAULT 'regular'), join failures now console.error'd. vyve-site `e7b3ff6f`, vbb 493. New §23.143: read CHECK constraints before writing literal enum values (2nd occurrence — platform_alerts severity PM-692 was the 1st).**
**PM-720 (2026-07-08): CONNECT HUB WORKOVER (Lewis ask) — community is now the hub's focus. "Your communities" carousel at top (Dexie `partner_memberships_local` first, REST membership fallback on empty; display rows `partner_partners status=live` only — Gate B by construction; cards → partner-profile, trailing "+ Discover" → partner-space); coral community-tile reused as top "Join a community" card when unsubscribed. Recent check-ins section REMOVED from connect.html (renderRecentCheckins early-returns; connect-feed-preview `_kv` pre-warm KEPT — connect-checkin posted-state reads it, PM-201); feed reached via new link under the check-in CTA + post-checkin CTA. Bottom Community destination tile retired. vyve-site `8678d7a5`, vbb 492. Lewis copy tweakable post-ship.**
**PM-707–718 (2026-07-07): CHALLENGES FEATURE SHIPPED end-to-end in one session (Lewis ask). challenges.html live in More (mobile sheet + desktop dropdown), 60-challenge catalogue (55 active) in `challenge_library`, `challenge_enrolments` member-RLS, Dexie V28, `challenges-evaluator.js` nav.js-injected on every page (bus-lens architecture — challenges observe existing logging, zero new tracking), home-screen "Your challenge" card under Today's habits, 23 branded SVG art tiles `/challenge-art/`, VYVE 75 flagship in TRUE 75-Hard shape (6 catalogue-driven daily tasks: auto/manual/photo types, native camera capture → private `challenge-photos` bucket, 3.5L water-target override derived from enrolment, deep links to completion surfaces). vbb 480→491. HARD PRE-LAUNCH BLOCKER: challenge-photos bucket NOT in GDPR erasure pipeline. LEWIS GATES: 60-challenge naming/copy pass, diet/no-alcohol framing, privacy-policy progress-photo line. NEXT-UP PROPOSED: Mind-hub QUIT TRACKER (addiction/sobriety — Lewis's core ask; anti-challenge psychology: total days never reset, compassionate slip handling, craving tools, crisis-scan wiring; Phil clinical gate BEFORE ship, spec to be written). THREE PM RACES tonight vs the Hetzner session (714, 716, 717 — the last collides both ways and is disambiguated in the changelog, not swept). §23.24 held for 714/716.**
**PM-706 (2026-07-07): iOS 1.9 RELEASED by Apple (~13:00 BST). live-update.js FIRST-RUN FAST PATH shipped (vyve-site `cb739c23`, vbb 479): built-in bundle → immediate sync + in-session `reload()` behind "Updating VYVE…" overlay (800ms grace / 60s cap); steady-state path unchanged. Signed Update 479 live on production (deployment `75b78778`, artifact `44bfe9fa`, 100%), server-half verified per PM-698 — retires broken-index 477 (pre-PM-705) from the channel. Caveat: first install still does ONE legacy double-restart (binary's live-update.js runs first); next binary kills it. Gotcha: Capawesome updatedAt/updatedBy bump on DEVICE check-ins. LEWIS: live store description still carries stale PWA copy (§23.1). Backlog: next binary ships CURRENT www.**
**PM-704 (2026-07-05): Android 1.0.8 (54) SUBMITTED to Play — both store resubmissions in review; cohort self-heals via signed OTA on approval. Dual-app comparison exposed the immortal-Dexie property: iOS containers survive every same-bundle-ID install + sync.js additive-pull = server deletes never propagate; Dean's store app renders phantom pre-June rows, dev shell is server-true. Fix (Dean's device): delete+reinstall store app. Backlog: Settings 'resync my data' + reconcile-on-hydrate. Members unaffected today; divergence paths are GDPR rectification and unflushed PF-4 writes.**
**PM-703 (2026-07-05): dev/ship mode switchers live on Dean's Mac (`mode-dev.sh`/`mode-ship.sh`, uncommitted). Dev shell rebuilt as coexisting "VYVE Dev" app — `.dev` bundle ID, inverted icon, server.url, NO LiveUpdate block (never OTA-syncs). Ship config canonicalised as `capacitor.config.ship.json`; mode-ship prints the embedded LiveUpdate block as the pre-archive check (verified tonight). §23: native builds are mode-switched, never hand-edited. Dev shell gets no native push (APNs topic = ship bundle ID) — store install is the push surface.**
**PM-702 (2026-07-05): iOS 1.9 (build 4) SUBMITTED for review (uploaded 00:17Z) + Android 1.0.8 (versionCode 54) AAB built (Play upload pending Dean confirm) — both carry the PM-701 corrected LiveUpdate config + signing public key; www/ ships the device-verified 455 snapshot, OTA pulls signed 477 on first launch. ROOT CAUSE of version chaos: Info.plist HARDCODED 1.8(3), overriding a pbxproj stuck at 1.7 — plist now uses build-setting placeholders, pbxproj is the version source. App Review notes fixed (stale PWA text violated §23.1). Android builds need Android Studio JBR via JAVA_HOME (system JDK 26 too new). LEWIS: store description names HAVEN + group therapy while the clinical gate is open — copy ahead of Phil sign-off.**
**PM-701 (2026-07-04): §23.106 CLOSED — OTA verified end-to-end on Dean's device (476 on-screen). Falsified PM-602: shipped 1.8/1.0.7 binaries NEVER had working OTA — embedded capacitor.config.json was hand-stripped of the LiveUpdate block (zero store devices ever phoned home in 3 weeks), and `publicKey:""` enforced signing. Fixed: canonical root ship-config (LiveUpdate + RSA-4096 public key + readyTimeout 10000), bundles now ALWAYS signed (vault CAPAWESOME_LU_PRIVATE_KEY), signed 476 applied on-device, PM-700 (vyve-site `cdcf6a91`, vbb 477) fixed the live-update.js flag-before-work race, signed 477 live on channel. STORE INSTALLS CANNOT OTA until iOS 1.9 / Android 1.0.8 ship the corrected config — Mac is archive-ready, TOP NATIVE PRIORITY. Dean's dev shell overwritten (rebuild with .dev bundle ID pending). ota-canary-watch cron dead, EF slug to dashboard-delete. Tier 1 left: I (runner off Mac).**
**PM-699 (2026-07-04): Finding K — FIRST-EVER OTA bundle LIVE on Capawesome production channel (deployment `383c172e`, vyve-site `999307c` / Update 476, 100% rollout). Server half VERIFIED: official device probes against 2 real fleet devices + artifact download sha256-matched + contents checked. On-device apply pending — `ota-canary-watch` EF + cron (*/15) auto-emails team@ the moment any of the 5 fleet devices applies (idempotent via platform_alerts). CAPAWESOME_TOKEN now in vault + `capawesome_token()` accessor; account is PAID plan. Bundled cohort catches up ~1 month to current main on next double-restart. §23.106 closes when the tripwire fires. Gotchas: Capawesome /bundles REST deprecated (CLI apps:liveupdates:* only); --git-ref needs the linked repo; devices:probe bumps lastSeenAt.**
**PM-698 (2026-07-04): Tier 1 finding J CLOSED — Google OAuth consent screen PUBLISHED to production (publish-not-verify; vyve-website project 210114068429). 7-day Testing-mode refresh-token expiry ELIMINATED: new token minted via localhost:8765 redirect flow (replaced the oauthplayground redirect URI — weekly re-mint chore dead), proven via refresh-grant + channels.list → VYVE channel, vault YOUTUBE_OAUTH_REFRESH_TOKEN swapped, keepalive invoked live through pg_net → 200 with refresh_token_expires_in ABSENT. Zero consumer changes: keepalive + runner both read vault per-run via RPC. Keepalive cron 25 + token-health cron 35 stay as belt-and-braces. Unverified-app warning persists by design — Dean is the only consenter. Tier 1 remaining: K OTA canary, I runner off Mac. H drafted PM-697.**
**PM-696 (2026-07-04): CRITICAL signup fix — production signup DEAD since PM-689 (welcome.html gated success on the stubbed set-member-password EF; every signup after 3 Jul dead-ended at PASSWORD_SET_FAILED; zero members harmed — the only signup since beat the stub by ~30 min). onboarding v99 (platform v117) sets the chosen password at auth-user creation (exists-path admin PUT; generate_link by email; response carries password_set) + welcome.html `547ad7b` gates on it (retry = idempotent re-onboard, genuinely recovers). Both paths live-verified incl. password-grant sign-in. set-member-password DELETED → findings C + F CLOSED: 66 dead EFs swept (163→96 deployed; ref-checks: 52 crons, DB fn sources, 3 repo greps, 95 keep-set eszip bodies; `achievement-earned-push` KEPT — live dependency of achievement-claim/achievements-sweep/log-activity). Remaining Tier 0: E HAVEN routing (Lewis). Tier 1 J (Google OAuth verification) starting.**
**PM-695 (2026-07-04): Finding G CLOSED — PostHog replay maskAllInputs + email mask + 10% client-side sampling (vault phx key lacks project:write; dashboard setting optional), auth.js v2.6 + index.html inline init lock-step, vbb 476, commit `999307c`. LEWIS: confirm PostHog EU DPA (EU project 138491).**
**PM-691 (2026-07-04): Risk-register finding A FIXED + finding V CLOSED + NEW CRITICAL fixed: GDPR export/erase crons were DEAD (401 every tick — no auth header vs CRON_SECRET gate) since the secret was set; pipelines revived via vault GDPR_CRON_KEY + x-vyve-cron-key header + dual-accept gate. Both executors now CATALOG-DRIVEN via `gdpr_member_scoped_tables()` + `gdpr_table_policy` (71 purge / 3 retain; unregistered new tables default-purge + alert). `gdpr_erasure_purge` rewritten in place: two-pass, retain accounting, zero-residual `verified_clean` gate. gdpr-export-execute → v13 (76 tables incl all Mind pillar, fails-hard on enum failure); gdpr-erase-execute → v14 (verified_clean hard-fail + purges subject's export artefacts from gdpr-exports bucket). CORRECTION: the 2 May erasures were TEST accounts, zero residue — no real-subject harm. All verified by live ticks. Lewis to confirm retain legal bases for DPA.**
**PM-687 (2026-07-03): July calendar uplifted to 6/day — +60 rows (12:00 Mind + 17:30 Movement daily), 188 future sessions, 0 same-day title dupes. Density ceiling on the 76-master library; >6/day needs new recordings.**
**PM-686 (2026-07-03): July live-session calendar regenerated — 121 rows (4 Jul–2 Aug + tonight 20:00), June content pool re-slotted (55 Movement + 21 Mind, notes/hosts/thumbs verbatim), template Movement 07:00/13:00 daily +19:30 Tue/Thu/Fri/Sun, Mind 08:30 daily +19:30 Mon/Wed/Sat, Tue 18:00 Education untouched. Runner heartbeat upcoming 0→4 on next loop, no restart. Cron-27 stale WARNs corrected (it is ACTIVE).**
**PM-685 (2026-07-03): CC IA reorg SHIPPED (PM-639 Phase A). 4-domain nav live in vyve-command-centre (`038799c`): Run the Business / Analytics / Members / Partners; 7-tab hub layer retired; 11 dead pages killed (root Dashboard.html, partners skeleton, performance, brand, 7 orphan partner-*); router href-tab support; `#/performance` links repointed. Layer 2 next: seed-data.js mock audit + kill partners.html hardcoded mocks + sweep 4 unreachable hub pages. Fastly-test with fresh `?z=N`.**
**PM-682 (2026-06-25): Partner referral link FIXED end-to-end. (1) Stripe Payment Links CANNOT pre-apply a coupon (§23.127) — `partner-join-redirect` v4 mints a discounted Checkout Session (`discounts[0][coupon]`); per-partner payment-link objects are DEAD, `payment_link_url` vestigial; onboarding a partner = Stripe coupon + DB row only. (2) Branded `/join/[slug]` works via `Test-Site-Finalv3/404.html` catch-all, NO Cloudflare (§23.129; PM-676's join.html claim was wrong — join.html never runs for the subpath). (3) Earnings = 50% of NET paid (£5), not £20 list (£10): `subscription_value` = net-of-coupon in stripe-webhook v11 + stripe-reconcile v2/v3; column DEFAULT 20 dropped; CC portal MRR + `gross_amount`→`gross` fix (commit 35198f0). (4) `onboarding_v8.html` is DEAD (404) — real questionnaire is `welcome.html`; success_url → `welcome.html?partner=<slug>` (§23.130). (5) Community auto-join: stripe-reconcile cron #52 → every 15 min (`*/15`), so referred members join the community within minutes of paying — rejected the onboarding-EF + webhook-merge alternative as too much risk on signup/earnings paths. Verified live: £10 checkout (Dean screenshot) + reconciler clean run. Coupon code string left as `mentogethercic` (member never types it).**
**PM-675–676 (2026-06-22): Partner referral links fully productionised. Stripe payment links (coupon pre-applied) stored on partner row. Branded URL: www.vyvehealth.co.uk/join/[slug] (join.html dynamic redirect, live + MATCH verified). Men Together CIC: slug=men-together-cic, coupon=mentogethercic, £10 off forever, status=onboarding. Partner onboarding playbook at playbooks/partner-onboarding.md — Claude can create Stripe coupon + link + DB row + branded URL in ~3 min per new partner.**
**PM-674 (2026-06-22): Stripe attribution reconciliation complete. EF stripe-reconcile v1 (nightly cron 02:00 UTC) catches any webhook misses via direct Stripe API call, writes platform_alerts on recovery or failure. partners.html: referral code assignment field in Settings tab. Earnings model: referred=true partner_memberships rows from Stripe coupon use ONLY, not community joins. Action needed: assign Stripe coupon IDs to real partners before attribution can work.**
**PM-666–672 (2026-06-22): Partner portal fully built. Session scheduling (48hr min, writes calendar_occurrences community), scheduled push queue (partner_scheduled_pushes table, partner-push-dispatcher cron EF every 15min), light/dark theme, earnings wired, password gate vyve2026. Demo: admin.vyvehealth.co.uk/partner-portal.html pw:vyve2026.**
**PM-669 (2026-06-23): broadcast-watchdog v2 — complete status treated as healthy (false positive fix). Yoga Flexibility rc=224 broken pipe = genuine Mac network dropout. Nutrition Basics rc=0 short video = false positive. One-line fix: `lc !== "complete"` added to not_live check. Dryrun clean.**
**PM-668 (2026-06-23): Dexie v27 catalogue recovery. PM-665 declared SCHEMA_V26 before SCHEMA_V25 — any device opened during that window had corrupt v26 IndexedDB (calendar_occurrences/replay_playlists/replay_videos wiped). PM-667 fixed declaration order but Dexie skipped re-upgrade. PM-668 adds db.version(27) with upgrade() that clears 5 catalogue tables; sync.js refills on next foreground open. No member data touched. vbb 475. §23.126 added: never chain .version(N).version(N+1) — use separate calls.**
**PM-666 (2026-06-23): Anthropic model string hotfix. `claude-sonnet-4-20250514` → `claude-sonnet-4-5` in `onboarding` v98 (Supabase v116) and `wellbeing-checkin` v36 (Supabase v66). Both EFs 404ing on every AI call. Gokce Erdogan (gkcerdogan@outlook.com) re-onboarded successfully post-fix.**
**PM-665 (2026-06-22): Dexie-first partner community feed. SCHEMA_V26: `partner_community_posts` + `partner_memberships_local` stores. sync.js: memberships sync on login. partner-profile.html: `renderFeedPosts` + Dexie-first `loadFeed` (instant paint on return, bulkUpsert on REST refresh, re-render only on change). vbb 473.**
**PM-664 (2026-06-22): Partner Space Workstreams 1-3 complete. WS3: community push notifications shipped — `partner_subscribers` audience shape in `resolve_broadcast_audience`, Notify Community panel in `partner-portal.html` (preview + send, audited to admin_broadcast_log, routes to partner-profile). Gate B still holds. WS4 (audited Claude-driven actions) is next.**
**PM-661 (2026-06-22): Partner Space full build shipped. Schema: `admin_users.role` += partner, `calendar_occurrences` += visibility/partner_id, `is_partner()` RPC, `partner_memberships` subscription_status + unique constraint, partner-scoped RLS on 6 tables, `get_my_partner_id()` helper. EF `partner-provision` v1 (Gate A provision/deprovision). CC `partner-portal.html` (5-tab partner-facing page) + `partners.html` Gate A wire. vyve-site `partner-space.html` (in-app discover, Gate B enforced, vbb 471). Community tile added to Connect hub. Entry path: Connect → Community tile. Gate B still holds (no live partners yet). Next: `partner-profile.html`.**
## CURRENT FRONT (updated 2026-07-08, PM-740)

**PM-648–657 (SHIPPED): VYVE Money financial wellbeing feature live and working. Five views: Hub/Track/Assess/Plan/Learn. Local-only persistence. Two server writes: `mind_activities` `money_checkin`/`money_course`. Full dual-theme. Bug-fix run PM-649–657 resolved: nav wiring, safe-area, calc timing, auth pattern, localStorage key migration, top gap, `updateSplit()` (no re-render on keystroke), one-time privacy notice, IIFE scope bug (`window.state`/`window.save`). Confirmed working on device PM-657.**
**PM-603: full brain reconciliation vs live Supabase + GitHub. §23 holes filled. §6/§7/§24 inventories + counts brought to live: 133 tables, 47 members (NO enterprise), 41 cron jobs.**
**CRITICAL: HAVEN live in production for 3 real members (Calum Denham, Conor Warren, Kieran Day) + Phil — 9 interactions, clinical gate NOT passed. Pre-Sage blocker; Dean to brief Lewis + chase Phil sign-off.**
**8 CC Insights pages live: App Health, Usage, Retention, Activity Depth, Wellbeing, Platform & UX, Revenue, AI Usage.**

**WARN: log-perf only wired on ~5 pages from May 2026 testing — needs broader portal wiring.**
**WARN: posthog-test EF still active-but-retired — delete via dashboard.**
**iOS 1.8 + Android 1.0.7 IN REVIEW (submitted 11 Jun 2026, PM-602). OTA wiring live in both binaries — §23.106 pending first canary push verification (TOP native priority, pre-Sage gate).**
**PM-648 (2026-06-18): VYVE Money financial wellbeing feature live — money.html + money-calc.js + SCHEMA_V24 (health_snapshot). Mind hub tile added.**
**PM-651 (2026-06-18): VYVE Mental Fitness live — mental-fitness.html (Today/Train/Track three-tab), db.js SCHEMA_V25 (6 new tables: mind_fitness_log/mind_moods/mind_trackers/mind_burnout_checks/mind_recovery_actions/mind_recovery_log), mind.html tile, vbb 464. CLINICAL GATE OPEN: burnout zone thresholds + early-warning values + all zone/crisis copy are PLACEHOLDERS pending Phil sign-off. GDPR erasure path for new tables still needs wiring (backlog). Practices count toward engagement/charity; mood check-ins and burnout checks do not.**
**PM-656 (2026-06-21): Full executable Partner Agreement embedded in `Test-Site-Finalv3/partner-onboarding.html` step 3 (verbatim from Lewis's copy) + DocuSign-style live name/date merge + signed-copy print-to-PDF download. Rev share aligned to 50% across the page + submit payload; `partner_partners.revenue_share_pct` DB default STILL 30 (flip pending Dean, PF-NEXT-7). New gotcha §23.123 (marketing pages carry no portal theme tokens).**
**WARN: vyve-site shipped PM-652–655 with NO brain entries (brain was at 651 when PM-656 closed). Next session: scan those 4 commits and reconcile master/changelog/backlog before claiming new PMs.**
**PM-659 (2026-06-22): Partner onboarding hid Video-modules + Education steps (8→6) + single required "Welcome to VYVE" starter video. `Test-Site-Finalv3/partner-onboarding.html` commit `95d260e7` (`ACTIVE=[0,1,2,5,6,7]` step indirection, dormant panes — re-enable = add 3,4 back). `partner-onboarding` EF **v4**: stopped faking go-live gates — writes safeguarding/gdpr/videos honestly false while deferred + `steps.modules_deferred`, starter gate now `>=1`. HELD migration (deferred-aware pct + go-live gate skip) NOT applied — awaiting Dean + Lewis approval (Phil does NOT gate partner go-live): it lets a deferred partner go LIVE without a safeguarding/GDPR assessment. Until applied, go-live BLOCKS deferred partners (verified). Back-date cohort via `steps->>'modules_deferred'='true'`.**
**PM-660 (2026-06-22): Partner Space mapped end-to-end + build spec authored (`playbooks/partner-space-build.md`) for Sonnet. LOCKED: two-gate model (A=approved→web login+build space; B=Dean+Lewis approval→member-visible, the PM-659 HELD migration — Phil does NOT gate partner go-live; §23.84 is mental-health VIDEO only); partner mgmt WEB-ONLY (`is_partner()` CC-slice); community join FREE (payment is the VYVE membership, partner earns via existing 50% referral); simulated-live not genuinely-live. NEXT-UP: partner web backend + member-facing Partner Space + free subscription/notifications (one schema; `partner_memberships` the hinge; `calendar_occurrences.visibility`+`partner_id` for display-layer audience scoping; notifications = new audience shape over existing push spine). PARKED backlog: QC/ingest pipeline (transcript-first+ffmpeg, exception-only — NOT "AI watches video"), one-channel/9-keys vs separate "VYVE Partners" channel, Google OAuth verification = hard dependency for partner streaming (token only papered over by keepalive, still Testing-mode).**
**PM-692 (2026-07-04): Finding B internal-alerting half SHIPPED — crisis-scan v2.1 wired to ALL disclosure surfaces (weekly incl. HAVEN, monthly, journal, connect; onboarding pre-existing) with persistent platform_alerts records + vault VYVE_INTERNAL_KEY trigger path. wellbeing-checkin v37 (platform v67) + monthly-checkin v21 (platform v33) + migration `crisis_scan_wiring_triggers`. GOTCHA: platform_alerts.severity CHECK = critical/high/info ONLY — 'warning' silently rejected (also fixed in gdpr-erase v4.1). OUTSTANDING: Dean's phone check-in with a concern phrase to live-verify the member-JWT path. Member-facing crisis copy/persona re-route = Phil + Lewis gate.**

**PM-714 (2026-07-07): TIER 1 I CLOSED — live runner OFF Dean's Mac. Hetzner CX23 `vyve-live-runner` 159.69.95.90 (Nuremberg, Ubuntu 26.04, €5.99/mo), systemd daemon, masters at /srv/vyve/masters/media (124 mp4s + 8 host cards), env at /opt/vyve. SSH via vault VYVE_RUNNER_SSH_KEY (Claude drives from Composio sandbox); Dean's Mac key authorized for rsync. Mac launchd retired; ~/vyve-live = cold backup. Watchdog/heartbeat unchanged. Exposed service_role key now ALSO on the box — rotation debt +1 consumer. 6 new Calum sessions live in calendar: Midweek Reset Weds 12:00 + Weekly Review Fris 19:30, in-order rotation; August regen must carry it forward.**

**PM-694 (2026-07-04): Finding D closed — partner-content-upload v6 (verify_jwt:true, server-derived partner_id, shared "vyve2026" key DELETED) + partner-portal.html PM-693 real Supabase Auth login (password gate was shadowing the real boot(); now email+password only, JWT on all EF calls, admin demo fallback intact). crisis-scan v2.2 (feeling/feels + intensifiers). Finding B fully verified end-to-end via Dean's live check-in. OPS: partner Gate-A provisioning needed before real partners can use the portal — 5/7 live partners lack contact_email.**

**PM-740 (2026-07-08): EMPLOYER PORTAL DEMO live at www.vyvehealth.co.uk/employer-portal.html (`Test-Site-Finalv3`, unlinked) for the 9 July Sage meeting — 5 iterations off Lewis feedback in one evening (commits 608c82a3/33385d24/4305dace/f06c91a1/d4b8aad5). Tabs: Overview (Wellbeing Index hero 72/100 + story + insights + team table + ROI) · Deep Dive (UK/EU/Global benchmarks + per-dept drill-down) · Book Experts (17 fictional profiles, booking modal) · Challenges (live leaderboard + launchable templates) · Events · Reports (board pack via print-to-PDF) · Ask VYVE (chat w/ canned answers). Fully self-contained demo data, no keys. PRIVACY-ALIGNED (Dean call): wellbeing company-level only, team views activity/engagement only, challenge data opt-in team aggregates. This demo = de facto spec for the real employer portal build (see backlog). Live vyve-dashboard-live.html untouched. Lewis pre-meeting: rename company via top-right click, set projection headcount, rehearse board-pack Save-as-PDF, verify ROI framing vs Stat Bank. NOTE: two PM collisions this session — 33385d24 msg says PM-735 (true 736), d4b8aad5 msg PM-739 = triple-739 collision, resynced at PM-740 close.**

<!--CURRENT_FRONT_END-->


> Single source of truth for the whole business. Last full rewrite 28 April 2026 PM; §1-18 re-audited and consolidated 26 May 2026 against live Supabase + GitHub state. If this drifts from live reality, rewrite it fully again — do not paper over. **Live counts (members, EF versions, table row counts, page state) live in the database and the repo — this doc never caches them.**

---

## 1. Company overview & legal

| Field | Detail |
|---|---|
| Legal name | VYVE Health CIC (Community Interest Company) |
| ICO registration | 00013608608 — registered March 2026, £52/year renewal |
| Business email | team@vyvehealth.co.uk (all business comms — never personal Gmail/Hotmail) |
| CEO / Founder | Lewis Vines — commercial, sales, content, copy sign-off |
| CTO / Co-founder | Dean Brown — technical, ~99% of build delegated to Claude |
| COO | Alan Bird — part-time shareholder, enterprise procurement background |
| Physical/Fitness Lead | Calum Denham — part-time shareholder, fitness content + programme review |
| Mental Health Lead | Phil — owns HAVEN clinical sign-off and mental health content |
| Sales | Vicki — outbound pipeline, enterprise prospecting |
| Community | Cole — member engagement, retention |
| Stage | Pre-revenue · MVP · trial cohort · iOS + Android live in stores |
| Cohort | Build/test cohort. **47 rows in `members` live (12 Jun 2026): account_type trial 36, comp 10, paid 1 — NO enterprise.** Most are test/team accounts, not real members; `members.is_test=true` flags known test accounts (8+ flagged) and analytics exclude them. The two former `enterprise` rows (Callum Budzinski, Kelly Bestford — team) were relabelled `comp`+`is_test` PM-603 (they had been inflating Revenue MRR by £20). Single paying B2C: Paige Coult (joined 13 April, £20/month, still the only paying member). 3 admin operators in `admin_users`. Public push starting now. |
| Tagline | *Help yourself. Help others. Change the world.* |
| Mission | Proactive workplace wellbeing across three strategic pillars (Physical, Mental, Social) — expressed on the website as five (Mental, Physical, Nutrition, Education, Purpose) |

**CIC advantage.** Operating as a Community Interest Company gives a 6–8 point social-value uplift in public-sector procurement, unlocks grant streams closed to for-profits, and reinforces the charity mechanic. Not cosmetic — a procurement weapon and a capital flexibility lever.

---

## 2. Mission, vision & competitive positioning

VYVE differentiates through **proactive, multi-pillar wellbeing** against competitors that are overwhelmingly reactive and single-pillar. The core message is prevention over cure — build health before it breaks. VYVE is positioned as a performance investment, not a cost centre, underwritten by ROI evidence from Deloitte, RAND Europe, Gallup, The Lancet, University of Warwick, UCL, and WHO.

**The three strategic pillars** are Physical (workouts, cardio, nutrition, running, habit library, exercise hub), Mental (wellbeing check-ins with AI recs, 5 AI personas, monthly pillar check-ins, HAVEN safe-space persona), and Social (live sessions with chat, leaderboards, charity mechanic, community activity, upcoming employer team dashboards).

**The five website pillars** (Mental, Physical, Nutrition, Education, Purpose) are a member-facing expansion of the three strategic pillars — Social is represented via Education and Purpose, Physical is split into Physical and Nutrition. Same doctrine, different audience.

### Competitive landscape

| Category | Detail |
|---|---|
| Primary threats | Unmind (£61M capital), Spectrum.Life (won AXA Health EAP; Cara launching Q2 2026), YuLife (new CEO + Bupa partnership) |
| Unstable players | Headspace (15% layoffs — approach their UK clients), Spring Health (£6–7B Alma acquisition — validates market) |
| Others tracked | Wellhub, BetterUp, Virgin Pulse, Champion Health, Heka, Vitality, Calm, Koa Health, Lyra, Thrive Global |
| Key sales stat | UK hit 5M mental ill-health sick days in the first 58 working days of 2026 |
| Regulatory window | Employment Rights Act SSP changes effective 6 April 2026 — strongest current economic case for preventative wellbeing |

### Company values (six)

Proactive not reactive · Evidence over assumption · People first always · Radical transparency · Long-term thinking · Health for everyone.

### Sales intelligence infrastructure

Pre-call briefs via Sales Intelligence skill (8-step deep dive, ROI calculator, 20-competitor displacement table, objection scripts). Three Pillar Assessment as employer-facing prospect scoring tool. Public Sector Playbook (5 procurement routes, social-value scoring, tender template, 90-day action plan). Research Library with 20+ indexed studies and a Stat Bank of copy-paste statistics.

---

## 3. Business model & revenue streams

| Stream | Detail |
|---|---|
| B2C individual | £20/month per member. Stripe direct link. Onboarding via `welcome.html` (stream-aware since 19 April). |
| B2C trial → conversion | **LIVE end-to-end (PM-573 confirmed; Stripe webhook secret set).** 30-day free trial, then **£10/month-forever** conversion (`VYVE10`; a SEPARATE Stripe link from the £20 new-signup link, must NOT redirect to `welcome.html`). Access gated on `subscription_status` (cron flag-flip `expire_lapsed_trials`, never request-time date math) per §23.85. Off-app / IAP-compliant: wall → marketing-site `continue.html` (binds `members.id`) → £10/mo Payment Link → `stripe-webhook` EF flips `account_type→paid` + `subscription_status→active`. |
| B2B enterprise | £10/user/month. Contact-first sales. Volume tiers TBD before first enterprise contract; indicative bands: 50–200 full rate, 201–500 negotiable, 500+ bespoke. |
| Annual option | 10–15% discount — Lewis decision, Dean adds to Stripe once confirmed. |
| Positioning | Performance investment, not cost centre. ROI evidence anchored by Deloitte, RAND Europe, Gallup, Lancet, Warwick, UCL, WHO. |
| Series A targets | £1–2M ARR, 10%+ MoM growth, sub-8% churn, 100%+ NRR. |

---

## 4. Target market & enterprise pipeline

**Segments.** Private-sector enterprise (Sage warm lead, BT, Barclays, Balfour Beatty as priority targets). Public sector (NHS, councils, government) — CIC status the key wedge. Individuals direct via Stripe.

**Enterprise pipeline.**

| Prospect | Status |
|---|---|
| Enterprise lead (senior wellbeing lead, large UK employer) | Warm. Internal contact via Lewis. Most likely first enterprise client. |
| Secondary enterprise targets | Identified; outreach staged behind first-contract close. |
| Public sector | Playbook ready. CIC status provides procurement advantage. |

**Demo readiness.**

| Item | Owner | Status |
|---|---|---|
| Employer dashboard | Live — aggregate only, no PII | LIVE |
| Member portal | Full experience demoable | LIVE |
| Admin console (Shell 1 + 2 + 3 Sub-scope A) | Live at admin.vyvehealth.co.uk | LIVE |
| iOS app | Live on App Store, latest submission 1.4 in review (PM-413, 26 May) | LIVE |
| Android app | Live on Play Store, latest submission 1.0.5 in review (PM-413, 26 May) | LIVE |
| Presentation deck | Update once check-in sliders updated | UPDATE NEEDED |
| GDPR / DPA | Complete — swap client name in DPA before sending | COMPLETE |
| B2B pricing volume tiers | Lewis + Dean | TIERS PENDING |
| Health disclaimer | Done (Lewis confirmed PM-407, 26 May 2026) | COMPLETE |

---

## 5. Technology stack (complete)

| Technology | Detail |
|---|---|
| Portal hosting | GitHub Pages — `VYVEHealth/vyve-site` (private) → `online.vyvehealth.co.uk` |
| Marketing hosting | GitHub Pages — `VYVEHealth/Test-Site-Finalv3` → `www.vyvehealth.co.uk` |
| Admin console | Separate host — `admin.vyvehealth.co.uk` — served by `vyve-command-centre` repo |
| Native app delivery | `VYVEHealth/vyve-capacitor` (Dean's Mac at `~/Projects/vyve-capacitor`) is the Capacitor project that bundles the `vyve-site` web shell into both store binaries. **iOS: App Store 1.8 (build 3) IN REVIEW (submitted 11 Jun 2026, PM-602) — `server.url` removed, `channel: production` in LiveUpdate block, `live-update.js` OTA wiring bundled.** (1.7 was live; 1.8 supersedes.) **Android: Play Store 1.0.7 versionCode 53 IN REVIEW (submitted 11 Jun 2026, PM-602) — same web shell as iOS 1.8.** Both stores ship the same web shell — single codebase, two binaries. **Deployment model (FLIPPED 2026-06-09 PM-569 — this reverses the PM-475 correction, which is now wrong):** iOS 1.7 ships with `server.url` removed, so **iOS members are FROZEN** on the vyve-site SHA baked into the 1.7 binary and receive changes ONLY via a Capawesome OTA (app `f9961f66` / prod channel `89e12796`). **OTA VERIFIED end-to-end PM-701 (§23.106 closed) — but shipped 1.8/1.0.7 store binaries have a broken embedded config and can NEVER OTA; the cohort joins via iOS 1.9 / Android 1.0.8 (corrected config + signing public key). Channel serves signed vbb-506 (artifact `3165b4e8`, PM-741; supersedes 505/`7047af98`). All bundles RSA-signed (vault CAPAWESOME_LU_PRIVATE_KEY).** Dean alone runs the dev-loop server.url shell on his iPhone (→ `online.vyvehealth.co.uk`), so he sees every vyve-site commit live within the WKWebView cache window (2-15min); members do NOT. **Both platforms are now bundled (iOS 1.7 + Android 1.0.6).** A member freezes on the bundled vyve-site SHA the moment they install/update, so the OTA gap (§23.106) applies to the WHOLE cohort, not iOS-only. A member still on an older pre-bundle Android build keeps seeing live commits until they update. Only Dean's dev-loop iPhone is deliberately kept on server.url. vyve-capacitor REMOTE is behind Mac-local: the 1.5/1.6/1.7 ship-state (config server.url removal, version bumps) is uncommitted on remote (latest remote commit PM-560) — curate + commit per PM-413 Pending #2. |
| Brain | `VYVEHealth/VYVEBrain` — markdown source of truth, session-loaded at start of every Claude session |
| Authentication | Supabase Auth. `auth.js` v2.5 gates every portal page. `VYVE_RETURN_TO_KEY` in localStorage. Admin Console uses separate admin-side session. `is_admin()` SECURITY DEFINER RPC for Command Centre admin gating (PM-402). |
| Primary datastore | Supabase — project `ixjfklpckgxrwjlfsaaz` (West EU/Ireland, Pro plan). **133 public tables** as of 12 June 2026. |
| Portal AI | Anthropic API (Claude Sonnet 4). Server-side via Supabase Edge Functions only — never in committed HTML. Spend cap ~£50/month. |
| Operational AI | 24 custom Claude skills running daily/weekly/monthly intelligence, content, sales, and monitoring workflows for Lewis. |
| Automation | Make (Lewis only, social publishing). Dean uses `log-activity` EF directly — Make retired from Dean's stack. |
| Payments | Stripe. Live link: `buy.stripe.com/00wfZicla1Em0NnaIB93y00`. Coupons `VYVE15` and `VYVE10`. Redirects to `welcome.html`. First paying B2C: Paige Coult @ £20/month. |
| Email | Brevo — transactional SMTP API with custom HTML. No campaign builder, no Brevo branding injected. Verified sender `team@vyvehealth.co.uk` (ID 1, name "VYVE Health"). Proxy endpoint `smtp/email` (no `/v3/` prefix). |
| HealthKit integration | `@capgo/capacitor-health@8.4.7`. iOS device-validated. 7 read scopes (steps, distance, active energy, workouts, cardio, sleep, weight); 1 write scope (weight only — workout write-back unsupported by Capgo 8.4.7 on iOS). Cohort-wide post 1.2 approval — `member_health_connections` row presence is the truthsource. |
| Push notifications | Live end-to-end. Native APNs via `push-send-native` v5 (auto-revokes 410/400 BadDeviceToken). Web VAPID via `send-push` v13 (RFC 8291 aes128gcm). Service worker `push` + `notificationclick` listeners shipped 28 April. Reminder triggers (`habit-reminder`, `streak-reminder`), `achievement-earned-push`, and broadcast-push infrastructure (PM-402: `admin-broadcast-push` + `scheduled-push-runner` + `broadcast_schedules` table + Lewis-facing admin UI at `admin.vyvehealth.co.uk/#/broadcast`) all delegate to `send-push`. |
| Analytics | PostHog (`phc_8gekeZglc1HBDu3d9kMuqOuRWn6HIChhnaiQi6uvonl`, EU instance `eu.i.posthog.com`). Identity + event taxonomy live since PM-408 (26 May 2026) via `analytics.js` bridge subscribing to 29 VYVEBus events at `envelope.origin === 'local'` (no cross-tab/cross-device double-counting), with `is_dean` flag for filtering dev traffic out of dashboards and `host_kind` splitting `capacitor://` bundled native from `https://` web fallback. `window.vyveEFFetch(fnName, url, opts)` wraps fetch and captures `ef_error` on non-2xx/network. Session recording configured 100% in `posthog.init`. |
| CRM | HubSpot — `app-eu1.hubspot.com`. Hub ID 148106724. Timezone Europe/London. Currency GBP. |
| Streaming | Riverside (7 studios, permanent links) + YouTube (**ONE channel — `UCuptZFgSk0ZmNnE2IbYBdtg` "VYVE"** — with **9 reusable RTMP stream keys + 8 category playlists** all on that one channel; each stream key paired to a dedicated Riverside studio). Castr (scheduled pre-recorded). Architecture for scaling to 12-15 live sessions/day: reusable-stream pattern. `session-publish` EF (v5) PRE-CREATES broadcasts only (autostart/monitor/autostop OFF — **autostart is DEAD on this channel**); the pusher (`vyve-live-runner.py`) drives `ready->live` and `live->complete` explicitly around the ffmpeg push. |
| Live-runner host | **Hetzner Cloud CX23 `vyve-live-runner` — 159.69.95.90** (Nuremberg, Ubuntu 26.04, €5.99/mo, Dean's account, project "VYVE Health"). Runs `vyve-live-runner.py` as systemd daemon (PM-714; replaced Dean's Mac launchd). Masters at `/srv/vyve/masters/media`, config at `/opt/vyve`. SSH via vault `VYVE_RUNNER_SSH_KEY`. Ops: `playbooks/live-runner-ops.md`. |
| Podcast | *The VYVE Podcast* (rebranded from *The Everyman Podcast*). Page live at `vyvehealth.co.uk/vyve-podcast.html`. |

### Retired technologies — never suggest

| Technology | Replacement |
|---|---|
| Google Sheets | Supabase. Sheets legacy only for PAD/credentials reference. |
| Apps Script | Retired from portal. Only Action Ticks (strategy dashboard) + `backup.gs` remain permanently. |
| Typeform | Replaced by `welcome.html` (stream-aware since 19 April). |
| Looker Studio | Replaced by HTML dashboards on GitHub Pages. |
| Auth0 | Gone entirely. Supabase Auth primary. Never say "Auth0 gated". |
| Kahunas | Replaced by the VYVE Health app. Never reference in member copy — product is "VYVE Health app". |
| Make (Dean) | Retired from Dean's stack. All activity writes via `log-activity` EF. |
| onboarding_v8.html | Superseded by `welcome.html`. |
| PWA framing | Product is described as "native iOS app built with Capacitor wrapper" — App Review notes must not call it a PWA per §23.1. |

---

## 6. Supabase architecture

Project `ixjfklpckgxrwjlfsaaz` (Pro plan, West EU/Ireland). **133 public base tables as of 12 June 2026**, all RLS-enabled (member-scoped tables on `auth.email()=member_email`; the `cc_*` analytics caches are admin-read). Live row counts are never cached in brain — query Supabase directly or read the auto-refreshed `brain/schema-snapshot.md` (regenerated weekly Sunday 03:00 UTC by `schema-snapshot-refresh` cron). Tables grouped below by purpose; the full live list lives in the DB.

### Core member + activity (member-scoped RLS)

| Table | Purpose |
|---|---|
| `members` | Core member profiles. Email PK. Persona, welcome recs, goals, consent flags, `exercise_stream`, `avatar_url`. **PM-420 step 3:** added `baseline_steps_p50`/`baseline_steps_p25`/`baseline_steps_p75` INT NULL + `baseline_source` (CHECK in `healthkit_history` / `manual_chip` / `deferred`) + `baseline_computed_at` + `baseline_days_available` + `baseline_activity_band` (CHECK in `under_3k` / `3k_5k` / `5k_8k` / `over_8k`). Populated by `pull-baseline-steps` EF v1 at consent time via Capgo `queryAggregated` 90-day window. **PM-428:** `baseline_steps_p50` is now kept live by `public.recompute_step_baselines()` (SECURITY DEFINER) — medians `member_health_daily` steps over a rolling **90-day** window EXCLUDING non-wear days (`< 1000` steps), min 5 wear-days, for members with a live `member_health_connections` row; source stays `'healthkit_history'`; idempotent. Cron jobid 33 daily 04:10 UTC. The consent-time snapshot was going stale (e.g. deanonbrown2 stuck at 7,500 vs live 5,882) — the picker reads this column for its Just Steps slider default/baseline. **Also added since the 26 May audit:** `is_test BOOLEAN DEFAULT false` (PM-572 — test/team accounts; analytics exclude where true), `privacy_version` + `health_consent_version TEXT` (PM-603 enterprise-bridge — consent versioning, existing consenters stamped `'pre-versioning'`), `tour_completed_at TIMESTAMPTZ` (PM-554 first-run gate). |
| `employer_members` | Employer–member relationships (empty until first enterprise goes live). |
| `daily_habits` | Habit completions. Cap 10/day via BEFORE INSERT trigger; over-cap routed to `activity_dedupe`. `notes='autotick'` distinguishes HK auto-ticked rows. |
| `workouts` | Workout completions. `source` column (`'manual'` vs `'healthkit'`). Cap 2/day for `source='manual'` only. HK-sourced rows bypass entirely. |
| `cardio` | Cardio completions. Same source-aware cap as workouts. |
| `session_views` | Live session views. Cap 2/day all sources. |
| `replay_views` | Legacy replay views table (no FK to `replay_videos`, additive into engagement-score Connect pillar). |
| `replay_video_views` | Per-video replay attribution from the YouTube IFrame API tracker (`replay-tracker.js`). One row per (member, video, client_id). Written at watch_seconds ≥ 30, updated every 30s. FK `youtube_video_id → replay_videos ON DELETE CASCADE`. |
| `session_live_views` | Per-live-session attribution from `player-tracker.js` (PM-304). 30s heartbeats during live broadcasts. Replaces legacy `tracking.js` writes to `session_views` for live shells. |
| `wellbeing_checkins` | Weekly check-in submissions with AI recommendations. UNIQUE on `(member_email, iso_week, iso_year)`. |
| `weekly_scores` | Weekly dashboard scores (wellbeing_score + engagement_score). |
| `monthly_checkins` | Monthly 8-pillar wellbeing check-in (`iso_month` YYYY-MM key, 24 columns: 8 pillar scores + matching notes + avg + ai_report + goal_progress). |
| `live_checkin_submissions` | Embedded weekly live check-in form (member+week_start unique). |
| `daily_mood_checkins` | Five-face daily mood tap on home (PM-258). |
| `daily_checkin_prompts` | Catalogue of daily prompt copy. |
| `checkin_reactions` | Member reactions on Connect check-ins. |
| `connect_checkins` | Connect-pillar member check-in posts. |
| `mind_activities` | Mind-pillar log (`kind` discriminator: breathwork / journal / affirmation / visualisation / meditation / sleep). Path 2 from PM-172 design lock. |
| `movement_activities` | Body-pillar Movement track. PM-307 first-class promotion (walk / stretch / yoga / mobility / pilates / other), backfilled from legacy `cardio.logged_via='movement'` + `workouts.plan_name='Movement'`. **PM-420 step 4a-pre-1 extended schema:** added `display_name`, `manual_steps`, `counts_for_charity` (default true), `hk_native_uuid`, `hk_promoted_to`, `prompt_kind`, `metadata` JSONB. `source` CHECK loosened to accept legacy `'manual'` alongside new vocabulary `hk_workout` / `manual_supplement` / `manual_log` / `prompt_tick`. 38 historical rows renamed `manual` → `manual_log`. Two new partial unique indexes: prompt-tick daily dedupe + hk-native-uuid dedupe. Fully trigger-wired (`auto_time_fields_movement`, `zz_lc_email`, three `mark_home_state_dirty` triggers). **PM-420 step 4c live write surfaces:** quick-log (`source='manual_log'`, +Sport kind), Today's Movement card (`source='prompt_tick'`, `prompt_kind`, daily-unique dedupe), Add Activity modal (`source='manual_supplement'`, `manual_steps`, `counts_for_charity=false` — watch-off bouts + HK step top-ups, summed onto the HK ring base). |
| `weekly_goals` | Recurring weekly goals (4-row template, reset Mondays via `seed-weekly-goals` cron). UNIQUE `(member_email, week_start)`. |
| `activity_dedupe` | Over-cap activity rows — routed by triggers, not discarded. |
| `qa_submissions` | QA test submissions. |
| `ai_interactions` | All Anthropic API calls (prompt, response, tokens, model). `triggered_by` ∈ `weekly_checkin / onboarding / running_plan / milestone / manual / re_engagement`. |
| `ai_decisions` | AI-driven decision audit (persona assignments, rec selections). |

### Achievements (Phase 1 shipped 27 April; v2 catalogue ship landed May)

| Table | Purpose |
|---|---|
| `achievement_metrics` | Metric definitions across pillars (Habits, Body, Mind, Connect, Check-ins, Focus + HK/collective/tenure/one-shot hidden categories). **107 rows live (26 May 2026).** Each has `source` (`inline` for log-activity-driven, `sweep` for cron-driven), `is_recurring` flag, `sort_order`, `phil_approved` flag for Mind/Check-ins clinical gating. **Architectural redirect since PM-335:** member-action metrics evaluate **client-side** via `achievements-evaluator.js` (Dexie-first, bus-subscribed, ~1660 LOC, ~65 handlers across 13 events), not server-inline — instant feedback on threshold-crossing tap is non-negotiable. Server-side `_shared/achievements.ts` + `log-activity evaluate_only` path still live for v1 server-wired metrics; unique constraint on `member_achievements` makes dual-path safe. |
| `achievement_tiers` | Tier rows (= ladders × thresholds). **538 rows live (26 May 2026).** `threshold numeric`, `title`, `body`, `copy_status` CHECK in `(placeholder, approved)`. `CASE WHEN copy_status='approved' THEN ... ELSE EXCLUDED.title END` upsert gate protects approved copy from re-seed overwrite. |
| `member_achievements` | UNIQUE `(member_email, metric_slug, tier_index)`. `earned_at`, `seen_at` (null = unseen toast pending), `notified_at`. Member-scoped read + UPDATE on own rows; service-role only INSERT/DELETE. Idempotent claim via `achievement-claim` EF v1. **Reminder:** sync.js is additive-pull; server deletes don't propagate to Dexie. |

### Workouts, exercise, programmes

| Table | Purpose |
|---|---|
| `workout_plans` | Workout library rows across plan days (~313 rows, 12 Jun 2026). |
| `workout_plan_cache` | Per-member workout programme (JSONB). UNIQUE constraint contradiction (surfaced PM-411) being resolved in PM-420 step 4a-pre-2: drop `workout_plan_cache_member_email_key` (full unique on `member_email`) and keep `workout_plan_cache_one_active_per_member` (partial unique WHERE `is_active=true`). Enables plan history (multiple wpc rows per member, only one active at a time). Onboarding EF v86 LIVE (deactivate-old + insert-new pattern). Site patch for `workouts-session.js` (PATCH must filter `is_active=eq.true`) **pending atomic 4-file commit**. Full-unique drop migration pending site patch landing. |
| `manual_step_estimates` | PM-420 step 4a-pre-1. Daily 4-band chip estimate for non-HK members on Movement page. PK `(member_email, estimate_date)`, UPSERT on band tap. Bands: `under_2k` (2000) / `5k` (5000) / `7_5k` (7500) / `over_10k` (10000). RLS member-scoped. `vyve_lc_email` trigger. Empty post-create (zero rows yet). |
| `exercise_logs` | Plan-agnostic set/rep/weight logs. |
| `exercise_swaps` | Member exercise substitutions. |
| `exercise_notes` | Per-exercise notes. |
| `custom_workouts` | Member-created workouts. |
| `shared_workouts` | Shared/community workouts. |
| `programme_library` | Programmes (gym, movement, etc). `category` backfill outstanding (PM-411 — movement plans structurally homeless until categorised). |
| `member_running_plans` | Per-member running plans (Supabase-first since 20 April). Multiple per member, one active. |
| `running_plan_cache` | AI running plan cache (5,376 cacheable combinations). Shared parametric cache keyed on `cache_key` — NOT member-scoped. RLS authenticated-only. |
| `exercise_canonical_names` | Alias-to-canonical mapping. Drives canonicalisation triggers across 7 write surfaces. |
| `exercise_name_misses` | Audit surface for unmapped exercise names. Never blocks the underlying write. |

### Habits, nutrition, weight, mind catalogue

| Table | Purpose |
|---|---|
| `habit_themes` | Monthly habit themes. |
| `habit_library` | Source habits. `health_rule jsonb` column drives autotick (null = manual-only). |
| `member_habits` | Habits assigned to members. |
| `nutrition_logs` | Food log entries. (Food log locked Coming Soon PM-374 — entry-points soft-gated, table preserved.) |
| `nutrition_my_foods` | Member-saved custom foods. |
| `nutrition_common_foods` | Pre-populated food database (~125 rows). |
| `weight_logs` | Member weight entries. One row per member per day (upsert on conflict). |
| `breathwork_patterns` | Catalogue of breathwork patterns. Public-read RLS. 4 active rows at launch (`box-4444`, `sigh`, `478`, `coherent-55`). |
| `breathwork_music` · `breathwork_imagery` | Optional breathwork accompaniment catalogues. |
| `affirmations_library` | Catalogue of affirmations. 30 active rows at launch — Claude-generated placeholders, Lewis to edit live. |
| `affirmation_favourites` | Member-saved affirmations. |
| `taglines` | Member-tagline catalogue. |

### AI, persona, knowledge

| Table | Purpose |
|---|---|
| `personas` | 5 AI coach personas (NOVA, RIVER, SPARK, SAGE, HAVEN) with full system prompts. |
| `persona_welcome_copy` | Hydration overlay welcome lines (persona × goal). NULL goal = persona generic fallback. HAVEN never goal-echoes (CHECK invariant + code short-circuit). |
| `persona_switches` | Member persona change requests. |
| `knowledge_base` | Knowledge rows (15). |

### Catalogue tables (§23.45 + §23.46 pattern, Lewis edits in Studio, devices hydrate via sync.js)

This is now a first-class pattern with 9+ catalogues built on it. Edit via Supabase Studio → Dexie picks up within `CATALOGUE_FRESH_TABLES` (5 min) OR immediately on `CATALOGUE_INVALIDATION_KEY` bump. Each catalogue has a `FALLBACK_*` const in the consuming page for cold-paint defaults — keep in lockstep.

| Table | Purpose |
|---|---|
| `service_catalogue` | Available sessions and content. `image_url` drives thumbnails. |
| `replay_playlists` | Replay category playlists (8 — one per stream). |
| `replay_videos` | Per-video YouTube metadata. Reconciled against YouTube via `refresh-replay-videos` v2 (DELETE-NOT-IN reconciliation closes the upsert-only stale-row gap, PM-410). |
| `mind_videos` | Mind sub-page videos (meditation / sleep / visualisation / breathwork). `kind` discriminator. |
| `persona_welcome_copy` | (See AI section above — same pattern.) |
| `how_to_resources` | How-to library (`kind ∈ pdf/video`). Renders `how-to-pdfs.html` / `how-to-videos.html`. |
| `podcast_platforms` | Podcast platform link chips on `podcast.html`. |
| `checkin_questions` | Versioned weekly + monthly check-in slider questions. Rails in place; hydration onto `wellbeing-checkin.html` + `monthly-checkin.html` is a follow-on touch when Lewis writes rows. |
| `daily_checkin_prompts` | Daily prompt copy. |

### HealthKit pipeline

| Table | Purpose |
|---|---|
| `member_health_connections` | Per-member HK connection state. Truthsource for autotick eligibility (allowlist dropped 26 April). |
| `member_health_samples` | Raw HK samples — long-format, per-sample. Includes sleep segments with `metadata.sleep_state`. |
| `member_health_daily` | Aggregated daily long-format (`queryAggregated` — steps/distance/active_energy per local date). |
| `member_health_write_ledger` | Write-back attempts (weight only; anti-echo via `native_uuid`). |

### Dashboard + aggregation

| Table | Purpose |
|---|---|
| `member_home_state` | One row per member. Dashboard aggregate (65+ columns including v2 engagement: `engagement_focus_points` / `engagement_habits_points` / `engagement_body_points` / `engagement_mind_points` / `engagement_connect_points` / `engagement_checkins_points` / `engagement_consistency_mult` / `engagement_variety_mult` / `engagement_active_days_7` / `engagement_pillars_touched_7` / `engagement_score_v2` from PM-295, plus 5 `last_*_at` from PM-16). Writer is `refresh_member_home_state(p_email)` plpgsql, fired synchronously by `zzz_refresh_home_state` AFTER INSERT/UPDATE/DELETE triggers on 8 source tables (`cardio`, `daily_habits`, `replay_views`, `session_views`, `weekly_goals`, `weekly_scores`, `wellbeing_checkins`, `workouts`) — same-write-fresh, no staleness. PM-386 added `mind_activities` / `movement_activities` / `connect_checkins` to dirty-mark triggers. HealthKit tables inherit refresh via autotick writes through `daily_habits` / `workouts` / `cardio`. |
| `member_home_state_dirty` | Dirty-queue table drained every 5 min by `vyve_drain_home_state_dirty` cron. |
| `member_activity_daily` | Per-member per-day aggregate. Refreshed every 30 min via `vyve_rebuild_mad_incremental`. |
| `member_activity_log` | Chronological activity log. |
| `member_stats` | Per-member rolling stats. Recomputed every 15 min via `vyve_recompute_member_stats`. |
| `members.planfit_suggestion` | PM-420 4d jsonb col. Pending plan-up nudge `{from_plan,to_plan_id,to_plan_name,median_14d,end_target,fired_at}`, set by `evaluate_plan_fit()`, read by movement.html banner, nulled on accept/dismiss (dismiss also stamps `planfit_suggestion_dismissed_at` 30-day cooldown). |
| `company_summary` | Enterprise aggregate rollup. Recomputed daily 02:00 UTC. |
| `platform_metrics_daily` | Platform-wide metrics per day. Recomputed daily 02:15 UTC. |
| `platform_alerts` | Central monitoring — errors, failures, proactive alerts. Service-role only. |
| `platform_counters` | Single-row-per-counter aggregate (charity_total). Reconciled daily 02:30 UTC. |
| `watchdog_alerts` | Email-watchdog suppression (per-code 6h dedupe). |
| `perf_telemetry` | Client-side paint/interaction telemetry sink. Written by `log-perf`. RLS service-role-only. |

### Certificates, engagement, sessions

| Table | Purpose |
|---|---|
| `certificates` | Issued certificate records. Global sequential numbers via `next_certificate_number()`. **PM-435:** re-pillared onto the five Your Journey buckets — `activity_type` ∈ {habits, mind, body, connect, checkins} + legacy {workouts, cardio, sessions} (widened CHECK); `pillar` column (legacy rows tagged `'legacy'`). Counts come from `public.get_certificate_buckets()` (single source, mirrors `engagement-v2 renderProgressTab` caps). Unique `(member_email, activity_type, milestone_count)`. |
| `engagement_emails` | Re-engagement email tracking. Streams A/B (C1/C2/C3 retired 4 May). |
| `session_chat` | Live session chat (last 50 per session). Open INSERT/SELECT for live chat. |
| `session_categories` | Session category metadata. |
| `calendar_occurrences` | Scheduled session occurrences (drives `*-live.html` shells; `starts_at` should be now/now+30s for testing per PM-304 walk lesson). |
| `broadcast_schedules` | Recurring scheduled broadcast push rows (PM-402). Lewis adds via Studio with `slug` UNIQUE + `audience` jsonb + `recurrence` jsonb. Drained by `vyve-broadcast-scheduler` cron every 5 min. |

### Live content delivery + simulated-live schedule (locked 2026-06-02)

**Model.** Live sessions are simulated-live: a pre-recorded master pushed in real time over RTMP (`ffmpeg -re`) into a reusable YouTube stream key. **Autostart is DEAD on this channel** — a broadcast on autostart sits in `ready` forever and a manual transition is rejected. So: `session-publish` v5 (hourly cron job 27) PRE-CREATES the liveBroadcast (unlisted, autostart/monitor/autostop OFF, DVR), binds the category reusable stream, playlistItems.insert. The pusher `vyve-live-runner.py` (VYVEBrain scripts/, PM-446) then pushes ffmpeg, polls the bound stream active, transitions `ready->live`, and `live->complete` on push end. `refresh-replay-videos` v2 (03:30 UTC) pulls the 8 playlists into `replay_videos` -> Replays. RTMP key NOT in Supabase -> resolved live via `liveStreams.list(part=cdn)`. Runs on the Hetzner VPS `vyve-live-runner` (159.69.95.90, systemd, PM-714 — Mac interim retired); cannot run in an Edge Function. **Full ops playbook (access, layout, new-video flow, smoke test, recovery): `playbooks/live-runner-ops.md` (PM-716).** Runner is the multi-session daemon (supersedes the single-session `simulated-live-worker.py`).

**Cadence (3-4/day).** 07:00 Movement (themed) / 08:30 Mind (themed) / 13:00 Movement booster (blended) / 19:30 Wind-down (restore). Tuesday mornings = Healthy/mobility series. Repetition accepted.

**Recyclability rule.** Practice content (yoga/pilates/mobility/meditation/breathwork/affirmations/journaling/wind-downs) recurs freely; talks air once then on-demand in Replays.

**Library (riverside_ masters, deduped).** 53 Movement (yoga 15, gentle/yin 6, pilates 5, flows 7, flexibility 3, mobility 17) + 21 Mind (meditation 3, breathwork 3, affirmations 2, visualisation 1, journaling 2, talks 10) = 74 airable. 4 explainers NOT aired -> Mind-section intro content. Excluded: 3x background_5min; morning_stillness (pending). Lewis new set: Doing Hard Things + Not Drinking Alcohol -> talks; Why I Founded VYVE -> launch feature/onboarding; Welcome to VYVE -> onboarding; Suicide and Men -> gated (§23.84).

**Go-live = two tracks.** (1) Seed Replays now by uploading back-catalogue straight into the 8 category playlists (empty since PM-410). (2) Run the 3-4/day schedule on top. 30-day calendar (Wed 3 Jun -> Thu 2 Jul 2026) built; titles map to riverside_ files at wiring time, each -> a `calendar_occurrences` row.

### Notifications + push

| Table | Purpose |
|---|---|
| `member_notifications` | In-app notifications. Written by `send-push` AND by `log-activity` v23+ achievement evaluator. |
| `push_subscriptions` | VAPID web push subscriptions (dormant since 15 April; native is the iOS channel post-1.2). |
| `push_subscriptions_native` | APNs subscriptions for native iOS push. Android/FCM rows reserved (parked). |
| `scheduled_pushes` | One-shot delayed push queue (member-callable "Remind me in 2h"). Drained by `process-scheduled-pushes` cron every 5 min. |
| `admin_broadcast_log` | Audit log of admin broadcast pushes. RLS admin-gated. |
| `member_notifications` | (Listed once above.) |

### Member prompts + mood (PM-375)

| Table | Purpose |
|---|---|
| `member_prompts` | Lewis-driven in-app questionnaires (popup container). |
| `member_prompt_questions` | Questions per prompt (multi / single / slider / text / yes_no). |
| `member_prompt_dismissals` | Per-member gate state. |
| `member_prompt_responses` | Member answers. Read in Supabase Studio for the trial. |

### Connect challenges + reactions

| Table | Purpose |
|---|---|
| `weekly_challenges` | Catalogue of weekly Connect challenges. |
| `weekly_challenge_participation` | Member participation. |
| `checkin_reactions` | Reactions on Connect check-ins. |

### Challenges (PM-709→718, 7 Jul 2026)

| Table | Purpose |
|---|---|
| `challenge_library` | Catalogue: 60 challenges (55 active). slug PK, pillar (body/mind/connect/habits/engagement), difficulty, goal_type (count/streak/daily), goal_target, duration_days, metric (bus event / any:logged / vyve75), metric_filter jsonb (kind/mode/stream/before_hour/min_km/rule), hard_mode_available, is_flagship, image_url (→ /challenge-art/*.svg), `daily_tasks` jsonb (daily type: [{key,label,short,type:auto\|manual\|photo,auto?,target_litres?}]). Studio-edited; 5-min CATALOGUE_FRESH window. |
| `challenge_enrolments` | Member-scoped RLS. id = client UUID, status active/completed/expired/abandoned, hard_mode, started_at/ends_at (self-timed from join), progress_count, streak_current/best, reset_count, `day_state` jsonb (daily bitmaps, photos{date→storage path}, weeks, pillars, counts). Optimistic Dexie writes + fire-and-forget REST PATCH (last-write-wins — small-window sync limitation, PM-704 family). |

Storage: **`challenge-photos` private bucket** — progress photos, member-scoped RLS (first path segment = auth.email()), client-compressed 1280px JPEG. **NOT yet in the GDPR erasure pipeline — hard pre-launch blocker.**

### Podcast catalogue

| Table | Purpose |
|---|---|
| `podcast_episodes` | Episode list. |
| `podcast_platforms` | (See catalogue section above.) |

### Admin + command centre (`cc_*`, `admin_*`)

| Table | Purpose |
|---|---|
| `admin_users` | Admin-console operator accounts. |
| `admin_audit_log` | Immutable log of admin write actions. Service-role only. |
| `cc_clients`, `cc_leads`, `cc_investors`, `cc_partners` | Command Centre CRM tables. |
| `cc_tasks`, `cc_decisions`, `cc_okrs` | Task/decision/OKR tracking. |
| `cc_finance`, `cc_revenue`, `cc_grants`, `cc_invoices` | Financial tracking. |
| `cc_posts`, `cc_sessions`, `cc_intel`, `cc_knowledge`, `cc_documents`, `cc_swot`, `cc_episodes`, `cc_calendar_events` | Content + intel. |
| `cc_app_health`, `cc_usage`, `cc_retention`, `cc_wellbeing`, `cc_platform`, `cc_activity`, `cc_revenue_cache`, `cc_ai` | **Command Centre Insights analytics caches (PM-559→594).** One JSONB-cache row per page, admin-read RLS, §23.104 revoke applied. Each rebuilt by its own hourly cron (jobids 38–45) from its `cc-<page>` EF. Drive the 8 admin Insights pages (App Health, Usage, Retention, Wellbeing, Platform & UX, Activity Depth, Revenue, AI Usage) at `admin.vyvehealth.co.uk/#/<page>`. |
| `vyve_job_runs` | Background job execution log. |

### GDPR pipeline (07 May 2026)

| Table | Purpose |
|---|---|
| `gdpr_export_requests` | Article 15 data-export queue. Walked by `gdpr-export-execute` via `gdpr_export_pick_due()` with `FOR UPDATE SKIP LOCKED`. 1-per-30-days rate limit member-self. |
| `gdpr_erasure_requests` | Article 17 right-to-be-forgotten queue. 7-day cancellation window via `due_at`. Walked by `gdpr-erase-execute`. |

### Partner Space (PM-630 admin backend + PM-631 self-serve onboarding)

| Table | Purpose |
|---|---|
| `partner_partners` | Partner lifecycle/public entity. `status` applied→vetting→interview→contract→onboarding→live→suspended→declined; `pillar` body/mind/connect; `revenue_share_pct` default 30; `slug`,`role_title`,`bio`,`why`,`feel`,`avatar_url`,`verified`,`rating`. **PM-631 added `contact_email`** (partial-unique on `lower()`, NULL allowed) — plain contact data (PM-632 dropped its unique index; the self-serve draft is keyed by `partner_id`, not by email). Admin Invite path leaves it NULL. |
| `partner_applications` | Review artefact, 1:1 via `partner_id`. `credentials` jsonb + `reference_contacts` jsonb. **PM-631 uses `credentials` as the self-serve draft store AND final intake bag** (contact, practice, agreement+e-sign, document refs as private-bucket object paths, launch, welcomePost). No `status` column — status lives on `partner_partners`. |
| `partner_onboarding_progress` | 8 gate booleans in `steps` jsonb + `pct_complete` + `safeguarding_passed`/`gdpr_passed`. **PM-631 added `assessment_score`, `assessment_passed_at`.** `trg_assert_partner_golive` blocks `status→live` until both passes AND pct=100; `trg_sync_partner_onboarding_pct` syncs pct. |
| `partner_content_items` | Partner videos/sessions. `moderation_status` draft/in_review/approved/flagged/returned (§23.122; `published`→`approved` PM-684, CHECK still transitionally allows `published`). `publish_at` (NULLABLE; NULL = approved-but-unscheduled = NOT live; §23.139) + `thumbnail_url`. FK → `calendar_occurrences`/`replay_videos` (rides existing live/replay infra). |
| `partner_programs`, `partner_community_posts`, `partner_memberships`, `partner_payouts` | Programs (lessons jsonb), community feed, member↔partner joins+engagement segment, payout runs (`run_partner_payouts`). |

**Storage (PM-631):** `partner-docs` (PRIVATE, 15MB, image+pdf — qualifications + profile photo; Photo ID & DBS removed PM-634) and `partner-content` (PRIVATE, 500MB, video — starter content). Sensitive docs private-only via EF-issued signed upload URLs; never public, never on `partner_partners`. Profile photo → `avatar_url`. **PM-684:** `partner-thumbnails` (PUBLIC, 5MB, image) added for poster frames — public read avoids per-thumb signing (§23.139).

### Activity caps (BEFORE INSERT triggers)

| Activity | Cap | Notes |
|---|---|---|
| `daily_habits` | 10/day | Generous headroom — `activity_dedupe` divert only at 11th+ insert/day/member. |
| `workouts` | 2/day **for `source='manual'` only** | HK-sourced rows bypass entirely. |
| `cardio` | 2/day for manual only | Same. |
| `session_views` | 2/day | All sources. |

Charity + certificate counters stay independently capped at 2/day via `get_charity_total()` and `increment_*_counter()` read-path caps.

---

## 7. Edge Functions — live inventory

**~150 Edge Functions deployed (12 June 2026)** — the live `list_edge_functions` is canonical; this inventory is not exhaustive. ~80 actively operational; the remainder are one-shot patchers / seeders / debug helpers / dormant throwaways. The 9 April security audit identified ~89 for deletion — partial cleanup complete; backlog item still open. **Added since the 26 May snapshot:** the `cc-*` Insights suite, `stripe-webhook`, `apply-trial`, `session-reminder-cron`, `broadcast-status`, `youtube-token-health`, `replay-playlist-backfill`, `seed-host-thumbnails`, `exercise-storage-batch` (see CC + trial subsection below).

> **Versioning note.** Source-level semantic versions live in the EF source-file header comment (`// <ef-name> v<N> — <one-liner>`). To check the deployed version, read the source. The Supabase platform deploy counter (`version: N` in `list_edge_functions`) is a deploy/redeploy artefact and not surfaced here.

### Core operational (member-facing + cron-driven)

| Function | Status | Purpose |
|---|---|---|
| `onboarding` | LIVE v87 (Supabase version 92) | New member onboarding. Two-phase (fast persona/habits/recs + `EdgeRuntime.waitUntil()` for 8-week workout JSON). Stream-aware. **Single-file build** (emails.ts + workouts.ts inlined into index.ts — see §23.79). v87 (PM-420 step 4b): `writeWorkoutPlan` deactivate-old now scoped by surface (`&programme_json->>surface=eq.<surface>`) so re-onboarding one stream can't wipe the other surface's active plan. Carries v86 (deactivate-old+insert-new) + v85 (PM-419 surface stamping) + v84 (PM-408 flat-progression + deterministic movement plan) + v83 (crisis-scan). `ezbr_sha256: 9fbfb39875120dddd4029b7d0974df7d229e2c06c623476a81ff1fbe2d199dd4`. |
| `member-dashboard` | LIVE v77 (PM-497) | Full dashboard data in one call. Returns `_buckets` (from `get_certificate_buckets_for` SQL RPC) + raw pillar arrays. Includes `health_connections` + `health_feature_allowed` + `habits` block + `achievements` block. Reads `member_home_state` for `*_this_week` cached counts. |
| `employer-dashboard` | LIVE | Aggregate employer analytics. API-key auth (no PII). |
| `wellbeing-checkin` | LIVE v30 (PM-516: enriched debrief prompt + structured output) | Branching 5-step check-in. Enriched signal from 7 tables (home_state, stats, checkin history, daily mood, monthly, HealthKit). Structured AI debrief: debrief_text + habit/content cards. Grace period check. Writes `ai_interactions`. |
| `monthly-checkin` | LIVE | Monthly 8-pillar check-in. |
| `log-activity` | LIVE | PWA activity logging. Also serves as `evaluate_only` endpoint for trigger pages that write direct to PostgREST. Inline achievement evaluation + push fan-out under `EdgeRuntime.waitUntil()`. |
| `log-perf` | LIVE | Anonymous-friendly client telemetry sink (per-page TTFB / FP / FCP / LCP / INP / custom `auth_rdy` / `paint_done`). JWT-validated. Writes `perf_telemetry`. |
| `anthropic-proxy` | LIVE | Server-side Anthropic proxy for running plans + misc AI calls. `verify_jwt:false` at platform with internal `supabase.auth.getUser()` validation. Writes `ai_interactions` audit. |
| `generate-workout-plan` | LIVE | AI workout plan generation (invoked from onboarding's waitUntil path). |
| `sync-health-data` | LIVE (v22, ACTIVE) | HealthKit sync. Stamps `source:'healthkit'` on promoted workout/cardio rows. **Clarification (resolves the old "dead since 24 May" WARN):** the *server-side scheduled* HK sync path was retired 24 May in favour of foreground-only/Dexie-first sync (§23.93) — the EF itself is alive and invoked on app foreground, not dead. No HK background delivery by design. |
| `get-health-data` | LIVE | Reads back health data for portal display. |
| `leaderboard` | LIVE | Privacy-aware leaderboard. Thin wrapper over `get_leaderboard(p_email, p_scope, p_range)` RPC — sort + top-100 slice + caller-row lookup all in Postgres window functions over `member_home_state`. Scales to 100K members without wire bloat. |
| `notifications` | LIVE | In-app notifications read/write. |
| `share-workout` | LIVE | Shared/community workout handler. |
| `workout-library` | LIVE | Library API for workouts + paused-plan logic. |
| `member-achievements` | LIVE | Achievements API surface — `tiers[].earned_at` / `tiers[].is_current` / `tiers[].progress` for the engagement-page grid + dashboard slot. |
| `achievement-claim` | LIVE | Idempotent achievement claim (anti-tamper via catalog lookup). Fans out to `achievement-earned-push` only on `newly_inserted=true`. |
| `achievements-mark-seen` | LIVE | Toast-clear endpoint. |
| `achievements-sweep` | LIVE | Daily 22:00 UTC cron for tenure / HK lifetime / collective metrics. Per-member fan-out via `achievement-earned-push` after upsert. |
| `connect-feed-preview` | LIVE | Connect community feed slice (PM-201 cache infrastructure). |
| `connect-feed-counts` | LIVE | Connect badge counts. |
| `connect-challenge-summary` | LIVE | Weekly Connect challenge summary. |
| `get-activity-feed` | LIVE | Personal activity feed. |
| `gdpr-export-request` / `gdpr-export-execute` | LIVE | Article 15 data-export queue + executor (4MB JSON / 27s typical, 7-day signed URL via Brevo email). |
| `gdpr-erase-request` / `gdpr-erase-cancel` / `gdpr-erase-status` / `gdpr-erase-execute` | LIVE | Article 17 erasure pipeline (7-day cancellation window, per-subject `gdpr_erase_purge_subject` PL/pgSQL deletes in dependency order with explicit ALTER TABLE DISABLE/ENABLE TRIGGER pairs — `session_replication_role=replica` unavailable from service-role connections). |

### Push + email

| Function | Status | Purpose |
|---|---|---|
| `send-push` | LIVE | Unified push fan-out — VAPID web (RFC 8291 aes128gcm) + APNs native (delegated to `push-send-native`). Service-role gated, dual-auth (`SUPABASE_SERVICE_ROLE_KEY` OR `LEGACY_SERVICE_ROLE_JWT` — see auth-shape gotcha PM-402: EFs that do `Bearer === SERVICE_KEY` equality check need the JWT-format `LEGACY_SERVICE_ROLE_JWT`, not the new `sb_secret_*` publishable shape). |
| `push-send-native` | LIVE | APNs sender. ES256 JWT via Web Crypto. Routes per environment. 410/400-BadDeviceToken auto-revokes. |
| `register-push-token` | LIVE | PWA `push-native.js` POSTs `{token, platform, environment, app_version}` to `push_subscriptions_native`. |
| `habit-reminder` | LIVE | Daily 20:00 UTC push. |
| `streak-reminder` | LIVE | Daily 18:00 UTC push (≥7 day streak threshold). |
| `achievement-earned-push` | LIVE | Thin glue between achievement evaluators and `send-push`. Skip in-app dedupe via `skip_inapp:true`. |
| `schedule-push` | LIVE | Member-callable delayed-push enqueuer ("Remind me in 2h"). |
| `process-scheduled-pushes` | LIVE | 5-min cron consumer for `scheduled_pushes`. |
| `admin-broadcast-push` | LIVE | Lewis-facing manual broadcast UI fan-out (PM-402). Defence-in-depth: front-end `is_admin` gate (Layer 1) + EF re-checks `is_admin` RPC under caller JWT (Layer 2). 6-shape audience resolver (`all` / `inactive` / `company` / `company_slug` / `email` / `emails[]`). |
| `scheduled-push-runner` | LIVE | 5-min cron for recurring broadcast schedules. |
| `send-email` | LIVE | Brevo transactional delivery. |
| `re-engagement-scheduler` | LIVE | Daily 08:00 UTC. Streams A + B (C1/C2/C3 retired 4 May). Reads `member_home_state.last_*_at` cols. Writes `ai_interactions` audit. |
| `send-session-recap` / `send-journey-recap` / `send-password-reset` / `send-test-welcome` / `vicki-preview-sender` / `vicki-doc-sender` | LIVE | Specific email surfaces. |
| `email-watchdog` | LIVE | 30-min cron checking 5 failure modes (missing daily delivery, hard-bounces, blocklist, pg_cron failures, bounce-spike). Per-code 6h suppression via `watchdog_alerts`. |
| `alert-digest` | LIVE v2 (PM-421) | Morning / afternoon / evening platform-alert digest. v2: per-incident diagnosis is three tiers — `plain` (everyday language, jargon banned) + `impact` (who's affected, what a member sees, member-count-led) + `technical` (engineer detail underneath). Sonnet 4 returns `{plain,impact,technical}` JSON; unparseable/failed → graceful fallback, email never blocks. Client-side severity is set by `classifySeverity()` in `auth.js` vyveMonitor (PM-423) — known-benign WebKit transients (e.g. IndexedDB `in-progress transaction`) downgraded to `info` so the digest doesn't cry wolf; genuine errors stay `high`. |

### Reports + housekeeping

| Function | Status | Purpose |
|---|---|---|
| `daily-report` | LIVE | Cron 08:05 UTC daily. |
| `weekly-report` | LIVE | Cron 08:10 Monday UTC. |
| `monthly-report` | LIVE | Cron 08:15 1st of month UTC. |
| `certificate-checker` | LIVE | **v24 (PM-435).** Daily 09:00 UTC. Reads `get_certificate_buckets()` (five capped Your Journey buckets: habits/mind/body/connect/checkins), issues one cert per 30 per track with `pillar`, upsert ignoreDuplicates (race-safe), emails only on new inserts. Certs render client-side via `/certificate.html?id=` (HTML/Storage generation dropped at v23). Calls `next_certificate_number()` — v23 called a non-existent fn and silently numbered all certs `1`; fixed. |
| `certificate-serve` | LIVE | Serves certificate HTML. |
| `warm-ping` | LIVE | 5-min keep-warm against 10 EFs. |
| `check-cron` | LIVE | Cron audit/verification. |
| `seed-weekly-goals` | LIVE | Mon 00:01 UTC seeder for the recurring weekly goals strip. Idempotent ON CONFLICT DO NOTHING. |
| `storage-cleanup` | LIVE | Storage housekeeping. |
| `schema-snapshot-refresh` | LIVE | Sunday 03:00 UTC, auto-commits structural changes to VYVEBrain. `GITHUB_PAT_BRAIN` fine-grained PAT, expires 18 April 2027. |
| `youtube-token-keepalive` | LIVE | Daily 03:00 UTC YouTube OAuth keepalive. |
| `refresh-replay-videos` | LIVE | Daily 03:30 UTC YouTube → `replay_videos` sync with DELETE-NOT-IN reconciliation (PM-410 — closes upsert-only stale-row gap; gated to run only if all 8 playlists fetch cleanly). |
| `session-publish` | LIVE | v5 — PRE-CREATE only (mint+bind+playlistItems.insert) from `calendar_occurrences` within 60min lookahead. `enableAutoStart=false` (autostart DEAD on this channel — the worker transitions ready->live + ->complete explicitly), `enableAutoStop=false`, monitorStream off. Hourly cron. |
| `broadcast-status` | LIVE | v1 (PM-445, verify_jwt) — member live-page probe. OAuth `liveBroadcasts.list?part=status` -> `{live:bool|null}` so `*-live.html` lets broadcast-live override the clock (§23.65). Fail-safe: returns live:null on YouTube/token error -> client clock-falls-back. |
| `youtube-token-health` | LIVE | v1 (PM-447, verify_jwt:false, cron job 35 `0 4 * * *`) — daily YouTube OAuth tripwire. Refresh grant + authed `channels.list` probe; alerts team@ via send-email on failure, silent when healthy. Consent screen published PM-698 — token non-expiring; tripwire retained. |
| `crisis-scan` | LIVE v2.1 (platform v9) | **PM-692.** Deterministic safeguarding scanner (critical/concern keyword tiers, no AI). Wired into: onboarding, wellbeing-checkin (weekly, incl. HAVEN turns), monthly-checkin, journal saves (`zz_crisis_scan_journal` trigger on mind_activities), community posts (`zz_crisis_scan_connect` trigger on connect_checkins). Every flag: persistent `platform_alerts` row FIRST (critical/high — raw member text kept OUT of the row, email only) then Brevo safeguarding email to team@. Gate: Bearer SERVICE_KEY (EF-to-EF) or `x-vyve-internal-key` == vault VYVE_INTERNAL_KEY via `vyve_internal_key()` RPC (DB-trigger path). Member-facing crisis copy/routing NOT shipped — Phil + Lewis gate. |

### Admin console + ops

| Function | Status | Purpose |
|---|---|---|
| `admin-dashboard` | LIVE | Admin console data API. |
| `admin-member-edit` / `admin-member-habits` / `admin-member-programme` / `admin-member-weekly-goals` / `admin-programme-library` | LIVE | Admin write surfaces. All audited to `admin_audit_log`. |
| `edit-habit` | LIVE | Habit definition edit helper. |
| `cc-data` | LIVE | Command Centre data API. |
| `internal-dashboard` | LIVE | Internal metrics. |
| `ops-brief` | LIVE | Ops brief generation. |
| `github-proxy` / `github-proxy-marketing` | LIVE | GET + PUT to vyve-site / Test-Site-Finalv3 via `GITHUB_PAT`. |
| `off-proxy` | LIVE | Open Food Facts proxy for `log-food.html`. |
| `broadcast-announcement` | LIVE | Broadcast announcement helper. |
| `connect-feed-preview` | LIVE | (Listed above.) |
| `partner-onboarding` | LIVE | **PM-631.** Self-serve partner application backend. **public** (`verify_jwt:false`, same posture as member onboarding); draft keyed by unguessable `partner_id` (no login); actions `start`/`save`/`upload-url`/`submit`. Writes `partner_partners` (status applied), `partner_applications.credentials`, `partner_onboarding_progress` gates+assessment, `partner_content_items` at `in_review`; notifies team via `send-email`. Service-role writes; PM-632: no auth, draft is a capability token. **PM-659 v4:** submit writes go-live gates HONESTLY (no longer hardcodes safeguarding/gdpr/videos true) — deferred steps false + `steps.modules_deferred`; `starter_videos_uploaded` now `starter.length>=1`; pct left to the BEFORE trigger. **PM-739 v6:** stale/unknown `resume_id` at `start` → 404 `resume_not_found` (no blank-draft minting); one-shot resume-link email (first valid email, start w/ save fallback) + submit confirmation email via `credentials._system` flags set only on successful send (send-email EF, team@, tags `partner-application-resume`/`partner-application-received`); KNOWN GAP: unauthenticated `start` unmetered until Session 3 rate limiting. **PM-743 v7:** SERVER-SIDE assessment scoring — new `assessment` action grades raw answers vs server-held `QUIZ_KEY=[1,1,0]` (lockstep with wizard quizData order) and is the SOLE writer of the safeguarding/gdpr gate; `save` strips protected steps keys (safeguarding_passed/gdpr_passed/admin_approved/modules_deferred), drops `payload.assessment`, ignores client pct; `submit` reads the graded row not `training.assessmentPassed`; `credentials._system` server-owned. |
| `partner-file-url` | LIVE | **PM-636.** Admin-gated (`verify_jwt:true`, caller in `admin_users` + `active`) signed-DOWNLOAD url (5-min, content-disposition attachment) for `partner-content`/`partner-docs` objects. Powers the Download button in CC `partners.html` content queue. **PM-684 v2:** strips a leading bucket prefix from `media_url` (`<bucket>/<key>`) before signing (§23.137). |
| `partner-content-upload` | LIVE v6 | **PM-694 (finding D).** verify_jwt:true. Caller from JWT → admin_users role: partner → partner_id server-derived from contact_email (client value ignored); admin/owner → explicit partner_id (ops/demo). Shared x-portal-key DELETED. commit guards storage_path prefix. Actions sign/sign-thumb/commit/list/update unchanged. |

### Command Centre Insights + trial conversion (PM-559→594)

| Function | Status | Purpose |
|---|---|---|
| `cc-app-health` | LIVE | App Health dashboard cache (errors-first, ranked by members-hit-now; usage; dead pages; load times). Cron jobid 38 hourly `:00`. Writes `cc_app_health`. |
| `cc-usage` | LIVE | Usage Analytics (Overview + Members tabs, 360 modal, never-active outreach). Cron jobid 39 hourly `:30`. Writes `cc_usage`. Admin send-actions (never-active re-engagement) JWT-gated. **v11 (PM-612/613):** members_json carries lifecycle (active/installed/consented/signed_in/never) + `consent_done`/`installed`/`installed_via`; install-proof = PostHog `capacitor://`-ever (365d) OR native push / HealthKit, fail-safe to push/HK. Status simplified to 3 tiers (PM-614). |
| `cc-retention` | LIVE | Retention & Activation (funnel, dormancy, cohorts, at-risk, Day-N curve, re-engagement effectiveness). Cron jobid 40 hourly `:15`. Writes `cc_retention`. |
| `cc-wellbeing` | LIVE | Wellbeing analytics (score trend, member table, distribution, 8-dim baseline, wellbeing×activity correlation). Cron jobid 42 hourly `:55`. Writes `cc_wellbeing`. |
| `cc-platform` | LIVE | Platform & UX (PostHog HogQL page views + `ef_error`; `perf_telemetry` percentiles). `is_dean` filter to drop dev traffic. Cron jobid 43 hourly `:05`. Writes `cc_platform`. |
| `cc-activity` | LIVE | Activity Depth (adoption features, pillar breakdown, watch-time, exercise depth, heatmap). Cron jobid 41 hourly `:45`. Writes `cc_activity`. |
| `cc-revenue` | LIVE | Revenue (MRR, subscription breakdown, trial pipeline, 12-week new-member trend). Cron jobid 44 hourly `:20`. Writes `cc_revenue_cache`. |
| `cc-ai` | LIVE | AI Usage (`ai_interactions` by trigger/persona, HAVEN compliance detail, 12-week trend). Cron jobid 45 hourly `:35`. Writes `cc_ai`. |
| `cc-data` | LIVE | Command Centre data API (CRM/ops tables). |
| `stripe-webhook` | LIVE | Trial→paid conversion webhook (`verify_jwt:false`, signature-verified). Flips `account_type→paid` + `subscription_status→active` on checkout. §3 conversion path. |
| `apply-trial` | LIVE | Trial activation helper (`resolve_trial_campaign` lookup). |
| `session-reminder-cron` | LIVE | 5-min cron (jobid 37) — upcoming-session reminder push. Was the trigger for the PM-568 cron-auth fix (§23.105). |
| `youtube-token-health` | LIVE | Daily YouTube OAuth tripwire (jobid 35). |
| `broadcast-status` / `replay-playlist-backfill` / `seed-host-thumbnails` / `exercise-storage-batch` | LIVE | Live-page broadcast probe (§23.65); curated replay backfill (§23.91); Storage thumbnail seeder (§23.92); exercise media batch. |

### Shared modules

Two `_shared/*.ts` files referenced by multiple EFs (must redeploy in lockstep when modified):

- `_shared/taxonomy.ts` — workout-type constants, `classifyWorkout()`, `HealthRule` / `HealthProgress` / `HealthEvaluation` types, UK time helpers. Imported by `member-dashboard` + `sync-health-data`.
- `_shared/achievements.ts` — server-side achievement evaluator (`evaluateInline()` + `getMemberAchievementsPayload()`). 60s in-memory catalog cache. Skips `hidden_without_hk` metrics for members without HK connection. Imported by `log-activity` + `member-dashboard`. **Note:** member-action evaluation now primarily Dexie-first client-side via `achievements-evaluator.js` per PM-335 redirect; server path retained for v1 server-wired metrics until full retirement (unique constraint on `member_achievements` makes dual-path safe).

### Retired / dormant / one-shot

Roughly 40+ functions in the deployed list are dormant: one-shot seeders (`seed-library-*`, `seed-b1`, `seed-weekly-goals`), one-shot migrations (`run-migration-*`, `setup-*`, `create-*`, `inject-nav`, etc.), debug / inspect tools (`debug-*`, `inspect-*`, `force-cache-refresh`, `test-*`, `schema-snapshot-refresh`, `secret-scan`), throwaway YouTube tools (`yt-stream-diag`, `yt-channel-audit`, `yt-broadcast-delete`, `replay-inventory-tmp`, `replay-archive-tmp`, `replay-ghost-cleanup-tmp`), per-member action triggers (`trigger-owen-workout`, `trigger-callum-workout`, `send-stuart-reset`, `generate-stuart-plan`, `ban-user-anthony`), and model-comparison harness (`model-compare-*`, `onboarding-v83-test`). **Cleanup pending** — Composio doesn't expose a delete-EF tool; deletions need Supabase CLI or dashboard.

### EF deployment rules

- Always provide a **full** `index.ts` — no partial updates.
- `verify_jwt:false` for public-facing functions that handle their own auth or need unauth'd access (onboarding, send-email, webhooks).
- `verify_jwt:true` for everything that reads member data server-side OR is service-role-internal.
- `esm.sh` imports unreliable in Deno — use Deno built-ins (Web Crypto, std library) for crypto operations.
- `SUPABASE_DEPLOY_FUNCTION` for body changes; `SUPABASE_UPDATE_A_FUNCTION` corrupts deployed bundles.
- `SUPABASE_GET_FUNCTION_BODY` returns ESZIP binary (not human-readable); use native `Supabase:get_edge_function` MCP for source.

### Cron jobs — **SUPERSEDED: see §24 for the live 41-job table (40 active as of 12 Jun 2026).** The list below is a stale 28-May snapshot kept only for narrative; do not trust its count or the `refresh-replay-videos-daily`/`session-publish` rows (now hourly jobid 36 / disabled respectively).

| Job | Schedule | Function |
|---|---|---|
| `email-watchdog` | `*/30 * * * *` | email-watchdog |
| `warm-ping-every-5min` | `*/5 * * * *` | warm-ping |
| `process-scheduled-pushes` | `*/5 * * * *` | process-scheduled-pushes |
| `vyve-broadcast-scheduler` | `*/5 * * * *` | scheduled-push-runner |
| `vyve_drain_home_state_dirty` | `*/5 * * * *` | drain_home_state_dirty() |
| `vyve_recompute_member_stats` | `*/15 * * * *` | recompute_all_member_stats() |
| `vyve-evaluate-plan-fit` | `0 4 * * *` | evaluate_plan_fit() — PM-420 4d plan-up nudge |
| `vyve-recompute-step-baselines` | `10 4 * * *` | recompute_step_baselines() — PM-428 live rolling-90d baseline |
| `vyve-gdpr-export-tick` | `*/15 * * * *` | gdpr-export-execute |
| `vyve_rebuild_mad_incremental` | `*/30 * * * *` | rebuild_member_activity_daily_incremental() |
| `vyve-reengagement-daily` | `0 8 * * *` | re-engagement-scheduler |
| `vyve-alert-digest-morning` | `0 8 * * *` | alert-digest (morning) |
| `vyve-daily-report` | `5 8 * * *` | daily-report |
| `weekly-report` | `10 8 * * 1` | weekly-report (Mondays) |
| `monthly-report` | `15 8 1 * *` | monthly-report (1st of month) |
| `vyve-certificate-checker` | `0 9 * * *` | certificate-checker |
| `vyve-alert-digest-afternoon` | `0 14 * * *` | alert-digest (afternoon) |
| `streak-reminder-daily` | `0 18 * * *` | streak-reminder |
| `habit-reminder-daily` | `0 20 * * *` | habit-reminder |
| `vyve-alert-digest-evening` | `0 20 * * *` | alert-digest (evening) |
| `vyve-achievements-sweep-daily` | `0 22 * * *` | achievements-sweep |
| `vyve-seed-weekly-goals` | `1 0 * * 1` | seed-weekly-goals (Mon 00:01 UTC) |
| `vyve_recompute_company_summary` | `0 2 * * *` | recompute_company_summary() |
| `vyve_platform_metrics` | `15 2 * * *` | recompute_platform_metrics() |
| `vyve_charity_reconcile_daily` | `30 2 * * *` | charity_total_reconcile_and_heal |
| `vyve-gdpr-erase-daily` | `0 3 * * *` | gdpr-erase-execute (03:00 UTC, 120s timeout) |
| `youtube-token-keepalive-daily` | `0 3 * * *` | youtube-token-keepalive |
| `vyve-refresh-replay-videos-daily` | `30 3 * * *` | refresh-replay-videos |
| `vyve_schema_snapshot` | `0 3 * * 0` | schema-snapshot-refresh (Sundays) |
| `session-publish-hourly` | `5 * * * *` | session-publish |

---

## 8. Portal pages & web shell

All portal pages live at `online.vyvehealth.co.uk` and are bundled inside the iOS + Android Capacitor binaries via `npx cap copy` from `~/Projects/vyve-capacitor`. The web URL itself is the browser-accessible account-management fallback — the *member experience* (the app) is delivered exclusively through App Store and Play Store binaries. Every page is gated behind Supabase Auth (`auth.js` v2.5). **86 HTML files live (26 May 2026) — `ls *.html` in vyve-site for the full list.**

**Hub-page hero pattern (PM-244 / PM-246 / PM-247 / PM-252).** The four hubs (Home, Body, Mind, Connect) use a `position:fixed` photographic hero band at the top with scrolling content below. Soft seam between photo and content follows the §23.53 canonical scrolling-fade recipe — dedicated `.X-hero-fade` absolute-positioned div as first child of `.wrap`, lifted up 80px via `transform:translateY(-100%)`, 3-stop rgba gradient with `[data-theme="light"]` override.

**Hub-hero canonical size (PM-247): `max(250px, 35vh)`.** Two paired values must always match per page — `.X-hero { height: max(250px, 35vh); }` and `main { padding-top: max(250px, 35vh); }`.

### Hubs (top-level nav)

| Hub | File | Notes |
|---|---|---|
| Home | `index.html` | Member dashboard. Snapshot-first paint (PM-396/397/398) from `vyve_<hub>_snapshot_<email>` localStorage. Daily check-in pill strip, activity score ring (v1), recurring 4-row weekly goals strip, live session slot, charity banner, mood faces, member prompt sheet hook. |
| Body | `exercise.html` | Exercise Hub. Hero card + stream cards linking to Movement / Workouts / Cardio. **Dean shorthand: "body" or "body.html" always means `exercise.html`** — there is no `body.html`. PM-411 surfaced that movement plans are structurally homeless until `programme_library.category` backfill lands. |
| Mind | `mind.html` | Mind hub with sub-page tiles. |
| Connect | `connect.html` | Connect hub: Your communities carousel (top, PM-720) / Join a community card, check-in card + feed link, live carousel, challenge summary. Recent check-ins removed PM-720 — feed lives on connect-feed.html. |

### Sub-trackers (per-stream + per-activity surfaces)

| Stream | Pages |
|---|---|
| Body — Workouts | `workouts.html` (My Programme + My Workouts tabs), `workout-history.html`, `personal-bests.html`, `shared-workout.html`, `workout-plan-wizard.html` (PM-532 no-plan questionnaire flow) |
| Body — Cardio | `cardio.html`, `cardio-history.html`, `running-plan.html` |
| Body — Movement | `movement.html`, `movement-history.html` |
| Mind | `meditation.html`, `sleep.html`, `breathwork.html`, `visualisation.html`, `affirmations.html`, `journal.html`, `mind-library.html`, `mind-insights.html` |
| Nutrition | `nutrition.html`, `nutrition-setup.html`, `log-food.html` (locked Coming Soon per PM-374) |
| Habits | `habits.html` |
| Challenges | `challenges.html` (More menu, PM-709) — catalogue + enrolment sheet + daily-type day view (checklist, camera capture, 75-dot grid). Supporting: `challenges-evaluator.js` (nav.js-injected on EVERY page — bus-lens progress engine, single writer of enrolment day_state via stampDaily/tickManual/attachPhoto), `challenges-home.js` (home card), `/challenge-art/` 23 SVG tiles. New bus events: `water:target_hit`, `app:opened`, `challenge:joined/progressed/completed`. |
| Check-ins | `wellbeing-checkin.html` (weekly), `monthly-checkin.html`, `connect-checkin.html`, `connect-feed.html`, `connect-challenge.html`, `connect-calendar.html` |
| Health (HK) | `apple-health.html` (inspector — parked), `hk-diagnostic.html` |
| Other | `activity.html` (personal feed — built, unlinked), `engagement.html` (v1 score), `engagement-v2.html` (v2 score behind `?score=v2` flag) |

### Live + replay shells (per-stream)

| Pattern | Files |
|---|---|
| `*-live.html` (8) | `yoga-live` · `mindfulness-live` · `workouts-live` · `therapy-live` · `events-live` · `podcast-live` · `education-live` · `checkin-live` — broadcast surfaces with YouTube embed + chat + `player-tracker.js` for `session_live_views` attribution (PM-304). |
| `*-rp.html` (8) | `yoga-rp` · `mindfulness-rp` · `workouts-rp` · `therapy-rp` · `events-rp` · `podcast-rp` · `education-rp` · `checkin-rp` — replay-category shells reading `replay_playlists` + `replay_videos` via shared `session-rp.js` + `session-rp.css` (events-rp converted from standalone to canonical shell at PM-390). |
| Replays | `replays.html`, `replay-category.html` |

### Focus surfaces (Today's Focus pillar — Option A `focus_slug` reads)

`focus/connect.html` · `focus/focus.html` · `focus/gratitude.html` · `focus/hydration.html` · `focus/morninglight.html` · `focus/movement.html` · `focus/outdoors.html` · `focus/reflection.html` · `focus/reset.html` · `focus/restore.html` · `focus/sleep.html` · `focus/fuel.html` (retired with Food Log deferral PM-353).

### Sessions surface

`sessions.html` — listings page. Filter tabs (All/Daily/Weekly/Monthly). `session_chat` for live chat.

### Catalogues + help

`how-to-pdfs.html` · `how-to-videos.html` · `certificates.html` · `certificate.html` · `leaderboard.html` · `podcast.html`

### Account + auth

`login.html` · `set-password.html` · `settings.html` · `settings-account.html` · `consent-gate.html` · `gdpr-erasure-cancel.html`

### Onboarding

`welcome.html` — stream picker + questionnaire post-Stripe.

### Admin + internal

`strategy.html` (internal strategy dashboard, password `vyve2026`) · `internal-dashboard/index.html` · `reset-cache.html` · `perf-test.html` (dev surface, skipped from precache).

### Mockups + staging

| File | Status |
|---|---|
| `achievements-mockup-c.html` · `achievements-mockup-pathb.html` | Visual reference for v2 Achievements UI direction/badge work. Deletable once all 6 pillars are live. |
| `VYVE_Health_Hub.html` | **Staging — pending Phil's clinical sign-off before launch.** Standalone multi-step clinical assessment flow with scoring/risk classification → `generateReport()` text export. Unlinked from nav by design. **Do not delete or archive without Lewis/Phil approval** (§23 hard rule). |

### Admin console (separate host)

`admin.vyvehealth.co.uk` — served by `vyve-command-centre` repo. Shell 1 + Shell 2 + Shell 3 Sub-scope A UI live. Sub-scope B (bulk ops + multi-select) queued behind browser-side JWT smoketest. Lewis-facing broadcast UI at `/#/broadcast` (PM-402).

### PWA infrastructure

| Piece | Detail |
|---|---|
| Service worker | `sw.js` — network-first for HTML + skipWaiting + clients.claim. HTML changes reach users on next reload without cache bumps. Non-HTML assets use cache versioning (~22 file precache scope swept PM-405). Push event listener + notificationclick handler shipped 28 April. **Build marker invariant:** every vyve-site commit must bump `sw.js` `CACHE_NAME` suffix + `<span id="vbb-marker">` in BOTH `index.html` AND `<span id="settings-vbb-marker">` in `settings.html`, all in same commit (PM-299, memory #10). Build number permanently visible on Settings page. |
| Bus | `bus.js` — `VYVEBus.publish(eventName, envelope)` cross-cutting event spine. ~37 distinct event names live; 86 publish call sites. Envelope shape `{kind, source, client_id, origin, ...}`. `origin === 'local'` filters analytics to physical user actions only. **§23.42:** in-page subscribers should not envelope-trust events the same page already mutated optimistically — that's a cross-page-only pattern. |
| Achievement client | `achievements-evaluator.js` (~1660 LOC) — Dexie-first, bus-subscribed evaluator across all 6 pillars. Loaded on every page that publishes a tracked bus event AND on `engagement-v2.html`. Subscribes to 13 bus events, runs ~65 handler functions, debounces 100ms, fires toasts via `window.VYVEAchievements.queueEarned()`, claims earns via `achievement-claim` EF in background. Catalog cached in localStorage 24hr TTL. `earnedSet` populated from Dexie `member_achievements` at boot. |
| Local DB | `db.js` (Dexie, SCHEMA_V22) + `sync.js` — local IndexedDB cache for member-scoped tables + catalogue tables (with `CATALOGUE_FRESH_TABLES` 5-min stale window + `CATALOGUE_INVALIDATION_KEY` immediate-bump path). `VYVELocalDB.<table>.allFor(email)` is the canonical Dexie read. **Reminder:** `id: clientId` MUST be in POST payload, not just `client_id`, or server gen_random_uuid() creates Dexie duplicates (PM-386). **PM-425→REVERTED PM-436:** wpc Dexie PK was moved `member_email`→`id` to mirror BOTH surfaces (workouts + movement) locally, but re-keying an existing store jams the iOS IndexedDB upgrade (§23.83) → `db.open()` rejects → noop shim → blank rings/habits/progress on every device with v21 data. Reverted to `'member_email, is_active, generated_at'`; `db.version(22)` kept as a no-op bump for clean self-heal. Multi-plan-local mirror deferred — re-do via a NEW id-keyed store (Option B, backlog), never by re-keying this one. Both read surfaces (`workouts-programme.js` L84-98, `movement.html` `fetchPlan`) are surface-filtered + REST-fallback, so one local wpc row per member is safe. |
| Analytics | `analytics.js` — 29 VYVEBus events mirrored to PostHog. `vyveEFFetch` wraps fetch for `ef_error` capture. |
| Haptics | `haptics.js` — `VYVEHaptics.{selection, light, medium, success, heavy, error, warning}()` bridge. Loaded across 40+ surfaces. Palette: selection (steppers) / light (un-ticks, optimistic list deletes) / medium (destructive commits) / success (additive logs, save commits) / heavy (achievement reveal) / error (failure) / warning (pre-confirm). |
| Theme | `theme.js` — dual dark/light CSS tokens. `data-theme` on `html`. localStorage. All pages use dual-token CSS blocks — never single `:root`. Full light-mode pass shipped across 46 pages (PM-494→508, 6 Jun): white cards + semantic tokens on every surface. |
| Nav | `nav.js` — body-prepend pattern. Back button on inner pages, logo-only on home. Body icon Lucide `person-standing` (PM-376). |
| Consent gate | Built. Writes `privacy_accepted` + `health_data_consent` to `members`. |
| Viewport zoom | Disabled across all pages. |
| `target="_blank"` | Audit complete. |
| Offline mode | Cached portal content viewable offline; new HTML surfaces must land in `sw.js` precache in same commit (PM-405 audit signal). |

---

## 9. Onboarding flow

Member pays via Stripe → redirects to `welcome.html` → **stream picker** (workouts / movement / cardio) → onboarding questionnaire → `onboarding` EF → Supabase writes + persona assignment + habit assignment + stream-aware programme overview + weekly goals (5 targets) + recommendations + Brevo welcome email with App Store / Play Store download buttons + programme card. Phase 2 (`EdgeRuntime.waitUntil()`) writes the full 8-week workout JSON to `workout_plan_cache` in the background — only triggered when `stream==='workouts'`.

Supabase Auth user created directly by the onboarding EF. No Make, no Auth0.

Welcome email via Brevo includes programme overview card + native App Store / Play Store download buttons (iOS `https://apps.apple.com/gb/app/vyve-health/id6762100652`, Android `https://play.google.com/store/apps/details?id=co.uk.vyvehealth.app`). PWA install steps removed in May 2026. Stripe coupons `VYVE15` and `VYVE10`. Annual discount % TBD.

### Questionnaire — Section A (About you)

Order: First name + Last name (input-row) → Email + Confirm email (input-row, paired) → Mobile (own q-group, optional) → DOB + Gender (input-row) → Where are you based.

### Questionnaire — Section C (Physical Health, Workouts branch) field reference

- `location-train` (single, mandatory): `Full commercial gym` | `Basic gym` | `Home` | `Hotel gym` | `Mixed` | `Not sure`
- `equipment` (multi, conditional): `Bodyweight only` | `Resistance bands` | `Dumbbells` | `Kettlebells` | `Barbell and weights` | `Machines` | `Cables`
- `gymExperience` (single, mandatory): `Beginner` | `Intermediate` | `Advanced` | `Returning`
- `trainDays` (single, mandatory): `1-2` | `3` | `4` | `5+` | `Not sure`
- `sessionLength` (single): `15` | `20` | `30` | `45` | `60` (minutes) — **POSTed but not yet persisted by EF**
- `priorityMuscle` (single, optional): `Glutes` | `Arms` | `Back` | `Chest` | `Shoulders` | `Legs` | `None` — **POSTed but not yet persisted by EF**

Injury flags: `Shoulders` | `Knees` | `Hips` | `Back / spine` | `Wrists` | `Ankles` | `None`. Free-text avoid-exercises field retained.

**Persistence gap:** `sessionLength` + `priorityMuscle` POSTed but EF doesn't read/save. Add columns to `members` + bump EF in Stage 3 of the parked workout-engine work.

### Movement and Cardio streams

Movement stream still routes through legacy AI generation (movement engine planned post workout-engine v2). Cardio stream goes through `running-plan.html` + `anthropic-proxy`.

---

## 10. AI personas

Five personas live in `personas` table with full system prompts.

| Persona | Character |
|---|---|
| **NOVA** | High-performance coach. Driven, data-led, precision-focused. Metrics and measurable progress. |
| **RIVER** | Mindful wellness guide. Calm, empathetic, holistic. Stress, sleep, emotional balance. |
| **SPARK** | Motivational powerhouse. Energetic, warm, challenge-driven. Accountability. |
| **SAGE** | Knowledge-first mentor. Thoughtful, evidence-based. The "why". |
| **HAVEN** | Gentle mental health companion. Non-judgmental, trauma-informed. **Built and live but pending clinical review by Phil before promotion.** |

### Assignment rules

| Condition | Assignment |
|---|---|
| Stress ≤ 4 OR wellbeing ≤ 3 | RIVER or HAVEN (post-clinical-review) |
| Bereavement / mental health in Section G | HAVEN or RIVER only — never NOVA or SPARK |
| High training days + performance goal + low stress | Consider NOVA |
| Past barriers = motivation/consistency | Consider SPARK |
| Analytical style + wants to understand why | Consider SAGE |
| Serious life context flagged in Section G | Never NOVA or SPARK regardless of other signals |

### HAVEN open issue

The onboarding EF assigns HAVEN to members hitting the low-wellbeing/high-stress thresholds. Phil has **not** signed off on the HAVEN persona content. Two paths in §22.

---

## 11. AI features

### Portal AI (Dean — technical)

| Feature | Status |
|---|---|
| Onboarding recommendations (persona assignment + 3 first-week recs + programme overview) | LIVE (`onboarding` EF) |
| Running plan generator | LIVE (`running-plan.html` + `anthropic-proxy` + Supabase cache) |
| Weekly check-in recommendations (persona-voiced AI recs) | LIVE (`wellbeing-checkin` + audit row) |
| Workout plan generator | LIVE (`generate-workout-plan` at onboarding via waitUntil) |
| **Habits × HealthKit autotick** | LIVE end-to-end. Schema + Lewis-approved seeds on `habit_library.health_rule`. Server evaluator in `member-dashboard` v55+ with `_shared/taxonomy.ts`. Client UI in `habits.html` with pre-tick on auto-satisfied rows. Cohort-wide post 1.2 — `member_health_connections` truthsource. |
| **Achievements (v2 catalogue, Dexie-first evaluator)** | LIVE — 107 metrics × 538 tiers, all-pillar Dexie-first via `achievements-evaluator.js` per PM-335 redirect. Server-side `_shared/achievements.ts` + `log-activity evaluate_only` retained for v1 metrics in dual-path. Idempotent claim via `achievement-claim` EF. Push fan-out via `achievement-earned-push`. See §11A. |
| **Engagement Score v2** | LIVE behind `?score=v2` flag + in-app chip link (PM-295). Six-pillar base × consistency × variety / 2.5, base 50 floor, ceiling 100. JS↔SQL parity proven on real member data. v1 path untouched alongside v2. See §11C. |
| Recurring weekly goals (fixed 4-row template) | LIVE — 3 habits / 3 exercise / 2 live sessions / 1 weekly check-in. Computes against `member-dashboard` goals payload. |
| Mind sub-pages (meditation / sleep / breathwork / visualisation / journal / affirmations) | LIVE — write to `mind_activities` with `kind` discriminator. Catalogue-driven content from `mind_videos`. |
| Movement track | LIVE — `movement.html` (state-aware, `<body data-mv-state=1..5>`) + `movement-history.html`, writes to `movement_activities`. PM-307 promotion to first-class table closed dual-write to legacy `cardio.logged_via='movement'` + `workouts.plan_name='Movement'` shapes. **PM-420 step 4c (vbb 301):** Today's Movement card (states 1-2, prompt_pool tap-to-complete), Sport quick-log pill, Add Activity HK-supplement modal (step top-ups summed onto HK ring base, survive refresh). **PM-426..431 (vbb 307→312):** Movement V2 picker (`movement-plans.html`) brought to portal standard (theme.css, nav.js, cache-first paint) + the picker→home flow made instant via the PM-427 Dexie wpc mirror; `renderPlan` now routes ANY sessionless movement plan (just_steps + locked_ramp Foundation/Distance) to the state-aware render — previously the structured session renderer's `if (!session) showNoPlan()` discarded picker-created plans and showed the no-plan CTA (§23.81). prog-card now names locked-ramp plans (states 1/2); Just Steps target editable while current; Add-steps modal opaque. |
| Member Prompts (Lewis-driven in-app questionnaires) | LIVE (PM-375) — 4-table schema, 8 question types, bottom-sheet modal on home boot. Two canary prompts seeded (weekly-preference, app-feedback). |
| Broadcast Push (Lewis manual + cron-driven recurring schedules) | LIVE (PM-402) — admin UI at `admin.vyvehealth.co.uk/#/broadcast`. 6-shape audience resolver. Full fan-out to in-app + native + web. |
| Weekly progress email (Friday, AI-generated, Brevo) | BACKLOG — blocked on Lewis copy template |
| Persona context modifiers (age 50+, beginner, time-poor, new parent) | BACKLOG |
| Session recommender (post check-in, mood/energy/time-aware) | BACKLOG |

### Operational AI (Lewis — 24 built skills)

| Skill | Cadence |
|---|---|
| Daily Intelligence | Weekday morning — 6 intelligence areas, top 3 actions, 7-day dedup cache. |
| Content Engine | Daily (3 posts) — LinkedIn, Instagram, Facebook from single podcast source. 9-day rotation. |
| Sales Intelligence | Pre-call — 8-step deep dive, ROI calc, 20-competitor displacement table, objection scripts. |
| Research Radar | Weekly — 4 credibility tiers, 20+ indexed studies, Stat Bank. |
| Competitor Deep Dive | Weekly — 20+ competitors, threat/opportunity matrix, countermeasures. |
| Client Health Monitor | On-demand — Green/Amber/Red scoring, 15+ early warning signals, tiered retention plays. |
| Investor & Growth Tracker | Monthly — UK health tech funding, KPIs, grant calendar (5 UK grants), Series A prep. |
| + 17 more frameworks | Personal Brand Architect, Partnership Finder, Regulatory Compliance Watch, Weekly Strategic Digest, Quality Monitor, plus 12 reusable frameworks. |

---

## 11A. Achievements architecture

### Data model

Three tables: `achievement_metrics` (107 rows), `achievement_tiers` (538 rows, copy-status-gated upsert), `member_achievements` (UNIQUE `(member_email, metric_slug, tier_index)`, `seen_at` toast-state column).

Pillar grouping (v2 catalogue locked PM-322): Body / Habits / Mind / Connect / Check-ins / Focus, plus hidden HK / collective / tenure / one-shot categories. Layout direction C (Hero + Map). Tier pattern 3 (levels-up rows, gold dots showing earned tiers underneath). Badge visual Path B (Lucide icon inside 10-tier gemstone-coloured frame: bronze → silver → gold → sapphire → ruby → emerald → amethyst → pearl → obsidian → diamond).

### Architectural shape (post-PM-335 redirect)

**Member-action evaluation is Dexie-first, client-side, bus-subscribed.** Server-side inline/sweep split (the original §11A architecture) superseded for member-action metrics. Reason: instant feedback on the threshold-crossing tap is non-negotiable; server round-trip is 200-400ms best case, 2-3s on cellular — that breaks the achievement-toast moment.

**Components:**

1. **`achievements-evaluator.js`** (~1660 LOC client lib). Loaded on every page that publishes a tracked bus event AND on `engagement-v2.html`. Subscribes to 13 bus events; per event, debounces 100ms then runs all metric handlers (~65 across all events). Each handler reads Dexie store(s), computes a current value, calls `newEarnsForThreshold(slug, value)` against cached tier ladder, returns any tier rows ≥ threshold AND not in `earnedSet`. Earns flow to optimistic toast via `window.VYVEAchievements.queueEarned()` + background POST to `achievement-claim` EF. `earnedSet` populated from Dexie `member_achievements` at boot. Catalog cached in localStorage 24hr TTL (single fetch from `achievement_metrics` + `achievement_tiers` PostgREST — public SELECT RLS).

2. **`achievement-claim` EF v1** (JWT-required). Resolves member email from JWT, verifies `(metric_slug, tier_index)` exists in catalog (anti-tamper), inserts to `member_achievements` ON CONFLICT DO NOTHING, fans out to `achievement-earned-push` via `EdgeRuntime.waitUntil()` *only if* `newly_inserted=true`. Idempotent re-claims are no-ops with no double-push.

3. **Server-side server path (still live).** `_shared/achievements.ts` + `log-activity evaluate_only` retained for v1 server-wired metrics (workouts/cardio/sessions/etc) until full retirement. The unique constraint on `member_achievements` makes dual-path safe (no double-claim possible). `achievements-sweep` cron remains for tenure / HK lifetime / charity collective — genuinely sweep-shaped metrics.

### Sweep-still-server metrics

`member_days` tenure, HK lifetime (`lifetime_steps`, `lifetime_distance_hk`, `lifetime_active_energy`, `nights_slept_7h`), `charity_tips`, `personal_charity_contribution`. Run from `achievements-sweep` daily 22:00 UTC. Phase 2 sweep extensions still pending.

### Voice rules (locked for future ladder extensions)

- No emojis anywhere.
- Titles 3–6 words. Bodies 10–20 words (hard window, validation rejects).
- VYVE voice: proactive wellbeing, performance investment, prevention over cure, evidence over assumption. No fitness-influencer tone.
- Tier 11+ on long ladders short and reverent, no next-tier nudge.
- Recurring metrics: copy reads naturally as a repeatable milestone (no "another" assuming prior).
- Globally unique titles across all tier rows.
- Streaks ≠ counts in body voice — streaks emphasise consecutive cadence, counts emphasise cumulative volume.

### Phase 3 UI — LIVE

Lives on `engagement-v2.html` (replacing standalone Achievements tab plan from PM-322 once three-tab shell ships per §11C). Recently earned + Up next + Trophy cabinet (Path B 10-tier gemstone frames). Modal opens for any tile click and shows the full tier ladder with earned rows tinted gold, current row teal-bordered with inline progress bar, locked rows muted. Optional `tierIndex` deep-link from toast.

### Known partial implementations (backlog, not blocking)

- `daily_focus_all_complete` uses ≥3 distinct focuses/day proxy (not slot-locked to today's GRID triple)
- `weekly_focus_completion` uses ≥7 days/week proxy (not 21-slot completion %)
- `daily_mood_checkins` + `daily_mood_streak` are no-op (no Dexie store or bus event)
- `reactions_received` + `checkins_with_reactions` return 0 (local Dexie only has reactions GIVEN; received needs Realtime or server view)
- `chat_messages_posted` no-op (no bus event)
- `muscle_groups_week` no-op (no muscle→exercise taxonomy)
- `volume_lifted_total` evaluator not yet wired (needs sanity caps `reps > 100` OR `weight > 500`)

### Architectural lessons earned (codified across PM-335→389)

- **§23.77 candidate (third reinforcement at PM-389):** any new activity table requires touching `compute_engagement_components_v2` SQL function + `v_active_days` + dirty-mark triggers + JS mirror `computeEngagementComponentsV2` + activity-breakdown tile renderers. Three independent occurrences (PM-307 movement, PM-173 mind, PM-289 connect).
- **Bus envelope shape ≠ Dexie row column names.** Confirm Dexie column names against `db.js` SCHEMA_V<N> before reading from a store inside an evaluator.
- **sync.js `member_achievements` is additive-pull.** Server deletes don't propagate. Either build a delete-reconciler in sync.js (preferred long-term) or expose a client-side "forget local" helper.
- **Toast routing skips redirect stubs.** Route directly to the live page with query params, not to a stub-page with hash.

---

## 11B. Page documentation (`/page-docs/`)

Top-level folder in VYVEBrain repo opened PM-285. One markdown file per portal page describing what the page is, why it exists, what a member sees, how they use it, and what data flows through it. Plain English, member-readable, no SQL, no §23 references.

**Distinction from `/brain/master.md`.** Master is engineering-context only — Claude reads master for technical work, never these docs. `/page-docs/` is for Lewis/Alan/Calum/Phil/Vicki/Cole, sales prospects, support team, and ultimately the member-facing help centre.

**File naming.** Lowercase, matching the HTML filename: `engagement.md` for `engagement.html`, etc.

**As-you-go discipline (locked PM-285).** When a session touches a page, the corresponding `/page-docs/<page>.md` ships in the same commit as the code change, drafted or refreshed to match the page's current state. Avoids the documentation-deferred-forever failure mode. If the page-doc doesn't exist yet, this is the session that creates it. A whole-session backfill pass is acceptable as a session theme, but no individual page change ships without its doc being touched.

---

## 11C. Engagement Score v2 architecture (PM-295, 25 May 2026)

Six-pillar base × multipliers, 50 floor, 100 ceiling, 7-day linear decay. Designed PM-285, shipped PM-295 behind `?score=v2` flag + in-app chip link from engagement.html (Capacitor wrap has no URL bar, so redirect-only path didn't work alone).

### Formula

`final_score = 50 + min(50, (base_points × consistency_mult × variety_mult) / 2.5)`

### Six base-point pillars

| Pillar | Source tables | Per-event | Cap |
|---|---|---|---|
| **Today's Focus** | rows with `focus_slug IS NOT NULL` across cardio/connect_checkins/mind_activities/movement_activities | 5 pts | 3/day |
| **Daily Habits** | daily_habits | 1 pt | 5/day |
| **Body** | workouts + cardio + movement_activities (focus_slug IS NULL) | 2 pts | 2/day |
| **Mind** | mind_activities (focus_slug IS NULL) | 2 pts | 2/day |
| **Connect** | connect_checkins + session_views + replay_video_views + session_live_views | 2 pts | 2/day |
| **Check-ins** | wellbeing_checkins (8/week) + live_checkin_submissions (4/week) + monthly_checkins (12/month) | varies | form-level uniques |

**Focus disambiguation:** rows with `focus_slug IS NOT NULL` count under Focus ONLY, never under underlying pillar — prevents double-count (Reset focus writing to mind_activities would otherwise credit both Focus 5pts AND Mind 2pts).

### Multipliers — locked curves

**Consistency** driven by `active_days_7` (distinct activity_dates across all source tables in last 7 days):

| Days | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|---|---|---|---|---|---|---|---|---|
| Mult | 0.85 | 0.90 | 0.95 | 1.00 | 1.08 | 1.15 | 1.23 | 1.30 |

**Variety** driven by `pillars_touched_7` (count of 6 pillars with points > 0):

| Pillars | 0 | 1 | 2 | 3 | 4 | 5 | 6 |
|---|---|---|---|---|---|---|---|
| Mult | 0.90 | 0.90 | 0.95 | 1.00 | 1.07 | 1.14 | 1.20 |

Worked examples: workout-only 5 days/week → 53. Well-rounded 7/7 across 5 pillars → 85. Once-a-week struggler → 53. Exceptional week with all check-ins → 92. Inactive 7+ days → 50.

### Wellbeing dropped

Submitting an honest "I feel rough today — 3/10" should never penalise the score. The *act* of submitting earns 8 points (under Check-ins); contents inform AI recs not score. The v1 `engagement_wellbeing` column still populated for v1 backwards-compat but plays no role in v2.

### Schema delta

`member_home_state` gained 11 columns: `engagement_focus_points`, `engagement_habits_points`, `engagement_body_points`, `engagement_mind_points`, `engagement_connect_points`, `engagement_checkins_points`, `engagement_consistency_mult`, `engagement_variety_mult`, `engagement_active_days_7`, `engagement_pillars_touched_7`, `engagement_score_v2`. v1 columns untouched, both score paths populated by `refresh_member_home_state()` (v1 path renamed `refresh_member_home_state_v1_internal`).

### Compute parity — JS ↔ SQL

`compute_engagement_components_v2(p_member_email text)` SQL function in `public`, SECURITY DEFINER, returns 13-field record. `computeEngagementComponentsV2(tables, today)` in `home-state-local.js` returns same 13-field shape. **Formula parity holds; DATA parity does NOT — see PM-601.** The JS path computes off Dexie, and if any activity table's hydrate dropped its `id` (the `daily_habits` `select=` bug, §23.109) the local store collapses multi-day history to today only, so the client renders a low score (Kelly 74) while SQL reads true (83). The historic '72/72 exact match' was SQL-vs-JS on identical inputs; it never guarded the input completeness. Treat parity as conditional on full Dexie hydration.

### Page architecture (`engagement-v2.html`)

Sticky standalone page behind `?score=v2` redirect from `engagement.html` + in-app chip link. Score hero + multiplier strip + 6 pillar rows + Activity Breakdown 5-card grid + 30-day chip-row log + eye-icon explainer sheet. Score subscriber on all score-affecting bus events with 50ms debounce.

### v1 cleanup

Not done. v1 columns + v1 SQL function + v1 page all still live and untouched. Default flip + cleanup is a follow-up commit after Dean device-verifies v2 numbers.

### Three-tab future shape — DEFERRED

Engagement page (`Your Journey`) is a three-tab shell. **PM-435 order: Progress (default) / Score / Achievements** — Progress renders from Dexie on boot (no longer lazy-only). Score = v2 engagement content. Progress = the five capped pillar buckets (habits/mind/body/connect/checkins, identical caps to the cert tracks) + charity mechanic. Achievements = trophy-cabinet block from §11A. Achievements deep-link routes by `data-tab` click, order-independent.

### Push notification thresholds — DEFERRED

Re-engagement-scheduler v11 with soft-slide / pillar-gap / re-engagement thresholds originally scoped for PM-295 but deferred — pushes driven by a score nobody's confirmed on device yet was wrong sequencing.

---

## 12. Automated operations — workflows & cadences

### Daily

- Morning brief (weekday) — 6-area intelligence scan, top 3 actions.
- Social content (3 posts) — LinkedIn, Instagram, Facebook. 9-day queue.
- Engagement ritual (weekday noon) — structured 30-min community playbook.
- Publishing monitor — Make.com publisher error detection.

### Weekly

- Strategic digest (Monday 8am) — synthesis from 9 JSON data sources.
- Competitor deep dive.
- Research radar.
- Analytics feedback — cross-platform engagement via Make.
- Content intelligence — performance synthesis + next brief.

### Monthly

- Content calendar (month-end) — 25 pieces across 4 themed weeks.
- Thought leadership (1st of month) — macro-trend synthesis for external distribution.

### Make (retired)

Make is retired on Lewis's side too — no analytics collectors, no social publisher running. The old scenarios (4993944/4993948/4993949 collectors, 4950386 publisher) and Data Store 107716 are no longer tracked. (This reconciles the old "publisher broken, 133 posts stuck" note — that workflow is gone, not pending-fix. §24 is the canonical statement.) If Lewis returns to Make, repopulate here.

### Cron jobs

See §24 for the live pg_cron job table (42 jobs, 41 active as of 15 Jun 2026).

---

## 13. Employer & member dashboards

### Employer dashboard

Live at `www.vyvehealth.co.uk/vyve-dashboard-live.html`. Served by `employer-dashboard`. API-key auth via `EMPLOYER_DASHBOARD_API_KEY`. **Aggregate only — no PII ever visible to employers.** Active = 0–7 days inactive · Quiet = 8–30 · Inactive = 30+ or never.

Trial/test data only today. Per-employer Auth-gated URLs (e.g. `/sage`) build when first enterprise trial starts.

### Member dashboard

Single call to `member-dashboard`. Cache-first — renders instantly from localStorage on return visits, snapshot-first paint per PM-396/397/398 to eliminate skeleton flicker. Server-authoritative hydration on every page load. HealthKit truthsource is `member_health_connections` row presence in the EF, not localStorage.

**Engagement score — v1 live, v2 design-locked PM-285, shipped PM-295 behind flag.** See §11C.

5 progress tracks: Daily Habits (The Architect), Workouts (The Warrior), Cardio (The Relentless), Sessions Watched (The Explorer), Weekly Check-ins (The Elite). 30-activity milestone certificates.

Achievements `unseen / inflight / recent / earned_count / hk_connected` payload also live in `member-dashboard` — Phase 3 UI on `engagement-v2.html`.

### Admin console

`admin.vyvehealth.co.uk` — live with Shell 1 (member viewer) + Shell 2 (pencil-click edits) + Shell 3 Sub-scope A (programme / habits / weekly-goals panels with shared reason modal). Sub-scope B (bulk ops + multi-select) queued. Lewis-facing broadcast UI at `/#/broadcast` (PM-402).

All admin writes audited to `admin_audit_log`.

### Command Centre IA — 4-domain model (PM-639 spec, BUILT PM-685, 2026-07-03)

Live in `vyve-command-centre` (`038799c`). Replaced the two competing nav layers (`VYVE_NAV` 8-section sidebar + `VYVE_NAV_TOP` 7-tab top nav). Top level = four domains:

- **Run the Business** — Daily (Brief/Inbox/Activity Feed/Intel/Dashboard) · Commercial (Finance/Sales Pipeline/Clients/Investors/Invoicing) · Marketing (Content/Social Blueprint/Podcast + ext Metricool/Riverside) · Delivery (Calendar/Sessions/Tasks/Compliance) · Knowledge (Strategy/Documents/Knowledge Base + ext Drive) · Org (Action Plans/Team/Settings/Trash).
- **Analytics** — App Health + Usage + Retention + Activity Depth + Wellbeing + Platform & UX + Revenue + AI Usage (App Health moved out of Delivery; all 8 cron-backed).
- **Members** — admin-console Shell 1/2/3 + Broadcast + Active Users (all operate on real member accounts).
- **Partners** — the `partners.html` monolith (canonical) + `partner-portal.html`, both sidebar hrefs; Partners top tab links the monolith directly (router href-tab support added PM-685).

KILLED PM-685 (all grep-confirmed orphans): old Commercial Partners skeleton (`pages/partners.html`), Performance, Brand, the 7 `pages/partner-*.html`, root `Dashboard.html`. Still present but unreachable (Layer 2 sweep): the 4 old hub pages (`pages/commercial|marketing|delivery|org.html`). CC v2 layering: L2 = real data (seed-data.js audit + kill partners.html mocks) → L3 = per-partner portal auth → L4 = Claude-driven audited actions (PF-NEXT-15) → L5 = Team App wrap. Full per-page triage in `CC-information-architecture.md`.

### Team App (PM-639, spec locked, web-first build pending)

A **role-scoped slice of the CC**, lived-in on web first, Capacitor-wrapped to TestFlight only once content is signed off. Team members log in as `admin_users` with role `team` and see only Tasks / Calendar / Docs / Scheduler — never analytics, partners, member-admin, or the member service.

**Phase 1 (PM-640) SHIPPED:** `is_team()` + `is_admin_or_team()` RPCs live. `admin_users` role constraint extended. Per-cmd RLS on `cc_tasks` + `cc_calendar_events`. `cc_task_attachments` table live. 5 team members in roster.
**Phase 2 (PM-641) SHIPPED:** `lib/auth.js` role-aware (broadcasts `window.VYVE_USER.role`). `pages/tasks.html` role-scoped controls (New Task + Delete → admin only). Attachment section in editor: upload/download/delete via `cc-task-docs-url` EF v1. `cc-task-docs` private bucket + Storage RLS live.
**Phase 3 (PM-642) SHIPPED:** `pages/calendar.html` — `calendar_occurrences` replaces `cc_sessions` as session source (`starts_at`/`ends_at`, `session_title||name`). 3-source union read complete (meetings + live sessions). Role gating: New Event + Delete admin-only. Legend updated.
**Phase 4 (PM-643) SHIPPED:** `pages/sessions.html` rebuilt — drives `calendar_occurrences` directly. 3-tab list (upcoming/past/cancelled). Admin scheduler modal with double-confirm gate + catalogue pre-fill. Cancel action (`cancelled_at`). Admin write RLS on `calendar_occurrences` live. **Phase 5 (Capacitor wrap) deferred to content sign-off.**
**PM-644/645/646 (CC shell) SHIPPED:** Persistent left sidebar (always-visible on desktop, slide-in on mobile). Topnav spans full width right of sidebar (fix: topnav+main wrapped in `.app-body` flex column). Search pinned far right. Dark/Light/System theme: system preference via `prefers-color-scheme`, FOUC-free boot script, `VYVE_THEME` toggle helper, Appearance card in Settings.

**Calendar = 3 sources, union-at-read** (no sync, colour-coded by `source`): `cc_calendar_events` (team meetings RW) + `calendar_occurrences` (live events RO) + scheduler writes into `calendar_occurrences`. **The scheduler publishes member-facing session rows** — capability-gated (admin + `lives`) + confirm-step; a bad `calendar_occurrences` row shows on every member's session list. Full spec in `CC-team-app-spec.md`.

---

## 14. Workout library & exercise architecture

| Programme | Detail |
|---|---|
| Push/Pull/Legs (PPL) | 11 workout days (Legs A + B). |
| Upper/Lower | 8 workout days. |
| Full Body | 7 workout days. |
| Home Workouts | 7 workout days. |
| Movement & Wellbeing | 7 content tabs. |
| Total in Supabase | ~313 rows in `workout_plans` across ~40 workout days (12 Jun 2026). |

**Cache.** `workout_plan_cache` — historically one row per member, full 8-week JSONB programme. Generated at onboarding in background (Phase 2 waitUntil). **UNIQUE constraint contradiction being resolved (PM-420 step 4a-pre-2):** dropping `workout_plan_cache_member_email_key` (full unique on `member_email`); keeping `workout_plan_cache_one_active_per_member` (partial unique WHERE `is_active=true`). Enables plan history. Onboarding EF v86 already uses deactivate-old + insert-new write pattern. Pending: site patch (`workouts-session.js` filter add) + full-unique drop migration.

**Architecture.** All 5 plans available. AI recommends weekly schedule, not plan selection.

**Custom workouts.** `custom_workouts` table — member-created sessions.

**Exercise logs.** Plan-agnostic `exercise_logs` stores all sets/reps/weight permanently.

**Exercise Hub.** `exercise.html` as hub (Dean's "Body"), streams as sub-pages (`workouts.html`, `movement.html`, `cardio.html`). `members.exercise_stream` column (default `workouts`). Welcome flow includes stream picker.

**Movement track.** `movement.html` + `movement-history.html` write to `movement_activities` (PM-307 first-class promotion from `cardio.logged_via='movement'` + `workouts.plan_name='Movement'`). Movement plan content in `programme_library` still requires `category` backfill (PM-411 architectural item).

### Workout Engine v2 — PARKED

Calum delivered spec, scoring data (203 exercises × 8 base dimensions + 5 context fits + tier), and 20-scenario QA framework on 27 April. Architecture decided: deterministic engine (filter → score with context weights → rank → fill slots) replaces AI exercise selection. AI used only for programme name/rationale (Sonnet 4) + Layer 2 reviewer (Haiku 4.5). Drops cost ~30× AND raises quality. **Resumes when Calum returns filled inputs pack.**

---

## 15. Marketing, brand & content production

### Brand identity

| Element | Detail |
|---|---|
| Marketing site | `www.vyvehealth.co.uk` (GitHub Pages, `Test-Site-Finalv3`). |
| Brand palette | `#0D2B2B` (dark), `#1B7878` (teal), `#4DAAAA` (teal-light), `#C9A84C` (gold). |
| Fonts | Playfair Display (headings), DM Sans / Inter (body). |
| Homepage | Three audience paths: Individual / Employer / Members Area. |
| Legal pages | `privacy.html` + `terms.html` live. |
| Podcast page | `vyvehealth.co.uk/vyve-podcast.html`. 35+ episodes. Rebranded: *The Everyman Podcast* → *The VYVE Podcast*. |
| Key message | Prevention over cure. Build health before it breaks. |
| Image strategy | Google Gemini. Always append: *"Colour grade: deep teals and greens, warm highlights, no text, no logos."* |
| Brand brain | 16-section knowledge base (Lewis's Claude project). |
| Member welcome pack | 8-page A4 deck: mission, features, app, live sessions, monthly themes, podcast, charity, getting started. |

### Content production

- Social queue: 133 posts queued. Pipeline (Make Scenario 4950386) broken since 23 March.
- Content target: 10–14 posts/week. Currently ~6/week due to publisher outage.
- Pre-recorded sessions target: 30 videos. Workflow: Claude script → ElevenLabs → Audacity → stock footage → CapCut → Castr. Scope cap: exactly 30 before hiring instructors.

### CIPD 2025 crisis statistics (sales-critical)

- £150bn annual cost of ill health to UK economy.
- 9.4 days average sickness absence per employee (24-year high).
- 41% of long-term absence driven by mental ill health.
- 2.8M economically inactive due to long-term health conditions.
- 37% of UK employers still purely reactive — market opportunity.
- 5–8% average EAP utilisation — VYVE's gamification directly addresses this gap.

### 15A. Lewis's origin story & The VYVE Podcast

Lewis nearly lost his life to addiction, standing on a train platform watching trains pass. Honest conversations — first with himself, then with people who mattered — saved him. That lived experience is the authentic foundation of VYVE's mission and mental-health positioning.

*The Everyman Podcast* launched Feb 2023 with one founding rule: no topic off limits. Men's health, mental health, addiction recovery, purpose, performance. 35+ episodes with guests including Matthew Jarvis, Calum Denham, Luke Ambler, Ray Winstone, Dr Tamara Russell, David Wetherill, 3 Dads Walking. Available on Spotify, Apple Podcasts, Amazon Music.

Rebrand *The Everyman* → *The VYVE Podcast* in progress. Guest expression-of-interest form live on `vyve-podcast.html`.

---

## 16. GDPR, compliance & legal

| Document | Status |
|---|---|
| ICO registration | 00013608608 — registered March 2026, £52/year |
| DPA | Complete — swap client name before sending |
| DPIA | Complete — next review September 2026 |
| Data retention policy | Complete |
| Breach notification procedure | Complete |
| Privacy Policy | Live (`privacy.html`) |
| Terms of Service | Live (`terms.html`) |
| Compliance calendar | Live — CIC36, DPIA reviews, insurance, HSE audits |
| Article 15 export pipeline | LIVE (07 May 2026 commit 3) — `gdpr-export-request` + `gdpr-export-execute` + `gdpr_export_requests` table. Member-self 1-per-30-days rate limit, unlimited admin path. Brevo email + 7-day signed URL. |
| Article 17 erasure pipeline | LIVE (07 May 2026 commit 4) — `gdpr-erase-request` + `gdpr-erase-cancel` + `gdpr-erase-status` + `gdpr-erase-execute` + `gdpr_erasure_requests` table. 7-day cancellation window. Per-subject PL/pgSQL deletes in dependency order. Stripe + Brevo + PostHog purge rolled into execute path. |
| Microsoft Exchange (GoDaddy) | `team@vyvehealth.co.uk` is on a personal Microsoft Exchange via GoDaddy. Migrate to proper Workspace tenant post-first-enterprise-contract. SCCs: not in place; required if/when EU subprocessing involved. |
| External DPO | Required before 500 members. Budget £2–5K/year. |
| Employer reporting | Aggregate only — no individual names ever. |
| RLS | All 133 public tables have RLS enabled (12 Jun 2026; was 120 at the 26 May audit — the 13 new tables, mostly `cc_*` admin-read caches, carry RLS per their build PMs). |
| Security questionnaire | `brain/security_questionnaire.md` — pre-canned answers for procurement reviewers. |
| Cyber Essentials (CE) | **Do immediately** — IASME self-assessed, ~£300-400, days to certificate. VYVE stack passes trivially. Checks most enterprise supplier questionnaire boxes including Sage. |
| Cyber Essentials Plus (CE+) | Hold until a specific deal requires it. ~£1.5k, 4-6 weeks lead time (CE first, then auditor books the hands-on check). Ask Sage procurement what they actually need before spending. |
| Penetration test | Hold until a live enterprise deal triggers it. ~£1-2k for web app scope. Not legally required but expected for health data at enterprise scale. |
| WHISPA programme | £3.7M research launching May 2026 — potential research partnership. Monitor. |

---

## 17. Charity mechanic

**Individual track.** Every 30 completions of a specific activity type = 1 free month donated to a charity partner recipient.

**Enterprise track.** Every 30 activities collectively by a company's members = 1 free month donated.

**Framing.** Collective impact — the team's activity funds access for people in need via VYVE's charity partners. Not a personal referral reward. Central to CIC positioning and social-impact narrative.

**Charity partner categories.** Addiction recovery · homelessness & reintegration · mental health organisations · social mobility programmes · physical health access for underserved populations.

**Partner economics.** £0 cost to charity partners to refer recipients. £0 cost to recipients. Counters reset after each 30 activities — unlimited donations possible. Milestone certificates awarded automatically.

**Named partner status:** Not yet confirmed. To be added once the first formal partnership agreement is in place.

**Operational mechanics.** Six `charity_count_*` AFTER INSERT/DELETE triggers across cap-aware activity tables maintain `platform_counters.counter_key='charity_total'`. Reconciled daily 02:30 UTC via `vyve_charity_reconcile_daily` cron with self-heal on drift. Read via `get_charity_total()`.

---

## 18. Website structure & live pages

| Page | Role |
|---|---|
| `index.html` | Homepage — dual Individual/Employer paths. |
| `individual.html` | Five pillars, pricing, Give Back. |
| `about.html` | Origin story, values, CIPD stats, founding team. |
| `give-back.html` | Charity mechanic explainer. |
| `roi-calculator.html` | Interactive ROI with CIPD 2025 benchmarks. |
| `vyve-podcast.html` | 35+ episodes, guest form, Spotify/Apple/Amazon links. |
| `privacy.html` · `terms.html` | Legal. |
| `employer.html` | **Currently 404 — not built yet.** |
| `welcome.html` | Post-payment onboarding (stream picker + questionnaire). |
| `vyve-dashboard-live.html` | Employer dashboard for account management. |

Hosted via GitHub Pages (`Test-Site-Finalv3`). **DNS/proxy: Cloudflare presence UNCONFIRMED — Dean believes there is none (PM-682); do not assume a Cloudflare Worker/Redirect-Rule layer exists.** The branded `/join/[slug]` redirect is served by `Test-Site-Finalv3/404.html` (GitHub Pages catch-all), NOT Cloudflare and NOT join.html (§23.129). The portal pages at `online.vyvehealth.co.uk` are bundled inside the iOS + Android Capacitor binaries; the web URL itself is a browser-accessible account-management fallback.

---

## 19. Current status

### PM-707→718 — Challenges feature shipped end-to-end (2026-07-07)

Full build in one session: mockup → schema (`challenge_library`/`challenge_enrolments`, Dexie V28, sync registry) → challenges.html in More → evaluator (bus-lens, nav-injected) → home card → 23 SVG art tiles → VYVE 75 true 75-Hard shape (6 daily tasks auto/manual/photo, camera → private bucket, 3.5L water override, deep links). 60 challenges seeded (55 active). vbb 480→491. Open: GDPR bucket erasure (blocker), Lewis copy pass, 5 dormant challenges, quit-tracker spec (Phil gate).

### PM-658 — Live-session outage fixed: runner forward-window + server-side broadcast watchdog (2026-06-22)

Live sessions stopped airing ~18–22 Jun (4 days, silent). Root cause: `vyve-live-runner.py` `get_upcoming()` used `order=starts_at.asc&limit=100` with no lower time bound — once active `calendar_occurrences` passed ~100 rows the window pinned to the oldest (past) sessions and the runner went blind to the present (§23.125). Fixed both in the runner (forward window `starts_at>=now−5min`; per-loop `runner_heartbeat` upsert), now committed to `scripts/vyve-live-runner/` (first time under version control), and added a fully server-side safety net: `broadcast-watchdog` EF v1 (cron 50, `*/5`) verifies any session that should be airing is actually `live` on YouTube and that the runner heartbeat is fresh, alerting via email (team@) + native push (Dean) with auto-resolving dedupe (`broadcast_watch_alerts` + `runner_heartbeat` tables, migration `broadcast_watchdog_tables`). cron 27 `session-publish-hourly` re-enabled as belt-and-braces (CAS-safe). 11 missed 19–21 Jun sessions rescheduled into a 22–27 Jun evening catch-up block. Verified: heartbeat live (upcoming=6), watchdog selftest delivered email+push. Structural risk still open: runner on Dean's Mac + Google OAuth "Testing" mode 7-day token (backlog).

### PM-648/649/650 — VYVE Money financial wellbeing feature (2026-06-18)

vyve-site commits `e420236e` (PM-648 initial ship) + bug-fix run PM-649–657: nav wiring, safe-area, calc timing, auth pattern, localStorage key migration, gap fix, `updateSplit()`, one-time privacy notice, IIFE scope fix (`window.state`/`window.save`). Feature confirmed working on device at PM-657. New files: `money.html` (five-view financial wellbeing tool inside the Mind pillar) + `money-calc.js` (pure calc module, `VYVEMoney` global). Views: Hub (score ring, 4 KPIs, priority ladder, insights engine, learn nudge) / Track (income + 50/30/20 + expenses + pots + debts + net worth) / Assess (8-Q Likert → 0-100 score + dimensions + tips) / Plan (goal planner + EF target + 20yr compound projection + avalanche/snowball payoff) / Learn (starter path + 10 courses with knowledge checks + jargon buster). Persistence: all figures local-only in `localStorage` keyed `vyve_money_<email>`. Server writes: `mind_activities` `money_checkin` + `money_course` only — no financial data leaves device. Employer privacy badge conditional on `account_type='enterprise'`. Mind tile added to `mind.html`. sw.js precache + cache bump `vyve-cache-v2026-06-18-pm648-money-a`. vbb 460→461.

### PM-637 — Partner onboarding polish + admin file retrieval (2026-06-16)

PM-634: removed Photo ID + DBS from verification (now qualifications + references only); non-linear navigation — jump to any step, "Continue" never blocks, completeness enforced once at Submit (`isStepComplete`), rail shows per-section completion + %-of-8-done. PM-635: e-sign date auto-stamps today (read-only, no picker); profile photo renders as `<img>` in the phone preview (was a CSS background that didn't show). PM-636: new `partner-file-url` EF (admin-gated signed download) + Download button on CC content items → admins pull partner videos to their Mac to run live sessions; no transcode/streaming pipeline (not needed for this flow). Commits: Test-Site `280b88f5`/`f8007951`, CC `2ca57a41`.

### PM-631 — Partner onboarding JOURNEY built: self-serve wizard + `partner-onboarding` EF (2026-06-16)

Closes the item PM-630 flagged. Rebuilt the provided 8-step prototype as production `Test-Site-Finalv3/partner-onboarding.html` (commit `898f0c61`), wired to a new `partner-onboarding` Edge Function — layered onto PM-630's admin backend, no model duplication. Public no-login flow (PM-632: draft keyed by unguessable `partner_id`, no email step); server-side save/resume with localStorage fallback (runs offline in preview). Real signed-URL uploads to private `partner-docs`/`partner-content`. Submit writes the partner (status `applied`→admin pipeline), application credentials, gates+assessment, starter videos at `moderation_status='in_review'`, then notifies the team. Migration `partner_onboarding_intake_additive`: `partner_partners.contact_email` + `partner_onboarding_progress.assessment_score`/`assessment_passed_at`. **Decisions:** bank/payout capture dropped (Stripe Connect at go-live); agreement copy + assessment questions placeholder pending Lewis/Phil (HAVEN-style gate). **Verified:** write-replay constraint-valid, EF ACTIVE, wizard md5-matched. Live submit→pipeline not yet exercised from a browser (sandbox can't reach supabase.co); Dean to run first-use check on the live origin. Next: member-facing in-app Partner Space (no demo file yet); "Become a partner" CTA → `/partner-onboarding.html`; admin Invite to optionally set `contact_email` + dedupe.

### PM-633 — Partner referral attribution + Stripe webhook v10 (2026-06-16)

stripe-webhook EF v10 live. `customer.subscription.created` now reads `discount.coupon.id`, matches to `partner_partners.stripe_promo_code`, creates `partner_memberships` row (referred=true, b2c, £20, attribution_date). B2B excluded. Revenue share 50% default. Monthly payouts via `run_partner_payouts(period)` counting referred active B2C members only. Partner coupon standard: Stripe Coupon with manually-set readable ID (e.g. MAYA) — no promotion code objects. §23.122 codified.

### PM-630 — Partner Space: admin backend live on vyve-command-centre (2026-06-16)

`admin.vyvehealth.co.uk/partners.html` — standalone self-contained page matching Lewis's demo design system (dark `#0d1117`, mint `#5ec4b0`, left sidebar, 7 admin views). All wired to live Supabase data. 8 new `partner_*` tables with RLS, go-live gate trigger, onboarding pct sync, engagement segment refresh. Views: Overview, Pipeline kanban (Advance/Decline writes to DB), Partners directory (detail drill-in with sub-tabs), Content & Moderation (Approve/Return), Onboarding tracker, Analytics, Revenue ledger (Run payouts + Mark paid). Invite partner modal writes to `partner_partners` + `partner_applications`. All modal overlays use `document.body.appendChild` to escape flex stacking context (§23.121). Tables wiped clean — 0 rows, ready for real partners. CC sidebar has single "Partner Management" link → `/partners.html`. Still missing: member-facing Partner Space (no demo file yet), partner self-serve onboarding journey (`VYVE-Partner-Onboarding-Journey.html` received — next session), programs sub-tab, curriculum persistence. **(PM-683: superseded — tier links £20/£15/£10 w/ shared coupons + metadata.partner_slug attribution (stripe-webhook v13, stripe-reconcile v5), partner trials, payouts rewired to net-paid, 4 new partners, and partner-portal video upload now working via `partner-content-upload` EF. Full map: `playbooks/referral-system.md`. See §23.131-134.)**

### PM-608 — Onboarding password flow + welcome-email live sessions + onboarding resilience (2026-06-12)

Onboarding lock-out fix. Password now collected + complexity-gated in the questionnaire (PM-605, mirroring live Supabase rules: 8+/upper/lower/number/symbol; leaked-password protection turned OFF) and confirmed on Supabase BEFORE results, removing the fragile recovery-link critical path. login.html gained a "Set up your account" link (PM-602); set-password.html maps breach errors to guidance (PM-604). New `set-member-password` EF (verify_jwt:false) + SECURITY DEFINER RPC `get_auth_user_id_by_email` for manual password sets. Onboarding EF v96 (version 112): welcome email + AI session rec sourced from live `calendar_occurrences` (concrete name/host/"tomorrow at 8:30am"), not static service_catalogue. Onboarding EF v97 (version 113, LIVE): writeMember coerces weight_unit/height_unit to 'kg'/'cm' defaults instead of explicit null (the bug that hard-failed signups missing those answers), and falls back to a minimal core payload + team alert on any insert failure so a member is never locked out. 12 stuck members rescued (Shaun Baker → `Mario123!`). Welcome-email coach-voice rewrite mocked up, pending Lewis copy + Phil HAVEN sign-off. set-member-password / get_auth_user_id_by_email added to the EF/RPC inventory (§7).

### PM-594 — AI Usage page, correlation, HAVEN flag (2026-06-10)

cc-ai EF v1 + cc_ai table + cron 45. AI Usage page at `/#/ai-usage`. HAVEN compliance alert live (9 interactions, 3 real non-test members, clinical gate not passed). cc-wellbeing EF v4 + correlation_json. cc-activity EF v5 fixes watch column names (total_watch_minutes=5.9). 7 CC Insights pages now live.

### PM-593 — CC audit cont. (2026-06-10)

cc-activity EF v4 real build (was stub). cc-retention EF v5 adds reengage_json (per-stream email effectiveness). retention.js: SVG Day-N line chart + re-engagement section. Re-engagement: Stream A 52%, Stream B 24%, overall 43%.

### PM-592 — CC analytics audit improvements (2026-06-10)

cc-wellbeing EF v3 real build (was stub). cc-platform EF v2 is_dean filter. cc-revenue EF v1 + cc_revenue_cache + cron 44. cc-usage EF v7 account_type. Revenue page at `/#/revenue` (MRR £40, 22 trial pipeline). Usage: Account column + WoW deltas. Sidebar: 6 Insights entries.

### PM-591 — Platform & UX analytics page live (2026-06-10)

`cc-platform` EF v1, `cc_platform` table, cron jobid 43 at `:05 * * * *`. Page lives at `admin.vyvehealth.co.uk/#/platform`. Data: PostHog HogQL for page views + ef_error events; Supabase `perf_telemetry` for load time percentiles. Five CC Insights pages all live. First cache: 14,054 views, 639 unique sessions, 76 pages tracked, median LCP 391ms, 0 errors, 5 low-traffic pages.


### PM-569 — iOS 1.7 LIVE + deployment model flipped to bundled (2026-06-09)

iOS approved + live on the App Store at **1.7** (1.5 = first bundled submit PM-557; 1.6 submitted-then-cancelled; jumped to 1.7). 1.7 ships with `server.url` removed → **iOS members are now frozen on the bundled vyve-site SHA**, updatable only via a Capawesome OTA. **No OTA has ever run end-to-end**, so iOS members currently have no working update path short of a full store resubmit — new §23.106, top native priority before Sage. Dean alone runs the server.url dev-loop shell on his iPhone (sees every commit); members do not. Android bundled 1.0.6 vc51 still in review (approval unconfirmed) — Android members remain on the server.url live shell until it lands. §5 native row + §23.4 + §23.92 rewritten; PM-475 "no frozen cohort" correction reverted. vyve-capacitor remote is behind Mac-local on the 1.7 ship-state. Exec brief for Lewis + Alan produced (`VYVE_Platform_Update_2026-06-09.md`). No vyve-site code shipped — consolidation + brain only.

### PM-484 — Check-in merge: branching 5-step flow + enriched AI debrief (2026-06-05)

DB migration landed (8 new columns on `wellbeing_checkins`). `wellbeing-checkin` EF updated to v22 with full enriched signal assembly from 7 tables and structured AI response. `wellbeing-checkin.html` rebuilt as 5-step branching flow with new results screen. vbb Update 357. **Pending Lewis copy + Phil clinical sign-off for question wording** — structure is live, placeholders active.



Rolling 3-5 most recent ship narratives. Full detail for recent sessions lives in `brain/changelog.md`; everything pre-PM-554 (22 Apr — 7 Jun, trimmed from changelog.md at the PM-554 consolidation) is preserved in `brain/changelog-archive.md`. §19 is a status board, not an archive.

### PM-540/541 — JWT auto-refresh + session never-expire config (7 Jun 2026)

`window.vyveGetJWT` added to `auth.js`: shared helper that silently refreshes a stale access token via `refreshSession()` before returning. Returns `null` on genuine failure — never redirects mid-session. Hard login redirect stays in `vyveInitAuth` (cold boot) only. `habits.html` `supa()` updated to use `vyveGetJWT`; redirects to login only when null (truly dead session). `notifications.html` `getJWT` stub wired to delegate to `window.vyveGetJWT`, fixing "Couldn't load notifications" crash. Root cause: habits.html fired 3 parallel RLS queries with an expired access token simultaneously — all 401'd. Supabase Auth config patched via Management API: `sessions_timebox: 0`, `sessions_inactivity_timeout: 0` — members are never force-logged-out. vbb 411→412.

 + hybrid thumbnail model + Storage migration + on-device caching + deployment-model correction (4 Jun 2026)

Live-session host attributions corrected across the 30-day calendar (calendar_occurrences, UPDATE keyed on session_title): mindfulness talks wrongly credited to Lewis reassigned to Stephen / Jamie / Megan / Lucy (Lewis now hosts ZERO); Guided Journaling → Jamie. Thumbnails resolved into a hybrid per-host + per-type model (host photo by default; pilates.jpg for Nicola Pilates ×6, stretching.jpg for Alex Healthy ×20). New host photos supplied: megan, lucy (replaced), nicola, stephen, calum, alan, shan + type thumbs (PM-471/472 to /assets/hosts/). PM-473 added warmThumbnailPool() on-open prefetch + hardened a dead .all() (§23.87). PM-474 added the sw.js SWR cache vyve-session-thumbs-v1 (PRESERVE-listed). Then migrated the whole set to Supabase Storage bucket session-thumbnails and repointed image_url at Storage public URLs (seeded via one-shot seed-host-thumbnails EF over pg_net using LEGACY_SERVICE_ROLE_JWT after the Storage REST sb_secret_* rejection — §23.7). Net: thumbnails are content not code — instant via warm + SW cache, offline-capable, auto-updating, bundle-safe. Also confirmed + corrected the deployment model: capacitor.config.json ships server.url=live, so the WHOLE cohort is server.url-live (not bundled 1.3) — §5 / §23.4 corrected, new §23.92. Backlog: delete one-shot seed-host-thumbnails EF; remove dormant /assets/hosts/*.jpg copies; Calum/Alan/Shan staged but unscheduled.

### PM-424 — Mind tracker debug strip gating closed (28 May 2026)

Member-facing PM-324 debug strip was leaking onto every Today's Focus meditation play on `mind.html`. PM-418 gated the open-time render but left an ungated 1s `setInterval` poller re-inserting it. Fixed by guarding `renderDebugStrip()` at its entry behind `vyve_dev_panel_unlocked` (vyve-site `9300a0bf`, 4-file atomic, vbb 304→305). §23.63 candidate sharpening banked: gate the render fn entry, not the call site — pollers/subscribers bypass call-site gates. Remaining: the 8 `*-live.html` session-live strips still want a device-walk gating confirm.

### PM-413 — iOS 1.4 + Android 1.0.5 both submitted to App Review (26 May 2026)

iOS 1.4 build 3 sitting `Waiting for Review` in App Store Connect, auto-release on approval (24-48hr expected). 1.3 sidebar entry `Ready for Distribution` will auto-supersede on 1.4 approval. Android 1.0.5 versionCode 50 production release saved in Play Console; AAB accepted with 4 non-blocking warnings. Earned §23.76 (iPad orientation 4-array invariant — iOS Code 90474). Mac local has uncommitted changes to capacitor.config.json + several Android/iOS files that the remote `7a54c876` doesn't yet carry — selective audit-and-curate commit on vyve-capacitor pending. Brain doctrine corrected: Mac local was the real source of truth for the prior bundle ship, not the remote. Going forward, remote must match Mac-local ship-state after every bundle session via curated atomic commit. App Review notes scanned for residual "PWA-based" framing per §23.20 — corrected pre-submission.

### PM-411 — Bundle-prep park entry, no vyve-site changes (26 May 2026)

Park entry holding state for Dean's Thursday pickup ahead of Pro 20x weekly limit reset. Bundle-prep prompt locked at `/mnt/user-data/outputs/bundle-prep-prompt.md`. Body-hub overhaul campaign documented from the deanonbrown2@gmail.com onboarding walk earlier in the session. Three Body-side bugs surfaced — Bug A architectural (post-trial, 4-6h): Movement plan structurally homeless because workout_plan_cache rows all have `category: null` and exercise.html L350 hardcoded `href="workouts.html"` regardless of programme category. Bug B surgical (Thursday, 30-45min): activateProgramme cache-bust race where workouts-programme.js L78-89 reads Dexie before un-awaited criticalHydrate propagates. Bug C surgical (needs device console, 30-60min): Browse Library tab runtime error swallowed by outer try/catch. Schema-architecture note banked-not-codifying-solo: workout_plan_cache has contradictory UNIQUE indexes that may make workout-library EF v13 paused-plan logic non-functional in practice — promotes to §23 on second occurrence.

### PM-410 — Replay catalogue wipe + refresh-replay-videos v2 reconciliation (26 May 2026)

All 33 test-content replay videos archived to a new private YouTube playlist and source playlists emptied. `refresh-replay-videos` v2 shipped with a reconciliation step that DELETEs `replay_videos` rows whose `youtube_video_id` isn't in any live playlist — closes the permanent gap where YouTube-side deletions never propagated to Supabase. Three throwaway EFs deployed for the work are dormant in Supabase pending dashboard delete. Member-visible result: Replays hub shows empty state across all 8 categories on next page load until Lewis lands real content. §23 candidate banked: upsert-only sync without reconciliation = stale-row class bug whenever upstream supports deletion. Promotes on second recurrence.

### PM-408 — Analytics taxonomy ship pre-bundle (26 May 2026)

`analytics.js` central PostHog bridge added (267 lines, 45 HTML pages wired, precached via sw.js). Subscribes 29 VYVEBus events at `envelope.origin === 'local'` to avoid double-counting cross-tab/realtime echoes. auth.js v2.5 enriches identify with `{given_name, family_name, is_dean, host_kind}` for Dean-dev-traffic filtering and bundled-vs-web split. New `window.vyveEFFetch` wrapper available for opt-in EF error capture (not yet retrofitted). Banked NOT shipped: duplicate `posthog.init` inline block in index.html L1043-1046 pre-empts auth.js deferred init — safer as its own ship with incognito verification.

### PM-402 — Broadcast push infrastructure shipped end-to-end (26 May 2026)

Lewis-facing manual broadcast UI live at `admin.vyvehealth.co.uk/#/broadcast`; scheduled-push cron rails (no UI v1). New `broadcast_schedules` + `admin_broadcast_log` tables, `is_admin()` SECURITY DEFINER RPC, `resolve_broadcast_audience(jsonb)` resolver supporting 6 audience shapes. Two new EFs: `admin-broadcast-push` v2 (JWT-gated, defence-in-depth via is_admin RPC) and `scheduled-push-runner` v2. New pg_cron job 28 every 5min. Smoke test green end-to-end across all four channels (in-app row + APNs + VAPID web + audit log). Out-of-scope-v1 parked: scheduler creation UI in Command Centre, quote-pool infrastructure, Android FCM banners, same-day dedupe, custom audience JSON editor. Auth-shape gotcha banked first-occurrence: post-key-rotation `SUPABASE_SERVICE_ROLE_KEY` is `sb_secret_*` shape; EFs calling `send-push` with the legacy Bearer-equality check need `LEGACY_SERVICE_ROLE_JWT` instead.

---

## 20. Enterprise contract blockers

| Item | Owner | Status |
|---|---|---|
| B2B volume tiers defined | Lewis + Dean | OPEN |
| HAVEN clinical review | Phil | PENDING — persona content held from sign-off; auto-assignment currently active in production (see §10) |
| Brevo logo removal | Lewis | OPEN — ~$12/month add-on, needed before first enterprise demo |
| Employer dashboard build | Dean | OPEN — dashboard itself not built yet; API key wiring is downstream of that. Backlog item (Admin / Command Centre). |

---

## 21. Outstanding build items & priorities

The bundle-ready campaign shipped: iOS is live (1.7 bundled) and **iOS 1.8 + Android 1.0.7 are now in App Review (PM-602, submitted 11 Jun)** carrying the OTA wiring. The dominant near-term priority is **verifying one Capawesome OTA end-to-end** (§23.106) — until that lands, no iOS member-facing fix ships without a full store resubmit. (Note: the §19→§22 status board below was a 26-May snapshot; refreshed for currency PM-603, but the rolling ship narratives in §19 + the changelog are the freshest source.)

### Pre-launch (next sessions)

- **Body-hub overhaul (PM-411 backlog).** Bug A architectural (movement plan structurally homeless — programme_library category backfill + onboarding EF v37 to write category + exercise.html branching + movement.html programme-card section). Bug B surgical (activateProgramme cache-bust race in workouts-library.js / workouts-programme.js). Bug C surgical (Browse Library tab runtime error swallowed by try/catch). Mockup-first per the working style; Bug A is post-trial scope, B/C are Thursday-grade.
- **vyve-capacitor remote sync.** Dean's Mac at session end (PM-413) has uncommitted changes to capacitor.config.json + android/app/build.gradle + ios/App/App/Info.plist + package.json + ic_launcher_background.xml + regenerated mipmap PNGs. Selective audit-and-curate commit pending; remote `7a54c876` is missing the bundle session's recovery work.
- **Phil sign-off chase.** HAVEN persona auto-assignment is live in production for **3 real members (Calum Denham, Conor Warren, Kieran Day) + Phil himself — 9 interactions, clinical gate NOT passed (PM-594)**, without clinical review. Pre-Sage compliance risk. Dean to brief Lewis + coordinate Phil sign-off. `VYVE_Health_Hub.html` staged in web root awaiting same. Both gated on Phil.
- **iOS 1.4 / Android 1.0.5 review outcomes.** Confirm Play Console shows `In review` not `Draft` next session (Dean had the "Send 1 change for review" button staged at PM-413 commit time).

### Pre-launch hygiene

- **OTA bundle prep — DONE in 1.8/1.0.7 (PM-600/602).** `live-update.js` (sync/ready/setChannel `production`) ships in the web shell; `ota-deploy.yml` + `CAPAWESOME_TOKEN` are in vyve-site CI. Remaining: once 1.8 installs on a real device, fire `ota-deploy.yml` at rollout=10 and verify the bundle lands (§23.106 — top native priority, pre-Sage gate).
- **Replay catalogue refill.** PM-410 wiped all 33 test-content replay videos; Replays hub shows empty state until Lewis lands real content. Throwaway EFs (`replay-inventory-tmp`, `replay-archive-tmp`, `replay-ghost-cleanup-tmp`) still ACTIVE in Supabase pending dashboard delete.
- **PostHog duplicate-init follow-up (PM-408).** index.html L1043-1046 duplicate `posthog.init` pre-empts auth.js deferred init; needs incognito-verified ship.

### Post-launch backlog

Achievements system overhaul (PM-94) — post-trial, 2-3 sessions, own campaign. In-App Tour PF-23 — v1 DESCOPED to explanatory (intro slides + in-context spotlight, no per-step achievement), decoupling it from Achievements; full build spec in tasks/backlog.md "READY TO BUILD — PF-23 v1", copy drafted PM-553, `members.tour_completed_at` migration approved. Build-ready; ship vehicle (next binary vs first OTA `--rollout 0.1` canary) is Dean's call. Realtime cross-device sync (PF-5b). Apple Health page redesign. `auth_blocked` banner in member UI. HealthKit background sync (~400 LOC Swift plugin, 4-5 sessions, 1 week soak). Health Connect (Android) — parked until Dean has Pixel/Galaxy device. The Fore grant register June/July 2026. WHISPA research partnership monitor.

### Backlog — security & hygiene

- Edge Functions deletion pass — one-shot patchers + debug EFs accumulate; ~32 active candidates plus the three throwaway replay EFs from PM-410.
- Anon-key rotation (admin console).
- Brain hygiene: changelog.md is now **67KB / ~800 lines** (PM-554 onward) — the pre-PM-554 history (~2.96MB, 504 entries back to 22 Apr) was split into `brain/changelog-archive.md` (PM-570). The old ">1MB → route via /git/blobs" handling now applies to `changelog-archive.md`, not `changelog.md`.
- GDPR cron static-PSK exposure — RESOLVED PM-603 (hardcoded bearer removed from jobs 21/22; it was a no-op artefact).
- APNs key rotation (accepted risk, blocked on Apple 2-keys-per-team cap).
- Stripe secret on EF environment (carried from earlier sessions).
- Cron auth migration from hardcoded literals to Vault (cron jobs 21 + 22 hardcode PSK directly in `cron.job.command`).
- Standardise NO-ACTION FKs to CASCADE.
- Leaderboard refactor.
- Exercise restructure (Exercise Hub with Movement/Workouts/Cardio streams) — partially shipped via Body pillar work; finish post-trial.

---

## 22. Open decisions

- **B2B volume discount tiers** — formally define before first enterprise contract.
- **Annual pricing discount %** — Lewis decision, Dean adds to Stripe once confirmed.
- **HAVEN go-live** — Phil's clinical review. Auto-assignment is live in production for 3 real members + Phil (9 interactions, gate not passed — PM-594). Decide: pause auto-assignment until sign-off, or accelerate Phil's review. Pre-Sage compliance risk.
- **`VYVE_Health_Hub.html` go-live** — Phil's clinical review of assessment instruments, scoring/risk thresholds, signposting copy. Page is staged in web root; promote to nav once approved.
- **Microsoft Exchange / GoDaddy migration (`team@vyvehealth.co.uk`)** — currently a personal account; migrate to a proper enterprise tenant post-first-enterprise-contract.
- **External DPO service** — required before 500 members.
- **Wellbeing Scorecard** — host on live domain. Which URL? Who builds form submission?
- **Today's Progress strip** — Lewis to approve copy before building.
- **Podcast rebrand timing** — *The Everyman* → *The VYVE Podcast* — when to switch fully.
- **Weekly-checkin-nudge copy split** — first-time activation vs continuity reminder. Phil + Lewis sign-off needed before EF scaffolding.
- **Named charity partner** — when to formally announce / sign first partnership. **Now load-bearing for the free-trial conversion copy** (the plural "charity partners" claim) — settle named partner or soften wording before that copy goes member-facing.
- **Free-trial conversion model (PM-476, design locked, build pending)** — 30-day trial (not 14); blended "easy first" charity milestone = ANY 30 activities (sum of `get_certificate_buckets`) funds the first donated month, then per-pillar resumes; no new anti-spam cap (capped buckets = 7/day ceiling → ~5-day floor); celebrate the milestone early but make the real conversion ask near the wall (~day 24) + day-30 wall; £10-off-FOREVER confirmed as the standing conversion price (resolves the standing-price question). Detail in changelog PM-476 + backlog Trial/membership; two review docs produced for Lewis (not in repo).
- **APNs key rotation** — accepted risk pending Sage procurement diligence. KEY_ID `2MWXR57BU4` exposed in chat 27 April 2026 PM, rotation attempted 07 May hit Apple's 2-keys-per-team cap. Risk profile low; rotate if Sage's security review surfaces it.
- **Secondary email service provider** — Brevo is single-provider for onboarding welcomes / certificates / re-engagement / push fan-outs. No failover ESP. Pre-Sage acceptable; post-Sage evaluate AWS SES as secondary.
- **GDPR cron static-PSK exposure — RESOLVED (PM-603 enterprise-bridge).** Jobs 21 + 22 previously hardcoded a bearer in `cron.job.command`; the bearer was a no-op artefact (CRON_SECRET was never set on the EF, so it was never validated — service-role client is the real auth layer). The hardcoded bearer has been removed; both jobs now call their EFs with Content-Type only. No longer a procurement flag.
- **Goal re-pillaring (PM-159, partial)** — certificate re-pillaring SHIPPED PM-435 (certs now read the five Your Journey buckets via `get_certificate_buckets()`). The per-activity GOAL-target half (weekly goal targets mapped onto the pillars) is still open. Revisit alongside home-redesign EF trim.
- **5 disabled Make tasks** — keep or remove: LinkedIn article, podcast brief, LinkedIn newsletter, PR pitch, employee advocacy pack.
- **Autotick evaluator multi-source arbiter** — when/if a future member has two sources (HealthKit + Fitbit).

---

## 23. Known gotchas & architecture rules

**Dimension scale note (check-in branching):** `dimension_energy/sleep/stress/body` use 1/2/3 (low/mid/high tap), not the 1-10 scale of `score_*` columns. Branch thresholds: mood≤4 OR stress=1 OR energy=1 → negative; mood≥7 + 2×dim=3 → positive; else neutral. Mirror in EF `computeBranch` and client `computeBranchClient`.

Curated and renumbered. Rules organised by topic family with monotonic numbering within each family. Promotion criterion: candidate after first occurrence, hard rule after second-or-third recurrence. Historical lineage preserved in `brain/changelog.md` — read the PM cited on each rule for the worked example.

### Architecture invariants (§23.1-§23.10)

#### §23.1 — VYVE is two Capacitor binaries, not a PWA

The product is delivered as the **iOS App Store** binary and the **Google Play Store** binary, both wrapping the `vyve-site` web shell via Capacitor. `online.vyvehealth.co.uk` is a browser-accessible **account-management fallback** for members who need web access — it is *not* the member experience. Do not reintroduce "add to home screen" / PWA install banners (removed 04 May PM-3). Member-facing copy says "the VYVE Health app" — never "the PWA". App Review notes describe VYVE as "native iOS app built with Capacitor wrapper". The phrase "PWA" is internal-only, referring strictly to the legacy infrastructure (service worker, `offline.html`) that still services the web fallback. Earned PM-77. Reinforced PM-413 — App Review notes scanned for residual PWA framing pre-submission.

#### §23.2 — Auth is Supabase Auth; Auth0 is gone

Supabase Auth is primary. Auth0 is gone entirely. Never say "Auth0 gated". Don't reintroduce Auth0 patterns.

#### §23.3 — On-device Dexie is the source of truth for member data

Every read goes to Dexie. Every write hits Dexie first, then queues to Supabase in the background. Supabase is the sync target + cross-device propagation via Realtime + server-side compute for AI / cron / leaderboards / employer aggregates. It is not the rendering source for the member's own data. This commitment may not be revised without a specific measured problem this architecture can't solve. Earned PM-77.

#### §23.4 — Bundled-native changes the meaning of every vyve-site main push (PM-115/116/178; RE-CONFIRMED LIVE PM-569)

Dean's iPhone in dev-loop mode (server.url → `online.vyvehealth.co.uk`) sees every vyve-site main commit live immediately (subject to WKWebView cache 2-15min). Bundled-mode members see only the SHA frozen in their IPA/AAB until an OTA via Capawesome lands. Dean seeing a change immediately ≠ live to members. Do not re-explain this. **HISTORY:** PM-475 (2026-06-04) temporarily corrected this to "whole cohort is server.url-live, no frozen bundle" because capacitor.config.json then shipped server.url=live. **That correction is now itself WRONG (reverted PM-569, 2026-06-09):** iOS 1.7 went live with server.url REMOVED, so iOS members ARE now frozen on the bundled SHA — the original §23.4 split is the live truth again for iOS. Android 1.0.6 is now live too (approved 9 Jun, PM-573), so once members update the whole cohort is bundled/frozen — the split (Dean live, members frozen) applies cohort-wide, not iOS-only. Net live state: a vyve-site commit reaches Dean (server.url) + Android members, NOT iOS members. See §23.106 for the OTA-delivery gap.

#### §23.5 — Anthropic key location

Server-side in Edge Functions only. Never in HTML or committed to GitHub. Stored as Supabase secret.

#### §23.6 — Theme system invariant

All portal pages use dual dark/light CSS token blocks. Never single `:root`. Always include `theme.js` before closing `head` — and `theme.js` is the one script tag that must NOT have `defer` (it runs synchronously at parse time to set `<html data-theme>` from localStorage before body renders; deferring causes a theme-flash on every navigation).

#### §23.7 — Edge Function deploys

Always require full `index.ts`. `verify_jwt:false` for public-facing functions. Service-role-guarded EFs that compare `Authorization` against `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` need the new `sb_secret_*` runtime value, OR the legacy JWT via the dual-auth `LEGACY_SERVICE_ROLE_JWT` secret. `send-push` v11+ and `achievement-earned-push` v1+ are canonical dual-auth implementations. Auth-shape gotcha banked first-occurrence PM-402 — EF-to-EF call where the callee uses Bearer-equality check needs `LEGACY_SERVICE_ROLE_JWT`, not `SUPABASE_SERVICE_ROLE_KEY`. Promotes to a sharpened sub-rule on second occurrence. **Sharpening (PM-474, THIRD occurrence): the Supabase Storage REST API also rejects the sb_secret_* shape** — PUT/POST to /storage/v1/object/... with Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY} returns 400 {"statusCode":"403","message":"Invalid Compact JWS"} because Storage verifies a JWT. Use LEGACY_SERVICE_ROLE_JWT (plus the apikey header) for any Storage REST call. Class now seen at: EF-to-EF Bearer-equality (PM-402) and Storage REST (PM-474). Rule: any service that JWT-verifies the key needs LEGACY_SERVICE_ROLE_JWT, never the rotated sb_secret_* value.

#### §23.8 — Composio `SUPABASE_UPDATE_A_FUNCTION` corrupts deployed bundles

Reproducer 28 April: deploy a working stub via `SUPABASE_DEPLOY_FUNCTION` (200), then call `SUPABASE_UPDATE_A_FUNCTION` with byte-identical body — next invoke returns persistent BOOT_ERROR. Metadata changes (verify_jwt) DO take effect, but the bundle gets mangled. **Always use `SUPABASE_DEPLOY_FUNCTION` for body changes.** UPDATE is unsafe except for slug/name renames. Companion: `SUPABASE_DEPLOY_FUNCTION` has no verify_jwt param — defaults true; for `verify_jwt:false` use the native Supabase MCP `deploy_edge_function` tool.

#### §23.9 — Native MCP for EF source over Composio

`Supabase:get_edge_function` returns clean `files: [{name, content}, …]` array suitable for editing and redeploy. Composio's `SUPABASE_GET_FUNCTION_BODY` returns compiled ESZIP bundle (types stripped, JS minified) — useful for forensics on a deployed bundle's actual runtime shape, not useful for editing. For multi-file EFs with shared modules, use native `Supabase:deploy_edge_function` with `files=[...]` listing all relative dependencies — Composio's `SUPABASE_DEPLOY_FUNCTION` only takes a single-file `file_content`.

#### §23.10 — Offline-equivalent operation is the contract, not a feature (PM-103)

Read paths cache aggressively. Write paths queue via `VYVEData.writeQueued` and stamp `client_id` so re-flushes are safe. Live data (live sessions, push, real-time chat) genuinely needs network and we say so. New tables that take member-authored writes get a nullable `client_id uuid` column + partial unique index `(member_email, client_id) WHERE client_id IS NOT NULL`. The outbox MUST set `Prefer: resolution=ignore-duplicates,return=minimal` on every queued PostgREST insert that has a `client_id` partial unique index — without it, a re-flush after a successful-but-network-dropped insert will 409 and dead-letter a row that actually persisted.

---

### Native bundle & store discipline (§23.11-§23.20)

#### §23.11 — Capacitor `Info.plist` uses `$(MARKETING_VERSION)` / `$(CURRENT_PROJECT_VERSION)` placeholders

Replace hardcoded version literals with build-setting placeholders once per project. Otherwise agvtool drifts vs Info.plist on Distribute.

#### §23.12 — Apple closes a version train on first upload

Regardless of approval status, a CFBundleShortVersionString version is closed on first upload. Re-shipping requires version bump. Re-exposed PM-413 cycle 1 (1.3 had been rejected earlier, train closed, only forward path was 1.3 → 1.4).

#### §23.13 — CLI archive → CLI exportArchive → Organizer Distribute bypasses GUI rollback issues

Use when Xcode GUI is fighting back. Also: when distributing, uncheck "Manage Version and Build Number" if agvtool has set the version locally — Xcode's distribute-time auto-bump leaves Info.plist drifted.

#### §23.14 — Quit Xcode fully before sed'ing `pbxproj`

The GUI silently rewrites it on view-focus.

#### §23.15 — Android version-code discipline

When re-establishing Android shipping for an existing app, jump versionCode to a clearly-higher integer rather than next-from-source-of-truth. `keystore.properties storeFile` path is relative to `android/app/`, not `android/`. PKCS12 keystores enforce store password === key password — don't write a brute-force loop that tries them separately. Any Android bundle containing a plugin that declares health permissions in its manifest triggers the Play Console Health Declaration, even if the plugin is dormant at runtime. Play Console retains state independent of the brain — verify live state before re-shipping an Android app that hasn't been touched in weeks.

#### §23.16 — iOS HK auth resets on binary upgrade

Every signed-binary change (1.x → 1.y, PWA → native, dev → release) resets HealthKit per-app auth state to "not determined", regardless of App ID continuity. iPhone Settings → Health → Data Access & Devices entry is created on first successful `requestAuthorization` prompt, NOT on install. Auto-sync code paths must detect the all-probes-unauthorized pattern and re-prompt; `member_health_connections.platform` row presence is NOT sufficient signal HK is functional. Check `platform_alerts.client_diagnostics` first when HK silently breaks — if every probe in the most recent row failed with `auth-not-determined`, you have a binary-upgrade auth reset, not a code bug. Server-side EFs maintaining a "last successful sync" cursor must verify a sync actually pulled data before advancing — empty pulls, all-probes-failed pulls, and explicit error responses must NOT advance the cursor. `sync-health-data` v9 implements this for HK via `diagnosticsShowAuthBlocked()`.

#### §23.17 — App Store icon must be RGB no-alpha

App Store Connect rejects PNGs with alpha channel even when alpha is uniformly 255. Flatten via PIL: `Image.new("RGB", size, bg).paste(rgba, (0,0), rgba)` before submission. Canonical brand icon source: `online.vyvehealth.co.uk/icon-512.png` (fully opaque, brand-correct). Lanczos upscale 512→1024 + RGB flatten on `#0D2B2B` is App Store-acceptable.

#### §23.18 — `@capacitor/assets` v3 single-icon scheme

Modern Xcode 14+ reads a single `AppIcon-512@2x.png` at 1024×1024 universal from `AppIcon.appiconset/`. Legacy 60/76/83.5 multi-size slots no longer in spec. `npx @capacitor/assets generate` doesn't clean orphans — manually `rm` files not referenced in regenerated `Contents.json`. Sharp on Apple Silicon requires `npm install --include=optional sharp`.

#### §23.19 — AppDelegate.swift bridge methods required for Capacitor PushNotifications

Without `application(_:didRegisterForRemoteNotificationsWithDeviceToken:)` and `application(_:didFailToRegisterForRemoteNotificationsWithError:)` posting to `NotificationCenter`, registration never fires. Audit before any future archive. App Store: `NSFaceIDUsageDescription` required even for unused biometric plugins — `capacitor-native-biometric` or any plugin linking `LocalAuthentication.framework` gets compiled into the binary regardless of use.

#### §23.20 — iPad orientation arrays are non-negotiable all-four (PM-413)

Any iOS Info.plist orientation work must independently inspect and preserve `UISupportedInterfaceOrientations~iphone` and `UISupportedInterfaceOrientations~ipad` arrays. The iPad array must declare all four orientations (Portrait, PortraitUpsideDown, LandscapeLeft, LandscapeRight). The iPhone array may be any subset. App Store validation Code 90474 fires when iPad orientations are incomplete — iPadOS Stage Manager and Split View require all four. The blanket sed pattern `sed -i '' '/UIInterfaceOrientationLandscapeLeft/d'` is array-agnostic and will collapse both arrays — use a Python heredoc edit targeting the specific key block instead. Audit signal at session end: any session that touched `ios/App/App/Info.plist` must include a pre-Archive grep check — both arrays present, iPad has all 4.

---

### Tooling discipline (§23.21-§23.30)

#### §23.21 — Parallel-session safety protocol (PM-177)

Foundation rule. Before committing a multi-file change via Git Data API, fetch live `main` SHA. If HEAD has moved since session start, treat the parallel session as a real collision: re-fetch every file you intend to commit, rebase patches against live content, re-verify. Per-file SHA matching at commit moment via Contents API raw accept on every committed file at the commit SHA. §23.21 catches *that* HEAD moved; the rebase rule below catches *what changed*.

#### §23.22 — Pre-commit content rebase, not just SHA-rebase (PM-296)

Before committing, fetch live HEAD content for every file being committed and compare against working base. On trivial drift (cache key bumped, vbb-marker bumped), re-fetch live content, re-apply patches to live content, continue. On substantial drift in regions your patch touches, abort, three-way-merge by hand. Do NOT commit through drift. §23.21 alone is insufficient — it checks branch SHA, not file content. Audit signal: any session-end commit message saying "restored content erased by [prior commit]" is a §23.22 violation in the prior commit.

#### §23.23 — Session-start feature-collision scan (PM-311)

After brain load, before code work, if the brief implies a coding deliverable, scan the last 15 vyve-site commits for feature keywords drawn from the brief. Hits get surfaced to Dean before design conversation opens. Sub-second cost; PM-311 wasted ~90 minutes re-implementing the live-tracker because parallel session shipped PM-304 in the gap between Dean's brief and session start. Skip on pure design / talk-first sessions and on "continue PM-X" briefs. Diagnostic/debug sessions still benefit but are unlikely to surface.

#### §23.24 — PM-claim recompute at commit time (PM-319)

Right before `POST /git/commits`, refresh-fetch `GET /commits?sha=main&per_page=5`. Parse first lines for `^PM-(\d+)`. Set my PM number to `max(seen) + 1`. If different from draft, sed-sweep staged files + commit message before posting. Atomic ref-update protects content; this protects label. Companion to the PM-XXX placeholder pattern: during a build that spans multiple turns with parallel sessions active, write source with `PM-XXX` / `pmxxx-` placeholders, then single sed-sweep to the freshly-claimed number at commit time immediately after the §23.21 fresh-HEAD fetch.

#### §23.25 — Cross-repo PM-number scan (PM-381)

§23.24 scans the ship target repo only. VYVE shares a single PM-number namespace across vyve-site and VYVEBrain — a parallel brain session may have claimed your PM-N for a staging artefact. At PM-claim time, scan last 5 commits in both repos, take max across both, claim max + 1. `.b` suffix convention for brain-narrative companion to canonical PM-N (PM-362.b weekly recap brain close after vyve-site PM-362, PM-379.b, PM-381.b). Standalone brain ships claim their own PM number.

#### §23.26 — Brain whole-file overwrite hazard (PM-354/355)

Brain commits MUST re-fetch `brain/changelog.md` + `brain/master.md` from live main IMMEDIATELY before blob creation. Parent-SHA match is necessary but not sufficient — parallel session can land brain content between fetch and commit, whole-file blobs silently overwrite. Fired twice in one session. Recovery: pull the colliding commit diff, extract +lines, re-prepend. Extend §23.21 fresh-HEAD discipline to brain files; brain reads of files >1MB MUST route through `/git/blobs/{sha}` not `/contents/{path}` (Contents API returns empty content + download_url for files >1MB, naive caller writes 0 bytes silently).

#### §23.27 — Composio outage fallback: direct PAT, max 2 retries (PM-185)

Composio is normally primary GitHub path. Outages happen (21 May 2026 security incident — tokens revoked, 401s despite "Active"). On any 401, max 2 Composio retries then fall back via Supabase MCP `execute_sql`: `SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'GITHUB_PAT_CLAUDE'`. Never ask Dean to paste — Vault has it. Then `bash_tool curl` direct vs GitHub REST. Reads use `Accept: application/vnd.github.raw`. Single-file writes use `PUT /repos/{owner}/{repo}/contents/{path}` with base64 + fresh SHA. Multi-file atomic commits need Git Data API: blobs → tree → commit → update ref (Contents API is one-file-per-call).

#### §23.28 — Curl arg-list rule: write large bodies to /tmp, never argv (PM-209)

Never substitute large file bodies into bash argv via `-d "$body"`; always write to /tmp and pass `--data-binary @file`. argv overflow corrupts silently. Companion to bash `for` loops with embedded base64 of multiple files via `python3 -c` silently reusing previous payload (PM-261b) — use Python urllib with body written to /tmp, never multi-iteration argv composition.

#### §23.29 — JSON parse from a file, not from an inline `python3 -c` in a `$()` capture (PM-210b)

When a captured API response is JSON, write the response body to a file first, then parse from disk. Never `<command> | python3 -c | $(...)`. JSON with control characters (multi-line message fields) breaks the inline parse silently; the surrounding `if [ -z "$VAR" ]` branch then reports the wrong failure mode. Distinct from the curl-argv rule — that's write-side, this is read-side.

#### §23.30 — Post-commit byte-perfect verification

After every commit, re-fetch every committed file at the commit SHA via Contents API with raw accept (or Git Blob API for >1MB files), compare bytes-to-bytes against local staged content via md5 or sha256. First-N-chars verification on UTF-8 files is a false-positive trap (newline normalisation can show false MISMATCH) — use md5 (PM-269). For multi-file atomic commits via `GITHUB_COMMIT_MULTIPLE_FILES`: `upserts` array (not `files`), `message` field (not `commit_message`), `deletes` is a flat array of path strings (not objects). Re-fetch and confirm the returned `changed_paths` match upserts — Composio's tool has been observed returning a different commit silently.

---

### Optimistic-first / bus discipline (§23.31-§23.40)

#### §23.31 — Optimistic-first / persist-then-upload contract (PM-151, sharpened PM-239)

Member-action writes: flip UI synchronously, then fire un-awaited background work (Dexie + outbox + bus publish). The haptic IS part of the UI flip and belongs in the same animation frame as the renderer, not gated behind any await (PM-368 lesson). Navigation/UI-flip happens immediately after bus publish, before any awaited fetch (PM-362 connect-checkin lesson — POST stays un-awaited with `keepalive:true`, page is gone before resolution). Failed writes fire `<event>:failed` for revert; subscribers undo state via `VYVEHomeState.revertPatch(type, {...})`. 4xx → eager revert; 5xx + network throw → suppress eager fire, revert via `vyve-outbox-dead` window event only (transient failures shouldn't flicker UI).

#### §23.32 — `client_id` row id must always be a valid UUID (PM-167)

Stamp `id: clientId` on POST payload alongside `client_id` — otherwise server `gen_random_uuid()` fires and Dexie row keyed by clientId desyncs from server row keyed by server id, producing 2 rows per logical activity. Earned PM-386 (33/33 movement, 38/42 mind, 13/13 cardio rows in production had `id != client_id`). Companion: when a new activity table goes live, every read surface displaying counts from it must be audited — score functions (SQL + JS twins), tile renderers, home pills, v1-column-additive reads. Default to Dexie-direct parallel reads over v1-column dependencies for surfaces displaying post-write state (PM-386 → PM-389 reinforcement).

#### §23.33 — The activity cap is a credit calculation, never a write gate (PM-166)

Counting caps must NOT be implemented as storage-destroying triggers. Never duplicate a magic threshold across triggers (PM-150). Caps apply to `source='manual'` only — Apple Watch members doing 3+ workouts/day were broken by the original 2/day cap. Charity + cert counters stay independently capped via read-path `LEAST(COUNT(*), 2)` and `existing_count < 2` checks.

#### §23.34 — Page-side Dexie wiring is a requirement, not an optimisation (PM-96)

Every page that paints member data MUST either (a) read `VYVELocalDB.<table>.allFor(memberEmail)` inside an `await VYVESync.hydrate()` block with REST fallback, OR (b) deliberately pass through to REST/EF for legit reasons (aggregate reports, server-computed leaderboards). Audit signal: ripgrep `VYVELocalDB` in every member-data page; 0 hits = amber by construction. Companion rules: `await VYVESync.hydrate()` returns true even when individual tables fail; first paint after sw.js cache key bump may flicker amber.

#### §23.35 — Dexie upserts MUST merge by default for member-scoped tables (PM-97)

`VYVELocalDB.<table>.upsert` must merge incoming row over existing keyed row, not replace. Replace-by-default loses optimistic fields the server hasn't echoed back yet.

#### §23.36 — UI state mutation must be synchronous on the active surface (PM-98)

The active surface mutates its own state synchronously on local tap and renders. The bus is fan-out (cross-page subscribers), not the trigger for the active page's own UI. Companion: optimistic INSERT rows must be FAT for denormalised stores (PM-153) — carry all join columns the UI needs to paint, otherwise hydrate-thin + paint-fat = "undefined" canaries (Habits 14 May lesson).

#### §23.37 — Cache-first first paint covers ALL surface counters (PM-100)

Not just the main list. Surfaces must self-correct on date rollover. In-app cache reset must force a full Dexie rehydrate before next paint (PM-102).

#### §23.38 — Hydrate via merge, never wipe-then-refill (PM-183.3)

Wipe-then-refill leaves the UI showing nothing in between. Merge writes over existing keyed rows; new rows append; deletions on server reconcile via tombstone or explicit DELETE event.

#### §23.39 — A page that reads from Dexie must load the Dexie stack (PM-183.6)

Sibling to §23.44 (script-tag inclusion auditing) but at architecture level: pages reading `VYVELocalDB` need db.js + sync.js + bus.js in their script tags. Defensive `if (window.VYVELocalDB)` guards mean missing script tags fail silently.

#### §23.40 — Mind activities log via the optimistic-first / outbox / failure-bus skeleton (PM-173)

Canonical implementation reference for the §23.31 contract — every new activity surface (movement PM-307, connect-checkin PM-289) follows this shape.

---

### Bus event discipline (§23.41-§23.50)

#### §23.41 — Envelope-trusted subscriber when publishing surface uses fire-and-forget Dexie writes (PM-293)

Cross-page bus subscribers MUST NOT trust Dexie as the sole source of truth when the publishing surface uses fire-and-forget Dexie writes. Subscriber applies the envelope's signal (sign / primary key / discriminator) to the active surface's in-memory state **synchronously**, renders, AND THEN re-reads Dexie as a second pass for state not in the envelope. Pattern: decode change from envelope → applyToActiveState → render → second-pass Dexie reload. The envelope contract: publishers MUST include primary key + signal of change direction (sign / is_yes / kind) so subscribers can decode without re-reading storage. Distinct from §23.36 — §23.36 covers active surface mutating own state on local tap; §23.41 covers cross-page subscribers reacting to remote publishes.

#### §23.42 — In-page-vs-cross-page envelope discipline (PM-391/401)

Envelope-trusted subscriber pattern is for CROSS-PAGE subscribers only, not in-page same-surface subscribers where the publisher already did the optimistic mutation. In-page subscribers using envelope re-mutation will double-apply (PM-391 reaction-tap +2 flicker). For in-page state-change render functions called from multiple bus events: the renderer should be idempotent over the no-change case (skip DOM rewrite when current DOM already matches incoming state). Earned PM-401 — `renderRecentCheckins` same-layout guard: before innerHTML rewrite, check if existing DOM cards have same IDs in same order, surgical update if yes, full rebuild if no. `innerHTML` rewrite destroys child `<img>` elements forcing re-decode even with hot HTTP cache — prefer surgical DOM patches over innerHTML rewrites when state changes don't affect layout/identity.

#### §23.43 — Bus migration discipline — whole-tree audit method

Pre-flight audits run against the whole tree, not a hand-picked subset. Audit-count discipline counts source-code call sites unconditionally regardless of runtime branch (`if (!VYVEBus)` branches still count). Asymmetric / symmetric / mixed fallback per surface classified by what was firing pre-bus at that publish site. Race-fix mechanics: publish-before-fetch for initiating writes; publish-after-res.ok for queue-drain confirmations. Server-side cron-driven writes are out of scope for Layer 1c. Layer 1 cache-bus campaign closed PM-44; Layer 2 opens with PM-45 (Supabase Realtime-to-bus event bridge).

#### §23.44 — Script-tag inclusion auditing during new-feature ship (PM-304)

A new feature lands runtime code on one page but the script tag is missing from a CONSUMING page. The consumer's `window.VYVEModuleName.foo()` silently bails because the global is undefined; defensive guards swallow it. Failure mode is invisible until tested on a surface the original wiring didn't think to test. Audit: `grep -l 'VYVE<Name>' *.html` then check each for the bridge script tag. Apply to every module surface added or removed by a refactor. Sibling: §23.51 (bridge-load coverage audit).

#### §23.45 — Catalogue imagery is DB-driven, nullable, with onerror fallback (PM-190)

Tables driving content (service_catalogue, replay_playlists, replay_videos, mind_videos, persona_welcome_copy, how_to_resources, podcast_platforms, checkin_questions) include nullable `image_url` / `icon_url` / equivalent. Render path uses `onerror` fallback to gradient placeholder. Lewis edits via Supabase Studio; devices pick up within 5min via `CATALOGUE_FRESH_TABLES`. Eighth application as of PM-384.b — pattern muscle-memorised, new catalogue ships need no new doctrine.

#### §23.46 — Catalogue schema changes require an invalidation-key bump (PM-190.c)

Bump `CATALOGUE_INVALIDATION_KEY` in `sync.js` on every catalogue schema change. Devices wipe and re-pull the catalogue table on next session start. Lockstep with the catalogue migration name.

#### §23.47 — Counters render truth, not loading placeholders (PM-186)

Empty state shows nothing (or honest empty copy), never spinner-as-permanent-state. Live carousels paint placeholders only when LIVE_PLACEHOLDERS data is real placeholder content, not "Loading…". Earned PM-186; reinforced in every hub redesign since.

#### §23.48 — Connect freshness model (four patterns) (PM-188)

Four patterns to choose from for surfaces that need cross-device fresh data: (1) hardcoded recurring catalogue (sessions-data.js — synchronous, always-present), (2) Dexie-synced + bus repaint (most member-data surfaces), (3) `_kv` cache slot with TTL + boot prefetch (Connect feed preview, 90s freshness window — PM-392), (4) Realtime echo via bus bridge (Layer 2 — PM-45 territory). Pre-PM-188 connect-feed always hit EF on tab-in; post-PM-188 cache-first paint with EF as fallback. Doctrine reference: `playbooks/connect-freshness.md`.

#### §23.49 — Specs cross-checked against live schema before lock (PM-187)

Trust Supabase over the brain on schema. Before composing any RLS migration / data shape spec from an audit recommendation, run `information_schema.columns` pre-flight against the target table. Same applies to GitHub repos, secrets timestamps, cron job lists. The brain may have a stale view. Cheap to verify, expensive to skip.

#### §23.50 — body:logged aggregator + cross-pillar event taxonomy (PM-382)

Aggregator events (`body:logged`) fire from each per-strand publisher (workout/cardio/movement) so cross-pillar subscribers (Connect tile counters, achievements eval) repaint without subscribing to N specific events. Discriminator `{kind}` informational only — subscribers unconditional unless they need per-strand filtering. Critical placement rule: don't double-publish from legacy dual-write sites (movement.html L637 retired with PM-383). Bus events that look page-local (`mind:*`, `body:*`, `connect:*`, `replay:*`, `live:*`) are ecosystem-wide — before "rewire subscribers to new name", run repo-wide search. PM-319 found 12 files using `mind:logged` from one parallel session's perspective; talk-first option-A retire-decision reversed mid-build to dual-publish. Decide retire-vs-coexist only AFTER the search.

---

### CSS / UX discipline (§23.51-§23.60)

#### §23.51 — Bridge-load coverage audit before claiming any per-surface wire complete (PM-364)

When wiring a cross-cutting capability behind a JavaScript bridge (window-namespaced shim with defensive `if (window.X)` guards): per-surface call-site wire is only half the work. The other half is verifying the bridge `<script src=>` tag is loaded on every target surface that can fire the wire. Defensive guards mean missing bridge-load is silent. Audit: grep bridge filename across root-level HTML, count load sites, cross-reference against trigger set. If bridge-load is a proper subset of trigger set, the wire is incomplete. PM-363 wired haptics globally to achievements `showNext()`; PM-364 prep found haptics.js loaded on 3/41 surfaces.

#### §23.52 — Hub-page hero doctrine (PM-216 → PM-226)

Photographic heroes on hub pages follow a single doctrine. Full spec in `playbooks/hub-page-hero-doctrine.md` — load before touching any hub-page hero. Invariants every hero ship honours:

- Hero is `position: fixed` with longhand `top:0; left:0; right:0; height: max(280px, 46vh)`. No `inset:0` shorthand (silently fails on WKWebView).
- Hero is body-level, not inside `<main>`. Parent stacking contexts interfere with fixed pinning on WKWebView.
- `translateZ(0)` + `will-change: transform` on hero for compositor promotion.
- `background-image:url()` not `<img>` for synchronous paint from image cache.
- `theme.js` always loaded before closing `<head>`.
- `§8` paired-values invariant: hero height ↔ main padding-top must move together (e.g. `max(250px, 35vh)` on both, or `calc()` parity).
- Dedicated `§23.53` fade band element (80px, 3-stop rgba) bridges photo into solid `var(--bg)` panel below.
- Both themes use the same structural composition — dark mode flows photo into dark teal panel, light mode flows photo into cream panel.

#### §23.53 — Hub-page photographic hero seam: scrolling-fade recipe (PM-238 → PM-244)

Dedicated fade-band element with `translateY(-100%)` sits at the seam between fixed hero and scrolling panel. 80px tall, 3-stop linear-gradient from `rgba(10,31,31,0)` → `rgba(10,31,31,0.85)` → `rgba(10,31,31,1)` on dark, mirror with `(240,250,248,...)` on light. Avoids the visible seam between WKWebView's fixed-positioning composition and scroll-panel content.

#### §23.54 — When Dean says "body" he means `exercise.html` (PM-252)

There is no body.html file. exercise.html serves as the Body / Physical pillar hub. Don't ask; substitute. Hub-page work referencing "body" mirrors mind.html and connect.html structures.

#### §23.55 — Hub-page doctrine adherence: audit before improvising (PM-267b)

Audit against `playbooks/hub-page-hero-doctrine.md` + §23.52 + §23.53 before improvising on a hub-page hero. Read the reference impl markup-first not CSS-first — exercise.html treats the eyebrow as the page name and the headline as a small tagline, not the reverse.

#### §23.56 — CSS-only iterations that fail on device should trigger a hook-path audit (PM-283)

Not another CSS pass. PM-280/281/282 iterated CSS for focus-page done-state composition; bug wasn't in CSS — `body.is-completed` was only added inside `focus-shell.complete()` (post-Save path), not on the page-reopen guard path. Three rounds of correct CSS spec, none of which ran because the body class wasn't being added in the path Dean was looking at. Audit the activation hook before iterating styling.

#### §23.57 — Converting mockup HTML into a portal page: diff against a known-good portal page across the FULL checklist

Not just the presenting symptom. Theme tokens, nav.js wire, sw.js precache, bus subscribe, Dexie read path, optimistic-first writes, persona context, light/dark parity, safe-area-inset, viewport zoom disabled — full checklist every time.

#### §23.58 — Fixed-position modal controls in iOS chrome zones must use safe-area-inset (PM-351)

Any fixed-position interactive element within the top 48px or bottom 48px of viewport on a fullscreen modal/overlay must use `env(safe-area-inset-*, 0px)` in positioning, not bare px values. Fallback parameter (`, 0px`) mandatory. Pattern: `top: calc(env(safe-area-inset-top, 0px) + 12px)` etc. Hit-target minimum 48px (Apple HIG 44pt min; 48px gives margin against rounded-corner clipping).

#### §23.59 — VYVE is a native app, not a browser: suppress web-page tells (PM-250)

Audit and suppress every WKWebView/Chrome default that leaks "I am a web page" feeling: viewport zoom disabled, text selection disabled where it doesn't add value, pull-to-refresh disabled, scroll-bounce suppressed where it surfaces blank background, copy-paste callouts off on non-text surfaces, browser context menus suppressed via `oncontextmenu="return false"` where they don't add value.

#### §23.60 — bash_tool `cd` does not persist across calls (PM-251)

Each tool call is a fresh shell. Use absolute paths or `cd ... && cmd` in a single call. Don't assume working directory carried over.

---

### Diagnostics / patch budget (§23.61-§23.70)

#### §23.61 — When two patches in a row don't move the diagnostic needle, stop patching (PM-327)

Earned at high cost — 4 patches in ~90 minutes failed to fix `ready: false` on the live tracker, all addressing surface symptoms while the bug was in the WKWebView ↔ YouTube postMessage bridge invisible to on-page debug strips. Rule: if two consecutive patches both ship cleanly, both advance some diagnostic, but the primary failure mode does not change, STOP. Don't ship a third. Surface to Dean explicitly: "Two patches haven't moved the needle. The bug is likely outside the layer I can see from the debug strip. We need [Safari Web Inspector / Android adb / Charles proxy / device console capture]." Concrete escalation: Safari Web Inspector → Develop menu → \[iPhone name\] → live page; `window.addEventListener('message', e => surfaceToDebugStrip(e))`; `capacitor.config.json` inspection; bypass the IFrame API entirely (Visibility API timer + manual CTA) when bridge is broken and trial doesn't justify deep WKWebView debugging.

#### §23.62 — Re-read campaign specs before writing code in their domain (PM-269 → PM-270)

Brain-load is not sufficient. The spec docs in `/playbooks/` carry the worked-example detail brain-load summaries strip. Read before writing.

#### §23.63 — Pre-bundle debug surface gating discipline (PM-409)

Before any production bundle commits, every debug surface on the member-facing app must be either (a) hidden behind `localStorage.vyve_dev_panel_unlocked === '1'`, (b) hidden behind a URL parameter that can't be set in the native app (`?debug=`-style — safe because Capacitor has no address bar), or (c) deleted. "Debug-labelled but technically harmless" UI is not acceptable; the label is the problem. Canonical pattern: one flag, multiple surfaces, one gesture (5 taps in 3 seconds on a benign UI element). Audit signal at scan time: repo-wide grep for `force[\s-]*refresh`, `reset.{0,20}(achievement|cache|local|dexie|data|member)`, `\?debug=`, `dev[\s_-]?panel`, `developer[\s_-]*tools?`, `diagnostic`. Console logging is exempt (not member-visible; preserves diagnostic trail). Bundle prep is the forcing function — debug surfaces drift in by predictable mechanism: "I'll hide it once X is proven" then attention moves to Y, surface stays.

**Sharpening (PM-424, candidate):** gating a debug surface behind a flag must guard the **render function's entry**, not only the call site that opens it. PM-418 gated `mind.html`'s open-time `renderDebugStrip()` call but left a `setInterval(…1000)` poller calling it unconditionally — the strip wiped on open then re-leaked within ≤1s on the next tick. Guarding the function entry (`if flag !== '1' return`) kills every path at once: open, poller, and future callers. Audit signal when gating any overlay: grep for **every** caller of the render fn. Promotes to a numbered sub-rule on second occurrence.

#### §23.64 — Dean tests on the native iOS app, not a browser

NEVER tell Dean to "navigate to URL X" or use `?query=params` in an address bar — he cannot, there is no address bar. For testing tell him which in-app page to open (Home, Body, Mind, Connect, More → page name). Debug flags requiring URL params are Claude's problem to solve via in-app trigger (settings toggle, long-press, localStorage, build flag), not Dean's problem. App refresh = force-quit + reopen via iOS app switcher.

#### §23.65 — Live device-walk testing scheduling (PM-304 walk lesson)

When testing `*-live.html` against a real broadcast, schedule `calendar_occurrences` with `starts_at = now()` or `now+30s`, NEVER `now+10min`. Skip PRE_ROLL — page should be trying to be LIVE the moment Riverside push hits YouTube. State-machine bug logged: LIVE gates on clock-time only, so YouTube `enableAutoStart` already-live doesn't flip page state until starts_at clock passes. Broadcast-live should override the clock — architectural fix needs a YT broadcast status probe.

**RESOLVED PM-445.** `broadcast-status` EF (OAuth `liveBroadcasts.list?part=status`, verify_jwt, returns `{live:bool|null}`) + session-live.js `probeBroadcastStatus()`/`effectiveState()` layered over the clock machine. broadcast-live overrides the clock; holds PRE_ROLL until confirmed live; JUST_ENDED on live->not-live; holds LIVE past `ends_at` on over-run; fails safe to clock-only on probe error (== prior behaviour). player-tracker + wake-lock bind on EFFECTIVE LIVE only. `live:true` branch still needs a real-push device walk to confirm.

#### §23.66 — session-publish EF: enableAutoStop=false (PM-310)

v1 had it true which auto-killed broadcasts at scheduled_end_time. From v5 (PM-439) `enableAutoStart`, `enableAutoStop`, and monitorStream are ALL false — autostart is dead on this channel, so `session-publish` pre-creates only and the runner (`vyve-live-runner.py`) explicitly transitions `ready->live` (after confirming the bound stream is active) and `live->complete` (on push end). Future safety-net: a cron could complete any broadcast still live >2hr past scheduled_end_time as unattended-cleanup.

#### §23.67 — RLS auth functions must be wrapped in (SELECT …)

Bare `auth.email()` / `auth.uid()` / `auth.role()` / `auth.jwt()` in any RLS policy `USING` or `WITH CHECK` is a severe perf bug — functions are `STABLE` not `IMMUTABLE`, so without subquery wrap Postgres re-evaluates them once per row AND inlines them into the query plan. With `(SELECT auth.email())`, Postgres treats result as InitPlan and caches it for the whole query. Wrap on every new policy from creation. Pre-flight any new policy with `SELECT * FROM pg_policies WHERE tablename = '...'` and check `qual` / `with_check` — fix before deploying. Multiple permissive RLS policies for the same command are OR'd and double-cost — when an `ALL` policy already covers all relevant commands, do NOT add per-command policies on top.

#### §23.68 — Trigger functions writing to RLS tables must be SECURITY DEFINER

`SECURITY INVOKER` triggers cannot write to RLS-protected tables. Also: `information_schema.triggers` hides triggers from read-only users — use `pg_trigger` joined to `pg_class` for verification. `session_replication_role = replica` does not work from service-role EF connections; use explicit `ALTER TABLE DISABLE/ENABLE TRIGGER` pairs instead. `SUPABASE_APPLY_A_MIGRATION` silently partial-executes — for reliable trigger creation use single statement per call via `SUPABASE_BETA_RUN_SQL_QUERY` with `read_only:false`. plpgsql composite-type gotcha: shared trigger functions on multiple tables must not reference `NEW.<col>` for a column existing only on some — use `to_jsonb(NEW) ->> 'col'` for defensive cross-table access.

#### §23.69 — Notification routing — every push carries a route

Every notification (in-app, web push, native push) carries `data.url`. `member_notifications.route` (TEXT) populated on every insert; VAPID web push payload `data.url`; APNs payload `data.url`; toast click handler in `/achievements.js` reads `earn.route`. SW posts `{type:'notification_navigate', url:...}` to existing tabs so a member already on the destination routes in-place via `parseHashRoute()`. Single source of truth: `send-push` v13 reads `input.data.url` and writes to `member_notifications.route` so web/native/in-app stay lockstep. Currently routed types: `habit_reminder` → `/habits.html`, `checkin_complete` → `/wellbeing-checkin.html`, `streak_milestone_*` → `/engagement.html#streak`, `achievement_earned_<slug>_<tier>` → `/engagement.html#achievements&slug=<slug>&tier=<tier>`. SW push handler requires `self.addEventListener('push', e => e.waitUntil(self.registration.showNotification(...)))` — without it, payload arrives, decrypts, and is discarded silently. SW notificationclick must read `data.url` then `clients.matchAll` + `client.focus()` / `clients.openWindow()`. Web Crypto: ECDSA private keys must be imported as `'jwk'` or `'pkcs8'`, never `'raw'` — Deno enforces strictly and throws `Invalid key usage` (silent under `try/catch`).

#### §23.70 — Push delivery state — three channels, one working

**APNs (iOS):** live and shipping via `push-send-native` v5+. Auto-revokes 410/400 BadDeviceToken. **FCM (Android):** `register-push-token` accepts and stores Android tokens but `push-send-native` explicitly skips them — Android members receive in-app rows + correct tap routing but no system banner. Standing backlog item. **VAPID web push:** retired; `push_subscriptions` table dormant since 15 April. `send-push` v12+ still includes the web fan-out leg but it's a no-op for current members. Don't invest further in VAPID; FCM is next push priority.

---

### Brain / portal hygiene (§23.71-§23.76)

#### §23.71 — Brain content NEVER goes into vyve-site (PM-13b)

vyve-site is private as a repo but main branch is served via GitHub Pages at `online.vyvehealth.co.uk`. Any file at `brain/`, `tasks/`, or root-level operational markdown that lands in vyve-site is publicly fetchable on the open internet within ~30s of commit. Brain commits go to `VYVEHealth/VYVEBrain` only. Before any `GITHUB_COMMIT_MULTIPLE_FILES` call, verify `repo` argument matches file paths: site code → `vyve-site`, brain markdown → `VYVEBrain`.

#### §23.72 — Every vyve-site commit bumps sw.js cache key + vbb-marker in BOTH index.html AND settings.html

Same commit. Build number permanently visible on Settings page (PM-299). Stale marker = Dean can't verify the update landed. Pick next monotonic integer above live HEAD at commit time per §23.21. Cache key suffix `pmNNN-<slug>-a` lockstep with vbb-marker bump. Memory invariant.

#### §23.73 — SW HTML caching strategy is stale-while-revalidate, not network-first

Cached HTML returns instantly from CacheStorage (~5ms), background `fetch()` repopulates the cache in parallel for the next navigation, first-ever-visit falls through to network. The cache-version bump on every deploy is the eviction trigger — without it, SWR can serve arbitrarily-stale HTML. SW install must use `fetch(url, { cache: 'reload' })` followed by `cache.put` per URL, never `cache.addAll()` and never default-mode `fetch()` — GitHub Pages CDN lag (5-10min typical) means default cache mode installs stale CDN copies into the new SW cache, and stale-while-revalidate then serves them indefinitely. `cache.addAll()` is also all-or-nothing — any single 404 fails the entire install.

#### §23.74 — Cloudflare email obfuscation rewrites emails

On `www.vyvehealth.co.uk`. Wrap emails in `email_off` comment tags.

#### §23.75 — Cross-origin runtime injection on member-facing surfaces is a PF-14c violation

Earned PM-405 audit: wellbeing-checkin.html injected Chart.js from cdnjs at runtime. SW correctly skips cross-origin so offline = blank chart canvas. Audit signal `grep -rn "script.src.*http" *.html` should return zero on member-facing surfaces. Vendor third-party libs locally + add to sw.js precache.

#### §23.76 — sw.js precache audit on every new HTML surface ship

Audit signal: any vyve-site commit adding HTML file in repo root should have sw.js diff in same atomic commit. Earned PM-405 audit — PM-251 + later ships added new HTML surfaces (8 live-broadcast shells + 8 replay-category shells + 4 mind/more surfaces + 2 session CSS files) without sw.js precache additions. Uncached HTML falls back to `/index.html` per SW handler — graceful but premium-feel regression. 22-file precache gap closed PM-406.

#### §23.78 — CHECK constraint write-surface audit before adding to pre-existing tables

**§23.79 — EF deploy never uses placeholder content; collapse multi-file EFs to single self-contained index.ts.** `Supabase:deploy_edge_function` bundles placeholder strings successfully and ships broken code live (it only checks that imported files resolve, not that content is real). NEVER do a two-step "deploy placeholder then fix". Pass real file content in the first call. For multi-file EFs where inlining all files reliably in one tool call is the risk, collapse to a single `index.ts` (strip `./relative` imports, dedupe shared env-var consts, alias any re-exported names) and deploy that one file. Verify post-deploy via `Supabase:get_logs` service=edge-function (boot errors + absence of error-status invocations) — the bash network allowlist blocks `*.supabase.co` so curl-probing the live endpoint isn't available. Earned PM-420 step 4b: a placeholder deploy went ACTIVE as onboarding version 91 with garbage content; caught on review, ~4 min window, no member hit it.

Before adding any CHECK constraint to a table that already has live production write surfaces, audit those surfaces for literal value writes that would violate the new constraint. PM-420 step 4a-pre-1 earned this rule the hard way: added `movement_activities.source` CHECK constraint with new vocabulary (`hk_workout` / `manual_supplement` / `manual_log` / `prompt_tick`) without first grepping for the existing `source: 'manual'` literal at `movement.html:644,931`. Constraint went live → production quick-log writes immediately started 400ing. ~90 second outage before hotfix migration loosened the CHECK to accept both vocabularies.

**Audit procedure:** for any CHECK on a pre-existing table column, run repo-wide grep for the literal old values (`grep -rn "source.*'<value>'"`) across `vyve-site` + EF source. Either rename writers in same atomic commit (preferred) or loosen the CHECK to accept old + new vocabulary during transition (acceptable for soft migrations). Never ship a strict CHECK against a column that has live production writes elsewhere.

The same trap class: any constraint that narrows the set of accepted values for a pre-existing column. NOT NULL on a previously-nullable column, narrower CHECK enums, foreign keys against tables that may have unreferenced strings — all require pre-flight write-surface audit.

#### §23.80 — Ported boot/IIFE blocks call page-local entry functions; grep the destination before shipping (PM-422, candidate)

When copying a page's boot/auth-observer IIFE between portal pages, the entry-function name (`init`, `boot`, the page-specific loader) is page-local and almost never matches the destination file. A copied IIFE calling a non-existent entry function throws an uncaught `ReferenceError` on every page load. It is non-fatal — it kills only the IIFE, so the page still works and it survives review and "works on my screen" — but it fires a `high`-severity `platform_alerts` row on every load for every member, flooding the alert-digest and burying genuine incidents. Earned PM-422: `workouts-notes-prs.js` carried an auth-observer IIFE copied from nutrition.html (comment said so) calling `init()`; that file has no `init()` (it defines on-demand session helpers), so it threw on every workouts.html load, live since PM-255, hitting 5+ real members before it was noticed. When porting any IIFE/bootstrap block between pages, grep the destination file for the called function's definition before shipping; if absent, wire it to the real entry point or delete the block. Sibling to §23.44 (script-tag inclusion audit) and §23.57 (mockup→page full-checklist diff). Promotes to hard rule on second occurrence.

**Digest-mapping note (banked, not codified):** the alert-digest commit-mapping heuristic maps an error's endpoint to a vyve-site file and shows that file's last 3 commits as "recent / possibly related." When the bug lives in a *sibling bundled script* (here the error was in `workouts-notes-prs.js` but the mapped file is `workouts.html`), the digest surfaces unrelated recent commits and the AI diagnosis may pin blame on them. Treat the digest's commit attribution as a hint, not a conclusion — always open the actual file/line from the error payload. Revisit if this misleads twice.

#### §23.81 — movement.html renderPlan must route by shape presence, not plan_type (PM-429, PM-431 — HARD RULE)

Movement-surface plans created by the picker (`movement-plans.html startPlan`) carry `weekly_targets` / `prompt_pool` but **never** `weeks[].sessions[]`. movement.html's structured session renderer reads weeks→sessions and bails `if (!session) showNoPlan()` — so a member WITH an active plan sees the no-plan "Choose your plan" CTA and the chosen plan renders as nothing. This is NOT a hydration/Dexie-timing bug (the row is in Dexie instantly via the PM-427 mirror); the renderer silently discards it. **Rule:** `renderPlan` routes on `!hasSessions` (any sessionless movement plan — just_steps AND locked_ramp Foundation/Distance) → the state-aware ring/target layer (`applyMovementState`); only genuinely session-shaped legacy plans take the structured path. Never dispatch by enumerating `plan_type` values — a new picker shape (e.g. a future "interval walk") would silently regress. Earned twice: PM-429 (just_steps bailed) then PM-431 (locked_ramp bailed identically). Sibling to §23.57 (mockup→page checklist): when a render path is copied from a sibling surface (here the workouts session renderer), audit which plan SHAPES the destination surface actually produces before trusting the copied dispatch.

#### §23.82 — A `supabase.rpc()` to a non-existent Postgres function fails silently, not loudly (PM-435, candidate)

supabase-js returns `{ error }` (not a throw) when the named function doesn't exist; an EF fallback that returns a constant on error then masks the bug indefinitely. `certificate-checker` v23 called `get_next_global_cert_number` (never existed — the real fn is `next_certificate_number()`); its `if (error) return 1` numbered EVERY certificate `1` for an unknown duration, only caught when max `global_cert_number` was 2 across 9 certs. **Rule:** when wiring an EF to an RPC, confirm the function exists in `pg_proc` before trusting it; any rpc-error fallback returning a constant is a candidate for hiding a missing-function bug — log the error, don't swallow to a default. Companion pattern (banked): when a value must match a client-side Dexie compute (here the Your Journey progress buckets), express the rule ONCE as a server SQL function (`get_certificate_buckets()`) consumed by both the EF and any backfill, rather than re-deriving it in two languages. Promotes to hard rule on second occurrence.

#### §23.83 — never re-key an existing Dexie store via a version bump (PM-436 — HARD RULE)

Changing a store's `keyPath` (primary key) in a later `db.version(N).stores()` forces Dexie to delete + recreate the object store inside the versionchange transaction. IndexedDB cannot alter a keyPath in place, and iOS/WKWebView mishandles delete-and-recreate-of-the-same-store-in-one-transaction — `db.open()` rejects on any device already holding the prior version's data, db.js falls through to the noop shim (`isEnabled()===false`), and EVERY Dexie-backed surface silently reads empty (0/30 home rings via `loadPillarCounts`, habits.html "no habits assigned") while EF-backed surfaces still paint. Fresh installs are unaffected (clean create, no migration), so it sails through quick tests and breaks ONLY existing-data devices on the next bundle — full member blast radius, silent, looks like data loss. PM-425 did exactly this (`workout_plan_cache` `member_email`→`id`, SCHEMA_V22); every device stuck at on-disk IDB v210 (= Dexie v21; Dexie stores IDB version as schema×10) because the 21→22 upgrade kept throwing. Reverted in PM-436 (`e44b2357`) — wpc back to `member_email`, `db.version(22)` kept as a no-op bump so jammed v21 devices upgrade 210→220 with no store recreate and self-heal on next open. **Rule:** to add/change a primary key, create a NEW store under a new name and repoint sync + reads (phones add a store cleanly), OR do a deliberate two-RELEASE delete-then-recreate (delete the store in one shipped version, recreate in a later one — never both in the same open). Never re-key in place. **Corollary:** a failed `db.open()` must not silently degrade to a confident `0` — distinguish "Dexie unavailable" from "genuinely zero" (graceful-fallback backlog item). Diagnostic: `indexedDB.open(name)` onsuccess → `db.version` (÷10 = Dexie schema version on the device); `VYVELocalDB.isEnabled()===false` + populated server tables = jammed open, not a data problem.

#### §23.84 — mental-health-sensitive video content gated on Phil + on-asset crisis signposting before airing (PM-437 — HARD RULE)

**Scope clarification (PM-663):** §23.84 applies to MEMBER-FACING VIDEO CONTENT only (suicide, self-harm, addiction crisis, bereavement, acute MH territory). It does NOT apply to partner go-live approval. Partner Gate B (status→live) is approved by **Dean + Lewis only** — Phil is not in the partner approval chain. If a partner’s video content is acute MH territory then §23.84 applies to that specific video (Phil gates it), but the partner’s community going live is Dean+Lewis’s call.

Any member-facing video addressing suicide, self-harm, addiction crisis, bereavement or equivalent acute mental-health territory (first instance: Lewis's "Suicide and Men") must NOT be scheduled into the live rotation or seeded to Replays until (a) Phil has clinically signed it off and (b) it carries visible crisis-support signposting (helpline on the asset + in the description). Extends the HAVEN safeguarding bar to video. Recovery-adjacent talks that are not acute (e.g. "Not Drinking Alcohol") may air but get flagged for Lewis's eye. Rationale: member duty-of-care + Sage/enterprise diligence expects this standard.

#### §23.85 — Membership access gate: ONE model, gate on `subscription_status` not `account_type` alone (PM-438 — HARD RULE)

`members.account_type` (`trial`/`paid`/`comp`/`enterprise`) is the **durable identity**; `members.subscription_status` (`active`/`expired`) is the **live access flag**. Access is granted iff `account_type IN ('comp','enterprise') OR subscription_status='active'`. NEVER treat `paid` as unconditionally allowed — a cancelled paid member is `account_type='paid'` + `subscription_status='expired'` and MUST be walled. The client gate (`auth.js` `vyveCheckAccess`, composed after `vyveCheckConsent`) and the DB write-guard (`assert_member_not_expired`, BEFORE INSERT trigger `aaa_membership_guard`) MUST share this exact predicate. Expiry is a **cron flag-flip** (`expire_lapsed_trials`, pg_cron jobid 34, daily 01:00 UTC) — NEVER request-time date math against `trial_ends_at` (keeps the gate cacheable / local-first per §23.12). `comp`/`enterprise` never expire. Conversion happens off-app (App/Play IAP rules): wall → external browser → marketing-site `continue.html` (prefills `VYVE10` £10-off-forever + binds `members.id` as `client_reference_id`) → £10/mo Payment Link → `stripe-webhook` EF flips `account_type→paid` + `subscription_status→active`. The conversion Payment Link MUST be separate from the £20 new-signup link and MUST NOT redirect to `welcome.html` (re-runs onboarding → clobbers returning members).

#### §23.86 — online.vyvehealth.co.uk is unreachable from the sandbox; never judge a portal asset broken from a sandbox 403 (PM-451 — HARD RULE)

The Claude sandbox egress only allows a fixed domain list (github.com, api.github.com, raw.githubusercontent.com, npm/pypi, etc.); `online.vyvehealth.co.uk` and `www.vyvehealth.co.uk` are NOT on it, so curl/fetch to them returns **403 (proxy deny) for EVERY path** — including long-live files like `logo.png`, `sw.js`, `theme.js` that the real app loads fine. A sandbox 403 is therefore NO evidence an asset is missing or that GitHub Pages is broken. To verify a committed asset landed, use the raw GitHub API pinned to the commit SHA (`GET /repos/.../contents/<path>?ref=<sha>` with `Accept: application/vnd.github.raw` -> 200), or have Dean confirm in-app. NEVER re-host or re-commit a portal asset on the strength of a sandbox 403 alone (first instance: PM-451 host-card thumbnails — all 403'd from the sandbox while present in the repo and served to users).

#### §23.87 — Dexie catalogue stores expose `.allFor()`, never `.all()`; a wrong accessor throws and a try/catch silently degrades the surface (PM-455 — HARD RULE)

Tables built with `makeCatalogueTable()` in db.js (e.g. `calendar_occurrences`, `service_catalogue`, `replay_videos`, `mind_videos`) expose `allFor()` (no-arg returns the whole table via `toArray()`), `replaceForMember(null, rows)`, and `upsert` — but NOT `all()`. Calling `.all()` throws `TypeError: ...all is not a function`. When that call sits inside a `try/catch` that returns a fallback (as the PM-453 home carousel did), the surface degrades silently to its fallback with no console error visible to the user — it just shows stale/old content. Always read catalogue stores via `.allFor(null)` (grep an existing consumer — sessions.html `readActiveBroadcasts` is the reference). When adding a try/catch fallback around a Dexie read, log the caught error so a wrong-accessor bug surfaces instead of hiding as "the new code isn't showing".

#### §23.88 — Version-controlled Python that runs on Dean's Mac must be Python 3.9-safe; no backslash inside an f-string expression (PM-458 — HARD RULE)

Dean's Mac runs the Xcode Command Line Tools system `python3`, which is **3.9** (`/Applications/Xcode.app/.../Python3.framework/Versions/3.9/`). The Claude sandbox/container is 3.12, where PEP 701 allows backslashes inside f-string expression parts — so `python3 -m py_compile` in-container does NOT catch a backslash-in-`{...}` that is a hard `SyntaxError` on 3.9/3.10/3.11. The `vyve-live-runner.py` had `f"… {x or '(none found \u2014 …)'}"` and died at import on the Mac. RULE: any `.py` meant to run on Dean's box must avoid backslashes inside f-string expression parts — use a literal Unicode character (`—`) rather than the `\u2014` escape, or pull the string out of the brace. When committing a runner/script, AST-scan FormattedValue source segments for `\` (the 3.12 py_compile won't flag it).

#### §23.89 — launchd LaunchAgents have NO access to ~/Desktop, ~/Documents, ~/Downloads (macOS TCC); keep an agent's working set in a non-protected dir (PM-460 — HARD RULE)

A macOS user LaunchAgent runs outside the interactive Terminal's TCC grant, so it cannot read/write the TCC-protected folders (~/Desktop, ~/Documents, ~/Downloads, iCloud Drive, removable/network volumes), and there is no UI prompt for a background agent — accesses fail with `Operation not permitted` (EPERM) and a RunAtLoad+KeepAlive job exit-loops (`launchctl list` shows `- <n> <label>`). It "works when run by hand" only because interactive Terminal carries the user's grant. RULE: anything launchd runs — the script, its env file, AND its data/media — must live in a non-protected location (e.g. `~/vyve-live` or `~/Library/Application Support/<app>`). First instance: the vyve-live-runner LaunchAgent died on `~/Desktop/Lives` until runner + env + masters were relocated to `~/vyve-live` (PM-460). (Granting Full Disk Access to /usr/bin/python3 or /bin/zsh also works but is a broad grant requiring manual GUI steps — relocation is cleaner and scriptable.)

#### §23.90 — Replay pages MIRROR YouTube playlists; remove a replay at the YouTube source, clearing the DB alone re-syncs (PM-461 — HARD RULE)

The in-app replay surfaces (replay-category.html and the live pages' QUIET state) render from replay_videos + replay_playlists, a CACHED MIRROR of the per-category YouTube playlists (replay_playlists.youtube_playlist_id), refreshed by a daily cron (~03:30). So `DELETE FROM replay_videos` on its own is futile — the next refresh re-pulls whatever is still in the YouTube playlist. To remove a replay: delete it at YouTube (playlistItems.delete to unlink, or videos.delete to remove the content entirely — which also drops it from the playlist), THEN zero the DB mirror for immediate effect (else it clears at the next cron). YouTube creds in Vault (YOUTUBE_OAUTH_CLIENT_ID/SECRET/REFRESH_TOKEN); refresh-token grant -> scope youtube covers videos.delete + playlistItems.delete. Conversely replays APPEAR on their own: vyve-live-runner playlistItems.inserts each broadcast into its category playlist at creation, and the refresh cron pulls it in.

---

### Content / brand discipline (carried)

- **Never "Kahunas"** — product is "VYVE Health app" in member copy.
- **Never "Corporate Wellness"** — not used as tagline or descriptor.
- **Live session badges** — green (`#22c55e`), never red.
- **Gemini imagery** — always append "Colour grade: deep teals and greens, warm highlights, no text, no logos."
- **`team@vyvehealth.co.uk`** is a Microsoft Exchange via GoDaddy mailbox, NOT Google Workspace. MX `vyvehealth-co-uk.mail.protection.outlook.com`. DKIM via `brevo1._domainkey` + `brevo2._domainkey`. Migrate to enterprise tenant post-first-enterprise-contract.
- **Always send pipeline alerts to multiple recipients** — single inbox failure must never blind us to itself. `email-watchdog` TO `deanonbrown@hotmail.com`, CC `lewisvines@hotmail.com` + `team@vyvehealth.co.uk`. Apply to any critical-path automated mail.
- **Pre-launch / staging files in vyve-site root** — "no inbound links + no backend wiring" is NOT sufficient signal a file is orphaned. Some files are staged unlinked from nav awaiting clinical/Lewis/Phil sign-off (e.g. `VYVE_Health_Hub.html`). Never archive or delete a substantial standalone HTML file without confirming with Dean.
- **Website footer** — "VYVE Health CIC" (not "Ltd").
- **Enterprise references** — named prospects not included in brain or investor docs. Use generic language.
- **`members.kahunas_qa_complete`** — dead post-04 May. Do not gate behaviour on it in new code. Backlog item flagged to drop the column.
- **BST timezone bug** — always construct local dates via `d.split('-')` → `new Date(+y, +m-1, +d)` in portal JS. `new Date(dateString)` parses as UTC and drifts by an hour in BST.
- **`esm.sh` unreliable in Deno** — use Deno built-ins (Web Crypto, std library) for crypto.
- **`first_name` location** — `members` table, not Supabase Auth `user_metadata`.
- **iOS Web Push user gesture** — must be triggered from button click, not page load. RFC 8291 AES-GCM encryption mandatory. (Web push retired; rule retained for historical reference if it returns.)
- **Employment Rights Act** — SSP changes 6 April 2026; strongest current economic argument for preventative wellbeing in sales conversations.

---


#### §23.91 — Replays only surface broadcasts with a REAL recorded duration; the broken-autostart back-catalogue is mostly dead (PM-465 — HARD RULE)

Refines §23.90. Pipeline: `session-publish` (cron jobid 27, hourly :05) PRE-CREATES each upcoming broadcast and adds its video to the category playlist (`session_categories.youtube_playlist_id` == `replay_playlists.youtube_playlist_id`, verified identical) — the `playlistItems.insert` is BEST-EFFORT (`playlistOk` logged, never blocks the row). `refresh-replay-videos` reads `replay_playlists`, upserts `replay_videos`, then reconciliation-DELETEs rows no longer in any playlist.

v4 (PM-465) DURATION GUARD: only upsert/seed items with `duration_sec > 0`. A pre-created-but-not-yet-aired broadcast reports `contentDetails.duration = "P0D"` (parses null); a live-but-unfinished one too. Without the guard those surfaced as 0-second replays. They are now held back until the recording finalises, then picked up next run. Verified live: upcoming `URgCwDw4Y2g` ("10 Minute Flow") held back (upcoming_leaked=false).

Cron change: `refresh-replay-videos` moved daily 03:30 → HOURLY at :45 (`vyve-refresh-replay-videos-hourly`, jobid 36; old jobid 26 unscheduled) so replays appear within ~1h of a session ending, not next morning.

Back-catalogue reality (4 Jun): of 21 `youtube_broadcast_id`s on file, only 4 were genuine watchable recordings (today's Yoga Flexibility `9b-xSEfEIKc` + Calming Breathwork `-LanVrrQGPA`, already in playlists; older Yoga `d-dNe6W-o4I` 51m + Mindfulness `24JKB3ufM4k` 18m48s). The rest: 10 deleted from YouTube, 5 zero-duration (P0D) shells, 1 stray PUBLIC "Big Buck Bunny" test (`aqz-KE-bpKQ`), 1 dev-test "PM-327 Device Walk" (`JEFNPGKhQqY`). 16 junk broadcast_ids NULLed in `calendar_occurrences` (the 10 deleted + 5 P0D + Big Buck Bunny); genuine + legit-upcoming + the dev-test record kept.

Tool: `replay-playlist-backfill` EF (verify_jwt:false, `?dry=1` for report-only) — idempotent curated backfill; eligibility = on-YouTube + privacy `unlisted` + real duration + title NOT `/(pm-\d)|(device walk)|(big buck bunny)/i`. Used to add the 2 genuine older recordings. `replay_videos` = **31 live (12 Jun 2026)** — grew via the YouTube DELETE-NOT-IN reconciliation as real replays were published; the "= 4 zero junk" figure was the post-cleanup moment only.

#### §23.92 — Frequently-changing media lives in Storage + DB pointer, never bundled repo assets; warm-on-open + SW-SWR cache makes it local-fast (PM-471→474 — HARD RULE)

Content that changes on a live cadence (live-session thumbnails, any future per-session/per-host imagery) must NOT be committed as /assets/* files in vyve-site — those freeze into the binary at bundle time and can only change via an OTA. Instead: store the bytes in a Supabase Storage public bucket and point a DB column (calendar_occurrences.image_url) at the Storage public URL. To keep it as fast as a bundled/local asset without the freeze: (1) a warmThumbnailPool()-style on-open background prefetch of the distinct URL pool (new Image().src, idle-deferred, deduped) — cheap because the pool is small/fixed even as the schedule churns; (2) a sw.js stale-while-revalidate branch scoped to the Storage origin/path, writing a DEDICATED cache that is added to the activate PRESERVE set so it survives app-shell deploys (mirror the member-avatars block exactly — vyve-avatars-v1 / vyve-session-thumbs-v1 / vyve-drive-thumbs-v1 are the three preserved runtime caches). Net: download-once, persist on-device (Cache Storage), instant + offline + auto-updating, no bundle, no OTA. Dexie is for structured data; Cache Storage is the equivalent local-first store for binary media — do NOT stuff image bytes into Dexie. Thumbnail model on calendar_occurrences.image_url is hybrid per-host + per-type: <host>.jpg for host photos, pilates.jpg / stretching.jpg for type series (resolves the old type-vs-per-host open call). Seed Storage from GitHub-pinned bytes via a one-shot EF using LEGACY_SERVICE_ROLE_JWT (§23.7) invoked over pg_net (bash can't reach *.supabase.co, §23.86).


**Now load-bearing (PM-569): iOS members are bundled as of 1.7 live, so any `/assets/*` media committed into vyve-site genuinely freezes for the iOS cohort until an OTA — this rule is live, not hypothetical.**

#### §23.93 — Habit autotick is Dexie-first/instant; server backfill anchored to first-engagement; backfill rule UNIFORM across B2C/B2B (PM-477 — DOCTRINE, build pending)
The auto-tick must fire from local/Dexie the moment HealthKit loads on open — network never gates the tick (server is reconciler + cross-device truth; JS<->SQL parity). History backfill of habit ticks is anchored to FIRST GENUINE engagement (earliest real VYVE activity), not signup — a dormant-since-signup account gets today forward only, never a retroactive flood. The backfill rule is the SAME for individual and corporate: never fork it to inflate a corporate engagement number — inflation poisons the exact metric enterprise buys/renews on, sets a fake-high baseline, and detonates on cross-check; the first-engagement anchor already lets genuinely-engaged-then-lapsed staff backfill legitimately. HealthKit activity samples already backdate via promotion -> cardio/workouts/weight; this brings habit completion onto the same model. No HK background delivery — foreground-only sync, backfill-on-open.

#### §23.94 — `vyveGetJWT` is the only correct way to get a JWT in portal pages; hard redirects on token failure belong only in `vyveInitAuth` (PM-540/541 — HARD RULE)

All portal page code that needs a JWT MUST call `window.vyveGetJWT()` (defined in `auth.js`). It calls `getSession()` first; if the access token is expired, silently calls `refreshSession()` and returns the fresh token — invisible to the member. Returns `null` only when the refresh token itself is gone (days of inactivity). NEVER call `vyveSupabase.auth.getSession()` directly in page code for this purpose — it does not refresh and will return a stale token that causes 401s on RLS-gated queries. NEVER redirect to login from a per-request JWT fetch (`vyveGetJWT` does not redirect). The hard redirect lives ONLY in `vyveInitAuth` on cold boot. On a `null` return from `vyveGetJWT`, page code may redirect to login with `VYVE_RETURN_TO` set — but a failed page load (e.g. notifications empty state) should show an error state, not force a logout. Supabase session config: `sessions_timebox: 0`, `sessions_inactivity_timeout: 0` (never force-logout). Access token JWT expiry stays 1hr (correct — refresh is silent). Earned from PM-540: habits.html fired 3 parallel RLS queries with an expired access token, generating 3 simultaneous `critical` incidents for one member's normal hourly token expiry.

#### §23.104 — Every SECURITY DEFINER function defaults to service_role only (PM-564 — HARD RULE)

Every `SECURITY DEFINER` function in `public` must `REVOKE EXECUTE FROM PUBLIC, anon, authenticated` unless it is deliberately member-callable. The Postgres default grants EXECUTE to PUBLIC on function creation — this is wrong for SECURITY DEFINER functions and must be corrected at creation time. Member-callable functions that accept an email/id parameter must self-scope: `IF auth.role() <> 'service_role' THEN p_email := auth.email(); END IF;` — prevents authenticated-role IDOR while keeping EF service-role calls working (where `auth.email()` is NULL). Audit signal: `SELECT proname, proacl FROM pg_proc JOIN pg_namespace n ON n.oid=pronamespace WHERE n.nspname='public' AND prosecdef AND proacl::text LIKE '%anon%'` — any hit is a violation. Earned PM-564 (Tier 0/1 remediation of 21 functions, 2 CRITICALs among them).

#### §23.105 — Never use `current_setting('app.*', true)` for auth headers in cron job commands (PM-568 — HARD RULE)

Cron job commands must NOT build an `Authorization: Bearer` header from `current_setting('app.service_role_key', true)` (or any `app.*` GUC). The setting is null by default and `ALTER DATABASE … SET app.*` is blocked on Supabase Pro, so the header silently resolves to `Bearer ` (empty) — and any `::jsonb` cast on a header literal built that way throws `invalid input syntax for type json` on every tick (this broke `session-reminder-cron` + `process-scheduled-pushes`; the `jsonb_build_object` jobs failed silently with empty tokens). Embed the service-role JWT literal directly inside `jsonb_build_object(...)` instead — no `current_setting()` dependency. If the key is ever rotated, rewrite the affected job commands in one SQL block via `cron.alter_job()`. Earned PM-568 (9 cron jobs broken simultaneously). (Companion: §23.7 — the JWT-format `LEGACY_SERVICE_ROLE_JWT`, not the rotated `sb_secret_*` value, is what any JWT-verifying callee needs.)

#### §23.106 — Bundled iOS cohort has no proven delivery channel; a verified Capawesome OTA is the gating capability (PM-569 — HARD RULE)

As of iOS 1.7 (live 2026-06-09, server.url removed), iOS members are pinned to the vyve-site SHA baked into the binary. The ONLY fast path to change anything for them is a Capawesome OTA (app `f9961f66` / prod channel `89e12796`) — and that path has NEVER been exercised end-to-end. Until one OTA bundle is pushed and verified landing on a real member device, the sole way to ship an iOS member-facing fix is a full App Store resubmit (multi-day review per cycle). Consequences to keep front-of-mind every session until resolved: (1) a vyve-site commit does NOT reach iOS members — never tell Dean "members will see this in 2-15min" for iOS; that's Dean's server.url view only. (2) Verifying a build via the Settings vbb-marker confirms Dean's cohort, not iOS members. (3) Any urgent iOS member-facing bug is currently unshippable without store review — treat iOS member-facing regressions as high-severity accordingly. A verified OTA push is the top native priority, ahead of new features, and a hard pre-Sage gate. Android 1.0.6 is now live too (approved 9 Jun, PM-573) — the gap applies to the Android cohort as well; once members update, the entire installed base is bundled/frozen with no OTA path. (§23.105 now filled above — PM-568 cron-auth rule back-filled PM-603.)

#### §23.107 — Why the Capawesome OTA has never worked: no sync/ready in the shell (PM-571 — HARD RULE)
**RESOLVED for 1.8+ (PM-600, PM-602).** `live-update.js` now ships in the vyve-site web shell with `LiveUpdate.ready()` (unconditional, rollback protection), `LiveUpdate.setChannel({ channel: 'production' })`, and `LiveUpdate.sync()` (session-guarded, fires 3s after boot). Native-guarded IIFE — no-op on server.url dev shell and web. iOS 1.8 + Android 1.0.7 both bundle this wiring. **The §23.106 canary push must target 1.8/1.0.7, not 1.7/1.0.6.** Channel name is `production` (not the UUID `89e12796`). `CAPAWESOME_TOKEN` is in vyve-site GitHub Actions secrets; `ota-deploy.yml` workflow is ready to trigger once 1.8 installs on a real device.

#### §23.108 — vyve-capacitor is SPM, not CocoaPods: open App.xcodeproj (PM-571)
**The Capacitor iOS project uses Swift Package Manager (`Package.swift`), so there is NO `App.xcworkspace`. Open `ios/App/App.xcodeproj` directly — `open ios/App/App.xcworkspace` fails "does not exist". CocoaPods-era Capacitor used the workspace; this project does not.**

#### §23.109 — every explicit PostgREST `select=` on a member-scoped activity table MUST include `id` (PM-601 — HARD RULE)

The Dexie merge-not-wipe `replaceForMember` (§23.43) keys incoming rows on `r.id`. If a hydrate's `select=` column list omits the primary key, PostgREST returns rows with no `id`; every row collapses onto a single null-keyed Dexie slot and **all but the most-recent day silently vanish** from the local store. No error is thrown — the only symptom is a client-computed value (engagement score, streak, counts) reading low versus server truth. Root-caused as Kelly's engagement score showing 74 vs server 83: `daily_habits` was the one activity table with a hand-written `select=member_email,activity_date,...` that dropped `id` while every other table used `select=*`. Fix was adding `id` to the select. **Rule:** prefer `select=*` for member-scoped activity tables; if an explicit column list is required, `id` is non-negotiable and the first column. When auditing a "client number doesn't match server" bug, check the hydrate select for a missing PK before anything else.

#### §23.110 — CURRENT FRONT is a shared single block; never rewrite it from an in-context template (PM-573 — HARD RULE)

The CURRENT FRONT block is overwritten by every session close. A session holding a stale in-context copy of the front, then regenerating the whole block to describe its own work, silently reverts other sessions' front edits. Happened repeatedly in one day: the PM-571/572 closes reverted both PM-568's cleared `session-reminder-cron` WARN and PM-569's deployment-flip line. **Rule:** when updating CURRENT FRONT, re-fetch `master.md` fresh immediately before the edit (§23.21/24/25 fresh-HEAD discipline applies to the front too) and edit its lines surgically / merge — never regenerate the whole block from memory or an earlier-in-session snapshot. Standing facts (deployment model, open WARNs) are OWNED by durable §-sections (§5/§23); the front only mirrors them.

#### §23.111 — Any tracker writing to a watch-time/view table MUST also call `log-activity`, or it is invisible to every rollup (PM-575 — HARD RULE)

The rollup pipeline (`rebuild_member_activity_daily_incremental` → `member_activity_daily` → `member_stats`) reads ONLY from `member_activity_log`. A client tracker that writes straight to a per-event table (`session_live_views`, `replay_video_views`, or any future equivalent) without also firing a `log-activity` call is silently absent from `member_activity_log` — and therefore from all rollups, `member_stats`, dashboards, Command Centre analytics, and achievements. Symptom: counts read 0 in every aggregate while the raw table has rows. `player-tracker.js` / `replay-tracker.js` POST `{type, activity_date}` to `log-activity` on first qualifying write (`isInsert=true`), JWT from `session.cachedJwt`; replay/session view types bypass log-activity caps so they POST direct to `/rest/v1/member_activity_log` where needed (member-self-insert RLS). Rule: every new view/watch-time table needs its tracker wired to the rollup on first write, same commit. (Originally mis-numbered §23.107 in the PM-575 changelog — canonical number is §23.111.)

#### §23.112 — `www/` is NOT auto-synced from GitHub; clone fresh before every native bundle build (PM-557 — HARD RULE)

Capacitor bundles whatever is in `www/` at build time. It is not kept in sync with the `vyve-site` repo. Before every iOS/Android bundle build: `rm -rf www && git clone --depth 1 https://VYVEHealth:<GITHUB_PAT_CLAUDE>@github.com/VYVEHealth/vyve-site.git www` (PAT from Supabase Vault, §23.27). Never assume `www/` is current — a stale `www/` ships an old web shell into the binary with no error. (Originally §23.95 in the PM-557 changelog.)

#### §23.113 — Android CLI bundle builds require Java 21 (PM-557 — HARD RULE)

`./gradlew bundleRelease` for the Android AAB requires `export JAVA_HOME=$(/usr/libexec/java_home -v 21)` first. Java 21 = `temurin@21` (brew). Java 17 and Java 26 both fail the build. (Originally mis-numbered §23.94 in the PM-557 changelog — collided with the `vyveGetJWT` rule; canonical number is §23.113.)

#### §23.114 — Achievement toasts must not fire while `vyve_seen_home` is unset (PM-554 — HARD RULE)

During the first-run home tour, achievement toasts must be suppressed until `localStorage.vyve_seen_home` is set, then retried ~3s later. `showNext()` is the single chokepoint to gate. A toast firing mid-tour collides with the spotlight overlay. (Originally §23.97 in the PM-554 changelog.)

#### §23.115 — `firstrun.js` `lockBody()` must always carry a 10s auto-release timer (PM-554 — HARD RULE)

Any body-lock in `firstrun.js` must arm a 10s auto-release timer at lock time so a page can never be permanently frozen if the tour logic stalls. Never call `lockBody()` without the safety timer. (Originally §23.98 in the PM-554 changelog.)

#### §23.116 — Bump the JS query-string version in the HTML `<script src>` on every JS file update (PM-585 — HARD RULE)

Editing a `.js` file is not enough — browsers (and the bundled web shell cache) serve the old file until the `?v=` query string on its `<script src>` tag in the consuming HTML changes. Bump it on every JS change, same commit. Companion to the vbb-marker discipline (§23.72). (Originally §23.101 in the PM-585 changelog.)

#### §23.117 — Never send explicit `null` for a NOT-NULL-with-default column; coerce to the default (PM-607 — HARD RULE)

`members.weight_unit`/`height_unit` are NOT NULL but carry DB defaults ('kg'/'cm'). A Postgres column default only applies when the column is **omitted** from the INSERT — sending an explicit `null` overrides the default and triggers a NOT-NULL violation that fails the whole row. onboarding v95/v96 sent `weight_unit: d.weightUnit || null`, so any onboarding payload missing the unit hard-failed at writeMember (locking the paid member out). v97 fix: coerce to the default in code (`d.weightUnit || 'kg'`), never `|| null`. Audit query for the wider trap: NOT-NULL columns without a default — `SELECT column_name FROM information_schema.columns WHERE table_name='members' AND is_nullable='NO' AND column_default IS NULL` (today: only `email`, which is correct).

#### §23.118 — Onboarding member-write must be resilient: a missing optional answer never locks a member out (PM-607 — HARD RULE)

A paid member who completed the questionnaire must always get an account. The full `writeMember` insert is all-or-nothing, so any single malformed/missing optional field would otherwise sink the whole signup. v97 pattern: on strict-insert failure, retry once with a minimal guaranteed-valid `core` payload (email, first/last name, persona, persona_reason, welcome recs, onboarding_complete, subscription_status, weight_unit/height_unit defaults, exercise_stream, life_context, cert counts) and fire a `writeMember_core_fallback` team alert for later backfill. Only a genuinely broken record (no email) is allowed to fail. Principle generalises: optional questionnaire fields coerce to safe defaults, never to explicit null on a NOT-NULL column.

#### §23.119 — Consent-version columns are stamped server-side by a trigger; bump the `'v1.0'` constant when a policy version changes (PM-617 — HARD RULE)

`members.privacy_version`/`health_consent_version` must never be NULL once consent is recorded — enterprise/Sage consent-audit needs to know which policy era a member agreed to. PM-603 added the columns + backfilled existing consenters `'pre-versioning'` but never wired the write path, so post-12-Jun gate consents landed NULL (consent-gate.html stamps `terms_version='v1.0'` but omitted privacy/health). Because native members run **bundled** builds, a client gate fix can't reach the installed base (§23.106) — so the authoritative stamp is a `BEFORE INSERT/UPDATE` trigger `trg_default_consent_versions` on `members` (`public.default_consent_versions()`): fill-null-only (never overwrites history), `privacy_version='v1.0'` when `privacy_accepted_at` set, `health_consent_version='v1.0'` when `health_data_consent` true. **The `'v1.0'` literal in that function AND the gate's `TERMS_VERSION` must be bumped together when a policy version changes** — the trigger fills nulls, so a stale constant would silently stamp the wrong era. consent-gate.html should also write the two version fields explicitly at source (rider for next vyve-site build; trigger covers correctness until then).

#### §23.120 — A same-page optimistic write must re-trigger EVERY sibling renderer that derives from the written table, not just the primary surface's own renderer (PM-618 — HARD RULE)

Bus `subscribe('<table>')` channels are CROSS-PAGE by construction (§23.42). A same-page tap that publishes on a *semantic* channel (`habit:logged`, `body:logged`, `mind:logged`) does NOT fire the `<table>` subscribe channel, and `VYVEBus.recordWrite` / `recordCanonical` are dedupe-ledger calls, NOT publish. So any sibling renderer on the same page wired only to the table-subscribe channel goes stale until the next boot re-runs its loader. PM-618: home (`index.html`) `togglePill` flipped the habit row inline (`renderHabitList()`) and patched the home-state aggregate (`optimisticPatch` → score ring), but the pillar rings (`loadPillarCounts` → `renderPills`) recompute only off `subscribe('daily_habits')` (built for habits.html→home), which a same-page tap never fired — rings stayed stale until reload. Fix: call the sibling loader inline after the local write settles. **Audit when adding any same-page optimistic write:** enumerate every renderer that reads the written table on that page — row list, pillar rings, score ring, count strips, streak bar — and confirm each is retriggered inline (or via an in-page idempotent subscriber per §23.42), independent of the cross-page bus. Second occurrence of the PM-609 class (row flipped, sibling renderer didn't) → promoted to hard rule.

#### §23.122 — `partner_content_items.moderation_status` defaults to `'draft'` but the admin moderation queue counts only `'in_review'` (PM-631 — HARD RULE)

The table default is `'draft'`; the Partner Space admin moderation queue (`vyve-command-centre/partners.html`) counts/shows ONLY `moderation_status='in_review'`. Anything written at the default is invisible to moderation — never reviewed, never published. Any writer into `partner_content_items` intending content for review MUST set `'in_review'` explicitly; the `partner-onboarding` EF does. Lifecycle: draft → in_review → approved/flagged/returned (`published` renamed `approved` PM-684; live-gating moved to `publish_at`, §23.139). (Sibling to PM-630's §23.121 modal-stacking rule — see changelog.)

#### §23.124 — Inline HTML oninput/onclick handlers run in global scope, not the IIFE (PM-657 — HARD RULE)

Portal JS lives inside an IIFE `(function(){ ... })()`. Inline `oninput`/`onclick` attributes in dynamically-built HTML strings execute in **global scope** — they cannot see IIFE-scoped variables. Any identifier referenced in an inline handler must be explicitly assigned to `window` (e.g. `window.state = state`, `window.save = save`). Symptom: silent `ReferenceError` on every keystroke, no console output in Capacitor. Always audit inline handler strings against the `window.*` exposure block before shipping.

#### §23.123 — Marketing-site pages don't share the portal's theme tokens; `var(--card2/--gold/…)` silently falls back to light defaults (PM-656 — HARD RULE)

`Test-Site-Finalv3` pages (e.g. `partner-onboarding.html`) define their OWN palette — `--dark:#0d1117`, `--card:#131f2b`, `--surface:#1a2b3a`, `--surface2`, `--mint:#5ec4b0`, `--teal`, `--white:#f0f4f4`, `--muted`/`--muted-light`, `--line` — and do NOT load the portal's `theme.css`/`theme.js`. There is no `--card2` and no `--gold` here. Any injected CSS that references a portal/undefined token (`var(--card2,#fafafa)`, `var(--gold,#c9a84c)`) falls through to its light fallback and renders a white slab on the dark page. Always style marketing-site components with the page's own tokens; never assume portal tokens exist. (Surfaced when the embedded Partner Agreement first rendered as a white box.)

#### §23.125 — Ascending `limit`-bounded PostgREST list with no lower bound silently slides off the present as rows accumulate (PM-658 — HARD RULE)

#### §23.126 — Never chain Dexie version() calls (PM-668)

Always use separate `db.version(N).stores(...)` calls. The chained form `db.version(25).stores(V25).version(26).stores(V26)` is valid Dexie syntax but masks evaluation-order bugs: if SCHEMA_V25 is declared after SCHEMA_V26 in source, V26's Object.assign picks up undefined. PM-665 caused this — V26 defined before V25, corrupting catalogue stores for every device that opened during that window. Separate calls make declaration-order bugs immediately visible.

A query like `?order=starts_at.asc&limit=100` with only an UPPER bound returns the *oldest* N rows. While total matching rows < N it looks correct; the moment they exceed N the window pins to the front (oldest) and current/future rows fall outside it — no error, just silent blindness. Any "what's happening now / next" query MUST carry a lower bound that tracks the present (e.g. `&starts_at=gte.<now − buffer>`), order descending, or paginate. Root-caused the 4-day live-session outage: `vyve-live-runner.py get_upcoming()` had asc+limit=100, no lower bound; at ~100 active `calendar_occurrences` (18 Jun) it stopped seeing current sessions and quit creating/airing broadcasts. The `broadcast-watchdog` EF (cron 50) now detects this class of silent failure at the outcome level.

#### §23.127 — Stripe Payment Links CANNOT pre-apply a coupon (PM-682 — HARD RULE)
The `payment_link` object has no `discounts` field — only `allow_promotion_codes` (customer TYPES a code). Any "branded link, discount pre-applied, no code typed" requirement (partner referral links) MUST be served by an EF-minted **Checkout Session** with `discounts[0][coupon]` — see `partner-join-redirect` v4. The resulting subscription carries `discount.coupon.id` for attribution. Per-partner payment-link objects are NOT needed; `partner_partners.payment_link_url` is vestigial. PM-675/676 built a bare £20 link assuming a capability Stripe doesn't have.

#### §23.128 — Partner `subscription_value` = NET paid, never the £20 list price (PM-682 — HARD RULE)
`partner_memberships.subscription_value` = net monthly amount the member actually pays after the partner coupon = `(price.unit_amount − coupon.amount_off)` or `× (1−percent_off)`, in pounds. Payout = `Σ(subscription_value) × revenue_share_pct` (`run_partner_payouts` was always correct; it was fed the wrong number). Written by `stripe-webhook` v11 + `stripe-reconcile` v2+ via `netMonthlyValue()`. Column DEFAULT `20` DROPPED — a missed write → null → £0, the safe-fail direction (the £20 default silently overpaid the partner the entire discount, VYVE netting £0).

#### §23.129 — Branded `/join/[slug]` is served by `404.html`, NOT `join.html` and NOT Cloudflare (PM-682 — HARD RULE)
GitHub Pages can't path-route `/join/<slug>` to a file, so `join.html` never executes for the subpath (PM-676's "join.html dynamic redirect verified" was WRONG). `Test-Site-Finalv3/404.html` (the Pages catch-all) reads the slug and `window.location.replace`s to the `partner-join-redirect` EF. No Cloudflare Worker / Redirect Rule / subdomain is involved or needed (Cloudflare presence unconfirmed — Dean believes none). The only caching gremlin (stale 404 during iteration) is GitHub/Fastly edge and resolves on propagation; 404.html resolves the link live via the EF, so it never needs per-partner edits.

#### §23.130 — `onboarding_v8.html` is DEAD (404); the real onboarding questionnaire is `welcome.html` (PM-682 — HARD RULE)
Any post-payment `success_url` or onboarding reference must use `www.vyvehealth.co.uk/welcome.html` (428KB multi-section form; reads URL params via the existing `?c=` campaign pattern). `onboarding_v8.html` 404s live (master line 163 already flagged it superseded; the Stripe success_urls were the stale part). `partner-join-redirect` v4 success_url → `welcome.html?partner=<slug>&cs={CHECKOUT_SESSION_ID}`.


#### §23.131 — Supabase Storage has a PROJECT-GLOBAL upload size limit that overrides per-bucket `file_size_limit` (PM-683 — HARD RULE)
A bucket's `file_size_limit` cannot exceed the project's global storage upload limit, and the global limit is the binding constraint. Default is 50MB. Raising `storage.buckets.file_size_limit` via SQL does NOTHING above the global ceiling — uploads over the global limit return `400 {"statusCode":"413","error":"Payload too large"}` regardless of the bucket setting. The global limit is a PROJECT SETTING (Dashboard → Storage → Settings → Upload file size limit), not SQL-changeable through our MCP/PAT tools — Dean changes it in the dashboard. Symptom that fingerprints this: small files upload fine, larger ones 413 at a fixed byte threshold (e.g. ~50MB) even though the bucket says 2GB. Separately: a browser single-PUT of a signed upload URL is fine for small files but fragile for large video — real partner-video uploads should move to resumable/TUS (`/storage/v1/upload/resumable`) for production.

#### §23.132 — `get_my_partner_id()` must have EXECUTE granted to `anon` (and `authenticated`) or ALL anon reads of `partner_partners` throw (PM-683 — HARD RULE)
`partner_partners` has a `public`-role RLS policy (`partner_own_partner_partners_select`) whose USING clause calls `get_my_partner_id()` (SECURITY DEFINER; returns the partner id where `contact_email = auth.email()` and the caller is an active `role='partner'` in `admin_users`; returns NULL for anon — no leak). Postgres evaluates ALL permissive policies on a SELECT, so if `anon` lacks EXECUTE on that function the entire query errors with "permission denied for function get_my_partner_id" — even the separate anon live-read policy never gets a chance. Fingerprint: the partner portal (anon REST reads) silently shows empty profile/content and `partnerId` never sets, which also disables upload. Fix once: `grant execute on function public.get_my_partner_id() to anon, authenticated;`. NOTE: this function IS the real partner→login linkage — `partner_partners.contact_email = auth.email()`. Real partner logins live in `admin_users` (role='partner'); the demo portal does not use it yet.

#### §23.133 — `partner-portal.html` is a shared-password DEMO that SPOOFS the session (no JWT); partner-facing EFs must gate on `x-portal-key`, not a user token (PM-683 — HARD RULE)
The partner portal's login is a single shared password (`vyve2026`); on unlock it sets `state.session = {user:{email: 'deanonbrown@hotmail.com'}}` with NO `access_token`. There is no real Supabase Auth session and no per-partner identity — `loadPartnerData()` is pinned to a hardcoded `DEMO_PARTNER_ID` (= Emma Clarke). Any EF the portal calls therefore CANNOT verify a user JWT (verify_jwt:true would 401 on "Bearer undefined"). `partner-content-upload` is deployed verify_jwt:false and gates on an `x-portal-key: vyve2026` header (matches the portal password) — demo-grade security matching the portal itself. The real per-partner build replaces the shared password + `DEMO_PARTNER_ID` with proper logins (auth user + `admin_users` role='partner' + `partner_partners.contact_email` match per §23.132) and flips the EF back to JWT auth.

#### §23.134 — Partner attribution rides on subscription `metadata.partner_slug`; per-partner Stripe coupons are DEAD (PM-683 — HARD RULE)
Partner identity is carried by `subscription_data[metadata][partner_slug]` (stamped by `partner-join-redirect` v5), NOT by the coupon. Coupons now only carry the discount and are SHARED across all partners by tier: `VYVE_TIER15` (£5 off forever), `VYVE_TIER10` (£10 off forever), £20 tier = no coupon. `stripe-webhook` v13 / `stripe-reconcile` v5 attribute with a 3-tier fallback: (1) `metadata.partner_slug`, (2) legacy coupon-id → `partner_partners.stripe_promo_code`, (3) `members.signup_campaign_code` (for trial conversions, since the member row is created at welcome.html AFTER `subscription.created` so the webhook usually skips and the 15-min reconciler is the primary path). Earnings = `Σ(subscription_value net-paid WHERE referred) × revenue_share_pct` — supersedes any "× £20 list" or `sessions_attended` logic.
#### §23.135 — Partner-portal demo: dependent loaders MUST chain off `loadPartnerData()`, never fire in parallel (PM-684 — HARD RULE)
`state.partnerId` is set only by the async `loadPartnerData()`. Every loader that reads it (`loadContent`, `loadCommunity`, `loadPushQueue`, `loadSessions`, `loadEarnings`) early-returns `if(!state.partnerId)return;`. Calling them on the same line as `loadPartnerData()` (without await) races — they run before `partnerId` exists and silently render empty, a phantom-empty surface indistinguishable from a cache/RLS miss (cost a long cache chase to find). ALWAYS `loadPartnerData().then(function(){ …dependent loaders… })`. Applies at BOTH call sites: `boot()` and the password-unlock handler.

#### §23.136 — service_role key for Storage REST ops comes from the Management API (`api-keys?reveal=true`), not the vault (PM-684 — HARD RULE)
Direct SQL deletion of Storage objects is blocked by `storage.protect_delete()`, and the service_role key is NOT in `vault.decrypted_secrets`. For Storage REST ops (e.g. deleting test objects) fetch it live: `GET https://api.supabase.com/v1/projects/ixjfklpckgxrwjlfsaaz/api-keys?reveal=true` with the vault `MGMT_PAT` (`sbp_…`) as Bearer, pick the `service_role` key. Storage REST rejects `sb_secret_*` (403) and needs the legacy JWT-format key.

#### §23.137 — `partner-file-url` (and any signer over `media_url`) must strip the bucket prefix (PM-684 — HARD RULE)
`partner_content_items.media_url` is stored WITH the bucket prefix (`partner-content/<id>/<file>`). `createSignedUrl(bucket, path)` wants the key WITHOUT the bucket. Passing `media_url` straight as `path` double-prefixes → `partner-content/partner-content/…` → 404→500. `partner-file-url` v2 strips a leading known-bucket prefix before signing; any new signer over `media_url` must do the same.

#### §23.138 — admin.vyvehealth.co.uk is behind Fastly with per-edge-node caching; bust with a novel `?query`, not a hard reload (PM-684 — HARD RULE)
The CC host sits behind Fastly (~10-min TTL, per-edge-node). An empty-cache hard reload can still hit a warm node serving stale HTML. After committing CC HTML, poll the edge for a marker string, THEN tell Dean to reload with a NEW query key (`?z=N`). Desktop Chrome (admin) has an address bar so `?z=N` is fine — the no-address-bar rule is iOS members only.

#### §23.139 — Partner content: approved ≠ live; live needs a partner-chosen `publish_at` that has passed; 48h min; edits lock at approval (PM-684 — HARD RULE)
`partner_content_items.publish_at` is NULLABLE. NULL = approved-but-unscheduled = NOT live. Live = `moderation_status='approved' AND publish_at IS NOT NULL AND publish_at <= now()` (member RLS `member_read_live_partner_content` + portal chips agree). NEVER backfill `publish_at = created_at` — a time nobody chose makes old items spuriously Live. Go-live must be ≥48h ahead, enforced in the picker `min`, client validation, AND the EF (`commit`+`update`). The partner may edit title/description/go-live ONLY while `in_review`; the EF `update` action is `…WHERE moderation_status='in_review'` and 409s once approved/returned, so a stale page can't bypass the lock. New PUBLIC bucket `partner-thumbnails` holds poster frames (`thumbnail_url`); capture is best-effort client-side, falls back to a film icon.


#### §23.140 — nav.js "More" is TWO independent surfaces (PM-710)
The `moreItems` array feeds ONLY the desktop `.nav-more-panel` dropdown. The mobile bottom sheet (`vyve-more-menu`, the surface members and Dean actually use) is a SEPARATE hardcoded HTML template ~100 lines below in nav.js. Any More-menu change must edit BOTH in the same commit. PM-710 burned a device round-trip on a stale-JS theory because only the desktop list had been updated.

#### §23.141 — Buttons do not inherit text colour; page resets must cover them (PM-717)
The standard portal page reset covers `a{color:inherit}` but the UA stylesheet gives `<button>` its own colour (iOS renders default blue). Any page using `<button>` for list rows/cards needs `button{color:inherit}` in its reset or labels ship blue on device while looking fine in dev.

#### §23.142 — `--surface` is translucent in dark theme; overlays need `--more-bg` (PM-717)
Bottom sheets, modals, and any overlay stacked above page content must NOT use `var(--surface)` as their background — it has alpha in dark mode and the page bleeds through. Use `var(--more-bg)` (the opaque nav More-sheet token) or an explicit opaque layer, and keep the light-mode `--surface-card` override.

#### §23.143 — Read the CHECK constraint before writing literal enum values (PM-721; first occurrence PM-692)
Text columns constrained by CHECK enums reject unknown values as PostgREST 400s, which optimistic UIs and fire-and-forget writers silently swallow. Two production hits: `platform_alerts.severity` rejecting `'warning'` (PM-692) and `partner_memberships.engagement_segment` rejecting `'new'` — the latter left the community join path dead from PM-661 to PM-721 with zero rows ever written. Rule: before any client or EF writes a literal to a text column, run `SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid='<table>'::regclass` and match the allowed set (or omit the field and take the DEFAULT). Corollary: never ship a write path whose failure branch is a silent UI reset — log status + response body at minimum.

#### §23.144 — PM recompute and the commit POST must be atomic — same tool batch, recompute LAST (PM-740; collisions on 735 and 739 in one evening)
Fetching heads in one tool call and committing in the next is a race that loses whenever 2+ parallel sessions are landing — twice in the PM-740 session alone, minutes apart. §23.24's "re-fetch immediately before commit" means *immediately*: the `GET /commits per_page=5` sweep (all PM-namespace repos), the `PM=max+1` recompute, the message templating, and the `PUT`/`POST` must run inside ONE bash_tool invocation, recompute as the last step before the write. If the commit lands and a same-number message is then discovered on another repo, do NOT rewrite history — record the true number in the brain entry (message-says-X-true-Y) and carry on. Content correctness is unaffected; only the label drifts.

## 24. Key references, credentials & URLs

### Core infrastructure

| Reference | Value |
|---|---|
| Supabase project ID | `ixjfklpckgxrwjlfsaaz` (West EU / Ireland, Pro) |
| Live-runner VPS | Hetzner CX23 `vyve-live-runner` — `159.69.95.90` · SSH root, key in vault `VYVE_RUNNER_SSH_KEY` · systemd `vyve-live-runner` · playbook `playbooks/live-runner-ops.md` |
| PostHog key | `phc_8gekeZglc1HBDu3d9kMuqOuRWn6HIChhnaiQi6uvonl` |
| Stripe payment link | `buy.stripe.com/00wfZicla1Em0NnaIB93y00` → `welcome.html` |
| Stripe coupons | `VYVE15`, `VYVE10` (still active in Stripe; copy + values need refresh — Lewis call) |
| HubSpot | `app-eu1.hubspot.com` · Hub ID 148106724 · Timezone Europe/London · Currency GBP |
| Strategy dashboard | `online.vyvehealth.co.uk/strategy.html` (password `vyve2026`) |
| Internal password | `vyve2026` |
| Demo reset URL | `online.vyvehealth.co.uk/index.html?reset=checkin` |
| VYVE logo | `online.vyvehealth.co.uk/logo.png` |
| Brand icon source | `online.vyvehealth.co.uk/icon-512.png` (App Store/Capacitor canonical) |
| Podcast page | `www.vyvehealth.co.uk/vyve-podcast.html` |
| Admin console | `admin.vyvehealth.co.uk/admin-console.html` · Broadcast UI at `admin.vyvehealth.co.uk/#/broadcast` |

### Native apps

| Reference | Value |
|---|---|
| iOS App Store | VYVE Health app — version 1.3 `Ready for Distribution`, version **1.4 `Waiting for Review`** (PM-413, 26 May). App ID `co.uk.vyvehealth.app`. |
| Android Play Store | **1.0.5** versionCode 50 — production release saved, "Send 1 change for review" staged (PM-413). 1.0.2 was last live (April resubmission with icon fix). |
| Capacitor OTA | Capawesome live update. App ID `f9961f66`, prod channel `89e12796`. First OTA push candidate = PF-23 v1 first-run (build-ready PM-553) if not shipped in-binary — consider `--rollout 0.1` canary. |

### Secrets & PATs

| Reference | Value |
|---|---|
| GitHub PAT (Composio fallback) | Supabase Vault as `GITHUB_PAT_CLAUDE` (project `ixjfklpckgxrwjlfsaaz`, secret UUID `0c17013f-c79b-4950-8e2f-589ef81078cc`). Fine-grained, VYVEHealth org owner, all-repos, Contents + PRs + Workflows R/W. Fetch via Supabase MCP `execute_sql` — never ask Dean to paste. **No expiry** (rotated 7 Jun 2026 PM-558, replacing the `vyve-cto-claude` token that had been expiring 20 June; that "rotate before 20 June" fire-drill is DONE — do not re-flag it). |
| GitHub PAT (brain-scoped) | `GITHUB_PAT_BRAIN` — Contents R/W on `VYVEHealth/VYVEBrain` only. Expires **18 April 2027**. |
| GitHub PAT (capacitor-scoped) | Fine-scoped, Contents R/W on `VYVEHealth/vyve-capacitor` only. Expires **7 May 2027**. Cached in macOS Keychain on Dean's Mac. |
| Supabase Management PAT | Supabase Vault secret `MGMT_PAT` + GitHub Actions repo secret `MGMT_PAT` on `VYVEHealth/VYVEBrain` for `backup-edge-functions.yml`. **No expiry** (rotated 9 Jun 2026). Update both copies in same session if ever rotated. |
| Legacy service-role JWT | Supabase secret `LEGACY_SERVICE_ROLE_JWT` (dual-auth pattern for `send-push`, `achievement-earned-push`, broadcast EFs). |
| VAPID public key | `BDbz2-0k3JcqRWKyasr3MNgEZrXhKsVvjS-otCyyV7Ya4Pi2xXOxXGETUpVoE56VorKzSNy7uyep53gOzNEMTu4` |
| YouTube Data API v3 OAuth | Vault secrets `YOUTUBE_OAUTH_CLIENT_ID`, `YOUTUBE_OAUTH_CLIENT_SECRET`, `YOUTUBE_OAUTH_REFRESH_TOKEN`. Google Cloud project `vyve-website`. Scope `https://www.googleapis.com/auth/youtube`. Owner `team@vyvehealth.co.uk`. Consent screen PUBLISHED to production (PM-698) — refresh token NON-EXPIRING; unverified-app warning remains (harmless, Dean sole consenter; full verification deliberately skipped). Client "VYVE Backend" (Web application); sole authorised redirect URI `http://localhost:8765` (oauthplayground URI removed — re-consent uses the localhost flow in PM-698). Keepalive cron 25 + token-health cron 35 retained as belt-and-braces. |
| APNs auth key | KEY_ID `2MWXR57BU4` — rotation deferred 07 May 2026 PM-4 as accepted risk (Apple 2-keys-per-team cap). Chat exposure 27 April PM. If Sage's security review surfaces it, rotate. |

### Repos

- `VYVEHealth/vyve-site` — portal web shell (GitHub Pages at `online.vyvehealth.co.uk`; bundled into Capacitor binaries via `npx cap copy`).
- `VYVEHealth/Test-Site-Finalv3` — marketing/onboarding site (`www.vyvehealth.co.uk`).
- `VYVEHealth/VYVEBrain` — AI source-of-truth document store.
- `VYVEHealth/vyve-command-centre` — Lewis's internal ops dashboard + admin console (`admin.vyvehealth.co.uk`).
- `VYVEHealth/vyve-capacitor` — iOS + Android native Capacitor wrapper. Remote private. Local at `~/Projects/vyve-capacitor` on Dean's Mac. SPM-only Capacitor 6 — no Podfile. `.gitignore` covers all key material.

### Live tables of note (recent infrastructure not in §6)

- `broadcast_schedules` + `admin_broadcast_log` — PM-402 broadcast push (Lewis-facing UI + scheduled cron rails). Recurring schedule = single Studio INSERT with `slug`, `title`, `body`, `audience` jsonb, `recurrence` jsonb, `is_active true`.
- `member_prompts` + `member_prompt_questions` + `member_prompt_dismissals` + `member_prompt_responses` — PM-375 Member Prompts (Lewis-driven in-app questionnaires).
- `checkin_questions` — PM-384 versioned slider questions for weekly + monthly check-ins.
- `podcast_platforms` — PM-378 catalogue.
- `mind_videos` — PM-367 catalogue.
- `persona_welcome_copy` — PM-372 hydration COPY_TABLE.
- `how_to_resources` — PM-377 catalogue (pdf/video).

### Active cron jobs (live 15 Jun 2026: 42 jobs, **41 active** — jobid 27 inactive; gaps at 12/17/19; jobid 26 retired→36; jobid 47 added PM-615 vyve-foundation-running-plans */5)

| ID | Name | Schedule | Active |
|---|---|---|---|
| 1 | vyve-reengagement-daily | 0 8 * * * | Y |
| 2 | vyve-daily-report | 5 8 * * * | Y |
| 3 | weekly-report | 10 8 * * 1 | Y |
| 4 | monthly-report | 15 8 1 * * | Y |
| 5 | vyve-certificate-checker | 0 9 * * * | Y |
| 6 | habit-reminder-daily | 0 20 * * * | Y |
| 7 | streak-reminder-daily | 0 18 * * * | Y |
| 8 | warm-ping-every-5min | */5 * * * * | Y |
| 9 | vyve_recompute_member_stats | */15 * * * * | Y |
| 10 | vyve_recompute_company_summary | 0 2 * * * | Y |
| 11 | vyve_platform_metrics | 15 2 * * * | Y |
| 13 | vyve_rebuild_mad_incremental | */30 * * * * | Y |
| 14 | vyve_schema_snapshot | 0 3 * * 0 | Y |
| 15 | vyve-achievements-sweep-daily | 0 22 * * * | Y |
| 16 | email-watchdog | */30 * * * * | Y |
| 18 | process-scheduled-pushes | */5 * * * * | Y |
| 20 | vyve-seed-weekly-goals | 1 0 * * 1 | Y |
| 21 | vyve-gdpr-export-tick | */15 * * * * | Y |
| 22 | vyve-gdpr-erase-daily | 0 3 * * * | Y |
| 23 | vyve_charity_reconcile_daily | 30 2 * * * | Y |
| 24 | vyve_drain_home_state_dirty | */5 * * * * | Y |
| 25 | youtube-token-keepalive-daily | 0 3 * * * | Y |
| 27 | session-publish-hourly | 5 * * * * | Y (re-enabled PM-658 belt-and-braces; verified active PM-686) |
| 28 | vyve-broadcast-scheduler | */5 * * * * | Y |
| 29 | vyve-alert-digest-morning | 0 8 * * * | Y |
| 30 | vyve-alert-digest-afternoon | 0 14 * * * | Y |
| 31 | vyve-alert-digest-evening | 0 20 * * * | Y |
| 32 | vyve-evaluate-plan-fit | 0 4 * * * | Y |
| 33 | vyve-recompute-step-baselines | 10 4 * * * | Y |
| 34 | vyve-expire-trials | 0 1 * * * | Y |
| 35 | youtube-token-health-daily | 0 4 * * * | Y |
| 36 | vyve-refresh-replay-videos-hourly | 45 * * * * | Y |
| 37 | session-reminder-cron | */5 * * * * | Y |
| 38 | cc-app-health-hourly | 0 * * * * | Y |
| 39 | cc-usage-hourly | 30 * * * * | Y |
| 40 | cc-retention-hourly | 15 * * * * | Y |
| 41 | cc-activity-hourly | 45 * * * * | Y |
| 42 | cc-wellbeing-hourly | 55 * * * * | Y |
| 43 | cc-platform-hourly | 5 * * * * | Y |
| 44 | cc-revenue-hourly | 20 * * * * | Y |
| 45 | cc-ai-hourly | 35 * * * * | Y |
| 47 | vyve-foundation-running-plans | */5 * * * * | Y |

### Make scenarios (Lewis-side)

Retired. Lewis no longer running Make analytics collectors or the social publisher. Brain no longer tracks Make scenario IDs. If Lewis returns to Make-driven workflows, repopulate this section then.

### SW cache

See live `vyve-site/sw.js` (key bumps on every portal commit; do not maintain inline here).

### Composio / GitHub patterns (codified)

- Large files (>~50K chars): always commit via `run_composio_tool("GITHUB_COMMIT_MULTIPLE_FILES", args)` inside the Composio workbench, never direct MCP. When Composio is down (current state, ~6 days), fall back via Vault PAT + Git Data API per §23.27.
- `GITHUB_GET_RAW_REPOSITORY_CONTENT` → S3 URL needing secondary fetch; expires fast, save to `/tmp/` immediately. Decode bytes with `r.content.decode("utf-8")`, not `r.text` (S3 returns text/plain with no charset → requests defaults to ISO-8859-1, fake mojibake on UTF-8).
- `GITHUB_GET_REPOSITORY_CONTENT` → nested `data.content.content` base64; strip whitespace with `re.sub(r'\s+', '', b64)`, pad, decode.
- Multi-file atomic commits: `upserts` array (not `files`); `message` not `commit_message`. `deletes` is flat array of path strings, not objects.
- Always verify large commits by re-fetching at commit SHA and md5-comparing.

---

*Brain master sections 19-24 — curated 26 May 2026. Single source of truth for status board (§19), enterprise blockers (§20), backlog (§21), open decisions (§22), hard rules (§23), and references (§24). Section §24 (Premium Feel Campaign) and the broader PF-40 sub-campaign narrative removed — that campaign closed implicitly when local-first became the architectural baseline; ongoing PF-XX item tracking lives in `tasks/backlog.md` and `brain/active.md`. Section §25 (formerly references) merged into §24.*
