# Employer dashboard — minimum cohort floor (k-anonymity)

> Parked 9 September 2026 (PM-1138) for the employer dashboard overhaul, which Dean has queued
> behind the partner portal back end. Nothing here is built. This is a decision-ready brief:
> read it at the start of that session and the design conversation can begin already framed.

## Why this exists now rather than at enterprise time

The aggregate-only PII boundary is a genuine competitive strength and it is the most reassuring
thing VYVE can say to an employer's works council. It is also **only true at scale**. At 200
employees "team wellbeing dropped this month" is a statistic; at nine people it names someone.

The trigger is not the first enterprise client. B2B at £10/user sells to employers of any size, and
a **Bellway trial of ~30 members** is the live prospect. Thirty as a single group is safe. Thirty
split across sites or departments is not.

## The policy Dean set

No aggregated data is shown for any group below a minimum cohort size. Indicative figure **20**,
exact number to be confirmed. A four-person team gets nothing; a 100-person Sales department is fine.

20 is deliberately conservative — most wellbeing platforms use 5–10 — which is the correct side to
err on for a company selling privacy as a differentiator, and it is an easy number to defend to a DPO.

## Three implementation traps

**1. Count responders, not headcount. This is the one that actually bites.**
A department of 100 sounds safe, but if six people completed a check-in that week, the displayed
figure is six people's data wearing a department's name. **The floor must apply to the number of
people actually behind the number being rendered**, not to payroll headcount. Get this wrong and a
well-staffed department is less private than a small one with good engagement.

**2. Subtraction and flicker.**
Company 120 and Sales 100 with two departments makes the other 20 derivable. Worse over time: a team
hovering near the threshold appears and disappears month to month, and its *appearance* is itself a
signal. Suppression should be **sticky** for a view rather than flickering with each period, and any
view that shows both a total and its parts needs checking for complementary disclosure.

**3. Per metric, not per view.**
A department may clear 20 on activity and have 7 answering the stress question. Every rendered
figure carries its own responder count and is suppressed independently.

## Recommendation

One configurable constant applied everywhere — not a tiered scheme by metric or screen. A single
conservative threshold survives a DPO's questions far better than a tiered one that needs justifying
per case. Suppressed cells read "not enough data to show this privately" rather than 0, blank or "—",
because the wording is doing privacy work, not just filling space.

## What Bellway actually means in practice

With ~30 members and a floor of 20, Bellway will realistically only ever see the **whole-group**
figure. No team or site breakdown will clear it. That is the correct outcome and **Lewis should say
so upfront rather than let them discover it**: "you'll see the group as a whole, and we deliberately
won't show you individual teams, because the entire point is that nobody can be picked out." That is
a stronger sales position than an apology in week three.

## Open questions — needed before the design conversation

1. **One group or broken down?** Is the Bellway trial reported as a single cohort, or do they expect
   splits by site, team or department? One group is a small job; splits are where the work is.
2. **Who gets the login?** An HR/wellbeing lead viewing 30 people is a different risk from line
   managers each viewing their own team of six. Managers seeing small teams is the scenario that
   causes real harm.
3. **Does the employer see wellbeing/mental-health figures at all, or only activity and engagement?**
   Activity (workouts logged, sessions attended) is materially lower stakes than mood and stress.
   **What has Lewis already promised them?** That answer sets the boundary more than any design view.
4. **Volunteers or nominated?** If Bellway selected the 30, participants will assume their employer
   sees more than it does, and the in-app privacy messaging has to work harder.
5. **Start date?** Decides whether this is a full build or a floor plus a disabled breakdown view for
   the trial.
6. **Confirm the number.** 20 is Dean's working figure. Whatever lands becomes a single documented
   constant and goes into `brain/security_questionnaire.md` as a stated control.

## Where this lands when built

- Employer dashboard is served by the `employer-dashboard` Edge Function (aggregate-only by design).
- The floor belongs **server-side in that function**, never in the client — a client-side threshold
  is cosmetic and the underlying figures would still be in the payload.
- Add the threshold and its reasoning to `brain/security_questionnaire.md` once set; it is exactly
  the kind of specific, evidenced control that reads well in an enterprise review.
- Wave 3 of the enterprise playbook is DEFERRED pending the Sage model (L12), but **this item is not
  blocked by that** — it applies to any employer of any size and should ship with the overhaul.
