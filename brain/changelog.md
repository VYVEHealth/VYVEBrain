**PM-1236 (2026-09-13): PRICING RESET TO £10 + VAT POSITION WORKED OUT (no code).**

**Dean: the £20 list price is retired — pretty much every membership is £10/month from here, B2B £10/seat or lower.** §3 updated. The £20 new-signup Stripe link and the £20/£15/£10 partner tier-coupon ladder (§23.129) now describe a product that no longer exists — Lewis sign-off before either is re-cut.

**VAT, settled from first principles this session:**

- **Not registered, nowhere near.** Threshold is £90k of **turnover, not profit**, on a rolling 12 months — about £7,500/month of billings. Live truth today: no paying B2C at all (1 canceled paid, 25 comp, 1 enterprise seat, rest trials). At £10/month that is ~750 members, or ~750 B2B seats, before it bites.
- **Direction of travel.** You charge VAT on what you sell (output tax) and reclaim it on what you buy (input tax). A VAT-registered customer reclaims what they pay *us*; nobody reclaims VAT on revenue they receive.
- **Crossing is a cliff edge and forward-only** — revenue earned before the registration date is never taxed retrospectively. *Backward test:* exceed £90k over the previous 12 months → notify HMRC within 30 days of that month-end, registered from the 1st of the following month (~2 months' lead). *Forward test:* expect to bill >£90k in the next 30 days **alone** → registered from day one of that window. **A first enterprise contract invoiced annually up front trips the forward test on its own; monthly billing does not — bill the first enterprise deal monthly.**
- **B2B contracts must say "exclusive of VAT".** Employers reclaim, so £10 + VAT costs them nothing net and VYVE still keeps £10. A contract silent on VAT + later registration = HMRC treats the figure as VAT-inclusive and VYVE eats 1/6th per seat for the life of the deal. B2C is the opposite: the price point can't move, so registration is a straight 16.7% haircut on consumer revenue.
- **Partner share must be "50% of Net Revenue"** — amounts actually received from the member less VAT, less payment-processing fees, less any app-store commission — **and inclusive of any VAT the partner must charge**. Fixed-£ or share-of-gross means every external cost comes out of VYVE's half only; VAT-inclusive wording means a partner who registers for VAT doesn't suddenly cost 20% more than one who hasn't. Needs a VAT-registered flag on `partner_partners` + a statement branch; self-billing then requires an HMRC self-billing agreement (partner VAT number, "self-billing", re-signed annually) or registered partners invoice manually. **This closes the partner-statement "VAT position / self-billing clause" open item.**
- **Ruled out:** voluntary registration (Anthropic/Supabase are reverse-charge, almost no input VAT to recover against a 16.7% B2C loss); Flat Rate Scheme (limited-cost business → 16.5% of gross, no saving, loses input recovery); medical-care exemption (needs care by a registered professional, not a platform subscription) and sport exemption (needs a body managed on a voluntary basis — paid directors kill it). CIC status buys procurement points, not tax relief; corporation tax applies as to any company.
- **Threshold counts more than member revenue:** the full gross counts even where half goes to a partner (VYVE is principal, the share is a cost), and reverse-charge purchases from overseas suppliers count toward it too.

**[LEWIS]** £10 list-price sign-off; "exclusive of VAT" on the B2B contract template + price list; partner-agreement rev-share clause re-worded. **[DEAN]** rolling-12-month turnover tripwire on the CC finance page (amber £70k, red £85k) — not built.

---

**PM-1235 (2026-09-13, 07:45): ROWS ARE ROWS AGAIN — CC `d7a2027c` (coach-portal.html md5 `df7fa420`).**

Dean's Day templates screenshot after PM-1234: thumbnail on its own line, name under it, the "unassigned" chip stretched full width, buttons below — every row twice the height. Not the grid view: the pager showed an item with `el.style.display = ''`, which **strips the row's inline `display:flex`** and lets it fall back to block. The rows carry their layout inline (every renderer writes `style="display:flex;…"`), so a DOM-level pager must remember and restore that value (`data-lt-disp`) rather than blanking it. §23.345. Grid view re-cut on Dean's note — thumbnail to the side, name and actions beside it, one compact card (flex-wrap card, 64×48 thumb, tighter buttons). Harness: shown rows read `display:flex`, hidden `none`, page 2 the same.

---

