# VYVE Page Documentation

This folder contains a member-and-team-readable explanation of each page in the VYVE platform.

**What these docs are for.** Each portal page gets one markdown file describing what the page is, why it exists, what a member sees, how they use it, and what data flows through it. Plain English. No SQL. No §23 doctrine references. No internal architectural notes.

**Who these are written for.** The VYVE team (Lewis, Alan, Calum, Phil, Vicki, Cole, future hires), prospects in sales conversations who need to understand the product, support team members onboarding, and ultimately the member-facing help centre.

**Who these are NOT for.** Claude doesn't read these for technical context — that's `/brain/master.md`. Engineering work references the brain, not these docs.

## Maintenance

Each doc is updated when the page itself meaningfully changes — new sections, new mechanics, new copy direction. The doc is not a code-level changelog; it captures the *member experience* of the page, which moves more slowly than the implementation.

If a page is shipped without a doc, the doc is a follow-up task on the next session that touches the page. Pages dropped from the portal get their doc archived to `/page-docs/_archive/`.

## File naming

One file per portal page, lowercase, matching the HTML filename: `engagement.md` for `engagement.html`, `habits.md` for `habits.html`, etc. Hub pages (index, exercise, mind, connect) use the page name.

## Current docs

| Doc | Page | Status |
|---|---|---|
| `engagement.md` | engagement.html | First — drafted 24 May 2026 alongside the v2 Score rebuild design |

All other pages remain to be documented. Priority order is best decided by Lewis based on what he needs to explain externally first.
