# Entropy Wars — adversarial review plan

Last updated: 2026-09-10 (America/Chicago)
Repository: https://github.com/dirtymondo-sudo/EntropyWars_Prototype
Baseline: Phase 1 source review pinned to main commit `f0a4c3341631d60cee2ac544e543a13754d21624` (2026-09-09 in America/Chicago). Phase 0 used an unpinned main snapshot.
Continuation baseline: main commit `4c740fcf6624a30d59e30c4d4dfea1a16dd85b03`, checked 2026-09-09 (America/Chicago). This commit and its predecessor `3da54eff8abbef3da87a1c0f72272919d84bd15e` changed only the uploaded review document; the inspected game source and line references remain unchanged.
Delivery: this document is repository/reference material. The first delivery is now present in repository main `41f8e76b67120eea58c17fd968c5c72d70ef035e`; R2/Render deployment is unverified. The pause-focus delivery is also present in repository main `e92ee26153b65c2047963544c56310ea838220bb`. The Settings-focus delivery is present in repository main `f546e7fff61edb012e3fae536aee995996257c4f`. The PAUSE-06 controller delivery is present in repository main `88b3bc65adc93fc8ed2e84c28c112b0c81565b3f`; the PAUSE-07 delivery is present in repository main `82494b38fa3dea84f89f32a8723602289fa51b3f`; R2/Render deployment remains unverified.

### Latest continuation — 2026-09-10: LIFE-06 / VFX-03 mapped wall, chain and beam timers

**Implemented and locally validated; not deployed or browser-playtested.** Three direct timer sites in `_fireWall`, `_fireChain` and `_fireBeamMapped` now use `_fxDelay`. Pending wall repetitions, chain hops/lightning and the generic beam charge callback retire with their originating lifetime. Already-queued callbacks remain inert after a new cast. Normal delays, coordinates, primary-chain behavior, beam fallback, scorch and impact payloads are preserved. These callbacks emit work and do not own disposal. Existing local cleanup applies to both online viewers; relay payloads and authority are unchanged.

**Validation:** 10 production-function tests pass; five retirement tests fail against the downloaded unchanged source and five normal-emission controls pass. Tests cover cancellation before emission, partial wall/chain completion, stale callback invocation after a fresh cast, beam source aliases, sprite fallback and primary-chain semantics. Full package test command using bundled Node (`node --test *.test.js`; npm unavailable): 408 total, **404 passed, 2 previously recorded failures, 2 skips**. The failures remain the Phase 6 starter assertion and lunar-lander ceiling assertion. Syntax: **81/81 clean**. Controlled tests stub rendering and do not establish WebGL or live network acceptance.

**Source and delivery:** current main effects, index, CLAUDE.md and tracker downloaded before editing. Effects, index and CLAUDE.md matched the working copies. Complete files and validation evidence are in `ENTROPY_WARS_MAPPED_EFFECT_FIXES.zip`: three-vfx-effects.js → R2; index.html → Render; test, inventory and plan → repository only. Shared token: `20260910-mapped-retirement-01-cors`. No synced reference edits, commit, push or deployment.

**Exact next task:** start at `_spawnLaserBeam3D`'s delayed terminus starburst/shock ring (currently line 5738), which can still fire after the generic beam has started and its scene retires. Its cylinders/rings already register with `_animate3D`/`_cleanup3D`; the delayed emission needs lifetime ownership and a production-helper regression. Then trace `_sigSwordWave3D`, `_sigBreathBlast3D`, `_sigSonicBoomerang3D` and transitive wall geometry. Bespoke beam branches return before the generic charge timer, so this batch does not fix their timers. Preserve shared asset-cache warmup; continue remaining mapped callbacks and asset attachment, then VFX-04 visibility. LIFE-06/VFX-03 remain partial.

### Latest continuation — 2026-09-10: LIFE-06 / VFX-03 descent callback ownership

**Implemented and locally validated; not deployed or browser-playtested.** Seven direct timer sites now use `_fxDelay`: descent flyover, nested flyover smoke, descent/warhead spawn, staggered sky lightning, impact, shared `_emitAoeBursts` tile/center bursts, and `_sigMissileDrop3D` smoke. Retiring the originating lifetime cancels pending emissions and rejects already-queued callbacks, including after descent or impact has begun. Existing delays, visual payloads and model/sprite selection are unchanged. These timers emit effects rather than dispose resources; existing model ownership stays with `_sigRun`, and shared weapon-cache warmup is preserved. Host and guest use the same local effect lifetime; no relay or authority changes.

**Validation:** eight production-function tests pass, covering sprite fallback and cached missile paths, retirement before flyover/after descent/after impact, nested work, stale queued callbacks and fresh casts. Six retirement checks fail against the downloaded unchanged source; both normal-emission controls pass. Full package test command with bundled Node (`node --test *.test.js`; npm unavailable): **398 total, 394 passed, 2 failed, 2 skipped**. Failures match the previously recorded Phase 6 starter assertion and lunar-lander ceiling assertion; their files were not edited. Syntax: **80/80 clean**. Controlled function tests do not render WebGL or prove live host/guest acceptance. This is the mixed local review workspace, not full-main CI.

**Source:** refreshed main effects, index, CLAUDE.md and tracker before editing; effects and notes were byte-identical to the previous local state. Effects Git blob: `c7bace48b9515b0ab65aaf451b1e41af39a9c76a`. Complete downloaded baseline hashes accompany the delivery. Synced sources untouched.

**Delivery:** `ENTROPY_WARS_DESCENT_FIXES.zip` includes complete three-vfx-effects.js (R2), index.html (Render), descent-lifetime.test.js, EFFECT_CALLBACK_INVENTORY.md and this plan (repository only), plus validation logs and hash manifests. Shared cache token: `20260910-descent-retirement-01-cors`. No commit, push or deployment.

**Exact next task:** continue at `_fireWall`, `_fireChain` and `_fireBeamMapped`, tracing nested geometry helpers and their resource owners before changing their timers. Separate geometry callbacks invoked by descent, including meteor/nuke, still need semantic review; this batch does not close the complete transitive descent graph. Then remaining mapped/bespoke timers and asset completion attachment; preserve application cache warmup. VFX-04 endpoint/list visibility remains open. LIFE-06/VFX-03 remain partial.

### Latest continuation — 2026-09-10: LIFE-06 / VFX-03 electric and combo callbacks

**Implemented and locally validated; not deployed or browser-playtested.** This entry supersedes older next-task ordering. Five direct timer sites now use the existing `_fxDelay` lifetime owner: electric_arcs cue bursts, generic electric impact arcs, combo convergence heads, nested combo trails, and the combo arrival explosion. Retirement cancels pending timers and makes already-queued callbacks inert across subsequent battles/previews. Nested trails already scheduled by a convergence head are retired too. These callbacks only emit effects; none is responsible for resource disposal. Normal delays, particle counts, elemental sprites, geometry and relay payloads are preserved.

**Evidence and validation:** ten production-function regression checks pass; seven fail against the downloaded unchanged effects file and three normal-emission controls pass. Tests exercise current-lifetime timing/counts, timer cancellation, stale queued callbacks, new-lifetime emission and retirement after nested combo work begins. Full package test command via bundled Node (`node --test *.test.js`, npm unavailable): **390 total, 386 passed, 2 failed, 2 skipped**. The failures remain the recorded Phase 6 starter assertion and lunar-lander ceiling assertion; the corresponding code/data/tests are unchanged. Syntax checks: **79/79 clean**. This is the existing mixed local review workspace, not a full-main CI checkout or WebGL/host-guest acceptance.

**Source:** downloaded current main three-vfx-effects.js, index.html, CLAUDE.md and this tracker before editing. Effects and tracker were byte-identical to the previous local delivery; the effects Git blob was `ed7ace9b41010ddb39c8acfd8fb4c63b7bc7e24c`. Read the updated character/preview rules and retained all current effects. No synced sources edited. Both online viewers run the same local effect cleanup; no authority or network contract changed.

**Delivery:** `ENTROPY_WARS_ELECTRIC_COMBO_FIXES.zip` contains complete three-vfx-effects.js (R2), index.html (Render), electric-combo-lifetime.test.js, EFFECT_CALLBACK_INVENTORY.md and this tracker (repository only), with validation logs and SHA-256 manifests. Cache token: `20260910-electric-combo-retirement-01-cors`. No commit, push or deployment.

**Exact next task:** continue semantic ownership review at `_fireDescent`: delayed flyover, nested smoke trail, descent/warhead spawn and impact callbacks. Then remaining mapped/bespoke spell callbacks and asset completion attachment. Preserve shared weapon-cache warmup and give resource-disposal callbacks an owner before cancellation. VFX-04 endpoint/list visibility (`sx/sy`, tiles, chain aliases) remains open. LIFE-06/VFX-03 remain partial; no claim of complete timer coverage or live acceptance.

### Latest continuation — 2026-09-10: LIFE-06 / VFX-03 bespoke delays and dust-devil ownership

**Implemented and locally validated; not deployed or browser-playtested.** This entry supersedes older next-task ordering. The dash landing ring, legacy teleport arrival and Blizzard Present delayed shards now use the existing lifetime-bound delay helper. Retirement cancels the underlying timers and rejects callbacks already queued, even when another battle or preview permits effects. Current-lifetime timing and emissions are preserved.

Dust Devil now registers its attached group as the animation cleanup owner. The existing `_cleanup3D` traversal detaches the root and disposes its four geometries and four materials on normal completion or bulk retirement. Removed the 100 ms polling interval: it previously left the root attached until the next poll and disposed the children again after shared cleanup. No new runtime helper or shared-cache disposal rule was introduced.

**Validation:** nine production-function regressions pass; six fail against the unchanged source, while three normal-emission controls pass. Tests cover queued callbacks, cancellation, fresh preview casts, normal completion, immediate group removal, exactly-once resource disposal and subsequent ownership. Full package test command with bundled Node: **380 total, 376 passed, 2 failed, 2 skipped**. Failures match the recorded Phase 6 starter assertion and lunar-lander ceiling assertion; their source/data files were untouched. **78/78 JavaScript files syntax-clean.** Controlled runtime tests do not render WebGL. This remains the mixed local review workspace, not full-main CI.

**Source and online parity:** downloaded current main effects and entry page before editing; effects were byte-identical to the working copy and Git blob `8f88bb557b135ff326fb462f8a62b1c62b71a0d7`. Read current main CLAUDE.md changes and relevant preview/online ownership rules. Existing local host/guest effect wrappers and spell geometry paths are retained; neither relay payloads nor authority changed. Synced sources were not edited.

**Delivery:** `ENTROPY_WARS_BESPOKE_EFFECT_FIXES.zip` contains complete three-vfx-effects.js (R2), index.html (Render), bespoke-effect-lifetime.test.js, EFFECT_CALLBACK_INVENTORY.md and this plan (repository only), plus validation logs and SHA-256 manifests. Shared token: `20260910-bespoke-effect-retirement-01-cors`. Nothing committed, pushed or deployed.

**Remaining work / exact next task:** the three named delayed-spawn cases and dust-devil polling owner are fixed, not the entire bespoke timer population. EFFECT_CALLBACK_INVENTORY.md indexes all remaining direct window.setTimeout call sites, including helper-owned and application cache timers. Continue semantic classification from electric_arcs and subsequent spell callbacks; give cleanup callbacks an explicit disposal owner before canceling them, and preserve `_wpnLoad` boot/staggered cache warmup. Asset completion attachment needs separate tracing. Then implement VFX-04 endpoint/list visibility including sx/sy, tiles and chain aliases. LIFE-06/VFX-03 remain partial, VFX-04 remains open, and browser/host-guest acceptance remains unverified.

### Latest continuation — 2026-09-10: LIFE-06 / VFX-03 DOM effect disposal

**Implemented and locally validated; not deployed or browser-playtested.** This entry supersedes all older continuation ordering. Flashback tint, the To Be Continued end-card, and the psychedelic CSS fallback now register owned animation frames, timers, and disposal with effect retirement. Clear removes their DOM immediately, restores the preceding canvas filter, releases active flags, and makes already-queued callbacks inert. Normal completion unregisters the owner. Competing CSS tints explicitly hand ownership over so an earlier effect cannot reset a later tint. The shader-based psychedelic path is unchanged.

The existing clearAll → delay retirement boundary now also disposes these DOM owners. The previously implemented battle/preview ownership rules are retained; the same local cleanup runs on both online viewers without changing relay payloads or authority.

**Validation:** nine new production-function regression tests pass; eight fail against the unchanged source and the normal end-card control passes. Checks cover immediate retirement, old queued frames/timers, reentry, normal completion, prior-filter restoration and overlapping tint handoff in a controlled DOM, without WebGL. Full package test command via bundled Node: **371 total, 367 passed, 2 failed, 2 skipped**. The failures remain the recorded Phase 6 starter assertion and lunar-lander ceiling assertion; their files were untouched. Syntax: **77/77 clean**. This is the existing mixed local review workspace, not full-main CI or live acceptance.

**Baseline:** downloaded complete current main effects source; verified Git blob `b06d226f69435fa551aba18b061719dfe27f5d87`, byte-identical to the previous local delivery. Downloaded the current main entry page before its cache bump. Existing CLAUDE.md and relevant effect/preview rules were read. No synced sources were edited.

**Timer inventory for continuation (bounded source triage, not a completed exhaustive audit):**

| Callback class | Inspected example | Status / next handling |
| --- | --- | --- |
| Independent DOM frames + removal timers | Flashback, end-card, psychedelic CSS fallback | Owned cancellation plus immediate disposal implemented in this batch. |
| Delayed scene spawning | raceBlizzardPresent delayed shards; fireTeleportLegacy arrival; delayed dash shock ring | Still open. Convert after tracing callers and test clear/reentry; a phase check alone is insufficient. |
| Resource cleanup polling | entry.done polling before group removal and geometry/material disposal | Still open. Register disposal before canceling its interval; cancellation alone leaks resources. |
| Shared cache warmup | _wpnLoad boot and staggered warmup timers | Separate application/cache lifetime; do not bulk-cancel with battle timers. Asset callbacks need separate scene-attachment review. |

**Delivery:** `ENTROPY_WARS_DOM_EFFECT_CLEANUP.zip`: complete three-vfx-effects.js to R2; complete index.html to Render; dom-effect-lifetime.test.js and this plan to repository only. Cache token: `20260910-dom-effect-cleanup-02-cors`. Includes before/after validation logs and SHA-256 manifest. Nothing committed, pushed or deployed.

**Exact next task:** finish the bespoke spawn/cleanup callback inventory and implement delayed scene-spawn retirement plus polling disposal. Then implement VFX-04 endpoint/list visibility filtering, including sx/sy, tiles and chain aliases. LIFE-06/VFX-03 remain partially implemented; VFX-04 remains open. Browser and host/guest visual acceptance remain unverified.

### Latest continuation — 2026-09-10: LIFE-06 / VFX-03 effect lifetime, first implementation

**Status: concrete lifecycle fixes implemented and locally validated; broader effect lifetime work and VFX-04 remain open. Not deployed or browser-playtested.** This continuation supersedes the older next-task ordering below.

- **Battle departure:** `ThreeRenderer.deactivate()` now calls the effects subsystem's owner-aware `clearBattle()`. Existing bulk retirement clears registered particles, projectiles, geometry and animation tickers. An active character preview owns the shared effects layer, so a parked battle's deactivation leaves that preview alone. The character viewer also retires board effects before moving the shared pools into its stage; newer repository character-creator behavior and spell artwork are preserved.
- **Delayed work:** generic recipe layers, repeated cue batches and teleport arrivals now use a cancellable lifetime-bound timer. Clearing effects cancels those pending timers and invalidates callbacks already queued for execution, including across two battles with the same `phase` or two consecutive previews. A cue that clears itself cannot schedule its remaining batches into the new lifetime. Preview exit already uses bulk retirement and now inherits this cancellation.
- **Ticker race:** the shared animation pump previously detached its queue, invoked a callback, and could reinsert that callback after it cleared the subsystem. A generation check now stops the retired queue immediately and prevents that resurrection. New work explicitly registered after the clear is retained.
- **Both players:** these are local renderer/effect ownership rules and apply to both host and guest. No event payloads or gameplay authority changed. Preview firing remains on the internal stage path; it is not relayed online.
- **Scope limit:** this does not make every bespoke effect asynchronous callback safe. Numerous individual spell timers, cleanup timers, a polling interval, independent DOM animation frames and asset callbacks still require individual ownership/cleanup review. They were not blindly canceled because some perform resource disposal. VFX-04's mixed-visibility endpoint/list filtering is unchanged and remains high priority. LIFE-06/VFX-03 are partially implemented, not closed; no visual, performance or live network claim is made.

**Validation:** 12/12 new controlled-runtime regression checks pass; against the fetched unmodified runtime files, 11 fail and one normal-emission control passes. Coverage executes production recipe, teleport, cue, ticker, preview and renderer-boundary functions with controlled timers; it does not render WebGL. Full package test script (`node --test *.test.js`, bundled Node because npm is unavailable): **362 total, 358 passed, 2 failed, 2 skipped**. The two failures remain the previously recorded Phase 6 starter-race assertion and lunar-lander ceiling assertion; neither assertion nor their data was changed. The existing scene lifecycle fixture now supplies a browser `window` object; all its assertions are retained. **76/76 JavaScript files pass syntax checks.** This is the established mixed local workspace, not a full-main CI run. No browser playtest, dependency boot, deployment or performance measurement was performed.

**Source refresh:** main `three-vfx-effects.js` blob `72e2bbecb9da7f6ce1e2f1ba9759539af179bc28` and `three-renderer.js` blob `b74a2e66693462d342a242204261b8a0ef63366a` were downloaded completely and verified against connector-returned Git blob hashes before editing. Current `CLAUDE.md` was read; the fetched tracker matches the prior local tracker. `index.html` matches main blob `69350f73a6520fd413f81cfc1f7e54bf5fac5c7c` before the cache bump. This is per-file refresh, not a pinned full checkout.

**Delivery:** `ENTROPY_WARS_EFFECT_LIFETIME_FIXES.zip` contains complete `three-vfx-effects.js` and `three-renderer.js` for R2; complete cache-busted `index.html` for Render; `effect-lifetime.test.js`, updated `scene-lifecycle.test.js`, and this tracker for the repository. Shared cache token: `20260910-effect-lifetime-01-cors`. Upload instructions, validation logs and SHA-256 manifests are included. Nothing committed, pushed or deployed.

**Exact next task:** continue LIFE-06/VFX-03 by inventorying the remaining bespoke spawn timers separately from cleanup timers; register cancellation plus disposal for the independent flashback/end-card DOM effects and test exit/reentry. Then implement VFX-04 visibility filtering at each endpoint and supported coordinate/list alias (`sx/sy`, `tiles`, `chain` included), preserving visible portions without exposing hidden ones. Do not redo reconnect recovery or claim these remaining boundaries are fixed by generic timer cancellation.

### Previous continuation — 2026-09-10: LIFE-05 clock and reconnect implementation

**Status: implemented and locally validated; R2/Render deployment and live network acceptance remain unverified.** This batch completes the planned current-generation snapshot/clock recovery protocol on top of LIFE-07/08/09. It supersedes their implementation-next-step instructions. It does not mark all lifecycle, loading, or visual phases complete.

- **Acknowledged recovery:** all-return connectivity starts a server-owned transaction with an unpredictable recovery ID, match ID and current host/guest socket identities. New gameplay remains blocked. The host waits for committed action/walk/death work to settle, sends a frozen full snapshot, and the guest acknowledges only after state application succeeds. The host then confirms its current gameplay checksum still matches the captured snapshot. Only the server's matching completion releases both players. The first returning player still waits for the other seat's independent disconnect deadline.
- **Stale-message boundaries:** rematches receive a new match ID. Snapshots, actions, rematch relays and party configurations carry their match generation; asynchronous party validation rechecks the current room and generation after awaiting storage. Obsolete socket listeners and late rejoin callbacks are ignored. Recovery packets are bound to the active transaction and seat; retired timers cannot affect reused rooms or subsequent recovery attempts. Deferred engine continuations are owned by the state object and match.
- **Clocks:** shot-clock remaining milliseconds and elapsed match time cross the network as durations, then are rebased onto the receiving computer's clock. Reconnect and cinematic suspension retain separate ownership. Guest refresh restarts its local display/expiry interval and restores explicit local/remote controllers and host map/mode/team-size context. A host observing an expired remote turn no longer disables the mirrored clock. Each activation has an identity: repeated heartbeats cannot emit multiple timeouts, and late mutating action packets cannot consume a later activation. Realtime Strike uses a logical clock so its cooldowns, respawns and scheduled deadlines do not age while paused.
- **Engine boundary:** input, AI triggering, turn advancement, activation, match-boot continuation, Simul planning/entry and realtime frames wait during recovery. Previously committed actions may finish before capture; recovery does not roll back an already committed hit. The host's final checksum confirmation detects changes to the existing gameplay checksum fields while the guest was applying the snapshot. This is a state-application barrier, not a claim that every asset or animation has been visually verified.
- **Bounded outcomes:** the server permits 20 seconds for state recovery, with bounded client retries and a slightly longer local fallback. Host retry uses the same frozen packet if the initial send was dropped. Failed application, a mismatch, an unavailable authoritative page, or timeout produces a visible Return to Main Menu action and retires the unusable room. Protocol failure does not invent a gameplay winner or an Elo loss; the existing 90-second disconnect-forfeit rule remains for players who do not reclaim their seat. This safe-abort policy is not new anti-cheat enforcement for ranked play.
- **Result and exit:** a result cancels recovery and pending disconnect deadlines. A previously absent seat can retrieve the terminal snapshot with its own credential while the room remains available. Recovery completion, rematch, second outage and menu teardown invalidate stale work. Saved rejoin credentials are refreshed after successful rejoin; unavailable browser storage does not break the failure UI.
- **Host-page boundary:** an ordinary host socket outage resumes using its retained authoritative engine. A hard refresh/crash that loses the host's active engine cannot reconstruct its in-flight closures/timers from the guest's mirror. That case now ends visibly and safely instead of claiming a successful rejoin. This delivery does not implement host migration, persistent checkpoints, or survival of a server restart. A terminal result can still be restored when retained by the server.

**Validation:** the five reconnect-related test files pass **93/93**. Tests execute production server/client handlers, clock functions and engine boundaries with controlled clocks/transports, including complete host-return and guest-return handshake exchanges. Three new clock regressions fail against the unmodified battle source and pass after the fixes. The full package test script (`node --test *.test.js`, using bundled Node v24.19.0 because npm is unavailable) reports **350 total: 346 passed, 2 failed, 2 skipped**. The failures are the previously recorded Phase 6 starter assertion and lunar-lander ceiling assertion; an unchanged-source control run reproduces both (**79 passed, 2 failed**). All **75 JavaScript files pass syntax checks**. Neither unrelated assertion was weakened. No browser playtest, real network/device run, server dependency boot, deployment, performance measurement or visual acceptance was performed.

**Source baseline:** relevant files were refreshed from repository main using per-file reads: `server.js` blob `a7c5ab58b58f3710a6374112d8957c89c99239ad`, `online.js` `8d0fec1469f1ae607d8e2113382b6fd12681078f`, `battle.js` `40cc64e74ccad11f747ad9bf60961d13626b28d2`, `index.html` `0d35f4142e2ff0d04c8eabfa99da2ba6ba8fc7a3`, and `CLAUDE.md` `198bced37ea71101b6bb4ebe55a0eae1e0f31c6b`. The large battle file was verified byte-for-byte by Git blob hash against the retained complete copy. This is the established mixed local review workspace, not a full-main checkout or green CI claim.

**Delivery:** `ENTROPY_WARS_CLOCK_RECONNECT_COMPLETE.zip` contains complete `battle.js` and `online.js` for R2; complete `server.js` and cache-busted `index.html` for Render; five updated/new test files and this tracker for the repository; upload instructions, validation logs and SHA-256 manifests. Shared entry token: `20260910-recovery-ack-184200-cors`. Deploy the client/server pair together and start fresh rooms; old clients do not implement this protocol.

**Next implementation:** move to LIFE-06 / VFX-03/04 effect lifetime and visibility ownership. Do not repeat the clock, credential, deadline, rematch-consent or recovery protocol batches. Live reconnect acceptance remains a validation item requiring explicitly requested playtesting: both roles and both return orders, active turn and opening, guest refresh, host refresh failure, repeated outage, delayed packets, result recovery, rematch and teardown. Persistent host reconstruction is an architectural feature outside this completed recovery protocol, not a claimed fix.

### Latest continuation — 2026-09-10: LIFE-09 rematch consent and absent-seat protection

**LIFE-09 — High: a winner-free host snapshot could reopen a finished match without the opponent's consent or presence. Implemented and locally validated; deployment unverified.** This closes the specific absent-opponent rematch boundary left open by LIFE-08. LIFE-05 snapshot acknowledgement remains unfinished.

- **Reproduction:** disconnect the guest, sync a host victory (which correctly retires disconnect deadlines), then send a winner-free snapshot. The old server clears result bookkeeping and accepts a new match with the opponent still absent. Independently, rematch relays trusted the client-supplied `from` player field.
- **Fix:** `server.js` records rematch requests by the sending socket's actual seat, pins the forwarded player identity, and accepts requests only after a result with both seats connected. A rematch snapshot requires consent from both current sockets and verifies that both still exist in Socket.IO's live socket registry. Consent is consumed on restart and retired on disconnect. Rejected snapshots leave the result, last mirrored state and replay segment intact. Result heartbeats preserve pending legitimate consent.
- **Compatibility:** refreshed main `online.js` emits each player's request before its rematch snapshot, using Socket.IO's existing ordered stream. Both request orders pass the production-handler controls. No browser script or payload shape changes are required. Server enforcement does not restore an absent player's result screen or provide a new client failure message.
- **Baseline:** main `server.js` blob `4cf8c66d3e443c692ca903d8082d20eb18cba14d`; `online.js` blob `8d0fec1469f1ae607d8e2113382b6fd12681078f`; tracker blob `6d6187d4f2c1ebdb1cc318ae3f168835976f8489`; `CLAUDE.md` blob `198bced37ea71101b6bb4ebe55a0eae1e0f31c6b`, read 2026-09-10. Server matches the previous working copy except trailing whitespace before this edit. These are per-file main reads, not a full pinned checkout. LIFE-08 is present in the inspected main server; live deployment remains unverified.
- **Validation:** 13 new production-handler tests pass; **11 fail against the fetched unmodified server, with two controls passing**. The earlier deadline test that explicitly allowed an absent-seat restart now asserts rejection while still verifying stale callbacks cannot settle again. Full local suite: **306 total, 302 passed, 2 failed, 2 existing skips**. Syntax: **74/74 clean**. The two failures remain the Phase 6 starter assertion and lunar-lander ceiling check. No unrelated assertions were weakened. The package's exact test script ran with bundled Node because npm is unavailable. This mixed local workspace is not full-main CI. No browser playtest, live network acceptance, dependency-requiring server boot, push or deployment was run.
- **Delivery:** `ENTROPY_WARS_REMATCH_CONSENT_FIXES.zip` contains complete `server.js` (Render and repository), `rematch-consent.test.js`, updated `rejoin-deadlines.test.js`, and this tracker (repository only), plus validation logs and upload instructions. No R2 change or entry-page cache bump is needed for this server-only batch.
- **Still open:** LIFE-05 acknowledged current-match snapshots, server-issued match/recovery generations, stale-session rejection beyond these consent records, bounded recovery retries, host-page restoration, battle-clock remaining-duration transfer, and full engine suspension. A delayed old semantic request after a later result still requires explicit match generations to distinguish it. Result delivery to an absent client remains open.

**Exact next task:** implement LIFE-05 acknowledged current-generation snapshot recovery on LIFE-07/08 seat/deadline ownership and LIFE-09 rematch consent. Keep first-return waiting; gate all-return release on successful snapshot application, transfer remaining battle-clock duration, and cover bounded recovery failure plus result/rematch cancellation. Do not redo the completed prerequisite fixes.

### Previous continuation — 2026-09-10: LIFE-08 disconnect deadline ownership

**LIFE-08 — High: overlapping disconnects orphan deadline callbacks, allowing a stale forfeit after recovery, a result, or room-code reuse. Implemented and locally validated; deployment unverified.** This is the simultaneous-disconnect and match-end cancellation prerequisite identified in LIFE-05's next task. It does not complete acknowledged state recovery.

- **Server fix:** each absent seat now owns a separate 90-second deadline under the existing room lifecycle. Rejoin selects the pending seat by its private credential, rejects expired deadlines even before their callback runs, and cancels only that seat's timer. A callback validates the exact room object, pending collection, seat record and socket before settlement. Results, room closure and rematch reset retire pending deadlines. If both players remain absent, the first expiring deadline settles once under the existing disconnect-forfeit rule; its sibling cannot settle a second time. Duplicate disconnect notifications cannot create or extend a deadline. Malformed room codes and non-callable callbacks no longer throw in rejoin.
- **Both-player behavior:** the first returning player receives `waitingForOpponent` and the other seat's remaining grace duration, measured on the server. Existing `online.js` keeps the waiting banner and reconnect shot-clock pause active for that response. The room-wide `player-rejoined` notification, which triggers the existing host snapshot resend, is emitted only when both seats have returned. The duration here is reconnect grace, **not** recovered battle-clock time. Credentials remain seat-specific and private.
- **Additional result fix:** winning state sets match-ended bookkeeping and retires deadlines even when replay recording is disabled. Previously friendly-room result bookkeeping depended on a replay object, allowing a late disconnect forfeit to follow a completed match. Ranked result processing also cancels deadlines before persistence work.
- **Baseline:** refreshed `server.js`, `online.js`, `index.html`, `CLAUDE.md` and this tracker from GitHub main on 2026-09-10. The relevant runtime files match the previous local delivery (apart from snapshot trailing whitespace), confirming LIFE-07 is in repository main; live deployment is still unverified. Baseline hashes are in the package's `BASELINE_SHA256SUMS.txt`. These are per-file reads, not a pinned full-main checkout. Newer character-creator instructions were inspected; no creator files are changed.
- **Validation:** 16 new production-handler/client-callback checks pass; **13 fail against the refreshed unmodified files and three control cases pass**. The eight credential-ownership checks also pass; their fixtures now use per-seat pending records and real future deadlines. Full local package test command: **293 total, 289 passed, 2 failed, 2 existing skips**. Syntax: **73/73 clean**. The two failures remain the previously recorded Phase 6 starter assertion and lunar-lander ceiling check; neither affected source nor assertion was changed. The npm launcher is unavailable, so its exact package test script (`node --test *.test.js`) ran with bundled Node. This is the mixed local review workspace, not full-main CI. No browser/device/network acceptance, dependency-requiring server boot, push or deployment was run.
- **Delivery:** complete `online.js` to R2; complete `server.js` and `index.html` to Render and repository. Shared entry token: `20260910-142500-rejoin-deadlines-cors`. Both test files and this tracker are repository-only. Package: `ENTROPY_WARS_REJOIN_DEADLINE_FIXES.zip`, with full files, upload instructions, validation logs and hashes. Upload the client script before activating the new Render files and use newly created rooms after deployment. In-memory rooms do not survive a server restart.
- **Still open:** LIFE-05 snapshot acknowledgement, server-issued recovery/match generations, stale session rejection, bounded recovery retries and visible failure, host-page-reload restoration, battle-clock remaining-duration transfer, and full engine suspension. The existing single-seat/all-return connectivity path still releases its shot-clock pause before snapshot application is acknowledged. Rejecting obsolete deadline callbacks does not establish a general match generation. A rematch begun while the other player is absent and result delivery to a disconnected client still need protocol-level handling. LIFE-04 and the remaining UX-01 overlays also stay open.

**Exact next task:** build LIFE-05's acknowledged current-match snapshot recovery on these per-seat deadline and LIFE-07 credential boundaries. Retain the first-return waiting behavior; do not restart credential or deadline fixes. Gate all-return suspension release on successful current-generation snapshot application, transfer battle-clock remaining duration without host timestamps, and cover result/rematch cancellation and bounded failure.

### Previous continuation — 2026-09-10: LIFE-07 reconnect seat ownership

**LIFE-07 — High: a shared reconnect credential lets either opponent claim the disconnected seat. Implemented and locally validated; deployment unverified.** The refreshed server issued one credential to both seats in friendly and ranked rooms. `rejoin-room` checked that shared value, then assigned the requester to `room._disconnected.role`, without checking credential ownership or whether the socket already occupied a room. A guest with a fresh socket could claim a disconnected host's authoritative seat; an existing opponent socket could occupy both seats. Production-handler regression checks reproduce both paths without contacting the live game.

This prerequisite changes the immediate LIFE-05 ordering: recovery acknowledgements must be bound to trustworthy seat identities. This delivery fixes that boundary before adding a recovery protocol. It does not implement state-application acknowledgement.

- **Change:** existing `server.js` creates independent host and guest credentials for both friendly and ranked rooms. The unchanged `room-full` payload is sent separately to each socket with only that seat's credential. Friendly create/join callbacks return the corresponding credential. Rejoin validates the pending seat's credential and rejects sockets already occupying any room before clearing the deadline or changing membership. Legitimate returning roles and callback/event shapes are preserved.
- **Client compatibility:** inspected current `online.js` create/join callbacks and `room-full` handling; they already accept and persist one `rejoinToken` per client. No browser script, cache token, gameplay state, or presentation relay changes are required.
- **Baseline:** current main per-file reads on 2026-09-10: server `3135ef718ca609178b8a56d443d267826d5e0e2b`, online `8ff35ea57992cc3640866c8027ceb71ec529df80`, battle `40cc64e74ccad11f747ad9bf60961d13626b28d2`, entry `11a6524c19c45b5289e661ea5ab0b009d1056152`, tracker `e1afc241849e7c37a969c7e323cf8a5df20cc419`, CLAUDE `198bced37ea71101b6bb4ebe55a0eae1e0f31c6b`. The refreshed main online/battle files contain the previous reconnect-clock implementation; this confirms repository presence, not live deployment. The complete delivered server preserves main's newer unrelated changes.
- **Validation:** eight new production-boundary checks pass; five fail against the fetched pre-fix server, with three legitimate/invalid-token controls passing. Covers credential isolation in friendly and ranked matchmaking, each legitimate returning seat, opponent credentials from fresh sockets, an already seated socket, repeated rejoin and malformed credentials. Full local suite: **277 total, 273 passed, 2 failed, 2 existing skips**. JavaScript syntax: **72/72 clean**. The initial full run found older local data missing main's gangster starter; refreshed unedited `data.js` from blob `36f583c398a2b45792f02c14ddab6bd5e7d36c0a` before the final run. Two full-suite failures remain: the local Phase 6 starter assertion and the lunar-lander ceiling check. Both also fail with the fetched unmodified server (79 passed, 2 failed in the two affected test files), so they are not caused by this reconnect edit. No assertion was weakened. This remains a mixed local review workspace with refreshed relevant files, not full-main CI. Browser/network acceptance and dependency-requiring server boot were not run; the other skip requires animation GLBs.
- **Delivery:** complete `server.js` goes to Render and the repository. `rejoin-ownership.test.js` and this tracker are repository-only; instructions and validation logs are reference material. Package `ENTROPY_WARS_REJOIN_OWNERSHIP_FIXES.zip`. No R2 upload or entry-page change. No commit, push or deployment. Rooms are in process memory; deployment does not preserve active rooms or repair an already hijacked room. Validate with newly created rooms after deployment.
- **Remaining:** LIFE-05 stays open: acknowledged current-match snapshot application, stale recovery/session rejection, bounded retry/failure, and remaining-time transfer independent of client wall clocks. Seat-specific credentials do not supply match generations or full engine suspension. The existing single pending-disconnect record, host-page-reload recovery, forfeit/rematch races, LIFE-04 boot cancellation and separate UX-01 overlays remain unresolved.

**Exact next task:** implement LIFE-05 acknowledged recovery on this seat-ownership baseline. Bind a server-issued recovery generation to the current room/match and current sockets; acknowledge only after successful guest state application; reject stale generations; bound retries and leave failure visibly suspended. Transfer remaining duration rather than host timestamps. Review simultaneous disconnects and match-end/rematch cancellation before releasing reconnect suspension.

### Previous delivery — 2026-09-10: LIFE-05 persistent clock suspension and rejoin resend

Implemented a bounded first reconnect batch in existing `battle.js` and `online.js`.

- **Clock ownership:** reconnect suspension persists before activation and across stopped/replaced turn clocks. Reconnect and the existing sky-cinematic caller own separate pause reasons; releasing one cannot release the other. Resume preserves the paused span and ignores duplicate releases. Fresh-match initialization retires the previous cinematic reason while retaining an outstanding reconnect reason. Expiration rejects paused/inactive clocks.
- **Guest boundary:** immediately after `_deserializeInto`, the client reapplies its local pause reasons to the replacement clock before rendering. Pause ownership lives outside serialized game state; no new authoritative action, state field, or presentation relay is introduced.
- **Rejoin resend:** after the server's `player-rejoined` event, whichever client is the host invalidates snapshot deduplication and invokes the existing full-state sender. This covers either returning role and unchanged host turns, retaining the sender's existing trailing throttle flush. The guest does not broadcast authoritative state.
- **Additional source finding:** the existing sky cinematic used the same unowned pause/resume API as reconnect. Its completion could release reconnect suspension, and refreshing/hiding the banner could release cinematic suspension. Separate reasons correct both paths. The pause helper suspends the shot clock only; it does not stop in-flight actions or the simulation.
- **Baseline:** refreshed relevant GitHub main files on 2026-09-10. Verified fetched blobs: battle `1caa1cf7b9272087be7d476f889795332710e280`, online `15e9eb947f5b8f6b736bb08c4d62038b2c938974`, entry `b6bf8eaa5f3cfa0a6bc3b25c3a835d10b78cf12b`, shared instructions `198bced37ea71101b6bb4ebe55a0eae1e0f31c6b`, tracker `673ccb7025f04cac0df2de83e769a117596e2768`. Also inspected current server rejoin ordering. Preserved main's newer after-shot projectile effects in the complete battle file. These are per-file main reads, not a claim of a single pinned checkout.
- **Validation:** package test command (`node --test *.test.js`) with bundled Node: **269 total, 267 passed, 0 failed, 2 existing skips**. Syntax **71/71 clean**. **12 new production-boundary regression tests pass; 10 fail against the fetched pre-fix files**, with two unchanged controls passing. Tests cover both local player numbers, deferred activation, overlapping pause owners, clock replacement, incoming snapshot application, stale expiration, duplicate resume, teardown, banner refresh, zero timestamps and rejoin role routing. The full suite uses the existing local review workspace with refreshed edited files; it is not a freshly fetched full-main CI run.
- **Delivery:** complete `battle.js` and `online.js` to R2; complete `index.html` to Render, shared token `20260910-135500-reconnect-clock-cors`. `reconnect-clock.test.js`, this tracker, upload instructions and validation logs are repository-only. Package: `ENTROPY_WARS_RECONNECT_CLOCK_FIXES.zip`. Local delivery only; no push or deployment.
- **Still open:** LIFE-05 is not closed. Successful connectivity still hides the banner before the guest acknowledges applying a current-match snapshot. This batch forces a resend but does not add recovery acknowledgement, match/session generation validation, retry policy, host-page-reload restoration, or cross-client clock-skew correction. It does not establish full-engine suspension. Browser/network/device acceptance, forfeit/rematch races and intro timeout integration remain pending.

Exact next task: implement a current-match recovery acknowledgement between host and guest, with stale-session rejection and bounded retry/failure behavior, then release reconnect suspension only after successful state application. Define remaining-time transfer without assuming equal client wall clocks. Preserve the host as authority and inspect room/relay validation before introducing protocol fields. Keep LIFE-04 boot cancellation and separate UX-01 overlays open.

### Previous delivery — 2026-09-10: UX-01 game-dialog focus

Completed the unfinished local game-dialog focus implementation in existing `ui.js` and corrected two additional defects: loss of the original Settings control after a background redraw, and inclusion of aria-hidden controls in keyboard navigation.

- **Behavior:** `state.uiDialog` owns keyboard focus while open. Tab wraps in both directions; Escape invokes the existing cancel action once, except required job selection remains open. Native Enter/Space activation remains available. Redraw retains the selected control; replacing a dialog preserves the original launcher. Close removes the focus guard and restores a usable launcher, an equivalent pause/Settings control after redraw, or avoids restoring a hidden/inactive destination.
- **Baseline:** fetched GitHub main versions of `ui.js`, `index.html`, `map.js` and this tracker on 2026-09-10. Main UI matches the working source outside the unfinished dialog block and terminal whitespace. Main entry differs only by cache token; the delivered entry is based on the fetched main file. This tracker matches main apart from terminal whitespace. No claim that the local dialog implementation was already uploaded.
- **Validation:** full package test command (`node --test *.test.js`) using bundled Node: **257 total, 255 passed, 0 failed, 2 existing skips**. Eight production-function dialog checks pass. The two new defect checks fail against the unfinished pre-continuation implementation and pass after the fixes. JavaScript syntax: **70/70 clean**. Controlled DOM tests validate focus/control flow; browser, keyboard-device and controller acceptance remain pending.
- **Delivery:** complete `ui.js` to R2; complete `index.html` to Render with shared token `20260910-133100-dialog-focus-cors`. `dialog-focus.test.js`, this tracker, validation output and upload manifest are repository-only. Package: `ENTROPY_WARS_DIALOG_FOCUS_FIXES.zip`. Not deployed.
- **Online/scope:** focus is local to each viewer; no new gameplay state, authoritative actions or relayed events. This batch covers `state.uiDialog`, including a dialog over pause or Settings. Separate `ewConfirm` / `ewSaveLoadModal` overlays still need input-owner review. UX-01 and Phase 3 remain open.

Next implementation task: LIFE-05 reconnect/state/clock recovery. Remaining UX-01 work: separate banner/save-load overlays and actual keyboard/controller acceptance.

### Previous delivery — 2026-09-10: AI navigation and beam planning

Implemented AI-02, AI-03 and the center-ray planning defect in AI-05 in the existing `ai.js`. This batch advances the concrete AI backlog ahead of nested-dialog focus/reconnect work because these source-confirmed defects have independent, deterministic acceptance cases. Those earlier tasks remain open.

- **AI-02:** `advance_to_mid` reads `bw()`/`bh()`, matching other goals. Verified on 8×8 and 20×20 boards from both seats, including stale legacy dimension fields.
- **AI-03:** removed cross-decision waypoint caching. Each macro movement decision reads current terrain, heights, walls and traversal abilities; success, failure and clear-corridor results cannot leak across actions or matches. Also fixed the corridor shortcut to detect edge walls before skipping A*, respecting phasing.
- **AI-05:** joint movement planning, line scoring and line target selection share `_lineRayTilesAI`. Prospective beam value requires an aligned, reachable ray from the destination at its standing height. Diagonal rays use beam steps, preserving full diagonal range; terrain and LOS stop the ray unless the existing spell flags permit passage. Ordinary damage spells keep their existing targeting behavior.
- **Version/delivery:** `EW_AI_VERSION` is `v4.2-2026-09-10-navigation`; shared entry token is `20260910-062900-ai-navigation-cors`. Complete `ai.js` goes to R2; complete `index.html` goes to Render. Tests, this tracker and `AI_REDESIGN.md` are repository-only.
- **Baseline:** verified main `fef179a6fde229d4f115512fcf13131879d688b6`. Git blob hashes match for `index.html`, `battle.js`, `CLAUDE.md` and this tracker; `ai.js` and `AI_REDESIGN.md` match after ignoring the working copy's extra terminal newline. The prior PAUSE-08 runtime delivery is present in that repository baseline; live deployment remains unverified.
- **Validation:** executed the package's full test command (`node --test *.test.js`) with bundled Node: **249 total, 247 passed, 0 failed, 2 existing skips**. All **15** production-function regression tests pass; **14 fail on the pre-fix AI**, with the unchanged ordinary-spell/visibility control passing. Repository syntax check: **69/69 clean**. Tests replace damage-value dependencies to isolate navigation/geometry; they do not simulate a match or measure tactical strength.
- **Online:** no actions, state fields or visible events were added. The host's existing AI execution and state/action relays remain responsible for guest results; Simul's shared planner consumes the same fixes. Both-viewer runtime acceptance is pending.
- **Limits:** no browser playtest, simulation, performance measurement or deployment. Removing the round cache trades repeated A* work for fresh answers; profile before reintroducing any cache. Beam scoring remains centered on the aimed spine; wide-beam side-lane valuation and destructive-breach prediction are separate existing limitations, not solved here. Other spell kinds' joint legality, AI-04 and AI-06 remain open.

Next implementation task: nested-dialog return focus (UX-01), followed by LIFE-05 reconnect/state/clock recovery. Next AI task: inventory actual generic-fallback kinds (AI-04) and share wide-beam/directional target contracts without changing balance weights speculatively.

## Objective

Review the game as a skeptical player and maintainer, then improve the weakest systems in manageable phases. Cover all eight requested categories. Preserve the existing art style, game identity, authored DOOR canon, and host/guest behavior.

Each phase must leave behind evidence, prioritized findings, a bounded improvement batch, and an updated version of this plan. A proposed fix, a locally validated fix, a delivered file, and a verified live fix are separate states.

## Current status

- [x] Phase 0 — establish scope, inspect project instructions, and identify initial risks.
- [ ] Phase 1 — first batch implemented locally: battle label retirement and HQ loading-card ownership pass regression tests; broader lifecycle work and runtime acceptance pending.
- [ ] Phase 2 — static triage and capture protocol documented; performance baseline and optimizations pending.
- [ ] Phase 3 — Tab/controller routing fixes are in repository main; battle/editor pause focus is now implemented locally and regression-tested. Main-menu/HQ Settings keyboard focus is in repository main. Controller page visibility/root selection (PAUSE-06) is in repository main. PAUSE-07 board movement/held-key isolation is in repository main and regression-tested; PAUSE-08 free-roam/shooter input handoff is implemented locally and regression-tested; broader input ownership, shared menu, and runtime acceptance remain pending.
- [ ] Phase 4 — camera source review, framing gaps, and shot acceptance matrix documented; visual verification pending.
- [ ] Phase 5 — timing/relay/lifetime review and representative spell matrix documented; implementation and captures pending.
- [ ] Phase 6 — AI-02/03 and AI-05 center-ray planning fixes implemented and regression-tested; broader spell legality, AI-04/06 and observed CPU play pending.
- [ ] Phase 7 — generated map inventory, shared environment constraints, and scoped asset brief documented; visual ranking pending.
- [ ] Phase 8 — integrated journey review, implementation backlog, and validation gates documented; end-to-end acceptance pending.

Phase 0 is a scoped reconnaissance pass, not a completed game audit. Four existing runtime files have now been edited locally. No browser playtest, FPS capture, simulation, or visual comparison has run.

### Local implementation and delivery — 2026-09-09

The source review covers all eight requested areas. This continuation also implements the first scene-handoff batch and the two confirmed input-routing fixes. These are local, tested changes against the continuation baseline above; reported live symptoms are not marked resolved. All source line references in the findings remain references to the baseline, before these edits.

| Finding | Implemented behavior | Validation and limit |
| --- | --- | --- |
| LIFE-02 | `three-renderer.js` calls the existing `_clearPlates()` at deactivation, before HQ can reveal the shared label layer. Only registered battle unit plates are removed; the existing health/mana animation history is preserved. Battle activation already rebuilds units/plates. | Executes production deactivation twice with registered and unrelated labels; verifies cleanup, idempotence, and preserved history. Actual CSS2D/WebGL battle → HQ → battle acceptance remains pending. |
| LOAD-01 | `map.js` assigns an entry generation to the loading card, cancels both timer handles on entry/leave/failure, and rejects stale readiness/fade/hide callbacks. Repeated readiness schedules one fade. A thrown renderer entry falls back to the main menu, as a false return already did. Existing normal/walking timing is preserved. | Exercises rapid replacement, stale ready, canceled callbacks arriving late, leave, duplicate readiness, false/throw failure, and normal/walking delays with controlled timers. Required texture readiness remains LOAD-02. |
| PAUSE-04 | `ui.js` leaves Tab to normal focus navigation while the pause menu or a dialog owns input, instead of cycling a spell/attack target beneath it. It does not clear the pending target. | Executes the production key handler for both targeting modes under pause/dialog and checks cycling resumes after closing. Full focus trapping/restoration remains UX-01. |
| PAUSE-05 | `state.js` checks visible settings before the broad title/HQ flag when selecting controller context. Rebinding, pause, and dialog precedence is preserved. | Executes the production context selector with visible/hidden settings and overlapping higher-priority contexts. Actual controller Confirm/Back and slider acceptance remains pending. |

Full suite: **208 tests, 206 passed, 0 failed, 2 skipped**, including all eight new tests in `scene-lifecycle.test.js` and the repository-wide JavaScript syntax check. Executed the exact `package.json` test command (`node --test *.test.js`) with bundled Node v24.19.0; npm itself was unavailable. Skips: animation-library GLBs absent; server smoke-test dependencies absent. The first full run exposed missing Electron reference files in the downloaded workspace; those were fetched unchanged from the same pinned commit, then the suite passed. No existing assertion was weakened and no server/gameplay simulation was started.

Upload the complete `map.js`, `three-renderer.js`, `state.js`, and `ui.js` files to **R2**. The complete `index.html` goes to **Render**, with shared token `20260910-033727-review-cors`. Sync those files plus `scene-lifecycle.test.js`, this plan, `DOOR_MASTER.md`, and `DOOR_HQ_BUILD_PLAN.md` to the repository. Tests and Markdown are repository-only. No assets or embedded asset URLs changed. The accompanying ZIP preserves original root filenames and includes an upload manifest with checksums.

Next: continue the broader UX-01 input-owner audit; PAUSE-06 controller active-page detection/root selection is locally implemented below; the battle/editor pause-focus portion is implemented in the continuation below. Then address reconnect suspension and effect lifetime/visibility as separate reviewed changes. Do not expand the shared pause design before defining its online/offline suspension contract. Keep visual/FPS acceptance pending until authorized testing supplies evidence.

### UX-01 continuation — battle/editor pause focus (2026-09-09 America/Chicago)

Baseline: repository main `41f8e76b67120eea58c17fd968c5c72d70ef035e`. Verified `ui.js`, `index.html`, and this plan against GitHub blob hashes before editing; current `CLAUDE.md` content also matches the local reference. This confirms repository upload of the previous delivery, not deployment to R2/Render.

Implemented locally in existing `ui.js`:

- The pause overlay is a labeled dialog and receives focus on opening. Tab/Shift+Tab wrap over visible enabled controls; an empty menu falls back to the overlay. Focus leaving the menu is redirected while it owns input.
- Settings redraw records the focused control before replacing the markup and restores its equivalent afterward, with an ordinal fallback for dynamic handlers. Changing tabs focuses the selected tab header.
- Menu key events retain native control behavior while stopping propagation to document-level battle shortcuts. Escape closes the menu once. Existing window capture for key rebinding runs first; a nested `state.uiDialog` retains priority.
- Resume restores the connected, visible, enabled prior control once, without changing the pending aiming state. A removed/hidden launcher is not focused. An opening animation callback cannot reactivate an already closed menu.

Validation: **212 tests total, 210 passed, 0 failed, 2 skipped**. Ran the exact package test command with bundled Node v24.19.0 because npm is unavailable. Includes four additional production-function tests for focus boundaries, redraw/tab focus, repeated opening/closing, late animation callbacks, nested-dialog priority, and removed launchers. Repository-wide JavaScript syntax checks passed. Tests use controlled DOM boundaries; no browser playtest, simulation, FPS capture, real controller exercise, or host/guest runtime acceptance ran.

Scope limit: this completes the battle/editor pause-focus slice, not all of UX-01. Main-menu/HQ settings use a separate renderer and still need focus lifecycle work. Window-level capture handlers, held-key release, mouse/pointer-lock ownership, nested-dialog return focus, and controller acceptance remain in the broader input-owner audit. No state-sync fields or relay events were introduced: each player's menu focus stays local. Existing cinematic cancellation and suspension semantics are unchanged and remain separate findings.

Complete-file delivery: `ui.js` → R2; `index.html` → Render (fresh shared token `20260910-040923-focus-cors`); `scene-lifecycle.test.js` and this plan → repository only. Sync the two runtime files to the repository as well. Earlier lifecycle fixes are preserved. No assets changed. This continuation has not been uploaded, committed, pushed, or deployed.

### UX-01 continuation — main-menu/HQ Settings keyboard focus (2026-09-09 America/Chicago)

Baseline: repository main `e92ee26153b65c2047963544c56310ea838220bb`. Verified the local `map.js`, `ui.js`, `index.html`, regression tests, review plan and both HQ logs against the commit tree's blob hashes. Fetched current `CLAUDE.md` and compared its content with the local reference (equal). The previous pause-focus delivery is uploaded to the repository; live deployment remains unverified.

Implemented locally in existing `map.js`:

- Settings receives focus after its page becomes active. Tab/Shift+Tab wrap over enabled visible controls, including Back; empty content falls back to the labeled Settings dialog. Menu key events keep native control behavior while stopping document-level shortcut bubbling. Escape invokes Back once.
- Both direct settings redraws and refresh handlers that reopen Settings restore the equivalent control. Reopening does not overwrite the original launcher.
- Back releases the focus guard before the existing HQ-or-menu route runs. It restores an eligible launcher, or an eligible control on the destination page. Inactive title pages are explicitly excluded: their zero-opacity CSS still leaves layout rectangles, so geometry alone is insufficient.
- Leaving for another title page releases the guard. The Spell Library detour preserves the original return destination and reacquires Settings focus on return. Nested `state.uiDialog` retains priority.

Validation: **217 tests total, 215 passed, 0 failed, 2 skipped** using the exact package test command with bundled Node v24.19.0 (npm unavailable). Five added tests execute production Settings functions with controlled DOM boundaries: Tab/native keys, direct redraw/reopening, repeated Back, nested dialog/library/page exits, removed launcher fallback, and opacity-hidden page eligibility. The full suite includes repository-wide JavaScript syntax checks. Skips remain missing animation GLBs and server smoke-test dependencies. No browser playtest, simulation, real controller, FPS capture, or host/guest runtime acceptance ran.

Scope: this completes the local keyboard-focus implementation for the separate Settings shell, including its existing HQ entry route. It does not close UX-01 or Phase 3. HQ suspension/resume behavior, pointer lock, scene content and canon are unchanged. Focus variables remain local outside serialized match state, so neither seat sends focus changes to the other. Window capture, held-key release, nested-dialog return focus and real controller acceptance remain pending.

**PAUSE-06 — controller Settings visibility/root mismatch (High confidence; source-confirmed, implementation pending).** At this baseline, `state.js:6287` `_mmSettingsOpen()` checks the body's geometry and `offsetParent`, while `styles-base.css:2393–2417` hides inactive title pages with opacity and pointer-events. After Settings has content, an inactive page can still satisfy those controller checks. `_domNavRoot()` at `state.js:6311` likewise chooses the body without requiring the Settings page to be active and excludes the sibling Back button. This means the earlier PAUSE-05 precedence fix is necessary but insufficient. Next batch: require an active, exposed Settings page in both controller checks, return the full page as the navigation root, preserve rebind/pause/dialog priority, and execute regression cases with nonzero inactive geometry plus Back-button inclusion. Real controller acceptance remains separate.

Complete-file delivery: `map.js` → R2; `index.html` → Render (shared token `20260910-042512-settings-cors`); `scene-lifecycle.test.js`, this plan, `DOOR_MASTER.md` and `DOOR_HQ_BUILD_PLAN.md` → repository only. Sync the runtime files to the repository too. Earlier runtime fixes are preserved. No assets changed. This batch has not been uploaded, committed, pushed or deployed.

### PAUSE-06 continuation — controller Settings ownership (2026-09-09 America/Chicago)

Baseline: repository main `f546e7fff61edb012e3fae536aee995996257c4f`. Verified `AGENTS.md`, `state.js`, `map.js`, `styles-base.css`, `index.html`, regression tests and this plan against the pinned GitHub tree's blob hashes. Refreshed current `CLAUDE.md`; its only difference from the local reference was a trailing blank line. The prior Settings keyboard-focus delivery is uploaded to the repository; R2/Render deployment remains unverified.

Implemented locally in existing `state.js`:

- Settings owns controller input only while its full page is active, has nonzero layout, and is exposed (not visibility-hidden, inert or aria-hidden). An inactive page cannot claim input merely because its content retains layout boxes during a CSS fade.
- The controller navigation root is the full Settings page, including the sibling Back button. Existing rebind, pause and dialog priority is preserved.
- Generic navigation excludes inactive title-page controls and hidden/inert controls, including when falling back to the document body. Confirm first moves focus into the eligible controls if focus is stale or outside the current root; slider/select adjustment rejects such stale focus.

Validation: **220 tests total, 218 passed, 0 failed, 2 skipped**. Executed the package test command (`node --test *.test.js`) with bundled Node v24.19.0. Three new controlled-DOM regression tests execute the production controller functions: inactive pages with nonzero geometry, hidden/missing roots, Back inclusion, forward/reverse wrapping, owner precedence, stale Confirm/slider actions, and valid slider events. Repository-wide JavaScript syntax checks passed. Skips remain unavailable animation GLBs and server smoke-test dependencies. No browser playtest, simulation, actual controller exercise or host/guest runtime acceptance ran.

Scope: PAUSE-06 is locally implemented and regression-tested, not verified live. Both seats use the same local controller functions; no serialized match fields, host actions or relay events changed. This batch changes generic controller routing only; HQ scene, suspension, pointer lock and canon are unchanged. UX-01 and Phase 3 remain open. Next: trace held-key release, window-capture shortcuts, pointer ownership and nested-dialog return focus, then address reconnect/effect boundaries separately.

Complete-file delivery: `state.js` → R2; `index.html` → Render (shared token `20260910-045746-controller-cors`); `scene-lifecycle.test.js` and this plan → repository only. Sync the runtime files to the repository too. Earlier fixes are preserved. No assets changed. No commit, push, upload or deployment performed.

### PAUSE-07 continuation — board movement and held-key ownership (2026-09-10 America/Chicago)

Baseline: repository main `88b3bc65adc93fc8ed2e84c28c112b0c81565b3f`. Verified `AGENTS.md`, `CLAUDE.md`, `ui.js`, `index.html`, regression tests and this plan against pinned GitHub tree blob hashes. This confirms the prior controller delivery is in the repository; live R2/Render deployment is unverified.

**PAUSE-07 — High, source-confirmed input boundary defect:** the independent capture listener in `ui.js` recorded dungeon movement keys under menus and editable fields. The later board movement/Enter handler lacked a pause check and ignored contenteditable elements. Existing pause bubbling containment protects ordinary focused menu events, but does not make that independent handler safe for document-dispatched events. A retained direction can contaminate a later diagonal. This is production-source evidence and controlled-handler reproduction, not an observed live symptom.

Implemented in existing `ui.js`: one board movement eligibility helper rejects pause, dialogs, title pages, nonbattle/won states and editable controls. Both held-key capture and the movement/Enter handler use it. Opening pause or rendering a dialog clears held directions immediately; blocked input, editable focus, page hiding and window blur also clear them. Key release remains unconditional. Horologe-owned arrows cannot become dungeon directions. Normal movement, diagonal combination, and pending aiming targets are preserved.

Validation: **224 tests total, 222 passed, 0 failed, 2 skipped**, using the exact package command `node --test *.test.js` with bundled Node v24.19.0. Four new tests execute production input boundaries, covering blocked movement/Enter, retained-target identity, normal diagonals, menu return, unconditional release, focus/visibility/blur clearing, drum arrow ownership and immediate menu-open clearing. Repository-wide JavaScript syntax checks passed. Skips remain missing animation-library GLBs and server smoke-test dependencies. No browser playtest, gameplay simulation, actual controller exercise or host/guest acceptance ran.

Both seats retain the same local input handlers; no authoritative actions, state-sync fields or relays were added. This fixes the board/dungeon held-key slice of UX-01. Free-roam/window-capture keys, pointer lock, nested-dialog focus return and real-device acceptance remain open. The free-roam capture handler in `three-renderer.js` (`_freeRoamStart`, `_frKeyDown`) is the next concrete trace: it records movement without a modal check; inspect its frame consumer and ShooterControls before changing that separate owner.

Complete-file delivery: `ui.js` → R2; `index.html` → Render (fresh shared token `20260910-052918-heldkeys-cors`); `scene-lifecycle.test.js` and this plan → repository only. Sync runtime files to the repository too. Earlier fixes are preserved; no assets changed. No commit, push, upload or deployment performed.

Exact next task: trace free-roam and ShooterControls capture/frame input through pause, dialog, key release and pointer-lock changes; implement the smallest confirmed ownership fix and validate it. Then nested-dialog focus return, followed by reconnect/effect boundaries. UX-01 and Phase 3 remain open.

### PAUSE-08 source trace — free-roam and shooter input (2026-09-10 America/Chicago)

Baseline: repository main `82494b38fa3dea84f89f32a8723602289fa51b3f`. GitHub's comparison with `88b3bc65adc93fc8ed2e84c28c112b0c81565b3f` identifies the PAUSE-07 upload, and the uploaded review contains its implementation record. Local `AGENTS.md`, `CLAUDE.md`, `battle.js`, `three-renderer.js`, `state.js` and `ui.js` match the pinned repository tree's Git blob hashes. PAUSE-07 is therefore present in repository main; R2/Render deployment remains unverified. References in this section use this refreshed baseline; older findings retain their original baseline references.

**PAUSE-08 — High, source-confirmed missing input ownership boundaries; runtime reproduction pending.** The PAUSE-07 board guard does not govern the separate window-capture listeners and continuous movement consumers below. A menu can own focus while those consumers still accept or retain gameplay input.

| Boundary | Verified source path | Consequence / evidence limit |
| --- | --- | --- |
| Guild Hub keyboard → walker | `three-renderer.js:19145` `_freeRoamStart` installs capture handlers. Keydown excludes text input and contenteditable, but not SELECT, pause or dialogs. `_freeRoamTick` at line 19220 consumes keys and `_frPad`, changes unit coordinates and invokes the tile callback without a modal gate; `_updateAnimations` at line 19376 calls it. | Focus containment alone cannot prevent movement capture. A held direction can continue feeding movement under a menu while this walker runs. This is the Mystery Dungeon Guild Hub/shared walker, not the separate D.O.O.R. HQ walker. |
| Shooter keyboard → menu control | `battle.js:16038` keydown rejects typing and `state.uiDialog`, but not `_gamePaused`. Movement, Space and Enter use `stopImmediatePropagation()` in window capture. `_battleActive` at line 15705 and `_owns` at line 15746 do not reject pause. | A focused menu button's Space/Enter can be consumed before its own handler. Enter reaches the end-turn request path; downstream execution is not claimed here. Native menu activation is already at risk at the capture boundary. |
| Stored movement → frame consumer | `battle.js:16349` `_roamFrameRT` and line 16411 `_roamFrame` stop for dialogs/cinematics and other busy states, but neither includes pause. `_frame` at line 16695 continues to invoke the roam path while `_owns()` remains true. | Clearing only the board-held set in `ui.js:6521` `openPauseMenu` does not clear shooter `heldDirs`, `padVec`, or renderer `_frPad`. Gate consumption as well as new events. |
| Controller handoff → retained vector | `state.js:6526` derives menu context and dispatches `_shooterPadFrame` only for menu/aim/free gameplay contexts. The shooter callback stores `padVec` or calls `hubFreeRoam.setPadInput`; no neutral handoff occurs in this branch when context changes to domnav/dialog. | Correct menu routing does not itself erase the last movement sample. Clear retained input at ownership loss; do not describe this as missing controller menu precedence. |
| Pointer lock → capture/held actions | `battle.js:15917` lock change clears directions and sprint when lock is lost, but not fire, ADS, pad vector or jump. Locked mousedown at line 15953 checks mode availability, then swallows the event and changes action flags. `openPauseMenu` neither releases this lock nor clears these channels. | Menu opening needs an explicit shooter-input handoff. Lock release alone is an incomplete reset. Mouse firing and stale-trigger gameplay outcomes still need controlled tests and runtime acceptance. |

Existing protections to preserve: shooter keyup clears movement without a typing/modal gate; blur clears directions, pad vector, fire, ADS and scoreboard. Dialogs already block shooter keydown and stop battle roam. Controller context already prioritizes menu navigation. The separate HQ walker has its own paused guards and stale-lock recovery; do not change it merely because it shares the canvas. Online simulation continuing behind a local menu is a separate policy from preventing that player's menu input from driving gameplay.

**Bounded implementation contract:** establish local input eligibility in the existing owners; block new keyboard/mouse/pad actions and frame consumption while pause/dialog/editable/hidden-document ownership applies. Reset all retained input channels at handoff, including movement, sprint, jump, fire, ADS, scoreboard and trigger-edge state. Keep releases unconditional. Release only a lock belonging to the shooter when opening its menu; preserve the HQ lock owner and use an intentional player gesture for reacquisition. Keep camera lifetime separate from action eligibility so an input fix does not reset framing or provisional movement. Preserve `parkAtUnit` and the turn-based movement commit rules. No new synchronized gameplay fields are required by this proposed local-input contract.

**Required acceptance checks before marking implemented/validated:**

1. Hold keyboard movement or a controller stick, open pause, release under the menu, resume: no movement from the old sample and no changed pending target. Cover Guild Hub, turn-based shooter and Strike separately.
2. With a menu button focused, Space and Enter activate that button once; arrows and Tab remain with menu navigation. Editable controls and rebinding retain priority.
3. Open a dialog while walking or holding jump/fire/ADS; dismiss it without fresh gameplay input. No retained jump, shot, ADS, scoreboard or movement resumes. Verify native release handlers still run.
4. Open pause while shooter pointer lock is held; operate the menu with the mouse, then reacquire deliberately. Verify the separate HQ lock is unaffected. Include blur, hidden tab, ownership loss, respawn and mode exit.
5. Execute production capture and frame functions with controlled event/frame boundaries, then run the full suite and syntax checks for a code delivery. Real keyboard/controller and both-seat acceptance remain separate; do not infer them from source-pattern tests.

Validation for this pass: pinned-source hash comparison and source/document content review only. No runtime files changed, tests run, browser playtest, simulation, upload or deployment. This complete document is repository-only and needs no R2 upload or cache-token change. PAUSE-08, UX-01 and Phase 3 remain open.

Exact next task: implement PAUSE-08's shared-walker and ShooterControls input handoff in the existing files with capture/frame regression checks; include the complete changed files and fresh entry token. Then trace nested-dialog return focus, followed by reconnect/effect boundaries.

### Review conclusions so far

The immediate work is ownership and input correctness: retire scene-owned labels/effects, keep loading callbacks tied to their entry, preserve reconnect suspension across clock starts, and prevent menus from sending input to the battle underneath. Camera improvements should then replace fixed body allowances with subject-aware framing. AI fixes should address incorrect navigation inputs and stale planning before changing difficulty weights. More scenery and bigger effects should follow measurement, not precede it.

Several suspected deficiencies are already addressed in source. Arena initializes the current Key threshold for AI. Standard TDM initialization removes Arena objectives. Dungeon results use the dedicated exit. Effects already have a shared ticker and bulk cleanup. The camera already accounts for FOV, aspect, terrain elevation, and airborne subjects in several paths. These protections are recorded below so implementation does not undo them.

This pass extends source review across all eight areas; it does not claim every function or spell was audited. Data enumeration through the repository's `load-data.js` found 501 entries in `SPELL_BY_ID` across 65 kinds, and 60 entries in `EW_MAP_META` (29 without `isDelta`, 31 with it). All metadata `near` keys had a matching named near-scenery builder in the inspected renderer. Enumeration ran locally; it did not run battle simulation or AI decisions. The counts describe those registries, not unique unlocked spells or proof of visual quality.

### Working rules

1. Read current source and relevant subsystem history before changes. Main may differ from the live R2/Render build or from files delivered in another task.
2. Start with a precise failure scenario; trace the actual code path before assigning a cause.
3. Distinguish user-reported symptoms, code-confirmed behavior, hypotheses, and runtime-verified defects.
4. Prioritize broken transitions and player control before visual polish. Establish performance measurements before adding visual cost.
5. Work inside the existing runtime files and script order. Documentation and repository-only diagnostics may be added when useful.
6. Check host and guest behavior, fog visibility, cancellation, repeated entry, and error paths for each relevant change.
7. For code deliveries, run the applicable syntax checks and npm test; run parity checks when economy/race constants change. Report unavailable checks honestly.
8. Deliver complete changed files. Every R2 change also requires the matching fresh index.html cache token, preserving its suffix. No automatic commit, push, or deployment.
9. Existing project instructions require explicit playtest authorization. Static review proceeds now; runtime acceptance items remain pending until actual testing is authorized and performed. Read PLAYTEST_NOTES.md before those runs; use the existing P1-versus-CPU harness.
10. Update this plan after every phase, including partial phases, and update subsystem logs when implementation touches them.

### PAUSE-08 implementation — shared walker and shooter handoff (2026-09-10)

Baseline: repository main `9dfcea9570fa49afe64e3d29d23f0ad87ccfcb7c`. Before editing, compared the local Git blob hashes for `AGENTS.md`, `CLAUDE.md`, `battle.js`, `three-renderer.js`, `ui.js`, `state.js` and `index.html` with GitHub's main tree; all matched. Previous delivered gameplay fixes are preserved. This batch is implemented and tested locally, not uploaded or verified live.

Complete changes in the existing runtime files:

- `three-renderer.js`: the shared Guild Hub/battle walker exposes one input-eligibility check for pause, dialogs, editable controls (including SELECT), hidden/unfocused documents and controller rebinding. Capture handlers, pad input, jump presses and the frame consumer use it. Clearing input retires keyboard and pad movement, sprint and pending jump presses without stopping the walker or writing its logical tile. Blur, visibility and editable focus clear retained samples immediately. Replacing a walker removes the previous listeners and pad sample. Existing `parkAtUnit` behavior is preserved.
- `battle.js`: ShooterControls separates action eligibility from camera ownership. Keyboard and pointer capture yield before preventing menu events; mouse-lock requests, pad dispatch, movement frames, firing and Strike's engine input bridge all respect the eligibility boundary. One reset clears movement, sprint, jump input, fire, ADS, scoreboard, trigger-edge state and the lock-acquisition click suppression. It runs on modal handoff, lock loss, blur, visibility loss, editable focus, controller disconnect, camera ownership loss and explicit respawn reentry. Menu opening releases only shooter-owned pointer lock; a late grant during the menu is released too. Deliberate board clicking still reacquires the lock. Pause takes priority over all other actions in the same controller sample.
- `ui.js`: both pause opening and dialog rendering immediately hand off shooter and walker input, alongside the existing board-held-key clear. The reset happens before the next frame or key event. Pending targeting state is untouched.
- `index.html`: all shared version URLs use `20260910-060125-shooter-input-cors`. No assets or embedded asset URLs changed.

Validation: **234 tests total; 232 passed, 0 failed, 2 skipped** using bundled Node v24.19.0 and the exact package test command, `node --test *.test.js` (npm is unavailable). The full suite includes repository-wide JavaScript syntax checking; edited runtime scripts also passed individual syntax checks. Ten new tests in `shooter-input.test.js` execute production listener/closure and movement-frame boundaries with controlled browser objects. They cover Guild Hub movement, both shooter modes, keyboard/mouse pass-through, pad/frame/engine rejection, immediate menu/dialog handoff, lock loss/late grants/HQ lock isolation, focus/blur/visibility/disconnect, fresh controller samples and simultaneous Pause+Fire. The existing dialog regression's fixture now supplies `window`; its assertions are unchanged. Skips remain absent animation GLBs and absent server dependencies.

Scope and evidence limits: local-input behavior applies to both seats through the same client handlers. No simulation rules, authoritative actions, synchronized fields or relay payloads changed. Online world/clock suspension policy is unchanged. Camera ownership remains independent of modal input so opening pause does not hand back the camera or invoke movement commit/rollback. Real browser, keyboard/controller, host/guest and visual acceptance have not run; this is not a claim that all UX-01 or Phase 3 acceptance criteria are complete. The separate D.O.O.R. HQ walker is unchanged.

Delivery: `ENTROPY_WARS_SHOOTER_INPUT_FIXES.zip` contains full root-named files. Upload `battle.js`, `three-renderer.js` and `ui.js` together to R2, and `index.html` to Render. Sync those plus both test files and this plan to the repository. The manifest and validation log are reference-only. No deployment was performed.

Exact next task: implement nested-dialog focus return in the existing UI shell with production-function regressions; then begin the LIFE-05 reconnect/current-state/clock batch by tracing server rejoin ordering. Keep browser/controller and both-seat acceptance pending until playtesting is requested. Do not repeat the PAUSE-08 source-only trace as the next delivery.


## Coverage and order

| Phase | Primary categories | Why here |
| --- | --- | --- |
| 1 | 2: transitions/loading; 8: reliability | A clean scene lifecycle is necessary for trustworthy performance and UI work. |
| 2 | 1: FPS; 8: developer experience | Measure costs before changing cameras, effects, and scenery. |
| 3 | 7: pause menu; 2: transitions | Build consistent input and pause behavior on the lifecycle work. |
| 4 | 3: cinematic action camera | Establish what must stay visible before expanding effects. |
| 5 | 5: spell VFX and animation | Coordinate animation, release, travel, impact, damage, and camera timing. |
| 6 | 6: Arena/TDM AI | Audit decisions against actual mode rules and visible information. |
| 7 | 4: maps/models/textures | Improve environments within the measured visual budget. |
| 8 | 8: overall UX/development; all categories | Check complete player journeys and cross-system regressions. |

## Phase 0 — reconnaissance completed

Reviewed the local project reference and delivery instructions; read targeted sections of current CLAUDE.md and source excerpts from state.js, map.js, ui.js, three-camera.js, and ai.js, plus package.json. Retrieved hud.js and the DOOR master/HQ plan for subsequent inspection; their full contents have not yet been audited.

The Phase 0 GitHub fetch could not return three-renderer.js because the file was too large or unsupported. Resolved during Phase 1: downloaded complete three-renderer.js and battle.js from the pinned commit. Relevant loading, label, minimap, and HQ lifecycle paths are now inspected; this is not a full renderer or voxel-performance audit.

### Initial findings

Line numbers below refer to the main files fetched for this pass and may change.

| ID | Evidence and status | Implication / next action |
| --- | --- | --- |
| LIFE-01 | Code-confirmed structure: state.js transitionTo at line 4824 changes flags and marks screenMode dirty; its shown switch has no HQ case. map.js _hqEnter at line 395 assigns GS.HQ directly. | Trace every scene owner and entry/exit path. This is fragmented lifecycle handling; it does not by itself prove the stale-HUD cause. |
| LOAD-01 | Code-confirmed risk: map.js _hqEnter onReady around lines 453–459 schedules nested timeouts that modify the shared hqLoad element. These callbacks contain no room/entry identity check. _hqLeave at line 572 shows no cancellation for these timeouts. | An older entry callback could dismiss a newer loading card. Check renderer callback guarantees and rapid room changes, then use cancellation/entry identity if confirmed. Not yet a confirmed explanation for black textures. |
| PAUSE-01 | Code-confirmed divergence: map.js HQ onEscape opens _hqOpenSettings after closing contextual panels; ui.js openPauseMenu at line 6471 creates the battle pause overlay, whose rendering special-cases the editor but not HQ. | Reuse one pause shell and shared settings, with context-specific actions and input handling. |
| PAUSE-02 | Code-confirmed behavior: ui.js openPauseMenu removes _cinematicEl and clears _activeCinematic; closePauseMenu at line 7505 hides the overlay and clears _gamePaused. | Trace outstanding cinematic callbacks, clocks, and camera ownership. Do not assume removing a cinematic element cancels or resumes its sequence safely. |
| CAM-01 | Code-confirmed structure: three-camera.js distinguishes tactical, subject-follow, cinematic, collision, and sky-gaze behavior. Its cinematic boom-collision bypass is explicit around line 317. | Review shot selection in battle.js together with camera projection and renderer bounds. A global camera-height tweak would be premature. |
| AI-01 | Code-confirmed structure: ai.js assessWinCondition at line 993 scores Keys, tower health, numbers, and respawn timing. It reads state.hourglassTarget with a fallback of 5. | Trace initialization and mode callers to confirm Arena uses the current required Key count and TDM does not inherit inappropriate objective incentives. No incorrect decision established yet. |
| VFX-01 | Current CLAUDE.md documents a shared UAL_SLOTS strikeAt/trim system and ThreeAnim timing consumers. Source consumers have not yet been audited. | Review the existing timing contract before introducing delays or replacing it. |

### User-reported issues to reproduce

| ID | Report | Priority | Runtime status |
| --- | --- | --- | --- |
| REP-01 | Black textures after loading ends. | High | Not reproduced in this review. |
| REP-02 | Old minimap remains when starting another match. | High | Not reproduced in this review. |
| REP-03 | Nameplates/health bars remain on screen in DOOR HQ. | High | Not reproduced in this review. |
| REP-04 | Cinematic shots miss casts, VFX, damage, or use awkward cuts. | High | Not reproduced in this review. |
| REP-05 | Tall units have lower halves cropped during cinematics. | High | Not reproduced in this review. |
| REP-06 | Frame rate needs improvement. | High | Hardware, scene, and frame-time baseline pending. |
| REP-07 | Pause menus differ across states and HQ lacks the desired common menu. | Medium | Separate code paths confirmed; presentation not visually reviewed. |

## Phase 1 — loading and scene lifecycle

### Review

- Map title → HQ → site → match selection → party builder → loading → battle → results → HQ → another match.
- Include Back, cancel, rematch, changed map/mode, failed asset fetch, delayed assets, disconnect, and repeated entry.
- Inventory ownership of the shared canvas, scene, minimap, nameplates, health bars, selection outlines, tooltips, VFX, audio, timers, listeners, and pointer lock.
- Trace resource readiness separately: fetch, decode, material binding, shader preparation, scene attachment, and a valid rendered frame. A fixed delay is not proof of readiness.
- Check late callbacks from old scenes, reused unit/map IDs, cached minimap canvases, stale DOM, and disposed-but-still-referenced GPU resources.
- Distinguish missing/failed textures from unready textures and lighting/material issues that merely appear black.
- Review online loading synchronization and what happens if only one player finishes or fails.

### Improvement batch

Fix demonstrated cleanup and readiness failures in existing files. Give asynchronous work a current scene/match identity and an explicit cancellation path where needed. Define required assets, intentional fallbacks, and recoverable errors so loading neither exits early nor hangs forever.

### Completion evidence

Transition ownership table; findings with source locations; complete changed files; targeted lifecycle checks and test results. Runtime gate: repeated match/HQ cycles leave no old minimap, labels, effects, or input owner; cold and warm loads reveal the correct scene or a clear recoverable failure. Memory/resource counts must plateau after warm-up rather than grow each cycle.

### Phase 1 source review — 2026-09-09

The strongest findings concern two separate contracts: handing the shared renderer from battle to HQ, and deciding when a scene is ready to reveal. The current code already contains substantial cleanup and loading work. The fixes should close gaps in those paths rather than replace them wholesale.

The findings below describe the baseline static review. LIFE-02 and LOAD-01 now have local implementations recorded above; no reported live symptom has been reproduced and Phase 1 remains open. Complete source snapshots are retained locally in `review-source/` for follow-up; they are reference copies, not upload deliverables. Source locations below refer to the pinned commit, not the live deployment.

#### Transition and resource ownership

| Resource / transition | Current owner and source | What the source establishes |
| --- | --- | --- |
| Screen state | `state.js:4824`, `transitionTo` | Updates screen/phase flags and dirties screen rendering. Has no HQ branch and does not itself tear down renderer resources or cancel asynchronous boot work. |
| Results → builder | `battle.js:33309`, `backToPartyBuilder` | Clears selection/result state and calls `render()`. Does not directly deactivate the renderer. Follow the downstream render/screen code before deciding where cleanup belongs. |
| Results → HQ/menu | `battle.js:33342`, `backToMainMenu`; `map.js:635`, `_hqReturnOrMenu`; `map.js:395`, `_hqEnter` | Main-menu transition establishes setup phase; HQ entry parks an active battle renderer when phase is not battle. Direct HQ entry during battle is refused by the renderer. |
| Shared canvas and CSS labels | `three-renderer.js:25386`, `activate`; `25433`, `deactivate`; `32871`, `_hqEnter`; `32993`, `_hqLeave` | Battle deactivation hides the CSS label layer. HQ reparents and reveals that same layer, then renders its own scene. HQ exit returns the shared elements to the battle parent. |
| Unit nameplates and health bars | `three-renderer.js:11537`, `_clearPlates`; `11186`, unit rebuild; `27900`, dispose | Unit rebuild and full disposal clear the plate registry. Battle deactivation clears tower plates and nexus bars but does not call `_clearPlates`. |
| Floating text, intent badges, arrows, ghosts | `three-renderer.js:25433–25512`, `deactivate` | Existing deactivation clears/hides these. Reuse that cleanup instead of adding unrelated DOM removal at each menu. Other effect and timer lifetimes still need a complete inventory. |
| Minimap / dungeon scanner | `three-renderer.js:26637`, `_ensureMinimap`; `26746`, `_mdScannerActive`; `27027`, `_updateMinimap`; `25488`, deactivation | Wrapper lives under `document.body`. Deactivation hides it, removes scanner mode, and resets discovery identity. Frame updates check renderer activity and board availability; scanner eligibility checks dungeon state, not the foreground screen. |
| HQ loading card | `map.js:426–460`; renderer `32565`, `32863` | Entry displays the card. Avatar attachment or the nine-second fallback calls `onReady`; delayed callbacks then fade and hide the shared card. |
| Battle loading / intro | `battle.js:33938–34333`, `showBattleLoadingScreen`; `35117`, `startMatch` | Warms models, images, textures, music, and intro assets, then hands off to the intro/engine boot chain. The gate can resolve after failures or a 45-second cap. |
| Online start barrier | `battle.js:33813`, `_lsAwaitRemoteReady`; `online.js:3175`, ready relay; `4460–4490`, guest phase change | Both viewers run loading. Ready and intro-done use global latches and callbacks. Guest phase changes reset votes; waits have time limits. This is already a two-player system and must stay one. |

#### Prioritized findings

**LIFE-02 — High: battle unit labels survive deactivation before HQ reuses their DOM layer.**

Local status: implemented and regression-tested in the accompanying delivery; baseline evidence follows. Live acceptance remains pending.

Evidence: `deactivate()` hides `css2dRenderer.domElement` but leaves `_plateObjs` intact. HQ entry reparents that same element and restores its display. `_clearPlates()` exists and removes plate objects from their parents, but is called on unit rebuild/full disposal, not this handoff. This is a concrete ownership gap and a strong candidate for REP-03. Whether the retained DOM is visible in the reported case still needs verification against the loaded CSS2D implementation and an actual transition.

Proposed fix: retire battle-owned unit labels at battle deactivation, before another scene reveals the shared overlay. Preserve unrelated HQ labels and the existing bar-animation history contract; rebuild battle labels on the next activation. Verify tower/nexus labels, floating text, and both viewers at the same boundary. Do not clear the whole shared DOM indiscriminately.

**LOAD-01 — Medium: an old HQ fade callback can hide a newer room's loading card.**

Local status: implemented and regression-tested in the accompanying delivery; baseline evidence follows. Live acceptance remains pending.

Evidence: `map.js:453–460` schedules two nested timeouts. Both target the shared `hqLoad`; neither checks entry identity. `_hqLeave` at `map.js:572` does not cancel them. Renderer room replacement does leave the old room, but cannot cancel timeouts that its earlier `onReady` already scheduled in map.js.

Failure scenario to test: room A becomes ready and schedules its fade; enter room B before A's delayed hide runs. B displays the card, then A's callback hides it. Proposed fix: give each entry an identity and track/cancel both fade timers on entry, leave, and failed entry. Check identity again inside each callback. This addresses card ownership; it does not make textures ready.

**LOAD-02 — High: HQ readiness does not wait for room textures.**

Evidence: `three-renderer.js:32565` signals ready when the player model attaches; `32863` signals ready after nine seconds regardless. `_hqTex` at `29849` starts and caches asynchronous texture loads without registering them with that readiness decision or providing a local failure handler. Room shell/setting build exceptions are logged and entry continues (`32971` onward). A ready avatar therefore does not establish a ready room.

Proposed fix: track required room textures/models during the current entry and distinguish success, intentional fallback, and failure. Reveal after required resources have settled into a usable scene and that scene has rendered. On timeout, show a recoverable status or a deliberate fallback. Keep optional detail from blocking entry indefinitely. REP-01 remains unconfirmed: missing textures, material/lighting behavior, and GPU upload are still possible contributors.

**LOAD-03 — High: battle loading presents failure or timeout as success.**

Evidence: image and texture warmers use the same completion path for `onload` and `onerror` (`battle.js:34000–34070`). Model preload also settles on failure (`three-renderer.js:9754–9772`). `assetsReady` races all warmers against 45 seconds (`battle.js:34092`); the visible path then forces the bar to 100% and announces “SYNC COMPLETE” (`34296–34315`). The terrain warmer fills the browser cache; it does not establish that every scene material is bound and rendered.

Proposed fix: retain bounded loading, but return separate loaded/failed/timed-out results and track required resources. Make the displayed outcome match those results. Connect scene readiness to actual renderer consumers, including assets first requested by map scenery. Do not replace the cap with an unlimited wait or extend a fixed delay as a readiness fix. Audit the asset list against one affected map before expanding it.

**LIFE-03 — Medium: the minimap's visibility contract is weaker than screen ownership.**

Evidence: `_updateMinimap` gates on `active` and board data, while the scanner predicate checks dungeon mode/floor/run state. Neither requires the battle to be the foreground screen. Results-to-builder does not directly call deactivation. However, normal tactical minimaps are already hidden by `hud.js:9267` (`#battleMinimap:not(.md-scanner)`), and HQ deactivation already hides the scanner. These protections rule out a blanket claim that the minimap has no cleanup.

Follow-up caller audit: `render()` (`ui.js:6413`) dirties and renders UI; `renderIfDirty()` (`state.js:4532`) invokes `renderScreenMode()` (`ui.js:5708`). The screen handler hides `mapRow` in setup but does not deactivate the renderer or hide the body-level scanner. `backToPartyBuilder()` leaves `_mdRun` and `_mdPhase` untouched. This establishes a gap if that generic route is used with a live dungeon floor; it does not establish that the normal dungeon result UI selects that route. The dedicated `_mdExitToMenu()` (`battle.js:32182`) stops free roam and clears both fields before returning to the menu/HQ. `_updateMinimap()` then removes scanner mode, and HQ also deactivates the battle renderer.

Button reachability audit: the dungeon result replaces the shared footer with a single button calling `_mdReturnToHub()` (`battle.js:32159–32166`). That alias invokes `_mdExitToMenu()` (`32180–32208`), which stops free roam, restores the pre-run party, clears run/floor state, and returns through `backToMainMenu()`. The standard result footer separately binds Back to Party Builder (`32620–32640`); its existence does not make it a dungeon result action. The reviewed pause footer contains only Resume (`ui.js:6545–6550`), so it supplies no generic builder bypass either.

Remaining verification: identify the actual element and departure route in REP-02, including any other HUD or controller navigation not covered by these button bindings. The normal dungeon result and reviewed pause footer do not establish a scanner leak. Keep LIFE-03 as a conditional ownership risk. If another bypass is confirmed, tie scanner visibility to the current scene and retire it on departure while preserving same-floor discovery and fog filtering.

**LIFE-04 — Medium: boot callbacks have per-call completion guards but no visible match identity.**

Evidence: loading `finish()` prevents duplicate completion of its own call, but does not check whether that match is still current (`battle.js:33938`). Loading fade/auto-dismiss callbacks and `_syncedAfterVSSplash`'s 20-second fallback can later call the boot continuation (`35222–35246`). Ready messages contain `type` and `from`, and the receiver sets global flags (`33813–33833`, `online.js:3175–3181`). Current guest resets and ordered socket delivery provide protection within the expected flow; they do not by themselves prove cancellation across an abandoned/replaced flow.

Proposed fix: establish one current boot identity and cancellation path across loading, intro, timers, and ready waiters. Ignore stale local callbacks. If matching identity is added to relays, carry it consistently through host state, guest state, senders, and receivers. First verify which exits are reachable during boot; stale callbacks are a source risk, not a reproduced restart/disconnect failure.

Follow-up disconnect audit: an own-socket disconnect (`online.js:2890`) clears connection status and opens a reconnect overlay; a reconnectable opponent departure (`3030` onward) does the same. These branches do not cancel the ready/intro waiters. A non-reconnectable opponent departure reloads the page, which is a different lifecycle. `_lsAwaitRemoteReady()` (`battle.js:33813`) explicitly allows its timeout to advance while the reconnect/forfeit flow handles a missing opponent; the host intro barrier has a similar 20-second cap (`35222`). Treat this as an existing recovery policy to reconcile, not proof that every disconnect should cancel a match. The next trace must check whether turn clocks can start behind reconnect/loading overlays and what happens when the guest rejoins at that point.

Cancellation contract for a future implementation: explicit abandonment or replacement retires the old boot and its timers; a temporary disconnect follows the existing reconnect policy for the same match. A late ready event must not satisfy a different match's waiter. An identity must be shared by host and guest, not independently generated by each viewer. Validate reconnect, timeout/forfeit, and rematch separately before changing this behavior.

**LIFE-05 — High: reconnect pause applies to an existing shot clock, but does not survive a later clock start.**

Evidence: the reconnect UI is a non-blocking banner, not a full-screen input barrier (`online.js:2803–2848`). Showing it calls `_pauseShotClock()` once. That function returns when the clock is inactive (`battle.js:54636–54639`); `_startShotClock()` later sets `pausedAt = null` and `active = true` without checking connection state (`54616–54624`). A pending human activation calls it after its generation/unit guards (`37725–37742`). The host's intro barrier can also release after 20 seconds and call `_afterVSSplash()`, which starts `beginBlitzRound()` (`35222–35243`, `35304`). Thus the reviewed clock API does not retain the reconnect condition across activation or boot.

Failure sequence to verify: disconnect while no shot clock is active, or after a human activation has been scheduled; keep the reconnect banner present while the activation starts. Check whether the newly active clock counts down. Repeat with disconnect during loading/intro and the host barrier timing out. The interval honors `pausedAt`, but `_shotClockExpired()` can end the locally controlled online unit's turn when the clock is running (`54561–54613`). Source confirms the missing persistence at clock start; actual turn loss and the full boot-to-turn sequence remain runtime-unverified.

Proposed fix: track reconnect suspension independently of a particular clock instance and honor it whenever a clock starts or is replaced. Keep it separate from the local settings-menu state. Rejoin must remove only the reconnect reason and retain the correct remaining time. Inspect server rejoin snapshot ordering and guest state application before implementation: `_applyRemoteState()` deserializes host state (`online.js:4284–4300`), so a guest-local timestamp alone is not a sufficient shared contract. Do not infer that the entire simulation already pauses because a clock helper does.

Acceptance: cover both roles, disconnect before first activation, disconnect during a pending activation, an already running clock, reconnect before/after intro timeout, and forfeit. Record clock timestamps, remaining time, active unit, connection state, and whether any action advanced. These checks are pending; no disconnect test ran.

**LIFE-05 follow-up — rejoin acknowledges connectivity before proving state recovery.** `server.js:2058–2091` reassigns the socket, joins the room, acknowledges success, and broadcasts `player-rejoined`. It sends no full match snapshot in this handler. `room._lastState` is a small rules/watchdog summary (`1850–1883`), not a restorable board. On the client, both the successful rejoin callback and `player-rejoined` hide the banner and resume the clock (`online.js:2862–2879`, `3060–3064`). No fresh-state acknowledgement is required by those branches.

There is existing recovery: the host's 1.2-second heartbeat forces a state resend on the remote player's turn (`online.js:4231–4261`). On the host's own turn it calls the normal sender, whose identical-state check can suppress a resend (`4214–4226`). Therefore “rejoin has no recovery” would be wrong; “rejoin is complete as soon as the socket returns” is also too strong. A fix should force a current full snapshot on rejoin, acknowledge its application for that match, and coordinate clock resumption with the chosen recovery policy. Do not replace the host with the server as simulation owner. Verify guest reconnect while the host waits on an unchanged turn, and host reconnect while the guest retains a stale snapshot.

**LIFE-06 — Medium: battle deactivation does not invoke the effects subsystem's bulk retirement.** `deactivate()` and `_clearAnimations()` clear renderer-owned tweens and overlays (`three-renderer.js:25433–25523`, `19404–19430`). The effects subsystem separately owns pooled particles, projectiles, bespoke meshes, and a shared animation ticker. Its `clearAll()` exists and stops those registered effects (`three-vfx-effects.js:19864–19916`), but the reviewed deactivation path does not call it. Full renderer disposal does (`three-renderer.js:27978`), as do preview-specific paths.

This is an ownership gap, not a measured leak: finite effects may finish themselves, and `ThreeVFX.isActive()` blocks ordinary new battle spawns after deactivation (`three-vfx.js:2909–2912`). However, the separate ticker can continue running and particle state can remain until its next update. Add effects retirement to the appropriate battle departure boundary after checking preview ownership, and guard delayed effect creation by scene identity. Clearing registered tickers alone does not cancel every independently scheduled timeout. Check long effects, departure during a delayed burst, immediate new-match entry, and opening the character viewer after battle.

**LOAD-04 — Investigation requirement: separate asset readiness from a graphics failure.** The entry page already exposes `?ewdiag=1` / `EW_SHOW_DIAG()` and records graphics limits and shader/script errors (`index.html:55–178`). The historical Safari notes in `LAUNCH_READINESS.md:40–66` identify a prior shader-precision problem; those historical claims are not a diagnosis of REP-01. Attach the existing diagnostic report, affected material/map, browser, and loaded cache token to a reproduction. A decoded texture with a failed shader needs a different fix from a delayed fetch. Preserve the loading readiness work and use the diagnostic evidence to decide which branch explains the black surface.

#### Bounded implementation order

1. **Label handoff and HQ card ownership:** LIFE-02 and LOAD-01 in existing renderer/map files. This first batch is now locally implemented and tested: small scope, direct ownership evidence, no visual redesign.
2. **Loading outcomes and readiness:** LOAD-02 and LOAD-03. Define required/fallback assets for one representative HQ site and battle map, then connect those consumers to readiness. Keep failure status distinct from success on both clients.
3. **Match cancellation and minimap:** complete the caller audit for LIFE-03/LIFE-04, then implement only demonstrated gaps. Avoid adding a global teardown to ordinary redraws or resuming HQ while battle still owns the canvas.

Batch 1 is now included as complete replacement files, with local checks and a fresh `index.html` cache token recorded above. Remaining code batches must follow the same delivery rule. Renderer/map/battle/online files go to R2; `index.html` goes to Render. The plan and updated subsystem logs are repository-only.

#### Acceptance checks for Phase 1

| Check | Required evidence | Current status |
| --- | --- | --- |
| Battle → HQ → battle | Old unit/tower/nexus labels, damage text, arrows, and intent badges disappear; new labels belong only to the new scene. Check host and guest exits. | Pending |
| Rapid room changes and leave during fade | Run A's delayed callbacks after B starts and after leaving HQ; neither may hide B's card or mutate departed UI. | Pending |
| Cold HQ entry with fast avatar and slow room textures | Card remains until required scene assets or deliberate fallbacks are usable; a valid scene frame precedes reveal. | Pending |
| Required texture fails; optional asset fails; timeout | Outcome distinguishes these cases, offers usable recovery, and does not falsely report complete asset success. | Pending |
| Dungeon floor → builder/HQ → Arena or TDM | Scanner does not survive into menus/loading or the next mode; same-floor exploration remains intact. Compare dedicated dungeon exit with any reachable generic builder exit. | Pending runtime; normal dungeon result uses dedicated cleanup, reviewed pause footer has no builder exit |
| Reconnect while boot or human activation is pending | New clocks retain reconnect suspension; rejoin restores the appropriate remaining time on both viewers. | Pending; LIFE-05 source gap documented |
| Leave/restart/disconnect during loading or intro | Late callbacks do not boot a departed match; ready messages and engine start remain tied to the same match for both players. | Pending |
| Repeated warm transitions | Resource/DOM counts plateau across repeated cycles; no accumulating input handlers, timers, or scene owners. | Pending; no memory measurement yet |

Validation for the initial Phase 1 pass was manual source tracing and document content review only. The extended review's selected automated checks are recorded under Phase 8. No browser, simulation, FPS, network-failure, or memory test ran. The first two files that previously blocked inspection are now available; remaining uncertainty is in behavior and untraced callers, not access to those files.

## Phase 2 — performance without changing the art style

### Static triage — 2026-09-09

The renderer already batches terrain, gates shadow updates, distinguishes structural unit rebuilds from stat-only label patches, and exposes performance controls. This pass identifies where to measure and one avoidable-work candidate. It does not establish the cause of REP-06 or claim an FPS gain. Phase 1's initial fixes are locally tested; Phase 2 preparation can proceed while runtime checks remain pending.

| ID | Source-backed observation | Measurement and bounded next action |
| --- | --- | --- |
| PERF-01 | `_updateMinimap()` (`three-renderer.js:27027`) redraws terrain, objectives, and visible units whenever the active battle frame reaches it (`27527`). It does not test whether the tactical map is hidden by `hud.js:9267`. That CSS intentionally hides non-scanner minimaps. | Time this function on a representative large battle board and record whether the element is visible. If material, skip drawing when the product's minimap visibility policy says hidden. Keep the dungeon scanner branch and its fog/discovery behavior. Prefer an explicit visibility predicate over a new per-frame computed-style query. |
| PERF-02 | `_terrainBatchWanted()` (`three-renderer.js:3249`) disables terrain merging with the fog grid enabled under fog, and in the editor. Those conditions preserve per-tile behavior. | Record the effective batching state, fog state, and grid setting for every capture. Compare like-for-like scenes. A fog-off benchmark does not demonstrate online performance. Read the existing ROADMAP performance history before any batching change; retain visibility correctness. |
| PERF-03 | The shadow gate (`three-renderer.js:27489` onward) includes fog, active animations, tower cubes, lighting easing, and animated GLBs. `shadowMap.autoUpdate` is already disabled (`25310`). | Count shadow-pass requests and their time in both idle and action scenes. An idle tactical board may still have animated shadow casters. Do not describe gating as missing or freeze shadows merely to improve a counter. |
| PERF-04 | `renderScreenMode()` hides the board container in setup (`ui.js:5728`), while the reviewed generic results-to-builder chain has no renderer deactivation. `renderFrame()` checks renderer activity, not foreground screen ownership (`27242`). | After that transition, measure whether the frame loop continues costly work behind the builder. Attribute any verified improvement to lifecycle cleanup in Phase 1. Confirm the next battle rebuilds correctly and that HQ retains its separate scene ownership. |
| PERF-05 | `renderFrame()` already compares terrain versions and separates unit structural changes from stat-only patches (`three-renderer.js:27318–27381`). It also calls label, visibility, animation, and VFX updates each processed frame. | Use a CPU trace to identify costly consumers before introducing additional caches. A function named `rebuild...` is not evidence that it rebuilds every frame; inspect its internal guard. Preserve HP drains during death/action tweens and correct fog visibility. |

### Existing tools and capture limits

The ROADMAP performance history has now been read against current source. Its old object counts came from an 8×8 TDM probe under software graphics, not the user's hardware. Its ranked optimization list mixes proposals with work subsequently completed in the same document. In particular, current `three-vfx-effects.js:5258–5285` already has one shared ticker for registered bespoke effects, and `19864–19916` already has bulk cleanup. Do not schedule either as a new architecture project. Some effect-specific DOM animation callbacks still exist; measure their actual cost before expanding the shared ticker's scope.

**PERF-06 — Medium investigation priority: separate hidden work from expensive visible work.** Instrument the effects ticker, main renderer, HQ loop, and character viewer independently. A battle frame cap does not automatically cap an independent effects ticker, and deactivating the renderer does not establish that all its producers stopped. LIFE-06 supplies the specific departure path to inspect. Report processed frames, callback time, and active-effect counts; a lower draw count alone does not show that CPU work stopped.

**PERF-07 — Medium investigation priority: measure AI decision stalls separately from graphics.** The joint planner loops over reachable tiles, visible enemies, and eligible damage spells (`ai.js:2923–3000`). It is a bounded search by candidate count, but this loop has no elapsed-time budget or yielding point. Loop/stall safety in `aiTakeTurn` prevents repeated failed actions; it does not bound one expensive scoring pass. Capture decision duration and candidate counts on the same board/loadout as the frame trace before reducing search breadth. Avoid turning a rendering complaint into weaker AI without evidence.

- `ThreeRenderer._renderer` exposes the live renderer (`three-renderer.js:33779`), providing a starting point for draw, triangle, geometry, and texture counters. Inspect counter reset behavior across postprocessing and split-screen passes before treating a sample as a full-frame total. These counters are not GPU timings or exact memory usage.
- The existing FPS counter (`three-renderer.js:27230`) reports a rounded average over roughly half a second. It cannot supply p95/p99 frame times or explain a stall. The frame cap is applied before this counter in the battle loop. Record the effective cap; a capped result must not be mistaken for a performance ceiling.
- Pixel ratio has a saved preference and low-performance fallback (`three-renderer.js:25297`). Record the effective renderer ratio and drawing-buffer size, not just the operating system's display scale. Changing either is a quality tradeoff.
- The battle loop contains dev-sim throttling and a no-render path (`three-renderer.js:27256` onward). Keep these disabled for player-performance captures. HQ and character previews have separate update paths; do not assume a battle-loop measurement covers them.

### Repeatable baseline protocol — proposed, not run

1. Record repository commit, loaded production cache token, browser/version, hardware/GPU, viewport, drawing-buffer size, display refresh rate, power mode, all quality settings, fog/grid state, and effective FPS cap. Record whether the source matches the deployed build. Give the capture a unique ID.
2. Choose exact room/map IDs and party/loadout fixtures from current data and save them with the capture. For battles, record mode, seed when available, turn, unit count, camera pose, and the action sequence. If no repeatable seed is available, disclose that limitation and reuse the same saved scenario where supported.
3. Separate cold entry, warm entry, steady idle, and action bursts. For steady scenes, allow 15 seconds to settle, then record 60 seconds, three times. For entry and action cases, record the whole transition or a fixed action sequence; report duration and spikes separately from idle percentiles. Keep the tab foreground and note unrelated activity.
4. Record median/p95/p99 frame intervals and counts above 33.3 ms and 50 ms. Capture CPU traces for stalls, plus renderer counters at consistent points. Distinguish presentation/frame intervals from JavaScript execution time and GPU time. Report unavailable GPU timing as unavailable.
5. Compare baseline and candidate in alternating order on the same setup. Retain all three runs, state the percentile aggregation method, and compare the run-to-run spread. Repeat only if a failure, changed fixture, or unstable measurement justifies it.
6. Capture matching images at the same camera and action beat. Reject unintended loss of shadows, scenery, unit animation, fog correctness, label readability, or spell impact. For resource lifetime, record counts after each of ten warm scene cycles at the same settled point; investigate continuing growth while distinguishing deliberate cache population.

| Capture | Fixed workload | Question it resolves |
| --- | --- | --- |
| P2-HQ | One HQ room and one site; cold entry, warm entry, then the same walk/camera route | Does loading or steady scene work dominate, and does room replacement retain resources? |
| P2-IDLE | One simple and one dense battle map, same legal party and camera; no player action during each idle window | Are draw cost, animated casters, labels, or hidden minimap work significant at rest? |
| P2-ACTION | Repeatable terrain change and a representative heavy spell sequence | Are spikes caused by rebuilds, effect creation, shader work, or UI updates? |
| P2-ONLINE | Matched host and guest captures with their normal fog rules | Does a proposed optimization preserve each viewer's legal information and help both clients? |
| P2-EXIT | Results → builder and battle → HQ → next battle, repeated warm | Does hidden work continue, and do resource/DOM counts settle after reuse? |

Result record: capture ID; source/deployment identity; fixture/settings; three raw-run references; frame-time statistics; CPU/GPU attribution; renderer counters and sample method; transition duration; matched images; observed regressions; decision. Every result is **pending capture**. No synthetic values or estimated speedups should fill this record.

### Review

Measure representative HQ, simple and dense maps, idle battles, many visible units/nameplates, terrain changes, and heavy spell bursts. Compare identical settings, camera, resolution, and workload.

Record hardware/browser, resolution and pixel ratio, quality settings, cold/warm cache, median and p95/p99 frame time, spikes, long tasks, draw calls, triangles, textures, and resource growth. Separate CPU, GPU, DOM/layout/paint, asset loading, and AI decision stalls. Software rendering can diagnose correctness but is not a player GPU benchmark.

Investigate voxel rebuild granularity, hidden faces, batching/instancing, material proliferation, shadows, transparency/overdraw, animation updates, postprocessing, allocations, repeated raycasts, and DOM nameplate updates. Inspect CSS filters, blur, large shadows, overlays, and layout reads/writes only where measurements implicate them.

### Improvement batch

Optimize the measured bottlenecks first: reuse resources, avoid unchanged work, limit rebuild scope, and stop inactive systems. Preserve silhouettes, palette, materials, lighting intent, spell readability, and scenery identity. Any optional quality tradeoff must be visible as a setting and assessed separately from same-quality optimization.

### Completion evidence

Before/after measurements and matched images on the same setup, plus a list of costs and gains. Set the target after baseline capture; 60 FPS implies about 16.7 ms per frame, but no FPS improvement is promised without measurement. Reject gains that merely shift stalls to loading, AI turns, or later matches.

## Phase 3 — one familiar pause menu

### Source triage — 2026-09-09

**PAUSE-01 — Medium: HQ and battle use different entry and suspension paths.** HQ Escape first closes its terminal or contextual panel, then calls `_hqOpenSettings()` (`map.js:451`). Settings suspends the building through `_hqSuspend()` and opens the main-menu settings (`652–658`). Battle/editor Escape has its own modal/back-target priority before toggling the pause shell (`ui.js:10515–10532`). Preserve these priorities when unifying presentation. Current HQ history also records asynchronous pointer-lock cleanup on leave (`CLAUDE.md`, terminal/dead-cursor notes); a new Resume action must use that lifecycle rather than directly enabling movement.

**PAUSE-02 — Medium: opening the menu removes cinematic presentation without a reviewed sequence-level cancellation contract.** `openPauseMenu()` removes `_cinematicEl` and clears `_activeCinematic` (`ui.js:6471–6478`); closing only clears the menu flag and hides its element (`7505–7512`). `playCinematicAttack()` refuses new duel cinematics while `_gamePaused` (`battle.js:13323–13327`). This confirms presentation suppression, not suspension of every action callback, VFX, or camera sequence. Before editing, inventory consumers of the active cinematic and their completion/cleanup callbacks. A menu must not make damage resolve twice, strand an action, or leave the camera owned by a departed sequence.

**PAUSE-03 — Medium: the unconditional “PAUSED” title promises more than the reviewed clock path enforces.** The shell always prints that title (`ui.js:6531`), but opening it only sets `_gamePaused` and adjusts presentation. The shot-clock interval checks `pausedAt`, not that menu flag (`battle.js:54561–54572`), and the menu does not invoke the reconnect clock helpers. The reviewed online clock can therefore continue while this local menu is open. Use a truthful online label such as “Match menu — online play continues.” Offline AI, action timers, animations, and audio still need their own consumer audit before promising a full offline pause. This finding concerns the visible promise and inspected paths; it is not a claim that every subsystem ignores the menu.

### Proposed context/action contract

| Context | Shared shell content and actions | Clock/input contract |
| --- | --- | --- |
| HQ | Resume, shared settings and controls, Quit to Main Menu; omit match score/round/duration. | Use HQ suspend/resume and existing pointer-lock cleanup. Closing a nested panel consumes one Escape. Leaving HQ must not resume it afterward. |
| Offline battle or dungeon | Resume, shared settings, relevant match information, contextual departure. | Audit simulation consumers before labeling the game paused. A dungeon departure must use `_mdExitToMenu()` so party restoration and run cleanup remain intact. |
| Online battle, either role | Match menu, settings, relevant match information, explicit leave/forfeit action. | Local menu does not imply a negotiated pause. Keep reconnect suspension independent; closing the menu cannot resume a disconnected clock. |
| Editor | Resume, settings and controls; preserve omission of match information. | Retain editor input ownership and existing save/discard behavior; review that behavior before adding a departure action. |
| Loading, intro, or scene departure | Do not expose actions whose cancellation path has not been defined. | Any reachable exit retires the current boot/scene identity under Phase 1. Closing a menu after departure cannot restore the old scene. |

This is a proposed contract, not an implemented menu. Extend the existing shell and settings builders in place. The reviewed pause footer currently exposes only Resume, so contextual exit/forfeit actions require real handlers and confirmation behavior, not just renamed buttons.

### Bounded next batch and acceptance

After the first Phase 1 cleanup batch, inventory the main-menu settings close callback, HQ resume path, keyboard/controller menu handlers, and cinematic completion consumers. Then wire the shared shell to an explicit context, reuse current settings persistence, and make online wording accurate. Treat offline simulation suspension as a separate bounded change once its consumers are known.

Check one Escape per action; focus moves into the menu and returns to a valid control; Tab/controller navigation does not also target battle units; repeated settings changes persist; HQ has no stale match information; delayed pointer lock cannot capture a departed screen; opening during an action neither duplicates nor loses its resolution; menu close cannot clear reconnect suspension. These are acceptance requirements, not test results. The battle Tab handlers immediately below the Escape handler (`ui.js:10535–10546`) have no `_gamePaused` guard, which was addressed in this delivery; focus trapping/restoration remains open.

### Input and cancellation follow-up

**PAUSE-04 — High: Tab can change the selected battle target while the pause menu is open.** The document-level spell and attack Tab handlers check battle/action state but do not check the menu (`ui.js:10535–10546`). `cycleSpellTarget()` and `cycleAttackTarget()` also have no menu guard; they update `state.pendingTarget`, previews, and camera/selection rendering (`battle.js:41708–41742`). Opening the menu does not clear the targeting state. The concrete route is: arm a spell with multiple targets, open the pause menu with the controller pause button or direct menu control, then press Tab. The reviewed handler prevents normal Tab focus movement and cycles the battle target. This is a code-confirmed input-routing defect; browser reproduction remains pending. Route keyboard input through the active interaction owner and add focus handling to the shell. Do not “fix” it by discarding the player's pending target when opening settings.

**PAUSE-05 — High: title-screen classification can take precedence over settings navigation on controller.** `_context()` checks `state.titleScreenVisible` before `_mmSettingsOpen()` and returns `title` (`state.js:6293–6307`). In that context, controller Confirm/Pause calls `enterGameFromTitle()` (`6611–6613`), which routes to `mainMenuPage` (`map.js:87–107`). HQ resume explicitly keeps `titleScreenVisible = true` (`map.js:620–624`), and `_openMainMenuSettings()` only shows the settings page (`1745–1749`). The settings path therefore retains the title flag in the reviewed HQ flow. Give visible front-end panels their own navigation context before the splash/title fallback. Verify settings from both HQ and the main menu, including Confirm, Back, sticks, sliders, and remapping. The battle pause overlay already has a controller DOM-navigation route; do not replace that working path.

**PAUSE-02 follow-up:** the legacy duel handle already exposes `skip`, which clears its tracked timers (`battle.js:13675–13713`). The pause handler bypasses it by removing the element directly. Reuse or extend the existing retirement method after deciding whether opening a menu skips or suspends this presentation. Some effect callbacks in the duel use separate timeouts, so inspect those too; calling `skip` is not yet evidence that all asynchronous work is retired. Preserve damage resolution independently of presentation cleanup.

**HQ settings return is already lifecycle-aware.** Back calls `_settingsBack()` → `_hqReturnOrMenu()` (`map.js:1751–1755`, `635–649`), which resumes a suspended HQ when appropriate. `_hqResume()` refuses to resume beneath an active battle renderer (`614–629`). The shared menu should retain this return contract. A direct call to unpause the walker would bypass an existing safeguard.

### Review and design

Use one shared shell in HQ and battle with consistent typography, spacing, focus behavior, navigation, and settings persistence. Proposed primary actions: Resume, Settings, Controls, contextual Match Information, Return to HQ when relevant, and Quit to Main Menu. Preserve useful existing audio/video/status controls without making all of them compete on the first screen.

Define pause semantics explicitly: offline simulation, AI, action clocks, animation, audio, and HQ movement; online matches may continue while a local menu is open unless an actual shared pause protocol exists. Label that accurately.

Escape should first dismiss the current nested interaction, then open/close the same pause shell. Handle mouse, keyboard, controller, pointer lock, focus restoration, resizing, and menu entry during a cinematic. Confirm before forfeiting a match or discarding unsaved work.

### Completion evidence

A context/action table and implemented shared menu in existing files. HQ must not show a stale scoreboard or battle timer. Repeated open/close, nested settings, cinematic interruption, and leaving a scene must restore the correct input and clock state.

## Phase 4 — cinematic action camera

### Source review and findings

The camera has substantial existing composition work. `_tpsZoomFitTiles()` uses the renderer FOV and viewport aspect (`battle.js:18683–18697`), shoulder anchoring includes model height and airborne elevation (`18703–18737`), close/gun casts can drift rather than jump-cut, and multiple-target casts can request a wider hit shot. The reviewed code also preserves a tactical return view and checks shot identity before delayed beats. Keep these behaviors.

**CAM-02 — High: model height changes the pivot but several shot distances still assume a fixed body size.** `getUnitVisualHeight()` returns a scaled height from `modelDef.heightRatio` (`three-renderer.js:33717–33722`); it is not an animated bounding box. `_tpsShoulderLift()` uses 80% of that height. The face shot chooses fixed boom distances (`battle.js:19014–19043`), while pair fits use fixed allowances such as vertical gap + 3.0 tiles or + 2.6 tiles (`18996–18999`, `19154–19162`). A tall model can therefore raise the aim point without proportionally widening the shot to retain its feet. This is a credible source explanation for REP-05, not a verified crop on a specific model.

Proposed fix: define required subject bounds for each shot. Start with cached model bounds transformed into the live pose/scale, using conservative animated margins where exact skinned bounds would be costly. Include feet, head, wings/weapons only where the action needs them. Solve distance and focal offset together against the usable viewport, including letterbox and HUD exclusions. Use the current height accessor as a fallback; do not recompute every skinned vertex every frame. Validate short, normal, tall, wide, airborne, and sprite-fallback actors.

**CAM-03 — High: the multiple-target wide shot fits a two-dimensional tile spread, not the affected actors' vertical extent.** The `frameTiles` branch computes min/max X/Y, derives one horizontal span, and anchors on the ground at its center (`battle.js:19076–19109`). It does not calculate min/max affected unit elevation or body height. The normal pair path separately considers elevation, so its safeguard does not cover this branch. Test an area or line attack hitting ground and elevated/flying units, including a tall unit at the near edge. Carry subject identity/elevation into framing locally and into the guest's allowed view, rather than only adding a bigger constant to every wide shot.

**CAM-04 — Medium: multiple camera layers can issue beats for the same action.** The base shot, family treatment, and bespoke sequence share a sequence ID, which protects against an old action. That does not by itself resolve competition within the current action. The base hit callback runs at `_cineCutMs`; the beam family schedules a side dolly at that cut plus `actionMs(8)` (`battle.js:19064–19178`, `20111–20121`). Both are valid owners under the current ID. A hard cut followed almost immediately by another move is source-backed scheduling behavior; whether it causes REP-04's awkward cut needs a capture. Give each action a declared owner for cast, release, travel, impact, and return, so the family layer can replace a base beat intentionally rather than issue a competing move.

**CAM-01 follow-up — preserve the cinematic collision decision.** Cinematic TPS deliberately bypasses boom collision to avoid being pushed into a close-up by a wall behind the subject (`three-camera.js:304–317`). The renderer fades blockers along rays toward caster/target (`three-renderer.js:14884–14900`, `15103` onward). Re-enabling collision globally would revive a documented failure. For multiple-target shots, inspect whether every important target/effect has a clearance subject; the primary caster/target rays alone are not proof that an entire wide shot is unobstructed.

### Shot acceptance matrix

| Fixture | Required composition | Reject the change if |
| --- | --- | --- |
| Adjacent melee, two ordinary units | Contact and reaction remain readable; return restores the tactical view. | The move cuts away before contact or introduces a second return snap. |
| Tall caster against a short target | Required full-body pose fits at wind-up and release; the target remains locatable. | Raising the pivot crops the feet or the camera backs away excessively from every normal unit. |
| Ground caster, flying/elevated target | Fit actual vertical separation and model extent. | Camera frames empty ground or loses a descending body below the frame. |
| Long beam and piercing beam | Show a meaningful length of the beam, then impacts. | Beam collapses to a head-on dot, or a base cut fights a family dolly. |
| AoE across ledge/roof/flight | Fit the visible affected units and necessary effect volume. | Horizontal spread fits but high or near-edge subjects are clipped. |
| Unit against wall, room enclosure | Keep the shot distance; fade the actual blocking geometry. | Collision causes an extreme close-up or fade reveals a concealed enemy. |
| Narrow viewport and short landscape viewport | Fit against actual render area and overlay-safe region. | Subjects are technically in the canvas but hidden behind letterbox/chrome. |
| Kill, interruption, menu, next action | Resolve once; release camera ownership once. | A dead victim is reframed after departure or a delayed beat steals the new action's camera. |

For each fixture, record the shot family, source/target IDs, elevations, visual bounds, FOV/aspect, source/release/impact times, and return owner. Use the same action on host and guest with different legal visibility. These are pending capture requirements, not visual scores assigned from source.

### Review

Inventory shot families and selection rules in battle.js, three-camera.js, and renderer helpers. Evaluate caster, target, travel path, impact area, tall/short models, wide models, flight, slopes, nearby walls, multi-target spells, and viewport aspect ratios.

Score each shot for subject visibility, full required body bounds, action visibility, occlusion, screen-edge margin, continuity, duration, and return to tactical control. Check what the guest can legally see through fog.

### Improvement batch

Frame measured animated bounds and the required effect/target region. Include both feet and head where the action requires the full body; diagnose the reported lower-body crop from projection rather than assuming the camera simply needs lowering.

Choose fewer, motivated cuts: establish the action, show release/travel when meaningful, hold through impact and readable damage feedback, then return. Prevent shot transitions during critical release/impact beats. Use a dependable wider fallback when a candidate shot is obstructed or cannot fit the subjects. Preserve existing successful shots.

### Completion evidence

Representative before/after captures and a shot acceptance checklist. The player can identify who acted, whom they hit, what happened, and where control returns. No tested tall-unit crop, missed critical impact, or fog leak. Include a reduced-motion/cinematic intensity preference if compatible with existing settings.

## Phase 5 — spell VFX and animation timing

### Timing and effect ownership findings

**VFX-01 — Existing strike-frame contract confirmed; residual timing cases remain.** The slot record contains source `strikeAt`, optional trim, and time scale. `_slotStrikeMs()` subtracts the trim start and divides by the actual action/default slot scale; `_unitAnimStrikeMs()` follows the first available animation slot (`three-renderer.js:10676–10697`). Battle casts trade hold time for that lead (`battle.js:8970–9018`), and basic attacks use `_attackStrikeLeadMs()` (`8886–8890`). This is already shared infrastructure and should remain the authority.

The remaining audit is the deadline: if lead exceeds available hold, `Math.max(0, holdMs - lead)` cannot start the clip before time zero. A zero-hold support path explicitly starts on the beat. Record the selected slot, strike lead, available hold, actual launch/impact time, and fallback reason. Choose whether to lengthen presentation, accelerate a supported clip, or accept a documented fallback for that action; do not silently delay gameplay in an isolated spell handler. Also test renderer time warp and already-scheduled action delays separately: `_animNow()` owns model/tween time, while `actionMs()` transforms newly scheduled delays (`three-renderer.js:1491–1504`, `battle.js:28587–28594`). They are related systems, not proof of one universal clock.

**VFX-02 — Medium: the strike tests cover structure and asset metadata, not observed synchronization.** `anim-strike.test.js` checks slot values, optional GLB duration bounds, and source patterns in consumers. Its GLB check skips when the animation directory is absent. It cannot establish that a projectile leaves the rendered hand on the expected frame, or that the guest selected the same fallback. Keep these tests and add focused timing assertions/captures for actual consumers; do not claim visual acceptance from regex matches. This pass ran the test file: two checks passed and the GLB check skipped because the animation directory is absent. No contact-sheet review ran.

**VFX-03 — Medium: reuse the existing effect lifetime machinery and close its scene boundary.** There are pooled particles in `three-vfx.js`, registered bespoke effects under `_fxSchedule`, and `clearAll()` in the effects file. LIFE-06 identifies the missing deactivation call; delayed spawns need the same scene identity as loading. Keep character previews isolated: the stage API deliberately calls the internal `fire` rather than the online-wrapped public entry (`three-vfx-effects.js:22980–22988`). A global clear called from the wrong owner could erase a live preview or battle effect.

**VFX-04 — High: guest visibility checks admit an entire multi-anchor effect when any tested anchor is visible.** The sender carries source/destination coordinates and tile lists (`online.js:2176–2229`). The guest tests some anchors, then forwards the original params unchanged if any tested point is visible (`3743–3768`). Its test list includes `tx`, `fromX`, `toX`, `casterX`, and `hitTiles`, but not every supported alias/list (`sx/sy`, `tiles`, `chain`). `_fireTeleport()` renders both departure and arrival from the received endpoints (`three-vfx-effects.js:19777–19808`); it has no per-endpoint visibility test in that path.

Concrete check: an enemy teleports from a hidden origin to a visible destination. Confirm that the guest sees the arrival without a portal at the hidden origin. Reverse the visibility and test both aliases. Repeat for a beam/chain crossing visible and hidden tiles. Source confirms the coarse all-or-nothing admission and unfiltered dispatch; a screen-visible leak has not been reproduced. Normalize coordinate forms and filter independent effect anchors/segments according to the viewer's information rules. Preserve legitimate visible travel and impacts. Dropping every partially hidden effect would hide feedback the player is entitled to see.

### Representative spell matrix

The following IDs were checked against the current `SPELL_BY_ID` registry. They are fixtures for the next pass, not claims that every listed spell has a defect. The registry contains 65 kinds; this sample covers major timing and ownership families, including recent two-stage and displacement mechanics.

| Family | Current examples | Trace and acceptance |
| --- | --- | --- |
| Single projectile / strike | `fire1` Fireball; `guardSlash` Brave Charge | Slot selection → release → travel → mitigation/result. Distinguish spell `kind` from the name's implied animation. |
| Beam / split beam | `railgun` Railgun; `raceFractalNeedle` Fractal Needle | Side framing, origin height, each branch/impact, guest segment visibility. |
| Multi-hit / barrage | `doubleShot` Double Pump; `raceNinefoldScratch` Ninefold Scratch | Hit count and beat spacing; cumulative feedback without duplicate damage or cut restart. |
| Dash / tackle | `rampage` Rampage; `raceSkyTackle` Sky Tackle | Kind-specific clip, travel collision, contact, landing, and final camera owner. |
| Heal / support | `heal1` Heal; `protect1` Protect | Bloom/status must match the chosen animation; full-health/no-op behavior remains truthful. |
| Terrain construction | `rampart` Rampart; `wallOfFire` Wall of Fire | Legal footprint, progressive visual build, collision state, and readable persistent hazard. |
| Delayed payoff | `sharedNuke` Nuke; `raceProphecyOfDisaster` Prophecy of Disaster | Mark belongs to the correct turn; payoff uses current valid targets and its own action/scene identity. |
| Possession / ownership | `racePossession` Possession; `raceEnthrall` Enthrall | Control, team color, target legality, fog, and guest state agree after application and expiry. |
| Paired deployment | `raceGravePassage` Grave Passage; `raceTunnelNetwork` Tunnel Network | First/second placement remain one action with distinct valid anchors; cancellation leaves no partial effect. |
| Summon / revival | `raceSummonCreation` Summon Creation; `raceRaiseDead` Raise the Dead | Spawn/return pose, ownership, labels, and turn eligibility agree; no duplicate actor or stale corpse. |

For each tested cast, record the actual slot/fallback, camera family/bespoke sequence, VFX intents, sound cue, target set, and authority/relay path. Use grayscale or reduced-saturation comparisons as a check that silhouette, motion, and impact shape distinguish the family; color alone is insufficient. Never count a nonempty mapping as a successful visual.

### Implementation boundary

Fix visibility and retirement before expanding spectacle. Then choose one ordinary projectile, one beam, one support action, and one movement spell to validate the shared timing contract. Expand by family once those are correct. Maintain the authored signature sequences in `SPELL_CINEMATICS.md`, but verify their current implementation: that document contains both proposals and implemented ideas, so its candidate list is not a missing-feature list.

### Review

Build a representative spell matrix covering projectile, beam, melee, dash/tackle, area damage, heal, buff/debuff, summon, terrain change, multi-hit, and major cinematic abilities. Audit new spell kinds as well as older shared families.

Trace animation start → strikeAt/release → projectile travel → impact → damage/status feedback → recovery. Check clip trimming, timescale, battle speed, fallback animations, interruption, death, and guest relays. Reuse the authoritative UAL_SLOTS timing contract.

### Improvement batch

Give spell families distinct silhouettes, motion, rhythm, impact shapes, and aftermath; avoid relying on color alone. Define caster tell, travel, impact, lingering effect, and sound per family. Reserve heavier treatment for meaningful abilities. Make persistent hazards and target footprints tactically readable.

Synchronize presentation with authoritative outcomes. Do not change gameplay resolution timing casually to accommodate a visual; inspect turn progression and network consequences first. Pool recurring effects and apply the Phase 2 budget.

### Completion evidence

Spell identity/timing matrix, code changes, and representative captures at supported speeds. Effects communicate the correct target and result, and sustained use remains within the agreed performance budget.

## Phase 6 — Arena and Team Deathmatch AI

### Rules and existing strengths

The AI uses an effective-HP value model, threat estimates, focus selection, move-plus-action search, legal target queries, and failure/stall guards. `AI_REDESIGN.md` explains the intended model; current source is authoritative where it differs from that history. Changes should retain one brain and its trainable-weight routing rather than add another competing scorer.

| Question | Source evidence | Review conclusion |
| --- | --- | --- |
| Does AI still assume five Keys are required in normal Arena? | Arena defines five spawned / three required (`state.js:249–276`); board preparation sets `state.hourglassTarget = getKeysToWin(...)` (`battle.js:33743–33753`); AI reads it (`ai.js:1008`). | AI-01's initial suspicion is resolved for the standard initialized Arena path. The fallback of five is not evidence of a normal three-of-five bug. Check unusual restore/custom states separately. |
| Does standard TDM retain Arena objectives? | TDM disables towers, Nexus, and Keys and uses 12 rounds (`state.js:278–295`). Objective initialization empties Keys (`battle.js:24555–24560`), nulls towers (`map.js:5685–5697`), and clears Nexus when disabled (`5760–5763`). | Generic AI objective branches do not prove normal TDM chases nonexistent objectives. Test repeated mode changes and custom paths if stale objective state is reported. |
| Does AI blindly attack concealed enemies? | `buildVision()` filters concealment and visible tiles (`ai.js:849–864`); threat/focus construction uses that list. | A blanket cheating claim is unsupported. Audit global win-state information separately: total carriers, alive counts, and respawn fields may be public or hidden under the game's UI rules. |
| Are weights disconnected from training? | Current `ai-weights.test.js` checks defaults, live reads, routing, and fallback values. | All seven tests passed in this pass. This validates table wiring, not good tactical decisions. |
| Can the AI loop forever after an action fails? | Per-activation failure memos and loop/stall guards exist (`ai.js:1134–1196`, `5083–5137`). | Preserve these guards. A forced turn-end is a recovery event to diagnose, not successful decision-making. |

### Prioritized findings

**AI-02 — Medium: one movement goal uses obsolete/fallback dimensions.** `advance_to_mid` computes its destination from `state.mapCols || 15` and `state.mapRows || 8` (`ai.js:3267–3274`). Other goals use `bw()`/`bh()`. The reviewed state and map initialization do not populate those state fields. When absent, the destination is (7,4): near the right edge of an 8×8 board and far from the center of a 20×20 board. Its score of 70 can outrank the TDM no-enemy advance score of 60; earlier exploration and other candidates can still win. Replace the dimension source with the established board helpers, then check both spawn orientations. This is a source-confirmed inconsistent coordinate calculation, not an observed report of all units walking to (7,4).

**AI-03 — Medium: waypoint cache identity omits changes that affect traversal.** `findWaypoint()` clears its cache only when the round changes; the key contains unit ID, start X/Y, and goal X/Y (`ai.js:3332–3340`). It does not include board/height/voxel versions, unit elevation, or movement abilities. Terrain spells, blockers, flight/phase changes, or another match at the same round can change the answer while preserving that key. The final movement selection still uses current legal tiles (`3499–3547`), so this is stale planning, not proof of illegal execution. Include the relevant board and traversal identity, or scope the cache to a decision. Test a previously blocked route becoming open and the reverse within one round.

**AI-04 — Medium: an unhandled spell kind can receive positive value without demonstrated benefit.** The generic fallback ends with `if (s <= 0) s = 20` (`ai.js:2796–2811`), despite the redesign's no-floor principle. `scoreSpells()` then subtracts MP cost and admits a remaining positive score (`1887–1901`). This does not mean every unsupported kind will be cast: target discovery and affordability can reject it first. It does mean an unhandled, affordable candidate that reaches this branch may compete as useful with no quantified effect. Record which current kinds reach the fallback before changing behavior. Prefer explicit supported value or an identified unsupported diagnostic over a silent positive floor. Do not set every unknown spell to zero without ensuring required utility actions still have a scorer and executor.

**AI-05 — High: hypothetical move-plus-spell scoring can value a line attack from a position where that line cannot hit.** `jointMoveActionSearch()` includes `line`/`linePush` through `DMG_KINDS`; its hypothetical spell loop checks reach and line of sight, then calls the damage-value helper (`ai.js:166–168`, `2935–2944`, `2967–2974`). It does not apply the eight-ray alignment restriction used by the actual line scorer (`2108–2118`) and target picker (`4573–4592`). `scoreOffensiveHit()` values damage/utility but does not supply that geometric test (`1505–1529`). A destination with an enemy offset by (2,1), for example, may be in range and unobstructed but not on a permitted line.

The actual shot is re-picked after movement, so the existing execution checks can prevent the illegal cast. They cannot refund the movement AP spent pursuing its imaginary value. Share the prospective-origin legality/footprint query with actual targeting, or exclude unsupported kinds from the joint estimate until that query exists. Test an aligned versus unaligned tile with the same range and comparable danger; include a wall, elevation, and a different affordable spell so the planner selects a real follow-up action.

**AI-06 — Medium: late-match urgency is not derived from the selected mode's remaining rounds.** `assessWinCondition()` sets urgency at rounds 15, 25, and 40 (`ai.js:1030–1031`); normal TDM ends at 12 and Arena's safety cap is 100. The reviewed TDM hunt goal considers engagement and target priority, but not the kill-score lead or rounds remaining (`3103–3117`). This is a missing endgame input in these paths, not a proof that the CPU always makes the wrong final-round choice. Use current mode rules and score state to distinguish protecting a lead from seeking a needed kill, while keeping an immediate legal win/denial above generic caution. Evaluate those cases before tuning broad aggression multipliers.

### Decision scenario suite — specified, not simulated

| ID | Setup | Expected decision evidence |
| --- | --- | --- |
| AI-S01 | Arena: team carries two Keys; a third is legally reachable; an optional attack is also available. | Candidate explanation reflects a winning pickup, its legal path, and whether any prior required action prevents it. |
| AI-S02 | Arena: opponent threatens the last required Key or final Nexus zone. | A legal denial is evaluated against ordinary damage; unseen carrier positions are not invented. |
| AI-S03 | TDM: same board/units, first tied then leading/trailing near round 12. | Explanations use remaining rounds and actual scoring; they do not introduce tower/Key objectives. |
| AI-S04 | No visible enemy on 8×8 and 20×20 boards, mirrored starting sides. | Advance goals use current board dimensions and remain in bounds; no fixed (7,4) bias. |
| AI-S05 | Cache a route, then build/remove terrain or change flight within the round. | Recomputed route reflects the change; failure does not reuse a stale negative cache result. |
| AI-S06 | Beam specialist can move to an aligned or unaligned firing tile. | Only positions with a legal follow-up line receive beam value. Record the planned and actual action. |
| AI-S07 | Enemy is concealed; reveal it, then conceal it again without changing its coordinates. | Target and threat sets follow legal information; cached estimates do not retain a forbidden target. |
| AI-S08 | Ally has critical HP, then full HP; enemy has little remaining effective HP. | Healing respects deficit/threat; damage avoids paying for worthless overkill. |
| AI-S09 | Possession, paired placement, revival, or a blocked two-stage action. | Correct controller/target state, one AP-cost contract, and a clean failure memo without a turn loop. |
| AI-S10 | Large legal move set and a full spell loadout. | Record decision time, candidate count, winning score, and runner-up; compare quality before limiting search. |

Capture action and destination scores before/after danger costs, intent reason, legal target count, rejected-action reason, AP/MP before/after, and decision duration. Existing `_aiLastIntent`, debug fallback logging, version stamps, and safety logs provide starting points. Keep diagnostics opt-in and bounded. Do not flood the ordinary player log with score arithmetic.

### Bounded implementation order

1. Correct the board-center source and waypoint invalidation. These are isolated navigation inputs, so validate without retuning combat weights.
2. Make joint move-plus-action estimates respect actual geometry and affordability at the candidate origin. Compare plan versus execution.
3. Inventory fallback scorer use across the 65 current kinds; fill demonstrated scoring/execution gaps, including recent mechanics.
4. Add mode-aware endgame evaluation, then measure candidate search cost and consider bounded pruning.

Update `EW_AI_VERSION` for behavior changes and retain the weight routing tested by `ai-weights.test.js`. Balance exports from different brains must remain distinguishable. P1-versus-CPU play remains required to judge how these changes feel; source correctness alone does not establish smarter play.

### Review

Audit legal information, scoring, target selection, movement, action execution, resource use, and termination. Trace all current spell/status/passive kinds and two-click abilities through both scoring and execution.

Arena: use current win rules, secure the winning Key threshold, protect carriers, deny an imminent enemy win, recover dropped Keys, and weigh other enabled win conditions. Do not assume killing is always best.

TDM: prioritize kill/score rules, safe focus fire, survival, healing, threat ranges, overkill avoidance, respawn timing, and efficient movement. Avoid irrelevant Arena goals.

Both: check unreachable destinations, repeated indecision, wasted AP, friendly fire, blocked movement, summons, possession, fog, and stale cached evaluations. Difficulty should remain understandable and not rely on hidden information.

### Improvement batch

Correct rule/legality errors before tuning weights. Add concise decision explanations and a bounded computation budget where useful. Improve team coordination and move-plus-action evaluation based on specific failed decisions.

### Completion evidence

A scenario suite with expected decisions, legal-action checks, decision-time measurements, and P1-versus-CPU observations when authorized. Do not judge intelligence by win rate alone or substitute auto-simulation for player experience.

## Phase 7 — maps and asset brief

### Source inventory and constraints

Current data generates one 8×8 Δ per 29 full launch-map entries, plus two standalone facility boards marked as Δ. The existing `delta-maps.test.js` passed both checks: Δ house rules and roster correspondence. Its checks cover data geometry such as symmetry, protected spawn/egress/Nexus space, collision declarations, reachability, and alternate routes. They do not render the map, verify every runtime collision, or establish balanced combat. No full-map or rendered-HQ acceptance is implied.

The 29 named `_NR_BUILDERS` cover every `near` key found in the current map metadata. Δ registration injects the `near` builder into its environment; full maps retain their own environment path (`data.js:13404–13439`). The same site scenery is adapted for HQ by `_hqBuildSetting()` (`three-renderer.js:31065–31113`). Site board helpers select the Δ board and translate its terrain/walls/objects (`data.js:18881–18912`). This is a shared system, not a collection of independent screenshots to edit one by one.

**MAP-01 — Medium: a scenery change can alter both battle occlusion and HQ walkability.** HQ converts selected scenery bounds into blockers and drops pieces that conflict with the perimeter, entrance, or console. A wider prop or new placement can change those decisions. Review its battle framing and HQ traversal together, with the site's existing scale and generator. A decorative change is not automatically gameplay-neutral when its bounds create collision.

**MAP-02 — Medium investigation priority: full map, Δ, and HQ are related but different representations.** A `near` improvement on the Δ does not prove the full map is improved, and the HQ adapter intentionally replaces some apron/enclosure work with its shell. Capture all applicable contexts for a chosen site. Mark the intended scope explicitly; do not duplicate scenery in HQ or add a second perimeter because the battle version uses an apron.

**MAP-03 — Medium investigation priority: verify material use before requesting replacement art.** Eight authored HQ tileables already exist in `DOOR_HQ.textures` (`data.js:16734–16743`): terrazzo, hallway stone, oxblood plaster, teal trim, acoustic ceiling, cracked concrete, beige drywall, and taupe carpet. Near scenery also uses existing terrain textures and procedural/model props. Missing visual coherence can come from scale, UV repetition, lighting, incorrect texture binding, or placement. A new texture pack will not fix LOAD-02/03 or a shader error. Start by checking those contracts on one representative room.

### Representative environment audit order

This order maximizes coverage of different rendering and readability problems. It is not a claim that these maps look worse than the others; visual ranking is still pending.

| Site / variant | What it exercises | Specific review target |
| --- | --- | --- |
| `prebuilt_backrooms_delta` and its HQ site | Low interior, repeated wallpaper/carpet, partitions, enclosed light. | Wall/floor seams, repeat scale, near-camera cutaway, corridor readability, and black-material diagnostics. |
| `prebuilt_cern_delta` and its HQ site | Industrial ring, beamlines, metallic surfaces, glow. | Distinguish scenery glow from spell targeting; preserve console/entrance clearance and readable silhouettes. |
| `prebuilt_nuketown_delta` and full map | Built streets, buildings, cover and varied heights. | Door/window scale, believable foundations, cover cues, and cinematic obstruction at corners. |
| `prebuilt_shasta_delta` and full map | Natural slopes, foliage, rock/snow/water transitions. | Surface joins, trees on credible ground, cast-shadow cost, and skyline visibility. |
| `prebuilt_atlantis_delta` and full map | Liquid-heavy setting and architecture. | Water versus walkable floor, reflections/transparency, depth cues, and overlapping VFX. |
| `prebuilt_moon_delta` and full map | Sparse terrain and strong silhouette contrast. | Crater edges, prop scale, landing-site legibility, and excessive clutter introduced by fixes. |
| `prebuilt_flatlands_delta` and its HQ site | Deliberate emptiness. | Preserve negative space and authored atmosphere; do not fill it with generic props to satisfy a density target. |

For each site record: screenshot/camera, map ID, biome/time/weather, mode, render quality, topology warnings, visible material faults, walkable/blocked ambiguity, and frame cost. Rank findings only after seeing them. Keep art judgments separate from reproducible collision/material defects.

### Scoped asset brief — inventory first, no purchases proposed

| Need | First use and acceptance | Existing material to reuse | New asset only if |
| --- | --- | --- | --- |
| Floor-to-wall and terrain transition pieces | Backrooms/CERN seam pilot; no gaps or misleading walkable ledges. | Existing tileables, `_nrRoom`/wall/apron primitives and map edge helpers. | Geometry/UV changes cannot produce the required transition cleanly. Specify module dimensions, pivot, snapping, and collision role. |
| Cohesive surface variation | One room at actual viewing distance; readable material without obvious repeat blocks. | Authored HQ surfaces and current terrain variants. | A matched alternate/decals are needed after UV scale and lighting are correct. Match the palette and texel density. |
| Reusable small props | A specific clearance/readability problem, not general filling of empty space. | Current catalogue and near-builder props. | Inventory lacks the required silhouette/use. Specify size in existing world units, pivot, material slots, shadow behavior, and both-context collision. |
| Natural transition detail | Shasta slope/shore pilot. | Existing tree, rock, mound and surface helpers. | Existing pieces cannot meet the visual target within draw/texture budgets. Favor reuse over unique high-resolution assets. |

Do not assume extra normal/roughness maps help: verify the material path consumes them. Asset dimensions and texture resolutions should be set after the Phase 2 baseline and close-view capture. Each requested asset should include an exact consumer, reusable locations, source/licensing record, and a rendered acceptance comparison. No external pack was researched or recommended in this pass.

### Review

Audit battle boards, near settings, distant scenery, and their HQ site versions together. Evaluate human scale, terrain transitions, structural plausibility, prop placement, lighting direction, material consistency, repetition, collision, and tactical readability.

Start with representative interior, urban, natural, and liquid-heavy environments before expanding across all launch maps. Preserve the stylized voxel language while improving how surfaces meet and objects belong in the space.

### Candidate asset needs — provisional, not a purchase list

- Modular wall, floor, doorway, corner, stair, railing, and trim pieces with consistent scale.
- Cohesive tileable concrete, metal, plaster, brick, stone, soil, and surface-transition textures suited to the existing palette.
- Small decals for wear, dampness, seams, cracks, and site-specific markings.
- A limited set of reusable environment props: lights, pipes, vents, crates, furniture, vegetation, rocks, and edge details, selected per map.
- Matching normal/roughness maps where the current material pipeline supports them and they visibly help.

Inventory existing assets before requesting more. For each actual recommendation, specify the map/use, visual reference, dimensions, pivot/collision needs, material slots, texture channels/resolution, reuse potential, performance budget, and priority. Verify licensing and current availability if recommending a specific external pack. Do not request blanket high-resolution textures.

### Completion evidence

A ranked map audit, one representative improved environment before broad rollout, and a precise asset brief separating reusable essentials from optional detail. Verify sightlines, navigation, camera framing, and performance after dressing changes.

## Phase 8 — complete player and developer experience

### Integrated player journey findings

The highest-confidence UX defects in this review arise at boundaries: a menu consumes battle input, a reconnect banner promises recovery before current state is established, a loading card reports completion despite failed assets, or a camera fit ignores the subjects' vertical extent. Address these before adding more menu pages or effects.

| Journey | Existing behavior / risk | Acceptance evidence |
| --- | --- | --- |
| Title → main menu → HQ/settings | Title flags are reused across front-end screens; PAUSE-05 identifies a controller routing conflict. | All visible controls work by mouse, keyboard, and controller; Confirm in settings does not send the player to the main menu. |
| HQ → console → match setup | Existing suspend/leave and pointer-lock protections must remain intact. | One current canvas/input owner; Back returns to the right room; launch cannot recapture the cursor behind setup. |
| Party/loadout → loading → first turn | LOAD-02/03 and LIFE-04/05 separate readiness, intro, and clock start. | The player sees a usable scene or truthful fallback; no local turn expires before the agreed ready state. |
| Aim → menu → return to aim | PAUSE-04 can change targets under the menu. | Pending target is preserved, focus stays in the menu, and Resume restores the same legal targeting context. |
| Cast → impact → next activation | CAM-02/03/04 and VFX-01/04 concern framing, timing, and legal visibility. | Actor, target, effect, outcome, and return of control are readable on both viewers. |
| Disconnect → rejoin | Socket membership is restored before a guaranteed fresh state application. | Current board and active unit are confirmed; clock suspension/resumption follows the same match's recovery state. |
| Result → HQ/builder → next match | Dedicated dungeon cleanup is present; labels/effects/scanner have different owners. | No old labels, effects, scanner, callbacks, or targeting state appear in the next context. |

**UX-01 — High: modal focus/input ownership needs to be explicit.** PAUSE-04/05 are concrete examples. The pause shell's open/close functions do not establish a keyboard focus trap or restore the prior focused control (`ui.js:6471–6493`, `7505–7512`). Add these at the shared shell and route background shortcuts through the same owner. Test re-rendering tabs/settings: replacing `innerHTML` should leave focus on an equivalent control, not lose it to the document. Treat controller, keyboard, pointer lock, and mouse as consumers of one interaction state.

**UX-02 — Medium: use the existing diagnostics to make failures actionable.** Retain the entry page's diagnostic report, AI intent/failure logs, and render counters, then add scene/match/action identity and a bounded recent-transition trace where needed. A useful report includes build token, browser, scene, mode/map, last transition, failed resource, and whether a fallback was used. Avoid a generic “something went wrong” message that cannot distinguish network, asset, shader, or boot failure. Ordinary player screens should expose the recovery action; detailed diagnostics belong behind a copy/report affordance.

**DEV-01 — Medium: audit coverage must distinguish source-pattern checks from behavior.** The selected weight tests establish wiring; strike tests establish metadata/consumer presence; Δ tests establish generated-data rules. They do not cover mixed-visibility effects, user input under menus, match cancellation, or live shot composition. Add behavior tests at those boundaries for implementation batches. Keep existing tests as guards rather than substituting them for runtime acceptance.

### Prioritized implementation backlog

Severity describes potential player impact; confidence describes evidence. A High source risk is not a claim of a reproduced live bug. Effort is relative scope: Small is one established boundary/helper, Medium crosses a few consumers, Large requires a shared contract across subsystems. No calendar estimate is implied.

| Order / batch | Findings and outcome | Files likely involved | Scope / dependency | Required validation |
| --- | --- | --- | --- | --- |
| 1. Scene handoff | LIFE-02, LOAD-01: retire battle labels and cancel stale HQ card fades. | `three-renderer.js`, `map.js`, HQ logs, `index.html` | Small; locally implemented and tested in this delivery. | Focused ownership/timer checks; syntax/full suite; repeated transition acceptance. |
| 2. Input ownership | PAUSE-04/05/06, UX-01: menu controls cannot mutate the battle or route through the splash. | `state.js`, `ui.js`, `map.js`, `index.html` | Medium; PAUSE-04/05 locally implemented and tested; Battle/editor pause focus is locally implemented and tested; main-menu/HQ Settings keyboard focus is in main; PAUSE-06 is locally implemented; broader input ownership remains. | Target preserved under Tab, controller settings route, focus restore, one Escape action. |
| 3. Reconnect and boot | LIFE-04/05: current match identity, state recovery, clock suspension across activation. | `battle.js`, `online.js`, possibly `server.js`, `index.html` | Large; inspect relays and server event ordering before adding fields. | Both roles; idle and active turn rejoin; before/after intro timeout; forfeit/rematch. |
| 4. Effect lifetime and visibility | LIFE-06, VFX-03/04: retire old effects and filter hidden endpoints correctly. | `three-renderer.js`, `three-vfx-effects.js`, `online.js`, `index.html` | Medium; share scene identity with batch 3 where appropriate. | Long/delayed effects across exit; visible/hidden source and destination; preview isolation. |
| 5. Truthful loading | LOAD-02/03/04: required resource outcomes and usable-frame readiness. | `map.js`, `battle.js`, `three-renderer.js`, `index.html` | Large; pilot one HQ site and battle map. | Cold/warm, failed/slow asset, shader failure, fallback, both-player readiness. |
| 6. Camera fit and beat ownership | CAM-02/03/04: fit actual subjects and prevent competing same-action moves. | `battle.js`, `three-camera.js`, `three-renderer.js`, `online.js` if payload changes, `index.html` | Medium/Large; after lifecycle correctness. | Shot matrix, real bounds, aspect/overlays, mixed elevations, fog, stable return. |
| 7. AI correctness | AI-02/03/05, then AI-04/06: real board coordinates, current routes, achievable follow-up actions. | `ai.js`, relevant existing targeting consumers/tests, `AI_REDESIGN.md`, `index.html` | Medium; separate navigation/legality from tuning. | AI-S04/05/06 first; existing weights; planned versus actual action; version stamp. |
| 8. Shared pause presentation | PAUSE-01/02/03: common shell with truthful context and safe cinematic handling. | `ui.js`, `map.js`, `state.js`, existing styles, `index.html` | Medium; follows input fixes and suspension decisions. | Context table, settings persistence, pointer lock, offline/online semantics. |
| 9. Performance and visual pilot | PERF-01–07, MAP-01–03, VFX-01/02: measured cost reductions and one coherent site/spell-family improvement. | Existing renderer/VFX/map/data files as indicated by measurements; `index.html` | Scope set by baseline; avoid blanket optimization. | Comparable traces, quality captures, topology checks, full/Δ/HQ contexts. |

Every runtime delivery includes complete changed files and a fresh shared cache token in `index.html`. `server.js` and `index.html` go to Render; browser scripts/styles/assets go to R2; tests, plans, and build logs are repository-only. The current delivery changes four browser scripts and the entry-page token, as recorded above, and includes updated HQ logs.

### Validation during the extended source-review pass (before implementation)

- Refreshed main: still `4c740fcf6624a30d59e30c4d4dfea1a16dd85b03`. Preserved the newer local review additions rather than overwriting them with the uploaded document.
- Read additional source for AI, camera, VFX, animation slots, server rejoin, game data, match selection, and entry diagnostics; consulted AI redesign, cinematic, roadmap, launch-readiness, and relevant project/canon instructions.
- Enumerated game data with the existing loader: 501 spell-registry entries, 65 kinds, 60 map-metadata entries, and no unmatched metadata near-builder keys. This does not establish complete handler or asset coverage.
- Ran `ai-weights.test.js`, `anim-strike.test.js`, and `delta-maps.test.js` using the available Node runtime: **11 passed, 0 failed, 1 skipped**. The skipped test requires the absent `rigged_animations/` GLBs. The seven AI checks and two Δ checks passed; two strike metadata/source checks passed.
- Reviewed the document's evidence wording, findings, dependencies, source references, and delivery states. No gameplay files were edited. The full `npm test` suite, browser playtests, AI simulations, FPS captures, network-failure runs, and visual comparisons were not run.

### Remaining evidence and exit criteria

This is now a cross-system source review with bounded implementation work, not a finished runtime audit. REP-01 through REP-06 still need reproduction or matched captures; the pause divergence is source-confirmed, and new input findings have concrete source paths. A phase closes only when its implementation and listed acceptance evidence are complete. Do not mark all eight phases done because each now has a populated section.

Batch 1 and the PAUSE-04/05 portion of batch 2 are now delivered together, with separate regression checks and no shared-menu redesign. Continue batch 2 with held-key/window-capture/pointer ownership and nested-dialog return focus; PAUSE-06 controller page detection/root selection is locally implemented, and both keyboard-focus deliveries are in repository main. Then address reconnect/effect boundaries. Further document-only work should deepen a specific unresolved trace or attach evidence, rather than keep restating the same plan. The most valuable remaining traces are the exact REP-02 element/exit route, full action/scene cancellation ownership, and all current spell kinds' target/scorer/executor correspondence.

### Player review

Follow a first session and a returning-player session: understand the mode, build a party, enter HQ/site, launch, read the opening, take turns, understand spells/objectives, pause, finish, and start again.

Review discoverability, action feedback, invalid-action explanations, loading/error recovery, input consistency, text size/contrast, color dependence, audio controls, pacing, and reduced motion. Check whether visuals obscure legal moves, targets, damage, or the reason for victory/defeat.

### Developer review

Audit scene/state ownership, global dependencies, duplicated rules/settings, asynchronous cancellation, shared asset lifetime, cache versions, host/guest relays, diagnostics, and test blind spots. Prefer bounded changes over a wholesale engine rewrite. Identify which recurring defects need a shared helper or stronger contract within the fixed file structure.

### Completion evidence

A prioritized final backlog with severity, evidence, effort, dependencies, and acceptance criteria; an integrated regression checklist; measured outcomes; remaining limitations; and an honest record of which files were delivered versus verified live.

## Phase update protocol

After each phase:

1. Update its checkbox/status: not started, in progress, reviewed, implemented, validated, or blocked on specific evidence. A checked phase must state what was actually completed.
2. Add findings with ID, severity, source/reproduction evidence, impact, proposed fix, and validation status.
3. Record changed files, tests actually run, runtime checks still pending, and upload destination.
4. Record before/after measurements or captures where relevant.
5. Carry unresolved findings forward by ID, including regressions discovered in earlier work.
6. Reorder remaining work if evidence changes priorities and explain why.
7. End the phase log with the exact next task so the review can resume without rediscovery.

### Phase log

| Date | Phase | Completed work | Validation | Next task |
| --- | --- | --- | --- | --- |
| 2026-09-09 | 0 | Established all eight review areas, dependencies, acceptance criteria, and initial source findings. | Documentation content review; selected source inspection only. No code changes or gameplay tests. | Phase 1: obtain three-renderer.js and battle.js; trace startMatch/loading completion, minimap and nameplate ownership, result/HQ exit paths, and stale asynchronous callbacks. |
| 2026-09-09 | 1 — source review in progress | Pinned the source baseline; obtained renderer/battle files; mapped principal scene owners; added LIFE-02/03/04 and LOAD-02/03, expanded LOAD-01, and defined three fix batches. | Static source and document review only. No game changes, runtime reproduction, or deployment. | Implement and validate the first bounded batch: retire battle labels during deactivation and cancel/identify HQ loading-card callbacks. Refresh source first; read relevant HQ logs before editing and include updated logs in delivery. Continue the minimap/boot caller audit before claiming those symptoms explained. |
| 2026-09-09 | 1 follow-up / 2 preparation | Verified the uploaded review on current main with unchanged game source; traced generic render and dedicated dungeon exits; separated reconnect policy from boot cancellation; added PERF-01–05 and a repeatable capture protocol. | Static source tracing and document content review. No game edits, browser runs, FPS measurements, or deployment. | First code batch remains LIFE-02/LOAD-01. For further document review, resolve dungeon button reachability and reconnect-to-engine timing. Read ROADMAP performance history before optimizations; execute the capture protocol only with playtest authorization. |
| 2026-09-09 | 1 follow-up / 3 preparation | Verified main's latest document upload with unchanged source; resolved normal dungeon result and pause-footer bindings; added LIFE-05 reconnect clock persistence finding; expanded PAUSE-01/02 and added PAUSE-03, menu context contract, and acceptance checks. | Source-path and document review only. No game edits, runtime reproduction, or deployment. | First code batch remains LIFE-02/LOAD-01. Next document pass: inspect server rejoin/state delivery for LIFE-05, then main-menu settings close/HQ resume, controller and Tab routing, and cinematic completion ownership for Phase 3. Keep LIFE-03 conditional until the reported minimap element and exit route are identified. |
| 2026-09-09 | Extended review — all eight areas | Traced server rejoin/heartbeat and effects retirement; confirmed Tab/controller input defects; reviewed model/pair/AoE camera fits and competing beats; traced VFX timing/visibility; resolved standard Arena/TDM rule suspicions; added AI navigation/cache/joint-legality/endgame findings; inventoried generated maps and existing assets; consolidated nine implementation batches. | Data enumeration plus three existing test files: 11 passed, 0 failed, 1 GLB-dependent check skipped. Source and document review; no gameplay changes, full-suite run, browser playtest, simulation, performance capture, or deployment. | Implement batch 1 (LIFE-02/LOAD-01), then batch 2 (PAUSE-04/05 and focus ownership), with complete files and required validation. For continued review, trace full action/scene cancellation and all-kind target/scorer/executor correspondence; attach runtime evidence only when authorized. |
| 2026-09-09 | 1 implementation / 3 input fixes | Implemented LIFE-02, LOAD-01, PAUSE-04 and PAUSE-05 in four existing scripts; added eight regression checks, refreshed the entry token, and updated both HQ logs. Complete-file delivery prepared. | Full package test command: 206 passed, 0 failed, 2 expected skips; all repo JS syntax checks passed. No live/browser, simulation, FPS, or host/guest acceptance. Not uploaded. | Complete UX-01 focus trap/restore and focus after settings re-render in the existing shell. Then reconnect/effect boundaries; keep texture-readiness and camera/AI findings open. |
| 2026-09-09 | 3 / UX-01 pause-focus implementation | Added battle/editor pause focus trap, redraw/tab focus, local shortcut bubbling boundary, Resume restoration, and late-open callback guard in ui.js. Verified the prior delivery is in repository main. | Full suite: 210 passed, 0 failed, 2 expected skips; syntax checks passed. Four new controlled-DOM regression tests; no browser/controller/host-guest acceptance. | Continue main-menu/HQ settings focus and broader input-owner audit; do not mark UX-01 or Phase 3 complete. New delivery remains local. |
| 2026-09-09 | 3 / UX-01 Settings keyboard focus | Implemented Settings focus containment, redraw and launcher restoration, page-exit cleanup and Spell Library return in map.js. Found PAUSE-06 from opacity-hidden page CSS and controller roots. | Full suite: 215 passed, 0 failed, 2 expected skips; syntax checks passed. Five new controlled-DOM tests. No runtime acceptance or deployment. | Fix PAUSE-06, then held-key/window-capture/pointer ownership and nested-dialog return focus. UX-01 and Phase 3 remain open. |

| 2026-09-09 | 3 / PAUSE-06 controller ownership | Required active exposed Settings page, included Back in navigation root, excluded inactive controls and rejected stale activation/adjustment. Prior Settings delivery verified in main. | Full suite: 218 passed, 0 failed, 2 expected skips; syntax passed. Three new controller function regressions; no runtime acceptance or deployment. | Continue held-key/window-capture/pointer ownership and nested-dialog return focus. UX-01 and Phase 3 remain open. |

| 2026-09-10 | 3 / PAUSE-07 board held-key ownership | Added shared board input eligibility, immediate menu-open clearing, editable/visibility/blur clearing and unconditional key release; verified prior controller delivery in main. | Full suite: 222 passed, 0 failed, 2 expected skips; syntax passed. Four production-boundary regressions; no runtime acceptance or deployment. | Trace free-roam/ShooterControls capture and frame consumers across pause/dialog/pointer lock, then nested-dialog return focus. |

| 2026-09-10 | 3 / PAUSE-08 source trace | Verified PAUSE-07 in main; traced Guild Hub/shared walker, shooter capture/frame handlers, retained controller input and pointer-lock reset gaps. Added a bounded fix contract and acceptance checks. | Pinned Git blob hash checks and source/document review only; no runtime edits, tests, playtest or deployment. | Implement PAUSE-08 input handoff and production-boundary regressions, then nested-dialog return focus. |

| 2026-09-10 | 3 / PAUSE-08 implementation | Fixed capture, retained keyboard/pad/action inputs, immediate pause/dialog handoff, pointer-lock release and stale lock grants across Guild Hub and both shooter modes. Three runtime scripts changed; complete files and cache-busted entry prepared. | 232 passed, 0 failed, 2 expected skips (234 total); ten new production-boundary regressions; syntax passed. No browser/device/host-guest acceptance or deployment. | Implement nested-dialog focus return, then LIFE-05 reconnect/state/clock recovery. |

| 2026-09-10 | 6 / AI navigation implementation | Fixed AI-02 center coordinates, AI-03 stale route reuse and edge-wall shortcut, AI-05 impossible beam move value and diagonal reach. Shared beam spine across planner/scorer/target picker; bumped AI stamp and entry token. | 247 passed, 0 failed, 2 existing skips; 15 new regressions (14 fail before fixes); syntax 69/69. No playtest or deployment. | UX-01 nested-dialog focus, then LIFE-05 reconnect recovery; AI-04 fallback inventory and wide-beam targeting remain open. |

| 2026-09-10 | 1 / LIFE-05 first implementation | Persistent reconnect clock ownership, independent cinematic ownership, snapshot pause reapplication and forced host rejoin resend. Preserved refreshed main battle effects. | 267 passed, 0 failed, 2 existing skips; syntax 71/71; 12 new checks pass, 10 fail before fixes. No browser/network acceptance or deployment. | Current-match state-application acknowledgement, stale-session rejection and clock-skew-aware remaining-time recovery. |

## Resume instructions

**Current continuation:** use the mapped wall/chain/beam entry at the top and `ENTROPY_WARS_MAPPED_EFFECT_FIXES.zip`. Continue `_spawnLaserBeam3D` delayed terminus emission, then bespoke/transitive geometry timers and VFX-04. Prior fixes remain preserved; live acceptance remains open.

**Latest continuation:** the LIFE-05 delivery at the top supersedes the older next-step notes below. Use `ENTROPY_WARS_RECONNECT_CLOCK_FIXES.zip`. The next implementation is acknowledged current-match state recovery; persistent clock suspension and forced rejoin resend are implemented and locally validated, not deployed. LIFE-05 remains open.


Phase log addition — 2026-09-10, Phase 3 / UX-01: completed and packaged game-dialog focus containment, redraw retention and launcher restoration, including Settings snapshot and aria-hidden corrections. Full local suite: 255 passed, 0 failed, 2 existing skips; syntax 70/70. No browser run or deployment. Next: LIFE-05 reconnect recovery. The inspected main `map.js` additionally carries an unrelated character appearance field absent from this local test workspace; no `map.js` replacement is included, and its Settings focus helpers are unchanged.

Latest implementation continuation: 2026-09-10 UX-01 game-dialog focus batch above supersedes the older next-step ordering. Complete files are in `ENTROPY_WARS_DIALOG_FOCUS_FIXES.zip`; upload and live acceptance are unverified. Eight dialog regressions pass, including two additional fixes to the unfinished local implementation. Continue with LIFE-05 reconnect/state/clock recovery; keep separate banner/save-load ownership and runtime acceptance open.

Use this file as the review tracker. Read the current conclusions, the relevant findings, and the Phase 8 backlog before work. Refresh the relevant repository files and preserve newer local deliveries. All eight areas now have source-review material; do not restart reconnaissance or deliver another outline of the same phases. Continue with a concrete implementation batch or a named unresolved evidence gap. Preserve finding IDs and evidence distinctions. Do not mark reported bugs fixed based on a plausible source change alone.

Phase log addition — 2026-09-10, Phase 1 / LIFE-05: implemented and packaged the current-generation recovery transaction, duration-based clock transfer, activation-owned timeout/action guards, pause-aware engine boundaries, refreshed-page context, bounded failure and terminal result recovery. Reconnect checks 93/93; full suite 346 passed, 2 unchanged failures, 2 existing skips; syntax 75/75. No deployment or live playtest. See the latest continuation for supported recovery and host-page-loss boundaries. Next implementation: LIFE-06 / VFX-03/04.

Phase log addition — 2026-09-10, Phase 1 / LIFE-06 and Phase 5 / VFX-03: owner-aware battle/preview handoff, lifetime-bound recipe/cue/teleport delays and reentrant ticker retirement implemented. New tests 12/12; full suite 358 passed, 2 previously recorded failures, 2 skips; syntax 76/76. Bespoke callback cleanup and VFX-04 remain open. Complete-file package prepared; not deployed.

Phase log addition — 2026-09-10, LIFE-06/VFX-03: owned disposal for flashback/end-card/psychedelic DOM effects and canvas tint handoff. Nine new tests pass (eight fail before); full suite 367 passed, two unchanged failures, two skips; syntax 77/77. Complete-file delivery prepared, not deployed. Next: bespoke spawn/polling ownership, then VFX-04.

Phase log addition — 2026-09-10, LIFE-06/VFX-03: electric cue/impact and combo head/trail/arrival timers now retire with their effect lifetime. Ten new checks pass (seven fail before); full suite 386 passed, two previously recorded failures, two skips; syntax 79/79. Complete files packaged locally, not deployed. Next: `_fireDescent` callback ownership, remaining bespoke timers, then VFX-04.
