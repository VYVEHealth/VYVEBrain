# Partner Onboarding Playbook
## How to onboard a new VYVE partner end-to-end

From first contact to a partner being live in the app with a branded referral link.
Claude executes all technical steps; Dean/Lewis handle the approval gates.

> **PM-682 update.** Stripe Payment Links CANNOT pre-apply a coupon (§23.127). Partners no
> longer get a payment-link object. The branded `/join/[slug]` link mints a discounted Stripe
> **Checkout Session** live, via the `partner-join-redirect` EF. So onboarding a partner
> technically = **a Stripe coupon + a DB row.** That's it.

---

## What you need before starting
- Partner name (display, e.g. "Men Together CIC")
- Partner slug (URL-safe, lowercase, hyphenated, e.g. "men-together-cic")
- Pillar: `mind`, `body`, or `connect`
- Contact email
- Discount (default £10 off forever)
- Revenue share % (default 50%)
- Short bio (optional — partner can fill via their portal)

---

## Step 1 — Create the Stripe coupon (Claude, via Composio Stripe)
The coupon IS the partner's referral code AND the thing the /join link auto-applies.

```
Tool: STRIPE_CREATE_COUPON
  id:         "<slug, hyphens removed, lowercase>"   # men-together-cic -> mentogethercic
  name:       "<Partner Name>"                        # shown on the checkout discount tag
  currency:   "gbp"
  amount_off: 1000          # £10 in pence
  duration:   "forever"
```
- Coupon IDs are case-sensitive — keep lowercase, no spaces/hyphens.
- `amount_off` is pence. £10 off the £20 price = 50%. (Or `percent_off: 50` — `netMonthlyValue` handles either, §23.128.)
- Save the coupon id → it becomes the DB row's `stripe_promo_code`.

## Step 2 — Create the partner row (Claude, via Supabase MCP)
```sql
INSERT INTO public.partner_partners (
  slug, name, role_title, pillar, status,
  bio, stripe_promo_code, revenue_share_pct, contact_email
) VALUES (
  '<slug>', '<Partner Name>', '<Display role/title>', '<pillar>', 'onboarding',
  '<bio or null>', '<coupon id>', <revenue_share_pct>, '<contact_email>'
);
```
Do NOT set `payment_link_url` / `payment_link_id` — vestigial (§23.127). The /join EF reads
`stripe_promo_code` and builds the discounted checkout itself.

## Step 3 — The branded referral URL (no build step)
`https://www.vyvehealth.co.uk/join/<slug>`   e.g. `.../join/men-together-cic`

How it works (for debugging):
- `Test-Site-Finalv3/404.html` (GitHub Pages catch-all) reads `/join/<slug>` and redirects to the
  `partner-join-redirect` EF (§23.129 — NOT join.html, NOT Cloudflare).
- The EF looks up the partner (`status='live'`), mints a Stripe Checkout Session for the £20/mo price
  with the coupon auto-applied, and 303s the member to `checkout.stripe.com`.
- Member sees £10/month, types nothing. After paying they land on the real onboarding questionnaire
  `welcome.html?partner=<slug>` (§23.130 — NOT onboarding_v8.html, which is dead).
- Partner must be `status='live'` for the link to work; pre-live it falls back to general checkout.

## Step 4 — Provision portal access (Gate A)
In `partners.html`, advance Applied → Onboarding → triggers `partner-provision` EF: creates a Supabase
Auth user + `admin_users` row (`role='partner'`) + emails credentials. Partner then logs into
`admin.vyvehealth.co.uk/partner-portal.html`.

## Step 5 — Partner sets up their profile
Profile (name/bio/avatar) + Content (uploads "Welcome to VYVE" video → `in_review`).
Claude/Dean approves the video in the Content Moderation queue in `partners.html`.

## Step 6 — Go live (Gate B)
In `partners.html`, advance Onboarding → Live (Dean + Lewis confirm; safeguarding/GDPR bar per §23.84).
`status` → live: partner appears in `partner-space.html` and the /join link goes live.

## Step 7 — Hand off to partner
1. Portal login: `https://admin.vyvehealth.co.uk/partner-portal.html`
2. Branded referral link: `https://www.vyvehealth.co.uk/join/<slug>` — £10 off forever pre-applied,
   no code for members to type.

---

## What Claude creates per partner
| Item | Tool | Stored |
|------|------|--------|
| Stripe coupon | Composio `STRIPE_CREATE_COUPON` | Stripe + `partner_partners.stripe_promo_code` |
| Partner DB row | Supabase MCP `execute_sql` | `partner_partners` |
| Portal login | `partner-provision` EF (from `partners.html`) | `auth.users` + `admin_users` |
| Branded URL | none — `/join/<slug>` is dynamic (404.html → `partner-join-redirect`) | — |

No payment-link object. Steps 1–2 (coupon + DB row) ~2 min with Claude. Steps 4–6 depend on the
partner uploading content + the go-live gate.

## Earnings & attribution
- Member checks out via /join → coupon on the subscription → `stripe-webhook` v11 writes a
  `partner_memberships` row `referred=true` with `subscription_value` = NET paid (§23.128).
- Payout = 50% of what the member actually pays (£5 on a £10 net), monthly via `run_partner_payouts`.
- `stripe-reconcile` (cron #52, every 15 min) backstops any webhook miss AND lands the community
  membership within ~15 min of payment (the member record may not exist at `subscription.created` time).
- B2B members excluded from partner revenue share.
