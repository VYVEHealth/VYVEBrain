# PM-67 — Layer 4 self-test harness (design draft)

**Drafted:** 12 May 2026, PM-66 staging session (PM-66 not yet shipped; this is design-only and ships nothing).
**Author:** Claude / Dean.
**Source refs:** bus.js, vyve-offline.js, vyve-home-state.js at vyve-site HEAD `6225d504` (PM-65 baseline). Signatures, suppression TTLs, and TYPE_TO_HS_COLS verified live.
**Status:** Design draft. Targets atomic-brain commit landing post-PM-66 ship. Zero production code in this document — `/playbooks/pm67-self-test-harness.md` only.

---

## 1. Why now, and what it has to defend

PM-58 → PM-65 shipped eight Layer 4 surfaces and seven distinct shapes. Each surface added one or more invariants the system must hold or members see double-counts, lost work, or worse — paint someone else's data. Seven of those invariants have no automated regression check today; eight straight backlog entries have deferred this harness because the surface roster was still changing. PM-65 closes the seventh shape and PM-66 will close the eighth (the canonical-publish-only EF-writer pattern, second instance). After PM-66, the **surface roster is stable** — no more Layer 4 surfaces in the campaign by current planning — and the regression targets stop drifting. Designing now means PM-67 lands the day after PM-66 ships instead of getting deferred a ninth time.

The harness defends one specific class of bug: **the kind that doesn't show up until production, only on real two-device usage, and only sometimes.** Layer 4's whole point was eliminating cache-vs-realtime echo races. The seven shapes encode that — and any future surface refactor that breaks a shape will look correct in code review and feel correct in single-device testing. The harness exists for the second device.

It is not a unit-test suite for application logic. Application correctness is enforced by the EF code, the database constraints, and the bus's invariants. The harness asserts the **invariants only** — that the wiring still holds.

---

## 2. Decision: harness form factor

**Three options were considered.** Picking one.

| Form | Pros | Cons | Verdict |
|---|---|---|---|
| Deno test file (`deno test`) | Same runtime as EFs; CI-friendly | Cannot exercise localStorage, window.VYVEBus, the DOM, or sw.js. The bugs being defended against are browser-side wiring bugs. Off-target. | **Rejected.** |
| Playwright suite running against staging | Real DOM, real bus, two simulated devices, headless CI possible | Requires a staging URL with seeded test members and a Playwright runner; ~2 sessions to stand up before any test gets written; sw.js + Capacitor wrap interaction makes test cleanup fragile | **Rejected for v1.** Revisit at PM-7x once the core invariants are protected. |
| **In-browser console suite — auto-runs on `?selftest=1`, manual call via `window.__VYVERunSelfTests()`** | Zero infra. Runs against any environment (online.vyvehealth.co.uk, localhost, Capacitor wrap). Uses the actual production bus.js / vyve-offline.js / vyve-home-state.js loaded by the page. Single HTML file deliverable. | Can't run in CI without a headless runner. Won't catch regressions until a human visits the page. | **Selected for v1.** Trade-off accepted: defending the bus + cache wiring with a primitive that runs in the actual environment beats a Playwright suite that ships in three sessions instead of one. CI integration is a PM-7x follow-up. |

**Why in-browser wins.** The bus.js public surface is intentionally hooked — `__inspect`, `__mockRealtimeFire`, `__mockChannelReconnect`, and the `window.__VYVE_BUS_MOCK_REALTIME` gate are already shipped exactly for this. The harness uses what's already there; it isn't asking the bus for new test affordances. Same for `VYVEHomeState` (`inspect`, `optimisticPatch`, `revertPatch`) and `VYVEData` (`cacheGet`, `cacheSet`, `invalidateHomeCache`, `recordRecentActivity`).

---

## 3. Deliverable shape

One new file at `/selftests.html`, gated behind the existing auth flow (page redirects to login if no Supabase session — same pattern as the strategy.html guard). Inside is the test runner plus a results UI. The page loads bus.js, vyve-offline.js, and vyve-home-state.js exactly as a member-facing page does, so the wiring under test is the wiring members get.

**Entry points:**
1. Visit `/selftests.html` — manual UI: green/red dots, click-to-run-individual-test, "Run all".
2. Visit `/selftests.html?auto=1` — autorun on load, summary at bottom (for paste-into-changelog screenshots).
3. From any portal page console: `await window.__VYVERunSelfTests()` — runs the same suite, but only against primitives that don't need DOM (bus suppression, home-state delta math, cache envelope shape). The full suite — including the cache-paint-before-auth invariant and the script-tag ordering invariants — only runs on selftests.html where the page boot order is controllable.

**Output shape:**
```js
{
  ran_at: "2026-05-13T19:42:11.014Z",
  vyve_site_head: "<git sha if exposed via meta tag, else 'unknown'>",
  summary: { total: 18, passed: 17, failed: 1, skipped: 0 },
  failures: [
    {
      test: "canonical_suppression.echo_dropped_after_recordCanonical",
      expected: "no fire on second-device echo within 10s",
      actual: "subscriber fired",
      diagnostic: { recent_canonicals: 0, ... }
    }
  ]
}
```

Pasteable, greppable, suitable as a changelog artefact.

---

## 4. Regression targets — the 18-test surface

Drawn directly from PM-58 → PM-65 changelog. Each test names the PM that introduced the invariant. New tests will be added with each future Layer 4 promotion (which is itself a §23 hard rule candidate — see §6).

### 4a. Bus suppression (5 tests)

Defends the core Layer 3/4 mechanic that distinguishes the writing device's own writes from a second device's echo.

1. **`recordWrite_suppresses_realtime_echo_within_5s`** — Call `VYVEBus.recordWrite('daily_habits', 'abc-pk')`, immediately fire `VYVEBus.__mockRealtimeFire('daily_habits', 'INSERT', {id: 'abc-pk', ...})`. Subscriber must NOT fire. Validates `SUPPRESS_TTL_MS = 5000` path.
2. **`recordWrite_does_not_suppress_after_5s`** — Same as above but wait 5,100ms via fake timers. Subscriber MUST fire. Validates TTL expiry.
3. **`recordCanonical_suppresses_realtime_echo_within_10s`** — PM-58. Call `recordCanonical('cardio', 'pk')`, fire mock realtime, assert no fire. Validates `CANONICAL_SUPPRESS_TTL_MS = 10000`.
4. **`recordCanonical_does_not_suppress_after_10s`** — Wait 10,100ms, assert fire. Validates TTL expiry.
5. **`recordCanonical_suppresses_resync_replay`** — PM-57/PM-58. Call `recordCanonical`, then fire `__mockChannelReconnect('vyve_bridge_cardio')` twice (the second triggers the resync replay). Assert subscriber does NOT fire. Validates that resync goes through `handleRealtimeRow`'s suppression gate.

### 4b. Home-state delta math (4 tests)

Defends that `optimisticPatch` + `revertPatch` are inverses on the cache rows. Source of the PM-58 invariant; regressed once already in PM-60 narrative drift.

6. **`optimisticPatch_then_revertPatch_is_noop_per_type`** — Seed `vyve_home_v3_<email>` with known counts via `cacheSet`. For each type in `TYPE_TO_HS_COLS` (`daily_habits`, `workouts`, `cardio`, `session_views`): call `optimisticPatch(type, {sign: +1})`, snapshot cache, call `revertPatch(type, {sign: +1})`, assert cache equals seed (deep-equal). Validates the four canonical column groups are paired correctly.
7. **`optimisticPatch_unknown_type_returns_null`** — Call `optimisticPatch('wellbeing_checkins', {})`. Must return `null` (PM-65: wellbeing is NOT in TYPE_TO_HS_COLS). Validates the canonical-publish-only shape: future surface adding `wellbeing_checkins` to TYPE_TO_HS_COLS by accident is caught here.
8. **`optimisticPatch_no_cache_returns_null`** — Clear `vyve_home_v3_<email>`. Call `optimisticPatch('cardio', {sign: +1})`. Must return `null` (per source: "no cache to patch — next member-dashboard fetch will populate"). Validates the safe-fallback path.
9. **`optimisticPatch_writes_layer4_provenance_fields`** — Call patch, read cache. Assert `__layer4_patched_at` and `__layer4_last_sign` are set. Validates the provenance fields the PM-58 narrative relies on for debugging.

### 4c. Cache envelope shape (3 tests)

Defends future cache-primitive extensions (email gating, TTL gating) against accidental backward-incompat regressions. Email gating exists as a noted gap in five page-level hand-rolled caches today — any future PM that lifts gating into `vyve-offline.js` needs these tests live first.

10. **`cacheSet_preserves_email_when_opts_provided`** — Call `cacheSet('test:key', {data: 1}, {email: 'a@x.com'})`. `cacheGet('test:key')` envelope must contain `.email === 'a@x.com'`. Validates the new envelope field.
11. **`cacheSet_omits_email_when_opts_not_provided`** — Call `cacheSet('test:key', {data: 1})` (legacy two-arg call site). Envelope must NOT have an `email` field. Validates backward compatibility for the ~all current call sites.
12. **`fetchCached_refuses_paint_on_email_mismatch`** — *Skipped until email gating ships in `vyve-offline.js`.* Currently asserts no email field is consulted (regression catcher: if someone half-implements email gating without the migration, this test fires).

### 4d. Cache-paint-before-auth invariant (2 tests, selftests.html only)

PM-3 hard rule. Tests can only run on a page that boots cleanly because they assert about boot order; they can't run from console mid-session.

13. **`paint_runs_before_onAuthReady`** — selftests.html instruments a probe at the top of `<head>` and another inside `onAuthReady`. Probe order recorded; first observation must be the cache-paint probe. PM-3 regression.
14. **`paint_uses_cached_email_when_window_vyveCurrentUser_not_set`** — `engagement.html` and `habits.html` have a cache-as-identity-fallback path verified at HEAD `6225d504`. This test simulates pre-auth race by reading the cache before `window.vyveCurrentUser` is set, asserts the cached email is consulted, paint occurs. Currently passes as a no-op (the contract isn't broken yet); the test guards against any future cache-primitive refactor accidentally regressing it.

### 4e. Outbox dual-key invariants (2 tests, from PM-26/27/28 cache-bus taxonomy)

Per master.md §23 PM-26 / cache-bus taxonomy playbook.

15. **`vyve_outbox_key_is_email_scoped`** — `outboxKeyFor('a@x.com')` returns the email-scoped key shape; `outboxKeyFor('b@y.com')` returns a different one. Verifies the post-PM-27 keying didn't regress to a single global key.
16. **`adoptLegacyOutbox_idempotent`** — Run `adoptLegacyOutbox(email)` twice; second call is a no-op (adopted flag set). Validates the one-shot adopt-on-first-load reader.

### 4f. Canonical-publish-only shape regression (1 test) — PM-65

17. **`wellbeing_checkin_publish_does_not_call_optimisticPatch`** — Spy on `VYVEHomeState.optimisticPatch`. Publish a synthetic `wellbeing:logged` event via the same code path wellbeing-checkin.html uses (or directly invoke its handler). Assert `optimisticPatch` was not called. Regression catcher for the canonical-publish-only shape: if a future refactor wires wellbeing-checkin into the optimistic-patch flow, the spy will catch the call against a non-existent column group.

### 4g. EF-writer failure-class discriminator (1 test) — PM-65

18. **`ef_writer_failure_class_branches_correctly`** — Mock `fetch` to return three responses in turn: (a) `{ok: false, status: 500}`; (b) `{ok: true, json: () => ({success: false, error: 'x'})}`; (c) thrown `TypeError('Failed to fetch')`. For each, assert the surface-under-test fires `<event>:failed` with `reason: 'http_error' | 'ef_failure' | 'network'` respectively. PM-65 introduces this discriminator on wellbeing-checkin; PM-66 will be the second instance. The test runs against both surfaces.

---

## 5. Run model

The harness is **side-effect-clean by default**. Tests that mutate global state (`cacheSet`, `recordWrite`, mock realtime fires) wrap their work in setup/teardown that:

1. Snapshots `localStorage` keys matching `vyve_*`, `_VYVE_*` prefixes before the suite.
2. Sets `window.__VYVE_BUS_MOCK_REALTIME = true` for the duration.
3. After each test, clears any cache keys the test created (tracked by a test-local set).
4. After the suite, restores the snapshotted localStorage and unsets the mock flag.

Subscribers added during a test must be unsubscribed in the test's `finally`. The bus.js `inspect()` output before and after the suite must match (modulo subscriber counts the harness adds and removes itself).

**Selftests.html boot guard.** The page refuses to run tests if `localStorage` contains any keys for an account other than the currently-authed test member. The expectation is that the developer running the suite has a dedicated `selftest@vyvehealth.co.uk` account with throwaway data. This is enforced via a startup check that lists `vyve_outbox:*` and `vyve_home_v3_*` keys and aborts if it finds an email that doesn't match the current session.

---

## 6. New §23 hard rule (proposed)

**Hard rule (added PM-67): Layer 4 surface promotions update the self-test harness in the same atomic commit that ships the surface.**

When a new surface joins Layer 4, the PM commit that ships the surface MUST also add a regression test to `/selftests.html` covering at minimum: (a) the surface's publish event names and payloads; (b) which `TYPE_TO_HS_COLS` group it patches (or that it's canonical-publish-only); (c) the failure-class discriminator if it's an EF-writer. The test is part of the surface, not a follow-up. Failure to ship a test is a §23 violation and the commit is reverted.

This is the meta-rule that stops the harness from drifting like §1 narrative counts have drifted three times (PM-58, PM-61, PM-65). The eighth-time deferral problem is solved structurally, not by promising harder.

---

## 7. Sequencing & estimate

**Estimate, Claude-assisted:**
- File scaffold + boot guard + setup/teardown + results UI: ~1 session.
- Tests 1–9 (bus suppression + home-state delta math): ~1 session — these run against primitives the page already loads.
- Tests 10–12 + 15–16 (cache envelope, outbox): half-session.
- Tests 13–14 (cache-paint-before-auth): half-session — instrumentation probes need careful boot-order setup.
- Tests 17–18 (canonical-publish-only + EF-writer failure-class): half-session.
- Atomic-brain commit with §23 PM-67 hard rule + changelog + backlog: end-of-session.

**Total: 2.5–3 sessions.** Single-file deliverable (`/selftests.html`) + brain commit. sw.js cache bump per portal-push convention.

**Dependencies:** None. Doesn't touch bus.js, vyve-offline.js, vyve-home-state.js, or any of the eight Layer 4 surfaces. Pure additive.

**Risks:**
1. **Pre-existing wiring bugs caught by the harness.** Test 7 (`optimisticPatch_unknown_type_returns_null`) and test 17 (`wellbeing_checkin_publish_does_not_call_optimisticPatch`) both currently pass by design — but if a build-up bug exists somewhere in the eight surfaces, the harness lands and immediately fails. That's exactly what it's for; flag it but don't preemptively try to "make the suite green" by softening assertions. If a test fires, fix the surface, not the test.
2. **Selftests.html exposure.** The page is auth-gated but anyone with a member account can hit it. The boot guard protects against cross-account data corruption, but the page also exposes the internals of `VYVEBus.__inspect` and similar. Acceptable for v1 — it's not a production attack surface and the data it reads is already in the member's own localStorage. PM-7x can add a `members.is_internal = true` gate if needed.
3. **Capacitor wrap.** The page must work inside the iOS/Android wrap, not just the web. Since it uses no Capacitor-native APIs, it should — but verify on the first iOS device available post-PM-67 ship.

---

## 8. Out of scope (forward backlog)

- **Playwright CI integration.** PM-7x.
- **Two-device end-to-end tests** (device A writes, device B receives realtime, both windows visible). Requires a test harness that can drive two browser contexts. PM-7x.
- **Self-tests for Layer 1c bus migration surfaces** (the PM-30 campaign). The harness scope is Layer 4 only; bus migration has its own taxonomy (`vyve_outbox_*`) and a partial test in §4e but doesn't get full coverage in PM-67.
- **EF-side tests** (e.g. wellbeing-checkin EF v28 swallowed-write hardening, P2 backlog item). Lives in the EF repo, not vyve-site.

---

*End of PM-67 design draft. Ships nothing. Awaits PM-66 ship + Dean sign-off before promotion to `/playbooks/pm67-self-test-harness.md` in the atomic brain commit.*
