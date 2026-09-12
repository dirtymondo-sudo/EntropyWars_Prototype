# Phase 6 utility decision validation

Fresh baseline: e59e19aac5b14cec212a6cb2c012356fdc73909a. Complete source archive downloaded; main root file listing rechecked unchanged before packaging. The manifest checks tracked root files for unintended changes.

- Full Node regression suite: 899 tests, 897 passed, 0 failed, 2 skipped.
- Utility contract runner: 109 passed, 0 failed, 0 skipped.
- JavaScript syntax: 121 files passed, including three saved baseline files.
- Entry page: 12 inline scripts passed syntax checks, one import map parsed, 29 cache references use the shared new token.
- Dispatch inventory: 501 spells / 65 kinds; no missing direct scorer or target-picker branches. This is source inventory, not behavioral coverage.
- Before-change comparisons: Chivalry 22 failures / 25 checks; Trick Room 16 failures / 37 checks; lattice 8 failures / 16 checks. Lattice comparisons use the current pure engine profile seam with baseline AI; numeric profile tests are controls.
- New tests total 60, with 45 failing against baseline code and 15 controls; one strengthened existing lifecycle assertion also fails before the fix.
- Controlled Chivalry scorer timing: approximately 0.44 ms median / 0.57 ms p95 across 40 calls in a six-versus-six fixture. This does not establish full-decision or browser performance.

The two existing skips cover rigged-base outfit/shape fitting and server startup/queue-stats. No browser playtest, gameplay simulation, deployment, commit or push was performed.

Chivalry now estimates first-hit benefit and transfer cost, and CPU execution revalidates its ward. Trick Room owns reversal by round and scores future speed-order benefit. Tune/Pulse compare current network damage and status value rather than fixed constants. These remain bounded forecasts; detailed limitations and next work are in the review plan.

Phase 6 remains open. One broad coding group remains (score-aware AI-06 and destructive-beam prediction), likely one or two batches depending on findings, followed by scenario audit, full-decision timing, and authorized P1 CPU observations. Phase 7 has not started.
