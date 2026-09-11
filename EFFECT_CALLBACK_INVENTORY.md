# Remaining effect callback inventory

Updated 2026-09-10 after shared shock-ring, speed-burst and flame cleanup review. This is a complete textual index of direct window.setTimeout sites, not an exhaustive semantic audit. Asset completion callbacks and other scheduling APIs still need separate review.

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
| 10284 | `window.setTimeout(function () {` |
| 10296 | `window.setTimeout(function () { _wpnLoad(key); }, 4500 + idx * 700);` |
| 10347 | `window.setTimeout(function () {` |
| 10536 | `window.setTimeout(function () {` |
| 11031 | `window.setTimeout(function () {` |
| 11410 | `window.setTimeout(function () {` |
| 11810 | `window.setTimeout(function () {` |
| 12170 | `window.setTimeout(function () {` |
| 12607 | `window.setTimeout(function () {` |
| 13797 | `window.setTimeout(function () {` |
| 14435 | `window.setTimeout(function () {` |
| 14454 | `window.setTimeout(function () {` |
| 15079 | `window.setTimeout(function () {` |
| 15291 | `window.setTimeout(function () {` |
| 15510 | `window.setTimeout(function () {` |
| 15543 | `window.setTimeout(function () {` |
| 16898 | `if (s.at) window.setTimeout(go, s.at); else go();` |
| 17182 | `window.setTimeout(function () {` |
| 17203 | `window.setTimeout(function () {` |
| 17262 | `window.setTimeout(function () {` |
| 17265 | `window.setTimeout(function () {` |
| 17300 | `window.setTimeout(function () {` |
| 17322 | `window.setTimeout(function () {` |
| 17566 | `window.setTimeout(function () {` |
| 17936 | `window.setTimeout(function () {` |
| 18083 | `window.setTimeout(function () {` |
| 18212 | `window.setTimeout(function () {` |
| 18252 | `window.setTimeout(function () {` |
| 18361 | `window.setTimeout(function () {` |
| 18716 | `window.setTimeout(function() {` |
| 18825 | `window.setTimeout(function () {` |
| 18846 | `window.setTimeout(function () {` |
| 18994 | `window.setTimeout(function () {` |
| 19314 | `window.setTimeout(function () {` |
| 19330 | `window.setTimeout(function () {` |
| 19514 | `window.setTimeout(function () { if (!_suppressed()) burst(); }, rideMs * 0.9);` |
| 19597 | `window.setTimeout(function () {` |
| 19695 | `window.setTimeout(function () {` |
| 20558 | `window.setTimeout(function() {` |
| 20707 | `window.setTimeout(function () {` |
| 20927 | `if (idx === 0) go(); else window.setTimeout(go, idx * 260);` |
| 21018 | `if (idx === 0) go(); else window.setTimeout(go, idx * 120);` |
| 21036 | `window.setTimeout(function () {` |
| 21185 | `window.setTimeout(function () {` |
| 21200 | `window.setTimeout(function () {` |
| 21384 | `window.setTimeout(function () {` |
| 21387 | `window.setTimeout(function () {` |

## Laser terminus batch

The terminus orb, 31 impact particles and ground ring now retire with the originating lifetime. Existing cylinders and riding rings retain their animation cleanup; regression checks confirm exactly-once disposal of their instance geometry/materials. No asset cache or relay changes.

Next inspected sites: `_sigSwordWave3D` has route spark and terminal speed-burst timers; `_sigBreathBlast3D` has a charge/release callback with nested work; `_sigSonicBoomerang3D` has outbound rings, turnaround, return dash, reverse rings and catch timers. They remain unmodified and require their own behavioral regressions. Wall geometry remains a transitive audit task.

## Sword-wave batch

Route sparks and terminal speed burst now use `_fxDelay`; neither owns resource disposal. Existing `_sigRun` geometry ownership is preserved and exercised by regression tests. Six checks pass; three cancellation checks fail before the change. Breath and boomerang remain the next implementation tasks. Their downstream helper graph, wall geometry and asset attachment still require review.

## Breath/boomerang batch (current)

Thirteen sites are now lifetime-owned: five breath emissions, five boomerang emissions, two shared dash emissions and one shared sonic-boom ring emission. No disposal timer was canceled. Tests exercise the real dash and sonic helpers, with controlled rendering objects, after partial completion and a new lifetime. The three newly allocated geometry paths explicitly dispose resources if registration is refused; textures stay shared. `_sigRun` retains its existing contract.

16 tests pass (12 fail before fixes, four controls pass). Fire and water normal payloads, route/return timing, cap refusal, cleanup and stale callbacks are covered. Shared helper changes apply to their other callers, including dash dust.

Next: audit `spawnFlameBurst3D`, `_sigShockRing3D`, `_sigSpeedBurst3D`, then transitive wall geometry and asynchronous asset attachment. Earlier next-task statements above record historical batch boundaries. This does not close the complete transitive graph or VFX-04.

## Shared helper cleanup batch (current)

Audited `spawnFlameBurst3D`, `_sigShockRing3D` and `_sigSpeedBurst3D`: no unowned timers inside these helpers. Shock ring (including optional torus) and speed burst now dispose geometry/materials on registration refusal, preserving shared textures. Flame spawn/tick scene changes now remove old groups from their parent before disposing materials. The shared box geometry cache remains intact. Normal expiration and explicit clear already detached groups.

13 tests pass; eight reproduce failures on the unchanged baseline. Tests exercise actual scheduling/cleanup functions with rendering doubles and a stub flame builder; no browser or network acceptance claim. Next: transitive `_fireWall` geometry dispatch, other `_sigRun` refusal paths and asynchronous asset attachment, then VFX-04. Previous next-task paragraphs record historical batch boundaries.
