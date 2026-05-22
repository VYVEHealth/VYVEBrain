## Shipped 22 May 2026 — PM-209 + PM-209.1 Mind hub Today's Focus tile: thumbnail fills the card; §23.52 earned on near-miss home page deletion [vyve-site `316aded3` → `5488a1f9`]

**The change.** Mind hub `Today's focus` tile restructured. The 150px corner-circle thumbnail (`.thumb-hero`, radial-glow ring positioned absolute right:-30px top:-30px on the legacy `.hero-card` shape) is replaced by a full-bleed `.hero-banner` matching the `.vz-hero` detail-page pattern. Image fills the card top via `background-image` + `--bg-img` CSS variable, dark gradient bottom-half for legibility, badge top-left in a frosted-pill (4px blur + 55% surface-dark fill + 999px border-radius), title + meta stack bottom-left in white with subtle text-shadow. Play CTA retained as full-width teal bar below the banner.

Dean's feedback: the legacy corner-circle felt cramped vs the detail-page tile pattern members see one tap deeper (e.g. "Calm Your Mind" all-sessions list). The change brings hub-level imagery into parity with the detail page — one consistent visual language for Mind content cards.

**Files in PM-209 commit `316aded3`:** mind.html (CSS rewrite of `.hero-card` + new `.hero-banner` + removal of obsolete `.thumb-hero` corner-circle CSS + `.thumb-hero.has-img` block; markup restructure so badge + title + meta live inside the banner; `renderFocus()` rewrite to probe-then-paint via `new Image()` + `--bg-img` CSS var); sw.js (cache key `pm208-silent-refresh-a` → `pm209-mind-focus-banner-a`); index.html (vbb-marker 78 → 79).

**Recovery commit `5488a1f9` — PM-209.1.** The atomic 3-file commit initially deleted index.html from production for ~3 minutes. Root cause: `curl -d "$body"` where `$body` was a JSON string containing a 162KB base64-encoded index.html blob. Bash argv overflowed, the `python3 -c` capture that built the body returned empty, the `BLOB_INDEX` SHA variable came back empty, the resulting tree was built with `{path: 'index.html', sha: ''}`, and GitHub silently accepted the empty entry and dropped index.html from the tree. PM-209.1 fetched the parent commit's blob SHA via Contents API and restored the file on top of the broken HEAD using `curl --data-binary @/tmp/blob_body.json` (the pattern that doesn't route through argv).

**§23.52 earned — Never substitute large file bodies into bash argv.** Three sub-rules:
- (a) `curl -d "$body"` forbidden for any body >10KB. Write to `/tmp/*.json`, pass `--data-binary @file`.
- (b) Post-commit verify on atomic multi-file commits must inspect `GET /commits/{sha}` and assert `files[].status` matches expected modified/added — no surprise `removed`.
- (c) Any SHA captured from a blob/tree create must be asserted non-empty before downstream use.

§23.41 first-100-char re-fetch verify catches **content** corruption on files that did make it into the commit; (b) closes the gap for files that were dropped from the tree entirely.

**Brain note.** The Composio 21 May security incident is still active (24h+) as of this commit — all GitHub writes tonight went via Vault PAT + direct Git Data API per §23.40. If the outage extends past 72h, the Composio/PAT primary/fallback designation in memory #8 should be inverted.

---

## Shipped 22 May 2026 — PM-201 Posted-state polish: prewarm + identity + spacing [vyve-site `f2a923f7`]

**Three polish fixes on top of PM-200 Direction B after live-device feedback.**

**1. Cache prewarm from Connect hub.** `connect.html` `paintAll()` now calls `prewarmFeedPreview()` un-awaited which writes `connect-feed-preview` EF result to Dexie `_kv` if cache stale. EF logs showed `connect-feed-counts` cold starts at 10-13s under load (same Deno cold-start cost inherited by `connect-feed-preview`). By the time the member composes + posts (10-30s), the cache is warm — posted-state community feed paints instantly. Pattern: §23.7.7 fan-out-on-arrival applied to a sibling page.

**2. Own-card display name + avatar consistency.** PM-200 used `initialsFromName('', memberEmail)` which fell through to email local-part ("TE" for `test1@test.com`). Mismatched what other members see for the same account via EF resolution ("TC" via `first_name='TEST'` + `last_name='CLEAN'` + `display_name_preference='full_name'`). Added `resolveOwnInitials()` client-side helper mirroring EF logic, in-memory cached.

**3. Hero spacing tightened.** `body.posted-state-visible` class on render; CSS pulls topbar padding-bottom 8→4px and posted-state margin-top -4px. Hero sits ~10px tighter.

**Files in commit `f2a923f7`:** connect-checkin.html, connect.html, sw.js (`pm201-prewarm-polish-a`), index.html (vbb-marker 72).

**Edge case still open.** If member goes straight into check-in flow from a fresh app launch / deep link *without* opening Connect hub first, the prewarm hasn't fired. The cache is cold, the first-ever posted-state on a new install still waits on EF cold start. Mitigation if observed: fire prewarm from auth-ready instead of hub paint. Deferred until reported.

**Deeper structural fix parked.** Global-scope `connect_checkins` + `checkin_reactions` Dexie sync (currently own-member only via sync.js scope at line 235+253) would make the feed local — no EF on the read path, "Facebook-fast" by default. Phase 4 (offline-correctness sweep) territory. RLS is already permissive on SELECT (`_read_all` policies with `qual:true`), so the only blocker is sync.js scope wiring.

---

## Shipped 22 May 2026 — PM-200 connect-checkin.html posted-state Direction B (community preview embedded) [vyve-site `416cec0b` + `connect-feed-preview` EF v1 deploy]

**The reframe.** Posted-state was a transaction receipt + dead-end button row. Direction B (selected from three mocks — A moment / B community / C streak) turns it into a social on-ramp by putting the live community feed on the same screen. Three panels:

1. **Hero card (gradient teal):** own check-in as the largest element. Avatar + "You · Posted HH:MM" + italic Playfair prompt eyebrow + 1.8rem Playfair body + focus tag + own-reaction count from Dexie. "Posted ✓" badge top-right absorbs the receipt role.

2. **"Latest from VYVE" community preview:** 3 latest check-ins across **ALL members globally** (Dean's PM-200 scope decision, not workplace-scoped). Display names resolved server-side per `members.display_name_preference` (anonymous → "Member", full_name → first+last, initials → 2 letters, fallback → email local-part). Reaction emoji buttons interactive in place via optimistic Dexie write + outbox queue. Live pulse dot + "N today" counter. "🌱 You're the first one today" empty state when feed excludes own row.

3. **Single primary CTA:** teal "Open community feed →", ghost text link "Back to Connect", Playfair italic "Tomorrow waits with a fresh question." Lock + "come back tomorrow" dropped entirely.

**New Edge Function — connect-feed-preview v1 ACTIVE** (id `1782d22d-2b9f-428e-b5fa-d44738e78580`). `verify_jwt: true`, dual-client pattern (PM-187 connect-feed-counts shape). Returns latest 3 `connect_checkins` with `display_name` + `initials` resolved server-side, `reaction_counts` aggregated by emoji key (heart/strong/fire/hands/star/clap), plus today's distinct-member count. Mirrors §23.48 Pattern 4 on the client.

**Files in commit `416cec0b`:** connect-checkin.html (CSS + markup + render fn), sw.js (`pm200-community-preview-a`), index.html (vbb-marker 71). EF deployed separately via `Supabase:deploy_edge_function`.

**§23 contracts honoured:** §23.46 (counters render truth), §23.48 Pattern 1 hero + Pattern 4 community, §23.39 optimistic-first writes, §23.41 pre-commit HEAD refresh + post-commit verify.

---

## Shipped 22 May 2026 — PM-199 Connect hub reaction count from Dexie + pencil/tick icon swap [vyve-site `229601f1`]

**PM-198 follow-up cleanup.** Two gaps closed in `connect.html`:

1. **renderPostedState now toggles `#checkin-icon-pencil` / `#checkin-icon-tick`** alongside the CTA/badge/copy swap. Both SVGs shipped in PM-198 but no JS toggle existed — tick was permanently `display:none`, so the visual done-state indicator never appeared.

2. **renderRecentCheckins reads reaction_count from a `{ checkin_id: count }` map** built in `paintAll` via `Promise.all` over `connect_checkins.allFor()` + `checkin_reactions.allFor()`. Previously read `c.reaction_count` — a field that doesn't exist on `connect_checkins` rows. Hub Recent Check-ins always rendered `♥ 0` despite live reactions visible on `connect-feed.html` for the same rows.

Scope: own member, own reactions (v1). Matches existing hub scope comment at line 998. Feed-scope reactions for other members' check-ins remain a future thread when sync.js feed-scope hydration lands.

Bus subscriptions to `connect:reaction:logged` / `cleared` already in place from PM-187 (line 1044-1045) so cross-page tick-up from feed reactions repaints the hub automatically via `repaintDebounced`.

§23.46 contract preserved: paint defaults to 0, real value overwrites on Dexie read.

**Files in commit `229601f1`:** connect.html, sw.js (`pm199-recent-reactions-a`), index.html (vbb-marker 70).

---

## Added 22 May 2026 — Future-vision: community scale mechanics and internal dogfooding (PM-200 conversation, no build commitment)

**Two threads from the PM-200 conversation parked as future-vision, documented for context retention.**

### Internal dogfooding as cultural norm (no engineering required)

Dean's framing during PM-200: *"I would like to think that all of the guys that are on our app actually use this."* The empty-feed UX problem reframes into a leadership commitment.

**Expected baseline:** every VYVE founding-team member (Lewis, Dean, Alan, Calum, Phil, Vicki, Cole) uses VYVE as a member — check-ins, habits, sessions, Mind, Connect, the full surface. Accounts appear on the leaderboard, in Connect feed, in workplace scope, identical to any member. **No role flag, no team-account filter, no exclusion mechanic.** The product VYVE sells is the product VYVE uses.

**Tactical implication for trial:** team check-in cadence drives feed density without any engineering. At 15-20 trial members, 7 team members checking in daily doubles the active cohort. **Lewis-track action:** short Slack message setting an expectation that every team member checks in daily during the trial. Cole especially (community lead role).

**Separate "Content vs Check-in" distinction (also future-vision):** if VYVE later wants "official voices" — Phil sharing a clinical reflection, Calum sharing a workout reference, Cole publishing a community update — that's a Content surface, not a member-vs-team distinction. Not built. Not specced. Worth noting now so we don't conflate the two when one of them comes up later.

### Community scale mechanics — five candidates, all post-trial

When active member count grows past organic-feed thresholds, the following become worth considering. None MVP. None block launch. Build threshold listed beside each — decisions deferred until live data justifies one:

- **For You curated feed.** Algorithmic mix replacing linear "everyone today" feed: members reacted-to-before + workplace + same-prompt-as-you + recency-weighted. Default 8-12 cards, infinite scroll. **Build threshold: >100 daily posts.**

- **Hidden reaction counts below threshold of 3.** Show emoji icons, hide numeric count until ≥3 reactions. Removes the "0 reactions" sting that punishes vulnerability. Pattern from BeReal + recent Instagram experiments. Does NOT affect leaderboard scoring (separate surface, different mechanic). **Brand decision, not just UX — touches "evidence over assumption" company value. Lewis weigh-in required before build.** **Build threshold: >50 active members.**

- **Guaranteed first reaction sweep.** Cron sweep (every 4h) checks `connect_checkins` for rows >4h old with 0 reactions; ensures at least one supportive reaction lands via a house account (Cole / Phil / "VYVE Community"). Members never see "0 reactions". **Build threshold: >50 daily posts.**

- **Impression tracking + "Seen by N" surfacing.** New table `checkin_impressions(checkin_id, member_email, seen_at)` writes on render. Surface impressions on own check-in card ("Seen by 14 of your community") so posters feel seen even without reactions. Pattern from Substack. Schema cheap to add now; surfacing deferred. **Build threshold: >50 active members.** **Worth adding the schema soon to avoid retrofit cost.**

- **Reaction-asymmetry detection.** Algorithmic promotion of low-impression-low-reaction posts on next render. Inverts the social-media default. **Build threshold: probably 100+ active members.**

Mechanics compound — not mutually exclusive. Likely build order: dogfooding norm (no engineering) → hidden-count-below-3 (one EF flag) → impression schema (one table) → For You feed (full algo) → asymmetry promotion.

---

## Shipped 22 May 2026 — PM-198 Connect Elite hero card [vyve-site `d0ad5320`]

**What shipped.** Connect hub Elite section rebuilt to Cole Patterson's Premium-Feel mockup (19 May 2026). New shape: pencil check-in card first, Elite hero second. Elite hero is a 108px teal ring with a lock at centre, Playfair headline "The **Elite** Community unlocks at 30 days.", 10-dot consecutive-day strip below with "6 DAYS / 30 DAYS" end-cap numerals. Pencil card has SVG icon in a 64px accent circle, Playfair prompt, full-width teal CTA; done state swaps pencil → checkmark, teal → green, "Check In Now" → "View today's check-in".

**Streak mechanic now in production.** Elite = 30 **consecutive** days of activity. Miss a day, streak resets to 0. Source: `member_home_state.overall_streak_current` via `VYVEHomeStateLocal.computeHomeStateFromDexie()`. Dexie-first read, EF backup via existing sync.js hydration. UNION now includes connect_checkins on both sides (Supabase migration `pm198_add_connect_checkins_to_overall_streak` + client home-state-local.js update). Optimistic-tick via existing `connect:checkin:logged` bus subscription — the dot strip ticks immediately on check-in submit because the optimistic Dexie row lands before the page repaints.

**Files in commit `d0ad5320`:** connect.html, home-state-local.js, sw.js (cache `pm198-elite-hero-a`), index.html (vbb-marker 69).

**What's NOT in this ship.** Pillar realignment (Habits/Body/Mind/Connect/Checkins replacing the legacy 5 tracks) — that's PM-159, deferred post-launch. Achievements catalog 32 metrics × 327 tiers, certificate naming, engagement.html component math all still use legacy tracks. The Elite hero is forward-compatible: when realignment ships, `overall_streak_current` just starts reflecting the new pillar definitions and the UI doesn't change.

**Light-mode contrast** still flagged for Sunday Premium-Feel polish pass (PM-195/196). Tonight's CSS uses `--line-accent` border, `var(--teal-lt)` accents, `var(--text-muted)` for sub-line — all token-driven, so the Sunday audit fix propagates through automatically.

---

## Added 22 May 2026 — PM-197 Profile identity campaign: photo upload architecture, Connect first-load prompt, Edge Function usage analysis

**Three Dean questions from 22 May design discussion** that further extend the existing 21 May Profile identity campaign and resolve an open architectural concern about Edge Function usage. None of these supersede the existing spec — they add detail and resolve open questions surfaced in PM-196.

### Thread 1 — Connect first-load prompt placement (resolves PM-196 Thread 3)

**Dean's decision.** First-load prompt on Connect tab, not onboarding. Onboarding stays as it is (zero added friction). The first time a member taps Connect after signup, they get a single dismissible modal asking how they want to appear in the community.

**Why Connect is the right surface.** Onboarding is already long, and Connect is the first time the member encounters a social surface. The prompt is contextual — they have seen check-ins, leaderboards, recent-checkin cards on the hub. The question "how do you want to appear here?" makes sense at that moment in a way it doesn't during signup. This also implicitly answers the Option-A / Option-B / Option-C question from PM-196: Option B (contextual) wins for both avatar AND display name. Hybrid Option C is no longer the recommendation — Option B is cleaner.

**Modal flow.**

1. First time `connect.html` loads with `members.connect_onboarded_at` null (or `display_name_mode` null — pick one signal, probably the dedicated timestamp column for clarity), show a single modal: "Welcome to Connect. How would you like to appear?"
2. Display name picker (radio: full / first / initials / anonymous), pre-selected to "first" with the first name pulled from onboarding data
3. Avatar picker (curated grid pre-selected to a randomised V-badge variant, with "Upload your own photo" button)
4. "Save and continue" / "Skip for now" (skip applies defaults, modal does not re-appear — `connect_onboarded_at` written either way)

**Defaults matter.** First-name + curated V-badge as defaults means even the skip path produces a sensible identity. Members never appear as "Member" or as their email handle. This is the key UX decision.

**Page renders behind the modal.** The modal does not gate Connect — the page paints normally with the default identity applied, modal overlays. Skip dismisses the modal and the member sees their first interaction with defaults applied immediately. This pattern matches how Instagram, Strava, Linear handle similar first-load prompts.

**Schema addition** to the existing 21 May Profile identity migration:

```sql
ADD COLUMN connect_onboarded_at timestamptz
```

`null` means the modal still needs to fire; any non-null value means the member has been through it (saved or skipped). Single signal, no ambiguity.

### Thread 2 — Photo upload architecture (resolves the "local vs cloud" question)

**Dean's question.** "The profile picture I can be uploaded from the phone. How would that work, though? Would it store locally, or would it be stored on Supabase? How do the top companies use this?"

**The answer: centralised storage with aggressive caching.** Local-only storage is a non-starter for anything social — the avatar must render on other members' devices. WhatsApp / Slack / Instagram / Notion / Linear all use the same shape: upload to centralised storage, derive a public URL, cache locally for speed.

**The full flow (specced for build):**

1. Member taps "Upload your own photo" in the Connect first-load modal (or later in Settings)
2. Capacitor `@capacitor/camera` plugin opens the iOS native picker — photo library or take new
3. Plugin returns image as base64 or file URI
4. **Client-side processing before upload** (critical step that's often skipped):
   - Resize to 512×512 max (square crop, member chooses crop region or auto-centre)
   - JPEG quality 0.85
   - Strip EXIF metadata — iPhone photos contain GPS coordinates by default, must not upload
   - Library: ~30 lines of canvas-based resize. No external dependency needed
   - Reduces a typical 4MB iPhone photo to ~50KB
5. Upload processed JPEG to Supabase Storage bucket `member-avatars`
6. Storage returns public URL — format: `https://ixjfklpckgxrwjlfsaaz.supabase.co/storage/v1/object/public/member-avatars/{email-hash-or-uuid}.jpg`
7. Write URL to `members.avatar_url` (column already in the 21 May migration spec)
8. Every avatar render reads from `members.avatar_url`

**Bucket configuration:**
- Bucket name: `member-avatars` (matches existing 21 May spec)
- Public read (anyone with the URL can see — required for cross-member rendering on leaderboard / feed)
- RLS write policy: authenticated members can only write objects with their own member identifier in the path
- Standard pattern matching existing certificate + breathwork buckets

**Three-layer caching reality:**

1. Supabase Storage = authoritative source
2. Service Worker cache = aggressive local cache, no network on subsequent loads
3. Dexie = optional offline-safe cache (avatar bytes stored alongside member row)

The Service Worker tier is what makes this fast. Once an avatar is fetched once, it's offline for that user permanently (until cache eviction). The leaderboard re-rendering doesn't re-fetch avatar bytes from Supabase on every page load — it serves from SW cache.

**Single-size v1 vs multi-size.** WhatsApp generates 3-4 sizes server-side, Instagram 5-6. VYVE v1 ships ONE size (512×512). At 1000 members this is fine. Multi-size becomes worthwhile at scale or when feed cards want a different size from profile pages.

**Cost reality with live numbers.** Supabase Storage costs $0.021/GB/month after free tier. 1000 members at 50KB each = 50MB total = effectively free. 250GB egress included on Pro plan. The cost driver isn't storage — it's egress on leaderboard renders, which Service Worker caching neutralises.

**Anonymous + photo coupling rule (already in 21 May spec, re-stated for clarity).** If `display_name_mode = 'anonymous'`, avatar coerces to generic V-badge regardless of `avatar_kind`. Members who want photo-visible but name-hidden choose `'initials'`, not anonymous. The 21 May spec's identity.js (now profile.js per PM-196) helper enforces this coupling in one place.

### Thread 3 — Lewis conversation needed for photo policy

**The photo upload mechanic surfaces three Lewis-track concerns** that don't block engineering but need policy decisions before launch:

1. **Moderation strategy.** What's the plan if a member uploads inappropriate content? Existing 21 May spec defers AI moderation (NSFW / celebrity face rejection) to v2, accepts manual spot-check at trial scale (15-20 members). Lewis just needs to be aware that's the policy in writing. At larger scale, this becomes Phil's mental-health-lead-adjacent concern as well.
2. **GDPR Article 17 right-to-erasure.** Existing erasure pipeline deletes the `members` row but does not today delete the Storage bucket file. Bucket cleanup must be added to the erasure path as part of this campaign (already in 21 May spec build sequence step 6).
3. **Offboarding policy.** When a member churns / cancels, what happens to their photo? Options: immediate delete, soft delete with 30-day retention, anonymise the row but keep the photo for analytics continuity. Lewis call. Recommend immediate delete on cancel/churn to match the GDPR posture VYVE already takes.

These are explicitly flagged because the photo upload feature is the most exposure-sensitive single mechanic VYVE has built. Worth Lewis having sight before build, not after.

### Thread 4 — Edge Function usage analysis (resolves Dean's "does Dexie reduce EF usage" question)

**Dean's question.** "If we are using Dexie for the majority of stuff, so if Dexie paints most of the home pages and individual pages, and edge function is only really used on a backup, does that reduce the edge function usage?"

**Short answer: Yes, but Edge Function cost is not a constraint VYVE will hit for a long time.**

**Live numbers as of 22 May 2026 (queried direct from production):**

- 20 total members, 6 active in last 7 days
- 7 ai_interactions in 7 days, 18 in 30 days (anthropic-proxy + onboarding combined)
- 111 write-EF invocations in 7 days from activity logging (14 workouts + 19 cardio + 78 habits + 1 check-in via log-activity + wellbeing-checkin EFs)
- Read-EF invocations not directly measurable from DB; proxy: each active-member page navigation hits at least one read EF unless Dexie intercepts

**Supabase Pro plan pricing reality:**

- 2,000,000 EF invocations/month included
- $2 per million over the included quota
- Current rate: ~5,000 invocations/month → 0.25% of included quota
- 10× scale (60 active members): ~50,000/month → 2.5% of quota
- 100× scale (3000 active members — entire Sage account at full engagement): ~500,000/month → still under 2M ceiling

**What does Dexie actually reduce?**

Edge Functions in VYVE do four kinds of work:

1. **Read paths** (member-dashboard, employer-dashboard, etc.) — Dexie absolutely reduces these. Page paints from Dexie immediately, un-awaited `criticalHydrate` calls the EF in background, refreshes Dexie when response returns. Net: EF still called but off the critical path for paint, called less frequently because Dexie cache is valid for longer than per-page localStorage caches.
2. **Write paths** (log-activity, wellbeing-checkin, onboarding) — Dexie does NOT reduce these. Writes need server validation, triggers, RLS, activity-cap mechanics. Optimistic-first writes per §23.39 update Dexie immediately, but the EF call still fires.
3. **Cron jobs** (daily-report, certificate-checker, re-engagement-scheduler) — No client involvement, Dexie irrelevant.
4. **Privileged operations** (anthropic-proxy, send-email, github-proxy) — Must be server-side because they hold secrets. Cannot move client.

**The strategic implication.** PF-15 / PF-40 / PM-96 family campaigns making the portal local-first via Dexie are paying off in **paint speed and offline capability**, NOT in EF cost reduction. Those are the actual returns — and they're the right reasons to do that work. EF-cost reduction is a side-effect, not a goal.

**Actual constraints VYVE will hit before EF invocations matter:**

1. **Storage egress** on avatar serving if Service Worker caching is broken or absent. 1000 members rendering a 50-row leaderboard daily without SW caching = 75GB/month egress. Still under the 250GB included on Pro, but in sight. SW caching neutralises it.
2. **Realtime concurrent connections** when session_chat / Connect feed go heavily real-time. Pro includes 500. Trial scale fine; enterprise scale needs eyes.
3. **Database compute** — historically cheap, but a single bad query at scale can blow this. Not yet observed.

**No EF optimisation needed.** Don't restructure Edge Function architecture to "save money" — there's no money to save at any plausible scale before mid-2027. Optimise EFs for paint speed (which Dexie does naturally) and invocation latency (cold-start avoidance, `verify_jwt` decisions).

### Updates to existing 21 May Profile identity spec

Three additions to apply when the existing entry opens for build (in addition to the PM-196 supplement additions):

1. **Schema migration block:** add `connect_onboarded_at timestamptz` column (Thread 1 signal for whether the first-load modal has fired).
2. **Build sequence step 5 (re-wire surfaces):** add step 5b — Connect first-load modal in `connect.html` that fires when `members.connect_onboarded_at` is null. Modal contents: display-name picker + avatar picker + "Save and continue" / "Skip for now" buttons. Page paints behind the modal with defaults applied.
3. **Build sequence step 3 (Settings UI) — photo upload pipeline:** specify the client-side processing step (resize to 512×512, JPEG q=0.85, strip EXIF). Capacitor `@capacitor/camera` plugin handles the iOS picker. Library reference: lightweight canvas-based resize, no external dependency.

**Configuration decision parked for build kickoff:** whether to extract the resize + EXIF-strip into its own shared module (likely yes — also useful for any future "upload an image" mechanic e.g. workout photos, meal logs, certificate photos) or inline in profile.js (faster v1).

No other changes to the existing 21 May spec — it stands as written.

## Added 22 May 2026 — PM-196 supplement to Profile identity campaign + Light-mode contrast audit (Sunday-pass scope expanded)

**Two new threads from Dean's 22 May design discussion that touch the existing 21 May Profile identity spec and the PM-195 Sunday Premium-Feel polish pass.**

### Thread 1 — Light-mode contrast audit (Sunday-pass scope expansion)

**Dean's observation.** "I do everything in dark mode normally, and I really like how it looks. However, people like Alan like light mode, and I think that the light mode, some of the text is light gray or it's gray on white, and it's hard to read." Alan Bird (COO) is a light-mode user; light-mode contrast directly affects his daily use. Likely also affects light-mode users in the upcoming 15-20 person soft-launch trial.

**Hypothesis of root cause.** The portal's dual theme system (theme.js, `data-theme` attribute on `<html>` + localStorage) maintains parallel CSS token sets for light + dark. The dark mode tokens were designed first and tuned to look premium; the light mode tokens were likely derived by mechanical inversion (`rgba(255,255,255,0.5)` for secondary text in dark → `rgba(13,43,43,0.5)` in light). Mechanical inversion fails on white because the eye tolerates low-contrast light-on-dark better than the equivalent dark-on-light. Body text below ~4.5:1 contrast ratio fails WCAG AA accessibility; secondary text below 3:1 is hard to read for anyone, not just users with vision impairment.

**Scope for Sunday session.**

1. **Automated audit pass.** Script that walks every CSS file in vyve-site, computes contrast ratio for every text colour × background combination in both themes, flags every pair below WCAG AA (4.5:1 body / 3:1 large text). Output: a spreadsheet ranking failures by visibility (number of pages affected × frequency of element).
2. **Tightened light-mode tokens.** Secondary text needs `#5a6a6a` or darker, not faded teal. Borders, separators, skeleton states all need re-tuning. Light mode wants more saturated accent colours and darker text, not just inverted dark mode. Reference: WCAG contrast checker, also Stark plugin for Figma.
3. **Reference page approach.** Pick one page (likely settings.html or index.html — both are heavy text pages with mixed hierarchy) as the canonical light-mode reference. Get every text element passing AA. Then propagate the proven token set across the rest of the portal.
4. **Decision needed.** Whether the dark mode tokens get the same audit pass at the same time. Risk of "fixing" dark mode and breaking the premium feel Dean already likes. Recommendation: dark mode audited but only changes shipped where ratios fail WCAG AA — preserve the visual character of dark mode as-is.

**Sunday-pass scope.** This folds into the same polish window as PM-195's Body-tab flicker fix. Both are surface-level passes across all hubs with a single proven pattern propagated everywhere. Combined scope estimate: full Sunday + likely half of Monday. The Body flicker work is engineering-heavy (cache architecture); the contrast work is design-heavy (token tuning + audit). They share the per-page audit shape but don't share files — independent.

### Thread 2 — Profile preferences as a coordinated system (extends the 21 May spec)

The 21 May Profile identity spec is excellent but **missing a fourth concern that Dean raised in this discussion**: theme preference. Dean's framing was for an onboarding-time settings option covering: theme (light/dark/system), profile picture, display name privacy (anonymous / initials / first name / full name). Three of those are in the existing spec. Theme is not.

**Add to the existing spec — theme as a 4th persisted preference.**

Schema addition to the 21 May `ALTER TABLE members` block:

```sql
ADD COLUMN theme_preference text DEFAULT 'system' CHECK (theme_preference IN ('light', 'dark', 'system'))
```

`system` follows `prefers-color-scheme` media query. `light` and `dark` are explicit overrides.

**Why this isn't trivial — it surfaces a real architecture decision.** Currently theme is per-device localStorage. Dean toggles dark on his phone, his laptop still shows whatever it was last. For a single-member-multiple-device user that's annoying. If theme moves to `members.theme_preference`, it syncs across devices — same identity, same look, anywhere they log in. This is the right answer for a premium app. Implementation:

- On app load, after auth resolves, read `theme_preference` from members row, write to `data-theme` on `<html>`, also write to localStorage so subsequent page loads in the same session paint instantly from localStorage before the auth round-trip
- Theme toggle in Settings writes BOTH localStorage (instant local paint) AND `UPDATE members SET theme_preference = ...` (cross-device sync)
- For users not yet signed in (login page, set-password page), localStorage wins — they haven't yet identified themselves

This makes theme work behaviourally identical to the existing avatar/display-name pattern: written in Settings, persisted in members, consumed by all pages.

### Thread 3 — Where preferences get configured (onboarding vs in-context vs settings)

The 21 May spec puts avatar and display name in Settings, not onboarding, explicitly to avoid friction at signup. Dean's framing in this discussion suggested onboarding-time configuration. Trade-off worth resolving:

**Option A — All at onboarding.** New "Make it yours" step after the persona/habit assignment, before the welcome email. Pro: members hit Connect/leaderboard with their identity already set, no "Anonymous Member" placeholder on first interaction. Con: extends onboarding flow, decisions made before the member knows what the app feels like, theme is hard to choose before they've seen anything.

**Option B — Contextual prompts at first interaction.** Theme: one-time card on dashboard ("VYVE looks great in both — which do you prefer?"). Avatar/display name: prompted first time they tap into Connect or leaderboard. Pro: decisions in context, member already invested. Con: per-feature first-time prompt engineering, risk of skip leaving default state visible on social surfaces.

**Option C — Hybrid (recommended).** Theme: Option B (contextual). Avatar: Option B (contextual). **Display name: Option A** with first-name-from-onboarding as the smart default, no explicit prompt. Member sees their first name on Connect from the very first interaction; can change to initials / anonymous / full name in Settings if they want privacy.

The recommended default matters more than the option set. **First name as the default** gets community engagement on day one. **Anonymous as the default** turns the leaderboard into a wall of "Member" entries which kills the social mechanic before it starts.

### Thread 4 — Soft-launch tension (15-20 person trial, ~31 May target)

The 21 May spec correctly identifies that the full Profile identity campaign is 2-3 sessions, deferred post-launch. But the existing display-name default in the current system is the email's local-part (`test1@test.com` → `TEST1`). On a 15-person trial leaderboard that reads as test environment, not community. For the 8 Sage users in the system, it's worse — they shouldn't see each other's email handles.

**Surgical pre-trial ship to consider** (not the full Profile identity campaign — just the smallest possible piece that fixes the trial-leaderboard read):

```sql
ALTER TABLE members ADD COLUMN display_name text;
-- Backfill from onboarding first_name where present, fallback to email local-part
UPDATE members SET display_name = COALESCE(first_name, INITCAP(SPLIT_PART(email, '@', 1)));
```

Then rewire leaderboard.html + connect-feed.html + connect.html Recent Check-Ins to render `display_name` instead of email-derived initials. Single column, single backfill, ~1 session of work. The full Profile identity campaign (avatars + privacy modes + system-wide identity.js helper) ships post-launch as planned.

**Decision point for Dean** at the Sunday session or before: does the first-name-default mechanic block the soft launch, or can the trial run with email-derived initials and the full system ships in the first 30 days post-launch as a polish wave? My read: ship the surgical version pre-trial because the trial leaderboard read matters more than the full system polish. But Dean's call — could go either way without breaking the trial.

### Sequencing relative to existing campaigns

- **Light-mode contrast audit (Thread 1):** folds into PM-195 Sunday pass. Independent of Profile identity. Pure CSS/accessibility. No DB changes, no UX flow changes. Ship Sunday.
- **Theme as persisted preference (Thread 2):** adds one column to the existing 21 May Profile identity schema migration. Build sequence updated to include theme in the Settings UI work. No standalone session needed — merges into the existing campaign.
- **Onboarding vs context flow (Thread 3):** design decision at the Profile identity build kickoff. Doesn't change scope, changes where the existing Settings UI surfaces also fire as first-time prompts.
- **Pre-trial display_name (Thread 4):** standalone surgical ship, 1 session, before soft launch. Independent of full Profile identity campaign. **Dean to confirm whether to schedule this.**

### Updates to the existing 21 May Profile identity spec

When the existing entry is opened for build, three additions:

1. Schema migration block: add `theme_preference text DEFAULT 'system' CHECK (theme_preference IN ('light', 'dark', 'system'))` to the ALTER TABLE statement.
2. Build sequence step 3 (Settings UI): include theme toggle as a 4th control alongside avatar picker, display name radio, and the existing logout. Theme toggle writes both localStorage and `members.theme_preference`.
3. Build sequence step 4 (`identity.js` helper): rename to `profile.js` since the helper now covers identity AND theme. Function signature additions: `getThemePreference(memberRow) → 'light' | 'dark' | 'system'` and `applyTheme(preference)` which writes `data-theme` + localStorage.

No other changes to the existing spec — it stands as written.

## Added 22 May 2026 — PM-195 diagnostic: Body tab flicker (1-6s skeleton on navigation) [DIAGNOSED, fix queued for the Sunday/Monday Premium-Feel polish pass]

**Symptom Dean observed.** Tapping the Body tab in the bottom nav (test1@test.com on Dean's iPhone, native bundled iOS 1.3 (2) at the time, screenshot 17:34 BST 22 May) sometimes shows the exercise.html skeleton placeholders for 1 second (best case) up to 5-6 seconds (worst case) before content renders. Happens on bottom-nav navigation when the user has been away from the Body tab for some time. Inconsistent — not every Body tap reproduces it, but it's frequent enough to feel broken on a premium app.

**Dean's call.** Do not fix in isolation tonight. Diagnose now, document the candidate fixes, queue the actual ship for the Sunday afternoon / Monday day-long Premium-Feel polish pass alongside Home, Mind, Connect, and any other hub showing the same shape. Fixing one symptom in isolation risks breaking the existing local-first architecture (PF-15 / PF-40 / PM-96 family) and the timing-sensitive paint pattern (§23.46). The right scope is one coordinated pass with a single proven pattern across all hubs.

### Diagnosis (no fix shipped — for the Sunday session to pick up)

**File:** `exercise.html` (Body section hub per backlog drift correction — Phase 1 consolidation is inside exercise.html, not a new body.html file). Same shape may be present on other hub pages — to be confirmed during the Sunday audit.

**Current paint mechanic** (lines referenced from vyve-site HEAD `40a3d010` PM-194):

```
1. Page parses, skeleton renders (HTML at line 121-130, visible by default)
2. Synchronous IIFE `paintCacheEarly()` runs at line 274:
   - Reads email from localStorage['vyve_auth']
   - Calls readCache() — reads localStorage['vyve_exercise_cache_v2']
   - If hit + within CACHE_TTL: renderHero(cached) → reveal()
3. onAuthReady() fires (or runs immediately if vyveCurrentUser already set):
   - If _earlyPainted is false (cache miss in step 2), tries readCache() again
   - Always kicks off fetchPlan() in background to refresh
4. fetchPlan() (line 312) does:
   - Un-awaited VYVESync.criticalHydrate('workouts') call (PM-125 — Dexie network pull)
   - Awaits Dexie read OR falls back to REST
   - Writes new cache, re-renders if data changed
5. Skeleton watchdog at line 236: setTimeout 10000ms — if app still hidden, shows
   "Taking longer than expected. Please check your connection and try again."
```

**Six contributing factors identified:**

1. **CACHE_TTL is 1 hour** (line 197: `const CACHE_TTL = 60 * 60 * 1000`). After 1hr the cache is invalidated by `readCache()` and the page falls into the "no cache → wait for network" path. Dean's 5-6s slow case fits this exactly — last Body visit >1hr before the tap.

2. **The cache key is per-page only.** `vyve_exercise_cache_v2` is exclusively read by exercise.html. There's no shared upstream cache that other navigation entry points populate. Bottom-nav touchstart prefetch in nav.js doesn't currently warm this key.

3. **VYVESync.criticalHydrate runs un-awaited.** Per PM-125, the page does not gate first paint on Dexie hydrate. This is correct for paint speed but means Dexie having the data doesn't help first-paint on cold-cache hits — Dexie is hydrated AFTER paint, only useful for the next visit. The code comment at line 313-317 claims "Dexie-first: hydrate-await, read workout_plan_cache from local store, fall back to REST when spike-off or local miss" but the implementation doesn't actually read from Dexie before painting — it only kicks the hydrate as a side-effect.

4. **The skeleton stays up until reveal() is called or the 10s watchdog fires.** No mid-state — skeleton is fully visible during the entire fetch on cache-miss.

5. **The "fast 1s" case = cache hit but slight render delay.** Probably synchronous cache-paint runs but Playfair Display font load + a single layout shift produces a perceived flicker even when data is instant. The skeleton is `display: block` by default and `reveal()` swaps it for `display: none` on `#app` — between script parse and `paintCacheEarly()` completing, the skeleton paints at least one frame.

6. **The "5-6s slow" case = cache miss + cold network + Supabase round-trip.** fetchPlan goes to either Dexie (after hydrate completes) or REST (member-dashboard EF or direct workout_plan_cache query). On 5G with Capacitor WKWebView startup overhead, this can easily run 3-6s end-to-end.

### Candidate fixes (for the Sunday session to weigh)

Each is scoped — pick zero, one, or all. Order roughly cheapest-to-most-effective:

**A. Bump CACHE_TTL from 1hr to 24hr or remove entirely.** One-line change. The cache is invalidated on data change by writeCache anyway (called at end of every successful fetch). The TTL is belt-and-braces and creates the very problem we're trying to solve. Trade-off: stale cache served if the user's workout plan changes mid-day from another device. Mitigation: cache version bump (`vyve_exercise_cache_v3`) when schema changes, and the un-awaited fetchPlan still runs in the background to refresh.

**B. Add Dexie-first read in `paintCacheEarly`.** The code comment already claims this. Implementation: before falling through to skeleton, try `await window.VYVESync.readWorkoutPlan(email)` (or whatever the Dexie accessor is) with a short timeout (e.g. 50ms). If Dexie has the plan and localStorage doesn't, render from Dexie and write the localStorage cache in the same step. Adds one layer between localStorage and network skeleton. Risk: Dexie initialisation latency on cold app start.

**C. Pre-warm the Body cache from index.html's vyveAuthReady.** Pattern already used in auth.js line 786 (`_vyvePfHabits`, `_vyvePfHome`, `_vyvePfMembers`) — fire-and-forget background prefetch the moment auth resolves. Add `_vyvePfExercise` to the fan-out, which writes `vyve_exercise_cache_v2` so that by the time the user taps Body, the cache is already there. Most invisible win — no exercise.html changes at all if the prefetch helper writes the same cache key.

**D. Nav.js touchstart prefetch for the cache.** nav.js already has touchstart-prefetch on hub destinations per existing backlog item. If the prefetch primes `vyve_exercise_cache_v2` directly (rather than just network-warming), the Body tap arrives at a cache that was populated milliseconds ago by touchstart. Highest investment, most surgical result for the navigation-specifically case.

**E. Reduce skeleton lifetime to the first frame only.** Set skeleton `display: none` by default and only show it via `requestIdleCallback` after 100ms if `_earlyPainted` is still false. Most cache hits never see the skeleton at all because paintCacheEarly runs synchronously at script parse before the first frame.

### Recommendation (placeholder until the Sunday session looks at it cold)

Most likely Sunday outcome: **C + A + E**, in that order of priority.

- C eliminates the cache-miss case entirely for normal navigation flow
- A removes the artificial cache-poison-by-clock that creates the worst-case 5-6s flicker
- E removes the visual flicker on cache-hit even when data is instant

B is the deepest architectural improvement but Sunday-scope may not have time. D is overkill if C is in place.

**Do not pursue any of these tonight.** Dean's explicit decision: this is a coordinated Premium-Feel pass alongside Home / Mind / Connect refresh work, not a one-off patch. The diagnostic is here so the Sunday session opens with the picture already drawn — no rediscovery work, no time spent re-reading exercise.html paint sequence from scratch.

### Audit needed during the Sunday session

- Confirm Home (`index.html`), Mind (`mind.html`), and Connect (`connect.html`) have or don't have the same paint mechanic
- Check whether the §23.46 paint pattern (counters default 0, no skeleton chars, no localStorage snapshot) — used on Connect — should also apply to Body/Mind hubs, or whether the streams/cards-heavy Body hub needs a different pattern
- Verify nav.js touchstart-prefetch is wired for all hubs or just some
- Map every `vyve_*_cache_*` and `vyve_*_snapshot` localStorage key in use and document their TTLs in one place

### Why this matters for Premium-Feel north star

"Do whatever it takes to make this feel like a premium app with absolutely no lag and instant feel" — the active north star quoted in master. A 5-6 second skeleton on bottom-nav navigation is the single most visible violation of that promise. Fixing it is high-impact, even if not urgent. Sunday-pass is the right venue.

## Added 22 May 2026 — PM-193 follow-up: native splash + app-icon polish (Monday bundle session)

**Context.** PM-193 shipped vyve-site fixes for the login page (real `/logo.png` swapped in for the `<v>` placeholder + viewport switched to `interactive-widget=resizes-visual` to stop the form jumping when the keyboard opens). Dean's screenshots also surfaced two iOS-native issues that are NOT vyve-site fixes:

1. **Splash screen.** The launch image shows the logo too small, with a visible white border/box around it on a black field. Looks unbranded.
2. **Status-bar / app-switcher icon chip.** Same white-box-around-the-V appears as the running-app chip iOS surfaces in the status bar next to the page title. Same root cause — the app icon asset has an opaque white background where it should be transparent or VYVE Dark.

Both belong to `vyve-capacitor`, not vyve-site. Parked for Monday's bundle session — Dean's next planned Xcode/Mac sitting, when the full bundle is rebuilt for the next Capawesome OTA.

### Task 1 — Regenerate native iOS app icon + splash with correct background

**Source assets.** Canonical brand icon source on vyve-site is `/icon-512.png` (1024×1024 in the repo, despite the filename — 113434 bytes; see master §25). The current splash issue is almost certainly that the icon asset baked into the iOS Capacitor app was generated from an RGB-white-background PNG or has trapped whitespace inside the artwork bounds.

**Inputs required at `~/Projects/vyve-capacitor/assets/`:**

- `icon.png` — 1024×1024, **RGB** (no alpha — Apple rejects RGBA app-icon submissions per §23 historical rule), with the logo artwork fully bleeding to the safe-area edges. Background colour `#0D2B2B` (VYVE Dark) on the icon canvas — NOT transparent, NOT white. Apple will round-corner-mask automatically.
- `splash.png` — 2732×2732, **RGB**, VYVE Dark `#0D2B2B` background fill, logo centred at roughly **40% of frame width** (i.e. ~1100px wide), no white padding around the logo. The previous splash was generating with the logo at ~15% width inside a near-square white safe-area frame — that's what produced the "small logo with white box" effect Dean saw.

If the source `/icon-512.png` from vyve-site has any white pixels around the logo bounds, those need cropping out at source before this step. Quickest path: drop both PNGs into Figma or Photoshop, layer over a `#0D2B2B` fill, export as PNG-24 RGB (no alpha).

**Regen commands (on Mac, from `~/Projects/vyve-capacitor/`):**

```bash
# Ensure Sharp dependency is present (Apple Silicon needs --include=optional per §23 historical rule)
npm install --include=optional sharp

# Generate iOS icon set + splash assets from inputs
npx @capacitor/assets generate --ios
```

This produces `ios/App/App/Assets.xcassets/AppIcon.appiconset/` (multiple sizes) and `ios/App/App/Assets.xcassets/Splash.imageset/` (1x/2x/3x), overwriting the existing assets.

### Task 2 — Update `capacitor.config.json` SplashScreen plugin settings

**Current state (estimated, verify on Mac):** the SplashScreen plugin block is either absent or defaulted, which means the iOS launch image renders the storyboard's centred image at a small native size against whatever the LaunchScreen.storyboard background is set to.

**Target config** in `~/Projects/vyve-capacitor/capacitor.config.json`, add or replace the `plugins.SplashScreen` block with:

```json
"plugins": {
  "SplashScreen": {
    "launchShowDuration": 2000,
    "launchAutoHide": true,
    "backgroundColor": "#0D2B2B",
    "androidScaleType": "CENTER_CROP",
    "showSpinner": false,
    "splashFullScreen": true,
    "splashImmersive": true
  }
}
```

Keep any other existing `plugins.*` blocks intact (LiveUpdate / Capgo, HealthKit etc). The `splashFullScreen` + `splashImmersive` pair is the key change — they tell iOS to render the splash edge-to-edge rather than centring a thumbnail inside safe-area chrome.

### Task 3 — Verify LaunchScreen.storyboard background

`ios/App/App/Base.lproj/LaunchScreen.storyboard` may need its root view's background colour set to `#0D2B2B` directly in Xcode (Interface Builder) — the plugin's `backgroundColor` config governs the runtime splash overlay but iOS shows the storyboard frame for the very first paint before the plugin has loaded. If the storyboard background is white, there will be a brief white flash before the splash plugin paints over it.

Quickest path in Xcode: open the storyboard, select the root View, Background → Custom → `#0D2B2B` (R 13 G 43 B 43 / 0.051 0.169 0.169). Confirm the image view inside the storyboard still references `Splash` (the imageset name).

### Task 4 — Rebuild + reship

Standard bundle sequence (already documented in `playbooks/bundle-ready-campaign.md`):

```bash
cd ~/Projects/vyve-capacitor
git pull                              # pulls latest vyve-site contents into www/
npx cap copy                          # copies www/ into ios + android builds
npx cap sync ios                      # if config or plugin changes were made
open ios/App/App.xcworkspace          # Xcode opens
# Archive → Distribute → App Store Connect → submit 1.4 (or whatever PM-115 sequence dictates)
```

For Android in the same session: `npx cap sync android` then build the AAB via the same playbook.

### Verification checklist on installed device

After build lands and TestFlight installs:

- [ ] Cold launch shows VYVE logo centred, large (~40% width), on solid VYVE Dark background — no white border, no white flash
- [ ] App-switcher (swipe up + hold) shows the VYVE icon with no white box around it
- [ ] Status bar app chip (iOS PWA/native indicator next to the time when app is foreground) shows clean rounded icon, no white square

### Tooling / dependencies

- `npx @capacitor/assets generate --ios` v3 with single-icon scheme (1024×1024 AppIcon-512@2x.png) is the canonical generation path per master §11 historical rules.
- `npm install --include=optional sharp` on Apple Silicon is mandatory — Sharp's prebuilt binaries don't ship with the standard `sharp` install on M-series Macs.

### Why not push to vyve-site

This is entirely native-asset work. Nothing in vyve-site (HTML/CSS/JS portal) changes. The splash + app icon are baked into the IPA/AAB binary at build time and don't OTA via Capawesome — a new TestFlight + App Store build is required to ship.

## Added 21 May 2026 — PM-186/187: Connect Phase 2 spec lock + 5 tables migrated + counters-render-truth (§23.46) + step 1+2 SHIPPED PM-187

**Spec locked. Build started.** See `playbooks/connect-spec.md` for full design (~23KB). Five Supabase tables live as of PM-186; 30 daily prompts seeded. Steps 1-6 SHIPPED PM-187/187.2/187.3 (vyve-site head `d439477f7f0a5c3678e33d19ca69036b53ea31b9`).

### P0 — Connect build queue (Phase 2)

1. **connect.html (hub).** ✅ **SHIPPED PM-187** (vyve-site `597851534a9c83296c95f57ba789a6bf5e54268e` + `a7123667d2c13c003b314b23e5022b099919d5ef`). ~40KB / 919 LOC. §23.46 paint pattern verbatim (counters default 0, no skeleton chars, no localStorage snapshot). djb2 daily prompt rotation read from `daily_checkin_prompts`. Elite progress: client-side union across 4 pillar tables. Read-only. Bus subscribers wired (`connect:*`, `mind:logged`, `body:logged`). **Outstanding:** Recent Check-Ins reads own-rows only v1 — re-wires to feed-scope cache when connect-feed.html (step 3) ships.

2. **connect-checkin.html.** ✅ **SHIPPED PM-187.2** (vyve-site `97adfda00f964aa7277de8360ce22160973d6b9b`). Single write surface. Textarea max 60 chars, 5 focus chips, post button gated ≥3 chars. §23.39 optimistic-first write to `connect_checkins`. Already-posted-today guard flips into read-only posted state.

3. **connect-feed.html.** ✅ **SHIPPED PM-187.2** (vyve-site `97adfda00f964aa7277de8360ce22160973d6b9b`). Tabs: Workplace (label switches to employer name OR "VYVE Community") | Elite (🔒 until 30-of-any-activity / 30 days) | Following (coming-soon pill v1). Reactions only (♥💪🔥🙌⭐👏). §23.39 toggle pattern for `checkin_reactions`. Day boundaries explicit. End-of-feed footer (anti-doomscroll).

4. **connect-challenge.html.** ✅ **SHIPPED PM-187.2** (vyve-site `97adfda00f964aa7277de8360ce22160973d6b9b`). Read-only. Community ring + personal 7-day strip + body_md + workplace leaderboard tab. Auto-joins on first qualifying activity via EF upsert.

5. **EF `connect-challenge-summary` v1.** ✅ **SHIPPED PM-187 step 6** (id `1fbc2b53-2fe2-40d2-bb4d-aa27870388bf`, v1 ACTIVE). Computes community + personal counts for active challenge, upserts `weekly_challenge_participation.personal_count`. `verify_jwt: true`. Client cache 60s in `_kv`. Wiring SHIPPED PM-187.3 (vyve-site `d439477f7f0a5c3678e33d19ca69036b53ea31b9`).

6. **EF `connect-feed-counts` v1.** ✅ **SHIPPED PM-187 step 6** (id `0273fac7-3848-4cbd-82c7-31baea9a2838`, v1 ACTIVE). "X members checked in today" workplace + elite scopes. `verify_jwt: true`. Client cache 60s. Wiring SHIPPED PM-187.3 (vyve-site `d439477f7f0a5c3678e33d19ca69036b53ea31b9`).

7. **Sub-page audit pass.** sessions.html (Live This Week deep-link target — schedule = catalogue hydrate, chat = Realtime carve-out), leaderboard.html (§23.10 carve-out with designed offline state).

### Tables migrated PM-186 (no further migration work)

- `connect_checkins` — daily check-ins, unique(member, date), 60-char body cap, RLS read-all + write-own.
- `checkin_reactions` — one per member per check-in, swap-or-remove.
- `weekly_challenges` — author-curated, service-role-write.
- `weekly_challenge_participation` — denormalised personal_count.
- `daily_checkin_prompts` — 30 seeded across 11 tags.

### sync.js wiring ✅ SHIPPED PM-187

db.js SCHEMA_V8 + db.version(8) chained, sync.js 5 PULLABLE entries added. Compound-PK overrides for `checkin_reactions` and `weekly_challenge_participation` (generic `makeTable.replaceForMember` keys on `row.id`; these PKs are arrays). All member-data tables use the §23.43 merge-not-wipe shape (idempotent bulkPut → primaryKeys() → bulkDelete stale). Both catalogue tables use the existing `makeCatalogueTable` factory.

### Phase 4 add (from PM-186)

- **mind.html localStorage snapshot strip** (§23.46). Remove `paintFromSnapshot()`, `writeSnapshot()`, `vyve_mind_hub_snapshot` key, `.is-loading`/`.has-loaded` skeleton fade. Companion: grep portal pages for `vyve_*_snapshot` localStorage keys, strip those too unless on a §23.10 carve-out surface.

### Decisions resolved (no longer open)

- Elite threshold: 30 distinct activity days in 30 days, ANY of 4 pillar tables (`connect_checkins`, `mind_activities`, `body_activities`, `daily_habits`).
- Check-in body max: 60 chars.
- Reaction set: ♥💪🔥🙌⭐👏 (six fixed).
- Workplace label fallback: "VYVE Community" when employer is null.
- Daily prompts: library of 30, interchangeable via admin console post-launch (v1: SQL directly).
- Following tab v1: coming-soon pill (disabled).
- Paint pattern: §23.46 — counters default 0, no skeletons. Snapshot patterns forbidden on Connect.

### Drift corrections from PM-186

- **Body section hub is `exercise.html` (existing), not `body.html` (new).** Phase 1 consolidation is INSIDE exercise.html, not a new file.
- mind.html PM-183.4 snapshot pattern retroactively obsolete — added to Phase 4 strip backlog (above).

---

## Added 21 May 2026 — Profile identity system (avatar + display-name privacy) [post-launch, coordinated campaign]

**Surfaced in PM-188 design discussion** comparing the Connect mockup to the live build. Profile pictures and consistent identity privacy are the single biggest visual upgrade available to the Connect cluster — every feed card, leaderboard row, recent-checkin entry currently shows a teal initials badge ("YO", "SM", etc) which reads as email, not community. Dean's design call: full opt-in system, no required uploads, consistent privacy across every community-facing surface.

### Spec (locked in this discussion)

**Three-tier avatar system:**

1. **Curated avatar library — default state.** Library of ~12 abstract geometric designs in the VYVE palette (VYVE V badge variants, gradient circles, palette-tinted shapes). Every new member gets one assigned at signup (probably randomly, or default to a generic V badge — TBD at build time). No friction at sign-up.
2. **Upload your own photo.** Replaces the curated avatar. Goes into a new Supabase Storage bucket. Square crop, client-side resize to 256x256 JPEG before upload (keep storage small, load fast).
3. **Keep the curated avatar.** Genuinely fine, no nudging, no friction.

Avatar choice and upload both live in Settings, not onboarding. Onboarding stays as it is — adds zero friction to signup.

**Four-way display name privacy:**

- **Full name** — "Sophia Mitchell"
- **First name only** — "Sophia"
- **Initials only** — "SM"
- **Anonymous** — "Member" (clean, honest label — not gimmicky like "Quiet Tiger" / "Calm Walker")

Display name choice applies to every community-facing surface where the member's identity could surface: connect-feed, connect-challenge leaderboard tab, connect.html Recent Check-Ins, leaderboard.html, future Following surfaces.

**Coupling rule — Anonymous forces generic avatar.** If a member selects Anonymous as their display name, their avatar reverts to a generic placeholder (the default curated avatar or a soft silhouette). Showing a face next to "Member" defeats the privacy choice. Members who want their photo visible but name hidden choose **Initials**, not Anonymous.

**Unified leaderboard privacy.** Existing leaderboard.html has its own opt-in privacy toggle ("Members are anonymous unless they've opted in"). This new system consumes that — one setting drives every community-facing surface, no per-surface toggles. Less confusing for members. The existing leaderboard-only toggle is consolidated as part of this campaign.

### Data model

Schema additions to `members` table:

```sql
ALTER TABLE members
  ADD COLUMN avatar_kind text DEFAULT 'curated' CHECK (avatar_kind IN ('curated', 'uploaded', 'default')),
  ADD COLUMN avatar_id text,                  -- which curated avatar (e.g. 'avatar-04')
  ADD COLUMN avatar_url text,                 -- Storage URL when uploaded
  ADD COLUMN display_name_mode text DEFAULT 'first' CHECK (display_name_mode IN ('full', 'first', 'initials', 'anonymous'));
```

**Storage bucket:** new `member-avatars` bucket, public-read, write-restricted to authenticated member writing only their own avatar (RLS on the bucket). Standard pattern matching the existing certificate / breathwork buckets.

**GDPR Article 17.** The existing erasure pipeline deletes the `members` row but does NOT today delete the bucket file. Bucket cleanup added to the erasure path as part of this campaign.

### Identity helper (single source of truth)

New file `identity.js` (or method on `db.js`, decide at build time). Exposes a single function:

```js
function getDisplayIdentity(memberRow) {
  // Returns { displayName: string, avatarSrc: string }
  // Handles all four display_name_mode cases + all three avatar_kind cases.
  // Anonymous mode coerces avatarSrc to the generic placeholder regardless of avatar_kind.
}
```

Every community-facing surface re-wires to call this helper. Avoids divergence — if we change how "Initials" renders, one file changes, not eight.

### Build sequence (estimated 2-3 sessions, 4 if avatar SVG design takes its own session)

1. **Avatar asset set.** Design ~12 SVGs in-session. Dean approves at end of session 1, Lewis spot-check post-session.
2. **Schema migration.** §23.47 cross-check live `members` columns before lock. Migration + RLS for new columns + new bucket creation.
3. **Settings UI.** Avatar picker (grid of curated, "Upload your own" button), display name radio. Image upload flow with client-side resize.
4. **`identity.js` helper + integration.** Single function consumed by every community-facing surface.
5. **Re-wire surfaces:** connect-feed, connect-challenge leaderboard tab, connect.html Recent Check-Ins, leaderboard.html.
6. **GDPR pipeline update.** Add bucket file deletion to existing erasure path.

### Sequencing relative to other post-launch work

- BLOCKER for the Command Centre session content editor: none — independent surfaces.
- BLOCKER for the sessions.html catalogue swap: none — independent.
- This work is parallel-friendly with both. Could be done in any order, by any session.
- **Should ship before the soft-launch trial scales beyond the initial 15-20 if community feel matters for first impressions.** Worth raising priority if the trial expands.

### Out of scope v1 (deferred)

- AI moderation on photo upload (NSFW detection, celebrity face rejection). Months away — manual spot-check by Dean + Lewis at trial scale.
- "Report this photo" tap-and-hold on feed avatars → Command Centre moderation queue. v2 add, post-trial.
- Behavioural-style handles like "Quiet Tiger" — explicitly rejected, doesn't fit VYVE brand voice.
- Onboarding-time avatar selection — explicitly excluded, would add friction at signup.

### Why this matters

The Connect cluster's visual gap from the design mockup to the live build is overwhelmingly an avatar gap. Every other polish item (reaction counter prominence, focus chip placement, hub copy) interacts with how avatars render — fixing the cards without fixing the avatars means doing the visual work twice. Even so, Dean's call is to ship the visual polish FIRST and the profile identity system SECOND, post-launch. Rationale: launch is 31 May; the avatar/identity work is 2-3 sessions including SVG design; the visual polish to the cards/hub copy is roughly half that and surface-level. Polish first lets the trial members get visual improvement immediately; identity system follows when it can be properly designed.

### Owners

Dean: schema migration, identity.js helper, Settings UI build, bucket creation, re-wire surfaces. Lewis: spot-check of avatar SVG set, copy approval on Settings labels ("How you appear in the community"). Lewis: any tuning of "Member" as the anonymous label.

---

## Added 21 May 2026 — Session content management surface (Command Centre extension) [post-Phase-2, parallel to Phase 1]

**Why now.** Sessions currently edited via Supabase Studio table editor against `service_catalogue`. Fine for 31 trial members; unworkable at scale. Lewis (and probably Calum for fitness, Phil for mental health) need to edit session metadata on the fly — title, host, host avatar, start time, duration, short description (carousel), long description (sessions.html detail), image, active flag — without Dean in the loop. Surfaced 21 May 2026 in the step 7 design discussion as the natural next thing after Phase 2 closes.

**Where it lives.** `VYVEHealth/vyve-command-centre` (admin.vyvehealth.co.uk) — already gated by Supabase Auth, already the pattern for admin-only writes. NOT a new repo, NOT a new portal page. Role flag in `members` table (or admin-side `admin_users` table — TBD at design time) gates write access.

**Schema work first.** `service_catalogue` lacks several fields the editor needs. Verify live schema per §23.47, then migrate:
- `description` (long-form, sessions.html detail page)
- `short_description` (carousel subtitle, 60-80 char target)
- `image_url` (Supabase Storage URL)
- `host_avatar_url`
- Possibly `duration_minutes` and `host_name` if not already present in the live schema (likely present — verify)

**Storage bucket.** New `session-images` bucket, public-read, write-restricted to admin role. Existing certificate + breathwork buckets are the pattern.

**Member-side propagation.** Pattern 2 (per §23.48) catches it for free: Lewis edits a row, member opens app or refocuses, sync.js fan-out-on-focus pulls fresh `service_catalogue`, Dexie merges (§23.43), page repaints. No new architecture on the member side. Always-open-page edge case (a member with sessions.html open continuously when Lewis edits) waits at most one focus event — acceptable v1. Realtime broadcast deferred unless Lewis reports needing same-minute substitution propagation.

**Image handling on bundled-native.** Images fetched on-demand with a placeholder, not bundled into the binary. Service worker caches on first fetch. Reasoning: session imagery rotates, bundling adds 50-100MB of dead weight to the binary. Confirm SW cache strategy covers cross-origin Supabase Storage URLs (currently §23.10/2b says no cross-origin runtime deps in critical path — session images are NOT critical path, but verify SW handler doesn't choke).

**Scope of v1.**
1. Migration adding the missing columns to `service_catalogue` (per §23.47 cross-check first).
2. Command Centre page: list view of `type='live_session'` and `type='replay'` rows, edit modal with all fields, Storage uploader for image, save via PostgREST or thin EF (admin-write-only — needs role check on the server side, not just UI).
3. Member-side: zero changes if catalogue read patterns are already correct. Sessions.html and connect.html Live This Week carousel should be reading these new fields once step 7 ships. Audit during step 7 build that the read selects include the new columns (even if they're nullable at first).

**Sequencing.**
- BLOCKER: step 7 (sub-page audit on sessions.html + leaderboard.html) ships first — establishes the catalogue read pattern this depends on.
- THEN: migration + Command Centre editor (2-3 sessions estimated).
- Parallel-friendly with Phase 1 (Body section consolidation) — different repos, different surfaces.

**Out of scope v1 (deferred):**
- Realtime broadcast on `service_catalogue` changes (only if Lewis reports same-minute-substitution use case).
- Session recurrence rules / template patterns (one-off rows for now, copy-as-new for similar future sessions).
- Bulk import / CSV upload (single-row editing is enough at current volume).
- Audit log of who edited what (post-launch, add if compliance asks).
- Member-facing "session was updated" notification (probably not needed — silent update on next focus is fine).

**Owners.** Dean: schema migration, Command Centre editor build. Lewis: defines field copy lengths, decides who else needs write access beyond him.

---

### v2 layer added 21 May 2026 (PM-191) — YouTube broadcast lifecycle as the URL source (replaces "Lewis pastes a URL per session")

**The architectural decision.** Sessions on the portal need a working video URL that resolves live → replay automatically. The session row's `stream_url` (or equivalent) field is populated by the Command Centre via YouTube's Live Streaming API at session-creation time, not by Lewis hand-pasting URLs. This unblocks scaling from current ~4 live sessions/day to a planned 12-15/day where manual URL handling is no longer viable.

**Nine-channel structure (live, today).** VYVE Health operates 9 YouTube channels, all under one Google account, each paired with a dedicated Riverside studio. Channels include (non-exhaustive): Group Therapy, Workouts, Mindfulness, Podcasts. Each channel has its own stream key already configured in its paired Riverside studio. **This is the foundation the architecture sits on top of — not something to be migrated away from.** Master.md §5 Streaming row corrected from "8 channels" to "9 channels (1 Google account)" in this commit.

**The reusable stream pattern (YouTube API).** YouTube's `liveStream` resource has a `contentDetails.isReusable` property defaulting to `true`. With it true, one stream key can bind to unlimited `liveBroadcast` resources across time — channels schedule recurring live events with a single encoder. The Command Centre creates ONE persistent `liveStream` per channel (once, ever — stored as `youtube_stream_id` in a new `session_categories` table) and then creates many `liveBroadcast` resources, each bound to the matching channel's reusable stream via `liveBroadcasts.bind`. Riverside is configured once per studio with the persistent stream key and never updated again. Per-session, the only work is API-side broadcast creation; encoder side touches nothing. Verified against current YouTube docs (developers.google.com/youtube/v3/live, "Life of a Broadcast" + "Understanding Broadcasts and Streams" + `liveBroadcasts.bind`) on 21 May 2026.

**Why this is the answer to a problem Dean has hit before.** Dean has tried "use the same YouTube link" approaches previously and found broadcasts didn't reuse cleanly. Two failure modes likely caused those past failures: (1) creating broadcasts via the YouTube Studio UI rather than the API — the UI defaults to per-broadcast unique streams; (2) using the deprecated default-broadcast pattern (killed by YouTube ~2020). The reusable-stream + per-broadcast-bind pattern is the explicitly-documented current approach for recurring scheduled live events. Test required before committing to phase 2 build (below).

**Member-side time-based resolution.** Sessions table holds `youtube_video_id` (or full URL) per row. Portal sessions / live page query "what session is live right now" — the row where `scheduled_start ≤ now < scheduled_start + duration_minutes` — and embeds that row's video_id in an iframe. Same URL serves live (during the window) and replay (after YouTube auto-archives). At 7:10 the iframe shows meditation; at 7:30 (via either auto-poll or refresh) it shows affirmations. Resolution lives in the page, not at the streaming layer. Pattern 3 per §23.48 (time-derived state from catalogue, page-visible ticker, immediate re-eval on `visibilitychange→visible`). The pre-existing `session_schedule` table backlog item (line ~728 of this file) is the foundation — it remains valid; this work extends rather than replaces it.

**Castr's role unchanged.** Castr continues pushing scheduled pre-recorded content to channel stream keys. Live sessions are Riverside-pushed to the same keys. They're mutually exclusive at the encoder level (one RTMP source per key at a time) but coordinate via the schedule: Castr pauses for live windows, resumes after. Worth verifying current Castr plan supports automatic live-takeover or whether Lewis manually toggles — flagged for the test next week.

**Batch creation cadence.** Lewis fills in a recurring-session template once per category (e.g. "Daily Mindfulness, James Reid, 8am, 30min, Mindfulness category"). Command Centre rolls templates forward week-by-week, generates session rows, then on "Publish next month" calls YouTube's API in batch — typically ~360 sessions/month at 12-15/day cadence. Lewis touches no URLs. He runs the publish step once a month.

**Member-facing embed.** YouTube iframe embed with parameters strip most YouTube chrome: `rel=0`, `modestbranding=1`, `playsinline=1`, `iv_load_policy=3`, `showinfo=0`. The YouTube watermark and "Watch on YouTube" link survive but aren't worth optimising away at current scale. Broadcasts created **Unlisted** for member-only access (security-by-obscurity acceptable v1; signed-URL platforms like Mux/Cloudflare Stream are the upgrade path if true privacy becomes a contract requirement). Capacitor iOS quirk to verify on the test: `playsinline=1` should keep video in-page rather than forcing fullscreen, but worth confirming on the actual iOS build.

**Why YouTube over Mux/Cloudflare Stream/Vimeo (decision recorded).** Cost at 31 members is negligible across all platforms (<£20/month). At 500 members watching ~4hr/month, Cloudflare Stream ≈ £120/month delivery, Mux ≈ £3,000/month (25× more per-minute delivery), YouTube = £0. YouTube also has the cheaper migration story going forward — the only field that changes per session is the `stream_url` (or `youtube_video_id` mapped to a URL pattern). If member privacy or branded-player chrome becomes a real product requirement, swap to Cloudflare Stream is a contained change: same sessions admin, different embed renderer, different broadcast-creation EF. Not blocking today.

**New tables required (additive to the schema migration step above).**

```sql
-- One row per channel, one-time configuration
session_categories (
  id uuid PK,
  name text NOT NULL UNIQUE,           -- "Group Therapy", "Workouts", "Mindfulness", "Podcasts"...
  slug text NOT NULL UNIQUE,
  riverside_studio_url text,           -- For Lewis's reference, not used by code
  youtube_channel_id text NOT NULL,
  youtube_stream_id text NOT NULL,     -- The reusable liveStream resource ID per channel
  default_thumbnail_url text,
  brand_color text,
  sort_order int DEFAULT 100,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
)

-- Foreign key from sessions (or service_catalogue if we extend it)
ALTER TABLE service_catalogue ADD COLUMN category_id uuid REFERENCES session_categories(id);
ALTER TABLE service_catalogue ADD COLUMN youtube_broadcast_id text;  -- API-returned broadcast resource id
ALTER TABLE service_catalogue ADD COLUMN youtube_video_id text;      -- The watchable video id (== broadcast id post-creation)
```

Nine rows seeded in `session_categories` once during phase 2 setup, mapped to existing channels.

**Edge Function required.** `session-publish` v1 — takes a batch of session rows lacking `youtube_broadcast_id`, iterates them, calls YouTube Data API v3 (`liveBroadcasts.insert` + `liveBroadcasts.bind` + optional `thumbnails.set`), writes back `youtube_broadcast_id` and `youtube_video_id` on each row. Service-role only. `verify_jwt: true` at the gateway. OAuth refresh token for the VYVE Google account stored in Supabase Vault. Quota-aware (YouTube Data API v3 default quota is 10,000 units/day; `liveBroadcasts.insert` = 50 units; 360 broadcasts/month = ~18,000 units one-time, exceeds daily by margin — batch must split across multiple days OR weekly cadence). Quota math to verify in the test.

**Test required next week — explicitly out-of-scope until then.**

1. **Reusable-stream pattern works on a real VYVE channel.** Pick one of the 9 channels. Via API, create a fresh `liveStream` with `isReusable=true`. Create 3 scheduled `liveBroadcast` resources 10 minutes apart. Bind all 3 to the one stream. Push RTMP from Riverside through each scheduled window. Confirm: each broadcast goes live when scheduled, archives independently, and Riverside doesn't need stream-key changes between them.
2. **Back-to-back broadcast handover.** Two of the 3 test broadcasts should be adjacent (e.g. 10:00-10:10 + 10:10-10:20). Confirm Riverside can stream continuously across the boundary OR document the manual step required if YouTube doesn't auto-handover.
3. **API quota at session-cadence.** Measure exact quota cost of one full month's batch creation (target: ~360 broadcasts × all per-call costs). Decide weekly vs monthly batch cadence based on result.
4. **Castr live-takeover behaviour.** When Riverside is pushing RTMP to a stream key, what does Castr do with its scheduled push for the same key? Does it pause automatically or does Lewis need to manually disable Castr's scheduled slot before going live?
5. **Capacitor iOS embed.** Test the iframe parameters on the actual iOS build — does `playsinline=1` keep video in-page or does iOS force fullscreen?

**Build queue once test passes (not before).**
- Phase 1 (no YouTube dependency): `session_categories` table + the existing `service_catalogue` column additions, plus the Command Centre sessions list/edit UI reading and writing them. Lewis can hand-paste URLs as an interim workflow. Validates the admin surface independently of YouTube integration.
- Phase 2 (YouTube layer): `session-publish` EF, OAuth setup for the VYVE Google account, "Publish month" button in Command Centre. Phase 1 keeps working if phase 2 hits trouble.

**Owners updated.** Dean: schema, Command Centre UI, EF, OAuth integration, test execution next week. Lewis: defines the 9 categories (final names + the existing channel mapping), runs the test alongside Dean (he's the one with Riverside access).

---

## Added 21 May 2026 — PM-184: BUNDLE-READY CAMPAIGN (six phases, locked) + formal PF-40 closure

**This is the active campaign.** All other backlog items below either fold into the phases here, defer post-launch, or close as superseded. Full campaign reference: `playbooks/bundle-ready-campaign.md`. Pre-bundle audit framework: `playbooks/offline-correctness-audit.md`.

### Goal
Ship a bundled iOS + Android app that members can use offline on the tube, on a flight, in a hospital basement. Bundled shell + Dexie data + Capawesome OTA = a wedge no UK workplace wellbeing competitor has.

**Target ship:** 31 May 2026, or honest slip.

### Phase 0 — Mind section v1 user-visible
**SHIPPED 20 May 2026 (PM-173 → PM-183).** All six pages + hub real-wired. Outstanding (post-launch): ElevenLabs/Calum real audio swap, Lewis copy review of affirmations/journal/breathwork seeds.

### Phase 1 — Body section consolidation [NEXT — 2-3 sessions]

- [ ] **Decide `body_activities` table shape.** Default: table mirroring mind_activities (`kind` discriminator across workouts/cardio/movement, `ref_id`, `activity_date`, `client_id`, `duration_seconds`). Alternative: view-over-existing-tables. Decide in next session, take whichever is cleaner.
- [ ] **Migration:** `body_activities` table + RLS + indexes + BEFORE INSERT/UPDATE triggers + `client_id` UNIQUE constraint.
- [ ] **body.html hub build.** Today's focus (djb2 daily rotation across programme exercises or curated pool) + Day streak (distinct activity_date consecutive days, one-day grace) + Today's progress (today's count, display capped). Mirror mind.html shape precisely.
- [ ] **Sub-page audit.** workouts.html / cardio.html / movement.html / exercise.html. Verify Dexie-first reads (shipped via PF-7/PF-9/PM-154-170). Verify §23.39 writes. Gap-fill where surfaced.

### Phase 2 — Connect section build [steps 1-6 SHIPPED PM-187, step 7 remaining]

- [x] **connect.html hub build (NEW).** ✅ SHIPPED PM-187 (vyve-site `597851534a9c83296c95f57ba789a6bf5e54268e` + `a7123667d2c13c003b314b23e5022b099919d5ef`). Sections per PM-186 spec — Today's Check-In hero + Your Momentum (streak ring + Elite progress) + Live This Week carousel + This Week's Challenge + Recent Check-Ins preview + Latest from VYVE. §23.46 paint pattern verbatim — counter defaults 0, no skeleton chars, no localStorage snapshot. Lifted from mind.html shape directly (NOT body.html — that hub will be exercise.html when Phase 1 lands).
- [ ] **Sub-page audit.** sessions.html (schedule = catalogue hydrate; chat = Realtime carve-out). leaderboard.html (§23.10 carve-out — designed offline state showing last-cached ranking with "last updated X ago").
- [ ] **Charity impact data wire-up.** Currently computed via `get_charity_total()` SQL function. Verify Dexie-cached version is correct.
- [ ] **BUG (reported PM-184.1, Dean 21 May 2026):** Live sessions page view not updating live sessions progress. Member opens sessions.html / watches a live session → `session_views` row likely logs correctly to Supabase + Dexie, BUT the downstream progress counters (Today's progress on home, Day streak, engagement-score Variety contribution from sessions) don't reflect the view. Root cause not yet diagnosed — likely candidates: (a) `session_views` row writes but isn't subscribed via the bus, so dependent surfaces don't re-paint; (b) the 60s dwell threshold from PM-150 fires but the resulting row doesn't carry the fields downstream counters key off (`activity_date`? `client_id`?); (c) Today's progress / Day streak aggregations on home.html don't include `session_views` at all (would explain "live sessions progress" specifically). Investigate during Phase 2 sub-page audit; if it's category (c), fold the fix into Phase 3 pillar realignment when Connect-pillar counts get defined.

### Phase 3 — Pillar realignment [3-4 sessions, heaviest phase]

- [ ] **Home page rewrite (index.html).** Pillar tiles replace certificate-track cards. Activity Score Ring retained but Variety component reframes (next bullet). PM-73 home redesign mockup is a starting reference; pillar reframe likely changes the shape.
- [ ] **Engagement page rewrite (engagement.html).** Variety component reframes from per-activity-type to per-pillar coverage (Mind / Body / Connect). Each pillar contributes up to 4.17 points (12.5 / 3) to Variety. Scoring methodology section updated. Activity Breakdown table reorganises around pillars.
- [ ] **Weekly check-in rewrite (wellbeing-checkin.html + EF v29).** Activity summary rolls up Mind + Body + Connect activities. AI prompt to Anthropic includes pillar-coverage data. Slider questions updated (resolves the §22 "Weekly check-in slider questions" open decision).
- [ ] **Monthly check-in rewrite (monthly-checkin.html + EF v18).** Same as weekly.
- [ ] **Certificates re-pillaring.** Three pillar certificates (Mind / Body / Connect) replace five activity certificates. `pillar` column added to `certificates` table. Old earned certs grandfather as `pillar='legacy'`. Lewis sign-off on three new pillar titles + tier copy. (Pulled in from deferred-post-launch in §22 per PM-184 — ship a consistent surface or don't ship.)

### Phase 4 — Offline-correctness sweep [PRE-BUNDLE GATE — 2-3 sessions]

Framework: `playbooks/offline-correctness-audit.md`.

- [ ] **Schema audit.** Every member-data Supabase table has `updated_at TIMESTAMPTZ` + `BEFORE UPDATE` trigger. Catalogue tables too (delta-pull depends on it). Add where missing in one-shot migration.
- [ ] **Idempotency audit.** Every write surface generates `client_id` UUID client-side at write time. Server respects as dedupe key. Mind activities = gold standard. Verify workouts / cardio / daily_habits / exercise_logs / custom_workouts / exercise_swaps / weight_logs / nutrition_logs / weekly_scores / wellbeing_checkins / monthly_checkins / session_views / replay_views.
- [ ] **Airplane-mode device walk.** Dean's iPhone with `server.url` and network killed at OS level. Open every page in order. Record render behaviour (renders / spinner / empty / broken / honest offline). Anything broken or empty (when data exists in Dexie) = P0 fix.
- [ ] **Cold-start-no-network UX.** Login screen detects no-connection state, shows honest message ("VYVE needs internet for first sign-in. After that, the app works offline.").
- [ ] **Fan-out-on-focus pattern.** Capacitor `App.addListener('appStateChange')` triggers incremental delta-pull when app returns to foreground. Per-table `last_sync_timestamp` stored in Dexie `_sync_meta`. `where updated_at > [last_sync_timestamp]`.
- [ ] **`_sync_queue` drain hardening.** Drainer wakes on app launch, drains pending writes before letting user create new ones, handles ordering, resilient to individual row failures. Test against a simulated 2-week-offline queue.

### Phase 5 — Bundle and OTA [1 session]

(The three tasks below were already queued from PM-178; reframed here as Phase 5.)

- [ ] **Port PM-178 hotfix to main.** Two files (`exercise.html` `renderHero()` + `workouts-programme.js` `renderProgramme()`) plus sw.js cache-key bump. Use parallel session's `workouts-programme.js` shape verbatim (strictly more defensive — adds extra `{week, sessions: []}` fallback). Diff against `hotfix/programme-render-shape@b791fd51` for canonical source. Atomic commit on main.
- [ ] **Sweep main for unship-ready in-progress work** before bundling. Phase 1-4 work should account for most of this; this is the final gate.
- [ ] **First-ever OTA push to Capawesome production channel.**
  ```bash
  cd ~/Projects/vyve-capacitor
  mv www www.bak-pre-ota-$(date +%Y%m%d-%H%M%S)
  mkdir www
  curl -L -H "Authorization: token <PAT>" \
    -H "Accept: application/vnd.github+json" \
    "https://api.github.com/repos/VYVEHealth/vyve-site/tarball/<merged-SHA>" \
    -o /tmp/vyve-site-ota.tar.gz
  tar -xzf /tmp/vyve-site-ota.tar.gz -C www --strip-components=1
  grep -c "HOTFIX (programme-render-shape)" www/exercise.html www/workouts-programme.js
  npx @capawesome/cli apps:bundles:create \
    --app-id f9961f66-eb66-4102-b1c5-f9b2c7baeebf \
    --channel 89e12796-aa41-4176-8d78-bc2ef6dfd5c2 \
    --path www
  ```
  Consider `--rollout 0.1` for first-push safety. Roll to 100% after 24h clean telemetry.

### Phase 6 — External-blocker items (off the critical path)

These are tracked but not gating. Own owners, own timelines.

- [ ] HAVEN clinical sign-off (Phil). Conor Warren on HAVEN since 15 April — Phil to review interactions.
- [ ] Weekly check-in nudge copy split (Phil + Lewis). First-time activation vs continuity. Mental-health-adjacent.
- [ ] PF-13 hydration COPY_TABLE finalisation. 23 entries tagged `COPY_DEAN_FINAL` in `/hydration.js`. ~30-45 min Dean writing time.
- [ ] Brevo logo removal (~$12/month). Lewis — before any enterprise demo.
- [ ] **Facebook Make connection refresh — expires 22 May 2026 — URGENT.** Lewis.
- [ ] Public launch comms draft (Lewis).
- [ ] B2B volume tier definition (Lewis + Dean). Pre-first-enterprise-contract.
- [ ] Mind v1 Lewis copy review — affirmations / journal / breathwork seed content. `COPY_LEWIS_REVIEW` tags throughout.

### What drops off entirely (confirmed PM-184)

- ~~Layer 6 SPA shell~~ — dropped.
- ~~PM-71 / PM-71b dashboard payload trim~~ — obsolete post-bundle.
- ~~PM-72 materialise achievement_progress~~ — obsolete post-bundle.
- ~~§23.5.1 backend EF perf campaign~~ for home payload — obsolete post-bundle. Dexie-first paint renders <200ms regardless of EF latency.
- ~~PWA install prompt~~ code in index.html — slated for Phase 1 removal.
- ~~In-App Tour PF-23~~ — V2, blocked on Lewis copy, post-launch.
- ~~Achievements system major overhaul~~ — post-trial, post-launch.

### Formal PF-40 closure (logged PM-184)

PF-40's original 12-sub-item scope (PM-106, fat-row hydrate + write API + catalogue residency + offline UX + cleanup) was the wrong scaffolding for the actual problem. PM-111 device walk on `test1@test.com` diagnosed real bug as cache-writer/template shape mismatch (Habits "undefined" canary), not structural Dexie issue. Post-launch sub-items PF-40.3 through PF-40.12 were already deferred. Mind section v1 (PM-173–183) demonstrated the §23.39 optimistic-first skeleton organically replacing PF-40.4 (write API).

PF-40 sub-items mapping into Bundle-Ready phases:
- PF-40.1 (call-site audit) — SHIPPED PM-107. Artefacts retained as reference: `audit/pf-40-1-callsites.json`, `playbooks/pf-40-local-first-consolidation.md`.
- PF-40.2 Part A (debug probe) — SHIPPED PM-110.
- PF-40.2 Part B (structural fat-row fix) — DROPPED PM-111 as misdiagnosis.
- PF-40.3 (catalogue residency) — re-absorbed into Phase 4 schema audit + delta-pull.
- PF-40.4 (write API) — superseded by §23.39 organic emergence in Mind v1.
- PF-40.5 (read API) — superseded by per-page Dexie-first reads already shipped via PF-6/7/8/9/10/12.
- PF-40.6 (Tier 1 bundled assets) — SHIPPED via PF-14b bundled-mode migration PM-115.
- PF-40.7 (Tier 2 pre-fetch) — done in PF-7 thumbnail prefetch.
- PF-40.8 (Tier 3 CDN-on-view) — pattern already in use for YouTube thumbnails (PM-180/182) + workout exercise images.
- PF-40.9 (boot chain offline-equivalence) — re-absorbed into Phase 4.
- PF-40.10 (catalogue delta-pull) — re-absorbed into Phase 4 + Phase 4 fan-out-on-focus.
- PF-40.11 (offline UX) — re-absorbed into Phase 4 + Phase 3 pillar pages.
- PF-40.12 (spike-flag removal) — closed N/A (spike was merged to main in PM-95).

Net: PF-40 closed, all live work re-homed into the Bundle-Ready phases above.

---

## Added 20 May 2026 — PM-178 hotfix port + full-OTA push (three tasks, all P0 for next-OTA session)

Tonight's PM-178 session diagnosed the `programme_json.weeks` shape bug — every onboarded member's Body hub hero and Workouts → My Programme tab render broken. A parallel Claude session already committed the fix to vyve-site `hotfix/programme-render-shape` at `b791fd515b59f8adde181021ccae4ccc590887be` (branched from production SHA `83874dd5`). Patch verified clean. **OTA push deferred per Dean** — main has accumulated unsandboxed in-progress work, so the plan is to roll the hotfix into a full OTA bundle in a couple of days once main is sweep-checked.

### Three tasks for the next-OTA session, in order:

- [ ] **Port hotfix-branch patch forward into main.** Two files (`exercise.html` `renderHero()`, `workouts-programme.js` `renderProgramme()`) plus sw.js cache-key bump. Use the parallel session's `workouts-programme.js` shape verbatim — it's strictly more defensive than what PM-178 would have written (adds an extra `{week, sessions: []}` fallback for the case where `weekData` is an object but `.sessions` is malformed). Diff against `hotfix/programme-render-shape@b791fd51` for the canonical source. Atomic commit on main, brain entry as the new PM at that point.

- [ ] **Sweep main for unship-ready in-progress work** before bundling. Dean's words: "I've been editing a lot of stuff in the repo and I haven't sandboxed this." Whatever is sitting on main that works on Dean's dev loop (server.url-pointed iPhone) but isn't tested for a bundled cold-start needs to be either finished or gated behind feature flags / hidden surfaces. The OTA bundles **everything** in `www/`. Specific areas to check: PM-174 breathwork (catalogue tables present, verify hydrate fallback handles fresh cold-start), PM-174.1 (auth shape fix + nav-back, ensure no regression on other multi-view pages), PM-175 journal, PM-176 affirmations, PM-177 breathwork music engine + thumbnails.

- [ ] **First-ever OTA push to Capawesome production channel.** Commands codified in PM-178 changelog entry + §19/§23.42:

  ```bash
  cd ~/Projects/vyve-capacitor
  mv www www.bak-pre-ota-$(date +%Y%m%d-%H%M%S)
  mkdir www
  curl -L -H "Authorization: token <PAT>" \
    -H "Accept: application/vnd.github+json" \
    "https://api.github.com/repos/VYVEHealth/vyve-site/tarball/<merged-SHA>" \
    -o /tmp/vyve-site-ota.tar.gz
  tar -xzf /tmp/vyve-site-ota.tar.gz -C www --strip-components=1

  # Verify patch landed
  grep -c "HOTFIX (programme-render-shape)" www/exercise.html www/workouts-programme.js

  # Push
  npx @capawesome/cli apps:bundles:create \
    --app-id f9961f66-eb66-4102-b1c5-f9b2c7baeebf \
    --channel 89e12796-aa41-4176-8d78-bc2ef6dfd5c2 \
    --path www
  ```

  First-ever OTA: consider `--rollout 0.1` for safety. PM-178's read is 100% is fine because the patch is two defensive lines and every member's My Programme tab is currently broken. Dean's call at push time.

### Status of items that depend on this OTA

These are already wired/built on main but **invisible to production users until the OTA pushes**:
- PM-174 breathwork.html real wiring (shipped 20 May).
- PM-174.1 breathwork.html auth + view-aware nav-back fix.
- PM-175 journal.html real wiring.
- PM-176 affirmations.html real wiring.
- PM-177 breathwork.html music engine + picker thumbnails.
- PM-178 hotfix (this entry — only on the hotfix branch, not main yet).
- Any other vyve-site main commits between `83874dd5` and the merged SHA at OTA time.

### Why deferred rather than shipped tonight

Bundling `www/` from main right now would ship Dean's in-progress unsandboxed work alongside the fix. Bundling from `hotfix/programme-render-shape` would have been safe but means a second OTA in a few days when main is ready — two pushes in a row on the first-ever production OTA workflow is more risk than one well-prepared push. The hotfix branch is preserved unmerged for the two-day window — if the breakage starts costing customer trust, the branch is a one-command bundle away.

---

## Added 20 May 2026 — Mind section v1 COMPLETE (6 user-visible pages + hub all real-wired: breathwork PM-174 + music PM-177 + countdown PM-181, journal PM-175 + history PM-179, affirmations PM-176 + v2 PM-178, meditation + sleep + visualisation PM-180 via YouTube embed bridge + thumbs PM-182, mind.html hub PM-183 + 30s engagement gate)

Mind section infrastructure landed PM-173 (`fbda5ac8`). Schema + Dexie + sync + 4 patterns + 30 affirmations in place. **All six user-visible Mind v1 pages shipped** (breathwork, journal, affirmations, meditation, sleep, visualisation). Meditation + sleep + visualisation use a YouTube embed bridge as a week-long deliverable while ElevenLabs/Calum scripted audio is prepared. Only mind.html hub wiring (streak/counter to Dexie) still pending.

Mind section infrastructure landed PM-173 (`fbda5ac8`). Schema + Dexie + sync + 4 patterns + 30 affirmations in place. Three more vyve-site commits to complete Mind v1:

- [x] **breathwork.html real wiring** (P0) — SHIPPED PM-174 / vyve-site `0e59c180` 20 May 2026. Dean directive: "as in-depth as possible — make this the best breathwork in any UK wellbeing app." Full target shape:
  - Pattern picker from Dexie `breathwork_patterns` (with REST fallback per PM-96 PF-15).
  - Pre-session intro screen: pattern name, `about_text`, "Begin" CTA. Stops cold-starting into a ring members don't understand.
  - **Animated SVG ring that breathes**: expands smoothly on inhale (ease-in-out), holds steady on hold phases, contracts on exhale. Not a tick — a breath. CSS transforms or SVG path animation driven by the phase timer. This is the core "feels designed" moment.
  - Phase label + countdown inside the ring ("Inhale · 4s").
  - Round indicator ("Round 3 of 15").
  - **Adjustable duration via preset chips** (DECIDED PM-173-followup-4): three chips per pattern — Quick / Standard / Deep — labelled in minutes, not rounds. Member-facing language is minutes; rounds calc'd behind the glass as `round(target_seconds / sum(phase.seconds))`. Standard preselected = pattern's `default_rounds` rounded to nearest minute. Three taps gets member from picker to breathing.

  Per-pattern presets to seed:
  - Box Breathing: 2 / 4 / 8 min
  - Physiological Sigh: 1 / 2 / 4 min (cap short — fast stress-drop tool, not sustained practice)
  - 4-7-8: 2 / 4 / 6 min (breath-hold makes longer uncomfortable)
  - Coherent: 3 / 5 / 10 min (the one that genuinely scales)

  Longest session ceiling = 10 min (Coherent Deep). Music-cycling implication: tracks loop seamlessly within session via HTML5 Audio `ended` event → fade out 1s → next track in shuffle → fade in. Member never hears mid-session silence even if individual tracks are shorter than session.

  Schema add: `breathwork_patterns.presets jsonb` column — array `[{label:'Quick', seconds:120}, {label:'Standard', seconds:240}, {label:'Deep', seconds:480}]`. Migration `breathwork_patterns_presets_column` to land before breathwork.html session. `default_rounds` becomes vestigial — keep for now, deprecate post-launch.

  Considered and rejected: free slider 1-10 minutes (Othership-style). More precise but taxes the 95% who don't care about exact duration to serve the 5% who do. Three chips reads as intentional design; slider reads as config panel. Wrong tone for the premium aesthetic.
  - **Pause / Restart / End controls** (already mocked, wire for real).
  - **Background music** (per Dean explicit ask): per-pattern `ambient_audio_url` from catalogue. Day-1 silent-default; when assets exist in Supabase Storage, page auto-loads + plays on session start, fades on end. Pause button pauses both ring + audio. Music dropdown/pill row + volume slider — choice persists in localStorage. Default = None on first ever session (no ambush).
  - **Phase tone cues** (optional, off by default): if `inhale_tone_url` / `exhale_tone_url` present in catalogue OR Web Audio API synthesised inline (recommended — zero asset weight, deterministic, no licence). Soft chime on phase transitions for eyes-closed members.
  - **Haptic feedback** on phase transitions via Capacitor `@capacitor/haptics`. PWA fallback no-op. Free in native build, big eyes-closed UX.
  - **End-of-session screen**: "You completed N rounds of [pattern] — M minutes." Auto-logs to `mind_activities` with `kind='breathwork'`, `ref_id=<pattern_id>`, `duration_seconds=<actual elapsed>`, `client_id=crypto.randomUUID()` via cardio.html optimistic-first skeleton. 5-second undo affordance.
  - **Resume-mid-session**: backgrounded <60s = ring resumes where it was. >60s = clean reset. The premium-app detail free apps don't ship.
  - **History strip on the landing screen**: last 5 breathwork sessions (pattern + date + duration), Dexie read filtered to `kind='breathwork'`. Builds habit loop without needing hub wired yet.
  - **Streak/count chip on landing**: "5 sessions this week" / "current streak: 3 days". Reads `mind_activities` where `kind='breathwork'`.
  - **First-session-of-each-pattern tutorial overlay**: inline collapsed "First time? Tap to learn" card above the ring, expanded by default first time, collapsed thereafter. localStorage tracks per-pattern seen state.

  **Music sourcing — DECIDED (20 May 2026 PM-173-followup-2).**
  Library approach, not single-track-per-pattern. New catalogue table `breathwork_music` (uuid PK, title, artist, audio_url to Supabase Storage, duration_seconds, mood, bpm, sort_order, is_active). Public-read RLS. ~20 ambient tracks at launch, expandable forever via INSERT.

  Cycling pattern: each session-start picks a random active track, weighted to exclude the last 2-3 played (tracked in localStorage `vyve_breathwork_recent_music` array of UUIDs, FIFO max 3). Optional per-session lock via dropdown if member wants the same track twice. Default = shuffle.

  `breathwork_patterns.ambient_audio_url` becomes optional "this pattern always plays this track" override; day-1 ships with library only, no overrides. Per-pattern overrides are post-launch refinement Lewis can configure in Supabase.

  Sourcing — DAY-1 IS FREE. Path: **Pixabay Music** (pixabay.com/music) — free forever, commercial-use built in, no attribution required, no account needed. Lewis browses for an evening, downloads 20 ambient/meditation tracks that fit the brand, uploads to Supabase Storage. Cost: zero. Time: 1-2 hours.

  **Stable Audio free tier** is the strong runner-up (stableaudio.com) — 20 AI-generated tracks/month included with commercial-use licence on the free tier, 90-second loopable clips. Worth grabbing 5-10 here as well so the library has unique-to-VYVE tracks alongside the Pixabay ones.

  **Upgrade path post-revenue** (not day-1): Suno or Udio paid (£8-10/month) for unlimited AI-generated commercial tracks; Artlist (£18/month annual) for premium curated library. Both upgrade paths preserve the library schema — new tracks INSERT into `breathwork_music`, old ones stay or get deactivated.

  Free-tier options to try and skip if quality insufficient:
  - YouTube Audio Library — free, commercial use, but needs YouTube account (annoyance). Smaller catalogue than Pixabay.
  - Free Music Archive — free but licensing is per-track; many require attribution or are non-commercial only. Workable but requires reading each track's licence.
  - Suno/Udio free tier — generate freely, but output is non-commercial under free tier; need £8-10/mo paid plan for commercial-use licence.

  Avoid entirely: Artlist (paid), Epidemic Sound (paid), Uppbeat (paid for commercial), Musicbed (too cinematic, wrong vibe).

  Day-1 default behaviour: None (no audio ambush). Member toggles audio on via the session screen control; choice persists in localStorage. Volume slider visible when audio enabled.

  Migration name when shipped: `create_breathwork_music_table` (P0, must land before breathwork.html session can wire audio).

  New §23 hard rule from this session: any breathwork session UI MUST publish `mind:logged` on completion using `client_id: crypto.randomUUID()` via cardio.html-style optimistic-first / un-awaited POST / 4xx-revert skeleton. No awaited POST in the foreground — PM-167 / PM-169 learning applies.
- [x] **PM-177 — breathwork music wiring + picker thumbnails** SHIPPED (vyve-site `f5ad43f9`). `breathwork_music` catalogue table exists and is empty. Implementation shape: intro-screen music row (like the tones row PM-174 shipped), session-screen mini-track card showing currently-cycling title, cycle on session start with FIFO last-3 exclusion via `localStorage.vyve_breathwork_recent_music`, volume slider persisting to `localStorage.vyve_breathwork_music_volume`, off as first-ever default (no audio ambush per PM-173 spec). `pattern_affinity` text[] column lives on `breathwork_music` already — soft weight, not hard filter, same shape as imagery. Estimated ~200 lines added to breathwork.html. Catalogue hydrates via the same sync.js pattern PM-174 used for imagery — just add the entry after the imagery one.

- [x] **affirmations.html real wiring** (P0). SHIPPED PM-176 (vyve-site `dd900fb1`). Three sections: hero today / favourites strip / browse-all with 5 category chips. Daily pick deterministic via `djb2(memberEmail + dateStr) % active-count`. Save → mind_activities kind=affirmation ref_id=<affirmation_id> via §23.39 skeleton. Tap any row to set-as-today (localStorage override, clears on date roll-over). Storage decision LOCKED: `affirmation_favourites` join table (separate from members row, allows saved_at ordering, atomic insert/delete). Schema migration `pm175_create_affirmation_favourites` shipped: id uuid PK + member_email + affirmation_id FK + saved_at + client_id, UNIQUE(member_email,affirmation_id), 3 RLS policies. Dexie SCHEMA_V6 adds the store. sync.js adds member-scoped hydrate. Favourites toggle via parallel optimistic skeleton (DELETE keyed via UNIQUE constraint columns, not row UUID). Share via navigator.share with clipboard fallback. 30 affirmation rows still COPY_LEWIS_REVIEW placeholders per Dean PM-94 framing.
- [x] **journal.html real wiring** (P1). SHIPPED PM-175 (vyve-site `79cbcf1e`). Three views: compose / calendar / entry. §23.39 skeleton. 40-prompt inline `PROMPT_TABLE`, deterministic daily pick (day-of-year mod). Edit + delete with confirm. ref_id stores prompt id, content stores entry text. mind_activities (PM-173) reused with no schema change.
- [x] **mind.html hub wiring** SHIPPED PM-183 (vyve-site `f44c7104`). Today's focus daily rotation (djb2 % 10 across 5 meditation + 2 sleep + 3 visualisation) + Day streak (mind_activities consecutive days, one-day grace) + Today's progress (count, display capped 2/2). Inline player IIFE copied from PM-180 by design — consolidation deferred. placeholder-tag stripped. 30s engagement gate also added to meditation/sleep/visualisation player IIFEs — Mind v1 user-visible COMPLETE.
- [ ] **mind-insights.html v1** (P2, post-data). Trends over time. Needs members logging for a few weeks first.
- [x] **visualisation.html real wiring** SHIPPED PM-180 (vyve-site `326b5606`) via YouTube embed bridge. 3 tracks (The Beach hero + Manifestation + Reprogramming). Same inline-modal player as meditation.html + sleep.html. Catalogue is a hardcoded JS const — swap iframe → `<audio>` when ElevenLabs/Calum audio lands, no page rewrite needed.
- [x] **meditation.html real wiring** SHIPPED PM-180 (vyve-site `326b5606`) via YouTube embed bridge. 5 tracks (Calm Your Mind hero + Morning + Anxiety + Abundance + Sleep meditation). mind.html hub Meditation tile re-routed from mind-library.html.
- [x] **sleep.html real wiring** SHIPPED PM-180 (vyve-site `326b5606`) via YouTube embed bridge. 4 tracks (20min Sleep Meditation hero + NSDR + rain + ocean waves). mind.html hub Sleep tile re-routed from mind-library.html.

**Open product calls (for breathwork session):**
- Default ambient audio asset (Pixabay/Freesound; ~200KB soft pad or rain).
- Inhale/exhale tone cues: audio file OR Web Audio API synthesised inline.
- Round count UI: stepper / dropdown / slider.
- First-session tutorial overlay shape.

**Catalogue content management (Lewis):**
- 30 affirmations seeded by Claude as placeholders. Lewis to edit live in Supabase `affirmations_library` table. Schema documented in §19.
- 4 breathwork patterns seeded. Add a 5th by INSERT (no app update needed).
- Wim Hof-style breathing parked for post-launch (contraindications require Phil clinical sign-off).

**Post-launch Mind extensions:**
- Member-recorded voice affirmations (Selfpause/ThinkUp model — research-backed self-voiced playback).
- ElevenLabs narrator voiceover for breathwork sessions.
- Visualisation sessions with VYVE-original scripted audio (replace PM-180 YouTube embed bridge).
- Mind-library deep-link vs own pages decision (PM-165 carryover).

## Added 20 May 2026 — Bottom-nav restructure (Habits / Body / Mind / Connect / Check-in)

**Status:** Design locked, code parked. Dean building Mind + Connect content surfaces over 3-4 days. Restructure ships as one coordinated commit when Dean signals ready. See `brain/changelog.md` PM-172 for the full design log.

### PM-RESTRUCTURE.1 — Schema: mind_activities + connect_activities tables (P0 at restructure-time)

NEW tables, both with `kind` discriminator (Path 2 chosen — unified per category, NOT per-kind tables).

```sql
CREATE TABLE mind_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_email text NOT NULL,
  activity_date date NOT NULL,
  day_of_week text,
  time_of_day text,
  logged_at timestamptz NOT NULL DEFAULT now(),
  kind text NOT NULL,  -- 'breathwork' | 'journal' | 'affirmation' | 'visualisation' | future-extensible
  duration_minutes int,
  content text,
  client_id uuid
);
CREATE INDEX mind_activities_member_date ON mind_activities (member_email, activity_date);

CREATE TABLE connect_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_email text NOT NULL,
  activity_date date NOT NULL,
  day_of_week text,
  time_of_day text,
  logged_at timestamptz NOT NULL DEFAULT now(),
  kind text NOT NULL,  -- 'live' | 'replay' | 'qotd' | future-extensible
  ref_id text,
  content text,
  client_id uuid
);
CREATE INDEX connect_activities_member_date ON connect_activities (member_email, activity_date);
```

RLS: `member_email = (SELECT auth.email())` for all CRUD on both tables (subquery-wrapped per §23 hard rule PM-8).

### PM-RESTRUCTURE.2 — member_home_state extension (P0 at restructure-time)

Add 8 new columns mirroring the existing per-table pattern:
- `mind_total`, `mind_this_week`, `mind_this_month`, `last_mind_at`
- `connect_total`, `connect_this_week`, `connect_this_month`, `last_connect_at`

Update `refresh_member_home_state` SQL function to populate them. Update JS port `home-state-local.js` byte-for-byte. EF `member-dashboard` projects into `data.progress.mind`, `data.progress.connect`, `data.engagement.streak_by_type.mind`, etc.

### PM-RESTRUCTURE.3 — Bus + outbox wiring (P0 at restructure-time)

- New bus events: `mind:logged`, `mind:failed`, `connect:logged`, `connect:failed`.
- FAILURE_TABLE_MAP in vyve-offline.js gains 2 entries: `mind_activities → mind:failed`, `connect_activities → connect:failed`.
- index.html `_rerenderHome` subscribes to all 4 new events.
- session_views / replay_views keep publishing `session:viewed` for backward compat — the Connect aggregator subscribes to BOTH `session:viewed` AND `connect:logged` and reads from BOTH tables.

### PM-RESTRUCTURE.4 — Five Progress Tracks UI (P0 at restructure-time)

Home dashboard tile becomes 5 tracks instead of 4: Habits / Body / Mind / Connect / Check-in.
- Body counter = `workouts_total + cardio_total + movement_total` (movement table shape TBD — see open items).
- Check-in counter = `wellbeing_checkins + monthly_checkins` combined (OR-semantics for weekly tick).
- Habits is days-complete (count distinct activity_date), NOT row count.

### PM-RESTRUCTURE.5 — Weekly Goals re-shape (P0 at restructure-time)

5 goal lines mirroring the 5 tracks 1:1:
- Log habits 3 days (default — see progression engine note)
- Complete 3 Body activities
- Complete 3 Mind activities
- Complete 2 Connect activities
- Complete your check-in (weekly OR monthly)

Home tile changes "X of 4 complete" → "X of 5 complete."

### PM-RESTRUCTURE.6 — Bottom nav + tab routes (P0 at restructure-time)

Bottom nav: Home / Body / Mind / Connect / More. Body absorbs current Workouts + Cardio + Movement routes. Mind is net-new tab. Connect is net-new tab. `nav.js` updated. Per-tab landing pages built by Dean.

### Restructure open items — resolve before ship:

1. **Progression engine for goal targets** ("3 days to begin with, can increase as they progress" — Dean). Restructure-1 ships static targets. Progression engine deferred. Three shapes flagged for future decision: tier-based (30/60/90/120 days), streak-based (+1 on 2 weeks running), persona-modulated.
2. **Lewis copy approval** for track names + Mind/Connect kind labels + microcopy. `copy_status='approved'` gate must clear before ship.
3. **Movement table shape** — verify what `movement.html` writes to (own table / rolls into workouts / rolls into cardio). PM-167/168 changelog mentions convergence; not yet code-verified.
4. **HAVEN × Mind activities** — first pass treats all mind activities as generic logged events with no clinical interpretation. Phil sign-off needed before journal flow does anything therapy-shaped.
5. **Check-in aggregation SQL** — both wellbeing_checkins and monthly_checkins have iso_week/iso_year columns. Aggregate query: `SELECT count(*) FROM (... UNION ...)`. Streak math: a week counts as "checked in" if EITHER table has a row for that iso_week/iso_year.

### Restructure does NOT include (parked for after-restructure window):

- **PF-14b** — bundled-mode + Capgo + iOS 1.2 + Android 1.0.3. Dean-locked: ships AFTER restructure, not before.
- **PM-171.5-followup-workouts** — port cardio's network-throw enqueue to workouts-session.js's 8 direct-fetch sites. Touches surfaces the restructure will reshape; do after.
- **PM-171.4** — remove vyve-home-state.js call sites (silent no-ops post-PM-171.1). Cleanup, do after restructure.

---

## Added 17 May 2026 — P0: activity-cap credit recompute + monthly check-in credit gap [Lewis-gated, own session]

The activity cap was wrongly implemented as `BEFORE INSERT` row-destroying triggers; `enforce_cap_cardio`/`enforce_cap_workouts` were dropped 17 May to stop data loss (see changelog PM-166 + §23.14). The remaining work, scoped as its own Lewis-gated session because it touches certificates and the charity mechanic:

1. **Convert the increment-style counters to the recompute pattern.** `increment_cardio_counter`, `increment_workout_counter`, `increment_habit_counter`, `increment_checkin_counter` and the four `charity_count_*` functions are stateful `AFTER INSERT` increments — drift-prone (no recount on DELETE). Convert each to the stateless recompute used by `update_cert_sessions_count`: read the raw table, apply `LEAST(daily_count, cap)`, write the cert column. Self-healing, correct under deletes.
2. **Monthly check-in credit gap.** `monthly_checkins` has NO counter trigger and NO charity trigger — a monthly check-in currently earns ZERO credit. Dean's rule: the check-in track counts weekly + monthly together (~4-5 weeklies + 1 monthly per month). The recompute for the check-in track must UNION `wellbeing_checkins` and `monthly_checkins`.
3. **Backfill** the `cert_*_count` columns to correct values after conversion.
4. **`activity_dedupe` replay** — months of historically-discarded activity sit in `activity_dedupe`. Decide whether to replay it back into the raw tables (carefully — the counter triggers would fire on replay). Dean's steer: fix-forward, treat replay as separate.

Per-track cap numbers (cardio/workouts/sessions credit first 2/day; habits + check-ins credit first 1/period) are a product decision — confirm with Lewis, don't change unilaterally.

## Added 17 May 2026 — exercise.html audit commits 6 & 7 still outstanding

Commit 5 (workout-history.html, PM-158) shipped. Commits 6 and 7 did NOT — the session was consumed by the movement/cardio logging bugs.
- **Commit 6 — Past Sessions Dexie wiring.** `openSessionsHistory` in workouts-notes-prs.js does 2 raw `fetch()` per tap (`workouts` + `exercise_logs`), no Dexie read, no persist. Wire Dexie-first with REST fallback. (My PRs is already Dexie-wired via `loadExerciseHistory` PF-7 — verify-only.) The tap-target CSS fix for the `#prs-view`/`#sessions-history-view` headers shipped separately within PM-166-era work — confirm it's in.
- **Commit 7 — Browse library prefetch.** workouts-library.js not Dexie-wired; background-prefetch the exercise library so it's warm on tap.

## Added 17 May 2026 — PM-160 (instant on-device achievements: scoped + designed, ready to build)

### Instant on-device achievement evaluation [DESIGNED — READY TO BUILD — next P0 in the achievements line]

**Goal:** an achievement trophy pops at the moment of the write that earns it — one at a time, no Supabase round-trip, no batch dump. Log your 5th workout, the "5 Workouts" trophy pops instantly. Same for every count/streak/time/volume metric.

**The bug being fixed.** Today `VYVEAchievements.evaluate()` is debounced 1500ms (every call resets the timer), so a workout session's 5–8 `exercise_logs` writes coalesce into ONE `log-activity` call whose server-side `evaluateInline` returns every tier crossed during the whole session as one array → 4–5 toasts fire back-to-back. Second batching source: `replayUnseen()` dumps `unseen[]` from the dashboard cache on every page load. Root cause: the debounce is the correct fix for the wrong architecture — server evaluation is expensive so calls were coalesced; coalescing produces the batch.

**The fix — `achievements-local.js`.** New module in the local-first script chain on every trigger page. Catalogue (32 metrics × 327 tiers, ~30KB) reads from Dexie — zero network per evaluation. `evaluateLocal(email, metricSlugs)` runs synchronously after each Dexie write, scoped to the metrics that write touched: counts the member's Dexie rows with §23.31 caps applied, compares to tier thresholds, and for each newly-crossed tier writes the `member_achievements` Dexie row + enqueues to `_sync_queue` + fires the toast immediately (no network await before the toast, §23.27/§23.32). One write → 0 or 1 toast. A genuine two-earn from one write shows toast-1, **600ms gap (Dean's call)**, toast-2. The 1500ms debounce is removed.

**De-risk found this session:** the three Dexie tables needed (`achievement_metrics`, `achievement_tiers`, `member_achievements`) ALREADY exist in db.js SCHEMA_V3 with correct indexes (incl. `[member_email+seen_at]`) and are already in the sync hydrate. No schema change — this is evaluator module + per-page wiring + grid read-swap only.

**Scope:** 24 metrics instant (all `source='inline'` except the 2 charity metrics). 8 stay server-side: the 6 `source='sweep'` metrics (HK-lifetime ×4, member_days, full_five_weeks) + charity_tips/personal_charity_contribution (collective `get_charity_total()` logic — local approx risks divergence; marginal instant-win). Server `evaluateInline` + `achievements-sweep` stay as idempotency reconciler — `member_achievements` unique `(member_email,metric_slug,tier_index)` makes local+server double-eval a harmless no-op.

**Also in scope:** `replayUnseen` becomes a graceful drain (3 shown @600ms, then one "+N more" summary toast linking to the grid) not a dump; engagement.html `#achievements` grid repointed to read from Dexie (instant paint, no `member-achievements` EF dependency, no cold-open skeleton).

**Build sequence:** (1) `achievements-local.js` — catalogue read + `evaluateLocal` + §23.31-capped counters + streak logic; (2) `achievements.js` — remove debounce, 600ms sequencing, "+N more" replay cap; (3) per-page wiring (one scoped call per trigger page: habits/workouts/cardio/movement/sessions/wellbeing-checkin/monthly-checkin/log-food/nutrition/settings/welcome); (4) engagement.html grid → Dexie read; (5) device verify — single instant toast on a real workout, 600ms sequence on a two-tier crossing; (6) sw.js cache bump + atomic commit. Estimate: one focused session for 1–4.

**Notes:** `volume_lifted_total` evaluator needs sanity caps (`reps_completed>100` OR `weight_kg>500` excluded) as a guard against future bad data — the brain's flagged "two corrupt rows on Dean's account (87616 reps)" were verified GONE from live Supabase this session, no pre-cleanup needed. The toast wrapper copy ("Achievement earned" eyebrow) is the only new member-facing string — Lewis sign-off item; tier titles/bodies are all already approved, toast surfaces them verbatim. Design doc + interactive behaviour mockup produced this session and approved by Dean.

### Brain drift noted PM-160 (fix in next master/changelog touch)

- master.md §8 says the Phase 3 Achievements UI is "design-locked but not yet built" — it IS built and live (engagement.html `#achievements` tab, 29 April). §11A is correct; §8 line is stale.
- `VYVESync.criticalHydrate` is referenced throughout the brain and CALLED by engagement.html, but does NOT exist in live sync.js (which exposes `hydrate`, `hydrateTable`, `runDeltaPull`, `isEnabled`, `status`). engagement.html's background re-hydrate is a silent no-op behind a `typeof` guard — real regression, separate fix, tracked. Repoint to `hydrateTable`/`hydrate`.
- §11A "two corrupt `exercise_logs` rows on Dean's account" — verified gone from live Supabase, no longer a landmine.

---

## Added 16 May 2026 — PM-155 BUG (live breakage, fix first next session)

### Recent Movement log list shows empty — source-vocabulary mismatch [BUG — NOT FIXED — fix before commits 5–7]
movement.html's Recent Movement list (PM-155) filters on `source==='movement_walk'/'movement'`, but `logMovement` writes `source:'manual'` (correct — the 2/day `cap_cardio`/`cap_workouts` triggers only cap `source='manual'` rows; retagging would break the cap). Reader was built on the bus-event vocabulary, not the stored column. Fix: discriminate on `cardio_type='walking'` (walks) + `plan_name='Movement'` (non-walk) instead — already in the data, no schema change, cap untouched. Apply to `renderMovementLog` in movement.html AND movement-history.html's `collectLogs`. Decision needed from Dean: walks logged via cardio.html are also `cardio_type='walking'` — allow them in Recent Movement or exclude. Full root-cause in changelog PM-155 FOLLOW-UP. cardio.html / cardio-history.html unaffected (they show all cardio).

## Added 16 May 2026 — exercise.html audit: two product directions captured (Dean, end of PM-157 session)

### Bundle exercise thumbnails + workout plan data into the Capacitor build [PENDING — own scoped vyve-capacitor session]
Dean's direction: when the app is wrapped and a customer downloads it from the App Store / Play Store, the build should already contain the exercise thumbnail images AND the workout plan data — on-device from first launch, before the member has opened the app online. This is distinct from sw.js precaching: it means committing the thumbnails into the `vyve-capacitor` project as bundled assets so they ship inside the binary. Videos are explicitly NOT bundled — they remain network-only and only play with an internet connection; the thumbnail is the always-present fallback. Workout pages reference the local bundled asset path with the network URL as fallback. Scoped as its own Capacitor session. When picked up: first size up total thumbnail weight — if it's hundreds of exercise images it adds real MB to the store download and may need compression before bundling. Pairs conceptually with vyve-capacitor finally going under git (existing backlog risk).

### Exercise plan switching — local-first instant switch [PENDING — AUDIT-FIRST, then design]
Dean wants: in the exercise library, when a member switches plan (e.g. Push/Pull/Legs → Upper/Lower), it changes instantly on the phone via Dexie, uploads to Supabase after, and the member can start that workout straight away. Same local-first shape as the PM-151 habits saves (Dexie + bus + UI first, network after).

**The open question that gates the design — must be answered by audit before any build:** does `workout_plan_cache` hold ALL 5 plan programmes for a member, or only the one they're currently on? Each plan's 8-week programme is generated JSONB. If all 5 are cached locally, the instant-switch is genuinely the habits pattern: flip the active-plan pointer in Dexie, publish a bus event, workouts.html re-renders from the now-current cached programme, "Start workout" works immediately, Supabase PATCH fires after. If only the current programme is cached, switching to a never-generated plan requires an Edge Function + AI build before there is anything to start — cannot be instant; best case is instant UI feedback ("preparing your programme" state) with the real programme swapping in when the background build completes. The brain's note (all 5 plan types assigned to every member, AI recommends weekly schedule not plan selection) hints programmes may NOT all be pre-built — do not assume; confirm from `workout_plan_cache` rows + the plan-selection code path. Audit first, then design; the "preparing" path if needed is a talk-first decision.

## Added 16 May 2026 PM-154/155/156/157 — exercise.html audit follow-ons

### PM-154/155/156/157 — exercise.html paint audit (Body nav + Movement/Cardio logging) [SHIPPED 2026-05-16 — vyve-site `aa525993` + `86cf2c69` + `54096a7a` + `9c0fc648` — device-verification pending]
Body nav rename + Nutrition fold-in, movement.html Recent Movement log list, cardio.html restyled onto the shared mvlog component, and movement-history.html + cardio-history.html shipped. Full detail in changelog PM-154/155/156/157 + master §19. The exercise.html audit is NOT closed — see the next item.

### exercise.html audit — commits 5–7 outstanding [PENDING — next session, ~1 session]
Three pieces of the exercise.html audit did not ship and carry to a follow-up:
- **Commit 5 — workout-history.html + workouts.html view-all.** New full-history page for gym workouts, same day-grouped Dexie-first pattern as movement-history.html / cardio-history.html (derive from one of those as the template). Wherever workouts.html surfaces recent/past sessions, add a "View all" → workout-history.html. Must precache in sw.js `urlsToCache`.
- **Commit 6 — My PRs Dexie wiring.** workouts-notes-prs.js is NOT Dexie-wired: zero `VYVELocalDB` refs, 6 raw `fetch()` calls against `exercise_logs` / `exercise_notes`, fetch-on-tap. §23.7.1 + §23.12 violation. Wire it to a Dexie-first read with REST fallback + background prefetch so the My PRs sub-tab is instant.
- **Commit 7 — Browse library prefetch.** workouts-library.js is NOT Dexie-wired (zero `VYVELocalDB`/`hydrate`/`prefetch`; 4 raw `fetch()`; has its own localStorage `cache` layer). Add background prefetch so the exercise library is warm by the time the member taps in (often minutes later). Dean's words: loaded in the background, already there on click.
Note: workouts-programme.js (Past Sessions) is already Dexie-wired (12 `VYVELocalDB` refs, `criticalHydrate`, `prefetch`) — verify-only, no work expected.

### Movement as its own activity track [PENDING — own scoped session, needs Dean + Lewis decision]
movement.html currently routes a logged walk to the `cardio` table and stretch/yoga/pilates/mobility/other to the `workouts` table (PM-47/PM-48). There is no `movement` table, no movement activity cap, no movement certificate track. Dean's direction (16 May): the bigger move is to take certificates OFF the per-activity tracks (Habits/Workouts/Cardio) and onto **pillar-level tracks — Mind / Body / Connect** (or Movement). That restructure is the proper home for "walking counts as Movement, not Cardio". Until it happens, walks stay in `cardio` and credit the cardio track — leave as-is. The restructure touches: table structure, `member-dashboard` EF, activity-score component weighting, the leaderboard metric, the Dexie stores, the bus event taxonomy, and the certificate tracks — all member-facing, Lewis-gated. Scope as its own session; do NOT half-build it inside an audit pass.

### Walk-note persistence in the movement quick-logger [PENDING — small, ~quarter session]
The walk branch of movement.html `logMovement()` writes a `cardio` payload (`cardio_type:'walking'`, `duration_minutes`, `distance_km`, `client_id`) that does NOT carry the member's note. The non-walk branch persists `workout_name: sessionName`. Result: walk rows in the Recent Movement list + movement-history.html render the type-name ("Walk") as title, never the member's label. Fix: add the note to the walk's `cardio` payload (confirm the `cardio` table's free-text column name first — cardio.html's own logger likely uses one). The mvlog render already shows `r.workout_name||r.notes||'Walk'` for walk rows, so walk titles light up automatically once the column is populated. Not trial-blocking.

## Added 16 May 2026 PM-153 — habits.html audit follow-ons

### PM-151/152/153 — habits.html paint audit [SHIPPED 2026-05-16 — vyve-site `03d2b247` + `4baa445c` + `deec34f8` — device-verified]
Settings saves local-first (§23.7.6 critical-path order), habits.html card redesign (difficulty pill removed, description/prompt dropdown), and the PM-151 thin-row regression fixed. Full detail in changelog PM-151/152/153 + master §19 + §23.7.9. habits.html audit closed. Next audit page: exercise.html.

### NEW FEATURE — locked / mandatory habits model [PENDING — post-trial, ~1 session + mockup, Lewis copy gate on the label]
Dean's product decision (16 May 2026): habits VYVE assigns to a member — monthly theme habits, the autotick HealthKit set — should be MANDATORY. The member cannot remove them. They CAN add their own habits on top and remove the ones they added themselves. So habits split into two classes: VYVE-given (locked) and self-added (removable).

Current state is NOT this model — it is an accident: the four `autotick-7b` library habits are un-removable only because they fall outside the settings picker's `created_by IS NULL OR created_by = <email>` filter (a `created_by` mistag — `autotick-7b` is a build label sitting in the ownership column). Monthly theme habits, assigned with `created_by = null`, currently ARE removable — violating the intended model. So today the app enforces "locked" on 4 habits by bug and "removable" on the theme habits by default. Decision at PM-153: leave as-is, build the real model later.

Clean implementation when picked up: a `removable` (or `locked`) boolean on `member_habits`, set false where `assigned_by IN ('admin','onboarding','autotick','theme_update')` and true where `assigned_by = 'self'`. Settings picker renders locked habits as un-checkboxable with a small "Set by VYVE" label (label copy → Lewis). Separately, the `autotick-7b` `created_by` mistag should be corrected to `null` as part of this work (4 library rows, assigned to 3 members each) so the column means one thing — ownership — again. Not trial-blocking.

### `member_habits` re-add creates a duplicate row [PENDING — rides with locked-habits feature]
`member_habits` has no unique constraint on `(member_email, habit_id)`. The settings add path POSTs fresh rows with `Prefer: resolution=ignore-duplicates`, which only dedupes on the primary key — and the PM-153 client-side `id` is a fresh UUID each time. So removing a habit (soft-delete `active=false`) then re-adding it creates a SECOND row rather than reviving the first. Functionally habits.html and the picker both filter on `active` so it renders fine, but the table accumulates dead rows and loses the original `assigned_at`/`assigned_by` provenance. Fix options: (a) add a unique constraint on `(member_email, habit_id)` and switch the add path to an upsert that revives the existing row (`active=true`), or (b) hard-DELETE on removal. Recommendation: (a) revive-on-readd — preserves history. Pairs naturally with the locked-habits work since both touch `member_habits` write paths. Not trial-blocking.

## Added 16 May 2026 PM-150 — session_views fix follow-ons + two new feature backlog items

### PM-150 — session_views storage/cap decoupled + 60s dwell threshold [SHIPPED 2026-05-16 — migration applied + tracking.js v9 `9a95ab5c` — device-verified]
Storage cap removed (rerouting triggers dropped), 60s dwell threshold shipped in tracking.js v9, certificate 2/day cap preserved in `update_cert_sessions_count` only. Full detail in changelog PM-150 + master §19 PM-150 + §23.34. Closed.

### Cross-visit dwell accumulation [PENDING — post-launch, low priority]
tracking.js v9's dwell accumulator resets on page unload — `visitStartTime` is in-memory; only `baseMinutes` (server `minutes_watched`) survives. Two sub-60s visits to the same session do not sum, so an interrupted viewer can watch 40s + 40s and earn nothing. Correct as anti-farm; wrong if we want to credit genuinely-interrupted viewing. Fix options if pursued: (a) create the row early marked unqualified and accumulate server-side, or (b) track cumulative minutes per (category, date) in Dexie across page loads. Defer until post-launch + evidence it matters.

### tracking.js outbox wiring [PENDING — §23.10 hardening candidate, post-launch]
tracking.js is a critical activity-write path with NO outbox — direct fetch, `session:viewed:failed` to a bus nobody surfaces, no retry beyond the in-visit heartbeat. A member who loses connection right at the 60s mark and leaves can lose a legit session view. vyve-offline.js has the outbox infrastructure; tracking.js was never wired to it (file comment: "no outbox — same dichotomy as PM-58 cardio"). Wire tracking.js writes through the offline outbox. Not launch-blocking.

### NEW FEATURE — `page_visits` owned visit/dwell analytics [PENDING — post-launch, ~2 sessions]
Dean wants an owned, queryable record of page visits + time-on-page, pushed Dexie→Supabase, SEPARATE from PostHog (PostHog stays as the deep web-analytics/replay layer — explicitly kept). New `page_visits` table (`member_email`, `page`, `entered_at`, `duration_seconds`, `activity_date` — one row per visit, Dean's call). A small shared tracker script on every portal page captures entry on load + duration on `pagehide`/`visibilitychange` (same shape tracking.js already uses; `keepalive` on the final beacon for the iOS WKWebView caveat). Local-first: write to a Dexie table first, background-drain to Supabase via the existing `_sync_queue` pattern — works offline, reuses PF-40.4 write API if/when it lands. Value: owned analytics, re-engagement triggers ("hasn't opened in 5 days"), employer insight, a future member-facing "your week" view (any displayed surface → Lewis copy gate; the pipeline itself does not need him). Not launch-blocking.

### NEW FEATURE — `session_schedule` table + live-session minute-windowing [PENDING — post-launch, ~1.5–2 sessions]
Dean wants live-session minutes to only count *during the actual broadcast window* (e.g. a 09:00–09:30 live session: a member on the page 09:15–11:00 is credited 15 min, not 105). Two pieces: (1) FOUNDATION — a `session_schedule` table (`category`, `day_of_week` or date, `start_time`, `end_time`) — the schedule currently exists only as text on sessions.html. This table also unblocks a real "live now" home slot and a real "Coming Up This Week" block (the latter was removed 06 May for being a hardcoded placeholder). (2) tracking.js clamps live-session minutes to `overlap(visit_window, broadcast_window)`; replays unaffected (on-demand, no window). Caveat: tracking.js measures page dwell, not video play-state — "present during the window" is a strong proxy but not true watch-tracking; true play-state needs the YouTube iframe API (V2, do not pre-launch). Pairs naturally with future minutes-based session goals ("watch 60 min of live sessions" = SUM(minutes_watched) over the week — data already captured). Not launch-blocking.

## Added 16 May 2026 PM-148 — completeWorkout optimistic-first; updated PM-145 + multi-fire findings

### PM-148 — completeWorkout 'Saving...' hang [SHIPPED 2026-05-16 b1470698 + PM-148b hotfix 207aa1b0 — device confirm pending]
`completeWorkout` rewritten optimistic-first in vyve-site `b1470698` (+ `b5ee7854` build banner Update 13). Root cause: `await VYVEData.writeQueued(...)` — `writeQueued` awaits the network POST internally (not a fire-and-forget queue; see §23.32). Three serial awaited network calls on the button path → "Saving..." frozen 75s+ on a slow backend; the `optimisticPatch` + `workout:logged` bus publish sat downstream so the home score never updated (stale 74 vs engagement's 87). Fix mirrors cardio `logCardio`: Dexie write + home patch + bus publish + completion screen all before the network, POST + plan_cache PATCH un-awaited in background closures. **Device confirm:** Complete Workout → instant completion screen, no hang; home engagement score moves immediately. NOTE: PM-148 initially broke workouts.html — it added a `function ordinalSuffix()` that collided with the existing one in workouts-config.js (shared global scope) → SyntaxError → Exercise page stuck on skeleton. Hotfixed in `207aa1b0` (duplicate deleted). The optimistic-first rewrite itself was unaffected. Device confirm should now also include: Exercise page loads normally.

### Per-set save path (`tickSet` / exercise_logs) — same `await writeQueued` shape [PENDING — latent]
workouts-session.js ~L421: the per-set save does `await VYVEData.writeQueued(...)` for the `exercise_logs` POST — the identical network-blocking pattern PM-148 fixed in `completeWorkout`. Not reported as slow by Dean, left untouched this session, but it is the same latent bug and will hang the set-tick under backend load. Apply the same optimistic-first treatment when next touching the set path.

### PM-145 — `platform-alert` storm + member-dashboard EF 504s [P0 — ESCALATED PM-149: caused a site-wide login outage]

**ESCALATED 16 May 2026 (PM-149).** This is no longer edge-case/back-burner. On 16 May the `platform-alert` v8 storm drained the nano-tier 60-connection Postgres pool and caused a **site-wide login outage** (`/auth/v1/token` 522, GoTrue `dial error` to Postgres). Mitigated by deploying `platform-alert` **v9 — a no-op** (instant 200, no DB/Brevo/push) plus a project restart. Consequence: **platform error-monitoring is currently OFF** (v9 does nothing). This block is now P0. Required v10 work, in order: (1) fix the dedup key — dedup on a STABLE composite (e.g. `type` + normalised message + member), not raw `type`; (2) add a hard rate limit / circuit breaker so a client error loop cannot produce 40+ concurrent invocations; (3) drop the dead `push_subscriptions` write entirely (pre-`send-push`-v12 `'raw'` VAPID bug, table is dead); (4) only then restore real alerting. Until v10 ships, VYVE has no platform error alerts. See changelog PM-149 and master.md §23.33. Related structural fix: backlog P3-1 (nano `max_connections` 60→200+ / compute tier) — the 60-slot ceiling is what let one bad function take down the whole project; Dean's call.
Investigated PM-148 session. NOT primarily the achievements payload. Real chain: workout/exercise write errors → `auth.js` global client error catcher POSTs `platform-alert` on every JS error → `platform-alert` v8 has three bugs: (1) dedups on raw `type` which varies per-error so nothing ever dedupes; (2) no rate limit; (3) pushes to the dead `push_subscriptions` table with the pre-`send-push`-v12 `'raw'` VAPID import bug. Result: alert storm (20+ calls/90s, 27-64s each) drains the shared EF compute pool → member-dashboard (fattest function) 504s; even 401s take 100s queued. Also: two achievements evaluators query dead columns — `workouts_shared` filters `shared_workouts.member_email` (real column `shared_by`); a `monthly_checkins.logged_at` query (no such column). §11A is stale — describes v55/23-serial-evaluators; live is v69, v60 already parallelised via `Promise.all`. Dean's call: back burner — edge-case/reinstall path only, normal users are Dexie-first and unaffected. When picked up: fix `platform-alert` (dedup key, rate-limit, drop the dead-table push) FIRST — it's the root of the compute drain — then trim member-dashboard (pull `getMemberAchievementsPayload` off the critical path) and fix the two dead-column evaluators.

### Workout-logging multi-fire [RESOLVED — was not a bug]
The "5-6 log entries from one tap" was NOT a misfire. Dean clarified PM-148: the workout sat on "Complete workout" for a long time (the §23.32 hang), looked dead, so he tapped repeatedly — each tap eventually POSTed. Root cause is the completion hang, fixed by PM-148. No separate multi-fire bug. `completeWorkout` also now has a `btn.disabled` re-tap guard. (PM-148 caps and the §23.31 Dexie cap mean even a stray double-tap can't inflate the score.)

### Check-in + sessions missing from "This Week's Goals" [PENDING — investigate]
Dean (PM-148): a completed weekly check-in and 2 watched sessions show correctly on the engagement page but do NOT appear in the "This Week's Goals" strip on the home page. Separate from PM-148 (which fixes the workout write path only). Likely the check-in and session write paths don't fire the optimistic home patch / `*:logged` bus publish the way the workout path now does — or the goals strip reads a field the optimistic patch doesn't update. Investigate the check-in (wellbeing-checkin) and session-view write paths against the cardio/PM-148 reference pattern.

## Added 16 May 2026 PM-147 — Open items from the PM-142–147 engagement/cardio session

### PM-145 — member-dashboard EF (v69) 504-ing [PENDING — own session]
Edge-function logs show `member-dashboard` GETs hitting the 150s platform ceiling and returning 504; earlier 200s took 18-93s. `member-achievements` separately logged at 100s+. member-dashboard calls `getMemberAchievementsPayload` inline, which fans out over 23 evaluators — the likely drag. This is the edge-case/reinstall path (empty Dexie needs the server); the normal-user path is now Dexie-first and unaffected. Needs a dedicated EF diagnosis session — probable fix is moving the achievements payload off the critical path (non-blocking, or its own endpoint).

### Workout-logging multi-fire [PENDING — investigate]
Dean reported one workout-log action producing 5-6 inserts. PM-147 caps the COUNT (2/day) so the phantom rows no longer inflate the engagement score, but the rows still exist in Dexie (and server-side `activity_dedupe`). Root cause unfixed — likely a logging button not disabling on first tap, or a retry loop. Separate from PM-147.

### PM-135 — running plan card on cardio.html [CLOSED — superseded by PM-142]
PM-135 (`e88c57f1`) shipped a botched commit (duplicate `logCardio` overwrote `getActiveRunningPlan`; `renderRunningPlan` called undefined functions). Fully recovered by PM-142 (`f5675542`): functions restored, `renderRunningPlan` paints synchronously first, `_kv` tier working. No further action.

## Added 16 May 2026 PM-133 — Open items from the Updates 1–6 local-first session

### PM-134 — Movement device confirmation + probe removal [PENDING]
Movement Update 6 (db4156835d713c8d677dc4957f8e6de613ed81bc) shipped but not device-confirmed. Dean to cold-open movement: probe strip should read `dexie rows:0/1` not `dexie-off`, page should paint from Dexie on second cold open. Once confirmed, ship a cleanup commit stripping the `__mvProbe` instrumentation (probe div, init, fetchPlan/readCache/reveal tags) from movement.html.

### PM-135 — Running plan card on cardio.html not loading [PENDING]
`member_running_plans` is a pure network fetch with no local tier. Cardio's running-plan hero card stays empty. Needs a Dexie tier or a localStorage cache, same pattern as the other cardio surfaces.

### PM-136 — Delete-a-cardio-session feature [DESIGNED, NOT BUILT]
Approved design: swipe-to-delete on the Recent sessions row + undo toast (~5s), optimistic delete (remove from Dexie + repaint immediately, background DELETE to Supabase by `client_id`). On a failed server DELETE after the undo window: row reappears (revert-on-failure). Requires threading `client_id`/`id` through renderHistory (currently stripped at the fetchHistory map step). Self-contained swipe handler in cardio.html — workouts.html has no reusable swipe pattern to borrow.

### PM-137 — Identify the server.url dev-loop caching layer [PENDING]
Updates take 3-4 cold reopens to land; build banner shows stale "Update N" until a page navigation. Not a service worker (banner reports `no-sw`). Candidate: WKWebView HTTP cache, or Capacitor bundle-mode serving baked-in www/. capacitor.config.json read was started, not finished. Resolving this de-risks every future dev-loop test. See §23.29.

### PM-138 — Catalogue bundling + OTA architecture [DEFERRED — needs its own scoped session]
Dean's proposal, confirmed sound and consistent with the existing PF-40.6/40.7/40.8 asset-tiering plan: bundle catalogue data (exercise plan TEMPLATES, exercise thumbnails) into the app binary, ship catalogue updates via OTA (Capawesome) rather than Supabase. Member data stays on the Dexie→Supabase write loop; bus handles cross-page sync. Refinement: which plan a member is on + week/session position is member-data (Dexie+Supabase pointer), not bundled. 100MB app size acceptable. To be planned properly in a dedicated session, not as a debugging tail-end.

## Added 15 May 2026 PM-117 — Dexie audit findings (46 total; prioritised fix list)

See `audit/dexie-audit-2026-05-15.md` for the full audit narrative and `audit/dexie-audit-2026-05-15.json` for structured per-file findings. Items below are the actionable fix list, ordered by smallest scope first within each priority.

### PM-118 — sw.js urlsToCache 10-script add + workouts criticalHydrate wire-in [SHIPPED 2026-05-15]

**Status:** SHIPPED in vyve-site commit `e8df0dbd6a0336fb2d18f3b1232cc1301f59f0de` — atomic 2-file commit on main. See changelog PM-118 entry.

- `sw.js`: 10 critical-path scripts added to urlsToCache (`/vapid.js`, `/session-live.js`, `/session-rp.js`, `/workouts-config.js`, `/workouts-programme.js`, `/workouts-session.js`, `/workouts-exercise-menu.js`, `/workouts-builder.js`, `/workouts-notes-prs.js`, `/workouts-library.js`); CACHE_NAME bumped to `vyve-cache-v2026-05-15-pm118-precache-a`. Closes PM-117 audit P0.3 (sw_precache_gap, 10 findings).
- `workouts-programme.js`: 4 `await VYVESync.hydrate()` sites (L82, L263, L368, L409) replaced with `await VYVESync.criticalHydrate('workouts')`. Closes PM-117 audit P0.2 and the PM-112 deferred follow-up.

**Next from PM-117 P0 priority list:** item #3 — engagement.html criticalHydrate + Dexie wire (~2 hr). Engagement score ring currently entirely server-bound; zero VYVELocalDB refs in engagement.html.


### PM-119 — engagement.html Dexie-first wire [SHIPPED 2026-05-15]

**Status:** SHIPPED in vyve-site commit `17318f12d0c737dc8df8095beb16a4737ea867de` — atomic 3-file commit (engagement.html, firstPaintHydrate.js, sw.js) on main. See changelog PM-119 entry.

**Approach taken:** option (a) — separate `engagement` page key (9 tables) including a new `WELLBEING_CHECKINS_30D` entry that didn't previously exist. Chose option (a) over the audit's recommended (b) (reuse `home` page key) because (a) is more explicit and decouples engagement.html's hydrate set from home's, and importantly the new WELLBEING_CHECKINS_30D entry materially closes the wellbeing-component gap in the engagement score ring on first paint.

**Wire-in shape:** 4 new `<script src>` tags (db.js, sync.js, firstPaintHydrate.js, home-state-local.js — identical chain to index.html PF-11b). New `buildEngagementFromDexie(email)` helper in engagement.html calls `VYVEHomeStateLocal.computeHomeStateFromDexie` and reshapes its output into the render-ready `{counts, streaks, checkinStreak, score, activityLog}` shape. Dexie-first paint block in `loadPage()` runs between the localStorage cache early-paint and the EF fetch: `criticalHydrate('engagement') → buildEngagementFromDexie → render`. EF still fires and remains authoritative.

**Closes PM-117 audit findings:** P0 hydrate_missing_page_key (engagement.html), P0 no_dexie_wiring (engagement.html). 13 of 23 P0s closed by PM-118 + PM-119.

**Next from PM-117 P0 priority list:** item #4 — workouts-session.js 3 QUEUED_NO_OPTIMISTIC writes (exercise_logs POST, workouts POST, workout_plan_cache PATCH). Root cause of PF-31 page-re-entry green-check disappear. ~2 hr.

### home page key widening — add WELLBEING_CHECKINS_30D + WEEKLY_GOALS [P1, ~10 min]

**Surfaced by PM-119.** The new `engagement` page key (PM-119) is a superset of the existing `home` page key — it adds `WELLBEING_CHECKINS_30D` and `WEEKLY_GOALS`. The `home` key is missing both. Impact: on index.html first paint, `engagement_wellbeing` component (12.5 pts of 100) reads 0 until lazy mass-hydrate populates wellbeing_checkins. Same gap exists for weekly_goals (used for goal-target progress widgets).

**Fix:** in firstPaintHydrate.js return block, change `home` array from 7 tables to 9 by adding `WELLBEING_CHECKINS_30D` and `WEEKLY_GOALS`. Both entries already declared. Single-line array change. SW cache key bump.

**Not P0 because:** (a) symptom is silent — wellbeing component degrades to 0, not visible undefined, (b) lazy mass-hydrate populates within seconds, (c) the same gap has been live since PM-112 so any user with non-empty Dexie has the data already from a prior session.


### PM-120 — workouts-session.js Dexie-first writes + criticalHydrate wire [SHIPPED 2026-05-15]

**Status:** SHIPPED in vyve-site commit `3ce9c72f255bcb4aab666971ec5acbb16c96dbe8` — atomic 2-file commit (workouts-session.js + sw.js) on main. See changelog PM-120 entry.

**Approach taken:** optimistic Dexie upsert fires *after* writeQueued returns (not strictly *before* as the backlog candidate suggested). Functionally equivalent for the no-read-race goal: nothing reads Dexie between writeQueued return and the next bus publish or render in any of the three sites, so the Dexie write being slightly post-writeQueued vs slightly pre-writeQueued doesn't change correctness. Same shape as cardio.html PF-9 (which also does optimistic post-network-call upsert). Backlog text's "synchronously before" prescription was advisory not load-bearing.

**Changes:**

1. L548 `await VYVESync.hydrate()` → `await VYVESync.criticalHydrate('workouts')`. Bonus fix outside the original P0 priority — this was the sibling sync.hydrate call in workouts-session.js that PM-118 missed (PM-118 only fixed workouts-programme.js's four sites). Same module, separate file.

2. L422 `exercise_logs` POST — added `VYVELocalDB.exercise_logs.upsert(full_row)` fire-and-forget after the writeQueued returns, before `_publishSetLogged()` so bus subscribers see the row. Catch+warn non-fatal.

3. L605 `workouts` POST — same shape as site 1, plus skipped on `_workoutWriteResult.dead === true` (4xx terminal) so the PM-63 Layer-4 workout:failed eager dispatch + VYVEHomeState.revertPatch doesn't leave an orphan Dexie row.

4. L707 `workout_plan_cache` PATCH — **merged upsert** via `VYVELocalDB.raw()` transaction (read-modify-write). Required because workout_plan_cache is keyed by member_email (singleton row with programme JSONB, plan_duration_weeks, etc) — a plain put with only `{current_session, current_week}` would drop everything else. Same hazard codified for member_habits + members partial-upsert merge in §23.7.5.

**Closes PM-117 audit findings:** 3× P1 write_bypass on workouts-session.js per audit JSON severity; per audit narrative + Dean's priority list = P0 #4. Treating as P0 closure (15 of 23 P0s by narrative priority; 13 by strict JSON severity).

**Next from PM-117 priority list:** item #5 — log-food.html 4 writes bypass Dexie via in-memory `diaryLogs[]` JS array + `saveDiaryCache()` localStorage. Read-after-write hazard: log food → close app → reopen → Dexie has no record until queue drains. ~2 hr.

### Severity drift between audit JSON and audit narrative [INFO, ~5 min]

**Surfaced by PM-120.** The PM-117 audit JSON (`audit/dexie-audit-2026-05-15.json`) tagged the workouts-session.js write_bypass findings as P1. The audit narrative (`audit/dexie-audit-2026-05-15.md`) prioritised them as P0 #4. Dean's session brief sourced from the narrative. PM-120 treated as P0 per the narrative source-of-truth principle.

**Implication for §23:** the audit JSON is structured per-file findings with mechanical severities (writeQueued sites = P1 by default); the audit narrative applies launch-impact judgement and can promote severities upward when ship-readiness is at stake. **Codification suggestion:** add a §23 line that when audit JSON severity ≠ audit narrative priority, the narrative wins for scheduling decisions but the JSON severity stays for audit-progress accounting. This is the implicit rule already being followed; making it explicit prevents future confusion.

### PM-122 — criticalHydrate migration long tail (6 pages, 7 hydrate sites) [SHIPPED 2026-05-15]

**Status:** SHIPPED in vyve-site commit `6911b55aea5af82b271f043493b5168e45e1429e` — atomic 10-file commit on main. See changelog PM-122 entry. **Important:** preceded by a corrupted single-file commit `21b603be` that placed `<PLACEHOLDER_EXERCISE>` content into exercise.html for ~90 seconds before being corrected by `6911b55a`. New §23.26 PLACEHOLDER GUARD rule codifies the ship-discipline failure.

**Closes PM-117 P0-1 (2.11g) carry — 6 pages still calling 81s mass-hydrate:** exercise / settings / certificates / monthly-checkin / movement / wellbeing-checkin all migrated to `criticalHydrate(pageKey)`. New `settings` page key added to firstPaintHydrate.js. habits.html unbinds first-paint from member-dashboard EF (Fix 3: deferred autotick application). sync.js authedFetch gets 8s AbortController backstop. SW cache key bumped to `pm122-fast-paint-a`.

**UNVERIFIED ON DEVICE.** Dean's airplane-mode cold-boot iPhone walk pending — expected paint times 5-15s on the 6 migrated pages (was 30-81s). habits.html should paint cards immediately, autotick badges land 10-30s later.

**Layer 5 long tail closed.** Next §23.5.1 layer work is backend EF latency — separate multi-session campaign.


### PM-123 — Brain commit ship-discipline guard rule [SHIPPED 2026-05-15]

**Status:** SHIPPED in VYVEBrain commit (this commit). New §23.26 PLACEHOLDER GUARD rule added to master.md. Closes the ship-discipline failure that produced corrupted commit `21b603be`. The rule mandates: (1) every tool-call field carrying real content MUST be populated from a runtime-resolved variable before the tool call is built, (2) multi-execute calls are not draftable in-place, (3) pre-flight assertion `assert u["content"] is patched[u["path"]]` before invoking any commit tool, (4) single-file commits MUST verify by content via Contents API post-commit, (5) workbench `run_composio_tool` path is preferred for >50KB files AND >2-entry upserts arrays.


### PM-128 candidate — Workout-in-progress session persistence (Strong-style resume) [P0 PRE-LAUNCH, ~2-3 hr]

**Status:** Surfaced PM-122 session (15 May 2026) by Dean. Real product gap, not a perf issue. Members open a workout session, log 1-3 sets, close the app, reopen later (sometimes days later) — current behaviour is the in-progress session UI state is lost. Strong / Hevy / every serious fitness app persists this state across app closes. VYVE doesn't yet. Pre-launch fix, not v2.

**What "this state" means:**
- Which exercises in the session have been completed
- For each exercise: which sets have been logged, with their reps + weight
- Position in the session (which exercise + which set the user was on at close)
- Notes if any were entered
- NOT the rest timer — two days later that's stale and just resets

**Architectural decision pending — Path A vs Path B:**

Path A — Reconstruct from `exercise_logs` on session resume. Query exercise_logs filtered to current_session (from workout_plan_cache) + a sensible date window, render the page with "sets 1-3 done, sets 4-5 pending." No schema change. exercise_logs is already the source of truth for completed sets. Cons: requires "is this session still open" logic that handles the multi-day case; doesn't capture unsaved partial state (e.g. user typed `8 reps × 60kg` but hasn't tapped Save).

Path B — Dedicated `workout_in_progress` Dexie table (local-only, no Supabase mirror). Keyed by member_email, holds JSON blob of entire in-progress session UI state. Write-on-mutation (every keystroke or set-tap, debounced). Cleared when session marked complete. Pros: captures every partial UI state including unsaved. Cons: schema addition + cleanup discipline. Local-only — no sync queue, no Supabase write, purely a UI helper. Completed sets still go to exercise_logs as canonical.

**Claude's lean: Path B.** Reasoning: the "started Monday, opened it Wednesday" case is naturally represented by "is there a row in workout_in_progress for this member?" — much cleaner than the date-heuristic Path A would need. The cost is one local-only Dexie table that never syncs. Confirm with Dean before building.

**Resume UX decision pending:** When user opens workouts.html mid-session, land directly in the session view, OR land on programme overview with a "Resume session" banner / button? Strong does the banner approach. Banner gives user agency ("I want to do a different workout today"). Direct-jump is more magical. Banner is probably the right default. Confirm with Dean.

**Files in scope (estimated):**
- New Dexie table declaration in db.js (workout_in_progress; schema = {member_email PK, session_state JSON, started_at, last_updated_at})
- workouts-session.js — write-on-mutation hooks at every state-change site (set-tap, rep input, weight input, exercise navigation). Debounced 500ms.
- workouts-programme.js — read on mount, render "Resume session" banner if a row exists for the current member.
- Session-complete path — clear the workout_in_progress row when user marks session done (probably L605-ish workouts POST handler in workouts-session.js).
- No backend changes. No EF changes. No new tables in Supabase.

**Pre-flight hazard to think about during build:**
- Don't conflict with the existing PM-120 workout_plan_cache merge logic — workout_in_progress is a different table tracking different state (singleton per-member open session vs the programme-level current_session/current_week markers).
- §23.7.6 (UI state mutation must be synchronous on the active surface) applies — Dexie write goes through the same write-optimistic pattern as PM-98 autotick: synchronous UI update + Dexie write fire-and-forget.
- §23.10 (offline-equivalent operation is the contract) applies — this entire feature MUST work offline. Member at the gym with no signal, mid-set, force-quits, reopens — must resume.

**Sequencing note:** Not blocking PM-122 device walk. Not blocking the scope audit. Sized for one focused session post-audit.



### PM-121 candidate — log-food.html write-path Dexie sync [P0 LAUNCH BLOCKER, ~2 hr]

**Status:** 4 writeQueued sites bypass Dexie. Page does optimistic UI via in-memory `diaryLogs[meal].push()` + `saveDiaryCache()` localStorage. Keep that for in-session render. Add synchronous Dexie writes alongside:
- L1281 — POST nutrition_logs → `VYVELocalDB.nutrition_logs.upsert(localRow)` synchronously before
- L1386 — POST nutrition_logs (second insert path) — same
- L894 — DELETE nutrition_logs → `VYVELocalDB.nutrition_logs.delete(id)` synchronously before
- L686 — PATCH nutrition_logs (food edit) — switch from DIRECT_FETCH to writeQueued + add `VYVELocalDB.nutrition_logs.upsert(merged)` before

Result: log food, close app, reopen — Dexie has the row, no read-after-write hazard.

### PM-122 candidate — critical-hydrate coverage for 9 unmapped member-data pages [P0 LAUNCH BLOCKER, ~3-4 hr]

**Status:** 9 pages paint member data but neither call criticalHydrate nor have a page key in firstPaintHydrate.js: engagement.html (handled in PM-119 above), log-food.html, monthly-checkin.html, wellbeing-checkin.html, exercise.html, movement.html, certificates.html, settings.html, activity.html.

**Recommended fix shape:** Don't bloat the page-key map. Introduce a `criticalHydrateBase(email)` that always pulls members + this-week activity (covers most of the overlaps), then page-specific keys layer extras only when truly extra. Most of the 9 pages just need `criticalHydrateBase` + 0-1 extras.

### PM-123 candidate — settings.html 3 DIRECT_FETCH writes [P0, ~1 hr]

**Status:** 3 of settings.html's 6 write sites are DIRECT_FETCH (L1033 members PATCH, L1300 members PATCH, L1537 member_habits PATCH). The other 3 are correct DIRECT_WITH_OPTIMISTIC. Fix the 3 DIRECT_FETCH sites by routing through writeQueued + adding synchronous VYVELocalDB.<table>.upsert before. db.js merge override (§23.7.5) handles the partial-payload correctness.

### PM-124 candidate — dual-cache architectural decision [P0 STRATEGIC, 30 min discussion + ~2 hr action]

**Status:** This is the load-bearing decision from the audit. The codebase has two parallel local-data systems and the brain only documents one.

**Option A — Codify System B as a §23.13-style L0 tier.** Add to master.md §3 + §23.13: "Tier 0 — localStorage cache. Same data as Dexie, written via auth.js `_vyvePf*` prewarmers at signal-auth-ready. Read first by cache-first paint blocks. Survives WKWebView ITP IDB wipe (PM-113 finding). Falls through to Dexie on miss; falls through to REST/EF on Dexie miss." Keep all `vyve_*_cache_*` keys, document each one. Outcome: complexity becomes explicit.

**Option B — Retire System B post-PF-14b approval.** iOS 1.3 (2) and Android 1.0.3 (10) are both already submitted (PM-115/PM-116). Once approved (~24-48hr from now), members on the App Store / Play builds run in bundled mode — no remote-origin ITP IDB wipe risk. Strip `_vyvePf*` from auth.js, remove all `vyve_*_cache_*` reads from pages. Outcome: one source of truth, §3 contract honoured.

**Recommendation:** Option B. The PM-113 hotfix was a trial-phase workaround; PF-14b is the architectural fix. Once both apps are approved, System B is technical debt. Keeping it doubles every future cache-shape change.

**Caveat:** if either app review goes the wrong way (Apple rejects 1.3, Google rejects 1.0.3), Option A becomes the safer call. Decision can wait until both reviews land.

### PM-125 candidate — sync.js plan() column gap + member_habits id/assigned_at [P1, ~45 min]

**Status:** Two structural fixes to sync.js + db.js.

1. `sync.js plan()` `daily_habits` pull at L121-131: change `select=member_email,activity_date,habit_id,habit_completed,notes` to `select=*` (matching firstPaintHydrate's behaviour). This means lazy/mass-hydrate paths get the full row including `logged_at`, closing the `last_habit_at` permanently-null bug in home-state-local.js. ~5 min.
2. `sync.js plan()` `member_habits` pull at L139-146: add `id, assigned_at` to the select projection. `db.js` `member_habits.replaceForMember` (db.js L401-416): add `id: r.id` and `assigned_at: r.assigned_at` to the denormalisation. Closes the silent column drop. ~40 min including local testing.

### PM-126 candidate — remaining 9 QUEUED_NO_OPTIMISTIC write-site sweep [P1, ~2-3 hr]

**Status:** Routine §23.7.6 sweep across: habits.html L655 + L807 (undo paths), nutrition.html L765 (weight log), and the 6 from log-food.html + workouts-session.js (covered by PM-120/PM-121 above — these merge into those).

Net new work after PM-120/PM-121: just habits.html L655 + L807 + nutrition.html L765. ~45 min.

### PM-127 candidate — brain drift patches [P2, ~15 min]

**Status:** Two INFO findings from the audit.

1. `master.md §23.11` example denormalised columns ("name, description, category, difficulty, theme") don't match live `habit_library` schema. Update example to the actual columns: `habit_pot, habit_title, habit_description, habit_prompt, difficulty`. db.js code is correct; only the rule's example is the drift.
2. `audit/pf-40-1-callsites.json` (PM-107) was flagged in the brief as potentially stale. Confirmed: PM-117 re-derived everything from live code. Either delete pf-40-1-callsites.json (replaced by dexie-audit-2026-05-15.json) or add a header note "SUPERSEDED by PM-117 audit". Either is fine.

### PM-117 audit deliverables (already shipped this commit)

- `audit/dexie-audit-2026-05-15.json` (~104KB) — structured per-file audit, 81 files, 46 findings, full per-file read/write/hydrate classifications.
- `audit/dexie-audit-2026-05-15.md` (~26KB) — narrative companion with prioritised fix list, sequencing, 5 open Qs for Dean.

## Added 15 May 2026 PM-116 — PF-14b Android shipped; new launch-blocker follow-ups

### Android keystore + password 1Password backup [P0 LAUNCH BLOCKER, immediate]

**Status:** Keystore recovered PM-116 from Google Drive folder "Dean's things" (two identical copies). Password `Weareinthis2026!` brute-force-recovered against Dean's candidates. Path: `~/Projects/vyve-capacitor/android/app/keystore/vyve-release-key.jks`. PKCS12 format, alias `vyve-key`, SHA1 `CC:48:EA:AF:C1:47:ED:43:20:63:4F:FF:07:99:79:20:55:7D:23:B9`, valid until 2051.

**Risk:** If Dean's Mac is wiped, lost, or replaced before keystore + password are co-located in 1Password, the app is **un-shippable** for the entire lifetime of `co.uk.vyvehealth.app` on Play Store. Google does not let you re-sign a published app under a different upload key without a 14-90 day migration through their Play App Signing service, and that service has its own risk surface.

**Fix:** 30-second action.

1. Lewis: in 1Password (VYVE Health vault), create a new Secure Note: "Android Release Keystore (vyve-release-key.jks)".
2. Attach the keystore file itself (binary attachment).
3. Add fields: `Password: Weareinthis2026!`, `Alias: vyve-key`, `Created: 12 Apr 2026`, `Valid until: Apr 2051`, `SHA1: CC:48:EA:AF:C1:47:ED:43:20:63:4F:FF:07:99:79:20:55:7D:23:B9`, `Path on Dean's Mac: ~/Projects/vyve-capacitor/android/app/keystore/vyve-release-key.jks`.
4. Tag for shared access between Lewis and Dean.

**Estimated time:** 5 minutes including locating the file in Drive and downloading.

### vyve-capacitor git init + remote push [P0 LAUNCH BLOCKER — escalated to same-week]

**Status:** Same as PM-115 backlog item, now escalated. PM-116 hit the same problem a third time — cumulative uncommitted edits across `build.gradle`, `variables.gradle`, `keystore.properties`, `local.properties` over the iOS + Android ships now sitting in an unversioned working tree. Backup files (`.bak-pf14b`, `.bak-pf14b-android`, `.bak`) are the only history we have. Any accidental file overwrite is unrecoverable.

**Fix:** Same as PM-115 sequence. Stop deferring. Land it in the next session before the next architectural ship.

**Estimated time:** 30-45 min. Block on this before touching the Capacitor project again for any non-trivial work.

### Health Connect native integration on Android (PF-29 advance) [P1, post-launch]

**Status:** Capgo Health plugin (`@capgo/capacitor-health@8.4.7`) is in the Android bundle as of PM-116 but is no-op — Android needs the separate Health Connect SDK integration to actually read data. PM-116 declared 25+ permissions in Play Console under "planned use" framing. The declaration creates an honesty obligation: Google may revisit the declaration if we don't ship the integration within ~6 months (no hard deadline, but reasonable expectation).

**Fix:** Wire `@capgo/capacitor-health` into actual Android Health Connect data reads — minimum: steps, heart rate, sleep. Mirror iOS HealthKit code path. Folds into PF-29 backlog scope.

**Estimated time:** 1 session for read-only data ingestion, 1 session for UI surfaces that consume it.

### Play Console state audit before next Android ship [P2, hygiene]

**Status:** PM-116 surfaced ~3-4 weeks of brain drift on Android Play store state (brain said "1.0.2 awaiting review", live state was "1.0.2 live since 21 April 2026"). New §23.24 rule codifies the pre-ship audit. Future Android sessions should fetch Play Console state via screenshot or quick check before composing the ship plan.

**Action when relevant:** add a step at the top of any Android ship playbook: "Open Play Console → screenshot dashboard + bundle explorer → confirm versionCode history + live version + last update date before composing the ship plan." Costs 30 seconds, prevents §23.20-style versionCode collisions and stale brain assumptions.

### Capawesome 27 May trial decision — Android test path [extends PM-115 item]

**Update to existing PM-115 backlog item.** With Android now also bundled-mode and Capawesome SDK in the AAB, the trial decision input set expands:

- Test that Capawesome OTA bundle delivery works on **both iOS and Android** between 15 May and 27 May, not just iOS.
- iOS test path: TestFlight install of 1.3, push trivial CSS-change OTA bundle, verify it lands.
- Android test path: Internal testing install of 1.0.3, push same OTA bundle, verify it lands on Android too.
- Capawesome charges per-app, so iOS + Android counts as 2 apps. Check whether the Starter tier covers both or whether we move to a higher tier. **Cost verification needed before 27 May decision.**

---

## Added 15 May 2026 PM-115 — PF-14b iOS shipped, Android next; new launch-blocker items from tonight's pipeline

### PF-14b Android 1.0.3 — bundled-mode Capacitor + Capawesome [✅ SHIPPED PM-116 / 2026-05-15 — Android 1.0.3 (versionCode 10) submitted to Google Play Production track. AAB at `~/Desktop/vyve-1.0.3-build10.aab`. In review.]

**Status:** iOS half shipped PM-115 (1.3 (2) submitted to App Review). Android side is mechanical — same `capacitor.config.json` already in place from tonight, same Capawesome app + production channel `89e12796-aa41-4176-8d78-bc2ef6dfd5c2`. Sequence:

1. `npx cap sync android` — confirm `@capawesome/capacitor-live-update@8.2.2` + `@capgo/capacitor-health@8.4.7` detected on Android side.
2. Inspect `android/app/build.gradle` for current `versionCode` and `versionName` literals. Bump appropriately — `versionCode` must be strictly greater than every previously uploaded build regardless of track; `versionName` bumps to `1.0.3` for parity with iOS marketing version pattern.
3. **Apply Android equivalent of §23.17 Info.plist placeholder fix.** Capacitor's `build.gradle` likely ships hardcoded `versionCode 1` + `versionName "1.0.2"` rather than reading from a `gradle.properties` file. If hardcoded, refactor once to use `${rootProject.ext.versionCode}` / `${rootProject.ext.versionName}` so future bumps are clean. Same template lesson as iOS Info.plist, different file.
4. Locate Android keystore — current location is undocumented per brain. Likely in `~/Projects/vyve-capacitor/android/` or in `~/Library/Android/`. Document the path during this session.
5. `./gradlew bundleRelease` from `android/` → produces signed `.aab` at `android/app/build/outputs/bundle/release/app-release.aab`.
6. Sign manually if not auto-signed (keystore path + alias + password).
7. Upload to Google Play Console → whichever track 1.0.2 used (Internal Testing or Production).
8. Release notes — mirror iOS 1.3 "What's New" copy.
9. Submit for review. Google review usually hours, not days.

**Capgo HealthKit plugin on Android.** Won't engage — Android needs Health Connect, separate plugin entirely. The Health Connect integration is a separate PF-29 backlog item, post-launch. For 1.0.3 the Capgo plugin should be silent / no-op on Android, not throw.

**Estimated time:** 1-2 hours if no surprises. Bring §23.15 (quit Android Studio before sed'ing build files) and §23.17 (placeholder fix) into the session.

### vyve-capacitor git init + remote push [P0 LAUNCH BLOCKER, escalated]

**Status:** Hit twice in 48hr window via §23.16. Direct git clone of vyve-site from Dean's Mac returns 403 (no PAT, no `gh` CLI). Workaround pattern (Composio-tarball) works but is friction every session that needs vyve-site contents in `~/Projects/vyve-capacitor/www/`.

**Fix:** make vyve-capacitor a real git repo, push to a private VYVEHealth org repo. Then Dean's Mac can `git pull` to refresh `www/` between iOS/Android builds without the Composio dance.

Sequence:

1. Generate a GitHub PAT scoped to `repo` (read+write) on the VYVEHealth org. Lewis may already have one in 1Password; if not, generate fresh.
2. Store via `git config --global credential.helper osxkeychain` + first auth attempt seeds the keychain. Or use `gh auth login` if `gh` is being installed anyway.
3. `cd ~/Projects/vyve-capacitor && git init && git add -A && git commit -m "PF-14b initial commit: bundled-mode + Capawesome"`.
4. Create `VYVEHealth/vyve-capacitor` private repo via GitHub web or `gh repo create`.
5. `git remote add origin git@github.com:VYVEHealth/vyve-capacitor.git` (SSH) or HTTPS with PAT.
6. `git push -u origin main`.
7. Add `.gitignore` for `node_modules/`, `ios/App/Pods/`, `android/.gradle/`, `android/app/build/`, `ios/App/build/`, `*.bak-*`, `~/Library/Developer/Xcode/DerivedData/`. Don't commit Capacitor's auto-generated `ios/App/App/public/` either — it's a build artefact of `cap sync`.
8. Decide on `www/` policy: either commit it (snapshot of vyve-site at build time) or `.gitignore` it (pulled fresh per build via the Composio pattern). Recommend commit — gives reproducible builds, makes "what's in this build" answerable from git history.

**Estimated time:** 30-45 min. Should land BEFORE Android 1.0.3 work so Android build artefacts don't muddy the first commit.

### Capawesome trial decision — 27 May 2026 [P0 DECISION]

14-day trial started 14 May 2026 PM-115. Decision day **27 May 2026** — four days before the 31 May launch. £15/mo USD Starter tier (corrected from earlier £8 figure).

**Decision inputs needed by 27 May:**

- Has an OTA update actually been tested via Capawesome between 15 May and 27 May? (At minimum: ship a trivial CSS change as an OTA bundle, verify it lands on a real device without going through Apple/Play review.)
- Is Lewis comfortable with the £15/mo line item? At our scale (sub-100 members, sub-1000 OTA-eligible installs) Starter is plenty. Pro is unnecessary.
- Alternative is Capgo (their consumer app, not the Capgo HealthKit plugin we already use). Capgo's OTA service is the established Capawesome competitor. Brain previously held them as the leading option. Worth a side-by-side on cost + reliability if there's an unhappy moment with Capawesome before 27 May.

Default: keep Capawesome unless something specific surfaces. The integration is done, the trial is paid via card-on-file (auto-bills on day 15 if not cancelled). Cancellation is a website action, not a support ticket.

### Post-1.3-approval device verification [P1, blocked on Apple approval]

When iOS 1.3 (2) approves and auto-releases:

1. Install on Dean's iPhone via App Store (not TestFlight — production install).
2. Verify the app loads `index.html` from the bundled `www/` not from `https://online.vyvehealth.co.uk`. Best test: airplane mode → kill app → reopen → app should still load and render skeleton + cached data. Pre-PF-14b this would have failed (network-dependent first paint).
3. Verify Capawesome live-update SDK initialised — should show in console at launch as "LiveUpdate initialized" or similar. Don't push an actual OTA bundle yet (test that during the Capawesome 27 May decision window).
4. Verify Capgo HealthKit plugin works under bundled mode — open Settings → Apple Health, confirm the connect toggle works, data flows. Bundled mode shouldn't change anything HealthKit-wise (the plugin is native, not webview), but worth confirming once.
5. Verify the persona welcome overlay closes in ~1500ms (PM-114 fix, untested on bundled iOS — only tested under remote-origin).

**Time:** 15-20 min device walk. Document findings as a §19 update in the brain commit following the verification.

### Post-1.3-approval Capawesome `publicKey` hardening [P2, post-launch]

The `capacitor.config.json plugins.LiveUpdate.publicKey` is currently empty string. Means OTA bundles are not code-signed — any actor that compromises the Capawesome account could push a malicious bundle to production members. Mitigation: generate a code-signing keypair, embed public key in app, configure Capawesome to require signed bundles.

**Time:** 30-45 min. Post-launch, not urgent until member count grows past trial cohort.

### Android keystore documentation + portable CI signing [PARTIAL — keystore + password documented PM-116; 1Password backup + CI signing pipeline outstanding]

Current state: Android keystore exists somewhere on Dean's Mac but path is not documented in brain. Tonight's Android 1.0.3 work will surface the path. Once known:

1. Document in `brain/master.md` §25 or §24 credentials section.
2. Back up keystore + password to 1Password (Lewis owns 1Password).
3. Set up GitHub Actions CI workflow that can build + sign AABs from a fresh clone of vyve-capacitor — requires the keystore secret in GitHub Actions secrets.
4. Future Android releases run via CI, not from Dean's local Mac.

**Time:** 2-3 hours total. Post-launch unless Lewis or other team members need to ship Android builds before then.

## Added 14 May 2026 PM-106 — PF-40 Local-First Consolidation Campaign (active meta-frame; supersedes per-page wire work)

### PF-40 — Local-First Consolidation Campaign [P0 LAUNCH BLOCKER, active]

**Status:** Scoped end-to-end PM-106. **PF-40.1 audit SHIPPED PM-107 (2026-05-14)** — 321 call sites enumerated and classified; artefacts at `audit/pf-40-1-callsites.json` + `playbooks/pf-40-local-first-consolidation.md`. **PF-40.2 (fat-row member-scoped hydrate) is the next ship.** Folds PF-14d / PF-14e / PF-15.write-optimistic / PF-31 / PF-32 / PF-33 / PF-34 partial / PF-34b / PF-35 / PF-36 as symptoms. PF-14b stays separate (its own review cycle, sequences in parallel).

**Why the campaign exists.** Per-page Dexie wires (PF-6..PF-12, PF-15.x, PF-34) ship pages that paint from Dexie successfully *when the table's denormalised columns happen to be in the hydrate*. They fail when they're not. The 14 May 2026 evening canary walk on `test1@test.com` surfaced this on `habits.html` — page painted `undefined / undefined / undefined` for ~10s until EF backfill arrived with the join columns. The pattern survives for workouts/cardio (self-contained rows) but is latent on every page that reads catalogue joins. Building more clones would build more latent bugs. PF-40 fixes the foundation (hydrate completeness, consolidated read/write APIs, tiered assets) so per-page work becomes mechanical and bug-free.

**Contract (codified in active.md §3 + §23.11/§23.12/§23.13):** Dexie is the source of truth for *everything* the app reads. First-login is a deliberate long load (~5MB JSON + ~5MB images) masked by the consent gate and persona-led walkthrough. After first-login, every subsequent open is instant from Dexie. Network is for sync, for §23.10 honest carve-outs (sessions, AI moments, leaderboard, live chat, cron content), and for Tier 3 library-browse assets. Single-device-per-user assumption through 31 May launch; last-write-wins; multi-device conflict resolution is post-launch.

#### Sub-items (dependency order)

**PF-40.1 — Write-path & read-path audit** [✅ SHIPPED PM-107 / 2026-05-14]
- Read-only session, ~3-4h, solo daytime, no device required.
- Enumerate every `fetch()` / `supaFetch()` / `writeQueued()` / direct PostgREST call across vyve-site (HTML + JS).
- Classify each: member-scoped read | catalogue read | member-scoped write | §23.10 network-bound carve-out | dead code.
- Output: JSON map keyed by file:line driving PF-40.4 + PF-40.5 mechanically.
- Deliverable: `playbooks/pf-40-local-first-consolidation.md` as the campaign reference document (living, updated as audit surfaces shapes).

**PF-40.2 — Hydrate completeness — fat-row member-scoped tables** [P0, NEXT SHIP, depends on PF-40.1 ✅]
- ~1-2 sessions. Device verify on iPhone after ship.
- Expand `db.js pullOneTable()` for every member-scoped table to fetch with denormalised join columns the UI reads.
- `member_habits` ← `habit_library` join (name, description, category, difficulty, theme). Tonight's canary.
- Audit driven by PF-40.1 output. Each table gets its denormalised columns codified.
- New `VYVELocalDB.<table>.upsertFat()` preserves join columns on writes.
- Fixes PF-40.2's covering symptoms: tonight's Habits canary, PF-31 (page re-entry clobber — fat-row writes can't be clobbered by thinner cached reads).

**PF-40.3 — Catalogue tables as first-class** [P0, depends on PF-40.1]
- ~1 session. Read-only verify (catalogue data appears in Dexie after first-login).
- Add `habit_library`, `workout_plans` (all 5 plans, not just active), `nutrition_common_foods`, `personas`, `service_catalogue`, `knowledge_base`, exercises, `running_plan_cache` to the Dexie schema.
- Pull-on-login behind a one-time gate so existing members get catalogue tables on next visit.
- New `_catalogue_meta` table tracks `last_updated_at` per catalogue for PF-40.10 delta-pulls.
- Unlocks "switch your workout plan offline" — every plan is in Dexie, switching is a Dexie write.

**PF-40.4 — `VYVEData.write(table, row)` API + per-page migration** [P0, depends on PF-40.1 + PF-40.2]
- ~1 session for API + 2 sessions for per-page migration. Device verify each batch.
- API does: optimistic Dexie upsert (with fat-row support), bus publish, `_sync_queue` enqueue, return synchronously.
- Drainer is the only HTTP-aware code; pages never `fetch()` for writes.
- Migrates: every direct-fetch write from PF-40.1 audit. Collapses PF-1 / PF-9 / PF-10 / PF-12×6 / PF-34×4 per-page upsert workarounds.
- Cascading benefits: PF-4b Part 1 (`members` read-after-write hazard) ceases to exist. PF-8 `members` carve-out closes. PF-33 (synchronous header counter) becomes the API's responsibility, not the page's.

**PF-40.5 — `VYVEData.read(table, query)` API + page-level fetch removal** [P0, depends on PF-40.2 + PF-40.3 + PF-40.4]
- ~2 sessions. Device verify each batch.
- API does: Dexie read with the table's denormalised shape; if empty post-first-hydrate, throw (hydrate bug, not a page bug).
- Migrates: every direct read call from PF-40.1 audit.
- §23.10 carve-outs use explicit `VYVEData.fetchNetworkBound(endpoint, options)` — nameable, auditable, distinguishable from accidental REST.

**PF-40.6 — Tier 1 assets bundled in IPA** [P0, depends on PF-14b]
- ~0.5 session. Folds into PF-14b's existing bundled-mode migration scope.
- Identify brand chrome + persona portraits + persona animations + home/empty-state illustrations + achievement tier illustrations + icons.
- ~2-3MB total. Move into `www/assets/` under Capgo bundled mode.
- iOS 1.2 + Android 1.0.3 builds include Tier 1.

**PF-40.7 — Tier 2 pre-fetch on first-login / plan-switch** [P0, depends on PF-40.3 + PF-40.6]
- ~1 session. Device verify (timing during walkthrough must not block UI).
- New `VYVEAssets.prefetch(programme)` extracts every exercise thumbnail referenced by a programme JSON, fetches them, persists into SW asset cache.
- Runs as part of onboarding EF v37 success handler (after consent gate, during walkthrough).
- Re-runs on plan switch.
- Habit thumbnails pre-fetch similarly (assigned habits only). Persona-bound UI on persona switch.

**PF-40.8 — Tier 3 CDN-on-view + placeholders** [P0, depends on PF-40.7]
- ~0.5 session.
- Non-current-programme assets render with `<img>` pointing at CDN URL, placeholder + exercise name while loading, no SW interception.
- SW fetch handler explicitly excludes Tier 3 asset URLs from cache.
- Library-browse page shows honest §23.10 offline state when no connection.

**PF-40.9 — Boot chain offline-equivalence** [P0, depends on PF-40.5]
- ~1 session. Airplane-mode cold-boot device test mandatory.
- Every `await` between page load and `vyveSignalAuthReady` must tolerate network failure.
- `auth.js` session restore reads locally-persisted session FIRST, paints, attempts server-side refresh non-blocking.
- PostHog `posthog.init` deferred to post-auth-ready (currently `async=true` so non-blocking, but worth being explicit).
- SW HTML strategy shifts cache-first for navigation requests.
- PF-14c precache already handles SDK loaders (shipped PM-105). **PF-14d folds in here.**

**PF-40.10 — Catalogue delta-pull with `updated_at` + force-refresh lever** [P1, depends on PF-40.3]
- ~1 session.
- Delta-pull on `visibilitychange-to-visible` respects `updated_at` per catalogue table.
- Server publishes catalogue updates with monotonic `updated_at`.
- New `_catalogue_force_refresh` table (single row holding a version int); bumped server-side triggers full re-pull of all catalogues on next launch.
- Used for emergency clinical retractions (Phil pulls a clinically-inappropriate habit; force-refresh version bump; next launch re-pulls `habit_library`).

**PF-40.11 — Offline UX states for §23.10 carve-outs** [P0, depends on PF-40.9]
- ~1-2 sessions. Lewis copy gate is the rate-limiting step (~10 strings).
- Designed offline states for: leaderboard, sessions schedule, live chat, AI moments, certificate-pending.
- "Leaderboard refreshes when you're online" / "Your check-in is saved and will submit when connection returns" / "Connect to view live sessions" — explicit affordances, not graceful-degradation-to-blank.
- **PF-14e folds in here.**

**PF-40.12 — Spike-flag removal + main-only path** [P0, campaign closer]
- ~0.5 session.
- All spike-off code paths deleted, toggle UI in settings.html removed, `vyve_lf_spike` localStorage key treated unconditionally as ON.
- The PF-19 cleanup deferred during PF-14.
- Final ship of the campaign.

#### Total estimate

~13-16 Claude-assisted sessions. Hard sequencing: PF-40.1 first; everything else parallelises into four work streams (data layer / asset layer / boot layer / UX layer). Against 31 May launch (17 days from PM-106): tight but doable if Sundays and evening sessions cover the device-verification batches. If launch slips by a week, comfortable.

#### Device-requirement table

| Sub-item | Solo-shippable | Device verify | Phase |
|---|---|---|---|
| PF-40.1 audit | ✓ | — | Foundation |
| PF-40.2 fat-row | ship | iPhone + Android | Data |
| PF-40.3 catalogues | ship | iPhone | Data |
| PF-40.4 write API | ship | iPhone (each batch) | Data |
| PF-40.5 read API | ship | iPhone (each batch) | Data |
| PF-40.6 Tier 1 | ship | post-Apple-review | Assets |
| PF-40.7 Tier 2 | ship | iPhone (walkthrough) | Assets |
| PF-40.8 Tier 3 | ship | iPhone (offline browse) | Assets |
| PF-40.9 boot chain | ship | iPhone airplane mode | Boot |
| PF-40.10 delta-pull | ship | — | Data |
| PF-40.11 offline UX | ship (Lewis copy) | iPhone (each surface) | UX |
| PF-40.12 cleanup | ship | smoke test | Closer |

#### Folded into PF-40 (closed as standalone backlog items)

- **PF-14c — Offline cold-boot** (SHIPPED PM-105, kept in changelog for history)
- **PF-14d — Offline nav between pages** → folds into PF-40.9
- **PF-14e — Offline UX states** → folds into PF-40.11
- **PF-15.write-optimistic — await/optimisticPatch order flip on habits/cardio/wellbeing-checkin** → folds into PF-40.4 (the API makes this the default)
- **PF-31 — Page re-entry read path clobbers Dexie writes** → folds into PF-40.5 (fat-row reads can't be clobbered) + PF-40.4 (writes guarantee Dexie state)
- **PF-32 — Home page doesn't reflect cross-page writes** → folds into PF-40.4 (bus publish is part of write API; every page subscribes via `VYVEData.subscribe()`)
- **PF-33 — Synchronous header counter mutation missing** → folds into PF-40.4 (the API mutates in-memory + bus-publishes synchronously before returning)
- **PF-34 — engagement/certificates/running-plan/movement Dexie wires (partial)** → already-shipped slices (certs, movement) survive; running-plan + engagement re-architect as PF-40 sub-items
- **PF-34b — running-plan.html schema work** → folds into PF-40.3 (`running_plan_cache` becomes a first-class catalogue table)
- **PF-35 — Home vs habits.html counter disagreement** → resolved by PF-40.5 (both pages read from `home-state-local.js` summary, which is single source of truth)
- **PF-36 — Warmup orchestrator with consent-gate-as-hold-window** → folds into PF-40.7 (Tier 2 pre-fetch runs during the consent-gate / walkthrough window)

#### Stays separate

- **PF-14b — Bundled-mode migration** (sequences with PF-40.6 but is its own commit for Apple/Google review reasons)
- **PF-21 — Bottom nav restructure** (pure UI, post-PF-19 / PF-40.12)
- **PF-23 — Interactive guided tutorial** (V2 target, post-PF-21, Lewis copy gate)
- **HAVEN clinical sign-off** (Phil-blocked, parallel)
- **Achievements overhaul** (post-trial)
- **All copy gates** (PF-13 hydration, PF-23 tutorial, PF-27 AI-moment, PF-40.11 offline UX)

#### First ship after this commit

**PF-40.2 fat-row member-scoped hydrate.** PF-40.1 audit shipped 2026-05-14 (PM-107) — the JSON map at `audit/pf-40-1-callsites.json` enumerates 321 call sites across vyve-site at main `66f02b84`, classified into 13 categories. PF-40.2 is the structural fix for the Habits "undefined" canary that re-shaped the campaign at PM-106.

PF-40.2 work shape: schema audit per member-scoped table; expand `db.js pullOneTable()` to fetch with denormalised join columns; introduce `VYVELocalDB.<table>.upsertFat()` preserving join columns on writes; device-verify on iPhone + Android. The `member_habits` ← `habit_library` join is the canary fix.

#### Audit findings (PF-40.1 / PM-107 ship)

**Migration target counts** (full map in `audit/pf-40-1-callsites.json`):

- PF-40.4 writes: 55 sites across 16 files. By category: 21 LOCAL_UPSERT + 13 W_QUEUED + 21 W_MEMBER. By table: workouts (8), cardio (5), daily_habits (4), workout_plan_cache (4), members (4).
- PF-40.5 reads: 137 sites across 27 files. By category: 73 R_MEMBER + 4 R_CATALOGUE + 60 LOCAL_READ. Heaviest: index.html (13), monthly-checkin.html (13), wellbeing-checkin.html (13), certificates.html (11).
- PF-40.11 offline UX: 36 NET_BOUND sites across 18 files. Top EFs: platform-alert (11), share-workout (6), anthropic-proxy (2). Lewis copy gate ~10 strings.

**Pre-existing API found.** `window.VYVEData` already defined in `vyve-offline.js` with `cacheGet / cacheSet / fetchCached / writeQueued / outboxFlush / outboxList / outboxClear / newClientId`. PF-40.4 and PF-40.5 evolve this surface; do not rebuild.

**Dead-code candidates surfaced (clean up at PF-40.12):**

- `log-perf` EF (4 references) — dead since PF-30 (PM-90) redirected perf.js to PostHog.
- `register-push-token` EF (1 ref) + `vapid.js` writes to `push_subscriptions` (1 ref) — stale post-1.2 native APNs migration. Gate `vapid.js subscribePush()` on `!window.Capacitor || Capacitor.getPlatform() === 'web'` before cleanup.

**Open questions for PF-40.2 / PF-40.3 ships:**

1. **`weekly_scores` not in Dexie schema** (wellbeing-checkin.html:1121, monthly-checkin.html similar). Decision: derive trend-chart data client-side from `wellbeing_checkins` (already in Dexie) rather than adding `weekly_scores` as a member-scoped table. Single source of truth.
2. **`member_running_plans` + `running_plan_cache`** schema work for running-plan.html (3 NET_BOUND anthropic-proxy sites). PF-34b folds into PF-40.3 with a cross-member sync rule for the shared `running_plan_cache`.
3. **`monthly_checkins` table schema** — confirm shape in Dexie (likely member-scoped, similar to wellbeing_checkins).
4. **`achievements` table schema** — server-only with cron-driven authoritative numbering is the recommendation; achievements overhaul is post-trial scope per PM-94 anyway.

---

## Added 14 May 2026 PM-103 (Canary walk on test1@test.com surfaced PF-14c offline launch blocker + PF-31..36 read/sync/UX gaps; §23.9 + §23.10 codified)

### PF-14c — Offline cold-boot must paint home from local within 2s with zero network [CAUSES A+B SHIPPED 14 May 2026 PM-105 — `66f02b84`; CAUSE C DEFERRED pending tonight's device verification]

**Status:** Causes A+B shipped 14 May 2026 daytime (PM-105). Commit `66f02b84f0588d0bc2fdbed4ca06ae684e10f685` on vyve-site main. Awaiting Dean's device verification tonight to confirm fix is sufficient or Cause C is real.

**Root causes (diagnosed PM-104, fixed PM-105):**

- **Cause A: `/supabase.min.js` not in sw.js urlsToCache.** auth.js `vyveLoadSupabaseSDK()` injects `<script src="/supabase.min.js">`. Offline cold-boot: SW asset handler cache-miss → falls to network → fails → WKWebView inconsistent on rejected `respondWith` (sometimes fires onerror, sometimes hangs). When it hangs, `await vyveLoadSupabaseSDK()` never resolves → `vyveRevealApp()` never fires → `#app` stays `display:none` → black screen. **FIX:** added `/supabase.min.js`, `/dexie.min.js`, `/achievements.js` to sw.js urlsToCache.

- **Cause B: Dexie loaded cross-origin from cdn.jsdelivr.net.** db.js `DEXIE_CDN` constant pointed to `https://cdn.jsdelivr.net/npm/dexie@4.0.10/dist/dexie.min.js`. SW skips cross-origin (correct policy). Offline native fetch fails. Local-first dead. **FIX:** vendored dexie.min.js (94KB, dexie@4.0.10) into the repo at `/dexie.min.js`; db.js `DEXIE_CDN` constant changed to same-origin path; added to sw.js urlsToCache.

- **Cause C (deferred): No Promise.race timeout on `vyveLoadSupabaseSDK()`.** Belt-and-braces. If A+B aren't sufficient, the await chain wants a 5s race with a "Preview mode: offline" fallback so `vyveRevealApp` fires regardless. Ship only if device verification reveals further hangs.

**Cosmetic primitives that the original spec named but which turned out to be non-issues for the actual symptom:**

- `posthog.init` is async (the script-loader is `async=true`); not in the blocking paint path. Telemetry to PostHog still fails offline but doesn't block paint.
- `vyveSignalAuthReady` fires synchronously from the fast-path BEFORE the authoritative `getSession()`. The fast-path also short-circuits on `!navigator.onLine`. So the auth chain itself was already offline-resilient — the failure was earlier, at SDK load.
- SW HTML strategy (stale-while-revalidate) was already correct for HTML; the cache miss was on JS assets, not HTML.

**Verification protocol (Dean tonight):**

1. Open app online, log in, navigate around — let SW install + cache.addAll() populate every urlsToCache entry.
2. Force-close app entirely.
3. Airplane mode ON.
4. Re-open app cold.
5. Expected: cold-boot to home in under 2s with no network. Page nav works. Dexie-wired surfaces render from local data.
6. If still black-screens: Cause C is real, ship the Promise.race timeout wrap.

**Estimated remaining if Cause C ships:** 30-45 min Claude + ~15 min Dean device verification.

### PF-14d — Offline navigation between pages [P0 LAUNCH BLOCKER]

**Status:** OPEN P0. Same root cause as PF-14c (every page boot uses the same auth chain). Fix likely emerges as a side effect of PF-14c. If not, service worker fetch strategy needs explicit `caches.match()` fallback on navigation request failure. Ship paired with PF-14c if possible.

### PF-14e — Offline-bound UX states must exist as designed components [P1, post-PF-14c]

**Status:** OPEN P1. Sessions schedule list, leaderboard, AI moments need explicit offline states ("Connect to view live sessions", "Leaderboard refreshes when you're online", "Your check-in is saved and will submit when connection returns"). Currently degrade to blank or hang. Each one a small design+component ship — likely a session of work bundled together.

### PF-31 — Page re-entry read path clobbers Dexie writes [P0 LAUNCH BLOCKER]

**Status:** OPEN P0. Surfaced 14 May 2026 canary walk on test1@test.com.

Workouts page shows session complete + achievement fires inline. Navigate away to home. Navigate back to workouts — green check has VANISHED. Server-verified the write landed correctly (2 workouts, 14 exercise_logs, 14 achievements queued). The local client-side display loses state on re-entry. Possible root causes:
1. Write went to in-memory only, never persisted to IndexedDB durably. Page state mutated, no real Dexie write.
2. Dexie write happened; page re-mount reads from REST fallback (because Dexie key lookup was wrong, or REST race won), REST returned empty because Supabase write hadn't landed yet, REST clobbered the local Dexie row.
3. Hydrate-pull pattern on every page mount is overwriting fresh writes before they propagate back.

**Diagnostic shape:** Read `exercise.html` + `workouts-session.js` page-mount read sequence; trace which Dexie key the completion-state read uses; confirm whether REST is called on mount and whether it overwrites Dexie. Add a `updated_at` guard so REST never overwrites a Dexie row whose `updated_at` is newer than the REST response.

**Estimated:** Diagnostic ~30 min. Fix ~1 hour + device verification. Likely combined with PF-32 + PF-33 into one cross-page sync session.

### PF-32 — Home page must reflect cross-page writes inline [P0 LAUNCH BLOCKER]

**Status:** OPEN P0. Surfaced 14 May 2026 canary walk.

Log a habit/workout/cardio on its page → home page progress strip stays at 0 until full reload. The bus publish exists; home either isn't subscribed or its subscriber doesn't re-paint.

**Fix shape:** Home subscribes to all activity bus events (habit:logged, workout:logged, cardio:logged, session:viewed, food:logged, weight:logged, wellbeing:logged, check-in events). On any event, home re-paints from local `home-state-local.js` (PF-11b shipped). Achievement toast queue drains unseen entries (`seen_at IS NULL` from Dexie) on every page mount, not just on originating-page evaluation event.

**Estimated:** ~2 hours + device verification. Combine with PF-31 + PF-33 in one session.

### PF-33 — Synchronous header counter mutation sweep [P1]

**Status:** OPEN P1. §23.7.6 PARTIAL — applied to card flips, missed page headers.

Tap habit → habit card flips instantly (correct). Header DAY STREAK / TOTAL LOGGED waits for round-trip. Same on cardio/workouts/wellbeing-checkin/monthly-checkin.

**Fix shape:** Mutate in-memory dataset synchronously, recompute and repaint header same tick, fire Dexie write + bus publish in background. Pattern applied uniformly across all activity-logging pages.

**Estimated:** ~2 hours + device verification.

### PF-34 — PF-15.x sweep [PARTIALLY SHIPPED 14 May 2026 PM-104]

**Status:** Six pages audited. **Two wired and SHIPPED** (`certificates.html`, `movement.html`). **Three are REST carve-outs** by their nature (no schema work would change this for `sessions.html`/`leaderboard.html`; `running-plan.html` deferred to PF-34b). **One deferred** pending design decision (`engagement.html`).

| Page | Outcome | Detail |
|---|---|---|
| `certificates.html` | **SHIPPED** `be690345` | Clean PM-96 clone. `loadPage()` builds member-dashboard payload locally via Promise.all over `certificates` + raw activity tables + `members.first_name`. EF still fires for authoritative `global_cert_number` + `charity_moment_triggered`. |
| `movement.html` | **SHIPPED** `f8bc15cf` | 1 read flip (`fetchPlan`/`workout_plan_cache`) + 4 optimistic Dexie upserts before direct-fetch writes (PF-4b Part 2 hazard closure on `workouts` POST x2, `cardio` POST, `workout_plan_cache` PATCH). Filter preserved: `is_active && category === 'movement'`. |
| `running-plan.html` | **AUDIT-ONLY, deferred to PF-34b** | Reads `member_running_plans` (not in Dexie schema) + `running_plan_cache` (cross-member shared cache by `cache_key`, only mentioned in db.js as future `_kv` use). Proper wire needs schema additions + cross-member sync rule. ~1 session. |
| `sessions.html` | **AUDIT-ONLY, no wire needed** | Fully static page: hardcoded literal `SESSIONS` array in inline JS (8 session types). Zero EF/REST calls. No member-scope state. |
| `leaderboard.html` | **AUDIT-ONLY, REST carve-out documented** | Single `leaderboard` EF call computing cross-member aggregates server-side; cannot be local-first by nature. Existing localStorage `vyve_leaderboard_cache` pattern (24h TTL, optimistic-render-from-cache, `VYVEOffline.showBanner`, 401 redirect) is the right shape — REST carve-outs with offline UX should mirror this. |
| `engagement.html` | **DEFERRED — design decision needed** | Reads `member-dashboard` EF (engagement components — score, recent_30d, streaks) + `member-achievements` EF. These are server-derived **aggregates**, not raw rows. Wire requires either using `home-state-local.js` to compute aggregates from Dexie raw tables client-side (PF-11b extension), OR sequencing after PF-35 (§23.11 pre-aggregated summaries) so engagement reads from a single `member_home_state`-shaped Dexie row. Bigger lift than backlog "30 min" estimate. |

Pattern matches PM-96 exercise.html (`433d0650`) for the clean clones. PF-4b Part 2 direct-fetch hazard handling matches PF-9 cardio.html for write-side upserts.

### PF-34b — running-plan.html Dexie wire (requires schema work) [P1, post-launch viable]

**Status:** OPEN P1, queued. Surfaced 14 May 2026 PM-104 during PF-34 audit. Two schema gaps:

1. `member_running_plans` is not in the Dexie schema. Add as member-scoped table (PK `(member_email, plan_id)` or similar), wire `sync.js` plan().
2. `running_plan_cache` is mentioned in db.js docs only as a future `_kv` use ("small key/value store (running_plan_cache lookups etc.)"). It's a **cross-member shared cache** keyed by `(goal, level, days_per_week, timeframe_weeks, long_run_day)` so the Dexie copy is only useful when the same `cache_key` was previously hit on this member's device. Three approaches: (a) add as a non-member-scoped `_kv` entry, only useful for same-member regenerations (low value); (b) add a sync rule that pulls `cache_key`s recently popular across all members (cross-member denormalisation, useful but adds sync complexity); (c) leave on REST (current behaviour).

Approach (a) is the smallest ship and matches the db.js doc intent. After both schema additions, flip `running-plan.html`'s 5 call sites: 3 `running_plan_cache` reads/writes → Dexie-first + REST fallback (keeping REST as cache-discovery for cross-member hits); 1 `member_running_plans` read/write → Dexie-first + REST fallback; `anthropic-proxy` EF stays on wire (AI moment carve-out per PF-10 pattern).

Estimated ~1 session including schema migration, sync.js plan() additions, page wire, and SW cache bump.


### PF-35 — Page-header numbers must read pre-aggregated summaries, never raw row counts [P1, codify as §23.11]

**Status:** OPEN P1.

Home page "HABITS 11" disagrees with habits.html header "1 total logged" — same concept, two read paths, two different numbers. Home reads raw daily_habits row count from Dexie; habits.html reads `member_home_state.habits_total` (distinct days). Both are "correct" for their source, both rendering same logical surface.

**Fix shape:** Audit every page-header number across the app. Identify each one's current read source. Ensure each reads from a pre-aggregated summary that's trigger-maintained server-side and warmup-pulled client-side. Any header doing `count()` or `length` over raw Dexie rows gets refactored. Codify rule as §23.11. Bounded-payload property: a 6-month-tenured member's warmup pulls one row from `member_home_state`, not 180 daily_habits rows — keeps the cold-start cost CONSTANT regardless of tenure.

**Estimated:** ~2 hours audit + ~2 hours refactor. Single session.

### PF-36 — Warmup orchestrator with consent gate / first-run tour as natural hold window [P1]

**Status:** OPEN P1.

**Dean's architectural insight (14 May 2026 evening):** consent gate + 60-90s first-run tour give the warmup window for free — user is occupied on a non-data-dependent surface while Dexie hydrates everything. Three flows, one engine:

- **Brand-new member:** consent gate → warmup fires in parallel → first-run tour starts only on `vyve-warmup-complete` → tour content while user reads → app fully hot before they tap.
- **Returning member with warm Dexie:** no consent gate, no tour, just login. Warmup runs as delta-refresh; pages paint from existing Dexie immediately while refresh happens silently in background. No holding screen needed.
- **Reinstall path (Dexie wiped, account exists server-side):** explicit "Getting your VYVE ready..." holding screen, gated on `vyve-warmup-complete`. Sub-3-second usually; worst-case ~10s on bad networks.

**Bounded-payload design (Tier 1 / 2 / 3):**
- **Tier 1: pre-aggregated summaries.** `member_home_state`, `member_stats`, programme-progress, certificate-count, etc. ONE row per table regardless of tenure.
- **Tier 2: rolling-window detail.** daily_habits last 14d, workouts last 30d, cardio last 30d, check-ins last 8wk. FIXED sizes regardless of tenure.
- **Tier 3: full history.** Past Sessions archive, full leaderboard timeline. NEVER in Dexie. Fetched on-demand from REST, cached briefly, discarded.

**Estimated:** ~3-4 hours + device verification. Single session. Best paired with PF-14c+d+e session since consent gate is on the cold-boot path.

---

## Added 14 May 2026 PM-103 (test account provisioning complete)

### Test accounts now provisioned and stable

- `test1@test.com` / `1234` — clean fresh-onboarding canary. UUID `11111111-1111-1111-1111-111111111111`. Onboarding_complete=true, persona SPARK, all zeros. **Use for: launch-experience canary walks.**
- `test@test.com` / `1234` — seeded mid-journey canary. UUID `22222222-2222-2222-2222-222222222222`. 48 daily_habits / 4 workouts / 6 cardio across 12-14 days. Engagement score 78. **Use for: existing-customer-reinstall + Dexie-rehydrate-from-populated-Supabase scenario.**

Both: Dean's members shape (kg/cm, individual, dark, SPARK), 12 member_habits (11 active + 1 inactive — deliberate, exercises the inactive-habit-should-not-render path), cloned 8-wk PPL Holiday Shred workout_plan_cache.

**Replaces Dean's real account as the primary test surface going forward.** Use these for every canary walk. Dean's account stays untouched.

---

## Added 14 May 2026 PM-102 (§23.7.8 hard rule: in-app cache reset must trigger full Dexie rehydrate; §23.8 field-test confirmation)

### PM-97 in-app cache reset fix [SHIPPED 14 May 2026 PM-104 — `361b44dc`]

**Status:** SHIPPED 14 May 2026 daytime (PM-104). Commit `361b44dc4abac5755ba378df6f25dc5e7cf36d0d`. Root cause was subtly different from the original spec: the gesture WAS awaiting `VYVESync.hydrate()` before reload, but `hydrate()` is **idempotent within a session** — it returns the page-boot-cached `hydratePromise`, so the await was a no-op. Reload then fired with empty Dexie tables. Fix: replace `hydrate()` with three per-table `hydrateTable()` calls for `members`, `member_habits`, `workout_plan_cache` — these bypass `hydratePromise` and actually pull. Failure path now BLOCKS the reload and toasts `"Reset paused / Check connection then try again"` per §23.7.8 spec point 3. **Verification pending**: Dean to long-press version footer in settings on iPhone 17 tonight.

**Fix shape (per §23.7.8):**
1. Reset gesture must await `VYVESync.hydrate(email)` for at least `members`, `member_habits`, `workout_plan_cache` before reloading. 2-3s loading toast is acceptable; rendering empty/undefined state is not.
2. `location.reload()` must move INSIDE the `.then()` of the rehydrate, never alongside.
3. If hydrate fails (offline, RLS, 5xx) surface a user-facing error and BLOCK the reload — do not navigate into a known-empty Dexie state.
4. Audit any other caller of `VYVELocalDB.<table>.clear()`, `localStorage.removeItem('vyve_home_v3_*')`, or `_sync_meta.set(table, 0)` while we're in settings.html. Likely includes dev tools and possibly some old patcher paths.

**Workaround for users hitting it before fix ships:** full sign-out + sign-in. The reset alone leaves account in broken state until the next full hydrate fires, which doesn't happen automatically.

**Estimated effort:** half a Claude session if scoped tightly to settings.html reset gesture only. Full audit of all cache-clear callers is a separate scoped chunk if §23.7.8 audit signal turns up more.

### §23.7.8 audit sweep — find all callers of cache-clear primitives [P1, sequenced after PM-97 fix]

**Status:** OPEN P1. New section §23.7.8 codifies the rule that any cache reset must force a full Dexie rehydrate before next paint. Audit signal: any call to `VYVELocalDB.<table>.clear()`, `localStorage.removeItem('vyve_home_v3_*')`, `_sync_meta.set(table, 0)`, or equivalent. Most likely live in settings.html (PM-97 recovery), possibly admin command centre dev tools, possibly old onboarding/persona-switch paths. Each caller must either route through a single guarded "reset-and-rehydrate" helper, or implement the §23.7.8 contract inline. Sweep when next on the affected files.

### §23.8 field-test confirmation logged [audit pending, no new work]

PM-100's `vyveHabitsMidnightWatch()` confirmed fired correctly on Dean's iPhone at 00:01 BST 14 May 2026. Bug §23.7.7 documented manifested exactly as described — app backgrounded across midnight rollover, habits.html still painted Wednesday's logsToday as Thursday's "11 of 11 done today" until visibilitychange/focus triggered re-evaluation. Home page correctly empty pill (different `todayStr` capture point). Rule §23.8 (timezone-correctness audit) stays P1 sequenced before international launch — no change to priority, just confirmed non-theoretical.

### Test account provisioning (handed off to parallel chat)

test@test.com password 1234 and test1@test.com password 1234. Provisioning shape: members row cloned from Dean's account profile (SPARK persona, baseline scores, 35 male, dark theme, kg/cm, individual company), 11 active member_habits matching Dean's habit set, 1 workout_plan_cache row with cloned 8-week PPL programme_json. test@test.com may have some pre-existing state (5 habits, no plan, no daily_habits — needs topping up). test1@test.com needs full creation from auth.users up. Both accounts will replace Dean's account as the primary test surfaces from next session forward.

---

## Added 14 May 2026 PM-100 (§23.8 timezone audit pending — codebase is BST-locked)

### §23.8 timezone-correctness audit sweep [P1, sequenced before international launch]

The codebase is BST-locked. `bstToday()` in 8 files (`habits.html`, `cardio.html`, `wellbeing-checkin.html`, `monthly-checkin.html`, `movement.html`, `home-state-local.js`, `workouts-session.js`, plus copies in `nutrition-setup.html` and `healthbridge.js`) hard-codes a UK +60min DST offset and returns today as a UTC-derived date with the offset bolted on. That gives the wrong date for any member outside UK and for UK members travelling. Separately, 20+ files use `toLocaleDateString('en-GB', ...)` which is device-local in clock but always renders UK format regardless of member preference — cosmetic inconsistency.

Surfaced by Dean 14 May after the PM-100 ship. Carrying as backlog item not §23 hard rule yet because the audit + fix isn't done; §23.8 is logged as a known-gotcha in master.md to prevent further BST-locked code from being shipped while this sits unresolved.

**Scope of the audit:**
- Replace `bstToday()` with a shared `deviceLocalToday()` helper that returns the member's wall-clock date. Place in `vyve-time.js` (new) or fold into an existing shared module.
- Audit every call site across 8 files. Most are in cache keys, `activity_date` payloads, the PM-100 visibility/midnight rollover handlers, and similar.
- Verify NO Edge Function applies BST-specific date math to `activity_date` server-side. Expected count: zero — the column is opaque `date`. If any exist, decide per-EF whether to keep server-side or remove.
- Optional: replace `toLocaleDateString('en-GB', ...)` with locale-respectful formatting where member-facing copy is visible. Lower priority.
- Optional: stamp `Intl.DateTimeFormat().resolvedOptions().timeZone` onto the members row at login for analytics and future cron-reminder personalisation.

**Why it matters:**
- B2C members via Stripe can be anywhere in the world. Even pre-launch trial members could be travelling.
- An Australian member at 10am AEST gets a "today" that's behind their wall clock — they log a habit on Wednesday morning Sydney time and it lands as Tuesday in the database.
- UK members on holiday get the wrong "today" for the duration of the trip.
- Sage enterprise is UK so this isn't blocking the first enterprise deal, but it's an international-launch blocker.

**Audit signal at start of work:** `ripgrep "bstToday|isDST|toLocaleDateString\('en-GB'"` across vyve-site shows the current footprint. Re-run to confirm scope hasn't grown.

**Estimated length:** Half-day Claude session. 8 files for the correctness fix; the cosmetic locale clean-up adds maybe another session if shipped together. SW cache key bump on every touched HTML.

**Risk if not shipped before international launch:** every non-UK member sees wrong "today" on habits/cardio/wellbeing/monthly check-in pages, with all the downstream cascades — wrong streak math, wrong cache invalidation, wrong activity_date stamping, wrong "11/11 done today" pattern Dean caught in PM-100 but for every non-UK member every day.

## Added 14 May 2026 PM-100 (Habits cache-first first paint covers header; midnight rollover handler; §23.7.7 codified)

### PM-100 — CLOSED [shipped 14 May 2026, vyve-site `997c8621`]

Two issues surfaced on the iPhone walk immediately after PM-98 shipped: DAY STREAK / TOTAL LOGGED header sat on em-dash placeholders until the awaited network/Dexie chain completed (cache-first paint covered the list but not the header); BST midnight rollover left yesterday's `logsToday` rendering as today's "Done" state because `todayStr` was captured once at page load with no resume handler.

Fix: all 5 cache writes stamp `todayStr`; canonical write stamps `activeDates: allDates`; both cache-first paint paths date-guard `logsToday` and paint header counters from cached activeDates synchronously; new `visibilitychange`/`focus` handler re-runs `loadHabitsPage` on date change. sw.js cache key bumped to `pm100-ship-a`. §23.7.7 codified in master.md.

### §23.7.7 audit sweep — other cache-first surfaces [P1, sequenced after PM-99]

§23.7.7 has two rules; both need an audit pass across every member-data page that paints from cache or captures a date variable at load.

**Rule 1 (cache-first paint covers all counters):** for every cache-first paint site, enumerate every DOM element the page renders on first paint and verify the cache includes the data needed to populate it.

Surfaces to audit:
- `workouts.html` — programme progress %, week badge, today's session card
- `nutrition.html` — TDEE values, macro rings, water tracker, weight chart 7d/30d/90d
- `cardio.html` — week count, target, history rows (counter populates from `vyve_cardio_cache` but audit completeness)
- `engagement.html` — score ring component values, activity breakdown table
- `index.html` — already largely covered by `vyve-home-state.js` but verify the "Up Next Sessions" and live session badges

**Rule 2 (date-rollover self-correction):** every page that captures `todayStr` (or equivalent date variable) at page load MUST have a `visibilitychange` + `focus` handler that re-evaluates and refreshes today-specific state.

Surfaces to audit:
- `index.html` (home) — `vyve-home-state.js` capture point
- `workouts.html` — today's session selection
- `nutrition.html` — today's macro totals, today's water entries, today's food log
- `cardio.html` — today's row in history
- `wellbeing-checkin.html` — today's check-in slot
- `monthly-checkin.html` — **this month's slot — same problem at month boundaries**, not just daily

Each surface gets the §23.7.7 template applied (or documents a deliberate carve-out in the commit).

**Estimated length:** Audit and patch 1-2 surfaces per session. Six rule-1 surfaces + six rule-2 surfaces = ~3-4 sessions. Some surfaces (cardio, workouts) will land both rules in the same commit.

### Android auth-init failure under offline + cold install [P1, carry forward from PM-100]

Dean's mam's Android phone showed "Preview mode: Auth failed to initialise" banner + "You're offline" + permanent loading state on first launch with no wifi. Root cause: `vyveInitAuth` in auth.js calls `vyveLoadSupabaseSDK()` at line 800 BEFORE the `if (!navigator.onLine)` check at line 855. SDK fetch from CDN fails on no-network cold-install, throws, hits catch block at line 907 which reveals the app with dev copy `"Preview mode: Auth failed to initialise."` — copy that should never reach a member.

**Two fixes needed (separable, ship together):**
1. **Re-order:** move the offline check ABOVE `vyveLoadSupabaseSDK()`. If `!navigator.onLine` AND no cached session in localStorage, redirect to login (which itself needs an offline screen — "Connect to wifi to sign in" rather than its own broken state). If `!navigator.onLine` AND cached session present, fast-path the cached session and skip SDK load entirely until back online.
2. **Replace dev copy:** the catch block at line 909 should show a real member-facing error state, not "Preview mode: Auth failed to initialise." — "Couldn't load. Check connection and try again." with a reload button.

Capacitor build implications: the iOS Capacitor build will hit this same path if offline at first launch with no cached session. Mac required to rebuild Capacitor for iOS; web/PWA fix ships directly. Android Play review status separate.

**Estimated length:** ~1-2 hours Claude-assisted. Single auth.js patch, plus a small login.html offline state.

## Added 13 May 2026 PM-98 (Habits write critical-path rewritten; §23.7.6 codified; backend EF latency re-scoped to PM-99)

### PM-98 — CLOSED [shipped 13 May 2026, vyve-site `47630db8`]

Habits page write critical-path rewrite shipped. `logHabit`, `undoHabit`, and the `habit:logged` subscriber rewritten so user-perceived UI state mutation is fully synchronous inside the event handler, before any bus publish or network write. iOS Safari and iOS Capacitor flip latency: 15+ seconds → <100ms expected. §23.7.6 hard rule codified in master.md. Bus role redefined as fan-out only on active surfaces (still required for cross-surface side effects and cross-device Realtime). Diagnostic instrumentation from PM-98-diag-f removed. sw.js cache key bumped to `pm98-ship-g`.

The PM-98 scope inherited from PM-97 (backend EF latency campaign) was redirected at the start of this session — that work is now PM-99 unchanged. See below.

### §23.7.6 audit sweep — other write surfaces [P1, sequenced after PM-99]

§23.7.6 was codified during the habits.html rewrite. The same critical-path pattern needs to be applied to (or verified safe on) every other write surface. Audit signal: ripgrep `VYVEBus\.subscribe\(['"]<event>['"]` and check whether the subscriber calls a `render<X>` function when `<event>` is also published from the same page. If yes, that subscriber needs the `alreadyCorrect` defensive check and the active surface needs the synchronous critical-path order.

Surfaces to audit:
- `cardio.html` — `logCardio` handler and any `cardio:logged` subscriber
- `workouts.html` — session save flow, exercise log writes
- `wellbeing-checkin.html` — submit handler
- `monthly-checkin.html` — submit handler
- `nutrition.html` — `logWeight` and `logWater` handlers
- `log-food.html` — food log entry handlers

Each surface gets the §23.7.6 critical-path order: synchronous in-memory state mutation → synchronous render → toast → Dexie fire-and-forget → cache persist → bus publish → writeQueued not awaited. The active-surface subscriber gets the `alreadyCorrect` defensive check. Failure subscribers stay unconditional.

If any surface uses a Promise-flow or imperative rendering pattern that's already synchronous in spirit, document that and skip. The audit needs to be evidence-based per surface, not blanket-rewrites.

**Estimated length:** One session per 2-3 surfaces depending on complexity. Cardio and nutrition are simplest (single-row writes); workouts is the heaviest (multi-exercise sessions).

### §23.7.6 bus subscriber audit across the wider codebase [P2]

Beyond writer pages, audit any place a page subscribes to its own publish to drive re-renders: bus.js, vyve-home-state.js helpers, vyve-achievements.js evaluator. The `alreadyCorrect` defensive pattern may or may not apply — the goal is to ensure NO subscriber blocks first paint of an active-surface change. Lower priority because none of these surfaces are tap-driven in the same way habits.html was.

## Added 13 May 2026 PM-97 (PF-15 P0 partial-upsert landmine sealed; backend EF latency surfaced — see PM-99)

### PM-99 — Backend Edge Function latency campaign [P0]

**§23.5.1 logged 12 May 2026. Three weeks old. Never worked on. PM-97 confirmed it is the dominant cause of every "data pulls slow" symptom in Dean's live experience. Re-scoped from PM-98 to PM-99 at end of PM-98 (13 May) — PM-98 had been redirected to the iOS critical-path rewrite once Dean identified that as a separable problem. Carry forward.**

**Symptoms surfaced in PM-97:**
- Habits page header "Day Streak" and "Total Logged" show ━ placeholder loaders that never resolve. Page IS Dexie-wired but the dashboard refresh hits slow EFs and never returns.
- Tapping "Yes" on a habit: button does not change for 20+ seconds. SQL confirms writes ARE landing on server within 1-7s gaps; the bottleneck is the response not making it back to the client in usable time. Compounded by habits.html line 27719 awaiting `VYVEData.writeQueued()` before flipping optimisticPatch.
- Every Dexie-wired page has fast initial paint from local but slow background refresh — the refresh is invisible work as long as Dexie has good data, but ANY page where the user lingers eventually shows the lag.

**Recap of §23.5.1 findings as of 12 May 2026:**
- Logs at ~21:30-22:30 UTC 12 May: member-dashboard execution_time_ms 38585/37640/36147/22708/22642/22546/17984/17966/17211 ms. Notifications 24504/12037/5601 ms. monthly-checkin POST 18565 ms. wellbeing-checkin POST 12939 ms. log-activity POSTs 8961/10973/7886 ms.
- **All non-cron client-facing EFs are slow, not just member-dashboard.**
- PM-13 parallelised the 23 inline achievement evaluators in `_shared/achievements.ts`. PM-17 cut 4 of 5 this-week queries by reading from `member_home_state`. Both live. Bottleneck is deeper.
- `warm-ping` EF deployed and running (3 calls 12 May logs: 2949/1993/411 ms). Does NOT prevent observed cold-start latency.

**Likely causes to investigate in order:**
1. **Supabase Pro EF cold-start behaviour.** Deno isolate spin-up overhead can dominate sub-millisecond inner work. May need warming strategy beyond `warm-ping` (currently every ~5 min via cron? Verify) or migration to Pro+ tier with longer warm pool.
2. **RLS policy evaluation overhead.** §23 has a rule about `(SELECT auth.email())` wrapping — verify EVERY RLS policy still uses this pattern. A single un-wrapped policy can cause 300-2000ms per-row re-evaluation.
3. **Trigger cascade.** daily_habits has 8 triggers on INSERT (auto_time_fields, charity_count, counter, enforce_cap, zz_lc_email, zz_sync_activity_log, zzz_mark_home_state_dirty_ins, plus realtime publication). EXPLAIN ANALYZE on a representative INSERT will surface which trigger is the time sink. Same audit on other slow EFs.
4. **`member_home_state` denormalisation table behaviour.** PM-17 read pattern. Are recomputes O(n²) somewhere? Stale-while-revalidate semantics on the dirty flag?
5. **PostgREST timeout / connection pool.** Check pgbouncer config + statement_timeout. A connection-exhaustion scenario presents as random slow requests, not consistent slow ones — partially fits the pattern.

**Approach for PM-98:**
1. Pull last 24h of EF logs via `Supabase:get_logs` or live SQL against analytics table. Confirm current latency distribution.
2. Pick the slowest EF (probably member-dashboard). EXPLAIN ANALYZE its key queries against representative data.
3. Audit RLS policies for missed `(SELECT auth.email())` wrapping.
4. Audit triggers on `daily_habits`, `cardio`, `wellbeing_checkins`, `monthly_checkins`, `members` — measure each via per-trigger benchmarks if possible.
5. Decide cold-start vs trigger cost vs RLS as primary cause. Fix that one. Re-measure.
6. Only after backend is fast: consider client-side optimistic-patch refactor (PF-15.write-optimistic) — masking a slow backend with optimistic UI is worse than fixing the backend.

**Estimated length:** Half-day Claude minimum. Real-world calendar: full session, possibly two depending on what cause is.

### PF-15.write-optimistic [P1, sequenced after PM-98]

`habits.html` line 27719 (and presumably same pattern in cardio.html, wellbeing-checkin.html, monthly-checkin.html): `await VYVEData.writeQueued(...)` blocks UI re-render until network round-trip resolves. Architecture intent in the code comments is optimistic UI; implementation isn't.

**Fix shape (deferred until backend is fast — otherwise it just masks the real bottleneck):**
1. Move `VYVELocalDB.daily_habits.upsert(...)` to BEFORE the writeQueued call. Dexie write is synchronous-feeling and provides the local truth.
2. Move `VYVEHomeState.optimisticPatch(...)` + `VYVEBus.recordWrite(...)` + `VYVEBus.recordCanonical(...)` + `VYVEBus.publish('habit:logged', ...)` to BEFORE writeQueued.
3. Remove the `await` from `_habitWriteResult = await VYVEData.writeQueued(...)`. Use `.then(result => { ... 4xx-dead handling ... })` and `.catch(...)` instead.
4. UI button state flips immediately based on Dexie write success, not server write success.
5. Existing `habit:failed` revert path handles 4xx eagerly via the bus subscriber. 5xx queues for retry, eventual death flows through `vyve-outbox-dead` event.

Risk: re-tapping the same habit before the network write resolves needs to be handled. Either disable the button until writeQueued resolves (button state separate from "done" rendering), or rely on the existing on_conflict merge-duplicates Prefer header (already in place).

**Audit candidates (same pattern):** cardio.html @ ~40678, wellbeing-checkin.html @ ~41459, monthly-checkin.html (line TBD), any future activity-log page.

**Estimated length:** ~2 hours Claude. Do NOT ship before PM-98 — optimistic UI on a slow backend hides the bug from the user but doesn't fix it.

### PM-97 commits shipped

- `ddc13271` — db.js merge overrides on member_habits + members + settings.html long-press-footer recovery gesture + sw.js cache key bump to pm97-pf15-merge-upsert-a.

Brain commit: this commit you're reading.

## Added 13 May 2026 PM-96 (PF-15 part 1+2 — diagnostic-led Exercise hub fix; remaining unwired pages logged)

### PF-15.x remaining unwired pages [P1] (per-page audit needed first)

Audit run in PM-96 across every root-level .html and the page-shipped .js modules. Pages with 0 `VYVELocalDB` references that paint member data and therefore can't paint Dexie:

| Page | Member data painted | Current data path | Notes |
|---|---|---|---|
| `movement.html` | Recent movement sessions, walks | 5 direct REST calls | Empty-state page tonight (no movement activity logged), low-stakes for trial. Wire alongside cardio pattern. ~30 min. |
| `sessions.html` | Live session catalogue + member's recent watches | None visible in source (1 EF call: none); pulls from service_catalogue | Audit needed: does the page paint from `replay_views` / `session_views` (member-scoped) or just from `service_catalogue` (catalogue)? If member-scoped, wire to Dexie. ~30 min. |
| `leaderboard.html` | Member's rank position | 1 EF call | Probably legitimately REST-pass-through (aggregate compute is server-side). Confirm + document carve-out, don't force-wire. ~15 min audit. |
| `running-plan.html` | Member's active running plan | 2 EF calls | Probably needs Dexie wiring to `running_plan_cache`. ~30 min. |
| `certificates.html` | Member's earned certs | 2 EF calls | Needs Dexie wiring to `certificates`. ~30 min. |
| `engagement.html` | Member's engagement metrics | 3 EF calls | Audit: is this an aggregate compute (legit REST) or member-row read (needs Dexie)? ~15 min audit. |

**Sequencing.** Bundle into a single PF-15 sweep session (~3-4 hours). Per-page commit pattern matches PM-96 part 2 (`433d0650`) — hydrate-await + Dexie-first + REST fallback, plus sw.js cache key bump. The §23 hard rule codified in PM-96 makes the pattern repeatable: any future page that paints member data must follow this template or document a deliberate REST carve-out in the commit.

### PF-15.y — hydrate() should surface per-table failure publicly [P1]

`sync.js` `hydrate()` collects per-table pass/fail in module-private `failedTables{}` but resolves `true` regardless of partial failure. Callers can't tell from the resolved promise whether their target table actually populated. Two options:

1. **Public getter** — expose `VYVESync.getHydrateStatus()` returning `{hydratedTables, failedTables, lastHydrateMs}`. Cheap. Lets pages defensively check before reading and trigger a per-table `hydrateTable()` retry on failure.
2. **Resolve to summary object** — change return type from `Promise<boolean>` to `Promise<{ok, failed, ms, failedTables}>`. Breaking change but cleaner. Defer until PF-15 sweep when we're touching every page anyway.

Option 2 preferred when we're touching every Dexie page during the sweep. Combine into single commit.

### PF-15.z — first-paint-after-SW-bump amber flicker mitigation [P2]

PM-96 confirmed that the first paint after a sw.js cache key bump can flicker amber while the new worker is installing + activating + claiming clients. Not a real regression. Two possible mitigations:

1. **Indicator gating** — suppress amber state changes for the first 1500ms after a `controllerchange` event on `navigator.serviceWorker`. Catches the activation window.
2. **Just document it** — add a §23 hard rule that "first reload after SW bump may flicker amber; reload twice before concluding the underlying code is broken". Lower-effort, no code change.

Recommend option 2 for now. Revisit if amber flicker proves to be a recurring distraction during PF-15 sweep.

### PM-96 commits shipped

- `4ffe3d72` — PM-96 PF-15 P0-1 diagnostic (dexie-source-indicator.js + sw.js cache key bump)
- `433d0650` — PM-96 PF-15 part 2 (exercise.html Dexie wiring + sw.js cache key bump)

Brain commit: this commit you're reading.

## Added 13 May 2026 PM-95 (PF-14 device verification findings)

### PF-14b — Bundled-mode migration + live-updates service [P0 LAUNCH BLOCKER]

**Why launch blocker.** Tonight's PF-14 walk confirmed Dean's `~/Projects/vyve-capacitor/capacitor.config.json` is `{"appId":"co.uk.vyvehealth.app","appName":"VYVE Health","webDir":"www","server":{"url":"https://online.vyvehealth.co.uk","cleartext":false}}` — i.e. remote-origin Capacitor wrap. Per PM-77.1 §3.1B, Apple's ITP 7-day script-writable-storage purge applies to remote-origin WKWebView content. Pre-Dexie this didn't matter (we stored ~50KB localStorage that we didn't depend on for paint). Post-Dexie this directly breaks the Premium Feel campaign's "instant always" promise: a member who hasn't opened VYVE for 7 days returns to a 5-30s "preparing your VYVE" rehydrate screen, defeating the entire reason for the campaign.

**Scope.**
1. Edit `~/Projects/vyve-capacitor/capacitor.config.json`: remove `server.url`, add explicit `server.iosScheme: "capacitor"` and `server.hostname: "localhost"` per Capacitor 7+ pattern (locks scheme to prevent Capacitor major-version migration wipes).
2. Decide and integrate live-updates service. **Recommended: Capawesome Cloud (£~£7-9/mo starter tier, fixed-price transparent pricing, founded by Ionic Developer Experts).** Alternative: Capgo (£~£10-12/mo, more established with 3,500+ companies, open-source self-hostable). Cost-trivial against any spend tier; main decision factors are operational reliability and SDK quality. Both swap-compatible if we ever want to migrate later.
3. Add Capacitor SDK to the wrap, configure update channel, point it at our build pipeline.
4. Local-bundle workflow: `npx cap copy ios` after every vyve-site main push to refresh `www/`, then re-build IPA.
5. Submit iOS 1.2 + Android 1.0.3 to App Store / Play Store. ETA Apple 24-72h, Google 4-24h.
6. Codify in active.md §3.1B that future bundled-mode migrations (e.g. Capacitor 8 upgrade) require an explicit scheme-migration plan to avoid wiping member Dexie stores.

**Estimated length.** ~2-3h Claude (config + scheme lock + SDK integration + brain update). Dean: Xcode rebuild + IPA archive + App Store Connect submission (~30-60 min if pipeline already works). + Apple review wait.

**Sequencing.** This weekend session. Earliest submit: Sun/Mon 17-18 May. Review through ~20 May. Polish + remaining PF tasks 21-30 May. Launch 31 May.

**Status.** QUEUED — sequenced for Sunday 17 May session.

### PF-15 expanded scope from PM-95 device walk

In addition to original PF-15 hardening (PM-77.1 mitigations A/B/C codification, force-resync escape hatch, queue drain batching, storage quota handling), tonight added:

**[P0-1] Dexie hydration coverage gap.** ~~Five page surfaces showed `Paint: supabase` on Dean's iPhone despite spike flag on: Cardio, Workouts session (exercise_logs), Wellbeing Check-in, Monthly Check-in, Settings (probably members table).~~ **RESOLVED — PM-96, 13 May 2026.** Root cause was NOT hydrate coverage. Diagnosis was performed via the PM-96 diagnostic ship (`4ffe3d72` — appended event-listener + `_sync_meta`/Dexie-row-count snapshot to `dexie-source-indicator.js`, fires PostHog `pf14_hydrate_diagnostic` event per page). Dean's post-diagnostic walk showed six of seven surfaces GREEN — PF-14 part 6 hydrate-await patch (`67711c4e`) DID work for cardio/wellbeing-checkin/monthly-checkin/settings. The remaining amber surface was Exercise hub (`exercise.html`), which had ZERO `VYVELocalDB` references — never wired to Dexie. Fixed in `433d0650` (`fetchPlan()` rewritten as hydrate-await → Dexie-first → REST fallback). The original five-surface assumption from PM-95 was wrong; the gap was on a different page. Habits + Nutrition "regression" was a transient SW cache-bump activation artifact, not a real regression. **NEW PF-15 sweep items spawned** — see "PF-15.x remaining unwired pages" entry below.

**[P0-2] PF-12 partial-upsert merge.** Three call sites in settings.html write `VYVELocalDB.member_habits.upsert({member_email, habit_id, active})` without denormalised cols. Will paint 'undefined' on habits.html for any member who deactivates/adds habits in settings (Dean didn't trigger tonight). Fix: change `member_habits.upsert` override in db.js to merge with existing row rather than overwrite — `db.member_habits.get(key).then(row => db.member_habits.put({...row, ...partial}))`. Same audit needed across other tables with denormalised cols.

**[P0-3] localStorage shape-cache audit + version-bump.** Tonight's habits cache fix (v2 → v3) revealed a class of bug: long-lived localStorage caches that survive payload-shape changes paint-poison the page. Pages with similar caches to audit/fix: index.html (`vyve_home_v3_<email>`), workouts.html (`vyve_programme_cache_<email>`), nutrition.html (`vyve_wt_cache_<email>`), log-food.html (`vyve_food_diary_<email>:<date>`). For each: confirm current shape matches cached shape OR bump version suffix preemptively before any future shape change.

**[P1] PF-13 hydration overlay didn't render on Dean's spike-toggle reload.** Investigation needed: either overlay-render conditions stricter than documented, hydrate completes before overlay can mount, or spike-toggle reload path skips the overlay code. Likely a separate session item.

**[P1] Monthly Check-in name token race.** First paint of monthly-checkin.html shows "How's your month been, there?" (placeholder substitution failure). Reload fixes it. Members row hydrate timing issue. Adjust template to wait for members row before render OR use a sensible fallback name.

**[P2] Log Food cold-paint visual stacking.** Header line overlaps Calories card for ~1s on cold paint. Cosmetic only; fold into PF-25 typography pass or PF-19 cleanup.

**[P2] Cardio "4/3 this week" target overflow rendering.** No bug — exists for documentation. Copy "Target hit — nice work. Bonus sessions welcome." handles the >100% case cleanly. Worth keeping consistent across all weekly-target surfaces during messaging review.

### §23 hard-rule candidates surfaced tonight (codify in PF-15 ship or next master.md update)

- **localStorage shape-caches MUST include a version suffix that bumps with every payload shape change.** Habits cache was 'v2' from 2025 to 2026 across multiple PostgREST shape iterations. Any unmigrated cache surface is a paint-poison vector.
- **VYVELocalDB.{table}.upsert call sites that lack denormalised columns MUST do a merge, not overwrite.** Either the table override merges by default (preferred), or every call site does read-modify-write. Partial-upsert surfaces only on the next read — invisible during testing.
- **Capacitor wrap `server.url` in `capacitor.config.json` indicates remote-origin and subjects the app to Apple ITP 7-day storage purge.** Was known/documented in active.md §3.1B; tonight's confirmation locks it as a launch-blocker for any local-first data architecture. Document at codify-time of PF-14b.

---

## Added 13 May 2026 PM-94 (Trial-phase placeholders consciously deferred — hydration copy + Achievements overhaul)

Dean's decision 13 May 2026 evening session: both items below are knowingly-placeholder for the 15-20 person soft-launch trial. Goal is not to block the rest of the pre-launch work polishing them. Real overhaul happens after trial data lands. Memory entry #17 captures the operating mode.

- 📌 **TRIAL PLACEHOLDER — PF-13 hydration.js COPY_TABLE finalisation.** 11 distinct persona welcome lines + 2 fallbacks tagged `// COPY: DEAN TO FINALISE` in `/hydration.js` (commit `11abad83`). Current drafts are member-displayable real sentences (no `TODO:` strings) so trial-safe. Dean owns finalisation. Lewis spot-check on tone (light, not gating). ~30-45 min writing time when bandwidth allows. Search tag: `COPY_DEAN_FINAL`. Post-trial overhaul: rewrite with confidence informed by trial-member persona feedback.

- 📌 **TRIAL PLACEHOLDER — Achievements system overhaul (post-trial).** Current state: 32 metrics, 327 approved tiers, inline evaluator wired across all trigger pages, evaluator firing correctly for real member actions. Dean's framing: "the achievements at the moment is in, but it's just a placeholder. It needs a massive overhaul, and it needs a huge improvement." Trial-safe to ship as-is. Post-trial overhaul scope TBD pending what 15-20 trial members actually engage with — tier thresholds, metric mix, copy on tier titles, visual presentation, celebration moments on unlock, surfacing in nav. Coordinate with Lewis on member-facing copy approval gate (`copy_status='approved'` pattern). Likely a 2-3 session post-trial campaign in its own right.

### Carry-forward from prior sessions (still load-bearing)

- HAVEN clinical sign-off — Phil. Pre-launch blocker.
- Weekly check-in nudge copy — Phil + Lewis. Pre-launch blocker.
- Brevo logo removal — Lewis, ~$12/month. Pre-launch blocker.
- Facebook Make connection refresh — Lewis, expires 22 May 2026.
- Public launch comms draft — Lewis.
- B2B volume tier definition — Lewis + Dean.
- vyve-capacitor git repo setup — backlog risk.

---

## Added 13 May 2026 PM-77 (Premium Feel Campaign launched; Layer 5/6 work closed/superseded; PM-67/71/72/73 deferred during campaign)

- ✅ **CLOSED — PM-67e** (perf.js rebuild). Shipped via PM-75 + PM-76 yesterday. Layer 5 telemetry capture is live across 20 portal pages.

- ✅ **CLOSED — PM-75 + PM-76.** Telemetry rebuild + production promotion. Closed yesterday.

- 🛑 **SUPERSEDED — Layer 6 (SPA shell).** Dropped permanently. Local-first migration (this campaign) delivers the same perceived-speed gains without the rewrite cost. The Layer 5 data window that was originally going to gate this decision is no longer load-bearing — we have a better architectural answer.

- ⏸ **DEFERRED DURING CAMPAIGN — PM-71** (dashboard payload pre-fetch). Becomes mostly obsolete after local-first migration because the dashboard EF gets called rarely post-migration. Not deleted from the backlog, just not worked on until campaign closes.

- ⏸ **DEFERRED DURING CAMPAIGN — PM-71b** (dashboard payload trim, gated on PM-73). Same reasoning — obsolete after migration.

- ⏸ **DEFERRED DURING CAMPAIGN — PM-72** (materialise achievement_progress). Same — obsolete after migration.

- ⏸ **DEFERRED DURING CAMPAIGN — PM-73** (home redesign). Decoupled from the campaign — revisit post-launch when we have data on what the simplified home payload should look like. The v2 mockup at `playbooks/home-redesign-v2-mockup.html` stays parked.

- ⏸ **DEFERRED DURING CAMPAIGN — backend EF perf work** (warm-keeping cron, additional denormalisation). All becomes mostly obsolete after migration.

- 🟢 **ACTIVE — Premium Feel Campaign.** See `playbooks/premium-feel-campaign.md` for the full task backlog (PF-1 through PF-20). Sessions during the campaign load active.md + the campaign playbook + last 3 changelog entries. They do NOT load the full master/changelog/backlog.

- 🟢 **ACTIVE — PF-1 is the next task.** Dexie spike on daily_habits end-to-end. Feature branch `local-first-spike` off main. Estimated one 3-6 hour evening session. Dean to verify the flow visually at session end.

### Carry-forward from prior sessions (still load-bearing)

- HAVEN clinical sign-off — Phil. Pre-launch blocker.
- Weekly check-in nudge copy — Phil + Lewis. Pre-launch blocker.
- Brevo logo removal — Lewis, ~$12/month. Pre-launch blocker.
- Facebook Make connection refresh — Lewis, expires 22 May 2026.
- Public launch comms draft — Lewis.
- B2B volume tier definition — Lewis + Dean.
- iPhone Capacitor on-device verification of perf-v2 — Dean to verify when convenient. PF-14 covers this as part of the campaign now.
- Two-device manual verify across PM-58 → PM-66 — formally closed. Multi-device support is now "supported but not optimised" per campaign operating mode (single-device-per-user is the working assumption).

---

## Added 12 May 2026 PM-75 + PM-76 (Layer 5 baseline-capture unblocked and live)

- ✅ **CLOSED — PM-67e (perf.js rebuild).** Carried forward from yesterday's brain commit as UNBLOCKED, now fully shipped via PM-75 + PM-76.

- ✅ **CLOSED — PM-75.** perf-v2.js + perf-test.html soak harness + sw.js cache bump (`pm75-perf-rebuild-a`). Soaked 10+ min in Chrome on Mac. Two flushes posted 204; perf_active sentinel + ttfb/fcp/lcp/fp/inp/auth_rdy/paint_done all captured. vyve-site commit `5cef00a2`.

- ✅ **CLOSED — PM-76.** Promotion ship — `/perf.js` overwritten with v2 source, sw.js bumped `pm76-perf-promote-a`. `/perf-v2.js` and `/perf-test.html` kept in place as soak references. vyve-site commit `ff3e0e0f`. All 20 PM-56-wired portal pages now load v2 on next nav.

- 📊 **DATA WATCH (next 24-48 hours):** monitor `perf_telemetry` for v2-fleet rows. Expected per page: `perf_active=1` on every flush; `cache_first=1` on iOS Safari/Capacitor cache-first navs; non-empty `ttfb` on every flush via either nav-timing or performance.now() fallback. If `vyve_perf_lastdrop` reasons cluster anywhere unexpected, audit and fix. Query template:
```sql
SELECT page, metric_name, COUNT(*), 
       percentile_cont(0.5) WITHIN GROUP (ORDER BY metric_value) p50,
       percentile_cont(0.95) WITHIN GROUP (ORDER BY metric_value) p95
FROM perf_telemetry WHERE ts > now() - interval '24 hours'
GROUP BY page, metric_name ORDER BY page, metric_name;
```

- 🔓 **UNBLOCKED — Layer 5 baseline + SPA-shell decision.** With v2 in production, the data gap that's been blocking the SPA-shell question since PM-56 closes after ~1 week of v2-fleet samples. Decision criteria (per active.md): if p50 TTFP / FCP / LCP across the 20 pages comes in under 200ms warm-cache and under 600ms cold-cache, SPA shell is not worth the rewrite cost. Otherwise revisit.

- 🔓 **UNBLOCKED — PM-71b decision.** PM-73 re-scope flag of PM-71 ("delete fields from home payload" vs "denormalise more fields into member_home_state") becomes a data-driven call once we see v2 ttfb / dom_done numbers from index.html across a real member spread.

### Carry-forward from this session

- Member-dashboard EF cold-start latency observed at 17s on Dean's first soak fetch. Steady-state ~7.6s on second fetch. PM-68 working as expected; cold-start is the container warm-up. Tracked under PM-71/72/73 — no new ticket.
- iPhone Safari + Capacitor verification of perf-v2 on cache-first navs — Dean to verify when convenient. Not a blocker; if cache_first rows fail to appear from those devices after 24h of production rollout, investigate.
- Brain note: PM-67e learnings from yesterday's brain commit (don't reattempt the eager getSession path) remain valid as a "things tried, things that don't work" history record. v2 reads from `localStorage.vyve_auth` exclusively per §23 PM-3 and stays clean.
- Two-device manual verify across PM-58 → PM-66 — still carried forward, still no Android device.

---

## Added 12 May 2026 PM-74 (auth-loop closure shipped; perf.js rebuild now unblocked)

- ✅ **CLOSED — PM-74.** auth.js L803 predicate tightened (`SIGNED_OUT || !session` → `SIGNED_OUT` only). 9 portal 401-redirect sites patched to signOut-before-redirect. sw.js cache key `pm74-auth-loop-fix-a`. vyve-site commit `fc8232bb`. All files md5_match=True post-commit. New §23.5.3 hard rule codified.

- 🔓 **UNBLOCKED — PM-67e (perf.js rebuild).** Layer 5 baseline capture still needs the `record('perf_active', 1)` sentinel + `performance.now()` fallback for SW cache-first navs. Last night's three approaches failed for separate reasons: the legacy `sb-<ref>-auth-token` regex never matches (auth.js uses `storageKey:'vyve_auth'`, per §23 PM-3); the eager `getSession()` triggered Supabase's silent token refresh which fired `TOKEN_REFRESHED` with null session which (pre-PM-74) tripped the auth-loop redirect; the hardcoded email allowlist worked for opt-in but didn't avoid the getSession trap. **Next-session shape:** read JWT directly from `localStorage.vyve_auth`, parse, pull `access_token`, check `expires_at * 1000 < Date.now()` and drop if expired. Never call `getSession()` at all. A 401 from log-perf is benign — script just drops, no retry, no surface. Ship to a new `perf-test.html` route first (loads supabase.min.js + auth.js + perf.js + member-dashboard fetch; nothing else), soak 10+ minutes across hard reload + SW cache nav + foreground/background + near-expiry JWT, then promote to the 20 PM-56-wired pages with a second SW bump (`pm75-perf-stable-a` or similar). With PM-74 landed, the redirect-loop trap is gone even if a future code path does trigger a refresh — perf.js rebuild lands on a safe foundation.

- 🔄 **PM-67e-fix-1 + fix-2 LEARNINGS captured** (do not reattempt): the eager getSession was the trigger but not the root cause; the root cause was the auth.js predicate (now fixed in PM-74). The `vyve_auth` localStorage parse from fix-1 is still the correct JWT read path — the brain already documented this at §23 PM-3 line 1734, and PM-74's signOut-before-redirect uses the same source of truth. The Capacitor WKWebView email allowlist from fix-2 is still the correct workaround for the storage-isolated `?perf=1` opt-in problem — keep this pattern in mind for the rebuild but only if needed (if Dean keeps `localStorage.vyve_perf_enabled='1'` set across rebuilds, no allowlist is needed for him personally).

### Carry-forward from this session

- PM-67e perf.js rebuild — unblocked, next session.
- PM-71 (dashboard-only field pre-fetch) — still queued, see PM-73 re-scope flag.
- PM-72 (materialise member_achievement_progress) — still queued, ownership shifts to /stats if PM-71b ships.
- Layer 5 baseline capture — gated on PM-67e ship.
- Two-device manual verify across PM-58 → PM-66 — carried forward (no Android device available).

---

## Added 12 May 2026 PM-73 (home redesign mockup parked; PM-71 re-scope flagged; daily goals canonical shape captured)

- 🅿️ **PARKED — PM-73.** Home page redesign mockup v2 complete; Dean "kind of likes this" but not committing to build now. Reasons: (a) Mind/Body/Connect bottom-nav re-architecture lands end of month per Dean; home redesign hooks into nav; sequence both to avoid double work; (b) premium-feel polish (page-transition latency, render lag) is the more urgent UX win and is independent of home shape. Mockup archived at `playbooks/home-redesign-v2-mockup.html`. Captures: 4-state primary card (live/up next/habits to do/all done) + today's goals card with weekly footer + streak row (streak pill + 7-day habit dots + engagement score pill) + charity strip + stats link. Bottom nav left at current 4-tab as placeholder for Mind/Body/Connect cutover.

- 📌 **DAILY GOALS — canonical shape captured (Dean directive).** When daily goals build comes back: the three goals are "Watch 1 session", "Log daily habits", "Log one form of exercise". Generator must produce these (or close variants), not generic AI-derived goals. Backend lift not in scope yet but spec sketch lives in PM-73 changelog: new table `member_daily_goals(id, member_email, goal_date, slug, text, source_type, source_id, done_at, sort_order)` + `seed-daily-goals` EF cron 00:05 UK time + tick endpoint + home payload additions (`today_goals[]`, `week_goals_done`, `week_goals_total`). Weekly goals continue as today (`weekly_goals` table + `seed-weekly-goals` cron) — surfaces only as one-line footer summary, not as a list.

- 🔄 **PM-71 RE-SCOPE FLAG.** PM-71 currently queued as "pre-fetch dashboard-only fields (workoutsToday, cardioToday, dailyToday, sleepLastNight, healthConnections) into `member_home_state` during refresh; drop 5 PostgREST queries from the dashboard EF (would ship as v70)." Under the PM-73 home redesign, PM-71 likely **inverts** from "denormalise more fields" → "delete fields from the home payload entirely". Engagement components, 5 progress tracks, recent-30d counts, 30-day activity log, certificates array, achievements payload, habits-with-health-rules, health_connections — all move to a new `member-stats` EF for an on-demand `/stats` route. Sub-second wallclock target trivially achievable on a payload of ~6 fields. **Action when this comes back:** scope PM-71b (the home redesign EF trim) as a unit alongside PM-73's UI build, decide whether to ship PM-71 as-currently-defined first (still a win for `member_home_state` density even without the trim) or skip straight to PM-71b. No work this session.

### Carry-forward from this session

- PM-71 (pre-fetch dashboard-only fields) — still queued, but see re-scope flag above.
- PM-72 (materialise `member_achievement_progress`) — still queued; ownership shifts to `/stats` page if PM-71b ships, since achievements payload leaves the home EF.

---

## Added 12 May 2026 PM-68 + PM-68b + PM-69 + PM-70 ship; PM-71/PM-72 queued (member-dashboard perf overhaul)

- ✅ **CLOSED — PM-68.** Supabase migration `pm68_kill_sync_trigger_fanout`. Replaced 9 heavy AFTER ROW `zzz_refresh_home_state` triggers (which fired ~20 KB plpgsql `refresh_member_home_state` inline in every writer's transaction) with 27 lightweight AFTER STATEMENT dirty-flag triggers on a new `public.member_home_state_dirty(member_email PK, marked_at, reason)` queue table. Plus `refresh_member_home_state_if_dirty(p_email)` (2.4 ms clean / 32 ms dirty per EXPLAIN ANALYZE) and `drain_member_home_state_dirty(p_max_age_seconds)` helpers. Backfilled all 15 members; drained in 426 ms.
- ✅ **CLOSED — PM-68b.** Supabase migration `pm68_b_unified_dashboard_state_rpc`. Added `member_home_state_get_fresh(p_email)` collapsing dirty-check + refresh + state read into one SQL function.
- ✅ **CLOSED — PM-69.** Supabase migration `pm69_dirty_queue_drain_cron`. pg_cron `vyve_drain_home_state_dirty` `*/5 * * * *` calling `drain_member_home_state_dirty()`. Caps idle-member staleness at 5 min.
- ✅ **CLOSED — PM-70.** Supabase migration `pm70_fold_charity_total_into_state_rpc`. Extended unified RPC to return `__charity_total` field, eliminating per-request `get_charity_total()` round trip (was 3,383 calls / 619 s total / 183 ms mean / 3.7 s max in pg_stat_statements — all gateway overhead, not SQL).
- ✅ **CLOSED — member-dashboard EF v68** (ezbr `e9b23b11…`). First EF deploy of the dirty-flag refresh path. `refresh_member_home_state_if_dirty` called before Promise.all; old missing-row fallback retained as belt-and-braces.
- ✅ **CLOSED — member-dashboard EF v69** (ezbr `5ee3a7ba…`). Replaces v68's pattern with the unified `member_home_state_get_fresh` RPC. Drops 2 PostgREST round trips per request (separate state query + charity_total RPC) on top of the v68 refresh win. Three round trips collapsed into one. verify_jwt: false preserved.

### Queued from this session

- 🔜 **PM-71.** Pre-fetch dashboard-only fields (workoutsToday, cardioToday, dailyToday, sleepLastNight, healthConnections) into `member_home_state` during refresh. Drops 5 PostgREST queries from the dashboard EF (would ship as v70). Risk: minor — these fields are already computed inside `refresh_member_home_state` for streaks; just need to be persisted as denormalised columns or a jsonb blob on the row.
- 🔜 **PM-72.** Materialise `member_achievement_progress` so the dashboard's 23-evaluator achievements pass becomes 1 query. Current shape (PM-13/PM-17) is Promise.all over 23 metric evaluators against the catalog + member_achievements + per-metric count/sum tables. Lewis copy gate not required unless tier titles change (they won't).

### Pre-launch hard blockers — unchanged this session (Lewis-blocked)

- HAVEN clinical sign-off (Phil)
- Weekly check-in nudge copy split (Phil + Lewis)
- Brevo logo removal
- Facebook Make connection expires 22 May 2026
- Public-launch comms draft
- B2B volume tier definition

### Brain-drift correction recorded this session

- **`recompute_all_member_stats` does NOT refresh `member_home_state`.** Brain previously claimed it ran a 30-min refresh of home_state via this function. False — that function writes to a separate `member_stats` table. This is why `member_home_state` was 6+ days stale for inactive members before PM-69's cron. Master.md updated.

---

## Added 12 May 2026 PM-66 + PM-67a + PM-67d ships; PM-67c/e/f queued; PERF OVERHAUL becomes the campaign

- ✅ **CLOSED — PM-66.** vyve-site `d81e14297ce8d6193511231f96e11b0bc3eabf7a` (tree `ec4a23a7`). Layer 4 capstone monthly-checkin.html canonical-publish-only wiring (3 files atomic). Closes 8/8 Layer 4 surface campaign. EF v23 failure-discriminator rule codified at §4.9.
- ✅ **CLOSED — PM-67a.** vyve-site `e274b73453528abe0cc1b7404ef801f4262e8c79` (tree `dc5924b1`). Premium-feel perf bundle — defer on vyve-offline.js across 3 pages, vyvePaintDone dispatch on 4 pages, sw.js precache list expanded with 5 HTML + 4 JS files (8 files atomic).
- ✅ **CLOSED — PM-67d.** vyve-site `5947927b8e806d07dde802123a66a678848865bd` (tree `db7873b1`). Waterfall bundle — monthly-checkin init() parallelisation + wellbeing-checkin allSeenRes promotion (3 files atomic).

**Tonight's three commits = 14 files shipped to production. All byte-equal verified at commit. vyve-site main HEAD = `5947927b`. Zero rollbacks. Layer 4 campaign CLOSED.**

---

### 🔴 PERFORMANCE OVERHAUL — primary campaign for week of 12-19 May 2026

Dean directive: 20+ hours committed. Backend (EFs, tables, indexes, RPCs, materialised views) fully in scope.

- 🚨 **PM-67-PERF-1 — Diagnose member-dashboard EF v67 30-40s response time (PRIMARY BLOCKER).** Logs at 12 May ~21:30-22:30 UTC show repeated 17-38s responses per call. Root cause hypotheses: (a) Supabase EF cold-start, (b) PostgREST pool exhaustion under 18+23-wide Promise.all stack, (c) refresh_member_home_state RPC sync fallback path, (d) missing indexes on hot member_email+activity_date queries, (e) RLS overhead. Profile the EF properly (timing each Promise.all member, timing the achievements payload separately, timing the RPC fallback). Identify the actual bottleneck. Ship fix as PM-68a or however the work decomposes. Source loaded in transcript `/mnt/transcripts/2026-05-12-20-45-33-vyve-pm66-pm67a-pm67d-ship-night.txt`. See §23.5.1 master.md rule.
- 🟠 **PM-67e — perf.js sentinel fix.** Add `record('perf_active', 1)` at script-active time + `performance.now()` fallback for SW cache-first navigations where timing API returns ≤0. Without this fix, Layer 5 baseline capture is impossible. Small change (~10 lines), high leverage.
- 🟠 **PM-67c — hot-path defer bundle (PARKED until member-dashboard EF latency fixed).** Originally queued as the "ship next" client-side polish: 17 Realtime bridges + PostHog defer + preconnect hints on 15 pages. Estimated 100-200ms warm time-to-data. **Deprioritised** because member-dashboard EF latency dominates client wins by ~100x. Re-prioritise after PM-67-PERF-1 fix.
- 🟡 **PM-67f — investigate slow non-member-dashboard EFs.** Same logs show notifications (24504ms), monthly-checkin POST (18565ms), wellbeing-checkin POST (12939ms), log-activity POSTs (7886-10973ms). All on the same project so same cold-start hypothesis applies, but each may have its own internal slowness to fix. Audit + plan.
- 🟡 **PM-67g — warm-ping EF effectiveness audit.** warm-ping is deployed and running but does NOT prevent the observed cold-start latency. Read source, check schedule, check whether it actually hits the right EFs, verify whether Supabase EF runtime even respects warm-ping the way we think it does.

### Layer 5 baseline capture protocol (DEFERRED until PM-67e + PM-67-PERF-1 ship)

Capture not viable until perf.js fix lands AND member-dashboard responds in <5s. Currently no baseline numbers exist for any surface.

### Carry-forward from PM-65 (unchanged)

- §23 hard-rule sign-off (4 drafts in Appendix C + 5th in Appendix E of dean-20h-status-2026-05-12.md). Dean review.
- Dead-EF bulk delete (39 retire-safe candidates, bash one-liner needs regenerating — list in playbooks/dead-ef-inventory-2026-05-12.md). Dean CLI access required.
- Capacitor debug-wrap variant for C5 SW verification — future session. `isInspectable = true` build flag.
- Pre-launch HAVEN clinical sign-off (Phil overdue Fri 9 May).
- Weekly check-in nudge copy split (Phil + Lewis overdue Fri 9 May).
- Brevo logo removal.
- Facebook Make connection expiring 22 May 2026 — 10 days remaining as of tonight.

## Added 11 May 2026 PM-65 (Layer 4 wellbeing-checkin.html — eighth surface, FIRST EF-writer + canonical-publish-only shape)

- ✅ **CLOSED — PM-65 above.** vyve-site `ccf9c9baba7267b51baf01653ac66df9e95ccb0d` (new tree `d34b983874d37b1c051bcb297ff3f041e6767b32`). **Layer 4 wellbeing-checkin.html canonical-publish-only wiring** — eighth Layer 4 surface; FIRST Layer 4 EF-writer surface; FIRST canonical-publish-only shape (no vyve-home-state.js tag, no optimisticPatch, no revertPatch, no page-side <event>:failed self-subscriber — index.html belt-and-braces is the ONLY safety net because wellbeing_checkins is not in TYPE_TO_HS_COLS and the page has no page-local cache). Both publish sites get recordCanonical + canonical:true (flush AFTER res.ok per PM-39 initiator+confirmer; live BEFORE EF fetch per PM-33..38 race-fix — asymmetric publish timing preserved within one surface family). wellbeing:failed dispatch on three converging failure classes (!res.ok / data.success !== true / network throw) with reason field for observability. **3-file atomic commit**: wellbeing-checkin.html (+3,857 chars), index.html (+382 chars; wellbeing:failed belt-and-braces subscriber after session:viewed:failed, before certificate:earned), sw.js cache key pm64-movement-canonical-a → pm65-wellbeing-canonical-a. retry_count 0, all 3 files byte-equal verified post-commit (md5_match=True on every file). **Pre-flight reconciliation**: read wellbeing-checkin EF v28 from Supabase directly — confirmed `wellbeing_checkins` UPSERT against natural key (member_email, iso_week, iso_year) via Prefer:resolution=merge-duplicates; confirmed `wellbeing_checkins` NOT in TYPE_TO_HS_COLS in vyve-home-state.js (only daily_habits/workouts/cardio/session_views are); confirmed both publish sites had recordWrite + kind discriminator already wired at PM-52; confirmed home dashboard reads check-in state via member-dashboard EF, not via vyve_home_v3. **Two pre-existing bugs found in pre-flight, both backlog not PM-65 scope**: (1) live-path post-fetch unconditionally calls renderResponse on res.status !== 401 — a 500 with {error:...} would render undefined ack/recs; **incidentally fixed by PM-65** as the new `!res.ok || data.success !== true` branch returns before renderResponse; (2) EF v28 returns {success:true} on 200 even if Supabase weekly_scores/wellbeing_checkins writes throw inside try/catch with console.warn only — P2 EF hardening item below. **3 new §4.9 sub-rules**: (a) canonical-publish-only Layer 4 shape for EF-writer + non-home_state surfaces; (b) asymmetric publish timing within one surface family is preserved; (c) EF-writer failure-class discriminator is `!res.ok || data.success !== true`. **Audit-baseline drift correction (third instance — PM-58 §4.9 live-state-grep rule applied AGAIN)**: subscribe narrative said 42 → live 46; optimisticPatch live 9 (PM-64 changelog said 10 — overcount); revertPatch live 7 (PM-64 changelog said 9 — overcount); vyve-home-state.js HTMLs live 22 (§1 narrative said 18 — undercounted since PM-61). All four corrected in this brain commit. Bus.publish 43 → 45; subscribe 46 → 47; recordCanonical 13 → 15; recordWrite unchanged at 17; installTableBridges unchanged at 1; vyve-home-state.js HTMLs unchanged at 22; optimisticPatch unchanged at 9; revertPatch unchanged at 7. **Two-device manual verify still pending Dean across PM-58/59/60/61/62/63/64/65** — no Android device available; carries forward.

- 🛠 **NEXT P0 — PM-66 monthly-checkin.html (Layer 4 capstone — closes the 8-surface campaign).** 1 publish site, server-side EF writer (monthly-checkin EF — version TBC at pre-flight; PM-40 anchor referenced 409 "already_done" pre-gate). Last surface in Layer 4 per the PM-57 plan. Shape will be the second instance of PM-65 canonical-publish-only OR a hybrid if the EF returns a row that's mappable to a home_state column. Pre-flight read of the EF source needed before deciding. 2-column synthetic key likely (member_email + iso_month). Same PM-52 EF-writer shape as PM-65. Smallest single-publisher migration. Likely <1 session (~1-2 hours Claude-assisted). After PM-66 ships, Layer 4 is closed and PM-67 self-test harness becomes top-of-queue.

- 🛠 **CARRIED P1 — Layer 4 self-test harness (deferred PM-58/59/60/61/62/63/64, now PM-65).** Octuple-deferred. Best landing target now PM-67 (post-Layer-4-completion). Coverage targets unchanged from PM-64 list + add: canonical-publish-only shape regression (verify wellbeing-checkin.html doesn't accidentally pick up an optimisticPatch in a future refactor that would silently increment a wellbeing column that doesn't exist); EF-writer failure-class discriminator regression (verify the `!res.ok || data.success !== true` branch on all EF-writer Layer 4 surfaces — currently wellbeing-checkin.html only, PM-66 monthly-checkin.html will be the second).

- 🛠 **NEW CARRIED P2 — wellbeing-checkin EF v28 hardening: 200-with-success-true-on-Supabase-write-fail.** EF source has weekly_scores and wellbeing_checkins inserts wrapped in try/catch with `console.warn` only; throw is swallowed. Anthropic success path then returns {success:true} regardless. Caller-side trust in success:true is wrong in this edge case. Fix options: (a) propagate the Supabase write failure to the response shape — `{success: false, error: 'wellbeing_checkins_write_failed'}` with 200 status, page treats as ef_failure class; (b) re-throw and return 500 with the error message. Option (a) lets the PM-65 page-side failure discriminator catch it cleanly; option (b) is simpler but means the Anthropic API spend was for nothing. Likely option (a) — small EF v29 edit, single file deploy, no client change. Low priority because the failure mode is rare in practice (Supabase service-role inserts almost never fail on the natural-key UPSERT path).

- 🛠 **NEW CARRIED P2 — wellbeing-checkin live-path post-fetch shape check on res.status !== 401.** Pre-existing bug discovered in PM-65 pre-flight: live-path only checked `res.status === 401` then unconditionally called renderResponse(data, score) — a 500 with {error:...} body fell through and rendered undefined ack/recs. **Incidentally fixed by PM-65's new failure-class branch** — `!res.ok || data.success !== true` returns before renderResponse. Documented here as the bug-was-real-but-fixed marker; close as resolved-by-PM-65 if the team agrees no further work needed. No regression test added (covered by Layer 4 self-test harness PM-67).

- 🛠 **CARRIED P2 — Event-rename pass for publish-event-name-vs-actual-table mismatches.** Three sites should arguably emit different event names: workouts-builder.js L118 `workout:logged source:'builder'` → `custom_workout:created`; workouts-programme.js L581 `workout:logged source:'builder'` → `custom_workout:created`; workouts-programme.js L394 `workout:shared` → `programme:shared`. Multi-file refactor; out of Layer 4 scope; queued as P2 cleanup. Low priority — current Layer 1c behaviour is functionally correct, just semantically misleading.

- 🛠 **CARRIED P2 — log-activity v29 home_state mapping divergence audit (deferred from PM-58).** TYPE_TO_HS_COLS in vyve-home-state.js MUST stay byte-equal with v29's getHomeStatePatched mapping. Discipline enforced by code comments; consider CI check or Supabase trigger-style audit. Low priority unless drift becomes a real issue.

- 🛠 **CONDITIONAL — Layer 6 (SPA shell).** Decision gate PM-56 + 1 week (18 May 2026). Go → playbook + page-by-page migration. No-go → drop.

- 🛠 **CARRIED — Two-device manual verify across PM-58/59/60/61/62/63/64/65.** Open same Layer-4-wired surface on two devices, confirm canonical-publish cross-device echo lands, confirm suppression at the writing device (no double subscriber fire — _markHomeStale should fast-path out via canonical:true OR kind:'canonical'), confirm optimistic patch on observer device's home dashboard arrives within ~2s (Realtime echo latency). For PM-65 specifically: confirm wellbeing:failed publishes correctly on simulated EF failure (browser dev tools → block POST wellbeing-checkin → confirm wellbeing:failed envelope reaches index.html belt-and-braces and triggers invalidateHomeCache; confirm next home-dashboard paint re-fetches via member-dashboard EF). Carries forward — no Android device available this session.

---

## Added 11 May 2026 PM-64 (Layer 4 movement.html — seventh per-surface wiring, CLOSES workouts family; bug fix on the way through)

- ✅ **CLOSED — PM-64 above.** vyve-site `1b0858005b2d3200a9e732b42846fc10808c9375` (new tree `c098e062278307b53c324db7f98ad76f2709f4ef`). **Layer 4 movement.html canonical wiring** — seventh per-surface Layer 4 wiring (PM-58 cardio, PM-59 habits, PM-60 nutrition, PM-61 tracking.js, PM-62 log-food, PM-63 workouts-session.js, PM-64 movement.html). FIFTH direct-fetch surface in the campaign (after PM-58 cardio, PM-61 tracking.js — and the three writeQueued hybrids habits/log-food/workouts-session are separate shape). Pure PM-58 cardio.html shape applied to all 3 publish sites (main workout completion, quick-add walk cardio:logged, quick-add non-walk workout:logged). Each gets optimisticPatch + recordCanonical + canonical:true on envelope + logged_at + <event>:failed eager-fire on !res.ok before existing throw. DOMContentLoaded IIFE wires page-owned workout:failed + cardio:failed subscribers calling VYVEHomeState.revertPatch. **2-file atomic commit**: movement.html (+6,087 chars; vyve-home-state.js script tag added alongside bus.js at L116; 3 publish sites get the full PM-58 treatment; bug fix on the way through — main path L504 was fire-and-forget pre-PM-64, no res.ok check; users saw "Session Complete" with no row written on 4xx; PM-64 adds the check + workout:failed publish + throw to existing outer catch), sw.js cache key pm63-workouts-session-canonical-a → pm64-movement-canonical-a. retry_count 0, both files byte-equal verified post-commit (md5_match=True on both). **PM-64 narrowed scope vs PM-63 brain backlog estimate.** Pre-flight read of share-workout EF v15 from Supabase directly confirmed: save_session inserts custom_workouts (not workouts), add_programme UPSERTs workout_plan_cache (not workouts). Both workouts-programme.js publish sites at L576 (programme:imported) and L581 (workout:logged source:'builder') emit envelopes for actions that produce NO workouts row insertion — canonical-ifying would patch workouts_total +1 for server no-op. Same reasoning for workouts-builder.js L118 (custom_workouts write, workout:logged emit). All three stay Layer 1c per PM-63 §4.9 sub-rule (Layer-1c-stays-Layer-1c discipline). **1 new §4.9 sub-rule** codified — publish-event-name-vs-actual-table mismatch is the gating check for Layer 4 promotion; pre-flight read of writing path (direct fetch URL OR called EF source) is REQUIRED. Bus.publish 40 → 43; subscribe 44 → 46; recordCanonical 10 → 13; recordWrite unchanged at 16 (movement.html's 3 recordWrite calls were already wired at PM-47/PM-48); installTableBridges unchanged at 1; <script src="/vyve-home-state.js"> HTMLs 17 → 18. **Two-device manual verify still pending Dean across PM-58/59/60/61/62/63/64** — no Android device available; carries forward.

- 🛠 **NEXT P0 — PM-65 wellbeing-checkin.html.** 2 publish sites: live submit + flushCheckinOutbox deferred flush. Server-side EF writer via wellbeing-checkin EF v28 (PM-39 initiator+confirmer pattern — page POSTs to EF, EF writes the wellbeing_checkins row server-side via Prefer:resolution=merge-duplicates against natural key (member_email, iso_week, iso_year)). `wellbeing:logged` envelope ALREADY carries `kind:'live'|'flush'` from PM-39 AND `kind:'realtime'` from PM-52 bridge override — `canonical: true` boolean (PM-62 forward rule) IS required because kind is already in use. PM-52 shape applies: page calls `VYVEBus.recordWrite('wellbeing_checkins', synthetic_key)` immediately before publish where synthetic_key is constructed from the natural-key columns (member_email + iso_week + iso_year). Page can't easily branch on HTTP status — failure handling via EF response shape (200 = success; non-200 = wellbeing:failed). PM-39 initiator+confirmer means publish-after-res.ok ordering (different from movement.html's publish-before-fetch race-fix). Likely 1 session (~2-3 hours).

- 🛠 **NEXT P0 — PM-66 monthly-checkin.html (capstone — closes 8-surface Layer 4 campaign).** 1 publish site, server-side EF writer (monthly-checkin EF v18) with PM-40 pre-gate (409 "already_done" returned when row exists; rare in practice). `monthly_checkin:submitted` envelope carries no existing kind — canonical:true boolean per PM-62 forward rule. 2-col synthetic key (member_email + iso_month) for recordWrite. Same PM-52 EF-writer shape as PM-65. Smallest remaining publisher migration. Likely <1 session (~1-2 hours).

- 🛠 **CARRIED P1 — Layer 4 self-test harness (deferred from PM-58/59/60/61/62/63, now PM-64).** Septuple-deferred. Best landing target now PM-67 (post-Layer-4-completion). Coverage targets unchanged from PM-63 list + add: publish-event-name-vs-actual-table mismatch regression check (verify the 3 Layer-1c-stays surfaces — workouts-builder.js L118, workouts-programme.js L581, workouts-programme.js L394 — don't accidentally pick up canonical:true in a future refactor).

- 🛠 **CARRIED P2 — Event-rename pass for publish-event-name-vs-actual-table mismatches.** Three sites should arguably emit different event names: workouts-builder.js L118 `workout:logged source:'builder'` → `custom_workout:created`; workouts-programme.js L581 `workout:logged source:'builder'` → `custom_workout:created`; workouts-programme.js L394 `workout:shared` → `programme:shared` (or split into workout:shared/programme:shared by kind). Requires unsubscribing existing `_markHomeStale` consumers in index.html + `workouts.html` programme cache wipe consumers and updating all subscribers. Multi-file refactor; out of scope for Layer 4 campaign; queued as P2 cleanup. Low priority — current Layer 1c behaviour is functionally correct, just semantically misleading.

- 🛠 **CARRIED P2 — log-activity v29 home_state mapping divergence audit (deferred from PM-58).** TYPE_TO_HS_COLS in vyve-home-state.js MUST stay byte-equal with v29's getHomeStatePatched mapping. Discipline enforced by code comments; consider CI check or Supabase trigger-style audit. Low priority unless drift becomes a real issue.

- 🛠 **CONDITIONAL — Layer 6 (SPA shell).** Decision gate PM-56 + 1 week (18 May 2026). Go → playbook + page-by-page migration. No-go → drop.

- 🛠 **CARRIED — Two-device manual verify across PM-58/59/60/61/62/63/64.** Open same Layer-4-wired surface on two devices, confirm canonical-publish cross-device echo lands, confirm suppression at the writing device (no double subscriber fire — _markHomeStale should fast-path out via canonical:true OR kind:'canonical'), confirm optimistic patch on observer device's home dashboard arrives within ~2s (Realtime echo latency). Carries forward — no Android device available this session.

---

## Added 11 May 2026 PM-63 (Layer 4 workouts-session.js — sixth per-surface wiring, SECOND writeQueued+home_state hybrid surface)

- ✅ **CLOSED — PM-63 above.** vyve-site `7bd55500e83bb7e04263934fa10a49dca6444f09` (new tree `44f0d554a96d2d3ae1702ff9d7225b83f3b82222`). **Layer 4 workouts-session.js canonical wiring** — sixth per-surface Layer 4 wiring (PM-58 cardio, PM-59 habits, PM-60 nutrition, PM-61 tracking.js, PM-62 log-food.html, PM-63 workouts-session.js). SECOND writeQueued+home_state hybrid surface after habits.html PM-59 — `await VYVEData.writeQueued(...)` returns the PM-59 `{ok, queued, status, dead?}` shape; `VYVEHomeState.optimisticPatch('workouts', {loggedAt})` runs immediately before publish; `VYVEBus.recordCanonical('workouts', client_id)` suppresses own Realtime echo for 10s; envelope carries `canonical: true` boolean (PM-62 forward rule) + `logged_at`. **4-file atomic commit**: workouts-session.js (+7,447 chars; saveWorkout block L584-L619 rewritten — let _workoutWriteResult captures writeQueued return, optimisticPatch + recordCanonical + canonical:true publish, dead:true fires workout:failed eagerly, queued:true registers `window._workoutSessionInflight[clientId]`; DOMContentLoaded IIFE at file tail wires workout:failed page-owned subscriber calling VYVEHomeState.revertPatch + pruning inflight + vyve-outbox-dead window listener correlating dead.detail.items[] by POST body.client_id and synthesising workout:failed for retry-exhausted items), workouts.html (+462 chars; adds `<script src="/vyve-home-state.js" defer></script>` before the workouts-config/programme/session bundle — first time the page hosts a VYVEHomeState caller), index.html (+810 chars; belt-and-braces workout:failed subscriber mirroring cardio:failed and habit:failed shape), sw.js cache key pm62-layer4-logfood-a → pm63-workouts-session-canonical-a. retry_count 0, all 4 files byte-equal verified post-commit (md5_match=True on every file). **Scoped narrow** — set:logged at L412 stays Layer 1c (engagement variety/score is server-derived, no patchable home_state column for sets); workout:shared at L772/L822 stays Layer 1c (no bridged write, passthrough envelope). Single canonical-ified publish site, not four. **2 new §4.9 sub-rules** (single-direction Layer 4 surfaces omit `original_sign` on publish AND failed envelopes; Layer-1c-stays-Layer-1c discipline for derived-only signals — don't canonical-ify what you can't locally patch consistently). Bus.publish 38 → 40; subscribe 42 → 44; recordCanonical 9 → 10; recordWrite unchanged at 16 (workouts.client_id recordWrite was already wired at PM-47); installTableBridges unchanged at 1; `<script src="/vyve-home-state.js">` HTMLs 16 → 17. **Two-device manual verify still pending Dean across PM-58/59/60/61/62/63** — no Android device available; carries forward.

- 🛠 **NEXT P0 — PM-64 rest of workouts family.** PM-64 covers the remaining 3 surfaces of the workouts family. Per the PM-63 pre-flight call-site map:
  1. **movement.html** — 3 publish sites (workout:logged L494, cardio:logged L698, workout:logged L710 quick-add). All direct-fetch (PM-58 cardio shape — eager-fire on any non-ok HTTP). All three already have recordWrite from PM-47/PM-48. Needs: optimisticPatch + recordCanonical + canonical:true on the workouts and cardio publishes; page-owned workout:failed + cardio:failed subscribers in a movement.html DOMContentLoaded IIFE; index.html belt-and-braces is already wired for both workout:failed (PM-63) and cardio:failed (PM-58) so no index.html edit needed. **movement.html also needs `<script src="/vyve-home-state.js" defer></script>` added — first-time call site for VYVEHomeState on that page.**
  2. **workouts-programme.js** — 3 publish sites. workout:shared at L394 stays Layer 1c (passthrough, same reasoning as workouts-session.js L772/L822 in PM-63). programme:imported at L576 and workout:logged at L581 are the import-EF pair (server-side EF writer — PM-52 shape). The page POSTs to the import EF which writes the `workouts` row server-side; page needs to call `recordWrite('workouts', synthetic_key_or_client_id)` immediately before publishing. **Pre-flight before PM-64**: read the share-import EF to confirm what conflict resolution it uses and whether it generates a client_id that can be passed back in the response. If yes, page uses that client_id; if no, derive a synthetic key from the share_id + member_email. The optimisticPatch for workouts is fair to apply here since the server WILL insert a workouts row.
  3. **workouts-builder.js** — 1 publish site at L118 (workout:logged source:'builder'). This stays Layer 1c per the PM-63 derived-only / template-create discipline — creating a custom workout template is NOT a workout completion semantically. The Layer 1c fan-out (engagement cache-bust + achievements eval) is correct as-is; canonical-ifying would wrongly increment workouts_total on template create. Leave unchanged in PM-64.

  Actual Layer 4 canonical-ifiable sites in PM-64: 5 (movement.html ×3 + workouts-programme.js ×2). 1 site stays Layer 1c (workouts-builder.js). 1 site is passthrough (workouts-programme.js workout:shared). Estimated time: 1 session (~3-4 hours Claude-assisted).

- 🛠 **NEXT P0 — PM-65 wellbeing-checkin.html.** 2 sites (live submit + flushCheckinOutbox), server-side EF writer. PM-39 initiator+confirmer pattern. `wellbeing:logged` envelope already carries `kind:'live'|'flush'` from PM-39 and `kind:'realtime'` from PM-52 bridge override — `canonical: true` boolean (PM-62 forward rule) IS required. PM-52 shape (server-side EF UPSERT against natural key `(member_email, iso_week, iso_year)`). Page can't easily branch on HTTP status — failure handling via EF response shape. Likely 1 session.

- 🛠 **NEXT P0 — PM-66 monthly-checkin.html (capstone).** 1 site, server-side EF writer with PM-40 pre-gate (409 "already_done" returns rare in practice). Smallest single-publisher migration; capstone for Layer 4. Closes the 8-surface campaign. Likely <1 session.

- 🛠 **NEXT P1 — Layer 4 self-test harness (deferred from PM-58, PM-59, PM-60, PM-61, PM-62, now PM-63).** Sextuple-deferred. Best landing target now PM-67 (post-Layer-4-completion). Coverage targets: recordCanonical map set/expire; canonical fast-path on _markHomeStale (both kind:'canonical' and canonical:true forms); signed-patch math symmetry; signed-patch math for page-local state (PM-62); writeQueued return shape across all branches (200, 4xx, DELETE-404, 5xx, network throw); vyve-outbox-dead detail.items correlation; inflight tracker pruning on success/revert/dead-letter; legacy-fallback age-out path; page-local cache patch+revert symmetry; skip-post-save-re-fetch discipline; multi-table failure dispatch (PM-61); asymmetric multi-table patch (PM-61); dual-path failure dispatch convergence on single subscriber (PM-62, PM-63); single-direction vs dual-op envelope shape consistency (PM-63); Layer-1c-stays-Layer-1c discipline regression check (PM-63 — verify set:logged doesn't accidentally pick up canonical:true in a future refactor).

- 🛠 **NEXT P2 — log-activity v29 home_state mapping divergence audit (deferred from PM-58).** TYPE_TO_HS_COLS in vyve-home-state.js MUST stay byte-equal with v29's getHomeStatePatched mapping. Discipline enforced by code comments; consider CI check or Supabase trigger-style audit. Low priority unless drift becomes a real issue.

- 🛠 **CONDITIONAL — Layer 6 (SPA shell).** Decision gate PM-56 + 1 week (18 May 2026). Go → playbook + page-by-page migration. No-go → drop.

- 🛠 **CARRIED — Two-device manual verify across PM-58/59/60/61/62/63.** Open same Layer-4-wired surface on two devices, confirm canonical-publish cross-device echo lands, confirm suppression at the writing device (no double subscriber fire — _markHomeStale should fast-path out via canonical:true OR kind:'canonical'), confirm optimistic patch on observer device's home dashboard arrives within ~2s (Realtime echo latency). Carries forward — no Android device available this session.

---

## Added 11 May 2026 PM-62 (Layer 4 log-food.html dual-op signed-patch — fifth per-surface Layer 4 wiring, FIRST non-habits signed-patch surface)

- ✅ **CLOSED — PM-62 above.** vyve-site `677f301f5213005f0110195b80177539526820c3` (new tree `c07bb718edc044f7d4bbc07cf439f9ac3334478a`). **Layer 4 log-food.html dual-op signed-patch** — fifth per-surface Layer 4 wiring (PM-58 cardio, PM-59 habits, PM-60 nutrition, PM-61 tracking.js, PM-62 log-food.html). FIRST non-habits signed-patch surface (food:logged +1 across logSelectedFood + logQuickAdd, food:deleted -1) AND FIRST surface where the page's in-memory state IS the cache contents (diaryLogs is what saveDiaryCache serializes — no separate helper layer like nutrition PM-60's vyve_wt_cache). **3-file atomic commit**: log-food.html (+12,410 chars; _deletedRow snapshot captured BEFORE optimistic filter, recordCanonical + canonical:true + original_sign on all three publish envelopes, writeQueued NOW AWAITED at all three sites for failure-class capture, dead:true fires food:failed eagerly with snapshot, queued:true registers _logFoodInflight tracker, DOMContentLoaded IIFE wires page-owned food:failed revert subscriber branching on snapshot.kind to filter-or-push the row + renderDiary + saveDiaryCache + toast on inserts/silent on delete reverts, vyve-outbox-dead window listener correlates dead items by POST body.client_id OR DELETE url client_id=eq.<x> and synthesises food:failed from inflight tracker), index.html (+938 chars; food:failed belt-and-braces invalidateHomeCache after existing food:logged/food:deleted _markHomeStale subscribes, subscribe 18 → 19), sw.js cache key pm61-layer4-tracking-a → pm62-layer4-logfood-a. retry_count 0, all 3 files byte-equal verified post-commit. **5 new §4.9 sub-rules** (signed dual-op surfaces carry original_sign on publish AND failed envelopes; snapshot envelopes carry full restoration payload for non-home-state surfaces; prefer canonical:true boolean for ALL new Layer 4 wiring going forward; awaiting a previously fire-and-forget writeQueued is a behavioural change — add the await; page-in-memory-state IS the cache contents). Bus.publish 34 → 38; subscribe 40 → 42; recordCanonical 6 → 9; recordWrite unchanged at 16 (nutrition_logs recordWrite was already at PM-50). DELETE-404 idempotent-success carries from PM-59 — cross-device delete races never fire food:failed. **Two-device manual verify still pending Dean across PM-58/59/60/61/62** — no Android device available; carries forward to next available session.

- 🛠 **NEXT P0 — Layer 4 surface migrations (3 remaining).** Updated order after PM-62 ship — five shapes now proven: shared home_state patch (cardio, habits), page-local cache patch (nutrition), snapshot-based revert for UPSERT-natural-key surfaces (nutrition), asymmetric multi-table patch + symmetric canonical suppression (tracking.js), page-in-memory-state IS the cache + dual-op signed-patch with full-row delete snapshot (log-food.html). Remaining surfaces:
  1. **workouts family** — workouts-session.js (4 publish sites incl set:logged + workout:logged + workout:shared + flush), workouts-programme.js (3 publish sites: programme:imported + workout:logged + workout:shared), workouts-builder.js (1 site: workout:logged), movement.html (3 sites: workout:logged + cardio:logged + workout:logged quick-add). Highest member-daily-flow frequency of the remaining three so highest premium-feel ROI. ~11 publishers across 4 files; likely 2 sessions to fully wire. movement.html is direct-fetch (cardio + workouts paths) so eager-fire pattern applies there.
  2. **wellbeing-checkin.html** — 2 sites (live submit + flushCheckinOutbox), server-side EF writer. PM-39 initiator+confirmer pattern. Server-side EF writer means the page can't easily branch on HTTP status — failure handling is via the EF's response shape. PM-61's canonical:true boolean IS needed here — wellbeing:logged envelope carries kind:'live'|'flush' from PM-39 and kind:'realtime' from PM-52 bridge override.
  3. **monthly-checkin.html** — 1 site, server-side EF writer. Smallest single-publisher migration; capstone for Layer 4.

  Per-surface migration; 1 session per surface or 1-2 surfaces per session as scope allows. PM-63 likely workouts-session.js or movement.html start.

- 🛠 **NEXT P1 — Layer 4 self-test harness (deferred from PM-58, PM-59, PM-60, PM-61, now PM-62).** Quintuple-deferred. Best landing target now PM-63 (workouts family — multi-file surface where regression risk is highest given the ~11 publishers spread across 4 files; a real test scaffold would benefit the remaining wellbeing + monthly capstone too). Coverage targets: recordCanonical map set/expire; canonical fast-path on _markHomeStale (both kind:'canonical' and canonical:true forms); signed-patch math symmetry (patch +1 then revert -1 returns home_state to byte-equal pre-patch state); signed-patch math for page-local state (PM-62 — insert then revert via snapshot leaves diaryLogs byte-equal to pre-insert state); writeQueued return shape across all branches (200, 4xx, DELETE-404, 5xx, network throw); vyve-outbox-dead detail.items correlation; inflight tracker pruning on success/revert/dead-letter; legacy-fallback age-out path; page-local cache patch+revert symmetry (snapshot capture/restore for UPSERT AND delete-with-full-row); skip-post-save-re-fetch discipline; multi-table failure dispatch (PM-61 — single subscriber branches on envelope.table); asymmetric multi-table patch (PM-61 — patches one table, recordCanonical N tables); dual-path failure dispatch convergence on single subscriber (PM-62 — eager-fire path AND outbox-dead path produce same envelope shape).

- 🛠 **NEXT P2 — log-activity v29 home_state mapping divergence audit (deferred from PM-58).** TYPE_TO_HS_COLS in vyve-home-state.js MUST stay byte-equal with v29's getHomeStatePatched mapping. Discipline enforced by code comments; consider CI check or Supabase trigger-style audit. Low priority unless drift becomes a real issue.

- 🛠 **CONDITIONAL — Layer 6 (SPA shell).** Decision gate PM-56 + 1 week (18 May 2026). Go → playbook + page-by-page migration. No-go → drop.

- 🛠 **CARRIED — Two-device manual verify across PM-58/59/60/61/62.** Open same Layer-4-wired surface on two devices, confirm canonical-publish cross-device echo lands, confirm suppression at the writing device (no double subscriber fire — _markHomeStale should fast-path out via canonical:true OR kind:'canonical'), confirm optimistic patch on observer device's home dashboard arrives within ~2s (Realtime echo latency). Carries forward — no Android device available this session.

---

## Added 11 May 2026 PM-61 (Layer 4 tracking.js + 16-page vyve-home-state.js rollout + PM-43/PM-54 bus.js gap fix — fourth per-surface Layer 4 wiring, FIRST multi-table publisher)

- ✅ **CLOSED — PM-61 above.** vyve-site `88a562baebf78168d91525b44ba1d3fbe8eb5b86` (new tree `4e455015dc74169e2b1315dd3fa9ab9f3c890eae`). **Layer 4 tracking.js + 16-page vyve-home-state.js rollout + 2-page bus.js gap fix** — fourth per-surface Layer 4 wiring (PM-58 cardio, PM-59 habits, PM-60 nutrition, PM-61 tracking.js); FIRST multi-table publisher in the Layer 4 campaign — one publisher writes to both `session_views` and `replay_views` via the `table` variable, but only `session_views` is in `TYPE_TO_HS_COLS` (engagement scoring has no replay component). Asymmetric patch + symmetric canonical suppression + single revert subscriber gates on `envelope.table`. FIRST surface to need the `canonical: true` boolean payload discriminator because `kind` was already in use on `session:viewed` from PM-54 (`kind:'live'|'replay'` for cross-device live/replay disambiguation on engagement.html + index.html). `_markHomeStale` gate at index.html L1280 extended to OR on `envelope.kind === 'canonical' || envelope.canonical === true`. Both flags valid forever; subscribers OR-gate. PM-58/59/60 surfaces keep emitting `kind:'canonical'`; PM-61+ surfaces that need to preserve `kind` use the boolean. **19-file atomic commit**: tracking.js v7 → v8 (+6,156 chars; insertSession rewritten to return {ok, status} for failure dispatch; onVisitStart wires optimisticPatch + recordCanonical + recordWrite, publish with kind + canonical:true; on !ok publishes session:viewed:failed with table/logged_at/http_status/reason; module-level page-owned revert subscriber gates on envelope.table === 'session_views' before VYVEHomeState.revertPatch); index.html (+1,376 chars; gate extension + session:viewed:failed belt-and-braces subscriber); sw.js cache key pm60-layer4-nutrition-a → pm61-layer4-tracking-a; 16 session pages tagged vyve-home-state.js. **checkin-rp.html + workouts-rp.html ALSO got bus.js added** — pre-existing PM-43/PM-54 gap going back to original ship where tracking.js's `if (window.VYVEBus)` had been silently no-op-ing on those pages since PM-43 AND the PM-54 session:viewed bridge was never installed on those pages (cross-device echoes never reached them — installTableBridges runs inside auth.js's bus.js dependency chain). retry_count 0, all 19 files byte-equal verified post-commit. **7 new §4.9 sub-rules** (asymmetric Layer 4 patch on multi-table publishers; `canonical: true` boolean payload discriminator for surfaces that already use `kind`; vyve-home-state.js script-tag prerequisite on every page that emits canonical envelopes; insertSession return-shape extension for direct-fetch IIFE failure dispatch; multi-table failure dispatch with table-gated revert subscribers; script-tag completeness audit on -live.html/-rp.html pages). Bus.publish 33 → 34 (per audit baseline drift correction — PM-60 brain narrative said 29 but live grep at HEAD `1e7962d5` showed 33); subscribe 38 → 40; recordCanonical 5 → 6; recordWrite unchanged at 16 runtime. Audit baseline drift correction committed in same brain patch per §4.9 PM-58 live-state-grep rule. **Two-device manual verify pending Dean.**

- 🛠 **NEXT P0 — Layer 4 surface migrations (4 remaining).** Updated order after PM-61 ship — four shapes now proven: shared home_state patch (cardio, habits), page-local cache patch (nutrition), snapshot-based revert for UPSERT-natural-key surfaces (nutrition), asymmetric multi-table patch + symmetric canonical suppression (tracking.js). Remaining surfaces:
  1. **log-food.html** — 3 publish sites, dual-op food:logged + food:deleted (PM-50 INSERT+DELETE). FIRST non-habits signed-patch surface — sign:+1 insert, sign:-1 delete. Page-local cache (verify shape on read). DELETE-404 idempotent-success treatment carries from PM-59 vyve-offline.js extension for free. PM-61 `canonical: true` boolean NOT needed — food:logged doesn't currently carry a local `kind` field on publish (the PM-50 bridge sets kind:'realtime' on remote echoes but local publish envelope has no kind). PM-62 likely target.
  2. **workouts family** — workouts-session.js (4 sites), workouts-programme.js (3 sites), workouts-builder.js (1 site), movement.html (3 sites — already wired Layer 2 PM-47 + PM-48). Likely 2 sessions to fully wire; movement.html is direct-fetch.
  3. **wellbeing-checkin.html** — 2 sites (live + flush), server-side EF writer with PM-39 initiator+confirmer pattern. PM-61 `canonical: true` boolean IS needed — `wellbeing:logged` envelope carries `kind:'live'|'flush'` from PM-39 and `kind:'realtime'` from PM-52 bridge override.
  4. **monthly-checkin.html** — 1 site, server-side EF writer. Smallest single-publisher migration; capstone for Layer 4.

  Per-surface migration; 1 session per surface or 1-2 surfaces per session as scope allows. PM-62 likely log-food.html.

- 🛠 **NEXT P1 — Layer 4 self-test harness (deferred from PM-58, PM-59, PM-60, now PM-61 too).** Quadruple-deferred. Best landing target now PM-62 (log-food.html — first non-habits signed-patch surface where a real test scaffold would benefit the remaining workouts family + 2 server-side-EF surfaces + monthly capstone). Coverage targets: recordCanonical map set/expire; canonical fast-path on _markHomeStale (both kind:'canonical' and canonical:true forms); signed-patch math symmetry (patch +1 then revert -1 returns home_state to byte-equal pre-patch state); writeQueued return shape across all branches (200, 4xx, DELETE-404, 5xx, network throw); vyve-outbox-dead detail.items correlation; inflight tracker pruning on success/revert/dead-letter; legacy-fallback age-out path; page-local cache patch+revert symmetry (snapshot capture/restore for UPSERT); skip-post-save-re-fetch discipline; multi-table failure dispatch (PM-61 — single subscriber branches on envelope.table); asymmetric multi-table patch (PM-61 — patches one table, recordCanonical N tables).

- 🛠 **NEXT P2 — log-activity v29 home_state mapping divergence audit (deferred from PM-58).** TYPE_TO_HS_COLS in vyve-home-state.js MUST stay byte-equal with v29's getHomeStatePatched mapping. Discipline enforced by code comments; consider CI check or Supabase trigger-style audit. Low priority unless drift becomes a real issue.

- 🛠 **CONDITIONAL — Layer 6 (SPA shell).** Decision gate PM-56 + 1 week (18 May 2026). Go → playbook + page-by-page migration. No-go → drop.

---

## Added 11 May 2026 PM-60 (Layer 4 nutrition canonical envelopes + tap-to-painted-chart — third per-surface Layer 4 wiring, FIRST page-local cache patch surface)

- ✅ **CLOSED — PM-60 above.** vyve-site `1e7962d5e7f09bfe6234081ad63add55dd4d4c33` (new tree `a0f5f86c47471ef59ddc8e1b4bada82557de3c97`). **Layer 4 nutrition.html canonical envelopes + tap-to-painted-chart** — third per-surface Layer 4 wiring (PM-58 cardio, PM-59 habits, PM-60 nutrition). FIRST surface where the Layer 4 optimistic patch target is a page-local cache (vyve_wt_cache_<email>) rather than the shared home_state cache — weights aren't in member_home_state per PM-37, engagement_score has no weight component. Two new module-level helpers `_patchWtCacheOptimistic` + `_revertWtCachePatch` with snapshot capture (priorKg + priorExisted) for UPSERT-natural-key revert symmetry. saveWtLog rewritten: optimistic patch BEFORE recordWrite/recordCanonical/publish; kind:'canonical' + synthetic_key on publish; writeQueued return captured; 4xx eager weight:failed; 5xx → _weightInflight tracker; vyve-outbox-dead window listener correlates dead.detail.items[]. logWeight caller (L1337) no longer awaits loadWtLogs() post-save — pre-PM-60 the re-fetch would wipe the optimistic patch in the queued path; PM-60 hard-rules the "skip post-save server re-fetch when optimistic patch IS canonical" discipline. **2-file atomic commit**: nutrition.html (+10491 chars), sw.js cache key pm59-layer4-habits-a → pm60-layer4-nutrition-a. retry_count 0, both files byte-equal verified post-commit. **2 new §4.9 sub-rules** (page-local optimistic cache patch for non-home-state surfaces; skip post-save server re-fetch when optimistic patch IS canonical). Bus.publish 28 → 29; subscribe 37 → 38; recordCanonical 4 → 5. No index.html change (no home_state column for weights). **Two-device manual verify pending Dean.**

- 🛠 **NEXT P0 — Layer 4 surface migrations (5 remaining).** Updated order after PM-60 ship — three shapes now proven: shared home_state patch (cardio, habits), page-local cache patch (nutrition), and snapshot-based revert for UPSERT-natural-key surfaces (nutrition). Remaining surfaces:
  1. **tracking.js** — `session_views` + `replay_views`, two table targets, single publish site (PM-43 onVisitStart). Direct-fetch (not writeQueued) — PM-58 cardio eager-fire failure pattern applies. session_views IS in TYPE_TO_HS_COLS so VYVEHomeState.optimisticPatch applies; replay_views is NOT in home_state so no shared-library patch (page-local optional). insertSession needs to return res.ok for the failure dispatch to discriminate; current code is try/catch fire-and-forget. Likely smallest remaining migration.
  2. **log-food.html** — 3 publish sites, dual-op food:logged + food:deleted (PM-50 INSERT+DELETE). FIRST non-habits signed-patch surface — sign:+1 insert, sign:-1 delete. Page-local cache (verify shape on read). DELETE-404 idempotent-success treatment carries from PM-59 vyve-offline.js extension for free.
  3. **workouts family** — workouts-session.js (4 sites: set:logged + workout:logged + workout:shared + flush), workouts-programme.js (3 sites: programme:imported + workout:logged + workout:shared), workouts-builder.js (1 site: workout:logged), movement.html (3 sites: workout:logged + cardio:logged + workout:logged quick-add). Likely 2 sessions to fully wire; mixed writer paths.
  4. **wellbeing-checkin.html** — 2 sites (live submit + flushCheckinOutbox), server-side EF writer. PM-39 initiator+confirmer pattern. Server-side EF writer means the page can't easily branch on HTTP status — failure handling is via the EF's response shape.
  5. **monthly-checkin.html** — 1 site, server-side EF writer. Smallest single-publisher migration; capstone for Layer 4.

  Per-surface migration; 1 session per surface or 1-2 surfaces per session as scope allows. PM-61 likely tracking.js.

- 🛠 **NEXT P1 — Layer 4 self-test harness (deferred from PM-58, PM-59, now PM-60).** Triple-deferred. Best landing target now PM-62 (log-food.html) — the FIRST non-habits signed-patch surface, where a real test scaffold would benefit the remaining 4 surfaces (workouts family + 2 server-side-EF surfaces + monthly capstone). Coverage targets unchanged: recordCanonical map; canonical fast-path; signed-patch math symmetry; writeQueued return shape branches; vyve-outbox-dead detail.items correlation; inflight tracker pruning; legacy-fallback age-out; AND now also: page-local cache patch+revert symmetry (snapshot capture/restore for UPSERT); skip-post-save-re-fetch discipline.

- 🛠 **NEXT P2 — log-activity v29 home_state mapping divergence audit (deferred from PM-58).** Discipline enforced by code comments today; CI/audit-query upgrade still pending. Low priority unless drift emerges.

## Added 11 May 2026 PM-59 (Layer 4 habits canonical envelopes + writeQueued failure-class discriminator — second per-surface Layer 4 wiring)

- ✅ **CLOSED — PM-59 above.** vyve-site `482065d259e62a6f746cc520d72c8cdc5aded80a` (new tree `7b556c8405a7ed1b1b29382ff8b17e6deb653d5c`). **Layer 4 habits.html canonical + writeQueued failure-class discriminator** — second per-surface Layer 4 wiring (PM-58 cardio.html shipped 0022dc8e; PM-59 ships habits.html as the FIRST writeQueued surface). Two distinct pieces in one atomic commit: (a) habits.html three publish sites — logHabit tick (sign:+1), undoHabit (sign:-1), autotick (sign:+1) — all wired with optimisticPatch + recordWrite + recordCanonical + kind:'canonical' + writeQueued return capture + dead:true eager habit:failed; (b) vyve-offline.js writeQueued return-shape extension (`{ok, queued, status, response?, item, dead?, retry?, threw?}`) discriminating 4xx-terminal (dead:true) from 5xx/network-queued (retry:true) from DELETE-404-idempotent-success (ok:true,status:404); outboxFlush 4xx-immediate-dead-letter; vyve-outbox-dead CustomEvent now carries detail.items[]; vyve-home-state.js opts.sign extension for symmetric forward/backward writes. **5-file atomic commit**: vyve-offline.js (+3008 chars), vyve-home-state.js (+1812 chars), habits.html (+14801 chars), index.html (+595 chars, habit:failed belt-and-braces), sw.js cache key bump pm58-layer4-cardio-a → pm59-layer4-habits-a. retry_count 0, all 5 files byte-equal verified post-commit. **4 new §4.9 sub-rules** (writeQueued return-shape extension; vyve-outbox-dead detail.items contract; sign-aware patch/revert API; inflight tracker discipline). Bus.publish count 25 → 28; subscribe 35 → 37; recordCanonical 1 → 4. **DELETE-404 = idempotent success** codified at both first-try and outboxFlush retry — covers cross-device habit-undo race where the other device already deleted the row. **Two-device manual verify pending Dean across both PM-58 cardio + PM-59 habits.**

- 🛠 **NEXT P0 — Layer 4 surface migrations (6 remaining).** Updated order after PM-59 ship — direct-fetch failure shape proven at PM-58, writeQueued failure shape proven at PM-59, signed-patch + dual-op + inflight-tracker patterns proven at PM-59. Remaining surfaces:
  1. **nutrition.html** — `weight:logged` single publish site, dual-op writeQueued (PM-51 INSERT+UPDATE natural-key UPSERT). Forward-only (no undo path on weight). Smallest writeQueued surface; clean test of the PM-59 inflight-tracker pattern on a dual-op bridge.
  2. **tracking.js** — `session_views` + `replay_views`, two table targets, single publish site (PM-43 onVisitStart). INSERT-only. Tests Layer 4 with two-bridge channel grouping; recordCanonical applies per-table.
  3. **workouts family** — workouts-session.js (4 sites: set:logged + workout:logged + workout:shared + flush), workouts-programme.js (3 sites: programme:imported + workout:logged + workout:shared), workouts-builder.js (1 site: workout:logged), movement.html (3 sites: workout:logged + cardio:logged + workout:logged quick-add). Likely 2 sessions to fully wire; movement.html cardio/workout paths are direct-fetch so PM-58 eager-fire pattern applies there alongside PM-59 writeQueued patterns elsewhere in the family.
  4. **log-food.html** — 3 sites, dual-op food:logged + food:deleted (PM-50 INSERT+DELETE). FIRST non-habits surface that needs signed patch + revert symmetry (sign:+1 insert, sign:-1 delete). Same DELETE-404 idempotent-success treatment via PM-59 vyve-offline.js extension.
  5. **wellbeing-checkin.html** — 2 sites (live submit + flushCheckinOutbox), server-side EF writer. PM-39 pattern: initiator publishes BEFORE the fetch; confirmer publishes AFTER res.ok. Two failure shapes within one surface — the initiator path eager-fires on EF 4xx, the confirmer path's writeQueued return discriminates between dead-letter (4xx during flush) and outbox-still-queued.
  6. **monthly-checkin.html** — 1 site, server-side EF writer. Smallest single-publisher migration; closes Layer 4.

  Per-surface migration; 1 session per surface or 1-2 surfaces per session as scope allows. PM-60 likely nutrition.html + tracking.js together.

- 🛠 **NEXT P1 — Layer 4 self-test harness (deferred from PM-58, deferred again from PM-59).** Both writer-path shapes (direct-fetch + writeQueued) now proven in production. Add inline self-tests on nutrition.html migration (PM-60) where the test scaffold can be reused across the remaining 5 surfaces. Coverage targets: recordCanonical map set/expire; canonical fast-path on _markHomeStale; signed-patch math symmetry (patch +1 then revert -1 = byte-equal cache state); writeQueued return shape across all branches (200, 4xx, DELETE-404, 5xx, network throw); vyve-outbox-dead detail.items correlation; inflight tracker pruning on success/revert/dead-letter; legacy-fallback age-out path.

- 🛠 **NEXT P2 — log-activity v29 home_state mapping divergence audit (deferred from PM-58).** Discipline enforced by code comments today; CI/audit-query upgrade still pending. Low priority unless drift emerges.

## Added 11 May 2026 PM-58 (Layer 4 cardio canonical envelopes shipped — bus.js v3 → v4, first per-surface Layer 4 wiring)

- ✅ **CLOSED — PM-58 above.** vyve-site `0022dc8ebc6a94c277b1a9510eb27d738e8c4c61` (new tree `74fc09050e5ae12d5c037d0b7265fcd2c09270eb`). **Layer 4 cardio canonical envelopes** — first per-surface Layer 4 wiring. Optimistic patch to `vyve_home_v3_<email>` BEFORE the bus.publish (via new `VYVEHomeState.optimisticPatch('cardio', {loggedAt})` helper); `recordCanonical('cardio', clientId)` suppresses own-write Realtime echo at the bridge layer (10s TTL on dedicated map, mirror of `recordWrite`); `kind:'canonical'` payload discriminator on the publish; index.html `_markHomeStale` fast-paths on `kind:'canonical'` to preserve the patch. Non-ok response fires `cardio:failed` (direct-fetch surface → eager regardless of 4xx/5xx); cardio.html revert subscriber calls `VYVEHomeState.revertPatch('cardio', {loggedAt})`; index.html belt-and-braces subscriber wipes home cache. **5-file atomic commit**: bus.js v3 → v4 (+3556 chars), vyve-home-state.js (NEW, 6979 chars), cardio.html (+2850), index.html (+1183), sw.js cache key pm57-bus-reconnect-resync-a → pm58-layer4-cardio-a. retry_count 0, all 5 files byte-equal verified post-commit via live-SHA endpoint. **Design call**: chose option (c) direct client-side cache-patching over option (b) `evaluate_only`-round-trip — 200-800ms cold-start round trip just to learn what's locally computable in microseconds is a regression dressed as a feature. Math is bounded (four columns per row insert) and self-correcting (next member-dashboard fetch overwrites in full). **5 new §4.9 sub-rules** codified (client-side cache-patching beats log-activity round-trip; `kind:'canonical'` discriminator; `recordCanonical` suppression discipline; `<event>:failed` revert dichotomy 4xx-eager-vs-5xx-deferred for writeQueued surfaces, regardless-eager for direct-fetch; live-state-grep beats brain narrative on drift). **Drift corrections**: bus.publish count 23 → 25 in active.md §2 (workouts-programme.js `workout:shared` undercount discovered at PM-58 grep + new cardio:failed publisher); subscribe count 33 → 35 (two new cardio:failed subscribers). **Self-tests not yet inline** — slot into the next Layer 4 surface migration when there's enough surface-shape proven to make the harness reusable; two-device manual verify pending Dean.

- 🛠 **NEXT P0 — Layer 4 surface migrations (7 remaining).** Suggested order by complexity/risk:
  1. **habits.html** — 3 publish sites (live tick, untick, autotick), `daily_habits` table, simplest writeQueued surface. First place writeQueued return-shape extension lands (4xx/5xx/network failure-class discriminator).
  2. **nutrition.html** — 1 publish site `weight:logged`, dual-op surface (PM-51 INSERT+UPDATE) so the revert math is straightforward and exercises the UPSERT-natural-key shape.
  3. **tracking.js** — `session_views`/`replay_views`, INSERT-only writes with heartbeat PATCH downstream. Tests the no-revert-on-heartbeat boundary.
  4. **workouts family** — workouts-session.js + workouts-programme.js + workouts-builder.js + movement.html, 8 publish sites total. Likely 2 sessions to fully wire.
  5. **log-food.html** — 3 publish sites, dual-op `food:logged` + `food:deleted` (revert path for deletes is the cleanest place to validate the failed-publish + revert pattern symmetrically).
  6. **wellbeing-checkin.html** — 2 publish sites, server-side EF writer.
  7. **monthly-checkin.html** — 1 publish site, server-side EF writer.

  Per-surface migration; 1 session per surface or 1-2 surfaces per session as scope allows. Each surface migration adds 1 to the `VYVEBus.recordCanonical(` count; `VYVEBus.subscribe(` grows by 1 per surface (the `<event>:failed` revert subscriber).

- 🛠 **NEXT P1 — Layer 4 self-test harness.** PM-58 shipped production code without inline self-tests for the suppression mechanism (single new map + isOwn check + new public API). Add Layer 4 self-tests on the next surface migration: recordCanonical sets the map; realtime echo for same (table, pk) within 10s suppressed; outside 10s passes through; canonical envelope fires `_markHomeStale` subscribers but they early-return on the fast path; revert math: patch then revert returns home_state to byte-equal pre-patch state on totals/weekly columns; writeQueued return shape (when extended): ok:true on 200, ok:false+status:400 on 400, ok:true+queued:true on network throw; cross-tab simulation: tab A logs cardio with canonical patch, tab B's storage event fires `_markHomeStale` which still early-returns on canonical kind.

- 🛠 **NEXT P2 — log-activity v29 home_state mapping divergence audit.** PM-58 codified that `TYPE_TO_HS_COLS` in `vyve-home-state.js` MUST stay byte-equal with v29's `getHomeStatePatched` mapping. Discipline is enforced by code comments today; consider adding a CI check or a Supabase trigger-style audit query that fetches both maps and asserts equality. Low priority unless drift becomes a real issue.

## Added 11 May 2026 PM-57 (Layer 3 reconnect resync shipped — bus.js v2 → v3, synthetic resync on channel reconnect)

- ✅ **CLOSED — PM-57 above.** vyve-site `5de6b6f530b31d39297276f46ac22dea4abe626d` (new tree `9d626fee3d04bec68304f95b3b221cc569f2ec5d`). **Layer 3 reconnect resync** — bus.js v2 → v3 (+7073 chars). Status callback on every Realtime channel subscribe; 2nd-or-later `'SUBSCRIBED'` transition fires synthetic envelopes with `origin: 'realtime-resync'` per distinct event-name on that channel. Skip-first-SUBSCRIBED (initial subscribe doesn't resync — caches still populating from page-load fetches). Dedup by event-name within a channel (multi-op channels like `weight_logs` INSERT+UPDATE both → `weight:logged` fire ONCE on reconnect). Verbose logging gated on `vyve_perf_enabled` (Layer 5 opt-in, reused). 2-file atomic commit: bus.js (+7073 chars) + sw.js cache key bump pm56-perf-rollout-a → pm57-bus-reconnect-resync-a. retry_count 0, both files byte-equal verified post-commit. **11/11 self-tests passing** (API surface; install path; skip-first resync; fire-on-reconnect; multi-op event-name dedup; resync_fires_total counter; 3 Layer 2 regressions: local publish, recordWrite suppression, realtime delivery). `node --check bus.js` syntax pass. **Subscriber audit across 33 sites** (9 pages): zero breakage. 5/7 flagged sites are false positives (argument shadowed but unused). 1 marginal gap on habits.html (early-return on missing habit_id means no cache-bust effect from resync — acceptable, page's own GET on visibility-change closes it). 1 partial reaction on workouts.html (PM-42 programme-source scope-fix branch skipped — different scenario from the reconnect, acceptable). 1 N/A (programme:imported not Layer 2 bridged). **One new §4.9 rule:** payload-driven subscribers must gate on `envelope.origin !== 'realtime-resync'` — resync payloads are empty by design.

- 🛠 **NEXT P0 — Layer 4 (optimistic UI bound to bus + reconcile-and-revert).** PM-57 closed Layer 3 same day as PM-56. Layer 4 is the next campaign-level work item. Two related pieces: (a) bind `log-activity` v29's response `home_state` payload through as canonical post-write state replacing the optimistic local-publish prediction (plumbing most ready — v29 already returns home_state); (b) `<event>:failed` revert path so a publish-then-failed-POST quietly undoes the optimistic breadcrumb instead of waiting 120s for `recordRecentActivity` TTL. Per-surface migration; bigger than Layer 3 but mechanical given Layer 2's origin-agnostic subscriber invariant + PM-57's `'realtime-resync'` origin gating precedent.

- 📡 **ACTIVE (Layer 5) — Perf telemetry collection still running.** From PM-56 close through ~18 May 2026. Gates Layer 6 SPA-shell decision. No change at PM-57 — Layer 3 ship doesn't affect telemetry surface.

- 🛠 **CONDITIONAL (Layer 6) — SPA shell.** Decision gate ~18 May 2026 on Layer 5 data. No change at PM-57.

- 📋 **CARRIED FORWARD (P1) — Two-device manual verify across all 11 Layer 2 bridges + PM-57 reconnect resync.** Pending Dean. Phone PWA + desktop tab same account. For Layer 2: trigger writes one table at a time, confirm cross-device echo within ~2s. For PM-57: simulate disconnect on one device (airplane mode + sit ~10s + back on) while the other writes; on reconnect, watch console with `?perf=1` for `[VYVEBus] channel ... status: SUBSCRIBED` followed by `[VYVEBus] resync fired N events on reconnect of vyve_bridge_<table>`. Optional sanity, not blocking.

- 📋 **CARRIED FORWARD (P3) — habits.html L1043 resync gap.** Resync of `habit:logged` fires but the early-return on missing `habit_id` means no cache-bust effect on the habits page. Acceptable — page's own GET on visibility-change closes the gap on next interaction. Promote only if real breakage emerges.

- 📋 **CARRIED FORWARD (P3) — workouts.html L575 partial-reaction on resync.** PM-42 programme-source scope-fix branch skipped on resync (source field undefined). Acceptable — scope-fix targets a specific bug scenario unrelated to reconnect.

- 📋 **CARRIED FORWARD (P3) — `brain/backlog.md` stale.** `tasks/backlog.md` is canonical.

## Added 11 May 2026 PM-56 (Layer 5 perf telemetry rollout shipped — perf.js wired across 20 gated pages; Layer 3 + Layer 4 reframed as in-scope)

- ✅ **CLOSED — PM-56 above.** vyve-site `56717a6acf20cbbe49bdb5e3f77147874710ac33` (new tree `2a17dd336220e8a6b5a8d11af8c96f79f4bbb213`). **Layer 5 perf telemetry rollout** — perf.js (shipped PM-21, 08 May 2026, 8591 chars) was only wired to `index.html`. PM-56 wires it across 20 additional gated portal pages: activity, apple-health, cardio, certificates, engagement, events-live, events-rp, exercise, habits, leaderboard, log-food, monthly-checkin, movement, nutrition-setup, nutrition, running-plan, sessions, settings, wellbeing-checkin, workouts. 21-file atomic commit (20 HTMLs +39-41 chars each + sw.js cache key bump pm55-bridge-certificates-a → pm56-perf-rollout-a). retry_count 0. All 21 files byte-equal verified post-commit via live `GITHUB_GET_REPOSITORY_CONTENT` API (not raw — CDN-cached). perf.js is runtime-gated (`?perf=1` once persists `localStorage.vyve_perf_enabled='1'`), default-off in production, every block wrapped in try/catch (never throws), defer-loaded, JWT-lazy at flush time (unauthenticated loads drop silently), one POST per page lifetime via `pagehide` + 12s fallback. Production-safe to ship broadly. Insertion pattern: `<script src="/perf.js" defer></script>` inserted immediately after the `<script src="/bus.js" defer></script>` anchor where present (13 pages), else immediately after `<script src="auth.js" defer></script>` (7 pages). Either ordering works because perf.js reads JWT lazily at flush, not at load. **One-week telemetry data window starts now** (target 18 May 2026). Gates the Layer 6 SPA-shell decision.

- 🔄 **REFRAMED THIS SESSION — Layer 3 + Layer 4 promoted from "deferred" to "in-scope".** PM-55 retrospective framed Layer 3 (missed-event catch-up on Realtime reconnect) and Layer 4 (reconcile-and-revert on POST failure + optimistic UI bound to bus) as "deferred — promote only if measurable subscriber breakage emerges." Dean reframed in PM-56: the premium-feel architecture campaign is architectural, not reactive. The brain's "deferred" label was too cautious for the campaign's stated goal of every-tap-instant / every-action-immediate / every-change-reflected-everywhere. Apple Notes doesn't reconcile because users complained — it reconciles because every premium app does. Layer 3 and Layer 4 are now in-scope, sequenced AFTER Layer 5's week-of-data window because Layer 5 is the only time-sensitive item (data clock starts at first sample, gates Layer 6 decision a week from PM-56).

- 📡 **ACTIVE (Layer 5) — Perf telemetry collection running.** From PM-56 close through ~18 May 2026. Target: enough warm-cache TTFP / FCP / LCP / INP / auth_rdy samples across the 21 gated pages to make an evidence-based Layer 6 SPA-shell call. Dean to opt-in personally for own-device samples via `?perf=1`. Bulk member-device samples come naturally as members navigate (gated default-off, so most members contribute nothing until/unless Dean flips a server-side flag for a controlled cohort — TBD). At window close, review `perf_telemetry` table grouped by page → LCP distribution per page → Layer 6 go/no-go.

- 🛠 **QUEUED (P0 next campaign) — Layer 3 Realtime reconnect resync sweep.** Opens after Layer 5 data window closes. Surface: bus.js channel reconnect callback → fires synthetic "resync" sweep per bridged table (touch home cache invalidation + achievement re-evaluate, RLS-scoped to current member). One infrastructure commit on bus.js + per-surface subscriber review. Bridged-table set is already known (Layer 2 — 11 tables, 15 installTableBridges entries). The pipes exist; the reconnect hook needs to attach to Supabase channel `system` events and fire the sweep.

- 🛠 **QUEUED (P0 after Layer 3) — Layer 4 optimistic UI bound to bus + reconcile-and-revert.** Two related pieces: (a) bind `log-activity` v29's response `home_state` payload through as canonical post-write state replacing the optimistic local-publish prediction (plumbing most ready — v29 already returns home_state); (b) `<event>:failed` revert path so a publish-then-failed-POST quietly undoes the optimistic breadcrumb instead of waiting 120s for `recordRecentActivity` TTL. Per-surface migration; bigger than Layer 3 but mechanical given Layer 2's origin-agnostic subscriber invariant.

- 🛠 **CONDITIONAL (Layer 6) — SPA shell.** Decision gate at PM-56 + ~1 week. Go → playbooks/spa-shell-migration.md then page-by-page migration. No-go → drop. Don't pre-commit to building this.

- 📋 **CARRIED FORWARD (P1) — Two-device manual verify across all 11 Layer 2 bridges.** Pending Dean since PM-46..PM-55. Phone PWA + desktop tab same account; trigger writes one table at a time; confirm cross-device echo within ~2s.

- 📋 **CARRIED FORWARD (P3) — Stale brain entries.** PM-55 narrative said "13th installTableBridges entry" — live count is 15 entries. Cosmetic off-by-one. Corrected in active.md §2 audit baseline at PM-56.

- 📋 **CARRIED FORWARD (P3) — `brain/backlog.md` stale.** `tasks/backlog.md` is canonical.

## Added 11 May 2026 PM-55 (Layer 2 eleventh + final table-bridge wiring shipped — certificates pure-inbound INSERT-only; Layer 2 campaign CLOSED at 11/11 tables)

- ✅ **CLOSED — PM-55 above.** vyve-site `d36e271c` (tree `d02c4a38`). Eleventh and final Layer 2 table-bridge wiring shipped. **Pure-inbound bridge** — first and only of the campaign. certificate-checker EF v23 (daily cron 9 UTC, NOT v9 as the brain note had said) INSERTs certificate rows server-side via a two-step pattern: INSERT with `certificate_url=''` placeholder, then in-place UPDATE that populates the URL using the server-generated UUID. PM-55 introduces both the `certificate:earned` event AND its bridge in one commit. INSERT-only by design — the UPDATE event is internal noise from the writer's URL-population step; the URL is derived client-side from `row.id` in the bridge's `payload_from_row` (the writer builds the exact same URL string). `pk_field` defaults to `'id'` but no recordWrite suppression discipline applies — server-side cron writer means no own-writes to dedupe. 4-file atomic commit: auth.js (+2232 chars, 13th installTableBridges entry — certificates INSERT, payload maps cert_id/activity_type/milestone_count/global_cert_number/earned_at + derives certificate_url from row.id), certificates.html (+1365 chars, bus.js script tag + DOMContentLoaded subscriber that busts vyve_certs_cache and re-runs loadPage; document.hidden gate skips background fetches; __vyveCertsBusWired idempotent guard), index.html (+596 chars, 14th _markHomeStale subscribe on certificate:earned), sw.js cache bump pm54-bridge-session-views-a → pm55-bridge-certificates-a. engagement.html intentionally NOT wired (cert earning is a milestone of existing tracked activity, not a new activity surface — Variety/Consistency engagement components don't shift on cert events; 6th intentional non-touch across cross-bus campaigns). 25/25 PM-55 self-tests across 6 groups (A install + B INSERT echo correctness + C UPDATE-not-fired + D multi-cert cron run + E defensive missing-id + F inspect sanity). All 180+ previous tests passing. Whole-tree audit-count delta: `VYVEBus.subscribe(` 29→31; `VYVEBus.installTableBridges(` entries 13→14; all other primitives unchanged. Two new §4.9 working-set rules codified (two-step INSERT→UPDATE writers use INSERT-only bridges with client-side derivation; pure-inbound bridges have no recordWrite discipline). Closes PM-42 P3 cert cross-tab carryover. Two-device manual verify pending Dean — invoke certificate-checker via dashboard manual trigger or wait for nightly 9:00 UTC cron.

- 🎉 **LAYER 2 REALTIME BRIDGE CAMPAIGN CLOSED — 11/11 tables wired (PM-45..PM-55).** Two working sessions on 10 + 11 May 2026. 10 commits shipped (PM-45 infrastructure + PM-46..PM-55 one-table-per-commit, except PM-54 which wired session_views + replay_views together as same-publisher tables). 14 entries in installTableBridges array. 8 §4.9 working-set rules codified during the campaign. 6 distinct bridge shapes proven (outbound INSERT-only with client-UUID suppression; outbound with synthetic-key suppression for return=minimal; dual-op INSERT+DELETE with REPLICA IDENTITY FULL; dual-op INSERT+UPDATE for UPSERT writers including server-side EF writers; INSERT-only with heartbeat suppression; pure-inbound INSERT-only with client-side field derivation). Audit-count delta vs Layer 1 baseline: publish=23 unchanged, subscribe=29→31, recordWrite=0→15, installTableBridges entries=0→14. Cross-device coherence is now the platform default for all member-data tables. Layers 3 (missed-event catch-up on Realtime reconnect) and 4 (reconcile-and-revert on POST failure) remain explicitly out-of-scope and deferred. Active.md §3 deprecates next session; new §3 will document Layer 3 scope when work begins, or whichever campaign Dean picks up next. See PM-55-retrospective changelog entry for full retrospective.

- 📋 **CARRIED FORWARD (P1) — programme:imported & workout:shared subscriber consumers.** PM-42 + PM-41 each wired _markHomeStale defensively (no current home surface renders share count or import banner). Future P1 work: home dashboard "your latest activity" or "social feed" surface that consumes these events properly.

- 📋 **CARRIED FORWARD (P3) — log-food.html cross-tab diary-cache coherence.** Punt to Layer 3.

- 📋 **CARRIED FORWARD (P3) — `recordWrite` fallback when missed at a publish site.** Acceptable degraded-but-functional under self-suppression idempotency; promote only if real subscriber breakage emerges.

- 📋 **CARRIED FORWARD (P3) — Catch-up sweep on Realtime reconnect.** Layer 3 territory.

- 📋 **CARRIED FORWARD (P3) — `brain/backlog.md` stale.** `tasks/backlog.md` is canonical.

## Added 11 May 2026 PM-54 (Layer 2 ninth + tenth table-bridge wirings shipped — session_views + replay_views INSERT-only, heartbeat-pattern writer codified)

## Added 11 May 2026 PM-53 (Layer 2 eighth table-bridge wiring shipped — monthly_checkins dual-op INSERT + UPDATE via 2-col synthetic key, EF 409 pre-gate)

## Added 11 May 2026 PM-52 (Layer 2 seventh table-bridge wiring shipped — wellbeing_checkins dual-op INSERT + UPDATE via server-side EF writer, 3-col synthetic key)

## Added 11 May 2026 PM-51 (Layer 2 sixth table-bridge wiring shipped — weight_logs dual-op INSERT + UPDATE via natural-key synthetic pk_field)

## Added 11 May 2026 PM-50 (Layer 2 fifth table-bridge wiring shipped — nutrition_logs dual-op INSERT + DELETE, REPLICA IDENTITY FULL applied)

## Added 11 May 2026 PM-49 (Layer 2 fourth table-bridge wiring shipped — exercise_logs INSERT echoes cross-device, smallest wiring so far)

## Added 11 May 2026 PM-48 (Layer 2 third table-bridge wiring shipped — cardio INSERT echoes cross-device via client_id)

## Added 11 May 2026 PM-47 (Layer 2 second table-bridge wiring shipped — workouts INSERT echoes cross-device via client_id)

## Added 11 May 2026 PM-46 (Layer 2 first table-bridge wiring shipped — daily_habits INSERT echoes cross-device)

## Added 10 May 2026 PM-45 (Layer 2 infrastructure shipped — bus.js Realtime bridge + 11 tables in publication)

## Added 10 May 2026 PM-44 (Layer 1 cleanup commit shipped — campaign complete, Layer 2 opens)

- ✅ **CLOSED — PM-44 above.** vyve-site `66b14ee1` (tree `79b8a3f0`). Layer 1 cleanup commit. Option (a) → option (b) transition per PM-30 §23 rule. 20 patch blocks across 11 publishing files removed 34 fallback primitive call sites. ~7.7KB net cleanup. Whole-tree audit-count delta: invalidate 11→1, record 8→1, evaluate 19→12 (subscriber-internal helpers preserved). Publish 23, subscribe 29 unchanged. 7 subscriber-internal call sites preserved + workouts-programme.js setTimeout(loadProgramme, 800) PM-42 non-primitive resilience preserved + all if (window.VYVEBus) defensive guards preserved. 65/65 self-tests passing (after correcting 2 false-positive heuristics, real failures = 0). node --check clean on all 5 .js files + 23 inline JS blocks. Risk evaluation: bus.js precached + IIFE-self-contained + PWA-installed + browser-retry — degraded-but-functional state on the rare bus.js-load-failure path is acceptable. One new §23 hard rule codified: cache-version date convention drift resolved (date prefix is campaign-namespace, not wall-clock; PM-44 ships 10 May with 09 May prefix because campaign started 09 May).

- 🎉 **LAYER 1 CACHE-BUS CAMPAIGN CLOSED.** PM-30..PM-44 across three working sessions (09-10 May 2026). 14 surfaces migrated + cleanup. 23 publishers, 29 subscribers, 14 distinct event names. 6 real bug fixes shipped en route. 2 real engagement scope-fixes. 5 intentional engagement non-touches documented. 6 new §23 hard rules codified during the campaign. Schema discipline held: distinct semantic events get distinct names; source/origin/variant within same semantic action uses discriminator; reuse existing event schemas where the semantic action matches (PM-42 session-save → PM-35 workout:logged source:'builder' precedent). Subscriber-internal helpers preserved per option (b). The bus is now the production path for all cache invalidation and achievements eval triggered from member-write surfaces. Cumulative cleanup vs pre-PM-30 baseline: invalidate -10, record -7, evaluate -7. Active.md §3 (the 1c campaign section) deprecates next session; new §3 will document Layer 2 scope when work begins.

- ✅ **CLOSED — PM-45 above.** vyve-site `073b1a80` (tree `f71003b0`). Layer 2 infrastructure shipped: bus.js v2 with `installTableBridges(supabase, config)` API + new `origin: 'realtime'` value alongside `'local'` and `'remote'` + `recordWrite(table, pk)` self-suppression API (~5s TTL device-local map keyed by `(table, primary_key)`) + `__mockRealtimeFire` test-harness API gated on `window.__VYVE_BUS_MOCK_REALTIME`. Auth lifecycle: channels subscribe on `auth:ready`, unsubscribe on `auth:signed-out`, idempotent. All channels filter server-side on `member_email=eq.<currentEmail>` with RLS as safety net. 45/45 self-tests passing across 10 groups. Supabase migration `pm45_layer2_realtime_publication_enable` adds 11 tables to `supabase_realtime` publication: `daily_habits`, `workouts`, `exercise_logs`, `cardio`, `nutrition_logs`, `weight_logs`, `wellbeing_checkins`, `monthly_checkins`, `session_views`, `replay_views`, `certificates`. Three tables intentionally deferred: `shared_workouts` (no `member_email` column — sharer-scoped, not member-scoped), `members` UPDATE (high-volume non-coherent UPDATE traffic — every login + setting save would echo to every device; cross-device persona coherence is a rare-event nice-to-have, defer until needed), `workout_plan_cache` UPDATE (already covered by per-event bridges — `workouts` INSERT for completions, PM-42 `programme:imported` for imports). bus.js +9298 chars (9986 → 19284). sw.js cache key bumped: `vyve-cache-v2026-05-09-pm44-cleanup-a` → `vyve-cache-v2026-05-10-pm45-realtime-bridge-a` (new campaign date prefix, per PM-44 §23 sub-rule on cache-version date convention). NO subscribers wired — pure infrastructure prep. PM-46+ wires individual tables one at a time.

- ✅ **CLOSED — PM-46 above.** vyve-site `9565ed93` (tree `c9f1a9a5`). First Layer 2 table-bridge wiring. `daily_habits` INSERT → `habit:logged` echoes cross-device. Atomic 4-file commit: bus.js (function-form `pk_field` support, +467 chars), auth.js (`installTableBridges` call with `daily_habits` entry, +1799), habits.html (`recordWrite` at PM-30 publish site, +578), sw.js cache key bump `vyve-cache-v2026-05-10-pm45-realtime-bridge-a` → `vyve-cache-v2026-05-11-pm46-bridge-daily-habits-a`. Function-form `pk_field` is a clean compromise for tables whose writing surface uses `Prefer:return=minimal` (the existing PM-30..PM-44 outbox `VYVEData.writeQueued` pattern) — synthetic key from the unique-constraint tuple `(member_email, activity_date, habit_id)` matched on both sides. Bridge contract uniformity preserved: every entry declares its PK approach explicitly, string-form 'id' default unchanged. 10/10 PM-46 self-tests passing (3 groups: function-form pk_field × 7 tests, string-form regression × 2, default 'id' regression × 1); 45/45 PM-45 regression unchanged. Two-device manual verify pending Dean. Whole-tree audit-count delta: `VYVEBus.recordWrite(` 0→1, `VYVEBus.installTableBridges(` 0→1; publish=23, subscribe=29, invalidate=1, record=1, evaluate=12 all unchanged. One new §4.9 working-set rule codified (function-form pk_field discipline). The cert P2 cross-tab/cross-device coherence (PM-45 promotion) is now unblocked technically — wire it next as PM-47/PM-48 alongside or just after workouts wiring; cron-driven INSERT means no `recordWrite` discipline needed.

- ✅ **CLOSED — PM-47 above.** vyve-site `8d3d6612` (tree `cee6fc14`). Second Layer 2 table-bridge wiring. `workouts` INSERT → `workout:logged` echoes cross-device via `pk_field:'client_id'`. 5 publisher classification: 3 INSERT into `workouts` (workouts-session.js, movement.html × 2) all got `recordWrite('workouts', client_id)`; 2 INSERT into `custom_workouts` via share-workout EF (workouts-builder.js, workouts-programme.js) so the bridge never echoes their writes — no recordWrite for those surfaces (documented in auth.js bridge config comments). 4-file atomic commit: auth.js (+1678, workouts entry added to installTableBridges array), workouts-session.js (+458, recordWrite at existing publish site — _workoutClientId already wired pre-PM-47), movement.html (+1354, generated _mvClientId and _mvQuickClientId for the 2 workouts-INSERT publish sites + added to INSERT body + recordWrite), sw.js (cache key bump pm46-bridge-daily-habits-a → pm47-bridge-workouts-a). 15/15 PM-47 self-tests across one group covering two-bridge coexistence + client_id pk suppression + legacy NULL client_id handling; 10/10 PM-46 + 45/45 PM-45 regression unchanged. Whole-tree audit-count delta: `VYVEBus.recordWrite(` 1→4; `VYVEData.newClientId(` direct call sites 1→3 (excluding writeQueued's internal calls). One new §4.9 working-set rule codified (string-form pk_field:'client_id' discipline for tables with dedicated client UUID columns). Movement.html walk branch (cardio path) intentionally not touched at PM-47 — that's PM-48.

- ✅ **CLOSED — PM-48 above.** vyve-site `9e21fe04` (tree `8ad34c20`). Third Layer 2 table-bridge wiring. `cardio` INSERT → `cardio:logged` echoes cross-device via `pk_field:'client_id'` (matches PM-47 workouts pattern). 2 publishers: cardio.html (PM-33 direct) + movement.html walk-branch (PM-34 — deliberately deferred at PM-47). Both publishers needed explicit `VYVEData.newClientId()` (neither routes through writeQueued auto-injection). 4-file atomic commit: auth.js (+1254 chars, cardio entry added to installTableBridges array as third), cardio.html (+500 chars, generate _cardioClientId + add cardio_id to publish envelope + add client_id to INSERT body + recordWrite), movement.html (+421 chars, expanded _mvQuickClientId scope from non-walk-only to both branches + walk-branch publish gets cardio_id + walk INSERT body gets client_id + walk recordWrite), sw.js cache bump pm47-bridge-workouts-a → pm48-bridge-cardio-a. 17/17 PM-48 self-tests across one group (three-bridge coexistence + cardio suppression via client_id + payload field mapping for cardio_type/distance_km/duration_min/source + legacy NULL client_id handling + PM-46 PM-47 bridges unaffected). All previous 60+ tests still passing (45/45 PM-45 + 10/10 PM-46 + 15/15 PM-47). Whole-tree audit-count delta: `VYVEBus.recordWrite(` 4→6; `VYVEData.newClientId(` direct call sites 3→4. Movement.html walk-branch deferred comment from PM-47 now satisfied.

- ✅ **CLOSED — PM-49 above.** vyve-site `15b9765a` (tree `ba92b35b`). Fourth Layer 2 table-bridge wiring. `exercise_logs` INSERT → `set:logged` echoes cross-device via `pk_field:'client_id'`. **Smallest Layer 2 wiring so far** — workouts-session.js saveExerciseLog already generated client_id via VYVEData.newClientId() and routed through writeQueued; the PM-32 publish envelope already mapped `exercise_log_id` from `payload.client_id`. PM-49 added just 3 lines: typeof-guarded recordWrite inside _publishSetLogged. 3-file atomic commit: auth.js (+1214 chars, fourth entry in installTableBridges array), workouts-session.js (+380 chars, recordWrite added to _publishSetLogged), sw.js cache bump pm48-bridge-cardio-a → pm49-bridge-exercise-logs-a. 17/17 PM-49 self-tests (four-bridge coexistence). All previous 60+ tests still passing. Whole-tree audit-count delta: `VYVEBus.recordWrite(` 6→7; `VYVEData.newClientId(` unchanged.

- ✅ **CLOSED — PM-50 above.** vyve-site `a8339d9c` (tree `a2bf61f7`) + Supabase migration `pm50_nutrition_logs_replica_identity_full`. **First dual-op bridge in the Layer 2 campaign** — `nutrition_logs` INSERT (`food:logged`) + DELETE (`food:deleted`), grouped on shared channel `vyve_bridge_nutrition_logs`. 3 publish sites in log-food.html (logSelectedFood `kind:'search'`, logQuickAdd `kind:'quickadd'`, deleteLog) — all already had `client_id` in scope from PM-12/PM-36 era; just needed recordWrite calls. 3-file atomic vyve-site commit: auth.js (+1627 chars, two array entries — INSERT bridge with kind:'realtime' payload override + DELETE bridge), log-food.html (+859 chars, recordWrite('nutrition_logs', cid) at all 3 publish sites with typeof guards), sw.js cache key bump pm49-bridge-exercise-logs-a → pm50-bridge-nutrition-logs-a. Pre-flight migration applied separately (atomic by design with the vyve-site commit): `ALTER TABLE public.nutrition_logs REPLICA IDENTITY FULL` — required because default replica identity only sends the PK column in DELETE Realtime events; the DELETE bridge with `pk_field:'client_id'` needs the old row's client_id to match recordWrite keys. Verified via `pg_class.relreplident = 'f'`. 21/21 PM-50 self-tests across one group covering dual-op channel grouping (one channel grouped by table; two listeners INSERT + DELETE), INSERT bridge with kind override, DELETE bridge with REPLICA IDENTITY FULL semantics, INSERT/DELETE bridges independent. All 80+ previous tests still passing. Whole-tree audit-count delta: `VYVEBus.recordWrite(` 7→10; `VYVEData.newClientId(` unchanged. New §4.9 working-set rule codified (REPLICA IDENTITY FULL discipline for non-PK-bearing DELETE bridges).

- ✅ **CLOSED — PM-51 above.** vyve-site `8c25a6b0` (tree `0788f5ed`). Sixth Layer 2 table-bridge wiring shipped. **Second dual-op bridge — INSERT + UPDATE** (PM-50 was INSERT + DELETE; PM-51 demonstrates the third dual-op shape). `weight_logs` echoes cross-device. Key design call: function-form `pk_field` on natural unique key `(member_email|logged_date)` because the writing surface (nutrition.html saveWtLog PM-37 era) uses `Prefer:resolution=merge-duplicates` against that natural constraint — same-day re-logs UPSERT (first write fires INSERT Realtime event, subsequent writes on the same natural key fire UPDATE Realtime events). client_id is non-deterministic under merge-duplicates (writeQueued generates one if not provided; whichever write wins the merge becomes the row's client_id) so synthetic natural key is the reliable choice. No REPLICA IDENTITY FULL needed — UPDATE NEW payload carries the full new row under default REPLICA IDENTITY. 3-file atomic commit: auth.js (+2523 chars, two array entries — INSERT + UPDATE both function-form pk_field both emit weight:logged), nutrition.html (+467 chars, one recordWrite with synthetic key before existing publish), sw.js cache bump pm50-bridge-nutrition-logs-a → pm51-bridge-weight-logs-a. 18/18 PM-51 self-tests covering INSERT+UPDATE channel grouping, same-day re-log UPSERT→UPDATE suppression, cross-device first-write INSERT, cross-device UPDATE on existing row, NULL weight_kg. All 100+ previous tests still passing. Whole-tree audit-count delta: `VYVEBus.recordWrite(` 10→11; entries in installTableBridges array 5→7. New §4.9 working-set rule codified (function-form pk_field for UPSERT writing surfaces; INSERT+UPDATE dual-op channel grouping).

- ✅ **CLOSED — PM-52 above.** vyve-site `daec6588` (tree `0343d647`). Seventh Layer 2 table-bridge wiring shipped. **Third dual-op INSERT+UPDATE bridge** (PM-50 INSERT+DELETE; PM-51 INSERT+UPDATE same-event; PM-52 INSERT+UPDATE same-event server-side-writer). **First server-side-writer wiring of the campaign** — page POSTs to wellbeing-checkin EF v28, EF writes wellbeing_checkins server-side via `Prefer:resolution=merge-duplicates` against 3-column natural key `(member_email, iso_week, iso_year)`. Function-form `pk_field` on the 3-col natural key. client_id intentionally not used (EF doesn't populate it on INSERT; merge-duplicates would make it non-deterministic anyway). No REPLICA IDENTITY FULL needed — UPDATE NEW carries all columns under default identity. 3-file atomic commit: auth.js (+2385 chars, two array entries — INSERT + UPDATE both function-form pk_field on 3-col natural key, payload maps score from score_wellbeing + flow from flow_type + kind:'realtime' override), wellbeing-checkin.html (+941 chars, recordWrite at both publish sites — flushCheckinOutbox kind:'flush' post-success + submit handler kind:'live' pre-fetch), sw.js cache bump pm51-bridge-weight-logs-a → pm52-bridge-wellbeing-checkins-a. 21/21 PM-52 self-tests covering 3-col synthetic key channel grouping, INSERT/UPDATE behaviour, same-week UPSERT→UPDATE suppression, cross-device new-week INSERT, cross-device UPDATE, kind override, null score edge case. All 120+ previous tests still passing. Whole-tree audit-count delta: `VYVEBus.recordWrite(` 11→13. New §4.9 working-set rule codified (server-side EF writer pattern still needs page-side recordWrite with conflict-resolution natural key).

- ✅ **CLOSED — PM-53 above.** vyve-site `ef50bc0b` (tree `44a23aac`). Eighth Layer 2 table-bridge wiring. `monthly_checkins` dual-op INSERT+UPDATE via 2-col synthetic key `(member_email|iso_month)`. Mirrors PM-52 wellbeing_checkins pattern (server-side EF writer + UPSERT) with two distinctions: (a) 2-col natural key vs 3-col, (b) EF (monthly-checkin v18) pre-gates with 409 "already_done" check BEFORE merge-duplicates write so UPDATE events are rare in practice — bridge wires both defensively for race-condition cases (concurrent submits from two devices both passing the 409 check before either writes). Table has no client_id column — synthetic natural-key is the only option. 3-file atomic commit: auth.js (+2149 chars, INSERT + UPDATE both function-form pk_field on 2-col natural key, payload mapping iso_month + avg_score + kind:'realtime'), monthly-checkin.html (+559 chars, recordWrite at single publish site in submitCheckin — _isoMonth and email already in scope), sw.js cache bump pm52-bridge-wellbeing-checkins-a → pm53-bridge-monthly-checkins-a. 15/15 PM-53 self-tests covering channel grouping, INSERT echo suppression, cross-device INSERT, defensive UPDATE, kind override, null avg_score edge case. All 140+ previous tests still passing. Whole-tree audit-count delta: `VYVEBus.recordWrite(` 13→14. No new §4.9 rules — PM-52 server-side EF writer rule covers this case.

- ✅ **CLOSED — PM-54 above.** vyve-site `54020b9f` (tree `ac9b01b8`). Ninth + tenth Layer 2 table-bridges wired together as a single atomic commit — session_views and replay_views share one publisher (tracking.js PM-43 onVisitStart) that routes between them via `isReplay`. Both **INSERT-only** by deliberate design: heartbeat PATCHes every 15s (HEARTBEAT_MS = 15000ms) update minutes_watched on the existing row, firing UPDATE Realtime events that an UPDATE bridge would fan out to subscribers 4× per minute per open session page per device. Skip UPDATE. Cross-device echo fires once on the confirmed initial INSERT — sufficient for "session was watched" semantics. Same-day re-visit UPSERT→UPDATE not echoed (subscribers already counted the category for the day after initial INSERT echo). 3-col synthetic key `(member_email|category|activity_date)` per the on_conflict clause in tracking.js insertSession. No client_id column on either table — synthetic natural-key is the only option. 3-file atomic commit: auth.js (+2725 chars, two array entries — session_views INSERT + replay_views INSERT, both function-form pk_field, kind:'live' / kind:'replay' assigned by bridge from the table itself), tracking.js (+649 chars, recordWrite(table, memberEmail+'|'+category+'|'+getToday()) at single publish site — `table` variable routes recordWrite to the matching bridge), sw.js cache bump pm53-bridge-monthly-checkins-a → pm54-bridge-session-views-a. 20/20 PM-54 self-tests covering: two separate channels per table, local publish + recordWrite suppresses INSERT echo on each, cross-device INSERT fires with correct kind from bridge, live/replay disambiguation, UPDATE-NOT-fired (heartbeat silence preserved by absence of UPDATE bridge). All 160+ previous tests still passing. Whole-tree audit-count delta: `VYVEBus.recordWrite(` 14→15; `VYVEBus.installTableBridges(` entries 11→13. New §4.9 working-set rule codified (heartbeat-pattern writers require INSERT-only bridges).

- 📋 **OPEN (P0) — PM-55: Eleventh Layer 2 table-bridge wiring (`certificates` — cron-driven inbound).** Last table in §3.1 (row 2-12). **Qualitatively different** from PM-46–PM-54 — no client publisher of `certificate:earned` exists. certificate-checker EF v9 runs as a daily cron (9:00 UTC) and INSERTs certificate rows server-side. Cross-device fanout is the entire point of the bridge — the writer is the server, not any device. PM-55 introduces the event AND its bridge in one commit.

  Pre-flight:

  1. Inspect `certificates.client_id` column + replica identity. Likely no client_id (server-side cron writer).
  2. Confirm `certificates` is in `supabase_realtime` publication (added at PM-45).
  3. Bridge entry: `pk_field:'id'` (default — every Realtime echo is by definition a new event; no own-writes to suppress, so no synthetic suppression key needed).
  4. `payload_from_row` mapping for the new `certificate:earned` event — cert_number, certificate_type, tier, member_email, etc.
  5. Subscribers: design call — index.html (home-stale + cert-tab pip), engagement.html (engagement cache stale on cert milestones), certificates.html (refresh list if open). PM-55 may include subscriber wiring in the same commit or defer to a follow-up.
  6. sw.js cache bump.
  7. Two-device verify: invoke certificate-checker directly (or wait for nightly cron), watch echo arrive on a second tab.

  Closes the PM-42 P3 cert cross-tab carryover. Estimate: ~30-45 min — design call on subscriber list takes more thought than the bridge wiring itself.

- 📋 **CARRIED FORWARD (P1) — programme:imported & workout:shared subscriber consumers.** PM-42 + PM-41 each wired _markHomeStale defensively (no current home surface renders share count or import banner). Future P1 work: home dashboard "your latest activity" or "social feed" surface that consumes these events properly.

- 📋 **CARRIED FORWARD (P2 — promoted from P3 at PM-45) — Certificate cross-tab/cross-device cache coherence (PM-46+ wiring slot).** PM-45 added `certificates` to `supabase_realtime` publication and bus.js exposes `installTableBridges`. Wiring slot: add `{ table: 'certificates', event: 'certificate:earned', op: 'INSERT', payload_from_row: row => ({ certificate_id: row.id, ... }) }` to the bridge config + a subscriber on certificates.html that re-renders the certificate list on receive. When the certificate-checker EF v9 cron inserts a new row at 09:00 UTC, the active client tab will reflect it without manual refresh. Considered for PM-46/47 alongside the first table-bridge wirings. Cron-driven INSERT means there's no own-write to suppress — this surface delivers cleanly without `recordWrite` discipline.

- 📋 **CARRIED FORWARD (P3) — log-food.html cross-tab diary-cache coherence.** Punt to Layer 3.

- 📋 **CARRIED FORWARD (P3) — `brain/backlog.md` stale.** `tasks/backlog.md` is canonical.

## Added 09 May 2026 PM-43 (Layer 1c-14 shipped — campaign complete)

- ✅ **CLOSED — PM-43 above.** vyve-site `1d36b30f` (tree `52d0a1e0`). FOURTEENTH and FINAL Layer 1c migration. Single publish surface (tracking.js onVisitStart) handles both live + replay via kind discriminator. 18-file atomic commit (1 publisher + 2 subscribers + 14 page bus.js script tags + sw.js bump). Real engagement scope-fix: pre-PM-43 watching a session never busted vyve_engagement_cache; the Variety component score went stale until another event fired _markEngagementStale. PM-43 closes the gap (8th _markEngagementStale event, first non-defensive engagement extension since PM-30..32). Symmetric fallback (preserves invalidateHomeCache + recordRecentActivity in !VYVEBus else-branch). Heartbeats untouched (only initial insert publishes, not the 15s heartbeat PATCH). 50/50 self-tests passing (13 groups). bus.js wired on 14 pages (12 shell-pattern + 2 full-content-pattern); FIRST new bus.js wiring since PM-39. Audit-count delta: invalidate 11, record 8, evaluate 19 (all unchanged); publish 22→23 (+1); subscribe 27→29 (+2). Cumulative: 23 publishers, 29 subscribers across PM-30..PM-43.

- 🎉 **LAYER 1c CAMPAIGN COMPLETE — 14/14 surfaces shipped (PM-30..PM-43).** Twelve calendar-week-equivalent of work compressed into three sessions on 09 May 2026 (PM-30..36 first session; PM-37..40 second; PM-41..43 third under the new session-loading protocol). Cumulative bus surface: 23 publishers, 29 subscribers. Two real engagement scope-fixes shipped en route (PM-32 set:logged, PM-43 session:viewed). Six real bug fixes shipped (PM-32 missing eval per-set, PM-33 cardio cross-tab, PM-34 movement scope-fix, PM-35 builder no-invalidation, PM-36 log-food delete zero primitives, PM-41 shareCustomWorkout zero primitives, PM-42 import 800ms setTimeout workaround). Two new §23 hard rules codified (PM-42 server-side cron-driven scope, PM-42 multi-event single-function migrations). Schema discipline holds: 23 publish call sites across ~12 distinct event names; kind discriminator used 4× (food:logged, wellbeing:logged, workout:shared, session:viewed); source discriminator used 1× (workout:logged across 4 sources).

- 📋 **OPEN (P0) — PM-44: Layer 1 cleanup commit (option-(b) transition).** Closes Layer 1. Removes the three legacy direct-call publishing surfaces from publishing sites (VYVEData.invalidateHomeCache, VYVEData.recordRecentActivity, VYVEAchievements.evaluate). They remain as subscriber-internal helpers + !VYVEBus fallback else-branch primitives. PM-30 §23 rule transitions from option (a) to option (b). Single atomic commit covering all 14 publishing sites. Pre-flight: classify each !VYVEBus else-branch as keep-verbatim / reduce-to-no-op / remove-entirely. Audit-count delta projected: invalidate 11→~5-7, record 8→~3-5, evaluate 19→~10-12; publish 23 unchanged, subscribe 29 unchanged. After PM-44 ships, Layer 1 closes, Layer 2 (cross-tab/cross-device cache coherence via Supabase Realtime + storage events into the same bus) opens, cache-bus-taxonomy.md becomes obsolete per playbooks/1c-migration-template.md stop-date.

- 📋 **CARRIED FORWARD (P1) — programme:imported & workout:shared subscriber consumers.** PM-42 + PM-41 each wired _markHomeStale defensively (no current home surface renders share count or import banner). Future P1 work: home dashboard "your latest activity" or "social feed" surface that consumes these events properly.

- 📋 **CARRIED FORWARD (P3) — Cache-version date convention drift.** vyve-cache-v2026-05-09-pmNN-X-Y carries date prefix from PM-30 through PM-43. System clock still 09 May 2026 UTC at PM-43 ship. Recommend the convention bump happens at the first session that crosses midnight UK time. Codify in §23 if the convention changes.

- 📋 **CARRIED FORWARD (P3) — Certificate cross-tab/cross-device cache coherence.** Punt to Layer 2.

- 📋 **CARRIED FORWARD (P3) — log-food.html cross-tab diary-cache coherence.** Punt to Layer 3.

- 📋 **CARRIED FORWARD (P3) — `brain/backlog.md` stale.** `tasks/backlog.md` is canonical.

## Added 09 May 2026 PM-42 (Layer 1c-13: programme:imported + workout:logged source:'builder' shipped)

- ✅ **CLOSED — PM-42 above.** vyve-site `b053cd8a` (tree `3d48421d`). Thirteenth Layer 1c migration. Single function (`workouts-programme.js` `confirmImportPlan` L530-560), two semantically distinct events emitted on resp.ok: `programme:imported` for isProg=true (NEW, taxonomy ADD), `workout:logged source:'builder'` for isProg=false (REUSES PM-35 schema). Asymmetric fallback both branches. Real bug fix: pre-PM-42 the import flow had ZERO cache invalidation primitives — manual setTimeout(loadProgramme, 800) was the symptom of the missing primitive. Bus path replaces it with synchronous self-subscriber on workouts.html — 800ms polling delay becomes immediate render on import success. Subscribers: index._markHomeStale extends to programme:imported (12th event); workouts.html new self-subscriber (busts vyve_programme_cache + loadProgramme + eval); engagement.html NOT wired (5th non-touch). bus.js NOT added (workouts.html already has it). 55/55 self-tests passing (12 groups). Two new §23 sub-rules codified: (1) server-side cron-driven write surfaces are out of scope for Layer 1c; (2) multi-event single-function migrations are valid when branches differ in *what semantic action is happening* (vs source/origin/variant which uses discriminator). Audit-count delta: invalidate 11, record 8, evaluate 19 (all unchanged), publish 20→22 (+2), subscribe 25→27 (+2). Cumulative: 22 publishers, 27 subscribers across PM-30..PM-42.

- ✅ **CLOSED — PM-41 above.** vyve-site `e3cf1fcf` (tree `b3f4efa1`). Twelfth Layer 1c migration. THREE publishing surfaces, mixed-fallback (third mixed-fallback after PM-36 + PM-39): workouts-session.js shareWorkout (kind:'session', symmetric), workouts-session.js shareCustomWorkout (kind:'custom', asymmetric — pre-bus zero primitives, real gap closure), workouts-programme.js shareProgramme (kind:'programme', symmetric). NEW event `workout:shared` with kind discriminator (taxonomy ADD). Race-fix: publish-after-res.ok all three (confirmer pattern, payload carries share_code from EF response). Subscribers: index._markHomeStale extends (11th event); engagement NOT wired (4th non-touch — sharing has no scoring component); no self-subscriber (sharing not on any achievement track per achievements.js audit). bus.js NOT added (workouts.html already has it since PM-32). Incidental UX polish: shareCustomWorkout now passes shareCode to _showShareModal so custom shares display the share code (parity with session shares). 54/54 self-tests passing (13 groups). Audit-count delta: invalidate 11, record 8, evaluate 19 (unchanged — both eval sites preserved in if(!VYVEBus) else-branches), publish 17→20 (+3), subscribe 24→25 (+1).

- 📋 **OPEN (P0) — PM-43: Layer 1c-14 + cleanup commit.** **ONE Layer 1c migration remaining**: live-session pages via `session-live.js`. Eight live pages (yoga-live, mindfulness-live, therapy-live, events-live, education-live, podcast-live, workouts-live, checkin-live) all share one module — ONE shared publish surface, multiple consumer pages. Most complex of the campaign and intentionally last (most care). Likely emits `session:viewed` or `session:joined` per cache-bus-taxonomy.md. Pre-flight at session start to (a) confirm session-live.js is the single write surface or whether each *-live.html has its own publish-side calls, (b) classify symmetric/asymmetric/mixed fallback per surface, (c) decide event name (likely `session:viewed` matches the `session_views` table semantics; `session:joined` for live-only-not-replay), (d) decide whether `kind:'live'|'replay'` discriminator covers session_views vs replay_views (likely yes, mirror of PM-39 wellbeing kind:'live'|'flush'). After 1c-14 ships, **option-(b) cleanup commit** closes Layer 1: removes the three legacy direct-call publishing surfaces (`VYVEData.invalidateHomeCache`, `VYVEData.recordRecentActivity`, `VYVEAchievements.evaluate` from publishing sites — they remain available as subscriber-internal helpers). PM-30 §23 rule transitions from option (a) to option (b). Layer 1 closes; Layer 2 (cross-tab/cross-device cache coherence) campaign opens.

- 📋 **CARRIED FORWARD (P1) — programme:imported & workout:shared subscriber consumers.** PM-42 + PM-41 each wired `_markHomeStale` defensively (no current home surface renders share count or import banner). Future P1 work: home dashboard "your latest activity" or "social feed" surface that consumes these events properly. The defensive home-cache busts mean future consumers will see fresh state on first paint without retrofit.

- 📋 **CARRIED FORWARD (P3) — Cache-version date convention drift.** `vyve-cache-v2026-05-09-pmNN-X-Y` carries date prefix from PM-30 through PM-42. System clock still 09 May 2026 UTC at PM-42 ship. Recommend the convention bump happens at the first session that crosses midnight UK time. Codify in §23 if the convention changes.

- 📋 **CARRIED FORWARD (P3) — Certificate cross-tab/cross-device cache coherence (NEW from PM-42).** Certificate write happens server-side via `certificate-checker` EF v9 daily cron at 09:00 UTC. Layer 1c has no client publish surface to migrate (codified §23 rule, this commit). Cross-tab staleness for certificate-served pages is a Layer 2 concern: when the cron runs and inserts a new `certificates` row, the certificates.html cache shows stale "0 certificates" until manual refresh. Punt to Layer 2 unless members complain about a specific certificate-staleness symptom.

- 📋 **CARRIED FORWARD (P3) — log-food.html cross-tab diary-cache coherence.** Punt to Layer 3 unless Lewis flags real cross-tab diary editing patterns.

- 📋 **CARRIED FORWARD (P3) — `brain/backlog.md` stale.** `tasks/backlog.md` is canonical. Either delete `brain/backlog.md` or annotate it with a STALE → tasks/ pointer header.

## Added 09 May 2026 PM-37-Setup (Brain commit only — new session-loading protocol shipped)

- ✅ **CLOSED — PM-37-Setup above.** VYVEBrain commit only. **No vyve-site changes; no 1c migration; no portal deploy.** Three new files shipped to VYVEBrain: `brain/active.md` (42KB curated working set), `playbooks/1c-migration-template.md` (16KB), `playbooks/session-loading-protocol.md` (9KB). Three new §23 hard rules codified in master.md: session loading discipline, deferred whole-tree audit, migration template stability. Three patches: master.md §23 (+6 lines), changelog.md (PM-37-Setup entry prepended), tasks/backlog.md (this entry). Old "Load VYVE brain" routine (~1.27MB context load: full master + changelog + backlog + taxonomy) replaced with new routine (~70-90KB load: active.md + relevant playbooks + last 3 changelog entries via grep). Same architectural principle as the portal's stale-while-revalidate HTML strategy — paint instantly from working set, fetch canonical only when a question genuinely needs it. Investment pays out from PM-41 onwards.

- 📋 **OPEN (P0) — PM-41: Layer 1c-12.** Twelfth 1c migration; first session under the new loading protocol. THREE remaining 1c surfaces post-PM-40 (shipped 09 May 2026 evening). Pre-flight at session start (HEAD will be the PM-37-Setup brain commit; vyve-site HEAD remains `21bb6f3c` = PM-40 ship). **Recommended pick: shared-workout.html** (smallest blast radius, clean asymmetric pattern, zero primitives, first new bus.js wiring since PM-39, likely emits `workout:shared` taxonomy ADD). Alternative candidates: (b) certificate.html / certificates.html — zero primitives → ASYMMETRIC, may emit `certificate:earned` (when achievement tier completes) or `certificate:viewed` (when member opens cert), achievement-adjacent so self-subscribe pattern likely fits, two pages but possibly one publish surface; (c) live-session pages — eight pages share `session-live.js`, ONE shared module = one publish surface with multiple consumer pages, emits likely `session:joined` or `session:viewed`, most complex of the three remaining and probably should be 1c-14 (last). Sequencing: shared-workout next, certificate second, live-sessions as 1c-14. Test of the new loading protocol: PM-41 should close in less time than PM-40 with more headroom for PM-42 + PM-43 in the same session.

- 📋 **CARRIED FORWARD (P3) — Cache-version date convention drift.** `vyve-cache-v2026-05-09-pmNN-X-Y` carries date prefix from PM-30 through PM-40. Today's wall clock is still 09 May 2026 per the system clock. Recommend the convention bump happens at the first session that crosses midnight UK time. PM-41 should check at session start.

- 📋 **CARRIED FORWARD (P3) — log-food.html cross-tab diary-cache coherence.** Punt to Layer 3 unless Lewis flags real cross-tab diary editing patterns.

- 📋 **CARRIED FORWARD (P3) — `brain/backlog.md` is stale (last touched 28 April).** `tasks/backlog.md` is canonical. Either delete `brain/backlog.md` or annotate it with a "see tasks/backlog.md for current state" stub. Decision deferred — flagged in active.md §1 as a hygiene item. Tag: brain hygiene, address when convenient.

## Added 09 May 2026 PM-40 (Layer 1c-11: monthly-checkin.html → `bus.publish('monthly_checkin:submitted', { iso_month })` shipped)

- 📋 **OPEN (P0) — PM-41: Layer 1c-12 — TBD specific row.** Twelfth 1c migration. THREE remaining 1c surfaces post-PM-40. Pre-flight at next session start (HEAD will be `21bb6f3c` = the PM-40 ship) to pick. Candidates: (a) **shared-workout.html** — workout sharing flow, single page, zero primitives → ASYMMETRIC, likely emits `workout:shared` (taxonomy ADD). bus.js NOT loaded yet — first new wiring. Achievement track for sharing exists per the live portal audit; consider self-subscribe pattern. (b) **certificate.html / certificates.html** — certificate generate / view flows, zero primitives → ASYMMETRIC. May emit `certificate:earned` (when achievement tier completes) or `certificate:viewed` (when member opens cert). Achievement-adjacent — self-subscribe pattern likely fits. Two pages but possibly one publish surface. (c) **live-session pages** — eight pages (yoga-live, mindfulness-live, therapy-live, events-live, education-live, podcast-live, workouts-live, checkin-live) ALL share session-live.js. ONE shared module = one publish surface, multiple consumer pages. Emits likely `session:joined` or `session:viewed` (ADD). Most complex of the three remaining — probably should be 1c-14 (last). **Recommendation: shared-workout next (smallest blast radius, clean asymmetric pattern).** Then certificate. Then live-sessions as 1c-14 (most care needed).

- ✅ **CLOSED — PM-40 above.** vyve-site `21bb6f3cd58fc3f628a67c60b5e619e106079d49`. Eleventh 1c migration. Single publishing surface (submitCheckin at monthly-checkin.html:728-810), ASYMMETRIC fallback, NEW event `monthly_checkin:submitted` (taxonomy ADD). Fourth asymmetric-fallback migration after PM-35, PM-36-deleteLog, PM-38. Pre-bus had 1 evaluate at L760, 0 invalidate, 0 record — same shape as PM-35 workouts-builder. **bus.js script tag NOT needed** — page already loads bus.js since PM-30 era for existing `habit:logged` subscriber. First 1c migration since PM-30 with no new bus.js wiring. Subscribers: index.html `_markHomeStale` extended (tenth event); engagement.html intentionally NOT wired (third intentional non-touch — no monthly_checkin component in scoring); monthly-checkin.html self-subscriber for achievements eval (PM-37/PM-39 self-subscribe pattern). Coexists with PM-30 habit:logged subscriber (verified by self-tests 11.1/11.2/11.3 — independent fan-outs, isolated event names). Schema: `{ iso_month: 'YYYY-MM' }` with zero-padded month for January and December edge cases verified. 34/34 self-tests passing across 11 groups. Audit-count delta: publish 16→17 (+1), subscribe 22→24 (+2); invalidate/record/evaluate unchanged. See PM-40 changelog entry for full detail.

- ✅ **RESOLVED — P3 audit-count classification clarification (raised at PM-39 close).** PM-40 codified the methodology in §23 NEW sub-rule: count source-code call sites unconditionally regardless of runtime branch. Calls inside `if (!window.VYVEBus) { ... }` else-branches still count. The §23 audit-count classification rule (PM-37) is about source-code call sites at **static analysis time**, not runtime invocation paths. Discriminator: does the line of source code contain a call to one of the four primitives, after applying the existing exclusions (comments, typeof guards, function definitions, object property keys)? If yes, it counts — regardless of branch context. Practical implication: PM-30..PM-40 audit counts are stable under this discipline (no methodology drift); future migrations preserve the convention.

- 📋 **CARRIED FORWARD (P3) — Cache-version date convention drift.** `vyve-cache-v2026-05-09-pmNN-X-Y` carries date prefix from PM-30 through PM-40. Today's wall clock is still 09 May 2026 per the system clock. Recommend the convention bump happens at the first session that crosses midnight UK time. PM-41 should check at session start.

- 📋 **CARRIED FORWARD (P3) — log-food.html cross-tab diary-cache coherence.** Punt to Layer 3 unless Lewis flags real cross-tab diary editing patterns.

## Added 09 May 2026 PM-39 (Layer 1c-10: wellbeing-checkin.html → `bus.publish('wellbeing:logged', { kind:'live'|'flush', ... })` shipped)

- ✅ **CLOSED — PM-39 above.** vyve-site `1a5d9ef8b1c4909c32e0f2199755dc52a7f0a9e6`. Tenth 1c migration. TWO publishing surfaces (live submitCheckin + deferred flushCheckinOutbox), SYMMETRIC fallback on both with mixed pre-bus shapes (live had invalidate + evaluate; flush had invalidate-only). NEW event `wellbeing:logged` with `kind:'live'|'flush'` discriminator. Real bug fix: engagement Wellbeing component never invalidated on check-in submission pre-PM-39; closes via NEW engagement.html subscriber for wellbeing:logged. **First 1c migration since PM-36 where engagement.html is wired.** Subscribers: index.html _markHomeStale extended (ninth event); engagement.html _markEngagementStale extended (NEW); wellbeing-checkin.html self-subscriber for achievements eval (PM-37 pattern — "The Elite" 30-week-checkin track). bus.js script tag added to wellbeing-checkin.html (first new wiring since PM-38). 41/41 self-tests passing across 12 groups. NEW §23 sub-rule codified: per-surface race-fix ordering for queue-drain surfaces (publish AFTER res.ok on confirmer surfaces; publish BEFORE fetch on initiator surfaces). Audit-count delta: publish 14→16 (+2 both surfaces), subscribe 19→22 (+3 across three subscriber pages). See PM-39 changelog entry for full detail.

- 📋 **NEW (P3) — Audit-count classification clarification needed.** PM-37 §23 audit-count classification rule says "any non-comment, non-typeof-guard, non-function-definition line that contains a CALL to one of the four primitives". With PM-39's symmetric fallback, the inline `invalidateHomeCache` and `VYVEAchievements.evaluate` calls have moved INTO `if (!window.VYVEBus) { ... }` else-branches, but the call sites are still present in the code. Question: do they count for the publish-site primitive count? Strict reading says yes (they're real call sites at runtime when bus.js is absent). Methodological reading might say no (they only fire in the fallback path, never in the modern bus path). PM-40 pre-flight should produce the post-PM-39 canonical counts and decide the methodology — either: (a) count call sites unconditionally (bus path + fallback path both count); (b) count only-fires-unconditionally call sites (anything inside `if (!window.VYVEBus)` doesn't count because it's bus-fallback-only). Recommendation: option (a), since the rule is about source-code call sites, not runtime invocation paths. Either way, codify the choice in §23 at PM-40. Tag: methodology, lightweight.

- 📋 **CARRIED FORWARD (P3) — Cache-version date convention drift.** `vyve-cache-v2026-05-09-pmNN-X-Y` carries date prefix from PM-30 through PM-39. Today's wall clock is still 09 May 2026 per the system clock. Recommend the convention bump happens at the first session that crosses midnight UK time. PM-40 should check at session start.

- 📋 **CARRIED FORWARD (P3) — log-food.html cross-tab diary-cache coherence.** Punt to Layer 3 unless Lewis flags real cross-tab diary editing patterns.

## Added 09 May 2026 PM-38 (Layer 1c-9: settings.html persona switch → `bus.publish('persona:switched', ...)` shipped)

- ✅ **CLOSED — PM-38 above.** vyve-site `a0b98f17f2b2cc96995f66f8696b8e8864ec732f`. Ninth 1c migration. Single publishing surface (`savePersona` at settings.html:1213-1258), ASYMMETRIC fallback, NEW event `persona:switched` (taxonomy ADD). Third asymmetric-fallback migration after PM-35 + PM-36-deleteLog. Real bug fix on the way through: pre-PM-38 `vyve_members_cache_<email>` (read by nutrition.html populatePage:842 for per-persona protein-guidance copy) was never invalidated on persona change. Bus path closes the gap via NEW `_markMembersCacheStale` subscriber on index.html (busts the key directly) + extension of `_markHomeStale` to persona:switched. engagement.html intentionally NOT wired (no persona component in scoring). achievements eval NOT wired (persona switching isn't an achievement event — PM-37 self-subscribe pattern correctly does not apply). bus.js script tag added to settings.html. 30/30 self-tests passing across 10 groups. NEW §23 hard rule codified: asymmetric-fallback discipline elevated from recurring per-commit footnote to hard rule. Audit-count delta: publish 13→14, subscribe 17→19; invalidate/record/evaluate unchanged. See PM-38 changelog entry for full detail.

- 📋 **CARRIED FORWARD (P3) — Cache-version date convention drift.** `vyve-cache-v2026-05-09-pmNN-X-Y` carries date prefix `2026-05-09` from PM-30 through PM-38. Today's wall clock is still 09 May 2026 per the system clock; the prefix is technically still accurate this session. Recommend the convention bump happens at the first session that crosses midnight UK time. PM-39 should check at session start.

- 📋 **CARRIED FORWARD (P3) — log-food.html cross-tab diary-cache coherence.** Same shape as PM-33's cross-tab cardio.html cache-bust. Punt to Layer 3 unless Lewis flags real cross-tab diary editing patterns. Tag: post-1c-14, Layer 3 considerations.

## Added 09 May 2026 PM-37 (Layer 1c-8: nutrition.html weight log → `bus.publish('weight:logged', ...)` shipped)

- ✅ **CLOSED — PM-37 above.** vyve-site `c1c731a1df61e69871626794b06e4bd8b0e210b8`. Eighth 1c migration. Single publishing surface (`saveWtLog` at nutrition.html L631-673), SYMMETRIC fallback, NEW event name `weight:logged` (taxonomy ADD). Race-fix: bus.publish lands BEFORE writeQueued/supa POST. Subscribers: index.html `_markHomeStale` extended source-agnostic to weight:logged (mirrors the six prior events); nutrition.html self-subscribes for achievements eval (NEW pattern — page-owned achievement journey); engagement.html intentionally NOT wired (engagement scoring has no weight component — first 1c migration where engagement.html is non-touched). bus.js script tag added to nutrition.html (first new wiring since PM-36). 31/31 self-tests passing across 11 groups. Two pre-flight taxonomy editorial corrections folded in: `wb_last` is the wellbeing-score cache (NOT weight) — strike from taxonomy; `saveWtLog` writes only to weight_logs (not members) — the members.weight_kg write is in the TDEE recalculator at L1302, separate feature — strike `members` from 1c-8 scope. Net taxonomy correction: 1c-8 is REFACTOR + race-fix only, no scope-fix. NEW §23 sub-rules codified: (a) self-subscribe pattern for page-owned achievement journeys; (b) audit-count classification (resolves P3 recon below — canonical post-PM-36 counts 11/8/19/13/17 for invalidate/record/evaluate/publish/subscribe). See PM-37 changelog entry for full detail.

- ✅ **CLOSED (P3) — Audit-count methodology recon (was open from PM-35 close).** Canonical post-PM-36 counts at HEAD `640c9d69` with PM-32 + PM-28 + comment exclusions applied: `VYVEData.invalidateHomeCache()` = **11**, `VYVEData.recordRecentActivity()` = **8**, `VYVEAchievements.evaluate()` = **19**, `VYVEBus.publish()` = **13**, `VYVEBus.subscribe()` = **17**. PM-35-close numbers (11/8/19) match canonically. Earlier "13/8/15" disagreement was a different methodology (likely included subscriber-internal duplicates from comments or counted publish/subscribe in the same bucket). NEW §23 sub-rule codifies the classification. Use 11/8/19/13/17 as the PM-38 pre-flight baseline. Closes the recon backlog item.

- 📋 **CARRIED FORWARD (P3) — Cache-version date convention drift.** `vyve-cache-v2026-05-09-pmNN-X-Y` carries date prefix `2026-05-09` from PM-30 through PM-37. Today's wall clock is still 09 May 2026 per the system clock; the prefix is technically still accurate this session. Recommend the convention bump happens at the first session that crosses midnight UK time. Either bump the date prefix or move to a sequence-number-only convention (`vyve-cache-v00073-X-Y`). PM-38 should check at session start. Tag: lightweight, decide-and-codify when triggered.

- 📋 **CARRIED FORWARD (P3) — log-food.html cross-tab diary-cache coherence.** Same shape as PM-33's cross-tab cardio.html cache-bust. When log-food.html is open in two tabs viewing the same date and a member logs/deletes in tab A, tab B's `vyve_food_diary:<email>:<date>` cache won't bust until next page render — log-food.html doesn't self-subscribe to food:logged/food:deleted today. The diary cache is per-member-per-date; cross-tab nutrition logging is a small rounding error at current scale and Layer 3 (Realtime row events on nutrition_logs) will close it more cleanly. Punt to Layer 3 unless Lewis flags real cross-tab diary editing patterns. Tag: post-1c-14, Layer 3 considerations.

## Added 09 May 2026 PM-36 (Layer 1c-7: log-food.html 3 publish surfaces → `bus.publish('food:logged' | 'food:deleted', ...)` shipped)


- ✅ **CLOSED — PM-36 above.** vyve-site `640c9d69818bf136b657f52bf17f3644598ce117`. Seventh 1c migration. **First commit shipping two distinct event names from one publishing page** (food:logged + food:deleted) and **first to ship MIXED fallback shapes in one commit** (symmetric on both insert paths logSelectedFood + logQuickAdd; asymmetric on the delete path deleteLog). Three publish surfaces (not two as the taxonomy row claimed) — both insert paths fold into food:logged with kind:'search'|'quickadd' discriminator; deleteLog publishes food:deleted. Both event names are taxonomy ADDs. Bug fix on the way through: deleteLog had ZERO primitives pre-PM-36 — home dashboard's today's calorie ring + engagement_cache score component never refreshed after a food delete until next sign-in. Bus path closes that gap via index.html `_markHomeStale` and engagement.html `_markEngagementStale` subscribers (both extended source-agnostic to food:logged + food:deleted). bus.js script tag added to log-food.html (first new wiring since PM-34/movement.html). NEW §23 sub-rule codified: mixed-fallback discipline (per-surface classification of symmetric vs asymmetric based on what was firing pre-bus at THAT specific publish site, not per-commit). PM-12 outbox-cancellation logic in deleteLog preserved (verified self-test 11.1/11.2). 51/51 self-tests passing across 15 groups including race-fix on all 3 surfaces, event isolation between food:logged and food:deleted, mixed-fallback count discipline, and PM-30/31/32/33/34/35 regression. Schema: food:logged `{ client_id, meal_type, calories_kcal, kind:'search'|'quickadd' }`; food:deleted `{ client_id, meal_type }`. See PM-36 changelog entry for full detail.

- 📋 **NEW (P3) — log-food.html cross-tab diary-cache coherence.** Same shape as PM-33's cross-tab cardio.html cache-bust. When log-food.html is open in two tabs viewing the same date and a member logs/deletes in tab A, tab B's `vyve_food_diary:<email>:<date>` cache won't bust until next page render — log-food.html doesn't self-subscribe to food:logged/food:deleted today. The diary cache is per-member-per-date; cross-tab nutrition logging is a small rounding error at current scale and Layer 3 (Realtime row events on nutrition_logs) will close it more cleanly. Punt to Layer 3 unless Lewis flags real cross-tab diary editing patterns. Tag: post-1c-14, Layer 3 considerations.

- 📋 **NEW (P3) — Cache-version date convention drift.** `vyve-cache-v2026-05-09-pmNN-X-Y` has now carried the same date prefix from PM-30 through PM-36 across two real-world calendar days (or potentially more). Either bump the date prefix when calendar advances or move to a sequence-number-only convention (`vyve-cache-v00072-X-Y`). The current convention works because each PM-NN tag uniquifies the key, but the date prefix is misleading — it suggests deploy timing that may not match the real wall clock. Decide before next deploy day. Risk if not addressed: a future Claude or Dean-eyeballing-the-cache-key may infer wrong about deploy recency. Tag: low-priority hygiene, address pre-PM-37 if convenient.

## Added 09 May 2026 PM-35 (Layer 1c-6: workouts-builder.js custom workout creation → `bus.publish('workout:logged', source:'builder', ...)` shipped)



- ✅ **CLOSED — PM-35 above.** vyve-site `218dfe8be75c3e97f6920ae45f680fec032438b3`. Sixth Layer 1c migration; smallest commit in the campaign so far. Single primitive (`VYVEAchievements.evaluate()` at workouts-builder.js:109 on POST/create path) collapses to `bus.publish('workout:logged', source:'builder', ...)` published BEFORE the fetch (race-fix). PATCH/edit path untouched — silent both before and after, matching today's POST-only eval semantic. **First Layer 1c migration to ship asymmetric fallback** — pre-PM-35 had only `evaluate` at the publish site (no `invalidate`, no `record`); the bus path closes that gap via subscribers; the `!VYVEBus` else-branch preserves prior shipping code by firing only `evaluate`. Codified as a §23 hard rule (symmetric vs asymmetric fallback classification at pre-flight time). Three subscribers all source-agnostic for workout:logged — index.html, engagement.html, workouts.html (workouts.html's source-gated programme_cache stale is internal to the handler, gated on `source === 'programme'`, correctly bypasses for `source:'builder'`). bus.js already wired on workouts.html host page since PM-31 — no new script tag. **Taxonomy editorial fixes on the way through:** `workout:logged` Subscribers column patched to remove exercise.html (zero VYVEBus refs, not a subscriber) + remove achievements.js (invoked via direct evaluate calls from subscribers, not via bus subscription) + add engagement.html (PM-33 bonus subscriber missing from the list). 43/43 self-tests passing across 13 groups including PATCH path silence, asymmetric-fallback verification, and PM-30/31/32/33/34 regression suite. Whole-tree primitive audit at HEAD `5e404079`: 11/8/19 (record matches prompt's 13/8/15; invalidate -2; evaluate +4 due to subscriber-internal eval calls in workouts.html PM-31/PM-32 subscriber bodies counted as raw call sites). Publishing-surface count change at workouts-builder.js: **0/0/0**. Methodology drift against broader portal flagged for separate audit-recon commit before PM-36. See PM-35 changelog entry for full detail.

- 📋 **NEW (P3) — Audit-count methodology recon before PM-36.** PM-35 whole-tree audit returned 11/8/19 against the prompt's stated 13/8/15 post-PM-34. Record matches; invalidate is 2 lower; evaluate is 4 higher. Suspected drivers: (1) subscriber-internal evaluate calls inside `workouts.html:588` (PM-31 workout:logged subscriber) and `workouts.html:614` (PM-32 set:logged subscriber) are counted as raw call sites by my regex but are publish-surface-irrelevant — they fire downstream of bus events, not at publishing sites. PM-31/PM-32 audits may have excluded these, or my exclusion regex is over-aggressive; (2) `workouts-session.js:417` and `:767` may be edge-case primitives (one of these is likely the share-workout path → `workouts-programme.js:391` → 1c-14 territory) which a stricter "1c-migratable publish-site primitive" classifier would exclude; (3) invalidate -2 could be PM-33 dropping primitives without the count being updated, or my regex catching too few. Pre-PM-36 work: re-run the audit with PM-31/PM-32/PM-33/PM-34 ship HEADs, classify each call site as publish-site primitive vs subscriber-internal vs share-flow, and codify a precise §23 sub-rule for subsequent audits. Not blocking PM-35; flagged so PM-36 doesn't replicate the drift.

## Added 09 May 2026 PM-34 (Layer 1c-5: movement.html walk + non-walk paths → `bus.publish` shipped)



- ✅ **CLOSED — PM-34 above.** vyve-site `5e4040797ddce859026c4c61def20448723228a6`. Two publishing surfaces in movement.html (markDone + logMovement) collapsed to one bus event each (markDone → workout:logged source:'movement'; logMovement walk → cardio:logged source:'movement_walk'; logMovement non-walk → workout:logged source:'movement'). NO new subscribers needed — all wired from PM-31 + PM-33 + PM-33-bonus. workout_plan_cache PATCH heartbeat boundary preserved per PM-31 invariant. Distance hoist refactor in logMovement walk path. 47 of 47 self-tests passing including the heartbeat boundary check (1 event total across markDone POST + PATCH + removeItem). Counts unchanged at 13/8/15 per PM-33 symmetric-fallback rule. Taxonomy patched: workout_id widened to <int|string>? for explicit nullability. See PM-34 changelog entry for full detail.

## Added 09 May 2026 PM-33 (Layer 1c-4: cardio.html log → `bus.publish('cardio:logged', ...)` shipped)

- ✅ **CLOSED — PM-34 above.**** Fifth 1c migration. PM-33 split out cardio.html alone; movement.html is one commit because the walk and non-walk paths share the same primitives block at L687-L697 (the if/else only branches the fetch URL/payload + `recordRecentActivity('cardio'|'workout')` arg). Discriminate inside the bus-publish block on `isWalk`: walk → `bus.publish('cardio:logged', { cardio_type:'walking', duration_min, distance_km, source:'movement_walk' })`, non-walk → `bus.publish('workout:logged', { workout_id:<client UUID>, completed:true, duration_min, source:'movement' })`. Same option-(a) discipline. The first primitives block (movement.html L483-L495, programme-session completion path) is a separate publish site that maps to `workout:logged source:'movement'` too — should fold into the same commit if the audit confirms it's exactly equivalent to the walk-pill non-walk path's output, otherwise split as 1c-5b. Pre-flight against live source decides. Adds `<script src="/bus.js" defer>` to movement.html. Subscribers per taxonomy: index.html (home-stale via `_markHomeStale` — already wired for both events), engagement.html (engagement-stale — already wired for both events from PM-33), workouts.html (achievements eval for workout:logged — already wired from PM-31), cardio.html (achievements eval for cardio:logged — already wired from PM-33). **No new subscriber wiring needed** — pure publishing-site migration. SW cache bump same atomic commit.

- ✅ **CLOSED — PM-33 above.** vyve-site `fe7e06ce52abb42e55034cfb0145c2297ce9ccbc`. Three primitive sites in cardio.html `logCardio` (L643/L646/L648) collapsed to one `bus.publish('cardio:logged', ...)` published optimistically BEFORE the POST fetch (race-fix). Subscribers wired on index.html (home-stale extending the existing handler), engagement.html (NEW block — also folds in habit/workout/set:logged staleness as a bonus fix, closing the engagement-cache invalidation gap), cardio.html (NEW block — eval only). 39 of 39 self-tests passing. Whole-tree primitive counts stay at 13/8/15 — symmetric bus-fallback else-branch preserves all three primitives one-for-one. Taxonomy patched: cardio_id widened to `<int>?` (Prefer:return=minimal means no server PK), `vyve_cardio_cache` annotated as page-local-self-busts (false-positive scope-fix in original draft). Layer 4 reconcile-and-revert codified as out-of-scope for Layer 1c via §23 hard rule. See PM-33 changelog entry for full detail.

- 📋 **NEW (P3) — Cross-tab cardio.html cache-bust on cross-tab cardio:logged.** When cardio.html is open in two tabs and a member logs in tab A, tab B's vyve_cardio_cache won't bust (cardio.html doesn't self-subscribe to cache-bust per PM-33 — its post-await self-bust + re-fetch path handles the publishing tab only). Cross-tab self-cache-bust is a rounding error at current scale and Layer 3 (Realtime row events) will close it more cleanly. Punt to Layer 3 unless Lewis flags real cross-tab cardio sessions. Tag: post-1c-14, Layer 3 considerations.

## Added 09 May 2026 PM-32 (Layer 1c-3: workouts-session.js saveExerciseLog → `bus.publish('set:logged', ...)` shipped)

- ✅ **CLOSED — PM-33 above.** Layer 1c-4 shipped. Original PM-33 backlog framing was right on race-fix mechanic and cardio_cache scope-fix being a key motivation — pre-flight at PM-33 corrected the cardio_cache framing (it's page-local, no cross-page consumer) and re-targeted the scope-fix at engagement_cache (the actual gap). Engagement-stale bonus fix on habit/workout/set:logged folded in. Movement.html walk pill split out to PM-34 (above).** Fourth 1c migration per the taxonomy plan. cardio.html L642-L643 invalidate + L645-L646 record + L648 evaluate — three primitive sites collapse to one `bus.publish('cardio:logged', { cardio_id, cardio_type, duration_min, distance_km, source: 'cardio_page' })`. Migration label REFACTOR + race-fix + scope-fix per taxonomy: race is the 200-800ms post-await invalidate gap (cardio.html does direct fetch then post-await invalidate — home reads pre-tick state in that window); the bus version publishes optimistically *before* the fetch. Scope-fix: `vyve_cardio_cache` and `vyve_engagement_cache` need staleness on cardio:logged but aren't currently invalidated. The taxonomy 1c-7 row also flags movement.html walk pill as a second publish site for the same event (PM-15 04 May routed walks-as-cardio) with `source:'movement_walk'` — pre-flight against live source to decide whether to fold both publish sites in PM-33 or split (movement.html could land in 1c-5 separately). Subscribers per taxonomy: index.html (home-stale via `_markHomeStale`), cardio.html (own cache + eval), engagement.html (engagement_cache stale), achievements.js (eval). Adds `<script src="/bus.js" defer>` to cardio.html (and movement.html if folded into PM-33). Same option-(a) discipline. SW cache bump same atomic commit.

- ✅ **CLOSED — PM-32 above.** vyve-site `392316a86bd94f01fe3a44ef38837ce1ed857d2c`. Three primitive sites in saveExerciseLog (L405/L406 writeQueued + L412 legacy fallback) collapsed to one `_publishSetLogged()` helper called from both write paths. Subscribers wired on index.html (home-stale extending the existing `_markHomeStale` handler) and workouts.html (achievements eval extending the existing `__vyveWorkoutsBusWired` block). Schema: `{ exercise_log_id, exercise_name, set_number, reps, weight_kg }` — `set_number` renamed from taxonomy's `sets` for clarity (it's a 1-based set index, not a count). Bug-fix on the way through: legacy fallback path now stales home (pre-PM-32 it only fired evaluate). Pre-flight scope corrections: exercise.html is NOT a `set:logged` subscriber (it's the Exercise Hub landing page, reads workout_plan_cache not exercise_logs); the "PR strip" is on workouts.html and is a completion-screen element shipped in PM-31; the "next-set hint" is `checkProgressNudge`/`checkOverloadNudge` which fire pre-save from in-memory state, not as bus subscribers. Taxonomy patched with the corrections. 20 of 20 self-tests passing. Whole-tree audit reconciled PM-31's reported 15/12/18 to 14/8/18 — codified as a §23 sub-rule that primitive call-site audits exclude `typeof X === 'function'` guard lines.

## Added 09 May 2026 PM-31 (Layer 1c-2: workouts-session.js complete → `bus.publish('workout:logged', ...)` shipped)

- ✅ **CLOSED — PM-32 above.** Third 1c migration shipped. Scope corrections against the taxonomy's `set:logged` subscriber list documented in changelog and master.md. exercise.html confirmed out of scope for this event. The P3 spike on `vyve_exercise_cache_v2` resolved: the cache holds programme JSON (not exercise log data) and is correctly out of scope for `set:logged` — its stale-on-write trigger is `programme:updated` (open ADD migration) only.

- ✅ **CLOSED — Pre-PM-32 spike resolved.** `vyve_exercise_cache_v2` is NOT staled by `set:logged`. exercise.html reads `workout_plan_cache` (programme structure: programme_name, weeks, current_session), not `exercise_logs`. The cache is correctly out of scope for set-level events; its stale-trigger is `programme:updated` (open ADD migration in the taxonomy).

- ✅ **CLOSED — PM-31 above.** See changelog 09 May PM-31 entry for full detail.

## Added 08 May 2026 PM-30 (Layer 1c-1: habits → `bus.publish('habit:logged', ...)` shipped)

- ✅ **CLOSED — PM-31 above.** vyve-site `ee0497a5`. Single publish site (the original "two complete handlers" framing from the taxonomy was incorrect against live source — there's one unified `completeWorkout()` at L531 routing both programme and custom). Subscribers wired on workouts.html + index.html. exercise.html dropped from scope — its cache key is for `set:logged` (1c-3), not `workout:logged`. 46 of 46 self-tests passing.

- 📋 **NEW (P3) — Option-(b) cleanup commit after 1c-14.** Once all 14 Layer 1c migrations have shipped, kill `VYVEData.invalidateHomeCache` / `recordRecentActivity` / `getOptimisticActivityToday` as external surfaces and fold their logic into bus subscriber handlers per page. Currently option-(a): the existing primitives stay live, subscribers call them internally. Option-(b) is the cleaner endpoint but only safe to ship once every direct-call site is gone, otherwise the contract gap re-introduces the very stale-paint bug the bus migration is fixing. Tag: post-PM-44ish, after-1c-14 cleanup commit.

- ✅ **CLOSED — PM-30 above.**

## Added 08 May 2026 PM-29 (`bus.js` shipped — Layer 1b foundation for the cache-bus)

- ✅ **CLOSED — PM-30: Layer 1c-1 — habits → `bus.publish('habit:logged', ...)` shipped.** vyve-site `27eaeafd`. Three habits.html publish sites collapsed (logHabit / runAutotickPass / undoHabit) to one bus event each. Subscribers wired on habits.html (in-memory + cache merge + breadcrumb + eval-on-yes/autotick), index.html (home-stale via existing `VYVEData.invalidateHomeCache(envelope.email)` per option-(a) signalling decision), monthly-checkin.html (recap-stale + visibility/step-gated re-fetch). Schema: `is_yes: true|false|null` with `autotick?:true`; undo = `is_yes:null`. Bug-fix on the way through: autotick now grants achievement credit (silent gap pre-PM-30). 33 of 33 self-tests passing. Direct-call counts now 10/7/13 (invalidate/record/evaluate). `<script src="/bus.js" defer>` added to habits.html and monthly-checkin.html. SW cache `pm29-bus-a` → `pm30-habits-a`. See PM-30 changelog entry for full detail.

- 📋 **NEW (P3) — Add `<script src="/bus.js" defer>` to remaining portal pages as Layer 1c migrations consume them.** After PM-30: 3 portal pages carry the tag (index.html, habits.html, monthly-checkin.html). Each subsequent 1c-* migration adds it to the pages that page-specifically subscribe. Eventually all standard portal pages will carry the script tag. Tracked here for visibility — not actionable as a standalone item; bundles into each 1c-* migration commit.

- 📋 **NEW (P3) — Session-player pages (events-live / events-rp / session-live / session-rp) sign-out skips `auth:signed-out`.** PM-29 documented limitation. The inline `#logoutBtn` click handler bound at `auth.js:L93` (`vyveBindLogout`) does NOT route through `window.vyveSignOut`. If we ever care about consistent sign-out telemetry across all surfaces, replace the inline handler with a call to `window.vyveSignOut`. Low priority — full-screen session contexts are rare and the user is leaving anyway.

- ✅ **CLOSED — PM-29 above.**

## Added 08 May 2026 PM-28 (cache-bus taxonomy patch · 1c-14 resolved · `vyve_dashboard_cache` deprecated · brain-only)

- 📋 **NEW (P3) — Remove dead read at `achievements.js:L251`.** `replayUnseen()` reads `localStorage.getItem('vyve_dashboard_cache')` expecting shape `cached.data.achievements.unseen`. PM-28 whole-tree audit at HEAD `040c496d` confirmed zero writers tree-wide and zero producers of the `.unseen` shape — read is a no-op every time. Surgical removal of L251 (and the dependent L252-260 block; L262 `if (Array.isArray(unseen)...)` becomes unreachable). Bundle into PM-29 SW bump or a 1c-* migration commit — not worth a one-line standalone.

- 📋 **NEW (P3) — Tighten the taxonomy's "Existing cache keys" callout.** PM-28 sub-audit surfaced live cache keys present in the tree but not enumerated in the taxonomy's callout: `vyve_settings_cache`, `vyve_workout_start`, `vyve_perf_enabled`, `vyve_checkin_done`, `vyve_lb_anon_banner_dismissed_<id>`, `vyve_notif_<email>`, `vyve_theme_synced_at`, `vyve_healthkit_*` (3 keys). Some are bus-irrelevant (theme sync timestamp, healthkit declined-at, notif prefs); others (`settings_cache`, `workout_start`, `checkin_done`) likely deserve treatment under future bus events. Whole-tree-verified inventory before 1c-* migrations consume it. Not bus-blocking.

- 📋 **NEW (P3) — `shareCustomWorkout` achievement-evaluate gap.** `workouts-session.js:742 shareCustomWorkout` does NOT fire `VYVEAchievements.evaluate()` after a successful share-workout EF POST, unlike the sibling `shareProgramme` (workouts-programme.js:391) and `shareWorkout` (workouts-session.js:733) which both do. Question for Lewis: should sharing a custom workout grant achievement credit, parity with programme/session shares? Schema for the upcoming `workout:shared` bus event reserves `kind:'custom'` for forward-compat. Decision feeds the 1c-14 migration but doesn't block it (current behaviour preserved on bus rename).

- ✅ **CLOSED — PM-28 above.**

## Added 08 May 2026 PM-26 (whole-tree audit method codified · taxonomy patched · pre-bus prep)

- ✅ **CLOSED — PM-28: `vyve_dashboard_cache` confirmed dead.** Whole-tree multi-pattern grep at HEAD `040c496d` (literal + dynamic-key construction + bracket-access) found a single read at `achievements.js:251` and zero writers anywhere in the 72-file tree. The shape `cached.data.achievements.unseen` is referenced nowhere else — no producer in the portal. Read is a no-op every time. Removed from `auth:signed-out` bus cleanup scope. See `playbooks/cache-bus-taxonomy.md` Audit history (PM-28 patch).

- ✅ **CLOSED — PM-27: Email-key the outbox — DONE 08 May PM-27.** Migrated `vyve_outbox` / `vyve_outbox_dead` localStorage keys to per-member `vyve_outbox_<email>` / `vyve_outbox_dead_<email>` with one-shot adoption inside `outboxList()`/`deadList()`. Whole-tree audit (vyve-site `df41d7cb`, all 72 source files) found the only direct-string consumer outside `vyve-offline.js` was `log-food.html:805` (cancel-pending-insert path) — added `VYVEData.outboxReplace(items)` and rewired. SW `v2026-05-08-perf-shim-f` → `v2026-05-08-pm27-outbox-a`. vyve-site commit [`040c496d`](https://github.com/VYVEHealth/vyve-site/commit/040c496d6b1651359cad76f550d54fdf9fd63d05).

- ✅ **CLOSED — PM-28: Cache-bus taxonomy patch committed to VYVEBrain.** Brain-only. Two sub-audits resolved (1c-14 → `workout:shared`, `vyve_dashboard_cache` → dead key) + PM-26 changelog editorial fix folded in (evaluate count corrected 20 → 16, invalidate-line text aligned with audit-history block). 5 surgical edits to `playbooks/cache-bus-taxonomy.md`, 1 prepend + 1 in-place edit to `brain/changelog.md`, 3 backlog mutations.

- ✅ **CLOSED — PM-29: `bus.js` shipped.** vyve-site `25b112e9`. New file `bus.js` (240 lines) with full publish/subscribe/unsubscribe API on `window.VYVEBus`, in-tab + cross-tab transport via `storage` event, auth bridge wrapping `vyveSignOut`, 43 of 43 self-tests passing. SW cache `pm27-outbox-a` → `pm29-bus-a`; `/bus.js` added to `urlsToCache`; script tag inserted at index.html:L302. No subscribers wired (Layer 1c work). See `playbooks/cache-bus-taxonomy.md` and PM-29 changelog entry.

- ✅ **CLOSED — PM-25's "PM-18 ship-truth drift" finding withdrawn.** Whole-tree audit at PM-26 confirmed nav.js contains the touchstart wiring exactly as the PM-18 changelog claimed. Self-inflicted false negative from hand-picked file subset. New §23 hard rule (PM-26) codifies the audit-method discipline that prevents recurrence.

## Added 08 May 2026 PM-23 (drift audit · `brain/audits/2026-05-08_drift_audit.md` · 19 hits)

- 📋 **OPEN (Critical, P0) — Drift audit remediation: critical-tier fixes.** Three hits that will break a future session's pre-flight. (1) §6 line 216 + §23 line 1130 `member_home_state` trigger claim is materially wrong: live triggers are on 8 source tables (`cardio`, `daily_habits`, `replay_views`, `session_views`, `weekly_goals`, `weekly_scores`, `wellbeing_checkins`, `workouts`), NOT 10 — the 3 `member_health_*` tables don't carry the trigger and `weekly_scores` does. Trigger name is `zzz_refresh_home_state` (function name is `tg_refresh_member_home_state`). (2) §6 header says "76 tables", live is 85. (3) §7 "Core operational" table omits the 6 GDPR EFs (`gdpr-erase-{request,cancel,status,execute}`, `gdpr-export-{request,execute}`) — they're in §19 and the cron table only. Full audit and proposed corrections at `brain/audits/2026-05-08_drift_audit.md`. ~30 min for the three Critical fixes if done in isolation; ~90 min if combined with the High and Medium tier in the same pass.

- 📋 **OPEN (High, P1) — Drift audit remediation: high-tier fixes.** Two hits. (1) §6 missing 5 live tables: `gdpr_erasure_requests`, `gdpr_export_requests`, `perf_telemetry`, `exercise_canonical_names`, `exercise_name_misses`. Add a "GDPR" subsection and a "Telemetry" subsection (or fold telemetry into "Dashboard + aggregation"). (2) §19 PM-1 entry trailer noting EF count subsequently rose to 96 from same-session PM-21 / PM-22 ships.

- 📋 **OPEN (Medium, P2) — Drift audit remediation: stale counts.** Five hits, all numeric. (1) `member_home_state` 58 → 65 columns. (2) §7 EF total 86 → 96. (3) §7 cron header "(19 active)" → "(20 active)". (4) §24 SW cache key drop or update — bumps every commit, suggest dropping. (5) §24 Stripe redirect target verify (`welcome.html` vs `onboarding_v8.html`).

- 📋 **OPEN (Low, P3) — Drift audit remediation: cosmetic.** Three hits. §7 cron `vyve_charity_reconcile_daily` row format. §7 versioning-note stale numerical examples. §24 iOS 1.2 approval cross-check.

- 📋 **OPEN — Backlog cleanup follow-up.** Remove the stale "Still pending PM-22 — leaderboard snapshot table + cron + EF rewrite" line from `tasks/backlog.md` line 64. PM-22 actually shipped as the `get_leaderboard()` RPC (the reframe), captured in the closed-items section at the top of the backlog. The "Still pending" entry is the original framing pre-reframe.

- ✅ **CLOSED — Audit method.** Single end-to-end reverse-chronological walk through changelog.md against master.md sections + forward sweep of master.md for falsifiable claims + backlog reconciliation. Live-state introspection on every concrete claim: 85 tables, 96 ACTIVE EFs, 20 active cron jobs, 15 members, 65 `member_home_state` columns, 8 trigger source tables (verified via `pg_trigger` join `pg_class` filtered by definition LIKE %refresh_member_home_state%), `vyve-site` HEAD `df41d7cb`, live SW cache key `vyve-cache-v2026-05-08-perf-shim-f`. All checks documented in the audit report. No code shipped this session — report is the deliverable.

## Added 08 May 2026 PM-22 (`leaderboard` v17 · SQL-side ranking via `get_leaderboard()` RPC)

- ✅ **CLOSED — Reframing decision: snapshot table → SQL-side ranking.** Pre-flight against the live `leaderboard` source showed v11/v16 was already reading from `member_home_state` (not aggregating activity tables — that work was done when the aggregate was built). The actual cliff is the JS sort + 50MB+ wire payload at 100K members, not live aggregation. Snapshot table would add 24h staleness for no underlying win — the cron still has to sort over all members, and the leaderboard is a feature where real-time position matters. Right fix: push sort + top-100 slice into Postgres window functions, return ~6KB regardless of scale.

- ✅ **CLOSED — Migration `pm22_create_get_leaderboard_rpc` applied.** `public.get_leaderboard(p_email text, p_scope text, p_range text) RETURNS jsonb`. `STABLE`, `SECURITY DEFINER`, `SET search_path = public`. Single CTE chain over `member_home_state` ⋈ `members` ⋈ `employer_members`. Four parallel `ROW_NUMBER()` window orderings (one per metric). Server-side `display_name` resolution from `display_name_preference`. Returns full v11-shape response via `jsonb_build_object`. ~9KB SQL, ~330 lines. `GRANT EXECUTE` to `authenticated, service_role`.

- ✅ **CLOSED — `leaderboard` EF v17 deployed.** Platform v17, ezbr `ee55c3fe3a1e060f0eabb20e895ddab619229a769306287a4d0234a6d0d181c2`. ~110 lines TS — parses params, JWT-validates (with `?email=` back-compat), calls RPC, returns. `verify_jwt:false` at gateway with internal validation per §23 custom-auth pattern. CORS unchanged from v11. Already in `warm-ping` keep-warm list (added 25 April per warm-ping v4) — cold-start exposure mitigated.

- ✅ **CLOSED — Functional parity verified live.** Full v11 contract shape diff: top-level keys, per-metric keys, ranked-entry keys, above-entry keys all match — no missing fields, no extras. Edge cases live-tested: caller in zero bucket (rank against full sorted list, `caller_in_ranked:false`, `gap:0`); caller at #1 (`above:[]`); `scope=company` with no employer (falls back to caller-only); `range=all_time` uses `overall_streak_best`. Portal pages did not need to change.

- ✅ **CLOSED — Timing measured.** 9ms warm over 5 iterations at 15 members. Cold compile 58ms (one-shot plan compilation). At-scale projection: window functions are `O(n)` for top-N over indexed scan vs the v11 JS path's `O(n log n)` × 4 sorts; wire payload bounded by response shape (~6KB) not by table size.

- 📋 **NEW (low priority) — Index on `member_home_state(member_email)` if not already present.** The RPC's `is_caller` lookups inside each `pm_*` CTE materialise via subquery on `email = v_email`. Should be a hash-table probe on the existing pool, not an index seek, but worth checking the EXPLAIN plan once we have a meaningful member count to see whether Postgres picks a different plan at 100K rows.

- 📋 **NEW (low priority) — Consider materialised view if RPC-per-load is the bottleneck at >1M members.** RPC on every load is fine up to ~1M members on the back of `member_home_state`'s incremental aggregate maintenance. Beyond that, a materialised view refreshed every N minutes (still real-time-ish) is the next escalation step before going full snapshot-table. Not now — speculative.

## Added 08 May 2026 PM-21 (perf telemetry pipeline · `perf_telemetry` + `log-perf` v1 + `perf.js`)

- ✅ **CLOSED — `perf_telemetry` table created.** Migration `pm21_create_perf_telemetry`. Bigserial PK, member_email / page / metric_name / metric_value(double) / nav_type / ua_brief / ts. RLS service-role-only with `(SELECT auth.role())` wrap per §23. Two indexes: `idx_perf_telemetry_page_metric_ts` on `(page, metric_name, ts DESC)`, `idx_perf_telemetry_ts` on `(ts DESC)`.

- ✅ **CLOSED — `log-perf` v1 deployed.** Platform v1, ezbr `9df3ce50315f7c7ad6592ab4f8c350a0c749667bb7d758c7d46700992be9afcb`. `verify_jwt:false` at gateway with internal `getAuthEmail()` JWT validation per §23 custom-auth pattern. 100KB payload cap, 50 metrics/request max, CORS default-origin, returns 204 on success. Curl with no auth → HTTP 401 confirmed live. Email derived from JWT, never read from body.

- ✅ **CLOSED (partial) — `perf.js` client shim shipped on `index.html`.** vyve-site HEAD `df41d7cb`. Default-off in production, opt-in via `?perf=1` URL once (persists in `localStorage.vyve_perf_enabled='1'`). Captures TTFB / DOM done / load / FP / FCP / LCP / INP plus VYVE-custom `auth_rdy` (vyveAuthReady vs fetchStart) and `paint_done` ('vyvePaintDone' event vs fetchStart). `fetch + keepalive` on pagehide (sendBeacon can't carry Authorization). 12s fallback flush. Script tag added after auth.js with defer. SW cache `monthly-defer-e` → `perf-shim-f`.

- 📋 **OPEN — PM-21 follow-up: extend `<script src="/perf.js" defer>` across the rest of the portal.** Trigger after a few days of index.html data confirm the shim is overhead-neutral (specifically: paint metrics on instrumented sessions match paint metrics on uninstrumented sessions within noise). Pages to wire: `habits.html`, `workouts.html`, `exercise.html`, `nutrition.html`, `sessions.html`, `engagement.html`, `leaderboard.html`. Trivial — script tag injection per page + SW cache bump in the same commit. ~30 min for the lot.

- 📋 **OPEN — Read query for daily percentile rollup.** Not a build item, just the canonical query to keep next to the table:
  ```sql
  SELECT page, metric_name,
    percentile_cont(0.5)  WITHIN GROUP (ORDER BY metric_value) AS p50,
    percentile_cont(0.95) WITHIN GROUP (ORDER BY metric_value) AS p95,
    COUNT(*) AS n
  FROM perf_telemetry
  WHERE ts > now() - interval '1 day'
  GROUP BY 1, 2 ORDER BY 1, 2;
  ```
  Wrap into a `\set` or a saved view if it gets used daily.

## Added 08 May 2026 PM-20 (`monthly-checkin.html` · nav.js + offline-manager.js → defer)

- ✅ **CLOSED — Defer lift on monthly-checkin.html.** vyve-site `2bfc4478`. `nav.js` and `offline-manager.js` lifted to `defer`; `theme.js` stayed sync per §23 PM-7 (FOUC). SW cache `eager-prefetch-d` → `monthly-defer-e`. Verified via GitHub Contents API on the new HEAD.

- 📋 **OPEN (P2) — `vyve-offline.js` defer-safe rewrite across 8 portal pages.** Audit during PM-20 surfaced 8 pages with `<script src="/vyve-offline.js">` un-deferred in head, consumed by inline blocks on the host pages via `window.VYVEData` references. Lifting to defer requires the inline consumers to be rewritten to await a ready signal — defer reorders execution past inline parse-time references. Affected: `events-live.html` (3 refs), `index.html` (4 refs), `log-food.html` (25 refs — biggest lift), `running-plan.html` (3 refs). Same anti-pattern with `/supabase.min.js` on `hk-diagnostic.html`, `login.html`, `set-password.html`. Real refactor not a sweep. Tag P2.

- 📋 **OPEN — `theme.js` defer drift on `index.html` — INVESTIGATE before assuming it's a bug.** §23 PM-7 hard rule says theme.js must NEVER carry `defer` (FOUC prevention). index.html main HEAD `df41d7cb` has `<script src="/theme.js" defer>` shipped. Two possibilities: (a) the rule is overly strict and theme.js's apply-from-localStorage IIFE is effectively-sync-enough under defer for the FOUC case to not visually trigger — codify the exception; (b) bona-fide drift that snuck in during PM-18 — revert and bump SW cache. Don't paper over either way. Read theme.js source, test in fresh incognito with throttled CPU, decide. ~30 min.

## Added 08 May 2026 PM-19 (`log-activity` v29 · write-response `home_state` payload + optimistic delta)

- ✅ **CLOSED — `log-activity` v29 deployed.** Source v29 / platform v34, ezbr `68d62d9c0c94dd75b2221f1cd91cc739083faf50cf224f31907a9e937cbf6762`. Write paths return post-write `member_home_state` row + optimistic delta for the just-logged type. `evaluate_only:true` short-circuit and cap-skip path also return `home_state` (delta null on cap-skip). One response shape across all write paths.

- 📋 **OPEN — Portal-side opportunistic update consumer.** The follow-up that earns the win: after a habit / workout / cardio log, paint the next dashboard nav from the `home_state` returned by `log-activity` rather than round-tripping `member-dashboard`. Touches every trigger page (habits / workouts / cardio / sessions). Scope after a few days of `perf_telemetry` data show where the round-trip cost actually surfaces. Don't speculate — measure first.

## Added 08 May 2026 PM-18 hotfix (home cache key alignment)

- ✅ **CLOSED — Cache-key writer renamed `vyve_home_cache_<email>` → `vyve_home_v3_<email>`.** vyve-site `81908633`. PM-18 fan-out was writing to a key the home-page reader didn't read; rename aligned them. Verified end-to-end: sign-in → fan-out write → next nav paints from cache zero-RTT.

## Added 08 May 2026 PM-18 (eager prefetch fan-out + universal touchstart-nav prefetch)

- ✅ **CLOSED — Eager prefetch fan-out in `auth.js`.** Post-getSession microtask prefetches `member-dashboard` payload + the major secondary caches (`vyve_workouts_v1`, `vyve_exercise_v1`, etc.) so first internal nav after sign-in paints from cache zero-RTT.

- ✅ **CLOSED — Universal touchstart-nav prefetch.** Delegated `touchstart` listener watches in-app nav anchors and kicks off destination prefetch immediately — typical 150-300ms tap-to-click window absorbs most prefetch latency. Pairs with cache-paint-then-revalidate on the destination for the cases where prefetch doesn't beat the nav.

- 🔧 **Hotfix follow-up captured separately above.** First-evening post-ship caught a cache-key drift between the writer (PM-18) and the reader (cache-paint-before-auth migration); fixed in PM-18 hotfix.

## Still pending (not started)

<!-- PM-22 "leaderboard snapshot table + cron + EF rewrite" entry removed 08 May PM-23 — the work shipped as the get_leaderboard() RPC reframe, captured in the closed-items section above and in §19. -->

## Added 08 May 2026 PM-17 (member-dashboard v61 · drop 4 this-week queries · cache 3 INLINE counts)

- ✅ **CLOSED — `member-dashboard` v61 deployed.** Platform v67, ezbr `72ce2bbe…`. Three files: `index.ts` 19004 chars, `_shared/achievements.ts` 13580, `_shared/taxonomy.ts` 4303 (byte-identical). Promise.all gateway shrunk from 22 to 18 entries; 4 this-week PostgREST queries dropped (now read from `state.workouts_this_week` / `cardio_this_week` / `sessions_this_week` / `checkins_this_week`). Three INLINE evaluators (`workouts_logged` / `cardio_logged` / `checkins_completed`) routed through cached `homeStateRow` via extended `HOME_STATE_STREAK_FIELDS`. `habitsThisWeek` query stays — goal-progress meter needs `COUNT(DISTINCT activity_date)` and the column is `COUNT(*)`. Same staleness contract as the totals already served from `member_home_state`. Deno typecheck clean. 401-handler verified live via curl.

- 📋 **NEW (low priority) — Daily `member_home_state` reconciliation alert.** Carry-forward from the now-closed P1-1. Detect drift between `member_home_state.{workouts_total, cardio_total, checkins_total, *_this_week, *_streak_*}` and source-table-derived recomputation. Cron at 03:00 UTC running `recompute_all_member_stats()` against a single canary member, comparing post-write row to a fresh aggregate query, alerting on any mismatch > 0. Cheap insurance now that the dashboard reads from these cols on every load and the achievement evaluators inherit the same staleness. ~1h.

- 📋 **NEW (low priority) — Eager `homeStateRow` fetch from auth.js.** v61 still has the achievements module fetching `member_home_state` independently from the dashboard's own SELECT. Could fan out from `auth.js` post-getSession, prime a sessionStorage cache the EF reads via a header. Marginal gain (one round trip) — measure first.

## Added 08 May 2026 PM-16 (re-engagement-scheduler v11 · scaling fix on dormancy lookup)

- ✅ **CLOSED — `re-engagement-scheduler` v11 deployed and verified.** Platform v31, ezbr `0b58be0d…`. Replaces 4 `.in()` queries against activity tables with single `.in()` against `member_home_state` for the 5 new `last_*_at` cols. At 100K members the old shape pulled millions of rows; new shape pulls one row per active member. Verified live PM-17 via curl: HTTP 200, version: 11, processed 15 / 0 errors, A/B classification working against new shape. The "network proxy blocked test invocation at deploy time" caveat is now closed.

- ✅ **CLOSED — Migrations `pm16_add_last_at_columns_to_member_home_state` + `pm16_extend_refresh_member_home_state_with_last_at`.** Five new nullable timestamptz cols (`last_habit_at` / `last_workout_at` / `last_cardio_at` / `last_session_at` / `last_checkin_at`) + index on `last_activity_at`. Backfilled all 30+ existing rows. `refresh_member_home_state(p_email)` extended to populate the 5 cols on every refresh. Dean's row verified.

- ✅ **CLOSED — New §23 hard rule: perf rewrites of dormant cron functions verify against live source.** PM-16 audit named `recompute_all_member_stats()` and `daily-report` v8 as the cliffs but both were already in their PM-11 incremental shape — audit's diagnosis had been overtaken. Lesson codified in master.md §23.

## Added 08 May 2026 PM-15 (paint-timing audit · 10 candidate pages · 1 fix)

- ✅ **CLOSED — Paint-timing audit completed across 10 candidate pages.** vyve-site `7e5ab3f1`. Pages audited: exercise.html / certificates.html / settings.html / nutrition.html / sessions.html / leaderboard.html / log-food.html / wellbeing-checkin.html / running-plan.html / workouts.html. Eight already correct (paintCacheEarly IIFE pattern, or AI/network-honest by design). One fix: `workouts-programme.js` got a synchronous `paintProgrammeFromCache()` IIFE at the top that reads `vyve_auth` → email, reads `vyve_programme_cache_<email>`, sets module-scope vars, calls `renderProgramme()`. Boot path's `loadProgramme()` still runs on auth for network refresh. SW cache `microtask-workouts-b` → `paint-programme-c`.

## Added 08 May 2026 PM-14 (index.html prefetch fan-out · workouts/exercise lifted to microtask)

- ✅ **CLOSED — Workouts/exercise prefetch in `index.html` lifted from idle to microtask.** vyve-site `3719e305`. Block #2 of `_vyvePrefetchNextTabs` was still wrapped in `_idle(...)` post-PM-13. Lifted to `Promise.resolve().then(...)`. Block #1 (nutrition) stays idle-gated — heavier, less critical. Block #3 (habits) was already on microtask from PM-13. SW cache `precache-engagement-workouts-a` → `microtask-workouts-b`.

## Added 08 May 2026 PM-13 (SW precache + habits prefetch out of idle)

- ✅ **CLOSED — engagement.html + workouts.html added to SW precache list.** vyve-site `186b432944`. PM-12 left these two pages un-precached so first-navigation HTML arrival was network-bound even with PM-7 SWR. Now both join habits/nutrition/exercise/sessions/movement/cardio/certificates in `urlsToCache`. Trade-off: ~140KB extra at install for first-tap-no-wait afterwards.

- ✅ **CLOSED — Habits prefetch lifted out of `requestIdleCallback`.** vyve-site `186b432944`. Was `_idle(...)` (~1.5s on Safari via setTimeout fallback). Now microtask via `Promise.resolve().then(...)` — runs after current frame, fires before user can tap habits. Members + programme prefetches stay idle-gated.

- 📋 **NEW (low priority) — Cold-cache-first-visit case for engagement.** Member with no cache who taps engagement before index has run hits full network round trip. Possible fixes: (a) eager prefetch on login (move out of `loadDashboard` into `auth.js` post-getSession), (b) more aggressive SW pre-population. Don't ship until we have evidence it's a real symptom — most users hit home first.

- 📋 **NEW (low priority) — Workouts cold-tap parity.** Workouts.html now in SW precache but the `vyve_programme_cache_<email>` prefetch is still idle-gated. If members report workouts feels slow after engagement is faster, lift it to microtask too. Heavier than habits so left idle-gated for now.

## Added 08 May 2026 PM-12 (engagement + habits paint-timing fix shipped)

- ✅ **CLOSED — engagement.html + habits.html cache-paint-before-auth.** vyve-site `3fcd9169`. Both pages now discover email from cache synchronously, paint without waiting for auth.js to load, then await auth internally for the network refresh. _vyveWaitAuth() helper added to both. Index prefetch wave extended to warm vyve_habits_cache_v2. SW cache `theme-throttle-8` → `paint-engagement-habits-9`. New §23 hard rule codified.

- ✅ **CLOSED — Paint-timing audit completed (PM-15).** All 10 candidate pages audited. Eight already correct. One fix: `workouts-programme.js` got the synchronous paint IIFE pattern. vyve-site `7e5ab3f1`. Cache `paint-programme-c`.

- 📋 **PROMOTED — Telemetry shim from PM-10 audit P2.** Re-tiered up. PM-12 was a paint-timing miss in the static audit; only browser-level timing instrumentation would have caught it. Build the `?perf=1` gated `perf.js` + `perf_telemetry` table + `log-perf` EF when bandwidth allows — it's the only way to catch the next paint-timing drift before users do.

## Added 08 May 2026 PM-11 (P0-1 + P2-1 shipped)

- ✅ **CLOSED P0-1 — `get_charity_total()` → `platform_counters` increment-on-write.** Migration `p0_1_charity_total_incremental_counter`. New table + 6 trigger fns + bump helper + reconcile-and-heal cron (jobid 23, `vyve_charity_reconcile_daily` 02:30 UTC). Backfilled to 444 byte-matching legacy. EXPLAIN ANALYZE 127.5ms → 0.93ms (137× faster, scale-flat). Stress test verified cap=1 and cap=2 paths both correct. New §23 hard rule codified for the incremental-aggregate pattern.

- ✅ **CLOSED P2-1 — `theme.js` skip Supabase fetch if localStorage is fresh.** vyve-site `7ff486f4`. 1h TTL via `vyve_theme_synced_at` stamp; `vyveSetTheme()` refreshes the stamp on write-through. SW cache `prefetch-exercise-7` → `theme-throttle-8`. node --check clean both files. Post-commit Contents-API verification: 5427 + 6164 bytes both match. New §23 hard rule for member-pref throttled-sync pattern.

- 📋 **NEW (low priority) — Generalise the `bump_*_counter` helper.** Currently `bump_charity_total(p_delta)` is hardcoded to `counter_key = 'charity_total'`. When the next platform-wide aggregate ships, refactor into a generic `bump_platform_counter(p_key, p_delta)` so we don't fan out the same SECURITY DEFINER pattern. Not urgent — current shape is fine for one counter.

- 📋 **NEW (low priority) — Sibling-trigger family alignment.** `charity_count_*` family and `increment_*_counter` family share cap math but write to different surfaces. Future cap-rule changes must update BOTH or we get drift between `platform_counters.charity_total` and `members.cert_*_count`. Worth a comment in `set_activity_time_fields` and the cap functions pointing at the two trigger families. ~15 min cleanup.

- 📋 **NEW (low priority) — `replay_views` per-member cert tracking gap.** PM-11 added charity_total tracking for replays, but the per-member `cert_*_count` family still doesn't track replays separately — they fold into `cert_sessions_count` via `replay_views_cert_count_trigger`. Probably correct for current product framing (replays + live sessions = one cert track) but flag for future product reviews.

## Added 08 May 2026 PM-10 (Perf audit playbook · ship-now and pre-launch items)

Full audit at `/playbooks/perf-audit-2026-05-08.md` — read first before actioning any item below. Each entry below is a one-line pointer; the playbook has EXPLAIN ANALYZE evidence, fix shapes, time + risk + sign-off per item.

### Ship-now (≤1 day)

- 🚀 **P0-1 — `get_charity_total()` → `platform_counters` increment-on-write.** #1 query in pg_stat_statements (577s total, 190ms mean). 6-table UNION ALL that scales linearly in total platform activity. At 100K members this hits work_mem ceiling and statement_timeout. Already on member-dashboard hot path. Fix: `platform_counters` table, AFTER INSERT/DELETE triggers on the 6 source tables, function body becomes O(1) read. Concrete shape in playbook §P0-1. ~3-4h Claude-assisted, Dean sign-off only, reversible. **Highest-priority perf fix on the platform right now.**

- 🚀 **P2-1 — `theme.js` skip Supabase fetch if localStorage is fresh.** 5247 calls in pg_stat_statements, fires on every page load. Cross-device sync should run once per session via `vyve_theme_synced_at` localStorage timestamp. ~30 min, Dean sign-off only.

### Pre-launch (before public-launch comms)

- ✅ **CLOSED P0-2 — `re-engagement-scheduler` LEFT JOIN cartesian fixed.** `recompute_all_member_stats()` and `daily-report` v8 were already in their PM-11 incremental shape (audit was partially stale). The actual cliff was `re-engagement-scheduler` v10 doing 4 parallel `.in()` queries against `daily_habits` / `workouts` / `session_views` / `wellbeing_checkins` and computing `MAX(activity_date)` in JS — millions of rows at 100K members. PM-16 chose Option B (cleaner): added 5 `last_*_at` cols to `member_home_state` + index, extended `refresh_member_home_state` to populate, rewrote v11 to read from `member_home_state` via single `.in()` (one row per active member regardless of activity volume). Migrations `pm16_add_last_at_columns_to_member_home_state` + `pm16_extend_refresh_member_home_state_with_last_at`. EF v11 platform v31, ezbr `0b58be0d…`. Verified live PM-17: HTTP 200, version: 11, processed 15 / 0 errors.

- ✅ **CLOSED P1-1 — `member-dashboard` v60 + v61 staged compression complete.** PM-13 (v60) parallelised both achievements `INLINE` evaluator passes via `Promise.all` (was 23 serial PostgREST round trips) and pre-fetched the 6 streak fields from `member_home_state` in a single shot. PM-17 (v61) dropped 4 of 5 this-week PostgREST queries (workouts/cardio/sessions/checkins → `state.*_this_week`) and routed 3 INLINE evaluators (`workouts_logged` / `cardio_logged` / `checkins_completed`) through the cached `homeStateRow`. Net: gateway 22 → 18 queries; achievements pass 23 → 20 round trips. v61 platform v67, ezbr `72ce2bbe…`. Daily reconciliation cron for `member_home_state` vs source-table count drift retained as backlog item below.

- 📋 **P1-2 — `leaderboard` snapshot table + refresh cron.** EF reads all members + home_state + employer rows unbounded. ~50MB JSON at 100K members. Fix: pre-computed `leaderboard_snapshot` keyed (scope, range, metric, member), refresh cron every 5 min. ~4-6h.

### At-scale (post-1K members)

- 📋 **P2-2 — `refresh_member_home_state()` async pipeline.** 207ms synchronous trigger × 10 source tables × write-burst peaks → 8+ cores burned at 100K members; Pro plan has 4. Convert to pg_notify + LISTEN background drain, debounced 5s per email. Or incremental column updates from triggers.

- 📋 **P3-1 — Lift Pro plan defaults: `work_mem` (2.1MB → 8MB+), `max_connections` (60 → 200+).** Via Supabase support ticket once we have evidence of saturation.

- 📋 **P3-2 — `member_health_samples` partitioning by `start_at` month.** Already 6.8K rows at 4 active HK members; ~5.5B rows/year projected at 100K members. Partition + rollup retention.

- 📋 **Telemetry shim** — `perf.js` + `perf_telemetry` table + `log-perf` EF. Deferred from the audit session because static evidence was sufficient. Build when post-fix measurement matters; gate on `?perf=1` query string for prod deployment.

### Not-worth-it / hygiene only

- ❌ Achievements catalog cross-isolate cache (P2-3 in playbook). Wait for Edge KV GA.
- ❌ The 5 `ON DELETE NO ACTION` → CASCADE FK standardisations from memory. No perf impact at any scale, hygiene only — keep on the existing pre-launch hygiene list.

---

## Added 08 May 2026 PM-9 (Index prefetch extended to exercise cache)

- ✅ **CLOSED — Prefetch exercise cache from index.html.** vyve-site `a2c99e46`. `_vyvePrefetchNextTabs` now writes both `vyve_programme_cache_<email>` and `vyve_exercise_cache_v2` from the single `workout_plan_cache` fetch. Zero extra network, both pages paint from warm cache after any home visit.

- 📋 **NEW (medium priority) — Universal touchstart nav-button prefetch.** Currently prefetch fires only from index.html's `_vyvePrefetchNextTabs`. If a member taps Exercise from Nutrition (or any non-home page), the cache might be cold. Right pattern: in `nav.js`, attach `touchstart` listeners to bottom-nav anchors. When a finger lands, fire the prefetch for the destination page; by the time the tap (~80-120ms later) navigates the page, cache is partially or fully warm. Per-destination: home → none, exercise → vyve_exercise_cache_v2 + vyve_programme_cache, nutrition → vyve_members_cache, sessions → no fetch (static). Network gate as PM-5 (`navigator.connection`). Estimated 1h. Universal coverage from any page → any nav target.

## Added 08 May 2026 PM-8 (RLS auth-function wrap shipped · the actual perf bottleneck)

- ✅ **CLOSED — RLS auth-function wrap migration.** Migration `wrap_auth_functions_in_rls_policies` rewrote 72 policies across ~50 tables to use `(SELECT auth.X())` instead of bare `auth.X()`. Plus 2 redundant `members` policies dropped. EXPLAIN ANALYZE on `workout_plan_cache` primary query: Planning 327.9ms → 11.6ms (28× faster), Execution 19ms → 1.1ms (17× faster). REST endpoint round-trip from remote workbench: ~30000ms cold / 1500-3200ms warm → 307-888ms avg 543ms. Real-device should be 50-200ms.

- 📋 **NEW (high priority) — Add a perf-focused RLS lint to CI / pre-deploy.** The Supabase security audit (commits 1-4) didn't surface the auth-wrap pattern because it was scoped at correctness, not perf. Add a check to a future deploy gate: `SELECT COUNT(*) FROM pg_policies WHERE schemaname='public' AND ((qual ~ 'auth\.(email|uid|jwt|role)\s*\(\s*\)' AND qual !~ 'SELECT\s+auth\.(email|uid|jwt|role)') OR (with_check ~ 'auth\.(email|uid|jwt|role)\s*\(\s*\)' AND with_check !~ 'SELECT\s+auth\.(email|uid|jwt|role)'))` — should always be 0. Fail the deploy if it isn't. Lightweight, mechanical. Backlog for whoever sets up CI gates next.

- 📋 **NEW (medium priority) — Remote-workbench REST RTT is still 543ms avg post-fix.** Even with planning + execution dropped to ~13ms combined, the workbench-to-Supabase round trip is ~500ms. That's network + TLS + Supabase gateway + PostgREST overhead. Some of this is unavoidable for cross-region requests, but worth checking from a real UK iPhone whether Lewis's experience is now in the 50-200ms target range. If real-device perf is still slow, next likely culprit is the `member-dashboard` EF (which wraps multiple PostgREST queries) or PostgREST gateway latency itself. Won't action until Lewis re-tests.

- 📋 **NEW (low priority) — `auth.email()` returns email AND requires JWT decode every call.** Even with the wrap, every authenticated query pays for JWT verification + claim extraction. For ultra-high-frequency surfaces (e.g. real-time leaderboard polling), consider alternative scoping via service_role + an EF-level email param. Not urgent — current page perf is fine post-PM-8.

## Added 08 May 2026 PM-7 (SW HTML SWR shipped · perf project actually closed · script-tag deferring sweep opened)

- ✅ **CLOSED — Real perf project closure: SW HTML stale-while-revalidate.** vyve-site `3a20fcda` + cleanup `e72f672b`. The whole cache-paint perf project (PM-3 through PM-6) had been silently bottlenecked by the SW's `network-first` HTML strategy, which waited a full network round trip on the HTML doc itself on every navigation before any downstream optimisation could engage. Caught when Dean reported a 3-second exercise tab load post-PM-6. SWR fixes the cold path: cached HTML returns instantly, background fetch refreshes the cache for next navigation. Cache key `vyve-cache-v2026-05-08-auth-defer-5` → `vyve-cache-v2026-05-08-swr-html-6`. New §23 hard rule for SW HTML caching strategy + theme.js non-defer requirement.

- 📋 **NEW (medium priority) — Script-tag deferring sweep: 29 pages with non-deferred consumer scripts.** Diagnostic walk during PM-7 surfaced an inconsistency: `nav.js`, `offline-manager.js`, `vyve-offline.js`, `tracking.js` are non-deferred on 29 pages where most other pages defer them. theme.js is correctly excluded (FOUC prevention, see §23). Pages affected (by script):
    - **theme.js (must stay non-deferred — exclude from sweep):** all 29 pages
    - **nav.js:** certificate, checkin-live, checkin-rp, education-live, education-rp, exercise, how-to-pdfs, how-to-videos, mindfulness-live, mindfulness-rp, monthly-checkin, nutrition-setup (with non-rooted src `nav.js`), podcast-live, podcast-rp, therapy-live, therapy-rp, workouts-live, workouts-rp, yoga-live, yoga-rp
    - **offline-manager.js:** certificate, exercise, monthly-checkin
    - **vyve-offline.js:** checkin-live, education-live, events-live, index, log-food, mindfulness-live, podcast-live, running-plan, therapy-live, wellbeing-checkin, workouts-live, yoga-live
    - **tracking.js:** all -live and -rp pages (16 of them)
    - **healthbridge.js:** consent-gate
    Estimated 1-2h. Mechanical defer-attribute additions, single atomic commit covering 29 pages. node --check on each file's inline scripts. Same pattern as PM-6's auth.js sweep but with consumer scripts. May not yield a visible perf win on its own (HTML SWR is the main driver) but cleans up an inconsistency that confuses future audits and shaves head-blocking overhead from cold-cache first-paint.

- 📋 **NEW (low priority) — Cache-key bump enforcement under SWR.** Now that we're SWR for HTML, a missed cache-bump on a portal code change could leave members on stale HTML indefinitely (SWR doesn't force-refresh on schedule). Pre-commit check or CI gate that requires a sw.js cache key bump in any commit that touches portal HTML/JS files. Not urgent — the convention is well-established and PM-3 through PM-7 all bumped correctly. Worth automating before the team grows.

## Added 08 May 2026 PM-6 (Session 5 shipped · cache-paint perf project closed)

- ✅ **CLOSED — Session 5: auth.js promise refactor.** vyve-site `b089eba3`. Pre-flight audit walked back the PM-5 reframe entirely. Of 23 in-scope HTML pages, every consumer was already defer-safe (two-path if/else, vyveAuthReady listeners, function-body refs). Of 18 consumer JS modules, only `workouts-config.js` had a top-level ref and its comment anticipated this exact change. Zero per-page migration was needed. Single atomic commit: auth.js (+970 chars Promise + signal helper, full back-compat with existing event), sw.js cache bump to `vyve-cache-v2026-05-08-auth-defer-5`, 35 HTML pages get `defer` on auth.js script tag (4 already had it). New §23 hard rule for defer-safety walker pattern. Win estimated ~150-300ms first paint via unblocked head preload chain.

- ✅ **PERF PROJECT CLOSED.** Five sessions in five days:
    - 08 May PM-3 (`29ada8f8`): cache paint before auth on 4 pages.
    - 08 May PM-4a (`b4adf8ef`): same migration on 5 more pages.
    - 08 May PM-4b (`2d658e0e`): workouts gap-fills (loadExerciseNotes/Library/PausedPlans).
    - 08 May PM-5 (`f42f059d`): index.html prefetches engagement/certs/members/programme caches.
    - 08 May PM-6 (`b089eba3`): auth.js defer + VYVE_AUTH_READY Promise.

  Net effect: warm-cache portal pages now paint in <50ms via synchronous IIFE → localStorage → DOM, fully ahead of any auth/SDK round-trip. First-tap-of-session cold cache is mitigated by index.html fan-out + prefetch. Cold first-page-of-session paint is improved by ~150-300ms via auth.js defer unblocking the head preload chain.

- 📋 **NEW (low priority) — `paintCacheFirst` helper still drafted, not shipped.** ~110 lines locally at /tmp/_new_helpers.txt covering generic `pageCacheGet/Set/Invalidate` + wrapper. Every page audited had bespoke cache infra worth preserving or used existing `VYVEData.fetchCached`/`cacheGet`/`cacheSet`. Drop the draft unless a future page genuinely needs the pattern.

- 📋 **NEW (cosmetic) — `index.html` loads `vyve-offline.js` non-deferred** while every other page defers it. Inconsistency caught during PM-6 audit. Aligning to `defer` is one-character change but every other script in index.html runs after auth.js so the position relative to auth.js matters. Not blocking; clean up next time index.html is touched.

## Added 08 May 2026 PM-5 (Index prefetch shipped · Session 5 reframed)

- ✅ **CLOSED — Session 4: prefetch top nav targets from index.html.** vyve-site `f42f059d`. Two-layer approach: (a) free fan-out — index's member-dashboard response now writes into `vyve_engagement_cache` and `vyve_certs_cache` too (shape-compatible, zero extra network); (b) explicit background prefetches via `_vyvePrefetchNextTabs(email, jwt)` — fires `requestIdleCallback`-wrapped, network-gated fetches into `vyve_members_cache_<email>` (nutrition) and `vyve_programme_cache_<email>` (workouts). sw.js bumped to v2026-05-08-prefetch-4.

- 📋 **REFRAMED — Session 5: auth.js promise refactor (P1, ~half-day, full portal touch).** Originally scoped as 1-2h. On closer reading of auth.js + the consuming pages: every inline body script across all 14 portal pages references `window.vyveSupabase`, `window.vyveCurrentUser`, or `getJWT()` synchronously. Add `defer` to auth.js and those refs are `undefined` because they execute before auth.js parses → all 14 pages break. To make auth.js deferrable safely, every page (including the workouts JS modules and the cache-paint IIFEs from PM-3/PM-4) needs to migrate to `await window.VYVE_AUTH_READY` (or equivalent). Plus thorough verification that fast-path → SDK init → vyveAuthReady → consent gate ordering is preserved. Win is still the same (~150-300ms first-paint), but it's a focused half-day with smoke tests on every page, not a 1-2h job. Open this in its own chat with a pre-flight load of the brain.

### Cumulative perf project state — what's shipped this week

- 08 May PM-3 (`29ada8f8`): cache paint before auth on settings/exercise/movement/certificates + certificates cache-write bug fix.
- 08 May PM-4a (`b4adf8ef`): same migration on nutrition/log-food/leaderboard/engagement/running-plan.
- 08 May PM-4b (`2d658e0e`): workouts gap-fills (loadExerciseNotes/Library/PausedPlans).
- 08 May PM-5 (`f42f059d`): index.html prefetches top nav targets.

Sessions 1-4 of the perf project = closed. Session 5 (auth.js promise refactor) = reframed and re-queued as half-day work.

## Added 08 May 2026 PM-4 (Cache-paint-before-auth migration · 5 more pages + workouts gap-fills shipped)

- ✅ **CLOSED — Session 2: cache paint runs before auth on 5 more pages.** vyve-site `b4adf8ef`. nutrition.html, log-food.html, leaderboard.html, engagement.html, running-plan.html. Three pages skipped as low-value (sessions/monthly-checkin/wellbeing-checkin — see §changelog PM-4 for rationale).

- ✅ **CLOSED — Session 3: workouts gap-fills.** vyve-site `2d658e0e`. loadExerciseNotes (workouts-notes-prs.js), loadLibrary + loadPausedPlans (workouts-library.js) all wrapped with VYVEData cache-first helpers. Workouts page now has cache-first paint on all 7 boot loaders.

- 📋 **Session 4: prefetch top nav targets from index.html.** Fire background fetches for the top 3 nav buttons after first paint completes. Plus `touchstart` prefetch on nav buttons. Wifi-only gate via `navigator.connection.effectiveType`. Closes the first-tap-of-the-session gap that cache-first can't fix on its own. Estimated 2–3h.

- 📋 **Session 5: auth.js promise refactor (top of backlog as P1).** `auth.js` is non-deferred across 14 portal pages because its globals must exist before inline body scripts execute. Refactor into a `window.VYVE_AUTH_READY` Promise that resolves once SDK + client + getSession() have settled. Then auth.js can go back to `defer`, regaining the ~150–300ms preconnect/preload perf hint win. Independent of cache work. Estimated 1–2h once design is locked.

- 🗑️ **DROPPED — Ship `paintCacheFirst` helper to vyve-offline.js.** Drafted PM-3 but never needed. Every page audited had either bespoke cache infra worth preserving or could use existing VYVEData.fetchCached/cacheGet/cacheSet helpers. Drafted code lives in /mnt/files/_new_helpers.txt locally if any future page genuinely needs the pattern. Don't ship dead infra.

## Added 08 May 2026 PM-3 (Cache-paint-before-auth shipped on 4 pages · perf project ongoing)

- ✅ **CLOSED — Cache paint runs synchronously before auth on settings/exercise/movement/certificates.** Plus `data.error → !data.error` cache-write bug fix on certificates.html. vyve-site `29ada8f8`. SW key `v2026-05-08-cache-paint-early`.

- 📋 **NEW — Session 2: migrate the remaining 8 pages to the cache-paint-before-auth pattern.** Pages: `nutrition.html`, `log-food.html`, `leaderboard.html`, `sessions.html`, `engagement.html`, `monthly-checkin.html`, `wellbeing-checkin.html`, `running-plan.html`. For each: audit current cache state (does the page have one? where is the paint gated?). For pages with no cache at all, ship with the drafted `paintCacheFirst` helper from `vyve-offline.js` (currently NOT shipped — kept locally). For pages with bespoke caches gated on auth, migrate to the synchronous IIFE pattern from §23 hard rule. Estimated ~30 min per page, ~4–5h total session.

- 📋 **NEW — Session 3: workouts targeted gap-fills.** `loadExerciseNotes` (in `workouts-notes-prs.js`), `loadLibrary` and `loadPausedPlans` (in `workouts-library.js`) are uncached. Library tab tap = cold fetch every time. Wrap with cache-first using either the existing bespoke pattern or `paintCacheFirst`. Estimated 1–2h.

- 📋 **NEW — Session 4: prefetch top nav targets.** From `index.html`, fire background fetches for the most likely next-tab destinations after first paint (top 3 nav buttons). Plus `touchstart` prefetch on nav buttons. Wifi-only gate via `navigator.connection.effectiveType`. Closes the "first-tap of the session" gap that even cache-first leaves open. Estimated 2–3h.

- 📋 **NEW — Ship `paintCacheFirst` helper to `vyve-offline.js` once Session 2 has a real consumer.** Drafted 08 May PM-3 (~110 lines: `pageCacheGet/Set/Invalidate` + wrapper). NOT shipped this commit because all 4 target pages already had bespoke working caches. Will land in the same atomic commit as the first uncached-page migration in Session 2 (so it's not dead infra).

## Added 08 May 2026 PM-2 (Exercise name canonicalisation shipped · library expansion deferred)

- ✅ **CLOSED — Cross-day exercise history fixed for Stu Watts.** 28 April-10 orphan rows on `exercise_logs` rewritten to canonical via the new normaliser. His next Push B will cross-link to his April Push A data. Permanent normaliser system live on `exercise_logs`, `exercise_notes`, `exercise_swaps` (×2 cols), `custom_workouts.exercises`, `shared_workouts.session_data`, `shared_workouts.full_programme_json`, `workout_plan_cache.programme_json`, `workout_plans.exercise_name`.

- 📋 **NEW — Exercise library expansion** (deferred, content decision needed). 22 distinct names surfaced in `exercise_name_misses` after JSONB backfills:
  - **Alan Bird (18 names, 41 rows)** — AI-generated bodyweight exercises for his beginner programme that aren't in `workout_plans`. Examples: Wall Sit, Box Squats, Wall Push-ups, Standing Marching, Modified Plank (Knees Down), Standing Knee Raises, Bodyweight Squats variants, Mountain Climbers (Slow), Standing Side Steps, Single Leg Stands, Standing Calf Raises, Seated Leg Extensions, Gentle Stretching Flow, Incline Push-ups, Standard Push-ups (Modified as needed), Bodyweight Squats (Partial Range), Assisted Bodyweight Squats, Full Plank.
  - **Callum Budzinski (4 names, 19 rows)** — library-variant choices: Hammer Curl – Dumbbell (genuinely different from Bicep Curl), Seated Row – Cable (vs library's V-Grip Cable variant — different muscle bias), Lat Pulldown – Close Grip (vs library's Cable), T-Bar Row – Machine (no library entry).
  - Right action: review with Calum/Lewis, decide which to add to `workout_plans` library (so the AI generator has them in scope) and which to add as aliases to `exercise_canonical_names` (e.g. "Lat Pulldown – Close Grip" → "Lat Pulldown – Cable" if no close-grip variant is desired). NOT urgent — the trigger system protects all writes, these names just don't have library video/thumbnail/muscle_group metadata.

- 📋 **NEW — `exercise_name_misses` review cadence.** Should appear on the daily report so future drift surfaces don't sit hidden. Right now the table is service-role-only RLS with no surfacing in any cron. Cheap to add — extend `daily-report` v8 to include `SELECT COUNT(*) FROM exercise_name_misses WHERE resolved=false AND observed_at > now() - interval '24 hours'` plus a per-name top-10 list when count > 0. ~30 min.

- 📋 **NEW — `loadAllExercises` cache key** in `workouts-programme.js` is `vyve_exercise_library_v2` with 24h TTL — when we eventually expand `workout_plans` (Alan's bodyweight names etc.), members on stale caches won't see the new exercises until 24h later. Either bump cache key on library writes via SW push, or accept the 24h drift. Document.

## Added 08 May 2026 PM-1 (Brain hygiene + cleanup pass · all PM-5 cleanup tickets closed)

- ✅ **CLOSED — Scratch EFs deleted.** `vyve-ef-source-backup` v3 + `vyve-mgmt-api-probe` v2 deleted via Supabase dashboard. EF count 95 → 93.
- ✅ **CLOSED — Cron drift fixed.** Duplicate jobid 19 (`process-scheduled-pushes-every-5min`) unscheduled. §7 cron table refreshed to 19 active jobs (was carrying 17). All 19 jobids accounted for, GDPR commit 4 daily cron documented.
- ✅ **CLOSED — GDPR commit 4 §19 entry written.** PM-3 paragraph updated with retroactive same-evening shipped postscript.
- ✅ **CLOSED — §21 capacitor git-init backlog bullet removed** (resolved 07 May PM-4).
- 📋 **NEW — §22 entry: GDPR cron static-PSK exposure.** Logged as backlog rotation. Two fix paths documented (move PSK to `current_setting('app.gdpr_cron_psk')` or drop bearer entirely). Not blocking Sage diligence unless explicitly raised on security review.

## Added 07 May 2026 PM-5 (Backup & DR session 1 continuation — Item 3 shipped, drift caught) — superseded by 08 May PM-1 cleanup pass above

- ~~Cleanup: delete two scratch EFs~~ — done 08 May PM-1.
- ~~Brain drift items caught PM-5~~ — all addressed 08 May PM-1.
- **Item 4-6 still parked** (DR session 2): storage rclone backup (B2 recommended, scope updated 08 May to 5 buckets / 267 objects — `gdpr-exports` bucket is new since PM-4), credentials vault checklist (1Password recommended, 25+ secrets to log), DR playbook sections 2-5 (Capacitor SSD, Supabase deletion, APNs rotation, storage bucket loss). Section 1 (EF rollback) shipped 07 May PM-5.

## Added 07 May 2026 PM-4 (Backup & DR session 1)

- **Item 3 — EF source backup — SHIPPED 07 May 2026 PM-5 via GitHub Actions** (NOT the Supabase EF originally spec'd — three architecture walls forced the pivot, see PM-5 changelog entry for full diagnosis). Workflow `VYVEHealth/VYVEBrain/.github/workflows/backup-edge-functions.yml`, schedule `0 2 * * 0` Sundays 02:00 UTC + manual `workflow_dispatch`. Script `scripts/backup-edge-functions.sh`. Uses `supabase functions download` CLI which handles ESZIP decoding internally. KEEP list (62 EFs) embedded in the script as a bash array — update there when cohort drifts. Failure detection via GitHub Actions native failure email (no `vyve_job_runs`/email-watchdog dependency). Manifest at `staging/edge-functions/MANIFEST.json` with per-EF metadata + per-file sha256.
- **Item 3b — EF rollback runbook — SHIPPED 07 May 2026 PM-5** as section 1 of `playbooks/disaster-recovery.md`. Other DR scenarios (Capacitor SSD loss, Supabase project deletion, APNs key rotation, storage bucket loss) are stubbed in the same doc, deferred to backup session 2.

- **Item 3b — Once `vyve-ef-source-backup` is live, add EF rollback runbook to `playbooks/disaster-recovery.md`.** Procedure: identify the version to roll back to from staging changelog; `Supabase:get_edge_function` against the project for current state to capture as a "before" snapshot; deploy the staged version via `Supabase:deploy_edge_function` with the `files: [{name, content}, ...]` array reconstituted from the staging dir; verify with a real invocation. Don't write the runbook before staging is populated — the path-shapes-and-quirks captured in the staging structure are what makes the runbook accurate.

- **Item 4 — Storage rclone weekly backup — DEFERRED to backup session 2.** 266 objects across 4 Supabase Storage buckets (certificates, exercise-videos, exercise-thumbnails, cc-documents). Exercise-videos is the irreplaceable one (custom workout footage shot for the library). Recommendation: Backblaze B2 (10GB free, $0.006/GB beyond, S3-compatible auth, no SSD-failure single-point-of-failure that local would have). Implementation pattern: weekly cron-driven EF (`vyve-storage-backup-weekly`, Sundays 03:00 UTC after EF backup completes) enumerates objects via Supabase service-role keys, generates signed URLs, pipes into rclone (or direct B2 SDK call) for sync. Dean to set up B2 account + bucket + app key as the prerequisite.

- **Item 5 — Secrets vault checklist + DNS / registrar documentation — DEFERRED to backup session 2.** Checklist file at `VYVEBrain/playbooks/credentials-vault-checklist.md` with all 25 Supabase secrets, current last-rotated timestamps, where to find each for vault entry, rotation note. Recommendation: 1Password (better audit log than Bitwarden, sharable vault for future team members). DNS / registrar (GoDaddy): registrar name, 2FA status, recovery email, expiry date, auto-renew status — all to be filled in by Dean from his GoDaddy account. Estimated 30-45 min mine + 30 min Dean.

- **Item 6 — `playbooks/disaster-recovery.md` synthesis playbook — DEFERRED to backup session 2.** Five scenarios: (a) Capacitor SSD loss → clone `VYVEHealth/vyve-capacitor`, npm install, no pod install needed (SPM), re-link signing certs from Apple Developer; (b) Supabase project deletion → support ticket for snapshot, replay post-snapshot migrations from `VYVEBrain/migrations/` after confirming the snapshot date; (c) EF deploy corruption (per existing §23 rule about `SUPABASE_UPDATE_A_FUNCTION` corrupting bundles) → read prior version from `VYVEBrain/staging/edge-functions/{slug}/`, redeploy via `Supabase:deploy_edge_function` with the multi-file `files[]` array; (d) APNs key rotation runbook → step-by-step including the 2-keys-per-team cap workaround (revoke first to make room); (e) Storage bucket loss → rclone pull from B2 backup. Single document, reachable from any of these scenarios.

- **GitHub PAT calendar rotation entries** — two new rotation deadlines to add to whatever calendar / reminder system Dean uses for rotations. (1) `vyve-capacitor` PAT expires 7 May 2027. (2) `SUPABASE_MGMT_PAT` expires 6 Jun 2026 (a month — short by design as a credential created during a session that needed rotation discipline applied).

- **Brain §24 staleness audit (one-off, ~15 min, low priority).** §24 carried "vyve-capacitor NOT a git repo" for at least 2 weeks after the 18 April Android-only stub was created. The pattern of "brain captures a state, state changes, brain doesn't update" applies elsewhere too — sample audit of a half-dozen §24 entries against live truth (Supabase project status, Stripe payment link, HubSpot Sage deal stage, Make scenario 4950386 status, social publisher last-success-at) would catch other drift. Not blocking; bundle with a future low-traffic session.

## Added 07 May 2026 PM (security commit 1B done)

- **Security commit 1B — DONE 07 May 2026 PM.** CORS default-origin fallback rolled to `wellbeing-checkin` v28 + `log-activity` v28. `ai_interactions` audit logging added to `wellbeing-checkin` v28 (`weekly_checkin`), `anthropic-proxy` v16 (`running_plan`), `re-engagement-scheduler` v10 (`re_engagement`). 100KB payload caps inline (no `_shared/security.ts` produced — single helper per EF was simpler than introducing a shared module across EFs that don't all currently use `_shared/`). Constraint expanded with `re_engagement`. See changelog 07 May PM entry.

- **Roll 100KB payload cap to remaining EFs handling JSON POSTs.** `monthly-checkin`, `onboarding`, `register-push-token`, `share-workout`, `edit-habit`, all admin EFs (`admin-member-edit`, `admin-member-habits`, `admin-member-programme`, `admin-member-weekly-goals`, `admin-programme-library`). Same pattern as `log-activity` v28 / `wellbeing-checkin` v28: `MAX_BODY_BYTES=102400` const + `payloadTooLarge(req)` helper + 413 short-circuit before the auth path. Defensive; no live exposure since none of these accept anything close to 100KB legitimately. Bundle into next round of EF touches rather than a dedicated security commit.

- **Roll CORS default-origin fallback to remaining public-facing EFs.** Same pattern as `member-dashboard` v59 / `log-activity` v28 / `wellbeing-checkin` v28: drop the `*` empty/null Origin branch, fall through to `https://online.vyvehealth.co.uk`. Roll across: `monthly-checkin`, `onboarding`, `notifications`, `register-push-token`, `schedule-push`, `share-workout`, `edit-habit`, `workout-library`, `member-achievements`, `achievements-mark-seen`, `leaderboard`, every admin EF. Bundle into next round of EF touches.

- **Re-engagement scheduler CORS posture review.** Currently still wildcard `*`. Cron-only invocation so not a real exposure surface, but it does mean a misconfigured Make webhook or local script could reach it. Either keep `*` and document the cron-only fact in §16, or roll the default-origin pattern uniformly. Lewis call if procurement raises during Sage diligence.

## Added 07 May 2026 (security commit 1 spillover)

- **Security commit 2 — DONE 07 May 2026 PM-2.** CSP meta tag in 45 portal HTML files (vyve-site `cdd04999` v1, then `d336db0b` v2 fix-1 in same session after incognito test surfaced PostHog dynamic-load, `wss://` realtime, `frame-ancestors`-via-meta gaps). Render-time XSS sanitiser via `escapeHTML` + `safeURL` helpers shipped on `shared-workout.html` (cross-member XSS surfaces in `${ex.exercise_name}` and `${ex.thumbnail_url}` from custom_workouts.exercises jsonb), `index.html` and `wellbeing-checkin.html` (self-XSS via `${firstName}`). SW cache `vyve-cache-v2026-05-07b-csp-fix1`. Hygiene rolled in: 5 cosmetic `{public}` INSERT policies re-roled to `{authenticated}` via migration. Three new §23 hard rules added. See changelog 07 May PM-2 entry.

- **CSP `'unsafe-inline'` removal — externalise inline script blocks and event handlers.** Current pragmatic CSP carries `'unsafe-inline'` on script-src and style-src because the portal has 83 inline `<script>` blocks across 44 files (engagement.html alone 48KB across 4 blocks; index.html 36KB across 7 blocks; running-plan.html 42KB across 3 blocks) plus 24 files with inline event handlers (`onclick=`, `oninput=`, `onchange=`) and 27/45 files with inline `style=""` attributes. Externalising all of that to `.js`/`.css` files lets us drop both `'unsafe-inline'` markers and tighten the CSP to a real strict policy. Real surgery — pick one big file at a time (engagement.html, index.html, running-plan.html, wellbeing-checkin.html in that order of inline JS volume), externalise its scripts, replace its inline handlers with `addEventListener`, test in incognito, ship. Each file is its own SW-cache-bumping ship.

- **`frame-ancestors` as HTTP response header.** CSP `frame-ancestors 'none'` only works as a real response header, not in `<meta>`. Removed from the meta tag in commit 2 fix-1 to silence browser warnings, but losing actual clickjacking protection. Set it as a Cloudflare worker rule (vyvehealth.co.uk is on Cloudflare; portal is online.vyvehealth.co.uk → GitHub Pages CNAME) or a `_headers` file at `vyve-site` root if GitHub Pages supports it (it doesn't natively — Cloudflare worker is the path). Procurement-grade hardening, not blocking for any current contract. Group with X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy as a single header-set commit.

- **Externalise Supabase JS SDK to local `/supabase.min.js` for `login.html` and `set-password.html`.** Currently those two pages load the SDK from `https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js`. Every other portal page loads from a local `/supabase.min.js` (preload tag observed on nutrition.html etc). Migrating those two pages to the local copy would let us drop `https://cdn.jsdelivr.net` from `script-src` entirely. ~20 min change, two files plus SW cache bump. Cosmetic security hygiene; not procurement-blocking.

- **Security commit 3 — `gdpr-export` EFs. **SHIPPED 07 May 2026 PM-3** (vyve-site `952c4275`, Supabase migrations + 2 EFs + cron registration). Async-with-email GDPR Article 15 export pipeline live end-to-end. Schema: `gdpr_export_requests` table + `gdpr_export_pick_due()` function + `gdpr-exports` Storage bucket. EFs: `gdpr-export-request` v1 (member-facing, queues, 1/30d rate limit, 409 on pending) + `gdpr-export-execute` v1 (cron-driven, walks 45 tables, sanitised auth.users, 7d signed URL, Brevo email, audit log, 3-attempt retry). Cron `vyve-gdpr-export-tick` jobid 21 schedule `*/15 * * * *`. Settings UI: new "Privacy & Data" section, modal flow, "Delete my account" placeholder. SW cache `vyve-cache-v2026-05-07c-gdpr-export`. End-to-end test passed (4MB JSON, 45 tables, 27s latency, real Brevo email, audit row written). **Outstanding:** Lewis copy approval on Brevo email template (single EF redeploy when iterated); HTML companion export file deferred (raw JSON is GDPR-compliant and matches Strava/Notion).** Original spec: Procurement blocker. Mockup-first per Dean's rule. Single signed-URL JSON download via Supabase Storage `gdpr-exports/{email}/{timestamp}.json`, 7-day expiry. Walks ~28 tables: 16 member-scoped sources (`members`, `daily_habits`, `workouts`, `cardio`, `session_views`, `replay_views`, `wellbeing_checkins`, `weekly_scores`, `weekly_goals`, `monthly_checkins`, `nutrition_logs`, `nutrition_my_foods`, `weight_logs`, `exercise_logs`, `exercise_notes`, `custom_workouts`) + derived (`member_home_state`, `member_stats`, `certificates`, `member_achievements`, `member_health_connections`, `member_health_daily`, `member_health_samples`, `running_plan_cache` member-relevant rows, `member_running_plans`, `persona_switches`, `engagement_emails`, `notifications`, `member_notifications`). `verify_jwt:true`. Member can only export own data; admin endpoint same EF behind admin-role guard for procurement "export this member's data" use case. Receipt to `admin_audit_log` action `gdpr_export`. Audit estimated 6h, realistic.

- **Security commit 4 — `gdpr-erase-request` + `gdpr-erase-execute` EFs. MOCKUP SIGNED OFF 07 May 2026 PM-3 (mockup at `brain/gdpr_erasure_flow.md`, latest VYVEBrain commit; v2.1 with typed-email destructive-action confirmation gate matching GitHub repo deletion / Stripe / AWS S3 patterns). All 6 confirmed decisions in the mockup's 'Confirmed decisions' block. Build ready, ~6h estimate, two EFs (gdpr-erase-request + gdpr-erase-execute) + new gdpr_erasure_requests table + 3 Brevo templates (Lewis copy approval pending) + settings.html UI + standalone gdpr-erasure-cancel.html + SW cache bump. Includes Brevo + PostHog third-party purge in execute path.** Original spec: Procurement blocker. Mockup-first. Two-phase to allow accidental-request recovery and match industry practice. `gdpr-erase-request` writes a row to a new `gdpr_erasure_requests` table with 30-day grace + receipt. `gdpr-erase-execute` cron-triggered after grace expiry: deletes from same ~28 tables in dependency order (kill `tg_refresh_member_home_state` triggers on `member_home_state` first, then walk children, then parent `members` and `auth.users`). Receipt to `admin_audit_log` at both phases. Audit estimated 4h, probably 5 with the request/execute split.

- **Re-role 5 cosmetic `public`-role policies to `authenticated`. DONE 07 May 2026 PM-2 (security commit 2 hygiene roll-in).** Migration `security_commit_2_reroll_5_cosmetic_public_policies_to_authenticated` re-roled all 5: `monthly_checkins_member_insert`, `scheduled_pushes_self_insert`, `members can insert chat`, `Members can insert own shares`, `members_insert_own_custom_habits`. Verified post-migration via `pg_policies` direct query (per §23 hard rule). Originally found while verifying audit findings: `monthly_checkins_member_insert`, `scheduled_pushes_self_insert`, `members can insert chat`, `Members can insert own shares`, `members_insert_own_custom_habits`. All have proper `WITH CHECK (auth.email() = member_email)` (or `created_by`/`shared_by` equivalent) so `auth.email()` returning null on anon requests already blocks them. Re-roling is cosmetic for procurement reviewers who flag the `public` label; documented in `security_questionnaire.md`. Bundle with commit 1B.

## Added 06 May 2026 PM-2

- **Home dashboard performance Layer A-tail — NEW.** The `*_this_week` columns (`workouts_this_week`, `cardio_this_week`, `sessions_this_week`, `checkins_this_week`) on `member_home_state` are populated and live but `member-dashboard` is still issuing 4 source-table queries against `workouts`/`cardio`/`session_views`/`wellbeing_checkins` filtered by `activity_date >= currentWeekStart`. Future EF rev should swap these 4 queries for `Number(state.workouts_this_week)` etc. — drops 4 queries from the hot-path `Promise.all`. Same-write-fresh via the trigger writer, so no UX regression. ~30-min change in a future session, plus full verification cohort. **Habits is excluded from this swap** because the v58 fix changed habits goal semantic to distinct-day count, but `habits_this_week` is currently row count — see next item.

- **`habits_distinct_days_this_week` column on `member_home_state` — NEW.** Sibling column to add when picking up Layer A-tail. New plpgsql block in `refresh_member_home_state(p_email)` populates it via `SELECT COUNT(DISTINCT activity_date) FROM daily_habits WHERE member_email=p_email AND activity_date >= v_week_start AND activity_date <= v_today`. Once live, EF can drop the `habitsThisWeek` query entirely and read `state.habits_distinct_days_this_week` instead. The current `habits_this_week` row-count column stays as-is (it's still the right shape if any future surface wants raw tick count rather than goal-progress count) — non-blocking parallel.

- **Layer B — `achievements_inflight` jsonb on `member_home_state` — NEW (deferred from 06 May PM-2).** Move the inflight achievements computation (top 3 closest-to-earn metrics with progress, currently in `getMemberAchievementsPayload(...).inflight`) out of the EF hot path. Pattern: new tiny EF that wraps the existing `getMemberAchievementsPayload` inflight calc and writes via surgical `UPDATE member_home_state SET achievements_inflight = $1, achievements_inflight_updated_at = $2 WHERE member_email = $3` — won't fight the trigger refresh path because that path's `INSERT … ON CONFLICT … DO UPDATE` is explicit and only touches columns it lists. Drive from a 15-min cron (or fold into existing `vyve_recompute_member_stats`). EF reads `state.achievements_inflight` on hot path, keeps the cheap `unseen` query (single email + `seen_at IS NULL` filter). 15-min staleness acceptable — inflight is "closest 3 to earn", not transactional. Drops the in-EF `getMemberAchievementsPayload` call from `Promise.all` (the second-heaviest entry after the 5 source-table this-week queries).

- **Layer C — `activity_log` from `member_activity_daily` — NEW (deferred from 06 May PM-2).** Currently `member-dashboard` issues 5 parallel `*_recent` queries (`daily_habits`/`workouts`/`cardio`/`session_views`/`replay_views` filtered by `activity_date >= recent30Start`) purely to build the 30-day `activity_log` shape. `member_activity_daily` is already aggregated per-member-per-day, refreshed every 30 min via `vyve_rebuild_mad_incremental`. One read replaces five. 30-min staleness invisible because PM-13b breadcrumb overlay covers same-day. Net: 5 → 1 query.

- **Audit `member_home_state` cohort coverage — NEW.** 15 of 31 members have `member_home_state` rows (cross-check during 06 May PM-2 backfill). Could be a join-date cutoff, could be a backfill gap from when the table was added. Quick query against `members` left-joined to `member_home_state` to identify the gap members; if they're active, force a `refresh_member_home_state(email)` call per row. ~10 minutes.

## Added 06 May 2026 PM

- **Recurring weekly goals on home dashboard — DONE 06 May PM.** Member-facing strip on `index.html` now repopulates every Monday via the existing `seed-weekly-goals` EF + `vyve-seed-weekly-goals` cron (`1 0 * * 1`). 4-row template: 3 habits / 3 exercise sessions / 2 live sessions / 1 weekly check-in. Exercise = workouts + cardio combined. Backend was already shipped in a prior session but was undocumented in the brain — this commit closes the front-end half. vyve-site `9152599a`. SW `v2026-05-06b-weekly-goals-recurring`.

- **Coming Up This Week block removed from home — DONE 06 May PM.** Static placeholder showing hardcoded March dates, never wired up dynamically. Removed entirely from `index.html`. Orphan CSS (`.upcoming-list`, `.upcoming-card`, etc.) left in stylesheet — flagged as hygiene-pass item below.

- **Audit `schema-snapshot-refresh` cron health — NEW.** This session uncovered that `weekly_goals.exercise_target` and `weekly_goals.movement_target` columns had been added to the schema but were never surfaced in `brain/master.md` §6 and `brain/schema-snapshot.md`. Either the snapshot cron didn't run on the right Sunday, or it ran but the diff/commit step silently failed. Investigate: check `vyve_job_runs` for `schema-snapshot-refresh` invocations over the last month; spot-check whether the master snapshot file in VYVEBrain reflects the live `information_schema.columns` for at least 3 sentinel tables (members, weekly_goals, achievement_metrics); add a watchdog if the cron is silently failing. ~30 min audit.

- **Orphan `.upcoming-*` CSS in index.html — NEW (hygiene).** Block at byte ~18466 covering 9 selectors. No markup uses them post-Coming-Up-removal. Single contiguous strip-out, ~30 lines. Trivial; do on next index.html touch.

- **`members.movement_target` and `weekly_goals.movement_target` columns — NEW (decide).** Both default to 0 and aren't surfaced in any current template. Either drop in a future migration (after one-week soak to confirm no stragglers reference it), or reuse if a movement-stream-specific row is ever added back. Currently dead weight.

- **Lewis copy review on weekly goals labels — NEW (low priority).** Four labels live now: "Log 3 daily habits", "Complete 3 exercise sessions", "Watch 2 live sessions", "Complete your weekly check-in". All transparent expansions of previously-approved copy; not blocking. Heads-up at next sync.

## Added 06 May 2026

- **Workout session resume fix — DONE 06 May.** Member WhatsApp feedback exposed `workouts-config.js`'s orphan `init()` — declared but never invoked, so `restoreSessionState()` (which is fully built and correct in `workouts-session.js`) never ran. Members tabbing away mid-workout (rest period, lock screen, app switch) lost the session view on return and had to redo it from scratch. Replaced with `vyveBootWorkouts(user)` + two-path wiring (already-fired auth race + cold-login listener) + idempotent boot guard. vyve-site `46006af1`. SW `v2026-05-06a-workout-resume`. New §23 hard rule codified.

- **Audit other portal pages for orphan-init pattern.** Single grep across vyve-site repo for `^async function init` and `^function init` — confirm every match has a matching invocation site (or is replaced with the `vyveBootX` + two-path wiring pattern). Pages to check: `engagement.html`, `leaderboard.html`, `nutrition.html`, `log-food.html`, `cardio.html`, `movement.html`, `exercise.html`, `wellbeing-checkin.html`, `monthly-checkin.html`. Lower urgency than workouts since none have a comparable resume-on-reload feature, but the same wiring bug could be silently breaking other init steps (e.g. avatar bind, logout binding). 30-min audit + however many fixes.

- **Add lightweight e2e smoke test for workout resume.** No automated test caught the regression. Add a Cypress/Playwright smoke that: log in → start a workout → log one set → reload page → assert session view is open and tick is preserved. Same pattern for: complete habit + reload (assert overlay), submit weekly check-in + reload (assert success state). Lewis's call on test infra investment timing — currently zero browser-level tests.

## Added 04 May 2026 PM-15

- **Movement page distance + walks routed to cardio + PM-13b wiring — DONE 04 May PM-15.** Quick-log now captures distance for walks and writes them to cardio (matches cardio.html's `walking` type exactly). Stretch/yoga/mobility/pilates/other still go to workouts. Both `markDone` and `logMovement` now invalidate home cache and record breadcrumbs (PM-13b wiring closed). vyve-offline.js script tag added (was missing — VYVEData was undefined on this page). SW v2026-05-04l-movement-distance. vyve-site commit `91eff384`. No EF changes, no migrations.

- **PM-13b carry-over partially closed.** PM-13b's audit missed movement.html. The remaining surfaces flagged at the end of PM-13b — `workouts.html` direct POST audit, `monthly-checkin.html`, `events-live.html`, `workouts-builder.js` — are still open. None are on the critical "tick → home dot" path; revisit when next adjacent change comes up.

## Added 04 May 2026 PM-14

- **Monthly check-in EF column drift fix — DONE 04 May PM-14.** `monthly-checkin` v18 deployed. Replaced `nutrition_logs.log_date`/`calories` with `activity_date`/`calories_kcal` (PM-12 renamed them; EF never updated). Postgres 42703 was killing every POST with a 500 — zero successful monthly check-ins ever in DB until this fix. Tested live with realistic payload; test row deleted to keep Lewis's April slot open. Members can complete the feature for the first time.

- **EF hygiene backlog opened by PM-14:**
  - **Column rename → EF source grep step.** Add to migration playbook: before applying a column rename to a member-facing table, grep all Edge Function source for the old column name. If found, list the EFs that need updating and ship the EF updates as part of the same change set. Currently relying on memory.
  - **Low-frequency EF smoke tests.** Monthly check-ins, certificate generation, weekly/monthly reports — these can sit broken for weeks because they're not exercised on every page load. Build a tiny `ef-smoke` cron that hits each low-frequency EF once a day with a `dry_run=true` payload and alerts on non-2xx. Owner: Dean. Sized: ~half a session per EF, total maybe a session.
  - **Surface real EF errors to dev.** Page-level `"Something went wrong"` alerts hide server-side bugs from the dev surface. Add `console.error(res.status, await res.text())` to every EF call's failure path so DevTools shows the real error. Member-facing copy can stay generic; the dev surface needs the truth. Touches every page that calls an EF — ~10 surfaces.

## Added 04 May 2026 PM-13c

- **Profile pictures (member avatars) — NOT STARTED.** Members currently see initials only (e.g. "LV") on settings.html, index.html nav avatar, and leaderboard.html rank rows. Add upload + display flow.

  **Architecture (settled in PM-13c discussion):** Supabase Storage public bucket `member-avatars`, one image per member at path `<member_email>/avatar.jpg`, always overwrite. New `avatar_url TEXT` nullable column on `members`. Public bucket chosen over signed URLs because (a) avatars are not sensitive, (b) public URL means no signed-URL refresh churn, (c) cache layer (`vyve_home_v3_<email>`) doesn't have to deal with URL expiry. Cache-bust via `?v=<timestamp>` on the URL stored in `members.avatar_url`.

  **Client pipeline:** `<input type="file" accept="image/*">` → load to canvas → square crop (centre-crop MVP, drag-pan UI later) → resize to 256×256 → re-encode JPEG q0.85 → upload via Supabase Storage SDK or new `avatar-upload` EF (verify_jwt:true, validates <100KB, writes to bucket, updates `members.avatar_url`). End size ~20-30KB. Single source of truth — every surface reads the same image.

  **iOS/Capacitor:** web file input works in WKWebView, surfaces native iOS photo picker, no extra plugin needed for MVP. Camera capture (take new photo right now) is a Phase 2 upgrade — either `accept="image/*" capture="user"` one-liner or `@capacitor/camera` plugin.

  **Surfaces to wire (read side):**
  - settings.html — write surface; new "Profile picture" card above existing profile card; click avatar → picker → upload → success toast → invalidate home cache.
  - index.html — nav-avatar: render `<img src=avatar_url>` if set, initials block fallback if null.
  - leaderboard.html — small circular img next to rank rows (gated on privacy toggle, see open question below).
  - member-dashboard EF — add `avatar_url` to member object in response.
  - employer-dashboard EF — leave initials-only (aggregate-only philosophy holds).
  - leaderboard EF — add `avatar_url` to rank row response (gated on opt-in).
  - auth.js — pull `avatar_url` at login, stash on `window.vyveCurrentUser` so any portal page can read.
  - Cache write site (settings.html upload) calls `VYVEData.invalidateHomeCache()` after success — covered by the §23 hard rule about activity writes; treat avatar update as a "write that affects home rendering".

  **Backend changes:** migration adds `avatar_url TEXT` to `members`. Storage bucket `member-avatars` with public read RLS; write RLS scoped to `auth.email()` matching the file path's first segment. New EF `avatar-upload` (verify_jwt:true). Optional but cleaner: also extend `member-dashboard` EF to return the URL (one column added to existing SELECT — trivial).

  **Open design questions (Lewis's call, not technical):**
  1. **Leaderboard visibility default.** Today the leaderboard is anonymous-by-default ("you only see people above you, never below" + no names). Adding avatars partially undoes that. Recommendation: settings toggle "Show my photo on the leaderboard" defaulting OFF. Avatar always visible to the member themselves on home/settings. Visible on leaderboard only if opt-in. Lewis to confirm before EF response shape is built.
  2. **Default state messaging.** Initials block (current) vs coloured placeholder. Recommendation: keep initials — cheaper, more accessible, looks fine.

  **Explicitly skipped for MVP:** automated content moderation. Small known member base, zero anonymous accounts, employer-onboarded users — problems get reported, don't slip through. Phase 2 if/when needed.

  **Sized:** ~6-7 surgical edits across site files + 1 EF + 1 migration + 1 bucket. Single Claude-assisted session if uninterrupted. Do AFTER the workouts.html / monthly-checkin.html / events-live.html POST audit (PM-13b carry-over) so we don't duplicate the cache-invalidate wiring across overlapping changes.

## Added 04 May 2026 PM-13b

- **Home dashboard tick lag fix — breadcrumb wiring follow-up — DONE 04 May PM-13b.** PM-13's overlay was a no-op because it walked outbox-only and every wired write site uses direct fetch. Added `vyve_recent_activity_v1` breadcrumb store (2-min TTL) populated by every direct-fetch activity write; overlay now merges outbox + breadcrumbs (deduped by habitId for habits). Wiring: habits.html (yes-tick + autotick + undo strip), cardio.html (added invalidate AND record — was missing both), workouts-session.js completeWorkout, tracking.js onVisitStart. SW v2026-05-04k-home-optimistic. vyve-site commit `1549c84e`.

- **INCIDENT — brain markdown leaked to vyve-site Pages for ~3 minutes — RESOLVED 04 May PM-13b.** First commit attempt this session returned a commit (`e31af6e2`) that wrote brain markdown to vyve-site root instead of the 6 site files I sent. vyve-site is private as a repo but is GitHub Pages source for `online.vyvehealth.co.uk`, so all three URLs were briefly publicly fetchable (HTTP 200 confirmed during window). Closure commit `431bfc0c` removed them; Pages 404'd within 15s. New §23 hard rule added: brain content NEVER goes into vyve-site, and every commit_multiple_files call must verify the post-commit changed_paths match the upserts sent.

## Added 04 May 2026 PM-13

- **Home dashboard tick lag fix — DONE 04 May PM-13.** Two-part fix for the "tick → 1-10s blank → fills" UX bug. Cache invalidation on every activity write (habits, workouts, weight, food, check-in, session entry — but NOT heartbeats or plan counters). Optimistic outbox overlay in `renderDashboardData` reads pending writes from `vyve_outbox` and bumps pill strip + counts + activity_log so the dot fills instantly even before the EF round-trip returns. Race-safe: only bumps counts if EF response doesn't already reflect today's activity for that type. SW v2026-05-04j-home-optimistic. vyve-site commit `aa978349`.

## Added 04 May 2026 PM-12

- **log-food.html offline rework — DONE 04 May PM-12.** Closes session 2b. Row identity moved client-side via client_id partial unique index (added PM-8, in place from then). Both inserts queue via VYVEData.writeQueued with ignore-duplicates Prefer. deleteLog handles three cases (outbox cancel for in-flight inserts, queued DELETE by client_id for flushed rows, both for the race). loadDiary now paint-cache-first via vyve_food_diary cache. Legacy rows without client_id get fabricated UUID + fire-and-forget PATCH backfill. SW v2026-05-04i-logfood-clientid. vyve-site commit `6fb46b72`.

- **Offline-tolerance doctrine COMPLETE through PM-12.** No outstanding offline-tolerance items remain. Every member-facing write surface that has any business being offline-tolerant is — workouts, habits, weight log, nutrition log queue transparently with client_id idempotency. Reads paint cache. Live streams + AI generation refuse cleanly. Wellbeing check-in queues + defers AI response via notifications. Future surfaces inherit the pattern: client_id partial unique index on member-authored writes, paint-cache-first reads, VYVEData.requireOnline for genuinely-online-only flows.

## Added 04 May 2026 PM-11

- **Wellbeing check-in offline queue + deferred AI response — DONE 04 May PM-11.** Closes session 2c. EF v25 → v26 (Supabase v39 internal): X-VYVE-Deferred header support + route param on notifications. wellbeing-checkin.html: flushCheckinOutbox drains vyve_checkin_outbox queue on `online` event + 1.5s page-load retry, re-fires EF with deferred header. Notification deep-links to /wellbeing-checkin.html where renderAlreadyDone() paints recs. Natural-key dedup handles idempotency. SW v2026-05-04h-checkin-deferred. vyve-site commit `81aafc58`.

- **Offline-tolerance doctrine COMPLETE through PM-11.** Tolerant where we can: workouts/habits/weight log (PM-7, PM-8). Reads paint cache (PM-9). Honest where we can't: live sessions + running plan generation (PM-10). Bridged: check-in queues + defers (PM-11). Only remaining item is **session 2b — log-food.html client_id rework** (~1.5 sessions). The schema column was added PM-8 and is unused on this table; the work is the UI rework around row-identity for DELETEs.

## Added 04 May 2026 PM-10

- **Offline gates for AI / live pages — DONE 04 May PM-10.** `VYVEData.requireOnline()` helper added to vyve-offline.js. Wired into all 8 live session pages (7 via session-live.js, events-live.html via inline gate), running-plan.html (gate inside generatePlan only), wellbeing-checkin.html (gate inside submitCheckin only). SW `v2026-05-04g-offline-gates`. vyve-site commit `3e46a2f5`. New §23 hard rule codifies the offline-honest pattern.

- **Session 2c shrunk by ~half.** PM-10 ships the user-facing half of the wellbeing-checkin offline UX (graceful refusal at submit time). Remaining work: queue the submission for `member_notifications` fan-out when online returns, with Lewis copy approval on the wording of the deferred-response notification. ~0.5–1 session, blocked on Lewis copy review only.

## Added 04 May 2026 PM-9

- **Offline data layer session 3 — DONE 04 May PM-9.** Audit-driven scope reduction. Two surgical fixes shipped: engagement.html `loadAchievements` flipped from cache-on-failure to paint-cache-first; habits.html offline cache horizon extended (any age, not <24h). Most pages already had bespoke paint-cache-first patterns (`vyve_engagement_cache`, `vyve_lb_cache_*`, `vyve_habits_cache_v2`, home dashboard cache) that didn't need touching. SW cache `v2026-05-04f-cache-paint-first`. vyve-site commit `09b51953`.

- **Cache key hygiene pass (low priority, future).** The bespoke localStorage caches across vyve-site evolved organically: `vyve_engagement_cache`, `vyve_lb_cache_<email>_<range>_<scope>`, `vyve_habits_cache_v2`, the home dashboard cache (no explicit prefix), `vyve_ach_grid`. Each uses slightly different key shapes, freshness windows (24h vs none vs custom), and email-scoping rules. They all work — user-visible result is paint-cache-first across all of them — but a future hygiene pass could unify them under `VYVEData.cacheGet`/`cacheSet` (already exists from session 1, currently used only by workouts modules). Not blocking anything; defer until there's an actual paper-cut from the divergence (e.g., a member sees one page hydrated from cache and the next page showing a skeleton because their localStorage key shape changed mid-version).

## Added 04 May 2026 PM-8

- **Offline data layer session 2a — DONE 04 May PM-8.** `habits.html` + `nutrition.html` weight tracker wired through `VYVEData.writeQueued`. Schema: `client_id` + partial unique indexes added to `weight_logs`, `nutrition_logs`, `wellbeing_checkins` (last two pre-staged for 2b/2c). SW cache `v2026-05-04e-offline-habits-weight`. vyve-site commit `9a9e7cec`. Combined with session 1, the four highest-frequency member-authored writes are now offline-tolerant.

- **Offline data layer session 2b — log-food.html rework around `client_id` row identity.** Currently the two `nutrition_logs` POSTs at log-food.html L900/L927 use `Prefer: return=representation` because the inserted row's server `id` is needed to render the meal slot and back the subsequent `DELETE ?id=eq.<id>` when a member removes an item. Naively queueing the insert would leave the page rendering against a non-existent id. Plan: (1) change `addFoodToLog()` to generate the `client_id` upfront and pass it as the row's local identity; (2) the meal-slot DOM stores `data-client-id` instead of `data-id`; (3) `removeFoodFromLog()` does `DELETE ?client_id=eq.<>&member_email=eq.<>`; (4) the existing read at L576 already returns `client_id` since the column was added 04 May PM-8 — no new column work; (5) wrap insert + delete in `VYVEData.writeQueued`. Note that nutrition writes don't use natural-key idempotency (member can log "chicken breast 200g" three times for breakfast), so `client_id` is the *only* dedupe key — partial unique index on `(member_email, client_id)` already in place from PM-8. ~1.5 sessions.

- **Offline data layer session 2c — wellbeing-checkin.html offline UX.** The submit POST goes to `/functions/v1/wellbeing-checkin`, which returns an AI-generated recommendation that the page renders inline. Queueing the write but not the response means the member taps submit and sees nothing useful. Plan: (1) detect `!navigator.onLine` at submit time; (2) show a Lewis-approved "Your check-in is saved — your recommendations will appear when you reconnect" message instead of the AI loading spinner; (3) queue the EF call via `VYVEData.writeQueued` (the offline outbox accepts EF URLs the same as REST URLs); (4) on the `vyve-back-online` event, re-fire the EF call from the queue, parse the response, and either render it inline if the user is still on the page OR push it as an in-app notification (writing to `member_notifications` with route `/wellbeing-checkin.html` + a "your check-in recommendations are ready" body) so the next time they open the bell they see it. (5) The natural-key idempotency on `(member_email, iso_year, iso_week)` already prevents double-writes; the `client_id` column added PM-8 backs up that guarantee. Lewis copy approval needed on the offline-message wording. ~1 session.

- **Offline data layer session 3 — read-only caching for the remaining surfaces.** engagement.html, leaderboard.html, sessions.html (list view), achievements payload, plus the four parallel data fetches in habits.html (member_habits, daily_habits, week dates, dashboard payload) and the seven reads in wellbeing-checkin.html. All read-only views — no schema changes, no writes to worry about. Wrap each fetch with `VYVEData.fetchCached` and a sensible cacheKey, render via `onPaint` from cache first, swap silently on background refresh. ~2-3 sessions when batched (one session per page family). Closes the loop on Dean's wider feel-of-app-slowness complaint.

## Added 04 May 2026 PM-7

- **Offline data layer session 1 — DONE 04 May PM-7.** `vyve-offline.js` shipped with cache-then-network reads + outbox-queued writes; wired workouts.html end-to-end (loadExerciseHistory, loadCustomWorkouts, saveExerciseLog, completeWorkout INSERT, workout_plan_cache PATCH). `client_id` + partial unique indexes added to `exercise_logs`, `workouts`, `cardio`, `daily_habits`. SW cache `v2026-05-04d-offline-data`. vyve-site commit `d988c963`. Address the original gym-dropout complaint: programme + history + custom workouts paint instantly from cache offline; logged sets and completed workouts queue and drain idempotently when network returns.

- **Offline data layer session 2 — extend to habits, weight, nutrition, wellbeing.** Same module, four more pages. Habits is one wiring change on `daily_habits` (column already added 04 May PM-7); weight needs a `client_id` column + partial unique index on `weight_logs`; food log on `nutrition_logs`; wellbeing check-ins on `wellbeing_checkins`. Each page wires `VYVEData.fetchCached` for the read and `VYVEData.writeQueued` for the write(s), Prefer: resolution=ignore-duplicates header on every queued POST. ~3 hours, mechanical work. Pre-requisite: confirm there are no places where habit/weight/nutrition/wellbeing inserts go through a JWT-required EF path (then we still queue but route to the EF, not direct PostgREST). For wellbeing-checkin specifically, the EF call would queue via writeQueued the same way — only difference is the URL.

- **Offline data layer session 3 — read-only caching for the remaining surfaces.** engagement.html, leaderboard.html, sessions.html (list view), achievements payload. All read-only views of server-aggregated state — no schema changes, no writes to worry about. Wrap each member-dashboard / member-achievements / leaderboard fetch with `VYVEData.fetchCached` and a sensible cacheKey, render onPaint with the cached value first, swap on background refresh. ~2 hours. Closes the loop on Dean's wider feel-of-app-slowness complaint — every page becomes instant from cache on return visits.

- **Stand up a `vyve_offline_outbox_dead` admin surface (low priority).** When a queued write 4xx/5xxs three times, vyve-offline.js dead-letters it to `localStorage.vyve_outbox_dead` and fires a `vyve-outbox-dead` event. Currently nothing listens. For a small cohort it doesn't matter, but as we grow we want a "couldn't save your set — tap to review" toast on the page that owns the write, plus an admin-side count of dead-lettered rows aggregated across members (would require an EF that accepts diagnostic POSTs). Defer until session 3 lands or until we hit our first dead-letter in the wild.

## Added 04 May 2026 PM-3

- **Wire Android FCM in `push-send-native`.** Tokens are already landing — `register-push-token` accepts and stores Android Capacitor tokens in `push_subscriptions_native` (2 tokens, 2 members as of 04 May). What's missing is the send path: `push-send-native` v5 has an explicit branch that skips every Android sub with `reason: "android FCM not implemented (backlog #6)"`. Build: FCM HTTP v1 endpoint (`https://fcm.googleapis.com/v1/projects/{project_id}/messages:send`), service-account JWT signer using Web Crypto (mirror the APNs ES256 pattern), branch on `platform === 'android'` after the iOS path. Until this ships, Android members get the in-app `member_notifications` row + correct routing on tap, but no system banner — the bell icon parity story isn't quite honest. Pre-requisite: Firebase project + service-account JSON key → store as Supabase secret `FCM_SERVICE_ACCOUNT_JSON`. ~1 session.
- **Deprecate VAPID web push stack.** `push_subscriptions` table (10 rows, last sub created 15 April 2026, none since iOS 1.2 ship) is functionally retired — every active member is on a Capacitor binary now. Plan: (1) one-week soak with logging on `send-push` v12 web fan-out leg confirming zero successful pushes; (2) remove the web fan-out branch from `send-push`; (3) drop `vapid.js` from `vyve-site` and the registration call from wherever it's still wired; (4) `DROP TABLE push_subscriptions` after a final 30-day soak. Low risk, just code hygiene. Defer until Android FCM is shipped — don't churn the push stack twice.
- **In-app notifications routing — DONE 04 May PM-3.** vyve-site commit `2fb5a49a`. Notifications sheet on `index.html` (the bell icon) renders each row as a tappable `<button data-id data-route>`; delegated click handler marks-read for that id only and navigates via `location.href = route`. Bulk mark-read on sheet open removed — pink dot now correctly means "not yet tapped". Clear all button retained for explicit bulk. SW cache `v2026-05-04b-habits-remind` → `v2026-05-04c-notif-routing`. No EF or schema changes — `member_notifications.route` column has been populated end-to-end since 29 April PM-2; the renderer just wasn't using it.
- **Brain language overhaul — DONE 04 May PM-3.** Stripped misleading "PWA" framing from master.md where it implied the iOS or Android *member* experience is a PWA. Added two new §23 hard rules: (1) "VYVE is not a PWA — it's two Capacitor binaries"; (2) "Push delivery state — three channels, one working" (APNs live, FCM stubbed, VAPID retired). Renamed §8 header. Reframed §5, §18, §24. Locked the model: vyve-site is the web shell bundled into iOS + Android Capacitor binaries; `online.vyvehealth.co.uk` is a browser-accessible account-management fallback only.

## Added 04 May 2026 PM-2

- **Standardise EF source-header semantic versioning.** Audit (this session) found the `vN` annotations across Edge Function source files inconsistent — some have `// VYVE Health — <name> v<N>` style, some have `// <name> v<N>`, some don't have a version comment at all, and a few of the §7 brain values had drifted away from source. With §7 now stripped of the version column and source declared canonical, source headers are the truth. Sweep all ~32 active EFs once, normalise to a single pattern: `// <ef-name> v<N> — <one-line summary>` followed by a `// Changes from v<N-1>:` block when relevant. Where source has no version comment, add one matching whatever the brain previously claimed (close enough, since the alternative is recovering history nobody has). ~30 mins, one-shot, no functional changes. Output: every active EF self-identifies its semantic version in the first line of source. **PM-3 04 May 2026: `onboarding` v82 done — header/log/`onboarding_version` all v-aligned. ~31 EFs still need the sweep.**

- **Drop `members.kahunas_qa_complete` column.** Dead code post re-engagement-scheduler v8 (04 May PM-2). One-week soak (verify no marketing automation, admin script, or report reads it via Supabase logs `query_log` if available, or audit table grep across all EFs/proxies), then `ALTER TABLE members DROP COLUMN kahunas_qa_complete;`. Low risk — column is boolean, not foreign-key referenced, no triggers attached. Do this around 11 May 2026.

## Added 04 May 2026 PM-1

- **Email pipeline silent-failure recovery (DONE).** Daily/weekly/monthly reports stopped reaching `team@vyvehealth.co.uk` on 28 April due to Brevo recipient-MX cache lag. Diagnosed and resolved 04 May PM-1. Backfilled 12 reports. Watchdog now in place. See changelog.
- **Email watchdog (LIVE).** `email-watchdog` v1 EF + jobid 16 cron (`*/30 * * * *`) covers 5 failure modes with multi-recipient alerts and 6h per-code suppression. New §23 hard rule codified.
- **Investigate elevated platform_alerts rate.** 38 alerts in the 28 Apr – 4 May window: `network_error_member-dashboard` (8), `network_error_register-push-token` (8), `network_error_notifications` (8), `network_error_members` (6), `network_error_sync-health-data` (2), `skeleton_timeout_index` (12), `skeleton_timeout_nutrition` (2), `skeleton_timeout_habits` (2), `js_error` (8). All delivered to Dean+Lewis Hotmail, no missing data, but the rate is elevated and several point at known networking surfaces (push-token registration, dashboard fetch, member fetch). Worth a session: pull the `client_diagnostics` payloads, group by member + alert type, and decide whether any indicate real production issues vs flaky network. ~30 mins exploration.
- **Migrate `team@vyvehealth.co.uk` from personal Microsoft Exchange via GoDaddy to enterprise tenant.** Currently a personal mailbox provisioned via the GoDaddy reseller path with a single `vyvehealth-co-uk.mail.protection.outlook.com` MX. Should move to a proper Microsoft 365 enterprise tenant (or equivalent) post-first-enterprise-contract. Reduces blast radius if anything happens to the personal account. Brain §16 corrected — this is NOT Google Workspace despite earlier userMemories cache stating so.

## Added 29 April 2026 PM-4

- **Surface `auth_blocked` state in member UI.** v9 EF returns `auth_blocked: true` when the all-probes-unauthorized pattern is detected. Currently the v0.6 client auto-recovery silently re-prompts. Better UX would be to show a dismissible banner ("Tap to reconnect Apple Health — required after app updates") when `last_sync_status === 'auth_blocked'`. Avoids the silent permission sheet appearing without context. ~30 mins.
- **Tuck "Force full backfill" button into Settings sub-page.** Currently lives next to "Sync now" on `apple-health.html`. With v9 in place, members shouldn't need it under normal conditions. Either: (a) move to a Settings → Apple Health → Advanced sub-section, (b) remove entirely and rely on `?fullsync=1` URL trigger for support cases. Decide during the apple-health redesign. Lewis copy approval needed.
- **Apple Health page redesign (queued).** Scope: replace `apple-health.html` entirely with an Apple Health-inspired hierarchy — Today's rings → Workouts feed → Steps trend → HR trend → Sleep nightly → Active energy → Weight sparkline. Counts demoted from headline cards to small footer ("Last sync · 2 mins ago · 30 days of data"). Mockup-first workflow per session prompt rule. Lewis copy + framing approval gate. ~2 sessions.
- **Cooldown frequency at scale.** v0.4 dropped `SYNC_MIN_INTERVAL_MS` from 60min to 2min for foreground responsiveness. With 15 members not a concern. At scale (100+ active iPhone members, multiple opens/day) worth checking EF call volume + Capgo battery impact. Monitor as cohort grows; consider lifecycle-only force-sync + 30-min cooldown for visibility events if needed.
- **Investigate increasing `MAX_SAMPLE_AGE_DAYS` cap from 365.** Current 365-day cap on backfill (set in `sync-health-data` v8) means a member connecting HK 18 months after joining gets 12 months. Acceptable for now; surfaceable if/when a real member complains. Trade-off vs runaway batch sizes during first-connect; v9 doesn't change this.

# VYVE Health — Task Backlog

> Updated: 04 May 2026 PM-1 (email pipeline silent failure resolved + `email-watchdog` v1 live every 30 min — multi-recipient alerts, 6h per-code suppression. Brain §16 corrected: `team@vyvehealth.co.uk` is Microsoft Exchange via GoDaddy, not Google Workspace.)

> Previous update: 29 April 2026 PM-3 (Phase 3 Achievements UI redesigned — trophy-cabinet pattern, one trophy per metric, full ladder in modal. 300+ tiles → ~28 trophies. Backlog gained tier-threshold rework as a parked future-vision item.) Headline news: **Achievements UI redesign live on engagement.html — Recently earned + Up next + Trophy cabinet sections, EF unchanged.** `member-achievements` v2 EF (JWT-required) backs the cabinet unchanged. SW cache `v2026-04-29c-trophy-cabinet`. vyve-site commit `30ef4ddba`.

---

## MVP Requirements (Critical for Enterprise Launch)

### 🔥 **Critical Missing Pieces**
1. **Native Push Notifications — Foundation + Session 1 + Session 2 item 1 SHIPPED. SW patch complete.** APNs (iOS) infra fully live end-to-end. AppDelegate.swift bridge methods (27 April PM), `register-push-token` v1 + `push-send-native` v5 ACTIVE. **iOS 1.2 APPROVED 28 April — Ready for Distribution** (bundles HealthKit + native push permission flow + reliability fixes). Session 1 of trigger work: `send-push` v11 unified fan-out EF (web VAPID + native APNs in one call, per-member same-day dedupe via `member_notifications`). `habit-reminder` v14 + `streak-reminder` v14 refactored to delegate. Session 2 item 1 (`achievement-earned-push` v1 + `log-activity` v23 + `achievements-sweep` v2) shipped — end-to-end verified on Vicki's real `member_days` tier 2 cross. **SW `push` + `notificationclick` handlers shipped (`vyve-site@124ecb53`)** — fixed silent web push breakage that had been live since initial rollout. Two new §23 hard rules codified (SW push listener requirement, notificationclick `data.url` routing).

   **Remaining trigger build (Session 2 — 5 EFs, 1/5 shipped 28 April PM):**
   - ~~`achievement-earned-push`~~ **SHIPPED 28 April PM.** v1 deployed; `log-activity` v23 (inline) + `achievements-sweep` v2 (sweep) wired to it. End-to-end smoke verified on Dean (synthetic) + Vicki (real `member_days` t2 cross during sweep). Lewis-approved copy intact. Push fan-out latency 0ms on log-activity (parallel waitUntil).
   - `session-start-nudge` — cron 15 min before scheduled live session start. Optional opt-in (use `members.notifications_milestones` or new column).
   - `weekly-checkin-nudge` — cron Monday 09:00 London. **Cohort split discovered 28 April PM:** of 15 members opted in via `notifications_weekly_summary=true`, 12 are overdue, but **11 of those 12 have never completed a wellbeing check-in at all**. A "your weekly check-in is overdue" push reads wrong to a first-timer. Bifurcated copy needed — first-time activation framing for the 11, continuity framing for prior check-iners. Mental-health-adjacent — Phil should weigh in. **Gated on Lewis + Phil conversation before scaffolding the EF.**
   - `monthly-checkin-nudge` — cron 1st of month 09:00 London.
   - `re-engagement-push` — companion to existing Brevo stream A; cron daily, push to 7-day inactive cohort.

   **Polish (Session 3):**
   - `notification_preferences` — extend `members.notifications_milestones` + `notifications_weekly_summary` to per-trigger booleans (or a new `notification_preferences` table); settings.html UI; max-pushes-per-day cap (3? Lewis decision); Lewis copy approval doc for all 5 trigger types.
   - Foreground-suppression on iOS — Capacitor `pushNotificationReceived` listener should consume the payload as in-app toast input rather than letting APNs banner display, when app is foregrounded.
   - Service worker `notificationclick` handler — read `data.url` from VAPID payload and route. Verify or build.

   **Android (FCM) — parked** until Dean has a Pixel/Galaxy device for testing. Architecture is extension-ready; `push_subscriptions_native.platform` already accommodates.

2. ~~**Habits Editing Bug** — Cannot un-skip or change habit answers once submitted.~~ **SHIPPED pre-session-3 (live on entry 25 April 2026).** Upsert-on-conflict in `logHabit`, Undo button with DELETE in `undoHabit`, unique constraint `daily_habits_member_habit_date_unique (member_email, activity_date, habit_id)` all confirmed live. Re-tapping a habit re-writes the row; Undo clears it and restores the three-button state. RLS `cmd=ALL` covers the UPDATE path cleanly.
3. **HealthKit Integration (iOS-first) + Health Connect (deferred)** — Full plan at `plans/healthkit-health-connect.md`. v1 scope locked: reads 7 data types, writes weight only (workouts write-back not supported by Capgo 8.4.7 on iOS — codified session 4, dead path removed session 5d).
   - ~~Session 1 (DB + EF foundation) shipped 23 April~~: 3 tables, `queue_health_write_back` trigger, `sync-health-data` EF v1 ACTIVE. Shadow-read guard verified.
   - ~~Session 2 pre-device work shipped 23 April~~: `@capgo/capacitor-health@8.4.7` installed, `npx cap sync ios` wired SPM manifest, Info.plist upgraded to Apple-defensible copy, entitlement confirmed.
   - ~~Session 3 (client orchestrator + Settings UI) shipped 23 April~~: `healthbridge.js` + `member-dashboard` v50 (adds health_connections + health_feature_allowed) + settings.html rewrite. Feature-flagged via `localStorage.vyve_healthkit_dev='1'` with server allowlist staged but not yet wired.
   - ~~Session 4 (iOS device validation + UX overhaul) shipped 23 April~~ (commit [612459b](https://github.com/VYVEHealth/vyve-site/commit/612459b)): Xcode 26.4.1 + signing setup, iPhone 15 Pro Max dev-build working, four plugin debugging iterations codifying Capgo 8.4.7 iOS taxonomy (`Health` plugin name, `calories` dataType, `workouts` read-only, no `saveWorkout`). UX pivoted to Apple-native patterns: consent-gate 4th card (iOS only), connect-only Settings toggle with "open iPhone Settings to disconnect" note, 7-day re-prompt banner on index.html. Initial 30-day pull logged as "complete" but unverified.
   - ~~Session 5 (validation, bug hunt, server-authoritative flag) shipped 24 April~~: spot-check of the 30-day pull surfaced two silent bugs. `sync-health-data` v2 (workout-type normalisation fixes unpromoted workouts), SQL backfill of 7 existing samples, then vyve-site commits 5a/5b/5c/5d: readSamples method-name fix + platformId in native_uuid, persistent `has_connected` flag fixing banner regression, server-authoritative hydration via member-dashboard v50 on every page load (flag is off localStorage now — real gate is `HEALTH_FEATURE_ALLOWLIST` in the EF), dead writeWorkout branch removed. SW cache: `v2026-04-24d-write-path-cleanup`.
   - ~~**Session 6 — pipeline rebuild shipped 24 April** (vyve-site `37ad068`)~~: `HKStatisticsCollectionQuery` (Capgo `queryAggregated`) adopted for steps/distance/active_energy; new `member_health_daily` long-format table receives deduped Watch-vs-iPhone aggregates; `sync-health-data` v3→v4→v5 deployed (weight native_uuid anti-echo, client diagnostics persistence, `push_daily` handler); BST bucket-anchor bug squashed (client builds daily anchors from local y/m/d, not ISO-parsed-as-UTC); sleep_state metadata verified landing end-to-end (169 sleep segments over 30 days for Dean with full `{light, rem, deep, asleep, awake, inBed}` state coverage); scale-to-app weight round-trip validated (88.55 kg Bluetooth → HealthKit → `member_health_samples` → `weight_logs` via promotion path). `apple-health.html` inspector built but parked (payload weight with 954 samples, needs paging/scoped-pull). `activity.html` personal feed built then unlinked from `exercise.html` (GPS route maps out of scope without Capgo plugin fork; concept likely reappears in a future community surface rather than per-member self-view).
   - ~~**Session 7a — workout cap now source-aware, shipped 24 April**~~: `workouts.source` + `cardio.source` columns (default `'manual'`); `cap_workouts` + `cap_cardio` triggers only cap manual rows; `session_number` check constraints dropped (were tied to the old 2/day cap); `queue_health_write_back()` nested-conditional fix (was crashing on any workouts INSERT for HK-connected members, masked by Dean being the only HK-connected member who'd not manually logged workouts since 5d shipped); `sync-health-data` v6 ACTIVE (stamps `source: 'healthkit'` on promoted workout/cardio rows). Charity totals + cert counters stay naturally capped at 2/day via `get_charity_total()` + `increment_*_counter()` read-path caps — lifting the trigger cap inflates nothing downstream.
   - ~~**Autotick session 7b — schema + Lewis-approved seeds, shipped 24 April**~~: `habit_library.health_rule jsonb` column (nullable, null = manual-only); 2 existing habits retrofitted (`10-minute walk` → daily distance ≥ 1km; `Sleep 7+ hours` → sleep-state sum ≥ 420 min last_night); 4 new Lewis-approved seeds inserted (`Walk 10,000 steps`, `Walk 8,000 steps`, `Complete a workout`, `30 minutes of cardio`, all movement pot). Paired with session 2 shipped same day. Plan updated at `plans/habits-healthkit-autotick.md`.
    - ~~**Autotick session 2 — server evaluator + `_shared/taxonomy.ts`, shipped 24 April**~~: `member-dashboard` v51 adds `habits` block to response — each active habit returns `health_auto_satisfied` (bool or null) and `health_progress` (`{value, target, unit}` or null). Evaluator routes per source: daily-table for steps/distance/active_energy, sleep-samples last-night window for `sleep_asleep_minutes`, direct workouts+cardio reads for `workout_any`/`cardio_duration_minutes`. Null-not-false semantics when no HK connection or no data in window. `sync-health-data` v7 is a pure refactor — extracts workout taxonomy into shared file, `promoteMapping` body byte-identical. SQL-validated against Dean's live data across all 6 seeded rule shapes. Session 3 (client UI + editing bug fix) is the last piece.
   - **Still open for v1 HealthKit launch:**
     - Consent-gate + re-prompt banner fresh-account flow test (needs clean signup — never done)
     - Rollout decisions: Alan first, then cohort of ~5. Rollback = `member-dashboard` v52 with reduced `HEALTH_FEATURE_ALLOWLIST`
     - Privacy.html HealthKit section + Lewis sign-off + App Store Connect questionnaire + Build 3 submit
     - Submission-scope decision: submit all 7 reads, or phase to 4 (workouts + weight + steps + active_energy) with v1.1 for HR/sleep/distance
   - **Post-launch HealthKit workstreams (all drafted 24 April):**
     - ~~`plans/habits-healthkit-autotick.md` — auto-tick habits from HK data (steps 8k/10k, sleep 7h+, workouts, cardio duration)~~ **SHIPPED 25 April 2026.** All three sessions live: schema + Lewis-approved seeds (session 1/7b), server evaluator + `_shared/taxonomy.ts` (session 2), client UI wired to `member-dashboard` v51 with pre-tick on auto-satisfied rows, `.hk-progress` hints on unsatisfied rows, `.hk-badge` scaffolded hidden pending Lewis design (session 3). Editing-bug fix turned out to already be in place (upsert + undo + unique constraint all live pre-entry). Feature fully flagged via `HEALTH_FEATURE_ALLOWLIST` — Dean only today. Rollout opens alongside the broader HK v1 launch.
     - `plans/healthkit-views.md` — Apple Health data inspector (`apple-health.html`) + personal activity feed on `exercise.html`. Transparency + engagement. ~2 sessions.
     - - `plans/healthkit-background-sync.md` — iOS HealthKit background delivery via `HKObserverQuery` + `BGAppRefreshTask`. **PARKED 25 April 2026** as future vision. Investigation done: Capgo 8.4.7 exposes zero background primitives (verified against the plugin source); architectural path is a companion Swift Capacitor plugin (~400 lines) alongside Capgo. Scope ≈4–5 build sessions + 1 week device soak + App Store review cycle. Unpark signals: Capacitor wrap on stores; member feedback naming background sync specifically; enterprise pilot requirement.
     - Nutrition/MFP reads via HK — parked. Capgo 8.4.7 exposes no dietary types. Would need plugin fork/PR. Separate plan at `plans/nutrition-healthkit.md` when sequenced. Unblocks water habit auto-tick and MFP-native nutrition totals.

### ⭐ **High-Value Additions**
4. **Enhanced Content Quality** — Update wellbeing check-in slider questions to match onboarding questionnaire. Add health disclaimer for App Store compliance.
5. **Advanced Analytics** — Enhanced employer insights with absenteeism correlation, burnout prediction, productivity metrics for enterprise ROI conversations.
6. **HealthKit Rollout — Open to All iPhone Users (~1 session) — SHIPPED 26 April 2026** — Drop the hard-coded `HEALTH_FEATURE_ALLOWLIST` in `member-dashboard` v51 (currently Dean only) and replace with `member_health_connections` row presence as the truthsource. Settings page gets an "Apple Health" toggle, rendered only on iOS Capacitor builds (Android Capacitor + PWA hide it via runtime guard). Existing consent gate flow handles the actual permission + data-sharing wording. **Android Health Connect parked** until Dean has a Pixel/Galaxy device for end-to-end testing — schema and EF logic are extension-ready, no blocker beyond device. Ships **before** the Achievements System (item 7) so the four HK-derived metrics (lifetime steps, distance, active energy, sleep nights) aren't a Dean-only feature on launch day. Effort: ~1 session.

7. **Achievements System — Cumulative-Forever, Push on Earn — PHASE 1 COMPLETE 27 April 2026** — Both Phase 1 layers shipped: data layer (AM session) + Lewis copy approval (PM, two sessions). **Live state:** 32 metrics × 327 tier rows, all `copy_status='approved'`, all 32 `display_name` values finalised. The `copy_status` gate ensures future re-seeds preserve Lewis-approved copy via `CASE WHEN copy_status='approved' THEN public.achievement_tiers.title ELSE EXCLUDED.title END`.

   **Catalog adjustments locked-in alongside copy approval:**
   - Dropped `running_plans_generated` (dead-wired, source table empty), `cardio_distance_total` (only 1/50 historical rows had distance), `session_minutes_total` (dead-wired, view-time data not meaningful yet).
   - Added `volume_lifted_total` in new `volume` category. Required `achievement_metrics_category_check` constraint expansion. Ladder: 100 kg → 50 megatons over 10 tiers. **Not yet wired in evaluator** — see Phase 2 below.
   - Fixed `streak_checkin_weeks` threshold ladder (was day values, corrected to weeks-scaled `3, 6, 10, 16, 26, 39, 52, 78, 104, 156, 208, 260, 312, 520`).

   **Final metric inventory (32):**
   - **Counts (12):** `habits_logged`, `workouts_logged`, `cardio_logged`, `sessions_watched`, `replays_watched`, `checkins_completed`, `monthly_checkins_completed`, `meals_logged`, `weights_logged`, `exercises_logged`, `custom_workouts_created`, `workouts_shared`
   - **Volume (1):** `volume_lifted_total`
   - **Time totals (2):** `workout_minutes_total`, `cardio_minutes_total`
   - **HK-derived (4, hidden_without_hk):** `lifetime_steps`, `lifetime_distance_hk`, `lifetime_active_energy`, `nights_slept_7h`
   - **Streaks (6):** `streak_overall`, `streak_habits`, `streak_workouts`, `streak_cardio`, `streak_sessions`, `streak_checkin_weeks`
   - **Variety (1, recurring):** `full_five_weeks`
   - **Collective (2):** `charity_tips` (recurring), `personal_charity_contribution`
   - **Tenure (1):** `member_days`
   - **One-shots (3):** `tour_complete`, `healthkit_connected`, `persona_switched`

   **Phase 2 — sweep extensions (next to schedule):**
   - `volume_lifted_total` evaluator wiring in `log-activity` INLINE map. **Mandatory sanity caps:** reject any `exercise_logs` row where `reps_completed > 100` or `weight_kg > 500` before counting toward the metric. Two corrupt rows on Dean's account (Back Squat, 2026-04-18, `reps_completed = 87616`) need zeroing first — would fire tier 10 immediately if left unfixed.
   - Sweep extensions for HK lifetime metrics, `full_five_weeks`, `charity_tips`, `personal_charity_contribution`, `tour_complete`, `healthkit_connected`, `persona_switched`. Currently `achievements-sweep` only handles `member_days`.
   - Clean orphan `running_plans_generated` entry from evaluator INLINE map next time we touch `log-activity`.

   **Phase 3 — UI (grid shipped 29 April PM):**
   - **DONE:** `/achievements.js` v1 client lib — toast queue, debounced evaluator, mark-seen, replay-unseen. Loaded on every portal page.
   - **DONE:** log-activity v24 `evaluate_only:true` short-circuit. Trigger pages fire `VYVEAchievements.evaluate()` post-write to activate the evaluator without restructuring the write path.
   - **DONE:** All 9 trigger pages wired (habits, cardio, wellbeing-checkin, monthly-checkin, log-food, movement, nutrition, workouts-session.js, workouts-builder.js, workouts-programme.js).
   - **DONE:** All 8 passive pages load `/achievements.js` for replay-unseen on load (index, engagement, sessions, exercise, settings, running-plan, certificates, leaderboard, workouts).
   - **DONE:** End-to-end smoke verified on Dean's account — toast rendered for `habits_logged` t7 cross.
   - **DONE:** **Notification routing infrastructure** (29 April PM-2, vyve-site `30e8398b`). `member_notifications.route` column + send-push v13 + log-activity v27 (platform v30) + achievement-earned-push v2 + `/achievements.js` + `engagement.html` parseHashRoute + SW postMessage bridge. Hard rule codified master §23. **Every notification anywhere routes to the right place.**
   - **DONE:** **Achievements grid live on `engagement.html`** (29 April PM, commit `997979b5`) — trophy-shelf UI, tier-tinted SVG shapes, modal on tile click, hash deep-link `#achievements` from toast clicks. Backed by `member-achievements` v2 EF (NEW, JWT-required, `getMemberGrid()` in `_shared/achievements.ts`). Tab strip: Progress (default) | Achievements. localStorage cache fallback for offline.
   - **DONE:** Phase 2 `volume_lifted_total` wired into INLINE evaluator with sanity caps. log-activity v25 → v26 (platform v29). 12 cohort tiers backfilled.
   - **TODO:** Index.html dashboard slot showing latest unseen / closest inflight (Phase 3 sub-task, not started).
   - **DONE:** Per-tile deep-link in toast click (`#achievements&slug=X&tier=N`) — modal opens directly on the earned tile (29 April PM-2).
   - **TODO:** Bespoke illustrated badge artwork upgrade — current SVG generator covers 4 shapes × 4 tints. Future upgrade via AI image gen (Gemini + Claude art direction with VYVE brand grade), drop-in replacement of `svgTrophy()` calls. Data layer doesn't change. Captured 29 April PM as the canonical upgrade path; not weeks of illustrator work as previously assumed.
   - **TODO:** Index.html dashboard slot showing latest unseen / closest inflight tier — Phase 3 sub-task, scoped during the morning ship and confirmed unstarted in PM-3. ~1 session of work, low risk (reads existing `getMemberAchievementsPayload()` output).
   - Native push hook on tier earn already wired (achievement-earned-push v2 with deep-link) and fires from real cohort actions.

7a. **Achievements tier-threshold rework — FUTURE VISION (parked 29 April 2026 PM-3)** — Several ladders feel sparse at the upper end (e.g. habits jumping 100 → 250 → 500 → 1000 doesn't keep next-tile reachable). Not blocking anything; trophy cabinet redesign already smooths the perceived density. **Approach when picked up:** surgical add-tiers-between-existing-thresholds (lower-blast-radius play that preserves existing earned `member_achievements` rows, preserves Lewis-approved tier copy via `copy_status='approved'` gate, only requires Lewis approval of new in-between titles — NOT a re-spacing of the whole ladder, NOT a rebackfill). Workflow: (1) audit pass on all 327 tiers identifying worst-spaced ladders, (2) draft new in-between tier copy in VYVE voice, (3) bulk-approval doc to Lewis (same pattern as original 327-row sign-off), (4) SQL migration adding rows with `CASE WHEN copy_status='approved'` protection. Estimated 2 sessions when prioritised. **Trigger to revisit:** real cohort feedback that next-tier-too-far is hurting engagement, or as part of a broader Achievements polish pass. Not before.
   - **TODO:** In-app notifications list UI (bell icon dropdown reading `member_notifications` rows for the authenticated member, marking `read=true` on tap, navigating via `route` column). Schema is ready (`route` populated). Likely lives in nav bar across all member-facing pages. Backlog item; not urgent until cohort grows past current testers.
   - **TODO:** Promote `route` to a first-class input on send-push (currently inferred from `data.url`). No behaviour change, just clarity. Defer until a real reason — current single-source-of-truth via data.url works fine.

   **Voice rules locked-in for future ladder extensions:** no emojis, titles 3-6 words, bodies 10-20 words, VYVE voice (proactive wellbeing, evidence over assumption, no fitness-influencer tone), tier 11+ on long ladders short and reverent (no next-tier nudge), recurring-metric copy evergreen, all titles globally unique. Streaks emphasise consecutive cadence; counts emphasise cumulative volume — distinct body voices.

   **Open verification items:**
   - Confirm `full_five_weeks` source-query maps to the five web pillars (mental/physical/nutrition/education/purpose) — Batch 6 copy enumerates these by name. If wired against five platform activity types instead, body needs a tweak.
   - `tour_complete` assumes the in-app tour is built (backlog item, post iOS approval). Metric currently not wired to anything.
   - `persona_switched` is intentionally one-shot (fires on first switch only, not subsequent).
   - **Copy review queue (Lewis re-approval, surfaced 29 April smoke):** (a) `cardio_logged` tier "50 cardio hit" → should read "50 cardio sessions"; (b) `exercises_logged` ladder gap 100 → 250 too steep, smooth to every-50 progression. Both flagged from real toast-render observation.

8. **In-App Tour / First-Run Walkthrough (~1–2 sessions)** — Full design spec landed 26 April. **Builds on top of the Achievements System** — every tour step earns the relevant first-tier achievement, so day one ends with banked progress on the 30-activity certificates instead of the brutal 0% cold start. **Tour activities count as real activities**, not throwaway tutorial ticks. Modal step-through (option a) confirmed for v1. Walks members through: home dashboard (score ring + streak), first habit log, first workout log, first cardio log (with HealthKit consent prompt at this step on iOS), first session watched, first weekly check-in. Each step ends with the member tapping the actual log button — earning `first_habit` / `first_workout` / `first_cardio` / `first_session` / `first_checkin` (tier 1 of each respective ladder) — and the achievement toast/push fires inline at each step. Tour completion itself earns the `tour_complete` achievement. Persistence via `members.tour_completed_at`, with "Restart tour" in Settings. Skip path required. **Dependencies:** Achievements System (item 7) shipped, Lewis copy + screenshot approval. **Ships after** achievements so the celebration moments at each step actually land. Effort: ~1–2 sessions, mostly UI.

---


9. ~~**Lewis copy approval — Achievements ~400 rows (BLOCKING UI)**~~ **DONE 27 April 2026 across two PM sessions.** All 327 tier rows approved (catalog trimmed from 349 to 327 via metric drops/adds during approval) and all 32 display names finalised. UI is now UNBLOCKED — Phase 3 ready to schedule. Voice rules captured in item 7 for future ladder extensions.

## Active Priorities (This Week)

1. **Android icon fix** — resubmitted 15 April, awaiting Google review (Play Store still pending)
2. ~~**iOS icon fix**~~ — **DONE.** Icon corrected in 1.1(3), then rolled into 1.2(1), now live in approved 1.2 binary on App Store.
3. **Exercise restructure** — Option A (Exercise Hub). Plan at `VYVEBrain/plans/exercise-restructure.md`. **Rounds 1–5 shipped 19 April; movement.html restored 20 April after mock-drift incident.**
   - ~~Round 1: `members.exercise_stream` DB column (workouts/movement/cardio, default workouts, 18 members backfilled) — 19 April~~
   - ~~Round 2: "Workouts" ⮕ "Exercise" label rename across nav.js, index, engagement, certificates, leaderboard — 19 April (`5fe6929`)~~
   - ~~Round 3: `exercise.html` hub page with hero card + 3 stream cards — 19 April (`c5216ca`)~~
   - ~~Round 4: `movement.html` with workout_plan_cache read, activity list, video modal, Mark as Done — 19 April (`b7e19ba1`), restored 20 April (`93092de`) after drift~~
   - ~~Round 5: `welcome.html` stream picker + onboarding EF v77 (stream-aware weekly goals, prog overview, recs, welcome email; workout plan gen wrapped in `if stream==='workouts'`) — 19 April (`0c6de36`)~~
   - ~~Sub-page headers & back buttons (`nav.js`, `workouts.html`, `movement.html`, `cardio.html`) — 20 April (`d4b7171`)~~
   - ~~`cardio.html` data-wired (weekly progress + quick-log + recent history) — 20 April (`93092de`)~~
   - ~~Server-side running plan storage: `member_running_plans` table + `running-plan.html` write-through + `cardio.html` Supabase-first read + localStorage backfill — 20 April (`ce3f1af`)~~
   - **Still open:** Movement plan **content** in `programme_library` (no rows with `category='movement'` yet — all Movement members see no-plan state)
   - **Still open:** `programme_library.category` column to distinguish movement vs gym plans
   - **Still open:** Backfill decision for existing 18 members (all currently default 'workouts')
   - **Still open:** Classes stream on the hub (plan says cross-cutting, not yet built)
   - **Still open:** Hub progress across all streams vs just the primary (open plan-doc question)
   - **Still open:** `mrpSetCompletion` in running-plan.html uses GET-then-PATCH (race-unsafe in multi-tab edit scenarios). Future fix: Supabase RPC wrapping `array_append`/`array_remove` atomics. Acceptable for MVP.
   - **Still open:** Brain hygiene — base64-encoded historical blob in `brain/changelog.md` (~152K decoded chars) needs dedicated cleanup session
4. **Admin Console Shell 3** — spec at `plans/admin-console-shell3-spec.md`, migrations log at `plans/admin-console-shell3-migrations.sql`. Sub-scope priority: A ⮕ B ⮕ C ⮕ E (D deferred).
   - ~~**Sub-scope A EFs complete (23 April).** All three backend endpoints shipped ACTIVE with verify_jwt:true and passing DB-layer smoke tests (10 sim audit rows across habits + programme + weekly_goals). Migration: `extend_member_habits_assigned_by_admin` applied.~~
   - ~~**Sub-scope A UI complete (23 April).** `admin-console.html` extended +23.7KB in one surgical ship (`vyve-command-centre@f3d3f4f`). Three new accordion sections (Programme controls / Habits / Weekly goals) share a generic reason modal; all CSS reused from Shell 2 styles. Latent Shell 2 bug also fixed (toggleSection had no audit-log dispatch). `node --check` + 21 structural checks green.~~
   - **Next:** browser-side JWT smoketest (Dean or Lewis loads admin console, exercises each new panel against own member record). Once closed, Sub-scope B (`admin-bulk-ops` EF + multi-select on member list). Spec for B is ready at `plans/admin-console-shell3-spec.md` §5.
   - Shell 2 E2E smoketest still pending (see `plans/admin-console-shell2-smoketest.md`; 10 sim audit rows now exist from Sub-scope A smoketests but no real pencil-click edits yet). Shell 1 + Shell 2 + Shell 3 Sub-scope A UI live at `admin.vyvehealth.co.uk/admin-console.html`.
5. **Polish and bug-fix pass** — test all flows, fix on-the-fly issues
   - ~~Light-mode readability sweep (semantic token layer + 242-edit HTML pass across 12 pages) — 21 April (`2560dd3`, `b4fbfc8`)~~
   - ~~Nav chrome locked dark on light theme (desktop nav, mobile header, bottom nav, more-menu, avatar panel) — 21 April (`5010fda`)~~
   - ~~exercise.html + movement.html header upgrade (page-header container, eyebrow + italic-accent title + subtitle) — 21 April (`5010fda`)~~
   - ~~sw.js network-first for HTML + skipWaiting + clients.claim — 21 April (`d323d11`). **Implication:** HTML changes reach users on next reload without cache bumps.~~
   - ~~wellbeing-checkin.html + monthly-checkin.html: removed bespoke nav markup, added nav.js, back button + bottom nav now work — 21 April (`f78a7ba`)~~
   - ~~nav.js injects at `document.body.prepend()` — fixes mobile-page-header disappearing on pages with `#skeleton` wrapper — 21 April (`c4b90fe`)~~
   - ~~Leaderboard refactor (Phases 1–4): `members.display_name_preference` + `member_home_state` monthly buckets + `last_activity_at`; `refresh_member_home_state` fixed dedup on `recent_*_30d` + monthly columns + monotonic `*_streak_best`; `leaderboard` EF v9⮕v10 now reads aggregation-layer only (cap-aware counts, display-name resolver, streak tiebreak by `last_activity_at`, optional `scope` param); leaderboard.html + settings.html wired with Privacy section for name preference, tie-aware gap copy, escapeHTML on member-controlled strings — 21 April (`a096c10`)~~
   - ~~Leaderboard UI upgrade (classic 1⮕N board top-100 cap, range selector This month/Last 30 days/All-time, scope tabs hidden unless `scope_available`, dismissible Anonymous banner linking to `/settings.html#privacy`, title-case name rendering for ALL-CAPS/all-lower names, zero-activity footer collapse, all-time 7-day tenure filter): `member_home_state.recent_checkins_30d` column + refresh_member_home_state rewrite; `leaderboard` EF v10⮕v11 (additive: ranked[], overflow_count, zero_count, new_members_count, scope_available, ?range=); leaderboard.html full rewrite + settings.html `id="privacy"` anchor — 21 April (`d49ef95`)~~
6. **Target: self-ready by May 2026**

---

## This Week

- **[P1] SW push handler verification on a real browser** (Mac Safari / iPhone Safari). Tonight's `vyve-site@124ecb53` patch is verified at static-analysis level only; needs a manual `send-push` smoke against Dean's web subs to confirm a banner renders. Member-side rollout happens organically as cohort members reload portal over the next 24h.
- **[P1] `vyve-capacitor` git initialisation** — flagged backlog risk, two-line fix. Becomes painful once native source edits start (Swift plugins, custom Capacitor plugins).
- **[P1] auth.js ready-promise refactor so it can be deferred safely.** Current arrangement: `auth.js` is non-deferred across 14 portal pages because its globals (`window.vyveSupabase`, `window.vyveCurrentUser`, `supa()` pattern assumptions) must exist before inline body scripts execute. This blocks the first-paint perf win we tried to ship in `14a3540`. Proper fix: have `auth.js` export a single `window.VYVE_AUTH_READY` Promise that resolves once the SDK is loaded, client is created, and `getSession()` has settled; every page that currently does `waitForAuth()` awaits that promise instead of listening for a custom event. Then `auth.js` can go back to `defer` and the preconnect/preload hints regain their value. Post-sell; not blocking the May deadline but clears the path for further perf work. See 2026-04-23 changelog entries for full context on the two bugs this prevents.
- **Tech debt: `#skeleton` + `#app` dual-main DOM pattern on exercise.html and movement.html.** These pages wrap loading UI in `<div id="skeleton"><main>...</main></div>` above `<div id="app"><main>...</main></div>`. The 21 April nav.js fix (body-prepend) means nav chrome no longer cares, but the dual-`<main>` structure is fragile for future scripts doing broad selectors. Migrate to single `#app` with internal skeleton state. Pair with Design System Phase E work when that lands.
- **HealthKit / Health Connect integration** — Capacitor plugin; habits linked to activity; weight from smart scales. Needs scoping session.
- **Calendar integration** — connect Google/Apple calendar, show VYVE sessions and workout schedule
- **Calendar page in portal** — dedicated schedule view

---

## Security Quick Wins (from 16 April audit — status after 18 April)

### Done
- ~~Add indexes on `workouts(member_email)`, `cardio(member_email)`, `certificates(member_email)`, `ai_interactions(member_email)`~~ **DONE 18 April**
- ~~Add `logged_at DESC` indexes across activity tables~~ **DONE 18 April**

### Open
- Fix XSS: escape `firstName` in `index.html` before `innerHTML` rendering
- Fix `running_plan_cache` RLS: change `public_update` policy to `member_email = auth.email()`
- Fix INSERT policies on `session_chat`, `shared_workouts`, `monthly_checkins`
- Remove 3 redundant RLS policies on `members` table
- Add explicit service-role-only policies to the 7 aggregation/admin tables (document intent)
- Add `<meta name="mobile-web-app-capable" content="yes"/>` to remaining 12 portal pages (was 13; `wellbeing-checkin.html` added 18 April)
- **Clean up one-shot migration EFs** — recount 28 April: ~32 still-ACTIVE candidates (the original 89-deletion list from the 9 April security audit was only partially actioned). Candidates: `seed-library-1`, `seed-library-2`, `seed-b1`, `create-ai-decisions-table`, `setup-ai-decisions`, `setup-member-units`, `trigger-owen-workout`, `trigger-callum-workout`, `thumbnail-audit`, `thumbnail-upload`, `thumbnail-batch-upload`, `generate-stuart-plan`, `send-stuart-reset`, `monthly-checkin-test`, `run-monthly-checkins-migration`, `run-migration-monthly-checkins`, `resend-welcome`, `delete-housekeeping`, `send-test-welcome`, `send-test-push`, `inspect-members-schema`, `create-test-member`, `create-ai-decisions-table`, `add-exercise-stream`, `force-cache-refresh`, `update-brain-changelog`, `debug-cert-content`, `debug-show-file`, `test-html-render`, `smoketest-ach-push` (28 April inert 410 stub). Keep `ban-user-anthony` if ban workflow still in use. Composio doesn't expose a delete-EF tool — needs Supabase CLI/dashboard.

---

## Brain Hygiene (from 18 April reconciliation)

### Done 24 April session
- ~~`brain/master.md` full rewrite — 55k chars, live-state-sourced from Supabase `list_tables` (70) + `list_edge_functions` (75). Previous file was base64-corrupted and schema had drifted badly (claimed 35 tables / 15 EFs / 31 members). Committed via workbench `run_composio_tool` path, post-commit-verified.~~

### Done this session
- ~~master.md §4: correct the "No triggers" / "No foreign keys" claims~~ **DONE 18 April — actual counts: 119 triggers, 25 FKs (not 14/24 as the previous note said)**
- ~~master.md §4: document the aggregation layer~~ **DONE 18 April — 7 tables + 11 functions + 4 cron jobs documented, Rule 33 added**
- ~~master.md §10: add Rule 33 — aggregation tables are EF-service-role only~~ **DONE 18 April** (+ Rule 34 DB-level caps, Rule 35 email auto-lowercasing)
- ~~Brain reconciliation: update EF inventory~~ **DONE 18 April — all 58 active EFs documented with live versions, missing ones added (admin-dashboard, cc-data, send-password-reset, warm-ping, leaderboard)**
- ~~Automate or delete `brain/schema-snapshot.md`~~ **DONE 18 April — automated via `schema-snapshot-refresh` EF v2 + `vyve_schema_snapshot` cron (Sunday 03:00 UTC). GitHub writes via new fine-grained `GITHUB_PAT_BRAIN` secret (VYVEBrain contents:write only). First auto-commit: [36384af](https://github.com/VYVEHealth/VYVEBrain/commit/36384afa58c9b8381a4d37d6e6554f571dea7229).**
- ~~Resolve `generate-workout-plan` EF ambiguity~~ **DONE 18 April — un-retired. Kept as canonical standalone plan generator. Onboarding v74 duplicates logic inline; refactor task added below.**

### Open
- **Full rewrite of `brain/master.md`** — session 6's pipeline changes (`member_health_daily` table, queryAggregated routing, BST gotcha, v5 push_daily handler) and session 7a's cap fix together constitute enough schema + EF churn that patching master incrementally would drift. Scope: audit all live EF versions (`sync-health-data` v6, `member-dashboard` v50, `certificate-checker` v9, etc.), table inventory including `member_health_daily`, trigger inventory including source-aware caps and fixed `queue_health_write_back`, updated Hard Rules (plpgsql NEW dereference trap + source discrimination for activity caps + queryAggregated-vs-samples routing + BST local-construction rule + nested-condition pattern for record field access). Own session.
- ~~**Audit portal pages for bare `<nav>` tags**~~ **DONE 21 April** — `wellbeing-checkin.html` + `monthly-checkin.html` refactored in `f78a7ba7` to remove bespoke `<nav>` markup entirely and use nav.js instead. Codified as Hard Rule 42: new sub-pages must use the standard 4 head scripts and no bespoke `<nav>`. No remaining portal pages have a bare `<nav>` tag.
- **Add `monthly-checkin` integration smoke test** — the column drift that caused the 500 would have been caught by a single POST test against the live schema. Consider a Deno test that runs against a throwaway test member before each deploy. Surfaced by 18 April fix session.
- **Delete `staging/onboarding_v67.ts`** — stale by 7 versions (live is v74). Misleads future AI sessions.
- ~~**Resolve `auth.js` version disagreement**~~ **DONE 21 April** — master.md §3 now also says v2.4 (confirmed during this session's audit). Both §3 and §12 now agree.
- **Archive pre-April changelog entries** into `changelog-archive/2026-Q1.md` — current changelog is 114KB / 1,658 lines and growing unboundedly
- **Document user-ban workflow** — `ban-user-anthony` v8 exists; anthony.clickit@gmail.com is in `auth.users` with no `public.members` row (orphan). Decide on a reusable pattern if bans will happen again.
- **Migrate `exercise.html` + `movement.html` off `#skeleton` + `#app` dual-main pattern.** Both pages have a `<div id="skeleton"><main>...</main></div>` wrapper that sits before `<div id="app"><main>...</main></div>`. This caused the 21 April nav.js bug (see Rule 40). nav.js is now hardened via `document.body.prepend` so this dual-main pattern no longer breaks the nav, but the pattern itself is fragile — any future utility that queries `document.querySelector('main')` will pick the skeleton one. Candidate refactor: single `#app` root with internal `data-state="skeleton|ready|error"` attribute, single `<main>` whose contents swap based on state. Pair with Design System Phase D (component primitives) — a shared `.page-skeleton` component would remove this pattern from other pages too.

---

## Offline Mode — SHIPPED 17 April 2026 ✅

Auth fast-path (`vyve_auth` cached session) + localStorage data caches on all EF-calling pages + `offline-manager.js` banner + write-action disabling. Full coverage: index, habits, engagement, certificates, leaderboard (full cache), workouts, nutrition, sessions, wellbeing-checkin.

## Admin Console — Shell 2 SHIPPED 22 April 2026 ✅

Hosted at `admin.vyvehealth.co.uk` (repo `vyve-command-centre`). Three HTML files coexist:
- `index.html` — Lewis's Command Centre (OKRs/CRM/content/intelligence)
- `Dashboard.html` — legacy admin dashboard (v9 EF consumer)
- `admin-console.html` — Kahunas-style console (Shell 1 read-only + Shell 2 edit)

**Shell 1** (read-only, shipped 21 April) — member list, detail, timeline, raw tables via `admin-dashboard` EF v9.

**Shell 2** (edit layer, shipped 22 April) — `admin-member-edit` EF v4 + edit UI in `admin-console.html`:
- 14 SAFE fields (inline pencil)
- 7 SCARY fields (modal + reason, logged to `admin_audit_log`)
- Audit Log accordion section in member detail
- Field list verified against real `public.members` schema

**Spec:** `plans/admin-console-spec.md` (written 22 April, post-hoc).
**Earlier `admin-dashboard` plan:** `plans/admin-dashboard.md` (historical, describes Dashboard.html).

### Shell 2 testing still open
- End-to-end SAFE field edit (e.g. `company`)
- End-to-end SCARY field edit (e.g. `persona`) + reason validation
- Audit log display after edit
- Modal dismissal (backdrop click, Escape key)
- Role gating for a `coach_exercise` user (create one and verify persona edit 403s)

### Shell 3 (future)
- Cross-table edits: habits (`member_habits`), programme (`workout_plan_cache`), weekly goals (`weekly_goals`)
- Bulk operations (multi-select, batch persona/stream change)
- Content library CRUD: `habit_library`, `programme_library`, `knowledge_base`
- Member impersonation (support flow)
- Advanced audit filter / search

### Anon-key rotation
`admin-console.html` embeds the project anon key in source (same pattern as portal). Consider rotation if file has been publicly readable for an extended period. Low priority: RLS + `admin_users` allowlist do the real gating.

## Design System — Phase Roadmap

- ~~**Phase A: Token foundation**~~ ✅ Done 17 April 2026
- ~~**Phase B: Semantic colour migration**~~ ✅ Done 17 April 2026
- ~~**Phase C: Session-page template consolidation**~~ ✅ Done 17 April 2026 — 14 stubs + 4 shared files
- **Phase D: Component primitives** (~2 days) — Shared `.btn`, `.card`, `.input`, `.modal-sheet` classes. Removes 72 unique button class names, 90 unique card class names.
- **Phase E: Typography + spacing scale migration** (~1 day) — Replace 118 unique font-size values and 264 unique padding values with `--text-*`, `--space-*` tokens.
- **Future: `VYVE_Health_Hub.html` redesign + PWA linking** — Out of scope for Phases A-E. Planned for later.

---

## Workout Engine v2 — PARKED 27 April 2026 (awaiting Calum's filled inputs pack)

Calum (Physical Health Lead) has delivered the spec, scoring data, and QA framework. We've drafted the inputs pack to give him the remaining must-do inputs (slot templates, contraindications matrix, time→count bounds, progression sign-off, gap-list xlsx for 67 unscored exercises). When he returns the filled pack, the build resumes.

**Architecture decided:** deterministic engine (filter → score with context weights → rank → fill slots) replaces AI exercise selection. AI used only for programme name/rationale (Sonnet 4) + Layer 2 reviewer (Haiku 4.5). Drops cost ~30× (~£0.30 → ~£0.01 per onboarding) AND raises quality by encoding Calum's expertise as data.

**Stages on restart:**
1. Import 203 + 67 = 270 scored exercises into Supabase `exercise_scoring` table; build name normalisation layer (Calum: "Barbell Bench Press" ↔ ours: "Bench Press – Barbell")
2. Build deterministic selection engine in TS inside `generate-workout-plan` v12, behind feature flag
3. Persist new onboarding fields — add columns to `members` for `priority_muscle` + `session_length_workouts`, update onboarding EF v78 → v79 to save them (currently captured by form, dropped by EF)
4. Code Calum's 20 QA scenarios as automated regression tests
5. Shadow mode for ~50 onboardings (run old AI + new engine in parallel, log both, ship old)
6. Cutover after Calum sign-off on shadow comparisons
7. Movement & Wellbeing engine — Dean's call: separate path from workout engine, generates its own movement plan; not yet built (post-Stage 6)

**Calum maintenance surface:** hybrid — Google Sheet sync into Supabase for v1, upgrade to admin page in strategy dashboard later. Sheet → Supabase nightly sync EF needed at Stage 1.

**Inputs pack outputs (drafted, not yet sent to Calum):**
- `VYVE_Inputs_Pack_for_Calum.docx` — 13-page structured questions doc (slot templates, contraindications, time/count, progression, confirmation checklist)
- `VYVE_Exercise_Scoring_Gap.xlsx` — 67-exercise gap list in Calum's format, formulas auto-calc fit-scores + tier from his 8 base scores

**Onboarding alignment shipped today (`Test-Site-Finalv3` `c34c347`):** Section A email/mobile/confirm-email reorder + Section C equipment, environment, session length, priority muscle questions added/rebuilt to match Calum's spec inputs.

---

## Soon

- **Refactor onboarding v74 to call `generate-workout-plan` EF** — remove ~120 lines of inline duplicated logic. EF has a richer implementation (dedicated programme-overview step, better prompts, cleaner video enrichment) than onboarding's inline copy. ~2 hrs, zero-risk if deployed atomically. Surfaced by 18 April reconciliation.
- **In-app onboarding fallback** — simplified questionnaire inside portal for members with no workout plan (~3-4 hrs)
- **Onboarding resilience: save-answers-first** — progressive answer saving + error screen (~2-3 hrs)
- **Load `vapid.js` on other portal pages** — currently only `index.html` has push subscription
- **`certificate-checker` push notification** — send push when cert earned
- **HAVEN clinical sign-off** — formally decide: approve as-is or gate pending professional review. HAVEN is actively being assigned (Conor Warren, 15 April 2026).
- ~~**Dashboard data date-range filter** — `member-dashboard` EF fetches ALL historical data, needs 90-day limit~~ **DONE differently 20 April 2026** — member-dashboard v44 now reads from `member_home_state` aggregate (1 row) + only 30-day slices for the engagement calendar. Fanout is fundamentally solved; no blanket limit needed.
- **Hash emails before sending to PostHog**

---

## Later

- **Accessibility — large text + WCAG pass** (flagged by Alan 21 April — struggles to read portal at his large-text iOS setting). Four-option plan at `plans/accessibility-large-text.md`. Option 1 (restore pinch-zoom) is 10 min; Option 2 (in-app text-size toggle in Settings) is ~half a day. Full WCAG 2.1 AA pass needed before public sector / Sage procurement.
- Social activity feed (spec at VYVEBrain, pending Lewis sign-off on 7 product decisions)
- Dashboard widget customisation
- Persona context modifier system
- AI weekly goals Phase 2 (behavioural goals from check-in data)
- Weekly progress summary email (blocked on Lewis copy)
- PostHog / Supabase Auth identity wiring
- Milestone message system
- Today's Progress dot strip (blocked on Lewis copy)
- Re-engagement copy review — Lewis to bulk-approve subjects + body copy across the new A/B ladder (A_48h/96h/7d/14d, B_3d/7d/14d/30d). Current copy carried forward from v7 staticBodies + AI persona overlay; structurally correct but not yet copy-passed by Lewis post-rewrite.
- Live viewer count on sessions (only display when 20+ viewers)
- **BIMI — logo in inbox sender avatar** — shows VYVE logo next to sender name in Gmail, Apple Mail, Yahoo. Requires: (1) DMARC at `p=quarantine` or `p=reject` (currently unknown — audit first), (2) SVG Tiny P/S logo hosted on `vyvehealth.co.uk`, square, solid bg, <32KB, (3) UKIPO trademark registration for VYVE logo (~£170–340, 4–6 months), (4) VMC from DigiCert/Entrust (~$1.3K/year — Gmail requires this; CMC is cheaper but only works on Apple Mail). Staged plan: audit SPF/DKIM/DMARC now (free, 30 min) ⮕ file UKIPO trademark pre-Sage contract (≈£200, protects brand anyway) ⮕ buy VMC + deploy BIMI DNS post first enterprise contract. Interim: set Gravatar on `team@vyvehealth.co.uk` — works in some clients with zero cost. Not priority until post-revenue.

---

## Grants & Partnerships

- National Lottery Awards for All application
- The Fore grant — register June/July 2026
- WHISPA research partnership — monitor May 2026 launch

---

## Lewis Actions (Business)

- Facebook Make connection — **EXPIRES 22 MAY 2026 (CRITICAL)**
- Make social publisher fix — 133 posts stuck since 23 March
- B2B volume discount tiers — define before first contract
- Brevo logo removal (~$12/month)
- Annual pricing discount % decision
- 5 disabled Make tasks — keep or remove

---

## Completed (Recent)

- **Certificate parse-bug + viewer polish + password UX + reset-email rebrand + share-workout fix session** (22 April 2026) — fixed 3-day `certificates.html` parse error via debug overlay (two missing `</script>` tags); reverted `member-dashboard` v48 `verify_jwt` to false (Rule 21 restatement); rebuilt `certificate.html` viewer (theme-aware chrome + always-light cert panel + iOS-PWA Web Share API PDF download + zoom lock + nav chrome); password show/hide toggle on `login.html` + `set-password.html`; Supabase Auth recovery email rebranded via Management API (Playfair+Inter, brand teal, logo image, dark-mode @media, MSO fallback); `share-workout` v10 fixes "Could not import" via upsert on `onConflict: 'member_email'` (previous UPDATE-then-INSERT violated full-column UNIQUE). Codified Hard Rules 43 (script-tag balance), 44 (workout_plan_cache unique), 45 (iOS PWA blob URL).
- **Certificate parse-bug fix + viewer polish + password UX + reset email + share-workout import fix** (22 April 2026) — (1) `member-dashboard` v49 revert `verify_jwt` to false (Rule 21 trap, second April occurrence); (2) 3-day-old `certificates.html` hang RCA'd via visible debug overlay — two missing `</script>` close tags from 17 April commits, 14 prior fix attempts all theoretically correct but landed in a script block the browser rejected at parse time; (3) `certificate.html` viewer: iOS-PWA-aware download via Web Share API (blob-URL downloads silently fail on iOS PWAs), rotate overlay suppress, theme-aware chrome with always-light cert panel, nav/header/sw register; (4) password show/hide toggle on `login.html` + `set-password.html` (eye icon, cursor-preserving, autocomplete-safe); (5) Supabase Auth recovery email rebrand via Management API — Playfair + Inter, brand teal, light-first with dark-mode @media enhancement, MSO VML fallback, logo image + text wordmark; (6) `share-workout` v10 — `add_programme` now upserts on `workout_plan_cache.member_email` (UNIQUE constraint defeats the UPDATE-then-INSERT pattern). Codified as Hard Rules 43–45.
- **Light-mode readability + nav chrome unification session** (21 April 2026) — theme.css semantic token layer (`--label-*`, `--fill-*`, `--line-*`), 242-replacement sweep across 12 HTML pages, nav chrome locked dark on light theme, exercise/movement/weekly-checkin/monthly-checkin brought in line with standard sub-page pattern, sw.js overhauled to network-first HTML + `skipWaiting()`/`clients.claim()`, nav.js nav-chrome injection moved to `document.body.prepend` (fixes skeleton/app dual-main flash-and-disappear bug). 7 portal commits, 6 brain commits. Codified as Hard Rules 39–42.
- **Three-issue fix session** (18 April 2026) — `monthly-checkin` EF v16 (column drift fix), `wellbeing-checkin.html` nav scoping + viewport zoom fix, `index.html` notif-topbar safe-area + bottom nav style match, sw cache bump to 18a
- **Brain full system reconciliation** (18 April 2026) — master.md rewritten, triggers/FKs/aggregation documented, EF inventory rebuilt
- Admin dashboard + aggregation layer shipped (18 April 2026)
- Desktop nav More dropdown + avatar profile panel (17 April 2026)
- `engagement.html`, `certificates.html`, `index.html` script injection corruption fix (17 April 2026)
- `sw.js` cache migration removed from activate handler (17 April 2026)
- Previous brain reconciliation (16 April 2026)
- Android resubmitted with correct icon (15 April)
- iOS submitted to App Store (13 April)
- `engagement.html` critical fix — double async syntax error (15 April)
- Exercise search overlay CSS fix (15 April)
- `nav.js` bottom bar height reduction (15 April)
- Skeleton timeout monitors on 10 pages (15 April)
- Onboarding v67 — inline workout plan generation (13 April)
- Monthly wellbeing check-in shipped (13 April)
- Workout library Phase 2 — 30 programmes (12 April)
- Workout sharing Phase 1 — `shared-workout.html` (12 April)
- Pause/resume programme switching (12 April)
- Custom habits in settings (12 April)
- In-app notifications + web push (10-11 April)
- Platform monitoring system (11 April)
- Security audit + remediation (11 April)
- Nutrition setup page (11 April)
- Onboarding field audit — 7 new columns (11 April)
- VAPID web push (11 April)
- Brevo email logo update (13 April)