# Emergency continuity — for Lewis

**If Dean is unavailable and something needs doing, this is the document.**

Read the two pages below first — they take three minutes and will stop you doing anything hasty.
Then paste the prompt in §4 into Claude in the VYVE project. That gets you an assistant that knows
the entire platform, because it can read the same documentation Dean and Claude have been writing
into the repository after every single session.

---

## 1. The first thing to know: nothing is on fire

VYVE is substantially automated and runs unattended. If Dean disappeared this afternoon, the app
would keep serving members, 67 scheduled jobs would keep running, billing and emails would keep
going out, and backups would keep being taken. **Nothing needs to be done in the first hour, or the
first day.** The realistic window before something breaks is weeks, and the likeliest cause is an
expiring credential or a third-party change, not the platform failing on its own.

So: do not rush, do not start changing things, and do not let anyone else start changing things
either. The most damaging thing that could happen here is a well-meaning intervention.

## 2. You already have access

Every account is registered to **team@vyvehealth.co.uk**, which you can get into. That covers
Supabase (the database and server logic — this is the important one), GitHub (all the code), the
Apple and Google store accounts, Stripe, Brevo, PostHog, HubSpot, Cloudflare and the rest.

The one thing to check *before* you ever need it: whether the two-factor codes for those accounts
come to something **you** can reach, or to Dean's phone. If it's Dean's phone, the shared email is
not enough on its own — and that is a fifteen-minute fix today and an impossible one later. Ask him
to sit down with you and try logging into Supabase, GitHub and one store account from your own
device. If it works, you're covered. If it doesn't, that's the gap to close.

## 3. What you'd actually need to do

**In the first week:** nothing technical. Decide whether this is short-term (Dean back in days) or
not. If short-term, leave the platform alone entirely.

**If it's not short-term:** you need one competent engineer, not a team. The platform is
conventional — a database, some server functions, a mobile app — with no unusual infrastructure to
learn. The genuine asset is that everything is documented: the architecture, every decision, every
gotcha, and what was coming next. A good engineer would be productive in days.

**Where to point them:** the `VYVEBrain` repository on GitHub. `brain/master.md` is the architecture
and the hard rules. `brain/changelog.md` is the full history of what was done and why.
`tasks/backlog.md` is what was next. `policies/key-person-handover.md` lists every system and where
it lives.

**Who to tell, and when:** members and employers need to hear nothing unless service is actually
affected. If it is, say something plain and early rather than something detailed and late.

## 4. The prompt to paste into Claude

Copy everything between the lines into a new chat in the VYVE project.

---

I'm Lewis Vines, CEO and co-founder of VYVE Health. Dean, our CTO, is unavailable, and I'm
picking things up. I'm not technical — I run the commercial side — so I need you to explain things
in plain language and to be direct with me about what actually matters versus what can wait.

Start by loading the brain: read `brain/master.md`, then `brain/changelog.md`, then
`tasks/backlog.md` from `VYVEHealth/VYVEBrain` on main. Also read
`policies/key-person-handover.md`, which lists every system we run and where it lives.

Then tell me four things, briefly:

First, what state the platform is actually in right now — is anything broken, is anything about to
expire or run out, is there anything genuinely urgent. Check the live system rather than telling me
what the documentation says, and if the two disagree, trust the live system and tell me they
disagreed.

Second, what was in flight when Dean stopped — anything half-finished, anything committed but not
yet released to members, anything waiting on a decision from me.

Third, what I personally need to do in the next week, in priority order, in plain English, with the
things that can genuinely wait marked as such. Assume I have limited time and no technical
background.

Fourth, if I need to bring in an engineer, what I should tell them and what they'd need access to.

After that, work with me the way you'd work with Dean: make the technical decisions yourself,
explain them to me in terms I can follow, and tell me plainly when something is above what either
of us should be doing without a professional. Don't make changes to anything live without telling me
what you're about to do and what happens if it goes wrong.

---

## 5. Test this before you need it

A contingency nobody has ever run is a hope, not a plan. Once, while everything is fine: Lewis pastes
the prompt above, sees whether the assistant can genuinely read the brain from his account, and tries
signing into Supabase and GitHub from his own device. Fifteen minutes, and it turns an assumption
into evidence — which is also precisely what an enterprise vendor-management reviewer is asking for.

**Last tested:** never. Record the date here when it is done.
