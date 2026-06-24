# Partner Onboarding Playbook
## How to onboard a new VYVE partner end-to-end

This playbook covers everything from first contact to the partner being live in the app
with a branded referral link. Claude executes all technical steps. Dean/Lewis handle
approval gates.

---

## What you need before starting

- Partner name (display name, e.g. "Men Together CIC")
- Partner slug (URL-safe, lowercase, e.g. "men-together-cic")
- Partner pillar: `mind`, `body`, or `connect`
- Partner contact email
- Discount amount to offer (default: £10 off forever)
- Revenue share % (default: 50%)
- Short bio (optional — partner can fill in themselves via their portal)

---

## Step 1 — Create the Stripe coupon

**Claude does this via Composio Stripe.**

Coupon spec:
- Name: `[Partner Name] — VYVE Referral`
- ID (human-readable): based on partner slug, uppercase, max 20 chars  
  e.g. `men-together-cic` → `MENTOGETHERCIC`
- Discount: £10 off, forever (amount_off: 1000, currency: gbp, duration: forever)
- Redemptions: unlimited

```
Tool: STRIPE_CREATE_COUPON
Arguments:
  id: "[SLUG_UPPERCASE_NO_HYPHENS]"
  name: "[Partner Name] — VYVE Referral"
  currency: "gbp"
  amount_off: 1000
  duration: "forever"
```

Save the coupon ID returned.

---

## Step 2 — Create the Stripe payment link

**Claude does this via Composio Stripe.**

Uses the existing VYVE £20/month price: `price_1TCmukLyCqq49zQI5uTJpO0Q`

```
Tool: STRIPE_CREATE_PAYMENT_LINK
Arguments:
  line_items: [{ price: "price_1TCmukLyCqq49zQI5uTJpO0Q", quantity: 1 }]
  discounts: [{ coupon: "[COUPON_ID_FROM_STEP_1]" }]
  after_completion:
    type: "redirect"
    redirect:
      url: "https://www.vyvehealth.co.uk/onboarding_v8.html"
  metadata:
    partner_slug: "[slug]"
    partner_coupon: "[COUPON_ID]"
```

Save the payment link URL and ID returned.

---

## Step 3 — Create the partner row in Supabase

**Claude does this via Supabase MCP.**

```sql
INSERT INTO public.partner_partners (
  slug, name, role_title, pillar, status,
  bio, stripe_promo_code, payment_link_url, payment_link_id,
  revenue_share_pct, contact_email
) VALUES (
  '[slug]',
  '[Partner Name]',
  '[Display role/title]',
  '[pillar]',
  'onboarding',
  '[bio if provided, else null]',
  '[COUPON_ID]',
  '[payment_link_url]',
  '[payment_link_id]',
  [revenue_share_pct],
  '[contact_email]'
);
```

---

## Step 4 — The branded referral URL

No build step needed. The `/join/` redirect page on the marketing site
already handles any slug dynamically.

The partner's branded URL is:
```
https://www.vyvehealth.co.uk/join/[slug]
```

e.g. `https://www.vyvehealth.co.uk/join/men-together-cic`

When a member visits this URL:
1. The page shows a brief VYVE-branded loading screen
2. Supabase is queried for the partner's `payment_link_url` by slug
3. Member is redirected to the Stripe payment link (£10 off pre-applied)
4. Member completes checkout → webhook fires → attribution written to `partner_memberships`

**Note:** The partner must be `status='live'` for the redirect to work.
During onboarding they'll get a 404-style error page. Advance to live at Gate B.

---

## Step 5 — Provision portal access (Gate A)

In `partners.html`, advance the partner from `Applied` → `Onboarding`.
This triggers the Gate A confirm dialog and calls `partner-provision` EF which:
- Creates a Supabase Auth user for the partner's contact email
- Creates an `admin_users` row with `role='partner'`
- Emails credentials to the contact email

The partner can then log into `admin.vyvehealth.co.uk/partner-portal.html`.

---

## Step 6 — Partner sets up their profile

Partner logs in and completes:
- Profile tab: display name, bio, avatar
- Content tab: uploads "Welcome to VYVE" video (goes to `in_review` queue)

Claude (or Dean) approves the video in the Content Moderation queue in `partners.html`.

---

## Step 7 — Go live (Gate B)

In `partners.html`, advance from `Onboarding` → `Live`.
- Dean and Lewis both confirm (confirm dialog in the UI)
- `partner_partners.status` flips to `live`
- Partner immediately appears in `partner-space.html` for all members
- Branded referral URL (`/join/[slug]`) now works

---

## Step 8 — Hand off to partner

Send the partner:
1. Their portal login: `https://admin.vyvehealth.co.uk/partner-portal.html`
2. Their branded referral URL: `https://www.vyvehealth.co.uk/join/[slug]`
3. A note that the link has £10 off forever pre-applied — no code needed for members

---

## Summary — what Claude creates per partner

| Item | Tool | Where stored |
|------|------|--------------|
| Stripe coupon | Composio Stripe `STRIPE_CREATE_COUPON` | Stripe + `partner_partners.stripe_promo_code` |
| Stripe payment link | Composio Stripe `STRIPE_CREATE_PAYMENT_LINK` | Stripe + `partner_partners.payment_link_url` |
| Partner DB row | Supabase MCP `execute_sql` | `partner_partners` |
| Portal login | `partner-provision` EF (triggered from `partners.html`) | `auth.users` + `admin_users` |
| Branded URL | Auto-resolved by `join.html` | No extra step |

## Time estimate

Steps 1–4 (Stripe + DB): ~3 minutes with Claude
Steps 5–7 (setup + go-live): depends on partner uploading content, typically 1–2 days

---

## Reconciliation

`stripe-reconcile` EF runs nightly at 02:00 UTC. If the webhook ever fails to
attribute a signup to this partner, it will be caught and recovered automatically.
Any recovery fires a `high` severity `platform_alerts` entry visible in the daily report.

