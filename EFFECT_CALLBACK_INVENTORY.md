# Remaining effect callback inventory

Updated 2026-09-11 after the wall geometry audit and the `_sigRun` refusal sweep. This is a complete textual index of direct window.setTimeout sites, not an exhaustive semantic audit. Asset completion callbacks and other scheduling APIs still need separate review.

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
| 10301 | `window.setTimeout(function () {` |
| 10313 | `window.setTimeout(function () { _wpnLoad(key); }, 4500 + idx * 700);` |
| 10364 | `window.setTimeout(function () {` |
| 10553 | `window.setTimeout(function () {` |
| 11048 | `window.setTimeout(function () {` |
| 11427 | `window.setTimeout(function () {` |
| 11827 | `window.setTimeout(function () {` |
| 12187 | `window.setTimeout(function () {` |
| 12624 | `window.setTimeout(function () {` |
| 13814 | `window.setTimeout(function () {` |
| 14452 | `window.setTimeout(function () {` |
| 14471 | `window.setTimeout(function () {` |
| 15096 | `window.setTimeout(function () {` |
| 15308 | `window.setTimeout(function () {` |
| 15527 | `window.setTimeout(function () {` |
| 15560 | `window.setTimeout(function () {` |
| 16915 | `if (s.at) window.setTimeout(go, s.at); else go();` |
| 17199 | `window.setTimeout(function () {` |
| 17220 | `window.setTimeout(function () {` |
| 17279 | `window.setTimeout(function () {` |
| 17282 | `window.setTimeout(function () {` |
| 17317 | `window.setTimeout(function () {` |
| 17339 | `window.setTimeout(function () {` |
| 17583 | `window.setTimeout(function () {` |
| 17953 | `window.setTimeout(function () {` |
| 18100 | `window.setTimeout(function () {` |
| 18229 | `window.setTimeout(function () {` |
| 18269 | `window.setTimeout(function () {` |
| 18378 | `window.setTimeout(function () {` |
| 18733 | `window.setTimeout(function() {` |
| 18842 | `window.setTimeout(function () {` |
| 18863 | `window.setTimeout(function () {` |
| 19011 | `window.setTimeout(function () {` |
| 19331 | `window.setTimeout(function () {` |
| 19347 | `window.setTimeout(function () {` |
| 19531 | `window.setTimeout(function () { if (!_suppressed()) burst(); }, rideMs * 0.9);` |
| 19614 | `window.setTimeout(function () {` |
| 19712 | `window.setTimeout(function () {` |
| 20575 | `window.setTimeout(function() {` |
| 20724 | `window.setTimeout(function () {` |
| 20944 | `if (idx === 0) go(); else window.setTimeout(go, idx * 260);` |
| 21035 | `if (idx === 0) go(); else window.setTimeout(go, idx * 120);` |
| 21053 | `window.setTimeout(function () {` |
| 21202 | `window.setTimeout(function () {` |
| 21217 | `window.setTimeout(function () {` |
| 21401 | `window.setTimeout(function () {` |
| 21404 | `window.setTimeout(function () {` |

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

## Wall geometry and `_sigRun` refusal batch (current)

`_fireWall` transitive audit closed: recipe timers already `_fxDelay`-owned; `_spawnEffect` owns recipe layers; the only wall spell with 3D geometry is Walk the Plank (`_sigPlank3D`), which had no unowned timers but leaked its board/strap geometry and materials on a refused registration. Sweep of all `_sigRun` callers: 47 ignored the returned entry. `_sigDisposeGroup` is now the single disposal rule (used by `finish` and by the new `_sigRunOwned`); all 47 call `_sigRunOwned`, the 28 self-cleaning callers keep `_sigRun`. `sig-refusal-cleanup.test.js` source-scans that no `_sigRun` call ignores its entry. Lines 10 and 48 in the table are `_fxDelay` / `_fxDomOwner` themselves; the weapon-library boot warmup (`_wpnLoad` burst + drip) is application-lifetime and must not be canceled.

Asynchronous asset attachment inspected: `_wpnLoad` and `_loadCachedTex` write only into caches; casts clone or fall back, never attach a late load into a live group. No change needed.

Next: the bespoke emission timers in the table (candle puffs, burning-cross licks, and the rest) → `_fxDelay` per helper with regressions, then VFX-04.
