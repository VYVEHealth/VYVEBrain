# Partner Portal Premium Gap Map — P1–P6 (PM-1131, 8 Sep 2026)

**Continues the numbering in `tasks/partner-portal-gap-map.md` (PM-991, rows #1–18, all closed by PM-997).**
New rows start at **#19**.

**Benchmarks:** coach-portal.html post-PM-1127 (the internal premium bar) · **Mighty Networks** (creator community + content + events + Insights) · **Momence** (live-class business: schedule, attendance, packages) · **PartnerStack** (referral partner portal: links, commissions, resources, reporting).

**Baseline:** partner-portal.html post-PM-997 — 257KB, 155 functions, 11 views (dashboard, notifications, My Space, My Content, Community, Live Sessions, Calendar, Bookings, Earnings, Leads, Help), Account tabs (Overview/Settings/Checklist).

**Bar to clear:** coach-portal.html — 977KB, 638 functions, ~15 routed views, an 11-kind template library, a twelve-tab client workspace, an AI help drawer, automations, group messaging, challenges, scheduling, biometrics and a widget-grid dashboard.

---

## 0. The two findings that shape every wave

### Finding A — the portal is serving two products through one shell

Live `partner_partners` rows:

| partner_type | live | onboarding | declined |
|---|---|---|---|
| creator | 4 | 5 | 1 |
| ambassador | 4 | 0 | 0 |
| coach | 1 | 2 | 0 |

A **creator** runs sessions, uploads content, holds a community and takes bookings — nine of eleven views are theirs.
An **ambassador** refers members and nothing else — they land in a creator portal where My Content, Community, Live Sessions, Calendar, Bookings and Leads are permanently empty, and the one view they need (Earnings) is buried under "Business".
A **coach** is routed to coach-portal.html entirely and should never see this shell.

So the shell has to become partner_type-aware the way `pscope()` made coach-portal.html VYVE-scope-aware — one file, a NAV filter and a type-specific dashboard. Ambassadors get a PartnerStack-shaped portal; creators get a Mighty-shaped one. Building creator depth without this makes the portal *worse* for a third of live partners.

### Finding B — the PII boundary is the design constraint, not a limitation

Standing policy since PM-874/875: partner identities never cross to members and **member identities never cross to partners**. Enforced today by `partner-nudge` (reach out on behalf, never see the list) and by the ratings surface rendering "A member" (PM-996 asserts no email in markup).

That kills the direct coach analogues — no client workspace, no named threads, no per-member drill-down — and it is the right call. Mighty Networks is a deep product built almost entirely on aggregate audience data; every row below is aggregate-shaped or nudge-shaped by construction. Any row that would need a name is marked **PII-BLOCKED** and excluded.

---

## A. Shell, identity and skin (P1)

| # | Row | Source | Notes |
|---|---|---|---|
| 19 | **partner_type-aware shell** — NAV filtered by type; ambassador gets Dashboard / Earnings / Resources / Help; creator gets the full set; coach never reaches this file | Finding A | The gating row. Everything downstream assumes it. |
| 20 | **Type-specific dashboards** — ambassador cockpit = clicks / signups / converted / pending commission / next payout; creator cockpit = subscribers, session attendance, content plays, community engagement, rating, earnings | PartnerStack + Mighty | Replaces today's one fixed six-tile grid |
| 21 | **Widget-grid dashboard** — same move-don't-rerender pattern as coach W9 #107, prefs in `partner_partners.coach_ui_prefs` (already a jsonb column, `{}` on every row) | coach parity | Reuse the W9 code shape wholesale |
| 22 | **Premium skin pass** — the portal is on tokens.css v2 but reads flatter than the coach portal: card density, empty-state art, section rhythm, motion on state change | Dean's ask | **Mockup-gated.** Do this *last*, once the surfaces exist to skin |
| 23 | Mobile pass — the W1 sidebar collapses to a horizontal scroll strip; the coach portal's phone behaviour is better | coach parity | Small |

## B. AI help (P0 — ship first) — **SHIPPED PM-1158 (2026-09-11): coach-help v6 + partner corpus v1 + CC `82773323`**

| # | Row | Source | Notes |
|---|---|---|---|
| 24 | **`?` help drawer on the partner portal** — widen `coach-help` from `partner_type==='coach'` to any partner, derive `SURFACE` from partner_type instead of the `const`, add a `coach_help_corpus` row for `surface='partner'` | Dean's ask; Mighty "Co-Host" | Cache key, log table and daily caps are **already** keyed on `surface`. No migration. ~½ session |
| 25 | Corpus authored against the *partner* portal's real labels and routes — same 30-ish task-entry shape as `playbooks/coach-help-corpus.md` v1 | coach parity | Corpus quality is the whole product here |
| 26 | Ambassador-flavoured corpus entries (how attribution works, when payouts land, what the £25 rollover means) vs creator entries | Finding A | One corpus, type-tagged sections |

## C. Insights backbone (P1)

| # | Row | Source | Notes |
|---|---|---|---|
| 27 | **`partner_weekly` snapshot table + EF + Sunday cron**, mirroring `coach_client_weekly` / `coach-weekly-snapshot` exactly — subscribers, new/lost, session count, attendance, replay plays, posts, likes/replies, ratings, referral clicks/signups/conversions | coach W0 parity | **The row everything else reads.** Same shape, same cron slot pattern |
| 28 | **12-week strip** on the dashboard — value = last full week, delta vs 4 weeks back | coach W1 parity | Direct port |
| 29 | **Audience heatmap** — when this partner's members are actually active (day × hour) | Mighty Insights | Aggregate; drives session scheduling decisions |
| 30 | **Session analytics** — per-occurrence attendance, peak concurrent, chat volume, replay plays after the fact, average watch depth | Mighty Livestreams dashboard + Momence | `session_live_views` is thin (3 rows at PM-762); needs honest empty states |
| 31 | **Content analytics** — plays, completion, per-item trend; `play_count`/`attendance_count` are surfaced flat today (W3), no trend | Mighty | |
| 32 | **Community analytics** — posts, replies, likes, top posts, % member-generated | Mighty | `like_count`/`reply_count` exist |
| 33 | Export to CSV on every insights view | Mighty (web-only there) | Cheap, and it's what makes a portal feel like a business tool |
| 34 | ~~Per-member behaviour drill-down, churn prediction, cohort analysis~~ | — | **PII-BLOCKED.** Mighty is criticised for lacking these; we can't build them anyway |

## D. Audience & community depth (P2)

| # | Row | Source | Notes |
|---|---|---|---|
| 35 | **Announcements → aggregate threads** — partner posts an announcement, members reply, partner sees replies attributed by **first name only** (the `coach_thread_peers()` precedent already returns first names) | coach W3, PII-shaped | Not DMs. A community thread the partner can host |
| 36 | Attachments + voice notes on announcements — the `coach-message-media` bucket pattern, new prefix | coach W3 parity | |
| 37 | Realtime on the community feed — `partner_community_posts` into `supabase_realtime`, poll kept as fallback | coach W3 parity | |
| 38 | **Moderation** — report/hide/pin, keyword filter, one-click resolve | Mighty | Currently no moderation surface exists at all. Lewis owns the policy line |
| 39 | **Top contributors** ("build an ambassador culture" — Mighty's framing) — first names + counts, no identity beyond that | Mighty, PII-shaped | Feeds VYVE's own ambassador recruitment |
| 40 | Polls and questions as post types | Mighty | Small once #35 lands |

## E. Content & library (P2/P3)

| # | Row | Source | Notes |
|---|---|---|---|
| 41 | **Series / collections** — group content items into an ordered set with a cover; members see a series, not a flat list | Mighty Spaces/courses | Member-side change → OTA |
| 42 | **Drip release** on a series, anchored on subscribe date | coach W6 `coach_content_access` precedent | The coach drip already exists and is consent-anchored — port the anchor logic |
| 43 | Saved post templates / scheduled posts | Mighty + coach templates | `coach_templates` is partner-scoped already |
| 44 | Bulk upload + drag-reorder in the library | Momence/Mighty table stakes | |

## F. Sessions & bookings (P3)

| # | Row | Source | Notes |
|---|---|---|---|
| 45 | **Recurring session series** — today a partner schedules occurrences one at a time against a 48h minimum notice | Momence | `calendar_occurrences` supports it; the portal doesn't |
| 46 | **Capacity, waitlist and packages** on booked 1-to-1s — `trg_booking_capacity_guard` (coach W8) already does capacity properly | coach W8 + Momence | Waitlist is new |
| 47 | **Time off / blackout** fan-out, and an **ICS feed** for the partner's own calendar app | coach W8 parity | `coach-calendar-ics` v1 is token-auth'd and partner-generic in shape |
| 48 | **Public booking page** for a partner (the coach lead-booking door, generalised) | coach W8 parity | `coach-lead-submit` v3 already dropped the coach gate |
| 49 | Attendance marking + no-show tracking on live sessions (exists for bookings since PM-815, not for sessions) | Momence | |

## G. Earnings, referral, ambassador track (P4)

| # | Row | Source | Notes |
|---|---|---|---|
| 50 | **Resources / creative assets** — QR, banners, share copy, brand guide, in-portal | PartnerStack "Resources" | Currently: a link and a QR. This is the single biggest ambassador-side gap and it is cheap |
| 51 | **Performance tab** — clicks / signups / paid / commission by day and month, filterable | PartnerStack Performance | Reads `partner_weekly` (#27) |
| 52 | **Commission ledger with status vocabulary** — pending / approved / declined **with the decline reason**, plus withdrawal history | PartnerStack Commissions | We have `partner_payouts` (0 rows) + the £25 rollover discipline from W4; the missing piece is honest status + reason |
| 53 | Tier / milestone progress ("3 more conversions to the next band") | PartnerStack + gamification | Only if Lewis lands per-partner rates; parked otherwise |

## H. Automations & lifecycle (P4)

| # | Row | Source | Notes |
|---|---|---|---|
| 54 | **Automations engine** — trigger→action, per-partner, ledger-gated dedupe, stock set seeded on first open | coach W2 parity + Mighty Automations | Stock set: welcome on subscribe, session reminder, replay-is-up, lapsed-subscriber nudge, monthly recap. All [LEWIS COPY PASS] |
| 55 | Reuse `partner-notify` v2 + cron 67 as the send rail rather than a second sweep | existing | Already exists and already partner-generic |
| 56 | **Nudge-on-behalf, scheduled** — `partner-nudge` exists (1/day/partner, 1/member/month) but is manual and one-shot | existing + PII policy | The compliant version of "message my audience" |

## I. Challenges & engagement (P5)

| # | Row | Source | Notes |
|---|---|---|---|
| 57 | **Partner community challenges** — `challenge-score` EF is rule-driven and already scores coach and employer launches; a partner launch is a third caller | coach W4 parity | Board returns first names only — already the shape |
| 58 | Badges / leaderboard inside a partner community | Mighty gamification | **Parked** to the Achievements overhaul (32 metrics / 327 tiers) — do not build a second badge system |

## J. Trust, admin, settings (P5/P6)

| # | Row | Source | Notes |
|---|---|---|---|
| 59 | Forms — session feedback and community surveys, reusing the `coach_forms` 8-type renderer | coach parity | `longtext` alias fix from W9 part 2 comes free |
| 60 | Partner-side audit trail ("what changed on my space and when") | trust | `coach_client_events` precedent |
| 61 | Two-person surfaces — let a partner add a second login to their space | Momence staff management | Real for CICs like Men Together. `admin_users` role grant already supports it mechanically |
| 62 | `partners.vyvehealth.co.uk` custom domain + `PORTAL_BRAND_URL` flip | row #17 carry-over | **Dean Cloudflare action** — the last open item from the PM-991 map |

---

## Wave plan

Named **P1–P6** to avoid collision with the partner W1–W6 (PM-991) and the Trainerize W0–W9.

| Wave | Contents | Sessions |
|---|---|---|
| **P0** | #24–26 AI help drawer — **DONE PM-1158** | 0.5 |
| **P1** | #19–21, #23, #27–28 — type-aware shell, type dashboards, `partner_weekly` backbone, 12-week strip | 2–2.5 |
| **P2** | #29–33, #35–40 — insights views + community depth | 2.5–3 |
| **P3** | #41–49 — content series/drip + sessions/bookings depth | 2.5 |
| **P4** | #50–56 — ambassador track + automations | 2 |
| **P5** | #57, #59–61 — challenges, forms, audit, second login | 1.5–2 |
| **P6** | #22 premium skin pass (mockup-gated) + #62 domain | 1–1.5 |

**~12–14 sessions.** Recon-first every wave (the Trainerize discipline: the recon finding reshaped W6, W7, W8 and W9 and saved more time than it cost).

---

## Honest caveats

- **Live volume is near-zero.** 7 content items, 16 community posts, 17 memberships, 3 ratings, 4 bookings, 1 booking service, 0 leads, 0 payouts. 226 upcoming partner-attributed sessions is the one healthy number. Every analytics surface renders an honest empty state for a while. That was equally true of the coach portal at W0 (one real client) and it was still the right build.
- **P2 and P3 both carry member-side work** (#35 replies, #41 series) which means vyve-site commits and an OTA — and the OTA stack is already 34 commits deep at vbb 623.
- **Lewis owes copy** on: automation stock set (#54), moderation policy (#38), commission status vocabulary (#52), and any ambassador tier framing (#53).
- **Nothing here is Phil-gated.** No partner surface touches the Mind pillar — that boundary was set deliberately at PM-955 and holds.

## Exclusions (standing, Dean)

No partner payment tooling beyond the VYVE-merchant-of-record model. No impersonation. No self-serve deletion. No named member data on any partner surface, in any wave, for any reason.
