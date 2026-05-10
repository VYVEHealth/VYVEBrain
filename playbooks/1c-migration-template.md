> **🛑 OBSOLETE — 10 May 2026 (PM-44).** This template documented the per-surface migration discipline for Layer 1c (PM-30..PM-43) and the cleanup commit shape (PM-44 transition from option (a) to option (b)). **Layer 1 closed at PM-44.** All 14 surfaces migrated + cleanup landed. **Do not use this template for new work.** Layer 2 has a different shape — it adds Realtime row events as a new origin signal flowing through the existing bus, not new publish surfaces in member-write code paths. The Layer 2 playbook will document its own discipline. The methodology below remains useful as **historical reference** for how the campaign evolved (race-fix patterns, fallback discipline, schema discipline, audit-count counting), but the per-surface migration shape it describes no longer applies — the publish surfaces are all wired and cleaned up.

---

# Layer 1c Migration Template

> Codified after PM-30..PM-40 stabilised the migration shape. Reference this template at pre-flight; do NOT re-derive the mechanics every session.
>
> Created 09 May 2026 PM-37-Setup.

---

## When to use this template

Every Layer 1c migration: PM-30 through (estimated) PM-44. Three remaining surfaces post-PM-40: shared-workout, certificate, live-session.

After 1c-14 ships, this template is OBSOLETE — the cleanup commit removes the direct-call primitives entirely, and the migration shape no longer applies. At that point: archive this file or rewrite for whatever Layer 2 / Layer 3 / Layer 4 campaigns come next.

**Premium-feel framing:** every 1c migration tightens the cache-staleness contract on a member-facing path. The race-fix lands publish BEFORE the fetch so the cache-stale signal beats the network round-trip. The asymmetric-fallback pattern fixes real bugs on the way through. The self-subscribe pattern keeps achievement journeys page-owned. None of this is incidental — it's the lag-free contract being made systematic.

---

## Pre-flight (one cell, before touching any code)

1. **Refresh HEAD SHAs.** `vyve-site` main → SHA. `VYVEBrain` main → SHA. Both into `/tmp/preflight.json` so post-commit verification has a baseline.
2. **Pick the target file(s)** from `tasks/backlog.md` PM-NN row. Fetch via `GITHUB_GET_REPOSITORY_CONTENT` (live SHA, NOT raw — the raw endpoint returns S3-cached pre-signed URLs that go stale). For multi-file migrations (e.g. 1c-14 live-sessions sharing `session-live.js`), fetch ALL files the migration touches in parallel. Do NOT pre-fetch the whole tree at this stage — that's the deferred audit (§Post-ship).
3. **Grep the target file for primitives** at the publish site you're about to migrate:
   - `VYVEData\.invalidateHomeCache\(`
   - `VYVEData\.recordRecentActivity\(`
   - `VYVEAchievements\.evaluate\(` (or `evaluateNow\(`)
   - `VYVEBus\.publish\(` (sanity — should be 0 unless this is a re-migration)
4. **Classify the fallback shape:**
   - Pre-bus primitives at this publish site > 0 → **SYMMETRIC** fallback (mirror them one-for-one in the `!VYVEBus` else-branch)
   - Pre-bus primitives at this publish site = 0 → **ASYMMETRIC** fallback (intentionally do NOT add the missing primitives in the else-branch; the bus path IS the bug fix)
   - Multiple publish sites in the same migration → classify per-surface; **MIXED** fallback shapes within one commit are valid (PM-36 precedent)
5. **Classify the race-fix ordering** for each publish site:
   - **Initiator** (the publish initiates a write) → publish BEFORE fetch — race-fix pattern. Default for nearly all 1c sites.
   - **Confirmer** (the publish confirms a write that already happened — e.g. queue-drain re-firing queued POSTs that may fail and re-queue) → publish AFTER `res.ok` confirms server-side write. PM-39 deferred `flushCheckinOutbox` is the canonical confirmer.
6. **Decide the event name + schema.** Convention: `<noun>:<verb-past-tense>` (e.g. `weight:logged`, `food:deleted`, `monthly_checkin:submitted`). Schema is JSON-shaped, lowercase keys, `<int|string>?` for nullable IDs. Cross-check `playbooks/cache-bus-taxonomy.md` — if the event name already exists, REFACTOR; if not, taxonomy ADD (patch the taxonomy file in the same brain commit).
7. **Identify subscribers.** For each event:
   - **Home-stale via index.html `_markHomeStale`** — extends source-agnostic for nearly every member-action event. Does this event affect the home dashboard render? If yes, wire (default).
   - **Engagement-stale via engagement.html `_markEngagementStale`** — wire ONLY if the event contributes to engagement scoring (Activity / Consistency / Variety / Wellbeing components). Intentional non-wires: weight (PM-37), persona (PM-38), monthly_checkin (PM-40). If unsure, audit `engagement.html` L388-446 for component math.
   - **Self-subscribe on the publishing page** for achievements eval — wire if the publishing page owns the achievement track for this event (PM-37 nutrition pattern). Idempotent flag is per-page (`__vyve<Page>BusWired`).
   - **Per-surface custom subscribers** — anything page-specific (e.g. `_markMembersCacheStale` on persona changes per PM-38). Audit downstream cache-key consumers if the event invalidates a non-home cache.
8. **bus.js script tag.** If the publishing page already loads bus.js (PM-30 era pages: index, habits, monthly-checkin), no new wiring needed. If not, add `<script src="/bus.js" defer></script>` in the same atomic commit.
9. **SW cache version bump.** Pattern: `vyve-cache-v2026-05-09-pmNN-X-Y` (date prefix from PM-30; X = session count, Y = stage letter). Bump in the SAME atomic commit as the portal change. P3 carried: convention drift if calendar advances (decide-and-codify when triggered).

---

## Patch shape (the standard 1c structure)

The publish site is an `async function` (or arrow function) that performs a member-authored write. The migration replaces the inline primitive block with:

```js
// 1. Build the bus event payload
const _busPayload = {
  // standard envelope
  client_id: <client_uuid_or_null>,
  // event-specific fields per playbooks/cache-bus-taxonomy.md
  // ...
};

// 2. Race-fix ordering: publish BEFORE the fetch (initiator) OR AFTER res.ok (confirmer)
// — — — initiator pattern (default) — — —
if (window.VYVEBus) {
  VYVEBus.publish('<event:name>', _busPayload);
}

const res = await fetch(<EF or PostgREST URL>, {
  method: 'POST', // or 'PATCH' / 'DELETE'
  headers: { /* JWT, content-type, Prefer header for queued inserts */ },
  body: JSON.stringify(_writePayload),
});

if (!res.ok) {
  // standard error handling
  throw new Error(`<surface> failed: ${res.status}`);
}

// 3. Asymmetric/symmetric fallback in else-branch
if (!window.VYVEBus) {
  // SYMMETRIC: mirror the pre-bus primitives one-for-one
  if (window.VYVEData) VYVEData.invalidateHomeCache();
  if (window.VYVEData) VYVEData.recordRecentActivity('<kind>');
  if (window.VYVEAchievements) VYVEAchievements.evaluate();
  // ASYMMETRIC: intentionally empty — pre-bus had no primitives at this site,
  //             the bus path is the bug fix, fallback preserves pre-bus semantics
}
```

For confirmer surfaces (queue-drain), invert step 2 — publish moves after the `if (res.ok) { ... publish ... }` block.

For mixed-fallback commits, repeat the pattern per publish site with the appropriate fallback shape for that site.

### Subscriber extension on `index.html._markHomeStale`

```js
// In index.html — extend the existing source-agnostic handler
VYVEBus.subscribe('<event:name>', () => _markHomeStale());
```

### Subscriber extension on `engagement.html._markEngagementStale`

```js
// In engagement.html — only if the event affects engagement scoring
VYVEBus.subscribe('<event:name>', () => _markEngagementStale());
```

### Self-subscribe on the publishing page (page-owned achievement journey)

```js
// At the bottom of the publishing page
document.addEventListener('DOMContentLoaded', () => {
  if (!window.VYVEBus || window.__vyve<Page>BusWired) return;
  window.__vyve<Page>BusWired = true;
  VYVEBus.subscribe('<event:name>', () => {
    if (window.VYVEAchievements) VYVEAchievements.evaluate();
  });
});
```

### Required cleanup at the publish site

After the publish + fetch + fallback are wired, REMOVE the inline primitive calls from the success path. They should ONLY appear in the `if (!window.VYVEBus)` else-branch (symmetric) or NOT appear at all (asymmetric). The bus path's primitive duties are discharged by subscribers, not by inline calls.

---

## Self-test harness skeleton

The test harness lives at `/tmp/pmNN_test.js`. Structure has stabilised across PM-35..PM-40 at 13–15 groups, ~30–50 tests total. Pattern:

```
1. Bus API regression smoke (2 tests) — VYVEBus.publish exists, VYVEBus.subscribe exists
2. Publish fan-out from <surface> (3-5 tests) — count, event name, payload shape, edge cases (zero-padding, nullability)
3. Race-fix ordering (1-2 tests) — publish.ts < fetch.ts (initiator) OR publish.ts > fetch.ts (confirmer)
4. Subscriber wiring on index.html (2-3 tests) — _markHomeStale fires, cache-key bust verified, idempotency
5. Subscriber wiring on engagement.html (2-3 tests OR explicit non-wire test) — _markEngagementStale fires OR confirms zero subscribers wired
6. Self-subscriber on publishing page (2-3 tests) — eval fires once, debounced, idempotent
7. bus.js script tag wiring (1 test) — present on publishing page
8. Asymmetric/symmetric fallback (3-5 tests) — fallback fires only when !VYVEBus, primitive count matches pre-bus discipline
9. Coexistence with prior subscribers on same page (2-3 tests) — independent fan-outs, isolated event names
10. PM-30/31/32/.../PM-(NN-1) regression suite (10-15 tests) — every prior 1c migration's surface still works
11. Schema validation (3-5 tests) — all required fields present, types match, edge cases covered
12-15. Surface-specific (varies) — error path, retry path, multi-tab coherence, etc.
```

Pass rate target: 100%. Below 100% blocks the ship — re-investigate, do not skip.

---

## Commit message template

```
PM-NN — Layer 1c-X: <surface> → bus.publish('<event:name>', ...)

<Surface> publishes <event:name> on <action description>. <SYMMETRIC|ASYMMETRIC|MIXED> fallback. <Race-fix discipline>. <Subscribers wired>.

Self-tests: NN/NN passing across NN groups.

Bus event: <event:name>
Schema: { ... }
Subscribers: index.html (_markHomeStale), engagement.html (<wired|NOT wired>), <publishing page> (self-subscribe for achievements eval).

Audit-count delta: invalidate <prev>→<new>, record <prev>→<new>, evaluate <prev>→<new>, publish <prev>→<new>, subscribe <prev>→<new>.

Cache: vyve-cache-v2026-05-09-pmNN-X-Y
```

The first line MUST start with `PM-NN — Layer 1c-X:` for changelog-grep discoverability. The audit-count delta block is required — it carries the post-ship counts forward as the next session's baseline.

---

## Post-ship verification (within 30s of commit)

Required, not optional. Failure here means rolling back or fast-fixing.

1. **Re-fetch the committed file via `GITHUB_GET_REPOSITORY_CONTENT`** (live SHA, NOT raw). Diff the first 100 chars against what you committed — confirm the upsert landed.
2. **Re-fetch the `sw.js`** with the new cache-version constant. Confirm the bump.
3. **Hit the live URL** at `online.vyvehealth.co.uk/<page>` in fresh incognito with DevTools open. Verify the bus.publish fires on the action (Network tab + console listener).
4. **Confirm subscribers fire** — open `index.html` in a second incognito tab, perform the action in tab A, watch `_markHomeStale` console log in tab B (cross-tab via storage event).
5. **9-marker Source-of-truth audit** (deferred until after Step 4 passes — runs in parallel with the brain commit):
   - Whole-tree audit at the new HEAD: count primitives across ALL source files
   - Compare to the pre-flight baseline + this migration's expected delta
   - If delta matches: update §3.2 in active.md with new baseline
   - If delta does NOT match: investigate before brain-committing — could be a missed publish site, a missed subscriber, or a count-classification ambiguity

---

## Brain commit shape (post-ship, atomic)

After post-ship verification passes, ONE atomic brain commit covering:

- `brain/master.md` — IF a §23 sub-rule was earned, append it (line-numbered for active.md cross-reference). Most 1c migrations don't earn a new §23 rule — only when the migration surfaces a NEW pattern not covered by PM-30..PM-40 (e.g. PM-39's confirmer-pattern race-fix-ordering rule).
- `brain/changelog.md` — PREPEND the new entry. Format:

```
## 2026-MM-DD PM-NN (Layer 1c-X: <surface> → `bus.publish('<event:name>', ...)`)

vyve-site `<short-SHA>` (new tree `<tree-SHA>`). <Nth> Layer 1c migration. Single|N publishing surface(s) (`<function>` at `<path>:<line range>`), <SYMMETRIC|ASYMMETRIC|MIXED> fallback, <NEW|EXISTING> event name `<event:name>`. <Brief campaign-position framing.>

**Pre-bus primitives at the publish site.** ...

**Pre-flight scope confirmation.** Whole-tree audit at HEAD `<prev>`. ...

**Race-fix mechanic.** ...

**Subscribers wired.** ...

**Asymmetric fallback / symmetric fallback / mixed fallback.** ...

**Schema.** `<event:name>`: `{ ... }`. ...

**N of N self-tests passing** in `/tmp/pmNN_test.js` (M groups). ...

**Audit-count delta:** invalidate <prev>→<new>, record <prev>→<new>, evaluate <prev>→<new>, publish <prev>→<new>, subscribe <prev>→<new>.

**Sequence after PM-NN:** <X> Layer 1c migrations down (1c-1 through 1c-X), <Y> to go. ...
```

- `tasks/backlog.md` — PREPEND the closing entry under a `## Added <date> PM-NN` block. Format:

```
## Added <date> PM-NN (<one-line summary>)

- ✅ **CLOSED — PM-NN above.** vyve-site `<short-SHA>`. <Brief framing.>
- 📋 **OPEN (P0) — PM-(NN+1): TBD specific row.** Pre-flight at next session start. Candidates: ...
- 📋 **CARRIED FORWARD (P3) — ...** (any P3 carried items, e.g. cache-version date convention drift)
```

- `playbooks/cache-bus-taxonomy.md` — IF the migration is a taxonomy ADD or correction, patch the relevant section. Always update the "Migration plan" table to flip the row's status to ✅. Append to the `Audit history` block at the bottom with the post-ship audit method.
- `brain/active.md` — IF the migration changes §3.1 status (always), §3.2 audit-counts (if delta), §4 sub-rules (if earned), §5 backlog (always — pop the closed P0, push the new P0), §2 SHAs (always — bump to new HEAD).

All five files via ONE `GITHUB_COMMIT_MULTIPLE_FILES` call to VYVEBrain. Refresh SHAs immediately before. Verify post-commit by re-fetching first 100 chars of each file. If `changed_paths` returned doesn't match upserts sent, the commit is broken — re-issue with a uniquifier in the message.

---

## Common pitfalls (codified across PM-30..PM-40)

- **Don't audit a hand-picked file subset.** Whole-tree pre-flight only — PM-26 §23 rule. The 5-extra-seconds cost beats the false-negative finding that gets baked into a downstream design doc.
- **Don't count `typeof X === 'function'` guard lines as primitive call sites.** PM-32 sub-rule. Filter regex is `<primitive>\s*\(` AND NOT matching `typeof.*<primitive>`.
- **Don't synthesise a new event name when an existing one applies.** REFACTOR > ADD. If two publish surfaces both represent the same noun-verb (e.g. `food:logged` for both search-add and quickadd), use ONE event with a `kind` discriminator — not two events.
- **Don't double-evaluate via the symmetric-fallback else-branch and a self-subscriber.** Pick one. Self-subscriber is preferred (PM-37 pattern); fallback else-branch is the older shape.
- **Don't smuggle reconcile-and-revert into a 1c migration.** Layer 4 territory. Failure-window staleness is bounded and acceptable for Layer 1c.
- **Don't update the cache-version date prefix without checking calendar.** P3 carried — decide-and-codify at first session crossing midnight UK time.
- **Don't trust the audit diagnosis embedded in the prompt** if the function hasn't been touched in days. Fetch live source, run live `EXPLAIN ANALYZE`, pull live schema. PM-16 §23 rule.

---

## Source-of-truth

This template was written 09 May 2026 PM-37-Setup against the post-PM-40 state of the campaign:

- 11 of 14 1c migrations shipped (PM-30 through PM-40)
- Audit-count baseline: invalidate=11, record=8, evaluate=19, publish=17, subscribe=24 at HEAD `21bb6f3c`
- §23 hard rules covering: option-(a) signalling (PM-30), symmetric/asymmetric fallback (PM-35/PM-36/PM-38), self-subscribe (PM-37), audit-count classification (PM-37/PM-40), race-fix ordering initiator/confirmer (PM-39)
- Last 1c migration shape verified against PM-40 changelog entry

When PM-44ish ships the cleanup commit (option-(b) cut), this template is OBSOLETE. Archive or rewrite for the next campaign.
