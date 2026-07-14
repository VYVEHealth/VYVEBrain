> **[PM-810 · 2026-07-14 · COMPLAINT REPLY-INGEST — BACKLOGGED, pair with email tenant migration (finding U)]** Replies to complaint resolution emails currently land in the team@ inbox (by design — sender is team@; Dean device-verified and expected them in CC). Build when picked up (~1 session + DNS): dedicated reply address on a subdomain (e.g. reply.vyvehealth.co.uk), MX → Brevo inbound parsing, webhook EF matches complaint id (Reply-To plus-addressing or embedded token), appends to a complaint_messages thread, flips status resolved→open, CC complaints detail grows a thread view. DO NOT build on the current consumer-grade inbox — sequence it with/after the managed-tenant migration flagged pre-Sage, or the DNS work gets done twice. Until then: team inbox is the accepted v1 reply path.

> **[PM-797 · 2026-07-13 · ALAN CATCH-UP 12 JUL — updated at PM-802 close: 1 SHIPPED (PM-798, device-confirmed), 3 SHIPPED (PM-800), 4 DONE (coverage-gates doc w/ Dean), 6 SHIPPED (PM-799, nobody flagged yet), 9 DONE (integration spec doc w/ Dean), 10 SHIPPED (PM-801, taste-check pending). REMAINING → 2 complaints loop (Dean design chat first: entry points, resolution menu, escalation criteria), 7 booked sessions (talk first, no booking concept), 8 freshness map (ready to run). NEW Dean debt from item 4: partner hygiene sweep — 4 hidden 'VYVE Partner' placeholder rows + 3 declined test rows + 1 unnamed contract-stage row.]** From Alan's writeup of his catch-up with Lewis. Triage vs live state: **(1) Partner ratings — NEXT UP (build opened this session, ~1 session).** Real feature behind the column PM-762 display-killed: member star ratings on partner profile/content, VYVE+partner visible from rating #1, member-facing publish gated at N ratings (configurable, default 20). `partner_ratings` table + threshold trigger onto `partner_partners.rating`/`rating_count` + partner-profile.html capture/display + CC partners detail surface. **(2) Complaint automation loop** (~1–2 sessions): complaints table + EF workflow — complaint → auto partner notify → resolution menu (refund/apology/free session) → automated comms; escalation-only human touch. v1 links occurrence/timestamp, no clip splicing. **(3) Employer portal "Comms & engagement" tab** (~1 session): record + asset store of everything pushed to a corporate's internal comms (Workplace etc.); v1 manual post log + copy/embed assets, automation later. Slots into PM-789–791 portal. **(4) Go-live partner coverage matrix — LEWIS/ALAN decision doc**; Dean generates the current breadth×depth grid from live `partner_partners` as the starting truth (note: 5/7 live partners lack contact_email, PM-694 ops debt). Defines gates for (a) present to Sage (b) trial go-live (c) first scaled corporate. **(5) Deck onboarding/in-life detail — LEWIS**; slides on request. **(6) Featured partner slot** (~0.5 session): `featured` flag + pinned top slot in partner-space Discover; selection algorithm explicitly deferred per Alan. **(7) "My booked sessions" calendar view — TALK FIRST**: no booking concept exists (sessions are drop-in; session_live_views = views). Needs save/book action + member calendar view — scope with Dean before building. **(8) Static-vs-changing site map** (analysis session): freshness map per page + what drives each update; page-docs (§11B) head start. **(9) API spec pre-Sage** (~1 session + Lewis deck slide): document real integration surface (SSO, provisioning, export, webhooks — mostly aspirational today) so Dean/Lewis can talk detail with Sage. Pairs with (4) as the Sage gates. **(10) Connect bottom blocks UI pass** (~0.5 session): carousel/imagery treatment on connect.html bottom tiles, follows PM-720/724 hub work.

> **[PM-796 · 2026-07-13 · CC ACCESS SESSION CLOSE]** Device check DONE (nav pill + Active Users). **NEW ITEMS:** (1) **Stripe Customer Portal self-serve billing — Dean: BACKLOGGED, not urgent** ("not fussed about easy cancel"). Spec when picked up (~1 session): `stripe-billing-portal` EF (member JWT → stripe_customer_id → portal session URL) + "Manage subscription" row in settings.html (external browser, continue.html IAP pattern); webhook already handles the downstream status flips; default cancel-at-period-end; Lewis copy pass. Context: Paige Coult's 13 Jul renewal failed with `revocation_of_authorization` — blocked at her bank because no in-product cancel path exists. (2) **LEWIS: personal outreach to Paige** (sole paying member; card valid, block deliberate; if she wants out, cancel cleanly in Stripe so smart-retries/dunning emails stop — she keeps access via past_due grace meanwhile). (3) Optional: paid tile shows "N past due" alongside the active count (offered, not taken). (4) Pages sharing the getCurrentAdmin gate (calendar/tasks/documents/sessions/settings) were ALL silently deny-bricked pre-PM-796 — re-walk them during the standing PM-779 verification. (5) acl.js resetToDefaults is now local-cache-only (server untouched; hydrate re-pulls) — fine, noted. **CARRIED from PM-779:** cc_kv smoke (Competitors/Clients edit → row in cc_kv), device check vs Update 512 (settings marker + test check-in in PostHog WITHOUT health props). **DECISIONS STILL OWED (Dean):** PostHog historical health-props deletion request, Demo Co synthetic roster, register row 2 → Anthropic Ireland, Limited.

> **[PM-779 · 2026-07-12 · CC REPAIR NIGHT — VERIFY FIRST NEXT SESSION]** Dean checks: (1) CC Calendar renders month grid (was blank — stub-wrapper clobber, fixed PM-779); (2) CRM/Finance still fine post single-client swap (one magic-link re-login possible); (3) Competitors/Clients edit → confirm row in cc_kv (PM-777 loop proof); (4) device check now vs **Update 512**: settings marker + test check-in in PostHog WITHOUT health props. **NEW BUILD (agreed, one session each):** (a) CC Calendar session management — edit title/desc/host photo/cover on calendar_occurrences, storage-upload images (Calum-banner pattern), pull/cancel WITH runner cancelled_at pre-check (MANDATORY before a cancel button ships), mockup-first; (b) meeting invites — Send-invites on cc_calendar_events via send-email EF + ICS attachment (any pasted link); Meet-link GENERATION blocked on Google OAuth Testing mode (rides that line). **PROMOTIONS QUEUE:** cc_kv collections → first-class tables, Strategy + Intel first (cc_kv = whole-collection last-write-wins, client-side audit — fine for 2 people, not forever). **PM-780 addendum:** deanonbrown2@gmail.com now on admin_users (admin); avatar user-menu + Sign out live; last stub client() calls purged from lib/auth.js. **DECISIONS OWED (Dean):** PostHog historical health-props deletion request (recommended); Demo Co synthetic roster; register row 2 → "Anthropic Ireland, Limited (UK/EEA contracting entity of Anthropic PBC)".

> **[PM-771 · 2026-07-12 · DEAN DECISION]** PostHog holds HISTORICAL events with health properties (score/feeling/energy/weight/weight_kg/food_kcal) from before the `0a616ca4` allowlist fix. Options: (a) deletion request to PostHog support citing our DPA — RECOMMENDED, (b) let retention age out, (c) document as remediated gap. Also optional: print-to-PDF the two canonical Anthropic legal pages to upgrade the position-note filing to verbatim evidence.

> **[PM-764 · 2026-07-12 · MOBILE M3]** Standalone monolith mobile passes, one session each: admin-console.html (131KB, 1 media query — biggest job), partners.html (3 queries, partial coverage), partner-portal.html (1 query — EXTERNAL users, PM-763 low-key discipline applies).

> **[PM-762 · 2026-07-12]** Attendances-by-week REMOVED from partners.html analytics (was a hardcoded mock). Realise later as an EF aggregation over session_live_views once live sessions have volume — table currently 3 rows with member-scoped RLS, so a client-side chart is impossible and an EF is the only honest path. Sonnet-safe when picked up.

> **[PM-751 · 2026-07-12]** Live-mode device fixes shipped (`6d7e6508`): renderDeepDive demo-only guard, sign-in button reset, loadLive catch split (network vs display errors — display errors now console.error'd, never again mislabelled as connection failures). **NEW (optional, Sonnet-safe): seed VYVE Demo Co fixture — 12 wks of wellbeing check-ins across 10+ test members + recent activity spread — to visually verify the UNSUPPRESSED rendering path (never yet seen on a device) before a real client hits it.**

> **[PM-750 · 2026-07-12 · EMPLOYER PORTAL END-TO-END LIVE]** Strategy V2 commitment closed: employer-provision EF v1 (member-safe password/deprovision semantics — deliberate fixes over the partner-provision pattern; auth matrix fully live-verified incl. JWT happy path 200 scoped + 403 not_employer), employer-portal EF v2/v3 (insights[] rule engine, sessions byCategory+mins, byTypeAllTime, thisMonth), employer-portal.html live mode (`e1cbfe9b`: publishable-key sign-in + refresh retry, real hero/insights/benchmarks, fictional surfaces hidden in live, ?demo=1 = PM-740 demo untouched). **DEAN device check: DONE (PM-751 — logged in, live data confirmed; renderDeepDive live-mode crash fixed at `6d7e6508`).** **NEW ITEMS:** (1) ~~CC admin UI for employer provisioning~~ CLOSED PM-761 (pages/employers.html — Sage row is now one modal when Lewis has the contact); (2) Lewis copy pass — login screen + live hero/insights copy + PM-789–791 additions (Timetable/Impact/Challenges/Ask + challenge consent line); (3) Lewis/Alan: curated benchmark figures into employer_benchmark_figures (metrics engagement_rate / activities_per_member, scope uk/eu/global, source + year — externals render ONLY from this table); (4) ~~employer_metrics_weekly snapshot table~~ CLOSED PM-789 (table + Mon 05:40 cron + real Δ in EF v4; deltas render from 20 Jul); (5) PM-740 spec remainder: ~~employer challenges (B1 skeleton)~~ CLOSED PM-790 (EF v5 + employer_challenges/optins; **B2 member-side surfacing OPEN** — vyve-site challenges.html workplace card + opt-in consent write, ~1 session), ~~board pack v2~~ CLOSED PM-791 as live-data print-to-PDF (server-side PDF deprioritised), ~~Ask VYVE form→send-email~~ CLOSED PM-789 (EP-ref relay verified), ~~per-employer timetable~~ CLOSED PM-789 v1 (public community schedule; per-employer custom sessions need calendar_occurrences audience scoping — open); (6) ~~'See your impact' giving feature~~ CLOSED PM-789 (Your Impact tab); (7) HARD pre-Sage-diligence: prospectus states clinical sign-off IN WRITING — Phil signs HAVEN or it comes out (sharpens the standing Tier-0 E item).

> **[PM-749 · 2026-07-12 · GDPR BUCKET SWEEP + EMPLOYER PORTAL BACKEND]** PM-718 hard blocker CLOSED (gdpr-erase-execute v6: challenge-photos + certificates + member-avatars swept as step 2e — the last two were undocumented PUBLIC-bucket erasure gaps; rule: new member-email-keyed buckets go in MEMBER_BUCKETS). PF-NEXT-7 CLOSED (revenue_share_pct default already 50 — brain drift). Employer Portal backend v1 LIVE: employer_admins + is_employer() + employer_benchmark_figures (EMPTY by design) migration; `employer-portal` EF v1 (server-derived scope, Wellbeing Index 30/30/20/20, MIN_COHORT=8 suppression+renormalise, teams <8→Other); 'VYVE Demo Co' fixture; verified 401/400/200 incl. suppression arithmetic. **NEXT:** wire employer-portal.html to the EF (Supabase Auth login, Lewis copy pass), employer Gate-A provisioning flow, Lewis/Alan curated benchmark sourcing, then board pack / Ask VYVE / employer challenges per PM-740 spec. **NEW ITEMS (Alan doc gaps — Lewis/Alan prioritise):** (1) partners@vyvehealth.co.uk printed in the welcome pack — confirm mailbox exists or fix the pack (Lewis); (2) 1-2-1 booking promised in the playbook — no feature exists; (3) monthly partner statements promised — earnings is read-only today; (4) partner-portal metrics (weekly-active %, 30-day retention, avg rating) promised in playbook, not computed. JWT happy-path + 403 device check rides with front-end wiring.

> **[PM-748 · 2026-07-09 · PARTNER FUNNEL SESSION 4 CLOSED — AUDIT COMPLETE]** Launch materialization live: `partner-launch-materialize` EF (admin-gated) wired into partners.html go-live (`d70786fa`) — calendar occurrence (tz-correct, pillar→category, past-date guard) + pinned welcome post, idempotent. Vestiges: EF v10 drops `dbs`; wizard `494e6476` fixes the MISSING qualifications ref in the submit payload. Playbook reconciled (override SQL pattern documented). **GOTCHA:** admin_audit_log shape is admin_email/member_email/action/table_name/new_value — partner-provision v1 audit writes failed silently since ship; v2 fixed. **PM-747 duplicated** by parallel vyve-site ship (Mental Fitness boot fix) — repo+SHA disambiguates. **All four partner-funnel sessions closed.** Remaining partner items: Lewis CTA gate (S1, GATING), Gate-A emails Men Together/Alex/Nicola (Dean), declined-draft purge policy (Dean/Lewis), Lewis privacy-notice pass (non-gating), modules un-deferral post-trial.

> **[PM-747 · 2026-07-09 · PARTNER FUNNEL SESSION 3 CLOSED]** Abuse hardening live: `ef_rate_limits` + `check_rate_limit()` (fail-open) — start 5/hr/IP, global 120/hr/IP, assessment 15/hr/draft, uploads 30/hr/draft, 429 `rate_limited`; `partner-draft-purge` EF v1 + **cron 54** (03:30 daily, 30-day retention — Dean may override, storage-first); GDPR: `partner_draft_erase(p_email)` RPC (applied/declined only — live/onboarding contractual, excluded by design) wired into `gdpr-erase-execute` **v5** (platform v17) as best-effort+HIGH-alert step 2d; wizard `2f5275ec` privacy notice (30-day retention stated). **Email-verification gate: built v8, SHELVED v9 (Dean: friction over-engineered)** — dormant behind `REQUIRE_EMAIL_VERIFICATION=false`, one-const re-arm; `_system` stripping from resume responses stays live regardless. EF source headers for partner-draft-purge v1 / gdpr-erase-execute v17 say PM-744 — STALE, session landed PM-747 (parallel sessions took 744-746). **NEW ITEMS:** (1) declined-draft auto-purge policy — Dean/Lewis call; Dean's 3 `declined` test rows (`dean-brown-*`) sit indefinitely (purge sweeps only `applied`, erase RPC fires only on request); (2) Lewis copy pass on wizard privacy notice — non-gating; (3) DPIA/register line: live/onboarding partners excluded from draft erasure (contractual basis). **Session 4 CLOSED — see PM-748 banner above.**

> **[PM-743 · 2026-07-08 · PARTNER FUNNEL SESSION 2 CLOSED]** Gate integrity live: INSERT+UPDATE go-live trigger w/ audited GUC override (any future admin/playbook partner creation at `live` MUST route through an audited EF action setting `vyve.partner_golive_override` — raw SQL inserts now blocked; fold into PF-NEXT-15 audited action surface + update playbooks/partner-onboarding.md in Session 4); 9 pre-gate live partners backfilled honest progress rows (`admin_onboarded_pre_gate`); assessment scoring server-side (EF v7 + wizard `e5205090` — QUIZ_KEY in EF must stay in lockstep with wizard quizData order). **DEAN:** contact emails for Men Together CIC / Alex (alex-movement) / Nicola (nicola-yoga) → then Gate-A provision via partner-provision EF (confirm send list first; 4 referral placeholders antonia/april/david/ivan SKIPPED by agreement). **Session 3 CLOSED — see PM-747 banner above.** **Then Session 4 — completion plumbing:** launch details → calendar_occurrences, welcomePost seeding, playbook reconcile (incl. the new override path), photoId/dbs vestige sweep. Lewis gates from Session 1 unchanged (CTA gating, email copy non-gating).

> **[PM-739 · 2026-07-08 · PARTNER FUNNEL SESSION 1 CLOSED]** Funnel integrity live (EF v6 + wizard `cb340d44`). **LEWIS:** (1) email copy pass on resume + confirmation emails — non-gating (PM-722 precedent); (2) **GATING: "Become a VYVE partner" CTA** — Dean's recommendation is footer link + about.html placement; nothing gets committed without Lewis sign-off on copy AND placement. **APPROVED REMAINING SESSIONS:** **Session 2 — gate integrity:** extend go-live trigger to fire on INSERT as well as UPDATE + audited admin-override path; Men Together forensic (sitting at pct 25) against the HELD deferred-aware migration — migration lets a deferred partner go live WITHOUT safeguarding/GDPR assessment, stays HELD until Dean + Lewis explicitly approve; move assessment scoring server-side; backfill the 7/9 NULL `contact_email`s then Gate-A provision logins via `partner-provision` EF. **Session 3 — abuse hardening:** rate limiting on the public EF (closes the v6 known gap), email verification before `upload-url` is handed out, abandoned-draft purge, wire partner draft data into the GDPR erasure pipeline, privacy notice on the wizard. **Session 4 — completion plumbing:** launch session details → `calendar_occurrences`, welcomePost seeding into the community, reconcile `playbooks/partner-onboarding.md` with the flow as it now works, sweep vestigial photoId/dbs references.

> **[PM-718 · 2026-07-07 · CHALLENGES SESSION CLOSE]** Feature live end-to-end (PM-707→718, vbb 480→491). NEW ITEMS: (1) ~~**HARD PRE-LAUNCH BLOCKER: wire `challenge-photos` bucket into the GDPR erasure pipeline**~~ **DONE PM-749 (gdpr-erase-execute v6 sweeps challenge-photos + certificates + member-avatars)** (member progress photos = special-category-adjacent body imagery; erasure executors are table-catalog-driven and do NOT touch storage). (2) **Lewis gates:** naming/copy pass on the 60-challenge catalogue (Dean-draft placeholders live in prod), diet/"no alcohol" task framing (never "diet" in copy), privacy-policy line for progress photos. (3) **Quit tracker (Mind hub)** — Lewis's core ask: addiction/sobriety tracking with anti-challenge psychology (total days never reset, compassionate slip flow wired to crisis-scan, craving tools, milestone markers, alcohol/benzo abrupt-stop medical warning). Spec next session; **Phil clinical gate BEFORE ship — do not repeat the HAVEN open-gate pattern.** (4) Five dormant challenges need v2: `pb:achieved` publish (workouts-session PB detection point), `podcast:played` publish, consecutive_weekends / every_other_day / monthly_plus_weeklies evaluator rules. (5) Enrolment sync is last-write-wins (fire-and-forget PATCH) — reconcile pass later, PM-704 family. (6) Day view photo strip/history + non-flagship day view polish. (7) 75-day tail: expiry currently marks `expired` — decide completion-grace copy. Dean's own enrolment: abandon+rejoin done (old 5-key shape). Standing queue unchanged (runner now OFF Mac per parallel PM-714/716 — Tier 1 I CLOSED).

> **[PM-714 · 2026-07-07 · TIER 1 I CLOSED]** Live runner migrated to Hetzner CX23 `vyve-live-runner` 159.69.95.90 (systemd, vault VYVE_RUNNER_SSH_KEY, masters 124 mp4s at /srv/vyve/masters/media). Mac launchd retired — ~/vyve-live is cold backup; new-video flow = drop in Mac media dir + incremental rsync. First unattended box air 8 Jul 06:00Z — verify + also eyeball tomorrow's 12:00Z Midweek Reset (first fresh-content air). CARRIED: rotate exposed service_role key (now also in box /opt/vyve/vyve-runner.env — one more consumer). NEW: August calendar regen must carry the Calum Wed/Fri rotation forward (Weds resume reset 2,3,1…; Fris resume review 2,3,1…). Optional later: turn OFF session-publish cron 27 once box-created broadcasts proven over a week (CAS-safe to co-run). Tier 1 queue is now EMPTY.

> **[PM-706 · 2026-07-07]** iOS 1.9 LIVE on the App Store; signed 479 (fast-path live-update.js) on production channel. NEW: (1) next binary 1.10/1.0.9 ships CURRENT www at archive time (fast path removes the rationale for aged snapshots); (2) device-verify the first-run fast path on the next natural fresh install; (3) **Lewis: live App Store description opens with stale PWA copy ("loads content from our secure web portal") — §23.1, fix with the HAVEN copy item**. Dean's store app converges to 479 via one legacy double-restart (60–90s dwell on first open). Standing queue unchanged: Tier 1 **I (runner off Mac)**, dashboard-delete ota-canary-watch slug, commit Mac vyve-capacitor state to remote, Android 1.0.8 review pending.

> **[PM-704 · 2026-07-05]** Android 1.0.8 SUBMITTED (both stores in review). NEW backlog: Settings 'resync my data' (nuke Dexie → re-hydrate) + reconcile-on-hydrate for track counters (immortal-Dexie property: container persistence + additive-pull; bites on GDPR rectification or unflushed PF-4 writes). Dean device chore: delete+reinstall store app to converge. Standing queue: Tier 1 **I (runner off Mac)**, dashboard-delete ota-canary-watch slug, commit Mac vyve-capacitor ship-state + mode scripts to remote, 477-tree startup SyntaxError check, Lewis items (HAVEN gate E, store copy claims, PostHog DPA, retain legal bases, sub-processor register actions).

> **[PM-703 · 2026-07-05]** Dev shell back (.dev bundle ID, "VYVE Dev", inverted icon) via mode-dev.sh/mode-ship.sh; ship state verified post-switch. Backlog adds: commit vyve-capacitor Mac state to remote (configs, mode scripts, 1.9/1.0.8 bumps); delete stale .bak-pf14b/.bundled-backup configs; stale APNs token rows from Dean's reinstall churn will 410-auto-revoke (no action). Awaiting: Apple review (1.9), Play upload confirm (1.0.8 AAB built).

> **[PM-702 · 2026-07-05]** iOS 1.9(4) SUBMITTED; Android 1.0.8(54) AAB built — **Dean: confirm Play Console upload**. On approval the frozen cohort self-heals via OTA (477). Queue after: Tier 1 **I (runner off Mac)**, dev-shell rebuild (.dev bundle ID), dashboard-delete ota-canary-watch slug, commit Mac vyve-capacitor ship-state to remote, **Lewis: HAVEN/group-therapy claims in live store description vs open clinical gate**.

> **[PM-701 · 2026-07-04 · TIER 1 K CLOSED §23.106]** OTA verified on-device (476 on-screen). Shipped binaries were BROKEN (embedded config stripped + publicKey:"" signing enforcement) — store installs can never OTA. NEW TOP NATIVE PRIORITY: **archive + submit iOS 1.9 / Android 1.0.8** (Mac already in verified archive-ready state). Also: rebuild Dean's dev shell with `.dev` bundle ID (store-config build overwrote it); dashboard-delete `ota-canary-watch` EF slug; check 477 for the bundled-tree startup SyntaxError (index.html:2857, seen in 455 native console); PM-700 race fix live in signed 477 bundle. Remaining Tier 1: **I (runner off Dean's Mac)**.

> **[PM-699 · 2026-07-04 · TIER 1 K SUBSTANTIALLY DONE]** First-ever OTA bundle live on production (Update 476, deployment `383c172e`, 100%). Server half proven: real-device probes + checksum-matched artifact download. On-device apply auto-verifies via `ota-canary-watch` EF/cron → team@ email on first device flip (then DELETE the EF + cron `ota-canary-watch-15min` — temporary). CAPAWESOME_TOKEN vaulted + `capawesome_token()` accessor. Capawesome plan is PAID. Remaining Tier 1: **I (runner off Dean's Mac)**. §23.106 closes on tripwire fire.

> **[PM-698 · 2026-07-04 · TIER 1 J CLOSED]** Google OAuth consent screen published to production (publish-not-verify) — 7-day refresh-token expiry GONE (keepalive live-verified: refresh_token_expires_in absent). New token minted via localhost:8765 redirect (oauthplayground URI replaced), proven against the VYVE channel, vault-swapped; keepalive + runner read vault per-run so zero consumer changes. Crons 25/35 stay as belt-and-braces. PF-PARK-3's rotation-chore half is dead — separate-partner-channel question is now pure isolation. Tier 1 remaining: **K OTA canary (pre-Sage gate), I runner off Dean's Mac**. H drafted PM-697 (Lewis has 5 DPA actions).

> **[PM-696 · 2026-07-04 · TIER 0 COMPLETE except E]** Findings C, F, G CLOSED. F: 66 dead EFs deleted (163→96; ref-checks wider than register: 52 crons, DB fn sources, 3 repo greps, all 95 keep-set eszip bodies; `achievement-earned-push` KEPT — live dependency of achievement-claim/achievements-sweep cron 15/log-activity). G: PM-695 replay mask + 10% client-side sampling (phx key lacks project:write). C: both PM-689 slugs deleted. CRITICAL incident found+fixed en route: signup DEAD since PM-689 — welcome.html hard-gated its success screen on the stubbed set-member-password EF; onboarding v99 now sets the password at auth-user creation + welcome.html `547ad7b` gates on `password_set`; live-verified both paths incl. sign-in; zero members harmed (sole signup since, reece-calvert, beat the stub by ~30 min). Remaining Tier 0: **E HAVEN routing (Lewis)**. Lewis also: confirm PostHog EU DPA (project 138491). Tier 1 **J (Google OAuth verification) STARTING — external clock**. Then: K OTA canary, I runner off Dean's Mac, H sub-processor register.

> **[PM-694 · 2026-07-04 · TIER 0 PROGRESS]** Finding D DONE (partner-content-upload v6 JWT + server-derived partner; portal PM-693 real login, shared password deleted). Finding B FULLY verified (Dean's live check-in; crisis-scan v2.2 pattern fix — "feeling"-form phrases now match). OPS: backfill contact_email for 5 live partners then Gate-A provision logins (partner-provision EF) before any real partner uses the portal. Remaining Tier 0: C dashboard-delete 2 slugs (Dean), E HAVEN routing (Lewis), F 68-slug EF sweep, G PostHog mask. Tier 1 J (Google OAuth) to start.
> **[PM-692 · 2026-07-04 · TIER 0 PROGRESS]** Finding B internal-alerting half DONE (crisis-scan v2.1 wired: onboarding + weekly [incl. HAVEN] + monthly + journal + connect; persistent platform_alerts rows; VYVE_INTERNAL_KEY trigger path). Verify: Dean submits one weekly check-in from phone with a benign concern phrase (member-JWT path). B's member-facing half (crisis copy, persona suppress/re-route on critical, persistent signposting) = Phil + Lewis gate. Gotcha logged: platform_alerts.severity CHECK critical/high/info only ('warning' silently rejected; gdpr-erase v4.1 fixed). Remaining Tier 0: C dashboard-delete 2 slugs (Dean), D partner-content-upload JWT, E HAVEN routing (Lewis), F 68-slug EF sweep, G PostHog mask. Tier 1 J (Google OAuth) should start.
> **[PM-691 · 2026-07-04 · TIER 0 PROGRESS]** Finding A DONE (catalog-driven enumeration in BOTH export+erase, verified live; no re-run needed — the 2 executed erasures were TEST accounts with zero residue). Finding V DONE (orphan purge fn dropped). NEW CRITICAL found+fixed: GDPR crons 21/22 sent no auth header vs CRON_SECRET gate — every tick 401'd, pipelines silently dead; revived via vault GDPR_CRON_KEY + x-vyve-cron-key (gate now always enforced). Erase v14 also purges subject's gdpr-exports artefacts (Art 17 residual). Remaining Tier 0: B crisis-scan wiring (Phil copy gate), C dashboard-delete set-member-password/create-test-user slugs, D partner-content-upload JWT, E HAVEN routing (Lewis), F 68-slug EF sweep, G PostHog mask. Lewis: confirm retain legal bases (stripe_events/admin_audit_log/gdpr_erasure_requests) for DPA. Tier 1 J (Google OAuth verification) should start.

> **[PM-689 · 2026-07-03 · SECURITY]** Two unauthenticated account-takeover EFs killed this session (`set-member-password`, `create-test-user`) — now 410+JWT, verified 403. **TODO: dashboard-delete both slugs.** EF delete sweep pending: 68-slug list at `reports/ef-delete-list-2026-07-03.txt`, needs CLI + ~5 admin-ref checks first. Also queued from audit: erasure-gap fix (PM-688 §1.1), close partner-content-upload (PM-688 §2.1), HAVEN interim routing (Lewis), admin-member-edit mandatory-reason on SCARY fields before enterprise DPA.

## NEXT — Employer Portal productionisation (PM-740 demo = the spec, 2026-07-08)
The Sage demo (employer-portal.html) is now the agreed shape of the employer product. Lewis has socialised these promises with a live prospect — treat as committed scope, sequence post-Sage-feedback:
- **Wellbeing Index** (employer barometer, was already "scoped not started") — company-level composite: engagement + anonymised avg check-in + pillar balance + momentum. Needs real formula + EF support. Wellbeing NEVER below company level (PM-738 discipline).
- **employer-dashboard EF extensions:** per-team aggregates (activity/engagement ONLY, min-cohort threshold ≥8 → "Other"), company-level wellbeing avg series, benchmark payload (VYVE community avg is computable today; UK/EU/Global = curated published figures).
- **Employer challenge launch** — templates → real Challenges feature (exists, PM-707–719); needs employer-scoped challenge creation + opt-in join flow + team-aggregate leaderboards (HealthKit data stays member-private; only opted-in team aggregates surface).
- **Expert/workshop booking** — real booking flow (enquiry → team@ is fine as v1; expert roster is Lewis commercial work: real names, prices, contracts).
- **Board pack** — server-side or print-route quarterly report; monthly snapshot email (Brevo).
- **Ask VYVE** — v1 = form → send-email EF; chat answers later (Anthropic EF, aggregate-context only).
- **Per-employer auth-gated portal URL** (e.g. /sage) — was already planned for first enterprise trial; the demo is its front-end.
- **VYVE Average / VYVE Best benchmarks** — once >3 employer accounts (Lewis's "eventually", teased in demo copy).

## NEW IDEAS + structural risk (captured PM-658, 2026-06-22)

**Feature ideas (Dean brain-dump — unspecced, talk-first before build):**
- **Challenges** — subscribable, saveable, time-boxed challenges. "75 Hard" is trademarked → build a VYVE-branded variant (multi-task daily checklist, reset-on-miss model). Step-count challenges need native HealthKit / Health Connect step data (native dependency). Lewis copy gate on naming + framing.
- **Content library expansion** — more videos / education / support content; partly exists already, needs an audit of what's there vs. the gap before scoping.
- **Global app-wide search** — single search across sessions, content, exercises, etc.
- **Fasting feature (nutrition)** — 16:8 / 24 / 36 / 48h fasting tracker. Extended-fast (36/48h) guidance needs a health disclaimer + Phil clinical gate before shipping to members.

**Structural risk — live-session runner single point of failure (from PM-658):**
- ~~`vyve-live-runner.py` runs as a launchd agent on Dean's personal Mac — sleep-prone, no redundancy. Move to an always-on box~~ **DONE PM-714** — Hetzner CX23 `vyve-live-runner` 159.69.95.90, systemd.
- ~~Google OAuth app is in "Testing" mode → refresh token expires ~every 7 days~~ **DONE PM-698** — app published to production, token non-expiring.
- Detection is now handled (broadcast-watchdog EF, cron 50, alerts email+push). These two items are the remaining *structural* fixes.


## CC OVERHAUL CAMPAIGN (PM-752 opened 2026-07-12 — ACTIVE, supersedes PM-639 Layer 2)

**Spec: `playbooks/cc-overhaul.md`** (Phase 0 audit + disposition tables + phase plan). Locked: VYVE-brand dual light/dark design system on every CC surface (partner-portal/admin-console lineage); 5-domain IA (Run the Business / Members / Partners / Employers / Analytics); curated Run-the-Business rebuild on the empty cc_* tables; kill list PENDING LEWIS CONFIRM (nothing deleted before his nod).

- [ ] **Phase 1** — design system + shell mockup, both themes (Dean gate, then Lewis look)
- [x] ~~**Phase 2**~~ **SHIPPED PM-753 (2026-07-12, `06ac8085`)** — tokens v2 + shell + 8 Analytics re-skinned; auth fail-closed; single supabase-js; theme toggle; Employers nav live (portal links). Dead-lib load trim deferred to Phase 3 (Legacy pages still depend on the lib layer)
- [x] **Phase 3 CLOSED PM-759** — Home launchpad SHIPPED PM-755 (absorbs Brief + dashboard/inbox/activity jobs; cc-home EF v1). CRM SHIPPED PM-756 (cc_leads live, RLS fixed, real pipeline seeded). Finance+Invoicing SHIPPED PM-757 (incl. won-lead→cc_clients flow + the cc_team_only 15-table dead-policy class sweep). Investors+Grants / Content / Podcast SHIPPED PM-758 — RtB domain COMPLETE, all live-data. Phase 3 CLOSED PM-759 — SOFT-KILL (Dean policy, hard-delete off the table): 10 dead lib loads removed, files kept; acl/ui/widgets/integrations/targets/cc-adapter KEPT as live deps (settings rebuild retires targets/cc-adapter later). Restore recipe: nav line (pages) / script tag (libs)
- [~] **Phase 4 step 1 SHIPPED PM-760** — admin-console re-skinned (tokens v2, Playfair zero, theme key unified); broadcast/active-users audited already-clean. Remaining (later strangler steps, refactor-value): extract console views into shell pages, retire monolith sidebar/login
- [ ] **Phase 5** — Partners: partners.html re-skin + kill/realise the two mocks (attendances-by-week, engagement scorer)
- [~] **Phase 6 PM-761 IN FLIGHT** — recon done (see changelog 12 Jul): employer-provision v2 +list, benchmark write policy, pages/employers.html, nav slug, pg_net verify. Handed to fresh session
- [ ] **Phase 7** — partner-portal.html adopts the system LAST (external users)
- [x] **Wrapper consolidation SHIPPED PM-779** (`9bda443a`) — lib/supabase.js stub soft-killed, single VYVE_SUPABASE (§23.146), 9 Phase 3-6 pages patched off client() calls
- [x] **cc_kv strangler SHIPPED PM-777** (`f8759820`/`04ff7fe7`) — all 16 Legacy pages server-backed (hydrate/write-through/focus-pull/fill-gaps seed + graduated-table mirrors into VYVE_DATA); promotions queue: Strategy, Intel first
- [x] **Desktop shell fix SHIPPED PM-776** (`b1783492`) — topnav tabs live >900px, drawer closed by default, home tiles de-nested (§23.145)
- [x] ~~Lewis: confirm kill list~~ RESOLVED PM-754 — Dean soft-killed (nav delink, files kept). Lewis: look at the new skin; flag if any Legacy page held data he typed (his-browser localStorage only)
- Folded in from PM-639 Layer 2: seed-data.js audit (DONE — it's a 13-May Make snapshot, retires Phase 3), partners.html mock kill (Phase 5), 4 unreachable hub pages sweep (Phase 3 kill list).

## Command Centre IA + Team App build (PM-639 spec — Phase A SHIPPED PM-685)

IA + spec done as artefacts (`CC-information-architecture.md`, `CC-team-app-spec.md`); §13 in master carries the summary.

~~**Phase A — CC nav reorg (4 domains):** restructure~~ **SHIPPED PM-685 (2026-07-03)** — 4-domain nav live, 11 dead pages killed, `#/performance` links repointed. Remaining from Phase A scope: sweep the 4 unreachable old hub pages (`pages/commercial|marketing|delivery|org.html`) in the CC Layer 2 pass (seed-data.js audit + kill the partners.html mocks). Original scope for reference: restructure `assets/sidebar-config.js` to Run the Business / Analytics / Members / Partners; retire the duplicate `VYVE_NAV_TOP` layer. Cross-domain moves: App Health Delivery→Analytics, Broadcast Delivery→Members, Active Users Org→Members. KILL old Commercial Partners skeleton, Performance, Brand, the 7 orphan `pages/partner-*.html` (grep-confirm first), root `Dashboard.html` (verify first). Reconcile Partner Space onto the `partners.html` monolith.

**Team App build phases:**
1. ~~**Foundation** — `admin_users` roles (admin/team), `is_team()` SECURITY DEFINER capability, RLS on `cc_tasks` / `cc_calendar_events` / new `cc_task_attachments`.~~ **SHIPPED PM-640 (2026-06-16)**
2. ~~**Tasks** — shared-list UI + per-assignee completion (`completed_at`/`stage=done`) + `cc_task_attachments` table + private `cc-task-docs` bucket + signed upload/download EF (partner-docs/partner-file-url pattern).~~ **SHIPPED PM-641 (2026-06-16)**
3. ~~**Calendar** — unified 3-source read view (`cc_calendar_events` + `calendar_occurrences`, union-at-read, colour by `source`) + meeting create/edit.~~ **SHIPPED PM-642 (2026-06-16)**
4. ~~**Scheduler** — `calendar_occurrences` write form, capability-gated (admin + `lives`), confirm-step (member-facing publish).~~ **SHIPPED PM-643 (2026-06-16)**
5. **Wrap** — deferred until content signed off. 2nd Capacitor binary off `vyve-capacitor`, own bundle id, points at role-gated CC, TestFlight internal (~6 emails).

Open (non-blocking): app name/bundle id, team route/subdomain (only matters at wrap), scheduler capability holders, gcal 2-way sync (lean internal-only v1), meet_url auto-gen vs paste (lean paste v1).


## Partner Space — build spec LOCKED (PM-660, 2026-06-22) → Sonnet builds

**PM-683 status (2026-06-25) — referral system built out + partner upload working. Full map: `playbooks/referral-system.md`.** SHIPPED: tier links £20/£15/£10 (shared coupons `VYVE_TIER15`/`VYVE_TIER10`, per-partner coupons dead, identity via `metadata.partner_slug`); 3-tier attribution (stripe-webhook v13, stripe-reconcile v5); partner trials (`trial_days` col, `apply_trial_campaign` slug fallback, £20→£10 conversion); admin payouts rewired to net-paid model (both `partners.html` + `partner-revenue.html`); 4 live partners (antonia/april/david/ivan); partner-portal VIDEO UPLOAD working end-to-end (`partner-content-upload` EF, x-portal-key gate, in_review row). OPEN: (1) real per-partner portal auth — replace shared password + `DEMO_PARTNER_ID` with real logins (`admin_users` role='partner' + `partner_partners.contact_email`, §23.132/133), flip EF back to JWT, decide which partners first; (2) raise Dashboard global storage upload limit (§23.131) + resumable/TUS for big video; (3) real role_title/pillar + per-partner trial_days for the 4 new partners; (4) payout churn filter; (5) real "Attendances by week" (hardcoded mock in partners.html) + engagement-segment scorer (hardcoded 'regular'); (6) Lewis: UK trial pre-charge disclosure + ~3-day reminder. Throwaway EFs to sweep next dead-EF pass: setup-tier-coupons, verify-tier, test-storage-sign, test-upload-put.

**PM-684 status (2026-06-26) — partner content scheduling SHIPPED.** Approved ≠ live: partner sets a mandatory go-live (≥48h ahead) at upload; live = `approved AND publish_at IS NOT NULL AND publish_at<=now()` (member RLS + portal chips, no cron). Editable title/desc/go-live ONLY while in_review (EF `update` 409s after approval). `published`→`approved`. Video thumbnails: client-side poster-frame capture → PUBLIC `partner-thumbnails` bucket → `thumbnail_url`, shown in portal + admin. `partner-content-upload` v5 (sign/sign-thumb/commit/list/update). Bugs fixed: loadContent race (§23.135), partner-file-url bucket-prefix (§23.137). See §23.135-139, `playbooks/referral-system.md`. **HEADLINE NEXT: partner-portal login + account creation folded INTO partner onboarding** — replace shared password + `DEMO_PARTNER_ID` with a real auth user + `admin_users` role='partner' matched on `partner_partners.contact_email`, flip EF to JWT; TUS/resumable uploads ride with this build. STILL OPEN from PM-683: real role_title/pillar for antonia/april/david/ivan; payout churn filter; real Attendances-by-week + engagement scorer (both mocked in partners.html); Lewis trial pre-charge disclosure.


**Full spec: `playbooks/partner-space-build.md`.** End-to-end map done this session. Decisions LOCKED: two-gate model (A=approved→web login+build space; B=Phil safeguarding/GDPR→member-visible); partner mgmt WEB-ONLY (`is_partner()` CC-slice, extend `admin_users.role`); community join FREE (payment is the VYVE membership; partner earns via existing 50% referral; no Stripe at join); simulated-live not genuinely-live.

**NEXT-UP (one schema, three deliverables — `partner_memberships` is the hinge):**
- **PF-NEXT-11: Partner web backend** (`is_partner()` CC-slice) — Account/Profile, My Content (upload+moderation status), My Community (feed posts to `partner_community_posts`, see/message subscribers, "we're live" trigger), My Sessions, My Earnings (read-only). Login provisioned at Gate A. Heavy back-office stays web.
- **PF-NEXT-12: Member-facing Partner Space (in-app)** — discover partner, JOIN free (`partner_memberships` row), view feed + sessions + library. Read-and-join only. Visible only after Gate B. Community-scoped sessions live here filtered by `partner_id`, NOT global `sessions.html`.
- **PF-NEXT-13: Community subscription + notifications** — free join; subscribers = new `partner_subscribers(partner_id)` audience shape over the EXISTING push spine (`send-push`/APNs/scheduled). Partner triggers notes/messages/"live 30-min-before" from web backend. Hard part already built.
- **PF-NEXT-14: Audience scoping** — `calendar_occurrences` add `visibility` (`public`|`community`) + `partner_id`. Member session reads filter: `public` OR (`community` AND member in `partner_memberships` for that `partner_id`). Also the guardrail against the Team-App-scheduler global-list footgun.

- **PF-NEXT-15: Claude-driven audited admin actions (Workstream 4).** Read half ALREADY LIVE (Supabase MCP). Write half = thin audited action surface graduated by risk: low-risk stage advances (say-so) / Gate A provision-login (confirm) / Gate B go-live (HARD confirm — verify Phil safeguarding+gdpr first, §23.84, never casual). All → `admin_audit_log`; reuse audited EF pattern (`admin-member-edit`) not raw writes. Generalises to members + admin console; partners first consumer. Full detail: playbook Workstream 4.

**Gate mechanics:** A = admin advances `partner_partners.status`→`onboarding` → provision `is_partner()` login + send creds. B = `trg_assert_partner_golive` + PM-659 HELD migration (deferred-aware) — needs safeguarding+gdpr (Phil) AND pct=100; members see partner only at `live`.

**PARKED (mapped PM-660, NOT next — videos may not even go live yet):**
- **PF-PARK-1: QC/ingest airing pipeline.** Exception-only, minimum Dean work. Watcher launchd agent in `~/vyve-live` (TCC-safe §23.89, py3.9-safe §23.88): download master → transcribe → rubric transcript → ffmpeg-probe → frame-sample → write `calendar_occurrence`. **Transcript-first + mechanical QC, NOT "AI watches the video"** (burned Dean before): transcript-vs-rubric = load-bearing safeguarding check (§23.84); ffmpeg = resolution/bitrate/silence/black-frame; optional vision-on-stills only. Clean→auto-schedule; flagged→hold+notify+10s tap. Download permanent until runner fetches from Storage. Inherits runner SPOF.
- **PF-PARK-2: YouTube channel/key model.** ONE channel today, 9 reusable keys (concurrency lanes) + 8 category playlists (replay split by playlist). 15 partners = slot allocation not key/channel scarcity (reuse 9 keys, ceiling 9 concurrent, add keys free, no-double-book check). Leaning separate "VYVE Partners" channel for isolation; costs 2nd OAuth + channel-aware runner — build runner channel-aware from start if doing it.
- **PF-PARK-3 (UPDATED PM-698): token-expiry half RESOLVED** — consent screen published, refresh token non-expiring, rotation chore dead. Remaining question is only whether partner streaming warrants a separate "VYVE Partners" channel (+2nd OAuth client, one localhost re-consent) — now a pure isolation decision.

**Carried/superseded from prior PF-NEXT list:**
- PF-NEXT-1 (onboarding journey) — SHIPPED PM-631/634/635; modules hidden PM-659.
- PF-NEXT-2 (member-facing space) — now PF-NEXT-12 above; no longer blocked on a Lewis demo file (spec'd from scratch).
- PF-NEXT-3 (curriculum persistence) / PF-NEXT-4 (programs sub-tab) — still open, fold into PF-NEXT-11 backend.
- PF-NEXT-5 (revenue attribution) — DONE PM-633.
- PF-NEXT-6 (CC overhaul) — tracked under PM-639 CC IA.
- PF-NEXT-7 (`revenue_share_pct` default 30→50) — ~~DECISION STILL PENDING DEAN~~ **DONE pre-PM-749 (found live at 50, all rows 50; closed PM-749).**
- PF-NEXT-8/9 (agreement brackets + Lewis live-origin review) — still open, Lewis.
- PF-NEXT-10 (silent PDF download) — optional.

## SHIPPED PM-559 — App Health Dashboard v1
### Live at admin.vyvehealth.co.uk/#/app-health (2026-06-08)

---

## BACKLOG — PM-591 — Staff account_type flag (exclude staff data from analytics)

**Problem:** Analytics (retention, wellbeing, activity depth, all Command Centre pages) are skewed by heavy test usage from Dean, Lewis, Calum, Kelly and other team members. Real member signal is diluted — day-N curves, wellbeing averages, and engagement metrics are not representative.

**Solution:** Add `'staff'` to `members.account_type` enum. Exclude staff rows from all analytics by default.

**Scope:**
- DB: add `'staff'` to `account_type` check constraint
- `compute_cc_wellbeing()`, `compute_cc_retention()`, `compute_cc_activity()` — add `AND account_type != 'staff'` to all member queries
- `employer-dashboard` EF — exclude staff
- `expire_lapsed_trials` cron (pg_cron job 34) — staff never expire
- `auth.js` `vyveCheckAccess` — staff always pass access gate regardless of subscription status
- Command Centre admin UI — toggle to include/exclude staff data per page (default: exclude)

**Members to flag on deploy:** Dean, Lewis, Calum, Kelly + any other team test accounts identified at time of build.

**Effort:** ~half day.

## NEXT — VYVE Command Centre (post-App Store resubmission)
### Internal ops, admin CRM, document hub, app health monitoring

**Trigger:** Start during Apple review window after app resubmission.

**v1 modules (priority order):**
1. Admin CRM — view/edit member profiles, habits, workouts, personas. Critical before first enterprise contract.
2. Task & role management — assign work to the 11-person team, status visibility, output upload.
3. Document hub — Supabase Storage, upload/categorise/notify. Replaces Google Drive for internal docs.
4. App health dashboard — VYVE error feed, key metrics, alerts surfaced here not email inbox.
5. Meeting scheduling — Riverside link generation, calendar invites.

**Stack:** GitHub Pages + Supabase Auth + Supabase Storage + Supabase DB + Edge Functions + Anthropic API. New repo: vyve-command-centre (admin.vyvehealth.co.uk already exists).

**Future phases:** PT/partner portal (B2B2C), SSO integration, API access for enterprise data export.

**Architecture note:** Design for multi-tenancy from day one — PT portal and employer access require role-based permissions that must be in the schema before v1 ships.

**Session start:** Load VYVEBrain, claim PM number, spec DB schema first before any parallel build sessions open.

---

## BACKLOG — PF-23 v2 First-Run Experience (action-tutorial + per-hub contextual tours)

**Depends on:** Achievements overhaul (per-step achievement unlocks), Lewis copy sign-off.

**Two-track design (Dean + Lewis agreed 2026-06-07):**

**Track A — Action-tutorial home tour (replaces v1 explanatory tour)**
Each step prompts a real action. Member finishes the tour with actual activity credited.
- Mood tap → logs to `daily_mood_checkins` → fires mood achievement toast
- Focus tap → completes focus activity → counts toward rings
- Habit tap → logs the habit → the spotlit circle is tappable-through (pointer-events allowed on that element during that step)
- Tour ends with rings visibly ticked up

Implementation note: spotlight needs tap-through mode for specific steps — remove pointer-events block from the spotlit element only, listen to VYVEBus for `mood:logged` / `focus:completed` / `habit:logged` to auto-advance.

**Track B — Per-hub contextual first-visit tooltips**
Each hub page shows a 2-3 step spotlight the first time a member visits. Independent localStorage gate per page (`vyve_seen_body`, `vyve_seen_mind`, `vyve_seen_connect`). No cross-page navigation. Member can dismiss at any step.

- Home: already covered by v1 (or v2 Track A)
- Body: workout card, movement ring, exercise library
- Mind: today's focus, tools grid (breathwork/journal/meditation), progress counter
- Connect: sessions calendar, community feed, weekly check-in

**Sequencing:** Build Track B first (simpler, no Achievements dependency). Track A after Achievements overhaul lands.

## SHIPPED PM-554 — PF-23 v1 First-Run Experience
### Intro slides + in-context spotlight tour (explanatory; first-login once, never again)
### Shipped PM-554 (2026-06-07). Copy DRAFT in COPY object at top of firstrun.js — Lewis edits in place.

**Ship target:** in the next binary OR first Capawesome OTA (`--rollout 0.1` canary) — Dean's call. Decoupled from Achievements (explanatory v1, no per-step achievement).

**Production change (approved):** `ALTER TABLE members ADD COLUMN tour_completed_at timestamptz;` + add `tour_completed_at` to member-dashboard EF snapshot payload. Bundle together; verify via real invocation.

**Component approach:** `firstrun.js` + `firstrun.css`, self-contained. Loaded on index.html, mind.html, sessions.html only (add to all three script stacks; confirm haptics.js present — §23.44). Add both new files to sw.js precache, same commit (§23.76). Inert on mind/sessions unless tour active.

**Trigger / gate:**
1. index.html boot: `if (localStorage['vyve_firstrun_done']) return;`
2. else read `tour_completed_at` from home snapshot / hydrated Dexie members row -> if set, write `vyve_firstrun_done`, return.
3. else (null + past consent gate) -> run Part 1.

**Resume cursor:** `vyve_tour_active` (bool) + `vyve_tour_step` (int). firstrun.js on mind/sessions: if active and page matches the current step's host, anchor-ready wait then draw; else inert.

**Dismissal (skip any step OR final Done — identical):** set `vyve_firstrun_done=1`, clear cursor, remove overlay, fire UN-AWAITED `supabase.from('members').update({tour_completed_at:new Date().toISOString()}).eq('email',<authEmail>)` (member-scoped RLS on auth.email(); no EF). §23.31 — never await on dismissal path. Reinstall self-heals via cold hydrate.

**Overlay mechanics:** full-viewport scrim; transparent cutout element over the anchor's bounding rect via large-spread box-shadow; tooltip card = copy + Next/Skip + step dots. Auto-scroll anchor into view; reposition on scroll/resize. Anchor-ready guard per step (selector exists AND non-empty; rAF poll ~1.5s; on timeout anchor to section container) — never spotlight an empty skeleton (§23.36/§23.47). Safe-area insets on all fixed controls (§23.58). VYVEHaptics.selection() on advance. Suppress web tells (§23.59).

**Copy is a swappable table (basics-first):** every slide + spotlight string lives in ONE `COPY` object at the top of firstrun.js (mirror the hydration.js COPY_TABLE pattern). Build the mechanism solid once; treat all strings as DRAFT and iterate wording in place — Lewis edits the object, never the logic. Do not block the build on copy being final.

**Part 1 — 4 intro slides (swipeable, Skip always visible):**
1. What VYVE is — "Most health apps wait for something to go wrong. VYVE helps you build health before it breaks — a little, every day."
2. Five areas — "Five places to look after yourself: Body to move, Mind to settle, Nutrition to fuel, Sessions to join live, and Connect for the people around you." (Areas, not nav — bottom nav is Home/Mind/Body/Connect/More; Nutrition+Sessions live under More; spotlight teaches the real nav.)
3. Help yourself, help others — "Help yourself, help others. Every habit, workout and session you log builds toward a certificate — and each one you earn donates a free month of wellness to someone who needs it." (Echoes the VYVE tagline: Help yourself. Help others. Change the world. THIS is the "why" of the cap — see step 5.)
4. Your day — "A few minutes is enough. Check your focus, tick a habit, drop into a session. Come back tomorrow and keep it going." CTA "Show me around" (-> Part 2) / "Skip" (-> done-flag, home).

**Part 2 — 7 spotlight steps (host / selector / anchor-ready / copy). Path: home(1-4) -> mind(5) -> sessions(6-7), 2 hops.**
1. index `#focus-carousel` (label `#focus-section-label`) — ready: has `.focus-card` — "Your daily focus — one small guided action, picked for you. Tap to begin."
2. index `#habit-list .habit-row:first-child .habit-check` (fallback `#habit-empty`) — ready: `#habit-list` visible & has a row, else empty-state — "Tap the circle to tick off a habit. That's a log — it counts."
3. index `#pills-row` — ready: has `.pill` — "Five rings, one per area. Each fills toward your next certificate at 30."
4. index `#live-carousel` (header 'Up next'; View all -> /sessions.html) — ready: has `.scroll-card` — "What's on this week. Tap a card to join a live session, or View all for everything."
5. mind `#today-progress` (in `.progress-card`) — ready: textContent matches /\d \/ 2/ — "Two a day per area count toward your certificate. The cap is the point — it rewards turning up daily, not grinding, and those steady days are what donate months to others. Log as much as you like."
6. sessions `#sessionList` + first `.status-badge.live` (up next = `#nextSession`) — ready: `#sessionList` has a card — "Every session in one place. Live ones carry a red badge; the next one's always up top."
7. sessions first `.card-replay` (-> replay-category/replays.html) — ready: a `.card-replay` exists — "Missed one? Every session becomes a replay you can watch any time." -> Done.

**Copy notes for Lewis:** live label says "Today's focus" not "Tonight's" — recommend mirroring it. All copy emoji-free. This IS the ~35-line copy doc PF-23 was waiting on.

**Build checklist:** §23.72 vbb-marker (index + settings) + sw.js CACHE_NAME bump, same atomic commit; §23.24/25 recompute PM across vyve-site + VYVEBrain at commit time; §23.76 precache both new files; honour §23.36/§23.47/§23.58/§23.59. Budget ~84s followed fully (4x5s slides + 7x8s spotlights + 2 hops + fades).

---

## IN PROGRESS — Check-in merge (PM-484 / PM-478 spec)
### Weekly deepened + monthly merge + AI debrief engine
### Structure shipped PM-484 (2026-06-05). Pending Lewis copy + Phil clinical sign-off for question wording.

**Status:** DB migration + EF v22 + HTML branching flow LIVE. Question copy is placeholder pending Lewis/Phil sign-off. Build in a fresh session. Member-facing change on the whole server.url cohort. Claim fresh PM number(s) at commit time.

**Blocked on:**
- Lewis: member-facing copy for dimension labels, branch prompts, improvement question
- Phil: negative branch prompt + stress dimension clinical review
- Dean: monthly cadence trigger decision (calendar-anchored rec, not locked)

Everything else is build-ready. Structure, data sources, AI rules, fallbacks all locked.

---

### WHY

The current weekly check-in is one mood slider + optional free text. It produces thin AI recommendations that don't reflect what the member actually did, how their week compared to their normal, or what's driven their mood. A member can score 4 after a strong week because of one bad day — the AI has no way to know. The monthly check-in is substantially better but lives as a separate surface duplicating the entry point. This build collapses both into one intelligent, branching, data-rich check-in that produces a genuine weekly debrief.

---

### BUILD ORDER

**1. DB — Add columns to wellbeing_checkins**

Add: `check_in_type` (text, default 'weekly', values: weekly|monthly), `dimension_energy` (smallint, nullable), `dimension_sleep` (smallint, nullable), `dimension_stress` (smallint, nullable), `dimension_body` (smallint, nullable), `branch` (text, nullable), `drivers` (text[], nullable), `improvement_focus` (text, nullable). All nullable — existing rows unaffected.

VERIFY: migration applied, existing rows intact.

**2. DB — checkin_questions new weekly version**

Add new weekly question set version to `checkin_questions` reflecting deepened structure (dimension taps + branching driver + improvement question). Keep existing monthly set intact. New weekly version active from build date forward.

**3. wellbeing-checkin EF — enriched signal assembly**

Before the Anthropic call, assemble full signal block. Sources (all existing tables, no new infrastructure):

- `member_home_state` WHERE member_email — this_week counts (habits/workouts/cardio/sessions), goals (target vs done), streaks (current + best per type)
- `member_stats` WHERE member_email — baseline_30d averages per activity type, at_risk, needs_support, programme name + week + active flag
- `wellbeing_checkins` ORDER BY created_at DESC LIMIT 4 — weekly_mood_last_4 scores
- `daily_mood_checkins` WHERE mood_date >= today-7 — daily_mood_7d array (null for missing days)
- `monthly_checkins` ORDER BY created_at DESC LIMIT 1 — last monthly dimension scores (sleep/stress/energy/social/physical)
- `member_health_daily` WHERE date >= today-7 — steps per day (HealthKit members only)
- `member_health_samples` WHERE sample_type='sleep' AND start_at >= today-7 — sleep per night (HealthKit only)
- `session_views` + `replay_video_views` WHERE logged_at >= week_start — session_types watched this week

HealthKit null-safety (applied during assembly, before prompt build):
- Sleep: count nights with data in the week. If < 3 → sleep_avg_hrs: null, sleep_data_confidence: 'insufficient'
- Steps: if weekly sum < 500 (phone left home) → steps_this_week: null
- No HealthKit connection → health_kit: null
- AI prompt instruction: never reference any field that is null — skip it entirely

Derive server-side before call:
- tone_required: positive branch → 'affirming', negative → 'empathetic', neutral → 'balanced'
- returning_member: days_since_last_activity >= 7
- branch: mood >= 7 AND >= 2 positive dims → positive; mood <= 4 OR stress=high OR energy=low → negative; else neutral

Pre-filter habits list to 6-8 relevant to branch + improvement_focus (do not pass all 34 to the model). Pre-filter content list to 4-5 relevant options.

VERIFY: real invocation against a member with full data. Check null fields absent from output. Check tone on negative branch.

**4. wellbeing-checkin EF — Anthropic call + response parsing**

Model: claude-sonnet-4 (keep — quality matters on empathetic cases).
Max tokens: 600 (up from previous cap).

Update system prompt with full AI hard rules:
1. tone_required mandatory — never open with positivity when empathetic
2. Compare against member's own baseline_30d, never an abstract ideal. If baseline cardio = 0, never flag missing cardio.
3. daily_mood_7d contrast detection — mostly high trend + low weekly mood = likely one hard day, say so. Consistently low trend = acknowledge and support, no contrast framing.
4. monthly_scores_last for pattern detection — sleep low 2+ months = name the pattern. Improved = acknowledge progress.
5. Reference this_week vs baseline: "two workouts is ahead of your usual" not "you only did two workouts"
6. Active streaks are motivational fuel — reference them. Never mention a streak of 0.
7. Null fields are invisible — never reference absent data.
8. at_risk / needs_support flags silently shift tone before member answers anything.
9. 5-8 sentences flowing prose — no bullet points, no headers, no lists.
10. End with one concrete suggestion tied to improvement_focus.
11. New line: HABIT: [name from filtered list] — [one sentence why]
12. New line: CONTENT: [name from filtered list] — [one sentence why]

Parse response server-side: split on HABIT: and CONTENT: lines, return as structured fields (debrief_text, habit_name, habit_reason, content_name, content_reason).

**5. wellbeing-checkin.html — Question flow rebuild**

Replace single-slider flow with 5-step branching flow:

Step 1: mood slider 1-10 (unchanged UI)
Step 2: dimension taps — 4 cards (Energy/Sleep/Stress/Body), 3 options each, single-tap select. Labels per Lewis sign-off.
Step 3: branching driver question — multi-select chips. Prompt text + options set by branch computed from steps 1+2. Same branch thresholds as server.
Step 4: improvement question — single-select chips. Prompt adapts (positive vs neutral/negative). Positive branch includes "Nothing — I'm happy with everything" option.
Step 5: free text optional (unchanged).

Progress indicator shown across all steps.

New member grace: if days_since_joined < 7 → show "come back on [date]" state, no flow.
Returning member: if days_since_last_activity >= 7 → show wrapper card before step 1: "Welcome back — we've missed you. Take a moment to check in."

**6. wellbeing-checkin.html — Results screen**

Three components rendered after EF response:

6a — Activity recap strip: habits/workouts/cardio/sessions this week vs goals. Read from EF response. Simple count display, no AI.

6b — 7-day mood graph: bar chart from daily_mood_checkins last 7 days. Y axis 1-5 (Not great/Meh/Good/Great/Amazing). Graceful "no data" state if < 3 entries.

6c — AI debrief: prose paragraph. Below it two cards:
  - Habit card: habit_name + habit_reason + "Manage my habits →" deep link to settings habits section
  - Content card: content_name + content_reason + link to sessions page

**7. sw.js + vbb-marker atomic bump**

CACHE_NAME suffix bump + vbb-marker +1 in index.html AND settings.html in same commit. PM-299 invariant.

**8. VERIFY end-to-end**

- New member (< 7 days joined): grace state shown, no flow
- Returning member (>= 7 days inactive): wrapper shown before step 1
- Positive branch: affirming opener, "nothing" option present, habit from movement/nutrition pot
- Negative branch: empathetic opener, never upbeat, habit from sleep/mindfulness pot
- HealthKit member, patchy sleep (< 3 nights): sleep not referenced in debrief
- Non-HealthKit member: no HK fields referenced anywhere
- at_risk=true member: tone pre-shifted before questions answered
- Monthly cadence slice: SKIP until Dean locks cadence decision

---

### KEY FILES

- wellbeing-checkin.html (full page rebuild)
- wellbeing-checkin EF (signal assembly + Anthropic call + response parsing)
- DB migration (wellbeing_checkins new columns)
- checkin_questions (new weekly version row)
- sw.js + index.html + settings.html (vbb-marker + cache bump)

---

### COST

~0.68p per check-in on Sonnet 4 (~1,100 input + ~350 output tokens). Capped once/week. ~£14/month at 500 members. No optimisation needed until 5,000+ active check-ins/month.

---

### DECISIONS LOCKED 2026-06-05

- One auto-routed entry replaces separate weekly + monthly surfaces
- One store (wellbeing_checkins) + type discriminator — no forked storage
- Weekly deepened to branching multi-dimension flow (~45 seconds)
- Branch thresholds: mood >= 7 + 2 positive dims = positive; mood <= 4 OR stress overwhelming OR energy drained = negative; else neutral
- Habit recommendation: suggest only (Option A) — one tap to settings habits section. No auto-swap, no cap enforcement in this flow.
- Content recommendation: one link to relevant session/replay category
- AI signal enriched with full member context: home_state + stats + trends + HealthKit
- HealthKit null-safety: < 3 nights sleep = don't reference; < 500 steps = don't reference; null health_kit = skip entirely
- Baseline = member's own 30d average, never an abstract ideal
- tone_required derived server-side from branch
- 5-8 sentence debrief, flowing prose, no bullet points
- Sonnet 4 for all check-in AI calls
- New member grace: < 7 days joined, no check-in
- Returning member: >= 7 days inactive, wrapper before step 1
- Monthly cadence: LOCKED — calendar-anchored. First check-in on/after 1st of month = monthly (absorbs that week's weekly). Late-join grace: joined within last 14 days of month → skip that monthly, weeklies only, first monthly at next 1st.

---

### DEFERRED

- Monthly cadence routing — LOCKED calendar-anchored (see decisions). Build this slice in same session as weekly build.
- Live/replay merge — separate gated backlog item, do not touch


## QUEUED BUILD — Habits autotick v2 (Dexie-first instant + server history-backfill) — spec'd PM-477, build pending

**Status:** fully spec'd, NO code shipped. Build in a fresh session. Production-affecting (a live hub page on the whole server.url cohort + a production EF + a new Dexie store + a habit_library data change + history-backfill). Execute in order below; talk-first only if something here is genuinely unclear. Claim fresh PM number(s) at commit time. Full reasoning in changelog PM-477.

WHY: home shows a fake "8,000 steps" under the 10-min walk and no live Apple Health progress (both = the subForHabit stub); habit autotick is today-only while activity credit already backdates. We're making habits tick instantly from Dexie and backdate like workouts do.

BUILD ORDER:
1. WALKING-WORKOUT RULE (data + server parity).
   - habit_library "10-minute walk": replace health_rule {op:gte,agg:sum,value:1,metric:distance_km,source:daily,window:today_local} with a discrete walking-workout rule — member_health_samples sample_type='workout', workout_type='walking', duration (end_at-start_at) >= 10 min (600s), window today_local. Define the new shape (e.g. source:'samples_workout', workout_type:'walking', agg:'duration_minutes', op:'gte', value:10).
   - member-dashboard EF: add evaluator branch for the new workout-duration shape so server reconciliation matches client. VERIFY by real invocation against a member with a walking workout today (188 walking samples exist to test).
2. LOCAL EVALUATOR (new shared JS, e.g. health-eval.js).
   - Pure fn (health_rule, hk_snapshot, dexie_local) -> {satisfied, progress:{value,target,unit}}. Mirror member-dashboard logic EXACTLY (JS<->SQL parity). Handle all live shapes: steps gte (daily), distance, sleep duration last_night, walking-workout duration today, plus activity-table rules (30-min cardio, complete-a-workout) read from Dexie cardio/workouts (already local).
   - Sleep progress emitted in HOURS (value/target 1dp + 'hrs'), never minutes (rule value stays 420 internally).
3. DEXIE HK SNAPSHOT STORE (NEW store — never re-key an existing store, §23.83).
   - healthbridge.js caches today's aggregates each sync: steps, distance, sleep_minutes, walking-workout total/longest duration. New Dexie store + additive db.version bump. FALLBACK_* const for cold paint. Lets index/habits paint progress instantly from local before the plugin re-reads.
4. WIRE index.html + habits.html TO THE LOCAL EVALUATOR.
   - Both pages: read HK snapshot from Dexie -> run local evaluator -> instant progress + optimistic autotick write (daily_habits Dexie-first, REST sync background; reuse existing write path + synthetic key member|date|habit).
   - DELETE subForHabit() in index.html (~L2176) and its call site; home habit rows render real health_progress via formatProgress parity with habits.html.
   - sw.js precache + vbb-marker (index + settings) + CACHE_NAME bump in the SAME commit (PM-299 invariant).
5. SERVER HISTORY BACKFILL (reconciler).
   - On sync and/or a member-dashboard pass: walk synced HK history (member_health_daily per-date steps; member_health_samples dated workouts/sleep) and write backdated daily_habits autotick rows per qualifying day.
   - ANCHOR floor = max(member join, habit_assigned_at, FIRST GENUINE ENGAGEMENT). First engagement = earliest real VYVE activity (first daily_habits/workout/cardio/session/checkin), NOT first login, NOT the Stripe date.
   - Only write (member, day, habit) with NO existing daily_habits row (never override manual yes/no/skip). Respect 1/day cap (over-cap -> activity_dedupe).
   - UNIFORM across B2C/B2B (§23.93). Backfill retroactively rebuilds streak/score/certificates/charity for those days (desired — real activity; a returning member may get a streak/certificate on login).
6. VERIFY end-to-end: member-dashboard invocation for the walking rule; home shows live progress + auto-ticks on open; backfill writes only within the engagement window and skips manual rows.

KEY FILES: index.html (subForHabit ~L2176, loadHabits ~L2031, renderHabitList ~L2108), habits.html (runAutotickPass, formatProgress ~L680, member-dashboard v51 fetch), healthbridge.js (foreground sync, queryAggregated/queryWorkouts, _localTodayDate), db.js (Dexie SCHEMA_V22 — add new store as next version), member-dashboard EF (rule evaluator + health_progress), habit_library (the walk rule row). Autotick habits with rules: 8k steps, 10k steps, sleep 7+ (420min/last_night), 30-min cardio (activity_tables), complete-a-workout (activity_tables), + new walking-workout walk.

## Thumbnails / Storage / deployment cleanup (added 2026-06-04, PM-475)

- **Delete one-shot seed-host-thumbnails EF.** Seeded the session-thumbnails bucket from GitHub-pinned bytes (commit 153567ad); job done, EF is now dead weight. No MCP delete tool — remove via Supabase dashboard or CLI.
- **Remove dormant /assets/hosts/*.jpg repo copies** from vyve-site — now unreferenced (image_url points at Storage). Tidy, low priority, harmless if left.
- **Calum / Alan / Shan host thumbnails** are staged in Storage but unused until those hosts are scheduled in calendar_occurrences.
- (carried) rotate the exposed service_role key; deactivate ~40 stale empty-notes calendar_occurrences rows; move the live runner off Dean's Mac to a real 24/7 box. (Calendar regeneration DONE PM-686 — next regen due before 2 Aug.)

## Replays follow-ups (added 2026-06-04, PM-465)

- **Move playlist-insert pre-create → completion (optional hardening).** `session-publish` adds each broadcast to its playlist at creation (best-effort). The §23.91 duration guard already stops not-yet-aired (P0D) items surfacing, so this is belt-and-braces: inserting at the broadcast-complete transition (runner / broadcast-status) means playlists only ever contain aired sessions.
- **Replay ordering.** `refresh-replay-videos` labels "latest" by `published_at` = playlist-ADD time, not air time. The just-backfilled older Yoga `d-dNe6W-o4I` now ranks above today's `9b-xSEfEIKc`. If air-time order matters, sort by a stable recorded/scheduled date.
- **Dev-test record.** `JEFNPGKhQqY` ("PM-327 Device Walk") still carries a broadcast_id on its occurrence; excluded from replays by the title filter — null it for full detachment if desired.
- **`replay-playlist-backfill` EF** retained (idempotent, `?dry=1`, eligibility-guarded). Delete when no longer needed.

## Live content go-live (added 2026-06-02, PM-437)

### NEXT — live content go-live (PM-439, 2026-06-02) — continue here
- [x] Masters renamed via ~/vyve_rename.py (truncation gotcha logged).
- [x] 30-day calendar WIRED + CONTENT APPLIED PM-451: all 116 active rows (4 Jun–2 Jul) carry final titles (Part->Session; Flexibility Route/Routine->Session), Dean-approved live-voiced session_description, host_name filled (Alex/Nicola/Lewis/Lucy/Jamie), and image_url thumbnails. 5 host/type cards committed to vyve-site assets/hosts/ (commit cecf2f7f). Thumbnails mapped by session TYPE not per-host (Nicola's card is breathwork-branded but she hosts most yoga/pilates).
- [x] `*-live.html` YouTube broadcast-status probe (override clock-only LIVE gate) — SHIPPED PM-445 (broadcast-status EF + session-live.js effectiveState; §23.65 resolved). live:true branch needs real-push device walk.
- [x] Token-health monitor — LIVE PM-447: EF `youtube-token-health` + cron job 35 (`0 4 * * *`), refresh+authed-call probe, send-email alert to team@ on failure. Real-send branch unexercised.
- [ ] Stand up the always-on box; place vyve-live-runner.py; turn OFF session-publish hourly cron once box owns creation.
- [ ] PM-451: confirm the 5 host-card thumbnails render in-app (sandbox can't reach online.vyvehealth.co.uk — 403 even on logo.png; files verified present via raw GitHub API). Do NOT re-host on a sandbox 403 (§23.86).
- [ ] PM-451 decision: keep TYPE-based thumbnails or flip to strict per-host (one UPDATE on calendar_occurrences.image_url); also decide whether to drop numeric labels on flows/flexibility titles.
- [ ] PM-451: wire runner/session-publish so each created YouTube broadcast sets title + description from calendar_occurrences AND uploads the matching assets/hosts/<card>.jpg as the YouTube thumbnail (currently uploads the per-session frame card).
- [x] PM-453: home "live sessions this week" carousel now reads real upcoming sessions from calendar_occurrences (titles/hosts/thumbnails); static sessions-data.js fallback on cold boot, upgrades once Dexie hydrates (vyve-site 44de2cf9). node --check passed.
- [x] PM-455: FIX home carousel — PM-453 read calendar_occurrences via `.all()` (undefined on catalogue stores → threw → silent static fallback = the "old sessions" Dean reported). Corrected to `.allFor(null)` (vyve-site 0a242751). §23.87 added. Still gated on device loading the new index.html + Dexie having synced the calendar.
- [x] PM-456: FIX home carousel thumbnails — blank because a parallel session made calendar_occurrences.image_url root-relative (/assets/hosts/..) and the thumb builder prepended a 2nd slash (//assets.. = broken host). Builder now leaves leading-slash paths intact (vyve-site 63c73dbd). node --check passed. image_url is root-relative going forward.
- [ ] 3 missing talk videos: "Why I Founded VYVE", "Doing Hard Things", "Not Drinking Alcohol".
- [x] Place vyve-live-runner.py into a repo — DONE PM-446: VYVEBrain scripts/vyve-live-runner/ (runner + systemd + launchd + env.example + README; reconstructed from the PM-439 autostart-dead model). Not yet smoke-tested on the box.


- [ ] Resolve a category RTMP ingest+key live via YouTube Data API liveStreams.list(part=cdn) (Yoga/Pilates & Stretch first).
- [ ] ONE test simulated-live push from Dean's Mac -> confirm session-publish binds broadcast + playlistItems.insert + replay appears.
- [ ] Seed Replays: upload back-catalogue (53 Movement -> Yoga/Pilates & Stretch playlist, 21 Mind -> Mindfulness & Mindset playlist) so Replays is populated for sales now.
- [ ] Stand up always-on ~GBP4/mo box (Dean creates/pays; Claude configures); get riverside_ masters onto it once.
- [ ] Wrap simulated-live-worker.py into a multi-session scheduler reading calendar_occurrences.
- [ ] Wire the 30-day calendar into calendar_occurrences (map readable titles -> riverside_ filenames).
- [ ] BLOCKED: Suicide and Men airing -> Phil clinical sign-off + crisis signposting (§23.84).
- [ ] PENDING: 6th Lewis video; morning_stillness classification.

## Trial / membership (added 2026-06-03, PM-438)

- [ ] DEAN (Stripe dashboard, closes the loop): register webhook endpoint `https://ixjfklpckgxrwjlfsaaz.supabase.co/functions/v1/stripe-webhook` (events `checkout.session.completed` + `customer.subscription.deleted`) and set its signing secret as `STRIPE_WEBHOOK_SECRET` in Supabase Edge Functions secrets. Until set, payments succeed but membership won't flip (webhook fails safe).
- [ ] DEAN: confirm "Allow promotion codes" stays ON for the conversion Payment Link (`bJeeVe0Cs1Em53D5oh93y01`) else £20 is charged instead of £10.
- [ ] Read-path EF enforcement: add the membership gate to `member-dashboard` (and any other read EFs) so an expired member can't pull data even if the client gate is bypassed. Deferred at PM-438 (write-guard + client gate judged sufficient for trial; core EFs are 400+ lines, hand-redeploy = transcription risk).
- [ ] Extend the write-guard (`assert_member_not_expired`) beyond daily_habits/workouts/cardio/session_views to: mind_activities, movement_activities, connect_checkins, wellbeing_checkins, monthly_checkins.
- [ ] Web "Start free trial" sign-up flow (inverts the current pay-first signup) — NOT built (was step 6). Needed before public trial marketing.
- [ ] `continue.html` no-`cid` path = manual reconcile (rare; member reaches checkout without a bound id). Decide auto-handling later.
- [ ] GITHUB_PAT_CLAUDE expires 20 Jun 2026 — rotate before expiry (Vault `GITHUB_PAT_CLAUDE` on project ixjfklpckgxrwjlfsaaz).
- [ ] PM-476 (design locked, BUILD PENDING): Blended "easy first" welcome milestone — ANY 30 activities (sum of the five `get_certificate_buckets` buckets) funds the first donated month. New one-shot derived metric; NO new daily/weekly cap (capped buckets give 7/day ceiling, ~5-day floor). Framed openly as easy-first; per-pillar rule resumes after.
- [ ] PM-476: Milestone CELEBRATION sheet on threshold-cross (Member Prompts infra PM-375) — charity win + offer AVAILABLE ("lock in whenever ready"), NOT a hard ask. Keen members can self-convert here.
- [ ] PM-476: Day-~24 timed conversion nudge before the wall — urgency-led, NO "you earned a free month" claim (members may not have hit the milestone).
- [ ] PM-476 DECIDED: 30-day trial length stays (not 14); £10-off-FOREVER is the standing conversion price (resolves §22); check-ins count toward the blended 30 (recommendation, Lewis to confirm).
- [ ] PM-476 GATE: named charity partner unconfirmed — plural "charity partners" copy claim is load-bearing; settle named partner or soften wording before member-facing. Lewis.
- [ ] PM-476 ENG (Dean, future price rise): keep the £10-off lifetime lock by updating price on the SAME subscription / persisting subscription-level discount — never migrate converters to a fresh Stripe Price without re-attaching VYVE10.

# VYVE Health — Backlog

Last triage: 2026-05-26 (Chat 3 of brain overhaul). Recomposed from ~5,923 lines / 206 headings / 480 sub-headings of chronological journal into surface-bucketed live items. SHIPPED blocks dropped against changelog. Stale "Added" items pre-14 May dropped per triage rule. Bus-campaign chronicle (PM-30 → PM-65, 08–11 May) dropped — all shipped, surface state in master §19.

## NEXT FOCUS — Movement V2 CLOSED (28 May). Pick next from queued items below (PM-308 cardio walking removal, Achievements post-trial overhaul, In-App Tour, Layer 2 Realtime bridge).

**Movement V2 is member-reachable.** Step 4a-pre-2, 4a-page (Chunk B render scaffolds), 4b (multi-active-by-surface), and the plan-picker all SHIPPED 27-28 May (see changelog). Live flow: Body → Movement → State 5 "Start a movement programme" → `movement-plans.html` picker → pick Just Steps / Foundation / Distance Builder → set target → Start → movement.html renders step ring + week card. Members can hold a workouts plan AND a movement plan concurrently.

**SHIPPED 28 May:** PM-420 4c — Today's Movement card (`dc1108c5`), Sport pill (`f6aa4131`), Add Activity modal (`eaaf8683`). PM-420 4d — plan-fit nudge: `evaluate_plan_fit()` SQL-function cron (`vyve-evaluate-plan-fit` 04:00 UTC, jobid 32) + gold banner + carryover modal (`ec8bcffa`). All member-facing surfaces + the cron done. **PM-425..431 (28 May) closed the rest: Movement V2 is ~100% functionally complete.**

**Movement V2 — DONE (PM-425..431, 28 May):**
- ⚠️ **Dexie wpc PK→id bump (PM-425 `fb5e91e9`) — REVERTED PM-436 (`e44b2357`)** — re-keying the existing store jammed the iOS upgrade → noop shim → blank rings/habits/progress on every v21 device (§23.83). Reverted to `member_email` PK. Multi-plan-local mirror deferred; re-do via a NEW id-keyed store + device test (Option B, below), never re-key.
- ✅ **Picker → portal standard + instant start (PM-426 `030bab25`, PM-427 `a6c6b431`)** — theme.css/nav.js/cache-first paint; `startPlan` mirrors the new active row into Dexie so the home page reflects the switch instantly; Just Steps start fixed (`plan_duration_weeks` NOT NULL → sentinel `0`).
- ✅ **Render all plan shapes (PM-429 `74e3cb6d`, PM-431 `326532d4`)** — `renderPlan` routes any sessionless movement plan to the state layer; was bailing to no-plan for Just Steps then locked_ramp (§23.81 hard rule). prog-card names locked-ramp plans.
- ✅ **Live baseline recompute (PM-428 `7d2bc123`)** — `recompute_step_baselines()` SQL fn + cron jobid 33 (04:10 UTC); picker slider ceiling/default fixed. Modal opacity + editable Just Steps target (PM-430 `ee9ba078`).
- Post-trial backlog (not blocking): Return to Movement plan still INACTIVE pending Phil clinical sign-off; prompt-pool copy is Claude placeholder pending Lewis sign-off; Achievements-style UI polish pass on the movement ring.

**Movement V2 state matrix reference** (`<body data-mv-state="N">` on movement.html): 1=structured+HK, 2=structured+no-HK, 3=Just Steps+HK, 4=Just Steps+no-HK, 5=no plan. CSS-only show/hide off the body attr. Branch on `programme_json.surface==='movement'` (NOT category — spec drift, see changelog). plan_type values are `just_steps` / `locked_ramp`.

**Original Thursday pickup paragraph (still valid background):** Two binaries are with the platforms. iOS 1.4 build 3 sitting "Waiting for Review" in App Store Connect (auto-release on approval, 24–48hr expected). Android 1.0.5 versionCode 50 — needs confirmation Dean clicked "Send 1 change for review" from Play Console publishing overview (Pending #1 below). Assume approved by the time the next session opens; otherwise unblock by clicking through.

The session-opening question is the architectural decision PM-411 Item 1 Bug 3 / PM-413 Pending #5 left unresolved: capacitor.config.json is hybrid dev-loop + LiveUpdate today. Members on iOS 1.4 / Android 1.0.5 will be dev-loop mode, not bundled, contradicting §23.42. Real call between (a) proper bundled mode with @capawesome/capacitor-live-update on the prod channel, (b) accept dev-loop for trial cohort, (c) other. Talk-first; this drives the Mac-local sync work below.

Once doctrine is locked, do the Mac-local audit and selective commit per PM-413 Pending #2 — diff `~/Projects/vyve-capacitor` against remote `7a54c876`, curate legitimate ship-state changes (capacitor.config.json, build.gradle 1.0.5/code 50, Info.plist iPad orientation restore, package.json + lockfiles for @capawesome/capacitor-live-update@8.2.2, Android #0D2B2B background, regenerated mipmaps, Xcode/SPM lockfiles), atomic-commit. While there, knock out the small ones: .gitignore `www/` entry per the vyve-capacitor-mac-sync playbook (PM-413 Pending #4), Mac-local junk cleanup (literal `.git`/`.github` files + 7 .bak files at vyve-capacitor root, PM-413 Pending #3), and the keystore + password `Weareinthis2026!` into 1Password (P0 launch blocker — if Dean's Mac is wiped before keystore + password are co-located, the Android app is un-shippable for the lifetime of `co.uk.vyvehealth.app`).

Then PM-411 Bug B — the surgical 30–45min one. Workout selection doesn't update until reload. PF-7 Dexie stale-read race in `workouts-programme.js` L78–89. activateProgramme correctly clears cache + nulls programmeData + cacheRow + calls loadProgramme, but loadProgramme's Dexie-first path calls criticalHydrate un-awaited then reads Dexie immediately — Dexie still has the OLD plan because sync hasn't propagated. Single-file fix: await criticalHydrate, OR skip Dexie on cache-bust contexts, OR invalidate Dexie row before reading.

Post-binary the canonical NEXT pointer is the second pass of "in-app feature completeness" from PM-401.b: monthly check-in credit gap (real bug, members get zero credit today — see Infra / Data bucket), then certificates → leaderboard parity, then Your Journey scope decision (design talk before build). Bug A architectural (movement plan structurally homeless, 4-6h) sequences after trial data lands. Bug C (Browse Library runtime error) needs device console — schedule when Dean's at a Mac.

## PARKED — PM-411 — Body-hub overhaul Bug A/B/C

(Item 1 Bundle-prep CLOSED in PM-413. Item 2 + schema-architecture note preserved verbatim below.)

Surfaced during deanonbrown2@gmail.com end-to-end onboarding walk this session.

**Bug A — Architectural (4-6h, post-trial)**: Movement plan structurally homeless. exercise.html hero CTA L350 hardcoded `href="workouts.html"` ignoring programme category. Every workout_plan_cache row has `category: null` — no branching surface exists. Fix needs:
- programme_library category backfill
- Onboarding EF v37 writes category into workout_plan_cache
- exercise.html branches: `category === 'movement'` → movement.html, else → workouts.html
- movement.html consumes + displays programme card at top (currently only has session-logging pills + Mark as Done button)

Note: movement.html L440-486 already filters `category === 'movement'` — it's READY to consume categorised plans, nothing's writing them.

**Bug B — Surgical (30-45min, Thursday)**: Workout selection doesn't update until reload. PF-7 Dexie stale-read race in workouts-programme.js L78-89. activateProgramme flow correctly clears cache + nulls programmeData + cacheRow + calls loadProgramme, but loadProgramme's Dexie-first path calls criticalHydrate UN-AWAITED then reads Dexie immediately — Dexie still has OLD plan because sync hasn't propagated. Single-file fix: await criticalHydrate, OR skip Dexie on cache-bust contexts, OR invalidate Dexie row before reading.

**Bug C — Surgical (30-60min, needs device console)**: Browse Library tab broken at runtime. Static check clean — switchTab + loadLibrary + DOM + RLS + 30 programmes + CATEGORY_LABELS + loadPausedPlans all present. Failure is runtime JS error swallowed by outer try/catch. Candidates: getJWT undefined for new accounts, VYVEData API drift, async error in renderLibrary first-paint.

### Schema-architecture note (banked, not codifying solo)

`workout_plan_cache` has TWO contradictory UNIQUE indexes:
- `workout_plan_cache_member_email_key` UNIQUE on `(member_email)` — blocks multi-row
- `workout_plan_cache_one_active_per_member` UNIQUE on `(member_email) WHERE is_active=true` — assumes multi-row design

workout-library EF v13 paused-plan logic at L60-84 likely never works correctly — upserts at L98-110 `onConflict: 'member_email'` silently overwrite the previous plan due to the broader UNIQUE constraint. Empirically confirmed on test account: 1 row only, no paused Movement preserved after swap to Strength. Promotes to §23 on second contradictory-UNIQUE occurrence.

## PM-420 — Movement V2 build (PM-418 was the spec lock; PM-419 collided on Focus card fix)

**Spec locked PM-418, 27 May 2026.** Full design captured in `playbooks/movement-v2-spec.md`. Build chats read playbook once and execute — no design re-derivation needed.

**Scope.** Closes PM-411 Bug A (movement plan structurally homeless — category backfill + branching) and goes well beyond it. Adds the four-plan library (Just Steps / Foundation / Distance Builder / Return to Movement), state-aware `movement.html` (5 render variants), HK history pull at consent (90-day baseline via Capgo `queryAggregated`), plan-fit nudge intelligence, manual-step support for non-HK members, and full ecosystem wire (bus + Supabase + 10-surface completeness test).

**New §23 hard rules:** §23.78 (PM-420 step 4a-pre-1) — CHECK constraint write-surface audit before adding to pre-existing tables (earned the hard way via the production movement quick-log outage). The engagement-aggregator triple-occurrence rule originally slated as §23.78 — every new activity table requires touching SQL function + JS twin + dirty-mark trigger + tile renderers + charity reconcile + 10-surface completeness test — still needs its own number; will land as §23.79 when codified.

**Build sequence (7 steps, ~6-7 Claude-assisted sessions):**

1. ✅ **SHIPPED PM-419** — `programme_library.surface` column added (CHECK in `workouts` / `movement`), backfilled `workout_plan_cache.programme_json.surface` from existing plan_type. Onboarding EF v85 stamps surface. Naming: used `surface` not `category` (overrode playbook).
2. ✅ **SHIPPED PM-420 step 2** — Four movement plans seeded into `programme_library`: Just Steps (active), Sedentary Reset Foundation (active), Distance Builder (active), Return to Movement (INACTIVE pending Phil clinical sign-off). Prompt copy is Claude-drafted placeholder pending Lewis sign-off.
3. ✅ **SHIPPED PM-420 step 3** — HK 90-day baseline history pull at consent. EF `pull-baseline-steps` v1 deployed (verify_jwt:true). `healthbridge.js` v0.7→v0.8 with `pullBaselineHistory()` runs 3×30-day Capgo windows, fire-and-forget from `connect()`. Members get `baseline_steps_p50/p25/p75` + `baseline_source` + `baseline_activity_band` stamped in 2-3s post-Allow.
4. **IN PROGRESS PM-420 step 4a-pre-1** ✅ + **step 4a-pre-2** PARTIAL:
   - ✅ `movement_activities` extended (7 new columns: display_name, manual_steps, counts_for_charity, hk_native_uuid, hk_promoted_to, prompt_kind, metadata JSONB)
   - ✅ Source CHECK loosened to accept legacy 'manual' + new vocabulary (hot-fix from §23.78 trap — see master.md)
   - ✅ `manual_step_estimates` new table with RLS + email-lc trigger
   - ✅ Onboarding EF v86 deployed (deactivate-old + insert-new pattern, replaces upsert-via-on_conflict)
   - ❌ PENDING: `workouts-session.js` line 850 site patch (`&is_active=eq.true` filter add) — staged at `/home/claude/site/staging/`
   - ❌ PENDING: drop `workout_plan_cache_member_email_key` migration (full unique on member_email)
   - ❌ PENDING: `movement.html` V2 page build (the big mockup → production translation, est ~2 sessions)
5. Plan-picker page with smart sort by baseline fit + Just Steps slider with safeguards (1.3× warning, 1.5× cap) + adaptive toggle (~1 session) — folds into 4a-page since picker IS one of the 5 render variants
6. `evaluate-plan-fit` daily cron at 04:00 UTC + nudge banner UI + plan-up acceptance flow preserving streak + certificate state. Plan-down is NOT automatic — Phil-shaped human check-in only (~1 session)
7. Wire & subscribers audit per §23.78 (engagement aggregator triple-occurrence rule, not the new §23.78 CHECK-audit rule) — repo-wide grep for `movement:*` / `body:*` / `movement_activities` / `workout_plan_cache` / `baseline_steps_p50` subscribers, update SQL function + JS twin (`compute_engagement_components_v2` + `computeEngagementComponentsV2`), update `v_active_days`, add dirty-mark triggers on new tables, update charity reconcile (`charity_total_reconcile_and_heal()`), run 10-surface completeness test (~0.5-1 session). Also: `movement.html` quick-log writes should switch source literal `'manual'` → `'manual_log'` so the loose CHECK can be tightened back.

**Phil sign-off gates before ship:**
- Return to Movement plan content (audience overlaps post-injury / post-pregnancy)
- Just Steps slider max caps (especially Return to Movement plan max)
- Plan-fit nudge copy variants for each source plan
- HK consent disclosure copy addition

**Lewis copy gates:**
- 5 Today's Movement prompt text lines (one sentence each, generic — no curated content)
- 4 plan descriptions (library cards)
- Plan-fit nudge copy variants per source plan

**Out of scope for v1** (documented in playbook §13): Office Worker Mobility as distinct plan (folded into Foundation), automatic plan-down, adaptive bumps for manual-estimate members, curated mobility video content (post-trial), Android Health Connect (parked until device), real-time plan-fit evaluation (cron-driven correct starting shape).

**Mockup ship target:** `/mnt/user-data/outputs/movement-v1-final-spec.html` from the PM-418 session — source of truth for visual design. Playbook source of truth for logic.

**Dependencies:**
- Sequenced AFTER PM-413 (iOS 1.4 / Android 1.0.5 store approval) — trial cohort first
- Sequenced AFTER PM-411 Bug B (workout-library Dexie stale-read race) — Thursday-grade surgical fix
- Reads playbook `playbooks/movement-v2-spec.md` as single-read spec reference

## PARKED — Original PM-411 carry-over notes preserved

## Pre-bundle / app store (PM-413 follow-ups)

**Play Console final click (P0, confirm next session).** Confirm `In review` not `Draft` on play.google.com/console for VYVE Health Android. If still `Draft`, click `Send 1 change for review` from publishing overview.

**vyve-capacitor remote sync (P0 Thursday).** Mac local diff against remote `7a54c876` and atomic-commit per playbook — full file list in NEXT FOCUS above. Per the vyve-capacitor-mac-sync playbook, run BEFORE any new native edits to avoid layering more uncommitted state.

**capacitor.config.json doctrine — RESOLVED (PM-569, 9 Jun 2026): bundled mode (option a) chosen and SHIPPED.** iOS 1.7 is LIVE with `server.url` REMOVED → iOS members are bundled/frozen, updatable only via a Capawesome OTA (app `f9961f66-eb66-4102-b1c5-f9b2c7baeebf`, prod channel `89e12796`). Android bundled 1.0.6 vc51 still in review (Android members stay server.url-live until it lands). **P0 NATIVE PRIORITY — verify ONE Capawesome OTA push end-to-end (`--rollout 0.1` canary).** `live-update.js` OTA wiring shipped (PM-600) and bundled in iOS 1.8 + Android 1.0.7 (both submitted 11 Jun 2026, PM-602, in review). Once 1.8 approved + installed on a real non-Dean device: trigger `ota-deploy.yml` from vyve-site GitHub Actions (rollout=10), watch Capawesome Logs, verify vbb marker updates on cold start. That closes §23.106. Hard pre-Sage gate. Also outstanding: vyve-capacitor REMOTE is BEHIND Mac-local — the 1.5/1.6/1.7 ship-state is uncommitted on remote (latest remote commit PM-560 splash); curate + atomic-commit Mac-local → remote per PM-413 Pending #2.

**Mac local junk cleanup (P3).** `--exclude=.git` + `--exclude=.github` literal files (typo from earlier session) + 7 `.bak-pf14b` / `.bak2` / `.bak3` / `.bundled-backup` files at vyve-capacitor repo root. Tidy-up, not a blocker.

**`.gitignore` `www/` entry per playbook (P1).** Currently `www/` is rsync'd in from vyve-site but not committed. Not yet a problem because remote has no www/, but codify before the audit-and-curate pass to avoid accidentally committing 171 sync'd files.

**Keystore + password `Weareinthis2026!` into 1Password (P0 launch blocker).** Dean's 30s manual. Path `~/Projects/vyve-capacitor/android/app/keystore/vyve-release-key.jks`, PKCS12, alias `vyve-key`, SHA1 `CC:48:EA:AF:C1:47:ED:43:20:63:4F:FF:07:99:79:20:55:7D:23:B9`. If Mac is wiped before keystore + password are co-located, Android app is un-shippable for the lifetime of `co.uk.vyvehealth.app` on Play Store.

**`vyve-capacitor` git init + dirty tree commit + push to VYVEHealth/vyve-capacitor (P0).** Third-occurrence escalation. Cumulative uncommitted edits across `build.gradle`, `variables.gradle`, `keystore.properties`, `local.properties` over iOS + Android ships sit in unversioned working tree. `.bak-pf14b` / `.bak-pf14b-android` / `.bak` files are the only history. Any accidental file overwrite is unrecoverable.

**iOS encryption answer (banked).** Dean chose "Standard encryption" against research-backed advice of "None of the algorithms" for HTTPS-only apps (per Apple Developer Forums + official guidance). Standard requires export compliance documentation if Apple ever audits. Likely fine; if Apple asks for export docs post-approval, that's the audit trail.

**iOS App Review notes scan (P2, next submission).** Residual "PWA-based" framing was caught and rewritten this session; per §23.20 the product is no longer a PWA. Future submissions: scan App Review Notes for inherited PWA / "thin web wrapper" / "web shell" framing that could trigger Apple Guideline 4.2. Always describe as "native iOS app built with Capacitor wrapper".

**R8/ProGuard enable (P3, post-trial polish).** Play Console Warning 3 of 4 from PM-413 — no deobfuscation file. Future build improvement; makes crash stack traces more readable.

**Native debug symbols (P3, post-trial polish).** Play Console Warning 4 of 4 — no native code debug symbols uploaded. Same shape as ProGuard, harder to debug native crashes if they happen.

**Debug strip gating (P1, pre-next-binary, escalation pending home-surface verification).** PM-310 always-on live-tracker debug strip across the 8 `*-live.html` shells (via `session-live.js`) + `?debug=tracker` mind-video strip (via `mind.html`). Gate behind `localStorage.getItem('vyve_debug_tracker') === '1'`. **mind.html surface CLOSED PM-424 (`9300a0bf`)** — the PM-324 strip was leaking onto Today's Focus meditation play because PM-418 gated the open-time call but an ungated 1s poller re-inserted it; now guarded at `renderDebugStrip()` entry behind `vyve_dev_panel_unlocked`. **Remaining: the 8 `*-live.html` session-live strips** (PM-409.b gating still wants a device-walk confirm) + any other surface where `player-tracker.js` mounts a strip — apply the same function-entry guard pattern. PM-315 CSP fix for YT IFrame API still not validated on device walk — either validate first and remove strip, or keep flag-gated until next walk. Settings Reset Achievements + Force Refresh App buttons stay (intentional trial-period support tools). **PM-415 brain park (27 May): Dean flagged tracker debug visible on "main section" (likely index.html), suggesting the gating leak extends beyond the 8 live shells PM-409.b covered. First Thursday action: device-walk index.html with NO debug flags set, confirm whether debug strip renders. If yes, scope broadens to a full-surface sweep of anywhere `player-tracker.js` loads or `renderDebugStrip()` output is rendered. Promotes to P0 pre-bundle-rollout if confirmed (members on 1.4/1.0.5 would see this).**

**Native binary candidates for next cut.** When cutting binaries again, bundle: bundled exercise thumbnails + workout plan templates (audit total weight first — hundreds of images adds real MB), R8/ProGuard, native debug symbols, View Transitions API wire (PM-394 plan item — lower priority since snapshot-first paint already solves visible flicker; one chat as polish).

## Body hub

**Bug B (Thursday) + Bug A (post-trial) + Bug C (device-console session).** See PARKED block above. Bug A architectural sequence: programme_library category backfill → Onboarding EF v37 writes category into workout_plan_cache → exercise.html branches on category → movement.html consumes categorised plan.

**Exercise demo video coverage fill (P1, post-trial).** 129 of 297 rows in `workout_plans` have NULL `video_url` (43%). After PM-346 wired picker thumbnails to open the fullscreen player, members see dimmed thumbs on those rows = "no preview available". Honest but visible. Action: `GROUP BY plan_type` for NULL ratio first, then prioritise filming/sourcing. Likely distribution: PPL + Upper/Lower have high coverage; Home Workouts and Movement & Wellbeing have the gaps.

**PM-308 — Cardio walking removal + per-member custom kinds.** Specced fully (Dean's next ask, reading-pass + design-check before build). Cardio's fixed kind list shrinks to running / cycling / swimming / rowing / other (walking moves out — lives in Movement now). Plus: members add their own kinds ("Football" → persists for that member forever). Schema: new `member_cardio_kinds` table (member-scoped UUID PK, `member_email`, `kind_label`, `display_order`, `created_at`, UNIQUE on `(member_email, lower(kind_label))`, RLS member-scoped). Dexie SCHEMA_V16: `member_cardio_kinds: 'id, member_email, [member_email+kind_label], display_order'`. `cardio.cardio_type` value space: fixed values lose walking; member-defined as `custom:{slug}`. `cardio.html` UX: pill row with 4 fixed + N custom + "+ Add" pill at end. Cleanup: remove dead `r => r.logged_via !== 'movement'` filters in cardio.html / cardio-history.html / workout-history.html (no-ops post-PM-307). Estimate 2-3 sessions Claude-assisted.

**Exercise.html audit Commit 7 — Browse library prefetch (open).** workouts-library.js is NOT Dexie-wired (zero `VYVELocalDB`/`hydrate`/`prefetch`; 4 raw `fetch()`; has its own localStorage cache layer). Add background prefetch so the exercise library is warm by the time the member taps in. Dean's words: loaded in the background, already there on click.

**Walk-note persistence in the movement quick-logger.** The walk branch of movement.html `logMovement()` writes a `cardio` payload (`cardio_type:'walking'`, `duration_minutes`, `distance_km`, `client_id`) that does NOT carry the member's note. Non-walk branch persists `workout_name: sessionName`. Result: walk rows in Recent Movement + movement-history.html render the type-name ("Walk") as title, never the member's label. Fix: add the note to the walk's cardio payload (confirm cardio's free-text column name first — cardio.html's logger likely uses one). The mvlog render already shows `r.workout_name||r.notes||'Walk'` so walk titles light up automatically once populated. Not trial-blocking.

**Per-set save path (`tickSet` / exercise_logs) — same `await writeQueued` shape as PM-148 (latent).** workouts-session.js ~L421: the per-set save does `await VYVEData.writeQueued(...)` — identical network-blocking pattern PM-148 fixed in `completeWorkout`. Not reported as slow by Dean, but same latent bug — will hang the set-tick under backend load. Apply the same optimistic-first treatment when next touching the set path.

## Mind hub

**PM-319 mind tracker follow-ups.**
- Achievement evaluator subscribe to `mind:viewed`. Right hook for "X minutes of meditation/sleep/visualisation across a week" or "completed N visualisation sessions" metrics. Carries `watch_seconds`, `completed`, `kind`, `pct_watched`. Distinct from `mind:logged` which fires for every mind-pillar activity including journal/affirmations/breathwork.
- Backfill old `duration_seconds:30` rows. Pre-PM-319, every mind_activities row was stamped `duration_seconds=30` regardless of actual watch. If a future drop-off-curve analysis needs them treated as "at least 30s watched", a one-time `UPDATE mind_activities SET watch_seconds = duration_seconds WHERE watch_seconds IS NULL AND ref_id IS NOT NULL` would backfill. Defer until Achievements / analytics demand it.
- Sister-page consolidation. meditation.html, sleep.html, visualisation.html, breathwork.html all duplicate the PM-180/PM-183 setTimeout pattern mind.html retired. Each a candidate for the `VYVEPlayerTracker({mode:'mind'})` swap. Follow-up sprint — mind.html is the highest-impact target and shipped.
- Migration name mismatch (cosmetic). `pm315_mind_activities_watch_tracking` filename doesn't match canonical PM-319 brain entry. Migration names are append-only in Supabase. Accepted drift, no action.

**Background audio play for video catalogue (parked, post-trial decision).** YouTube IFrame embeds disallow audio-only/background playback per ToS — pauses on `visibilitychange:hidden`, WKWebView suspends timers on background, embed self-pauses by design. Three real options post-trial:
1. Tell members to get YouTube Premium. Zero engineering, zero risk, solves nothing for retention.
2. Self-host audio. Re-encode each video's audio track, upload to Supabase Storage, build native HTML5 `<audio>` player wired with `MediaSession` API + Capacitor background-media-controls plugin. iOS `UIBackgroundModes: [audio]` in Info.plist + Android `FOREGROUND_SERVICE_MEDIA_PLAYBACK` permission + foreground service manifest entry. Lock-screen controls + scrubber free with MediaSession. New iOS / Android store submission required.
3. Build audio-first content for mind/sleep tracks — drop video format for surfaces where audio is the product (HAVEN meditations, breathwork, sleep wind-downs, visualisation). Record audio-first, host on Supabase Storage, same player infra as (2). Cleanest end state.

Decision deferred until trial engagement data tells us which mind content members actually want to background. Folds with the post-trial podcast audio player bundle — shared Capacitor plumbing + Supabase Storage pattern + MediaSession wire. When either ships, the other is a 1-day follow-on.

**HAVEN clinical sign-off (Phil-blocked).** HAVEN persona built and live but not promoted widely pending Phil's clinical sign-off review. Conor Warren on HAVEN since 15 April.

**breathwork.html phase transitions (haptics adoption).** `VYVEHaptics.light()` on each inhale→hold→exhale→hold boundary. One-line add when next touching the page.

## Connect hub

**PM-197 Profile identity campaign — remaining work after PM-242 partial ship.** Read-side identity rendering on connect-feed.html is LIVE (connect.html Recent Check-Ins surface removed PM-720 — hub identity read-side no longer applicable). `profile.js` helper exists. `connect-feed-preview` EF v2 enforces anonymous-coupling server-side. Three avatar states render: initials text / uploaded photo / V-mark for anonymous (uses `/logo-mark.png`). `vyve_identity_<email>` cross-member localStorage directory operational.

Still pending:
- Leaderboard avatars — blocked on additive `email` column return from `get_leaderboard()` Postgres RPC. Next-session full-repo audit before careful RPC change.
- Settings UI for changing privacy mode — members currently set `display_name_preference` via direct DB only; no member-facing toggle. Distribution at PM-242 ship: 16 anonymous, 3 full_name, 1 initials. Needs Settings page surface to let trial members pick.
- Curated avatar library (`avatar_kind`, `avatar_id` columns + ~12 SVGs). Full campaign owns. PM-242 ships only `avatar_url` photo + initials + V-mark anonymous path.
- Connect first-load modal for first-time display-name + avatar pickers (PM-197 Thread 1). Design locked, not shipped. First-time on connect.html with `members.connect_onboarded_at` null: single modal "Welcome to Connect. How would you like to appear?" with display name picker + avatar picker + Save/Skip. Defaults: first name + curated V-badge so skip path produces sensible identity. Modal does not gate Connect; page paints with defaults applied behind it.
- Photo upload architecture (PM-197 Thread 2). Capacitor `@capacitor/camera` plugin → native picker → base64/file URI → client-side 256×256 JPEG crop → upload to `member-avatars` Supabase Storage bucket (public-read, write-restricted to authenticated member writing own avatar) → write URL to `members.avatar_url`. Same shape WhatsApp / Slack / Instagram use.
- GDPR Article 17 bucket cleanup in erasure pipeline.

**PM-211 — Single source of truth for live sessions (post-launch, 1-2 sessions).** Live-session schedule data lives in three places that disagree: `sessions-data.js` (vyve-site, recurring), `service_catalogue` (Supabase, stale since PM-190.d), `calendar_occurrences` (Supabase, materialised). Move to one recurring-pattern source in Supabase + materialiser keeping `calendar_occurrences` topped up. Lewis edits one row, calendar + sessions page + Live This Week reflect within minutes. Delete `sessions-data.js`. Recommended: extend `service_catalogue` (add `schedule_days TEXT[]`, `tags TEXT[]`, `live_url`, `replay_url`; backfill from sessions-data.js shape). New EF `materialise-calendar-occurrences` + Sunday 03:00 UTC pg_cron + manual re-trigger endpoint for on-edit invalidation. sessions.html data binding migrates from `VYVE_SESSIONS` to `VYVELocalDB.service_catalogue`. CATALOGUE_INVALIDATION_KEY bump. Realistic timing: first 1-2 weeks post-launch. **PM-463 progress:** connect Live This Week carousel is now calendar_occurrences-driven too (mirrors home PM-453/455/456) — sessions-data.js is now cold-boot fallback ONLY on BOTH home + connect. Remaining for full retirement: recurring-pattern source + materialiser + sessions.html binding migration + delete sessions-data.js.

- **Session notes — production rollout (from PM-467 prototype).** Prototype live on podcast-live.html only (`cfg.notes`). To productionise: (1) member-scoped `session_notes` Supabase table + RLS so notes sync/persist across devices and attach to the replay (currently localStorage-only, device-local); (2) `@capacitor/share` on the native build (prototype uses `navigator.share`); (3) Lewis sign-off on member-facing copy; (4) flip `notes:true` across the other 7 live shells once approved. Reminder: there is NO iOS API to write directly into Apple Notes — the share sheet is the route (PM-467 changelog).

**PM-213b — Live check-in form variants (post-trial).** New `live_checkin_submissions` table (UUID PK, `member_email`, `occurrence_id` → calendar_occurrences ON DELETE SET NULL, `variant` text NOT NULL, `answers` jsonb, `client_id` UUID, `created_at`). Plus `calendar_occurrences.checkin_variant` column so Lewis chooses which variant per check-in. checkin-live.html bespoke shape on top of PM-251 shell — embed question form inside `sl-tab-content` Info panel (or add 4th Check-in tab). Optimistic-first submit per §23.39. ~2 sessions Claude-assisted when prioritised.

**PM-251c — Chat unlock (v1.1 feature flag flip, ships first).** Locked behind `COMING_SOON_TABS = true` in `session-live.js`. Tabs render with lock icon + "Coming soon". Flip flag + port legacy chat code (was in pre-PM-251 engine; not retained in new engine to keep v1 surface clean). Chat-only: ~2 hour session (port + wire + device test). Q&A scope NOW lives in PM-416 (promoted to first-class upvote-ordered feed with admin moderation surface) — PM-251c flips chat tab only, leaves Q&A tab locked until PM-416 ships.

**PM-416 — Live session question submission + instructor feed (post-PM-251c, 3-4 sessions Claude-assisted).** Member-side Q&A tab in `session-live.html` with composer (280-char limit) + upvote-ordered feed of all questions for the occurrence (all-visible per Dean's call). Instructor-side `live-questions.html` in `vyve-command-centre` (admin.vyvehealth.co.uk) per Dean's call: two-column Pending/Answered layout, ≥18px type, Realtime sub with subtle new-arrival flash, optional Producer-mode toggle exposing "Highlight for Lewis" star (defers operator-model decision to post-pilot).

Schema: `session_questions` (UUID PK, occurrence_id FK → calendar_occurrences ON DELETE CASCADE, member_email, question_text 3-280 CHECK, status pending/answered/dismissed, answered_at, dismissed_at, upvote_count, client_id, created_at) + `session_question_upvotes` (composite PK (question_id, member_email), trigger keeps upvote_count synced). RLS: members see pending+answered (never dismissed), INSERT own with 5-pending-per-occurrence cap via trigger, UPDATE service-role only via question-moderate EF. Self-upvote prevented at trigger level.

Two new EFs both verify_jwt:true: `question-submit` v1 (validates occurrence broadcast_state IN ('live','starting'), enforces 5-pending cap, inserts, optimistic-first per §23.39) + `question-moderate` v1 (admin-gated, updates status). Both publish `live:question:created` / `:answered` / `:dismissed` / `:upvoted` via Realtime broadcast per §23.41-§23.50 bus discipline.

Dexie SCHEMA bump: `session_questions` member-scoped on occurrence_id, 24h TTL, pullable ordered by upvote_count DESC + created_at ASC.

Build order: (1) schema migration + RLS + trigger, (2) two EFs, (3) Dexie wire + sync.js PULLABLE, (4) `session-live.html` Q&A tab flip + composer + feed + upvote interaction + Realtime sub, (5) `live-questions.html` in vyve-command-centre — admin gate + occurrence picker + two-column feed + moderate actions + producer-star path, (6) bus events both sides, (7) device walk per PM-304 on real broadcast (schedule occurrence with starts_at=now()), (8) Lewis copy pass on composer placeholder + empty state + 280-char warning.

Risks: rate limiting tight (5→3 after first session if needed), no profanity filter v1 (post-trial: wordlist in EF, no AI moderation), withdraw vs answer race (EF returns current state, client reconciles), Realtime quota fine on Pro for 1000 viewers on one channel with 5-10s polling fallback ready, producer-star vs answered two-state UI needs device-walk validation.

Cross-refs: PM-251c (chat ships first, proves Q&A tab architecture), PM-211 (calendar_occurrences source-of-truth — FK target), PM-197 (member identity rendering on question feed avatars), §23.41-§23.50 (bus discipline).

Rejected alternatives (banked for future, see changelog PM-416): embedded Zoom/Teams in WKWebView (wrong tool, vendor-hostile to embedding), Daily.co/LiveKit/Agora real-time video embed (~$0.004/participant/minute viable but wrong product shape — broadcast Q&A is 1-to-many with text, not many-to-many video). Group therapy two-way video handled out-of-app via Zoom button → `window.open(url, '_system')` → native Zoom (separate ~1-evening ship, Phil clinical sign-off blocked).

**PM-251b — Instructor backfill on `service_catalogue.default_host_*`.** Single SQL UPDATE per category as instructor confirmed. PM-251 backfilled `default_host_name='Lewis Vines'` + `default_host_role='Co-Founder, VYVE Health'` on all 8 `type='live_session'` rows as placeholder. Real identities to populate: Mindfulness (Phil — gated on clinical sign-off review of voice), Workouts (Calum), Weekly Check-In (Vicki?), Group Therapy (Phil), Events & Run Club (Lewis), Education & Experts (TBD per guest), Podcast (Lewis). Photos: upload 512×512 JPEG to a `host-photos` Supabase Storage bucket (public-read, similar shape to `member-avatars`), then UPDATE `default_host_photo_url`. 15 minutes once instructors confirmed.

**At-risk-streak push notifications (PM-309 follow-up, Lewis-blocked on copy).** Dean's ask: 19:00/20:00/21:00 BST push "you're about to lose your X-day Elite streak" when member at-risk. Definition: streak ≥ 3 AND no activity today AND under grace-day rule yesterday IS in active-day set. Requires: Capacitor push-notifications plugin status check, new cron ~19:00 UTC enumerating at-risk members (member_home_state.overall_streak_current ≥ 3 AND last_activity_at::date < CURRENT_DATE), native push dispatch path decision (APNs/FCM direct from EF via REST, or third-party service), Lewis copy with variants for streak length brackets (3-6, 7-13, 14-29, 30+), Settings.html notification toggle row. Scope ~2-3 hour build once Lewis has copy + Capacitor plugin confirmed.

**Live viewer count on session pages.** Display only when 20+ viewers. Requires `liveBroadcasts.list?part=statistics` polling. Quota trivial (8 active broadcasts × hourly = 192 units/day) but UX adds complexity. Defer.

## Home / engagement

**Engagement Score v2 — follow-ups owed after PM-295 partial ship.**
1. Default flip + v1 cleanup. After 24-48hr v2 device verification, swap default so `engagement.html` redirects to v2 (or rename v2 over v1). Drop v1 `compute_engagement_components` + `compute_engagement_score` SQL functions, v1 `member_home_state` columns (`engagement_score`, `engagement_recency`, `engagement_consistency`, `engagement_variety`, `engagement_wellbeing`), v1 JS `computeEngagementComponents`. One Supabase migration + one vyve-site commit. Single session.
2. Activity Breakdown grid rebadge (Dean's call PM-295). Today: Habits / Body / Mind / Connect / Check-ins. Target: **Habits / Mind / Body / Cardio / Check-ins**. Remove Connect + sessions-bound card, split Body into Body (workouts only) + Cardio (cardio sessions only). Pillar rows above stay as-is — they reflect what the score is computed from. Breakdown is a member-facing slice and can differ.
3. Three-tab shell (Dean's design call PM-295). Engagement page becomes `[ Score ] [ Progress ] [ Achievements ]` sticky tabs. Score tab = current engagement-v2.html (post grid rebadge). Progress tab = charity mechanic + 5-track milestone progress per §17 + §11A. Achievements tab = port v1 trophy-cabinet block verbatim (full overhaul is the separate Achievements campaign).
4. `live_checkin_submissions` Dexie registration. Add to db.js SCHEMA_V14 + version chain + makeTable consumer + sync.js PULLABLE entry (member-scoped, week_start.gte 12-week lookback, ordered week_start.desc). Sequences with the live check-in form build.
5. `re-engagement-scheduler` v11 push thresholds. Three thresholds reading new `engagement_score_v2` + `engagement_pillars_touched_7` columns: Soft slide (Score <75 first time in 14 days, 7d cooldown), Pillar gap (Score <65 for 3 days, names empty pillar, 5d cooldown), Re-engagement (Score <55 for 7 days, routes into A/B/C1/C2/C3 + push, 14d cooldown). Lewis owns 5 pillar-gap notification copy variants. Build after 24-48hr v2 verification + default flip.
6. Lewis copy pass — Engagement v2 voice. All v2 band copy (Powerhouse / Strong week / Building / Quiet week titles + subs), 5 pillar explainer popovers, "How your score works" sheet body, 6 pillar empty-state hints. Shipped as functional placeholder. One copy commit.
7. v2 30-day strip — tap-day-to-expand activity detail. Parked post-soft-launch. Tap a day on 30-day chip-row → bottom sheet shows what was logged that day. Defer until soft-launch data shows curiosity-tap is real behaviour.
8. `/page-docs/` continued backfill per §11B. First batch beyond engagement.md: index.md, habits.md, exercise.md, mind.md, connect.md, then focus pages.

**PM-358 — Achievement tier curve + naming overhaul (P1, post-trial, gated on Lewis's v1 copy review landing first).**
1. Naming unit-blind. "Five Cardio Banked", "Three Workouts In", "Twenty-Five Strong" lose the noun. Every title must contain the unit explicitly. "Five Cardio Sessions" not "Five Cardio Banked". Bulk find-and-replace across all 528 rows.
2. Tier curve dies mid-game. Current bulk-count metrics use `1, 3, 5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000`. From tier 5 each step is ≥2× previous — gap goes 15 → 25 → 50 → 150 → 250 → 500 → 1500 → 2500 → 5000. 25→100 dead zone exactly where engagement-fatigue is highest. Proposed: `1, 3, 5, 10, 20, 35, 50, 75, 100, 150, 250, 500, 1000, 2500, 10000`. 15 tiers vs current 13. Member hits tiers every 1-2 weeks through month 3, every ~3 weeks through month 6, monthly into year one, rare prestige beyond. Apply to streak-adjacent bulk-count metrics. Streak metrics (3/7/14/30/60/100/200/365/...) leave as-is. Time-based (workout_minutes_total, cardio_minutes_total, mind_minutes_total) same fix scaled to minutes. HealthKit metrics already differently scaled — review separately. volume_lifted_total leave alone.
- Sequencing: Lewis returns v1 CSV with per-tier copy approved → bulk-UPDATE per-tier title/body/copy_status='approved' → curve overhaul → v2 CSV → Lewis sign-off → bulk-UPDATE final. Doing curve change AFTER per-tier copy lands means copy work isn't wasted on tiers that survive (tier 1-5 mostly overlap with current).

**"You've been away" Score copy state (small ship, ~20min, Lewis-blocked on copy).** PM-301 considered but not built: copy-only state on Score band detecting members who haven't logged anything for 5+ days. Override `scoreBandSub` text with welcome-back framing: "Welcome back. Your floor's still at 50, your streaks held what they could, here's where to start." Check `engagement_days_since_last_log` ≥5 in `renderScore()`. No structural change. Lewis voice pass on actual copy required. Defer until member-side report of "I came back from holiday and the page felt cold" confirms problem is real.

**Engagement v1 redirect file removal (post-PM-305, small commit ~early June).** PM-305 left `/engagement.html` as 2KB redirect file. Three things before deleting entirely: (1) confirm via service-worker logs no devices hitting `/engagement.html` directly — should all go to `/engagement-v2.html`, (2) remove `/engagement.html` from sw.js precache list, (3) delete file. Earliest sensible: ~1 week after PM-305 ship.

**Build banner restoration (broken since PM-256, <15min when picked up).** `?debug=build` should show build banner with vbb-marker + sw cache key. HTML element + JS wire still in index.html (L1077-1110 inspected at PM-293) but banner doesn't appear. Most likely: CSS specificity issue from PM-256 rewrite overriding `style.display = 'block'`, OR localStorage flag check at L1086 silently failing. Not a launch blocker — diagnostic affordance lost. Run `?debug=build` in Safari with DevTools, fix spec collision or JS hook.

**Home Today's Habits paints inactive rows as if active (backlog, low priority).** test1@test.com had 4 active member_habits rows in Supabase; settings showed "4 habits currently assigned" correctly; Home Today's Habits showed 8 cards — 4 active + 4 with `active=false`. Hypothesis space: localStorage cache painted before sync.js's `replaceForMember` ran most recently, OR different join path on home (daily_habits joined to habit_library showing any habit ever logged), OR PM-291 habits-on-home wiring reading different Dexie store. Not launch-blocking — fresh members at trial launch have no accumulated `active=false` rows.

**Engagement-v2 cold load slow-path investigation (post-trial).** PM-399 snapshot makes the LOADING hang visually invisible but `computeHomeStateFromDexie` 10-table heavy read still takes 1-30s on memory-pressured devices. Profiling pass post-trial to see where the time goes.

**Lucide icon swap across nav.js (Dean call PM-295).** Replace hand-rolled inline SVG icons in `nav.js` with Lucide (https://lucide.dev, MIT, ~1500 icons). Affects bottom-nav 5 icons (Home, Body, Mind, Connect, More) + More-menu entries. Inline chosen Lucide SVG paths only for icons in use — no CDN, no `lucide.min.js` dependency. Self-contained, can land any session.

**Real per-track progress on My Progress rings (post-pillar-realignment).** PM-257 paints 5 rings with `PROGRESS_TRACKS` placeholder zero values. Wire `home-state-local.js` compute functions into renderPills. Each ring `value/target` reads from member's monthly count. Mapping: Hydration → daily_habits where habit_title matches hydration; Movement → workouts + cardio combined; Mind → mind_activities; Nutrition → daily_habits where habit_title matches nutrition; Sessions → session_views. Target 30 for all (matches certificate milestone). Sequence AFTER pillar realignment (rings → Habits/Body/Mind/Connect/Check-ins) to avoid wiring math twice.

**PM-256 follow-ups (home redesign deferred items).**
- Habit icon redesign campaign. Current `iconForHabit(habit_title)` is 12-keyword regex match with 🌿 fallback. Add `icon TEXT NULL` column to `habit_library`. Backfill 30 current rows with curated emoji or SVG glyph (Dean's call on emoji vs commissioned SVG). Replace `iconForHabit()` with `habit.icon || iconForHabit(title)` fallback. Dexie `member_habits.allFor` already pulls full row — add `icon` to select. ~1 hour emoji / ~3-4 sessions SVG.
- Fractional-ring v2 for Progress Pills. Add `target_unit TEXT NULL` + `target_value NUMERIC NULL` to `habit_library`. Examples: `walk_8000_steps` → unit `steps`, target 8000. Backfill ~10-15 habits with meaningful numeric targets. New `getHabitProgress(habit, memberEmail)`: HealthKit-backed for steps/sleep/active_energy; water-backed for hydrate; time-backed for breathwork/meditation; boolean fallback otherwise. Ring math `Math.min(1, current / target)`. ~3-4 hours. Bundle into one trip through habits.html + index.html + habit_library migration with the icon redesign.
- AI-generated daily focus (post-trial). New table `daily_focus_log(member_email, focus_date, persona, time_of_day, content_json, generated_at)` UNIQUE `(member_email, focus_date, time_of_day)`. New Anthropic EF `generate-daily-focus` mirroring weekly check-in recs. Trigger from index.html boot if no row exists. Cost ~3 gens × 14 days × 30 members = 1260 calls/month at trial scale (~£3-5/month Sonnet 4).
- Tagline `time_of_day` column for TOD-aware rotation. Add `time_of_day TEXT NULL` to `taglines` (NULL = applies to all TODs). Lewis adds 4-6 per TOD via Supabase Studio. Replace `pickTagline()` with Dexie read filtered to current TOD or NULL, local-midnight-anchored day-index rotation. ~30min.
- Mood trend visualisation for Lewis (out-of-scope trial, marker for PM-214 admin console build).

**PM-257 follow-ups.**
- Focus carousel re-consideration. PM-257 ships single Today's Focus card that changes content by hour boundary. Worth a device review now that it's live — Dean previously stuck between carousel (3 cards) and single-shifting-card; my argument for single won. If Dean wants carousel after device review: restructure `.focus-card` to `.focus-carousel` container with 3 cards always visible, swipeable, active card derives from TOD on first render. ~45min, pure UI restructure, no data layer change.

## Settings / profile

**Settings UI for changing privacy mode (PM-197 follow-up — Profile identity).** See Connect hub. Members currently set `display_name_preference` via direct DB only.

**Capacitor + theme parity for nav-injected pages.** Bottom-nav opacity split on Connect (PM-405) shipped — verify no inverse drift on other surfaces during the next light-mode pass.

## Onboarding

**Onboarding EF v37 writes category into workout_plan_cache (PM-411 Bug A architectural prereq).** See Body hub.

**Persona welcome copy spot-check in `persona_welcome_copy` (Lewis-blocked).** Dean finalises lines via UPDATE in Supabase Studio; no vyve-site commit required. HAVEN short-circuit + SAFE_ECHO_GOALS whitelist + `{name}` interp all stay code-side as safety logic. `FALLBACK_COPY_TABLE` const carries cold paint. Schema-level work for PF-13 hydration copy finalisation is done — only sweep-the-fallback-to-match remains when Lewis spot-checks.

**In-App Tour (PF-23, post-bundle P1).** Elevated from "V2 post-launch blocked on Lewis copy" to next-up P1 after bundle ships (PM-404 brain close). Modal step-through (option a) confirmed for v1. Walks members through home dashboard (score ring + streak), first habit log, first workout log, first cardio log (with HealthKit consent prompt on iOS), first session watched, first weekly check-in. Each step ends with the member tapping the actual log button — earns first-tier achievement at each step + the `tour_complete` achievement on completion. Persistence via `members.tour_completed_at` + "Restart tour" in Settings. Skip path required. Dependencies: Lewis copy + screenshot approval. ~1-2 sessions, mostly UI.

## Admin / Command Centre

**Portal Admin UI for `calendar_occurrences` (sequenced after PM-215 cron + ~1 month of operational learnings via manual pasted-timetable path).** Spec defined in `playbooks/live-sessions-operations.md`. Build with usage data, not without. Repo `VYVEHealth/vyve-command-centre`, new page at `/calendar` or `/sessions`. MVP scope ~1 session Claude-assisted: list view of upcoming occurrences, add new session form (8 fields per intake spec, category dropdown of 8 canonical strings — no free text), edit form (locked once `starts_at <= now()`), cancel (sets `active=false`, warns if `youtube_broadcast_id IS NOT NULL`). Phase 2 ~half session: bulk add for recurring patterns. Does NOT do: YouTube broadcast management UI, Riverside integration, host photo upload (paste URL), replay management.

**Broadcast schedules UI (PM-402 follow-up).** Manual broadcast UI + cron rails shipped. Out-of-scope v1 parked: scheduler creation UI in Command Centre (rails ship dark per Dean's call); "pool of quotes" infrastructure for morning quotation (Lewis decides content shape); custom audience JSON editor (power user surface).

**Android FCM banners on broadcast push (standing backlog).** APNs end-to-end live for broadcast push. Android needs FCM credentials audit + dispatch path wire.

## Native / Capacitor

**Bundled exercise thumbnails + workout plan templates into Capacitor build (own scoped vyve-capacitor session).** Dean's direction: when app downloaded from store, build contains exercise thumbnails AND workout plan data — on-device from first launch. Distinct from sw.js precaching — commits thumbnails into vyve-capacitor as bundled assets shipping inside the binary. Videos NOT bundled (network-only). Workout pages reference local bundled asset path with network URL as fallback. First size up total thumbnail weight — hundreds of images may need compression before bundling. Pairs with vyve-capacitor git init.

**Android Health Connect wiring (PM-411 Item 1 Bug 7 carry-over).** AndroidManifest + Gradle SDK + healthbridge.js Android branch. Plugin present per package.json. Android FCM credentials audit alongside.

**Capgo HealthKit live-polling upgrade on Movement (v2 follow-up).** Deferred. Current pull is per-session; live-polling would surface walk credit in near-real-time.

**iOS background HealthKit sync (parked future vision).** Capgo 8.4.7 exposes zero background primitives. Architectural path is companion Swift Capacitor plugin (~400 lines) alongside Capgo. ~4-5 build sessions + 1 week device soak + App Store review cycle. Unpark signals: member feedback naming background sync specifically; enterprise pilot requirement.

**Nutrition/MFP reads via HK (parked).** Capgo 8.4.7 exposes no dietary types. Would need plugin fork/PR. Separate plan at `plans/nutrition-healthkit.md` when sequenced. Unblocks water habit auto-tick and MFP-native nutrition totals.

**PM-250 follow-up — Wire @capacitor/browser for external links inside the app.** Plugin already installed (`@capacitor/browser ^8.0.3` in vyve-capacitor/package.json). Wiring deferred from PM-250. ~30min. PM-250 suppressed long-press "Open in Safari" preview via `-webkit-touch-callout: none`, but tap on `<a href="https://example.com/...">` inside WKWebView still navigates IN the WebView (replacing app's web shell). Members visually trapped. Route external links through `Browser.open()` → SFSafariViewController on iOS / Chrome Custom Tab on Android. Audit first: grep external links, `window.open`, `location.href`, `target="_blank"`. Implement via delegated click handler in new `external-links.js` (or fold into nav.js) — Capacitor environments only via `window.Capacitor.isNativePlatform()` guard. `window.Capacitor.Plugins.Browser.open({url, presentationStyle: 'popover'})`. Ships in vyve-site (client-side JS) not vyve-capacitor — plugin already in binary. Sweep target per §23.59 for stale PWA-era assumptions (any "Add to home screen" / `beforeinstallprompt` handler / stale sw.js urlsToCache from removed pages).

## Infra / Data

**PM-417.b — HealthKit distance backfill patcher (P2, ~1.5 sessions Claude-assisted).** PM-417 forward-fix shipped to vyve-site `2e6ffb46` — healthbridge.js now captures `totalDistance` + `totalEnergyBurned` from Cap-go workout samples going forward. Backfill remains: ~6 months of HealthKit-sourced `cardio` rows have `distance_km IS NULL` for Lewis (and any other HK-connected member). New EF `backfill-hk-distance` (verify_jwt:true, admin-gated). Client-side re-pull required since HealthKit data lives on-device — server has native_uuid but cannot re-query alone. Flow: EF returns list of NULL-distance workout `native_uuid`s for member → client calls Capgo `queryWorkouts` in 30-day windows (max 365 days per MAX_SAMPLE_AGE_DAYS) → posts `{native_uuid, totalDistance, totalEnergyBurned}` back to EF → EF merges into `member_health_samples.metadata` AND updates `cardio.distance_km` via `promoted_id` link in transaction. Trigger from vyve-command-centre per-member, OR auto-trigger via new `member_health_connections.needs_backfill BOOLEAN` flag picked up on next normal pull_samples. Edge cases: workout deleted on device → leave NULL; third-party app workouts without totalDistance → leave NULL (document, don't engineer around). No native bundle change needed — client JS only, picks up via WKWebView refresh.

**PM-145 — `platform-alert` v10 + `alert-digest` EF + cron-noise cleanup (P0, design locked PM-403.b, build pending fresh chat).** ESCALATED 16 May (PM-149). On 16 May the `platform-alert` v8 storm drained the nano-tier 60-connection Postgres pool and caused a site-wide login outage. Mitigated by deploying `platform-alert` v9 — a deliberate no-op (instant 200, no DB/Brevo/push). Consequence: platform error monitoring has been OFF since 16 May. With bundle widening cohort to all members on approval, this is now blocking-grade P0.

Design locked PM-403.b. See changelog. Summary:
- `platform-alert` v10 — server-only replacement of v9. Fingerprint `(type, normalised_endpoint, member_email)`. Severity recalibration with 14-endpoint write-path list. Circuit breaker 20/60s → 429 for 5min. skeleton_timeout counter-in-details pattern. Writes only to `platform_alerts` — push_subscriptions write dropped entirely. <50ms 200-return. Client (vyveMonitor IIFE in auth.js L927-999) untouched.
- `alert-digest` EF + pg_cron — three slots 08:00/14:00/20:00 UTC. Always sends. Subject differentiates issues vs all-quiet. Per-fingerprint Claude Sonnet 4 diagnosis (4096 tokens, cap 10/email, EF source + last-3-commits context, hardcoded endpoint→file map). Anthropic failure degrades gracefully — email always sends. Brevo `team@vyvehealth.co.uk` to deanonbrown@hotmail.com + lewisvines@hotmail.com, tag `alert-digest`.
- Cron noise cleanup — `charity_total_reconcile_and_heal()` literal swap warning→info; `habit-reminder-daily` + `streak-reminder-daily` JSON-literal fix on the `current_setting('app.service_role_key', true)` pattern; sweep `cron.job` for shared-pattern siblings.

Order in build chat: cron noise (10 min) → platform-alert v10 → alert-digest EF + cron → manual digest invocation confirms all-quiet email lands → Session B walk.

Deferred from current scope: boot_id + app_version client injection (Stage 2, auth.js v3, post-bundle OTA). Command Centre alerts panel (Stage 5, post-bundle). Pattern detection EF (Stage 4, post-bundle).

**Monthly check-in credit gap (P0 own session, Lewis-gated).** `monthly_checkins` has NO counter trigger and NO charity trigger — a monthly check-in currently earns ZERO credit. Bus event `monthly_checkin:logged` should exist (achievements evaluator handlers `monthly_checkins_completed`, `monthly_avg_improved` reference per PM-342). Check what's actually firing. Convert increment-style counters (`increment_cardio_counter`, `increment_workout_counter`, `increment_habit_counter`, `increment_checkin_counter`, `charity_count_*`) to the stateless recompute pattern used by `update_cert_sessions_count` — drift-prone (no recount on DELETE). Recompute for check-in track must UNION `wellbeing_checkins` and `monthly_checkins`. Backfill `cert_*_count` columns. Per-track cap numbers (cardio/workouts/sessions credit first 2/day; habits + check-ins credit first 1/period) are a product decision — confirm with Lewis, don't change unilaterally. `activity_dedupe` replay (months of historically-discarded activity) — Dean's steer: fix-forward, treat replay as separate.

**index.html duplicate `posthog.init` cleanup (PM-408 follow-up, P3).** Lines 1043-1046 contain inline `posthog.init` running immediately (no defer) setting `posthog.__SV=1`. auth.js's deferred init at line 8 then no-ops on existing stub. Net effect: session_recording config in auth.js (100% sampling, `maskAllInputs:true`, `maskInputOptions.email:false`) NEVER applied on index.html. Single-ship fix: delete inline init, test in fresh Chrome incognito with DevTools (confirm `window.posthog` defined within first 200ms, session recording active, no console errors). If green, ship; if not, align inline init config with auth.js. ~4-file atomic ship. Verification via PostHog "Session replays" tab. Home page recordings missing is noticeable observability gap but not blocking trial.

**§23.65 forward-sweep audit (envelope-trusted subscribers).** PM-293 fixed home `habit:logged` subscriber to be envelope-aware. Same pattern applies to any cross-page subscriber watching `<event>:logged` from a publishing surface using fire-and-forget Dexie writes (§23.39 default). Audit signal: `grep -nE "VYVEBus\.subscribe\(['\"][a-z_]+:logged" *.html *.js`. For each match, check whether subscriber's only state-update path is a `loadX()`/`fetchX()` Dexie re-read. If yes, upgrade to envelope-aware per §23.65. Surfaces likely to need it: engagement.html (subscribes to most `:logged` for score recompute), exercise.html (hub surface counts). Connect + mind already swept in PM-390. Lower priority than home fix.

**PostgREST upsert hardening forward-sweep — keepalive + on_conflict audit (paired with §23.65 sweep).** PM-296 + PM-298 hardened `settings.html saveHabits` only. Every other un-awaited PostgREST write needs same two hardening points: `keepalive: true` on fetch options, and `?on_conflict=<cols>` + `resolution=merge-duplicates` (or `ignore-duplicates`) wherever the table has a UNIQUE constraint that could be hit by re-add path. Audit signal: `grep -nE "supaFetch\(['\"]/[a-z_]+.*method:\s*'(POST|PATCH)'" *.html *.js` for un-awaited or IIFE-wrapped calls. High-suspicion surfaces: `settings.html savePersona`/`saveGoal`/custom habit create/delete, cardio.html, workouts.html, mind activity writes, wellbeing-checkin.html (UNIQUE on `(member_email, iso_week)` — will re-submit 409?), nutrition_logs, weight_logs (already has upsert — confirm). 1-2 sessions Claude-assisted.

**PM-289 follow-up — Optimistic-write reconciliation watchdog (§23 candidate, hold for second occurrence).** PM-289 found `connect_checkins` POSTs silently failing in iOS WKWebView for days — optimistic Dexie write held UI in confident "posted" state with no diagnostic surface, even though server never received the row. Read paths have §23.46 ("paint truth, not placeholders") to keep them honest; write paths have no equivalent. Worth a §23 hard rule once pattern recurs: every optimistic-first write must have reconciliation watchdog that, within N seconds of optimistic Dexie write, verifies row exists server-side and surfaces visible failure banner if not. PM-289 only fixes iOS race (keepalive + awaited navigation) — if POSTs still fail in wild after this ship, new `console.error` on 4xx will show what's actually rejecting. Hold §23 rule until one more occurrence confirms failure mode generalises.

**`workout_plan_cache` contradictory UNIQUE indexes (banked, §23 candidate on second occurrence).** See PARKED PM-411 schema-architecture note. Two contradictory UNIQUE indexes (`workout_plan_cache_member_email_key` blocks multi-row; `workout_plan_cache_one_active_per_member` assumes multi-row). workout-library EF v13 paused-plan logic at L60-84 silently never works correctly. Promotes to §23 on second occurrence.

**Auth-shape gotcha (banked PM-402, §23 candidate on second occurrence).** Post-key-rotation `SUPABASE_SERVICE_ROLE_KEY` env in EFs is the new `sb_secret_*` publishable shape; `send-push` v13's `Bearer` equality check needs JWT-format `LEGACY_SERVICE_ROLE_JWT` instead. First runner deploy got `401 UNAUTHORIZED_INVALID_JWT_FORMAT`; both new EFs redeployed at v2 with corrected env. Pattern reference: `achievement-earned-push` v2 source. Promotes to §23 on second occurrence.

**Upsert-only sync EFs need reconciliation step (banked PM-410, §23 candidate on second occurrence).** `refresh-replay-videos` v1 was upsert-only; deletable upstreams left stale rows. v2 added reconciliation step. Promotes on second occurrence.

**Cross-visit dwell accumulation (tracking.js, post-launch low priority).** tracking.js v9 dwell accumulator resets on page unload — `visitStartTime` is in-memory; only `baseMinutes` (server `minutes_watched`) survives. Two sub-60s visits to same session don't sum. Anti-farm correct; wrong if we want to credit genuinely-interrupted viewing. Fix options if pursued: (a) create row early marked unqualified and accumulate server-side, or (b) track cumulative minutes per (category, date) in Dexie across page loads. Defer until post-launch + evidence it matters.

**tracking.js outbox wiring (§23.10 hardening candidate, post-launch).** tracking.js is critical activity-write path with NO outbox — direct fetch, `session:viewed:failed` to a bus nobody surfaces, no retry beyond in-visit heartbeat. Member loses connection at 60s mark and leaves → loses legit session view. vyve-offline.js has the outbox infrastructure; tracking.js was never wired. Wire writes through offline outbox. Not launch-blocking.

**NEW FEATURE — `page_visits` owned visit/dwell analytics (post-launch, ~2 sessions).** Owned, queryable record of page visits + time-on-page, Dexie→Supabase, SEPARATE from PostHog (PostHog stays as deep web-analytics/replay layer). New `page_visits` table (`member_email`, `page`, `entered_at`, `duration_seconds`, `activity_date` — one row per visit). Small shared tracker on every portal page captures entry on load + duration on `pagehide`/`visibilitychange` with `keepalive` on final beacon for iOS WKWebView. Local-first to Dexie table, background-drain via `_sync_queue`. Value: owned analytics, re-engagement triggers ("hasn't opened in 5 days"), employer insight, future member-facing "your week" view.

**NEW FEATURE — `session_schedule` table + live-session minute-windowing (post-launch, ~1.5-2 sessions).** Live-session minutes only count during actual broadcast window (e.g. 09:00-09:30 session: member on page 09:15-11:00 credited 15 min, not 105). Two pieces: (1) FOUNDATION — `session_schedule` table (`category`, `day_of_week` or date, `start_time`, `end_time`) — schedule currently only text on sessions.html. Also unblocks real "live now" home slot and real "Coming Up This Week" block. (2) tracking.js clamps live-session minutes to `overlap(visit_window, broadcast_window)`; replays unaffected. Caveat: tracking.js measures page dwell not video play-state — "present during window" is strong proxy but not true watch-tracking; true play-state needs YouTube iframe API (V2). Pairs with future minutes-based session goals.

**Local-sunset-aware hub hero rotation (future-vision, parked).** Today's three-state photo swap (morning / afternoon / night) driven by §23.55 pre-paint inline IIFE on `getHours()` with hardcoded boundaries 05-11 / 11-19 / 19-05. "19:00 = night" is wrong for half the user base half the year. London June: sunset ~21:30 (night appears 2.5hr early). Edinburgh December: sunset 15:40 (afternoon persists ~3.5hr past dark). Stockholm winter: night at 14:45. Recommended path: cached lat/lng + NOAA solar calculation. Geocode onboarding "Where are you based" → lat/lng at onboarding-EF time, persist to `members.lat`/`members.lng`. `member-dashboard` returns alongside payload, cached localStorage. Pre-paint IIFE reads cached lat/lng → NOAA solar position algorithm (~40 lines pure JS, zero deps) → today's sunrise + sunset → picks photo. <1ms, zero network, zero permissions. Falls back to 19:00 boundary if absent. ~2 hours single long session. Stripe-country fallback for ~10% geocoding failures (free-text "Where are you based" → typeahead OR country centroid). Unparks if user base reaches extreme-latitude markets, or post-trial premium-feel polish.

**Schema audit — every member-data table has `updated_at TIMESTAMPTZ` + `BEFORE UPDATE` trigger (pre-bundle / offline-correctness gate, parked post-binary).** Catalogue tables too (delta-pull depends). Add where missing in one-shot migration.

**Idempotency audit (pre-bundle / offline-correctness gate).** Every write surface generates `client_id` UUID client-side at write time. Server respects as dedupe key. mind_activities = gold standard. Verify: workouts / cardio / daily_habits / exercise_logs / custom_workouts / exercise_swaps / weight_logs / nutrition_logs / weekly_scores / wellbeing_checkins / monthly_checkins / session_views / replay_views.

**Airplane-mode device walk (pre-bundle / offline-correctness gate).** Dean's iPhone with server.url and network killed at OS level. Open every page in order. Record render behaviour (renders / spinner / empty / broken / honest offline). Anything broken or empty (when data exists in Dexie) = P0 fix. Pairs with `_sync_queue` drain hardening (drainer wakes on app launch, drains pending writes before letting user create new ones, handles ordering, resilient to individual row failures, tested against simulated 2-week-offline queue).

**Cold-start-no-network UX (pre-bundle / offline-correctness gate).** Login screen detects no-connection state, shows honest message ("VYVE needs internet for first sign-in. After that, the app works offline.").

**Fan-out-on-focus pattern (pre-bundle / offline-correctness gate).** Capacitor `App.addListener('appStateChange')` triggers incremental delta-pull when app returns to foreground. Per-table `last_sync_timestamp` stored in Dexie `_sync_meta`. `where updated_at > [last_sync_timestamp]`.

**✅ Certificates re-pillaring — SHIPPED PM-435 (2 Jun).** Done as FIVE Your Journey buckets (habits/mind/body/connect/checkins), NOT the originally-planned three Mind/Body/Connect — certs now mirror the Journey Progress tab exactly via `get_certificate_buckets()`. `pillar` column + legacy grandfather + silent backfill + certificate-checker v24 all shipped & verified. **Open follow-ups:** (1) **🎨 Certificate VISUAL DESIGN pass — `certificate.html` / `certificates.html` are functionally correct but placeholder-quality; need a proper premium design (Dean flagged 2 Jun).** (2) Mind persona "The Anchor" is a placeholder pending Lewis sign-off — he can also rename Warrior/Explorer to cleaner pillar names if wanted. (3) Goal-target re-pillaring (non-cert half of PM-159) still open. Folded into Phase 3 pillar realignment of the original PM-184 bundle-ready campaign. **PM-415 brain park (27 May): Dean flagged this as under-surfaced in the platform audit doc — the existing 5-track certs (Architect/Warrior/Relentless/Elite/Explorer) rate 4/5 in current state which masks that they don't reflect the strategic 3-pillar positioning we use in sales conversations. Audit-doc rewrites should rank certificate re-pillaring around #11-13 in priority remediation, not bury inside a 4/5 certificates rating. Timing stays post-trial because trial members earning current-track certs this month is fine (new tracks grandfather old earns).** Canonical entry — duplicate at L360 in post-trial section is a back-reference only.

**Continue Watching UI tile (PM-294 follow-up, post-soft-launch).** `replay_video_views_member_last_updated` index already powers the query — `SELECT youtube_video_id, watch_seconds, title FROM replay_video_views WHERE member_email = X AND completed = false ORDER BY last_updated_at DESC LIMIT 3`. UI shape: horizontal carousel on replays.html above playlist tiles, three cards showing "Resume from MM:SS" with thumbnail + remaining time. Tap = mountPlayer with `startSeconds` via YT IFrame API. Mockup-first. Sequence after soft-launch trial data confirms carousel is wanted — premature before knowing whether members care about resume vs restart.

**Per-instructor drop-off analytics (PM-294 follow-up, internal-only).** `host_name` denormalised on every `replay_video_views` row. Simple SQL `GROUP BY host_name, ROUND(watch_seconds * 100.0 / NULLIF(total_seconds, 0)) ORDER BY 2` gives drop-off curves. Consumer surface: internal-only dashboard tile in Command Centre (Lewis/Calum/Phil). Not member-facing. Build after first month of trial-scale data (~30 watches per instructor). Single EF + dashboard tile, no schema change.

**Per-category cumulative watch-time achievements (PM-294 follow-up, post-trial).** New metrics in `achievement_metrics` — `yoga_minutes_watched`, `mindfulness_minutes_watched`, `workouts_minutes_watched`, one per active category — tiers at 5/10/15/30/60/120/300 cumulative minutes (placeholder, design against real distribution after ~1 week trial data). Evaluator sums `watch_seconds` from Dexie's `replay_video_views` (PM-294) AND `session_live_views` (PM-304), filtered by `category`, divided by 60. Cumulative across all play sessions. Trigger event-driven: replay tracker publishes `replay:viewed` every 30s of accumulated playback; live tracker publishes `live:viewed` with identical payload. Achievements subscriber on both events re-evaluates per-category sum from Dexie and stamps `member_achievements` if tier crosses — instant unlock toast on device, no server round-trip. Existing nightly sweep stays as cross-device consistency safety net.

**Replay-aware charity math (Lewis-blocked).** Currently 30-activities-per-month charity counter reads legacy `replay_views` (page-presence attribution, dormant since PM-235). PM-294's `replay_video_views` is more honest signal — members who actually watch vs who happened to be on page. Question for Lewis: switch charity math to new table, or stay on legacy to avoid breaking 30-activities denomination mid-trial? Sub-question: minute-weighted charity attribution (1 charity month per N total watch-minutes rather than per N completed views) possible via `SUM(watch_seconds)` but different mechanic — Lewis's call. Park until post-trial review.

**PM-315 device-walk validation + PM-316+ state-machine fix.** PM-315 CSP fix for YT IFrame API not yet device-validated. Hypothesis-confirmed by PM-311 diagnostics but not walked. Resumption procedure documented (schedule test `calendar_occurrences` row with `starts_at = now() + 30s`, invoke `session-publish` via pg_net, Dean force-refreshes app, starts Riverside stream, verify debug strip shows `ytLoaded: true` / `playerConstructed: true` / `lastState: -1 → 3 → 1` / `watchSeconds: 0 → 30+` / `hasFirstWrite: true`, confirm row in `session_live_views`). PM-316+ bug: state machine resolves LIVE strictly on clock-time `row._start <= now < row._end`. If YouTube `enableAutoStart=true` flips broadcast live BEFORE scheduled `starts_at`, page sits in PRE_ROLL even though YouTube is broadcasting. Tracker doesn't attach. Workaround per memory #23: test rows `starts_at = now()` or `now+30s`, never `now+10min`. Architectural fix: state machine queries YouTube broadcast `lifecycleStatus`. Three options — cron-driven flag on `calendar_occurrences` (zero client-side YouTube API exposure, 5-min cron lag) / client-side YouTube embed status probe via `YT.Player.getPlayerState()` (real-time, requires iframe earlier than current PRE_ROLL CSS hides it) / hybrid. Pick after sketch session, likely option 2.

**Engagement-v2 recompute fan-in retrofit (low urgency, wait-for-glitch).** Sibling to index.html `_rerenderHome` retrofit. Bus subscribers currently fan out individually; consolidate into a single recompute on writes-batch.

**Affirmations per-day-cap design issue (parked).** Identified in PM-379 audit. Defer.

**`session-rp.js` playlist ID lookup migration to Dexie catalogue (PM-390 follow-on, banked).** Currently each rp shell exposes `window.VYVE_SESSION.playlistId` inline; session-rp.js reads it directly. When `replay_playlists.youtube_playlist_id` changes for any slug, every rp shell needs manual edit. Move to Dexie lookup via slug — mirrors PM-377/PM-378/PM-384 pattern, lets Lewis manage replay playlists from Supabase Studio. Promotion: next time `replay_playlists` row needs to change AND any rp shell touched.

**Periodic rp-shell drift audit (PM-390 follow-on, banked).** events-rp drifted to standalone 17.6KB page without being caught. Worth periodic grep across `*-rp.html` for byte-count outliers — any rp shell >5KB probably drifted from canonical. Could be one-shot playbook entry.

**Refactor onboarding v74 to call `generate-workout-plan` EF.** Remove ~120 lines of inline duplicated logic. EF has richer implementation (dedicated programme-overview step, better prompts, cleaner video enrichment) than onboarding's inline copy. ~2hr, zero-risk if deployed atomically.

**In-app onboarding fallback.** Simplified questionnaire inside portal for members with no workout plan (~3-4hr).

**Onboarding resilience: save-answers-first.** Progressive answer saving + error screen (~2-3hr).

**Replay 3 throwaway EFs (PM-410 cleanup).** `replay-inventory-tmp`, `replay-archive-tmp`, `replay-ghost-cleanup-tmp` still ACTIVE in Supabase but dormant. Dean to delete via Supabase dashboard when convenient.

**EF cleanup of one-shot patchers (recount needed).** ~32 still-ACTIVE candidates per the 9 April security audit only partially actioned: `seed-library-1`, `seed-library-2`, `seed-b1`, `create-ai-decisions-table`, `setup-ai-decisions`, `setup-member-units`, `trigger-owen-workout`, `trigger-callum-workout`, `thumbnail-audit`, `thumbnail-upload`, `thumbnail-batch-upload`, `generate-stuart-plan`, `send-stuart-reset`, `monthly-checkin-test`, `run-monthly-checkins-migration`, `run-migration-monthly-checkins`, `resend-welcome`, `delete-housekeeping`, `send-test-welcome`, `send-test-push`, `inspect-members-schema`, `create-test-member`, `add-exercise-stream`, `force-cache-refresh`, `update-brain-changelog`, `debug-cert-content`, `debug-show-file`, `test-html-render`, `smoketest-ach-push`. Keep `ban-user-anthony` if ban workflow still in use. Composio doesn't expose delete-EF tool — needs Supabase CLI/dashboard. [VERIFY: confirm against current Supabase EF list before action.]

## Lewis-blocked

**Connect "This Week's Challenge" content (PM-415 brain park, 27 May).** Connect hub challenge surface is built end-to-end — `connect-challenge.html` page, `weekly_challenges` + `weekly_challenge_participation` tables live since PM-186/187 (22 May), `connect-challenge-summary` EF renders summary on connect.html. What's missing is a real challenge row in the database. Lewis hasn't seeded one. Same shape as the Replays content refill — engine is ready, content is the gap. Lewis adds first challenge via Supabase Studio (single INSERT into `weekly_challenges`) and the surface lights up. Recommend writing 4-6 weeks of challenge content ahead so the surface stays populated without Lewis touching it weekly.

**Engagement v2 voice copy pass (Engagement Score v2 #6).** All v2 band copy + 5 pillar explainer popovers + "How your score works" sheet body + 6 pillar empty-state hints.

**Re-engagement push thresholds copy (Engagement Score v2 #5).** 5 pillar-gap notification copy variants (one per pillar).

**Achievement tier curve overhaul v1 CSV (PM-358).** v1 per-tier copy review must land first. Then bulk-UPDATE per-tier title/body/copy_status='approved', then curve overhaul → v2 CSV → Lewis sign-off → bulk-UPDATE final.

**At-risk-streak push copy.** Concise, action-oriented, no emojis ("Your 11-day streak is at risk. Log anything to keep it alive."). Multiple variants for streak length brackets (3-6, 7-13, 14-29, 30+).

**Persona welcome copy spot-check in `persona_welcome_copy`.** Dean finalises lines via UPDATE; sweep-the-fallback-to-match when Lewis spot-checks.

**Mind v1 Lewis copy review.** affirmations / journal / breathwork seed content. `COPY_LEWIS_REVIEW` tags throughout.

**PF-13 hydration COPY_TABLE finalisation.** 23 entries tagged `COPY_DEAN_FINAL` in `/hydration.js`. ~30-45 min Dean writing time.

**In-App Tour copy + screenshot approval.**

**Calorie-target habit (PM-286.x).** New habit in `habit_library` auto-ticking when within daily calorie target. Wording is clinically sensitive — "stay within calorie allowance" frames as restriction (problematic for RIVER/HAVEN), "hit your protein and calorie targets" frames as performance (fine for NOVA/SAGE/SPARK fat-loss or muscle-gain). Phil sign-off mandatory. Persona-conditional assignment logic doesn't exist — needs new rule in onboarding/recommendation flow ("never auto-assign to RIVER/HAVEN regardless of goal_focus"). Autotick rule via `habit_library.health_rule jsonb` doesn't currently support `nutrition_logs` totals — existing autotick is HealthKit-driven. New evaluator code path or extend existing.

**Live check-in form variants (PM-213b) Phil sign-off on mindfulness variant.** Phil-blocked.

**B2B volume tier definition (pre-first-enterprise-contract).** Dean + Lewis.

**Annual pricing discount % decision.**

**5 disabled Make tasks — keep or remove decision.**

**Public launch comms draft.**

**HAVEN clinical sign-off (Phil-blocked).** Formally decide: approve as-is or gate pending professional review. HAVEN actively being assigned (Conor Warren, 15 April).

**Replay-aware charity math (Lewis-blocked, Infra/Data above).**

**Re-engagement copy review.** Bulk-approve subjects + body copy across the A/B ladder (A_48h/96h/7d/14d, B_3d/7d/14d/30d). Current copy carried forward from v7 staticBodies + AI persona overlay; structurally correct but not yet copy-passed post-rewrite.

**Login auth pages copy review.** Bulk approval gate before next round of polish.

## Calum-blocked (external dependency)

**Workout Engine v2 (parked 27 April 2026, awaiting Calum's filled inputs pack).** Architecture decided: deterministic engine (filter → score with context weights → rank → fill slots) replaces AI exercise selection. AI only for programme name/rationale (Sonnet 4) + Layer 2 reviewer (Haiku 4.5). Drops cost ~30× AND raises quality by encoding Calum's expertise as data. Stages on restart: import 203+67=270 scored exercises into `exercise_scoring` table + name normalisation layer → deterministic engine in TS in `generate-workout-plan` v12 behind feature flag → persist new onboarding fields (`priority_muscle`, `session_length_workouts` columns on `members`) + onboarding EF v78→v79 → code Calum's 20 QA scenarios as automated tests → shadow mode ~50 onboardings → cutover after Calum sign-off → Movement & Wellbeing engine (Dean's call: separate path from workout engine). Inputs pack drafted: `VYVE_Inputs_Pack_for_Calum.docx` (13-page structured questions doc) + `VYVE_Exercise_Scoring_Gap.xlsx` (67-exercise gap list in Calum's format).

## Post-trial / post-launch

**PM-358 tier curve + naming overhaul.** See Home / engagement bucket. After Lewis v1 copy review lands.

**Achievements badge artwork upgrade.** Current SVG generator covers 4 shapes × 4 tints in `svgTrophy()`. Future upgrade via AI image gen (Gemini + Claude art direction with VYVE brand grade). Drop-in replacement of `svgTrophy()` calls. Data layer doesn't change.

**Index.html dashboard slot — latest unseen / closest inflight achievement tier.** ~1 session low risk (reads existing `getMemberAchievementsPayload()` output). Phase 3 sub-task confirmed unstarted PM-3.

**Background audio play for mind/sleep tracks.** See Mind hub. Post-trial decision once engagement data confirms which content members want to background.

**Continue Watching tile.** See Infra / Data.

**Per-instructor drop-off analytics.** See Infra / Data.

**Per-category cumulative watch-time achievements.** See Infra / Data.

**Page_visits owned analytics + session_schedule windowing.** See Infra / Data.

**Local-sunset-aware hero rotation.** See Infra / Data.

**Profile identity remaining work.** See Connect hub (avatar library, Settings UI, Connect first-load modal, photo upload architecture, GDPR cleanup).

**In-App Tour (PF-23).** See Onboarding.

**View Transitions API wire (PM-394 plan item).** Lower priority since snapshot-first paint already solves visible flicker; ship as polish item for cross-tab nav animation. One chat.

**Persistent-shell SPA migration (Option 3 from PM-394, architecturally-correct answer).** 8-11 hours / 3 sessions of Claude-assisted work with full week headroom. Post-binary parked.

**Achievement tier-threshold rework (PM-3 future vision).** Several ladders feel sparse at upper end (e.g. habits jumping 100 → 250 → 500 → 1000). Surgical add-tiers-between-existing-thresholds — preserves existing earned `member_achievements` rows, preserves Lewis-approved tier copy via `copy_status='approved'` gate. Workflow: audit 327 tiers identifying worst-spaced ladders → draft new in-between tier copy → bulk-approval doc to Lewis → SQL migration adding rows with `CASE WHEN copy_status='approved'` protection. Estimated 2 sessions. Trigger: real cohort feedback that next-tier-too-far is hurting engagement, or part of broader Achievements polish. Folded into PM-358 above.

**Locked / mandatory habits model (PM-153 follow-on).** Habits VYVE assigns to a member — monthly theme habits, autotick HealthKit set — should be MANDATORY. Member cannot remove. CAN add their own habits on top and remove the ones added themselves. `removable` boolean on `member_habits`, set false where `assigned_by IN ('admin','onboarding','autotick','theme_update')` and true where `assigned_by = 'self'`. Settings picker renders locked habits as un-checkboxable with "Set by VYVE" label (Lewis copy gate on label). Correct `autotick-7b` `created_by` mistag to `null` as part of same work (4 library rows, 3 members each). Not trial-blocking. Pairs with `member_habits` re-add duplicate fix (no unique constraint on `(member_email, habit_id)` — soft-delete + re-add creates second row; add unique + upsert that revives existing row).

**Certificate re-pillaring — SHIPPED PM-435.** See canonical entry in Infra / Data above. Remaining: visual design pass + Mind persona "The Anchor" Lewis sign-off.

**Accessibility — large text + WCAG pass.** Flagged by Alan 21 April (struggles to read portal at large-text iOS setting). Four-option plan at `plans/accessibility-large-text.md`. Option 1 (restore pinch-zoom) is 10min; Option 2 (in-app text-size toggle in Settings) is ~half day. Full WCAG 2.1 AA pass needed before public sector / Sage procurement.

**Onboarding "Where are you based" tightening.** Free-text → typeahead (city autocomplete) for cleaner geocoding. Pairs with local-sunset-aware rotation. OR accept ~10% failures with Stripe-country centroid fallback.

**Other "Soon" items (lower-traffic):** Load `vapid.js` on other portal pages (currently only index.html has push subscription), `certificate-checker` push notification on cert earned, Hash emails before sending to PostHog.

**Other "Later" items:** Social activity feed (spec pending Lewis sign-off on 7 product decisions), Dashboard widget customisation, Persona context modifier system, AI weekly goals Phase 2 (behavioural goals from check-in data), Weekly progress summary email (blocked on Lewis copy), PostHog / Supabase Auth identity wiring, Milestone message system, Today's Progress dot strip (blocked on Lewis copy), BIMI logo in inbox sender avatar (staged: audit SPF/DKIM/DMARC → UKIPO trademark pre-Sage contract → VMC + BIMI DNS post first enterprise contract).

**Grants & Partnerships:** National Lottery Awards for All application, The Fore grant (register June/July 2026), WHISPA research partnership (monitor May 2026 launch).

## Backlog — security & hygiene

- **Delete throwaway EF `posthog-test`** (PM-559) — used once to verify PostHog connection; retired-but-ACTIVE. Composio has no delete-EF tool; remove via Supabase dashboard.
- **Command Centre App Health build (PM-559 spec).** Spec at `/mnt/user-data/outputs/app-health-build-spec.md` (NOT in repo — re-request from Dean or rebuild from changelog PM-559). Build: `cc_app_health` cache table + `cc-app-health` EF (hourly cron, reads `POSTHOG_API_KEY`) + `app-health.html`. Errors-first ranked by members-hit; live-read `platform_alerts` for instant resolve; usage/dead-pages/load-times cached from PostHog; VYVE light+dark; reviewer-only via `is_admin()`. Unconfirmed for builder: exact numeric property name on `perf_*` events (probe before wiring load-times).
- **Command Centre data-layer migration (PM-559).** Lewis's SPA runs on localStorage; `cc-adapter.js` written but OFF; `cc_*` tables empty. Future: keep shell, wire pages to `cc_*` + Storage, RLS reviewer-vs-own visibility. Honour multi-tenancy/role dimension in schema before parallel build sessions.
- **Command Centre SMS/text alerts (PM-559, Dean-wanted).** "Drop everything" alerts via text — email insufficient. Needs Twilio wired into App Health detector EF; fire only on real threshold (e.g. serious error hitting 3+ members/hour) to stay rare. Build after dashboard reveals what qualifies.

**Security Quick Wins (from 16 April audit — long-tail).**
- Fix XSS: escape `firstName` in `index.html` before `innerHTML` rendering
- Fix `running_plan_cache` RLS: change `public_update` policy to `member_email = auth.email()`
- Fix INSERT policies on `session_chat`, `shared_workouts`, `monthly_checkins`
- Remove 3 redundant RLS policies on `members` table
- Add explicit service-role-only policies to the 7 aggregation/admin tables (document intent)

**Brain Hygiene (from 18 April reconciliation — still open).**
- Full rewrite of `brain/master.md` — accumulated schema + EF churn since last rewrite warrants own session, not patches. (Note: master.md is on a known cadence; this is a marker.)
- `monthly-checkin` integration smoke test — Deno test against throwaway test member before each deploy. The column drift that caused the 500 would have been caught by a single POST test against live schema.
- Delete `staging/onboarding_v67.ts` — stale by 7 versions (live is v74). Misleads future AI sessions.
- Archive pre-April changelog entries into `changelog-archive/2026-Q1.md` — current changelog is 22815 lines and growing unboundedly. [VERIFY: confirm current line count and timing.]
- Document user-ban workflow — `ban-user-anthony` v8 exists; anthony.clickit@gmail.com is in `auth.users` with no `public.members` row (orphan). Decide reusable pattern if bans happen again.
- Migrate `exercise.html` + `movement.html` off `#skeleton` + `#app` dual-main pattern. Both pages have `<div id="skeleton"><main>...</main></div>` wrapper before `<div id="app"><main>...</main></div>`. nav.js hardened via `document.body.prepend` so dual-main no longer breaks nav, but pattern is fragile — future utility doing `document.querySelector('main')` picks skeleton one. Single `#app` root with internal `data-state="skeleton|ready|error"`. Pair with Design System Phase D.
- Housekeeping from PM-378/PM-379 cross-repo collisions: rename `brain/staging/architecture-map-pm378.md` + sibling PM-379/PM-380 staging files to suffixed labels (`pm378b.md` etc) to disambiguate. No downstream references — single grep + file renames + single brain commit.

**Design System — Phase Roadmap (remaining).**
- Phase D: Component primitives (~2 days) — Shared `.btn`, `.card`, `.input`, `.modal-sheet` classes. Removes 72 unique button class names, 90 unique card class names.
- Phase E: Typography + spacing scale migration (~1 day) — Replace 118 unique font-size values and 264 unique padding values with `--text-*`, `--space-*` tokens.
- Future: `VYVE_Health_Hub.html` redesign + PWA linking — out of scope for Phases A-E.

**External legal / compliance markers.**
- BIMI staging (see Post-trial section).
- HealthKit submission-scope decision: submit all 7 reads, or phase to 4 (workouts + weight + steps + active_energy) with v1.1 for HR/sleep/distance.
- Privacy.html HealthKit section + Lewis sign-off + App Store Connect questionnaire (per next iOS submission).

## Recently shipped (last 7 days)

Captured here so the at-a-glance state of the recent past is one short list, not 24 SHIPPED blocks of varying length. All have changelog entries.

- **PM-413** (26 May) — iOS 1.4 build 3 + Android 1.0.5 versionCode 50 BOTH submitted to App Review. Bundle session execution end-to-end.
- **PM-412** (26 May) — iOS splash storyboard fix landed in vyve-capacitor remote `4f5f55ae`.
- **PM-411** (26 May) — Brain park / Bundle-prep prompt + Body-hub overhaul campaign documented for Thursday pickup.
- **PM-410** (26 May) — Replay catalogue wipe via YouTube archive + `refresh-replay-videos` v2 reconciliation. 33 test videos archived to private YouTube playlist. All replay-side Supabase wiped clean.
- **PM-409.b** (26 May) — Pre-bundle debug surface gating (debug strip + reset achievements + unified dev-panel flag).
- **PM-409** (26 May) — Facebook Make connection refresh scrubbed from forward-looking surfaces. Pre-bundle hygiene continuation of PM-407.
- **PM-408** (26 May) — Analytics taxonomy lands before Capacitor bundle freeze.
- **PM-407** (26 May) — Stale Lewis-blocker scrub: Brevo logo (never existed), health disclaimer (done), weekly+monthly check-in slider copy mirror (done).
- **PM-406** (26 May) — Pre-bundle offline scope fix; chart.umd.js vendored locally; PF-14c §2a violation closed.
- **PM-405** (26 May) — Bottom-nav opacity split on Connect + offline scope audit pre-bundle.
- **PM-404** (26 May) — In-App Tour PF-23 elevated to next-up P1 after bundle ships.
- **PM-403.b** (26 May) — Pre-bundle monitoring restoration design end-to-end (Sessions A+B build prompt drafted). Build executes next chat. Three-times-daily digest cadence locked, severity recalibration locked, circuit breaker threshold locked.
- **PM-402** (26 May) — Broadcast push infrastructure end-to-end. Lewis-facing manual broadcast UI in Command Centre + scheduled-push cron rails. SQL: `is_admin` RPC + `admin_broadcast_log` + `broadcast_schedules` + `resolve_broadcast_audience(jsonb)`. Two new EFs: `admin-broadcast-push` v2 + `scheduled-push-runner` v2. pg_cron job 28. Live at admin.vyvehealth.co.uk/#/broadcast.
- **PM-401.b → PM-401** (25 May) — Connect-page flicker arc closed in three atomic vyve-site ships. PM-399 Your Journey snapshot, PM-400 live carousel background-image + reaction-tap site surgical patch, PM-401 renderRecentCheckins same-layout guard. Plus PM-396/397/398 Home tab-in flicker fixes (value-mutation snapshot, layout-shift reservation, habit content-late instant-paint).
- **PM-395** (25 May) — Reaction-tap cache mutation pattern (closes tap-time own-only fallback flicker).
- **PM-393** (25 May) — Real fix to Connect tab-in flicker via inverted cache-first paint ordering.
- **PM-392** (25 May) — Connect feed prefetch + cache-first paint.
- **PM-391** (25 May) — Revert PM-390 reaction-subscriber double-mutation.
- **PM-390** (25 May) — §23.65 envelope-trusted subscriber sweep on connect.html + mind.html; engagement-v2 L1682 dead subscribe converted; events-rp.html unified onto canonical session-rp shell.
- **PM-389.b** (25 May) — Activity Breakdown tile counts on engagement-v2 rewritten Dexie-direct.
- **PM-388.b** (25 May) — Mood check-in faces swapped to canonical Lucide glyphs.
- **PM-387.b** (25 May) — JS twins of PM-386 SQL fix + Activity Breakdown tile parity for Body/Connect.
- **PM-386.b** (25 May) — Mind/Body double-counting class fixed at root.
- **PM-385.b** (25 May) — tracking.js retired from 8 *-live.html shells.
- **PM-384.b** (25 May) — checkin_questions catalogue (Tier 2.3 from PM-379 audit).
- **PM-382.b** (25 May) — body:logged aggregator publish from the three Body publishers.
- **PM-381.b** (25 May) — bus.js event-name regex loosened to 2+ colon segments.
- **PM-379.b** (25 May) — Monthly check-in recap rebuilt around canonical 4 pillars (Habits/Body/Mind/Connect) + EF v19 4-pillar activity rollup + AI prompt restructured.
- **PM-378** (25 May) — Podcast platform links catalogue: `podcast_platforms` table + podcast.html `.hero-listen` rewritten as Dexie-read with FALLBACK_PLATFORMS cold-paint.
- **PM-377** (25 May) — How-to library catalogue: `how_to_resources` table + how-to-pdfs.html / how-to-videos.html rewritten as catalogue reads.
- **PM-376** (25 May) — Bottom nav Body icon swapped dumbbell → person-standing (Lucide).
- **PM-375** (25 May) — Member Prompts system: Lewis-driven in-app questionnaires.
- **PM-372** (25 May) — `hydration.js` COPY_TABLE migrated to `public.persona_welcome_copy` (Tier 2.1).
- **PM-369** (25 May) — Haptics expansion across settings.html (13 call sites).
- **PM-367** (25 May) — Mind videos catalogue migration.
- **PM-365** (25 May) — Haptics: nutrition.html water stepper + weight log + TDEE save + log-food.html food add/delete.
- **PM-364** (25 May) — Haptics bridge swept platform-wide (haptics.js loaded on 41 activity surfaces).
- **PM-363** (25 May) — Achievements toast haptic wire at `showNext()` chokepoint.
- **PM-362.b** (25 May) — Weekly check-in recap rebuilt around 4 pillars.
- **PM-360** (25 May) — Home-page habit sibling renderer (paired with PM-359 habits.html haptic).
- **PM-359** (25 May) — Haptics: habits.html log tap + index.html long-press V-logo + settings.html theme + notification toggles.
- **PM-354/355** (25 May) — Brain whole-file overwrite hazard; §23.58 codified.
- **PM-353** (25 May) — Achievements v3 Dexie-first evaluator rollout, all 6 pillars LIVE.
- **PM-319** (25 May) — Mind activities watch tracking.
- **PM-315** (25 May) — CSP fix for YouTube IFrame API on all 8 *-live.html shells (root cause of PM-304 silent failure).
- **PM-310 → PM-312** (25 May) — Live tracker debug surface; Settings Reset Achievements + Force Refresh App buttons.
- **PM-307** (25 May) — Movement first-class. `movement_activities` table live with 24 rows migrated, RLS + triggers match `mind_activities`. movement.html rewritten single-table, movement-history.html simplified, engagement-v2.html BODY metric extended to sum workouts+cardio+movement. Bus event taxonomy locked — `movement:logged` from movement.html only.
- **PM-300/301/305** (25 May) — engagement-v2.html three-tab shell + Your Journey rename + count hero promotion + charity callout + v1 engagement.html retired (redirect-only).
- **PM-298 + PM-296** (24 May) — Settings habit-save Supabase write failure fix (keepalive + on_conflict + merge-duplicates).
- **PM-295** (25 May) — Engagement Score v2 implementation phases 1-4 (schema, v2 SQL function alongside v1, JS port with parity 72/72 on real data, new engagement-v2.html behind `?score=v2` flag, bus subscriber wiring on all score-affecting events).
- **PM-293/291/287/286/285** (24 May) — Home habit surface, cross-page sync, pot-coloured habit tiles.
- **PM-286** (24 May) — PM-215 YouTube broadcast-creation cron paired with PM-251 consumer contract. `session-publish` EF v1 + `session_categories` + `session-publish-hourly` pg_cron.
- **PM-284 + PM-283** (24 May) — Focus done-state device validation (body.is-completed auto-stamp via MutationObserver, page-reopen done-restore in shared chrome).
- **PM-278** (24 May) — `VYVEHaptics` bridge shipped.
- **PM-274 phase 1** (24 May) — Twelve `/focus/<slug>.html` pages live with shared chrome + §23.39 Dexie-write dispatch. Home carousel taps now route to functional pages.
- **PM-267b → PM-261b** (24 May) — Seven-commit hero arc brought home into full §23.55 + §23.57 hub-page compliance.
- **PM-256/257** (24 May) — Home redesign atomic ship.
- **PM-255** (24 May) — Past Sessions + My PRs Dexie wiring (promoted to standalone `personal-bests.html` + `workout-history.html`).
- **PM-251** (23 May) — Live session pages redesign: schema migration + 8-shell rewrite + 5-state engine + sessions.html hub gate end-to-end.
- **PM-250** (23 May) — Web-shell rotate-overlay deletion + vyve-capacitor commit locking portrait at OS layer.
- **PM-242** (23 May) — Profile identity partial ship: read-side identity rendering on connect-feed.html + connect.html Recent Check-Ins LIVE.
- **PM-235b** (~24 May) — Hourly replay refresh cron.
- **PM-228** (24 May) — `member-avatars` Storage bucket.
- **PM-225** (24 May) — `public.taglines` table.
- **PM-215** (24 May) — YouTube broadcast-creation cron landed (paired with PM-251 consumer).
- **PM-213** (23 May) — Live session pages redesign superseded by PM-251.
- **PM-212 + 212.1-.7** (23 May) — Podcast hub MVP + six same-day follow-ups.
- **PM-211 spec** (23 May) — Single source of truth for live sessions specced (build deferred post-launch — see Connect hub).
- **PM-210b** (23 May) — Connect calendar member UI shipped end-to-end. `calendar_occurrences` table, db.js SCHEMA_V9, sync.js plan entry + CATALOGUE_INVALIDATION_KEY bump to `pm210-calendar-occurrences`, connect-calendar.html NEW 798 lines.
- **PM-209 + PM-209.1** (22 May) — Mind hub Today's Focus tile: thumbnail fills the card; §23.52 earned.
- **PM-201/200/199/198** (22 May) — Connect hub posted-state polish + community preview EF + reaction count from Dexie + Elite hero card.
- **PM-187 + PM-186** (21 May) — Connect Phase 2: spec lock + 5 tables migrated + counters-render-truth (§23.46).

## Dexie resilience — PM-436 follow-ups (added 2026-06-02)
- **Graceful open-failure fallback** — when `db.open()` rejects / `VYVELocalDB.isEnabled()===false`, aggregate surfaces (home rings `loadPillarCounts`, habits.html) must NOT render a confident `0/30` / "no habits". Either a neutral placeholder ("—") distinguishing "unknown" from "zero", or fetch server-side pillar counts (extend `member-dashboard` EF to emit the 5 lifetime ring counts — today no server source: `member_home_state` carries old-vocab `*_this_month` + v2 engagement points, not lifetime per-pillar). Also covers the separate iOS "IndexedDB lost" (PF-30) pattern. Talk-first (read-path blast radius). §23.83 corollary.
- **`dexie_open_failed` / `dexie_idb_lost` alert** — telemetry already emitted in db.js open `.catch` (PostHog). Wire a threshold alert so this class is caught instantly, not by eye. Quick.
- **Option B — multi-plan-local mirror via NEW store** — re-do PM-425's goal (both workouts + movement wpc rows mirrored locally) via a new id-keyed store (e.g. `workout_plan_cache_v2`), repoint sync.js persist + workouts-programme.js / movement.html reads, leave the old member_email store untouched. Post-launch, with a real-iPhone upgrade pass. Never re-key the existing store (§23.83).


## Go-live tail — PM-459 (2026-06-04)
- Make the runner hands-off: leave `python3 vyve-live-runner.py` daemon running, or install `com.vyve.live-runner.plist` launchd (needs the service key in an env file). 4 Jun 07:00 is the first scheduled real air — daemon must be up by then.
- Turn OFF `session-publish-hourly` (cron jobid 27) once the daemon owns broadcast creation.
- **SECURITY: rotate the service_role key** — exposed in the assistant chat 2026-06-04. Reset Supabase JWT secret (also rotates `anon`) + update all consumers (EF secrets, runner env, clients). Disruptive — plan it, not mid-air.
- Delete the ~00:43 BST test VOD (`qOmK6vZeTKo`, Yoga Flexibility) from YouTube Studio.
- 41 stale pre-re-curation calendar rows (22 May–3 Jun) still active — cleanup.
- Content calls: type-vs-per-host thumbnail mapping; drop numeric labels on flow/flexibility titles; connect-calendar card title reads `row.name` not `session_title`.


## Go-live tail update — PM-460 (2026-06-04)
- DONE: always-on runner installed as launchd LaunchAgent `com.vyve.live-runner` + relocated to `~/vyve-live` (macOS TCC); daemon healthy (PID, exit 0).
- DONE: cron 27 `session-publish-hourly` deactivated — daemon is sole broadcast owner.
- STILL OWED: rotate the exposed service_role key (now also in `~/vyve-live/vyve-runner.env`; reload the agent after); deactivate the 40 stale PAST empty-notes rows (22 May–2 Jun); delete test VOD `qOmK6vZeTKo`; watch first unattended air 4 Jun 07:00 (also the live:true device-walk sliver); content calls (type-vs-per-host thumbs, numeric labels, connect-calendar title row.name vs session_title).
- Mac-as-box caveat: keep plugged in + lid open; real home is a 24/7 server (systemd unit in repo).


## Replay clear — PM-461 (2026-06-04)
- DONE: all replay pages wiped to clean slate — 11 test videos deleted off YouTube, all 8 category playlists emptied, DB mirror (replay_videos/replay_playlists) zeroed. Empty replays are EXPECTED until sessions air from 4 Jun.
- DONE: test VOD qOmK6vZeTKo deleted (was a separate owed item).
- CONFIRMED: runner playlist-inserts each broadcast into its category youtube_playlist_id at creation; replays backfill automatically via the refresh cron. Live pages verified non-blank + correct category targeting (§23.90 / changelog PM-461).


## Box runbook + state — PM-462 (2026-06-04)
- DONE: live box operational runbook locked — launchd daemon + `caffeinate -i` + `sudo pmset -c sleep 0` (never sleep on mains). Run rule: plugged in, lid open, screen may be black. Sessions air automatically through 2 Jul.
- DONE: 4 Jun–2 Jul schedule (112 sessions) shared with Alan + Lewis.
- OPEN: first unattended air 4 Jun 07:00 — Lewis to eyeball the live:true flip.
- OPEN (carried): rotate service_role key; deactivate 40 stale empty-notes rows; calendar regeneration before 2 Jul; content calls; move runner to a real 24/7 box.


## BACKLOG — PM-608 — Proactive health alerting (issues must reach Dean before they become issues) (2026-06-12)
**Trigger:** a workouts bug (members onboarding with NO workout_plan_cache row generated) went undetected ~2 weeks because nothing watched for it; Dean found it by accident. Root cause of the blind spot: alerting watches emails (email-watchdog) + feeds a dashboard (cc-app-health) but NOTHING verifies onboarding actually worked end-to-end. onboarding v97 alerts only fire on *synchronous* throws; the background `waitUntil` plan-gen can fail silently with a 200 already returned.
**Full build spec lives in a handoff prompt** (see this session). Two phases:
- **Phase 1 — onboarding integrity monitor** (new `onboarding-health` cron EF, ~30 min): flag any member with onboarding_complete=true >15min ago but missing any of: active workout_plan_cache row (for workouts/movement stream), member_habits, auth user / signed-in (last_sign_in_at), current-week weekly_goals, welcome email sent, or flagged writeMember_core_fallback. Dedupe via a `health_alerts` table; immediate Brevo alert per new case; daily "all clear / N open" heartbeat into alert-digest.
- **Phase 2 — app usage health monitor** (daily into alert-digest): DAM drop vs 7-day avg; zero-activity-of-a-type platform-wide >24–48h; onboarding throughput → 0 for >24h (Stripe→onboarding broken); background-job health (plans generated vs onboardings started — catches waitUntil dying); push/email send anomalies. Reuse is_dean/is_test/staff filters.
**DO FIRST:** read-only backfill — count members ALREADY broken by the workouts bug (no plan / no habits / never signed in) and remediate that backlog, not just stop future cases.
  - ✅ **PARTIAL (PM-615, 15 Jun):** cardio plan-less gap closed — `ensure_foundation_running_plans()` reconciler (cron jobid 47, */5) assigns "Starter: Your First 5K" to any onboarded cardio member with no active plan; backfilled Paul Skipper + Kieran Day. Pattern extensible to other streams / no-habits cases.
  - ✅ **DONE (PM-617):** Consent-version stamping gap closed — server-side trigger `trg_default_consent_versions` fills `privacy_version`/`health_consent_version`=`'v1.0'` (fill-null-only) on any consent write, all clients/builds; 9 v1.0-gate rows backfilled; residual 0 (§23.119). RIDER: consent-gate.html should also write the two version fields at source on the next vyve-site build (gate stamps `terms_version` but omits these).
**Existing machinery to extend, not rebuild:** alert-digest EF (crons 29/30/31), platform-alert EF, email-watchdog (cron 16), cc-app-health (cron 38).

## BACKLOG — PM-607 follow-ups (onboarding resilience) (2026-06-12)
- Consider making members.weight_unit / height_unit NULLABLE (belt-and-braces) so a missing unit can never hard-fail regardless of code. v97 already coerces to 'kg'/'cm' in code (§23.117).
- Generalise the writeMember core-fallback principle (§23.118): audit other member-facing writes for all-or-nothing inserts that could lock a member out on one bad optional field.
- Welcome-email coach-voice rewrite into onboarding EF — AFTER Lewis approves the two mockups (welcome-email-v2-mock.html, coach-voices-comparison.html). HAVEN copy pre-written + Phil clinical sign-off, not AI-generated.
- Shaun Baker (shaunbaker122qa@gmail.com): password set to Mario123! via set-member-password — he should sign in directly with email + that password, NOT tap reset links.


## Partner onboarding — modules deferral (PM-659, 2026-06-22)

- **HELD migration awaiting Phil + Lewis sign-off:** `HELD_partner_modules_deferred.sql` (pasted in PM-659 chat) makes `compute_partner_onboarding_pct` + `assert_partner_golive` deferral-aware so a `modules_deferred` partner can reach 100% and go LIVE without the Safeguarding/GDPR assessment. Compliance posture decision (partner delivers live member sessions pre-safeguarding) — Phil (clinical) + Lewis (commercial/legal) must approve. Until applied, go-live BLOCKS deferred partners (correct; 0 live today). Apply trigger = first real deferred partner reaching go-live, OR the Video-modules/Education steps returning.
- **When modules return — re-enable + back-date:** add `3,4` back into `ACTIVE` in `partner-onboarding.html` (indirection handles the rest); client stops sending `modulesDeferred`; then `UPDATE partner_onboarding_progress SET steps=(steps-'modules_deferred')||'{"videos_watched":false,"safeguarding_passed":false,"gdpr_passed":false}' WHERE steps->>'modules_deferred'='true';` (gate reverts to full 8-step; they must complete for real).
- **Legacy partner rows:** 3 `partner_partners` rows (0 live) onboarded under the OLD faked-gate EF (v3 and earlier) show `safeguarding_passed/gdpr_passed=true` despite the gate never being honestly enforced; NOT `modules_deferred`-marked. If any are real partners (vs test rows), decide whether to re-flag / require real assessment. Verify identity before acting.
- **EF honesty note:** `partner-onboarding` EF before v4 hardcoded all go-live gates true at submit. v4 fixed this. Any analysis of partner onboarding completeness pre-PM-659 should treat those gate booleans as unreliable.

### Partner referral link — follow-ups (PM-682)
- **CC `partner-portal.html` Earnings "share this link" shows the WRONG link.** It renders `partner_partners.payment_link_url` (the bare £20 Stripe link) with "£10 off pre-applied" text — both now wrong. Should show the branded `https://www.vyvehealth.co.uk/join/<slug>` URL (that's what mints the discounted session). Quick patch to the Earnings render in `partner-portal.html`.
- **Deactivate the unused Men Together Stripe payment link** `plink_1Tlycv...` (bare £20, no longer referenced — the EF mints sessions now). Stop creating payment-link objects for new partners (§23.127; playbook updated).
- **`partner_partners.payment_link_url` / `payment_link_id` vestigial** — nothing reads them for the redirect. Harmless; consider dropping in a later cleanup.
- **Optional instant community-join** (currently ~15 min via reconcile cron #52): wire `welcome.html` to read `?partner=<slug>` and have the `onboarding` EF write the `partner_memberships` row from the `cs` (checkout session id) already in the success_url — leaves the earnings webhook untouched. Only if 15-min lag proves insufficient. The `?partner=` tag already rides the URL, currently inert.
- **`stripe-reconcile` cron #52 jobname still `stripe-reconcile-nightly`** but now runs `*/15`. Cosmetic; rename if it bothers.
