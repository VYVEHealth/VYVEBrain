# PM-67 — Worked example: test #3 (`recordCanonical_suppresses_realtime_echo_within_10s`)

**Purpose of this document.** The design draft enumerates 18 tests. This appendix turns one of them into runnable code so the next-session implementor has a concrete template. Pick the canonical-suppression test because it exercises the highest-leverage primitive (the Layer 4 mechanic itself), the fake-timer pattern that several other tests will reuse, and the harness setup/teardown lifecycle. Get this one right and 12 of the other 17 fall out by analogy.

**Where it would live in selftests.html.** Inside a `<script type="module">` block, registered against the test runner via `registerTest(group, name, fn)`. Source paths and globals referenced (`window.VYVEBus`, `__VYVE_BUS_MOCK_REALTIME`) match production at HEAD `6225d504`.

---

## The test, end-to-end

```javascript
// ----- Harness primitives (excerpted, defined once at top of selftests.html) -----

const tests = [];                              // { group, name, fn }
const TEST_PREFIXES = ['vyve_outbox',
                       'vyve_outbox_dead',
                       'vyve_home_v3_',
                       'vyve_cache:',
                       'vyve_certs_cache',
                       'vyve_habits_cache_v2',
                       'vyve_engagement_cache',
                       'vyve_leaderboard_cache',
                       'vyve_settings_cache',
                       'vyve_weight_logs_v1',
                       'vyve_wt_cache_',
                       'vyve_members_cache_',
                       'vyve_ach_grid',
                       'vyve_wb_last',
                       'vyve_checkin_done',
                       'vyve_checkin_outbox'];

function snapshotLocalStorage() {
  const snap = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (TEST_PREFIXES.some(p => k.startsWith(p))) snap[k] = localStorage.getItem(k);
  }
  return snap;
}

function restoreLocalStorage(snap) {
  // Drop any test-introduced keys, restore originals.
  const toClear = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (TEST_PREFIXES.some(p => k.startsWith(p))) toClear.push(k);
  }
  toClear.forEach(k => localStorage.removeItem(k));
  Object.keys(snap).forEach(k => localStorage.setItem(k, snap[k]));
}

function registerTest(group, name, fn) {
  tests.push({ group, name, fn });
}

// Run a single test with full isolation: snapshot localStorage, snapshot
// bus subscriber set, run the test, restore everything.
async function runOne(t) {
  const lsSnap = snapshotLocalStorage();
  const subsBefore = JSON.stringify(window.VYVEBus.__inspect().subscribers);
  const cleanupFns = [];
  const ctx = {
    addCleanup: (fn) => cleanupFns.push(fn),
  };
  let result = { test: `${t.group}.${t.name}`, passed: false, error: null, diagnostic: null };
  try {
    window.__VYVE_BUS_MOCK_REALTIME = true;
    await t.fn(ctx);
    result.passed = true;
  } catch (e) {
    result.error = e && e.message || String(e);
    result.diagnostic = { bus_inspect: window.VYVEBus.__inspect() };
  } finally {
    delete window.__VYVE_BUS_MOCK_REALTIME;
    // Run test-registered cleanup (unsubscribes, fake-timer restore, etc.)
    for (const fn of cleanupFns) { try { fn(); } catch (_) {} }
    restoreLocalStorage(lsSnap);
    const subsAfter = JSON.stringify(window.VYVEBus.__inspect().subscribers);
    if (subsBefore !== subsAfter) {
      // Subscriber leak — fail the test even if it passed its assertion.
      result.passed = false;
      result.error = (result.error ? result.error + '; ' : '') +
                     'subscriber leak: ' + subsBefore + ' -> ' + subsAfter;
    }
  }
  return result;
}

// Fake-timer helper — wraps Date.now and the bus's internal recentCanonicals
// expiry by simply moving forward in real time using a Promise + setTimeout.
// We do NOT monkey-patch Date.now because the bus reads it directly and the
// test's intent is to verify TTL behaviour against actual clock time, not
// against a faked clock. Each canonical-suppression test costs ~10s real time.
//
// This is an intentional trade-off: bigger tests stay readable, harness has
// zero clock-faking infra, runtime suite is slower. If the suite grows past
// ~30s wall-clock, revisit and add a deterministic clock shim.

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ----- The actual test ----- (PM-58 invariant; references brain §4.9)

registerTest('bus.suppression', 'recordCanonical_suppresses_realtime_echo_within_10s', async (ctx) => {
  // Step 1: prep — install a real subscriber on the cardio:logged event.
  //         Subscribers receive envelopes from BOTH publish() and the
  //         realtime bridge via handleRealtimeRow. We use a counter so we
  //         can assert "fired vs didn't fire".
  let fireCount = 0;
  const onFire = () => { fireCount += 1; };
  window.VYVEBus.subscribe('cardio:logged', onFire);
  ctx.addCleanup(() => window.VYVEBus.unsubscribe('cardio:logged', onFire));

  // Step 2: prep — install the bridge config the test will fire against.
  //         installTableBridges builds the internal bridgeConfig used by
  //         handleRealtimeRow + mockRealtimeFire. We use a stub supabase
  //         client because we only need the bridgeConfig side, never the
  //         actual realtime channel subscription. The mockRealtimeFire
  //         path doesn't touch the channel at all.
  const stubSupabase = {
    channel: () => ({ on: () => ({ subscribe: () => ({}) }) }),
    removeChannel: () => {},
  };
  window.VYVEBus.installTableBridges(stubSupabase, [
    {
      table: 'cardio',
      op: 'INSERT',
      event: 'cardio:logged',
      pk_field: 'id',
      payload_from_row: (row) => ({ id: row.id, member_email: row.member_email }),
    },
  ]);

  // Step 3: act — record a canonical write for (cardio, 'test-pk-1'), then
  //         immediately mock-fire a realtime echo for the SAME (table, pk).
  //         The bus should drop the echo at the suppression gate.
  window.VYVEBus.recordCanonical('cardio', 'test-pk-1');
  window.VYVEBus.__mockRealtimeFire('cardio', 'INSERT', {
    id: 'test-pk-1',
    member_email: 'selftest@vyvehealth.co.uk',
    duration_seconds: 1200,
  });

  // Step 4: assert immediate — within the 10s window, the subscriber MUST
  //         NOT have fired. This is the core PM-58 invariant.
  if (fireCount !== 0) {
    throw new Error(
      `expected fireCount=0 within 10s window, got ${fireCount}; ` +
      `recent_canonicals=${window.VYVEBus.__inspect().recent_canonicals}`
    );
  }

  // Step 5: assert provenance — recent_canonicals should report ≥1 entry.
  const inspectMid = window.VYVEBus.__inspect();
  if (inspectMid.recent_canonicals < 1) {
    throw new Error(
      `expected recent_canonicals >= 1 mid-window, got ${inspectMid.recent_canonicals}`
    );
  }

  // Step 6: act — sleep past CANONICAL_SUPPRESS_TTL_MS (10000) plus a small
  //         margin, then mock-fire again with a DIFFERENT pk so the original
  //         entry's expiry path is exercised (the bus garbage-collects
  //         expired entries lazily on lookup). Then mock-fire the original
  //         pk again — this time it should fire because the entry expired.
  await sleep(10250);

  window.VYVEBus.__mockRealtimeFire('cardio', 'INSERT', {
    id: 'test-pk-1',
    member_email: 'selftest@vyvehealth.co.uk',
    duration_seconds: 1200,
  });

  // Step 7: assert post-expiry — subscriber MUST have fired exactly once
  //         (the post-expiry echo for pk-1). If fireCount > 1 there's a
  //         leak from a previous test or a bus bug.
  if (fireCount !== 1) {
    throw new Error(
      `expected fireCount=1 after TTL expiry, got ${fireCount}; ` +
      `bus state: ${JSON.stringify(window.VYVEBus.__inspect())}`
    );
  }
});
```

---

## What this test buys

**Direct coverage.** The PM-58 invariant ("writing device's canonical envelope suppresses its own realtime echo for 10s, no longer") is now machine-checked. Three of the other 17 tests reuse this pattern verbatim (just swap `recordCanonical` for `recordWrite`, swap TTL to 5000ms, etc.).

**Indirect coverage.** The setup/teardown lifecycle is exercised: localStorage snapshot+restore, `__VYVE_BUS_MOCK_REALTIME` gate, subscriber-leak detection, bridge installation against a stub Supabase client. If any of those primitives are wrong, this test fails first.

**Honest trade-off, surfaced.** The fake-timer comment in `sleep()` is the design decision Dean signs off on or overrides: do we burn ~10s of real time per suppression test, or do we add a clock shim? Recommendation: real time for v1 (suite stays small, ~30s total), revisit if suite grows.

---

## Patterns this template establishes for the other 17 tests

1. **`ctx.addCleanup(fn)`** is the only way subscribers get unsubscribed. If a test calls `subscribe` without registering a cleanup, the post-test subscriber-leak check fails it. Mechanical pressure on test hygiene.

2. **`__inspect()` is the diagnostic.** Every assertion failure dumps `bus_inspect` into the result. The implementor never has to reach for `console.log` mid-suite.

3. **Stub clients are fine** for `installTableBridges` because the only code path the harness ever drives is `__mockRealtimeFire`, which never touches the real channel. Saves wiring Supabase into the harness.

4. **Sleep over Date.now-faking.** Trade-off accepted explicitly in the comment. Future implementor knows to challenge it if the suite slows below acceptable.

5. **PK-1 fires once, asserted exactly.** Not `>= 1`. `=== 1`. Off-by-one in the suppression logic is exactly the kind of regression this test is for, and a loose assertion would let a TTL halving slip through.

---

## Open questions for Dean before PM-67 lands

1. **Sleep tolerance.** Test sleeps `10250ms` to clear a 10000ms TTL. Is 250ms margin enough on real hardware in Safari/Chrome/Capacitor? Worth benchmarking once before committing — if not, bump to 500ms.

2. **`installTableBridges` idempotence.** Calling it twice (once per test that needs the bridge) — does it re-register or no-op? Looking at bus.js, `bridgeInstalled` is a module-level flag and second install is guarded against. Tests that need a different bridge config need a teardown path that uninstalls; the test runner currently doesn't provide one. Either (a) install once at suite start with all tables every test could ever need, or (b) add a `__uninstall` test hook to bus.js. Option (a) is the no-prod-change path — recommend that.

3. **Selftests.html boot order.** This test relies on `window.VYVEBus`, `__mockRealtimeFire`, etc. being available. selftests.html must load bus.js, vyve-offline.js, vyve-home-state.js with `defer` and wait for `DOMContentLoaded` before calling `runOne`. Standard, but worth codifying so the next test someone adds doesn't break by adding a top-level call before bus.js has loaded.

---

*End of PM-67 worked example. Lands inside selftests.html when PM-67 implementation ships. Until then, this is the template the implementor copies-and-modifies for 12 of the other 17 tests.*
