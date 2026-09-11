# Remaining effect callback inventory

Updated 2026-09-10 after breath/boomerang and transitive dash/sonic timer retirement. This is a complete textual index of direct window.setTimeout sites, not an exhaustive semantic audit. Asset completion callbacks and other scheduling APIs still need separate review.

## Classified and fixed in this batch

| Consumer | Timer purpose | Disposition |
| --- | --- | --- |
| electric_arcs | Delayed lightning bursts, 60 ms spacing | Lifetime-owned emission; no cleanup obligation. |
| fire electric impact | Delayed lightning bursts, 40 ms spacing | Lifetime-owned emission; no cleanup obligation. |
| fireCombo convergence | Delayed heads at 0/60 ms | Lifetime-owned emission; creates nested trails. |
| fireCombo trail | Thirteen trailing particles per head, 26 ms spacing | Lifetime-owned emission, including when the parent already fired. |
| fireCombo arrival | Delayed target explosion | Lifetime-owned emission. |

The prior dash, legacy teleport, Blizzard Present, dust-devil and DOM fixes remain in place. Shared _wpnLoad boot/staggered warmup has application lifetime and must not be bulk-canceled. The two helper timer sites below are already owned.

## Descent batch classification

Seven additional sites are lifetime-owned: flyover, flyover smoke, descent spawn, sky lightning, impact, shared AoE bursts and missile-drop smoke. All emit work; none is a resource disposal callback. Model groups continue through existing `_sigRun` ownership. Shared AoE callers now inherit retirement too. Separate meteor/nuke geometry internals remain unreviewed in this batch.

Next: `_fireWall`, `_fireChain`, `_fireBeamMapped`, then remaining mapped/bespoke callbacks and asset attachment. This inventory is not a claim of complete transitive coverage.

## Mapped wall/chain/beam batch

Three direct emission timers now use `_fxDelay`: sustained wall repetitions, chain hop particles/lightning, and generic beam charge completion. `_spawnEffect` already owns delayed recipe layers. No resource disposal callback was canceled.

Geometry trace: `_spawnLaserBeam3D` registers cylinders and rings with `_animate3D`, which retires through `_cleanup3D`. Its separate delayed terminus emission is now lifetime-owned through `_fxDelay`, verified with production-helper regression tests. Wall geometry dispatch and sword-wave/breath/boomerang branches need further transitive review; no complete geometry-coverage claim is made.

## Remaining direct timer sites

| Line | Direct timer call |
| --- | --- |
| 10 | `var id = window.setTimeout(function () {` |
| 48 | `var id = window.setTimeout(function () {` |
| 5054 | `window.setTimeout(function() {` |
| 5117 | `window.setTimeout(function() {` |
| 5146 | `window.setTimeout(function() {` |
| 5161 | `window.setTimeout(function() {` |
| 5880 | `window.setTimeout(function () {` |
| 6150 | `window.setTimeout(function() {` |
| 8272 | `window.setTimeout(function() {` |
| 8335 | `window.setTimeout(function() {` |
| 8370 | `window.setTimeout(function() {` |
| 10273 | `window.setTimeout(function () {` |
| 10285 | `window.setTimeout(function () { _wpnLoad(key); }, 4500 + idx * 700);` |
| 10336 | `window.setTimeout(function () {` |
| 10525 | `window.setTimeout(function () {` |
| 11020 | `window.setTimeout(function () {` |
| 11399 | `window.setTimeout(function () {` |
| 11799 | `window.setTimeout(function () {` |
| 12159 | `window.setTimeout(function () {` |
| 12596 | `window.setTimeout(function () {` |
| 13786 | `window.setTimeout(function () {` |
| 14424 | `window.setTimeout(function () {` |
| 14443 | `window.setTimeout(function () {` |
| 15068 | `window.setTimeout(function () {` |
| 15280 | `window.setTimeout(function () {` |
| 15499 | `window.setTimeout(function () {` |
| 15532 | `window.setTimeout(function () {` |
| 16887 | `if (s.at) window.setTimeout(go, s.at); else go();` |
| 17171 | `window.setTimeout(function () {` |
| 17192 | `window.setTimeout(function () {` |
| 17251 | `window.setTimeout(function () {` |
| 17254 | `window.setTimeout(function () {` |
| 17289 | `window.setTimeout(function () {` |
| 17311 | `window.setTimeout(function () {` |
| 17555 | `window.setTimeout(function () {` |
| 17925 | `window.setTimeout(function () {` |
| 18072 | `window.setTimeout(function () {` |
| 18201 | `window.setTimeout(function () {` |
| 18241 | `window.setTimeout(function () {` |
| 18350 | `window.setTimeout(function () {` |
| 18705 | `window.setTimeout(function() {` |
| 18814 | `window.setTimeout(function () {` |
| 18835 | `window.setTimeout(function () {` |
| 18983 | `window.setTimeout(function () {` |
| 19303 | `window.setTimeout(function () {` |
| 19319 | `window.setTimeout(function () {` |
| 19503 | `window.setTimeout(function () { if (!_suppressed()) burst(); }, rideMs * 0.9);` |
| 19586 | `window.setTimeout(function () {` |
| 19684 | `window.setTimeout(function () {` |
| 20547 | `window.setTimeout(function() {` |
| 20696 | `window.setTimeout(function () {` |
| 20916 | `if (idx === 0) go(); else window.setTimeout(go, idx * 260);` |
| 21007 | `if (idx === 0) go(); else window.setTimeout(go, idx * 120);` |
| 21025 | `window.setTimeout(function () {` |
| 21174 | `window.setTimeout(function () {` |
| 21189 | `window.setTimeout(function () {` |
| 21373 | `window.setTimeout(function () {` |
| 21376 | `window.setTimeout(function () {` |

## Laser terminus batch

The terminus orb, 31 impact particles and ground ring now retire with the originating lifetime. Existing cylinders and riding rings retain their animation cleanup; regression checks confirm exactly-once disposal of their instance geometry/materials. No asset cache or relay changes.

Next inspected sites: `_sigSwordWave3D` has route spark and terminal speed-burst timers; `_sigBreathBlast3D` has a charge/release callback with nested work; `_sigSonicBoomerang3D` has outbound rings, turnaround, return dash, reverse rings and catch timers. They remain unmodified and require their own behavioral regressions. Wall geometry remains a transitive audit task.

## Sword-wave batch

Route sparks and terminal speed burst now use `_fxDelay`; neither owns resource disposal. Existing `_sigRun` geometry ownership is preserved and exercised by regression tests. Six checks pass; three cancellation checks fail before the change. Breath and boomerang remain the next implementation tasks. Their downstream helper graph, wall geometry and asset attachment still require review.

## Breath/boomerang batch (current)

Thirteen sites are now lifetime-owned: five breath emissions, five boomerang emissions, two shared dash emissions and one shared sonic-boom ring emission. No disposal timer was canceled. Tests exercise the real dash and sonic helpers, with controlled rendering objects, after partial completion and a new lifetime. The three newly allocated geometry paths explicitly dispose resources if registration is refused; textures stay shared. `_sigRun` retains its existing contract.

16 tests pass (12 fail before fixes, four controls pass). Fire and water normal payloads, route/return timing, cap refusal, cleanup and stale callbacks are covered. Shared helper changes apply to their other callers, including dash dust.

Next: audit `spawnFlameBurst3D`, `_sigShockRing3D`, `_sigSpeedBurst3D`, then transitive wall geometry and asynchronous asset attachment. Earlier next-task statements above record historical batch boundaries. This does not close the complete transitive graph or VFX-04.
