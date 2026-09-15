# HQ World — validation

## 2026-09-15 — Phase 9.2 stage 1: THE HAUNTED HOUSE COMPLEX

Baseline: repository main `a8fb08f` (carries the 9.3 pilot below).
Status: implemented locally; no commit, push or deployment.

Implemented: four hand-authored box rooms (`site_prebuilt_haunted_hall`,
`_upstairs`, `_attic`, `_cellar`) behind a front door on the Haunted
House board room's north wall (`siteRooms.backDoors.prebuilt_haunted`,
an array); `hqComplexRoomId` / `hqRoomSite` / `hqRoomPart` /
`hqSiteComplex` / `hqComplexRooms` / `hqRefreshComplexLinks`;
`hqLinkRoom` resolves `{ site, part }` only to an authored room. No
renderer, map.js, economy, battle-state or relay change; the two-floor
gallery is not built (upstairs is a separate box room).

Checks run: `hq-complex.test.js` — 7 tests, all pass (the sheet; the
front door's lane against the console, the built-in signboard and the
corner mast using the production `_hqBoxWall` + `_hqGoTo` landing; every
door a reversible pair and the complex connected from the board room;
every landing, spawn and native clear of catalogue rects and feet; the
park rule; a probe link on a part appearing once across repeated
refreshes and leaving nothing behind; source sites). hwing.test.js's
back-door loop updated for the array shape. Full `npm test`: 1,292
tests, 1,288 passed, 0 failed, 4 skipped (the same four).

Limits: no browser run, GLB traversal or live walk (RULE #1c). The
`leaf: null` stair openings, the terrain-sheet wall tints, the boiler's
light in a low cellar and the ladder against the hatch are unseen. The
blocker check in the test reads catalogue rects on face 0 / 180 and
foot discs elsewhere, as the renderer does; it does not run the
renderer's actual placement or the setting builder (a part has none).

---

# HQ World pilot — validation (2026-09-14 / 15)

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
