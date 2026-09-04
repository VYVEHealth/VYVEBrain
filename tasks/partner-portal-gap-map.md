# Partner Portal Gap Map — vs coach-portal.html premium bar (PM-991, 4 Sep 2026)

Benchmark: coach-portal.html post-PM-990 (536KB, 307 fns, 15 routed views, nested sidebar IA).
Baseline: partner-portal.html post-PM-976 restore (159KB, 78 fns, 7 flat tabs, no dashboard).
All Wave-1 dashboard/notification reads were already RLS-covered — verified live 4 Sep (bk_partner_select, partner_own_* selects, pr_partner_select, support replies via message-exists).

## Shell & IA
1. ✅ W1 (PM-991) — flat tab strip → grouped sidebar (Dashboard / Notifications / Your space / Business / Support), hash deep-links, legacy tabs kept hidden + driven via .click() (bookings lazy-init preserved)
2. ✅ W1 — dashboard cockpit: tiles (referred members via partner_referral_stats, pending booking requests, next live session, latest payout, content in review, avg rating) + quick actions + latest-activity feed
3. ✅ W1 — notifications feed w/ unread badge (bookings, ratings, payouts, content reviews, admin support replies; localStorage last-seen per partner)
4. Design tokens already unified via assets/tokens.css v2 (PM-763) — W1 styles extend it; no further token work needed

## Per-area depth (Waves 2-5)
5. **Profile → Account area (W2):** tabbed (Overview/Settings/Checklist), public-profile completion bar (partner_partners has 30 cols, form edits ~8), notification prefs (coach_notification_prefs jsonb pattern), post-approval checklist card (welcome video → polish space → schedule launch), welcome-video slot skipping the 48h publish_at rule, admin Go Live from CC gated on portal minimums (PM-880 posture; Lewis deferred-assessments nod is the switch not the build)
6. **Content library treatment (W3):** statuses/moderation lanes (draft/in-review/scheduled/live), folders, per-item play_count/attendance stats surfaced
7. **Community engagement stats (W5):** reach/likes/replies per post (like_count/reply_count exist unrendered)
8. **Calendar unification (W3):** sessions + diary (calendar_occurrences) + bookings → coach-style month/week/list grid; badge-counted requests inbox
9. **Earnings deep-dive (W4):** referral funnel in-portal (partner_referral_stats — currently CC-only surface), MRR breakdown, monthly statement view = the finance payout run landing partner-side (self-billing invoice, £25 rollover, mark-paid; Lewis owes agreement clause + VAT check)
10. **Ratings surface (W5):** partner_ratings + pr_partner_select exist, rendered nowhere (W1 shows avg tile only — full list/reply view outstanding)
11. **Leads for all partner types (W5):** coach_leads + public lead pages are coach-gated; generalise

## Money/attribution remnants folding in (W4-5)
12. human_promo_code generation + backfill 12 partners + validate_code code-or-slug + share text (Piece 1 remnant)
13. continue.html → EF-minted Checkout Session w/ partner coupon (Piece 2 — unlocks per-partner rates)
14. CC-only manual attribution grant, admin source, pre-conversion only (Piece 5)

## At-source + housekeeping (W6)
15. Wizard photos → partner-thumbnails at submit + PM-860 cropper port into Build-your-space
16. Honest wizard upload errors (413/mime) + reportError() in wizard upload paths
17. partners.vyvehealth.co.uk custom domain + PORTAL_BRAND_URL flip
18. Delete one-shot EFs (pm859-publish-partner-photos, pm985-enrich-exercises — dashboard, no MCP delete)

## Exclusions (Dean, standing)
No partner payment tooling beyond VYVE-merchant-of-record model; no impersonation; no self-serve deletion.
