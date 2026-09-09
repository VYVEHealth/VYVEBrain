# Session prompt — achievements overhaul

Load brain.

This is the achievements overhaul, PM-358, and there's diagnosis already done that I don't want
repeated — read the PM-1145 changelog entry first, it has the mechanisms rather than the symptoms.
Also check `tasks/backlog.md` for the PM-1145 banner.

Three things are wrong and they're related.

The first is the one that actually bothers me. Achievements aren't instant. I logged food, crossed a
threshold, and nothing happened. That's not a popup bug — earning isn't event-driven at all.
`getMemberAchievementsPayload` only *reads* rows that have already been awarded, and the function
that actually awards tiers, `evaluateInline`, isn't on the food-log path or most other activity
paths. So you can complete something and be awarded nothing until some unrelated screen happens to
trigger an evaluation. My requirement is simple: if something's complete, it should be instant.
That means awarding at write time — a trigger or an EF hook on the activity inserts — not batch
evaluation on a home load.

The second is that achievements sometimes re-fire after I've already seen them. `seen_at` marking
does work, so it isn't simply broken — live counts were 1,223 of 1,349 marked seen. It looks like a
race: the unseen set gets read in more than one place and marked after display, so two overlapping
loads can both claim the same row. The dev loop makes it more likely but doesn't cause it.

The third is performance, and it may already be fixed by the time you read this — check the
changelog. The same payload function was the entire member-dashboard latency problem, 24 sequential
database round trips per home load. If the `member-dashboard` performance session has already
landed a single-call version, build on it rather than around it.

One correction to carry: the brain has recorded the catalogue at 32 metrics and 327 tiers against
PM-358. Live is **107 metrics and 538 tiers**. Anyone scoping this off the old figure is sizing it
at a third of the real job, so re-check the live numbers yourself before planning waves.

I'd like this designed properly before any building. Talk me through the awarding model, how you'd
make the seen/unseen handling race-proof, and what it means for the existing 1,349 earned rows —
I don't want members getting a flood of re-fired notifications the day this ships. Mock up anything
member-facing before you code it.

Anything that changes what a member sees — copy, notification text, when a celebration fires — is
Lewis's call, so flag those rather than deciding them.

Close with the usual atomic brain commit.
