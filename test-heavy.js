// test-heavy.js — THE GATE on the heavy geometry proofs (2026-09-18).
//
// A few dozen tests compile every terrain room's height field, generate its
// floor plan, solve the walker's reach and prove every hard tape's door-gun
// shot — a minute or two EACH, and every test file does it again in its own
// sandbox. They guard the building, not the game loop, so they run:
//   - in CI on every push (.github/workflows/ci.yml sets EW_FULL_TESTS=1), and
//   - locally on `npm run test:full` — run it when data.js's DOOR_HQ rooms /
//     terrain / links / finds changed; plain `npm test` skips them (marked
//     "skipped" in the tally, never silently dropped).
'use strict';
const FULL = !!process.env.EW_FULL_TESTS;
module.exports = {
    FULL,
    /* pass as the OPTIONS argument: test('…', heavy, () => { … }) */
    heavy: FULL ? {} : { skip: 'heavy geometry proof — `npm run test:full` (EW_FULL_TESTS=1) runs it; CI always does' },
};
