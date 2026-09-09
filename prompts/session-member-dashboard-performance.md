# Session prompt — member-dashboard performance fix

Load brain.

We load-tested the platform on 9 September (PM-1143 to PM-1146) and it found one thing wrong,
clearly and repeatably, so this session is about fixing that one thing. Read the PM-1146 changelog
entry and §23.292 before touching anything — the numbers are all there and I don't want them
re-derived.

The short version. At 30 concurrent users we had zero failures across 2,520 requests. At 200
concurrent we had a 6.36% failure rate, and every single failure was `member-dashboard` timing out
at 60 seconds — both direct PostgREST paths held 100% success with a p95 under 90ms throughout. So
the database, RLS and auth layers are fine and one Edge Function is the whole problem.

What that function does is fan a single member home load out into somewhere between 16 and 45
internal PostgREST calls. We measured it: the gateway logged 29,752 REST requests in a fourteen
minute window while the load generator sent about 3,200. The rest was the function calling itself
out to the database with the service key. Twenty-one of those are the outer queries, already in a
`Promise.all` and fine. The other two dozen are inside `getMemberAchievementsPayload` in
`_shared/achievements.ts`, which loops every INLINE metric and **awaits each one sequentially**.
At 30 concurrent that measured p50 2,104ms, p95 3,541ms, max 6,523ms.

Here's the bit I want you to hold onto, because I nearly shipped the wrong fix. Parallelising that
sequential loop is tempting and it is not the answer on its own — it shortens each invocation but
issues exactly the same number of internal calls, so it makes the 30-user number look great and
leaves the 200-user cliff exactly where it is. **Cut the round-trip count, don't just overlap the
round trips.**

So what I actually want is the achievements payload computed in a single database call — one SQL
function returning the whole thing (unseen, inflight, recent, earned_count, hk_connected) rather
than 24 separate queries — plus caching so it isn't recomputed on every home load when it barely
changes. Same output shape as today, because the client reads it and I don't want to touch
`achievements.js` in this session. While you're in there, `volume_lifted_total` currently pulls
every `exercise_logs` row for a member and sums them in JavaScript, which gets worse the more
people log; that should be a SQL sum.

Do the design talk before you write anything. I want to see the shape of the SQL function and how
you'll handle the cache invalidation before it goes anywhere near production. `member-dashboard` is
the single most-called thing we have and every member hits it on every app open, so this is
production-affecting and gets discussed first.

Deploy with `Supabase:deploy_edge_function`, passing all the `_shared/` files alongside `index.ts` —
never the Composio route, it corrupts the ESZIP. Then verify with a real invocation, not by reading
the code.

When it's deployed, we re-test. The script is `tools/vyve-load-test.js` in VYVEBrain and it's also
in my `~/Downloads`. I'll run it — 30 first, then
`k6 run --stage 1m:50 --stage 2m:200 --stage 3m:200 --stage 1m:0`. I need a fresh member token each
time from the browser console (`JSON.parse(localStorage.getItem('vyve_auth')).access_token`) since
they expire hourly. Target is the home load under about 300ms and the 200-user run clean.

Context for why this matters now: we're aiming for 500 members by the end of the month. That's
roughly 25–50 concurrent at realistic peak, which tonight's test says already works — so this isn't
about survival, it's that I don't want 500 people waiting two seconds every time they open the app.

Close with the usual atomic brain commit, and update `brain/security_questionnaire.md` §5C with the
new figures once we've re-tested — that section currently states the limit honestly and it should
state the fixed one just as honestly.
