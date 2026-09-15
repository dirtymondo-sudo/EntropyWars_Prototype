# HQ World pilot — validation

Baseline: `12f972aa9e733273aeaffcd2ce538ba117895a38` (repository main when work began).
Status: implemented locally; no commit, push or deployment.

## Implemented

Two reversible links: Moon ⇄ Derelict (spaceship) ⇄ Saturn. The four
bulkhead door ends are in existing board rooms; the airlock remains future
work. Bay returns and battle consoles are preserved. Generated site rooms
now accept multiple back-door rows, including the existing H-Wing shape.
The route helpers generate fresh door actions and omit unbuilt endpoints
and unsupported entryway kinds. No authored dialogue was added.

The final Derelict doors use north-wall x=-6 and x=-1. The first candidate
at x=4 overlapped the built-in north signboard (not in room.props); it was
moved before delivery. Tests now check that signboard and lamp clearance.

## Checks run

- Full package test command: `node --test *.test.js`: **1,285 tests;
  1,281 passed, zero failed, four skipped**. This is the package's exact
  test script, run directly using the bundled Node runtime.
- HQ focus: **104 passed, zero failed** (97 existing + seven new tests).
- Repository syntax check: **149/149 files clean**; final data.js also
  checked after the final doorway placement adjustment.
- New tests exercise both directions, return ids, labels/numbers, existing
  bay/console access, the production renderer's box-wall landing and facing,
  dry walkway, props/people, signboards/masts, multiple exits, action-copy
  isolation, invalid destinations, gate fields and graph consistency.
- Current main's map.js and three-renderer.js remain byte-identical.
  index.html differs only by its shared cache token.
- Initial full-suite failures were caused by omitted repository test assets;
  those assets were restored from the same pinned archive and the full suite
  rerun successfully. No test was disabled or edited to hide a failure.

## Limits and next stage

No browser playtest, GLB-load traversal or live host/guest run was performed.
Landing tests execute production functions with small vector/scene stubs;
actual rendering and movement still need visual acceptance. The existing
setting builder excludes doorway lanes; its asynchronous asset geometry
has not been tested live for these four new doors.

This is viewer-local HQ navigation for either client's building. It changes
no battle state, relays, economy, maps or party setup. No new assets needed.

Phase 9.3 is partial. The graph helper describes doors, not every elevator
button/overlay/gated state, and there is no WORLD tab yet. Next: the first
complex and its rail/ramp design, then more paired routes, suites and the
directory. Finds, non-door seams, third ring, portable doors, encounters and
skating remain separate stages. The plan review records their prerequisites.
