# Referral / Partner System — Operator Playbook

Single reference for how VYVE's partner referral system works end to end: links, coupons, attribution, trials, earnings, and the partner portal. Current as of PM-683 (2026-06-25). When this and the live DB/Stripe disagree, the live state wins — this is the map, not the territory.

## Mental model

A **partner** is an external person/org (Emma Clarke, Men Together CIC, Calum Denham, antonia/april/david/ivan, …) who drives signups and earns a revenue share. Each partner is a row in `partner_partners` keyed by a `slug`. A referred paying member is a row in `partner_memberships` (which doubles as community membership). Partners upload video content and (eventually) run a community space.

The load-bearing idea since PM-683: **partner identity rides on the Stripe subscription's `metadata.partner_slug`, not on the coupon.** Coupons are now shared, tier-based, discount-only.

## Links

Handed to Lewis per partner (replace `<slug>`):
- Join (paid, pick the tier): `https://www.vyvehealth.co.uk/join/<slug>/20` · `/join/<slug>/15` · `/join/<slug>/10`
- Trial (free, no card): `https://www.vyvehealth.co.uk/trial/<slug>`

Routing is served by `Test-Site-Finalv3/404.html` (GitHub Pages catch-all — NOT Cloudflare, NOT a join.html file; §23.129):
- `/join/<slug>/<tier>` → `window.location.replace` to the `partner-join-redirect` EF with the tier.
- `/trial/<slug>` → `welcome.html?c=<slug>` (free signup machinery).

## Tiers & coupons

| Tier | Member pays | Coupon | Notes |
|------|-------------|--------|-------|
| 20   | £20/mo      | none   | full price, partner still attributed via metadata |
| 15   | £15/mo      | `VYVE_TIER15` (£5 off forever) | shared across all partners |
| 10   | £10/mo      | `VYVE_TIER10` (£10 off forever) | shared; also the trial-conversion price |

Per-partner coupons are DEAD (§23.134). Do NOT create a coupon per partner. `partner_partners.stripe_promo_code` still exists only as a legacy attribution fallback.

## Paid flow

1. Member opens `/join/<slug>/<tier>`.
2. `partner-join-redirect` v5 mints a Stripe **Checkout Session** (mode=subscription, base price `price_1TCmukLyCqq49zQI5uTJpO0Q`), applies the tier coupon if any, and stamps `subscription_data[metadata][partner_slug]` + tier. 303 → `checkout.stripe.com`. (custom domain `pay.vyvehealth.co.uk` offered but not confirmed.)
3. On payment, success_url → `welcome.html` (the real onboarding questionnaire — `onboarding_v8.html` is DEAD, §23.130). The member record is created when they submit welcome.html — which is AFTER `subscription.created` fires.
4. Attribution writes the `partner_memberships` row (referred=true, b2c, net `subscription_value`, attribution date).

## Trial flow (£20→£10 conversion locked)

1. `/trial/<slug>` → `welcome.html?c=<slug>` (free, no card).
2. onboarding EF creates the member (`trial_ends_at` NULL); welcome.html fires `apply-trial` → `apply_trial_campaign(email, code)` stamps the trial using `partner_partners.trial_days` (default 14) — it falls back to a live partner slug when the code isn't in `trial_campaigns`.
3. At conversion the member pays £10 (off-app via continue.html, IAP-forced). The webhook/reconcile credit the partner via `members.signup_campaign_code`.
4. Expiry = cron jobid 34 flips the flag vs `trial_ends_at`.

## Attribution (3-tier fallback)

`stripe-webhook` v13 (`handlePartnerReferral`) and `stripe-reconcile` v5 both match, in order:
1. `subscription.metadata.partner_slug` (primary, new).
2. coupon-id → `partner_partners.stripe_promo_code` (legacy).
3. `members.signup_campaign_code` (trial conversions).

The reconciler is the PRIMARY path in practice: because the member row is created at welcome.html submit (after `subscription.created`), the webhook usually can't match yet and skips; `stripe-reconcile` runs every 15 min (cron #52, `*/15`) and catches it — so a referred member joins/attributes within ~15 min of paying.

## Earnings & payouts

- Per-member value = `partner_memberships.subscription_value` = NET monthly paid (`netMonthlyValue()` = price − coupon, /100), never the £20 list (§23.128). The old `DEFAULT 20` was dropped.
- Partner gross = `Σ(subscription_value WHERE referred [and active]) per partner`; payout = gross × `revenue_share_pct` (default 50).
- Admin surfaces: `admin.vyvehealth.co.uk/partners.html` (live SPA, Revenue view) and `pages/partner-revenue.html` — both rewired in PM-683 to the net-paid model (were using a stale `× £20` / `sessions_attended` calc).
- `run_partner_payouts(period)` writes `partner_payouts`; admin "Run payouts" + "Mark paid".
- OPEN: no churn/active-status filter yet — churned referrals would still be paid. Policy decision pending.

## Partner portal (`admin.vyvehealth.co.uk/partner-portal.html`)

CURRENT STATE = shared-password DEMO (§23.133). Login is one password (`vyve2026`); on unlock it SPOOFS `state.session` (email only, no JWT) and pins to a hardcoded `DEMO_PARTNER_ID` (Emma Clarke). Every visitor sees the same demo partner. The `is_partner()` gate was broadened to let admins in (`role IN partner/admin/owner`).

Tabs: Profile, My Content (video upload), Community, Sessions, Earnings.

Video upload pipeline (working as of PM-683):
- Portal `sign` → `partner-content-upload` EF (verify_jwt:false, gated on `x-portal-key: vyve2026`) → signed upload URL into `partner-content/<partner_id>/<ts>-<file>`.
- Browser PUTs the file to the signed URL (≤ global storage limit — see §23.131; raise the Dashboard global limit for big video).
- Portal `commit` → EF inserts `partner_content_items` row at `moderation_status='in_review'` (service role, RLS-clean). It MUST be `'in_review'`, not the `'draft'` default, or the admin moderation queue never sees it (§23.122).
- Admin reviews/approves in `partners.html` Content & Moderation (draft → in_review → published/flagged).

## Onboarding a new partner

See `playbooks/partner-onboarding.md` for the step-by-step. Short version now that per-partner coupons are dead: create the `partner_partners` row (slug, role_title, pillar, revenue_share_pct, trial_days, contact_email, status), then hand Lewis the `/join/<slug>/<tier>` + `/trial/<slug>` links. No Stripe coupon or payment-link object needed per partner.

## Key EFs

| EF | Ver | Role |
|----|-----|------|
| `partner-join-redirect` | v5 | tier→coupon map, stamps metadata.partner_slug, mints Checkout Session |
| `stripe-webhook` | v13 | attribution on subscription events (3-tier fallback) |
| `stripe-reconcile` | v5 | global active-sub scan, primary attribution path (cron #52, */15) |
| `apply-trial` / `apply_trial_campaign` | — | stamps partner trial (trial_days, slug fallback) |
| `partner-content-upload` | v2 | partner-portal video upload (sign + commit, x-portal-key gate) |
| `partner-file-url` | v1 | admin-only DOWNLOAD helper — NOT for upload (do not confuse) |

## Key tables

`partner_partners` (slug, role_title, pillar, status, revenue_share_pct, trial_days, stripe_promo_code [legacy], contact_email [= login linkage], bio/why/avatar_url), `partner_memberships` (referred, subscription_value, member_email, engagement_segment), `partner_content_items` (type, title, media_url, pillar, moderation_status), `partner_payouts`, `partner_applications`, `partner_community_posts`, `partner_scheduled_pushes`, `partner_onboarding_progress`, `partner_programs`. Partner logins (when built): `admin_users` role='partner'.

## Live gaps / next decisions

- Real per-partner portal auth: replace shared password + `DEMO_PARTNER_ID` with real logins (auth user + `admin_users` role='partner' + `partner_partners.contact_email` match per §23.132), flip `partner-content-upload` back to JWT. Decide which partners get logins first. Login provisioning is account creation = Dean/Lewis's call.
- Raise the Dashboard global storage upload limit for real partner video (§23.131); move to resumable/TUS for reliability.
- Real role_title/pillar for antonia/april/david/ivan; per-partner trial lengths (Lewis: 7/14/30 → `update partner_partners set trial_days=N where slug=…`).
- Payout churn filter; real "Attendances by week" data (currently a hardcoded mock in partners.html); an engagement-segment scorer (currently hardcoded 'regular').
- Lewis (compliance): UK pre-charge trial disclosure + ~3-day reminder before the £10 flip.

## Cross-referenced hard rules
§23.122 (in_review not draft) · §23.127 (Payment Links can't pre-apply coupons) · §23.128 (subscription_value = net paid) · §23.129 (/join served by 404.html) · §23.130 (welcome.html not onboarding_v8) · §23.131 (global storage limit) · §23.132 (get_my_partner_id anon grant) · §23.133 (portal demo session spoof / x-portal-key) · §23.134 (metadata.partner_slug attribution, coupons dead).
