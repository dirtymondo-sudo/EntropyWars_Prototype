# Remaining effect callback inventory

Updated 2026-09-10 (America/Chicago), after the prior entry labeled 2026-09-11 and the candle/cross emission batch. This is a textual index, not an exhaustive semantic audit.

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
| 15306 | `window.setTimeout(function () {` |
| 15525 | `window.setTimeout(function () {` |
| 15558 | `window.setTimeout(function () {` |
| 16913 | `if (s.at) window.setTimeout(go, s.at); else go();` |
| 17197 | `window.setTimeout(function () {` |
| 17218 | `window.setTimeout(function () {` |
| 17277 | `window.setTimeout(function () {` |
| 17280 | `window.setTimeout(function () {` |
| 17315 | `window.setTimeout(function () {` |
| 17337 | `window.setTimeout(function () {` |
| 17581 | `window.setTimeout(function () {` |
| 17951 | `window.setTimeout(function () {` |
| 18098 | `window.setTimeout(function () {` |
| 18227 | `window.setTimeout(function () {` |
| 18267 | `window.setTimeout(function () {` |
| 18376 | `window.setTimeout(function () {` |
| 18731 | `window.setTimeout(function() {` |
| 18840 | `window.setTimeout(function () {` |
| 18861 | `window.setTimeout(function () {` |
| 19009 | `window.setTimeout(function () {` |
| 19329 | `window.setTimeout(function () {` |
| 19345 | `window.setTimeout(function () {` |
| 19529 | `window.setTimeout(function () { if (!_suppressed()) burst(); }, rideMs * 0.9);` |
| 19612 | `window.setTimeout(function () {` |
| 19710 | `window.setTimeout(function () {` |
| 20573 | `window.setTimeout(function() {` |
| 20722 | `window.setTimeout(function () {` |
| 20942 | `if (idx === 0) go(); else window.setTimeout(go, idx * 260);` |
| 21033 | `if (idx === 0) go(); else window.setTimeout(go, idx * 120);` |
| 21051 | `window.setTimeout(function () {` |
| 21200 | `window.setTimeout(function () {` |
| 21215 | `window.setTimeout(function () {` |
| 21399 | `window.setTimeout(function () {` |
| 21402 | `window.setTimeout(function () {` |

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

## Candle/cross emission batch (current)

`_sigCandleProp3D` embers and `_sigCrossDescent3D` burning licks now use `_fxDelay`. They emit particles only; geometry retirement remains with `_sigRunOwned`. Candle cold-cache emissions are owned too. Timing, payloads, suppression, non-burning cross and pillar fallback are unchanged. Sixteen production-helper regressions pass; nine fail against pinned unchanged source. Real registration/animation cleanup is exercised with rendering doubles, including shared geometry retention and cap refusal. No browser or network acceptance.

Next: `_sigSleighRide3D` frost wake (line 11048) and `_sigStandSword3D` dissolve motes (line 11427), then the other direct emission sites above, then VFX-04. The first two table entries implement the lifetime helpers themselves; weapon-library boot and staggered warmup remain application-owned. Prior next-task text records historical batch boundaries.

## Sleigh/stand-sword batch (current)

Both frost-wake and dissolve-mote timer sites now use `_fxDelay`; they emit particles and own no disposal. Existing `_sigRunOwned` animations and cached assets are preserved. Thirteen production-helper tests pass, five fail before fixes. Full suite: 492 passed, zero failed, two skipped; syntax 90/90. Browser and online acceptance remain open.

Next: `_sigSlashCombo3D` dissolve motes (11827) and `_sigJawsBite3D` terminal mist (12187), then the remaining direct emissions and VFX-04. Earlier next-task entries are historical.

## Slash-combo/jaws batch (current)

Both terminal emission sites now use `_fxDelay`; geometry disposal remains with `_sigRunOwned`. Fifteen production-helper checks pass (six fail before fixes); full suite 507 pass, zero fail, two skips; syntax 91/91. Next: `_sigCannonShot3D` detached-ball disposal ownership (a cleanup timer, not an emission; do not simply cancel), remaining emission helpers, then VFX-04. Application cache warmup is unchanged. No browser or online acceptance. Earlier next-task statements are historical.

## Cannon and four emission helpers (current)

Cannon's detached-ball disposal timer is removed. An identity parent owns carriage and ball under `_sigRunOwned`, preserving world-space flight and retiring both on completion/refusal/scene exit. Tesla arcs, storm impact, judgment pillar and music-note creation now use `_fxDelay`; these four sites emit work and own no disposal. 27 tests pass, 15 fail before; full suite 534 pass, zero fail, two skips; syntax 92/92. No browser or online acceptance. Next: `_sigWhiteout3D` second ring, `_sigRuneSphere3D` and subsequent bespoke timers, then VFX-04. Older next-task entries are historical.
