# Remaining effect callback inventory

Updated 2026-09-10 after mapped wall/chain/beam timer retirement. This is a complete textual index of direct window.setTimeout sites, not an exhaustive semantic audit. Asset completion callbacks and other scheduling APIs still need separate review.

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

Geometry trace: `_spawnLaserBeam3D` registers cylinders and rings with `_animate3D`, which retires through `_cleanup3D`. Its separate delayed terminus emission remains open and is the exact next implementation target. Wall geometry dispatch and sword-wave/breath/boomerang branches need further transitive review; no complete geometry-coverage claim is made.

## Remaining direct timer sites

| Line | Direct timer call |
| --- | --- |
| 10 | `var id = window.setTimeout(function () {` |
| 48 | `var id = window.setTimeout(function () {` |
| 5054 | `window.setTimeout(function() {` |
| 5117 | `window.setTimeout(function() {` |
| 5146 | `window.setTimeout(function() {` |
| 5161 | `window.setTimeout(function() {` |
| 5738 | `window.setTimeout(function () {` |
| 5880 | `window.setTimeout(function () {` |
| 6150 | `window.setTimeout(function() {` |
| 8272 | `window.setTimeout(function() {` |
| 8335 | `window.setTimeout(function() {` |
| 8370 | `window.setTimeout(function() {` |
| 9929 | `window.setTimeout(function () {` |
| 9984 | `window.setTimeout(function () {` |
| 10266 | `window.setTimeout(function () {` |
| 10278 | `window.setTimeout(function () { _wpnLoad(key); }, 4500 + idx * 700);` |
| 10329 | `window.setTimeout(function () {` |
| 10518 | `window.setTimeout(function () {` |
| 11013 | `window.setTimeout(function () {` |
| 11392 | `window.setTimeout(function () {` |
| 11792 | `window.setTimeout(function () {` |
| 12152 | `window.setTimeout(function () {` |
| 12589 | `window.setTimeout(function () {` |
| 13621 | `window.setTimeout(function () {` |
| 13627 | `window.setTimeout(function () {` |
| 13779 | `window.setTimeout(function () {` |
| 14417 | `window.setTimeout(function () {` |
| 14436 | `window.setTimeout(function () {` |
| 15061 | `window.setTimeout(function () {` |
| 15127 | `window.setTimeout(function () {` |
| 15266 | `window.setTimeout(function () {` |
| 15485 | `window.setTimeout(function () {` |
| 15518 | `window.setTimeout(function () {` |
| 16873 | `if (s.at) window.setTimeout(go, s.at); else go();` |
| 17157 | `window.setTimeout(function () {` |
| 17178 | `window.setTimeout(function () {` |
| 17237 | `window.setTimeout(function () {` |
| 17240 | `window.setTimeout(function () {` |
| 17275 | `window.setTimeout(function () {` |
| 17297 | `window.setTimeout(function () {` |
| 17541 | `window.setTimeout(function () {` |
| 17622 | `window.setTimeout(function () {` |
| 17705 | `window.setTimeout(function () {` |
| 17732 | `window.setTimeout(function () {` |
| 17753 | `window.setTimeout(function () {` |
| 17764 | `window.setTimeout(function () {` |
| 17799 | `window.setTimeout(function () {` |
| 17807 | `window.setTimeout(function () {` |
| 17815 | `window.setTimeout(function () {` |
| 17823 | `window.setTimeout(function () {` |
| 17830 | `window.setTimeout(function () {` |
| 17904 | `window.setTimeout(function () {` |
| 18051 | `window.setTimeout(function () {` |
| 18180 | `window.setTimeout(function () {` |
| 18220 | `window.setTimeout(function () {` |
| 18329 | `window.setTimeout(function () {` |
| 18684 | `window.setTimeout(function() {` |
| 18793 | `window.setTimeout(function () {` |
| 18814 | `window.setTimeout(function () {` |
| 18962 | `window.setTimeout(function () {` |
| 19282 | `window.setTimeout(function () {` |
| 19298 | `window.setTimeout(function () {` |
| 19482 | `window.setTimeout(function () { if (!_suppressed()) burst(); }, rideMs * 0.9);` |
| 19565 | `window.setTimeout(function () {` |
| 19663 | `window.setTimeout(function () {` |
| 20526 | `window.setTimeout(function() {` |
| 20675 | `window.setTimeout(function () {` |
| 20895 | `if (idx === 0) go(); else window.setTimeout(go, idx * 260);` |
| 20986 | `if (idx === 0) go(); else window.setTimeout(go, idx * 120);` |
| 21004 | `window.setTimeout(function () {` |
| 21153 | `window.setTimeout(function () {` |
| 21168 | `window.setTimeout(function () {` |
| 21352 | `window.setTimeout(function () {` |
| 21355 | `window.setTimeout(function () {` |
